// SPDX-License-Identifier: Apache-2.0
const KEY = 'qsol.asterion.best.v1';
const valid = n => Number.isSafeInteger(n) && n >= 0;

export function loadBest(storage) {
  try {
    const text = (storage ?? window.localStorage).getItem(KEY);
    if (!text || text.length > 16 || !/^(0|[1-9]\d*)$/.test(text)) return 0;
    const value = Number(text);
    return valid(value) ? value : 0;
  } catch { return 0; }
}

export function recordBest(previous, score, storage) {
  const best = Math.max(valid(previous) ? previous : 0, valid(score) ? score : 0, loadBest(storage));
  try { (storage ?? window.localStorage).setItem(KEY, String(best)); } catch {}
  return best;
}
