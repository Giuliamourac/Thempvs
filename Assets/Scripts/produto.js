document.addEventListener("DOMContentLoaded", () => {
    const btnVerMais = document.getElementById("btnVerMais");
    const textoExtra = document.getElementById("textoExtra");

    if (btnVerMais && textoExtra) {
        btnVerMais.addEventListener("click", () => {
            // Alterna a classe 'ativo' no texto oculto
            textoExtra.classList.toggle("ativo");

            // Atualiza o rótulo do botão de acordo com o estado
            if (textoExtra.classList.contains("ativo")) {
                btnVerMais.textContent = "Ver menos";
            } else {
                btnVerMais.textContent = "Ver mais";
            }
        });
    }

    // ---------- Adicionar ao carrinho ----------
    // Usa o módulo compartilhado carrinho-store.js (mesmo carrinho da página carrinho.html).
    const btnAdicionar = document.querySelector(".btn-adicionar-carrinho");
    const avisoCarrinho = document.getElementById("avisoCarrinho");

    if (btnAdicionar && window.ThempvsCarrinho) {
        const carrinho = window.ThempvsCarrinho.criar();

        btnAdicionar.addEventListener("click", () => {
            const tamanhoMarcado = document.querySelector('input[name="tamanhoDetalhe"]:checked');

            if (!avisoCarrinho) return;

            if (!tamanhoMarcado) {
                avisoCarrinho.textContent = "Escolha um tamanho antes de adicionar ao carrinho.";
                avisoCarrinho.hidden = false;
                return;
            }

            const adicionado = carrinho.adicionar({
                produtoId: btnAdicionar.dataset.produtoId,
                nome: btnAdicionar.dataset.nome,
                precoCentavos: Number(btnAdicionar.dataset.precoCentavos),
                cor: btnAdicionar.dataset.cor,
                tamanho: tamanhoMarcado.value,
                imagem: btnAdicionar.dataset.imagem,
                quantidade: 1
            });

            avisoCarrinho.textContent = adicionado
                ? "Produto adicionado ao carrinho."
                : "Não foi possível adicionar o produto.";
            avisoCarrinho.hidden = false;
        });
    }
});
