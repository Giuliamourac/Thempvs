import { processarImagem } from '../services/imagens.js';
import { salvarImagem } from '../services/storage.js';
import { HttpError } from '../utils/httpError.js';

// Só imagens "seguras" (SVG fica de fora de propósito: pode conter script).
// O tipo é conferido pelos primeiros bytes do arquivo, não só pelo que o navegador informa.
const TIPOS = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  'image/gif': (b) => ['GIF87a', 'GIF89a'].includes(b.toString('ascii', 0, 6)),
};

export async function uploadImage(req, res) {
  const arquivo = req.file;
  if (!arquivo) throw new HttpError(400, 'Selecione uma imagem para enviar.');

  const confere = TIPOS[arquivo.mimetype];
  if (!confere || !confere(arquivo.buffer)) {
    throw new HttpError(400, 'Formato inválido. Envie uma imagem JPG, PNG, WebP ou GIF.');
  }

  let processada;
  try {
    processada = await processarImagem(arquivo.buffer);
  } catch {
    throw new HttpError(400, 'Não foi possível ler esta imagem. O arquivo pode estar corrompido.');
  }

  // Nome gerado pelo servidor: o nome original do arquivo nunca é usado.
  const url = await salvarImagem(processada.buffer, processada, { baseUrl: `${req.protocol}://${req.get('host')}` });
  res.status(201).json({ url, bytes: processada.buffer.length, bytes_originais: arquivo.buffer.length });
}
