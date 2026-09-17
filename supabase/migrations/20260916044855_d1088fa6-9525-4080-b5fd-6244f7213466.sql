CREATE TABLE IF NOT EXISTS public.licoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tema TEXT NOT NULL,
  regra TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'estudo',
  peso INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.licoes TO authenticated;
GRANT ALL ON public.licoes TO service_role;
ALTER TABLE public.licoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dono cuida das proprias licoes" ON public.licoes;
CREATE POLICY "dono cuida das proprias licoes" ON public.licoes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX IF NOT EXISTS licoes_sem_repetir ON public.licoes (user_id, md5(lower(regra)));
CREATE INDEX IF NOT EXISTS licoes_por_usuario ON public.licoes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.escola_estado (
  user_id UUID NOT NULL PRIMARY KEY,
  dia INTEGER NOT NULL DEFAULT 0,
  licoes_total INTEGER NOT NULL DEFAULT 0,
  media NUMERIC NOT NULL DEFAULT 0,
  pausado BOOLEAN NOT NULL DEFAULT false,
  motivo TEXT,
  lease_ate TIMESTAMP WITH TIME ZONE,
  ultimo_ciclo TIMESTAMP WITH TIME ZONE,
  ultimo_resumo TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escola_estado TO authenticated;
GRANT ALL ON public.escola_estado TO service_role;
ALTER TABLE public.escola_estado ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dono cuida do proprio estado de escola" ON public.escola_estado;
CREATE POLICY "dono cuida do proprio estado de escola" ON public.escola_estado FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);