
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { Product, ProductCategory, FormulaItem } from '../types';
import { CustomSelect, SearchableSelect, PageHeader, ModalBase } from './Common';

interface AddProductFormProps {
  category: ProductCategory;
  onClose: () => void;
}

const ProduceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { products, packaging, produceProduct } = useStore();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  
  React.useEffect(() => {
    if (selectedProduct) {
      setSelectedPackId(selectedProduct.packagingId);
    }
  }, [selectedProductId]);

  const handleProduce = () => {
    if (!selectedProductId || !selectedPackId || !quantity) return;
    const pack = packaging.find(p => p.id === selectedPackId);
    if (!pack) return;

    const batchSizeL = (parseInt(quantity) * pack.capacity) / 1000;
    const result = produceProduct(selectedProductId, batchSizeL, selectedPackId);
    
    if (result.success) {
      setMessage({ text: result.message, type: 'success' });
      setTimeout(onClose, 2000);
    } else {
      setMessage({ text: result.message, type: 'error' });
    }
  };

  return (
    <ModalBase isOpen={true} onClose={onClose} title="Produce" maxWidth="max-w-[450px]" footer={
      <>
        <button onClick={onClose} className="px-4 py-2 text-neutral-500 text-xs font-medium uppercase">Cancel</button>
        <button onClick={handleProduce} disabled={!selectedProductId || !selectedPackId || !quantity} className="px-8 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-xs font-bold uppercase rounded-sm shadow-xl transition-all disabled:opacity-30">
          Confirm
        </button>
      </>
    }>
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Product</label>
          <SearchableSelect 
            options={products.map(p => ({ value: p.id, label: p.name, subLabel: p.category }))}
            value={selectedProductId}
            onChange={setSelectedProductId}
            placeholder="Select a product..."
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Packaging</label>
          <CustomSelect 
            options={packaging.map(p => ({ value: p.id, label: `${p.name} (${p.capacity}ml)`, subLabel: `Stock: ${p.stock}` }))}
            value={selectedPackId}
            onChange={setSelectedPackId}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Quantity (Units)</label>
          <input 
            type="number" 
            className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-3 text-sm bg-white dark:bg-vista-bg outline-none focus:border-vista-accent" 
            placeholder="e.g. 100" 
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
        </div>

        {message && (
          <div className={`p-4 rounded-sm text-xs border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20'}`}>
            {message.text}
          </div>
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
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Retail Price</label>
            <input type="number" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-500 outline-none" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        </div>

        <div>
           <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Packaging</label>
           <CustomSelect 
             options={packaging.map(p => ({ value: p.id, label: `${p.name} (${p.capacity}ml)`, subLabel: `EGP ${(p.cost || 0).toFixed(2)}` }))}
             value={selectedPackId} onChange={setSelectedPackId}
           />
        </div>

        <div className="border-t border-b border-neutral-100 dark:border-neutral-800 py-6">
          <h3 className="text-[10px] font-bold text-neutral-900 dark:text-vista-text mb-4 uppercase tracking-wide">Ingredients (per 1L/Kg)</h3>
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
              <span>Unit Cost:</span>
              <span className="font-bold text-neutral-900 dark:text-vista-text">EGP {(totalUnitCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-500">Margin:</span>
              <span className={`font-bold ${(projectedMargin || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>{(projectedMargin || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

export const ProductionView: React.FC = () => {
  const { products, packaging } = useStore();
  const [activeTab, setActiveTab] = useState<'all' | ProductCategory>(ProductCategory.SKIN_CARE);
  const [isAdding, setIsAdding] = useState(false);
  const [isProducing, setIsProducing] = useState(false);

  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return products;
    return products.filter(p => p.category === activeTab);
  }, [products, activeTab]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col animate-fade-in overflow-x-hidden">
      <PageHeader 
        title="Formulas" 
        subtitle="Manage product definitions and execute production."
        actions={
          <button 
            onClick={() => setIsProducing(true)}
            className="w-full sm:w-auto px-10 py-3 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm hover:bg-neutral-800 transition-all text-sm font-bold uppercase tracking-[0.1em] shadow-xl"
          >
            Produce
          </button>
        }
      />

      <div className="flex gap-4 md:gap-8 mb-8 overflow-x-auto whitespace-nowrap border-b border-neutral-100 dark:border-neutral-800">
        {['all', ProductCategory.SKIN_CARE, ProductCategory.HAIR_CARE].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`pb-3 font-medium text-[10px] md:text-sm transition-all tracking-wide uppercase ${activeTab === tab ? 'text-neutral-900 dark:text-vista-accent border-b-2 border-neutral-900 dark:border-vista-accent' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            {tab === 'all' ? 'All' : tab}
          </button>
        ))}
      </div>
      
      {activeTab !== 'all' && (
        <div className="mb-8 flex justify-end">
           <button onClick={() => setIsAdding(true)} className="w-full sm:w-auto px-6 py-2 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-[10px] font-bold uppercase tracking-widest">+ New Formula</button>
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredProducts.map(product => {
            const pack = packaging.find(p => p.id === product.packagingId);
            return (
              <div key={product.id} className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-100 dark:border-neutral-800 p-8 flex flex-col hover:shadow-lg transition-all group">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest mb-2 inline-block ${product.category === ProductCategory.SKIN_CARE ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800' : 'bg-neutral-800 text-neutral-100 dark:bg-neutral-700'}`}>
                        {product.category}
                      </span>
                      <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text group-hover:text-vista-accent transition-colors">{product.name}</h3>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-bold tracking-widest">Inventory</p>
                      <p className="text-2xl font-light text-neutral-900 dark:text-vista-text">{product.stock}</p>
                   </div>
                 </div>
                 <div className="space-y-2 mb-2 text-xs text-neutral-500 dark:text-neutral-400 flex-1 border-t border-neutral-50 dark:border-neutral-800/50 pt-4">
                   <div className="flex justify-between"><span>Packaging</span><span className="font-medium text-neutral-800 dark:text-neutral-300">{pack?.name || '---'}</span></div>
                   <div className="flex justify-between"><span>Ingredients</span><span className="font-medium text-neutral-800 dark:text-neutral-300">{product.formula.length} Items</span></div>
                 </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-20 rounded-sm text-center">
            <p className="text-sm text-neutral-400 dark:text-neutral-600 italic mb-4">No formulas defined yet.</p>
            {activeTab !== 'all' && <button onClick={() => setIsAdding(true)} className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 dark:text-vista-accent hover:underline decoration-2 underline-offset-4">Create One Now &rarr;</button>}
        </div>
      )}

      {isAdding && activeTab !== 'all' && <AddProductForm category={activeTab} onClose={() => setIsAdding(false)} />}
      {isProducing && <ProduceModal onClose={() => setIsProducing(false)} />}
    </div>
  );
};
