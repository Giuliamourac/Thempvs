import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { destinoSeguro } from '../utils/orders.js';

export default function Register() {
  const { usuario, cadastrar } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = destinoSeguro(params.get('next'));

  const [valores, setValores] = useState({ nome: '', email: '', telefone: '', senha: '', confirmar: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={next} replace />;

  const alterar = (campo) => (e) => {
    setValores((atuais) => ({ ...atuais, [campo]: e.target.value }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  };

  const aoEnviar = async (evento) => {
    evento.preventDefault();
    setErroGeral('');

    const locais = {};
    if (valores.nome.trim().length < 2) locais.nome = 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valores.email.trim())) locais.email = 'Digite um email válido, como nome@exemplo.com.';
    if (valores.senha.length < 8) locais.senha = 'A senha deve ter ao menos 8 caracteres.';
    if (valores.confirmar !== valores.senha) locais.confirmar = 'As senhas não são iguais.';
    setErros(locais);
    if (Object.keys(locais).length) return;

    setEnviando(true);
    try {
      await cadastrar({
        nome: valores.nome.trim(),
        email: valores.email.trim(),
        senha: valores.senha,
        telefone: valores.telefone.trim() || null,
      });
      navigate(next, { replace: true });
    } catch (e) {
      const porCampo = Object.fromEntries((e.fieldErrors ?? []).map(({ campo, mensagem }) => [campo, mensagem]));
      setErros(porCampo);
      setErroGeral(Object.keys(porCampo).length ? '' : getErrorMessage(e));
      setEnviando(false);
    }
  };

  const campo = (nome, rotulo, props = {}) => (
    <label className="conta-campo">
      <span>{rotulo}</span>
      <input value={valores[nome]} onChange={alterar(nome)} aria-invalid={erros[nome] ? 'true' : undefined} {...props} />
      {erros[nome] && (
        <small className="conta-erro" role="alert">
          {erros[nome]}
        </small>
      )}
    </label>
  );

  return (
    <main className="conta conta-estreita">
      <h1>Criar conta</h1>

      <form className="conta-form" onSubmit={aoEnviar} noValidate>
        {campo('nome', 'Nome completo', { type: 'text', autoComplete: 'name', autoFocus: true })}
        {campo('email', 'Email', { type: 'email', autoComplete: 'email' })}
        {campo('telefone', 'Telefone (opcional)', { type: 'tel', autoComplete: 'tel', maxLength: 20 })}
        {campo('senha', 'Senha (mín. 8 caracteres)', { type: 'password', autoComplete: 'new-password' })}
        {campo('confirmar', 'Repita a senha', { type: 'password', autoComplete: 'new-password' })}

        {erroGeral && (
          <p className="conta-erro" role="alert">
            {erroGeral}
          </p>
        )}

        <button type="submit" className="conta-botao" disabled={enviando}>
          {enviando ? 'Criando...' : 'Criar conta'}
        </button>
      </form>

      <p className="conta-rodape">
        Já tem conta? <Link to={`/entrar?next=${encodeURIComponent(next)}`}>Entrar</Link>
      </p>
    </main>
  );
}
