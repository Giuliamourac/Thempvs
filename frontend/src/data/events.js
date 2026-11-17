import bannerCodigoDeRua from '../assets/banners/conheca.jpg';

/**
 * Eventos exibidos em "Quem Usa". Por enquanto só um, com dados fictícios.
 * O `slug` é o endereço do perfil: /quem-usa/evento/<slug>.
 */
export const EVENTOS = [
  {
    slug: 'codigo-de-rua',
    titulo: 'Código de Rua',
    tituloCompleto: 'Código de Rua — Encontro de Cultura Hip-Hop',
    categoria: 'Cultura urbana · Dança',
    banner: bannerCodigoDeRua,
    altBanner: 'Grupo de jovens vestindo peças Thempvs posando juntos',
    dataISO: '2026-12-12',
    data: '12/12/2026',
    dataExtenso: 'Sábado, 12 de dezembro de 2026',
    horario: '14h às 22h',
    local: 'Galpão Cultural Vila Beat',
    endereco: 'Rua do Ritmo, 482 – Barra Funda, São Paulo – SP',
    descricaoCurta:
      'Uma tarde inteira de breaking, grafite ao vivo, DJs e moda urbana para celebrar a essência do hip-hop e a cultura que nasce nas ruas.',
    descricaoCompleta: [
      'Mais do que um evento, uma conexão entre ritmos, histórias e vivências que nascem nas ruas. O Código de Rua celebra a essência do hip-hop, dando voz à expressão, à arte e à resistência por meio da dança, do breaking, do graffiti e dos beats que movimentam a cultura urbana.',
      'Um espaço de atitude, criatividade e liberdade, onde cada rima carrega uma mensagem, cada batida conta uma história e cada pessoa faz parte do movimento.',
      'Durante oito horas, o público encontra oficinas abertas para quem quer começar a dançar, um mural coletivo pintado ao vivo, batalhas de breaking entre crews de várias cidades, DJs na pista e uma feira de moda urbana com a coleção Movement da Thempvs.',
    ],
    programacao: [
      { hora: '14h00', titulo: 'Abertura e credenciamento', detalhe: 'Recepção do público e música ambiente com DJ residente.' },
      { hora: '14h30', titulo: 'Oficina de breaking para iniciantes', detalhe: 'Passos básicos e noções de ritmo com dançarinos convidados. Vagas limitadas.' },
      { hora: '16h00', titulo: 'Grafite ao vivo', detalhe: 'Artistas pintam um mural coletivo e o público pode participar da finalização.' },
      { hora: '17h00', titulo: 'Feira de moda urbana', detalhe: 'Peças da coleção Movement e marcas independentes parceiras.' },
      { hora: '18h30', titulo: 'Batalha de breaking', detalhe: 'Crews de diferentes cidades disputam o título da noite.' },
      { hora: '20h00', titulo: 'Cypher aberto e DJ set', detalhe: 'Roda livre de dança e rima, com pista aberta até o encerramento.' },
      { hora: '21h30', titulo: 'Premiação e encerramento', detalhe: 'Entrega dos troféus e agradecimentos.' },
    ],
    informacoes: [
      'Entrada gratuita. Pedimos a doação de 1 kg de alimento não perecível, destinado a coletivos da região.',
      'Classificação livre. Menores de 12 anos devem estar acompanhados por um responsável.',
      'Use roupas confortáveis e tênis, principalmente se for participar das oficinas e da roda de dança.',
      'As vagas das oficinas são limitadas e preenchidas por ordem de chegada, com inscrição no local.',
      'O galpão é coberto, tem rampa de acesso, banheiros adaptados e bebedouros.',
      'Chegue com antecedência: a capacidade do espaço é limitada.',
    ],
    organizacao: {
      nome: 'Thempvs',
      descricao: 'Marca de moda urbana e dança que realiza o evento em parceria com o Coletivo Ritmo Livre, grupo de dançarinos e artistas de rua.',
    },
  },
];

export const buscarEvento = (slug) => EVENTOS.find((evento) => evento.slug === slug) ?? null;
