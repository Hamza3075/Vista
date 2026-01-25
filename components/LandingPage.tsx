import React, { useState } from 'react';
import { AuthModal } from './AuthModal';

interface LandingPageProps {
  darkMode: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ darkMode }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');

  const openAuth = (view: 'signin' | 'signup') => {
    setAuthView(view);
    setShowAuth(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text transition-colors duration-500 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="w-full px-8 py-6 flex justify-between items-center animate-fade-in">
        <img 
          src={darkMode ? "https://i.ibb.co/jvkPgrRH/Vista-1.png" : "https://i.ibb.co/M5KLbVnh/Vista-2.png"} 
          alt="Vista Logo" 
          className="h-10 w-auto" 
        />
        <button 
          onClick={() => openAuth('signin')}
          className="text-sm font-medium uppercase tracking-wide text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-vista-text transition-colors"
        >
          Log In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in delay-100">
        <div className="max-w-4xl space-y-8">
          
          <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-tight">
            Precision manufacturing <br />
            <span className="text-neutral-400 dark:text-neutral-600">for the modern era.</span>
          </h1>
          
          <p className="max-w-xl mx-auto text-lg text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
            Streamline your formulas, manage global inventory, and track real-time profitability in one elegant interface designed for clarity.
          </p>

          <div className="pt-8">
            <button 
              onClick={() => openAuth('signup')}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-sm font-bold uppercase tracking-widest rounded-sm overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl dark:hover:bg-yellow-400"
            >
              <span>Enter Workspace</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="px-8 py-20 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4 group">
            <div className="w-12 h-12 flex items-center justify-center rounded-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 group-hover:border-neutral-400 dark:group-hover:border-vista-accent transition-colors">
               <svg className="w-6 h-6 text-neutral-900 dark:text-vista-text" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text">Smart Formulas</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Create complex ingredient matrices and calculate costs per unit automatically based on live inventory prices.
            </p>
          </div>

          <div className="space-y-4 group">
            <div className="w-12 h-12 flex items-center justify-center rounded-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 group-hover:border-neutral-400 dark:group-hover:border-vista-accent transition-colors">
               <svg className="w-6 h-6 text-neutral-900 dark:text-vista-text" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text">Inventory Sync</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Real-time tracking of raw ingredients and packaging. Auto-deduction during production runs prevents stockouts.
            </p>
          </div>

          <div className="space-y-4 group">
            <div className="w-12 h-12 flex items-center justify-center rounded-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 group-hover:border-neutral-400 dark:group-hover:border-vista-accent transition-colors">
               <svg className="w-6 h-6 text-neutral-900 dark:text-vista-text" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text">Financial Analytics</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Instant insight into profit margins, inventory value, and projected revenue based on current stock levels.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Vista Management Systems. All rights reserved.
      </footer>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialView={authView} />
    </div>
  );
};
