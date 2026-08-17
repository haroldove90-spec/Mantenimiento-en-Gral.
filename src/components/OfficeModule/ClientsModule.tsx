import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, Department } from '../../types';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { exportToExcel, exportToPDF } from '../../lib/exportUtils';
import {
  Users,
  Building2,
  Plus,
  Search,
  Download,
  FileSpreadsheet,
  Printer,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Tag,
  ShieldCheck,
  CheckSquare,
  Square,
  Filter,
  Eye,
  CreditCard,
  Layers,
  Sparkles,
  RotateCcw,
  Calendar
} from 'lucide-react';

export const ClientsModule: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, toggleClientStatus } = useApp();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Multi-Selection State
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; description: string } | null>(null);

  // Client Modal (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [fiscalAddress, setFiscalAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [model, setModel] = useState('');
  const [fault, setFault] = useState('');
  const [category, setCategory] = useState<'VIP' | 'Regular' | 'Corporativo' | 'Residencial'>('Regular');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [creditDays, setCreditDays] = useState<number>(0);

  // Branches / Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [depName, setDepName] = useState('');
  const [depContact, setDepContact] = useState('');
  const [depPhone, setDepPhone] = useState('');
  const [depAddress, setDepAddress] = useState('');

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Filter Logic
  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.taxId.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || (c.status || 'Activo') === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Multi-Selection helpers
  const isAllSelected = filteredClients.length > 0 && filteredClients.every(c => selectedClientIds.includes(c.id));
  const isSomeSelected = selectedClientIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map(c => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedClientIds.includes(id)) {
      setSelectedClientIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedClientIds(prev => [...prev, id]);
    }
  };

  // Open Modal for Create or Edit
  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setName(client.name);
      setTaxId(client.taxId || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setWhatsapp(client.whatsapp || client.phone || '');
      setAddress(client.address || '');
      setFiscalAddress(client.fiscalAddress || client.address || '');
      setDeliveryAddress(client.deliveryAddress || client.address || '');
      setModel(client.model || '');
      setFault(client.fault || '');
      setCategory(client.category || 'Regular');
      setCreditLimit(client.creditLimit || 0);
      setCreditDays(client.creditDays || 0);
      setDepartments(client.departments || []);
    } else {
      setEditingClient(null);
      setName('');
      setTaxId('XAXX010101000');
      setEmail('');
      setPhone('');
      setWhatsapp('');
      setAddress('');
      setFiscalAddress('');
      setDeliveryAddress('');
      setModel('');
      setFault('');
      setCategory('Regular');
      setCreditLimit(0);
      setCreditDays(0);
      setDepartments([
        {
          id: `dep-${Date.now()}-1`,
          name: 'Matriz Principal',
          contactName: '',
          phone: '',
          address: ''
        }
      ]);
    }
    setIsModalOpen(true);
  };

  const handleAddDepartment = () => {
    if (!depName.trim()) return;
    setDepartments([
      ...departments,
      {
        id: `dep-${Date.now()}-${Math.random()}`,
        name: depName.trim(),
        contactName: depContact.trim() || name.trim(),
        phone: depPhone.trim() || phone.trim(),
        address: depAddress.trim() || address.trim()
      }
    ]);
    setDepName('');
    setDepContact('');
    setDepPhone('');
    setDepAddress('');
  };

  const handleRemoveDepartment = (depId: string) => {
    setDepartments(departments.filter(d => d.id !== depId));
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showFeedback('error', 'El nombre o razón social del cliente es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalDepartments =
        departments.length > 0
          ? departments
          : [
              {
                id: `dep-${Date.now()}-1`,
                name: 'Matriz Principal',
                contactName: name.trim(),
                phone: phone.trim() || 'S/N',
                address: address.trim() || 'Dirección no especificada'
              }
            ];

      if (editingClient) {
        await updateClient(editingClient.id, {
          name: name.trim(),
          taxId: taxId.trim() || 'XAXX010101000',
          email: email.trim() || 'contacto@cliente.com',
          phone: phone.trim() || 'S/N',
          whatsapp: whatsapp.trim() || phone.trim() || 'S/N',
          address: address.trim() || 'Dirección no especificada',
          fiscalAddress: fiscalAddress.trim() || address.trim(),
          deliveryAddress: deliveryAddress.trim() || address.trim(),
          model: model.trim(),
          fault: fault.trim(),
          category,
          creditLimit: Number(creditLimit) || 0,
          creditDays: Number(creditDays) || 0,
          departments: finalDepartments
        });
        showFeedback('success', `¡Cliente "${name.trim()}" actualizado correctamente!`);
      } else {
        await addClient({
          name: name.trim(),
          taxId: taxId.trim() || 'XAXX010101000',
          email: email.trim() || 'contacto@cliente.com',
          phone: phone.trim() || 'S/N',
          whatsapp: whatsapp.trim() || phone.trim() || 'S/N',
          address: address.trim() || 'Dirección no especificada',
          fiscalAddress: fiscalAddress.trim() || address.trim(),
          deliveryAddress: deliveryAddress.trim() || address.trim(),
          model: model.trim(),
          fault: fault.trim(),
          category,
          status: 'Activo',
          creditLimit: Number(creditLimit) || 0,
          creditDays: Number(creditDays) || 0,
          departments: finalDepartments
        });
        showFeedback('success', `¡Cliente "${name.trim()}" registrado y sincronizado con éxito!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error guardando cliente:', err);
      showFeedback('error', 'Ocurrió un error al guardar en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- EXPORT HANDLERS ----------------
  const getTargetClients = (onlySelected = false): Client[] => {
    if (onlySelected && selectedClientIds.length > 0) {
      return clients.filter(c => selectedClientIds.includes(c.id));
    }
    return filteredClients;
  };

  const formatDisplayDate = (dStr?: string) => {
    if (!dStr) return 'Registro inicial';
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

  const handleExportExcel = (onlySelected = false) => {
    const list = getTargetClients(onlySelected);
    const headers = [
      'Nombre / Razón Social',
      'RFC / Identificador',
      'Correo Electrónico',
      'Teléfono',
      'WhatsApp',
      'Categoría',
      'Estado',
      'Fecha Registro',
      'Dirección Fiscal / Ubicación',
      'Límite de Crédito (MXN)',
      'Días Crédito',
      'Equipo Frecuente / Modelo',
      'Sucursales / Departamentos'
    ];

    const rows = list.map(c => [
      c.name,
      c.taxId || 'XAXX010101000',
      c.email || 'N/A',
      c.phone || 'N/A',
      c.whatsapp || 'N/A',
      c.category || 'Regular',
      c.status || 'Activo',
      formatDisplayDate(c.createdAt),
      c.address || 'N/A',
      c.creditLimit || 0,
      c.creditDays || 0,
      c.model || 'N/A',
      (c.departments || []).map(d => d.name).join('; ')
    ]);

    const titleSuffix = onlySelected ? 'Seleccionados' : 'Completo';
    exportToExcel(`Directorio_Clientes_SIJ_${titleSuffix}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleExportPDF = (onlySelected = false) => {
    const list = getTargetClients(onlySelected);
    const headers = ['Cliente / Empresa', 'RFC', 'Contacto / Teléfono', 'Correo', 'Categoría', 'Estado', 'Fecha Registro', 'Sucursales'];
    const rows = list.map(c => [
      c.name,
      c.taxId || 'N/A',
      c.phone || c.whatsapp || 'N/A',
      c.email || 'N/A',
      c.category || 'Regular',
      c.status || 'Activo',
      formatDisplayDate(c.createdAt),
      (c.departments || []).length > 0 ? (c.departments || []).map(d => d.name).join(', ') : 'Matriz'
    ]);

    const titleSuffix = onlySelected ? `(${list.length} Seleccionados)` : `(Total ${list.length})`;
    exportToPDF({
      title: 'Directorio Oficial de Clientes',
      subtitle: `Registro y Catálogo Comercial ${titleSuffix}`,
      headers,
      rows,
      summaryCards: [
        { label: 'Total Clientes', value: list.length },
        { label: 'Clientes Activos', value: list.filter(c => (c.status || 'Activo') === 'Activo').length },
        { label: 'Corporativos / VIP', value: list.filter(c => c.category === 'Corporativo' || c.category === 'VIP').length }
      ]
    });
  };

  const handleExportSingleClient = (client: Client, format: 'PDF' | 'Excel') => {
    if (format === 'Excel') {
      const headers = ['Campo', 'Valor'];
      const rows = [
        ['Nombre / Razón Social', client.name],
        ['RFC', client.taxId || 'XAXX010101000'],
        ['Correo', client.email || 'N/A'],
        ['Teléfono', client.phone || 'N/A'],
        ['WhatsApp', client.whatsapp || 'N/A'],
        ['Categoría', client.category || 'Regular'],
        ['Estado', client.status || 'Activo'],
        ['Fecha de Registro', formatDisplayDate(client.createdAt)],
        ['Dirección Fiscal', client.fiscalAddress || client.address || 'N/A'],
        ['Límite de Crédito', `$${(client.creditLimit || 0).toLocaleString('es-MX')} MXN`],
        ['Días de Crédito', `${client.creditDays || 0} días`],
        ['Equipo Registrado', client.model || 'N/A'],
        ['Falla / Antecedente', client.fault || 'N/A'],
        ['Sucursales', (client.departments || []).map(d => `${d.name} (${d.phone})`).join('; ')]
      ];
      exportToExcel(`Ficha_Cliente_${client.name.replace(/\s+/g, '_')}`, headers, rows);
    } else {
      const headers = ['Sucursal / Depto', 'Encargado', 'Teléfono', 'Ubicación'];
      const rows = (client.departments || []).map(d => [
        d.name,
        d.contactName || client.name,
        d.phone || client.phone || 'N/A',
        d.address || client.address || 'N/A'
      ]);

      exportToPDF({
        title: `Ficha Comercial: ${client.name}`,
        subtitle: `RFC: ${client.taxId || 'N/A'} • Categoría: ${client.category || 'Regular'} • Estado: ${client.status || 'Activo'} • Registrado: ${formatDisplayDate(client.createdAt)}`,
        metadata: {
          'Fecha de Registro': formatDisplayDate(client.createdAt),
          'Correo Electrónico': client.email || 'N/A',
          'Teléfono / WhatsApp': `${client.phone || 'N/A'} / ${client.whatsapp || 'N/A'}`,
          'Dirección Fiscal': client.fiscalAddress || client.address || 'N/A',
          'Límite de Crédito': `$${(client.creditLimit || 0).toLocaleString('es-MX')} MXN (${client.creditDays || 0} días de crédito)`,
          'Equipo / Modelo Frecuente': client.model || 'N/A',
          'Antecedente de Fallas': client.fault || 'Ninguno'
        },
        headers,
        rows
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <span>Directorio y Gestión de Clientes</span>
              <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {clients.length} registrados
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Módulo exclusivo para altas, consultas, sucursales y exportación de clientes y empresas.
            </p>
          </div>
        </div>

        {/* Global Module Actions: New Client + Export All */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportExcel(false)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
            title="Exportar todos los clientes a Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Completo</span>
          </button>

          <button
            onClick={() => handleExportPDF(false)}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
            title="Imprimir / Exportar catálogo completo a PDF"
          >
            <Printer className="w-4 h-4" />
            <span>PDF Completo</span>
          </button>

          <button
            onClick={() => openModal()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold shadow-md flex items-center space-x-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Cliente</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
              : 'bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filter and Selection Control Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, RFC, correo, teléfono, dirección..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 outline-hidden transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-700 text-xs outline-hidden cursor-pointer"
              >
                <option value="all">Todas las Categorías</option>
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Corporativo">Corporativo</option>
                <option value="Residencial">Residencial</option>
              </select>
            </div>

            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-700 text-xs outline-hidden cursor-pointer"
              >
                <option value="all">Todos los Estados</option>
                <option value="Activo">Activos</option>
                <option value="Inactivo">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Selection Action Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 gap-2 text-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-slate-700 font-bold hover:text-purple-700 cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-purple-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isAllSelected
                  ? 'Deseleccionar Todos'
                  : selectedClientIds.length > 0
                  ? `Seleccionados (${selectedClientIds.length})`
                  : 'Seleccionar Todos'}
              </span>
            </button>

            {selectedClientIds.length > 0 && (
              <span className="text-[11px] bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold border border-purple-200">
                {selectedClientIds.length} de {filteredClients.length} seleccionados
              </span>
            )}
          </div>

          {/* Export Selected Controls */}
          {selectedClientIds.length > 0 && (
            <div className="flex items-center space-x-2 bg-purple-50 p-1.5 rounded-xl border border-purple-200">
              <span className="text-[11px] font-bold text-purple-900 px-1">Exportar Seleccionados:</span>
              <button
                onClick={() => handleExportExcel(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs flex items-center space-x-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel ({selectedClientIds.length})</span>
              </button>
              <button
                onClick={() => handleExportPDF(true)}
                className="bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF ({selectedClientIds.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No se encontraron clientes</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No hay registros con los filtros aplicados. Haz clic en "Registrar Cliente" para añadir uno nuevo.
          </p>
          <button
            onClick={() => openModal()}
            className="bg-purple-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Primer Cliente</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => {
            const isSelected = selectedClientIds.includes(client.id);
            return (
              <div
                key={client.id}
                className={`bg-white border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group ${
                  isSelected ? 'border-purple-500 ring-2 ring-purple-400/20 bg-purple-50/20' : 'border-slate-200'
                }`}
              >
                {/* Checkbox selector + Category Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => handleToggleSelect(client.id)}
                      className="cursor-pointer text-slate-400 hover:text-purple-600"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                      {client.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight line-clamp-1">
                        {client.name}
                      </h4>
                      <span className="font-mono text-[11px] text-slate-500 font-bold">
                        RFC: {client.taxId || 'XAXX010101000'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      (client.status || 'Activo') === 'Activo'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {client.status || 'Activo'}
                  </span>
                </div>

                {/* Details list */}
                <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 text-xs border border-slate-100 mb-4 flex-1">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{client.email || 'Sin correo'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{client.phone || client.whatsapp || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-start space-x-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-[11px]">{client.address || 'Sin dirección registrada'}</span>
                  </div>

                  {/* Badges / Extras */}
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="bg-purple-100 text-purple-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                      Cat: {client.category || 'Regular'}
                    </span>
                    {(client.departments || []).length > 0 && (
                      <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                        {(client.departments || []).length} {(client.departments || []).length === 1 ? 'Sucursal' : 'Sucursales'}
                      </span>
                    )}
                    {client.model && (
                      <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-md truncate max-w-[130px]">
                        ⚙️ {client.model}
                      </span>
                    )}
                  </div>

                  {/* Registration Date Info */}
                  <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10.5px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-purple-500" />
                      <span>Registrado:</span>
                    </span>
                    <span className="font-bold text-slate-700">
                      {formatDisplayDate(client.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Card Actions: Export Single + Edit + Delete */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  {/* Export Individual */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleExportSingleClient(client, 'Excel')}
                      className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                      title="Descargar Ficha en Excel"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>XLS</span>
                    </button>
                    <button
                      onClick={() => handleExportSingleClient(client, 'PDF')}
                      className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 p-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                      title="Imprimir / Ver Ficha en PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>

                  {/* Edit / Status / Delete */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openModal(client)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar cliente"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleClientStatus(client.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        (client.status || 'Activo') === 'Activo'
                          ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                          : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                      }`}
                      title={(client.status || 'Activo') === 'Activo' ? 'Desactivar cliente' : 'Activar cliente'}
                    >
                      {(client.status || 'Activo') === 'Activo' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() =>
                        setItemToDelete({
                          id: client.id,
                          name: client.name,
                          description: `al cliente "${client.name}" y sus sucursales vinculadas`
                        })
                      }
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL REGISTRO / EDICIÓN CLIENTE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingClient ? 'Editar Información del Cliente' : 'Registro de Nuevo Cliente'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingClient ? `Modificando: ${editingClient.name}` : 'Captura los datos fiscales y comerciales del cliente'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSubmitClient} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* Row 1: Name and RFC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nombre o Razón Social *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ej. Industrias Metálicas del Norte S.A."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">RFC / Identificador Fiscal</label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={e => setTaxId(e.target.value.toUpperCase())}
                      placeholder="Ej. IMN890315XX1"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-hidden uppercase"
                    />
                  </div>
                </div>

                {/* Row 2: Contact, Phone & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="compras@empresa.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Teléfono Principal</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="55-1234-5678"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp de Notificación</label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      placeholder="55-8765-4321"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Row 3: Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Dirección Fiscal / Ubicación Principal</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Av. Industrial #450, Parque Industrial, Monterrey, N.L."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-hidden resize-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Dirección de Entrega / Servicio</label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Misma o acceso por portón 4 nave B"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-hidden resize-none font-medium"
                    />
                  </div>
                </div>

                {/* Row 4: Category and Commercial Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Categoría Comercial</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-800 outline-hidden cursor-pointer"
                    >
                      <option value="Regular">Regular</option>
                      <option value="VIP">VIP</option>
                      <option value="Corporativo">Corporativo</option>
                      <option value="Residencial">Residencial</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Límite de Crédito (MXN)</label>
                    <input
                      type="number"
                      min="0"
                      value={creditLimit}
                      onChange={e => setCreditLimit(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-800 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Días de Crédito</label>
                    <input
                      type="number"
                      min="0"
                      value={creditDays}
                      onChange={e => setCreditDays(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-800 outline-hidden"
                    />
                  </div>
                </div>

                {/* Row 5: Equipment Model & Historical Fault */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Equipo / Maquinaria Habitual</label>
                    <input
                      type="text"
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      placeholder="Ej. Climas York 10TR, Compresor Gardner Denver..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Notas de Fallas / Antecedentes</label>
                    <input
                      type="text"
                      value={fault}
                      onChange={e => setFault(e.target.value)}
                      placeholder="Ej. Fugas recurrentes de refrigerante en serpentín"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                {/* Section: Branches / Sucursales */}
                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-purple-950 block">Sucursales, Plantas o Departamentos</span>
                      <span className="text-[11px] text-purple-700">Lugares de servicio asignables en órdenes</span>
                    </div>
                  </div>

                  {/* Add Branch Inline Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-purple-200">
                    <input
                      type="text"
                      placeholder="Nombre Sucursal (Ej. Nave 2)"
                      value={depName}
                      onChange={e => setDepName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Contacto / Encargado"
                      value={depContact}
                      onChange={e => setDepContact(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono Sucursal"
                      value={depPhone}
                      onChange={e => setDepPhone(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddDepartment}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Añadir Sucursal</span>
                    </button>
                  </div>

                  {/* Branches List */}
                  <div className="space-y-1.5">
                    {departments.map(d => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-bold text-slate-800">{d.name}</span>
                          {d.contactName && <span className="text-slate-500">• {d.contactName}</span>}
                          {d.phone && <span className="text-slate-400 font-mono">({d.phone})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDepartment(d.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-2 text-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando Cliente...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingClient ? 'Actualizar Cliente' : 'Guardar y Registrar Cliente'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setItemToDelete(null)}
          onConfirm={async () => {
            await deleteClient(itemToDelete.id);
            setItemToDelete(null);
            showFeedback('success', 'Cliente eliminado con éxito.');
          }}
          title="¿Eliminar Cliente?"
          message={`¿Estás seguro de que deseas eliminar a "${itemToDelete.name}"? Esta acción no se puede deshacer.`}
        />
      )}
    </div>
  );
};
