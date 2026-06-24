// ===== storage.js =====
// localStorageを使ったデータ管理層（GitHub Pages対応）

var DB = {
  getRecords: function() {
    return JSON.parse(localStorage.getItem('gym_records') || '[]');
  },
  saveRecords: function(records) {
    localStorage.setItem('gym_records', JSON.stringify(records));
  },
  getGoals: function() {
    return JSON.parse(localStorage.getItem('gym_goals') || '[]');
  },
  saveGoals: function(goals) {
    localStorage.setItem('gym_goals', JSON.stringify(goals));
  },
  nextId: function(items) {
    if (items.length === 0) return 1;
    return Math.max.apply(null, items.map(function(i) { return i.id; })) + 1;
  },

  addRecord: function(data) {
    var records = DB.getRecords();
    var record = {
      id: DB.nextId(records),
      date: data.date,
      syumoku: data.syumoku,
      omosa: data.omosa,
      reps: data.reps,
      memo: data.memo || '',
      oikomi: data.oikomi ? 1 : 0,
      training_type: data.training_type || ''
    };
    records.unshift(record);
    DB.saveRecords(records);
    return record;
  },
  updateRecord: function(id, data) {
    var records = DB.getRecords();
    var idx = records.findIndex(function(r) { return r.id === Number(id); });
    if (idx === -1) return false;
    records[idx] = Object.assign({}, records[idx], {
      date: data.date,
      syumoku: data.syumoku,
      omosa: data.omosa,
      reps: data.reps,
      memo: data.memo || '',
      oikomi: data.oikomi ? 1 : 0
    });
    DB.saveRecords(records);
    return true;
  },
  deleteRecord: function(id) {
    var records = DB.getRecords();
    var filtered = records.filter(function(r) { return r.id !== Number(id); });
    if (filtered.length === records.length) return false;
    DB.saveRecords(filtered);
    return true;
  },

  addGoal: function(data) {
    var goals = DB.getGoals();
    var goal = {
      id: DB.nextId(goals),
      syumoku: data.syumoku,
      target_weight: data.target_weight,
      target_date: data.target_date,
      created_at: new Date().toISOString().split('T')[0]
    };
    goals.unshift(goal);
    DB.saveGoals(goals);
    return goal;
  },
  deleteGoal: function(id) {
    var goals = DB.getGoals();
    var filtered = goals.filter(function(g) { return g.id !== Number(id); });
    if (filtered.length === goals.length) return false;
    DB.saveGoals(filtered);
    return true;
  },

  getDashboard: function() {
    var records = DB.getRecords();
    var today = new Date().toISOString().split('T')[0];
    var firstDayOfMonth = today.slice(0, 7) + '-01';

    var now = new Date();
    var dayOfWeek = now.getDay();
    var diffToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
    var monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    var mondayStr = monday.toISOString().split('T')[0];

    var todayRecords = records.filter(function(r) { return r.date === today; });
    var todaySets = todayRecords.length;
    var todayVolume = todayRecords.reduce(function(sum, r) { return sum + r.omosa * r.reps; }, 0);

    var weekDates = [];
    records.forEach(function(r) {
      if (r.date >= mondayStr && weekDates.indexOf(r.date) === -1) weekDates.push(r.date);
    });

    var monthRecords = records.filter(function(r) { return r.date >= firstDayOfMonth; });
    var monthDates = [];
    monthRecords.forEach(function(r) { if (monthDates.indexOf(r.date) === -1) monthDates.push(r.date); });
    var monthVolume = monthRecords.reduce(function(sum, r) { return sum + r.omosa * r.reps; }, 0);

    var allDates = [];
    records.forEach(function(r) { if (allDates.indexOf(r.date) === -1) allDates.push(r.date); });

    return {
      today: { hasTraining: todaySets > 0, sets: todaySets, volume: Math.round(todayVolume) },
      week: { trainingDates: weekDates },
      month: { days: monthDates.length, volume: Math.round(monthVolume) },
      total: { days: allDates.length }
    };
  },

  getPR: function() {
    var records = DB.getRecords();
    var byExercise = {};
    records.forEach(function(r) {
      if (!byExercise[r.syumoku] || r.omosa > byExercise[r.syumoku].best_weight) {
        byExercise[r.syumoku] = {
          syumoku: r.syumoku,
          best_weight: r.omosa,
          reps: r.reps,
          achieved_date: r.date
        };
      }
    });
    var volumes = {};
    records.forEach(function(r) {
      volumes[r.syumoku] = (volumes[r.syumoku] || 0) + r.omosa * r.reps;
    });
    return Object.values(byExercise).map(function(pr) {
      return Object.assign({}, pr, {
        total_volume: volumes[pr.syumoku],
        estimated_1rm: Math.round(pr.best_weight * (1 + pr.reps / 30) * 10) / 10
      });
    }).sort(function(a, b) { return a.syumoku.localeCompare(b.syumoku); });
  },

  getCard: function() {
    var records = DB.getRecords();
    var allDates = [];
    records.forEach(function(r) { if (allDates.indexOf(r.date) === -1) allDates.push(r.date); });
    var totalWorkouts = allDates.length;
    var totalVolume = Math.round(records.reduce(function(sum, r) { return sum + r.omosa * r.reps; }, 0));

    var big3Syumoku = ['ベンチプレス', 'スクワット', 'デッドリフト'];
    var big3 = {};
    big3Syumoku.forEach(function(syumoku) {
      var recs = records.filter(function(r) { return r.syumoku === syumoku; });
      if (recs.length === 0) { big3[syumoku] = null; return; }
      var best1rm = recs.reduce(function(best, r) {
        var rm = r.omosa * (1 + r.reps / 30);
        return rm > best ? rm : best;
      }, 0);
      big3[syumoku] = Math.round(best1rm * 10) / 10;
    });

    var sortedDates = allDates.slice().sort();
    var longestStreak = 0;
    var currentStreak = sortedDates.length > 0 ? 1 : 0;
    for (var i = 1; i < sortedDates.length; i++) {
      var diffDays = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / 86400000;
      if (diffDays === 1) { currentStreak++; }
      else { longestStreak = Math.max(longestStreak, currentStreak); currentStreak = 1; }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    return { totalWorkouts: totalWorkouts, totalVolume: totalVolume, longestStreak: longestStreak, big3: big3 };
  }
};
