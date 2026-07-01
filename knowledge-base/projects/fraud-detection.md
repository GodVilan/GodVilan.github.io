# Real-Time Credit Card Fraud Detection — MLOps

## One-line
An end-to-end, production-grade MLOps system for real-time credit-card fraud detection. The point
of this project is the **pipeline**, not any single accuracy score.

## What it does
GitHub Actions CI/CD trains and evaluates models, then promotes the best one to an MLflow Model
Registry (`@production` alias). A Dockerized FastAPI service behind an Nginx reverse proxy on AWS
EC2 serves real-time (`/predict`) and batch (`/predict-batch`) scoring, with API-key auth and rate
limiting. Experiment metadata lives in a PostgreSQL (RDS) backend; model artifacts are versioned
in Amazon S3.

## Key facts (verified)
- **3 experiments** versioned and compared in MLflow — Logistic Regression, Random Forest,
  XGBoost.
- Class imbalance handled with **SMOTE applied to the training set only** (never the test set), so
  evaluation reflects real-world performance.
- **Threshold optimization** via the precision-recall curve with a minimum-precision constraint of
  0.90, to keep false positives (blocked legitimate transactions) manageable.
- Fully automated lifecycle: CI checks (flake8 + pytest) → training pipeline → Docker build/push
  to GHCR → deploy.

> Framing note: this is deliberately presented as an MLOps engineering project. Raw test-set AUC
> on this dataset is not a meaningful headline (it invites leakage questions); the value is the
> reproducible, automated, deployed pipeline.

## Stack
XGBoost, Random Forest, Logistic Regression, scikit-learn, SMOTE; MLflow (registry + tracking),
FastAPI, Docker / Docker Compose, Nginx, GitHub Actions CI/CD, AWS EC2 · S3 · RDS (PostgreSQL),
GHCR.

## Links
- GitHub: https://github.com/GodVilan/Real-Time-CCFDS-With-MLOPs
