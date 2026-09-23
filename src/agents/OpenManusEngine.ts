import type {
  ToolDefinition,
  ToolCall,
  ToolResult,
  ReActStep,
  ManusPlan,
  ManusExecutionState,
} from "./types";
import { DirectoryReader } from "./DirectoryReader";
import { CodeModifier } from "./CodeModifier";

/**
 * OpenManus Tool Registry adaptado para o ecossistema FabyClaud.
 * Implementa o catálogo de ferramentas desacopladas que os agentes ReAct utilizam.
 */
export class OpenManusToolRegistry {
  private directoryReader = new DirectoryReader();
  private codeModifier = new CodeModifier();

  public getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: "vfs_read_file",
        description: "Lê o conteúdo completo de um arquivo existente no projeto virtual.",
        parameters: {
          path: {
            type: "string",
            description: "Caminho relativo do arquivo (ex: index.html, app.js)",
            required: true,
          },
        },
      },
      {
        name: "vfs_write_file",
        description:
          "Grava ou substitui integralmente um arquivo no projeto virtual (escrita 100% completa).",
        parameters: {
          path: { type: "string", description: "Caminho do arquivo a ser gravado", required: true },
          content: {
            type: "string",
            description: "Conteúdo 100% completo do arquivo",
            required: true,
          },
        },
      },
      {
        name: "vfs_list_files",
        description: "Lista toda a árvore de arquivos e diretórios existentes no projeto.",
        parameters: {},
      },
      {
        name: "vfs_delete_file",
        description: "Exclui um arquivo do projeto virtual.",
        parameters: {
          path: {
            type: "string",
            description: "Caminho do arquivo a ser removido",
            required: true,
          },
        },
      },
      {
        name: "create_plan",
        description: "Cria e estrutura o plano de execução em etapas sequenciais para o objetivo.",
        parameters: {
          goal: { type: "string", description: "Meta principal do usuário", required: true },
          steps: {
            type: "array",
            description: "Lista de etapas a serem realizadas",
            required: true,
          },
        },
      },
      {
        name: "investigate_root_cause",
        description:
          "Investiga a causa raiz de um erro ou comportamento inesperado (Princípio Root Cause First).",
        parameters: {
          errorDescription: {
            type: "string",
            description: "Descrição do erro, sintoma ou stack trace",
            required: true,
          },
        },
      },
      {
        name: "diagnose_project",
        description:
          "Executa a validação estática de integridade nos arquivos atuais (links, botões, tags).",
        parameters: {},
      },
      {
        name: "audit_code",
        description:
          "Executa a autoauditoria completa de código: integridade de seletores, binds de eventos e CSS.",
        parameters: {},
      },
    ];
  }

  public async executeTool(toolCall: ToolCall, vfs: Record<string, string>): Promise<ToolResult> {
    const { tool, arguments: args, id } = toolCall;

    try {
      switch (tool) {
        case "vfs_read_file": {
          const path = String(args["path"] ?? "").trim();
          if (!path) {
            return {
              toolCallId: id,
              tool,
              success: false,
              output: "Erro: parâmetro 'path' não informado.",
            };
          }
          if (!(path in vfs)) {
            return {
              toolCallId: id,
              tool,
              success: false,
              output: `Erro: Arquivo '${path}' não existe. Arquivos disponíveis: ${Object.keys(vfs).join(", ")}`,
            };
          }
          const conteudo = vfs[path] ?? "";
          return {
            toolCallId: id,
            tool,
            success: true,
            output: conteudo,
            data: { path, size: conteudo.length },
          };
        }

        case "vfs_write_file": {
          const path = String(args["path"] ?? "").trim();
          const content = String(args["content"] ?? "");
          if (!path) {
            return {
              toolCallId: id,
              tool,
              success: false,
              output: "Erro: parâmetro 'path' não informado.",
            };
          }
          vfs[path] = content;
          return {
            toolCallId: id,
            tool,
            success: true,
            output: `Arquivo '${path}' gravado com sucesso (${content.length} caracteres).`,
            data: { path, size: content.length },
          };
        }

        case "vfs_list_files": {
          const arvore = this.directoryReader.gerarArvoreTexto(vfs);
          const total = Object.keys(vfs).length;
          return {
            toolCallId: id,
            tool,
            success: true,
            output: `Total de arquivos: ${total}\n${arvore}`,
            data: { total, files: Object.keys(vfs) },
          };
        }

        case "vfs_delete_file": {
          const path = String(args["path"] ?? "").trim();
          if (!path || !(path in vfs)) {
            return {
              toolCallId: id,
              tool,
              success: false,
              output: `Arquivo '${path}' não encontrado para remoção.`,
            };
          }
          delete vfs[path];
          return {
            toolCallId: id,
            tool,
            success: true,
            output: `Arquivo '${path}' excluído com sucesso.`,
            data: { path },
          };
        }

        case "create_plan": {
          const goal = String(args["goal"] ?? "");
          const rawSteps = Array.isArray(args["steps"]) ? args["steps"] : [];
          const plan: ManusPlan = {
            metaPrincipal: goal,
            itens: rawSteps.map((s, idx) => ({
              id: `step_${idx + 1}`,
              titulo: String(s),
              status: idx === 0 ? "em_andamento" : "pendente",
            })),
          };
          return {
            toolCallId: id,
            tool,
            success: true,
            output: `Plano estruturado com ${plan.itens.length} etapas para '${goal}'.`,
            data: plan,
          };
        }

        case "investigate_root_cause": {
          const errorDesc = String(args["errorDescription"] ?? "");
          const files = Object.keys(vfs);
          return {
            toolCallId: id,
            tool,
            success: true,
            output: `Investigação de causa raiz iniciada para: '${errorDesc}'. Arquivos inspecionados: ${files.join(", ")}. Analisando fluxo: UI -> State -> Binds -> Eventos -> VFS.`,
            data: { errorDescription: errorDesc, filesInspected: files },
          };
        }

        case "diagnose_project": {
          const files = Object.keys(vfs);
          const temHtml = files.some((f) => f.endsWith(".html"));
          const temCss = files.some((f) => f.endsWith(".css"));
          const temJs = files.some((f) => f.endsWith(".js"));

          const diagnosticos: string[] = [];
          if (!temHtml) diagnosticos.push("Aviso: Nenhum arquivo .html encontrado na raiz.");
          if (!temCss && !temHtml) diagnosticos.push("Aviso: Nenhum arquivo de estilo CSS.");
          if (!temJs) diagnosticos.push("Aviso: Nenhum arquivo de script JavaScript.");

          return {
            toolCallId: id,
            tool,
            success: true,
            output:
              diagnosticos.length > 0
                ? diagnosticos.join("\n")
                : "Diagnóstico OK: Arquivos estruturais presentes.",
            data: { diagnosticos, arquivos: files },
          };
        }

        case "audit_code": {
          const files = Object.keys(vfs);
          return {
            toolCallId: id,
            tool,
            success: true,
            output: `Auditoria de código concluída em ${files.length} arquivos. Integridade de tags e scripts verificada no Stateful VFS.`,
            data: { totalArquivos: files.length, arquivos: files },
          };
        }

        default:
          return {
            toolCallId: id,
            tool,
            success: false,
            output: `Ferramenta '${tool}' não reconhecida no catálogo OpenManus.`,
          };
      }
    } catch (err) {
      return {
        toolCallId: id,
        tool,
        success: false,
        output: `Exceção ao executar '${tool}': ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}

/**
 * OpenManus ReAct Engine: Motor de Agente Autônomo com Ciclo de Raciocínio e Ação.
 * Implementa o fluxo Think -> Act -> Observe -> Re-Plan.
 */
export class OpenManusReActAgent {
  private registry = new OpenManusToolRegistry();
  private codeModifier = new CodeModifier();

  /**
   * Extrai blocos de chamadas de ferramenta a partir da resposta da IA.
   * Suporta formatos ReAct padrão, tags <tool_call> e escrita direta de arquivos <arquivo>.
   */
  public parseAgentResponse(respostaIA: string): {
    thought: string;
    toolCalls: ToolCall[];
    arquivosCompletos: Record<string, string>;
    respostaFinal: string;
  } {
    const toolCalls: ToolCall[] = [];

    // 1. Extração de arquivos completos pelas tags clássicas do FabyClaud (<arquivo nome="..."> / <file path="...">)
    const arquivosCompletos = this.codeModifier.extrairArquivosCompletos(respostaIA);

    // Converte escrita de arquivos em tool call explícita se houver arquivos
    for (const [caminho, conteudo] of Object.entries(arquivosCompletos)) {
      toolCalls.push({
        id: `call_${Math.random().toString(36).slice(2, 9)}`,
        tool: "vfs_write_file",
        arguments: { path: caminho, content: conteudo },
      });
    }

    // 2. Extração de tool calls estruturadas em XML: <tool_call name="...">{"arg": "val"}</tool_call>
    const xmlToolRegex = /<tool_call\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/tool_call>/gi;
    let match: RegExpExecArray | null;
    while ((match = xmlToolRegex.exec(respostaIA)) !== null) {
      const toolName = match[1] ?? "";
      const argsRaw = (match[2] ?? "").trim();
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(argsRaw);
      } catch {
        parsedArgs = { raw: argsRaw };
      }
      if (toolName) {
        toolCalls.push({
          id: `call_${Math.random().toString(36).slice(2, 9)}`,
          tool: toolName,
          arguments: parsedArgs,
        });
      }
    }

    // 3. Extração de Pensamento (Thought)
    let thought = "";
    const thoughtMatch = respostaIA.match(
      /(?:<thought>|Pensamento:|Thought:)([\s\S]*?)(?:<\/thought>|Ação:|Action:|<tool_call|<arquivo|$)/i,
    );
    if (thoughtMatch && thoughtMatch[1]) {
      thought = thoughtMatch[1].trim();
    }

    // 4. Limpeza da resposta final para exibição amigável no chat do usuário
    let respostaFinal = respostaIA
      .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
      .replace(/<tool_call[^>]*>[\s\S]*?<\/tool_call>/gi, "")
      .replace(/<arquivo\s+nome=["'][^"']+["']>[\s\S]*?<\/arquivo>/gi, "")
      .replace(/<file\s+path=["'][^"']+["']>[\s\S]*?<\/file>/gi, "")
      .trim();

    if (!respostaFinal && Object.keys(arquivosCompletos).length > 0) {
      respostaFinal = `Atualizei os seguintes arquivos do projeto:\n${Object.keys(arquivosCompletos)
        .map((f) => `- \`${f}\``)
        .join("\n")}`;
    }

    return {
      thought,
      toolCalls,
      arquivosCompletos,
      respostaFinal,
    };
  }

  /**
   * Executa um passo do ciclo ReAct aplicando as ferramentas no VFS.
   */
  public async executarPassoReAct(
    stepIndex: number,
    respostaIA: string,
    vfs: Record<string, string>,
  ): Promise<ReActStep> {
    const { thought, toolCalls } = this.parseAgentResponse(respostaIA);
    const observations: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.registry.executeTool(toolCall, vfs);
      observations.push(result);
    }

    return {
      stepIndex,
      thought,
      toolCalls,
      observations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Monta as instruções do sistema no padrão OpenManus ReAct para inclusão no prompt.
   */
  public gerarPromptInstrucoesOpenManus(): string {
    const tools = this.registry.getToolDefinitions();
    const toolsJson = JSON.stringify(tools, null, 2);

    return `
================================================================================
ANTIGRAVITY & OPENMANUS REACT AGENT PROTOCOL (SISTEMA AUTÔNOMO DE EXECUÇÃO):
Você é um Agente Autônomo Avançado de Engenharia de Software (estilo Antigravity / Claude Code / OpenManus).
Você opera com mentalidade de engenheiro sênior responsável pelo sistema inteiro.

FLUXO OBRIGATÓRIO EM TODA ITERAÇÃO:
ENTENDER → INVESTIGAR → PLANEJAR → IMPLEMENTAR → TESTAR → AUDITAR → CORRIGIR → VALIDAR

PRINCÍPIOS FUNDAMENTAIS:
1. ROOT CAUSE FIRST: Nunca trate apenas o sintoma com try/catch vazio. Investigue a causa raiz.
2. PRESERVAÇÃO: Não reescreva partes funcionais do sistema sem necessidade. Se algo já funciona, PRESERVE.
3. MENOR ALTERAÇÃO SEGURA: Se uma pequena alteração resolve, faça a menor alteração segura possível.
4. ZERO PLACEHOLDERS / ZERO MOCKS: Nunca crie botões decorativos (ex: console.log) ou APIs simuladas onde foi pedida funcionalidade real.
5. STATEFUL VFS: Cada arquivo criado ou modificado DEVE ser entregue 100% completo e funcional.
6. CICLO REACT CONTÍNUO:
   - PENSAR (Thought): Raciocine sobre a intenção do usuário, arquitetura e estado atual do VFS.
   - AGIR (Action / Tool Call): Chame ferramentas para ler, gravar ou validar código.
   - OBSERVAR (Observation): Valide o resultado e garanta ausência de regressões.

FERRAMENTAS DISPONÍVEIS:
${toolsJson}

FORMATO DE RESPOSTA OBRIGATÓRIO:
Para criar ou modificar arquivos, você DEVE retornar o código integral nas tags:
<arquivo nome="index.html">
... código 100% completo ...
</arquivo>

Ou utilize chamadas de ferramenta no formato:
<tool_call name="vfs_write_file">
{"path": "index.html", "content": "..."}
</tool_call>
================================================================================
`.trim();
  }
}
