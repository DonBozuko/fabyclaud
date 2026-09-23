import assert from "node:assert/strict";
import { describe, test } from "node:test";

process.env["FABY_STORAGE_TEST_MODE"] = "true";
import {
  salvarProjetoArmazenado,
  obterProjetoArmazenado,
  listarProjetosArmazenados,
  apagarProjetoArmazenado,
  salvarMensagemArmazenada,
  listarMensagensArmazenadas,
  salvarChaveArmazenada,
  obterChavesArmazenadas,
} from "./storage.server";
import { extrairArquivos, resolverPedidoContextual, classificarPedido } from "./builder.server";

describe("Persistência e Continuidade FabyClaud (Estilo Lovable)", () => {
  const testUserId = "user-test-" + Date.now();
  const testProjectId = "proj-test-" + Date.now();

  test("1. Gravação e recuperação de chaves de IA sem amnésia", () => {
    salvarChaveArmazenada({
      user_id: testUserId,
      provider: "google",
      api_key: "AIzaSyTestKey12345678",
      api_url: null,
      testada_ok: true,
      testada_em: new Date().toISOString(),
      ultimo_erro: null,
    });

    const chaves = obterChavesArmazenadas([testUserId]);
    const chaveGoogle = chaves.find((c) => c.provider === "google");
    assert.ok(chaveGoogle, "Chave Google deve existir");
    assert.equal(chaveGoogle?.api_key, "AIzaSyTestKey12345678");
    assert.equal(chaveGoogle?.testada_ok, true);
  });

  test("2. Criação de projeto e persistência instantânea em disco", () => {
    salvarProjetoArmazenado({
      id: testProjectId,
      user_id: testUserId,
      nome: "Calculadora Moderna",
      modelo: "google",
      arquivos: {
        "index.html": "<!DOCTYPE html><html><body><div id='app'>Calculadora</div></body></html>",
        "styles.css": "body { background: #000; color: #fff; }",
        "app.js": "console.log('iniciado');",
      },
      notas: "Versão inicial criada",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const projeto = obterProjetoArmazenado(testProjectId, [testUserId]);
    assert.ok(projeto, "Projeto deve ser encontrado");
    assert.equal(projeto?.nome, "Calculadora Moderna");
    assert.equal(Object.keys(projeto?.arquivos || {}).length, 3);
    assert.ok(projeto?.arquivos["index.html"]);

    const lista = listarProjetosArmazenados([testUserId]);
    assert.ok(
      lista.some((p) => p.id === testProjectId),
      "Projeto deve constar na lista",
    );
  });

  test("3. Multi-turn chat (continuidade sem amnésia entre turnos)", () => {
    // Turno 1: Usuário pede a calculadora
    const msg1User = {
      id: "msg-1-user",
      projeto_id: testProjectId,
      user_id: testUserId,
      role: "user" as const,
      conteudo: "crie uma calculadora",
      modelo: "google",
      ok: true,
      anexos: [],
      created_at: "2026-09-20T12:00:00.000Z",
    };
    salvarMensagemArmazenada(msg1User);

    const msg1Assistant = {
      id: "msg-1-assistant",
      projeto_id: testProjectId,
      user_id: testUserId,
      role: "assistant" as const,
      conteudo: "✨ Criei a calculadora com tema escuro e botões interativos.",
      modelo: "google",
      ok: true,
      anexos: [],
      created_at: "2026-09-20T12:00:05.000Z",
    };
    salvarMensagemArmazenada(msg1Assistant);

    // Turno 2: Usuário pede alteração ("mude o fundo para azul")
    const msg2User = {
      id: "msg-2-user",
      projeto_id: testProjectId,
      user_id: testUserId,
      role: "user" as const,
      conteudo: "agora mude o fundo para azul",
      modelo: "google",
      ok: true,
      anexos: [],
      created_at: "2026-09-20T12:01:00.000Z",
    };
    salvarMensagemArmazenada(msg2User);

    // Verifica que o histórico mantém todas as mensagens na ordem cronológica correta
    const mensagens = listarMensagensArmazenadas(testProjectId);
    assert.equal(mensagens.length, 3);
    assert.equal(mensagens[0]?.id, "msg-1-user");
    assert.equal(mensagens[1]?.id, "msg-1-assistant");
    assert.equal(mensagens[2]?.id, "msg-2-user");
  });

  test("4. Resolução contextual de comandos de continuação", () => {
    const historico = [
      { role: "user" as const, conteudo: "crie um app de notas" },
      {
        role: "assistant" as const,
        conteudo: "Posso adicionar login com senha? Deseja que eu aplique?",
      },
    ];

    const ctxSim = resolverPedidoContextual("sim, por favor", historico);
    assert.equal(ctxSim.intencao, "alterar");
    assert.equal(ctxSim.continuacao, true);

    const ctxMudeCor = resolverPedidoContextual(
      "agora mude a cor do cabeçalho para verde",
      historico,
    );
    assert.equal(ctxMudeCor.intencao, "alterar");

    const intencaoAlterar = classificarPedido("troque o fundo para preto");
    assert.equal(intencaoAlterar, "alterar");
  });

  test("5. Extração e preservação completa de arquivos (100% integridade)", () => {
    const respostaIA = `
Com certeza! Atualizei o arquivo com o fundo azul conforme solicitado:

<arquivo nome="styles.css">
body {
  background: #1e3a8a;
  color: #ffffff;
}
</arquivo>
    `;

    const extraido = extrairArquivos(respostaIA);
    assert.ok(extraido.arquivos["styles.css"]);
    assert.match(extraido.arquivos["styles.css"], /#1e3a8a/);

    // Simula mesclagem no projeto
    const projeto = obterProjetoArmazenado(testProjectId);
    assert.ok(projeto);
    const novosArquivos = {
      ...projeto!.arquivos,
      ...extraido.arquivos,
    };

    salvarProjetoArmazenado({
      ...projeto!,
      arquivos: novosArquivos,
    });

    const projetoAtualizado = obterProjetoArmazenado(testProjectId);
    assert.equal(projetoAtualizado?.arquivos["styles.css"], extraido.arquivos["styles.css"]);
    assert.ok(projetoAtualizado?.arquivos["index.html"], "Outros arquivos devem ser preservados");
  });

  test("6. Limpeza do projeto de teste", () => {
    apagarProjetoArmazenado(testProjectId);
    const projeto = obterProjetoArmazenado(testProjectId);
    assert.equal(projeto, null);
    const msgs = listarMensagensArmazenadas(testProjectId);
    assert.equal(msgs.length, 0);
  });

  test("7. Múltiplos projetos coexistem sem se sobrescrever ou perder", () => {
    const projA = "proj-multi-a-" + Date.now();
    const projB = "proj-multi-b-" + Date.now();

    salvarProjetoArmazenado({
      id: projA,
      user_id: testUserId,
      nome: "Calculadora",
      modelo: "google",
      arquivos: { "index.html": "<h1>Calculadora</h1>" },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    salvarProjetoArmazenado({
      id: projB,
      user_id: "local-user-diff-" + Date.now(),
      nome: "Jogo da Velha",
      modelo: "google",
      arquivos: { "index.html": "<h1>Jogo</h1>" },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const todos = listarProjetosArmazenados([testUserId]);
    assert.ok(todos.some((p) => p.id === projA), "Projeto A deve constar");
    assert.ok(todos.some((p) => p.id === projB), "Projeto B deve constar");

    // Exclusão de A não afeta B
    apagarProjetoArmazenado(projA);
    const posDelete = listarProjetosArmazenados([testUserId]);
    assert.ok(!posDelete.some((p) => p.id === projA), "Projeto A foi apagado");
    assert.ok(posDelete.some((p) => p.id === projB), "Projeto B continua intacto");

    // Limpeza
    apagarProjetoArmazenado(projB);
  });
});
