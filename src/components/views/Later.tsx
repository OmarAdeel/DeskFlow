import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context';
import { Bookmark, Hash, Lock, Check, MessageSquare, Plus, Type, Smile, AtSign, MoreHorizontal, Send, ChevronDown, SmilePlus, Forward, MoreVertical } from 'lucide-react';
import { MessageActions } from '../MessageActions';
import { MessageReactions } from '../MessageReactions';
import { FormattedMessage } from '../FormattedMessage';

export function LaterView({ onNavigate }: { onNavigate: any }) {
  const { savedItems, messages, channels, users } = useWorkspace();
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Find saved original messages
  const savedMessages = messages.filter(msg => savedItems.includes(msg.id));
  
  // Find saved replies recursively (just mapping from messages for now as we only have 1 level)
  const savedReplies = messages.flatMap(msg => msg.replies.filter(reply => savedItems.includes(reply.id)));
  
  const allSaved = [...savedMessages, ...savedReplies].sort((a, b) => b.timestamp - a.timestamp);

  const getContextInfo = (item: any) => {
    // Determine if it's a message or reply
    const isReply = !('channelId' in item);
    let channelId = '';
    if (isReply) {
      const parentMsg = messages.find(m => m.replies.some(r => r.id === item.id));
      channelId = parentMsg ? parentMsg.channelId : '';
    } else {
      channelId = item.channelId;
    }
    
    const channel = channels.find(c => c.id === channelId);
    return { isReply, channel };
  };

  return (
    <div className="flex h-full bg-[#1A1D21] text-gray-300">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center px-6 py-4 border-b border-gray-800 bg-[#121317]">
          <Bookmark className="h-5 w-5 mr-3 text-blue-400" />
          <h2 className="text-xl font-bold text-gray-100">Later</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {allSaved.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Bookmark className="h-12 w-12 mb-4 opacity-50" />
              <p>You don't have any items saved for later.</p>
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-3xl">
              {allSaved.map((item: any) => {
                const { isReply, channel } = getContextInfo(item);
                const sender = users.find(u => u.id === item.senderId);
                
                return (
                  <div key={item.id} className="bg-[#121317] border border-gray-800 rounded-lg overflow-hidden">
                     {channel && (
                        <div className="flex items-center px-4 py-2 border-b border-gray-800 bg-[#1A1D21]/50 text-xs text-gray-400 font-medium cursor-pointer hover:bg-gray-800/50 transition-colors" onClick={() => onNavigate('channel', channel.id)}>
                          <span className="flex items-center text-blue-400 uppercase tracking-wide">
                             {channel.isPrivate ? <Lock className="h-3 w-3 mr-1" /> : <Hash className="h-3 w-3 mr-1" />}
                             {channel.name} 
                          </span>
                          <span className="ml-2 bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded flex items-center">
                             <Bookmark className="h-3 w-3 mr-1" /> Saved {isReply ? 'Reply' : 'Message'}
                          </span>
                        </div>
                     )}
                     
                     <div className="p-4 relative group">
                        <div className="flex">
                           <div className="h-10 w-10 bg-gray-700 rounded mr-4 shrink-0 overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sender?.name}&backgroundColor=b6e3f4`} alt={sender?.name} />
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-baseline mb-1">
                               <span className="font-bold text-gray-200 mr-2">{sender?.name}</span>
                               <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                             <div className="text-sm text-gray-300"><FormattedMessage text={item.text} /></div>
                             <MessageReactions reactions={item.reactions} itemId={item.id} />
                           </div>
                        </div>

                        <MessageActions itemId={item.id} onReply={() => {
                          setActiveReplyId(item.id);
                          setTimeout(() => replyInputRef.current?.focus(), 50);
                        }} />
                     </div>

                     {activeReplyId === item.id && (
                       <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                         <div className="bg-[#1A1D21] border border-gray-700 rounded-lg overflow-hidden flex flex-col focus-within:border-gray-500">
                           <form onSubmit={(e) => { e.preventDefault(); setActiveReplyId(null); setReplyText(''); }} className="flex flex-col">
                             <textarea 
                               ref={replyInputRef}
                               value={replyText}
                               onChange={(e) => setReplyText(e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter' && !e.shiftKey) {
                                   e.preventDefault();
                                   setActiveReplyId(null);
                                   setReplyText('');
                                 }
                               }}
                               placeholder="Reply..."
                               className="w-full bg-transparent border-none pl-4 pr-12 py-3 text-sm text-gray-200 focus:outline-none focus:ring-0 resize-none min-h-[60px]"
                             />
                             <div className="px-3 pb-2 flex items-center justify-between mt-1 border-t border-gray-800 pt-2">
                               <button 
                                 type="submit" 
                                 disabled={!replyText.trim()}
                                 className="px-3 py-1.5 ml-auto text-xs text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 transition-colors rounded"
                               >
                                 Reply
                               </button>
                             </div>
                           </form>
                         </div>
                       </div>
                     )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
