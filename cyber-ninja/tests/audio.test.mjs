// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import {checkSynth} from '../../tests/synth-check.mjs';
import {FoundryAudio} from '../src/synth.js';

test('opt-in synth bounds overlapping voices and silences them immediately on mute', () => checkSynth(FoundryAudio, 'riposte'));
