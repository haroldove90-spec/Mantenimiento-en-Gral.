import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, Clock, CheckCircle2, Building, Wrench, Calendar, TrendingUp } from 'lucide-react';

export const ReportsAndMetrics: React.FC = () => {
  const { orders, clients, technicians } = useApp();
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  const filteredOrders = orders.filter(
    o => selectedClientId === 'all' || o.clientId === selectedClientId
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Métricas & Historial de Mantenimiento</h3>
            <p className="text-xs text-slate-500">Analítica de atención por técnico y departamentos</p>
          </div>
        </div>

        {/* Client filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filtrar por Cliente:</label>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-purple-500 outline-hidden"
          >
            <option value="all">Todos los Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Technician Performance Cards */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Wrench className="w-4 h-4 text-purple-600" />
          <span>Tiempos Promedio de Atención y Carga por Técnico</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {technicians.map(tech => {
            const techOrders = orders.filter(o => o.technicianId === tech.id);
            const completedTechOrders = techOrders.filter(o => o.status === 'Finalizada');

            return (
              <div
                key={tech.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
                      {tech.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{tech.name}</h5>
                      <span className="text-[11px] text-purple-600 font-medium">{tech.specialty}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">T. Respuesta</div>
                    <div className="text-sm font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{tech.avgResponseTimeHours} hrs</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Completadas</div>
                    <div className="text-sm font-bold text-emerald-600 flex items-center space-x-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{completedTechOrders.length} OS</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maintenance History Table per Department / Client */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Historial de Mantenimiento por Cliente y Departamento</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3">Folio</th>
                <th className="py-2.5 px-3">Cliente / Ubicación</th>
                <th className="py-2.5 px-3">Descripción</th>
                <th className="py-2.5 px-3">Técnico</th>
                <th className="py-2.5 px-3 text-center">Estatus</th>
                <th className="py-2.5 px-3 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(ord => (
                <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">{ord.folio}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{ord.clientName}</div>
                    <div className="text-[11px] text-slate-500">{ord.departmentName}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 max-w-xs truncate">{ord.description}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {ord.technicianName || 'Sin asignar'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        ord.status === 'Finalizada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'En Reparación'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500 font-mono text-[11px]">
                    {ord.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
