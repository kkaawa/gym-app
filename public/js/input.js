// ===== input.js =====
// 記録入力フォームの送信処理を担当

document.addEventListener('DOMContentLoaded', () => {

  // 日付フィールドに今日の日付をデフォルトでセット
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;

  // フォームの送信イベントを監視
  document.getElementById('record-form').addEventListener('submit', async (e) => {
    // ブラウザのデフォルト送信（ページリロード）を止める
    e.preventDefault();

    // フォームの値を取得
    const data = {
      date    : document.getElementById('date').value,
      syumoku : document.getElementById('syumoku').value,
      omosa   : parseFloat(document.getElementById('omosa').value),
      reps    : parseInt(document.getElementById('reps').value),
      memo    : document.getElementById('memo').value,
      oikomi  : document.getElementById('oikomi').checked ? 1 : 0,
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
      document.getElementById('record-form').reset();
      document.getElementById('date').value = today;
    }
  });
});

// メッセージを画面に表示するヘルパー関数
function showMessage(text, type) {
  const el = document.getElementById('message');
  el.innerHTML = `<div class="message ${type}">${text}</div>`;

  // 3秒後に自動で消す
  setTimeout(() => { el.innerHTML = ''; }, 3000);
}
