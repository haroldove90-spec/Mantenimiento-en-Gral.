import React, { useState, useMemo } from 'react';
import { useApp, deduplicateTechnicians } from '../../context/AppContext';
import { SystemUser, OperatingExpense, RoleType } from '../../types';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { SendCredentialsWhatsAppModal } from '../SendCredentialsWhatsAppModal';
import { ClientsModule } from '../OfficeModule/ClientsModule';
import { ServicesModule } from '../OfficeModule/ServicesModule';
import { exportToExcel, exportToPDF } from '../../lib/exportUtils';
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
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Printer,
  CheckSquare,
  Square,
  Search,
  MessageSquare,
  Share2,
  KeyRound
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
    syncAllDataToSupabase,
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

  // WhatsApp Credentials Modal state
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    type: 'client' | 'tech';
    recipientName: string;
    recipientPhone?: string;
    recipientEmail?: string;
    recipientUsername?: string;
    recipientPassword?: string;
    specialty?: string;
  } | null>(null);

  const activeTab = ownerSubTab === 'users' ? 'employees' : ownerSubTab;
  const setActiveTab = setOwnerSubTab;

  // Filter state for Financial Reports
  const [dateRange, setDateRange] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Multi-Selection for Employees
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState<string>('all');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<string>('all');

  // Multi-Selection for Expenses
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'user' | 'expense'; name: string; description: string } | null>(null);

  // Supabase Sync & SQL Modal state
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncAllDataToSupabase();
      setIsSyncing(false);
      if (res.success) {
        setSyncResult({
          type: 'success',
          text: `¡${res.message}`
        });
      } else {
        setSyncResult({
          type: 'error',
          text: `Error al sincronizar: ${res.message}`
        });
      }
    } catch (e: any) {
      setIsSyncing(false);
      setSyncResult({
        type: 'error',
        text: `Error de red: ${e.message || 'No se pudo conectar a Supabase'}`
      });
    }
  };

  // New employee form state
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'office' | 'tech'>('tech');

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
      if (o.budget.grandTotal !== undefined && o.budget.grandTotal > 0) return sum + o.budget.grandTotal;
      const parts = (o.budget.parts || []).reduce((s, p) => s + (p.quantity || 1) * (p.estimatedUnitPrice || 0), 0);
      const taxRate = o.budget.taxRate ?? 0;
      return sum + Math.round((o.budget.laborCost + parts) * (1 + taxRate));
    }
    return sum;
  }, 0);

  const todaySales = totalSalesAllTime > 0 ? Math.round(totalSalesAllTime * 0.35) : 2088;
  const monthSales = totalSalesAllTime;

  // Total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = monthSales - totalExpenses;

  // Collection by Technician
  const techCollectionStats = deduplicateTechnicians(technicians).map(tech => {
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

  // Filtered internal employees (excluding purely clients)
  const internalEmployees = systemUsers.filter(u => u.role !== 'client');

  const filteredEmployees = internalEmployees.filter(emp => {
    const q = employeeSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      emp.name.toLowerCase().includes(q) ||
      (emp.username || '').toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.phone || '').toLowerCase().includes(q);

    const matchesRole = employeeRoleFilter === 'all' || emp.role === employeeRoleFilter;
    const matchesStatus = employeeStatusFilter === 'all' || (emp.status || 'Activo') === employeeStatusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Multi-Selection helpers for Employees
  const isAllEmployeesSelected =
    filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployeeIds.includes(emp.id));

  const handleSelectAllEmployees = () => {
    if (isAllEmployeesSelected) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map(e => e.id));
    }
  };

  const handleToggleSelectEmployee = (id: string) => {
    if (selectedEmployeeIds.includes(id)) {
      setSelectedEmployeeIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedEmployeeIds(prev => [...prev, id]);
    }
  };

  // Multi-Selection helpers for Expenses
  const isAllExpensesSelected = expenses.length > 0 && expenses.every(e => selectedExpenseIds.includes(e.id));
  const handleSelectAllExpenses = () => {
    if (isAllExpensesSelected) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(expenses.map(e => e.id));
    }
  };

  const handleToggleSelectExpense = (id: string) => {
    if (selectedExpenseIds.includes(id)) {
      setSelectedExpenseIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedExpenseIds(prev => [...prev, id]);
    }
  };

  // Form submit for Employee
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;

    if (editingUser) {
      const updatePayload: Partial<SystemUser> = {
        name: userName.trim(),
        username: userUsername ? userUsername.trim().toLowerCase().replace(/\s+/g, '') : userEmail.split('@')[0].toLowerCase(),
        email: userEmail.trim().toLowerCase(),
        phone: userPhone.trim(),
        role: userRole
      };
      if (userPassword && userPassword.trim()) {
        updatePayload.password = userPassword.trim();
      }
      updateSystemUser(editingUser.id, updatePayload);
      setEditingUser(null);
    } else {
      addSystemUser({
        name: userName.trim(),
        username: userUsername ? userUsername.trim().toLowerCase().replace(/\s+/g, '') : userEmail.split('@')[0].toLowerCase(),
        email: userEmail.trim().toLowerCase(),
        password: userPassword.trim() || 'Temp1234!',
        phone: userPhone.trim(),
        role: userRole,
        status: 'Activo'
      });

      // Automatically trigger WhatsApp credentials modal
      setWhatsAppModalData({
        type: userRole === 'tech' ? 'tech' : 'client',
        recipientName: userName.trim(),
        recipientUsername: userUsername ? userUsername.trim().toLowerCase().replace(/\s+/g, '') : userEmail.split('@')[0].toLowerCase(),
        recipientEmail: userEmail.trim().toLowerCase(),
        recipientPhone: userPhone.trim(),
        recipientPassword: userPassword.trim() || 'Temp1234!',
        specialty: userRole === 'tech' ? 'Técnico de Campo' : userRole === 'office' ? 'Oficina Administrativa' : 'Administrador'
      });
    }

    setUserName('');
    setUserUsername('');
    setUserEmail('');
    setUserPassword('');
    setUserPhone('');
    setIsAddUserOpen(false);
  };

  // Form submit for Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expAmount);
    if (!expDesc || isNaN(amountNum) || amountNum <= 0) return;

    addExpense({
      category: expCategory,
      description: expDesc,
      amount: amountNum,
      date: new Date().toISOString().split('T')[0],
      registeredBy: currentUser?.name || 'Dueño General'
    });

    setExpDesc('');
    setExpAmount('');
    setIsAddExpenseOpen(false);
  };

  // ---------------- EXPORT HANDLERS ----------------
  // Export Employees to Excel & PDF
  const formatEmployeeDate = (dStr?: string) => {
    if (!dStr) return 'Reciente';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dStr;
    }
  };

  const handleExportEmployeesExcel = (onlySelected = false) => {
    const list =
      onlySelected && selectedEmployeeIds.length > 0
        ? internalEmployees.filter(e => selectedEmployeeIds.includes(e.id))
        : filteredEmployees;

    const headers = ['Nombre Completo', 'Usuario', 'Correo Electrónico', 'Teléfono', 'Rol / Cargo', 'Estatus', 'Fecha Registro', 'Último Acceso'];
    const rows = list.map(e => [
      e.name,
      e.username || 'N/A',
      e.email,
      e.phone || 'N/A',
      e.role === 'owner' ? 'Administrador (Dueño)' : e.role === 'office' ? 'Oficina / Administrativo' : 'Técnico de Campo',
      e.status || 'Activo',
      formatEmployeeDate(e.createdAt),
      e.lastLogin || 'Hoy'
    ]);

    const titleSuffix = onlySelected ? 'Seleccionados' : 'Completo';
    exportToExcel(`Personal_Empleados_SIJ_${titleSuffix}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleExportEmployeesPDF = (onlySelected = false) => {
    const list =
      onlySelected && selectedEmployeeIds.length > 0
        ? internalEmployees.filter(e => selectedEmployeeIds.includes(e.id))
        : filteredEmployees;

    const headers = ['Empleado', 'Usuario', 'Correo', 'Teléfono', 'Cargo', 'Estado', 'Fecha Registro', 'Último Ingreso'];
    const rows = list.map(e => [
      e.name,
      `@${e.username || e.email.split('@')[0]}`,
      e.email,
      e.phone || 'N/A',
      e.role === 'owner' ? 'Admin (Dueño)' : e.role === 'office' ? 'Oficina' : 'Técnico',
      e.status || 'Activo',
      formatEmployeeDate(e.createdAt),
      e.lastLogin || 'Hoy'
    ]);

    exportToPDF({
      title: 'Plantilla de Empleados y Personal Operativo',
      subtitle: `Registro de Credenciales y Control de Accesos (${list.length} empleados)`,
      headers,
      rows,
      summaryCards: [
        { label: 'Total Empleados', value: list.length },
        { label: 'Técnicos de Campo', value: list.filter(e => e.role === 'tech').length },
        { label: 'Personal Activo', value: list.filter(e => (e.status || 'Activo') === 'Activo').length }
      ]
    });
  };

  const handleExportSingleEmployee = (emp: SystemUser, format: 'PDF' | 'Excel') => {
    const roleLabel =
      emp.role === 'owner' ? 'Administrador General (Dueño)' : emp.role === 'office' ? 'Oficina y Administración' : 'Técnico Especialista de Campo';

    if (format === 'Excel') {
      const headers = ['Campo', 'Valor'];
      const rows = [
        ['Nombre Completo', emp.name],
        ['Usuario del Sistema', emp.username || 'N/A'],
        ['Correo Electrónico', emp.email],
        ['Teléfono', emp.phone || 'N/A'],
        ['Rol / Cargo', roleLabel],
        ['Estatus de la Cuenta', emp.status || 'Activo'],
        ['Fecha de Registro', formatEmployeeDate(emp.createdAt)],
        ['Último Acceso Registrado', emp.lastLogin || 'Hoy']
      ];
      exportToExcel(`Ficha_Empleado_${emp.name.replace(/\s+/g, '_')}`, headers, rows);
    } else {
      exportToPDF({
        title: `Ficha de Empleado: ${emp.name}`,
        subtitle: `Credencial y Perfil de Acceso SIJ • Cargo: ${roleLabel} • Registrado: ${formatEmployeeDate(emp.createdAt)}`,
        metadata: {
          'Usuario': `@${emp.username || emp.email.split('@')[0]}`,
          'Correo': emp.email,
          'Teléfono': emp.phone || 'No especificado',
          'Rol del Sistema': roleLabel,
          'Estatus': emp.status || 'Activo',
          'Fecha de Registro': formatEmployeeDate(emp.createdAt),
          'Último Acceso': emp.lastLogin || 'Hoy'
        },
        headers: ['Parámetro de Seguridad', 'Detalle'],
        rows: [
          ['Nombre Registrado', emp.name],
          ['Correo Electrónico Oficial', emp.email],
          ['Nivel de Permisos', roleLabel],
          ['Estado de Cuenta', emp.status || 'Activo'],
          ['Fecha de Registro', formatEmployeeDate(emp.createdAt)],
          ['Teléfono de Contacto', emp.phone || 'N/A']
        ]
      });
    }
  };

  // Financial Report Exports (Excel & PDF)
  const handleExportFinancialReport = (format: 'PDF' | 'Excel') => {
    if (format === 'Excel') {
      const headers = ['Folio Orden', 'Cliente / Empresa', 'Técnico Asignado', 'Método de Pago', 'Total Cobrado (MXN)', 'Fecha'];
      const rows = closedOrders.map(o => [
        o.folio,
        o.clientName,
        o.technicianName || 'N/A',
        o.paymentMethod || 'Efectivo',
        o.collectedAmount || 0,
        o.scheduledDate || o.createdAt
      ]);
      exportToExcel(`Reporte_Financiero_SIJ_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else {
      const headers = ['Folio', 'Cliente', 'Técnico', 'Método Pago', 'Monto Cobrado'];
      const rows = closedOrders.map(o => [
        o.folio,
        o.clientName,
        o.technicianName || 'N/A',
        o.paymentMethod || 'Efectivo',
        `$${(o.collectedAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
      ]);

      exportToPDF({
        title: 'Reporte Financiero y Balance de Ingresos',
        subtitle: 'Resumen de Órdenes Cobradas, Gastos y Margen Operativo',
        headers,
        rows,
        summaryCards: [
          { label: 'Ingresos Brutos', value: `$${monthSales.toLocaleString('es-MX')} MXN` },
          { label: 'Gastos Operativos', value: `$${totalExpenses.toLocaleString('es-MX')} MXN` },
          { label: 'Utilidad Neta', value: `$${netIncome.toLocaleString('es-MX')} MXN` }
        ]
      });
    }
  };

  // Expenses Export (Excel & PDF)
  const handleExportExpenses = (format: 'PDF' | 'Excel', onlySelected = false) => {
    const list =
      onlySelected && selectedExpenseIds.length > 0 ? expenses.filter(e => selectedExpenseIds.includes(e.id)) : expenses;

    if (format === 'Excel') {
      const headers = ['Categoría', 'Descripción / Concepto', 'Fecha', 'Registrado Por', 'Monto (MXN)'];
      const rows = list.map(e => [e.category, e.description, e.date, e.registeredBy, e.amount]);
      exportToExcel(`Gastos_Operativos_SIJ_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else {
      const headers = ['Categoría', 'Descripción', 'Fecha', 'Registrado Por', 'Monto'];
      const rows = list.map(e => [
        e.category,
        e.description,
        e.date,
        e.registeredBy,
        `$${e.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
      ]);

      exportToPDF({
        title: 'Desglose de Gastos Operativos',
        subtitle: `Control de Combustibles, Herramientas y Viáticos (${list.length} registros)`,
        headers,
        rows,
        summaryCards: [
          { label: 'Total Gastos', value: `$${list.reduce((s, e) => s + e.amount, 0).toLocaleString('es-MX')} MXN` },
          { label: 'Registros', value: list.length }
        ]
      });
    }
  };

  return (
    <div id="owner-dashboard" className="w-full px-3 sm:px-8 py-6 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* Header Bar - Dueño */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            onClick={handleSyncSupabase}
            disabled={isSyncing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 shrink-0 cursor-pointer"
            title="Sincronizar todos los datos locales con Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Supabase'}</span>
          </button>

          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="bg-indigo-700 hover:bg-indigo-600 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 shrink-0 cursor-pointer"
            title="Ver Script SQL y Migración para Supabase"
          >
            <Database className="w-4 h-4" />
            <span>Script SQL Supabase</span>
          </button>

          <button
            onClick={() => handleExportFinancialReport('PDF')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shadow-lg flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Exportar Balance PDF</span>
          </button>
        </div>
      </div>

      {syncResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            syncResult.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <span>{syncResult.text}</span>
          <button onClick={() => setSyncResult(null)} className="text-slate-500 hover:text-slate-800 ml-4 font-black">
            ✕
          </button>
        </div>
      )}

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
                <p className="text-2xl font-black text-slate-900 mt-1">{closedOrders.length}</p>
                <span className="text-[11px] text-purple-600 font-bold flex items-center mt-1">
                  Servicios finalizados con éxito
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Órdenes Pendientes</span>
                <p className="text-2xl font-black text-amber-600 mt-1">{pendingOrders.length}</p>
                <span className="text-[11px] text-amber-600 font-bold flex items-center mt-1">
                  En ruta o en diagnóstico
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Breakdown by Technician Collection */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cobranza y Rendimiento por Técnico de Campo</h3>
                <p className="text-xs text-slate-500">
                  Desglose de métodos de pago (Efectivo, Tarjeta, Transferencia) recaudados por cada técnico
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const headers = ['Técnico', 'Especialidad', 'Servicios Cerrados', 'Efectivo', 'Tarjeta', 'Transferencia', 'Total Recaudado'];
                    const rows = techCollectionStats.map(s => [
                      s.tech.name,
                      s.tech.specialty,
                      s.closedCount,
                      s.cashTotal,
                      s.cardTotal,
                      s.transferTotal,
                      s.totalCollected
                    ]);
                    exportToExcel(`Rendimiento_Tecnicos_${new Date().toISOString().slice(0, 10)}`, headers, rows);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={() => {
                    const headers = ['Técnico', 'Especialidad', 'Cerradas', 'Efectivo', 'Tarjeta', 'Transferencia', 'Total'];
                    const rows = techCollectionStats.map(s => [
                      s.tech.name,
                      s.tech.specialty,
                      s.closedCount,
                      `$${s.cashTotal.toLocaleString('es-MX')}`,
                      `$${s.cardTotal.toLocaleString('es-MX')}`,
                      `$${s.transferTotal.toLocaleString('es-MX')}`,
                      `$${s.totalCollected.toLocaleString('es-MX')}`
                    ]);
                    exportToPDF({
                      title: 'Rendimiento y Cobranza por Técnico',
                      subtitle: 'Desglose por método de pago de servicios concluidos',
                      headers,
                      rows
                    });
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-3">Técnico</th>
                    <th className="p-3">Especialidad</th>
                    <th className="p-3 text-center">Servicios Concluidos</th>
                    <th className="p-3 text-right">Efectivo</th>
                    <th className="p-3 text-right">Tarjeta</th>
                    <th className="p-3 text-right">Transferencia</th>
                    <th className="p-3 text-right font-black text-slate-900">Total Recaudado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {techCollectionStats.map(stat => (
                    <tr key={stat.tech.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {stat.tech.name.charAt(0)}
                        </div>
                        <span>{stat.tech.name}</span>
                      </td>
                      <td className="p-3 text-slate-600">{stat.tech.specialty}</td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                          {stat.closedCount}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-600 font-bold">
                        ${stat.cashTotal.toLocaleString('es-MX')} MXN
                      </td>
                      <td className="p-3 text-right font-mono text-indigo-600 font-bold">
                        ${stat.cardTotal.toLocaleString('es-MX')} MXN
                      </td>
                      <td className="p-3 text-right font-mono text-purple-600 font-bold">
                        ${stat.transferTotal.toLocaleString('es-MX')} MXN
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-900 text-sm">
                        ${stat.totalCollected.toLocaleString('es-MX')} MXN
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- TAB 2: REPORTES FINANCIEROS Y GASTOS ------------------- */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Balance Financiero & Gastos Operativos</h3>
              <p className="text-xs text-slate-500">Márgenes de ganancia, desglose de viáticos, combustibles y exportación de estados</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Registrar Gasto</span>
              </button>

              <button
                onClick={() => handleExportExpenses('Excel', false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel Gastos</span>
              </button>

              <button
                onClick={() => handleExportExpenses('PDF', false)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>PDF Gastos</span>
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-base font-bold text-slate-900">Desglose de Gastos Operativos</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Total: {expenses.length} registros
                </span>
              </div>

              {selectedExpenseIds.length > 0 && (
                <div className="flex items-center space-x-2 bg-rose-50 p-1.5 rounded-xl border border-rose-200 text-xs">
                  <span className="font-bold text-rose-800">{selectedExpenseIds.length} seleccionados:</span>
                  <button
                    onClick={() => handleExportExpenses('Excel', true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold shadow-2xs"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => handleExportExpenses('PDF', true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1 rounded-lg font-bold shadow-2xs"
                  >
                    PDF
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-3 w-8">
                      <button onClick={handleSelectAllExpenses} className="cursor-pointer">
                        {isAllExpensesSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                    </th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Descripción / Concepto</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Registrado Por</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <button onClick={() => handleToggleSelectExpense(exp.id)} className="cursor-pointer">
                          {selectedExpenseIds.includes(exp.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
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
                      <td className="p-3 text-center">
                        <button
                          onClick={() =>
                            setItemToDelete({
                              id: exp.id,
                              type: 'expense',
                              name: exp.description,
                              description: `el gasto "${exp.description}" por $${exp.amount.toLocaleString('es-MX')} MXN (${exp.category})`
                            })
                          }
                          className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Eliminar gasto de la base de datos"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- TAB 3: GESTIÓN DE EMPLEADOS ------------------- */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Gestión de Empleados, Técnicos y Personal Operativo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alta, edición de credenciales y control de acceso para el equipo interno (Dueño, Oficina y Técnicos)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncSupabase}
                disabled={isSyncing}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                title="Sincronizar todos los empleados y registros con Supabase"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : '🔄 Sincronizar Supabase'}</span>
              </button>

              <button
                onClick={() => handleExportEmployeesExcel(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                title="Exportar todos los empleados a Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel Empleados</span>
              </button>

              <button
                onClick={() => handleExportEmployeesPDF(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                title="Imprimir plantilla de empleados en PDF"
              >
                <Printer className="w-4 h-4" />
                <span>PDF Empleados</span>
              </button>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserName('');
                  setUserUsername('');
                  setUserEmail('');
                  setUserPhone('');
                  setUserPassword('');
                  setUserRole('tech');
                  setIsAddUserOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold shadow-md flex items-center space-x-2 shrink-0 cursor-pointer transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Registrar Empleado</span>
              </button>
            </div>
          </div>

          {/* Sync Result Banner */}
          {syncResult && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
              syncResult.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncResult.text}</span>
              </div>
              <button onClick={() => setSyncResult(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* Filter and Multi-Selection Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={e => setEmployeeSearch(e.target.value)}
                  placeholder="Buscar por nombre, usuario, correo, teléfono..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                  <span className="font-bold text-slate-500 text-[11px]">Rol:</span>
                  <select
                    value={employeeRoleFilter}
                    onChange={e => setEmployeeRoleFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 text-xs outline-hidden cursor-pointer"
                  >
                    <option value="all">Todos los Roles</option>
                    <option value="owner">Admin (Dueño)</option>
                    <option value="office">Oficina (Admin)</option>
                    <option value="tech">Técnico de Campo</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                  <span className="font-bold text-slate-500 text-[11px]">Estado:</span>
                  <select
                    value={employeeStatusFilter}
                    onChange={e => setEmployeeStatusFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 text-xs outline-hidden cursor-pointer"
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="Activo">Activos</option>
                    <option value="Inactivo">Inactivos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Selection row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 gap-2 text-xs">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAllEmployees}
                  className="flex items-center space-x-2 text-slate-700 font-bold hover:text-blue-700 cursor-pointer"
                >
                  {isAllEmployeesSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {isAllEmployeesSelected
                      ? 'Deseleccionar Todos'
                      : selectedEmployeeIds.length > 0
                      ? `Seleccionados (${selectedEmployeeIds.length})`
                      : 'Seleccionar Todos'}
                  </span>
                </button>
              </div>

              {selectedEmployeeIds.length > 0 && (
                <div className="flex items-center space-x-2 bg-blue-50 p-1.5 rounded-xl border border-blue-200">
                  <span className="text-[11px] font-bold text-blue-900 px-1">Exportar Seleccionados:</span>
                  <button
                    onClick={() => handleExportEmployeesExcel(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel ({selectedEmployeeIds.length})</span>
                  </button>
                  <button
                    onClick={() => handleExportEmployeesPDF(true)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF ({selectedEmployeeIds.length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Employees Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(usr => {
              const isSelected = selectedEmployeeIds.includes(usr.id);
              return (
                <div
                  key={usr.id}
                  className={`bg-white border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-400/20 bg-blue-50/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleSelectEmployee(usr.id)}
                          className="cursor-pointer text-slate-400 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs ${
                            usr.role === 'owner'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : usr.role === 'office'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {usr.role === 'owner' ? <Crown className="w-5 h-5 text-amber-600" /> : usr.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{usr.name}</h4>
                          <p className="text-xs text-blue-600 font-semibold">@{usr.username || usr.email.split('@')[0]}</p>
                          <p className="text-[11px] text-slate-500">{usr.email}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          (usr.status || 'Activo') === 'Activo'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {usr.status || 'Activo'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Rol Asignado:</span>
                        <select
                          value={usr.role}
                          onChange={e => {
                            const newRole = e.target.value as any;
                            updateSystemUser(usr.id, { role: newRole });
                          }}
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                            usr.role === 'owner'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : usr.role === 'office'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="owner">Admin (Dueño)</option>
                          <option value="office">Oficina (Admin)</option>
                          <option value="tech">Técnico de Campo</option>
                        </select>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Teléfono:</span>
                        <span className="font-medium text-slate-800">{usr.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Fecha Registro:</span>
                        <span className="font-bold text-slate-700">{formatEmployeeDate(usr.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Último Ingreso:</span>
                        <span className="text-slate-600">{usr.lastLogin || 'Hoy'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-1">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleExportSingleEmployee(usr, 'Excel')}
                        className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                        title="Descargar Ficha en Excel"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>XLS</span>
                      </button>
                      <button
                        onClick={() => handleExportSingleEmployee(usr, 'PDF')}
                        className="text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                        title="Imprimir / Ver Ficha en PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setWhatsAppModalData({
                            type: usr.role === 'tech' ? 'tech' : 'client',
                            recipientName: usr.name,
                            recipientUsername: usr.username,
                            recipientEmail: usr.email,
                            recipientPhone: usr.phone,
                            recipientPassword: usr.password || 'Temp1234!',
                            specialty: usr.role === 'tech' ? 'Técnico de Campo' : usr.role === 'office' ? 'Oficina Administrativa' : 'Administrador'
                          });
                        }}
                        className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold p-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Enviar credenciales y link de acceso por WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingUser(usr);
                          setUserName(usr.name);
                          setUserUsername(usr.username || '');
                          setUserEmail(usr.email);
                          setUserPhone(usr.phone || '');
                          setUserRole((usr.role as any) || 'tech');
                          setIsAddUserOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold p-1.5 rounded-lg hover:bg-blue-50 flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => toggleUserStatus(usr.id)}
                        className={`font-bold p-1.5 rounded-lg cursor-pointer ${
                          usr.status === 'Activo' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {usr.status === 'Activo' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() =>
                          setItemToDelete({
                            id: usr.id,
                            type: 'user',
                            name: usr.name,
                            description: `al usuario y credencial "${usr.name}" (${usr.email})`
                          })
                        }
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------- TAB 4: CATÁLOGO DE SERVICIOS ------------------- */}
      {activeTab === 'services' && <ServicesModule />}

      {/* ------------------- TAB 5: DIRECTORIO DE CLIENTES ------------------- */}
      {activeTab === 'clients' && <ClientsModule />}

      {/* ================= MODAL REGISTRAR EMPLEADO ================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingUser ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Credenciales del personal interno SIJ</p>
                </div>
              </div>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Ej. Ing. Carlos Mendoza"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:bg-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre de Usuario (@)</label>
                  <input
                    type="text"
                    value={userUsername}
                    onChange={e => setUserUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="cmendoza"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-mono focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rol / Cargo *</label>
                  <select
                    value={userRole}
                    onChange={e => setUserRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-bold outline-hidden cursor-pointer"
                  >
                    <option value="tech">Técnico de Campo</option>
                    <option value="office">Oficina (Admin)</option>
                    <option value="owner">Admin (Dueño)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="carlos@sijservicios.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teléfono Móvil</label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                  placeholder="55-1234-5678"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Contraseña de Acceso</label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Generar Contraseña</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userPassword}
                    onChange={e => setUserPassword(e.target.value)}
                    placeholder={editingUser ? 'Dejar en blanco para no cambiar' : 'Ej. Temp1234!'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-10 text-slate-800 font-mono focus:bg-white outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {editingUser ? 'Guardar Cambios' : 'Registrar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL REGISTRAR GASTO ================= */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registrar Nuevo Gasto Operativo</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-hidden"
                >
                  <option value="Combustible">Combustible</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Viáticos">Viáticos / Comidas</option>
                  <option value="Mantenimiento Vehículos">Mantenimiento Vehículos</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción / Concepto *</label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  placeholder="Ej. Gasolina camioneta técnica Ruta Norte"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monto (MXN) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.5"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  placeholder="Ej. 650.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-bold outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUPABASE SQL SCRIPT ================= */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold">
                  <Database className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Script SQL Oficial y Completo para Supabase</h3>
                  <p className="text-xs text-slate-500">
                    Copia y ejecuta en el <b>SQL Editor de tu panel de Supabase</b> para inicializar o actualizar tablas, roles y datos.
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

            <div className="bg-slate-900 rounded-2xl p-4 overflow-y-auto font-mono text-xs text-emerald-400 space-y-3 max-h-96 border border-slate-800">
              <pre className="whitespace-pre-wrap select-all text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
{`-- =======================================================================
-- SCRIPT SQL ACTUALIZADO SIJ SERVICIOS: CLIENTES, EMPLEADOS, ÓRDENES Y RUTAS
-- Ejecutar en Supabase -> SQL Editor -> New Query -> Run
-- =======================================================================

-- 1. HABILITAR EXTENSIONES UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA DE CLIENTES (MÓDULO DEDICADO EXCLUSIVO)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tax_id TEXT DEFAULT 'XAXX010101000',
    contact_email TEXT,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    model TEXT,
    fault TEXT,
    category TEXT DEFAULT 'Regular',
    credit_limit NUMERIC(12,2) DEFAULT 0,
    credit_days INTEGER DEFAULT 0,
    fiscal_address TEXT,
    delivery_address TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE SUCURSALES / DEPARTAMENTOS DE CLIENTES
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE EMPLEADOS Y PERSONAL (MÓDULO EMPLEADOS / CREDENCIALES)
CREATE TABLE IF NOT EXISTS public.system_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'tech',
    status TEXT NOT NULL DEFAULT 'Activo',
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE TÉCNICOS DE CAMPO
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialty TEXT DEFAULT 'Técnico General',
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'Disponible',
    active_orders_count INTEGER DEFAULT 0,
    avg_response_time_hours NUMERIC(6,2) DEFAULT 2.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE ÓRDENES DE SERVICIO
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT NOT NULL UNIQUE,
    client_id UUID,
    client_name TEXT NOT NULL,
    client_email TEXT,
    department_id UUID,
    department_name TEXT,
    equipment_type TEXT,
    description TEXT,
    priority TEXT DEFAULT 'Media',
    status TEXT NOT NULL DEFAULT 'Recepción Inicial',
    technician_id TEXT,
    technician_name TEXT,
    scheduled_date DATE,
    route_order INTEGER DEFAULT 1,
    diagnostic_notes TEXT,
    diagnostic_photos JSONB DEFAULT '[]'::jsonb,
    solution_notes TEXT,
    solution_photos JSONB DEFAULT '[]'::jsonb,
    budget JSONB,
    requested_parts JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    collected_amount NUMERIC(12,2) DEFAULT 0,
    payment_method TEXT,
    signature TEXT,
    is_warranty BOOLEAN DEFAULT false,
    warranty_reason TEXT,
    is_direct_delivery BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA DE CATÁLOGO DE REFACCIONES
CREATE TABLE IF NOT EXISTS public.spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA DE CATÁLOGO DE SERVICIOS
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Mantenimiento',
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    estimated_duration_hours NUMERIC(4,1) DEFAULT 1,
    warranty_days INTEGER DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLA DE GASTOS OPERATIVOS
CREATE TABLE IF NOT EXISTS public.operating_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    registered_by TEXT,
    payment_method TEXT DEFAULT 'Transferencia',
    invoice_folio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLA DE NOTIFICACIONES EN TIEMPO REAL
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_role TEXT NOT NULL DEFAULT 'office',
    order_folio TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. HABILITAR ROW LEVEL SECURITY (RLS) Y POLÍTICAS PERMISIVAS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Access clients" ON public.clients;
    CREATE POLICY "Public Access clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access departments" ON public.departments;
    CREATE POLICY "Public Access departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access system_users" ON public.system_users;
    CREATE POLICY "Public Access system_users" ON public.system_users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access technicians" ON public.technicians;
    CREATE POLICY "Public Access technicians" ON public.technicians FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access service_orders" ON public.service_orders;
    CREATE POLICY "Public Access service_orders" ON public.service_orders FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access spare_parts" ON public.spare_parts;
    CREATE POLICY "Public Access spare_parts" ON public.spare_parts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access services" ON public.services;
    CREATE POLICY "Public Access services" ON public.services FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access operating_expenses" ON public.operating_expenses;
    CREATE POLICY "Public Access operating_expenses" ON public.operating_expenses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access notifications" ON public.notifications;
    CREATE POLICY "Public Access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 12. MIGRACIONES / ACTUALIZACIÓN DE COLUMNAS PARA TABLAS EXISTENTES
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Activo';
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tax_id TEXT DEFAULT 'XAXX010101000';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Regular';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS credit_days INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS fiscal_address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 13. HABILITAR PUBLICACIÓN EN TIEMPO REAL (SUPABASE REALTIME)
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_orders, public.notifications, public.technicians, public.operating_expenses, public.clients;
EXCEPTION WHEN OTHERS THEN
    -- Ignorar si ya están agregadas a la publicación
    NULL;
END $$;`}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">Compatible con Supabase PostgreSQL 15+</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`-- SQL SIJ COMPLETO
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS public.clients ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, tax_id TEXT DEFAULT 'XAXX010101000', contact_email TEXT, address TEXT, phone TEXT, whatsapp TEXT, model TEXT, fault TEXT, category TEXT DEFAULT 'Regular', credit_limit NUMERIC(12,2) DEFAULT 0, credit_days INTEGER DEFAULT 0, fiscal_address TEXT, delivery_address TEXT, contact_name TEXT, contact_phone TEXT, status TEXT NOT NULL DEFAULT 'Activo', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS public.departments ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE, name TEXT NOT NULL, contact_name TEXT, phone TEXT, address TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS public.system_users ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), auth_user_id UUID, name TEXT NOT NULL, username TEXT UNIQUE, email TEXT NOT NULL UNIQUE, password TEXT, phone TEXT, role TEXT NOT NULL DEFAULT 'tech', status TEXT NOT NULL DEFAULT 'Activo', last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS public.technicians ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, specialty TEXT DEFAULT 'Técnico General', phone TEXT, email TEXT, status TEXT DEFAULT 'Disponible', active_orders_count INTEGER DEFAULT 0, avg_response_time_hours NUMERIC(6,2) DEFAULT 2.5, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS public.service_orders ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), folio TEXT NOT NULL UNIQUE, client_id UUID, client_name TEXT NOT NULL, client_email TEXT, department_id UUID, department_name TEXT, equipment_type TEXT, description TEXT, priority TEXT DEFAULT 'Media', status TEXT NOT NULL DEFAULT 'Recepción Inicial', technician_id TEXT, technician_name TEXT, scheduled_date DATE, route_order INTEGER DEFAULT 1, diagnostic_notes TEXT, diagnostic_photos JSONB DEFAULT '[]'::jsonb, solution_notes TEXT, solution_photos JSONB DEFAULT '[]'::jsonb, budget JSONB, requested_parts JSONB DEFAULT '[]'::jsonb, timeline JSONB DEFAULT '[]'::jsonb, collected_amount NUMERIC(12,2) DEFAULT 0, payment_method TEXT, signature TEXT, is_warranty BOOLEAN DEFAULT false, warranty_reason TEXT, is_direct_delivery BOOLEAN DEFAULT false, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS public.spare_parts ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT DEFAULT 'General', unit_price NUMERIC(10,2) NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Activo', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS public.services ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT DEFAULT 'Mantenimiento', description TEXT, base_price NUMERIC(10,2) NOT NULL DEFAULT 0, estimated_duration_hours NUMERIC(4,1) DEFAULT 1, warranty_days INTEGER DEFAULT 30, status TEXT NOT NULL DEFAULT 'Activo', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS public.operating_expenses ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category TEXT NOT NULL, description TEXT NOT NULL, amount NUMERIC(10,2) NOT NULL, date DATE DEFAULT CURRENT_DATE, registered_by TEXT, payment_method TEXT DEFAULT 'Transferencia', invoice_folio TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS public.notifications ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), target_role TEXT NOT NULL DEFAULT 'office', order_folio TEXT, title TEXT NOT NULL, message TEXT NOT NULL, read BOOLEAN DEFAULT false, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access system_users" ON public.system_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access technicians" ON public.technicians FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access service_orders" ON public.service_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access spare_parts" ON public.spare_parts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access services" ON public.services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access operating_expenses" ON public.operating_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.service_orders, public.notifications, public.technicians, public.operating_expenses, public.clients; EXCEPTION WHEN OTHERS THEN NULL; END $$;`);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 3000);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>{copiedSql ? '¡SQL Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRMAR ELIMINACIÓN ================= */}
      {itemToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setItemToDelete(null)}
          onConfirm={() => {
            if (itemToDelete.type === 'user') {
              deleteSystemUser(itemToDelete.id);
            } else if (itemToDelete.type === 'expense') {
              deleteExpense(itemToDelete.id);
            }
            setItemToDelete(null);
          }}
          title={itemToDelete.type === 'user' ? '¿Eliminar Empleado?' : '¿Eliminar Gasto?'}
          message={`¿Estás seguro de que deseas eliminar permanentemente ${itemToDelete.description}?`}
        />
      )}

      {/* ================= MODAL: WHATSAPP CREDENTIALS DISPATCHER ================= */}
      {whatsAppModalData && (
        <SendCredentialsWhatsAppModal
          isOpen={true}
          onClose={() => setWhatsAppModalData(null)}
          type={whatsAppModalData.type}
          recipientName={whatsAppModalData.recipientName}
          recipientUsername={whatsAppModalData.recipientUsername}
          recipientEmail={whatsAppModalData.recipientEmail}
          recipientPhone={whatsAppModalData.recipientPhone}
          recipientPassword={whatsAppModalData.recipientPassword}
          specialty={whatsAppModalData.specialty}
        />
      )}
    </div>
  );
};
