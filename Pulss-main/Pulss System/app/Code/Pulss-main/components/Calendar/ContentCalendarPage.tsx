import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { ContentCalendarItem } from '../../types';
import { Calendar, Play, CheckCircle, Upload } from 'lucide-react';

const statusLabel: Record<ContentCalendarItem['status'], string> = {
  draft: 'ドラフト',
  shooting: '撮影中',
  editing: '編集中',
  review: '確認中',
  ready: '投稿準備',
  posted: '投稿済み',
};

const ContentCalendarPage: React.FC = () => {
  const [items, setItems] = useState<ContentCalendarItem[]>([]);

  useEffect(() => {
    dashboardService.getCalendarItems().then(setItems);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">コンテンツカレンダー</h1>
          <p className="text-sm text-slate-500">撮影 → 編集 → 確認 → 投稿の進捗を管理</p>
        </div>
        <button className="px-3 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm">
          投稿を追加
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">クライアントID: {item.client_id}</p>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {item.platform}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              {item.date}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {statusLabel[item.status]}
              </span>
              {item.owner && <span className="text-slate-600 text-xs">担当: {item.owner}</span>}
            </div>
            <div className="flex items-center gap-3 text-sm text-brand-600">
              <button className="flex items-center gap-1 hover:underline">
                <Play className="w-4 h-4" />
                ステータス変更
              </button>
              <button className="flex items-center gap-1 hover:underline">
                <Upload className="w-4 h-4" />
                素材を確認
              </button>
              <button className="flex items-center gap-1 hover:underline">
                <CheckCircle className="w-4 h-4" />
                投稿完了
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentCalendarPage;
