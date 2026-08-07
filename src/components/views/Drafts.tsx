import React from 'react';
import { canAccessChannel, useWorkspace } from '../../context';
import { FileEdit, Hash, Lock } from 'lucide-react';

export function DraftsView({ onNavigate }: { onNavigate: any }) {
  const { drafts, channels, users, currentUser, activeOrganizationId } = useWorkspace();

  return (
    <div className="flex flex-col h-full bg-[#1A1D21] text-gray-300">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-gray-800 bg-[#121317]">
        <FileEdit className="h-5 w-5 mr-3 text-gray-400" />
        <h2 className="text-xl font-bold text-gray-100">Drafts</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileEdit className="h-12 w-12 mb-4 opacity-50" />
            <p>You don't have any drafts right now.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {drafts.map((draft, idx) => {
              const channel = channels.find(c => c.id === draft.channelId);
              if (channel && !canAccessChannel(channel, currentUser, activeOrganizationId)) return null;
              return (
                <div 
                  key={idx} 
                  className="bg-[#121317] border border-gray-800 rounded-xl p-4 hover:border-gray-700 cursor-pointer transition-colors"
                  onClick={() => channel && onNavigate('channel', channel.id)}
                >
                  <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
                    {channel?.isPrivate ? <Lock className="h-3.5 w-3.5 mr-1" /> : <Hash className="h-3.5 w-3.5 mr-1" />}
                    {channel?.name || 'Unknown Channel'}
                    {draft.threadId && <span className="ml-2 bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-xs flex items-center">Thread Draft</span>}
                    <span className="mx-2">•</span>
                    <span className="text-xs">{new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-gray-200">
                    {draft.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
