// ===== exercises.js =====
// 全種目リストと部位マッピングを一元管理する共通データファイル
// このファイルを読み込めばどのページでも使えるようにする

// 種目リスト（部位でグループ化）
const EXERCISE_DATA = [
  {
    category: '胸',
    exercises: [
      'ベンチプレス','ダンベルベンチプレス','スミスマシンベンチプレス','チェストプレス',
      'インクラインベンチプレス','インクラインダンベルプレス','インクラインスミスプレス',
      'インクラインチェストプレス','リバースグリップベンチプレス',
      'デクラインベンチプレス','デクラインダンベルプレス','デクラインチェストプレス',
      'ダンベルフライ','インクラインダンベルフライ','ケーブルフライ',
      'インクラインケーブルフライ','ペックフライ',
      'ディップス','加重ディップス',
    ]
  },
  {
    category: '肩',
    exercises: [
      'ショルダープレス','ダンベルショルダープレス','ミリタリープレス','アーノルドプレス','フロントレイズ',
      'サイドレイズ','ケーブルサイドレイズ','マシンサイドレイズ','アップライトロー',
      'リアレイズ','ケーブルリアレイズ','リアデルトフライ','フェイスプル','リバースペックデック',
    ]
  },
  {
    category: '足',
    exercises: [
      'スクワット','フロントスクワット','ハックスクワット','レッグプレス',
      'ブルガリアンスクワット','レッグエクステンション','ゴブレットスクワット','シシースクワット',
      'スミススクワット',
      'レッグカール','ライイングレッグカール','シーテッドレッグカール',
      'ルーマニアンデッドリフト','グッドモーニング',
      'ヒップスラスト','グルートブリッジ','ケーブルキックバック',
      'スタンディングカーフレイズ','シーテッドカーフレイズ',
      'レッグプレスカーフレイズ','ドンキーカーフレイズ',
    ]
  },
  {
    category: '腕',
    exercises: [
      'バーベルカール','EZバーカール','ダンベルカール','インクラインダンベルカール',
      'ハンマーカール','プリーチャーカール','ケーブルハンマーカール',
      'ナローベンチプレス','JMプレス','スカルクラッシャー','フレンチプレス',
      'ライイングトライセプスエクステンション','ケーブルプレスダウン',
      'オーバーヘッドエクステンション','ケーブルオーバーヘッドエクステンション',
    ]
  },
  {
    category: '背中',
    exercises: [
      '懸垂','ラットプルダウン','フロントラットプルダウン',
      'シーテッドロー','ケーブルロー','ワンハンドダンベルロー',
      'Tバーロー','ベントオーバーロー','バーベルロー','ペンドレイロー',
      'マシンロー','チェストサポートロー',
      'デッドリフト','ラックプル','スナッチグリップデッドリフト',
    ]
  },
];

// 種目名 → 部位カテゴリ の逆引きマップを自動生成
// 例: { 'ベンチプレス': '胸', 'スクワット': '足', ... }
const EXERCISE_TO_CATEGORY = {};
EXERCISE_DATA.forEach(group => {
  group.exercises.forEach(name => {
    EXERCISE_TO_CATEGORY[name] = group.category;
  });
});

// 部位カテゴリ → 背景画像パス
const CATEGORY_IMAGES = {
  '胸' : '/trainingphote/BENCH%20PRESS.png',
  '背中': '/trainingphote/DEADLIFT.png',
  '肩' : '/trainingphote/MILITARY%20PRESS.png',
  '腕' : '/trainingphote/BARBELL%20CURL.png',
  '足' : '/trainingphote/SQUAT.png',
};

// datalist や select に全種目を動的に追加するヘルパー関数
// elementId: datalist または select の id
function populateExerciseList(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // datalist の場合
  if (el.tagName === 'DATALIST') {
    el.innerHTML = EXERCISE_DATA.flatMap(group =>
      group.exercises.map(name => `<option value="${name}">`)
    ).join('');
  }

  // select の場合（optgroup でグループ化）
  if (el.tagName === 'SELECT') {
    const firstOption = el.querySelector('option[value=""]');
    el.innerHTML = firstOption ? firstOption.outerHTML : '';
    EXERCISE_DATA.forEach(group => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.category;
      group.exercises.forEach(name => {
        const opt   = document.createElement('option');
        opt.value   = name;
        opt.textContent = name;
        optgroup.appendChild(opt);
      });
      el.appendChild(optgroup);
    });
  }
}
