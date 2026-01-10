import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const isDev = process.env.NODE_ENV === 'development';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
  || (isDev ? process.env.NEXT_PUBLIC_SUPABASE_URL_DEV : process.env.NEXT_PUBLIC_SUPABASE_URL_PROD) 
  || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { 
    url: supabaseUrl ? 'present' : 'missing', 
    key: supabaseAnonKey ? 'present' : 'missing' 
  });
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});