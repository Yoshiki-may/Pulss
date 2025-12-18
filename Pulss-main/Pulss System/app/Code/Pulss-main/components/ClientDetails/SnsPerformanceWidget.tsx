
import React, { useEffect, useState } from 'react';
import { SnsImpressionData } from '../../types';
import { clientService } from '../../services/clientService';
import { BarChart3 } from 'lucide-react';

interface SnsPerformanceWidgetProps {
  clientId: string;
}

const SnsPerformanceWidget: React.FC<SnsPerformanceWidgetProps> = ({ clientId }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [data, setData] = useState<SnsImpressionData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await clientService.getClientImpressions(clientId, activeTab);
      setData(result);
    };
    fetchData();
  }, [clientId, activeTab]);

  const maxVal = Math.max(...data.map(d => d.impressions)) || 1;

  return (
    <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-4 h-full flex flex-col">
       <div className="flex items-center justify-between mb-4">
         <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            投稿インプレッション
         </h3>
         <div className="flex bg-gray-100 p-0.5 rounded text-xs">
            <button 
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1 rounded transition-colors ${activeTab === 'daily' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
            >
              日次
            </button>
            <button 
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1 rounded transition-colors ${activeTab === 'monthly' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
            >
              月次
            </button>
         </div>
       </div>

       <div className="flex-1 flex items-end gap-2 h-40 pt-4 pb-2">
          {data.map((d, idx) => {
            const heightPerc = (d.impressions / maxVal) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                 <div className="relative w-full flex items-end justify-center h-full">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                      {d.impressions.toLocaleString()} imp
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-full max-w-[24px] bg-blue-500 rounded-t-sm hover:bg-blue-400 transition-colors"
                      style={{ height: `${heightPerc}%` }}
                    ></div>
                 </div>
                 <span className="text-[10px] text-slate-500 mt-2">{d.date}</span>
              </div>
            );
          })}
       </div>
    </div>
  );
};

export default SnsPerformanceWidget;
