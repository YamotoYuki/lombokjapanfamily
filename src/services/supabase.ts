import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
)?.trim();

function assertFrontendEnv() {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length) {
    console.warn(
      `[supabase] 未設定: ${missing.join(', ')}。.env を確認して Vite を再起動してください。`,
    );
    return;
  }

  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('[supabase] VITE_SUPABASE_URL は https:// で始まる必要があります。');
  }

  if (
    supabaseAnonKey?.startsWith('http://') ||
    supabaseAnonKey?.startsWith('https://')
  ) {
    console.error(
      '[supabase] VITE_SUPABASE_ANON_KEY に URL が入っています。anon / publishable key を設定してください。',
    );
  }

  if (import.meta.env.DEV && supabaseUrl && supabaseAnonKey) {
    console.info('[supabase] client ready', {
      url: supabaseUrl,
      anonKey: `${supabaseAnonKey.slice(0, 8)}… (len=${supabaseAnonKey.length})`,
      apiBase: import.meta.env.VITE_API_BASE_URL ?? '/api',
    });
  }
}

assertFrontendEnv();

export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
