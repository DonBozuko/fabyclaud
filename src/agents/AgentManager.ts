import type { AgentConfig } from "./types";
import { DirectoryReader } from "./DirectoryReader";
import { CodeModifier } from "./CodeModifier";

export class AgentManager {
  private directoryReader: DirectoryReader;
  private codeModifier: CodeModifier;
  private agents: Map<string, AgentConfig>;

  constructor() {
    this.directoryReader = new DirectoryReader();
    this.codeModifier = new CodeModifier();
    this.agents = new Map();

    // Registra agentes padrão do sistema
    this.registerAgent({
      id: "arquiteto",
      name: "Agente Arquiteto",
      description: "Planeja a estrutura de arquivos, rotas e componentes.",
      status: "ativo",
    });

    this.registerAgent({
      id: "desenvolvedor",
      name: "Agente Desenvolvedor",
      description: "Gera e refatora código fonte React, Vite e TypeScript.",
      status: "ativo",
    });

    this.registerAgent({
      id: "auditor",
      name: "Agente Auditor",
      description: "Verifica erros, segurança e integridade do código.",
      status: "ativo",
    });
  }

  public registerAgent(config: AgentConfig): void {
    this.agents.set(config.id, config);
  }

  public getAgent(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  public listAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  public getReader(): DirectoryReader {
    return this.directoryReader;
  }

  public getModifier(): CodeModifier {
    return this.codeModifier;
  }
}

export default AgentManager;
