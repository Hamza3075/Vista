
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { DataTable, ModalBase, CustomSelect, StatusBadge } from './Common';
import { Unit, Ingredient } from '../types';

export const IngredientsView: React.FC = () => {
  const { ingredients, addIngredient } = useStore();
  
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Ingredient State
  const [newIngName, setNewIngName] = useState('');
  const [newIngStock, setNewIngStock] = useState('');
  const [newIngPrice, setNewIngPrice] = useState('');
  const [newIngUnit, setNewIngUnit] = useState<Unit>('kg');
  const [newIngMinStock, setNewIngMinStock] = useState('');

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ingredients, searchTerm]);

  const handleAddIngredient = async () => {
    setErrorMessage(null);
    
    // Explicit validation: allow '0' as a value, but reject empty strings
    if (!newIngName.trim()) {
      setErrorMessage("Material name is required.");
      return;
    }
    if (newIngStock === '' || newIngPrice === '') {
      setErrorMessage("Stock and Price fields are mandatory.");
      return;
    }

    const stockVal = parseFloat(newIngStock);
    const priceVal = parseFloat(newIngPrice);
    const minStockVal = parseFloat(newIngMinStock);

    if (isNaN(stockVal) || isNaN(priceVal)) {
      setErrorMessage("Please enter valid numeric values.");
      return;
    }

    setIsSubmitting(true);
    const isBulk = newIngUnit === 'kg' || newIngUnit === 'l';
    
    try {
      const response = await addIngredient({
        id: `ing-${Date.now()}`,
        name: newIngName,
        stock: isBulk ? stockVal * 1000 : stockVal,
        unit: newIngUnit,
        costPerBaseUnit: isBulk ? priceVal / 1000 : priceVal,
        minStock: !isNaN(minStockVal) ? (isBulk ? minStockVal * 1000 : minStockVal) : undefined
      });

      if (response.success) {
        setNewIngName(''); 
        setNewIngStock(''); 
        setNewIngPrice(''); 
        setNewIngMinStock(''); 
        setShowAdd(false);
      } else {
        setErrorMessage(response.message || "Failed to register material.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockStatus = (ing: Ingredient) => {
    const threshold = ing.minStock || 50000;
    if (ing.stock <= 0) return 'negative';
    if (ing.stock < threshold) return 'warning';
    return 'positive';
  };

  const totalValue = ingredients.reduce((acc, i) => acc + (i.stock * i.costPerBaseUnit), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-6 items-center bg-white dark:bg-neutral-900 p-4 rounded-sm border border-neutral-100 dark:border-neutral-800">
        <div className="relative flex-1 w-full">
          <input 
            type="text" placeholder="Filter materials..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-neutral-300 dark:placeholder:text-neutral-700"
          />
          <svg className="w-4 h-4 text-neutral-300 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex gap-8 px-4 items-center shrink-0 border-l border-neutral-50 dark:border-neutral-800 ml-4">
          <div className="text-right">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Global Assets</p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-vista-text">EGP {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <button 
            onClick={() => { setShowAdd(true); setErrorMessage(null); }} 
            className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 font-bold rounded-sm text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            + Register
          </button>
        </div>
      </div>

      <DataTable<Ingredient> 
        data={filteredIngredients}
        columns={[
          { 
            header: 'Resource', 
            render: i => (
              <div>
                <span className="font-medium text-neutral-900 dark:text-vista-text">{i.name}</span>
                <span className="block text-[10px] text-neutral-400 font-light mt-0.5 uppercase tracking-widest">{i.unit} base</span>
              </div>
            ) 
          },
          { 
            header: 'Available Stock', 
            align: 'right', 
            render: i => (
              <div className="flex items-center justify-end gap-3">
                <span className="text-xs font-mono">{(i.stock / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} {i.unit}</span>
                <StatusBadge 
                  value={i.stock <= 0 ? 'Empty' : i.stock < (i.minStock || 50000) ? 'Low' : 'OK'} 
                  type={getStockStatus(i)} 
                />
              </div>
            ) 
          },
          { 
            header: 'Unit Cost', 
            align: 'right', 
            isHiddenMobile: true, 
            render: i => <span className="text-xs">EGP {(i.costPerBaseUnit * 1000).toFixed(2)} / {i.unit}</span> 
          },
          { 
            header: 'Asset Value', 
            align: 'right', 
            render: i => (
              <span className="font-semibold text-neutral-900 dark:text-vista-text">EGP {((i.stock / 1000) * (i.costPerBaseUnit * 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            ) 
          },
          {
            header: '',
            align: 'center',
            render: i => (
              <button className="text-neutral-300 hover:text-vista-accent transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            )
          }
        ]}
      />

      <ModalBase isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Resource Registry" footer={
        <>
          <button onClick={() => setShowAdd(false)} disabled={isSubmitting} className="px-6 py-2.5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
          <button 
            onClick={handleAddIngredient} 
            disabled={isSubmitting}
            className="px-10 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-[10px] font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white dark:border-neutral-900/20 dark:border-t-neutral-900 rounded-full animate-spin" />
            ) : null}
            {isSubmitting ? 'Processing...' : 'Confirm Entry'}
          </button>
        </>
      }>
        <div className="space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest animate-shake">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Material Name</label>
            <input type="text" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent focus:border-vista-accent outline-none transition-colors" value={newIngName} onChange={(e) => setNewIngName(e.target.value)} placeholder="e.g. Lavender Essential Oil" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Unit</label>
              <CustomSelect options={[{ value: 'kg', label: 'kg' }, { value: 'l', label: 'l' }, { value: 'pcs', label: 'pcs' }]} value={newIngUnit} onChange={(v) => setNewIngUnit(v as Unit)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Stock</label>
              <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent transition-colors" value={newIngStock} onChange={(e) => setNewIngStock(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Price / Unit</label>
              <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent transition-colors" value={newIngPrice} onChange={(e) => setNewIngPrice(e.target.value)} placeholder="EGP" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Min Alert</label>
              <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent transition-colors" placeholder="Default 50" value={newIngMinStock} onChange={(e) => setNewIngMinStock(e.target.value)} />
            </div>
          </div>
        </div>
      </ModalBase>
    </div>
  );
};
