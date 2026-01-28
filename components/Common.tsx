
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
  <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-neutral-100 dark:border-neutral-800">
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-vista-text tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-neutral-400 dark:text-neutral-500 font-light">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3">{actions}</div>
  </header>
);

export const KpiCard: React.FC<{ 
  label: string; 
  value: string | number; 
  subValue?: string;
  variant?: 'default' | 'accent' | 'danger' | 'ghost';
  trend?: { value: string, positive: boolean };
}> = ({ label, value, subValue, variant = 'default', trend }) => {
  const styles = {
    default: 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-900 dark:text-vista-text',
    accent: 'bg-white dark:bg-neutral-900 border-vista-accent/20 text-neutral-900 dark:text-vista-text',
    danger: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400',
    ghost: 'bg-transparent border-transparent text-neutral-500 dark:text-neutral-400'
  };

  return (
    <div className={`p-6 rounded-sm border transition-all hover:border-neutral-300 dark:hover:border-neutral-700 ${styles[variant]}`}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-40">{label}</p>
        {variant === 'accent' && <div className="w-1.5 h-1.5 rounded-full bg-vista-accent shadow-[0_0_8px_rgba(235,205,84,0.6)]" />}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-light tracking-tight">{value}</p>
        {subValue && <span className="text-[10px] opacity-40 font-bold uppercase">{subValue}</span>}
      </div>
      {trend && (
        <div className={`mt-2 text-[10px] font-bold flex items-center gap-1 ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
          <span>{trend.positive ? '↑' : '↓'}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
};

export const StatusBadge: React.FC<{ 
  value: string | number; 
  type?: 'positive' | 'negative' | 'neutral' | 'warning';
}> = ({ value, type = 'neutral' }) => {
  const styles = {
    positive: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800',
    negative: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800',
    warning: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800',
    neutral: 'bg-neutral-50 text-neutral-600 border-neutral-100 dark:bg-neutral-800/40 dark:text-neutral-400 dark:border-neutral-700'
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold border uppercase tracking-widest ${styles[type]}`}>
      {value}
    </span>
  );
};

export const ProgressBar: React.FC<{ progress: number, color?: string, label?: string }> = ({ progress, color = 'bg-vista-accent', label }) => (
  <div className="w-full space-y-1.5">
    {label && <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-neutral-400"><span>{label}</span><span>{Math.round(progress)}%</span></div>}
    <div className="w-full h-[3px] bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-700 ease-out`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
    </div>
  </div>
);

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
  emptyMessage = "No records found" 
}: { 
  data: T[]; 
  columns: TableColumn<T>[]; 
  emptyMessage?: string;
}) => (
  <div className="bg-white dark:bg-vista-bg border border-neutral-100 dark:border-neutral-800 overflow-hidden rounded-sm">
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left table-auto border-collapse text-sm">
        <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={`
                  px-6 py-4 font-bold text-neutral-400 uppercase text-[9px] tracking-[0.2em]
                  ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  ${col.isHiddenMobile ? 'hidden sm:table-cell' : ''}
                `}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {data.length > 0 ? (
            data.map(item => (
              <tr key={item.id} className="hover:bg-neutral-50/20 dark:hover:bg-neutral-900/10 transition-colors group">
                {columns.map((col, idx) => (
                  <td 
                    key={idx} 
                    className={`
                      px-6 py-5 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-vista-text transition-colors
                      ${col.align === 'right' ? 'text-right font-mono text-xs' : col.align === 'center' ? 'text-center' : 'text-left'}
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
              <td colSpan={columns.length} className="px-6 py-20 text-center">
                <p className="text-sm italic font-light text-neutral-400 tracking-wide">{emptyMessage}</p>
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
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className={`bg-white dark:bg-neutral-900 rounded-sm w-full ${maxWidth} border border-neutral-100 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden shadow-2xl`}>
        <div className="flex justify-between items-center px-8 py-6 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-lg font-light text-neutral-900 dark:text-vista-text uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
        {footer && <div className="px-8 py-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

// --- Select Components ---

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = 'Select...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const coords = useDropdownPosition(containerRef, isOpen);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-vista-bg border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm flex justify-between items-center cursor-pointer min-h-[44px] hover:border-neutral-400 transition-all"
      >
        <span className={selectedOption ? 'text-neutral-900 dark:text-vista-text' : 'text-neutral-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-3.5 h-3.5 transition-transform text-neutral-400 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div 
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-sm max-h-64 overflow-y-auto divide-y divide-neutral-50 dark:divide-neutral-800"
          >
            {options.map(opt => (
              <div 
                key={opt.value}
                className={`px-4 py-3 text-xs cursor-pointer flex justify-between items-center transition-colors ${opt.value === value ? 'bg-neutral-50 dark:bg-neutral-800 text-vista-accent font-bold' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                <div className="flex flex-col">
                  <span>{opt.label}</span>
                  {opt.subLabel && <span className="text-[10px] text-neutral-400 font-light mt-0.5">{opt.subLabel}</span>}
                </div>
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
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) || (o.subLabel?.toLowerCase() || '').includes(search.toLowerCase()));

  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => { setIsOpen(true); setSearch(''); }}
        className="w-full bg-white dark:bg-vista-bg border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 text-sm flex justify-between items-center cursor-pointer min-h-[44px] hover:border-neutral-400 transition-all"
      >
        <span className={selectedOption ? 'text-neutral-900 dark:text-vista-text font-medium' : 'text-neutral-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="w-3.5 h-3.5 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      {isOpen && createPortal(
        <>
           <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
           <div 
             style={{ top: coords.top, left: coords.left, width: coords.width }}
             className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-sm max-h-72 overflow-y-auto flex flex-col animate-fade-in"
           >
              <div className="sticky top-0 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800 p-2 z-10">
                  <input ref={inputRef} type="text" className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-sm px-3 py-2 text-xs outline-none focus:border-vista-accent" placeholder="Type to filter..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                    <div key={opt.value} className={`px-4 py-3 text-xs cursor-pointer transition-colors ${opt.value === value ? 'bg-neutral-50 dark:bg-neutral-800 text-vista-accent font-bold' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`} onClick={() => { onChange(opt.value); setIsOpen(false); }}>
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                          {opt.subLabel && <span className="opacity-40 text-[9px] font-bold uppercase tracking-widest mt-0.5">{opt.subLabel}</span>}
                        </div>
                    </div>
                )) : (
                  <div className="px-4 py-6 text-center text-[10px] text-neutral-400 italic uppercase tracking-widest">No results</div>
                )}
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
    <ModalBase isOpen={isOpen} onClose={onCancel} title={title} maxWidth="max-w-[420px]" footer={
      <>
        <button onClick={onCancel} className="px-6 py-2.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-[10px] font-bold uppercase tracking-widest transition-colors">Cancel</button>
        <button onClick={onConfirm} className={`px-8 py-2.5 text-white dark:text-neutral-900 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 ${isDestructive ? 'bg-red-600' : 'bg-neutral-900 dark:bg-vista-accent'}`}>{confirmText}</button>
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
