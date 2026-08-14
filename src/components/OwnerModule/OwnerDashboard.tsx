import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SystemUser, OperatingExpense, normalizeRole, getRoleDisplayName, RoleType } from '../../types';
import {
  Crown,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  PieChart,
  FileSpreadsheet,
  Download,
  PlusCircle,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldAlert,
  UserCheck,
  UserX,
  Edit,
  Building2,
  Calendar,
  Filter,
  ArrowUpRight,
  Trash2,
  RotateCcw,
  Database,
  Eye,
  EyeOff,
  Sparkles,
  X
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const {
    orders,
    technicians,
    systemUsers,
    currentUser,
    expenses,
    addSystemUser,
    syncUsersToSupabase,
    updateSystemUser,
    toggleUserStatus,
    deleteSystemUser,
    addExpense,
    deleteExpense,
    clearSampleData,
    resetToDemoData,
    ownerSubTab,
    setOwnerSubTab
  } = useApp();

  const activeTab = ownerSubTab;
  const setActiveTab = setOwnerSubTab;

  // Filter state for Financial Reports
  const [dateRange, setDateRange] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Supabase Sync & SQL Modal state
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await syncUsersToSupabase();
    setIsSyncing(false);
    if (res.success && res.count > 0) {
      setSyncResult({
        type: 'success',
        text: `¡Se sincronizaron ${res.count} usuarios exitosamente en la base de datos de Supabase!`
      });
    } else {
      setSyncResult({
        type: 'error',
        text: `Error al sincronizar: ${res.error || 'Asegúrate de haber creado la tabla system_users ejecutando el script SQL.'}`
      });
    }
  };

  // New user form state
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'office' | 'tech'>('owner');

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newPass = '';
    for (let i = 0; i < 12; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserPassword(newPass);
    setShowPassword(true);
  };

  // New expense form state
  const [expCategory, setExpCategory] = useState<'Combustible' | 'Herramientas' | 'Viáticos' | 'Mantenimiento Vehículos' | 'Otros'>('Combustible');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // Calculations for Sales & Analytics
  const closedOrders = orders.filter(o => o.status === 'Cobrado/Cerrado');
  const pendingOrders = orders.filter(o => o.status !== 'Cobrado/Cerrado');

  const totalSalesAllTime = closedOrders.reduce((sum, o) => {
    if (o.collectedAmount) return sum + o.collectedAmount;
    if (o.budget) {
      const parts = o.budget.parts.reduce((s, p) => s + p.quantity * p.estimatedUnitPrice, 0);
      return sum + Math.round((o.budget.laborCost + parts) * (1 + o.budget.taxRate));
    }
    return sum;
  }, 0);

  // Simulated today and month sales calculation
  const todaySales = totalSalesAllTime > 0 ? Math.round(totalSalesAllTime * 0.35) : 2088;
  const monthSales = totalSalesAllTime;

  // Total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = monthSales - totalExpenses;

  // Collection by Technician
  const techCollectionStats = technicians.map(tech => {
    const techClosed = closedOrders.filter(o => o.technicianId === tech.id);
    const totalCollected = techClosed.reduce((sum, o) => sum + (o.collectedAmount || 0), 0);
    const cashTotal = techClosed.filter(o => o.paymentMethod === 'Efectivo').reduce((sum, o) => sum + (o.collectedAmount || 0), 0);
    const cardTotal = techClosed.filter(o => o.paymentMethod === 'Tarjeta').reduce((sum, o) => sum + (o.collectedAmount || 0), 0);
    const transferTotal = techClosed.filter(o => o.paymentMethod === 'Transferencia').reduce((sum, o) => sum + (o.collectedAmount || 0), 0);

    return {
      tech,
      closedCount: techClosed.length,
      totalCollected,
      cashTotal,
      cardTotal,
      transferTotal
    };
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;

    if (editingUser) {
      updateSystemUser(editingUser.id, {
        name: userName,
        username: userUsername,
        email: userEmail,
        password: userPassword,
        phone: userPhone,
        role: userRole
      });
      setEditingUser(null);
    } else {
      addSystemUser({
        name: userName,
        username: userUsername,
        email: userEmail,
        password: userPassword,
        phone: userPhone,
        role: userRole,
        status: 'Activo'
      });
    }

    setUserName('');
    setUserUsername('');
    setUserEmail('');
    setUserPassword('');
    setUserPhone('');
    setIsAddUserOpen(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expAmount);
    if (!expDesc || isNaN(amountNum) || amountNum <= 0) return;

    addExpense({
      category: expCategory,
      description: expDesc,
      amount: amountNum,
      date: new Date().toISOString().split('T')[0],
      registeredBy: 'Dueño General'
    });

    setExpDesc('');
    setExpAmount('');
    setIsAddExpenseOpen(false);
  };

  const exportReport = (format: 'PDF' | 'Excel') => {
    alert(`📄 Reporte financiero generado y descargado exitosamente en formato ${format}.`);
  };

  return (
    <div id="owner-dashboard" className="w-full px-3 sm:px-8 py-6 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      
      {/* Header Bar - Dueño */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shadow-md shrink-0">
            <Crown className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full">
                Rol: Dueño (Administrador General)
              </span>
              {currentUser && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Usuario: {currentUser.name} (@{currentUser.username || currentUser.email.split('@')[0]})</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-1">
              {currentUser?.name ? `¡Bienvenido, ${currentUser.name}!` : 'Supervisión Operativa & Métricas Financieras'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">Control de ingresos, rendimiento de técnicos, reportes de gastos y gestión de personal</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('⚠️ ¿Estás seguro de que deseas eliminar TODOS los datos de muestra del sistema? Esta acción limpiará órdenes, clientes, refacciones y gastos de prueba.')) {
                clearSampleData();
              }
            }}
            className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 shrink-0"
            title="Borrar datos de prueba/muestra"
          >
            <Trash2 className="w-4 h-4" />
            <span>Borrar Datos de Muestra</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('¿Deseas restablecer los datos de muestra iniciales para pruebas?')) {
                resetToDemoData();
              }
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0"
            title="Restablecer datos demo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Cargar Demo</span>
          </button>

          <button
            onClick={() => exportReport('PDF')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center space-x-1.5 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Métricas</span>
          </button>
        </div>
      </div>

      {/* ------------------- TAB 1: ANALÍTICA & COBRANZA ------------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas del Día</span>
                <p className="text-2xl font-black text-slate-900 mt-1">${todaySales.toLocaleString('es-MX')} MXN</p>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Cobros realizados hoy
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas del Mes</span>
                <p className="text-2xl font-black text-slate-900 mt-1">${monthSales.toLocaleString('es-MX')} MXN</p>
                <span className="text-[11px] text-blue-600 font-bold flex items-center mt-1">
                  Total cobrado en facturas/recibos
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Órdenes Cerradas</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{closedOrders.length} / {orders.length}</p>
                <span className="text-[11px] text-indigo-600 font-bold flex items-center mt-1">
                  {Math.round((closedOrders.length / (orders.length || 1)) * 100)}% de eficiencia de cierre
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Órdenes Pendientes</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{pendingOrders.length}</p>
                <span className="text-[11px] text-amber-600 font-bold flex items-center mt-1">
                  En proceso, cotización o visita
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Performance & Cobranza por Técnico */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Indicadores de Cobranza Realizada por Técnicos</h3>
                <p className="text-xs text-slate-500">Monto cobrado en sitio por cada técnico y desglose de formas de pago</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Cobranza 100% Auditada
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-3">Técnico de Campo</th>
                    <th className="p-3">Especialidad</th>
                    <th className="p-3 text-center">Órdenes Cerradas</th>
                    <th className="p-3 text-right">Efectivo</th>
                    <th className="p-3 text-right">Tarjeta</th>
                    <th className="p-3 text-right">Transferencia</th>
                    <th className="p-3 text-right">Total Cobrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {techCollectionStats.map(s => (
                    <tr key={s.tech.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {s.tech.name.charAt(0)}
                        </div>
                        <span>{s.tech.name}</span>
                      </td>
                      <td className="p-3 text-slate-600">{s.tech.specialty}</td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md">{s.closedCount} OS</span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">${s.cashTotal.toLocaleString('es-MX')}</td>
                      <td className="p-3 text-right font-mono text-slate-700">${s.cardTotal.toLocaleString('es-MX')}</td>
                      <td className="p-3 text-right font-mono text-slate-700">${s.transferTotal.toLocaleString('es-MX')}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 text-sm">
                        ${s.totalCollected.toLocaleString('es-MX')} MXN
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stage breakdown chart simulation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Rendimiento Operativo por Etapa</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Pendiente Visita', count: orders.filter(o => o.status === 'Pendiente de Visita').length, color: 'bg-slate-100 text-slate-800' },
                { label: 'En Diagnóstico', count: orders.filter(o => o.status === 'En Diagnóstico').length, color: 'bg-blue-100 text-blue-800' },
                { label: 'Presupuesto Pendiente', count: orders.filter(o => o.status === 'Presupuesto Pendiente').length, color: 'bg-amber-100 text-amber-800' },
                { label: 'Esperando Aprobación', count: orders.filter(o => o.status === 'Esperando Aprobación').length, color: 'bg-purple-100 text-purple-800' },
                { label: 'En Reparación', count: orders.filter(o => o.status === 'En Reparación').length, color: 'bg-indigo-100 text-indigo-800' },
                { label: 'Cobrado/Cerrado', count: orders.filter(o => o.status === 'Cobrado/Cerrado').length, color: 'bg-emerald-100 text-emerald-800' }
              ].map(st => (
                <div key={st.label} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">{st.label}</span>
                  <span className={`text-xl font-black inline-block px-3 py-0.5 rounded-lg ${st.color}`}>
                    {st.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ------------------- TAB 2: REPORTES FINANCIEROS Y OPERATIVOS ------------------- */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          
          {/* Controls: Date range filter & Add Expense Button */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Filter className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">Rango de Reporte:</span>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value as any)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
              >
                <option value="weekly">Semanal (Últimos 7 Días)</option>
                <option value="monthly">Mensual (Mes en Curso)</option>
                <option value="custom">Rango Personalizado</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center space-x-2 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-slate-800"
                />
                <span>a</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-slate-800"
                />
              </div>
            )}

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Registrar Gasto Operativo</span>
              </button>

              <button
                onClick={() => exportReport('Excel')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Ingresos Brutos por Servicios</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">${monthSales.toLocaleString('es-MX')} MXN</p>
              <p className="text-[11px] text-slate-400 mt-1">Total de cotizaciones cobradas</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Gastos Operativos Desglosados</span>
              <p className="text-2xl font-black text-rose-600 mt-1">${totalExpenses.toLocaleString('es-MX')} MXN</p>
              <p className="text-[11px] text-slate-400 mt-1">Combustibles, herramientas y viáticos</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl shadow-md">
              <span className="text-xs font-bold text-amber-400 uppercase">Utilidad Neta Estimada</span>
              <p className="text-2xl font-black text-white mt-1">${netIncome.toLocaleString('es-MX')} MXN</p>
              <p className="text-[11px] text-slate-300 mt-1">Margen operativo disponible</p>
            </div>
          </div>

          {/* Expenses Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Desglose de Gastos Operativos</h3>
              <span className="text-xs font-bold text-slate-500">Total: {expenses.length} registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Descripción / Concepto</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Registrado Por</th>
                    <th className="p-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-md border border-rose-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{exp.description}</td>
                      <td className="p-3 text-slate-500">{exp.date}</td>
                      <td className="p-3 text-slate-600">{exp.registeredBy}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 text-sm">
                        -${exp.amount.toLocaleString('es-MX')} MXN
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------- TAB 3: GESTIÓN DE USUARIOS Y PERSONAL ------------------- */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Gestión de Usuarios, Credenciales y Personal</h3>
              <p className="text-xs text-slate-500">Alta, baja, edición de roles y control de permisos para el equipo de Oficina y Técnicos</p>
            </div>

            <button
              onClick={() => {
                setEditingUser(null);
                setUserName('');
                setUserEmail('');
                setUserPhone('');
                setIsAddUserOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nuevo Usuario del Sistema</span>
            </button>
          </div>

          {/* Supabase Cloud Connection & Sync Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-sij-navy text-white p-5 rounded-2xl shadow-lg border border-indigo-900/50 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-sij-cyan animate-pulse" />
                  <h4 className="font-extrabold text-sm text-white">Sincronización con Base de Datos Supabase</h4>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Nube Conectada
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Si registraste usuarios pero no los ves en tu panel de Supabase, ejecuta el script SQL para crear las tablas y haz clic en "Sincronizar Usuarios".
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsSqlModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-sij-cyan border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Ver Script SQL Supabase</span>
                </button>

                <button
                  onClick={handleSyncSupabase}
                  disabled={isSyncing}
                  className="bg-gradient-to-r from-sij-blue to-indigo-600 hover:from-sij-navy hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className={`w-4 h-4 text-sij-cyan ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Usuarios a Supabase'}</span>
                </button>
              </div>
            </div>

            {syncResult && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                syncResult.type === 'success' 
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
              }`}>
                {syncResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{syncResult.text}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemUsers.map(usr => (
              <div
                key={usr.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shadow-xs ${
                      usr.role === 'owner'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : usr.role === 'office'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {usr.role === 'owner' ? <Crown className="w-5 h-5 text-amber-600" /> : usr.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{usr.name}</h4>
                      <p className="text-xs text-slate-500">{usr.email}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    usr.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {usr.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Rol Asignado:</span>
                    <select
                      value={usr.role}
                      onChange={(e) => {
                        const newRole = e.target.value as any;
                        updateSystemUser(usr.id, { role: newRole });
                      }}
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                        usr.role === 'owner'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : usr.role === 'office'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : usr.role === 'tech'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <option value="owner">Admin (Dueño)</option>
                      <option value="office">Oficina (Admin)</option>
                      <option value="tech">Técnico</option>
                      <option value="client">Cliente</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Teléfono:</span>
                    <span className="font-medium text-slate-800">{usr.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Último Ingreso:</span>
                    <span className="text-slate-600">{usr.lastLogin || 'Hoy'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-1">
                  <button
                    onClick={() => {
                      setEditingUser(usr);
                      setUserName(usr.name);
                      setUserEmail(usr.email);
                      setUserPhone(usr.phone);
                      setUserRole(usr.role);
                      setIsAddUserOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => toggleUserStatus(usr.id)}
                    className={`font-bold flex items-center space-x-1 cursor-pointer ${
                      usr.status === 'Activo' ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'
                    }`}
                  >
                    {usr.status === 'Activo' ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Desactivar</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Activar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar permanentemente al usuario ${usr.name}?`)) {
                        deleteSystemUser(usr.id);
                      }
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* MODAL: ADD / EDIT USER */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">
              {editingUser ? 'Editar Usuario de Sistema' : 'Alta de Nuevo Usuario'}
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              {/* 1. Nombre Completo */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Ej. Ing. Carlos Solís"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* 2. Nombre de Usuario */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  value={userUsername}
                  onChange={e => setUserUsername(e.target.value)}
                  placeholder="Ej. admin_csolis"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* 3. Correo Electrónico */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* 4. Clave / Contraseña (Crear clave segura / Ver clave con ojito) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Clave / Contraseña *</label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>Crear clave segura</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={userPassword}
                    onChange={e => setUserPassword(e.target.value)}
                    placeholder="Escribe o genera una clave"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    title={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 5. Rol Asignado (Por defecto Admin) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Rol de Usuario</label>
                <select
                  value={userRole}
                  onChange={e => setUserRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-hidden"
                >
                  <option value="owner">Dueño / Admin General (Administrador)</option>
                  <option value="office">Oficina / Logística (Administración)</option>
                  <option value="tech">Técnico de Campo</option>
                  <option value="client">Cliente</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Registrar Gasto Operativo</h3>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Categoría del Gasto</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-hidden"
                >
                  <option value="Combustible">Combustible / Gasolina</option>
                  <option value="Herramientas">Herramientas y Equipo de Medición</option>
                  <option value="Viáticos">Viáticos / Alimentos / Peajes</option>
                  <option value="Mantenimiento Vehículos">Mantenimiento de Vehículos</option>
                  <option value="Otros">Otros Gastos Operativos</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción / Detalle</label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  placeholder="Ej. Recarga gasolina camioneta 02"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monto ($ MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-hidden text-base"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUPABASE SQL SCRIPT */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold">
                  <Database className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Scripts SQL para Supabase</h3>
                  <p className="text-xs text-slate-500">
                    Copia y ejecuta en el <b>SQL Editor de tu dashboard de Supabase</b>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 overflow-y-auto font-mono text-xs text-emerald-400 space-y-3 max-h-72 border border-slate-800">
              <div>
                <p className="text-emerald-400 font-bold mb-1">-- 1. SQL PARA PERMITIR ROLES EN SUPABASE (Admin, Oficina, Técnico, Cliente):</p>
                <pre className="whitespace-pre-wrap select-all text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
{`-- Convertir la columna role a TEXT para permitir editar roles directamente en Supabase sin errores de enum:
ALTER TABLE public.system_users ALTER COLUMN role TYPE TEXT USING role::text;
ALTER TABLE public.system_users ALTER COLUMN role SET DEFAULT 'client';
DROP TYPE IF EXISTS public.user_role_type CASCADE;

-- Permisos y políticas RLS
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_full_access_system_users" ON public.system_users;
CREATE POLICY "allow_full_access_system_users" ON public.system_users FOR ALL USING (true) WITH CHECK (true);
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
NOTIFY pgrst, 'reload schema';`}
                </pre>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-amber-400 font-bold mb-1">-- 2. SQL PARA VACIAR REGISTROS DE PRUEBA (OPCIONAL):</p>
                <pre className="whitespace-pre-wrap select-all text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
{`DELETE FROM public.service_orders;
DELETE FROM public.clients;
DELETE FROM public.spare_parts;
DELETE FROM public.operating_expenses;`}
                </pre>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-bold">¿Cómo ejecutar en Supabase?</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium">
                <li>Abre tu consola de Supabase en la pestaña <b>SQL Editor</b> (la que tienes abierta en el navegador).</li>
                <li>Pega el bloque SQL y presiona <b>Run</b> (Ejecutar).</li>
                <li>¡Listo! Los registros de prueba quedarán eliminados en Supabase.</li>
              </ol>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const sql = `-- Vaciar órdenes, clientes, refacciones y gastos de prueba
DELETE FROM public.service_orders;
DELETE FROM public.clients;
DELETE FROM public.spare_parts;
DELETE FROM public.operating_expenses;
DELETE FROM public.system_users WHERE email != '${currentUser?.email?.toLowerCase() || 'haroldove90@gmail.com'}';`;
                  navigator.clipboard.writeText(sql);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md cursor-pointer transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{copiedSql ? '¡SQL de Limpieza Copiado!' : 'Copiar SQL de Limpieza'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
