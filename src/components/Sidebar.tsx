import { 
  AlignLeft, MessageSquare, Headphones, FileEdit, Book, Star, 
  Hash, Lock, ChevronDown, Plus, Settings, ChevronRight, Edit, Shield, LayoutGrid,
  Mail, Kanban, CheckSquare, MessageCircle, Folder, Home, Bell, Bookmark, BarChart3,
  Workflow, Sparkles, Video, AppWindow, MoreHorizontal
} from 'lucide-react';
import { ViewType } from '../types';
import { useWorkspace } from '../context';
import { getTranslation } from '../utils/i18n';
import { useState } from 'react';

interface SidebarProps {
  currentView: ViewType;
  currentChannelId?: string;
  width?: number;
  onViewChange: (view: ViewType, channelId?: string) => void;
  onOpenNewMessage?: () => void;
}

export function Sidebar({ currentView, currentChannelId, width = 260, onViewChange, onOpenNewMessage }: SidebarProps) {
  const { workspaceName, channels, users, setIsProfileModalOpen, userLanguage } = useWorkspace();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');

  const NavItem = ({ icon: Icon, label, view, active, isBold, iconClass, id, isNew }: any) => (
    <button
      onClick={() => view && onViewChange(view, id)}
      className={`flex items-center w-full px-4 py-1 text-[13px] transition-colors rounded-md mx-2 ${
        active 
          ? 'bg-[#2B4BCA] text-white font-medium shadow-sm' 
          : `text-gray-400 hover:bg-[#2A2B32]/70 hover:text-gray-200 ${isBold ? 'text-gray-200 font-bold' : ''}`
      }`}
      style={{ width: 'calc(100% - 16px)' }}
    >
      <Icon className={`h-4 w-4 shrink-0 ${isArabic ? 'ml-2.5' : 'mr-2.5'} ${iconClass || 'opacity-70'}`} strokeWidth={active ? 2.5 : 2} />
      <span className="truncate flex-1 text-left rtl:text-right">{label}</span>
      {isNew && (
        <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
          {getTranslation(userLanguage, 'newBadge')}
        </span>
      )}
    </button>
  );

  const SectionHeader = ({ label, icon: Icon }: { label: string, icon?: any }) => (
    <div className="flex items-center px-4 py-1.5 mt-3 group cursor-pointer text-gray-400 hover:text-gray-300">
      {Icon ? <Icon className={`h-3 w-3 ${isArabic ? 'ml-1.5' : 'mr-1.5'} opacity-70`} strokeWidth={2.5} /> : <div className="w-4.5" />}
      <span className="text-[13px] font-medium flex-1 truncate">{label}</span>
    </div>
  );

  return (
    <div style={{ width: `${width}px` }} className="bg-[#121317] flex flex-col h-full shrink-0">
      {/* Workspace Header */}
      <div className="h-14 flex flex-col justify-center px-4 mb-1 cursor-pointer transition-colors group">
        <div className="flex justify-between items-center text-gray-200 group-hover:text-white">
          <div 
            onClick={() => onViewChange('workspace-settings')}
            className="flex items-center font-bold text-lg hover:text-blue-400 transition cursor-pointer"
          >
            {workspaceName}
            <ChevronDown className={`h-4 w-4 ${isArabic ? 'mr-1' : 'ml-1'} opacity-70`} strokeWidth={3} />
          </div>
          <div className="flex space-x-1.5 rtl:space-x-reverse text-gray-400">
             <button 
               onClick={() => onViewChange('workspace-settings')} 
               className="p-1.5 hover:bg-gray-800 rounded text-gray-200 transition-colors cursor-pointer"
               title={getTranslation(userLanguage, 'workspaceSettings')}
             >
               <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
             </button>
             <button 
               onClick={() => onOpenNewMessage ? onOpenNewMessage() : window.dispatchEvent(new CustomEvent('open-new-message-modal'))}
               className="p-1.5 hover:bg-gray-800 text-gray-200 rounded transition-colors cursor-pointer"
               title="New Message"
             >
               <Edit className="h-[18px] w-[18px]" strokeWidth={2} />
             </button>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        <div className="space-y-[2px]">
          <NavItem icon={Home} label={getTranslation(userLanguage, 'home')} view="home" active={currentView === 'home'} />
          <NavItem icon={AlignLeft} label={getTranslation(userLanguage, 'unreads')} view="unreads" active={currentView === 'unreads'} />
          <NavItem icon={MessageSquare} label={getTranslation(userLanguage, 'threads')} view="threads" active={currentView === 'threads'} />
          <NavItem icon={MessageCircle} label={getTranslation(userLanguage, 'conversations')} view="conversations" active={currentView === 'conversations'} />
          <NavItem icon={CheckSquare} label={getTranslation(userLanguage, 'followups')} view="follow-ups" active={currentView === 'follow-ups'} />
          <NavItem icon={Mail} label={getTranslation(userLanguage, 'mail')} view="mail" active={currentView === 'mail'} />
          <NavItem icon={Kanban} label={getTranslation(userLanguage, 'crm')} view="crm" active={currentView === 'crm'} />
          <NavItem icon={Bookmark} label={getTranslation(userLanguage, 'later')} view="later" active={currentView === 'later'} />
          <NavItem icon={Headphones} label={getTranslation(userLanguage, 'huddles')} view="huddles" active={currentView === 'huddles'} />
          <NavItem icon={FileEdit} label={getTranslation(userLanguage, 'drafts')} view="drafts" active={currentView === 'drafts'} />
          <NavItem icon={Book} label={getTranslation(userLanguage, 'directories')} view="directories" active={currentView === 'directories'} />
          <NavItem icon={LayoutGrid} label={getTranslation(userLanguage, 'canvas')} view="canvas" active={currentView === 'canvas'} />
          <NavItem icon={Folder} label={getTranslation(userLanguage, 'files')} view="files" active={currentView === 'files'} />
          <NavItem icon={BarChart3} label={getTranslation(userLanguage, 'kpis')} view="kpis" active={currentView === 'kpis'} />
          
          <div 
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="flex items-center px-4 py-1.5 mt-2 mb-1 group cursor-pointer text-gray-400 hover:text-gray-300 transition-colors"
          >
            {isMoreOpen ? <ChevronDown className={`h-3 w-3 ${isArabic ? 'ml-1.5' : 'mr-1.5'} opacity-70`} strokeWidth={2.5} /> : <ChevronRight className={`h-3 w-3 ${isArabic ? 'ml-1.5' : 'mr-1.5'} opacity-70`} strokeWidth={2.5} />}
            <span className="text-[13px] font-medium flex-1 truncate">{isArabic ? 'المزيد' : 'More'}</span>
          </div>

          {isMoreOpen && (
            <div className="space-y-[2px]">
              <NavItem icon={Sparkles} label={getTranslation(userLanguage, 'aiDigest')} view="ai-digest" active={currentView === 'ai-digest'} isNew={true} iconClass="text-amber-400" />
              <NavItem icon={Workflow} label={getTranslation(userLanguage, 'workflows')} view="workflows" active={currentView === 'workflows'} isNew={true} iconClass="text-purple-400" />
              <NavItem icon={Video} label={getTranslation(userLanguage, 'clips')} view="clips" active={currentView === 'clips'} isNew={true} iconClass="text-blue-400" />
              <NavItem icon={AppWindow} label={getTranslation(userLanguage, 'apps')} view="apps" active={currentView === 'apps'} isNew={true} iconClass="text-emerald-400" />
            </div>
          )}
        </div>

        <SectionHeader label={getTranslation(userLanguage, 'starred')} icon={Star} />

        <SectionHeader label={getTranslation(userLanguage, 'channels')} icon={ChevronDown} />
        <div className="space-y-[2px]">
          {channels.map((channel) => (
            <NavItem 
              key={channel.id} 
              id={channel.id}
              icon={channel.isPrivate ? Lock : Hash} 
              label={channel.name} 
              view="channel" 
              active={currentView === 'channel' && currentChannelId === channel.id} 
              isBold={!channel.isPrivate} 
              iconClass={!channel.isPrivate ? "text-gray-300" : undefined} 
            />
          ))}
        </div>

        <SectionHeader label={getTranslation(userLanguage, 'directMessages')} icon={ChevronDown} />
        <div className="space-y-[2px] px-2">
          {users.filter(u => u.name !== 'Abdallah Sayed').map((user) => {
             const isSelected = currentView === 'dms' && currentChannelId === user.id;
             return (
               <button 
                 key={user.id} 
                 onClick={() => onViewChange('dms', user.id)}
                 className={`flex items-center w-full px-2 py-1 text-[13px] transition-colors rounded-md cursor-pointer ${
                   isSelected 
                     ? 'bg-[#2B4BCA] text-white font-medium shadow-sm' 
                     : 'text-gray-400 hover:bg-[#2A2B32]/70 hover:text-gray-200'
                 }`}
               >
                 <div className={`w-[18px] h-[18px] rounded overflow-hidden ${isArabic ? 'ml-2' : 'mr-2'} shrink-0 bg-gray-700 flex items-center justify-center relative`}>
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=b6e3f4`} alt={user.name} className="w-full h-full object-cover" />
                 </div>
                 <span className="truncate flex-1 text-left rtl:text-right">{user.name}</span>
               </button>
             );
          })}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => onViewChange('dms', '8')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onViewChange('dms', '8');
              }
            }}
            className={`flex items-center w-full px-2 py-1 text-[13px] transition-colors rounded-md cursor-pointer group/me select-none ${
              currentView === 'dms' && currentChannelId === '8'
                ? 'bg-[#2B4BCA] text-white font-medium shadow-sm'
                : 'text-gray-400 hover:bg-[#2A2B32]/70 hover:text-gray-200'
            }`}
          >
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileModalOpen(true);
              }}
              className={`w-[18px] h-[18px] rounded bg-[#4CAF50] hover:brightness-125 ${isArabic ? 'ml-2' : 'mr-2'} shrink-0 text-[#121317] font-bold flex flex-col items-center justify-center text-[10px] leading-none cursor-pointer shadow-sm transition transform hover:scale-110`}
              title="Click avatar to select Language & Theme preferences"
            >
              A
            </div>
            <span className="truncate flex-1 text-left rtl:text-right">Abdallah Sayed <span className="text-gray-500 mx-1 text-[11px]">{isArabic ? '(أنت)' : 'you'}</span></span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileModalOpen(true);
              }}
              className="opacity-0 group-hover/me:opacity-100 p-0.5 text-gray-400 hover:text-blue-300 transition text-[10px] font-bold cursor-pointer"
              title="Preferences"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Governance / Admin Direct Link */}
        <div className="mt-4 pt-3 border-t border-gray-800/60 px-2">
          <button
            onClick={() => onViewChange('workspace-settings')}
            className={`flex items-center w-full px-2.5 py-1.5 text-xs transition-colors rounded-lg ${
              currentView === 'workspace-settings' 
                ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30' 
                : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
            }`}
          >
            <Shield className={`h-4 w-4 text-emerald-400 ${isArabic ? 'ml-2' : 'mr-2'}`} />
            <span className="truncate flex-1 text-left rtl:text-right">{getTranslation(userLanguage, 'adminGovernance')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

