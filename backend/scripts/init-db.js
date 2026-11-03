/**
 * Cria/atualiza o banco — sem precisar do cliente `mysql` e SEM inserir dados de exemplo.
 *
 *   npm run db:init
 *
 * Seguro para rodar quantas vezes quiser: nunca apaga linhas.
 *   1. aplica database/schema.sql (todas as tabelas são CREATE TABLE IF NOT EXISTS);
 *   2. nas tabelas que já existiam de versões anteriores, aplica os AJUSTES do schema
 *      (colunas/chaves novas) — o MySQL não tem "ADD COLUMN IF NOT EXISTS", então
 *      conferimos no information_schema antes;
 *   3. move o estoque antigo (produtos.estoque) para produto_variacao e remove a coluna.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const schemaPath = fileURLToPath(new URL('../database/schema.sql', import.meta.url));

// Conecta sem banco selecionado: o schema.sql cria o banco (CREATE DATABASE) e faz USE.
const { database: _ignored, ...serverConfig } = env.db;
const connection = await mysql
  .createConnection({ ...serverConfig, multipleStatements: true, charset: 'utf8mb4' })
  .catch((error) => {
    console.error(`Não foi possível conectar ao MySQL (${error.code ?? error.message}). Confira backend/.env.`);
    process.exit(1);
  });

// ---------- helpers de migração ----------

const colunas = async (tabela) => {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME AS nome, CHARACTER_MAXIMUM_LENGTH AS tamanho
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [env.db.database, tabela],
  );
  return new Map(rows.map((r) => [r.nome, r.tamanho]));
};

async function adicionarColunaSeFaltar(tabela, coluna, definicao) {
  if ((await colunas(tabela)).has(coluna)) return;
  await connection.query(`ALTER TABLE ?? ADD COLUMN ?? ${definicao}`, [tabela, coluna]);
  console.log(`${tabela}: coluna ${coluna} adicionada.`);
}

async function adicionarFkSeFaltar(tabela, nome, definicao) {
  const [[existe]] = await connection.query(
    `SELECT COUNT(*) AS total FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [env.db.database, tabela, nome],
  );
  if (existe.total > 0) return;
  await connection.query(`ALTER TABLE ?? ADD CONSTRAINT ?? ${definicao}`, [tabela, nome]);
  console.log(`${tabela}: chave estrangeira ${nome} criada.`);
}

/** Estoque antigo (um número por produto) -> uma linha em produto_variacao por tamanho x cor. */
async function migrarEstoqueAntigo() {
  if (!(await colunas('produtos')).has('estoque')) return;

  await connection.beginTransaction();
  try {
    // Cria as variações que faltam (tamanhos x cores já cadastrados), todas com estoque 0...
    const [criadas] = await connection.query(
      `INSERT INTO produto_variacao (id_produto, id_tamanho, id_cor, estoque)
       SELECT pt.id_produto, pt.id_tamanho, pc.id_cor, 0
         FROM produto_tamanho pt
         LEFT JOIN produto_cor pc ON pc.id_produto = pt.id_produto
        WHERE NOT EXISTS (SELECT 1 FROM produto_variacao v WHERE v.id_produto = pt.id_produto)`,
    );

    // ...e põe o estoque total antigo na primeira variação (o painel permite redistribuir).
    const [comEstoque] = await connection.query('SELECT id_produto, estoque FROM produtos WHERE estoque > 0');
    let semVariacao = 0;
    for (const { id_produto: produto, estoque } of comEstoque) {
      const [[primeira]] = await connection.query(
        `SELECT v.id_variacao AS id
           FROM produto_variacao v
           JOIN produto_tamanho pt ON pt.id_produto = v.id_produto AND pt.id_tamanho = v.id_tamanho
           LEFT JOIN produto_cor pc ON pc.id_produto = v.id_produto AND pc.id_cor = v.id_cor
          WHERE v.id_produto = ?
          ORDER BY pt.ordem, pc.ordem
          LIMIT 1`,
        [produto],
      );
      if (!primeira) {
        semVariacao += 1;
        continue;
      }
      await connection.query(
        'UPDATE produto_variacao SET estoque = ? WHERE id_variacao = ? AND estoque = 0',
        [estoque, primeira.id],
      );
    }
    await connection.commit();
    if (criadas.affectedRows) console.log(`produto_variacao: ${criadas.affectedRows} variação(ões) criada(s) a partir do estoque antigo.`);

    if (semVariacao > 0) {
      console.warn(
        `AVISO: ${semVariacao} produto(s) têm estoque mas nenhum tamanho cadastrado; ` +
          'a coluna produtos.estoque foi MANTIDA. Edite esses produtos no painel e rode db:init de novo.',
      );
      return;
    }
    await connection.query('ALTER TABLE produtos DROP COLUMN estoque');
    console.log('produtos: coluna estoque removida (agora o estoque fica em produto_variacao).');
  } catch (erro) {
    await connection.rollback();
    throw erro;
  }
}

try {
  // O banco vem do DB_NAME do .env: ignora o CREATE DATABASE / USE fixos do arquivo
  // (que dizem "thempvs") para o script valer também com outro nome de banco.
  const comandos = (await readFile(schemaPath, 'utf8'))
    .split('\n')
    .filter((linha) => !/^\s*(CREATE\s+DATABASE|USE)\b/i.test(linha))
    .join('\n');
  await connection.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4', [env.db.database]);
  await connection.query('USE ??', [env.db.database]);
  try {
    await connection.query(comandos);
  } catch (erro) {
    console.error(`\nERRO ao criar as tabelas: ${erro.code ?? ''} ${erro.sqlMessage ?? erro.message}`);
    console.error('As tabelas seguintes a esta NÃO foram criadas. Corrija o problema e rode "npm run db:init" de novo.');
    process.exitCode = 1;
    throw erro;
  }
  console.log(`Schema aplicado no banco "${env.db.database}".`);

  // AJUSTE 1 — tamanho.sg_tamanho era VARCHAR(5)
  if (((await colunas('tamanho')).get('sg_tamanho') ?? 30) < 30) {
    await connection.query('ALTER TABLE tamanho MODIFY sg_tamanho VARCHAR(30) NOT NULL');
    console.log('tamanho: sg_tamanho ampliado para VARCHAR(30).');
  }

  // AJUSTE 2
  await adicionarColunaSeFaltar('produtos', 'imagem_url', 'VARCHAR(500) NULL');

  // AJUSTE 5
  await adicionarColunaSeFaltar('pedido', 'dt_pedido', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  // AJUSTE 6
  await adicionarColunaSeFaltar('item_pedidos', 'id_variacao', 'INT NULL');
  await adicionarColunaSeFaltar('item_pedidos', 'nm_produto', 'VARCHAR(150) NULL');
  await adicionarColunaSeFaltar('item_pedidos', 'ds_tamanho', 'VARCHAR(30) NULL');
  await adicionarColunaSeFaltar('item_pedidos', 'ds_cor', 'VARCHAR(30) NULL');
  await adicionarColunaSeFaltar('item_pedidos', 'preco_unitario', 'DECIMAL(10,2) NULL');
  await adicionarFkSeFaltar(
    'item_pedidos',
    'FK_item_pedido_variacao',
    'FOREIGN KEY (id_variacao) REFERENCES produto_variacao(id_variacao) ON DELETE SET NULL',
  );

  // AJUSTE 9 — medidas_produto sem chave primária (versões antigas) ganha id_medida
  if (!(await colunas('medidas_produto')).has('id_medida')) {
    await connection.query('ALTER TABLE medidas_produto ADD COLUMN id_medida INT AUTO_INCREMENT PRIMARY KEY FIRST');
    console.log('medidas_produto: chave primária id_medida adicionada.');
  }

  // AJUSTE 8
  await adicionarColunaSeFaltar('medidas_produto', 'id_tamanho', 'INT NULL');
  await adicionarFkSeFaltar(
    'medidas_produto',
    'FK_medidas_tamanho',
    'FOREIGN KEY (id_tamanho) REFERENCES tamanho(id_tamanho)',
  );

  // AJUSTE 4 (dados)
  await migrarEstoqueAntigo();

  // AJUSTE 7 (dados): a imagem única antiga vira a primeira da galeria
  const [migradas] = await connection.query(
    `INSERT INTO produto_imagem (id_produto, url, ordem)
     SELECT p.id_produto, p.imagem_url, 0 FROM produtos p
      WHERE p.imagem_url IS NOT NULL AND p.imagem_url <> ''
        AND NOT EXISTS (SELECT 1 FROM produto_imagem i WHERE i.id_produto = p.id_produto)`,
  );
  if (migradas.affectedRows) console.log(`produto_imagem: ${migradas.affectedRows} imagem(ns) antiga(s) migrada(s) para a galeria.`);

  const [[{ total }]] = await connection.query('SELECT COUNT(*) AS total FROM produtos');
  console.log(`Pronto. A tabela produtos tem ${total} registro(s).`);
} finally {
  await connection.end();
}
