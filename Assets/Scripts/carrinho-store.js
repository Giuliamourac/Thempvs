/*
 * Thempvs — estado e cálculos do carrinho.
 *
 * Este arquivo cuida somente dos DADOS do carrinho (itens, quantidades,
 * totais). Não toca no DOM. Pode ser carregado em qualquer página do site
 * (ex.: perfil-produto.html para "Adicionar ao carrinho") e é usado pela
 * página carrinho.html.
 *
 * Armazenamento: localStorage do navegador (não há backend ainda).
 * Quando existir API/banco de dados, basta trocar as funções
 * ler()/gravar() abaixo — a interface continua a mesma.
 *
 * Valores monetários são guardados em CENTAVOS (inteiros) para evitar
 * erros de arredondamento.
 */
(function (global) {
    "use strict";

    var CHAVE_CARRINHO = "thempvs_carrinho";
    var CHAVE_DEMONSTRACAO = "thempvs_carrinho_demo";

    var QUANTIDADE_MINIMA = 1;
    var QUANTIDADE_MAXIMA = 99;

    // Regra já existente no projeto (barra promocional): frete grátis acima de R$ 199,90.
    var FRETE_GRATIS_MINIMO_CENTAVOS = 19990;

    // ---------- Utilidades ----------

    function formatarMoeda(centavos) {
        var valor = (Number(centavos) || 0) / 100;
        return "R$ " + valor.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function normalizarTexto(texto) {
        return String(texto == null ? "" : texto).trim();
    }

    function gerarIdVariacao(produtoId, cor, tamanho) {
        return [produtoId, cor, tamanho]
            .map(function (parte) { return normalizarTexto(parte).toLowerCase(); })
            .join("__");
    }

    function limitarQuantidade(quantidade) {
        var numero = Math.floor(Number(quantidade));
        if (!isFinite(numero)) return QUANTIDADE_MINIMA;
        return Math.min(QUANTIDADE_MAXIMA, Math.max(QUANTIDADE_MINIMA, numero));
    }

    // Aceita apenas itens bem formados (protege contra dados corrompidos no storage).
    function sanearItem(bruto) {
        if (!bruto || typeof bruto !== "object") return null;

        var produtoId = normalizarTexto(bruto.produtoId);
        var nome = normalizarTexto(bruto.nome);
        var preco = Math.round(Number(bruto.precoCentavos));

        if (!produtoId || !nome || !isFinite(preco) || preco < 0) return null;

        var cor = normalizarTexto(bruto.cor);
        var tamanho = normalizarTexto(bruto.tamanho);

        return {
            variacaoId: gerarIdVariacao(produtoId, cor, tamanho),
            produtoId: produtoId,
            nome: nome,
            precoCentavos: preco,
            quantidade: limitarQuantidade(bruto.quantidade),
            cor: cor,
            tamanho: tamanho,
            imagem: normalizarTexto(bruto.imagem)
        };
    }

    // ---------- Fábrica do carrinho ----------

    function criarCarrinho(chaveStorage) {
        var chave = chaveStorage || CHAVE_CARRINHO;
        var itens = [];
        var ouvintes = [];
        var storageDisponivel = true;

        function ler() {
            try {
                var texto = global.localStorage.getItem(chave);
                if (!texto) return [];
                var lista = JSON.parse(texto);
                if (!Array.isArray(lista)) return [];
                return lista.map(sanearItem).filter(Boolean);
            } catch (erro) {
                storageDisponivel = false;
                return itens; // mantém o que já estava em memória
            }
        }

        function gravar() {
            try {
                global.localStorage.setItem(chave, JSON.stringify(itens));
            } catch (erro) {
                storageDisponivel = false; // segue funcionando só em memória
            }
        }

        function notificar() {
            ouvintes.forEach(function (ouvinte) { ouvinte(listar()); });
        }

        function atualizar(novosItens) {
            itens = novosItens;
            gravar();
            notificar();
        }

        function localizar(variacaoId) {
            for (var i = 0; i < itens.length; i++) {
                if (itens[i].variacaoId === variacaoId) return i;
            }
            return -1;
        }

        function listar() {
            return itens.map(function (item) {
                return Object.assign({}, item, {
                    subtotalCentavos: item.precoCentavos * item.quantidade
                });
            });
        }

        function adicionar(dados) {
            var novo = sanearItem(dados);
            if (!novo) return false;

            var copia = itens.slice();
            var indice = localizar(novo.variacaoId);

            if (indice >= 0) {
                // Mesma variação (produto + cor + tamanho): soma a quantidade.
                copia[indice] = Object.assign({}, copia[indice], {
                    quantidade: limitarQuantidade(copia[indice].quantidade + novo.quantidade)
                });
            } else {
                copia.push(novo);
            }

            atualizar(copia);
            return true;
        }

        function definirQuantidade(variacaoId, quantidade) {
            var indice = localizar(variacaoId);
            if (indice < 0) return;

            var copia = itens.slice();
            copia[indice] = Object.assign({}, copia[indice], {
                quantidade: limitarQuantidade(quantidade)
            });
            atualizar(copia);
        }

        function alterarQuantidade(variacaoId, delta) {
            var indice = localizar(variacaoId);
            if (indice < 0) return;
            definirQuantidade(variacaoId, itens[indice].quantidade + delta);
        }

        function remover(variacaoId) {
            atualizar(itens.filter(function (item) {
                return item.variacaoId !== variacaoId;
            }));
        }

        function limpar() {
            atualizar([]);
        }

        function calcularTotais() {
            var subtotal = itens.reduce(function (soma, item) {
                return soma + item.precoCentavos * item.quantidade;
            }, 0);

            // Não existe sistema de cupons ainda: desconto fixo em zero.
            var descontos = 0;
            var total = Math.max(0, subtotal - descontos);

            return {
                quantidadeItens: itens.reduce(function (soma, item) { return soma + item.quantidade; }, 0),
                subtotalCentavos: subtotal,
                descontosCentavos: descontos,
                totalCentavos: total,
                // Só existe regra para "frete grátis"; abaixo disso o valor não é definido.
                freteGratis: subtotal >= FRETE_GRATIS_MINIMO_CENTAVOS
            };
        }

        function aoMudar(ouvinte) {
            ouvintes.push(ouvinte);
        }

        // Mantém várias abas sincronizadas.
        global.addEventListener("storage", function (evento) {
            if (evento.key === chave) {
                itens = ler();
                notificar();
            }
        });

        itens = ler();

        return {
            listar: listar,
            adicionar: adicionar,
            definirQuantidade: definirQuantidade,
            alterarQuantidade: alterarQuantidade,
            remover: remover,
            limpar: limpar,
            totais: calcularTotais,
            aoMudar: aoMudar,
            persistente: function () { return storageDisponivel; }
        };
    }

    global.ThempvsCarrinho = {
        criar: criarCarrinho,
        formatarMoeda: formatarMoeda,
        CHAVE_CARRINHO: CHAVE_CARRINHO,
        CHAVE_DEMONSTRACAO: CHAVE_DEMONSTRACAO,
        QUANTIDADE_MAXIMA: QUANTIDADE_MAXIMA,
        FRETE_GRATIS_MINIMO_CENTAVOS: FRETE_GRATIS_MINIMO_CENTAVOS
    };
})(window);
