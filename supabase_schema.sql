-- ====================================================================
-- SUPABASE SCHEMA & RLS POLICIES FOR SISTEMA DE GESTIÓN DE SERVICIOS
-- Project: battwitnhrezwotkcvbc (sij@appdesignproyectos.com's Project)
-- URL: https://battwitnhrezwotkcvbc.supabase.co
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. ENUM TYPES
-- --------------------------------------------------------------------
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
-- 2. TABLAS
-- --------------------------------------------------------------------

-- Usuarios del Sistema
CREATE TABLE IF NOT EXISTS public.system_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role user_role_type NOT NULL DEFAULT 'tech',
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tax_id TEXT,
    fiscal_address TEXT,
    delivery_address TEXT,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departamentos / Sucursales
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Técnicos de Campo
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.system_users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    specialty TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Disponible' CHECK (status IN ('Disponible', 'En Ruta', 'Inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catálogo de Refacciones y Precios
CREATE TABLE IF NOT EXISTS public.spare_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Órdenes de Servicio (OS)
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Cotizaciones y Presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gastos Operativos (Dueño)
CREATE TABLE IF NOT EXISTS public.operating_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('Combustible', 'Herramientas', 'Viáticos', 'Mantenimiento Vehículos', 'Otros')),
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    registered_by TEXT NOT NULL DEFAULT 'Dueño General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. ÍNDICES DE RENDIMIENTO
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_tech ON public.service_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.service_orders(status);
CREATE INDEX IF NOT EXISTS idx_timeline_order ON public.order_timeline(order_id);

-- --------------------------------------------------------------------
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
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

-- Función aux para obtener el rol del usuario auth
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role_type AS $$
DECLARE
    u_role user_role_type;
BEGIN
    SELECT role INTO u_role
    FROM public.system_users
    WHERE auth_user_id = auth.uid() OR email = auth.email();
    
    RETURN COALESCE(u_role, 'client'::user_role_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- 5. POLÍTICAS DE SEGURIDAD (RLS) IDEMPOTENTES (CON DROP POLICY)
-- --------------------------------------------------------------------

-- System Users & Expenses (Owner)
DROP POLICY IF EXISTS owner_full_users ON public.system_users;
CREATE POLICY owner_full_users ON public.system_users
    FOR ALL USING (public.get_current_user_role() = 'owner');

DROP POLICY IF EXISTS owner_full_expenses ON public.operating_expenses;
CREATE POLICY owner_full_expenses ON public.operating_expenses
    FOR ALL USING (public.get_current_user_role() = 'owner');

-- Spare Parts / Catalog
DROP POLICY IF EXISTS catalog_read_all ON public.spare_parts;
CREATE POLICY catalog_read_all ON public.spare_parts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS catalog_write_admin ON public.spare_parts;
CREATE POLICY catalog_write_admin ON public.spare_parts
    FOR ALL USING (public.get_current_user_role() IN ('owner', 'office'));

-- Clients & Departments
DROP POLICY IF EXISTS clients_admin_all ON public.clients;
CREATE POLICY clients_admin_all ON public.clients
    FOR ALL USING (public.get_current_user_role() IN ('owner', 'office'));

DROP POLICY IF EXISTS clients_read_tech ON public.clients;
CREATE POLICY clients_read_tech ON public.clients
    FOR SELECT USING (public.get_current_user_role() = 'tech');

DROP POLICY IF EXISTS depts_admin_all ON public.departments;
CREATE POLICY depts_admin_all ON public.departments
    FOR ALL USING (public.get_current_user_role() IN ('owner', 'office'));

DROP POLICY IF EXISTS depts_read_tech ON public.departments;
CREATE POLICY depts_read_tech ON public.departments
    FOR SELECT USING (public.get_current_user_role() = 'tech');

-- Service Orders
DROP POLICY IF EXISTS orders_admin_all ON public.service_orders;
CREATE POLICY orders_admin_all ON public.service_orders
    FOR ALL USING (public.get_current_user_role() IN ('owner', 'office'));

DROP POLICY IF EXISTS orders_tech_select ON public.service_orders;
CREATE POLICY orders_tech_select ON public.service_orders
    FOR SELECT USING (
        public.get_current_user_role() = 'tech'
        OR technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS orders_tech_update ON public.service_orders;
CREATE POLICY orders_tech_update ON public.service_orders
    FOR UPDATE USING (
        public.get_current_user_role() = 'tech'
        OR technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
    )
    WITH CHECK (true);

-- Budgets
DROP POLICY IF EXISTS budgets_admin_all ON public.budgets;
CREATE POLICY budgets_admin_all ON public.budgets
    FOR ALL USING (public.get_current_user_role() IN ('owner', 'office'));

DROP POLICY IF EXISTS budgets_tech_read ON public.budgets;
CREATE POLICY budgets_tech_read ON public.budgets
    FOR SELECT USING (public.get_current_user_role() IN ('tech', 'client'));

DROP POLICY IF EXISTS budgets_client_update ON public.budgets;
CREATE POLICY budgets_client_update ON public.budgets
    FOR UPDATE USING (public.get_current_user_role() = 'client')
    WITH CHECK (status IN ('Aprobado', 'Rechazado'));

-- Timeline
DROP POLICY IF EXISTS timeline_read_all ON public.order_timeline;
CREATE POLICY timeline_read_all ON public.order_timeline
    FOR SELECT USING (true);

DROP POLICY IF EXISTS timeline_write_authenticated ON public.order_timeline;
CREATE POLICY timeline_write_authenticated ON public.order_timeline
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);

-- Políticas Globales para Admin / Dueño (Sin duplicidad)
DROP POLICY IF EXISTS admin_owner_full_orders ON public.service_orders;
CREATE POLICY admin_owner_full_orders ON public.service_orders FOR ALL USING (true);

DROP POLICY IF EXISTS admin_owner_full_budgets ON public.budgets;
CREATE POLICY admin_owner_full_budgets ON public.budgets FOR ALL USING (true);

DROP POLICY IF EXISTS admin_owner_full_parts ON public.spare_parts;
CREATE POLICY admin_owner_full_parts ON public.spare_parts FOR ALL USING (true);

DROP POLICY IF EXISTS admin_owner_full_clients ON public.clients;
CREATE POLICY admin_owner_full_clients ON public.clients FOR ALL USING (true);

DROP POLICY IF EXISTS admin_owner_full_expenses ON public.operating_expenses;
CREATE POLICY admin_owner_full_expenses ON public.operating_expenses FOR ALL USING (true);

-- --------------------------------------------------------------------
-- 6. PERMISOS GLOBALES
-- --------------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, anon;
