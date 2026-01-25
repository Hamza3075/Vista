import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { ProductCategory } from '../types';
import { CustomSelect, ConfirmModal } from './Common';

export const MarketingView: React.FC = () => {
  const { products, updateProduct, removeProduct, ingredients, packaging } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  // Helper to calculate cost (duplicated logic for independence)
  const getProductCost = (product: any) => {
      const pack = packaging.find(p => p.id === product.packagingId);
      if (!pack) return 0;
      const volumeRatio = pack.capacity / 1000;
      const ingredientCostPerL = product.formula.reduce((acc: number, item: any) => {
          const ing = ingredients.find(i => i.id === item.ingredientId);
          return acc + (ing ? ing.costPerBaseUnit * item.amount : 0);
      }, 0);
      return (ingredientCostPerL * volumeRatio) + pack.cost;
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <header className="flex justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-light text-neutral-900 dark:text-vista-text tracking-tight">Marketing & Price</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-light">Adjust product pricing, names, and categorization</p>
        </div>
        
        {/* Search */}
        <div className="relative w-64">
           <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-sm text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-500 dark:focus:border-vista-accent outline-none"
           />
           <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
        </div>
      </header>

      <div className="bg-white dark:bg-vista-bg rounded-sm border border-neutral-200 dark:border-neutral-800 overflow-visible min-h-[400px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Unit Cost</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Sale Price (EGP)</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Margin</th>
              <th className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredProducts.map(product => {
              const unitCost = getProductCost(product);
              const margin = product.salePrice > 0 ? ((product.salePrice - unitCost) / product.salePrice) * 100 : 0;
              
              return (
                <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      className="bg-transparent border-b border-transparent focus:border-neutral-400 dark:focus:border-vista-accent outline-none w-full py-1 text-neutral-900 dark:text-vista-text font-medium"
                      defaultValue={product.name}
                      onBlur={(e) => {
                         if (e.target.value !== product.name) updateProduct(product.id, { name: e.target.value });
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 w-48">
                    <CustomSelect 
                       options={[
                           { value: ProductCategory.SKIN_CARE, label: ProductCategory.SKIN_CARE },
                           { value: ProductCategory.HAIR_CARE, label: ProductCategory.HAIR_CARE },
                       ]}
                       value={product.category}
                       onChange={(val) => updateProduct(product.id, { category: val as ProductCategory })}
                       className="w-full"
                    />
                  </td>
                  <td className="px-6 py-4 text-right text-neutral-500 dark:text-neutral-400 font-light">
                    EGP {unitCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <input 
                      type="number" 
                      className="bg-transparent border-b border-transparent focus:border-neutral-400 dark:focus:border-vista-accent outline-none w-24 py-1 text-right text-neutral-900 dark:text-vista-text font-medium"
                      defaultValue={product.salePrice.toFixed(2)}
                      onBlur={(e) => {
                         const val = parseFloat(e.target.value);
                         if (!isNaN(val) && val !== product.salePrice) updateProduct(product.id, { salePrice: val });
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs font-bold ${margin > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setDeleteModal({ isOpen: true, id: product.id, name: product.name })}
                      className="text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1"
                      title="Delete Product"
                    >
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-neutral-400 dark:text-neutral-500 italic">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

       <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.name}"? This will remove all stock history associated with this SKU.`}
        onConfirm={() => {
            if (deleteModal.id) removeProduct(deleteModal.id);
            setDeleteModal({ isOpen: false, id: '', name: '' });
        }}
        onCancel={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
        confirmText="Delete Product"
        isDestructive={true}
      />
    </div>
  );
};