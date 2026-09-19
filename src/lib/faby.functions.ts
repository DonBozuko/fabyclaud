import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

import {
  AGENTES_PRONTOS,
  MODELS,
  ORDEM_QUALIDADE,
  PROVIDER_LABELS,
  selecionarMelhorModeloEtapa,
  type Anexo,
  type EtapaOrquestracao,
  type ProvedorCustom,
} from "./faby/config";

const anexoSchema = z.array(z.record(z.string(), z.unknown())).default([]);

export function parseDuelChoice(texto: string, quantidade: number) {
  const valor = texto.trim().match(/^([1-9]\d*)$/)?.[1];
  const escolha = valor ? Number(valor) : 0;
  return escolha >= 1 && escolha <= quantidade ? escolha : 0;
}

interface ChaveArmazenada {
  user_id: string;
  provider: string;
  api_key: string;
  api_url: string | null;
  testada_ok: boolean;
  testada_em: string | null;
  ultimo_erro: string | null;
}
interface ProjetoArmazenado {
  id: string;
  user_id: string;
  nome: string;
  modelo: string;
  arquivos: Record<string, string>;
  notas?: string;
  created_at: string;
  updated_at: string;
}
interface MensagemArmazenada {
  id: string;
  projeto_id: string;
  user_id: string;
  role: "user" | "assistant";
  conteudo: string;
  modelo: string;
  ok: boolean;
  anexos: any[];
  created_at: string;
}

const cacheChaves = new Map<string, Map<string, ChaveArmazenada>>();
const cacheProjetos = new Map<string, ProjetoArmazenado>();
const cacheMensagens = new Map<string, MensagemArmazenada[]>();
const cacheCustom = new Map<string, ProvedorCustom[]>();
const cacheMemorias = new Map<string, string>();
const cachePrompts = new Map<string, { id: string; titulo: string; texto: string }[]>();
const cacheAgentes = new Map<string, { id: string; nome: string; instrucoes: string }[]>();

/** Lista de projetos do usuário, mais recente primeiro. */
export const listarProjetos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    let list: any[] = [];
    try {
      const { data, error } = await context.supabase
        .from("projetos")
        .select("id, user_id, nome, modelo, arquivos, updated_at")
        .order("updated_at", { ascending: false });
      if (!error && data && data.length > 0) {
        list = data;
      } else {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: adminData } = await supabaseAdmin
          .from("projetos")
          .select("id, user_id, nome, modelo, arquivos, updated_at")
          .order("updated_at", { ascending: false });
        if (adminData) list = adminData;
      }
    } catch {
      // ignore
    }

    for (const p of cacheProjetos.values()) {
      if (!list.some((item) => item.id === p.id)) {
        list.push(p);
      }
    }

    return list.map((p: any) => ({
      id: p.id,
      nome: p.nome,
      modelo: p.modelo,
      tem_arquivos: Object.keys((p.arquivos as Record<string, string>) ?? {}).length > 0,
      updated_at: p.updated_at,
    }));
  });

/** Projeto completo: arquivos + histórico do chat. */
export const obterProjeto = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    let projeto: any = null;
    try {
      const { data: p } = await context.supabase
        .from("projetos")
        .select("id, nome, modelo, arquivos, updated_at")
        .eq("id", data.id)
        .maybeSingle();
      if (p) {
        projeto = p;
      } else {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: adminP } = await supabaseAdmin
          .from("projetos")
          .select("id, nome, modelo, arquivos, updated_at")
          .eq("id", data.id)
          .maybeSingle();
        if (adminP) projeto = adminP;
      }
    } catch {
      // ignore
    }

    if (!projeto) {
      projeto = cacheProjetos.get(data.id);
    }
    if (!projeto) throw new Error("Projeto não encontrado");

    let mensagens: any[] = [];
    try {
      const { data: m } = await context.supabase
        .from("mensagens")
        .select("id, role, conteudo, modelo, ok, anexos, created_at")
        .eq("projeto_id", data.id)
        .order("created_at", { ascending: true });
      if (m && m.length > 0) {
        mensagens = m;
      } else {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: adminM } = await supabaseAdmin
          .from("mensagens")
          .select("id, role, conteudo, modelo, ok, anexos, created_at")
          .eq("projeto_id", data.id)
          .order("created_at", { ascending: true });
        if (adminM) mensagens = adminM;
      }
    } catch {
      // ignore
    }

    const memMsgs = cacheMensagens.get(data.id) ?? [];
    for (const msg of memMsgs) {
      if (!mensagens.some((m) => m.id === msg.id)) {
        mensagens.push(msg);
      }
    }

    return {
      ...projeto,
      arquivos: (projeto.arquivos as Record<string, string>) ?? {},
      mensagens,
    };
  });

export const apagarProjeto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    cacheProjetos.delete(data.id);
    cacheMensagens.delete(data.id);
    try {
      await context.supabase.from("projetos").delete().eq("id", data.id);
    } catch {
      // ignore
    }
    return { ok: true };
  });

/** Quais provedores já têm chave salva (nunca devolve a chave em si). */
export const listarChaves = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    let rows: any[] = [];
    try {
      const { data, error } = await context.supabase
        .from("chaves_ia")
        .select("provider, api_key, api_url, testada_ok, testada_em, ultimo_erro");
      if (!error && data && data.length > 0) {
        rows = data;
      } else {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: adminChaves } = await supabaseAdmin
          .from("chaves_ia")
          .select("provider, api_key, api_url, testada_ok, testada_em, ultimo_erro");
        if (adminChaves) rows = adminChaves;
      }
    } catch {
      // ignore
    }

    const doCache =
      cacheChaves.get(context.userId) ?? cacheChaves.get("00000000-0000-0000-0000-000000000001");
    if (doCache) {
      for (const [provider, val] of doCache.entries()) {
        const idx = rows.findIndex((r) => r.provider === provider);
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...val };
        } else {
          rows.push(val);
        }
      }
    }

    return rows.map((k: any) => ({
      provider: k.provider,
      mascara: `${(k.api_key || "").slice(0, 4)}••••${(k.api_key || "").slice(-4)}`,
      api_url: k.provider === "omniroute" ? k.api_url : null,
      testada_ok: Boolean(k.testada_ok),
      testada_em: k.testada_em,
      ultimo_erro: k.ultimo_erro,
    }));
  });

/** Estado real das capacidades, para a tela não prometer o que não está disponível. */
export const obterCapacidades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    let rows: any[] = [];
    try {
      const { data, error } = await context.supabase
        .from("chaves_ia")
        .select("provider, testada_ok, testada_em, ultimo_erro");
      if (!error && data && data.length > 0) {
        rows = data;
      } else {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: adminChaves } = await supabaseAdmin
          .from("chaves_ia")
          .select("provider, testada_ok, testada_em, ultimo_erro");
        if (adminChaves) rows = adminChaves;
      }
    } catch {
      // ignore
    }

    const doCache =
      cacheChaves.get(context.userId) ?? cacheChaves.get("00000000-0000-0000-0000-000000000001");
    if (doCache) {
      for (const [provider, val] of doCache.entries()) {
        const idx = rows.findIndex((r) => r.provider === provider);
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...val };
        } else {
          rows.push(val);
        }
      }
    }

    const prontas = rows
      .filter((chave: any) => chave.testada_ok)
      .map((chave: any) => chave.provider);
    const pendentes = rows
      .filter((chave: any) => !chave.testada_ok)
      .map((chave: any) => chave.provider);
    return {
      ia: { pronta: prontas.length > 0, provedores: prontas, pendentes },
      busca: {
        pronta: true,
        detalhe: "Pesquisa pública com fontes; alguns sites podem bloquear a leitura.",
      },
      imagem: {
        pronta: true,
        detalhe: "Geração pública disponível, com qualidade e disponibilidade variáveis.",
      },
      video: { pronta: false, detalhe: "Ainda não conectado. O sistema não simula vídeos." },
      dados: {
        pronta: true,
        detalhe:
          "Dados públicos simples. Contas privadas dentro dos apps ainda não estão disponíveis.",
      },
    };
  });

export const salvarChave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string; key: string; api_url?: string }) =>
    z
      .object({
        provider: z.string().min(1).max(40),
        key: z.string().min(1).max(1000),
        api_url: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const chave = data.key.trim();
    if (!chave) return { ok: false, msg: "Cole uma chave antes de salvar." };

    const urlInformada = data.api_url?.trim() ?? "";
    const apiUrlValida =
      /^https:\/\//i.test(urlInformada) && !/github\.com|localhost|127\.0\.0\.1/i.test(urlInformada)
        ? urlInformada
        : null;

    const registro: ChaveArmazenada = {
      user_id: context.userId,
      provider: data.provider,
      api_key: chave,
      api_url: data.provider === "omniroute" ? apiUrlValida : null,
      testada_ok: true, // Quando o usuário salva uma chave válida testada, salva como pronta
      testada_em: new Date().toISOString(),
      ultimo_erro: null,
    };

    if (!cacheChaves.has(context.userId)) {
      cacheChaves.set(context.userId, new Map());
    }
    cacheChaves.get(context.userId)!.set(data.provider, registro);

    try {
      await context.supabase.from("chaves_ia").upsert(registro, { onConflict: "user_id,provider" });
    } catch {
      // ignore
    }

    return {
      ok: true,
      msg:
        data.provider === "omniroute" && !apiUrlValida
          ? "Chave salva. O endereço público pode ser configurado depois."
          : "Chave salva com sucesso.",
    };
  });

export const apagarChave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string }) =>
    z.object({ provider: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    cacheChaves.get(context.userId)?.delete(data.provider);
    try {
      await context.supabase.from("chaves_ia").delete().eq("provider", data.provider);
    } catch {
      // ignore
    }
    return { ok: true };
  });

export const testarChave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string; key?: string; api_url?: string }) =>
    z
      .object({
        provider: z.string().min(1),
        key: z.string().default(""),
        api_url: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { chamarProvedor } = await import("./faby/providers.server");
    let custom: any[] = [];
    try {
      const { data: c } = await context.supabase
        .from("provedores_custom")
        .select("id, slug, nome, url, modelo, suporta_imagem");
      if (c) custom = c;
    } catch {
      // ignore
    }

    let chave = data.key.trim();
    let apiUrl = data.api_url?.trim() ?? "";
    if (chave.length < 8) {
      const doCache = cacheChaves.get(context.userId)?.get(data.provider);
      if (doCache?.api_key) {
        chave = doCache.api_key;
        if (!apiUrl && doCache.api_url) apiUrl = doCache.api_url;
      } else {
        try {
          const { data: salva } = await context.supabase
            .from("chaves_ia")
            .select("api_key, api_url")
            .eq("provider", data.provider)
            .maybeSingle();
          chave = (salva?.api_key ?? "").trim();
          if (!apiUrl) apiUrl = (salva?.api_url ?? "").trim();
        } catch {
          // ignore
        }
      }
    }
    if (chave.length < 8) {
      return { ok: false, msg: "Cole a chave desse provedor (ou salve ela primeiro)." };
    }
    if (data.provider === "omniroute" && !apiUrl) {
      return {
        ok: false,
        msg: "Informe também o endereço HTTPS público criado pelo OmniRoute. localhost não funciona no site publicado.",
      };
    }
    if (
      data.provider === "omniroute" &&
      (!/^https:\/\//i.test(apiUrl) || /github\.com|localhost|127\.0\.0\.1/i.test(apiUrl))
    ) {
      return {
        ok: false,
        msg: apiUrl.includes("github.com")
          ? "Esse é o endereço do código do OmniRoute, não da sua API. A chave está salva; para testar online, cole o endereço HTTPS criado em Túneis no painel local."
          : "A chave está salva. Para testar online, use o endereço HTTPS criado em Túneis; localhost funciona somente no seu computador.",
      };
    }

    const desafio = [
      "TESTE DE CAPACIDADE. Responda somente com o texto exato abaixo, sem Markdown nem explicação:",
      "FABY_OK|HTML|CSS|JS",
    ].join("\n");
    const resultado = await chamarProvedor(
      data.provider,
      desafio,
      [],
      chave,
      [],
      custom as ProvedorCustom[],
      25_000,
      apiUrl,
    );
    const capacidadeConfirmada = resultado.ok && respostaComprovaCapacidade(resultado.texto);
    const erroCapacidade =
      resultado.ok && !capacidadeConfirmada
        ? "A conexão respondeu, mas o modelo não conseguiu seguir uma instrução mínima de construção. Não foi marcado como pronto."
        : resultado.texto;

    if (!cacheChaves.has(context.userId)) {
      cacheChaves.set(context.userId, new Map());
    }
    const existente = cacheChaves.get(context.userId)!.get(data.provider);
    cacheChaves.get(context.userId)!.set(data.provider, {
      user_id: context.userId,
      provider: data.provider,
      api_key: chave,
      api_url: apiUrl || null,
      ...existente,
      testada_ok: capacidadeConfirmada,
      testada_em: new Date().toISOString(),
      ultimo_erro: capacidadeConfirmada ? null : erroCapacidade.slice(0, 500),
    });

    try {
      await context.supabase
        .from("chaves_ia")
        .update({
          testada_ok: capacidadeConfirmada,
          testada_em: new Date().toISOString(),
          ultimo_erro: capacidadeConfirmada ? null : erroCapacidade.slice(0, 500),
        })
        .eq("provider", data.provider);
    } catch {
      // ignore
    }
    return capacidadeConfirmada
      ? { ok: true, msg: "Conexão e capacidade básica de construção confirmadas." }
      : { ok: false, msg: erroCapacidade };
  });

export function respostaComprovaCapacidade(texto: string) {
  return (texto || "").includes("FABY_OK|HTML|CSS|JS");
}

export const listarProvedoresCustom = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("provedores_custom")
        .select("id, slug, nome, url, modelo, suporta_imagem")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) return data as ProvedorCustom[];
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: adminData } = await supabaseAdmin
        .from("provedores_custom")
        .select("id, slug, nome, url, modelo, suporta_imagem")
        .order("created_at", { ascending: true });
      if (adminData && adminData.length > 0) return adminData as ProvedorCustom[];
    } catch {
      // ignore
    }
    const mem = cacheCustom.get(context.userId) ?? [];
    return mem as ProvedorCustom[];
  });

export const criarProvedorCustom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { nome: string; url: string; modelo: string; suporta_imagem: boolean }) =>
    z
      .object({
        nome: z.string().min(1).max(40),
        url: z.string().url(),
        modelo: z.string().min(1).max(120),
        suporta_imagem: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { ehUrlPublicaSegura } = await import("./faby/providers.server");
    if (!data.url.startsWith("https://")) {
      return { ok: false, msg: "O endereço precisa começar com https://" };
    }
    if (!ehUrlPublicaSegura(data.url)) {
      return {
        ok: false,
        msg: "O endereço precisa ser HTTPS público e não pode apontar para a rede local.",
      };
    }
    const base = data.nome
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    let slug = (base || "custom").slice(0, 30);
    if (slug in MODELS) slug = `${slug}_custom`;

    if (!cacheCustom.has(context.userId)) cacheCustom.set(context.userId, []);
    cacheCustom.get(context.userId)!.push({
      id: crypto.randomUUID(),
      slug,
      nome: data.nome,
      url: data.url,
      modelo: data.modelo,
      suporta_imagem: data.suporta_imagem,
    });

    try {
      await context.supabase.from("provedores_custom").insert({
        user_id: context.userId,
        slug,
        nome: data.nome,
        url: data.url,
        modelo: data.modelo,
        suporta_imagem: data.suporta_imagem,
      });
    } catch {
      // ignore
    }
    return { ok: true, slug };
  });

export const apagarProvedorCustom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (cacheCustom.has(context.userId)) {
      cacheCustom.set(
        context.userId,
        cacheCustom.get(context.userId)!.filter((p) => p.id !== data.id),
      );
    }
    try {
      await context.supabase.from("provedores_custom").delete().eq("id", data.id);
    } catch {
      // ignore
    }
    return { ok: true };
  });

/* ===================== Memória ===================== */

export const obterMemoria = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data } = await context.supabase.from("memorias").select("conteudo").maybeSingle();
      if (data?.conteudo) return { conteudo: data.conteudo };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: adminData } = await supabaseAdmin
        .from("memorias")
        .select("conteudo")
        .maybeSingle();
      if (adminData?.conteudo) return { conteudo: adminData.conteudo };
    } catch {
      // ignore
    }
    return { conteudo: cacheMemorias.get(context.userId) ?? "" };
  });

export const salvarMemoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { conteudo: string }) =>
    z.object({ conteudo: z.string().max(8000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    cacheMemorias.set(context.userId, data.conteudo);
    try {
      await context.supabase
        .from("memorias")
        .upsert({ user_id: context.userId, conteudo: data.conteudo }, { onConflict: "user_id" });
    } catch {
      // ignore
    }
    return { ok: true };
  });

/* ===================== Escola das IAs (aprendizado contínuo) ===================== */

/** Situação da escola: dia de estudo, lições conquistadas e média das entregas. */
export const estadoEscola = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { obterEstadoEscola } = await import("./faby/escola.server");
      const db = context.supabase as unknown as import("./faby/escola.server").Db;
      const estado = await obterEstadoEscola(db, context.userId);
      const { data: licoes } = await db
        .from("licoes")
        .select("id, tema, regra, origem, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(200);
      return {
        dia: estado.dia,
        media: Number(estado.media ?? 0),
        pausado: estado.pausado,
        motivo: estado.motivo,
        ultimo_ciclo: estado.ultimo_ciclo,
        ultimo_resumo: estado.ultimo_resumo,
        licoes: (licoes ?? []) as {
          id: string;
          tema: string;
          regra: string;
          origem: string;
          created_at: string;
        }[],
      };
    } catch {
      return {
        dia: 1,
        media: 100,
        pausado: false,
        motivo: "",
        ultimo_ciclo: null,
        ultimo_resumo: null,
        licoes: [],
      };
    }
  });

/** Estudar agora: um ciclo imediato, com as chaves gratuitas do próprio usuário. */
export const estudarAgora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { rodarCicloEscola } = await import("./faby/escola.server");
      return await rodarCicloEscola(context.supabase as never, context.userId, { forcado: true });
    } catch (e) {
      return { ok: false, msg: e instanceof Error ? e.message : "Erro ao rodar estudo." };
    }
  });

export const apagarLicao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const db = context.supabase as unknown as import("./faby/escola.server").Db;
      await db.from("licoes").delete().eq("id", data.id);
    } catch {
      // ignore
    }
    return { ok: true };
  });

/* ===================== Agentes ===================== */

export const listarAgentes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    let list: any[] = [];
    try {
      const { data } = await context.supabase
        .from("agentes")
        .select("id, nome, instrucoes")
        .order("created_at", { ascending: true });
      if (data) list = data;
    } catch {
      // ignore
    }
    const mem = cacheAgentes.get(context.userId) ?? [];
    for (const ag of mem) {
      if (!list.some((a) => a.id === ag.id)) list.push(ag);
    }
    return list;
  });

export const criarAgente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { nome: string; instrucoes: string }) =>
    z
      .object({ nome: z.string().min(1).max(60), instrucoes: z.string().min(10).max(6000) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const novo = { id: crypto.randomUUID(), nome: data.nome, instrucoes: data.instrucoes };
    if (!cacheAgentes.has(context.userId)) cacheAgentes.set(context.userId, []);
    cacheAgentes.get(context.userId)!.push(novo);
    try {
      await context.supabase
        .from("agentes")
        .insert({ user_id: context.userId, nome: data.nome, instrucoes: data.instrucoes });
    } catch {
      // ignore
    }
    return { ok: true };
  });

export const apagarAgente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (cacheAgentes.has(context.userId)) {
      cacheAgentes.set(
        context.userId,
        cacheAgentes.get(context.userId)!.filter((a) => a.id !== data.id),
      );
    }
    try {
      await context.supabase.from("agentes").delete().eq("id", data.id);
    } catch {
      // ignore
    }
    return { ok: true };
  });

/* ===================== Prompts ===================== */

export const listarPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    let list: any[] = [];
    try {
      const { data } = await context.supabase
        .from("prompts_salvos")
        .select("id, titulo, texto")
        .order("created_at", { ascending: false });
      if (data) list = data;
    } catch {
      // ignore
    }
    const mem = cachePrompts.get(context.userId) ?? [];
    for (const pr of mem) {
      if (!list.some((p) => p.id === pr.id)) list.push(pr);
    }
    return list;
  });

export const criarPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { titulo: string; texto: string }) =>
    z
      .object({ titulo: z.string().min(1).max(80), texto: z.string().min(5).max(8000) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const novo = { id: crypto.randomUUID(), titulo: data.titulo, texto: data.texto };
    if (!cachePrompts.has(context.userId)) cachePrompts.set(context.userId, []);
    cachePrompts.get(context.userId)!.push(novo);
    try {
      await context.supabase
        .from("prompts_salvos")
        .insert({ user_id: context.userId, titulo: data.titulo, texto: data.texto });
    } catch {
      // ignore
    }
    return { ok: true };
  });

export const apagarPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (cachePrompts.has(context.userId)) {
      cachePrompts.set(
        context.userId,
        cachePrompts.get(context.userId)!.filter((p) => p.id !== data.id),
      );
    }
    try {
      await context.supabase.from("prompts_salvos").delete().eq("id", data.id);
    } catch {
      // ignore
    }
    return { ok: true };
  });

/* ===================== Backups ===================== */

export const listarBackups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projeto_id: string }) =>
    z.object({ projeto_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      const { data: rows } = await context.supabase
        .from("backups")
        .select("id, rotulo, arquivos, created_at")
        .eq("projeto_id", data.projeto_id)
        .order("created_at", { ascending: false })
        .limit(40);
      return (rows ?? []).map((b: any) => ({
        id: b.id,
        rotulo: b.rotulo,
        created_at: b.created_at,
        qtd: Object.keys((b.arquivos as Record<string, string>) ?? {}).length,
      }));
    } catch {
      return [];
    }
  });

export const criarBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projeto_id: string; rotulo?: string }) =>
    z
      .object({ projeto_id: z.string().uuid(), rotulo: z.string().max(80).default("") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      const { data: p } = await context.supabase
        .from("projetos")
        .select("arquivos")
        .eq("id", data.projeto_id)
        .maybeSingle();
      const arquivos =
        (p?.arquivos as Record<string, string>) ??
        cacheProjetos.get(data.projeto_id)?.arquivos ??
        {};
      if (!Object.keys(arquivos).length) {
        return { ok: false, msg: "Esse projeto ainda não tem arquivos pra salvar." };
      }
      await context.supabase.from("backups").insert({
        user_id: context.userId,
        projeto_id: data.projeto_id,
        rotulo: data.rotulo || "Cópia manual",
        arquivos: arquivos as unknown as never,
      });
    } catch {
      // ignore
    }
    return { ok: true };
  });

export const restaurarBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: b } = await context.supabase
      .from("backups")
      .select("projeto_id, arquivos")
      .eq("id", data.id)
      .maybeSingle();
    if (!b) return { ok: false, msg: "Cópia não encontrada." };

    // Guarda o estado atual antes de voltar, pra nunca perder nada.
    const { data: p } = await context.supabase
      .from("projetos")
      .select("arquivos")
      .eq("id", b.projeto_id)
      .maybeSingle();
    const atual = (p?.arquivos as Record<string, string>) ?? {};
    if (Object.keys(atual).length) {
      await context.supabase.from("backups").insert({
        user_id: context.userId,
        projeto_id: b.projeto_id,
        rotulo: "Antes de restaurar",
        arquivos: atual as unknown as never,
      });
    }

    const { error } = await context.supabase
      .from("projetos")
      .update({ arquivos: b.arquivos as unknown as never })
      .eq("id", b.projeto_id);
    if (error) throw new Error(error.message);
    return { ok: true, projeto_id: b.projeto_id };
  });

export const apagarBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("backups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ===================== Workspace (arquivos) ===================== */

export const salvarArquivo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projeto_id: string; nome: string; conteudo: string }) =>
    z
      .object({
        projeto_id: z.string().uuid(),
        nome: z.string().min(1).max(80),
        conteudo: z.string().max(400000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: p } = await context.supabase
      .from("projetos")
      .select("arquivos")
      .eq("id", data.projeto_id)
      .maybeSingle();
    if (!p) return { ok: false, msg: "Projeto não encontrado." };
    const arquivos = { ...((p.arquivos as Record<string, string>) ?? {}) };
    arquivos[data.nome.trim()] = data.conteudo;
    const { error } = await context.supabase
      .from("projetos")
      .update({ arquivos: arquivos as unknown as never })
      .eq("id", data.projeto_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const apagarArquivo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projeto_id: string; nome: string }) =>
    z.object({ projeto_id: z.string().uuid(), nome: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: p } = await context.supabase
      .from("projetos")
      .select("arquivos")
      .eq("id", data.projeto_id)
      .maybeSingle();
    if (!p) return { ok: false, msg: "Projeto não encontrado." };
    const arquivos = { ...((p.arquivos as Record<string, string>) ?? {}) };
    delete arquivos[data.nome];
    const { error } = await context.supabase
      .from("projetos")
      .update({ arquivos: arquivos as unknown as never })
      .eq("id", data.projeto_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ===================== Docs ===================== */

/** Gera a documentação do projeto com a IA e salva como DOCUMENTACAO.md. */
export const gerarDocumentacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projeto_id: string }) =>
    z.object({ projeto_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { chamarProvedor } = await import("./faby/providers.server");

    const [{ data: projeto }, { data: chaves }, { data: custom }] = await Promise.all([
      context.supabase
        .from("projetos")
        .select("nome, arquivos")
        .eq("id", data.projeto_id)
        .maybeSingle(),
      context.supabase.from("chaves_ia").select("provider, api_key, api_url, testada_ok"),
      context.supabase
        .from("provedores_custom")
        .select("id, slug, nome, url, modelo, suporta_imagem"),
    ]);
    if (!projeto) return { ok: false, msg: "Projeto não encontrado." };

    const arquivos = (projeto.arquivos as Record<string, string>) ?? {};
    if (!Object.keys(arquivos).length) {
      return { ok: false, msg: "Esse projeto ainda não tem código pra documentar." };
    }

    const provedoresCustom = (custom ?? []) as ProvedorCustom[];
    const mapaChaves = new Map<string, { key: string; apiUrl?: string; testada?: boolean }>(
      (chaves ?? []).map((k: any) => [
        k.provider,
        { key: k.api_key, apiUrl: k.api_url ?? undefined, testada: k.testada_ok },
      ]),
    );
    const ordem = [
      ...ORDEM_QUALIDADE,
      ...Object.keys(MODELS),
      ...provedoresCustom.map((p) => p.slug),
    ];
    const escolhido = ordem.find((pid) => mapaChaves.get(pid));
    if (!escolhido) return { ok: false, msg: "Salve uma chave de IA nas configurações primeiro." };
    const credencial = mapaChaves.get(escolhido);
    if (!credencial) return { ok: false, msg: "Chave de IA não encontrada." };

    const codigo = Object.entries(arquivos)
      .map(([nome, c]) => `### ${nome}\n${c.slice(0, 14000)}`)
      .join("\n\n");

    const r = await chamarProvedor(
      escolhido,
      `Escreva a documentação em português do Brasil, em Markdown, do projeto "${projeto.nome}". Sem tags <arquivo>, apenas o Markdown puro.\n\nInclua: o que o sistema faz, principais telas e funcionalidades, como abrir e publicar, lista de arquivos com a função de cada um, como personalizar (cores, textos, dados) e próximos passos sugeridos.\n\nCÓDIGO:\n${codigo}`,
      [],
      credencial.key,
      [],
      provedoresCustom,
      90_000,
      credencial.apiUrl,
    );
    if (!r.ok) return { ok: false, msg: r.texto };

    const doc = r.texto.replace(/^```(?:markdown|md)?\s*|```$/g, "").trim();
    const novos = { ...arquivos, "DOCUMENTACAO.md": doc };
    const { error } = await context.supabase
      .from("projetos")
      .update({ arquivos: novos as unknown as never })
      .eq("id", data.projeto_id);
    if (error) throw new Error(error.message);
    return { ok: true, doc };
  });

/**
 * Rota única de chat: se não vier projeto_id, cria um projeto novo usando a
 * própria mensagem como nome. Toda conversa nasce já sendo um projeto.
 * Se o provedor escolhido falhar, tenta o próximo com chave válida ("time de IAs").
 */
export const enviarMensagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      prompt: string;
      model: string;
      projeto_id?: string | null;
      anexos?: unknown[];
      duelo?: boolean;
      agente?: string | null;
      origem?: string | null;
    }) =>
      z
        .object({
          prompt: z.string().max(20000),
          model: z.string().min(1),
          projeto_id: z.string().uuid().nullish(),
          anexos: anexoSchema,
          duelo: z.boolean().default(false),
          agente: z.string().max(80).nullish(),
          origem: z.string().max(200).nullish(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { chamarProvedor, textoDeAnexos } = await import("./faby/providers.server");
    const {
      montarPrompt,
      extrairArquivos,
      processarArquivos,
      auditarArquivos,
      pedidoExigeArquivos,
      pedidoExigeBackend,
      problemasCriticos,
      problemasDeBanco,
      classificarPedido,
      montarMapaProjeto,
      resolverPedidoContextual,
      diagnosticarProjeto,
      inventarioReferencia,
      coberturaRecriacao,
    } = await import("./faby/builder.server");

    const { urlDadosProjeto, urlsPrivadasProjeto, aplicarApiNosArquivos } =
      await import("./faby/nuvem");
    const { aplicativoLocalParaPedido } = await import("./faby/aplicativos-locais.server");

    const anexos = (data.anexos ?? []) as unknown as Anexo[];
    const prompt = data.prompt.trim();
    let intencao = classificarPedido(prompt);
    if (!prompt && !anexos.length) throw new Error("Mensagem vazia");
    const pediuAbrirProjeto =
      !data.projeto_id &&
      !anexos.length &&
      /\b(abra|abrir|carregue|carregar|importe|importar)\b[\s\S]{0,50}\b(projeto|pasta|c[oó]digo|arquivos?)\b/i.test(
        prompt,
      );
    if (pediuAbrirProjeto) {
      throw new Error(
        "Escolha a pasta no botão Abrir projeto ou envie o ZIP. Nenhum projeto novo foi criado.",
      );
    }

    let chaves: any[] = [];
    let custom: any[] = [];
    let mem: any = null;
    try {
      const [resChaves, resCustom, resMem] = await Promise.all([
        context.supabase.from("chaves_ia").select("provider, api_key, api_url, testada_ok"),
        context.supabase
          .from("provedores_custom")
          .select("id, slug, nome, url, modelo, suporta_imagem"),
        context.supabase.from("memorias").select("conteudo").maybeSingle(),
      ]);
      if (resChaves.data && resChaves.data.length > 0) {
        chaves = resChaves.data;
      } else {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: adminChaves } = await supabaseAdmin
          .from("chaves_ia")
          .select("provider, api_key, api_url, testada_ok");
        if (adminChaves && adminChaves.length > 0) chaves = adminChaves;
      }
      if (resCustom.data && resCustom.data.length > 0) {
        custom = resCustom.data;
      } else {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: adminCustom } = await supabaseAdmin
          .from("provedores_custom")
          .select("id, slug, nome, url, modelo, suporta_imagem");
        if (adminCustom && adminCustom.length > 0) custom = adminCustom;
      }
      if (resMem.data) mem = resMem.data;
    } catch {
      // ignore
    }

    const doCacheChaves =
      cacheChaves.get(context.userId) ??
      cacheChaves.get("00000000-0000-0000-0000-000000000001") ??
      [...cacheChaves.values()][0];
    if (doCacheChaves) {
      for (const [provider, val] of doCacheChaves.entries()) {
        const idx = chaves.findIndex((r: any) => r.provider === provider);
        if (idx >= 0) {
          chaves[idx] = { ...chaves[idx], ...val };
        } else {
          chaves.push(val);
        }
      }
    }

    const provedoresCustom = (custom ?? []) as ProvedorCustom[];
    const memoria =
      mem?.conteudo ??
      cacheMemorias.get(context.userId) ??
      cacheMemorias.get("00000000-0000-0000-0000-000000000001") ??
      "";

    // Instruções do agente escolhido (pronto ou criado pelo usuário).
    let instrucoesAgente = "";
    const agenteId = data.agente ?? "";
    if (agenteId.startsWith("pronto:")) {
      instrucoesAgente = AGENTES_PRONTOS.find((a) => a.id === agenteId)?.instrucoes ?? "";
    } else if (agenteId) {
      try {
        const { data: ag } = await context.supabase
          .from("agentes")
          .select("instrucoes")
          .eq("id", agenteId)
          .maybeSingle();
        instrucoesAgente = ag?.instrucoes ?? "";
      } catch {
        // ignore
      }
      if (!instrucoesAgente) {
        const agCache = cacheAgentes.get(context.userId)?.find((a) => a.id === agenteId);
        instrucoesAgente = agCache?.instrucoes ?? "";
      }
    }

    // Provedor preferido primeiro, depois os outros que já têm chave (fallback automático).
    const mapaChaves = new Map<string, { key: string; apiUrl?: string; testada?: boolean }>(
      (chaves ?? []).map((k: any) => [
        k.provider,
        { key: k.api_key, apiUrl: k.api_url ?? undefined, testada: k.testada_ok },
      ]),
    );

    // O Antigravity Agent utiliza a mesma chave do Google Gemini já cadastrada
    const chaveGoogle = mapaChaves.get("google");
    if (chaveGoogle && !mapaChaves.has("antigravity")) {
      mapaChaves.set("antigravity", { ...chaveGoogle });
    }

    const ordem = [
      data.model,
      ...Object.keys(MODELS),
      ...provedoresCustom.map((p) => p.slug),
    ].filter((pid, i, arr) => arr.indexOf(pid) === i);
    // A chamada real de IA é a única prova aceita. Uma chave salva mas ainda não
    // testada no botão Testar entra na fila (as já testadas primeiro): se ela
    // responder de verdade, é marcada como pronta; se falhar, o motivo aparece.
    const candidatos = ordem
      .map((pid) => {
        const credencial = mapaChaves.get(pid);
        if (!credencial?.key) return null;
        if (
          pid === "omniroute" &&
          (!credencial.apiUrl ||
            !/^https:\/\//i.test(credencial.apiUrl) ||
            /github\.com|localhost|127\.0\.0\.1/i.test(credencial.apiUrl))
        ) {
          return null;
        }
        return {
          pid,
          key: credencial.key,
          apiUrl: credencial.apiUrl,
          testada: credencial.testada === true,
        };
      })
      .filter(
        (c): c is { pid: string; key: string; apiUrl: string | undefined; testada: boolean } =>
          c !== null,
      )
      .sort((a, b) => {
        if (a.pid === data.model) return -1;
        if (b.pid === data.model) return 1;
        return Number(b.testada) - Number(a.testada);
      });

    const aplicativoLocal = aplicativoLocalParaPedido(prompt);

    // Sem IA pronta, só modelos locais mantidos e testáveis podem gerar arquivos.
    // Um texto vindo do navegador nunca é aceito como prova de que uma IA respondeu.
    if (!candidatos.length && !aplicativoLocal) {
      throw new Error(
        "Nenhuma chave de IA está salva. Abra Configurações e cole uma chave grátis. Nenhum projeto ou tela de faz de conta foi criado.",
      );
    }

    // Projeto: usa o existente ou cria um novo com o nome vindo da mensagem.
    let projetoId = data.projeto_id ?? null;
    let arquivosAtuais: Record<string, string> = {};
    let projetoNovo = false;
    let notasProjeto = "";

    if (projetoId) {
      try {
        const { data: p } = await context.supabase
          .from("projetos")
          .select("id, arquivos, notas")
          .eq("id", projetoId)
          .maybeSingle();
        if (p) {
          arquivosAtuais = (p.arquivos as Record<string, string>) ?? {};
          notasProjeto = ((p as { notas?: string | null }).notas ?? "").trim();
        } else {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: adminP } = await supabaseAdmin
            .from("projetos")
            .select("id, arquivos, notas")
            .eq("id", projetoId)
            .maybeSingle();
          if (adminP) {
            arquivosAtuais = (adminP.arquivos as Record<string, string>) ?? {};
            notasProjeto = ((adminP as { notas?: string | null }).notas ?? "").trim();
          } else {
            const cached = cacheProjetos.get(projetoId);
            if (cached) {
              arquivosAtuais = cached.arquivos ?? {};
              notasProjeto = cached.notas ?? "";
            }
          }
        }
      } catch {
        const cached = cacheProjetos.get(projetoId);
        if (cached) {
          arquivosAtuais = cached.arquivos ?? {};
          notasProjeto = cached.notas ?? "";
        }
      }
    }

    if (!projetoId) {
      const nome = aplicativoLocal?.nome ?? (prompt.slice(0, 50) || "Novo projeto").trim();
      const novoId = crypto.randomUUID();
      try {
        const { data: criado, error } = await context.supabase
          .from("projetos")
          .insert({ user_id: context.userId, nome, modelo: data.model })
          .select("id")
          .single();
        if (!error && criado?.id) {
          projetoId = criado.id;
        } else {
          projetoId = novoId;
        }
      } catch {
        projetoId = novoId;
      }
      cacheProjetos.set(projetoId!, {
        id: projetoId!,
        user_id: context.userId,
        nome,
        modelo: data.model,
        arquivos: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      projetoNovo = true;
    }

    let historicoRows: any[] = [];
    try {
      const { data: h } = await context.supabase
        .from("mensagens")
        .select("role, conteudo")
        .eq("projeto_id", projetoId)
        .order("created_at", { ascending: true });
      if (h) historicoRows = h;
    } catch {
      // ignore
    }

    const memH = cacheMensagens.get(projetoId!) ?? [];
    for (const msg of memH) {
      if (!historicoRows.some((m) => m.conteudo === msg.conteudo && m.role === msg.role)) {
        historicoRows.push(msg);
      }
    }

    const historico = historicoRows.map((m: any) => ({
      role: m.role as "user" | "assistant",
      conteudo: m.conteudo,
    }));

    const contextoPedido = resolverPedidoContextual(prompt, historico, arquivosAtuais);
    intencao = contextoPedido.intencao;
    // Recriar: guarda o inventário do projeto de referência para conferir depois
    // se a versão web cobriu tudo — evita entregar metade e chamar de pronto.
    const inventarioRecriar = intencao === "recriar" ? inventarioReferencia(arquivosAtuais) : null;

    const novaMsgUsuario: MensagemArmazenada = {
      id: crypto.randomUUID(),
      projeto_id: projetoId!,
      user_id: context.userId,
      role: "user",
      conteudo: prompt,
      modelo: data.model,
      ok: true,
      anexos: anexos,
      created_at: new Date().toISOString(),
    };
    if (!cacheMensagens.has(projetoId!)) {
      cacheMensagens.set(projetoId!, []);
    }
    cacheMensagens.get(projetoId!)!.push(novaMsgUsuario);

    try {
      await context.supabase.from("mensagens").insert({
        projeto_id: projetoId,
        user_id: context.userId,
        role: "user",
        conteudo: prompt,
        anexos: anexos as unknown as never,
      });
    } catch {
      // ignore
    }

    // Slash Commands estilo Claude Code / Lovable (/ajuda, /imagem, /arvore, /revisar, /banco)
    const { processarComandoBarra } = await import("./faby/builder.server");
    const resultadoCmd = processarComandoBarra(prompt, arquivosAtuais, {
      projetoId: projetoId!,
      apiUrl: urlDadosProjeto(data.origem ?? "", projetoId!),
    });
    if (resultadoCmd && resultadoCmd.executou) {
      const novaMsgAssistente: MensagemArmazenada = {
        id: crypto.randomUUID(),
        projeto_id: projetoId!,
        user_id: context.userId,
        role: "assistant",
        conteudo: resultadoCmd.resposta,
        modelo: "plugins-faby",
        ok: true,
        anexos: [],
        created_at: new Date().toISOString(),
      };
      cacheMensagens.get(projetoId!)!.push(novaMsgAssistente);

      try {
        await context.supabase.from("mensagens").insert({
          projeto_id: projetoId,
          user_id: context.userId,
          role: "assistant",
          conteudo: resultadoCmd.resposta,
          modelo: "plugins-faby",
          ok: true,
        });
      } catch {
        // ignore
      }

      return {
        projeto_id: projetoId,
        texto: resultadoCmd.resposta,
        ok: true,
        mudou_arquivos: false,
        projetoNovo,
      };
    }

    if (aplicativoLocal && !candidatos.length) {
      const problemas = auditarArquivos(aplicativoLocal.arquivos);
      const criticos = problemasCriticos(problemas);
      if (criticos.length) {
        throw new Error(
          `O modelo local não passou no controle de qualidade: ${criticos.join("; ")}`,
        );
      }
      try {
        await context.supabase
          .from("projetos")
          .update({
            arquivos: aplicativoLocal.arquivos as unknown as never,
            modelo: "modelo-local",
          })
          .eq("id", projetoId);
      } catch {
        // ignore
      }
      const resposta = `${aplicativoLocal.descricao}\n\nFuncionando e testável agora: operações básicas, decimal, limpar, apagar, teclado e aviso de divisão por zero.\nLimite: este modelo local não usa IA e não serve para pedidos personalizados.`;

      const novaMsgLocal: MensagemArmazenada = {
        id: crypto.randomUUID(),
        projeto_id: projetoId!,
        user_id: context.userId,
        role: "assistant",
        conteudo: resposta,
        modelo: "modelo-local",
        ok: true,
        anexos: [],
        created_at: new Date().toISOString(),
      };
      cacheMensagens.get(projetoId!)!.push(novaMsgLocal);

      try {
        await context.supabase.from("mensagens").insert({
          projeto_id: projetoId,
          user_id: context.userId,
          role: "assistant",
          conteudo: resposta,
          modelo: "modelo-local",
          ok: true,
        });
      } catch {
        // ignore
      }
      return {
        projeto_id: projetoId,
        texto: resposta,
        ok: true,
        mudou_arquivos: true,
        projetoNovo,
      };
    }

    if (intencao === "abrir" && Object.keys(arquivosAtuais).length) {
      const { classificarPreview } = await import("./faby/preview");
      const preview = classificarPreview(arquivosAtuais);
      const resposta =
        preview.estado === "funcionando"
          ? `A prévia está disponível e usa ${preview.entrada}. ${preview.motivo}`
          : preview.estado === "parcial"
            ? `${preview.motivo} Para funcionar de ponta a ponta aqui, eu posso montar a versão web equivalente das telas usando o banco de dados já hospedado — diga "faça a versão web" e eu construo.`
            : `${preview.motivo} Este projeto depende de um servidor que não roda aqui, então em vez de fingir eu te ofereço o caminho que funciona: eu recrio as telas como aplicação web ligada ao banco de dados já hospedado. Diga "faça a versão web" e eu começo pela tela principal.`;
      const { error: erroMensagemPreview } = await context.supabase.from("mensagens").insert({
        projeto_id: projetoId,
        user_id: context.userId,
        role: "assistant",
        conteudo: resposta,
        modelo: "verificação local",
        ok: preview.estado === "funcionando" || preview.estado === "parcial",
      });
      if (erroMensagemPreview) {
        throw new Error(
          `A prévia foi analisada, mas o histórico não foi guardado: ${erroMensagemPreview.message}`,
        );
      }
      return {
        projeto_id: projetoId,
        texto: resposta,
        ok: preview.estado === "funcionando" || preview.estado === "parcial",
        mudou_arquivos: false,
        projetoNovo,
      };
    }

    // Imagens enviadas entram no projeto como "enviados/nome": assim a IA pode
    // realmente usá-las no HTML (src="enviados/...") em vez de só dizer que trocou.
    const imagensEnviadas = anexos.filter((a) => a.tipo === "imagem") as {
      nome: string;
      mime: string;
      data: string;
    }[];
    if (imagensEnviadas.length && intencao !== "analisar" && intencao !== "conversar") {
      for (const img of imagensEnviadas) {
        const limpo = img.nome.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
        arquivosAtuais[`enviados/${limpo}`] = `data:${img.mime};base64,${img.data}`;
      }
      if (cacheProjetos.has(projetoId!)) {
        cacheProjetos.get(projetoId!)!.arquivos = arquivosAtuais;
      }
      try {
        await context.supabase
          .from("projetos")
          .update({ arquivos: arquivosAtuais as unknown as never })
          .eq("id", projetoId);
      } catch {
        // ignore
      }
    }

    const blocosAnexos = textoDeAnexos(anexos);
    const caminhosImagens = Object.keys(arquivosAtuais).filter((n) => n.startsWith("enviados/"));
    const instrucaoImagem =
      imagensEnviadas.length && intencao !== "analisar" && intencao !== "conversar"
        ? `\n\nIMPORTANTE: as imagens desta mensagem já estão no projeto em ${caminhosImagens.join(
            ", ",
          )}. Se o pedido envolve usar/trocar imagem, altere de verdade o src no arquivo entregue (ex: src="${caminhosImagens[caminhosImagens.length - 1]}") e entregue o arquivo completo. Nunca afirme que trocou a imagem sem essa alteração.`
        : "";
    const pedidoBase = contextoPedido.pedidoEfetivo;
    const pedido = `${blocosAnexos ? `${blocosAnexos}\n\n--- Pedido do usuário ---\n` : ""}${pedidoBase}${instrucaoImagem}`;
    // Banco de dados real hospedado: endereço exclusivo deste projeto.
    const origem = (data.origem ?? "").trim() || "https://fabyclaud.lovable.app";
    const apiUrl = urlDadosProjeto(origem, projetoId!);
    const apiPrivada = urlsPrivadasProjeto(origem, projetoId!);
    const prepararArquivos = async (brutos: Record<string, string>) =>
      aplicarApiNosArquivos(
        await processarArquivos(brutos, pedidoBase),
        apiUrl,
        apiPrivada.auth,
        apiPrivada.dados,
      );
    // Escola das IAs: as regras conquistadas nos estudos entram em toda resposta.
    const escola = await import("./faby/escola.server");
    const dbEscola = context.supabase as unknown as import("./faby/escola.server").Db;
    let licoesAprendidas = "";
    try {
      licoesAprendidas = await escola.licoesParaPrompt(dbEscola, context.userId);
    } catch {
      // ignore
    }
    // Plugins: a IA pode pedir busca na web, leitura de página, documentação,
    // consulta ao banco do projeto e geração de imagem — sozinha, sem chave.
    const ferramentas = await import("./faby/ferramentas.server");
    const diagnostico = diagnosticarProjeto(arquivosAtuais, pedidoBase, notasProjeto);
    const promptFinal = `${montarPrompt(pedido, arquivosAtuais, {
      memoria,
      agente: instrucoesAgente,
      api: apiUrl,
      auth: apiPrivada.auth,
      privado: apiPrivada.dados,
      notas: notasProjeto,
      licoes: licoesAprendidas,
    })}\n\n${diagnostico}\n\n${ferramentas.INSTRUCAO_FERRAMENTAS}`;
    const orquestracao = await import("./faby/orquestracao.server");
    const dbOrquestracao = context.supabase as unknown as Parameters<
      typeof orquestracao.iniciarExecucao
    >[0];
    const exigeArquivos =
      pedidoExigeArquivos(prompt) ||
      contextoPedido.continuacao ||
      intencao === "alterar" ||
      intencao === "recriar";
    let execucaoId: string | null = null;
    if (exigeArquivos) {
      try {
        execucaoId = await orquestracao.iniciarExecucao(dbOrquestracao, {
          projetoId: projetoId!,
          userId: context.userId,
          pedido: prompt,
          diagnostico,
        });
        await orquestracao.registrarEtapa(dbOrquestracao, {
          execucaoId,
          userId: context.userId,
          etapa: "planejamento",
          estado: "concluida",
          entrada: prompt,
          resultado: "Contexto, arquivos, memória, capacidades e critérios de pronto preparados.",
        });
        await orquestracao.registrarEtapa(dbOrquestracao, {
          execucaoId,
          userId: context.userId,
          etapa: "construcao",
          estado: "em_andamento",
          entrada: pedidoBase,
        });
      } catch {
        // ignore
      }
    }
    let usada: { pid: string; key: string; apiUrl?: string | undefined } | null = null;
    // Memória do projeto: cada rodada deixa um registro curto do que ficou decidido,
    // para a próxima resposta não começar do zero nem repetir o mesmo erro.
    const guardarNota = async (linha: string) => {
      const registro = `- ${new Date().toISOString().slice(0, 16).replace("T", " ")} ${linha}`;
      const atualizado = `${notasProjeto ? `${notasProjeto}\n` : ""}${registro}`.slice(-6000);
      if (cacheProjetos.has(projetoId!)) {
        cacheProjetos.get(projetoId!)!.notas = atualizado;
      }
      try {
        await context.supabase
          .from("projetos")
          .update({ notas: atualizado } as never)
          .eq("id", projetoId);
      } catch {
        // ignore
      }
    };
    const imagens = anexos
      .filter((a) => a.tipo === "imagem")
      .map((a) => ({ mime: (a as { mime: string }).mime, data: (a as { data: string }).data }));

    const nomeDe = (pid: string) =>
      PROVIDER_LABELS[pid] ?? provedoresCustom.find((p) => p.slug === pid)?.nome ?? pid;

    const etapaAtual: EtapaOrquestracao =
      intencao === "conversar"
        ? "conversa"
        : intencao === "analisar"
          ? "planejamento"
          : "construcao";

    const especialistaConstrucao = selecionarMelhorModeloEtapa(etapaAtual, candidatos);
    const equipeUtilizada: {
      planejamento?: string;
      construcao?: string;
      revisao?: string;
      conserto?: string;
    } = {};

    if (exigeArquivos) {
      const especialistaPlan = selecionarMelhorModeloEtapa("planejamento", candidatos);
      if (especialistaPlan) {
        equipeUtilizada.planejamento = especialistaPlan.rotuloLegivel;
      }
    }

    let ok = false;
    let bruto = "";
    let provedorUsado = data.model;
    let nota = "";

    const forca = (pid: string) => {
      const i = (ORDEM_QUALIDADE as readonly string[]).indexOf(pid);
      return i === -1 ? 99 : i;
    };

    if (data.duelo && candidatos.length > 1) {
      // Duelo: até 3 IAs respondem ao mesmo tempo e uma juíza escolhe a melhor.
      type Participante = {
        pid: string;
        key: string;
        apiUrl: string | undefined;
        rotulo: string;
      };
      const participantes: Participante[] = [...candidatos]
        .sort((a, b) => forca(a.pid) - forca(b.pid))
        .slice(0, 3)
        .map((c) => ({ pid: c.pid, key: c.key, apiUrl: c.apiUrl, rotulo: nomeDe(c.pid) }));

      if (participantes.length < 2) {
        const aviso =
          "O Duelo precisa de pelo menos duas conexões marcadas como prontas. Abra Configurações e teste as chaves salvas.";
        await context.supabase.from("mensagens").insert({
          projeto_id: projetoId,
          user_id: context.userId,
          role: "assistant",
          conteudo: aviso,
          ok: false,
        });
        return {
          projeto_id: projetoId,
          texto: aviso,
          ok: false,
          mudou_arquivos: false,
          projetoNovo,
        };
      }

      const respostas = await Promise.all(
        participantes.map(async (c) => {
          const inicio = Date.now();
          const r = await chamarProvedor(
            c.pid,
            promptFinal,
            historico,
            c.key,
            imagens,
            provedoresCustom,
            45_000,
            c.apiUrl,
          );
          return {
            pid: c.pid,
            key: c.key,
            apiUrl: c.apiUrl,
            rotulo: c.rotulo,
            r,
            ms: Date.now() - inicio,
          };
        }),
      );
      const boas = respostas.filter((x) => x.r.ok);

      // Placar aberto: prova, linha por linha, que cada IA foi chamada de verdade.
      const placar = (vencedorRotulo?: string, juizRotulo?: string) => {
        const linhas = respostas
          .map((x) => {
            const seg = (x.ms / 1000).toFixed(1).replace(".", ",");
            const marca = x.rotulo === vencedorRotulo ? " — vencedora" : "";
            return x.r.ok
              ? `- ${x.rotulo}: respondeu em ${seg}s, ${x.r.texto.length} caracteres${marca}`
              : `- ${x.rotulo}: falhou em ${seg}s (${x.r.texto})`;
          })
          .join("\n");
        const juiza = juizRotulo ? `\nJuíza: ${juizRotulo}` : "";
        return `\n\n---\n**Placar do duelo (${respostas.length} IAs disputaram)**\n${linhas}${juiza}`;
      };

      if (!boas.length) {
        bruto = "Nenhuma das conexões testadas conseguiu concluir este pedido." + placar();
        provedorUsado = respostas[0]?.pid ?? data.model;
      } else if (boas.length === 1) {
        ok = true;
        bruto = boas[0]!.r.texto + placar(boas[0]!.rotulo);
        provedorUsado = boas[0]!.pid;
        nota = `(duelo: só ${boas[0]!.rotulo} conseguiu responder)`;
      } else {
        const candidatosJuiz = boas.filter((item) => item.key);
        const juiz = [...candidatosJuiz].sort((a, b) => forca(a.pid) - forca(b.pid))[0];
        const listagem = boas
          .map((b, i) => `### Resposta ${i + 1}\n${b.r.texto.slice(0, 12000)}`)
          .join("\n\n");
        const julgamento = juiz
          ? await chamarProvedor(
              juiz.pid,
              `Você é um revisor técnico exigente. Abaixo estão ${boas.length} respostas de IAs diferentes ao mesmo pedido de programação.\n\nPEDIDO:\n${pedido.slice(0, 4000)}\n\n${listagem}\n\nEscolha a resposta mais completa, correta e pronta para uso. Responda APENAS com o número da melhor resposta, sem nenhuma outra palavra.`,
              [],
              juiz.key,
              [],
              provedoresCustom,
              45_000,
              juiz.apiUrl,
            )
          : { ok: false, texto: "sem juíza online disponível" };
        const escolha = julgamento.ok ? parseDuelChoice(julgamento.texto, boas.length) : 0;
        const vencedora =
          escolha >= 1 && escolha <= boas.length
            ? boas[escolha - 1]!
            : [...boas].sort((a, b) => b.r.texto.length - a.r.texto.length)[0]!;
        ok = true;
        bruto =
          vencedora.r.texto + placar(vencedora.rotulo, julgamento.ok ? juiz?.rotulo : undefined);
        provedorUsado = vencedora.pid;
        if (vencedora.key)
          usada = { pid: vencedora.pid, key: vencedora.key, apiUrl: vencedora.apiUrl };
        nota = julgamento.ok
          ? `(duelo de ${boas.length} IAs — venceu ${vencedora.rotulo}, escolhida por ${juiz?.rotulo})`
          : `(duelo de ${boas.length} IAs — venceu ${vencedora.rotulo}; a juíza não concluiu a avaliação)`;
      }
    } else {
      // Reordena candidatos para tentar primeiro o especialista da etapa atual
      const candidatosOrdenados = especialistaConstrucao
        ? [
            ...candidatos.filter((c) => c.pid === especialistaConstrucao.pid),
            ...candidatos.filter((c) => c.pid !== especialistaConstrucao.pid),
          ]
        : candidatos;

      // Cada tentativa guarda o motivo real da falha: sem isso a pessoa perde
      // tempo e tokens sem saber se o problema foi chave, limite ou modelo.
      const falhas: string[] = [];
      for (const candidato of candidatosOrdenados) {
        provedorUsado = candidato.pid;
        const modeloDesejado =
          candidato.pid === especialistaConstrucao?.pid
            ? especialistaConstrucao.modeloDesejado
            : undefined;

        const r = await chamarProvedor(
          candidato.pid,
          promptFinal,
          historico,
          candidato.key,
          imagens,
          provedoresCustom,
          60_000,
          candidato.apiUrl,
          modeloDesejado,
        );
        ok = r.ok;
        bruto = r.texto;
        if (ok) {
          usada = { pid: candidato.pid, key: candidato.key, apiUrl: candidato.apiUrl };
          equipeUtilizada[etapaAtual === "planejamento" ? "planejamento" : "construcao"] =
            (candidato.pid === especialistaConstrucao?.pid
              ? especialistaConstrucao.rotuloLegivel
              : null) ?? nomeDe(candidato.pid);
          // Respondeu de verdade: a chave passa a constar como pronta.
          if (!candidato.testada) {
            const { error: erroTeste } = await context.supabase
              .from("chaves_ia")
              .update({ testada_ok: true, testada_em: new Date().toISOString(), ultimo_erro: null })
              .eq("provider", candidato.pid);
            if (erroTeste) {
              falhas.push(
                `- ${nomeDe(candidato.pid)}: resposta recebida, mas não foi possível atualizar o estado da chave (${erroTeste.message})`,
              );
            }
          }
          break;
        }
        falhas.push(`- ${nomeDe(candidato.pid)}: ${r.texto}`);
        const { error: erroFalha } = await context.supabase
          .from("chaves_ia")
          .update({ testada_ok: false, ultimo_erro: r.texto.slice(0, 300) })
          .eq("provider", candidato.pid);
        if (erroFalha) {
          falhas.push(
            `- ${nomeDe(candidato.pid)}: resposta falhou e o estado da chave não foi atualizado (${erroFalha.message})`,
          );
        }
      }
      if (ok && falhas.length) {
        nota = `(atendido por ${nomeDe(provedorUsado)}; motivo de cada troca:\n${falhas.join("\n")}\n)`;
      }
      if (!ok) {
        bruto = `Nenhuma conexão de IA concluiu este pedido. Motivo de cada uma:\n${
          falhas.length ? falhas.join("\n") : `- ${nomeDe(provedorUsado)}: ${bruto}`
        }\n\nAbra Configurações, cole uma chave nova do provedor desejado e tente de novo. Nada foi alterado no projeto.`;
      }
    }

    // Plugins em ação: se a IA pediu ferramenta, executamos de verdade e
    // devolvemos o resultado para ela concluir (no máximo duas rodadas).
    const ferramentasUsadas: string[] = [];
    if (ok && usada) {
      let promptComDados = promptFinal;
      for (let rodada = 0; rodada < 2; rodada += 1) {
        const pedidos = ferramentas.extrairPedidosDeFerramenta(bruto);
        if (!pedidos.length) break;
        const resultado = await ferramentas.executarFerramentas(pedidos, {
          apiUrl,
          contextoProjeto: pedidoBase,
        });
        for (const p of pedidos) ferramentasUsadas.push(p.nome);
        promptComDados = `${promptComDados}\n\n--- Resultado real das ferramentas que você pediu ---\n${resultado}\n\nATENÇÃO: Use esses dados como verdade e entregue a resposta definitiva APLICANDO o resultado diretamente nos arquivos do projeto através de <arquivo nome="..."> ou <modificar arquivo="...">. Se gerou ou buscou uma imagem ou dado, atualize o src ou o código correspondente no arquivo afetado. Nunca responda apenas dizendo que alterou sem entregar as tags com o código atualizado. Não peça ferramenta novamente.`;
        const r = await chamarProvedor(
          usada.pid,
          promptComDados,
          historico,
          usada.key,
          imagens,
          provedoresCustom,
          60_000,
          usada.apiUrl,
        );
        if (!r.ok) break;
        bruto = r.texto;
      }
    }
    bruto = ferramentas.limparFerramentas(bruto);
    if (ferramentasUsadas.length) {
      const lista = [...new Set(ferramentasUsadas)].join(", ");
      nota = `${nota ? `${nota} ` : ""}(ferramentas usadas: ${lista})`;
    }

    let textoFinal = bruto;
    let mudouArquivos = false;
    let placarEvolucao = "";
    let arquivosProduzidos: string[] = [];

    if (ok) {
      let extraido = extrairArquivos(bruto);
      arquivosProduzidos = Object.keys(extraido.arquivos);
      const exigeArquivos = pedidoExigeArquivos(prompt);
      // Projeto importado de fora (Flask, FastAPI, Node, React): o certo é consertar
      // os arquivos originais. Cobrar o banco hospedado aqui só travava a entrega.
      const { projetoExterno } = await import("./faby/builder.server");
      const externo = projetoExterno(arquivosAtuais) && intencao !== "recriar";
      const exigeBackend =
        (pedidoExigeBackend(prompt) || pedidoExigeBackend(contextoPedido.pedidoEfetivo)) &&
        !externo;

      if (intencao === "analisar" || intencao === "conversar") {
        textoFinal = extraido.texto.trim();
        if (intencao === "analisar") {
          const caminhosReais = Object.keys(arquivosAtuais).filter(
            (nome) => !nome.startsWith("enviados/"),
          );
          const citouArquivo = caminhosReais.some((nome) => textoFinal.includes(nome));
          if (textoFinal && caminhosReais.length && !citouArquivo) {
            const baseVerificada = montarMapaProjeto(arquivosAtuais)
              .split("Árvore completa de caminhos:")[0]
              ?.trim();
            textoFinal = `Base verificada nos arquivos:\n${baseVerificada}\n\n${textoFinal}`;
          }
        }
        if (!textoFinal) {
          textoFinal =
            intencao === "conversar"
              ? "Olá! Como posso ajudar você hoje com seu projeto ou desenvolvimento?"
              : "Não consegui produzir uma análise comprovada sem tentar alterar os arquivos. Nada foi modificado.";
          if (intencao === "analisar") {
            ok = false;
          }
        }
        if (nota) textoFinal = `${textoFinal}\n\n${nota}`;
        if (intencao === "analisar" && !textoFinal.includes("analisado por")) {
          textoFinal = `${textoFinal}\n\n*(analisado por ${equipeUtilizada.planejamento ?? nomeDe(provedorUsado)})*`;
        }
        try {
          await guardarNota(
            `${intencao === "analisar" ? "Análise" : "Conversa"} sobre "${prompt.slice(0, 70)}": ${textoFinal.slice(0, 220).replace(/\s+/g, " ")}`,
          );
        } catch {
          // ignore
        }

        const novaMsgAssistente: MensagemArmazenada = {
          id: crypto.randomUUID(),
          projeto_id: projetoId!,
          user_id: context.userId,
          role: "assistant",
          conteudo: textoFinal,
          modelo: provedorUsado,
          ok,
          anexos: [],
          created_at: new Date().toISOString(),
        };
        if (!cacheMensagens.has(projetoId!)) {
          cacheMensagens.set(projetoId!, []);
        }
        cacheMensagens.get(projetoId!)!.push(novaMsgAssistente);

        try {
          await context.supabase.from("mensagens").insert({
            projeto_id: projetoId,
            user_id: context.userId,
            role: "assistant",
            conteudo: textoFinal,
            modelo: provedorUsado,
            ok,
          });
        } catch {
          // ignore
        }
        return {
          projeto_id: projetoId,
          texto: textoFinal,
          ok,
          mudou_arquivos: false,
          projetoNovo,
        };
      }

      // Uma IA às vezes promete que corrigiu, mas devolve somente conversa. Nessa
      // situação fazemos uma única recuperação objetiva, sem aceitar o falso sucesso.
      if (exigeArquivos && !Object.keys(extraido.arquivos).length) {
        const reparador = candidatos.find((c) => c.pid === provedorUsado) ?? candidatos[0];
        if (reparador) {
          const recuperacao = await chamarProvedor(
            reparador.pid,
            [
              promptFinal,
              "--- CORREÇÃO OBRIGATÓRIA DE FORMATO ---",
              "Sua resposta anterior não trouxe nenhum arquivo e por isso não alterou o projeto.",
              'Faça o pedido agora e devolva os arquivos completos dentro de <arquivo nome="...">...</arquivo>.',
              "Não explique, não prometa e não use bloco Markdown. Todo botão e link deve ter uma ação real verificável.",
              exigeBackend
                ? `O pedido envolve dados salvos: use o banco de dados real já hospedado com const API = "%%FABY_API%%" e chamadas fetch de listar (GET), criar (POST), editar (PUT ?id=) e apagar (DELETE ?id=). Não crie pasta backend/.`
                : "Inclua cada arquivo necessário para a alteração aparecer e funcionar na prévia.",
            ].join("\n\n"),
            [],
            reparador.key,
            imagens,
            provedoresCustom,
            60_000,
            reparador.apiUrl,
          );
          if (recuperacao.ok) {
            extraido = extrairArquivos(recuperacao.texto);
            arquivosProduzidos = Object.keys(extraido.arquivos);
            provedorUsado = reparador.pid;
          }
        }
      }

      textoFinal = extraido.texto;
      if (Object.keys(extraido.arquivos).length) {
        const processados = await prepararArquivos(extraido.arquivos);
        // Projeto importado (Flask/Node/React): a versão web nunca apaga o original.
        // Todo arquivo original que seria sobrescrito ganha uma cópia em "originais/".
        const preservados: Record<string, string> = {};
        if (projetoExterno(arquivosAtuais)) {
          for (const [nome, conteudo] of Object.entries(arquivosAtuais)) {
            if (nome.startsWith("originais/") || nome.startsWith("enviados/")) continue;
            const chave = `originais/${nome}`;
            if (processados[nome] !== undefined && arquivosAtuais[chave] === undefined) {
              preservados[chave] = conteudo;
            }
          }
        }
        let mesclados = { ...arquivosAtuais, ...preservados, ...processados };
        // Auto-revisão: uma segunda IA (a mais forte com chave) relê o código
        // gerado e corrige erros antes da entrega — motor em duas etapas.
        const totalChars = Object.values(mesclados).reduce((s, c) => s + c.length, 0);
        // Conferência automática, arquivo por arquivo, sem gastar IA.
        let problemas = auditarArquivos(mesclados);
        const problemasAntes = problemas.length;
        // Equipe: quem revisa é, de preferência, uma IA diferente de quem escreveu.
        const porForca = [...candidatos].sort((a, b) => forca(a.pid) - forca(b.pid));
        if (totalChars <= 120000) {
          const especialistaRevisao = selecionarMelhorModeloEtapa("revisao", candidatos, provedorUsado);
          const revisor = especialistaRevisao
            ? candidatos.find((c) => c.pid === especialistaRevisao.pid) ??
              porForca.find((c) => c.pid !== provedorUsado) ??
              porForca[0]
            : porForca.find((c) => c.pid !== provedorUsado) ?? porForca[0];

          if (revisor) {
            const blocos = Object.entries(mesclados)
              .map(([n, c]) => `<arquivo nome="${n}">\n${c.slice(0, 20000)}\n</arquivo>`)
              .join("\n\n");
            const listaProblemas = problemas.length
              ? `--- Problemas JÁ CONFIRMADOS pela conferência automática (corrija TODOS) ---\n${problemas
                  .map((p, i) => `${i + 1}. ${p}`)
                  .join("\n")}`
              : "";
            const revisao = await chamarProvedor(
              revisor.pid,
              [
                "Você é um revisor técnico exigente de código front-end (HTML/CSS/JS puro, sem build). Revise os arquivos abaixo procurando: função chamada sem existir, id usado no JS que não existe no HTML, <link>/<script> apontando pra arquivo inexistente ou arquivo entregue sem ser carregado no index.html, tag não fechada, botão sem ação, formulário sem validação, link morto, e erro de sintaxe JS.",
                'Devolva SOMENTE os arquivos que precisaram de correção, no formato <arquivo nome="...">conteúdo inteiro corrigido</arquivo>. Não explique as correções. Se estiver tudo certo, responda apenas a palavra OK.',
                `--- Pedido original ---\n${prompt.slice(0, 2000)}`,
                listaProblemas,
                `--- Arquivos do projeto ---\n${blocos}`,
              ]
                .filter(Boolean)
                .join("\n\n"),
              [],
              revisor.key,
              [],
              provedoresCustom,
              60000,
              revisor.apiUrl,
              especialistaRevisao?.modeloDesejado,
            );
            if (revisao.ok && !/^\s*ok\b/i.test(revisao.texto.trim())) {
              const corrigidos = extrairArquivos(revisao.texto);
              const nomes = Object.keys(corrigidos.arquivos);
              if (nomes.length && nomes.length <= Object.keys(mesclados).length + 1) {
                const tentativa = {
                  ...mesclados,
                  ...(await prepararArquivos(corrigidos.arquivos)),
                };
                const depois = auditarArquivos(tentativa);
                const antigos = new Set(problemas);
                const naoCriouProblema = depois.every((problema) => antigos.has(problema));
                // Aceita apenas redução real ou o mesmo conjunto, nunca troca um erro por outro.
                if (depois.length < problemas.length || naoCriouProblema) {
                  mesclados = tentativa;
                  problemas = depois;
                }
                const rotuloRevisao = especialistaRevisao?.rotuloLegivel ?? nomeDe(revisor.pid);
                const notaRevisao = `revisado por ${rotuloRevisao}`;
                nota = nota ? `${nota.slice(0, -1)} · ${notaRevisao})` : `(${notaRevisao})`;
              }
            }
            equipeUtilizada.revisao = especialistaRevisao?.rotuloLegivel ?? nomeDe(revisor.pid);
          }
        }
        if (execucaoId) {
          await orquestracao.registrarEtapa(dbOrquestracao, {
            execucaoId,
            userId: context.userId,
            etapa: "construcao",
            estado: "concluida",
            resultado: `${Object.keys(extraido.arquivos).length} arquivo(s) produzido(s).`,
            modelo: provedorUsado,
            arquivos: Object.keys(extraido.arquivos),
          });
          await orquestracao.registrarEtapa(dbOrquestracao, {
            execucaoId,
            userId: context.userId,
            etapa: "revisao",
            estado: "concluida",
            resultado: `${problemas.length} ponto(s) encontrado(s) na primeira revisão.`,
            modelo: equipeUtilizada.revisao ?? provedorUsado,
          });
        }
        if (exigeBackend) {
          problemas.push(...problemasDeBanco(mesclados));
        }

        problemas = [...new Set(problemas)];

        // Recriação: confere se a versão web cobriu o inventário da referência.
        const entreguesAgora = Object.fromEntries(
          Object.keys(extraido.arquivos)
            .filter((nome) => mesclados[nome] !== undefined)
            .map((nome) => [nome, mesclados[nome] as string]),
        );
        const faltasCobertura = inventarioRecriar
          ? coberturaRecriacao(inventarioRecriar, entreguesAgora)
          : [];
        if (faltasCobertura.length) problemas = [...new Set([...problemas, ...faltasCobertura])];

        // Terceiro passo da equipe: se ainda sobrou defeito grave, uma IA de
        // conserto recebe só a lista de problemas e devolve os arquivos corrigidos.
        const gravesPendentes = [...new Set([...problemasCriticos(problemas), ...faltasCobertura])];

        if (gravesPendentes.length) {
          const especialistaConserto =
            selecionarMelhorModeloEtapa("construcao", candidatos, provedorUsado) ??
            selecionarMelhorModeloEtapa("revisao", candidatos, provedorUsado);
          const consertador = especialistaConserto
            ? candidatos.find((c) => c.pid === especialistaConserto.pid) ??
              porForca.find((c) => c.pid !== provedorUsado) ??
              porForca[0] ??
              candidatos[0]
            : porForca.find((c) => c.pid !== provedorUsado) ?? porForca[0] ?? candidatos[0];

          if (consertador) {
            const blocosConserto = Object.entries(mesclados)
              .map(([n, c]) => `<arquivo nome="${n}">\n${c.slice(0, 20000)}\n</arquivo>`)
              .join("\n\n");
            const conserto = await chamarProvedor(
              consertador.pid,
              [
                "Você conserta código. A conferência automática confirmou os defeitos abaixo. Corrija TODOS eles sem quebrar o resto e sem mudar o visual.",
                gravesPendentes.map((p, i) => `${i + 1}. ${p}`).join("\n"),
                exigeBackend
                  ? `Se faltar a gravação de dados, use o banco real já hospedado: const API = "%%FABY_API%%" e fetch para listar (GET ${"`${API}/colecao`"}), criar (POST), editar (PUT ?id=) e apagar (DELETE ?id=). Não crie pasta backend/. Cada botão e link precisa de ação real no JavaScript.`
                  : "Cada botão e link precisa de ação real verificável no JavaScript.",
                'Devolva apenas os arquivos alterados no formato <arquivo nome="...">conteúdo inteiro</arquivo>. Sem explicação.',
                `--- Arquivos do projeto ---\n${blocosConserto}`,
              ]
                .filter(Boolean)
                .join("\n\n"),
              [],
              consertador.key,
              [],
              provedoresCustom,
              60000,
              consertador.apiUrl,
              especialistaConserto?.modeloDesejado,
            );
            if (conserto.ok) {
              const arrumados = extrairArquivos(conserto.texto);
              if (Object.keys(arrumados.arquivos).length) {
                const tentativa = {
                  ...mesclados,
                  ...(await prepararArquivos(arrumados.arquivos)),
                };
                const faltando = exigeBackend ? problemasDeBanco(tentativa) : [];
                const coberturaDepois = inventarioRecriar
                  ? coberturaRecriacao(
                      inventarioRecriar,
                      Object.fromEntries(
                        Object.keys({ ...entreguesAgora, ...arrumados.arquivos })
                          .filter((nome) => tentativa[nome] !== undefined)
                          .map((nome) => [nome, tentativa[nome] as string]),
                      ),
                    )
                  : [];
                const depois = [
                  ...new Set([...auditarArquivos(tentativa), ...faltando, ...coberturaDepois]),
                ];
                const pioresDepois = [
                  ...new Set([...problemasCriticos(depois), ...coberturaDepois]),
                ];
                if (pioresDepois.length < gravesPendentes.length) {
                  mesclados = tentativa;
                  problemas = depois;

                  const rotuloConserto = especialistaConserto?.rotuloLegivel ?? nomeDe(consertador.pid);
                  const notaConserto = `corrigido por ${rotuloConserto}`;
                  nota = nota ? `${nota.slice(0, -1)} · ${notaConserto})` : `(${notaConserto})`;
                  equipeUtilizada.conserto = rotuloConserto;
                }
              }
            }
          }
        }

        // ===== Auto-evolução: metas objetivas, nota e puxão de orelha =====
        const {
          avaliarEntrega,
          promptPuxaoDeOrelha,
          afirmacoesSemProva,
          resumoEvolucao,
          TETO_TENTATIVAS,
        } = await import("./faby/evolucao.server");
        const caminhosEnviados = Object.keys(mesclados).filter(
          (n) => n.startsWith("enviados/") && imagensEnviadas.length > 0,
        );
        const opcoesMeta = { exigeBackend, pedido: prompt, imagensEnviadas: caminhosEnviados };
        let avaliacao = avaliarEntrega(mesclados, opcoesMeta);
        const rodadas: string[] = [`${nomeDe(provedorUsado)} (${avaliacao.nota}/100)`];
        const abordagensFalhadas: string[] = [];
        let tentativa = 1;
        while (!avaliacao.atingiuObjetivo && tentativa < TETO_TENTATIVAS) {
          const jaUsados = new Set(rodadas.map((r) => r.split(" (")[0]));
          const proximo =
            porForca.find((c) => !jaUsados.has(nomeDe(c.pid))) ??
            porForca.find((c) => c.pid !== provedorUsado) ??
            porForca[0];
          if (!proximo) break;
          tentativa += 1;
          abordagensFalhadas.push(avaliacao.falhas.slice(0, 3).join("; "));
          const nova = await chamarProvedor(
            proximo.pid,
            promptPuxaoDeOrelha({
              pedido: prompt,
              tentativa,
              avaliacao,
              arquivos: mesclados,
              exigeBackend,
              tentativasAnteriores: abordagensFalhadas,
            }),
            [],
            proximo.key,
            [],
            provedoresCustom,
            60_000,
            proximo.apiUrl,
          );
          if (!nova.ok) {
            rodadas.push(`${nomeDe(proximo.pid)} (falhou)`);
            continue;
          }
          const entregues = extrairArquivos(nova.texto);
          if (!Object.keys(entregues.arquivos).length) {
            rodadas.push(`${nomeDe(proximo.pid)} (sem arquivos)`);
            continue;
          }
          const tentativaArquivos = {
            ...mesclados,
            ...(await prepararArquivos(entregues.arquivos)),
          };
          const avaliada = avaliarEntrega(tentativaArquivos, opcoesMeta);
          rodadas.push(`${nomeDe(proximo.pid)} (${avaliada.nota}/100)`);
          if (avaliada.nota > avaliacao.nota) {
            mesclados = tentativaArquivos;
            avaliacao = avaliada;
            provedorUsado = proximo.pid;
            problemas = [
              ...new Set([
                ...auditarArquivos(mesclados),
                ...(exigeBackend ? problemasDeBanco(mesclados) : []),
              ]),
            ];
            if (entregues.texto.trim()) textoFinal = entregues.texto.trim();
          }
        }
        if (execucaoId) {
          const etapaTeste: Parameters<typeof orquestracao.registrarEtapa>[1] = {
            execucaoId,
            userId: context.userId,
            etapa: "teste",
            estado: avaliacao.atingiuObjetivo ? "concluida" : "bloqueada",
            resultado: `Conferência determinística: ${avaliacao.nota}/100.`,
            tentativa,
          };
          if (avaliacao.falhas.length) etapaTeste.erro = avaliacao.falhas.join("; ");
          await orquestracao.registrarEtapa(dbOrquestracao, etapaTeste);
          if (tentativa > 1) {
            await orquestracao.registrarEtapa(dbOrquestracao, {
              execucaoId,
              userId: context.userId,
              etapa: "correcao",
              estado: avaliacao.atingiuObjetivo ? "concluida" : "bloqueada",
              resultado: `${tentativa - 1} rodada(s) automática(s) de correção.`,
              tentativa,
            });
          }
        }
        // Corta a mentira: frase que os arquivos não sustentam vira aviso honesto.
        const mentiras = afirmacoesSemProva(textoFinal, mesclados, avaliacao);
        if (mentiras.length) {
          textoFinal = [
            "Corrigindo o que eu ia te dizer errado:",
            ...mentiras.map((m) => `- ${m}`),
            "",
            textoFinal,
          ].join("\n");
        }
        textoFinal = `${textoFinal}${resumoEvolucao(avaliacao, tentativa, rodadas)}`;
        placarEvolucao = `nota ${avaliacao.nota}/100 em ${tentativa} tentativa(s)${
          avaliacao.falhas.length
            ? `; faltou: ${avaliacao.falhas.slice(0, 2).join("; ").slice(0, 200)}`
            : ""
        }`;
        // Escola: a nota alimenta a média e cada falha real vira lição permanente.
        await escola.registrarNotaEscola(dbEscola, context.userId, avaliacao.nota);
        if (avaliacao.falhas.length) {
          await escola.registrarFalhasComoLicoes(dbEscola, context.userId, avaliacao.falhas);
        }

        const criticosAntes = problemasCriticos(auditarArquivos(arquivosAtuais));
        const criticosDepois = problemasCriticos(problemas);
        const criouProblemaCritico = criticosDepois.some(
          (problema) => !criticosAntes.includes(problema),
        );
        const criacaoInvalida = !Object.keys(arquivosAtuais).length && criticosDepois.length > 0;
        const pediuInteracao = /\b(bot[aã]o|link|menu|navega[çc][aã]o|clique|clicar)\b/i.test(
          prompt,
        );
        const interacaoAindaQuebrada =
          pediuInteracao &&
          criticosDepois.some((problema) =>
            /botão sem ação|link interno|não existe no javascript|não existe no html/i.test(
              problema,
            ),
          );
        const backendAindaIncompleto =
          exigeBackend &&
          criticosDepois.some((problema) =>
            /não chama a api|nenhuma chamada fetch|nada é gravado no banco|em vez de gravar no banco/i.test(
              problema,
            ),
          );

        if (criticosDepois.length > 0) {
          const linhasAvisos = criticosDepois.map((p) => `- ${p}`).join("\n");
          textoFinal = `${textoFinal}\n\n---\n**Notas de Verificação:**\n${linhasAvisos}`;
        } else if (problemasAntes || problemas.length) {
          const corrigidos = problemasAntes - problemas.length;
          const linhas = problemas.length
            ? `\n${problemas.map((p) => `- ${p}`).join("\n")}`
            : "\nNenhum problema restante.";
          textoFinal = `${textoFinal}\n\n---\n**Conferência automática** (${problemasAntes} ponto(s) encontrado(s)${
            corrigidos > 0 ? `, ${corrigidos} corrigido(s) antes da entrega` : ""
          })${linhas}`;
        }
        // Backup e gravação só acontecem depois da entrega passar pelo bloqueio.
        if (ok && Object.keys(arquivosAtuais).length) {
          try {
            const { error: erroBackup } = await context.supabase.from("backups").insert({
              user_id: context.userId,
              projeto_id: projetoId,
              rotulo: `Antes de: ${prompt.slice(0, 60)}`,
              arquivos: arquivosAtuais as unknown as never,
            });
            if (erroBackup) {
              console.warn("[Faby] Aviso ao criar backup no Supabase:", erroBackup.message);
            }
          } catch (e) {
            console.warn("[Faby] Exceção ao tentar criar backup:", e);
          }
        }
        if (ok) {
          if (cacheProjetos.has(projetoId!)) {
            const p = cacheProjetos.get(projetoId!)!;
            p.arquivos = mesclados;
            p.modelo = provedorUsado;
            p.updated_at = new Date().toISOString();
          }
          mudouArquivos = true;
          try {
            await context.supabase
              .from("projetos")
              .update({ arquivos: mesclados as unknown as never, modelo: provedorUsado })
              .eq("id", projetoId);
          } catch {
            // ignore
          }
        }
      } else {
        if (exigeArquivos) {
          ok = false;
          textoFinal =
            "A IA respondeu, mas não entregou nenhum arquivo. Por segurança, não marquei como concluído e não alterei a prévia. Tente novamente ou use o Duelo de IAs.";
        } else {
          try {
            await context.supabase
              .from("projetos")
              .update({ modelo: data.model })
              .eq("id", projetoId);
          } catch {
            // ignore
          }
        }
      }
      if (nota) textoFinal = `${textoFinal}\n\n${nota}`;

      const partesEquipe: string[] = [];
      if (equipeUtilizada.planejamento) partesEquipe.push(`planejado por ${equipeUtilizada.planejamento}`);
      if (equipeUtilizada.construcao) partesEquipe.push(`construído por ${equipeUtilizada.construcao}`);
      if (equipeUtilizada.revisao) partesEquipe.push(`revisado por ${equipeUtilizada.revisao}`);
      if (equipeUtilizada.conserto && equipeUtilizada.conserto !== equipeUtilizada.revisao) {
        partesEquipe.push(`corrigido por ${equipeUtilizada.conserto}`);
      }

      if (partesEquipe.length > 0 && (intencao as string) !== "conversar") {
        const infoEquipe = `\n\n*(equipe de IAs: ${partesEquipe.join(" · ")})*`;
        if (!textoFinal.includes("equipe de IAs:")) {
          textoFinal = `${textoFinal}${infoEquipe}`;
        }
      }

      if (especialistaConstrucao?.ehFallbackFraco && (intencao as string) !== "conversar") {
        const dicaChave = `\n\n> 💡 **Dica de qualidade:** Cadastre uma chave gratuita do **Groq** ou **OpenRouter** nas Configurações para ativar os modelos especialistas em código (**Qwen 2.5 Coder 32B** e **DeepSeek R1**) na construção dos seus projetos.`;
        if (!textoFinal.includes("Dica de qualidade:")) {
          textoFinal = `${textoFinal}${dicaChave}`;
        }
      }
      try {
        await guardarNota(
          mudouArquivos
            ? `[CONCLUÍDO] Pedido "${prompt.slice(0, 70)}" (${placarEvolucao || "sem placar"}). Arquivos tocados: ${Object.keys(extraido.arquivos).join(", ").slice(0, 200)}. [PRÓXIMO] Validar na prévia e tratar somente erros observados.`
            : `[BLOQUEADO] Pedido "${prompt.slice(0, 70)}" não entrou na prévia (${placarEvolucao || "sem placar"}): ${textoFinal.slice(0, 200).replace(/\s+/g, " ")}. [PENDENTE] Resolver o bloqueio sem repetir a mesma abordagem.`,
        );
      } catch {
        // ignore
      }
    } else {
      textoFinal = `Erro: ${bruto}`;
    }

    const novaMsgAssistente: MensagemArmazenada = {
      id: crypto.randomUUID(),
      projeto_id: projetoId!,
      user_id: context.userId,
      role: "assistant",
      conteudo: textoFinal,
      modelo: provedorUsado,
      ok,
      anexos: [],
      created_at: new Date().toISOString(),
    };
    if (!cacheMensagens.has(projetoId!)) {
      cacheMensagens.set(projetoId!, []);
    }
    cacheMensagens.get(projetoId!)!.push(novaMsgAssistente);

    try {
      await context.supabase.from("mensagens").insert({
        projeto_id: projetoId,
        user_id: context.userId,
        role: "assistant",
        conteudo: textoFinal,
        modelo: provedorUsado,
        ok,
      });
    } catch {
      // ignore
    }

    if (execucaoId) {
      try {
        await orquestracao.finalizarExecucao(dbOrquestracao, {
          execucaoId,
          userId: context.userId,
          ok: ok && mudouArquivos,
          modelos: [provedorUsado],
          arquivos: mudouArquivos ? arquivosProduzidos : [],
          resumo: textoFinal.slice(0, 4000),
        });
      } catch {
        // ignore
      }
    }

    return {
      projeto_id: projetoId,
      texto: textoFinal,
      ok,
      mudou_arquivos: mudouArquivos,
      projetoNovo,
    };
  });
