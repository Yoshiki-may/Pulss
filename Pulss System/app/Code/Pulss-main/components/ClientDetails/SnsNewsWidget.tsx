import React, { useEffect, useState } from 'react';
import { SnsNewsItem, SnsIndustry } from '../../types';
import { clientService } from '../../services/clientService';
import { Newspaper, ArrowRight, ExternalLink } from 'lucide-react';

interface SnsNewsWidgetProps {
  industry: string;
  onViewAll: () => void;
}

const mapIndustryToTag = (rawIndustry: string): SnsIndustry | 'other' => {
  const lower = rawIndustry.toLowerCase();
  if (lower.includes('飲食') || lower.includes('food') || lower.includes('yakiniku') || lower.includes('restaurant')) return 'food';
  if (lower.includes('美容') || lower.includes('beauty') || lower.includes('salon')) return 'beauty';
  if (lower.includes('ホテル') || lower.includes('hotel') || lower.includes('travel')) return 'hotel';
  return 'other';
};

const SnsNewsWidget: React.FC<SnsNewsWidgetProps> = ({ industry, onViewAll }) => {
  const [news, setNews] = useState<SnsNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const tag = mapIndustryToTag(industry);
      try {
        const items = await clientService.getSnsNews({ industry: tag, limit: 5 });
        setNews(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [industry]);

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;
  if (news.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-brand-500" />
          {industry} 向けの最新SNSニュース
        </h3>
        <button onClick={onViewAll} className="text-xs text-brand-600 font-medium hover:text-brand-800 flex items-center gap-1">
          もっと見る <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {news.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-6 py-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-slate-800 group-hover:text-brand-700 leading-tight mb-1">{item.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase text-[10px]">{item.platform_tags[0]}</span>
                  <span>{new Date(item.published_at).toLocaleDateString()}</span>
                  <span>・</span>
                  <span>{item.source_name}</span>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SnsNewsWidget;
