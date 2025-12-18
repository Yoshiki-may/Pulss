from __future__ import annotations

import logging
import os
from pathlib import Path
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv

DOTENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=DOTENV_PATH, override=True)

LOG_DIR = Path(__file__).resolve().parents[2] / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "pulss-backend.log"
formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(name)s - %(message)s")
handlers = [
    logging.StreamHandler(),
    RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"),
]
logging.basicConfig(level=logging.INFO, handlers=handlers, format=formatter._fmt, force=True)

logger = logging.getLogger(__name__)
api_key = os.getenv("OPENAI_API_KEY")
model_name = os.getenv("PULSS_OPENAI_MODEL")
logger.info("[pulss] dotenv path=%s", DOTENV_PATH)
logger.info("[pulss] OPENAI_API_KEY exists=%s key_len=%s model=%s", bool(api_key), len(api_key) if api_key else 0, model_name)

from app import create_fastapi_app

app = create_fastapi_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
