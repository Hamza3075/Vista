
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { DataTable, PageHeader, ModalBase, CustomSelect } from './Common';
import { Unit, Ingredient } from '../types';

export const IngredientsView: React.FC = () => {
  const { ingredients, updateIngredient, addIngredient } = useStore();
  
  const [showRestock, setShowRestock] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New Ingredient State
  const [newIngName, setNewIngName] = useState('');
  const [newIngStock, setNewIngStock] = useState('');
  const [newIngPrice, setNewIngPrice] = useState('');
  const [newIngUnit, setNewIngUnit] = useState<Unit>('kg');
  const [newIngMinStock, setNewIngMinStock] = useState('');

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ingredients, searchTerm]);

  const handleAddIngredient = () => {
    if (!newIngName || !newIngStock || !newIngPrice) return;
    const stockVal = parseFloat(newIngStock);
    const priceVal = parseFloat(newIngPrice);
    const minStockVal = parseFloat(newIngMinStock);
    if (isNaN(stockVal) || isNaN(priceVal)) return;

    const isBulk = newIngUnit === 'kg' || newIngUnit === 'l';
    addIngredient({
      id: `ing-${Date.now()}`,
      name: newIngName,
      stock: isBulk ? stockVal * 1000 : stockVal,
      unit: newIngUnit,
      costPerBaseUnit: isBulk ? priceVal / 1000 : priceVal,
      minStock: !isNaN(minStockVal) ? (isBulk ? minStockVal * 1000 : minStockVal) : undefined
    });
    setNewIngName(''); setNewIngStock(''); setNewIngPrice(''); setNewIngMinStock(''); setShowAdd(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in overflow-x-hidden">
      <PageHeader 
        title="Ingredients" 
        subtitle="Inventory tracking and valuation"
        actions={
          <>
            <button onClick={() => setShowAdd(true)} className="flex-1 sm:flex-none px-6 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all rounded-sm text-[10px] uppercase tracking-wide">Add Item</button>
            <button onClick={() => setShowRestock(true)} className="w-full sm:w-auto px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 transition-all rounded-sm text-[10px] uppercase tracking-wide shadow-lg">Restock</button>
          </>
        }
      />

      <div className="relative max-w-md w-full">
        <input 
          type="text" placeholder="Search ingredients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-sm text-sm bg-white dark:bg-vista-bg focus:border-neutral-500 outline-none"
        />
        <svg className="w-4 h-4 text-neutral-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      <DataTable<Ingredient> 
        data={filteredIngredients}
        columns={[
          { header: 'Ingredient', render: i => i.name, isSticky: true },
          { header: 'Stock', align: 'right', render: i => `${(i.stock / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${i.unit}` },
          { header: 'Alert Level', align: 'right', isHiddenMobile: true, render: i => i.minStock ? `${(i.minStock / 1000).toLocaleString()} ${i.unit}` : 'Default' },
          { header: 'Value', align: 'right', render: i => `EGP ${((i.stock / 1000) * (i.costPerBaseUnit * 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}` }
        ]}
      />

      <ModalBase isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Ingredient" footer={
        <>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-neutral-500 text-sm font-medium">Cancel</button>
          <button onClick={handleAddIngredient} className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-sm font-medium shadow-lg">Add Ingredient</button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Name</label>
            <input type="text" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text" value={newIngName} onChange={(e) => setNewIngName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Unit</label>
              <CustomSelect options={[{ value: 'kg', label: 'kg' }, { value: 'l', label: 'l' }, { value: 'pcs', label: 'pcs' }]} value={newIngUnit} onChange={(v) => setNewIngUnit(v as Unit)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Initial Stock</label>
              <input type="number" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text" value={newIngStock} onChange={(e) => setNewIngStock(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Price per Unit (EGP)</label>
              <input type="number" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text" value={newIngPrice} onChange={(e) => setNewIngPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-vista-accent uppercase mb-1">Min Stock Alert</label>
              <input type="number" className="w-full border border-vista-accent/30 focus:border-vista-accent rounded-sm p-2 text-sm bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text outline-none" placeholder="Default: 50" value={newIngMinStock} onChange={(e) => setNewIngMinStock(e.target.value)} />
            </div>
          </div>
        </div>
      </ModalBase>
    </div>
  );
};
