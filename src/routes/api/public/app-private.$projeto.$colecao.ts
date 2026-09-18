import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,content-type",
  "Cache-Control": "no-store",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLECAO = /^[a-z0-9_-]{1,40}$/i;
const corpoSchema = z.record(z.unknown());
function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

async function contexto(request: Request, projeto: string) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) return { erro: json({ erro: "Entre para acessar estes dados." }, 401) } as const;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user)
    return { erro: json({ erro: "Sessão inválida ou encerrada." }, 401) } as const;
  const { data: perfil } = await supabaseAdmin
    .from("app_perfis")
    .select("id")
    .eq("projeto_id", projeto)
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!perfil)
    return { erro: json({ erro: "Esta conta não pertence a este aplicativo." }, 403) } as const;
  return { supabaseAdmin, userId: data.user.id } as const;
}

export const Route = createFileRoute("/api/public/app-private/$projeto/$colecao")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ params, request }) => {
        if (!UUID.test(params.projeto) || !COLECAO.test(params.colecao))
          return json({ erro: "Endereço inválido." }, 400);
        const ctx = await contexto(request, params.projeto);
        if ("erro" in ctx) return ctx.erro;
        const { data, error } = await ctx.supabaseAdmin
          .from("app_dados_privados")
          .select("id, created_at, dados")
          .eq("projeto_id", params.projeto)
          .eq("user_id", ctx.userId)
          .eq("colecao", params.colecao.toLowerCase())
          .order("created_at", { ascending: true })
          .limit(2000);
        return error
          ? json({ erro: error.message }, 500)
          : json(
              (data ?? []).map((r) => ({
                id: r.id,
                criado_em: r.created_at,
                ...(r.dados as object),
              })),
            );
      },
      POST: async ({ params, request }) => {
        if (!UUID.test(params.projeto) || !COLECAO.test(params.colecao))
          return json({ erro: "Endereço inválido." }, 400);
        const ctx = await contexto(request, params.projeto);
        if ("erro" in ctx) return ctx.erro;
        const parsed = corpoSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ erro: "Envie um objeto válido." }, 400);
        const { data, error } = await ctx.supabaseAdmin
          .from("app_dados_privados")
          .insert({
            projeto_id: params.projeto,
            user_id: ctx.userId,
            colecao: params.colecao.toLowerCase(),
            dados: parsed.data as never,
          })
          .select("id, created_at, dados")
          .single();
        return error
          ? json({ erro: error.message }, 500)
          : json({ id: data.id, criado_em: data.created_at, ...(data.dados as object) }, 201);
      },
      PUT: async ({ params, request }) => {
        if (!UUID.test(params.projeto) || !COLECAO.test(params.colecao))
          return json({ erro: "Endereço inválido." }, 400);
        const ctx = await contexto(request, params.projeto);
        if ("erro" in ctx) return ctx.erro;
        const id = new URL(request.url).searchParams.get("id") ?? "";
        if (!UUID.test(id)) return json({ erro: "Informe o registro." }, 400);
        const parsed = corpoSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ erro: "Envie um objeto válido." }, 400);
        const { data, error } = await ctx.supabaseAdmin
          .from("app_dados_privados")
          .update({ dados: parsed.data as never })
          .eq("id", id)
          .eq("projeto_id", params.projeto)
          .eq("user_id", ctx.userId)
          .eq("colecao", params.colecao.toLowerCase())
          .select("id, created_at, dados")
          .maybeSingle();
        if (error) return json({ erro: error.message }, 500);
        return data
          ? json({ id: data.id, criado_em: data.created_at, ...(data.dados as object) })
          : json({ erro: "Registro não encontrado." }, 404);
      },
      DELETE: async ({ params, request }) => {
        if (!UUID.test(params.projeto) || !COLECAO.test(params.colecao))
          return json({ erro: "Endereço inválido." }, 400);
        const ctx = await contexto(request, params.projeto);
        if ("erro" in ctx) return ctx.erro;
        const id = new URL(request.url).searchParams.get("id") ?? "";
        if (!UUID.test(id)) return json({ erro: "Informe o registro." }, 400);
        const { error } = await ctx.supabaseAdmin
          .from("app_dados_privados")
          .delete()
          .eq("id", id)
          .eq("projeto_id", params.projeto)
          .eq("user_id", ctx.userId)
          .eq("colecao", params.colecao.toLowerCase());
        return error ? json({ erro: error.message }, 500) : json({ ok: true });
      },
    },
  },
});
