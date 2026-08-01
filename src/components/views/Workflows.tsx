import React, { useState } from 'react';
import { Workflow, Plus, Play, Pause, Zap, CheckCircle2, Clock, ArrowRight, Settings, Sparkles, Layers, ShieldAlert, Code2 } from 'lucide-react';
import { useWorkspace } from '../../context';
import { getTranslation } from '../../utils/i18n';

interface WorkflowItem {
  id: string;
  name: string;
  trigger: string;
  channel: string;
  status: 'active' | 'paused';
  runsCount: number;
  lastRun: string;
  creator: string;
}

export function WorkflowsView() {
  const { userLanguage } = useWorkspace();
  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([
    {
      id: 'wf-1',
      name: isArabic ? 'أتمتة الترحيب بأعضاء الفريق الجدد' : 'New Member Onboarding Bot',
      trigger: isArabic ? 'انضمام عضو جديد للقناة' : 'User joins #general channel',
      channel: '#general',
      status: 'active',
      runsCount: 142,
      lastRun: '12 mins ago',
      creator: 'Abdallah Sayed'
    },
    {
      id: 'wf-2',
      name: isArabic ? 'مُجمع تذاكر الدعم والإنذارات' : 'Support Ticket Escalation Workflow',
      trigger: isArabic ? 'تفاعل برموز 🚨 أو 🎫 على رسالة' : 'Reaction 🚨 added to message in #customer-ops',
      channel: '#customer-ops',
      status: 'active',
      runsCount: 89,
      lastRun: '1 hour ago',
      creator: 'Sarah Chen'
    },
    {
      id: 'wf-3',
      name: isArabic ? 'تقرير ملخص المبيعات والصفقات Daily' : 'Daily Sales Deal Brief Automation',
      trigger: isArabic ? 'جدول زمني: كل يوم الساعة 9:00 صباحاً' : 'Scheduled: Daily at 9:00 AM',
      channel: '#sales-crm',
      status: 'paused',
      runsCount: 310,
      lastRun: 'Yesterday',
      creator: 'Omar Hassan'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfTrigger, setNewWfTrigger] = useState('User joins channel');

  const toggleStatus = (id: string) => {
    setWorkflows(prev => prev.map(wf => wf.id === id ? { ...wf, status: wf.status === 'active' ? 'paused' : 'active' } : wf));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) return;
    const newWf: WorkflowItem = {
      id: `wf-${Date.now()}`,
      name: newWfName,
      trigger: newWfTrigger,
      channel: '#general',
      status: 'active',
      runsCount: 0,
      lastRun: 'Just created',
      creator: 'Abdallah Sayed'
    };
    setWorkflows([newWf, ...workflows]);
    setNewWfName('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1A1D21] text-gray-200 overflow-y-auto custom-scrollbar">
      {/* Top Banner Header */}
      <div className="p-6 bg-gradient-to-r from-purple-900/40 via-[#1A1D21] to-[#121317] border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Workflow className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h1 className="text-xl font-bold text-white">{getTranslation(userLanguage, 'workflows')}</h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {getTranslation(userLanguage, 'newBadge')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isArabic 
                  ? 'قم بأتمتة المهام الروتينية، التنبيهات، ونماذج تجميع البيانات مباشرة داخل قنوات سلاك بدون كود.' 
                  : 'Automate routine tasks, custom forms, and notification triggers directly inside Slack channels.'
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{isArabic ? 'إنشاء سير عمل جديد' : 'Create Workflow'}</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-[#14161B] p-3.5 rounded-xl border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">{isArabic ? 'إجمالي الأتمتات النشطة' : 'Active Workflows'}</span>
              <span className="text-lg font-extrabold text-white">{workflows.filter(w => w.status === 'active').length}</span>
            </div>
            <Zap className="h-5 w-5 text-amber-400 opacity-80" />
          </div>

          <div className="bg-[#14161B] p-3.5 rounded-xl border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">{isArabic ? 'عدد مرات التشغيل تلقائياً' : 'Total Executions'}</span>
              <span className="text-lg font-extrabold text-white">{workflows.reduce((acc, w) => acc + w.runsCount, 0)}</span>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400 opacity-80" />
          </div>

          <div className="bg-[#14161B] p-3.5 rounded-xl border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">{isArabic ? 'الوقت الموفر شهرياً' : 'Time Saved / Month'}</span>
              <span className="text-lg font-extrabold text-white">48 hrs</span>
            </div>
            <Clock className="h-5 w-5 text-blue-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Content Workflows List */}
      <div className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          {isArabic ? 'سجلات وأتمتات القنوات' : 'Workspace Channel Workflows'}
        </h2>

        <div className="space-y-3">
          {workflows.map((wf) => (
            <div 
              key={wf.id}
              className="bg-[#14161B] p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition flex items-center justify-between shadow-sm"
            >
              <div className="flex items-start space-x-4 rtl:space-x-reverse">
                <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${wf.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <h3 className="text-sm font-bold text-white">{wf.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {wf.channel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 flex items-center space-x-1 rtl:space-x-reverse">
                    <span>{isArabic ? 'المُحفز:' : 'Trigger:'}</span>
                    <span className="text-gray-300 font-medium">{wf.trigger}</span>
                  </p>
                  <div className="flex items-center space-x-4 rtl:space-x-reverse text-[11px] text-gray-500 mt-2">
                    <span>{isArabic ? 'تم التشغيل:' : 'Executions:'} <strong className="text-white">{wf.runsCount}</strong></span>
                    <span>•</span>
                    <span>{isArabic ? 'آخر أداء:' : 'Last Run:'} <strong className="text-gray-300">{wf.lastRun}</strong></span>
                    <span>•</span>
                    <span>{isArabic ? 'بواسطة:' : 'By:'} <strong className="text-gray-300">{wf.creator}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <button
                  onClick={() => toggleStatus(wf.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer ${
                    wf.status === 'active'
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                  }`}
                >
                  {wf.status === 'active' ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      <span>{isArabic ? 'إيقاف مؤقت' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      <span>{isArabic ? 'تفعيل الان' : 'Activate'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#121317] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {isArabic ? 'إنشاء أتمتة سير عمل جديدة' : 'Create New Workflow Automation'}
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {isArabic ? 'اسم سير العمل' : 'Workflow Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newWfName}
                  onChange={(e) => setNewWfName(e.target.value)}
                  placeholder={isArabic ? 'مثال: ترحيب تلقائي بالقناة...' : 'e.g. Weekly Status Form collector...'}
                  className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {isArabic ? 'حدث البداية (Trigger)' : 'Starting Trigger Event'}
                </label>
                <select
                  value={newWfTrigger}
                  onChange={(e) => setNewWfTrigger(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="User joins channel">{isArabic ? 'انضمام عضو جديد للقناة' : 'User joins channel'}</option>
                  <option value="Emoji reaction added">{isArabic ? 'إضافة تفاعل رمز تعبيري (Emoji)' : 'Emoji reaction added to message'}</option>
                  <option value="Scheduled time trigger">{isArabic ? 'توقيت زمني مجدول (Scheduled Cron)' : 'Scheduled time trigger'}</option>
                  <option value="Webhook trigger">{isArabic ? 'استقبال Webhook من خدمة خارجية' : 'External Webhook trigger'}</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
                >
                  {isArabic ? 'إنشاء سير العمل' : 'Build Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
