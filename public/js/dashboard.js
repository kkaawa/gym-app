// ===== dashboard.js =====
// ダッシュボードページのデータ取得と表示を担当

// 曜日の表示ラベル（月〜日）
const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

// ページが読み込まれたらデータを取得して表示する
document.addEventListener('DOMContentLoaded', async () => {
  // サーバーの /api/dashboard にリクエストを送る
  const res  = await fetch('/api/dashboard');
  const data = await res.json();

  // ---------- 数値カードに値をセット ----------
  document.getElementById('today-sets').textContent   = data.today.sets;
  document.getElementById('today-volume').textContent = data.today.volume.toLocaleString();
  document.getElementById('month-days').textContent   = data.month.days;
  document.getElementById('month-volume').textContent = data.month.volume.toLocaleString();
  document.getElementById('total-days').textContent   = data.total.days;

  // ---------- 今週の曜日バッジ ----------
  const badgesEl = document.getElementById('week-badges');
  badgesEl.innerHTML = '';

  // 今週の月曜日の Date オブジェクトを計算
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=日曜, 1=月曜, ..., 6=土曜
  const diffToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  // 月〜日の7日分バッジを作る
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);

    // 日付を「YYYY-MM-DD」形式に変換
    const dateStr = day.toISOString().split('T')[0];

    // その日にトレーニング記録があるか確認
    const hasDone = data.week.trainingDates.includes(dateStr);

    const badge = document.createElement('div');
    badge.className = 'day-badge' + (hasDone ? ' done' : '');
    badge.textContent = DAY_LABELS[i];
    badgesEl.appendChild(badge);
  }
});
