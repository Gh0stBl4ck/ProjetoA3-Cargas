document.addEventListener("DOMContentLoaded", function () {
  const lista = document.getElementById("lista-agendamentos");
  const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

  lista.innerHTML = ""; // limpar a lista

  agendamentos.forEach((agendamento, index) => {
      const tr = document.createElement("tr");

      const tdEmpresa = document.createElement("td");
      const empresaBtn = document.createElement("button");
      empresaBtn.textContent = agendamento.empresa;
      empresaBtn.style.background = "none";
      empresaBtn.style.color = "#6c63ff";
      empresaBtn.style.border = "none";
      empresaBtn.style.cursor = "pointer";
      empresaBtn.addEventListener("click", () => mostrarRota(index));
      tdEmpresa.appendChild(empresaBtn);

      const tdData = document.createElement("td");
      tdData.textContent = agendamento.data;

      const tdHora = document.createElement("td");
      tdHora.textContent = agendamento.hora;

      const tdTipo = document.createElement("td");
      tdTipo.textContent = agendamento.tipo;

      const tdStatus = document.createElement("td");
      tdStatus.textContent = "Pendente";

      tr.appendChild(tdEmpresa);
      tr.appendChild(tdData);
      tr.appendChild(tdHora);
      tr.appendChild(tdTipo);
      tr.appendChild(tdStatus);

      lista.appendChild(tr);

      // Criar container do mapa
      const mapaDiv = document.createElement("div");
      mapaDiv.id = `mapa-${index}`;
      mapaDiv.style.height = "300px";
      mapaDiv.style.marginTop = "10px";
      mapaDiv.style.display = "none";
      lista.appendChild(document.createElement("tr")).appendChild(document.createElement("td")).appendChild(mapaDiv);
  });

  const mapasAtivos = {}; // Para armazenar instâncias de mapas

  function mostrarRota(index) {
      const agendamento = agendamentos[index];
      const origem = "Santos, SP"; // cidade fixa como origem
      const destino = agendamento.cidade;

      const mapaDiv = document.getElementById(`mapa-${index}`);
      mapaDiv.innerHTML = ""; // limpa mapa anterior
      mapaDiv.style.display = "block";

      // Inicializar o mapa
      const map = L.map(mapaDiv.id).setView([-23.9608, -46.3336], 10); // Coordenadas de Santos, SP

      // Adicionar camada de mapa base
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Função para geocodificar a origem e o destino
      function geocode(nome) {
          return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nome)}`)
              .then(response => response.json())
              .then(data => {
                  if (data && data.length > 0) {
                      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                  } else {
                      throw new Error("Local não encontrado: " + nome);
                  }
              });
      }

      Promise.all([geocode(origem), geocode(destino)])
          .then(coords => {
              const [origemCoords, destinoCoords] = coords;

              // Adicionar controle de rota
              L.Routing.control({
                  waypoints: [
                      L.latLng(origemCoords[0], origemCoords[1]),
                      L.latLng(destinoCoords[0], destinoCoords[1])
                  ],
                  lineOptions: {
                      styles: [{ color: '#6c63ff', opacity: 0.8, weight: 6 }]
                  },
                  routeWhileDragging: false,
                  draggableWaypoints: false,
                  addWaypoints: false
              }).addTo(map);

              mapasAtivos[index] = map; // Armazenar a instância do mapa
          })
          .catch(err => {
              mapaDiv.innerHTML = `<p style="color:red;">Erro ao buscar localização: ${err.message}</p>`;
          });
  }
});
