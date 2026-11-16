// SPDX-License-Identifier: Apache-2.0
import { parseRegistry, launchPath } from './registry.js';

const byId = (id) => document.getElementById(id);
const cabinet = byId('cabinet');
const rack = byId('cartridge-rack');
const play = byId('play-link');
const art = byId('preview-art');
const fallback = byId('art-fallback');
const live = byId('cabinet-status');
const error = byId('registry-error');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let cartridges = [];
let selection = null;
let selectionToken = 0;
let loadToken = 0;
let insertionTimer = null;

const statusNames = {
  concept: 'COMING SOON · CONCEPT',
  development: 'COMING SOON · IN DEVELOPMENT',
  playable: 'PLAYABLE PREVIEW',
  released: 'RELEASED',
};

function lockLaunch(label) {
  play.removeAttribute('href');
  play.setAttribute('aria-disabled', 'true');
  play.setAttribute('tabindex', '-1');
  byId('play-label').textContent = label;
}

function showFallback(cartridge, note) {
  art.hidden = true;
  art.removeAttribute('src');
  fallback.hidden = false;
  byId('fallback-title').textContent = cartridge?.title ?? 'Games2 Arcade';
  byId('fallback-note').textContent = note;
}

function showArtwork(cartridge, token) {
  showFallback(cartridge, 'Original cabinet art unavailable. Cartridge details remain available.');
  byId('art-caption').textContent = launchPath(cartridge) ? 'ORIGINAL CABINET ART · NOT A GAMEPLAY CAPTURE' : 'CONCEPT ART · NOT A PLAYABLE GAME';
  if (!cartridge.artwork) return;
  // Load a detached image so a slow response for an earlier selection cannot
  // replace the current cartridge's art or its error state.
  const candidate = new Image();
  candidate.onload = () => {
    if (token !== selectionToken) return;
    art.src = candidate.src;
    art.alt = `Original cabinet illustration for ${cartridge.title}${cartridge.subtitle ? `: ${cartridge.subtitle}` : ''}.`;
    art.hidden = false;
    fallback.hidden = true;
  };
  candidate.onerror = () => {
    if (token === selectionToken) showFallback(cartridge, 'Artwork unavailable. Cartridge information and controls remain available.');
  };
  candidate.src = new URL(cartridge.artwork, document.baseURI).href;
}

function renderFeatures(cartridge) {
  const features = byId('game-features');
  features.replaceChildren();
  const labels = cartridge.slug === 'strikepixel' && launchPath(cartridge)
    ? ['3 weapons / 3 offline bots', 'Short arcade matches', 'Original procedural audio']
    : launchPath(cartridge)
      ? ['Independent browser game', 'Open a separate game page']
      : ['An idea for a future game', 'No game build available yet'];
  for (const label of labels) {
    const item = document.createElement('li');
    const mark = document.createElement('span');
    mark.textContent = '+';
    mark.setAttribute('aria-hidden', 'true');
    item.append(mark, document.createTextNode(label));
    features.append(item);
  }
}

function settleSelection(cartridge, token) {
  if (token !== selectionToken) return;
  insertionTimer = null;
  const destination = launchPath(cartridge);
  cabinet.dataset.state = destination ? 'ready' : 'concept';
  if (destination) {
    play.href = destination;
    play.removeAttribute('aria-disabled');
    play.removeAttribute('tabindex');
    byId('play-label').textContent = 'PLAY CARTRIDGE';
    byId('slot-caption').textContent = 'CARTRIDGE SEATED / READY';
    live.textContent = `${cartridge.title} is ready. Press Play cartridge to open it.`;
  } else {
    lockLaunch('NOT PLAYABLE YET');
    byId('slot-caption').textContent = 'CONCEPT LOADED / NO GAME BUILD';
    live.textContent = `${cartridge.title}: ${statusNames[cartridge.status].toLowerCase()}. This cartridge has no playable game yet.`;
  }
}

function choose(cartridge, index, { animate = true } = {}) {
  window.clearTimeout(insertionTimer);
  const token = ++selectionToken;
  selection = cartridge;
  lockLaunch('INSERTING…');
  cabinet.dataset.state = 'inserting';
  cabinet.dataset.cartridge = cartridge.slug;
  for (const button of rack.querySelectorAll('button[data-slug]')) button.setAttribute('aria-pressed', String(button.dataset.slug === cartridge.slug));
  byId('selected-title').textContent = cartridge.title;
  byId('selected-subtitle').textContent = cartridge.subtitle || 'AN ORIGINAL GAMES2 CARTRIDGE';
  byId('selected-genre').textContent = cartridge.genre;
  byId('selected-status').textContent = `${statusNames[cartridge.status]}${cartridge.releaseLabel ? ` — ${cartridge.releaseLabel}` : ''}`;
  byId('selected-description').textContent = cartridge.description;
  byId('selected-index').textContent = String(index + 1).padStart(2, '0');
  byId('preview-number').textContent = `${String(index + 1).padStart(2, '0')} / ${String(cartridges.length).padStart(2, '0')}`;
  byId('inserted-title').textContent = cartridge.title;
  byId('slot-caption').textContent = 'INSERTING CARTRIDGE…';
  live.textContent = `Inserting ${cartridge.title}…`;
  renderFeatures(cartridge);
  showArtwork(cartridge, token);
  if (animate && !reducedMotion.matches) insertionTimer = window.setTimeout(() => settleSelection(cartridge, token), 360);
  else settleSelection(cartridge, token);
}

function makeCartridge(cartridge, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cartridge';
  button.dataset.slug = cartridge.slug;
  button.dataset.status = cartridge.status;
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', `${cartridge.title}${cartridge.subtitle ? `, ${cartridge.subtitle}` : ''}. ${statusNames[cartridge.status].toLowerCase()}. Select cartridge.`);
  const top = document.createElement('span');
  top.className = 'cartridge-top';
  top.setAttribute('aria-hidden', 'true');
  top.textContent = `GAMES2 / ${String(index + 1).padStart(2, '0')}`;
  const label = document.createElement('span');
  label.className = 'cartridge-label';
  const labelArt = document.createElement('span');
  labelArt.className = 'cartridge-art';
  labelArt.textContent = 'G2';
  labelArt.setAttribute('aria-hidden', 'true');
  if (cartridge.artwork) {
    const image = document.createElement('img');
    image.alt = '';
    image.loading = 'eager';
    image.src = new URL(cartridge.slug === 'strikepixel' ? './cabinet/assets/strikepixel-label.svg' : cartridge.artwork, document.baseURI).href;
    image.addEventListener('error', () => image.remove(), { once: true });
    labelArt.append(image);
  }
  const labelCopy = document.createElement('span');
  labelCopy.className = 'cartridge-copy';
  const genre = document.createElement('span');
  genre.className = 'cartridge-genre';
  genre.textContent = cartridge.genre;
  const title = document.createElement('strong');
  title.textContent = cartridge.title;
  const subtitle = document.createElement('span');
  subtitle.className = 'cartridge-subtitle';
  subtitle.textContent = cartridge.subtitle || 'GAMES2 ORIGINAL';
  labelCopy.append(genre, title, subtitle);
  label.append(labelArt, labelCopy);
  const bottom = document.createElement('span');
  bottom.className = 'cartridge-bottom';
  const status = document.createElement('span');
  status.className = 'cartridge-availability';
  status.textContent = statusNames[cartridge.status];
  const selected = document.createElement('span');
  selected.className = 'cartridge-indicator';
  selected.setAttribute('aria-hidden', 'true');
  selected.textContent = '↗';
  bottom.append(status, selected);
  button.append(top, label, bottom);
  button.addEventListener('click', () => choose(cartridge, index));
  return button;
}

async function loadCatalogue(recoverFocus = false) {
  const request = ++loadToken;
  ++selectionToken;
  window.clearTimeout(insertionTimer);
  selection = null;
  cabinet.dataset.state = 'loading';
  error.hidden = true;
  rack.replaceChildren();
  lockLaunch('PLEASE WAIT');
  live.textContent = 'Reading the cartridge catalogue…';
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(new URL('./cartridges.json', document.baseURI), { cache: 'no-cache', signal: controller.signal });
    if (!response.ok) throw new Error(`Catalogue request returned HTTP ${response.status}.`);
    const registry = parseRegistry(await response.text());
    if (request !== loadToken) return;
    cartridges = [...registry.cartridges].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    if (cartridges.length === 0) throw new Error('The catalogue contains no cartridges.');
    cartridges.forEach((cartridge, index) => rack.append(makeCartridge(cartridge, index)));
    const playable = cartridges.filter((cartridge) => launchPath(cartridge)).length;
    const concepts = cartridges.filter((cartridge) => cartridge.status === 'concept').length;
    const developing = cartridges.length - playable - concepts;
    byId('rack-summary').textContent = [`${String(playable).padStart(2, '0')} PLAYABLE`, `${String(concepts).padStart(2, '0')} CONCEPT${concepts === 1 ? '' : 'S'}`, ...(developing ? [`${String(developing).padStart(2, '0')} IN DEVELOPMENT`] : [])].join(' / ');
    const first = Math.max(0, cartridges.findIndex((cartridge) => launchPath(cartridge)));
    choose(cartridges[first], first, { animate: false });
    if (recoverFocus) rack.querySelector(`[data-slug="${cartridges[first].slug}"]`)?.focus();
  } catch (cause) {
    if (request !== loadToken) return;
    ++selectionToken;
    cartridges = [];
    selection = null;
    cabinet.dataset.state = 'error';
    lockLaunch('CATALOGUE UNAVAILABLE');
    showFallback(null, 'Reload the catalogue to try again.');
    byId('selected-status').textContent = 'CATALOGUE UNAVAILABLE';
    byId('selected-title').textContent = 'Please try again.';
    byId('selected-subtitle').textContent = 'THE ARCADE WILL BE RIGHT HERE.';
    byId('selected-description').textContent = 'No cartridge has been loaded. Reload the catalogue to recover.';
    byId('selected-genre').textContent = 'CONNECTION / CATALOGUE CHECK';
    byId('game-features').replaceChildren();
    byId('inserted-title').textContent = 'NO CARTRIDGE';
    byId('slot-caption').textContent = 'RELOAD CATALOGUE TO CONTINUE';
    byId('registry-error-detail').textContent = cause?.name === 'AbortError' ? 'The catalogue took too long to respond. Check the connection, then reload it.' : 'The catalogue is missing, could not be read, or did not pass validation. Reload it to try again.';
    byId('rack-summary').textContent = 'CATALOGUE UNAVAILABLE';
    error.hidden = false;
    live.textContent = 'No cartridge loaded. Play is unavailable. Use Reload catalogue to try again.';
    if (recoverFocus) byId('retry-registry').focus();
  } finally {
    window.clearTimeout(timeout);
  }
}

play.addEventListener('click', (event) => {
  if (cabinet.dataset.state !== 'ready' || !selection || !launchPath(selection)) event.preventDefault();
});
byId('retry-registry').addEventListener('click', () => loadCatalogue(true));
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches && selection && insertionTimer !== null) {
    window.clearTimeout(insertionTimer);
    settleSelection(selection, selectionToken);
  }
});
loadCatalogue();
