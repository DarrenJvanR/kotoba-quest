# Kotoba Quest

A daily Japanese trainer wrapped in a small pixel RPG. Kana, words and kanji are scheduled with FSRS spaced repetition. Each day's quest is a battle, and coins from battles build a town.

## What's in it

| Phase | Features |
|---|---|
| 1 | Hiragana and katakana (208 kana, with mnemonics), FSRS reviews graded by how correct and how fast you answer, the streak lantern with monthly freezes, a kana chart, backup |
| 2 | 299 starter words that unlock only once you can read every kana in them; the battle (kitsune hero vs. tengu, yamanba and axolotl, with a dragon-knight boss); chiptune sound effects; text-to-speech |
| 3 | The town: 9 buildings bought with coins. The arcade has three mini-games (Kana Rain, Memory Match, Word Builder), and 8 kana-only story scenes unlock with buildings |
| Phrases | 160 everyday phrases in 10 situations (greetings, meeting people, getting by, shopping, eating out, travel, plans, feelings, daily life, emergencies), with meaning, say-it, build-it, fill-the-gap and listening practice; they unlock once you can read their kana |
| Travel | The station sells train tickets (coins plus a learning goal). Kyoto has 6 places with stories, 56 souvenir words, 18 phrases, its own yokai (kappa, karakasa-obake, oni boss) and battle background. A stamp book collects a stamp per place, with a coin reward per full page |
| Shop | Streak freezes, heart charms (7-heart battles) and hint scrolls |
| 4 | 90 kanji taught through their building blocks (unlocked by the library); sentence mining (save your own lines, grade yourself); a stats page with charts |

**Battle rules:** each correct answer is one hit. Total monster HP equals the session's question count, so the last right answer always defeats the last monster. Misses cost hearts. At zero hearts the lantern revives you, but you lose the 3-star rating.

## Play it

Live at **https://darrenjvanr.github.io/kotoba-quest/**. On a phone, open it and choose "Add to Home Screen" (Safari) or "Install app" (Chrome). Progress is saved per device; move it with Settings → Export / Import backup.

## Run it locally

```bash
python -m http.server 8125 --directory D:/Claude/kotoba-quest
```

Then open http://localhost:8125. To use it on a phone, host the folder anywhere with HTTPS (GitHub Pages, Netlify) and "Add to Home Screen". It works offline after the first visit.

**Pronunciation** uses the browser's Japanese voice. Microsoft Edge has natural ones built in; on other Windows browsers, add a Japanese voice in Settings → Time & language → Speech.

## Files

| File | What it does |
|---|---|
| `js/kana.js`, `js/vocab.js`, `js/phrases.js`, `js/kanji.js`, `js/stories.js` | Content: kana, words (incl. souvenir words per town), phrases, kanji (with parts), story scenes |
| `js/regions.js` | Towns: buildings, monsters, battle backgrounds, ticket requirements |
| `js/fsrs.js` | Spaced repetition scheduler |
| `js/store.js` | Saved progress: cards, daily limits, streak, coins, town, arcade, sentences |
| `js/session.js` | Builds a session, picks question types and wrong options, grades answers |
| `js/battle.js` | Battle rules, sprite playback and the battle scene |
| `js/sfx.js`, `js/speech.js` | Sound effects (Web Audio) and text-to-speech |
| `js/ui.js` | Routing, HUD, modal, shared helpers |
| `js/screens/*.js` | One file per screen; each registers itself in `screens` |
| `art/` | Anime illustrations made locally with the Anima model; the generation and cut-out scripts are in `D:\Claude\kotoba-quest-art` (`generate-all.sh`, then `finalize.sh`) |
| `sw.js` | Offline cache (bump `CACHE` when files change) |
