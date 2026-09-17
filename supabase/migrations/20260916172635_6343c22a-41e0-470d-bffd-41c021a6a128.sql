CREATE TABLE public.app_api_limites (
  chave TEXT PRIMARY KEY,
  quantidade INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '65 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.app_api_limites TO service_role;

ALTER TABLE public.app_api_limites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente servico gerencia limites dos apps"
ON public.app_api_limites FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.consumir_limite_app(_chave TEXT, _limite INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  atual INTEGER;
BEGIN
  INSERT INTO public.app_api_limites (chave, quantidade)
  VALUES (_chave, 1)
  ON CONFLICT (chave) DO UPDATE
    SET quantidade = public.app_api_limites.quantidade + 1,
        updated_at = now()
  RETURNING quantidade INTO atual;

  DELETE FROM public.app_api_limites WHERE expires_at < now();
  RETURN atual <= GREATEST(1, LEAST(_limite, 1000));
END;
$$;

REVOKE ALL ON FUNCTION public.consumir_limite_app(TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consumir_limite_app(TEXT, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.consumir_limite_app(TEXT, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_limite_app(TEXT, INTEGER) TO service_role;