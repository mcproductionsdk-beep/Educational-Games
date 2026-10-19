import { parsePairs, validateSet, swapPairs } from './vocabulary.js';
import { getSupportedLanguages } from './languages.js';
import { buildStudentUrl, readStudentSetId } from './sharing.js';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (text, className, id) => {
  const node = el('button', className, text);
  node.type = 'button';
  if (id) node.id = id;
  return node;
};
const paragraph = (text, className) => el('p', className, text);
function assertRoot(root) {
  if (!root || typeof root.replaceChildren !== 'function') throw new TypeError('A DOM root is required.');
}
function howTo(text) {
  const details = el('details', 'bt-howto');
  details.append(el('summary', '', '▶ HOW TO PLAY'), paragraph(text || 'Follow the game instructions.', 'bt-howto-text'));
  return details;
}
function startGame(adapter, context, status) {
  return Promise.resolve().then(() => adapter.start(context)).catch(error => {
    status.textContent = 'Could not start the game. Please try again.';
    status.dataset.state = 'error';
    return false;
  });
}
function gameContext(set, services) {
  return {
    vocabulary: set,
    locale: set.language,
    pronounce: text => services.voice?.speak(text, set.language),
  };
}
function resolveServices(services) {
  if (!services?.sharing?.saveSet || !services?.sharing?.loadSet || !services?.game?.start)
    throw new TypeError('Menu requires sharing save/load and a game adapter.');
}
function install(root, view, cleanup) {
  root.replaceChildren(view);
  return () => { cleanup(); if (root.contains(view)) root.replaceChildren(); };
}
export function mountTeacherMenu(root, services, options = {}) {
  assertRoot(root); resolveServices(services);
  const view = el('section', 'bt-menu bt-teacher');
  const logo = el('h1', 'bt-logo', options.gameTitle || 'BORING TEACHER');
  const columns = el('div', 'bt-teacher-columns');
  const settings = el('section', 'bt-card bt-settings');
  settings.append(el('h2', '', 'GAME SETTINGS'), paragraph('Choose the language and vocabulary you want to practise.', 'bt-help'));
  const fields = el('div', 'bt-settings-fields');
  const languageField = el('label', 'bt-field-label', 'Language');
  const language = el('select'); language.id = 'language';
  for (const item of getSupportedLanguages()) {
    const option = el('option', '', item.label); option.value = item.locale; language.append(option);
  }
  language.value = options.language || 'de-DE';
  languageField.append(language);
  const categoryField = el('label', 'bt-field-label', 'Vocabulary');
  const category = el('select'); category.id = 'category';
  const custom = el('option', '', 'Custom / Paste your own'); custom.value = 'custom'; category.append(custom);
  const categories = options.categories || {};
  const populate = () => {
    category.replaceChildren(custom);
    const choices = categories[language.value] || {};
    for (const name of Object.keys(choices)) {
      const opt = el('option', '', name); opt.value = name; category.append(opt);
    }
    category.value = 'custom';
  };
  populate(); categoryField.append(category); fields.append(languageField, categoryField); settings.append(fields);
  const voiceCheck = paragraph('', 'bt-preview'); voiceCheck.id = 'voiceCheck';
  const updateVoice = () => {
    const item = getSupportedLanguages().find(item => item.locale === language.value);
    const voices = services.voice?.listVoices?.() || [];
    const exact = voices.find(v => v.lang?.toLowerCase().replace('_','-') === language.value.toLowerCase());
    const fallback = exact || voices.find(v => v.lang?.split('-')[0].toLowerCase() === language.value.split('-')[0]);
    voiceCheck.textContent = 'VOICE: Device speech · ' + (item?.label || language.value) + ' · ' + (fallback?.name || 'Browser default (voice availability varies)');
  };
  updateVoice();
  const testVoice = button('🔊 TEST VOICE', 'bt-button bt-yellow', 'testVoice');
  settings.append(voiceCheck, testVoice, howTo(options.instructions));
  const vocab = el('section', 'bt-card bt-vocabulary');
  vocab.append(el('h2', '', 'YOUR VOCABULARY'), paragraph('Use a ready-made list above, or paste/edit your own Quizlet-style term and definition pairs.', 'bt-help'));
  const textarea = el('textarea'); textarea.id = 'vocabularyInput'; textarea.setAttribute('aria-label', 'Vocabulary pairs'); textarea.placeholder = 'cat\tgato\ndog\tperro'; textarea.value = options.initialText || '';
  const swap = button('⇄ SWAP SIDES', 'bt-button', 'swap');
  const preview = paragraph('', 'bt-preview'); preview.id = 'preview';
  const error = paragraph('', 'bt-error'); error.id = 'error'; error.setAttribute('role', 'alert');
  const shareBlock = el('div', 'bt-share-block');
  const share = button('🔗 SHARE WITH STUDENTS', 'bt-button bt-pink', 'shareStudentLink');
  const shareStatus = el('div', 'bt-share-status'); shareStatus.id = 'shareStatus'; shareStatus.setAttribute('aria-live','polite');
  shareStatus.textContent = 'Creates a permanent student link for exactly the vocabulary shown above.';
  shareBlock.append(share, shareStatus);
  const play = button('PLAY', 'bt-button bt-primary bt-final-play', 'play');
  vocab.append(textarea, swap, preview, error, shareBlock, play);
  columns.append(settings, vocab); view.append(logo, columns);
  let destroyed = false, revision = 0;
  const current = () => ({ title: (options.setTitle || options.gameTitle || 'Vocabulary').trim(), language: language.value, pairs: parsePairs(textarea.value).pairs });
  const refresh = () => {
    const parsed = parsePairs(textarea.value);
    preview.textContent = parsed.pairs.length ? `Detected ${parsed.pairs.length} pairs. ${parsed.pairs[0][1]} → ${parsed.pairs[0][0]}` : 'No valid pairs detected.';
    error.textContent = parsed.rejectedLines.length ? `Ignored invalid lines: ${parsed.rejectedLines.join(', ')}.` : '';
  };
  const onInput = () => { revision++; refresh(); };
  const onLanguage = () => { revision++; populate(); updateVoice(); };
  const onCategory = () => {
    if (category.value !== 'custom') {
      const selected = categories[language.value]?.[category.value] || [];
      textarea.value = selected.map(pair => pair.join('\t')).join('\n');
      onInput();
    }
  };
  const onSwap = () => {
    const parsed = parsePairs(textarea.value);
    textarea.value = swapPairs(parsed.pairs).map(pair => pair.join('\t')).join('\n');
    onInput();
  };
  const onTestVoice = () => {
    const defaults = { 'de-DE': 'Guten Tag', 'es-ES': 'Hola', 'da-DK': 'Goddag', 'en-US': 'Hello' };
    void services.voice?.speak(options.testPhrases?.[language.value] || defaults[language.value] || 'Hello', language.value);
  };
  const onPlay = () => {
    const checked = validateSet(current(), { minPairs: options.minPlayPairs ?? 1 });
    if (!checked.ok) { error.textContent = checked.error.message; return; }
    error.textContent = '';
    void startGame(services.game, gameContext(checked.value, services), error);
  };
  const onShare = async () => {
    if (share.disabled) return;
    const checked = validateSet(current());
    if (!checked.ok) { shareStatus.textContent = checked.error.message; return; }
    const snapshot = ++revision;
    share.disabled = true; share.textContent = 'Saving this vocabulary set…';
    shareStatus.replaceChildren(document.createTextNode('Saving this vocabulary set…'));
    try {
      const saved = await services.sharing.saveSet(checked.value);
      if (destroyed || revision !== snapshot) {
        if (!destroyed) shareStatus.textContent = 'Vocabulary changed while saving. Share again to create a link for the latest words.';
        return;
      }
      const url = buildStudentUrl(options.canonicalGameUrl, saved.id);
      const anchor = el('a', 'bt-student-link', url); anchor.href = url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      shareStatus.replaceChildren(paragraph('Student link (select or copy):'), anchor);
      try { await globalThis.navigator?.clipboard?.writeText(url); } catch { /* link remains visible */ }
    } catch (cause) {
      if (!destroyed && revision === snapshot) shareStatus.textContent = cause?.message || 'Could not share vocabulary. Please retry.';
    } finally {
      if (!destroyed) { share.disabled = false; share.textContent = '🔗 SHARE WITH STUDENTS'; }
    }
  };
  textarea.addEventListener('input', onInput); language.addEventListener('change', onLanguage);
  category.addEventListener('change', onCategory); swap.addEventListener('click', onSwap);
  testVoice.addEventListener('click', onTestVoice); play.addEventListener('click', onPlay);
  share.addEventListener('click', onShare); refresh();
  const detach = install(root, view, () => {
    destroyed = true; revision++;
    textarea.removeEventListener('input', onInput); language.removeEventListener('change', onLanguage);
    category.removeEventListener('change', onCategory); swap.removeEventListener('click', onSwap);
    testVoice.removeEventListener('click', onTestVoice); play.removeEventListener('click', onPlay);
    share.removeEventListener('click', onShare);
  });
  return { destroy: detach, getCurrentSet: () => destroyed ? null : current() };
}
export function mountStudentMenu(root, services, options = {}) {
  assertRoot(root); resolveServices(services);
  const view = el('section', 'bt-menu bt-student');
  const logo = el('h1', 'bt-logo', options.gameTitle || 'BORING TEACHER');
  const card = el('section', 'bt-card bt-student-card');
  const title = el('h2', 'bt-student-title', 'Loading vocabulary…');
  const meta = paragraph('', 'bt-student-meta');
  const status = paragraph('Loading shared vocabulary…', 'bt-preview'); status.setAttribute('role', 'status');
  const play = button('PLAY', 'bt-button bt-primary bt-final-play', 'play'); play.disabled = true;
  card.append(title, meta, play, howTo(options.instructions), status); view.append(logo, card);
  let destroyed = false, generation = 0, loaded = null;
  const onPlay = () => { if (loaded && !destroyed) void startGame(services.game, gameContext(loaded, services), status); };
  play.addEventListener('click', onPlay);
  const detach = install(root, view, () => { destroyed = true; generation++; play.removeEventListener('click', onPlay); });
  const load = async (id) => {
    const token = ++generation;
    loaded = null; play.disabled = true; title.textContent = 'Loading vocabulary…'; meta.textContent = ''; status.textContent = 'Loading shared vocabulary…';
    try {
      if (!id) throw new Error('The student link is missing a valid vocabulary ID.');
      const result = await services.sharing.loadSet(id);
      if (destroyed || token !== generation) return;
      const checked = validateSet(result);
      if (!checked.ok) throw new Error(checked.error.message);
      loaded = checked.value;
      title.textContent = loaded.title;
      const label = getSupportedLanguages().find(l => l.locale === loaded.language)?.label || loaded.language;
      meta.textContent = `${label} · ${loaded.pairs.length} words`;
      status.textContent = 'Ready to play.';
      play.disabled = false;
    } catch (cause) {
      if (!destroyed && token === generation) {
        title.textContent = 'Vocabulary unavailable';
        status.textContent = cause?.message || 'Could not load shared vocabulary.';
      }
    }
  };
  void load(options.setId ?? readStudentSetId(options.url || globalThis.location?.href || 'https://example.invalid/'));
  return { destroy: detach, reload: load };
}
