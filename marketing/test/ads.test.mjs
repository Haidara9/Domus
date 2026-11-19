import test from 'node:test';
import assert from 'node:assert/strict';
import { newBrief } from '../src/campaign.mjs';
import { newAdPlan, adPlanReport, adResultsReport } from '../src/ads.mjs';

const brief = { ...newBrief('test-listing'), purpose: 'listing', property_status: 'available',
  confirmation: { status: 'owner_confirmed', by: 'test', at: '2026-11-10' },
  objective: 'inquiries', sources: ['fixture'], facts: { type: 'apartment', location: 'test location', area_sqm: 90, features: [] } };
const variant = (angle, fact_key, hook) => ({ angle, fact_key, hook, shot: 'shot', overlay: 'text', cta: 'call' });
const plan = { ...newAdPlan(),
  category_review: { category: 'HOUSING', markets: ['SY'], source: 'test fixture', reviewed_at: '2026-11-10' },
  omitted_angles: { value_feature: 'No additional confirmed evidence' },
  variants: [variant('location_view', 'location', 'الموقع'), variant('space_layout', 'area_sqm', 'المساحة')] };
const results = { period_start: '2026-11-10', period_end: '2026-11-12', currency: 'USD', measurement_basis: 'fixture',
  variants: [{ angle: 'location_view', ad_id: '123', source: 'fixture', observed_at: '2026-11-13', spend: 24, inquiries: 6, qualified_inquiries: 3 }] };

test('paid draft requires category review and never invents a delivery estimate', () => {
  assert.equal(adPlanReport(brief, newAdPlan()).ok, false);
  const report = adPlanReport(brief, plan);
  assert.equal(report.ok, true);
  assert.equal(report.official_delivery_estimate.value, null);
  assert.equal(adPlanReport({ ...brief, property_status: 'rented' }, plan).ok, false);
});

test('a cosmetic hook change and reused evidence do not qualify as a new angle', () => {
  const duplicate = variant('space_layout', 'location', 'الموقع! ✨');
  const { errors } = adPlanReport(brief, { ...plan, variants: [plan.variants[0], duplicate] });
  assert.ok(errors.some(e => e.includes('distinct fact_key')));
  assert.ok(errors.some(e => e.includes('distinct message')));
});

test('report binds measured cost to the planned angle and leaves unreported angles missing', () => {
  const report = adResultsReport(brief, plan, results);
  assert.equal(report.variants[0].cost_per_inquiry, 4);
  assert.equal(report.variants[0].cost_per_qualified_inquiry, 8);
  assert.deepEqual(report.missing_angles, ['space_layout']);
  assert.throws(() => adResultsReport(brief, plan, { ...results,
    variants: [...results.variants, { ...results.variants[0], angle: 'space_layout' }] }), /distinct Meta ad ID/);
  assert.throws(() => adResultsReport(brief, plan, { ...results,
    variants: [{ ...results.variants[0], currency: 'EUR' }] }), /Currency mismatch/);
});
