import { mountTeacherMenu, mountStudentMenu } from '../core/menu.js';
import { createSharingClient, readStudentSetId } from '../core/sharing.js';
import { createVoiceService } from '../core/voice.js';
import { registerGame } from '../core/game-adapter.js';

const legacy = window.__snakeLegacy;
const root = document.getElementById('core-menu-root');
const game = document.getElementById('game');
if (!legacy || !root || !game) throw new Error('Word Snake legacy game is unavailable.');

const voice = createVoiceService();
const sharing = createSharingClient({
  apiBaseUrl: 'https://boringteacher-vocabulary-api.mcproductionsdk.workers.dev',
});
const canonicalGameUrl = 'https://boringteacher.com/word-snake/';
const categories = Object.fromEntries(Object.entries(legacy.LIB).map(([locale, lists]) => [
  locale,
  Object.fromEntries(Object.entries(lists).map(([name, pairs]) => [
    name, pairs.map(([target, prompt]) => [target, prompt]),
  ])),
]));
const initialText = document.getElementById('words').value;

// Snake's original game expects target-language word first, English prompt second.
// The existing Core menu intentionally retains the same Quizlet-style order.
let activeLocale = 'de-DE';
window.__snakePronounce = (text, locale, enabled) => {
  if (!enabled) return false;
  const normalized = value => String(value || '').toLowerCase().replace(/_/g, '-');
  const voices = voice.listVoices();
  const match = voices.some(v => normalized(v.lang) === normalized(locale)
    || normalized(v.lang).split('-')[0] === normalized(locale).split('-')[0]);
  if (!match) {
    const toast = document.getElementById('toast');
    toast.textContent = '⚠ ' + locale.toUpperCase() + ' VOICE NOT INSTALLED';
    toast.style.color = '#ff6b77';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 850);
    return false;
  }
  void voice.speak(text, locale);
  return true;
};
const adapter = registerGame({
  id: 'word-snake',
  capabilities: { vocabulary: true, pronunciation: true, sharing: true },
  start({ vocabulary, locale }) {
    if (!vocabulary || !Array.isArray(vocabulary.pairs) || vocabulary.pairs.length < 5)
      throw new Error('At least five pairs are required.');
    activeLocale = locale;
    document.getElementById('language').value = locale;
    document.getElementById('words').value = vocabulary.pairs.map(([target, prompt]) =>
      target + '\t' + prompt).join('\n');
    document.getElementById('category').value = 'custom';
    root.style.display = 'none';
    legacy.start();
  },
  reset() {
    document.getElementById('mainMenu').click();
  },
});
const services = { game: { start: async context => { adapter.reset(); return adapter.start(context); } }, voice, sharing };
const instructions = 'Use arrow keys or WASD to steer. Eat the correct translated word, avoid incorrect words, and wrap around the edges. P pauses. Wrong words cost lives.';
const setId = readStudentSetId(location.href);
const options = {
  gameTitle: 'WORD SNAKE',
  instructions,
  categories,
  initialText,
  language: 'de-DE',
  minPlayPairs: 5,
  canonicalGameUrl,
};
if (setId) mountStudentMenu(root, services, { ...options, setId });
else mountTeacherMenu(root, services, options);
for (const id of ['mainMenu', 'overMenu']) {
  document.getElementById(id).addEventListener('click', () => {
    root.style.display = '';
    adapter.reset();
  });
}
window.__wordSnakeCorePreview = { adapter, services, activeLocale: () => activeLocale };
