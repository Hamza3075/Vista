import React, { useState, useRef } from 'react';
import { useStore } from '../store/StoreContext';
import { Packaging } from '../types';
import { PageHeader, ModalBase, ProgressBar, StatusBadge, ConfirmModal } from './Common';

export const PackagingView: React.FC = () => {
  const { packaging, addPackaging, updatePackaging, removePackaging } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingPack, setEditingPack] = useState<Packaging | null>(null);
  const [packToDelete, setPackToDelete] = useState<Packaging | null>(null);
  const [buyPackId, setBuyPackId] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState(0);

  // Form State
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [cost, setCost] = useState('');
  const [minStock, setMinStock] = useState('');

  const resetForm = () => {
    setName(''); setCapacity(''); setCost(''); setMinStock('');
  };

  const handleAdd = () => {
    if (!name || !capacity || !cost) return;
    addPackaging({
      id: '', name, capacity: parseInt(capacity), cost: parseFloat(cost),
      stock: 0, minStock: minStock ? parseInt(minStock) : undefined
    });
    setShowAdd(false); resetForm();
  };

  const handleUpdate = () => {
    if (!editingPack || !name) return;
    updatePackaging(editingPack.id, {
      name, capacity: parseInt(capacity), cost: parseFloat(cost),
      minStock: minStock ? parseInt(minStock) : undefined
    });
    setEditingPack(null); resetForm();
  };

  const openEdit = (pack: Packaging) => {
    setEditingPack(pack);
    setName(pack.name);
    setCapacity(pack.capacity.toString());
    setCost(pack.cost.toString());
    setMinStock(pack.minStock?.toString() || '');
  };

  const handleRestock = (id: string) => {
    const pack = packaging.find(p => p.id === id);
    if (!pack) return;
    updatePackaging(id, { stock: pack.stock + buyAmount });
    setBuyPackId(null); setBuyAmount(0);
  };

  const handleDelete = async () => {
    if (!packToDelete) return;
    await removePackaging(packToDelete.id);
    setPackToDelete(null);
  };

  const CardWithLongPress: React.FC<{ pack: Packaging, children: React.ReactNode }> = ({ pack, children }) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTouchStart = () => {
      timerRef.current = setTimeout(() => {
        openEdit(pack);
        if (navigator.vibrate) navigator.vibrate(50);
      }, 600);
    };

    const cancelPress = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    return (
      <div 
        className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-100 dark:border-neutral-800 flex flex-col group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all select-none touch-manipulation"
        onTouchStart={handleTouchStart}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onContextMenu={(e) => {
           if (window.matchMedia('(pointer: coarse)').matches) e.preventDefault();
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-sm border border-neutral-100 dark:border-neutral-800">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-2">{packaging.length} SKU Definitions Active</p>
        <button onClick={() => { setShowAdd(true); resetForm(); }} className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm font-bold text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95">
          <span className="hidden sm:inline">+ Create SKU</span>
          <span className="sm:inline lg:hidden">+ Add</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packaging.map((pack) => {
          const health = Math.min(100, (pack.stock / (pack.minStock || 100)) * 100);
          return (
            <CardWithLongPress key={pack.id} pack={pack}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-vista-text group-hover:text-vista-accent transition-colors">{pack.name}</h3>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest mt-0.5">{pack.capacity}ml Volume</p>
                </div>
                <div className="flex gap-1">
                   {/* Hidden on mobile (sm:block), visible on desktop */}
                   <button onClick={() => openEdit(pack)} className="hidden sm:block p-1.5 text-neutral-300 hover:text-vista-accent transition-colors">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   </button>
                   <button onClick={() => setPackToDelete(pack)} className="p-1.5 text-neutral-300 hover:text-red-500 transition-colors">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                   </button>
                </div>
              </div>
              
              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-end">
                   <p className="text-[9px] text-neutral-400 font-bold uppercase">On Hand</p>
                   <span className={`text-xs font-mono ${health < 30 ? 'text-red-500 font-bold' : ''}`}>{pack.stock.toLocaleString()} pcs</span>
                </div>
                <ProgressBar progress={health} color={health < 30 ? 'bg-red-500' : 'bg-vista-accent'} />
                
                <div className="pt-4 flex border-t border-neutral-50 dark:border-neutral-800/50">
                  <button onClick={() => setBuyPackId(pack.id)} className="flex-1 px-4 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition-all">Restock</button>
                </div>
              </div>
            </CardWithLongPress>
          );
        })}
      </div>

      <ModalBase isOpen={showAdd || !!editingPack} onClose={() => { setShowAdd(false); setEditingPack(null); resetForm(); }} title={editingPack ? 'Modify Container SKU' : 'Create Container SKU'} footer={
        <>
          <button onClick={() => { setShowAdd(false); setEditingPack(null); resetForm(); }} className="px-6 py-2.5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
          <button onClick={editingPack ? handleUpdate : handleAdd} className="px-10 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-[10px] font-bold uppercase tracking-widest">Save SKU</button>
        </>
      }>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">SKU Name</label>
            <input type="text" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent transition-colors" placeholder="e.g. 100ml Matte Glass Jar" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Capacity (ml)</label>
              <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent" placeholder="100" value={capacity} onChange={e => setCapacity(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Cost / Piece</label>
              <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Safety Threshold (pcs)</label>
            <input type="number" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm bg-transparent outline-none focus:border-vista-accent" placeholder="100" value={minStock} onChange={e => setMinStock(e.target.value)} />
          </div>
        </div>
      </ModalBase>

      {buyPackId && (
        <ModalBase isOpen={!!buyPackId} onClose={() => setBuyPackId(null)} title="Restock Items" maxWidth="max-w-[360px]" footer={
          <>
            <button onClick={() => setBuyPackId(null)} className="px-6 py-2.5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
            <button onClick={() => handleRestock(buyPackId!)} className="bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 px-8 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-lg">Apply</button>
          </>
        }>
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Added Pieces</label>
            <input type="number" autoFocus className="w-full border-b-2 border-neutral-200 dark:border-neutral-800 py-4 text-4xl font-light bg-transparent outline-none focus:border-vista-accent transition-colors" placeholder="0" value={buyAmount === 0 ? '' : buyAmount} onChange={e => setBuyAmount(parseInt(e.target.value) || 0)} />
          </div>
        </ModalBase>
      )}

      <ConfirmModal 
        isOpen={!!packToDelete} title="Confirm Deletion" message={`Permanently remove "${packToDelete?.name}"? Associated production runs may be affected.`}
        onConfirm={handleDelete} onCancel={() => setPackToDelete(null)} isDestructive={true}
      />
    </div>
  );
};