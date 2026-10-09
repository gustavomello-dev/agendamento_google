document.addEventListener('DOMContentLoaded', () => {
  const HORARIOS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ];

  const grid = document.getElementById('horarios-grid');
  const horarioInput = document.getElementById('horario');
  const diaInput = document.getElementById('dia');
  const telefoneInput = document.getElementById('telefone');
  const form = document.getElementById('form-agendamento');
  const mensagemEl = document.getElementById('mensagem');
  const btnSubmit = form.querySelector('button[type="submit"]');

  diaInput.min = new Date().toISOString().split('T')[0];
  aplicarMascaraTelefone(telefoneInput);

  function renderHorarios(ocupados = []) {
    grid.innerHTML = '';
    horarioInput.value = '';
    HORARIOS.forEach((hora) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'horario-btn';
      btn.textContent = hora;
      if (ocupados.includes(hora)) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => {
          grid.querySelectorAll('.horario-btn').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
          horarioInput.value = hora;
        });
      }
      grid.appendChild(btn);
    });
  }

  async function carregarHorarios() {
    if (!diaInput.value) return renderHorarios();
    try {
      const resp = await fetch(`/api/agendamentos/horarios-disponiveis?dia=${diaInput.value}`);
      const data = await resp.json();
      renderHorarios(data.ocupados || []);
    } catch {
      renderHorarios();
    }
  }

  diaInput.addEventListener('change', carregarHorarios);
  renderHorarios();

  function mostrarMensagem(texto, tipo) {
    mensagemEl.textContent = texto;
    mensagemEl.className = `mensagem ${tipo}`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensagemEl.className = 'mensagem';

    if (!horarioInput.value) {
      mostrarMensagem('Selecione um horário disponível.', 'erro');
      return;
    }

    const dados = {
      nome: document.getElementById('nome').value.trim(),
      telefone: telefoneInput.value.trim(),
      servico: document.getElementById('servico').value,
      dia: diaInput.value,
      horario: horarioInput.value,
    };

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'ENVIANDO...';

    try {
      const resp = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const resultado = await resp.json();

      if (resp.ok && resultado.sucesso) {
        mostrarMensagem('Agendamento confirmado! Te esperamos no horário marcado.', 'sucesso');
        form.reset();
        carregarHorarios();
      } else {
        mostrarMensagem(resultado.mensagem || 'Não foi possível agendar.', 'erro');
        if (resp.status === 409) carregarHorarios();
      }
    } catch {
      mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'AGENDAR';
    }
  });
});
