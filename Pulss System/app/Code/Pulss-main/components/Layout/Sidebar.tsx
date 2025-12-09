import React, { useMemo, useState } from 'react';
import { Client, ClientStatus } from '../../types';
import {
  Search,
  Filter,
  Briefcase,
  UserCheck,
  MessageSquare,
  Plus,
  Newspaper,
  Calendar,
  Users,
  AlertTriangle,
} from 'lucide-react';

interface SidebarProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  onOpenNewClientModal: () => void;
  currentView: 'dashboard' | 'news' | 'schedule' | 'director';
  onChangeView: (view: 'dashboard' | 'news' | 'schedule' | 'director') => void;
  activeStatusTab: ClientStatus;
  onChangeStatusTab: (status: ClientStatus) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onOpenNewClientModal,
  currentView,
  onChangeView,
  activeStatusTab,
  onChangeStatusTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  const industries = useMemo(() => {
    const unique = Array.from(new Set(clients.map((c) => c.industry)));
    return ['all', ...unique];
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesTab = client.status === activeStatusTab;
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.memo && client.memo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesIndustry = industryFilter === 'all' || client.industry === industryFilter;
      return matchesTab && matchesSearch && matchesIndustry;
    });
  }, [clients, activeStatusTab, searchQuery, industryFilter]);

  return (
    <div className="w-80 md:w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-sm">
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-widest italic font-serif">Pulss</h1>
        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Client Manager</span>
      </div>

      <div className="p-3 border-b border-gray-100 flex flex-col gap-1">
        <button
          onClick={() => onChangeView('dashboard')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'dashboard' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-gray-50'
          }`}
        >
          <Briefcase className={`w-5 h-5 ${currentView === 'dashboard' ? 'text-brand-500' : 'text-slate-400'}`} />
          クライアント管理
        </button>
        <button
          onClick={() => onChangeView('director')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'director' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-gray-50'
          }`}
        >
          <Users className={`w-5 h-5 ${currentView === 'director' ? 'text-brand-500' : 'text-slate-400'}`} />
          チームレクターボード
        </button>
        <button
          onClick={() => onChangeView('news')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'news' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-gray-50'
          }`}
        >
          <Newspaper className={`w-5 h-5 ${currentView === 'news' ? 'text-brand-500' : 'text-slate-400'}`} />
          SNSニュース
        </button>
        <button
          onClick={() => onChangeView('schedule')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'schedule' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-gray-50'
          }`}
        >
          <Calendar className={`w-5 h-5 ${currentView === 'schedule' ? 'text-brand-500' : 'text-slate-400'}`} />
          スケジュール
        </button>
      </div>

      {currentView === 'dashboard' && (
        <>
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xs uppercase text-slate-500 tracking-wider">クライアント一覧</h2>
              <button
                onClick={onOpenNewClientModal}
                className="p-1.5 bg-brand-50 text-brand-600 rounded-md hover:bg-brand-100 transition-colors"
                title="新規追加"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => onChangeStatusTab('pre_contract')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                  activeStatusTab === 'pre_contract'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                成約前
              </button>
              <button
                onClick={() => onChangeStatusTab('contracted')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                  activeStatusTab === 'contracted'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                成約済
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="検索..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <select
                  className="w-full h-full pl-2 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                >
                  <option value="all">全業種</option>
                  {industries
                    .filter((i) => i !== 'all')
                    .map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                </select>
                <Filter className="absolute right-2 top-2.5 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">クライアントが見つかりません</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <li key={client.id}>
                    <button
                      onClick={() => onSelectClient(client.id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors duration-150 group border-l-4 ${
                        selectedClientId === client.id ? 'bg-brand-50 border-brand-500' : 'border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`font-semibold text-sm line-clamp-1 ${
                            selectedClientId === client.id ? 'text-brand-700' : 'text-slate-800'
                          }`}
                        >
                          {client.name}
                        </span>
                        {client.latest_pulse_response && (
                          <span className="flex-shrink-0 text-brand-500" title="パルス回答あり">
                            <MessageSquare className="w-4 h-4 fill-current" />
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500 gap-2">
                        <span className="px-2 py-0.5 bg-gray-200 rounded-full text-gray-700 text-[10px] font-medium">
                          {client.industry}
                        </span>
                        {client.sales_owner && (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {client.sales_owner.split(' ')[0]}
                          </span>
                        )}
                        {client.has_alert && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {currentView !== 'dashboard' && (
        <div className="flex-1 p-6 text-slate-400 text-sm text-center">
          <p>メイン画面で内容を確認してください。</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
