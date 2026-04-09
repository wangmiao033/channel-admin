create table if not exists channels (
  id uuid primary key,
  channel_code text,
  channel_name text,
  platform text,
  discount_rate numeric
);

-- 使用 anon key 时请在 Supabase 控制台为本表配置 RLS 策略，或开发阶段关闭 RLS。
