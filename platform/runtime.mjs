import { validateRuntimeConfiguration } from './config.mjs';
import { validateVocabulary } from './content.mjs';

export function createVocabularyRuntime({config, registry, policy, fetchImpl = globalThis.fetch} = {}) {
  const settings = validateRuntimeConfiguration(config, registry, policy);
  if (typeof fetchImpl !== 'function') throw new Error('INVALID_FETCH_IMPLEMENTATION');
  function shareId(value) {
    if (typeof value !== 'string' || !value.trim() || value.length > 512) throw new Error('INVALID_SET_ID');
    return encodeURIComponent(value);
  }
  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), settings.sharingTimeoutMs);
    try {
      const response = await fetchImpl(url, {...options, redirect: 'error', credentials: 'omit',
        referrerPolicy: 'no-referrer', signal: controller.signal});
      if (response.redirected || (response.url && response.url !== url) || response.type === 'opaqueredirect') {
        throw new Error('UNEXPECTED_SERVICE_REDIRECT');
      }
      if (!response.ok) throw new Error('SERVICE_HTTP_ERROR');
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  function sharingBase() {
    if (!settings.sharingBaseUrl) throw new Error('SHARING_UNAVAILABLE');
    return settings.sharingBaseUrl;
  }
  return Object.freeze({
    settings,
    async loadSet(id) {
      const url = sharingBase() + '/sets/' + shareId(id);
      const result = await request(url);
      return validateVocabulary(result?.set ?? result, {legacy: true});
    },
    async publishSet(set) {
      const payload = validateVocabulary(set);
      const base = sharingBase();
      // Existing API shape is preserved; the internal family/schema envelope stays local.
      const {title, promptLanguage, language, pairs} = payload;
      const result = await request(base + '/sets', {method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title, promptLanguage, language, pairs})});
      const id = result?.id ?? result?.setId ?? result?.set?.id;
      shareId(id);
      return Object.freeze({id, url: settings.launcherUrl + '#set=' + encodeURIComponent(id)});
    }
  });
}
