// End-to-end smoke test: synthetic footage -> timeline -> render -> QC -> cached re-render.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as T from '../src/timeline.mjs';
import { ffmpeg, probe } from '../src/util.mjs';
import { render } from '../src/render.mjs';
import { detectBeats } from '../src/analyze.mjs';

test('render pipeline end to end', { timeout: 600000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'domus-'));
  try {
    await ffmpeg(['-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=4', '-pix_fmt', 'yuv420p', join(dir, 'a.mp4')]);
    await ffmpeg(['-f', 'lavfi', '-i', 'color=c=0x886644:s=480x640:r=30:d=3', '-pix_fmt', 'yuv420p', join(dir, 'b.mp4')]);
    await ffmpeg(['-f', 'lavfi', '-i', 'sine=f=220:d=6', join(dir, 'm.wav')]);
    let tl = T.createTimeline({ title: 'smoke', format: 'square-1x1' });
    tl.width = 360; tl.height = 360; // keep the test fast
    for (const [id, f] of [['a', 'a.mp4'], ['b', 'b.mp4']]) {
      const p = await probe(join(dir, f));
      tl.media[id] = { path: f, kind: 'video', duration: p.duration, width: p.width, height: p.height, fps: p.fps };
    }
    ({ tl } = T.addClip(tl, { media: 'a', in: 0, out: 2, camera: { move: 'push-in' }, transition: { type: 'whip-left' } }));
    ({ tl } = T.addClip(tl, { media: 'b', in: 0, out: 2, grade: 'domus-warm-paper' }));
    ({ tl } = T.addItem(tl, 'text', { component: 'archTitle', start: 0.3, dur: 1.5, props: { title: 'اختبار' } }));
    ({ tl } = T.addItem(tl, 'audio', { kind: 'music', path: 'm.wav', start: 0, gain: -18 }));
    ({ tl } = T.addItem(tl, 'audio', { kind: 'sfx', type: 'whoosh', start: 1.7 }));
    assert.ok(T.validate(tl, { root: dir }).ok);
    T.save(dir, tl, 'test');
    const first = await render(dir, { quality: 'draft' });
    const p = await probe(first.out);
    assert.equal(p.width, 360);
    assert.ok(Math.abs(p.duration - T.layout(tl).duration) < 0.1, `duration ${p.duration}`);
    assert.ok(p.hasAudio);
    assert.equal(first.report.pass, true, JSON.stringify(first.report.checks.filter((c) => !c.pass)));
    // targeted revision: change only the title -> segments come from cache
    T.save(dir, T.setProp(tl, 't1', 'props.title', 'تعديل'), 'retitle');
    const second = await render(dir, { quality: 'draft', noQc: true });
    assert.equal(second.manifest.stats.segments.rendered, 0);
    assert.equal(second.manifest.stats.overlays.rendered, 1);
    const beats = await detectBeats(join(dir, 'm.wav'));
    assert.ok(beats.bpm >= 70 && beats.bpm <= 180);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
