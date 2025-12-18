import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Proposal } from '../../types';
import { CalendarClock, FileText, ArrowRight } from 'lucide-react';

const statusLabel: Record<Proposal['status'], string> = {
  draft: 'ドラフト',
  sent: '送付済み',
  follow_up: 'フォロー中',
  won: '受注',
  lost: '失注',
};

const ProposalBoardPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    dashboardService.getProposals().then(setProposals);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">提案・フォロー</h1>
          <p className="text-sm text-slate-500">提案送付状況とフォロー期日を管理</p>
        </div>
        <button className="px-3 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm">
          提案骨子を生成（AI-04）
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {proposals.map((p) => (
          <div key={p.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">クライアントID: {p.client_id}</p>
                <h3 className="text-lg font-semibold text-slate-900">{p.title}</h3>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {p.plan}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {statusLabel[p.status]}
              </span>
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ¥{p.amount.toLocaleString()}
              </span>
            </div>
            {p.memo && <p className="text-sm text-slate-700 line-clamp-2">{p.memo}</p>}
            <div className="text-xs text-slate-500 space-y-1">
              {p.sent_at && <p>送付: {new Date(p.sent_at).toLocaleDateString()}</p>}
              {p.next_follow_at && (
                <p className="flex items-center gap-1">
                  <CalendarClock className="w-4 h-4" />
                  次フォロー: {new Date(p.next_follow_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-brand-600">
              <button className="flex items-center gap-1 hover:underline">
                <FileText className="w-4 h-4" />
                提案ファイル
              </button>
              <button className="flex items-center gap-1 hover:underline">
                詳細
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProposalBoardPage;
