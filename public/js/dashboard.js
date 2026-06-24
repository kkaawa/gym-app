// ===== dashboard.js =====

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

document.addEventListener('DOMContentLoaded', function() {
  const data = DB.getDashboard();

  document.getElementById('today-sets').textContent   = data.today.sets;
  document.getElementById('today-volume').textContent = data.today.volume.toLocaleString();
  document.getElementById('month-days').textContent   = data.month.days;
  document.getElementById('month-volume').textContent = data.month.volume.toLocaleString();
  document.getElementById('total-days').textContent   = data.total.days;

  const badgesEl = document.getElementById('week-badges');
  badgesEl.innerHTML = '';

  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const dateStr = day.toISOString().split('T')[0];
    const hasDone = data.week.trainingDates.includes(dateStr);
    const badge = document.createElement('div');
    badge.className = 'day-badge' + (hasDone ? ' done' : '');
    badge.textContent = DAY_LABELS[i];
    badgesEl.appendChild(badge);
  }
});
