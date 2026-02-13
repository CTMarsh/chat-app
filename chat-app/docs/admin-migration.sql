-- ============================================================
-- ChatArk Platform Admin Migration
-- Run against Supabase-dev first, then promote to production
-- ============================================================

-- 1. Add is_platform_admin to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin boolean NOT NULL DEFAULT false;

-- 2. Create is_platform_admin() SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 3. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Only system can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id
  ON public.admin_audit_logs(admin_id);

-- 4. Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins can update settings"
  ON public.platform_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins can insert settings"
  ON public.platform_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

-- Seed default platform settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('max_workspace_members', '50', 'Maximum number of members per workspace'),
  ('max_workspaces_per_user', '10', 'Maximum workspaces a user can own'),
  ('max_file_size_mb', '50', 'Maximum file upload size in MB'),
  ('max_widgets_per_workspace', '20', 'Maximum widgets per workspace'),
  ('allow_signups', 'true', 'Whether new user signups are enabled')
ON CONFLICT (key) DO NOTHING;

-- 5. Admin SELECT policies on existing tables
-- Profiles: admins can see all profiles
CREATE POLICY "Platform admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- Workspaces: admins can see all workspaces
CREATE POLICY "Platform admins can read all workspaces"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- Workspace members: admins can see all members
CREATE POLICY "Platform admins can read all workspace members"
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- Widgets: admins can see all widgets
CREATE POLICY "Platform admins can read all widgets"
  ON public.widgets
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- Conversations: admins can see all conversations
CREATE POLICY "Platform admins can read all conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- Messages: admins can see all messages
CREATE POLICY "Platform admins can read all messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- 6. RPC functions (all SECURITY DEFINER with is_platform_admin() gate)

-- admin_get_dashboard_metrics()
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_workspaces', (SELECT count(*) FROM public.workspaces),
    'total_conversations', (SELECT count(*) FROM public.conversations),
    'total_messages', (SELECT count(*) FROM public.messages),
    'total_widgets', (SELECT count(*) FROM public.widgets),
    'active_today', (SELECT count(*) FROM public.profiles WHERE last_seen_at > now() - interval '24 hours'),
    'conversations_today', (SELECT count(*) FROM public.conversations WHERE created_at > now() - interval '24 hours'),
    'messages_today', (SELECT count(*) FROM public.messages WHERE created_at > now() - interval '24 hours')
  ) INTO result;

  RETURN result;
END;
$$;

-- admin_log_action()
CREATE OR REPLACE FUNCTION public.admin_log_action(
  p_action text,
  p_target_type text,
  p_target_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_metadata)
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- admin_set_user_suspended()
CREATE OR REPLACE FUNCTION public.admin_set_user_suspended(
  p_user_id uuid,
  p_suspended boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Update user status
  UPDATE public.profiles
  SET status = CASE WHEN p_suspended THEN 'suspended' ELSE 'offline' END,
      updated_at = now()
  WHERE id = p_user_id;

  -- Log the action
  PERFORM public.admin_log_action(
    CASE WHEN p_suspended THEN 'user_suspended' ELSE 'user_activated' END,
    'user',
    p_user_id::text,
    jsonb_build_object('suspended', p_suspended)
  );
END;
$$;

-- admin_set_workspace_suspended()
CREATE OR REPLACE FUNCTION public.admin_set_workspace_suspended(
  p_workspace_id uuid,
  p_suspended boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Deactivate all widgets if suspending
  IF p_suspended THEN
    UPDATE public.widgets
    SET is_active = false, updated_at = now()
    WHERE workspace_id = p_workspace_id;
  END IF;

  -- Log the action
  PERFORM public.admin_log_action(
    CASE WHEN p_suspended THEN 'workspace_suspended' ELSE 'workspace_activated' END,
    'workspace',
    p_workspace_id::text,
    jsonb_build_object('suspended', p_suspended)
  );
END;
$$;

-- admin_update_setting()
CREATE OR REPLACE FUNCTION public.admin_update_setting(
  p_key text,
  p_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_value text;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get old value
  SELECT value INTO old_value FROM public.platform_settings WHERE key = p_key;

  -- Update setting
  UPDATE public.platform_settings
  SET value = p_value, updated_at = now(), updated_by = auth.uid()
  WHERE key = p_key;

  -- Log the change
  PERFORM public.admin_log_action(
    'setting_updated',
    'setting',
    p_key,
    jsonb_build_object('old_value', old_value, 'new_value', p_value)
  );
END;
$$;

-- 7. Set your user as platform admin (UPDATE with your user ID)
-- UPDATE public.profiles SET is_platform_admin = true WHERE id = '<your-user-id>';
