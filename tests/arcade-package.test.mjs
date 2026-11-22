// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {cp, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {basename, join} from 'node:path';
import {tmpdir} from 'node:os';
import {buildGame, verifyGame, verifySources} from '../scripts/cartridge-package.mjs';

for (const suite of await readdir(new URL('./cartridges/', import.meta.url))) {
  const slug = basename(suite, '.mjs');
  const {game} = await import('../' + slug + '/scripts/package.mjs');
  test(slug + ' binds the offline worker, packaging and engine blobs to source bytes', async t => {
    const tmp = await mkdtemp(join(tmpdir(), 'games2-package-'));
    t.after(() => rm(tmp, {recursive:true, force:true}));
    const root = join(tmp, slug), fixture = {...game, root};
    await cp(game.root, root, {recursive:true, filter: path => basename(path) !== 'dist'});
    const version = await buildGame(fixture);
    assert.equal(await buildGame(fixture), version);
    const worker = await readFile(join(root,'dist/service-worker.js'),'utf8');
    assert.ok(worker.includes(JSON.stringify(slug)));
    assert.ok(worker.includes(version));
    await writeFile(join(root,'dist/src/app.js'),'changed');
    await assert.rejects(verifyGame(fixture));
    await buildGame(fixture);
    await writeFile(join(root,'dist/extra.txt'),'extra');
    await assert.rejects(verifyGame(fixture));
    await writeFile(join(root,'vendor/vanillajs/modules/time/index.js'),'changed');
    await assert.rejects(verifySources(fixture));
  });
}
