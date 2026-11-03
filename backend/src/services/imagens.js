import sharp from 'sharp';
import { env } from '../config/env.js';

export async function processarImagem(buffer) {
  const saida = await sharp(buffer, { animated: true, limitInputPixels: 80_000_000 })
    .rotate()
    .resize({
      width: env.imagem.ladoMaximo,
      height: env.imagem.ladoMaximo,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: env.imagem.qualidade })
    .toBuffer();

  return { buffer: saida, extensao: 'webp', contentType: 'image/webp' };
}
