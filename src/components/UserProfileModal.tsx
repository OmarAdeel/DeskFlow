import React, { useEffect, useRef, useState } from 'react';
import { 
  X, Globe, Palette, Check, User, Shield, CheckCircle2,
  ChevronRight, Settings, KeyRound, AlertCircle, Download, Bell, BellOff, Smartphone
} from 'lucide-react';
import { useWorkspace } from '../context';
import { getTranslation } from '../utils/i18n';
import { useWebAppFeatures } from '../hooks/useWebAppFeatures';
import { PresenceDot } from './UserAvatar';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWorkspaceSettings?: () => void;
}

export const LANGUAGES = [
  { id: 'en', name: 'English (US)', native: 'English', flag: '🇺🇸', region: 'United States' },
  { id: 'ar', name: 'Arabic (العربية)', native: 'العربية', flag: '🇪🇬', region: 'Middle East & North Africa' }
];

export const THEMES = [
  { 
    id: 'Aubergine', 
    name: 'Aubergine (DeskFlow Classic)',
    desc: 'DeskFlow signature dark purple sidebar with a crisp blue active highlight.',
    badge: 'Iconic',
    bg: 'bg-[#3F0E40]', 
    cardBg: 'bg-[#1F1A24]', 
    accent: 'bg-[#1164A3]',
    border: 'border-purple-900/40'
  },
  { 
    id: 'Aubergine Light', 
    name: 'Aubergine Light', 
    desc: 'Classic DeskFlow purple sidebar paired with a clean white canvas.',
    badge: 'Classic Light',
    bg: 'bg-[#3F0E40]', 
    cardBg: 'bg-white', 
    accent: 'bg-[#1164A3]',
    border: 'border-gray-200'
  },
  { 
    id: 'Mood Indigo', 
    name: 'Mood Indigo (DeskFlow Dark)',
    desc: 'Default DeskFlow dark mode designed for low-light focus and reduced eye strain.',
    badge: 'DeskFlow Dark',
    bg: 'bg-[#19171D]', 
    cardBg: 'bg-[#1A1D21]', 
    accent: 'bg-[#1164A3]',
    border: 'border-gray-800'
  },
  { 
    id: 'DeskFlow Clean Light',
    name: 'DeskFlow Clean Light',
    desc: 'Crisp daylight theme with neutral light gray sidebar and clean white canvas.',
    badge: 'Clean Light',
    bg: 'bg-[#F8F8F8]', 
    cardBg: 'bg-white', 
    accent: 'bg-[#1164A3]',
    border: 'border-gray-300'
  },
  { 
    id: 'Warm Ochre', 
    name: 'Warm Ochre (DeskFlow Sunset)',
    desc: 'Warm evening purple and amber theme inspired by DeskFlow dusk presets.',
    badge: 'Warm',
    bg: 'bg-[#4A154B]', 
    cardBg: 'bg-[#1C1625]', 
    accent: 'bg-[#D97706]',
    border: 'border-amber-900/40'
  },
  { 
    id: 'Tritanopia Emerald', 
    name: 'Tritanopia Emerald (DeskFlow Forest)',
    desc: 'Deep forest green sidebar with emerald active highlights and accessible contrast.',
    badge: 'Forest',
    bg: 'bg-[#0B1D17]', 
    cardBg: 'bg-[#0F231C]', 
    accent: 'bg-[#007A5A]',
    border: 'border-emerald-900/40'
  },
  { 
    id: 'OLED Pitch Black', 
    name: 'OLED Pitch Black', 
    desc: 'Pure pitch black dark canvas with cyan highlights for maximum energy efficiency.',
    badge: 'OLED Dark',
    bg: 'bg-black', 
    cardBg: 'bg-[#09090C]', 
    accent: 'bg-[#1164A3]',
    border: 'border-gray-800'
  }
];

export const STATUS_OPTIONS = [
  { id: 'Online', labelKey: 'online' as const, labelEn: 'Online', color: 'bg-emerald-500', icon: '🟢' },
  { id: 'Away', labelKey: 'away' as const, labelEn: 'Away', color: 'bg-amber-500', icon: '🟡' },
  { id: 'Do Not Disturb', labelKey: 'dnd' as const, labelEn: 'Do Not Disturb', color: 'bg-red-500', icon: '🔴' },
  { id: 'In a Meeting', labelKey: 'inMeeting' as const, labelEn: 'In a Meeting', color: 'bg-purple-500', icon: '📅' }
];

export function UserProfileModal({ isOpen, onClose, onNavigateToWorkspaceSettings }: UserProfileModalProps) {
  const { 
    currentUser,
    presenceByUserId,
    userLanguage, 
    setUserLanguage, 
    userTheme, 
    setUserTheme,
    userStatus,
    setUserStatus,
    updateCurrentUserProfile,
    changeCurrentUserPassword
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'general' | 'language' | 'theme' | 'security' | 'app'>('language');
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileTitle, setProfileTitle] = useState(currentUser?.title || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const { installAvailable, isInstalled, installApp, notificationPermission, notificationsEnabled, toggleNotifications } = useWebAppFeatures();

  useEffect(() => {
    setProfileName(currentUser?.name || '');
    setProfileEmail(currentUser?.email || '');
    setProfilePhone(currentUser?.phone || '');
    setProfileTitle(currentUser?.title || '');
    setProfileAvatarUrl(currentUser?.avatarUrl || '');
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.phone, currentUser?.title, currentUser?.avatarUrl]);

  if (!isOpen) return null;

  const handleSelectLanguage = (langName: string) => {
    setUserLanguage(langName);
    const msg = langName.includes('Arabic') ? 'تم تحديث لغة الواجهة إلى اللغة العربية' : `Interface language updated to "${langName}"`;
    setNotificationMessage(msg);
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  const handleSelectTheme = (themeName: string) => {
    setUserTheme(themeName);
    const msg = userLanguage.includes('Arabic') ? `تم تغيير السمة إلى "${themeName}"` : `Theme appearance changed to "${themeName}"`;
    setNotificationMessage(msg);
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotificationMessage(isArabic ? 'يرجى اختيار ملف صورة صالح.' : 'Please choose a valid image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotificationMessage(isArabic ? 'يجب أن تكون الصورة بحجم 2 ميجابايت أو أقل.' : 'The image must be 2 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileAvatarUrl(reader.result);
        setNotificationMessage(isArabic ? 'تم تحميل الصورة. احفظ ملفك الشخصي لتطبيقها.' : 'Image uploaded. Save your profile to apply it.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError(isArabic ? 'كلمتا المرور غير متطابقتين.' : 'New passwords do not match.');
      return;
    }
    const result = await changeCurrentUserPassword(currentPassword, newPassword);
    if (!result.success) {
      setPasswordError(result.error || (isArabic ? 'تعذر تغيير كلمة المرور.' : 'Unable to change password.'));
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNotificationMessage(isArabic ? 'تم تغيير كلمة المرور.' : 'Password changed successfully.');
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  const handleSaveProfile = () => {
    const name = profileName.trim();
    const email = profileEmail.trim();
    const phone = profilePhone.trim();
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email) {
      setNotificationMessage(isArabic ? 'الاسم والبريد الإلكتروني مطلوبان.' : 'Name and email are required.');
      return;
    }
    if (!emailIsValid) {
      setNotificationMessage(isArabic ? 'يرجى إدخال عنوان بريد إلكتروني صالح.' : 'Please enter a valid email address.');
      return;
    }

    updateCurrentUserProfile({
      name,
      email,
      phone: phone || undefined,
      title: profileTitle.trim() || undefined,
      avatarUrl: profileAvatarUrl || undefined
    });
    setNotificationMessage(isArabic ? 'تم تحديث ملفك الشخصي.' : 'Profile updated successfully.');
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#1A1D21] border border-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-gray-800 bg-[#121317] flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#4CAF50] text-[#121317] font-black flex items-center justify-center text-lg shadow overflow-hidden">
                {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" /> : (currentUser?.name ? currentUser.name.charAt(0) : 'A')}
              </div>
              <PresenceDot status={currentUser ? presenceByUserId[currentUser.id]?.status || 'offline' : 'offline'} className="absolute -bottom-1 -right-1 h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h3 className="text-base font-bold text-white">{currentUser?.name || 'Abdallah Sayed'}</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-[10px] border border-blue-500/30">
                  {currentUser?.role || 'Super Admin'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">{currentUser?.email || 'abdallah@democompany.com'}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Toast Notification Banner */}
        {notificationMessage && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2 text-white text-xs font-bold flex items-center justify-between shadow-inner animate-in slide-in-from-top duration-150">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{notificationMessage}</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">{getTranslation(userLanguage, 'done')}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex shrink-0 overflow-x-auto border-b border-gray-800 bg-[#16181D] px-6 pt-2 space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => setActiveTab('language')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'language'
                ? 'bg-[#1A1D21] text-blue-400 border-blue-500'
                : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-gray-800/50'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>{getTranslation(userLanguage, 'languageTab')} ({userLanguage.split(' ')[0]})</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'theme'
                ? 'bg-[#1A1D21] text-blue-400 border-blue-500'
                : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-gray-800/50'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>{getTranslation(userLanguage, 'themeTab')} ({userTheme})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'security'
                ? 'bg-[#1A1D21] text-blue-400 border-blue-500'
                : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-gray-800/50'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>{isArabic ? 'الأمان' : 'Security'}</span>
          </button>

          <button
            onClick={() => setActiveTab('app')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'app'
                ? 'bg-[#1A1D21] text-blue-400 border-blue-500'
                : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-gray-800/50'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>{isArabic ? 'التطبيق والتنبيهات' : 'App & notifications'}</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'general'
                ? 'bg-[#1A1D21] text-blue-400 border-blue-500'
                : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-gray-800/50'
            }`}
          >
            <User className="h-4 w-4" />
            <span>{getTranslation(userLanguage, 'profileTab')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {activeTab === 'app' && (
            <div className="space-y-4">
              <div><h4 className="text-sm font-bold text-white flex items-center gap-2"><Smartphone className="h-4 w-4 text-violet-400" /><span>{isArabic ? 'تطبيق DeskFlow والتنبيهات' : 'DeskFlow app & notifications'}</span></h4><p className="mt-1 text-xs text-gray-400">{isArabic ? 'ثبّت DeskFlow كتطبيق وفعّل تنبيهات الرسائل الجديدة.' : 'Install DeskFlow as an app and enable alerts for new messages while DeskFlow is in the background.'}</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2"><Download className="h-5 w-5 text-violet-300" /><h5 className="text-sm font-bold text-white">{isArabic ? 'تثبيت التطبيق' : 'Install DeskFlow'}</h5></div>
                  <p className="text-xs leading-relaxed text-gray-400">{isInstalled ? 'DeskFlow is already running as an installed web app.' : 'Install DeskFlow on your desktop or home screen for quick access and a standalone window.'}</p>
                  <button type="button" disabled={isInstalled} onClick={async () => { const result = await installApp(); setNotificationMessage(result.message || null); }} className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-400 px-3 py-2 text-xs font-bold text-white">{isInstalled ? 'DeskFlow is installed' : installAvailable ? 'Install DeskFlow now' : 'Show installation instructions'}</button>
                </section>
                <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2">{notificationsEnabled ? <Bell className="h-5 w-5 text-emerald-300" /> : <BellOff className="h-5 w-5 text-gray-400" />}<h5 className="text-sm font-bold text-white">{isArabic ? 'تنبيهات المتصفح' : 'Browser notifications'}</h5></div>
                  <p className="text-xs leading-relaxed text-gray-400">{notificationPermission === 'denied' ? 'Notifications are blocked in this browser. Allow them from the site settings first.' : notificationsEnabled ? 'DeskFlow will alert you about accessible new messages while the app is in the background.' : 'Enable notifications to receive new-message alerts while DeskFlow is in the background.'}</p>
                  <button type="button" onClick={async () => { const result = await toggleNotifications(); setNotificationMessage(result.message); }} className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white">{notificationsEnabled ? 'Disable notifications' : notificationPermission === 'denied' ? 'Notifications blocked' : 'Enable notifications'}</button>
                </section>
              </div>
              <p className="rounded-lg border border-gray-800 bg-[#121317] px-3 py-2 text-[10px] text-gray-500">On iPhone or iPad, open DeskFlow in Safari, tap Share, then Add to Home Screen. Browser notifications require HTTPS and permission from your browser.</p>
            </div>
          )}

          {/* TAB 1: LANGUAGE SELECTION */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2 rtl:space-x-reverse">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span>{getTranslation(userLanguage, 'chooseLanguage')}</span>
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  {isArabic ? 'اختر لغتك المفضلة. سيتم تحديث جميع أسماء الوحدات والأزرار والقوائم في النظام فوراً.' : 'Select your preferred language. All system navigation modules, buttons, and headers will adapt instantly.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {LANGUAGES.map((lang) => {
                  const isSelected = userLanguage === lang.name;
                  return (
                    <div
                      key={lang.id}
                      onClick={() => handleSelectLanguage(lang.name)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                          : 'bg-[#14161B] border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-[#1A1D23]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <p className="text-xs font-bold">{lang.name}</p>
                          <p className="text-[10px] text-gray-400">{lang.region}</p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-700" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: THEME SELECTION */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2 rtl:space-x-reverse">
                  <Palette className="h-4 w-4 text-purple-400" />
                  <span>{getTranslation(userLanguage, 'chooseTheme')}</span>
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  {isArabic 
                    ? 'اختر مظهر DeskFlow الأصلي. تتكيف السمات مع ألوان شريط الأدوات الجانبي، والخلفية، وتفاصيل العناصر النشطة.'
                    : 'Select your preferred DeskFlow theme preset. Themes adapt sidebar colors, main workspace canvas, and active item highlights.'
                  }
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {THEMES.map((t) => {
                  const isSelected = userTheme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTheme(t.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-600/15 border-purple-500 text-white shadow-md'
                          : 'bg-[#14161B] border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-[#1A1D23]'
                      }`}
                    >
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        {/* Theme Palette Swatch Preview */}
                        <div className={`w-12 h-10 rounded-lg ${t.bg} border ${t.border} p-1 flex flex-col justify-between shrink-0 shadow-inner`}>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${t.accent}`} />
                            <div className="w-5 h-1 bg-gray-500/40 rounded" />
                          </div>
                          <div className={`w-full h-3 rounded ${t.cardBg} border border-gray-700/50`} />
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <p className="text-xs font-bold text-white">{t.name}</p>
                            <span className="px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 text-[9px] font-mono">
                              {t.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{t.desc}</p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-700" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: GENERAL PROFILE & STATUS */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2 rtl:space-x-reverse">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span>{getTranslation(userLanguage, 'presenceStatus')}</span>
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  {isArabic 
                    ? 'أخبر أعضاء الفريق بما إذا كنت متفرغاً، غائباً، أو في اجتماع عمل.'
                    : 'Let team members know if you are available, away, or in a meeting.'
                  }
                </p>
              </div>

              {/* Profile picture and title */}
              <div className="bg-[#14161B] p-4 rounded-xl border border-gray-800 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#4CAF50] text-[#121317] font-black flex items-center justify-center text-2xl shadow overflow-hidden shrink-0">
                    {profileAvatarUrl ? <img src={profileAvatarUrl} alt="Profile preview" className="w-full h-full object-cover" /> : (currentUser?.name ? currentUser.name.charAt(0) : 'A')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input ref={profileImageInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                    <button type="button" onClick={() => profileImageInputRef.current?.click()} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">{isArabic ? 'تحميل صورة' : 'Upload picture'}</button>
                    {profileAvatarUrl && <button type="button" onClick={() => setProfileAvatarUrl('')} className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold">{isArabic ? 'إزالة' : 'Remove'}</button>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-gray-400">{isArabic ? 'الاسم الكامل' : 'Full name'}
                    <input value={profileName} onChange={event => setProfileName(event.target.value)} placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'} autoComplete="name" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                  </label>
                  <label className="block text-xs text-gray-400">{isArabic ? 'البريد الإلكتروني' : 'Email address'}
                    <input type="email" value={profileEmail} onChange={event => setProfileEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                  </label>
                  <label className="block text-xs text-gray-400">{isArabic ? 'رقم الهاتف' : 'Phone number'}
                    <input type="tel" value={profilePhone} onChange={event => setProfilePhone(event.target.value)} placeholder={isArabic ? 'اختياري' : 'Optional'} autoComplete="tel" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                  </label>
                  <label className="block text-xs text-gray-400">{isArabic ? 'المسمى الوظيفي' : 'Job title'}
                    <input value={profileTitle} onChange={event => setProfileTitle(event.target.value)} placeholder={isArabic ? 'مثال: محاسب، مسؤول مشتريات إعلامية' : 'e.g. Accountant, Media Buyer'} className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                  </label>
                </div>
                <div className="flex justify-end"><button type="button" onClick={handleSaveProfile} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">{isArabic ? 'حفظ الملف الشخصي' : 'Save profile'}</button></div>
              </div>

              {/* Status Radio Options */}
              <div className="grid grid-cols-2 gap-2.5">
                {STATUS_OPTIONS.map((st) => {
                  const isSelected = userStatus === st.id;
                  const statusLabel = getTranslation(userLanguage, st.labelKey);
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setUserStatus(st.id);
                        const msg = isArabic ? `تم تحديث الحالة إلى "${statusLabel}"` : `Status updated to "${statusLabel}"`;
                        setNotificationMessage(msg);
                        setTimeout(() => setNotificationMessage(null), 3000);
                      }}
                      className={`p-3 rounded-xl border text-left rtl:text-right transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-600/15 border-emerald-500 text-white font-bold'
                          : 'bg-[#14161B] border-gray-800 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                        <span className="text-base">{st.icon}</span>
                        <span className="text-xs font-semibold">{statusLabel}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Profile Overview Box */}
              <div className="bg-[#14161B] p-4 rounded-xl border border-gray-800 space-y-3">
                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{getTranslation(userLanguage, 'accountSummary')}</h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">{isArabic ? 'الاسم الكامل' : 'Full Name'}</span>
                    <span className="text-white font-medium">{currentUser?.name || 'Abdallah Sayed'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</span>
                    <span className="text-white font-medium font-mono">{currentUser?.email || 'abdallah@democompany.com'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{isArabic ? 'رقم الهاتف' : 'Phone number'}</span>
                    <span className="text-white font-medium">{currentUser?.phone || (isArabic ? 'غير مضاف' : 'Not provided')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{isArabic ? 'الدور والصفة' : 'Role & Designation'}</span>
                    <span className="text-white font-medium">{currentUser?.role}{currentUser?.title ? ` (${currentUser.title})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{isArabic ? 'اللغة الحالية' : 'Current Language'}</span>
                    <span className="text-blue-400 font-bold">{userLanguage}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PASSWORD SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2 rtl:space-x-reverse">
                  <KeyRound className="h-4 w-4 text-blue-400" />
                  <span>{isArabic ? 'تغيير كلمة المرور' : 'Change your password'}</span>
                </h4>
                <p className="text-xs text-gray-400 mt-1">{isArabic ? 'استخدم كلمة مرور لا تقل عن 8 أحرف.' : 'Use a password with at least 8 characters.'}</p>
              </div>
              {passwordError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              <div className="bg-[#14161B] p-4 rounded-xl border border-gray-800 space-y-3">
                <label className="block text-xs text-gray-400">{isArabic ? 'كلمة المرور الحالية' : 'Current password'}
                  <input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </label>
                <label className="block text-xs text-gray-400">{isArabic ? 'كلمة المرور الجديدة' : 'New password'}
                  <input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </label>
                <label className="block text-xs text-gray-400">{isArabic ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'}
                  <input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </label>
                <div className="flex justify-end"><button type="button" onClick={handleChangePassword} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">{isArabic ? 'تغيير كلمة المرور' : 'Change password'}</button></div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 border-t border-gray-800 bg-[#121317] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-400">
            <Shield className="h-4 w-4 text-gray-500" />
            <span>{isArabic ? 'هل تحتاج إلى إدارة حوكمة مساحة العمل؟' : 'Need system administrative governance?'}</span>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {onNavigateToWorkspaceSettings && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToWorkspaceSettings();
                }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1 rtl:space-x-reverse border border-gray-700"
              >
                <Settings className="h-3.5 w-3.5 text-blue-400" />
                <span>{getTranslation(userLanguage, 'superAdminSettings')}</span>
                <ChevronRight className="h-3 w-3 rtl:rotate-180" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition cursor-pointer shadow"
            >
              {getTranslation(userLanguage, 'done')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

