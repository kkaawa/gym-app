// ===== poster.js =====
// ポスター生成ページの処理を担当

// 種目名 → 画像ファイルのマッピング
// ファイル名にスペースがあるため %20 にエンコードする（URLのルール）
const EXERCISE_IMAGES = {
  'ベンチプレス'     : '/trainingphote/BENCH%20PRESS.png',
  'スクワット'       : '/trainingphote/SQUAT.png',
  'デッドリフト'     : '/trainingphote/DEADLIFT.png',
  'ショルダープレス' : '/trainingphote/MILITARY%20PRESS.png',
  'アームカール'     : '/trainingphote/BARBELL%20CURL.png',
};

// 曜日の英語表記（0=日曜から）
const DAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// アップロードされた写真のデータURLを保持する変数
let uploadedPhotoURL = null;

document.addEventListener('DOMContentLoaded', () => {

  // 日付フィールドに今日の日付をデフォルトでセット
  document.getElementById('poster-date').value = new Date().toISOString().split('T')[0];

  // 写真がアップロードされたら読み込む
  document.getElementById('photo-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // FileReader: ファイルをブラウザ内でBase64データURLとして読み込む
    const reader = new FileReader();
    reader.onload = (ev) => {
      uploadedPhotoURL = ev.target.result; // Base64の画像データ
    };
    reader.readAsDataURL(file);
  });

  // 「ポスターを生成する」ボタン
  document.getElementById('generate-btn').addEventListener('click', generatePoster);

  // 「画像としてダウンロード」ボタン
  document.getElementById('download-btn').addEventListener('click', downloadPoster);

  // 「印刷 / PDF保存」ボタン
  document.getElementById('print-btn').addEventListener('click', () => window.print());
});

// -----------------------------------------------
// ポスターを生成してプレビューに表示する
// -----------------------------------------------
async function generatePoster() {
  const date         = document.getElementById('poster-date').value;
  const workoutType  = document.getElementById('workout-type').value;
  const trainingTime = parseInt(document.getElementById('training-time').value) || 60;

  if (!date) {
    alert('日付を選択してください');
    return;
  }

  // サーバーから全記録を取得して、選択した日付のものだけ絞り込む
  const res     = await fetch('/api/records');
  const all     = await res.json();
  const records = all.filter(r => r.date === date);

  if (records.length === 0) {
    alert('その日のトレーニング記録がありません');
    return;
  }

  // PRデータも取得（どの記録がPRかを確認するため）
  const prRes = await fetch('/api/pr');
  const prs   = await prRes.json();
  // PRをすばやく引けるように種目名をキーにしたオブジェクトに変換
  const prMap = {};
  prs.forEach(pr => { prMap[pr.syumoku] = pr; });

  // ---------- 集計計算 ----------
  const totalVolume  = records.reduce((sum, r) => sum + r.omosa * r.reps, 0);
  const totalSets    = records.length;
  const totalReps    = records.reduce((sum, r) => sum + r.reps, 0);
  const exerciseCount = new Set(records.map(r => r.syumoku)).size;

  // ベストセット：その日の記録の中で推定1RM（重量×(1+回数/30)）が最も高いもの
  const bestRecord = records.reduce((best, r) => {
    const rm = r.omosa * (1 + r.reps / 30);
    return rm > (best.omosa * (1 + best.reps / 30)) ? r : best;
  });

  // たとえ比較の計算
  const carLoads = Math.floor(totalVolume / 700); // 軽自動車1台≒700kg
  const movies   = (trainingTime / 120).toFixed(1); // 映画1本≒120分

  // ---------- 日付の表示フォーマット ----------
  const d      = new Date(date + 'T00:00:00');
  const dateStr = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  const dayStr  = DAY_EN[d.getDay()];

  // ---------- ポスターの各要素に値をセット ----------
  document.getElementById('p-title').textContent        = workoutType;
  document.getElementById('p-date').textContent         = dateStr;
  document.getElementById('p-day').textContent          = dayStr;
  document.getElementById('p-volume').textContent       = Math.round(totalVolume).toLocaleString();
  document.getElementById('p-time').textContent         = trainingTime;
  document.getElementById('p-sets').textContent         = totalSets;
  document.getElementById('p-exercises').textContent    = exerciseCount;
  document.getElementById('p-best-name').textContent    = bestRecord.syumoku.toUpperCase();
  document.getElementById('p-best-weight').textContent  = bestRecord.omosa;
  document.getElementById('p-best-reps').textContent    = bestRecord.reps;
  document.getElementById('p-total-reps').textContent   = totalReps;
  document.getElementById('p-cars').textContent         = carLoads;

  // たとえ比較のテキスト
  document.getElementById('p-comparison').innerHTML =
    `軽自動車 約${carLoads}台分 &nbsp;·&nbsp; 映画${movies}本分 を持ち上げた`;

  // ---------- ワークアウトログ（種目ごとの記録） ----------
  // 種目でグループ化する
  const grouped = {};
  records.forEach(r => {
    if (!grouped[r.syumoku]) grouped[r.syumoku] = [];
    grouped[r.syumoku].push(r);
  });

  const logGrid = document.getElementById('p-log-grid');
  logGrid.innerHTML = '';

  Object.entries(grouped).forEach(([syumoku, recs]) => {
    const imgPath = EXERCISE_IMAGES[syumoku];
    const isPR    = prMap[syumoku] && prMap[syumoku].best_weight === Math.max(...recs.map(r => r.omosa));

    // セット一覧のテキスト（例: 200·6 · 195·6 · 100·4）
    const setsText = recs.map(r => `${r.omosa}·${r.reps}`).join(' · ');
    const prBadge  = isPR ? `<span class="poster-log-pr-badge">★PR</span>` : '';

    // 画像がある場合は background-image としてカードに背景を設定する
    const bgStyle = imgPath
      ? `background-image: url('${imgPath}');`
      : '';

    const itemHTML = `
      <div class="poster-log-item" style="${bgStyle}">
        <div class="poster-log-name">${syumoku.toUpperCase()}${prBadge}</div>
        <div class="poster-log-sets">${setsText}</div>
      </div>
    `;

    logGrid.insertAdjacentHTML('beforeend', itemHTML);
  });

  // ---------- 写真のセット ----------
  // 写真は poster-bg-photo クラスでポスター全体の背景に敷かれる
  const photoEl = document.getElementById('p-photo');

  if (uploadedPhotoURL) {
    photoEl.src = uploadedPhotoURL;
    photoEl.style.display = 'block';
  } else {
    // 写真なしのときは非表示のまま（背景色 #080604 が見える）
    photoEl.style.display = 'none';
  }

  // ---------- ポスターを表示する ----------
  document.getElementById('poster-wrap').style.display = 'block';
  document.getElementById('poster-actions').style.display = 'flex';

  // 画面サイズに合わせてポスターを縮小表示する
  scalePosterToFit();

  // ポスターの位置まで自動スクロール
  document.getElementById('poster-wrap').scrollIntoView({ behavior: 'smooth' });
}

// -----------------------------------------------
// ポスター（900×1100px）を画面に収まるサイズに縮小する
// transform: scale() を使って見た目だけ縮小する
// → ダウンロード時は元サイズ（900×1100）のまま出力される
// -----------------------------------------------
function scalePosterToFit() {
  const poster = document.getElementById('poster');
  const wrap   = document.getElementById('poster-wrap');

  const POSTER_W = 900;
  const POSTER_H = 1100;

  // ウィンドウ高さの85%をターゲットにする
  const targetH = window.innerHeight * 0.85;
  // 横はウィンドウ幅の92%を上限にする
  const targetW = window.innerWidth  * 0.92;

  // 高さ基準・幅基準それぞれのスケールを計算し、小さいほうを採用
  // → 縦にも横にも収まる最大サイズになる
  const scaleByH = targetH / POSTER_H;
  const scaleByW = targetW / POSTER_W;
  const scale    = Math.min(scaleByH, scaleByW);

  poster.style.transform       = `scale(${scale})`;
  poster.style.transformOrigin = 'top left';

  // transform はレイアウト上のサイズを変えないので wrap を手動で合わせる
  wrap.style.width    = `${POSTER_W * scale}px`;
  wrap.style.height   = `${POSTER_H * scale}px`;
  wrap.style.overflow = 'hidden';
}

// ウィンドウサイズが変わったときも再計算する
window.addEventListener('resize', () => {
  if (document.getElementById('poster-wrap').style.display !== 'none') {
    scalePosterToFit();
  }
});

// -----------------------------------------------
// ポスターを画像（PNG）としてダウンロードする
// html2canvas がHTMLをそのままCanvasに描画してくれる
// -----------------------------------------------
async function downloadPoster() {
  const posterEl = document.getElementById('poster');

  // ダウンロード時は transform を一時的に解除して元サイズ（900×1100）で撮影する
  const prevTransform = posterEl.style.transform;
  posterEl.style.transform = 'scale(1)';

  const canvas = await html2canvas(posterEl, {
    scale           : 2,    // 解像度を2倍にしてきれいに
    useCORS         : true,
    backgroundColor : '#080604',
    width           : 900,
    height          : 1100,
  });

  // 撮影後に transform を元に戻す
  posterEl.style.transform = prevTransform;

  const link    = document.createElement('a');
  link.download = `gymlog_poster_${document.getElementById('poster-date').value}.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}
