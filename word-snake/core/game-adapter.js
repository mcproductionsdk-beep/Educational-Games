/** Explicit game lifecycle; game mechanics remain inside the individual game. */
export function registerGame(adapter) {
  if (!adapter || typeof adapter !== 'object' || !adapter.id || typeof adapter.start !== 'function')
    throw new TypeError('A game requires an id and start(context) function.');
  const capabilities = { vocabulary: false, pronunciation: false, sharing: false, ...(adapter.capabilities || {}) };
  for (const value of Object.values(capabilities)) if (typeof value !== 'boolean') throw new TypeError('Capabilities must be booleans.');
  let state = 'idle';
  let generation = 0;
  return {
    id: adapter.id,
    capabilities: Object.freeze({ ...capabilities }),
    get state() { return state; },
    async start(context = {}) {
      if (state === 'destroyed' || state === 'starting' || state === 'running' || state === 'paused') return false;
      const token = ++generation;
      state = 'starting';
      try {
        await adapter.start(context);
        if (generation !== token) return false;
        state = 'running';
        return true;
      } catch (error) {
        if (generation === token) state = 'idle';
        throw error;
      }
    },
    pause() {
      if (state !== 'running' || typeof adapter.pause !== 'function') return false;
      adapter.pause(); state = 'paused'; return true;
    },
    resume() {
      if (state !== 'paused' || typeof adapter.resume !== 'function') return false;
      adapter.resume(); state = 'running'; return true;
    },
    reset() {
      if (state === 'destroyed') return;
      generation++;
      if (typeof adapter.reset === 'function') adapter.reset();
      state = 'idle';
    },
    destroy() {
      generation++;
      if (state !== 'destroyed') adapter.destroy?.();
      state = 'destroyed';
    },
  };
}
