import { Link } from 'react-router-dom';

export default function ComingSoon({ titulo }) {
  return (
    <main className="estado-pagina">
      <h1>{titulo}</h1>
      <p>Esta página ainda está em construção.</p>
      <p>
        <Link to="/produtos">Ver produtos</Link>
      </p>
    </main>
  );
}
