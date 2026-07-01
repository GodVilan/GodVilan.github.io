# Serverless API — Sri assistant + Medium proxy

Two Vercel serverless functions power the dynamic parts of the site. Both run **server-side**, so no
API key is ever exposed to the browser.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/ask` | `POST` | **Sri** — a grounded RAG assistant that answers questions about Srikanth from `/knowledge-base`, with citations. |
| `/api/medium` | `GET` | Proxies Srikanth's Medium RSS feed to JSON so the Writing section doesn't depend on a public proxy. |

---

## `/api/ask` — how it works

1. **Key stays server-side.** The Anthropic API key is read from `process.env.ANTHROPIC_API_KEY` inside
   the function. It is never sent to, or reachable from, the client.
2. **Cold-start indexing.** On the first request to a fresh instance, every `.md` file under
   `/knowledge-base` (including `projects/`) is loaded, chunked, and turned into an in-memory
   **TF-IDF vector index**. The index is cached on the instance and reused by warm invocations.
3. **Per-request retrieval.** The visitor's question is vectorized against the same vocabulary and the
   **top-k** (default 5) most similar chunks are selected by cosine similarity.
4. **Grounded generation.** Those chunks are passed to **Claude Haiku (`claude-haiku-4-5`)** with a
   system prompt that instructs it to answer **only** from the provided context, decline when the
   answer isn't there, and treat the visitor's question as data — never as instructions (prompt-injection
   guardrail).
5. **Cited response.** Returns `{ "answer": "...", "sources": ["resume.md", "projects/evidence-review.md"] }`.
   If `sources` is empty, the answer wasn't grounded in the KB — treat it as out of scope.
6. **Rate limiting.** Best-effort per-IP sliding window (12 requests / 60s per instance).

### Request / response

```bash
curl -X POST https://<your-domain>/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Srikanth'\''s strongest project?"}'
```

```json
{
  "answer": "Srikanth's headline project is Multi-Modal Evidence Review ...",
  "sources": ["faq.md", "projects/evidence-review.md"]
}
```

Errors: `400` (missing/oversized question), `405` (wrong method), `429` (rate limited), `500`
(missing key), `502` (model error).

> **Why TF-IDF and not neural embeddings?** Anthropic does not provide an embeddings endpoint, so a
> neural index would require a *second* provider and key. For a ~10-file knowledge base, a self-contained
> TF-IDF cosine index gives strong retrieval with zero extra dependencies and an instant cold start.
> See **Upgrading retrieval** below to switch to Voyage AI embeddings later.

---

## `/api/medium` — how it works

Fetches the Medium RSS feed server-side, parses the `<item>` entries, and returns
`{ status: "ok", items: [{ title, link, pubDate, description, content }] }` — the same shape the
front-end already consumes. Responses are edge-cached (`s-maxage=1800, stale-while-revalidate`) to
keep Medium requests low. `main.js` calls this at `/api/medium`; the Writing section stays hidden
unless posts load.

---

## Deploy (Vercel)

These functions require a Node serverless host — **GitHub Pages cannot run them.** The simplest setup
is to deploy the whole repo (static site + `/api`) to Vercel so the site and API share one origin.

1. **Install the CLI and log in** (once):
   ```bash
   npm i -g vercel
   vercel login
   ```
2. **Install dependencies** (the Anthropic SDK):
   ```bash
   npm install
   ```
3. **Add the environment variable** in the Vercel dashboard
   (Project → Settings → Environment Variables), for the Production (and Preview) environments:
   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your Anthropic key (`sk-ant-…`) |
   | `ALLOWED_ORIGIN` *(optional)* | `https://srikanthreddynandireddy.me` — locks CORS to your site |
   | `MEDIUM_FEED_URL` *(optional)* | override the default `https://medium.com/feed/@srikanth2314` |
4. **Deploy:**
   ```bash
   vercel          # preview deploy
   vercel --prod   # production
   ```
5. **Point the domain.** Move `srikanthreddynandireddy.me` from GitHub Pages to this Vercel project
   (Project → Settings → Domains). Once the site and API share an origin, the relative `/api/...`
   calls in `main.js` work with no CORS config needed.

`vercel.json` already tells Vercel to bundle `knowledge-base/**` with the `ask` function (via
`includeFiles`) so the KB is present at runtime.

### Local development

```bash
cp .env.example .env      # then set ANTHROPIC_API_KEY
vercel dev                # serves the static site + /api on http://localhost:3000
```

### Keeping the static site on GitHub Pages (alternative)

If you'd rather keep the static site on GitHub Pages and host only the API on Vercel:

- Set `ALLOWED_ORIGIN=https://srikanthreddynandireddy.me` in Vercel so the browser can call across origins.
- In `main.js`, change the two relative paths (`/api/medium`, and `/api/ask` when the chat UI is wired
  up) to the absolute Vercel URL, e.g. `https://<project>.vercel.app/api/medium`.

---

## Environment variables

| Name | Required | Used by | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | `ask` | Anthropic key; server-side only. Never commit it or put it in client code. |
| `ALLOWED_ORIGIN` | — | both | Restrict CORS to your site's origin. Defaults to `*`. |
| `MEDIUM_FEED_URL` | — | `medium` | Override the Medium feed URL. |

---

## Upgrading retrieval (optional: Voyage AI embeddings)

To replace TF-IDF with neural embeddings, add a `VOYAGE_API_KEY` and swap two functions in
`api/ask.js`:

- In `buildIndex()`, embed each chunk's text with a Voyage model (e.g. `voyage-3`) and store the
  returned vectors instead of TF-IDF maps.
- In `retrieve()`, embed the question the same way and rank chunks by cosine similarity over the
  embedding vectors.

The rest of the pipeline (chunking, top-k, the Haiku call, citations, rate limiting) stays the same.
