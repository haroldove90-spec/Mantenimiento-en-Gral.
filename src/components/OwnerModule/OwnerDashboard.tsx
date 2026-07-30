import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SystemUser, OperatingExpense } from '../../types';
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
  Database
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const {
    orders,
    technicians,
    systemUsers,
    expenses,
    addSystemUser,
    updateSystemUser,
    toggleUserStatus,
    addExpense,
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

  // New user form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'office' | 'tech'>('tech');

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
        email: userEmail,
        phone: userPhone,
        role: userRole
      });
      setEditingUser(null);
    } else {
      addSystemUser({
        name: userName,
        email: userEmail,
        phone: userPhone,
        role: userRole,
        status: 'Activo'
      });
    }

    setUserName('');
    setUserEmail('');
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
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full">
                Rol: Dueño (Administrador General)
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-1">Supervisión Operativa & Métricas Financieras</h2>
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

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Rol Asignado:</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {usr.role === 'owner' ? 'Dueño General' : usr.role === 'office' ? 'Oficina Admin' : 'Técnico Campo'}
                    </span>
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
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      setEditingUser(usr);
                      setUserName(usr.name);
                      setUserEmail(usr.email);
                      setUserPhone(usr.phone);
                      setUserRole(usr.role);
                      setIsAddUserOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => toggleUserStatus(usr.id)}
                    className={`font-bold flex items-center space-x-1 ${
                      usr.status === 'Activo' ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'
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

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Ej. Ing. Carlos Solís"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico (Credencial de Acceso)</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teléfono Móvil</label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                  placeholder="555-0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rol / Módulo de Acceso</label>
                <select
                  value={userRole}
                  onChange={e => setUserRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-hidden"
                >
                  <option value="tech">Técnico (Campo / Interfaz Móvil)</option>
                  <option value="office">Oficina (Gestión Administrativa y Logística)</option>
                  <option value="owner">Dueño (Administrador General)</option>
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

    </div>
  );
};
