from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from domain import (
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
    PulseLink,
    PulseResponse,
    SnsNews,
    Task,
    TaskCategory,
    TaskStatus,
)
from infrastructure import (
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
    PulseLinkRepository,
    PulseResponseRepository,
    TaskRepository,
    TaskTemplateRepository,
)
from utils import generate_id, generate_token


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
        return self.news_repo.list(platform=platform, industry=industry, limit=limit)
