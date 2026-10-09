const { Op } = require('sequelize');
const Agendamento = require('../models/Agendamento');
const { criarEvento } = require('../config/googleCalendar');
const servicos = require('../config/servicos');

// ---------- Páginas (views) ----------

exports.paginaHome = (req, res) => res.render('home');

exports.paginaAgendar = (req, res) => res.render('agendar', { servicos });

exports.paginaConsultar = (req, res) => res.render('consultar');

// ---------- API ----------

// POST /api/agendamentos — cria o agendamento no banco e o evento no Google Agenda
exports.criarAgendamento = async (req, res) => {
  try {
    const { nome, telefone, servico, dia, horario } = req.body;

    if (!nome || !telefone || !servico || !dia || !horario) {
      return res.status(400).json({ sucesso: false, mensagem: 'Preencha todos os campos.' });
    }

    const telefoneDigits = telefone.replace(/\D/g, '');

    let novoAgendamento;
    try {
      novoAgendamento = await Agendamento.create({
        nome,
        telefone: telefoneDigits,
        servico,
        dia,
        horario,
      });
    } catch (err) {
      // Colisão pega pelo índice único (dia + horario) — outra pessoa reservou primeiro
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res
          .status(409)
          .json({ sucesso: false, mensagem: 'Esse horário acabou de ser reservado. Escolha outro.' });
      }
      throw err;
    }

    // Cria o evento no Google Agenda. Se falhar (ou não estiver configurado),
    // o agendamento já feito no banco não é desfeito — só fica sem o evento.
    try {
      const eventId = await criarEvento({ nome, telefone: telefoneDigits, servico, dia, horario });
      if (eventId) {
        novoAgendamento.googleEventId = eventId;
        await novoAgendamento.save();
      }
    } catch (googleErr) {
      console.error('[Google Agenda] Erro ao criar evento:', googleErr.message);
    }

    return res
      .status(201)
      .json({ sucesso: true, mensagem: 'Agendamento confirmado com sucesso!', agendamento: novoAgendamento });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar agendamento. Tente novamente.' });
  }
};

// GET /api/agendamentos?telefone=&nome= — busca agendamentos do cliente
exports.buscarAgendamento = async (req, res) => {
  try {
    const { telefone, nome } = req.query;

    if (!telefone && !nome) {
      return res.status(400).json({ sucesso: false, mensagem: 'Informe telefone ou nome.' });
    }

    const where = {};
    if (telefone) where.telefone = telefone.replace(/\D/g, '');
    if (nome) where.nome = { [Op.like]: `%${nome}%` };

    const agendamentos = await Agendamento.findAll({
      where,
      order: [
        ['dia', 'ASC'],
        ['horario', 'ASC'],
      ],
    });

    return res.json({ sucesso: true, agendamentos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar agendamento.' });
  }
};

// GET /api/agendamentos/horarios-disponiveis?dia=YYYY-MM-DD — horários já ocupados no dia
exports.horariosDisponiveis = async (req, res) => {
  try {
    const { dia } = req.query;
    if (!dia) {
      return res.status(400).json({ sucesso: false, mensagem: 'Informe o dia.' });
    }

    const agendamentos = await Agendamento.findAll({ where: { dia }, attributes: ['horario'] });
    const ocupados = agendamentos.map((a) => a.horario);

    return res.json({ sucesso: true, ocupados });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar horários.' });
  }
};
