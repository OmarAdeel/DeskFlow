import React, { useState } from 'react';
import { 
  Search, MessageSquare, MessageCircle, Instagram, Facebook, 
  Send, CheckCircle2, Shield, ArrowLeft
} from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'messenger';
  handle: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  avatarBg: string;
  messages: { sender: string; text: string; time: string; isIncoming: boolean }[];
}

const mockConversations: Conversation[] = [
  { 
    id: 'conv_1', 
    name: 'Khaled El Sayed (FinCorp)', 
    platform: 'whatsapp', 
    handle: '+20 100 123 4567',
    lastMessage: 'Can we schedule a call for the Omnichannel WhatsApp Commerce Suite?', 
    time: '10:45 AM', 
    unread: true,
    avatarBg: 'bg-emerald-600',
    messages: [
      { sender: 'Khaled El Sayed', text: 'Hello team, we received the proposal details.', time: '10:30 AM', isIncoming: true },
      { sender: 'Khaled El Sayed', text: 'Can we schedule a call for the Omnichannel WhatsApp Commerce Suite?', time: '10:45 AM', isIncoming: true }
    ]
  },
  { 
    id: 'conv_2', 
    name: 'Esraa Al Barsiky (@esraa_tech)', 
    platform: 'instagram', 
    handle: '@esraa_tech',
    lastMessage: 'Loved the recent ad campaign on Instagram! Interested in enterprise pricing.', 
    time: 'Yesterday', 
    unread: false,
    avatarBg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
    messages: [
      { sender: 'Esraa Al Barsiky', text: 'Loved the recent ad campaign on Instagram! Interested in enterprise pricing.', time: 'Yesterday', isIncoming: true }
    ]
  },
  { 
    id: 'conv_3', 
    name: 'Demo Company Support Lead #1234', 
    platform: 'messenger', 
    handle: 'facebook.com/Demo Company',
    lastMessage: 'Thank you for the quick API webhook fix!', 
    time: 'Mon', 
    unread: false,
    avatarBg: 'bg-blue-600',
    messages: [
      { sender: 'Client Lead', text: 'Thank you for the quick API webhook fix!', time: 'Mon', isIncoming: true }
    ]
  },
];

export function ConversationsView() {
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConv, setSelectedConv] = useState<Conversation>(mockConversations[0]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return <MessageCircle className="h-4 w-4 text-emerald-400" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-400" />;
      case 'facebook': case 'messenger': return <Facebook className="h-4 w-4 text-blue-400" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesPlatform = selectedPlatformFilter === 'all' || c.platform === selectedPlatformFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    const newMsg = {
      sender: 'You (Agent)',
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isIncoming: false
    };

    const updated = conversations.map(c => {
      if (c.id === selectedConv.id) {
        return {
          ...c,
          lastMessage: replyText.trim(),
          messages: [...c.messages, newMsg],
          unread: false
        };
      }
      return c;
    });

    setConversations(updated);
    setSelectedConv({
      ...selectedConv,
      lastMessage: replyText.trim(),
      messages: [...selectedConv.messages, newMsg],
      unread: false
    });
    setReplyText('');
  };

  return (
    <div className="flex-1 bg-[#1A1D21] flex flex-col h-full text-gray-200 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-14 border-b border-gray-800/80 px-6 flex items-center justify-between shrink-0 bg-[#121317]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              Omnichannel Social Inbox
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full uppercase">Module 2</span>
            </h2>
            <p className="text-xs text-gray-400">Receive and respond to WhatsApp, Instagram, and Facebook Messenger DMs.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span className="flex items-center text-emerald-400 font-mono text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Omnichannel Webhooks Active
          </span>
        </div>
      </div>

      {/* Main Inbox View */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column: Conversations List */}
        <div className={`w-full md:w-80 border-r border-gray-800/80 bg-[#121317] flex-col shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Search & Platform Filters */}
          <div className="p-3 border-b border-gray-800/60 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search chats, handles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1D21] border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[11px]">
              <button
                onClick={() => setSelectedPlatformFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                  selectedPlatformFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-[#1A1D21] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedPlatformFilter('whatsapp')}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center space-x-1 ${
                  selectedPlatformFilter === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-[#1A1D21] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <MessageCircle className="h-3 w-3 text-emerald-400" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => setSelectedPlatformFilter('instagram')}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center space-x-1 ${
                  selectedPlatformFilter === 'instagram' ? 'bg-emerald-600 text-white' : 'bg-[#1A1D21] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <Instagram className="h-3 w-3 text-pink-400" />
                <span>Instagram</span>
              </button>
              <button
                onClick={() => setSelectedPlatformFilter('messenger')}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center space-x-1 ${
                  selectedPlatformFilter === 'messenger' ? 'bg-emerald-600 text-white' : 'bg-[#1A1D21] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <Facebook className="h-3 w-3 text-blue-400" />
                <span>Messenger</span>
              </button>
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-800/40">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">No social DMs found</div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div 
                    key={conv.id} 
                    onClick={() => {
                      setSelectedConv(conv);
                      setConversations(conversations.map(c => c.id === conv.id ? { ...c, unread: false } : c));
                      setMobileShowChat(true);
                    }}
                    className={`p-3.5 cursor-pointer transition select-none relative ${
                      isSelected ? 'bg-[#1A1D21] border-l-4 border-l-emerald-500' : 'hover:bg-[#1A1D21]/60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-full ${conv.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                          {conv.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`text-xs font-bold truncate ${conv.unread ? 'text-white' : 'text-gray-200'}`}>
                            {conv.name}
                          </h3>
                          <div className="flex items-center space-x-1 mt-0.5">
                            {getPlatformIcon(conv.platform)}
                            <span className="text-[10px] text-gray-400 capitalize truncate">{conv.platform}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono shrink-0">{conv.time}</span>
                    </div>

                    <p className={`text-xs line-clamp-1 mt-1 ${conv.unread ? 'text-emerald-300 font-medium' : 'text-gray-400'}`}>
                      {conv.lastMessage}
                    </p>

                    {conv.unread && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat View & Response Console */}
        <div className={`flex-1 flex flex-col bg-[#1A1D21] overflow-hidden ${mobileShowChat ? 'flex w-full' : 'hidden md:flex'}`}>
          {selectedConv ? (
            <>
              {/* Chat Top Bar */}
              <div className="h-14 border-b border-gray-800 px-3 md:px-6 flex items-center justify-between bg-[#121317] shrink-0">
                <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition mr-0.5 cursor-pointer shrink-0"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className={`w-8 h-8 rounded-full ${selectedConv.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                    {selectedConv.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-xs flex items-center gap-2 truncate">
                      <span className="truncate">{selectedConv.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">({selectedConv.handle})</span>
                    </h3>
                    <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 truncate">
                      {getPlatformIcon(selectedConv.platform)}
                      <span className="capitalize truncate">{selectedConv.platform} Messaging Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-[#1A1D21]">
                {selectedConv.messages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex flex-col ${msg.isIncoming ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-gray-500">
                      <span className="font-semibold text-gray-400">{msg.sender}</span>
                      <span>•</span>
                      <span className="font-mono">{msg.time}</span>
                    </div>
                    <div className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                      msg.isIncoming 
                        ? 'bg-[#121317] text-gray-200 border border-gray-800 rounded-tl-xs' 
                        : 'bg-emerald-600 text-white rounded-tr-xs'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Response Composer */}
              <div className="p-4 border-t border-gray-800 bg-[#121317] shrink-0">
                <form onSubmit={handleSendReply} className="space-y-2">
                  <div className="relative">
                    <textarea 
                      rows={3}
                      placeholder={`Transmit reply to ${selectedConv.name} via ${selectedConv.platform}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                      <span className="flex items-center text-emerald-400 font-mono text-[10px]">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Live Social Dispatch
                      </span>
                    </div>

                    <button 
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-emerald-900/30"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Social Reply</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <MessageCircle className="h-10 w-10 mb-3 opacity-40 text-emerald-500" />
              <p className="text-xs">Select a social conversation to read and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
