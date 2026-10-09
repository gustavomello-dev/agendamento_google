document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-consulta');
  const resultadosEl = document.getElementById('resultados');
  const telefoneInput = document.getElementById('telefone');
  const btnSubmit = form.querySelector('button[type="submit"]');

  aplicarMascaraTelefone(telefoneInput);

  function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function renderCard(ag) {
    return `
      <div class="resultado-card">
        <div class="resultado-servico">${escapeHtml(ag.servico)}</div>
        <div class="resultado-info">${formatarData(ag.dia)} · ${ag.horario}</div>
        <div class="resultado-nome">${escapeHtml(ag.nome)}</div>
      </div>`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const telefone = telefoneInput.value.trim();
    const nome = document.getElementById('nome').value.trim();

    if (!telefone && !nome) {
      resultadosEl.innerHTML = '<p class="resultado-vazio">Informe ao menos o telefone ou o nome.</p>';
      return;
    }

    const params = new URLSearchParams();
    if (telefone) params.set('telefone', telefone);
    if (nome) params.set('nome', nome);

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'BUSCANDO...';
    resultadosEl.innerHTML = '';

    try {
      const resp = await fetch(`/api/agendamentos?${params.toString()}`);
      const data = await resp.json();

      if (data.sucesso && data.agendamentos.length > 0) {
        resultadosEl.innerHTML = data.agendamentos.map(renderCard).join('');
      } else {
        resultadosEl.innerHTML = '<p class="resultado-vazio">Nenhum agendamento encontrado.</p>';
      }
    } catch {
      resultadosEl.innerHTML = '<p class="resultado-vazio">Erro ao buscar. Tente novamente.</p>';
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'BUSCAR AGENDAMENTO';
    }
  });
});
