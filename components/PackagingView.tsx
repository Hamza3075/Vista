
import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Packaging } from '../types';
import { PageHeader, ModalBase, ProgressBar, StatusBadge } from './Common';

export const PackagingView: React.FC = () => {
  const { packaging, addPackaging, updatePackaging } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [buyPackId, setBuyPackId] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState(0);

  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newMinStock, setNewMinStock] = useState('');

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-sm border border-neutral-100 dark:border-neutral-800">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-2">{packaging.length} SKU Definitions Active</p>
        <button 
          onClick={() => setShowAdd(true)}
          className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          + Create SKU
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packaging.map((pack) => {
          const health = Math.min(100, (pack.stock / (pack.minStock || 100)) * 100);
          return (
            <div key={pack.id} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-100 dark:border-neutral-800 flex flex-col group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-vista-text group-hover:text-vista-accent transition-colors">{pack.name}</h3>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest mt-0.5">{pack.capacity}ml Volume</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold">EGP {pack.cost.toFixed(2)}</p>
                  <p className="text-[8px] text-neutral-400 font-bold uppercase">Unit Cost</p>
                </div>
              </div>
              
              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[9px] text-neutral-400 font-bold uppercase">On Hand</p>
                  <span className={`text-xs font-mono ${health < 30 ? 'text-red-500 font-bold' : ''}`}>{pack.stock.toLocaleString()} pcs</span>
                </div>
                <ProgressBar progress={health} color={health < 30 ? 'bg-red-500' : 'bg-vista-accent'} />
                
                <div className="pt-4 flex justify-between gap-2 border-t border-neutral-50 dark:border-neutral-800/50">
                  <button onClick={() => setBuyPackId(pack.id)} className="flex-1 px-4 py-2 border border-neutral-100 dark:border-neutral-800 rounded-sm text-[9px] font-bold uppercase hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Adjust</button>
                  <button onClick={() => setBuyPackId(pack.id)} className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-sm text-[9px] font-bold uppercase hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">Restock</button>
                </div>
              </div>
            </div>
          );
        })}
        {packaging.length === 0 && (
          <div className="col-span-3 py-20 text-center border border-dashed border-neutral-100 dark:border-neutral-800">
            <p className="text-sm text-neutral-400 font-light italic">No storage SKU definitions found.</p>
          </div>
        )}
      </div>

      <ModalBase isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create Container SKU" footer={
        <>
          <button onClick={() => setShowAdd(false)} className="px-6 py-2.5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
          <button onClick={handleAdd} className="px-10 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-[10px] font-bold uppercase tracking-widest">Lock SKU</button>
        </>
      }>
        <div className="space-y-6">
          <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">SKU Name</label>
              <input type="text" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent transition-colors" placeholder="e.g. 100ml Matte Glass Jar" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Capacity (ml)</label>
                  <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent" placeholder="100" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} />
              </div>
              <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Cost / Piece</label>
                  <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent" placeholder="0.00" value={newCost} onChange={e => setNewCost(e.target.value)} />
              </div>
          </div>
          <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Safety Threshold (pcs)</label>
              <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent" placeholder="Default: 100" value={newMinStock} onChange={e => setNewMinStock(e.target.value)} />
          </div>
        </div>
      </ModalBase>

      {buyPackId && (
        <ModalBase isOpen={!!buyPackId} onClose={() => setBuyPackId(null)} title="Inventory Adjustment" maxWidth="max-w-[360px]" footer={
          <>
            <button onClick={() => setBuyPackId(null)} className="px-6 py-2.5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
            <button onClick={() => handleBuy(buyPackId)} className="bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 px-8 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-lg">Apply</button>
          </>
        }>
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Quantity Adjustment</label>
            <input 
              type="number" autoFocus className="w-full border-b-2 border-neutral-200 dark:border-neutral-800 py-4 text-4xl font-light bg-transparent outline-none focus:border-vista-accent transition-colors"
              placeholder="0" value={buyAmount === 0 ? '' : buyAmount} onChange={e => setBuyAmount(parseInt(e.target.value) || 0)}
            />
            <p className="text-[10px] text-neutral-400 italic">Positive adds stock, negative removes it.</p>
          </div>
        </ModalBase>
      )}
    </div>
  );
};
