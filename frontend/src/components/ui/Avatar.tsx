import { cn } from '../../lib/utils';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
}

const AVATAR_SIZES: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
};

export default function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'User avatar'}
        className={cn(AVATAR_SIZES[size], 'rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt || (fallback ? `Avatar: ${fallback}` : 'User avatar')}
      className={cn(
        AVATAR_SIZES[size],
        'rounded-full bg-slate-700 flex items-center justify-center font-medium text-slate-200',
        className
      )}
    >
      <span aria-hidden="true">{fallback || '?'}</span>
    </div>
  );
}
