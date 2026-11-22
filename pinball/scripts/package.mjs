// SPDX-License-Identifier: Apache-2.0
import {fileURLToPath} from 'node:url';

export const game = {
  root: fileURLToPath(new URL('../', import.meta.url)),
  slug: 'pinball',
  engineCommit: 'd6da91b91374d28bdd7c201d214f5618b247904c',
  modules: {
    'modules/time/index.js': '60c1532aaaac36beceb3e81f1a935c59478976b2'
},
  files: ['index.html', 'style.css', 'src/app.js', 'src/world.js', 'src/view.js', 'src/offline.js', 'LICENSE', 'NOTICE'],
};
