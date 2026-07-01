# TalentFabric AI — Certification Readiness Platform

## One-line
A five-agent Microsoft Agent Framework system that turns a team working toward Azure
certifications into grounded study plans, workload-aware schedules, cited readiness assessments,
and privacy-conscious manager insights.

## What it does
For each learner it runs a sequential subworkflow — **curate → plan → engage → assess** — with a
**Critic/Verifier loop-back** (capped at 2 iterations) that adjusts study hours when a learner
isn't ready, and can flip "Not Ready → Ready" once the extra hours are added. That per-learner
flow fans out across a whole team and fans in to a Manager Insights report. The five agents:
Learning Path Curator, Study Plan Generator (Planner-Executor), Engagement Agent (workload-aware
scheduling), Assessment Agent (Critic/Verifier), and Manager Insights Agent (privacy-safe fan-in).

## Key metrics (verified)
- **100% classification accuracy** on learner readiness and risk levels across a **12-case
  ground-truth set**.
- **100% citation-grounding rate** — every cited resource grounded in a hybrid BM25 + TF-IDF RAG
  pipeline fused with a Microsoft Learn MCP client.
- **All 36 generated practice questions** validated as grounded through a deterministic
  groundedness gate.
- Pipeline correctness confirmed: identical readiness decisions across the framework-agnostic and
  Microsoft Agent Framework implementations for all 12 learners.
- **5 coordinated agents**; tracked via MLflow; presented in a 6-page Streamlit/Plotly dashboard.

## Stack
Microsoft Agent Framework 1.8.1 (real `WorkflowBuilder` graph with fan-out/fan-in), Microsoft
Foundry / Azure OpenAI, resilient Microsoft Learn MCP client (24-hour disk cache, loop-aware sync
facade, 3-tier fallback), hybrid BM25 + TF-IDF retrieval, MLflow, Streamlit + Plotly. Runs on
100% synthetic data with a provenance write-guard; graceful LLM/MCP fallbacks so the full demo
runs offline.

## Context
Agents League hackathon — Microsoft Reasoning Agents track, Challenge A (Enterprise Learning
System). Implements all three Microsoft IQ layers (Foundry IQ, Fabric IQ, Work IQ).

## Links
- GitHub: https://github.com/GodVilan/TalentFabric-AI
- Demo video (5 min): https://youtu.be/Vq-X2NIaruo
