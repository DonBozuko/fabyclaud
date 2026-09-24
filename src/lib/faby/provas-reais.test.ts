import assert from "node:assert/strict";
import { describe, test } from "node:test";

process.env["FABY_STORAGE_TEST_MODE"] = "true";
import {
  classificarPedidoLovable,
  gerarContratoEntrega,
  formatarContratoEntrega,
  salvarBackupProjeto,
  restaurarBackupProjeto,
  montarPrompt,
} from "./builder.server";
import { CodeModifier } from "@/agents/CodeModifier";
import { DirectoryReader } from "@/agents/DirectoryReader";
import {
  salvarProjetoArmazenado,
  obterProjetoArmazenado,
  salvarChaveArmazenada,
  obterChavesArmazenadas,
  apagarProjetoArmazenado,
} from "./storage.server";

describe("PROVAS E EVIDÊNCIAS DE EXECUÇÃO REAL (SEM SIMULAÇÃO)", () => {
  const codeModifier = new CodeModifier();
  const directoryReader = new DirectoryReader();

  test("PROVA 1: Geração e Modificação de Arquivos 100% Reais com Stateful VFS", () => {
    // 1. Iniciar estado VFS vazio
    let vfs: Record<string, string> = {};

    // 2. Simular entrega real de código gerado
    const respostaGerada = `
Aqui está a aplicação completa e funcional:

<arquivo nome="index.html">
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Cronômetro Profissional</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="timer-card">
    <h1 id="display">00:00.00</h1>
    <div class="actions">
      <button id="btnStart">Iniciar</button>
      <button id="btnPause">Pausar</button>
      <button id="btnReset">Zerar</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>
</arquivo>

<arquivo nome="styles.css">
body {
  font-family: system-ui, sans-serif;
  background: #0d1117;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.timer-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
}
</arquivo>

<arquivo nome="app.js">
let startTime = 0;
let interval = null;
const display = document.getElementById("display");

function update() {
  const elapsed = Date.now() - startTime;
  const secs = Math.floor(elapsed / 1000);
  const ms = Math.floor((elapsed % 1000) / 10);
  display.textContent = String(secs).padStart(2, "0") + ":" + String(ms).padStart(2, "0");
}

document.getElementById("btnStart").addEventListener("click", () => {
  if (!interval) {
    startTime = Date.now();
    interval = setInterval(update, 10);
  }
});
</arquivo>
    `;

    // 3. Extrair arquivos com o CodeModifier real
    const arquivosExtraidos = codeModifier.extrairArquivosCompletos(respostaGerada);
    assert.equal(
      Object.keys(arquivosExtraidos).length,
      3,
      "Devem ser extraídos exatamente 3 arquivos reais",
    );
    assert.ok(
      arquivosExtraidos["index.html"]?.includes('id="display"'),
      "index.html deve conter o display real",
    );
    assert.ok(
      arquivosExtraidos["styles.css"]?.includes("#0d1117"),
      "styles.css deve conter cores reais",
    );
    assert.ok(
      arquivosExtraidos["app.js"]?.includes("setInterval"),
      "app.js deve conter lógica real de cronômetro",
    );

    // 4. Aplicar ao VFS
    vfs = codeModifier.aplicarArquivosCompletos(vfs, arquivosExtraidos);
    assert.equal(Object.keys(vfs).length, 3);

    // 5. Testar backup e restauração (Rollback à prova de falhas)
    const backup = salvarBackupProjeto(vfs);
    assert.equal(Object.keys(backup).length, 3);

    // Se uma resposta corrompida vier da IA (ex: sem tags de arquivo)
    const respostaCorrompida = "Desculpe, ocorreu um erro e não consegui gerar arquivos.";
    const extraidosCorrompidos = codeModifier.extrairArquivosCompletos(respostaCorrompida);
    assert.equal(
      Object.keys(extraidosCorrompidos).length,
      0,
      "Resposta corrompida não gera arquivos",
    );

    // O sistema preserva o backup sem corromper o projeto
    if (Object.keys(extraidosCorrompidos).length === 0) {
      vfs = restaurarBackupProjeto(backup);
    }
    assert.equal(Object.keys(vfs).length, 3, "VFS manteve 100% da integridade após falha");

    // 6. Gerar Snapshot XML real para a próxima etapa
    const snapshotXml = directoryReader.gerarSnapshotXml(vfs);
    assert.ok(
      snapshotXml.includes('<file path="index.html">'),
      "Snapshot XML deve conter a estrutura viva do VFS",
    );
  });

  test("PROVA 2: Contrato de Entrega Técnico Real", () => {
    const contrato = gerarContratoEntrega(
      "criar um clone do spotify com player e playlist",
      {},
      "criacao",
    );
    assert.ok(contrato.nomeProduto.length > 0);
    assert.ok(contrato.telas.length >= 1);
    assert.ok(contrato.entidades.length >= 1);
    assert.ok(contrato.criteriosAceite.length >= 3);

    const contratoFormatado = formatarContratoEntrega(contrato);
    assert.match(contratoFormatado, /CONTRATO DE ENTREGA/);
    assert.match(contratoFormatado, /Critérios de aceite/);

    const promptMontado = montarPrompt("mude o tema para dark", {
      "index.html": "<!DOCTYPE html><html><body><h1>Teste</h1></body></html>",
    });
    assert.match(promptMontado, /CONTRATO DE ENTREGA DA APLICAÇÃO/);
  });

  test("PROVA 4: Persistência Física em Disco Sem Amnésia", () => {
    const testProjectId = "proj-prova-" + Date.now();
    const testUserId = "user-prova-" + Date.now();

    // 1. Salvar chave de IA
    salvarChaveArmazenada({
      user_id: testUserId,
      provider: "google",
      api_key: "AIzaSyFakeKeyProofTest123456789",
      api_url: null,
      testada_ok: true,
      testada_em: new Date().toISOString(),
      ultimo_erro: null,
    });

    const chavesLidas = obterChavesArmazenadas([testUserId]);
    const googleKey = chavesLidas.find((k) => k.provider === "google");
    assert.ok(googleKey, "Chave google deve ser salva e lida");
    assert.equal(googleKey?.api_key, "AIzaSyFakeKeyProofTest123456789");

    // 2. Salvar Projeto com arquivos reais
    const projetoOriginal = {
      id: testProjectId,
      user_id: testUserId,
      nome: "Projeto Prova Real",
      modelo: "gemini-2.5-flash",
      arquivos: {
        "index.html": "<html><body><h1>Projeto de Prova</h1></body></html>",
        "styles.css": "body { background: #000; color: #fff; }",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    salvarProjetoArmazenado(projetoOriginal);

    // 3. Ler o projeto do disco
    const projetoLido = obterProjetoArmazenado(testProjectId);
    assert.ok(projetoLido, "Projeto deve existir fisicamente no disco");
    assert.equal(projetoLido?.id, testProjectId);
    assert.equal(projetoLido?.arquivos["index.html"], projetoOriginal.arquivos["index.html"]);
    assert.equal(projetoLido?.arquivos["styles.css"], projetoOriginal.arquivos["styles.css"]);

    // 4. Limpeza
    apagarProjetoArmazenado(testProjectId);
    const projetoAposExclusao = obterProjetoArmazenado(testProjectId);
    assert.equal(projetoAposExclusao, null, "Projeto deve ser removido após exclusão");
  });

  test("PROVA 5: Classificação de Intenções Sem Erro em 9 Categorias", () => {
    assert.equal(classificarPedidoLovable("gere um vídeo sobre o espaço"), "criacao");
    assert.equal(classificarPedidoLovable("crie uma imagem de um dragão"), "imagem");
    assert.equal(classificarPedidoLovable("pesquise sobre o clima hoje"), "pesquisa");
    assert.equal(classificarPedidoLovable("publique este site"), "publicacao");
    assert.equal(classificarPedidoLovable("abra a pasta do projeto"), "importacao");
    assert.equal(classificarPedidoLovable("corrija o erro no botão de login"), "correcao");
    assert.equal(classificarPedidoLovable("olá, tudo bem?"), "conversa");
    assert.equal(classificarPedidoLovable("mude a cor do fundo para azul"), "edicao");
    assert.equal(classificarPedidoLovable("crie um clone do netflix"), "criacao");
  });

  test("PROVA 6: Resiliência de Chaves de IA em Sessões Anônimas e Locais", () => {
    const randomUser1 = "user-original-" + Date.now();
    const randomUser2 = "user-outra-aba-" + Date.now();

    salvarChaveArmazenada({
      user_id: randomUser1,
      provider: "groq",
      api_key: "gsk_TestResilienceKey12345",
      api_url: null,
      testada_ok: true,
      testada_em: new Date().toISOString(),
      ultimo_erro: null,
    });

    // Quando outra aba abre ou o usuário conecta de forma anônima/diferente:
    const chavesSessaoNova = obterChavesArmazenadas([randomUser2]);
    assert.ok(
      chavesSessaoNova.length > 0,
      "Chaves salvas no disco devem ser recuperadas sem travar a geração",
    );
    assert.ok(
      chavesSessaoNova.some(
        (k) => k.provider === "groq" && k.api_key === "gsk_TestResilienceKey12345",
      ),
    );
  });

  test("PROVA 7: Diretrizes de Excelência Visual Lovable e Plano Pós-Criação no Prompt", () => {
    const prompt = montarPrompt("crie uma rede social chamada Yorccut", {});
    assert.match(prompt, /DESIGN SYSTEM E PADRÃO VISUAL PREMIUM OBRIGATÓRIO/);
    assert.match(prompt, /Google Fonts/);
    assert.match(prompt, /Próximos Passos & Sugestões de Evolução/);
    assert.match(prompt, /PROIBIÇÃO DE VERSÕES ESQUELÉTICAS/);
  });

  test("PROVA 8: Protocolo Antigravity Autonomous Software Engineering & Slash Commands /goal e /antigravity", async () => {
    const { processarComandoBarra, resolverPedidoContextual, montarPrompt } =
      await import("./builder.server");
    const { AgentManager } = await import("@/agents/AgentManager");
    const { OpenManusReActAgent } = await import("@/agents/OpenManusEngine");

    // 1. Verificação do Prompt com o Ciclo Completo de Engenharia Autônoma
    const prompt = montarPrompt("corrija o erro do botão de envio", {
      "index.html": "<!doctype html><html><body><button id='send'>Enviar</button></body></html>",
    });
    assert.match(prompt, /ANTIGRAVITY & DEV BUDDY — AUTONOMOUS SOFTWARE ENGINEERING AGENT/);
    assert.match(
      prompt,
      /ENTENDER → INVESTIGAR → PLANEJAR → IMPLEMENTAR → TESTAR → AUDITAR → CORRIGIR → VALIDAR/,
    );
    assert.match(prompt, /REGRA ROOT CAUSE FIRST & DEBUG PROFUNDO/);
    assert.match(prompt, /NÃO FABRIQUE FUNCIONALIDADE/);

    // 2. Slash command /goal e /antigravity sem args retorna dashboard informativo
    const cmdGoalVazio = processarComandoBarra("/goal", {});
    assert.ok(cmdGoalVazio?.executou);
    assert.match(cmdGoalVazio.resposta, /Antigravity — Autonomous Software Engineering Agent/);
    assert.match(cmdGoalVazio.resposta, /Root Cause First/);

    const cmdStatus = processarComandoBarra("/status", { "index.html": "<html></html>" });
    assert.ok(cmdStatus?.executou);
    assert.match(cmdStatus.resposta, /Antigravity Autonomous Software Engineer/);

    // 3. Slash command com meta repassa para o pipeline autônomo
    const cmdGoalComMeta = processarComandoBarra(
      "/goal construa uma calculadora com histórico",
      {},
    );
    assert.equal(cmdGoalComMeta, null, "Comandos com objetivo devem ir para o motor de IA");

    const contextualGoal = resolverPedidoContextual(
      "/goal construa uma calculadora com histórico",
      [],
    );
    assert.equal(contextualGoal.intencao, "alterar");
    assert.match(contextualGoal.pedidoEfetivo, /MODO AUTÔNOMO DE ENGENHARIA DE SOFTWARE/);
    assert.match(contextualGoal.pedidoEfetivo, /construa uma calculadora com histórico/);

    // 4. Agente Antigravity cadastrado no AgentManager
    const manager = new AgentManager();
    const agenteAntigravity = manager.getAgent("antigravity");
    assert.ok(agenteAntigravity, "Agente antigravity deve estar disponível no AgentManager");
    assert.equal(agenteAntigravity.role, "engenheiro-autonomo");

    // 5. OpenManus Engine com protocolo Antigravity
    const openManus = new OpenManusReActAgent();
    const promptOpenManus = openManus.gerarPromptInstrucoesOpenManus();
    assert.match(promptOpenManus, /ANTIGRAVITY & OPENMANUS REACT AGENT PROTOCOL/);
    assert.match(promptOpenManus, /ROOT CAUSE FIRST/);
  });

  test("PROVA 9: Detecção Precisa de Verbos de Ação de Engenharia e Prevenção de Falso Positivo em Conversa", async () => {
    const { ehSaudacaoOuConversaCasual, classificarPedido, classificarPedidoLovable } =
      await import("./builder.server");

    // Verbos de ação e engenharia nunca são classificados como simples conversa
    assert.equal(
      ehSaudacaoOuConversaCasual(
        "ponha esse mesmo conceito no meu sistema pois parou de funcionar",
      ),
      false,
    );
    assert.equal(
      classificarPedido("ponha esse mesmo conceito no meu sistema pois parou de funcionar"),
      "alterar",
    );
    assert.equal(
      classificarPedidoLovable("ponha esse mesmo conceito no meu sistema pois parou de funcionar"),
      "correcao",
    );

    assert.equal(ehSaudacaoOuConversaCasual("integre o banco de dados"), false);
    assert.equal(ehSaudacaoOuConversaCasual("refatore o componente de cabeçalho"), false);
    assert.equal(ehSaudacaoOuConversaCasual("debug o erro no formulário"), false);
  });

  test("PROVA 10: Saneamento de Multi-Turn Chat (Prevenção da Quebra no 2º Turno com Google Gemini e OpenAI)", async () => {
    const { sanitizarHistoricoParaGoogle, sanitizarHistoricoParaOpenAI } =
      await import("./providers.server");

    // Cenário 1: Histórico com mensagens consecutivas de usuário e assistente (desordenadas)
    const historicoDesordenado = [
      { role: "assistant" as const, conteudo: "Mensagem inicial do assistente" }, // deve ser ignorada pois Gemini exige começar com 'user'
      { role: "user" as const, conteudo: "Crie uma calculadora" },
      { role: "user" as const, conteudo: "Com botões coloridos" }, // deve ser mesclada com a anterior
      { role: "assistant" as const, conteudo: "Aqui está a calculadora" },
      { role: "user" as const, conteudo: "Agora mude para tema escuro" }, // trailing user antes do novo prompt
    ];

    const contentsGoogle = sanitizarHistoricoParaGoogle(
      historicoDesordenado,
      "Adicione botão de raiz quadrada",
      [],
    );

    // Validações estritas da API do Google Gemini:
    // 1. O primeiro item DEVE ser 'user'
    assert.equal(contentsGoogle[0]!.role, "user");
    // 2. O último item DEVE ser o prompt atual com role 'user'
    assert.equal(contentsGoogle[contentsGoogle.length - 1]!.role, "user");
    assert.deepEqual(contentsGoogle[contentsGoogle.length - 1]!.parts, [
      { text: "Adicione botão de raiz quadrada" },
    ]);

    // 3. Todos os itens DEVEM alternar rigorosamente: user -> model -> user -> model -> user
    for (let i = 0; i < contentsGoogle.length; i++) {
      const esperado = i % 2 === 0 ? "user" : "model";
      assert.equal(
        contentsGoogle[i]!.role,
        esperado,
        `Item no índice ${i} deve ter role '${esperado}', mas recebeu '${contentsGoogle[i]!.role}'`,
      );
    }

    // Cenário 2: Histórico vazio (1º turno)
    const contentsTurno1 = sanitizarHistoricoParaGoogle([], "Primeira mensagem", []);
    assert.equal(contentsTurno1.length, 1);
    assert.equal(contentsTurno1[0]!.role, "user");

    // Cenário 3: Histórico de 2 turnos normais (Turno 2 funcionando perfeitamente)
    const historicoTurno2 = [
      { role: "user" as const, conteudo: "Crie o site" },
      { role: "assistant" as const, conteudo: "<arquivo nome='index.html'>...</arquivo>" },
    ];
    const contentsTurno2 = sanitizarHistoricoParaGoogle(
      historicoTurno2,
      "Mude a cor para azul",
      [],
    );
    assert.equal(contentsTurno2.length, 3);
    assert.equal(contentsTurno2[0]!.role, "user");
    assert.equal(contentsTurno2[1]!.role, "model");
    assert.equal(contentsTurno2[2]!.role, "user");

    // Cenário 4: OpenAI messages sanitization
    const msgsOpenAI = sanitizarHistoricoParaOpenAI(historicoDesordenado, "Nova mensagem", []);
    assert.ok(msgsOpenAI.length > 0);
    assert.equal(msgsOpenAI[msgsOpenAI.length - 1]!.role, "user");
    assert.equal(msgsOpenAI[msgsOpenAI.length - 1]!.content, "Nova mensagem");
  });

  test("PROVA 11: Sincronização da Equipe de IAs & Preservação de Continuidade (Sem Começar do Zero)", async () => {
    const { compactarMensagemParaHistorico } = await import("./providers.server");
    const { montarPrompt } = await import("./builder.server");
    const { ORDEM_QUALIDADE, PROVIDER_LABELS } = await import("./config");
    const { respostaComprovaCapacidade } = await import("../faby.functions");

    // 1. Compactação de código no histórico preserva explicação e sumário de arquivos sem mutilar sintaxe
    const msgComArquivo =
      '<arquivo nome="index.html">\n<!doctype html><html><body><h1>App</h1></body></html>\n</arquivo>\n\nConstruí o cabeçalho e o feed principal com cartões interativos.';
    const compactada = compactarMensagemParaHistorico(msgComArquivo, 2000);
    assert.match(compactada, /Arquivos gerados\/atualizados nesta rodada: index\.html/);
    assert.match(compactada, /Construí o cabeçalho e o feed principal/);
    assert.ok(
      !compactada.includes("<!doctype html>"),
      "Não deve embutir código bruto truncado no chat history",
    );

    // 2. Diretriz de sincronização em equipe é injetada quando há arquivos existentes
    const promptEquipe = montarPrompt("mude o botão para verde", {
      "index.html": "<html><body><button id='btn'>Clique</button></body></html>",
      "styles.css": "#btn { background: blue; }",
    });
    assert.match(promptEquipe, /DIRETRIZ DE SINCRONIZAÇÃO EM EQUIPE/);
    assert.match(promptEquipe, /NUNCA recomece do zero/);
    assert.match(promptEquipe, /Pegue as mudanças já implementadas/);

    // 3. Ordem de qualidade limpa e sem duplicatas
    assert.ok(ORDEM_QUALIDADE.includes("google"));
    assert.ok(
      !ORDEM_QUALIDADE.includes("antigravity" as any),
      "Antigravity não deve ser duplicado como provedor externo",
    );
    assert.equal(PROVIDER_LABELS["google"], "Google Gemini (2.5 Flash / Pro)");

    // 4. Tolerância robusta em teste de capacidade
    assert.ok(respostaComprovaCapacidade("FABY_OK|HTML|CSS|JS"));
    assert.ok(respostaComprovaCapacidade("FABY_OK | HTML | CSS | JS"));
  });

  test("PROVA 12: Prevenção de Sequestro de Projeto & Continuidade do Motor (Anti-Template Hijacking)", async () => {
    const { aplicativoLocalParaPedido } = await import("./aplicativos-locais.server");
    const { classificarPedidoLovable, gerarContratoEntrega } = await import("./builder.server");

    const arquivosProjetoExistente = {
      "index.html":
        "<!doctype html><html><head><title>Meu Sistema ERP</title></head><body><h1>Dashboard</h1></body></html>",
      "styles.css": ":root { --primary: #3b82f6; --bg: #ffffff; }",
      "app.js": "console.log('ERP rodando');",
    };

    // 1. Quando o projeto já tem arquivos, palavras-chave de templates (tarefas, calculadora, cronômetro, etc.)
    // NUNCA devem sequestrar o projeto com um aplicativo estático pré-moldado!
    const sequestroTarefas = aplicativoLocalParaPedido(
      "adicione uma lista de tarefas na barra lateral",
      arquivosProjetoExistente,
    );
    assert.equal(
      sequestroTarefas,
      null,
      "Não deve substituir o projeto existente pelo template de Tarefas",
    );

    const sequestroCalculadora = aplicativoLocalParaPedido(
      "adicione uma calculadora de frete",
      arquivosProjetoExistente,
    );
    assert.equal(
      sequestroCalculadora,
      null,
      "Não deve substituir o projeto existente pelo template de Calculadora",
    );

    const sequestroCronometro = aplicativoLocalParaPedido(
      "coloque um cronômetro na tela",
      arquivosProjetoExistente,
    );
    assert.equal(
      sequestroCronometro,
      null,
      "Não deve substituir o projeto existente pelo template de Cronômetro",
    );

    // 2. Modificações incrementais determinísticas suportadas (ex: tema de cor) são preservadas
    const mudancaTema = aplicativoLocalParaPedido(
      "mude a cor para verde",
      arquivosProjetoExistente,
    );
    assert.ok(mudancaTema);
    assert.match(mudancaTema.arquivos["styles.css"]!, /--primary:\s*#10b981/);
    assert.equal(
      mudancaTema.arquivos["index.html"],
      arquivosProjetoExistente["index.html"],
      "Deve preservar 100% dos outros arquivos do projeto",
    );

    // 3. Classificação Lovable com arquivos existentes é sempre 'edicao' (salvo pedido explícito de recriação do zero)
    assert.equal(
      classificarPedidoLovable("faça um novo módulo de pagamentos", arquivosProjetoExistente),
      "edicao",
    );
    assert.equal(
      classificarPedidoLovable("construa um painel de usuários", arquivosProjetoExistente),
      "edicao",
    );
    assert.equal(
      classificarPedidoLovable("apagar tudo e começar do zero", arquivosProjetoExistente),
      "criacao",
    );

    // 4. Contrato de entrega preserva o título real do projeto existente em vez de adivinhar novo produto
    const contrato = gerarContratoEntrega(
      "adicione uma calculadora de impostos",
      arquivosProjetoExistente,
      "edicao",
    );
    assert.match(
      contrato.nomeProduto,
      /Meu Sistema ERP/,
      "O produto deve manter o nome do projeto atual e não virar 'calculadora'",
    );
    assert.match(
      contrato.criteriosAceite.join(" "),
      /PRESERVAÇÃO OBRIGATÓRIA/,
      "Critérios de aceite devem proibir expressamente começar do zero ou trocar o projeto",
    );
  });

  test("PROVA 13: Compatibilidade Total com Novas Chaves Google (Formato AQ.) & Modelos Atualizados (Groq/OpenRouter)", async () => {
    const { MODELS, PROVIDER_LABELS, MODELOS_ALTERNATIVOS } = await import("./config");
    const { respostaComprovaCapacidade } = await import("../faby.functions");
    const { salvarChaveArmazenada, obterChavesArmazenadas } = await import("./storage.server");

    // 1. Chaves do Google no novo formato oficial 'AQ.' são salvas e recuperadas sem rejeição
    const testUserId = "user-aq-test-proof-" + Date.now();
    const chaveAQ = "AQ.VnA0X1yZ_GoogleGeminiOfficialModernAuthKey2026";

    salvarChaveArmazenada({
      user_id: testUserId,
      provider: "google",
      api_key: chaveAQ,
      api_url: null,
      testada_ok: true,
      testada_em: new Date().toISOString(),
      ultimo_erro: null,
    });

    const chavesSalvas = obterChavesArmazenadas([testUserId]);
    const chaveGoogle = chavesSalvas.find((k) => k.provider === "google");
    assert.ok(chaveGoogle, "Chave do Google deve existir");
    assert.equal(
      chaveGoogle.api_key,
      chaveAQ,
      "Chave com formato AQ. deve ser preservada na íntegra",
    );
    assert.equal(chaveGoogle.testada_ok, true);

    // 2. Modelos ativos de produção para Groq (sem modelos aposentados)
    assert.equal(MODELS.groq, "llama-3.3-70b-versatile", "Groq padrão deve ser o Llama 3.3 70B");
    assert.ok(
      (MODELOS_ALTERNATIVOS["groq"] ?? []).includes("llama-3.1-8b-instant"),
      "Groq deve incluir Llama 3.1 8B como alternativa rápida",
    );
    assert.ok(
      !(MODELOS_ALTERNATIVOS["groq"] ?? []).includes("qwen-2.5-coder-32b"),
      "Modelo aposentado do Groq não deve estar na lista de alternativas",
    );
    assert.match(PROVIDER_LABELS["groq"] ?? "", /Llama 3\.3 70B/);

    // 3. Robustez de validação de capacidade para modelos com pensamento ou formatos com espaçamento
    assert.ok(respostaComprovaCapacidade("FABY_OK|HTML|CSS|JS"), "Deve aceitar formato padrão");
    assert.ok(
      respostaComprovaCapacidade("FABY_OK | HTML | CSS | JS"),
      "Deve aceitar formato com espaços",
    );
    assert.ok(
      respostaComprovaCapacidade(
        "<think>Raciocínio longo do modelo DeepSeek...</think>\nFABY_OK|HTML|CSS|JS",
      ),
      "Deve aceitar resposta com tags de pensamento anteriores",
    );
  });

  test("PROVA 14: Dual-Auth Google Gemini, Proteção de Tokens Groq & Template Rico Lovable", async () => {
    const { MODELS, MODELOS_ALTERNATIVOS, MODELOS_POR_ETAPA } = await import("./config");
    const { aplicativoLocalParaPedido } = await import("./aplicativos-locais.server");
    const { INSTRUCAO_PROJETO } = await import("./builder.server");

    // 1. Modelos do Groq não contêm modelos com limite minúsculo (openai/gpt-oss-120b com TPM 8k)
    assert.ok(
      !(MODELOS_ALTERNATIVOS["groq"] ?? []).includes("openai/gpt-oss-120b"),
      "openai/gpt-oss-120b não deve estar nas alternativas do Groq",
    );
    for (const etapa of Object.keys(MODELOS_POR_ETAPA) as (keyof typeof MODELOS_POR_ETAPA)[]) {
      const modelosGroq = MODELOS_POR_ETAPA[etapa].filter((m) => m.provedor === "groq");
      for (const m of modelosGroq) {
        assert.notEqual(
          m.modelo,
          "openai/gpt-oss-120b",
          `Etapa ${etapa} não deve conter openai/gpt-oss-120b no Groq`,
        );
      }
    }

    // 2. Template Rico de Homenagem a Turma do Chaves com Toggle de Tema e Recursos Reais
    const appChaves = aplicativoLocalParaPedido("crie um sereado em homenagem a turma do chaves");
    assert.ok(appChaves, "Deve gerar aplicação dedicada para tributo do Chaves");
    assert.ok(appChaves.arquivos["index.html"], "Deve conter index.html completo");
    assert.ok(appChaves.arquivos["styles.css"], "Deve conter styles.css completo");
    assert.ok(appChaves.arquivos["app.js"], "Deve conter app.js completo");
    assert.ok(
      appChaves.arquivos["index.html"].includes("A Turma do Chaves"),
      "index.html deve conter título rico",
    );
    assert.ok(
      appChaves.arquivos["index.html"].includes("themeToggle"),
      "index.html deve conter toggle de tema clássico/moderno",
    );
    assert.ok(
      appChaves.arquivos["app.js"].includes("renderEpisodios"),
      "app.js deve renderizar episódios interativos",
    );

    // 3. Diretriz do Prompt exige código completo primeiro, proibindo esqueletos brancos
    assert.ok(
      INSTRUCAO_PROJETO.includes("ENTREGAR CÓDIGO 100% COMPLETO PRIMEIRO"),
      "Instrução do projeto deve priorizar código rico completo primeiro",
    );
    assert.ok(
      INSTRUCAO_PROJETO.includes("PROIBIÇÃO ABSOLUTA DE TELAS EM BRANCO OU ESQUELÉTICAS"),
      "Instrução deve proibir expressamente telas em branco ou esqueléticas",
    );
  });
});
