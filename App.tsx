
import React, { useState, useEffect } from 'react';
import { StoreProvider } from './store/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { ProductionView } from './components/ProductionView';
import { IngredientsView } from './components/IngredientsView';
import { PackagingView } from './components/PackagingView';
import { SalesView } from './components/SalesView';
import { MarketingView } from './components/MarketingView';
import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';

// Nav Icons
const IconDashboard = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconProduction = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const IconIngredients = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const IconPackaging = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconMarketing = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
const IconSales = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconSettings = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const NavItem = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-sm ${active ? 'bg-neutral-900 text-white dark:bg-vista-accent dark:text-neutral-900 shadow-md' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text'}`}
  >
    <span className={active ? 'opacity-100' : 'opacity-60'}>{icon}</span>
    <span className="tracking-wide">{label}</span>
  </button>
);

const AppContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'dashboard' | 'production' | 'ingredients' | 'packaging' | 'sales' | 'marketing' | 'settings'>('dashboard');
  const [authView, setAuthView] = useState<'landing' | 'signin' | 'signup'>('landing');
  
  // Initialize darkMode based on system preference
  const [darkMode, setDarkMode] = useState(() => 
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    // Apply theme class
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-vista-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vista-accent"></div>
      </div>
    );
  }

  // Handle Unauthenticated Users
  if (!user) {
    if (authView === 'landing') {
      return <LandingPage darkMode={darkMode} onEnter={(view) => setAuthView(view)} />;
    }
    return <AuthPage initialView={authView} darkMode={darkMode} onBack={() => setAuthView('landing')} />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView setView={setView} />;
      case 'production': return <ProductionView />;
      case 'ingredients': return <IngredientsView />;
      case 'packaging': return <PackagingView />;
      case 'sales': return <SalesView />;
      case 'marketing': return <MarketingView />;
      case 'settings': return <SettingsView darkMode={darkMode} setDarkMode={setDarkMode} />;
      default: return <DashboardView setView={setView} />;
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text transition-colors duration-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0">
        <div className="p-8">
           <img 
            src={darkMode ? "https://i.ibb.co/jvkPgrRH/Vista-1.png" : "https://i.ibb.co/M5KLbVnh/Vista-2.png"} 
            alt="Vista Logo" 
            className="h-6 w-auto mb-1" 
          />
          <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.2em] mt-1 ml-0.5">Management</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<IconDashboard />} label="Dashboard" />
          <NavItem active={view === 'production'} onClick={() => setView('production')} icon={<IconProduction />} label="Production" />
          <NavItem active={view === 'ingredients'} onClick={() => setView('ingredients')} icon={<IconIngredients />} label="Ingredients" />
          <NavItem active={view === 'packaging'} onClick={() => setView('packaging')} icon={<IconPackaging />} label="Packaging" />
          <NavItem active={view === 'marketing'} onClick={() => setView('marketing')} icon={<IconMarketing />} label="Marketing" />
          <NavItem active={view === 'sales'} onClick={() => setView('sales')} icon={<IconSales />} label="Analytics" />
        </nav>

        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 mt-auto">
          <NavItem active={view === 'settings'} onClick={() => setView('settings')} icon={<IconSettings />} label="Settings" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-neutral-50/50 dark:bg-vista-bg/95">
        <div className="min-h-full">
            {renderView()}
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  </AuthProvider>
);

export default App;
