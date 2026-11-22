import {validateVocabulary} from './content.mjs';

const prefix = '#lesson-words=';
export function lessonSetHash(input) {
  const set = validateVocabulary(input);
  const bytes = new TextEncoder().encode(JSON.stringify(set));
  if (bytes.length > 60000) throw Error('This vocabulary set is too large for a snapshot link.');
  return prefix + btoa(Array.from(bytes, n => String.fromCharCode(n)).join(''))
    .replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function readLessonSet(hash) {
  if (!hash.startsWith(prefix) || hash.length > 80013) throw Error('Invalid lesson vocabulary link.');
  const raw = hash.slice(prefix.length);
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) throw Error('Invalid lesson vocabulary link.');
  const bytes = Uint8Array.from(atob(raw.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0));
  return validateVocabulary(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
}
