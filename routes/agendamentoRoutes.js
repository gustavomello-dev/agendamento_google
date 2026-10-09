const express = require('express');
const router = express.Router();
const controller = require('../controllers/agendamentoController');

// ---------- Páginas ----------
router.get('/', controller.paginaHome);
router.get('/agendar', controller.paginaAgendar);
router.get('/consultar', controller.paginaConsultar);

// ---------- API ----------
router.get('/api/agendamentos/horarios-disponiveis', controller.horariosDisponiveis);
router.get('/api/agendamentos', controller.buscarAgendamento);
router.post('/api/agendamentos', controller.criarAgendamento);

module.exports = router;
