CREATE TABLE public.projetos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT NOT NULL,
  modelo TEXT NOT NULL DEFAULT 'google',
  arquivos JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos TO authenticated;
GRANT ALL ON public.projetos TO service_role;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donos gerenciam seus projetos" ON public.projetos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX projetos_user_idx ON public.projetos (user_id, updated_at DESC);

CREATE TABLE public.mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES public.projetos ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL,
  conteudo TEXT NOT NULL DEFAULT '',
  modelo TEXT,
  ok BOOLEAN NOT NULL DEFAULT true,
  anexos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagens TO service_role;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donos gerenciam suas mensagens" ON public.mensagens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX mensagens_projeto_idx ON public.mensagens (projeto_id, created_at);

CREATE TABLE public.chaves_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chaves_ia TO authenticated;
GRANT ALL ON public.chaves_ia TO service_role;
ALTER TABLE public.chaves_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donos gerenciam suas chaves" ON public.chaves_ia FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.provedores_custom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  slug TEXT NOT NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  modelo TEXT NOT NULL,
  suporta_imagem BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provedores_custom TO authenticated;
GRANT ALL ON public.provedores_custom TO service_role;
ALTER TABLE public.provedores_custom ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donos gerenciam seus provedores" ON public.provedores_custom FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER projetos_touch BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER chaves_touch BEFORE UPDATE ON public.chaves_ia FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();