/** Device-based speech synthesis. Does not promise that queued speech is audible. */
export function createVoiceService({
  speechSynthesis = globalThis.speechSynthesis,
  utteranceFactory = text => new globalThis.SpeechSynthesisUtterance(text),
  maxDurationMs = 30000,
} = {}) {
  if (!Number.isFinite(maxDurationMs) || maxDurationMs <= 0) throw new TypeError('maxDurationMs must be positive.');
  const synth = speechSynthesis;
  let active = null;
  function listVoices() {
    try { return typeof synth?.getVoices === 'function' ? [...(synth.getVoices() || [])] : []; }
    catch { return []; }
  }
  function cancel() {
    if (active) active.finish('cancelled');
    try { synth?.cancel?.(); } catch { /* device API unavailable */ }
  }
  function speak(text, locale) {
    if (typeof text !== 'string' || !text.trim() || typeof locale !== 'string' || !locale.trim()) {
      return Promise.resolve({ status: 'error', detail: 'Text and target language are required.' });
    }
    if (!synth || typeof synth.speak !== 'function' || typeof utteranceFactory !== 'function') {
      return Promise.resolve({ status: 'unavailable', detail: 'Speech synthesis is not available.' });
    }
    cancel();
    let utterance;
    try { utterance = utteranceFactory(text); }
    catch { return Promise.resolve({ status: 'unavailable', detail: 'Speech synthesis is not available.' }); }
    if (!utterance) return Promise.resolve({ status: 'unavailable', detail: 'Speech synthesis is not available.' });
    const normalized = value => String(value || '').trim().replace(/_/g, '-').toLowerCase();
    const target = normalized(locale);
    const base = target.split('-')[0];
    const voices = listVoices();
    const match = voices.find(v => normalized(v.lang) === target)
      || voices.find(v => normalized(v.lang).split('-')[0] === base);
    utterance.lang = locale;
    utterance.rate = 0.9;
    if (match) utterance.voice = match;
    return new Promise(resolve => {
      let settled = false;
      let watchdog;
      const current = { finish(status, detail) {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        utterance.onend = null;
        utterance.onerror = null;
        if (active === current) active = null;
        resolve(detail ? { status, detail } : { status });
      } };
      active = current;
      utterance.onend = () => current.finish('ended');
      utterance.onerror = event => current.finish('error', String(event?.error || 'Device speech error'));
      watchdog = setTimeout(() => {
        current.finish('error', 'Speech did not complete on this device.');
        try { synth.cancel?.(); } catch { /* best effort */ }
      }, maxDurationMs);
      try { synth.speak(utterance); }
      catch { current.finish('error', 'The device could not start speech.'); }
    });
  }
  return { speak, cancel, listVoices };
}
