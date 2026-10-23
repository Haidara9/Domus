# Higgsfield: status report (2026-10-23)

## Higgsfield account (connector, read-only)
- Workspaces: one private workspace only (no separate shared/colleague workspace).
- Balance: 270 credits, plan Starter.
- Video history: 5 completed generations (4 image-to-video from 2026-07, 1 multi motion-control from 2026-09-22).
- The connector can read the account, models and history; it CANNOT generate, upload or buy.

## Higgsfield API (pay per use)
- Base URL https://api.higgsfield.ai, auth header `Authorization: Key <key>`, key copied from open.higgsfield.ai.
- Price check before every job: POST https://api.higgsfield.ai/estimate/<endpoint> with the same body -> {credits, usd}.
- Seedance 2.5 endpoints: bytedance/seedance-2.5/{text-to-video, image-to-video, reference-to-video, video-edit, video-extend};
  app settings: resolution 480p | 720p (default 720p), audio on/off, bitrate standard | high.
- Not charged: failed and nsfw jobs; cancel only before processing; outputs kept at least 7 days.
- In this cloud session: no key in the environment and *.higgsfield.ai is blocked by the network policy, so no API call
  was possible. A key ID alone is not enough: the full key is needed, stored as an environment secret.

## The app (repo Haidara9/higgs-studio, branch main)
- Private Next.js "Higgsfield studio" (Genjutsu, Seedance 2.5, Kling 3.0 + 29 more models) with live cost tracking:
  /api/estimate before Generate, confirm above $5, local spend ledger (today / 7 d / all, CSV), cancel/poll handling.
- Password gate (APP_PASSWORD); the owner pastes the Higgsfield key in the app ("Connect API key"); no key on the server.
- Deploy target chosen: Railway (Vercel was blocked by an overdue balance). Pending owner decisions in SESSION_LOG.md:
  live /estimate check with the key, any paid test, codex review, merge feat/featured-models.

## The colleague's promo videos project (same repo, branch claude/eager-allen-02y76e, folder referral-reel/)
- svuai.app referral reel with the colleague on camera (talking head), latest v5 (2026-10-11): 1080x1920 @60 fps, 48.37 s,
  -14.6 LUFS. Delivered: out/svuai-referral-reel_v5_share.mp4 (29.1 MB, in git); HQ 67 MB not in git.
- Pipeline: graded look -> cuts/zooms -> cut accents -> HyperFrames overlay (captions, cards, icons, end card) -> mux.
- Last state of that session: moving the work to a local Claude Code session on the owner's computer
  (install_deps.sh, setup_local.sh); two skillry.dev skills not installed (domain blocked in the cloud).
- No generation from Higgsfield is part of that reel; it edits real footage only.

## Recommended way to generate the apartment inserts ($2 max, 480p)
Use the higgs-studio app (it already prices every job before running): Seedance 2.5 image-to-video, 480p, 9:16, with
docs/codex-3-images-prompt.md (10 s, about $0.85 estimated). Generate only if the app's estimate is <= $2.00.
