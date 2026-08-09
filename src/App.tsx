import React, { useState, useEffect, useRef } from 'react';
import { Home, Hash, MessageSquare, Headphones, Menu, Bell } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { ActivityBar } from './components/ActivityBar';
import { ViewType } from './types';
import { UnreadsView } from './components/views/Unreads';
import { ConversationsView } from './components/views/Conversations';
import { FollowUppersView } from './components/views/FollowUppers';
import { CanvasView } from './components/views/Canvas';
import { FilesView } from './components/views/Files';
import { WorkspaceSettingsView } from './components/views/WorkspaceSettings';
import { HomeView } from './components/views/Home';
import { DMsView } from './components/views/DMs';
import { KPIsView } from './components/views/KPIs';
import { MeetingsView } from './components/views/Meetings';
import { PlaceholderView } from './components/views/Placeholder';

import { DraftsView } from './components/views/Drafts';
import { DirectoriesView } from './components/views/Directories';
import { HuddlesView } from './components/views/Huddles';
import { ChannelView } from './components/views/Channel';
import { ThreadsView } from './components/views/Threads';
import { LaterView } from './components/views/Later';
import { CRMView } from './components/views/CRM';
import { MailView } from './components/views/Mail';
import { WorkflowsView } from './components/views/Workflows';
import { AIDigestView } from './components/views/AIDigest';
import { ClipsView } from './components/views/Clips';
import { AppsView } from './components/views/Apps';
import { NewMessageModal } from './components/NewMessageModal';
import { UserProfileModal } from './components/UserProfileModal';
import { FloatingHuddleWidget } from './components/FloatingHuddleWidget';
import { IncomingCallNotification } from './components/IncomingCallNotification';
import { canAccessChannel, useWorkspace } from './context';
import { LoginScreen } from './components/LoginScreen';
import { LoadingSplash } from './components/LoadingSplash';

export default function App() {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    isAuthenticated,
    isAuthInitialized,
    isPasswordRecovery,
    channels,
    users,
    currentUser,
    activeOrganizationId,
    dmUnreadByUserId
  } = useWorkspace();

  const [currentView, setCurrentView] = useState<ViewType>('unreads');
  const [currentChannelId, setCurrentChannelId] = useState<string>('4');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };

  const stopResizing = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      setSidebarWidth(Math.max(200, Math.min(e.clientX - 72, 600))); // 72 is ActivityBar width
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    const visibleChannels = channels.filter(channel => canAccessChannel(channel, currentUser, activeOrganizationId));
    const visibleDmUsers = users.filter(user =>
      (!activeOrganizationId || user.organizationIds?.includes(activeOrganizationId))
    );
    const currentSelectionIsInvalid = currentView === 'channel'
      ? !visibleChannels.some(channel => channel.id === currentChannelId)
      : currentView === 'dms'
        ? !visibleDmUsers.some(user => user.id === currentChannelId)
        : false;

    if (!currentSelectionIsInvalid) return;

    if (currentView === 'dms') {
      // DMs use the same selection slot as channels. When opening the view
      // without a recipient (for example from the mobile bottom nav), select
      // the first teammate instead of treating the previous channel id as an
      // invalid DM and navigating away from the view.
      const fallbackDm = visibleDmUsers.find(user => user.id !== currentUser?.id) || visibleDmUsers[0];
      if (fallbackDm) {
        setCurrentChannelId(fallbackDm.id);
      }
      return;
    }

    setCurrentView('home');
    setCurrentChannelId(visibleChannels[0]?.id || '');
  }, [activeOrganizationId, channels, users, currentUser, currentView, currentChannelId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') as ViewType;
    const channelId = params.get('channelId') || params.get('userId');
    const messageId = params.get('messageId');
    const replyId = params.get('replyId');
    if (view) {
      setCurrentView(view);
    }
    if (channelId) {
      setCurrentChannelId(channelId);
    }
    if (messageId) {
      setTimeout(() => {
        const threadEvent = new CustomEvent('open-thread', {
          detail: { messageId, replyId }
        });
        window.dispatchEvent(threadEvent);
      }, 300);
    }
  }, []);

  useEffect(() => {
    const callCode = new URLSearchParams(window.location.search).get('call');
    if (!callCode || !isAuthenticated || !currentUser) return;
    setCurrentView('huddles');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('join-shared-call', { detail: { code: callCode } }));
    }, 250);
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    const handleSharedCallJoin = (event: Event) => {
      const code = (event as CustomEvent<{ code?: string }>).detail?.code;
      if (code) window.dispatchEvent(new CustomEvent('start-shared-huddle', { detail: { code } }));
    };
    const handleNav = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        if (detail.channelId) {
          setCurrentChannelId(detail.channelId);
        }
        if (detail.view) {
          setCurrentView(detail.view as ViewType);
        }
        if (detail.messageId) {
          setTimeout(() => {
            const threadEvent = new CustomEvent('open-thread', {
              detail: { messageId: detail.messageId, replyId: detail.replyId }
            });
            window.dispatchEvent(threadEvent);
          }, 200);
        }
      }
    };

    const handleOpenModal = () => setIsNewMessageModalOpen(true);

    window.addEventListener('workspace-navigate', handleNav);
    window.addEventListener('open-new-message-modal', handleOpenModal);
    window.addEventListener('join-shared-call', handleSharedCallJoin);

    return () => {
      window.removeEventListener('workspace-navigate', handleNav);
      window.removeEventListener('open-new-message-modal', handleOpenModal);
      window.removeEventListener('join-shared-call', handleSharedCallJoin);
    };
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigateToView = (view: ViewType, channelId?: string) => {
    if (view === 'dms' && !channelId) {
      const fallbackDm = users.find(user =>
        user.id !== currentUser?.id && (!activeOrganizationId || user.organizationIds?.includes(activeOrganizationId))
      ) || users.find(user => !activeOrganizationId || user.organizationIds?.includes(activeOrganizationId));
      if (fallbackDm) setCurrentChannelId(fallbackDm.id);
    } else if (channelId) {
      setCurrentChannelId(channelId);
    }
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={navigateToView} />;
      case 'unreads':
        return <UnreadsView onNavigate={navigateToView} />;
      case 'dms':
        return <DMsView userId={currentChannelId} />;
      case 'conversations':
        return <ConversationsView />;
      case 'follow-ups':
        return <FollowUppersView onNavigate={navigateToView} />;
      case 'canvas':
        return <CanvasView />;
      case 'files':
        return <FilesView />;
      case 'settings':
      case 'workspace-settings':
        return <WorkspaceSettingsView />;
      case 'crm':
        return <CRMView />;
      case 'mail':
        return <MailView />;
      case 'workflows':
        return <WorkflowsView />;
      case 'ai-digest':
        return <AIDigestView />;
      case 'clips':
        return <ClipsView />;
      case 'apps':
        return <AppsView />;
      case 'kpis':
        return <KPIsView onNavigate={navigateToView} initialSelectedUserId={currentChannelId} />;
      case 'meetings':
        return <MeetingsView />;
      case 'drafts':
        return <DraftsView onNavigate={navigateToView} />;
      case 'directories':
        return <DirectoriesView />;
      case 'threads':
        return <ThreadsView onNavigate={navigateToView} />;
      case 'later':
        return <LaterView onNavigate={navigateToView} title="Later" />;
      case 'starred':
        return <LaterView onNavigate={navigateToView} title="Starred" />;
      case 'channel':
        return <ChannelView channelId={currentChannelId} onNavigate={navigateToView} />;
      case 'activity':
      case 'more':
        return <PlaceholderView viewId={currentView} />;
      default:
        return (
          <div className="flex-1 bg-[#1A1D21] flex items-center justify-center text-gray-500">
            <p>Select an item to view</p>
          </div>
        );
    }
  };

  if (!isAuthInitialized) return <LoadingSplash />;

  if (!isAuthenticated || isPasswordRecovery) return <LoginScreen />;

  return (
    <div className="flex bg-[#121317] font-sans h-screen overflow-hidden text-gray-300 relative">
      <IncomingCallNotification />
      {/* ActivityBar: Desktop only */}
      <div className="hidden md:flex shrink-0">
        <ActivityBar currentView={currentView} onNavigate={setCurrentView} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 flex min-h-0 relative">
          
          {/* Desktop Sidebar */}
          <div className="hidden md:flex shrink-0 h-full">
            <Sidebar 
              currentView={currentView} 
              currentChannelId={currentChannelId} 
              onViewChange={navigateToView} 
              onOpenNewMessage={() => setIsNewMessageModalOpen(true)}
              width={sidebarWidth} 
            />
          </div>
          
          {/* Resizer bar: Desktop only */}
          <div 
            className="hidden md:block w-1 cursor-col-resize z-10 shrink-0 select-none bg-[#121317] border-r border-[#2A2B32]/50 hover:bg-blue-500 hover:border-blue-500 transition-colors"
            onMouseDown={startResizing}
          ></div>

          {/* Main Content View Container */}
          <main className="flex-1 relative overflow-hidden flex flex-col bg-[#1A1D21] w-full pb-14 md:pb-0">
            <div className={`absolute inset-0 flex-col ${currentView === 'huddles' ? 'flex z-10' : 'hidden z-[-1]'}`}>
              <HuddlesView />
            </div>
            <div className={`absolute inset-0 flex-col z-0 ${currentView !== 'huddles' ? 'flex' : 'hidden'}`}>
              {currentView !== 'huddles' && renderView()}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121317]/95 backdrop-blur-xl border-t border-gray-800/80 flex items-center justify-around h-14 px-1 text-gray-400 select-none">
        <button
          onClick={() => navigateToView('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${currentView === 'home' ? 'text-blue-400 font-bold' : 'hover:text-gray-200'}`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>
        <button
          onClick={() => navigateToView('channel')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${currentView === 'channel' ? 'text-blue-400 font-bold' : 'hover:text-gray-200'}`}
        >
          <Hash className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Channels</span>
        </button>
        <button
          onClick={() => navigateToView('dms')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${currentView === 'dms' ? 'text-blue-400 font-bold' : 'hover:text-gray-200'}`}
        >
          <span className="relative">
            <MessageSquare className="h-5 w-5" />
            {Object.values(dmUnreadByUserId as Record<string, number>).some((count: number) => count > 0) && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" aria-label="Unread direct messages" />}
          </span>
          <span className="text-[10px] mt-0.5">DMs</span>
        </button>
        <button
          onClick={() => navigateToView('huddles')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer relative ${currentView === 'huddles' ? 'text-blue-400 font-bold' : 'hover:text-gray-200'}`}
        >
          <Headphones className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Huddles</span>
        </button>
        <button
          onClick={() => navigateToView('unreads')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${currentView === 'unreads' ? 'text-blue-400 font-bold' : 'hover:text-gray-200'}`}
        >
          <Bell className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Activity</span>
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer hover:text-gray-200"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </div>

      {/* Mobile Drawer Slide-over Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Slide-in Sidebar Panel */}
          <div className="relative z-10 flex flex-row h-full max-w-[320px] w-full bg-[#121317] shadow-2xl animate-fade-in border-r border-gray-800">
            <ActivityBar currentView={currentView} onNavigate={navigateToView} />
            <div className="flex-1 h-full overflow-hidden">
              <Sidebar 
                currentView={currentView} 
                currentChannelId={currentChannelId} 
                onViewChange={navigateToView} 
                onOpenNewMessage={() => {
                  setIsNewMessageModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                width={250} 
              />
            </div>
          </div>
        </div>
      )}

      <NewMessageModal 
        isOpen={isNewMessageModalOpen} 
        onClose={() => setIsNewMessageModalOpen(false)} 
        onNavigate={navigateToView} 
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onNavigateToWorkspaceSettings={() => navigateToView('workspace-settings')}
      />

      <FloatingHuddleWidget 
        currentView={currentView} 
        onNavigate={navigateToView} 
      />
    </div>
  );
}


