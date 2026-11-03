import sharp from 'sharp';
import { env } from '../config/env.js';

/**
 * Prepara a imagem enviada no painel para a loja:
 *  - corrige a rotação das fotos de celular (EXIF) e remove os metadados (localização, câmera...);
 *  - reduz para no máximo `env.imagem.ladoMaximo` px no maior lado (nunca amplia);
 *  - converte para WebP (bem menor que JPG/PNG, com transparência e GIF animado).
 * Lança erro se o arquivo não for uma imagem decodificável.
 */
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
