# arXiv Agent — ReAct Research Assistant

## One-line
A ReAct research agent over an arXiv ML corpus that decomposes multi-hop questions, retrieves
iteratively, and runs a self-critique loop to refine weak answers before delivering cited results
— built on a rigorously benchmarked embedding stack.

## What it does
A ReAct agent with multi-hop query decomposition and a self-critique/peer-review loop, exposing
**5 tools** (semantic search, BM25 fallback, live arXiv fetch, summarize, compare) plus
conversation memory and persistent research notes, in a Streamlit UI. The retrieval layer is
layout-aware (chunks tagged by scientific section) over a curated arXiv ML paper corpus.

## Key metrics (verified)
- **MRR@5 = 0.990** and **Context Precision = 1.000** on 100 curated QA pairs.
- **Precision@5 = 0.950** with **BGE-large-en** (1024-dim) on FAISS IndexFlatIP — the strongest
  dense retriever benchmarked. BM25 remains a competitive sparse baseline on retrieval
  (MRR@5 0.978), but scores far lower on generation answer relevance (0.125 vs BGE's 0.912).
- Benchmarked against MiniLM and MPNet across **3 chunk sizes × 4 retrieval depths**; MiniLM is
  the best latency/quality trade-off (MRR@5 0.975 at ~6.8 ms).

## Stack
BGE-large-en embeddings, FAISS (IndexFlatIP, exact cosine), Okapi BM25 sparse baseline, Google
Gemini for generation, Sentence Transformers, Streamlit. Evaluated with Recall@K, Precision@K,
MRR, Faithfulness, and Answer Relevance.

## Links
- GitHub (agent): https://github.com/GodVilan/arXiv-agent
- GitHub (retrieval benchmark): https://github.com/GodVilan/arXiv-rag
