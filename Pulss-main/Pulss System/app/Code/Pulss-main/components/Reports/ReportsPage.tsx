import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { ReportSnapshot } from '../../types';
import { FileDown, FileSpreadsheet, LineChart } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportSnapshot[]>([]);

  useEffect(() => {
    dashboardService.getReports().then(setReports);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">効果測定レポート</h1>
          <p className="text-sm text-slate-500">月次KPI・ハイライトの共有ビュー</p>
        </div>
        <button className="px-3 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm">
          レポートを生成（AI-12）
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {reports.map((r) => (
          <div key={r.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">クライアントID: {r.client_id}</p>
                <h3 className="text-lg font-semibold text-slate-900">{r.period}</h3>
              </div>
              <LineChart className="w-5 h-5 text-brand-600" />
            </div>
            <p className="text-sm text-slate-700">{r.kpi_summary}</p>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
              {r.highlights.map((h, idx) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
            <div className="flex items-center gap-3 text-sm text-brand-600">
              {r.pdf_url && (
                <a className="flex items-center gap-1 hover:underline" href={r.pdf_url}>
                  <FileDown className="w-4 h-4" />
                  PDF
                </a>
              )}
              {r.csv_url && (
                <a className="flex items-center gap-1 hover:underline" href={r.csv_url}>
                  <FileSpreadsheet className="w-4 h-4" />
                  CSV
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
