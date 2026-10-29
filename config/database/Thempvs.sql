use thempvs;

create table categorias(
	id_categoria int identity(1,1),
	nm_categoria varchar(80) unique not null,
	slug varchar(150) unique, --  nome para armazenamento de url que segue aquela categoria (em vez de um numero na url fica o slug)
	descricao varchar(max),
	ativa bit default 1 -- para considerar a categoria ativa ou não, o 1 é de true

	constraint PK_id_categoria primary key (id_categoria)
);

create table colecao(
	id_colecao int identity(1,1),
	nm_colecao varchar(100),
	slug varchar(150) unique, --  nome para armazenamento de url que segue aquela categoria (em vez de um numero na url fica o slug)
	descricao varchar(max),
	ativa bit default 1

	constraint PK_id_colecao primary key (id_colecao)
);

-- precisa ver pois não lembro como era organiza tamanhos (sei que vai do PP ao XGG, mas algumas peças tem diferenciação)
create table tamanho(
	id_tamanho int identity(1,1),
	sg_tamanho varchar(5) not null unique,

	constraint PK_id_tamanho primary key (id_tamanho)
);

create table usuario(
	id_usuario int identity(1,1),
	nm_usuario varchar(150) not null,
	ds_email varchar(120) not null unique,
	senha_hash varchar(255) not null,
	cpf char(11) unique, -- sem pontuação
	telefone varchar(20),
	perfil varchar(10) check(perfil in ('cliente','admin')) not null,
	ativo bit default 1,
	dt_criado date default GetDate()

	constraint PK_id_usuario primary key (id_usuario)
);

-- rever se os eventos serão fixos ou se ela vai poder colocar
create table eventos(
	id_evento int identity(1,1),
	nm_titulo varchar(150) not null,
	descricao varchar(max),
	ds_endereco varchar(150) not null,
	data_evento datetime not null

	constraint PK_id_evento primary key (id_evento)
);

create table produtos(
	id_produto int identity(1,1),
	id_categoria int not null,
	id_colecao int,
	nm_produto varchar(150) not null,
	slug varchar(150) not null unique,
	descricao varchar(max),
	preco decimal(10,2) not null,
	preco_promocional decimal(10,2),
	peso_gramas  int not null -- pode ser usado para calculo de frete

	constraint PK_id_produto primary key (id_produto),
		constraint FK_id_categoria_produtos foreign key (id_categoria) references categorias(id_categoria),
			constraint FK_id_colecao_produtos foreign key (id_colecao) references colecao(id_colecao)
);


-- conferir se isso é a melhor maneira de fazer
create table medidas_produto(
	id_produto int identity(1,1),
	busto_cm decimal(5,1),
	cintura_cm decimal(5,1),
	quadril_cm decimal(5,1),
	ombros_cm decimal(5,1),
	comprimento_cm decimal(5,1),
	manga_cm decimal(5,1),
	coxa_cm decimal(5,1)

	constraint FK_id_produto_medidas foreign key (id_produto) references produtos(id_produto),
);

create table enderecos(
	id_endereco int identity(1,1),
	id_usuario int,
	destinatario varchar(150) not null,
	cep char(8),
	ds_rua varchar(150),
	nmr_casa varchar(10),
	ds_complemento varchar(100),
	nm_bairro varchar(80),
	nm_cidade varchar(80),
	uf char(2),
	padrao bit

	constraint PK_id_endereco primary key (id_endereco),
		constraint FK_id_usuario_endereco foreign key (id_usuario) references usuario(id_usuario),
);

create table carrinho(
	id_carrinho int identity(1,1),
	id_usuario int

	constraint PK_id_carrinho primary key (id_carrinho),
		constraint FK_id_usuario_carrinho foreign key (id_usuario) references usuario(id_usuario)
);

create table carrinho_item(
	id_carrinho_item int identity(1,1),
	id_carrinho int,
	id_produto int,
	quantidade int check (quantidade > 0)

	constraint FK_id_usuario foreign key (id_carrinho) references carrinho(id_carrinho),
		constraint FK_id_produto_carrinho foreign key (id_produto) references produtos(id_produto)
);

-- acho que pode diminuir ou virar procedure
create table pedido(
	id_pedido bigint identity(1,1), --um tipo de int que aguenta mais coisa
	id_usuario int,
	id_endereco int,
	subtotal decimal(10,2),
	valor_frete decimal(10,2),
	total decimal(10,2),
	status_pedido varchar(50) check(status_pedido in ('Pendente','Pago','Enviado','Cancelado','Entregue'))

	constraint PK_pedido primary key (id_pedido),
		constraint FK_id_usuario_pedido foreign key (id_usuario) references usuario(id_usuario),
			constraint FK_pedido_endereco foreign key (id_endereco) references enderecos(id_endereco)
);

create table item_pedidos(
	id_item_pedido bigint identity(1,1),
	id_pedido bigint,
	id_produto int,
	quantidade int,
	preco_total decimal(10,2)

	constraint PK_item_pedido primary key (id_item_pedido),
		constraint FK_id_pedido_itens foreign key (id_pedido) references pedido(id_pedido),
);

create table pagamento(
	id_pagamento bigint identity(1,1),
	id_pedido bigint, 
	gateway varchar(30),
	metodo varchar(30) check(metodo in ('debito','credito','pix','boleto')),
	status_pagamento varchar(30) check(status_pagamento in ('pendente','aprovado','recusado','estornado')),
	valor_pagamento decimal(10,2),
	qt_parcelas int,
	dt_pagamento date default getdate()

	constraint PK_id_pagamento primary key (id_pagamento),
		constraint FK_id_pedido_pagamento foreign key (id_pedido) references pedido(id_pedido)
);

create table envios(
	id_envio bigint identity(1,1),
	id_pedido bigint,
	nm_transportadora varchar(100),
	tp_servico varchar(50),
	data_postagem date,
	data_entrega_prevista date,

	constraint PK_id_envio primary key (id_envio),
		constraint FK_id_pedido_envio foreign key (id_pedido) references pedido(id_pedido)
);