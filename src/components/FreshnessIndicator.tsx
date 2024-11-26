import { getTimeAgo } from '@/utils/helpers';
import { useState } from 'react';

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
  const [showTooltip, setShowTooltip] = useState(false);
  const isFresh = Date.now() - timestamp <= refreshInterval;

  return (
    <div className="relative">
      <div
        className={`w-3 h-3 rounded-full cursor-help ${
          isFresh ? 'bg-green-500' : 'bg-red-500'
        } ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <div className="absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg whitespace-nowrap -translate-x-1/2 left-1/2 -top-8">
          Last updated: {getTimeAgo(timestamp)}
          <div className="absolute w-2 h-2 bg-gray-900 rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
};

export default FreshnessIndicator;
