import React, { createContext, useContext, useState, useEffect } from 'react';
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
  Budget
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_ORDERS,
  INITIAL_SPARE_PARTS,
  INITIAL_TECHNICIANS
} from '../data/initialData';

interface AppContextType {
  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;
  orders: ServiceOrder[];
  clients: Client[];
  spareParts: SparePart[];
  technicians: Technician[];
  notifications: Notification[];
  selectedClientOrderFolio: string | null;
  setSelectedClientOrderFolio: (folio: string | null) => void;

  // Actions
  createOrder: (data: {
    clientId: string;
    departmentId: string;
    description: string;
    priority: PriorityType;
    technicianId?: string;
  }) => ServiceOrder;

  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  assignTechnician: (orderId: string, technicianId: string) => void;

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
    signature?: string;
  }) => void;

  // Office actions
  saveBudget: (orderId: string, budgetData: { laborCost: number; parts: RequestedPart[]; taxRate: number; notes?: string }) => void;
  sendBudgetToClient: (orderId: string) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  addSparePart: (part: Omit<SparePart, 'id'>) => void;

  // Client actions
  approveBudget: (orderId: string, clientComment?: string) => void;
  rejectBudget: (orderId: string, clientComment: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<RoleType>('home');
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
      message: 'El cliente autorizó el presupuesto para OS-1005. ¡Puedes iniciar la reparación!',
      read: false
    }
  ]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('app_service_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('app_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('app_spare_parts', JSON.stringify(spareParts));
  }, [spareParts]);

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
    description,
    priority,
    technicianId
  }: {
    clientId: string;
    departmentId: string;
    description: string;
    priority: PriorityType;
    technicianId?: string;
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
      description,
      priority,
      status: 'Pendiente de Revisión',
      technicianId: tech?.id,
      technicianName: tech?.name,
      createdAt: nowStr,
      diagnosticPhotos: [],
      requestedParts: [],
      solutionPhotos: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: nowStr,
          title: 'Orden Creada',
          author: 'Oficina (Admin)',
          note: `Folio generado: ${folio}`
        }
      ]
    };

    if (tech) {
      newOrder.timeline.push({
        id: `tl-${Date.now() + 1}`,
        timestamp: nowStr,
        title: 'Técnico Asignado',
        author: 'Oficina (Admin)',
        note: `Asignado a ${tech.name}`
      });

      addNotification({
        targetRole: 'tech',
        orderFolio: folio,
        title: 'Nueva Orden Asignada',
        message: `Se te ha asignado la orden ${folio} para ${newOrder.clientName}.`
      });
    }

    setOrders(prev => [newOrder, ...prev]);

    addNotification({
      targetRole: 'office',
      orderFolio: folio,
      title: 'Nueva OS Registrada',
      message: `Orden ${folio} registrada exitosamente.`
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

  const assignTechnician = (orderId: string, technicianId: string) => {
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
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Técnico Asignado',
              author: 'Oficina (Admin)',
              note: `Asignado a ${tech.name}`
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
        title: 'Asignación de Trabajo',
        message: `Te han asignado la orden ${targetOrd.folio} (${targetOrd.clientName}).`
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
              title: 'Revisión Técnica Iniciada',
              author: ord.technicianName || 'Técnico',
              note: 'El técnico ha iniciado la inspección en sitio.'
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
    const hasParts = requestedParts.length > 0;
    const nextStatus: OrderStatus = hasParts ? 'Esperando Presupuesto' : 'En Cotización';

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          diagnosticNotes: notes,
          diagnosticPhotos: [...ord.diagnosticPhotos, ...photos],
          requestedParts,
          status: nextStatus,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Diagnóstico Completado',
              author: ord.technicianName || 'Técnico',
              note: `Refacciones solicitadas: ${requestedParts.length}`
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
        title: 'Diagnóstico Recibido',
        message: `El téc. ${ord.technicianName || 'Técnico'} envió diagnóstico de ${ord.folio} con ${requestedParts.length} repuestos.`
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
          status: 'En Cotización',
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Presupuesto Creado/Actualizado',
              author: 'Oficina (Admin)',
              note: 'Se estructuró la cotización de mano de obra y refacciones.'
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
              note: 'Link de autorización generado y notificado al cliente.'
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
        title: 'Presupuesto Disponible',
        message: `Tu cotización para la orden ${ord.folio} está ready para autorización.`
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
        message: `El cliente APROBÓ la cotización para ${ord.folio}. Se liberó para reparación.`
      });

      if (ord.technicianId) {
        addNotification({
          targetRole: 'tech',
          orderFolio: ord.folio,
          title: 'Presupuesto Aprobado',
          message: `¡Luz verde! El cliente autorizó ${ord.folio}. Puedes proceder con los trabajos.`
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
          status: 'En Cotización',
          budget: ord.budget ? { ...ord.budget, status: 'Rechazado' } : undefined,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Presupuesto Rechazado / Ajuste Solicitado',
              author: 'Cliente',
              note: `Comentario del cliente: ${clientComment}`
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
        message: `El cliente solicitó ajustes en ${ord.folio}: "${clientComment}"`
      });
    }
  };

  const submitTechResolution = ({
    orderId,
    solutionNotes,
    solutionPhotos,
    signature
  }: {
    orderId: string;
    solutionNotes: string;
    solutionPhotos: string[];
    signature?: string;
  }) => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'Finalizada',
          completedAt: nowStr,
          solutionNotes,
          solutionPhotos: [...ord.solutionPhotos, ...solutionPhotos],
          clientSignature: signature || ord.clientSignature,
          timeline: [
            ...ord.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: nowStr,
              title: 'Orden Resuelta y Finalizada',
              author: ord.technicianName || 'Técnico',
              note: 'Trabajo completado y verificado en campo.'
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
        title: 'Orden Concluida',
        message: `El téc. ${ord.technicianName || 'Técnico'} finalizó la orden ${ord.folio}.`
      });
    }
  };

  const addClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`
    };
    setClients(prev => [...prev, newClient]);
  };

  const addSparePart = (partData: Omit<SparePart, 'id'>) => {
    const newPart: SparePart = {
      ...partData,
      id: `sp-${Date.now()}`
    };
    setSpareParts(prev => [...prev, newPart]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
        orders,
        clients,
        spareParts,
        technicians,
        notifications,
        selectedClientOrderFolio,
        setSelectedClientOrderFolio,
        createOrder,
        updateOrderStatus,
        assignTechnician,
        startInspection,
        submitTechDiagnostic,
        submitTechResolution,
        saveBudget,
        sendBudgetToClient,
        addClient,
        addSparePart,
        approveBudget,
        rejectBudget,
        markNotificationRead
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
