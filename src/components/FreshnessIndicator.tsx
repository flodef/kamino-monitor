import { getTimeAgo } from '@/utils/helpers';
import { useEffect, useState } from 'react';
import Tooltip from './Tooltip';

interface FreshnessIndicatorProps {
  timestamp: number;
  refreshInterval: number;
  className?: string;
}

const FreshnessIndicator = ({
  timestamp,
  refreshInterval,
  className = '',
}: FreshnessIndicatorProps) => {
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // Update every second to check freshness
    const timer = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isFresh = Date.now() - timestamp <= refreshInterval;

  return (
    <Tooltip content={`Last updated: ${getTimeAgo(timestamp)}`}>
      <div
        className={`w-3 h-3 rounded-full ${isFresh ? 'bg-green-500' : 'bg-red-500'} ${className}`}
      />
    </Tooltip>
  );
};

export default FreshnessIndicator;
