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

interface FabyStorageData {
  chaves: Record<string, Record<string, ChaveArmazenada>>; // userId -> provider -> ChaveArmazenada
  projetos: Record<string, ProjetoArmazenado>; // projetoId -> ProjetoArmazenado
  mensagens: Record<string, MensagemArmazenada[]>; // projetoId -> MensagemArmazenada[]
  custom: Record<string, ProvedorCustom[]>; // userId -> ProvedorCustom[]
  memorias: Record<string, string>; // userId -> conteudo
  execucoes: Record<string, ExecucaoArmazenada>; // projetoId -> ExecucaoArmazenada
  etapas: Record<string, EtapaArmazenada[]>; // execucaoId -> EtapaArmazenada[]
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
};

let initialized = false;
let pendingSaveTimeout: NodeJS.Timeout | null = null;

function carregarDoDisco(): void {
  if (initialized) return;
  initialized = true;
  try {
    if (fs.existsSync(STORAGE_FILE)) {
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
        };
      }
    }
  } catch (err) {
    console.warn("[FabyStorage] Aviso ao carregar armazenamento do disco:", err);
  }
}

function persistirNoDisco(): void {
  if (pendingSaveTimeout) return;
  pendingSaveTimeout = setTimeout(() => {
    pendingSaveTimeout = null;
    try {
      const json = JSON.stringify(memoryState, null, 2);
      const tmpFile = `${STORAGE_FILE}.tmp`;
      fs.writeFileSync(tmpFile, json, "utf-8");
      fs.renameSync(tmpFile, STORAGE_FILE);
    } catch (err) {
      try {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(memoryState), "utf-8");
      } catch (e) {
        console.error("[FabyStorage] Erro ao gravar dados em disco:", e);
      }
    }
  }, 100);
}

/** Força gravação síncrona/imediata em operações críticas */
export function flushStorageSync(): void {
  carregarDoDisco();
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(memoryState, null, 2), "utf-8");
  } catch (e) {
    console.error("[FabyStorage] Erro ao gravar storage imediatamente:", e);
  }
}

// =================== CHAVES ===================

export function obterChavesArmazenadas(userIds: string[]): ChaveArmazenada[] {
  carregarDoDisco();
  const res: ChaveArmazenada[] = [];
  const vistas = new Set<string>();

  for (const uid of userIds) {
    const userChaves = memoryState.chaves[uid];
    if (userChaves) {
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
  memoryState.chaves[chave.user_id][chave.provider] = chave;
  persistirNoDisco();
}

export function apagarChaveArmazenada(userId: string, provider: string): void {
  carregarDoDisco();
  if (memoryState.chaves[userId]?.[provider]) {
    delete memoryState.chaves[userId][provider];
    persistirNoDisco();
  }
}

// =================== PROJETOS ===================

export function listarProjetosArmazenados(userIds: string[]): ProjetoArmazenado[] {
  carregarDoDisco();
  const list: ProjetoArmazenado[] = [];
  for (const p of Object.values(memoryState.projetos)) {
    if (userIds.includes(p.user_id) || userIds.includes("00000000-0000-0000-0000-000000000001")) {
      list.push(p);
    }
  }
  return list.sort(
    (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime(),
  );
}

export function obterProjetoArmazenado(id: string, userIds?: string[]): ProjetoArmazenado | null {
  carregarDoDisco();
  const p = memoryState.projetos[id];
  if (!p) return null;
  if (!userIds || userIds.length === 0) return p;
  if (userIds.includes(p.user_id) || userIds.includes("00000000-0000-0000-0000-000000000001")) {
    return p;
  }
  return p; // Retorna para resiliência de modo offline/local
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
  persistirNoDisco();
}

// =================== MENSAGENS ===================

export function listarMensagensArmazenadas(projetoId: string): MensagemArmazenada[] {
  carregarDoDisco();
  return memoryState.mensagens[projetoId] || [];
}

export function salvarMensagemArmazenada(msg: MensagemArmazenada): void {
  carregarDoDisco();
  if (!memoryState.mensagens[msg.projeto_id]) {
    memoryState.mensagens[msg.projeto_id] = [];
  }
  const lista = memoryState.mensagens[msg.projeto_id];
  const idx = lista.findIndex((m) => m.id === msg.id);
  if (idx >= 0) {
    lista[idx] = msg;
  } else {
    lista.push(msg);
  }
  persistirNoDisco();
}

// =================== MEMÓRIAS & PROVEDORES ===================

export function obterMemoriaArmazenada(userIds: string[]): string {
  carregarDoDisco();
  for (const uid of userIds) {
    if (memoryState.memorias[uid]) {
      return memoryState.memorias[uid];
    }
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
  const list: ProvedorCustom[] = [];
  const slugs = new Set<string>();
  for (const uid of userIds) {
    const arr = memoryState.custom[uid] || [];
    for (const item of arr) {
      if (!slugs.has(item.slug)) {
        slugs.add(item.slug);
        list.push(item);
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
  const idx = arr.findIndex((c) => c.slug === item.slug || c.id === item.id);
  if (idx >= 0) {
    arr[idx] = item;
  } else {
    arr.push(item);
  }
  persistirNoDisco();
}

export function apagarProvedorCustomArmazenado(userId: string, idOuSlug: string): void {
  carregarDoDisco();
  if (memoryState.custom[userId]) {
    memoryState.custom[userId] = memoryState.custom[userId].filter(
      (c) => c.id !== idOuSlug && c.slug !== idOuSlug,
    );
    persistirNoDisco();
  }
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
  const idx = arr.findIndex((e) => e.id === etapa.id);
  if (idx >= 0) {
    arr[idx] = etapa;
  } else {
    arr.push(etapa);
  }
  persistirNoDisco();
}
