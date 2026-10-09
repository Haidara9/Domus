import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/timeline.mjs';
import { withFormat, overlayItems } from '../src/render.mjs';

test('byFormat overrides apply only to their format', () => {
  let tl = T.createTimeline({ format: 'reel-9x16' });
  ({ tl } = T.addItem(tl, 'animation', { component: 'archLines', start: 0, dur: 2, props: { at: [0.7, 0.98], scale: 1.3 }, byFormat: { 'feed-4x5': { props: { scale: 0.9 } } } }));
  const reel = withFormat(tl);
  assert.equal(reel.tracks.animation[0].props.scale, 1.3);
  const feed = withFormat(tl, 'feed-4x5');
  assert.equal(feed.height, 1350);
  assert.equal(feed.tracks.animation[0].props.scale, 0.9);
  assert.deepEqual(feed.tracks.animation[0].props.at, [0.7, 0.98]);
});

test('overlay layering: animation < vfx < text, layer overrides', () => {
  let tl = T.createTimeline({});
  ({ tl } = T.addItem(tl, 'text', { component: 'archTitle', start: 0, dur: 1, props: {} }));
  ({ tl } = T.addItem(tl, 'animation', { component: 'paperBackground', start: 0, dur: 1, props: {} }));
  ({ tl } = T.addItem(tl, 'vfx', { component: 'lightSweep', start: 0, dur: 1, props: {}, layer: 500 }));
  assert.deepEqual(overlayItems(tl).map((i) => i.component), ['paperBackground', 'archTitle', 'lightSweep']);
});
