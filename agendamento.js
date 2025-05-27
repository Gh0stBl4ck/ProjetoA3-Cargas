document.getElementById("form-agendamento").addEventListener("submit", function (event) {
  event.preventDefault(); 

  const empresa = document.getElementById("empresa").value;
  const data = document.getElementById("data").value;
  const hora = document.getElementById("hora").value;
  const tipo = document.getElementById("tipo").value;
  const cidade = document.getElementById("cidade").value;

  if (!empresa || !data || !hora || !tipo || !cidade) {
      alert("Por favor, preencha todos os campos.");
      return;
  }

  const agendamento = {
      empresa,
      data,
      hora,
      tipo,
      cidade,
      criadoEm: new Date().toISOString()
  };

  const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
  agendamentos.push(agendamento);
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

  const msg = document.getElementById("mensagem-sucesso");
  msg.textContent = "Agendamento realizado com sucesso!";
  msg.style.color = "green";
  document.getElementById("form-agendamento").reset();

  setTimeout(() => {
      msg.textContent = "";
  }, 3000);
});
