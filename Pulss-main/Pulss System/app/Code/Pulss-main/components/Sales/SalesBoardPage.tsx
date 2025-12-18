import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Lead } from '../../types';
import { Filter, Phone, ArrowUpRight } from 'lucide-react';

const statusLabel: Record<Lead['status'], string> = {
  new: '新規',
  calling: '架電中',
  meeting: '商談予定',
  proposal_sent: '提案送付済',
  follow_up: 'フォロー中',
  lost: '失注',
  won: '受注',
};

const rankLabel = { high: '高', medium: '中', low: '低' };

const SalesBoardPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    dashboardService.getLeads().then(setLeads);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">リード一覧</h1>
          <p className="text-sm text-slate-500">営業〜CS共有のリード/商談ボード</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg text-slate-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          フィルタ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {leads.map((lead) => (
          <div key={lead.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-slate-500">{lead.industry}</p>
                <h3 className="text-lg font-semibold text-slate-900">{lead.company}</h3>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-slate-700 border border-gray-200">
                {lead.owner}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {statusLabel[lead.status]}
              </span>
              <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                ランク: {rankLabel[lead.rank]}
              </span>
              {lead.expected_mrr ? (
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ¥{lead.expected_mrr.toLocaleString()}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-700 line-clamp-2 mb-3">{lead.memo}</p>
            <div className="text-xs text-slate-500 mb-3 space-y-1">
              {lead.last_action_at && <p>最終接点: {new Date(lead.last_action_at).toLocaleDateString()}</p>}
              {lead.next_action_at && <p>次アクション: {new Date(lead.next_action_at).toLocaleDateString()}</p>}
            </div>
            <div className="flex items-center justify-between text-sm text-brand-600">
              <button className="flex items-center gap-1 hover:underline">
                <Phone className="w-4 h-4" />
                コンタクトを記録
              </button>
              <button className="flex items-center gap-1 hover:underline">
                詳細
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesBoardPage;
