
export type ClientStatus = 'pre_contract' | 'contracted';
export type ClientPhase =
  | 'hearing'
  | 'proposal'
  | 'estimate'
  | 'contract'
  | 'kickoff'
  | 'operation';

export interface PulseResponse {
  id: string;
  client_id: string;
  problem?: string;
  current_sns?: string;
  target?: string;
  product_summary?: string;
  strengths_usp?: string;
  brand_story?: string;
  reference_accounts?: string[];
  raw_payload?: Record<string, any>;
  submitted_at: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  status: ClientStatus;
  phase: ClientPhase;
  sales_owner?: string;
  director_owner?: string;
  slack_url?: string;
  memo?: string;
  onboarding_completed_at?: string;
  last_contact_at?: string;
  created_at: string;
  updated_at: string;
  latest_pulse_response?: PulseResponse;
  onboarding_progress?: number;
  has_alert?: boolean;
}

export interface CreateClientDTO {
  name: string;
  industry: string;
  status: ClientStatus;
  phase?: ClientPhase;
  sales_owner?: string;
  director_owner?: string;
  slack_url?: string;
  memo?: string;
  last_contact_at?: string;
}

// --- Task & AI Types ---
export type TaskCategory = 'onboarding' | 'operation' | 'other';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export interface Task {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  due_date?: string;
  completed_at?: string;
  assignee?: string;
  source: string;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AiSuggestion {
  id: string;
  client_id: string;
  type: string;
  title: string;
  body: string;
  status: 'draft' | 'approved' | 'sent';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Legacy progress widget (for compatibility with existing components)
export type ProgressStatus = 'done' | 'current' | 'pending';
export interface ProgressStep {
  id: number;
  label: string;
  status: ProgressStatus;
  date: string;
}

// --- SNS News Module Types ---
export type SnsPlatform = 'instagram' | 'tiktok' | 'youtube' | 'x' | 'other';
export type SnsIndustry = 'food' | 'beauty' | 'hotel' | 'other';

export interface SnsNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  platform_tags: SnsPlatform[];
  industry_tags: SnsIndustry[];
  source_name: string;
  published_at: string;
  fetched_at: string;
}

export interface SnsNewsFilter {
  platform?: SnsPlatform | 'all';
  industry?: SnsIndustry | 'all';
  limit?: number;
}

// --- Schedule Module Types ---
export interface ScheduleEvent {
  id: string;
  title: string;
  start: string; // ISO String
  end: string; // ISO String
  type: 'meeting' | 'deadline' | 'other';
  team: 'sales' | 'director' | 'creative';
  description?: string;
}

export interface CreateScheduleEventDTO {
  title: string;
  start: string;
  end: string;
  type: 'meeting' | 'deadline' | 'other';
  team: 'sales' | 'director' | 'creative';
  description?: string;
}

// --- SNS Performance Types ---
export interface SnsImpressionData {
  date: string; // YYYY-MM-DD or YYYY-MM
  impressions: number;
}

// --- Sales / Lead Management ---
export type LeadStatus =
  | 'new'
  | 'calling'
  | 'meeting'
  | 'proposal_sent'
  | 'follow_up'
  | 'lost'
  | 'won';

export interface LeadContactLog {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'chat';
  note: string;
  at: string;
  owner: string;
}

export interface Lead {
  id: string;
  company: string;
  industry: string;
  area?: string;
  owner: string;
  status: LeadStatus;
  rank: 'high' | 'medium' | 'low';
  expected_mrr?: number;
  last_action_at?: string;
  next_action_at?: string;
  memo?: string;
  source?: string;
  contacts?: LeadContactLog[];
}

// --- Hearing / Requirement ---
export interface HearingRecord {
  id: string;
  client_id: string;
  summary: string;
  meeting_at: string;
  owner: string;
  todo?: string;
}

export interface HomeworkLink {
  id: string;
  client_id: string;
  url: string;
  created_at: string;
  status: 'pending' | 'completed';
}

export interface ClientBrief {
  id: string;
  client_id: string;
  title: string;
  sections: Record<string, string>;
  created_at: string;
}

// --- Proposal / Contract ---
export interface Proposal {
  id: string;
  client_id: string;
  title: string;
  plan: string;
  amount: number;
  status: 'draft' | 'sent' | 'follow_up' | 'won' | 'lost';
  sent_at?: string;
  next_follow_at?: string;
  file_url?: string;
  memo?: string;
}

export interface Contract {
  id: string;
  client_id: string;
  plan: string;
  amount: number;
  start_date: string;
  end_date?: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  file_url?: string;
}

// --- Content / Calendar ---
export type ContentStatus =
  | 'draft'
  | 'shooting'
  | 'editing'
  | 'review'
  | 'ready'
  | 'posted';

export interface ContentCalendarItem {
  id: string;
  client_id: string;
  title: string;
  date: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'x' | 'other';
  status: ContentStatus;
  owner?: string;
}

// --- Reports / Notifications ---
export interface ReportSnapshot {
  id: string;
  client_id: string;
  period: string; // YYYY-MM
  kpi_summary: string;
  highlights: string[];
  pdf_url?: string;
  csv_url?: string;
}

export type NotificationType = 'task_due' | 'follow_up' | 'risk' | 'info';
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  due_at?: string;
}
