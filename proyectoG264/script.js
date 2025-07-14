document.addEventListener('DOMContentLoaded', function () {
  const empresaSelect = document.getElementById('empresaSelect');
  const metricSelect = document.getElementById('metricSelect');
  const tablaResumen = document.getElementById('tablaResumen');

  let lineChart;
  let barChart;
  let pieChartVolumen;
  let pieChartPortafolio;
  let resultadosGlobal = [];

  empresaSelect.addEventListener('change', () => {
    cargarDatos(empresaSelect.value);
  });

  metricSelect.addEventListener('change', () => {
    cargarDatosBarras(metricSelect.value);
  });

  
  cargarDatos('Bancolombia');
  cargarDatosBarras('ultimo');

  function formatearFecha(fechaStr) {
    if (!fechaStr) return "Fecha inválida";
    const partes = fechaStr.split("/");
    if (partes.length < 3) return "Fecha inválida";
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const año = partes[2];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const nombreMes = meses[parseInt(mes, 10) - 1];
    return `${nombreMes} ${año}`;
  }

  function calcularVolatilidad(precios) {
    const media = precios.reduce((a, b) => a + b, 0) / precios.length;
    const sumaCuadrados = precios.reduce((acc, p) => acc + Math.pow(p - media, 2), 0);
    return Math.sqrt(sumaCuadrados / precios.length).toFixed(2);
  }

  function cargarDatos(nombreEmpresa) {
    const archivo = `DATA/${nombreEmpresa}_COP.csv`;

    Papa.parse(archivo, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        let data = results.data;
        data = data.filter(row => row.Date && row.Close && !isNaN(parseFloat(row.Close)));

        data.sort((a, b) => {
          const [diaA, mesA, añoA] = a.Date.split("/");
          const [diaB, mesB, añoB] = b.Date.split("/");
          const fechaA = new Date(`${añoA}-${mesA}-${diaA}`);
          const fechaB = new Date(`${añoB}-${mesB}-${diaB}`);
          return fechaA - fechaB;
        });

        const labels = data.map(row => formatearFecha(row.Date));
        const precios = data.map(row => parseFloat(row.Close));

        if (lineChart) {
          lineChart.destroy();
        }

        const lineCtx = document.getElementById('lineChart').getContext('2d');
        lineChart = new Chart(lineCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: `Precio histórico ${nombreEmpresa}`,
              data: precios,
              borderColor: 'rgba(173, 11, 11, 1)',
              fill: false,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: true },
              title: {
                display: true,
                text: `Evolución histórica de precios (${labels[0]} — ${labels[labels.length - 1]})`
              },
              tooltip: {
                callbacks: {
                  label: context => `COP ${context.parsed.y}`
                }
              }
            },
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Precio en COP'
                },
                grid: {
                  display: false
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Fecha'
                },
                grid: {
                  display: false
                }
              }
            }
          }
        });
      },
      error: function (error) {
        console.error('Error al cargar CSV:', error);
      }
    });
  }

  function cargarDatosBarras(metrica) {
    const empresas = ['Bancolombia', 'Celsia', 'GrupoSura', 'ISA', 'Nutresa'];

    const promesas = empresas.map(nombre => {
      const archivo = `data/${nombre}_COP.csv`;
      return new Promise(resolve => {
        Papa.parse(archivo, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            let data = results.data;
            data = data.filter(row => row.Date && row.Close && !isNaN(parseFloat(row.Close)));

            const precios = data.map(row => parseFloat(row.Close));

            let valor = 0;
            let fechaMax = '';
            let precioInicio = precios[0];
            let precioFinal = precios[precios.length - 1];

            if (metrica === 'ultimo') {
              valor = precioFinal;
            } else if (metrica === 'maximo') {
              const maxVal = Math.max(...precios);
              valor = maxVal;
              const indiceMax = precios.indexOf(maxVal);
              fechaMax = formatearFecha(data[indiceMax].Date);
            } else if (metrica === 'promedio') {
              valor = precios.reduce((a, b) => a + b, 0) / precios.length;
            }

            const maximo = Math.max(...precios);
            const minimo = Math.min(...precios);
            const variacion = ((valor - precioInicio) / precioInicio) * 100;
            const volatilidad = calcularVolatilidad(precios);

            resolve({ nombre, valor, fechaMax, maximo, minimo, variacion, volatilidad, volumen: data.reduce((acc, r) => acc + parseInt(r.Volume || 0), 0) });
          }
        });
      });
    });

    Promise.all(promesas).then(resultados => {
      resultadosGlobal = resultados;
      const labels = resultados.map(r => r.nombre);
      const valores = resultados.map(r => r.valor);

      if (barChart) {
        barChart.destroy();
      }

      const barCtx = document.getElementById('barChart').getContext('2d');
      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: `Comparación por empresa`,
            data: valores,
            backgroundColor: 'rgba(10, 5, 90, 0.7)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: `Comparación entre empresas (${metricSelect.options[metricSelect.selectedIndex].text})`
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const empresa = context.label;
                  const datosEmpresa = resultadosGlobal.find(r => r.nombre === empresa);
                  let texto = `COP ${context.parsed.y.toFixed(2)}`;
                  if (metrica === 'maximo' && datosEmpresa && datosEmpresa.fechaMax) {
                    texto += ` — ${datosEmpresa.fechaMax}`;
                  }
                  return texto;
                }
              }
            }
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'Precio en COP'
              }
            }
          }
        }
      });

      tablaResumen.innerHTML = '';
      resultados.forEach(r => {
        const flecha = r.variacion >= 0 ? '⬆️' : '⬇️';
        const color = r.variacion >= 0 ? 'green' : 'red';
        const fila = `
          <tr>
            <td>${r.nombre}</td>
            <td>${r.maximo.toFixed(2)}</td>
            <td>${r.minimo.toFixed(2)}</td>
            <td style="color:${color}; font-weight:bold;">${flecha} ${r.variacion.toFixed(2)}%</td>
            <td>${r.volatilidad}</td>
          </tr>
        `;
        tablaResumen.innerHTML += fila;
      });

      cargarPieCharts();
    });
  }

  function cargarPieCharts() {
    const labels = resultadosGlobal.map(r => r.nombre);

    const dataVolumen = resultadosGlobal.map(r => r.volumen);
    if (pieChartVolumen) pieChartVolumen.destroy();
    const ctxVolumen = document.getElementById('pieChartVolumen').getContext('2d');
    pieChartVolumen = new Chart(ctxVolumen, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataVolumen,
          backgroundColor: ['#1d41b6ff', '#0e0861ff', '#361bcfff', '#441392ff', '#b0a3c9ff']
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          title: {
            display: false
          }
        }
      }
    });

    const dataPortafolio = resultadosGlobal.map(r => r.valor);
    if (pieChartPortafolio) pieChartPortafolio.destroy();
    const ctxPortafolio = document.getElementById('pieChartPortafolio').getContext('2d');
    pieChartPortafolio = new Chart(ctxPortafolio, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataPortafolio,
          backgroundColor: ['#5194d3ff', '#2264c7ff', '#1139a7ff', '#0a1a77ff', '#145291ff']
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          title: {
            display: false
          }
        }
      }
    });
  }

  
  const empresaSimulador = document.getElementById('empresaSimulador');
  const accionesInput = document.getElementById('accionesInput');
  const calcularBtn = document.getElementById('calcularSimulador');
  const resultadoSimulador = document.getElementById('resultadoSimulador');

  calcularBtn.addEventListener('click', () => {
    const empresa = empresaSimulador.value;
    const numAcciones = parseInt(accionesInput.value);

    if (!numAcciones || numAcciones <= 0) {
      resultadoSimulador.value = "Número no válido";
      return;
    }

    const archivo = `data/${empresa}_COP.csv`;
    Papa.parse(archivo, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        let data = results.data;
        data = data.filter(row => row.Date && row.Close && !isNaN(parseFloat(row.Close)));

        const precioInicioRow = data.find(row => {
          const [dia, mes, año] = row.Date.split("/");
          return mes === "01" && año === "2015";
        });

        if (!precioInicioRow) {
          resultadoSimulador.value = "Sin dato 2015";
          return;
        }

        const precioInicio = parseFloat(precioInicioRow.Close);
        const precioFinal = parseFloat(data[data.length - 1].Close);

        const valorFinal = precioFinal * numAcciones;
        resultadoSimulador.value = `COP ${valorFinal.toFixed(2)}`;
      },
      error: function () {
        resultadoSimulador.value = "Error al calcular";
      }
    });
  });
});
