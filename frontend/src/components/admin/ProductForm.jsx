import { CORES_PADRAO, TAMANHOS_PADRAO } from '../../constants/catalog.js';
import { useCatalogo } from '../../context/CatalogContext.jsx';
import ChipSelector from './ChipSelector.jsx';
import ImageGallery from './ImageGallery.jsx';
import MeasuresMatrix from './MeasuresMatrix.jsx';
import SelectWithCreate from './SelectWithCreate.jsx';
import StockMatrix from './StockMatrix.jsx';

export const FORMULARIO_VAZIO = {
  nome: '',
  ativo: true, // à venda na loja
  descricao: '',
  preco: '',
  preco_promocional: '',
  categoria: '',
  colecao: '',
  peso_gramas: '',
  imagens: [], // fotos gerais (URLs); a primeira é a capa
  imagens_por_cor: {}, // { Cor: [URLs] } fotos de cada cor
  medidas: {}, // { P: { busto_cm: '50', ... } }
  tamanhos: [],
  cores: [],
  estoques: {}, // { 'P|Preto': '5' } — estoque de cada combinação tamanho x cor
};

function Campo({ id, label, erro, obrigatorio, children }) {
  return (
    <div className="admin-campo">
      <label className="admin-rotulo" htmlFor={id}>
        {label}
        {obrigatorio && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {erro && (
        <p className="admin-erro-campo" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

/**
 * Formulário de cadastro/edição. É controlado pelo pai (AdminProducts):
 * `valores` = estado atual, `erros` = { campo: mensagem }.
 */
export default function ProductForm({
  valores,
  erros,
  editandoId,
  salvando,
  onChange,
  onSubmit,
  onCancelar,
  onEnviarImagem,
  onErro,
}) {
  const { categorias, colecoes, criarCategoria, criarColecao } = useCatalogo();

  const campo = (nome) => ({
    value: valores[nome],
    onChange: (e) => onChange(nome, e.target.value),
    'aria-invalid': erros[nome] ? 'true' : undefined,
  });

  const estoqueTotal = Object.values(valores.estoques).reduce((soma, v) => soma + (Number(v) || 0), 0);

  const classe = (nome) => `admin-input${erros[nome] ? ' invalido' : ''}`;

  return (
    <form className="admin-card" onSubmit={onSubmit} noValidate aria-labelledby="titulo-form">
      <h2 id="titulo-form" className="admin-titulo-card">
        {editandoId ? `Editando produto #${editandoId}` : 'Novo produto'}
      </h2>

      <div className="admin-grade">
        <Campo id="adm-nome" label="Nome" erro={erros.nome} obrigatorio>
          <input id="adm-nome" type="text" maxLength={150} className={classe('nome')} {...campo('nome')} />
        </Campo>

        <Campo id="adm-categoria" label="Categoria" erro={erros.categoria} obrigatorio>
          <SelectWithCreate
            id="adm-categoria"
            className={classe('categoria')}
            opcoes={categorias}
            onCriar={criarCategoria}
            vazio="Selecione..."
            rotuloCriar="Criar nova categoria"
            value={valores.categoria}
            onChange={(slug) => onChange('categoria', slug)}
            aria-invalid={erros.categoria ? 'true' : undefined}
          />
        </Campo>

        <Campo id="adm-preco" label="Preço (R$)" erro={erros.preco} obrigatorio>
          <input
            id="adm-preco"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            className={classe('preco')}
            {...campo('preco')}
          />
        </Campo>

        <Campo id="adm-promo" label="Preço promocional (R$)" erro={erros.preco_promocional}>
          <input
            id="adm-promo"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Vazio = sem promoção"
            className={classe('preco_promocional')}
            {...campo('preco_promocional')}
          />
        </Campo>

        <Campo id="adm-colecao" label="Coleção" erro={erros.colecao}>
          <SelectWithCreate
            id="adm-colecao"
            className={classe('colecao')}
            opcoes={colecoes}
            onCriar={criarColecao}
            vazio="Nenhuma"
            rotuloCriar="Criar nova coleção"
            value={valores.colecao}
            onChange={(slug) => onChange('colecao', slug)}
          />
        </Campo>

        <Campo id="adm-peso" label="Peso (gramas)" erro={erros.peso_gramas} obrigatorio>
          <input
            id="adm-peso"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            placeholder="Ex.: 300"
            className={classe('peso_gramas')}
            {...campo('peso_gramas')}
          />
        </Campo>

        <div className="admin-linha-cheia">
          <label className="admin-checkbox">
            <input type="checkbox" checked={valores.ativo} onChange={(e) => onChange('ativo', e.target.checked)} />
            <span>
              Produto ativo na loja <small>(desmarcado: some da vitrine e não pode ser comprado)</small>
            </span>
          </label>
        </div>

        <div className="admin-linha-cheia">
          <ImageGallery
            titulo={valores.cores.length > 0 ? 'Fotos gerais (usadas quando a cor não tem foto própria)' : 'Imagens'}
            imagens={valores.imagens}
            onChange={(lista) => onChange('imagens', lista)}
            onEnviar={onEnviarImagem}
            onErro={onErro}
            erro={erros.imagens}
          />
        </div>

        <div className="admin-linha-cheia">
          <Campo id="adm-descricao" label="Descrição" erro={erros.descricao}>
            <textarea
              id="adm-descricao"
              rows={3}
              maxLength={5000}
              className={classe('descricao')}
              {...campo('descricao')}
            />
          </Campo>
        </div>

        <div className="admin-linha-cheia">
          <ChipSelector
            id="adm-tamanhos"
            label="Tamanhos disponíveis *"
            sugestoes={TAMANHOS_PADRAO}
            value={valores.tamanhos}
            onChange={(lista) => onChange('tamanhos', lista)}
            error={erros.tamanhos}
            placeholder="Outro tamanho (ex.: XG)"
          />
        </div>

        <div className="admin-linha-cheia">
          <ChipSelector
            id="adm-cores"
            label="Cores"
            sugestoes={CORES_PADRAO}
            value={valores.cores}
            onChange={(lista) => onChange('cores', lista)}
            error={erros.cores}
            placeholder="Outra cor (ex.: Vinho)"
          />
        </div>

        {valores.cores.map((cor) => (
          <div className="admin-linha-cheia" key={`fotos-${cor}`}>
            <ImageGallery
              titulo={`Fotos da cor ${cor}`}
              idRotulo={`adm-galeria-${cor.replace(/\W+/g, '-')}`}
              mostrarCapa={false}
              imagens={valores.imagens_por_cor?.[cor] ?? []}
              onChange={(lista) => onChange('imagens_por_cor', { ...valores.imagens_por_cor, [cor]: lista })}
              onEnviar={onEnviarImagem}
              onErro={onErro}
            />
          </div>
        ))}

        {Object.keys(valores.estoques).length > 0 && estoqueTotal === 0 && (
          <div className="admin-linha-cheia">
            <p className="admin-aviso-estoque" role="note">
              <strong>Estoque pendente:</strong> todas as variações estão com 0. Informe as quantidades reais abaixo — enquanto
              estiver tudo zerado, o produto aparece como &quot;Esgotado&quot; e não pode ser comprado.
            </p>
          </div>
        )}

        <div className="admin-linha-cheia">
          <StockMatrix
            tamanhos={valores.tamanhos}
            cores={valores.cores}
            estoques={valores.estoques}
            error={erros.estoques}
            onChange={(chave, valor) => onChange('estoques', { ...valores.estoques, [chave]: valor })}
          />
        </div>

        <div className="admin-linha-cheia">
          <MeasuresMatrix
            tamanhos={valores.tamanhos}
            medidas={valores.medidas}
            error={erros.medidas}
            onChange={(tamanho, linha) => onChange('medidas', { ...valores.medidas, [tamanho]: linha })}
          />
        </div>
      </div>

      <div className="admin-acoes-form">
        <button type="submit" className="admin-botao" disabled={salvando}>
          {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar produto'}
        </button>
        {editandoId && (
          <button type="button" className="admin-botao secundario" onClick={onCancelar} disabled={salvando}>
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}
