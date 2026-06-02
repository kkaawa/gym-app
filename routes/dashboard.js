// ===== routes/dashboard.js =====
// ダッシュボード用の集計データをまとめて返すAPIルート

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// -----------------------------------------------
// GET /api/dashboard
// ダッシュボードに必要な全データを一度に返す
// -----------------------------------------------
router.get('/', (req, res) => {

  // 今日の日付を「YYYY-MM-DD」形式で取得
  const today = new Date().toISOString().split('T')[0];

  // 今月の最初の日（例：2025-06-01）
  const firstDayOfMonth = today.slice(0, 7) + '-01';

  // 今週の月曜日を計算する
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=日, 1=月, ..., 6=土
  const diffToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const mondayStr = monday.toISOString().split('T')[0];

  // ---------- 今日のトレーニング状態 ----------
  const todayRecords = db.prepare(`
    SELECT * FROM training_records WHERE date = ?
  `).all(today);

  const todaySets   = todayRecords.length;
  const todayVolume = todayRecords.reduce((sum, r) => sum + r.omosa * r.reps, 0);

  // ---------- 今週の曜日別トレーニング達成 ----------
  const weekRecords = db.prepare(`
    SELECT DISTINCT date FROM training_records
    WHERE date >= ?
  `).all(mondayStr);

  const weekDates = weekRecords.map(r => r.date); // トレーニングした日付の配列

  // ---------- 今月のトレーニング ----------
  const monthRecords = db.prepare(`
    SELECT * FROM training_records
    WHERE date >= ?
  `).all(firstDayOfMonth);

  // 今月のトレーニング日数（重複なし）
  const monthDays = new Set(monthRecords.map(r => r.date)).size;
  const monthVolume = monthRecords.reduce((sum, r) => sum + r.omosa * r.reps, 0);

  // ---------- 累計トレーニング日数 ----------
  const totalDaysRow = db.prepare(`
    SELECT COUNT(DISTINCT date) AS total FROM training_records
  `).get();

  // ---------- まとめてレスポンスを返す ----------
  res.json({
    today: {
      hasTraining : todaySets > 0,
      sets        : todaySets,
      volume      : Math.round(todayVolume)
    },
    week: {
      trainingDates: weekDates // ['2025-06-02', '2025-06-04', ...] の形式
    },
    month: {
      days  : monthDays,
      volume: Math.round(monthVolume)
    },
    total: {
      days: totalDaysRow.total
    }
  });
});

module.exports = router;
