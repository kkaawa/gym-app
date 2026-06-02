// ===== routes/records.js =====
// トレーニング記録の追加・取得・更新・削除（CRUD）を担当するAPIルート

const express = require('express');
const router  = express.Router();
const db      = require('../db'); // db.jsで作ったSQLite接続を読み込む

// -----------------------------------------------
// GET /api/records
// 全記録を取得する（日付の新しい順）
// -----------------------------------------------
router.get('/', (req, res) => {
  const records = db.prepare(`
    SELECT * FROM training_records
    ORDER BY date DESC, id DESC
  `).all();

  res.json(records);
});

// -----------------------------------------------
// POST /api/records
// 新しい記録を1件追加する
// リクエストボディ例: { date, syumoku, omosa, reps, memo, oikomi }
// -----------------------------------------------
router.post('/', (req, res) => {
  const { date, syumoku, omosa, reps, memo, oikomi } = req.body;

  // 必須項目が欠けていたらエラーを返す
  if (!date || !syumoku || omosa == null || !reps) {
    return res.status(400).json({ error: '日付・種目・重量・回数は必須です' });
  }

  const result = db.prepare(`
    INSERT INTO training_records (date, syumoku, omosa, reps, memo, oikomi)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(date, syumoku, omosa, reps, memo || '', oikomi ? 1 : 0);

  // 追加した記録のIDを返す
  res.json({ id: result.lastInsertRowid, message: '記録を追加しました' });
});

// -----------------------------------------------
// PUT /api/records/:id
// 指定したIDの記録を更新する
// -----------------------------------------------
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { date, syumoku, omosa, reps, memo, oikomi } = req.body;

  const result = db.prepare(`
    UPDATE training_records
    SET date=?, syumoku=?, omosa=?, reps=?, memo=?, oikomi=?
    WHERE id=?
  `).run(date, syumoku, omosa, reps, memo || '', oikomi ? 1 : 0, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: '記録が見つかりませんでした' });
  }
  res.json({ message: '記録を更新しました' });
});

// -----------------------------------------------
// DELETE /api/records/:id
// 指定したIDの記録を削除する
// -----------------------------------------------
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const result = db.prepare(`
    DELETE FROM training_records WHERE id=?
  `).run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: '記録が見つかりませんでした' });
  }
  res.json({ message: '記録を削除しました' });
});

module.exports = router;
