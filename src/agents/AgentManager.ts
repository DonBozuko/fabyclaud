import type { AgentConfig, AgentResult, AgentTask } from './types';

export class AgentManager {
  private agentes: Map<string, AgentConfig> = new Map();

  constructor() {
    this.inicializarAgentesPadrao();
  }

  private inicializarAgentesPadrao() {
    const defaultAgents: AgentConfig[] = [
      {
        id: 'arquiteto-ia',
        name: 'Arquiteto-IA',
        role: 'arquiteto',
        description: 'Planejador de rotas e estrutura de dados',
        status: 'ativo',
        capacidades: ['analise-estrutura', 'planejamento-rotas', 'arquitetura-db'],
      },
      {
        id: 'programador-ia',
        name: 'Programador-IA',
        role: 'programador',
        description: 'Desenvolvedor Fullstack e criador de código',
        status: 'ativo',
        capacidades: ['geracao-codigo', 'integracao-api', 'refatoracao'],
      },
      {
        id: 'revisor-ia',
        name: 'Revisor-IA',
        role: 'revisor',
        description: 'Auditor de código e validação de sintaxe',
        status: 'ativo',
        capacidades: ['auditoria-codigo', 'deteccao-bugs', 'otimizacao'],
      },
      {
        id: 'seguranca-ia',
        name: 'Segurança-IA',
        role: 'seguranca',
        description: 'Auditor de conformidade e chaves BYOK',
        status: 'ativo',
        capacidades: ['analise-vulnerabilidades', 'protecao-chaves', 'sanitizacao'],
      },
    ];

    for (const agente of defaultAgents) {
      this.agentes.set(agente.id, agente);
    }
  }

  public listarAgentes(): AgentConfig[] {
    return Array.from(this.agentes.values());
  }

  public obterAgente(id: string): AgentConfig | undefined {
    return this.agentes.get(id);
  }

  public atualizarStatus(id: string, status: AgentConfig['status']): boolean {
    const agente = this.agentes.get(id);
    if (!agente) return false;
    agente.status = status;
    return true;
  }

  public async executarTarefa(task: AgentTask): Promise<AgentResult> {
    console.log(`[AgentManager] Executando tarefa ${task.id} (${task.tipo}): ${task.descricao}`);
    return {
      sucesso: true,
      agenteId: 'orquestrador',
      mensagem: `Tarefa ${task.tipo} executada com sucesso.`,
      dados: { taskId: task.id, timestamp: new Date().toISOString() },
    };
  }
}

export default AgentManager;
