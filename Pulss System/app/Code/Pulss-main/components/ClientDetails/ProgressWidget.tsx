
import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight, Edit3, X, Save } from 'lucide-react';
import { ProgressStep, ProgressStatus } from '../../types';

interface ProgressWidgetProps {
  steps?: ProgressStep[];
  onUpdate: (newSteps: ProgressStep[]) => void;
}

const DEFAULT_STEPS: ProgressStep[] = [
  { id: 1, label: 'ヒアリング', status: 'pending', date: '-' },
  { id: 2, label: '提案作成', status: 'pending', date: '-' },
  { id: 3, label: '見積提出', status: 'pending', date: '-' },
  { id: 4, label: '成約・契約', status: 'pending', date: '-' },
  { id: 5, label: 'キックオフ', status: 'pending', date: '-' },
];

const ProgressWidget: React.FC<ProgressWidgetProps> = ({ steps = DEFAULT_STEPS, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editSteps, setEditSteps] = useState<ProgressStep[]>([]);

  const handleEditOpen = () => {
    setEditSteps(JSON.parse(JSON.stringify(steps)));
    setIsEditing(true);
  };

  const handleEditChange = (id: number, field: keyof ProgressStep, value: any) => {
    setEditSteps(prev => prev.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const handleSave = () => {
    onUpdate(editSteps);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-red-100 shadow-sm p-4 h-full flex flex-col relative group">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          対応状況と進捗確認
        </h3>
        <button 
          onClick={handleEditOpen}
          className="text-slate-400 hover:text-brand-600 transition-colors opacity-0 group-hover:opacity-100"
          title="編集"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex flex-col gap-4 relative">
         {/* Vertical connector line */}
         <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100 z-0"></div>

         {steps.map((step) => (
           <div key={step.id} className="flex items-center gap-3 z-10">
             <div className="bg-white p-1 rounded-full">
                {step.status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                ) : step.status === 'current' ? (
                  <Clock className="w-5 h-5 text-blue-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
             </div>
             <div className="flex-1 flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md border border-gray-100 transition-colors hover:border-gray-300">
                <span className={`text-sm font-medium ${step.status === 'current' ? 'text-slate-800' : 'text-slate-500'}`}>
                  {step.label}
                </span>
                <span className="text-xs text-slate-400 font-mono">{step.date}</span>
             </div>
           </div>
         ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
         <button 
            onClick={handleEditOpen}
            className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 w-full"
         >
            進捗を更新する <ArrowRight className="w-3 h-3" />
         </button>
      </div>

      {/* Edit Modal Overlay */}
      {isEditing && (
        <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm rounded-lg flex flex-col p-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h4 className="font-bold text-slate-700 text-sm">進捗の編集</h4>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {editSteps.map(step => (
              <div key={step.id} className="flex flex-col gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-700">{step.label}</span>
                  <select
                    value={step.status}
                    onChange={(e) => handleEditChange(step.id, 'status', e.target.value)}
                    className={`text-xs p-1 rounded border font-medium focus:outline-none ${
                      step.status === 'done' ? 'text-green-600 bg-green-50 border-green-200' :
                      step.status === 'current' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                      'text-gray-500 bg-white border-gray-200'
                    }`}
                  >
                    <option value="pending">未着手 (Pending)</option>
                    <option value="current">進行中 (Current)</option>
                    <option value="done">完了 (Done)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 uppercase">日付/状況:</span>
                  <input
                    type="text"
                    value={step.date}
                    onChange={(e) => handleEditChange(step.id, 'date', e.target.value)}
                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="日付を入力"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-2 flex gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 py-1.5 text-xs font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 rounded"
            >
              キャンセル
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded flex items-center justify-center gap-1"
            >
              <Save className="w-3 h-3" /> 保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressWidget;
