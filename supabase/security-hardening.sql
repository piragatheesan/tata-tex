-- Apply to an existing Tata Tex Supabase database before deploying the
-- shared database-backed login and public enquiry rate limits.

create table if not exists public.security_rate_limits (
  scope text not null check(scope in ('enquiry','login')),
  key_hash text not null check(key_hash ~ '^[a-f0-9]{64}$'),
  window_started timestamptz not null default now(),
  hit_count integer not null default 0 check(hit_count >= 0),
  primary key(scope,key_hash)
);
create index if not exists security_rate_limits_window_idx
  on public.security_rate_limits(window_started);
alter table public.security_rate_limits enable row level security;
revoke all on public.security_rate_limits from public,anon,authenticated;
grant all on public.security_rate_limits to service_role;

create or replace function public.consume_rate_limit(
  p_scope text,p_key_hash text,p_maximum integer,p_window_seconds integer
) returns boolean language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
  if p_scope not in ('enquiry','login') or p_key_hash !~ '^[a-f0-9]{64}$'
     or p_maximum < 1 or p_maximum > 30 or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;
  insert into public.security_rate_limits as current_limit(scope,key_hash,window_started,hit_count)
  values(p_scope,p_key_hash,clock_timestamp(),1)
  on conflict(scope,key_hash) do update set
    window_started = case
      when current_limit.window_started + make_interval(secs => p_window_seconds) <= clock_timestamp()
      then clock_timestamp() else current_limit.window_started end,
    hit_count = case
      when current_limit.window_started + make_interval(secs => p_window_seconds) <= clock_timestamp()
      then 1 else current_limit.hit_count + 1 end
  returning hit_count <= p_maximum into allowed;
  delete from public.security_rate_limits
    where window_started < clock_timestamp() - interval '1 day';
  return allowed;
end;
$$;

create or replace function public.clear_rate_limit(p_scope text,p_key_hash text)
returns void language sql security definer set search_path = '' as $$
  delete from public.security_rate_limits where scope=p_scope and key_hash=p_key_hash;
$$;
revoke all on function public.consume_rate_limit(text,text,integer,integer) from public,anon,authenticated;
revoke all on function public.clear_rate_limit(text,text) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;
grant execute on function public.clear_rate_limit(text,text) to service_role;
