/** Approved Master Menu V1.1 locale inventory; display order preserved. */
const LANGUAGES = Object.freeze([
  Object.freeze({ locale: 'de-DE', label: 'German' }),
  Object.freeze({ locale: 'es-ES', label: 'Spanish' }),
  Object.freeze({ locale: 'da-DK', label: 'Danish' }),
  Object.freeze({ locale: 'en-US', label: 'English' }),
]);
export function normalizeLocale(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const candidate = value.trim().replace(/_/g, '-');
  try { return Intl.getCanonicalLocales(candidate)[0] || ''; }
  catch (error) { if (error instanceof RangeError) return ''; throw error; }
}
export function getSupportedLanguages() {
  return LANGUAGES.map(({ locale, label }) => ({ locale, label }));
}
export function isSupportedLocale(value) {
  const normalized = normalizeLocale(value);
  return LANGUAGES.some(({ locale }) => locale === normalized);
}
