CREATE POLICY "Somente servico gerencia escola cron"
ON public.escola_cron FOR ALL TO service_role
USING (true) WITH CHECK (true);