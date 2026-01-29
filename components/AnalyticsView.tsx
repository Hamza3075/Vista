
import React from 'react';
import { SalesView } from './SalesView';
import { MarketingView } from './MarketingView';
import { AIInsightsView } from './AIInsightsView';
import { PageHeader } from './Common';
import { useStore } from '../store/StoreContext';

export const AnalyticsView: React.FC = () => {
  const { navigation, updateNavigation } = useStore();

  return (
    <div className="min-h-full">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <PageHeader 
          title="Commercial Intelligence" 
          subtitle="Real-time financial tracking and AI-powered production advisory."
        />
        
        <div className="flex gap-10 mb-4 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => updateNavigation({ insightsTab: 'performance' })}
            className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${navigation.insightsTab === 'performance' ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            Performance
          </button>
          <button 
            onClick={() => updateNavigation({ insightsTab: 'marketing' })}
            className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${navigation.insightsTab === 'marketing' ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            Invoicing
          </button>
          <button 
            onClick={() => updateNavigation({ insightsTab: 'advisor' })}
            className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap flex items-center gap-3 ${navigation.insightsTab === 'advisor' ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-vista-accent shadow-[0_0_8px_rgba(235,205,84,0.6)] animate-pulse" />
            Strategic Advisor
          </button>
        </div>
      </div>

      <div className="animate-fade-in pb-20">
        {navigation.insightsTab === 'performance' ? <SalesView /> : navigation.insightsTab === 'marketing' ? <MarketingView /> : <AIInsightsView />}
      </div>
    </div>
  );
};
