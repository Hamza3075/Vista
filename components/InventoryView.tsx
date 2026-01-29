
import React from 'react';
import { IngredientsView } from './IngredientsView';
import { PackagingView } from './PackagingView';
import { useStore } from '../store/StoreContext';

export const InventoryView: React.FC = () => {
  const { navigation, updateNavigation } = useStore();

  return (
    <div className="min-h-full pb-20">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-100 dark:border-neutral-800 pb-8">
          <div>
            <h2 className="text-3xl font-light text-neutral-900 dark:text-vista-text">Inventory Assets</h2>
            <p className="text-sm text-neutral-400 font-light mt-1">Full registry of raw materials and storage SKU definitions.</p>
          </div>
          
          <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-sm">
            <button 
              onClick={() => updateNavigation({ inventoryTab: 'ingredients' })}
              className={`px-8 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${navigation.inventoryTab === 'ingredients' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-vista-accent shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Ingredients
            </button>
            <button 
              onClick={() => updateNavigation({ inventoryTab: 'packaging' })}
              className={`px-8 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${navigation.inventoryTab === 'packaging' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-vista-accent shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Packaging
            </button>
          </div>
        </div>

        <div className="animate-fade-in">
          {navigation.inventoryTab === 'ingredients' ? <IngredientsView /> : <PackagingView />}
        </div>
      </div>
    </div>
  );
};
