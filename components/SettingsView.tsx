
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { ConfirmModal, StatusBadge } from './Common';

interface SettingsViewProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ darkMode, setDarkMode }) => {
  const { settings, updateSettings, tokens, generateInviteToken, removeInviteToken, logs, addLog } = useStore();
  const { signOut, user } = useAuth();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<{id: string, token: string} | null>(null);
  
  // API Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{auth: boolean, db: boolean} | null>(null);

  const initial = (user?.user_metadata?.full_name || user?.email || '?').charAt(0).toUpperCase();

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName, avatar_url: avatarUrl }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Profile details updated successfully.' });
        addLog('info', 'Auth', 'User profile updated');
    } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
        addLog('error', 'Auth', 'Profile update failed', err);
    } finally {
        setIsSaving(false);
    }
  };

  const handleGenerateToken = async () => {
    const t = await generateInviteToken();
    setLastGenerated(t);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Token copied to clipboard.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;
    setIsSaving(true);
    setMessage(null);
    try {
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setAvatarUrl(data.publicUrl);
        setMessage({ type: 'success', text: 'Image uploaded. Click "Update Profile" to save.' });
        addLog('info', 'Storage', 'Avatar uploaded successfully');
    } catch (error: any) {
        setMessage({ type: 'error', text: 'Error uploading image: ' + error.message });
        addLog('error', 'Storage', 'Avatar upload failed', error);
    } finally {
        setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setMessage(null);
    addLog('info', 'Diagnostics', 'Executing system-wide connectivity test');
    
    const results = { auth: false, db: false };
    
    try {
        // Test Auth
        const { data: authData } = await supabase.auth.getSession();
        results.auth = !!authData.session;
        
        // Test DB (Specific table permission check)
        const { error: dbError } = await supabase.from('products').select('id').limit(1);
        results.db = !dbError;
        
        setTestResults(results);
        setMessage({ type: 'success', text: 'Diagnostics complete. Check System Status below.' });
        addLog('info', 'Diagnostics', 'Connectivity test successful', results);
    } catch (err: any) {
        setMessage({ type: 'error', text: `Diagnostic Fail: ${err.message}` });
        addLog('error', 'Diagnostics', 'Diagnostic test cycle failed', err);
    } finally {
        setIsTesting(false);
    }
  };

  const maskToken = (token: string) => {
    return token.substring(0, 5) + "*".repeat(35);
  };

  const filteredLogs = useMemo(() => logs.slice(0, 5), [logs]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <h2 className="text-3xl font-light text-neutral-900 dark:text-vista-text tracking-tight">Settings</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-light">Configure application preferences and system health.</p>
      </header>

      <div className="space-y-6">
        {/* Account & Profile Section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text mb-1">Profile & Account</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-light">Manage your personal information and session.</p>

            {message && (
                <div className={`mb-6 p-3 rounded-sm text-sm border ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4 min-w-[120px]">
                    {avatarUrl ? (
                         <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-neutral-100 dark:border-neutral-800" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-3xl font-light text-neutral-600 dark:text-neutral-300 border-2 border-neutral-200 dark:border-neutral-700">
                           {initial}
                        </div>
                    )}
                    <div className="w-full relative text-center">
                       <label htmlFor="avatar-upload" className="cursor-pointer text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-colors inline-flex items-center gap-2 px-3 py-2 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:border-neutral-400 dark:hover:border-neutral-600">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                           Upload Photo
                       </label>
                       <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageUpload} disabled={isSaving} className="hidden" />
                    </div>
                </div>

                <div className="flex-1 space-y-4 max-w-xl">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Full Name</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-900 dark:focus:border-vista-accent outline-none" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Email Address</label>
                            <input type="email" value={user?.email || ''} disabled className="w-full border border-neutral-100 dark:border-neutral-800 rounded-sm p-2 text-sm text-neutral-500 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 cursor-not-allowed" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                         <button onClick={signOut} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Sign Out
                        </button>
                        <button onClick={handleUpdateProfile} disabled={isSaving} className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm hover:bg-neutral-800 dark:hover:bg-yellow-400 text-sm font-medium uppercase tracking-wide transition-colors shadow-sm disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Update Profile'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Diagnostics & Logs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text">System Status</h3>
                    <button onClick={handleTestConnection} disabled={isTesting} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-vista-accent transition-colors">
                        {isTesting ? 'Pinging...' : 'Verify Connectivity'}
                    </button>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-light">Live health monitoring of integrated services.</p>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-sm border border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs font-medium">Authentication Service</span>
                        <StatusBadge 
                          value={testResults ? (testResults.auth ? 'Healthy' : 'Error') : 'Verified'} 
                          type={testResults ? (testResults.auth ? 'positive' : 'negative') : 'neutral'} 
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-sm border border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs font-medium">Database Core</span>
                        <StatusBadge 
                          value={testResults ? (testResults.db ? 'Connected' : 'Offline') : 'Online'} 
                          type={testResults ? (testResults.db ? 'positive' : 'negative') : 'neutral'} 
                        />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Session Metadata</h4>
                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                        <div className="space-y-1">
                            <p className="text-neutral-400 uppercase font-bold tracking-tight">Last Sign In</p>
                            <p className="font-mono">{new Date(user?.last_sign_in_at || '').toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-neutral-400 uppercase font-bold tracking-tight">Provider</p>
                            <p className="font-mono uppercase">{user?.app_metadata?.provider || 'Email'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 flex flex-col">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text mb-1">Application Logs</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-light">Recent operational events and error history.</p>
                
                <div className="flex-1 space-y-3">
                    {filteredLogs.length > 0 ? filteredLogs.map(log => (
                        <div key={log.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-100 dark:border-neutral-800 rounded-sm flex gap-4">
                            <div className={`w-1 h-full min-h-[24px] rounded-full shrink-0 ${log.level === 'error' ? 'bg-red-500' : log.level === 'warn' ? 'bg-amber-400' : 'bg-vista-accent'}`} />
                            <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{log.source} &bull; {new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <span className={`text-[8px] font-bold uppercase ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-amber-500' : 'text-neutral-400'}`}>{log.level}</span>
                                </div>
                                <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 truncate">{log.message}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-neutral-100 dark:border-neutral-800 rounded-sm">
                            <p className="text-xs text-neutral-400 italic font-light">No logged events found.</p>
                        </div>
                    )}
                </div>
                {logs.length > 5 && <button className="mt-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors">View All Logs &rarr;</button>}
            </div>
        </div>

        {/* Access & Invitations Section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text mb-1">Access & Invitations</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-light">Generate secure 40-character tokens to grant workspace access.</p>

            <div className="space-y-6">
                <div>
                    <button onClick={handleGenerateToken} className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm hover:bg-neutral-800 text-xs font-bold uppercase tracking-widest transition-all">
                        Generate New Token
                    </button>
                </div>

                {lastGenerated && (
                    <div className="p-4 bg-vista-accent/10 border border-vista-accent/30 rounded-sm animate-fade-in">
                        <p className="text-[10px] font-bold text-vista-accent uppercase mb-2">New Token Created (Masked)</p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <code className="flex-1 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-xs font-mono break-all text-neutral-700 dark:text-neutral-300">
                                {maskToken(lastGenerated)}
                            </code>
                            <button onClick={() => copyToClipboard(lastGenerated)} className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-[10px] font-bold uppercase rounded-sm hover:bg-white dark:hover:bg-neutral-800 transition-colors shrink-0">
                                Copy Token
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Token History</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-4 py-2 font-medium text-neutral-500 uppercase text-[9px]">Token</th>
                                    <th className="px-4 py-2 font-medium text-neutral-500 uppercase text-[9px]">Created</th>
                                    <th className="px-4 py-2 font-medium text-neutral-500 uppercase text-[9px]">Status</th>
                                    <th className="px-4 py-2 font-medium text-neutral-500 uppercase text-[9px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {tokens.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-neutral-400 italic font-light">No tokens generated yet.</td>
                                    </tr>
                                ) : (
                                    tokens.map(t => (
                                        <tr key={t.id}>
                                            <td className="px-4 py-3 font-mono text-[10px] max-w-[150px] truncate opacity-60 hover:opacity-100 cursor-pointer text-neutral-900 dark:text-vista-text font-medium" onClick={() => copyToClipboard(t.token)}>
                                                {t.token}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                  onClick={() => setTokenToDelete({ id: t.id, token: t.token })}
                                                  className="text-neutral-400 hover:text-red-500 transition-colors"
                                                  title="Delete Token"
                                                >
                                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                                                  </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text mb-1">Appearance</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-light">Customize how Vista looks on your device.</p>
            <div className="flex items-center justify-between max-w-xl">
                <div>
                    <div className="font-medium text-neutral-900 dark:text-vista-text text-sm">Dark Mode</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Adjust the interface for low-light environments.</div>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-vista-accent focus:ring-offset-2 ${darkMode ? 'bg-neutral-900 dark:bg-vista-accent' : 'bg-neutral-200'}`}>
                  <span className={`${darkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </button>
            </div>
        </div>

        {/* Production Preferences */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text mb-1">Production Defaults</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-light">Set your preferred input methods for manufacturing.</p>
            <div className="flex items-center justify-between max-w-xl">
                <div>
                    <div className="font-medium text-neutral-900 dark:text-vista-text text-sm">Default Input Mode</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Choose between glass count or total batch weight (kg/l) as the default.</div>
                </div>
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-sm">
                   <button onClick={() => updateSettings({ defaultProductionMode: 'glasses' })} className={`px-3 py-1 text-xs font-bold uppercase rounded-sm transition-all ${settings.defaultProductionMode === 'glasses' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-vista-text' : 'text-neutral-400'}`}>Glasses</button>
                   <button onClick={() => updateSettings({ defaultProductionMode: 'batch' })} className={`px-3 py-1 text-xs font-bold uppercase rounded-sm transition-all ${settings.defaultProductionMode === 'batch' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-vista-text' : 'text-neutral-400'}`}>Batch</button>
                </div>
            </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!tokenToDelete}
        title="Revoke Invite Token"
        message={`Are you sure you want to delete token "${tokenToDelete?.token.substring(0, 5)}..."? This action cannot be undone and will revoke access for anyone using this token if not already validated.`}
        onConfirm={async () => {
            if (tokenToDelete) {
                await removeInviteToken(tokenToDelete.id);
                setTokenToDelete(null);
            }
        }}
        onCancel={() => setTokenToDelete(null)}
        confirmText="Revoke Token"
        isDestructive={true}
      />
    </div>
  );
};
