import { Search, Clock, HelpCircle, ArrowLeft, ArrowRight, Globe, Menu } from 'lucide-react';
import { useWorkspace } from '../context';
import { getTranslation } from '../utils/i18n';

interface TopNavProps {
  onOpenMobileMenu?: () => void;
}

export function TopNav({ onOpenMobileMenu }: TopNavProps) {
  const { setIsProfileModalOpen, userLanguage, currentUser } = useWorkspace();
  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');

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

        {/* User Avatar */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="w-7 h-7 rounded-lg bg-[#4CAF50] text-[#121317] font-extrabold text-xs flex items-center justify-center cursor-pointer hover:brightness-110 shadow-sm border border-gray-800 transition transform hover:scale-105"
          title={isArabic ? "الملف الشخصي والتفضيلات" : "My Profile & Preferences"}
        >
          {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
        </button>
      </div>
    </div>
  );
}


