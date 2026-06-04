// ===== routes/records.js =====
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/records
router.get('/', function(req, res) {
  const records = db.prepare(`
    SELECT * FROM training_records ORDER BY date DESC, id DESC
  `).all();
  res.json(records);
});

// POST /api/records
router.post('/', function(req, res) {
  const { date, syumoku, omosa, reps, memo, oikomi, training_type } = req.body;
  if (!date || !syumoku || omosa == null || !reps) {
    return res.status(400).json({ error: '日付・種目・重量・回数は必須です' });
  }
  const result = db.prepare(`
    INSERT INTO training_records (date, syumoku, omosa, reps, memo, oikomi, training_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(date, syumoku, omosa, reps, memo || '', oikomi ? 1 : 0, training_type || '');
  res.json({ id: result.lastInsertRowid, message: '記録を追加しました' });
});

// PUT /api/records/:id
router.put('/:id', function(req, res) {
  const { id } = req.params;
  const { date, syumoku, omosa, reps, memo, oikomi, training_type } = req.body;
  const result = db.prepare(`
    UPDATE training_records
    SET date=?, syumoku=?, omosa=?, reps=?, memo=?, oikomi=?, training_type=?
    WHERE id=?
  `).run(date, syumoku, omosa, reps, memo || '', oikomi ? 1 : 0, training_type || '', id);
  if (result.changes === 0) return res.status(404).json({ error: '記録が見つかりませんでした' });
  res.json({ message: '記録を更新しました' });
});

// DELETE /api/records/:id
router.delete('/:id', function(req, res) {
  const { id } = req.params;
  const result = db.prepare(`DELETE FROM training_records WHERE id=?`).run(id);
  if (result.changes === 0) return res.status(404).json({ error: '記録が見つかりませんでした' });
  res.json({ message: '記録を削除しました' });
});

module.exports = router;
