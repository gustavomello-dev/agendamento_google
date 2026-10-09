require('dotenv').config();
const express = require('express');
const { engine } = require('express-handlebars');
const cors = require('cors');
const path = require('path');

const sequelize = require('./config/database');
const routes = require('./routes/agendamentoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Handlebars (view engine)
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rotas (páginas + API)
app.use('/', routes);

// Conecta ao banco, cria as tabelas se não existirem e sobe o servidor
sequelize
  .sync()
  .then(() => {
    console.log('✅ Banco de dados conectado e sincronizado.');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  });
