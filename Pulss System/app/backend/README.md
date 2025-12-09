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

## Notes
- Current adapters are in-memory. Replace implementations in `infrastructure.py` with DB/Redis/etc. as needed.
- Update CORS allowlist in `api.py` (`origins`) before exposure.
- Authentication/authorization is not implemented; add before external access.
