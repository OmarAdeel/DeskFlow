import React, { useMemo, useState } from 'react';
import { AtSign, Bell, Check, Hash, Lock, MessageCircle, Smile } from 'lucide-react';
import { canAccessChannel, useWorkspace, Message, Reply } from '../../context';
import { ViewType } from '../../types';
import { UserAvatar } from '../UserAvatar';
import { FormattedMessage } from '../FormattedMessage';

type ActivityFilter = 'all' | 'mentions' | 'reactions';

interface MentionItem {
  id: string;
  messageId: string;
  replyId?: string;
  channelId: string;
  kind: 'mention' | 'reaction';
  text: string;
  timestamp: number;
  senderId: string;
  senderName: string;
  isRead: boolean;
  reactions?: string[];
}

interface MentionsViewProps {
  onNavigate?: (
    view: ViewType,
    channelId?: string,
    options?: { messageId?: string; replyId?: string }
  ) => void;
}

export function MentionsView({ onNavigate }: MentionsViewProps) {
  const { messages, setMessages, channels, users, currentUser, activeOrganizationId } = useWorkspace();
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const accessibleMessages = useMemo(() => messages.filter(message => {
    const channel = channels.find(item => item.id === message.channelId);
    return Boolean(channel && canAccessChannel(channel, currentUser, activeOrganizationId));
  }), [messages, channels, currentUser, activeOrganizationId]);

  const mentionPatterns = useMemo(() => {
    if (!currentUser) return [];
    const tokens = [currentUser.name, currentUser.username || '', currentUser.email.split('@')[0]]
      .map(value => value.trim().toLowerCase())
      .filter(Boolean);

    return Array.from(new Set(tokens)).map(token => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      return new RegExp(`(^|\\s)@?${escaped}(?=$|[^a-z0-9_.-])`, 'i');
    });
  }, [currentUser]);

  const isMentioned = (text: string) => mentionPatterns.some(pattern => pattern.test(text));

  const items = useMemo<MentionItem[]>(() => {
    const next: MentionItem[] = [];
    accessibleMessages.forEach((message: Message) => {
      const sender = users.find(user => user.id === message.senderId);
      if (message.senderId !== currentUser?.id && isMentioned(message.text)) {
        next.push({
          id: `mention-${message.id}`,
          messageId: message.id,
          channelId: message.channelId,
          kind: 'mention',
          text: message.text,
          timestamp: message.timestamp,
          senderId: message.senderId,
          senderName: sender?.name || 'Workspace member',
          isRead: message.isRead
        });
      }
      if (message.senderId === currentUser?.id && message.reactions?.length) {
        next.push({
          id: `reaction-${message.id}`,
          messageId: message.id,
          channelId: message.channelId,
          kind: 'reaction',
          text: message.text,
          timestamp: message.timestamp,
          senderId: message.senderId,
          senderName: sender?.name || 'You',
          isRead: true,
          reactions: message.reactions
        });
      }
      message.replies.forEach((reply: Reply) => {
        const replySender = users.find(user => user.id === reply.senderId);
        if (reply.senderId !== currentUser?.id && isMentioned(reply.text)) {
          next.push({
            id: `mention-${reply.id}`,
            messageId: message.id,
            replyId: reply.id,
            channelId: message.channelId,
            kind: 'mention',
            text: reply.text,
            timestamp: reply.timestamp,
            senderId: reply.senderId,
            senderName: replySender?.name || 'Workspace member',
            isRead: reply.isRead
          });
        }
        if (reply.senderId === currentUser?.id && reply.reactions?.length) {
          next.push({
            id: `reaction-${reply.id}`,
            messageId: message.id,
            replyId: reply.id,
            channelId: message.channelId,
            kind: 'reaction',
            text: reply.text,
            timestamp: reply.timestamp,
            senderId: reply.senderId,
            senderName: replySender?.name || 'You',
            isRead: true,
            reactions: reply.reactions
          });
        }
      });
    });
    return next.sort((left, right) => right.timestamp - left.timestamp);
  }, [accessibleMessages, users, currentUser, mentionPatterns]);

  const filteredItems = items.filter(item => filter === 'all' || (filter === 'mentions' ? item.kind === 'mention' : item.kind === 'reaction'));
  const unreadCount = items.filter(item => item.kind === 'mention' && !item.isRead).length;
  const mentionCount = items.filter(item => item.kind === 'mention').length;
  const reactionCount = items.filter(item => item.kind === 'reaction').length;

  const openItem = (item: MentionItem) => {
    onNavigate?.('channel', item.channelId, { messageId: item.messageId, replyId: item.replyId });
  };

  const markMentionRead = (item: MentionItem) => {
    setMessages(previous => previous.map(message => {
      if (message.id !== item.messageId) return message;
      if (!item.replyId) return { ...message, isRead: true };
      return {
        ...message,
        replies: message.replies.map(reply => reply.id === item.replyId ? { ...reply, isRead: true } : reply)
      };
    }));
  };

  const filters: { id: ActivityFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: items.length },
    { id: 'mentions', label: 'Mentions', count: mentionCount },
    { id: 'reactions', label: 'Reactions', count: reactionCount }
  ];

  return (
    <div className="flex h-full flex-col bg-[#1A1D21] text-gray-300">
      <header className="shrink-0 border-b border-gray-800 bg-[#121317] px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-3 pb-4">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2 text-blue-400">
            <AtSign className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold text-gray-100">Mentions & reactions</h2>
              {unreadCount > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white" aria-label={`${unreadCount} unread mentions`}>{unreadCount}</span>}
            </div>
            <p className="text-xs text-gray-500">Catch up on messages that mention you and reactions to your posts.</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto" aria-label="Activity filters">
          {filters.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 border-b-2 px-3 py-2 text-xs font-bold transition ${filter === item.id ? 'border-blue-400 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              aria-pressed={filter === item.id}
            >
              {item.label} <span className="ml-1 text-[10px] text-gray-500">{item.count}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {filteredItems.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-gray-800 bg-[#121317] px-6 text-center">
              <Bell className="h-10 w-10 text-gray-700" />
              <h3 className="mt-4 text-sm font-bold text-gray-300">You’re all caught up</h3>
              <p className="mt-1 text-xs text-gray-500">{filter === 'all' ? 'Mentions and reactions will appear here.' : `No ${filter} to show.`}</p>
            </div>
          ) : filteredItems.map(item => {
            const channel = channels.find(channelItem => channelItem.id === item.channelId);
            const sender = users.find(user => user.id === item.senderId);
            const isUnreadMention = item.kind === 'mention' && !item.isRead;
            return (
              <article key={item.id} className={`relative rounded-xl border bg-[#121317] p-4 transition hover:border-blue-500/40 ${isUnreadMention ? 'border-blue-500/40' : 'border-gray-800'}`}>
                {isUnreadMention && <span className="absolute left-0 top-5 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-400" aria-hidden="true" />}
                <div className="flex items-start gap-3">
                  <UserAvatar user={sender} fallbackName={item.senderName} className="h-9 w-9 shrink-0 rounded-lg object-cover" alt={item.senderName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-white">{item.kind === 'reaction' ? 'Your message' : item.senderName}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.kind === 'mention' ? 'bg-blue-500/15 text-blue-300' : 'bg-amber-500/15 text-amber-300'}`}>
                        {item.kind === 'mention' ? <AtSign className="h-3 w-3" /> : <Smile className="h-3 w-3" />}
                        {item.kind === 'mention' ? 'Mentioned you' : 'Received a reaction'}
                      </span>
                      <span className="ml-auto text-[10px] text-gray-600">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    {item.kind === 'reaction' && item.reactions?.length ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        <span>Reacted with</span>
                        {item.reactions.map((emoji, index) => <span key={`${emoji}-${index}`} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-sm">{emoji}</span>)}
                      </div>
                    ) : null}
                    <div className="mt-2 rounded-lg border border-gray-800 bg-[#1A1D21] p-3 text-sm text-gray-300">
                      <FormattedMessage text={item.text} />
                    </div>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-gray-500">
                        {channel?.isPrivate ? <Lock className="h-3 w-3 shrink-0" /> : <Hash className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{channel?.name || 'Channel'}</span>
                        {item.replyId && <><MessageCircle className="ml-1 h-3 w-3 shrink-0" /><span>Thread reply</span></>}
                      </span>
                      <div className="flex shrink-0 justify-end gap-2">
                        {isUnreadMention && <button type="button" onClick={() => markMentionRead(item)} className="flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1.5 text-[10px] font-bold text-gray-400 hover:bg-gray-800 hover:text-white"><Check className="h-3 w-3" />Mark read</button>}
                        <button type="button" onClick={() => openItem(item)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-blue-500">{item.replyId ? 'View thread' : 'Open message'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
