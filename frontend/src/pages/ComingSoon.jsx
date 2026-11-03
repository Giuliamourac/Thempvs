import { Link } from 'react-router-dom';

/** Páginas que existiam como arquivos vazios no projeto original (Sale, Lojas, Contato...). */
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
