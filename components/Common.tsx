import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// --- Types ---
interface Option {
  value: string;
  label: string;
  subLabel?: string;
}

// --- Helper for Portal Positioning ---
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

// --- Custom Select Component (Simple) ---
interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = 'Select...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const coords = useDropdownPosition(containerRef, isOpen);
  
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-vista-bg border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm focus:border-neutral-500 dark:focus:border-vista-accent outline-none flex justify-between items-center cursor-pointer min-h-[38px] transition-colors hover:border-neutral-400 dark:hover:border-neutral-600"
      >
        <span className={selectedOption ? 'text-neutral-900 dark:text-vista-text' : 'text-neutral-400 dark:text-neutral-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998] cursor-default" onClick={() => setIsOpen(false)} />
          <div 
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-sm max-h-60 overflow-y-auto animate-fade-in"
          >
            {options.map(opt => (
              <div 
                key={opt.value}
                className={`p-2 text-sm cursor-pointer flex justify-between items-center ${
                  opt.value === value 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-vista-text font-medium' 
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                <span>{opt.label}</span>
                {opt.subLabel && <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">{opt.subLabel}</span>}
              </div>
            ))}
            {options.length === 0 && <div className="p-3 text-xs text-neutral-400 text-center">No options available</div>}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

// --- Searchable Select Component ---
interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Search...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const coords = useDropdownPosition(containerRef, isOpen);

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => { setIsOpen(true); setSearch(''); }}
        className="w-full bg-white dark:bg-vista-bg border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm outline-none flex justify-between items-center cursor-pointer min-h-[38px] transition-colors hover:border-neutral-400 dark:hover:border-neutral-600"
      >
        <span className={selectedOption ? 'text-neutral-900 dark:text-vista-text' : 'text-neutral-400 dark:text-neutral-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {isOpen && createPortal(
        <>
           <div className="fixed inset-0 z-[9998] cursor-default" onClick={() => setIsOpen(false)} />
           <div 
             style={{ top: coords.top, left: coords.left, width: coords.width }}
             className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-sm max-h-60 overflow-y-auto animate-fade-in flex flex-col"
           >
              <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 p-2 z-10">
                  <input 
                      ref={inputRef}
                      type="text" 
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-1.5 text-xs outline-none focus:border-neutral-400 dark:focus:border-vista-accent text-neutral-900 dark:text-vista-text placeholder-neutral-400 dark:placeholder-neutral-600"
                      placeholder="Type to filter..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                  />
              </div>
              <div>
                {filteredOptions.map(opt => (
                    <div 
                        key={opt.value}
                        className="p-2 text-sm cursor-pointer text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex justify-between items-center"
                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    >
                        <span>{opt.label}</span>
                        {opt.subLabel && <span className="text-neutral-400 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">{opt.subLabel}</span>}
                    </div>
                ))}
                {filteredOptions.length === 0 && <div className="p-3 text-xs text-neutral-400 text-center">No results found</div>}
              </div>
           </div>
        </>,
        document.body
      )}
    </div>
  );
};

// --- Confirmation Modal Component ---
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', isDestructive = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-sm shadow-2xl w-[400px] max-w-[90%] p-6 transform transition-all scale-100">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-light leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text text-sm font-medium uppercase tracking-wide transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`px-6 py-2 text-white dark:text-neutral-900 rounded-sm shadow-md text-sm font-medium uppercase tracking-wide transition-colors ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500' 
                : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-vista-accent dark:hover:bg-yellow-400'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};