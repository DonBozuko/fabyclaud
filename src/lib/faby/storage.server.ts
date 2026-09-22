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

const STORAGE_FILE = path.resolve(process.cwd(), ".faby_storage.json");

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
    if (fs.existsSync(STORAGE_FILE)) {
      const stat = fs.statSync(STORAGE_FILE);
      if (stat.mtimeMs !== lastMtime || lastMtime === 0) {
        lastMtime = stat.mtimeMs;
        const conteudo = fs.readFileSync(STORAGE_FILE, "utf-8");
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
    const json = JSON.stringify(memoryState, null, 2);
    fs.writeFileSync(STORAGE_FILE, json, "utf-8");
    try {
      const stat = fs.statSync(STORAGE_FILE);
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

  const res: ChaveArmazenada[] = [];
  const vistas = new Set<string>();

  // 1. Procura primeiro nos IDs da sessão/usuário
  for (const uid of ids) {
    const userChaves = memoryState.chaves[uid];
    if (!userChaves) continue;
    for (const [provider, chave] of Object.entries(userChaves)) {
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
        if (!vistas.has(provider)) {
          vistas.add(provider);
          res.push(chave);
        }
      }
    }
  }

  return res;
}

export function salvarChaveArmazenada(chave: ChaveArmazenada): void {
  carregarDoDisco();
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
  const userMap = memoryState.chaves[userId];
  if (userMap && userMap[provider]) {
    delete userMap[provider];
  }
  if (Object.keys(userMap ?? {}).length === 0) {
    delete memoryState.chaves[userId];
  }
  persistirNoDisco();
}

// =================== PROJETOS ===================

export function listarProjetosArmazenados(userIds?: string[]): ProjetoArmazenado[] {
  carregarDoDisco();
  const hasUserFilter = userIds && userIds.length > 0;
  const ids = hasUserFilter ? userScopeSet(userIds) : null;

  let list: ProjetoArmazenado[] = Object.values(memoryState.projetos).filter((p) => {
    if (!p?.user_id) return false;
    if (!ids || ids.size === 0) return true;
    return ids.has(p.user_id);
  });

  if (list.length === 0 && Object.keys(memoryState.projetos).length > 0) {
    list = Object.values(memoryState.projetos);
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
