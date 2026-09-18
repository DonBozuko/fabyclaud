export type AgentStatus = 'ativo' | 'inativo' | 'ocupado' | 'erro';

export type AgentRole = 'arquiteto' | 'programador' | 'revisor' | 'seguranca';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  status: AgentStatus;
  capacidades: string[];
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
