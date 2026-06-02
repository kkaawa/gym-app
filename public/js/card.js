// ===== card.js =====
// 名刺（LIFTER CARD）の生成・表示・ダウンロードを担当

let uploadedPhotoURL = null;

document.addEventListener('DOMContentLoaded', () => {

  // 写真アップロード
  document.getElementById('c-photo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { uploadedPhotoURL = ev.target.result; };
    reader.readAsDataURL(file);
  });

  // 生成ボタン
  document.getElementById('generate-btn').addEventListener('click', async () => {
    try {
      await generateCard();
    } catch (err) {
      // エラーの内容をアラートで表示する（何が問題か分かるように）
      alert('エラーが発生しました: ' + err.message);
      console.error(err);
    }
  });

  // ダウンロードボタン
  document.getElementById('download-btn').addEventListener('click', downloadCard);

  // 印刷ボタン
  document.getElementById('print-btn').addEventListener('click', () => window.print());

  // リサイズ時に再スケール
  window.addEventListener('resize', () => {
    if (document.getElementById('card-wrap').style.display !== 'none') {
      scaleCardToFit();
    }
  });
});

// -----------------------------------------------
// 名刺を生成してプレビューに表示する
// -----------------------------------------------
async function generateCard() {

  // フォームの値を取得
  const name   = (document.getElementById('c-name').value   || 'YOUR NAME').toUpperCase();
  const height = document.getElementById('c-height').value  || '—';
  const weight = document.getElementById('c-weight').value  || '—';
  const age    = document.getElementById('c-age').value     || '—';
  const freq   = document.getElementById('c-freq').value    || '—';
  const spec   = document.getElementById('c-spec').value;

  // サーバーから集計データを取得
  const res  = await fetch('/api/card');
  const data = await res.json();

  // PRも取得して種目の総数を出す
  const prRes = await fetch('/api/pr');
  const prs   = await prRes.json();

  // ---------- 左パネル ----------
  document.getElementById('p-name').textContent = name;

  // 写真
  const photoEl = document.getElementById('c-photo-el');
  if (uploadedPhotoURL) {
    photoEl.src = uploadedPhotoURL;
    photoEl.style.display = 'block';
  } else {
    photoEl.style.display = 'none';
  }

  // ---------- ABOUT ME ----------
  document.getElementById('p-hw').textContent   = `${height}cm / ${weight}kg`;
  document.getElementById('p-age').textContent  = `${age} years`;
  document.getElementById('p-freq').textContent = `${freq} days / week`;
  document.getElementById('p-spec').textContent = spec;

  // ---------- BIG 3 LIFTS ----------
  // data.big3 = { 'ベンチプレス': 100.5, 'スクワット': 140, 'デッドリフト': 170 }
  const setLift = (elId, value) => {
    const el = document.getElementById(elId);
    if (value) {
      el.innerHTML = `${value}<span>kg</span>`;
    } else {
      el.innerHTML = `—<span>kg</span>`;
    }
  };
  setLift('p-bench', data.big3['ベンチプレス']);
  setLift('p-squat', data.big3['スクワット']);
  setLift('p-dead',  data.big3['デッドリフト']);

  // ---------- LIFTER STATS ----------
  document.getElementById('p-workouts').textContent  = data.totalWorkouts.toLocaleString();
  document.getElementById('p-volume').textContent    = data.totalVolume.toLocaleString();
  document.getElementById('p-streak').textContent    = data.longestStreak;
  document.getElementById('p-exercises').textContent = prs.length; // 記録した種目数

  // ---------- フッター ----------
  // lifterIdは削除済み

  // ---------- カードを表示 ----------
  document.getElementById('card-wrap').style.display  = 'block';
  document.getElementById('card-actions').style.display = 'flex';

  scaleCardToFit();
  document.getElementById('card-wrap').scrollIntoView({ behavior: 'smooth' });
}

// -----------------------------------------------
// カード（1000×600px）を画面に収まるサイズに縮小する
// -----------------------------------------------
function scaleCardToFit() {
  const card = document.getElementById('lifter-card');
  const wrap = document.getElementById('card-wrap');

  const CARD_W = 800;
  const CARD_H = 500;

  // ウィンドウ高さの85%をターゲットにする
  const targetH = window.innerHeight * 0.85;
  // 横はウィンドウ幅の92%を上限にする
  const targetW = window.innerWidth  * 0.92;

  const scaleByH = targetH / CARD_H;
  const scaleByW = targetW / CARD_W;
  const scale    = Math.min(scaleByH, scaleByW);

  card.style.transform       = `scale(${scale})`;
  card.style.transformOrigin = 'top left';

  wrap.style.width    = `${CARD_W * scale}px`;
  wrap.style.height   = `${CARD_H * scale}px`;
  wrap.style.overflow = 'hidden';
}

// -----------------------------------------------
// カードを画像（PNG）としてダウンロードする
// -----------------------------------------------
async function downloadCard() {
  const cardEl = document.getElementById('lifter-card');

  // ダウンロード時は transform を外して元サイズで撮影
  const prevTransform = cardEl.style.transform;
  cardEl.style.transform = 'scale(1)';

  const canvas = await html2canvas(cardEl, {
    scale           : 2,
    useCORS         : true,
    backgroundColor : '#0c0a08',
    width           : 800,
    height          : 500,
  });

  cardEl.style.transform = prevTransform;

  const link    = document.createElement('a');
  link.download = `gymlog_card_${document.getElementById('c-name').value || 'lifter'}.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}
