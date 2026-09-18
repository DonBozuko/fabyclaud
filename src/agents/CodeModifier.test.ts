import { describe, expect, it } from "bun:test";
import { CodeModifier } from "./CodeModifier";
import { extrairArquivos, extrairModificacoesPatches } from "@/lib/faby/builder.server";

describe("CodeModifier e Sistema de Patches Cirúrgicos", () => {
  const modifier = new CodeModifier();

  it("deve aplicar substituição cirúrgica em texto existente", () => {
    const original = `
function saudar(nome) {
  return "Ola, " + nome;
}
`;
    const patch = [
      {
        de: 'return "Ola, " + nome;',
        para: 'return `Olá, ${nome}! Seja bem-vindo ao sistema.`;',
      },
    ];

    const resultado = modifier.aplicarPatchEmTexto(original, patch);
    expect(resultado.sucessos).toBe(1);
    expect(resultado.falhas).toBe(0);
    expect(resultado.conteudo).toContain("Seja bem-vindo ao sistema.");
  });

  it("deve extrair e aplicar patches cirúrgicos com tags <modificar>", () => {
    const respostaIA = `
Aqui está a alteração solicitada na rota de backend:

<modificar arquivo="server.js">
<substituir>
<de>
app.get('/api/status', (req, res) => res.send('ok'));
</de>
<para>
app.get('/api/status', (req, res) => res.json({ status: 'online', versao: '2.0.0' }));
</para>
</substituir>
</modificar>
`;

    const arquivosBase = {
      "server.js": `
const express = require('express');
const app = express();
app.get('/api/status', (req, res) => res.send('ok'));
app.listen(3000);
`,
    };

    const extraido = extrairArquivos(respostaIA, arquivosBase);
    expect(extraido.arquivos["server.js"]).toBeDefined();
    expect(extraido.arquivos["server.js"]).toContain("versao: '2.0.0'");
    expect(extraido.arquivos["server.js"]).toContain("app.listen(3000);");
  });

  it("deve aplicar alteração mista (arquivos novos + patches) sem perder o restante do projeto", () => {
    const arquivosAtuais = {
      "index.html": "<html><body><h1>App</h1></body></html>",
      "style.css": "body { margin: 0; }",
    };

    const alteracao = {
      arquivosNovosOuCompletos: {
        "api/auth.js": "export function login() { return true; }",
      },
      patches: [
        {
          caminho: "index.html",
          chunks: [
            {
              de: "<h1>App</h1>",
              para: "<h1>App Fullstack</h1><button id='btnLogin'>Entrar</button>",
            },
          ],
        },
      ],
      arquivosRemovidos: [],
    };

    const res = modifier.aplicarAlteracaoProjeto(arquivosAtuais, alteracao);
    expect(res.arquivos["style.css"]).toBe("body { margin: 0; }"); // Preservado intacto
    expect(res.arquivos["api/auth.js"]).toBe("export function login() { return true; }"); // Criado novo
    expect(res.arquivos["index.html"]).toContain("App Fullstack"); // Modificado cirurgicamente
  });
});
