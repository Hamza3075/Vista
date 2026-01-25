import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://miypnfnnufqpvagnanfb.supabase.co';
const supabaseKey = 'sb_publishable_KKVpz2qXcHsJ0P5ZrAuz2g_Qi1pbYdX';

export const supabase = createClient(supabaseUrl, supabaseKey);