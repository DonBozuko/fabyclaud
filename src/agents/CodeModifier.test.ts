import { describe, expect, it } from "bun:test";
import { CodeModifier } from "./CodeModifier";
import { DirectoryReader } from "./DirectoryReader";
import { extrairArquivos } from "@/lib/faby/builder.server";
import { injetarSnapshotVFS } from "@/lib/faby/orquestracao.server";

describe("CodeModifier - Motor de Arquivos 100% Completos e Stateful VFS", () => {
  const modifier = new CodeModifier();
  const reader = new DirectoryReader();

  it("deve extrair arquivo 100% completo com tag <arquivo nome=...>", () => {
    const respostaIA = `
Aqui está o componente atualizado com novos campos:

<arquivo nome="src/components/UserList.tsx">
import React from "react";

export function UserList() {
  return <div>Lista de Usuários Atualizada</div>;
}
</arquivo>
`;
    const extraido = modifier.extrairArquivosCompletos(respostaIA);
    expect(extraido["src/components/UserList.tsx"]).toBeDefined();
    expect(extraido["src/components/UserList.tsx"]).toContain("Lista de Usuários Atualizada");
  });

  it("deve extrair múltiplos arquivos 100% completos com tags <file path=...>", () => {
    const respostaIA = `
<file path="src/data/mockUsers.ts">
export const mockUsers = [{ id: 1, name: "Alice" }];
</file>

<file path="src/App.tsx">
import { mockUsers } from "./data/mockUsers";
export function App() { return <h1>{mockUsers[0].name}</h1>; }
</file>
`;
    const extraido = modifier.extrairArquivosCompletos(respostaIA);
    expect(extraido["src/data/mockUsers.ts"]).toContain("mockUsers");
    expect(extraido["src/App.tsx"]).toContain("mockUsers[0].name");
  });

  it("deve extrair arquivos completos a partir de JSON estruturado", () => {
    const respostaJson = `
\`\`\`json
{
  "files": [
    {
      "path": "src/types/client.ts",
      "content": "export interface Client { id: string; phone: string; }"
    }
  ]
}
\`\`\`
`;
    const extraido = modifier.extrairArquivosCompletos(respostaJson);
    expect(extraido["src/types/client.ts"]).toBeDefined();
    expect(extraido["src/types/client.ts"]).toContain("phone: string;");
  });

  it("deve substituir integralmente o arquivo no VFS sem deixar resíduos", () => {
    const arquivosAtuais = {
      "src/App.tsx": "function OldApp() { return null; }",
      "src/index.css": "body { margin: 0; }",
    };

    const novos = {
      "src/App.tsx": "export function App() { return <h1>Nova Versão</h1>; }",
    };

    const atualizados = modifier.aplicarArquivosCompletos(arquivosAtuais, novos);
    expect(atualizados["src/App.tsx"]).toBe(
      "export function App() { return <h1>Nova Versão</h1>; }",
    );
    expect(atualizados["src/index.css"]).toBe("body { margin: 0; }");
  });

  it("deve gerar árvore estruturada e Snapshot XML com o DirectoryReader", () => {
    const arquivos = {
      "src/components/Header.tsx": "export const Header = () => <header />;",
      "src/data/db.ts": "export const db = {};",
      "src/App.tsx": "export const App = () => <div />;",
    };

    const arvore = reader.gerarArvoreTexto(arquivos);
    expect(arvore).toContain("src/");
    expect(arvore).toContain("components/");
    expect(arvore).toContain("Header.tsx");

    const xml = reader.gerarSnapshotXml(arquivos);
    expect(xml).toContain("<project_vfs>");
    expect(xml).toContain('<file path="src/components/Header.tsx">');
    expect(xml).toContain('<file path="src/data/db.ts">');
    expect(xml).toContain("</project_vfs>");
  });

  it("deve injetar Stateful VFS Snapshot no prompt através da orquestração", () => {
    const promptBase = "Você é uma IA de desenvolvimento.";
    const arquivos = {
      "src/main.ts": "console.log('iniciado');",
    };

    const promptInjetado = injetarSnapshotVFS(promptBase, arquivos);
    expect(promptInjetado).toContain("STATEFUL VFS SNAPSHOT");
    expect(promptInjetado).toContain('<file path="src/main.ts">');
    expect(promptInjetado).toContain("console.log('iniciado');");
  });
});
