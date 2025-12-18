import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Client, Contract } from '../../types';
import { clientService } from '../../services/clientService';
import { FileText, CalendarRange } from 'lucide-react';

const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    dashboardService.getContracts().then(setContracts);
    clientService.getClients().then(setClients);
  }, []);

  const nameFor = (id: string) => clients.find((c) => c.id === id)?.name || `ID: ${id}`;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">契約 / クライアントレポート</h1>
        <p className="text-sm text-slate-500">契約情報とキックオフ用レポートビュー</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {contracts.map((ct) => (
          <div key={ct.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">{nameFor(ct.client_id)}</p>
                <h3 className="text-lg font-semibold text-slate-900">{ct.plan}</h3>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ¥{ct.amount.toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4" />
                {ct.start_date.slice(0, 10)} {ct.end_date ? `〜 ${ct.end_date.slice(0, 10)}` : ''}
              </p>
              <p>請求サイクル: {ct.billing_cycle}</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-brand-600">
              <button className="flex items-center gap-1 hover:underline">
                <FileText className="w-4 h-4" />
                契約書
              </button>
              <button className="flex items-center gap-1 hover:underline">クライアントレポート</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractsPage;
