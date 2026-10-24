// Towns you can travel to. Each has its own buildings, monsters and battle background, and a
// ticket that needs coins plus a learning goal, so you never arrive somewhere you can't read.

export const REGIONS = {
  home: {
    id: 'home', jp: 'ふるさと', kanji: '故郷', en: 'Home village',
    bg: 'art/battle-bg.png', monsters: ['axolotl', 'tengu', 'witch'], boss: 'dragonknight',
    bookBonus: 100,
  },
  kyoto: {
    id: 'kyoto', jp: 'きょうと', kanji: '京都', en: 'Kyoto',
    blurb: 'Temples, tea, kimono and ten thousand torii gates.',
    ticket: 400, requires: { hira: 104, words: 60 },
    bg: 'art/kyoto/battle-bg.png', monsters: ['kappa', 'karakasa'], boss: 'oni',
    bookBonus: 150,
  },
};

export const REGION_ORDER = ['home', 'kyoto'];

export const BUILDINGS = [
  // Home village
  { id: 'dojo', region: 'home', jp: 'どうじょう', kanji: '道場', en: 'Dojo', cost: 0, desc: 'Where your daily battles start.', open: 'study', openLabel: 'Start battle' },
  { id: 'arcade', region: 'home', jp: 'ゲームセンター', en: 'Arcade', cost: 40, desc: 'Three mini-games: Kana Rain, Memory Match and Word Builder.', open: 'arcade', openLabel: 'Play' },
  { id: 'teahouse', region: 'home', jp: 'ちゃや', kanji: '茶屋', en: 'Tea house', cost: 60, desc: 'Granny serves tea and stories. Opens story scenes.', open: 'story', openLabel: 'Visit' },
  { id: 'garden', region: 'home', jp: 'にわ', kanji: '庭', en: 'Garden', cost: 80, desc: 'Cherry trees and a new friend, Hana.', open: 'story', openLabel: 'Visit' },
  { id: 'ramen', region: 'home', jp: 'ラーメンや', kanji: 'ラーメン屋', en: 'Ramen shop', cost: 90, desc: 'Order your first bowl, in Japanese.', open: 'story', openLabel: 'Visit' },
  { id: 'shrine', region: 'home', jp: 'じんじゃ', kanji: '神社', en: 'Shrine', cost: 120, desc: 'Gives one extra streak freeze every month, and a fortune to read.', open: 'story', openLabel: 'Visit' },
  { id: 'library', region: 'home', jp: 'としょかん', kanji: '図書館', en: 'Library', cost: 150, desc: 'Unlocks kanji lessons, taught through their building blocks.', open: 'kanji', openLabel: 'Study kanji' },
  { id: 'station', region: 'home', jp: 'えき', kanji: '駅', en: 'Station', cost: 200, desc: 'Two travel stories, and train tickets to new towns.', open: 'story', openLabel: 'Visit' },
  { id: 'castle', region: 'home', jp: 'しろ', kanji: '城', en: 'Castle', cost: 500, desc: 'The crown of every town. Pure bragging rights.' },
  // Kyoto
  { id: 'kinkakuji', region: 'kyoto', jp: 'きんかくじ', kanji: '金閣寺', en: 'Golden Pavilion', cost: 80, desc: 'A temple covered in gold leaf, beside a quiet pond.', open: 'story', openLabel: 'Visit' },
  { id: 'tearoom', region: 'kyoto', jp: 'ちゃしつ', kanji: '茶室', en: 'Tea room', cost: 100, desc: 'Learn the manners of a tea ceremony.', open: 'story', openLabel: 'Visit' },
  { id: 'kimono', region: 'kyoto', jp: 'きものや', kanji: '着物屋', en: 'Kimono shop', cost: 120, desc: 'Rent a kimono and choose your colours.', open: 'story', openLabel: 'Visit' },
  { id: 'bamboo', region: 'kyoto', jp: 'ちくりん', kanji: '竹林', en: 'Bamboo grove', cost: 140, desc: 'A quiet walk through tall bamboo.', open: 'story', openLabel: 'Visit' },
  { id: 'inari', region: 'kyoto', jp: 'ふしみいなり', kanji: '伏見稲荷', en: 'Fushimi Inari', cost: 160, desc: 'Ten thousand red torii gates, guarded by foxes.', open: 'story', openLabel: 'Visit' },
  { id: 'ryokan', region: 'kyoto', jp: 'りょかん', kanji: '旅館', en: 'Ryokan inn', cost: 250, desc: 'Tatami rooms, dinner and a hot spring.', open: 'story', openLabel: 'Visit' },
];

export const buildingArt = (b) => (b.region === 'home' ? `art/town/${b.id}.png` : `art/${b.region}/${b.id}.png`);
