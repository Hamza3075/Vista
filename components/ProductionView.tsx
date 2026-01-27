
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Product, ProductCategory, FormulaItem } from '../types';
import { CustomSelect, SearchableSelect, PageHeader, ModalBase } from './Common';

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
  const [ingId, setIngId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      category,
      packagingId: selectedPackId,
      salePrice: parseFloat(price),
      stock: 0,
      formula
    };
    await addProduct(newProduct);
    setIsSaving(false);
    onClose();
  };

  return (
    <ModalBase isOpen={true} onClose={onClose} title={`New ${category} Formula`} maxWidth="max-w-[600px]" footer={
      <>
        <button onClick={onClose} className="px-4 py-2 text-neutral-500 text-xs font-medium uppercase tracking-wide">Cancel</button>
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm shadow hover:bg-neutral-800 transition-all text-xs font-medium uppercase tracking-wide disabled:opacity-50">
          {isSaving ? 'Saving...' : 'Save Formula'}
        </button>
      </>
    }>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Product Name</label>
            <input type="text" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-500 outline-none" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Sale Price</label>
            <input type="number" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-500 outline-none" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        </div>

        <div>
           <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Glass Type</label>
           <CustomSelect 
             options={packaging.map(p => ({ value: p.id, label: `${p.name} (${p.capacity}ml)`, subLabel: `EGP ${(p.cost || 0).toFixed(2)}` }))}
             value={selectedPackId} onChange={setSelectedPackId}
           />
        </div>

        <div className="border-t border-b border-neutral-100 dark:border-neutral-800 py-6">
          <h3 className="text-[10px] font-bold text-neutral-900 dark:text-vista-text mb-4 uppercase tracking-wide">Composition (per 1L/Kg)</h3>
          <div className="flex flex-col sm:flex-row gap-2 mb-4 items-stretch">
            <div className="flex-1">
              <SearchableSelect options={ingredients.map(i => ({ value: i.id, label: i.name }))} value={ingId} onChange={setIngId} />
            </div>
            <div className="flex gap-2">
              <input type="number" className="flex-1 sm:w-24 border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg outline-none" placeholder="g/ml" value={amount} onChange={e => setAmount(e.target.value)} />
              <button onClick={handleAddIngredient} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 transition-colors rounded-sm font-medium text-neutral-700 dark:text-neutral-300 text-xs">Add</button>
            </div>
          </div>
          
          <ul className="space-y-1 mb-4 text-xs max-h-24 overflow-y-auto pr-1">
            {formula.map((f, idx) => {
              const ing = ingredients.find(i => i.id === f.ingredientId);
              return (
                <li key={idx} className="flex justify-between p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-sm border border-neutral-100 dark:border-neutral-800">
                  <span className="truncate mr-2">{ing?.name}</span>
                  <span className="font-mono text-neutral-500">{f.amount} {ing?.unit === 'kg' ? 'g' : 'ml'}</span>
                </li>
              );
            })}
          </ul>
          
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-sm text-[10px] md:text-xs space-y-1 mt-2">
            <div className="flex justify-between text-neutral-500">
              <span>Unit Cost (Liq + Glass):</span>
              <span className="font-bold text-neutral-900 dark:text-vista-text">EGP {(totalUnitCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-500">Projected Margin:</span>
              <span className={`font-bold ${(projectedMargin || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>{(projectedMargin || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

export const ProductionView: React.FC = () => {
  const { products, produceProduct, packaging, ingredients, settings } = useStore();
  const [activeTab, setActiveTab] = useState<'all' | ProductCategory>(ProductCategory.SKIN_CARE);
  const [isAdding, setIsAdding] = useState(false);
  const [producingId, setProducingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [productionMode, setProductionMode] = useState<'glasses' | 'batch'>('glasses');

  useEffect(() => {
    if (producingId) {
      setProductionMode(settings.defaultProductionMode);
      setInputValue('');
    }
  }, [producingId, settings.defaultProductionMode]);

  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return products;
    return products.filter(p => p.category === activeTab);
  }, [products, activeTab]);

  const producingProduct = useMemo(() => products.find(p => p.id === producingId), [products, producingId]);
  const producingPack = useMemo(() => packaging.find(p => p.id === producingProduct?.packagingId), [packaging, producingProduct]);

  const productionSimulation = useMemo(() => {
    if (!producingProduct || !producingPack || !inputValue) return null;
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) return null;

    let units = 0;
    let totalBatchSizeL = 0;

    if (productionMode === 'glasses') {
      units = val;
      totalBatchSizeL = (units * producingPack.capacity) / 1000;
    } else {
      totalBatchSizeL = val;
      units = Math.floor((totalBatchSizeL * 1000) / producingPack.capacity);
    }

    let possible = true;
    const resources = [];

    for (const item of producingProduct.formula) {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (ing) {
        const requiredBase = item.amount * totalBatchSizeL;
        const remainingBase = ing.stock - requiredBase;
        if (remainingBase < 0) possible = false;
        resources.push({
          name: ing.name,
          unit: ing.unit,
          current: ing.stock / 1000,
          required: requiredBase / 1000,
          remaining: remainingBase / 1000,
          ok: remainingBase >= 0
        });
      }
    }

    const remainingCount = producingPack.stock - units;
    if (remainingCount < 0) possible = false;
    resources.push({
      name: producingPack.name,
      unit: 'pcs',
      current: producingPack.stock,
      required: units,
      remaining: remainingCount,
      ok: remainingCount >= 0
    });

    return { possible, resources, totalBatchSizeL, units };
  }, [producingProduct, producingPack, inputValue, productionMode, ingredients]);

  const handleProduce = () => {
    if (!producingId || !productionSimulation) return;
    if (!productionSimulation.possible) return; 
    const result = produceProduct(producingId, productionSimulation.totalBatchSizeL);
    if (result.success) { setProducingId(null); setInputValue(''); }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col animate-fade-in overflow-x-hidden">
      <PageHeader 
        title="Glass Production Hub" 
        subtitle="Manage formulas and execute manufacturing runs using our glass system" 
      />

      <div className="flex gap-4 md:gap-8 mb-8 overflow-x-auto whitespace-nowrap border-b border-neutral-100 dark:border-neutral-800">
        {['all', ProductCategory.SKIN_CARE, ProductCategory.HAIR_CARE].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`pb-3 font-medium text-[10px] md:text-sm transition-all tracking-wide uppercase ${activeTab === tab ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            {tab === 'all' ? 'All Formulas' : tab}
          </button>
        ))}
      </div>
      
      {activeTab !== 'all' && (
        <div className="mb-8 flex justify-end">
           <button onClick={() => setIsAdding(true)} className="w-full sm:w-auto px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm hover:bg-neutral-800 transition-all text-xs font-medium uppercase tracking-wide">+ New Formula</button>
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {filteredProducts.map(product => {
            const pack = packaging.find(p => p.id === product.packagingId);
            return (
              <div key={product.id} className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 flex flex-col hover:shadow-md transition-all group">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest mb-2 inline-block ${product.category === ProductCategory.SKIN_CARE ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800' : 'bg-neutral-800 text-neutral-100 dark:bg-neutral-700'}`}>
                        {product.category}
                      </span>
                      <h3 className="text-lg md:text-xl font-medium text-neutral-900 dark:text-vista-text group-hover:text-vista-accent transition-colors">{product.name}</h3>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-bold tracking-widest">Inventory</p>
                      <p className="text-xl md:text-2xl font-light text-neutral-900 dark:text-vista-text">{product.stock} <span className="text-[10px] uppercase">Glasses</span></p>
                   </div>
                 </div>
                 <div className="space-y-2 mb-6 text-xs md:text-sm text-neutral-600 dark:text-neutral-400 flex-1 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                   <div className="flex justify-between"><span className="text-neutral-400 font-light">Glass Type</span><span className="font-medium text-neutral-800 dark:text-neutral-300 truncate max-w-[120px]">{pack?.name || '---'}</span></div>
                   <div className="flex justify-between"><span className="text-neutral-400 font-light">Recipe</span><span className="font-medium text-neutral-800 dark:text-neutral-300">{product.formula.length} Ingred.</span></div>
                 </div>
                 <button onClick={() => setProducingId(product.id)} className="w-full py-2 border border-neutral-900 dark:border-vista-accent text-neutral-900 dark:text-vista-accent rounded-sm hover:bg-neutral-900 dark:hover:bg-vista-accent hover:text-white dark:hover:text-neutral-900 font-medium text-xs uppercase tracking-wide transition-all">Start Batch</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-20 rounded-sm text-center">
            <p className="text-sm text-neutral-400 dark:text-neutral-600 italic mb-4">No formulas found</p>
            {activeTab !== 'all' && <button onClick={() => setIsAdding(true)} className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-vista-accent hover:underline decoration-2 underline-offset-4">Create Formula &rarr;</button>}
        </div>
      )}

      {isAdding && activeTab !== 'all' && <AddProductForm category={activeTab} onClose={() => setIsAdding(false)} />}

      {producingId && producingProduct && producingPack && (
        <ModalBase isOpen={!!producingId} onClose={() => setProducingId(null)} title={`Batch Production: ${producingProduct.name}`} footer={
          <>
            <button onClick={() => setProducingId(null)} className="px-4 py-2 text-neutral-500 text-xs font-medium uppercase transition-colors">Cancel</button>
            <button onClick={handleProduce} disabled={productionSimulation ? !productionSimulation.possible : true} className={`px-8 py-2 text-white dark:text-neutral-900 rounded-sm shadow-lg font-medium text-xs uppercase transition-colors ${(productionSimulation && productionSimulation.possible) ? 'bg-neutral-900 dark:bg-vista-accent' : 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'}`}>EXECUTE BATCH</button>
          </>
        }>
          <div className="text-[10px] text-neutral-500 font-light flex gap-2 mb-6">
             <span>{producingPack.capacity}ml Volume</span><span>•</span><span className="truncate">{producingPack.name}</span>
          </div>
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-sm w-full mb-6">
              <button onClick={() => setProductionMode('glasses')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-sm transition-all ${productionMode === 'glasses' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-vista-text shadow-sm' : 'text-neutral-500'}`}>Glass System</button>
              <button onClick={() => setProductionMode('batch')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-sm transition-all ${productionMode === 'batch' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-vista-text shadow-sm' : 'text-neutral-500'}`}>Total Batch (L)</button>
          </div>
          <div className="mb-6">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wide mb-2">{productionMode === 'glasses' ? 'Number of Glasses to Produce' : 'Batch Volume (Liters)'}</label>
            <input type="number" autoFocus className="w-full border-b-2 border-neutral-200 dark:border-neutral-700 px-2 py-2 text-3xl font-light text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none" placeholder="0" value={inputValue} onChange={e => setInputValue(e.target.value)} />
          </div>
          {productionSimulation && (
            <div className="mb-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-[9px] font-bold text-neutral-500 uppercase">Requirement Summary ({productionSimulation.units} Glasses)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] min-w-[300px]">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                    <tr><th className="px-4 py-2 font-medium text-neutral-500">Resource</th><th className="px-4 py-2 font-medium text-neutral-500 text-right">Required</th><th className="px-4 py-2 font-medium text-neutral-500 text-right">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {productionSimulation.resources.map((res, i) => (
                      <tr key={i} className={res.ok ? 'text-neutral-600 dark:text-neutral-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 font-medium'}>
                        <td className="px-4 py-2 truncate max-w-[120px]">{res.name}</td>
                        <td className="px-4 py-2 text-right">{(res.required || 0).toFixed(1)} {res.unit}</td>
                        <td className="px-4 py-2 text-right">{res.ok ? 'OK' : 'INSUFFICIENT'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </ModalBase>
      )}
    </div>
  );
};
