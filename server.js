const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


// Rotas das páginas
const pagina = (nome) => (req, res) =>
  res.sendFile(path.join(__dirname, 'Pages', nome));

app.get('/', pagina('produtos.html'));
app.get('/carrinho', pagina('carrinho.html'));
app.get('/catalogo', pagina('catálogo.html'));
app.get('/contato', pagina('contato.html'));
app.get('/lojas', pagina('lojas.html'));
app.get('/pagamento', pagina('pagamento.html'));
app.get('/produtos', pagina('produtos.html'));
app.get('/quem-usa', pagina('quemUsa.html'));
app.get('/sale', pagina('sale.html'));

// Exemplo de rota de API
app.get('/api/produtos', (req, res) => {
  res.json([{ id: 1, nome: 'Produto exemplo', preco: 99.9 }]);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});