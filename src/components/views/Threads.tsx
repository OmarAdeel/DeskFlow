import React, { useState, useRef } from 'react';
import { useWorkspace, Message, Reply } from '../../context';
import { MessageSquare, Hash, Lock, Bold, Italic, Underline, Strikethrough, Link as LinkIcon, ListOrdered, List, AlignLeft, Code, SquareSlash, Plus, Type, Smile, AtSign, MoreHorizontal, Send, ChevronDown, X } from 'lucide-react';
import { MessageActions } from '../MessageActions';
import { MessageReactions } from '../MessageReactions';
import { FormattedMessage } from '../FormattedMessage';
import { EmojiDeluxe } from '../EmojiDeluxe';

const ThreadItem: React.FC<{ msg: Message, onNavigate: any, onSelectThread: (id: string) => void }> = ({ msg, onNavigate, onSelectThread }) => {
  const { users, channels, setMessages, messages, currentUser, drafts, setDrafts } = useWorkspace();
  const draft = drafts.find(d => d.threadId === msg.id);
  const [threadReply, setThreadReply] = useState(draft?.text || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<number>(5);
  const threadInputRef = useRef<HTMLTextAreaElement>(null);
  
  const channel = channels.find(c => c.id === msg.channelId);
  const sender = users.find(u => u.id === msg.senderId);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setThreadReply(text);
    
    const existingDrafts = drafts.filter(d => d.threadId !== msg.id);
    if (text.trim()) {
      setDrafts([...existingDrafts, { threadId: msg.id, channelId: msg.channelId, text, timestamp: Date.now() }]);
    } else {
      setDrafts(existingDrafts);
    }
  };

  const applyFormat = (type: string) => {
    const ref = threadInputRef;
    if (!ref.current) return;
    
    const start = ref.current.selectionStart;
    const end = ref.current.selectionEnd;
    const currentText = threadReply;
    
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
    setThreadReply(newText);
    
    const existingDrafts = drafts.filter(d => d.threadId !== msg.id);
    if (newText.trim()) {
      setDrafts([...existingDrafts, { threadId: msg.id, channelId: msg.channelId, text: newText, timestamp: Date.now() }]);
    } else {
      setDrafts(existingDrafts);
    }
    
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadReply.trim() || !currentUser) return;

    const reply = {
      id: `reply_${Date.now()}`,
      senderId: currentUser.id,
      text: threadReply,
      timestamp: Date.now(),
      isRead: true
    };

    setMessages(messages.map(m => 
      m.id === msg.id 
        ? { ...m, replies: [...m.replies, reply] }
        : m
    ));
    setThreadReply('');
    setDrafts(drafts.filter(d => d.threadId !== msg.id));
  };

  return (
    <div className="bg-[#121317] border border-gray-800 rounded-xl p-0">
      <div className="px-4 py-2 border-b border-gray-800 bg-[#1A1D21] rounded-t-xl flex items-center justify-between text-xs font-medium text-gray-400">
        <span className="flex items-center mr-4 cursor-pointer hover:text-white transition-colors" onClick={() => channel && onNavigate('channel', channel.id)}>
          {channel?.isPrivate ? <Lock className="h-3 w-3 mr-1" /> : <Hash className="h-3 w-3 mr-1" />}
          {channel?.name}
        </span>
        <button 
          type="button"
          onClick={() => onSelectThread(msg.id)}
          className="px-2.5 py-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 rounded-full transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <MessageSquare className="h-3 w-3" />
          <span>View Thread ({msg.replies.length} replies)</span>
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Original Message */}
        <div className="relative group">
          <div className="flex">
            <div className="h-8 w-8 bg-gray-700 rounded mr-3 shrink-0 overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sender?.name}&backgroundColor=b6e3f4`} alt="" />
            </div>
            <div>
              <div className="flex items-baseline mb-0.5">
                <span className="font-bold text-gray-200 text-sm mr-2">{sender?.name}</span>
                <span className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-sm text-gray-300"><FormattedMessage text={msg.text} /></div>
              <MessageReactions reactions={msg.reactions} itemId={msg.id} />
            </div>
          </div>
          
          {/* Main Message Options */}
          <MessageActions itemId={msg.id} onReply={() => onSelectThread(msg.id)} />
        </div>

        {/* Replies */}
        <div className="pl-11 space-y-4 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800 -ml-px"></div>
          
          {msg.replies.length > visibleRepliesCount && (
            <div className="flex justify-start pl-4 py-2">
              <button
                type="button"
                onClick={() => setVisibleRepliesCount(prev => prev + 10)}
                className="px-4 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 rounded-full transition cursor-pointer flex items-center shadow-sm"
              >
                Show Previous ({msg.replies.length - visibleRepliesCount} remaining)
              </button>
            </div>
          )}

          {msg.replies.slice(Math.max(0, msg.replies.length - visibleRepliesCount)).map((reply: Reply, idx: number) => {
            const replier = users.find(u => u.id === reply.senderId);
            return (
              <div key={idx} className="relative group">
                <div className="flex relative z-10">
                  <div className="h-6 w-6 bg-gray-700 rounded mr-3 shrink-0 overflow-hidden mt-1">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${replier?.name}&backgroundColor=b6e3f4`} alt="" />
                  </div>
                  <div>
                    <div className="flex items-baseline mb-0.5">
                      <span className="font-bold text-gray-200 text-xs mr-2">{replier?.name}</span>
                      <span className="text-[10px] text-gray-500">{new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-sm text-gray-400"><FormattedMessage text={reply.text} /></div>
                    <MessageReactions reactions={reply.reactions} itemId={reply.id} />
                  </div>
                </div>

                {/* Reply Options */}
                <MessageActions itemId={reply.id} onReply={() => { threadInputRef.current?.focus() }} />
              </div>
            );
          })}
        </div>

        {/* Reply Input */}
        <div className="mt-4 ml-11 bg-[#1A1D21] border border-gray-700 rounded-lg overflow-hidden flex flex-col focus-within:border-gray-500">
          <div className="flex items-center px-2 py-1.5 space-x-0.5 border-b border-gray-700 bg-[#2A2B32]/30">
            <button onClick={() => applyFormat('bold')} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Bold className="h-4 w-4" /></button>
            <button onClick={() => applyFormat('italic')} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Italic className="h-4 w-4" /></button>
            <button onClick={() => applyFormat('strikethrough')} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Strikethrough className="h-4 w-4" /></button>
            <div className="w-px h-4 bg-gray-600 mx-1"></div>
            <button onClick={() => applyFormat('link')} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><LinkIcon className="h-4 w-4" /></button>
            <button onClick={() => applyFormat('list-ol')} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><ListOrdered className="h-4 w-4" /></button>
            <button onClick={() => applyFormat('list-ul')} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><List className="h-4 w-4" /></button>
            <button onClick={() => applyFormat('quote')} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><AlignLeft className="h-4 w-4" /></button>
            <div className="w-px h-4 bg-gray-600 mx-1"></div>
            <button onClick={() => applyFormat('code')} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Code className="h-4 w-4" /></button>
            <button onClick={() => applyFormat('codeblock')} type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><SquareSlash className="h-4 w-4" /></button>
          </div>
          
          <form onSubmit={sendReply} className="flex flex-col">
            <textarea 
              ref={threadInputRef}
              value={threadReply}
              onChange={(e) => setThreadReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (threadReply.trim()) {
                    sendReply(e as any);
                  }
                }
              }}
              placeholder="Reply..."
              className="w-full bg-transparent border-none pl-4 pr-12 py-3 text-sm text-gray-200 focus:outline-none focus:ring-0 resize-none min-h-[60px]"
            />
            <div className="px-3 pb-2 flex items-center justify-between mt-2">
              <div className="flex items-center text-xs text-gray-400">
                <label className="flex items-center cursor-pointer hover:text-gray-300">
                  <input type="checkbox" className="mr-2 rounded border-gray-600 bg-[#1A1D21] text-blue-500 focus:ring-blue-500" />
                  Also send to {channel?.isPrivate ? <Lock className="h-3 w-3 mx-1" /> : <Hash className="h-3 w-3 mx-1" />} {channel?.name}
                </label>
              </div>
              
              <div className="flex items-center space-x-1">
                <button type="button" className="mr-2 flex items-center justify-center h-6 w-6 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600"><Plus className="h-4 w-4" /></button>
                <button type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Type className="h-4 w-4" /></button>
                
                {/* Threads Emoji Deluxe Trigger */}
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-1.5 hover:text-yellow-400 transition rounded ${showEmojiPicker ? 'bg-gray-700 text-yellow-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'}`}
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-3 z-[1000]">
                      <EmojiDeluxe 
                        onSelect={(emoji) => {
                          setThreadReply(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }} 
                        onClose={() => setShowEmojiPicker(false)} 
                      />
                    </div>
                  )}
                </div>

                <button type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><AtSign className="h-4 w-4" /></button>
                <button type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><MoreHorizontal className="h-4 w-4" /></button>
                
                <div className="flex rounded overflow-hidden ml-1">
                  <button 
                    type="submit" 
                    disabled={!threadReply.trim()}
                    className="px-3 py-1.5 text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition-colors flex items-center justify-center"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <div className="w-px bg-green-800"></div>
                  <button type="button" disabled={!threadReply.trim()} className="px-1 py-1.5 text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition-colors flex items-center justify-center">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export function ThreadsView({ onNavigate }: { onNavigate: any }) {
  const { messages, currentUser, users, channels, setMessages, drafts, setDrafts } = useWorkspace();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadReply, setThreadReply] = useState('');
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<number>(5);
  const [showThreadEmojiPicker, setShowThreadEmojiPicker] = useState(false);
  const threadInputRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (activeThreadId) {
      const threadDraft = drafts.find(d => d.threadId === activeThreadId);
      setThreadReply(threadDraft?.text || '');
    } else {
      setThreadReply('');
    }
    setVisibleRepliesCount(5);
  }, [activeThreadId]);

  if (!currentUser) return null;

  // Find threads where the current user replied or started the thread
  const myThreads = messages.filter(m => m.replies.some(r => r.senderId === currentUser.id) || m.senderId === currentUser.id);

  const activeThread = messages.find(m => m.id === activeThreadId);
  const activeThreadChannel = activeThread ? channels.find(c => c.id === activeThread.channelId) : null;

  const handleThreadTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setThreadReply(text);
    if (!activeThreadId) return;
    
    const existingDrafts = drafts.filter(d => d.threadId !== activeThreadId);
    if (text.trim()) {
      setDrafts([...existingDrafts, { threadId: activeThreadId, text, timestamp: Date.now() }]);
    } else {
      setDrafts(existingDrafts);
    }
  };

  const applyRightFormat = (type: string) => {
    const ref = threadInputRef;
    if (!ref.current) return;
    
    const start = ref.current.selectionStart;
    const end = ref.current.selectionEnd;
    const currentText = threadReply;
    
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
    setThreadReply(newText);
    
    if (activeThreadId) {
      const existingDrafts = drafts.filter(d => d.threadId !== activeThreadId);
      if (newText.trim()) {
        setDrafts([...existingDrafts, { threadId: activeThreadId, text: newText, timestamp: Date.now() }]);
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

  const sendRightReply = (e: React.FormEvent) => {
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

  return (
    <div className="flex h-full bg-[#1A1D21] text-gray-300 w-full relative">
      {/* Middle/Main Scrollable List of Threads */}
      <div className={`flex flex-col h-full bg-[#1A1D21] transition-all duration-300 ${activeThreadId ? 'pr-[400px]' : ''} w-full`}>
        <div className="flex items-center px-6 py-4 border-b border-gray-800 bg-[#121317]">
          <MessageSquare className="h-5 w-5 mr-3 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-100">Threads</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {myThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
               <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
               <p>You don't have any active threads.</p>
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-none">
              {myThreads.map(msg => (
                <ThreadItem 
                  key={msg.id} 
                  msg={msg} 
                  onNavigate={onNavigate} 
                  onSelectThread={(id) => {
                    setActiveThreadId(id);
                    setVisibleRepliesCount(5);
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right-Side Pinned Thread Panel floating at the top right corner */}
      {activeThreadId && activeThread && (
        <div className="absolute top-4 right-4 bottom-4 w-[380px] flex flex-col bg-[#121317] border border-gray-700/80 rounded-2xl shadow-2xl z-20">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 bg-[#121317]">
            <h3 className="font-bold text-gray-100 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span>Thread</span>
            </h3>
            <button onClick={() => setActiveThreadId(null)} className="text-gray-500 hover:text-gray-300 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Original Message */}
            <div className="relative group flex mb-6 border-b border-[#2A2B32]/30 pb-6 hover:bg-[#2A2B32]/30 p-2 -mx-2 rounded transition-colors">
              <div className="h-10 w-10 bg-gray-700 rounded mr-3 shrink-0 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${users.find(u => u.id === activeThread.senderId)?.name}&backgroundColor=b6e3f4`} alt="" />
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
              <div className="flex justify-center my-3 border-b border-[#2A2B32]/10 pb-3">
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
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${replier?.name}&backgroundColor=b6e3f4`} alt="" />
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
          <div className="mx-4 mb-4 bg-[#1A1D21] border border-gray-700 rounded-lg overflow-hidden flex flex-col focus-within:border-gray-500">
            <div className="flex items-center px-2 py-1.5 space-x-0.5 border-b border-gray-700 bg-[#2A2B32]/30">
              <button type="button" onClick={() => applyRightFormat('bold')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Bold className="h-4 w-4" /></button>
              <button type="button" onClick={() => applyRightFormat('italic')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Italic className="h-4 w-4" /></button>
              <button type="button" onClick={() => applyRightFormat('strikethrough')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Strikethrough className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-gray-600 mx-1"></div>
              <button type="button" onClick={() => applyRightFormat('link')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><LinkIcon className="h-4 w-4" /></button>
              <button type="button" onClick={() => applyRightFormat('list-ol')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><ListOrdered className="h-4 w-4" /></button>
              <button type="button" onClick={() => applyRightFormat('list-ul')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><List className="h-4 w-4" /></button>
              <button type="button" onClick={() => applyRightFormat('quote')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><AlignLeft className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-gray-600 mx-1"></div>
              <button type="button" onClick={() => applyRightFormat('code')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Code className="h-4 w-4" /></button>
              <button type="button" onClick={() => applyRightFormat('codeblock')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><SquareSlash className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={sendRightReply} className="flex flex-col">
              <textarea 
                ref={threadInputRef}
                value={threadReply}
                onChange={handleThreadTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (threadReply.trim()) {
                      sendRightReply(e as any);
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
                    Also send to {activeThreadChannel?.isPrivate ? <Lock className="h-3 w-3 mx-1" /> : <Hash className="h-3 w-3 mx-1" />} {activeThreadChannel?.name}
                  </label>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button type="button" className="mr-2 flex items-center justify-center h-6 w-6 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600"><Plus className="h-4 w-4" /></button>
                  <button type="button" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"><Type className="h-4 w-4" /></button>
                  
                  {/* Thread Reply Emoji Deluxe Trigger */}
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setShowThreadEmojiPicker(!showThreadEmojiPicker)}
                      className={`p-1.5 hover:text-yellow-400 transition rounded ${showThreadEmojiPicker ? 'bg-gray-700 text-yellow-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'}`}
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

                  <button type="button" className="p-1.5 text-gray-405 hover:text-gray-200 hover:bg-gray-700 rounded"><AtSign className="h-4 w-4" /></button>
                  <button type="button" className="p-1.5 text-gray-405 hover:text-gray-200 hover:bg-gray-700 rounded"><MoreHorizontal className="h-4 w-4" /></button>
                  
                  <div className="flex rounded overflow-hidden ml-1">
                    <button 
                      type="submit" 
                      disabled={!threadReply.trim()}
                      className="px-3 py-1.5 text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition-colors flex items-center justify-center animate-pulse-once"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-green-800"></div>
                    <button type="button" disabled={!threadReply.trim()} className="px-1 py-1.5 text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition-colors flex items-center justify-center">
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
