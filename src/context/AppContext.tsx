import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  RoleType,
  ServiceOrder,
  Client,
  SparePart,
  Technician,
  Notification,
  OrderStatus,
  PriorityType,
  RequestedPart,
  Budget,
  SystemUser,
  OperatingExpense
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_ORDERS,
  INITIAL_SPARE_PARTS,
  INITIAL_TECHNICIANS,
  INITIAL_USERS,
  INITIAL_EXPENSES
} from '../data/initialData';

interface AppContextType {
  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;
  officeSubTab: 'orders' | 'routes' | 'budgets' | 'catalogs' | 'reports';
  setOfficeSubTab: (tab: 'orders' | 'routes' | 'budgets' | 'catalogs' | 'reports') => void;
  ownerSubTab: 'analytics' | 'financials' | 'users';
  setOwnerSubTab: (tab: 'analytics' | 'financials' | 'users') => void;
  orders: ServiceOrder[];
  clients: Client[];
  spareParts: SparePart[];
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

  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
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
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  toggleClientStatus: (id: string) => void;
  addSparePart: (part: Omit<SparePart, 'id'>) => void;
  deleteSparePart: (id: string) => void;
  deleteOrder: (id: string) => void;

  // Client actions
  approveBudget: (orderId: string, clientComment?: string) => void;
  rejectBudget: (orderId: string, clientComment: string) => void;

  // Owner / System Users & Expenses actions
  addSystemUser: (user: Omit<SystemUser, 'id'>) => Promise<{ success: boolean; savedInDb: boolean; error?: string }>;
  syncUsersToSupabase: () => Promise<{ success: boolean; count: number; error?: string }>;
  updateSystemUser: (id: string, userData: Partial<SystemUser>) => void;
  toggleUserStatus: (id: string) => void;
  deleteSystemUser: (id: string) => void;
  addExpense: (expense: Omit<OperatingExpense, 'id'>) => void;
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
  const [officeSubTab, setOfficeSubTab] = useState<'orders' | 'routes' | 'budgets' | 'catalogs' | 'reports'>(() => {
    const saved = localStorage.getItem('app_office_subtab');
    return (saved as any) || 'orders';
  });
  const [ownerSubTab, setOwnerSubTab] = useState<'analytics' | 'financials' | 'users'>(() => {
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

  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);

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
    localStorage.setItem('app_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_current_user');
    }
  }, [currentUser]);

  // Sync users from Supabase on load
  useEffect(() => {
    const fetchSupabaseUsers = async () => {
      try {
        const { data, error } = await supabase.from('system_users').select('*');
        if (!error && data && Array.isArray(data)) {
          if (data.length > 0) {
            const dbUsers: SystemUser[] = data
              .filter((u: any) => u && typeof u === 'object')
              .map((u: any) => {
                const email = u.email || '';
                const username = u.username || (email ? email.split('@')[0] : 'usuario');
                return {
                  id: u.id || `usr-${Math.random()}`,
                  name: u.name || username || 'Usuario',
                  username,
                  email,
                  password: u.password || '',
                  phone: u.phone || '',
                  role: u.role || 'owner',
                  status: u.status || 'Activo',
                  lastLogin: u.last_login ? new Date(u.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'
                };
              });

            setSystemUsers(prev => {
              // Merge with local users avoiding duplicates
              const existingEmails = new Set(dbUsers.map(u => (u.email || '').toLowerCase()).filter(Boolean));
              const localOnly = prev.filter(u => u && u.email && !existingEmails.has((u.email || '').toLowerCase()));
              const combined = [...dbUsers, ...localOnly];
              localStorage.setItem('app_system_users', JSON.stringify(combined));
              return combined;
            });
          }
        }
      } catch (e) {
        console.warn('Supabase system_users sync skipped/offline', e);
      }
    };
    fetchSupabaseUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem('app_operating_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newN: Notification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Justo ahora',
      read: false
    };
    setNotifications(prev => [newN, ...prev]);
  };

  const createOrder = ({
    clientId,
    departmentId,
    equipmentType,
    description,
    priority,
    technicianId,
    scheduledDate
  }: {
    clientId: string;
    departmentId: string;
    equipmentType: string;
    description: string;
    priority: PriorityType;
    technicianId?: string;
    scheduledDate?: string;
  }): ServiceOrder => {
    const client = clients.find(c => c.id === clientId);
    const department = client?.departments.find(d => d.id === departmentId);
    const tech = technicians.find(t => t.id === technicianId);

    const newFolioNumber = 1000 + orders.length + 1;
    const folio = `OS-${newFolioNumber}`;
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

    const newOrder: ServiceOrder = {
      id: `ord-${Date.now()}`,
      folio,
      clientId,
      clientName: client?.name || 'Cliente Desconocido',
      departmentId,
      departmentName: department?.name || 'Departamento Principal',
      equipmentType: equipmentType || 'Equipo General',
      description,
      priority,
      status: 'Pendiente de Visita',
      technicianId: tech?.id,
      technicianName: tech?.name,
      createdAt: nowStr,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
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

      addNotification({
        targetRole: 'tech',
        orderFolio: folio,
        title: 'Nueva Visita Programada',
        message: `Asignado servicio OS ${folio} (${newOrder.clientName}) para ${newOrder.equipmentType}.`
      });
    }

    setOrders(prev => [newOrder, ...prev]);

    addNotification({
      targetRole: 'office',
      orderFolio: folio,
      title: 'Nueva OS Registrada',
      message: `Orden ${folio} creada para ${newOrder.clientName}.`
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: newStatus,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: `Cambio de estatus: ${newStatus}`,
              author: 'Sistema',
              note
            }
          ]
        };
      })
    );
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
        title: 'Asignación de Ruta',
        message: `Te han programado el folio ${targetOrd.folio} (${targetOrd.clientName}) en tu ruta.`
      });
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

  const startInspection = (orderId: string) => {
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
  };

  const submitTechDiagnostic = ({
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

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          diagnosticNotes: notes,
          diagnosticPhotos: [...ord.diagnosticPhotos, ...photos],
          requestedParts,
          status: 'Presupuesto Pendiente',
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Diagnóstico y Lista de Refacciones Generada',
              author: ord.technicianName || 'Técnico',
              note: `Refacciones solicitadas: ${requestedParts.length}. Evidencias enviadas a Oficina.`
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
        title: 'Refacciones Recibidas de Campo',
        message: `Téc. ${ord.technicianName || 'Técnico'} envió diagnóstico de ${ord.folio} con ${requestedParts.length} refacciones.`
      });
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

      if (ord.technicianId) {
        addNotification({
          targetRole: 'tech',
          orderFolio: ord.folio,
          title: 'Presupuesto Aprobado por Cliente',
          message: `Luz verde para ${ord.folio}. Oficina ha asignado este servicio a tu ruta de reparación.`
        });
      }
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
    }
  };

  const submitTechResolution = ({
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
    }
  };

  const addClient = async (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`
    };
    setClients(prev => [...prev, newClient]);

    // Sync to Supabase clients table
    try {
      await supabase.from('clients').upsert([{
        name: clientData.name,
        tax_id: clientData.taxId,
        contact_email: clientData.email,
        contact_phone: clientData.phone || '',
        address: clientData.address || '',
        phone: clientData.phone || '',
        whatsapp: clientData.whatsapp || '',
        model: clientData.model || '',
        fault: clientData.fault || '',
        status: clientData.status || 'Activo',
        contact_name: clientData.name
      }]);
    } catch (err) {
      console.warn('Error sincronizando cliente en Supabase:', err);
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    setClients(prev =>
      prev.map(c => (c.id === id ? { ...c, ...clientData } : c))
    );

    try {
      const client = clients.find(c => c.id === id);
      if (client) {
        await supabase
          .from('clients')
          .update({
            name: clientData.name ?? client.name,
            tax_id: clientData.taxId ?? client.taxId,
            contact_email: clientData.email ?? client.email,
            address: clientData.address ?? client.address,
            phone: clientData.phone ?? client.phone,
            whatsapp: clientData.whatsapp ?? client.whatsapp,
            model: clientData.model ?? client.model,
            fault: clientData.fault ?? client.fault,
            status: clientData.status ?? client.status
          })
          .eq('contact_email', client.email);
      }
    } catch (err) {
      console.warn('Error actualizando cliente en Supabase:', err);
    }
  };

  const deleteClient = async (id: string) => {
    const clientToDelete = clients.find(c => c.id === id);
    setClients(prev => prev.filter(c => c.id !== id));
    if (clientToDelete?.email) {
      try {
        await supabase.from('clients').delete().eq('contact_email', clientToDelete.email);
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

  const addSparePart = (partData: Omit<SparePart, 'id'>) => {
    const newPart: SparePart = {
      ...partData,
      id: `sp-${Date.now()}`
    };
    setSpareParts(prev => [...prev, newPart]);
  };

  const deleteSparePart = (id: string) => {
    setSpareParts(prev => prev.filter(p => p.id !== id));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  // Owner System Users & Expenses
  const addSystemUser = async (userData: Omit<SystemUser, 'id'>): Promise<{ success: boolean; savedInDb: boolean; error?: string }> => {
    const userEmail = (userData.email || '').trim().toLowerCase();
    const userUsername = (userData.username || '').trim().toLowerCase() || userEmail.split('@')[0];

    let savedInDb = false;
    let dbError = '';

    // Attempt to save to Supabase system_users table FIRST
    try {
      const payload = {
        name: userData.name || 'Usuario',
        username: userUsername,
        email: userEmail,
        password: userData.password || '',
        phone: userData.phone || '',
        role: userData.role || 'owner',
        status: userData.status || 'Activo'
      };

      const { data, error } = await supabase
        .from('system_users')
        .upsert([payload], { onConflict: 'email' })
        .select();

      if (error) {
        console.warn('Error guardando usuario en Supabase system_users:', error);
        if (error.code === '23505' || (error.message && error.message.includes('unique constraint'))) {
          if (error.message.includes('username') || (error.details && error.details.includes('username'))) {
            dbError = 'El nombre de usuario ya está registrado en Supabase. Elige otro nombre de usuario.';
          } else {
            dbError = 'El correo electrónico ya está registrado en Supabase.';
          }
        } else if (error.code === '42P01' || (error.message && (error.message.includes('relation') || error.message.includes('does not exist')))) {
          dbError = 'La tabla "system_users" no existe en Supabase. Ejecuta el script SQL en el Editor SQL de Supabase.';
        } else if (error.code === '42501' || (error.message && (error.message.includes('permission') || error.message.includes('policy')))) {
          dbError = 'Permiso denegado por políticas RLS en Supabase. Ejecuta el script SQL para otorgar los permisos.';
        } else {
          dbError = error.message || 'Error al guardar el usuario en Supabase.';
        }
      } else if (data && data.length > 0) {
        savedInDb = true;
        const dbU = data[0];
        const savedUser: SystemUser = {
          id: dbU.id,
          name: dbU.name,
          username: dbU.username || userUsername,
          email: dbU.email,
          password: dbU.password || userData.password || '',
          phone: dbU.phone || '',
          role: dbU.role || userData.role || 'owner',
          status: dbU.status || 'Activo',
          lastLogin: 'Ahora mismo'
        };

        // Update local state ONLY when Supabase registration succeeds
        setSystemUsers(prev => {
          const filtered = prev.filter(u => u && (u.email || '').toLowerCase() !== userEmail && (u.username || '').toLowerCase() !== userUsername);
          return [...filtered, savedUser];
        });
      } else {
        dbError = 'Supabase no confirmó la inserción del usuario en la base de datos.';
      }
    } catch (err: any) {
      console.warn('Supabase error:', err);
      dbError = err.message || 'Error de conexión con la base de datos de Supabase';
    }

    return { success: savedInDb, savedInDb, error: dbError };
  };

  const syncUsersToSupabase = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    let syncedCount = 0;
    let lastError = '';

    for (const u of systemUsers) {
      try {
        const { error } = await supabase.from('system_users').upsert([{
          name: u.name,
          username: u.username || u.email.split('@')[0],
          email: u.email,
          password: u.password || '',
          phone: u.phone || '',
          role: u.role || 'owner',
          status: u.status || 'Activo'
        }], { onConflict: 'email' });

        if (error) {
          console.error('Error sincronizando usuario con Supabase:', u.email, error);
          lastError = error.message;
          if (error.message.includes('Invalid path') || error.message.includes('relation') || error.message.includes('does not exist')) {
            lastError = 'La tabla "system_users" no existe en Supabase. Ejecuta el script SQL en el SQL Editor de Supabase.';
          }
        } else {
          syncedCount++;
        }
      } catch (err: any) {
        lastError = err.message || 'Error de red con Supabase';
      }
    }

    if (syncedCount > 0) {
      return { success: true, count: syncedCount };
    } else {
      return { success: false, count: 0, error: lastError || 'No se pudieron sincronizar los usuarios con Supabase.' };
    }
  };

  const updateSystemUser = async (id: string, userData: Partial<SystemUser>) => {
    setSystemUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, ...userData } : u))
    );

    try {
      const user = systemUsers.find(u => u.id === id);
      if (user) {
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
          .eq('email', user.email);
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
      try {
        await supabase.from('system_users').update({ status: newStatus }).eq('email', user.email);
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
          await supabase.from('system_users').delete().ilike('email', userEmail);
        }
        // Also try delete by id or username if present
        if (userToDelete.id && !userToDelete.id.startsWith('usr-')) {
          await supabase.from('system_users').delete().eq('id', userToDelete.id);
        }
      } catch (e) {
        console.warn('Error borrando usuario en Supabase:', e);
      }
    }
  };

  const addExpense = (expenseData: Omit<OperatingExpense, 'id'>) => {
    const newExp: OperatingExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`
    };
    setExpenses(prev => [newExp, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
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
    localStorage.setItem('app_operating_expenses', JSON.stringify([]));

    // Keep only current logged-in user or active admin, remove sample/demo accounts
    const activeAdmin = currentUser || systemUsers.find(u => (u.email || '').toLowerCase().includes('haroldo')) || null;
    const remainingUsers = activeAdmin ? [activeAdmin] : [];
    localStorage.setItem('app_system_users', JSON.stringify(remainingUsers));

    setOrders([]);
    setClients([]);
    setSpareParts([]);
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
    localStorage.setItem('app_system_users', JSON.stringify(INITIAL_USERS));
    localStorage.setItem('app_operating_expenses', JSON.stringify(INITIAL_EXPENSES));

    setOrders(INITIAL_ORDERS);
    setClients(INITIAL_CLIENTS);
    setSpareParts(INITIAL_SPARE_PARTS);
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
        addClient,
        updateClient,
        deleteClient,
        toggleClientStatus,
        addSparePart,
        deleteSparePart,
        deleteOrder,
        approveBudget,
        rejectBudget,
        addSystemUser,
        syncUsersToSupabase,
        updateSystemUser,
        toggleUserStatus,
        deleteSystemUser,
        addExpense,
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
