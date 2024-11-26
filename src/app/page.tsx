'use client';

import AddSectionDialog from '@/components/AddSectionDialog';
import BorrowStatusSection from '@/components/BorrowStatusSection';
import LoanStatusSection from '@/components/LoanStatusSection';
import Notifications from '@/components/Notifications';
import PriceSection from '@/components/PriceSection';
import RpcSelector from '@/components/RpcSelector';
import { useMonitorStore } from '@/store/monitorStore';
import { useState } from 'react';
import { Toaster } from 'sonner';

export default function Home() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { sections, removeSection } = useMonitorStore();

  return (
    <main className="min-h-screen bg-background p-8">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Kamino Finance Monitor</h1>
          <RpcSelector />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <PriceSection />

          {sections.map(section => (
            <div key={section.id}>
              {section.type === 'borrow' ? (
                <BorrowStatusSection
                  market={section.market}
                  mint={section.publicKey!}
                  onRemove={() => removeSection(section.id)}
                />
              ) : (
                <LoanStatusSection
                  market={section.market}
                  obligation={section.publicKey!}
                  onRemove={() => removeSection(section.id)}
                />
              )}
            </div>
          ))}

          <button
            onClick={() => setShowAddDialog(true)}
            className="bg-primary rounded-lg p-6 text-center text-gray-400 hover:text-white transition-colors"
          >
            + Add Section
          </button>
        </div>
      </div>

      {showAddDialog && <AddSectionDialog onClose={() => setShowAddDialog(false)} />}
    </main>
  );
}
