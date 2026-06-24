// ===== goals.js =====

document.addEventListener('DOMContentLoaded', function() {
  loadGoals();

  document.getElementById('category-select').addEventListener('change', function(e) {
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
      const group = EXERCISE_DATA.find(function(g) { return g.category === category; });
      exerciseSelect.innerHTML = '<option value="">種目を選択してください</option>';
      if (group) {
        group.exercises.forEach(function(name) {
          const opt = document.createElement('option');
          opt.value = opt.textContent = name;
          exerciseSelect.appendChild(opt);
        });
      }
      exerciseArea.style.display = 'block';
    }
  });

  document.getElementById('exercise-select').addEventListener('change', function(e) {
    document.getElementById('syumoku').value = e.target.value;
  });

  document.getElementById('exercise-free').addEventListener('input', function(e) {
    document.getElementById('syumoku').value = e.target.value;
  });

  document.getElementById('goal-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const data = {
      syumoku       : document.getElementById('syumoku').value,
      target_weight : parseFloat(document.getElementById('target_weight').value),
      target_date   : document.getElementById('target_date').value,
    };

    if (!data.syumoku || !data.target_weight || !data.target_date) {
      showMessage('種目・目標重量・達成目標日は必須です', 'error');
      return;
    }

    DB.addGoal(data);
    showMessage('目標を追加しました', 'success');
    document.getElementById('goal-form').reset();
    loadGoals();
  });
});

function loadGoals() {
  const goals = DB.getGoals();
  const prs   = DB.getPR();

  const prMap = {};
  prs.forEach(function(pr) { prMap[pr.syumoku] = pr; });

  const container = document.getElementById('goals-container');

  if (goals.length === 0) {
    container.innerHTML = '<p style="color:#888;">目標がまだ設定されていません。</p>';
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  const html = goals.map(function(goal) {
    const pr          = prMap[goal.syumoku];
    const currentPR   = pr ? pr.best_weight : 0;
    const isAchieved  = currentPR >= goal.target_weight;
    const isExpired   = goal.target_date < today && !isAchieved;

    const progressPct = Math.min(100, Math.round((currentPR / goal.target_weight) * 100));

    const achievedHTML = isAchieved ? `<span class="achieved-badge">ACHIEVED</span>` : '';
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

function deleteGoal(id) {
  if (!confirm('この目標を削除しますか？')) return;
  const ok = DB.deleteGoal(id);
  showMessage(ok ? '目標を削除しました' : '目標が見つかりませんでした', ok ? 'success' : 'error');
  if (ok) loadGoals();
}

function showMessage(text, type) {
  const el = document.getElementById('message');
  el.innerHTML = `<div class="message ${type}">${text}</div>`;
  setTimeout(function() { el.innerHTML = ''; }, 3000);
}
