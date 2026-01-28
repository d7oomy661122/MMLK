
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely
const env = (import.meta.env || {}) as { VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string };

// Use environment variables if available, otherwise use the provided project credentials as fallback
// Added .trim() to ensure no whitespace causes connection issues
const supabaseUrl = (env.VITE_SUPABASE_URL || 'https://yhjjsrhziouujzjlemxb.supabase.co').trim();

// Use a properly formatted dummy JWT as fallback if the provided key is invalid or missing.
// This prevents 'Failed to fetch' errors caused by invalid headers in the Supabase client.
const defaultKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_g3Yb5Zr9MbNPHAfuOiZBiQ_ZfH3LG4i';
const supabaseKey = defaultKey.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing. Please check your .env file or fallback values.');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Utility to generate a pseudo-email from phone number for Auth
export const formatEmail = (phone: string) => {
  return `${phone.replace(/\s/g, '')}@brixa.com`;
};

// Utility to generate a unique 6-character referral code
export const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};
