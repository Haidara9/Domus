import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, symlinkSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { newBrief, validateBrief, campaignPath, writeJSON, approve, exportPacket, metricReport, within } from '../src/campaign.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'domus-marketing-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const slug = 'rented-test';
  const brief = newBrief(slug);
  Object.assign(brief, { purpose: 'announcement', property_status: 'rented', objective: 'Announce closure', confirmation: { status: 'owner_confirmed', by: 'owner', at: '2026-10-12T15:32:15+03:00' }, sources: ['Owner supplied rental status'] });
  const copy = { hook: 'تم التأجير', caption: 'تم تأجير العقار.', cta: 'تواصل عبر الرسائل.', hashtags: ['#دوموس_العقارية'] };
  const dir = campaignPath(root, slug);
  writeJSON(join(dir, 'brief.json'), brief);
  writeJSON(join(dir, 'copy.json'), copy);
  return { root, slug, dir, brief, copy };
}

test('rented and sold property cannot become an available listing', () => {
  for (const status of ['rented', 'sold', 'unknown']) {
    const b = newBrief('property'); b.purpose = 'listing'; b.property_status = status;
    assert.ok(validateBrief(b).some(e => e.includes('Only available')));
  }
});
test('missing facts never receive defaults; pending brief cannot be approved', (t) => {
  const { root, slug, dir } = fixture(t);
  const b = newBrief(slug); writeJSON(join(dir, 'brief.json'), b);
  assert.equal(b.facts.price, null); assert.equal(b.facts.area_sqm, null);
  assert.throws(() => approve(root, slug, 'owner'), /Confirm availability/);
});
test('export requires explicit approval and does not mark publication', (t) => {
  const { root, slug } = fixture(t);
  assert.throws(() => exportPacket(root, slug), /human approval/);
  approve(root, slug, 'owner');
  const packet = exportPacket(root, slug);
  assert.equal(packet.status, 'ready_for_manual_publish');
  assert.equal(packet.published_at, null); assert.equal(packet.platform_post_id, null);
});
test('any copy or facts change invalidates approval', (t) => {
  const { root, slug, dir, copy, brief } = fixture(t);
  approve(root, slug, 'owner');
  writeJSON(join(dir, 'copy.json'), { ...copy, caption: 'تعديل' });
  assert.throws(() => exportPacket(root, slug), /stale/);
  writeJSON(join(dir, 'copy.json'), copy);
  brief.facts.location = 'New location'; writeJSON(join(dir, 'brief.json'), brief);
  assert.throws(() => exportPacket(root, slug), /stale/);
});
test('reel requires media and binds approval to its actual bytes', (t) => {
  const { root, slug, dir, brief } = fixture(t);
  brief.format = 'reel'; writeJSON(join(dir, 'brief.json'), brief);
  assert.throws(() => approve(root, slug, 'owner'), /actual local video/);
  brief.media.video = 'video.mp4'; writeJSON(join(dir, 'brief.json'), brief);
  assert.throws(() => approve(root, slug, 'owner'), /missing/);
  writeFileSync(join(root, 'video.mp4'), 'first bytes');
  approve(root, slug, 'owner'); writeFileSync(join(root, 'video.mp4'), 'edited bytes');
  assert.throws(() => exportPacket(root, slug), /stale/);
});
test('path traversal and symlinks cannot escape the workspace', (t) => {
  const { root } = fixture(t);
  assert.throws(() => campaignPath(root, '../escape'));
  assert.throws(() => within(root, '../escape'));
  symlinkSync(tmpdir(), join(root, 'outside'));
  assert.throws(() => within(root, 'outside/video.mp4'), /inside/);
});
test('price requires currency and phone CTA requires a supplied public number', () => {
  const b = newBrief('property'); b.facts.price = 170000; b.contact.method = 'phone';
  assert.ok(validateBrief(b).some(e => e.includes('currency')));
  assert.ok(validateBrief(b).some(e => e.includes('public number')));
});
test('campaign file id must agree with its folder', (t) => {
  const { root, slug, dir, brief } = fixture(t);
  brief.id = 'different'; writeJSON(join(dir, 'brief.json'), brief);
  assert.throws(() => approve(root, slug, 'owner'), /does not match/);
});
test('metrics preserve missing values and handle zero denominators', () => {
  const m = { source: 'Owner export', observed_at: '2026-10-12T12:00:00Z', reach: 0, engagements: 0, spend: 10, currency: 'USD', inquiries: 0 };
  const r = metricReport(m);
  assert.equal(r.engagement_per_reach_pct, null); assert.equal(r.cost_per_inquiry, null);
  assert.equal(r.values.qualified_inquiries, null);
  assert.throws(() => metricReport({ ...m, source: '' }), /source/);
  assert.throws(() => metricReport({ ...m, spend: -1 }), /spend/);
});
test('metrics calculate only from supplied, sourced data', () => {
  const r = metricReport({ source: 'Test fixture', observed_at: '2026-10-12T12:00:00Z', reach: 1000, engagements: 25, spend: 20, currency: 'USD', inquiries: 10, qualified_inquiries: 4 });
  assert.equal(r.engagement_per_reach_pct, 2.5); assert.equal(r.cost_per_inquiry, 2);
  assert.equal(r.cost_per_qualified_inquiry, 5);
});
