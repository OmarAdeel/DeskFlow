export interface TranslationKeys {
  home: string;
  unreads: string;
  threads: string;
  conversations: string;
  followups: string;
  mail: string;
  crm: string;
  later: string;
  huddles: string;
  drafts: string;
  directories: string;
  canvas: string;
  files: string;
  kpis: string;
  meetings: string;
  workspaceSettings: string;
  workflows: string;
  aiDigest: string;
  clips: string;
  apps: string;
  newBadge: string;
  starred: string;
  channels: string;
  directMessages: string;
  adminGovernance: string;
  searchPlaceholder: string;
  online: string;
  away: string;
  dnd: string;
  inMeeting: string;
  languageTab: string;
  themeTab: string;
  profileTab: string;
  chooseLanguage: string;
  chooseTheme: string;
  presenceStatus: string;
  accountSummary: string;
  superAdminSettings: string;
  done: string;
}

export const translations: Record<'en' | 'ar', TranslationKeys> = {
  en: {
    home: 'Home',
    unreads: 'Unreads',
    threads: 'Threads',
    conversations: 'Omnichannel DMs',
    followups: 'Tasks (Followers)',
    mail: 'Unified Mailbox',
    crm: 'CRM Pipeline',
    later: 'Later',
    huddles: 'Huddles',
    drafts: 'Drafts & sent',
    directories: 'Directories',
    canvas: 'Canvas',
    files: 'Files Manager',
    kpis: 'KPIs & Analytics',
    meetings: 'Meetings',
    workspaceSettings: 'Workspace Settings',
    workflows: 'Workflows & Automations',
    aiDigest: 'DeskFlow AI & Digest',
    clips: 'Clips & Audio/Video',
    apps: 'Apps & Integrations Studio',
    newBadge: 'NEW',
    starred: 'Starred',
    channels: 'Channels',
    directMessages: 'Direct Messages',
    adminGovernance: 'Admin (Super Admin)',
    searchPlaceholder: 'Search DeskFlow workspace...',
    online: 'Online',
    away: 'Away',
    dnd: 'Do Not Disturb',
    inMeeting: 'In a Meeting',
    languageTab: 'Language',
    themeTab: 'Theme',
    profileTab: 'Profile & Status',
    chooseLanguage: 'Choose Interface Language',
    chooseTheme: 'Choose DeskFlow Visual Theme',
    presenceStatus: 'Set Active Presence & Status',
    accountSummary: 'Account Summary',
    superAdminSettings: 'Super Admin Settings',
    done: 'Done'
  },
  ar: {
    home: 'الرئيسية',
    unreads: 'غير المقروءة',
    threads: 'المحادثات المترابطة',
    conversations: 'الرسائل المباشرة الشاملة',
    followups: 'المهام والمتابعات',
    mail: 'البريد الموحد',
    crm: 'إدارة علاقات العملاء (CRM)',
    later: 'المحفوظات لاحقاً',
    huddles: 'الاجتماعات السريعة (Huddles)',
    drafts: 'المسودات والمرسلة',
    directories: 'دليل أعضاء الفريق',
    canvas: 'لوحة العمل (Canvas)',
    files: 'مدير الملفات',
    kpis: 'مؤشرات الأداء والتحليلات',
    meetings: 'الاجتماعات',
    workspaceSettings: 'إعدادات مساحة العمل',
    workflows: 'سير العمل والأتمتة',
    aiDigest: 'ملخصات الذكاء الاصطناعي (DeskFlow AI)',
    clips: 'المقاطع والتسجيلات (Clips)',
    apps: 'دليل التطبيقات والتكاملات',
    newBadge: 'جديد',
    starred: 'المميزة بنجمة',
    channels: 'القنوات',
    directMessages: 'الرسائل المباشرة',
    adminGovernance: 'إدارة النظام (المسؤول الفائق)',
    searchPlaceholder: 'بحث في مساحة عمل DeskFlow...',
    online: 'متصل الآن',
    away: 'غائب',
    dnd: 'عدم الإزعاج',
    inMeeting: 'في اجتماع',
    languageTab: 'اللغة',
    themeTab: 'المظهر والسمة',
    profileTab: 'الملف الشخصي والحالة',
    chooseLanguage: 'اختر لغة الواجهة والنظام',
    chooseTheme: 'اختر سمة DeskFlow (DeskFlow Visual Theme)',
    presenceStatus: 'تحديد حالة التواجد والنشاط',
    accountSummary: 'ملخص الحساب الشخصي',
    superAdminSettings: 'إعدادات المسؤول الفائق',
    done: 'تم الحفظ'
  }
};

export function getTranslation(lang: string, key: keyof TranslationKeys): string {
  const isArabic = lang.includes('Arabic') || lang.includes('العربية');
  const dict = isArabic ? translations.ar : translations.en;
  return dict[key] || translations.en[key] || key;
}
