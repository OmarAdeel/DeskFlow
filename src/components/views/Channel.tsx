import React, { useState, useRef, useEffect } from 'react';
import { canAccessChannel, useWorkspace, MessageAttachment } from '../../context';
import { 
  Hash, Lock, Send, MessageSquare, X, Bold, Italic, Underline, Strikethrough, 
  Link as LinkIcon, ListOrdered, List, AlignLeft, Code, SquareSlash, Plus, 
  Type, Smile, AtSign, MoreHorizontal, ChevronDown, Bell, BellOff, MoreVertical, 
  Users, PhoneOff, Mic, MicOff, Video, VideoOff, Trash2, Play, Pause, Check, 
  Volume2, Sparkles, Search, MessageCircle, FileText, ExternalLink, Zap, Clock, Bot,
  LayoutGrid, CheckCircle2, Circle, Tag
} from 'lucide-react';
import { MessageActions } from '../MessageActions';
import { MessageReactions } from '../MessageReactions';
import { FormattedMessage } from '../FormattedMessage';
import { DisplayName } from '../DisplayName';
import { EmojiDeluxe } from '../EmojiDeluxe';
import { UserAvatar, getAvatarUrl } from '../UserAvatar';
import { AgentConversationMessage, buildAgentWorkspaceContext, buildWorkspaceLink, containsAgentMention, requestAgentReply } from '../../utils/agentResponse';
import { createMessageId } from '../../utils/messageId';

// Beautiful inline sub-component to play recorded voice notes
function VoiceNotePlayer({ durationText }: { durationText: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<any>(null);

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 5;
        });
      }, 150);
    }
  };

  React.useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="mt-2.5 max-w-sm rounded-xl bg-gray-900 border border-gray-800 p-3.5 flex items-center space-x-3.5 select-none animate-fade-in">
      <button 
        onClick={togglePlay}
        className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 flex items-center justify-center transition shadow shadow-emerald-500/20 shrink-0 cursor-pointer"
      >
        {isPlaying ? <Pause className="h-[18px] w-[18px] fill-current" /> : <Play className="h-[18px] w-[18px] fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-1">
          <span className="text-emerald-400">Audio Clip • Voice</span>
          <span>{durationText}</span>
        </div>
        
        {/* Animated simulation soundwave bars */}
        <div className="flex items-center space-x-0.5 h-6">
          {[8, 14, 22, 12, 18, 20, 24, 10, 16, 20, 14, 24, 18, 12, 22, 10, 16, 22, 8, 12, 18, 14, 6].map((barHeight, idx) => {
            const isActive = isPlaying && (idx / 23) * 100 <= progress;
            return (
              <div 
                key={idx} 
                style={{ height: `${barHeight}px` }} 
                className={`w-1 rounded transition-all duration-300 ${
                  isActive 
                    ? 'bg-emerald-400 animate-pulse' 
                    : 'bg-gray-700'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Beautiful inline sub-component to play video messages
function VideoMessagePlayer({ durationText }: { durationText: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="mt-2.5 max-w-[280px] rounded-xl overflow-hidden bg-gray-900 border border-gray-800 select-none animate-fade-in group">
      <div className="relative h-40 bg-gray-950 flex items-center justify-center">
        {isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-gray-405 text-center p-4">
            <Sparkles className="h-8 w-8 text-emerald-400 animate-spin mb-3 duration-3000" />
            <p className="text-xs font-bold text-gray-200">Simulating Streaming Playback</p>
            <p className="text-[10px] text-gray-500 mt-1">Simulated camera feeds is rendering successfully.</p>
            <button 
              onClick={() => setIsPlaying(false)}
              className="mt-3 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded font-bold cursor-pointer"
            >
              Stop
            </button>
          </div>
        ) : (
          <>
            {/* Visual simulation overlay */}
            <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80')` }}></div>
            <div className="absolute inset-0 bg-neutral-950/20"></div>
            
            <button 
              onClick={() => setIsPlaying(true)}
              className="relative z-10 h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 flex items-center justify-center transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </button>

            <span className="absolute bottom-2.5 right-2.5 bg-neutral-900/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-gray-200 border border-gray-800">
              {durationText}
            </span>
          </>
        )}
      </div>
      <div className="p-3 bg-gray-900/80 border-t border-gray-800 flex items-center justify-between text-[11px] font-bold text-gray-400">
        <span className="text-emerald-400 flex items-center gap-1">
          <Video className="h-3.5 w-3.5" /> Video Clip
        </span>
        <span>Ready to play</span>
      </div>
    </div>
  );
}

export function ChannelView({ channelId, onNavigate }: { channelId: string, onNavigate: any }) {
  const { channels, users, setChannels, setUsers, organizations, agents, messages, setMessages, drafts, setDrafts, currentUser, userStatus, activeHuddle, startGlobalHuddle, endGlobalHuddle, toggleHuddleMic, activeOrganizationId } = useWorkspace();
  const channel = channels.find(c => c.id === channelId);
  const draft = drafts.find(d => d.channelId === channelId);
  
  const [newMessage, setNewMessage] = useState(draft?.text || '');
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<MessageAttachment | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [highlightedThreadItemId, setHighlightedThreadItemId] = useState<string | null>(null);
  const [threadReply, setThreadReply] = useState('');
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<number>(5);
  const [agentStatus, setAgentStatus] = useState<{ name: string; status: 'searching' | 'thinking' | 'checking' | 'typing' } | null>(null);
  const agentStatusTimerRef = useRef<number | null>(null);
  const agentRequestControllerRef = useRef<AbortController | null>(null);
  const agentRequestGenerationRef = useRef(0);
  
  const [activeTab, setActiveTab] = useState<'messages' | 'files' | 'links' | 'canvas'>('messages');

  const [workflows, setWorkflows] = useState(() => {
    const saved = localStorage.getItem(`demo_workflows_${channelId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return [
      {
        id: 'github_alerts',
        name: 'GitHub Repository Watcher',
        description: 'Auto-post channel alerts when new events occur on your codebase project repo.',
        active: false,
        repoUrl: 'https://github.com/abdallah/fintech-dashboard',
        branch: 'main',
        events: { pr: true, issues: false, push: true }
      },
      {
        id: 'daily_standup',
        name: 'Daily Standup Assistant',
        description: 'Asks team members what they worked on and compiles a report automatically.',
        active: true,
        time: '09:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        questions: '1. What did you achieve yesterday? \n2. What is your focus today? \n3. Any blockers?'
      },
      {
        id: 'keyword_alerts',
        name: 'Urgent Keyword Dispatcher',
        description: 'Sends a workspace action if critical keywords are mentioned in this channel.',
        active: false,
        keywords: 'CRITICAL, PROD_DOWN, SLA_FAIL',
        recipient: 'Abdallah Sayed'
      }
    ];
  });

  const saveWorkflows = (updated: any) => {
    setWorkflows(updated);
    localStorage.setItem(`demo_workflows_${channelId}`, JSON.stringify(updated));
  };

  const [canvasCards, setCanvasCards] = useState<any[]>([]);
  const [newChannelCanvasTitle, setNewChannelCanvasTitle] = useState('');
  const [selectedChannelCanvasColor, setSelectedChannelCanvasColor] = useState('border-blue-500');
  const [showChannelCanvasCreator, setShowChannelCanvasCreator] = useState(false);
  const [channelCanvasTaskInputs, setChannelCanvasTaskInputs] = useState<{ [cardId: string]: string }>({});

  useEffect(() => {
    const saved = localStorage.getItem('demo_canvas_cards');
    if (saved) {
      try {
        setCanvasCards(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    } else {
      const defaultCards = [
        {
          id: 'canvas_1',
          title: 'Project Alpha Launch',
          color: 'border-blue-500',
          channelId: '4', // General
          items: [
            { id: 'item_1_1', text: 'Set up testing checklist inside continuous integration', completed: true },
            { id: 'item_1_2', text: 'Review international accounting rules compliance', completed: false },
            { id: 'item_1_3', text: 'Deploy demo to staging servers', completed: false }
          ]
        },
        {
          id: 'canvas_2',
          title: 'Marketing Q3 Review',
          color: 'border-purple-500',
          channelId: '10', // vmops-system-and-integrations
          items: [
            { id: 'item_2_1', text: 'Determine key keyword trigger dispatch ratios', completed: false },
            { id: 'item_2_2', text: 'Analyze client onboarding double-entry logs', completed: false },
            { id: 'item_2_3', text: 'Schedule partner sync sessions', completed: false }
          ]
        },
        {
          id: 'canvas_3',
          title: 'Client Onboarding',
          color: 'border-green-500',
          channelId: '8', // vaccounting-bills-submissions
          items: [
            { id: 'item_3_1', text: 'Validate sub-ledger account creation', completed: true },
            { id: 'item_3_2', text: 'Verify banking API access keys', completed: true }
          ]
        }
      ];
      setCanvasCards(defaultCards);
      localStorage.setItem('demo_canvas_cards', JSON.stringify(defaultCards));
    }
  }, [channelId]);

  const saveCanvasCards = (updated: any[]) => {
    setCanvasCards(updated);
    localStorage.setItem('demo_canvas_cards', JSON.stringify(updated));
  };
  
  const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false);
  const [showThreadEmojiPicker, setShowThreadEmojiPicker] = useState(false);

  // Pixel-Perfect Refactored Header and Sidebar States
  const [showFormatting, setShowFormatting] = useState(true);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberUpdateMessage, setMemberUpdateMessage] = useState<string | null>(null);
  const isChannelHuddleActive = activeHuddle.inCall && activeHuddle.targetType === 'channel' && activeHuddle.targetId === channelId;
  const [showHuddleDropdown, setShowHuddleDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<'all' | 'mentions' | 'muted'>('all');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Local Searching States
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Audio Recorder States
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordingTime, setAudioRecordingTime] = useState(0);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const audioIntervalRef = useRef<any>(null);

  // Video Recorder States
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoRecordingTime, setVideoRecordingTime] = useState(0);
  const videoIntervalRef = useRef<any>(null);

  // Mentions Dropdown States
  const [showMentionsList, setShowMentionsList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showThreadMentionsList, setShowThreadMentionsList] = useState(false);
  const [threadMentionQuery, setThreadMentionQuery] = useState('');
  const [showChannelMentionsList, setShowChannelMentionsList] = useState(false);
  const [channelMentionQuery, setChannelMentionQuery] = useState('');
  const [showThreadChannelMentionsList, setShowThreadChannelMentionsList] = useState(false);
  const [threadChannelMentionQuery, setThreadChannelMentionQuery] = useState('');

  // Huddle call controls (using global state now)

  // Jump to Date Trigger
  const [showJumpToDateDropdown, setShowJumpToDateDropdown] = useState(false);

  React.useEffect(() => {
    if (activeThreadId) {
      const threadDraft = drafts.find(d => d.threadId === activeThreadId);
      setThreadReply(threadDraft?.text || '');
      const activeMessage = messages.find(message => message.id === activeThreadId);
      const replyIndex = highlightedThreadItemId && activeMessage
        ? activeMessage.replies.findIndex(reply => reply.id === highlightedThreadItemId)
        : -1;
      setVisibleRepliesCount(replyIndex >= 0
        ? Math.max(5, activeMessage.replies.length - replyIndex)
        : 5);
    } else {
      setThreadReply('');
      setHighlightedThreadItemId(null);
      setVisibleRepliesCount(5);
    }
  }, [activeThreadId, highlightedThreadItemId, messages]);

  React.useEffect(() => {
    const handleOpenThread = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.messageId) {
        const targetId = detail.replyId || detail.messageId;
        const mainMsg = messages.find(m => m.id === detail.messageId || m.id === targetId || m.replies.some(r => r.id === targetId));
        if (mainMsg && mainMsg.channelId === channelId) {
          setHighlightedThreadItemId(targetId);
          setActiveThreadId(mainMsg.id);
        }
      }
    };
    window.addEventListener('open-thread', handleOpenThread);
    return () => {
      window.removeEventListener('open-thread', handleOpenThread);
    };
  }, [channelId, messages]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mId = params.get('messageId');
    const replyId = params.get('replyId');
    if (mId) {
      const targetId = replyId || mId;
      const mainMsg = messages.find(m => m.id === mId || m.id === targetId || m.replies.some(r => r.id === targetId));
      if (mainMsg && mainMsg.channelId === channelId) {
        setHighlightedThreadItemId(targetId);
        setActiveThreadId(mainMsg.id);
      }
    }
  }, [channelId, messages]);

  React.useEffect(() => {
    if (!highlightedThreadItemId || !activeThreadId) return;
    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`thread-item-${highlightedThreadItemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    const clearHighlightTimer = window.setTimeout(() => setHighlightedThreadItemId(null), 3500);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearHighlightTimer);
    };
  }, [activeThreadId, highlightedThreadItemId, visibleRepliesCount]);

  // Audio Recorder Timer Effect
  React.useEffect(() => {
    if (isRecordingAudio && !isAudioPaused) {
      audioIntervalRef.current = setInterval(() => {
        setAudioRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isRecordingAudio, isAudioPaused]);

  // Video Recorder Timer Effect
  React.useEffect(() => {
    if (isRecordingVideo) {
      videoIntervalRef.current = setInterval(() => {
        setVideoRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
      setVideoRecordingTime(0);
    }
    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, [isRecordingVideo]);
  
  const channelInputRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const threadInputRef = useRef<HTMLTextAreaElement>(null);
  const channelMessagesContainerRef = useRef<HTMLDivElement>(null);
  const threadMessagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToLatest = (containerRef: React.RefObject<HTMLDivElement>) => {
    window.setTimeout(() => {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 0);
  };
  
  const handleThreadTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setThreadReply(text);
    
    // Check cursor position for user or channel autocomplete.
    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = text.substring(0, selectionStart);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    const isHashAfterAt = lastHashIndex > lastAtIndex;

    if (isHashAfterAt && lastHashIndex !== -1) {
      const queryText = textBeforeCursor.substring(lastHashIndex + 1);
      const isStartOfWord = lastHashIndex === 0 || /\s/.test(textBeforeCursor.charAt(lastHashIndex - 1));
      if (!/\s/.test(queryText) && isStartOfWord) {
        setShowThreadChannelMentionsList(true);
        setThreadChannelMentionQuery(queryText);
        setShowThreadMentionsList(false);
        setThreadMentionQuery('');
      } else {
        setShowThreadChannelMentionsList(false);
        setThreadChannelMentionQuery('');
      }
    } else {
      setShowThreadChannelMentionsList(false);
      setThreadChannelMentionQuery('');
      if (lastAtIndex !== -1) {
        const queryText = textBeforeCursor.substring(lastAtIndex + 1);
        const isStartOfWord = lastAtIndex === 0 || /\s/.test(textBeforeCursor.charAt(lastAtIndex - 1));
        if (!/\s/.test(queryText) && isStartOfWord) {
          setShowThreadMentionsList(true);
          setThreadMentionQuery(queryText);
        } else {
          setShowThreadMentionsList(false);
          setThreadMentionQuery('');
        }
      } else {
        setShowThreadMentionsList(false);
        setThreadMentionQuery('');
      }
    }

    if (!activeThreadId) return;
    
    const existingDrafts = drafts.filter(d => d.threadId !== activeThreadId);
    if (text.trim()) {
      setDrafts([...existingDrafts, { threadId: activeThreadId, channelId: channelId, text, timestamp: Date.now() }]);
    } else {
      setDrafts(existingDrafts);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewMessage(text);
    
    // Check cursor position for user or channel autocomplete.
    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = text.substring(0, selectionStart);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    const isHashAfterAt = lastHashIndex > lastAtIndex;

    if (isHashAfterAt && lastHashIndex !== -1) {
      const queryText = textBeforeCursor.substring(lastHashIndex + 1);
      const isStartOfWord = lastHashIndex === 0 || /\s/.test(textBeforeCursor.charAt(lastHashIndex - 1));
      if (!/\s/.test(queryText) && isStartOfWord) {
        setShowChannelMentionsList(true);
        setChannelMentionQuery(queryText);
        setShowMentionsList(false);
        setMentionQuery('');
      } else {
        setShowChannelMentionsList(false);
        setChannelMentionQuery('');
      }
    } else {
      setShowChannelMentionsList(false);
      setChannelMentionQuery('');
      if (lastAtIndex !== -1) {
        const queryText = textBeforeCursor.substring(lastAtIndex + 1);
        const isStartOfWord = lastAtIndex === 0 || /\s/.test(textBeforeCursor.charAt(lastAtIndex - 1));
        if (!/\s/.test(queryText) && isStartOfWord) {
          setShowMentionsList(true);
          setMentionQuery(queryText);
        } else {
          setShowMentionsList(false);
          setMentionQuery('');
        }
      } else {
        setShowMentionsList(false);
        setMentionQuery('');
      }
    }

    const existingDrafts = drafts.filter(d => d.channelId !== channelId);
    if (text.trim()) {
      setDrafts([...existingDrafts, { channelId, text, timestamp: Date.now() }]);
    } else {
      setDrafts(existingDrafts);
    }
  };

  const applyFormat = (type: string, isThread: boolean) => {
    const ref = isThread ? threadInputRef : channelInputRef;
    if (!ref.current) return;
    
    const start = ref.current.selectionStart;
    const end = ref.current.selectionEnd;
    const currentText = isThread ? threadReply : newMessage;
    
    let prefix = '';
    let suffix = '';
    
    switch (type) {
      case 'bold': prefix = '**'; suffix = '**'; break;
      case 'italic': prefix = '_'; suffix = '_'; break;
      case 'strikethrough': prefix = '~~'; suffix = '~~'; break;
      case 'code': prefix = '`'; suffix = '`'; break;
      case 'codeblock': prefix = '```\n'; suffix = '\n```'; break;
      case 'quote': prefix = '> '; suffix = ''; break;
      case 'link': prefix = '['; suffix = '](url)'; break;
      case 'list-ul': prefix = '- '; suffix = ''; break;
      case 'list-ol': prefix = '1. '; suffix = ''; break;
    }
    
    const newText = currentText.substring(0, start) + prefix + currentText.substring(start, end) + suffix + currentText.substring(end);
    
    if (isThread) {
      setThreadReply(newText);
      if (activeThreadId) {
        const existingDrafts = drafts.filter(d => d.threadId !== activeThreadId);
        if (newText.trim()) {
          setDrafts([...existingDrafts, { threadId: activeThreadId, channelId: channelId, text: newText, timestamp: Date.now() }]);
        } else {
          setDrafts(existingDrafts);
        }
      }
    } else {
      setNewMessage(newText);
      const existingDrafts = drafts.filter(d => d.channelId !== channelId);
      if (newText.trim()) {
        setDrafts([...existingDrafts, { channelId, text: newText, timestamp: Date.now() }]);
      } else {
        setDrafts(existingDrafts);
      }
    }
    
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  // Build the directory directly from the canonical agent list as well as profiles.
  // Agent rows are not profiles, so relying only on the derived `users` state can
  // leave the picker empty during the hydration/render between those two updates.
  const directoryUsers = React.useMemo(() => {
    const profileUsers = users.filter(user => !user.isAgent);
    const knownUserIds = new Set(profileUsers.map(user => user.id));
    const agentUsers = agents
      .filter(agent => !knownUserIds.has(agent.id))
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: 'AI Agent',
        title: 'AI Assistant',
        username: agent.username,
        isAgent: true,
        agentId: agent.id,
        organizationIds: organizations.filter(organization => organization.memberIds.includes(agent.id)).map(organization => organization.id)
      }));
    return [...profileUsers, ...agentUsers];
  }, [users, agents, organizations]);

  // Channel members list calculation
  const channelUsers = React.useMemo(() => {
    if (!channel) return [];
    const memberIds = new Set([
      ...(channel.memberIds || []),
      ...(channel.agentIds || [])
    ]);
    return directoryUsers.filter(user => channel.memberIds || channel.agentIds
      ? memberIds.has(user.id)
      : Boolean(user.channelIds?.includes(channelId))
    );
  }, [directoryUsers, channel, channelId]);

  const canManageChannelMembers = Boolean(currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || channelUsers.some(user => user.id === currentUser.id)));
  const addableChannelUsers = React.useMemo(() => {
    if (!channel) return [];
    const memberIds = new Set(channelUsers.map(user => user.id));
    const search = memberSearchQuery.trim().toLowerCase();
    return directoryUsers.filter(user => {
      if (memberIds.has(user.id)) return false;
      if (activeOrganizationId && !user.organizationIds?.includes(activeOrganizationId) && user.role !== 'Super Admin') return false;
      if (channel.organizationId && user.role !== 'Super Admin' && !user.organizationIds?.includes(channel.organizationId)) return false;
      if (!search) return true;
      return user.name.toLowerCase().includes(search)
        || user.email.toLowerCase().includes(search)
        || user.username?.toLowerCase().includes(search);
    });
  }, [directoryUsers, channel, channelUsers, activeOrganizationId, memberSearchQuery]);

  const openAddMembers = () => {
    if (!canManageChannelMembers) return;
    setMemberSearchQuery('');
    setSelectedMemberIds([]);
    setMemberUpdateMessage(null);
    setShowAddMembers(true);
  };

  const closeAddMembers = () => {
    setShowAddMembers(false);
    setMemberSearchQuery('');
    setSelectedMemberIds([]);
  };

  const toggleSelectedMember = (userId: string) => {
    setSelectedMemberIds(previous => previous.includes(userId)
      ? previous.filter(id => id !== userId)
      : [...previous, userId]
    );
  };

  const addSelectedMembers = () => {
    if (!channel || !canManageChannelMembers || selectedMemberIds.length === 0) return;
    const agentIdSet = new Set(agents.map(agent => agent.id));
    const currentMemberIds = channel.memberIds
      ? channel.memberIds
      : users.filter(user => !user.isAgent && user.channelIds?.includes(channel.id)).map(user => user.id);
    const currentAgentIds = channel.agentIds || [];
    const selectedHumanIds = selectedMemberIds.filter(id => !agentIdSet.has(id));
    const selectedAgentIds = selectedMemberIds.filter(id => agentIdSet.has(id));
    const nextMemberIds = Array.from(new Set([...currentMemberIds, ...selectedHumanIds]));
    const nextAgentIds = Array.from(new Set([...currentAgentIds, ...selectedAgentIds]));
    const updatedChannel = { ...channel, memberIds: nextMemberIds, agentIds: nextAgentIds };
    const updatedChannels = channels.map(item => item.id === channel.id ? updatedChannel : item);
    const updatedUsers = users.map(user => selectedHumanIds.includes(user.id)
      ? { ...user, channelIds: Array.from(new Set([...(user.channelIds || []), channel.id])) }
      : user
    );
    setChannels(updatedChannels);
    setUsers(updatedUsers);
    setMemberUpdateMessage(`${selectedMemberIds.length} member${selectedMemberIds.length === 1 ? '' : 's'} added.`);
    setSelectedMemberIds([]);
    setMemberSearchQuery('');
  };

  // Global user list matched mentions for main compose
  const mentionableUsers = React.useMemo(() => {
    const usersById = new Map(channelUsers.map(user => [user.id, user]));
    agents.forEach(agent => {
      const isMember = channel.agentIds?.includes(agent.id) || channelUsers.some(user => user.id === agent.id);
      if (isMember && !usersById.has(agent.id)) {
        usersById.set(agent.id, {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          role: 'AI Agent',
          title: 'AI Assistant',
          username: agent.username,
          isAgent: true,
          agentId: agent.id
        });
      }
    });
    return Array.from(usersById.values());
  }, [channelUsers, agents]);

  const filteredMentionUsers = React.useMemo(() => {
    if (!showMentionsList) return [];
    if (!mentionQuery) return mentionableUsers;
    const q = mentionQuery.toLowerCase();
    return mentionableUsers.filter(usr =>
      usr.name.toLowerCase().includes(q) ||
      (usr.username && usr.username.toLowerCase().includes(q))
    );
  }, [mentionableUsers, showMentionsList, mentionQuery]);

  // Global user list matched mentions for thread compose
  const filteredThreadMentionUsers = React.useMemo(() => {
    if (!showThreadMentionsList) return [];
    if (!threadMentionQuery) return mentionableUsers;
    const q = threadMentionQuery.toLowerCase();
    return mentionableUsers.filter(usr =>
      usr.name.toLowerCase().includes(q) ||
      (usr.username && usr.username.toLowerCase().includes(q))
    );
  }, [mentionableUsers, showThreadMentionsList, threadMentionQuery]);

  const mentionableChannels = React.useMemo(
    () => channels.filter(candidate => canAccessChannel(candidate, currentUser, activeOrganizationId)),
    [channels, currentUser, activeOrganizationId]
  );

  const filteredMentionChannels = React.useMemo(() => {
    if (!showChannelMentionsList) return [];
    const query = channelMentionQuery.toLowerCase();
    return mentionableChannels.filter(candidate => candidate.name.toLowerCase().includes(query));
  }, [mentionableChannels, showChannelMentionsList, channelMentionQuery]);

  const filteredThreadMentionChannels = React.useMemo(() => {
    if (!showThreadChannelMentionsList) return [];
    const query = threadChannelMentionQuery.toLowerCase();
    return mentionableChannels.filter(candidate => candidate.name.toLowerCase().includes(query));
  }, [mentionableChannels, showThreadChannelMentionsList, threadChannelMentionQuery]);

  const channelMessages = messages.filter(m => m.channelId === channelId);
  const activeThread = messages.find(m => m.id === activeThreadId);
  const channelMessagesScrollKey = channelMessages
    .map(message => `${message.id}:${message.text}`)
    .join('|');
  const threadRepliesScrollKey = activeThread
    ? `${activeThread.id}:${activeThread.text}|${(activeThread.replies || [])
      .map(reply => `${reply.id}:${reply.text}`)
      .join('|')}`
    : '';

  useEffect(() => {
    if (activeTab === 'messages') {
      scrollToLatest(channelMessagesContainerRef);
    }
  }, [activeTab, channelMessagesScrollKey]);

  useEffect(() => {
    if (activeThreadId && activeThread) {
      scrollToLatest(threadMessagesContainerRef);
    }
  }, [activeThreadId, threadRepliesScrollKey]);

  interface ExtractedFile {
    id: string;
    messageId: string;
    senderName: string;
    senderAvatar: string;
    timestamp: number;
    type: 'voice' | 'video' | 'doc' | 'image';
    name: string;
    size?: string;
    text: string;
    isReply: boolean;
    replyId?: string;
  }

  interface ExtractedLink {
    id: string;
    messageId: string;
    senderName: string;
    senderAvatar: string;
    timestamp: number;
    url: string;
    title: string;
    isReply: boolean;
    text: string;
  }

  const extractedFilesAndLinks = React.useMemo(() => {
    const filesList: ExtractedFile[] = [];
    const linksList: ExtractedLink[] = [];

    channelMessages.forEach(msg => {
      const sender = users.find(u => u.id === msg.senderId);
      const senderName = msg.senderId === 'bot' ? 'Workspace Automation' : (sender?.name || 'Unknown User');
      const senderAvatar = getAvatarUrl(sender, senderName);

      const findLinks = (textStr: string, msgId: string, replyId?: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = textStr.match(urlRegex);
        if (matches) {
          matches.forEach((url, idx) => {
            let cleanUrl = url;
            if (cleanUrl.endsWith(')')) cleanUrl = cleanUrl.slice(0, -1);
            if (cleanUrl.endsWith(']')) cleanUrl = cleanUrl.slice(0, -1);
            
            linksList.push({
              id: `lnk_${msgId}_${replyId || 'main'}_${idx}`,
              messageId: msgId,
              senderName,
              senderAvatar,
              timestamp: msg.timestamp,
              url: cleanUrl,
              title: cleanUrl.replace(/https?:\/\/(www\.)?/, '').slice(0, 30) + '...',
              isReply: !!replyId,
              text: textStr
            });
          });
        }

        const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        let mdMatch;
        while ((mdMatch = mdRegex.exec(textStr)) !== null) {
          linksList.push({
            id: `lnk_md_${msgId}_${replyId || 'main'}_${mdMatch.index}`,
            messageId: msgId,
            senderName,
            senderAvatar,
            timestamp: msg.timestamp,
            url: mdMatch[2],
            title: mdMatch[1],
            isReply: !!replyId,
            text: textStr
          });
        }
      };

      const checkFile = (textStr: string, msgId: string, replyId?: string) => {
        const timestamp = msg.timestamp;
        
        if (textStr.includes('🎤 Voice Note')) {
          const duration = textStr.includes('(') ? textStr.split('(')[1].split(')')[0] : '00:03';
          filesList.push({
            id: `file_${msgId}_${replyId || 'main'}_voice`,
            messageId: msgId,
            senderName,
            senderAvatar,
            timestamp,
            type: 'voice',
            name: `Voice Memo (${duration})`,
            text: textStr,
            isReply: !!replyId,
            replyId
          });
        } else if (textStr.includes('📹 Camera Video Clip') || textStr.includes('📹 Recorded Video Clip')) {
          const duration = textStr.includes('(') ? textStr.split('(')[1].split(')')[0] : '00:04';
          filesList.push({
            id: `file_${msgId}_${replyId || 'main'}_video`,
            messageId: msgId,
            senderName,
            senderAvatar,
            timestamp,
            type: 'video',
            name: `Video Clip (${duration})`,
            text: textStr,
            isReply: !!replyId,
            replyId
          });
        } else if (textStr.includes('📄 [Document Attachment:')) {
          const match = textStr.match(/📄 \[Document Attachment:\s*([^\]]+)\]/);
          const fileName = match ? match[1] : 'attachment.pdf';
          filesList.push({
            id: `file_${msgId}_${replyId || 'main'}_doc`,
            messageId: msgId,
            senderName,
            senderAvatar,
            timestamp,
            type: 'doc',
            name: fileName,
            size: '2.4 MB',
            text: textStr,
            isReply: !!replyId,
            replyId
          });
        }
      };

      checkFile(msg.text, msg.id);
      findLinks(msg.text, msg.id);

      msg.replies.forEach(reply => {
        const rSender = users.find(u => u.id === reply.senderId);
        const rSenderName = reply.senderId === 'bot' ? 'Workspace Automation' : (rSender?.name || 'Unknown User');
        const rAvatar = getAvatarUrl(rSender, rSenderName);

        if (reply.text.includes('🎤 Voice Note')) {
          const duration = reply.text.includes('(') ? reply.text.split('(')[1].split(')')[0] : '00:03';
          filesList.push({
            id: `file_${msg.id}_${reply.id}_voice`,
            messageId: msg.id,
            senderName: rSenderName,
            senderAvatar: rAvatar,
            timestamp: reply.timestamp,
            type: 'voice',
            name: `Voice Memo (${duration})`,
            text: reply.text,
            isReply: true,
            replyId: reply.id
          });
        } else if (reply.text.includes('📹 Camera Video Clip') || reply.text.includes('📹 Recorded Video Clip')) {
          const duration = reply.text.includes('(') ? reply.text.split('(')[1].split(')')[0] : '00:04';
          filesList.push({
            id: `file_${msg.id}_${reply.id}_video`,
            messageId: msg.id,
            senderName: rSenderName,
            senderAvatar: rAvatar,
            timestamp: reply.timestamp,
            type: 'video',
            name: `Video Clip (${duration})`,
            text: reply.text,
            isReply: true,
            replyId: reply.id
          });
        } else if (reply.text.includes('📄 [Document Attachment:')) {
          const match = reply.text.match(/📄 \[Document Attachment:\s*([^\]]+)\]/);
          const fileName = match ? match[1] : 'attachment.pdf';
          filesList.push({
            id: `file_${msg.id}_${reply.id}_doc`,
            messageId: msg.id,
            senderName: rSenderName,
            senderAvatar: rAvatar,
            timestamp: reply.timestamp,
            type: 'doc',
            name: fileName,
            size: '1.8 MB',
            text: reply.text,
            isReply: true,
            replyId: reply.id
          });
        }

        const findReplyLinks = (textStr: string, msgId: string, replyId: string) => {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const matches = textStr.match(urlRegex);
          if (matches) {
            matches.forEach((url, idx) => {
              let cleanUrl = url;
              if (cleanUrl.endsWith(')')) cleanUrl = cleanUrl.slice(0, -1);
              if (cleanUrl.endsWith(']')) cleanUrl = cleanUrl.slice(0, -1);
              
              linksList.push({
                id: `lnk_${msgId}_${replyId}_${idx}`,
                messageId: msgId,
                senderName: rSenderName,
                senderAvatar: rAvatar,
                timestamp: reply.timestamp,
                url: cleanUrl,
                title: cleanUrl.replace(/https?:\/\/(www\.)?/, '').slice(0, 30) + '...',
                isReply: true,
                text: textStr
              });
            });
          }

          const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
          let mdMatch;
          while ((mdMatch = mdRegex.exec(textStr)) !== null) {
            linksList.push({
              id: `lnk_md_${msgId}_${replyId}_${mdMatch.index}`,
              messageId: msgId,
              senderName: rSenderName,
              senderAvatar: rAvatar,
              timestamp: reply.timestamp,
              url: mdMatch[2],
              title: mdMatch[1],
              isReply: true,
              text: textStr
            });
          }
        };

        findReplyLinks(reply.text, msg.id, reply.id);
      });
    });

    return { files: filesList, links: linksList };
  }, [channelMessages, users]);

  // Live filter channel messages by keying in search bar
  const searchedChannelMessages = React.useMemo(() => {
    if (!searchTerm.trim()) return channelMessages;
    return channelMessages.filter(msg => msg.text.toLowerCase().includes(searchTerm.trim().toLowerCase()));
  }, [channelMessages, searchTerm]);

  // Formatter helpers for Dates
  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const formatDateWithOrdinal = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.toLocaleDateString([], { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
  };

  // Group messages by date
  const groupedAndSortedMessages = React.useMemo(() => {
    const sorted = [...searchedChannelMessages].sort((a, b) => a.timestamp - b.timestamp);
    const groups: { [key: string]: typeof searchedChannelMessages } = {};
    sorted.forEach(msg => {
      const formattedDate = formatDateWithOrdinal(msg.timestamp);
      if (!groups[formattedDate]) {
        groups[formattedDate] = [];
      }
      groups[formattedDate].push(msg);
    });
    return groups;
  }, [searchedChannelMessages]);

  const jumpToSpecifiedDate = (dateHeader: string) => {
    const el = document.getElementById(`divider-${dateHeader}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setShowJumpToDateDropdown(false);
  };

  const buildChannelConversationHistory = (parentMessageId?: string): AgentConversationMessage[] => {
    const isAgentSender = (senderId: string): boolean => Boolean(agents.find(agent => agent.id === senderId));
    const parentMessage = parentMessageId ? messages.find(message => message.id === parentMessageId) : undefined;
    const historyItems = parentMessage
      ? [parentMessage]
      : messages.filter(message => message.channelId === channelId);
    const entries: AgentConversationMessage[] = [];

    historyItems.forEach(message => {
      const sender = users.find(user => user.id === message.senderId);
      const senderName = sender?.name || 'Workspace member';
      entries.push({
        role: sender?.isAgent || isAgentSender(message.senderId) ? 'assistant' : 'user',
        content: `${senderName}: ${message.text}\nThread link: ${buildWorkspaceLink(channelId, message.id)}`
      });
      if (parentMessage) {
        (message.replies || []).forEach(reply => {
          const replySender = users.find(user => user.id === reply.senderId);
          entries.push({
            role: replySender?.isAgent || isAgentSender(reply.senderId) ? 'assistant' : 'user',
            content: `${replySender?.name || 'Workspace member'}: ${reply.text}\nComment link: ${buildWorkspaceLink(channelId, message.id, reply.id)}`
          });
        });
      }
    });

    return entries;
  };

  const respondToPublicMention = (prompt: string, agent: typeof agents[0], parentMessageId?: string) => {
    const agentIsMember = channelUsers.some(user => user.id === agent.id);
    if (!agent.enabled || channel?.isPrivate || !agentIsMember) return;

    if (agentStatusTimerRef.current) window.clearTimeout(agentStatusTimerRef.current);
    agentRequestControllerRef.current?.abort();
    const controller = new AbortController();
    agentRequestControllerRef.current = controller;
    const requestGeneration = agentRequestGenerationRef.current + 1;
    agentRequestGenerationRef.current = requestGeneration;
    const isCurrentRequest = () => agentRequestGenerationRef.current === requestGeneration && !controller.signal.aborted;
    const placeholderId = `agent_placeholder_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const placeholderText = `🔎 ${agent.name} is searching workspace context…`;
    const updatePlaceholder = (text: string) => {
      if (!isCurrentRequest()) return;
      setMessages(previous => parentMessageId
        ? previous.map(message => message.id === parentMessageId
          ? { ...message, replies: (message.replies || []).map(reply => reply.id === placeholderId ? { ...reply, text } : reply) }
          : message)
        : previous.map(message => message.id === placeholderId ? { ...message, text } : message)
      );
    };
    const insertPlaceholder = () => {
      setMessages(previous => parentMessageId
        ? previous.map(message => message.id === parentMessageId
          ? { ...message, replies: [...(message.replies || []), { id: placeholderId, senderId: agent.id, text: placeholderText, timestamp: Date.now(), isRead: true }] }
          : message)
        : [...previous, { id: placeholderId, channelId, senderId: agent.id, text: placeholderText, timestamp: Date.now(), isRead: true, replies: [], reactions: [] }]
      );
    };
    const finalMessageId = `agent_msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const replacePlaceholder = (text: string) => {
      if (!isCurrentRequest()) return;
      // Swap the placeholder for a persistable id so the final answer is
      // saved to Supabase (transient “searching/thinking…” states are never
      // persisted — the placeholder prefix is rejected by the client and the
      // server route on purpose).
      setMessages(previous => parentMessageId
        ? previous.map(message => message.id === parentMessageId
          ? { ...message, replies: (message.replies || []).map(reply => reply.id === placeholderId ? { ...reply, id: finalMessageId, text } : reply) }
          : message)
        : previous.map(message => message.id === placeholderId ? { ...message, id: finalMessageId, text } : message)
      );
    };

    insertPlaceholder();
    setAgentStatus({ name: agent.name, status: 'searching' });
    agentStatusTimerRef.current = window.setTimeout(() => {
      if (!isCurrentRequest()) return;
      setAgentStatus({ name: agent.name, status: 'thinking' });
      updatePlaceholder('💭 Thinking about your request…');
      agentStatusTimerRef.current = window.setTimeout(() => {
        if (!isCurrentRequest()) return;
        setAgentStatus({ name: agent.name, status: 'checking' });
        updatePlaceholder(agent.databaseAccess?.webSearch ? '🌐 Checking workspace data and web search…' : '🧭 Checking allowed workspace data…');
        agentStatusTimerRef.current = window.setTimeout(() => {
          if (!isCurrentRequest()) return;
          setAgentStatus({ name: agent.name, status: 'typing' });
          updatePlaceholder('⌨️ Typing…');
          agentStatusTimerRef.current = window.setTimeout(() => {
            if (!isCurrentRequest()) return;
            const allowedContext = [
              agent.databaseAccess?.organizations ? 'organization data' : null,
              agent.databaseAccess?.publicThreads ? 'public threads' : null,
              agent.databaseAccess?.webSearch ? 'web search when applicable' : null
            ].filter(Boolean).join(' and ') || 'no workspace data';
            const fallback = `@${currentUser?.username || 'team'} I reviewed the available ${allowedContext}. Regarding “${prompt}”: ${String(agent.jobDetails || '')}`;
            let workspaceContext = 'No workspace data is available to this agent.';
            try {
              workspaceContext = buildAgentWorkspaceContext(agent, messages, channels, organizations, users, userStatus, currentUser?.id || '', activeOrganizationId, prompt);
            } catch {
              // Use the fallback context if persisted workspace data is malformed.
            }
            const conversationHistory = buildChannelConversationHistory(parentMessageId);
            void requestAgentReply(agent, prompt, workspaceContext, fallback, conversationHistory, controller.signal).then(agentText => {
              if (!isCurrentRequest()) return;
              replacePlaceholder(agentText);
              setAgentStatus(null);
              agentRequestControllerRef.current = null;
            }).catch(error => {
              if (error instanceof DOMException && error.name === 'AbortError') return;
              if (!isCurrentRequest()) return;
              updatePlaceholder('⚠️ I could not complete that request. Please try again.');
              // The error fallback is intentionally NOT persisted: `updatePlaceholder`
              // keeps the placeholder id, and both the client guard and the server
              // route reject `agent_placeholder_` ids.
              setAgentStatus(null);
              agentRequestControllerRef.current = null;
            });
          }, 650);
        }, 500);
      }, 450);
    }, 300);
  };

  useEffect(() => () => {
    if (agentStatusTimerRef.current) window.clearTimeout(agentStatusTimerRef.current);
    agentRequestControllerRef.current?.abort();
    agentRequestGenerationRef.current += 1;
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !currentUser) return;
    const outgoingText = newMessage.trim();

    const message = {
      id: createMessageId('msg'),
      channelId,
      senderId: currentUser.id,
      text: newMessage,
      timestamp: Date.now(),
      isRead: true,
      replies: [],
      attachments: pendingAttachments
    };

    setMessages(previous => [...previous, message]);
    const mentionedAgent = !channel?.isPrivate && agents.find(agent => agent.enabled && containsAgentMention(outgoingText, agent.username));
    if (mentionedAgent) respondToPublicMention(outgoingText, mentionedAgent);
    setNewMessage('');
    setPendingAttachments([]);
    setDrafts(drafts.filter(d => d.channelId !== channelId));
  };

  const sendVoiceNoteMessage = () => {
    if (!currentUser) return;
    const voiceText = `🎤 Voice Note (${formatTime(audioRecordingTime)})  \n*Listen to the voice memo from ${currentUser.name}.*`;
    
    const message = {
      id: createMessageId('msg_voice'),
      channelId,
      senderId: currentUser.id,
      text: voiceText,
      timestamp: Date.now(),
      isRead: true,
      replies: []
    };

    setMessages(previous => [...previous, message]);
    setIsRecordingAudio(false);
    setAudioRecordingTime(0);
    setIsAudioPaused(false);
  };

  const sendVideoClipMessage = () => {
    if (!currentUser) return;
    const videoText = `📹 Camera Video Clip (${formatTime(videoRecordingTime)})  \n*Recorded media attachment from ${currentUser.name}.*`;
    
    const message = {
      id: createMessageId('msg_video'),
      channelId,
      senderId: currentUser.id,
      text: videoText,
      timestamp: Date.now(),
      isRead: true,
      replies: []
    };

    setMessages(previous => [...previous, message]);
    setIsRecordingVideo(false);
    setVideoRecordingTime(0);
  };

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadReply.trim() || !currentUser || !activeThreadId) return;

    const reply = {
      id: createMessageId('reply'),
      senderId: currentUser.id,
      text: threadReply,
      timestamp: Date.now(),
      isRead: true
    };

    setMessages(previous => previous.map(m =>
      m.id === activeThreadId
        ? { ...m, replies: [...m.replies, reply] }
        : m
    ));
    const mentionedAgent = !channel?.isPrivate && agents.find(agent => agent.enabled && containsAgentMention(threadReply, agent.username));
    if (mentionedAgent) respondToPublicMention(threadReply, mentionedAgent, activeThreadId);
    setThreadReply('');
    setDrafts(drafts.filter(d => d.threadId !== activeThreadId));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openMentionPicker = (isThread: boolean = false) => {
    const ref = isThread ? threadInputRef : channelInputRef;
    if (!ref.current) return;
    const currentText = isThread ? threadReply : newMessage;
    const cursor = ref.current.selectionStart || currentText.length;
    const needsSpace = cursor > 0 && !/\s/.test(currentText.charAt(cursor - 1));
    const insertedText = `${needsSpace ? ' ' : ''}@`;
    const updatedText = currentText.slice(0, cursor) + insertedText + currentText.slice(cursor);
    if (isThread) {
      setThreadReply(updatedText);
      setShowThreadMentionsList(true);
      setThreadMentionQuery('');
    } else {
      setNewMessage(updatedText);
      setShowMentionsList(true);
      setMentionQuery('');
    }
    const newCursorPosition = cursor + insertedText.length;
    setTimeout(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleMentionClick = (username: string, isThread: boolean = false) => {
    handleMentionSelect(username, isThread);
  };

  const handleMentionSelect = (username: string, isThread: boolean = false) => {
    const ref = isThread ? threadInputRef : channelInputRef;
    if (!ref.current) return;
    const start = ref.current.selectionStart || 0;
    const currentText = isThread ? threadReply : newMessage;
    
    const textBeforeCursor = currentText.substring(0, start);
    const textAfterCursor = currentText.substring(start);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textBeforeMention = textBeforeCursor.substring(0, lastAtIndex);
      const updatedText = textBeforeMention + `@${username} ` + textAfterCursor;
      
      if (isThread) {
        setThreadReply(updatedText);
        setShowThreadMentionsList(false);
        setThreadMentionQuery('');
      } else {
        setNewMessage(updatedText);
        setShowMentionsList(false);
        setMentionQuery('');
      }
      
      const newCursorPos = lastAtIndex + username.length + 2;
      setTimeout(() => {
        if (ref.current) {
          ref.current.focus();
          ref.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 10);
    }
  };

  const handleChannelMentionSelect = (channelName: string, isThread: boolean = false) => {
    const ref = isThread ? threadInputRef : channelInputRef;
    if (!ref.current) return;
    const start = ref.current.selectionStart || 0;
    const currentText = isThread ? threadReply : newMessage;
    const textBeforeCursor = currentText.substring(0, start);
    const textAfterCursor = currentText.substring(start);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    if (lastHashIndex === -1) return;

    const updatedText = `${textBeforeCursor.substring(0, lastHashIndex)}#${channelName} ${textAfterCursor}`;
    if (isThread) {
      setThreadReply(updatedText);
      setShowThreadChannelMentionsList(false);
      setThreadChannelMentionQuery('');
    } else {
      setNewMessage(updatedText);
      setShowChannelMentionsList(false);
      setChannelMentionQuery('');
    }

    const newCursorPos = lastHashIndex + channelName.length + 2;
    setTimeout(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleToggleAudioRecording = () => {
    if (isRecordingAudio) {
      // Send active recording
      sendVoiceNoteMessage();
    } else {
      setIsRecordingVideo(false);
      setIsRecordingAudio(true);
      setIsAudioPaused(false);
      setAudioRecordingTime(0);
    }
  };

  const handleCancelAudioRecording = () => {
    setIsRecordingAudio(false);
    setAudioRecordingTime(0);
    setIsAudioPaused(false);
  };

  const handleToggleVideoRecording = () => {
    if (isRecordingVideo) {
      sendVideoClipMessage();
    } else {
      setIsRecordingAudio(false);
      setIsRecordingVideo(true);
      setVideoRecordingTime(0);
    }
  };

  const handleCancelVideoRecording = () => {
    setIsRecordingVideo(false);
    setVideoRecordingTime(0);
  };

  const toggleChannelHuddle = () => {
    if (isChannelHuddleActive) {
      endGlobalHuddle();
    } else {
      startGlobalHuddle(channelId, 'channel');
    }
  };

  const handleAttachmentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    const allowed = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf');
    const available = Math.max(0, 10 - pendingAttachments.length);
    Promise.all(allowed.slice(0, available).map(file => new Promise<MessageAttachment>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ id: `${file.name}-${file.lastModified}-${Math.random()}`, name: file.name, type: file.type, size: file.size, dataUrl: String(reader.result) });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }))).then(attachments => setPendingAttachments(previous => [...previous, ...attachments])).catch(() => undefined);
    event.target.value = '';
  };

  const formatAttachmentSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const renderAttachments = (attachments?: MessageAttachment[]) => attachments?.length ? (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {attachments.map(attachment => attachment.type.startsWith('image/') ? (
        <button key={attachment.id} type="button" onClick={() => setPreviewAttachment(attachment)} className="block max-w-sm overflow-hidden rounded-lg border border-gray-800 text-left hover:border-blue-500" title={`Preview ${attachment.name}`}><img src={attachment.dataUrl} alt={attachment.name} className="max-h-64 max-w-full object-contain" /><span className="block truncate bg-gray-900 px-2 py-1 text-[10px] text-gray-400">{attachment.name}</span></button>
      ) : attachment.type.startsWith('video/') ? (
        <button key={attachment.id} type="button" onClick={() => setPreviewAttachment(attachment)} className="max-w-sm overflow-hidden rounded-lg border border-gray-800 bg-gray-900 text-left hover:border-blue-500" title={`Preview ${attachment.name}`}><video muted preload="metadata" src={attachment.dataUrl} className="max-h-64 max-w-full" /><p className="truncate px-2 py-1 text-[10px] text-gray-400">{attachment.name} • {formatAttachmentSize(attachment.size)}</p></button>
      ) : (
        <button key={attachment.id} type="button" onClick={() => setPreviewAttachment(attachment)} className="flex max-w-sm items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 p-3 text-left hover:border-blue-500" title={`Preview ${attachment.name}`}><FileText className="h-5 w-5 shrink-0 text-red-400" /><span className="min-w-0"><span className="block truncate text-xs font-semibold text-gray-200">{attachment.name}</span><span className="text-[10px] text-gray-500">PDF • {formatAttachmentSize(attachment.size)}</span></span></button>
      ))}
    </div>
  ) : null;

  if (!channel) {
    return <div className="p-8 text-gray-500">Channel not found</div>;
  }

  const attachmentPreview = previewAttachment && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={`Preview ${previewAttachment.name}`} onClick={() => setPreviewAttachment(null)}>
      <div className="relative flex max-h-[90vh] max-w-[min(1100px,95vw)] flex-col overflow-hidden rounded-xl border border-gray-700 bg-[#121317] shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-gray-800 px-4 py-3">
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-200">{previewAttachment.name}</p><p className="text-[10px] text-gray-500">{previewAttachment.type === 'application/pdf' ? 'PDF document' : previewAttachment.type.startsWith('video/') ? 'Video' : 'Image'} • {formatAttachmentSize(previewAttachment.size)}</p></div>
          <button type="button" onClick={() => setPreviewAttachment(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white" aria-label="Close preview"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex min-h-0 items-center justify-center overflow-auto bg-black/40 p-4">
          {previewAttachment.type.startsWith('image/') ? <img src={previewAttachment.dataUrl} alt={previewAttachment.name} className="max-h-[70vh] max-w-full object-contain" /> : previewAttachment.type.startsWith('video/') ? <video controls autoPlay src={previewAttachment.dataUrl} className="max-h-[70vh] max-w-full" /> : <iframe title={previewAttachment.name} src={previewAttachment.dataUrl} className="h-[70vh] w-[min(900px,85vw)] bg-white" />}
        </div>
        <div className="flex justify-end border-t border-gray-800 px-4 py-2"><a href={previewAttachment.dataUrl} download={previewAttachment.name} onClick={event => event.stopPropagation()} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">Download</a></div>
      </div>
    </div>
  );

  if (!canAccessChannel(channel, currentUser, activeOrganizationId)) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1A1D21] text-gray-400 p-8 text-center">
        <div>
          <Lock className="h-8 w-8 mx-auto mb-3 text-gray-600" />
          <p className="text-sm font-semibold text-gray-200">You don’t have access to this channel.</p>
          <p className="text-xs mt-1 text-gray-500">Ask a workspace administrator to add you as a member.</p>
          <button onClick={() => onNavigate('home')} className="mt-4 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white">Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {attachmentPreview}
      <div className="flex h-full bg-[#1A1D21] text-gray-300 w-full relative">
      {/* Main Channel Area */}
      <div className={`flex flex-col h-full bg-[#1A1D21] transition-all duration-300 ${activeThreadId ? 'md:pr-[400px]' : ''} w-full`}>
        
        {/* REFACTORED PREMIUM TOOLBAR HEADER */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-gray-800 bg-[#121317] shrink-0 select-none">
          <div className="flex items-center min-w-0">
            {channel.isPrivate ? <Lock className="h-4.5 w-4.5 mr-2.5 text-gray-400 shrink-0" /> : <Hash className="h-4.5 w-4.5 mr-2.5 text-gray-400 shrink-0" />}
            <h2 className="text-lg font-bold text-gray-100 truncate">{channel.name}</h2>
            <div className="hidden h-5 w-px bg-gray-800 mx-3 md:block" />
            <p className="hidden text-xs text-gray-505 truncate md:block">
              Communication channel for this project.
            </p>
          </div>

          {/* Right-aligned Header Controls Matching User Image */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* Active Members Icon Badge (Silhouette + Count) */}
            <button 
              onClick={() => setShowMembersDrawer(!showMembersDrawer)}
              className="flex items-center space-x-1 px-2 py-1 bg-gray-850 hover:bg-gray-800 text-gray-300 hover:text-white rounded border border-gray-800 cursor-pointer text-xs transition"
              title="Channel Members"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="font-bold">{channelUsers.length}</span>
            </button>

            {/* Huddles Headphones Dropdown button */}
            <div className="relative flex items-center bg-gray-850 rounded border border-gray-800 overflow-hidden">
              <button 
                onClick={toggleChannelHuddle}
                className={`px-2.5 py-1 text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                  isChannelHuddleActive ? 'bg-emerald-900/45 text-emerald-400 hover:bg-emerald-900/60' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={isChannelHuddleActive ? "Leave Huddle" : "Start Huddle call"}
              >
                <Volume2 className={`h-3.5 w-3.5 ${isChannelHuddleActive ? 'animate-pulse text-emerald-400' : 'text-gray-400'}`} />
                <span>Huddle</span>
              </button>
              <button 
                onClick={() => setShowHuddleDropdown(!showHuddleDropdown)}
                className="px-1.5 py-1.5 hover:bg-gray-805 text-gray-400 hover:text-white border-l border-gray-800 cursor-pointer transition flex items-center justify-center"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
              {showHuddleDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#121317] border border-gray-800 rounded-lg shadow-2xl py-1 z-50 text-xs">
                  <button 
                    onClick={() => { toggleChannelHuddle(); setShowHuddleDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-gray-300 flex items-center space-x-2 cursor-pointer"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-gray-405" />
                    <span>{isChannelHuddleActive ? 'Leave Huddle' : 'Join Voice Huddle'}</span>
                  </button>
                  <button 
                    onClick={() => { toggleChannelHuddle(); setShowHuddleDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-gray-300 flex items-center space-x-2 cursor-pointer"
                  >
                    <Video className="h-3.5 w-3.5 text-gray-450" />
                    <span>Start Video Call</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className={`p-1 bg-gray-850 hover:bg-gray-800 text-gray-300 rounded border border-gray-800 cursor-pointer transition flex items-center justify-center ${
                  notificationSettings !== 'all' ? 'text-yellow-400 border-yellow-900/30' : ''
                }`}
              >
                <Bell className="h-3.5 w-3.5" />
              </button>
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-1.5 w-52 bg-[#121317] border border-gray-800 rounded-lg shadow-2xl py-1 z-50 text-xs">
                  <div className="px-3.5 py-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">Alert Config</div>
                  <button 
                    onClick={() => { setNotificationSettings('all'); setShowNotificationDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-gray-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>All Messages</span>
                    {notificationSettings === 'all' && <Check className="h-3 w-3 text-emerald-400" />}
                  </button>
                  <button 
                    onClick={() => { setNotificationSettings('mentions'); setShowNotificationDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-gray-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Mentions Only</span>
                    {notificationSettings === 'mentions' && <Check className="h-3 w-3 text-emerald-400" />}
                  </button>
                  <button 
                    onClick={() => { setNotificationSettings('muted'); setShowNotificationDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-gray-400 flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-red-400 font-semibold">Muted</span>
                    {notificationSettings === 'muted' && <Check className="h-3 w-3 text-red-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Search toggler */}
            <button 
              onClick={() => setIsSearching(!isSearching)}
              className={`p-1.5 rounded border cursor-pointer transition flex items-center justify-center ${
                isSearching 
                  ? 'bg-blue-950/20 text-blue-400 border-blue-500/40' 
                  : 'bg-gray-850 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
            </button>

            {/* Triple Dots Menus */}
            <div className="relative">
              <button 
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="p-1 bg-gray-850 hover:bg-gray-800 text-gray-300 rounded border border-gray-800 cursor-pointer transition flex items-center justify-center"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {showSettingsDropdown && (
                <div className="absolute right-0 mt-1.5 w-44 bg-[#121317] border border-gray-800 rounded-lg shadow-2xl py-1 z-50 text-xs">
                  <div className="px-3.5 py-1 text-[10px] text-gray-500 font-bold uppercase">Actions</div>
                  <button onClick={() => { setShowSettingsDropdown(false); alert("Channel properties"); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-gray-300 cursor-pointer">Channel Properties</button>
                  <button onClick={() => { setShowSettingsDropdown(false); alert("Channel muted"); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-gray-300 cursor-pointer">Mute Channel Notifications</button>
                  <div className="border-t border-gray-850 my-1"></div>
                  <button onClick={() => { setShowSettingsDropdown(false); alert("Leave channel"); }} className="w-full text-left px-3.5 py-2 hover:bg-emerald-900/20 text-red-400 cursor-pointer">Leave Channel</button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Dynamic Inline Search Results Area */}
        {isSearching && (
          <div className="px-6 py-2 bg-[#121317] border-b border-gray-800 flex items-center justify-between animate-fade-in shrink-0 select-none">
            <div className="flex items-center space-x-2.5 w-full max-w-sm">
              <Search className="h-4 w-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Search messages in this channel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-gray-100 placeholder-gray-500 focus:ring-0 focus:outline-none w-full"
                autoFocus
              />
            </div>
            {searchTerm && (
              <span className="text-[10px] text-yellow-400 font-semibold bg-yellow-950/20 px-2 py-0.5 rounded border border-yellow-905/10">
                Found {searchedChannelMessages.length} matches
              </span>
            )}
            <button 
              onClick={() => { setIsSearching(false); setSearchTerm(''); }}
              className="text-[10px] font-bold text-gray-400 hover:text-white transition cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Live Channel Huddle Active Call Banner */}
        {isChannelHuddleActive && (
          <div className="mx-6 mt-3 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-center justify-between select-none animate-fade-in shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur animate-ping pointer-events-none"></div>
                <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center text-gray-950 text-xs font-bold relative z-10">
                  <Volume2 className="h-4 w-4" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white flex items-center">
                  <Sparkles className="h-3 w-3 text-emerald-400 mr-1.5 animate-pulse" /> Channel Huddle Call Connected
                </p>
                <p className="text-[10px] text-emerald-400/90 mt-0.5">
                  Connected as {currentUser?.name || "Member"} • Noise Cancellation is Active
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button 
                onClick={toggleHuddleMic}
                className={`p-1.5 rounded text-xs font-bold select-none flex items-center space-x-1.5 cursor-pointer border ${
                  !activeHuddle.micEnabled 
                    ? 'bg-red-950/40 border-red-500/30 text-red-400' 
                    : 'bg-gray-850 border-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                {!activeHuddle.micEnabled ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-emerald-400" />}
                <span>{!activeHuddle.micEnabled ? 'Muted' : 'Mic Active'}</span>
              </button>
              <button 
                onClick={endGlobalHuddle}
                className="px-3.5 py-1.5 bg-red-650 hover:bg-red-600 text-white font-bold text-[10px] rounded cursor-pointer transition uppercase"
              >
                Leave
              </button>
            </div>
          </div>
        )}

        {/* Tab switcher options */}
        <div className="flex border-b border-gray-800 bg-[#121317]/50 px-6 space-x-1 shrink-0 select-none">
          <button 
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition duration-200 cursor-pointer flex items-center space-x-2 ${
              activeTab === 'messages' 
                ? 'border-emerald-500 text-white font-bold' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Messages</span>
            <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.2 rounded font-mono">
              {searchedChannelMessages.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('files')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition duration-200 cursor-pointer flex items-center space-x-2 ${
              activeTab === 'files' 
                ? 'border-emerald-500 text-white font-bold' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Files</span>
            {extractedFilesAndLinks.files.length > 0 && (
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-semibold font-mono border border-emerald-900/35">
                {extractedFilesAndLinks.files.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('links')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition duration-200 cursor-pointer flex items-center space-x-2 ${
              activeTab === 'links' 
                ? 'border-emerald-500 text-white font-bold' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Links & Workflows</span>
            <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.2 rounded font-mono">
              {extractedFilesAndLinks.links.length + workflows.filter(w => w.active).length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('canvas')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition duration-200 cursor-pointer flex items-center space-x-2 ${
              activeTab === 'canvas' 
                ? 'border-emerald-500 text-white font-bold' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Canvas</span>
            <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.2 rounded font-mono">
              {canvasCards.filter(c => c.channelId === channelId).length}
            </span>
          </button>
        </div>

        {activeTab === 'messages' && (
          <>
            {/* Message Log View Window */}
        <div ref={channelMessagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {searchedChannelMessages.length === 0 ? (
            <div className="p-16 text-center text-gray-500 max-w-sm mx-auto flex flex-col items-center justify-center select-none">
              <MessageSquare className="h-10 w-10 text-gray-700 mb-4 animate-bounce shrink-0" />
              <p className="text-sm font-bold text-gray-400">No Messages Found</p>
              <p className="text-xs text-gray-505 mt-1">There are no matching chat logs matching your query inside this channel.</p>
            </div>
          ) : (
            Object.keys(groupedAndSortedMessages).map(dateKey => {
              const dateGroupMsgs = groupedAndSortedMessages[dateKey];
              return (
                <div key={dateKey} className="space-y-4">
                  
                  {/* DELIVERABLE DROPDOWN DATE SEPARATOR GRID LINES */}
                  <div id={`divider-${dateKey}`} className="flex items-center my-6 select-none relative group">
                    <div className="flex-1 h-px bg-gray-800" />
                    <div className="relative mx-3 shrink-0">
                      <button 
                        onClick={() => setShowJumpToDateDropdown(showJumpToDateDropdown === dateKey ? false : (dateKey as any))}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#121317] hover:bg-gray-850 text-[11px] font-bold text-gray-300 hover:text-white rounded-full border border-gray-800 shadow-xl transition-all cursor-pointer"
                      >
                        <span>{dateKey}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                      </button>

                      {/* Jump to alternative message dates dropdown log */}
                      {showJumpToDateDropdown === dateKey && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-52 bg-[#121317] border border-gray-800 rounded-lg shadow-2xl py-1 z-50 text-[11px]">
                          <div className="px-3 py-1 text-[10px] text-gray-500 font-bold uppercase mb-1">Jump to day</div>
                          {Object.keys(groupedAndSortedMessages).map(alternativeDate => (
                            <button 
                              key={alternativeDate}
                              onClick={() => jumpToSpecifiedDate(alternativeDate)}
                              className={`w-full text-left px-3 py-1.5 transition ${
                                alternativeDate === dateKey 
                                  ? 'bg-blue-600/10 text-emerald-400 font-bold' 
                                  : 'text-gray-300 hover:bg-gray-800'
                              }`}
                            >
                              <span>{alternativeDate}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 h-px bg-gray-800" />
                  </div>

                  {/* Messages list for current group */}
                  {dateGroupMsgs.map(msg => {
                    const sender = users.find(u => u.id === msg.senderId);
                    const isVoiceNote = msg.text.includes('🎤 Voice Note');
                    const isVideoClip = msg.text.includes('📹 Camera Video Clip') || msg.text.includes('📹 Recorded Video Clip');
                    const hasAttachmentStr = msg.text.includes('📄 [Document Attachment:');

                    return (
                      <div key={msg.id} className="relative flex hover:bg-[#2A2B32]/30 p-2.5 -mx-2.5 rounded-lg transition-colors group">
                        
                        <div className="h-10 w-10 bg-gray-700 rounded mr-4 shrink-0 overflow-hidden border border-gray-800">
                          <UserAvatar
                            user={sender}
                            fallbackName="A"
                            alt={sender?.name || 'User'}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline mb-1">
                            <span className="font-bold text-sm text-gray-200 hover:underline cursor-pointer mr-2.5 shrink-0">
                              <DisplayName name={sender?.name || 'Unknown User'} isAgent={sender?.isAgent} />
                            </span>
                            
                            {sender?.role === 'Super Admin' && (
                              <span className="text-[9px] font-bold text-gray-950 bg-yellow-500 px-1 py-0.2 rounded mr-2 uppercase select-none">
                                Admin
                              </span>
                            )}

                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Message Content render */}
                          <div className="text-gray-305 text-[14px] leading-relaxed break-words">
                            <FormattedMessage text={msg.text} />
                          </div>
                          {renderAttachments(msg.attachments)}

                          {/* Dynamic Custom Interactive Players for Recorded audio/video attachments */}
                          {isVoiceNote && (
                            <VoiceNotePlayer 
                              durationText={msg.text.includes('(') ? msg.text.split('(')[1].split(')')[0] : '00:03'} 
                            />
                          )}

                          {isVideoClip && (
                            <VideoMessagePlayer 
                              durationText={msg.text.includes('(') ? msg.text.split('(')[1].split(')')[0] : '00:04'} 
                            />
                          )}

                          {hasAttachmentStr && (
                            <div className="mt-2.5 max-w-sm bg-gray-900 border border-gray-800 p-3 rounded-lg flex items-center space-x-3.5 select-none animate-fade-in cursor-pointer hover:border-gray-750 transition-colors">
                              <div className="h-8 w-8 bg-blue-950/40 text-blue-400 rounded flex items-center justify-center border border-blue-900/10 shrink-0">
                                <FileText className="h-4.5 w-4.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-305 truncate">whitepaper_draft.pdf</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">2.4 MB • Generated Portable Document</p>
                              </div>
                            </div>
                          )}

                          <MessageReactions reactions={msg.reactions} itemId={msg.id} />
                          
                          {/* Thread replies snippet preview panel */}
                          {(msg.replies.length > 0) && (
                            <div 
                              className="mt-2 text-xs flex items-center text-blue-400 hover:underline cursor-pointer bg-blue-950/20 px-2 py-1 rounded inline-flex border border-blue-900/10"
                              onClick={() => setActiveThreadId(msg.id)}
                            >
                              <div className="flex -space-x-1.5 mr-2 shrink-0">
                                {msg.replies.slice(0, 3).map((r, i) => {
                                  const replier = users.find(u => u.id === r.senderId);
                                  return (
                                    <div key={i} className="h-5 w-5 rounded-full overflow-hidden border border-[#1A1D21] bg-gray-600">
                                       <UserAvatar
                                         user={replier}
                                         fallbackName="X"
                                         alt={replier?.name || 'User'}
                                         className="h-full w-full object-cover"
                                       />
                                    </div>
                                  );
                                })}
                              </div>
                              <span className="font-semibold">{msg.replies.length} replies</span>
                            </div>
                          )}
                          
                          <MessageActions itemId={msg.id} onReply={() => setActiveThreadId(msg.id)} />
                        </div>
                      </div>
                    );
                  })}

                </div>
              );
            })
          )}
        </div>

        {/* DELIVERABLE DESKFLOW-STYLE REFACTOR RICH TEXT EDITOR INPUT CONTAINER */}
        <div className="mx-6 mb-6 mt-1 bg-[#1A1D21] border border-gray-700/80 rounded-lg flex flex-col focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 shadow-xl relative">
          
          {/* Active Audio Recorder Panel Overlay */}
          {isRecordingAudio && (
            <div className="absolute inset-0 bg-[#121317] z-20 px-4 py-3 flex items-center justify-between select-none animate-fade-in-down">
              <div className="flex items-center space-x-3.5">
                <div className="h-7 w-7 rounded-full bg-red-650 flex items-center justify-center text-white relative">
                  <span className="absolute inset-0 rounded-full bg-red-500/30 blur animate-ping pointer-events-none"></span>
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Recording Voice Memo...</p>
                  <div className="flex items-center space-x-2.5 mt-0.5">
                    <span className="text-[11px] font-mono text-red-400 font-bold">{formatTime(audioRecordingTime)}</span>
                    <div className="flex items-center space-x-0.5 h-3 shrink-0">
                      {[3, 6, 9, 4, 8, 12, 10, 6, 8, 4, 3, 5, 8, 10, 3, 6, 8, 4, 3].map((barH, i) => (
                        <div 
                          key={i} 
                          style={{ height: `${isAudioPaused ? 2 : barH}px` }} 
                          className="w-0.5 bg-red-500 Transition-all duration-300"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <button 
                  onClick={handleCancelAudioRecording}
                  className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-850 hover:bg-gray-800 rounded transition cursor-pointer"
                  title="Discard Recording"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setIsAudioPaused(!isAudioPaused)}
                  className="px-3.5 py-1.5 bg-gray-850 hover:bg-gray-800 text-gray-300 rounded font-semibold cursor-pointer"
                >
                  {isAudioPaused ? "Resume" : "Pause"}
                </button>
                <button 
                  onClick={sendVoiceNoteMessage}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 rounded font-bold cursor-pointer transition shadow"
                >
                  Send Note
                </button>
              </div>
            </div>
          )}

          {/* Active Video Recorder Overlay Simulation */}
          {isRecordingVideo && (
            <div className="absolute inset-0 bg-[#121317] z-20 px-4 py-3 flex items-center justify-between select-none animate-fade-in-down">
              <div className="flex items-center space-x-3.5">
                <div className="h-7 w-7 rounded-full bg-blue-650 flex items-center justify-center text-white relative">
                  <span className="absolute inset-0 rounded-full bg-blue-400/30 blur animate-ping pointer-events-none"></span>
                  <Video className="h-4 w-4 text-blue-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Camera Recorder Streaming...</p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[11px] font-mono text-blue-400 font-bold">{formatTime(videoRecordingTime)}</span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider bg-gray-850 px-1 py-0.2 rounded">Webcam Ready</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <button 
                  onClick={handleCancelVideoRecording}
                  className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-850 hover:bg-gray-800 rounded cursor-pointer"
                  title="Cancel Recording"
                >
                  <X className="h-4 w-4" />
                </button>
                <button 
                  onClick={sendVideoClipMessage}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 rounded font-bold cursor-pointer transition shadow"
                >
                  Post Video
                </button>
              </div>
            </div>
          )}

          {/* Autocomplete Channel Mentions Select Overlay Popup */}
          {showChannelMentionsList && (
            <div className="absolute bottom-full left-3 mb-2 w-64 bg-[#121317] border border-gray-800 rounded-xl shadow-2xl z-[60] overflow-hidden select-none animate-fade-in-up">
              <div className="px-3.5 py-1.5 text-[9px] text-gray-500 font-bold uppercase border-b border-gray-850 tracking-wider flex items-center justify-between">
                <span>Mention Channel</span>
                {channelMentionQuery && (
                  <span className="text-[8px] font-mono lowercase bg-gray-800 px-1 py-0.2 rounded text-gray-400">#{channelMentionQuery}</span>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-850/30">
                {filteredMentionChannels.map(candidate => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => handleChannelMentionSelect(candidate.name)}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-xs text-gray-200 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    {candidate.isPrivate ? <Lock className="h-4 w-4 text-amber-400 shrink-0" /> : <Hash className="h-4 w-4 text-blue-400 shrink-0" />}
                    <span className="font-semibold truncate">#{candidate.name}</span>
                  </button>
                ))}
                {filteredMentionChannels.length === 0 && <div className="px-3.5 py-3 text-xs text-gray-500">No accessible channels found</div>}
              </div>
            </div>
          )}

          {/* Autocomplete User Mentions Select Overlay Popup */}
          {showMentionsList && (
            <div className="absolute bottom-full left-3 mb-2 w-64 bg-[#121317] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden select-none animate-fade-in-up">
              <div className="px-3.5 py-1.5 text-[9px] text-gray-500 font-bold uppercase border-b border-gray-850 tracking-wider flex items-center justify-between">
                <span>Mention Team Member</span>
                {mentionQuery && (
                  <span className="text-[8px] font-mono lowercase bg-gray-800 px-1 py-0.2 rounded text-gray-400">@{mentionQuery}</span>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-850/30">
                {filteredMentionUsers.map(usr => (
                  <button 
                    key={usr.id}
                    type="button"
                    onClick={() => handleMentionClick(usr.username || usr.name, false)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-800 text-xs text-gray-200 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <UserAvatar user={usr} className="h-5 w-5 rounded-full object-cover bg-gray-700 shrink-0" alt={usr.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold truncate text-gray-200 hover:text-white flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${usr.role === 'Super Admin' || usr.id === '8' ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                          <DisplayName name={usr.name} isAgent={usr.isAgent} />
                        </span>
                        {usr.username && (
                          <span className="text-[10px] text-gray-400 font-mono shrink-0">@{usr.username}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formatting bar row - Toggled by showFormatting state (Aa Mode) */}
          {showFormatting && (
            <div className="flex items-center px-2 py-1.5 space-x-0.5 border-b border-gray-700/80 bg-[#2A2B32]/15">
              <button onClick={() => applyFormat('bold', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer" title="Bold"><Bold className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('italic', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer" title="Italic"><Italic className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('strikethrough', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer" title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-gray-805 mx-1" />
              <button onClick={() => applyFormat('link', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer" title="Insert Link"><LinkIcon className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('list-ol', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer" title="Ordered List"><ListOrdered className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('list-ul', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer" title="Bulleted List"><List className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('quote', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer" title="Quote text"><AlignLeft className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-gray-805 mx-1" />
              <button onClick={() => applyFormat('code', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer" title="Single Code segment"><Code className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('codeblock', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer" title="Code Block macro"><SquareSlash className="h-4 w-4" /></button>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex flex-col">
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-gray-800 px-3 pt-3">
                {pendingAttachments.map(attachment => (
                  <div key={attachment.id} className="relative flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-[10px] text-gray-300">
                    {attachment.type.startsWith('image/') ? <img src={attachment.dataUrl} alt="" className="h-8 w-8 rounded object-cover" /> : <FileText className="h-4 w-4 text-red-400" />}
                    <span className="max-w-[150px] truncate">{attachment.name}</span>
                    <button type="button" onClick={() => setPendingAttachments(previous => previous.filter(item => item.id !== attachment.id))} className="text-gray-500 hover:text-white" aria-label={`Remove ${attachment.name}`}><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <textarea 
              ref={channelInputRef}
              value={newMessage}
              onChange={(e: any) => handleTextChange(e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newMessage.trim() || pendingAttachments.length > 0) {
                    sendMessage(e as any);
                  }
                }
              }}
              placeholder={`Message #${channel.name}`}
              className="w-full bg-transparent border-none pl-4 pr-12 py-3 text-sm text-gray-200 focus:outline-none focus:ring-0 resize-none min-h-[90px] outline-none border-0"
            />
            
            {/* Bottom Row Actions Toolbar */}
            <div className="px-3 pb-2.5 flex items-center justify-between mt-2 select-none">
              
              <div className="flex items-center space-x-1">
                
                {/* Plus button trigger attachment choices */}
                <div className="relative group">
                  <button 
                    type="button" 
                    onClick={() => attachmentInputRef.current?.click()}
                    className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
                    title="Attach images, videos, or PDFs"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <input ref={attachmentInputRef} type="file" accept="image/*,video/*,application/pdf" multiple className="hidden" onChange={handleAttachmentSelection} />
                </div>

                {/* Aa Toggle button row */}
                <button 
                  type="button" 
                  onClick={() => setShowFormatting(!showFormatting)}
                  className={`p-1.5 rounded transition cursor-pointer ${
                    showFormatting 
                      ? 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/25' 
                      : 'text-gray-400 hover:text-gray-250 hover:bg-gray-800'
                  }`}
                  title="Toggle custom character formatting panel"
                >
                  <Type className="h-4 w-4" />
                </button>
                
                {/* Main Emoji Deluxe Trigger */}
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowMainEmojiPicker(!showMainEmojiPicker)}
                    className={`p-1.5 hover:text-yellow-400 transition rounded cursor-pointer ${showMainEmojiPicker ? 'bg-gray-800 text-yellow-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                    title="Insert smiley emoji icon"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                  {showMainEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-3 z-[1000]">
                      <EmojiDeluxe 
                        onSelect={(emoji) => {
                          setNewMessage(prev => prev + emoji);
                          setShowMainEmojiPicker(false);
                        }} 
                        onClose={() => setShowMainEmojiPicker(false)} 
                      />
                    </div>
                  )}
                </div>

                {/* At-mention select trigger */}
                <button 
                  type="button" 
                  onClick={() => openMentionPicker(false)}
                  className={`p-1.5 rounded cursor-pointer transition ${
                    showMentionsList 
                      ? 'bg-blue-600/10 text-blue-400' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  title="Mention a channel teammate"
                >
                  <AtSign className="h-4 w-4" />
                </button>

                {/* Simulated Webcam camera recorder click */}
                <button 
                  type="button" 
                  onClick={handleToggleVideoRecording}
                  className="p-1.5 text-gray-405 hover:text-gray-200 hover:bg-gray-800 rounded cursor-pointer transition"
                  title="Record direct video attachment"
                >
                  <Video className="h-4 w-4" />
                </button>

                {/* Simulated Audio Microphone voice memo recorder click */}
                <button 
                  type="button" 
                  onClick={handleToggleAudioRecording}
                  className="p-1.5 text-gray-450 hover:text-gray-200 hover:bg-gray-850 rounded cursor-pointer transition"
                  title="Record dynamic custom voice clip"
                >
                  <Mic className="h-4 w-4" />
                </button>

                {/* Quick Link layout to project boards Canvas view */}
                <button 
                  type="button" 
                  onClick={() => onNavigate('canvas')}
                  className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-805 rounded cursor-pointer transition"
                  title="Open real project boards Canvas"
                >
                  <AlignLeft className="h-4 w-4 rotate-90" />
                </button>

              </div>
              
              {/* Refactored Send Control Panel with chevron dropdown anchor */}
              <div className="flex rounded overflow-hidden select-none">
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-850 disabled:text-gray-500 transition cursor-pointer flex items-center justify-center font-bold text-xs"
                >
                  <Send className="h-4 w-4 mr-1.5" /> Send
                </button>
                <div className="w-px bg-green-800" />
                <button 
                  type="button" 
                  disabled={!newMessage.trim()} 
                  onClick={() => alert("Scheduled Send Dialog! You can configure messages to be delivered automatically in the future.")}
                  className="px-2 py-2 text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-850 disabled:text-gray-500 transition-colors flex items-center justify-center cursor-pointer"
                  title="Configure sending schedule options"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

            </div>
          </form>
        </div>
        </>
      )}

      {activeTab === 'files' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-800 gap-4 select-none">
            <div>
              <h3 className="font-bold text-gray-100 text-sm flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-400" /> 
                Channel Files and Assets
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Showing voice memos, webcam videos, and attachments gathered from current channel stream.
              </p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-900/60 p-2 rounded-lg border border-gray-800 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Thread files are automatically parsed</span>
            </div>
          </div>

          {extractedFilesAndLinks.files.length === 0 ? (
            <div className="p-16 text-center text-gray-500 max-w-sm mx-auto flex flex-col items-center justify-center select-none bg-[#121317] border border-gray-800 rounded-2xl">
              <FileText className="h-10 w-10 text-gray-700 mb-4 shrink-0" />
              <p className="text-sm font-bold text-gray-400">No channel resources found</p>
              <p className="text-xs text-gray-500 mt-1">Record a video clip, a voice memo, or upload documents to see them listed in this repository.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extractedFilesAndLinks.files.map((file) => (
                <div 
                  key={file.id} 
                  className="p-4 bg-[#121317] border border-gray-800/80 rounded-xl hover:border-gray-700 transition flex flex-col group relative"
                >
                  <div className="flex items-start justify-between select-none">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img 
                        src={file.senderAvatar} 
                        alt={file.senderName} 
                        className="h-8 w-8 rounded-full border border-gray-800 bg-gray-700"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-200 truncate">{file.senderName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(file.timestamp).toLocaleDateString()} at {new Date(file.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {file.isReply && <span className="ml-1 text-emerald-400 font-semibold bg-emerald-950/20 px-1 rounded border border-emerald-900/10">Thread</span>}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('messages');
                        if (file.isReply) {
                          setActiveThreadId(file.messageId);
                        }
                        setTimeout(() => {
                          const element = document.getElementById(`divider-${formatDateWithOrdinal(file.timestamp)}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 120);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Jump to Message
                    </button>
                  </div>

                  <div className="mt-4 flex-1">
                    {file.type === 'voice' && (
                      <div className="bg-gray-950/40 p-1.5 rounded-lg border border-gray-850">
                        <VoiceNotePlayer 
                          durationText={file.text.includes('(') ? file.text.split('(')[1].split(')')[0] : '00:03'} 
                        />
                      </div>
                    )}
                    
                    {file.type === 'video' && (
                      <div className="bg-gray-950/40 p-1.5 rounded-lg border border-gray-850 flex justify-center">
                        <VideoMessagePlayer 
                          durationText={file.text.includes('(') ? file.text.split('(')[1].split(')')[0] : '00:04'} 
                        />
                      </div>
                    )}

                    {file.type === 'doc' && (
                      <div className="p-3 bg-gray-950/40 border border-gray-850 rounded-lg flex items-center space-x-3 cursor-pointer hover:bg-gray-950 transition-colors">
                        <div className="h-8 w-8 bg-blue-950/40 border border-blue-900/10 rounded flex items-center justify-center text-blue-400 shrink-0">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-300 truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{file.size || '2.4 MB'} • Download Asset</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'links' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 select-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-800 gap-4">
            <div>
              <h3 className="font-bold text-gray-100 text-sm flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4 text-emerald-400" />
                Links and Channel Workflows
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Manage active automated standups, repo notifications, and references shared inside this channel.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Shared links (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>Resource Ledger</span>
                <span className="text-[10px] bg-gray-850 text-gray-300 font-mono font-bold px-1.5 py-0.2 rounded-full border border-gray-800">
                  {extractedFilesAndLinks.links.length}
                </span>
              </h4>

              {extractedFilesAndLinks.links.length === 0 ? (
                <div className="p-12 text-center text-gray-505 bg-[#121317] border border-gray-850 rounded-2xl">
                  <LinkIcon className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-xs font-bold text-gray-400">No Shared URLs Captured</p>
                  <p className="text-[11px] text-gray-500 mt-1 font-sans">Web addresses and references shared in the stream appear ledgered here.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 select-text">
                  {extractedFilesAndLinks.links.map((link) => (
                    <div key={link.id} className="p-3.5 bg-[#121317] border border-gray-850 rounded-xl hover:border-gray-800 transition flex flex-col space-y-2">
                      <div className="flex items-center justify-between select-none">
                        <div className="flex items-center space-x-2">
                          <img src={link.senderAvatar} alt="" className="h-6 w-6 rounded-full border border-gray-800 shrink-0 object-cover" />
                          <span className="text-[11px] font-semibold text-gray-300">{link.senderName}</span>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('messages');
                            if (link.isReply) {
                              setActiveThreadId(link.messageId);
                            }
                            setTimeout(() => {
                              const element = document.getElementById(`divider-${formatDateWithOrdinal(link.timestamp)}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 120);
                          }}
                          className="text-[10px] text-gray-400 hover:text-white font-semibold hover:underline bg-gray-800 px-2 py-0.5 rounded cursor-pointer"
                        >
                          Jump to Chat
                        </button>
                      </div>
                      <div className="flex flex-col">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-bold text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0 truncate max-w-full"
                        >
                          <span>{link.title}</span>
                          <ExternalLink className="h-3 w-3 inline shrink-0" />
                        </a>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate select-all">{link.url}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Workflows (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-2 select-none">
                <Zap className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
                <span>Interactive Workspace Workflows</span>
              </h4>

              <div className="space-y-5">
                {workflows.map((wf: any, wfIndex: number) => {
                  return (
                    <div 
                      key={wf.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        wf.active 
                          ? 'bg-emerald-950/10 border-emerald-500/25 shadow-xl shadow-emerald-950/1 w-full' 
                          : 'bg-[#121317] border-gray-850 saturate-50 w-full'
                      }`}
                    >
                      {/* Title and Active Toggle Switch */}
                      <div className="flex items-start justify-between select-none">
                        <div className="flex items-start space-x-3.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                            wf.active 
                              ? 'bg-emerald-950/40 border-emerald-500/35 text-emerald-400 animate-pulse' 
                              : 'bg-gray-850 border-gray-800 text-gray-500'
                          }`}>
                            {wf.id === 'github_alerts' && <Zap className="h-4 w-4" />}
                            {wf.id === 'daily_standup' && <Clock className="h-4 w-4" />}
                            {wf.id === 'keyword_alerts' && <Bot className="h-4 w-4" />}
                          </div>
                          <div>
                            <h5 className="text-[13px] font-bold text-gray-200 flex items-center gap-2">
                              {wf.name}
                              {wf.active && (
                                <span className="text-[8px] bg-emerald-950 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20 tracking-wider">
                                  Enacted
                                  </span>
                              )}
                            </h5>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm">{wf.description}</p>
                          </div>
                        </div>

                        {/* Switch toggle control */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...workflows];
                            updated[wfIndex].active = !wf.active;
                            saveWorkflows(updated);
                          }}
                          className={`w-11 h-6 rounded-full p-0.5 transition duration-300 pointer-events-auto cursor-pointer focus:outline-none shrink-0 ${
                            wf.active ? 'bg-emerald-500' : 'bg-gray-800'
                          }`}
                        >
                          <div className={`bg-[#121317] w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                            wf.active ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {wf.active && (
                        <div className="mt-4 pt-3.5 border-t border-gray-800/60 space-y-3.5 text-xs">
                          {wf.id === 'github_alerts' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Codebase Repo URL</label>
                                <input 
                                  type="text" 
                                  value={wf.repoUrl}
                                  onChange={(e) => {
                                    const updated = [...workflows];
                                    updated[wfIndex].repoUrl = e.target.value;
                                    saveWorkflows(updated);
                                  }}
                                  className="w-full bg-[#1A1D21] border border-gray-800 rounded px-2.5 py-1.5 text-xs text-mono text-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-0"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Webhook Branch</label>
                                <input 
                                  type="text" 
                                  value={wf.branch}
                                  onChange={(e) => {
                                    const updated = [...workflows];
                                    updated[wfIndex].branch = e.target.value;
                                    saveWorkflows(updated);
                                  }}
                                  className="w-full bg-[#1A1D21] border border-gray-800 rounded px-2.5 py-1.5 text-xs text-mono text-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-0"
                                />
                              </div>
                            </div>
                          )}

                          {wf.id === 'daily_standup' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Daily Cue Time</label>
                                  <input 
                                    type="time" 
                                    value={wf.time}
                                    onChange={(e) => {
                                      const updated = [...workflows];
                                      updated[wfIndex].time = e.target.value;
                                      saveWorkflows(updated);
                                    }}
                                    className="w-full bg-[#1A1D21] border border-gray-800 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-0"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Assigned Members</label>
                                  <div className="bg-[#1A1D21] border border-gray-800 rounded px-3 py-1 text-xs text-gray-400 flex items-center justify-between h-9">
                                    <span>All Team Users ({channelUsers.length})</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Standup Interrogation questions</label>
                                <textarea 
                                  rows={2}
                                  value={wf.questions}
                                  onChange={(e) => {
                                    const updated = [...workflows];
                                    updated[wfIndex].questions = e.target.value;
                                    saveWorkflows(updated);
                                  }}
                                  className="w-full bg-[#1A1D21] border border-gray-800 rounded px-2.5 py-1 text-xs text-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-0 font-sans"
                                />
                              </div>
                            </div>
                          )}

                          {wf.id === 'keyword_alerts' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Key Phrases (Comma Separated)</label>
                                <input 
                                  type="text" 
                                  value={wf.keywords}
                                  onChange={(e) => {
                                    const updated = [...workflows];
                                    updated[wfIndex].keywords = e.target.value;
                                    saveWorkflows(updated);
                                  }}
                                  className="w-full bg-[#1A1D21] border border-gray-800 rounded px-2.5 py-1.5 text-xs text-mono text-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-0"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Action Receiver</label>
                                <select 
                                  value={wf.recipient}
                                  onChange={(e) => {
                                    const updated = [...workflows];
                                    updated[wfIndex].recipient = e.target.value;
                                    saveWorkflows(updated);
                                  }}
                                  className="w-full bg-[#1A1D21] border border-gray-800 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-0"
                                >
                                  {users.map(u => (
                                    <option key={u.id} value={u.name} className="bg-[#121317] text-gray-300">{u.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1.5 select-none">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                              <span>Enacted and listening to channel events...</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (!currentUser) return;
                                let botMsgText = '';
                                if (wf.id === 'github_alerts') {
                                  botMsgText = `🤖 [GitHub Alerts] Welcome back! **1 PR Merged** under branch \`${wf.branch}\` of \`${wf.repoUrl}\`:\n- *feat: core transaction reconciliation framework IFRS double entry integrity (#422) by Abdallah Sayed*`;
                                } else if (wf.id === 'daily_standup') {
                                  botMsgText = `🤖 [Daily Standup Assistant] Good morning team! Here are the core queries for our standup:\n${wf.questions}\n\n*Please reply in this thread to record your updates.*`;
                                } else {
                                  botMsgText = `🤖 [Urgent Keyword Dispatch] Word trigger detected in conversation: \`${wf.keywords.split(',')[0].trim()}\`. Paging receiver **${wf.recipient}** successfully.`;
                                }

                                const botMessage = {
                                  id: `msg_bot_${Date.now()}`,
                                  channelId,
                                  senderId: 'bot',
                                  text: botMsgText,
                                  timestamp: Date.now(),
                                  isRead: true,
                                  replies: [],
                                  reactions: ['🤖']
                                };

                                setMessages(previous => [...previous, botMessage]);
                                alert(`Workflow "${wf.name}" triggered! A bot broadcast has been published inside output logs.`);
                                setActiveTab('messages');
                              }}
                              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold block ml-auto rounded text-[10px] cursor-pointer transition shadow hover:shadow-yellow-500/10 uppercase tracking-wide"
                            >
                              Run Workflow Now
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'canvas' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-805/80 gap-4 select-none">
            <div>
              <h3 className="font-bold text-gray-105 text-sm flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4 text-emerald-400" /> 
                Channel Interactive Canvas Checklists
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                List of checklists and daily checkboxes assigned specifically to #{channel?.name} for task tracking.
              </p>
            </div>
            
            <button 
              onClick={() => setShowChannelCanvasCreator(!showChannelCanvasCreator)}
              className="flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-lg font-bold text-xs transition-colors shadow-lg cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {showChannelCanvasCreator ? 'Close Creator' : 'Create Channel Checklist'}
            </button>
          </div>

          {showChannelCanvasCreator && (
            <div className="p-4 bg-[#121317] border border-gray-800 rounded-xl max-w-lg select-none animate-fade-in">
              <h4 className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-3">Assemble Checklist Card</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Checklist Title</label>
                  <input 
                    type="text"
                    placeholder="e.g. Daily accounting reconciliations..."
                    value={newChannelCanvasTitle}
                    onChange={(e) => setNewChannelCanvasTitle(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1.5">Color Theme</label>
                  <div className="flex space-x-2">
                    {[
                      { value: 'border-blue-500', bg: 'bg-blue-500' },
                      { value: 'border-purple-500', bg: 'bg-purple-500' },
                      { value: 'border-green-500', bg: 'bg-green-500' },
                      { value: 'border-emerald-500', bg: 'bg-emerald-500' },
                      { value: 'border-pink-500', bg: 'bg-pink-500' },
                      { value: 'border-yellow-500', bg: 'bg-yellow-500' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedChannelCanvasColor(opt.value)}
                        className={`h-5 w-5 rounded-full border-2 transition ${
                          selectedChannelCanvasColor === opt.value ? 'border-white scale-110' : 'border-transparent'
                        } ${opt.bg}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newChannelCanvasTitle.trim()) return;
                      const newCard = {
                        id: `canvas_${Date.now()}`,
                        title: newChannelCanvasTitle.trim(),
                        color: selectedChannelCanvasColor,
                        channelId: channelId,
                        items: []
                      };
                      const updated = [...canvasCards, newCard];
                      saveCanvasCards(updated);
                      setNewChannelCanvasTitle('');
                      setShowChannelCanvasCreator(false);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-bold rounded cursor-pointer"
                  >
                    Create Card
                  </button>
                </div>
              </div>
            </div>
          )}

          {canvasCards.filter(c => c.channelId === channelId).length === 0 ? (
            <div className="p-12 text-center text-gray-500 max-w-sm mx-auto flex flex-col items-center justify-center select-none bg-[#121317] border border-gray-850 rounded-2xl">
              <LayoutGrid className="h-8 w-8 text-gray-700 mb-3" />
              <p className="text-xs font-bold text-gray-400">No checklists created for #{channel?.name}</p>
              <p className="text-[11px] text-gray-500 mt-1">Add checklists and track daily checkboxes for team cooperation inside this channel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {canvasCards.filter(c => c.channelId === channelId).map((card) => {
                const total = card.items.length;
                const completed = card.items.filter((i: any) => i.completed).length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div key={card.id} className={`p-4 bg-[#121317] border border-gray-850/80 rounded-xl hover:border-gray-700 transition flex flex-col border-t-4 ${card.color || 'border-blue-500'}`}>
                    <div className="flex justify-between items-start mb-3 select-none">
                      <h4 className="font-bold text-gray-100 text-xs">{card.title}</h4>
                      <button 
                        onClick={() => {
                          if (window.confirm('Delete this checklist?')) {
                            saveCanvasCards(canvasCards.filter(c => c.id !== card.id));
                          }
                        }}
                        className="text-gray-500 hover:text-red-400 transition cursor-pointer p-0.5"
                        title="Delete checklist card"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {total > 0 && (
                      <div className="select-none text-[9.5px] text-gray-400 font-medium flex items-center justify-between mb-1.5 font-sans">
                        <span>Tasks complete: {completed}/{total}</span>
                        <span className="font-mono text-[10.5px] text-emerald-400 font-semibold">{percent}%</span>
                      </div>
                    )}
                    {total > 0 && (
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-3.5 select-none animate-pulse">
                        <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                      </div>
                    )}

                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto mb-4">
                      {card.items.length === 0 && (
                        <p className="text-center text-[10px] text-gray-500 py-3 select-none">No active items.</p>
                      )}
                      {card.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-950/30 hover:bg-gray-950/60 border border-gray-850/40 rounded-lg group">
                          <button
                            onClick={() => {
                              const updated = canvasCards.map(c => {
                                if (c.id === card.id) {
                                  return {
                                    ...c,
                                    items: c.items.map((it: any) => {
                                      if (it.id === item.id) return { ...it, completed: !it.completed };
                                      return it;
                                    })
                                  };
                                }
                                return c;
                              });
                              saveCanvasCards(updated);
                            }}
                            className="mr-2 text-gray-500 hover:text-emerald-400 transition cursor-pointer shrink-0"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-gray-500" />
                            )}
                          </button>
                          
                          <span 
                            className={`flex-1 text-xs select-text truncate max-w-full ${item.completed ? 'text-gray-500 line-through' : 'text-gray-250'}`}
                          >
                            {item.text}
                          </span>

                          <button
                            onClick={() => {
                              const updated = canvasCards.map(c => {
                                if (c.id === card.id) {
                                  return {
                                    ...c,
                                    items: c.items.filter((it: any) => it.id !== item.id)
                                  };
                                }
                                return c;
                              });
                              saveCanvasCards(updated);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-red-400 p-0.5 shrink-0 ml-1 cursor-pointer"
                            title="Delete task item"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 items-center pt-2 border-t border-gray-805/30">
                      <input 
                        type="text"
                        placeholder="Add checklist item..."
                        value={channelCanvasTaskInputs[card.id] || ''}
                        onChange={(e) => setChannelCanvasTaskInputs({
                          ...channelCanvasTaskInputs,
                          [card.id]: e.target.value
                        })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const txt = channelCanvasTaskInputs[card.id]?.trim();
                            if (!txt) return;
                            const updated = canvasCards.map(c => {
                              if (c.id === card.id) {
                                return {
                                  ...c,
                                  items: [...c.items, { id: `task_${Date.now()}`, text: txt, completed: false }]
                                };
                              }
                              return c;
                            });
                            saveCanvasCards(updated);
                            setChannelCanvasTaskInputs({
                              ...channelCanvasTaskInputs,
                              [card.id]: ''
                            });
                          }
                        }}
                        className="flex-1 bg-gray-950/40 border border-gray-800 rounded px-2.5 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-emerald-500"
                      />
                      <button 
                        onClick={() => {
                          const txt = channelCanvasTaskInputs[card.id]?.trim();
                          if (!txt) return;
                          const updated = canvasCards.map(c => {
                            if (c.id === card.id) {
                              return {
                                ...c,
                                items: [...c.items, { id: `task_${Date.now()}`, text: txt, completed: false }]
                              };
                            }
                            return c;
                          } );
                          saveCanvasCards(updated);
                          setChannelCanvasTaskInputs({
                            ...channelCanvasTaskInputs,
                            [card.id]: ''
                          });
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-550 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Members Drawer Panel Slideout */}
      {showMembersDrawer && (
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-[#121317] border-l border-gray-800 z-30 flex flex-col select-none animate-fade-in-left">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 shrink-0">
            <h3 className="font-bold text-gray-100 flex items-center text-sm">
              <Users className="h-4.5 w-4.5 mr-2 text-gray-400" /> Channel Members ({channelUsers.length})
            </h3>
            <div className="flex items-center gap-1">
              {canManageChannelMembers && (
                <button
                  type="button"
                  onClick={openAddMembers}
                  className="text-gray-500 hover:text-blue-300 transition cursor-pointer p-1 rounded hover:bg-gray-800"
                  title="Add people to channel"
                  aria-label="Add people to channel"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setShowMembersDrawer(false)}
                className="text-gray-500 hover:text-white transition cursor-pointer p-1 rounded hover:bg-gray-800"
                aria-label="Close channel members"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-blue-600/10 p-3 rounded-lg border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
              Super Admins, Admins, and members explicitly assigned access are shown here.
            </div>

            {showAddMembers && (
              <div className="rounded-xl border border-blue-500/30 bg-[#1A1D21] p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">Add people</p>
                  <button
                    type="button"
                    onClick={closeAddMembers}
                    className="p-1 text-gray-500 hover:text-white rounded hover:bg-gray-800 cursor-pointer"
                    title="Close add people"
                    aria-label="Close add people"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="search"
                    value={memberSearchQuery}
                    onChange={event => setMemberSearchQuery(event.target.value)}
                    placeholder="Search people..."
                    aria-label="Search people to add"
                    className="w-full rounded-lg border border-gray-700 bg-gray-950/60 py-2 pl-8 pr-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {addableChannelUsers.length > 0 ? addableChannelUsers.map(usr => (
                    <label
                      key={usr.id}
                      className={`flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-colors ${selectedMemberIds.includes(usr.id) ? 'bg-blue-500/15 border border-blue-500/40' : 'border border-transparent hover:bg-gray-800/70'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(usr.id)}
                        onChange={() => toggleSelectedMember(usr.id)}
                        className="h-3.5 w-3.5 accent-blue-500 shrink-0"
                      />
                      <UserAvatar
                        user={usr}
                        className="h-7 w-7 rounded-full border border-gray-800 bg-gray-700 object-cover shrink-0"
                        alt={usr.name}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-gray-200 truncate"><DisplayName name={usr.name} isAgent={usr.isAgent} /></span>
                        <span className="block text-[10px] text-gray-500 truncate">{usr.email}{usr.title ? ` • ${usr.title}` : ''}</span>
                      </span>
                    </label>
                  )) : (
                    <p className="px-2 py-4 text-center text-xs text-gray-500">No people available to add.</p>
                  )}
                </div>

                {memberUpdateMessage && (
                  <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2 text-[11px] text-emerald-300" role="status">
                    {memberUpdateMessage}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeAddMembers}
                    className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-gray-400 hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSelectedMembers}
                    disabled={selectedMemberIds.length === 0}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    Add selected
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {channelUsers.map(usr => (
                <div key={usr.id} className="flex items-center justify-between p-2 hover:bg-[#1A1D21] rounded-xl transition-all border border-transparent hover:border-gray-800/60">
                  <div className="flex items-center space-x-3 min-w-0">
                    <UserAvatar
                      user={usr}
                      className="w-9 h-9 rounded-full border border-gray-800 bg-gray-700 object-cover"
                      alt={usr.name}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-200 truncate"><DisplayName name={usr.name} isAgent={usr.isAgent} /></p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{usr.title || usr.role}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded uppercase shrink-0">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thread Panel */}
      {activeThreadId && activeThread && (
        <div className="absolute inset-y-2 inset-x-2 md:top-4 md:right-4 md:bottom-4 md:left-auto md:w-[380px] max-w-full flex flex-col bg-[#121317] border border-gray-700/80 rounded-xl md:rounded-2xl shadow-2xl z-20 animate-fade-in-left">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
            <h3 className="font-bold text-gray-100">Thread</h3>
            <button onClick={() => setActiveThreadId(null)} className="text-gray-500 hover:text-gray-300 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={threadMessagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Original Message */}
            <div id={`thread-item-${activeThread.id}`} className={`relative group flex mb-6 border-b border-gray-800 pb-6 p-2 -mx-2 rounded transition-colors ${highlightedThreadItemId === activeThread.id ? 'bg-blue-500/15 ring-1 ring-blue-400/60' : 'hover:bg-[#2A2B32]/30'}`}>
              <div className="h-10 w-10 bg-gray-700 rounded mr-3 shrink-0 overflow-hidden">
                <UserAvatar
                  user={users.find(u => u.id === activeThread.senderId)}
                  fallbackName="Z"
                  alt="User"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline mb-1">
                  <span className="font-bold text-gray-200 mr-2"><DisplayName name={users.find(u => u.id === activeThread.senderId)?.name || 'Unknown User'} isAgent={users.find(u => u.id === activeThread.senderId)?.isAgent} /></span>
                  <span className="text-xs text-gray-500">{new Date(activeThread.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-gray-300"><FormattedMessage text={activeThread.text} /></div>
                <MessageReactions reactions={activeThread.reactions} itemId={activeThread.id} />
              </div>
              <MessageActions itemId={activeThread.id} onReply={() => { threadInputRef.current?.focus() }} />
            </div>

            {/* Replies */}
            {activeThread.replies.length > visibleRepliesCount && (
              <div className="flex justify-center my-3 border-b border-gray-800 pb-3">
                <button
                  type="button"
                  onClick={() => setVisibleRepliesCount(prev => prev + 10)}
                  className="px-4 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 rounded-full transition cursor-pointer flex items-center shadow-sm"
                >
                  Show Previous ({activeThread.replies.length - visibleRepliesCount} remaining)
                </button>
              </div>
            )}

            {activeThread.replies.slice(Math.max(0, activeThread.replies.length - visibleRepliesCount)).map(reply => {
              const replier = users.find(u => u.id === reply.senderId);
              return (
                <div id={`thread-item-${reply.id}`} key={reply.id} className={`relative group flex p-2 -mx-2 rounded transition-colors mt-2 ${highlightedThreadItemId === reply.id ? 'bg-blue-500/15 ring-1 ring-blue-400/60' : 'hover:bg-[#2A2B32]/30'}`}>
                  <div className="h-8 w-8 bg-gray-700 rounded mr-3 shrink-0 overflow-hidden">
                    <UserAvatar
                      user={replier}
                      fallbackName="Y"
                      alt={replier?.name || 'User'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline mb-1">
                      <span className="font-bold text-gray-200 text-sm mr-2"><DisplayName name={replier?.name || 'Unknown User'} isAgent={replier?.isAgent} /></span>
                      <span className="text-[10px] text-gray-500">{new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-sm text-gray-300"><FormattedMessage text={reply.text} /></div>
                    <MessageReactions reactions={reply.reactions} itemId={reply.id} />
                  </div>
                  <MessageActions itemId={reply.id} onReply={() => { threadInputRef.current?.focus() }} />
                </div>
              );
            })}
          </div>

          {/* Reply Input */}
          <div className="mx-4 mb-4 bg-[#1A1D21] border border-gray-700 rounded-lg flex flex-col focus-within:border-gray-500 relative animate-fade-in">
            {/* Thread Autocomplete Channel Mentions Select Overlay Popup */}
            {showThreadChannelMentionsList && (
              <div className="absolute bottom-full left-3 mb-2 w-64 bg-[#121317] border border-gray-800 rounded-xl shadow-2xl z-[60] overflow-hidden select-none animate-fade-in-up">
                <div className="px-3.5 py-1.5 text-[9px] text-gray-500 font-bold uppercase border-b border-gray-850 tracking-wider flex items-center justify-between">
                  <span>Mention Channel</span>
                  {threadChannelMentionQuery && (
                    <span className="text-[8px] font-mono lowercase bg-gray-800 px-1 py-0.2 rounded text-gray-400">#{threadChannelMentionQuery}</span>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-850/30">
                  {filteredThreadMentionChannels.map(candidate => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleChannelMentionSelect(candidate.name, true)}
                      className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-xs text-gray-200 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      {candidate.isPrivate ? <Lock className="h-4 w-4 text-amber-400 shrink-0" /> : <Hash className="h-4 w-4 text-blue-400 shrink-0" />}
                      <span className="font-semibold truncate">#{candidate.name}</span>
                    </button>
                  ))}
                  {filteredThreadMentionChannels.length === 0 && <div className="px-3.5 py-3 text-xs text-gray-500">No accessible channels found</div>}
                </div>
              </div>
            )}

            {/* Thread Autocomplete User Mentions Select Overlay Popup */}
            {showThreadMentionsList && (
              <div className="absolute bottom-full left-3 mb-2 w-64 bg-[#121317] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden select-none animate-fade-in-up">
                <div className="px-3.5 py-1.5 text-[9px] text-gray-500 font-bold uppercase border-b border-gray-850 tracking-wider flex items-center justify-between">
                  <span>Mention Team Member</span>
                  {threadMentionQuery && (
                    <span className="text-[8px] font-mono lowercase bg-gray-800 px-1 py-0.2 rounded text-gray-400">@{threadMentionQuery}</span>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-850/30">
                  {filteredThreadMentionUsers.map(usr => (
                    <button 
                      key={usr.id}
                      type="button"
                      onClick={() => handleMentionClick(usr.username || usr.name, true)}
                      className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-xs text-gray-200 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      <UserAvatar user={usr} className="h-5 w-5 rounded-full object-cover bg-gray-700 shrink-0" alt={usr.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate text-gray-200 hover:text-white flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${usr.role === 'Super Admin' || usr.id === '8' ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                            <DisplayName name={usr.name} isAgent={usr.isAgent} />
                          </span>
                          {usr.username && (
                            <span className="text-[10px] text-gray-400 font-mono shrink-0">@{usr.username}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center px-2 py-1.5 space-x-0.5 border-b border-gray-700 bg-[#2A2B32]/30">
              <button onClick={() => applyFormat('bold', true)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer" title="Bold"><Bold className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('italic', true)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer" title="Italic"><Italic className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('strikethrough', true)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer" title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-gray-600 mx-1" />
              <button onClick={() => applyFormat('link', true)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer" title="Insert Link"><LinkIcon className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('list-ol', true)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer" title="Ordered List"><ListOrdered className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('list-ul', true)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer" title="Bulleted list"><List className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('quote', true)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer" title="Quote annotation"><AlignLeft className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-gray-600 mx-1" />
              <button onClick={() => applyFormat('code', true)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer" title="Single Code segment"><Code className="h-4 w-4" /></button>
              <button onClick={() => applyFormat('codeblock', true)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer" title="Code block macro"><SquareSlash className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={sendReply} className="flex flex-col">
              <textarea 
                ref={threadInputRef}
                value={threadReply}
                onChange={handleThreadTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (threadReply.trim()) {
                      sendReply(e as any);
                    }
                  }
                }}
                placeholder="Reply..."
                className="w-full bg-transparent border-none pl-4 pr-12 py-3 text-sm text-gray-200 focus:outline-none focus:ring-0 resize-none min-h-[80px]"
              />
              <div className="px-3 pb-2 flex items-center justify-between mt-2">
                <div className="flex items-center text-xs text-gray-400">
                  <label className="flex items-center cursor-pointer hover:text-gray-300">
                    <input type="checkbox" className="mr-2 rounded border-gray-600 bg-[#1A1D21] text-blue-500 focus:ring-blue-500" />
                    Also send to {channel.isPrivate ? <Lock className="h-3 w-3 mx-1" /> : <Hash className="h-3 w-3 mx-1" />} {channel.name}
                  </label>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button type="button" className="mr-2 flex items-center justify-center h-6 w-6 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer"><Plus className="h-4 w-4" /></button>
                  <button type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer"><Type className="h-4 w-4" /></button>
                  
                  {/* Thread Reply Emoji Deluxe Trigger */}
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setShowThreadEmojiPicker(!showThreadEmojiPicker)}
                      className={`p-1.5 hover:text-yellow-400 transition rounded cursor-pointer ${showThreadEmojiPicker ? 'bg-gray-700 text-yellow-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'}`}
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                    {showThreadEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-3 z-[1000]">
                        <EmojiDeluxe 
                          onSelect={(emoji) => {
                            setThreadReply(prev => prev + emoji);
                            setShowThreadEmojiPicker(false);
                          }} 
                          onClose={() => setShowThreadEmojiPicker(false)} 
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    type="button" 
                    onClick={() => openMentionPicker(true)}
                    className={`p-1.5 rounded cursor-pointer transition ${showThreadMentionsList ? 'bg-blue-600/10 text-blue-400' : 'text-gray-405 hover:text-gray-200 hover:bg-gray-700'}`}
                    title="Mention team member"
                  >
                    <AtSign className="h-4 w-4" />
                  </button>
                  <button type="button" className="p-1.5 text-gray-405 hover:text-gray-200 hover:bg-gray-700 rounded cursor-pointer"><MoreHorizontal className="h-4 w-4" /></button>
                  
                  <div className="flex rounded overflow-hidden ml-1">
                    <button 
                      type="submit" 
                      disabled={!threadReply.trim()}
                      className="px-3 py-1.5 text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition-colors flex items-center justify-center font-bold text-xs"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-green-800" />
                    <button type="button" disabled={!threadReply.trim()} className="px-1 py-1.5 text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition-colors flex items-center justify-center cursor-pointer">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
