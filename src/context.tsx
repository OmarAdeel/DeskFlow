import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { announceRecordingStatus } from './utils/audioAnnounce';

export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
}

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  title?: string;
  phone?: string;
  channelIds?: string[];
  username?: string;
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
  setChannels: (channels: Channel[]) => void;
  users: WorkspaceUser[];
  setUsers: (users: WorkspaceUser[]) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  drafts: Draft[];
  setDrafts: (drafts: Draft[]) => void;
  savedItems: string[];
  setSavedItems: (items: string[]) => void;
  currentUser: WorkspaceUser | undefined;
  userLanguage: string;
  setUserLanguage: (lang: string) => void;
  userTheme: string;
  setUserTheme: (theme: string) => void;
  userStatus: string;
  setUserStatus: (status: string) => void;
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

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaceName, setWorkspaceName] = useState(() => {
    return localStorage.getItem('workspace_name') || 'Demo Company';
  });
  
  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('workspace_channels');
    return saved ? JSON.parse(saved) : defaultChannels;
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
    return localStorage.getItem('workspace_user_theme') || 'Dark Enterprise';
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
      title: 'Slack UI & Workflow Integration Sync',
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

  const currentUser = users.find(u => u.name === 'Abdallah Sayed');

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
    localStorage.setItem('workspace_messages', JSON.stringify(messages));
  }, [messages]);

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
      messages, setMessages,
      drafts, setDrafts,
      savedItems, setSavedItems,
      currentUser,
      userLanguage, setUserLanguage,
      userTheme, setUserTheme,
      userStatus, setUserStatus,
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
