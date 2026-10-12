#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { campaignPath, newBrief, readJSON, writeJSON, validateBrief, validateCopy, loadCampaign, buildContext, approve, exportPacket, metricReport } from '../src/campaign.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const [command = 'help', slug, arg] = process.argv.slice(2);
try {
  if (command === 'new') {
    const dir = campaignPath(root, slug);
    if (existsSync(dir)) throw new Error('Campaign exists; use a new slug');
    mkdirSync(dir, { recursive: true });
    writeJSON(resolve(dir, 'brief.json'), newBrief(slug));
    writeJSON(resolve(dir, 'copy.json'), { hook: '', caption: '', cta: '', hashtags: [] });
    console.log(`Created ${dir}. Fill the confirmed brief before writing copy.`);
  } else if (command === 'validate') {
    const { brief, copy } = loadCampaign(root, slug);
    const errors = [...validateBrief(brief, { ready: true }), ...validateCopy(copy)];
    console.log(JSON.stringify({ ok: !errors.length, errors, semantic_review: 'Human factual and visual review still required' }, null, 2));
    if (errors.length) process.exitCode = 1;
  } else if (command === 'context') {
    const dir = campaignPath(root, slug);
    const brief = readJSON(resolve(dir, 'brief.json'));
    if (brief.id !== slug) throw new Error('Campaign id does not match its folder');
    const text = buildContext(root, brief, arg ?? 'copy');
    mkdirSync(resolve(dir, 'review'), { recursive: true });
    const out = resolve(dir, 'review', `${arg ?? 'copy'}-context.md`);
    writeFileSync(out, text);
    console.log(`Role context saved: ${out}. No agents or remote calls started.`);
  } else if (command === 'approve') {
    console.log(JSON.stringify(approve(root, slug, arg), null, 2));
  } else if (command === 'export') {
    const packet = exportPacket(root, slug);
    console.log(`${packet.id}: ${packet.status}. This is a local export, not a published post.`);
  } else if (command === 'report') {
    const dir = campaignPath(root, slug);
    const report = metricReport(readJSON(resolve(dir, 'metrics.json')));
    writeJSON(resolve(dir, 'review', 'metrics-report.json'), report);
    console.log(JSON.stringify(report, null, 2));
  } else if (command === 'doctor') {
    const config = readJSON(resolve(root, 'marketing/config.json'));
    const brand = readJSON(resolve(root, 'brand/brand.json'));
    const checks = Object.entries(config.roles).map(([role, path]) => ({ component: role, present: existsSync(resolve(root, path)) }));
    for (const [label, path] of [['logo_ar', brand.logos.logoAr], ['logo_en', brand.logos.logoEn], ['Cairo', brand.fonts.arabicText.files[0].path], ['Playfair Display', brand.fonts.latinDisplay.files[0].path], ['Open Edit source', 'tools/open-edit/cli/src/cli.ts'], ['Video Ad Editor source', 'tools/video-ad-editor/video-ad-editor/SKILL.md']]) checks.push({ component: label, present: existsSync(resolve(root, path)) });
    console.log(JSON.stringify({ runtime: process.version, checks, publishing: 'Not connected; local packets only', model_calls: false }, null, 2));
    if (checks.some(c => !c.present)) process.exitCode = 1;
  } else if (command === 'help') {
    console.log(`DOMUS Marketing — local, no dependencies, no paid or publishing calls\n
node marketing/bin/domus-marketing.mjs new <slug>
node marketing/bin/domus-marketing.mjs context <slug> <strategy|copy|reels|brand|ads|analytics>
node marketing/bin/domus-marketing.mjs validate <slug>
node marketing/bin/domus-marketing.mjs approve <slug> "<human reviewer>"  # only after exact-content approval
node marketing/bin/domus-marketing.mjs export <slug>
node marketing/bin/domus-marketing.mjs report <slug>  # metrics.json must cite source/date
node marketing/bin/domus-marketing.mjs doctor`);
  } else throw new Error('Unknown command; run help');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
