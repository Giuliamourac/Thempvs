import axios from 'axios';

const CHAVE_TOKEN = 'thempvs_token';

/** O token fica no localStorage (some ao limpar os dados do site). Tudo em try/catch: pode estar bloqueado. */
export const tokenSalvo = {
  ler() {
    try {
      return window.localStorage.getItem(CHAVE_TOKEN);
    } catch {
      return null;
    }
  },
  gravar(token) {
    try {
      if (token) window.localStorage.setItem(CHAVE_TOKEN, token);
      else window.localStorage.removeItem(CHAVE_TOKEN);
    } catch {
      /* sem armazenamento: a sessão dura só até recarregar a página */
    }
  },
};

// Se o localStorage estiver bloqueado, o token fica só em memória.
let tokenEmMemoria = null;
export const definirToken = (token) => {
  tokenEmMemoria = token;
  tokenSalvo.gravar(token);
};
const lerToken = () => tokenEmMemoria ?? tokenSalvo.ler();

/** Disparado quando o servidor recusa o token (sessão expirada): o AuthContext limpa o usuário. */
export const EVENTO_SESSAO_EXPIRADA = 'thempvs:sessao-expirada';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = lerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Normaliza qualquer erro do Axios em:
 *   error.userMessage  → texto pronto para mostrar ao usuário
 *   error.fieldErrors  → [{ campo, mensagem }] vindos da validação do backend
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const data = error.response?.data;

    // 401 com token enviado = sessão vencida/inválida. (Senha errada no login não tem token.)
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      definirToken(null);
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }

    error.fieldErrors = Array.isArray(data?.details) ? data.details : [];

    if (!error.response) {
      error.userMessage =
        'Não foi possível se conectar ao servidor. Verifique se o backend está rodando.';
    } else if (error.fieldErrors.length > 0) {
      error.userMessage = 'Corrija os campos destacados e tente novamente.';
    } else {
      error.userMessage = data?.error ?? `Erro inesperado (${error.response.status}).`;
    }

    return Promise.reject(error);
  },
);

export const isCancel = axios.isCancel;

export const getErrorMessage = (error) => error?.userMessage ?? 'Ocorreu um erro inesperado.';

// ---------- /api/products ----------

/** { categoria: ['a','b'] } → ?categoria=a&categoria=b (o padrão do axios seria categoria[]=a, que o servidor não lê). */
const serializarParametros = (params) => {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params ?? {})) {
    for (const item of Array.isArray(valor) ? valor : [valor]) {
      if (item === undefined || item === null || item === '' || item === false) continue;
      busca.append(chave, String(item));
    }
  }
  return busca.toString();
};

/**
 * Lista paginada e filtrada no servidor.
 * params: { categoria[], cor[], tamanho[], colecao, q, ordem, em_estoque, pagina, limite }
 * → { itens, total, pagina, limite, paginas }
 */
export const getProducts = (params, config) =>
  api.get('/products', { ...config, params, paramsSerializer: serializarParametros }).then((res) => res.data);

/** Opções de filtro que existem de verdade: { categorias, cores, tamanhos } (cada uma com `total`). */
export const getProductFilters = (config) => api.get('/products/filtros', config).then((res) => res.data);

/** `ref` = slug (/produtos/camiseta-preta) ou id numérico (links antigos). */
export const getProduct = (ref, config) => api.get(`/products/${encodeURIComponent(ref)}`, config).then((res) => res.data);

export const createProduct = (product) => api.post('/products', product).then((res) => res.data);

export const updateProduct = (id, product) =>
  api.put(`/products/${id}`, product).then((res) => res.data);

export const deleteProduct = (id) => api.delete(`/products/${id}`).then(() => undefined);

// ---------- /api/categorias e /api/colecoes ----------

export const getCategories = (config) => api.get('/categorias', config).then((res) => res.data);
export const getCollections = (config) => api.get('/colecoes', config).then((res) => res.data);
/** Admin. Devolve { slug, nome, total_produtos }. */
export const createCategory = (nome) => api.post('/categorias', { nome }).then((res) => res.data);
export const createCollection = (nome) => api.post('/colecoes', { nome }).then((res) => res.data);

// ---------- /api/uploads ----------

/** Envia uma imagem (File) e devolve a URL pública salva pelo backend. */
export const uploadImage = (file) => {
  const dados = new FormData();
  dados.append('imagem', file);
  return api
    .post('/uploads', dados, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 })
    .then((res) => res.data.url);
};

// ---------- /api/auth ----------

export const login = (email, senha) => api.post('/auth/login', { email, senha }).then((res) => res.data);

export const register = (dados) => api.post('/auth/register', dados).then((res) => res.data);

export const getMe = (config) => api.get('/auth/me', config).then((res) => res.data.usuario);

// ---------- /api/enderecos ----------

export const getAddresses = () => api.get('/enderecos').then((res) => res.data);

export const createAddress = (endereco) => api.post('/enderecos', endereco).then((res) => res.data);

// ---------- /api/pedidos ----------

/** Confere preço, estoque e frete reais do carrinho (público). itens: [{ variacao_id, quantidade }] */
export const quoteOrder = (itens, uf, config) =>
  api.post('/pedidos/cotacao', { itens, uf: uf || null }, config).then((res) => res.data);

export const createOrder = (pedido) => api.post('/pedidos', pedido).then((res) => res.data);

/** params: { todos?: boolean (admin), status?, pagina?, limite? } → { pedidos, total, pagina, limite } */
export const getOrders = (params, config) =>
  api.get('/pedidos', { ...config, params: { ...params, todos: params?.todos ? 1 : undefined } }).then((res) => res.data);

export const getOrder = (id, config) => api.get(`/pedidos/${id}`, config).then((res) => res.data);

export const cancelOrder = (id) => api.post(`/pedidos/${id}/cancelar`).then((res) => res.data);

/** Admin: { status, transportadora? } */
export const setOrderStatus = (id, dados) => api.patch(`/pedidos/${id}/status`, dados).then((res) => res.data);

export default api;
