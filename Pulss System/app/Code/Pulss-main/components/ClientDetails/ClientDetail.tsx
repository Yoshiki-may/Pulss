import React, { useMemo, useState } from 'react';
import { Client, ClientPhase, ClientStatus } from '../../types';
import { clientService } from '../../services/clientService';
import PulseReport from './PulseReport';
import SnsNewsWidget from './SnsNewsWidget';
import SnsPerformanceWidget from './SnsPerformanceWidget';
import TaskPanel from '../Tasks/TaskPanel';
import AiSuggestionsPanel from '../Ai/AiSuggestionsPanel';
import { Building2, Calendar, Copy, MessageSquarePlus, Slack, Sparkles, User, Check, Loader2 } from 'lucide-react';

interface ClientDetailProps {
  client: Client;
  onUpdateClient: (updatedClient: Client) => void;
  onNavigateToNews: () => void;
  onStatusTabChange: (status: ClientStatus) => void;
}

const phaseOptions: { value: ClientPhase; label: string }[] = [
  { value: 'hearing', label: 'ヒアリング' },
  { value: 'proposal', label: '提案' },
  { value: 'estimate', label: '見積' },
  { value: 'contract', label: '契約' },
  { value: 'kickoff', label: 'キックオフ' },
  { value: 'operation', label: '運用中' },
];

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onUpdateClient, onNavigateToNews, onStatusTabChange }) => {
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'operation' | 'ai'>('overview');
  const [isUpdatingPhase, setIsUpdatingPhase] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editForm, setEditForm] = useState({
    sales_owner: client.sales_owner || '',
    director_owner: client.director_owner || '',
    slack_url: client.slack_url || '',
    memo: client.memo || '',
    last_contact_at: client.last_contact_at
      ? new Date(client.last_contact_at).toISOString().slice(0, 16)
      : '',
  });
  const [savingMeta, setSavingMeta] = useState(false);

  const onboardingProgressText = useMemo(() => {
    if (client.onboarding_progress === null || client.onboarding_progress === undefined) return '—';
    return `${Math.round(client.onboarding_progress * 100)}%`;
  }, [client.onboarding_progress]);

  const handleStatusToggle = async () => {
    try {
      setIsUpdatingStatus(true);
      const newStatus: ClientStatus = client.status === 'pre_contract' ? 'contracted' : 'pre_contract';
      const updated = await clientService.updateClientStatus(client.id, newStatus);
      onUpdateClient(updated);
      onStatusTabChange(newStatus);
    } catch (e) {
      console.error(e);
      alert('ステータスの更新に失敗しました');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePhaseChange = async (phase: ClientPhase) => {
    try {
      setIsUpdatingPhase(true);
      const updated = await clientService.updateClientPhase(client.id, phase);
      onUpdateClient(updated);
    } catch (e) {
      console.error(e);
      alert('フェーズ更新に失敗しました');
    } finally {
      setIsUpdatingPhase(false);
    }
  };

  const handleGeneratePulseUrl = async () => {
    setIsGeneratingUrl(true);
    setGeneratedUrl(null);
    try {
      const url = await clientService.generatePulseUrl(client.id);
      setGeneratedUrl(url);
    } catch (e) {
      console.error(e);
      alert('URLの発行に失敗しました');
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedUrl) return;
    try {
      navigator.clipboard.writeText(generatedUrl);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (e) {
      console.error(e);
      alert('コピーに失敗しました');
    }
  };

  const handleMetaSave = async () => {
    setSavingMeta(true);
    try {
      const payload = {
        ...editForm,
        last_contact_at: editForm.last_contact_at ? new Date(editForm.last_contact_at).toISOString() : null,
      };
      const updated = await clientService.updateClient(client.id, payload as any);
      onUpdateClient(updated);
      setIsEditingMeta(false);
    } catch (e) {
      console.error(e);
      alert('担当情報の更新に失敗しました');
    } finally {
      setSavingMeta(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900">{client.name}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                client.status === 'contracted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {client.status === 'contracted' ? '契約中' : '検討中'}
            </span>
            <select
              value={client.phase}
              disabled={isUpdatingPhase}
              onChange={(e) => handlePhaseChange(e.target.value as ClientPhase)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none"
            >
              {phaseOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="px-2 py-1 text-[11px] rounded-full bg-gray-100 border border-gray-200">
              導入進捗: {onboardingProgressText}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-sm flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {client.industry}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              作成日: {new Date(client.created_at).toLocaleDateString()}
            </span>
            {client.has_alert && (
              <span className="px-2 py-1 text-[11px] rounded-full bg-rose-50 border border-rose-200 text-rose-700">
                アラート: 期限超過/接点不足
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleStatusToggle}
            disabled={isUpdatingStatus}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-slate-700 transition-colors disabled:opacity-50"
          >
            {isUpdatingStatus ? '更新中...' : 'ステータス切替'}
          </button>
          <button
            onClick={handleGeneratePulseUrl}
            disabled={isGeneratingUrl}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70"
          >
            {isGeneratingUrl ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <MessageSquarePlus className="w-4 h-4" />
            )}
            パルスURL発行
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700">担当/連絡先</h3>
        <button
          onClick={() => setIsEditingMeta((v) => !v)}
          className="text-xs px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-slate-600"
        >
          {isEditingMeta ? 'キャンセル' : '編集'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">営業</p>
          {isEditingMeta ? (
            <input
              value={editForm.sales_owner}
              onChange={(e) => setEditForm((p) => ({ ...p, sales_owner: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-2 py-1"
            />
          ) : (
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <User className="w-4 h-4 text-gray-400" />
              {client.sales_owner || '未設定'}
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">ディレクター</p>
          {isEditingMeta ? (
            <input
              value={editForm.director_owner}
              onChange={(e) => setEditForm((p) => ({ ...p, director_owner: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-2 py-1"
            />
          ) : (
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <User className="w-4 h-4 text-gray-400" />
              {client.director_owner || '未設定'}
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">最終接点</p>
          {isEditingMeta ? (
            <input
              type="datetime-local"
              value={editForm.last_contact_at}
              onChange={(e) => setEditForm((p) => ({ ...p, last_contact_at: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-2 py-1"
            />
          ) : (
            <div className="font-medium text-slate-800">
              {client.last_contact_at ? new Date(client.last_contact_at).toLocaleDateString() : '未登録'}
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Slack</p>
          {isEditingMeta ? (
            <input
              value={editForm.slack_url}
              onChange={(e) => setEditForm((p) => ({ ...p, slack_url: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-2 py-1"
              placeholder="https://slack.com/..."
            />
          ) : (
            <div className="flex items-center gap-2">
              {client.slack_url ? (
                <a
                  href={client.slack_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
                >
                  <Slack className="w-4 h-4" />
                  開く
                </a>
              ) : (
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Slack className="w-4 h-4" /> 未設定
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {isEditingMeta && (
        <div className="mb-6 flex flex-col gap-2">
          <textarea
            value={editForm.memo}
            onChange={(e) => setEditForm((p) => ({ ...p, memo: e.target.value }))}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            placeholder="社内メモ"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditingMeta(false)}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-md text-slate-600 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleMetaSave}
              disabled={savingMeta}
              className="text-sm px-4 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {savingMeta ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}

      {/* Tab switch */}
      <div className="flex items-center gap-2 mb-4 border-b border-gray-200">
        {[
          { key: 'overview', label: '概要' },
          { key: 'onboarding', label: '導入タスク' },
          { key: 'operation', label: '運用タスク' },
          { key: 'ai', label: 'AI提案' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              activeTab === tab.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {generatedUrl && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-blue-800">Pulse URLを発行しました:</span>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={generatedUrl}
                    className="flex-1 bg-white border border-blue-200 text-slate-600 text-sm rounded px-3 py-2 focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded font-medium text-sm transition-colors"
                  >
                    {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {hasCopied ? 'コピー済み' : 'コピー'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div>
              {client.latest_pulse_response ? (
                <PulseReport response={client.latest_pulse_response} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center h-full min-h-[300px]">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquarePlus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">まだ回答がありません</h3>
                  <p className="text-slate-500 max-w-sm mb-6 text-sm">
                    Pulse URLを発行し、クライアントに共有してください。回答が届くとレポートがここに表示されます。
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex-1 min-h-[200px]">
                <SnsPerformanceWidget clientId={client.id} />
              </div>
              <div className="flex-1 min-h-[200px] bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">ヒント</p>
                </div>
                <p className="text-sm text-amber-900">
                  パルス回答をもとにAI提案を生成できます。「AI提案」タブからドラフトを作成し、撮影前の連絡や企画案に活用してください。
                </p>
              </div>
            </div>
          </div>

          <hr className="my-8 border-gray-200" />
          <div className="mb-8">
            <SnsNewsWidget industry={client.industry} onViewAll={onNavigateToNews} />
          </div>
        </>
      )}

      {activeTab === 'onboarding' && (
        <TaskPanel
          clientId={client.id}
          category="onboarding"
          title="導入タスク"
          hint="契約後1週間で完了したいタスクを自動生成。期日超過は赤色で表示します。"
        />
      )}

      {activeTab === 'operation' && (
        <TaskPanel
          clientId={client.id}
          category="operation"
          title="運用タスク"
          hint="運用フェーズのフォロー・撮影調整・連絡タスクを管理します。"
        />
      )}

      {activeTab === 'ai' && <AiSuggestionsPanel clientId={client.id} />}
    </div>
  );
};

export default ClientDetail;
