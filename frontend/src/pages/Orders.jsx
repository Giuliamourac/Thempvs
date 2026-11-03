import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.jsx';
import { getErrorMessage, getOrders, isCancel } from '../services/api.js';
import { formatarData, formatarMoeda } from '../utils/format.js';

export default function Orders() {
  const [estado, setEstado] = useState({ carregando: true, pedidos: [], erro: '' });

  useEffect(() => {
    const controller = new AbortController();
    getOrders({ limite: 100 }, { signal: controller.signal })
      .then((dados) => setEstado({ carregando: false, pedidos: dados.pedidos, erro: '' }))
      .catch((e) => {
        if (!isCancel(e)) setEstado({ carregando: false, pedidos: [], erro: getErrorMessage(e) });
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="conta">
      <h1>Meus pedidos</h1>

      {estado.carregando && <p>Carregando pedidos...</p>}
      {estado.erro && <p className="conta-erro" role="alert">{estado.erro}</p>}

      {!estado.carregando && !estado.erro && estado.pedidos.length === 0 && (
        <p>
          Você ainda não fez nenhum pedido. <Link to="/produtos">Ver produtos</Link>
        </p>
      )}

      {estado.pedidos.length > 0 && (
        <div className="conta-tabela-wrap">
          <table className="conta-tabela">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Data</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {estado.pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>
                    <Link to={`/pedidos/${pedido.id}`}>#{pedido.id}</Link>
                  </td>
                  <td>{formatarData(pedido.data)}</td>
                  <td>{pedido.quantidade_itens}</td>
                  <td>{formatarMoeda(pedido.total)}</td>
                  <td>
                    <StatusBadge status={pedido.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
