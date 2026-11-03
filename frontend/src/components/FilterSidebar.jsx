export default function FilterSidebar({ grupos, onAlternar }) {
  return (
    <aside className="barra-filtros" aria-label="Filtros">
      <h3>Filtrar por</h3>

      {grupos.map((grupo) => (
        <div className="grupo-filtro" key={grupo.nome}>
          <h4>{grupo.titulo}</h4>
          {grupo.opcoes.map((opcao) => (
            <label key={opcao.valor}>
              <input
                type="checkbox"
                name={grupo.nome}
                value={opcao.valor}
                checked={grupo.selecionados.includes(opcao.valor)}
                onChange={() => onAlternar(grupo.nome, opcao.valor)}
              />{' '}
              {opcao.rotulo}
            </label>
          ))}
        </div>
      ))}
    </aside>
  );
}
