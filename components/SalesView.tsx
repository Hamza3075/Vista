import React from 'react';
import { useStore } from '../store/StoreContext';

export const SalesView: React.FC = () => {
  const { products, packaging, ingredients } = useStore();

  const getFinancials = (product: any) => {
    const pack = packaging.find(p => p.id === product.packagingId);
    if (!pack) return { cost: 0, profit: 0, margin: 0 };

    const volumeRatio = pack.capacity / 1000;
    
    // Calculate liquid cost per Liter based on current ingredient prices
    const ingredientCostPerL = product.formula.reduce((acc: number, item: any) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        return acc + (ing ? ing.costPerBaseUnit * item.amount : 0);
    }, 0);

    // Total Unit Cost = (Liquid Cost * Volume) + Packaging Cost
    const cost = (ingredientCostPerL * volumeRatio) + pack.cost;
    
    const profit = product.salePrice - cost;
    const margin = product.salePrice > 0 ? (profit / product.salePrice) * 100 : 0;
    
    return { cost, profit, margin };
  };

  const totalPotentialProfit = products.reduce((acc, p) => {
    const { profit } = getFinancials(p);
    return acc + (profit * p.stock);
  }, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <h2 className="text-3xl font-light text-neutral-900 dark:text-vista-text tracking-tight">Analytics</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-light">Financial performance and projections</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-vista-accent rounded-sm p-8 border border-neutral-200 dark:border-transparent shadow-sm dark:shadow-none transition-colors">
          <p className="text-neutral-500 dark:text-neutral-800/70 font-bold text-xs uppercase tracking-widest mb-2">Total Inventory</p>
          <h3 className="text-4xl font-light text-neutral-900 dark:text-neutral-900">
            {products.reduce((acc, p) => acc + p.stock, 0)} <span className="text-lg text-neutral-400 dark:text-neutral-800/60">units</span>
          </h3>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 font-medium text-xs uppercase tracking-widest mb-2">Projected Profit</p>
          <h3 className="text-4xl font-light text-neutral-900 dark:text-vista-text">EGP {totalPotentialProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
          <p className="text-xs text-neutral-400 mt-3 font-light">Based on sell-through of current stock</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 shadow-sm">
           <p className="text-neutral-500 dark:text-neutral-400 font-medium text-xs uppercase tracking-widest mb-2">Active SKUs</p>
           <h3 className="text-4xl font-light text-neutral-900 dark:text-vista-text">{products.length}</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-vista-bg rounded-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Stock</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right" title="Includes liquid & packaging">Unit Cost</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Sale Price</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Profit / Unit</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Margin</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Potential Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {products.map(product => {
              const { cost, profit, margin } = getFinancials(product);
              return (
                <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900 dark:text-vista-text">{product.name}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-wide mt-0.5">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300 font-light text-right">{product.stock}</td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300 font-light text-right">EGP {cost.toFixed(2)}</td>
                  <td className="px-6 py-4 text-neutral-900 dark:text-vista-text font-medium text-right">EGP {product.salePrice.toFixed(2)}</td>
                  <td className={`px-6 py-4 font-medium text-right ${profit >= 0 ? 'text-neutral-800 dark:text-vista-text' : 'text-red-600 dark:text-red-400'}`}>
                    {profit >= 0 ? '+' : ''}EGP {profit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${margin > 50 ? 'bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700' : margin > 20 ? 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-100 dark:border-red-900/30'}`}>
                       {margin.toFixed(1)}%
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-vista-text">
                    EGP {(profit * product.stock).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};