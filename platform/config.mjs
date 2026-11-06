const PRODUCTION_ORIGINS = [
  'https://boringteacher.com', 'https://www.boringteacher.com',
  'https://boringteacher-vocabulary-api.mcproductionsdk.workers.dev',
  'https://boringteacher-sentences-api.mcproductionsdk.workers.dev'
];
const fail = () => { throw new Error('INVALID_RUNTIME_CONFIGURATION'); };
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const revision = value => typeof value === 'string' && /^[a-zA-Z0-9._-]+$/.test(value);
function checkedUrl(value, policy) {
  if (typeof value !== 'string') fail();
  let url;
  try { url = new URL(value); } catch { fail(); }
  const loopback = policy.allowLoopback === true && url.protocol === 'http:' &&
    ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if ((!loopback && url.protocol !== 'https:') || url.username || url.password || url.hash || url.search) fail();
  if (url.href !== value && value !== url.origin) fail();
  const denied = [...PRODUCTION_ORIGINS, ...(policy.forbiddenOrigins || [])];
  if (policy.environment === 'staging' && denied.includes(url.origin)) fail();
  return url;
}
function approvedUrl(value, kind, policy) {
  checkedUrl(value, policy);
  if (!Array.isArray(policy.approved?.[kind]) || !policy.approved[kind].includes(value)) fail();
  return value;
}

// policy is supplied independently by the trusted deployment entry, never by URL/set data.
// No network, DOM mounts or service objects exist until the entire combination validates.
export function validateRuntimeConfiguration(config, registry, policy) {
  if (!record(policy) || !['staging', 'production'].includes(policy.environment) ||
      !record(config) || !record(registry) || config.schemaVersion !== 1 || registry.schemaVersion !== 1 ||
      config.environment !== policy.environment || !revision(config.configRevision) ||
      !revision(config.registryRevision) || registry.revision !== config.registryRevision ||
      config.shellOrigin !== policy.shellOrigin || !Array.isArray(registry.engines) || !registry.engines.length) fail();
  const shell = checkedUrl(config.shellOrigin + '/', policy);
  if (shell.origin !== config.shellOrigin) fail();
  const catalogUrl = approvedUrl(config.catalogUrl, 'catalogUrls', policy);
  const launcherUrl = approvedUrl(config.launcherUrl, 'launcherUrls', policy);
  if (new URL(launcherUrl).origin !== shell.origin || config.sharingTimeoutMs !== 12000) fail();
  let sharingBaseUrl = null;
  if (config.sharingBaseUrl !== null) {
    sharingBaseUrl = approvedUrl(config.sharingBaseUrl, 'sharingBaseUrls', policy);
    if (sharingBaseUrl.endsWith('/')) fail();
  }
  const ids = new Set();
  const engines = registry.engines.map(entry => {
    if (!record(entry) || !['vocabulary-snake', 'vocabulary-racer', 'vocabulary-jumper', 'vocabulary-invaders','vocabulary-frog','vocabulary-match','vocabulary-eater'].includes(entry.id) || ids.has(entry.id) ||
        entry.family !== 'vocabulary' || entry.protocol !== 'bt-vocabulary-engine/1' ||
        entry.minPairs !== 5 || !/^[a-f0-9]{40}$/.test(entry.buildId) ||
        policy.engineBuilds?.[entry.url] !== entry.buildId) fail();
    ids.add(entry.id);
    return Object.freeze({id: entry.id, family: entry.family, protocol: entry.protocol,
      minPairs: entry.minPairs, buildId: entry.buildId, url: approvedUrl(entry.url, 'engineUrls', policy)});
  });
  return Object.freeze({schemaVersion: 1, environment: config.environment,
    configRevision: config.configRevision, registryRevision: registry.revision,
    shellOrigin: shell.origin, catalogUrl, launcherUrl, sharingBaseUrl,
    sharingTimeoutMs: 12000, engines: Object.freeze(engines)});
}
