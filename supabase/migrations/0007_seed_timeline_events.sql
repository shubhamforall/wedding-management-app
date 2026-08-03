-- =========================================================================
-- 0007_seed_timeline_events.sql
-- 📅 Timeline sheet pre-fills the 6 standard function rows to save typing;
-- users edit/delete freely afterwards. Mirror that on wedding creation.
-- =========================================================================

create function public.seed_default_timeline_events()
returns trigger as $$
begin
  insert into public.timeline_events (wedding_id, event_name, status)
  values
    (new.id, 'Engagement', 'Upcoming'),
    (new.id, 'Haldi', 'Upcoming'),
    (new.id, 'Mehendi', 'Upcoming'),
    (new.id, 'Sangeet', 'Upcoming'),
    (new.id, 'Wedding', 'Upcoming'),
    (new.id, 'Reception', 'Upcoming');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_wedding_created_seed_timeline
  after insert on public.weddings
  for each row execute function public.seed_default_timeline_events();
