import React, { useState } from 'react';
import { AppWindow, CheckCircle2, Plus, ExternalLink, Zap, Shield, Search, Star } from 'lucide-react';
import { useWorkspace } from '../../context';
import { getTranslation } from '../../utils/i18n';

interface AppItem {
  id: string;
  name: string;
  category: string;
  desc: string;
  iconBg: string;
  installed: boolean;
  rating: number;
}

export function AppsView() {
  const { userLanguage } = useWorkspace();
  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');

  const [apps, setApps] = useState<AppItem[]>([
    {
      id: 'app-gdrive',
      name: 'Google Drive & Workspace',
      category: 'File Management & Docs',
      desc: isArabic ? 'مشاركة مستندات Google ورسائل تنبيه التعليقات مباشرة في Slack' : 'Share Google Docs, Sheets, and get direct comment notifications.',
      iconBg: 'bg-blue-600',
      installed: true,
      rating: 4.9
    },
    {
      id: 'app-github',
      name: 'GitHub Integrations',
      category: 'Developer Tools',
      desc: isArabic ? 'تنبيهات Pull Requests والإنذارات البرمجية فوراً على القنوات' : 'Get instant pull request alerts, issue assignments, and build status.',
      iconBg: 'bg-gray-800',
      installed: true,
      rating: 4.8
    },
    {
      id: 'app-jira',
      name: 'Jira Cloud',
      category: 'Project Management',
      desc: isArabic ? 'إنشاء ومتابعة تذاكر المهام وتحديث حالة المشروعات' : 'Create, track, and manage Jira issues right from Slack DMs.',
      iconBg: 'bg-blue-700',
      installed: false,
      rating: 4.7
    },
    {
      id: 'app-zoom',
      name: 'Zoom Meetings',
      category: 'Video Communications',
      desc: isArabic ? 'بدء اجتماعات الفيديو الفورية بكتابة /zoom في أي قناة' : 'Start instant HD video meetings by typing /zoom in any channel.',
      iconBg: 'bg-blue-500',
      installed: true,
      rating: 4.9
    },
    {
      id: 'app-zapier',
      name: 'Zapier Webhooks',
      category: 'Workflow Automation',
      desc: isArabic ? 'ربط سلاك بأكثر من 5,000 تطبيق ويب وأتمتة المهام تلقائياً' : 'Connect Slack with 5,000+ apps and automate cross-platform triggers.',
      iconBg: 'bg-orange-600',
      installed: false,
      rating: 4.8
    },
    {
      id: 'app-figma',
      name: 'Figma Design',
      category: 'Design & Collaboration',
      desc: isArabic ? 'تلقي تعليقات وملفات التصميم مباشرة في قنوات الفريق' : 'Live design updates and comment threads sent directly to Slack channels.',
      iconBg: 'bg-purple-600',
      installed: false,
      rating: 4.8
    }
  ]);

  const toggleInstall = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, installed: !a.installed } : a));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1A1D21] text-gray-200 overflow-y-auto custom-scrollbar">
      {/* Top Banner Header */}
      <div className="p-6 bg-gradient-to-r from-emerald-900/30 via-[#1A1D21] to-[#121317] border-b border-gray-800">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <AppWindow className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <h1 className="text-xl font-bold text-white">{getTranslation(userLanguage, 'apps')}</h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {getTranslation(userLanguage, 'newBadge')}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isArabic
                ? 'ربط أدوات وتطبيقات العمل الخارجية لمساحة عمل سلاك لتوليد التنبيهات والأتمتة التلقائية.'
                : 'Connect external tools, GitHub, Google Drive, and Zoom to your Slack workspace.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Apps Grid */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
            {isArabic ? 'التطبيقات والتكاملات المتاحة' : 'Available Enterprise Integrations'}
          </h2>
          <span className="text-xs text-emerald-400 font-bold">
            {apps.filter(a => a.installed).length} {isArabic ? 'تطبيقات مثبتة' : 'Installed'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <div key={app.id} className="bg-[#14161B] p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${app.iconBg} text-white font-extrabold flex items-center justify-center text-sm shadow`}>
                    {app.name.charAt(0)}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{app.rating}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{app.name}</h3>
                  <span className="text-[10px] text-gray-500 font-mono block">{app.category}</span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{app.desc}</p>
              </div>

              <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={() => toggleInstall(app.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer ${
                    app.installed
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                  }`}
                >
                  {app.installed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isArabic ? 'مثبت بنجاح' : 'Installed'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isArabic ? 'تثبيت التطبيق' : 'Add to Slack'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
