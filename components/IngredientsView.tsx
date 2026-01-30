
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { DataTable, ModalBase, CustomSelect, StatusBadge, ConfirmModal } from './Common';
import { Unit, Ingredient } from '../types';

export const IngredientsView: React.FC = () => {
  const { ingredients, addIngredient, updateIngredient, removeIngredient } = useStore();
  
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [ingToDelete, setIngToDelete] = useState<Ingredient | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<Unit>('kg');
  const [minStock, setMinStock] = useState('');
  const [isCommon, setIsCommon] = useState(false);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ingredients, searchTerm]);

  const resetForm = () => {
    setName(''); setStock(''); setPrice(''); setUnit('kg'); setMinStock(''); setIsCommon(false);
    setErrorMessage(null);
  };

  const handleAddIngredient = async () => {
    if (!name.trim() || (!isCommon && stock === '') || price === '') { setErrorMessage("Mandatory fields missing."); return; }
    setIsSubmitting(true);
    const isBulk = unit === 'kg' || unit === 'l';
    const result = await addIngredient({
      id: '', name, 
      stock: isCommon ? 999999999 : (isBulk ? parseFloat(stock) * 1000 : parseFloat(stock)),
      unit, 
      costPerBaseUnit: isBulk ? parseFloat(price) / 1000 : parseFloat(price),
      minStock: !isCommon && minStock ? (isBulk ? parseFloat(minStock) * 1000 : parseFloat(minStock)) : undefined,
      isCommon
    });
    if (result.success) { setShowAdd(false); resetForm(); }
    else setErrorMessage(result.message);
    setIsSubmitting(false);
  };

  const handleUpdateIngredient = async () => {
    if (!editingIng || !name.trim()) return;
    setIsSubmitting(true);
    const isBulk = unit === 'kg' || unit === 'l';
    const updates = {
      name, unit, isCommon,
      stock: isCommon ? 999999999 : (isBulk ? parseFloat(stock) * 1000 : parseFloat(stock)),
      costPerBaseUnit: isBulk ? parseFloat(price) / 1000 : parseFloat(price),
      minStock: !isCommon && minStock ? (isBulk ? parseFloat(minStock) * 1000 : parseFloat(minStock)) : undefined
    };
    const result = await updateIngredient(editingIng.id, updates);
    if (result.success) { setEditingIng(null); resetForm(); }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!ingToDelete) return;
    await removeIngredient(ingToDelete.id);
    setIngToDelete(null);
  };

  const openEdit = (ing: Ingredient) => {
    const isBulk = ing.unit === 'kg' || ing.unit === 'l';
    setEditingIng(ing);
    setName(ing.name);
    setUnit(ing.unit);
    setIsCommon(!!ing.isCommon);
    
    // UX: If item is common, clear the stock field to avoid showing 999999.
    // If not common, show actual value.
    if (ing.isCommon) {
       setStock(''); 
    } else {
       setStock((ing.stock / (isBulk ? 1000 : 1)).toString());
    }
    
    setPrice(((ing.costPerBaseUnit * (isBulk ? 1000 : 1))).toString());
    setMinStock(ing.minStock ? (ing.minStock / (isBulk ? 1000 : 1)).toString() : '');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex gap-6 items-center bg-white dark:bg-neutral-900 p-4 rounded-sm border border-neutral-100 dark:border-neutral-800">
        <div className="relative flex-1">
          <input 
            type="text" placeholder="Filter materials..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 font-light"
          />
          <svg className="w-4 h-4 text-neutral-300 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="hidden sm:flex gap-8 px-4 items-center shrink-0 border-l border-neutral-50 dark:border-neutral-800 ml-4">
          <div className="text-right">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Global Assets</p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-vista-text">EGP {ingredients.reduce((acc, i) => acc + (i.isCommon ? 0 : i.stock * i.costPerBaseUnit), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <button onClick={() => { setShowAdd(true); resetForm(); }} className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 font-bold rounded-sm text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all shrink-0">
          <span className="hidden sm:inline">+ Register</span>
          <span className="sm:inline lg:hidden">+ Add</span>
        </button>
      </div>

      <DataTable<Ingredient> 
        data={filteredIngredients}
        onRowLongPress={openEdit}
        columns={[
          { header: 'Item', render: i => (
            <div>
              <span className="font-medium text-neutral-900 dark:text-vista-text">{i.name}</span>
              <span className="block text-[10px] text-neutral-400 font-light mt-0.5 uppercase tracking-widest">{i.unit} base</span>
            </div>
          )},
          { header: 'Stock', align: 'right', render: i => (
            <div className="flex items-center justify-end gap-3">
              <span className="text-xs font-mono">{i.isCommon ? '∞ Infinite' : `${(i.stock / (i.unit === 'kg' || i.unit === 'l' ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${i.unit}`}</span>
              <div className="hidden sm:block">
                {i.isCommon ? (
                   <StatusBadge value="Common" type="neutral" />
                ) : (
                   <StatusBadge value={i.stock <= 0 ? 'Empty' : i.stock < (i.minStock || 5000) ? 'Low' : 'OK'} type={i.stock <= 0 ? 'negative' : i.stock < (i.minStock || 5000) ? 'warning' : 'positive'} />
                )}
              </div>
            </div>
          )},
          { header: 'Unit Cost', align: 'right', isHiddenMobile: true, render: i => <span className="text-xs">EGP {(i.costPerBaseUnit * (i.unit === 'kg' || i.unit === 'l' ? 1000 : 1)).toFixed(2)} / {i.unit}</span> },
          { header: 'Value', align: 'right', render: i => <span className="font-semibold text-neutral-900 dark:text-vista-text">{i.isCommon ? '-' : `EGP ${(i.stock * i.costPerBaseUnit).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</span> },
          { header: 'Actions', align: 'center', isHiddenMobile: true, render: i => (
            <div className="flex justify-center gap-1">
              <button onClick={() => openEdit(i)} className="hidden lg:flex text-neutral-300 hover:text-vista-accent transition-all opacity-0 group-hover:opacity-100 p-2 cursor-pointer z-10"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
              <button onClick={() => setIngToDelete(i)} className="hidden lg:flex text-neutral-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 p-2 cursor-pointer z-10"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg></button>
            </div>
          )}
        ]}
      />

      <IngredientFormModal 
        isOpen={showAdd || !!editingIng} 
        onClose={() => { setShowAdd(false); setEditingIng(null); resetForm(); }} 
        title={editingIng ? 'Update Resource' : 'New Resource Registry'} 
        onSubmit={editingIng ? handleUpdateIngredient : handleAddIngredient} 
        isLoading={isSubmitting} error={errorMessage}
        formState={{ name, setName, stock, setStock, price, setPrice, unit, setUnit, minStock, setMinStock, isCommon, setIsCommon }}
      />

      <ConfirmModal 
        isOpen={!!ingToDelete} title="Confirm Deletion" message={`Permanently remove "${ingToDelete?.name}" from registry? This action is irreversible.`}
        onConfirm={handleDelete} onCancel={() => setIngToDelete(null)} isDestructive={true}
      />
    </div>
  );
};

const IngredientFormModal: React.FC<any> = ({ isOpen, onClose, title, onSubmit, isLoading, error, formState }) => {
  const { name, setName, stock, setStock, price, setPrice, unit, setUnit, minStock, setMinStock, isCommon, setIsCommon } = formState;
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={title} footer={
      <>
        <button onClick={onClose} className="px-6 py-2.5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
        <button onClick={onSubmit} disabled={isLoading} className="px-10 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-[10px] font-bold uppercase tracking-widest shadow-lg">Save</button>
      </>
    }>
      <div className="space-y-6">
        {error && <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase">{error}</div>}
        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Material Name</label>
          <input type="text" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent transition-colors" value={name} onChange={e => setName(e.target.value)} />
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-sm">
          <input 
            type="checkbox" 
            id="isCommon" 
            checked={isCommon} 
            onChange={(e) => setIsCommon(e.target.checked)}
            className="w-4 h-4 rounded-sm border-neutral-300 text-vista-accent focus:ring-vista-accent"
          />
          <label htmlFor="isCommon" className="text-xs font-bold text-neutral-600 dark:text-neutral-300 select-none cursor-pointer">
            Common Resource (Infinite Stock)
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Unit</label>
            <CustomSelect options={[{ value: 'kg', label: 'kg' }, { value: 'l', label: 'l' }, { value: 'pcs', label: 'pcs' }]} value={unit} onChange={setUnit} />
          </div>
          <div className={isCommon ? 'opacity-30 pointer-events-none' : ''}>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Current Stock</label>
            <input 
              type="number" 
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent" 
              value={isCommon ? '' : stock} 
              onChange={e => setStock(e.target.value)}
              placeholder={isCommon ? "Infinite" : "0.00"}
              disabled={isCommon}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Cost / {unit}</label>
            <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className={isCommon ? 'opacity-30 pointer-events-none' : ''}>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Safety Stock</label>
            <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent" value={isCommon ? '' : minStock} onChange={e => setMinStock(e.target.value)} disabled={isCommon} />
          </div>
        </div>
      </div>
    </ModalBase>
  );
};
