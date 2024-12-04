'use client';

import AddIcon from '@mui/icons-material/Add';
import AddSectionDialog from '@/components/AddSectionDialog';
import BorrowStatusSection from '@/components/BorrowStatusSection';
import LoanStatusSection from '@/components/LoanStatusSection';
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white">Kamino Finance Monitor</h1>
          <RpcSelector />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <PriceSection />

          <div className="flex flex-wrap gap-4">
            {sections.map(section => (
              <div key={section.id} className="w-[304px] h-min-64">
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

            <div
              className="w-[304px] h-64 bg-primary rounded-lg p-6 text-center hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => setShowAddDialog(true)}
            >
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-gray-400 mb-1">Add Section</div>
                <div className="text-white font-medium text-lg">
                  <AddIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddDialog && <AddSectionDialog onClose={() => setShowAddDialog(false)} />}
    </main>
  );
}
