import { DirectoryReader } from "@/agents/DirectoryReader";
import { OpenManusReActAgent } from "@/agents/OpenManusEngine";
import type { VFSSnapshot } from "@/agents/types";

const directoryReader = new DirectoryReader();
const openManusAgent = new OpenManusReActAgent();

type Db = {
  from: (tabela: string) => {
    insert: (valor: unknown) => {
      select: (campos: string) => {
        single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
    upsert: (
      valor: unknown,
      options?: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
    update: (valor: unknown) => {
      eq: (campo: string, valor: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export type EtapaConstrucao =
  | "diagnostico"
  | "planejamento"
  | "arquitetura"
  | "construcao"
  | "revisao"
  | "teste"
  | "correcao"
  | "entrega";

/**
 * Monta o Snapshot VFS em memória para ser injetado em prompts do sistema.
 */
export function montarContextoVFS(arquivos: Record<string, string>): VFSSnapshot {
  return directoryReader.gerarSnapshotCompleto(arquivos);
}

/**
 * Injeta o Snapshot XML estruturado do Stateful VFS no System Prompt.
 * Regra do motor: NENHUMA IA (grátis ou paga) roda às cegas. Antes de qualquer
 * resposta, a árvore e o conteúdo integral dos arquivos do projeto do usuário
 * são lidos pelo DirectoryReader e injetados no Context Window.
 */
export function injetarSnapshotVFS(
  systemPromptBase: string,
  arquivos: Record<string, string>,
  opcoes?: {
    limiteBytesPorArquivo?: number;
    ignorarCaminhos?: string[];
  },
): string {
  const totalArquivos = Object.keys(arquivos).filter(
    (c) => !c.startsWith("enviados/") && !c.startsWith("originais/"),
  ).length;

  if (totalArquivos === 0) {
    return `${systemPromptBase}\n\n<!-- [STATEFUL VFS: Nenhum arquivo criado ainda no projeto. Inicie criando os arquivos fundamentais] -->`;
  }

  const snapshotXml = directoryReader.gerarSnapshotXml(arquivos, opcoes);

  return [
    systemPromptBase,
    "================================================================================",
    "STATEFUL VFS SNAPSHOT (ESTADO REAL E ATUAL DO PROJETO - LEITURA OBRIGATÓRIA):",
    "Abaixo está a representação viva e integral de todos os arquivos existentes.",
    "Para qualquer alteração, SEMPRE devolva o arquivo 100% COMPLETO e REESCRITO.",
    "================================================================================",
    snapshotXml,
    "================================================================================",
  ].join("\n");
}

/**
 * Monta o prompt orquestrado completo com o Snapshot VFS injetado.
 * Esta função une o pedido do usuário, as regras do arquiteto/programador e o estado
 * real do projeto para que qualquer modelo gratuito (Gemini/Groq/OpenRouter) tenha continuidade perfeita.
 */
export function montarPromptComVFS(
  pedidoUsuario: string,
  arquivosAtuais: Record<string, string>,
  instrucoesBase: string,
  opcoes?: {
    limiteBytesPorArquivo?: number;
    ignorarCaminhos?: string[];
  },
): string {
  const promptComSnapshot = injetarSnapshotVFS(instrucoesBase, arquivosAtuais, opcoes);
  return `${promptComSnapshot}\n\n--- PEDIDO DO USUÁRIO (EXECUÇÃO IMEDIATA) ---\n${pedidoUsuario}`;
}

export async function iniciarExecucao(
  db: Db,
  dados: { projetoId: string; userId: string; pedido: string; diagnostico: string },
): Promise<string> {
  let idGerado: string = crypto.randomUUID();
  try {
    const { data, error } = await db
      .from("execucoes_construcao")
      .insert({
        id: idGerado,
        projeto_id: dados.projetoId,
        user_id: dados.userId,
        pedido: dados.pedido,
        etapa_atual: "diagnostico",
        estado: "em_andamento",
        provas: { diagnostico: dados.diagnostico.slice(0, 4000) },
      })
      .select("id")
      .single();
    if (!error && data?.id) {
      idGerado = data.id;
    }
  } catch {
    // fallback para ID em memória caso a tabela esteja pendente de migração
  }

  await registrarEtapa(db, {
    execucaoId: idGerado,
    userId: dados.userId,
    etapa: "diagnostico",
    estado: "concluida",
    resultado: dados.diagnostico,
  }).catch(() => {});

  return idGerado;
}

export async function registrarEtapa(
  db: Db,
  dados: {
    execucaoId: string;
    userId: string;
    etapa: EtapaConstrucao;
    estado: "pendente" | "em_andamento" | "concluida" | "bloqueada" | "falhou";
    entrada?: string;
    resultado?: string;
    erro?: string;
    modelo?: string;
    tentativa?: number;
    arquivos?: string[];
  },
) {
  if (!dados.execucaoId) return;
  const agora = new Date().toISOString();
  try {
    await db.from("etapas_construcao").upsert(
      {
        execucao_id: dados.execucaoId,
        user_id: dados.userId,
        etapa: dados.etapa,
        estado: dados.estado,
        entrada_resumo: dados.entrada?.slice(0, 4000),
        resultado_resumo: dados.resultado?.slice(0, 4000),
        erro: dados.erro?.slice(0, 2000),
        modelo: dados.modelo,
        tentativa: dados.tentativa ?? 1,
        arquivos_produzidos: dados.arquivos ?? [],
        concluida_em: ["concluida", "bloqueada", "falhou"].includes(dados.estado) ? agora : null,
      },
      { onConflict: "execucao_id,etapa,tentativa" },
    );
    await db
      .from("execucoes_construcao")
      .update({
        etapa_atual: dados.etapa,
        tentativa: dados.tentativa ?? 1,
        ultimo_erro: dados.erro ?? null,
      })
      .eq("id", dados.execucaoId);
  } catch {
    // preserva fluxo de execução
  }
}

export async function finalizarExecucao(
  db: Db,
  dados: {
    execucaoId: string;
    userId: string;
    ok: boolean;
    modelos: string[];
    arquivos: string[];
    resumo: string;
  },
) {
  if (!dados.execucaoId) return;
  const etapaFinal: Parameters<typeof registrarEtapa>[1] = {
    execucaoId: dados.execucaoId,
    userId: dados.userId,
    etapa: "entrega",
    estado: dados.ok ? "concluida" : "bloqueada",
    arquivos: dados.arquivos,
  };
  if (dados.ok) etapaFinal.resultado = dados.resumo;
  else etapaFinal.erro = dados.resumo;

  await registrarEtapa(db, etapaFinal).catch(() => {});
  try {
    await db
      .from("execucoes_construcao")
      .update({
        estado: dados.ok ? "concluida" : "bloqueada",
        etapa_atual: "entrega",
        modelos_usados: [...new Set(dados.modelos)],
        ultimo_erro: dados.ok ? null : dados.resumo.slice(0, 2000),
        provas: { arquivos_salvos: dados.ok ? dados.arquivos : [], entrega_verificada: dados.ok },
        concluida_em: new Date().toISOString(),
      })
      .eq("id", dados.execucaoId);
  } catch {
    // preserva fluxo de execução
  }
}

/**
 * Processa a resposta da IA com o motor OpenManus ReAct:
 * Extrai raciocínio (Thought), tool calls de escrita de arquivos e limpa o texto para exibição.
 */
export async function processarRespostaOpenManus(
  respostaIA: string,
  vfs: Record<string, string>,
  stepIndex = 1,
) {
  const passo = await openManusAgent.executarPassoReAct(stepIndex, respostaIA, vfs);
  const parsed = openManusAgent.parseAgentResponse(respostaIA);
  return {
    passo,
    arquivosExtraidos: parsed.arquivosCompletos,
    textoFormatado: parsed.respostaFinal,
    pensamento: parsed.thought,
    totalFerramentas: passo.toolCalls?.length ?? 0,
  };
}

export function obterInstrucoesOpenManus(): string {
  return openManusAgent.gerarPromptInstrucoesOpenManus();
}
