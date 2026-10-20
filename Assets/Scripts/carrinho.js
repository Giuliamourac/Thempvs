/*
 * Thempvs — página de carrinho e checkout (interface e ações do usuário).
 *
 * Divisão de responsabilidades:
 *  - carrinho-store.js : dados do carrinho e cálculos (sem DOM)
 *  - carrinho.js       : este arquivo — renderização do resumo, etapas e validações
 *
 * Nada aqui envia dados a servidores. Dados de cartão NUNCA são gravados
 * (ficam apenas nos campos da tela, que são limpos ao concluir).
 */
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    var Carrinho = window.ThempvsCarrinho;
    if (!Carrinho) return;

    // ---------------------------------------------------------------
    // Dados de DEMONSTRAÇÃO — só são usados com ?demo=1 na URL e ficam
    // em uma chave de storage separada, sem misturar com o carrinho real.
    // ---------------------------------------------------------------
    var ITENS_DEMONSTRACAO = [
        { produtoId: "demo-out-of-the-ordinary", nome: "Camiseta out of the ordinary", precoCentavos: 9000, quantidade: 1, cor: "Branco", tamanho: "G" },
        { produtoId: "demo-moletom-equipe", nome: "Camiseta Moletom Equipe Tempvs", precoCentavos: 13000, quantidade: 1, cor: "Azul", tamanho: "GG" },
        { produtoId: "demo-jaqueta-bola-oito", nome: "Jaqueta Bola Oito Colorida - Masculina", precoCentavos: 52000, quantidade: 1, cor: "Colorida", tamanho: "GG" },
        { produtoId: "demo-nr-dance", nome: "Camiseta NR - Tempvs Dance", precoCentavos: 6500, quantidade: 1, cor: "Preto", tamanho: "M" }
    ];

    var modoDemonstracao = new URLSearchParams(window.location.search).get("demo") === "1";

    var carrinho;
    if (modoDemonstracao) {
        carrinho = Carrinho.criar(Carrinho.CHAVE_DEMONSTRACAO);
        var jaIniciada = false;
        try { jaIniciada = window.localStorage.getItem(Carrinho.CHAVE_DEMONSTRACAO) !== null; } catch (e) { jaIniciada = false; }
        if (!jaIniciada && carrinho.listar().length === 0) {
            ITENS_DEMONSTRACAO.forEach(function (item) { carrinho.adicionar(item); });
        }
    } else {
        carrinho = Carrinho.criar(Carrinho.CHAVE_CARRINHO);
    }

    // ---------------------------------------------------------------
    // Referências do DOM
    // ---------------------------------------------------------------
    var $ = function (id) { return document.getElementById(id); };

    var listaItens = $("listaItens");
    var carrinhoVazio = $("carrinhoVazio");
    var valorTotal = $("valorTotal");
    var valorDescontos = $("valorDescontos");
    var valorFrete = $("valorFrete");
    var avisoDemo = $("avisoDemo");

    var NOMES_ETAPAS = ["email", "endereco", "pagamento", "avaliacao"];
    var secoes = {};
    var indicadores = {};
    NOMES_ETAPAS.forEach(function (nome) {
        secoes[nome] = document.querySelector('.etapa[data-etapa="' + nome + '"]');
        indicadores[nome] = document.querySelector('.etapas-item[data-etapa="' + nome + '"]');
    });

    var formularios = {
        email: $("formEmail"),
        endereco: $("formEndereco"),
        pagamento: $("formPagamento"),
        avaliacao: $("formAvaliacao")
    };

    // ---------------------------------------------------------------
    // RESUMO DO PEDIDO
    // ---------------------------------------------------------------
    function criarElemento(tag, classe, texto) {
        var el = document.createElement(tag);
        if (classe) el.className = classe;
        if (texto != null) el.textContent = texto;
        return el;
    }

    function criarMiniatura(item) {
        var caixa = criarElemento("div", "resumo-miniatura");

        function placeholder() {
            caixa.textContent = "";
            caixa.appendChild(criarElemento("span", "resumo-miniatura-vazia", "Sem imagem"));
        }

        if (item.imagem) {
            var img = document.createElement("img");
            img.src = item.imagem;
            img.alt = "";
            img.addEventListener("error", placeholder);
            caixa.appendChild(img);
        } else {
            placeholder();
        }
        return caixa;
    }

    function criarBotaoQuantidade(rotulo, simbolo, acao, desabilitado) {
        var botao = criarElemento("button", "quantidade-botao", simbolo);
        botao.type = "button";
        botao.setAttribute("aria-label", rotulo);
        botao.disabled = !!desabilitado;
        botao.addEventListener("click", acao);
        return botao;
    }

    function criarItem(item) {
        var li = criarElemento("li", "resumo-item");
        li.dataset.variacao = item.variacaoId;

        var dados = criarElemento("div", "resumo-item-dados");

        var topo = criarElemento("div", "resumo-item-topo");
        topo.appendChild(criarElemento("p", "resumo-item-nome", item.nome));
        topo.appendChild(criarElemento("p", "resumo-item-preco", Carrinho.formatarMoeda(item.subtotalCentavos)));
        dados.appendChild(topo);

        var corpo = criarElemento("div", "resumo-item-corpo");

        var detalhes = criarElemento("div", "resumo-item-detalhes");
        if (item.cor) {
            var linhaCor = criarElemento("p", null, "Cor: ");
            linhaCor.appendChild(criarElemento("span", null, item.cor));
            detalhes.appendChild(linhaCor);
        }
        if (item.tamanho) {
            var linhaTam = criarElemento("p", null, "Tamanho: ");
            linhaTam.appendChild(criarElemento("span", null, item.tamanho));
            detalhes.appendChild(linhaTam);
        }
        if (item.quantidade > 1) {
            detalhes.appendChild(criarElemento("p", "resumo-item-unit", Carrinho.formatarMoeda(item.precoCentavos) + " cada"));
        }
        corpo.appendChild(detalhes);

        var acoes = criarElemento("div", "resumo-item-acoes");

        var quantidade = criarElemento("div", "quantidade");
        quantidade.appendChild(criarBotaoQuantidade("Aumentar quantidade de " + item.nome, "+", function () {
            carrinho.alterarQuantidade(item.variacaoId, 1);
        }, item.quantidade >= Carrinho.QUANTIDADE_MAXIMA));
        var valor = criarElemento("span", "quantidade-valor", String(item.quantidade));
        valor.setAttribute("aria-live", "polite");
        quantidade.appendChild(valor);
        quantidade.appendChild(criarBotaoQuantidade("Diminuir quantidade de " + item.nome, "−", function () {
            carrinho.alterarQuantidade(item.variacaoId, -1);
        }, item.quantidade <= 1));
        acoes.appendChild(quantidade);

        var remover = criarElemento("button", "resumo-remover", "Remover");
        remover.type = "button";
        remover.setAttribute("aria-label", "Remover " + item.nome + " do carrinho");
        remover.addEventListener("click", function () {
            carrinho.remover(item.variacaoId);
        });
        acoes.appendChild(remover);

        corpo.appendChild(acoes);
        dados.appendChild(corpo);

        li.appendChild(criarMiniatura(item));
        li.appendChild(dados);
        return li;
    }

    function renderizarResumo() {
        var itens = carrinho.listar();
        var totais = carrinho.totais();

        listaItens.textContent = "";
        itens.forEach(function (item) { listaItens.appendChild(criarItem(item)); });

        carrinhoVazio.hidden = itens.length > 0;
        valorTotal.textContent = Carrinho.formatarMoeda(totais.totalCentavos);
        valorDescontos.textContent = Carrinho.formatarMoeda(totais.descontosCentavos);

        if (itens.length === 0) {
            valorFrete.textContent = "—";
        } else if (totais.freteGratis) {
            valorFrete.textContent = "Grátis";
        } else {
            valorFrete.textContent = "A calcular";
        }

        avisoDemo.hidden = !modoDemonstracao;

        // Se a etapa 4 estiver aberta, mantém o resumo de valores em dia.
        if (secoes.avaliacao.classList.contains("aberta")) renderizarResumoDados();
    }

    carrinho.aoMudar(renderizarResumo);

    // ---------------------------------------------------------------
    // ETAPAS EXPANSÍVEIS (somente uma aberta por vez)
    // ---------------------------------------------------------------
    var etapaAberta = "email";
    var etapasConcluidas = {};

    function atualizarEtapasNaTela() {
        NOMES_ETAPAS.forEach(function (nome) {
            var aberta = nome === etapaAberta;
            var botao = secoes[nome].querySelector(".etapa-botao");

            secoes[nome].classList.toggle("aberta", aberta);
            botao.setAttribute("aria-expanded", aberta ? "true" : "false");

            indicadores[nome].classList.toggle("ativa", aberta);
            indicadores[nome].classList.toggle("concluida", !!etapasConcluidas[nome]);
            if (aberta) {
                indicadores[nome].setAttribute("aria-current", "step");
            } else {
                indicadores[nome].removeAttribute("aria-current");
            }
        });
    }

    function abrirEtapa(nome, opcoes) {
        opcoes = opcoes || {};
        etapaAberta = nome; // sempre no máximo uma etapa aberta
        if (nome === "avaliacao") {
            renderizarResumoDados();
            $("mensagemSucesso").hidden = true;
            $("erroConclusao").textContent = "";
        }
        atualizarEtapasNaTela();

        if (opcoes.focar) {
            var primeiro = secoes[nome].querySelector("input:not([type=hidden]):not([disabled]), select, textarea");
            // espera a transição abrir o painel para o foco funcionar
            window.setTimeout(function () {
                if (primeiro && primeiro.offsetParent !== null) primeiro.focus({ preventScroll: true });
                secoes[nome].scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 320);
        }
    }

    function alternarEtapa(nome) {
        if (etapaAberta === nome) {
            etapaAberta = null; // fechar a que está aberta
            atualizarEtapasNaTela();
        } else {
            abrirEtapa(nome, { focar: false });
        }
    }

    NOMES_ETAPAS.forEach(function (nome) {
        secoes[nome].querySelector(".etapa-botao").addEventListener("click", function () {
            alternarEtapa(nome);
        });
        indicadores[nome].querySelector(".etapas-circulo").addEventListener("click", function () {
            abrirEtapa(nome, { focar: false });
        });
    });

    // ---------------------------------------------------------------
    // VALIDAÇÃO
    // ---------------------------------------------------------------
    function campo(id) { return $(id); }

    function mostrarErro(idCampo, idErro, mensagem) {
        var input = campo(idCampo);
        var erro = $(idErro);
        if (mensagem) {
            input.classList.add("invalido");
            input.setAttribute("aria-invalid", "true");
            erro.textContent = mensagem;
        } else {
            input.classList.remove("invalido");
            input.removeAttribute("aria-invalid");
            erro.textContent = "";
        }
    }

    // Aplica uma lista de regras [idCampo, idErro, mensagemOuVazio] e devolve o 1º campo inválido.
    function aplicarRegras(regras) {
        var primeiroInvalido = null;
        regras.forEach(function (regra) {
            mostrarErro(regra[0], regra[1], regra[2]);
            if (regra[2] && !primeiroInvalido) primeiroInvalido = campo(regra[0]);
        });
        return primeiroInvalido;
    }

    function valor(id) { return campo(id).value.trim(); }

    function somenteDigitos(texto) { return texto.replace(/\D/g, ""); }

    // -- Etapa 1
    function validarEmail() {
        var email = valor("campoEmail");
        var mensagem = "";
        if (!email) {
            mensagem = "Informe seu email.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            mensagem = "Digite um email válido, como nome@exemplo.com.";
        }
        return aplicarRegras([["campoEmail", "erroEmail", mensagem]]);
    }

    // -- Etapa 2
    function validarEndereco() {
        var cep = somenteDigitos(valor("campoCep"));
        var destinatario = valor("campoDestinatario");
        return aplicarRegras([
            ["campoCep", "erroCep", !cep ? "Informe o CEP." : (cep.length !== 8 ? "O CEP deve ter 8 números." : "")],
            ["campoDestinatario", "erroDestinatario", !destinatario ? "Informe o nome do destinatário." : (destinatario.length < 3 ? "Digite o nome completo." : "")],
            ["campoRua", "erroRua", valor("campoRua") ? "" : "Informe a rua ou logradouro."],
            ["campoNumero", "erroNumero", valor("campoNumero") ? "" : "Informe o número (ou S/N)."],
            ["campoBairro", "erroBairro", valor("campoBairro") ? "" : "Informe o bairro."],
            ["campoCidade", "erroCidade", valor("campoCidade") ? "" : "Informe a cidade."],
            ["campoEstado", "erroEstado", valor("campoEstado") ? "" : "Selecione o estado."]
        ]);
    }

    // -- Etapa 3
    function metodoSelecionado() {
        var marcado = document.querySelector('input[name="metodoPagamento"]:checked');
        return marcado ? marcado.value : "";
    }

    function validarValidade(texto) {
        var m = /^(\d{2})\/(\d{2})$/.exec(texto);
        if (!m) return "Use o formato MM/AA.";
        var mes = parseInt(m[1], 10);
        var ano = 2000 + parseInt(m[2], 10);
        if (mes < 1 || mes > 12) return "Mês inválido.";
        var hoje = new Date();
        var vencido = ano < hoje.getFullYear() || (ano === hoje.getFullYear() && mes < hoje.getMonth() + 1);
        return vencido ? "Cartão vencido." : "";
    }

    function validarPagamento() {
        var metodo = metodoSelecionado();
        var erroMetodo = $("erroMetodo");
        erroMetodo.textContent = metodo ? "" : "Escolha uma forma de pagamento.";

        if (!metodo) return document.querySelector('input[name="metodoPagamento"]');

        if (metodo !== "cartao") {
            // limpa erros residuais do cartão
            ["CartaoNumero", "CartaoNome", "CartaoValidade", "CartaoCvv"].forEach(function (sufixo) {
                mostrarErro("campo" + sufixo, "erro" + sufixo, "");
            });
            return null;
        }

        var numero = somenteDigitos(valor("campoCartaoNumero"));
        var nome = valor("campoCartaoNome");
        var validade = valor("campoCartaoValidade");
        var cvv = somenteDigitos(valor("campoCartaoCvv"));

        return aplicarRegras([
            ["campoCartaoNumero", "erroCartaoNumero", !numero ? "Informe o número do cartão." : ((numero.length < 13 || numero.length > 19) ? "O número deve ter entre 13 e 19 dígitos." : "")],
            ["campoCartaoNome", "erroCartaoNome", nome ? "" : "Informe o nome impresso no cartão."],
            ["campoCartaoValidade", "erroCartaoValidade", !validade ? "Informe a validade." : validarValidade(validade)],
            ["campoCartaoCvv", "erroCartaoCvv", !cvv ? "Informe o código de segurança." : ((cvv.length < 3 || cvv.length > 4) ? "O código deve ter 3 ou 4 dígitos." : "")]
        ]);
    }

    var validadores = {
        email: validarEmail,
        endereco: validarEndereco,
        pagamento: validarPagamento
    };

    // ---------------------------------------------------------------
    // AVANÇAR ENTRE ETAPAS
    // ---------------------------------------------------------------
    function configurarAvanco(nome, proxima) {
        formularios[nome].addEventListener("submit", function (evento) {
            evento.preventDefault();
            var invalido = validadores[nome]();
            if (invalido) {
                etapasConcluidas[nome] = false;
                atualizarEtapasNaTela();
                invalido.focus();
                return; // permanece na etapa atual
            }
            etapasConcluidas[nome] = true;
            abrirEtapa(proxima, { focar: true });
        });

        // Editar qualquer campo invalida a conclusão e limpa o erro daquele campo.
        formularios[nome].addEventListener("input", function (evento) {
            etapasConcluidas[nome] = false;
            atualizarEtapasNaTela();
            var alvo = evento.target;
            if (alvo.classList && alvo.classList.contains("invalido")) {
                alvo.classList.remove("invalido");
                alvo.removeAttribute("aria-invalid");
                var erro = $(alvo.getAttribute("aria-describedby") ? alvo.getAttribute("aria-describedby").split(" ").pop() : "");
                if (erro && erro.classList.contains("campo-erro")) erro.textContent = "";
            }
        });
    }

    configurarAvanco("email", "endereco");
    configurarAvanco("endereco", "pagamento");
    configurarAvanco("pagamento", "avaliacao");

    // ---------------------------------------------------------------
    // MÁSCARAS SIMPLES
    // ---------------------------------------------------------------
    campo("campoCep").addEventListener("input", function (e) {
        var d = somenteDigitos(e.target.value).slice(0, 8);
        e.target.value = d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
    });

    campo("campoCartaoNumero").addEventListener("input", function (e) {
        var d = somenteDigitos(e.target.value).slice(0, 19);
        e.target.value = d.replace(/(.{4})/g, "$1 ").trim();
    });

    campo("campoCartaoValidade").addEventListener("input", function (e) {
        var d = somenteDigitos(e.target.value).slice(0, 4);
        e.target.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    });

    campo("campoCartaoCvv").addEventListener("input", function (e) {
        e.target.value = somenteDigitos(e.target.value).slice(0, 4);
    });

    // ---------------------------------------------------------------
    // PAGAMENTO: troca de método
    // ---------------------------------------------------------------
    function atualizarMetodo() {
        var metodo = metodoSelecionado();
        $("detalheCartao").hidden = metodo !== "cartao";
        $("detalhePix").hidden = metodo !== "pix";
        $("detalheBoleto").hidden = metodo !== "boleto";
        if (metodo) $("erroMetodo").textContent = "";
    }

    Array.prototype.forEach.call(document.querySelectorAll('input[name="metodoPagamento"]'), function (radio) {
        radio.addEventListener("change", atualizarMetodo);
    });

    // ---------------------------------------------------------------
    // ETAPA 4: resumo e conclusão demonstrativa
    // ---------------------------------------------------------------
    var NOMES_METODOS = { cartao: "Cartão de crédito", pix: "Pix", boleto: "Boleto" };

    function linhaResumo(rotulo, texto) {
        var linha = document.createElement("div");
        linha.appendChild(criarElemento("dt", null, rotulo));
        linha.appendChild(criarElemento("dd", null, texto));
        return linha;
    }

    function renderizarResumoDados() {
        var lista = $("resumoDados");
        lista.textContent = "";

        var totais = carrinho.totais();
        var email = valor("campoEmail") || "não informado";
        var newsletter = campo("campoNewsletter").checked ? " (aceita receber novidades)" : "";

        var endereco = "não informado";
        if (valor("campoRua")) {
            endereco = valor("campoDestinatario") + " — " + valor("campoRua") + ", " + valor("campoNumero") +
                (valor("campoComplemento") ? " (" + valor("campoComplemento") + ")" : "") +
                " — " + valor("campoBairro") + ", " + valor("campoCidade") + "/" + valor("campoEstado") +
                " — CEP " + valor("campoCep");
        }

        var metodo = metodoSelecionado();

        lista.appendChild(linhaResumo("Email", email + newsletter));
        lista.appendChild(linhaResumo("Endereço", endereco));
        lista.appendChild(linhaResumo("Pagamento", metodo ? NOMES_METODOS[metodo] : "não informado"));
        lista.appendChild(linhaResumo("Itens", totais.quantidadeItens + (totais.quantidadeItens === 1 ? " item" : " itens") +
            " — total " + Carrinho.formatarMoeda(totais.totalCentavos)));
    }

    formularios.avaliacao.addEventListener("submit", function (evento) {
        evento.preventDefault();

        var erro = $("erroConclusao");
        var sucesso = $("mensagemSucesso");
        sucesso.hidden = true;
        erro.textContent = "";

        // 1) carrinho precisa ter itens
        if (carrinho.listar().length === 0) {
            erro.textContent = "Seu carrinho está vazio. Adicione produtos antes de concluir.";
            return;
        }

        // 2) todas as etapas anteriores precisam estar válidas
        for (var i = 0; i < 3; i++) {
            var nome = NOMES_ETAPAS[i];
            var invalido = validadores[nome]();
            if (invalido) {
                etapasConcluidas[nome] = false;
                abrirEtapa(nome, { focar: false });
                invalido.focus();
                $("erroConclusao").textContent = ""; // erro agora aparece na etapa corrigida
                return;
            }
            etapasConcluidas[nome] = true;
        }

        etapasConcluidas.avaliacao = true;
        atualizarEtapasNaTela();

        // Nada é enviado, cobrado nem gravado (dados de cartão existem só nos campos da tela).
        sucesso.textContent = "Demonstração concluída. Este é um protótipo: nenhum pedido foi realizado, " +
            "nenhum pagamento foi processado e nenhuma informação foi enviada.";
        sucesso.hidden = false;
    });

    // ---------------------------------------------------------------
    // Início
    // ---------------------------------------------------------------
    renderizarResumo();
    atualizarEtapasNaTela();
    atualizarMetodo();
});
