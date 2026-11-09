/** Ícones simples em SVG (herdam a cor do texto via currentColor). */
const base = { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true, focusable: false };

export const IconeInstagram = (props) => (
  <svg {...base} {...props}>
    <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-3.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />
  </svg>
);

export const IconeFacebook = (props) => (
  <svg {...base} {...props}>
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3.5v-7h2.4l.4-3h-2.8V9.2c0-.9.3-1.5 1.6-1.5H18V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H9.5v3h2.6v7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
  </svg>
);

export const IconeTiktok = (props) => (
  <svg {...base} {...props}>
    <path d="M16.6 2h-3.2v13.2a2.9 2.9 0 1 1-2-2.7V9.2a6.1 6.1 0 1 0 5.2 6V8.9a7.4 7.4 0 0 0 4.3 1.4V7.1A4.3 4.3 0 0 1 16.6 2Z" />
  </svg>
);

export const IconeTelefone = (props) => (
  <svg {...base} {...props}>
    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1l-2.22 2.23Z" />
  </svg>
);

export const IconeEmail = (props) => (
  <svg {...base} {...props}>
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 3.2V18h16V7.2l-8 5.3-8-5.3ZM5.2 6 12 10.5 18.8 6H5.2Z" />
  </svg>
);

export const IconeWhatsapp = (props) => (
  <svg {...base} {...props}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 1.9a8.1 8.1 0 1 1-4.2 15l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 0 1 12 3.9Zm-3 3.6c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.9 4.5 4 2.2.9 2.7.7 3.2.6.5 0 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.8-.4-1.6-.8-2.4-1.7a8.7 8.7 0 0 1-1.1-1.7c-.1-.2 0-.4.1-.5l.4-.5.3-.4c.1-.2 0-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4H9Z" />
  </svg>
);

export const IconeCalendario = (props) => (
  <svg {...base} {...props}>
    <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1ZM5 10v9h14v-9H5Zm0-2h14V6H5v2Zm3 4h3v3H8v-3Z" />
  </svg>
);

export const ICONE_REDE = { instagram: IconeInstagram, facebook: IconeFacebook, tiktok: IconeTiktok };
