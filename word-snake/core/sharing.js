import { validateSet } from './vocabulary.js';

const DEFAULT_TIMEOUT_MS = 12000;
function failure(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  if (cause !== undefined) error.cause = cause;
  return error;
}
function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function validId(value) { return typeof value === 'string' && value.trim() !== '' && !/[\s/#?]/u.test(value); }
function getSavedId(data) {
  if (!isRecord(data)) return null;
  for (const value of [data.id, data.setId, isRecord(data.set) ? data.set.id : undefined]) {
    if (validId(value)) return value;
  }
  return null;
}
function normalizeLoaded(data, requestedId) {
  if (!isRecord(data)) throw failure('MALFORMED_RESPONSE', 'The shared vocabulary response is invalid.');
  const body = isRecord(data.set) ? data.set : data;
  const pairs = body.pairs ?? body.vocabulary ?? data.pairs ?? data.vocabulary;
  const validated = validateSet({
    title: body.title ?? data.title,
    language: body.language ?? data.language,
    pairs,
  });
  if (!validated.ok) throw failure('MALFORMED_RESPONSE', 'The shared vocabulary is incomplete or invalid.');
  const returnedId = getSavedId(data);
  if (returnedId && returnedId !== requestedId) {
    throw failure('MALFORMED_RESPONSE', 'The shared vocabulary ID does not match the requested link.');
  }
  return { ...validated.value, id: requestedId };
}
export function createSharingClient({ apiBaseUrl, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = globalThis.fetch } = {}) {
  if (typeof apiBaseUrl !== 'string' || !apiBaseUrl.trim()) throw new TypeError('An API base URL is required.');
  const base = new URL(apiBaseUrl);
  if (base.protocol !== 'https:') throw new TypeError('The vocabulary API must use HTTPS.');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError('timeoutMs must be positive.');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function.');
  const endpoint = `${base.href.replace(/\/$/, '')}/sets`;
  async function request(url, options = {}) {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const response = await fetchImpl(url, { ...options, signal: controller.signal });
      if (!response || typeof response.ok !== 'boolean' || typeof response.json !== 'function') {
        throw failure('MALFORMED_RESPONSE', 'The vocabulary service returned an invalid response.');
      }
      if (!response.ok) throw failure('HTTP', `Vocabulary service returned HTTP ${response.status}.`);
      try { return await response.json(); }
      catch (cause) { throw failure('MALFORMED_RESPONSE', 'The vocabulary service returned invalid JSON.', cause); }
    } catch (cause) {
      if (timedOut) throw failure('TIMEOUT', 'The vocabulary service took too long to respond.', cause);
      if (cause?.code) throw cause;
      if (controller.signal.aborted || cause?.name === 'AbortError') throw failure('ABORTED', 'The vocabulary request was cancelled.', cause);
      throw failure('NETWORK', 'Could not reach the vocabulary service.', cause);
    } finally { clearTimeout(timer); }
  }
  return {
    async saveSet(set) {
      const checked = validateSet(set);
      if (!checked.ok) throw failure('VALIDATION', checked.error.message);
      const data = await request(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(checked.value),
      });
      const id = getSavedId(data);
      if (!id) throw failure('MALFORMED_RESPONSE', 'The vocabulary service did not return a valid set ID.');
      return { id };
    },
    async loadSet(id) {
      if (!validId(id)) throw failure('VALIDATION', 'The student link has an invalid vocabulary ID.');
      const data = await request(`${endpoint}/${encodeURIComponent(id)}`);
      return normalizeLoaded(data, id);
    },
  };
}
export function buildStudentUrl(canonicalGameUrl, id) {
  if (!validId(id)) throw failure('VALIDATION', 'A valid vocabulary ID is required.');
  const url = new URL(canonicalGameUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw failure('VALIDATION', 'The game URL must use HTTP or HTTPS.');
  url.search = '';
  url.hash = `set=${encodeURIComponent(id)}`;
  return url.href;
}
export function readStudentSetId(url) {
  const hash = new URL(url).hash;
  if (!hash.startsWith('#set=')) return null;
  try {
    const id = decodeURIComponent(hash.slice(5));
    return validId(id) ? id : null;
  } catch { return null; }
}
