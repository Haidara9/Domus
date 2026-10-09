import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/timeline.mjs';

function base() {
  let tl = T.createTimeline({ title: 't', format: 'reel-9x16' });
  tl.media.a = { path: 'a.mp4', kind: 'video', duration: 10, width: 1920, height: 1080, fps: 30 };
  tl.media.b = { path: 'b.mp4', kind: 'video', duration: 6, width: 1920, height: 1080, fps: 30 };
  tl.media.p = { path: 'p.jpg', kind: 'image', width: 4000, height: 3000 };
  return tl;
}

test('formats set canvas size', () => {
  const tl = T.createTimeline({ format: 'wide-16x9' });
  assert.equal(tl.width, 1920); assert.equal(tl.height, 1080); assert.equal(tl.fps, 30);
  assert.throws(() => T.createTimeline({ format: 'nope' }));
});

test('magnetic V1 layout with transition overlaps', () => {
  let tl = base();
  ({ tl } = T.addClip(tl, { media: 'a', in: 0, out: 3, transition: { type: 'dissolve', dur: 0.5 } }));
  ({ tl } = T.addClip(tl, { media: 'b', in: 1, out: 4 }));
  ({ tl } = T.addClip(tl, { media: 'p', out: 2 }));
  const { clips, duration } = T.layout(tl);
  assert.deepEqual(clips.map((c) => [c.start, c.end]), [[0, 3], [2.5, 5.5], [5.5, 7.5]]);
  assert.equal(duration, 7.5);
  assert.ok(T.validate(tl).ok);
});

test('catalog default transition durations', () => {
  let tl = base();
  ({ tl } = T.addClip(tl, { media: 'a', in: 0, out: 3, transition: { type: 'whip-left' } }));
  ({ tl } = T.addClip(tl, { media: 'b', in: 0, out: 3 }));
  assert.equal(T.transitionDur(tl.tracks.video[0], 30), Math.round(0.28 * 30) / 30);
});

test('edits snap to the frame grid', () => {
  let tl = base();
  ({ tl } = T.addClip(tl, { media: 'a', in: 0.01, out: 2.987 }));
  assert.equal(tl.tracks.video[0].in, 0);
  assert.equal(tl.tracks.video[0].out, 90 / 30);
  ({ tl } = T.addItem(tl, 'text', { component: 'archTitle', start: 1.013, dur: 2.02, props: {} }));
  assert.equal(tl.tracks.text[0].start, 1);
  assert.equal(tl.tracks.text[0].dur, 2.033333333333333);
});

test('split keeps total duration and source continuity', () => {
  let tl = base();
  ({ tl } = T.addClip(tl, { media: 'a', in: 2, out: 6, transition: { type: 'dissolve', dur: 0.5 } }));
  ({ tl } = T.addClip(tl, { media: 'b', in: 0, out: 3 }));
  const before = T.layout(tl).duration;
  const r = T.split(tl, 'v1', 1.5);
  const [a, b] = r.tl.tracks.video;
  assert.equal(a.out, 3.5); assert.equal(b.in, 3.5); assert.equal(b.out, 6);
  assert.equal(a.transition, undefined); assert.equal(b.transition.type, 'dissolve');
  assert.equal(T.layout(r.tl).duration, before);
});

test('speed and ramps change output duration consistently', () => {
  let tl = base();
  ({ tl } = T.addClip(tl, { media: 'a', in: 0, out: 4, speed: 2 }));
  assert.equal(T.layout(tl).duration, 2);
  tl = T.setProp(tl, 'v1', 'speed', null);
  tl = T.setProp(tl, 'v1', 'ramp', [{ at: 0, speed: 1 }, { at: 0.5, speed: 0.5 }, { at: 1, speed: 1 }]);
  const d = T.layout(tl).duration;
  assert.ok(d > 4 && d < 8, `ramp duration ${d}`);
  assert.equal(Math.round(d * 30), d * 30); // whole frames
});

test('validation catches real problems', () => {
  let tl = base();
  ({ tl } = T.addClip(tl, { media: 'a', in: 0, out: 12 }));
  assert.match(T.validate(tl).errors.join(), /beyond media duration/);
  tl = base();
  ({ tl } = T.addClip(tl, { media: 'a', in: 0, out: 1, transition: { type: 'dissolve', dur: 2 } }));
  ({ tl } = T.addClip(tl, { media: 'b', in: 0, out: 3 }));
  assert.match(T.validate(tl).errors.join(), /transition/);
  tl = base();
  ({ tl } = T.addItem(tl, 'audio', { kind: 'sfx', start: 1 }));
  assert.match(T.validate(tl).errors.join(), /sfx needs type/);
});

test('beat snapping moves cuts onto beats within tolerance', () => {
  let tl = base();
  ({ tl } = T.addClip(tl, { media: 'a', in: 0, out: 2.1 }));
  ({ tl } = T.addClip(tl, { media: 'b', in: 0, out: 3 }));
  const { tl: s, changes } = T.snapCutsToBeats(tl, [0, 0.5, 1, 1.5, 2, 2.5], { tolerance: 0.2 });
  assert.equal(changes.length, 1);
  assert.equal(T.layout(s).clips[0].end, 2);
});

test('diff reports changes by id', () => {
  let a = base();
  ({ tl: a } = T.addClip(a, { media: 'a', in: 0, out: 3 }));
  const b = T.setProp(a, 'v1', 'camera', { move: 'push-in' });
  assert.deepEqual(T.diff(a, b), ['~ video v1: camera']);
});
