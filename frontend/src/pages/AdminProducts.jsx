import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createProduct,
  deleteProduct,
  getErrorMessage,
  updateProduct,
  uploadImage,
} from '../services/api.js';
import { useProducts } from '../hooks/useProducts.js';
import Alert from '../components/admin/Alert.jsx';
import ProductForm, { FORMULARIO_VAZIO } from '../components/admin/ProductForm.jsx';
import ProductTable from '../components/admin/ProductTable.jsx';
import AdminNav from '../components/admin/AdminNav.jsx';
import { chaveEstoque } from '../components/admin/StockMatrix.jsx';
import { COLUNAS_MEDIDAS } from '../components/admin/MeasuresMatrix.jsx';

const POR_PAGINA = 10;

function validar(valores) {
  const erros = {};
  const preco = Number(valores.preco);
  const peso = Number(valores.peso_gramas);

  if (valores.nome.trim().length < 2) erros.nome = 'Informe o nome (mínimo 2 caracteres).';
  if (!valores.categoria) erros.categoria = 'Selecione a categoria.';
  if (valores.preco === '' || !Number.isFinite(preco) || preco < 0) erros.preco = 'Informe um preço válido.';
  if (valores.peso_gramas === '' || !Number.isInteger(peso) || peso < 1) {
    erros.peso_gramas = 'Informe o peso em gramas (inteiro, mínimo 1).';
  }
  if (valores.preco_promocional !== '') {
    const promo = Number(valores.preco_promocional);
    if (!Number.isFinite(promo) || promo < 0) erros.preco_promocional = 'Informe um preço promocional válido.';
    else if (!erros.preco && promo >= preco) erros.preco_promocional = 'O preço promocional deve ser menor que o preço normal.';
  }
  if (valores.tamanhos.length === 0) erros.tamanhos = 'Selecione ou adicione ao menos um tamanho.';

  const medidaInvalida = Object.values(valores.medidas).some((linha) =>
    Object.values(linha ?? {}).some((v) => String(v).trim() !== '' && !(Number(String(v).replace(',', '.')) >= 0)),
  );
  if (medidaInvalida) erros.medidas = 'As medidas devem ser números (cm), 0 ou mais.';

  const estoqueInvalido = Object.values(valores.estoques).some((v) => {
    const texto = String(v).trim();
    return texto !== '' && (!/^\d+$/.test(texto) || Number(texto) > 1_000_000);
  });
  if (estoqueInvalido) erros.estoques = 'O estoque de cada variação deve ser um número inteiro (0 ou mais).';

  return erros;
}

const paraFormulario = (produto) => ({
  nome: produto.nome,
  descricao: produto.descricao ?? '',
  preco: String(produto.preco),
  preco_promocional: produto.preco_promocional === null ? '' : String(produto.preco_promocional),
  categoria: produto.categoria,
  colecao: produto.colecao?.slug ?? '',
  peso_gramas: String(produto.peso_gramas ?? ''),
  imagens: produto.imagens ?? [],
  medidas: Object.fromEntries(
    (produto.medidas ?? []).map(({ tamanho, ...resto }) => [
      tamanho,
      Object.fromEntries(Object.entries(resto).map(([campo, v]) => [campo, v === null ? '' : String(v)])),
    ]),
  ),
  tamanhos: produto.tamanhos,
  cores: produto.cores,
  estoques: Object.fromEntries(
    (produto.variacoes ?? []).map((v) => [chaveEstoque(v.tamanho, v.cor), String(v.estoque)]),
  ),
});

const montarVariacoes = (valores) => {
  const cores = valores.cores.length > 0 ? valores.cores : [null];
  return valores.tamanhos.flatMap((tamanho) =>
    cores.map((cor) => ({
      tamanho,
      cor,
      estoque: Number(String(valores.estoques[chaveEstoque(tamanho, cor)] ?? '').trim() || 0),
    })),
  );
};

const montarMedidas = (valores) =>
  valores.tamanhos
    .map((tamanho) => {
      const linha = valores.medidas[tamanho] ?? {};
      const item = { tamanho };
      for (const [campo] of COLUNAS_MEDIDAS) {
        const texto = String(linha[campo] ?? '').trim().replace(',', '.');
        item[campo] = texto === '' ? null : Number(texto);
      }
      return item;
    })
    .filter((item) => COLUNAS_MEDIDAS.some(([campo]) => item[campo] !== null));

const paraPayload = (valores) => ({
  nome: valores.nome.trim(),
  descricao: valores.descricao.trim(),
  preco: Number(valores.preco),
  preco_promocional: valores.preco_promocional === '' ? null : Number(valores.preco_promocional),
  categoria: valores.categoria,
  colecao: valores.colecao || null,
  peso_gramas: Number(valores.peso_gramas),
  imagens: valores.imagens,
  medidas: montarMedidas(valores),
  tamanhos: valores.tamanhos,
  cores: valores.cores,
  variacoes: montarVariacoes(valores),
});

export default function AdminProducts() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [pagina, setPagina] = useState(1);
  const params = useMemo(() => ({ q: buscaAplicada, pagina, limite: POR_PAGINA }), [buscaAplicada, pagina]);
  const { products, total, paginas, loading, error: erroLista, reload } = useProducts(params);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaAplicada(busca.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const [valores, setValores] = useState(FORMULARIO_VAZIO);
  const [erros, setErros] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);
  const [alerta, setAlerta] = useState(null); // { tipo: 'sucesso' | 'erro', texto }
  const formularioRef = useRef(null);

  useEffect(() => {
    if (alerta?.tipo !== 'sucesso') return undefined;
    const timer = setTimeout(() => setAlerta(null), 5000);
    return () => clearTimeout(timer);
  }, [alerta]);

  const limparFormulario = useCallback(() => {
    setValores(FORMULARIO_VAZIO);
    setErros({});
    setEditandoId(null);
  }, []);

  const alterarCampo = (nome, valor) => {
    setValores((atuais) => ({ ...atuais, [nome]: valor }));
    setErros((atuais) => {
      if (!atuais[nome]) return atuais;
      const { [nome]: _removido, ...resto } = atuais;
      return resto;
    });
  };

  const aoEnviar = async (evento) => {
    evento.preventDefault();

    const errosLocais = validar(valores);
    setErros(errosLocais);
    if (Object.keys(errosLocais).length > 0) {
      setAlerta({ tipo: 'erro', texto: 'Corrija os campos destacados e tente novamente.' });
      return;
    }

    setSalvando(true);
    setAlerta(null);
    try {
      const payload = paraPayload(valores);
      const salvo = editandoId ? await updateProduct(editandoId, payload) : await createProduct(payload);

      setAlerta({
        tipo: 'sucesso',
        texto: editandoId
          ? `Produto "${salvo.nome}" atualizado com sucesso.`
          : `Produto "${salvo.nome}" cadastrado com sucesso.`,
      });
      limparFormulario();
      reload();
    } catch (erro) {
      const campoDoErro = (campo) =>
        campo.startsWith('variacoes') ? 'estoques' : campo.startsWith('medidas') ? 'medidas' : campo.startsWith('imagens') ? 'imagens' : campo;
      const porCampo = Object.fromEntries((erro.fieldErrors ?? []).map((e) => [campoDoErro(e.campo), e.mensagem]));
      setErros(porCampo);
      setAlerta({ tipo: 'erro', texto: getErrorMessage(erro) });
    } finally {
      setSalvando(false);
    }
  };

  const aoEnviarImagem = async (arquivo) => {
    const rejeitar = (texto) => {
      setAlerta({ tipo: 'erro', texto: `${arquivo.name}: ${texto}` });
      throw new Error(texto);
    };
    if (!/^image\/(jpeg|png|webp|gif)$/.test(arquivo.type)) rejeitar('formato inválido. Envie JPG, PNG, WebP ou GIF.');
    if (arquivo.size > 5 * 1024 * 1024) rejeitar('imagem grande demais (máximo de 5 MB).');

    try {
      const url = await uploadImage(arquivo);
      setAlerta({ tipo: 'sucesso', texto: 'Imagem enviada. Salve o produto para aplicá-la.' });
      return url;
    } catch (erro) {
      setAlerta({ tipo: 'erro', texto: `${arquivo.name}: ${getErrorMessage(erro)}` });
      throw erro;
    }
  };

  const aoEditar = (produto) => {
    setEditandoId(produto.id);
    setValores(paraFormulario(produto));
    setErros({});
    setAlerta(null);
    formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const aoExcluir = async (produto) => {
    if (!window.confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`)) return;

    setExcluindoId(produto.id);
    setAlerta(null);
    try {
      await deleteProduct(produto.id);
      if (editandoId === produto.id) limparFormulario();
      setAlerta({ tipo: 'sucesso', texto: `Produto "${produto.nome}" excluído.` });
      if (products.length === 1 && pagina > 1) setPagina(pagina - 1); // era o último da página
      else reload();
    } catch (erro) {
      setAlerta({ tipo: 'erro', texto: getErrorMessage(erro) });
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <main className="admin">
      <header className="admin-cabecalho">
        <h1>Administração de produtos</h1>
        <p>Cadastre, edite e remova os produtos exibidos na loja.</p>
      </header>

      <AdminNav />

      {alerta && (
        <Alert tipo={alerta.tipo} onFechar={() => setAlerta(null)}>
          {alerta.texto}
        </Alert>
      )}

      <div ref={formularioRef} className="admin-ancora">
        <ProductForm
          valores={valores}
          erros={erros}
          editandoId={editandoId}
          salvando={salvando}
          onChange={alterarCampo}
          onSubmit={aoEnviar}
          onCancelar={limparFormulario}
          onEnviarImagem={aoEnviarImagem}
          onErro={(texto) => setAlerta({ tipo: 'erro', texto })}
        />
      </div>

      <section className="admin-card" aria-labelledby="titulo-lista">
        <h2 id="titulo-lista" className="admin-titulo-card">
          Produtos cadastrados {!loading && !erroLista && <span>({total})</span>}
        </h2>

        <input
          type="search"
          className="admin-input admin-busca"
          placeholder="Buscar pelo nome..."
          aria-label="Buscar produtos pelo nome"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {loading && <p className="admin-estado">Carregando produtos...</p>}

        {erroLista && (
          <div className="admin-estado erro">
            <p>{erroLista}</p>
            <button type="button" className="admin-botao secundario" onClick={reload}>
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !erroLista && products.length === 0 && (
          <p className="admin-estado">
            {buscaAplicada ? 'Nenhum produto encontrado para essa busca.' : 'Nenhum produto cadastrado ainda. Use o formulário acima.'}
          </p>
        )}

        {!loading && !erroLista && products.length > 0 && (
          <ProductTable
            produtos={products}
            editandoId={editandoId}
            excluindoId={excluindoId}
            onEditar={aoEditar}
            onExcluir={aoExcluir}
          />
        )}

        {paginas > 1 && (
          <nav className="admin-paginacao" aria-label="Paginação dos produtos">
            <button type="button" className="admin-botao pequeno secundario" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
              Anterior
            </button>
            <span>
              Página {pagina} de {paginas}
            </span>
            <button type="button" className="admin-botao pequeno secundario" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>
              Próxima
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
