/** Boring Teacher Core — vocabulary primitives. No DOM, network or gameplay. */
export function parsePairs(text) {
  if (typeof text !== 'string') throw new TypeError('Vocabulary input must be text.');
  const pairs = [], rejectedLines = [];
  text.replace(/\r\n?/g, '\n').split('\n').forEach((line, index) => {
    if (!line.trim()) return;
    const fields = line.split('\t');
    const target = fields.slice(1).join('\t').trim();
    if (fields.length < 2 || !fields[0].trim() || !target) {
      rejectedLines.push(index + 1);
      return;
    }
    pairs.push([fields[0].trim(), target]);
  });
  return { pairs, rejectedLines };
}
export function validateSet(set, opts = {}) {
  const invalid = message => ({ ok: false, error: { code: 'VALIDATION', message } });
  const minPairs = opts.minPairs ?? 5;
  if (!Number.isSafeInteger(minPairs) || minPairs < 0) return invalid('Minimum pair count must be a nonnegative integer.');
  if (!set || typeof set !== 'object' || Array.isArray(set)) return invalid('Vocabulary set is invalid.');
  if (typeof set.title !== 'string' || !set.title.trim()) return invalid('Enter a vocabulary set title.');
  if (typeof set.language !== 'string' || !set.language.trim()) return invalid('Choose a language.');
  if (!Array.isArray(set.pairs)) return invalid('Vocabulary pairs must be a list.');
  const pairs = [];
  for (let i = 0; i < set.pairs.length; i++) {
    const pair = set.pairs[i];
    if (!Array.isArray(pair) || pair.length !== 2 || pair.some(s => typeof s !== 'string' || !s.trim())) {
      return invalid(`Vocabulary pair ${i + 1} must contain a prompt and a target.`);
    }
    pairs.push([pair[0].trim(), pair[1].trim()]);
  }
  if (pairs.length < minPairs) return invalid(`Enter at least ${minPairs} valid vocabulary pairs.`);
  return { ok: true, value: { title: set.title.trim(), language: set.language.trim(), pairs } };
}
export function swapPairs(pairs) {
  if (!Array.isArray(pairs)) throw new TypeError('Vocabulary pairs must be a list.');
  return pairs.map((pair, i) => {
    if (!Array.isArray(pair) || pair.length !== 2 || pair.some(s => typeof s !== 'string')) {
      throw new TypeError(`Invalid vocabulary pair at index ${i}.`);
    }
    return [pair[1], pair[0]];
  });
}
