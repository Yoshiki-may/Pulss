from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx


class N8nNewsClient:
    """Lightweight client to fetch marketing news from n8n webhook."""

    def __init__(self) -> None:
        self.url = os.getenv("N8N_NEWS_WEBHOOK_URL")
        self.api_key_header = os.getenv("N8N_NEWS_API_KEY_HEADER")
        self.api_key = os.getenv("N8N_NEWS_API_KEY")
        self.timeout = 10.0

    def fetch_news(self) -> List[Dict[str, Any]]:
        if not self.url:
            # Environment not configured; skip quietly.
            return []

        headers: Optional[Dict[str, str]] = None
        if self.api_key_header and self.api_key:
            headers = {self.api_key_header: self.api_key}

        try:
            resp = httpx.get(self.url, headers=headers, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            if not isinstance(data, list):
                return []
            return data
        except Exception as e:  # noqa: BLE001
            # Logging is intentionally minimal; upstream caller can decide fallback.
            print(f"[n8n] fetch_news failed: {e}")
            return []

