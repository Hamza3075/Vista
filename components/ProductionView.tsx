
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Product, ProductCategory, FormulaItem } from '../types';
import { CustomSelect, SearchableSelect, PageHeader, ModalBase, StatusBadge, ProgressBar, Alert } from './Common';

interface AddProductFormProps {
  category: ProductCategory;
  onClose: () => void;
}

const ProduceModal: React.FC<{ onClose: () => void; initialProductId?: string }> = ({ onClose, initialProductId }) => {
  const { products, packaging, produceProduct, ingredients, addLog } = useStore();
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || '');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  
  useEffect(() => {
    if (selectedProduct && !selectedPackId) {
      setSelectedPackId(selectedProduct.packagingId);
    }
  }, [selectedProductId, selectedProduct, selectedPackId]);

  const productionCheck = useMemo(() => {
    const qty = parseInt(quantity) || 0;
    if (!selectedProduct || qty <= 0) return { shortages: [], packOk: false, allOk: false, validationErrors: [] };
    
    const pack = packaging.find(p => p.id === selectedPackId);
    if (!pack) return { shortages: [], packOk: false, allOk: false, validationErrors: ["No packaging selected."] };
    
    const batchSizeL = (qty * pack.capacity) / 1000;
    const shortages = selectedProduct.formula.map(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      const needed = item.amount * batchSizeL;
      return {
        name: ing?.name || 'Unknown Ingredient',
        needed,
        available: ing?.stock || 0,
        ok: (ing?.stock || 0) >= (needed - 0.0001)
      };
    });

    const packOk = pack.stock >= qty;
    const errors: string[] = [];
    if (!packOk) errors.push(`Insufficient packaging stock (${pack.name}).`);
    shortages.forEach(s => { if (!s.ok) errors.push(`Insufficient material: ${s.name}.`); });

    return { 
      shortages, 
      packOk, 
      allOk: packOk && shortages.every(s => s.ok),
      validationErrors: errors
    };
  }, [selectedProduct, selectedPackId, quantity, ingredients, packaging]);

  const handleProduce = async () => {
    if (!selectedProductId || !selectedPackId || !quantity) {
      setMessage({ text: "Incomplete selection. Please verify all fields.", type: 'warning' });
      return;
    }
    
    setIsProcessing(true);
    setMessage(null);
    addLog('info', 'Production', `Syncing production run: ${selectedProduct?.name}`);

    try {
      const pack = packaging.find(p => p.id === selectedPackId);
      if (!pack) throw new Error("Packaging profile not found.");

      const batchSizeL = (parseInt(quantity) * pack.capacity) / 1000;
      const result = await produceProduct(selectedProductId, batchSizeL, selectedPackId);
      
      if (result.success) {
        addLog('info', 'Production', `Cycle complete: ${quantity} units synced.`);
        setMessage({ text: result.message, type: 'success' });
        setTimeout(onClose, 2000);
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: `System Error: ${err.message || "Failed to communicate with database."}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const isReady = selectedProductId && selectedPackId && quantity && productionCheck.allOk && !isProcessing;

  return (
    <ModalBase isOpen={true} onClose={onClose} title="Execute Production Run" maxWidth="max-w-[600px]" isLoading={isProcessing} footer={
      <>
        <button onClick={onClose} disabled={isProcessing} className="px-6 py-2.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-30">Cancel</button>
        <button 
          onClick={handleProduce} 
          disabled={!isReady} 
          className="px-10 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-2xl transition-all disabled:opacity-20 active:scale-95 flex items-center gap-3"
        >
          {isProcessing ? 'Locking State...' : 'Confirm Production'}
        </button>
      </>
    }>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Product Formula</label>
            <SearchableSelect 
              options={products.map(p => ({ value: p.id, label: p.name, subLabel: p.category }))}
              value={selectedProductId}
              onChange={(val) => { setSelectedProductId(val); setMessage(null); }}
              placeholder="Select product..."
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Bottle Type</label>
            <CustomSelect 
              options={packaging.map(p => ({ value: p.id, label: `${p.name} (${p.capacity}ml)`, subLabel: `Stock: ${p.stock}` }))}
              value={selectedPackId}
              onChange={(val) => { setSelectedPackId(val); setMessage(null); }}
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Run Quantity (Units)</label>
          <input 
            type="number" 
            className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-4 text-3xl font-light bg-transparent outline-none focus:border-vista-accent transition-colors disabled:opacity-30" 
            placeholder="0" 
            value={quantity}
            onChange={e => { setQuantity(e.target.value); setMessage(null); }}
            disabled={isProcessing}
          />
        </div>

        {selectedProduct && quantity && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Availability Assessment</h4>
                <StatusBadge 
                  value={productionCheck.allOk ? 'Validated' : 'Shortage Detected'} 
                  type={productionCheck.allOk ? 'positive' : 'warning'} 
                />
             </div>
             
             {!productionCheck.allOk && productionCheck.validationErrors.length > 0 && (
               <Alert type="warning" message={productionCheck.validationErrors.join(' ')} />
             )}

             <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex justify-between items-center text-[11px]">
                   <span className="text-neutral-500">Container: {packaging.find(p => p.id === selectedPackId)?.name}</span>
                   <span className={`font-bold ${productionCheck.packOk ? 'text-emerald-500' : 'text-red-500'}`}>
                      {parseInt(quantity) || 0} / {packaging.find(p => p.id === selectedPackId)?.stock || 0}
                   </span>
                </div>
                {productionCheck.shortages.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                       <span className="text-neutral-500">{s.name}</span>
                       <span className={`font-bold ${s.ok ? 'text-neutral-900 dark:text-vista-text' : 'text-red-500'}`}>
                          {s.needed.toFixed(1)} / {s.available.toFixed(1)}
                       </span>
                    </div>
                    <ProgressBar progress={(s.available / Math.max(1, s.needed)) * 100} color={s.ok ? 'bg-vista-accent' : 'bg-red-500'} />
                  </div>
                ))}
             </div>
          </div>
        )}

        {message && (
          <Alert type={message.type === 'success' ? 'success' : message.type === 'warning' ? 'warning' : 'error'} message={message.text} onClose={() => setMessage(null)} />
        )}
      </div>
    </ModalBase>
  );
};

const AddProductForm: React.FC<AddProductFormProps> = ({ category, onClose }) => {
  const { ingredients, packaging, addProduct } = useStore();
  const [name, setName] = useState('');
  const [selectedPackId, setSelectedPackId] = useState(packaging[0]?.id || '');
  const [price, setPrice] = useState('');
  const [formula, setFormula] = useState<FormulaItem[]>([]);
  const [ingId, setIngId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddIngredient = () => {
    if (!ingId || !amount) return;
    setFormula(prev => [...prev, { ingredientId: ingId, amount: parseFloat(amount) }]);
    setAmount('');
    setIngId(''); 
  };

  const calculateCostPerL = () => {
    return formula.reduce((acc, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return acc + (ing ? ing.costPerBaseUnit * item.amount : 0);
    }, 0);
  };

  const selectedPack = packaging.find(p => p.id === selectedPackId);
  const rawCostPerL = calculateCostPerL();
  const volumeRatio = selectedPack ? selectedPack.capacity / 1000 : 0;
  const unitLiquidCost = rawCostPerL * volumeRatio;
  const unitPackCost = selectedPack ? selectedPack.cost : 0;
  const totalUnitCost = unitLiquidCost + unitPackCost;
  const salePriceVal = parseFloat(price) || 0;
  const projectedMargin = salePriceVal > 0 ? ((salePriceVal - totalUnitCost) / salePriceVal) * 100 : 0;

  const handleSave = async () => {
    if (!name || !price || !selectedPackId || isSaving) return;
    setIsSaving(true);
    setError(null);
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      category,
      packagingId: selectedPackId,
      salePrice: parseFloat(price),
      stock: 0,
      formula
    };
    
    try {
      const res = await addProduct(newProduct);
      if (res.success) {
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError("Failed to register formula. Check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalBase isOpen={true} onClose={onClose} title={`Define ${category} Formula`} maxWidth="max-w-[700px]" isLoading={isSaving} footer={
      <>
        <button onClick={onClose} disabled={isSaving} className="px-6 py-2.5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
        <button onClick={handleSave} disabled={isSaving || !name || formula.length === 0} className="px-10 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm shadow-2xl hover:bg-neutral-800 transition-all text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50">
          {isSaving ? 'Locking Formula...' : 'Confirm Formula'}
        </button>
      </>
    }>
      <div className="space-y-8">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Product SKU Name</label>
            <input type="text" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-colors" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Silk Hair Mask" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Target Retail (EGP)</label>
            <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-colors" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div className="space-y-1.5">
           <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Default Packaging</label>
           <CustomSelect 
             options={packaging.map(p => ({ value: p.id, label: `${p.name} (${p.capacity}ml)`, subLabel: `Unit Cost: EGP ${(p.cost || 0).toFixed(2)}` }))}
             value={selectedPackId} onChange={setSelectedPackId}
           />
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold text-neutral-900 dark:text-vista-text uppercase tracking-[0.2em]">Formula Itemization</h3>
            <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Values in g / ml</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch">
            <div className="flex-1">
              <SearchableSelect options={ingredients.map(i => ({ value: i.id, label: i.name, subLabel: i.unit }))} value={ingId} onChange={setIngId} placeholder="Add ingredient..." />
            </div>
            <div className="flex gap-3">
              <input type="number" className="flex-1 sm:w-28 border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm text-neutral-900 dark:text-vista-text bg-transparent outline-none focus:border-vista-accent" placeholder="Qty" value={amount} onChange={e => setAmount(e.target.value)} />
              <button onClick={handleAddIngredient} className="px-6 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors rounded-sm font-bold text-neutral-600 dark:text-neutral-300 text-[10px] uppercase tracking-widest">Add</button>
            </div>
          </div>
          
          <div className="space-y-2 mb-8 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {formula.map((f, idx) => {
              const ing = ingredients.find(i => i.id === f.ingredientId);
              return (
                <div key={idx} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm animate-fade-in">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{ing?.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-mono text-neutral-500">{f.amount} {ing?.unit === 'kg' ? 'g' : 'ml'}</span>
                    <button onClick={() => setFormula(prev => prev.filter((_, i) => i !== idx))} className="text-neutral-400 hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-sm border border-neutral-100 dark:border-neutral-800">
               <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Calculated Cost</p>
               <p className="text-2xl font-light text-neutral-900 dark:text-vista-text">EGP {(totalUnitCost || 0).toFixed(2)}</p>
            </div>
            <div className={`p-6 rounded-sm border transition-colors ${projectedMargin > 30 ? 'bg-emerald-500/5 border-emerald-500/20' : projectedMargin > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
               <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Projected Margin</p>
               <p className={`text-2xl font-bold ${(projectedMargin || 0) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{(projectedMargin || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

export const ProductionView: React.FC = () => {
  const { products, packaging, ingredients } = useStore();
  const [activeTab, setActiveTab] = useState<'all' | ProductCategory>(ProductCategory.SKIN_CARE);
  const [isAdding, setIsAdding] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return products;
    return products.filter(p => p.category === activeTab);
  }, [products, activeTab]);

  const getProductFinancials = (product: Product) => {
    const pack = packaging.find(p => p.id === product.packagingId);
    if (!pack) return { cost: 0, margin: 0 };
    const volumeRatio = pack.capacity / 1000;
    const ingredientCostPerL = product.formula.reduce((acc, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        return acc + (ing ? ing.costPerBaseUnit * item.amount : 0);
    }, 0);
    const cost = (ingredientCostPerL * volumeRatio) + pack.cost;
    const margin = (product.salePrice || 0) > 0 ? (((product.salePrice || 0) - cost) / (product.salePrice || 1)) * 100 : 0;
    return { cost, margin };
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 animate-fade-in pb-24">
      <PageHeader 
        title="Formula Hub" 
        subtitle="Manage master definitions and execute batch production cycles."
        actions={
          <button 
            onClick={() => { setSelectedProductId(''); setIsProducing(true); }}
            className="group relative px-12 py-4 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm hover:scale-105 active:scale-95 transition-all text-[11px] font-bold uppercase tracking-[0.25em] shadow-2xl"
          >
            Launch Production Cycle
          </button>
        }
      />

      <div className="flex gap-10 overflow-x-auto whitespace-nowrap border-b border-neutral-100 dark:border-neutral-800 pb-0.5 no-scrollbar">
        {['all', ProductCategory.SKIN_CARE, ProductCategory.HAIR_CARE].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`pb-4 font-bold text-[10px] md:text-xs transition-all tracking-[0.2em] uppercase border-b-2 ${activeTab === tab ? 'text-neutral-900 dark:text-vista-accent border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 border-transparent hover:text-neutral-600'}`}
          >
            {tab === 'all' ? 'Unified Catalog' : tab}
          </button>
        ))}
      </div>
      
      {activeTab !== 'all' && (
        <div className="flex justify-end">
           <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-6 py-2 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:border-neutral-400 transition-all text-[10px] font-bold uppercase tracking-widest">+ Define New SKU</button>
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {filteredProducts.map(product => {
            const pack = packaging.find(p => p.id === product.packagingId);
            const { cost, margin } = getProductFinancials(product);
            return (
              <div key={product.id} className="group relative bg-white dark:bg-neutral-900 rounded-sm border border-neutral-100 dark:border-neutral-800 p-8 flex flex-col hover:border-vista-accent/30 transition-all shadow-sm hover:shadow-xl hover:translate-y-[-4px]">
                 <div className="flex justify-between items-start mb-8">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest ${product.category === ProductCategory.SKIN_CARE ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800' : 'bg-neutral-800 text-neutral-100 dark:bg-neutral-700'}`}>
                          {product.category}
                        </span>
                        {margin > 50 && <StatusBadge value="High Margin" type="positive" />}
                      </div>
                      <h3 className="text-xl font-light text-neutral-900 dark:text-vista-text group-hover:text-vista-accent transition-colors tracking-tight mt-2">{product.name}</h3>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-bold tracking-widest mb-1">Stock</p>
                      <p className="text-2xl font-light text-neutral-900 dark:text-vista-text">{product.stock.toLocaleString()}</p>
                   </div>
                 </div>
                 
                 <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Unit Cost</p>
                          <p className="text-sm font-medium">EGP {cost.toFixed(2)}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Margin</p>
                          <p className={`text-sm font-bold ${margin > 20 ? 'text-emerald-500' : 'text-amber-500'}`}>{margin.toFixed(1)}%</p>
                       </div>
                    </div>
                    
                    <div className="pt-6 border-t border-neutral-50 dark:border-neutral-800/50 space-y-3">
                       <div className="flex justify-between items-center text-[10px]">
                          <span className="text-neutral-400 font-bold uppercase tracking-widest">Formula</span>
                          <span className="text-neutral-900 dark:text-vista-text font-bold">{product.formula.length} Items</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px]">
                          <span className="text-neutral-400 font-bold uppercase tracking-widest">Packaging</span>
                          <span className="text-neutral-900 dark:text-vista-text font-bold truncate max-w-[120px]">{pack?.name || 'Undefined'}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-neutral-50 dark:border-neutral-800/50 flex justify-between items-center">
                    <button className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-900 dark:hover:text-vista-text transition-colors">Adjust Definition</button>
                    <button onClick={() => { setSelectedProductId(product.id); setIsProducing(true); }} className="text-[10px] font-bold text-vista-accent uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Launch Run &rarr;</button>
                 </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-24 rounded-sm text-center shadow-sm">
            <div className="max-w-xs mx-auto space-y-4">
              <svg className="w-12 h-12 text-neutral-200 dark:text-neutral-800 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 font-light italic">Manufacturing catalog is currently unpopulated.</p>
              {activeTab !== 'all' && <button onClick={() => setIsAdding(true)} className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-xl">Start Definition</button>}
            </div>
        </div>
      )}

      {isAdding && activeTab !== 'all' && <AddProductForm category={activeTab} onClose={() => setIsAdding(false)} />}
      {isProducing && <ProduceModal onClose={() => setIsProducing(false)} initialProductId={selectedProductId} />}
    </div>
  );
};
