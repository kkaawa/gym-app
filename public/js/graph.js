// ===== graph.js =====
// 種目別の重量推移グラフを担当

let allRecords  = [];   // 全記録を保持する変数
let chart       = null; // Chart.js のインスタンスを保持する変数
let selectedMonths = 1; // 現在選択中の期間（1 or 3 or 0=全期間）

document.addEventListener('DOMContentLoaded', async function() {

  // サーバーから全記録を取得
  const res = await fetch('/api/records');
  allRecords = await res.json();

  // 種目の一覧を重複なしで取り出す
  const syumokuList = [...new Set(allRecords.map(function(r) { return r.syumoku; }))];

  // セレクトボックスに種目を追加
  const select = document.getElementById('syumoku-select');
  select.innerHTML = syumokuList.map(function(s) {
    return `<option value="${s}">${s}</option>`;
  }).join('');

  // 種目が変わったらグラフを更新
  select.addEventListener('change', updateChart);

  // 期間ボタンのクリック処理
  document.querySelectorAll('.period-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      // active クラスを付け替える
      document.querySelectorAll('.period-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      selectedMonths = parseInt(btn.dataset.months);
      updateChart();
    });
  });

  // 初回描画
  if (syumokuList.length > 0) updateChart();
});

// -----------------------------------------------
// 選択中の種目・期間に合わせてグラフを描画する
// -----------------------------------------------
function updateChart() {
  const syumoku = document.getElementById('syumoku-select').value;

  // 選択した種目だけ絞り込む
  let filtered = allRecords.filter(function(r) { return r.syumoku === syumoku; });

  // 期間フィルター
  if (selectedMonths > 0) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - selectedMonths);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    filtered = filtered.filter(function(r) { return r.date >= cutoffStr; });
  }

  // 日付の古い順に並び替える（グラフは左から時系列）
  filtered.sort(function(a, b) { return a.date.localeCompare(b.date); });

  const labels  = filtered.map(function(r) { return r.date; });   // X軸：日付
  const weights = filtered.map(function(r) { return r.omosa; });  // Y軸：重量

  // すでにグラフがあれば破棄してから描き直す
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
        tension   : 0.3, // 線を少し曲線にする
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
