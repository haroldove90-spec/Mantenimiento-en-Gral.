export type RoleType = 'home' | 'office' | 'tech' | 'client';

export type PriorityType = 'Alta' | 'Media' | 'Baja';

export type OrderStatus =
  | 'Pendiente de Revisión'
  | 'En Diagnóstico'
  | 'Esperando Presupuesto'
  | 'En Cotización'
  | 'Esperando Aprobación'
  | 'En Reparación'
  | 'Finalizada';

export interface Department {
  id: string;
  name: string;
  contactName: string;
  phone: string;
}

export interface Client {
  id: string;
  name: string;
  taxId: string;
  email: string;
  departments: Department[];
}

export interface SparePart {
  id: string;
  code: string;
  name: string;
  category: string;
  unitPrice: number;
  stock: number;
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
  taxRate: number; // e.g. 0.16 for 16%
  notes?: string;
  status: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado';
  sentAt?: string;
  approvedAt?: string;
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
  description: string;
  priority: PriorityType;
  status: OrderStatus;
  technicianId?: string;
  technicianName?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // Tech inspection data
  diagnosticPhotos: string[];
  diagnosticNotes?: string;
  requestedParts: RequestedPart[];

  // Budget data
  budget?: Budget;

  // Tech execution data
  solutionNotes?: string;
  solutionPhotos: string[];
  clientSignature?: string; // base64 canvas image or signature mark

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
}

export interface Notification {
  id: string;
  timestamp: string;
  targetRole: 'office' | 'tech' | 'client';
  orderFolio: string;
  title: string;
  message: string;
  read: boolean;
}
