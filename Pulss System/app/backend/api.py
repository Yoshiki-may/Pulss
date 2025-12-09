from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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
    Lead,
    LeadStatus,
    MetricSnapshot,
    Proposal,
    ProposalStatus,
    ScheduleEvent,
    PulseResponse,
    SnsNews,
    Task,
    TaskCategory,
    TaskStatus,
)
from services import AiSuggestionService, ClientService, ManagementService, ScheduleService, SnsNewsService, TaskService


class PulseResponsePayload(BaseModel):
    token: str
    problem: Optional[str] = None
    current_sns: Optional[str] = None
    target: Optional[str] = None
    product_summary: Optional[str] = None
    strengths_usp: Optional[str] = None
    brand_story: Optional[str] = None
    reference_accounts: Optional[List[str]] = None
    raw_payload: Optional[dict] = None


class PulseResponseOut(BaseModel):
    id: str
    client_id: str
    problem: Optional[str]
    current_sns: Optional[str]
    target: Optional[str]
    product_summary: Optional[str]
    strengths_usp: Optional[str]
    brand_story: Optional[str]
    reference_accounts: Optional[List[str]]
    raw_payload: Optional[dict]
    submitted_at: datetime

    @classmethod
    def from_domain(cls, res: PulseResponse) -> "PulseResponseOut":
        return cls(**res.__dict__)


class ClientCreatePayload(BaseModel):
    name: str
    industry: str
    status: ClientStatus = ClientStatus.PRE_CONTRACT
    phase: ClientPhase = ClientPhase.HEARING
    sales_owner: Optional[str] = None
    director_owner: Optional[str] = None
    slack_url: Optional[str] = None
    memo: Optional[str] = None
    last_contact_at: Optional[datetime] = None


class ClientUpdatePayload(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[ClientStatus] = None
    phase: Optional[ClientPhase] = None
    sales_owner: Optional[str] = None
    director_owner: Optional[str] = None
    slack_url: Optional[str] = None
    memo: Optional[str] = None
    last_contact_at: Optional[datetime] = None
    onboarding_completed_at: Optional[datetime] = None


class ClientSummaryOut(BaseModel):
    id: str
    name: str
    industry: str
    status: ClientStatus
    phase: ClientPhase
    sales_owner: Optional[str]
    director_owner: Optional[str]
    slack_url: Optional[str]
    memo: Optional[str]
    onboarding_completed_at: Optional[datetime]
    last_contact_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    has_alert: bool = False
    onboarding_progress: Optional[float] = None
    latest_pulse_response: Optional[PulseResponseOut] = None

    @classmethod
    def from_domain(cls, client: Client, onboarding_progress: Optional[float], has_alert: bool) -> "ClientSummaryOut":
        return cls(
            **{
                **client.__dict__,
                "latest_pulse_response": PulseResponseOut.from_domain(client.latest_pulse_response)
                if client.latest_pulse_response
                else None,
                "onboarding_progress": onboarding_progress,
                "has_alert": has_alert,
            }
        )


class TaskPayload(BaseModel):
    title: str
    description: Optional[str] = None
    category: TaskCategory = TaskCategory.OPERATION
    status: TaskStatus = TaskStatus.TODO
    due_date: Optional[date] = None
    assignee: Optional[str] = None
    source: Optional[str] = "manual"
    template_id: Optional[str] = None


class TaskOut(BaseModel):
    id: str
    client_id: str
    title: str
    description: Optional[str]
    category: TaskCategory
    status: TaskStatus
    due_date: Optional[date]
    completed_at: Optional[datetime]
    assignee: Optional[str]
    source: str
    template_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_domain(cls, task: Task) -> "TaskOut":
        return cls(**task.__dict__)


class AiSuggestionOut(BaseModel):
    id: str
    client_id: str
    type: str
    title: str
    body: str
    status: AiSuggestionStatus
    created_by: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_domain(cls, s: AiSuggestion) -> "AiSuggestionOut":
        return cls(**s.__dict__)


class DirectorBoardItem(BaseModel):
    client_id: str
    name: str
    phase: ClientPhase
    status: ClientStatus
    onboarding_progress: Optional[float]
    open_tasks_count: int
    last_contact_at: Optional[datetime]
    has_alert: bool


class SchedulePayload(BaseModel):
    title: str
    start: datetime
    end: datetime
    type: str = "meeting"
    team: str = "sales"
    description: Optional[str] = None


class ScheduleOut(BaseModel):
    id: str
    title: str
    start: datetime
    end: datetime
    type: str
    team: str
    description: Optional[str]

    @classmethod
    def from_domain(cls, e: ScheduleEvent) -> "ScheduleOut":
        return cls(**e.__dict__)


class SnsNewsOut(BaseModel):
    id: str
    title: str
    summary: str
    url: str
    platform_tags: List[str]
    industry_tags: List[str]
    source_name: str
    published_at: datetime
    fetched_at: datetime

    @classmethod
    def from_domain(cls, n: SnsNews) -> "SnsNewsOut":
        return cls(**n.__dict__)


class LeadPayload(BaseModel):
    company_name: str
    industry: Optional[str] = None
    source: Optional[str] = None
    area: Optional[str] = None
    owner: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    score: Optional[int] = None
    expected_mrr: Optional[int] = None
    last_contact_at: Optional[datetime] = None
    memo: Optional[str] = None


class LeadOut(BaseModel):
    id: str
    company_name: str
    industry: Optional[str]
    source: Optional[str]
    area: Optional[str]
    owner: Optional[str]
    status: LeadStatus
    score: Optional[int]
    expected_mrr: Optional[int]
    last_contact_at: Optional[datetime]
    memo: Optional[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_domain(cls, lead: Lead) -> "LeadOut":
        return cls(**lead.__dict__)


class ContactPayload(BaseModel):
    channel: str
    content: str
    actor: Optional[str] = None
    contact_at: Optional[datetime] = None


class ContactOut(BaseModel):
    id: str
    lead_id: str
    channel: str
    content: str
    actor: Optional[str]
    contact_at: datetime
    created_at: datetime

    @classmethod
    def from_domain(cls, log: ContactLog) -> "ContactOut":
        return cls(**log.__dict__)


class ProposalPayload(BaseModel):
    client_id: Optional[str] = None
    lead_id: Optional[str] = None
    title: str
    amount: Optional[int] = None
    status: ProposalStatus = ProposalStatus.DRAFT
    sent_at: Optional[datetime] = None
    follow_due_at: Optional[datetime] = None
    memo: Optional[str] = None
    file_url: Optional[str] = None


class ProposalOut(BaseModel):
    id: str
    client_id: Optional[str]
    lead_id: Optional[str]
    title: str
    amount: Optional[int]
    status: ProposalStatus
    sent_at: Optional[datetime]
    follow_due_at: Optional[datetime]
    memo: Optional[str]
    file_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_domain(cls, p: Proposal) -> "ProposalOut":
        return cls(**p.__dict__)


class ContractPayload(BaseModel):
    client_id: str
    plan_name: Optional[str] = None
    monthly_fee: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    payment_terms: Optional[str] = None
    file_url: Optional[str] = None


class ContractOut(BaseModel):
    id: str
    client_id: str
    plan_name: Optional[str]
    monthly_fee: Optional[int]
    start_date: Optional[date]
    end_date: Optional[date]
    payment_terms: Optional[str]
    file_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_domain(cls, c: Contract) -> "ContractOut":
        return cls(**c.__dict__)


class BriefPayload(BaseModel):
    client_id: str
    summary_markdown: str
    sections: dict = Field(default_factory=dict)
    source_links: List[str] = Field(default_factory=list)


class BriefOut(BaseModel):
    id: str
    client_id: str
    summary_markdown: str
    sections: dict
    source_links: List[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_domain(cls, b: ClientBrief) -> "BriefOut":
        return cls(**b.__dict__)


class ContentPayload(BaseModel):
    client_id: str
    title: str
    platform: str = "instagram"
    status: ContentPostStatus = ContentPostStatus.PLANNED
    scheduled_date: Optional[date] = None
    assignee: Optional[str] = None
    reference_url: Optional[str] = None
    asset_path: Optional[str] = None


class ContentOut(BaseModel):
    id: str
    client_id: str
    title: str
    platform: str
    status: ContentPostStatus
    scheduled_date: Optional[date]
    assignee: Optional[str]
    reference_url: Optional[str]
    asset_path: Optional[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_domain(cls, c: ContentPost) -> "ContentOut":
        return cls(**c.__dict__)


class MetricPayload(BaseModel):
    client_id: str
    period: str
    metrics: dict


class MetricOut(BaseModel):
    id: str
    client_id: str
    period: str
    metrics: dict
    created_at: datetime

    @classmethod
    def from_domain(cls, m: MetricSnapshot) -> "MetricOut":
        return cls(**m.__dict__)


class NotificationOut(BaseModel):
    id: str
    user: str
    title: str
    body: str
    created_at: datetime
    read_at: Optional[datetime]

    @classmethod
    def from_domain(cls, n: Notification) -> "NotificationOut":
        return cls(**n.__dict__)


def build_router(
    client_service: ClientService,
    task_service: TaskService,
    ai_service: AiSuggestionService,
    schedule_service: ScheduleService,
    news_service: SnsNewsService,
    management_service: ManagementService,
) -> APIRouter:
    router = APIRouter(prefix="/api")

    def _calc_onboarding_progress(tasks: List[Task]) -> Optional[float]:
        onboarding_tasks = [t for t in tasks if t.category == TaskCategory.ONBOARDING]
        if not onboarding_tasks:
            return None
        done = len([t for t in onboarding_tasks if t.status == TaskStatus.DONE])
        return round(done / len(onboarding_tasks), 2)

    def _calc_has_alert(client: Client, tasks: List[Task]) -> bool:
        overdue = any(
            t.due_date and t.status != TaskStatus.DONE and t.due_date < date.today() for t in tasks
        )
        stale_contact = client.last_contact_at and (datetime.utcnow() - client.last_contact_at).days >= 14
        return bool(overdue or stale_contact)

    @router.get("/health")
    def health() -> dict:
        return {"status": "ok", "time": datetime.utcnow().isoformat()}

    @router.get("/clients", response_model=List[ClientSummaryOut])
    def list_clients() -> List[ClientSummaryOut]:
        clients = client_service.list_clients()
        result: List[ClientSummaryOut] = []
        for c in clients:
            tasks = task_service.list_tasks(c.id)
            progress = _calc_onboarding_progress(tasks)
            alert = _calc_has_alert(c, tasks)
            result.append(ClientSummaryOut.from_domain(c, onboarding_progress=progress, has_alert=alert))
        return result

    @router.post("/clients", response_model=ClientSummaryOut)
    def create_client(payload: ClientCreatePayload) -> ClientSummaryOut:
        client = client_service.create_client(payload.model_dump())
        tasks = task_service.list_tasks(client.id)
        progress = _calc_onboarding_progress(tasks)
        alert = _calc_has_alert(client, tasks)
        return ClientSummaryOut.from_domain(client, onboarding_progress=progress, has_alert=alert)

    @router.get("/clients/{client_id}", response_model=ClientSummaryOut)
    def get_client(client_id: str) -> ClientSummaryOut:
        client = client_service.get_client(client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        tasks = task_service.list_tasks(client_id)
        progress = _calc_onboarding_progress(tasks)
        alert = _calc_has_alert(client, tasks)
        return ClientSummaryOut.from_domain(client, onboarding_progress=progress, has_alert=alert)

    @router.put("/clients/{client_id}", response_model=ClientSummaryOut)
    def update_client(client_id: str, payload: ClientUpdatePayload) -> ClientSummaryOut:
        client = client_service.update_client(client_id, {k: v for k, v in payload.model_dump().items() if v is not None})
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        tasks = task_service.list_tasks(client_id)
        progress = _calc_onboarding_progress(tasks)
        alert = _calc_has_alert(client, tasks)
        return ClientSummaryOut.from_domain(client, onboarding_progress=progress, has_alert=alert)

    @router.post("/clients/{client_id}/pulse-link")
    def create_pulse_link(client_id: str) -> dict:
        client = client_service.get_client(client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        link = client_service.generate_pulse_link(client_id)
        return {"url": f"https://pulse.example.com/form?token={link.token}", "token": link.token}

    @router.post("/pulse-responses", response_model=PulseResponseOut)
    def create_pulse_response(payload: PulseResponsePayload) -> PulseResponseOut:
        res = client_service.attach_pulse_response(payload.token, payload.model_dump())
        if not res:
            raise HTTPException(status_code=404, detail="Invalid token")
        return PulseResponseOut.from_domain(res)

    @router.get("/clients/{client_id}/tasks", response_model=List[TaskOut])
    def list_tasks(client_id: str, category: Optional[TaskCategory] = None) -> List[TaskOut]:
        return [TaskOut.from_domain(t) for t in task_service.list_tasks(client_id, category)]

    @router.post("/clients/{client_id}/tasks", response_model=TaskOut)
    def create_task(client_id: str, payload: TaskPayload) -> TaskOut:
        task = task_service.create_task(client_id, payload.model_dump())
        return TaskOut.from_domain(task)

    @router.put("/tasks/{task_id}", response_model=TaskOut)
    def update_task(task_id: str, payload: TaskPayload) -> TaskOut:
        task = task_service.update_task(task_id, payload.model_dump(exclude_unset=True))
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return TaskOut.from_domain(task)

    @router.get("/clients/{client_id}/ai-suggestions", response_model=List[AiSuggestionOut])
    def list_ai_suggestions(client_id: str) -> List[AiSuggestionOut]:
        return [AiSuggestionOut.from_domain(s) for s in ai_service.list_for_client(client_id)]

    @router.post("/clients/{client_id}/ai-suggestions", response_model=AiSuggestionOut)
    def generate_ai_suggestion(client_id: str, payload: dict = Body(default_factory=dict)) -> AiSuggestionOut:
        client = client_service.get_client(client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        suggestion = ai_service.generate(client, context=payload)
        return AiSuggestionOut.from_domain(suggestion)

    @router.get("/director-board/clients", response_model=List[DirectorBoardItem])
    def director_board() -> List[DirectorBoardItem]:
        items: List[DirectorBoardItem] = []
        for c in client_service.list_clients():
            tasks = task_service.list_tasks(c.id)
            progress = _calc_onboarding_progress(tasks)
            open_tasks = len([t for t in tasks if t.status != TaskStatus.DONE])
            alert = _calc_has_alert(c, tasks)
            items.append(
                DirectorBoardItem(
                    client_id=c.id,
                    name=c.name,
                    phase=c.phase,
                    status=c.status,
                    onboarding_progress=progress,
                    open_tasks_count=open_tasks,
                    last_contact_at=c.last_contact_at,
                    has_alert=alert,
                )
            )
        return items

    @router.get("/schedules", response_model=List[ScheduleOut])
    def list_schedules(date: Optional[str] = None, team: Optional[str] = None) -> List[ScheduleOut]:
        events = schedule_service.list(date=date, team=team)
        return [ScheduleOut.from_domain(e) for e in events]

    @router.post("/schedules", response_model=ScheduleOut)
    def create_schedule(payload: SchedulePayload) -> ScheduleOut:
        event = schedule_service.create(payload.model_dump())
        return ScheduleOut.from_domain(event)

    @router.put("/schedules/{event_id}", response_model=ScheduleOut)
    def update_schedule(event_id: str, payload: SchedulePayload) -> ScheduleOut:
        event = schedule_service.update(event_id, payload.model_dump())
        if not event:
            raise HTTPException(status_code=404, detail="Schedule not found")
        return ScheduleOut.from_domain(event)

    @router.delete("/schedules/{event_id}")
    def delete_schedule(event_id: str) -> dict:
        schedule_service.delete(event_id)
        return {"ok": True}

    @router.get("/sns-news", response_model=List[SnsNewsOut])
    def list_news(platform: Optional[str] = None, industry: Optional[str] = None, limit: int = 30) -> List[SnsNewsOut]:
        news = news_service.list(platform=platform, industry=industry, limit=limit)
        return [SnsNewsOut.from_domain(n) for n in news]

    # --- Lead & sales modules ---
    @router.get("/leads", response_model=List[LeadOut])
    def list_leads() -> List[LeadOut]:
        return [LeadOut.from_domain(l) for l in management_service.list_leads()]

    @router.post("/leads", response_model=LeadOut)
    def create_lead(payload: LeadPayload) -> LeadOut:
        lead = management_service.create_lead(payload.model_dump())
        return LeadOut.from_domain(lead)

    @router.put("/leads/{lead_id}", response_model=LeadOut)
    def update_lead(lead_id: str, payload: LeadPayload) -> LeadOut:
        lead = management_service.update_lead(lead_id, payload.model_dump())
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        return LeadOut.from_domain(lead)

    @router.get("/leads/{lead_id}/contacts", response_model=List[ContactOut])
    def list_contacts(lead_id: str) -> List[ContactOut]:
        return [ContactOut.from_domain(c) for c in management_service.list_contacts(lead_id)]

    @router.post("/leads/{lead_id}/contacts", response_model=ContactOut)
    def add_contact(lead_id: str, payload: ContactPayload) -> ContactOut:
        log = management_service.add_contact(lead_id, payload.model_dump())
        return ContactOut.from_domain(log)

    # Proposals
    @router.get("/clients/{client_id}/proposals", response_model=List[ProposalOut])
    def list_proposals(client_id: str) -> List[ProposalOut]:
        return [ProposalOut.from_domain(p) for p in management_service.list_proposals(client_id)]

    @router.post("/proposals", response_model=ProposalOut)
    def create_proposal(payload: ProposalPayload) -> ProposalOut:
        proposal = management_service.create_proposal(payload.model_dump())
        return ProposalOut.from_domain(proposal)

    @router.put("/proposals/{proposal_id}", response_model=ProposalOut)
    def update_proposal(proposal_id: str, payload: ProposalPayload) -> ProposalOut:
        p = management_service.update_proposal(proposal_id, payload.model_dump())
        if not p:
            raise HTTPException(status_code=404, detail="Proposal not found")
        return ProposalOut.from_domain(p)

    # Contracts
    @router.get("/clients/{client_id}/contracts", response_model=List[ContractOut])
    def list_contracts(client_id: str) -> List[ContractOut]:
        return [ContractOut.from_domain(c) for c in management_service.list_contracts(client_id)]

    @router.post("/contracts", response_model=ContractOut)
    def create_contract(payload: ContractPayload) -> ContractOut:
        c = management_service.create_contract(payload.model_dump())
        return ContractOut.from_domain(c)

    # Client brief
    @router.get("/clients/{client_id}/brief", response_model=Optional[BriefOut])
    def get_brief(client_id: str) -> Optional[BriefOut]:
        brief = management_service.latest_brief(client_id)
        return BriefOut.from_domain(brief) if brief else None

    @router.post("/clients/{client_id}/brief", response_model=BriefOut)
    def upsert_brief(client_id: str, payload: BriefPayload) -> BriefOut:
        brief = management_service.upsert_brief({**payload.model_dump(), "client_id": client_id})
        return BriefOut.from_domain(brief)

    # Content calendar
    @router.get("/clients/{client_id}/content-posts", response_model=List[ContentOut])
    def list_content(client_id: str) -> List[ContentOut]:
        return [ContentOut.from_domain(c) for c in management_service.list_content(client_id)]

    @router.post("/content-posts", response_model=ContentOut)
    def create_content(payload: ContentPayload) -> ContentOut:
        post = management_service.create_content(payload.model_dump())
        return ContentOut.from_domain(post)

    @router.put("/content-posts/{post_id}", response_model=ContentOut)
    def update_content(post_id: str, payload: ContentPayload) -> ContentOut:
        post = management_service.update_content(post_id, payload.model_dump())
        if not post:
            raise HTTPException(status_code=404, detail="Content not found")
        return ContentOut.from_domain(post)

    # Metrics
    @router.get("/clients/{client_id}/metrics", response_model=List[MetricOut])
    def list_metrics(client_id: str) -> List[MetricOut]:
        return [MetricOut.from_domain(m) for m in management_service.list_metrics(client_id)]

    @router.post("/metrics", response_model=MetricOut)
    def create_metric(payload: MetricPayload) -> MetricOut:
        snap = management_service.create_metric(payload.model_dump())
        return MetricOut.from_domain(snap)

    # Notifications
    @router.get("/notifications", response_model=List[NotificationOut])
    def list_notifications(user: str) -> List[NotificationOut]:
        return [NotificationOut.from_domain(n) for n in management_service.list_notifications(user)]

    @router.post("/notifications", response_model=NotificationOut)
    def create_notification(user: str, title: str = Body(...), body: str = Body(...)) -> NotificationOut:
        n = management_service.create_notification(user, title, body)
        return NotificationOut.from_domain(n)

    @router.post("/notifications/{notification_id}/read", response_model=NotificationOut)
    def mark_notification_read(notification_id: str) -> NotificationOut:
        n = management_service.mark_read(notification_id)
        if not n:
            raise HTTPException(status_code=404, detail="Notification not found")
        return NotificationOut.from_domain(n)

    return router


def create_app(
    client_service: ClientService,
    task_service: TaskService,
    ai_service: AiSuggestionService,
    schedule_service: ScheduleService,
    news_service: SnsNewsService,
    management_service: ManagementService,
) -> FastAPI:
    app = FastAPI(title="Pulss API", version="0.2.0")
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://3.107.236.7:5173",
        "http://3.107.236.7:8000",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    router = build_router(client_service, task_service, ai_service, schedule_service, news_service, management_service)
    app.include_router(router)
    return app
