import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { getErrorMessage, getOrders, isCancel } from '../services/api.js';
import { formatarData, formatarMoeda } from '../utils/format.js';
import { NOMES_METODOS, ROTULO_PAGAMENTO, ROTULO_STATUS, STATUS_PEDIDO } from '../utils/orders.js';

const POR_PAGINA = 20;

export default function AdminOrders() {
  const [status, setStatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState({ carregando: true, dados: null, erro: '' });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setEstado((atual) => ({ ...atual, carregando: true, erro: '' }));
    getOrders({ todos: true, status: status || undefined, pagina, limite: POR_PAGINA }, { signal: controller.signal })
      .then((dados) => setEstado({ carregando: false, dados, erro: '' }))
      .catch((e) => {
        if (!isCancel(e)) setEstado({ carregando: false, dados: null, erro: getErrorMessage(e) });
      });
    return () => controller.abort();
  }, [status, pagina, versao]);

  const dados = estado.dados;
  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / POR_PAGINA)) : 1;

  return (
    <main className="admin">
      <header className="admin-cabecalho">
        <h1>Administração de pedidos</h1>
        <p>Acompanhe os pedidos, confirme pagamentos e registre envios.</p>
      </header>

      <AdminNav />

      <section className="admin-card" aria-labelledby="titulo-pedidos">
        <div className="admin-filtros">
          <h2 id="titulo-pedidos" className="admin-titulo-card">
            Pedidos {dados && <span>({dados.total})</span>}
          </h2>
          <label className="admin-filtro">
            Status
            <select
              className="admin-input"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagina(1);
              }}
            >
              <option value="">Todos</option>
              {STATUS_PEDIDO.map((s) => (
                <option key={s} value={s}>
                  {ROTULO_STATUS[s]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="admin-botao pequeno secundario" onClick={() => setVersao((v) => v + 1)}>
            Atualizar
          </button>
        </div>

        {estado.carregando && !dados && <p className="admin-estado">Carregando pedidos...</p>}
        {estado.erro && <p className="admin-estado erro">{estado.erro}</p>}
        {dados && dados.pedidos.length === 0 && <p className="admin-estado">Nenhum pedido encontrado.</p>}

        {dados && dados.pedidos.length > 0 && (
          <div className="admin-tabela-wrap">
            <table className="admin-tabela">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dados.pedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>
                      <Link to={`/pedidos/${pedido.id}`}>#{pedido.id}</Link>
                    </td>
                    <td>{formatarData(pedido.data, { hora: true })}</td>
                    <td className="admin-celula-nome">
                      {pedido.cliente_nome}
                      <small className="pedido-variacao">{pedido.cliente_email}</small>
                    </td>
                    <td>{pedido.quantidade_itens}</td>
                    <td>{formatarMoeda(pedido.total)}</td>
                    <td>
                      {NOMES_METODOS[pedido.metodo] ?? '—'}
                      <small className="pedido-variacao">{ROTULO_PAGAMENTO[pedido.status_pagamento] ?? ''}</small>
                    </td>
                    <td>
                      <StatusBadge status={pedido.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {dados && totalPaginas > 1 && (
          <div className="admin-paginacao">
            <button type="button" className="admin-botao pequeno secundario" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
              ← Anterior
            </button>
            <span>
              Página {pagina} de {totalPaginas}
            </span>
            <button type="button" className="admin-botao pequeno secundario" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
              Próxima →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
