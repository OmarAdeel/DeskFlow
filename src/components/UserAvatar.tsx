import type { PresenceStatus } from '../context';

export interface AvatarUser {
  name?: string;
  avatarUrl?: string;
}

export function getAvatarUrl(user?: AvatarUser, fallbackName = 'A'): string {
  if (user?.avatarUrl) return user.avatarUrl;

  const seed = user?.name || fallbackName;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`;
}

interface UserAvatarProps {
  user?: AvatarUser;
  fallbackName?: string;
  alt?: string;
  className?: string;
}

export const presenceColorClass = (status: PresenceStatus): string => {
  switch (status) {
    case 'online': return 'bg-emerald-500';
    case 'away': return 'bg-amber-500';
    case 'dnd': return 'bg-red-500';
    case 'meeting': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

export const presenceLabel = (status: PresenceStatus): string => {
  switch (status) {
    case 'online': return 'Active now';
    case 'away': return 'Away';
    case 'dnd': return 'Do not disturb';
    case 'meeting': return 'In a meeting';
    default: return 'Offline';
  }
};

export function PresenceDot({ status, className = 'h-3 w-3', borderClassName = 'border-[#121317]' }: { status: PresenceStatus; className?: string; borderClassName?: string }) {
  return <span title={presenceLabel(status)} aria-label={presenceLabel(status)} className={`${className} ${presenceColorClass(status)} rounded-full border-2 ${borderClassName} shadow-sm`} />;
}

export function UserAvatar({ user, fallbackName = 'A', alt, className }: UserAvatarProps) {
  return (
    <img
      src={getAvatarUrl(user, fallbackName)}
      alt={alt ?? user?.name ?? fallbackName}
      className={className ?? 'h-full w-full object-cover'}
      referrerPolicy="no-referrer"
    />
  );
}
