ALTER TABLE public.chaves_ia ADD COLUMN IF NOT EXISTS api_url text;

ALTER TABLE public.chaves_ia ADD CONSTRAINT chaves_ia_api_url_segura CHECK (
  api_url IS NULL OR api_url = '' OR api_url ~ '^https://'
);