import React, { useEffect, useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import ClientDetail from './components/ClientDetails/ClientDetail';
import SnsNewsPage from './components/SnsNews/SnsNewsPage';
import SchedulePage from './components/Schedule/SchedulePage';
import NewClientModal from './components/NewClientModal';
import { Client, CreateClientDTO } from './types';
import { clientService } from './services/clientService';
import { Loader2 } from 'lucide-react';
import DirectorBoardPage from './components/DirectorBoard/DirectorBoardPage';

type ViewMode = 'dashboard' | 'news' | 'schedule' | 'director';

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [clientTab, setClientTab] = useState<Client['status']>('pre_contract');
  const [lastError, setLastError] = useState<string | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    setLastError(null);
    try {
      const data = await clientService.getClients();
      setClients(data);
      if (!selectedClientId && data.length > 0) {
        setSelectedClientId(data[0].id);
        setClientTab(data[0].status);
      }
    } catch (error) {
      console.error('Failed to fetch clients', error);
      setLastError('クライアントの取得に失敗しました。サーバー起動をご確認ください。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleCreateClient = async (dto: CreateClientDTO) => {
    try {
      const newClient = await clientService.createClient(dto);
      setClients((prev) => [...prev, newClient]);
      setSelectedClientId(newClient.id);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to create client', error);
      alert('クライアント作成に失敗しました');
    }
  };

  const handleUpdateClient = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setClientTab(updated.status);
  };

  const handleSelectClient = (id: string) => {
    setSelectedClientId(id);
    const found = clients.find((c) => c.id === id);
    if (found) setClientTab(found.status);
    setCurrentView('dashboard');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          <p className="text-slate-500 font-medium">Dashboardを準備しています...</p>
          {lastError && <p className="text-xs text-rose-500">{lastError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar
        clients={clients}
        selectedClientId={selectedClientId}
        onSelectClient={handleSelectClient}
        onOpenNewClientModal={() => setIsModalOpen(true)}
        currentView={currentView}
        onChangeView={setCurrentView}
        activeStatusTab={clientTab}
        onChangeStatusTab={setClientTab}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 bg-white">
        {currentView === 'dashboard' ? (
          selectedClient ? (
            <ClientDetail
              key={selectedClient.id}
              client={selectedClient}
              onUpdateClient={handleUpdateClient}
              onNavigateToNews={() => setCurrentView('news')}
              onStatusTabChange={setClientTab}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">クライアントを選択してください。</div>
          )
        ) : currentView === 'news' ? (
          <SnsNewsPage />
        ) : currentView === 'director' ? (
          <DirectorBoardPage onSelectClient={handleSelectClient} />
        ) : (
          <SchedulePage />
        )}
      </main>

      <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateClient} />
    </div>
  );
};

export default App;
