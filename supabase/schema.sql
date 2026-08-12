-- CARITO.SHOP — esquema de base de datos (Supabase / PostgreSQL)
-- Pegar y ejecutar este archivo completo en: Supabase > SQL Editor > New query > Run

create table if not exists products (
  id text primary key,
  titulo text not null,
  categoria text not null,
  descripcion text not null,
  caracteristicas jsonb not null default '[]',
  precio numeric not null,
  precio_oferta numeric,
  oferta_hasta timestamptz,
  imagen text not null,
  imagenes jsonb,
  stock int not null default 0,
  stock_minimo int not null default 0,
  variantes jsonb,
  garantia_meses int not null default 0,
  sku text not null,
  status text not null default 'activo',
  vendidos int not null default 0,
  creado_en timestamptz not null default now(),
  likes int not null default 0,
  guardados int not null default 0,
  compartidos int not null default 0,
  vistas int not null default 0
);

create table if not exists customers (
  id text primary key,
  nombre text not null,
  telefono text not null,
  email text,
  total_comprado numeric not null default 0,
  cantidad_pedidos int not null default 0,
  deuda numeric not null default 0,
  ultima_compra timestamptz,
  es_recurrente boolean not null default false,
  score_interes int not null default 0,
  -- Ilustrativo para la demo del Asistente IA (ofertas segmentadas). El seguimiento real
  -- de like/guardado de cada visitante vive en la tabla "engagement" (por dispositivo).
  productos_guardados jsonb not null default '[]',
  productos_likeados jsonb not null default '[]'
);

create table if not exists orders (
  id text primary key,
  cliente jsonb not null,
  items jsonb not null,
  total numeric not null,
  entrega text not null,
  direccion text,
  metodo_pago text not null,
  status text not null default 'pendiente',
  creado_en timestamptz not null default now(),
  notas text
);

create table if not exists coupons (
  id text primary key,
  codigo text not null,
  tipo text not null,
  valor numeric not null,
  activo boolean not null default true,
  usos_maximos int,
  usos_actuales int not null default 0,
  vigente_hasta timestamptz
);

create table if not exists offers (
  id text primary key,
  cliente_id text not null,
  cliente_nombre text not null,
  product_id text not null,
  product_titulo text not null,
  motivo text not null,
  descuento_sugerido int not null,
  creado_en timestamptz not null default now(),
  estado text not null default 'sugerida'
);

create table if not exists reports (
  id text primary key,
  generado_en timestamptz not null default now(),
  periodo text not null,
  resumen text not null,
  hallazgos jsonb not null default '[]',
  recomendaciones jsonb not null default '[]'
);

-- Likes / guardados por visitante anónimo (identificado por un id guardado en su navegador,
-- no requiere que el cliente inicie sesión).
create table if not exists engagement (
  device_id text not null,
  product_id text not null references products(id) on delete cascade,
  liked boolean not null default false,
  saved boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (device_id, product_id)
);

-- Seguridad a nivel de fila (RLS): habilitada en todas las tablas.
-- Para este prototipo se usan políticas abiertas (lectura y escritura públicas) porque el
-- panel admin ya está protegido con PIN a nivel de aplicación. Para producción real, ver la
-- sección de seguridad de la especificación técnica (roles con Supabase Auth).
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table coupons enable row level security;
alter table offers enable row level security;
alter table reports enable row level security;
alter table engagement enable row level security;

drop policy if exists "public all" on products;
create policy "public all" on products for all using (true) with check (true);

drop policy if exists "public all" on customers;
create policy "public all" on customers for all using (true) with check (true);

drop policy if exists "public all" on orders;
create policy "public all" on orders for all using (true) with check (true);

drop policy if exists "public all" on coupons;
create policy "public all" on coupons for all using (true) with check (true);

drop policy if exists "public all" on offers;
create policy "public all" on offers for all using (true) with check (true);

drop policy if exists "public all" on reports;
create policy "public all" on reports for all using (true) with check (true);

drop policy if exists "public all" on engagement;
create policy "public all" on engagement for all using (true) with check (true);
