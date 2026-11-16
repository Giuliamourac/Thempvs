import { useCatalogo } from '../../context/CatalogContext.jsx';
import { formatarMoeda } from '../../utils/format.js';
import ProductImage from '../ProductImage.jsx';

const semEstoque = (produto) => (produto.variacoes ?? []).filter((v) => v.estoque === 0).length;

/** "Branco P: 0 · M: 3 · G: 1" — disponibilidade de cada variação (tamanho x cor). */
const resumoDasVariacoes = (produto) =>
  (produto.variacoes ?? []).map((v) => `${v.cor ? `${v.cor} ` : ''}${v.tamanho}: ${v.estoque}`).join(' · ');

export default function ProductTable({ produtos, editandoId, excluindoId, alternandoId, onEditar, onExcluir, onAlternarAtivo }) {
  const { nomeDaCategoria } = useCatalogo();

  return (
    <div className="admin-tabela-wrap">
      <table className="admin-tabela">
        <thead>
          <tr>
            <th>ID</th>
            <th>Imagem</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Tamanhos</th>
            <th>Cores</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => {
            const ativo = produto.ativo !== false;
            return (
              <tr key={produto.id} className={produto.id === editandoId ? 'editando' : undefined}>
                <td>{produto.id}</td>
                <td>
                  <div className="admin-miniatura">
                    <ProductImage src={produto.imagem_url} alt="" />
                  </div>
                </td>
                <td className="admin-celula-nome">{produto.nome}</td>
                <td>{nomeDaCategoria(produto.categoria)}</td>
                <td>
                  {produto.preco_promocional !== null ? (
                    <>
                      <s>{formatarMoeda(produto.preco)}</s> <strong>{formatarMoeda(produto.preco_final)}</strong>
                    </>
                  ) : (
                    formatarMoeda(produto.preco)
                  )}
                </td>
                <td className={produto.estoque === 0 ? 'admin-esgotado' : undefined}>
                  {produto.estoque === 0 ? 'Esgotado' : produto.estoque}
                  {produto.estoque === 0 && produto.variacoes?.length > 0 && (
                    <small className="pedido-variacao">Informe o estoque real</small>
                  )}
                  {produto.estoque > 0 && semEstoque(produto) > 0 && (
                    <small className="pedido-variacao">{semEstoque(produto)} variação(ões) esgotada(s)</small>
                  )}
                  <small className="pedido-variacao">{resumoDasVariacoes(produto)}</small>
                </td>
                <td>{produto.tamanhos.join(', ')}</td>
                <td>{produto.cores.join(', ') || '—'}</td>
                <td className={ativo ? undefined : 'admin-esgotado'}>{ativo ? 'Ativo' : 'Inativo'}</td>
                <td>
                  <div className="admin-acoes-linha">
                    <button
                      type="button"
                      className="admin-botao pequeno secundario"
                      onClick={() => onEditar(produto)}
                      aria-label={`Editar ${produto.nome}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="admin-botao pequeno secundario"
                      disabled={alternandoId === produto.id}
                      onClick={() => onAlternarAtivo(produto)}
                      aria-label={`${ativo ? 'Desativar' : 'Ativar'} ${produto.nome}`}
                    >
                      {alternandoId === produto.id ? '...' : ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      className="admin-botao pequeno perigo"
                      disabled={excluindoId === produto.id}
                      onClick={() => onExcluir(produto)}
                      aria-label={`Excluir ${produto.nome}`}
                    >
                      {excluindoId === produto.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
