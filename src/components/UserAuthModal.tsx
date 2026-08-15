import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleType, SystemUser, normalizeRole } from '../types';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Sparkles, UserPlus, LogIn, Check, ShieldAlert, X, ShieldCheck, Database, Copy, CheckCircle2, RotateCcw } from 'lucide-react';

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
  const { systemUsers, addSystemUser, setCurrentUser, setActiveRole, setOwnerSubTab, setOfficeSubTab } = useApp();

  const [mode, setMode] = useState<'register' | 'login'>(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

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
      // Every user registered through the registration form takes the role of 'client' by default.
      // Roles (admin/owner/office/tech) can then be changed inside Supabase or in the system users dashboard.
      const assignedRole: RoleType = 'client';

      setIsSubmitting(true);
      setMessage({ type: 'warning', text: 'Guardando usuario en la base de datos de Supabase...' });

      // Register new user (saves to Supabase first)
      const res = await addSystemUser({
        name: fullName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: password.trim(),
        phone: '',
        role: assignedRole,
        status: 'Activo'
      });

      setIsSubmitting(false);

      if (!res.savedInDb || !res.success) {
        // DO NOT LET USER IN IF SUPABASE REGISTRATION FAILED!
        setMessage({
          type: 'error',
          text: `❌ Supabase no pudo registrar al usuario: ${res.error || 'No se pudo guardar la cuenta en la base de datos'}. No es posible ingresar sin un registro guardado en Supabase.`
        });
        return;
      }

      // Registration in Supabase succeeded
      const registeredUser = systemUsers.find(u => u.email.toLowerCase() === cleanEmail) || {
        id: `usr-${Date.now()}`,
        name: fullName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: password.trim(),
        role: assignedRole,
        status: 'Activo',
        lastLogin: 'Ahora mismo'
      };

      setCurrentUser(registeredUser);

      setMessage({
        type: 'success',
        text: `¡Cuenta creada exitosamente en Supabase! Ingresando como Cliente... (Puedes cambiar el rol en Supabase)`
      });

      setTimeout(() => {
        setActiveRole('client');
        onClose();
      }, 1000);

    } else {
      // LOGIN MODE
      if (!email.trim() || !password.trim()) {
        setMessage({ type: 'error', text: 'Ingresa tu usuario/correo y contraseña.' });
        return;
      }

      setIsSubmitting(true);
      setMessage({ type: 'warning', text: 'Verificando credenciales con Supabase...' });
      const input = email.trim().toLowerCase();
      const inputPass = password.trim();

      let foundUser: SystemUser | null = null;
      let authUserSuccess = false;

      // 1. Try Supabase Auth first (if user was created via Supabase Auth)
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: input,
          password: inputPass
        });
        if (!authError && authData?.user) {
          authUserSuccess = true;
        }
      } catch (authErr) {
        console.warn('Supabase Auth check skipped:', authErr);
      }

      // 2. Query Supabase system_users table directly
      try {
        // Query by email
        const { data: emailData, error: emailErr } = await supabase
          .from('system_users')
          .select('*')
          .ilike('email', input)
          .limit(1);

        if (!emailErr && emailData && emailData.length > 0) {
          const dbU = emailData[0];
          foundUser = {
            id: dbU.id,
            name: dbU.name || dbU.email.split('@')[0],
            username: dbU.username || dbU.email.split('@')[0],
            email: dbU.email,
            password: dbU.password || '',
            phone: dbU.phone || '',
            role: normalizeRole(dbU.role),
            status: dbU.status || 'Activo',
            lastLogin: 'Ahora mismo'
          };
        } else {
          // Query by username
          const { data: usernameData } = await supabase
            .from('system_users')
            .select('*')
            .ilike('username', input)
            .limit(1);

          if (usernameData && usernameData.length > 0) {
            const dbU = usernameData[0];
            foundUser = {
              id: dbU.id,
              name: dbU.name || dbU.username,
              username: dbU.username,
              email: dbU.email,
              password: dbU.password || '',
              phone: dbU.phone || '',
              role: normalizeRole(dbU.role),
              status: dbU.status || 'Activo',
              lastLogin: 'Ahora mismo'
            };
          }
        }
      } catch (err) {
        console.error('Error buscando usuario en Supabase system_users:', err);
      }

      // 3. Fallback: check local systemUsers state
      if (!foundUser) {
        foundUser = systemUsers.find(
          u =>
            (u.email && u.email.trim().toLowerCase() === input) ||
            (u.username && u.username.trim().toLowerCase() === input) ||
            (u.name && u.name.trim().toLowerCase() === input)
        ) || null;
      }

      setIsSubmitting(false);

      // If user is completely not found in database or state
      if (!foundUser) {
        if (authUserSuccess) {
          // User exists in Supabase Auth, let's create their system user record
          const newUser: SystemUser = {
            id: `usr-${Date.now()}`,
            name: input.split('@')[0],
            username: input.split('@')[0],
            email: input,
            password: inputPass,
            phone: '',
            role: normalizeRole(targetRole),
            status: 'Activo',
            lastLogin: 'Ahora mismo'
          };
          setCurrentUser(newUser);
          setActiveRole(newUser.role);
          setMessage({
            type: 'success',
            text: `¡Bienvenido al sistema!`
          });
          setTimeout(() => {
            onClose();
          }, 600);
          return;
        }

        setMessage({
          type: 'error',
          text: '❌ Usuario no encontrado en la base de datos de Supabase. Regístrate o verifica tu correo / usuario.'
        });
        return;
      }

      // Check account status
      if (foundUser.status === 'Inactivo') {
        setMessage({
          type: 'error',
          text: '⚠️ Esta cuenta se encuentra inactiva. Comunícate con el administrador para reactivar tu acceso.'
        });
        return;
      }

      // Check password validation
      let isPasswordValid = false;

      if (authUserSuccess) {
        isPasswordValid = true;
      } else if (!foundUser.password || foundUser.password.trim() === '') {
        // User was created in Supabase Table Editor without a plain-text password set:
        // Set this as their password automatically so future logins match seamlessly!
        isPasswordValid = true;
        try {
          await supabase
            .from('system_users')
            .update({ password: inputPass })
            .eq('id', foundUser.id);
        } catch (e) {
          console.warn('Could not auto-update password in Supabase:', e);
        }
      } else if (foundUser.password.trim() === inputPass) {
        isPasswordValid = true;
      }

      if (!isPasswordValid) {
        setMessage({
          type: 'error',
          text: '❌ Contraseña incorrecta. Verifica tus credenciales de ingreso.'
        });
        return;
      }

      // Login successful!
      setCurrentUser(foundUser);
      setMessage({
        type: 'success',
        text: `¡Bienvenido, ${foundUser.name}! Accediendo al sistema...`
      });

      setTimeout(() => {
        const userRole = foundUser!.role || (targetRole === 'home' ? 'owner' : targetRole);
        setActiveRole(userRole as RoleType);
        if (userRole === 'owner') setOwnerSubTab('analytics');
        if (userRole === 'office') setOfficeSubTab('orders');
        onClose();
      }, 700);
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
            {mode === 'register' 
              ? 'Crea tu cuenta. Los nuevos registros se asignan como Cliente por defecto y puedes ajustar el rol en Supabase.'
              : 'Ingresa con tu usuario o correo electrónico y contraseña registrados.'}
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
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-start space-x-2 mb-4 ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : message.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : message.type === 'warning' ? (
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-snug">{message.text}</div>
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
              <span>Rol asignado automáticamente: <b>Cliente</b>. El administrador puede cambiar tu rol en Supabase a Dueño, Oficina o Técnico.</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-sij-blue to-sij-navy hover:from-sij-navy hover:to-slate-900 text-white font-bold py-3 rounded-2xl shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {mode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4 text-sij-cyan" />
                  <span>{isSubmitting ? 'Registrando...' : 'Completar Registro'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-sij-cyan" />
                  <span>{isSubmitting ? 'Verificando...' : 'Ingresar al Sistema'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
