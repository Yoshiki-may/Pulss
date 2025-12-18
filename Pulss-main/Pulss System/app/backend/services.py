from __future__ import annotations

import os
import uuid
import secrets
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

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
    Proposal,
    ProposalStatus,
    ScheduleEvent,
    PulssChatMessage,
    PulssChatSession,
    PulssLink,
    PulssLinkStatus,
    PulseLink,
    PulseResponse,
    SnsNews,
    Task,
    TaskCategory,
    TaskStatus,
)
from infrastructure import (
    AiDraftRepository,
    AiSuggestionRepository,
    ClientRepository,
    ClientBriefRepository,
    ContactLogRepository,
    ContentPostRepository,
    ContractRepository,
    LeadRepository,
    MetricSnapshotRepository,
    NotificationRepository,
    ProposalRepository,
    ScheduleRepository,
    SnsNewsRepository,
    PulssChatMessageRepository,
    PulssChatSessionRepository,
    PulssLinkRepository,
    PulseLinkRepository,
    PulseResponseRepository,
    TaskRepository,
    TaskTemplateRepository,
)
from pulss_prompt import PULSS_SYSTEM_PROMPT
from n8n_client import N8nNewsClient
from utils import generate_id, generate_token
import httpx

logger = logging.getLogger(__name__)


class PulssLinkNotFound(Exception):
    """Raised when pulss link token is invalid or expired."""


class PulssOpenAIError(Exception):
    """Raised when OpenAI call fails."""


class PulssPersistenceError(Exception):
    """Raised when DB write/read fails for pulss chat."""


class ClientService:
    def __init__(
        self,
        client_repo: ClientRepository,
        pulse_repo: PulseResponseRepository,
        pulse_link_repo: PulseLinkRepository,
        template_repo: TaskTemplateRepository,
        task_repo: TaskRepository,
    ) -> None:
        self.client_repo = client_repo
        self.pulse_repo = pulse_repo
        self.pulse_link_repo = pulse_link_repo
        self.template_repo = template_repo
        self.task_repo = task_repo

    def list_clients(self) -> List[Client]:
        items = self.client_repo.list()
        for c in items:
            c.latest_pulse_response = self.pulse_repo.latest_by_client(c.id)
        return items

    def get_client(self, client_id: str) -> Optional[Client]:
        client = self.client_repo.get(client_id)
        if client:
            client.latest_pulse_response = self.pulse_repo.latest_by_client(client_id)
        return client

    def create_client(self, payload: dict) -> Client:
        now = datetime.utcnow()
        client = Client(
            id=generate_id(),
            name=payload["name"],
            industry=payload.get("industry", ""),
            status=ClientStatus(payload.get("status", ClientStatus.PRE_CONTRACT)),
            phase=ClientPhase(payload.get("phase", ClientPhase.HEARING)),
            sales_owner=payload.get("sales_owner"),
            director_owner=payload.get("director_owner"),
            slack_url=payload.get("slack_url"),
            memo=payload.get("memo"),
            onboarding_completed_at=None,
            last_contact_at=payload.get("last_contact_at"),
            created_at=now,
            updated_at=now,
        )
        self.client_repo.upsert(client)
        if client.status == ClientStatus.CONTRACTED:
            self._generate_onboarding_tasks(client.id)
        return client

    def update_client(self, client_id: str, payload: dict) -> Optional[Client]:
        client = self.client_repo.get(client_id)
        if not client:
            return None
        previous_status = client.status
        for key, value in payload.items():
            if hasattr(client, key) and value is not None:
                setattr(client, key, value)
        client.updated_at = datetime.utcnow()
        self.client_repo.upsert(client)
        if previous_status == ClientStatus.PRE_CONTRACT and client.status == ClientStatus.CONTRACTED:
            self._generate_onboarding_tasks(client.id)
        return client

    def generate_pulse_link(self, client_id: str) -> PulseLink:
        link = PulseLink(
            id=generate_id(),
            client_id=client_id,
            token=generate_token(),
            expires_at=None,
            created_at=datetime.utcnow(),
        )
        return self.pulse_link_repo.add(link)

    def attach_pulse_response(self, token: str, payload: dict) -> Optional[PulseResponse]:
        link = self.pulse_link_repo.get_by_token(token)
        if not link:
            return None
        response = PulseResponse(
            id=generate_id(),
            client_id=link.client_id,
            problem=payload.get("problem"),
            current_sns=payload.get("current_sns"),
            target=payload.get("target"),
            product_summary=payload.get("product_summary"),
            strengths_usp=payload.get("strengths_usp"),
            brand_story=payload.get("brand_story"),
            reference_accounts=payload.get("reference_accounts"),
            raw_payload=payload.get("raw_payload"),
            submitted_at=datetime.utcnow(),
        )
        self.pulse_repo.add(response)
        client = self.client_repo.get(link.client_id)
        if client:
            client.latest_pulse_response = response
            client.updated_at = datetime.utcnow()
            self.client_repo.upsert(client)
        return response

    def _generate_onboarding_tasks(self, client_id: str) -> None:
        templates = self.template_repo.active_onboarding()
        for tmpl in templates:
            self.task_repo.add(tmpl.to_task(client_id=client_id, assignee=tmpl.default_assignee_role))


class PulssChatService:
    def __init__(
        self,
        pulss_link_repo: PulssLinkRepository,
        session_repo: PulssChatSessionRepository,
        message_repo: PulssChatMessageRepository,
        draft_repo: AiDraftRepository,
        client_repo: ClientRepository,
        pulse_repo: PulseResponseRepository,
    ) -> None:
        self.pulss_link_repo = pulss_link_repo
        self.session_repo = session_repo
        self.message_repo = message_repo
        self.draft_repo = draft_repo
        self.client_repo = client_repo
        self.pulse_repo = pulse_repo
        self.front_base_url = os.getenv("PULSS_FRONT_BASE_URL", "http://localhost:5173")
        self.webhook_url = os.getenv(
            "PULSS_N8N_TOUCHPOINT_WEBHOOK_URL", "http://localhost:5678/webhook/ai-touchpoint-draft"
        )
        self.openai_model = os.getenv("PULSS_OPENAI_MODEL", "gpt-4o-mini")

    def issue_link(self, client_id: str, expires_at: Optional[datetime] = None) -> PulssLink:
        existing = self.pulss_link_repo.get_active_by_client(client_id)
        if existing:
            return existing
        link = PulssLink(
            id=generate_id(),
            client_id=client_id,
            token=secrets.token_hex(16),
            status=PulssLinkStatus.ACTIVE,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
        )
        return self.pulss_link_repo.add(link)

    def start_session_from_token(self, token: str) -> Optional[tuple[PulssChatSession, str, Client]]:
        link = self._load_link_by_token(token)
        return self._start_session(link)

    def start_session_from_client_token(self, client_id: str, token: str) -> Optional[tuple[PulssChatSession, str, Client]]:
        link = self._load_link_by_token(token)
        if link.client_id != client_id:
            logger.info("[pulss] token client mismatch: token=%s link_client_id=%s url_client_id=%s", token, link.client_id, client_id)
            raise PulssLinkNotFound("Link not found or expired")
        return self._start_session(link)

    def _load_link_by_token(self, token: str) -> PulssLink:
        logger.info("[pulss] start_session_from_token: token=%s", token)
        try:
            link = self.pulss_link_repo.get_by_token(token)
        except Exception as e:  # noqa: BLE001
            logger.exception("[pulss] failed to load link for token=%s", token)
            raise PulssPersistenceError(str(e)) from e

        if not link:
            logger.info("[pulss] token not found: %s", token)
            raise PulssLinkNotFound("Link not found or expired")
        if link.expires_at and link.expires_at < datetime.utcnow():
            logger.info("[pulss] token expired: %s", token)
            raise PulssLinkNotFound("Link not found or expired")

        return link

    def _start_session(self, link: PulssLink) -> Optional[tuple[PulssChatSession, str, Client]]:
        try:
            session = PulssChatSession(
                id=str(uuid.uuid4()),
                client_id=link.client_id,
                status="active",
                created_at=datetime.utcnow(),
                finalized_at=None,
                final_report=None,
            )
            self.session_repo.add(session)
        except Exception as e:  # noqa: BLE001
            logger.exception("[pulss] failed to create session for token=%s", link.token)
            raise PulssPersistenceError(str(e)) from e
        logger.info("[pulss] session created: session_id=%s client_id=%s", session.id, session.client_id)

        try:
            assistant_reply = self._call_openai(
                [
                    {"role": "system", "content": PULSS_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": "上記ルールに従い、STEP0 の導入メッセージだけを日本語で1通出力してください。",
                    },
                ]
            )
        except Exception as e:  # noqa: BLE001
            logger.exception("[pulss] openai call failed for token=%s session_id=%s", token, session.id)
            raise PulssOpenAIError(str(e)) from e

        current_api_key = os.getenv("OPENAI_API_KEY")
        if current_api_key and assistant_reply is None:
            logger.error("[pulss] openai returned empty response: session_id=%s", session.id)
            raise PulssOpenAIError("Failed to get response from OpenAI")

        assistant_reply = assistant_reply or "パルスヒアリングを開始します。まずは、現状のSNS運用状況や課題を教えてください。"

        try:
            self.message_repo.add(
                PulssChatMessage(
                    id=generate_id(),
                    session_id=session.id,
                    role="assistant",
                    content=assistant_reply,
                    created_at=datetime.utcnow(),
                )
            )
        except Exception as e:  # noqa: BLE001
            logger.exception("[pulss] failed to save initial assistant message: session_id=%s", session.id)
            raise PulssPersistenceError(str(e)) from e

        client = self.client_repo.get(session.client_id)
        return session, assistant_reply, client

    def post_message(self, session_id: str, user_message: str) -> Optional[tuple[str, bool]]:
        session = self.session_repo.get(session_id)
        if not session:
            print(f"[pulss] session not found: {session_id}")
            return None
        now = datetime.utcnow()
        self.message_repo.add(
            PulssChatMessage(
                id=generate_id(),
                session_id=session_id,
                role="user",
                content=user_message,
                created_at=now,
            )
        )
        history = self.message_repo.list_for_session(session_id)
        messages: List[Dict[str, str]] = [{"role": "system", "content": PULSS_SYSTEM_PROMPT}]
        for m in history:
            messages.append({"role": m.role, "content": m.content})

        assistant_reply = self._call_openai(messages) or "回答を生成できませんでした。時間をおいて再試行してください。"
        self.message_repo.add(
            PulssChatMessage(
                id=generate_id(),
                session_id=session_id,
                role="assistant",
                content=assistant_reply,
                created_at=datetime.utcnow(),
            )
        )

        done = user_message.strip() == "送信"
        if done:
            self.finalize_session(session_id, assistant_reply)
        return assistant_reply, done

    def finalize_session(self, session_id: str, final_report: str) -> None:
        session = self.session_repo.get(session_id)
        if not session:
            print(f"[pulss] finalize failed, session not found: {session_id}")
            return
        session.status = "finalized"
        session.finalized_at = datetime.utcnow()
        session.final_report = final_report
        self.session_repo.update(session_id, status=session.status, finalized_at=session.finalized_at, final_report=final_report)

        if not self.webhook_url:
            return
        client = self.client_repo.get(session.client_id)
        latest_pulse = self.pulse_repo.latest_by_client(session.client_id)
        payload = {
            "client_id": session.client_id,
            "client_name": client.name if client else None,
            "industry": client.industry if client else None,
            "pulse_report": {
                "needs": latest_pulse.problem if latest_pulse else None,
                "current_sns": latest_pulse.current_sns if latest_pulse else None,
                "target_goal": latest_pulse.target if latest_pulse else None,
                "product_summary": latest_pulse.product_summary if latest_pulse else None,
                "usp": latest_pulse.strengths_usp if latest_pulse else None,
                "brand_story": latest_pulse.brand_story if latest_pulse else None,
            },
        }
        try:
            httpx.post(self.webhook_url, json=payload, timeout=10.0)
        except Exception as e:  # noqa: BLE001
            print(f"[pulss] webhook post failed: {e}")

    def save_ai_draft(self, client_id: str, draft_type: str, status: str, content: str) -> AiDraft:
        now = datetime.utcnow()
        draft = AiDraft(
            id=generate_id(),
            client_id=client_id,
            type=draft_type,
            status=status,
            content=content,
            created_at=now,
            updated_at=now,
        )
        return self.draft_repo.add(draft)

    def _call_openai(self, messages: List[Dict[str, str]]) -> Optional[str]:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.info("[pulss] OPENAI_API_KEY not set; skip call (env=%s)", bool(api_key))
            return None
        try:
            resp = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": self.openai_model, "messages": messages},
                timeout=30.0,
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            logger.debug("[pulss] openai reply (head): %s", content[:30])
            return content
        except Exception as e:  # noqa: BLE001
            logger.exception("[pulss] openai call failed")
            return None


class TaskService:
    def __init__(self, task_repo: TaskRepository) -> None:
        self.task_repo = task_repo

    def list_tasks(self, client_id: str, category: Optional[TaskCategory] = None) -> List[Task]:
        return self.task_repo.list_by_client(client_id, category=category)

    def create_task(self, client_id: str, payload: dict) -> Task:
        task = Task(
            id="",
            client_id=client_id,
            title=payload["title"],
            description=payload.get("description"),
            category=TaskCategory(payload.get("category", TaskCategory.OPERATION)),
            status=TaskStatus(payload.get("status", TaskStatus.TODO)),
            due_date=payload.get("due_date"),
            completed_at=None,
            assignee=payload.get("assignee"),
            source=payload.get("source", "manual"),
            template_id=payload.get("template_id"),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        return self.task_repo.add(task)

    def update_task(self, task_id: str, payload: dict) -> Optional[Task]:
        return self.task_repo.update(task_id, **payload)

class AiSuggestionService:
    def __init__(self, repo: AiSuggestionRepository) -> None:
        self.repo = repo

    def list_for_client(self, client_id: str) -> List[AiSuggestion]:
        return self.repo.list_by_client(client_id)

    def generate(self, client: Client, context: Optional[dict] = None) -> AiSuggestion:
        now = datetime.utcnow()
        suggestion = AiSuggestion(
            id=generate_id(),
            client_id=client.id,
            type="touchpoint_message",
            title=f"{client.name} 向け次回提案ドラフト",
            body=self._build_body(client, context or {}),
            status=AiSuggestionStatus.DRAFT,
            created_by="ai",
            created_at=now,
            updated_at=now,
        )
        return self.repo.add(suggestion)

    def _build_body(self, client: Client, context: dict) -> str:
        lines = [
            f"クライアント: {client.name}",
            f"フェーズ: {client.phase.value}",
            f"業種: {client.industry}",
            "次回のアクション案:",
            "- 次回撮影日を3候補提示",
            "- 直近のSNSトレンドを踏まえた投稿案を2本ドラフト",
            "- 導入タスクの未完了項目をフォロー",
        ]
        if client.latest_pulse_response and client.latest_pulse_response.problem:
            lines.append(f"課題サマリ: {client.latest_pulse_response.problem}")
        if context.get("extra"):
            lines.append(f"メモ: {context['extra']}")
        return "\n".join(lines)


class ManagementService:
    def __init__(
        self,
        lead_repo: LeadRepository,
        contact_repo: ContactLogRepository,
        proposal_repo: ProposalRepository,
        contract_repo: ContractRepository,
        brief_repo: ClientBriefRepository,
        content_repo: ContentPostRepository,
        metric_repo: MetricSnapshotRepository,
        notification_repo: NotificationRepository,
    ) -> None:
        self.lead_repo = lead_repo
        self.contact_repo = contact_repo
        self.proposal_repo = proposal_repo
        self.contract_repo = contract_repo
        self.brief_repo = brief_repo
        self.content_repo = content_repo
        self.metric_repo = metric_repo
        self.notification_repo = notification_repo

    # Leads
    def list_leads(self) -> List[Lead]:
        return self.lead_repo.list()

    def create_lead(self, payload: dict) -> Lead:
        now = datetime.utcnow()
        lead = Lead(
            id=generate_id(),
            company_name=payload["company_name"],
            industry=payload.get("industry"),
            source=payload.get("source"),
            area=payload.get("area"),
            owner=payload.get("owner"),
            status=LeadStatus(payload.get("status", LeadStatus.NEW)),
            score=payload.get("score"),
            expected_mrr=payload.get("expected_mrr"),
            last_contact_at=payload.get("last_contact_at"),
            memo=payload.get("memo"),
            created_at=now,
            updated_at=now,
        )
        return self.lead_repo.add(lead)

    def update_lead(self, lead_id: str, payload: dict) -> Optional[Lead]:
        if payload.get("status"):
            payload["status"] = LeadStatus(payload["status"])
        if payload.get("last_contact_at"):
            payload["last_contact_at"] = datetime.fromisoformat(payload["last_contact_at"])
        return self.lead_repo.update(lead_id, payload)

    # Contact logs
    def add_contact(self, lead_id: str, payload: dict) -> ContactLog:
        now = datetime.utcnow()
        log = ContactLog(
            id=generate_id(),
            lead_id=lead_id,
            channel=payload.get("channel", "call"),
            content=payload.get("content", ""),
            actor=payload.get("actor"),
            contact_at=datetime.fromisoformat(payload.get("contact_at")) if payload.get("contact_at") else now,
            created_at=now,
        )
        return self.contact_repo.add(log)

    def list_contacts(self, lead_id: str) -> List[ContactLog]:
        return self.contact_repo.list(lead_id)

    # Proposals
    def create_proposal(self, payload: dict) -> Proposal:
        now = datetime.utcnow()
        proposal = Proposal(
            id=generate_id(),
            client_id=payload.get("client_id"),
            lead_id=payload.get("lead_id"),
            title=payload.get("title", "提案"),
            amount=payload.get("amount"),
            status=ProposalStatus(payload.get("status", ProposalStatus.DRAFT)),
            sent_at=datetime.fromisoformat(payload["sent_at"]) if payload.get("sent_at") else None,
            follow_due_at=datetime.fromisoformat(payload["follow_due_at"]) if payload.get("follow_due_at") else None,
            memo=payload.get("memo"),
            file_url=payload.get("file_url"),
            created_at=now,
            updated_at=now,
        )
        return self.proposal_repo.add(proposal)

    def update_proposal(self, proposal_id: str, payload: dict) -> Optional[Proposal]:
        if payload.get("status"):
            payload["status"] = ProposalStatus(payload["status"])
        if payload.get("sent_at"):
            payload["sent_at"] = datetime.fromisoformat(payload["sent_at"])
        if payload.get("follow_due_at"):
            payload["follow_due_at"] = datetime.fromisoformat(payload["follow_due_at"])
        return self.proposal_repo.update(proposal_id, payload)

    def list_proposals(self, client_id: str) -> List[Proposal]:
        return self.proposal_repo.list_for_client(client_id)

    # Contracts
    def create_contract(self, payload: dict) -> Contract:
        now = datetime.utcnow()
        contract = Contract(
            id=generate_id(),
            client_id=payload["client_id"],
            plan_name=payload.get("plan_name"),
            monthly_fee=payload.get("monthly_fee"),
            start_date=datetime.fromisoformat(payload["start_date"]).date() if payload.get("start_date") else None,
            end_date=datetime.fromisoformat(payload["end_date"]).date() if payload.get("end_date") else None,
            payment_terms=payload.get("payment_terms"),
            file_url=payload.get("file_url"),
            created_at=now,
            updated_at=now,
        )
        return self.contract_repo.add(contract)

    def list_contracts(self, client_id: str) -> List[Contract]:
        return self.contract_repo.list_for_client(client_id)

    # Client brief
    def upsert_brief(self, payload: dict) -> ClientBrief:
        now = datetime.utcnow()
        brief = ClientBrief(
            id=payload.get("id") or generate_id(),
            client_id=payload["client_id"],
            summary_markdown=payload.get("summary_markdown", ""),
            sections=payload.get("sections", {}),
            source_links=payload.get("source_links", []),
            created_at=now,
            updated_at=now,
        )
        return self.brief_repo.upsert(brief)

    def latest_brief(self, client_id: str) -> Optional[ClientBrief]:
        return self.brief_repo.get_by_client(client_id)

    # Content calendar
    def list_content(self, client_id: str) -> List[ContentPost]:
        return self.content_repo.list_for_client(client_id)

    def create_content(self, payload: dict) -> ContentPost:
        now = datetime.utcnow()
        post = ContentPost(
            id=generate_id(),
            client_id=payload["client_id"],
            title=payload.get("title", "コンテンツ"),
            platform=payload.get("platform", "instagram"),
            status=ContentPostStatus(payload.get("status", ContentPostStatus.PLANNED)),
            scheduled_date=datetime.fromisoformat(payload["scheduled_date"]).date() if payload.get("scheduled_date") else None,
            assignee=payload.get("assignee"),
            reference_url=payload.get("reference_url"),
            asset_path=payload.get("asset_path"),
            created_at=now,
            updated_at=now,
        )
        return self.content_repo.add(post)

    def update_content(self, post_id: str, payload: dict) -> Optional[ContentPost]:
        if payload.get("status"):
            payload["status"] = ContentPostStatus(payload["status"])
        if payload.get("scheduled_date"):
            payload["scheduled_date"] = datetime.fromisoformat(payload["scheduled_date"]).date()
        return self.content_repo.update(post_id, payload)

    # Metrics
    def list_metrics(self, client_id: str) -> List[MetricSnapshot]:
        return self.metric_repo.list_for_client(client_id)

    def create_metric(self, payload: dict) -> MetricSnapshot:
        snap = MetricSnapshot(
            id=generate_id(),
            client_id=payload["client_id"],
            period=payload["period"],
            metrics=payload.get("metrics", {}),
            created_at=datetime.utcnow(),
        )
        return self.metric_repo.add(snap)

    # Notifications
    def list_notifications(self, user: str) -> List[Notification]:
        return self.notification_repo.list_for_user(user)

    def create_notification(self, user: str, title: str, body: str) -> Notification:
        n = Notification(id=generate_id(), user=user, title=title, body=body, created_at=datetime.utcnow())
        return self.notification_repo.add(n)

    def mark_read(self, notification_id: str) -> Optional[Notification]:
        return self.notification_repo.mark_read(notification_id)


class ScheduleService:
    def __init__(self, schedule_repo: ScheduleRepository) -> None:
        self.schedule_repo = schedule_repo

    def list(self, date: Optional[str] = None, team: Optional[str] = None) -> List[ScheduleEvent]:
        return self.schedule_repo.list(date=date, team=team)

    def create(self, payload: dict) -> ScheduleEvent:
        event = ScheduleEvent(
            id=generate_id(),
            title=payload["title"],
            start=datetime.fromisoformat(payload["start"].replace("Z", "+00:00")),
            end=datetime.fromisoformat(payload["end"].replace("Z", "+00:00")),
            type=payload.get("type", "meeting"),
            team=payload.get("team", "sales"),
            description=payload.get("description"),
        )
        return self.schedule_repo.add(event)

    def update(self, event_id: str, payload: dict) -> Optional[ScheduleEvent]:
        mapped = dict(payload)
        if payload.get("start"):
            mapped["start"] = datetime.fromisoformat(payload["start"].replace("Z", "+00:00"))
        if payload.get("end"):
            mapped["end"] = datetime.fromisoformat(payload["end"].replace("Z", "+00:00"))
        return self.schedule_repo.update(event_id, mapped)

    def delete(self, event_id: str) -> None:
        self.schedule_repo.delete(event_id)


class SnsNewsService:
    def __init__(self, news_repo: SnsNewsRepository) -> None:
        self.news_repo = news_repo
        self.n8n_client = N8nNewsClient()
        self.cache_ttl_seconds = int(os.getenv("N8N_NEWS_CACHE_TTL", "1800") or 1800)
        self._last_fetched_at: Optional[datetime] = None
        self._seed_if_empty()

    def _seed_if_empty(self) -> None:
        if self.news_repo.list(limit=1):
            return
        now = datetime.utcnow()
        items = [
            SnsNews(
                id=generate_id(),
                title="Instagramリールがシェア重視にアルゴリズム更新",
                summary="保存・シェアが主要シグナルに。企画の作り方を見直そう。",
                url="https://example.com/ig-update",
                platform_tags=["instagram"],
                industry_tags=["food", "beauty", "hotel", "other"],
                source_name="Social Media Today",
                published_at=now,
                fetched_at=now,
            ),
            SnsNews(
                id=generate_id(),
                title="TikTok SEOで地域キーワードが重要に",
                summary="キャプションと音声読み上げを活用してローカル検索を強化する方法。",
                url="https://example.com/tiktok-seo",
                platform_tags=["tiktok"],
                industry_tags=["food", "other"],
                source_name="Search Engine Land",
                published_at=now,
                fetched_at=now,
            ),
        ]
        self.news_repo.add_many(items)

    def list(self, platform: Optional[str] = None, industry: Optional[str] = None, limit: int = 30) -> List[SnsNews]:
        self._refresh_if_needed()
        return self.news_repo.list(platform=platform, industry=industry, limit=limit)

    def _refresh_if_needed(self) -> None:
        if not self.n8n_client.url:
            return
        if self._last_fetched_at:
            age = (datetime.utcnow() - self._last_fetched_at).total_seconds()
            if age < self.cache_ttl_seconds:
                return
        fetched = self.n8n_client.fetch_news()
        if not fetched:
            return
        mapped = [self._map_n8n_item(item) for item in fetched if item]
        # Filter out any None that may result from mapping failures.
        mapped_valid = [m for m in mapped if m is not None]
        if mapped_valid:
            self.news_repo.add_many(mapped_valid)  # upsert behavior via INSERT OR REPLACE
            self._last_fetched_at = datetime.utcnow()

    def _map_n8n_item(self, item: Dict[str, Any]) -> Optional[SnsNews]:
        if not isinstance(item, dict):
            return None
        now = datetime.utcnow()
        ext_id = item.get("external_id") or item.get("url") or generate_id()
        platform_raw = (item.get("platform") or "other").lower()
        platform_map = {"instagram": "instagram", "tiktok": "tiktok", "youtube": "youtube", "x": "x", "general": "other"}
        platform = platform_map.get(platform_raw, "other")

        industry_raw = (item.get("industry") or "other").lower()
        industry_whitelist = {"food", "beauty", "hotel", "other"}
        industry = industry_raw if industry_raw in industry_whitelist else "other"

        published_at_raw = item.get("published_at")
        try:
            published_at = datetime.fromisoformat(str(published_at_raw).replace("Z", "+00:00")) if published_at_raw else now
        except Exception:  # noqa: BLE001
            published_at = now

        return SnsNews(
            id=str(ext_id),
            title=item.get("title", "未タイトル"),
            summary=item.get("summary", ""),
            url=item.get("url", ""),
            platform_tags=[platform],
            industry_tags=[industry],
            source_name=item.get("source", "n8n"),
            published_at=published_at,
            fetched_at=now,
        )
