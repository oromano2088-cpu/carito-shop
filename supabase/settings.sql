-- Ajustes editables desde /admin/ajustes (hoy: número de WhatsApp).
-- Ya aplicado en Supabase el 29/09/2026 (migración settings_whatsapp).
-- Lectura pública; escritura solo con la función set_setting, que valida el PIN del panel.
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
create policy "lectura publica settings" on public.settings for select to anon, authenticated using (true);

create table if not exists public.admin_config (
  id int primary key default 1 check (id = 1),
  pin_hash text not null
);
alter table public.admin_config enable row level security;
-- PIN inicial 2580. Para cambiarlo: update admin_config set pin_hash = encode(sha256('NUEVO'::bytea),'hex');
-- y cambiar también ADMIN_PIN en src/components/AdminGate.tsx.
insert into public.admin_config (id, pin_hash) values (1, encode(sha256('2580'::bytea), 'hex')) on conflict (id) do nothing;

create or replace function public.set_setting(p_pin text, p_key text, p_value text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_key not in ('whatsapp') then raise exception 'clave no permitida'; end if;
  if not exists (select 1 from admin_config where id = 1 and pin_hash = encode(sha256(coalesce(p_pin,'')::bytea), 'hex')) then
    raise exception 'PIN incorrecto';
  end if;
  insert into settings (key, value, updated_at) values (p_key, p_value, now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
  return true;
end; $$;
revoke all on function public.set_setting(text, text, text) from public;
grant execute on function public.set_setting(text, text, text) to anon, authenticated;

insert into public.settings (key, value) values ('whatsapp', '5491141768461') on conflict (key) do nothing;
