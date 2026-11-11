
export function validateWarehouseSet(set){
 const issues=set.pairs.flatMap((pair,i)=>{
  const count=(pair[1].match(/[^\s]+/gu)||[]).map(w=>w.replace(/^[.,!?;:¡¿"“”()]+|[.,!?;:¡¿"“”()]+$/gu,'')).filter(Boolean).length;
  return count<1||count>20?['Line '+(i+1)+': '+count+' words (Warehouse supports 1–20).']:[];
 });
 if(issues.length)throw Error(issues.join(' '));
 return set;
}
const API = 'https://boringteacher-sentences-api-staging.mcproductionsdk.workers.dev';
const idPattern = /^S[A-HJ-NP-Z2-9]{8}$/;
const protocol = 'bt-sentence-cat/1';
const languages = {
  'es-ES': ['Spanish', 'Hola.'], 'de-DE': ['German', 'Guten Tag.'],
  'da-DK': ['Danish', 'Goddag.'], 'fr-FR': ['French', 'Bonjour.'],
  'it-IT': ['Italian', 'Buongiorno.'],
};
const words = text => text.match(/[\p{L}\p{N}]+(?:[’'\-][\p{L}\p{N}]+)*/gu) ?? [];

export function inspectSentences(text) {
  const pairs = [], errors = [], rows = [];
  text.split(/\r?\n/).forEach((row, index) => {
    if (!row.trim()) return;
    const pair = row.split(row.includes('\t') ? '\t' : '|').map(value => value.trim());
    const valid = pair.length === 2 && pair.every(value => value && value.length <= 1000) && words(pair[1]).length > 0;
    const number = index + 1;
    rows.push({ number, raw: row, pair: valid ? pair : null });
    if (valid) pairs.push(pair);
    else errors.push(number);
  });
  return { pairs, errors, rows };
}

export function validateSentenceSet(set) {
  if (!set || !Object.hasOwn(languages, set.language) || typeof set.title !== 'string' ||
      !set.title.trim() || set.title.length > 100 || !Array.isArray(set.pairs) ||
      set.pairs.length < 2 || set.pairs.length > 100 || set.pairs.some(pair => !Array.isArray(pair) ||
        pair.length !== 2 || pair.some(text => typeof text !== 'string' || !text.trim() || text.length > 1000) ||
        !words(pair[1]).length)) throw Error('Enter 2–100 valid English and target sentence pairs.');
  return { title: set.title, language: set.language, pairs: set.pairs.map(pair => [...pair]) };
}

export async function sentenceRequest(id, set) {
  if (!set && !idPattern.test(id)) throw Error('Invalid staging sentence link.');
  const base = API + '/sentence-sets';
  const response = await fetch(set ? base : base + '/' + id, {
    ...(set ? {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...set, pairs: set.pairs.map(([en, target]) => [target, en]) }),
    } : {}),
    credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw Error(response.status === 429 ? 'Too many requests. Try again shortly.' : 'The staging sentence set could not be ' + (set ? 'shared.' : 'loaded.'));
  const data = await response.json();
  if (set) {
    if (!idPattern.test(data.id)) throw Error('Sharing returned an invalid link.');
    return data.id;
  }
  if (data.set?.id !== id || !Array.isArray(data.set.pairs)) throw Error('Invalid staging sentence set.');
  return validateSentenceSet({ ...data.set, pairs: data.set.pairs.map(pair => Array.isArray(pair) ? [...pair].reverse() : pair) });
}

export function mountSentenceCat({ root, engine, set, soundOn, voice, onSound, onMenu, onError, gameId='cat' }) {
  if(!['cat','eater','warehouse','invaders'].includes(gameId))throw Error('Unsupported sentence game.');
  const protocol='bt-sentence-'+gameId+'/1';
  const gameName=gameId==='cat'?'Sentence Cat':gameId==='eater'?'Sentence Eater':gameId==='warehouse'?'Sentence Warehouse':'Sentence Invaders';
  if(gameId==='warehouse')validateWarehouseSet(set);
  const engineUrl = new URL(engine.url);
  if (engineUrl.protocol !== 'https:' ||
      !new RegExp('^[a-f0-9]+\\.bt-sentence-'+gameId+'-preview\\.pages\\.dev$').test(engineUrl.hostname) ||
      engineUrl.pathname !== '/' || engineUrl.search || engineUrl.hash ||
      !/^[a-f0-9]{64}$/.test(engine.buildId)) throw Error('Invalid staging sentence engine lock.');
  const frame = document.createElement('iframe');
  frame.className = 'sentence-frame';
  frame.style.visibility = 'hidden';
  frame.inert = true;
  const loading = document.createElement('p');
  loading.className = 'sentence-loading';
  loading.setAttribute('role', 'status');
  loading.textContent = 'Loading ' + gameName + '…';
  root.setAttribute('aria-busy', 'true');
  frame.title = gameName;
  frame.referrerPolicy = 'strict-origin';
  const sessionId = crypto.randomUUID();
  const allowedSpeech = new Set(set.pairs.flatMap(([, text]) => [text, ...words(text), ...(gameId==='invaders'?text.trim().replace(/[.!?。！？]+$/u,'').split(/\s+/).filter(Boolean).map(w=>w.replace(/[.!?。！？]+$/u,'')):[]), ...(gameId==='warehouse'?(text.match(/[^\s]+/gu)||[]).map(w=>w.replace(/^[.,!?;:¡¿"“”()]+|[.,!?;:¡¿"“”()]+$/gu,'')):[])]));
  let initialized = false, started = false, closed = false, speechId = 0;
  function send(type, data = {}) {
    frame.contentWindow.postMessage({ protocol, sessionId, type, ...data }, engineUrl.origin);
  }
  function destroy() {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    window.removeEventListener('message', receive);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('blur', onBlur);
    voice.cancel();
    frame.remove();
    loading.remove();
    root.removeAttribute('aria-busy');
  }
  function pauseBackground() {
    if (closed || !started) return;
    send('PAUSE');
    voice.cancel();
  }
  function onVisibility() { if (document.hidden) pauseBackground(); }
  function onBlur() { if (document.hidden || !document.hasFocus()) pauseBackground(); }
  const timer = setTimeout(() => { destroy(); onError(gameName+' could not start.'); }, 12000);
  function receive(event) {
    const data = event.data;
    if (closed || event.source !== frame.contentWindow || event.origin !== engineUrl.origin || data?.protocol !== protocol) return;
    if (data.type === 'READY' && !initialized && data.buildId === engine.buildId) {
      initialized = true;
      send('INIT', { set, soundOn });
      return;
    }
    if (!initialized || data.sessionId !== sessionId) return;
    if (data.type === 'STARTED' && !started) {
      started = true;
      clearTimeout(timer);
      loading.remove();
      root.removeAttribute('aria-busy');
      frame.inert = false;
      frame.style.visibility = 'visible';
      frame.focus();
      if (document.hidden) pauseBackground();
    } else if (started && data.type === 'MENU') {
      destroy();
      onMenu();
    } else if (started && data.type === 'SOUND' && typeof data.soundOn === 'boolean') {
      soundOn = data.soundOn;
      if (!soundOn) voice.cancel();
      onSound(soundOn);
    } else if (data.type === 'CANCEL') {
      voice.cancel();
    } else if (started && soundOn && data.type === 'SPEAK' && Number.isSafeInteger(data.id) &&
        data.id > speechId && allowedSpeech.has(data.text)) {
      const id = speechId = data.id;
      void voice.speak(data.text, set.language).finally(() => {
        if (!closed && speechId === id) send('SPOKEN', { id });
      });
    }
  }
  window.addEventListener('message', receive);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onBlur);
  frame.src = engineUrl.href;
  root.replaceChildren(loading, frame);
  return { destroy };
}

export function createSentenceWorkspace({ node, button, voice, notice, renderPairPreview, launch }) {
  let draft = { title: '', language: 'es-ES', text: '', topic: '' };
  let catalog;
  const textFor = pairs => pairs.map(pair => pair.join('\t')).join('\n');
  function field(parent, tag, id, title) {
    const label = node('label', title), control = node(tag);
    label.htmlFor = control.id = id;
    parent.append(label, control);
    return control;
  }
  function gameButton(set) {
    const grid = node('div');
    grid.className = 'gamegrid';
    for(const [id,label] of [['cat','🐈 SENTENCE CAT'],['eater','◉ SENTENCE EATER'],['warehouse','📦 SENTENCE WAREHOUSE'],['invaders','👾 SENTENCE INVADERS']]){
      const card=button(label,()=>{try{const selected=set();if(id==='warehouse')validateWarehouseSet(selected);launch(selected,id)}catch(error){notice.textContent=error.message}});
      card.className='game';card.dataset.game='sentence-'+id;grid.append(card);
    }
    return grid;
  }
  async function render(workspace, hash, current) {
    if (hash) {
      try {
        notice.textContent = 'Loading shared sentences…';
        const set = await sentenceRequest(hash.slice('#sentence-set='.length));
        if (!current()) return;
        notice.textContent = '';
        const box = node('section');
        box.className = 'student-panel';
        box.append(node('h2', set.title), node('p', 'English → ' + languages[set.language][0] + ' · ' + set.pairs.length + ' sentences'),
          node('h3', 'CHOOSE YOUR GAME'), gameButton(() => set));
        workspace.append(box);
      } catch (error) { if (current()) notice.textContent = error.message; }
      return;
    }

    workspace.append(node('h2', 'SENTENCE GAMES'));
    const grid = node('div'), settings = node('section'), editor = node('section');
    grid.className = 'columns';
    settings.className = editor.className = 'panel';
    settings.append(node('h3', 'GAME SETTINGS'));
    editor.append(node('h3', 'CUSTOMIZE / EDIT'));
    const language = field(settings, 'select', 'sentence-language', 'TARGET LANGUAGE');
    for (const [id, [name]] of Object.entries(languages)) language.add(new Option(name, id));
    language.value = draft.language;
    const topic = field(settings, 'select', 'sentence-topic', 'GRAMMAR FOCUS');
    const libraryStatus = node('p', 'Loading grammar topics…');
    libraryStatus.className = 'note';
    settings.append(libraryStatus);
    const title = field(editor, 'input', 'sentence-title', 'SET TITLE');
    title.maxLength = 100;
    title.value = draft.title;
    const text = field(editor, 'textarea', 'sentence-pairs', 'ENGLISH FIRST · TARGET SECOND');
    text.value = draft.text;
    text.spellcheck = false;
    const review = node('p'), preview = node('section'), summary = node('p'), previewRows = node('div');
    preview.className = 'preview';
    summary.className = 'small';
    preview.append(node('strong', 'SENTENCE PREVIEW'),
      node('p', 'Press ▶ beside a sentence to hear it in its selected language.'), summary, previewRows);
    editor.append(node('p', 'Use a tab or pipe between the English sentence and its translation.'), review);
    const shareArea = node('div');
    shareArea.id = 'shared-link';
    shareArea.setAttribute('role', 'status');
    function refresh() {
      const { pairs, errors, rows } = inspectSentences(text.value);
      review.textContent = pairs.length + ' valid pairs' + (errors.length ? ' · Review lines ' + errors.join(', ') : '');
      summary.textContent = 'en-US → ' + language.value + ' · ' + pairs.length + ' pairs · at least 2 required to play/share';
      renderPairPreview(previewRows, rows, ['en-US', language.value]);
      draft = { title: title.value, language: language.value, text: text.value, topic: topic.value };
      return { pairs, errors };
    }
    function selectedSet() {
      const { pairs, errors } = refresh();
      if (errors.length) throw Error('Review the highlighted line numbers before playing or sharing.');
      return validateSentenceSet({ title: title.value.trim() || topic.value || 'Custom sentences', language: language.value, pairs });
    }
    function fillTopics(selected = '') {
      topic.replaceChildren(new Option('Custom sentences', ''));
      for (const name of Object.keys(catalog?.languages?.[language.value] ?? {})) topic.add(new Option(name, name));
      topic.value = selected;
      if (topic.selectedIndex < 0) topic.value = '';
    }
    fillTopics(draft.topic);
    if (catalog) libraryStatus.textContent = '';
    else void fetch('./sentence-catalog.json', { redirect: 'error', signal: AbortSignal.timeout(12000) }).then(async response => {
      if (!response.ok) throw Error('Catalog unavailable.');
      const data = await response.json();
      if (data.schemaVersion !== 1 || !data.languages) throw Error('Invalid catalog.');
      catalog = data;
      if (current()) { fillTopics(draft.topic); libraryStatus.textContent = ''; }
    }).catch(() => { if (current()) libraryStatus.textContent = 'Grammar topics unavailable. You can still paste and share sentences.'; });
    topic.addEventListener('change', () => {
      if (topic.value) {
        if (text.value.trim() && !window.confirm('Replace the current sentences with this topic?')) { topic.value = draft.topic; return; }
        text.value = textFor(catalog.languages[language.value][topic.value]);
        title.value = topic.value;
      }
      refresh();
    });
    language.addEventListener('change', () => { fillTopics(); refresh(); });
    title.addEventListener('input', refresh);
    text.addEventListener('input', () => { topic.value = ''; refresh(); });
    settings.append(button('TEST VOICE', () => void voice.speak(inspectSentences(text.value).pairs[0]?.[1] ||
      languages[language.value][1], language.value)));
    editor.append(button('CHECK IMPORT', refresh), button('CLEAR', () => { text.value = ''; title.value = ''; topic.value = ''; refresh(); }));
    const share = button('STUDENT LINK', async () => {
      share.disabled = true;
      shareArea.replaceChildren();
      try {
        const id = await sentenceRequest(null, selectedSet());
        if (!current()) return;
        const url = new URL('/', location.origin);
        url.hash = 'sentence-set=' + id;
        const link = node('a', url.href);
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener';
        shareArea.append(link);
        notice.textContent = 'Staging student link created.';
        try { await navigator.clipboard.writeText(url.href); if (current()) notice.textContent += ' Copied to clipboard.'; }
        catch { /* The visible link remains usable. */ }
      } catch (error) { if (current()) notice.textContent = error.message; }
      finally { share.disabled = false; }
    });
    const actions = node('div'), sharing = node('div');
    actions.className = 'actions';
    sharing.className = 'actionbox';
    sharing.append(share, shareArea);
    actions.append(sharing);
    grid.append(settings, editor);
    workspace.append(grid, actions, node('h3', 'CHOOSE YOUR GAME'), gameButton(selectedSet), preview);
    refresh();
  }
  return { render };
}
