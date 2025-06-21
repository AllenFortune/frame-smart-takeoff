
import { useEffect, useState } from 'react';
import { checkNetworkConnectivity } from '@/integrations/supabase/client';

export const useNetworkMonitor = (onReconnect: () => void) => {
  const [isOnline, setIsOnline] = useState(checkNetworkConnectivity());

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Back online');
      setIsOnline(true);
      onReconnect();
    };

    const handleOffline = () => {
      console.log('Network: Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onReconnect]);

  return isOnline;
};
