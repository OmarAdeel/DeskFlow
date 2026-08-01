import React, { useState } from 'react';
import { Video, Mic, Play, Pause, Square, Sparkles, Send, Share2, Eye, MessageSquare, Volume2 } from 'lucide-react';
import { useWorkspace } from '../../context';
import { getTranslation } from '../../utils/i18n';

export function ClipsView() {
  const { userLanguage } = useWorkspace();
  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');

  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);

  const sampleClips = [
    {
      id: 'clip-1',
      title: isArabic ? 'شرح التحديث الأخير في واجهة المستخدم' : 'UI Redesign & Arabic RTL Demo Walkthrough',
      author: 'Abdallah Sayed',
      duration: '01:45',
      channel: '#product-dev',
      date: '2 hours ago',
      views: 18,
      transcript: isArabic 
        ? 'مرحباً بالفريق، هذا تسجيل سريع يستعرض تطبيق ألوان سلاك الرسمية مع دعم اتجاه RTL الكامل باللغة العربية.'
        : 'Hey team, quick video walk-through demonstrating Slack official themes and full Arabic RTL layout support.'
    },
    {
      id: 'clip-2',
      title: isArabic ? 'تحديث الإدارة وتحديد أهداف الربع الحالي' : 'Quarterly Executive Update & Q3 Goals',
      author: 'Sarah Chen',
      duration: '02:10',
      channel: '#general',
      date: 'Yesterday',
      views: 42,
      transcript: isArabic
        ? 'نقاط هامة تناقش توسيع التكاملات البرمجية وأتمتة سير العمل.'
        : 'Key points discussing workspace integration scaling and workflow builder adoption.'
    }
  ];

  const handleRecordToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordedTime(1);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1A1D21] text-gray-200 overflow-y-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-900/30 via-[#1A1D21] to-[#121317] border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Video className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h1 className="text-xl font-bold text-white">{getTranslation(userLanguage, 'clips')}</h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {getTranslation(userLanguage, 'newBadge')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isArabic
                  ? 'سجّل وشارك مقاطع الفيديو والملاحظات الصوتية السريعة مع فريقك مع تفريغ صوتي تلقائي بالذكاء الاصطناعي.'
                  : 'Record and share asynchronous audio & video clips with automatic AI transcriptions.'
                }
              </p>
            </div>
          </div>

          {/* Record Button */}
          <button
            onClick={handleRecordToggle}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 rtl:space-x-reverse cursor-pointer shadow-lg ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span>
              {isRecording 
                ? (isArabic ? 'إيقاف التسجيل (00:12)' : 'Stop Recording (00:12)')
                : (isArabic ? 'تسجيل مقطع صوت/فيديو' : 'Record New Clip')
              }
            </span>
          </button>
        </div>
      </div>

      {/* Main Clips List */}
      <div className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          {isArabic ? 'تسجيلات المقاطع الأخيرة في القنوات' : 'Recent Workspace Clips & Transcripts'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleClips.map((clip) => (
            <div key={clip.id} className="bg-[#14161B] rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition shadow-md flex flex-col justify-between">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                    {clip.channel}
                  </span>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-[11px] text-gray-400">
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                    <span>{clip.views} {isArabic ? 'مشاهدة' : 'views'}</span>
                    <span>•</span>
                    <span>{clip.duration}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white">{clip.title}</h3>

                {/* Simulated Waveform / Audio Player bar */}
                <div className="bg-[#1A1D21] p-3 rounded-xl border border-gray-800 flex items-center space-x-3 rtl:space-x-reverse">
                  <button className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 cursor-pointer shadow">
                    <Play className="h-4 w-4 ml-0.5" />
                  </button>
                  <div className="flex-1 h-3 flex items-center space-x-1 rtl:space-x-reverse">
                    <div className="h-full w-1 bg-blue-500 rounded"></div>
                    <div className="h-2/3 w-1 bg-blue-500/60 rounded"></div>
                    <div className="h-full w-1 bg-blue-500 rounded"></div>
                    <div className="h-1/2 w-1 bg-gray-700 rounded"></div>
                    <div className="h-4/5 w-1 bg-blue-500 rounded"></div>
                    <div className="h-1/3 w-1 bg-gray-700 rounded"></div>
                    <div className="h-full w-1 bg-blue-500 rounded"></div>
                  </div>
                  <Volume2 className="h-4 w-4 text-gray-400 shrink-0" />
                </div>

                {/* AI Transcript Box */}
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 text-xs text-gray-300">
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-amber-400 font-bold text-[11px] mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isArabic ? 'التفريغ النصي التلقائي (AI Transcript):' : 'Slack AI Auto-Transcript:'}</span>
                  </div>
                  <p className="italic text-gray-400">"{clip.transcript}"</p>
                </div>
              </div>

              <div className="px-5 py-3 bg-[#121317] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>{clip.author} • {clip.date}</span>
                <button className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
                  {isArabic ? 'الرد بالقناة' : 'Reply in Channel'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
