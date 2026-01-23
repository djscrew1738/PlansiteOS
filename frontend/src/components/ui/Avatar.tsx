interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Avatar({ src, alt, fallback, size = 'md' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-slate-700 flex items-center justify-center font-medium text-slate-200`}
    >
      {fallback || '?'}
    </div>
  );
}
