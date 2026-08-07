import { Plus, Building2, Check } from 'lucide-react';
import { ViewType } from '../types';
import { useWorkspace } from '../context';
import deskflowLogo from '../assets/deskflow-logo.png';
import { PresenceDot } from './UserAvatar';

interface ActivityBarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export function ActivityBar({ currentView, onNavigate }: ActivityBarProps) {
  const {
    setIsProfileModalOpen,
    currentUser,
    presenceByUserId,
    accessibleOrganizations,
    activeOrganizationId,
    setActiveOrganizationId
  } = useWorkspace();

  const currentPresence = currentUser ? presenceByUserId[currentUser.id]?.status || 'offline' : 'offline';

  return (
    <div className="w-[64px] bg-[#121317] flex flex-col items-center h-full border-r border-[#2A2B32]/50 shrink-0 py-3">
      {/* Workspace / Organization switcher */}
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          type="button"
          onClick={() => onNavigate('workspace-settings')}
          className="w-10 h-10 rounded-xl bg-gray-800/80 border border-dashed border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-400 transition-colors cursor-pointer"
          title="Add organization"
          aria-label="Add organization"
        >
          <Plus className="h-5 w-5" />
        </button>

        {accessibleOrganizations.map(organization => (
          <button
            key={organization.id}
            type="button"
            onClick={() => {
              setActiveOrganizationId(organization.id);
              onNavigate('home');
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors relative group border shadow-sm ${
              organization.id === activeOrganizationId
                ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-500/30'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
            }`}
            title={`Switch to ${organization.name}`}
            aria-label={`Switch to ${organization.name}`}
          >
            {organization.logoUrl ? (
              <img src={organization.logoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <img src={deskflowLogo} alt="DeskFlow" className="h-full w-full rounded-xl bg-black object-contain" />
            )}
            {organization.id === activeOrganizationId && (
              <Check className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full bg-blue-500 text-white border border-[#121317] p-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 w-full" />

      {/* User Actions at bottom */}
      <div className="mt-auto flex flex-col items-center space-y-4 pt-4 w-full">

         <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="w-9 h-9 rounded-lg bg-[#4CAF50] hover:brightness-110 text-[#121317] font-extrabold flex items-center justify-center border-2 border-[#121317] relative cursor-pointer shadow-md transition transform hover:scale-105"
          title="My Profile, Language & Preferences"
        >
            {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full rounded-lg object-cover" /> : (currentUser?.name ? currentUser.name.charAt(0) : 'A')}
            <PresenceDot status={currentPresence} className="absolute -bottom-1 -right-1 h-3.5 w-3.5" />
         </button>
      </div>
    </div>
  );
}
