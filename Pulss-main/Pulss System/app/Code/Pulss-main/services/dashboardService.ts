import {
  ContentCalendarItem,
  Contract,
  HearingRecord,
  HomeworkLink,
  Lead,
  Notification,
  Proposal,
  ReportSnapshot,
} from '../types';

// Mock data to allow UI wiring without backend
const leads: Lead[] = [
  {
    id: 'l1',
    company: '焼肉ドブン東京',
    industry: '飲食',
    owner: '田中 健',
    status: 'meeting',
    rank: 'high',
    expected_mrr: 350000,
    last_action_at: new Date().toISOString(),
    next_action_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    memo: '紹介案件。次回オンラインMTGで提案予定。',
    source: '紹介',
  },
  {
    id: 'l2',
    company: 'Luminous Beauty Salon',
    industry: '美容',
    owner: '鈴木 一郎',
    status: 'proposal_sent',
    rank: 'medium',
    expected_mrr: 280000,
    last_action_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    next_action_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    memo: '提案書送付済み。1ヶ月後フォローリマインド。',
    source: 'テレアポ',
  },
];

const hearings: HearingRecord[] = [
  {
    id: 'h1',
    client_id: '1',
    summary: '採用強化目的。Instagram中心に月8本投稿希望。',
    meeting_at: new Date().toISOString(),
    owner: '田中 健',
    todo: '宿題URLを送付して詳細要件を記載してもらう',
  },
];

const homeworkLinks: HomeworkLink[] = [
  {
    id: 'hw1',
    client_id: '1',
    url: 'https://pulse.example.com/homework/abc123',
    created_at: new Date().toISOString(),
    status: 'pending',
  },
];

const proposals: Proposal[] = [
  {
    id: 'p1',
    client_id: '1',
    title: 'SNS運用プランA',
    plan: 'Plan A',
    amount: 300000,
    status: 'follow_up',
    sent_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    next_follow_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    memo: '1ヶ月後フォロー自動タスク済み',
  },
];

const contracts: Contract[] = [
  {
    id: 'c1',
    client_id: '1',
    plan: 'Plan A',
    amount: 300000,
    start_date: new Date().toISOString(),
    billing_cycle: 'monthly',
    file_url: '#',
  },
];

const calendarItems: ContentCalendarItem[] = [
  {
    id: 'cal1',
    client_id: '1',
    title: 'リール投稿：求人施策',
    date: new Date().toISOString().slice(0, 10),
    platform: 'instagram',
    status: 'editing',
    owner: '佐藤 恵',
  },
  {
    id: 'cal2',
    client_id: '2',
    title: 'フィード投稿：店舗紹介',
    date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    platform: 'instagram',
    status: 'draft',
    owner: 'インターンA',
  },
];

const reports: ReportSnapshot[] = [
  {
    id: 'r1',
    client_id: '1',
    period: '2025-11',
    kpi_summary: 'フォロワー +8%、リンククリック +12%',
    highlights: ['求人向けリールがCTR向上', '保存率が前月比+5%'],
    pdf_url: '#',
    csv_url: '#',
  },
];

const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'follow_up',
    title: '提案送付後フォロー',
    message: '焼肉ドブン東京の提案送付から1ヶ月。フォローを実施してください。',
    due_at: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: 'n2',
    type: 'task_due',
    title: '撮影日程調整の期限',
    message: 'Luminous Beauty Salonの撮影日程調整が明日期限です。',
    due_at: new Date(Date.now() + 86400000).toISOString(),
  },
];

export const dashboardService = {
  async getLeads(): Promise<Lead[]> {
    return leads;
  },
  async getHearings(): Promise<HearingRecord[]> {
    return hearings;
  },
  async getHomeworkLinks(): Promise<HomeworkLink[]> {
    return homeworkLinks;
  },
  async getProposals(): Promise<Proposal[]> {
    return proposals;
  },
  async getContracts(): Promise<Contract[]> {
    return contracts;
  },
  async getCalendarItems(): Promise<ContentCalendarItem[]> {
    return calendarItems;
  },
  async getReports(): Promise<ReportSnapshot[]> {
    return reports;
  },
  async getNotifications(): Promise<Notification[]> {
    return notifications;
  },
};
