# OpenClaw + Gemma 4 VPS Framework

This framework wires **OpenClaw** to a self-hosted **Gemma 4** backend on a VPS by using a stable OpenAI-compatible layer:

1. **vLLM** serves Gemma on `/v1`.
2. **LiteLLM** exposes a consistent model alias (`gemma-4`) and key management.
3. **OpenClaw** points to LiteLLM exactly like any OpenAI API provider.

## Why this layout

- OpenClaw usually expects OpenAI-style settings (`OPENAI_API_BASE`, `OPENAI_API_KEY`, `OPENAI_MODEL`).
- Gemma self-hosting runtimes can differ over time.
- LiteLLM lets you swap runtimes/models without changing OpenClaw config.

## Prerequisites

- Ubuntu VPS with Docker + Docker Compose plugin installed.
- NVIDIA GPU + NVIDIA Container Toolkit.
- Hugging Face token that can pull Gemma weights.

## Quick start

```bash
cd openclaw-gemma-framework
cp .env.example .env
# edit .env with your secrets
./scripts/deploy.sh
```

OpenClaw UI/API will be on `http://<your-vps-ip>:3000`.
LiteLLM OpenAI endpoint will be on `http://<your-vps-ip>:4000/v1`.

## OpenClaw runtime variables

If you are running OpenClaw outside this compose stack, set:

```bash
OPENAI_API_BASE=http://<vps-ip>:4000/v1
OPENAI_API_KEY=<your LITELLM_MASTER_KEY>
OPENAI_MODEL=gemma-4
```

## Operational notes

- If `google/gemma-4-27b-it` is unavailable in your environment, set `MODEL_ID` to another Gemma checkpoint.
- To update model routing, edit `configs/litellm-config.yaml`.
- Persisted model cache lives in `openclaw-gemma-framework/data/hf-cache`.
