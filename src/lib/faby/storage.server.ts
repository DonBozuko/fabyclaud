import fs from "node:fs";
import path from "node:path";
import type { ProvedorCustom } from "./config";

export interface ChaveArmazenada {
  user_id: string;
  provider: string;
  api_key: string;
  api_url: string | null;
  testada_ok: boolean;
  testada_em: string | null;
  ultimo_erro: string | null;
}

export interface ProjetoArmazenado {
  id: string;
  user_id: string;
  nome: string;
  modelo: string;
  arquivos: Record<string, string>;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface MensagemArmazenada {
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

export interface ExecucaoArmazenada {
  id: string;
  projeto_id: string;
  user_id: string;
  etapa_atual: string;
  estado: string;
  ultimo_erro: string | null;
  modelos_usados: string[];
  provas: any[];
  created_at: string;
  concluida_em: string | null;
}

export interface EtapaArmazenada {
  id: string;
  execucao_id: string;
  user_id?: string;
  etapa: string;
  estado: string;
  modelo?: string;
  tentativa?: number;
  resultado_resumo?: string;
  erro?: string;
  arquivos_produzidos?: string[];
  concluida_em?: string;
  created_at: string;
}

export interface GithubContaArmazenada {
  user_id: string;
  token: string;
  login: string;
  repo?: string;
  branch?: string;
}

interface FabyStorageData {
  chaves: Record<string, Record<string, ChaveArmazenada>>; // userId -> provider -> ChaveArmazenada
  projetos: Record<string, ProjetoArmazenado>; // projetoId -> ProjetoArmazenado
  mensagens: Record<string, MensagemArmazenada[]>; // projetoId -> MensagemArmazenada[]
  custom: Record<string, ProvedorCustom[]>; // userId -> ProvedorCustom[]
  memorias: Record<string, string>; // userId -> conteudo
  execucoes: Record<string, ExecucaoArmazenada>; // projetoId -> ExecucaoArmazenada
  etapas: Record<string, EtapaArmazenada[]>; // execucaoId -> EtapaArmazenada[]
  contasGithub: Record<string, GithubContaArmazenada>; // userId -> GithubContaArmazenada
}

export function isChaveDeTeste(apiKey?: string | null, userId?: string | null): boolean {
  if (!apiKey || apiKey.trim().length === 0) return true;
  if (
    /testkey|fakekey|testresilience|chave-falsa|chave_fake|fake-key|mock|aizasytest/i.test(apiKey)
  ) {
    return true;
  }
  if (userId && /^(user-test-|user-prova-|user-original-)/i.test(userId)) {
    return true;
  }
  return false;
}

export function getStorageFile(): string {
  const customFile = process.env["FABY_STORAGE_FILE"];
  if (customFile) {
    return path.resolve(process.cwd(), customFile);
  }
  if (
    process.env["NODE_ENV"] === "test" ||
    Boolean(process.env["VITEST"]) ||
    process.env["FABY_STORAGE_TEST_MODE"] === "true"
  ) {
    return path.resolve(process.cwd(), ".faby_storage_test.json");
  }
  return path.resolve(process.cwd(), ".faby_storage.json");
}

let memoryState: FabyStorageData = {
  chaves: {},
  projetos: {},
  mensagens: {},
  custom: {},
  memorias: {},
  execucoes: {},
  etapas: {},
  contasGithub: {},
};

let lastMtime = 0;

function carregarDoDisco(): void {
  try {
    const file = getStorageFile();
    if (fs.existsSync(file)) {
      const stat = fs.statSync(file);
      if (stat.mtimeMs !== lastMtime || lastMtime === 0) {
        lastMtime = stat.mtimeMs;
        const conteudo = fs.readFileSync(file, "utf-8");
        if (conteudo.trim()) {
          const dados = JSON.parse(conteudo);
          memoryState = {
            chaves: dados.chaves || {},
            projetos: dados.projetos || {},
            mensagens: dados.mensagens || {},
            custom: dados.custom || {},
            memorias: dados.memorias || {},
            execucoes: dados.execucoes || {},
            etapas: dados.etapas || {},
            contasGithub: dados.contasGithub || {},
          };
        }
      }
    }
  } catch (err) {
    console.warn("[FabyStorage] Aviso ao carregar armazenamento do disco:", err);
  }
}

function persistirNoDisco(): void {
  try {
    const file = getStorageFile();
    const json = JSON.stringify(memoryState, null, 2);
    fs.writeFileSync(file, json, "utf-8");
    try {
      const stat = fs.statSync(file);
      lastMtime = stat.mtimeMs;
    } catch {
      // ignore
    }
  } catch (e) {
    console.error("[FabyStorage] Erro ao gravar dados em disco:", e);
  }
}

/** Força gravação síncrona/imediata em operações críticas */
export function flushStorageSync(): void {
  carregarDoDisco();
  persistirNoDisco();
}

function userScopeSet(userIds: string[] = []): Set<string> {
  const ids = new Set<string>();
  const validIds = userIds.filter((uid) => uid && uid !== "00000000-0000-0000-0000-000000000001");
  if (validIds.length > 0) {
    for (const uid of validIds) ids.add(uid);
  } else {
    for (const uid of userIds) {
      if (uid) ids.add(uid);
    }
  }
  return ids;
}

// =================== CHAVES ===================

export function obterChavesArmazenadas(userIds: string[]): ChaveArmazenada[] {
  carregarDoDisco();
  const ids = userScopeSet(userIds);
  const isTestMode =
    process.env["NODE_ENV"] === "test" ||
    Boolean(process.env["VITEST"]) ||
    process.env["FABY_STORAGE_TEST_MODE"] === "true";

  const res: ChaveArmazenada[] = [];
  const vistas = new Set<string>();

  // 1. Procura primeiro nos IDs da sessão/usuário
  for (const uid of ids) {
    const userChaves = memoryState.chaves[uid];
    if (!userChaves) continue;
    for (const [provider, chave] of Object.entries(userChaves)) {
      if (!isTestMode && isChaveDeTeste(chave.api_key, chave.user_id)) continue;
      if (!vistas.has(provider)) {
        vistas.add(provider);
        res.push(chave);
      }
    }
  }

  // 2. Se nenhuma chave foi encontrada nos IDs específicos, recupera as chaves do armazenamento local
  if (res.length === 0) {
    for (const userChaves of Object.values(memoryState.chaves)) {
      if (!userChaves) continue;
      for (const [provider, chave] of Object.entries(userChaves)) {
        if (!isTestMode && isChaveDeTeste(chave.api_key, chave.user_id)) continue;
        if (!vistas.has(provider)) {
          vistas.add(provider);
          res.push(chave);
        }
      }
    }
  }

  // 3. Suporte nativo a variáveis de ambiente do servidor / Lovable Cloud Secrets
  const ENV_PROVIDER_MAP: Record<string, string[]> = {
    google: ["GEMINI_API_KEY", "GOOGLE_API_KEY", "VITE_GEMINI_API_KEY", "VITE_GOOGLE_API_KEY"],
    openrouter: ["OPENROUTER_API_KEY", "VITE_OPENROUTER_API_KEY"],
    groq: ["GROQ_API_KEY", "VITE_GROQ_API_KEY"],
    deepseek: ["DEEPSEEK_API_KEY", "VITE_DEEPSEEK_API_KEY"],
    openai: ["OPENAI_API_KEY", "VITE_OPENAI_API_KEY"],
    anthropic: ["ANTHROPIC_API_KEY", "CLAUDE_API_KEY", "VITE_ANTHROPIC_API_KEY"],
    huggingface: ["HUGGINGFACE_API_KEY", "HF_TOKEN", "VITE_HUGGINGFACE_API_KEY"],
    mistral: ["MISTRAL_API_KEY", "VITE_MISTRAL_API_KEY"],
    cohere: ["COHERE_API_KEY", "VITE_COHERE_API_KEY"],
    together: ["TOGETHER_API_KEY", "VITE_TOGETHER_API_KEY"],
    cerebras: ["CEREBRAS_API_KEY", "VITE_CEREBRAS_API_KEY"],
    sambanova: ["SAMBANOVA_API_KEY", "VITE_SAMBANOVA_API_KEY"],
  };

  for (const [provider, envNames] of Object.entries(ENV_PROVIDER_MAP)) {
    if (!vistas.has(provider)) {
      for (const envName of envNames) {
        const val = process.env[envName];
        if (val && val.trim() && (!isChaveDeTeste(val) || isTestMode)) {
          vistas.add(provider);
          res.push({
            user_id: userIds[0] || "server_env",
            provider,
            api_key: val.trim(),
            api_url: null,
            testada_ok: true,
            testada_em: new Date().toISOString(),
            ultimo_erro: null,
          });
          break;
        }
      }
    }
  }

  return res;
}

export function salvarChaveArmazenada(chave: ChaveArmazenada): void {
  carregarDoDisco();
  const isTestMode =
    process.env["NODE_ENV"] === "test" ||
    Boolean(process.env["VITEST"]) ||
    process.env["FABY_STORAGE_TEST_MODE"] === "true";
  if (!isTestMode && isChaveDeTeste(chave.api_key, chave.user_id)) {
    return;
  }
  if (!memoryState.chaves[chave.user_id]) {
    memoryState.chaves[chave.user_id] = {};
  }
  const userMap = memoryState.chaves[chave.user_id];
  if (userMap) {
    userMap[chave.provider] = chave;
  }
  persistirNoDisco();
}

export function apagarChaveArmazenada(userId: string, provider: string): void {
  carregarDoDisco();
  for (const [uid, userMap] of Object.entries(memoryState.chaves)) {
    if (userMap && userMap[provider]) {
      delete userMap[provider];
    }
    if (Object.keys(userMap ?? {}).length === 0) {
      delete memoryState.chaves[uid];
    }
  }
  persistirNoDisco();
}

// =================== PROJETOS ===================

export function listarProjetosArmazenados(userIds?: string[]): ProjetoArmazenado[] {
  carregarDoDisco();
  const todos = Object.values(memoryState.projetos).filter(Boolean);
  if (todos.length === 0) return [];

  const hasUserFilter = userIds && userIds.length > 0;
  if (!hasUserFilter) {
    return todos.sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime(),
    );
  }

  const ids = userScopeSet(userIds);
  const ehSessaoLocalOuAnonima =
    ids.has("00000000-0000-0000-0000-000000000001") ||
    Array.from(ids).some(
      (id) =>
        id.startsWith("local_") ||
        id.startsWith("device_") ||
        id.startsWith("user-") ||
        id.startsWith("user_"),
    );

  let list: ProjetoArmazenado[] = todos.filter((p) => {
    if (!p?.user_id) return true;
    if (ehSessaoLocalOuAnonima) return true;
    return ids.has(p.user_id);
  });

  if (list.length === 0) {
    list = todos;
  }

  return list.sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at).getTime() -
      new Date(a.updated_at || a.created_at).getTime(),
  );
}

export function obterProjetoArmazenado(id: string, userIds?: string[]): ProjetoArmazenado | null {
  carregarDoDisco();
  const item = memoryState.projetos[id];
  if (!item) return null;
  return item;
}

export function salvarProjetoArmazenado(projeto: ProjetoArmazenado): void {
  carregarDoDisco();
  memoryState.projetos[projeto.id] = {
    ...projeto,
    updated_at: projeto.updated_at || new Date().toISOString(),
  };
  persistirNoDisco();
}

export function apagarProjetoArmazenado(id: string): void {
  carregarDoDisco();
  delete memoryState.projetos[id];
  delete memoryState.mensagens[id];
  delete memoryState.execucoes[id];
  delete memoryState.etapas[id];
  persistirNoDisco();
}

// =================== MENSAGENS ===================

export function listarMensagensArmazenadas(projetoId: string): MensagemArmazenada[] {
  carregarDoDisco();
  const msgs = memoryState.mensagens[projetoId] || [];
  return msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function salvarMensagemArmazenada(msg: MensagemArmazenada): void {
  carregarDoDisco();
  if (!memoryState.mensagens[msg.projeto_id]) {
    memoryState.mensagens[msg.projeto_id] = [];
  }
  const lista = memoryState.mensagens[msg.projeto_id];
  if (lista) {
    const idx = lista.findIndex((m) => m.id === msg.id);
    if (idx >= 0) {
      lista[idx] = msg;
    } else {
      lista.push(msg);
    }
  }
  persistirNoDisco();
}

// =================== MEMÓRIAS & PROVEDORES ===================

export function obterMemoriaArmazenada(userIds: string[]): string {
  carregarDoDisco();
  const ids = userScopeSet(userIds);

  for (const uid of ids) {
    if (memoryState.memorias[uid]) {
      return memoryState.memorias[uid];
    }
  }
  for (const mem of Object.values(memoryState.memorias)) {
    if (mem) return mem;
  }
  return "";
}

export function salvarMemoriaArmazenada(userId: string, conteudo: string): void {
  carregarDoDisco();
  memoryState.memorias[userId] = conteudo;
  persistirNoDisco();
}

export function listarProvedoresCustomArmazenados(userIds: string[]): ProvedorCustom[] {
  carregarDoDisco();
  const ids = userScopeSet(userIds);

  const list: ProvedorCustom[] = [];
  const slugs = new Set<string>();
  for (const uid of ids) {
    const arr = memoryState.custom[uid];
    if (!arr) continue;
    for (const item of arr) {
      if (!slugs.has(item.slug)) {
        slugs.add(item.slug);
        list.push(item);
      }
    }
  }

  if (list.length === 0) {
    for (const arr of Object.values(memoryState.custom)) {
      if (!arr) continue;
      for (const item of arr) {
        if (!slugs.has(item.slug)) {
          slugs.add(item.slug);
          list.push(item);
        }
      }
    }
  }
  return list;
}

export function salvarProvedorCustomArmazenado(userId: string, item: ProvedorCustom): void {
  carregarDoDisco();
  if (!memoryState.custom[userId]) {
    memoryState.custom[userId] = [];
  }
  const arr = memoryState.custom[userId];
  if (arr) {
    const idx = arr.findIndex((c) => c.slug === item.slug || c.id === item.id);
    if (idx >= 0) {
      arr[idx] = item;
    } else {
      arr.push(item);
    }
  }
  persistirNoDisco();
}

export function apagarProvedorCustomArmazenado(userId: string, idOuSlug: string): void {
  carregarDoDisco();
  const arr = memoryState.custom[userId];
  if (arr) {
    memoryState.custom[userId] = arr.filter((c) => c.id !== idOuSlug && c.slug !== idOuSlug);
  }
  persistirNoDisco();
}

// =================== EXECUÇÕES & ETAPAS ===================

export function obterExecucaoArmazenada(projetoId: string): ExecucaoArmazenada | null {
  carregarDoDisco();
  return memoryState.execucoes[projetoId] || null;
}

export function salvarExecucaoArmazenada(ex: ExecucaoArmazenada): void {
  carregarDoDisco();
  memoryState.execucoes[ex.projeto_id] = ex;
  persistirNoDisco();
}

export function listarEtapasArmazenadas(execucaoId: string): EtapaArmazenada[] {
  carregarDoDisco();
  return memoryState.etapas[execucaoId] || [];
}

export function salvarEtapaArmazenada(etapa: EtapaArmazenada): void {
  carregarDoDisco();
  if (!memoryState.etapas[etapa.execucao_id]) {
    memoryState.etapas[etapa.execucao_id] = [];
  }
  const arr = memoryState.etapas[etapa.execucao_id];
  if (arr) {
    const idx = arr.findIndex((e) => e.id === etapa.id);
    if (idx >= 0) {
      arr[idx] = etapa;
    } else {
      arr.push(etapa);
    }
  }
  persistirNoDisco();
}

// =================== GITHUB CONTAS ===================

export function obterGithubContaArmazenada(userIds: string[]): GithubContaArmazenada | null {
  carregarDoDisco();
  const ids = userScopeSet(userIds);

  for (const uid of ids) {
    if (memoryState.contasGithub[uid]) {
      return memoryState.contasGithub[uid];
    }
  }
  const todas = Object.values(memoryState.contasGithub);
  return todas[0] || null;
}

export function salvarGithubContaArmazenada(conta: GithubContaArmazenada): void {
  carregarDoDisco();
  memoryState.contasGithub[conta.user_id] = conta;
  persistirNoDisco();
}

export function apagarGithubContaArmazenada(userId: string): void {
  carregarDoDisco();
  delete memoryState.contasGithub[userId];
  persistirNoDisco();
}
