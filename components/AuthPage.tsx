
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthPageProps {
  initialView?: 'signin' | 'signup';
  darkMode: boolean;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialView = 'signin', darkMode, onBack }) => {
  const [view, setView] = useState<'signin' | 'signup'>(initialView);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-vista-bg text-neutral-900 dark:text-vista-text flex flex-col items-center justify-center p-6 animate-fade-in font-sans">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-colors group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="w-full max-w-sm space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <img 
            src={darkMode ? "https://i.ibb.co/jvkPgrRH/Vista-1.png" : "https://i.ibb.co/M5KLbVnh/Vista-2.png"} 
            alt="Vista Logo" 
            className="h-10 mx-auto mb-10" 
          />
          <h2 className="text-3xl font-light tracking-tight">
            {view === 'signin' ? 'Sign in to Vista' : 'Create your account'}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light">
            {view === 'signin' ? 'Access your workspace and manage production.' : 'Join the precision manufacturing platform.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-sm">
              {error}
            </div>
          )}

          {view === 'signup' && (
            <div className="space-y-1 animate-fade-in">
              <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border-b border-neutral-300 dark:border-neutral-700 py-3 text-sm text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-neutral-300 dark:border-neutral-700 py-3 text-sm text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-colors"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-neutral-300 dark:border-neutral-700 py-3 pr-10 text-sm text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-sm font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-neutral-800 dark:hover:bg-yellow-400 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {loading ? 'Processing...' : (view === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Toggle Footer */}
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {view === 'signin' ? "New to Vista? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => { setError(null); setView(view === 'signin' ? 'signup' : 'signin'); }}
              className="font-bold text-neutral-900 dark:text-vista-text hover:underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4"
            >
              {view === 'signin' ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
