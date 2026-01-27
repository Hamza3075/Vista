
import React, { useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../context/AuthContext';
import { KpiCard, DataTable, StatusBadge, PageHeader } from './Common';
import { Product } from '../types';

interface DashboardViewProps {
  setView: (view: 'production' | 'inventory' | 'analytics' | 'settings') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setView }) => {
  const { user } = useAuth();
  const { ingredients, packaging, products } = useStore();

  const getFinancials = (product: Product) => {
    const pack = packaging.find(p => p.id === product.packagingId);
    if (!pack) return { cost: 0, profit: 0, margin: 0 };
    const volumeRatio = pack.capacity / 1000;
    const ingredientCostPerL = product.formula.reduce((acc, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        return acc + (ing ? ing.costPerBaseUnit * item.amount : 0);
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

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in overflow-x-hidden">
      <PageHeader 
        title={`Welcome back, ${firstName}`} 
        subtitle="Vista Command Center: Real-time manufacturing and financial analysis." 
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <KpiCard label="Est. Revenue" value={`EGP ${projectedRevenue.toLocaleString()}`} />
        <KpiCard label="Est. Profit" value={`EGP ${projectedProfit.toLocaleString()}`} variant="accent" />
        <KpiCard label="Material Capital" value={`EGP ${inventoryCapital.toLocaleString()}`} />
        <KpiCard label="Attention" value={alerts.length} variant={alerts.length > 0 ? 'danger' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 min-w-0">
          <section>
            <h3 className="text-base md:text-lg font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {[
                 { label: 'Production', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', view: 'production', primary: true },
                 { label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', view: 'inventory' },
                 { label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', view: 'analytics' }
               ].map(action => (
                 <button 
                   key={action.view}
                   onClick={() => setView(action.view as any)}
                   className={`p-4 rounded-sm shadow-sm transition-all text-left group border ${action.primary ? 'bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 border-transparent' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'}`}
                 >
                    <div className="mb-2 opacity-80 group-hover:scale-110 transition-transform origin-left">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={action.icon} /></svg>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider">{action.label}</div>
                 </button>
               ))}
            </div>
          </section>

          <section className="min-w-0">
            <div className="flex justify-between items-end mb-4">
               <h3 className="text-base md:text-lg font-medium">Performance & Analysis</h3>
               <p className="text-[10px] text-neutral-400 font-light uppercase tracking-widest">Active SKUs: {products.length}</p>
            </div>
            <DataTable<Product> 
              data={products} 
              columns={[
                { header: 'Product', render: p => p.name, isSticky: true },
                { header: 'Stock', render: p => p.stock, align: 'right' },
                { header: 'Unit Cost', render: p => `EGP ${(getFinancials(p).cost || 0).toFixed(2)}`, align: 'right', isHiddenMobile: true },
                { header: 'Sale Price', render: p => `EGP ${(p.salePrice || 0).toFixed(0)}`, align: 'right' },
                { header: 'Margin', align: 'right', render: p => {
                    const { margin } = getFinancials(p);
                    return <StatusBadge value={`${(margin || 0).toFixed(1)}%`} type={margin > 20 ? 'positive' : 'negative'} />
                }}
              ]}
              emptyMessage="No products configured. Go to Production to create your first formula."
            />
          </section>
        </div>

        <aside className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 h-fit min-w-0">
           <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 dark:text-vista-text mb-6 flex items-center gap-2">
             <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
             Inventory Alerts
           </h3>
           <div className="space-y-4">
             {alerts.length === 0 ? (
               <p className="text-sm text-neutral-500 text-center py-4">All levels healthy.</p>
             ) : (
               alerts.map((alert, idx) => (
                 <div key={idx} className="flex items-start justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 last:pb-0 gap-2">
                   <div className="min-w-0">
                     <p className={`text-[9px] font-bold uppercase tracking-wider ${alert.type === 'Ingredient' ? 'text-red-600' : 'text-amber-600'}`}>{alert.type}</p>
                     <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{alert.name}</p>
                     <p className="text-[9px] text-neutral-400 uppercase tracking-widest mt-0.5">Target: {alert.threshold} {alert.unit}</p>
                   </div>
                   <div className="text-right shrink-0">
                      <p className={`text-sm font-mono font-bold ${alert.stock < (alert.threshold * 0.2) ? 'text-red-600' : 'text-neutral-500'}`}>{alert.stock.toLocaleString()} {alert.unit}</p>
                      <button onClick={() => setView('inventory')} className="text-[9px] font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text underline mt-1">Restock</button>
                   </div>
                 </div>
               ))
             )}
           </div>
        </aside>
      </div>
    </div>
  );
};
