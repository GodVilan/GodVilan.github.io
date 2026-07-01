# US COVID-19 Mortality Forecasting System

## One-line
A production-grade epidemiological forecasting pipeline — from live Johns Hopkins data ingestion
through multi-model benchmarking to an interactive dashboard — for short-term US mortality
forecasting.

## What it does
Pulls the authoritative JHU COVID-19 time-series live, reshapes wide→long, cleans it (negative
revision clipping, cumulative→daily deltas, temporal sort), and engineers **6 time-series
features** (lags, rolling statistics, calendar encodings). It benchmarks **SARIMAX, Prophet, and
XGBoost** under identical conditions — 30-day holdout plus 5-fold rolling cross-validation — and
serves a Plotly Dash dashboard with 30-day forecasts and 95% confidence bands, Dockerized and
deployed on Render.

## Key metrics (verified)
- **Seasonal SARIMAX (1,1,1)(1,1,1,7)** was selected, with **Holdout MAE 138.14** and **CV MAE
  137.86** — the near-identical gap confirms low overfitting and strong generalization.
- Built on **3,300+ records**; Prophet and XGBoost both scored higher (worse) MAE.

## Why SARIMAX won
Weekly seasonality in mortality data is structural, not a learned pattern; SARIMAX's explicit
seasonal differencing captures it directly, beating Prophet's additive decomposition and
XGBoost's lag-based approximation.

## Stack
Statsmodels (SARIMAX), Prophet, XGBoost, scikit-learn, Pandas, NumPy; Plotly + Dash;
Docker; deployed on Render.

## Links
- GitHub: https://github.com/GodVilan/US-COVID-19-Mortality-Intelligence-Forecasting-System
- Live dashboard: https://us-covid-19-mortality-intelligence.onrender.com/
