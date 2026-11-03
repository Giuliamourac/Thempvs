import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { cancelOrder, getErrorMessage, getOrder, isCancel, setOrderStatus } from '../services/api.js';
import { formatarCep, formatarData, formatarMoeda } from '../utils/format.js';
import { NOMES_METODOS, PROXIMOS_STATUS, ROTULO_PAGAMENTO, ROTULO_STATUS } from '../utils/orders.js';

function AcoesDoAdmin({ pedido, aoMudar, ocupado }) {
  const [transportadora, setTransportadora] = useState('');
  const proximos = PROXIMOS_STATUS[pedido.status] ?? [];
  if (proximos.length === 0) return null;

  return (
    <section className="pedido-bloco">
      <h2>Administração</h2>
      {proximos.includes('Enviado') && (
        <label className="conta-campo">
          <span>Transportadora (ao marcar como enviado)</span>
          <input
            type="text"
            maxLength={100}
            value={transportadora}
            onChange={(e) => setTransportadora(e.target.value)}
            placeholder="Ex.: Correios"
          />
        </label>
      )}
      <div className="pedido-acoes">
        {proximos.map((status) => (
          <button
            key={status}
            type="button"
            className={`conta-botao${status === 'Cancelado' ? ' perigo' : ''}`}
            disabled={ocupado}
            onClick={() => aoMudar(status, status === 'Enviado' ? transportadora.trim() || null : undefined)}
          >
            {status === 'Cancelado' ? 'Cancelar pedido' : `Marcar como ${ROTULO_STATUS[status].toLowerCase()}`}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const { ehAdmin } = useAuth();

  const [estado, setEstado] = useState({ carregando: true, pedido: null, erro: '', naoEncontrado: false });
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erroAcao, setErroAcao] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setEstado({ carregando: true, pedido: null, erro: '', naoEncontrado: false });
    getOrder(id, { signal: controller.signal })
      .then((pedido) => setEstado({ carregando: false, pedido, erro: '', naoEncontrado: false }))
      .catch((e) => {
        if (isCancel(e)) return;
        const status = e.response?.status;
        setEstado({ carregando: false, pedido: null, erro: getErrorMessage(e), naoEncontrado: status === 404 || status === 400 });
      });
    return () => controller.abort();
  }, [id]);

  const executar = useCallback(async (acao, sucesso) => {
    setOcupado(true);
    setErroAcao('');
    setMensagem('');
    try {
      const pedido = await acao();
      setEstado((atual) => ({ ...atual, pedido }));
      setMensagem(sucesso);
    } catch (e) {
      setErroAcao(getErrorMessage(e));
    } finally {
      setOcupado(false);
    }
  }, []);

  if (estado.carregando) return <p className="estado-pagina">Carregando pedido...</p>;

  if (!estado.pedido) {
    return (
      <main className="estado-pagina">
        <h1>{estado.naoEncontrado ? 'Pedido não encontrado' : 'Algo deu errado'}</h1>
        {!estado.naoEncontrado && <p className="estado-erro">{estado.erro}</p>}
        <p>
          <Link to="/pedidos">Voltar para meus pedidos</Link>
        </p>
      </main>
    );
  }

  const { pedido } = estado;
  const aguardando = pedido.status === 'Pendente';
  const metodo = NOMES_METODOS[pedido.pagamento?.metodo] ?? '';

  const aoCancelar = () => {
    if (!window.confirm('Cancelar este pedido? Os itens voltam para o estoque.')) return;
    executar(() => cancelOrder(pedido.id), 'Pedido cancelado.');
  };

  return (
    <main className="conta">
      {state?.novo && (
        <div className="conta-aviso sucesso" role="status">
          <strong>Pedido #{pedido.id} recebido!</strong> Ele está <em>aguardando pagamento</em>. A loja confirma o
          pagamento por {metodo || 'Pix/boleto'} e atualiza o status aqui.
        </div>
      )}

      <div className="pedido-topo">
        <h1>Pedido #{pedido.id}</h1>
        <StatusBadge status={pedido.status} />
      </div>
      <p className="pedido-data">Feito em {formatarData(pedido.data, { hora: true })}</p>

      {mensagem && <div className="conta-aviso sucesso" role="status">{mensagem}</div>}
      {erroAcao && <div className="conta-aviso erro" role="alert">{erroAcao}</div>}

      <section className="pedido-bloco">
        <h2>Itens</h2>
        <div className="conta-tabela-wrap">
          <table className="conta-tabela">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Unitário</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.nome}
                    <small className="pedido-variacao">{[item.tamanho, item.cor].filter(Boolean).join(' · ')}</small>
                  </td>
                  <td>{item.quantidade}</td>
                  <td>{formatarMoeda(item.preco_unitario)}</td>
                  <td>{formatarMoeda(item.preco_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="pedido-totais">
          <div><dt>Subtotal</dt><dd>{formatarMoeda(pedido.subtotal)}</dd></div>
          <div><dt>Frete</dt><dd>{pedido.frete === 0 ? 'Grátis' : formatarMoeda(pedido.frete)}</dd></div>
          <div className="total"><dt>Total</dt><dd>{formatarMoeda(pedido.total)}</dd></div>
        </dl>
      </section>

      <div className="pedido-colunas">
        <section className="pedido-bloco">
          <h2>Entrega</h2>
          {pedido.endereco && (
            <p>
              {pedido.endereco.destinatario}
              <br />
              {pedido.endereco.rua}, {pedido.endereco.numero}
              {pedido.endereco.complemento ? ` (${pedido.endereco.complemento})` : ''}
              <br />
              {pedido.endereco.bairro} — {pedido.endereco.cidade}/{pedido.endereco.uf}
              <br />
              CEP {formatarCep(pedido.endereco.cep)}
            </p>
          )}
          {pedido.envio && (
            <p className="pedido-envio">
              Serviço: {pedido.envio.servico}
              <br />
              Transportadora: {pedido.envio.transportadora}
              {pedido.envio.data_postagem && <><br />Postado em {formatarData(pedido.envio.data_postagem)}</>}
              {pedido.status !== 'Cancelado' && <><br />Previsão de entrega: {formatarData(pedido.envio.data_entrega_prevista)}</>}
            </p>
          )}
        </section>

        <section className="pedido-bloco">
          <h2>Pagamento</h2>
          {pedido.pagamento && (
            <p>
              {metodo}
              <br />
              Situação: {ROTULO_PAGAMENTO[pedido.pagamento.status] ?? pedido.pagamento.status}
            </p>
          )}
          {ehAdmin && pedido.cliente && (
            <p className="pedido-cliente">
              Cliente: {pedido.cliente.nome}
              <br />
              {pedido.cliente.email}
            </p>
          )}
        </section>
      </div>

      {aguardando && !ehAdmin && (
        <div className="pedido-acoes">
          <button type="button" className="conta-botao perigo" disabled={ocupado} onClick={aoCancelar}>
            Cancelar pedido
          </button>
        </div>
      )}

      {ehAdmin && <AcoesDoAdmin key={pedido.status} pedido={pedido} ocupado={ocupado}
        aoMudar={(status, transportadora) => {
          if (status === 'Cancelado' && !window.confirm('Cancelar este pedido? Os itens voltam para o estoque.')) return;
          executar(() => setOrderStatus(pedido.id, { status, transportadora }), `Pedido atualizado: ${ROTULO_STATUS[status]}.`);
        }} />}

      <p className="pedido-voltar">
        <Link to={ehAdmin ? '/admin/pedidos' : '/pedidos'}>← Voltar para a lista de pedidos</Link>
      </p>
    </main>
  );
}
