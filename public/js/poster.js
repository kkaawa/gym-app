// ===== poster.js =====
// ポスター生成ページの処理を担当

// 種目名 → 部位カテゴリ → 背景画像 の順で解決する
// exercises.js の EXERCISE_TO_CATEGORY と CATEGORY_IMAGES を使う

// 曜日の英語表記（0=日曜から）
const DAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// -----------------------------------------------
// 総ボリューム（kg）に応じた比較テキストのテーブル
// threshold: そのボリューム以上になったら使う
// items: ランダムに1つ選ばれて表示される
// -----------------------------------------------
const VOLUME_COMPARISONS = [
  { threshold: 200000, items: ['スペースシャトル1機分', '東京タワーの鉄骨の一部級'] },
  { threshold: 150000, items: ['自由の女神級'] },
  { threshold: 100000, items: ['新幹線車両2両分', '小学校1校分の児童の体重'] },
  { threshold: 75000,  items: ['ブラキオサウルス1頭分'] },
  { threshold: 50000,  items: ['小型旅客機1機分', '駅のホームにいる人全員分', '茶碗50万杯分のお米'] },
  { threshold: 30000,  items: ['電車1両分', '満員の観光バス2台分'] },
  { threshold: 20000,  items: ['大型トラック1台分', '工事現場の重機1台分'] },
  { threshold: 15000,  items: ['シャチ2頭分', 'コンビニ1店舗分の商品'] },
  { threshold: 10000,  items: ['路線バス1台分', '2tトラック5台分', '学生約150人分', '自転車約700台分', 'フライドチキン約4万ピース分'] },
  { threshold: 7500,   items: ['引っ越しトラック満載分'] },
  { threshold: 5000,   items: ['アフリカゾウ1頭分', 'マイクロバス1台分', 'ハンバーガー約2300個分', '大学の1クラス分の体重'] },
  { threshold: 3000,   items: ['アジアゾウ1頭分', 'シャチ1頭分', 'SUV2台分', 'カップラーメン約7500個分'] },
  { threshold: 2000,   items: ['サイ1頭分', 'カバ1頭分', 'キリン2頭分', '軽自動車2台分'] },
  { threshold: 1000,   items: ['軽自動車1台分', 'キリン1頭分', '成人男性約15人分', 'グランドピアノ3台分'] },
  { threshold: 500,    items: ['大型バイク1台分', '牛1頭分', 'ヒグマ1頭分', '競走馬1頭分', '冷蔵庫約10台分'] },
];

// ボリュームに応じた比較テキストを返す
function getVolumeComparison(volumeKg) {
  // threshold の大きい順に並んでいるので、最初にマッチしたものを使う
  const matched = VOLUME_COMPARISONS.find(function(entry) { return volumeKg >= entry.threshold; });
  if (!matched) return `${volumeKg}kg を持ち上げた`;
  // items の中からランダムに1つ選ぶ
  const item = matched.items[Math.floor(Math.random() * matched.items.length)];
  return `${item} を持ち上げた`;
}

// アップロードされた写真のデータURLを保持する変数
let uploadedPhotoURL = null;

document.addEventListener('DOMContentLoaded', function() {

  // 日付フィールドに今日の日付をデフォルトでセット
  document.getElementById('poster-date').value = new Date().toISOString().split('T')[0];

  // 写真がアップロードされたら読み込む
  document.getElementById('photo-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // FileReader: ファイルをブラウザ内でBase64データURLとして読み込む
    const reader = new FileReader();
    reader.onload = function(ev) {
      uploadedPhotoURL = ev.target.result; // Base64の画像データ
    };
    reader.readAsDataURL(file);
  });

  // 「ポスターを生成する」ボタン
  document.getElementById('generate-btn').addEventListener('click', generatePoster);

  // 「画像としてダウンロード」ボタン
  document.getElementById('download-btn').addEventListener('click', downloadPoster);

  // 「印刷 / PDF保存」ボタン
  // 印刷ボタンは削除済み
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
  const records = all.filter(function(r) { return r.date === date; });

  if (records.length === 0) {
    alert('その日のトレーニング記録がありません');
    return;
  }

  // PRデータも取得（どの記録がPRかを確認するため）
  const prRes = await fetch('/api/pr');
  const prs   = await prRes.json();
  // PRをすばやく引けるように種目名をキーにしたオブジェクトに変換
  const prMap = {};
  prs.forEach(function(pr) { prMap[pr.syumoku] = pr; });

  // ---------- 集計計算 ----------
  const totalVolume  = records.reduce(function(sum, r) { return sum + r.omosa * r.reps; }, 0);
  const totalSets    = records.length;
  const totalReps    = records.reduce(function(sum, r) { return sum + r.reps; }, 0);
  const exerciseCount = new Set(records.map(function(r) { return r.syumoku; })).size;

  // ベストセット：その日の記録の中で推定1RM（重量×(1+回数/30)）が最も高いもの
  const bestRecord = records.reduce(function(best, r) {
    const rm = r.omosa * (1 + r.reps / 30);
    return rm > (best.omosa * (1 + best.reps / 30)) ? r : best;
  });

  // たとえ比較の計算
  const carLoads = Math.floor(totalVolume / 700); // CAR LOADS 表示用（フッターの数値）

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
  // 総ボリュームに応じた比較テキストをランダム表示
  document.getElementById('p-comparison').textContent = getVolumeComparison(Math.round(totalVolume));

  // ---------- ワークアウトログ（種目ごとの記録） ----------
  // 種目でグループ化する
  const grouped = {};
  records.forEach(function(r) {
    if (!grouped[r.syumoku]) grouped[r.syumoku] = [];
    grouped[r.syumoku].push(r);
  });

  const logGrid = document.getElementById('p-log-grid');
  logGrid.innerHTML = '';

  Object.entries(grouped).forEach(function([syumoku, recs]) {
    // 種目 → 部位カテゴリ → 背景画像の順で解決
    const category = EXERCISE_TO_CATEGORY[syumoku];
    const imgPath  = category ? CATEGORY_IMAGES[category] : null;
    const isPR     = prMap[syumoku] && prMap[syumoku].best_weight === Math.max(...recs.map(function(r) { return r.omosa; }));

    // セット一覧のテキスト（例: 200·6 · 195·6 · 100·4）
    const setsText = recs.map(function(r) { return `${r.omosa}·${r.reps}`; }).join(' · ');
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
window.addEventListener('resize', function() {
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
  const wrap     = document.getElementById('poster-wrap');

  // 現在のスタイルを保存
  const prevTransform  = posterEl.style.transform;
  const prevWrapW      = wrap.style.width;
  const prevWrapH      = wrap.style.height;
  const prevWrapOv     = wrap.style.overflow;

  // transform を解除して元サイズ（900×1100）で描画できるようにする
  // wrap も元サイズに戻してクリッピングを解除
  posterEl.style.transform       = 'none';
  posterEl.style.transformOrigin = 'top left';
  wrap.style.width               = '900px';
  wrap.style.height              = '1100px';
  wrap.style.overflow            = 'visible';

  const canvas = await html2canvas(posterEl, {
    scale           : 2,       // 解像度2倍（1800×2200px のPNGになる）
    useCORS         : true,
    backgroundColor : '#080604',
    width           : 900,
    height          : 1100,
    scrollX         : 0,
    scrollY         : 0,
  });

  // スタイルを元に戻す
  posterEl.style.transform = prevTransform;
  wrap.style.width         = prevWrapW;
  wrap.style.height        = prevWrapH;
  wrap.style.overflow      = prevWrapOv;

  const link    = document.createElement('a');
  link.download = `gymlog_poster_${document.getElementById('poster-date').value}.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}
