// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {assertPath, exactInventory, fileRows, sha256, verifyRuntimeReferences} from './site-lib.mjs';

const templateURL = new URL('./cartridge-worker.template.js', import.meta.url);
const vendor = 'vendor/vanillajs/';

export async function verifySources(game) {
  const {root, files, modules} = game;
  await exactInventory(join(root, 'src'), files.filter(path => path.startsWith('src/')).map(path => path.slice(4)));
  const vendorPaths = ['ENGINE_PIN.json', 'LICENSE', 'NOTICE', ...Object.keys(modules)];
  await exactInventory(join(root, vendor), vendorPaths);
  const paths = [...files, ...vendorPaths.map(path => vendor + path)];
  for (const path of paths) await assertPath(root, path);
  const receipt = JSON.parse(await readFile(join(root, vendor, 'ENGINE_PIN.json'), 'utf8'));
  assert.deepEqual(receipt, {
    repository: 'QSOLKCB/VANILLAJS', release: 'v3.1.0', commit: game.engineCommit,
    license: 'Apache-2.0', modules: Object.entries(modules).map(([path, blob]) => ({path, depends: [], blob})),
    localChanges: [],
  });
  for (const [path, blob] of Object.entries(modules)) {
    const bytes = await readFile(join(root, vendor, path));
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), blob, path);
  }
  await verifyRuntimeReferences(root, paths);
  return paths;
}

async function packagePlan(game) {
  const paths = await verifySources(game);
  const assets = await fileRows(game.root, paths);
  const template = await readFile(templateURL, 'utf8');
  const version = sha256(JSON.stringify([game.slug, sha256(template), assets]));
  const worker = template.replace('__SLUG__', JSON.stringify(game.slug))
    .replace('__PACKAGE_VERSION__', JSON.stringify(version)).replace('__PACKAGE_FILES__', JSON.stringify(assets));
  const files = [...assets, {path: 'service-worker.js', bytes: Buffer.byteLength(worker), sha256: sha256(worker)}]
    .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return {assets, worker, manifest: {schemaVersion: 1, game: game.slug, version, engineCommit: game.engineCommit, files}};
}

export async function verifyGame(game, directory = join(game.root, 'dist')) {
  const {manifest} = await packagePlan(game);
  const paths = manifest.files.map(row => row.path);
  await exactInventory(directory, [...paths, 'manifest.json']);
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')), manifest);
  assert.deepEqual(await fileRows(directory, paths), manifest.files);
  return manifest.version;
}

export async function buildGame(game) {
  const {assets, worker, manifest} = await packagePlan(game);
  const stage = await mkdtemp(join(game.root, '.package-'));
  const out = join(game.root, 'dist');
  try {
    for (const {path} of assets) {
      await mkdir(dirname(join(stage, path)), {recursive: true});
      await copyFile(join(game.root, path), join(stage, path));
    }
    await writeFile(join(stage, 'service-worker.js'), worker);
    await writeFile(join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    await verifyGame(game, stage);
    await rm(out, {force: true, recursive: true});
    await rename(stage, out);
  } finally {
    await rm(stage, {force: true, recursive: true});
  }
  return manifest.version;
}
