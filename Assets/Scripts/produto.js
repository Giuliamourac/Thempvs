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
});