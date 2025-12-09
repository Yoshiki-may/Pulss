from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from enum import Enum
from typing import List, Optional


class ClientStatus(str, Enum):
    PRE_CONTRACT = "pre_contract"
    CONTRACTED = "contracted"


class ClientPhase(str, Enum):
    HEARING = "hearing"
    PROPOSAL = "proposal"
    ESTIMATE = "estimate"
    CONTRACT = "contract"
    KICKOFF = "kickoff"
    OPERATION = "operation"


class TaskCategory(str, Enum):
    ONBOARDING = "onboarding"
    OPERATION = "operation"
    OTHER = "other"


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"


class AiSuggestionStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    SENT = "sent"

class LeadStatus(str, Enum):
    NEW = "new"
    CALLING = "calling"
    MEETING_SCHEDULED = "meeting_scheduled"
    MEETING_DONE = "meeting_done"
    PROPOSAL = "proposal"
    FOLLOWING = "following"
    LOST = "lost"
    WON = "won"

class ProposalStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    FOLLOWING = "following"
    WON = "won"
    LOST = "lost"

class ContentPostStatus(str, Enum):
    PLANNED = "planned"
    SHOOTING = "shooting"
    EDITING = "editing"
    REVIEW = "review"
    APPROVED = "approved"
    POSTED = "posted"


@dataclass
class PulseResponse:
    id: str
    client_id: str
    problem: Optional[str] = None
    current_sns: Optional[str] = None
    target: Optional[str] = None
    product_summary: Optional[str] = None
    strengths_usp: Optional[str] = None
    brand_story: Optional[str] = None
    reference_accounts: Optional[List[str]] = None
    raw_payload: Optional[dict] = None
    submitted_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class PulseLink:
    id: str
    client_id: str
    token: str
    expires_at: Optional[datetime]
    created_at: datetime


@dataclass
class TaskTemplate:
    id: str
    name: str
    category: TaskCategory
    default_offset_days: int = 0
    default_assignee_role: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_task(self, client_id: str, assignee: Optional[str] = None) -> "Task":
        due = date.today() + timedelta(days=self.default_offset_days)
        return Task(
            id="",
            client_id=client_id,
            title=self.name,
            description=None,
            category=self.category,
            status=TaskStatus.TODO,
            due_date=due,
            completed_at=None,
            assignee=assignee,
            source="template",
            template_id=self.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )


@dataclass
class Task:
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


@dataclass
class AiSuggestion:
    id: str
    client_id: str
    type: str
    title: str
    body: str
    status: AiSuggestionStatus
    created_by: str
    created_at: datetime
    updated_at: datetime


@dataclass
class Lead:
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


@dataclass
class ContactLog:
    id: str
    lead_id: str
    channel: str
    content: str
    actor: Optional[str]
    contact_at: datetime
    created_at: datetime


@dataclass
class MeetingNote:
    id: str
    client_id: Optional[str]
    lead_id: Optional[str]
    meeting_at: datetime
    attendees: List[str]
    summary: Optional[str]
    transcript_url: Optional[str]
    created_at: datetime


@dataclass
class HearingRecord:
    id: str
    client_id: Optional[str]
    lead_id: Optional[str]
    data: dict
    created_at: datetime
    updated_at: datetime


@dataclass
class Proposal:
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


@dataclass
class Contract:
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


@dataclass
class ClientBrief:
    id: str
    client_id: str
    summary_markdown: str
    sections: dict
    source_links: List[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class ContentPost:
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


@dataclass
class MetricSnapshot:
    id: str
    client_id: str
    period: str  # YYYY-MM
    metrics: dict
    created_at: datetime


@dataclass
class Notification:
    id: str
    user: str
    title: str
    body: str
    created_at: datetime
    read_at: Optional[datetime] = None


@dataclass
class ScheduleEvent:
    id: str
    title: str
    start: datetime
    end: datetime
    type: str
    team: str
    description: Optional[str] = None


@dataclass
class SnsNews:
    id: str
    title: str
    summary: str
    url: str
    platform_tags: List[str]
    industry_tags: List[str]
    source_name: str
    published_at: datetime
    fetched_at: datetime


@dataclass
class ContactLog:
    id: str
    client_id: str
    contact_at: datetime
    channel: str
    summary: Optional[str]
    created_by: Optional[str]
    created_at: datetime


@dataclass
class Client:
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
    latest_pulse_response: Optional[PulseResponse] = None
