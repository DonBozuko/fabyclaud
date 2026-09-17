CREATE TABLE public.app_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL DEFAULT '',
  foto_url TEXT,
  funcao TEXT NOT NULL DEFAULT 'usuario',
  preferencias JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (projeto_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_perfis TO authenticated;
GRANT ALL ON public.app_perfis TO service_role;
ALTER TABLE public.app_perfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario ve o proprio perfil do app" ON public.app_perfis FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_perfis.projeto_id AND p.user_id = auth.uid()));
CREATE POLICY "Usuario cria o proprio perfil do app" ON public.app_perfis FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Usuario edita o proprio perfil do app" ON public.app_perfis FOR UPDATE TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_perfis.projeto_id AND p.user_id = auth.uid())) WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_perfis.projeto_id AND p.user_id = auth.uid()));
CREATE POLICY "Usuario apaga o proprio perfil do app" ON public.app_perfis FOR DELETE TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_perfis.projeto_id AND p.user_id = auth.uid()));
CREATE TRIGGER app_perfis_touch BEFORE UPDATE ON public.app_perfis FOR EACH ROW EXECUTE FUNCTION public.faby_touch_updated_at();

CREATE TABLE public.app_dados_privados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  colecao TEXT NOT NULL,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_dados_privados TO authenticated;
GRANT ALL ON public.app_dados_privados TO service_role;
ALTER TABLE public.app_dados_privados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario ve os proprios dados privados" ON public.app_dados_privados FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_dados_privados.projeto_id AND p.user_id = auth.uid()));
CREATE POLICY "Usuario cria os proprios dados privados" ON public.app_dados_privados FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Usuario edita os proprios dados privados" ON public.app_dados_privados FOR UPDATE TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_dados_privados.projeto_id AND p.user_id = auth.uid())) WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_dados_privados.projeto_id AND p.user_id = auth.uid()));
CREATE POLICY "Usuario apaga os proprios dados privados" ON public.app_dados_privados FOR DELETE TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_dados_privados.projeto_id AND p.user_id = auth.uid()));
CREATE INDEX app_dados_privados_usuario_colecao_idx ON public.app_dados_privados (projeto_id, user_id, colecao, created_at DESC);
CREATE TRIGGER app_dados_privados_touch BEFORE UPDATE ON public.app_dados_privados FOR EACH ROW EXECUTE FUNCTION public.faby_touch_updated_at();

CREATE TABLE public.execucoes_construcao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pedido TEXT NOT NULL,
  etapa_atual TEXT NOT NULL DEFAULT 'diagnostico',
  estado TEXT NOT NULL DEFAULT 'em_andamento',
  tentativa INTEGER NOT NULL DEFAULT 1,
  modelos_usados TEXT[] NOT NULL DEFAULT '{}',
  ultimo_erro TEXT,
  provas JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluida_em TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.execucoes_construcao TO authenticated;
GRANT ALL ON public.execucoes_construcao TO service_role;
ALTER TABLE public.execucoes_construcao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono gerencia suas execucoes" ON public.execucoes_construcao FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX execucoes_construcao_projeto_idx ON public.execucoes_construcao (projeto_id, created_at DESC);
CREATE TRIGGER execucoes_construcao_touch BEFORE UPDATE ON public.execucoes_construcao FOR EACH ROW EXECUTE FUNCTION public.faby_touch_updated_at();

CREATE TABLE public.etapas_construcao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_id UUID NOT NULL REFERENCES public.execucoes_construcao(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  etapa TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendente',
  entrada_resumo TEXT,
  resultado_resumo TEXT,
  erro TEXT,
  modelo TEXT,
  tentativa INTEGER NOT NULL DEFAULT 1,
  arquivos_produzidos TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluida_em TIMESTAMPTZ,
  UNIQUE (execucao_id, etapa, tentativa)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.etapas_construcao TO authenticated;
GRANT ALL ON public.etapas_construcao TO service_role;
ALTER TABLE public.etapas_construcao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono gerencia suas etapas" ON public.etapas_construcao FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX etapas_construcao_execucao_idx ON public.etapas_construcao (execucao_id, created_at);
CREATE TRIGGER etapas_construcao_touch BEFORE UPDATE ON public.etapas_construcao FOR EACH ROW EXECUTE FUNCTION public.faby_touch_updated_at();