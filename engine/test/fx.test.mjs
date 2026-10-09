// Footage FX and camera mirror: graph shape, per-frame opacities, and JS camera = ffmpeg camera.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cameraAt, fxGraph, fxShapeJS } from '../src/video.mjs';

test('fxGraph builds eq, bloom, defocus and fringe stages with a sendcmd script', () => {
  const fx = [
    { type: 'exposure', at: 0, dur: 0.3, amount: 0.2, shape: 'flash' },
    { type: 'bloom', amount: 0.4 },
    { type: 'defocus', at: 1, dur: 0.5, shape: 'hold', amount: 0.8 },
    { type: 'fringe', at: 0, dur: 0.1, px: 6 },
  ];
  const { graph, cmds } = fxGraph(fx, '[pre]', '[v]', { fps: 30, frames: 60, cmdPath: '/tmp/x.cmd' });
  assert.match(graph, /eq=brightness=/);
  assert.match(graph, /blend@bloom=all_mode=screen/);
  assert.match(graph, /\[fx\d+\]\[fx\d+\]blend@defocus=all_mode=normal:all_opacity=0/);
  assert.match(graph, /rgbashift=rh=-6:bh=6/);
  assert.match(graph, /sendcmd=f=/);
  assert.ok(graph.endsWith('format=yuv420p[v]'));
  assert.match(cmds, /^0 blend@bloom all_opacity 0.4;/m);
  assert.match(cmds, /blend@defocus all_opacity 0.8;/);
  assert.equal(fxGraph([], '[a]', '[b]').graph, '[a]null[b]');
});

test('fx shapes', () => {
  assert.equal(fxShapeJS(5, { type: 'bloom' }), 1);
  assert.equal(fxShapeJS(0, { at: 0, dur: 1, shape: 'bell' }), 0);
  assert.ok(Math.abs(fxShapeJS(0.5, { at: 0, dur: 1, shape: 'bell' }) - 1) < 1e-9);
  assert.equal(fxShapeJS(3, { at: 1, dur: 0.5, shape: 'hold' }), 1);
  assert.equal(fxShapeJS(0.5, { at: 1, dur: 0.5, shape: 'hold' }), 0);
});

test('cameraAt mirrors keys and maps source to output', () => {
  const clip = { dur: 2, camera: { keys: [[0, 1.2, 0.5, 0.5], [1, 1.0, 0.5, 0.5]] } };
  const a = cameraAt(clip, 0, 1920, 1080);
  assert.ok(Math.abs(a.Z - 1.2) < 1e-9);
  // the frame centre stays at the centre for a centred zoom
  assert.ok(Math.abs(0.5 * a.Z + a.ox - 0.5) < 1e-9 && Math.abs(0.5 * a.Z + a.oy - 0.5) < 1e-9);
  const b = cameraAt(clip, 1.5, 1920, 1080);
  assert.ok(Math.abs(b.Z - 1) < 1e-9 && Math.abs(b.ox) < 1e-9);
  // shake moves the window but stays inside the scaled frame
  const s = cameraAt({ dur: 1, camera: { keys: [[0, 1.1, 0.5, 0.5]], shake: [{ at: 0, dur: 0.5, amp: 20, freq: 10 }] } }, 0.03, 1920, 1080);
  assert.ok(s.ox <= 0 && s.ox >= -(s.Z - 1));
});
