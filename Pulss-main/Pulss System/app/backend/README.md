# Pulss backend (FastAPI, Clean Architecture stub)

## Structure
```
backend/
  __init__.py              # package marker (optional)
  main.py                  # Entry point; boots create_fastapi_app
  app.py                   # DI bootstrap + FastAPI app factory
  api.py                   # Routers (clients/tasks/pulse-responses/ai/director-board/health)
  domain.py                # Entities/value objects
  services.py              # Use cases / application services
  infrastructure.py        # In-memory adapters + seed data
  utils.py                 # ID/token helpers
  requirements.txt
  README.md
```

## Setup
```bash
cd "Pulss System/app/backend"
python -m venv .venv
. .venv/Scripts/Activate.ps1   # PowerShell
pip install -r requirements.txt
```

## Run locally
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Health: `GET /api/health`
- Clients: `GET /api/clients`, `POST /api/clients`, `PUT /api/clients/{id}`
- Pulse link: `POST /api/clients/{id}/pulse-link`
- Pulse responses: `POST /api/pulse-responses` (token-based)
- Tasks: `GET /api/clients/{id}/tasks`, `POST /api/clients/{id}/tasks`, `PUT /api/tasks/{task_id}`
- Director board: `GET /api/director-board/clients`
- AI suggestions (stub): `GET/POST /api/clients/{id}/ai-suggestions`

## SNS marketing news (n8n)
- n8n webhookでマーケティングニュースを取得し、SNSニュースAPIから返却します。
- 必須: `.env` に `N8N_NEWS_WEBHOOK_URL=http://localhost:5678/webhook/sns-marketing-news`
- 任意: `N8N_NEWS_CACHE_TTL` (秒, デフォルト1800) でキャッシュTTLを変更できます。
- 将来のためのAPIキー認証プレースホルダ: `N8N_NEWS_API_KEY_HEADER` / `N8N_NEWS_API_KEY` を設定すると該当ヘッダーを付与します（未設定時は送信しません）。
- 取得結果は DB (`sns_news` テーブル) に upsert して保持し、プラットフォーム/業種フィルタは既存の API パラメータで利用できます。

## Notes
- Current adapters are in-memory. Replace implementations in `infrastructure.py` with DB/Redis/etc. as needed.
- Update CORS allowlist in `api.py` (`origins`) before exposure.
- Authentication/authorization is not implemented; add before external access.
