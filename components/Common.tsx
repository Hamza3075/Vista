
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// --- Types ---
interface Option {
  value: string;
  label: string;
  subLabel?: string;
}

// --- Hooks ---
const useDropdownPosition = (ref: React.RefObject<HTMLDivElement | null>, isOpen: boolean) => {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && ref.current) {
      const updatePosition = () => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) {
          setCoords({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        }
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, ref]);

  return coords;
};

// --- Atomic UI Components ---

export const PageHeader: React.FC<{ 
  title: string; 
  subtitle?: string; 
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6 mb-8">
    <div>
      <h2 className="text-2xl md:text-3xl font-light text-neutral-900 dark:text-vista-text tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 md:mt-2 font-light">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap gap-2 md:gap-4">{actions}</div>
  </header>
);

export const KpiCard: React.FC<{ 
  label: string; 
  value: string | number; 
  subValue?: string;
  variant?: 'default' | 'accent' | 'danger';
}> = ({ label, value, subValue, variant = 'default' }) => {
  const styles = {
    default: 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-vista-text',
    accent: 'bg-white dark:bg-vista-accent/5 border-neutral-200 dark:border-vista-accent/20 text-neutral-900 dark:text-vista-accent',
    danger: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400'
  };

  return (
    <div className={`p-4 md:p-6 rounded-sm border shadow-sm transition-all ${styles[variant]}`}>
      <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1 md:mb-2 opacity-60`}>{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-xl md:text-2xl font-light truncate">{value}</p>
        {subValue && <span className="text-xs opacity-50 font-mono">{subValue}</span>}
      </div>
    </div>
  );
};

export const StatusBadge: React.FC<{ 
  value: string | number; 
  type?: 'positive' | 'negative' | 'neutral';
}> = ({ value, type = 'neutral' }) => {
  const styles = {
    positive: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30',
    negative: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-100 dark:border-red-900/30',
    neutral: 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-100 dark:border-neutral-700'
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold border whitespace-nowrap ${styles[type]}`}>
      {value}
    </span>
  );
};

// --- Generic DataTable ---
interface TableColumn<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  isSticky?: boolean;
  isHiddenMobile?: boolean;
}

export const DataTable = <T extends { id: string | number }>({ 
  data, 
  columns, 
  emptyMessage = "No data available" 
}: { 
  data: T[]; 
  columns: TableColumn<T>[]; 
  emptyMessage?: string;
}) => (
  <div className="bg-white dark:bg-vista-bg rounded-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
    <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
      <table className="w-full text-left table-auto border-collapse text-[11px] md:text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={`
                  px-4 md:px-6 py-3 md:py-4 font-medium text-neutral-500 dark:text-neutral-400 uppercase text-[9px] md:text-[10px] tracking-widest
                  ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  ${col.isSticky ? 'sticky left-0 bg-neutral-50 dark:bg-neutral-900 z-10 shadow-[2px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[2px_0_0_0_rgba(255,255,255,0.05)]' : ''}
                  ${col.isHiddenMobile ? 'hidden sm:table-cell' : ''}
                  ${col.className || ''}
                `}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {data.length > 0 ? (
            data.map(item => (
              <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                {columns.map((col, idx) => (
                  <td 
                    key={idx} 
                    className={`
                      px-4 md:px-6 py-4 
                      ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                      ${col.isSticky ? 'sticky left-0 bg-white dark:bg-vista-bg z-10 shadow-[2px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[2px_0_0_0_rgba(255,255,255,0.05)]' : ''}
                      ${col.isHiddenMobile ? 'hidden sm:table-cell' : ''}
                      ${col.className || ''}
                    `}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center text-neutral-400 dark:text-neutral-600 italic">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Modal Base ---
export const ModalBase: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-[500px]' }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className={`bg-white dark:bg-neutral-900 rounded shadow-2xl w-full ${maxWidth} border border-transparent dark:border-neutral-800 flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center p-6 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-xl font-medium text-neutral-900 dark:text-vista-text tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

// --- Re-exporting improved versions of previous Common components ---

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = 'Select...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const coords = useDropdownPosition(containerRef, isOpen);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-vista-bg border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm focus:border-neutral-500 dark:focus:border-vista-accent outline-none flex justify-between items-center cursor-pointer min-h-[38px] transition-colors"
      >
        <span className={selectedOption ? 'text-neutral-900 dark:text-vista-text' : 'text-neutral-400 dark:text-neutral-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div 
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-sm max-h-60 overflow-y-auto animate-fade-in"
          >
            {options.map(opt => (
              <div 
                key={opt.value}
                className={`p-2 text-sm cursor-pointer flex justify-between items-center ${opt.value === value ? 'bg-neutral-100 dark:bg-neutral-800 font-medium' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                <span>{opt.label}</span>
                {opt.subLabel && <span className="text-xs opacity-50 font-mono">{opt.subLabel}</span>}
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Search...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const coords = useDropdownPosition(containerRef, isOpen);

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => { setIsOpen(true); setSearch(''); }}
        className="w-full bg-white dark:bg-vista-bg border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm outline-none flex justify-between items-center cursor-pointer min-h-[38px]"
      >
        <span className={selectedOption ? 'text-neutral-900 dark:text-vista-text' : 'text-neutral-400 dark:text-neutral-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      {isOpen && createPortal(
        <>
           <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
           <div 
             style={{ top: coords.top, left: coords.left, width: coords.width }}
             className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-sm max-h-60 overflow-y-auto animate-fade-in flex flex-col"
           >
              <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b p-2 z-10">
                  <input ref={inputRef} type="text" className="w-full bg-neutral-50 dark:bg-neutral-800 border rounded-sm p-1.5 text-xs outline-none" placeholder="Type to filter..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div>
                {filteredOptions.map(opt => (
                    <div key={opt.value} className="p-2 text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 flex justify-between items-center" onClick={() => { onChange(opt.value); setIsOpen(false); }}>
                        <span>{opt.label}</span>
                        {opt.subLabel && <span className="opacity-50 text-[10px] font-mono px-1 rounded">{opt.subLabel}</span>}
                    </div>
                ))}
              </div>
           </div>
        </>,
        document.body
      )}
    </div>
  );
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', isDestructive = false 
}) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onCancel} title={title} maxWidth="max-w-[400px]" footer={
      <>
        <button onClick={onCancel} className="px-4 py-2 text-neutral-500 text-sm font-medium uppercase tracking-wide">Cancel</button>
        <button onClick={onConfirm} className={`px-6 py-2 text-white dark:text-neutral-900 rounded-sm shadow-md text-sm font-medium uppercase tracking-wide ${isDestructive ? 'bg-red-600' : 'bg-neutral-900 dark:bg-vista-accent'}`}>{confirmText}</button>
      </>
    }>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">{message}</p>
    </ModalBase>
  );
};

// Internal Interfaces for Props
interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isDestructive?: boolean;
}
