import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, CheckCircle2, Circle, MessageSquare, LayoutGrid, Layers, Tag, 
  X, Send, User, FileText, Clock, Edit3, Save, Check, Paperclip, Sparkles, BookOpen,
  CornerDownRight, Zap, Reply
} from 'lucide-react';
import { canAccessChannel, useWorkspace } from '../../context';
import { supabase } from '../../lib/supabase';

export interface CanvasTaskComment {
  id: string;
  authorName: string;
  authorEmail: string;
  text: string;
  createdAt: string;
  replies?: CanvasTaskComment[];
}

export interface CanvasItem {
  id: string;
  text: string;
  completed: boolean;
  documentation?: string;
  discussions?: CanvasTaskComment[];
}

export interface CanvasCard {
  id: string;
  title: string;
  color: string;
  channelId?: string; // Optional binding to a specific channel
  items: CanvasItem[];
}

const QUICK_REPLIES = [
  "Acknowledged 👍",
  "On it! 🚀",
  "Looks good! ✔️",
  "Please review 🔍",
  "Done & verified ✅"
];

const defaultCanvasCards: CanvasCard[] = [
  {
    id: 'canvas_1',
    title: 'Project Alpha Launch',
    color: 'border-blue-500',
    channelId: '4', // General
    items: [
      { 
        id: 'item_1_1', 
        text: 'Set up testing checklist inside continuous integration', 
        completed: true,
        documentation: 'CI pipeline configured with GitHub Actions. Standard test suite covers unit and integration specs across all modules.',
        discussions: [
          {
            id: 'c1',
            authorName: 'Abdullah demo one',
            authorEmail: 'abdullah.demo1@gmail.com',
            text: 'CI pipeline tests are green! All 48 unit tests passing on Node 20 runtime.',
            createdAt: '2026-07-29 14:30',
            replies: [
              {
                id: 'r1',
                authorName: 'Ibrahim demo one',
                authorEmail: 'ibrahim.demo1@gmail.com',
                text: 'Awesome job! Verified staging build hook.',
                createdAt: '2026-07-29 14:45'
              }
            ]
          },
          {
            id: 'c2',
            authorName: 'Ibrahim demo one',
            authorEmail: 'ibrahim.demo1@gmail.com',
            text: 'Verified staging build trigger on main branch merge. Clean execution.',
            createdAt: '2026-07-29 16:15',
            replies: []
          }
        ]
      },
      { 
        id: 'item_1_2', 
        text: 'Review international accounting rules compliance', 
        completed: false,
        documentation: 'Ensure compliance with IFRS 15 revenue recognition and GCC VAT standards prior to Alpha commercial rollout.',
        discussions: [
          {
            id: 'c3',
            authorName: 'Mohammed demo one',
            authorEmail: 'mohammed.demo1@gmail.com',
            text: 'Legal & audit team requested double-entry ledger exports for cross-border transactions.',
            createdAt: '2026-07-30 02:10',
            replies: []
          }
        ]
      },
      { 
        id: 'item_1_3', 
        text: 'Deploy demo to staging servers', 
        completed: false,
        documentation: 'Staging environment deployment target: Cloud Run container behind reverse proxy on port 3000.',
        discussions: [
          {
            id: 'c4',
            authorName: 'Alaa demo one',
            authorEmail: 'alaa.demo1@gmail.com',
            text: 'Docker container built successfully. Waiting on final database migration check before public preview.',
            createdAt: '2026-07-30 03:45',
            replies: []
          }
        ]
      },
      {
        id: 'item_1_4',
        text: 'Finalize security audit and team compliance documentation',
        completed: false,
        documentation: 'Audit secret keys, server-side API proxy routing, and verify permission roles across team organizations.',
        discussions: [
          {
            id: 'c5',
            authorName: 'Esraa Al Barsiky',
            authorEmail: 'esraa.barsiky@democompany.com',
            text: 'All API routes proxying Gemini and database secrets correctly. Zero credentials exposed to browser client.',
            createdAt: '2026-07-30 04:00',
            replies: []
          }
        ]
      }
    ]
  },
  {
    id: 'canvas_2',
    title: 'Marketing Q3 Review',
    color: 'border-purple-500',
    channelId: '10', // vmops-system-and-integrations
    items: [
      { 
        id: 'item_2_1', 
        text: 'Determine key keyword trigger dispatch ratios', 
        completed: false,
        documentation: 'Optimizing auto-responder keywords for high conversion rates.',
        discussions: [
          {
            id: 'c6',
            authorName: 'Mohammed demo one',
            authorEmail: 'mohammed.demo1@gmail.com',
            text: 'Recommended focus keywords: #sales, #inquiry, #billing-support.',
            createdAt: '2026-07-28 11:20',
            replies: []
          }
        ]
      },
      { id: 'item_2_2', text: 'Analyze client onboarding double-entry logs', completed: false, discussions: [] },
      { id: 'item_2_3', text: 'Schedule partner sync sessions', completed: false, discussions: [] }
    ]
  },
  {
    id: 'canvas_3',
    title: 'Client Onboarding',
    color: 'border-green-500',
    channelId: '8', // vaccounting-bills-submissions
    items: [
      { id: 'item_3_1', text: 'Validate sub-ledger account creation', completed: true, discussions: [] },
      { id: 'item_3_2', text: 'Verify banking API access keys', completed: true, discussions: [] }
    ]
  }
];

export function CanvasView() {
  const { channels, users, currentUser, activeOrganizationId } = useWorkspace();
  const visibleChannels = channels.filter(channel => canAccessChannel(channel, currentUser, activeOrganizationId));
  const [cards, setCards] = useState<CanvasCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const cardsRef = useRef<CanvasCard[]>([]);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const loadGenerationRef = useRef(0);
  const [newTitle, setNewTitle] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('border-blue-500');
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskInputs, setTaskInputs] = useState<{ [cardId: string]: string }>({});

  // Task Discussion Drawer State
  const [activeTaskDiscussion, setActiveTaskDiscussion] = useState<{
    card: CanvasCard;
    task: CanvasItem;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'discussions' | 'documentation'>('discussions');
  const [newCommentText, setNewCommentText] = useState('');
  const [editingDoc, setEditingDoc] = useState('');
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});

  const getCommentsTotal = (discussions?: CanvasTaskComment[]) => {
    if (!discussions) return 0;
    return discussions.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
  };

  const rowToCard = (row: { id: string; title: string; channel_id?: string | null; content?: string | null }): CanvasCard => {
    let document: Partial<CanvasCard> = {};
    try { document = row.content ? JSON.parse(row.content) as Partial<CanvasCard> : {}; } catch { document = {}; }
    return {
      id: row.id,
      title: row.title,
      color: typeof document.color === 'string' ? document.color : 'border-blue-500',
      channelId: row.channel_id || undefined,
      items: Array.isArray(document.items) ? document.items as CanvasItem[] : []
    };
  };

  const applyRemoteCards = (nextCards: CanvasCard[]) => {
    cardsRef.current = nextCards;
    setCards(nextCards);
    setActiveTaskDiscussion(previous => {
      if (!previous) return null;
      const updatedCard = nextCards.find(card => card.id === previous.card.id);
      const updatedTask = updatedCard?.items.find(task => task.id === previous.task.id);
      return updatedCard && updatedTask ? { card: updatedCard, task: updatedTask } : null;
    });
  };

  useEffect(() => {
    const generation = ++loadGenerationRef.current;
    if (!activeOrganizationId || !currentUser) {
      applyRemoteCards([]);
      setIsLoadingCards(false);
      return;
    }

    const loadCards = async () => {
      const { data, error } = await supabase.from('canvases')
        .select('id,title,channel_id,content,created_at')
        .eq('organization_id', activeOrganizationId)
        .order('created_at');
      if (generation !== loadGenerationRef.current) return;
      if (error) {
        setCanvasError(error.message);
        setIsLoadingCards(false);
        return;
      }
      applyRemoteCards((data || []).map(rowToCard));
      setCanvasError(null);
      setIsLoadingCards(false);
    };

    setIsLoadingCards(true);
    void loadCards();
    const realtimeChannel = supabase.channel(`canvas-sync-${activeOrganizationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canvases' }, () => {
        void writeQueueRef.current.then(loadCards);
      })
      .subscribe();
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void writeQueueRef.current.then(loadCards);
    }, 15_000);

    return () => {
      ++loadGenerationRef.current;
      window.clearInterval(refreshTimer);
      void supabase.removeChannel(realtimeChannel);
    };
  }, [activeOrganizationId, currentUser?.id]);

  const persistCards = async (previousCards: CanvasCard[], updatedCards: CanvasCard[], organizationId: string, creatorId: string) => {
    const previousById = new Map(previousCards.map(card => [card.id, card]));
    const updatedIds = new Set(updatedCards.map(card => card.id));
    for (const card of updatedCards) {
      const previousCard = previousById.get(card.id);
      const content = JSON.stringify({ color: card.color, items: card.items });
      if (!previousCard) {
        const { error } = await supabase.from('canvases').insert({
          id: card.id, organization_id: organizationId, title: card.title, content,
          channel_id: card.channelId || null, creator_id: creatorId
        });
        if (error) throw error;
      } else if (JSON.stringify(previousCard) !== JSON.stringify(card)) {
        const { error } = await supabase.from('canvases').update({
          title: card.title, content, channel_id: card.channelId || null, updated_at: new Date().toISOString()
        }).eq('id', card.id).eq('organization_id', organizationId);
        if (error) throw error;
      }
    }
    const removedIds = previousCards.filter(card => !updatedIds.has(card.id)).map(card => card.id);
    if (removedIds.length) {
      const { error } = await supabase.from('canvases').delete().eq('organization_id', organizationId).in('id', removedIds);
      if (error) throw error;
    }
  };

  const saveCards = (updatedCards: CanvasCard[]) => {
    const previousCards = cardsRef.current;
    applyRemoteCards(updatedCards);
    if (activeOrganizationId && currentUser) {
      const organizationId = activeOrganizationId;
      const creatorId = currentUser.id;
      writeQueueRef.current = writeQueueRef.current
        .then(() => persistCards(previousCards, updatedCards, organizationId, creatorId))
        .then(() => setCanvasError(null))
        .catch(error => {
          console.error('Unable to sync canvas.', error);
          setCanvasError(error instanceof Error ? error.message : 'Unable to sync this canvas.');
        });
    }
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newCard: CanvasCard = {
      id: `canvas_${Date.now()}`,
      title: newTitle.trim(),
      color: selectedColor,
      channelId: selectedChannelId || undefined,
      items: []
    };

    const updated = [...cards, newCard];
    saveCards(updated);
    setNewTitle('');
    setSelectedChannelId('');
    setShowAddForm(false);
  };

  const handleDeleteCard = (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this checklist?')) {
      const updated = cards.filter(c => c.id !== cardId);
      saveCards(updated);
      if (activeTaskDiscussion?.card.id === cardId) {
        setActiveTaskDiscussion(null);
      }
    }
  };

  const handleToggleTask = (cardId: string, taskId: string) => {
    const updated = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          items: c.items.map(item => {
            if (item.id === taskId) {
              return { ...item, completed: !item.completed };
            }
            return item;
          })
        };
      }
      return c;
    });
    saveCards(updated);
  };

  const handleAddTask = (cardId: string) => {
    const text = taskInputs[cardId]?.trim();
    if (!text) return;

    const updated = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          items: [
            ...c.items,
            { id: `task_${Date.now()}`, text, completed: false, discussions: [], documentation: '' }
          ]
        };
      }
      return c;
    });

    saveCards(updated);
    setTaskInputs({ ...taskInputs, [cardId]: '' });
  };

  const handleDeleteTask = (cardId: string, taskId: string) => {
    const updated = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          items: c.items.filter(item => item.id !== taskId)
        };
      }
      return c;
    });
    saveCards(updated);
    if (activeTaskDiscussion?.task.id === taskId) {
      setActiveTaskDiscussion(null);
    }
  };

  const handleOpenDiscussion = (card: CanvasCard, task: CanvasItem) => {
    setActiveTaskDiscussion({ card, task });
    setEditingDoc(task.documentation || '');
    setIsEditingDoc(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskDiscussion || !newCommentText.trim() || !currentUser) return;

    const currentAuthor = currentUser;

    const newComment: CanvasTaskComment = {
      id: `comment_${Date.now()}`,
      authorName: currentAuthor.name,
      authorEmail: currentAuthor.email,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedCards = cards.map(c => {
      if (c.id === activeTaskDiscussion.card.id) {
        return {
          ...c,
          items: c.items.map(t => {
            if (t.id === activeTaskDiscussion.task.id) {
              return {
                ...t,
                discussions: [...(t.discussions || []), newComment]
              };
            }
            return t;
          })
        };
      }
      return c;
    });

    saveCards(updatedCards);
    setNewCommentText('');
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const knownNames = Array.from(new Set([
      ...users.map(u => u.name),
      'Abdullah demo one',
      'Ibrahim demo one',
      'Mohammed demo one',
      'Alaa demo one',
      'Esraa Al Barsiky'
    ])).filter(Boolean);

    knownNames.sort((a, b) => b.length - a.length);
    const escapedNames = knownNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(@(?:${escapedNames}|[A-Za-z0-9_.-]+))`, 'gi');

    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 text-[11px] shadow-sm select-none"
          >
            <span className="text-blue-400 font-extrabold">@</span>
            {part.substring(1)}
          </span>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const handleTriggerReply = (parentCommentId: string, authorNameToMention: string) => {
    setReplyingToCommentId(parentCommentId);
    setReplyInputs(prev => {
      const current = prev[parentCommentId] || '';
      const mentionTag = `@${authorNameToMention}`;
      if (current.includes(mentionTag)) return prev;
      const updated = current ? `${current.trim()} ${mentionTag} ` : `${mentionTag} `;
      return { ...prev, [parentCommentId]: updated };
    });
  };

  const handleInsertMention = (targetField: 'main' | string, authorName: string) => {
    const mentionTag = `@${authorName}`;
    if (targetField === 'main') {
      setNewCommentText(prev => {
        if (prev.includes(mentionTag)) return prev;
        return prev ? `${prev.trim()} ${mentionTag} ` : `${mentionTag} `;
      });
    } else {
      setReplyInputs(prev => {
        const current = prev[targetField] || '';
        if (current.includes(mentionTag)) return prev;
        const updated = current ? `${current.trim()} ${mentionTag} ` : `${mentionTag} `;
        return { ...prev, [targetField]: updated };
      });
    }
  };

  const handleAddReply = (parentCommentId: string, textToSubmit?: string) => {
    if (!activeTaskDiscussion || !currentUser) return;
    const content = (textToSubmit || replyInputs[parentCommentId])?.trim();
    if (!content) return;

    const currentAuthor = currentUser;

    const newReply: CanvasTaskComment = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorName: currentAuthor.name,
      authorEmail: currentAuthor.email,
      text: content,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedCards = cards.map(c => {
      if (c.id === activeTaskDiscussion.card.id) {
        return {
          ...c,
          items: c.items.map(t => {
            if (t.id === activeTaskDiscussion.task.id) {
              const updatedDiscussions = (t.discussions || []).map(comm => {
                if (comm.id === parentCommentId) {
                  return {
                    ...comm,
                    replies: [...(comm.replies || []), newReply]
                  };
                }
                return comm;
              });
              return {
                ...t,
                discussions: updatedDiscussions
              };
            }
            return t;
          })
        };
      }
      return c;
    });

    saveCards(updatedCards);
    setReplyInputs(prev => ({ ...prev, [parentCommentId]: '' }));
    setReplyingToCommentId(null);
  };

  const handleSaveDocumentation = () => {
    if (!activeTaskDiscussion) return;

    const updatedCards = cards.map(c => {
      if (c.id === activeTaskDiscussion.card.id) {
        return {
          ...c,
          items: c.items.map(t => {
            if (t.id === activeTaskDiscussion.task.id) {
              return {
                ...t,
                documentation: editingDoc.trim()
              };
            }
            return t;
          })
        };
      }
      return c;
    });

    saveCards(updatedCards);
    setIsEditingDoc(false);
  };

  const colorOptions = [
    { value: 'border-blue-500', label: 'Blue' },
    { value: 'border-purple-500', label: 'Purple' },
    { value: 'border-green-500', label: 'Green' },
    { value: 'border-emerald-500', label: 'Emerald' },
    { value: 'border-pink-500', label: 'Pink' },
    { value: 'border-yellow-500', label: 'Yellow' },
    { value: 'border-red-500', label: 'Red' }
  ];

  return (
    <div className="flex-1 bg-[#222529] flex flex-col h-full overflow-hidden text-gray-200 relative">
      
      {/* HEADER BAR */}
      <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-10 bg-gradient-to-b from-[#1A1D21] to-transparent border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5 flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-emerald-400" />
            Workspace Interactive Canvas
          </h2>
          <p className="text-xs text-gray-400">Review, document, and communicate with your team directly on each task line inside your canvas cards.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors shadow-lg cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showAddForm ? 'Close Creator' : 'Create Canvas Checklist'}
          </button>
        </div>
      </div>

      {/* CREATE CARD FORM */}
      {showAddForm && (
        <div className="mx-6 my-4 p-5 bg-[#1A1D21] border border-gray-800 rounded-2xl max-w-2xl">
          <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-4">Set Up New Canvas Checklist</h3>
          <form onSubmit={handleCreateCard} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Checklist Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Daily Standup Checklist"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#121317] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Context Channel Association</label>
                <select 
                  value={selectedChannelId} 
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full bg-[#121317] border border-gray-800 rounded-lg px-2 py-2 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="" className="bg-[#121317]">Global (No Channel Bind)</option>
                  {visibleChannels.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#121317]">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-2">Border Color Theme</label>
                <div className="flex space-x-2">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedColor(opt.value)}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        selectedColor === opt.value ? 'border-white scale-110' : 'border-transparent'
                      } ${opt.value.replace('border-', 'bg-')}`}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>
              <button 
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wide cursor-pointer self-end shadow"
              >
                Assemble Checklist Card
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CANVAS GRID AREA */}
      <div className="flex-1 relative overflow-hidden bg-[#1f2226]">
        <div className="absolute inset-0 p-8 flex flex-wrap gap-6 overflow-auto">
          {canvasError && <div className="w-full h-fit rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">Canvas sync failed: {canvasError}</div>}
          {isLoadingCards ? (
            <div className="p-16 text-center text-gray-500 max-w-sm mx-auto flex flex-col items-center justify-center select-none bg-[#1A1D21] border border-gray-800 rounded-2xl h-fit self-center"><Clock className="h-8 w-8 animate-pulse text-blue-400 mb-3" /><p className="text-sm font-bold text-gray-300">Loading shared canvas…</p></div>
          ) : cards.length === 0 ? (
            <div className="p-16 text-center text-gray-500 max-w-sm mx-auto flex flex-col items-center justify-center select-none bg-[#1A1D21] border border-gray-800 rounded-2xl h-fit self-center">
              <Layers className="h-10 w-10 text-gray-700 mb-4 shrink-0" />
              <p className="text-sm font-bold text-gray-400">Empty workspace canvas</p>
              <p className="text-xs text-gray-500 mt-1">Get started by creating canvas checklists above.</p>
            </div>
          ) : (
            cards.map((card) => {
              const matchedChannel = channels.find(c => c.id === card.channelId);
              const total = card.items.length;
              const completed = card.items.filter(i => i.completed).length;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={card.id} className={`w-96 bg-[#1A1D21] rounded-2xl shadow-xl border-t-4 ${card.color || 'border-blue-500'} border-l border-r border-b border-gray-800 flex flex-col h-fit`}>
                  
                  {/* CARD TITLE & HEADER */}
                  <div className="p-4 border-b border-gray-800/80 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
                        <span>{card.title}</span>
                        {card.title === 'Project Alpha Launch' && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                            4 Tasks
                          </span>
                        )}
                      </h3>
                      {matchedChannel && (
                        <p className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1.5 bg-emerald-950/20 w-fit px-1.5 py-0.2 rounded border border-emerald-900/10">
                          <Tag className="h-2.5 w-2.5" />
                          <span>#{matchedChannel.name}</span>
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-800/50 transition cursor-pointer"
                      title="Delete card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* PROGRESS BAR */}
                  {total > 0 && (
                    <div className="px-4 pt-3.5 select-none text-[10px] text-gray-400 font-medium flex items-center justify-between">
                      <span>Proportion complete: {completed}/{total} tasks</span>
                      <span className="font-mono text-xs text-emerald-400 font-bold">{percent}%</span>
                    </div>
                  )}
                  {total > 0 && (
                    <div className="mx-4 mt-1.5 h-1.5 bg-gray-800 rounded-full overflow-hidden select-none">
                      <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                    </div>
                  )}

                  {/* TASK ITEMS LIST */}
                  <div className="p-4 space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar">
                    {card.items.length === 0 && (
                      <p className="text-center text-[10.5px] text-gray-500 py-4 select-none">No checklist items yet.</p>
                    )}
                    {card.items.map((item) => {
                      const commentsCount = getCommentsTotal(item.discussions);
                      const hasDoc = Boolean(item.documentation && item.documentation.trim());

                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-start bg-gray-900/60 hover:bg-gray-900 p-3 rounded-xl border transition group ${
                            activeTaskDiscussion?.task.id === item.id 
                              ? 'border-blue-500/80 bg-blue-950/20 shadow-md' 
                              : 'border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          {/* Task completion toggle */}
                          <button
                            onClick={() => handleToggleTask(card.id, item.id)}
                            className="mr-2 text-gray-500 hover:text-emerald-400 transition cursor-pointer shrink-0 mt-0.5"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-500" />
                            )}
                          </button>

                          {/* Task Text */}
                          <div className="flex-1 min-w-0 pr-2">
                            <p 
                              onClick={() => handleToggleTask(card.id, item.id)}
                              className={`text-xs cursor-pointer select-text font-medium leading-relaxed ${
                                item.completed ? 'text-gray-500 line-through' : 'text-gray-200'
                              }`}
                            >
                              {item.text}
                            </p>

                            {/* Indicators for doc / last comment */}
                            <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-gray-400">
                              {hasDoc && (
                                <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  <FileText className="h-2.5 w-2.5" />
                                  <span>Doc</span>
                                </span>
                              )}
                              {commentsCount > 0 && (
                                <span className="flex items-center space-x-1 text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                  <MessageSquare className="h-2.5 w-2.5" />
                                  <span>{commentsCount} comments</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* DISCUSSION ICON NEXT TO CANVAS LINE */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => handleOpenDiscussion(card, item)}
                              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                                commentsCount > 0 
                                  ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 border border-blue-500/40' 
                                  : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
                              }`}
                              title="Click to open task discussions & documentation"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-bold">{commentsCount}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteTask(card.id, item.id)}
                              className="opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-red-400 p-1.5 shrink-0 cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* ADD TASK INPUT */}
                  <div className="p-3 bg-gray-900/30 rounded-b-2xl border-t border-gray-800 flex gap-2 items-center">
                    <input 
                      type="text"
                      placeholder="Add interactive task..."
                      value={taskInputs[card.id] || ''}
                      onChange={(e) => setTaskInputs({ ...taskInputs, [card.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(card.id);
                      }}
                      className="flex-1 bg-[#121317] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                      onClick={() => handleAddTask(card.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow"
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TASK DISCUSSION & DOCUMENTATION DRAWER (SLIDE-OVER FROM RIGHT) */}
      {activeTaskDiscussion && (
        <div className="absolute inset-y-0 right-0 w-full max-w-md bg-[#16181D] border-l border-gray-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* DRAWER HEADER */}
          <div className="p-5 border-b border-gray-800 bg-[#121317] flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md">
                  {activeTaskDiscussion.card.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  activeTaskDiscussion.task.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {activeTaskDiscussion.task.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <h3 className="font-extrabold text-white text-sm leading-snug">
                {activeTaskDiscussion.task.text}
              </h3>
            </div>
            <button
              onClick={() => setActiveTaskDiscussion(null)}
              className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* DRAWER TABS: DISCUSSIONS vs DOCUMENTATION */}
          <div className="flex items-center border-b border-gray-800 bg-[#14161B] px-4 pt-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('discussions')}
              className={`px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'discussions'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Team Discussions ({getCommentsTotal(activeTaskDiscussion.task.discussions)})</span>
            </button>

            <button
              onClick={() => setActiveTab('documentation')}
              className={`px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'documentation'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Task Documentation</span>
            </button>
          </div>

          {/* TAB 1: DISCUSSIONS CONTENT */}
          {activeTab === 'discussions' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* Comments Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {(!activeTaskDiscussion.task.discussions || activeTaskDiscussion.task.discussions.length === 0) ? (
                  <div className="text-center py-12 text-gray-500 space-y-2">
                    <MessageSquare className="h-10 w-10 mx-auto text-gray-700 opacity-50" />
                    <p className="text-xs font-semibold">No discussions on this task yet.</p>
                    <p className="text-[11px] text-gray-600">Start the conversation below to document and relate with your team.</p>
                  </div>
                ) : (
                  activeTaskDiscussion.task.discussions.map(comment => (
                    <div key={comment.id} className="bg-[#1C1F26] p-3.5 rounded-2xl border border-gray-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow">
                            {comment.authorName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block leading-none">{comment.authorName}</span>
                            <span className="text-[9px] text-gray-500 font-mono">{comment.authorEmail}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {comment.createdAt}
                        </span>
                      </div>

                      <div className="text-xs text-gray-300 leading-relaxed font-sans bg-[#14161B] p-2.5 rounded-xl border border-gray-800/80">
                        {renderFormattedText(comment.text)}
                      </div>

                      {/* Instant Reply action bar for main comment */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-800/60 text-[11px]">
                        <button
                          onClick={() => handleTriggerReply(comment.id, comment.authorName)}
                          className="text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1 cursor-pointer transition hover:bg-blue-500/10 px-2 py-1 rounded-lg"
                        >
                          <CornerDownRight className="h-3.5 w-3.5" />
                          <span>Reply to {comment.authorName.split(' ')[0]}</span>
                        </button>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {comment.replies?.length ? `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}` : 'No replies yet'}
                        </span>
                      </div>

                      {/* Render Existing Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-2 mt-2 border-l-2 border-blue-500/30 pl-3 space-y-2.5">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="bg-[#14161B] p-2.5 rounded-xl border border-gray-800 space-y-1.5 hover:border-gray-700 transition">
                              <div className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center space-x-1.5">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-[9px] flex items-center justify-center">
                                    {reply.authorName.charAt(0)}
                                  </div>
                                  <span className="font-bold text-white">{reply.authorName}</span>
                                </div>
                                <span className="text-gray-500 font-mono">{reply.createdAt}</span>
                              </div>

                              <div className="text-xs text-gray-300 font-sans pl-1">
                                {renderFormattedText(reply.text)}
                              </div>

                              {/* Sub-reply action: Reply to this specific person (last person or person before him) */}
                              <div className="flex items-center justify-between pt-1 border-t border-gray-800/40 text-[10.5px]">
                                <button
                                  onClick={() => handleTriggerReply(comment.id, reply.authorName)}
                                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 cursor-pointer transition hover:bg-blue-500/10 px-1.5 py-0.5 rounded"
                                >
                                  <Reply className="h-3 w-3" />
                                  <span>Reply to {reply.authorName.split(' ')[0]}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Reply Form with Mentions & Quick Chips */}
                      {replyingToCommentId === comment.id && (
                        <div className="mt-2 bg-[#14161B] p-3 rounded-xl border border-blue-500/40 space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-blue-300 flex items-center space-x-1">
                              <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                              <span>Reply to Discussion Thread</span>
                            </span>
                            <button
                              onClick={() => setReplyingToCommentId(null)}
                              className="text-gray-500 hover:text-white cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Quick Mention Team Members Bar */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Mention team member:</span>
                            <div className="flex flex-wrap gap-1">
                              {users.map(u => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => handleInsertMention(comment.id, u.name)}
                                  className="px-2 py-0.5 bg-gray-800 hover:bg-blue-600/30 text-blue-300 border border-gray-700 hover:border-blue-500/50 rounded-md text-[10px] font-semibold transition cursor-pointer flex items-center gap-0.5"
                                >
                                  <span className="text-blue-400">@</span>
                                  <span>{u.name.split(' ')[0]}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Quick Reply Preset Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {QUICK_REPLIES.map(preset => (
                              <button
                                key={preset}
                                onClick={() => handleAddReply(comment.id, preset)}
                                className="px-2.5 py-1 bg-gray-800 hover:bg-blue-600/30 text-gray-200 hover:text-blue-200 border border-gray-700 hover:border-blue-500/50 rounded-lg text-[10.5px] font-semibold transition cursor-pointer"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          {/* Custom Reply Textarea */}
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Write reply... (@ to mention team members)"
                              value={replyInputs[comment.id] || ''}
                              onChange={(e) => setReplyInputs({ ...replyInputs, [comment.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddReply(comment.id);
                                }
                              }}
                              className="flex-1 bg-[#1A1D21] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => handleAddReply(comment.id)}
                              disabled={!replyInputs[comment.id]?.trim()}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1 cursor-pointer shadow"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Send</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input Form */}
              <div className="p-4 border-t border-gray-800 bg-[#121317] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-400 font-semibold">Posting as:</span>
                  <span className="rounded-lg border border-gray-700 bg-[#1A1D21] px-2.5 py-1 text-xs font-semibold text-blue-300">{currentUser?.name || 'Workspace member'}</span>
                </div>

                {/* Team Mention bar for main comment */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Mention team members:</span>
                  <div className="flex flex-wrap gap-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleInsertMention('main', u.name)}
                        className="px-2 py-0.5 bg-gray-800 hover:bg-blue-600/30 text-blue-300 border border-gray-700 hover:border-blue-500/50 rounded-md text-[10px] font-semibold transition cursor-pointer flex items-center gap-0.5"
                      >
                        <span className="text-blue-400">@</span>
                        <span>{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="Write a message or team note for this task... (@ to mention team members)"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-[#1A1D21] border border-gray-700 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs cursor-pointer shadow flex items-center justify-center self-end"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 2: DOCUMENTATION CONTENT */}
          {activeTab === 'documentation' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <span>Task Documentation & Technical Notes</span>
                </h4>
                {!isEditingDoc && (
                  <button
                    onClick={() => setIsEditingDoc(true)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg border border-gray-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Edit Doc</span>
                  </button>
                )}
              </div>

              {isEditingDoc ? (
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={editingDoc}
                    onChange={(e) => setEditingDoc(e.target.value)}
                    placeholder="Document implementation details, SLAs, links, or specifications for this task..."
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-2xl p-3.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingDoc(activeTaskDiscussion.task.documentation || '');
                        setIsEditingDoc(false);
                      }}
                      className="px-3.5 py-1.5 bg-gray-800 text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDocumentation}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Documentation</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1C1F26] border border-gray-800 rounded-2xl p-4 space-y-3">
                  {activeTaskDiscussion.task.documentation ? (
                    <div className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {activeTaskDiscussion.task.documentation}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 space-y-1">
                      <FileText className="h-8 w-8 mx-auto text-gray-700 opacity-40" />
                      <p className="text-xs">No technical documentation written for this task yet.</p>
                      <button
                        onClick={() => setIsEditingDoc(true)}
                        className="text-xs text-emerald-400 hover:underline font-bold pt-1 inline-block cursor-pointer"
                      >
                        + Write Documentation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
