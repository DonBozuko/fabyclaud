/**
 * Armazenamento público hospedado para conteúdo não sensível dos aplicativos.
 *
 * Cada projeto ganha um endereço próprio e cada "coleção" funciona como uma
 * tabela (ex: recados, produtos). Os aplicativos gerados chamam este
 * endereço com fetch — funciona na prévia do navegador e depois de publicar,
 * sem terminal e sem instalar nada.
 *
 *  GET    /api/public/dados/<projeto>/<colecao>            -> lista
 *  POST   /api/public/dados/<projeto>/<colecao>            -> cria (corpo JSON)
 *  PUT    /api/public/dados/<projeto>/<colecao>?id=<id>    -> atualiza
 *  DELETE /api/public/dados/<projeto>/<colecao>?id=<id>    -> apaga
 */
import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Cache-Control": "no-store",
};

const LIMITE_REGISTROS = 2000;
const LIMITE_CORPO = 120_000; // ~120 KB por registro
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLECAO = /^[a-z0-9_-]{1,40}$/i;
const COLECOES_PRIVADAS =
  /^(usuarios?|users?|contas?|accounts?|sessoes?|sessions?|auth|pagamentos?|payments?)$/i;
const CAMPOS_SENSIVEIS =
  /^(senha|password|pass|token|secret|segredo|api_?key|chave|cartao|card|cvv|cpf|cnpj)$/i;

async function identificadorLimite(request: Request, projeto: string, escrita: boolean) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "desconhecido";
  const janela = new Date().toISOString().slice(0, 13);
  const bytes = new TextEncoder().encode(`${ip}|${projeto}|${escrita ? "w" : "r"}|${janela}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function excedeuLimite(request: Request, projeto: string, escrita: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const chave = await identificadorLimite(request, projeto, escrita);
  const { data, error } = await supabaseAdmin.rpc("consumir_limite_app", {
    _chave: chave,
    _limite: escrita ? 120 : 600,
  });
  return error ? true : data !== true;
}

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

function erro(mensagem: string, status: number) {
  return json({ erro: mensagem }, status);
}

type Registro = { id: string; created_at: string; dados: Record<string, unknown> };

function achatar(linha: Registro) {
  return { id: linha.id, criado_em: linha.created_at, ...(linha.dados ?? {}) };
}

async function conectar(projeto: string, colecao: string) {
  if (!UUID.test(projeto)) return { erro: erro("Projeto inválido.", 400) } as const;
  if (!COLECAO.test(colecao)) {
    return { erro: erro("Nome de coleção inválido (use letras, números, - ou _).", 400) } as const;
  }
  if (COLECOES_PRIVADAS.test(colecao)) {
    return {
      erro: erro("Esta API pública não aceita contas, sessões ou pagamentos.", 403),
    } as const;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existe } = await supabaseAdmin
    .from("projetos")
    .select("id")
    .eq("id", projeto)
    .maybeSingle();
  if (!existe) return { erro: erro("Este projeto não existe.", 404) } as const;
  return { supabaseAdmin } as const;
}

async function lerCorpo(request: Request) {
  const texto = await request.text();
  if (texto.length > LIMITE_CORPO) return { erro: erro("Registro muito grande.", 413) } as const;
  if (!texto.trim()) return { valor: {} as Record<string, unknown> } as const;
  try {
    const valor = JSON.parse(texto) as unknown;
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
      return { erro: erro("Envie um objeto JSON.", 400) } as const;
    }
    const registro = valor as Record<string, unknown>;
    const campoProibido = Object.keys(registro).find((campo) => CAMPOS_SENSIVEIS.test(campo));
    if (campoProibido) {
      return {
        erro: erro(
          `O campo ${campoProibido} é privado e não pode ser salvo nesta API pública.`,
          403,
        ),
      } as const;
    }
    return { valor: registro } as const;
  } catch {
    return { erro: erro("JSON inválido.", 400) } as const;
  }
}

export const Route = createFileRoute("/api/public/dados/$projeto/$colecao")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),

      GET: async ({ params, request }) => {
        if (await excedeuLimite(request, params.projeto, false))
          return erro("Muitas consultas. Tente novamente mais tarde.", 429);
        const conexao = await conectar(params.projeto, params.colecao);
        if ("erro" in conexao) return conexao.erro;
        const { data, error } = await conexao.supabaseAdmin
          .from("app_dados")
          .select("id, created_at, dados")
          .eq("projeto_id", params.projeto)
          .eq("colecao", params.colecao.toLowerCase())
          .order("created_at", { ascending: true })
          .limit(LIMITE_REGISTROS);
        if (error) return erro(error.message, 500);
        return json((data ?? []).map((linha: any) => achatar(linha as Registro)));
      },

      POST: async ({ params, request }) => {
        if (await excedeuLimite(request, params.projeto, true))
          return erro("Muitas alterações. Tente novamente mais tarde.", 429);
        const conexao = await conectar(params.projeto, params.colecao);
        if ("erro" in conexao) return conexao.erro;
        const corpo = await lerCorpo(request);
        if ("erro" in corpo) return corpo.erro;

        const { count } = await conexao.supabaseAdmin
          .from("app_dados")
          .select("id", { count: "exact", head: true })
          .eq("projeto_id", params.projeto)
          .eq("colecao", params.colecao.toLowerCase());
        if ((count ?? 0) >= LIMITE_REGISTROS) {
          return erro("Limite de registros desta coleção atingido.", 409);
        }

        const { data, error } = await conexao.supabaseAdmin
          .from("app_dados")
          .insert({
            projeto_id: params.projeto,
            colecao: params.colecao.toLowerCase(),
            dados: corpo.valor as never,
          })
          .select("id, created_at, dados")
          .single();
        if (error) return erro(error.message, 500);
        return json(achatar(data as Registro), 201);
      },

      PUT: async ({ params, request }) => {
        if (await excedeuLimite(request, params.projeto, true))
          return erro("Muitas alterações. Tente novamente mais tarde.", 429);
        const conexao = await conectar(params.projeto, params.colecao);
        if ("erro" in conexao) return conexao.erro;
        const corpo = await lerCorpo(request);
        if ("erro" in corpo) return corpo.erro;

        const url = new URL(request.url);
        const id = url.searchParams.get("id") ?? String(corpo.valor["id"] ?? "");
        if (!UUID.test(id)) return erro("Informe o id do registro.", 400);

        const { id: _ignorado, ...campos } = corpo.valor;
        const { data, error } = await conexao.supabaseAdmin
          .from("app_dados")
          .update({ dados: campos as never })
          .eq("id", id)
          .eq("projeto_id", params.projeto)
          .eq("colecao", params.colecao.toLowerCase())
          .select("id, created_at, dados")
          .maybeSingle();
        if (error) return erro(error.message, 500);
        if (!data) return erro("Registro não encontrado.", 404);
        return json(achatar(data as Registro));
      },

      DELETE: async ({ params, request }) => {
        if (await excedeuLimite(request, params.projeto, true))
          return erro("Muitas alterações. Tente novamente mais tarde.", 429);
        const conexao = await conectar(params.projeto, params.colecao);
        if ("erro" in conexao) return conexao.erro;
        const url = new URL(request.url);
        const id = url.searchParams.get("id") ?? "";
        if (!UUID.test(id)) return erro("Informe o id do registro.", 400);
        const { error } = await conexao.supabaseAdmin
          .from("app_dados")
          .delete()
          .eq("id", id)
          .eq("projeto_id", params.projeto)
          .eq("colecao", params.colecao.toLowerCase());
        if (error) return erro(error.message, 500);
        return json({ ok: true });
      },
    },
  },
});
