import React, { useEffect, useMemo, useRef, useState } from 'react';
import { pulssChatService } from '../../services/pulssChatService';
import { Loader2, Send, AlertTriangle, MessageSquare } from 'lucide-react';

type ChatMessage = { id: string; from: 'user' | 'assistant'; text: string };

interface Props {
  clientId?: string;
  token?: string;
}

const PulssSystemChatPage: React.FC<Props> = ({ clientId, token }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { resolvedClientId, resolvedToken } = useMemo(() => {
    if (clientId && token) return { resolvedClientId: clientId, resolvedToken: token };
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean); // ["pulss-system", clientId, token]
      return { resolvedClientId: parts[1] || '', resolvedToken: parts[2] || '' };
    }
    return { resolvedClientId: '', resolvedToken: '' };
  }, [clientId, token]);

  useEffect(() => {
    const init = async () => {
      try {
        setInitializing(true);
        setError(null);
        const res = await pulssChatService.startFromLink(resolvedClientId, resolvedToken);
        setSessionId(res.session_id);
        setClientName(res.client_name || null);
        setMessages([{ id: crypto.randomUUID(), from: 'assistant', text: res.first_message }]);
      } catch (e: any) {
        console.error(e);
        const msg =
          e?.status === 404
            ? 'このリンクは無効か、有効期限が切れています。'
            : 'サーバーエラーが発生しました。時間をおいて再試行してください。';
        setError(msg);
      } finally {
        setInitializing(false);
      }
    };
    if (resolvedClientId && resolvedToken) init();
  }, [resolvedClientId, resolvedToken]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await pulssChatService.sendMessage(sessionId, text);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: 'assistant', text: res.assistant_message }]);
      if (res.done) {
        setDone(true);
      }
    } catch (e) {
      console.error(e);
      setError('メッセージ送信に失敗しました。時間をおいて再試行してください。');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>接続中です...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="font-semibold">エラー</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gradient-to-br from-slate-50 to-white flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">PULSS SYSTEM</p>
            <h1 className="text-2xl font-bold text-slate-900">SNS運用ヒアリングチャット</h1>
            {clientName && <p className="text-sm text-slate-500 mt-1">クライアント: {clientName}</p>}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            自動応答で要件定義をサポートします
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
        <div
          ref={scrollRef}
          className="flex-1 border border-slate-200 rounded-xl bg-white shadow-sm p-4 overflow-y-auto min-h-[320px] max-h-[60vh]"
        >
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    m.from === 'assistant'
                      ? 'bg-slate-50 border border-slate-200 text-slate-800'
                      : 'bg-brand-600 text-white'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {done && (
          <div className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-lg px-4 py-3 text-sm">
            ありがとうございます。レポートを最終確定しました。担当者からのご連絡をお待ちください。
          </div>
        )}

        <div className="border border-slate-200 bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
          <label className="text-xs text-slate-500">メッセージを入力してください</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!sessionId || loading || done}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 disabled:text-slate-400"
            rows={3}
            placeholder="例: 現在のSNS運用状況や目標を教えてください"
          />
          <div className="flex items-center justify-end">
            <button
              onClick={handleSend}
              disabled={!sessionId || loading || done || !input.trim()}
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              送信
            </button>
          </div>
          {done && (
            <p className="text-xs text-slate-500">
              送信済みの内容は担当者が確認します。追加で伝えたいことがある場合は担当者に直接ご連絡ください。
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default PulssSystemChatPage;
