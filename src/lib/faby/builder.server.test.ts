import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  classificarPedido,
  coberturaRecriacao,
  diagnosticarProjeto,
  inventarioReferencia,
  pedidoExigeArquivos,
  resolverPedidoContextual,
} from "./builder.server";
import { aplicativoLocalParaPedido } from "./aplicativos-locais.server";
import { avaliarEntrega } from "./evolucao.server";
import { parseDuelChoice, respostaComprovaCapacidade } from "../faby.functions";
import { montarPreviewHtml, verificarPublicacaoEstatica } from "./preview";
import { ehUrlPublicaSegura } from "./providers.server";

describe("cérebro contextual", () => {
  test("transforma sim depois de oferta de versão web em recriação", () => {
    const resultado = resolverPedidoContextual("sim", [
      { role: "user", conteudo: "ponha na prévia" },
      { role: "assistant", conteudo: 'Diga "faça a versão web" e eu construo a tela principal.' },
    ]);
    assert.equal(resultado.intencao, "recriar");
    assert.equal(resultado.continuacao, true);
    assert.match(resultado.pedidoEfetivo, /Execute agora/);
  });

  test("transforma confirmação de correção em alteração", () => {
    const resultado = resolverPedidoContextual("pode fazer", [
      { role: "assistant", conteudo: "Quer que eu corrija o botão de salvar agora?" },
    ]);
    assert.equal(resultado.intencao, "alterar");
  });

  test("não inventa ação quando não houve oferta concreta", () => {
    const resultado = resolverPedidoContextual("sim", [
      { role: "assistant", conteudo: "Entendi o problema." },
    ]);
    assert.equal(resultado.intencao, "conversar");
    assert.equal(resultado.continuacao, false);
  });

  test("pedido amplo de SaaS é alteração", () => {
    assert.equal(classificarPedido("criar saas igual lovable, porém grátis"), "alterar");
  });

  test("diagnóstico inclui erro real e estado do projeto", () => {
    const texto = diagnosticarProjeto(
      { "index.html": "<!doctype html><html><head><style></style></head><body></body></html>" },
      "Uncaught TypeError: Failed to parse URL from /api/projetos",
    );
    assert.match(texto, /projeto existente/);
    assert.match(texto, /Failed to parse URL/);
  });
});
test("inventário lista telas, navegação, rotas e tabelas da referência", () => {
  const inv = inventarioReferencia({
    "templates/index.html":
      '<title>Painel Faby</title><nav><a href="/chaves">Chaves</a><a href="/projetos">Projetos</a></nav><h2>Meus projetos</h2><form><input name="nome"></form><button>Salvar chave</button>',
    "app.py": '@app.route("/api/projetos")\ndef p(): pass\nCREATE TABLE projetos (id int)',
  });
  assert.match(inv.texto, /Chaves/);
  assert.match(inv.texto, /\/api\/projetos/);
  assert.ok(inv.itens.includes("Salvar chave"));
});

test("cobertura acusa item da referência que ficou fora da versão web", () => {
  const inv = { itens: ["Chaves", "Meus projetos"], texto: "" };
  const faltas = coberturaRecriacao(inv, {
    "index.html": "<h1>Meus projetos</h1><section id='lista'></section>",
  });
  assert.equal(faltas.length, 1);
  assert.match(faltas[0]!, /Chaves/);
});

test("cobertura fica vazia quando tudo foi reproduzido", () => {
  const inv = { itens: ["Chaves", "Meus projetos"], texto: "" };
  assert.deepEqual(
    coberturaRecriacao(inv, { "index.html": "<a>Chaves</a><h1>Meus projetos</h1>" }),
    [],
  );
});

test("modelo local entrega calculadora funcional sem depender de IA", () => {
  const app = aplicativoLocalParaPedido("crie uma calculadora");
  assert.ok(app);
  assert.deepEqual(Object.keys(app.arquivos).sort(), ["app.js", "index.html", "style.css"]);
  const avaliacao = avaliarEntrega(app.arquivos, {
    exigeBackend: false,
    pedido: "crie uma calculadora",
    imagensEnviadas: [],
  });
  assert.equal(avaliacao.atingiuObjetivo, true, avaliacao.falhas.join("; "));
});

test("controle semântico rejeita calculadora que é só uma tela bonita", () => {
  const avaliacao = avaliarEntrega(
    {
      "index.html":
        "<style>button{color:red}</style><h1>Calculadora</h1><button>Testar ação</button>",
    },
    { exigeBackend: false, pedido: "crie uma calculadora", imagensEnviadas: [] },
  );
  assert.equal(avaliacao.atingiuObjetivo, false);
  assert.match(avaliacao.falhas.join(" "), /quatro operações/);
});

test("publicação estática bloqueia molde Flask e preserva a publicação anterior", () => {
  const resultado = verificarPublicacaoEstatica({
    "templates/index.html": "<h1>{{ titulo }}</h1>",
    "app.py": "from flask import Flask",
  });
  assert.equal(resultado.ok, false);
  assert.match(resultado.motivo, /publicação anterior foi preservada/i);
});

test("publicação estática bloqueia React ou Vite ainda não compilado", () => {
  const resultado = verificarPublicacaoEstatica({
    "index.html": '<script type="module" src="/src/main.tsx"></script>',
    "src/main.tsx": "console.log('app')",
  });
  assert.equal(resultado.ok, false);
  assert.match(resultado.motivo, /compilada/i);
});

test("publicação estática aceita HTML, CSS e JavaScript prontos", () => {
  const resultado = verificarPublicacaoEstatica({
    "index.html":
      '<link rel="stylesheet" href="style.css"><button id="ok">OK</button><script src="app.js"></script>',
    "style.css": "button { display: block; }",
    "app.js": "document.querySelector('#ok')?.addEventListener('click', () => alert('ok'));",
  });
  assert.equal(resultado.ok, true);
});

test("teste de chave exige a resposta estruturada inteira", () => {
  assert.equal(respostaComprovaCapacidade("FABY_OK|HTML|CSS|JS"), true);
  assert.equal(respostaComprovaCapacidade("Olá, estou funcionando"), false);
  assert.equal(respostaComprovaCapacidade("FABY_OK|HTML|CSS"), false);
});

test("duelo só aceita escolha numérica exata dentro das respostas", () => {
  assert.equal(parseDuelChoice("2", 3), 2);
  assert.equal(parseDuelChoice("A resposta é 2", 3), 0);
  assert.equal(parseDuelChoice("4", 3), 0);
});

test("provedor customizado bloqueia destinos internos", () => {
  assert.equal(ehUrlPublicaSegura("https://api.example.com/v1"), true);
  assert.equal(ehUrlPublicaSegura("https://127.0.0.1/v1"), false);
  assert.equal(ehUrlPublicaSegura("https://192.168.1.10/v1"), false);
  assert.equal(ehUrlPublicaSegura("http://api.example.com/v1"), false);
});

test("pedir para trazer do workspace para a prévia é recriação obrigatória", () => {
  assert.equal(classificarPedido("mas traga do workspace entao"), "recriar");
  assert.equal(classificarPedido("ponha na previa, senao nao consigo testar"), "recriar");
  assert.equal(pedidoExigeArquivos("mas traga do workspace entao"), true);
});

test("ordem curta sem alvo citado ainda exige arquivos", () => {
  assert.equal(pedidoExigeArquivos("corrija"), true);
  assert.equal(pedidoExigeArquivos("melhore isso"), true);
  assert.equal(pedidoExigeArquivos("obrigado, gostei do resultado"), false);
});

test("prévia de projeto com servidor neutraliza rotas do servidor original", () => {
  const html = montarPreviewHtml({
    "templates/index.html": "<html><head></head><body>{{ titulo }}</body></html>",
    "app.py": "from flask import Flask",
  });
  assert.ok(html);
  assert.match(html, /faby_servidor_ausente/);
  assert.match(html, /previa/i);
});

test("cópia dos originais não entra nas conferências nem na prévia", () => {
  const resultado = verificarPublicacaoEstatica({
    "index.html": '<button id="ok">OK</button><script src="app.js"></script>',
    "app.js": "document.querySelector('#ok')?.addEventListener('click', () => alert('ok'));",
    "originais/templates/index.html": "<html>{{ titulo }}</html>",
    "originais/app.py": "from flask import Flask",
  });
  assert.equal(resultado.ok, true);
});
