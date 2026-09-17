import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,content-type",
  "Cache-Control": "no-store",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const perfilSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  foto_url: z.string().url().max(1000).optional().or(z.literal("")),
  cargo: z.string().trim().max(80).default("usuario"),
  preferencias: z.record(z.unknown()).default({}),
});
const entradaSchema = z.discriminatedUnion("acao", [
  z.object({
    acao: z.literal("cadastro"),
    email: z.string().email(),
    senha: z.string().min(8).max(128),
    perfil: perfilSchema,
  }),
  z.object({
    acao: z.literal("entrar"),
    email: z.string().email(),
    senha: z.string().min(1).max(128),
  }),
  z.object({ acao: z.literal("renovar"), refresh_token: z.string().min(20).max(4096) }),
]);

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

function clientePublico() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Autenticação indisponível.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function dentroDoLimite(request: Request, projeto: string) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "desconhecido";
  const bytes = new TextEncoder().encode(
    `auth|${ip}|${projeto}|${new Date().toISOString().slice(0, 13)}`,
  );
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const chave = Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consumir_limite_app", {
    _chave: chave,
    _limite: 60,
  });
  return !error && data === true;
}

async function usuarioDoToken(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

async function perfilDoApp(projeto: string, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin
    .from("app_perfis")
    .select("user_id, nome, foto_url, cargo, preferencias")
    .eq("projeto_id", projeto)
    .eq("user_id", userId)
    .maybeSingle();
}

export const Route = createFileRoute("/api/public/app-auth/$projeto")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ params, request }) => {
        if (!UUID.test(params.projeto)) return json({ erro: "Projeto inválido." }, 400);
        const usuario = await usuarioDoToken(request);
        if (!usuario) return json({ erro: "Sessão inválida ou encerrada." }, 401);
        const { data, error } = await perfilDoApp(params.projeto, usuario.id);
        if (error) return json({ erro: error.message }, 500);
        if (!data) return json({ erro: "Esta conta não pertence a este aplicativo." }, 403);
        return json({ usuario: { id: usuario.id, email: usuario.email }, perfil: data });
      },
      POST: async ({ params, request }) => {
        if (!UUID.test(params.projeto)) return json({ erro: "Projeto inválido." }, 400);
        if (!(await dentroDoLimite(request, params.projeto)))
          return json({ erro: "Muitas tentativas. Aguarde antes de tentar novamente." }, 429);
        const parsed = entradaSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ erro: "Dados de acesso inválidos." }, 400);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: projeto } = await supabaseAdmin
          .from("projetos")
          .select("id")
          .eq("id", params.projeto)
          .maybeSingle();
        if (!projeto) return json({ erro: "Aplicativo não encontrado." }, 404);
        const auth = clientePublico();
        if (parsed.data.acao === "renovar") {
          const { data, error } = await auth.auth.refreshSession({
            refresh_token: parsed.data.refresh_token,
          });
          if (error || !data.session)
            return json({ erro: "Sessão encerrada. Entre novamente." }, 401);
          const perfil = await perfilDoApp(params.projeto, data.user?.id ?? "");
          if (!perfil.data)
            return json({ erro: "Esta conta não pertence a este aplicativo." }, 403);
          return json({
            sessao: data.session,
            usuario: { id: data.user?.id, email: data.user?.email },
            perfil: perfil.data,
          });
        }
        if (parsed.data.acao === "cadastro") {
          const { data, error } = await auth.auth.signUp({
            email: parsed.data.email,
            password: parsed.data.senha,
          });
          if (error || !data.user)
            return json({ erro: error?.message ?? "Não foi possível criar a conta." }, 400);
          if (!data.user.identities?.length)
            return json(
              { erro: "Esta conta já existe. Entre com a senha para vinculá-la ao aplicativo." },
              409,
            );
          const { error: perfilError } = await supabaseAdmin.from("app_perfis").upsert(
            {
              projeto_id: params.projeto,
              user_id: data.user.id,
              nome: parsed.data.perfil.nome,
              foto_url: parsed.data.perfil.foto_url || null,
              cargo: parsed.data.perfil.cargo,
              preferencias: parsed.data.perfil.preferencias as never,
            },
            { onConflict: "projeto_id,user_id" },
          );
          if (perfilError) return json({ erro: perfilError.message }, 500);
          return json(
            {
              confirmar_email: !data.session,
              sessao: data.session,
              usuario: { id: data.user.id, email: data.user.email },
            },
            201,
          );
        }
        const { data, error } = await auth.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.senha,
        });
        if (error || !data.session || !data.user)
          return json({ erro: "Email ou senha incorretos, ou email ainda não confirmado." }, 401);
        const perfil = await perfilDoApp(params.projeto, data.user.id);
        if (!perfil.data) return json({ erro: "Esta conta não pertence a este aplicativo." }, 403);
        return json({
          sessao: data.session,
          usuario: { id: data.user.id, email: data.user.email },
          perfil: perfil.data,
        });
      },
      PUT: async ({ params, request }) => {
        if (!UUID.test(params.projeto)) return json({ erro: "Projeto inválido." }, 400);
        const usuario = await usuarioDoToken(request);
        if (!usuario) return json({ erro: "Sessão inválida ou encerrada." }, 401);
        const parsed = perfilSchema.partial().safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ erro: "Perfil inválido." }, 400);
        const atual = await perfilDoApp(params.projeto, usuario.id);
        if (!atual.data) return json({ erro: "Esta conta não pertence a este aplicativo." }, 403);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("app_perfis")
          .update({ ...parsed.data, foto_url: parsed.data.foto_url || null } as never)
          .eq("projeto_id", params.projeto)
          .eq("user_id", usuario.id)
          .select("user_id, nome, foto_url, cargo, preferencias")
          .single();
        return error ? json({ erro: error.message }, 500) : json({ perfil: data });
      },
      DELETE: async ({ params, request }) => {
        if (!UUID.test(params.projeto)) return json({ erro: "Projeto inválido." }, 400);
        const token = request.headers
          .get("authorization")
          ?.replace(/^Bearer\s+/i, "")
          .trim();
        if (!token) return json({ erro: "Sessão inválida ou encerrada." }, 401);
        const usuario = await usuarioDoToken(request);
        if (!usuario) return json({ ok: true });
        const perfil = await perfilDoApp(params.projeto, usuario.id);
        if (!perfil.data) return json({ erro: "Esta conta não pertence a este aplicativo." }, 403);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.auth.admin.signOut(token, "local");
        return error
          ? json({ erro: "Não foi possível encerrar a sessão." }, 500)
          : json({ ok: true });
      },
    },
  },
});
