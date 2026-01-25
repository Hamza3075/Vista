import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface SettingsViewProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ darkMode, setDarkMode }) => {
  const { settings, updateSettings } = useStore();
  const { signOut, user } = useAuth();

  // Local state for profile editing
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const displayName = user?.user_metadata?.full_name || user?.email || 'User';
  // Use first character of name if available, otherwise email
  const initial = (user?.user_metadata?.full_name || user?.email || '?').charAt(0).toUpperCase();

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
        const { error } = await supabase.auth.updateUser({
            data: { 
                full_name: fullName,
                avatar_url: avatarUrl 
            }
        });

        if (error) throw error;
        setMessage({ type: 'success', text: 'Profile details updated successfully.' });
    } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
        setIsSaving(false);
    }
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
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        
        setAvatarUrl(data.publicUrl);
        setMessage({ type: 'success', text: 'Image uploaded. Click "Update Profile" to save changes.' });
    } catch (error: any) {
        setMessage({ type: 'error', text: 'Error uploading image: ' + error.message });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <h2 className="text-3xl font-light text-neutral-900 dark:text-vista-text tracking-tight">Settings</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-light">Configure application preferences</p>
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
                {/* Avatar Column */}
                <div className="flex flex-col items-center gap-4 min-w-[120px]">
                    {avatarUrl ? (
                         <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-neutral-100 dark:border-neutral-800" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-3xl font-light text-neutral-600 dark:text-neutral-300 border-2 border-neutral-200 dark:border-neutral-700">
                           {initial}
                        </div>
                    )}
                    
                    <div className="w-full relative text-center">
                       <label 
                           htmlFor="avatar-upload" 
                           className="cursor-pointer text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-vista-text transition-colors inline-flex items-center gap-2 px-3 py-2 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:border-neutral-400 dark:hover:border-neutral-600"
                       >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                           Upload Photo
                       </label>
                       <input 
                         id="avatar-upload"
                         type="file" 
                         accept="image/*"
                         onChange={handleImageUpload}
                         disabled={isSaving}
                         className="hidden"
                       />
                    </div>
                </div>

                {/* Form Column */}
                <div className="flex-1 space-y-4 max-w-xl">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Full Name</label>
                            <input 
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-sm p-2 text-sm text-neutral-900 dark:text-vista-text bg-white dark:bg-vista-bg focus:border-neutral-900 dark:focus:border-vista-accent outline-none"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Email Address</label>
                            <input 
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full border border-neutral-100 dark:border-neutral-800 rounded-sm p-2 text-sm text-neutral-500 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                         <button 
                            onClick={signOut}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-bold uppercase tracking-wide flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Sign Out
                        </button>

                        <button 
                            onClick={handleUpdateProfile}
                            disabled={isSaving}
                            className="px-6 py-2 bg-neutral-900 dark:bg-vista-accent text-white dark:text-neutral-900 rounded-sm hover:bg-neutral-800 dark:hover:bg-yellow-400 text-sm font-medium uppercase tracking-wide transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Update Profile'}
                        </button>
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
                
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-vista-accent focus:ring-offset-2 ${darkMode ? 'bg-neutral-900 dark:bg-vista-accent' : 'bg-neutral-200'}`}
                >
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
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Choose between unit count (bottles) or total batch weight (kg/l) as the default.</div>
                </div>
                
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-sm">
                   <button 
                     onClick={() => updateSettings({ defaultProductionMode: 'units' })}
                     className={`px-3 py-1 text-xs font-bold uppercase rounded-sm transition-all ${settings.defaultProductionMode === 'units' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-vista-text' : 'text-neutral-400'}`}
                   >
                     Units
                   </button>
                   <button 
                     onClick={() => updateSettings({ defaultProductionMode: 'batch' })}
                     className={`px-3 py-1 text-xs font-bold uppercase rounded-sm transition-all ${settings.defaultProductionMode === 'batch' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-vista-text' : 'text-neutral-400'}`}
                   >
                     Batch
                   </button>
                </div>
            </div>
        </div>

        {/* Application Info */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-vista-text mb-1">About</h3>
            <div className="mt-4 text-sm text-neutral-500 dark:text-neutral-400 font-light space-y-2">
                <div className="flex justify-between max-w-xl border-b border-neutral-100 dark:border-neutral-800 py-2">
                    <span>Version</span>
                    <span className="font-mono text-neutral-900 dark:text-vista-text">v1.3.1</span>
                </div>
                 <div className="flex justify-between max-w-xl border-b border-neutral-100 dark:border-neutral-800 py-2">
                    <span>Build</span>
                    <span className="font-mono text-neutral-900 dark:text-vista-text">Production</span>
                </div>
                <div className="flex justify-between max-w-xl py-2">
                    <span>License</span>
                    <span className="text-neutral-900 dark:text-vista-text">Vista Enterprise</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
