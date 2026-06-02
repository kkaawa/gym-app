const Database = require('better-sqlite3');
const db = new Database('gym.db');

// テーブル作成（なければ）
db.exec(`
  CREATE TABLE IF NOT EXISTS training_records (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    date    TEXT    NOT NULL,
    syumoku TEXT    NOT NULL,
    omosa   REAL    NOT NULL,
    reps    INTEGER NOT NULL,
    memo    TEXT,
    oikomi  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS goals (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    syumoku       TEXT NOT NULL,
    target_weight REAL NOT NULL,
    target_date   TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );
`);

// training_type カラムがなければ追加（既存DBへのマイグレーション）
try {
  db.exec(`ALTER TABLE training_records ADD COLUMN training_type TEXT DEFAULT ''`);
} catch(e) {
  // すでにカラムが存在する場合は何もしない
}

module.exports = db;
