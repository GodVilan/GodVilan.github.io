# MedsGuard — LLM Medication Agent with a Safety Spine

## One-line
A medication-logging agent that parses natural-language input with an LLM but treats the
model as untrusted: deterministic code holds all write authority, so a compromised or
hallucinating LLM cannot log an unauthorized drug or dose.

## Context
Built for **Kaggle's Vibe Coding Agents** capstone competition (**Concierge track**), June
2026. Full title of the writeup: *"MedsGuard: An LLM-Driven Medication Agent with a
Deterministic Safety Spine."*

## Why it matters (what it demonstrates)
- **Zero-trust agent architecture.** The LLM parses intent into *structured nulls* — it
  never gets to emit a raw database write. Every step that can mutate state is deterministic
  Python, not model output.
- **Six-stage safety spine (parse → write):**
  1. **Parse** — Gemini 3.1 Pro Preview extracts intent into structured nulls.
  2. **Slot resolution** — deterministic resolver fills the structured fields.
  3. **Clarification gate** — a fail-closed "semantic referee" LLM screens ambiguous input.
  4. **Policy screen** — deterministic rules validate the request against `policies.yaml`.
  5. **Confirm** — an HMAC-signed session token plus explicit human confirmation, gated by a
     JWT with a 300-second TTL, is required before any write.
  6. **Write** — SQLite insert inside a `BEGIN IMMEDIATE` transaction, deduplicated on a
     4-part key.
- **Injection-safe by construction.** Per-request HMAC authentication prevents token
  forgery; the human-in-the-loop confirm step means no write happens without explicit user
  approval; semantic screening keeps the LLM from slipping medical advice into outputs.
- **MCP boundary.** Database operations run behind a Model Context Protocol (MCP) server as a
  separate subprocess, keeping the model's tool surface narrow and auditable.

## Stack
Google Gemini 3.1 Pro Preview (parsing + semantic referee), FastAPI, SQLite via an MCP
subprocess, HMAC signatures and JWT tokens for auth, `policies.yaml` for the deterministic
policy layer, a standalone token minter (`mint_token.py`), and a ~78-call live test harness.
Primarily Python.

## Links
- GitHub: https://github.com/GodVilan/medsguard-agent
- Kaggle writeup: https://kaggle.com/competitions/vibecoding-agents-capstone-project/writeups/medsguard-an-llm-driven-medication-agent-with-a-d
- Kaggle profile: https://www.kaggle.com/godvillain24

## How to talk about it in an interview
The senior signal here is the same one as the VLM claim-adjudication project: **the model is
untrusted, and safety is structural, not a patch.** Be ready to explain why forcing input
into "structured nulls" plus a deterministic policy + HMAC/JWT confirm gate makes an
unauthorized write impossible even if the LLM is fully prompt-injected.
