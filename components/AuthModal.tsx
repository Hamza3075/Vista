import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'signin' }) => {
  const [view, setView] = useState<'signin' | 'signup'>(initialView);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        // If success, usually Supabase logs them in or asks for confirmation
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
      <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-sm shadow-2xl w-[400px] max-w-full overflow-hidden flex flex-col transition-all">
        
        {/* Header */}
        <div className="p-8 pb-0 text-center">
          {/* Logo Logic: Vista-2 (Dark Text) for Light Mode, Vista-1 (White Text) for Dark Mode */}
          <img 
            src="https://i.ibb.co/M5KLbVnh/Vista-2.png" 
            alt="Vista Logo" 
            className="h-8 mx-auto mb-6 dark:hidden" 
          />
           <img 
            src="https://i.ibb.co/jvkPgrRH/Vista-1.png" 
            alt="Vista Logo" 
            className="h-8 mx-auto mb-6 hidden dark:block" 
          />
          <h2 className="text-2xl font-light text-neutral-900 dark:text-vista-text tracking-tight">
            {view === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 font-light">
            {view === 'signin' ? 'Enter your credentials to access the workspace.' : 'Join Vista to manage your production.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-sm">
              {error}
            </div>
          )}

          {view === 'signup' && (
            <div className="space-y-1 animate-fade-in">
              <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Full Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-3 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-3 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-colors"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-3 pr-10 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-neutral-800 dark:hover:bg-yellow-400 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Processing...' : (view === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* Footer / Toggle */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 text-center border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {view === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => { setError(null); setView(view === 'signin' ? 'signup' : 'signin'); }}
              className="font-bold text-neutral-900 dark:text-vista-text hover:underline"
            >
              {view === 'signin' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
