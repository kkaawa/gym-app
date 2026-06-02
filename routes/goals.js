// ===== routes/goals.js =====
// 目標設定の追加・取得・更新・削除を担当するAPIルート

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// -----------------------------------------------
// GET /api/goals
// 全目標を取得する（作成日の新しい順）
// -----------------------------------------------
router.get('/', (req, res) => {
  const goals = db.prepare(`
    SELECT * FROM goals
    ORDER BY created_at DESC
  `).all();

  res.json(goals);
});

// -----------------------------------------------
// POST /api/goals
// 新しい目標を1件追加する
// リクエストボディ例: { syumoku, target_weight, target_date }
// -----------------------------------------------
router.post('/', (req, res) => {
  const { syumoku, target_weight, target_date } = req.body;

  if (!syumoku || target_weight == null || !target_date) {
    return res.status(400).json({ error: '種目・目標重量・達成目標日は必須です' });
  }

  // 作成日は今日の日付を自動でセット
  const created_at = new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    INSERT INTO goals (syumoku, target_weight, target_date, created_at)
    VALUES (?, ?, ?, ?)
  `).run(syumoku, target_weight, target_date, created_at);

  res.json({ id: result.lastInsertRowid, message: '目標を追加しました' });
});

// -----------------------------------------------
// PUT /api/goals/:id
// 指定したIDの目標を更新する
// -----------------------------------------------
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { syumoku, target_weight, target_date } = req.body;

  const result = db.prepare(`
    UPDATE goals
    SET syumoku=?, target_weight=?, target_date=?
    WHERE id=?
  `).run(syumoku, target_weight, target_date, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: '目標が見つかりませんでした' });
  }
  res.json({ message: '目標を更新しました' });
});

// -----------------------------------------------
// DELETE /api/goals/:id
// 指定したIDの目標を削除する
// -----------------------------------------------
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const result = db.prepare(`
    DELETE FROM goals WHERE id=?
  `).run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: '目標が見つかりませんでした' });
  }
  res.json({ message: '目標を削除しました' });
});

module.exports = router;
