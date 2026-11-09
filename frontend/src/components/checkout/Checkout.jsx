import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuote } from '../../hooks/useQuote.js';
import { createAddress, createOrder, getAddresses, getErrorMessage } from '../../services/api.js';
import {
  CAMPO_DO_BACKEND,
  ETAPA_DO_CAMPO,
  ID_DO_CAMPO,
  MASCARAS,
  VALIDADORES,
} from '../../utils/checkoutValidation.js';
import dancer from '../../assets/dancer.png';
import OrderSummary from './OrderSummary.jsx';
import Step from './Step.jsx';
import StepIndicators, { ETAPAS } from './StepIndicators.jsx';
import { AddressStep, PaymentStep, ReviewStep, enderecoEmLinha } from './steps.jsx';

const FORM_INICIAL = {
  enderecoId: '', // id de um endereço salvo, ou "novo"
  cep: '',
  destinatario: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  frete: 'padrao',
  metodo: '',
};

const PROXIMA_ETAPA = { endereco: 'pagamento', pagamento: 'revisao' };

const semErrosDaEtapa = (erros, etapa) =>
  Object.fromEntries(Object.entries(erros).filter(([campo]) => ETAPA_DO_CAMPO[campo] !== etapa));

const focar = (id) => document.getElementById(id)?.focus();

function PedirLogin() {
  const { pathname, search } = useLocation();
  const next = encodeURIComponent(pathname + search);

  return (
    <div className="checkout-login">
      <p>Para finalizar a compra, entre na sua conta. Seu carrinho continua salvo.</p>
      <div className="checkout-login-botoes">
        <Link className="botao-principal botao-link" to={`/entrar?next=${next}`}>
          Entrar
        </Link>
        <Link className="botao-secundario botao-link" to={`/cadastrar?next=${next}`}>
          Criar conta
        </Link>
      </div>
    </div>
  );
}

/**
 * Checkout em 3 etapas (endereço → entrega e pagamento → revisão).
 * Preço, estoque e frete vêm do servidor (useQuote) e o pedido é criado em POST /api/pedidos.
 */
export default function Checkout({ cart }) {
  const navigate = useNavigate();
  const { usuario, status } = useAuth();

  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});
  const [aberta, setAberta] = useState('endereco');
  const [concluidas, setConcluidas] = useState({});
  const [enderecos, setEnderecos] = useState([]);
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroConclusao, setErroConclusao] = useState('');
  const [problemas, setProblemas] = useState([]);
  const temporizador = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  // Endereços salvos do cliente (o padrão já vem marcado).
  const usuarioId = usuario?.id;
  useEffect(() => {
    if (!usuarioId) return undefined;
    let cancelado = false;
    getAddresses()
      .then((lista) => {
        if (cancelado) return;
        setEnderecos(lista);
        const padrao = lista.find((e) => e.padrao) ?? lista[0];
        setForm((atual) =>
          atual.enderecoId ? atual : { ...atual, enderecoId: padrao ? String(padrao.id) : 'novo' },
        );
      })
      .catch(() => {
        if (!cancelado) setForm((atual) => (atual.enderecoId ? atual : { ...atual, enderecoId: 'novo' }));
      });
    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  const enderecoSalvo = enderecos.find((e) => String(e.id) === form.enderecoId);
  const ufDoPedido = enderecoSalvo?.uf ?? (form.enderecoId === 'novo' ? form.estado : '');

  const { quote, carregando, erro: erroCotacao, recarregar } = useQuote(cart.itens, ufDoPedido);
  const freteEscolhido = quote?.fretes.find((opcao) => opcao.servico === form.frete) ?? null;

  // ---------- campos ----------

  const alterarCampo = (nome, valor) => {
    const valorFinal = MASCARAS[nome] ? MASCARAS[nome](valor) : valor;
    setForm((atual) => ({ ...atual, [nome]: valorFinal }));

    const etapa = ETAPA_DO_CAMPO[nome];
    if (!etapa) return;

    setErros((atuais) => {
      if (!atuais[nome]) return atuais;
      const { [nome]: _removido, ...resto } = atuais;
      return resto;
    });
    setConcluidas((atuais) => (atuais[etapa] ? { ...atuais, [etapa]: false } : atuais));
  };

  // ---------- etapas ----------

  const abrirEtapa = (nome, { focarPrimeiro = false } = {}) => {
    setAberta(nome);
    if (nome === 'revisao') {
      setErroConclusao('');
      setProblemas([]);
    }

    if (focarPrimeiro) {
      clearTimeout(temporizador.current);
      // Espera a animação abrir o painel para o foco funcionar.
      temporizador.current = setTimeout(() => {
        const secao = document.querySelector(`.etapa[data-etapa="${nome}"]`);
        secao?.querySelector('input:not([type=hidden]):not([disabled]), select, textarea')?.focus({
          preventScroll: true,
        });
        secao?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 320);
    }
  };

  const alternarEtapa = (nome) => (aberta === nome ? setAberta(null) : abrirEtapa(nome));

  /** Valida uma etapa; guarda os erros e devolve o primeiro campo inválido (ou undefined). */
  const validarEtapa = (nome) => {
    const novosErros = VALIDADORES[nome](form);
    setErros((atuais) => ({ ...semErrosDaEtapa(atuais, nome), ...novosErros }));
    setConcluidas((atuais) => ({ ...atuais, [nome]: Object.keys(novosErros).length === 0 }));
    return Object.keys(novosErros)[0];
  };

  const salvarEnderecoNovo = async () => {
    setSalvandoEndereco(true);
    try {
      const salvo = await createAddress({
        destinatario: form.destinatario.trim(),
        cep: form.cep,
        rua: form.rua.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim() || null,
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        uf: form.estado,
      });
      setEnderecos((atuais) => [salvo, ...atuais]);
      setForm((atual) => ({ ...atual, enderecoId: String(salvo.id) }));
      return true;
    } catch (erro) {
      // Erro de validação do servidor: mostra embaixo de cada campo.
      const porCampo = Object.fromEntries(
        (erro.fieldErrors ?? []).map(({ campo, mensagem }) => [CAMPO_DO_BACKEND[campo] ?? campo, mensagem]),
      );
      setErros((atuais) => ({
        ...atuais,
        ...(Object.keys(porCampo).length ? porCampo : { enderecoId: getErrorMessage(erro) }),
      }));
      return false;
    } finally {
      setSalvandoEndereco(false);
    }
  };

  const avancarEndereco = async (evento) => {
    evento.preventDefault();
    const primeiroInvalido = validarEtapa('endereco');
    if (primeiroInvalido) return focar(ID_DO_CAMPO[primeiroInvalido]);

    if (form.enderecoId === 'novo' && !(await salvarEnderecoNovo())) {
      setConcluidas((atuais) => ({ ...atuais, endereco: false }));
      return undefined;
    }
    return abrirEtapa('pagamento', { focarPrimeiro: true });
  };

  const avancarPagamento = (evento) => {
    evento.preventDefault();
    const primeiroInvalido = validarEtapa('pagamento');
    if (primeiroInvalido) return focar(ID_DO_CAMPO[primeiroInvalido]);
    return abrirEtapa('revisao', { focarPrimeiro: true });
  };

  const concluir = async (evento) => {
    evento.preventDefault();
    setErroConclusao('');
    setProblemas([]);

    if (cart.itens.length === 0) {
      setErroConclusao('Seu carrinho está vazio. Adicione produtos antes de concluir.');
      return;
    }
    if (!quote?.pode_finalizar) {
      setErroConclusao('Há itens indisponíveis no carrinho. Ajuste o carrinho ao lado e tente de novo.');
      return;
    }

    for (const nome of ['endereco', 'pagamento']) {
      const primeiroInvalido = validarEtapa(nome);
      if (primeiroInvalido) {
        abrirEtapa(nome);
        setTimeout(() => focar(ID_DO_CAMPO[primeiroInvalido]), 0); // espera o painel abrir
        return;
      }
    }
    if (!enderecoSalvo) {
      // Preencheu "outro endereço" mas ainda não o salvou (voltou à revisão direto).
      abrirEtapa('endereco');
      return;
    }

    setEnviando(true);
    try {
      const pedido = await createOrder({
        itens: cart.itens.map((item) => ({ variacao_id: item.variacaoId, quantidade: item.quantidade })),
        endereco_id: enderecoSalvo.id,
        frete_servico: form.frete,
        metodo_pagamento: form.metodo,
      });
      cart.limpar();
      navigate(`/pedidos/${pedido.id}`, { replace: true, state: { novo: true } });
    } catch (erro) {
      setErroConclusao(getErrorMessage(erro));
      // 409: estoque mudou. Mostra o que faltou e atualiza a cotação (o resumo oferece "Ajustar carrinho").
      setProblemas(erro.response?.status === 409 ? (erro.response.data?.details ?? []) : []);
      if (erro.response?.status === 409) recarregar();
    } finally {
      setEnviando(false);
    }
  };

  const propsDaEtapa = { form, errors: erros, onChange: alterarCampo };

  return (
    <main className="checkout">
      <h1 className="checkout-titulo">Finalizar compra</h1>

      <StepIndicators aberta={aberta} concluidas={concluidas} onAbrir={abrirEtapa} />

      <div className="checkout-colunas">
        <div className="checkout-formularios">
          {status === 'carregando' && <p className="metodo-texto">Carregando...</p>}
          {status !== 'carregando' && !usuario && <PedirLogin />}

          {usuario &&
            ETAPAS.map(({ nome, titulo }) => (
              <Step
                key={nome}
                nome={nome}
                titulo={titulo}
                aberta={aberta === nome}
                onAlternar={() => alternarEtapa(nome)}
              >
                {nome === 'endereco' && (
                  <AddressStep
                    {...propsDaEtapa}
                    enderecos={enderecos}
                    enviando={salvandoEndereco}
                    onSubmit={avancarEndereco}
                  />
                )}
                {nome === 'pagamento' && (
                  <PaymentStep
                    {...propsDaEtapa}
                    quote={quote}
                    carregando={carregando}
                    temEndereco={Boolean(ufDoPedido)}
                    onSubmit={avancarPagamento}
                  />
                )}
                {nome === 'revisao' && (
                  <ReviewStep
                    form={form}
                    enderecoTexto={enderecoSalvo ? enderecoEmLinha(enderecoSalvo) : ''}
                    quote={quote}
                    freteEscolhido={freteEscolhido}
                    erroConclusao={erroConclusao}
                    problemas={problemas}
                    enviando={enviando}
                    onSubmit={concluir}
                  />
                )}
              </Step>
            ))}
        </div>

        <div className="checkout-lateral">
          <OrderSummary
            cart={cart}
            quote={quote}
            carregando={carregando}
            erro={erroCotacao}
            freteEscolhido={freteEscolhido}
            onTentarDeNovo={recarregar}
          />

          {/* Marca "Dancer", centralizada abaixo dos produtos do carrinho */}
          <div className="checkout-decoracao" aria-hidden="true">
            <img src={dancer} alt="" />
          </div>
        </div>
      </div>
    </main>
  );
}
