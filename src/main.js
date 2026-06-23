import { restClient } from '@massive.com/client-js'

const apiKey = "f06WpdkgsObQJ8qwC6s5W7z4ywQaEGHI"
const rest = restClient(apiKey, 'https://api.massive.com')

let stockChartInstance = null

// Elements
const stockForm = document.getElementById('stock-form')
const tickerInput = document.getElementById('ticker-input')
const loadingPanel = document.getElementById('loading')
const errorPanel = document.getElementById('error-message')
const chartArea = document.getElementById('chart-area')
const chartTitle = document.getElementById('chart-title')

stockForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const ticker = tickerInput.value.trim().toUpperCase()
  if (!ticker) return

  // Reset UI states
  errorPanel.style.display = 'none'
  chartArea.style.display = 'none'
  loadingPanel.style.display = 'flex'

  try {
    const today = new Date()
    const endDateStr = formatDate(today)
    
    // Subtract 7 days (one week)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    const startDateStr = formatDate(startDate)

    // Call the Client-JS aggregates API
    const response = await rest.getStocksAggregates({
      stocksTicker: ticker,
      multiplier: "1",
      timespan: "day",
      from: startDateStr,
      to: endDateStr,
      adjusted: "true",
      sort: "asc",
      limit: "120"
    })

    if (response && response.results && response.results.length > 0) {
      renderStockChart(ticker, response.results)
    } else {
      throw new Error('No stock results returned')
    }
  } catch (err) {
    console.error('Error fetching stock data:', err)
    loadingPanel.style.display = 'none'
    errorPanel.style.display = 'block'
  }
})

function formatDate(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDateFromEpoch(t) {
  const d = new Date(t)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function renderStockChart(ticker, results) {
  loadingPanel.style.display = 'none'
  chartArea.style.display = 'block'
  chartTitle.textContent = `${ticker} - 7 Day Price History`

  const ctx = document.getElementById('stock-chart').getContext('2d')

  // Destroy previous chart if it exists
  if (stockChartInstance) {
    stockChartInstance.destroy()
  }

  // Map dates and close prices
  const labels = results.map(day => formatDateFromEpoch(day.t))
  const dataPoints = results.map(day => day.c)

  stockChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${ticker} Close Price`,
        data: dataPoints,
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1f2937',
          titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: '600' },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ' ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.03)'
          },
          ticks: {
            color: '#94a3b8',
            font: { family: 'Plus Jakarta Sans', size: 11 }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.03)'
          },
          ticks: {
            color: '#94a3b8',
            font: { family: 'Plus Jakarta Sans', size: 11 },
            callback: function(value) {
              return '$' + value.toFixed(2);
            }
          }
        }
      }
    }
  })
}