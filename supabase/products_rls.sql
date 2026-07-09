-- À exécuter dans Supabase Dashboard → SQL Editor (projet xbwkbnqbkpcchwdfpznt),
-- APRÈS products_audit.sql.
-- Verrouille la table "products" : lecture publique (nécessaire pour que le
-- calculateur fonctionne sans connexion), écriture réservée à l'admin.
-- Script idempotent : peut être ré-exécuté sans risque.

-- Supprime toutes les policies existantes sur products, quel que soit leur nom
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'products' loop
    execute format('drop policy if exists %I on public.products', pol.policyname);
  end loop;
end $$;

alter table public.products enable row level security;

create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (true);

create policy "products_admin_insert"
  on public.products for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = 'rmazerat@gmail.com');

create policy "products_admin_update"
  on public.products for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'rmazerat@gmail.com')
  with check (auth.jwt() ->> 'email' = 'rmazerat@gmail.com');

create policy "products_admin_delete"
  on public.products for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'rmazerat@gmail.com');
