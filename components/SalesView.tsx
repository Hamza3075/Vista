
import React, { useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { PageHeader, KpiCard, DataTable, StatusBadge } from './Common';
import { Product } from '../types';

export const SalesView: React.FC = () => {
  const { products, packaging, ingredients } = useStore();

  const getFinancials = (product: Product) => {
    const pack = packaging.find(p => p.id === product.packagingId);
    if (!pack) return { cost: 0, profit: 0, margin: 0 };
    const volumeRatio = pack.capacity / 1000;
    const ingredientCostPerL = product.formula.reduce((acc, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        // cost contribution = (percentage share) * (cost of 1L of material)
        return acc + (ing ? (item.percentage / 100) * (ing.costPerBaseUnit * 1000) : 0);
    }, 0);
    const cost = (ingredientCostPerL * volumeRatio) + pack.cost;
    const profit = (product.salePrice || 0) - cost;
    const margin = (product.salePrice || 0) > 0 ? (profit / (product.salePrice || 1)) * 100 : 0;
    return { cost, profit, margin };
  };

  const totals = useMemo(() => {
    return products.reduce((acc, p) => {
      const { profit } = getFinancials(p);
      return {
        glasses: acc.glasses + p.stock,
        profit: acc.profit + (profit * p.stock)
      };
    }, { glasses: 0, profit: 0 });
  }, [products, ingredients, packaging]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in overflow-x-hidden">
      <PageHeader 
        title="Commercial Analytics" 
        subtitle="Financial performance and sellable glass projections" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <KpiCard 
          label="Total Glasses" 
          value={totals.glasses.toLocaleString()} 
          variant="accent" 
        />
        <KpiCard 
          label="Projected Gross Profit" 
          value={`EGP ${totals.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
        />
        <KpiCard 
          label="Active Product Lines" 
          value={products.length} 
        />
      </div>

      <DataTable<Product> 
        data={products}
        columns={[
          { header: 'Product Line', render: p => p.name, isSticky: true },
          { header: 'Glass Stock', align: 'right', render: p => p.stock.toLocaleString() },
          { header: 'Unit Cost', align: 'right', isHiddenMobile: true, render: p => `EGP ${(getFinancials(p).cost || 0).toFixed(2)}` },
          { header: 'Market Price', align: 'right', render: p => `EGP ${(p.salePrice || 0).toFixed(0)}` },
          { header: 'Stock Profit', align: 'right', render: p => {
            const { profit } = getFinancials(p);
            return <span className={profit * p.stock >= 0 ? 'text-neutral-900 dark:text-vista-text' : 'text-red-500'}>
              EGP {(profit * p.stock).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>;
          }},
          { header: 'Net Margin', align: 'right', render: p => {
            const { margin } = getFinancials(p);
            return <StatusBadge value={`${(margin || 0).toFixed(1)}%`} type={margin > 20 ? 'positive' : 'negative'} />;
          }}
        ]}
        emptyMessage="No product data available for analysis."
      />
    </div>
  );
};
