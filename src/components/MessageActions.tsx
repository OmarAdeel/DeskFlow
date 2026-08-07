import React, { useState } from 'react';
import { Check, SmilePlus, MessageSquare, Forward, Bookmark, MoreVertical, Link as LinkIcon, X, Search, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { useWorkspace } from '../context';
import { EmojiDeluxe } from './EmojiDeluxe';
import { UserAvatar } from './UserAvatar';

interface MessageActionsProps {
  itemId: string;
  onReply?: () => void;
}

const WHATSAPP_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥', '👏', '🚀'];

export function MessageActions({ itemId, onReply }: MessageActionsProps) {
  const { savedItems, setSavedItems, messages, setMessages, users, channels, setChannels, currentUser } = useWorkspace();
  const isSaved = savedItems.includes(itemId);
  const [showToast, setShowToast] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [forwardSearch, setForwardSearch] = useState('');
  const [forwardedUserIds, setForwardedUserIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  const parentMessage = messages.find(message => message.id === itemId || message.replies.some(reply => reply.id === itemId));
  const item = parentMessage?.id === itemId ? parentMessage : parentMessage?.replies.find(reply => reply.id === itemId);
  const isAuthor = Boolean(item && currentUser?.id === item.senderId);
  const canEdit = Boolean(isAuthor && item && Date.now() - item.timestamp < 5 * 60 * 1000);
  const canDelete = Boolean(item && (currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin'));

  const toggleSaved = () => {
    setSavedItems(previousItems => previousItems.includes(itemId)
      ? previousItems.filter(id => id !== itemId)
      : [...previousItems, itemId]
    );
  };

  const getChannelIdAndMessageText = () => {
    const parentMsg = messages.find(m => m.id === itemId || m.replies.some(r => r.id === itemId));
    let channelId = parentMsg?.channelId || '4';
    let text = '';
    if (parentMsg) {
      if (parentMsg.id === itemId) {
        text = parentMsg.text;
      } else {
        const reply = parentMsg.replies.find(r => r.id === itemId);
        text = reply?.text || '';
      }
    }
    return { channelId, text };
  };

  const startEditing = () => {
    if (!item || !canEdit) return;
    setEditedText(item.text);
    setShowMoreMenu(false);
    setIsEditing(true);
  };

  const saveEdit = () => {
    const text = editedText.trim();
    if (!text || !item || !parentMessage) return;
    if (!isAuthor || Date.now() - item.timestamp >= 5 * 60 * 1000) {
      setIsEditing(false);
      setShowToast('The five-minute editing window has expired.');
      setTimeout(() => setShowToast(''), 3000);
      return;
    }
    setMessages(previous => previous.map(message => message.id === parentMessage.id
      ? message.id === itemId
        ? { ...message, text }
        : { ...message, replies: message.replies.map(reply => reply.id === itemId ? { ...reply, text } : reply) }
      : message
    ));
    setIsEditing(false);
    setShowToast('Message updated.');
    setTimeout(() => setShowToast(''), 2500);
  };

  const deleteItem = () => {
    if (!canDelete || !parentMessage || !window.confirm('Delete this message permanently?')) return;
    setMessages(previous => parentMessage.id === itemId
      ? previous.filter(message => message.id !== itemId)
      : previous.map(message => message.id === parentMessage.id
        ? { ...message, replies: message.replies.filter(reply => reply.id !== itemId) }
        : message)
    );
    const deletedIds = parentMessage.id === itemId ? [itemId, ...parentMessage.replies.map(reply => reply.id)] : [itemId];
    setSavedItems(previous => previous.filter(savedId => !deletedIds.includes(savedId)));
    setShowMoreMenu(false);
  };

  const copyLink = () => {
    const { channelId } = getChannelIdAndMessageText();
    const parentMessage = messages.find(message => message.id === itemId || message.replies.some(reply => reply.id === itemId));
    const shareParams = new URLSearchParams({
      view: 'channel',
      channelId,
      messageId: parentMessage?.id || itemId
    });
    if (parentMessage && parentMessage.id !== itemId) {
      shareParams.set('replyId', itemId);
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?${shareParams.toString()}`;

    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShowMoreMenu(false);
        setShowToast(parentMessage && parentMessage.id !== itemId ? 'Link to this comment copied!' : 'Link to this thread copied!');
        setTimeout(() => setShowToast(''), 3000);
      })
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
        setShowToast('Failed to copy link');
        setTimeout(() => setShowToast(''), 2000);
      });
  };

  const [pickerPlacement, setPickerPlacement] = useState<'top' | 'bottom'>('top');

  const handleTogglePicker = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!showEmojiPicker) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.top < 380) {
        setPickerPlacement('bottom');
      } else {
        setPickerPlacement('top');
      }
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  const selectEmoji = (emoji: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === itemId) {
        const current = msg.reactions || [];
        // Only one emoji per time: deactivate if same emoji is clicked, or replace with single select
        const isAlreadySelected = current.includes(emoji);
        const updated = isAlreadySelected ? [] : [emoji];
        return { ...msg, reactions: updated };
      }
      return {
        ...msg,
        replies: msg.replies.map(r => {
          if (r.id === itemId) {
            const current = r.reactions || [];
            const isAlreadySelected = current.includes(emoji);
            const updated = isAlreadySelected ? [] : [emoji];
            return { ...r, reactions: updated };
          }
          return r;
        })
      };
    }));
    setShowEmojiPicker(false);
  };

  const handleForwardToUser = (user: any) => {
    let targetChanId = '';
    const firstWord = user.name.toLowerCase().split(' ')[0];
    const existingChannel = channels.find(c => {
      const slugName = c.name.toLowerCase();
      return slugName.includes(firstWord) && slugName.includes('communication');
    });

    if (existingChannel) {
      targetChanId = existingChannel.id;
    } else {
      // Create a communication channel on the fly
      const newChanId = `chan_${Date.now()}`;
      const newChan = {
        id: newChanId,
        name: `${firstWord}-communication-channel`,
        isPrivate: true,
        memberIds: Array.from(new Set([currentUser?.id || '8', user.id]))
      };
      setChannels([...channels, newChan]);
      targetChanId = newChanId;
    }

    const { text } = getChannelIdAndMessageText();
    const forwardMsg = {
      id: `msg_f_${Date.now()}`,
      channelId: targetChanId,
      senderId: currentUser?.id || '8',
      text: `*Forwarded message:*\n${text}`,
      timestamp: Date.now(),
      isRead: false,
      replies: []
    };

    setMessages([...messages, forwardMsg]);
    setForwardedUserIds(prev => [...prev, user.id]);
    setShowToast(`Message forwarded to ${user.name} successfully!`);
    setTimeout(() => setShowToast(''), 3000);
  };

  const markComplete = () => {
    setMessages(messages.map(msg => {
      if (msg.id === itemId) {
        const current = msg.reactions || [];
        const updated = current.includes('✅') ? [] : ['✅'];
        return { ...msg, reactions: updated };
      }
      return {
        ...msg,
        replies: msg.replies.map(r => {
          if (r.id === itemId) {
            const current = r.reactions || [];
            const updated = current.includes('✅') ? [] : ['✅'];
            return { ...r, reactions: updated };
          }
          return r;
        })
      };
    }));
  };

  // Filter users inside forward modal
  const otherUsers = users.filter(u => u.id !== currentUser?.id);
  const filteredUsersForForward = otherUsers.filter(u => 
    u.name.toLowerCase().includes(forwardSearch.toLowerCase()) || 
    (u.title && u.title.toLowerCase().includes(forwardSearch.toLowerCase()))
  );

  return (
    <>
      <div className="absolute right-2 -top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-[#1A1D21] border border-gray-700 rounded shadow-sm z-20">
         <button onClick={markComplete} title="Mark complete" className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-green-500 transition-colors bg-[#1A1D21] border-r border-gray-700 rounded-l"><Check className="h-4 w-4" /></button>
         
         {/* Emoji reaction selector */}
         <div className="relative">
           <button 
             onClick={handleTogglePicker} 
             title="Add reaction" 
             className={`p-1.5 hover:bg-gray-700 transition-colors bg-[#1A1D21] ${showEmojiPicker ? 'text-yellow-400 bg-gray-700' : 'text-gray-400 hover:text-gray-200'}`}
           >
             <SmilePlus className="h-4 w-4" />
           </button>
           
           {showEmojiPicker && (
             <div className={`absolute right-0 ${pickerPlacement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} z-[999]`}>
               <EmojiDeluxe onSelect={selectEmoji} onClose={() => setShowEmojiPicker(false)} />
             </div>
           )}
         </div>

         {onReply && <button onClick={onReply} id={`view-thread-btn-${itemId}`} title="View Thread" className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors bg-[#1A1D21]"><MessageSquare className="h-4 w-4" /></button>}
         <button onClick={() => { setShowForwardModal(true); setForwardedUserIds([]); setForwardSearch(''); }} title="Forward message" className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors bg-[#1A1D21]"><Forward className="h-4 w-4" /></button>
         <button onClick={toggleSaved} title={isSaved ? "Remove from later" : "Save for later"} className={`p-1.5 hover:bg-gray-700 ${isSaved ? 'text-blue-500' : 'text-gray-400'} hover:text-blue-400 transition-colors bg-[#1A1D21]`}>
           <Bookmark className="h-4 w-4" />
         </button>
         <div className="relative">
           <button onClick={() => setShowMoreMenu(previous => !previous)} title="More actions" aria-label="More actions" aria-expanded={showMoreMenu} className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors bg-[#1A1D21] rounded-r"><MoreVertical className="h-4 w-4" /></button>
           {showMoreMenu && (
             <div className="absolute right-0 top-full mt-1 w-44 bg-[#121317] border border-gray-700 rounded-lg shadow-2xl py-1 z-[1000]">
               <button onClick={copyLink} className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                 <LinkIcon className="h-3.5 w-3.5 text-blue-400" />
                 <span>Copy link</span>
               </button>
               {canEdit && <button onClick={startEditing} className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"><Pencil className="h-3.5 w-3.5 text-amber-400" /><span>Edit message</span></button>}
               {canDelete && <button onClick={deleteItem} className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"><Trash2 className="h-3.5 w-3.5" /><span>Delete message</span></button>}
             </div>
           )}
         </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setIsEditing(false)}>
          <div className="bg-[#1A1D21] border border-gray-700 rounded-xl w-full max-w-lg p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-white">Edit message</h3><button type="button" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <textarea value={editedText} onChange={event => setEditedText(event.target.value)} rows={5} autoFocus className="w-full rounded-lg border border-gray-700 bg-[#121317] px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-y" />
            <p className="mt-2 text-[10px] text-gray-500">Messages can be edited for five minutes after posting.</p>
            <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setIsEditing(false)} className="px-3 py-2 text-xs text-gray-400 hover:text-white">Cancel</button><button type="button" onClick={saveEdit} disabled={!editedText.trim() || !canEdit} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white">Save changes</button></div>
          </div>
        </div>
      )}

      {/* Forward Message Modal Popup */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowForwardModal(false)}>
          <div className="bg-[#1A1D21] border border-gray-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] transition-all transform scale-100" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center">
                  <Forward className="h-4 w-4 mr-2 text-blue-400" />
                  Forward Message
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Select a team member to forward this message to</p>
              </div>
              <button 
                onClick={() => setShowForwardModal(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-3 border-b border-gray-800 shrink-0 bg-[#121317]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Search team members by name or role..."
                  value={forwardSearch}
                  onChange={(e) => setForwardSearch(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Modal Users List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[350px] custom-scrollbar">
              {filteredUsersForForward.length > 0 ? (
                filteredUsersForForward.map((user) => {
                  const hasBeenForwarded = forwardedUserIds.includes(user.id);
                  return (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#222529]/60 transition border border-transparent hover:border-gray-800 group/item"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* User Avatar */}
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-gray-700 border border-gray-600 flex items-center justify-center relative">
                          <UserAvatar
                            user={user}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* User Metadata */}
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-200 truncate group-hover/item:text-white transition-colors">
                            {user.name}
                          </h4>
                          {user.title && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{user.title}</p>
                          )}
                        </div>
                      </div>

                      {/* Forward CTA Button */}
                      <button
                        onClick={() => handleForwardToUser(user)}
                        disabled={hasBeenForwarded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
                          hasBeenForwarded 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold' 
                            : 'bg-[#2B4BCA] text-white hover:bg-[#1E3BB3] py-1.5 px-3.5 shadow-sm'
                        }`}
                      >
                        {hasBeenForwarded ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Forwarded</span>
                          </>
                        ) : (
                          <span>Send</span>
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <p className="text-sm text-gray-400">No team members match "{forwardSearch}"</p>
                  <p className="text-xs text-gray-500 mt-1">Try searching for other name keywords or roles</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-gray-800 flex justify-end shrink-0 bg-[#121317]">
              <button 
                onClick={() => setShowForwardModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 flex items-center space-x-2 animate-fade-in-up">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-sm font-medium text-gray-100">{showToast}</span>
          <button onClick={() => setShowToast('')} className="ml-3 text-gray-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
