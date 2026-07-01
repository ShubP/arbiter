# Deploying Arbiter on Alibaba Cloud

Arbiter's backend is designed to run on **Alibaba Cloud ECS** and reaches Qwen
through **Alibaba Cloud DashScope**. Both services are containerized, so a single
`docker compose up` brings the whole app online.

## Proof of Alibaba Cloud usage

- The backend runs on an **Alibaba Cloud ECS** instance (see steps below).
- It calls **Alibaba Cloud DashScope** (Qwen) via the OpenAI-compatible endpoint.
  The integration lives in [`backend/src/arbiter/llm.py`](../backend/src/arbiter/llm.py),
  which points the client at `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`.

## 1. Provision an ECS instance

1. In the Alibaba Cloud console, create an **ECS** instance (Ubuntu 22.04, 2 vCPU /
   4 GB is plenty).
2. In its **security group**, allow inbound TCP on `3000` (frontend) and `8000`
   (backend) — or `80`/`443` if you front it with a reverse proxy.
3. SSH in and install Docker + the compose plugin:

   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

## 2. Configure and run

```bash
git clone https://github.com/ShubP/arbiter.git
cd arbiter

# Alibaba Cloud DashScope key (from the DashScope console)
export DASHSCOPE_API_KEY=sk-your-key

# Point the frontend at the instance's public address
export NEXT_PUBLIC_API_URL=http://<ECS_PUBLIC_IP>:8000

docker compose up -d --build
```

The frontend is now at `http://<ECS_PUBLIC_IP>:3000` and the API at
`http://<ECS_PUBLIC_IP>:8000` (`/health`, `/presets`, `/negotiate`).

## 3. Verify

```bash
curl http://<ECS_PUBLIC_IP>:8000/health        # {"status":"ok"}
curl http://<ECS_PUBLIC_IP>:8000/presets        # the preset disputes
```

## Notes

- Without `DASHSCOPE_API_KEY`, the deterministic negotiation director still runs
  end-to-end — Qwen only enriches the advocates' language and powers NL intake.
- For a single public port, put Nginx in front and proxy `/` → frontend and
  `/api` → backend; remember SSE needs buffering disabled
  (`proxy_buffering off;`).
