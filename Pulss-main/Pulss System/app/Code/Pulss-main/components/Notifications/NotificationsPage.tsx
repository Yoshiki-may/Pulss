import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Notification } from '../../types';
import { Bell } from 'lucide-react';

const badge: Record<Notification['type'], string> = {
  task_due: 'タスク期限',
  follow_up: 'フォロー',
  risk: 'リスク',
  info: '情報',
};

const NotificationsPage: React.FC = () => {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    dashboardService.getNotifications().then(setItems);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">通知センター</h1>
          <p className="text-sm text-slate-500">リマインダー・フォロー・リスクを一元管理</p>
        </div>
        <button className="px-3 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm">
          Slack連携（P1）
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white shadow-sm divide-y divide-gray-100">
        {items.map((n) => (
          <div key={n.id} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-600">{n.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-1 rounded-full bg-gray-50 text-slate-700 border border-gray-200">
                {badge[n.type]}
              </span>
              {n.due_at && <span className="text-slate-500">期限: {new Date(n.due_at).toLocaleDateString()}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
