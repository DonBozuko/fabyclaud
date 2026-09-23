import type { AgentConfig, AgentResult, AgentTask } from "./types";
import { DirectoryReader } from "./DirectoryReader";
import { CodeModifier } from "./CodeModifier";

export class AgentManager {
  private agentes: Map<string, AgentConfig> = new Map();
  private directoryReader: DirectoryReader;
  private codeModifier: CodeModifier;

  constructor() {
    this.directoryReader = new DirectoryReader();
    this.codeModifier = new CodeModifier();
    this.inicializarAgentesPadrao();
  }

  private inicializarAgentesPadrao() {
    const defaultAgents: AgentConfig[] = [
      {
        id: "antigravity",
        name: "Antigravity-IA",
        role: "engenheiro-autonomo",
        description:
          "Agente autônomo sênior de engenharia: Entender -> Investigar -> Planejar -> Implementar -> Testar -> Auditar -> Corrigir -> Validar",
        status: "ativo",
        capacidades: [
          "root-cause-analysis",
          "autonomous-loop",
          "vfs-management",
          "preservation-audit",
          "fullstack-engineering",
        ],
      },
      {
        id: "arquiteto",
        name: "Arquiteto-IA",
        role: "arquiteto",
        description: "Planejador de rotas e estrutura de dados",
        status: "ativo",
        capacidades: ["analise-estrutura", "planejamento-rotas", "arquitetura-db"],
      },
      {
        id: "programador",
        name: "Programador-IA",
        role: "programador",
        description: "Desenvolvedor Fullstack e criador de código",
        status: "ativo",
        capacidades: ["geracao-codigo", "integracao-api", "refatoracao"],
      },
      {
        id: "revisor",
        name: "Revisor-IA",
        role: "revisor",
        description: "Auditor de código e validação de sintaxe",
        status: "ativo",
        capacidades: ["auditoria-codigo", "deteccao-bugs", "otimizacao"],
      },
      {
        id: "seguranca",
        name: "Segurança-IA",
        role: "seguranca",
        description: "Auditor de conformidade e chaves BYOK",
        status: "ativo",
        capacidades: ["analise-vulnerabilidades", "protecao-chaves", "sanitizacao"],
      },
    ];

    for (const agente of defaultAgents) {
      this.agentes.set(agente.id, agente);
    }
  }

  public registerAgent(config: AgentConfig): void {
    this.agentes.set(config.id, config);
  }

  public getAgent(id: string): AgentConfig | undefined {
    return this.agentes.get(id);
  }

  public listAgents(): AgentConfig[] {
    return Array.from(this.agentes.values());
  }

  public listarAgentes(): AgentConfig[] {
    return Array.from(this.agentes.values());
  }

  public obterAgente(id: string): AgentConfig | undefined {
    return this.agentes.get(id);
  }

  public atualizarStatus(id: string, status: AgentConfig["status"]): boolean {
    const agente = this.agentes.get(id);
    if (!agente) return false;
    agente.status = status;
    return true;
  }

  public async executarTarefa(task: AgentTask): Promise<AgentResult> {
    console.log(`[AgentManager] Executando tarefa ${task.id} (${task.tipo}): ${task.descricao}`);
    return {
      sucesso: true,
      agenteId: "orquestrador",
      mensagem: `Tarefa ${task.tipo} executada com sucesso.`,
      dados: { taskId: task.id, timestamp: new Date().toISOString() },
    };
  }

  public getReader(): DirectoryReader {
    return this.directoryReader;
  }

  public getModifier(): CodeModifier {
    return this.codeModifier;
  }
}

export default AgentManager;
