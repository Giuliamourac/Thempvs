import { useEffect, useState } from 'react';
import { IMAGEM_PADRAO } from '../constants/catalog.js';

/** <img> que troca por uma imagem padrão quando não há URL ou ela falha ao carregar. */
export default function ProductImage({ src, alt = '', ...props }) {
  const [falhou, setFalhou] = useState(false);

  useEffect(() => setFalhou(false), [src]);

  return (
    <img
      src={!src || falhou ? IMAGEM_PADRAO : src}
      alt={alt}
      loading="lazy"
      onError={() => setFalhou(true)}
      {...props}
    />
  );
}
