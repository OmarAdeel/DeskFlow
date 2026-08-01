import React, { useState } from 'react';
import { Sparkles, MessageSquare, Flame, Lightbulb, RefreshCw, Send, ArrowRight, Bot, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '../../context';
import { getTranslation } from '../../utils/i18n';

export function AIDigestView() {
  const { userLanguage, channels, messages } = useWorkspace();
  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customResponse, setCustomResponse] = useState<string | null>(null);

  const channelSummaries = [
    {
      channel: '#announcements',
      topic: isArabic ? 'إطلاق الإصدار الجديد من النظام وإعدادات الأمان' : 'System Production Release v2.4 & Security Updates',
      keyTakeaways: [
        isArabic ? 'تم تحديث خوادم قاعدة البيانات وتطبيق أمان جديد.' : 'Database clusters upgraded with zero downtime.',
        isArabic ? 'جلسة التدريب الإداري يوم الخميس القادم.' : 'Super Admin governance training scheduled for Thursday.'
      ],
      sentiment: isArabic ? 'إيجابي ومحفز جداً' : 'Highly Positive & Active'
    },
    {
      channel: '#customer-ops',
      topic: isArabic ? 'حل مشكلات التكامل وتسريع استجابة الدعم' : 'API Rate Limit resolution & customer tickets',
      keyTakeaways: [
        isArabic ? 'تم حل 94% من البلاغات المقدمة خلال هذا الأسبوع.' : '94% of customer escalations resolved within SLA.',
        isArabic ? 'فريق الدعم بحاجة لتأكيد تحديثات OAuth.' : 'OAuth scope consent updates distributed to tier-2 tech support.'
      ],
      sentiment: isArabic ? 'مستقر ومحتوى' : 'Stable & Productive'
    }
  ];

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setCustomResponse(
        isArabic 
          ? `بناءً على المحادثات الأخيرة في مساحة العمل: يتعلق استفسارك "${aiPrompt}" بآخر تحديثات القنوات الرئيسية (#announcements, #customer-ops). يبدو أن جميع الفرق تعمل بكفاءة عالية على تحسين تجربة المستخدم وأمان البيانات.`
          : `Based on your team workspace context for "${aiPrompt}": Recent discussion threads across #announcements and #customer-ops indicate high progress on platform stability and user governance.`
      );
      setAiPrompt('');
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1A1D21] text-gray-200 overflow-y-auto custom-scrollbar">
      {/* Top AI Header */}
      <div className="p-6 bg-gradient-to-r from-amber-900/30 via-[#1A1D21] to-[#121317] border-b border-gray-800">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-inner">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <h1 className="text-xl font-bold text-white">{getTranslation(userLanguage, 'aiDigest')}</h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {getTranslation(userLanguage, 'newBadge')}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isArabic
                ? 'مساعد الذكاء الاصطناعي الذكي لتلخيص القنوات والمحادثات المترابطة والإجابة عن أي تساؤل في مساحة العمل.'
                : 'Smart Slack AI Assistant to summarize channel unreads, thread discussions, and answer workspace queries.'
              }
            </p>
          </div>
        </div>

        {/* Ask AI Box */}
        <form onSubmit={handleAskAI} className="mt-6 relative">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={isArabic ? 'اسأل الذكاء الاصطناعي أي سؤال عن مساحة العمل... (مثال: ما هي أهم قرارات الاجتماع الأخير؟)' : 'Ask Slack AI anything about your workspace channels...'}
            className="w-full px-4 py-3 bg-[#14161B] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="absolute right-2 top-2 bottom-2 rtl:right-auto rtl:left-2 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer shadow"
          >
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{isArabic ? 'تحليل وإجابة' : 'Summarize'}</span>
          </button>
        </form>
      </div>

      {/* Main Container */}
      <div className="p-6 space-y-6">
        {customResponse && (
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-900/10 p-4 rounded-xl border border-amber-500/30 space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-amber-400 font-bold text-xs">
              <Bot className="h-4 w-4" />
              <span>{isArabic ? 'إجابة مساعد Slack AI:' : 'Slack AI Response:'}</span>
            </div>
            <p className="text-xs text-gray-200 leading-relaxed">{customResponse}</p>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2 rtl:space-x-reverse">
            <Flame className="h-4 w-4 text-amber-400" />
            <span>{isArabic ? 'الملخص اليومي التلقائي للقنوات' : 'Daily Automated Channel Recaps'}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channelSummaries.map((item, idx) => (
              <div key={idx} className="bg-[#14161B] p-5 rounded-2xl border border-gray-800 space-y-3 shadow-md hover:border-gray-700 transition">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 font-mono text-xs font-bold border border-amber-500/20">
                    {item.channel}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                    {item.sentiment}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{item.topic}</h3>

                <div className="space-y-1.5 pt-1">
                  {item.keyTakeaways.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-start space-x-2 rtl:space-x-reverse text-xs text-gray-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
