CREATE TABLE IF NOT EXISTS public.app_dados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  colecao TEXT NOT NULL,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_dados_projeto_colecao_idx ON public.app_dados (projeto_id, colecao, created_at DESC);

GRANT SELECT ON public.app_dados TO authenticated;
GRANT ALL ON public.app_dados TO service_role;

ALTER TABLE public.app_dados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dono do projeto ve os dados do app" ON public.app_dados;
CREATE POLICY "Dono do projeto ve os dados do app"
ON public.app_dados FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.projetos p
  WHERE p.id = app_dados.projeto_id AND p.user_id = auth.uid()
));