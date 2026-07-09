-- À exécuter une fois dans Supabase Dashboard → SQL Editor (projet xbwkbnqbkpcchwdfpznt).
-- Crée une table d'historique qui enregistre automatiquement chaque insertion,
-- modification et suppression sur "products", avant que l'app ne puisse y toucher.

create table if not exists products_audit (
  id bigint generated always as identity primary key,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  panel_ref text,
  row_data jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by uuid default auth.uid()
);

create index if not exists products_audit_changed_at_idx on products_audit (changed_at desc);
create index if not exists products_audit_panel_ref_idx on products_audit (panel_ref);

alter table products_audit enable row level security;

drop policy if exists "Authenticated can read audit log" on products_audit;
drop policy if exists "Admin can read audit log" on products_audit;
create policy "Admin can read audit log"
  on products_audit for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'rmazerat@gmail.com');

-- Aucune policy insert/update/delete : seule la fonction trigger ci-dessous
-- (exécutée en security definer, donc avec les droits du propriétaire de table)
-- peut écrire dans products_audit. Les clients (anon/authenticated) ne peuvent
-- ni modifier ni effacer l'historique.

create or replace function products_audit_trigger() returns trigger
language plpgsql security definer as $$
begin
  if (TG_OP = 'DELETE') then
    insert into products_audit(action, panel_ref, row_data, changed_by)
    values ('DELETE', old.panel_ref, to_jsonb(old), auth.uid());
    return old;
  elsif (TG_OP = 'UPDATE') then
    insert into products_audit(action, panel_ref, row_data, changed_by)
    values ('UPDATE', new.panel_ref, jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)), auth.uid());
    return new;
  elsif (TG_OP = 'INSERT') then
    insert into products_audit(action, panel_ref, row_data, changed_by)
    values ('INSERT', new.panel_ref, to_jsonb(new), auth.uid());
    return new;
  end if;
end;
$$;

drop trigger if exists trg_products_audit on products;
create trigger trg_products_audit
  after insert or update or delete on products
  for each row execute function products_audit_trigger();
