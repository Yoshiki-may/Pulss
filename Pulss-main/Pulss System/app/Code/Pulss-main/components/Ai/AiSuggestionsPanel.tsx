import React, { useEffect, useState } from 'react';
import { clientService } from '../../services/clientService';
import { AiSuggestion } from '../../types';
import { Bot, Loader2, Sparkles } from 'lucide-react';

interface AiSuggestionsPanelProps {
  clientId: string;
}

const AiSuggestionsPanel: React.FC<AiSuggestionsPanelProps> = ({ clientId }) => {
  const [items, setItems] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await clientService.getAiSuggestions(clientId);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [clientId]);

  const handleGenerate = async () => {
    setGenerating(true);
    const created = await clientService.generateAiSuggestion(clientId);
    setItems((prev) => [created, ...prev]);
    setGenerating(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900">AI提案ドラフト</h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          生成
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> 読み込み中...
        </div>
      ) : items.length === 0 ? (
        <div className="text-slate-400 text-sm border border-dashed border-gray-200 rounded-lg p-3">
          まだ提案がありません。生成ボタンでドラフトを作成してください。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">{s.title}</div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-white border border-gray-200">
                  {s.status}
                </span>
              </div>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-5 bg-white border border-gray-100 rounded-md p-2">
                {s.body}
              </pre>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>種別: {s.type}</span>
                <span>{new Date(s.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiSuggestionsPanel;
