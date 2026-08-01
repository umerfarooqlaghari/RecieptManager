import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Shared client for token verification (no user JWT on data queries)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Reuse clients per access token within this process to avoid recreating on every request
const clientCache = new Map<string, { client: SupabaseClient; lastUsed: number }>();
const CLIENT_TTL_MS = 5 * 60 * 1000;
const MAX_CACHED_CLIENTS = 100;

function pruneClientCache() {
  const now = Date.now();
  for (const [token, entry] of clientCache) {
    if (now - entry.lastUsed > CLIENT_TTL_MS) {
      clientCache.delete(token);
    }
  }
  if (clientCache.size <= MAX_CACHED_CLIENTS) return;
  const oldest = [...clientCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  for (let i = 0; i < oldest.length - MAX_CACHED_CLIENTS; i++) {
    clientCache.delete(oldest[i][0]);
  }
}

/**
 * Supabase client scoped to the caller's JWT so RLS applies.
 * Clients are cached briefly per token to avoid allocate-per-request churn.
 */
export const getSupabaseClient = (accessToken: string) => {
  const cached = clientCache.get(accessToken);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.client;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  clientCache.set(accessToken, { client, lastUsed: Date.now() });
  pruneClientCache();
  return client;
};
