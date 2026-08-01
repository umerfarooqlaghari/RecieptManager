import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.Secret_Key ||
  process.env.SUPABASE_SECRET_KEY ||
  '';

let adminClient: SupabaseClient | null = null;

/** Service-role client for admin auth actions (confirm email, lookup users). */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or service role / Secret_Key');
  }
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
