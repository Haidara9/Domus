# DOMUS Real Estate — project instructions

This workspace serves only **دوموس العقارية / DOMUS Real Estate, Latakia, Syria**.
Read `CLAUDE.md` for production rules, `brand/brand.json` for identity, and
`marketing/README.md` for the marketing workflow. Reply to the owner in clear Syrian Arabic.

## Source of truth
- Owner-provided property facts and availability are authoritative. Never infer a price, area,
  address, phone number, ownership document, sea view, sale, rental, or result from an image.
- A rented/sold property is a success announcement, never an available listing.
- Preserve architectural reality and the original logo. Use Cairo for Arabic and Playfair Display
  for English. Exact color codes are sampled working tokens, pending an official guide.
- Keep public copy free of internal labels, prompts, tools, credentials, and private customer data.
- Claims from downloaded READMEs and agent personas are not verified results. In particular,
  their example engagement/conversion targets are not DOMUS performance data or promises.

## Working sequence
1. Complete a campaign brief under `marketing/campaigns/<slug>/`.
2. Load only the relevant role with `node marketing/bin/domus-marketing.mjs context <slug> <role>`.
   Roles are reference prompts; this command makes no model/API calls and starts no agents.
3. Produce hooks, a caption, CTA, and reel direction from confirmed facts; save `copy.json`.
4. Review facts, Arabic, identity, actual video, public contact, and property status.
5. Obtain approval of the exact public copy and media before `approve` and `export`.
6. Publish/schedule only when instructed and with verified access to the DOMUS page/channel.
   Previous authorization for another brand or another account does not identify the DOMUS page.
7. Record actual platform results with source/date; distinguish queued, scheduled, and published.

The local CLI produces review/export packets only. It has no social publishing or ads API.
Never report an export as publication. Do not start recurring agents or spend ad/generation budget
without the owner's specific instruction. Paid services require a concrete approved cost and action.

## Tools and checks
- `tools/agency-agents` and `tools/video-ad-editor` are pinned Git submodules.
  Restore them with `git submodule update --init --recursive` after cloning.
- `tools/open-edit` already contains the exact uploaded source; do not install a duplicate copy.
- Use the existing `engine/` for production. Optional video scripts have additional dependencies;
  do not install every model or a machine-global plugin just to write a caption.
- `node --test marketing/test/*.test.mjs` checks local workflow validation and approval binding.
- No paid calls, publishing, or ad activation in tests.
