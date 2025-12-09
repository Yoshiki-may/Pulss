import React, { useState } from 'react';
import { CreateClientDTO, ClientPhase, ClientStatus } from '../types';
import { X } from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientDTO) => void;
}

const phaseOptions: { value: ClientPhase; label: string }[] = [
  { value: 'hearing', label: 'ヒアリング' },
  { value: 'proposal', label: '提案' },
  { value: 'estimate', label: '見積' },
  { value: 'contract', label: '契約' },
  { value: 'kickoff', label: 'キックオフ' },
  { value: 'operation', label: '運用中' },
];

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateClientDTO>({
    name: '',
    industry: '',
    status: 'pre_contract',
    phase: 'hearing',
    sales_owner: '',
    memo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(formData);
      setIsSubmitting(false);
      onClose();
      setFormData({
        name: '',
        industry: '',
        status: 'pre_contract',
        phase: 'hearing',
        sales_owner: '',
        memo: '',
      });
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-800">新規クライアント追加</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">会社名 *</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例：株式会社Pulss"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">業種 *</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="例：美容"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ステータス</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
              >
                <option value="pre_contract">成約前</option>
                <option value="contracted">成約済</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">フェーズ</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white"
              value={formData.phase}
              onChange={(e) => setFormData({ ...formData, phase: e.target.value as ClientPhase })}
            >
              {phaseOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">営業担当</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              value={formData.sales_owner || ''}
              onChange={(e) => setFormData({ ...formData, sales_owner: e.target.value })}
              placeholder="担当者名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">社内メモ</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[80px]"
              value={formData.memo || ''}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="特記事項など..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-70"
            >
              {isSubmitting ? '追加中...' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewClientModal;
