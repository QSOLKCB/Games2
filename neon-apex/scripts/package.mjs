// SPDX-License-Identifier: Apache-2.0
import {fileURLToPath} from 'node:url';

export const game = {
  root: fileURLToPath(new URL('../', import.meta.url)),
  slug: 'neon-apex',
  engineCommit: 'd6da91b91374d28bdd7c201d214f5618b247904c',
  dependencies: {'modules/road-arcade/index.js': ['math']},
  modules: {
    'modules/time/index.js': '60c1532aaaac36beceb3e81f1a935c59478976b2',
    'modules/math/index.js': '45e5fc4d6c6daa472a89fa59c80e6fd70b2c1455',
    'modules/road-arcade/index.js': '48dea1329eabcfe5a24f7931ca3c1c26a83ac231'
  },
  files: ['index.html', 'style.css', 'src/app.js', 'src/world.js', 'src/view.js', 'src/synth.js', 'src/offline.js', 'LICENSE', 'NOTICE'],
};
