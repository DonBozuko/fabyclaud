GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_dados TO authenticated;
GRANT ALL ON public.app_dados TO service_role;

CREATE POLICY "Dono do projeto cria dados do app"
ON public.app_dados FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_dados.projeto_id AND p.user_id = auth.uid()));

CREATE POLICY "Dono do projeto edita dados do app"
ON public.app_dados FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_dados.projeto_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_dados.projeto_id AND p.user_id = auth.uid()));

CREATE POLICY "Dono do projeto apaga dados do app"
ON public.app_dados FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = app_dados.projeto_id AND p.user_id = auth.uid()));