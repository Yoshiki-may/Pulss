import React, { useEffect, useState } from 'react';
import { clientService } from '../../services/clientService';
import { Client } from '../../types';
import { AlertTriangle, CheckCircle, Clock3, Loader2, Users } from 'lucide-react';

interface BoardItem {
  client_id: string;
  name: string;
  phase: Client['phase'];
  status: Client['status'];
  onboarding_progress?: number;
  open_tasks_count: number;
  last_contact_at?: string;
  has_alert: boolean;
}

interface Props {
  onSelectClient: (id: string) => void;
}

const phaseLabel: Record<Client['phase'], string> = {
  hearing: 'ヒアリング',
  proposal: '提案',
  estimate: '見積',
  contract: '契約',
  kickoff: 'キックオフ',
  operation: '運用中',
};

const DirectorBoardPage: React.FC<Props> = ({ onSelectClient }) => {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://3.107.236.7:8000'}/api/director-board/clients`);
      if (!data.ok) throw new Error('failed');
      setItems(await data.json());
    } catch (e) {
      console.error(e);
      setError('ダッシュボードの取得に失敗しました。サーバー起動を確認してください。');
      const clients = await clientService.getClients();
      setItems(
        clients.map((c) => ({
          client_id: c.id,
          name: c.name,
          phase: c.phase,
          status: c.status,
          onboarding_progress: c.onboarding_progress,
          open_tasks_count: 0,
          last_contact_at: c.last_contact_at,
          has_alert: Boolean(c.has_alert),
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  return (
    <div className="flex-1 p-6 md:p-10 bg-white overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-600" />
          <h1 className="text-2xl font-bold text-slate-900">チームレクターボード</h1>
        </div>
        <button
          onClick={fetchBoard}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
        >
          更新
        </button>
      </div>
      <p className="text-slate-600 mb-6">
        全案件のフェーズ、タスク進行、アラートを一覧で俯瞰できます。行をクリックすると詳細へ移動します。
      </p>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 text-xs font-semibold uppercase text-slate-500 bg-gray-50 px-4 py-2">
          <div>クライアント</div>
          <div>フェーズ</div>
          <div>ステータス</div>
          <div>導入進捗</div>
          <div>未完タスク</div>
          <div>最終接点</div>
          <div>アラート</div>
        </div>
        {loading ? (
          <>
            <div className="p-6 flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> 読み込み中...
            </div>
            {error && <div className="px-6 pb-3 text-xs text-rose-500">{error}</div>}
          </>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-400 text-sm">データがありません。</div>
        ) : (
          items.map((item) => (
            <button
              key={item.client_id}
              onClick={() => onSelectClient(item.client_id)}
              className="w-full grid grid-cols-7 px-4 py-3 text-sm text-left border-t border-gray-100 hover:bg-brand-50/60 transition-colors"
            >
              <div className="font-semibold text-slate-800">{item.name}</div>
              <div className="text-slate-600">{phaseLabel[item.phase]}</div>
              <div className="text-slate-600">{item.status === 'contracted' ? '契約' : '検討中'}</div>
              <div className="text-slate-700">
                {item.onboarding_progress !== undefined && item.onboarding_progress !== null
                  ? `${Math.round(item.onboarding_progress * 100)}%`
                  : '-'}
              </div>
              <div className="text-slate-700">{item.open_tasks_count}</div>
              <div className="text-slate-600">
                {item.last_contact_at ? new Date(item.last_contact_at).toLocaleDateString() : '-'}
              </div>
              <div className="flex items-center">
                {item.has_alert ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
        <AlertTriangle className="w-4 h-4 text-rose-600" />
        <span>期限超過タスク・最終接点14日以上・導入未完了のいずれかでアラート</span>
        <Clock3 className="w-4 h-4 text-amber-600" />
        <span>フェーズやステータスはクライアント詳細で変更可能</span>
      </div>
    </div>
  );
};

export default DirectorBoardPage;
