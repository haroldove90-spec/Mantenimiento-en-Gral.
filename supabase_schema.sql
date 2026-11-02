-- ====================================================================
-- SUPABASE SCHEMA & RLS POLICIES FOR SISTEMA DE GESTIÓN DE SERVICIOS (SIJ)
-- Project: battwitnhrezwotkcvbc
-- URL: https://battwitnhrezwotkcvbc.supabase.co
-- ====================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('owner', 'office', 'tech', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('Baja', 'Media', 'Alta');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_stage AS ENUM (
        'Pendiente de Visita',
        'En Diagnóstico',
        'Presupuesto Pendiente',
        'Esperando Aprobación',
        'En Reparación',
        'Cobrado/Cerrado',
        'Garantía Reabierta'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('Efectivo', 'Tarjeta', 'Transferencia', 'Cheque');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------------------------
-- 3. CREACIÓN Y ESTRUCTURA DE TABLAS
-- --------------------------------------------------------------------

-- Usuarios del Sistema (system_users)
CREATE TABLE IF NOT EXISTS public.system_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    phone TEXT,
    role user_role_type NOT NULL DEFAULT 'owner',
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas en caso de que la tabla ya existiera previamente
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Activo';

-- Clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tax_id TEXT,
    fiscal_address TEXT,
    delivery_address TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    model TEXT,
    fault TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas en caso de que la tabla ya existiera previamente
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS fault TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Activo';

-- Departamentos / Sucursales
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Técnicos de Campo
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.system_users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    specialty TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Disponible' CHECK (status IN ('Disponible', 'En Ruta', 'Inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catálogo de Refacciones y Precios
CREATE TABLE IF NOT EXISTS public.spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Órdenes de Servicio (OS)
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    equipment_type TEXT NOT NULL,
    description TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'Media',
    status order_stage NOT NULL DEFAULT 'Pendiente de Visita',
    technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
    scheduled_date DATE,
    route_order INT DEFAULT 1,
    route_notes TEXT,
    diagnostic_notes TEXT,
    diagnostic_photos TEXT[] DEFAULT '{}',
    solution_notes TEXT,
    solution_photos TEXT[] DEFAULT '{}',
    client_signature TEXT,
    payment_method payment_method_enum,
    collected_amount NUMERIC(12, 2) DEFAULT 0.00,
    is_warranty BOOLEAN DEFAULT FALSE,
    warranty_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Agregar columnas de asignación y compatibilidad sin alterar registros existentes
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS technician_name TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS technician_id UUID;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS department_name TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS equipment_type TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS user_id UUID;

-- Sincronizar automáticamente registros existentes donde falte technician_name
UPDATE public.service_orders so
SET technician_name = t.name
FROM public.technicians t
WHERE so.technician_id = t.id
  AND (so.technician_name IS NULL OR TRIM(so.technician_name) = '');

-- Sincronizar automáticamente technician_id donde falte pero exista el nombre
UPDATE public.service_orders so
SET technician_id = t.id
FROM public.technicians t
WHERE so.technician_id IS NULL
  AND so.technician_name IS NOT NULL
  AND LOWER(TRIM(so.technician_name)) = LOWER(TRIM(t.name));

-- Enlazar technicians.user_id con system_users
UPDATE public.technicians t
SET user_id = u.id, email = COALESCE(t.email, u.email)
FROM public.system_users u
WHERE t.user_id IS NULL
  AND (LOWER(TRIM(t.name)) = LOWER(TRIM(u.name)) OR (t.email IS NOT NULL AND LOWER(TRIM(t.email)) = LOWER(TRIM(u.email))));

-- Cotizaciones y Presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.service_orders(id) ON DELETE CASCADE,
    labor_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.1600,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Enviado', 'Aprobado', 'Rechazado')),
    notes TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refacciones Solicitadas por Orden
CREATE TABLE IF NOT EXISTS public.requested_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
    spare_part_id UUID REFERENCES public.spare_parts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    estimated_unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historial de Cambios (Timeline)
CREATE TABLE IF NOT EXISTS public.order_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gastos Operativos
CREATE TABLE IF NOT EXISTS public.operating_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('Combustible', 'Herramientas', 'Viáticos', 'Mantenimiento Vehículos', 'Otros')),
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    registered_by TEXT NOT NULL DEFAULT 'Dueño General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. ÍNDICES DE RENDIMIENTO
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON public.system_users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.system_users(username);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_tech ON public.service_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.service_orders(status);
CREATE INDEX IF NOT EXISTS idx_timeline_order ON public.order_timeline(order_id);

-- --------------------------------------------------------------------
-- 5. SEGURIDAD DE FILAS (RLS) Y POLÍTICAS PERMISIVAS
-- --------------------------------------------------------------------
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requested_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas para evitar conflictos (ERROR: 42710 policy already exists)
DROP POLICY IF EXISTS owner_full_users ON public.system_users;
DROP POLICY IF EXISTS allow_all_users ON public.system_users;
DROP POLICY IF EXISTS "allow_full_access_system_users" ON public.system_users;
DROP POLICY IF EXISTS "Permitir lectura publica a system_users" ON public.system_users;
DROP POLICY IF EXISTS "Permitir insercion a system_users" ON public.system_users;
DROP POLICY IF EXISTS "Permitir actualizacion a system_users" ON public.system_users;
DROP POLICY IF EXISTS "Permitir lectura publica de usuarios" ON public.system_users;
DROP POLICY IF EXISTS "Permitir insercion publica de usuarios" ON public.system_users;
DROP POLICY IF EXISTS "Permitir actualizacion publica de usuarios" ON public.system_users;

-- Crear Política Universal Permisiva para system_users
CREATE POLICY "allow_full_access_system_users" 
ON public.system_users 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Políticas para el resto de tablas
DROP POLICY IF EXISTS "allow_full_access_clients" ON public.clients;
CREATE POLICY "allow_full_access_clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_full_access_departments" ON public.departments;
CREATE POLICY "allow_full_access_departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_full_access_technicians" ON public.technicians;
CREATE POLICY "allow_full_access_technicians" ON public.technicians FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_full_access_spare_parts" ON public.spare_parts;
CREATE POLICY "allow_full_access_spare_parts" ON public.spare_parts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_full_access_service_orders" ON public.service_orders;
CREATE POLICY "allow_full_access_service_orders" ON public.service_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_full_access_budgets" ON public.budgets;
CREATE POLICY "allow_full_access_budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_full_access_requested_parts" ON public.requested_parts;
CREATE POLICY "allow_full_access_requested_parts" ON public.requested_parts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_full_access_order_timeline" ON public.order_timeline;
CREATE POLICY "allow_full_access_order_timeline" ON public.order_timeline FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_full_access_operating_expenses" ON public.operating_expenses;
CREATE POLICY "allow_full_access_operating_expenses" ON public.operating_expenses FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 6. PERMISOS DE ROL (GRANT) Y RECARGA DE ESQUEMA POSTGREST
-- --------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;

-- Notificar a PostgREST para recargar la caché de esquema inmediatamente
NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- 7. SCRIPT SEGURO DE CONCILIACIÓN DE TÉCNICOS Y ÓRDENES (SIN BORRAR NADA)
-- Ejecutar en Supabase SQL Editor para vincular técnicos y órdenes existentes:
-- ====================================================================

-- A. Asegurar columnas opcionales sin borrar datos
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS technician_name TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS technician_id UUID;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.system_users(id) ON DELETE SET NULL;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS email TEXT;

-- B. Vincular técnicos huérfanos con sus usuarios de sistema correspondientes
UPDATE public.technicians t
SET user_id = u.id, email = u.email
FROM public.system_users u
WHERE t.user_id IS NULL 
  AND (LOWER(TRIM(t.name)) = LOWER(TRIM(u.name)) OR (t.email IS NOT NULL AND LOWER(TRIM(t.email)) = LOWER(TRIM(u.email))));

-- C. Corregir órdenes con technician_id faltante pero que ya tienen el nombre asignado
UPDATE public.service_orders so
SET technician_id = t.id
FROM public.technicians t
WHERE (so.technician_id IS NULL OR so.technician_id NOT IN (SELECT id FROM public.technicians))
  AND so.technician_name IS NOT NULL
  AND LOWER(TRIM(so.technician_name)) = LOWER(TRIM(t.name));

-- D. Si existen órdenes con el ID de system_users en vez del ID de technicians, remapearlas
UPDATE public.service_orders so
SET technician_id = t.id
FROM public.technicians t
WHERE so.technician_id = t.user_id;

-- E. Asegurar que las contraseñas/PINes de empleados no se limiten a 10 caracteres (sin borrar registros)
DO $$ BEGIN
  ALTER TABLE public.employees ALTER COLUMN pin TYPE TEXT;
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN undefined_column THEN null;
END $$;

-- F. Asegurar columnas de contacto y ruta directa en service_orders
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS route_notes TEXT;

-- G. Sincronizar domicilios de sucursales/departamentos hacia las órdenes
UPDATE public.service_orders so
SET client_address = d.address,
    client_phone = COALESCE(so.client_phone, d.phone)
FROM public.departments d
WHERE so.department_id = d.id
  AND (so.client_address IS NULL OR TRIM(so.client_address) = '');

-- H. Habilitar Realtime para departments, system_users y employees
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.system_users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';

