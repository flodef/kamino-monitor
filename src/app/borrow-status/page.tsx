'use client';

import { useEffect, useState } from 'react';

interface BorrowStatus {
  isBuyable: boolean;
  timestamp: string;
}

export default function BorrowStatusPage() {
  const [status, setStatus] = useState<BorrowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/borrow-status');
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Borrow Status</h1>
        
        <div className="bg-primary rounded-lg p-6">
          <pre className="text-white">
            {status ? JSON.stringify(status, null, 2) : 'Loading...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
