-- Creates a trigger that automatically adds a row to `public.users` when a user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, has_access, notify_subjects)
  values (new.id, new.email, false, '{}');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
