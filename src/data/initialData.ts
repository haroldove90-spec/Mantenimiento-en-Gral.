import { Client, SparePart, Technician, ServiceOrder, SystemUser, OperatingExpense } from '../types';

export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_SPARE_PARTS: SparePart[] = [];
export const INITIAL_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: 'Carlos Ruiz', phone: '555-8811', email: 'carlos.tech@mantenimiento.com', specialty: 'Refrigeración & HVAC', activeOrdersCount: 0, avgResponseTimeHours: 0, status: 'Activo' },
  { id: 'tech-2', name: 'Ana Mendoza', phone: '555-8822', email: 'ana.tech@mantenimiento.com', specialty: 'Electricidad & Control PLC', activeOrdersCount: 0, avgResponseTimeHours: 0, status: 'Activo' },
  { id: 'tech-3', name: 'Roberto Gómez', phone: '555-8833', email: 'roberto.tech@mantenimiento.com', specialty: 'Mecánica & Hidráulica', activeOrdersCount: 0, avgResponseTimeHours: 0, status: 'Activo' }
];
export const INITIAL_USERS: SystemUser[] = [];
export const INITIAL_EXPENSES: OperatingExpense[] = [];
export const INITIAL_ORDERS: ServiceOrder[] = [];
