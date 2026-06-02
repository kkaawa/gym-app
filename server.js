const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// publicフォルダの静的ファイルを配信
app.use(express.static(path.join(__dirname, 'public')));
// 種目画像フォルダを /trainingphote として配信
app.use('/trainingphote', express.static(path.join(__dirname, 'trainingphote')));
// リクエストボディをJSONとして受け取る
app.use(express.json());

// APIルート
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/records',   require('./routes/records'));
app.use('/api/goals',     require('./routes/goals'));
app.use('/api/pr',        require('./routes/pr'));
app.use('/api/card',      require('./routes/card'));

app.listen(PORT, () => {
  console.log(`サーバー起動中: http://localhost:${PORT}`);
});
