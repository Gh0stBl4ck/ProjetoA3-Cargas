document.addEventListener('DOMContentLoaded', function() {
    const usuarioLogado = localStorage.getItem("usuarioLogado");
   
    if (!usuarioLogado) {
      // Redirecionar para a página de login se não estiver logado
      window.location.href = "login.html";
      return;
    }
   
    const lista = document.getElementById("lista-agendamentos");
    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const mapas = {}; // Armazena instâncias dos mapas
    const marcadores = {}; // Armazena marcadores de caminhão
    const rotas = {}; // Armazena rotas
   
    // Ícone personalizado para o caminhão
    const caminhaoIcon = L.icon({
      iconUrl: 'camin.png',
      iconSize: [60, 60],
      iconAnchor: [30, 30]
    });
  
    lista.innerHTML = "";
  
    if (agendamentos.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "Nenhum agendamento encontrado";
      td.style.padding = "20px";
      tr.appendChild(td);
      lista.appendChild(tr);
      return;
    }
  
    agendamentos.forEach((agendamento, index) => {
      // Calcular status com base na data
      const status = calcularStatus(agendamento.data);
      const statusClass = status === "Pendente" ? "status-pendente" :
                         status === "Em rota" ? "status-transito" : "status-entregue";
     
      const tr = document.createElement("tr");
  
      const tdEmpresa = document.createElement("td");
      const empresaBtn = document.createElement("button");
      empresaBtn.textContent = agendamento.empresa;
      empresaBtn.addEventListener("click", () => toggleMapa(index, agendamento));
      tdEmpresa.appendChild(empresaBtn);
  
      const tdData = document.createElement("td");
      tdData.textContent = formatarData(agendamento.data);
  
      const tdHora = document.createElement("td");
      tdHora.textContent = agendamento.hora;
  
      const tdTipo = document.createElement("td");
      tdTipo.textContent = agendamento.tipo;
  
      const tdStatus = document.createElement("td");
      tdStatus.textContent = status;
      tdStatus.className = statusClass;
  
      tr.appendChild(tdEmpresa);
      tr.appendChild(tdData);
      tr.appendChild(tdHora);
      tr.appendChild(tdTipo);
      tr.appendChild(tdStatus);
  
      lista.appendChild(tr);
  
      // Linha para o mapa
      const trMapa = document.createElement("tr");
      const tdMapa = document.createElement("td");
      tdMapa.colSpan = 5;
  
      const mapaDiv = document.createElement("div");
      mapaDiv.id = `mapa-${index}`;
      mapaDiv.className = "map-container";
  
      tdMapa.appendChild(mapaDiv);
      trMapa.appendChild(tdMapa);
      lista.appendChild(trMapa);
    });
  
    function calcularStatus(dataString) {
      if (!dataString) return "Pendente";
     
      const dataAgendamento = new Date(dataString);
      const hoje = new Date();
      const diferencaDias = Math.floor((hoje - dataAgendamento) / (1000 * 60 * 60 * 24));
     
      if (diferencaDias < 3) {
        return "Pendente";
      } else if (diferencaDias < 15) {
        return "Em rota";
      } else {
        return "Entregue";
      }
    }
  
    function formatarData(dataString) {
      if (!dataString) return "";
      const partes = dataString.split('-');
      if (partes.length !== 3) return dataString;
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  
    function toggleMapa(index, agendamento) {
      const mapaDiv = document.getElementById(`mapa-${index}`);
  
      if (mapas[index]) {
        // Se o mapa já está criado, destruí-lo
        if (marcadores[index]) {
          clearInterval(marcadores[index].intervalo);
        }
        mapas[index].remove();
        delete mapas[index];
        delete marcadores[index];
        delete rotas[index];
        mapaDiv.style.display = "none";
        return;
      }
  
      mapaDiv.style.display = "block";
  
      setTimeout(() => {
        const map = L.map(mapaDiv.id).setView([-23.96, -46.33], 6);
        mapas[index] = map; // Salva o mapa na lista
  
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
  
        // Cidade de origem padrão se não for especificada
        const cidadeOrigem = agendamento.cidadeOrigem || "Santos, SP";
       
        function geocode(local) {
          return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(local)}`)
            .then(res => res.json())
            .then(data => {
              if (data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
              } else {
                throw new Error("Local não encontrado: " + local);
              }
            });
        }
  
        Promise.all([
          geocode(cidadeOrigem),
          geocode(agendamento.cidade)
        ])
        .then(([coordOrigem, coordDestino]) => {
          // Adicionar marcadores de origem e destino
          L.marker([coordOrigem[0], coordOrigem[1]])
            .bindPopup(`<b>Origem:</b> ${cidadeOrigem}`)
            .addTo(map);
           
          L.marker([coordDestino[0], coordDestino[1]])
            .bindPopup(`<b>Destino:</b> ${agendamento.cidade}`)
            .addTo(map);
         
          // Configurar a rota
          const routingControl = L.Routing.control({
            waypoints: [
              L.latLng(coordOrigem[0], coordOrigem[1]),
              L.latLng(coordDestino[0], coordDestino[1])
            ],
            lineOptions: {
              styles: [{ color: "#6c63ff", weight: 6 }]
            },
            routeWhileDragging: false,
            draggableWaypoints: false,
            addWaypoints: false,
            createMarker: () => null,
            show: false // Não mostrar instruções de rota
          }).addTo(map);
         
          rotas[index] = routingControl;
         
          // Adicionar o caminhão e animá-lo
          routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            const coordsArray = routes[0].coordinates;
           
            // Calcular a posição inicial do caminhão com base no status
            const status = calcularStatus(agendamento.data);
            let posicaoInicial = 0;
           
            if (status === "Em rota") {
              // Se estiver em rota, calcular uma posição intermediária
              const dataAgendamento = new Date(agendamento.data);
              const hoje = new Date();
              const diferencaDias = Math.floor((hoje - dataAgendamento) / (1000 * 60 * 60 * 24));
              const percentualConcluido = Math.min((diferencaDias - 3) / 12, 0.95); // Entre 3 e 15 dias
              posicaoInicial = Math.floor(coordsArray.length * percentualConcluido);
            } else if (status === "Entregue") {
              // Se estiver entregue, colocar no final
              posicaoInicial = coordsArray.length - 1;
            }
           
            // Criar o marcador do caminhão
            const caminhao = L.marker([coordsArray[posicaoInicial].lat, coordsArray[posicaoInicial].lng], {
              icon: caminhaoIcon
            }).addTo(map);
           
            marcadores[index] = {
              marker: caminhao,
              posicao: posicaoInicial,
              coordenadas: coordsArray,
              intervalo: null
            };
           
            // Se estiver em rota, animar o caminhão
            if (status === "Em rota") {
              const velocidade = 500; // ms entre cada movimento
             
              marcadores[index].intervalo = setInterval(() => {
                marcadores[index].posicao++;
               
                if (marcadores[index].posicao >= coordsArray.length) {
                  clearInterval(marcadores[index].intervalo);
                  return;
                }
               
                const novaPos = coordsArray[marcadores[index].posicao];
                caminhao.setLatLng([novaPos.lat, novaPos.lng]);
              }, velocidade);
            }
          });
  
          setTimeout(() => map.invalidateSize(), 200);
        })
        .catch(error => {
          mapaDiv.innerHTML = `<p style="color:red; padding: 20px;">Erro: ${error.message}</p>`;
        });
      }, 10);
    }
  });
  
  