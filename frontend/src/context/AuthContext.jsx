import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  EVENTO_SESSAO_EXPIRADA,
  definirToken,
  getMe,
  isCancel,
  login as apiLogin,
  register as apiRegister,
  tokenSalvo,
} from '../services/api.js';

const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [status, setStatus] = useState(() => (tokenSalvo.ler() ? 'carregando' : 'pronto'));

  useEffect(() => {
    if (!tokenSalvo.ler()) return undefined;

    const controller = new AbortController();
    getMe({ signal: controller.signal })
      .then((u) => setUsuario(u))
      .catch((erro) => {
        if (isCancel(erro)) return;
        setUsuario(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatus('pronto');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const aoExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  const iniciarSessao = useCallback(({ token, usuario: u }) => {
    definirToken(token);
    setUsuario(u);
    setStatus('pronto');
    return u;
  }, []);

  const entrar = useCallback((email, senha) => apiLogin(email, senha).then(iniciarSessao), [iniciarSessao]);
  const cadastrar = useCallback((dados) => apiRegister(dados).then(iniciarSessao), [iniciarSessao]);

  const sair = useCallback(() => {
    definirToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, status, ehAdmin: usuario?.perfil === 'admin', entrar, cadastrar, sair }),
    [usuario, status, entrar, cadastrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return contexto;
}
