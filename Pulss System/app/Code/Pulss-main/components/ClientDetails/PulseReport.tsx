import React from 'react';
import { PulseResponse } from '../../types';
import { FileText, Target, Instagram, ExternalLink, HelpCircle, Sparkles, BookOpen } from 'lucide-react';

interface PulseReportProps {
  response: PulseResponse;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="mb-4 last:mb-0">
    <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-sm uppercase tracking-wide">
      {icon}
      <span>{title}</span>
    </div>
    <div className="bg-white p-4 rounded-lg border border-gray-200 text-slate-700 text-sm leading-relaxed shadow-sm">
      {children}
    </div>
  </div>
);

const PulseReport: React.FC<PulseReportProps> = ({ response }) => {
  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-brand-500 rounded-full"></span>
          パルス要件レポート
        </h3>
        <span className="text-xs text-slate-500">受信日: {new Date(response.submitted_at).toLocaleDateString()}</span>
      </div>

      <Section title="課題・要望" icon={<HelpCircle className="w-4 h-4 text-orange-500" />}>
        <p className="whitespace-pre-wrap">{response.problem || '—'}</p>
      </Section>

      <Section title="現状のSNS運用" icon={<Instagram className="w-4 h-4 text-pink-500" />}>
        <p className="whitespace-pre-wrap">{response.current_sns || '—'}</p>
      </Section>

      <Section title="ターゲット・ゴール" icon={<Target className="w-4 h-4 text-blue-500" />}>
        <p className="whitespace-pre-wrap">{response.target || '—'}</p>
      </Section>

      <Section title="プロダクト概要" icon={<FileText className="w-4 h-4 text-slate-600" />}>
        <p className="whitespace-pre-wrap">{response.product_summary || '—'}</p>
      </Section>

      <Section title="強み・USP" icon={<Sparkles className="w-4 h-4 text-amber-500" />}>
        <p className="whitespace-pre-wrap">{response.strengths_usp || '—'}</p>
      </Section>

      <Section title="ブランドストーリー" icon={<BookOpen className="w-4 h-4 text-emerald-600" />}>
        <p className="whitespace-pre-wrap">{response.brand_story || '—'}</p>
      </Section>

      {response.reference_accounts && response.reference_accounts.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">参考アカウント / 参考リンク</h4>
          <ul className="space-y-2">
            {response.reference_accounts.map((url, idx) => (
              <li key={idx}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 hover:underline bg-white px-3 py-2 rounded border border-gray-200"
                >
                  <ExternalLink className="w-3 h-3" />
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PulseReport;
