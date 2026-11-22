// SPDX-License-Identifier: Apache-2.0
import {verifyGame, verifySources} from '../../scripts/cartridge-package.mjs';
import {game} from './package.mjs';

if (process.argv.length === 3 && process.argv[2] === '--source') await verifySources(game);
else if (process.argv.length === 2) await verifyGame(game);
else throw Error('Expected no arguments or --source');
