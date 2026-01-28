
import React, { useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../context/AuthContext';
import { KpiCard, DataTable, PageHeader } from './Common';
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

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-12 animate-fade-in overflow-x-hidden">
      <PageHeader 
        title={`Hello, ${firstName}`} 
        subtitle="Your production summary and resource status." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <KpiCard label="Ready Stock" value={totalGlasses.toLocaleString()} subValue="Units" variant="accent" />
        <KpiCard label="Market Value" value={`EGP ${projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <KpiCard label="Potential Profit" value={`EGP ${projectedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <KpiCard label="Current Capital" value={`EGP ${inventoryCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Inventory Alerts</h3>
            {alerts.length === 0 && <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">All levels healthy</span>}
          </div>
          <DataTable<{id: number, type: string, name: string, stock: number, unit: string, threshold: number}> 
            data={alerts.slice(0, 5).map((a, i) => ({ ...a, id: i }))}
            columns={[
              { header: 'Type', render: a => <span className="text-[10px] uppercase font-bold text-neutral-400">{a.type}</span> },
              { header: 'Item', render: a => a.name },
              { header: 'Level', align: 'right', render: a => <span className="text-red-500 font-medium">{a.stock.toLocaleString()} {a.unit}</span> },
              { header: 'Target', align: 'right', render: a => `${a.threshold.toLocaleString()} {a.unit}` }
            ]}
            emptyMessage="No resources are currently below target levels."
          />
        </div>

        <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Actions</h3>
            <div className="space-y-4">
                <button onClick={() => setView('production')} className="w-full flex items-center justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group text-left shadow-sm">
                    <span className="text-xs font-bold text-neutral-900 dark:text-vista-text uppercase tracking-widest">Execute Production</span>
                    <svg className="w-4 h-4 text-neutral-400 group-hover:text-vista-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
                <button onClick={() => setView('inventory')} className="w-full flex items-center justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group text-left shadow-sm">
                    <span className="text-xs font-bold text-neutral-900 dark:text-vista-text uppercase tracking-widest">Manage Stock</span>
                    <svg className="w-4 h-4 text-neutral-400 group-hover:text-vista-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </button>
            </div>
            <div className="pt-4">
                <p className="text-[10px] text-neutral-400 italic">"Efficiency is the result of precision."</p>
            </div>
        </div>
      </div>
    </div>
  );
};
