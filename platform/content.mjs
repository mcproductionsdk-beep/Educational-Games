export const LOCALES = Object.freeze(['en-US', 'es-ES', 'de-DE', 'da-DK', 'fr-FR', 'it-IT']);

export function validateVocabulary(input, { legacy = false } = {}) {
  const fail = () => { throw new Error('INVALID_VOCABULARY'); };
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail();
  if (input.family !== undefined && input.family !== 'vocabulary') fail();
  if (input.schemaVersion !== undefined && input.schemaVersion !== 1) fail();
  const promptLanguage = input.promptLanguage === undefined && legacy ? 'en-US' : input.promptLanguage;
  if (typeof input.title !== 'string' || !input.title.trim() ||
      !LOCALES.includes(promptLanguage) || !LOCALES.includes(input.language) ||
      promptLanguage === input.language || !Array.isArray(input.pairs) || input.pairs.length < 5 ||
      !input.pairs.every(pair => Array.isArray(pair) && pair.length === 2 &&
        pair.every(value => typeof value === 'string' && value.trim()))) fail();
  return Object.freeze({
    family: 'vocabulary', schemaVersion: 1, title: input.title,
    promptLanguage, language: input.language,
    pairs: Object.freeze(input.pairs.map(pair => Object.freeze([...pair])))
  });
}
