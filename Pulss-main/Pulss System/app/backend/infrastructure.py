from __future__ import annotations

import json
import logging
import sqlite3
import threading
from datetime import datetime
from typing import Dict, List, Optional

from domain import (
    AiDraft,
    AiSuggestion,
    AiSuggestionStatus,
    Client,
    ClientPhase,
    ClientStatus,
    ClientBrief,
    ContactLog,
    ContentPost,
    ContentPostStatus,
    Contract,
    HearingRecord,
    Lead,
    LeadStatus,
    MeetingNote,
    MetricSnapshot,
    Notification,
    PulssChatMessage,
    PulssChatSession,
    PulssLink,
    PulssLinkStatus,
    ScheduleEvent,
    PulseLink,
    PulseResponse,
    SnsNews,
    Task,
    TaskCategory,
    TaskStatus,
    TaskTemplate,
)
from utils import generate_id

logger = logging.getLogger(__name__)


def _utc(dt: datetime) -> str:
    return dt.isoformat()


class Database:
    def __init__(self, path: str = "data.db") -> None:
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.lock = threading.Lock()
        self._ensure_tables()

    def execute(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        """Serialized execute + commit for thread safety."""
        try:
            with self.lock:
                cur = self.conn.execute(sql, params)
                self.conn.commit()
                return cur
        except Exception:
            logger.exception("[pulss] db execute failed; sql=%s param_types=%s", sql, [type(p).__name__ for p in params])
            raise

    def _ensure_tables(self) -> None:
        cur = self.conn.cursor()
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS clients(
                id TEXT PRIMARY KEY,
                name TEXT,
                industry TEXT,
                status TEXT,
                phase TEXT,
                sales_owner TEXT,
                director_owner TEXT,
                slack_url TEXT,
                memo TEXT,
                onboarding_completed_at TEXT,
                last_contact_at TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS tasks(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                title TEXT,
                description TEXT,
                category TEXT,
                status TEXT,
                due_date TEXT,
                completed_at TEXT,
                assignee TEXT,
                source TEXT,
                template_id TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS pulse_links(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                token TEXT UNIQUE,
                expires_at TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS pulse_responses(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                problem TEXT,
                current_sns TEXT,
                target TEXT,
                product_summary TEXT,
                strengths_usp TEXT,
                brand_story TEXT,
                reference_accounts TEXT,
                raw_payload TEXT,
                submitted_at TEXT
            );
            CREATE TABLE IF NOT EXISTS pulss_links(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                token TEXT UNIQUE,
                status TEXT,
                expires_at TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS pulss_chat_sessions(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                status TEXT,
                created_at TEXT,
                finalized_at TEXT,
                final_report TEXT
            );
            CREATE TABLE IF NOT EXISTS pulss_chat_messages(
                id TEXT PRIMARY KEY,
                session_id TEXT,
                role TEXT,
                content TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS ai_drafts(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                type TEXT,
                status TEXT,
                content TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS ai_suggestions(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                type TEXT,
                title TEXT,
                body TEXT,
                status TEXT,
                created_by TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS schedules(
                id TEXT PRIMARY KEY,
                title TEXT,
                start TEXT,
                "end" TEXT,
                type TEXT,
                team TEXT,
                description TEXT
            );
            CREATE TABLE IF NOT EXISTS sns_news(
                id TEXT PRIMARY KEY,
                title TEXT,
                summary TEXT,
                url TEXT,
                platform_tags TEXT,
                industry_tags TEXT,
                source_name TEXT,
                published_at TEXT,
                fetched_at TEXT
            );
            CREATE TABLE IF NOT EXISTS leads(
                id TEXT PRIMARY KEY,
                company_name TEXT,
                industry TEXT,
                source TEXT,
                area TEXT,
                owner TEXT,
                status TEXT,
                score INTEGER,
                expected_mrr INTEGER,
                last_contact_at TEXT,
                memo TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS contact_logs(
                id TEXT PRIMARY KEY,
                lead_id TEXT,
                channel TEXT,
                content TEXT,
                actor TEXT,
                contact_at TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS meetings(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                lead_id TEXT,
                meeting_at TEXT,
                attendees TEXT,
                summary TEXT,
                transcript_url TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS hearings(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                lead_id TEXT,
                data TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS proposals(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                lead_id TEXT,
                title TEXT,
                amount INTEGER,
                status TEXT,
                sent_at TEXT,
                follow_due_at TEXT,
                memo TEXT,
                file_url TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS contracts(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                plan_name TEXT,
                monthly_fee INTEGER,
                start_date TEXT,
                end_date TEXT,
                payment_terms TEXT,
                file_url TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS client_briefs(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                summary_markdown TEXT,
                sections TEXT,
                source_links TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS content_posts(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                title TEXT,
                platform TEXT,
                status TEXT,
                scheduled_date TEXT,
                assignee TEXT,
                reference_url TEXT,
                asset_path TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS metric_snapshots(
                id TEXT PRIMARY KEY,
                client_id TEXT,
                period TEXT,
                metrics TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS notifications(
                id TEXT PRIMARY KEY,
                user TEXT,
                title TEXT,
                body TEXT,
                created_at TEXT,
                read_at TEXT
            );
            """
        )
        self.conn.commit()


class ClientRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list(self) -> List[Client]:
        cur = self.db.conn.execute("SELECT * FROM clients ORDER BY created_at DESC")
        return [self._row_to_client(r) for r in cur.fetchall()]

    def get(self, client_id: str) -> Optional[Client]:
        cur = self.db.conn.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
        row = cur.fetchone()
        return self._row_to_client(row) if row else None

    def upsert(self, client: Client) -> Client:
        self.db.conn.execute(
            """
            INSERT INTO clients(id, name, industry, status, phase, sales_owner, director_owner, slack_url, memo,
            onboarding_completed_at, last_contact_at, created_at, updated_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, industry=excluded.industry, status=excluded.status, phase=excluded.phase,
            sales_owner=excluded.sales_owner, director_owner=excluded.director_owner, slack_url=excluded.slack_url,
            memo=excluded.memo, onboarding_completed_at=excluded.onboarding_completed_at, last_contact_at=excluded.last_contact_at,
            created_at=excluded.created_at, updated_at=excluded.updated_at
            """,
            (
                client.id,
                client.name,
                client.industry,
                client.status.value,
                client.phase.value,
                client.sales_owner,
                client.director_owner,
                client.slack_url,
                client.memo,
                client.onboarding_completed_at.isoformat() if client.onboarding_completed_at else None,
                client.last_contact_at.isoformat() if client.last_contact_at else None,
                _utc(client.created_at),
                _utc(client.updated_at),
            ),
        )
        self.db.conn.commit()
        return client

    def _row_to_client(self, row: sqlite3.Row) -> Client:
        return Client(
            id=row["id"],
            name=row["name"],
            industry=row["industry"],
            status=ClientStatus(row["status"]),
            phase=ClientPhase(row["phase"]),
            sales_owner=row["sales_owner"],
            director_owner=row["director_owner"],
            slack_url=row["slack_url"],
            memo=row["memo"],
            onboarding_completed_at=datetime.fromisoformat(row["onboarding_completed_at"])
            if row["onboarding_completed_at"]
            else None,
            last_contact_at=datetime.fromisoformat(row["last_contact_at"]) if row["last_contact_at"] else None,
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


class PulseResponseRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def add(self, response: PulseResponse) -> PulseResponse:
        self.db.conn.execute(
            """
            INSERT INTO pulse_responses VALUES(?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                response.id,
                response.client_id,
                response.problem,
                response.current_sns,
                response.target,
                response.product_summary,
                response.strengths_usp,
                response.brand_story,
                json.dumps(response.reference_accounts) if response.reference_accounts else None,
                json.dumps(response.raw_payload) if response.raw_payload else None,
                _utc(response.submitted_at),
            ),
        )
        self.db.conn.commit()
        return response

    def list_by_client(self, client_id: str) -> List[PulseResponse]:
        cur = self.db.conn.execute(
            "SELECT * FROM pulse_responses WHERE client_id = ? ORDER BY submitted_at DESC", (client_id,)
        )
        return [self._row_to_response(r) for r in cur.fetchall()]

    def latest_by_client(self, client_id: str) -> Optional[PulseResponse]:
        cur = self.db.conn.execute(
            "SELECT * FROM pulse_responses WHERE client_id = ? ORDER BY submitted_at DESC LIMIT 1",
            (client_id,),
        )
        row = cur.fetchone()
        return self._row_to_response(row) if row else None

    def _row_to_response(self, row: sqlite3.Row) -> PulseResponse:
        return PulseResponse(
            id=row["id"],
            client_id=row["client_id"],
            problem=row["problem"],
            current_sns=row["current_sns"],
            target=row["target"],
            product_summary=row["product_summary"],
            strengths_usp=row["strengths_usp"],
            brand_story=row["brand_story"],
            reference_accounts=json.loads(row["reference_accounts"]) if row["reference_accounts"] else None,
            raw_payload=json.loads(row["raw_payload"]) if row["raw_payload"] else None,
            submitted_at=datetime.fromisoformat(row["submitted_at"]),
        )


class PulseLinkRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def add(self, link: PulseLink) -> PulseLink:
        self.db.conn.execute(
            "INSERT INTO pulse_links VALUES(?,?,?,?,?)",
            (
                link.id,
                link.client_id,
                link.token,
                link.expires_at.isoformat() if link.expires_at else None,
                _utc(link.created_at),
            ),
        )
        self.db.conn.commit()
        return link

    def get_by_token(self, token: str) -> Optional[PulseLink]:
        cur = self.db.conn.execute("SELECT * FROM pulse_links WHERE token = ?", (token,))
        row = cur.fetchone()
        if not row:
            return None
        return PulseLink(
            id=row["id"],
            client_id=row["client_id"],
            token=row["token"],
            expires_at=datetime.fromisoformat(row["expires_at"]) if row["expires_at"] else None,
            created_at=datetime.fromisoformat(row["created_at"]),
        )


class PulssLinkRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def add(self, link: PulssLink) -> PulssLink:
        self.db.conn.execute(
            "INSERT INTO pulss_links VALUES(?,?,?,?,?,?)",
            (
                link.id,
                link.client_id,
                link.token,
                link.status.value,
                link.expires_at.isoformat() if link.expires_at else None,
                _utc(link.created_at),
            ),
        )
        self.db.conn.commit()
        return link

    def get_by_token(self, token: str) -> Optional[PulssLink]:
        cur = self.db.conn.execute("SELECT * FROM pulss_links WHERE token = ?", (token,))
        row = cur.fetchone()
        return self._row(row) if row else None

    def get_active_by_client(self, client_id: str) -> Optional[PulssLink]:
        cur = self.db.conn.execute(
            "SELECT * FROM pulss_links WHERE client_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1",
            (client_id, PulssLinkStatus.ACTIVE.value),
        )
        row = cur.fetchone()
        return self._row(row) if row else None

    def mark_used(self, token: str) -> None:
        params = (PulssLinkStatus.USED.value, token)
        try:
            self.db.execute("UPDATE pulss_links SET status=? WHERE token=?", params)
        except Exception:
            logger.exception("[pulss] mark_used failed; param_types=%s", [type(p).__name__ for p in params])
            raise

    def _row(self, row: sqlite3.Row) -> PulssLink:
        return PulssLink(
            id=row["id"],
            client_id=row["client_id"],
            token=row["token"],
            status=PulssLinkStatus(row["status"]),
            created_at=datetime.fromisoformat(row["created_at"]),
            expires_at=datetime.fromisoformat(row["expires_at"]) if row["expires_at"] else None,
        )


class PulssChatSessionRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def add(self, session: PulssChatSession) -> PulssChatSession:
        params = (
            session.id,
            session.client_id,
            session.status,
            _utc(session.created_at),
            session.finalized_at.isoformat() if session.finalized_at else None,
            session.final_report,
        )
        try:
            self.db.execute("INSERT INTO pulss_chat_sessions VALUES(?,?,?,?,?,?)", params)
        except Exception:
            logger.exception("[pulss] session add failed; param_types=%s", [type(p).__name__ for p in params])
            raise
        return session

    def get(self, session_id: str) -> Optional[PulssChatSession]:
        cur = self.db.conn.execute("SELECT * FROM pulss_chat_sessions WHERE id = ?", (session_id,))
        row = cur.fetchone()
        return self._row(row) if row else None

    def update(self, session_id: str, **kwargs) -> Optional[PulssChatSession]:
        session = self.get(session_id)
        if not session:
            return None
        for k, v in kwargs.items():
            if hasattr(session, k) and v is not None:
                setattr(session, k, v)
        self.db.conn.execute(
            "UPDATE pulss_chat_sessions SET status=?, finalized_at=?, final_report=? WHERE id=?",
            (
                session.status,
                session.finalized_at.isoformat() if session.finalized_at else None,
                session.final_report,
                session_id,
            ),
        )
        self.db.conn.commit()
        return session

    def _row(self, row: sqlite3.Row) -> PulssChatSession:
        return PulssChatSession(
            id=row["id"],
            client_id=row["client_id"],
            status=row["status"],
            created_at=datetime.fromisoformat(row["created_at"]),
            finalized_at=datetime.fromisoformat(row["finalized_at"]) if row["finalized_at"] else None,
            final_report=row["final_report"],
        )


class PulssChatMessageRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def add(self, message: PulssChatMessage) -> PulssChatMessage:
        self.db.conn.execute(
            "INSERT INTO pulss_chat_messages VALUES(?,?,?,?,?)",
            (message.id, message.session_id, message.role, message.content, _utc(message.created_at)),
        )
        self.db.conn.commit()
        return message

    def list_for_session(self, session_id: str) -> List[PulssChatMessage]:
        cur = self.db.conn.execute(
            "SELECT * FROM pulss_chat_messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,)
        )
        return [self._row(r) for r in cur.fetchall()]

    def _row(self, row: sqlite3.Row) -> PulssChatMessage:
        return PulssChatMessage(
            id=row["id"],
            session_id=row["session_id"],
            role=row["role"],
            content=row["content"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )


class AiDraftRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def add(self, draft: AiDraft) -> AiDraft:
        self.db.conn.execute(
            "INSERT INTO ai_drafts VALUES(?,?,?,?,?,?,?)",
            (
                draft.id,
                draft.client_id,
                draft.type,
                draft.status,
                draft.content,
                _utc(draft.created_at),
                _utc(draft.updated_at),
            ),
        )
        self.db.conn.commit()
        return draft

    def list_for_client(self, client_id: str) -> List[AiDraft]:
        cur = self.db.conn.execute("SELECT * FROM ai_drafts WHERE client_id=? ORDER BY created_at DESC", (client_id,))
        return [self._row(r) for r in cur.fetchall()]

    def _row(self, row: sqlite3.Row) -> AiDraft:
        return AiDraft(
            id=row["id"],
            client_id=row["client_id"],
            type=row["type"],
            status=row["status"],
            content=row["content"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


class TaskTemplateRepository:
    def __init__(self) -> None:
        self._items: Dict[str, TaskTemplate] = {}

    def add(self, template: TaskTemplate) -> TaskTemplate:
        self._items[template.id] = template
        return template

    def active_onboarding(self) -> List[TaskTemplate]:
        return sorted(
            [t for t in self._items.values() if t.is_active and t.category == TaskCategory.ONBOARDING],
            key=lambda t: t.sort_order,
        )


class TaskRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list_by_client(self, client_id: str, category: Optional[TaskCategory] = None) -> List[Task]:
        sql = "SELECT * FROM tasks WHERE client_id = ?"
        params: List = [client_id]
        if category:
            sql += " AND category = ?"
            params.append(category.value)
        sql += " ORDER BY COALESCE(due_date,'9999-12-31'), created_at"
        cur = self.db.conn.execute(sql, params)
        return [self._row_to_task(r) for r in cur.fetchall()]

    def get(self, task_id: str) -> Optional[Task]:
        cur = self.db.conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cur.fetchone()
        return self._row_to_task(row) if row else None

    def add(self, task: Task) -> Task:
        if not task.id:
            task.id = generate_id()
        self.db.conn.execute(
            """
            INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                task.id,
                task.client_id,
                task.title,
                task.description,
                task.category.value,
                task.status.value,
                task.due_date.isoformat() if task.due_date else None,
                task.completed_at.isoformat() if task.completed_at else None,
                task.assignee,
                task.source,
                task.template_id,
                _utc(task.created_at),
                _utc(task.updated_at),
            ),
        )
        self.db.conn.commit()
        return task

    def update(self, task_id: str, **kwargs) -> Optional[Task]:
        task = self.get(task_id)
        if not task:
            return None
        for key, value in kwargs.items():
            if hasattr(task, key) and value is not None:
                setattr(task, key, value)
        task.updated_at = datetime.utcnow()
        if task.status == TaskStatus.DONE and not task.completed_at:
            task.completed_at = datetime.utcnow()
        self.db.conn.execute(
            """
            UPDATE tasks SET title=?, description=?, category=?, status=?, due_date=?, completed_at=?, assignee=?, source=?, template_id=?, updated_at=?
            WHERE id=?
            """,
            (
                task.title,
                task.description,
                task.category.value,
                task.status.value,
                task.due_date.isoformat() if task.due_date else None,
                task.completed_at.isoformat() if task.completed_at else None,
                task.assignee,
                task.source,
                task.template_id,
                _utc(task.updated_at),
                task_id,
            ),
        )
        self.db.conn.commit()
        return task

    def _row_to_task(self, row: sqlite3.Row) -> Task:
        return Task(
            id=row["id"],
            client_id=row["client_id"],
            title=row["title"],
            description=row["description"],
            category=TaskCategory(row["category"]),
            status=TaskStatus(row["status"]),
            due_date=datetime.fromisoformat(row["due_date"]).date() if row["due_date"] else None,
            completed_at=datetime.fromisoformat(row["completed_at"]) if row["completed_at"] else None,
            assignee=row["assignee"],
            source=row["source"],
            template_id=row["template_id"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


class AiSuggestionRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list_by_client(self, client_id: str) -> List[AiSuggestion]:
        cur = self.db.conn.execute(
            "SELECT * FROM ai_suggestions WHERE client_id = ? ORDER BY created_at DESC", (client_id,)
        )
        return [self._row_to_ai(r) for r in cur.fetchall()]

    def add(self, suggestion: AiSuggestion) -> AiSuggestion:
        self.db.conn.execute(
            "INSERT INTO ai_suggestions VALUES(?,?,?,?,?,?,?,?,?)",
            (
                suggestion.id,
                suggestion.client_id,
                suggestion.type,
                suggestion.title,
                suggestion.body,
                suggestion.status.value,
                suggestion.created_by,
                _utc(suggestion.created_at),
                _utc(suggestion.updated_at),
            ),
        )
        self.db.conn.commit()
        return suggestion

    def _row_to_ai(self, row: sqlite3.Row) -> AiSuggestion:
        return AiSuggestion(
            id=row["id"],
            client_id=row["client_id"],
            type=row["type"],
            title=row["title"],
            body=row["body"],
            status=AiSuggestionStatus(row["status"]),
            created_by=row["created_by"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


class ScheduleRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list(self, date: Optional[str] = None, team: Optional[str] = None) -> List[ScheduleEvent]:
        sql = "SELECT * FROM schedules WHERE 1=1"
        params: List = []
        if date:
            sql += " AND DATE(start) = DATE(?)"
            params.append(date)
        if team:
            sql += " AND team = ?"
            params.append(team)
        sql += " ORDER BY start"
        cur = self.db.conn.execute(sql, params)
        return [self._row_to_event(r) for r in cur.fetchall()]

    def add(self, event: ScheduleEvent) -> ScheduleEvent:
        if not event.id:
            event.id = generate_id()
        self.db.conn.execute(
            "INSERT INTO schedules VALUES(?,?,?,?,?,?,?)",
            (
                event.id,
                event.title,
                _utc(event.start),
                _utc(event.end),
                event.type,
                event.team,
                event.description,
            ),
        )
        self.db.conn.commit()
        return event

    def update(self, event_id: str, payload: dict) -> Optional[ScheduleEvent]:
        event = self.get(event_id)
        if not event:
            return None
        for key, val in payload.items():
            if hasattr(event, key) and val is not None:
                setattr(event, key, val)
        self.db.conn.execute(
            """
            UPDATE schedules SET title=?, start=?, "end"=?, type=?, team=?, description=? WHERE id=?
            """,
            (event.title, _utc(event.start), _utc(event.end), event.type, event.team, event.description, event_id),
        )
        self.db.conn.commit()
        return event

    def delete(self, event_id: str) -> None:
        self.db.conn.execute("DELETE FROM schedules WHERE id = ?", (event_id,))
        self.db.conn.commit()

    def get(self, event_id: str) -> Optional[ScheduleEvent]:
        cur = self.db.conn.execute("SELECT * FROM schedules WHERE id = ?", (event_id,))
        row = cur.fetchone()
        return self._row_to_event(row) if row else None

    def _row_to_event(self, row: sqlite3.Row) -> ScheduleEvent:
        return ScheduleEvent(
            id=row["id"],
            title=row["title"],
            start=datetime.fromisoformat(row["start"]),
            end=datetime.fromisoformat(row["end"]),
            type=row["type"],
            team=row["team"],
            description=row["description"],
        )


class SnsNewsRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list(self, platform: Optional[str] = None, industry: Optional[str] = None, limit: int = 30) -> List[SnsNews]:
        sql = "SELECT * FROM sns_news WHERE 1=1"
        params: List = []
        if platform and platform != "all":
            sql += " AND platform_tags LIKE ?"
            params.append(f"%{platform}%")
        if industry and industry != "all":
            sql += " AND industry_tags LIKE ?"
            params.append(f"%{industry}%")
        sql += " ORDER BY published_at DESC LIMIT ?"
        params.append(limit)
        cur = self.db.conn.execute(sql, params)
        rows = cur.fetchall()
        return [self._row_to_news(r) for r in rows]

    def add_many(self, items: List[SnsNews]) -> None:
        for item in items:
            self.db.conn.execute(
                "INSERT OR REPLACE INTO sns_news VALUES(?,?,?,?,?,?,?,?,?)",
                (
                    item.id,
                    item.title,
                    item.summary,
                    item.url,
                    json.dumps(item.platform_tags),
                    json.dumps(item.industry_tags),
                    item.source_name,
                    _utc(item.published_at),
                    _utc(item.fetched_at),
                ),
            )
        self.db.conn.commit()

    def _row_to_news(self, row: sqlite3.Row) -> SnsNews:
        return SnsNews(
            id=row["id"],
            title=row["title"],
            summary=row["summary"],
            url=row["url"],
            platform_tags=json.loads(row["platform_tags"]),
            industry_tags=json.loads(row["industry_tags"]),
            source_name=row["source_name"],
            published_at=datetime.fromisoformat(row["published_at"]),
            fetched_at=datetime.fromisoformat(row["fetched_at"]),
        )


class LeadRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list(self) -> List[Lead]:
        cur = self.db.conn.execute("SELECT * FROM leads ORDER BY updated_at DESC")
        return [self._row(r) for r in cur.fetchall()]

    def add(self, lead: Lead) -> Lead:
        self.db.conn.execute(
            """
            INSERT INTO leads VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                lead.id,
                lead.company_name,
                lead.industry,
                lead.source,
                lead.area,
                lead.owner,
                lead.status.value,
                lead.score,
                lead.expected_mrr,
                lead.last_contact_at.isoformat() if lead.last_contact_at else None,
                lead.memo,
                _utc(lead.created_at),
                _utc(lead.updated_at),
            ),
        )
        self.db.conn.commit()
        return lead

    def update(self, lead_id: str, payload: dict) -> Optional[Lead]:
        lead = self.get(lead_id)
        if not lead:
            return None
        for k, v in payload.items():
            if hasattr(lead, k) and v is not None:
                setattr(lead, k, v)
        lead.updated_at = datetime.utcnow()
        self.db.conn.execute(
            """
            UPDATE leads SET company_name=?, industry=?, source=?, area=?, owner=?, status=?, score=?, expected_mrr=?, last_contact_at=?, memo=?, updated_at=? WHERE id=?
            """,
            (
                lead.company_name,
                lead.industry,
                lead.source,
                lead.area,
                lead.owner,
                lead.status.value,
                lead.score,
                lead.expected_mrr,
                lead.last_contact_at.isoformat() if lead.last_contact_at else None,
                lead.memo,
                _utc(lead.updated_at),
                lead_id,
            ),
        )
        self.db.conn.commit()
        return lead

    def get(self, lead_id: str) -> Optional[Lead]:
        cur = self.db.conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
        row = cur.fetchone()
        return self._row(row) if row else None

    def _row(self, row: sqlite3.Row) -> Lead:
        return Lead(
            id=row["id"],
            company_name=row["company_name"],
            industry=row["industry"],
            source=row["source"],
            area=row["area"],
            owner=row["owner"],
            status=LeadStatus(row["status"]),
            score=row["score"],
            expected_mrr=row["expected_mrr"],
            last_contact_at=datetime.fromisoformat(row["last_contact_at"]) if row["last_contact_at"] else None,
            memo=row["memo"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


class ContactLogRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list(self, lead_id: str) -> List[ContactLog]:
        cur = self.db.conn.execute("SELECT * FROM contact_logs WHERE lead_id = ? ORDER BY contact_at DESC", (lead_id,))
        return [self._row(r) for r in cur.fetchall()]

    def add(self, log: ContactLog) -> ContactLog:
        self.db.conn.execute(
            "INSERT INTO contact_logs VALUES(?,?,?,?,?,?,?)",
            (
                log.id,
                log.lead_id,
                log.channel,
                log.content,
                log.actor,
                _utc(log.contact_at),
                _utc(log.created_at),
            ),
        )
        self.db.conn.commit()
        return log

    def _row(self, row: sqlite3.Row) -> ContactLog:
        return ContactLog(
            id=row["id"],
            lead_id=row["lead_id"],
            channel=row["channel"],
            content=row["content"],
            actor=row["actor"],
            contact_at=datetime.fromisoformat(row["contact_at"]),
            created_at=datetime.fromisoformat(row["created_at"]),
        )


class ProposalRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list_for_client(self, client_id: str) -> List[Proposal]:
        cur = self.db.conn.execute(
            "SELECT * FROM proposals WHERE client_id = ? ORDER BY updated_at DESC", (client_id,)
        )
        return [self._row(r) for r in cur.fetchall()]

    def add(self, proposal: Proposal) -> Proposal:
        if not proposal.id:
            proposal.id = generate_id()
        self.db.conn.execute(
            """
            INSERT INTO proposals VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                proposal.id,
                proposal.client_id,
                proposal.lead_id,
                proposal.title,
                proposal.amount,
                proposal.status.value,
                proposal.sent_at.isoformat() if proposal.sent_at else None,
                proposal.follow_due_at.isoformat() if proposal.follow_due_at else None,
                proposal.memo,
                proposal.file_url,
                _utc(proposal.created_at),
                _utc(proposal.updated_at),
            ),
        )
        self.db.conn.commit()
        return proposal

    def update(self, proposal_id: str, payload: dict) -> Optional[Proposal]:
        proposal = self.get(proposal_id)
        if not proposal:
            return None
        for k, v in payload.items():
            if hasattr(proposal, k) and v is not None:
                setattr(proposal, k, v)
        proposal.updated_at = datetime.utcnow()
        self.db.conn.execute(
            """
            UPDATE proposals SET title=?, amount=?, status=?, sent_at=?, follow_due_at=?, memo=?, file_url=?, updated_at=? WHERE id=?
            """,
            (
                proposal.title,
                proposal.amount,
                proposal.status.value,
                proposal.sent_at.isoformat() if proposal.sent_at else None,
                proposal.follow_due_at.isoformat() if proposal.follow_due_at else None,
                proposal.memo,
                proposal.file_url,
                _utc(proposal.updated_at),
                proposal_id,
            ),
        )
        self.db.conn.commit()
        return proposal

    def get(self, proposal_id: str) -> Optional[Proposal]:
        cur = self.db.conn.execute("SELECT * FROM proposals WHERE id = ?", (proposal_id,))
        row = cur.fetchone()
        return self._row(row) if row else None

    def _row(self, row: sqlite3.Row) -> Proposal:
        return Proposal(
            id=row["id"],
            client_id=row["client_id"],
            lead_id=row["lead_id"],
            title=row["title"],
            amount=row["amount"],
            status=ProposalStatus(row["status"]),
            sent_at=datetime.fromisoformat(row["sent_at"]) if row["sent_at"] else None,
            follow_due_at=datetime.fromisoformat(row["follow_due_at"]) if row["follow_due_at"] else None,
            memo=row["memo"],
            file_url=row["file_url"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


class ContractRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list_for_client(self, client_id: str) -> List[Contract]:
        cur = self.db.conn.execute("SELECT * FROM contracts WHERE client_id = ? ORDER BY created_at DESC", (client_id,))
        return [self._row(r) for r in cur.fetchall()]

    def add(self, contract: Contract) -> Contract:
        if not contract.id:
            contract.id = generate_id()
        self.db.conn.execute(
            """
            INSERT INTO contracts VALUES(?,?,?,?,?,?,?,?,?,?)
            """,
            (
                contract.id,
                contract.client_id,
                contract.plan_name,
                contract.monthly_fee,
                contract.start_date.isoformat() if contract.start_date else None,
                contract.end_date.isoformat() if contract.end_date else None,
                contract.payment_terms,
                contract.file_url,
                _utc(contract.created_at),
                _utc(contract.updated_at),
            ),
        )
        self.db.conn.commit()
        return contract

    def _row(self, row: sqlite3.Row) -> Contract:
        return Contract(
            id=row["id"],
            client_id=row["client_id"],
            plan_name=row["plan_name"],
            monthly_fee=row["monthly_fee"],
            start_date=datetime.fromisoformat(row["start_date"]).date() if row["start_date"] else None,
            end_date=datetime.fromisoformat(row["end_date"]).date() if row["end_date"] else None,
            payment_terms=row["payment_terms"],
            file_url=row["file_url"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


class ClientBriefRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def upsert(self, brief: ClientBrief) -> ClientBrief:
        self.db.conn.execute(
            """
            INSERT INTO client_briefs VALUES(?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET summary_markdown=excluded.summary_markdown, sections=excluded.sections, source_links=excluded.source_links, updated_at=excluded.updated_at
            """,
            (
                brief.id,
                brief.client_id,
                brief.summary_markdown,
                json.dumps(brief.sections),
                json.dumps(brief.source_links),
                _utc(brief.created_at),
                _utc(brief.updated_at),
            ),
        )
        self.db.conn.commit()
        return brief

    def get_by_client(self, client_id: str) -> Optional[ClientBrief]:
        cur = self.db.conn.execute("SELECT * FROM client_briefs WHERE client_id = ? ORDER BY updated_at DESC LIMIT 1", (client_id,))
        row = cur.fetchone()
        return self._row(row) if row else None

    def _row(self, row: sqlite3.Row) -> ClientBrief:
        return ClientBrief(
            id=row["id"],
            client_id=row["client_id"],
            summary_markdown=row["summary_markdown"],
            sections=json.loads(row["sections"]),
            source_links=json.loads(row["source_links"]),
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


class ContentPostRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list_for_client(self, client_id: str) -> List[ContentPost]:
        cur = self.db.conn.execute(
            "SELECT * FROM content_posts WHERE client_id = ? ORDER BY scheduled_date", (client_id,)
        )
        return [self._row(r) for r in cur.fetchall()]

    def add(self, post: ContentPost) -> ContentPost:
        if not post.id:
            post.id = generate_id()
        self.db.conn.execute(
            """
            INSERT INTO content_posts VALUES(?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                post.id,
                post.client_id,
                post.title,
                post.platform,
                post.status.value,
                post.scheduled_date.isoformat() if post.scheduled_date else None,
                post.assignee,
                post.reference_url,
                post.asset_path,
                _utc(post.created_at),
                _utc(post.updated_at),
            ),
        )
        self.db.conn.commit()
        return post

    def update(self, post_id: str, payload: dict) -> Optional[ContentPost]:
        post = self.get(post_id)
        if not post:
            return None
        for k, v in payload.items():
            if hasattr(post, k) and v is not None:
                setattr(post, k, v)
        post.updated_at = datetime.utcnow()
        self.db.conn.execute(
            """
            UPDATE content_posts SET title=?, platform=?, status=?, scheduled_date=?, assignee=?, reference_url=?, asset_path=?, updated_at=? WHERE id=?
            """,
            (
                post.title,
                post.platform,
                post.status.value,
                post.scheduled_date.isoformat() if post.scheduled_date else None,
                post.assignee,
                post.reference_url,
                post.asset_path,
                _utc(post.updated_at),
                post_id,
            ),
        )
        self.db.conn.commit()
        return post

    def get(self, post_id: str) -> Optional[ContentPost]:
        cur = self.db.conn.execute("SELECT * FROM content_posts WHERE id = ?", (post_id,))
        row = cur.fetchone()
        return self._row(row) if row else None

    def _row(self, row: sqlite3.Row) -> ContentPost:
        return ContentPost(
            id=row["id"],
            client_id=row["client_id"],
            title=row["title"],
            platform=row["platform"],
            status=ContentPostStatus(row["status"]),
            scheduled_date=datetime.fromisoformat(row["scheduled_date"]).date() if row["scheduled_date"] else None,
            assignee=row["assignee"],
            reference_url=row["reference_url"],
            asset_path=row["asset_path"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


class MetricSnapshotRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list_for_client(self, client_id: str) -> List[MetricSnapshot]:
        cur = self.db.conn.execute(
            "SELECT * FROM metric_snapshots WHERE client_id = ? ORDER BY period DESC", (client_id,)
        )
        return [self._row(r) for r in cur.fetchall()]

    def add(self, snap: MetricSnapshot) -> MetricSnapshot:
        self.db.conn.execute(
            "INSERT INTO metric_snapshots VALUES(?,?,?, ?,?)",
            (
                snap.id,
                snap.client_id,
                snap.period,
                json.dumps(snap.metrics),
                _utc(snap.created_at),
            ),
        )
        self.db.conn.commit()
        return snap

    def _row(self, row: sqlite3.Row) -> MetricSnapshot:
        return MetricSnapshot(
            id=row["id"],
            client_id=row["client_id"],
            period=row["period"],
            metrics=json.loads(row["metrics"]),
            created_at=datetime.fromisoformat(row["created_at"]),
        )


class NotificationRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list_for_user(self, user: str) -> List[Notification]:
        cur = self.db.conn.execute(
            "SELECT * FROM notifications WHERE user = ? ORDER BY created_at DESC", (user,)
        )
        return [self._row(r) for r in cur.fetchall()]

    def add(self, n: Notification) -> Notification:
        self.db.conn.execute(
            "INSERT INTO notifications VALUES(?,?,?,?,?,?)",
            (n.id, n.user, n.title, n.body, _utc(n.created_at), n.read_at.isoformat() if n.read_at else None),
        )
        self.db.conn.commit()
        return n

    def mark_read(self, notification_id: str) -> Optional[Notification]:
        cur = self.db.conn.execute("SELECT * FROM notifications WHERE id = ?", (notification_id,))
        row = cur.fetchone()
        if not row:
            return None
        read_at = datetime.utcnow()
        self.db.conn.execute("UPDATE notifications SET read_at=? WHERE id=?", (_utc(read_at), notification_id))
        self.db.conn.commit()
        n = self._row(row)
        n.read_at = read_at
        return n

    def _row(self, row: sqlite3.Row) -> Notification:
        return Notification(
            id=row["id"],
            user=row["user"],
            title=row["title"],
            body=row["body"],
            created_at=datetime.fromisoformat(row["created_at"]),
            read_at=datetime.fromisoformat(row["read_at"]) if row["read_at"] else None,
        )


def seed_data(
    client_repo: ClientRepository,
    template_repo: TaskTemplateRepository,
    task_repo: TaskRepository,
) -> None:
    # Seed only when empty
    if client_repo.list():
        return
    now = datetime.utcnow()
    templates = [
        TaskTemplate(
            id=generate_id(),
            name="アカウント情報取得",
            category=TaskCategory.ONBOARDING,
            default_offset_days=2,
            default_assignee_role="sales",
            sort_order=1,
            created_at=now,
            updated_at=now,
        ),
        TaskTemplate(
            id=generate_id(),
            name="ブランド素材の受領",
            category=TaskCategory.ONBOARDING,
            default_offset_days=3,
            default_assignee_role="director",
            sort_order=2,
            created_at=now,
            updated_at=now,
        ),
        TaskTemplate(
            id=generate_id(),
            name="初回撮影日ドラフト",
            category=TaskCategory.ONBOARDING,
            default_offset_days=5,
            default_assignee_role="director",
            sort_order=3,
            created_at=now,
            updated_at=now,
        ),
        TaskTemplate(
            id=generate_id(),
            name="KPI目標の確定",
            category=TaskCategory.ONBOARDING,
            default_offset_days=7,
            default_assignee_role="sales",
            sort_order=4,
            created_at=now,
            updated_at=now,
        ),
    ]
    for t in templates:
        template_repo.add(t)

    sample_clients = [
        Client(
            id="1",
            name="焼肉ドブン東京",
            industry="飲食",
            status=ClientStatus.CONTRACTED,
            phase=ClientPhase.OPERATION,
            sales_owner="田中 健",
            director_owner="佐藤 恵",
            slack_url="https://slack.com/archives/C123456",
            memo="来年はフランチャイズ展開を検討中。",
            onboarding_completed_at=None,
            last_contact_at=now,
            created_at=now,
            updated_at=now,
        ),
        Client(
            id="2",
            name="Luminous Beauty Salon",
            industry="美容",
            status=ClientStatus.PRE_CONTRACT,
            phase=ClientPhase.PROPOSAL,
            sales_owner="鈴木 一郎",
            director_owner=None,
            slack_url=None,
            memo="予算感のすり合わせ中。ROIを示した提案が必要。",
            onboarding_completed_at=None,
            last_contact_at=None,
            created_at=now,
            updated_at=now,
        ),
    ]
    for c in sample_clients:
        client_repo.upsert(c)

    for c in sample_clients:
        if c.status == ClientStatus.CONTRACTED:
            for tmpl in template_repo.active_onboarding():
                task_repo.add(tmpl.to_task(client_id=c.id, assignee=tmpl.default_assignee_role))
