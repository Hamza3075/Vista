import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { Packaging } from '../types';
import { CustomSelect } from './Common';

export const PackagingView: React.FC = () => {
  const { packaging, addPackaging, updatePackaging, products, produceProduct } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [buyPackId, setBuyPackId] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState(0);

  // Fill Modal States
  const [fillPackId, setFillPackId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [fillVolume, setFillVolume] = useState<string>('');
  const [fillMessage, setFillMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newCost, setNewCost] = useState('');

  // Derived state for Fill Modal
  const fillPack = packaging.find(p => p.id === fillPackId);
  const compatibleProducts = useMemo(() => {
    return products.filter(p => p.packagingId === fillPackId);
  }, [products, fillPackId]);

  // Calculations for Fill Modal
  const calculatedUnits = useMemo(() => {
    if (!fillPack || !fillVolume) return 0;
    const vol = parseFloat(fillVolume);
    if (isNaN(vol)) return 0;
    // Capacity is ml, Volume is L/Kg
    return Math.floor((vol * 1000) / fillPack.capacity);
  }, [fillPack, fillVolume]);

  const handleAdd = () => {
    if (!newName || !newCapacity || !newCost) return;
    const newPack: Packaging = {
      id: `p-${Date.now()}`,
      name: newName,
      capacity: parseInt(newCapacity),
      cost: parseFloat(newCost),
      stock: 0
    };
    addPackaging(newPack);
    setShowAdd(false);
    setNewName('');
    setNewCapacity('');
    setNewCost('');
  };

  const handleBuy = (id: string) => {
    const pack = packaging.find(p => p.id === id);
    if (!pack) return;
    updatePackaging(id, { stock: pack.stock + buyAmount });
    setBuyPackId(null);
    setBuyAmount(0);
  };

  const handleFill = () => {
      if (!selectedProductId || !fillVolume) return;
      const vol = parseFloat(fillVolume);
      if (isNaN(vol) || vol <= 0) return;

      const result = produceProduct(selectedProductId, vol);
      setFillMessage({ text: result.message, type: result.success ? 'success' : 'error' });
      
      if (result.success) {
          // Optional: close modal on success or keep it open for more fills? 
          // Let's reset values but keep modal open to show success
          setFillVolume('');
      }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-light text-neutral-900 dark:text-vista-text tracking-tight">Packaging</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-light">Inventory management for bottles & containers</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="px-6 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm font-medium hover:bg-neutral-800 dark:hover:bg-yellow-400 transition-all text-sm tracking-wide uppercase shadow-lg shadow-neutral-200 dark:shadow-none"
        >
          + Add Bottle Size
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packaging.map((pack) => (
          <div key={pack.id} className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col hover:shadow-lg dark:hover:border-neutral-700 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-medium text-lg text-neutral-900 dark:text-vista-text group-hover:text-neutral-700 dark:group-hover:text-vista-text">{pack.name}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light mt-1">{pack.capacity} ml capacity</p>
              </div>
              <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold rounded-full border border-neutral-200 dark:border-neutral-700">
                EGP {pack.cost.toFixed(2)}
              </span>
            </div>
            
            <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-bold mb-1">Stock Level</p>
                    <p className="text-3xl font-light text-neutral-900 dark:text-vista-text">{pack.stock.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => setBuyPackId(pack.id)}
                    className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-sm text-xs font-bold uppercase tracking-wide hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-colors"
                >
                    Buy Empty
                </button>
                 <button 
                    onClick={() => {
                        setFillPackId(pack.id);
                        setSelectedProductId('');
                        setFillVolume('');
                        setFillMessage(null);
                    }}
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-sm text-xs font-bold uppercase tracking-wide hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                >
                    Fill / Package
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm shadow-2xl w-96 border border-transparent dark:border-neutral-800">
            <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text mb-6">Add New Bottle Size</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 outline-none focus:border-neutral-500 dark:focus:border-vista-accent text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg"
                  placeholder="e.g. Travel Size 50ml"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Capacity (ml)</label>
                <input 
                  type="number" 
                  value={newCapacity} 
                  onChange={e => setNewCapacity(e.target.value)}
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 outline-none focus:border-neutral-500 dark:focus:border-vista-accent text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Cost per Unit (EGP)</label>
                <input 
                  type="number" 
                  value={newCost} 
                  onChange={e => setNewCost(e.target.value)}
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 outline-none focus:border-neutral-500 dark:focus:border-vista-accent text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg"
                  placeholder="0.50"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-sm font-medium uppercase">Cancel</button>
              <button onClick={handleAdd} className="bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 px-6 py-2 rounded-sm hover:bg-neutral-800 dark:hover:bg-yellow-400 text-sm font-medium uppercase shadow-lg">Add Size</button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {buyPackId && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm shadow-2xl w-80 border border-transparent dark:border-neutral-800">
            <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text mb-2">Restock</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-light">{packaging.find(p => p.id === buyPackId)?.name}</p>
            
            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Number of units</label>
            <input 
              type="number" 
              value={buyAmount} 
              onChange={e => setBuyAmount(parseInt(e.target.value))}
              className="w-full border-b-2 border-neutral-200 dark:border-neutral-700 px-2 py-2 text-3xl font-light text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none mb-6"
              min="1"
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => setBuyPackId(null)} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-sm font-medium uppercase">Cancel</button>
              <button onClick={() => handleBuy(buyPackId)} className="bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 px-6 py-2 rounded-sm hover:bg-neutral-800 dark:hover:bg-yellow-400 text-sm font-medium uppercase shadow-lg">Buy</button>
            </div>
          </div>
        </div>
      )}

      {/* Fill / Package Modal */}
      {fillPackId && fillPack && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm shadow-2xl w-[500px] border border-transparent dark:border-neutral-800">
             <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text mb-2">Fill Bottles</h3>
             <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-light">Package bulk liquid into <span className="font-medium text-neutral-800 dark:text-neutral-300">{fillPack.name}</span>.</p>

             {fillMessage && (
                <div className={`p-3 rounded-sm text-sm mb-6 ${fillMessage.type === 'success' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-vista-text border border-neutral-200 dark:border-neutral-700' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/30'}`}>
                  {fillMessage.text}
                </div>
              )}

             <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Select Product Formula</label>
                    <CustomSelect 
                        options={compatibleProducts.map(p => ({ value: p.id, label: p.name }))}
                        value={selectedProductId}
                        onChange={setSelectedProductId}
                        placeholder={compatibleProducts.length === 0 ? "No formulas use this bottle" : "Select Product..."}
                    />
                    {compatibleProducts.length === 0 && <p className="text-xs text-red-500 mt-1">Create a product with this packaging in Production tab first.</p>}
                </div>

                <div>
                    <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Available Liquid Volume (Kg / Liters)</label>
                    <input 
                        type="number" 
                        value={fillVolume} 
                        onChange={e => { setFillVolume(e.target.value); setFillMessage(null); }}
                        className="w-full border-b-2 border-neutral-200 dark:border-neutral-700 px-2 py-2 text-3xl font-light text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none placeholder:text-neutral-200 dark:placeholder:text-neutral-700"
                        min="0.1"
                        placeholder="0.0"
                    />
                    {calculatedUnits > 0 && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                            Produces <strong className="text-neutral-900 dark:text-vista-text">{calculatedUnits}</strong> finished units.
                        </p>
                    )}
                </div>
             </div>

             <div className="flex justify-end gap-4 mt-8">
                <button 
                    onClick={() => setFillPackId(null)} 
                    className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-sm font-medium uppercase"
                >
                    Close
                </button>
                <button 
                    onClick={handleFill}
                    disabled={!selectedProductId || !fillVolume || parseFloat(fillVolume) <= 0}
                    className={`bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 px-6 py-2 rounded-sm font-medium text-sm uppercase shadow-lg transition-colors
                        ${(!selectedProductId || !fillVolume) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-800 dark:hover:bg-yellow-400'}`}
                >
                    Package
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};