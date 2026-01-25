import React, { useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../context/AuthContext';

interface DashboardViewProps {
  setView: (view: 'production' | 'ingredients' | 'packaging' | 'sales' | 'marketing' | 'settings') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setView }) => {
  const { user } = useAuth();
  const { ingredients, packaging, products } = useStore();

  // --- Calculations ---

  // 1. Financials
  const rawMaterialValue = useMemo(() => {
    const ingValue = ingredients.reduce((acc, i) => acc + (i.stock * i.costPerBaseUnit), 0);
    const packValue = packaging.reduce((acc, p) => acc + (p.stock * p.cost), 0);
    return ingValue + packValue;
  }, [ingredients, packaging]);

  const finishedGoodsValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * p.salePrice), 0);
  }, [products]);

  const totalSKUs = products.length;

  // 2. Low Stock Alerts (Arbitrary thresholds: < 20% of 'healthy' stock or fixed numbers)
  // Assuming "Healthy" is > 100 units for packaging, > 50kg/L for ingredients
  const lowStockIngredients = ingredients.filter(i => {
    const stockInDisplayUnits = i.unit === 'g' || i.unit === 'ml' ? i.stock : i.stock / 1000;
    // Threshold: 50 for Kg/L, 50000 for g/ml. Let's simplify and say if base stock < 50000 (50kg)
    return i.stock < 50000; 
  }).map(i => ({ type: 'Ingredient', name: i.name, stock: i.stock / 1000, unit: i.unit, id: i.id }));

  const lowStockPackaging = packaging.filter(p => p.stock < 100)
    .map(p => ({ type: 'Packaging', name: p.name, stock: p.stock, unit: 'pcs', id: p.id }));

  const alerts = [...lowStockIngredients, ...lowStockPackaging];

  // 3. Top Performing Products (by Stock Value)
  const topProducts = [...products]
    .sort((a, b) => (b.stock * b.salePrice) - (a.stock * a.salePrice))
    .slice(0, 3);

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const firstName = rawName.split(' ')[0];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in text-neutral-900 dark:text-vista-text">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-3xl font-light tracking-tight">
            Welcome back, <span className="font-medium">{firstName}</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-light">
            Here is your daily production overview.
          </p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">Est. Revenue (Stock)</p>
          <p className="text-2xl font-light">EGP {finishedGoodsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">Raw Material Value</p>
          <p className="text-2xl font-light">EGP {rawMaterialValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
           <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">Active Formulas</p>
           <p className="text-2xl font-light">{totalSKUs}</p>
        </div>

        <div className={`p-6 rounded-sm border shadow-sm transition-colors ${alerts.length > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>
           <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${alerts.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500'}`}>Attention Needed</p>
           <p className={`text-2xl font-light ${alerts.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-neutral-900 dark:text-vista-text'}`}>{alerts.length} <span className="text-sm opacity-60">items</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Column: Quick Actions & Top Products */}
        <div className="lg:col-span-2 space-y-10">
            
            {/* Quick Actions */}
            <section>
              <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 <button 
                   onClick={() => setView('production')}
                   className="p-4 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm shadow-md hover:bg-neutral-800 dark:hover:bg-yellow-400 transition-all text-left group"
                 >
                    <div className="mb-3 opacity-80 group-hover:scale-110 transition-transform origin-left">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider">Start Production</div>
                 </button>
                 
                 <button 
                   onClick={() => setView('ingredients')}
                   className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm shadow-sm hover:border-neutral-400 dark:hover:border-neutral-500 transition-all text-left group"
                 >
                    <div className="mb-3 text-neutral-500 dark:text-neutral-400 group-hover:scale-110 transition-transform origin-left">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Restock Ingredients</div>
                 </button>

                 <button 
                   onClick={() => setView('marketing')}
                   className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm shadow-sm hover:border-neutral-400 dark:hover:border-neutral-500 transition-all text-left group"
                 >
                    <div className="mb-3 text-neutral-500 dark:text-neutral-400 group-hover:scale-110 transition-transform origin-left">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Adjust Prices</div>
                 </button>
              </div>
            </section>

            {/* Top Products */}
            <section>
              <div className="flex justify-between items-end mb-4">
                 <h3 className="text-lg font-medium">Top Inventory Value</h3>
                 <button onClick={() => setView('sales')} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-vista-text uppercase tracking-wide">View All Analytics &rarr;</button>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase">Product</th>
                      <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase text-right">Units in Stock</th>
                      <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase text-right">Potential Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {topProducts.map(p => (
                      <tr key={p.id}>
                        <td className="px-6 py-3 font-medium">{p.name}</td>
                        <td className="px-6 py-3 text-right text-neutral-600 dark:text-neutral-400">{p.stock}</td>
                        <td className="px-6 py-3 text-right">EGP {(p.stock * p.salePrice).toLocaleString()}</td>
                      </tr>
                    ))}
                    {topProducts.length === 0 && (
                      <tr><td colSpan={3} className="px-6 py-4 text-center text-neutral-400 text-xs">No products found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
        </div>

        {/* Sidebar Column: Alerts */}
        <aside className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 h-fit">
           <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-vista-text mb-6 flex items-center gap-2">
             <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
             Inventory Alerts
           </h3>
           
           <div className="space-y-4">
             {alerts.length === 0 ? (
               <div className="text-center py-8">
                 <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <p className="text-sm text-neutral-500 dark:text-neutral-400">All systems operational.</p>
                 <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">Stock levels are healthy.</p>
               </div>
             ) : (
               alerts.map((alert, idx) => (
                 <div key={`${alert.type}-${idx}`} className="flex items-start justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 last:pb-0">
                   <div>
                     <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mb-0.5">{alert.type}</p>
                     <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{alert.name}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-mono text-neutral-600 dark:text-neutral-400">{alert.stock.toLocaleString()} <span className="text-[10px]">{alert.unit}</span></p>
                      <button 
                        onClick={() => setView(alert.type === 'Ingredient' ? 'ingredients' : 'packaging')}
                        className="text-[10px] font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-2 mt-1"
                      >
                        Restock
                      </button>
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
