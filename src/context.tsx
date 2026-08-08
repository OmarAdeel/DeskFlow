import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { announceRecordingStatus } from './utils/audioAnnounce';
import { supabase } from './lib/supabase';
import { showDeskFlowNotification } from './hooks/useWebAppFeatures';

export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  /** Organization/workspace that owns the channel. */
  organizationId?: string;
  /** Explicit human channel membership. Older channels may omit this and use user.channelIds as a fallback. */
  memberIds?: string[];
  /** Explicit AI agent channel membership, stored separately because agents are not profiles. */
  agentIds?: string[];
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
  if (channel.memberIds || channel.agentIds) return Boolean(channel.memberIds?.includes(user.id) || channel.agentIds?.includes(user.id));
  return Boolean(user.channelIds?.includes(channel.id));
}

export type PresenceStatus = 'online' | 'away' | 'dnd' | 'meeting' | 'offline';

export interface UserPresence {
  status: PresenceStatus;
  lastSeenAt?: number;
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
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  deleteMessages: (messageIds: string[]) => Promise<void>;
  drafts: Draft[];
  setDrafts: (drafts: Draft[]) => void;
  savedItems: string[];
  setSavedItems: React.Dispatch<React.SetStateAction<string[]>>;
  dmUnreadByUserId: Record<string, number>;
  markDmRead: (userId: string) => void;
  currentUser: WorkspaceUser | undefined;
  presenceByUserId: Record<string, UserPresence>;
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  isPasswordRecovery: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  loginWithGoogle: () => Promise<string | null>;
  logout: () => void;
  changeCurrentUserPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  adminSetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  adminCreateUser: (input: { name: string; email: string; username: string; title?: string; phone?: string; role: string; organizationId: string; channelIds: string[] }) => Promise<{ success: boolean; user?: WorkspaceUser; error?: string }>;
  adminSaveOrganization: (input: { id: string; name: string; description?: string; logoUrl?: string; memberIds: string[] }) => Promise<{ success: boolean; organization?: Organization; error?: string }>;
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

// Older production databases may not have the optional agent-membership table yet.
// Avoid retrying the same 404 during auth/workspace rehydration; the migration
// remains required before agent channel membership can be persisted.
let channelAgentsTableAvailable: boolean | null = null;
let agentMessagesTableAvailable: boolean | null = null;

function passwordMeetsRequirements(password: string): boolean {
  return password.length >= 8;
}

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    ['workspace_channels', 'workspace_users', 'workspace_messages', 'workspace_organizations', 'workspace_savedItems', 'workspace_password_credentials', 'workspace_password_reset_tokens']
      .forEach(key => localStorage.removeItem(key));
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type') === 'recovery');
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [isSupabaseHydrated, setIsSupabaseHydrated] = useState(false);
  const hydrationGenerationRef = useRef(0);

  const [workspaceName, setWorkspaceName] = useState(() => {
    return localStorage.getItem('workspace_name') || 'Demo Company';
  });
  
  const [channels, setChannelsState] = useState<Channel[]>(defaultChannels);

  const [users, setUsers] = useState<WorkspaceUser[]>(defaultUsers);


  const [organizations, setOrganizationsState] = useState<Organization[]>([]);

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

  const [agents, setAgentsState] = useState<WorkspaceAgent[]>([]);

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
          .filter(channel => channel.agentIds ? channel.agentIds.includes(agent.id) : (channel.memberIds ? channel.memberIds.includes(agent.id) : !channel.isPrivate))
          .map(channel => channel.id)
      }));
      return [...regularUsers, ...agentUsers];
    });
  }, [agents, channels, organizations]);

  const [messages, setMessagesState] = useState<Message[]>(() => {
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

  const [drafts, setDrafts] = useState<Draft[]>([]);

  const [savedItems, setSavedItemsState] = useState<string[]>([]);
  const [dmUnreadByUserId, setDmUnreadByUserId] = useState<Record<string, number>>({});
  const dmInboxInitializedRef = useRef(false);
  const dmSeenMessageIdsRef = useRef<Set<string>>(new Set());
  const dmNotifiedMessageIdsRef = useRef<Set<string>>(new Set());

  const syncedMessagesRef = useRef<Message[]>([]);
  const deletedMessageIdsRef = useRef<Set<string>>(new Set());
  const syncedSavedItemsRef = useRef<string[]>([]);

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

  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, UserPresence>>({});

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

  const hydrateWorkspace = async (authUser: User, generation = ++hydrationGenerationRef.current) => {
    setIsSupabaseHydrated(false);
    // OAuth sign-ins (for example Google) do not automatically create a
    // workspace profile. Ask the server to provision one (idempotently) so
    // RLS lets the new account read the workspace before hydration runs.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && authUser.app_metadata?.provider === 'google') {
        await fetch('/api/auth-google-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            userId: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'DeskFlow User',
            avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture
          })
        });
      }
    } catch (error) {
      console.error('Unable to provision the Google sign-in profile.', error);
    }
    const loadChannelAgents = async () => {
      if (channelAgentsTableAvailable === false) return { data: [], error: null };
      const result = await supabase.from('channel_agents').select('*');
      if (result.error?.code === 'PGRST205') {
        channelAgentsTableAvailable = false;
        console.warn('The optional channel_agents table is not installed. Apply scripts/supabase-channel-agents.sql to enable persistent AI agent channel membership.');
        return { data: [], error: null };
      }
      if (!result.error) channelAgentsTableAvailable = true;
      return result;
    };
    const loadAgentMessages = async () => {
      if (agentMessagesTableAvailable === false) return { data: [], error: null };
      const result = await supabase.from('agent_messages').select('*').order('created_at');
      if (result.error?.code === 'PGRST205') {
        agentMessagesTableAvailable = false;
        console.warn('The agent_messages table is not installed. Apply scripts/supabase-agent-messages.sql before asking agents to reply.');
        return { data: [], error: null };
      }
      if (!result.error) agentMessagesTableAvailable = true;
      return result;
    };
    const results = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('organizations').select('*').order('created_at'),
      supabase.from('organization_members').select('*'),
      supabase.from('channels').select('*').order('created_at'),
      supabase.from('channel_members').select('*'),
      loadChannelAgents(),
      supabase.from('messages').select('*').order('created_at'),
      loadAgentMessages(),
      supabase.from('message_reactions').select('*'),
      supabase.from('saved_items').select('message_id'),
      supabase.from('agents').select('*').order('created_at')
    ]);
    if (generation !== hydrationGenerationRef.current) return;
    const failed = results.find(result => result.error);
    if (failed?.error) throw failed.error;
    const [profiles, organizationRows, membershipRows, channelRows, channelMembershipRows, channelAgentRows, messageRows, agentMessageRows, reactionRows, savedRows, agentRows] = results.map(result => result.data || []);

    const nextUsers: WorkspaceUser[] = profiles.map((profile: any) => ({
      id: profile.id, name: profile.name, email: profile.email, username: profile.username || undefined,
      role: profile.role, title: profile.title || undefined, phone: profile.phone || undefined,
      avatarUrl: profile.avatar_url || undefined, status: profile.status,
      organizationIds: membershipRows.filter((member: any) => member.user_id === profile.id).map((member: any) => member.organization_id),
      channelIds: channelMembershipRows.filter((member: any) => member.user_id === profile.id).map((member: any) => member.channel_id)
    }));
    const nextOrganizations: Organization[] = organizationRows.map((organization: any) => ({
      id: organization.id, name: organization.name, description: organization.description || undefined,
      logoUrl: organization.logo_url || undefined,
      memberIds: [
        ...membershipRows.filter((member: any) => member.organization_id === organization.id).map((member: any) => member.user_id),
        ...agentRows.filter((agent: any) => agent.organization_id === organization.id).map((agent: any) => agent.id)
      ],
      createdAt: new Date(organization.created_at).getTime()
    }));
    const nextChannels: Channel[] = channelRows.map((channel: any) => ({
      id: channel.id, name: channel.name, isPrivate: channel.is_private, organizationId: channel.organization_id,
      memberIds: channelMembershipRows.filter((member: any) => member.channel_id === channel.id).map((member: any) => member.user_id),
      agentIds: channelAgentRows.filter((member: any) => member.channel_id === channel.id).map((member: any) => member.agent_id)
    }));
    const replies = new Map<string, Reply[]>();
    const addReply = (parentId: string, reply: Reply) => {
      const existing = replies.get(parentId) || [];
      if (!existing.some(item => item.id === reply.id)) existing.push(reply);
      replies.set(parentId, existing);
    };
    for (const row of messageRows.filter((message: any) => message.parent_message_id) as any[]) {
      addReply(row.parent_message_id, {
        id: row.id, senderId: row.sender_id, text: row.content, timestamp: new Date(row.created_at).getTime(), isRead: true,
        reactions: reactionRows.filter((reaction: any) => reaction.message_id === row.id).map((reaction: any) => reaction.emoji)
      });
    }
    for (const row of agentMessageRows as any[]) {
      if (row.parent_message_id) {
        addReply(row.parent_message_id, {
          id: row.id, senderId: row.agent_id, text: row.content, timestamp: new Date(row.created_at).getTime(), isRead: true, reactions: []
        });
      }
    }
    const nextMessages: Message[] = [
      ...(messageRows as any[]).filter(row => !row.parent_message_id && row.channel_id).map(row => ({
        id: row.id, channelId: row.channel_id, senderId: row.sender_id, text: row.content,
        timestamp: new Date(row.created_at).getTime(), isRead: true, replies: replies.get(row.id) || [],
        reactions: reactionRows.filter((reaction: any) => reaction.message_id === row.id).map((reaction: any) => reaction.emoji)
      })),
      ...(agentMessageRows as any[]).filter(row => !row.parent_message_id && row.channel_id).map(row => ({
        id: row.id, channelId: row.channel_id, senderId: row.agent_id, text: row.content,
        timestamp: new Date(row.created_at).getTime(), isRead: true, replies: replies.get(row.id) || [], reactions: []
      }))
    ].sort((a, b) => a.timestamp - b.timestamp);
    const nextSavedItems = savedRows.map((item: any) => item.message_id);
    let localAgentKeys: Record<string, string> = {};
    try { localAgentKeys = JSON.parse(localStorage.getItem(`workspace_agent_keys_${authUser.id}`) || '{}'); } catch { localAgentKeys = {}; }
    const nextAgents: WorkspaceAgent[] = agentRows.map((agent: any) => ({
      id: agent.id, name: agent.name, username: agent.username, email: agent.email, model: agent.model,
      apiBaseUrl: agent.api_base_url, apiKey: localAgentKeys[agent.id] || '', jobDetails: agent.job_details, personality: agent.personality,
      databaseAccess: { organizations: agent.can_read_organizations, publicThreads: agent.can_read_public_threads, webSearch: agent.can_search_web },
      enabled: agent.enabled, createdAt: new Date(agent.created_at).getTime()
    }));

    if (generation !== hydrationGenerationRef.current) return;
    setAuthenticatedUserId(authUser.id);
    setUsers(nextUsers);
    setOrganizationsState(nextOrganizations);
    setChannelsState(nextChannels);
    setMessagesState(nextMessages);
    setSavedItemsState(nextSavedItems);
    setAgentsState(nextAgents);
    const savedDrafts = localStorage.getItem(`workspace_drafts_${authUser.id}`);
    try { setDrafts(savedDrafts ? JSON.parse(savedDrafts) : []); } catch { setDrafts([]); }
    syncedMessagesRef.current = nextMessages;
    syncedSavedItemsRef.current = nextSavedItems;
    setWorkspaceName(nextOrganizations[0]?.name || 'DeskFlow');
    setIsAuthenticated(true);
    setIsSupabaseHydrated(true);
  };

  useEffect(() => {
    let active = true;
    const applyUser = async (user: User | null) => {
      if (!active) return;
      const generation = ++hydrationGenerationRef.current;
      if (!user) {
        setAuthenticatedUserId(null); setIsAuthenticated(false); setIsSupabaseHydrated(false); setDrafts([]);
        setIsAuthInitialized(true);
        return;
      }
      try { await hydrateWorkspace(user, generation); }
      catch (error) {
        console.error('Unable to load the Supabase workspace.', error);
        if (active && generation === hydrationGenerationRef.current) {
          setAuthenticatedUserId(null); setIsAuthenticated(false); setIsSupabaseHydrated(false);
        }
      } finally {
        if (active && generation === hydrationGenerationRef.current) setIsAuthInitialized(true);
      }
    };
    void supabase.auth.getSession().then(({ data }) => applyUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
      void applyUser(session?.user || null);
    });
    return () => { active = false; ++hydrationGenerationRef.current; data.subscription.unsubscribe(); };
  }, []);

  const currentUser = users.find(user => user.id === authenticatedUserId);

  const setAgents: React.Dispatch<React.SetStateAction<WorkspaceAgent[]>> = update => {
    setAgentsState(previous => {
      const next = typeof update === 'function' ? update(previous) : update;
      if (authenticatedUserId) {
        const localKeys = Object.fromEntries(next.filter(agent => agent.apiKey).map(agent => [agent.id, agent.apiKey]));
        localStorage.setItem(`workspace_agent_keys_${authenticatedUserId}`, JSON.stringify(localKeys));
      }
      if (isSupabaseHydrated && authenticatedUserId && currentUser?.role === 'Super Admin') {
        void reconcileAgents(previous, next, authenticatedUserId);
      }
      return next;
    });
  };

  const reconcileAgents = async (previous: WorkspaceAgent[], next: WorkspaceAgent[], userId: string) => {
    const nextIds = new Set(next.map(agent => agent.id));
    for (const agent of next) {
      const existing = previous.find(item => item.id === agent.id);
      if (existing && JSON.stringify({ ...existing, apiKey: '' }) === JSON.stringify({ ...agent, apiKey: '' })) continue;
      const organizationId = organizations.find(organization => organization.memberIds.includes(agent.id))?.id || activeOrganizationId;
      if (!organizationId) continue;
      const { error } = await supabase.from('agents').upsert({
        id: agent.id, organization_id: organizationId, name: agent.name, username: agent.username,
        email: agent.email, model: agent.model, api_base_url: agent.apiBaseUrl,
        job_details: agent.jobDetails, personality: agent.personality,
        can_read_organizations: agent.databaseAccess.organizations,
        can_read_public_threads: agent.databaseAccess.publicThreads,
        can_search_web: agent.databaseAccess.webSearch || false,
        enabled: agent.enabled, created_by: userId, updated_at: new Date().toISOString()
      });
      if (error) console.error('Unable to save agent configuration.', error);
    }
    const removed = previous.filter(agent => !nextIds.has(agent.id));
    if (removed.length) {
      const { error } = await supabase.from('agents').delete().in('id', removed.map(agent => agent.id));
      if (error) console.error('Unable to delete agents.', error);
    }
  };

  const setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>> = update => {
    setOrganizationsState(previous => {
      const next = typeof update === 'function' ? update(previous) : update;
      if (isSupabaseHydrated && authenticatedUserId && currentUser?.role === 'Super Admin') {
        void reconcileOrganizations(previous, next, authenticatedUserId);
      }
      return next;
    });
  };

  const reconcileOrganizations = async (previous: Organization[], next: Organization[], userId: string) => {
    const previousIds = new Set(previous.map(organization => organization.id));
    const nextIds = new Set(next.map(organization => organization.id));
    const removed = previous.filter(organization => !nextIds.has(organization.id));
    for (const organization of next) {
      const isNew = !previousIds.has(organization.id);
      const { error } = await supabase.from('organizations').upsert({
        id: organization.id,
        name: organization.name,
        description: organization.description || null,
        logo_url: organization.logoUrl || null,
        created_by: isNew ? userId : undefined,
        updated_at: new Date().toISOString()
      });
      if (error) { console.error('Unable to save organization.', error); continue; }

      const validMemberIds = Array.from(new Set([userId, ...organization.memberIds.filter(id => users.some(user => user.id === id && !user.isAgent))]));
      const existing = previous.find(item => item.id === organization.id)?.memberIds.filter(id => users.some(user => user.id === id && !user.isAgent)) || [];
      const additions = validMemberIds.filter(id => !existing.includes(id));
      const deletions = existing.filter(id => id !== userId && !validMemberIds.includes(id));
      if (additions.length) {
        const rows = additions.map(memberId => ({ organization_id: organization.id, user_id: memberId, role: memberId === userId ? 'Super Admin' : users.find(user => user.id === memberId)?.role || 'Member' }));
        const { error: memberError } = await supabase.from('organization_members').upsert(rows, { onConflict: 'organization_id,user_id' });
        if (memberError) console.error('Unable to add organization members.', memberError);
      }
      if (deletions.length) {
        const { error: memberError } = await supabase.from('organization_members').delete().eq('organization_id', organization.id).in('user_id', deletions);
        if (memberError) console.error('Unable to remove organization members.', memberError);
      }
    }
    for (const organization of removed) {
      const { error } = await supabase.from('organizations').delete().eq('id', organization.id);
      if (error) console.error('Unable to delete organization.', error);
    }
  };

  const setChannels: React.Dispatch<React.SetStateAction<Channel[]>> = update => {
    setChannelsState(previous => {
      const requested = typeof update === 'function' ? update(previous) : update;
      const next = requested.map(channel => channel.organizationId || !activeOrganizationId
        ? channel
        : { ...channel, organizationId: activeOrganizationId }
      );
      if (isSupabaseHydrated && authenticatedUserId) void reconcileChannels(previous, next, authenticatedUserId);
      return next;
    });
  };

  const persistChannelMembership = async (organizationId: string, channelId: string, memberIds: string[], agentIds: string[] = []) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('Unable to save channel members: the DeskFlow session is unavailable.');
      return;
    }
    try {
      const response = await fetch('/api/channel-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ organizationId, channelId, memberIds, agentIds })
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null) as { error?: string } | null;
        console.error('Unable to save channel members.', detail?.error || response.status);
      }
    } catch (error) {
      console.error('Unable to save channel members.', error);
    }
  };

  const reconcileChannels = async (previous: Channel[], next: Channel[], userId: string) => {
    const nextIds = new Set(next.map(channel => channel.id));
    const removed = previous.filter(channel => !nextIds.has(channel.id));
    for (const channel of next) {
      const previousChannel = previous.find(item => item.id === channel.id);
      const organizationId = channel.organizationId || activeOrganizationId;
      if (!organizationId) continue;
      const channelMetadataChanged = !previousChannel
        || previousChannel.name !== channel.name
        || previousChannel.isPrivate !== channel.isPrivate
        || previousChannel.organizationId !== channel.organizationId;
      if (channelMetadataChanged) {
        const { error } = await supabase.from('channels').upsert({
          id: channel.id, organization_id: organizationId, name: channel.name,
          is_private: channel.isPrivate, created_by: previousChannel ? undefined : userId
        });
        if (error) console.error('Unable to save channel metadata.', error);
      }

      const desiredMemberIds = Array.from(new Set(channel.memberIds || []));
      const previousMemberIds = Array.from(new Set(previousChannel?.memberIds || []));
      const desiredAgentIds = Array.from(new Set(channel.agentIds || []));
      const previousAgentIds = Array.from(new Set(previousChannel?.agentIds || []));
      if (JSON.stringify(desiredMemberIds) !== JSON.stringify(previousMemberIds)
        || JSON.stringify(desiredAgentIds) !== JSON.stringify(previousAgentIds)) {
        void persistChannelMembership(organizationId, channel.id, desiredMemberIds, desiredAgentIds);
      }
    }
    if (removed.length) {
      const { error } = await supabase.from('channels').delete().in('id', removed.map(channel => channel.id));
      if (error) console.error('Unable to delete channels.', error);
    }
  };

  const setSavedItems: React.Dispatch<React.SetStateAction<string[]>> = update => {
    setSavedItemsState(previous => {
      const next = typeof update === 'function' ? update(previous) : update;
      if (isSupabaseHydrated && authenticatedUserId) {
        const added = next.filter(id => !previous.includes(id));
        const removed = previous.filter(id => !next.includes(id));
        void (async () => {
          if (added.length) {
            const organizationByMessage = new Map(messages.map(message => [message.id, channels.find(channel => channel.id === message.channelId)?.organizationId]));
            const rows = added.map(messageId => ({ organization_id: organizationByMessage.get(messageId), user_id: authenticatedUserId, message_id: messageId }));
            const { error } = await supabase.from('saved_items').upsert(rows, { onConflict: 'user_id,message_id' });
            if (error) console.error('Unable to save items.', error);
          }
          if (removed.length) {
            const { error } = await supabase.from('saved_items').delete().eq('user_id', authenticatedUserId).in('message_id', removed);
            if (error) console.error('Unable to remove saved items.', error);
          }
        })();
      }
      syncedSavedItemsRef.current = next;
      return next;
    });
  };

  const setMessages: React.Dispatch<React.SetStateAction<Message[]>> = update => {
    setMessagesState(previous => {
      const next = typeof update === 'function' ? update(previous) : update;
      if (isSupabaseHydrated && authenticatedUserId) void persistMessageChanges(previous, next, authenticatedUserId);
      syncedMessagesRef.current = next;
      return next;
    });
  };

  const deleteMessages = async (messageIds: string[]) => {
    const ids = Array.from(new Set(messageIds.filter(Boolean)));
    if (!ids.length) return;
    ids.forEach(id => deletedMessageIdsRef.current.add(id));
    setMessagesState(previous => {
      const idSet = new Set(ids);
      const next = previous
        .filter(message => !idSet.has(message.id))
        .map(message => ({ ...message, replies: message.replies.filter(reply => !idSet.has(reply.id)) }));
      syncedMessagesRef.current = next;
      return next;
    });
    if (!isSupabaseHydrated || !authenticatedUserId) return;
    const { error } = await supabase.from('messages').delete().in('id', ids);
    if (error) console.error('Unable to delete messages.', error);
  };

  const persistMessageChanges = async (previous: Message[], next: Message[], userId: string) => {
    const flatten = (items: Message[]) => items.flatMap(message => [
      { id: message.id, channelId: message.channelId, senderId: message.senderId, text: message.text, timestamp: message.timestamp, parentId: null as string | null, reactions: message.reactions || [] },
      ...message.replies.map(reply => ({ id: reply.id, channelId: message.channelId, senderId: reply.senderId, text: reply.text, timestamp: reply.timestamp, parentId: message.id, reactions: reply.reactions || [] }))
    ]);
    const before = new Map(flatten(previous).map(row => [row.id, row]));
    const nextRows = flatten(next).filter(row => !deletedMessageIdsRef.current.has(row.id));
    const agentIds = new Set(agents.map(agent => agent.id));
    const changed = nextRows.filter(row => {
      const previousRow = before.get(row.id);
      if (previousRow) {
        const changedByOwner = row.senderId === userId
          && (previousRow.text !== row.text || previousRow.channelId !== row.channelId || previousRow.parentId !== row.parentId || previousRow.timestamp !== row.timestamp);
        const agentTextChanged = agentIds.has(row.senderId) && previousRow.text !== row.text;
        return changedByOwner || agentTextChanged;
      }
      return row.senderId === userId || agentIds.has(row.senderId);
    });
    // Never infer deletions from array differences. Several screens can issue
    // updates from a stale render snapshot; treating absent rows as deleted can
    // remove unrelated human messages from Supabase. Explicit deletion uses
    // deleteMessages() instead.
    // Agent messages cannot be upserted through the normal client path: the
    // `sender_id` column references `profiles(id)` and RLS requires the
    // sender to be the signed-in user. Send them through the server route,
    // which validates the session/agent and writes with the service role.
    const agentRows = changed.filter(row => agents.some(agent => agent.id === row.senderId) && !row.id.startsWith('agent_placeholder_'));
    if (agentRows.length) {
      void persistAgentMessages(agentRows, organizationByChannel(channels));
    }
    const userChanged = changed.filter(row => !agents.some(agent => agent.id === row.senderId));
    if (userChanged.length) {
      const organizationByChannel = new Map(channels.map(channel => [channel.id, channel.organizationId]));
      const { error } = await supabase.from('messages').upsert(userChanged.map(row => ({
        id: row.id, organization_id: organizationByChannel.get(row.channelId), channel_id: row.channelId,
        sender_id: row.senderId, parent_message_id: row.parentId, content: row.text,
        created_at: new Date(row.timestamp).toISOString(), updated_at: new Date().toISOString()
      })));
      if (error) console.error('Unable to save messages.', error);
    }
    const beforeRows = flatten(previous);
    for (const row of nextRows) {
      const previousReactions = beforeRows.find(item => item.id === row.id)?.reactions || [];
      const nextReactions = row.reactions || [];
      const added = nextReactions.filter(reaction => !previousReactions.includes(reaction));
      const deleted = previousReactions.filter(reaction => !nextReactions.includes(reaction));
      if (added.length) {
        const { error } = await supabase.from('message_reactions').upsert(added.map(emoji => ({ message_id: row.id, user_id: userId, emoji })), { onConflict: 'message_id,user_id,emoji' });
        if (error) console.error('Unable to save reactions.', error);
      }
      if (deleted.length) {
        const { error } = await supabase.from('message_reactions').delete().eq('message_id', row.id).eq('user_id', userId).in('emoji', deleted);
        if (error) console.error('Unable to remove reactions.', error);
      }
    }
  };

  const organizationByChannel = (channelList: Channel[]) => new Map(channelList.map(channel => [channel.id, channel.organizationId]));

  const persistAgentMessages = async (rows: Array<{ id: string; channelId: string; senderId: string; text: string; timestamp: number; parentId: string | null }>, organizationByChannelMap: Map<string, string | undefined>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const organizationId = organizationByChannelMap.get(rows[0]?.channelId || '') || activeOrganizationId || '';
    if (!organizationId) return;
    for (const row of rows) {
      try {
        const response = await fetch('/api/agent-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            messageId: row.id,
            organizationId,
            channelId: row.channelId,
            senderId: row.senderId,
            parentMessageId: row.parentId,
            content: row.text,
            createdAt: new Date(row.timestamp).toISOString()
          })
        });
        if (!response.ok) {
          const detail = await response.json().catch(() => null) as { error?: string } | null;
          console.error('Unable to save agent message.', detail?.error || response.status);
        }
      } catch (error) {
        console.error('Unable to save agent message.', error);
      }
    }
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return error.message;
    setIsPasswordRecovery(false);
    return null;
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) return error.message;
    // The OAuth flow navigates the browser to Google and back; no further
    // state is needed here.
    return null;
  };

  const logout = () => {
    ++hydrationGenerationRef.current;
    void supabase.auth.signOut();
    setAuthenticatedUserId(null); setIsAuthenticated(false); setIsSupabaseHydrated(false); setIsProfileModalOpen(false);
  };

  const changeCurrentUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, error: 'No signed-in user was found.' };
    if (!passwordMeetsRequirements(newPassword)) return { success: false, error: 'New password must be at least 8 characters.' };
    if (currentPassword === newPassword) return { success: false, error: 'New password must be different from the current password.' };
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: currentPassword });
    if (verifyError) return { success: false, error: 'Current password is incorrect.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const adminSetUserPassword = async (userId: string, newPassword: string) => {
    if (currentUser?.role !== 'Super Admin') return { success: false, error: 'Only a Super Admin can set another user’s password.' };
    if (!passwordMeetsRequirements(newPassword)) return { success: false, error: 'Password must be at least 8 characters.' };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { success: false, error: 'Your session has expired. Sign in again.' };
    try {
      const response = await fetch('/api/admin-set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId, newPassword })
      });
      const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      return response.ok && result?.success
        ? { success: true }
        : { success: false, error: result?.error || 'Unable to set this password.' };
    } catch {
      return { success: false, error: 'The password service could not be reached.' };
    }
  };

  const adminCreateUser: WorkspaceContextProps['adminCreateUser'] = async input => {
    if (currentUser?.role !== 'Super Admin') return { success: false, error: 'Only a Super Admin can add workspace users.' };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { success: false, error: 'Your session has expired. Sign in again.' };
    try {
      const response = await fetch('/api/admin-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(input)
      });
      const result = await response.json().catch(() => null) as { success?: boolean; user?: WorkspaceUser; error?: string } | null;
      if (!response.ok || !result?.success || !result.user) return { success: false, error: result?.error || 'Unable to create this user.' };
      return { success: true, user: result.user };
    } catch {
      return { success: false, error: 'The user administration service could not be reached.' };
    }
  };

  const adminSaveOrganization: WorkspaceContextProps['adminSaveOrganization'] = async input => {
    if (currentUser?.role !== 'Super Admin') return { success: false, error: 'Only a Super Admin can save organizations.' };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { success: false, error: 'Your session has expired. Sign in again.' };
    try {
      const response = await fetch('/api/admin-save-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(input)
      });
      const result = await response.json().catch(() => null) as { success?: boolean; organization?: Organization; error?: string } | null;
      if (!response.ok || !result?.success || !result.organization) return { success: false, error: result?.error || 'Unable to save this organization.' };
      const savedOrganization = result.organization;
      setOrganizationsState(previous => previous.some(organization => organization.id === savedOrganization.id)
        ? previous.map(organization => organization.id === savedOrganization.id ? savedOrganization : organization)
        : [...previous, savedOrganization]
      );
      setUsers(previous => previous.map(user => ({
        ...user,
        organizationIds: savedOrganization.memberIds.includes(user.id)
          ? Array.from(new Set([...(user.organizationIds || []), savedOrganization.id]))
          : (user.organizationIds || []).filter(organizationId => organizationId !== savedOrganization.id)
      })));
      return { success: true, organization: savedOrganization };
    } catch {
      return { success: false, error: 'The organization administration service could not be reached.' };
    }
  };

  const requestPasswordReset = async (email: string) => {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const resetPasswordWithToken = async (_token: string, newPassword: string) => {
    if (!passwordMeetsRequirements(newPassword)) return { success: false, error: 'Password must be at least 8 characters.' };
    const { data } = await supabase.auth.getSession();
    if (!data.session) return { success: false, error: 'This reset link is invalid or has expired.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    setIsPasswordRecovery(false);
    await supabase.auth.signOut();
    return { success: true };
  };

  useEffect(() => {
    if (!isAuthenticated || !authenticatedUserId) {
      setPresenceByUserId({});
      return;
    }
    const presenceChannel = supabase.channel('deskflow-online-presence', {
      config: { presence: { key: authenticatedUserId } }
    });
    const effectiveStatus = (): PresenceStatus => {
      if (!navigator.onLine) return 'offline';
      if (document.visibilityState !== 'visible') return 'away';
      if (userStatus === 'Do Not Disturb') return 'dnd';
      if (userStatus === 'In a Meeting') return 'meeting';
      if (userStatus === 'Away') return 'away';
      return 'online';
    };
    const publishPresence = () => {
      if (presenceChannel.state === 'joined') {
        void presenceChannel.track({ user_id: authenticatedUserId, status: effectiveStatus(), online_at: Date.now() });
      }
    };
    const syncPresence = () => {
      const state = presenceChannel.presenceState() as Record<string, Array<{ user_id?: string; status?: PresenceStatus; online_at?: number }>>;
      setPresenceByUserId(previous => {
        const next: Record<string, UserPresence> = {};
        users.filter(user => !user.isAgent).forEach(user => {
          const entries = state[user.id] || [];
          const statuses = entries.map(entry => entry.status).filter(Boolean) as PresenceStatus[];
          const status: PresenceStatus = statuses.includes('online') ? 'online'
            : statuses.includes('meeting') ? 'meeting'
              : statuses.includes('dnd') ? 'dnd'
                : statuses.includes('away') ? 'away'
                  : 'offline';
          next[user.id] = {
            status,
            lastSeenAt: status === 'offline' ? previous[user.id]?.lastSeenAt || Date.now() : undefined
          };
        });
        return next;
      });
    };
    presenceChannel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          publishPresence();
          syncPresence();
        }
      });
    document.addEventListener('visibilitychange', publishPresence);
    window.addEventListener('online', publishPresence);
    window.addEventListener('offline', publishPresence);
    return () => {
      document.removeEventListener('visibilitychange', publishPresence);
      window.removeEventListener('online', publishPresence);
      window.removeEventListener('offline', publishPresence);
      void presenceChannel.untrack();
      void supabase.removeChannel(presenceChannel);
    };
  }, [authenticatedUserId, isAuthenticated, userStatus, users]);

  useEffect(() => {
    if (!isAuthenticated || !authenticatedUserId || !currentUser || !activeOrganizationId || agentMessagesTableAvailable === false) return;

    const realtimeChannel = supabase.channel(`deskflow-agent-messages-${authenticatedUserId}-${activeOrganizationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_messages', filter: `organization_id=eq.${activeOrganizationId}` }, payload => {
        const row = payload.new as {
          id?: string;
          organization_id?: string;
          channel_id?: string;
          agent_id?: string;
          parent_message_id?: string | null;
          content?: string;
          created_at?: string;
        };
        if (!row.id || !row.channel_id || !row.agent_id || !row.created_at || row.organization_id !== activeOrganizationId) return;
        const targetChannel = channels.find(channel => channel.id === row.channel_id);
        if (!targetChannel || !canAccessChannel(targetChannel, currentUser, activeOrganizationId)) return;

        const incomingTimestamp = new Date(row.created_at).getTime();
        setMessagesState(previous => {
          if (previous.some(message => message.id === row.id || message.replies.some(reply => reply.id === row.id))) {
            syncedMessagesRef.current = previous;
            return previous;
          }
          if (row.parent_message_id) {
            const parentExists = previous.some(message => message.id === row.parent_message_id || message.replies.some(reply => reply.id === row.parent_message_id));
            if (!parentExists) {
              syncedMessagesRef.current = previous;
              return previous;
            }
            const next = previous.map(message => message.id === row.parent_message_id
              ? { ...message, replies: [...message.replies, { id: row.id as string, senderId: row.agent_id as string, text: String(row.content || ''), timestamp: incomingTimestamp, isRead: true, reactions: [] }] }
              : message);
            syncedMessagesRef.current = next;
            return next;
          }
          const next = [...previous, {
            id: row.id as string,
            channelId: row.channel_id as string,
            senderId: row.agent_id as string,
            text: String(row.content || ''),
            timestamp: incomingTimestamp,
            isRead: true,
            replies: [],
            reactions: []
          }].sort((left, right) => left.timestamp - right.timestamp);
          syncedMessagesRef.current = next;
          return next;
        });
      })
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Unable to subscribe to persisted agent messages. Apply scripts/supabase-agent-messages.sql in Supabase.');
        }
      });

    return () => { void supabase.removeChannel(realtimeChannel); };
  }, [activeOrganizationId, agents, authenticatedUserId, channels, currentUser, isAuthenticated]);

  const markDmRead = (userId: string) => {
    if (!authenticatedUserId || !activeOrganizationId || !userId) return;
    const readAt = new Date().toISOString();
    localStorage.setItem(`workspace_dm_read_${authenticatedUserId}_${activeOrganizationId}_${userId}`, readAt);
    setDmUnreadByUserId(previous => {
      if (!previous[userId]) return previous;
      const next = { ...previous };
      delete next[userId];
      return next;
    });
  };

  useEffect(() => {
    if (!isAuthenticated || !authenticatedUserId || !currentUser || !activeOrganizationId) {
      setDmUnreadByUserId({});
      dmInboxInitializedRef.current = false;
      dmSeenMessageIdsRef.current.clear();
      dmNotifiedMessageIdsRef.current.clear();
      return;
    }

    const pollDmInbox = async () => {
      const { data: rows, error } = await supabase
        .from('messages')
        .select('id,conversation_id,sender_id,content,created_at,organization_id')
        .eq('organization_id', activeOrganizationId)
        .not('conversation_id', 'is', null)
        .neq('sender_id', authenticatedUserId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        console.error('Unable to poll direct message inbox.', error);
        return;
      }

      const unreadCounts: Record<string, number> = {};
      const newRows: any[] = [];
      for (const row of rows || []) {
        if (!row.id || !row.sender_id || !row.created_at) continue;
        const sender = users.find(user => user.id === row.sender_id);
        if (!sender || sender.isAgent) continue;
        const readAt = localStorage.getItem(`workspace_dm_read_${authenticatedUserId}_${activeOrganizationId}_${sender.id}`) || '';
        if (readAt && row.created_at <= readAt) continue;
        unreadCounts[sender.id] = (unreadCounts[sender.id] || 0) + 1;
        if (!dmSeenMessageIdsRef.current.has(row.id)) {
          dmSeenMessageIdsRef.current.add(row.id);
          if (dmInboxInitializedRef.current) newRows.push(row);
        }
      }
      dmInboxInitializedRef.current = true;
      setDmUnreadByUserId(unreadCounts);

      for (const row of newRows) {
        if (dmNotifiedMessageIdsRef.current.has(row.id)) continue;
        dmNotifiedMessageIdsRef.current.add(row.id);
        const sender = users.find(user => user.id === row.sender_id);
        if (!sender) continue;
        void showDeskFlowNotification(`${sender.name} sent you a direct message`, {
          body: String(row.content || 'Sent a new direct message').slice(0, 180),
          tag: `deskflow-dm-${row.id}`,
          data: { url: `${window.location.pathname}?view=dms&userId=${encodeURIComponent(sender.id)}` }
        });
      }
    };

    void pollDmInbox();
    const pollTimer = window.setInterval(() => { void pollDmInbox(); }, 3000);

    const channel = supabase.channel(`deskflow-message-notifications-${authenticatedUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const row = payload.new as { id?: string; organization_id?: string; channel_id?: string | null; conversation_id?: string | null; sender_id?: string; content?: string; parent_message_id?: string | null };
        if (!row.id || !row.sender_id || row.sender_id === authenticatedUserId) return;
        const sender = users.find(user => user.id === row.sender_id);
        if (row.conversation_id && row.organization_id === activeOrganizationId) {
          if (dmSeenMessageIdsRef.current.has(row.id)) return;
          dmSeenMessageIdsRef.current.add(row.id);
          // Browser notifications are useful even while DeskFlow is open: the
          // recipient may be working in another view or window. The message
          // id set above prevents this realtime event from being notified again
          // by the polling fallback.
          void showDeskFlowNotification(`${sender?.name || 'A teammate'} sent you a direct message`, {
            body: String(row.content || 'Sent a new direct message').slice(0, 180),
            tag: `deskflow-dm-${row.id}`,
            data: { url: `${window.location.pathname}?view=dms&userId=${encodeURIComponent(row.sender_id)}` }
          });
          return;
        }
        if (!row.channel_id) return;
        const targetChannel = channels.find(candidate => candidate.id === row.channel_id);
        if (!targetChannel || !canAccessChannel(targetChannel, currentUser, targetChannel.organizationId || null)) return;
        const params = new URLSearchParams({ view: 'channel', channelId: row.channel_id, messageId: row.parent_message_id || row.id });
        if (row.parent_message_id) params.set('replyId', row.id);
        void showDeskFlowNotification(`${sender?.name || 'A teammate'} in #${targetChannel.name}`, {
          body: String(row.content || 'Sent a new message').slice(0, 180),
          tag: `deskflow-message-${row.id}`,
          data: { url: `${window.location.pathname}?${params.toString()}` }
        });
      })
      .subscribe();
    return () => {
      window.clearInterval(pollTimer);
      void supabase.removeChannel(channel);
    };
  }, [activeOrganizationId, authenticatedUserId, channels, currentUser, isAuthenticated, users]);

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
          memberIds: organization.memberIds.filter(memberId => users.some(user => user.id === memberId && !user.isAgent)),
          agentIds: organization.memberIds.filter(memberId => agents.some(agent => agent.id === memberId))
        }));

      if (defaultChannels.length === 0 && migratedChannels.every((channel, index) => channel === previousChannels[index])) {
        return previousChannels;
      }
      return [...migratedChannels, ...defaultChannels];
    });
  }, [organizations, activeOrganizationId]);

  const updateCurrentUserProfile = (updates: { name?: string; email?: string; phone?: string; title?: string; avatarUrl?: string }) => {
    if (!currentUser) return;
    const previousUser = currentUser;
    void (async () => {
      const requestedEmail = updates.email?.trim();
      let effectiveEmail = previousUser.email;
      if (requestedEmail && requestedEmail !== previousUser.email) {
        const { data: authData, error: authError } = await supabase.auth.updateUser({ email: requestedEmail });
        if (authError) {
          console.error('Unable to update authentication email.', authError);
          return;
        }
        effectiveEmail = authData.user.email || previousUser.email;
      }
      const safeUpdates = { ...updates, email: effectiveEmail };
      setUsers(previousUsers => previousUsers.map(user => user.id === previousUser.id ? { ...user, ...safeUpdates } : user));
      const { error } = await supabase.from('profiles').update({
        name: safeUpdates.name ?? previousUser.name,
        phone: safeUpdates.phone ?? previousUser.phone ?? null,
        title: safeUpdates.title ?? previousUser.title ?? null,
        avatar_url: safeUpdates.avatarUrl ?? previousUser.avatarUrl ?? null,
        updated_at: new Date().toISOString()
      }).eq('id', previousUser.id);
      if (error) {
        console.error('Unable to update profile.', error);
        setUsers(previousUsers => previousUsers.map(user => user.id === previousUser.id ? previousUser : user));
      }
    })();
  };

  useEffect(() => {
    // The active workspace is a device preference; workspace data itself is loaded from Supabase.
    if (activeOrganizationId) {
      localStorage.setItem('workspace_active_organization', activeOrganizationId);
    } else {
      localStorage.removeItem('workspace_active_organization');
    }
  }, [activeOrganizationId]);

  useEffect(() => {
    if (authenticatedUserId) localStorage.setItem(`workspace_drafts_${authenticatedUserId}`, JSON.stringify(drafts));
  }, [drafts, authenticatedUserId]);

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
      messages, setMessages, deleteMessages,
      drafts, setDrafts,
      savedItems, setSavedItems,
      dmUnreadByUserId, markDmRead,
      currentUser,
      presenceByUserId,
      isAuthenticated, isAuthInitialized, isPasswordRecovery, login, loginWithGoogle, logout,
      changeCurrentUserPassword,
      adminSetUserPassword,
      adminCreateUser,
      adminSaveOrganization,
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
