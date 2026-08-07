
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
