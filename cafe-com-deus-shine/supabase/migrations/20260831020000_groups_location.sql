-- Localização dos "cafés" (grupos): latitude/longitude para o mapa da
-- tela Cafés > Localização. Inserida manualmente (sem geocodificação
-- automática) por quem já pode editar o grupo — as policies
-- "groups_select"/"groups_leader_update" existentes (admin/desenvolvedor
-- ou a própria líder do grupo) já cobrem essas colunas novas, sem precisar
-- de RLS adicional.
alter table groups
  add column latitude double precision,
  add column longitude double precision;

comment on column groups.latitude is 'Latitude do local de encontro do café — inserida manualmente (admin/desenvolvedor ou a própria líder do grupo).';
comment on column groups.longitude is 'Longitude do local de encontro do café — inserida manualmente (admin/desenvolvedor ou a própria líder do grupo).';
