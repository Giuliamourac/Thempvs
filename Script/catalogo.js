document.addEventListener("DOMContentLoaded", () => {

    // Dados fictícios apenas para demonstrar a interface do catálogo.
    // Futuramente devem ser substituídos por produtos reais.
    const SIZE_LABELS = {
        pp: "P",
        m: "M",
        g: "G",
        gg: "GG",
        "p-infantil": "P Infantil",
        "m-infantil": "M Infantil",
        "g-infantil": "G Infantil",
        "gg-infantil": "GG Infantil"
    };

    const TAMANHOS_ADULTO = ["pp", "m", "g", "gg"];
    const TAMANHOS_INFANTIL = ["p-infantil", "m-infantil", "g-infantil", "gg-infantil"];

    const PRODUTOS = [
        { id: "p01", nome: "Camiseta de botão...", preco: 125.90, peca: "camisetas", cor: "cinza", tamanhos: TAMANHOS_ADULTO, imagem: "Camiseta+Botao" },
        { id: "p02", nome: "Calça Jean reta...", preco: 210.00, peca: "calcas", cor: "azul", tamanhos: TAMANHOS_ADULTO, imagem: "Calca+Jeans" },
        { id: "p03", nome: "Camiseta Thempvs dance...", preco: 85.90, peca: "camisetas", cor: "branco", tamanhos: TAMANHOS_ADULTO, imagem: "Camiseta+Dance" },
        { id: "p04", nome: "Camiseta Moletom es...", preco: 125.90, peca: "camisetas", cor: "azul", tamanhos: TAMANHOS_ADULTO, imagem: "Moletom" },
        { id: "p05", nome: "Camiseta Out Odinary", preco: 210.00, peca: "camisetas", cor: "branco", tamanhos: TAMANHOS_ADULTO, imagem: "Out+Ordinary" },
        { id: "p06", nome: "Jaqueta bola 8 color...", preco: 85.90, peca: "casacos", cor: "preto", tamanhos: TAMANHOS_ADULTO, imagem: "Jaqueta+Bola+8" },
        { id: "p07", nome: "Camiseta Estampada NR.", preco: 125.90, peca: "camisetas", cor: "preto", tamanhos: TAMANHOS_ADULTO, imagem: "Estampada+NR" },
        { id: "p08", nome: "Boné Somotic-Smile", preco: 210.00, peca: null, cor: "cinza", tamanhos: TAMANHOS_ADULTO, imagem: "Bone+Somotic" },
        { id: "p09", nome: "Camiseta Polo Street", preco: 85.90, peca: "camisetas", cor: "verde", tamanhos: TAMANHOS_ADULTO, imagem: "Polo+Street" },
        { id: "p10", nome: "Camiseta Baisebol lisa...", preco: 182.90, peca: "camisetas", cor: "preto", tamanhos: TAMANHOS_ADULTO, imagem: "Baisebol+Lisa" },
        { id: "p11", nome: "Colete bombap...", preco: 180.90, peca: "casacos", cor: "offwhite", tamanhos: TAMANHOS_ADULTO, imagem: "Colete+Bombap" },
        { id: "p12", nome: "Calça cargo preta...", preco: 135.00, peca: "calcas", cor: "preto", tamanhos: TAMANHOS_ADULTO, imagem: "Calca+Cargo" },
        { id: "p13", nome: "Jaqueta Jean Ravena...", preco: 360.00, peca: "casacos", cor: "azul", tamanhos: TAMANHOS_ADULTO, imagem: "Jaqueta+Ravena" },
        { id: "p14", nome: "Baby-te Blooklyn...", preco: 65.00, peca: "camisetas", cor: "branco", tamanhos: TAMANHOS_ADULTO, imagem: "Baby+Te+Blooklyn" },
        { id: "p15", nome: "Short Thempvs moletom...", preco: 95.00, peca: "shorts", cor: "cinza", tamanhos: TAMANHOS_ADULTO, imagem: "Short+Moletom" },
        { id: "p16", nome: "Bermuda cargo verde...", preco: 120.00, peca: "bermudas", cor: "verde", tamanhos: TAMANHOS_ADULTO, imagem: "Bermuda+Cargo" },
        { id: "p17", nome: "Conjunto moletom duplo...", preco: 250.00, peca: "conjuntos", cor: "preto", tamanhos: TAMANHOS_ADULTO, imagem: "Conjunto+Moletom" },
        { id: "p18", nome: "Camiseta infantil Thempvs...", preco: 75.00, peca: "camisetas", cor: "azul", tamanhos: TAMANHOS_INFANTIL, imagem: "Camiseta+Infantil" },
        { id: "p19", nome: "Conjunto infantil moletom...", preco: 140.00, peca: "conjuntos", cor: "cinza", tamanhos: TAMANHOS_INFANTIL, imagem: "Conjunto+Infantil" }
    ];

    const QUANTIDADE_INICIAL = 9;
    const QUANTIDADE_POR_CLIQUE = 6;

    // ---------- Elementos ----------
    const grade = document.getElementById("gradeProdutos");
    const containerCarregarMais = document.getElementById("containerCarregarMais");
    const botaoCarregarMais = document.getElementById("botaoCarregarMais");
    const barraFiltros = document.getElementById("barraFiltros");
    const campoBusca = document.getElementById("buscaProdutos");

    if (!grade) return;

    let quantidadeVisivel = QUANTIDADE_INICIAL;

    // ---------- Utilidades ----------
    function normalizar(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function formatarPreco(valor) {
        return "R$ " + valor.toFixed(2).replace(".", ",");
    }

    function valoresMarcados(name) {
        return Array.from(barraFiltros.querySelectorAll(`input[name="${name}"]:checked`))
            .map((input) => input.value);
    }

    // ---------- Filtragem ----------
    function obterProdutosFiltrados() {
        const pecasSelecionadas = valoresMarcados("peca");
        const coresSelecionadas = valoresMarcados("cor");
        const tamanhosSelecionados = valoresMarcados("tamanho");
        const termoBusca = normalizar(campoBusca ? campoBusca.value : "");

        return PRODUTOS.filter((produto) => {
            const atendePeca = pecasSelecionadas.length === 0 ||
                (produto.peca && pecasSelecionadas.includes(produto.peca));

            const atendeCor = coresSelecionadas.length === 0 ||
                coresSelecionadas.includes(produto.cor);

            const atendeTamanho = tamanhosSelecionados.length === 0 ||
                produto.tamanhos.some((tamanho) => tamanhosSelecionados.includes(tamanho));

            const atendeBusca = termoBusca === "" ||
                normalizar(produto.nome).includes(termoBusca);

            return atendePeca && atendeCor && atendeTamanho && atendeBusca;
        });
    }

    // ---------- Criação de um cartão ----------
    function criarCartao(produto) {
        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";

        const link = document.createElement("a");
        link.href = "../Pages/perfil-produto.html";
        link.className = "link-produto";
        link.innerHTML = `
            <div class="imagem-produto">
                <img src="https://placehold.co/300x400/e0e0e0/333333?text=${produto.imagem}" alt="${produto.nome}">
            </div>
            <div class="info-produto">
                <h4 class="titulo-produto">${produto.nome}</h4>
                <span class="preco-produto">${formatarPreco(produto.preco)}</span>
            </div>
        `;
        cartao.appendChild(link);

        const tamanhosContainer = document.createElement("div");
        tamanhosContainer.className = "tamanhos-produto";

        produto.tamanhos.forEach((tamanho) => {
            const botaoTamanho = document.createElement("button");
            botaoTamanho.type = "button";
            botaoTamanho.className = "tamanho-produto";
            botaoTamanho.textContent = SIZE_LABELS[tamanho] || tamanho;
            botaoTamanho.setAttribute("aria-pressed", "false");
            botaoTamanho.setAttribute("aria-label", `Selecionar tamanho ${SIZE_LABELS[tamanho] || tamanho}`);

            botaoTamanho.addEventListener("click", () => {
                const jaSelecionado = botaoTamanho.classList.contains("selecionado");

                // Garante que a seleção de tamanho é independente por cartão.
                tamanhosContainer.querySelectorAll(".tamanho-produto").forEach((botao) => {
                    botao.classList.remove("selecionado");
                    botao.setAttribute("aria-pressed", "false");
                });

                if (!jaSelecionado) {
                    botaoTamanho.classList.add("selecionado");
                    botaoTamanho.setAttribute("aria-pressed", "true");
                }
            });

            tamanhosContainer.appendChild(botaoTamanho);
        });

        cartao.appendChild(tamanhosContainer);
        return cartao;
    }

    // ---------- Renderização ----------

    // Atualiza a visibilidade do botão "Carregar mais" de acordo com o total já
    // exibido e o total de produtos que atendem aos filtros/busca atuais.
    function atualizarBotaoCarregarMais(quantidadeExibida, totalFiltrado) {
        containerCarregarMais.hidden = quantidadeExibida >= totalFiltrado;
    }

    // Renderização completa: usada na primeira carga e sempre que os filtros
    // ou a busca mudam, já que o conjunto de resultados muda por completo.
    function renderizarCompleto() {
        const produtosFiltrados = obterProdutosFiltrados();

        grade.innerHTML = "";

        if (produtosFiltrados.length === 0) {
            const mensagem = document.createElement("p");
            mensagem.className = "estado-vazio";
            mensagem.textContent = "Nenhum produto encontrado para os filtros selecionados.";
            grade.appendChild(mensagem);

            containerCarregarMais.hidden = true;
            return;
        }

        quantidadeVisivel = Math.min(quantidadeVisivel, produtosFiltrados.length);

        const fragmento = document.createDocumentFragment();
        produtosFiltrados.slice(0, quantidadeVisivel).forEach((produto) => {
            fragmento.appendChild(criarCartao(produto));
        });
        grade.appendChild(fragmento);

        atualizarBotaoCarregarMais(quantidadeVisivel, produtosFiltrados.length);
    }

    // Reinicia a paginação e refaz a grade do zero (usado ao mudar filtro/busca).
    function reiniciarEResultados() {
        quantidadeVisivel = QUANTIDADE_INICIAL;
        renderizarCompleto();
    }

    // Acrescenta apenas os próximos produtos à grade já existente, sem recriar
    // os cards anteriores — preservando a seleção de tamanho feita neles.
    function carregarMaisProdutos() {
        const produtosFiltrados = obterProdutosFiltrados();
        const proximaQuantidade = Math.min(quantidadeVisivel + QUANTIDADE_POR_CLIQUE, produtosFiltrados.length);

        const novosProdutos = produtosFiltrados.slice(quantidadeVisivel, proximaQuantidade);
        const fragmento = document.createDocumentFragment();
        novosProdutos.forEach((produto) => {
            fragmento.appendChild(criarCartao(produto));
        });
        grade.appendChild(fragmento);

        quantidadeVisivel = proximaQuantidade;
        atualizarBotaoCarregarMais(quantidadeVisivel, produtosFiltrados.length);
    }

    // ---------- Eventos ----------
    barraFiltros.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener("change", reiniciarEResultados);
    });

    if (campoBusca) {
        campoBusca.addEventListener("input", reiniciarEResultados);
    }

    botaoCarregarMais.addEventListener("click", carregarMaisProdutos);

    // ---------- Primeira renderização ----------
    renderizarCompleto();
});