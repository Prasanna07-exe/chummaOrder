import { createClient } from '@supabase/supabase-js';

// Note: These will be populated when you connect to Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Create client even with placeholder values to prevent errors
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Disable session persistence when using placeholder values
  }
});

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseKey && 
         !supabaseUrl.includes('placeholder') && 
         !supabaseKey.includes('placeholder') &&
         supabaseUrl !== '' &&
         supabaseKey !== '';
};
