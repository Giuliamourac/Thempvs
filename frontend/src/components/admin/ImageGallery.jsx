import { useRef, useState } from 'react';
import ProductImage from '../ProductImage.jsx';

const MAXIMO = 8;

/**
 * Galeria do produto: envia arquivos (vários de uma vez), aceita colar uma URL, reordena e remove.
 * A PRIMEIRA imagem é a capa (a que aparece nas listagens).
 * `imagens` = lista de URLs; `onChange(novaLista)`; `onEnviar(file)` devolve a URL salva (ou lança).
 */
export default function ImageGallery({ imagens, onChange, onEnviar, onErro, erro }) {
  const arquivoRef = useRef(null);
  const [enviando, setEnviando] = useState(0);
  const [url, setUrl] = useState('');

  const cheia = imagens.length >= MAXIMO;

  const aoEscolher = async (evento) => {
    const arquivos = [...(evento.target.files ?? [])];
    evento.target.value = '';
    if (arquivos.length === 0) return;

    const vagas = MAXIMO - imagens.length;
    if (arquivos.length > vagas) onErro?.(`Cabem só mais ${vagas} imagem(ns) (máximo ${MAXIMO}). As demais foram ignoradas.`);

    let atual = imagens;
    for (const arquivo of arquivos.slice(0, Math.max(vagas, 0))) {
      setEnviando((n) => n + 1);
      try {
        const nova = await onEnviar(arquivo);
        atual = [...atual, nova];
        onChange(atual); // mostra cada imagem assim que ela chega
      } catch {
        /* o pai já mostrou o erro desta imagem; segue com as próximas */
      } finally {
        setEnviando((n) => n - 1);
      }
    }
  };

  const adicionarUrl = () => {
    const valor = url.trim();
    if (!valor) return;
    if (!/^https?:\/\/\S+$/i.test(valor)) {
      onErro?.('A URL da imagem deve começar com http:// ou https://.');
      return;
    }
    if (!imagens.includes(valor)) onChange([...imagens, valor]);
    setUrl('');
  };

  const mover = (indice, delta) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= imagens.length) return;
    const copia = [...imagens];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    onChange(copia);
  };

  return (
    <div className="admin-campo">
      <span className="admin-rotulo" id="adm-galeria-rotulo">
        Imagens ({imagens.length}/{MAXIMO})
      </span>

      {imagens.length > 0 && (
        <ul className="admin-galeria" aria-labelledby="adm-galeria-rotulo">
          {imagens.map((src, indice) => (
            <li key={src} className="admin-galeria-item">
              <div className="admin-galeria-img">
                <ProductImage src={src} alt={`Imagem ${indice + 1}`} />
                {indice === 0 && <span className="admin-galeria-capa">Capa</span>}
              </div>
              <div className="admin-galeria-acoes">
                <button type="button" className="admin-botao pequeno secundario" disabled={indice === 0}
                  onClick={() => mover(indice, -1)} aria-label={`Mover imagem ${indice + 1} para trás`}>
                  ←
                </button>
                <button type="button" className="admin-botao pequeno secundario" disabled={indice === imagens.length - 1}
                  onClick={() => mover(indice, 1)} aria-label={`Mover imagem ${indice + 1} para frente`}>
                  →
                </button>
                <button type="button" className="admin-botao pequeno perigo"
                  onClick={() => onChange(imagens.filter((_, i) => i !== indice))} aria-label={`Remover imagem ${indice + 1}`}>
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="admin-imagem-linha">
        <input
          ref={arquivoRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          aria-label="Escolher arquivos de imagem"
          onChange={aoEscolher}
        />
        <button type="button" className="admin-botao secundario" disabled={cheia || enviando > 0}
          onClick={() => arquivoRef.current?.click()}>
          {enviando > 0 ? `Enviando (${enviando})...` : 'Enviar imagens'}
        </button>

        <input
          type="url"
          className="admin-input"
          placeholder="ou cole uma URL (https://...)"
          aria-label="URL de uma imagem"
          value={url}
          disabled={cheia}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              adicionarUrl();
            }
          }}
        />
        <button type="button" className="admin-botao secundario" disabled={cheia || !url.trim()} onClick={adicionarUrl}>
          Adicionar URL
        </button>
      </div>

      <p className="admin-dica">
        JPG, PNG, WebP ou GIF, até 5 MB cada. As imagens são reduzidas e otimizadas automaticamente. A primeira é a capa.
      </p>
      {erro && (
        <p className="admin-erro-campo" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
