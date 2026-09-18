export type AgentStatus = "ativo" | "inativo" | "ocupado" | "erro";

export type AgentRole = "arquiteto" | "programador" | "revisor" | "seguranca" | "auditor";

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
