
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { ProductCategory, Product } from '../types';
import { DataTable, PageHeader, CustomSelect, StatusBadge, ConfirmModal, ModalBase } from './Common';

interface InvoiceItem {
  id: string;
  productId: string;
  volume: string;
  price: string;
}

export const MarketingView: React.FC = () => {
  const { products, updateProduct, removeProduct, ingredients, packaging, recordSale } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });
  
  // Invoice Modal State
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: '1', productId: '', volume: '', price: '' }
  ]);
  const [saleMessage, setSaleMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addInvoiceRow = () => {
    setInvoiceItems(prev => [
      ...prev,
      { id: Date.now().toString(), productId: '', volume: '', price: '' }
    ]);
  };

  const removeInvoiceRow = (id: string) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  const updateInvoiceRow = (id: string, updates: Partial<InvoiceItem>) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updates };
        // If product changed, pre-fill price
        if (updates.productId) {
          const p = products.find(prod => prod.id === updates.productId);
          if (p) newItem.price = (p.salePrice || 0).toString();
        }
        return newItem;
      }
      return item;
    }));
  };

  const handleInvoice = () => {
      const isValid = invoiceItems.every(item => item.productId && item.volume && item.price);
      if (!isValid) return;

      let allSuccess = true;
      let messages: string[] = [];

      for (const item of invoiceItems) {
        const result = recordSale(item.productId, parseFloat(item.volume), parseFloat(item.price));
        if (!result.success) {
          allSuccess = false;
          messages.push(`${products.find(p => p.id === item.productId)?.name}: ${result.message}`);
        }
      }
      
      if (allSuccess) {
        setSaleMessage({ text: "Invoice recorded successfully for all items.", type: 'success' });
        setTimeout(() => {
            setShowInvoice(false);
            setInvoiceItems([{ id: '1', productId: '', volume: '', price: '' }]);
            setSaleMessage(null);
        }, 2000);
      } else {
        setSaleMessage({ text: messages.join(' | '), type: 'error' });
      }
  };

  const isFormValid = invoiceItems.every(item => item.productId && item.volume && item.price);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in overflow-x-hidden">
      <PageHeader 
        title="Marketing & Sales" 
        subtitle="Manage price points and record customer invoices"
        actions={
          <div className="flex gap-4 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <input 
                type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-sm text-xs bg-white dark:bg-vista-bg outline-none"
                />
                <svg className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button 
                onClick={() => {
                  setInvoiceItems([{ id: '1', productId: '', volume: '', price: '' }]);
                  setSaleMessage(null);
                  setShowInvoice(true);
                }}
                className="px-6 py-2.5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-neutral-800 transition-all flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Invoice
            </button>
          </div>
        }
      />

      <DataTable<Product> 
        data={filteredProducts}
        columns={[
          { header: 'Product Name', isSticky: true, render: p => (
            <input 
              className="bg-transparent border-b border-transparent focus:border-neutral-400 outline-none w-full py-1 text-neutral-900 dark:text-vista-text font-medium"
              defaultValue={p.name} onBlur={e => e.target.value !== p.name && updateProduct(p.id, { name: e.target.value })}
            />
          )},
          { header: 'Category', isHiddenMobile: true, render: p => (
            <CustomSelect 
              options={Object.values(ProductCategory).map(v => ({ value: v, label: v }))} 
              value={p.category} onChange={val => updateProduct(p.id, { category: val as ProductCategory })} 
            />
          )},
          { header: 'Stock', align: 'center', render: p => <span className={p.stock < 10 ? 'text-red-500 font-bold' : ''}>{p.stock} units</span> },
          { header: 'Unit Cost', align: 'right', isHiddenMobile: true, render: p => `EGP ${getProductCost(p).toFixed(2)}` },
          { header: 'Price (EGP)', align: 'right', render: p => (
            <input 
              type="number" className="bg-transparent border-b border-transparent focus:border-neutral-400 outline-none w-20 text-right font-medium"
              defaultValue={(p.salePrice || 0).toFixed(0)} onBlur={e => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val !== p.salePrice) updateProduct(p.id, { salePrice: val });
              }}
            />
          )},
          { header: 'Margin', align: 'right', render: p => {
            const cost = getProductCost(p);
            const margin = (p.salePrice || 0) > 0 ? (((p.salePrice || 0) - cost) / (p.salePrice || 1)) * 100 : 0;
            return <StatusBadge value={`${(margin || 0).toFixed(1)}%`} type={margin > 0 ? 'positive' : 'negative'} />
          }},
          { header: 'Actions', align: 'center', render: p => (
            <button onClick={() => setDeleteModal({ isOpen: true, id: p.id, name: p.name })} className="text-neutral-400 hover:text-red-600 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        ]}
      />

      {/* Invoice Modal */}
      <ModalBase isOpen={showInvoice} onClose={() => setShowInvoice(false)} title="Record Invoice" maxWidth="max-w-4xl" footer={
          <>
            <button onClick={() => setShowInvoice(false)} className="px-4 py-2 text-neutral-500 text-xs font-medium uppercase">Cancel</button>
            <button onClick={handleInvoice} disabled={!isFormValid} className="px-8 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-xs font-bold uppercase rounded-sm shadow-xl hover:bg-neutral-800 transition-all disabled:opacity-30">Complete Invoice</button>
          </>
      }>
          <div className="space-y-4">
              <div className="max-h-[50vh] overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {invoiceItems.map((item, index) => {
                  const prod = products.find(p => p.id === item.productId);
                  const cost = prod ? getProductCost(prod) : 0;
                  const priceNum = parseFloat(item.price) || 0;
                  const isLoss = priceNum > 0 && priceNum < cost;

                  return (
                    <div key={item.id} className="relative group border border-neutral-100 dark:border-neutral-800 p-4 rounded-sm animate-fade-in">
                        <div className="absolute -top-3 left-3 bg-white dark:bg-neutral-900 px-2">
                           <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Item {index + 1}</span>
                        </div>
                        
                        {invoiceItems.length > 1 && (
                          <button 
                            onClick={() => removeInvoiceRow(item.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-5">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Product</label>
                                <CustomSelect 
                                  options={products.map(p => ({ value: p.id, label: p.name, subLabel: `Stock: ${p.stock}` }))} 
                                  value={item.productId} 
                                  onChange={(val) => updateInvoiceRow(item.id, { productId: val })} 
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Qty (L/Kg)</label>
                                <input 
                                  type="number" step="0.01" 
                                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm bg-white dark:bg-vista-bg outline-none focus:border-vista-accent" 
                                  placeholder="0.00" 
                                  value={item.volume} 
                                  onChange={e => updateInvoiceRow(item.id, { volume: e.target.value })} 
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Price (EGP)</label>
                                <div className="relative">
                                    <input 
                                      type="number" 
                                      className={`w-full border rounded-sm p-2 text-sm bg-white dark:bg-vista-bg outline-none transition-colors ${isLoss ? 'border-red-500 pr-10' : 'border-neutral-300 dark:border-neutral-700 focus:border-vista-accent'}`} 
                                      placeholder="0.00" 
                                      value={item.price} 
                                      onChange={e => updateInvoiceRow(item.id, { price: e.target.value })} 
                                    />
                                    {isLoss && (
                                        <div className="absolute right-2 top-2 text-red-500 animate-pulse" title={`Warning: Price is below cost (${(cost || 0).toFixed(2)})`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center pt-2">
                <button 
                  onClick={addInvoiceRow}
                  className="flex items-center gap-2 px-6 py-2 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-sm text-neutral-400 hover:text-vista-accent hover:border-vista-accent transition-all group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Add Product</span>
                </button>
              </div>

              {saleMessage && (
                  <div className={`p-4 rounded-sm text-xs border animate-fade-in ${saleMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {saleMessage.text}
                  </div>
              )}
          </div>
      </ModalBase>

      <ConfirmModal 
        isOpen={deleteModal.isOpen} title="Delete Product" message={`Are you sure you want to delete "${deleteModal.name}"?`}
        onConfirm={() => { if (deleteModal.id) removeProduct(deleteModal.id); setDeleteModal({ isOpen: false, id: '', name: '' }); }}
        onCancel={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
        confirmText="Delete Product" isDestructive={true}
      />
    </div>
  );
};
