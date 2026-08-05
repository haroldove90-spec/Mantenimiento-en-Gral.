import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleType, SystemUser } from '../types';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Sparkles, UserPlus, LogIn, Check, ShieldAlert, X, ShieldCheck } from 'lucide-react';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: RoleType;
  initialMode?: 'register' | 'login';
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  targetRole = 'owner',
  initialMode = 'login'
}) => {
  const { systemUsers, addSystemUser, setActiveRole, setOwnerSubTab, setOfficeSubTab } = useApp();

  const [mode, setMode] = useState<'register' | 'login'>(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Role display label
  const getRoleLabel = (roleKey: RoleType) => {
    switch (roleKey) {
      case 'owner': return 'Dueño / Administrador General';
      case 'office': return 'Oficina / Administración';
      case 'tech': return 'Módulo Técnico';
      case 'client': return 'Portal Cliente';
      default: return 'Sistema SIJ';
    }
  };

  // Helper to generate a secure random password
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newPass = '';
    for (let i = 0; i < 12; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPass);
    setShowPassword(true);
    setMessage({
      type: 'success',
      text: '¡Clave segura generada exitosamente!'
    });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register') {
      if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
        setMessage({ type: 'error', text: 'Por favor completa todos los campos obligatorios.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim().toLowerCase();

      // Check if user already exists in local state
      const existsLocally = systemUsers.some(
        u => (u.email && u.email.toLowerCase() === cleanEmail) ||
             (u.username && u.username.toLowerCase() === cleanUsername)
      );

      if (existsLocally) {
        setMessage({
          type: 'error',
          text: 'El correo electrónico o nombre de usuario ya está registrado en el sistema.'
        });
        return;
      }

      // Check in Supabase if accessible
      let isTakenInDb = false;
      try {
        const { data: dbCheck, error: checkErr } = await supabase
          .from('system_users')
          .select('id, email, username')
          .or(`email.ilike.${cleanEmail},username.ilike.${cleanUsername}`)
          .limit(1);

        if (!checkErr && dbCheck && dbCheck.length > 0) {
          isTakenInDb = true;
        }
      } catch (err) {
        console.warn('Advertencia al consultar Supabase:', err);
      }

      if (isTakenInDb) {
        setMessage({
          type: 'error',
          text: 'El correo electrónico o nombre de usuario ya existe en Supabase.'
        });
        return;
      }

      // Determine initial assigned role (defaults to owner / targetRole)
      const assignedRole = (targetRole === 'home' ? 'owner' : targetRole) as 'owner' | 'office' | 'tech' | 'client';

      // Register new user (saves to local state and attempts Supabase save)
      const res = await addSystemUser({
        name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: '',
        role: assignedRole,
        status: 'Activo'
      });

      if (res.savedInDb) {
        setMessage({
          type: 'success',
          text: `¡Usuario ${username} registrado y guardado con éxito en Supabase! Accediendo...`
        });
      } else {
        setMessage({
          type: 'success',
          text: `¡Usuario ${username} registrado correctamente en la aplicación! (Sincronización Supabase: si no ves la tabla en Supabase, ejecuta el script SQL). Accediendo...`
        });
      }

      setTimeout(() => {
        setActiveRole(assignedRole);
        if (assignedRole === 'owner') setOwnerSubTab('analytics');
        if (assignedRole === 'office') setOfficeSubTab('orders');
        onClose();
      }, 1200);

    } else {
      // LOGIN MODE
      if (!email.trim() || !password.trim()) {
        setMessage({ type: 'error', text: 'Ingresa tu usuario/correo y contraseña.' });
        return;
      }

      const input = email.trim().toLowerCase();

      // Find user in local state first
      let foundUser: SystemUser | null = systemUsers.find(
        u =>
          (u.email && u.email.trim().toLowerCase() === input) ||
          (u.username && u.username.trim().toLowerCase() === input)
      ) || null;

      // If not in local state, try Supabase database lookup
      if (!foundUser) {
        try {
          const { data, error } = await supabase
            .from('system_users')
            .select('*')
            .or(`email.ilike.${input},username.ilike.${input}`)
            .limit(1);

          if (!error && data && data.length > 0) {
            const dbU = data[0];
            foundUser = {
              id: dbU.id,
              name: dbU.name,
              username: dbU.username || dbU.email.split('@')[0],
              email: dbU.email,
              password: dbU.password || '',
              phone: dbU.phone || '',
              role: dbU.role || 'owner',
              status: dbU.status || 'Activo',
              lastLogin: 'Ahora mismo'
            };
          }
        } catch (err) {
          console.error('Error buscando usuario en Supabase:', err);
        }
      }

      if (!foundUser) {
        setMessage({
          type: 'error',
          text: 'Usuario no encontrado. Por favor ve a la pestaña "Registrarse" para crear tu cuenta.'
        });
        return;
      }

      if (foundUser.password && foundUser.password !== password) {
        setMessage({
          type: 'error',
          text: 'Contraseña incorrecta. Verifica tus credenciales.'
        });
        return;
      }

      // Login successful!
      setMessage({
        type: 'success',
        text: `¡Bienvenido de nuevo, ${foundUser.name}! Iniciando sesión...`
      });

      setTimeout(() => {
        const userRole = foundUser!.role || (targetRole === 'home' ? 'owner' : targetRole);
        setActiveRole(userRole as RoleType);
        if (userRole === 'owner') setOwnerSubTab('analytics');
        if (userRole === 'office') setOfficeSubTab('orders');
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-sij-blue to-sij-navy text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            {mode === 'register' ? <UserPlus className="w-7 h-7 text-sij-cyan" /> : <LogIn className="w-7 h-7 text-sij-cyan" />}
          </div>
          <h3 className="font-extrabold text-slate-900 text-xl">
            {mode === 'register' ? 'Registro de Usuario' : 'Ingreso al Sistema'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Acceso para <span className="font-bold text-sij-blue">{getRoleLabel(targetRole as RoleType)}</span>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-sij-blue shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white text-sij-blue shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 mb-4 ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {message.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          
          {/* REGISTER FIELDS ONLY */}
          {mode === 'register' && (
            <>
              {/* 1. Nombre Completo */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ej. Ing. Carlos Alberto Mendoza"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sij-blue/30 focus:border-sij-blue transition-all"
                />
              </div>

              {/* 2. Nombre de Usuario */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ej. cmendoza"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sij-blue/30 focus:border-sij-blue transition-all"
                />
              </div>
            </>
          )}

          {/* 3. Correo Electrónico */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {mode === 'register' ? 'Correo Electrónico *' : 'Correo o Nombre de Usuario *'}
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={mode === 'register' ? 'ejemplo@empresa.com' : 'Ingresa tu usuario o correo'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sij-blue/30 focus:border-sij-blue transition-all"
            />
          </div>

          {/* 4. Clave / Contraseña con opción de crear clave segura e icono del ojito */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Clave / Contraseña *</label>
              {mode === 'register' && (
                <button
                  type="button"
                  onClick={generateSecurePassword}
                  className="text-[11px] font-bold text-sij-blue hover:text-sij-navy flex items-center space-x-1 cursor-pointer transition-colors"
                  title="Generar clave aleatoria segura con letras, números y símbolos"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Crear clave segura</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Escribe o genera tu clave' : 'Tu contraseña'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-800 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-sij-blue/30 focus:border-sij-blue transition-all"
              />
              {/* Icono del ojito para alternar visibilidad de la contraseña */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-sij-blue" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 text-[11px] text-sij-navy font-semibold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-sij-blue shrink-0" />
              <span>Los roles asignados se pueden sincronizar o modificar directamente en Supabase.</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-sij-blue to-sij-navy hover:from-sij-navy hover:to-slate-900 text-white font-bold py-3 rounded-2xl shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              {mode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4 text-sij-cyan" />
                  <span>Completar Registro</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-sij-cyan" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
