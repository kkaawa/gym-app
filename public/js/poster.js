// ===== poster.js =====

const DAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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

function getVolumeComparison(volumeKg) {
  const matched = VOLUME_COMPARISONS.find(function(entry) { return volumeKg >= entry.threshold; });
  if (!matched) return `${volumeKg}kg を持ち上げた`;
  const item = matched.items[Math.floor(Math.random() * matched.items.length)];
  return `${item} を持ち上げた`;
}

let uploadedPhotoURL = null;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('poster-date').value = new Date().toISOString().split('T')[0];

  document.getElementById('photo-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) { uploadedPhotoURL = ev.target.result; };
    reader.readAsDataURL(file);
  });

  document.getElementById('generate-btn').addEventListener('click', generatePoster);
  document.getElementById('download-btn').addEventListener('click', downloadPoster);
});

function generatePoster() {
  const date         = document.getElementById('poster-date').value;
  const workoutType  = document.getElementById('workout-type').value;
  const trainingTime = parseInt(document.getElementById('training-time').value) || 60;

  if (!date) {
    alert('日付を選択してください');
    return;
  }

  const all     = DB.getRecords();
  const records = all.filter(function(r) { return r.date === date; });

  if (records.length === 0) {
    alert('その日のトレーニング記録がありません');
    return;
  }

  const prs   = DB.getPR();
  const prMap = {};
  prs.forEach(function(pr) { prMap[pr.syumoku] = pr; });

  const totalVolume   = records.reduce(function(sum, r) { return sum + r.omosa * r.reps; }, 0);
  const totalSets     = records.length;
  const totalReps     = records.reduce(function(sum, r) { return sum + r.reps; }, 0);
  const exerciseCount = new Set(records.map(function(r) { return r.syumoku; })).size;

  const bestRecord = records.reduce(function(best, r) {
    const rm = r.omosa * (1 + r.reps / 30);
    return rm > (best.omosa * (1 + best.reps / 30)) ? r : best;
  });

  const carLoads = Math.floor(totalVolume / 700);

  const d      = new Date(date + 'T00:00:00');
  const dateStr = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  const dayStr  = DAY_EN[d.getDay()];

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

  document.getElementById('p-comparison').textContent = getVolumeComparison(Math.round(totalVolume));

  const grouped = {};
  records.forEach(function(r) {
    if (!grouped[r.syumoku]) grouped[r.syumoku] = [];
    grouped[r.syumoku].push(r);
  });

  const logGrid = document.getElementById('p-log-grid');
  logGrid.innerHTML = '';

  Object.entries(grouped).forEach(function([syumoku, recs]) {
    const category = EXERCISE_TO_CATEGORY[syumoku];
    const imgPath  = category ? CATEGORY_IMAGES[category] : null;
    const isPR     = prMap[syumoku] && prMap[syumoku].best_weight === Math.max(...recs.map(function(r) { return r.omosa; }));

    const setsText = recs.map(function(r) { return `${r.omosa}·${r.reps}`; }).join(' · ');
    const prBadge  = isPR ? `<span class="poster-log-pr-badge">★PR</span>` : '';
    const bgStyle  = imgPath ? `background-image: url('${imgPath}');` : '';

    const itemHTML = `
      <div class="poster-log-item" style="${bgStyle}">
        <div class="poster-log-name">${syumoku.toUpperCase()}${prBadge}</div>
        <div class="poster-log-sets">${setsText}</div>
      </div>
    `;

    logGrid.insertAdjacentHTML('beforeend', itemHTML);
  });

  const photoEl = document.getElementById('p-photo');
  if (uploadedPhotoURL) {
    photoEl.src = uploadedPhotoURL;
    photoEl.style.display = 'block';
  } else {
    photoEl.style.display = 'none';
  }

  document.getElementById('poster-wrap').style.display    = 'block';
  document.getElementById('poster-actions').style.display = 'flex';

  scalePosterToFit();
  document.getElementById('poster-wrap').scrollIntoView({ behavior: 'smooth' });
}

function scalePosterToFit() {
  const poster = document.getElementById('poster');
  const wrap   = document.getElementById('poster-wrap');

  const POSTER_W = 900;
  const POSTER_H = 1100;

  const targetH = window.innerHeight * 0.85;
  const targetW = window.innerWidth  * 0.92;

  const scaleByH = targetH / POSTER_H;
  const scaleByW = targetW / POSTER_W;
  const scale    = Math.min(scaleByH, scaleByW);

  poster.style.transform       = `scale(${scale})`;
  poster.style.transformOrigin = 'top left';

  wrap.style.width    = `${POSTER_W * scale}px`;
  wrap.style.height   = `${POSTER_H * scale}px`;
  wrap.style.overflow = 'hidden';
}

window.addEventListener('resize', function() {
  if (document.getElementById('poster-wrap').style.display !== 'none') {
    scalePosterToFit();
  }
});

async function downloadPoster() {
  const posterEl = document.getElementById('poster');
  const wrap     = document.getElementById('poster-wrap');

  const prevTransform  = posterEl.style.transform;
  const prevWrapW      = wrap.style.width;
  const prevWrapH      = wrap.style.height;
  const prevWrapOv     = wrap.style.overflow;

  posterEl.style.transform       = 'none';
  posterEl.style.transformOrigin = 'top left';
  wrap.style.width               = '900px';
  wrap.style.height              = '1100px';
  wrap.style.overflow            = 'visible';

  const canvas = await html2canvas(posterEl, {
    scale           : 2,
    useCORS         : true,
    backgroundColor : '#080604',
    width           : 900,
    height          : 1100,
    scrollX         : 0,
    scrollY         : 0,
  });

  posterEl.style.transform = prevTransform;
  wrap.style.width         = prevWrapW;
  wrap.style.height        = prevWrapH;
  wrap.style.overflow      = prevWrapOv;

  const link    = document.createElement('a');
  link.download = `gymlog_poster_${document.getElementById('poster-date').value}.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}
