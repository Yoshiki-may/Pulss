import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Notification } from '../../types';
import TaskPanel from './TaskPanel';

// Simple board combining onboarding/operation with reminders
const TasksBoardPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    dashboardService.getNotifications().then(setNotifications);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">タスク / 標準フロー</h1>
          <p className="text-sm text-slate-500">導入〜運用タスクの進行とリマインダー</p>
        </div>
        <button className="px-3 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm">
          標準テンプレを生成
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-slate-800">導入タスク</h2>
          </div>
          <div className="p-4">
            <TaskPanel clientId="1" category="onboarding" title="導入タスク" />
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-slate-800">運用タスク</h2>
          </div>
          <div className="p-4">
            <TaskPanel clientId="1" category="operation" title="運用タスク" />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">リマインダー</h2>
          <span className="text-xs text-slate-500">P0 通知センター簡易版</span>
        </div>
        <div className="divide-y divide-gray-100">
          {notifications.map((n) => (
            <div key={n.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-600">{n.message}</p>
              </div>
              {n.due_at && (
                <span className="text-xs text-slate-500">
                  期限: {new Date(n.due_at).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TasksBoardPage;
