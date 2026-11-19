import { metricReport, validateBrief } from './campaign.mjs';

export const angles = ['location_view', 'space_layout', 'value_feature'];
const text = value => typeof value === 'string' && Boolean(value.trim());
const object = value => value != null && typeof value === 'object' && !Array.isArray(value);
const canonical = value => value.normalize('NFKC').replace(/[\p{P}\p{S}\p{M}\s]/gu, '').toLowerCase();
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function newAdPlan() {
  return {
    category_review: { category: null, markets: [], source: null, reviewed_at: null },
    variants: [],
    omitted_angles: {}
  };
}

export function adPlanReport(brief, plan) {
  const errors = validateBrief(brief, { ready: true });
  if (brief?.purpose !== 'listing' || brief?.property_status !== 'available') {
    errors.push('Paid listing draft requires an available listing.');
  }
  const review = plan?.category_review;
  if (!['HOUSING', 'NONE'].includes(review?.category) || !Array.isArray(review?.markets) ||
      !review.markets.length || review.markets.some(m => typeof m !== 'string' || !/^[A-Z]{2}$/.test(m)) ||
      !text(review.source) || !date(review.reviewed_at)) {
    errors.push('Record the reviewed Meta category (HOUSING or NONE), target countries, policy source and review date.');
  }
  const variants = Array.isArray(plan?.variants) ? plan.variants : [];
  const omitted = plan?.omitted_angles ?? {};
  const usedAngles = new Set(), usedFacts = new Set(), usedHooks = new Set();
  const facts = brief?.facts ?? {};
  const evidence = new Set(Object.entries(facts).flatMap(([key, value]) =>
    key === 'features' && Array.isArray(value) ? value.map((_, index) => `features.${index}`) :
      (text(value) || typeof value === 'number') && ['location', 'area_sqm', 'rooms', 'price'].includes(key) ? [key] : []));
  if (!variants.length) errors.push('Include at least one supported creative variant.');
  for (const v of variants) {
    if (!angles.includes(v?.angle) || usedAngles.has(v.angle)) {
      errors.push('Each variant needs a unique supported angle.');
      continue;
    }
    usedAngles.add(v.angle);
    for (const field of ['hook', 'shot', 'overlay', 'cta']) if (!text(v[field])) errors.push(`${v.angle}: missing ${field}.`);
    if (!evidence.has(v.fact_key) || usedFacts.has(v.fact_key)) {
      errors.push(`${v.angle}: use a distinct fact_key from the confirmed brief.`);
    } else usedFacts.add(v.fact_key);
    if (text(v.hook)) {
      const hook = canonical(v.hook);
      if (!hook || usedHooks.has(hook)) errors.push(`${v.angle}: hook must express a distinct message.`);
      usedHooks.add(hook);
    }
  }
  if (!object(omitted) || Object.keys(omitted).some(key => !angles.includes(key) || usedAngles.has(key) || !text(omitted[key])) ||
      angles.some(key => !usedAngles.has(key) && !text(omitted[key]))) {
    errors.push('Explain each unused angle in omitted_angles; leave out claims unsupported by the brief.');
  }
  return {
    ok: errors.length === 0, errors, status: 'draft_only',
    official_delivery_estimate: { value: null, status: 'unavailable', label_ar: 'لا يتوفر تقدير رسمي' }
  };
}

export function adResultsReport(brief, plan, results) {
  const draft = adPlanReport(brief, plan);
  if (!draft.ok) throw new Error(draft.errors.join('\n'));
  if (!date(results?.period_start) || !date(results?.period_end) || results.period_start > results.period_end ||
      !text(results.currency) || !text(results.measurement_basis) || !Array.isArray(results.variants) || !results.variants.length) {
    throw new Error('Results need a common date range, currency, measurement basis and at least one variant.');
  }
  const byAngle = new Map(plan.variants.map(v => [v.angle, v]));
  const reportedAngles = new Set(), adIds = new Set();
  const rows = results.variants.map(row => {
    const variant = byAngle.get(row?.angle);
    if (!variant || reportedAngles.has(row.angle) || typeof row.ad_id !== 'string' ||
        !/^\d+$/.test(row.ad_id) || adIds.has(row.ad_id)) {
      throw new Error('Each result needs one planned angle and a distinct Meta ad ID.');
    }
    if (!date(row.observed_at) || row.observed_at < results.period_end) throw new Error('Observation date must be on or after period end.');
    if (row.currency != null && row.currency !== results.currency) throw new Error('Currency mismatch.');
    reportedAngles.add(row.angle);
    adIds.add(row.ad_id);
    return { angle: variant.angle, fact_key: variant.fact_key, hook: variant.hook, ad_id: row.ad_id,
      ...metricReport({ ...row, currency: results.currency }) };
  });
  return { campaign_id: brief.id, platform: brief.platform, period_start: results.period_start,
    period_end: results.period_end, measurement_basis: results.measurement_basis, currency: results.currency,
    variants: rows, missing_angles: [...byAngle.keys()].filter(angle => !reportedAngles.has(angle)),
    note: 'Compare like for like. This report describes supplied results, not causal lift or a forecast.' };
}
