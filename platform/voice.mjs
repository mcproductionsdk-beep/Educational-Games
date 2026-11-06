import { LOCALES } from './content.mjs';
const normalized = value => String(value ?? '').replace(/_/g, '-').toLowerCase();

// One pronunciation path for gameplay and TEST VOICE. No external speech service.
export function createPronunciationService({synth = globalThis.speechSynthesis,
  utteranceFactory = text => new globalThis.SpeechSynthesisUtterance(text), onStatus = () => {}} = {}) {
  let current = null;
  function cancel() {
    if (current) {current.resolve({status:'cancelled'});current = null;onStatus('cancelled');}
    synth?.cancel?.();
  }
  function speak(text, locale) {
    cancel();
    if (typeof text !== 'string' || !text.trim() || !LOCALES.includes(locale) || !synth?.speak) {
      onStatus('unavailable');return Promise.resolve({status:'unavailable'});
    }
    return new Promise(resolve => {
      const token = {resolve};current = token;
      const finish = (status, detail) => {
        if (current !== token) return;
        current = null;onStatus(status);resolve({status, ...(detail ? {detail} : {})});
      };
      try {
        const utterance = utteranceFactory(text), voices = synth.getVoices?.() ?? [];
        const target = normalized(locale), base = target.split('-')[0];
        utterance.lang = locale;
        const voice = voices.find(v=>normalized(v.lang) === target) ??
          voices.find(v=>normalized(v.lang).split('-')[0] === base);
        if (voice) utterance.voice = voice;
        utterance.onstart = () => {if(current === token) onStatus('started');};
        utterance.onend = () => finish('ended');
        utterance.onerror = event => finish('error', event?.error ?? 'Speech failed');
        onStatus('requested');synth.speak(utterance);
      } catch {finish('error', 'Speech unavailable');}
    });
  }
  return Object.freeze({speak, cancel});
}
