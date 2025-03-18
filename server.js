const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');
const app = express();

// Servir arquivos estáticos da pasta atual
app.use(serveStatic(path.join(__dirname, '.')));

// Redirecionar todas as requisições para index.html (para SPA se necessário)
app.get('*', function(req, res) {
  // Se a requisição não for para um arquivo existente, redireciona para index.html
  if (!req.url.includes('.')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Pegar a porta do ambiente ou usar 8080
const port = process.env.PORT || 8080;
app.listen(port);

console.log('Servidor iniciado na porta: ' + port); 