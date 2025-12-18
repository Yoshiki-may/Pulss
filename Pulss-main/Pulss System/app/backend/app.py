from __future__ import annotations

from api import create_app
from infrastructure import (
    AiDraftRepository,
    AiSuggestionRepository,
    ClientBriefRepository,
    ClientRepository,
    Database,
    ContactLogRepository,
    ContentPostRepository,
    ContractRepository,
    PulssChatMessageRepository,
    PulssChatSessionRepository,
    PulssLinkRepository,
    LeadRepository,
    MetricSnapshotRepository,
    NotificationRepository,
    ProposalRepository,
    PulseLinkRepository,
    PulseResponseRepository,
    ScheduleRepository,
    SnsNewsRepository,
    TaskRepository,
    TaskTemplateRepository,
    seed_data,
)
from services import (
    AiSuggestionService,
    ClientService,
    ManagementService,
    PulssChatService,
    ScheduleService,
    SnsNewsService,
    TaskService,
)


def build_services() -> tuple[
    ClientService, TaskService, AiSuggestionService, ScheduleService, SnsNewsService, ManagementService, PulssChatService
]:
    db = Database()
    client_repo = ClientRepository(db)
    pulse_repo = PulseResponseRepository(db)
    pulse_link_repo = PulseLinkRepository(db)
    pulss_link_repo = PulssLinkRepository(db)
    pulss_session_repo = PulssChatSessionRepository(db)
    pulss_message_repo = PulssChatMessageRepository(db)
    ai_draft_repo = AiDraftRepository(db)
    task_repo = TaskRepository(db)
    template_repo = TaskTemplateRepository()
    ai_repo = AiSuggestionRepository(db)
    schedule_repo = ScheduleRepository(db)
    news_repo = SnsNewsRepository(db)
    lead_repo = LeadRepository(db)
    contact_repo = ContactLogRepository(db)
    proposal_repo = ProposalRepository(db)
    contract_repo = ContractRepository(db)
    brief_repo = ClientBriefRepository(db)
    content_repo = ContentPostRepository(db)
    metric_repo = MetricSnapshotRepository(db)
    notification_repo = NotificationRepository(db)

    seed_data(client_repo, template_repo, task_repo)

    client_service = ClientService(
        client_repo=client_repo,
        pulse_repo=pulse_repo,
        pulse_link_repo=pulse_link_repo,
        template_repo=template_repo,
        task_repo=task_repo,
    )
    task_service = TaskService(task_repo=task_repo)
    ai_service = AiSuggestionService(repo=ai_repo)
    schedule_service = ScheduleService(schedule_repo=schedule_repo)
    news_service = SnsNewsService(news_repo=news_repo)
    pulss_service = PulssChatService(
        pulss_link_repo=pulss_link_repo,
        session_repo=pulss_session_repo,
        message_repo=pulss_message_repo,
        draft_repo=ai_draft_repo,
        client_repo=client_repo,
        pulse_repo=pulse_repo,
    )
    management_service = ManagementService(
        lead_repo=lead_repo,
        contact_repo=contact_repo,
        proposal_repo=proposal_repo,
        contract_repo=contract_repo,
        brief_repo=brief_repo,
        content_repo=content_repo,
        metric_repo=metric_repo,
        notification_repo=notification_repo,
    )
    return client_service, task_service, ai_service, schedule_service, news_service, management_service, pulss_service


def create_fastapi_app():
    (
        client_service,
        task_service,
        ai_service,
        schedule_service,
        news_service,
        management_service,
        pulss_service,
    ) = build_services()
    return create_app(
        client_service=client_service,
        task_service=task_service,
        ai_service=ai_service,
        schedule_service=schedule_service,
        news_service=news_service,
        management_service=management_service,
        pulss_service=pulss_service,
    )
