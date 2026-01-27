
import React, { useState } from 'react';
import { IngredientsView } from './IngredientsView';
import { PackagingView } from './PackagingView';
import { PageHeader } from './Common';

export const InventoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'packaging'>('ingredients');

  return (
    <div className="min-h-full">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <PageHeader 
          title="Inventory Assets" 
          subtitle="Unified management of raw materials and packaging containers."
        />
        
        <div className="flex gap-8 mb-4 border-b border-neutral-200 dark:border-neutral-800">
          <button 
            onClick={() => setActiveTab('ingredients')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'ingredients' ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            Ingredients
          </button>
          <button 
            onClick={() => setActiveTab('packaging')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'packaging' ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            Packaging
          </button>
        </div>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'ingredients' ? <IngredientsView /> : <PackagingView />}
      </div>
    </div>
  );
};
