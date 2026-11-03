import Field from './Field.jsx';
import { formatarCep, formatarMoeda } from '../../utils/format.js';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const NOMES_METODOS = { pix: 'Pix', boleto: 'Boleto' };

export const enderecoEmLinha = (e) =>
  `${e.destinatario} — ${e.rua}, ${e.numero}${e.complemento ? ` (${e.complemento})` : ''}` +
  ` — ${e.bairro}, ${e.cidade}/${e.uf} — CEP ${formatarCep(e.cep)}`;

const textoFrete = (opcao) =>
  `${opcao.nome} — ${opcao.valor === 0 ? 'Grátis' : formatarMoeda(opcao.valor)} — ` +
  `até ${opcao.prazo_dias} ${opcao.prazo_dias === 1 ? 'dia' : 'dias'}`;


export function AddressStep({ form, errors, onChange, onSubmit, enderecos, enviando }) {
  const campo = (nome) => ({
    value: form[nome],
    error: errors[nome],
    onChange: (e) => onChange(nome, e.target.value),
  });

  return (
    <form className="etapa-form" onSubmit={onSubmit} noValidate>
      {enderecos.length > 0 && (
        <fieldset className="metodos opcoes-lista">
          <legend className="campo-rotulo">Seus endereços</legend>

          {enderecos.map((endereco) => (
            <label className="metodo" key={endereco.id}>
              <input
                type="radio"
                id={`enderecoSalvo-${endereco.id}`}
                name="enderecoId"
                value={endereco.id}
                checked={form.enderecoId === String(endereco.id)}
                onChange={() => onChange('enderecoId', String(endereco.id))}
              />
              <span className="metodo-caixa">{enderecoEmLinha(endereco)}</span>
            </label>
          ))}

          <label className="metodo">
            <input
              type="radio"
              id="enderecoSalvo-novo"
              name="enderecoId"
              value="novo"
              checked={form.enderecoId === 'novo'}
              onChange={() => onChange('enderecoId', 'novo')}
            />
            <span className="metodo-caixa">Usar outro endereço</span>
          </label>
        </fieldset>
      )}
      {errors.enderecoId && (
        <p className="campo-erro" role="alert">
          {errors.enderecoId}
        </p>
      )}

      {form.enderecoId === 'novo' && (
        <div className="campos-grade">
          <Field id="campoCep" label="CEP" name="cep" className="campo-cep" inputMode="numeric"
            placeholder="00000-000" maxLength={9} autoComplete="postal-code" {...campo('cep')} />

          <Field id="campoDestinatario" label="Nome do destinatário" name="destinatario"
            className="campo-largo" placeholder="Nome completo" autoComplete="name"
            {...campo('destinatario')} />

          <Field id="campoRua" label="Rua ou logradouro" name="rua" className="campo-largo"
            placeholder="Rua, avenida, travessa..." autoComplete="address-line1" {...campo('rua')} />

          <Field id="campoNumero" label="Número" name="numero" className="campo-curto"
            placeholder="Ex.: 120" maxLength={10} autoComplete="off" {...campo('numero')} />

          <Field id="campoComplemento" label="Complemento" optional name="complemento"
            placeholder="Apto, bloco..." autoComplete="address-line2" {...campo('complemento')} />

          <Field id="campoBairro" label="Bairro" name="bairro" placeholder="Bairro"
            autoComplete="off" {...campo('bairro')} />

          <Field id="campoCidade" label="Cidade" name="cidade" placeholder="Cidade"
            autoComplete="address-level2" {...campo('cidade')} />

          <Field id="campoEstado" label="Estado" name="estado" as="select" className="campo-curto"
            autoComplete="address-level1" {...campo('estado')}>
            <option value="">UF</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Field>
        </div>
      )}

      <button type="submit" className="botao-principal" disabled={enviando}>
        {enviando ? 'Salvando...' : 'Avançar'}
      </button>
    </form>
  );
}

export function PaymentStep({ form, errors, onChange, onSubmit, quote, carregando, temEndereco }) {
  const fretes = quote?.fretes ?? [];

  return (
    <form className="etapa-form" onSubmit={onSubmit} noValidate>
      <fieldset className="metodos opcoes-lista">
        <legend className="campo-rotulo">Forma de entrega</legend>

        {fretes.map((opcao) => (
          <label className="metodo" key={opcao.servico}>
            <input
              type="radio"
              id={`frete-${opcao.servico}`}
              name="frete"
              value={opcao.servico}
              checked={form.frete === opcao.servico}
              onChange={() => onChange('frete', opcao.servico)}
            />
            <span className="metodo-caixa">{textoFrete(opcao)}</span>
          </label>
        ))}
      </fieldset>
      {fretes.length === 0 && (
        <p className="metodo-texto">
          {!temEndereco
            ? 'Escolha um endereço para ver as opções de entrega.'
            : carregando
              ? 'Calculando o frete...'
              : 'Não foi possível calcular o frete para este endereço.'}
        </p>
      )}
      {errors.frete && (
        <p className="campo-erro" role="alert">
          {errors.frete}
        </p>
      )}

      <fieldset className="metodos">
        <legend className="campo-rotulo">Forma de pagamento</legend>

        {Object.entries(NOMES_METODOS).map(([valor, rotulo]) => (
          <label className="metodo" key={valor}>
            <input
              type="radio"
              id={`metodo${valor[0].toUpperCase()}${valor.slice(1)}`}
              name="metodoPagamento"
              value={valor}
              checked={form.metodo === valor}
              onChange={() => onChange('metodo', valor)}
            />
            <span className="metodo-caixa">{rotulo}</span>
          </label>
        ))}
      </fieldset>
      {errors.metodo && (
        <p className="campo-erro" role="alert">
          {errors.metodo}
        </p>
      )}

      <p className="aviso-demo">
        Como funciona: ao finalizar, seu pedido fica como <strong>Pendente</strong> e a loja confirma o
        pagamento por {form.metodo === 'boleto' ? 'boleto' : 'Pix'}. Você acompanha tudo em “Meus pedidos”.
        Nenhum dado de cartão é pedido ou guardado.
      </p>

      <button type="submit" className="botao-principal">
        Avançar
      </button>
    </form>
  );
}

function LinhaResumo({ rotulo, texto }) {
  return (
    <div>
      <dt>{rotulo}</dt>
      <dd>{texto}</dd>
    </div>
  );
}

export function ReviewStep({ form, enderecoTexto, quote, freteEscolhido, erroConclusao, problemas, enviando, onSubmit }) {
  const quantidade = quote ? quote.itens.reduce((soma, item) => soma + item.quantidade, 0) : 0;
  const total = quote ? quote.subtotal + (freteEscolhido?.valor ?? 0) : 0;

  return (
    <form className="etapa-form" onSubmit={onSubmit} noValidate>
      <p className="campo-rotulo">Confira antes de finalizar</p>
      <dl className="resumo-dados">
        <LinhaResumo rotulo="Entrega em" texto={enderecoTexto || 'não informado'} />
        <LinhaResumo rotulo="Forma de entrega" texto={freteEscolhido ? textoFrete(freteEscolhido) : 'não informada'} />
        <LinhaResumo rotulo="Pagamento" texto={form.metodo ? NOMES_METODOS[form.metodo] : 'não informado'} />
        <LinhaResumo
          rotulo="Itens"
          texto={quote ? `${quantidade} ${quantidade === 1 ? 'item' : 'itens'} — total ${formatarMoeda(total)}` : '—'}
        />
      </dl>

      {erroConclusao && (
        <div className="campo-erro" role="alert">
          <p>{erroConclusao}</p>
          {problemas.length > 0 && (
            <ul className="lista-problemas">
              {problemas.map((problema) => (
                <li key={`${problema.variacao_id}-${problema.mensagem}`}>{problema.mensagem}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button type="submit" className="botao-principal" disabled={enviando}>
        {enviando ? 'Finalizando...' : 'Finalizar pedido'}
      </button>
    </form>
  );
}
