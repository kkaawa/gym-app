// ===== records.js =====
// 記録一覧の表示・編集・削除を担当

document.addEventListener('DOMContentLoaded', () => {
  loadRecords();

  // 編集フォームの送信
  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const data = {
      date    : document.getElementById('edit-date').value,
      syumoku : document.getElementById('edit-syumoku').value,
      omosa   : parseFloat(document.getElementById('edit-omosa').value),
      reps    : parseInt(document.getElementById('edit-reps').value),
      memo    : document.getElementById('edit-memo').value,
      oikomi  : document.getElementById('edit-oikomi').checked ? 1 : 0,
    };

    const res = await fetch(`/api/records/${id}`, {
      method  : 'PUT',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify(data),
    });

    const result = await res.json();
    closeModal();
    showMessage(res.ok ? result.message : result.error, res.ok ? 'success' : 'error');

    // 一覧を再読み込みして最新状態を表示
    if (res.ok) loadRecords();
  });

  // モーダルを閉じるボタン
  document.getElementById('modal-close').addEventListener('click', closeModal);
});

// -----------------------------------------------
// 全記録をサーバーから取得して一覧を描画する
// -----------------------------------------------
async function loadRecords() {
  const res     = await fetch('/api/records');
  const records = await res.json();

  const container = document.getElementById('records-container');

  if (records.length === 0) {
    container.innerHTML = '<p style="color:#888;">まだ記録がありません。</p>';
    return;
  }

  // 日付ごとにグループ化する
  // grouped = { '2025-06-01': [記録, 記録, ...], '2025-05-30': [...], ... }
  const grouped = {};
  records.forEach(r => {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push(r);
  });

  // HTMLを組み立てる
  let html = '';
  for (const date in grouped) {
    html += `<div class="record-group">`;
    html += `<div class="record-group-date">${formatDate(date)}</div>`;

    grouped[date].forEach(r => {
      const volume = r.omosa * r.reps; // 推定ボリューム（重量 × 回数）
      const oikomiHTML = r.oikomi ? `<span class="oikomi-badge">追い込み</span>` : '';

      html += `
        <div class="record-item">
          <div class="record-info">
            <div class="record-name">${r.syumoku}${oikomiHTML}</div>
            <div class="record-detail">
              ${r.omosa}kg × ${r.reps}回
              &nbsp;|&nbsp; ボリューム: ${volume}kg
              ${r.memo ? `&nbsp;|&nbsp; ${r.memo}` : ''}
            </div>
          </div>
          <div class="record-actions">
            <button class="btn btn-secondary" onclick="openEditModal(${r.id})">編集</button>
            <button class="btn btn-danger"    onclick="deleteRecord(${r.id})">削除</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  }

  container.innerHTML = html;
}

// -----------------------------------------------
// 編集モーダルを開いて選択した記録のデータをセット
// -----------------------------------------------
async function openEditModal(id) {
  // 全記録から該当IDのものを探す
  const res     = await fetch('/api/records');
  const records = await res.json();
  const record  = records.find(r => r.id === id);
  if (!record) return;

  // フォームに現在の値をセット
  document.getElementById('edit-id').value      = record.id;
  document.getElementById('edit-date').value    = record.date;
  document.getElementById('edit-syumoku').value = record.syumoku;
  document.getElementById('edit-omosa').value   = record.omosa;
  document.getElementById('edit-reps').value    = record.reps;
  document.getElementById('edit-memo').value    = record.memo || '';
  document.getElementById('edit-oikomi').checked = record.oikomi === 1;

  // モーダルを表示
  document.getElementById('edit-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

// -----------------------------------------------
// 記録を削除する
// -----------------------------------------------
async function deleteRecord(id) {
  if (!confirm('この記録を削除しますか？')) return;

  const res    = await fetch(`/api/records/${id}`, { method: 'DELETE' });
  const result = await res.json();

  showMessage(res.ok ? result.message : result.error, res.ok ? 'success' : 'error');
  if (res.ok) loadRecords();
}

// 「2025-06-01」→「2025年6月1日（月）」に変換
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
