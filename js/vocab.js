// Starter vocabulary. A word unlocks once every kana in it has been learned,
// so new words are always ones you can already read.
import { BY_KANA } from './kana.js';

// [kana, kanji, meaning, emoji, romaji override]
const DECK = {
  basics: [
    ['いい', '', 'good', '👍'],
    ['いいえ', '', 'no', '❌'],
    ['はい', '', 'yes', '⭕'],
    ['あい', '愛', 'love', '❤️'],
    ['いえ', '家', 'house, home', '🏠'],
    ['うえ', '上', 'above, on top', '⬆️'],
    ['あお', '青', 'blue (or green)', '🟦'],
    ['かお', '顔', 'face', '🙂'],
    ['ここ', '', 'here', '📍'],
    ['こえ', '声', 'voice', '🗣️'],
    ['えき', '駅', 'station', '🚉'],
    ['あか', '赤', 'red', '🟥'],
    ['いく', '行く', 'to go', '🚶'],
    ['きく', '聞く', 'to listen; to ask', '👂'],
    ['かく', '書く', 'to write', '✍️'],
    ['かう', '買う', 'to buy', '🛍️'],
    ['あう', '会う', 'to meet', '🤝'],
    ['あき', '秋', 'autumn', '🍁'],
    ['おおきい', '大きい', 'big', '🐘'],
    ['いけ', '池', 'pond', '🪷'],
  ],
  greetings: [
    ['おはよう', '', 'good morning', '🌅'],
    ['こんにちは', '', 'hello', '👋', 'konnichiwa'],
    ['こんばんは', '', 'good evening', '🌙', 'konbanwa'],
    ['さようなら', '', 'goodbye', '👋'],
    ['ありがとう', '', 'thank you', '🙏'],
    ['すみません', '', 'excuse me; sorry', '🙇'],
    ['ごめんなさい', '', "I'm sorry", '🙇'],
    ['おやすみ', '', 'good night', '😴'],
    ['いただきます', '', 'thanks for the food (said before eating)', '🍚'],
    ['ごちそうさま', '', 'thanks for the meal', '🍵'],
    ['おめでとう', '', 'congratulations', '🎉'],
    ['だいじょうぶ', '大丈夫', "okay, all right", '👌'],
  ],
  people: [
    ['わたし', '私', 'I, me', '🙋'],
    ['あなた', '', 'you', '👉'],
    ['ひと', '人', 'person', '🧍'],
    ['ともだち', '友達', 'friend', '🤝'],
    ['かぞく', '家族', 'family', '👪'],
    ['こども', '子供', 'child', '🧒'],
    ['せんせい', '先生', 'teacher', '🧑‍🏫'],
    ['がくせい', '学生', 'student', '🎒'],
    ['おとこ', '男', 'man', '👨'],
    ['おんな', '女', 'woman', '👩'],
    ['ちち', '父', '(my) father', '👨'],
    ['はは', '母', '(my) mother', '👩'],
    ['あに', '兄', '(my) older brother', '👦'],
    ['あね', '姉', '(my) older sister', '👧'],
    ['おとうと', '弟', 'younger brother', '👦'],
    ['いもうと', '妹', 'younger sister', '👧'],
    ['なまえ', '名前', 'name', '📛'],
    ['みんな', '', 'everyone', '👥'],
  ],
  body: [
    ['め', '目', 'eye', '👁️'],
    ['みみ', '耳', 'ear', '👂'],
    ['くち', '口', 'mouth', '👄'],
    ['て', '手', 'hand', '✋'],
    ['あし', '足', 'foot, leg', '🦶'],
    ['あたま', '頭', 'head', '🧠'],
    ['はな', '鼻', 'nose', '👃'],
    ['は', '歯', 'tooth', '🦷'],
    ['かみ', '髪', 'hair', '💇'],
    ['こころ', '心', 'heart, mind', '💗'],
  ],
  animals: [
    ['いぬ', '犬', 'dog', '🐕'],
    ['ねこ', '猫', 'cat', '🐈'],
    ['とり', '鳥', 'bird', '🐦'],
    ['さかな', '魚', 'fish', '🐟'],
    ['うま', '馬', 'horse', '🐎'],
    ['うし', '牛', 'cow', '🐄'],
    ['むし', '虫', 'bug, insect', '🐛'],
    ['きつね', '狐', 'fox', '🦊'],
    ['たぬき', '狸', 'tanuki (raccoon dog)', '🦝'],
    ['くま', '熊', 'bear', '🐻'],
    ['さる', '猿', 'monkey', '🐒'],
    ['うさぎ', '兎', 'rabbit', '🐇'],
    ['へび', '蛇', 'snake', '🐍'],
    ['かめ', '亀', 'turtle', '🐢'],
    ['ねずみ', '鼠', 'mouse', '🐭'],
    ['ぶた', '豚', 'pig', '🐖'],
    ['ひつじ', '羊', 'sheep', '🐑'],
    ['りゅう', '竜', 'dragon', '🐉'],
  ],
  nature: [
    ['やま', '山', 'mountain', '⛰️'],
    ['かわ', '川', 'river', '🏞️'],
    ['うみ', '海', 'sea', '🌊'],
    ['そら', '空', 'sky', '🌌'],
    ['き', '木', 'tree', '🌳'],
    ['はな', '花', 'flower', '🌸'],
    ['みず', '水', 'water', '💧'],
    ['ひ', '火', 'fire', '🔥'],
    ['つき', '月', 'moon; month', '🌙'],
    ['ほし', '星', 'star', '⭐'],
    ['あめ', '雨', 'rain', '🌧️'],
    ['ゆき', '雪', 'snow', '❄️'],
    ['かぜ', '風', 'wind', '🌬️'],
    ['くも', '雲', 'cloud', '☁️'],
    ['いし', '石', 'stone', '🪨'],
    ['もり', '森', 'forest', '🌲'],
    ['しま', '島', 'island', '🏝️'],
    ['たいよう', '太陽', 'sun', '☀️'],
  ],
  food: [
    ['ごはん', 'ご飯', 'rice; meal', '🍚'],
    ['すし', '寿司', 'sushi', '🍣'],
    ['たまご', '卵', 'egg', '🥚'],
    ['にく', '肉', 'meat', '🥩'],
    ['やさい', '野菜', 'vegetables', '🥬'],
    ['くだもの', '果物', 'fruit', '🍇'],
    ['りんご', '', 'apple', '🍎'],
    ['みかん', '', 'mandarin orange', '🍊'],
    ['おちゃ', 'お茶', 'green tea', '🍵'],
    ['みそしる', '味噌汁', 'miso soup', '🥣'],
    ['ぎゅうにゅう', '牛乳', 'milk', '🥛'],
    ['おかし', 'お菓子', 'sweets, snacks', '🍬'],
    ['あさごはん', '朝ご飯', 'breakfast', '🍳'],
    ['ばんごはん', '晩ご飯', 'dinner', '🍱'],
    ['しお', '塩', 'salt', '🧂'],
    ['さとう', '砂糖', 'sugar', '🍯'],
    ['とうふ', '豆腐', 'tofu', '⬜'],
    ['うどん', '', 'udon noodles', '🍜'],
    ['そば', '', 'soba noodles', '🍜'],
    ['おにぎり', '', 'rice ball', '🍙'],
    ['てんぷら', '天ぷら', 'tempura', '🍤'],
    ['だんご', '団子', 'dango (rice dumplings)', '🍡'],
    ['もち', '餅', 'mochi (rice cake)', '⚪'],
  ],
  things: [
    ['ほん', '本', 'book', '📕'],
    ['かばん', '', 'bag', '👜'],
    ['かさ', '傘', 'umbrella', '☂️'],
    ['くつ', '靴', 'shoes', '👟'],
    ['ふく', '服', 'clothes', '👕'],
    ['とけい', '時計', 'clock, watch', '⌚'],
    ['でんわ', '電話', 'telephone', '☎️'],
    ['てがみ', '手紙', 'letter', '✉️'],
    ['かぎ', '鍵', 'key', '🔑'],
    ['はし', '箸', 'chopsticks', '🥢'],
    ['さら', '皿', 'plate', '🍽️'],
    ['おかね', 'お金', 'money', '💴'],
    ['しゃしん', '写真', 'photo', '📷'],
    ['え', '絵', 'picture, painting', '🖼️'],
    ['かみ', '紙', 'paper', '📄'],
    ['はこ', '箱', 'box', '📦'],
    ['いす', '椅子', 'chair', '🪑'],
    ['つくえ', '机', 'desk', '🗄️'],
    ['まど', '窓', 'window', '🪟'],
    ['へや', '部屋', 'room', '🛏️'],
    ['くるま', '車', 'car', '🚗'],
    ['でんしゃ', '電車', 'train', '🚃'],
    ['じてんしゃ', '自転車', 'bicycle', '🚲'],
    ['ふね', '船', 'boat, ship', '⛵'],
    ['ひこうき', '飛行機', 'airplane', '✈️'],
    ['みち', '道', 'road, way', '🛣️'],
    ['きっぷ', '切符', 'ticket', '🎫'],
    ['きって', '切手', 'postage stamp', '📮'],
    ['ざっし', '雑誌', 'magazine', '📰'],
  ],
  places: [
    ['がっこう', '学校', 'school', '🏫'],
    ['みせ', '店', 'shop', '🏪'],
    ['まち', '町', 'town', '🏘️'],
    ['くに', '国', 'country', '🗺️'],
    ['にほん', '日本', 'Japan', '🗾'],
    ['じんじゃ', '神社', 'shrine', '⛩️'],
    ['おてら', 'お寺', 'temple', '🛕'],
    ['にわ', '庭', 'garden', '🌷'],
    ['こうえん', '公園', 'park', '🌳'],
    ['びょういん', '病院', 'hospital', '🏥'],
    ['としょかん', '図書館', 'library', '📚'],
    ['ぎんこう', '銀行', 'bank', '🏦'],
  ],
  time: [
    ['いま', '今', 'now', '⏰'],
    ['きょう', '今日', 'today', '📅'],
    ['あした', '明日', 'tomorrow', '➡️'],
    ['きのう', '昨日', 'yesterday', '⬅️'],
    ['あさ', '朝', 'morning', '🌅'],
    ['ひる', '昼', 'noon, daytime', '🌞'],
    ['よる', '夜', 'night', '🌃'],
    ['まいにち', '毎日', 'every day', '🔁'],
    ['はる', '春', 'spring', '🌸'],
    ['なつ', '夏', 'summer', '🌻'],
    ['ふゆ', '冬', 'winter', '⛄'],
    ['じかん', '時間', 'time, hours', '⏳'],
    ['やすみ', '休み', 'holiday; rest', '🏖️'],
  ],
  numbers: [
    ['いち', '一', 'one', '1️⃣'],
    ['に', '二', 'two', '2️⃣'],
    ['さん', '三', 'three', '3️⃣'],
    ['よん', '四', 'four', '4️⃣'],
    ['ご', '五', 'five', '5️⃣'],
    ['ろく', '六', 'six', '6️⃣'],
    ['なな', '七', 'seven', '7️⃣'],
    ['はち', '八', 'eight', '8️⃣'],
    ['きゅう', '九', 'nine', '9️⃣'],
    ['じゅう', '十', 'ten', '🔟'],
    ['ひゃく', '百', 'hundred', '💯'],
    ['せん', '千', 'thousand', '🔢'],
  ],
  colours: [
    ['しろ', '白', 'white', '⬜'],
    ['くろ', '黒', 'black', '⬛'],
    ['きいろ', '黄色', 'yellow', '🟨'],
    ['みどり', '緑', 'green', '🟩'],
    ['いろ', '色', 'colour', '🎨'],
  ],
  describing: [
    ['ちいさい', '小さい', 'small', '🐜'],
    ['あたらしい', '新しい', 'new', '✨'],
    ['ふるい', '古い', 'old (things)', '🏚️'],
    ['たかい', '高い', 'tall; expensive', '🗼'],
    ['やすい', '安い', 'cheap', '🏷️'],
    ['わるい', '悪い', 'bad', '👎'],
    ['あつい', '暑い', 'hot (weather)', '🥵'],
    ['さむい', '寒い', 'cold (weather)', '🥶'],
    ['おいしい', '美味しい', 'delicious', '😋'],
    ['たのしい', '楽しい', 'fun', '🎈'],
    ['むずかしい', '難しい', 'difficult', '🧩'],
    ['やさしい', '優しい', 'kind, gentle', '🤗'],
    ['はやい', '早い', 'early', '🌅'],
    ['ながい', '長い', 'long', '📏'],
    ['あかるい', '明るい', 'bright', '💡'],
    ['くらい', '暗い', 'dark', '🌑'],
    ['かわいい', '', 'cute', '🥰'],
    ['こわい', '怖い', 'scary', '👻'],
    ['おもしろい', '面白い', 'interesting, funny', '😆'],
    ['げんき', '元気', 'healthy, lively', '💪'],
    ['しずか', '静か', 'quiet', '🤫'],
    ['すき', '好き', 'liked; (I) like it', '😍'],
    ['きれい', '', 'pretty; clean', '💐'],
    ['じょうず', '上手', 'good at', '🎯'],
  ],
  verbs: [
    ['たべる', '食べる', 'to eat', '🍽️'],
    ['のむ', '飲む', 'to drink', '🥤'],
    ['みる', '見る', 'to see, to watch', '👀'],
    ['くる', '来る', 'to come', '🏃'],
    ['する', '', 'to do', '✅'],
    ['はなす', '話す', 'to speak', '💬'],
    ['よむ', '読む', 'to read', '📖'],
    ['ねる', '寝る', 'to sleep', '🛌'],
    ['おきる', '起きる', 'to wake up', '⏰'],
    ['まつ', '待つ', 'to wait', '⌛'],
    ['わかる', '分かる', 'to understand', '💡'],
    ['はしる', '走る', 'to run', '🏃'],
    ['あるく', '歩く', 'to walk', '🚶'],
    ['およぐ', '泳ぐ', 'to swim', '🏊'],
    ['あそぶ', '遊ぶ', 'to play', '🎮'],
    ['うたう', '歌う', 'to sing', '🎤'],
    ['つくる', '作る', 'to make', '🔨'],
    ['かえる', '帰る', 'to go home', '🏡'],
    ['はいる', '入る', 'to enter', '🚪'],
    ['おしえる', '教える', 'to teach', '🧑‍🏫'],
    ['あらう', '洗う', 'to wash', '🧼'],
    ['わすれる', '忘れる', 'to forget', '❓'],
  ],
  handy: [
    ['なに', '何', 'what', '❓'],
    ['だれ', '誰', 'who', '🕵️'],
    ['どこ', '', 'where', '🧭'],
    ['いつ', '', 'when', '📆'],
    ['これ', '', 'this (thing)', '👇'],
    ['あれ', '', 'that (over there)', '👉'],
    ['すこし', '少し', 'a little', '🤏'],
    ['たくさん', '', 'a lot', '📚'],
    ['した', '下', 'below, under', '⬇️'],
    ['みぎ', '右', 'right', '➡️'],
    ['ひだり', '左', 'left', '⬅️'],
    ['なか', '中', 'inside', '📥'],
    ['そと', '外', 'outside', '🌳'],
    ['ことば', '言葉', 'word; language', '💬'],
    ['にほんご', '日本語', 'Japanese (language)', '🗾'],
    ['えいご', '英語', 'English (language)', '🔤'],
    ['しごと', '仕事', 'work, job', '💼'],
    ['べんきょう', '勉強', 'study', '📖'],
    ['くすり', '薬', 'medicine', '💊'],
    ['おまつり', 'お祭り', 'festival', '🏮'],
    ['ゆめ', '夢', 'dream', '💭'],
    ['うた', '歌', 'song', '🎵'],
    ['てんき', '天気', 'weather', '⛅'],
    ['いっしょ', '一緒', 'together', '👫'],
    ['ちょっと', '', 'a little; just a moment', '🤏'],
  ],
  katakana: [
    ['パン', '', 'bread', '🍞'],
    ['テレビ', '', 'TV', '📺'],
    ['カメラ', '', 'camera', '📷'],
    ['ゲーム', '', 'game', '🎮'],
    ['アニメ', '', 'anime', '🎬'],
    ['ホテル', '', 'hotel', '🏨'],
    ['バス', '', 'bus', '🚌'],
    ['タクシー', '', 'taxi', '🚕'],
    ['トイレ', '', 'toilet', '🚻'],
    ['ケーキ', '', 'cake', '🍰'],
    ['アイス', '', 'ice cream', '🍨'],
    ['ジュース', '', 'juice', '🧃'],
    ['コーヒー', '', 'coffee', '☕'],
    ['ペン', '', 'pen', '🖊️'],
    ['ノート', '', 'notebook', '📓'],
    ['シャツ', '', 'shirt', '👕'],
    ['メニュー', '', 'menu', '📋'],
    ['ラーメン', '', 'ramen', '🍜'],
    ['カレー', '', 'curry', '🍛'],
    ['トマト', '', 'tomato', '🍅'],
    ['バナナ', '', 'banana', '🍌'],
    ['メロン', '', 'melon', '🍈'],
    ['ピアノ', '', 'piano', '🎹'],
    ['ギター', '', 'guitar', '🎸'],
    ['サッカー', '', 'soccer', '⚽'],
    ['テニス', '', 'tennis', '🎾'],
    ['プール', '', 'swimming pool', '🏊'],
    ['コンビニ', '', 'convenience store', '🏪'],
    ['スマホ', '', 'smartphone', '📱'],
    ['パソコン', '', 'computer', '💻'],
    ['ロボット', '', 'robot', '🤖'],
    ['ニュース', '', 'news', '📰'],
    ['チーズ', '', 'cheese', '🧀'],
    ['ピザ', '', 'pizza', '🍕'],
    ['ハンバーガー', '', 'hamburger', '🍔'],
    ['チョコレート', '', 'chocolate', '🍫'],
    ['レストラン', '', 'restaurant', '🍽️'],
    ['エレベーター', '', 'elevator', '🛗'],
  ],
};

// Souvenir words: they join your daily quest once you travel to their town.
const REGION_DECKS = {
  kyoto: [
    ['きょうと', '京都', 'Kyoto', '🏯'],
    ['きもの', '着物', 'kimono', '👘'],
    ['ゆかた', '浴衣', 'yukata (summer kimono)', '👘'],
    ['おび', '帯', 'obi (kimono sash)', '🎀'],
    ['げた', '下駄', 'geta (wooden sandals)', '🩴'],
    ['せんす', '扇子', 'folding fan', '🪭'],
    ['ちょうちん', '提灯', 'paper lantern', '🏮'],
    ['とりい', '鳥居', 'torii (shrine gate)', '⛩️'],
    ['かみさま', '神様', 'god, deity', '✨'],
    ['ほとけ', '仏', 'Buddha', '🙏'],
    ['おまいり', 'お参り', 'visit to a shrine or temple', '🙏'],
    ['さいせん', '賽銭', 'offering money', '🪙'],
    ['おまもり', 'お守り', 'good-luck charm', '🧧'],
    ['おみくじ', '', 'fortune slip', '📜'],
    ['ねがい', '願い', 'wish', '🌠'],
    ['いのる', '祈る', 'to pray', '🙏'],
    ['かね', '鐘', 'temple bell', '🔔'],
    ['いなり', '稲荷', 'Inari (rice god; foxes are its messengers)', '🦊'],
    ['たけ', '竹', 'bamboo', '🎋'],
    ['こけ', '苔', 'moss', '🌿'],
    ['はし', '橋', 'bridge', '🌉'],
    ['さくら', '桜', 'cherry blossom', '🌸'],
    ['もみじ', '紅葉', 'autumn leaves, maple', '🍁'],
    ['はなみ', '花見', 'cherry-blossom viewing', '🌸'],
    ['きせつ', '季節', 'season', '🗓️'],
    ['まっちゃ', '抹茶', 'matcha (powdered green tea)', '🍵'],
    ['わがし', '和菓子', 'traditional Japanese sweets', '🍡'],
    ['ちゃわん', '茶碗', 'tea bowl', '🍵'],
    ['きつねうどん', '', 'udon with fried tofu', '🍜'],
    ['りょかん', '旅館', 'traditional inn (ryokan)', '🏯'],
    ['おんせん', '温泉', 'hot spring', '♨️'],
    ['ふとん', '布団', 'futon', '🛏️'],
    ['たたみ', '畳', 'tatami mat', '🟫'],
    ['しょうじ', '障子', 'shoji (paper sliding door)', '🚪'],
    ['ざぶとん', '座布団', 'floor cushion', '🟪'],
    ['ゆうしょく', '夕食', 'dinner', '🍱'],
    ['ちょうしょく', '朝食', 'breakfast', '🍳'],
    ['かんこう', '観光', 'sightseeing', '📸'],
    ['かんこうきゃく', '観光客', 'tourist', '🧳'],
    ['ちず', '地図', 'map', '🗺️'],
    ['あんない', '案内', 'guidance; showing around', '💁'],
    ['おみやげ', 'お土産', 'souvenir', '🎁'],
    ['れきし', '歴史', 'history', '📜'],
    ['むかし', '昔', 'long ago, the old days', '⏳'],
    ['しろ', '城', 'castle', '🏯'],
    ['まいこ', '舞妓', 'maiko (apprentice geisha)', '💃'],
    ['おどり', '踊り', 'dance', '💃'],
    ['きんいろ', '金色', 'gold (colour)', '🟨'],
    ['ぎんいろ', '銀色', 'silver (colour)', '⬜'],
    ['さんぽ', '散歩', 'walk, stroll', '🚶'],
    ['のぼる', '登る', 'to climb', '🧗'],
    ['ちかい', '近い', 'near, close', '📍'],
    ['とおい', '遠い', 'far', '🔭'],
    ['うつくしい', '美しい', 'beautiful', '✨'],
    ['にぎやか', '賑やか', 'lively, bustling', '🎉'],
    ['ゆっくり', '', 'slowly; take your time', '🐢'],
  ],
};

const SMALL_Y = 'ゃゅょャュョ';
const SOKUON = 'っッ';
const LONG = 'ー';

export function units(kana) {
  const out = [];
  for (const ch of kana) {
    if (SMALL_Y.includes(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

export function romajiOf(kana) {
  const us = units(kana);
  let r = '';
  us.forEach((u, i) => {
    if (SOKUON.includes(u)) {
      const next = BY_KANA[us[i + 1]]?.romaji || '';
      r += next.startsWith('ch') ? 't' : next[0] || '';
    } else if (u === LONG) {
      r = r.slice(0, -1) + ({ a: 'ā', i: 'ī', u: 'ū', e: 'ē', o: 'ō' }[r.slice(-1)] || r.slice(-1));
    } else {
      r += BY_KANA[u]?.romaji ?? '?';
    }
  });
  return r;
}

// Folds spelling differences (si/shi, ou/ō/o, nn/n...) so close-enough romaji counts.
export function loose(s) {
  return s.toLowerCase()
    .replace(/ā/g, 'aa').replace(/ī/g, 'ii').replace(/ū/g, 'uu').replace(/ē/g, 'ee').replace(/ō/g, 'ou')
    .replace(/[^a-z]/g, '')
    .replace(/sy/g, 'sh').replace(/[tc]y/g, 'ch').replace(/[zj]y/g, 'j')
    .replace(/si/g, 'shi').replace(/(?<![sc])hu/g, 'fu').replace(/tu/g, 'tsu').replace(/ti/g, 'chi')
    .replace(/[zd]i/g, 'ji').replace(/du/g, 'zu').replace(/wo/g, 'o')
    .replace(/nn/g, 'n')
    .replace(/ou|oo/g, 'o').replace(/uu/g, 'u').replace(/aa/g, 'a').replace(/ii/g, 'i').replace(/ee/g, 'e');
}

const toHira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

const makeWord = (theme, region) => ([kana, kanji, meaning, emoji, override]) => {
  const romaji = override || romajiOf(kana);
  return {
    key: `w:${kana}${kanji ? `:${kanji}` : ''}`,
    type: 'word',
    kana, kanji, meaning, emoji, theme, romaji, region,
    script: /[゠-ヿ]/.test(kana) ? 'kata' : 'hira',
    units: units(kana).filter((u) => !SOKUON.includes(u) && u !== LONG),
    sokuon: [...kana].some((c) => SOKUON.includes(c)),
    long: kana.includes(LONG),
  };
};

export const WORDS = [
  ...Object.entries(DECK).flatMap(([theme, rows]) => rows.map(makeWord(theme, null))),
  ...Object.entries(REGION_DECKS).flatMap(([region, rows]) => rows.map(makeWord(`${region[0].toUpperCase()}${region.slice(1)} souvenirs`, region))),
];
export const WORD_BY_KEY = Object.fromEntries(WORDS.map((w) => [w.key, w]));

export function isWordCorrect(word, input) {
  const raw = input.trim();
  if (!raw) return false;
  if (raw === word.kana || raw === word.kanji || toHira(raw) === toHira(word.kana)) return true;
  return loose(raw) === loose(word.romaji);
}

// Readable once all its kana have been introduced. Small っ is a small つ; ー arrives with katakana.
export function isUnlocked(word, cards) {
  if (!word.units.every((u) => cards[u])) return false;
  if (word.sokuon && !cards[word.script === 'kata' ? 'ツ' : 'つ']) return false;
  return true;
}

export function wordTip(word) {
  const tips = [];
  if (word.sokuon) tips.push('Small っ means a tiny pause: double the next sound.');
  if (word.long) tips.push('ー stretches the vowel before it.');
  if (word.romaji !== romajiOf(word.kana)) tips.push('は is read "wa" in greetings like this.');
  return tips.join(' ');
}
