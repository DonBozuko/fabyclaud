ALTER TABLE public.chaves_ia
  ADD COLUMN IF NOT EXISTS testada_ok boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS testada_em timestamptz,
  ADD COLUMN IF NOT EXISTS ultimo_erro text;