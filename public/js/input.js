// ===== input.js =====

document.addEventListener('DOMContentLoaded', function() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;

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
          const opt       = document.createElement('option');
          opt.value       = name;
          opt.textContent = name;
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

  document.getElementById('record-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const syumoku = document.getElementById('syumoku').value;
    if (!syumoku) {
      showMessage('種目を選択または入力してください', 'error');
      return;
    }

    const data = {
      date          : document.getElementById('date').value,
      training_type : document.getElementById('training-type').value,
      syumoku       : syumoku,
      omosa         : parseFloat(document.getElementById('omosa').value),
      reps          : parseInt(document.getElementById('reps').value),
      memo          : document.getElementById('memo').value,
      oikomi        : document.getElementById('oikomi').checked ? 1 : 0,
    };

    DB.addRecord(data);
    showMessage('記録を追加しました', 'success');

    const savedTrainingType = document.getElementById('training-type').value;
    const savedCategory     = document.getElementById('category-select').value;

    document.getElementById('record-form').reset();
    document.getElementById('date').value           = today;
    document.getElementById('training-type').value  = savedTrainingType;
    document.getElementById('category-select').value = savedCategory;
    document.getElementById('category-select').dispatchEvent(new Event('change'));
  });
});

function showMessage(text, type) {
  ['message', 'message-bottom'].forEach(function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(function() { el.innerHTML = ''; }, 3000);
  });
}
