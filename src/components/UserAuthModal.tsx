import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Sparkles, UserPlus, LogIn, KeyRound, Check, ShieldCheck, X } from 'lucide-react';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'register' | 'login';
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({ isOpen, onClose, initialMode = 'register' }) => {
  const { addSystemUser, setActiveRole, setOwnerSubTab } = useApp();

  const [mode, setMode] = useState<'register' | 'login'>(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'owner' | 'office'>('owner'); // Default to admin

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Helper to generate a secure random password
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newPass = '';
    for (let i = 0; i < 12; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPass);
    setShowPassword(true); // Automatically show password when generated so user can see it
    setMessage({
      type: 'success',
      text: '¡Clave segura generada exitosamente!'
    });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register') {
      if (!fullName || !username || !email || !password) {
        setMessage({ type: 'error', text: 'Por favor completa todos los campos requeridos.' });
        return;
      }

      // Add user to AppContext state / LocalStorage
      addSystemUser({
        name: fullName,
        username: username,
        email: email,
        password: password,
        phone: '',
        role: role,
        status: 'Activo'
      });

      setMessage({
        type: 'success',
        text: `¡Usuario ${username} registrado correctamente con rol Administrador!`
      });

      // Switch to active role and subtab
      setTimeout(() => {
        setActiveRole(role);
        if (role === 'owner') setOwnerSubTab('users');
        onClose();
      }, 1200);
    } else {
      // Login mode
      if (!email || !password) {
        setMessage({ type: 'error', text: 'Ingresa correo/usuario y contraseña.' });
        return;
      }

      setMessage({ type: 'success', text: '¡Sesión iniciada correctamente!' });
      setTimeout(() => {
        setActiveRole('owner');
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
          <div className="w-14 h-14 bg-gradient-to-tr from-sij-blue to-sij-cyan text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            {mode === 'register' ? <UserPlus className="w-7 h-7" /> : <LogIn className="w-7 h-7" />}
          </div>
          <h3 className="font-extrabold text-slate-900 text-xl">
            {mode === 'register' ? 'Registro de Usuario Admin' : 'Ingresar al Sistema SIJ'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'register' 
              ? 'Crea tu cuenta administrativa con credenciales personalizadas' 
              : 'Ingresa con tu correo o usuario y contraseña'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'register' ? 'bg-white text-sij-blue shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Registrarse (Admin)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'login' ? 'bg-white text-sij-blue shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 mb-4 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {message.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          
          {/* REGISTER FIELDS */}
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
                  placeholder="Ej. admin_carlos"
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
              placeholder="ejemplo@empresa.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sij-blue/30 focus:border-sij-blue transition-all"
            />
          </div>

          {/* 4. Clave / Contraseña con opción segura e icono del ojito */}
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

          {/* Initial Role info */}
          {mode === 'register' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Rol Inicial Asignado</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'owner' | 'office')}
                className="w-full bg-blue-50/70 border border-blue-200 text-sij-blue rounded-xl px-3 py-2 text-xs font-extrabold focus:outline-hidden cursor-pointer"
              >
                <option value="owner">Dueño / Administrador General (Rol Admin)</option>
                <option value="office">Oficina / Logística (Rol Admin)</option>
              </select>
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
                  <span>Completar Registro (Admin)</span>
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
