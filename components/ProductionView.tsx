import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Product, ProductCategory, FormulaItem } from '../types';
import { CustomSelect, SearchableSelect } from './Common';

interface AddProductFormProps {
  category: ProductCategory;
  onClose: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ category, onClose }) => {
  const { ingredients, packaging, addProduct } = useStore();
  const [name, setName] = useState('');
  const [selectedPackId, setSelectedPackId] = useState(packaging[0]?.id || '');
  const [price, setPrice] = useState('');
  const [formula, setFormula] = useState<FormulaItem[]>([]);
  
  // Temp formula state
  const [ingId, setIngId] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddIngredient = () => {
    if (!ingId || !amount) return;
    setFormula(prev => [...prev, { ingredientId: ingId, amount: parseFloat(amount) }]);
    setAmount('');
    setIngId(''); // Reset selection
  };

  // Cost Calculations
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

  const handleSave = () => {
    if (!name || !price || !selectedPackId) return;
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      category,
      packagingId: selectedPackId,
      salePrice: parseFloat(price),
      stock: 0,
      formula
    };
    addProduct(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10">
      <div className="bg-white dark:bg-neutral-900 rounded-sm shadow-2xl w-[600px] max-w-full m-4 p-8 animate-fade-in border border-transparent dark:border-neutral-800">
        <h2 className="text-2xl font-light text-neutral-900 dark:text-vista-text mb-6">New {category} Formula</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Product Name</label>
              <input type="text" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-500 dark:focus:border-vista-accent outline-none transition-colors" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Sale Price (per unit)</label>
              <input type="number" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-500 dark:focus:border-vista-accent outline-none transition-colors" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Packaging Type</label>
             <CustomSelect 
               options={packaging.map(p => ({
                 value: p.id,
                 label: `${p.name} (${p.capacity}ml)`,
                 subLabel: `Cost: EGP ${p.cost.toFixed(2)}`
               }))}
               value={selectedPackId}
               onChange={setSelectedPackId}
               placeholder="Select Packaging"
             />
          </div>

          <div className="border-t border-b border-neutral-100 dark:border-neutral-800 py-6">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-vista-text mb-4 uppercase tracking-wide">Formula Composition (per 1 Liter/Kg)</h3>
            <div className="flex gap-2 mb-4 items-end">
              <div className="flex-1">
                <SearchableSelect 
                  options={ingredients.map(i => ({ value: i.id, label: i.name }))}
                  value={ingId}
                  onChange={setIngId}
                  placeholder="Select Ingredient..."
                />
              </div>
              <div className="w-24">
                <input 
                    type="number" 
                    className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg outline-none focus:border-neutral-500 dark:focus:border-vista-accent" 
                    placeholder="Qty (g/ml)" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
              </div>
              <button onClick={handleAddIngredient} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-sm font-medium text-neutral-700 dark:text-neutral-300 text-sm transition-colors mb-0.5">Add</button>
            </div>
            
            <ul className="space-y-1 mb-4 text-sm max-h-32 overflow-y-auto pr-2">
              {formula.map((f, idx) => {
                const ing = ingredients.find(i => i.id === f.ingredientId);
                return (
                  <li key={idx} className="flex justify-between p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-sm border border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-700 dark:text-neutral-300">{ing?.name}</span>
                    <span className="font-mono text-neutral-500 dark:text-neutral-400">{f.amount} {ing?.unit === 'kg' ? 'g' : 'ml'}</span>
                  </li>
                );
              })}
              {formula.length === 0 && <li className="text-neutral-400 dark:text-neutral-500 italic text-sm">No ingredients added yet.</li>}
            </ul>
            
            {/* Detailed Breakdown */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-sm border border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Raw Formula Cost (per L):</span>
                <span>EGP {rawCostPerL.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Liquid Cost (per {selectedPack?.capacity}ml unit):</span>
                <span>EGP {unitLiquidCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                <span>Packaging Cost:</span>
                <span>EGP {unitPackCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-neutral-900 dark:text-vista-text pt-1">
                <span>Total Unit Cost:</span>
                <span>EGP {totalUnitCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Projected Margin:</span>
                <span className={`font-bold ${projectedMargin > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{projectedMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={onClose} className="px-6 py-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-sm font-medium uppercase tracking-wide transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-8 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm shadow hover:bg-neutral-800 dark:hover:bg-yellow-400 text-sm font-medium uppercase tracking-wide transition-colors">Save Formula</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductionView: React.FC = () => {
  const { products, produceProduct, packaging, ingredients, settings } = useStore();
  const [activeTab, setActiveTab] = useState<'all' | ProductCategory>(ProductCategory.SKIN_CARE);
  const [isAdding, setIsAdding] = useState(false);
  const [producingId, setProducingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [productionMode, setProductionMode] = useState<'units' | 'batch'>('units');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Initialize mode from settings when opening modal
  useEffect(() => {
    if (producingId) {
      setProductionMode(settings.defaultProductionMode);
      setInputValue('');
      setMessage(null);
    }
  }, [producingId, settings.defaultProductionMode]);

  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return products;
    return products.filter(p => p.category === activeTab);
  }, [products, activeTab]);

  const producingProduct = useMemo(() => products.find(p => p.id === producingId), [products, producingId]);
  const producingPack = useMemo(() => packaging.find(p => p.id === producingProduct?.packagingId), [packaging, producingProduct]);

  // Production Simulation Logic
  const productionSimulation = useMemo(() => {
    if (!producingProduct || !producingPack || !inputValue) return null;

    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) return null;

    let units = 0;
    let totalBatchSizeL = 0;

    if (productionMode === 'units') {
      units = val;
      // Calculate total liters required: units * (capacity / 1000)
      totalBatchSizeL = (units * producingPack.capacity) / 1000;
    } else {
      totalBatchSizeL = val;
      // Calculate units produced: (liters * 1000) / capacity
      units = Math.floor((totalBatchSizeL * 1000) / producingPack.capacity);
    }

    let possible = true;
    const resources = [];

    // 1. Ingredients
    for (const item of producingProduct.formula) {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (ing) {
        const requiredBase = item.amount * totalBatchSizeL; // Total grams/ml needed
        const remainingBase = ing.stock - requiredBase;
        
        const currentDisplay = ing.stock / 1000;
        const requiredDisplay = requiredBase / 1000;
        const remainingDisplay = remainingBase / 1000;

        if (remainingBase < 0) possible = false;

        resources.push({
          name: ing.name,
          unit: ing.unit,
          current: currentDisplay,
          required: requiredDisplay,
          remaining: remainingDisplay,
          ok: remainingBase >= 0
        });
      }
    }

    // 2. Packaging
    const requiredCount = units;
    const remainingCount = producingPack.stock - requiredCount;
    
    if (remainingCount < 0) possible = false;

    resources.push({
      name: producingPack.name,
      unit: 'pcs',
      current: producingPack.stock,
      required: requiredCount,
      remaining: remainingCount,
      ok: remainingCount >= 0
    });

    return { possible, resources, totalBatchSizeL, units };

  }, [producingProduct, producingPack, inputValue, productionMode, ingredients]);


  const handleProduce = () => {
    if (!producingId || !productionSimulation) return;
    if (!productionSimulation.possible) return; 

    // We pass the calculated volume (L) to produceProduct
    const result = produceProduct(producingId, productionSimulation.totalBatchSizeL);
    
    setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    if (result.success) {
      setProducingId(null);
      setInputValue('');
    }
  };

  const getProductCost = (product: Product) => {
      const pack = packaging.find(p => p.id === product.packagingId);
      if (!pack) return 0;
      const volumeRatio = pack.capacity / 1000; 
      const ingredientCostPerL = product.formula.reduce((acc, item) => {
          const ing = ingredients.find(i => i.id === item.ingredientId);
          return acc + (ing ? ing.costPerBaseUnit * item.amount : 0);
      }, 0);
      return (ingredientCostPerL * volumeRatio) + pack.cost;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col animate-fade-in">
      <header className="flex justify-between items-center mb-10 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
           <h2 className="text-3xl font-light text-neutral-900 dark:text-vista-text tracking-tight">Production Hub</h2>
           <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-light">Manage formulas and execute production runs</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-8 mb-8">
        <button 
          onClick={() => setActiveTab('all')} 
          className={`pb-2 font-medium text-sm transition-all tracking-wide uppercase ${activeTab === 'all' ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-vista-text'}`}
        >
          All Formulas
        </button>
        <button 
          onClick={() => setActiveTab(ProductCategory.SKIN_CARE)} 
          className={`pb-2 font-medium text-sm transition-all tracking-wide uppercase ${activeTab === ProductCategory.SKIN_CARE ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-vista-text'}`}
        >
          Skin Care
        </button>
        <button 
          onClick={() => setActiveTab(ProductCategory.HAIR_CARE)} 
          className={`pb-2 font-medium text-sm transition-all tracking-wide uppercase ${activeTab === ProductCategory.HAIR_CARE ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-vista-text'}`}
        >
          Hair Care
        </button>
      </div>
      
      {/* Action Bar */}
      {activeTab !== 'all' && (
        <div className="mb-8 flex justify-end">
           <button 
             onClick={() => setIsAdding(true)}
             className="flex items-center gap-2 px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm hover:bg-neutral-800 dark:hover:bg-yellow-400 shadow-lg shadow-neutral-200 dark:shadow-none transition-all text-sm font-medium uppercase tracking-wide"
           >
             <span>+</span> New Formula
           </button>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredProducts.map(product => {
          const pack = packaging.find(p => p.id === product.packagingId);
          const unitCost = getProductCost(product);

          return (
            <div key={product.id} className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-8 flex flex-col hover:border-neutral-400 dark:hover:border-neutral-600 transition-all group shadow-sm hover:shadow-md dark:shadow-none">
               <div className="flex justify-between items-start mb-6">
                 <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest mb-3 inline-block ${product.category === ProductCategory.SKIN_CARE ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' : 'bg-neutral-800 text-neutral-100 dark:bg-neutral-700 dark:text-vista-text'}`}>
                      {product.category}
                    </span>
                    <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text group-hover:text-neutral-700 dark:group-hover:text-vista-accent transition-colors">{product.name}</h3>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-bold">Stock</p>
                    <p className="text-2xl font-light text-neutral-900 dark:text-vista-text">{product.stock}</p>
                 </div>
               </div>

               <div className="space-y-3 mb-8 text-sm text-neutral-600 dark:text-neutral-400 flex-1 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                 <div className="flex justify-between">
                   <span className="text-neutral-400 dark:text-neutral-500 font-light">Packaging</span>
                   <span className="font-medium text-neutral-800 dark:text-neutral-300">{pack?.name || 'Unknown'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-neutral-400 dark:text-neutral-500 font-light">Unit Cost</span>
                   <span className="font-medium text-neutral-800 dark:text-neutral-300">EGP {unitCost.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-neutral-400 dark:text-neutral-500 font-light">Complexity</span>
                   <span className="font-medium text-neutral-800 dark:text-neutral-300">{product.formula.length} Ingredients</span>
                 </div>
               </div>

               <button 
                 onClick={() => setProducingId(product.id)}
                 className="w-full py-3 border border-neutral-900 dark:border-vista-accent text-neutral-900 dark:text-vista-accent rounded-sm hover:bg-neutral-900 dark:hover:bg-vista-accent hover:text-white dark:hover:text-neutral-900 font-medium text-sm uppercase tracking-wide transition-all"
               >
                 Produce Batch
               </button>
            </div>
          );
        })}
      </div>

      {isAdding && activeTab !== 'all' && (
        <AddProductForm category={activeTab} onClose={() => setIsAdding(false)} />
      )}

      {/* Production Modal */}
      {producingId && producingProduct && producingPack && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm shadow-2xl w-[600px] max-w-full m-4 border border-transparent dark:border-neutral-800">
              <header className="mb-6">
                <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text mb-1">Produce: {producingProduct.name}</h3>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-light flex gap-2">
                   <span>Unit Size: {producingPack.capacity}ml</span>
                   <span>•</span>
                   <span>Packaging: {producingPack.name}</span>
                </div>
              </header>

              {message && (
                <div className={`p-3 rounded-sm text-sm mb-4 ${message.type === 'success' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-vista-text border border-neutral-200 dark:border-neutral-700' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/30'}`}>
                  {message.text}
                </div>
              )}

              {/* Toggle Logic */}
              <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-sm w-full mb-6">
                  <button 
                    onClick={() => setProductionMode('units')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-sm transition-all ${productionMode === 'units' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-vista-text shadow-sm' : 'text-neutral-500 dark:text-neutral-400'}`}
                  >
                    By Unit Count
                  </button>
                  <button 
                    onClick={() => setProductionMode('batch')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-sm transition-all ${productionMode === 'batch' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-vista-text shadow-sm' : 'text-neutral-500 dark:text-neutral-400'}`}
                  >
                    By Total Batch Weight
                  </button>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">
                    {productionMode === 'units' ? 'Quantity (Number of Bottles)' : 'Total Batch Size (Kg / Liters)'}
                </label>
                <input 
                  type="number" 
                  autoFocus
                  className="w-full border-b-2 border-neutral-200 dark:border-neutral-700 px-2 py-2 text-3xl font-light text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-colors placeholder:text-neutral-200 dark:placeholder:text-neutral-700"
                  placeholder="0"
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value);
                    setMessage(null);
                  }}
                />
                {productionMode === 'batch' && inputValue && productionSimulation && (
                     <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                        Produces approx <strong className="text-neutral-900 dark:text-vista-text">{productionSimulation.units}</strong> units of {producingPack.capacity}ml.
                     </p>
                )}
              </div>

              {/* Resource Simulation Table */}
              {productionSimulation && (
                <div className="mb-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                  <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                    Requirements for {productionSimulation.units} Units ({productionSimulation.totalBatchSizeL.toFixed(1)}L Batch)
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                      <tr>
                        <th className="px-4 py-2 font-medium text-neutral-500 dark:text-neutral-400">Resource</th>
                        <th className="px-4 py-2 font-medium text-neutral-500 dark:text-neutral-400 text-right">Stock</th>
                        <th className="px-4 py-2 font-medium text-neutral-500 dark:text-neutral-400 text-right">Needed</th>
                        <th className="px-4 py-2 font-medium text-neutral-500 dark:text-neutral-400 text-right">After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {productionSimulation.resources.map((res, i) => (
                        <tr key={i} className={res.ok ? 'text-neutral-600 dark:text-neutral-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium'}>
                          <td className="px-4 py-2">{res.name}</td>
                          <td className="px-4 py-2 text-right">{res.current.toLocaleString()} {res.unit}</td>
                          <td className="px-4 py-2 text-right">-{res.required.toLocaleString()} {res.unit}</td>
                          <td className="px-4 py-2 text-right">{res.remaining.toLocaleString()} {res.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!productionSimulation.possible && (
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs text-center border-t border-red-200 dark:border-red-800 font-bold">
                      INSUFFICIENT STOCK
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => { setProducingId(null); setMessage(null); setInputValue(''); }}
                  className="px-4 py-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-sm font-medium uppercase tracking-wide transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProduce}
                  disabled={productionSimulation ? !productionSimulation.possible : true}
                  className={`px-8 py-2 text-white dark:text-neutral-900 rounded-sm shadow-lg font-medium text-sm uppercase tracking-wide transition-colors
                    ${(productionSimulation && productionSimulation.possible) 
                      ? 'bg-neutral-900 hover:bg-neutral-800 dark:bg-vista-accent dark:hover:bg-yellow-400' 
                      : 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'}`}
                >
                  PRODUCE
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};