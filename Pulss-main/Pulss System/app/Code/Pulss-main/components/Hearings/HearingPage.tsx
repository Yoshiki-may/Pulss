import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { HearingRecord, HomeworkLink } from '../../types';
import { Link2, MessageSquare } from 'lucide-react';

const HearingPage: React.FC = () => {
  const [hearings, setHearings] = useState<HearingRecord[]>([]);
  const [homeworks, setHomeworks] = useState<HomeworkLink[]>([]);

  useEffect(() => {
    dashboardService.getHearings().then(setHearings);
    dashboardService.getHomeworkLinks().then(setHomeworks);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ヒアリング / 宿題</h1>
          <p className="text-sm text-slate-500">商談メモと宿題URLの管理</p>
        </div>
        <button className="px-3 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm">
          宿題URLを発行
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hearings.map((h) => (
          <div key={h.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900">クライアントID: {h.client_id}</h3>
              <span className="text-xs text-slate-500">{new Date(h.meeting_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-slate-700 mb-3">{h.summary}</p>
            {h.todo && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">ToDo: {h.todo}</p>}
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">宿題URL一覧</h2>
          <div className="text-xs text-slate-500">AI-02/03 連携の導線</div>
        </div>
        <div className="divide-y divide-gray-100">
          {homeworks.map((hw) => (
            <div key={hw.id} className="px-4 py-3 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-slate-800">クライアントID: {hw.client_id}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Link2 className="w-4 h-4" />
                  <a className="text-brand-600 hover:underline" href={hw.url} target="_blank" rel="noreferrer">
                    {hw.url}
                  </a>
                  <span>発行: {new Date(hw.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  hw.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 text-slate-600 border-gray-200'
                }`}
              >
                {hw.status === 'completed' ? '回答あり' : '回答待ち'}
              </span>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          宿題回答をAIで背景レポートに反映（AI-03）する導線をここに追加予定
        </div>
      </div>
    </div>
  );
};

export default HearingPage;
