import React from 'react';
import { useWorkspace } from '../context';

export function MessageReactions({ reactions, itemId }: { reactions?: string[], itemId: string }) {
  const { setMessages } = useWorkspace();

  if (!reactions || reactions.length === 0) return null;

  const handleToggle = (emoji: string) => {
    // If clicked, we deactivate it (remove it)
    setMessages(previous => previous.map(msg => {
      if (msg.id === itemId) {
        const current = msg.reactions || [];
        const updated = current.includes(emoji) ? [] : [emoji];
        return { ...msg, reactions: updated };
      }
      return {
        ...msg,
        replies: msg.replies.map(r => {
          if (r.id === itemId) {
            const current = r.reactions || [];
            const updated = current.includes(emoji) ? [] : [emoji];
            return { ...r, reactions: updated };
          }
          return r;
        })
      };
    }));
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((emoji, idx) => (
        <button 
          key={idx} 
          onClick={() => handleToggle(emoji)}
          title="Click to remove reaction"
          className="bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full px-2 py-0.5 text-xs cursor-pointer hover:bg-gray-700/80 hover:border-rose-500/40 hover:text-rose-400 transition"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
