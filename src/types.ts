export type RoleType = 'home' | 'owner' | 'office' | 'tech' | 'client';

export const normalizeRole = (rawRole: any): 'owner' | 'office' | 'tech' | 'client' => {
  if (!rawRole) return 'client';
  const str = String(rawRole).trim().toLowerCase();
  // Check technician first to prevent "tecnico" being caught by general patterns
  if (
    str === 'tech' ||
    str.includes('tecnic') ||
    str.includes('técnic') ||
    str.includes('technic') ||
    str.includes('campo') ||
    str.includes('operativ')
  ) {
    return 'tech';
  }
  if (
    str === 'owner' ||
    str.includes('dueñ') ||
    str.includes('duen') ||
    str.includes('admin') ||
    str === 'gerente' ||
    str === 'director'
  ) {
    return 'owner';
  }
  if (
    str === 'office' ||
    str.includes('oficin') ||
    str.includes('recepc') ||
    str.includes('administra') ||
    str === 'secretaria' ||
    str === 'despacho'
  ) {
    return 'office';
  }
  return 'client';
};

export const normalizeOrderStatus = (rawStatus?: string | null): OrderStatus => {
  if (!rawStatus) return 'Pendiente de Visita';
  const s = String(rawStatus).trim().toLowerCase();
  if (s.includes('cobrad') || s.includes('cerrad') || s.includes('pagad') || s.includes('completad') || s.includes('finaliz')) return 'Cobrado/Cerrado';
  if (s.includes('no aceptad') || s.includes('rechazad')) return 'No Aceptado';
  if (s.includes('cancelad')) return 'Cancelada';
  if (s.includes('entreg') || s.includes('por entregar')) return 'Pendiente de Entrega';
  if (s.includes('reparac') || s.includes('en reparacion')) return 'En Reparación';
  if (s.includes('aprobac') || s.includes('esperando')) return 'Esperando Aprobación';
  if (s.includes('presupuest') || s.includes('cotizac')) return 'Presupuesto Pendiente';
  if (s.includes('diagnost')) return 'En Diagnóstico';
  if (s.includes('garant')) return 'Garantía Reabierta';
  if (s.includes('visita') || s.includes('pendient')) return 'Pendiente de Visita';
  return 'Pendiente de Visita';
};

export const getRoleDisplayName = (role: string): string => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'owner': return 'Admin / Dueño';
    case 'office': return 'Oficina';
    case 'tech': return 'Técnico';
    case 'client': return 'Cliente';
    default: return 'Cliente';
  }
};

export type PriorityType = 'Alta' | 'Media' | 'Baja';

export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Cheque';

export type OrderStatus =
  | 'Pendiente de Visita'
  | 'En Diagnóstico'
  | 'Presupuesto Pendiente'
  | 'Esperando Aprobación'
  | 'No Aceptado'
  | 'En Reparación'
  | 'Pendiente de Entrega'
  | 'Cobrado/Cerrado'
  | 'Garantía Reabierta'
  | 'Cancelada';

export interface Department {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  address?: string;
}

export interface Client {
  id: string;
  name: string;
  taxId: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  model?: string;
  fault?: string;
  status?: 'Activo' | 'Inactivo';
  fiscalAddress?: string;
  deliveryAddress?: string;
  creditLimit?: number;
  creditDays?: number;
  category?: 'VIP' | 'Regular' | 'Corporativo' | 'Residencial';
  departments?: Department[];
  createdAt?: string;
}

export interface SparePart {
  id: string;
  code: string;
  name: string;
  category: string;
  unitPrice: number;
  stock: number;
  status?: 'Activo' | 'Inactivo';
  createdAt?: string;
}

export interface BusinessService {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  estimatedDurationHours?: number;
  warrantyDays?: number;
  status: 'Activo' | 'Inactivo';
  createdAt?: string;
}

export interface RequestedPart {
  id: string;
  partId?: string;
  name: string;
  quantity: number;
  estimatedUnitPrice: number;
  notes?: string;
  photoUrl?: string;
}

export interface Budget {
  id: string;
  laborCost: number;
  parts: RequestedPart[];
  taxRate: number; // e.g. 0.16 for 16% or 0 for no IVA
  includeTax?: boolean;
  grandTotal?: number;
  notes?: string;
  status: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado' | 'No Aceptado';
  sentAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  author: string;
  note?: string;
}

export interface ServiceOrder {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  departmentId: string;
  departmentName: string;
  equipmentType?: string; // e.g. "Climatización HVAC", "Compresor Industrial", "Tablero Eléctrico"
  brand?: string;
  model?: string;
  serialNumber?: string;
  description: string;
  priority: PriorityType;
  status: OrderStatus;
  isActive?: boolean; // false when deactivated/archived by admin
  technicianId?: string;
  technicianName?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // Route & Agenda
  routeOrder?: number; // e.g. 1, 2, 3 in daily route
  scheduledDate?: string; // YYYY-MM-DD
  routeNotes?: string;

  // Client contact and location details (stored directly on the order)
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientContact?: string;
  clientTaxId?: string;

  // Tech inspection data
  diagnosticPhotos: string[];
  diagnosticNotes?: string;
  requestedParts: RequestedPart[];

  // Budget data
  budget?: Budget;

  // Tech execution & collection
  solutionNotes?: string;
  solutionPhotos: string[];
  clientSignature?: string; // base64 canvas image or signature mark
  paymentMethod?: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Cheque';
  collectedAmount?: number; // exact amount collected by tech on site

  // Warranty handling
  isWarranty?: boolean;
  warrantyNotes?: string;

  timeline: TimelineEvent[];
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  activeOrdersCount: number;
  avgResponseTimeHours: number;
  avatarUrl?: string;
  status?: 'Activo' | 'Inactivo';
  createdAt?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'owner' | 'office' | 'tech' | 'client';
  status: 'Activo' | 'Inactivo';
  lastLogin?: string;
  createdAt?: string;
}

export interface OperatingExpense {
  id: string;
  category: 'Combustible' | 'Herramientas' | 'Viáticos' | 'Mantenimiento Vehículos' | 'Otros';
  description: string;
  amount: number;
  date: string;
  registeredBy: string;
  paymentMethod?: string;
  invoiceFolio?: string;
  createdAt?: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  targetRole: 'owner' | 'office' | 'tech' | 'client';
  orderFolio: string;
  title: string;
  message: string;
  read: boolean;
  targetTechnicianId?: string;
  targetTechnicianName?: string;
  targetClientId?: string;
}

export interface TelemetrySaveRecord {
  id: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC' | 'PING';
  identifier: string;
  preCount?: number;
  postCount?: number;
  deltaCount?: number;
  latencyMs: number;
  timestamp: string;
  formattedDate: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface SupabaseConnectionState {
  isConnected: boolean;
  latencyMs: number | null;
  lastChecked: string | null;
  isChecking: boolean;
  errorMessage?: string | null;
  projectUrl: string;
  totalRecordsCount?: number;
}
