import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, Hash, Lock, User, Send, MessageSquare, Check, Sparkles,
  Smile, Paperclip, Bold, Italic, Code, AtSign, ArrowRight, Pin
} from 'lucide-react';
import { useWorkspace, Channel, WorkspaceUser } from '../context';
import { ViewType } from '../types';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType, id?: string) => void;
}

export function NewMessageModal({ isOpen, onClose, onNavigate }: NewMessageModalProps) {
  const { channels, users, currentUser, messages, setMessages } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<{ type: 'channel' | 'user'; data: Channel | WorkspaceUser } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | 'people' | 'channels'>('all');
  
  // Pinned items state (persisted to localStorage)
  const [pinnedUserIds, setPinnedUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('demo_pinned_users');
      return saved ? JSON.parse(saved) : ['1', '2']; // Default pinned users
    } catch {
      return ['1', '2'];
    }
  });

  const [pinnedChannelIds, setPinnedChannelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('demo_pinned_channels');
      return saved ? JSON.parse(saved) : ['1', '4']; // Default pinned channels
    } catch {
      return ['1', '4'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('demo_pinned_users', JSON.stringify(pinnedUserIds));
    } catch (e) {
      console.error(e);
    }
  }, [pinnedUserIds]);

  useEffect(() => {
    try {
      localStorage.setItem('demo_pinned_channels', JSON.stringify(pinnedChannelIds));
    } catch (e) {
      console.error(e);
    }
  }, [pinnedChannelIds]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedTarget(null);
      setMessageText('');
      setActiveFilter('all');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePinUser = (userId: string) => {
    setPinnedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const togglePinChannel = (channelId: string) => {
    setPinnedChannelIds(prev => 
      prev.includes(channelId) ? prev.filter(id => id !== channelId) : [...prev, channelId]
    );
  };

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (u.title && u.title.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  );

  const pinnedUsersList = filteredUsers.filter(u => pinnedUserIds.includes(u.id));
  const pinnedChannelsList = filteredChannels.filter(c => pinnedChannelIds.includes(c.id));
  const totalPinnedCount = pinnedUserIds.length + pinnedChannelIds.length;

  const handleSelectChannel = (channel: Channel) => {
    setSelectedTarget({ type: 'channel', data: channel });
    setTimeout(() => textInputRef.current?.focus(), 100);
  };

  const handleSelectUser = (user: WorkspaceUser) => {
    setSelectedTarget({ type: 'user', data: user });
    setTimeout(() => textInputRef.current?.focus(), 100);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTarget) return;

    if (selectedTarget.type === 'channel') {
      const channel = selectedTarget.data as Channel;
      if (messageText.trim()) {
        const newMessage = {
          id: 'msg_' + Date.now(),
          channelId: channel.id,
          senderId: currentUser?.id || '8',
          text: messageText.trim(),
          timestamp: Date.now(),
          isRead: true,
          replies: []
        };
        setMessages([...messages, newMessage]);
      }
      onNavigate('channel', channel.id);
    } else {
      const user = selectedTarget.data as WorkspaceUser;
      if (messageText.trim()) {
        const event = new CustomEvent('send-dm-message', {
          detail: { userId: user.id, text: messageText.trim() }
        });
        window.dispatchEvent(event);
      }
      onNavigate('dms', user.id);
    }

    onClose();
  };

  const handleQuickJump = (type: 'channel' | 'user', data: Channel | WorkspaceUser) => {
    if (type === 'channel') {
      onNavigate('channel', data.id);
    } else {
      onNavigate('dms', data.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-14 px-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#121317] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/80 flex justify-between items-center bg-[#1A1D21]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">New Message</h3>
              <p className="text-xs text-gray-400">Search or select pinned teammates & active channels</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Recipient selection bar */}
        <div className="p-4 border-b border-gray-800/60 bg-[#121317]">
          <div className="flex items-center bg-[#1A1D21] border border-gray-700/80 rounded-xl px-4 py-2.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
            <span className="text-xs font-bold text-gray-400 uppercase mr-3 shrink-0">To:</span>
            
            {selectedTarget ? (
              <div className="flex items-center bg-blue-600/20 border border-blue-500/40 text-blue-300 rounded-lg px-2.5 py-1 text-xs font-semibold mr-2 shrink-0">
                {selectedTarget.type === 'channel' ? (
                  <span className="flex items-center">
                    <Hash className="h-3.5 w-3.5 mr-1" />
                    {(selectedTarget.data as Channel).name}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <User className="h-3.5 w-3.5 mr-1" />
                    {(selectedTarget.data as WorkspaceUser).name}
                  </span>
                )}
                <button 
                  onClick={() => setSelectedTarget(null)}
                  className="ml-2 hover:text-white text-blue-400 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}

            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={selectedTarget ? "Type a message below or search another..." : "Search by person, name, email or channel (#)..."}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white mr-2">
                <X className="h-4 w-4" />
              </button>
            )}
            <Search className="h-4 w-4 text-gray-500 shrink-0" />
          </div>

          {/* Filter Pills */}
          <div className="flex space-x-2 mt-3 text-xs font-medium overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-md transition cursor-pointer shrink-0 ${
                activeFilter === 'all' 
                  ? 'bg-gray-800 text-white font-bold' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              All ({channels.length + users.length})
            </button>
            <button
              onClick={() => setActiveFilter('pinned')}
              className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                activeFilter === 'pinned' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' 
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Pin className="h-3 w-3 fill-amber-400/80" />
              <span>Pinned ({totalPinnedCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('people')}
              className={`px-3 py-1 rounded-md transition cursor-pointer shrink-0 ${
                activeFilter === 'people' 
                  ? 'bg-blue-600 text-white font-bold' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              People ({users.length})
            </button>
            <button
              onClick={() => setActiveFilter('channels')}
              className={`px-3 py-1 rounded-md transition cursor-pointer shrink-0 ${
                activeFilter === 'channels' 
                  ? 'bg-blue-600 text-white font-bold' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              Channels ({channels.length})
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar min-h-[220px]">
          
          {/* PINNED SECTION (Always shown at top when activeFilter is 'all' or 'pinned', if there are pinned items) */}
          {(activeFilter === 'all' || activeFilter === 'pinned') && (pinnedUsersList.length > 0 || pinnedChannelsList.length > 0) && (
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Pin className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>Pinned Active Work Items</span>
                </div>
                <span className="text-[10px] text-amber-400/70 font-mono">{pinnedUsersList.length + pinnedChannelsList.length} pinned</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Pinned Teammates */}
                {pinnedUsersList.map((user) => {
                  const isSelected = selectedTarget?.type === 'user' && selectedTarget.data.id === user.id;
                  return (
                    <div
                      key={`pinned_user_${user.id}`}
                      onClick={() => handleSelectUser(user)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-blue-900/40 border-blue-400 text-white shadow-md' 
                          : 'bg-[#1A1D21] border-amber-500/30 hover:border-amber-400 hover:bg-[#22252B] text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center font-bold text-white text-xs">
                            {user.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#121317]" />
                        </div>
                        <div className="truncate">
                          <h5 className="font-semibold text-xs text-white truncate group-hover:text-amber-300 transition">
                            {user.name}
                          </h5>
                          <p className="text-[10px] text-gray-400 truncate">
                            {user.title || user.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinUser(user.id);
                          }}
                          className="p-1 text-amber-400 hover:text-amber-200 hover:bg-amber-950/60 rounded transition"
                          title="Unpin User"
                        >
                          <Pin className="h-3.5 w-3.5 fill-amber-400" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickJump('user', user);
                          }}
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded transition"
                          title="Open DM"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pinned Channels */}
                {pinnedChannelsList.map((channel) => {
                  const isSelected = selectedTarget?.type === 'channel' && selectedTarget.data.id === channel.id;
                  return (
                    <div
                      key={`pinned_chan_${channel.id}`}
                      onClick={() => handleSelectChannel(channel)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-blue-900/40 border-blue-400 text-white shadow-md' 
                          : 'bg-[#1A1D21] border-amber-500/30 hover:border-amber-400 hover:bg-[#22252B] text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                          {channel.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                        </div>
                        <div className="truncate">
                          <h5 className="font-semibold text-xs text-white truncate group-hover:text-amber-300 transition">
                            # {channel.name}
                          </h5>
                          <p className="text-[10px] text-amber-400/80">Pinned Channel</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinChannel(channel.id);
                          }}
                          className="p-1 text-amber-400 hover:text-amber-200 hover:bg-amber-950/60 rounded transition"
                          title="Unpin Channel"
                        >
                          <Pin className="h-3.5 w-3.5 fill-amber-400" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickJump('channel', channel);
                          }}
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded transition"
                          title="Open Channel"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* People Section */}
          {(activeFilter === 'all' || activeFilter === 'people') && filteredUsers.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 flex justify-between">
                <span>Teammates ({filteredUsers.length})</span>
                <span className="text-gray-500 text-[10px]">Click pin to keep at top</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedTarget?.type === 'user' && selectedTarget.data.id === user.id;
                  const isPinned = pinnedUserIds.includes(user.id);

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-blue-900/30 border-blue-500 text-white' 
                          : 'bg-[#1A1D21] border-gray-800/80 hover:border-blue-500/50 hover:bg-[#22252B] text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                            {user.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#121317]" />
                        </div>
                        <div className="truncate">
                          <h5 className="font-semibold text-xs text-white truncate group-hover:text-blue-400 transition flex items-center">
                            {user.name}
                            {isPinned && <Pin className="h-3 w-3 ml-1 text-amber-400 fill-amber-400 inline shrink-0" />}
                          </h5>
                          <p className="text-[11px] text-gray-400 truncate">
                            {user.title || user.role} • {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinUser(user.id);
                          }}
                          className={`p-1.5 rounded transition cursor-pointer ${
                            isPinned 
                              ? 'text-amber-400 bg-amber-950/50 hover:bg-amber-900/60' 
                              : 'text-gray-500 opacity-0 group-hover:opacity-100 hover:text-amber-300 hover:bg-gray-800'
                          }`}
                          title={isPinned ? "Unpin user" : "Pin user to top"}
                        >
                          <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickJump('user', user);
                          }}
                          className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700/60 rounded transition"
                          title="Open Direct Message"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Channels Section */}
          {(activeFilter === 'all' || activeFilter === 'channels') && filteredChannels.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 flex justify-between">
                <span>Workspace Channels ({filteredChannels.length})</span>
                <span className="text-gray-500 text-[10px]">Click pin to keep at top</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredChannels.map((channel) => {
                  const isSelected = selectedTarget?.type === 'channel' && selectedTarget.data.id === channel.id;
                  const isPinned = pinnedChannelIds.includes(channel.id);

                  return (
                    <div
                      key={channel.id}
                      onClick={() => handleSelectChannel(channel)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-blue-900/30 border-blue-500 text-white' 
                          : 'bg-[#1A1D21] border-gray-800/80 hover:border-blue-500/50 hover:bg-[#22252B] text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700/60 flex items-center justify-center text-gray-400 group-hover:text-blue-400 shrink-0">
                          {channel.isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                        </div>
                        <div className="truncate">
                          <h5 className="font-semibold text-xs text-white truncate group-hover:text-blue-400 transition flex items-center">
                            # {channel.name}
                            {isPinned && <Pin className="h-3 w-3 ml-1 text-amber-400 fill-amber-400 inline shrink-0" />}
                          </h5>
                          <p className="text-[11px] text-gray-400">
                            {channel.isPrivate ? 'Private Channel' : 'Public Workspace Channel'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinChannel(channel.id);
                          }}
                          className={`p-1.5 rounded transition cursor-pointer ${
                            isPinned 
                              ? 'text-amber-400 bg-amber-950/50 hover:bg-amber-900/60' 
                              : 'text-gray-500 opacity-0 group-hover:opacity-100 hover:text-amber-300 hover:bg-gray-800'
                          }`}
                          title={isPinned ? "Unpin channel" : "Pin channel to top"}
                        >
                          <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickJump('channel', channel);
                          }}
                          className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700/60 rounded transition"
                          title="Open Channel"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeFilter === 'pinned' && totalPinnedCount === 0 && (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Pin className="h-8 w-8 mx-auto text-amber-500/50" />
              <p className="text-sm font-semibold text-white">No items pinned yet</p>
              <p className="text-xs text-gray-400">Click the pin icon on any teammate or channel to pin them here for quick access.</p>
            </div>
          )}

          {filteredUsers.length === 0 && filteredChannels.length === 0 && activeFilter !== 'pinned' && (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Search className="h-8 w-8 mx-auto text-gray-600" />
              <p className="text-sm">No teammates or channels found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Bottom Message Composition Footer */}
        <div className="p-4 bg-[#1A1D21] border-t border-gray-800/80 space-y-3">
          {selectedTarget ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                <span>Composing to: <strong className="text-blue-400">
                  {selectedTarget.type === 'channel' ? `# ${(selectedTarget.data as Channel).name}` : (selectedTarget.data as WorkspaceUser).name}
                </strong></span>
                <span className="text-[11px] text-gray-500">Press Enter to send, Shift+Enter for new line</span>
              </div>
              <div className="relative border border-gray-700 rounded-xl bg-[#121317] p-2 flex flex-col focus-within:border-blue-500 transition">
                <textarea
                  ref={textInputRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Write your message to ${
                    selectedTarget.type === 'channel' 
                      ? `# ${(selectedTarget.data as Channel).name}` 
                      : (selectedTarget.data as WorkspaceUser).name
                  }...`}
                  rows={2}
                  className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 resize-none custom-scrollbar p-1"
                />

                <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 mt-1">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <button className="p-1 hover:text-white hover:bg-gray-800 rounded transition"><Bold className="h-3.5 w-3.5" /></button>
                    <button className="p-1 hover:text-white hover:bg-gray-800 rounded transition"><Italic className="h-3.5 w-3.5" /></button>
                    <button className="p-1 hover:text-white hover:bg-gray-800 rounded transition"><Code className="h-3.5 w-3.5" /></button>
                    <button className="p-1 hover:text-white hover:bg-gray-800 rounded transition"><Smile className="h-3.5 w-3.5" /></button>
                    <button className="p-1 hover:text-white hover:bg-gray-800 rounded transition"><Paperclip className="h-3.5 w-3.5" /></button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuickJump(selectedTarget.type, selectedTarget.data)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                    >
                      Open view
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-900/20"
                    >
                      <span>Send</span>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-gray-400 py-1">
              <span>Select a teammate or channel above to compose and start sending messages.</span>
              <span className="text-gray-500 text-[11px]">ESC to close</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

