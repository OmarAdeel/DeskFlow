import { 
  Search, MessageSquare, Send, Phone, Video, MoreVertical, 
  Smile, Check, X, Bold, Italic, Strikethrough, Link as LinkIcon, 
  ListOrdered, List, AlignLeft, Code, SquareSlash, Plus, Type, 
  AtSign, ChevronDown, CheckCircle2, Mic, MicOff, VideoOff, PhoneOff, MonitorUp, Volume2, ArrowLeft
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../context';
import { EmojiDeluxe } from '../EmojiDeluxe';
import { FormattedMessage } from '../FormattedMessage';

interface DMReply {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  reactions: string[];
}

interface DMMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  reactions: string[];
  replies: DMReply[];
}

export function DMsView({ userId }: { userId?: string }) {
  const { users, currentUser } = useWorkspace();

  const systemUsers = users.map((u, index) => ({
    id: u.id,
    name: u.name,
    role: u.title || u.role || 'Team Member',
    online: u.name === 'Abdallah Sayed' ? true : index % 2 === 0,
    lastSeen: index % 3 === 0 ? 'Now' : `${index + 1}h ago`,
    unread: index === 0 ? 2 : index === 3 ? 1 : 0,
    avatarSeed: u.name
  }));

  const [selectedUser, setSelectedUser] = useState<typeof systemUsers[0]>(() => {
    if (userId) {
      const match = systemUsers.find(u => u.id === userId);
      if (match) return match;
    }
    const filtered = systemUsers.filter(u => u.name !== 'Abdallah Sayed');
    return filtered[0] || systemUsers[0];
  });

  const [mobileShowChat, setMobileShowChat] = useState<boolean>(Boolean(userId));

  useEffect(() => {
    if (userId) {
      const match = systemUsers.find(u => u.id === userId);
      if (match) {
        setSelectedUser(match);
        setActiveThreadId(null);
        setMobileShowChat(true);
      }
    }
  }, [userId, users]);

  const [userSearch, setUserSearch] = useState('');
  const [dmText, setDmText] = useState('');
  const [threadReply, setThreadReply] = useState('');
  
  // Staging Drafts per user so typing states are not lost
  const [dmDrafts, setDmDrafts] = useState<Record<string, string>>({});
  const [threadDrafts, setThreadDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    // Save current draft before switching users
    setDmText(dmDrafts[selectedUser.id] || '');
  }, [selectedUser.id]);

  const handleDmTextChange = (text: string) => {
    setDmText(text);
    setDmDrafts(prev => ({ ...prev, [selectedUser.id]: text }));
  };

  const handleThreadReplyChange = (text: string) => {
    setThreadReply(text);
    if (activeThreadId) {
      setThreadDrafts(prev => ({ ...prev, [activeThreadId]: text }));
    }
  };

  const [showMentionsList, setShowMentionsList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showThreadMentionsList, setShowThreadMentionsList] = useState(false);
  const [threadMentionQuery, setThreadMentionQuery] = useState('');

  const filteredMentionUsers = React.useMemo(() => {
    if (!showMentionsList) return [];
    if (!mentionQuery) return users;
    const q = mentionQuery.toLowerCase();
    return users.filter(usr => 
      usr.name.toLowerCase().includes(q) || 
      (usr.username && usr.username.toLowerCase().includes(q))
    );
  }, [users, showMentionsList, mentionQuery]);

  const filteredThreadMentionUsers = React.useMemo(() => {
    if (!showThreadMentionsList) return [];
    if (!threadMentionQuery) return users;
    const q = threadMentionQuery.toLowerCase();
    return users.filter(usr => 
      usr.name.toLowerCase().includes(q) || 
      (usr.username && usr.username.toLowerCase().includes(q))
    );
  }, [users, showThreadMentionsList, threadMentionQuery]);

  const handleDmTextChangeCursor = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDmText(text);
    setDmDrafts(prev => ({ ...prev, [selectedUser.id]: text }));

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
  };

  const handleThreadReplyChangeCursor = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setThreadReply(text);
    if (activeThreadId) {
      setThreadDrafts(prev => ({ ...prev, [activeThreadId]: text }));
    }

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
  };

  const handleMentionSelect = (username: string, isThread: boolean = false) => {
    const ref = isThread ? threadInputRef : dmInputRef;
    if (!ref.current) return;
    const start = ref.current.selectionStart || 0;
    const currentText = isThread ? threadReply : dmText;
    
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
        setDmText(updatedText);
        setDmDrafts(prev => ({ ...prev, [selectedUser.id]: updatedText }));
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

  // Emojis and popups toggling
  const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false);
  const [showThreadEmojiPicker, setShowThreadEmojiPicker] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [dmPickerPlacement, setDmPickerPlacement] = useState<'top' | 'bottom'>('top');
  
  // Active Thread pane states
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<number>(5);

  const dmInputRef = useRef<HTMLTextAreaElement>(null);
  const threadInputRef = useRef<HTMLTextAreaElement>(null);

  // Audio & Video Calling State
  const [activeCall, setActiveCall] = useState<{
    mode: 'audio' | 'video';
    user: typeof systemUsers[0];
  } | null>(null);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallVideoOff, setIsCallVideoOff] = useState(false);
  const [isCallScreenSharing, setIsCallScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const callVideoRef = useRef<HTMLVideoElement>(null);
  const callTimerRef = useRef<number | null>(null);

  const handleStartCall = async (mode: 'audio' | 'video') => {
    setActiveCall({ mode, user: selectedUser });
    setIsCallMuted(false);
    setIsCallVideoOff(mode === 'audio');
    setIsCallScreenSharing(false);
    setCallDuration(0);

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = window.setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: mode === 'video',
          audio: true
        });
        setMediaStream(stream);
      }
    } catch (err) {
      console.warn("Could not acquire camera/microphone stream:", err);
    }
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    if (activeCall) {
      const durationStr = formatCallDuration(callDuration);
      const modeLabel = activeCall.mode === 'video' ? '📹 Video call' : '📞 Audio call';
      const logMessage: DMMessage = {
        id: `call_log_${Date.now()}`,
        senderId: currentUser?.id || '8',
        senderName: 'You',
        text: `${modeLabel} ended • Duration ${durationStr}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        reactions: [],
        replies: []
      };

      setConversations(prev => ({
        ...prev,
        [activeCall.user.id]: [...(prev[activeCall.user.id] || []), logMessage]
      }));
    }

    setActiveCall(null);
  };

  useEffect(() => {
    if (mediaStream && callVideoRef.current && !isCallVideoOff) {
      callVideoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, isCallVideoOff, activeCall]);

  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    };
  }, [mediaStream]);

  // Default rich DM conversations for all workspace users
  const defaultDMConversations: Record<string, DMMessage[]> = React.useMemo(() => ({
    '1': [
      {
        id: 'msg_dm_1_1',
        senderId: '1',
        senderName: 'Esraa Al Barsiky',
        text: 'Hey Abdallah! Are we still on track for the system integration deployment today?',
        timestamp: '10:42 AM',
        isMe: false,
        reactions: ['🚀'],
        replies: [
          {
            id: 'rep_1_1',
            senderId: '8',
            senderName: 'You',
            text: 'Yes! The server deployment blueprints are all fully verified.',
            timestamp: '10:44 AM',
            reactions: []
          }
        ]
      },
      {
        id: 'msg_dm_1_2',
        senderId: '8',
        senderName: 'You',
        text: 'The API Gateways are validated. I have opened the monitoring dashboard.',
        timestamp: '10:45 AM',
        isMe: true,
        reactions: [],
        replies: []
      }
    ],
    '2': [
      {
        id: 'msg_dm_2_1',
        senderId: '2',
        senderName: 'Esraa Soliman',
        text: 'Could you review the marketing copy Draft for our main product features?',
        timestamp: 'Yesterday',
        isMe: false,
        reactions: ['👍'],
        replies: []
      },
      {
        id: 'msg_dm_2_2',
        senderId: '8',
        senderName: 'You',
        text: 'Sure, send over the link and I will approve it immediately.',
        timestamp: 'Yesterday',
        isMe: true,
        reactions: [],
        replies: []
      }
    ],
    '3': [
      {
        id: 'msg_dm_3_1',
        senderId: '3',
        senderName: 'Mohamed Alaa',
        text: 'The memory leaks in the telemetry engine are solved. Pull request is ready.',
        timestamp: '2 hours ago',
        isMe: false,
        reactions: ['🔥'],
        replies: []
      }
    ],
    '4': [
      {
        id: 'msg_dm_4_1',
        senderId: '4',
        senderName: 'Mohammed Dwidar',
        text: 'Let me know if you need any help with the balance sheet reconciliation.',
        timestamp: '1:15 PM',
        isMe: false,
        reactions: [],
        replies: []
      }
    ],
    '5': [
      {
        id: 'msg_dm_5_1',
        senderId: '5',
        senderName: 'Omar Adel',
        text: 'Structured schema and definitions are indexed on the local drives.',
        timestamp: 'Thursday',
        isMe: false,
        reactions: [],
        replies: []
      }
    ],
    '6': [
      {
        id: 'msg_dm_6_1',
        senderId: '6',
        senderName: 'Salma Sabeb',
        text: 'All QA regression test suites passed with zero critical bugs on the main branch.',
        timestamp: 'Yesterday',
        isMe: false,
        reactions: ['✅'],
        replies: []
      },
      {
        id: 'msg_dm_6_2',
        senderId: '8',
        senderName: 'You',
        text: '📊 OFFICIAL WORKSPACE KPI REPORT FOR SALMA SABEB\n• Total Messages Created: 890 msgs\n• Avg Response Speed: 12.0 min SLA\n• Tasks Dealt With: 31 completed\n• Rating: 94% (Grade A)',
        timestamp: 'Yesterday',
        isMe: true,
        reactions: ['⭐'],
        replies: []
      }
    ],
    '7': [
      {
        id: 'msg_dm_7_1',
        senderId: '7',
        senderName: 'Shaza Ibrahim',
        text: 'I have published the requirement documentation for the accounting service module.',
        timestamp: '3 days ago',
        isMe: false,
        reactions: ['📚'],
        replies: []
      }
    ],
    '8': [
      {
        id: 'msg_dm_8_1',
        senderId: '8',
        senderName: 'Abdallah Sayed',
        text: 'Good morning! Here is the overall workspace KPI breakdown and SLA metrics for executive review.',
        timestamp: '9:00 AM',
        isMe: false,
        reactions: ['👑'],
        replies: []
      },
      {
        id: 'msg_dm_8_2',
        senderId: '8',
        senderName: 'You',
        text: `📊 OFFICIAL WORKSPACE KPI & TIME PERFORMANCE REPORT FOR ABDALLAH SAYED
--------------------------------------------------
👤 Employee: Abdallah Sayed (CEO & Super Admin)
🏢 Primary Department: Executive & System Architecture
📅 Evaluation Period: Monthly KPI
--------------------------------------------------

1️⃣ 💬 Messages Created & Activity:
• Total Messages Created: 2,450 messages logged across channels
• Technical & Ops Threads Resolved: 48 active discussions closed

2️⃣ ⚡ Response Speed & Time SLA:
• Average Time to Respond: 8.4 minutes (Top SLA performance bracket)
• Peak Productivity Window: 09:00 AM - 12:30 PM
• Daily Active Working Time: 8.5 hrs / day average

3️⃣ 📋 Tasks & Execution SLA:
• Total Tasks Dealt With: 52 tasks completed
• Punctuality SLA Delivery Rate: 99.2% on-time completion

4️⃣ 🏢 Departments Dealt With:
• Departments Dealt With: Engineering (40%), Finance (25%), Operations (20%), Executive (15%)

5️⃣ 🏆 Overall KPI Rating & Recognition:
• Performance Score: 98% (Grade A+)
• CSAT Team Rating: 4.95 / 5.0 ★`,
        timestamp: '9:05 AM',
        isMe: true,
        reactions: ['🔥', '🚀'],
        replies: []
      },
      {
        id: 'msg_dm_8_3',
        senderId: '8',
        senderName: 'Abdallah Sayed',
        text: 'Thanks for generating this complete analysis report. The SLA time and department distribution look great!',
        timestamp: '9:12 AM',
        isMe: false,
        reactions: ['🙌'],
        replies: []
      }
    ],
    'user_ab_muhammad': [
      {
        id: 'msg_dm_abm_1',
        senderId: 'user_ab_muhammad',
        senderName: 'Abdulrahman Muhammad',
        text: 'Checking in on the project coordination milestones. All deliverables are synced.',
        timestamp: '10:15 AM',
        isMe: false,
        reactions: ['📋'],
        replies: []
      },
      {
        id: 'msg_dm_abm_2',
        senderId: '8',
        senderName: 'You',
        text: '📊 WORKSPACE KPI REPORT FOR ABDULRAHMAN MUHAMMAD\n• Total Messages Created: 1,320 msgs\n• Avg Response Speed: 9.6 min SLA\n• Tasks Dealt With: 42 completed\n• Departments Dealt With: Operations, Project Coordination, QA\n• Performance Score: 96% (Grade A+)',
        timestamp: '10:20 AM',
        isMe: true,
        reactions: ['⭐'],
        replies: []
      }
    ],
    'user_ab_sayed': [
      {
        id: 'msg_dm_abs_1',
        senderId: 'user_ab_sayed',
        senderName: 'Abdulrahman Sayed',
        text: 'The financial audits and balance sheet controls are verified for this quarter.',
        timestamp: 'Yesterday',
        isMe: false,
        reactions: ['💰'],
        replies: []
      },
      {
        id: 'msg_dm_abs_2',
        senderId: '8',
        senderName: 'You',
        text: '📊 WORKSPACE KPI REPORT FOR ABDULRAHMAN SAYED\n• Total Messages Created: 1,180 msgs\n• Avg Response Speed: 10.1 min SLA\n• Tasks Dealt With: 38 completed\n• Departments Dealt With: Finance, Accounting, Executive\n• Performance Score: 97% (Grade A+)',
        timestamp: 'Yesterday',
        isMe: true,
        reactions: ['👍'],
        replies: []
      }
    ],
    'user_kh_elsayed': [
      {
        id: 'msg_dm_kh_1',
        senderId: 'user_kh_elsayed',
        senderName: 'Khaled El Sayed',
        text: 'Tax reconciliation summaries are posted in the Accounting BA folder.',
        timestamp: 'Monday',
        isMe: false,
        reactions: ['📊'],
        replies: []
      }
    ],
    'user_ya_hassanien': [
      {
        id: 'msg_dm_ya_1',
        senderId: 'user_ya_hassanien',
        senderName: 'Yasin Hassanien',
        text: 'Engineering team review complete. All microservices are healthy.',
        timestamp: '11:45 AM',
        isMe: false,
        reactions: ['⚙️'],
        replies: []
      }
    ],
    'user_mo_radwan': [
      {
        id: 'msg_dm_mo_1',
        senderId: 'user_mo_radwan',
        senderName: 'Moataz Radwan',
        text: 'Financial forecast model updated with latest client metrics.',
        timestamp: '2 days ago',
        isMe: false,
        reactions: ['📈'],
        replies: []
      }
    ]
  }), []);

  // Load and store persistent DM conversations safely
  const [conversations, setConversations] = useState<Record<string, DMMessage[]>>(() => {
    const saved = localStorage.getItem('demo_conversations');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return { ...defaultDMConversations, ...parsed };
      } catch (e) { 
        console.error(e); 
      }
    }
    return defaultDMConversations;
  });

  // Re-sync conversations from localStorage whenever selected user / userId changes
  useEffect(() => {
    const saved = localStorage.getItem('demo_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(prev => ({ ...defaultDMConversations, ...parsed }));
      } catch (e) {
        console.error(e);
      }
    }
  }, [userId, selectedUser.id]);

  useEffect(() => {
    localStorage.setItem('demo_conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Filter users by search
  const filteredUsers = systemUsers.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Dynamic fallback generator if messages array is somehow empty for a user
  const getFallbackMessages = (usr: typeof systemUsers[0]): DMMessage[] => {
    return [
      {
        id: `fallback_1_${usr.id}`,
        senderId: usr.id,
        senderName: usr.name,
        text: `Hello! I have updated my workspace activity log and task metrics for this week.`,
        timestamp: '9:30 AM',
        isMe: false,
        reactions: ['👋'],
        replies: []
      },
      {
        id: `fallback_2_${usr.id}`,
        senderId: '8',
        senderName: 'You',
        text: `📊 OFFICIAL WORKSPACE KPI & TIME REPORT FOR ${usr.name.toUpperCase()}\n\n• Messages Created: 1,150 msgs logged\n• Avg Response Speed: 10.4 min SLA\n• Tasks Dealt With: 36 completed (97.5% punctuality rate)\n• Departments Dealt With: ${usr.role}, Operations, Engineering\n• Performance Rating: 95% (Grade A+)`,
        timestamp: '9:35 AM',
        isMe: true,
        reactions: ['⭐'],
        replies: []
      },
      {
        id: `fallback_3_${usr.id}`,
        senderId: usr.id,
        senderName: usr.name,
        text: `Thank you for sending over this detailed KPI report message!`,
        timestamp: '9:40 AM',
        isMe: false,
        reactions: [],
        replies: []
      }
    ];
  };

  const currentMsgs = conversations[selectedUser.id];
  const activeMessages = (currentMsgs && currentMsgs.length > 0)
    ? currentMsgs
    : (defaultDMConversations[selectedUser.id] || getFallbackMessages(selectedUser));

  const activeThread = activeMessages.find(m => m.id === activeThreadId);

  useEffect(() => {
    if (activeThreadId) {
      setThreadReply(threadDrafts[activeThreadId] || '');
    }
  }, [activeThreadId]);

  // Apply Rich formatting styles
  const applyFormat = (type: string, isThread: boolean) => {
    const ref = isThread ? threadInputRef : dmInputRef;
    if (!ref.current) return;
    
    const start = ref.current.selectionStart;
    const end = ref.current.selectionEnd;
    const currentText = isThread ? threadReply : dmText;
    
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
      handleThreadReplyChange(newText);
    } else {
      handleDmTextChange(newText);
    }
    
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  // Send primary DM
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dmText.trim()) return;

    const newMsg: DMMessage = {
      id: `new_dm_${Date.now()}`,
      senderId: currentUser?.id || '8',
      senderName: 'You',
      text: dmText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      reactions: [],
      replies: []
    };

    setConversations(prev => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), newMsg]
    }));
    
    // Clear typing and draft
    setDmText('');
    setDmDrafts(prev => ({ ...prev, [selectedUser.id]: '' }));
    setShowMainEmojiPicker(false);
  };

  // Send Thread reply inside DM
  const handleSendThreadReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!threadReply.trim() || !activeThreadId) return;

    const reply: DMReply = {
      id: `dm_reply_${Date.now()}`,
      senderId: currentUser?.id || '8',
      senderName: 'You',
      text: threadReply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: []
    };

    setConversations(prev => {
      const msgs = prev[selectedUser.id] || [];
      const updated = msgs.map(m => {
        if (m.id === activeThreadId) {
          return {
            ...m,
            replies: [...(m.replies || []), reply]
          };
        }
        return m;
      });
      return {
        ...prev,
        [selectedUser.id]: updated
      };
    });

    setThreadReply('');
    setThreadDrafts(prev => ({ ...prev, [activeThreadId]: '' }));
    setShowThreadEmojiPicker(false);
  };

  // Toggle Reactions on message or reply inside DM
  const handleToggleReactionMessage = (msgId: string, emoji: string) => {
    setConversations(prev => {
      const msgs = prev[selectedUser.id] || [];
      const updated = msgs.map(m => {
        if (m.id === msgId) {
          const current = m.reactions || [];
          const isAlreadySelected = current.includes(emoji);
          const nextReactions = isAlreadySelected ? [] : [emoji];
          return { ...m, reactions: nextReactions };
        }
        return m;
      });
      return {
        ...prev,
        [selectedUser.id]: updated
      };
    });
    setActiveReactionMessageId(null);
  };

  const handleToggleReactionReply = (msgId: string, replyId: string, emoji: string) => {
    setConversations(prev => {
      const msgs = prev[selectedUser.id] || [];
      const updated = msgs.map(m => {
        if (m.id === msgId) {
          const updatedReplies = (m.replies || []).map(r => {
            if (r.id === replyId) {
              const current = r.reactions || [];
              const isAlreadySelected = current.includes(emoji);
              const nextReactions = isAlreadySelected ? [] : [emoji];
              return { ...r, reactions: nextReactions };
            }
            return r;
          });
          return { ...m, replies: updatedReplies };
        }
        return m;
      });
      return {
        ...prev,
        [selectedUser.id]: updated
      };
    });
  };

  return (
    <div className="flex-1 bg-[#1A1D21] flex h-full text-gray-300 w-full relative overflow-hidden select-none">
      
      {/* 1. Left User Selection List Panel */}
      <div className={`w-full md:w-[300px] border-r border-gray-800 flex-col bg-[#121317] shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-gray-100 mb-3">Direct Messages</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search coworkers..." 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-[#1A1D21] text-xs text-gray-300 rounded-lg pl-9 pr-3 py-2 border border-gray-800 focus:outline-none focus:border-gray-600 transition"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredUsers.map(user => {
            const isSel = selectedUser.id === user.id;
            return (
              <div 
                key={user.id} 
                onClick={() => {
                  setSelectedUser(user);
                  setShowMainEmojiPicker(false);
                  setActiveReactionMessageId(null);
                  setActiveThreadId(null);
                  setMobileShowChat(true);
                }}
                className={`p-3 border-b border-gray-800/40 hover:bg-[#2A2B32]/30 cursor-pointer transition-colors relative ${isSel ? 'bg-[#2A2B32]/80 font-semibold text-white' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-md bg-[#2A2B32] font-mono font-bold flex items-center justify-center text-blue-400 border border-gray-700 shrink-0 relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=b6e3f4`} alt="" className="w-full h-full rounded" />
                    {user.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#121317]"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs truncate text-gray-200">
                        {user.name} {user.name === 'Abdallah Sayed' && '(you)'}
                      </span>
                      {user.unread > 0 && !isSel && (
                        <span className="bg-red-500 text-[#121317] text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          {user.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{user.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Middle Message Threading Panel */}
      <div className={`flex-1 flex flex-col bg-[#1A1D21] relative h-full transition-all duration-300 ${activeThreadId ? 'md:pr-[380px]' : ''} ${mobileShowChat ? 'flex w-full' : 'hidden md:flex'}`}>
        
        {/* Chat Recipient Header */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-3 md:px-6 bg-[#121317] shrink-0">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
            <button
              onClick={() => setMobileShowChat(false)}
              className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition mr-0.5 cursor-pointer shrink-0"
              title="Back to Direct Messages list"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-9 h-9 rounded bg-[#2A2B32] border border-gray-700 relative overflow-hidden shrink-0">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}&backgroundColor=b6e3f4`} alt="" />
              {selectedUser.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#121317]"></div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-100 text-sm truncate">{selectedUser.name}</h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 leading-none mt-0.5 truncate">
                {selectedUser.online ? 'Active now' : `Last seen ${selectedUser.lastSeen}`} • {selectedUser.role}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <button 
              onClick={() => handleStartCall('audio')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#121317] hover:bg-emerald-600/20 text-gray-300 hover:text-emerald-400 border border-gray-700 hover:border-emerald-500/40 rounded-lg transition duration-200 cursor-pointer text-xs font-semibold shadow-sm"
              title="Start Audio Call"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>Call</span>
            </button>
            <button 
              onClick={() => handleStartCall('video')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#121317] hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 border border-gray-700 hover:border-blue-500/40 rounded-lg transition duration-200 cursor-pointer text-xs font-semibold shadow-sm"
              title="Start Video Call"
            >
              <Video className="h-3.5 w-3.5 text-blue-400" />
              <span>Video</span>
            </button>
            <div className="w-px h-4 bg-gray-800 mx-1"></div>
            <button className="p-1.5 hover:text-white hover:bg-gray-800 rounded transition duration-200 cursor-pointer"><MoreVertical className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Messaging History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#1A1D21] custom-scrollbar">
          <div className="flex justify-center mb-6">
            <span className="text-[10px] text-gray-400 font-mono bg-gray-950/40 border border-gray-800/80 px-3 py-1 rounded-full">
              SECURE DIRECT CONVERSATION WITH {selectedUser.name.toUpperCase()}
            </span>
          </div>

          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-20">
              <MessageSquare className="h-8 w-8 text-gray-600 mb-2" />
              <p className="text-xs font-mono">No messages yet. Say hello to {selectedUser.name}!</p>
            </div>
          ) : (
            activeMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-start space-x-3 group relative p-2 rounded-lg hover:bg-[#2A2B32]/20 transition-all ${
                  msg.isMe ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* User logo */}
                <div className="w-8 h-8 rounded bg-[#2A2B32] border border-gray-800 overflow-hidden shrink-0 mt-0.5">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.isMe ? currentUser?.name || 'Abdallah Sayed' : selectedUser.name}&backgroundColor=b6e3f4`} alt="" />
                </div>

                <div className="max-w-[70%] min-w-0">
                  <div className={`flex items-baseline space-x-1.5 ${msg.isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <span className="font-bold text-gray-200 text-xs">{msg.isMe ? 'You' : msg.senderName}</span>
                    <span className="text-[9px] text-gray-500 font-mono">{msg.timestamp}</span>
                  </div>

                  <div className={`mt-1 text-xs text-gray-300 leading-relaxed font-sans`}>
                    <FormattedMessage text={msg.text} />
                  </div>

                  {/* Render Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1.5 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      {msg.reactions.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReactionMessage(msg.id, emoji)}
                          title="Click to remove reaction"
                          className="bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-rose-500/10 hover:border-gray-700/60 hover:text-rose-400 rounded-full px-2 py-0.5 text-[11px] transition cursor-pointer select-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Thread Replies snippet */}
                  {msg.replies && msg.replies.length > 0 && (
                    <div 
                      onClick={() => setActiveThreadId(msg.id)}
                      className="mt-2 text-[11px] flex items-center text-blue-400 hover:underline cursor-pointer inline-flex bg-blue-500/5 hover:bg-blue-500/10 px-2 py-1 rounded border border-blue-500/10"
                    >
                      <div className="flex -space-x-1 mr-1.5">
                        {msg.replies.slice(0, 3).map((r, i) => (
                          <div key={i} className="h-4.5 w-4.5 rounded-full overflow-hidden border border-[#1A1D21] bg-gray-600 shrink-0">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.senderName}&backgroundColor=b6e3f4`} alt="" />
                          </div>
                        ))}
                      </div>
                      <span className="font-semibold">{msg.replies.length} replies</span>
                    </div>
                  )}
                </div>

                {/* FLOATING HOVER REACTION & THREAD BAR */}
                <div className={`absolute -top-3.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 ${
                  msg.isMe ? 'left-4' : 'right-4'
                }`}>
                  <div className="relative flex items-center bg-[#121317] border border-gray-800 rounded-md shadow-2xl p-0.5 space-x-1">
                    <button
                      onClick={(e) => {
                        if (activeReactionMessageId !== msg.id) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          if (rect.top < 380) {
                            setDmPickerPlacement('bottom');
                          } else {
                            setDmPickerPlacement('top');
                          }
                        }
                        setActiveReactionMessageId(
                          activeReactionMessageId === msg.id ? null : msg.id
                        );
                      }}
                      title="Add reaction"
                      className="p-1 px-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <Smile className="h-3.5 w-3.5 text-yellow-400" />
                      <span>React</span>
                    </button>

                    <button
                      onClick={() => setActiveThreadId(msg.id)}
                      title="Start thread / Reply"
                      className="p-1 px-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                      <span>Reply</span>
                    </button>

                    {/* Reaction Picker absolute bubble */}
                    {activeReactionMessageId === msg.id && (
                      <div className={`absolute ${dmPickerPlacement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} z-[999] ${
                        msg.isMe ? 'left-0' : 'right-0'
                      }`}>
                        <EmojiDeluxe 
                          onSelect={(emoji) => handleToggleReactionMessage(msg.id, emoji)} 
                          onClose={() => setActiveReactionMessageId(null)} 
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Input area styled with parity */}
        <div className="p-4 bg-[#121317] border-t border-gray-800 shrink-0">
          <div className="bg-[#1A1D21] rounded-lg border border-gray-800/80 focus-within:border-gray-500 transition-colors flex flex-col relative w-full overflow-hidden shadow-sm">
            {/* DM Autocomplete User Mentions Select Overlay Popup */}
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
                      onClick={() => handleMentionSelect(usr.username || usr.name, false)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-805 text-xs text-gray-200 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
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

            {/* Rich formatting options bar */}
            <div className="flex items-center px-2 py-1.5 space-x-0.5 border-b border-gray-800 bg-[#2A2B32]/30">
              <button onClick={() => applyFormat('bold', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
              <button onClick={() => applyFormat('italic', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
              <button onClick={() => applyFormat('strikethrough', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded" title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></button>
              <div className="w-px h-3.5 bg-gray-800 mx-1"></div>
              <button onClick={() => applyFormat('link', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded" title="Add link"><LinkIcon className="h-3.5 w-3.5" /></button>
              <button onClick={() => applyFormat('list-ol', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded" title="Ordered list"><ListOrdered className="h-3.5 w-3.5" /></button>
              <button onClick={() => applyFormat('list-ul', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded" title="Bullet list"><List className="h-3.5 w-3.5" /></button>
              <button onClick={() => applyFormat('quote', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded" title="Quote block"><AlignLeft className="h-3.5 w-3.5" /></button>
              <div className="w-px h-3.5 bg-gray-800 mx-1"></div>
              <button onClick={() => applyFormat('code', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded" title="Code snippet"><Code className="h-3.5 w-3.5" /></button>
              <button onClick={() => applyFormat('codeblock', false)} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded" title="Codeblock"><SquareSlash className="h-3.5 w-3.5" /></button>
            </div>

            {/* textarea editing */}
            <form onSubmit={handleSendMessage} className="flex flex-col">
              <textarea 
                ref={dmInputRef}
                placeholder={`Message ${selectedUser.name}...`}
                value={dmText}
                onChange={handleDmTextChangeCursor}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="bg-transparent text-gray-200 px-4 py-3 min-h-[60px] max-h-32 resize-none focus:outline-none focus:ring-0 text-xs leading-relaxed"
                rows={2}
              ></textarea>
              
              <div className="flex justify-between items-center px-3 pb-2 border-t border-gray-800 pt-2 bg-[#1A1D21]">
                <div className="flex items-center space-x-1.5 relative">
                  <button type="button" className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-750 text-gray-300 hover:bg-gray-700 hover:text-white transition"><Plus className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 text-gray-400 hover:text-gray-200 rounded hover:bg-gray-850"><Type className="h-3.5 w-3.5" /></button>
                  
                  {/* Emoji deluxe popup */}
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setShowMainEmojiPicker(!showMainEmojiPicker)}
                      className={`p-1.5 hover:text-yellow-405 transition rounded ${showMainEmojiPicker ? 'bg-gray-850 text-yellow-400' : 'text-gray-400 hover:text-gray-200'}`}
                      title="Insert emoji template"
                    >
                      <Smile className="h-3.5 w-3.5" />
                    </button>
                    {showMainEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-3 z-[1000]">
                        <EmojiDeluxe 
                          onSelect={(emoji) => {
                            handleDmTextChange(dmText + emoji);
                            setShowMainEmojiPicker(false);
                          }} 
                          onClose={() => setShowMainEmojiPicker(false)} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Mention selector button */}
                  <button 
                    type="button" 
                    onClick={() => setShowMentionsList(!showMentionsList)}
                    className={`p-1.5 rounded cursor-pointer transition ${showMentionsList ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-850'}`}
                    title="Mention team member"
                  >
                    <AtSign className="h-3.5 w-3.5" />
                  </button>

                  <span className="text-[10px] text-gray-500 font-mono select-none">Rich Text & Emoji Deluxe™ Enabled</span>
                </div>

                <button 
                  type="submit"
                  disabled={!dmText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-[#121317] disabled:bg-gray-800 disabled:text-gray-500 disabled:opacity-50 hover:shadow-lg p-1.5 px-3 rounded-md transition font-semibold text-[11px] flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* 3. Thread Sidebar Panel inside DMsView */}
      {activeThreadId && activeThread && (
        <div className="absolute inset-y-2 inset-x-2 md:top-4 md:right-4 md:bottom-4 md:left-auto md:w-[360px] max-w-full flex flex-col bg-[#121317] border border-gray-800 rounded-xl shadow-2xl z-30 animate-fade-in-left">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-800">
            <div>
              <h3 className="font-bold text-gray-100 text-sm">Thread</h3>
              <p className="text-[10px] text-gray-500 font-mono">Conversation with {selectedUser.name}</p>
            </div>
            <button onClick={() => setActiveThreadId(null)} className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-gray-800 transition">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Original message inside thread */}
            <div className="relative group flex items-start space-x-3 border-b border-gray-850 pb-4 hover:bg-[#2A2B32]/10 p-2 -mx-2 rounded transition-colors">
              <div className="h-7.5 w-7.5 rounded overflow-hidden bg-[#2A2B32] border border-gray-800 shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeThread.isMe ? currentUser?.name || 'Abdallah Sayed' : selectedUser.name}&backgroundColor=b6e3f4`} alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline mb-0.5">
                  <span className="font-bold text-gray-200 text-xs">{activeThread.isMe ? 'You' : activeThread.senderName}</span>
                  <span className="text-[9px] text-gray-500 ml-2 font-mono">{activeThread.timestamp}</span>
                </div>
                <div className="text-xs text-gray-300 leading-relaxed"><FormattedMessage text={activeThread.text} /></div>
                
                {/* Reactions on original inside thread */}
                {activeThread.reactions && activeThread.reactions.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {activeThread.reactions.map(emoji => (
                      <span key={emoji} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-[10px] select-none">
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Replies List */}
            {activeThread.replies && activeThread.replies.length > visibleRepliesCount && (
              <div className="flex justify-center my-2 border-b border-gray-850 pb-2">
                <button
                  type="button"
                  onClick={() => setVisibleRepliesCount(prev => prev + 10)}
                  className="px-3 py-1 text-[10px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/15 border border-blue-500/15 rounded-full transition cursor-pointer"
                >
                  Show previous ({activeThread.replies.length - visibleRepliesCount} remaining)
                </button>
              </div>
            )}

            {activeThread.replies && activeThread.replies.slice(Math.max(0, activeThread.replies.length - visibleRepliesCount)).map((reply) => {
              const isReplyMe = reply.senderId === (currentUser?.id || '8');
              return (
                <div key={reply.id} className="relative group flex items-start space-x-2.5 hover:bg-[#2A2B32]/10 p-2 -mx-2 rounded transition-colors mt-2">
                  <div className="h-7 w-7 rounded overflow-hidden bg-[#2A2B32] border border-gray-800 shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isReplyMe ? currentUser?.name || 'Abdallah Sayed' : selectedUser.name}&backgroundColor=b6e3f4`} alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline mb-0.5">
                      <span className="font-bold text-gray-200 text-[11px]">{isReplyMe ? 'You' : reply.senderName}</span>
                      <span className="text-[8px] text-gray-500 ml-2 font-mono">{reply.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-gray-300 leading-relaxed"><FormattedMessage text={reply.text} /></div>
                    
                    {/* Render Reply Reactions */}
                    {reply.reactions && reply.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {reply.reactions.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReactionReply(activeThread.id, reply.id, emoji)}
                            className="bg-blue-500/10 border border-blue-500/30 text-blue-200 rounded px-1.5 py-0.5 text-[9px] hover:bg-rose-500/10 cursor-pointer select-none"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover mini-reaction selector inside thread replies */}
                  <div className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center bg-[#1A1D21] border border-gray-800 rounded shadow p-0.5 space-x-1 z-30">
                      {['👍', '❤️', '🔥', '✅'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReactionReply(activeThread.id, reply.id, emoji)}
                          className="hover:bg-gray-800 shrink-0 p-0.5 rounded text-[11px] cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
             })}
          </div>

          {/* Reply input styled beautifully inside the thread */}
          <div className="m-3 bg-[#1A1D21] border border-gray-800 rounded-lg overflow-hidden flex flex-col focus-within:border-gray-500 shrink-0 shadow-lg relative">
            {/* Thread Autocomplete User Mentions Select Overlay Popup */}
            {showThreadMentionsList && filteredThreadMentionUsers.length > 0 && (
              <div className="absolute bottom-full left-3 mb-2 w-64 bg-[#121317] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden select-none animate-fade-in-up">
                <div className="px-3 py-1 text-[9px] text-gray-500 font-bold uppercase border-b border-gray-850 tracking-wider flex items-center justify-between">
                  <span>Mention Team Member</span>
                  {threadMentionQuery && (
                    <span className="text-[8px] font-mono lowercase bg-gray-800 px-1 py-0.2 rounded text-gray-400">@{threadMentionQuery}</span>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-850/30">
                  {filteredThreadMentionUsers.map(usr => (
                    <button 
                      key={usr.id}
                      type="button"
                      onClick={() => handleMentionSelect(usr.username || usr.name, true)}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-805 text-xs text-gray-200 hover:text-white flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <img className="h-4.5 w-4.5 rounded-full object-cover bg-gray-700 shrink-0" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${usr.name.replace(/\s+/g, '')}`} alt="" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate text-[11px] text-gray-200 hover:text-white flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${usr.role === 'Super Admin' || usr.id === '8' ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                            {usr.name}
                          </span>
                          {usr.username && (
                            <span className="text-[9px] text-gray-400 font-mono shrink-0">@{usr.username}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center px-1.5 py-1 space-x-0.5 border-b border-gray-850 bg-[#2A2B32]/20 shrink-0">
              <button onClick={() => applyFormat('bold', true)} type="button" className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded"><Bold className="h-3 w-3" /></button>
              <button onClick={() => applyFormat('italic', true)} type="button" className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded"><Italic className="h-3 w-3" /></button>
              <button onClick={() => applyFormat('strikethrough', true)} type="button" className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded"><Strikethrough className="h-3 w-3" /></button>
              <div className="w-px h-3 bg-gray-800 mx-1"></div>
              <button onClick={() => applyFormat('link', true)} type="button" className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded"><LinkIcon className="h-3 w-3" /></button>
              <button onClick={() => applyFormat('list-ol', true)} type="button" className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded"><ListOrdered className="h-3 w-3" /></button>
              <button onClick={() => applyFormat('list-ul', true)} type="button" className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-850 rounded"><List className="h-3 w-3" /></button>
            </div>
 
             <form onSubmit={handleSendThreadReply} className="flex flex-col">
               <textarea 
                 ref={threadInputRef}
                 value={threadReply}
                 onChange={handleThreadReplyChangeCursor}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSendThreadReply();
                   }
                 }}
                 placeholder="Reply in thread..."
                 className="w-full bg-transparent border-none pl-3 pr-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-0 resize-none min-h-[50px] leading-relaxed max-h-24 font-sans"
                 rows={2}
               />
               <div className="px-2 pb-1.5 flex items-center justify-between mt-1 bg-[#1A1D21] shrink-0 pt-1 border-t border-gray-850">
                 <div className="flex items-center space-x-1.5 relative">
                   <button type="button" className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-750 text-gray-340 hover:bg-gray-700 hover:text-white transition"><Plus className="h-3 w-3" /></button>
                   <button type="button" className="p-0.5 text-gray-400 hover:text-gray-200"><Type className="h-3 w-3" /></button>
                   
                   {/* Emoji deluxe picker for reply thread */}
                   <div className="relative">
                     <button 
                       type="button" 
                       onClick={() => setShowThreadEmojiPicker(!showThreadEmojiPicker)}
                       className={`p-1 hover:text-yellow-405 transition rounded ${showThreadEmojiPicker ? 'bg-gray-800 text-yellow-400' : 'text-gray-400 hover:text-gray-200'}`}
                     >
                       <Smile className="h-3 w-3" />
                     </button>
                     {showThreadEmojiPicker && (
                       <div className="absolute bottom-full right-0 mb-2 z-[1000]">
                         <EmojiDeluxe 
                           onSelect={(emoji) => {
                             handleThreadReplyChange(threadReply + emoji);
                             setShowThreadEmojiPicker(false);
                           }} 
                           onClose={() => setShowThreadEmojiPicker(false)} 
                         />
                       </div>
                     )}
                   </div>

                   {/* Thread @ trigger button */}
                   <button 
                     type="button" 
                     onClick={() => setShowThreadMentionsList(!showThreadMentionsList)}
                     className={`p-1 rounded cursor-pointer transition ${showThreadMentionsList ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                     title="Mention team member"
                   >
                     <AtSign className="h-3 w-3" />
                   </button>
                 </div>
 
                 <button 
                   type="submit"
                   disabled={!threadReply.trim()}
                   className="bg-emerald-600 hover:bg-emerald-500 text-[#121317] disabled:bg-gray-800 disabled:text-gray-500 disabled:opacity-50 p-1 px-2.5 rounded transition font-bold text-[10px] flex items-center justify-center space-x-1 cursor-pointer"
                 >
                   <span>Reply</span>
                   <Send className="h-2.5 w-2.5" />
                 </button>
               </div>
             </form>
           </div>

        </div>
      )}

      {/* Active Audio / Video Call Floating Modal Overlay */}
      {activeCall && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[#121317] border border-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] relative">
            
            {/* Top Bar */}
            <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between bg-[#1A1D21]">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCall.user.name}&backgroundColor=b6e3f4`} alt="" className="w-full h-full" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#121317]"></div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-base">{activeCall.user.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {activeCall.mode === 'video' ? 'HD Video Call' : 'Encrypted Voice Call'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                    {activeCall.user.role} • <span className="text-emerald-400 font-bold">{formatCallDuration(callDuration)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/50 rounded-full text-emerald-400 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span>Connected</span>
                </div>
              </div>
            </div>

            {/* Main Call Viewport */}
            <div className="flex-1 bg-black/60 relative flex items-center justify-center p-6 overflow-hidden">
              {activeCall.mode === 'video' && !isCallVideoOff ? (
                <div className="w-full h-full relative rounded-xl overflow-hidden bg-gray-950 border border-gray-800 flex items-center justify-center">
                  <video 
                    ref={callVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-xl"
                  />
                  
                  {/* Fallback display if video track stream is loading/unavailable */}
                  {(!mediaStream || !mediaStream.getVideoTracks().some(t => t.enabled)) && (
                    <div className="absolute inset-0 bg-[#121317] flex flex-col items-center justify-center text-center p-6">
                      <div className="w-24 h-24 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center mb-4 relative">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCall.user.name}&backgroundColor=b6e3f4`} alt="" className="w-20 h-20 rounded-full" />
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping pointer-events-none"></div>
                      </div>
                      <h4 className="text-white font-bold text-base">{activeCall.user.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">Camera feed active • Video call in progress</p>
                    </div>
                  )}

                  {/* Self PIP overlay */}
                  <div className="absolute bottom-4 right-4 w-36 h-24 bg-gray-900/90 border border-gray-700 rounded-lg overflow-hidden shadow-2xl flex flex-col items-center justify-center">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'Abdallah Sayed'}&backgroundColor=b6e3f4`} alt="" className="w-10 h-10 rounded-full mb-1" />
                    <span className="text-[9px] font-bold text-gray-300">You (Local)</span>
                  </div>
                </div>
              ) : (
                /* Voice call stage */
                <div className="flex flex-col items-center justify-center text-center max-w-sm">
                  <div className="relative mb-6">
                    <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="w-28 h-28 rounded-full bg-[#1A1D21] border-2 border-emerald-500 flex items-center justify-center relative z-10 shadow-2xl overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCall.user.name}&backgroundColor=b6e3f4`} alt="" className="w-24 h-24 rounded-full" />
                    </div>
                  </div>

                  <h4 className="text-white font-bold text-lg">{activeCall.user.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{activeCall.user.role}</p>

                  {/* Live Audio Frequency Meter Animation */}
                  <div className="flex items-center justify-center space-x-1 mt-6 h-8">
                    {[40, 70, 30, 90, 60, 100, 50, 80, 40].map((h, i) => (
                      <div 
                        key={i} 
                        className={`w-1 bg-emerald-500 rounded-full transition-all duration-150 ${isCallMuted ? 'h-1 opacity-30' : ''}`}
                        style={{ 
                          height: isCallMuted ? '4px' : `${Math.max(6, Math.floor(Math.random() * (h / 2.5)) + 8)}px`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-gray-500 mt-2">
                    {isCallMuted ? 'Muted' : 'Speaking (Studio HD Voice)'}
                  </p>
                </div>
              )}
            </div>

            {/* Call Control Toolbar */}
            <div className="px-6 py-4 bg-[#1A1D21] border-t border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Volume2 className="h-4 w-4 text-emerald-400" />
                <span>Default Speaker</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsCallMuted(!isCallMuted)}
                  className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center ${
                    isCallMuted ? 'bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30' : 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700'
                  }`}
                  title={isCallMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isCallMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <button
                  onClick={() => setIsCallVideoOff(!isCallVideoOff)}
                  className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center ${
                    isCallVideoOff ? 'bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30' : 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700'
                  }`}
                  title={isCallVideoOff ? 'Start Camera' : 'Stop Camera'}
                >
                  {isCallVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>

                <button
                  onClick={() => setIsCallScreenSharing(!isCallScreenSharing)}
                  className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center ${
                    isCallScreenSharing ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50' : 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700'
                  }`}
                  title="Share Screen"
                >
                  <MonitorUp className="h-5 w-5" />
                </button>

                <button
                  onClick={handleEndCall}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-red-900/40 flex items-center space-x-2 cursor-pointer"
                >
                  <PhoneOff className="h-5 w-5" />
                  <span>End Call</span>
                </button>
              </div>

              <div className="text-xs text-gray-500 font-mono">
                HD Audio
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
