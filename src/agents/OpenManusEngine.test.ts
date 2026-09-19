import { describe, expect, test } from "bun:test";
import { OpenManusToolRegistry, OpenManusReActAgent } from "./OpenManusEngine";

describe("OpenManus Engine - Autonomous ReAct Loop & Tool Registry", () => {
  test("deve listar ferramentas disponíveis com esquemas de parâmetros", () => {
    const registry = new OpenManusToolRegistry();
    const tools = registry.getToolDefinitions();

    expect(tools.length).toBeGreaterThanOrEqual(5);
    expect(tools.some((t) => t.name === "vfs_read_file")).toBe(true);
    expect(tools.some((t) => t.name === "vfs_write_file")).toBe(true);
    expect(tools.some((t) => t.name === "vfs_list_files")).toBe(true);
    expect(tools.some((t) => t.name === "create_plan")).toBe(true);
  });

  test("deve executar operações VFS via Tool Registry", async () => {
    const registry = new OpenManusToolRegistry();
    const vfs: Record<string, string> = {
      "index.html": "<!DOCTYPE html><html><body><h1>Olá</h1></body></html>",
    };

    // 1. Leitura
    const resRead = await registry.executeTool(
      { id: "c1", tool: "vfs_read_file", arguments: { path: "index.html" } },
      vfs,
    );
    expect(resRead.success).toBe(true);
    expect(resRead.output).toContain("<h1>Olá</h1>");

    // 2. Escrita
    const resWrite = await registry.executeTool(
      { id: "c2", tool: "vfs_write_file", arguments: { path: "style.css", content: "body { background: #000; }" } },
      vfs,
    );
    expect(resWrite.success).toBe(true);
    expect(vfs["style.css"]).toBe("body { background: #000; }");

    // 3. Listagem
    const resList = await registry.executeTool(
      { id: "c3", tool: "vfs_list_files", arguments: {} },
      vfs,
    );
    expect(resList.success).toBe(true);
    expect(resList.output).toContain("index.html");
    expect(resList.output).toContain("style.css");

    // 4. Deleção
    const resDel = await registry.executeTool(
      { id: "c4", tool: "vfs_delete_file", arguments: { path: "style.css" } },
      vfs,
    );
    expect(resDel.success).toBe(true);
    expect(vfs["style.css"]).toBeUndefined();
  });

  test("deve estruturar plano de execução com create_plan", async () => {
    const registry = new OpenManusToolRegistry();
    const vfs: Record<string, string> = {};

    const resPlan = await registry.executeTool(
      {
        id: "plan_1",
        tool: "create_plan",
        arguments: {
          goal: "Criar clone do Orkut nostálgico",
          steps: [
            "Estruturar cabeçalho e abas azul e cinza",
            "Criar mural de recados interativo",
            "Integrar dados com persistência",
          ],
        },
      },
      vfs,
    );

    expect(resPlan.success).toBe(true);
    const data = resPlan.data as { metaPrincipal: string; itens: any[] };
    expect(data.metaPrincipal).toBe("Criar clone do Orkut nostálgico");
    expect(data.itens.length).toBe(3);
    expect(data.itens[0].status).toBe("em_andamento");
    expect(data.itens[1].status).toBe("pendente");
  });

  test("deve processar resposta ReAct com Thought, Tool Calls e tags de arquivo", async () => {
    const agent = new OpenManusReActAgent();
    const vfs: Record<string, string> = {};

    const respostaMock = `
<thought>
O usuário solicitou uma interface nostálgica. Preciso criar o index.html com as abas e o app.js com a lógica.
</thought>

<arquivo nome="index.html">
<!DOCTYPE html>
<html lang="pt-br">
<head><title>Orkut</title></head>
<body><nav><a>Início</a><a>Recados</a></nav></body>
</html>
</arquivo>

<arquivo nome="app.js">
console.log("Orkut iniciado");
</arquivo>
`.trim();

    const passo = await agent.executarPassoReAct(1, respostaMock, vfs);

    expect(passo.thought).toContain("O usuário solicitou uma interface nostálgica");
    expect(passo.toolCalls?.length).toBe(2);
    expect(vfs["index.html"]).toContain("<title>Orkut</title>");
    expect(vfs["app.js"]).toContain("Orkut iniciado");
  });

  test("deve gerar prompt com protocolo OpenManus ReAct", () => {
    const agent = new OpenManusReActAgent();
    const prompt = agent.gerarPromptInstrucoesOpenManus();

    expect(prompt).toContain("OPENMANUS REACT AGENT PROTOCOL");
    expect(prompt).toContain("vfs_read_file");
    expect(prompt).toContain("vfs_write_file");
    expect(prompt).toContain("<arquivo nome=");
  });
});
