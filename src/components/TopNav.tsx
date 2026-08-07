import { Clock, HelpCircle, ArrowLeft, ArrowRight, Globe, Menu, ChevronDown, LogOut, UserCircle, Download, Bell, BellOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../context';
import { getTranslation } from '../utils/i18n';
import { useWebAppFeatures } from '../hooks/useWebAppFeatures';
import { PresenceDot } from './UserAvatar';

interface TopNavProps {
  onOpenMobileMenu?: () => void;
}

export function TopNav({ onOpenMobileMenu }: TopNavProps) {
  const { setIsProfileModalOpen, userLanguage, currentUser, presenceByUserId, logout } = useWorkspace();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const { installAvailable, isInstalled, installApp, notificationPermission, notificationsEnabled, toggleNotifications } = useWebAppFeatures();
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');

  useEffect(() => {
    const closeAccountMenu = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeAccountMenu);
    return () => document.removeEventListener('pointerdown', closeAccountMenu);
  }, []);

  return (
    <div className="h-12 border-b border-gray-800/50 bg-[#121317] flex items-center justify-between px-2.5 md:px-4 sticky top-0 z-20 w-full shrink-0">
      {/* Left controls */}
      <div className="flex items-center space-x-2 md:space-x-4 rtl:space-x-reverse shrink-0">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-200 transition cursor-pointer"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-gray-400">
          <button className="hover:text-gray-200 p-1 rounded hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </button>
          <button className="hover:text-gray-200 p-1 rounded hover:bg-gray-800 transition-colors opacity-50 cursor-not-allowed">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
          <button className="hover:text-gray-200 p-1 rounded hover:bg-gray-800 transition-colors mx-0.5">
            <Clock className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center Search */}
      <div className="flex-1 max-w-xl mx-2 flex justify-center">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-2.5 rtl:pl-2.5 flex items-center pointer-events-none">
            <div className="w-4 h-4 rounded backdrop-blur-sm flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all opacity-70">
                <span className="text-xs">🤖</span>
            </div>
          </div>
          <input
            type="text"
            onClick={() => window.dispatchEvent(new CustomEvent('open-new-message-modal'))}
            readOnly
            className="block w-full px-3 sm:px-5 py-1.5 bg-[#2A2B32]/80 border border-gray-700 rounded-md text-xs sm:text-sm text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-[#2A2B32] focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors hover:bg-[#2A2B32] cursor-pointer text-left rtl:text-right truncate"
            placeholder={getTranslation(userLanguage, 'searchPlaceholder')}
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 rtl:space-x-reverse shrink-0">
        {/* Language Badge button */}
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="hidden md:flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 text-xs font-semibold transition cursor-pointer"
          title={isArabic ? "تغيير اللغة والسمة" : "Change Language & Theme"}
        >
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <span>{userLanguage.split(' ')[0]}</span>
        </button>

        <button className="text-gray-400 hover:text-gray-300 transition-colors p-1 sm:p-1.5 rounded hover:bg-gray-800">
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>

        {/* User account menu */}
        <div ref={accountMenuRef} className="relative">
          <button
            onClick={() => setIsAccountMenuOpen(previous => !previous)}
            aria-haspopup="menu"
            aria-expanded={isAccountMenuOpen}
            className="flex items-center gap-1 rounded-lg p-0.5 text-gray-300 hover:bg-gray-800 transition cursor-pointer"
            title={isArabic ? "حسابي" : "My account"}
          >
            <span className="relative w-7 h-7 rounded-lg bg-[#4CAF50] text-[#121317] font-extrabold text-xs flex items-center justify-center shadow-sm border border-gray-800">
              {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full rounded-lg object-cover" /> : (currentUser?.name ? currentUser.name.charAt(0) : 'A')}
              <PresenceDot status={currentUser ? presenceByUserId[currentUser.id]?.status || 'offline' : 'offline'} className="absolute -bottom-1 -right-1 h-2.5 w-2.5" />
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAccountMenuOpen && (
            <div role="menu" className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-700 bg-[#121317] shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-sm font-bold text-gray-100 truncate">{currentUser?.name || 'Workspace user'}</p>
                <p className="text-[11px] text-gray-500 truncate">{currentUser?.email || 'Local workspace account'}</p>
              </div>
              <div className="p-1.5">
                {accountMessage && <div className="mx-1.5 mb-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[10px] leading-relaxed text-blue-200">{accountMessage}</div>}
                <button
                  role="menuitem"
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsAccountMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition cursor-pointer"
                >
                  <UserCircle className="h-4 w-4 text-blue-400" />
                  <span>{isArabic ? 'الملف الشخصي والتفضيلات' : 'Profile & preferences'}</span>
                </button>
                <button
                  role="menuitem"
                  onClick={async () => {
                    const result = await toggleNotifications();
                    setAccountMessage(result.message);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition cursor-pointer"
                >
                  {notificationsEnabled ? <BellOff className="h-4 w-4 text-amber-400" /> : <Bell className="h-4 w-4 text-emerald-400" />}
                  <span>{notificationsEnabled ? 'Disable notifications' : notificationPermission === 'denied' ? 'Notifications blocked' : 'Enable notifications'}</span>
                </button>
                <button
                  role="menuitem"
                  disabled={isInstalled}
                  onClick={async () => {
                    const result = await installApp();
                    setAccountMessage(result.message || null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-default transition cursor-pointer"
                >
                  <Download className="h-4 w-4 text-violet-400" />
                  <span>{isInstalled ? 'DeskFlow is installed' : installAvailable ? 'Install DeskFlow' : 'Install DeskFlow app'}</span>
                </button>
                <div className="my-1 border-t border-gray-800" />
                <button
                  role="menuitem"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-red-300 hover:bg-red-500/10 hover:text-red-200 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isArabic ? 'تسجيل الخروج' : 'Log out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


