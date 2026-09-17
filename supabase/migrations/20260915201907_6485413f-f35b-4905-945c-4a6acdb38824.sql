CREATE OR REPLACE FUNCTION public.faby_touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.memorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  conteudo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memorias TO authenticated;
GRANT ALL ON public.memorias TO service_role;
ALTER TABLE public.memorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donos gerenciam sua memoria" ON public.memorias FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_memorias_updated_at BEFORE UPDATE ON public.memorias FOR EACH ROW EXECUTE FUNCTION public.faby_touch_updated_at();

CREATE TABLE public.agentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  instrucoes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agentes TO authenticated;
GRANT ALL ON public.agentes TO service_role;
ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donos gerenciam seus agentes" ON public.agentes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_agentes_updated_at BEFORE UPDATE ON public.agentes FOR EACH ROW EXECUTE FUNCTION public.faby_touch_updated_at();

CREATE TABLE public.prompts_salvos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts_salvos TO authenticated;
GRANT ALL ON public.prompts_salvos TO service_role;
ALTER TABLE public.prompts_salvos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donos gerenciam seus prompts" ON public.prompts_salvos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  rotulo TEXT NOT NULL DEFAULT '',
  arquivos JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX backups_projeto_idx ON public.backups (projeto_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backups TO authenticated;
GRANT ALL ON public.backups TO service_role;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donos gerenciam seus backups" ON public.backups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);