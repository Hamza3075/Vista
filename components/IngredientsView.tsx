import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { SearchableSelect, ConfirmModal, CustomSelect } from './Common';
import { Unit } from '../types';

interface CartItem {
  id: string;
  ingredientId: string;
  amount: number;
}

export const IngredientsView: React.FC = () => {
  const { ingredients, updateIngredient, removeIngredient, addIngredient } = useStore();
  
  // Modal States
  const [showManage, setShowManage] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [manageSearchTerm, setManageSearchTerm] = useState('');

  // New Ingredient State
  const [newIngName, setNewIngName] = useState('');
  const [newIngStock, setNewIngStock] = useState('');
  const [newIngPrice, setNewIngPrice] = useState('');
  const [newIngUnit, setNewIngUnit] = useState<Unit>('kg');

  // Cart State for Restock
  const [cart, setCart] = useState<CartItem[]>([{ id: '1', ingredientId: '', amount: 0 }]);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  // Filtered Lists
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ingredients, searchTerm]);

  const filteredManageIngredients = useMemo(() => {
    return ingredients.filter(i => i.name.toLowerCase().includes(manageSearchTerm.toLowerCase()));
  }, [ingredients, manageSearchTerm]);

  // Add item to cart
  const addCartItem = () => {
    setCart([...cart, { id: Date.now().toString(), ingredientId: '', amount: 0 }]);
  };

  // Remove item from cart
  const removeCartItem = (id: string) => {
    if (cart.length > 1) {
      setCart(cart.filter(item => item.id !== id));
    }
  };

  // Update cart item
  const updateCartItem = (id: string, field: 'ingredientId' | 'amount', value: any) => {
    setCart(cart.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Submit Restock
  const handleRestock = () => {
    cart.forEach(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (ing && item.amount > 0) {
        // Amount input is in Display Units (Kg/L), convert to base (g/ml)
        const amountToAdd = item.amount * 1000;
        updateIngredient(ing.id, { stock: ing.stock + amountToAdd });
      }
    });
    setCart([{ id: '1', ingredientId: '', amount: 0 }]);
    setShowRestock(false);
  };

  // Handle Add New Ingredient
  const handleAddIngredient = () => {
    if (!newIngName || !newIngStock || !newIngPrice) return;

    const stockVal = parseFloat(newIngStock);
    const priceVal = parseFloat(newIngPrice);

    if (isNaN(stockVal) || isNaN(priceVal)) return;

    // Convert display units to base units
    // If Kg/L, multiply stock by 1000. Price per base = Price per Kg / 1000.
    const isBulk = newIngUnit === 'kg' || newIngUnit === 'l';
    const baseStock = isBulk ? stockVal * 1000 : stockVal;
    const baseCost = isBulk ? priceVal / 1000 : priceVal;

    addIngredient({
      id: `ing-${Date.now()}`,
      name: newIngName,
      stock: baseStock,
      unit: newIngUnit,
      costPerBaseUnit: baseCost
    });

    setNewIngName('');
    setNewIngStock('');
    setNewIngPrice('');
    setNewIngUnit('kg');
    setShowAdd(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <header className="flex justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-light text-neutral-900 dark:text-vista-text tracking-tight">Ingredients</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-light">Inventory tracking and valuation</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-6 py-2.5 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-vista-text transition-all rounded-sm text-sm tracking-wide uppercase"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Item
          </button>
          <button 
            onClick={() => { setManageSearchTerm(''); setShowManage(true); }}
            className="flex items-center gap-2 px-6 py-2.5 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-vista-text transition-all rounded-sm text-sm tracking-wide uppercase"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Manage
          </button>
          <button 
            onClick={() => setShowRestock(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-yellow-400 transition-all rounded-sm text-sm tracking-wide uppercase shadow-lg shadow-neutral-200 dark:shadow-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Restock
          </button>
        </div>
      </header>

      {/* Main Search Bar */}
      <div className="relative max-w-md">
        <input 
          type="text" 
          placeholder="Search ingredients..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-sm text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-500 dark:focus:border-vista-accent outline-none transition-colors"
        />
        <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Main Table (Read Only) */}
      <div className="bg-white dark:bg-vista-bg rounded-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden min-h-[400px]">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="px-8 py-5 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">Ingredient Name</th>
              <th className="px-8 py-5 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Current Stock</th>
              <th className="px-8 py-5 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Market Price</th>
              <th className="px-8 py-5 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider text-right">Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredIngredients.length > 0 ? (
              filteredIngredients.map((ing) => {
                const stockInUnits = ing.stock / 1000;
                const pricePerUnit = ing.costPerBaseUnit * 1000;
                const totalValue = stockInUnits * pricePerUnit;
                
                return (
                  <tr key={ing.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="px-8 py-5 font-medium text-neutral-800 dark:text-vista-text">{ing.name}</td>
                    <td className="px-8 py-5 text-neutral-600 dark:text-neutral-300 font-light text-right">
                      {stockInUnits.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-neutral-400 dark:text-neutral-600 text-xs ml-1">{ing.unit}</span>
                    </td>
                    <td className="px-8 py-5 text-neutral-600 dark:text-neutral-300 font-light text-right">
                      EGP {pricePerUnit.toFixed(2)}
                    </td>
                    <td className="px-8 py-5 text-neutral-900 dark:text-vista-text font-medium text-right">
                      EGP {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            ) : (
               <tr>
                 <td colSpan={4} className="px-8 py-10 text-center text-neutral-400 dark:text-neutral-600 italic">No ingredients found matching "{searchTerm}"</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white dark:bg-neutral-900 p-8 rounded shadow-2xl w-[500px] max-w-full m-4 border border-transparent dark:border-neutral-800">
              <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text mb-6 tracking-tight border-b border-neutral-100 dark:border-neutral-800 pb-4">
                 Add New Ingredient
              </h3>
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Name</label>
                    <input 
                       type="text" 
                       className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm outline-none focus:border-neutral-500 dark:focus:border-vista-accent bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text"
                       placeholder="e.g. Olive Oil"
                       value={newIngName}
                       onChange={(e) => setNewIngName(e.target.value)}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Unit</label>
                        <CustomSelect 
                           options={[
                              { value: 'kg', label: 'Kilogram (kg)' },
                              { value: 'l', label: 'Liter (l)' },
                              { value: 'pcs', label: 'Pieces (pcs)' },
                           ]}
                           value={newIngUnit}
                           onChange={(v) => setNewIngUnit(v as Unit)}
                           placeholder="Unit"
                        />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Initial Stock</label>
                         <input 
                            type="number" 
                            className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm outline-none focus:border-neutral-500 dark:focus:border-vista-accent bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text"
                            placeholder="0.00"
                            value={newIngStock}
                            onChange={(e) => setNewIngStock(e.target.value)}
                         />
                     </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Price per Unit (EGP)</label>
                    <input 
                       type="number" 
                       className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm outline-none focus:border-neutral-500 dark:focus:border-vista-accent bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text"
                       placeholder="0.00"
                       value={newIngPrice}
                       onChange={(e) => setNewIngPrice(e.target.value)}
                    />
                 </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                 <button onClick={() => setShowAdd(false)} className="px-6 py-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-sm font-medium">Cancel</button>
                 <button onClick={handleAddIngredient} className="px-8 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-yellow-400 shadow-lg">Add Ingredient</button>
              </div>
           </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestock && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded shadow-2xl w-[600px] max-w-full m-4 border border-transparent dark:border-neutral-800">
            <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text mb-6 tracking-tight border-b border-neutral-100 dark:border-neutral-800 pb-4">
              New Purchase Order
            </h3>
            
            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2 pb-20">
              {cart.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-end bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded border border-neutral-100 dark:border-neutral-800">
                   <div className="flex-1">
                     <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Ingredient</label>
                     <SearchableSelect 
                        options={ingredients.map(i => ({ value: i.id, label: i.name, subLabel: i.unit }))}
                        value={item.ingredientId}
                        onChange={(id) => updateCartItem(item.id, 'ingredientId', id)}
                        placeholder="Select Ingredient..."
                     />
                   </div>
                   <div className="w-32">
                     <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Qty</label>
                     <input 
                        type="number" 
                        min="0"
                        className="w-full bg-white dark:bg-vista-bg border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm focus:border-neutral-500 dark:focus:border-vista-accent outline-none text-neutral-900 dark:text-vista-text"
                        value={item.amount || ''}
                        onChange={(e) => updateCartItem(item.id, 'amount', parseFloat(e.target.value))}
                     />
                   </div>
                   <button 
                    onClick={() => removeCartItem(item.id)}
                    className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-500 transition-colors mb-0.5"
                    disabled={cart.length === 1}
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
              ))}
            </div>

            <button 
              onClick={addCartItem}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Another Line Item
            </button>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <button onClick={() => setShowRestock(false)} className="px-6 py-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-sm font-medium">Cancel</button>
              <button onClick={handleRestock} className="px-8 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-yellow-400 shadow-lg">Confirm Purchase</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage/Edit Modal */}
      {showManage && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded shadow-2xl w-[800px] max-w-full m-4 h-[80vh] flex flex-col border border-transparent dark:border-neutral-800">
            <header className="mb-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text tracking-tight">Manage Inventory</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Update prices or remove obsolete items.</p>
                </div>
                <button onClick={() => setShowManage(false)} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-vista-text">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Modal Search */}
              <div className="relative mb-2">
                <input 
                    type="text" 
                    placeholder="Filter list..." 
                    value={manageSearchTerm}
                    onChange={(e) => setManageSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-sm text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-500 dark:focus:border-vista-accent outline-none"
                />
                <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-sm">
               <table className="w-full text-left text-sm">
                 <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
                   <tr>
                     <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase">Name</th>
                     <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase text-right">Market Price (EGP)</th>
                     <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                   {filteredManageIngredients.map(ing => (
                     <tr key={ing.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800">
                       <td className="px-4 py-3">
                         <input 
                            type="text" 
                            className="bg-transparent border-b border-transparent focus:border-neutral-400 dark:focus:border-neutral-600 outline-none w-full py-1 text-neutral-900 dark:text-vista-text"
                            defaultValue={ing.name}
                            onBlur={(e) => {
                              if (e.target.value !== ing.name) {
                                updateIngredient(ing.id, { name: e.target.value });
                              }
                            }}
                         />
                       </td>
                       <td className="px-4 py-3 text-right">
                         <input 
                            type="number" 
                            className="bg-transparent border-b border-transparent focus:border-neutral-400 dark:focus:border-neutral-600 outline-none w-24 py-1 text-right text-neutral-900 dark:text-vista-text"
                            defaultValue={(ing.costPerBaseUnit * 1000).toFixed(2)}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                // Input is EGP per Unit (Kg/L), Store is per base (g/ml)
                                updateIngredient(ing.id, { costPerBaseUnit: val / 1000 });
                              }
                            }}
                         />
                       </td>
                       <td className="px-4 py-3 text-center">
                         <button 
                           onClick={() => setDeleteModal({ isOpen: true, id: ing.id, name: ing.name })}
                           className="text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1"
                           title="Delete Ingredient"
                         >
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                       </td>
                     </tr>
                   ))}
                   {filteredManageIngredients.length === 0 && (
                        <tr><td colSpan={3} className="p-4 text-center text-neutral-400 dark:text-neutral-600 text-xs italic">No items found</td></tr>
                   )}
                 </tbody>
               </table>
            </div>
            
            <div className="mt-4 text-xs text-neutral-400 dark:text-neutral-600 text-center">
              Tip: Click on names or prices to edit them inline. Changes are saved automatically on blur.
            </div>
          </div>
        </div>
      )}

      {/* Shared Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Delete Ingredient"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone and may affect formulas using this ingredient.`}
        onConfirm={() => {
            if (deleteModal.id) removeIngredient(deleteModal.id);
            setDeleteModal({ isOpen: false, id: '', name: '' });
        }}
        onCancel={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};