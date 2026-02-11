import { useState, useEffect } from 'react';
import { SignalSlashIcon, SignalIcon } from '@heroicons/react/24/outline';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowRecovery(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRecovery(true);
      // Auto-hide the recovery banner after 3 seconds
      setTimeout(() => setShowRecovery(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showRecovery) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-0 left-0 right-0 z-[60] px-4 py-2 text-center text-sm font-medium transition-colors ${
        isOffline
          ? 'bg-yellow-600 text-yellow-50'
          : 'bg-green-600 text-green-50'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isOffline ? (
          <>
            <SignalSlashIcon className="w-4 h-4" />
            <span>You're offline. Some features may be unavailable.</span>
          </>
        ) : (
          <>
            <SignalIcon className="w-4 h-4" />
            <span>Connection restored.</span>
          </>
        )}
      </div>
    </div>
  );
}
