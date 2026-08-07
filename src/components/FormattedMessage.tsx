import React from 'react';
import { Link2 } from 'lucide-react';
import { canAccessChannel, useWorkspace } from '../context';

interface FormattedMessageProps {
  text: string;
}

export function FormattedMessage({ text }: FormattedMessageProps) {
  const { currentUser, channels, activeOrganizationId } = useWorkspace();
  const currentUsername = currentUser?.username?.replace(/^@/, '').toLowerCase() || '';

  if (!text) return null;

  // Split the message into URL and plain-text segments first so links keep their existing behavior.
  const urlRegex = /(https?:\/\/[^\s)\]]+)/g;
  const urlSegmentRegex = /^https?:\/\/[^\s)\]]+$/;
  const mentionRegex = /(@[a-zA-Z0-9][a-zA-Z0-9._-]*)/g;
  const mentionTokenRegex = /^@[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
  const channelTokenRegex = /^#[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
  const parts = text.split(urlRegex);

  const handleInternalLinkClick = (e: React.MouseEvent, urlStr: string) => {
    try {
      const url = new URL(urlStr);
      // If it belongs to the same domain / app environment
      if (url.origin === window.location.origin) {
        const view = url.searchParams.get('view');
        const channelId = url.searchParams.get('channelId');
        const messageId = url.searchParams.get('messageId');
        const replyId = url.searchParams.get('replyId');

        if (view || channelId || messageId) {
          e.preventDefault();
          // Dispatch a unified navigation event
          const navEvent = new CustomEvent('workspace-navigate', {
            detail: { view, channelId, messageId, replyId }
          });
          window.dispatchEvent(navEvent);
          return;
        }
      }
    } catch (err) {
      console.error('Url parsing error:', err);
    }
  };

  return (
    <span className="break-words">
      {parts.map((part, index) => {
        if (urlSegmentRegex.test(part)) {
          const isInternal = part.startsWith(window.location.origin);
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (isInternal) {
                  handleInternalLinkClick(e, part);
                }
              }}
              className="text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center gap-1 mx-0.5 break-all cursor-pointer bg-blue-500/10 hover:bg-blue-500/25 px-1.5 py-0.5 rounded transition-all"
            >
              <Link2 className="h-3 w-3 shrink-0 inline text-blue-400" />
              <span>Conversation Link</span>
            </a>
          );
        }

        // Highlight user mentions and link only channels the current user can access.
        const mentionAndChannelRegex = /(@[a-zA-Z0-9][a-zA-Z0-9._-]*|#[a-zA-Z0-9][a-zA-Z0-9._-]*)/g;
        const mentionParts = part.split(mentionAndChannelRegex);
        return (
          <span key={index} className="whitespace-pre-wrap">
            {mentionParts.map((mentionPart, mentionIndex) => {
              if (mentionTokenRegex.test(mentionPart)) {
                return (
                  <span
                    key={`${index}-mention-${mentionIndex}`}
                    className={mentionPart.slice(1).toLowerCase() === currentUsername
                      ? 'text-amber-300 bg-amber-400/10 px-1 rounded font-semibold'
                      : 'text-blue-300 bg-blue-500/10 px-1 rounded font-semibold'}
                  >
                    {mentionPart}
                  </span>
                );
              }

              if (channelTokenRegex.test(mentionPart)) {
                const channelName = mentionPart.slice(1).toLowerCase();
                const linkedChannel = channels.find(channel =>
                  channel.name.toLowerCase() === channelName && canAccessChannel(channel, currentUser, activeOrganizationId)
                );

                if (linkedChannel) {
                  return (
                    <a
                      key={`${index}-channel-${mentionIndex}`}
                      href={`${window.location.pathname}?view=channel&channelId=${encodeURIComponent(linkedChannel.id)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.button === 0) {
                          e.preventDefault();
                          window.dispatchEvent(new CustomEvent('workspace-navigate', {
                            detail: { view: 'channel', channelId: linkedChannel.id }
                          }));
                        }
                      }}
                      className="text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-200 px-1 rounded font-semibold underline underline-offset-2 cursor-pointer"
                      title={`Open #${linkedChannel.name}`}
                    >
                      {mentionPart}
                    </a>
                  );
                }
              }

              return mentionPart;
            })}
          </span>
        );
      })}
    </span>
  );
}
