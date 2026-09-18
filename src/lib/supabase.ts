/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://battwitnhrezwotkcvbc.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdHR3aXRuaHJlendvdGtjdmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjcwNjMsImV4cCI6MjEwMTAwMzA2M30.6e3bOgrIi5hKNbvt03DKu-QG1uDDM6GkXlTvHPthbA8';

const env = (import.meta as any).env || {};

const sanitizeUrl = (url: any): string => {
  if (typeof url !== 'string' || !url.trim()) return FALLBACK_URL;
  try {
    let trimmed = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`;
    }
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return FALLBACK_URL;
    return parsed.origin;
  } catch {
    return FALLBACK_URL;
  }
};

const isValidKey = (key: any): boolean => {
  if (typeof key !== 'string' || !key.trim()) return false;
  return key.trim().startsWith('eyJ') && key.trim().length > 50;
};

const getStoredUrl = (): string | null => {
  try {
    const custom = localStorage.getItem('custom_supabase_url');
    if (custom && custom.trim().startsWith('http')) return custom.trim();
  } catch {}
  return null;
};

const getStoredKey = (): string | null => {
  try {
    const custom = localStorage.getItem('custom_supabase_key');
    if (custom && isValidKey(custom)) return custom.trim();
  } catch {}
  return null;
};

const storedUrl = getStoredUrl();
const storedKey = getStoredKey();

let rawUrl = storedUrl || env.VITE_SUPABASE_URL;
let rawKey = storedKey || env.VITE_SUPABASE_ANON_KEY;

// Auto-detect inverted/swapped environment variables (e.g. if URL received the JWT and ANON_KEY received the URL)
if (typeof rawUrl === 'string' && rawUrl.startsWith('eyJ') && typeof rawKey === 'string' && rawKey.startsWith('http')) {
  const temp = rawUrl;
  rawUrl = rawKey;
  rawKey = temp;
}

const SUPABASE_URL = sanitizeUrl(rawUrl);
const SUPABASE_ANON_KEY = isValidKey(rawKey) ? rawKey : (isValidKey(rawUrl) ? rawUrl : FALLBACK_KEY);

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
export const isUsingCustomSupabase = Boolean(storedUrl && storedKey);
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const saveCustomSupabaseConfig = (url: string, key: string) => {
  if (url && key) {
    localStorage.setItem('custom_supabase_url', url.trim());
    localStorage.setItem('custom_supabase_key', key.trim());
    window.location.reload();
  }
};

export const resetSupabaseConfig = () => {
  localStorage.removeItem('custom_supabase_url');
  localStorage.removeItem('custom_supabase_key');
  window.location.reload();
};


