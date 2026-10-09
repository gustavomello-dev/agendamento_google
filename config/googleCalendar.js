const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const servicos = require('./servicos');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const DURACAO_SERVICOS = Object.fromEntries(servicos.map((s) => [s.nome, s.duracao]));

function criarClienteGoogle() {
  // 1) Produção (Render): cole o JSON inteiro da conta de serviço na variável
  //    de ambiente GOOGLE_CREDENTIALS_JSON (não precisa de arquivo no servidor).
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      return google.calendar({ version: 'v3', auth });
    } catch (err) {
      console.error('[Google Agenda] GOOGLE_CREDENTIALS_JSON inválido:', err.message);
      return null;
    }
  }

  // 2) Desenvolvimento local: arquivo config/credentials.json
  if (fs.existsSync(CREDENTIALS_PATH)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    return google.calendar({ version: 'v3', auth });
  }

  console.warn(
    '[Google Agenda] Nenhuma credencial encontrada (GOOGLE_CREDENTIALS_JSON ou config/credentials.json) — ' +
      'integração desativada. Os agendamentos continuam sendo salvos normalmente no banco. Veja o README.'
  );
  return null;
}

const calendar = criarClienteGoogle();

// Soma minutos a um horário "HH:mm" sem depender do fuso horário do servidor
function somarMinutos(horario, minutos) {
  const [h, m] = horario.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Cria um evento no Google Agenda para o agendamento.
 * Retorna o ID do evento criado, ou null se a integração não estiver configurada.
 */
async function criarEvento({ nome, telefone, servico, dia, horario }) {
  if (!calendar) return null;

  const duracao = DURACAO_SERVICOS[servico] || 30;
  const horarioFim = somarMinutos(horario, duracao);

  const evento = {
    summary: `${servico} — ${nome}`,
    description: `Cliente: ${nome}\nTelefone: ${telefone}\nServiço: ${servico}`,
    start: { dateTime: `${dia}T${horario}:00`, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: `${dia}T${horarioFim}:00`, timeZone: 'America/Sao_Paulo' },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 60 }],
    },
  };

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: evento,
  });

  return response.data.id;
}

module.exports = { criarEvento };
