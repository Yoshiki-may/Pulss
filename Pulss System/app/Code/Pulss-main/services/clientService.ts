import {
  AiSuggestion,
  Client,
  ClientPhase,
  ClientStatus,
  CreateClientDTO,
  SnsNewsFilter,
  SnsNewsItem,
  ScheduleEvent,
  CreateScheduleEventDTO,
  Task,
  TaskCategory,
  TaskStatus,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://3.107.236.7:8000';

// ---- Mock Seeds (fallback when API unreachable) ----
const mockClients: Client[] = [
  {
    id: '1',
    name: '焼肉ドブン東京',
    industry: '飲食',
    status: 'contracted',
    phase: 'operation',
    sales_owner: '田中 健',
    director_owner: '佐藤 恵',
    slack_url: 'https://slack.com/archives/C123456',
    memo: 'フランチャイズ展開を検討中。今期は撮影強化がテーマ。',
    onboarding_completed_at: undefined,
    last_contact_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    onboarding_progress: 0.5,
    has_alert: false,
    latest_pulse_response: {
      id: 'resp_1',
      client_id: '1',
      problem: '平日の集客が課題、インバウンド向け施策を強化したい。',
      current_sns: 'Instagram週2投稿、写真の質が課題。',
      target: '20〜30代のカップルと訪日客',
      product_summary: '上質な国産和牛を手頃な価格で提供',
      strengths_usp: '駅近・個室・接客品質の高さ',
      brand_story: '家族経営で30年、地域密着で愛されてきた歴史。',
      reference_accounts: ['https://instagram.com/example'],
      submitted_at: new Date().toISOString(),
    },
  },
  {
    id: '2',
    name: 'Luminous Beauty Salon',
    industry: '美容',
    status: 'pre_contract',
    phase: 'proposal',
    sales_owner: '鈴木 一郎',
    director_owner: undefined,
    slack_url: undefined,
    memo: 'ROI前提の提案が必要。運用開始は来月を想定。',
    onboarding_completed_at: undefined,
    last_contact_at: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    onboarding_progress: 0,
    has_alert: true,
  },
];

let mockTasks: Task[] = [
  {
    id: 't1',
    client_id: '1',
    title: 'アカウント情報取得',
    description: 'Instagramのログイン情報を営業が入手',
    category: 'onboarding',
    status: 'in_progress',
    due_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    assignee: 'sales',
    source: 'template',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't2',
    client_id: '1',
    title: '初回撮影日のドラフト',
    category: 'onboarding',
    status: 'todo',
    due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    assignee: 'director',
    source: 'template',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't3',
    client_id: '1',
    title: '次回撮影の事前連絡文案',
    category: 'operation',
    status: 'todo',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    assignee: 'director',
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockAiSuggestions: AiSuggestion[] = [
  {
    id: 'ai1',
    client_id: '1',
    type: 'touchpoint_message',
    title: '次回撮影前の連絡案',
    body: '・撮影前日に投稿素材の整理をお願いする連絡テンプレートです。\n・店舗の新メニュー写真を事前共有してもらう内容を含めています。',
    status: 'draft',
    created_by: 'ai',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockNews: SnsNewsItem[] = [
  {
    id: '101',
    title: 'Instagramリールがシェア重視にアルゴリズム更新',
    summary: '保存・シェアが主要シグナルに。企画の作り方を見直そう。',
    url: 'https://example.com/ig-update',
    platform_tags: ['instagram'],
    industry_tags: ['food', 'beauty', 'hotel', 'other'],
    source_name: 'Social Media Today',
    published_at: new Date(Date.now() - 86400000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
  {
    id: '102',
    title: 'TikTok SEOで地域キーワードが重要に',
    summary: 'キャプションと音声読み上げを活用してローカル検索を強化する方法。',
    url: 'https://example.com/tiktok-seo',
    platform_tags: ['tiktok'],
    industry_tags: ['food', 'other'],
    source_name: 'Search Engine Land',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
];

// ---- Helpers ----
const request = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
};

const handleError = (e: unknown) => {
  console.error(e);
  return e;
};

// ---- Service ----
export const clientService = {
  async getClients(): Promise<Client[]> {
    try {
      const data = await request('/api/clients');
      return data;
    } catch (e) {
      handleError(e);
      return mockClients;
    }
  },

  async getClient(id: string): Promise<Client | undefined> {
    try {
      const data = await request(`/api/clients/${id}`);
      return data;
    } catch (e) {
      handleError(e);
      return mockClients.find((c) => c.id === id);
    }
  },

  async createClient(payload: CreateClientDTO): Promise<Client> {
    try {
      const data = await request('/api/clients', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data;
    } catch (e) {
      handleError(e);
      const fallback: Client = {
        ...payload,
        id: Math.random().toString(36).slice(2, 9),
        phase: payload.phase || 'hearing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        onboarding_progress: 0,
        has_alert: false,
      };
      mockClients.push(fallback);
      return fallback;
    }
  },

  async updateClient(id: string, payload: Partial<Client>): Promise<Client> {
    try {
      const data = await request(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return data;
    } catch (e) {
      handleError(e);
      mockClients.forEach((c, idx) => {
        if (c.id === id) {
          mockClients[idx] = { ...c, ...payload, updated_at: new Date().toISOString() } as Client;
        }
      });
      return (await this.getClient(id)) as Client;
    }
  },

  async updateClientStatus(id: string, status: ClientStatus): Promise<Client> {
    return this.updateClient(id, { status });
  },

  async updateClientPhase(id: string, phase: ClientPhase): Promise<Client> {
    return this.updateClient(id, { phase });
  },

  async generatePulseUrl(clientId: string): Promise<string> {
    try {
      const data = await request(`/api/clients/${clientId}/pulse-link`, { method: 'POST' });
      return data.url;
    } catch (e) {
      handleError(e);
      return `https://pulse.example.com/form?token=${Math.random().toString(36).slice(2, 10)}&cid=${clientId}`;
    }
  },

  async getTasks(clientId: string, category?: TaskCategory): Promise<Task[]> {
    const qs = category ? `?category=${category}` : '';
    try {
      const data = await request(`/api/clients/${clientId}/tasks${qs}`);
      return data;
    } catch (e) {
      handleError(e);
      return mockTasks.filter((t) => t.client_id === clientId && (!category || t.category === category));
    }
  },

  async createTask(clientId: string, task: Partial<Task>): Promise<Task> {
    try {
      const data = await request(`/api/clients/${clientId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
      });
      return data;
    } catch (e) {
      handleError(e);
      const fallback: Task = {
        id: Math.random().toString(36).slice(2, 9),
        client_id: clientId,
        title: task.title || 'タスク',
        description: task.description,
        category: (task.category as TaskCategory) || 'operation',
        status: (task.status as TaskStatus) || 'todo',
        due_date: task.due_date,
        assignee: task.assignee,
        source: task.source || 'manual',
        template_id: task.template_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockTasks.push(fallback);
      return fallback;
    }
  },

  async updateTask(taskId: string, task: Partial<Task>): Promise<Task> {
    try {
      const data = await request(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(task),
      });
      return data;
    } catch (e) {
      handleError(e);
      mockTasks = mockTasks.map((t) => (t.id === taskId ? { ...t, ...task, updated_at: new Date().toISOString() } : t));
      const found = mockTasks.find((t) => t.id === taskId);
      if (!found) throw e;
      return found;
    }
  },

  async getAiSuggestions(clientId: string): Promise<AiSuggestion[]> {
    try {
      const data = await request(`/api/clients/${clientId}/ai-suggestions`);
      return data;
    } catch (e) {
      handleError(e);
      return mockAiSuggestions.filter((s) => s.client_id === clientId);
    }
  },

  async generateAiSuggestion(clientId: string, context?: Record<string, any>): Promise<AiSuggestion> {
    try {
      const data = await request(`/api/clients/${clientId}/ai-suggestions`, {
        method: 'POST',
        body: JSON.stringify(context || {}),
      });
      return data;
    } catch (e) {
      handleError(e);
      const suggestion: AiSuggestion = {
        id: Math.random().toString(36).slice(2, 9),
        client_id: clientId,
        type: 'touchpoint_message',
        title: 'AIドラフト (オフライン)',
        body: 'サーバー未接続のためローカルドラフトを生成しました。次回撮影日案とトレンド提案を含めてください。',
        status: 'draft',
        created_by: 'ai',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockAiSuggestions.push(suggestion);
      return suggestion;
    }
  },

  // --- Schedule ---
  async getScheduleEvents(date?: string, team?: string): Promise<ScheduleEvent[]> {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (team) params.set('team', team);
    try {
      return await request(`/api/schedules?${params.toString()}`);
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  async createScheduleEvent(payload: CreateScheduleEventDTO): Promise<ScheduleEvent> {
    return request('/api/schedules', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateScheduleEvent(id: string, payload: CreateScheduleEventDTO): Promise<ScheduleEvent> {
    return request(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async deleteScheduleEvent(id: string): Promise<void> {
    await request(`/api/schedules/${id}`, { method: 'DELETE' });
  },

  async getSnsNews(filter?: SnsNewsFilter): Promise<SnsNewsItem[]> {
    const params = new URLSearchParams();
    if (filter?.platform) params.set('platform', filter.platform);
    if (filter?.industry) params.set('industry', filter.industry);
    if (filter?.limit) params.set('limit', String(filter.limit));
    try {
      const res = await fetch(`${API_BASE}/api/sns-news?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch news: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error('SNSニュースの取得に失敗しました。モックデータにフォールバックします', error);
      let items = [...mockNews];
      if (filter?.platform && filter.platform !== 'all') {
        items = items.filter((i) => i.platform_tags.includes(filter.platform as any));
      }
      if (filter?.industry && filter.industry !== 'all') {
        items = items.filter((i) => i.industry_tags.includes(filter.industry as any));
      }
      if (filter?.limit) items = items.slice(0, filter.limit);
      return items;
    }
  },
};
