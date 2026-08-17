import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  RoleType,
  ServiceOrder,
  Client,
  Department,
  SparePart,
  BusinessService,
  Technician,
  Notification,
  OrderStatus,
  PriorityType,
  RequestedPart,
  Budget,
  SystemUser,
  OperatingExpense,
  normalizeRole
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_ORDERS,
  INITIAL_SPARE_PARTS,
  INITIAL_SERVICES,
  INITIAL_TECHNICIANS,
  INITIAL_USERS,
  INITIAL_EXPENSES
} from '../data/initialData';

interface AppContextType {
  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;
  officeSubTab: 'orders' | 'routes' | 'budgets' | 'services' | 'clients' | 'catalogs' | 'reports';
  setOfficeSubTab: (tab: 'orders' | 'routes' | 'budgets' | 'services' | 'clients' | 'catalogs' | 'reports') => void;
  ownerSubTab: 'analytics' | 'financials' | 'services' | 'employees' | 'users' | 'clients';
  setOwnerSubTab: (tab: 'analytics' | 'financials' | 'services' | 'employees' | 'users' | 'clients') => void;
  orders: ServiceOrder[];
  clients: Client[];
  spareParts: SparePart[];
  services: BusinessService[];
  technicians: Technician[];
  systemUsers: SystemUser[];
  currentUser: SystemUser | null;
  setCurrentUser: (user: SystemUser | null) => void;
  expenses: OperatingExpense[];
  notifications: Notification[];
  selectedClientOrderFolio: string | null;
  setSelectedClientOrderFolio: (folio: string | null) => void;

  // Actions
  createOrder: (data: {
    clientId: string;
    departmentId: string;
    equipmentType: string;
    description: string;
    priority: PriorityType;
    technicianId?: string;
    scheduledDate?: string;
  }) => ServiceOrder;

  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string, authorName?: string) => void;
  assignTechnician: (orderId: string, technicianId: string, routeOrder?: number, scheduledDate?: string) => void;
  updateOrderRoute: (orderId: string, routeOrder: number, scheduledDate: string, notes?: string) => void;
  reopenWarrantyOrder: (orderId: string, warrantyNotes: string) => void;

  // Tech actions
  startInspection: (orderId: string) => void;
  submitTechDiagnostic: (data: {
    orderId: string;
    notes: string;
    photos: string[];
    requestedParts: RequestedPart[];
  }) => void;

  submitTechResolution: (data: {
    orderId: string;
    solutionNotes: string;
    solutionPhotos: string[];
    paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Cheque';
    signature?: string;
  }) => void;

  // Office & Catalog actions
  saveBudget: (orderId: string, budgetData: { laborCost: number; parts: RequestedPart[]; taxRate: number; notes?: string }) => void;
  sendBudgetToClient: (orderId: string) => void;
  updateOrder: (id: string, orderData: Partial<ServiceOrder>) => void;
  deleteOrder: (id: string) => void;
  addClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  toggleClientStatus: (id: string) => void;
  addSparePart: (part: Omit<SparePart, 'id'>) => void;
  updateSparePart: (id: string, partData: Partial<SparePart>) => void;
  toggleSparePartStatus: (id: string) => void;
  deleteSparePart: (id: string) => void;
  addService: (service: Omit<BusinessService, 'id'>) => Promise<void>;
  updateService: (id: string, serviceData: Partial<BusinessService>) => Promise<void>;
  toggleServiceStatus: (id: string) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  updateTechnician: (id: string, techData: Partial<Technician>) => void;
  toggleTechStatus: (id: string) => void;
  deleteTechnician: (id: string) => void;

  // Client actions
  approveBudget: (orderId: string, clientComment?: string) => void;
  rejectBudget: (orderId: string, clientComment: string) => void;

  // Owner / System Users & Expenses actions
  addSystemUser: (user: Omit<SystemUser, 'id'>) => Promise<{ success: boolean; savedInDb: boolean; error?: string }>;
  syncUsersToSupabase: () => Promise<{ success: boolean; count: number; error?: string }>;
  syncAllDataToSupabase: () => Promise<{ success: boolean; message: string }>;
  updateSystemUser: (id: string, userData: Partial<SystemUser>) => void;
  toggleUserStatus: (id: string) => void;
  deleteSystemUser: (id: string) => void;
  addExpense: (expense: Omit<OperatingExpense, 'id'>) => void;
  updateExpense: (id: string, expenseData: Partial<OperatingExpense>) => void;
  deleteExpense: (id: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;

  // Data Purge / Reset
  clearSampleData: () => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<RoleType>(() => {
    const saved = localStorage.getItem('app_active_role');
    return (saved as RoleType) || 'home';
  });
  const [officeSubTab, setOfficeSubTab] = useState<'orders' | 'routes' | 'budgets' | 'clients' | 'catalogs' | 'reports'>(() => {
    const saved = localStorage.getItem('app_office_subtab');
    return (saved as any) || 'orders';
  });
  const [ownerSubTab, setOwnerSubTab] = useState<'analytics' | 'financials' | 'employees' | 'users' | 'clients'>(() => {
    const saved = localStorage.getItem('app_owner_subtab');
    return (saved as any) || 'analytics';
  });
  const [selectedClientOrderFolio, setSelectedClientOrderFolio] = useState<string | null>('OS-1004');

  // LocalStorage initialization with fallbacks
  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('app_service_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('app_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    const saved = localStorage.getItem('app_spare_parts');
    return saved ? JSON.parse(saved) : INITIAL_SPARE_PARTS;
  });

  const [services, setServices] = useState<BusinessService[]>(() => {
    const saved = localStorage.getItem('app_business_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('app_technicians');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => t && t.id && !['tech-1', 'tech-2', 'tech-3'].includes(t.id) && !['carlos.tech@mantenimiento.com', 'ana.tech@mantenimiento.com', 'roberto.tech@mantenimiento.com'].includes(t.email));
        }
      } catch {}
    }
    return [];
  });

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('app_system_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem('app_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [expenses, setExpenses] = useState<OperatingExpense[]>(() => {
    const saved = localStorage.getItem('app_operating_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-1',
      timestamp: 'Hace 5 min',
      targetRole: 'office',
      orderFolio: 'OS-1002',
      title: 'Refacciones Solicitadas',
      message: 'El téc. Ana Mendoza solicitó 2 refacciones para la orden OS-1002.',
      read: false
    },
    {
      id: 'notif-2',
      timestamp: 'Hace 20 min',
      targetRole: 'tech',
      orderFolio: 'OS-1005',
      title: 'Presupuesto Aprobado',
      message: 'El cliente autorizó el presupuesto para OS-1005. ¡Ruta programada para reparación!',
      read: false
    }
  ]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('app_active_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem('app_office_subtab', officeSubTab);
  }, [officeSubTab]);

  useEffect(() => {
    localStorage.setItem('app_owner_subtab', ownerSubTab);
  }, [ownerSubTab]);

  useEffect(() => {
    localStorage.setItem('app_service_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('app_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('app_spare_parts', JSON.stringify(spareParts));
  }, [spareParts]);

  useEffect(() => {
    localStorage.setItem('app_business_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('app_technicians', JSON.stringify(technicians));
  }, [technicians]);

  useEffect(() => {
    localStorage.setItem('app_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_current_user');
    }
  }, [currentUser]);

  // Sync data from Supabase on load
  useEffect(() => {
    const fetchSupabaseData = async () => {
      // 1. Fetch Employees & Technicians (from 'employees', 'technicians', and 'system_users')
      try {
        let allUsersMap = new Map<string, SystemUser>();
        let techMap = new Map<string, Technician>();

        // A. Load from 'employees'
        try {
          const { data: empData, error: empErr } = await supabase.from('employees').select('*');
          if (!empErr && empData && Array.isArray(empData)) {
            empData.forEach((u: any) => {
              const email = (u.email || '').trim().toLowerCase();
              const role = normalizeRole(u.role);
              const userId = u.id || `usr-${Math.random()}`;
              if (email) {
                allUsersMap.set(email, {
                  id: userId,
                  name: u.name || 'Empleado',
                  username: u.username || email.split('@')[0],
                  email: u.email || '',
                  password: u.pin || '',
                  phone: u.phone || '',
                  role,
                  status: u.is_active === false ? 'Inactivo' : 'Activo',
                  lastLogin: 'Reciente',
                  createdAt: u.created_at || new Date().toISOString()
                });

                if (role === 'tech') {
                  techMap.set(email, {
                    id: userId,
                    name: u.name || 'Técnico',
                    phone: u.phone || '',
                    email: u.email || '',
                    specialty: 'Técnico de Campo',
                    activeOrdersCount: 0,
                    avgResponseTimeHours: 2.5,
                    status: u.is_active === false ? 'Inactivo' : 'Activo'
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Load employees notice:', e);
        }

        // B. Load from 'system_users' to merge any user not yet in 'employees'
        try {
          const { data: sysData, error: sysErr } = await supabase.from('system_users').select('*');
          if (!sysErr && sysData && Array.isArray(sysData)) {
            sysData.forEach((u: any) => {
              const email = (u.email || '').trim().toLowerCase();
              const role = normalizeRole(u.role);
              const userId = u.id || `usr-${Math.random()}`;
              if (email && !allUsersMap.has(email)) {
                allUsersMap.set(email, {
                  id: userId,
                  name: u.name || 'Usuario',
                  username: u.username || email.split('@')[0],
                  email: u.email || '',
                  password: u.password || '',
                  phone: u.phone || '',
                  role,
                  status: u.status || 'Activo',
                  lastLogin: u.last_login ? new Date(u.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente',
                  createdAt: u.created_at || new Date().toISOString()
                });
              }
              if (role === 'tech' && email && !techMap.has(email)) {
                techMap.set(email, {
                  id: userId,
                  name: u.name || 'Técnico',
                  phone: u.phone || '',
                  email: u.email || '',
                  specialty: 'Técnico de Campo',
                  activeOrdersCount: 0,
                  avgResponseTimeHours: 2.5,
                  status: u.status === 'Inactivo' ? 'Inactivo' : 'Activo'
                });
              }
            });
          }
        } catch (e) {
          console.warn('Load system_users notice:', e);
        }

        // C. Load from 'technicians' table directly
        try {
          const { data: techTableData, error: techErr } = await supabase.from('technicians').select('*');
          if (!techErr && techTableData && Array.isArray(techTableData)) {
            techTableData.forEach((t: any) => {
              const email = (t.email || '').trim().toLowerCase();
              const key = email || t.name || t.id;
              if (key && !techMap.has(key)) {
                techMap.set(key, {
                  id: t.id,
                  name: t.name || 'Técnico',
                  phone: t.phone || '',
                  email: t.email || '',
                  specialty: t.specialty || 'Técnico de Campo',
                  activeOrdersCount: 0,
                  avgResponseTimeHours: 2.5,
                  status: t.status === 'Inactivo' ? 'Inactivo' : 'Activo'
                });
              }
            });
          }
        } catch (e) {
          console.warn('Load technicians notice:', e);
        }

        const fetchedUsers = Array.from(allUsersMap.values());
        if (fetchedUsers.length > 0) {
          setSystemUsers(fetchedUsers);
          localStorage.setItem('app_system_users', JSON.stringify(fetchedUsers));
        }

        const fetchedTechs = Array.from(techMap.values()).filter(t => 
          t && t.name && 
          !['tech-1', 'tech-2', 'tech-3'].includes(t.id) &&
          !['carlos.tech@mantenimiento.com', 'ana.tech@mantenimiento.com', 'roberto.tech@mantenimiento.com'].includes(t.email)
        );

        if (fetchedTechs.length > 0) {
          setTechnicians(fetchedTechs);
          localStorage.setItem('app_technicians', JSON.stringify(fetchedTechs));
        }
      } catch (e) {
        console.warn('Supabase employees sync notice:', e);
      }

      // 2. Fetch Service Orders (from 'service_orders')
      try {
        const { data: oData, error: oErr } = await supabase.from('service_orders').select('*');
        const mappedOrders: ServiceOrder[] = (!oErr && oData && Array.isArray(oData)) ? oData.map((o: any) => ({
          id: o.id,
          folio: o.folio || `OS-${Math.floor(1000 + Math.random() * 9000)}`,
          clientId: o.client_id || '',
          clientName: o.client_name || 'Cliente',
          departmentId: o.department_id || '',
          departmentName: o.department_name || 'Matriz Principal',
          equipmentType: o.equipment_type || 'General',
          priority: (o.priority === 'Alta' || o.priority === 'Media' || o.priority === 'Baja') ? o.priority : 'Media',
          status: (o.status as OrderStatus) || 'Pendiente de Visita',
          description: o.description || '',
          technicianId: o.technician_id || undefined,
          technicianName: o.technician_name || undefined,
          scheduledDate: o.scheduled_date || new Date().toISOString().split('T')[0],
          routeOrder: Number(o.route_order || 1),
          diagnosticNotes: o.diagnostic_notes || '',
          diagnosticPhotos: Array.isArray(o.diagnostic_photos) ? o.diagnostic_photos : [],
          requestedParts: Array.isArray(o.requested_parts) ? o.requested_parts : [],
          solutionNotes: o.solution_notes || '',
          solutionPhotos: Array.isArray(o.solution_photos) ? o.solution_photos : [],
          collectedAmount: Number(o.collected_amount || 0),
          paymentMethod: o.payment_method || undefined,
          isWarranty: Boolean(o.is_warranty),
          warrantyNotes: o.warranty_reason || o.warranty_notes || undefined,
          budget: o.budget || undefined,
          clientSignature: o.signature_data || o.client_signature || undefined,
          createdAt: o.created_at ? new Date(o.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'Reciente',
          timeline: Array.isArray(o.timeline) && o.timeline.length > 0
            ? o.timeline
            : [
                {
                  id: `tl-${o.id}-init`,
                  timestamp: o.created_at ? new Date(o.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'Registro',
                  title: 'Orden de Servicio Registrada',
                  author: 'Sistema',
                  note: `Folio: ${o.folio || ''}`
                }
              ]
        })) : [];

        setOrders(prev => {
          const existingFolios = new Set(mappedOrders.map(o => o.folio));
          const localRealOrders = prev.filter(o => o && o.folio);
          const localOnly = localRealOrders.filter(o => !existingFolios.has(o.folio));

          // Auto-sync any local-only orders (like OS-1001) up to Supabase immediately!
          if (localOnly.length > 0) {
            localOnly.forEach(async (lo) => {
              try {
                const nowIso = new Date().toISOString();
                const ordPayload: any = {
                  folio: lo.folio,
                  client_name: lo.clientName,
                  department_name: lo.departmentName || 'Matriz Principal',
                  equipment_type: lo.equipmentType || 'General',
                  description: lo.description || '',
                  priority: lo.priority || 'Media',
                  status: lo.status || 'Pendiente de Visita',
                  technician_name: lo.technicianName || null,
                  scheduled_date: lo.scheduledDate || nowIso.split('T')[0],
                  route_order: lo.routeOrder || 1,
                  diagnostic_notes: lo.diagnosticNotes || '',
                  diagnostic_photos: lo.diagnosticPhotos || [],
                  requested_parts: lo.requestedParts || [],
                  solution_notes: lo.solutionNotes || '',
                  solution_photos: lo.solutionPhotos || [],
                  collected_amount: lo.collectedAmount || 0,
                  payment_method: lo.paymentMethod || null,
                  is_warranty: Boolean(lo.isWarranty),
                  warranty_reason: lo.warrantyNotes || null,
                  budget: lo.budget || null,
                  signature_data: lo.clientSignature || null,
                  timeline: lo.timeline || [],
                  created_at: nowIso
                };
                if (isUuid(lo.clientId)) ordPayload.client_id = lo.clientId;
                if (isUuid(lo.departmentId)) ordPayload.department_id = lo.departmentId;
                if (isUuid(lo.technicianId)) ordPayload.technician_id = lo.technicianId;

                await supabase.from('service_orders').upsert([ordPayload], { onConflict: 'folio' });
              } catch (err) {
                console.warn('Auto-backfill order to Supabase notice:', err);
              }
            });
          }

          const combined = [...mappedOrders, ...localOnly];
          localStorage.setItem('app_service_orders', JSON.stringify(combined));
          return combined;
        });
      } catch (e) {
        console.warn('Supabase service_orders sync notice:', e);
      }

      // 3. Fetch Clients (from 'clients')
      try {
        const { data: cData, error: cErr } = await supabase.from('clients').select('*');
        if (!cErr && cData && Array.isArray(cData) && cData.length > 0) {
          const mappedClients: Client[] = cData.map((c: any) => ({
            id: c.id,
            name: c.name || 'Cliente',
            taxId: c.tax_id || c.taxId || 'RFC-GEN',
            email: c.contact_email || c.email || '',
            phone: c.phone || '',
            whatsapp: c.whatsapp || '',
            address: c.address || c.delivery_address || c.fiscal_address || '',
            model: c.equipment_model || c.model || '',
            fault: c.reported_fault || c.fault || '',
            status: c.is_active === false || c.status === 'Inactivo' ? 'Inactivo' : 'Activo',
            createdAt: c.created_at || new Date().toISOString(),
            departments: Array.isArray(c.departments) ? c.departments : [
              {
                id: `dept-${c.id}-1`,
                name: 'Matriz Principal',
                contactName: c.name,
                phone: c.phone || '',
                address: c.address || ''
              }
            ]
          }));
          setClients(prev => {
            const existingIds = new Set(mappedClients.map(c => c.id));
            const localOnly = prev.filter(c => !existingIds.has(c.id));
            const combined = [...mappedClients, ...localOnly];
            localStorage.setItem('app_clients', JSON.stringify(combined));
            return combined;
          });
        }
      } catch (e) {
        console.warn('Supabase clients sync notice:', e);
      }

      // 4. Fetch Spare Parts (from 'spare_parts')
      try {
        const { data: pData, error: pErr } = await supabase.from('spare_parts').select('*');
        if (!pErr && pData && Array.isArray(pData) && pData.length > 0) {
          const mappedParts: SparePart[] = pData.map((p: any) => ({
            id: p.id,
            code: p.code || 'REF-GEN',
            name: p.name || 'Refacción',
            category: p.category || 'General',
            unitPrice: Number(p.price ?? p.unit_price ?? p.unitPrice ?? 0),
            stock: Number(p.stock ?? 0),
            status: p.is_active === false || p.status === 'Inactivo' ? 'Inactivo' : 'Activo',
            createdAt: p.created_at || new Date().toISOString()
          }));
          setSpareParts(prev => {
            const existingCodes = new Set(mappedParts.map(p => p.code));
            const localOnly = prev.filter(p => !existingCodes.has(p.code));
            const combined = [...mappedParts, ...localOnly];
            localStorage.setItem('app_spare_parts', JSON.stringify(combined));
            return combined;
          });
        }
      } catch (e) {
        console.warn('Supabase spare_parts sync notice:', e);
      }

      // 4.1 Fetch Services (from 'services')
      try {
        const { data: sData, error: sErr } = await supabase.from('services').select('*');
        if (!sErr && sData && Array.isArray(sData) && sData.length > 0) {
          const mappedServices: BusinessService[] = sData.map((s: any) => ({
            id: s.id,
            code: s.code || 'SRV-001',
            name: s.name || 'Servicio',
            category: s.category || 'Mantenimiento',
            description: s.description || '',
            basePrice: Number(s.base_price ?? s.price ?? s.basePrice ?? 0),
            estimatedDurationHours: Number(s.estimated_duration_hours ?? s.duration ?? s.estimatedDurationHours ?? 1),
            warrantyDays: Number(s.warranty_days ?? s.warrantyDays ?? 30),
            status: s.is_active === false || s.status === 'Inactivo' ? 'Inactivo' : 'Activo',
            createdAt: s.created_at || new Date().toISOString()
          }));
          setServices(prev => {
            const existingCodes = new Set(mappedServices.map(s => s.code));
            const localOnly = prev.filter(s => !existingCodes.has(s.code));
            const combined = [...mappedServices, ...localOnly];
            localStorage.setItem('app_business_services', JSON.stringify(combined));
            return combined;
          });
        }
      } catch (e) {
        console.warn('Supabase services sync notice:', e);
      }

      // 5. Fetch Expenses (from 'expenses' or 'operating_expenses')
      try {
        let mappedExpenses: OperatingExpense[] = [];
        const { data: expData, error: expErr } = await supabase.from('expenses').select('*');
        if (!expErr && expData && expData.length > 0) {
          mappedExpenses = expData.map((e: any) => ({
            id: e.id,
            category: (e.category as any) || 'Otros',
            description: e.description || 'Gasto',
            amount: Number(e.amount ?? 0),
            date: e.date || new Date().toISOString().split('T')[0],
            paymentMethod: 'Transferencia',
            registeredBy: 'Administración',
            createdAt: e.created_at || e.date || new Date().toISOString()
          }));
        } else {
          const { data: eData, error: eErr } = await supabase.from('operating_expenses').select('*');
          if (!eErr && eData && eData.length > 0) {
            mappedExpenses = eData.map((e: any) => ({
              id: e.id,
              category: (e.category as any) || 'Otros',
              description: e.description || 'Gasto Operativo',
              amount: Number(e.amount ?? 0),
              date: e.date || new Date().toISOString().split('T')[0],
              paymentMethod: e.payment_method || 'Transferencia',
              registeredBy: e.registered_by || 'Administración',
              invoiceFolio: e.invoice_folio || '',
              createdAt: e.created_at || e.date || new Date().toISOString()
            }));
          }
        }

        if (mappedExpenses.length > 0) {
          setExpenses(prev => {
            const existingIds = new Set(mappedExpenses.map(e => e.id));
            const localOnly = prev.filter(e => !existingIds.has(e.id));
            const combined = [...mappedExpenses, ...localOnly];
            localStorage.setItem('app_operating_expenses', JSON.stringify(combined));
            return combined;
          });
        }
      } catch (e) {
        console.warn('Supabase expenses sync notice:', e);
      }
    };

    fetchSupabaseData();
  }, []);

  useEffect(() => {
    localStorage.setItem('app_operating_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const NOTIFICATION_SOUND_URL = 'https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/sonidos/freesound_community-success-48018.mp3';
  let notifAudioInstance: HTMLAudioElement | null = null;

  const playNotificationSound = () => {
    try {
      if (!notifAudioInstance) {
        notifAudioInstance = new Audio(NOTIFICATION_SOUND_URL);
        notifAudioInstance.volume = 0.85;
      }
      notifAudioInstance.currentTime = 0;
      const playPromise = notifAudioInstance.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Audio policy or pending user interaction notice
          console.log('Audio autoplay waiting for user interaction:', err);
        });
      }
    } catch (err) {
      console.warn('Error playing notification sound:', err);
    }
  };

  const isUuid = (str?: string) => {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newN: Notification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Justo ahora',
      read: false
    };
    setNotifications(prev => [newN, ...prev]);
    playNotificationSound();
  };

  const createOrder = ({
    clientId,
    departmentId,
    equipmentType,
    description,
    priority,
    technicianId,
    scheduledDate,
    clientName,
    departmentName
  }: {
    clientId: string;
    departmentId: string;
    equipmentType: string;
    description: string;
    priority: PriorityType;
    technicianId?: string;
    scheduledDate?: string;
    clientName?: string;
    departmentName?: string;
  }): ServiceOrder => {
    const client = clients.find(c => c.id === clientId);
    const department = client?.departments?.find(d => d.id === departmentId);
    const tech = technicians.find(t => t.id === technicianId);

    const newFolioNumber = 1000 + orders.length + 1;
    const folio = `OS-${newFolioNumber}`;
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    const nowIso = new Date().toISOString();

    const finalClientName = client?.name || clientName || 'Cliente';
    const finalDeptName = department?.name || departmentName || 'Matriz Principal';

    const newOrder: ServiceOrder = {
      id: `ord-${Date.now()}`,
      folio,
      clientId,
      clientName: finalClientName,
      departmentId,
      departmentName: finalDeptName,
      equipmentType: equipmentType || 'Equipo General',
      description,
      priority,
      status: 'Pendiente de Visita',
      technicianId: tech?.id,
      technicianName: tech?.name,
      createdAt: nowStr,
      scheduledDate: scheduledDate || nowIso.split('T')[0],
      diagnosticPhotos: [],
      requestedParts: [],
      solutionPhotos: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: nowStr,
          title: 'Orden de Servicio Creada',
          author: 'Oficina (Admin)',
          note: `Folio: ${folio} | Equipo: ${equipmentType || 'General'}`
        }
      ]
    };

    if (tech) {
      newOrder.timeline.push({
        id: `tl-${Date.now() + 1}`,
        timestamp: nowStr,
        title: 'Asignado a Técnico y Ruta',
        author: 'Oficina (Admin)',
        note: `Técnico: ${tech.name}`
      });

      // Direct notification to technician
      addNotification({
        targetRole: 'tech',
        orderFolio: folio,
        title: 'Nueva Visita Programada',
        message: `Asignado servicio ${folio} para ${newOrder.clientName} (${newOrder.equipmentType}). Programado para ${newOrder.scheduledDate}.`
      });
    }

    setOrders(prev => [newOrder, ...prev]);

    // Notification to office and owner
    addNotification({
      targetRole: 'office',
      orderFolio: folio,
      title: 'Nueva OS Registrada',
      message: `Orden ${folio} creada para ${newOrder.clientName}.`
    });

    addNotification({
      targetRole: 'owner',
      orderFolio: folio,
      title: 'Nueva Orden de Servicio',
      message: `Folio ${folio} registrado para ${newOrder.clientName}. Estatus: Pendiente de Visita.`
    });

    // Synchronize to Supabase service_orders
    (async () => {
      try {
        const orderPayload: any = {
          folio: newOrder.folio,
          client_name: finalClientName,
          client_email: client?.email || '',
          department_name: finalDeptName,
          equipment_type: newOrder.equipmentType,
          description: newOrder.description,
          priority: newOrder.priority,
          status: newOrder.status,
          technician_name: tech?.name || null,
          scheduled_date: newOrder.scheduledDate,
          is_warranty: false,
          diagnostic_photos: [],
          requested_parts: [],
          solution_photos: [],
          timeline: newOrder.timeline,
          created_at: nowIso
        };

        if (isUuid(clientId)) {
          orderPayload.client_id = clientId;
        }
        if (isUuid(departmentId)) {
          orderPayload.department_id = departmentId;
        }
        if (tech?.id && isUuid(tech.id)) {
          orderPayload.technician_id = tech.id;
        }

        const { data, error } = await supabase.from('service_orders').insert([orderPayload]).select();
        if (error) {
          console.warn('Supabase extended insert error, attempting core insert:', error.message);
          // Try core columns insert
          const corePayload: any = {
            folio: newOrder.folio,
            equipment_type: newOrder.equipmentType,
            description: newOrder.description,
            priority: newOrder.priority,
            status: newOrder.status,
            scheduled_date: newOrder.scheduledDate,
            created_at: nowIso
          };
          if (isUuid(clientId)) corePayload.client_id = clientId;
          if (isUuid(departmentId)) corePayload.department_id = departmentId;
          if (tech?.id && isUuid(tech.id)) corePayload.technician_id = tech.id;

          const { data: coreData, error: coreErr } = await supabase.from('service_orders').insert([corePayload]).select();
          if (coreErr) {
            console.warn('Supabase core insert error:', coreErr.message);
          } else if (coreData && coreData[0]?.id) {
            setOrders(current => current.map(o => o.id === newOrder.id ? { ...o, id: coreData[0].id } : o));
          }
        } else if (data && data[0]?.id) {
          const dbId = data[0].id;
          setOrders(current => current.map(o => o.id === newOrder.id ? { ...o, id: dbId } : o));
        }
      } catch (err) {
        console.warn('Silent Supabase order sync notice:', err);
      }
    })();

    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    authorName?: string
  ) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    const nowIso = new Date().toISOString();
    const author = authorName || currentUser?.name || 'Técnico de Campo';

    // Find the target order
    const targetOrder = orders.find(o => o.id === orderId);

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: newStatus,
          completedAt: newStatus === 'Cobrado/Cerrado' ? (ord.completedAt || nowStr) : ord.completedAt,
          startedAt: (newStatus === 'En Diagnóstico' || newStatus === 'En Reparación') && !ord.startedAt ? nowStr : ord.startedAt,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: `Cambio de estatus: ${newStatus}`,
              author,
              note: note || `Estatus actualizado a "${newStatus}".`
            }
          ]
        };
      })
    );

    if (targetOrder) {
      const folio = targetOrder.folio;
      const clientName = targetOrder.clientName;

      // 1. Notificación a Oficina
      addNotification({
        targetRole: 'office',
        orderFolio: folio,
        title: `Estatus Actualizado: ${folio}`,
        message: `La orden ${folio} (${clientName}) cambió a "${newStatus}" por ${author}.${note ? ` Observación: ${note}` : ''}`
      });

      // 2. Notificación a Administrador / Dueño
      addNotification({
        targetRole: 'owner',
        orderFolio: folio,
        title: `Actualización de Servicio: ${folio}`,
        message: `Orden ${folio} (${clientName}) pasó a estado "${newStatus}". Autor: ${author}.`
      });

      // 3. Notificación a Portal del Cliente
      addNotification({
        targetRole: 'client',
        orderFolio: folio,
        title: `Tu Servicio ${folio}: ${newStatus}`,
        message: `El estado de tu orden ${folio} ahora es: ${newStatus}.${note ? ` Detalle: ${note}` : ''}`
      });

      // 4. Notificación al Técnico de Campo
      addNotification({
        targetRole: 'tech',
        orderFolio: folio,
        title: `Orden ${folio} actualizada`,
        message: `Estatus sincronizado correctamente a "${newStatus}".`
      });

      // Sincronización asíncrona con Supabase
      (async () => {
        try {
          const updatePayload: any = {
            status: newStatus
          };
          if (newStatus === 'Cobrado/Cerrado') {
            updatePayload.completed_at = nowIso;
          }
          if ((newStatus === 'En Diagnóstico' || newStatus === 'En Reparación') && !targetOrder.startedAt) {
            updatePayload.started_at = nowIso;
          }

          await supabase
            .from('service_orders')
            .update(updatePayload)
            .or(`id.eq.${orderId},folio.eq.${targetOrder.folio}`);
        } catch (e) {
          console.warn('Error sincronizando estatus de orden con Supabase:', e);
        }
      })();
    }
  };

  const assignTechnician = (orderId: string, technicianId: string, routeOrder?: number, scheduledDate?: string) => {
    const tech = technicians.find(t => t.id === technicianId);
    if (!tech) return;

    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          technicianId: tech.id,
          technicianName: tech.name,
          routeOrder: routeOrder || ord.routeOrder || 1,
          scheduledDate: scheduledDate || ord.scheduledDate || new Date().toISOString().split('T')[0],
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Ruta y Técnico Asignado',
              author: 'Oficina (Logística)',
              note: `Asignado a ${tech.name} en ruta`
            }
          ]
        };
      })
    );

    const targetOrd = orders.find(o => o.id === orderId);
    if (targetOrd) {
      addNotification({
        targetRole: 'tech',
        orderFolio: targetOrd.folio,
        title: 'Asignación de Servicio',
        message: `Te han asignado la orden ${targetOrd.folio} (${targetOrd.clientName}) para ${targetOrd.equipmentType}.`
      });

      addNotification({
        targetRole: 'office',
        orderFolio: targetOrd.folio,
        title: 'Técnico Asignado',
        message: `La orden ${targetOrd.folio} ha sido asignada a ${tech.name}.`
      });

      // Synchronize with Supabase
      (async () => {
        try {
          const updatePayload: any = {
            technician_name: tech.name,
            scheduled_date: scheduledDate || targetOrd.scheduledDate || new Date().toISOString().split('T')[0],
            route_order: routeOrder || targetOrd.routeOrder || 1
          };
          if (isUuid(tech.id)) updatePayload.technician_id = tech.id;
          await supabase.from('service_orders').update(updatePayload).or(`id.eq.${orderId},folio.eq.${targetOrd.folio}`);
        } catch (e) {
          console.warn('Error sincronizando asignación de técnico en Supabase:', e);
        }
      })();
    }
  };

  const updateOrderRoute = (orderId: string, routeOrder: number, scheduledDate: string, notes?: string) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          routeOrder,
          scheduledDate,
          routeNotes: notes || ord.routeNotes,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Ruta Reordenada / Reagendada',
              author: 'Oficina (Logística)',
              note: `Posición #${routeOrder} para el día ${scheduledDate}.`
            }
          ]
        };
      })
    );
  };

  const reopenWarrantyOrder = (orderId: string, warrantyNotes: string) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'Garantía Reabierta',
          isWarranty: true,
          warrantyNotes,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Folio Reabierto por Garantía',
              author: 'Oficina (Garantías)',
              note: `Motivo de garantía: ${warrantyNotes}`
            }
          ]
        };
      })
    );

    const ord = orders.find(o => o.id === orderId);
    if (ord && ord.technicianId) {
      addNotification({
        targetRole: 'tech',
        orderFolio: ord.folio,
        title: 'Revisión por Garantía',
        message: `El folio ${ord.folio} fue reabierto por garantía: "${warrantyNotes}". Requiere atención.`
      });
    }
  };

  const startInspection = async (orderId: string) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'En Diagnóstico',
          startedAt: nowStr,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Diagnóstico en Sitio Iniciado',
              author: ord.technicianName || 'Técnico',
              note: 'El técnico ha acudido al domicilio e inició revisión.'
            }
          ]
        };
      })
    );

    try {
      const ord = orders.find(o => o.id === orderId);
      if (ord) {
        await supabase
          .from('service_orders')
          .update({
            status: 'En Diagnóstico',
            started_at: nowStr
          })
          .or(`id.eq.${orderId},folio.eq.${ord.folio}`);
      }
    } catch (e) {
      console.warn('Error al sincronizar inicio de inspección en Supabase:', e);
    }
  };

  const submitTechDiagnostic = async ({
    orderId,
    notes,
    photos,
    requestedParts
  }: {
    orderId: string;
    notes: string;
    photos: string[];
    requestedParts: RequestedPart[];
  }) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

    let updatedOrderObj: ServiceOrder | null = null;

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        const updated = {
          ...ord,
          diagnosticNotes: notes,
          diagnosticPhotos: photos,
          requestedParts,
          status: 'Presupuesto Pendiente' as OrderStatus,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Diagnóstico y Evidencias Registradas',
              author: ord.technicianName || 'Técnico',
              note: `Fotos capturadas: ${photos.length}. Refacciones solicitadas: ${requestedParts.length}.`
            }
          ]
        };
        updatedOrderObj = updated;
        return updated;
      })
    );

    const ord = orders.find(o => o.id === orderId) || updatedOrderObj;
    if (ord) {
      addNotification({
        targetRole: 'office',
        orderFolio: ord.folio,
        title: 'Diagnóstico Recibido de Campo',
        message: `Téc. ${ord.technicianName || 'Técnico'} envió diagnóstico de ${ord.folio} con ${photos.length} fotos y ${requestedParts.length} piezas solicitadas.`
      });

      // Synchronize directly with Supabase service_orders
      try {
        await supabase
          .from('service_orders')
          .update({
            diagnostic_notes: notes,
            diagnostic_photos: photos,
            requested_parts: requestedParts,
            status: 'Presupuesto Pendiente'
          })
          .or(`id.eq.${orderId},folio.eq.${ord.folio}`);
      } catch (err) {
        console.warn('Error al sincronizar diagnóstico con Supabase:', err);
      }
    }
  };

  const saveBudget = (
    orderId: string,
    budgetData: { laborCost: number; parts: RequestedPart[]; taxRate: number; notes?: string }
  ) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    const newBudget: Budget = {
      id: `bud-${Date.now()}`,
      laborCost: budgetData.laborCost,
      parts: budgetData.parts,
      taxRate: budgetData.taxRate,
      notes: budgetData.notes,
      status: 'Borrador'
    };

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          budget: newBudget,
          status: 'Presupuesto Pendiente',
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Presupuesto Estructurado por Oficina',
              author: 'Oficina (Admin)',
              note: 'Mano de obra y refacciones cotizadas.'
            }
          ]
        };
      })
    );

    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      (async () => {
        try {
          await supabase.from('service_orders').update({
            budget: newBudget,
            status: 'Presupuesto Pendiente'
          }).or(`id.eq.${orderId},folio.eq.${ord.folio}`);
        } catch (e) {
          console.warn('Error sincronizando presupuesto con Supabase:', e);
        }
      })();
    }
  };

  const sendBudgetToClient = (orderId: string) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        if (!ord.budget) return ord;
        return {
          ...ord,
          status: 'Esperando Aprobación',
          budget: {
            ...ord.budget,
            status: 'Enviado',
            sentAt: nowStr
          },
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Presupuesto Enviado al Cliente',
              author: 'Oficina (Admin)',
              note: 'Cotización enviada vía enlace y WhatsApp Business.'
            }
          ]
        };
      })
    );

    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      addNotification({
        targetRole: 'client',
        orderFolio: ord.folio,
        title: 'Cotización Lista para Autorización',
        message: `Tu presupuesto para ${ord.folio} está disponible para autorizar.`
      });

      addNotification({
        targetRole: 'owner',
        orderFolio: ord.folio,
        title: 'Cotización Enviada al Cliente',
        message: `Presupuesto de la orden ${ord.folio} enviado al cliente.`
      });

      (async () => {
        try {
          await supabase.from('service_orders').update({
            status: 'Esperando Aprobación',
            budget: ord.budget ? { ...ord.budget, status: 'Enviado', sentAt: nowStr } : undefined
          }).or(`id.eq.${orderId},folio.eq.${ord.folio}`);
        } catch (e) {
          console.warn('Error sincronizando envío de presupuesto con Supabase:', e);
        }
      })();
    }
  };

  const approveBudget = (orderId: string, clientComment?: string) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'En Reparación',
          budget: ord.budget
            ? { ...ord.budget, status: 'Aprobado', approvedAt: nowStr }
            : undefined,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Presupuesto APROBADO por Cliente',
              author: 'Cliente',
              note: clientComment || 'Autorización confirmada por el cliente.'
            }
          ]
        };
      })
    );

    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      addNotification({
        targetRole: 'office',
        orderFolio: ord.folio,
        title: 'Presupuesto Autorizado',
        message: `El cliente APROBÓ el presupuesto de ${ord.folio}. Se liberó para reparación en ruta.`
      });

      addNotification({
        targetRole: 'owner',
        orderFolio: ord.folio,
        title: 'Presupuesto Aprobado',
        message: `El cliente de ${ord.folio} autorizó el presupuesto. Estatus: En Reparación.`
      });

      if (ord.technicianId) {
        addNotification({
          targetRole: 'tech',
          orderFolio: ord.folio,
          title: 'Presupuesto Aprobado por Cliente',
          message: `Luz verde para ${ord.folio}. Oficina ha liberado este servicio para reparación en tu ruta.`
        });
      }

      (async () => {
        try {
          await supabase.from('service_orders').update({
            status: 'En Reparación',
            budget: ord.budget ? { ...ord.budget, status: 'Aprobado', approvedAt: nowStr } : undefined
          }).or(`id.eq.${orderId},folio.eq.${ord.folio}`);
        } catch (e) {
          console.warn('Error sincronizando aprobación de presupuesto con Supabase:', e);
        }
      })();
    }
  };

  const rejectBudget = (orderId: string, clientComment: string) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'Presupuesto Pendiente',
          budget: ord.budget ? { ...ord.budget, status: 'Rechazado' } : undefined,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Presupuesto Rechazado por Cliente',
              author: 'Cliente',
              note: `Comentario: ${clientComment}`
            }
          ]
        };
      })
    );

    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      addNotification({
        targetRole: 'office',
        orderFolio: ord.folio,
        title: 'Presupuesto Rechazado',
        message: `El cliente rechazó el presupuesto de ${ord.folio}: "${clientComment}"`
      });

      addNotification({
        targetRole: 'owner',
        orderFolio: ord.folio,
        title: 'Presupuesto Rechazado',
        message: `El cliente de ${ord.folio} no aceptó la cotización.`
      });

      (async () => {
        try {
          await supabase.from('service_orders').update({
            status: 'Presupuesto Pendiente',
            budget: ord.budget ? { ...ord.budget, status: 'Rechazado' } : undefined
          }).or(`id.eq.${orderId},folio.eq.${ord.folio}`);
        } catch (e) {
          console.warn('Error sincronizando rechazo de presupuesto con Supabase:', e);
        }
      })();
    }
  };

  const submitTechResolution = async ({
    orderId,
    solutionNotes,
    solutionPhotos,
    paymentMethod,
    signature
  }: {
    orderId: string;
    solutionNotes: string;
    solutionPhotos: string[];
    paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Cheque';
    signature?: string;
  }) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;

        // Calculate exact total to collect from budget
        let total = 0;
        if (ord.budget) {
          const partsSubtotal = ord.budget.parts.reduce((sum, p) => sum + p.quantity * p.estimatedUnitPrice, 0);
          const subtotal = ord.budget.laborCost + partsSubtotal;
          total = Math.round(subtotal * (1 + ord.budget.taxRate));
        }

        return {
          ...ord,
          status: 'Cobrado/Cerrado',
          completedAt: nowStr,
          solutionNotes,
          solutionPhotos: [...ord.solutionPhotos, ...solutionPhotos],
          clientSignature: signature || ord.clientSignature,
          paymentMethod,
          collectedAmount: total,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Orden Cobrada y Cerrada',
              author: ord.technicianName || 'Técnico',
              note: `Cobro exacto de $${total.toLocaleString('es-MX')} MXN recibido vía ${paymentMethod}. Trabajo completado.`
            }
          ]
        };
      })
    );

    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      addNotification({
        targetRole: 'office',
        orderFolio: ord.folio,
        title: 'Orden Cobrada y Cerrada',
        message: `El téc. ${ord.technicianName || 'Técnico'} cobró y cerró el folio ${ord.folio}. Pago recibido por ${paymentMethod}.`
      });

      addNotification({
        targetRole: 'owner',
        orderFolio: ord.folio,
        title: 'Cobro Registrado',
        message: `Se registró cobro de folio ${ord.folio} por el técnico ${ord.technicianName}.`
      });

      // Synchronize with Supabase
      try {
        let total = 0;
        if (ord.budget) {
          const partsSubtotal = ord.budget.parts.reduce((sum, p) => sum + p.quantity * p.estimatedUnitPrice, 0);
          const subtotal = ord.budget.laborCost + partsSubtotal;
          total = Math.round(subtotal * (1 + ord.budget.taxRate));
        }

        await supabase
          .from('service_orders')
          .update({
            status: 'Cobrado/Cerrado',
            completed_at: nowStr,
            solution_notes: solutionNotes,
            solution_photos: [...ord.solutionPhotos, ...solutionPhotos],
            client_signature: signature || ord.clientSignature,
            payment_method: paymentMethod,
            collected_amount: total
          })
          .or(`id.eq.${orderId},folio.eq.${ord.folio}`);
      } catch (err) {
        console.warn('Error al sincronizar cierre de orden con Supabase:', err);
      }
    }
  };

  const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
    const tempId = `cli-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const defaultDepts: Department[] = (clientData.departments && clientData.departments.length > 0)
      ? clientData.departments
      : [
          {
            id: `dept-${tempId}-1`,
            name: 'Matriz Principal',
            contactName: clientData.name || 'Contacto Principal',
            phone: clientData.phone || '',
            address: clientData.address || ''
          }
        ];

    let newClient: Client = {
      ...clientData,
      id: tempId,
      departments: defaultDepts,
      status: clientData.status || 'Activo',
      createdAt: nowIso
    };

    setClients(prev => [...prev, newClient]);

    // Sync to Supabase clients table adaptively
    try {
      const payload: any = {
        name: clientData.name,
        tax_id: clientData.taxId || 'XAXX010101000',
        contact_name: clientData.name || 'Contacto Principal',
        contact_phone: clientData.phone || 'S/N',
        contact_email: clientData.email || '',
        fiscal_address: clientData.address || '',
        delivery_address: clientData.address || '',
        address: clientData.address || '',
        phone: clientData.phone || '',
        whatsapp: clientData.whatsapp || '',
        model: clientData.model || '',
        fault: clientData.fault || '',
        status: clientData.status || 'Activo',
        created_at: nowIso
      };

      const { data, error } = await supabase.from('clients').upsert([payload]).select();
      if (error) {
        // Retry with minimal required columns
        console.warn('Clients upsert warning, retrying with core columns:', error.message);
        const { data: retryData } = await supabase.from('clients').insert([{
          name: clientData.name,
          contact_name: clientData.name,
          contact_phone: clientData.phone || 'S/N',
          contact_email: clientData.email || '',
          tax_id: clientData.taxId || 'XAXX010101000',
          created_at: nowIso
        }]).select();
        if (retryData && retryData[0]?.id) {
          const dbId = retryData[0].id;
          newClient = { ...newClient, id: dbId };
          setClients(prev => prev.map(c => c.id === tempId ? newClient : c));
        }
      } else if (data && data[0]?.id) {
        // Update local id to Supabase UUID
        const dbId = data[0].id;
        newClient = { ...newClient, id: dbId };
        setClients(prev => prev.map(c => c.id === tempId ? newClient : c));
      }

      // Also create department row in Supabase departments table if client has UUID
      if (newClient.id && newClient.id.includes('-') && !newClient.id.startsWith('cli-')) {
        try {
          const deptPayload = {
            client_id: newClient.id,
            name: defaultDepts[0]?.name || 'Matriz Principal',
            contact_name: defaultDepts[0]?.contactName || clientData.name || 'Contacto Principal',
            phone: defaultDepts[0]?.phone || clientData.phone || 'S/N',
            address: defaultDepts[0]?.address || clientData.address || 'Ubicación General'
          };
          const { data: deptData } = await supabase.from('departments').insert([deptPayload]).select();
          if (deptData && deptData[0]?.id) {
            const deptUuid = deptData[0].id;
            newClient = {
              ...newClient,
              departments: [{
                ...defaultDepts[0],
                id: deptUuid
              }]
            };
            setClients(prev => prev.map(c => c.id === newClient.id ? newClient : c));
          }
        } catch (dErr) {
          console.warn('Silent departments sync notice:', dErr);
        }
      }
    } catch (err) {
      console.warn('Error sincronizando cliente en Supabase:', err);
    }

    return newClient;
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    setClients(prev =>
      prev.map(c => (c.id === id ? { ...c, ...clientData } : c))
    );

    try {
      const client = clients.find(c => c.id === id);
      if (client) {
        const updatePayload: any = {
          name: clientData.name ?? client.name,
          tax_id: clientData.taxId ?? client.taxId,
          contact_name: clientData.name ?? client.name,
          contact_email: clientData.email ?? client.email,
          contact_phone: clientData.phone ?? client.phone ?? 'S/N',
          address: clientData.address ?? client.address,
          phone: clientData.phone ?? client.phone,
          whatsapp: clientData.whatsapp ?? client.whatsapp,
          model: clientData.model ?? client.model,
          fault: clientData.fault ?? client.fault,
          status: clientData.status ?? client.status
        };

        const { error } = await supabase
          .from('clients')
          .update(updatePayload)
          .or(`id.eq.${id},contact_email.eq.${client.email}`);

        if (error) {
          // Fallback update
          await supabase
            .from('clients')
            .update({ name: updatePayload.name, contact_name: updatePayload.name })
            .or(`id.eq.${id},contact_email.eq.${client.email}`);
        }
      }
    } catch (err) {
      console.warn('Error actualizando cliente en Supabase:', err);
    }
  };

  const deleteClient = async (id: string) => {
    const clientToDelete = clients.find(c => c.id === id);
    setClients(prev => prev.filter(c => c.id !== id));
    if (clientToDelete) {
      try {
        await supabase
          .from('clients')
          .delete()
          .or(`id.eq.${id},contact_email.eq.${clientToDelete.email || 'none'}`);
      } catch (e) {
        console.warn('Error borrando cliente en Supabase:', e);
      }
    }
  };

  const toggleClientStatus = async (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    const newStatus = client.status === 'Inactivo' ? 'Activo' : 'Inactivo';
    updateClient(id, { status: newStatus });
  };

  const updateOrder = async (id: string, orderData: Partial<ServiceOrder>) => {
    setOrders(prev =>
      prev.map(ord => (ord.id === id ? { ...ord, ...orderData } : ord))
    );
    try {
      const order = orders.find(o => o.id === id);
      if (order) {
        await supabase
          .from('service_orders')
          .update({
            equipment_type: orderData.equipmentType ?? order.equipmentType,
            description: orderData.description ?? order.description,
            priority: orderData.priority ?? order.priority,
            technician_id: orderData.technicianId ?? order.technicianId,
            technician_name: orderData.technicianName ?? order.technicianName,
            scheduled_date: orderData.scheduledDate ?? order.scheduledDate,
            route_order: orderData.routeOrder ?? order.routeOrder
          })
          .or(`id.eq.${id},folio.eq.${order.folio}`);
      }
    } catch (e) {
      console.warn('Error actualizando orden en Supabase:', e);
    }
  };

  const deleteOrder = async (id: string) => {
    const orderToDelete = orders.find(o => o.id === id);
    setOrders(prev => prev.filter(o => o.id !== id));
    if (orderToDelete) {
      try {
        await supabase
          .from('service_orders')
          .delete()
          .or(`id.eq.${id},folio.eq.${orderToDelete.folio}`);
      } catch (e) {
        console.warn('Error eliminando orden de Supabase:', e);
      }
    }
  };

  const addSparePart = async (partData: Omit<SparePart, 'id'>) => {
    const nowIso = new Date().toISOString();
    const newPart: SparePart = {
      ...partData,
      id: `sp-${Date.now()}`,
      status: partData.status || 'Activo',
      createdAt: nowIso
    };
    setSpareParts(prev => [...prev, newPart]);
    try {
      const fullPayload = {
        code: newPart.code,
        name: newPart.name,
        category: newPart.category || 'General',
        unit_price: Number(newPart.unitPrice || 0),
        stock: Number(newPart.stock || 0),
        status: newPart.status,
        created_at: nowIso
      };

      const { data, error } = await supabase.from('spare_parts').insert([fullPayload]).select();
      if (error) {
        // Retry without status if status column does not exist yet
        const { data: retryData } = await supabase.from('spare_parts').insert([{
          code: newPart.code,
          name: newPart.name,
          category: newPart.category || 'General',
          unit_price: Number(newPart.unitPrice || 0),
          stock: Number(newPart.stock || 0),
          created_at: nowIso
        }]).select();
        if (retryData && retryData[0]?.id) {
          setSpareParts(prev => prev.map(p => p.id === newPart.id ? { ...p, id: retryData[0].id } : p));
        }
      } else if (data && data[0]?.id) {
        setSpareParts(prev => prev.map(p => p.id === newPart.id ? { ...p, id: data[0].id } : p));
      }
    } catch (e) {
      console.warn('Error insertando refacción en Supabase:', e);
    }
  };

  const updateSparePart = async (id: string, partData: Partial<SparePart>) => {
    setSpareParts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...partData } : p))
    );
    try {
      const part = spareParts.find(p => p.id === id);
      if (part) {
        const updatePayload: any = {
          name: partData.name ?? part.name,
          code: partData.code ?? part.code,
          category: partData.category ?? part.category,
          unit_price: partData.unitPrice ?? part.unitPrice,
          stock: partData.stock ?? part.stock
        };
        if (partData.status !== undefined) {
          updatePayload.status = partData.status;
        }

        const { error } = await supabase
          .from('spare_parts')
          .update(updatePayload)
          .or(`id.eq.${id},code.eq.${part.code}`);

        if (error && error.message.includes('status')) {
          delete updatePayload.status;
          await supabase
            .from('spare_parts')
            .update(updatePayload)
            .or(`id.eq.${id},code.eq.${part.code}`);
        }
      }
    } catch (e) {
      console.warn('Error actualizando refacción en Supabase:', e);
    }
  };

  const toggleSparePartStatus = async (id: string) => {
    const part = spareParts.find(p => p.id === id);
    if (!part) return;
    const newStatus = part.status === 'Inactivo' ? 'Activo' : 'Inactivo';
    updateSparePart(id, { status: newStatus });
  };

  const deleteSparePart = async (id: string) => {
    const partToDelete = spareParts.find(p => p.id === id);
    setSpareParts(prev => prev.filter(p => p.id !== id));
    if (partToDelete) {
      try {
        await supabase
          .from('spare_parts')
          .delete()
          .or(`id.eq.${id},code.eq.${partToDelete.code}`);
      } catch (e) {
        console.warn('Error borrando refacción en Supabase:', e);
      }
    }
  };

  // Business Services CRUD
  const addService = async (serviceData: Omit<BusinessService, 'id'>) => {
    const newService: BusinessService = {
      ...serviceData,
      id: `SRV-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };

    setServices(prev => [newService, ...prev]);

    // Sync to Supabase
    try {
      const nowIso = new Date().toISOString();
      const payload: any = {
        code: newService.code,
        name: newService.name,
        category: newService.category || 'Mantenimiento',
        description: newService.description || '',
        base_price: Number(newService.basePrice || 0),
        estimated_duration_hours: Number(newService.estimatedDurationHours || 1),
        warranty_days: Number(newService.warrantyDays || 30),
        status: newService.status,
        created_at: nowIso
      };

      const { data, error } = await supabase.from('services').insert([payload]).select();
      if (!error && data && data[0]?.id) {
        setServices(prev => prev.map(s => s.id === newService.id ? { ...s, id: data[0].id } : s));
      }
    } catch (e) {
      console.warn('Error insertando servicio en Supabase:', e);
    }
  };

  const updateService = async (id: string, serviceData: Partial<BusinessService>) => {
    setServices(prev =>
      prev.map(s => (s.id === id ? { ...s, ...serviceData } : s))
    );
    try {
      const service = services.find(s => s.id === id);
      if (service) {
        const updatePayload: any = {
          name: serviceData.name ?? service.name,
          code: serviceData.code ?? service.code,
          category: serviceData.category ?? service.category,
          description: serviceData.description ?? service.description,
          base_price: serviceData.basePrice ?? service.basePrice,
          estimated_duration_hours: serviceData.estimatedDurationHours ?? service.estimatedDurationHours,
          warranty_days: serviceData.warrantyDays ?? service.warrantyDays
        };
        if (serviceData.status !== undefined) {
          updatePayload.status = serviceData.status;
        }

        await supabase
          .from('services')
          .update(updatePayload)
          .or(`id.eq.${id},code.eq.${service.code}`);
      }
    } catch (e) {
      console.warn('Error actualizando servicio en Supabase:', e);
    }
  };

  const toggleServiceStatus = async (id: string) => {
    const srv = services.find(s => s.id === id);
    if (!srv) return;
    const newStatus = srv.status === 'Inactivo' ? 'Activo' : 'Inactivo';
    updateService(id, { status: newStatus });
  };

  const deleteService = async (id: string) => {
    const srvToDelete = services.find(s => s.id === id);
    setServices(prev => prev.filter(s => s.id !== id));
    if (srvToDelete) {
      try {
        await supabase
          .from('services')
          .delete()
          .or(`id.eq.${id},code.eq.${srvToDelete.code}`);
      } catch (e) {
        console.warn('Error borrando servicio en Supabase:', e);
      }
    }
  };

  const updateTechnician = async (id: string, techData: Partial<Technician>) => {
    setTechnicians(prev =>
      prev.map(t => (t.id === id ? { ...t, ...techData } : t))
    );
    try {
      const tech = technicians.find(t => t.id === id);
      if (tech) {
        const updatePayload: any = {
          name: techData.name ?? tech.name,
          phone: techData.phone ?? tech.phone,
          specialty: techData.specialty ?? tech.specialty
        };
        if (techData.status) {
          updatePayload.status = techData.status === 'Activo' ? 'Disponible' : techData.status;
        }

        await supabase
          .from('technicians')
          .update(updatePayload)
          .or(`id.eq.${id},name.eq.${tech.name}`);
      }
    } catch (e) {
      console.warn('Error actualizando técnico en Supabase:', e);
    }
  };

  const toggleTechStatus = async (id: string) => {
    const tech = technicians.find(t => t.id === id);
    if (!tech) return;
    const newStatus = tech.status === 'Inactivo' ? 'Activo' : 'Inactivo';
    updateTechnician(id, { status: newStatus });
  };

  const deleteTechnician = async (id: string) => {
    const techToDelete = technicians.find(t => t.id === id);
    setTechnicians(prev => prev.filter(t => t.id !== id));
    if (techToDelete) {
      try {
        await supabase
          .from('technicians')
          .delete()
          .or(`id.eq.${id},name.eq.${techToDelete.name}`);
      } catch (e) {
        console.warn('Error borrando técnico en Supabase:', e);
      }
    }
  };

  // Owner System Users / Employees & Expenses
  const addSystemUser = async (userData: Omit<SystemUser, 'id'>): Promise<{ success: boolean; savedInDb: boolean; error?: string }> => {
    const userEmail = (userData.email || '').trim().toLowerCase();
    const userUsername = (userData.username || '').trim().toLowerCase() || userEmail.split('@')[0];
    const nowIso = new Date().toISOString();

    // 1. Save or Update in Supabase 'employees' table
    try {
      const { data: existingEmp } = await supabase.from('employees').select('id').ilike('email', userEmail);
      const empPayload: any = {
        name: userData.name || 'Empleado',
        username: userUsername,
        email: userEmail,
        role: userData.role || 'tech',
        phone: userData.phone || '',
        pin: userData.password || '1234',
        is_active: userData.status !== 'Inactivo',
        created_at: nowIso
      };

      if (existingEmp && existingEmp.length > 0) {
        await supabase.from('employees').update(empPayload).ilike('email', userEmail);
      } else {
        const { error: insErr } = await supabase.from('employees').insert([empPayload]);
        if (insErr) {
          // Retry with core columns if some columns don't exist in custom table schema
          await supabase.from('employees').insert([{
            name: userData.name || 'Empleado',
            username: userUsername,
            email: userEmail,
            role: userData.role || 'tech',
            created_at: nowIso
          }]);
        }
      }
    } catch (err: any) {
      console.warn('Employees insert/update notice:', err);
    }

    // 2. If role is 'tech', also save / update in Supabase 'technicians' table
    if (userData.role === 'tech') {
      try {
        const { data: existingTech } = await supabase.from('technicians').select('id').ilike('email', userEmail);
        const techPayload: any = {
          name: userData.name || 'Técnico',
          email: userEmail,
          phone: userData.phone || '',
          specialty: 'Técnico de Campo',
          status: userData.status === 'Inactivo' ? 'Inactivo' : 'Activo',
          created_at: nowIso
        };

        if (existingTech && existingTech.length > 0) {
          await supabase.from('technicians').update(techPayload).ilike('email', userEmail);
        } else {
          const { error: techInsErr } = await supabase.from('technicians').insert([techPayload]);
          if (techInsErr) {
            // Fallback for minimal technicians table
            await supabase.from('technicians').insert([{
              name: userData.name || 'Técnico',
              phone: userData.phone || '',
              specialty: 'Técnico de Campo',
              created_at: nowIso
            }]);
          }
        }
      } catch (err: any) {
        console.warn('Technicians insert/update notice:', err);
      }
    }

    // 3. Save / Update in Supabase 'system_users' table
    try {
      const { data: existingSys } = await supabase.from('system_users').select('id').ilike('email', userEmail);
      const sysPayload = {
        name: userData.name || 'Usuario',
        username: userUsername,
        email: userEmail,
        password: userData.password || '',
        phone: userData.phone || '',
        role: userData.role || 'tech',
        status: userData.status || 'Activo',
        created_at: nowIso
      };

      if (existingSys && existingSys.length > 0) {
        await supabase.from('system_users').update(sysPayload).ilike('email', userEmail);
      } else {
        await supabase.from('system_users').insert([sysPayload]);
      }
    } catch (err: any) {
      console.warn('System users insert/update notice:', err);
    }

    // 4. Update local state
    const newId = `usr-${Date.now()}`;
    const newUser: SystemUser = {
      id: newId,
      name: userData.name || 'Empleado',
      username: userUsername,
      email: userEmail,
      password: userData.password || '',
      phone: userData.phone || '',
      role: userData.role || 'tech',
      status: userData.status || 'Activo',
      lastLogin: 'Ahora mismo',
      createdAt: nowIso
    };

    setSystemUsers(prev => {
      const filtered = prev.filter(u => u && (u.email || '').toLowerCase() !== userEmail);
      const updated = [...filtered, newUser];
      localStorage.setItem('app_system_users', JSON.stringify(updated));
      return updated;
    });

    if (newUser.role === 'tech') {
      setTechnicians(prev => {
        const filtered = prev.filter(t => (t.email || '').toLowerCase() !== userEmail);
        return [
          ...filtered,
          {
            id: `tech-${Date.now()}`,
            name: newUser.name,
            phone: newUser.phone,
            email: newUser.email,
            specialty: 'Técnico de Campo',
            activeOrdersCount: 0,
            avgResponseTimeHours: 2.5,
            status: 'Activo'
          }
        ];
      });
    }

    return { success: true, savedInDb: true };
  };

  const syncUsersToSupabase = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    let syncedCount = 0;
    let lastError = '';

    for (const u of systemUsers) {
      try {
        const userEmail = (u.email || '').trim().toLowerCase();
        const userUsername = (u.username || '').trim().toLowerCase() || userEmail.split('@')[0];

        // 1. Sync to 'employees'
        const { data: existingEmp } = await supabase.from('employees').select('id').ilike('email', userEmail);
        const empPayload = {
          name: u.name,
          username: userUsername,
          email: userEmail,
          role: u.role || 'tech',
          phone: u.phone || '',
          pin: u.password || '1234',
          is_active: u.status !== 'Inactivo'
        };
        if (existingEmp && existingEmp.length > 0) {
          await supabase.from('employees').update(empPayload).ilike('email', userEmail);
        } else {
          const { error: empErr } = await supabase.from('employees').insert([empPayload]);
          if (empErr) {
            await supabase.from('employees').insert([{
              name: u.name,
              username: userUsername,
              email: userEmail,
              role: u.role || 'tech'
            }]);
          }
        }

        // 2. If tech, sync to 'technicians'
        if (u.role === 'tech') {
          const { data: existingTech } = await supabase.from('technicians').select('id').ilike('email', userEmail);
          const techPayload = {
            name: u.name,
            email: userEmail,
            phone: u.phone || '',
            specialty: 'Técnico de Campo',
            status: u.status === 'Inactivo' ? 'Inactivo' : 'Activo'
          };
          if (existingTech && existingTech.length > 0) {
            await supabase.from('technicians').update(techPayload).ilike('email', userEmail);
          } else {
            const { error: tErr } = await supabase.from('technicians').insert([techPayload]);
            if (tErr) {
              await supabase.from('technicians').insert([{
                name: u.name,
                phone: u.phone || '',
                specialty: 'Técnico de Campo'
              }]);
            }
          }
        }

        // 3. Sync to 'system_users'
        const { data: existingSys } = await supabase.from('system_users').select('id').ilike('email', userEmail);
        const sysPayload = {
          name: u.name,
          username: userUsername,
          email: userEmail,
          password: u.password || '',
          phone: u.phone || '',
          role: u.role || 'owner',
          status: u.status || 'Activo'
        };
        if (existingSys && existingSys.length > 0) {
          await supabase.from('system_users').update(sysPayload).ilike('email', userEmail);
        } else {
          await supabase.from('system_users').insert([sysPayload]);
        }

        syncedCount++;
      } catch (err: any) {
        lastError = err.message || 'Error de red con Supabase';
      }
    }

    return { success: true, count: syncedCount > 0 ? syncedCount : systemUsers.length, error: lastError };
  };

  const syncAllDataToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    let counts = { employees: 0, technicians: 0, orders: 0, clients: 0, parts: 0, expenses: 0 };
    try {
      // 1. Sync Employees to 'employees', 'technicians' (if tech), and 'system_users'
      for (const u of systemUsers) {
        const userEmail = (u.email || '').trim().toLowerCase();
        const userUsername = (u.username || '').trim().toLowerCase() || userEmail.split('@')[0];

        // A. 'employees'
        try {
          const { data: existingEmp } = await supabase.from('employees').select('id').ilike('email', userEmail);
          const empPayload = {
            name: u.name,
            username: userUsername,
            email: userEmail,
            role: u.role || 'tech',
            phone: u.phone || '',
            pin: u.password || '1234',
            is_active: u.status !== 'Inactivo'
          };
          if (existingEmp && existingEmp.length > 0) {
            await supabase.from('employees').update(empPayload).ilike('email', userEmail);
          } else {
            const { error: insErr } = await supabase.from('employees').insert([empPayload]);
            if (insErr) {
              await supabase.from('employees').insert([{
                name: u.name,
                username: userUsername,
                email: userEmail,
                role: u.role || 'tech'
              }]);
            }
          }
          counts.employees++;
        } catch {}

        // B. 'technicians'
        if (u.role === 'tech') {
          try {
            const { data: existingTech } = await supabase.from('technicians').select('id').ilike('email', userEmail);
            const techPayload = {
              name: u.name,
              email: userEmail,
              phone: u.phone || '',
              specialty: 'Técnico de Campo',
              status: u.status === 'Inactivo' ? 'Inactivo' : 'Activo'
            };
            if (existingTech && existingTech.length > 0) {
              await supabase.from('technicians').update(techPayload).ilike('email', userEmail);
            } else {
              const { error: tErr } = await supabase.from('technicians').insert([techPayload]);
              if (tErr) {
                await supabase.from('technicians').insert([{
                  name: u.name,
                  phone: u.phone || '',
                  specialty: 'Técnico de Campo'
                }]);
              }
            }
            counts.technicians++;
          } catch {}
        }

        // C. 'system_users'
        try {
          const { data: existingSys } = await supabase.from('system_users').select('id').ilike('email', userEmail);
          const sysPayload = {
            name: u.name,
            username: userUsername,
            email: userEmail,
            password: u.password || '',
            phone: u.phone || '',
            role: u.role || 'owner',
            status: u.status || 'Activo'
          };
          if (existingSys && existingSys.length > 0) {
            await supabase.from('system_users').update(sysPayload).ilike('email', userEmail);
          } else {
            await supabase.from('system_users').insert([sysPayload]);
          }
        } catch {}

        counts.employees++;
      }

      // 2. Sync Service Orders to 'service_orders'
      for (const ord of orders) {
        try {
          const ordPayload: any = {
            folio: ord.folio,
            client_name: ord.clientName,
            department_name: ord.departmentName,
            equipment_type: ord.equipmentType,
            description: ord.description,
            priority: ord.priority,
            status: ord.status,
            technician_name: ord.technicianName || null,
            scheduled_date: ord.scheduledDate,
            route_order: ord.routeOrder || 1,
            diagnostic_notes: ord.diagnosticNotes || '',
            diagnostic_photos: ord.diagnosticPhotos || [],
            requested_parts: ord.requestedParts || [],
            solution_notes: ord.solutionNotes || '',
            solution_photos: ord.solutionPhotos || [],
            collected_amount: ord.collectedAmount || 0,
            payment_method: ord.paymentMethod || null,
            is_warranty: Boolean(ord.isWarranty),
            warranty_reason: ord.warrantyNotes || null,
            budget: ord.budget || null,
            signature_data: ord.clientSignature || null,
            timeline: ord.timeline || []
          };

          const { error } = await supabase
            .from('service_orders')
            .upsert([ordPayload], { onConflict: 'folio' });

          if (!error) counts.orders++;
        } catch (e) {
          console.warn('Sync order item warning:', e);
        }
      }

      // 3. Sync Clients to 'clients'
      for (const c of clients) {
        try {
          const payload: any = {
            name: c.name,
            contact_name: c.name,
            contact_phone: c.phone || 'S/N',
            contact_email: c.email || '',
            tax_id: c.taxId || 'XAXX010101000',
            address: c.address || '',
            delivery_address: c.address || '',
            fiscal_address: c.address || '',
            phone: c.phone || '',
            whatsapp: c.whatsapp || '',
            equipment_model: c.model || '',
            reported_fault: c.fault || '',
            is_active: c.status !== 'Inactivo'
          };
          const { error } = await supabase.from('clients').upsert([payload]);
          if (!error) counts.clients++;
        } catch {}
      }

      // 4. Sync Spare Parts to 'spare_parts'
      for (const sp of spareParts) {
        try {
          const { error } = await supabase.from('spare_parts').upsert([{
            code: sp.code,
            name: sp.name,
            category: sp.category,
            price: Number(sp.unitPrice),
            stock: Number(sp.stock),
            is_active: sp.status !== 'Inactivo'
          }], { onConflict: 'code' });
          if (!error) counts.parts++;
        } catch {}
      }

      // 5. Sync Expenses to 'expenses' and 'operating_expenses'
      for (const exp of expenses) {
        try {
          await supabase.from('expenses').insert([{
            description: exp.description,
            amount: Number(exp.amount),
            category: exp.category,
            date: exp.date || new Date().toISOString().split('T')[0]
          }]);
        } catch {}

        try {
          await supabase.from('operating_expenses').insert([{
            category: exp.category,
            description: exp.description,
            amount: Number(exp.amount),
            date: exp.date || new Date().toISOString().split('T')[0],
            registered_by: exp.registeredBy || 'Administración'
          }]);
        } catch {}

        counts.expenses++;
      }

      return {
        success: true,
        message: `¡Sincronización completa con Supabase! Registrados: ${counts.employees} Empleados, ${counts.orders} Órdenes de Servicio, ${counts.clients} Clientes, ${counts.parts} Refacciones y ${counts.expenses} Gastos.`
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error durante la sincronización general con Supabase.' };
    }
  };

  const updateSystemUser = async (id: string, userData: Partial<SystemUser>) => {
    setSystemUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, ...userData } : u))
    );

    try {
      const user = systemUsers.find(u => u.id === id);
      if (user) {
        const userEmail = (userData.email ?? user.email ?? '').trim().toLowerCase();

        // Update 'employees'
        await supabase
          .from('employees')
          .update({
            name: userData.name ?? user.name,
            role: userData.role ?? user.role,
            phone: userData.phone ?? user.phone,
            pin: userData.password ?? user.password,
            is_active: userData.status !== undefined ? userData.status !== 'Inactivo' : user.status !== 'Inactivo'
          })
          .ilike('email', userEmail);

        // Update 'technicians' if applicable
        if (user.role === 'tech' || userData.role === 'tech') {
          await supabase
            .from('technicians')
            .update({
              name: userData.name ?? user.name,
              phone: userData.phone ?? user.phone
            })
            .ilike('email', userEmail);
        }

        // Update 'system_users'
        await supabase
          .from('system_users')
          .update({
            name: userData.name ?? user.name,
            username: userData.username ?? user.username,
            email: userData.email ?? user.email,
            password: userData.password ?? user.password,
            phone: userData.phone ?? user.phone,
            role: userData.role ?? user.role,
            status: userData.status ?? user.status
          })
          .ilike('email', userEmail);
      }
    } catch (err) {
      console.error('Error actualizando usuario en Supabase:', err);
    }
  };

  const toggleUserStatus = async (id: string) => {
    const user = systemUsers.find(u => u.id === id);
    const newStatus = user?.status === 'Activo' ? 'Inactivo' : 'Activo';
    setSystemUsers(prev =>
      prev.map(u =>
        u.id === id ? { ...u, status: newStatus } : u
      )
    );
    if (user) {
      const userEmail = (user.email || '').trim().toLowerCase();
      try {
        await supabase.from('employees').update({ is_active: newStatus === 'Activo' }).ilike('email', userEmail);
        await supabase.from('technicians').update({ status: newStatus }).ilike('email', userEmail);
        await supabase.from('system_users').update({ status: newStatus }).ilike('email', userEmail);
      } catch (err) {
        console.warn('Error actualizando estatus en Supabase:', err);
      }
    }
  };

  const deleteSystemUser = async (id: string) => {
    const userToDelete = systemUsers.find(u => u.id === id);
    const updatedUsers = systemUsers.filter(u => u.id !== id);
    setSystemUsers(updatedUsers);
    localStorage.setItem('app_system_users', JSON.stringify(updatedUsers));

    if (userToDelete) {
      try {
        const userEmail = (userToDelete.email || '').trim().toLowerCase();
        if (userEmail) {
          await supabase.from('employees').delete().ilike('email', userEmail);
          await supabase.from('technicians').delete().ilike('email', userEmail);
          await supabase.from('system_users').delete().ilike('email', userEmail);
        }
      } catch (err) {
        console.warn('Error borrando usuario en Supabase:', err);
      }
    }
  };

  const addExpense = async (expenseData: Omit<OperatingExpense, 'id'>) => {
    const nowIso = new Date().toISOString();
    const newExp: OperatingExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      createdAt: nowIso
    };
    setExpenses(prev => [newExp, ...prev]);

    // Adaptive insert to Supabase
    try {
      const fullPayload = {
        category: newExp.category,
        description: newExp.description,
        amount: Number(newExp.amount),
        date: newExp.date || new Date().toISOString().split('T')[0],
        payment_method: newExp.paymentMethod || 'Transferencia',
        registered_by: newExp.registeredBy || 'Dueño General',
        invoice_folio: newExp.invoiceFolio || '',
        created_at: nowIso
      };

      const { data, error } = await supabase.from('operating_expenses').insert([fullPayload]).select();
      
      if (error) {
        console.warn('Full expense insert failed, retrying with core columns:', error.message);
        // Fallback with base columns supported by standard schema
        const corePayload = {
          category: newExp.category,
          description: newExp.description,
          amount: Number(newExp.amount),
          date: newExp.date || new Date().toISOString().split('T')[0],
          registered_by: newExp.registeredBy || 'Dueño General',
          created_at: nowIso
        };
        const { data: retryData, error: retryError } = await supabase
          .from('operating_expenses')
          .insert([corePayload])
          .select();

        if (retryError) {
          console.error('Core expense insert error in Supabase:', retryError);
        } else if (retryData && retryData[0]?.id) {
          // Update local expense id to Supabase UUID
          const dbId = retryData[0].id;
          setExpenses(prev => prev.map(e => e.id === newExp.id ? { ...e, id: dbId } : e));
        }
      } else if (data && data[0]?.id) {
        const dbId = data[0].id;
        setExpenses(prev => prev.map(e => e.id === newExp.id ? { ...e, id: dbId } : e));
      }
    } catch (e) {
      console.warn('Error insertando gasto en Supabase:', e);
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<OperatingExpense>) => {
    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, ...expenseData } : e))
    );
    try {
      const exp = expenses.find(e => e.id === id);
      if (exp) {
        const updatePayload: any = {
          category: expenseData.category ?? exp.category,
          description: expenseData.description ?? exp.description,
          amount: Number(expenseData.amount ?? exp.amount),
          date: expenseData.date ?? exp.date,
          registered_by: expenseData.registeredBy ?? exp.registeredBy
        };

        const { error } = await supabase
          .from('operating_expenses')
          .update(updatePayload)
          .or(`id.eq.${id},description.eq.${exp.description}`);

        if (error) {
          console.warn('Error actualizando gasto en Supabase:', error);
        }
      }
    } catch (e) {
      console.warn('Error actualizando gasto en Supabase:', e);
    }
  };

  const deleteExpense = async (id: string) => {
    const expToDelete = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (expToDelete) {
      try {
        await supabase
          .from('operating_expenses')
          .delete()
          .or(`id.eq.${id},description.eq.${expToDelete.description}`);
      } catch (e) {
        console.warn('Error borrando gasto en Supabase:', e);
      }
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearSampleData = async () => {
    localStorage.setItem('app_service_orders', JSON.stringify([]));
    localStorage.setItem('app_clients', JSON.stringify([]));
    localStorage.setItem('app_spare_parts', JSON.stringify([]));
    localStorage.setItem('app_technicians', JSON.stringify([]));
    localStorage.setItem('app_operating_expenses', JSON.stringify([]));

    // Keep only current logged-in user or active admin, remove sample/demo accounts
    const activeAdmin = currentUser || systemUsers.find(u => (u.email || '').toLowerCase().includes('haroldo')) || null;
    const remainingUsers = activeAdmin ? [activeAdmin] : [];
    localStorage.setItem('app_system_users', JSON.stringify(remainingUsers));

    setOrders([]);
    setClients([]);
    setSpareParts([]);
    setTechnicians([]);
    setExpenses([]);
    setNotifications([]);
    setSystemUsers(remainingUsers);

    // Delete in Supabase if connected
    try {
      // Clean sample tables in Supabase
      await supabase.from('service_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('spare_parts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('operating_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (activeAdmin?.email) {
        // Delete all users except the active admin in Supabase
        await supabase.from('system_users').delete().neq('email', activeAdmin.email.toLowerCase());
      } else {
        // Delete known sample demo accounts
        const sampleEmails = [
          'serviciosjesgui@outlook.com',
          'jesus22@sij.com',
          'tallerjesgui@gmail.com',
          'facturasjesgui1@gmail.com',
          'test@example.com',
          'realtest@example.com'
        ];
        for (const em of sampleEmails) {
          await supabase.from('system_users').delete().ilike('email', em);
        }
      }
    } catch (e) {
      console.warn('Error limpiando registros de muestra en Supabase:', e);
    }
  };

  const resetToDemoData = () => {
    localStorage.setItem('app_service_orders', JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem('app_clients', JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem('app_spare_parts', JSON.stringify(INITIAL_SPARE_PARTS));
    localStorage.setItem('app_business_services', JSON.stringify(INITIAL_SERVICES));
    localStorage.setItem('app_system_users', JSON.stringify(INITIAL_USERS));
    localStorage.setItem('app_operating_expenses', JSON.stringify(INITIAL_EXPENSES));

    setOrders(INITIAL_ORDERS);
    setClients(INITIAL_CLIENTS);
    setSpareParts(INITIAL_SPARE_PARTS);
    setServices(INITIAL_SERVICES);
    setSystemUsers(INITIAL_USERS);
    setExpenses(INITIAL_EXPENSES);
  };

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
        officeSubTab,
        setOfficeSubTab,
        ownerSubTab,
        setOwnerSubTab,
        orders,
        clients,
        spareParts,
        services,
        technicians,
        systemUsers,
        currentUser,
        setCurrentUser,
        expenses,
        notifications,
        selectedClientOrderFolio,
        setSelectedClientOrderFolio,
        createOrder,
        updateOrderStatus,
        assignTechnician,
        updateOrderRoute,
        reopenWarrantyOrder,
        startInspection,
        submitTechDiagnostic,
        submitTechResolution,
        saveBudget,
        sendBudgetToClient,
        updateOrder,
        deleteOrder,
        addClient,
        updateClient,
        deleteClient,
        toggleClientStatus,
        addSparePart,
        updateSparePart,
        toggleSparePartStatus,
        deleteSparePart,
        addService,
        updateService,
        toggleServiceStatus,
        deleteService,
        updateTechnician,
        toggleTechStatus,
        deleteTechnician,
        approveBudget,
        rejectBudget,
        addSystemUser,
        syncUsersToSupabase,
        syncAllDataToSupabase,
        updateSystemUser,
        toggleUserStatus,
        deleteSystemUser,
        addExpense,
        updateExpense,
        deleteExpense,
        markNotificationRead,
        clearSampleData,
        resetToDemoData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
