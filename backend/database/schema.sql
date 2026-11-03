-- =====================================================================
-- Thempvs — schema MySQL
--
-- É o seu script original (mesmas tabelas, colunas e constraints) com os
-- ajustes marcados com "AJUSTE". Tudo é "IF NOT EXISTS": pode ser executado
-- várias vezes sem apagar dados.
--
--   AJUSTE 1  tamanho.sg_tamanho   VARCHAR(5) -> VARCHAR(30)
--             (o layout tem tamanhos como "GG Infantil", que não cabem em 5)
--   AJUSTE 2  produtos             + coluna imagem_url
--   AJUSTE 3  novas tabelas        cores, produto_tamanho, produto_cor
--             (as opções de tamanho/cor de um produto, na ordem do painel)
--   AJUSTE 4  nova tabela          produto_variacao  (ESTOQUE por tamanho x cor)
--   AJUSTE 5  pedido               + dt_pedido
--   AJUSTE 6  item_pedidos         + id_variacao, nm_produto, ds_tamanho, ds_cor,
--             preco_unitario  (o que foi comprado, com o preço da hora da compra)
--   AJUSTE 7  nova tabela          produto_imagem  (galeria: várias imagens por produto, em ordem;
--             a primeira é a capa e fica copiada em produtos.imagem_url)
--   AJUSTE 8  medidas_produto      + id_tamanho  (uma linha de medidas POR TAMANHO; NULL = medidas gerais)
--   AJUSTE 9  medidas_produto      + id_medida   (chave primária; MySQL em nuvem recusa tabela sem ela)
--
-- Se as tabelas já existem no seu MySQL (criadas por uma versão anterior),
-- rode `npm run db:init` na pasta backend: ele aplica os AJUSTES nelas e
-- move o estoque antigo (produtos.estoque) para produto_variacao.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS thempvs;
USE thempvs;

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INT AUTO_INCREMENT,
    nm_categoria VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(150) UNIQUE,
    descricao TEXT,
    ativa BOOLEAN DEFAULT TRUE,
    CONSTRAINT PK_id_categoria PRIMARY KEY (id_categoria)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS colecao (
    id_colecao INT AUTO_INCREMENT,
    nm_colecao VARCHAR(100),
    slug VARCHAR(150) UNIQUE,
    descricao TEXT,
    ativa BOOLEAN DEFAULT TRUE,
    CONSTRAINT PK_id_colecao PRIMARY KEY (id_colecao)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tamanho (
    id_tamanho INT AUTO_INCREMENT,
    sg_tamanho VARCHAR(30) NOT NULL UNIQUE,                       -- AJUSTE 1 (era VARCHAR(5))
    CONSTRAINT PK_id_tamanho PRIMARY KEY (id_tamanho)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT AUTO_INCREMENT,
    nm_usuario VARCHAR(150) NOT NULL,
    ds_email VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cpf CHAR(11) UNIQUE,
    telefone VARCHAR(20),
    perfil ENUM('cliente', 'admin') NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    dt_criado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_id_usuario PRIMARY KEY (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS eventos (
    id_evento INT AUTO_INCREMENT,
    nm_titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    ds_endereco VARCHAR(150) NOT NULL,
    data_evento DATETIME NOT NULL,
    CONSTRAINT PK_id_evento PRIMARY KEY (id_evento)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produtos (
    id_produto INT AUTO_INCREMENT,
    id_categoria INT NOT NULL,
    id_colecao INT,
    nm_produto VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    preco_promocional DECIMAL(10,2),
    peso_gramas INT NOT NULL,
    imagem_url VARCHAR(500) NULL,                                 -- AJUSTE 2
    CONSTRAINT PK_id_produto PRIMARY KEY (id_produto),
    CONSTRAINT FK_id_categoria_produtos FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    CONSTRAINT FK_id_colecao_produtos FOREIGN KEY (id_colecao) REFERENCES colecao(id_colecao)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- AJUSTE 3 e 4 — cores, opções do produto e ESTOQUE por variação
--   produto_tamanho / produto_cor : quais tamanhos e cores o produto tem
--                                   ("ordem" = sequência escolhida no painel)
--   produto_variacao              : uma linha por combinação tamanho x cor,
--                                   com o estoque daquela combinação.
--                                   Produto sem cores => id_cor NULL.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cores (
    id_cor INT AUTO_INCREMENT,
    nm_cor VARCHAR(30) NOT NULL UNIQUE,
    CONSTRAINT PK_id_cor PRIMARY KEY (id_cor)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produto_tamanho (
    id_produto INT NOT NULL,
    id_tamanho INT NOT NULL,
    ordem SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT PK_produto_tamanho PRIMARY KEY (id_produto, id_tamanho),
    CONSTRAINT FK_produto_tamanho_produto FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE CASCADE,
    CONSTRAINT FK_produto_tamanho_tamanho FOREIGN KEY (id_tamanho) REFERENCES tamanho(id_tamanho)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produto_cor (
    id_produto INT NOT NULL,
    id_cor INT NOT NULL,
    ordem SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT PK_produto_cor PRIMARY KEY (id_produto, id_cor),
    CONSTRAINT FK_produto_cor_produto FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE CASCADE,
    CONSTRAINT FK_produto_cor_cor FOREIGN KEY (id_cor) REFERENCES cores(id_cor)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produto_variacao (
    id_variacao INT AUTO_INCREMENT,
    id_produto INT NOT NULL,
    id_tamanho INT NOT NULL,
    id_cor INT NULL,
    estoque INT NOT NULL DEFAULT 0,
    CONSTRAINT PK_id_variacao PRIMARY KEY (id_variacao),
    CONSTRAINT UQ_variacao UNIQUE (id_produto, id_tamanho, id_cor),
    CONSTRAINT CK_variacao_estoque CHECK (estoque >= 0),
    CONSTRAINT FK_variacao_produto FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE CASCADE,
    CONSTRAINT FK_variacao_tamanho FOREIGN KEY (id_tamanho) REFERENCES tamanho(id_tamanho),
    CONSTRAINT FK_variacao_cor FOREIGN KEY (id_cor) REFERENCES cores(id_cor)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medidas_produto (
    id_medida INT AUTO_INCREMENT,                                 -- AJUSTE 9 (MySQL em nuvem, como o Aiven, exige chave primária)
    id_produto INT,
    id_tamanho INT NULL,                                          -- AJUSTE 8
    busto_cm DECIMAL(5,1),
    cintura_cm DECIMAL(5,1),
    quadril_cm DECIMAL(5,1),
    ombros_cm DECIMAL(5,1),
    comprimento_cm DECIMAL(5,1),
    manga_cm DECIMAL(5,1),
    coxa_cm DECIMAL(5,1),
    CONSTRAINT PK_id_medida PRIMARY KEY (id_medida),
    CONSTRAINT FK_id_produto_medidas FOREIGN KEY (id_produto) REFERENCES produtos(id_produto),
    CONSTRAINT FK_medidas_tamanho FOREIGN KEY (id_tamanho) REFERENCES tamanho(id_tamanho)
) ENGINE=InnoDB;

-- AJUSTE 7 — galeria de imagens do produto (a ordem define a capa: ordem 0 = primeira)
CREATE TABLE IF NOT EXISTS produto_imagem (
    id_imagem INT AUTO_INCREMENT,
    id_produto INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    ordem SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT PK_id_imagem PRIMARY KEY (id_imagem),
    CONSTRAINT FK_imagem_produto FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE CASCADE,
    INDEX idx_imagem_produto (id_produto, ordem)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enderecos (
    id_endereco INT AUTO_INCREMENT,
    id_usuario INT,
    destinatario VARCHAR(150) NOT NULL,
    cep CHAR(8),
    ds_rua VARCHAR(150),
    nmr_casa VARCHAR(10),
    ds_complemento VARCHAR(100),
    nm_bairro VARCHAR(80),
    nm_cidade VARCHAR(80),
    uf CHAR(2),
    padrao BOOLEAN,
    CONSTRAINT PK_id_endereco PRIMARY KEY (id_endereco),
    CONSTRAINT FK_id_usuario_endereco FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carrinho (
    id_carrinho INT AUTO_INCREMENT,
    id_usuario INT,
    CONSTRAINT PK_id_carrinho PRIMARY KEY (id_carrinho),
    CONSTRAINT FK_id_usuario_carrinho FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carrinho_item (
    id_carrinho_item INT AUTO_INCREMENT,
    id_carrinho INT,
    id_produto INT,
    quantidade INT CHECK (quantidade > 0),
    CONSTRAINT PK_id_carrinho_item PRIMARY KEY (id_carrinho_item),
    CONSTRAINT FK_id_carrinho_item_carrinho FOREIGN KEY (id_carrinho) REFERENCES carrinho(id_carrinho),
    CONSTRAINT FK_id_produto_carrinho FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido (
    id_pedido BIGINT AUTO_INCREMENT,
    id_usuario INT,
    id_endereco INT,
    subtotal DECIMAL(10,2),
    valor_frete DECIMAL(10,2),
    total DECIMAL(10,2),
    status_pedido ENUM('Pendente', 'Pago', 'Enviado', 'Cancelado', 'Entregue'),
    dt_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- AJUSTE 5
    CONSTRAINT PK_pedido PRIMARY KEY (id_pedido),
    CONSTRAINT FK_id_usuario_pedido FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT FK_pedido_endereco FOREIGN KEY (id_endereco) REFERENCES enderecos(id_endereco)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS item_pedidos (
    id_item_pedido BIGINT AUTO_INCREMENT,
    id_pedido BIGINT,
    id_produto INT,
    quantidade INT,
    preco_total DECIMAL(10,2),
    id_variacao INT NULL,                                         -- AJUSTE 6
    nm_produto VARCHAR(150) NULL,                                 -- AJUSTE 6
    ds_tamanho VARCHAR(30) NULL,                                  -- AJUSTE 6
    ds_cor VARCHAR(30) NULL,                                      -- AJUSTE 6
    preco_unitario DECIMAL(10,2) NULL,                            -- AJUSTE 6
    CONSTRAINT PK_item_pedido PRIMARY KEY (id_item_pedido),
    CONSTRAINT FK_id_pedido_itens FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
    CONSTRAINT FK_id_produto_item_pedido FOREIGN KEY (id_produto) REFERENCES produtos(id_produto),
    CONSTRAINT FK_item_pedido_variacao FOREIGN KEY (id_variacao) REFERENCES produto_variacao(id_variacao) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pagamento (
    id_pagamento BIGINT AUTO_INCREMENT,
    id_pedido BIGINT,
    gateway VARCHAR(30),
    metodo ENUM('debito', 'credito', 'pix', 'boleto'),
    status_pagamento ENUM('pendente', 'aprovado', 'recusado', 'estornado'),
    valor_pagamento DECIMAL(10,2),
    qt_parcelas INT,
    dt_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_id_pagamento PRIMARY KEY (id_pagamento),
    CONSTRAINT FK_id_pedido_pagamento FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS envios (
    id_envio BIGINT AUTO_INCREMENT,
    id_pedido BIGINT,
    nm_transportadora VARCHAR(100),
    tp_servico VARCHAR(50),
    data_postagem DATE,
    data_entrega_prevista DATE,
    CONSTRAINT PK_id_envio PRIMARY KEY (id_envio),
    CONSTRAINT FK_id_pedido_envio FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
) ENGINE=InnoDB;
