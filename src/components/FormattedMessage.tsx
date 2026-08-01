import React from 'react';
import { Link2 } from 'lucide-react';

interface FormattedMessageProps {
  text: string;
}

export function FormattedMessage({ text }: FormattedMessageProps) {
  if (!text) return null;

  // Pattern to find URLs
  const urlRegex = /(https?:\/\/[^\s)\]]+)/g;
  
  // Split message by URL pattern
  const parts = text.split(urlRegex);

  const handleInternalLinkClick = (e: React.MouseEvent, urlStr: string) => {
    try {
      const url = new URL(urlStr);
      // If it belongs to the same domain / app environment
      if (url.origin === window.location.origin) {
        const view = url.searchParams.get('view');
        const channelId = url.searchParams.get('channelId');
        const messageId = url.searchParams.get('messageId');

        if (view || channelId || messageId) {
          e.preventDefault();
          // Dispatch a unified navigation event
          const navEvent = new CustomEvent('workspace-navigate', {
            detail: { view, channelId, messageId }
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
        if (urlRegex.test(part)) {
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

        // For plain text, allow standard layout preservation
        return <span key={index} className="whitespace-pre-wrap">{part}</span>;
      })}
    </span>
  );
}
