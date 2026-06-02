// ===== goals.js =====
// 目標設定の追加・表示・削除と進捗表示を担当

document.addEventListener('DOMContentLoaded', () => {
  loadGoals();

  // 部位 → 種目の2段階選択
  document.getElementById('category-select').addEventListener('change', (e) => {
    const category       = e.target.value;
    const exerciseArea   = document.getElementById('exercise-select-area');
    const freeArea       = document.getElementById('exercise-free-area');
    const exerciseSelect = document.getElementById('exercise-select');

    exerciseArea.style.display = 'none';
    freeArea.style.display     = 'none';
    document.getElementById('syumoku').value = '';

    if (category === 'free') {
      freeArea.style.display = 'block';
    } else if (category) {
      const group = EXERCISE_DATA.find(g => g.category === category);
      exerciseSelect.innerHTML = '<option value="">種目を選択してください</option>';
      if (group) {
        group.exercises.forEach(name => {
          const opt = document.createElement('option');
          opt.value = opt.textContent = name;
          exerciseSelect.appendChild(opt);
        });
      }
      exerciseArea.style.display = 'block';
    }
  });

  document.getElementById('exercise-select').addEventListener('change', (e) => {
    document.getElementById('syumoku').value = e.target.value;
  });

  document.getElementById('exercise-free').addEventListener('input', (e) => {
    document.getElementById('syumoku').value = e.target.value;
  });

  // 目標追加フォームの送信
  document.getElementById('goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      syumoku       : document.getElementById('syumoku').value,
      target_weight : parseFloat(document.getElementById('target_weight').value),
      target_date   : document.getElementById('target_date').value,
    };

    const res    = await fetch('/api/goals', {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify(data),
    });
    const result = await res.json();

    showMessage(res.ok ? result.message : result.error, res.ok ? 'success' : 'error');

    if (res.ok) {
      document.getElementById('goal-form').reset();
      loadGoals();
    }
  });
});

// -----------------------------------------------
// 目標一覧を取得して表示する
// -----------------------------------------------
async function loadGoals() {
  // 目標一覧とPR一覧を同時に取得する（Promise.all で並列リクエスト）
  const [goalsRes, prRes] = await Promise.all([
    fetch('/api/goals'),
    fetch('/api/pr'),
  ]);
  const goals = await goalsRes.json();
  const prs   = await prRes.json();

  // PRをすばやく引けるように、種目名をキーにしたオブジェクトに変換
  // 例: { 'ベンチプレス': { best_weight: 85, ... }, ... }
  const prMap = {};
  prs.forEach(pr => { prMap[pr.syumoku] = pr; });

  const container = document.getElementById('goals-container');

  if (goals.length === 0) {
    container.innerHTML = '<p style="color:#888;">目標がまだ設定されていません。</p>';
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  const html = goals.map(goal => {
    const pr          = prMap[goal.syumoku];
    const currentPR   = pr ? pr.best_weight : 0;  // 現在のPR（なければ0）
    const isAchieved  = currentPR >= goal.target_weight; // 目標達成しているか
    const isExpired   = goal.target_date < today && !isAchieved; // 期限切れか

    // 進捗を％で計算（目標を超えたら100%にする）
    const progressPct = Math.min(100, Math.round((currentPR / goal.target_weight) * 100));

    const achievedHTML = isAchieved
      ? `<span class="achieved-badge">ACHIEVED</span>`
      : '';
    const expiredStyle = isExpired ? 'border-left: 2px solid #c0392b;' : 'border-left: 2px solid #1e1e1e;';

    return `
      <div class="goal-card" style="background:#111; padding:20px; margin-bottom:10px; ${expiredStyle}">
        <div class="goal-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div>
            <div style="font-family:Oswald,sans-serif; font-size:16px; letter-spacing:2px; color:#ddd; text-transform:uppercase;">
              ${goal.syumoku}${achievedHTML}
            </div>
            <div style="font-family:Oswald,sans-serif; font-size:10px; letter-spacing:2px; color:#444; margin-top:4px;">
              TARGET ${goal.target_weight}kg &nbsp;·&nbsp; ${goal.target_date}
              ${isExpired ? '<span style="color:#c0392b;"> · EXPIRED</span>' : ''}
            </div>
          </div>
          <button class="btn btn-danger" onclick="deleteGoal(${goal.id})">Delete</button>
        </div>

        <!-- 進捗バー -->
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="font-family:Oswald,sans-serif; font-size:10px; letter-spacing:1px; color:#555;">
            CURRENT PR &nbsp; ${currentPR}kg
          </span>
          <span style="font-family:Oswald,sans-serif; font-size:10px; letter-spacing:1px; color:#D4AF37;">
            ${progressPct}%
          </span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${progressPct}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// -----------------------------------------------
// 目標を削除する
// -----------------------------------------------
async function deleteGoal(id) {
  if (!confirm('この目標を削除しますか？')) return;

  const res    = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
  const result = await res.json();

  showMessage(res.ok ? result.message : result.error, res.ok ? 'success' : 'error');
  if (res.ok) loadGoals();
}

function showMessage(text, type) {
  const el = document.getElementById('message');
  el.innerHTML = `<div class="message ${type}">${text}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 3000);
}
