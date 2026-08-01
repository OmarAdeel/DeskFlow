import { Plus } from 'lucide-react';
import { ViewType } from '../types';
import { useWorkspace } from '../context';

interface ActivityBarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export function ActivityBar({ currentView, onNavigate }: ActivityBarProps) {
  const { setIsProfileModalOpen, userStatus, currentUser } = useWorkspace();

  const getStatusBg = () => {
    switch (userStatus) {
      case 'Away': return 'bg-amber-500';
      case 'Do Not Disturb': return 'bg-red-500';
      case 'In a Meeting': return 'bg-purple-500';
      default: return 'bg-[#4CAF50]';
    }
  };

  return (
    <div className="w-[64px] bg-[#121317] flex flex-col items-center h-full border-r border-[#2A2B32]/50 shrink-0 py-3">
      {/* Workspace / Organization Avatar */}
      <div 
        onClick={() => onNavigate('home')}
        className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors relative group border border-gray-700 shadow-sm"
        title="Demo Company Enterprise Workspace"
      >
        <div className="text-white text-xl font-bold tracking-tighter">V</div>
        <div className="absolute -bottom-1 -right-1 bg-teal-500 w-3.5 h-3.5 rounded-full border-2 border-[#121317]"></div>
      </div>

      <div className="flex-1 w-full" />

      {/* User Actions at bottom */}
      <div className="mt-auto flex flex-col items-center space-y-4 pt-4 w-full">
         <button 
          onClick={() => onNavigate('workspace-settings')}
          className="w-9 h-9 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
          title="Add Integration & Workspace Settings"
        >
            <Plus className="h-5 w-5" />
         </button>
         <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="w-9 h-9 rounded-lg bg-[#4CAF50] hover:brightness-110 text-[#121317] font-extrabold flex items-center justify-center border-2 border-[#121317] relative cursor-pointer shadow-md transition transform hover:scale-105"
          title="My Profile, Language & Preferences"
        >
            {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
            <div className={`absolute -bottom-1 -right-1 ${getStatusBg()} text-white w-3.5 h-3.5 flex items-center justify-center rounded-full border-2 border-[#121317] shadow-sm`}>
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
         </button>
      </div>
    </div>
  );
}
