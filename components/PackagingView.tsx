
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { Packaging } from '../types';
import { CustomSelect, PageHeader, ModalBase } from './Common';

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
  const [newMinStock, setNewMinStock] = useState('');

  const fillPack = packaging.find(p => p.id === fillPackId);
  const compatibleProducts = useMemo(() => {
    return products.filter(p => p.packagingId === fillPackId);
  }, [products, fillPackId]);

  const calculatedUnits = useMemo(() => {
    if (!fillPack || !fillVolume) return 0;
    const vol = parseFloat(fillVolume);
    if (isNaN(vol)) return 0;
    return Math.floor((vol * 1000) / fillPack.capacity);
  }, [fillPack, fillVolume]);

  const handleAdd = () => {
    if (!newName || !newCapacity || !newCost) return;
    const minVal = parseInt(newMinStock);
    const newPack: Packaging = {
      id: `p-${Date.now()}`,
      name: newName,
      capacity: parseInt(newCapacity),
      cost: parseFloat(newCost),
      stock: 0,
      minStock: !isNaN(minVal) ? minVal : undefined
    };
    addPackaging(newPack);
    setShowAdd(false);
    setNewName(''); setNewCapacity(''); setNewCost(''); setNewMinStock('');
  };

  const handleBuy = (id: string) => {
    const pack = packaging.find(p => p.id === id);
    if (!pack) return;
    updatePackaging(id, { stock: pack.stock + buyAmount });
    setBuyPackId(null); setBuyAmount(0);
  };

  const handleFill = () => {
      if (!selectedProductId || !fillVolume) return;
      const vol = parseFloat(fillVolume);
      if (isNaN(vol) || vol <= 0) return;
      const result = produceProduct(selectedProductId, vol);
      setFillMessage({ text: result.message, type: result.success ? 'success' : 'error' });
      if (result.success) setFillVolume('');
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <PageHeader 
        title="Packaging" 
        subtitle="Inventory management for bottles and containers"
        actions={
          <button 
            onClick={() => setShowAdd(true)}
            className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm font-medium hover:bg-neutral-800 transition-all text-[10px] md:text-xs tracking-wide uppercase shadow-lg"
          >
            + Add Bottle Size
          </button>
        }
      />

      {packaging.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {packaging.map((pack) => (
            <div key={pack.id} className="bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col hover:shadow-lg transition-all group">
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <div>
                  <h3 className="font-medium text-lg text-neutral-900 dark:text-vista-text">{pack.name}</h3>
                  <p className="text-xs text-neutral-500 font-light mt-1">{pack.capacity} ml capacity</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 md:px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold rounded-full border border-neutral-200 dark:border-neutral-700">
                    EGP {(pack.cost || 0).toFixed(2)}
                  </span>
                  {pack.minStock && (
                    <span className="text-[9px] text-vista-accent font-bold opacity-70">
                      Alert @ {pack.minStock}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-4 md:pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                <div>
                  <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Stock Level</p>
                  <p className="text-2xl md:text-3xl font-light text-neutral-900 dark:text-vista-text">{pack.stock.toLocaleString()}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                   <button 
                      onClick={() => setBuyPackId(pack.id)}
                      className="px-2 py-2 border border-neutral-300 dark:border-neutral-700 rounded-sm text-[9px] md:text-xs font-bold uppercase tracking-wide hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                      Buy Empty
                  </button>
                   <button 
                      onClick={() => { setFillPackId(pack.id); setSelectedProductId(''); setFillVolume(''); setFillMessage(null); }}
                      className="px-2 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-sm text-[9px] md:text-xs font-bold uppercase tracking-wide hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                      Package
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-20 rounded-sm text-center">
            <p className="text-sm text-neutral-400 dark:text-neutral-600 italic mb-4">No packaging defined</p>
            <button 
              onClick={() => setShowAdd(true)}
              className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-vista-accent hover:underline decoration-2 underline-offset-4"
            >
              Add Bottle Size &rarr;
            </button>
        </div>
      )}

      <ModalBase isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Bottle Definition" footer={
        <>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-neutral-500 text-xs font-medium uppercase">Cancel</button>
          <button onClick={handleAdd} className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-xs font-bold uppercase rounded-sm shadow hover:bg-neutral-800 transition-all">Add Definition</button>
        </>
      }>
        <div className="space-y-4">
          <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Description</label>
              <input type="text" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text outline-none focus:border-neutral-500" placeholder="e.g. Amber Glass Bottle" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Capacity (ml)</label>
                  <input type="number" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text outline-none" placeholder="250" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} />
              </div>
              <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Unit Cost (EGP)</label>
                  <input type="number" className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text outline-none" placeholder="1.50" value={newCost} onChange={e => setNewCost(e.target.value)} />
              </div>
          </div>
          <div>
              <label className="block text-[10px] font-bold text-vista-accent uppercase mb-1">Min Stock Alert (pcs)</label>
              <input type="number" className="w-full border-vista-accent/30 focus:border-vista-accent rounded-sm p-2 text-sm bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text outline-none" placeholder="Default: 100" value={newMinStock} onChange={e => setNewMinStock(e.target.value)} />
          </div>
        </div>
      </ModalBase>

      {buyPackId && (
        <ModalBase isOpen={!!buyPackId} onClose={() => setBuyPackId(null)} title="Buy New Stock" maxWidth="max-w-[400px]" footer={
          <>
            <button onClick={() => setBuyPackId(null)} className="text-xs font-bold uppercase text-neutral-400 hover:text-neutral-900">Cancel</button>
            <button onClick={() => handleBuy(buyPackId)} className="bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 px-8 py-2 rounded-sm text-xs font-bold uppercase shadow hover:bg-neutral-800 transition-all">Confirm</button>
          </>
        }>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase">Quantity (pcs)</label>
            <input 
              type="number" autoFocus className="w-full border-b-2 border-neutral-200 dark:border-neutral-700 py-2 text-3xl font-light text-neutral-900 dark:text-vista-text bg-transparent outline-none focus:border-neutral-900 dark:focus:border-vista-accent"
              placeholder="0" value={buyAmount === 0 ? '' : buyAmount} onChange={e => setBuyAmount(parseInt(e.target.value) || 0)}
            />
          </div>
        </ModalBase>
      )}

      {fillPackId && fillPack && (
        <ModalBase isOpen={!!fillPackId} onClose={() => setFillPackId(null)} title="Package Liquid Batch" footer={
          <>
            <button onClick={() => setFillPackId(null)} className="px-4 py-2 text-neutral-500 text-xs font-medium uppercase">Close</button>
            <button onClick={handleFill} disabled={!selectedProductId || !fillVolume} className="px-8 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-xs font-bold uppercase rounded-sm shadow hover:bg-neutral-800 transition-all disabled:opacity-50">Fill & Package</button>
          </>
        }>
          <p className="text-xs text-neutral-500 mb-6 italic">Packing into {fillPack.name} ({fillPack.capacity}ml)</p>
          <div className="space-y-6">
            <div>
               <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Select Formula</label>
               <CustomSelect options={compatibleProducts.map(p => ({ value: p.id, label: p.name }))} value={selectedProductId} onChange={setSelectedProductId} placeholder="Compatible Products..." />
               {compatibleProducts.length === 0 && <p className="text-[10px] text-red-500 mt-2">No existing formulas use this packaging size.</p>}
            </div>
            <div>
               <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Total Batch Size (L)</label>
               <input type="number" className="w-full border-b border-neutral-300 dark:border-neutral-700 py-2 text-2xl font-light text-neutral-900 dark:text-vista-text bg-transparent outline-none focus:border-neutral-900" placeholder="0.00" value={fillVolume} onChange={e => { setFillVolume(e.target.value); setFillMessage(null); }} />
            </div>
            {calculatedUnits > 0 && (
               <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-sm border border-neutral-100 dark:border-neutral-800 text-center">
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest mb-1">Yield Estimation</p>
                  <p className="text-2xl font-light text-neutral-900 dark:text-vista-text">{calculatedUnits} Units</p>
               </div>
            )}
            {fillMessage && (
               <div className={`p-3 text-xs rounded-sm border ${fillMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                  {fillMessage.text}
               </div>
            )}
          </div>
        </ModalBase>
      )}
    </div>
  );
};
