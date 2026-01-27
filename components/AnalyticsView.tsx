
import React, { useState } from 'react';
import { SalesView } from './SalesView';
import { MarketingView } from './MarketingView';
import { PageHeader } from './Common';

export const AnalyticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'performance' | 'marketing'>('performance');

  return (
    <div className="min-h-full">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <PageHeader 
          title="Commercial Insights" 
          subtitle="Real-time financial tracking and sales pipeline management."
        />
        
        <div className="flex gap-8 mb-4 border-b border-neutral-200 dark:border-neutral-800">
          <button 
            onClick={() => setActiveTab('performance')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'performance' ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            Financial Performance
          </button>
          <button 
            onClick={() => setActiveTab('marketing')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'marketing' ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            Invoicing & Pricing
          </button>
        </div>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'performance' ? <SalesView /> : <MarketingView />}
      </div>
    </div>
  );
};
