# DOMUS Workspace

Arabic RTL real-estate and content operations workspace, built with React/Vinext and Cloudflare Workers. Cairo fonts are served locally. Site access is owner-private and managed by Sites.

## Features

- Property records with offer status, verified specifications, bilingual copy, calls to action, hashtags and publication links.
- Persistent reusable records, production tasks and reference files, with timestamped audit history and optimistic record revisions.
- Eight-stage production workflow and an Instagram/Facebook planning calendar in Damascus time. Publishing is performed externally and recorded here.
- Visual review checklist, adjustable duration limits, explicit SFX checks and a review gate before approving linked publications.
- Manually entered weekly platform metrics. Missing data stays blank; zero is a measured value; week-over-week changes are absolute differences.
- Editable and copyable caption, photo, video, design and prompt templates. Placeholder content uses {{fields}}.
- JSON record export. Uploaded files are served from private R2 routes; export contains their links, not binary contents.

## Runtime

The manifest binds D1 as DB and R2 as BUCKET. The platform authentication and owner-only site boundary protect the workspace endpoints. Do not make this Site public without adding explicit application-level authorization for every write.

`npm run db:generate` generates schema migrations. Use the Sites build and publication helpers; source and migrations are versioned in the Site repository. Test data in local preview D1 does not deploy to production.

## Validation

TypeScript and production build are checked before publication. Local browser QA exercises property creation and reload persistence, audit history, production tasks, calendar planning, incomplete-review rejection, video duration/SFX warnings, and missing/zero metric handling. Source-level assertions cover the 51/49-second boundary and week start calculation.

## Team and client boundaries

Team records, raw file routes, exports, ad reports, production and analytics require a signed-in email in the server-side `DOMUS_TEAM_EMAILS` allowlist. Non-browser maintenance calls additionally use the secret `DOMUS_SERVICE_TOKEN` in `X-Domus-Service-Token`, alongside the Sites platform service authorization. Missing configuration fails closed. The ignored `.dev.vars` can enable `DOMUS_LOCAL_PREVIEW=1` for local QA only; it must never be a production runtime value.

Client presentations use independent reviewed snapshots and an explicit public field allowlist. Client responses contain no production notes, ad spend, source record history, recipient list or unscoped media URLs. Approved presentations permit only their assigned signed-in emails; draft presentations are team-only. Client media access checks both presentation authorization and the selected media key. Site audience remains private; to admit an external client, the owner must also allow their account in Sites sharing settings. Client viewings are stored internally as inquiry records; no invitation emails or third-party messages are sent.

`node tests/access.test.mjs` exercises role boundaries, draft visibility and the client DTO. The advertising dashboard supports documented manual records and reviewed CSV column mapping; no ad account changes or spend are triggered. Missing ad data is not interpreted as zero. Reporting currency and result type are explicit; reach is not summed across campaigns or daily page audiences.
