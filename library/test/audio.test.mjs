import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load, verify, credits} from '../bin/audio.mjs';

test('every library file exists, matches its sha256 and has a licence and source', () => {
  assert.deepEqual(verify(), []);
});
test('only redistributable licences are stored', () => {
  for (const item of [...load('music'), ...load('sfx')]) assert.ok(['CC0-1.0', 'CC-BY-4.0'].includes(item.licence), item.id);
  for (const item of load('sfx')) assert.equal(item.attribution_required, false, item.id);
});
test('CC BY tracks give a credit line and CC0 tracks do not require one', () => {
  const music = load('music');
  const by = music.find((x) => x.licence === 'CC-BY-4.0'), cc0 = music.find((x) => x.licence === 'CC0-1.0');
  assert.ok(by && cc0);
  const [a, b] = credits([by.id, cc0.id]);
  assert.equal(a.required, true); assert.match(a.line, /Creative Commons: By Attribution 4\.0/);
  assert.equal(b.required, false);
  assert.throws(() => credits(['not-a-track']));
});
