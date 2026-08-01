import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context';
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
import { EmojiDeluxe } from '../EmojiDeluxe';

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
  const { channels, users, messages, setMessages, drafts, setDrafts, currentUser, activeHuddle, startGlobalHuddle, endGlobalHuddle, toggleHuddleMic } = useWorkspace();
  const channel = channels.find(c => c.id === channelId);
  const draft = drafts.find(d => d.channelId === channelId);
  
  const [newMessage, setNewMessage] = useState(draft?.text || '');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadReply, setThreadReply] = useState('');
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<number>(5);
  
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

  // Huddle call controls (using global state now)

  // Jump to Date Trigger
  const [showJumpToDateDropdown, setShowJumpToDateDropdown] = useState(false);

  React.useEffect(() => {
    if (activeThreadId) {
      const threadDraft = drafts.find(d => d.threadId === activeThreadId);
      setThreadReply(threadDraft?.text || '');
    } else {
      setThreadReply('');
    }
    setVisibleRepliesCount(5);
  }, [activeThreadId]);

  React.useEffect(() => {
    const handleOpenThread = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.messageId) {
        const mainMsg = messages.find(m => m.id === detail.messageId || m.replies.some(r => r.id === detail.messageId));
        if (mainMsg && mainMsg.channelId === channelId) {
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
    if (mId) {
      const mainMsg = messages.find(m => m.id === mId || m.replies.some(r => r.id === mId));
      if (mainMsg && mainMsg.channelId === channelId) {
        setActiveThreadId(mainMsg.id);
      }
    }
  }, [channelId, messages]);

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
  const threadInputRef = useRef<HTMLTextAreaElement>(null);
  
  const handleThreadTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setThreadReply(text);
    
    // Check cursor position for autocomplete mention query
    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = text.substring(0, selectionStart);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
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
    
    // Check cursor position for autocomplete mention query
    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = text.substring(0, selectionStart);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
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

  // Channel members list calculation
  const channelUsers = React.useMemo(() => {
    return users.filter(usr => {
      if (channelId === '1') return true; // #abdallah-sayed-communication-channel
      if (usr.role === 'Super Admin' || usr.role === 'Admin') return true;
      return !usr.channelIds || usr.channelIds.includes(channelId);
    });
  }, [users, channelId]);

  // Global user list matched mentions for main compose
  const filteredMentionUsers = React.useMemo(() => {
    if (!showMentionsList) return [];
    if (!mentionQuery) return users;
    const q = mentionQuery.toLowerCase();
    return users.filter(usr => 
      usr.name.toLowerCase().includes(q) || 
      (usr.username && usr.username.toLowerCase().includes(q))
    );
  }, [users, showMentionsList, mentionQuery]);

  // Global user list matched mentions for thread compose
  const filteredThreadMentionUsers = React.useMemo(() => {
    if (!showThreadMentionsList) return [];
    if (!threadMentionQuery) return users;
    const q = threadMentionQuery.toLowerCase();
    return users.filter(usr => 
      usr.name.toLowerCase().includes(q) || 
      (usr.username && usr.username.toLowerCase().includes(q))
    );
  }, [users, showThreadMentionsList, threadMentionQuery]);

  const channelMessages = messages.filter(m => m.channelId === channelId);
  const activeThread = messages.find(m => m.id === activeThreadId);

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
      const senderAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName.replace(/\s+/g, '')}`;

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
        const rAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${rSenderName.replace(/\s+/g, '')}`;

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

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const message = {
      id: `msg_${Date.now()}`,
      channelId,
      senderId: currentUser.id,
      text: newMessage,
      timestamp: Date.now(),
      isRead: true,
      replies: []
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setDrafts(drafts.filter(d => d.channelId !== channelId));
  };

  const sendVoiceNoteMessage = () => {
    if (!currentUser) return;
    const voiceText = `🎤 Voice Note (${formatTime(audioRecordingTime)})  \n*Listen to the voice memo from ${currentUser.name}.*`;
    
    const message = {
      id: `msg_voice_${Date.now()}`,
      channelId,
      senderId: currentUser.id,
      text: voiceText,
      timestamp: Date.now(),
      isRead: true,
      replies: []
    };

    setMessages([...messages, message]);
    setIsRecordingAudio(false);
    setAudioRecordingTime(0);
    setIsAudioPaused(false);
  };

  const sendVideoClipMessage = () => {
    if (!currentUser) return;
    const videoText = `📹 Camera Video Clip (${formatTime(videoRecordingTime)})  \n*Recorded media attachment from ${currentUser.name}.*`;
    
    const message = {
      id: `msg_video_${Date.now()}`,
      channelId,
      senderId: currentUser.id,
      text: videoText,
      timestamp: Date.now(),
      isRead: true,
      replies: []
    };

    setMessages([...messages, message]);
    setIsRecordingVideo(false);
    setVideoRecordingTime(0);
  };

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadReply.trim() || !currentUser || !activeThreadId) return;

    const reply = {
      id: `reply_${Date.now()}`,
      senderId: currentUser.id,
      text: threadReply,
      timestamp: Date.now(),
      isRead: true
    };

    setMessages(messages.map(m => 
      m.id === activeThreadId 
        ? { ...m, replies: [...m.replies, reply] }
        : m
    ));
    setThreadReply('');
    setDrafts(drafts.filter(d => d.threadId !== activeThreadId));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const handleCreateDocumentAttachment = () => {
    setNewMessage(prev => prev + ` \n📄 [Document Attachment: whitepaper_draft.pdf] `);
  };

  if (!channel) {
    return <div className="p-8 text-gray-500">Channel not found</div>;
  }

  return (
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
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
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sender?.name || "A"}&backgroundColor=b6e3f4`} 
                            alt={sender?.name} 
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline mb-1">
                            <span className="font-bold text-sm text-gray-200 hover:underline cursor-pointer mr-2.5 shrink-0">
                              {sender?.name}
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
                                       <img 
                                         src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${replier?.name || "X"}&backgroundColor=b6e3f4`} 
                                         alt="" 
                                         referrerPolicy="no-referrer"
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

        {/* DELIVERABLE SLACK-STYLE REFACTOR RICH TEXT EDITOR INPUT CONTAINER */}
        <div className="mx-6 mb-6 mt-1 bg-[#1A1D21] border border-gray-700/80 rounded-lg overflow-hidden flex flex-col focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 shadow-xl relative">
          
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

          {/* Autocomplete User Mentions Select Overlay Popup */}
          {showMentionsList && filteredMentionUsers.length > 0 && (
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
                    <img className="h-5 w-5 rounded-full object-cover bg-gray-700 shrink-0" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${usr.name.replace(/\s+/g, '')}`} alt="" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5Packed">
                        <span className="font-semibold truncate text-gray-200 hover:text-white flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${usr.role === 'Super Admin' || usr.id === '8' ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                          {usr.name}
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
            <textarea 
              ref={channelInputRef}
              value={newMessage}
              onChange={(e: any) => handleTextChange(e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newMessage.trim()) {
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
                    onClick={handleCreateDocumentAttachment}
                    className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
                    title="Add computer files"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
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
                  onClick={() => setShowMentionsList(!showMentionsList)}
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

                                setMessages([...messages, botMessage]);
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
            <button 
              onClick={() => setShowMembersDrawer(false)} 
              className="text-gray-500 hover:text-white transition cursor-pointer p-1 rounded hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-blue-600/10 p-3 rounded-lg border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
              Super Admins, Admins, and members explicitly assigned access are shown here.
            </div>
            
            <div className="space-y-3">
              {channelUsers.map(usr => (
                <div key={usr.id} className="flex items-center justify-between p-2 hover:bg-[#1A1D21] rounded-xl transition-all border border-transparent hover:border-gray-800/60">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img 
                      className="w-9 h-9 rounded-full border border-gray-800 bg-gray-700 object-cover" 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${usr.name.replace(/\s+/g, '')}`} 
                      alt="" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-200 truncate">{usr.name}</p>
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

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Original Message */}
            <div className="relative group flex mb-6 border-b border-gray-800 pb-6 hover:bg-[#2A2B32]/30 p-2 -mx-2 rounded transition-colors">
              <div className="h-10 w-10 bg-gray-700 rounded mr-3 shrink-0 overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${users.find(u => u.id === activeThread.senderId)?.name || "Z"}&backgroundColor=b6e3f4`} 
                  alt="" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline mb-1">
                  <span className="font-bold text-gray-200 mr-2">{users.find(u => u.id === activeThread.senderId)?.name}</span>
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
                <div key={reply.id} className="relative group flex hover:bg-[#2A2B32]/30 p-2 -mx-2 rounded transition-colors mt-2">
                  <div className="h-8 w-8 bg-gray-700 rounded mr-3 shrink-0 overflow-hidden">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${replier?.name || "Y"}&backgroundColor=b6e3f4`} 
                      alt="" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline mb-1">
                      <span className="font-bold text-gray-200 text-sm mr-2">{replier?.name}</span>
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
          <div className="mx-4 mb-4 bg-[#1A1D21] border border-gray-700 rounded-lg overflow-hidden flex flex-col focus-within:border-gray-500 relative animate-fade-in">
            {/* Thread Autocomplete User Mentions Select Overlay Popup */}
            {showThreadMentionsList && filteredThreadMentionUsers.length > 0 && (
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
                      <img className="h-5 w-5 rounded-full object-cover bg-gray-700 shrink-0" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${usr.name.replace(/\s+/g, '')}`} alt="" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate text-gray-200 hover:text-white flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${usr.role === 'Super Admin' || usr.id === '8' ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                            {usr.name}
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
                    onClick={() => setShowThreadMentionsList(!showThreadMentionsList)}
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
  );
}
