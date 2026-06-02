// ===== records.js =====

let allRecords    = [];
let currentFilter = 'date'; // 'date' / 'exercise' / 'calendar'
let calendarYear  = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed

// 部位ごとのカラー設定（背景は明るめに、文字は白系で見やすく）
const TYPE_COLORS = {
  '胸'  : { bg: '#c0392b', text: '#fff', label: '胸' },
  '背中' : { bg: '#27ae60', text: '#fff', label: '背中' },
  '肩'  : { bg: '#2980b9', text: '#fff', label: '肩' },
  '腕'  : { bg: '#e67e22', text: '#fff', label: '腕' },
  '足'  : { bg: '#8e44ad', text: '#fff', label: '足' },
  '全身' : { bg: '#D4AF37', text: '#000', label: '全身' },
  ''    : { bg: '#333',    text: '#aaa', label: '◆' },
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadRecords();

  // 今日の日付をカレンダーのデフォルト値にセット
  document.getElementById('filter-date').value = new Date().toISOString().split('T')[0];
  renderRecords();

  // フィルターボタンの切替
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-secondary');

      currentFilter = btn.dataset.filter;

      // 対応するフィルターUIを表示/非表示
      document.getElementById('filter-date-area').style.display     = currentFilter === 'date'     ? 'block' : 'none';
      document.getElementById('filter-exercise-area').style.display = currentFilter === 'exercise' ? 'block' : 'none';
      document.getElementById('filter-calendar-area').style.display = currentFilter === 'calendar' ? 'block' : 'none';
      document.getElementById('records-container').style.display    = currentFilter === 'calendar' ? 'none'  : 'block';

      renderRecords();
    });
  });

  // 日付が変わったら再描画
  document.getElementById('filter-date').addEventListener('change', renderRecords);

  // 種目が変わったら再描画
  document.getElementById('filter-exercise').addEventListener('change', renderRecords);

  // 編集フォームの送信
  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id   = document.getElementById('edit-id').value;
    const data = {
      date    : document.getElementById('edit-date').value,
      syumoku : document.getElementById('edit-syumoku').value,
      omosa   : parseFloat(document.getElementById('edit-omosa').value),
      reps    : parseInt(document.getElementById('edit-reps').value),
      memo    : document.getElementById('edit-memo').value,
      oikomi  : document.getElementById('edit-oikomi').checked ? 1 : 0,
    };
    const res    = await fetch(`/api/records/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    const result = await res.json();
    closeModal();
    showMessage(res.ok ? result.message : result.error, res.ok ? 'success' : 'error');
    if (res.ok) await loadRecords();
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
});

// サーバーから全記録を取得
async function loadRecords() {
  const res   = await fetch('/api/records');
  allRecords  = await res.json();

  // 種目プルダウンを更新（重複なしで全種目を取得）
  const syumokuList = [...new Set(allRecords.map(r => r.syumoku))];
  const select      = document.getElementById('filter-exercise');
  const currentVal  = select.value;
  select.innerHTML  = '<option value="">種目を選択してください</option>';
  syumokuList.forEach(s => {
    const opt      = document.createElement('option');
    opt.value      = s;
    opt.textContent = s;
    if (s === currentVal) opt.selected = true;
    select.appendChild(opt);
  });
}

// フィルターに応じて描画
function renderRecords() {
  if (currentFilter === 'calendar') {
    renderCalendar();
    return;
  }
  if (currentFilter === 'date') {
    const selectedDate = document.getElementById('filter-date').value;
    if (!selectedDate) {
      document.getElementById('records-container').innerHTML = '<p style="color:#555;">日付を選択してください。</p>';
      return;
    }
    const filtered = allRecords.filter(r => r.date === selectedDate);
    renderByDate(filtered, selectedDate);
  } else {
    const selectedExercise = document.getElementById('filter-exercise').value;
    if (!selectedExercise) {
      document.getElementById('records-container').innerHTML = '<p style="color:#555;">種目を選択してください。</p>';
      return;
    }
    const filtered = allRecords.filter(r => r.syumoku === selectedExercise);
    renderByExercise(filtered, selectedExercise);
  }
}

// 【日付ごと】選択した日のトレーニングを表示
function renderByDate(records, date) {
  const container = document.getElementById('records-container');
  if (records.length === 0) {
    container.innerHTML = `<p style="color:#555;">${formatDate(date)} の記録はありません。</p>`;
    return;
  }

  // 種目ごとにまとめる
  const grouped = groupBy(records, 'syumoku');
  let html = `<div class="record-group">`;
  html += `<div class="record-group-date">${formatDate(date)}</div>`;

  for (const syumoku in grouped) {
    html += `<div style="margin-bottom:14px;">`;
    html += `<div style="font-family:Oswald,sans-serif; font-size:11px; letter-spacing:2px; color:#555; margin-bottom:6px; padding-left:4px; text-transform:uppercase; border-left:2px solid #D4AF37; padding-left:8px;">${syumoku}</div>`;
    grouped[syumoku].forEach(r => { html += recordItemHTML(r); });
    html += `</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// 【種目ごと】選択した種目の全記録を日付ごとに表示
function renderByExercise(records, syumoku) {
  const container = document.getElementById('records-container');
  if (records.length === 0) {
    container.innerHTML = `<p style="color:#555;">${syumoku} の記録はありません。</p>`;
    return;
  }

  // 日付でグループ化
  const grouped = groupBy(records, 'date');
  let html = '';

  for (const date in grouped) {
    html += `<div class="record-group">`;
    html += `<div class="record-group-date">${formatDate(date)}</div>`;
    grouped[date].forEach(r => { html += recordItemHTML(r); });
    html += `</div>`;
  }

  container.innerHTML = html;
}

// 記録1件のHTML
function recordItemHTML(r) {
  const volume     = r.omosa * r.reps;
  const oikomiHTML = r.oikomi ? `<span class="oikomi-badge">追い込み</span>` : '';
  return `
    <div class="record-item">
      <div class="record-info">
        <div class="record-name">${r.syumoku}${oikomiHTML}</div>
        <div class="record-detail">
          ${r.omosa}kg × ${r.reps}回 &nbsp;|&nbsp; ボリューム: ${volume}kg
          ${r.memo ? `&nbsp;|&nbsp; ${r.memo}` : ''}
        </div>
      </div>
      <div class="record-actions">
        <button class="btn btn-secondary" onclick="openEditModal(${r.id})">編集</button>
        <button class="btn btn-danger"    onclick="deleteRecord(${r.id})">削除</button>
      </div>
    </div>
  `;
}

// 種目 → 部位の推定は exercises.js の EXERCISE_TO_CATEGORY を使う

// -----------------------------------------------
// 【カレンダー】月間カレンダーにトレーニング記録を表示
// -----------------------------------------------
function renderCalendar() {
  // 日付 → training_type のマップを作成
  // 優先順位: ① 明示的に入力したtraining_type > ② 種目名から自動推定
  const recordsByDate = {};
  allRecords.forEach(r => {
    if (!recordsByDate[r.date]) recordsByDate[r.date] = [];
    recordsByDate[r.date].push(r);
  });

  const dateMap = {};
  Object.entries(recordsByDate).forEach(([date, records]) => {
    // その日の記録の中に明示的なtraining_typeがあればそれを使う
    const explicit = records.find(r => r.training_type && r.training_type !== '');
    if (explicit) {
      dateMap[date] = explicit.training_type;
    } else {
      // なければ種目名から自動推定
      const auto = EXERCISE_TO_CATEGORY[records[0].syumoku] || '';
      dateMap[date] = auto;
    }
  });

  const year  = calendarYear;
  const month = calendarMonth;

  // 月の最初の日・最後の日
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startDow  = (firstDay.getDay() + 6) % 7; // 月曜始まりに変換（0=月）
  const totalDays = lastDay.getDate();

  const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  // 凡例HTML
  const legendHTML = Object.entries(TYPE_COLORS)
    .filter(([k]) => k !== '')
    .map(([k, v]) => `
      <span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;">
        <span style="width:14px;height:14px;background:${v.bg};display:inline-block;flex-shrink:0;"></span>
        <span style="font-family:Oswald,sans-serif;font-size:11px;color:#888;letter-spacing:1px;">${v.label}</span>
      </span>
    `).join('');

  // カレンダーセルを作成
  let cells = '';

  // 月初前の空白
  for (let i = 0; i < startDow; i++) {
    cells += `<div class="cal-cell empty"></div>`;
  }

  // 各日
  const todayStr = new Date().toISOString().split('T')[0];
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const type    = dateMap[dateStr];           // undefined なら記録なし
    const hasRec  = type !== undefined;
    const color   = hasRec ? (TYPE_COLORS[type] || TYPE_COLORS['']) : null;
    const isToday = dateStr === todayStr;

    if (hasRec) {
      // 記録あり：カラーバッジを表示
      cells += `
        <div class="cal-cell has-record ${isToday ? 'today' : ''}"
             onclick="jumpToDate('${dateStr}')">
          <div class="cal-day" style="${isToday ? 'color:#D4AF37;' : ''}">${d}</div>
          <div class="cal-badge" style="background:${color.bg}; color:${color.text};">${color.label}</div>
        </div>
      `;
    } else {
      // 記録なし：日付だけ
      cells += `
        <div class="cal-cell ${isToday ? 'today' : ''}">
          <div class="cal-day" style="${isToday ? 'color:#D4AF37;' : ''}">${d}</div>
        </div>
      `;
    }
  }

  document.getElementById('calendar-container').innerHTML = `
    <style>
      .cal-wrap { max-width: 700px; }
      .cal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
      .cal-title { font-family:Oswald,sans-serif; font-size:18px; letter-spacing:3px; color:#D4AF37; }
      .cal-nav { font-family:Oswald,sans-serif; font-size:12px; letter-spacing:2px; color:#555; cursor:pointer; padding:6px 14px; border:1px solid #222; background:none; color:#aaa; }
      .cal-nav:hover { color:#D4AF37; border-color:#D4AF37; }
      .cal-dow { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; margin-bottom:3px; }
      .cal-dow-label { font-family:Oswald,sans-serif; font-size:10px; letter-spacing:2px; color:#444; text-align:center; padding:6px 0; }
      .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
      .cal-cell { min-height:68px; background:#111; border:1px solid #1a1a1a; padding:8px 6px; cursor:default; }
      .cal-cell.has-record { cursor:pointer; background:#1a1a1a; }
      .cal-cell.has-record:hover { border-color:#D4AF37; }
      .cal-cell.empty { background:transparent; border:none; }
      .cal-day { font-family:Oswald,sans-serif; font-size:14px; color:#555; margin-bottom:6px; }
      .cal-cell.has-record .cal-day { color:#ddd; }
      .cal-badge { font-family:Oswald,sans-serif; font-size:11px; letter-spacing:1px; padding:3px 6px; display:inline-block; font-weight:700; }
      .cal-cell.today { border-color:#D4AF37 !important; }
      .cal-legend { margin-bottom:16px; }
    </style>
    <div class="cal-wrap">
      <div class="cal-header">
        <button class="cal-nav" onclick="changeMonth(-1)">◀ PREV</button>
        <div class="cal-title">${year}年 ${monthNames[month]}</div>
        <button class="cal-nav" onclick="changeMonth(1)">NEXT ▶</button>
      </div>
      <div class="cal-legend">${legendHTML}</div>
      <div class="cal-dow">${DAY_LABELS.map(l => `<div class="cal-dow-label">${l}</div>`).join('')}</div>
      <div class="cal-grid">${cells}</div>
    </div>
  `;
}

// 前月・翌月に移動
function changeMonth(delta) {
  calendarMonth += delta;
  if (calendarMonth < 0)  { calendarMonth = 11; calendarYear--; }
  if (calendarMonth > 11) { calendarMonth = 0;  calendarYear++; }
  renderCalendar();
}

// カレンダーの日付をクリック → 日付ごとビューに切替
function jumpToDate(dateStr) {
  // 日付ごとタブに切替
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active', 'btn-primary');
    b.classList.add('btn-secondary');
  });
  const dateBtn = document.querySelector('[data-filter="date"]');
  dateBtn.classList.add('active', 'btn-primary');
  dateBtn.classList.remove('btn-secondary');

  currentFilter = 'date';
  document.getElementById('filter-date-area').style.display     = 'block';
  document.getElementById('filter-exercise-area').style.display = 'none';
  document.getElementById('filter-calendar-area').style.display = 'none';
  document.getElementById('records-container').style.display    = 'block';

  document.getElementById('filter-date').value = dateStr;
  renderRecords();
  document.getElementById('records-container').scrollIntoView({ behavior: 'smooth' });
}

// 配列を指定キーでグループ化
function groupBy(array, key) {
  return array.reduce((result, item) => {
    const k = item[key];
    if (!result[k]) result[k] = [];
    result[k].push(item);
    return result;
  }, {});
}

async function openEditModal(id) {
  const record = allRecords.find(r => r.id === id);
  if (!record) return;
  document.getElementById('edit-id').value       = record.id;
  document.getElementById('edit-date').value     = record.date;
  document.getElementById('edit-syumoku').value  = record.syumoku;
  document.getElementById('edit-omosa').value    = record.omosa;
  document.getElementById('edit-reps').value     = record.reps;
  document.getElementById('edit-memo').value     = record.memo || '';
  document.getElementById('edit-oikomi').checked = record.oikomi === 1;
  document.getElementById('edit-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

async function deleteRecord(id) {
  if (!confirm('この記録を削除しますか？')) return;
  const res    = await fetch(`/api/records/${id}`, { method: 'DELETE' });
  const result = await res.json();
  showMessage(res.ok ? result.message : result.error, res.ok ? 'success' : 'error');
  if (res.ok) {
    await loadRecords();  // データを再取得
    renderRecords();      // 画面をすぐ再描画
  }
}

function formatDate(dateStr) {
  const d    = new Date(dateStr + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function showMessage(text, type) {
  const el = document.getElementById('message');
  el.innerHTML = `<div class="message ${type}">${text}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 3000);
}
