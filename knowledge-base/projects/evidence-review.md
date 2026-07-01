# Multi-Modal Evidence Review — VLM Claim Adjudication

**This is Srikanth's headline / strongest project. Lead with it when asked about his best work.**

## One-line
A two-stage vision-language (VLM) agent that adjudicates insurance damage claims from
images, cross-referencing the claim conversation, user history, and evidence rules to
return a structured 14-column verdict — designed to be prompt-injection-safe.

## The headline result
- **Ranked 16 / 1,773 — top 1%** at **HackerRank Orchestrate, June 2026** (24-hour hackathon).
- Verifiable on the public leaderboard.

## Why it matters (what it demonstrates)
- **Channel-separation security architecture.** Stage 1 (perception) is "claim-light", so
  injected text in the claim or image metadata is *structurally incapable* of changing the
  verdict in Stage 2 (judgment). This is an architectural defense against prompt injection,
  not a patch.
- **Adversarially tested.** A custom suite builds attack twins for each image — a pixel
  overlay (text painted into image padding) and an EXIF `ImageDescription` directive — and
  runs controlled trials. **7 of 8 injection attacks blocked (87.5%)**; injection was
  *detected* in 8/8; the one that moved did so under pixel noise, not by obeying the
  injected instruction.
- **Evaluation-driven development.** Five configs (A–E) compared on a labeled set with
  confusion matrices, macro-F1, per-field accuracy, and risk-flag Jaccard. No config shipped
  without measured evidence; the eval framework is re-runnable.
- **Cost & latency engineering.** Content-hash perception cache (never re-inspect identical
  images) + prompt caching on static system prompts → **~$0.017 per claim**; full 44-claim
  run in ~58s warm.
- **Deterministic verification.** A pure-Python verifier enforces enum constraints,
  cross-field invariants, and the exact 14-column output contract after every model call —
  zero schema violations at submission.

## Key metrics (vs single-pass baseline)
- `valid_image` accuracy: **95%** (+35 pp)
- `severity` accuracy: **70%** (+45 pp)
- `issue_type` accuracy: **75%** (+20 pp)
- `claim_status` accuracy: 70% — *intentionally* slightly below the baseline's 75%. The
  baseline over-flags (90% recall at 49% precision); the shipped config is far better
  *calibrated* across every structural field (risk-flags precision/recall 63%/76% vs 49%/90%).
  This trade is deliberate and defensible.

## Stack
Claude Sonnet 4.6 (perception + reconciliation), Claude Opus 4.8 (escalation, wired but
disabled — scored worse), Gemini 3.5 Flash (evaluated, not selected), `anthropic` SDK with
prompt caching, Pillow (image normalization + EXIF), pandas, tenacity. temperature=0,
pinned deps for reproducibility. Built with Claude Code; prompts calibrated with Google
Antigravity.

## Links
- GitHub: https://github.com/GodVilan/HackerRank-Orchestrate-June-2026
- Leaderboard (verify rank): https://www.hackerrank.com/contests/hackerrank-orchestrate-june26/challenges/multi-modal-review/leaderboard

## How to talk about it in an interview
Be ready to defend two things in your own words: (1) *why* channel separation defeats
injection (claim text never reaches the stage that decides the verdict), and (2) *why*
lower claim_status accuracy is acceptable (calibration over raw accuracy). These are the
senior-signal talking points.
