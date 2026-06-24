// ===== card.js =====

let uploadedPhotoURL = null;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('c-photo').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) { uploadedPhotoURL = ev.target.result; };
    reader.readAsDataURL(file);
  });

  document.getElementById('generate-btn').addEventListener('click', function() {
    try {
      generateCard();
    } catch (err) {
      alert('エラーが発生しました: ' + err.message);
      console.error(err);
    }
  });

  document.getElementById('download-btn').addEventListener('click', downloadCard);

  window.addEventListener('resize', function() {
    if (document.getElementById('card-wrap').style.display !== 'none') {
      scaleCardToFit();
    }
  });
});

function generateCard() {
  const name   = (document.getElementById('c-name').value   || 'YOUR NAME').toUpperCase();
  const height = document.getElementById('c-height').value  || '—';
  const weight = document.getElementById('c-weight').value  || '—';
  const age    = document.getElementById('c-age').value     || '—';
  const freq   = document.getElementById('c-freq').value    || '—';
  const spec   = document.getElementById('c-spec').value;

  const data = DB.getCard();
  const prs  = DB.getPR();

  document.getElementById('p-name').textContent = name;

  const photoEl = document.getElementById('c-photo-el');
  if (uploadedPhotoURL) {
    photoEl.src = uploadedPhotoURL;
    photoEl.style.display = 'block';
  } else {
    photoEl.style.display = 'none';
  }

  document.getElementById('p-hw').textContent   = `${height}cm / ${weight}kg`;
  document.getElementById('p-age').textContent  = `${age} years`;
  document.getElementById('p-freq').textContent = `${freq} days / week`;
  document.getElementById('p-spec').textContent = spec;

  const setLift = function(elId, value) {
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

  document.getElementById('p-workouts').textContent  = data.totalWorkouts.toLocaleString();
  document.getElementById('p-volume').textContent    = data.totalVolume.toLocaleString();
  document.getElementById('p-streak').textContent    = data.longestStreak;
  document.getElementById('p-exercises').textContent = prs.length;

  document.getElementById('card-wrap').style.display    = 'block';
  document.getElementById('card-actions').style.display = 'flex';

  scaleCardToFit();
  document.getElementById('card-wrap').scrollIntoView({ behavior: 'smooth' });
}

function scaleCardToFit() {
  const card = document.getElementById('lifter-card');
  const wrap = document.getElementById('card-wrap');

  const CARD_W = 800;
  const CARD_H = 500;

  const targetH = window.innerHeight * 0.85;
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

async function downloadCard() {
  const cardEl = document.getElementById('lifter-card');

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
