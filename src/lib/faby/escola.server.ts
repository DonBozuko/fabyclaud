/**
 * Escola das IAs: aprendizado contínuo, todo dia, mesmo sem ninguém pedir nada.
 *
 * Cada ciclo vale um "ano de amadurecimento": o sistema escolhe um tema, usa as
 * chaves gratuitas do próprio usuário para estudar esse tema, extrai regras
 * curtas e verificáveis e guarda como lições permanentes. Essas lições entram
 * em todas as respostas seguintes, então o motor melhora sozinho com o tempo.
 *
 * Regras de trabalho em segundo plano (obrigatórias):
 *  - limite fixo de trabalho por ciclo (um tema, poucas regras);
 *  - trava de execução única (lease no banco) para dois ciclos não rodarem juntos;
 *  - progresso gravado no banco (lição já aprendida não repete);
 *  - freio automático: sem crédito/permissão o estudo entra em pausa e só volta
 *    depois de uma sondagem bem-sucedida ou de uma ordem do usuário.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { chamarProvedor } from "./providers.server";
import type { ProvedorCustom } from "./config";

export type Db = { from: (tabela: string) => any };

export const TEMAS_ESCOLA = [
  "páginas que abrem sozinhas no navegador, sem servidor e sem build",
  "gravar, listar, editar e apagar de verdade no banco hospedado com fetch",
  "botões, formulários e links que realmente executam algo no JavaScript",
  "layout, tipografia e CSS coerentes — nunca HTML cru",
  "cadastro e login simples funcionando só com navegador + banco hospedado",
  "consertar projeto importado (Flask, FastAPI, Node, React) mexendo só no arquivo certo",
  "responder com honestidade: o que dá, o que não dá e por quê",
  "edição cirúrgica: alterar apenas os arquivos necessários e entregar completos",
  "uso no celular e acessibilidade das telas geradas",
  "mensagens de erro claras e recuperação quando uma IA falha",
  "desempenho e SEO básico das páginas geradas",
  "exportar em ZIP e publicar sem quebrar o que funcionava",
] as const;

const MAX_REGRAS_POR_CICLO = 4;
const LEASE_MINUTOS = 5;
const LIMITE_LICOES_PROMPT = 30;

type Estado = {
  user_id: string;
  dia: number;
  licoes_total: number;
  media: number;
  pausado: boolean;
  motivo: string | null;
  lease_ate: string | null;
  ultimo_ciclo: string | null;
  ultimo_resumo: string | null;
};

export async function obterEstadoEscola(db: Db, userId: string): Promise<Estado> {
  const { data } = await db.from("escola_estado").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data as Estado;
  const novo = { user_id: userId, dia: 0, licoes_total: 0, media: 0, pausado: false };
  await db.from("escola_estado").insert(novo);
  return { ...novo, motivo: null, lease_ate: null, ultimo_ciclo: null, ultimo_resumo: null };
}

/** Texto das lições já conquistadas, para entrar no prompt de toda resposta. */
export async function licoesParaPrompt(db: Db, userId: string) {
  const { data } = await db
    .from("licoes")
    .select("tema, regra")
    .eq("user_id", userId)
    .order("peso", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(LIMITE_LICOES_PROMPT);
  const linhas = (data ?? []).map((l: { regra: string }) => `- ${l.regra}`);
  return linhas.join("\n");
}

/** Cada falha real da conferência automática vira lição permanente. */
export async function registrarFalhasComoLicoes(db: Db, userId: string, falhas: string[]) {
  for (const falha of falhas.slice(0, 4)) {
    const regra = `Nunca entregar com este defeito: ${falha}`.slice(0, 300);
    await db
      .from("licoes")
      .insert({ user_id: userId, tema: "erro real cometido", regra, origem: "falha", peso: 3 });
  }
}

/** Nota de cada entrega alimenta a média da escola (evolução visível). */
export async function registrarNotaEscola(db: Db, userId: string, nota: number) {
  const estado = await obterEstadoEscola(db, userId);
  const media = estado.media > 0 ? Math.round(estado.media * 0.8 + nota * 0.2) : nota;
  await db
    .from("escola_estado")
    .update({ media, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

function promptEstudo(tema: string, jaSabe: string[], falhas: string[]) {
  return [
    "Você está estudando para melhorar um sistema que gera e conserta aplicações web.",
    `Tema de hoje: ${tema}.`,
    jaSabe.length
      ? `Regras que o sistema já domina (NÃO repita nem reescreva):\n${jaSabe.map((r) => `- ${r}`).join("\n")}`
      : "",
    falhas.length
      ? `Erros reais cometidos recentemente (priorize evitar isso):\n${falhas.map((f) => `- ${f}`).join("\n")}`
      : "",
    `Escreva de ${MAX_REGRAS_POR_CICLO - 2} a ${MAX_REGRAS_POR_CICLO} regras NOVAS, práticas e verificáveis no código, em português.`,
    "Formato: uma regra por linha, começando com '- ', no imperativo, no máximo 160 caracteres cada.",
    "Cada regra tem que ser conferível olhando os arquivos entregues (ex: 'todo formulário envia fetch POST e mostra erro na tela').",
    "Proibido: teoria, filosofia, elogio, explicação, título, numeração, texto antes ou depois das linhas.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function extrairRegras(texto: string) {
  return texto
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((l) => l.length >= 20 && l.length <= 220 && !/^[#>]/.test(l))
    .slice(0, MAX_REGRAS_POR_CICLO);
}

export type ResultadoCiclo = {
  ok: boolean;
  mensagem: string;
  novas: number;
  dia: number;
  pausado: boolean;
};

/**
 * Um ciclo de estudo (um "ano" de amadurecimento por dia real).
 * Roda igual pelo botão "Estudar agora" e pela chamada automática diária.
 */
export async function rodarCicloEscola(
  db: Db,
  userId: string,
  opcoes: { forcado?: boolean } = {},
): Promise<ResultadoCiclo> {
  const estado = await obterEstadoEscola(db, userId);
  const sondagem = estado.pausado && !opcoes.forcado;

  // Trava de execução única: só um ciclo por usuário ao mesmo tempo.
  const agora = new Date();
  const { data: travado } = await db
    .from("escola_estado")
    .update({ lease_ate: new Date(agora.getTime() + LEASE_MINUTOS * 60_000).toISOString() })
    .eq("user_id", userId)
    .or(`lease_ate.is.null,lease_ate.lt.${agora.toISOString()}`)
    .select("user_id");
  if (!travado || !travado.length) {
    return {
      ok: false,
      mensagem: "Já existe um estudo em andamento agora.",
      novas: 0,
      dia: estado.dia,
      pausado: estado.pausado,
    };
  }

  const liberar = async (extra: Record<string, unknown> = {}) => {
    await db
      .from("escola_estado")
      .update({ lease_ate: null, updated_at: new Date().toISOString(), ...extra })
      .eq("user_id", userId);
  };

  try {
    const [{ data: chaves }, { data: custom }, { data: sabidas }, { data: erros }] =
      await Promise.all([
        db.from("chaves_ia").select("provider, api_key, api_url, testada_ok").eq("user_id", userId),
        db
          .from("provedores_custom")
          .select("id, slug, nome, url, modelo, suporta_imagem")
          .eq("user_id", userId),
        db
          .from("licoes")
          .select("regra")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        db
          .from("licoes")
          .select("regra")
          .eq("user_id", userId)
          .eq("origem", "falha")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

    const candidatos = (chaves ?? [])
      .filter((k: any) => k.api_key && k.testada_ok && k.provider !== "omniroute")
      .sort((a: any, b: any) => Number(b.testada_ok) - Number(a.testada_ok));
    if (!candidatos.length) {
      await liberar();
      return {
        ok: false,
        mensagem:
          "Nenhuma chave de IA disponível para estudar. Cadastre uma chave gratuita nas configurações.",
        novas: 0,
        dia: estado.dia,
        pausado: estado.pausado,
      };
    }

    const tema = TEMAS_ESCOLA[estado.dia % TEMAS_ESCOLA.length]!;
    const jaSabe = (sabidas ?? []).map((l: { regra: string }) => l.regra);
    const falhas = (erros ?? []).map((l: { regra: string }) => l.regra);
    const prompt = promptEstudo(tema, jaSabe, falhas);

    let resposta: { ok: boolean; texto: string; status?: number } | null = null;
    for (const candidato of candidatos.slice(0, sondagem ? 1 : 3)) {
      const r = await chamarProvedor(
        candidato.provider,
        prompt,
        [],
        candidato.api_key,
        [],
        (custom ?? []) as ProvedorCustom[],
        60_000,
        candidato.api_url ?? undefined,
      );
      resposta = r;
      if (r.ok) break;
      // Freio automático: sem crédito ou sem permissão, o estudo entra em pausa.
      if (r.status === 402 || r.status === 403) {
        await liberar({ pausado: true, motivo: `estudo pausado: ${r.texto.slice(0, 200)}` });
        return {
          ok: false,
          mensagem: `Estudos pausados: ${r.texto}`,
          novas: 0,
          dia: estado.dia,
          pausado: true,
        };
      }
      if (r.status === 429) break; // limite de hoje; tenta no próximo ciclo
    }

    if (!resposta?.ok) {
      await liberar();
      return {
        ok: false,
        mensagem: `Não consegui estudar agora: ${resposta?.texto ?? "nenhuma IA respondeu"}`,
        novas: 0,
        dia: estado.dia,
        pausado: estado.pausado,
      };
    }

    const regras = extrairRegras(resposta.texto);
    let novas = 0;
    for (const regra of regras) {
      const { error } = await db
        .from("licoes")
        .insert({ user_id: userId, tema, regra, origem: "estudo", peso: 1 });
      if (!error) novas += 1; // lição repetida é ignorada pelo índice único
    }

    const dia = estado.dia + 1;
    const resumo = `Dia ${dia} — ${tema}: ${novas} lição(ões) nova(s).`;
    await liberar({
      dia,
      licoes_total: estado.licoes_total + novas,
      ultimo_ciclo: new Date().toISOString(),
      ultimo_resumo: resumo,
      pausado: false,
      motivo: null,
    });
    return { ok: true, mensagem: resumo, novas, dia, pausado: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await liberar({ motivo: `falha no estudo: ${msg.slice(0, 200)}` });
    return {
      ok: false,
      mensagem: `Falha no estudo: ${msg}`,
      novas: 0,
      dia: estado.dia,
      pausado: estado.pausado,
    };
  }
}
