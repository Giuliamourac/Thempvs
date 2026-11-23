# SEO da THEMPVS — guia rápido

Site: https://thempvs-frontend.vercel.app/ (React + Vite, hospedado na Vercel).

## O que existe agora

| Item | Onde |
|---|---|
| Textos oficiais (título, descrição, domínio, palavras-chave, páginas) | `src/seo/siteConfig.js` |
| Atualiza título/descrição/canonical/Open Graph/JSON-LD a cada página | `src/seo/Seo.jsx` (usado em `Layout.jsx` e `ProductDetail.jsx`) |
| Dados estruturados Schema.org (loja, site, produto, contato, breadcrumbs) | `src/seo/structuredData.js` |
| HTML estático por página + sitemap.xml + robots.txt no build | `scripts/postbuild-seo.mjs` (roda sozinho no `npm run build`) |
| Conferência automática do resultado | `npm run seo:check` |
| Rotas, 404 real, `noindex` das áreas privadas | `vercel.json` |
| Bloqueio de áreas privadas para robôs | `public/robots.txt` |

## Como cadastrar no Google Search Console (propriedade com prefixo de URL)

1. Publique esta versão na Vercel (veja "Depois do deploy" abaixo).
2. Acesse https://search.google.com/search-console e entre com sua conta Google.
3. Clique em **Adicionar propriedade** e escolha **Prefixo do URL** (o quadro da direita).
4. Digite exatamente `https://thempvs-frontend.vercel.app/` e clique em **Continuar**.
5. Escolha o método **Tag HTML** e copie só o valor do `content="..."` (o código comprido).
6. Cole o código em um destes lugares e publique de novo:
   - **Vercel → Settings → Environment Variables:** nome `VITE_GOOGLE_SITE_VERIFICATION`, valor = o código; ou
   - `src/seo/siteConfig.js`, constante `GOOGLE_SITE_VERIFICATION`.
   O build coloca a tag `<meta name="google-site-verification">` em todas as páginas.
7. Depois do novo deploy, volte ao Search Console e clique em **Verificar**.
   (Use a Tag HTML, não o arquivo HTML: com `cleanUrls` ligado, a Vercel redireciona `/arquivo.html`.)
8. Menu **Sitemaps** → em "Adicionar um novo sitemap" digite `sitemap.xml` → **Enviar**. O status deve ficar "Sucesso".
9. Menu **Inspeção de URL** → cole cada endereço abaixo → **Testar URL ativo** → **Solicitar indexação**
   (o Google limita a poucos pedidos por dia; comece pelos três primeiros):
   - `https://thempvs-frontend.vercel.app/`
   - `https://thempvs-frontend.vercel.app/produtos`
   - `https://thempvs-frontend.vercel.app/movement`
   - `https://thempvs-frontend.vercel.app/sale`
   - `https://thempvs-frontend.vercel.app/contato`
   - `https://thempvs-frontend.vercel.app/quem-usa`
   - e as páginas dos produtos principais (`/produtos/conjunto-ana` etc.).
10. Acompanhe em **Páginas** (Indexação) e em **Desempenho**. A primeira indexação costuma levar de horas a alguns dias.

## Depois do deploy: conferir (copie e cole no terminal)

```bash
curl -s https://thempvs-frontend.vercel.app/robots.txt
curl -s https://thempvs-frontend.vercel.app/sitemap.xml | head -20
curl -s https://thempvs-frontend.vercel.app/ | grep -E "<title>|canonical|og:title|description"
curl -sI https://thempvs-frontend.vercel.app/carrinho | grep -i x-robots-tag      # deve mostrar noindex
curl -sI https://thempvs-frontend.vercel.app/pagina-que-nao-existe | head -1       # deve ser 404
```
Teste também em https://search.google.com/test/rich-results (Home e uma página de produto)
e cole um link em https://www.opengraph.xyz para ver a pré-visualização de compartilhamento.

## Quando você cadastrar produtos/eventos novos

- **Produto novo no painel admin:** entra no sitemap no próximo deploy (o build lê a API). Antes disso a página já funciona e o React ajusta os metadados.
  Para o Google descobrir logo, faça um novo deploy na Vercel (Deployments → Redeploy).
- **Evento novo em Quem Usa:** adicione uma entrada em `PAGINAS_PUBLICAS` (`src/seo/siteConfig.js`).
- **Trocar de domínio:** mude `SITE_URL` em `src/seo/siteConfig.js` e `public/robots.txt` (ou defina `VITE_SITE_URL`) e cadastre a nova propriedade.

## Limites que você precisa conhecer

- O site é uma SPA: o conteúdo (lista de produtos) é montado no navegador a partir da API. O Google executa JavaScript, mas pode demorar mais para indexar.
  Por isso cada página pública tem HTML estático com título, descrição, canonical, dados estruturados e texto/links em `<noscript>`.
- A API está no Render grátis e "dorme". Se o Google visitar com ela dormindo, pode ver "Carregando produtos...". Um monitor gratuito (ex.: UptimeRobot, a cada 5 min em `https://thempvs-api.onrender.com/api/products?limite=1`) ajuda.
- Se a API estiver fora do ar durante um deploy, o sitemap usa a lista de reserva das 8 peças Movement (`src/seo/fallbackProducts.js`).
- Nenhum SEO garante posição no Google. Ele cria as condições técnicas; ranking depende de tempo, conteúdo e links para o site (Instagram, por exemplo).
