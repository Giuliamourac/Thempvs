import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_ALT,
  DEFAULT_TITLE,
  KEYWORDS,
  LOCALE,
  SITE_NAME,
  absoluteUrl,
  metaDaRota,
} from './siteConfig.js';
import { jsonLdDaPagina } from './structuredData.js';

const ATRIBUTO_JSONLD = 'data-seo-jsonld';

function definirMeta(atributo, nome, conteudo) {
  const seletor = `meta[${atributo}="${nome}"]`;
  let el = document.head.querySelector(seletor);
  if (conteudo === null || conteudo === undefined || conteudo === '') {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(atributo, nome);
    document.head.appendChild(el);
  }
  el.setAttribute('content', conteudo);
}

function definirCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!url) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function definirJsonLd(dados) {
  document.head.querySelectorAll(`script[${ATRIBUTO_JSONLD}]`).forEach((el) => el.remove());
  const lista = (Array.isArray(dados) ? dados : [dados]).filter(Boolean);
  for (const item of lista) {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute(ATRIBUTO_JSONLD, '');
    el.textContent = JSON.stringify(item);
    document.head.appendChild(el);
  }
}

/**
 * Atualiza <title>, descrição, robots, canonical, Open Graph, Twitter Card e JSON-LD da página atual.
 * Não desenha nada na tela. Como o site é uma SPA, isso garante que cada rota troque seus metadados
 * (o HTML estático de cada página pública também é gerado no build por scripts/postbuild-seo.mjs).
 *
 * Props:
 *  title, description  → textos da página
 *  path                → caminho canônico ("/produtos/conjunto-ana"); null = sem canonical
 *  image               → caminho ou URL da imagem de compartilhamento (padrão: /og-image.jpg)
 *  type                → og:type ("website" | "product")
 *  noindex             → true para páginas privadas / sem conteúdo
 *  jsonLd              → objeto (ou lista) de dados estruturados
 */
export default function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  imageAlt = DEFAULT_IMAGE_ALT,
  type = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const chaveJsonLd = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const url = path ? absoluteUrl(path) : null;
    const imagem = absoluteUrl(image);

    document.title = title;
    definirMeta('name', 'description', description);
    definirMeta('name', 'keywords', KEYWORDS.join(', '));
    definirMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    definirCanonical(noindex ? null : url);

    definirMeta('property', 'og:type', type);
    definirMeta('property', 'og:site_name', SITE_NAME);
    definirMeta('property', 'og:locale', LOCALE);
    definirMeta('property', 'og:title', title);
    definirMeta('property', 'og:description', description);
    definirMeta('property', 'og:url', url);
    definirMeta('property', 'og:image', imagem);
    definirMeta('property', 'og:image:alt', imageAlt);

    definirMeta('name', 'twitter:card', 'summary_large_image');
    definirMeta('name', 'twitter:title', title);
    definirMeta('name', 'twitter:description', description);
    definirMeta('name', 'twitter:image', imagem);

    definirJsonLd(chaveJsonLd ? JSON.parse(chaveJsonLd) : null);
  }, [title, description, path, image, imageAlt, type, noindex, chaveJsonLd]);

  return null;
}

/**
 * Metadados de TODAS as rotas que não dependem de dados da API (home, produtos, sale, movement, contato,
 * quem usa, eventos, páginas privadas e 404). Fica no Layout. A página de produto usa <Seo> própria.
 */
export function RotaSeo() {
  const { pathname, search } = useLocation();
  const meta = metaDaRota(pathname, search);
  if (!meta) return null;

  return (
    <Seo
      title={meta.title}
      description={meta.description}
      path={meta.path}
      noindex={meta.noindex}
      jsonLd={meta.noindex || !meta.path ? null : jsonLdDaPagina(meta.path)}
    />
  );
}
