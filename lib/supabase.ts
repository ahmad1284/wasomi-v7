
import { createClient } from '@supabase/supabase-js';

// We use placeholders to prevent the 'supabaseUrl is required' error during boot.
// The application logic in store.ts and Auth.tsx checks process.env directly
// to determine if it should actually attempt to use the Supabase client.
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

// Fix: Export isConfigured to avoid module errors in store.ts
export const isConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

if (!isConfigured) {
  console.warn("Wasomi Scholars: Supabase credentials missing. Running in Simulation Mode (Local Storage).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
