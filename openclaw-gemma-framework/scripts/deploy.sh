#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "[ERROR] Missing .env file. Copy .env.example to .env and fill secrets first."
  exit 1
fi

echo "[INFO] Starting Gemma runtime + LiteLLM + OpenClaw..."
docker compose --env-file .env up -d --remove-orphans

echo "[INFO] Waiting for LiteLLM health endpoint..."
for _ in {1..40}; do
  if curl -fsS http://localhost:4000/health >/dev/null; then
    echo "[OK] LiteLLM is healthy"
    break
  fi
  sleep 3
done

echo "[INFO] Running a short completion check through the OpenAI-compatible endpoint"
curl -sS http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma-4",
    "messages": [
      {"role":"system","content":"You are concise."},
      {"role":"user","content":"Respond with: Gemma link is healthy"}
    ],
    "temperature": 0.0
  }' | jq -r '.choices[0].message.content // .error'
