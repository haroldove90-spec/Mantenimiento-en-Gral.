/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://battwitnhrezwotkcvbc.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdHR3aXRuaHJlendvdGtjdmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjcwNjMsImV4cCI6MjEwMTAwMzA2M30.6e3bOgrIi5hKNbvt03DKu-QG1uDDM6GkXlTvHPthbA8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
