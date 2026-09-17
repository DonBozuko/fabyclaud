CREATE TABLE public.github_contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  token TEXT NOT NULL,
  login TEXT NOT NULL DEFAULT '',
  repo TEXT NOT NULL DEFAULT '',
  branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.github_contas TO authenticated;
GRANT ALL ON public.github_contas TO service_role;
ALTER TABLE public.github_contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donos gerenciam sua conta github" ON public.github_contas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_github_contas_updated_at BEFORE UPDATE ON public.github_contas FOR EACH ROW EXECUTE FUNCTION public.faby_touch_updated_at();