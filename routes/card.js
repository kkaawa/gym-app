// ===== routes/card.js =====
// 名刺カード用の集計データを返すAPIルート

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/card
router.get('/', (req, res) => {

  // 総トレーニング日数（ユニークな日付の数）
  const totalWorkouts = db.prepare(`
    SELECT COUNT(DISTINCT date) AS total FROM training_records
  `).get().total;

  // 総ボリューム（重量 × 回数 の合計）
  const totalVolume = Math.round(
    db.prepare(`SELECT SUM(omosa * reps) AS total FROM training_records`).get().total || 0
  );

  // Big3の推定1RM（Epley式）を種目ごとに取得
  const big3Syumoku = ['ベンチプレス', 'スクワット', 'デッドリフト'];
  const big3 = {};

  big3Syumoku.forEach(syumoku => {
    const records = db.prepare(`
      SELECT omosa, reps FROM training_records WHERE syumoku = ?
    `).all(syumoku);

    if (records.length === 0) {
      big3[syumoku] = null;
      return;
    }

    // 全セットの中で推定1RMが最大のものを採用
    const best1rm = records.reduce((best, r) => {
      const rm = r.omosa * (1 + r.reps / 30);
      return rm > best ? rm : best;
    }, 0);

    big3[syumoku] = Math.round(best1rm * 10) / 10;
  });

  // 最長連続トレーニング日数（ストリーク）
  const allDates = db.prepare(`
    SELECT DISTINCT date FROM training_records ORDER BY date ASC
  `).all().map(r => r.date);

  let longestStreak = 0;
  let currentStreak = allDates.length > 0 ? 1 : 0;

  for (let i = 1; i < allDates.length; i++) {
    const prev = new Date(allDates[i - 1]);
    const curr = new Date(allDates[i]);
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  res.json({ totalWorkouts, totalVolume, longestStreak, big3 });
});

module.exports = router;
