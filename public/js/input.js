// ===== input.js =====
// 記録入力フォームの送信処理を担当

document.addEventListener('DOMContentLoaded', function() {

  // 日付フィールドに今日の日付をデフォルトでセット
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;

  // ① 部位プルダウンが変わったら種目プルダウンを更新
  document.getElementById('category-select').addEventListener('change', function(e) {
    const category       = e.target.value;
    const exerciseArea   = document.getElementById('exercise-select-area');
    const freeArea       = document.getElementById('exercise-free-area');
    const exerciseSelect = document.getElementById('exercise-select');

    // 一旦全部隠す
    exerciseArea.style.display = 'none';
    freeArea.style.display     = 'none';
    document.getElementById('syumoku').value = '';

    if (category === 'free') {
      // 自由入力モード
      freeArea.style.display = 'block';
    } else if (category) {
      // 選択した部位の種目リストを生成
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

  // ② 種目プルダウンが変わったら hidden input にセット
  document.getElementById('exercise-select').addEventListener('change', function(e) {
    document.getElementById('syumoku').value = e.target.value;
  });

  // ③ 自由入力が変わったら hidden input にセット
  document.getElementById('exercise-free').addEventListener('input', function(e) {
    document.getElementById('syumoku').value = e.target.value;
  });

  // フォームの送信イベントを監視
  document.getElementById('record-form').addEventListener('submit', async function(e) {
    // ブラウザのデフォルト送信（ページリロード）を止める
    e.preventDefault();

    // 種目が選択されているかチェック
    const syumoku = document.getElementById('syumoku').value;
    if (!syumoku) {
      showMessage('種目を選択または入力してください', 'error');
      return;
    }

    // フォームの値を取得
    const data = {
      date          : document.getElementById('date').value,
      training_type : document.getElementById('training-type').value,
      syumoku       : syumoku,
      omosa         : parseFloat(document.getElementById('omosa').value),
      reps          : parseInt(document.getElementById('reps').value),
      memo          : document.getElementById('memo').value,
      oikomi        : document.getElementById('oikomi').checked ? 1 : 0,
    };

    // fetch でサーバーにPOSTリクエストを送る
    const res = await fetch('/api/records', {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify(data), // JavaScriptのオブジェクトをJSON文字列に変換
    });

    const result = await res.json();

    // メッセージを表示する
    showMessage(res.ok ? result.message : result.error, res.ok ? 'success' : 'error');

    // 成功したらフォームをリセット（日付は今日のまま残す）
    if (res.ok) {
      // training_type と category は保持（同日に連続入力しやすくするため）
      const savedTrainingType = document.getElementById('training-type').value;
      const savedCategory     = document.getElementById('category-select').value;

      document.getElementById('record-form').reset();
      document.getElementById('date').value           = today;
      document.getElementById('training-type').value  = savedTrainingType;

      // 部位の選択を復元して種目リストも再表示
      document.getElementById('category-select').value = savedCategory;
      document.getElementById('category-select').dispatchEvent(new Event('change'));
    }
  });
});

// メッセージを画面に表示するヘルパー関数
function showMessage(text, type) {
  // ページ上部とボタン下の両方に表示する
  ['message', 'message-bottom'].forEach(function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(function() { el.innerHTML = ''; }, 3000);
  });
}
