import React, { useEffect, useMemo, useState } from 'react';
import { clientService } from '../../services/clientService';
import { Task, TaskCategory, TaskStatus } from '../../types';
import { CalendarClock, CircleCheck, CircleDot, CircleOff, Loader2, Plus, TriangleAlert, User } from 'lucide-react';

interface TaskPanelProps {
  clientId: string;
  category: TaskCategory;
  title: string;
  hint?: string;
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'ToDo', color: 'text-slate-500' },
  { value: 'in_progress', label: '進行中', color: 'text-amber-600' },
  { value: 'blocked', label: 'ブロック', color: 'text-rose-600' },
  { value: 'done', label: '完了', color: 'text-emerald-600' },
];

const statusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'done':
      return <CircleCheck className="w-4 h-4 text-emerald-600" />;
    case 'blocked':
      return <TriangleAlert className="w-4 h-4 text-rose-600" />;
    case 'in_progress':
      return <CircleDot className="w-4 h-4 text-amber-600" />;
    default:
      return <CircleDot className="w-4 h-4 text-slate-400" />;
  }
};

const TaskPanel: React.FC<TaskPanelProps> = ({ clientId, category, title, hint }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_date: '', assignee: '' });

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await clientService.getTasks(clientId, category);
      setTasks(data);
    } catch (err) {
      console.error(err);
      alert('タスクの取得に失敗しました。サーバーを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [clientId, category]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const updated = await clientService.updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error(err);
      alert('タスクの更新に失敗しました');
    }
  };

  const handleCreate = async () => {
    if (!newTask.title.trim()) return;
    setCreating(true);
    try {
      const created = await clientService.createTask(clientId, {
        title: newTask.title,
        due_date: newTask.due_date || undefined,
        assignee: newTask.assignee || undefined,
        category,
      });
      setTasks((prev) => [...prev, created]);
      setNewTask({ title: '', due_date: '', assignee: '' });
    } catch (err) {
      console.error(err);
      alert('タスク追加に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  const completion = useMemo(() => {
    if (tasks.length === 0) return null;
    const done = tasks.filter((t) => t.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {hint && <p className="text-sm text-slate-500">{hint}</p>}
        </div>
        {completion !== null && (
          <div className="text-sm text-slate-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
            完了 {completion}%
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> 読み込み中...
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-slate-400 text-sm border border-dashed border-gray-200 rounded-lg p-3">
            まだタスクがありません。追加してください。
          </div>
        ) : (
          tasks.map((task) => {
            const overdue =
              task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
            return (
              <div
                key={task.id}
                className={`border border-gray-100 rounded-lg p-3 flex flex-col gap-2 ${
                  overdue ? 'bg-rose-50/60' : 'bg-gray-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcon(task.status)}
                    <span className="font-medium text-slate-800">{task.title}</span>
                  </div>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                  {task.assignee && (
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assignee}
                    </span>
                  )}
                  {task.due_date && (
                    <span
                      className={`inline-flex items-center gap-1 ${
                        overdue ? 'text-rose-600 font-semibold' : ''
                      }`}
                    >
                      <CalendarClock className="w-3 h-3" />
                      期日: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 bg-white border border-gray-200 rounded-full">
                    {task.source}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-200 pt-3">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="タスク名を入力"
            value={newTask.title}
            onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
            className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="date"
            value={newTask.due_date}
            onChange={(e) => setNewTask((p) => ({ ...p, due_date: e.target.value }))}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            placeholder="担当 (任意)"
            value={newTask.assignee}
            onChange={(e) => setNewTask((p) => ({ ...p, assignee: e.target.value }))}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            追加
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskPanel;
