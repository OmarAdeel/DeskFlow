import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { announceRecordingStatus } from './utils/audioAnnounce';

export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  /** Organization/workspace that owns the channel. */
  organizationId?: string;
  /** Explicit channel membership. Older channels may omit this and use user.channelIds as a fallback. */
  memberIds?: string[];
}

export function canAccessChannel(
  channel: Channel,
  user: WorkspaceUser | undefined,
  organizationId?: string | null
): boolean {
  if (!user) return false;
  // An active organization is an isolated workspace boundary. Legacy channels
  // without an owner are only visible to callers that do not have org scope.
  if (organizationId !== undefined) {
    if (organizationId === null) {
      if (channel.organizationId) return false;
    } else if (channel.organizationId !== organizationId) {
      return false;
    }
  } else if (channel.organizationId) {
    return false;
  }
  if (user.role === 'Super Admin') return true;
  if (channel.organizationId && !user.organizationIds?.includes(channel.organizationId)) return false;
  if (!channel.isPrivate && channel.organizationId) return true;
  if (channel.memberIds) return channel.memberIds.includes(user.id);
  return Boolean(user.channelIds?.includes(channel.id));
}

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  title?: string;
  phone?: string;
  avatarUrl?: string;
  channelIds?: string[];
  organizationIds?: string[];
  username?: string;
  /** Optional per-user presence/status label exposed to workspace-aware agents. */
  status?: string;
  isAgent?: boolean;
  agentId?: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  memberIds: string[];
  createdAt: number;
}

export interface WorkspaceAgent {
  id: string;
  name: string;
  username: string;
  email: string;
  model: string;
  apiBaseUrl: string;
  apiKey: string;
  jobDetails: string;
  personality: string;
  databaseAccess: {
    organizations: boolean;
    publicThreads: boolean;
    /** Allows provider-supported web search for current/external information. */
    webSearch?: boolean;
  };
  enabled: boolean;
  createdAt: number;
}

export interface Reply {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
  reactions?: string[];
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
  replies: Reply[];
  reactions?: string[];
}

export interface Draft {
  channelId?: string;
  threadId?: string;
  text: string;
  timestamp: number;
}

export interface RecordedHuddle {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: string[];
  channelOrPerson: string;
  summary: string;
  transcript: { time: string; speaker: string; text: string }[];
  videoUrl?: string;
  noiseReducedDb: string;
}

export interface HuddleLogEntry { id: string; code: string; startedAt: number; duration: number; targetName: string; participants: string[]; }

export interface ActiveHuddleState {
  inCall: boolean;
  code: string;
  startedAt: number;
  targetId: string | null;
  targetType: 'person' | 'channel' | null;
  videoEnabled: boolean;
  micEnabled: boolean;
  screenSharing: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  handRaised: boolean;
  isMinimized: boolean;
  showNotesDrawer: boolean;
  huddleNotes: string;
  layoutMode: 'spotlight' | 'grid';
  micLevel: number;
  position: { x: number; y: number };
}

interface WorkspaceContextProps {
  workspaceName: string;
  setWorkspaceName: (name: string) => void;
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  users: WorkspaceUser[];
  setUsers: React.Dispatch<React.SetStateAction<WorkspaceUser[]>>;
  organizations: Organization[];
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;
  activeOrganization: Organization | undefined;
  accessibleOrganizations: Organization[];
  agents: WorkspaceAgent[];
  setAgents: React.Dispatch<React.SetStateAction<WorkspaceAgent[]>>;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  drafts: Draft[];
  setDrafts: (drafts: Draft[]) => void;
  savedItems: string[];
  setSavedItems: React.Dispatch<React.SetStateAction<string[]>>;
  currentUser: WorkspaceUser | undefined;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  changeCurrentUserPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  adminSetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; link?: string; error?: string }>;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  userLanguage: string;
  setUserLanguage: (lang: string) => void;
  userTheme: string;
  setUserTheme: (theme: string) => void;
  userStatus: string;
  setUserStatus: (status: string) => void;
  updateCurrentUserProfile: (updates: { name?: string; email?: string; phone?: string; title?: string; avatarUrl?: string }) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;

  // Global Persistent Active Huddle State & Actions
  activeHuddle: ActiveHuddleState;
  startGlobalHuddle: (targetId: string, targetType: 'person' | 'channel') => void;
  endGlobalHuddle: () => void;
  toggleHuddleMic: () => void;
  toggleHuddleVideo: () => void;
  toggleHuddleScreenShare: () => void;
  toggleHuddleRecording: () => void;
  toggleHuddleHand: () => void;
  setHuddleMinimized: (minimized: boolean) => void;
  updateHuddlePosition: (pos: { x: number; y: number }) => void;
  setHuddleNotes: (notes: string) => void;
  setLayoutMode: (mode: 'spotlight' | 'grid') => void;
  setShowNotesDrawer: (show: boolean) => void;
  setMicLevel: (level: number) => void;
  savedRecordings: RecordedHuddle[];
  setSavedRecordings: React.Dispatch<React.SetStateAction<RecordedHuddle[]>>;
  recordingAnnouncementToast: string | null;
  huddleLogs: HuddleLogEntry[];
  setHuddleLogs: React.Dispatch<React.SetStateAction<HuddleLogEntry[]>>;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

const defaultChannels: Channel[] = [
  { id: '4', name: 'general', isPrivate: false },
];

const defaultUsers: WorkspaceUser[] = [
  { id: '8', name: 'Abdallah Sayed', email: 'abdallah@democompany.com', role: 'Super Admin', title: 'CEO', phone: '+1000222333', channelIds: ['4'], username: 'abdallah' },
  { id: '1', name: 'John Doe', email: 'john.doe@democompany.com', role: 'Member', title: 'Developer', phone: '+1234567890', channelIds: ['4'], username: 'john.doe' }
];

type PasswordCredential = { userId: string; passwordHash: string };
type PasswordResetToken = { userId: string; expiresAt: number; used: boolean };

const defaultPasswordHash = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791';

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function passwordMeetsRequirements(password: string): boolean {
  return password.length >= 8;
}

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('workspace_authenticated') !== 'false';
  });

  const [authenticatedUserId, setAuthenticatedUserId] = useState(() => {
    return localStorage.getItem('workspace_authenticated_user') || '8';
  });

  const [workspaceName, setWorkspaceName] = useState(() => {
    return localStorage.getItem('workspace_name') || 'Demo Company';
  });
  
  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('workspace_channels');
    if (!saved) return defaultChannels;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : defaultChannels;
    } catch {
      return defaultChannels;
    }
  });

  const [users, setUsers] = useState<WorkspaceUser[]>(() => {
    const saved = localStorage.getItem('workspace_users');
    if (saved) {
      const parsed = JSON.parse(saved) as WorkspaceUser[];
      // Sync default user fields (like username) only for users who are still in the saved list (not deleted)
      return parsed.map(u => {
        const du = defaultUsers.find(d => d.id === u.id);
        if (du) {
          return { ...du, ...u, username: du.username || u.username };
        }
        return u;
      });
    }
    return defaultUsers;
  });

  const [passwordCredentials, setPasswordCredentials] = useState<PasswordCredential[]>(() => {
    const saved = localStorage.getItem('workspace_password_credentials');
    let parsed: PasswordCredential[] = [];
    if (saved) {
      try {
        const value = JSON.parse(saved);
        parsed = Array.isArray(value) ? value.filter(item => item && typeof item.userId === 'string' && typeof item.passwordHash === 'string') : [];
      } catch {
        parsed = [];
      }
    }
    // Existing demo accounts can sign in with demo123 until they change their password.
    return defaultUsers.map(user => parsed.find(credential => credential.userId === user.id) || { userId: user.id, passwordHash: defaultPasswordHash });
  });

  const [passwordResetTokens, setPasswordResetTokens] = useState<Record<string, PasswordResetToken>>(() => {
    const saved = localStorage.getItem('workspace_password_reset_tokens');
    if (!saved) return {};
    try {
      const value = JSON.parse(saved);
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('workspace_organizations');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((organization): organization is Organization => Boolean(
            organization && typeof organization.id === 'string' && typeof organization.name === 'string' && Array.isArray(organization.memberIds)
          ))
        : [];
    } catch {
      return [];
    }
  });

  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(() => {
    return localStorage.getItem('workspace_active_organization');
  });

  const setActiveOrganizationId = (id: string | null) => {
    setActiveOrganizationIdState(id);
    if (id) {
      localStorage.setItem('workspace_active_organization', id);
    } else {
      localStorage.removeItem('workspace_active_organization');
    }
  };

  const [agents, setAgents] = useState<WorkspaceAgent[]>(() => {
    const saved = localStorage.getItem('workspace_agents');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setUsers(previousUsers => {
      const regularUsers = previousUsers.filter(user => !user.isAgent);
      const agentUsers: WorkspaceUser[] = agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: 'AI Agent',
        title: 'AI Assistant',
        username: agent.username,
        isAgent: true,
        agentId: agent.id,
        organizationIds: organizations.filter(organization => organization.memberIds.includes(agent.id)).map(organization => organization.id),
        channelIds: channels
          .filter(channel => channel.memberIds ? channel.memberIds.includes(agent.id) : !channel.isPrivate)
          .map(channel => channel.id)
      }));
      return [...regularUsers, ...agentUsers];
    });
  }, [agents, channels, organizations]);

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('workspace_messages');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'msg_1',
        channelId: '4',
        senderId: '1',
        text: 'Hello everyone! Welcome to the general channel.',
        timestamp: Date.now() - 86400000,
        isRead: false,
        replies: []
      }
    ];
  });

  const [drafts, setDrafts] = useState<Draft[]>(() => {
    const saved = localStorage.getItem('workspace_drafts');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedItems, setSavedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('workspace_savedItems');
    return saved ? JSON.parse(saved) : [];
  });

  const [userLanguage, setUserLanguage] = useState<string>(() => {
    return localStorage.getItem('workspace_user_language') || 'English (US)';
  });

  const [userTheme, setUserTheme] = useState<string>(() => {
    const savedTheme = localStorage.getItem('workspace_user_theme');
    // Migrate the former branded theme name without resetting user preferences.
    if (savedTheme === 'Slack Clean Light') {
      localStorage.setItem('workspace_user_theme', 'DeskFlow Clean Light');
      return 'DeskFlow Clean Light';
    }
    return savedTheme || 'Dark Enterprise';
  });

  const [userStatus, setUserStatus] = useState<string>(() => {
    return localStorage.getItem('workspace_user_status') || 'Online';
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Saved Recordings Vault
  const [huddleLogs, setHuddleLogs] = useState<HuddleLogEntry[]>([]);

  const [savedRecordings, setSavedRecordings] = useState<RecordedHuddle[]>([
    {
      id: 'rec-1',
      title: 'DeskFlow UI & Workflow Integration Sync',
      date: 'Yesterday at 4:15 PM',
      duration: '04:12',
      participants: ['Abdallah Sayed', 'Esraa Soliman', 'Omar Hassan'],
      channelOrPerson: '#general',
      noiseReducedDb: '-28 dB',
      summary: 'Agreed on rolling out AI Noise Cancellation and dual Screen + Camera picture-in-picture mode.',
      transcript: [
        { time: '00:15', speaker: 'Abdallah Sayed', text: 'Hey team, let us go over the new huddle capabilities.' },
        { time: '01:05', speaker: 'Esraa Soliman', text: 'The AI noise suppression cuts background chatter completely.' },
        { time: '02:40', speaker: 'Omar Hassan', text: 'Virtual background blur looks really crisp.' }
      ]
    },
    {
      id: 'rec-2',
      title: 'Customer Ops Emergency Escalation Huddle',
      date: '3 days ago',
      duration: '02:45',
      participants: ['Abdallah Sayed', 'Sarah Chen'],
      channelOrPerson: '#customer-ops',
      noiseReducedDb: '-22 dB',
      summary: 'Resolved urgent tier-2 support requests and security permissions.',
      transcript: [
        { time: '00:10', speaker: 'Sarah Chen', text: 'Updated automated escalation triggers.' },
        { time: '01:30', speaker: 'Abdallah Sayed', text: 'Great, server instances are running at full stability.' }
      ]
    }
  ]);

  // Speech announcement toast message
  const [recordingAnnouncementToast, setRecordingAnnouncementToast] = useState<string | null>(null);

  // Global Active Huddle State
  const [activeHuddle, setActiveHuddle] = useState<ActiveHuddleState>({
    inCall: false,
    targetId: null,
    targetType: null,
    videoEnabled: false,
    micEnabled: true,
    screenSharing: false,
    isRecording: false,
    recordingSeconds: 0,
    handRaised: false,
    isMinimized: false,
    showNotesDrawer: false,
    huddleNotes: '• Huddle Goals:\n1. Review updates.\n2. Confirm tasks.',
    layoutMode: 'spotlight',
    micLevel: 0,
    position: { x: 0, y: 0 }
  });

  const recordingTimerRef = useRef<number | null>(null);

  const startGlobalHuddle = (targetId: string, targetType: 'person' | 'channel') => {
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 360) : 100;
    const defaultY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 200) : 100;
    const part = () => Math.random().toString(36).substring(2, 5);
    const generatedCode = `${part()}-${part()}-${part()}`;

    setActiveHuddle({
      inCall: true,
      code: generatedCode,
      startedAt: Date.now(),
      targetId,
      targetType,
      videoEnabled: false,
      micEnabled: true,
      screenSharing: false,
      isRecording: false,
      recordingSeconds: 0,
      handRaised: false,
      isMinimized: false,
      showNotesDrawer: false,
      huddleNotes: userLanguage.includes('Arabic') || userLanguage.includes('العربية') 
        ? '• أهداف الاجتماع السريع:\n1. مراجعة التغييرات البرمجية.\n2. تأكيد الموعد.' 
        : '• Huddle Goals:\n1. Review code updates.\n2. Confirm schedule.',
      layoutMode: 'spotlight',
      micLevel: 0,
      position: { x: defaultX, y: defaultY }
    });
  };

  const endGlobalHuddle = () => {
    if (activeHuddle.inCall) {
      let channelLabel = 'Unknown';
      if (activeHuddle.targetType === 'person') {
        const u = users.find(x => x.id === activeHuddle.targetId);
        if (u) channelLabel = `@${u.name}`;
      } else if (activeHuddle.targetType === 'channel') {
        const c = channels.find(x => x.id === activeHuddle.targetId);
        if (c) channelLabel = `#${c.name}`;
      }
      
      const newLog: HuddleLogEntry = {
        id: `log-${Date.now()}`,
        code: activeHuddle.code,
        startedAt: activeHuddle.startedAt,
        duration: Math.floor((Date.now() - activeHuddle.startedAt) / 1000),
        targetName: channelLabel,
        participants: [users.find(u => u.name === 'Abdallah Sayed')?.name || 'Abdallah Sayed', channelLabel.startsWith('@') ? channelLabel.substring(1) : 'Team Members'],
      };
      setHuddleLogs(prev => [newLog, ...prev]);
    }

    if (activeHuddle.isRecording) {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    setActiveHuddle(prev => ({
      ...prev,
      inCall: false,
      targetId: null,
      targetType: null,
      isRecording: false,
      videoEnabled: false,
      screenSharing: false
    }));
  };

  const toggleHuddleMic = () => {
    setActiveHuddle(prev => ({ ...prev, micEnabled: !prev.micEnabled }));
  };

  const toggleHuddleVideo = () => {
    setActiveHuddle(prev => ({ ...prev, videoEnabled: !prev.videoEnabled }));
  };

  const toggleHuddleScreenShare = () => {
    setActiveHuddle(prev => ({ ...prev, screenSharing: !prev.screenSharing }));
  };

  const toggleHuddleRecording = () => {
    if (activeHuddle.isRecording) {
      // Stop recording
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      announceRecordingStatus(false, userLanguage);
      const stopText = userLanguage.includes('Arabic') || userLanguage.includes('العربية') 
        ? 'تم إيقاف التسجيل.' 
        : 'Recording stopped.';
      setRecordingAnnouncementToast(stopText);
      setTimeout(() => setRecordingAnnouncementToast(null), 3500);

      // Save recorded huddle to vault
      const mins = Math.floor(activeHuddle.recordingSeconds / 60);
      const secs = activeHuddle.recordingSeconds % 60;
      const durationStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      let channelLabel = '#general';
      if (activeHuddle.targetType === 'person') {
        const u = users.find(x => x.id === activeHuddle.targetId);
        if (u) channelLabel = `@${u.name}`;
      } else if (activeHuddle.targetType === 'channel') {
        const c = channels.find(x => x.id === activeHuddle.targetId);
        if (c) channelLabel = `#${c.name}`;
      }

      const newRec: RecordedHuddle = {
        id: `rec-${Date.now()}`,
        title: `Recorded Huddle - ${channelLabel}`,
        date: 'Just now',
        duration: durationStr,
        participants: [users.find(u => u.name === 'Abdallah Sayed')?.name || 'Abdallah Sayed'],
        channelOrPerson: channelLabel,
        noiseReducedDb: '-26 dB',
        summary: 'Newly completed huddle recording automatically processed and transcribed by AI.',
        transcript: [
          { time: '00:02', speaker: 'Abdallah Sayed', text: 'Starting huddle recording...' },
          { time: '00:15', speaker: 'Abdallah Sayed', text: 'Discussed team action items and key milestones.' }
        ]
      };
      setSavedRecordings(prev => [newRec, ...prev]);

      setActiveHuddle(prev => ({ ...prev, isRecording: false }));
    } else {
      // Start recording
      announceRecordingStatus(true, userLanguage);
      const startText = userLanguage.includes('Arabic') || userLanguage.includes('العربية') 
        ? 'تنبيه: يتم الآن تسجيل هذا الاجتماع.' 
        : 'This meeting is being recorded now.';
      setRecordingAnnouncementToast(startText);
      setTimeout(() => setRecordingAnnouncementToast(null), 4500);

      setActiveHuddle(prev => ({ ...prev, isRecording: true, recordingSeconds: 1 }));
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = window.setInterval(() => {
        setActiveHuddle(prev => ({ ...prev, recordingSeconds: prev.recordingSeconds + 1 }));
      }, 1000);
    }
  };

  const toggleHuddleHand = () => {
    setActiveHuddle(prev => ({ ...prev, handRaised: !prev.handRaised }));
  };

  const setHuddleMinimized = (minimized: boolean) => {
    setActiveHuddle(prev => ({ ...prev, isMinimized: minimized }));
  };

  const updateHuddlePosition = (pos: { x: number; y: number }) => {
    setActiveHuddle(prev => ({ ...prev, position: pos }));
  };

  const setHuddleNotes = (notes: string) => {
    setActiveHuddle(prev => ({ ...prev, huddleNotes: notes }));
  };

  const setLayoutMode = (mode: 'spotlight' | 'grid') => {
    setActiveHuddle(prev => ({ ...prev, layoutMode: mode }));
  };

  const setShowNotesDrawer = (show: boolean) => {
    setActiveHuddle(prev => ({ ...prev, showNotesDrawer: show }));
  };

  const setMicLevel = (level: number) => {
    setActiveHuddle(prev => ({ ...prev, micLevel: level }));
  };

  const currentUser = users.find(u => u.id === authenticatedUserId);

  const login = async (email: string, password: string): Promise<string | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(candidate => candidate.email.toLowerCase() === normalizedEmail && !candidate.isAgent);
    if (!user) return 'No account was found for that email address.';
    const credential = passwordCredentials.find(item => item.userId === user.id);
    if (!credential) return 'This account does not have a password yet. Ask a Super Admin to set one.';
    if ((await hashPassword(password)) !== credential.passwordHash) return 'The email or password is incorrect.';
    localStorage.setItem('workspace_authenticated', 'true');
    localStorage.setItem('workspace_authenticated_user', user.id);
    setAuthenticatedUserId(user.id);
    setIsAuthenticated(true);
    return null;
  };

  const logout = () => {
    localStorage.setItem('workspace_authenticated', 'false');
    setIsAuthenticated(false);
    setIsProfileModalOpen(false);
  };

  const savePasswordCredential = (userId: string, passwordHash: string) => {
    setPasswordCredentials(previous => {
      const next = previous.some(item => item.userId === userId)
        ? previous.map(item => item.userId === userId ? { userId, passwordHash } : item)
        : [...previous, { userId, passwordHash }];
      return next;
    });
  };

  const changeCurrentUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, error: 'No signed-in user was found.' };
    if (!passwordMeetsRequirements(newPassword)) return { success: false, error: 'New password must be at least 8 characters.' };
    const credential = passwordCredentials.find(item => item.userId === currentUser.id);
    if (!credential || (await hashPassword(currentPassword)) !== credential.passwordHash) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    if (currentPassword === newPassword) return { success: false, error: 'New password must be different from the current password.' };
    savePasswordCredential(currentUser.id, await hashPassword(newPassword));
    return { success: true };
  };

  const adminSetUserPassword = async (userId: string, newPassword: string) => {
    if (currentUser?.role !== 'Super Admin') return { success: false, error: 'Only Super Admins can set another user’s password.' };
    if (!users.some(user => user.id === userId && !user.isAgent)) return { success: false, error: 'User account was not found.' };
    if (!passwordMeetsRequirements(newPassword)) return { success: false, error: 'Password must be at least 8 characters.' };
    savePasswordCredential(userId, await hashPassword(newPassword));
    return { success: true };
  };

  const requestPasswordReset = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(candidate => candidate.email.toLowerCase() === normalizedEmail && !candidate.isAgent);
    if (!user) return { success: false, error: 'No account was found for that email address.' };
    const tokenBytes = new Uint8Array(24);
    globalThis.crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
    setPasswordResetTokens(previous => ({ ...previous, [token]: { userId: user.id, expiresAt: Date.now() + 30 * 60 * 1000, used: false } }));
    const resetUrl = new URL(window.location.href);
    resetUrl.search = '';
    resetUrl.hash = `resetToken=${token}`;
    return { success: true, link: resetUrl.toString() };
  };

  const resetPasswordWithToken = async (token: string, newPassword: string) => {
    if (!passwordMeetsRequirements(newPassword)) return { success: false, error: 'Password must be at least 8 characters.' };
    const resetToken = passwordResetTokens[token];
    if (!resetToken || resetToken.used || resetToken.expiresAt < Date.now()) return { success: false, error: 'This reset link is invalid or has expired.' };
    const user = users.find(candidate => candidate.id === resetToken.userId && !candidate.isAgent);
    if (!user) return { success: false, error: 'User account was not found.' };
    savePasswordCredential(user.id, await hashPassword(newPassword));
    setPasswordResetTokens(previous => ({ ...previous, [token]: { ...resetToken, used: true } }));
    return { success: true };
  };

  const accessibleOrganizations = currentUser?.role === 'Super Admin'
    ? organizations
    : organizations.filter(organization => Boolean(currentUser?.id && organization.memberIds.includes(currentUser.id)));
  const activeOrganization = organizations.find(organization => organization.id === activeOrganizationId);

  useEffect(() => {
    const accessibleIds = new Set(accessibleOrganizations.map(organization => organization.id));
    if (activeOrganizationId && accessibleIds.has(activeOrganizationId)) return;
    const fallback = accessibleOrganizations[0]?.id || null;
    if (fallback !== activeOrganizationId) setActiveOrganizationId(fallback);
  }, [activeOrganizationId, accessibleOrganizations]);

  useEffect(() => {
    if (organizations.length === 0) return;
    const firstOrganizationId = organizations[0].id;
    const legacyOwnerId = organizations.some(organization => organization.id === activeOrganizationId)
      ? activeOrganizationId || firstOrganizationId
      : firstOrganizationId;

    // Channels saved before multi-organization support have no owner. Assign
    // them to one workspace instead of leaking them into every workspace.
    setChannels(previousChannels => {
      const migratedChannels = previousChannels.map(channel => channel.organizationId
        ? channel
        : { ...channel, organizationId: legacyOwnerId }
      );
      const channelsByOrganization = new Set(migratedChannels.map(channel => channel.organizationId));
      const defaultChannels = organizations
        .filter(organization => !channelsByOrganization.has(organization.id))
        .map(organization => ({
          id: `general_${organization.id}`,
          name: 'general',
          isPrivate: false,
          organizationId: organization.id,
          memberIds: organization.memberIds
        }));

      if (defaultChannels.length === 0 && migratedChannels.every((channel, index) => channel === previousChannels[index])) {
        return previousChannels;
      }
      return [...migratedChannels, ...defaultChannels];
    });
  }, [organizations, activeOrganizationId]);

  const updateCurrentUserProfile = (updates: { name?: string; email?: string; phone?: string; title?: string; avatarUrl?: string }) => {
    if (!currentUser) return;
    setUsers(previousUsers => previousUsers.map(user => user.id === currentUser.id
      ? { ...user, ...updates }
      : user
    ));
  };

  useEffect(() => {
    localStorage.setItem('workspace_name', workspaceName);
  }, [workspaceName]);

  useEffect(() => {
    localStorage.setItem('workspace_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('workspace_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('workspace_password_credentials', JSON.stringify(passwordCredentials));
  }, [passwordCredentials]);

  useEffect(() => {
    localStorage.setItem('workspace_password_reset_tokens', JSON.stringify(passwordResetTokens));
  }, [passwordResetTokens]);

  useEffect(() => {
    localStorage.setItem('workspace_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('workspace_organizations', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    // The setter persists immediately; this also keeps the key in sync if
    // organization state is restored or replaced by an external update.
    if (activeOrganizationId) {
      localStorage.setItem('workspace_active_organization', activeOrganizationId);
    } else {
      localStorage.removeItem('workspace_active_organization');
    }
  }, [activeOrganizationId]);

  useEffect(() => {
    localStorage.setItem('workspace_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('workspace_drafts', JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem('workspace_savedItems', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    localStorage.setItem('workspace_user_language', userLanguage);
    document.documentElement.setAttribute('data-language', userLanguage);
    if (userLanguage.includes('Arabic') || userLanguage.includes('العربية')) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [userLanguage]);

  useEffect(() => {
    localStorage.setItem('workspace_user_theme', userTheme);
    document.documentElement.setAttribute('data-theme', userTheme);
  }, [userTheme]);

  useEffect(() => {
    localStorage.setItem('workspace_user_status', userStatus);
  }, [userStatus]);

  return (
    <WorkspaceContext.Provider value={{ 
      workspaceName, setWorkspaceName, 
      channels, setChannels, 
      users, setUsers,
      organizations, setOrganizations,
      activeOrganizationId, setActiveOrganizationId,
      activeOrganization, accessibleOrganizations,
      agents, setAgents,
      messages, setMessages,
      drafts, setDrafts,
      savedItems, setSavedItems,
      currentUser,
      isAuthenticated, login, logout,
      changeCurrentUserPassword,
      adminSetUserPassword,
      requestPasswordReset,
      resetPasswordWithToken,
      userLanguage, setUserLanguage,
      userTheme, setUserTheme,
      userStatus, setUserStatus,
      updateCurrentUserProfile,
      isProfileModalOpen, setIsProfileModalOpen,

      activeHuddle,
      startGlobalHuddle,
      endGlobalHuddle,
      toggleHuddleMic,
      toggleHuddleVideo,
      toggleHuddleScreenShare,
      toggleHuddleRecording,
      toggleHuddleHand,
      setHuddleMinimized,
      updateHuddlePosition,
      setHuddleNotes,
      setLayoutMode,
      setShowNotesDrawer,
      setMicLevel,
      savedRecordings,
      setSavedRecordings,
      recordingAnnouncementToast,
      huddleLogs,
      setHuddleLogs
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
