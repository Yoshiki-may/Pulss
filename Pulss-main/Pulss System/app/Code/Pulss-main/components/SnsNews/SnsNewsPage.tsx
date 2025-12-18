import React, { useEffect, useState } from 'react';
import { SnsNewsItem, SnsPlatform, SnsIndustry } from '../../types';
import { clientService } from '../../services/clientService';
import { Newspaper, Filter, ExternalLink, Calendar, Tag } from 'lucide-react';

const platforms: { value: SnsPlatform | 'all', label: string }[] = [
  { value: 'all', label: '全プラットフォーム' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'other', label: 'その他' },
];

const industries: { value: SnsIndustry | 'all', label: string }[] = [
  { value: 'all', label: '全業種' },
  { value: 'food', label: '飲食' },
  { value: 'beauty', label: '美容' },
  { value: 'hotel', label: 'ホテル・旅行' },
  { value: 'other', label: 'その他' },
];

const SnsNewsPage: React.FC = () => {
  const [news, setNews] = useState<SnsNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<SnsPlatform | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<SnsIndustry | 'all'>('all');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const items = await clientService.getSnsNews({
          platform: platformFilter,
          industry: industryFilter,
          limit: 30
        });
        setNews(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [platformFilter, industryFilter]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-brand-100 p-2 rounded-lg">
            <Newspaper className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SNSニュースセンター</h1>
            <p className="text-sm text-slate-500">SNSマーケティングの最新トレンドやアルゴリズム情報をチェック</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 mt-6">
          <div className="relative">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:bg-gray-50"
            >
              {platforms.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:bg-gray-50"
            >
              {industries.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
            <Tag className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white h-48 rounded-xl border border-gray-200 animate-pulse"></div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            条件に一致するニュースはありません。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map(item => (
              <a
                key={item.id}
                href={item.url || '#'}
                target={item.url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {item.platform_tags.map(tag => (
                      <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${tag === 'instagram' ? 'bg-pink-50 text-pink-600' : 
                          tag === 'tiktok' ? 'bg-slate-100 text-slate-800' :
                          tag === 'youtube' ? 'bg-red-50 text-red-600' :
                          tag === 'x' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600'
                        }
                      `}>
                        {tag}
                      </span>
                    ))}
                    {item.industry_tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {item.summary}
                  </p>
                </div>
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-700">{item.source_name}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div 
                    className="p-2 bg-white border border-gray-200 rounded-full group-hover:bg-brand-50 group-hover:border-brand-200 group-hover:text-brand-600 transition-colors"
                    title={item.url ? '記事を読む' : 'リンクなし'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SnsNewsPage;
