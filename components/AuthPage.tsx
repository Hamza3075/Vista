
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Alert } from './Common';

interface AuthPageProps {
  initialView?: 'signin' | 'signup' | 'token';
  darkMode: boolean;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialView = 'signin', darkMode, onBack }) => {
  const { validateInviteToken } = useStore();
  const { user, signOut } = useAuth();
  const [view, setView] = useState<'signin' | 'signup' | 'token'>(initialView);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ text: string, type: 'error' | 'info' | 'warning' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin
          }
        });
        
        if (signUpError) throw signUpError;
        
        // Handle case where email confirmation is required
        if (data.user && data.session === null) {
          setError({ 
            text: "Verification required: Please check your email to confirm your account before logging in.", 
            type: 'info' 
          });
          setView('signin');
        } else {
          setView('token');
        }
      } else if (view === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Invalid credentials: Check your email and password sequence.");
          }
          if (signInError.message.includes("Email not confirmed")) {
            setError({ 
              text: "Confirmation Pending: You must verify your email address before access is granted.", 
              type: 'warning' 
            });
            return;
          }
          throw signInError;
        }
      } else if (view === 'token') {
        const userId = user?.id || 'unknown';
        const result = await validateInviteToken(token, userId);
        if (!result.success) throw new Error(result.message);
      }
    } catch (err: any) {
      setError({ text: err.message || 'An unexpected authentication error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      
      if (data.user?.user_metadata?.is_authorized) {
        setError({ text: "Authorization synchronized. Redirecting...", type: 'success' as any });
      } else {
        setError({ 
          text: "Verification result: Authorization metadata has not updated yet. Ensure you have validated your invite token.", 
          type: 'warning' 
        });
      }
    } catch (err: any) {
      setError({ text: "Synchronization failure: " + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isTokenValid = token.length === 40;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-vista-bg font-sans overflow-hidden">
      
      {/* Sidebar - Desktop Branding Section */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-neutral-900 dark:bg-black/40 border-r border-neutral-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-vista-accent/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-neutral-100/5 rounded-full blur-[80px]" />
        </div>

        <div className="z-10">
          <img src="https://i.ibb.co/jvkPgrRH/Vista-1.png" alt="Vista" className="h-8 w-auto mb-20" />
          <div className="space-y-6 max-w-md">
            <h1 className="text-5xl font-light text-white tracking-tight leading-[1.1]">
              The standard for <span className="text-vista-accent">production</span> intelligence.
            </h1>
            <p className="text-neutral-400 font-light text-lg leading-relaxed">
              Vista provides the infrastructure for precise manufacturing, real-time inventory synchronization, and deep-reasoning supply chain analysis.
            </p>
          </div>
        </div>

        <div className="z-10">
          <div className="flex items-center gap-12">
            <div className="space-y-1">
              <p className="text-white font-bold text-xl tracking-tight">100%</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Accuracy</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold text-xl tracking-tight">Real-time</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Latency</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold text-xl tracking-tight">Secure</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Infrastructure</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Content Section */}
      <div className="flex flex-col justify-center items-center p-8 md:p-12 relative animate-fade-in">
        
        {/* Mobile Logo & Back Header */}
        <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-center lg:hidden">
          <img 
            src={darkMode ? "https://i.ibb.co/jvkPgrRH/Vista-1.png" : "https://i.ibb.co/M5KLbVnh/Vista-2.png"} 
            alt="Vista Logo" 
            className="h-6 w-auto" 
          />
          <button onClick={onBack} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Back</button>
        </div>

        {/* Desktop Back Button / Logout */}
        {user ? (
          <button 
            onClick={signOut} 
            className="hidden lg:flex absolute top-12 right-12 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-all group"
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
            Sign Out
          </button>
        ) : (
          <button 
            onClick={onBack} 
            className="hidden lg:flex absolute top-12 right-12 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-all group"
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Exit Gateway
          </button>
        )}

        <div className="w-full max-w-[380px] space-y-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-vista-text">
              {view === 'token' ? 'Verify Identity' : view === 'signin' ? 'Sign In' : 'Join Vista'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
              {view === 'token' 
                ? 'Vista is currently in invitation-only mode. Enter your 40-character token.' 
                : view === 'signin' 
                ? 'Enter your credentials to access the manufacturing hub.' 
                : 'Create your account to start managing your production pipeline.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert 
                type={error.type} 
                message={error.text} 
                onClose={() => setError(null)} 
              />
            )}

            {view === 'token' ? (
              <div className="space-y-2 group">
                <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Access Token</label>
                <input 
                  type="text" required autoFocus
                  value={token} onChange={(e) => setToken(e.target.value)}
                  className="w-full border-b border-neutral-200 dark:border-neutral-800 py-4 text-xs font-mono text-vista-accent bg-transparent focus:border-vista-accent outline-none transition-all placeholder:text-neutral-100 dark:placeholder:text-neutral-800"
                  placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                />
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-tight mt-2">
                  <span className={isTokenValid ? 'text-emerald-500' : 'text-neutral-300'}>{token.length}/40 Characters</span>
                  {token.length > 0 && token.length !== 40 && <span className="text-red-400/50">Sequence Mismatch</span>}
                </div>
              </div>
            ) : (
              <>
                {view === 'signup' && (
                  <div className="space-y-1 group">
                    <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} 
                      className="w-full border-b border-neutral-200 dark:border-neutral-800 py-4 text-sm text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-all" 
                      placeholder="John Doe" 
                    />
                  </div>
                )}

                <div className="space-y-1 group">
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                    className="w-full border-b border-neutral-200 dark:border-neutral-800 py-4 text-sm text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-all" 
                    placeholder="name@company.com" 
                  />
                </div>

                <div className="space-y-1 group">
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} 
                      className="w-full border-b border-neutral-200 dark:border-neutral-800 py-4 pr-10 text-sm text-neutral-900 dark:text-vista-text bg-transparent focus:border-neutral-900 dark:focus:border-vista-accent outline-none transition-all" 
                      placeholder="••••••••" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-neutral-300 hover:text-neutral-900 dark:hover:text-vista-text transition-colors focus:outline-none">
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3">
              <button 
                type="submit" disabled={loading || (view === 'token' && !isTokenValid)}
                className="w-full py-5 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 text-[11px] font-bold uppercase tracking-[0.25em] rounded-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-20 disabled:scale-100 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white dark:border-neutral-900/20 dark:border-t-neutral-900 rounded-full animate-spin" />
                ) : null}
                {loading ? 'Processing...' : view === 'token' ? 'Verify Token' : view === 'signin' ? 'Sign In' : 'Authorize Account'}
              </button>
              
              {view === 'token' && (
                <button 
                  type="button" onClick={handleRefreshSession} disabled={loading}
                  className="w-full py-2 text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-colors"
                >
                  Force Session Refresh
                </button>
              )}
            </div>
          </form>

          {view !== 'token' && (
            <div className="text-center pt-8 border-t border-neutral-50 dark:border-neutral-800/50">
              <p className="text-xs text-neutral-400">
                {view === 'signin' ? "Don't have access yet? " : "Already have an account? "}
                <button 
                  type="button" 
                  onClick={() => { setError(null); setView(view === 'signin' ? 'signup' : 'signin'); }} 
                  className="font-bold text-neutral-900 dark:text-vista-text hover:underline decoration-neutral-200 dark:decoration-neutral-700 underline-offset-8 transition-all"
                >
                  {view === 'signin' ? 'Request Access' : 'Sign In'}
                </button>
              </p>
            </div>
          )}
        </div>
        
        {/* Simple Desktop Footer */}
        <div className="hidden lg:block absolute bottom-12 inset-x-0 text-center">
          <p className="text-[9px] text-neutral-300 dark:text-neutral-700 font-bold uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} Vista Management Systems
          </p>
        </div>
      </div>
    </div>
  );
};
