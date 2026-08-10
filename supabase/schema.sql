create table public.invitation_guests (
  id text primary key,
  title text null,
  name text not null,
  contact text not null,
  constraint invitation_guests_id_format
    check (id ~ '^[0-9]{3}$'),
  constraint invitation_guests_title_not_blank
    check (title is null or btrim(title) <> ''),
  constraint invitation_guests_name_not_blank
    check (btrim(name) <> ''),
  constraint invitation_guests_contact_not_blank
    check (btrim(contact) <> '')
);

alter table public.invitation_guests
  enable row level security;

revoke all on table public.invitation_guests from public;
revoke all on table public.invitation_guests from anon;
revoke all on table public.invitation_guests from authenticated;
grant select on table public.invitation_guests to service_role;

