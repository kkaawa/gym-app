// ===== graph.js =====

let allRecords  = [];
let chart       = null;
let selectedMonths = 1;

document.addEventListener('DOMContentLoaded', function() {
  allRecords = DB.getRecords();

  const syumokuList = [...new Set(allRecords.map(function(r) { return r.syumoku; }))];

  const select = document.getElementById('syumoku-select');
  select.innerHTML = syumokuList.map(function(s) {
    return `<option value="${s}">${s}</option>`;
  }).join('');

  select.addEventListener('change', updateChart);

  document.querySelectorAll('.period-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.period-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      selectedMonths = parseInt(btn.dataset.months);
      updateChart();
    });
  });

  if (syumokuList.length > 0) updateChart();
});

function updateChart() {
  const syumoku = document.getElementById('syumoku-select').value;

  let filtered = allRecords.filter(function(r) { return r.syumoku === syumoku; });

  if (selectedMonths > 0) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - selectedMonths);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    filtered = filtered.filter(function(r) { return r.date >= cutoffStr; });
  }

  filtered.sort(function(a, b) { return a.date.localeCompare(b.date); });

  const labels  = filtered.map(function(r) { return r.date; });
  const weights = filtered.map(function(r) { return r.omosa; });

  if (chart) chart.destroy();

  const ctx = document.getElementById('weight-chart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label     : `${syumoku} の重量推移（kg）`,
        data      : weights,
        borderColor     : '#f0a500',
        backgroundColor : 'rgba(240, 165, 0, 0.1)',
        pointBackgroundColor: '#f0a500',
        tension   : 0.3,
        fill      : true,
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: '#eee' } }
      },
      scales: {
        x: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
        y: { ticks: { color: '#aaa' }, grid: { color: '#333' } }
      }
    }
  });
}
