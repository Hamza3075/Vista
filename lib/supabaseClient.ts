
import { createClient } from '@supabase/supabase-js';

/**
 * Vista Application Configuration
 * Primary API Endpoints and Database Connection Strings.
 */
const supabaseUrl = 'https://miypnfnnufqpvagnanfb.supabase.co';
const supabaseKey = 'sb_publishable_KKVpz2qXcHsJ0P5ZrAuz2g_Qi1pbYdX';

// Initialize Supabase client with optimized session handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'vista-auth-storage',
    flowType: 'pkce'
  }
});

/**
 * Health Check Utility
 * Verifies if the database endpoint and core tables are reachable/authorized.
 */
export const checkApiHealth = async () => {
  try {
    // Attempt a limited read to verify schema access and RLS status
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      console.error('[Supabase Diagnostics] Connectivity Error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase Diagnostics] Endpoint Unreachable');
    return false;
  }
};
