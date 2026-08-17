import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Tag,
  Filter,
  Check
} from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { BusinessService } from '../../types';

const DEFAULT_CATEGORIES = [
  'Mantenimiento Preventivo',
  'Mantenimiento Correctivo',
  'Diagnóstico & Revisión',
  'Instalación & Montaje',
  'Reparación Especializada',
  'Calibración & Ajuste',
  'Póliza de Servicio',
  'Otros Servicios'
];

export const ServicesModule: React.FC = () => {
  const { services, addService, updateService, toggleServiceStatus, deleteService } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<BusinessService | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<BusinessService | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Mantenimiento Preventivo',
    description: '',
    basePrice: 0,
    estimatedDurationHours: 2,
    warrantyDays: 30,
    status: 'Activo' as 'Activo' | 'Inactivo'
  });

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter(srv => {
      const matchesSearch =
        srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'ALL' || srv.category === selectedCategory;
      const matchesStatus = statusFilter === 'ALL' || srv.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, searchQuery, selectedCategory, statusFilter]);

  // KPIs
  const activeCount = useMemo(() => services.filter(s => s.status === 'Activo').length, [services]);
  const avgPrice = useMemo(() => {
    if (services.length === 0) return 0;
    const total = services.reduce((sum, s) => sum + (Number(s.basePrice) || 0), 0);
    return total / services.length;
  }, [services]);
  const categoriesCount = useMemo(() => new Set(services.map(s => s.category)).size, [services]);

  const handleOpenAddModal = () => {
    setEditingService(null);
    const nextNum = (services.length + 1).toString().padStart(3, '0');
    setFormData({
      code: `SRV-${nextNum}`,
      name: '',
      category: 'Mantenimiento Preventivo',
      description: '',
      basePrice: 850,
      estimatedDurationHours: 2,
      warrantyDays: 30,
      status: 'Activo'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: BusinessService) => {
    setEditingService(service);
    setFormData({
      code: service.code,
      name: service.name,
      category: service.category,
      description: service.description || '',
      basePrice: service.basePrice,
      estimatedDurationHours: service.estimatedDurationHours || 1,
      warrantyDays: service.warrantyDays || 30,
      status: service.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    if (editingService) {
      await updateService(editingService.id, formData);
    } else {
      await addService(formData);
    }
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    if (services.length === 0) return;
    const headers = ['Código', 'Nombre del Servicio', 'Categoría', 'Precio Base (MXN)', 'Duración Estimada (Horas)', 'Garantía (Días)', 'Estado', 'Descripción'];
    const rows = services.map(s => [
      `"${s.code}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.category}"`,
      s.basePrice,
      s.estimatedDurationHours || 1,
      s.warrantyDays || 30,
      s.status,
      `"${(s.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Catalogo_Servicios_SIJ_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Servicios</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{services.length}</p>
            <span className="text-[11px] text-blue-600 font-bold flex items-center mt-1">
              Catálogo oficial del negocio
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Servicios Activos</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center mt-1">
              Disponibles para cotización
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precio Promedio</span>
            <p className="text-2xl font-black text-slate-900 mt-1">${avgPrice.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN</p>
            <span className="text-[11px] text-purple-600 font-bold flex items-center mt-1">
              Tarifa base promedio
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categorías</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{categoriesCount || 1}</p>
            <span className="text-[11px] text-amber-600 font-bold flex items-center mt-1">
              Líneas de servicio
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Catálogo de Servicios del Negocio ({filteredServices.length})
            </h3>
            <p className="text-xs text-slate-500">
              Alta, modificación y tarifas de los servicios técnicos y especializados ofrecidos
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              placeholder="Buscar servicio o código..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Todas las Categorías</option>
            {DEFAULT_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            title="Exportar a Excel (CSV)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            title="Imprimir Catálogo"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Services Grid / Cards */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">No se encontraron servicios</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'ALL'
                ? 'Prueba modificando los filtros de búsqueda o categoría.'
                : 'Da de alta el primer servicio que ofrece tu negocio para comenzar a cotizar y generar órdenes de trabajo.'}
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Dar de Alta Servicio</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map(service => (
            <div
              key={service.id}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                service.status === 'Inactivo' ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-slate-200 hover:border-cyan-300 hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Code, Category & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                    {service.code}
                  </span>
                  <button
                    onClick={() => toggleServiceStatus(service.id)}
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 cursor-pointer transition-colors ${
                      service.status === 'Activo'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {service.status === 'Activo' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{service.status}</span>
                  </button>
                </div>

                {/* Service Title */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{service.category}</span>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">{service.name}</h4>
                  {service.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>

                {/* Details Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                  <span className="inline-flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>~{service.estimatedDurationHours || 1} hrs aprox.</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{service.warrantyDays || 30} días garantía</span>
                  </span>
                </div>
              </div>

              {/* Footer: Price & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarifa Base</span>
                  <span className="text-base font-black text-slate-900">
                    ${Number(service.basePrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleOpenEditModal(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    title="Editar Servicio"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setServiceToDelete(service)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar Servicio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ALTA / EDICIÓN DE SERVICIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingService ? 'Editar Servicio' : 'Dar de Alta Nuevo Servicio'}
                  </h3>
                  <p className="text-xs text-slate-500">Configura el código, precio y alcance del servicio</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    placeholder="SRV-001"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Nombre del Servicio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mantenimiento Preventivo Unidad Paquete"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  >
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Precio Base ($ MXN) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.basePrice}
                      onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duración Est. (Hrs)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.estimatedDurationHours}
                    onChange={e => setFormData({ ...formData, estimatedDurationHours: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Garantía (Días)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.warrantyDays}
                    onChange={e => setFormData({ ...formData, warrantyDays: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción / Alcance del Servicio</label>
                <textarea
                  rows={3}
                  placeholder="Detalla las actividades incluidas, refacciones sugeridas o protocolo de servicio..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-normal focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingService ? 'Guardar Cambios' : 'Guardar Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {serviceToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setServiceToDelete(null)}
          onConfirm={() => {
            deleteService(serviceToDelete.id);
            setServiceToDelete(null);
          }}
          title="¿Eliminar Servicio?"
          message={`¿Estás seguro de que deseas eliminar permanentemente "${serviceToDelete.name}" (${serviceToDelete.code})?`}
        />
      )}
    </div>
  );
};
