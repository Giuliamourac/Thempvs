import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { destinoSeguro } from '../utils/orders.js';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = destinoSeguro(params.get('next'));

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={next} replace />;

  const aoEnviar = async (evento) => {
    evento.preventDefault();
    if (!email.trim() || !senha) {
      setErro('Informe seu email e sua senha.');
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      await entrar(email.trim(), senha);
      navigate(next, { replace: true });
    } catch (e) {
      setErro(getErrorMessage(e));
      setEnviando(false);
    }
  };

  return (
    <main className="conta conta-estreita">
      <h1>Entrar</h1>

      <form className="conta-form" onSubmit={aoEnviar} noValidate>
        <label className="conta-campo">
          <span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </label>

        <label className="conta-campo">
          <span>Senha</span>
          <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>

        {erro && (
          <p className="conta-erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="conta-botao" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="conta-rodape">
        Ainda não tem conta? <Link to={`/cadastrar?next=${encodeURIComponent(next)}`}>Criar conta</Link>
      </p>
    </main>
  );
}
