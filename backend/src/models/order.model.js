/**
 * Pedidos. REGRAS QUE VALEM AQUI (e não no navegador):
 *  - o preço de cada item vem do banco, nunca do carrinho enviado pelo cliente;
 *  - o frete é recalculado a partir do endereço, do peso e do subtotal;
 *  - o estoque é conferido e baixado na MESMA transação que cria o pedido, com as linhas de
 *    produto_variacao travadas (SELECT ... FOR UPDATE): dois clientes comprando a última peça
 *    ao mesmo tempo nunca conseguem os dois;
 *  - cancelar devolve o estoque.
 *
 * Dinheiro: contas em CENTAVOS (inteiros) para não acumular erro de ponto flutuante;
 * a API devolve em reais.
 */
import { pool, withTransaction } from '../config/db.js';
import { cotarFrete } from '../services/frete.js';
import { HttpError } from '../utils/httpError.js';
import * as Address from './address.model.js';

const centavos = (reais) => Math.round(reais * 100);
const reais = (valorEmCentavos) => valorEmCentavos / 100;

/** Junta linhas repetidas do mesmo item (ex.: duas vezes a variação 7). */
function mesclar(itens) {
  const porVariacao = new Map();
  for (const { variacao_id: id, quantidade } of itens) {
    porVariacao.set(id, (porVariacao.get(id) ?? 0) + quantidade);
  }
  return [...porVariacao].map(([variacao_id, quantidade]) => ({ variacao_id, quantidade }));
}

/** Dados de produto/tamanho/cor das variações (leitura simples; o ESTOQUE vem da leitura travada). */
async function detalhesDasVariacoes(db, ids) {
  if (ids.length === 0) return new Map();
  const [linhas] = await db.query(
    `SELECT v.id_variacao AS variacao_id, v.estoque, p.id_produto AS produto_id, p.nm_produto AS nome,
            COALESCE(p.preco_promocional, p.preco) AS preco, p.peso_gramas, p.imagem_url, t.sg_tamanho AS tamanho, c.nm_cor AS cor
       FROM produto_variacao v
       JOIN produtos p ON p.id_produto = v.id_produto
       JOIN tamanho t ON t.id_tamanho = v.id_tamanho
       LEFT JOIN cores c ON c.id_cor = v.id_cor
      WHERE v.id_variacao IN (?)`,
    [ids],
  );
  return new Map(linhas.map((linha) => [linha.variacao_id, linha]));
}

// ---------- cotação (sem gravar nada) ----------

/** Confere preço, estoque e frete do carrinho. Serve para a tela mostrar valores REAIS antes de finalizar. */
export async function quote({ itens, uf }) {
  const mesclados = mesclar(itens);
  const detalhes = await detalhesDasVariacoes(pool, mesclados.map((i) => i.variacao_id));

  let subtotal = 0;
  let peso = 0;
  const linhas = mesclados.map(({ variacao_id, quantidade }) => {
    const d = detalhes.get(variacao_id);
    if (!d) return { variacao_id, quantidade, disponivel: false, problema: 'Este item não está mais à venda.' };

    subtotal += centavos(d.preco) * quantidade;
    peso += d.peso_gramas * quantidade;
    const disponivel = quantidade <= d.estoque;
    return {
      variacao_id,
      produto_id: d.produto_id,
      nome: d.nome,
      tamanho: d.tamanho,
      cor: d.cor,
      imagem_url: d.imagem_url,
      preco_unitario: d.preco,
      quantidade,
      estoque: d.estoque,
      disponivel,
      ...(!disponivel && {
        problema: d.estoque === 0 ? 'Esgotado.' : `Só restam ${d.estoque} em estoque.`,
      }),
    };
  });

  const fretes = uf && subtotal > 0 ? cotarFrete({ uf, pesoGramas: peso, subtotalCentavos: subtotal }) : [];
  return {
    itens: linhas,
    subtotal: reais(subtotal),
    peso_total_gramas: peso,
    fretes: fretes.map(({ valor_centavos, ...resto }) => ({ ...resto, valor: reais(valor_centavos) })),
    pode_finalizar: linhas.every((linha) => linha.disponivel),
  };
}

// ---------- leitura de pedidos ----------

async function itensDoPedido(db, id) {
  const [linhas] = await db.query(
    `SELECT id_item_pedido AS id, id_produto AS produto_id, id_variacao AS variacao_id, nm_produto AS nome,
            ds_tamanho AS tamanho, ds_cor AS cor, quantidade, preco_unitario, preco_total
       FROM item_pedidos WHERE id_pedido = ? ORDER BY id_item_pedido`,
    [id],
  );
  return linhas;
}

/** Pedido completo (itens, endereço, pagamento, envio). Retorna null se não existir. */
export async function findById(db, id) {
  const [[pedido]] = await db.query(
    `SELECT pd.id_pedido AS id, pd.id_usuario AS usuario_id, pd.subtotal, pd.valor_frete AS frete, pd.total,
            pd.status_pedido AS status, pd.dt_pedido AS data, pd.id_endereco,
            u.nm_usuario AS cliente_nome, u.ds_email AS cliente_email
       FROM pedido pd LEFT JOIN usuario u ON u.id_usuario = pd.id_usuario
      WHERE pd.id_pedido = ?`,
    [id],
  );
  if (!pedido) return null;

  const [[endereco]] = await db.query(
    `SELECT destinatario, cep, ds_rua AS rua, nmr_casa AS numero, ds_complemento AS complemento,
            nm_bairro AS bairro, nm_cidade AS cidade, uf
       FROM enderecos WHERE id_endereco = ?`,
    [pedido.id_endereco],
  );
  const [[pagamento]] = await db.query(
    `SELECT gateway, metodo, status_pagamento AS status, valor_pagamento AS valor, qt_parcelas AS parcelas
       FROM pagamento WHERE id_pedido = ? ORDER BY id_pagamento LIMIT 1`,
    [id],
  );
  const [[envio]] = await db.query(
    `SELECT nm_transportadora AS transportadora, tp_servico AS servico, data_postagem, data_entrega_prevista
       FROM envios WHERE id_pedido = ? ORDER BY id_envio LIMIT 1`,
    [id],
  );

  const { id_endereco: _e, cliente_nome, cliente_email, ...resto } = pedido;
  return {
    ...resto,
    cliente: { id: pedido.usuario_id, nome: cliente_nome, email: cliente_email },
    endereco: endereco ?? null,
    itens: await itensDoPedido(db, id),
    pagamento: pagamento ?? null,
    envio: envio ?? null,
  };
}

/** Lista resumida. `userId` = só os pedidos desse cliente; null = todos (admin). */
export async function list({ userId, status, pagina, limite }) {
  const filtros = [];
  const valores = [];
  if (userId != null) { filtros.push('pd.id_usuario = ?'); valores.push(userId); }
  if (status) { filtros.push('pd.status_pedido = ?'); valores.push(status); }
  const onde = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM pedido pd ${onde}`, valores);
  const [pedidos] = await pool.query(
    `SELECT pd.id_pedido AS id, pd.status_pedido AS status, pd.total, pd.dt_pedido AS data,
            u.nm_usuario AS cliente_nome, u.ds_email AS cliente_email,
            (SELECT pg.metodo FROM pagamento pg WHERE pg.id_pedido = pd.id_pedido ORDER BY pg.id_pagamento LIMIT 1) AS metodo,
            (SELECT pg.status_pagamento FROM pagamento pg WHERE pg.id_pedido = pd.id_pedido ORDER BY pg.id_pagamento LIMIT 1) AS status_pagamento,
            (SELECT COALESCE(SUM(i.quantidade), 0) FROM item_pedidos i WHERE i.id_pedido = pd.id_pedido) AS quantidade_itens
       FROM pedido pd LEFT JOIN usuario u ON u.id_usuario = pd.id_usuario
      ${onde}
      ORDER BY pd.id_pedido DESC
      LIMIT ? OFFSET ?`,
    [...valores, limite, (pagina - 1) * limite],
  );
  return { pedidos: pedidos.map((p) => ({ ...p, quantidade_itens: Number(p.quantidade_itens) })), total, pagina, limite };
}

// ---------- criação ----------

export function create(userId, { itens, endereco_id, frete_servico, metodo_pagamento }) {
  return withTransaction(async (db) => {
    const endereco = await Address.findOwned(db, userId, endereco_id);
    if (!endereco) throw new HttpError(400, 'Endereço de entrega não encontrado.');

    const mesclados = mesclar(itens);
    const ids = mesclados.map((item) => item.variacao_id).sort((a, b) => a - b);

    // 1) TRAVA as linhas de estoque (sempre em ordem de id, para duas compras não travarem uma à outra).
    const [travadas] = await db.query(
      'SELECT id_variacao AS id, estoque FROM produto_variacao WHERE id_variacao IN (?) ORDER BY id_variacao FOR UPDATE',
      [ids],
    );
    const estoque = new Map(travadas.map((linha) => [linha.id, linha.estoque]));
    const detalhes = await detalhesDasVariacoes(db, ids);

    // 2) confere tudo antes de mexer em qualquer coisa
    const problemas = [];
    for (const { variacao_id, quantidade } of mesclados) {
      const d = detalhes.get(variacao_id);
      if (!d || !estoque.has(variacao_id)) {
        problemas.push({ variacao_id, mensagem: 'Um item do carrinho não está mais à venda.' });
      } else if (quantidade > estoque.get(variacao_id)) {
        const restam = estoque.get(variacao_id);
        problemas.push({
          variacao_id,
          disponivel: restam,
          mensagem: restam === 0 ? `${d.nome} (${d.tamanho}) esgotou.` : `${d.nome} (${d.tamanho}): só restam ${restam}.`,
        });
      }
    }
    if (problemas.length) throw new HttpError(409, 'Alguns itens do carrinho não têm estoque suficiente.', problemas);

    // 3) preço e frete calculados aqui
    let subtotal = 0;
    let peso = 0;
    for (const { variacao_id, quantidade } of mesclados) {
      const d = detalhes.get(variacao_id);
      subtotal += centavos(d.preco) * quantidade;
      peso += d.peso_gramas * quantidade;
    }
    const opcao = cotarFrete({ uf: endereco.uf, pesoGramas: peso, subtotalCentavos: subtotal }).find(
      (o) => o.servico === frete_servico,
    );
    if (!opcao) throw new HttpError(400, 'Não entregamos nesse estado com a forma de entrega escolhida.');
    const total = subtotal + opcao.valor_centavos;

    // 4) baixa o estoque (a condição estoque >= qtd é uma segunda barreira, além da trava)
    for (const { variacao_id, quantidade } of mesclados) {
      const [r] = await db.query(
        'UPDATE produto_variacao SET estoque = estoque - ? WHERE id_variacao = ? AND estoque >= ?',
        [quantidade, variacao_id, quantidade],
      );
      if (r.affectedRows !== 1) throw new HttpError(409, 'O estoque mudou durante a compra. Revise o carrinho.');
    }

    // 5) grava o pedido
    const [pedido] = await db.query(
      `INSERT INTO pedido (id_usuario, id_endereco, subtotal, valor_frete, total, status_pedido)
       VALUES (?, ?, ?, ?, ?, 'Pendente')`,
      [userId, endereco_id, reais(subtotal), reais(opcao.valor_centavos), reais(total)],
    );
    const pedidoId = pedido.insertId;

    await db.query(
      `INSERT INTO item_pedidos
         (id_pedido, id_produto, quantidade, preco_total, id_variacao, nm_produto, ds_tamanho, ds_cor, preco_unitario)
       VALUES ?`,
      [
        mesclados.map(({ variacao_id, quantidade }) => {
          const d = detalhes.get(variacao_id);
          return [pedidoId, d.produto_id, quantidade, reais(centavos(d.preco) * quantidade), variacao_id, d.nome, d.tamanho, d.cor, d.preco];
        }),
      ],
    );

    // Sem gateway integrado: o pagamento nasce "pendente" e o admin confirma (veja README).
    await db.query(
      `INSERT INTO pagamento (id_pedido, gateway, metodo, status_pagamento, valor_pagamento, qt_parcelas)
       VALUES (?, 'manual', ?, 'pendente', ?, 1)`,
      [pedidoId, metodo_pagamento, reais(total)],
    );
    await db.query(
      `INSERT INTO envios (id_pedido, nm_transportadora, tp_servico, data_entrega_prevista)
       VALUES (?, 'A definir', ?, DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
      [pedidoId, opcao.nome, opcao.prazo_dias],
    );

    return findById(db, pedidoId);
  });
}

// ---------- mudança de status ----------

const TRANSICOES = {
  Pendente: ['Pago', 'Cancelado'],
  Pago: ['Enviado', 'Cancelado'],
  Enviado: ['Entregue'],
  Entregue: [],
  Cancelado: [],
};

/**
 * Muda o status respeitando o fluxo Pendente → Pago → Enviado → Entregue (ou Cancelado).
 * `donoId`: quando informado (cliente cancelando), só vale para pedido do próprio cliente e só enquanto Pendente.
 * Retorna o pedido atualizado, ou null se não existir (ou não for do cliente).
 */
export function changeStatus(id, novoStatus, { donoId, transportadora = null } = {}) {
  return withTransaction(async (db) => {
    const [[pedido]] = await db.query(
      'SELECT id_pedido, id_usuario, status_pedido AS status FROM pedido WHERE id_pedido = ? FOR UPDATE',
      [id],
    );
    if (!pedido || (donoId != null && pedido.id_usuario !== donoId)) return null;

    if (donoId != null && !(novoStatus === 'Cancelado' && pedido.status === 'Pendente')) {
      throw new HttpError(409, 'Só é possível cancelar pedidos que ainda não foram pagos. Fale com a loja.');
    }
    if (!TRANSICOES[pedido.status].includes(novoStatus)) {
      throw new HttpError(409, `Não é possível mudar um pedido "${pedido.status}" para "${novoStatus}".`);
    }

    if (novoStatus === 'Pago') {
      await db.query("UPDATE pagamento SET status_pagamento = 'aprovado', dt_pagamento = NOW() WHERE id_pedido = ?", [id]);
    } else if (novoStatus === 'Enviado') {
      await db.query('UPDATE envios SET data_postagem = CURDATE(), nm_transportadora = COALESCE(?, nm_transportadora) WHERE id_pedido = ?', [transportadora, id]);
    } else if (novoStatus === 'Cancelado') {
      // devolve o estoque (em ordem de id, como na compra)
      const [itens] = await db.query(
        `SELECT id_variacao AS id, SUM(quantidade) AS quantidade FROM item_pedidos
          WHERE id_pedido = ? AND id_variacao IS NOT NULL GROUP BY id_variacao ORDER BY id_variacao`,
        [id],
      );
      for (const item of itens) {
        await db.query('UPDATE produto_variacao SET estoque = estoque + ? WHERE id_variacao = ?', [Number(item.quantidade), item.id]);
      }
      await db.query('UPDATE pagamento SET status_pagamento = ? WHERE id_pedido = ?', [
        pedido.status === 'Pago' ? 'estornado' : 'recusado',
        id,
      ]);
    }

    await db.query('UPDATE pedido SET status_pedido = ? WHERE id_pedido = ?', [novoStatus, id]);
    return findById(db, id);
  });
}
