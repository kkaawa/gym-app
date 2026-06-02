// ===== routes/pr.js =====
// パーソナルレコード（PR）の取得を担当するAPIルート

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// -----------------------------------------------
// GET /api/pr
// 種目ごとのPR（最高重量・回数・推定1RM）を返す
// -----------------------------------------------
router.get('/', (req, res) => {

  // 種目ごとに「最も重量が高いセット」を1件ずつ取得
  const prs = db.prepare(`
    SELECT
      syumoku,
      MAX(omosa)  AS best_weight,
      reps,
      date        AS achieved_date,
      SUM(omosa * reps) AS total_volume
    FROM training_records
    GROUP BY syumoku
    ORDER BY syumoku
  `).all();

  // 推定1RM（Epley式）を計算して追加する
  // 1RM = 重量 × (1 + 回数 / 30)
  const prsWithRM = prs.map(pr => ({
    ...pr,
    estimated_1rm: Math.round(pr.best_weight * (1 + pr.reps / 30) * 10) / 10
  }));

  res.json(prsWithRM);
});

module.exports = router;
