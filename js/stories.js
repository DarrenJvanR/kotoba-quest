// Story scenes, all in kana. A scene opens once its building is built and you can
// read every kana in it. Lines are [speaker, japanese, english].
import { BY_KANA } from './kana.js';
import { units } from './vocab.js';

export const CAST = {
  me: { name: 'キツネ', emoji: '🦊' },
  granny: { name: 'おばあさん', emoji: '👵' },
  chef: { name: 'てんちょう', emoji: '👨‍🍳' },
  girl: { name: 'ハナ', emoji: '👧' },
  miko: { name: 'みこ', emoji: '👘' },
  staff: { name: 'えきいん', emoji: '🧑‍✈️' },
  tanuki: { name: 'タヌキ', emoji: '🦝' },
};

export const STORIES = [
  {
    id: 'tea-1', building: 'teahouse', title: 'はじめまして', en: 'Nice to meet you',
    lines: [
      ['granny', 'いらっしゃい！', 'Welcome!'],
      ['me', 'こんにちは。', 'Hello.'],
      ['granny', 'おなまえは？', "What's your name?"],
      ['me', 'わたしは キツネです。', "I'm Kitsune."],
      ['granny', 'よろしく おねがいします。', 'Nice to meet you.'],
      ['me', 'よろしく おねがいします！', 'Nice to meet you too!'],
      ['granny', 'おちゃを どうぞ。', 'Please, have some tea.'],
      ['me', 'ありがとう ございます！', 'Thank you very much!'],
    ],
    notes: ['は after a word (わたしは) is read "wa": it marks the topic.', 'を is read "o": it marks the thing an action is done to.'],
    question: { q: 'What does granny offer you?', options: ['tea', 'ramen', 'a book'], answer: 0 },
  },
  {
    id: 'tea-2', building: 'teahouse', title: 'おいしい！', en: 'Delicious!',
    lines: [
      ['granny', 'おちゃは どうですか。', 'How is the tea?'],
      ['me', 'とても おいしいです。', "It's very tasty."],
      ['granny', 'おかしも どうぞ。', 'Have some sweets too.'],
      ['me', 'わあ、だんごですね！', 'Wow, dango!'],
      ['granny', 'すきですか。', 'Do you like them?'],
      ['me', 'はい、だいすきです！', 'Yes, I love them!'],
    ],
    notes: ['か at the end of a sentence turns it into a question.', 'も means "too, also".'],
    question: { q: 'Which sweet does granny give you?', options: ['mochi', 'dango', 'cake'], answer: 1 },
  },
  {
    id: 'ramen-1', building: 'ramen', title: 'ラーメン ひとつ', en: 'One ramen, please',
    lines: [
      ['chef', 'いらっしゃいませ！', 'Welcome!'],
      ['me', 'ラーメンを ひとつ ください。', 'One ramen, please.'],
      ['chef', 'はい！ たまごも いりますか。', 'Sure! Would you like an egg too?'],
      ['me', 'はい、おねがいします。', 'Yes, please.'],
      ['chef', 'どうぞ。あついですよ。', "Here you go. It's hot."],
      ['me', 'いただきます！', "Let's eat!"],
    ],
    notes: ['〜を ください means "please give me ~". It is the easiest way to order.'],
    question: { q: 'What do you add to your ramen?', options: ['cheese', 'tofu', 'an egg'], answer: 2 },
  },
  {
    id: 'ramen-2', building: 'ramen', title: 'ごちそうさま', en: 'Thanks for the meal',
    lines: [
      ['me', 'ごちそうさまでした！', 'Thank you for the meal!'],
      ['chef', 'おいしかったですか。', 'Was it good?'],
      ['me', 'はい、とても！ いくらですか。', 'Yes, very! How much is it?'],
      ['chef', 'はっぴゃく えんです。', "It's 800 yen."],
      ['me', 'はい、どうぞ。', 'Here you are.'],
      ['chef', 'ありがとう ございました！ また きてね。', 'Thank you! Come again.'],
    ],
    notes: ['〜かった is the past tense of an い-adjective: おいしい → おいしかった.'],
    question: { q: 'How much was the ramen?', options: ['100 yen', '800 yen', '8,000 yen'], answer: 1 },
  },
  {
    id: 'garden-1', building: 'garden', title: 'はなが きれい', en: 'The flowers are pretty',
    lines: [
      ['girl', 'みて！ はなが いっぱい！', 'Look! So many flowers!'],
      ['me', 'ほんとうだ。きれいですね。', "It's true. They're pretty, aren't they?"],
      ['girl', 'あの とりは なに？', "What's that bird?"],
      ['me', 'あれは すずめです。', "That's a sparrow."],
      ['girl', 'かわいい！', 'Cute!'],
      ['me', 'いっしょに あそびましょう。', "Let's play together."],
    ],
    notes: ['ね at the end asks for agreement, like "isn\'t it?"', '〜ましょう means "let\'s ~".'],
    question: { q: 'What does Hana ask about?', options: ['a bird', 'a cat', 'a tree'], answer: 0 },
  },
  {
    id: 'shrine-1', building: 'shrine', title: 'おみくじ', en: 'The fortune slip',
    lines: [
      ['miko', 'ようこそ。', 'Welcome.'],
      ['me', 'おみくじを ください。', 'A fortune slip, please.'],
      ['miko', 'はい、どうぞ。', 'Here you are.'],
      ['me', '…だいきち！', '…Great blessing!'],
      ['miko', 'すごい！ いい いちねんに なりますよ。', "Amazing! It'll be a good year."],
      ['me', 'やった！', 'Yay!'],
    ],
    notes: ['だいきち (great blessing) is the best result an おみくじ can give.'],
    question: { q: 'What luck did you draw?', options: ['bad luck', 'small blessing', 'great blessing'], answer: 2 },
  },
  {
    id: 'station-1', building: 'station', title: 'でんしゃは なんじ？', en: 'What time is the train?',
    lines: [
      ['me', 'すみません。きょうとへ いきたいです。', 'Excuse me. I want to go to Kyoto.'],
      ['staff', 'きょうとですね。さんばんせんです。', 'Kyoto? That\'s platform 3.'],
      ['me', 'でんしゃは なんじですか。', 'What time is the train?'],
      ['staff', 'じゅうじ はんです。', 'Half past ten.'],
      ['me', 'ありがとう ございます。', 'Thank you.'],
      ['staff', 'きを つけて！', 'Take care!'],
    ],
    notes: ['へ meaning "to (a place)" is read "e".', '〜たい means "want to ~": いく → いきたい.'],
    question: { q: 'Which platform is the Kyoto train?', options: ['1', '3', '10'], answer: 1 },
  },
  {
    id: 'station-2', building: 'station', title: 'おかえり', en: 'Welcome back',
    lines: [
      ['tanuki', 'おかえり！ たびは どうだった？', 'Welcome back! How was the trip?'],
      ['me', 'たのしかった！ おみやげが あるよ。', 'It was fun! I brought a souvenir.'],
      ['tanuki', 'え、ほんとう？ なに？', 'Really? What is it?'],
      ['me', 'きょうとの おかしだよ。', 'Sweets from Kyoto.'],
      ['tanuki', 'やった！ ありがとう！', 'Yay! Thank you!'],
    ],
    notes: ['Friends talk casually: だった instead of でした, and よ for "you know".'],
    question: { q: 'What souvenir did you bring?', options: ['sweets', 'a book', 'tea'], answer: 0 },
  },
];

const SKIP = /[\s。、！？…「」・〜]/;

// Kana in the text that the learner hasn't met yet (small っ needs つ, ー needs any katakana).
export function unknownKana(text, cards) {
  const missing = new Set();
  for (const u of units(text.replace(/[\s。、！？…「」・〜]/g, ''))) {
    if (SKIP.test(u)) continue;
    if (u === 'っ') { if (!cards['つ']) missing.add('つ'); continue; }
    if (u === 'ッ') { if (!cards['ツ']) missing.add('ツ'); continue; }
    if (u === 'ー') continue;
    if (BY_KANA[u] && !cards[u]) missing.add(u);
  }
  return [...missing];
}

export const storyText = (story) => story.lines.map((l) => l[1]).join('');
