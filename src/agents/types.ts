export type AgentStatus = "ativo" | "inativo" | "ocupado" | "erro";

export type AgentRole = "arquiteto" | "programador" | "revisor" | "seguranca" | "auditor" | "engenheiro-autonomo";

export interface AgentConfig {
  id: string;
  name: string;
  role?: AgentRole;
  description: string;
  status: AgentStatus;
  capacidades?: string[];
}

export interface AgentTask {
  id: string;
  tipo: string;
  descricao: string;
  origem?: string;
  projetoId?: string;
}

export interface AgentResult {
  sucesso: boolean;
  agenteId: string;
  mensagem: string;
  dados?: unknown;
}

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNode[];
};

export type CodeEdit = {
  filePath: string;
  content: string;
  originalContent?: string;
};

/**
 * Alteração do projeto: SOMENTE escrita destrutiva completa.
 * Patches parciais/regex foram removidos do motor de propósito.
 */
export interface AlteracaoProjeto {
  arquivosNovosOuCompletos: Record<string, string>;
  arquivosRemovidos: string[];
  resumoAlteracoes?: string;
}

export interface ModificacaoArquivo {
  caminho: string;
  novoConteudo: string;
  acao: "criar" | "atualizar" | "remover";
}

export interface ArquivoItem {
  caminho: string;
  conteudo: string;
  tamanho: number;
}

export interface VFSSnapshot {
  totalArquivos: number;
  tamanhoTotal: number;
  arvoreTexto: string;
  arvoreNodos: FileNode[];
  arquivos: Record<string, string>;
  snapshotXml: string;
}

export interface ArquivoCompleto {
  caminho: string;
  conteudo: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export interface ToolCall {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  tool: string;
  success: boolean;
  output: string;
  data?: unknown;
}

export interface ReActStep {
  stepIndex: number;
  thought: string;
  toolCalls?: ToolCall[];
  observations?: ToolResult[];
  timestamp: string;
}

export interface ManusPlanItem {
  id: string;
  titulo: string;
  status: "pendente" | "em_andamento" | "concluido" | "falhou";
  detalhes?: string;
}

export interface ManusPlan {
  metaPrincipal: string;
  itens: ManusPlanItem[];
}

export interface ManusExecutionState {
  projetoId: string;
  pedido: string;
  passos: ReActStep[];
  plano?: ManusPlan;
  arquivosVFS: Record<string, string>;
  ferramentasUsadas: string[];
  concluido: boolean;
  respostaFinal?: string;
}
