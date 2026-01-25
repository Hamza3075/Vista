import React, { useState, useEffect } from 'react';
import { StoreProvider } from './store/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { ProductionView } from './components/ProductionView';
import { IngredientsView } from './components/IngredientsView';
import { PackagingView } from './components/PackagingView';
import { SalesView } from './components/SalesView';
import { MarketingView } from './components/MarketingView';
import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';

// Nav Icons
const IconDashboard = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconProduction = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const IconIngredients = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const IconPackaging = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconSales = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconMarketing = () => <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.881 16H7.119a1 1 0 0 1-.772-1.636l4.881-5.927a1 1 0 0 1 1.544 0l4.88 5.927a1 1 0 0 1-.77 1.636Z"/></svg>;
const IconSettings = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const SidebarItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-all tracking-wide 
      ${active 
        ? 'text-neutral-900 bg-neutral-100 dark:bg-neutral-800 dark:text-vista-accent border-r-2 border-neutral-900 dark:border-vista-accent' 
        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-vista-text dark:hover:bg-neutral-900'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

interface AppContentProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const AppContent: React.FC<AppContentProps> = ({ darkMode, setDarkMode }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'production' | 'ingredients' | 'packaging' | 'sales' | 'marketing' | 'settings'>('dashboard');
  const { user } = useAuth();
  
  // Use metadata name if available, otherwise email
  const displayName = user?.user_metadata?.full_name || user?.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-white dark:bg-vista-bg overflow-hidden font-sans text-neutral-900 dark:text-vista-text transition-colors duration-300 animate-fade-in">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-vista-bg flex-shrink-0 flex flex-col border-r border-neutral-100 dark:border-neutral-800 transition-colors duration-300">
        <div className="p-8 pb-10">
          <img 
            src={darkMode ? "https://i.ibb.co/jvkPgrRH/Vista-1.png" : "https://i.ibb.co/M5KLbVnh/Vista-2.png"} 
            alt="Vista Logo" 
            className="h-12 object-contain w-auto transition-opacity duration-300" 
          />
        </div>
        
        <nav className="flex-1 space-y-1 mt-2">
          <SidebarItem 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
            icon={<IconDashboard />} 
            label="Dashboard" 
          />
          <SidebarItem 
            active={activeView === 'production'} 
            onClick={() => setActiveView('production')} 
            icon={<IconProduction />} 
            label="Production" 
          />
          <SidebarItem 
            active={activeView === 'ingredients'} 
            onClick={() => setActiveView('ingredients')} 
            icon={<IconIngredients />} 
            label="Ingredients" 
          />
          <SidebarItem 
            active={activeView === 'sales'} 
            onClick={() => setActiveView('sales')} 
            icon={<IconSales />} 
            label="Product Sales" 
          />
          <SidebarItem 
            active={activeView === 'packaging'} 
            onClick={() => setActiveView('packaging')} 
            icon={<IconPackaging />} 
            label="Packaging" 
          />
          <SidebarItem 
            active={activeView === 'marketing'} 
            onClick={() => setActiveView('marketing')} 
            icon={<IconMarketing />} 
            label="Marketing & Price" 
          />
        </nav>

        {/* Settings Section */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2">
           <SidebarItem 
            active={activeView === 'settings'} 
            onClick={() => setActiveView('settings')} 
            icon={<IconSettings />} 
            label="Settings" 
          />
        </div>

        <div className="p-8">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-sm">
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                    {initial}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-neutral-900 dark:text-vista-text">{displayName}</p>
                    {user?.user_metadata?.full_name && (
                       <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{user.email}</p>
                    )}
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white dark:bg-vista-bg transition-colors duration-300">
        <div className="min-h-full">
          {activeView === 'dashboard' && <DashboardView setView={setActiveView} />}
          {activeView === 'production' && <ProductionView />}
          {activeView === 'ingredients' && <IngredientsView />}
          {activeView === 'packaging' && <PackagingView />}
          {activeView === 'sales' && <SalesView />}
          {activeView === 'marketing' && <MarketingView />}
          {activeView === 'settings' && <SettingsView darkMode={darkMode} setDarkMode={setDarkMode} />}
        </div>
      </main>
    </div>
  );
};

const MainController: React.FC<{ darkMode: boolean, setDarkMode: (val: boolean) => void }> = ({ darkMode, setDarkMode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text transition-colors">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-vista-accent rounded-full animate-spin"></div>
                    <div className="text-xs font-medium uppercase tracking-widest text-neutral-400">Loading Workspace...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LandingPage darkMode={darkMode} />;
    }

    return (
        <StoreProvider>
            <AppContent darkMode={darkMode} setDarkMode={setDarkMode} />
        </StoreProvider>
    );
}

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
      <AuthProvider>
        <MainController darkMode={darkMode} setDarkMode={setDarkMode} />
      </AuthProvider>
  );
};

export default App;