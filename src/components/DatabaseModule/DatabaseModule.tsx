import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  ExternalLink,
  Key,
  Copy,
  Check,
  CreditCard,
  Zap,
  ShieldCheck,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Eye,
  EyeOff,
  HelpCircle,
  FileCode,
  Layers,
  Server,
  ArrowRight,
  Sparkles,
  Settings,
  RotateCcw
} from 'lucide-react';
import {
  SUPABASE_PROJECT_URL,
  isUsingCustomSupabase,
  saveCustomSupabaseConfig,
  resetSupabaseConfig
} from '../../lib/supabase';

export const DatabaseModule: React.FC = () => {
  const {
    supabaseStatus,
    checkSupabaseConnection,
    telemetryLogs,
    clearTelemetryLogs,
    syncAllDataToSupabase,
    orders,
    clients,
    technicians,
    systemUsers,
    spareParts,
    expenses
  } = useApp();

  // Tab inside Database Module
  const [subTab, setSubTab] = useState<'access_and_billing' | 'status_and_sync' | 'sql' | 'credentials'>('access_and_billing');

  // Copy states
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Custom Supabase form
  const [inputUrl, setInputUrl] = useState(() => localStorage.getItem('custom_supabase_url') || '');
  const [inputKey, setInputKey] = useState(() => localStorage.getItem('custom_supabase_key') || '');
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  // Fixed client credentials as requested
  const CLIENT_USERNAME = 'sij@appdesignproyectos.com';
  const CLIENT_PASSWORD = 'Chevropar#1970';
  const SUPABASE_SIGNIN_URL = 'https://supabase.com/dashboard/sign-in';
  const SUPABASE_BILLING_URL = 'https://supabase.com/dashboard/project/battwitnhrezwotkcvbc/settings/billing/subscription';
  const SUPABASE_PROJECT_DASHBOARD = 'https://supabase.com/dashboard/project/battwitnhrezwotkcvbc';

  const handleCopy = (text: string, type: 'user' | 'pass' | 'sql') => {
    navigator.clipboard.writeText(text);
    if (type === 'user') {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2500);
    } else if (type === 'pass') {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2500);
    } else {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const handleManualCheck = async () => {
    await checkSupabaseConnection(true);
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllDataToSupabase();
      setSyncFeedback(res.message);
    } catch (e: any) {
      setSyncFeedback(`Error: ${e.message || 'Fallo de sincronización'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      setConfigFeedback('Por favor ingresa tanto la URL como la Anon Key de Supabase.');
      return;
    }
    if (!inputUrl.trim().startsWith('http')) {
      setConfigFeedback('Error: La URL debe comenzar con https://');
      return;
    }
    saveCustomSupabaseConfig(inputUrl.trim(), inputKey.trim());
    setConfigFeedback('¡Credenciales guardadas con éxito! Comprobando enlace...');
  };

  const handleResetConfig = () => {
    resetSupabaseConfig();
    setInputUrl('');
    setInputKey('');
    setConfigFeedback('Se restauraron las credenciales predeterminadas de Supabase.');
    checkSupabaseConnection(true);
  };

  const fullSqlScript = `-- =========================================================
-- ESQUEMA COMPLETO Y ROBUSTO SUPABASE: SIJ SERVICIOS TÉCNICOS
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('owner', 'office', 'tech', 'client')),
    phone TEXT,
    pin TEXT DEFAULT '1234',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_id TEXT,
    client_type TEXT DEFAULT 'Particular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendiente',
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    technician_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    issue_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Public Insert Employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Employees" ON public.employees FOR UPDATE USING (true);

CREATE POLICY "Public Read Clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Public Insert Clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Clients" ON public.clients FOR UPDATE USING (true);

CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Orders" ON public.orders FOR UPDATE USING (true);
`;

  return (
    <div id="database-module" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/60 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-md shrink-0">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Módulo de Base de Datos Supabase</span>
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Proyecto: battwitnhrezwotkcvbc
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-1">
              Control de Base de Datos Cloud & Facturación
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Acceso directo a la cuenta Supabase del cliente, guía para activar el Plan Pro ($25 USD) y auditoría en tiempo real
            </p>
          </div>
        </div>

        {/* Quick Diagnostic Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleManualCheck}
            disabled={supabaseStatus.isChecking}
            className="cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50"
            title="Comprobar enlace en vivo con Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${supabaseStatus.isChecking ? 'animate-spin' : ''}`} />
            <span>{supabaseStatus.isChecking ? 'Verificando...' : '⚡ Probar Conexión'}</span>
          </button>

          <a
            href={SUPABASE_SIGNIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>Abrir Supabase ↗</span>
          </a>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        <button
          onClick={() => setSubTab('access_and_billing')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'access_and_billing'
              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Acceso Supabase & Pago Plan Pro ($25)</span>
        </button>

        <button
          onClick={() => setSubTab('status_and_sync')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'status_and_sync'
              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Estado & Sincronización ({orders.length} órdenes)</span>
        </button>

        <button
          onClick={() => setSubTab('sql')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'sql'
              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Esquema SQL</span>
        </button>

        <button
          onClick={() => setSubTab('credentials')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'credentials'
              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Ajustes Avanzados</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: ACCESO DIRECTO A CUENTA SUPABASE & GUÍA DE PAGO ($25 USD)      */}
      {/* ========================================================================= */}
      {subTab === 'access_and_billing' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Card 1: Credenciales de Acceso Directo */}
          <div className="bg-white border-2 border-emerald-400/40 rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-70 pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Credenciales de Acceso del Cliente (Supabase)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Usa estos datos para ingresar directamente al panel de administración de Supabase
                  </p>
                </div>
              </div>

              {/* Botón Acción Principal */}
              <a
                href={SUPABASE_SIGNIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <span>Acceder a Supabase Dashboard</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Grid con usuario y clave en cajas de copia rápida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Usuario */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Usuario / Correo Electrónico
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Cuenta Oficial
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-2xs">
                  <span className="font-mono text-xs sm:text-sm font-black text-slate-900 select-all truncate">
                    {CLIENT_USERNAME}
                  </span>
                  <button
                    onClick={() => handleCopy(CLIENT_USERNAME, 'user')}
                    className="ml-2 p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
                    title="Copiar correo"
                  >
                    {copiedUser ? (
                      <span className="flex items-center text-xs text-emerald-600 font-bold space-x-1">
                        <Check className="w-4 h-4" />
                        <span>¡Copiado!</span>
                      </span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Contraseña */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Contraseña / Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-2xs">
                  <span className="font-mono text-xs sm:text-sm font-black text-slate-900 select-all">
                    {showPassword ? CLIENT_PASSWORD : '••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => handleCopy(CLIENT_PASSWORD, 'pass')}
                    className="ml-2 p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
                    title="Copiar contraseña"
                  >
                    {copiedPass ? (
                      <span className="flex items-center text-xs text-emerald-600 font-bold space-x-1">
                        <Check className="w-4 h-4" />
                        <span>¡Copiado!</span>
                      </span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Accesos Rápidos Extras */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Base de datos PostgreSQL alojada en la nube con Supabase Inc.</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={SUPABASE_PROJECT_DASHBOARD}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1"
                >
                  <span>Ir al Proyecto battwitnhrezwotkcvbc</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Instrucciones Sencillas para Pagar el Plan Pro ($25 USD) */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 border border-indigo-700/50 rounded-3xl p-6 text-white shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black text-white">
                      Instrucciones de Pago: Activar Plan Pro ($25 USD)
                    </h3>
                    <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                      Paso a Paso
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    ¿Por qué realizar este pago? Tu base de datos superó la cuota mensual de transferencia gratuita (Egress Quota). Al activar el Plan Pro ($25 USD), Supabase elimina todas las restricciones inmediatamente.
                  </p>
                </div>
              </div>

              {/* Botón de Pago Directo */}
              <a
                href={SUPABASE_BILLING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Pagar Plan Pro en Supabase ($25) ↗</span>
              </a>
            </div>

            {/* Pasos en Formato Sencillo y Visual */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Paso 1 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Inicia Sesión</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Entra a <strong>supabase.com</strong> con el usuario <span className="text-amber-300 font-mono text-[11px]">{CLIENT_USERNAME}</span> y la clave <span className="text-amber-300 font-mono text-[11px]">{CLIENT_PASSWORD}</span>.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Acceso verificado</span>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Abre Facturación</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    En el menú lateral izquierdo de tu proyecto, da clic en el icono ⚙️ <strong>Project Settings</strong> y luego en <strong>Billing</strong> (Facturación).
                  </p>
                </div>
                <a
                  href={SUPABASE_BILLING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pt-2 text-[11px] text-cyan-300 hover:underline font-bold flex items-center space-x-1"
                >
                  <span>Abrir enlace directo ↗</span>
                </a>
              </div>

              {/* Paso 3 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Selecciona "Pro"</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    En la sección de planes, localiza el <strong>Plan Pro ($25/month)</strong> y haz clic en el botón <strong>"Upgrade to Pro"</strong>.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-amber-300 font-semibold flex items-center space-x-1">
                  <span>Costo: $25 USD / mes</span>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm">
                  4
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Ingresa tu Tarjeta</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Ingresa los datos de tu tarjeta de crédito o débito (Stripe seguro) y presiona el botón para confirmar el pago.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Pasarela Stripe cifrada</span>
                </div>
              </div>

              {/* Paso 5 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-sm">
                  5
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Reactivación</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    ¡Listo! En menos de 2 minutos Supabase reactivará el tráfico ilimitado. Regresa aquí y presiona <strong>"Probar Conexión"</strong>.
                  </p>
                </div>
                <button
                  onClick={handleManualCheck}
                  className="pt-2 text-[11px] text-emerald-300 hover:text-white font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Probar Conexión Ahora</span>
                </button>
              </div>
            </div>

            {/* Aviso de Beneficios del Plan Pro */}
            <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-slate-200">
                  <strong className="text-white">Beneficios del Plan Pro:</strong> 100,000 conexiones concurrentes, 8 GB de almacenamiento de base de datos, 250 GB de transferencia de ancho de banda y respaldos diarios automáticos de 7 días.
                </p>
              </div>
              <a
                href={SUPABASE_BILLING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-100 transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <span>Ir a Facturación Supabase ↗</span>
              </a>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: ESTADO EN VIVO & SINCRONIZACIÓN DE DATOS                        */}
      {/* ========================================================================= */}
      {subTab === 'status_and_sync' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Semaphore Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="relative flex items-center justify-center shrink-0">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                      supabaseStatus.isConnected
                        ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600'
                        : 'bg-rose-50 border-2 border-rose-500 text-rose-600'
                    }`}
                  >
                    {supabaseStatus.isConnected ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : (
                      <AlertCircle className="w-8 h-8" />
                    )}
                  </div>
                  <span
                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      supabaseStatus.isConnected
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-rose-500 animate-ping'
                    }`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {supabaseStatus.isConnected
                      ? 'Base de Datos Supabase Conectada en Tiempo Real'
                      : 'Límite de Transferencia Alcanzado o Fallo de Enlace'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>Latencia:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {supabaseStatus.latencyMs !== null ? `${supabaseStatus.latencyMs} ms` : 'Calculando...'}
                    </span>
                    <span>•</span>
                    <span>Último sondeo:</span>
                    <span className="font-medium text-slate-700">
                      {supabaseStatus.lastChecked
                        ? new Date(supabaseStatus.lastChecked).toLocaleTimeString()
                        : 'Sin registro'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleManualCheck}
                  disabled={supabaseStatus.isChecking}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supabaseStatus.isChecking ? 'animate-spin' : ''}`} />
                  <span>Probar Conexión</span>
                </button>

                <button
                  onClick={handleSyncData}
                  disabled={isSyncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Todo'}</span>
                </button>
              </div>
            </div>

            {syncFeedback && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold">
                {syncFeedback}
              </div>
            )}

            {/* Database Counts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Órdenes (OS)</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{orders.length}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">folios en sistema</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clientes</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{clients.length}</span>
                <span className="text-[10px] text-blue-600 font-semibold">empresas y part.</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Técnicos</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{technicians.length}</span>
                <span className="text-[10px] text-purple-600 font-semibold">personal de campo</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Usuarios</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{systemUsers.length}</span>
                <span className="text-[10px] text-amber-600 font-semibold">cuentas activas</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Refacciones</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{spareParts.length}</span>
                <span className="text-[10px] text-cyan-600 font-semibold">en inventario</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gastos</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{expenses.length}</span>
                <span className="text-[10px] text-rose-600 font-semibold">registros op.</span>
              </div>
            </div>
          </div>

          {/* Telemetry Logs */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Registro de Telemetría en Tiempo Real</h4>
                <p className="text-xs text-slate-500">Historial de consultas, sincronizaciones y eventos hacia Supabase</p>
              </div>
              <button
                onClick={clearTelemetryLogs}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Limpiar registros
              </button>
            </div>

            <div className="bg-slate-950 text-slate-300 font-mono text-xs rounded-2xl p-4 max-h-64 overflow-y-auto space-y-2 border border-slate-800">
              {telemetryLogs.length === 0 ? (
                <div className="py-4 text-center text-slate-500">No hay registros de telemetría recientes.</div>
              ) : (
                telemetryLogs.slice(0, 30).map((log, i) => (
                  <div key={i} className="flex items-start space-x-2 pb-1.5 border-b border-slate-900 text-[11px]">
                    <span className="text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`font-bold uppercase shrink-0 ${
                        log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      [{log.status}]
                    </span>
                    <span className="text-amber-300 shrink-0">{log.action}:</span>
                    <span className="text-slate-300 truncate">{log.details || log.error || 'Operación ejecutada'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: ESQUEMA SQL COMPLETO                                           */}
      {/* ========================================================================= */}
      {subTab === 'sql' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Script SQL del Esquema en Supabase</h3>
              <p className="text-xs text-slate-500">
                Puedes ejecutar este script en el <strong>SQL Editor</strong> de Supabase si necesitas reinstalar o verificar las tablas.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(fullSqlScript, 'sql')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? '¡SQL Copiado!' : 'Copiar Script SQL'}</span>
              </button>
              <a
                href={`${SUPABASE_PROJECT_DASHBOARD}/sql`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Abrir SQL Editor ↗</span>
              </a>
            </div>
          </div>

          <pre className="bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl p-5 overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed">
            {fullSqlScript}
          </pre>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: AJUSTES AVANZADOS DE CONEXIÓN                                   */}
      {/* ========================================================================= */}
      {subTab === 'credentials' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-black text-slate-900">Configuración de Credenciales de Supabase</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Si en el futuro deseas migrar o conectar un nuevo proyecto de Supabase, puedes ingresar aquí las nuevas claves de conexión.
            </p>
          </div>

          <form onSubmit={handleSaveCustomConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project URL (Ejemplo: https://battwitnhrezwotkcvbc.supabase.co)
              </label>
              <input
                type="text"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                placeholder="https://tu-proyecto.supabase.co"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Anon Public API Key (JWT eyJhbGciOiJIUzI1Ni...)
              </label>
              <textarea
                rows={3}
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {configFeedback && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold rounded-xl">
                {configFeedback}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Guardar Nuevas Credenciales
              </button>

              <button
                type="button"
                onClick={handleResetConfig}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Valores por Defecto</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
