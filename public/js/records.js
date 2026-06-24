// ===== records.js =====

let allRecords    = [];
let currentFilter = 'date';
let calendarYear  = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

const TYPE_COLORS = {
  '胸'  : { bg: '#c0392b', text: '#fff', label: '胸' },
  '背中' : { bg: '#27ae60', text: '#fff', label: '背中' },
  '肩'  : { bg: '#2980b9', text: '#fff', label: '肩' },
  '腕'  : { bg: '#e67e22', text: '#fff', label: '腕' },
  '足'  : { bg: '#8e44ad', text: '#fff', label: '足' },
  '全身' : { bg: '#D4AF37', text: '#000', label: '全身' },
  ''    : { bg: '#333',    text: '#aaa', label: '◆' },
};

document.addEventListener('DOMContentLoaded', function() {
  loadRecords();

  document.getElementById('filter-date').value = new Date().toISOString().split('T')[0];
  renderRecords();

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-secondary');

      currentFilter = btn.dataset.filter;

      document.getElementById('filter-date-area').style.display     = currentFilter === 'date'     ? 'block' : 'none';
      document.getElementById('filter-exercise-area').style.display = currentFilter === 'exercise' ? 'block' : 'none';
      document.getElementById('filter-calendar-area').style.display = currentFilter === 'calendar' ? 'block' : 'none';
      document.getElementById('records-container').style.display    = currentFilter === 'calendar' ? 'none'  : 'block';

      renderRecords();
    });
  });

  document.getElementById('filter-date').addEventListener('change', renderRecords);
  document.getElementById('filter-exercise').addEventListener('change', renderRecords);

  document.getElementById('edit-form').addEventListener('submit', function(e) {
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
    const ok = DB.updateRecord(id, data);
    closeModal();
    showMessage(ok ? '記録を更新しました' : '記録が見つかりませんでした', ok ? 'success' : 'error');
    if (ok) { loadRecords(); renderRecords(); }
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
});

function loadRecords() {
  allRecords = DB.getRecords();

  const syumokuList = [...new Set(allRecords.map(function(r) { return r.syumoku; }))];
  const select      = document.getElementById('filter-exercise');
  const currentVal  = select.value;
  select.innerHTML  = '<option value="">種目を選択してください</option>';
  syumokuList.forEach(function(s) {
    const opt      = document.createElement('option');
    opt.value      = s;
    opt.textContent = s;
    if (s === currentVal) opt.selected = true;
    select.appendChild(opt);
  });
}

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
    const filtered = allRecords.filter(function(r) { return r.date === selectedDate; });
    renderByDate(filtered, selectedDate);
  } else {
    const selectedExercise = document.getElementById('filter-exercise').value;
    if (!selectedExercise) {
      document.getElementById('records-container').innerHTML = '<p style="color:#555;">種目を選択してください。</p>';
      return;
    }
    const filtered = allRecords.filter(function(r) { return r.syumoku === selectedExercise; });
    renderByExercise(filtered, selectedExercise);
  }
}

function renderByDate(records, date) {
  const container = document.getElementById('records-container');
  if (records.length === 0) {
    container.innerHTML = `<p style="color:#555;">${formatDate(date)} の記録はありません。</p>`;
    return;
  }

  const grouped = groupBy(records, 'syumoku');
  let html = `<div class="record-group">`;
  html += `<div class="record-group-date">${formatDate(date)}</div>`;

  for (const syumoku in grouped) {
    html += `<div style="margin-bottom:14px;">`;
    html += `<div style="font-family:Oswald,sans-serif; font-size:11px; letter-spacing:2px; color:#555; margin-bottom:6px; padding-left:4px; text-transform:uppercase; border-left:2px solid #D4AF37; padding-left:8px;">${syumoku}</div>`;
    grouped[syumoku].forEach(function(r) { html += recordItemHTML(r); });
    html += `</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function renderByExercise(records, syumoku) {
  const container = document.getElementById('records-container');
  if (records.length === 0) {
    container.innerHTML = `<p style="color:#555;">${syumoku} の記録はありません。</p>`;
    return;
  }

  const grouped = groupBy(records, 'date');
  let html = '';

  for (const date in grouped) {
    html += `<div class="record-group">`;
    html += `<div class="record-group-date">${formatDate(date)}</div>`;
    grouped[date].forEach(function(r) { html += recordItemHTML(r); });
    html += `</div>`;
  }

  container.innerHTML = html;
}

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

function renderCalendar() {
  const recordsByDate = {};
  allRecords.forEach(function(r) {
    if (!recordsByDate[r.date]) recordsByDate[r.date] = [];
    recordsByDate[r.date].push(r);
  });

  const dateMap = {};
  Object.entries(recordsByDate).forEach(function([date, records]) {
    const explicit = records.find(function(r) { return r.training_type && r.training_type !== ''; });
    if (explicit) {
      dateMap[date] = explicit.training_type;
    } else {
      const auto = EXERCISE_TO_CATEGORY[records[0].syumoku] || '';
      dateMap[date] = auto;
    }
  });

  const year  = calendarYear;
  const month = calendarMonth;

  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startDow  = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const legendHTML = Object.entries(TYPE_COLORS)
    .filter(function([k]) { return k !== ''; })
    .map(function([k, v]) {
      return `
        <span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;">
          <span style="width:14px;height:14px;background:${v.bg};display:inline-block;flex-shrink:0;"></span>
          <span style="font-family:Oswald,sans-serif;font-size:11px;color:#888;letter-spacing:1px;">${v.label}</span>
        </span>
      `;
    }).join('');

  let cells = '';

  for (let i = 0; i < startDow; i++) {
    cells += `<div class="cal-cell empty"></div>`;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const type    = dateMap[dateStr];
    const hasRec  = type !== undefined;
    const color   = hasRec ? (TYPE_COLORS[type] || TYPE_COLORS['']) : null;
    const isToday = dateStr === todayStr;

    if (hasRec) {
      cells += `
        <div class="cal-cell has-record ${isToday ? 'today' : ''}"
             onclick="jumpToDate('${dateStr}')">
          <div class="cal-day" style="${isToday ? 'color:#D4AF37;' : ''}">${d}</div>
          <div class="cal-badge" style="background:${color.bg}; color:${color.text};">${color.label}</div>
        </div>
      `;
    } else {
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
      <div class="cal-dow">${DAY_LABELS.map(function(l) { return `<div class="cal-dow-label">${l}</div>`; }).join('')}</div>
      <div class="cal-grid">${cells}</div>
    </div>
  `;
}

function changeMonth(delta) {
  calendarMonth += delta;
  if (calendarMonth < 0)  { calendarMonth = 11; calendarYear--; }
  if (calendarMonth > 11) { calendarMonth = 0;  calendarYear++; }
  renderCalendar();
}

function jumpToDate(dateStr) {
  document.querySelectorAll('.filter-btn').forEach(function(b) {
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

function groupBy(array, key) {
  return array.reduce(function(result, item) {
    const k = item[key];
    if (!result[k]) result[k] = [];
    result[k].push(item);
    return result;
  }, {});
}

function openEditModal(id) {
  const record = allRecords.find(function(r) { return r.id === id; });
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

function deleteRecord(id) {
  if (!confirm('この記録を削除しますか？')) return;
  const ok = DB.deleteRecord(id);
  showMessage(ok ? '記録を削除しました' : '記録が見つかりませんでした', ok ? 'success' : 'error');
  if (ok) { loadRecords(); renderRecords(); }
}

function formatDate(dateStr) {
  const d    = new Date(dateStr + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function showMessage(text, type) {
  const el = document.getElementById('message');
  el.innerHTML = `<div class="message ${type}">${text}</div>`;
  setTimeout(function() { el.innerHTML = ''; }, 3000);
}
