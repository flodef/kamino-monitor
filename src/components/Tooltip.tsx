import { ReactNode, useState } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}

export default function Tooltip({ children, content, className = '' }: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="pointer-events-none absolute z-50 top-0 left-1/2 -translate-y-full -translate-x-1/2 mb-2">
          <div
            className={`px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg whitespace-nowrap ${className}`}
          >
            {content}
            <div className="absolute w-2 h-2 bg-gray-900 rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
          </div>
        </div>
      )}
    </div>
  );
}
