create table public.invitation_guests (
  code text primary key,
  name text not null,
  guest_limit smallint not null,
  phone_number text not null,
  display_order integer not null unique,
  constraint invitation_guests_code_format
    check (
      code ~ '^[0-9]{3}$'
      and code <> '000'
    ),
  constraint invitation_guests_name_not_blank
    check (btrim(name) <> ''),
  constraint invitation_guests_guest_limit_positive
    check (guest_limit > 0),
  constraint invitation_guests_phone_number_digits
    check (phone_number ~ '^[0-9]+$'),
  constraint invitation_guests_display_order_positive
    check (display_order > 0)
);

alter table public.invitation_guests
  enable row level security;

revoke all on table public.invitation_guests from public;
revoke all on table public.invitation_guests from anon;
revoke all on table public.invitation_guests from authenticated;
revoke all on table public.invitation_guests from service_role;
grant select on table public.invitation_guests to service_role;
