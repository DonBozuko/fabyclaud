/**
 * Estudo automático diário das IAs.
 *
 * Chamado por um agendador (uma vez por hora). Cada usuário estuda no máximo
 * uma vez por dia, poucos usuários por chamada, com trava de execução única no
 * banco e pausa automática quando falta crédito ou permissão.
 *
 *   POST /api/public/estudar?chave=<FABY_ESCOLA_CHAVE>
 */
import { createFileRoute } from "@tanstack/react-router";

const MAX_USUARIOS_POR_CHAMADA = 3;
const HORAS_ENTRE_CICLOS = 20;

async function estudar(request: Request) {
  const chave = new URL(request.url).searchParams.get("chave") ?? "";
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { rodarCicloEscola } = await import("@/lib/faby/escola.server");
  const db = supabaseAdmin as unknown as { from: (t: string) => any };

  // Só o agendador entra: senha do ambiente ou o token interno do banco.
  const { data: cron } = await db.from("escola_cron").select("token").eq("id", true).maybeSingle();
  const aceitas = [
    process.env["FABY_ESCOLA_CHAVE"] ?? "",
    (cron as { token?: string } | null)?.token ?? "",
  ].filter(Boolean);
  if (!chave || !aceitas.includes(chave)) {
    return new Response(JSON.stringify({ erro: "não autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const limite = new Date(Date.now() - HORAS_ENTRE_CICLOS * 3_600_000).toISOString();

  // Quem já estuda (fila normal) e quem nunca estudou (donos de chaves novas).
  const { data: emCurso } = await db
    .from("escola_estado")
    .select("user_id, ultimo_ciclo")
    .or(`ultimo_ciclo.is.null,ultimo_ciclo.lt.${limite}`)
    .limit(MAX_USUARIOS_POR_CHAMADA);
  const alvos: string[] = (emCurso ?? []).map((e: { user_id: string }) => e.user_id);

  if (alvos.length < MAX_USUARIOS_POR_CHAMADA) {
    const { data: comChave } = await db.from("chaves_ia").select("user_id").limit(50);
    for (const linha of (comChave ?? []) as { user_id: string }[]) {
      if (alvos.length >= MAX_USUARIOS_POR_CHAMADA) break;
      if (!alvos.includes(linha.user_id)) {
        const { data: existe } = await db
          .from("escola_estado")
          .select("user_id")
          .eq("user_id", linha.user_id)
          .maybeSingle();
        if (!existe) alvos.push(linha.user_id);
      }
    }
  }

  const resultados = [];
  for (const userId of alvos) {
    const r = await rodarCicloEscola(db, userId);
    resultados.push({
      user_id: userId,
      ok: r.ok,
      mensagem: r.mensagem,
      dia: r.dia,
      pausado: r.pausado,
    });
  }

  return new Response(JSON.stringify({ estudaram: resultados.length, resultados }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/estudar")({
  server: {
    handlers: { POST: ({ request }) => estudar(request), GET: ({ request }) => estudar(request) },
  },
});
