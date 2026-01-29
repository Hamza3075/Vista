
import React, { useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../context/AuthContext';
import { KpiCard, PageHeader, StatusBadge, ProgressBar } from './Common';
import { Product } from '../types';

interface DashboardViewProps {
  setView: (view: 'production' | 'inventory' | 'analytics' | 'settings' | 'access') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setView }) => {
  const { user } = useAuth();
  const { ingredients, packaging, products } = useStore();

  const getFinancials = (product: Product) => {
    const pack = packaging.find(p => p.id === product.packagingId);
    if (!pack) return { cost: 0, profit: 0, margin: 0 };
    const volumeRatio = pack.capacity / 1000;
    // Fix: FormulaItem uses 'percentage', not 'amount'. 
    // Calculating cost contribution to 1L (1000ml) using percentage.
    const ingredientCostPerL = product.formula.reduce((acc, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        return acc + (ing ? (item.percentage / 100) * (ing.costPerBaseUnit * 1000) : 0);
    }, 0);
    const cost = (ingredientCostPerL * volumeRatio) + pack.cost;
    const profit = (product.salePrice || 0) - cost;
    const margin = (product.salePrice || 0) > 0 ? (profit / (product.salePrice || 1)) * 100 : 0;
    return { cost, profit, margin };
  };

  const projectedRevenue = useMemo(() => products.reduce((acc, p) => acc + (p.stock * (p.salePrice || 0)), 0), [products]);
  const projectedProfit = useMemo(() => products.reduce((acc, p) => acc + (getFinancials(p).profit * p.stock), 0), [products, ingredients, packaging]);
  const inventoryCapital = useMemo(() => {
    const ingValue = ingredients.reduce((acc, i) => acc + (i.stock * (i.costPerBaseUnit || 0)), 0);
    const packValue = packaging.reduce((acc, p) => acc + (p.stock * (p.cost || 0)), 0);
    return ingValue + packValue;
  }, [ingredients, packaging]);

  const totalGlasses = useMemo(() => products.reduce((acc, p) => acc + p.stock, 0), [products]);

  const alerts = useMemo(() => {
    const ingredientAlerts = ingredients
      .filter(i => i.stock < (i.minStock ?? 50000))
      .map(i => ({ 
        type: 'Ingredient', 
        name: i.name, 
        stock: i.stock / 1000, 
        unit: i.unit,
        threshold: (i.minStock ?? 50000) / 1000
      }));

    const packagingAlerts = packaging
      .filter(p => p.stock < (p.minStock ?? 100))
      .map(p => ({ 
        type: 'Packaging', 
        name: p.name, 
        stock: p.stock, 
        unit: 'pcs',
        threshold: p.minStock ?? 100
      }));

    return [...ingredientAlerts, ...packagingAlerts];
  }, [ingredients, packaging]);

  const firstName = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User').split(' ')[0];
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const overallHealth = useMemo(() => {
    const totalItems = ingredients.length + packaging.length;
    if (totalItems === 0) return 100;
    return ((totalItems - alerts.length) / totalItems) * 100;
  }, [ingredients, packaging, alerts]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-vista-text">{timeGreeting}, {firstName}</h1>
          <p className="text-sm text-neutral-400 font-light mt-1">Operational status of your production pipeline.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 px-6 py-3 rounded-sm border border-neutral-100 dark:border-neutral-800">
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Pipeline Health</p>
            <ProgressBar progress={overallHealth} color={overallHealth > 80 ? 'bg-emerald-500' : 'bg-vista-accent'} />
          </div>
          <span className="text-xl font-light ml-4">{Math.round(overallHealth)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Inventory Count" value={totalGlasses.toLocaleString()} subValue="Units" variant="accent" trend={{ value: '12%', positive: true }} />
        <KpiCard label="Market Valuation" value={`EGP ${projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <KpiCard label="Estimated Gross" value={`EGP ${projectedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <KpiCard label="Active Capital" value={`EGP ${inventoryCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} variant="ghost" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center border-b border-neutral-50 dark:border-neutral-800 pb-3">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Resource Watchlist</h3>
            <StatusBadge value={`${alerts.length} Items Low`} type={alerts.length > 0 ? 'warning' : 'positive'} />
          </div>
          
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {alerts.length > 0 ? alerts.slice(0, 6).map((alert, i) => (
              <div key={i} className="flex items-center justify-between py-4 group hover:bg-neutral-50/10 transition-all px-2 rounded-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${alert.stock === 0 ? 'bg-red-500' : 'bg-amber-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-vista-text">{alert.name}</p>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{alert.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono">{alert.stock.toFixed(1)} / {alert.threshold} {alert.unit}</p>
                  <div className="w-24 mt-1.5 ml-auto">
                    <ProgressBar progress={(alert.stock / alert.threshold) * 100} color={alert.stock === 0 ? 'bg-red-500' : 'bg-amber-400'} />
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center border border-dashed border-neutral-100 dark:border-neutral-800">
                <p className="text-sm text-neutral-400 font-light italic">All resources are optimally stocked.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Quick Transitions</h3>
            <div className="space-y-3">
                <button onClick={() => setView('production')} className="w-full group flex items-center justify-between p-6 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm transition-all hover:scale-[1.01] active:scale-[0.99]">
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">New Production Run</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
                
                <button onClick={() => setView('inventory')} className="w-full group flex items-center justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm hover:border-neutral-400 transition-all">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] group-hover:text-neutral-900 dark:group-hover:text-vista-text">Manage Catalog</span>
                    <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>

                <button onClick={() => setView('analytics')} className="w-full group flex items-center justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm hover:border-neutral-400 transition-all">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] group-hover:text-neutral-900 dark:group-hover:text-vista-text">Commercial View</span>
                    <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
