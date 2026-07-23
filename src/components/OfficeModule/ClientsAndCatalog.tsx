import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Package, Plus, MapPin, Phone, Mail, Search, Tag, Database } from 'lucide-react';

export const ClientsAndCatalog: React.FC = () => {
  const { clients, spareParts, addClient, addSparePart } = useApp();
  const [activeTab, setActiveTab] = useState<'clients' | 'catalog'>('clients');

  const [searchQuery, setSearchQuery] = useState('');

  // New Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientTaxId, setNewClientTaxId] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [dep1Name, setDep1Name] = useState('');
  const [dep1Contact, setDep1Contact] = useState('');
  const [dep1Phone, setDep1Phone] = useState('');
  const [dep2Name, setDep2Name] = useState('');
  const [dep2Contact, setDep2Contact] = useState('');
  const [dep2Phone, setDep2Phone] = useState('');
  const [dep3Name, setDep3Name] = useState('');
  const [dep3Contact, setDep3Contact] = useState('');
  const [dep3Phone, setDep3Phone] = useState('');

  // New Spare Part Modal State
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [partCategory, setPartCategory] = useState('General');
  const [partPrice, setPartPrice] = useState(500);
  const [partStock, setPartStock] = useState(10);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.taxId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParts = spareParts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    addClient({
      name: newClientName,
      taxId: newClientTaxId || 'XAXX010101000',
      email: newClientEmail || 'contacto@cliente.com',
      departments: [
        { id: `dep-${Date.now()}-1`, name: dep1Name || 'Planta Principal', contactName: dep1Contact || 'Contacto 1', phone: dep1Phone || '555-0001' },
        { id: `dep-${Date.now()}-2`, name: dep2Name || 'Sucursal Norte', contactName: dep2Contact || 'Contacto 2', phone: dep2Phone || '555-0002' },
        { id: `dep-${Date.now()}-3`, name: dep3Name || 'Almacén Central', contactName: dep3Contact || 'Contacto 3', phone: dep3Phone || '555-0003' }
      ]
    });

    setIsClientModalOpen(false);
    setNewClientName('');
    setNewClientTaxId('');
    setNewClientEmail('');
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    addSparePart({
      code: partCode || `REF-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: partName,
      category: partCategory,
      unitPrice: Number(partPrice),
      stock: Number(partStock)
    });

    setIsPartModalOpen(false);
    setPartName('');
    setPartCode('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'clients'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Directorio de Clientes ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo de Refacciones ({spareParts.length})</span>
          </button>
        </div>

        {/* Search & Add Button */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'clients' ? "Buscar cliente o RFC..." : "Buscar refacción..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'clients' ? (
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPartModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Refacción</span>
            </button>
          )}
        </div>
      </div>

      {/* CLIENTS VIEW */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div
              key={client.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                      <span className="text-[11px] font-mono text-slate-500">RFC: {client.taxId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-xs text-slate-600 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{client.email}</span>
                </div>

                {/* 3 Departments */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Departamentos / Ubicaciones Registradas ({client.departments.length}):
                  </span>
                  {client.departments.map(dep => (
                    <div
                      key={dep.id}
                      className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-0.5"
                    >
                      <div className="font-semibold text-slate-800 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{dep.name}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex justify-between pl-4">
                        <span>Contacto: {dep.contactName}</span>
                        <span className="font-mono text-slate-700">{dep.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SPARE PARTS CATALOG VIEW */}
      {activeTab === 'catalog' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Refacción / Repuesto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Precio Base (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParts.map(part => (
                <tr key={part.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-blue-600">{part.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{part.name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium text-[11px]">
                      {part.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] ${
                        part.stock <= 5
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {part.stock} unids
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">
                    ${part.unitPrice.toLocaleString('es-MX')} MXN
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW CLIENT MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar Nuevo Cliente</h3>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre / Razon Social</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="Ej. Grupo Industrial Monterrey"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">RFC</label>
                  <input
                    type="text"
                    value={newClientTaxId}
                    onChange={e => setNewClientTaxId(e.target.value)}
                    placeholder="GIM990101XX1"
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={e => setNewClientEmail(e.target.value)}
                    placeholder="compras@cliente.com"
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 block mb-2">Departamentos / Ubicaciones (3):</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Dep 1: Ej. Nave A - Producción"
                    value={dep1Name}
                    onChange={e => setDep1Name(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                  <input
                    type="text"
                    placeholder="Dep 2: Ej. Edificio B - Laboratorio"
                    value={dep2Name}
                    onChange={e => setDep2Name(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                  <input
                    type="text"
                    placeholder="Dep 3: Ej. Almacén Central"
                    value={dep3Name}
                    onChange={e => setDep3Name(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW PART MODAL */}
      {isPartModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar Refacción al Catálogo</h3>
            <form onSubmit={handleCreatePart} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre de Refacción</label>
                <input
                  type="text"
                  required
                  value={partName}
                  onChange={e => setPartName(e.target.value)}
                  placeholder="Ej. Batería de Gel 12V 100Ah"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Código</label>
                  <input
                    type="text"
                    value={partCode}
                    onChange={e => setPartCode(e.target.value)}
                    placeholder="BAT-GEL-12V"
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
                  <input
                    type="text"
                    value={partCategory}
                    onChange={e => setPartCategory(e.target.value)}
                    placeholder="Electrónica / HVAC"
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Precio Base (MXN)</label>
                  <input
                    type="number"
                    value={partPrice}
                    onChange={e => setPartPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={partStock}
                    onChange={e => setPartStock(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPartModalOpen(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  Guardar Refacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
