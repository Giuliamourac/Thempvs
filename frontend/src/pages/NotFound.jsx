import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="estado-pagina">
      <h1>Página não encontrada</h1>
      <p>O endereço que você acessou não existe.</p>
      <p>
        <Link to="/">Voltar para a home</Link>
      </p>
    </main>
  );
}
