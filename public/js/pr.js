// ===== pr.js =====
// パーソナルレコード（PR）一覧と種目別ボリュームグラフを担当

document.addEventListener('DOMContentLoaded', async function() {

  // サーバーから PR データを取得
  const res = await fetch('/api/pr');
  const all = await res.json();

  // Big3（ベンチプレス・スクワット・デッドリフト）のみ表示
  const BIG3 = ['ベンチプレス', 'スクワット', 'デッドリフト'];
  const prs  = all.filter(function(pr) { return BIG3.includes(pr.syumoku); });

  renderPRCards(prs);
  renderVolumeChart(prs);
});

// -----------------------------------------------
// PRカードを一覧表示する
// -----------------------------------------------
function renderPRCards(prs) {
  const container = document.getElementById('pr-container');

  if (prs.length === 0) {
    container.innerHTML = '<p style="color:#888;">まだ記録がありません。</p>';
    return;
  }

  const html = prs.map(function(pr) {
    return `
      <div class="pr-card">
        <div class="pr-name">${pr.syumoku}</div>
        <div class="pr-stats">
          <span>最高重量: <strong>${pr.best_weight}kg</strong></span>
          <span>回数: <strong>${pr.reps}回</strong></span>
          <span>推定1RM: <strong>${pr.estimated_1rm}kg</strong></span>
          <span>総ボリューム: <strong>${Math.round(pr.total_volume).toLocaleString()}kg</strong></span>
        </div>
        <div class="pr-date">達成日: ${pr.achieved_date}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// -----------------------------------------------
// 種目別の総ボリューム比較棒グラフを描画する
// -----------------------------------------------
function renderVolumeChart(prs) {
  const labels  = prs.map(function(pr) { return pr.syumoku; });
  const volumes = prs.map(function(pr) { return Math.round(pr.total_volume); });

  const ctx = document.getElementById('volume-chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label           : '総ボリューム（kg）',
        data            : volumes,
        backgroundColor : 'rgba(240, 165, 0, 0.7)',
        borderColor     : '#f0a500',
        borderWidth     : 1,
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
