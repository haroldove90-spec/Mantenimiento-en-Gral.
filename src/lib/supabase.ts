/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://battwitnhrezwotkcvbc.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdHR3aXRuaHJlendvdGtjdmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjcwNjMsImV4cCI6MjEwMTAwMzA2M30.6e3bOgrIi5hKNbvt03DKu-QG1uDDM6GkXlTvHPthbA8';

const env = (import.meta as any).env || {};

const isValidUrl = (url: any): boolean => {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidKey = (key: any): boolean => {
  if (typeof key !== 'string' || !key.trim()) return false;
  return key.trim().startsWith('eyJ') && key.trim().length > 50;
};

const rawUrl = env.VITE_SUPABASE_URL;
const rawKey = env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = isValidUrl(rawUrl) ? rawUrl : FALLBACK_URL;
const SUPABASE_ANON_KEY = isValidKey(rawKey) ? rawKey : FALLBACK_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

