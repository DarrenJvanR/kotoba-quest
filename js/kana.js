// Every kana the app teaches, grouped into lessons ("rows") in teaching order.
// Katakana is derived from hiragana (same romaji, codepoint + 0x60) with its own mnemonics.

const HIRA_ROWS = [
  ['a', [
    ['あ', 'a', 'A cross with a big loop: an Apple on a stick and you go "Ah!"'],
    ['い', 'i', 'Two strokes side by side like two eels: "ee-ee".'],
    ['う', 'u', 'A dash over a hook: someone with a sore tummy going "ooh".'],
    ['え', 'e', 'A dancer with a feather on her head kicking a leg out: "eh!"'],
    ['お', 'o', 'Like あ but a dash flies off the side: "Oh! It broke."'],
  ]],
  ['ka', [
    ['か', 'ka', 'A blade with a spark beside it: KArate chop!'],
    ['き', 'ki', 'A KEY: two teeth on top, the curve at the bottom is the handle.'],
    ['く', 'ku', 'An open bird beak calling "cuckoo".'],
    ['け', 'ke', 'A KEg: a post with a tap sticking out.'],
    ['こ', 'ko', 'Two strokes swimming side by side like two KOi fish.'],
  ]],
  ['sa', [
    ['さ', 'sa', 'Like き with a tooth missing: a broken key is SAd.'],
    ['し', 'shi', "A SHEpherd's hook."],
    ['す', 'su', 'A SUper fun swing that loops all the way around.'],
    ['せ', 'se', 'A mouth with one big vampire fang. SEE it?'],
    ['そ', 'so', 'A zig-zag of SEWing thread.'],
  ]],
  ['ta', [
    ['た', 'ta', 'Looks like a "t" and an "a" squashed together: ta.'],
    ['ち', 'chi', 'A backwards 5: a CHEEky number five.'],
    ['つ', 'tsu', 'A TSUnami wave rolling in.'],
    ['て', 'te', '"Te" means hand: an arm reaching out to swat a TEnnis ball.'],
    ['と', 'to', 'A TOe with a splinter stuck in it.'],
  ]],
  ['na', [
    ['な', 'na', 'A cross with a knotted rope hanging off it: kNAt.'],
    ['に', 'ni', 'A bent KNEE beside two lines. "Ni" means two!'],
    ['ぬ', 'nu', 'NOOdles: chopsticks crossing a loop of noodle.'],
    ['ね', 'ne', 'A NEko (cat) curled up with a curly tail.'],
    ['の', 'no', 'A "NO entry" sign: a circle with a slash.'],
  ]],
  ['ha', [
    ['は', 'ha', 'Looks like an H next to an a: "Ha!"'],
    ['ひ', 'hi', 'A big grin laughing "HEE hee!"'],
    ['ふ', 'fu', 'A face blowing "FUuu" with puffs of air on both sides.'],
    ['へ', 'he', 'A tiny mountain: "HEy, I made it to the top!"'],
    ['ほ', 'ho', 'Like は with a chimney on top: a HOuse.'],
  ]],
  ['ma', [
    ['ま', 'ma', 'A MAst with two sails and a loop of rope.'],
    ['み', 'mi', 'Looks like the number 21: "MEet me at 21."'],
    ['む', 'mu', 'A cow\'s face with a nose ring: "MOO".'],
    ['め', 'me', '"Me" means eye: an eye with a lash across it.'],
    ['も', 'mo', 'A fishing hook catching MOre fish (two bars, two fish).'],
  ]],
  ['ya', [
    ['や', 'ya', 'A YAk with horns, charging.'],
    ['ゆ', 'yu', 'A fish swimming in a U-turn: "YOU turn!"'],
    ['よ', 'yo', 'A YO-yo dangling from a finger.'],
  ]],
  ['ra', [
    ['ら', 'ra', 'A RAbbit sitting up, one ear on top.'],
    ['り', 'ri', 'Two REEDs bending in the wind.'],
    ['る', 'ru', 'A ROUte with a loop-de-loop at the end.'],
    ['れ', 're', 'A man kneeling with his leg stretched out, RElaxing.'],
    ['ろ', 'ro', 'Like る without the loop: a ROad with no roundabout.'],
  ]],
  ['wa', [
    ['わ', 'wa', 'Like ね without the curly tail: the cat lost its tail, "WAh!"'],
    ['を', 'wo', 'Someone winding up to kick a ball: "WOah!" (said "o" today).'],
    ['ん', 'n', 'A lowercase n with a little tail.'],
  ]],
];

const KATA_MNEMONICS = {
  'ア': 'An Axe.',
  'イ': 'An EAgle perched on a branch.',
  'ウ': 'う wearing a flat hat: "OOh, nice hat."',
  'エ': 'An Elevator shaft, or a steel I-beam.',
  'オ': 'An Opera singer flinging her arms out.',
  'カ': 'か without its spark: still a KArate chop.',
  'キ': 'A KEY with two teeth.',
  'ク': 'A bird with a cap on calling "cuckoo".',
  'ケ': 'A KEg on a stand.',
  'コ': 'The COrner of a box.',
  'サ': 'Two SAmurai swords crossing a bar.',
  'シ': 'A smiling SHE: two eyes on the left, the smile sweeps UP.',
  'ス': 'A SUperhero with a cape flapping.',
  'セ': 'Like せ: SEE the vampire fang?',
  'ソ': 'A SEWing needle: one dot, the thread falls DOWN.',
  'タ': 'Like ク with one more line: TAke another.',
  'チ': 'A CHEErleader holding a pom-pom over her head.',
  'ツ': 'A TSUnami: two dots on top, the wave sweeps DOWN.',
  'テ': 'A TElephone pole with wires.',
  'ト': 'A TOtem pole with one branch.',
  'ナ': 'A cross: hammer the NAils in.',
  'ニ': 'Two lines. "Ni" means two!',
  'ヌ': 'A chopstick slashing through NOOdles.',
  'ネ': 'A NEcktie on a coat hanger.',
  'ノ': 'One stroke that just says NO.',
  'ハ': 'Two lines like a laughing mouth: "HA!"',
  'ヒ': 'Someone flat on their back laughing "HEE".',
  'フ': 'ふ shrunk down to one hook: FOOl!',
  'ヘ': 'Exactly the same as へ: HEy, the mountain again.',
  'ホ': 'A HOly cross with a candle on each side.',
  'マ': 'A MArtini glass.',
  'ミ': 'Three lines, like a MIni ladder.',
  'ム': 'A MOOse head.',
  'メ': 'An X marks the spot where we MEt.',
  'モ': 'Like も: MOre fish on the hook.',
  'ヤ': 'Like や: the YAk again.',
  'ユ': 'A U-boat: YOU sail in it.',
  'ヨ': 'A backwards E: "YO, that\'s backwards!"',
  'ラ': 'A RAdio antenna.',
  'リ': 'Like り: two REEDs.',
  'ル': 'ROOts splitting in two.',
  'レ': 'A LEg kicking up: RE.',
  'ロ': 'A square ROom.',
  'ワ': 'A WAter tap.',
  'ヲ': 'Someone bending to kick: "WOah!"',
  'ン': 'Like ソ but the stroke sweeps UP: N.',
};

// [kana, romaji, base kana] for voiced (゛) and p-sound (゜) rows.
const VOICED_ROWS = [
  ['ga', [['が', 'ga', 'か'], ['ぎ', 'gi', 'き'], ['ぐ', 'gu', 'く'], ['げ', 'ge', 'け'], ['ご', 'go', 'こ']]],
  ['za', [['ざ', 'za', 'さ'], ['じ', 'ji', 'し'], ['ず', 'zu', 'す'], ['ぜ', 'ze', 'せ'], ['ぞ', 'zo', 'そ']]],
  ['da', [['だ', 'da', 'た'], ['ぢ', 'ji', 'ち'], ['づ', 'zu', 'つ'], ['で', 'de', 'て'], ['ど', 'do', 'と']]],
  ['ba', [['ば', 'ba', 'は'], ['び', 'bi', 'ひ'], ['ぶ', 'bu', 'ふ'], ['べ', 'be', 'へ'], ['ぼ', 'bo', 'ほ']]],
  ['pa', [['ぱ', 'pa', 'は'], ['ぴ', 'pi', 'ひ'], ['ぷ', 'pu', 'ふ'], ['ぺ', 'pe', 'へ'], ['ぽ', 'po', 'ほ']]],
];

// Combination sounds: base kana + small ゃゅょ.
const COMBO_ROWS = [
  ['kya', [['き', 'ky'], ['し', 'sh'], ['ち', 'ch']]],
  ['nya', [['に', 'ny'], ['ひ', 'hy'], ['み', 'my'], ['り', 'ry']]],
  ['gya', [['ぎ', 'gy'], ['じ', 'j'], ['び', 'by'], ['ぴ', 'py']]],
];
const SMALL_Y = [['ゃ', 'a'], ['ゅ', 'u'], ['ょ', 'o']];

// Other romaji people type for the same sound (Kunrei-shiki, IME habits).
const ALT_ROMAJI = {
  shi: ['si'], chi: ['ti'], tsu: ['tu'], fu: ['hu'], ji: ['zi'], n: ['nn', "n'"], wo: ['o'],
  sha: ['sya'], shu: ['syu'], sho: ['syo'],
  cha: ['tya', 'cya'], chu: ['tyu', 'cyu'], cho: ['tyo', 'cyo'],
  ja: ['jya', 'zya'], ju: ['jyu', 'zyu'], jo: ['jyo', 'zyo'],
};
const EXTRA_ALT = { 'ぢ': ['di'], 'づ': ['du'] };

// Pairs that learners mix up; used to pick tricky wrong answers.
const LOOKALIKES = [
  'ぬめ', 'ねれわ', 'るろ', 'さちら', 'きさ', 'はほ', 'いり', 'こに', 'あお', 'うつ', 'まも', 'くへ', 'けは',
  'シツ', 'ソンノ', 'クタケ', 'ウワフ', 'コユヨ', 'ヌスメ', 'チテ', 'アマ', 'ナメ', 'ラヲ', 'エユ', 'ルレ',
];

const toKata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

function answersFor(hira, romaji) {
  return [romaji, ...(ALT_ROMAJI[romaji] || []), ...(EXTRA_ALT[hira] || [])];
}

function buildScript(script) {
  const conv = script === 'kata' ? toKata : (s) => s;
  const prefix = script === 'kata' ? 'k' : 'h';
  const groups = [];
  const item = (hira, romaji, mnemonic, section) => {
    const kana = conv(hira);
    return { key: kana, type: 'kana', kana, romaji, answers: answersFor(hira, romaji), mnemonic, script, section };
  };

  for (const [id, rows] of HIRA_ROWS) {
    groups.push({
      id: `${prefix}-${id}`, script, section: 'basic', name: `${conv(rows[0][0])} row`,
      items: rows.map(([h, r, m]) => item(h, r, script === 'kata' ? KATA_MNEMONICS[toKata(h)] : m, 'basic')),
    });
  }
  for (const [id, rows] of VOICED_ROWS) {
    groups.push({
      id: `${prefix}-${id}`, script, section: 'voiced', name: `${conv(rows[0][0])} row`,
      items: rows.map(([h, r, base]) => {
        const b = conv(base);
        const mark = h.normalize('NFD').endsWith('゚') ? '゜ (a little circle) turns it into a P sound' : '゛ (two little dashes) makes it voiced';
        return item(h, r, `${b} + ${mark}: ${conv(h)} = "${r}".`, 'voiced');
      }),
    });
  }
  for (const [id, bases] of COMBO_ROWS) {
    const items = [];
    for (const [base, cons] of bases) {
      for (const [small, vowel] of SMALL_Y) {
        const r = cons + vowel;
        const b = conv(base);
        items.push(item(base + small, r, `${b} + a small ${conv(small)}: squeeze the two sounds into one beat, "${r}".`, 'combo'));
      }
    }
    groups.push({ id: `${prefix}-${id}`, script, section: 'combo', name: `${conv(bases[0][0])}${conv('ゃ')} combos`, items });
  }
  return groups;
}

export const GROUPS = [...buildScript('hira'), ...buildScript('kata')];
export const ITEMS = GROUPS.flatMap((g) => g.items.map((it) => ({ ...it, group: g.id })));
export const BY_KANA = Object.fromEntries(ITEMS.map((it) => [it.kana, it]));

const lookalikeMap = {};
for (const set of LOOKALIKES) {
  for (const c of set) lookalikeMap[c] = [...(lookalikeMap[c] || []), ...[...set].filter((x) => x !== c)];
}
export const lookalikes = (kana) => lookalikeMap[kana] || [];

export function scriptCount(script) {
  return ITEMS.filter((it) => it.script === script).length;
}
