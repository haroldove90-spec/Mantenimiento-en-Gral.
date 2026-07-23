import { Client, SparePart, Technician, ServiceOrder } from '../types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Hospital Médica Sur',
    taxId: 'HMS9201018X4',
    email: 'mantenimiento@medicasur.com.mx',
    departments: [
      { id: 'dep-101', name: 'Quirófano Principal - Planta 2', contactName: 'Dr. Roberto Silva', phone: '555-0192' },
      { id: 'dep-102', name: 'Laboratorio de Genética', contactName: 'Ing. Elena Rostrova', phone: '555-0193' },
      { id: 'dep-103', name: 'Urgencias y Imagenología', contactName: 'Lic. Marco Polo', phone: '555-0194' }
    ]
  },
  {
    id: 'cli-2',
    name: 'Industrias Automotrices Norte',
    taxId: 'IAN851020LL3',
    email: 'compras@ianorte.com',
    departments: [
      { id: 'dep-201', name: 'Línea de Ensamble A', contactName: 'Ing. Javier Méndez', phone: '555-0311' },
      { id: 'dep-202', name: 'Nave de Pintura Robótica', contactName: 'Téc. Sofía Vargas', phone: '555-0312' },
      { id: 'dep-203', name: 'Almacén Central de Refacciones', contactName: 'Carlos Benítez', phone: '555-0313' }
    ]
  },
  {
    id: 'cli-3',
    name: 'Corporativo San José',
    taxId: 'CSJ0103158A1',
    email: 'administracion@corporativosanjose.com',
    departments: [
      { id: 'dep-301', name: 'Torre A - Cuarto de Servidores', contactName: 'Sistemas IT - Andrés', phone: '555-0720' },
      { id: 'dep-302', name: 'Piso 5 - Climatización HVAC', contactName: 'Arq. Mónica Luján', phone: '555-0721' },
      { id: 'dep-303', name: 'Planta Baja - Grupo Electrógeno', contactName: 'Felipe Hinojosa', phone: '555-0722' }
    ]
  }
];

export const INITIAL_SPARE_PARTS: SparePart[] = [
  { id: 'sp-1', code: 'FIL-HVAC-01', name: 'Filtro HEPA Industrial 24x24', category: 'Climatización', unitPrice: 850, stock: 24 },
  { id: 'sp-2', code: 'MOT-3P-05', name: 'Motor Trifásico 5 HP 220V', category: 'Electromecánica', unitPrice: 6400, stock: 5 },
  { id: 'sp-3', code: 'VAL-SOL-02', name: 'Válvula Solenoide 3/4 High-Temp', category: 'Hidráulica', unitPrice: 1200, stock: 14 },
  { id: 'sp-4', code: 'TAR-CTRL-09', name: 'Tarjeta Electrónica de Control PLC', category: 'Electrónica', unitPrice: 4800, stock: 8 },
  { id: 'sp-5', code: 'BOM-COMP-12', name: 'Compresor de Aire 10 BAR', category: 'Neumática', unitPrice: 12500, stock: 3 },
  { id: 'sp-6', code: 'ROD-SKF-6204', name: 'Balero/Rodamiento Blindado SKF', category: 'Mecánica', unitPrice: 320, stock: 40 }
];

export const INITIAL_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: 'Carlos Ruiz', phone: '555-8811', email: 'carlos.tech@mantenimiento.com', specialty: 'Refrigeración & HVAC', activeOrdersCount: 2, avgResponseTimeHours: 2.5 },
  { id: 'tech-2', name: 'Ana Mendoza', phone: '555-8822', email: 'ana.tech@mantenimiento.com', specialty: 'Electricidad & Control PLC', activeOrdersCount: 3, avgResponseTimeHours: 1.8 },
  { id: 'tech-3', name: 'Roberto Gómez', phone: '555-8833', email: 'roberto.tech@mantenimiento.com', specialty: 'Mecánica & Hidráulica', activeOrdersCount: 1, avgResponseTimeHours: 3.1 }
];

export const INITIAL_ORDERS: ServiceOrder[] = [
  {
    id: 'ord-1001',
    folio: 'OS-1001',
    clientId: 'cli-1',
    clientName: 'Hospital Médica Sur',
    departmentId: 'dep-101',
    departmentName: 'Quirófano Principal - Planta 2',
    description: 'Falla en sistema de flujo laminar. Ruido anormal y baja presión de aire.',
    priority: 'Alta',
    status: 'Pendiente de Revisión',
    technicianId: 'tech-1',
    technicianName: 'Carlos Ruiz',
    createdAt: '2026-07-23 07:15',
    diagnosticPhotos: [],
    requestedParts: [],
    solutionPhotos: [],
    timeline: [
      { id: 'tl-1', timestamp: '2026-07-23 07:15', title: 'Orden Creada', author: 'Oficina (Admin)', note: 'Reporte ingresado por llamada de urgencia.' },
      { id: 'tl-2', timestamp: '2026-07-23 07:20', title: 'Técnico Asignado', author: 'Oficina (Admin)', note: 'Asignado a Carlos Ruiz' }
    ]
  },
  {
    id: 'ord-1002',
    folio: 'OS-1002',
    clientId: 'cli-2',
    clientName: 'Industrias Automotrices Norte',
    departmentId: 'dep-201',
    departmentName: 'Línea de Ensamble A',
    description: 'Sobrecalentamiento en motor impulsor de la banda transportadora #3.',
    priority: 'Alta',
    status: 'En Diagnóstico',
    technicianId: 'tech-2',
    technicianName: 'Ana Mendoza',
    createdAt: '2026-07-22 16:30',
    startedAt: '2026-07-23 08:00',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
    ],
    diagnosticNotes: 'El bobinado del motor presenta fuga de corriente a tierra y desgaste crítico de baleros.',
    requestedParts: [
      { id: 'rp-1', partId: 'sp-2', name: 'Motor Trifásico 5 HP 220V', quantity: 1, estimatedUnitPrice: 6400, notes: 'Reemplazo urgente' },
      { id: 'rp-2', partId: 'sp-6', name: 'Balero/Rodamiento Blindado SKF', quantity: 2, estimatedUnitPrice: 320, notes: 'Para eje secundario' }
    ],
    solutionPhotos: [],
    timeline: [
      { id: 'tl-10', timestamp: '2026-07-22 16:30', title: 'Orden Creada', author: 'Oficina (Admin)' },
      { id: 'tl-11', timestamp: '2026-07-23 08:00', title: 'Revisión Iniciada', author: 'Téc. Ana Mendoza', note: 'Pruebas térmicas y multímetro completadas.' }
    ]
  },
  {
    id: 'ord-1003',
    folio: 'OS-1003',
    clientId: 'cli-3',
    clientName: 'Corporativo San José',
    departmentId: 'dep-302',
    departmentName: 'Piso 5 - Climatización HVAC',
    description: 'Mantenimiento preventivo semestral y cambio de filtros de aire acondicionado central.',
    priority: 'Media',
    status: 'Esperando Presupuesto',
    technicianId: 'tech-1',
    technicianName: 'Carlos Ruiz',
    createdAt: '2026-07-21 10:00',
    startedAt: '2026-07-22 09:00',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
    ],
    diagnosticNotes: 'Se requiere cambio inmediato de 4 filtros HEPA saturados de polvo y revisión de refrigerante.',
    requestedParts: [
      { id: 'rp-3', partId: 'sp-1', name: 'Filtro HEPA Industrial 24x24', quantity: 4, estimatedUnitPrice: 850, notes: 'Filtros de aire' }
    ],
    solutionPhotos: [],
    timeline: [
      { id: 'tl-20', timestamp: '2026-07-21 10:00', title: 'Orden Creada', author: 'Oficina' },
      { id: 'tl-21', timestamp: '2026-07-22 09:30', title: 'Lista de Refacciones Enviada', author: 'Téc. Carlos Ruiz', note: 'Solicitud enviada a la oficina para cotización.' }
    ]
  },
  {
    id: 'ord-1004',
    folio: 'OS-1004',
    clientId: 'cli-1',
    clientName: 'Hospital Médica Sur',
    departmentId: 'dep-102',
    departmentName: 'Laboratorio de Genética',
    description: 'Calibración de centrifugas de alta precisión y reemplazo de empaques.',
    priority: 'Baja',
    status: 'Esperando Aprobación',
    technicianId: 'tech-3',
    technicianName: 'Roberto Gómez',
    createdAt: '2026-07-20 11:15',
    startedAt: '2026-07-20 14:00',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80'
    ],
    diagnosticNotes: 'Se identificó desalineación en rotor y empaques de silicona desgastados.',
    requestedParts: [
      { id: 'rp-4', name: 'Juego de Empaques de Silicona Grado Médico', quantity: 2, estimatedUnitPrice: 950, notes: 'Empaques especiales' }
    ],
    budget: {
      id: 'bud-1004',
      laborCost: 1500,
      parts: [
        { id: 'rp-4', name: 'Juego de Empaques de Silicona Grado Médico', quantity: 2, estimatedUnitPrice: 950 }
      ],
      taxRate: 0.16,
      notes: 'Incluye certificado de calibración en laboratorio.',
      status: 'Enviado',
      sentAt: '2026-07-21 15:00'
    },
    solutionPhotos: [],
    timeline: [
      { id: 'tl-30', timestamp: '2026-07-20 11:15', title: 'Orden Creada', author: 'Oficina' },
      { id: 'tl-31', timestamp: '2026-07-21 15:00', title: 'Presupuesto Enviado al Cliente', author: 'Oficina', note: 'Enviado por link y email.' }
    ]
  },
  {
    id: 'ord-1005',
    folio: 'OS-1005',
    clientId: 'cli-2',
    clientName: 'Industrias Automotrices Norte',
    departmentId: 'dep-202',
    departmentName: 'Nave de Pintura Robótica',
    description: 'Fuga en electroválvula de control hidráulico en el brazo articulado #2.',
    priority: 'Alta',
    status: 'En Reparación',
    technicianId: 'tech-3',
    technicianName: 'Roberto Gómez',
    createdAt: '2026-07-19 09:00',
    startedAt: '2026-07-19 11:00',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80'
    ],
    diagnosticNotes: 'Válvula retenedora fracturada.',
    requestedParts: [
      { id: 'rp-5', partId: 'sp-3', name: 'Válvula Solenoide 3/4 High-Temp', quantity: 1, estimatedUnitPrice: 1200 }
    ],
    budget: {
      id: 'bud-1005',
      laborCost: 2200,
      parts: [
        { id: 'rp-5', partId: 'sp-3', name: 'Válvula Solenoide 3/4 High-Temp', quantity: 1, estimatedUnitPrice: 1200 }
      ],
      taxRate: 0.16,
      status: 'Aprobado',
      sentAt: '2026-07-19 14:00',
      approvedAt: '2026-07-19 16:20'
    },
    solutionPhotos: [],
    timeline: [
      { id: 'tl-40', timestamp: '2026-07-19 09:00', title: 'Orden Creada', author: 'Oficina' },
      { id: 'tl-41', timestamp: '2026-07-19 16:20', title: 'Presupuesto Aprobado', author: 'Cliente (Ing. Javier)', note: 'Cliente autorizó reparación inmediata.' },
      { id: 'tl-42', timestamp: '2026-07-20 08:30', title: 'Reparación en Proceso', author: 'Téc. Roberto Gómez', note: 'Instalando nueva válvula solenoide.' }
    ]
  },
  {
    id: 'ord-1006',
    folio: 'OS-1006',
    clientId: 'cli-3',
    clientName: 'Corporativo San José',
    departmentId: 'dep-301',
    departmentName: 'Torre A - Cuarto de Servidores',
    description: 'Reemplazo de baterías de respaldo UPS de 10 KVA.',
    priority: 'Alta',
    status: 'Finalizada',
    technicianId: 'tech-2',
    technicianName: 'Ana Mendoza',
    createdAt: '2026-07-18 08:00',
    startedAt: '2026-07-18 09:30',
    completedAt: '2026-07-18 17:00',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    ],
    diagnosticNotes: 'Baterías fuera de vida útil con sulfatación en bornes.',
    requestedParts: [],
    budget: {
      id: 'bud-1006',
      laborCost: 1800,
      parts: [],
      taxRate: 0.16,
      status: 'Aprobado'
    },
    solutionNotes: 'Se reemplazaron 16 celdas de gel de ciclo profundo. Pruebas de conmutación 100% exitosas.',
    solutionPhotos: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'
    ],
    clientSignature: 'Firma Digital Registrada - Lic. Andrés IT',
    timeline: [
      { id: 'tl-50', timestamp: '2026-07-18 08:00', title: 'Orden Creada', author: 'Oficina' },
      { id: 'tl-51', timestamp: '2026-07-18 17:00', title: 'Orden Finalizada', author: 'Téc. Ana Mendoza', note: 'Cierre con conformidad del cliente.' }
    ]
  }
];
