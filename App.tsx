
import React, { useState, useEffect, useMemo } from 'react';
import { StoreProvider } from './store/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { ProductionView } from './components/ProductionView';
import { InventoryView } from './components/InventoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';
import { AccessView } from './components/AccessView';
import { useStore } from './store/StoreContext';

const IconDashboard = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconProduction = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 00-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const IconInventory = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconAnalytics = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconSettings = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconAccess = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

const NavItem = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-bold uppercase tracking-widest transition-all rounded-sm ${active ? 'bg-neutral-900 text-white dark:bg-vista-accent dark:text-neutral-900 shadow-lg' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text'}`}
  >
    <span className={active ? 'opacity-100' : 'opacity-40'}>{icon}</span>
    <span>{label}</span>
  </button>
);

const AppContent = () => {
  const { user, loading } = useAuth();
  const { isAuthorized, userAccessList, roles } = useStore();
  const [view, setView] = useState<'dashboard' | 'production' | 'inventory' | 'analytics' | 'settings' | 'access'>('dashboard');
  const [authView, setAuthView] = useState<'landing' | 'signin' | 'signup'>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => 
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const canManageAccess = useMemo(() => {
    if (!user) return false;
    // Primary authorized user is always the owner
    if (isAuthorized) {
       const myAccess = userAccessList.find(a => a.userId === user?.id);
       // If no access record exists yet, assume owner (first user logic)
       if (!myAccess && userAccessList.length === 0) return true;
       // Check for owner role or access permissions
       if (myAccess?.roleId === 'owner' || myAccess?.roleId === 'Owner') return true;
       const myRole = roles.find(r => r.id === myAccess?.roleId || r.name === myAccess?.roleId);
       return !!(myAccess?.customPermissions?.access?.read || myRole?.permissions.access.read);
    }
    return false;
  }, [user, userAccessList, roles, isAuthorized]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-vista-bg flex items-center justify-center">
        <img src={darkMode ? "https://i.ibb.co/jvkPgrRH/Vista-1.png" : "https://i.ibb.co/M5KLbVnh/Vista-2.png"} alt="Vista Loading..." className="h-10 w-auto animate-pulse opacity-70" />
      </div>
    );
  }

  if (!user) {
    if (authView === 'landing') return <LandingPage darkMode={darkMode} onEnter={(v) => setAuthView(v)} />;
    return <AuthPage initialView={authView} darkMode={darkMode} onBack={() => setAuthView('landing')} />;
  }

  if (!isAuthorized) {
    return <AuthPage initialView="token" darkMode={darkMode} onBack={() => setAuthView('landing')} />;
  }

  const handleNavClick = (newView: typeof view) => {
    setView(newView);
    setIsSidebarOpen(false);
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView setView={setView} />;
      case 'production': return <ProductionView />;
      case 'inventory': return <InventoryView />;
      case 'analytics': return <AnalyticsView />;
      case 'access': return <AccessView />;
      case 'settings': return <SettingsView darkMode={darkMode} setDarkMode={setDarkMode} />;
      default: return <DashboardView setView={setView} />;
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text transition-colors duration-200 overflow-hidden font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 border-r border-neutral-100 dark:border-neutral-800 flex flex-col shrink-0 bg-white dark:bg-vista-bg z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 text-center">
           <img src={darkMode ? "https://i.ibb.co/jvkPgrRH/Vista-1.png" : "https://i.ibb.co/M5KLbVnh/Vista-2.png"} alt="Vista Logo" className="h-6 w-auto mx-auto" />
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem active={view === 'dashboard'} onClick={() => handleNavClick('dashboard')} icon={<IconDashboard />} label="Dashboard" />
          <NavItem active={view === 'production'} onClick={() => handleNavClick('production')} icon={<IconProduction />} label="Production" />
          <NavItem active={view === 'inventory'} onClick={() => handleNavClick('inventory')} icon={<IconInventory />} label="Inventory" />
          <NavItem active={view === 'analytics'} onClick={() => handleNavClick('analytics')} icon={<IconAnalytics />} label="Analytics" />
        </nav>

        <div className="px-4 py-6 border-t border-neutral-50 dark:border-neutral-800 mt-auto space-y-2">
          {canManageAccess && (
            <NavItem active={view === 'access'} onClick={() => handleNavClick('access')} icon={<IconAccess />} label="Access" />
          )}
          <NavItem active={view === 'settings'} onClick={() => handleNavClick('settings')} icon={<IconSettings />} label="Settings" />
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative bg-neutral-50/20 dark:bg-vista-bg flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-vista-bg sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-vista-text">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <img src={darkMode ? "https://i.ibb.co/jvkPgrRH/Vista-1.png" : "https://i.ibb.co/M5KLbVnh/Vista-2.png"} alt="Vista Logo" className="h-5 w-auto" />
          <div className="w-10" />
        </div>
        <div className="min-h-full w-full">{renderView()}</div>
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
