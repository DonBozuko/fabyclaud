/**
 * Plugins (ferramentas) que as IAs podem chamar sozinhas, todos gratuitos e sem chave.
 *
 * A IA escreve, no meio da resposta:
 *   <ferramenta nome="buscar_web">preço médio de hospedagem no brasil</ferramenta>
 * O servidor executa, devolve o resultado e pede a resposta definitiva.
 */

const PADRAO_FERRAMENTA =
  /<ferramenta\s+nome=(["'])([a-z_]+)\1\s*>([\s\S]*?)<\/\s*ferramenta\s*>/gi;

export type PedidoFerramenta = { nome: string; entrada: string };

export function extrairPedidosDeFerramenta(resposta: string): PedidoFerramenta[] {
  PADRAO_FERRAMENTA.lastIndex = 0;
  const pedidos: PedidoFerramenta[] = [];
  let m: RegExpExecArray | null;
  while ((m = PADRAO_FERRAMENTA.exec(resposta)) !== null) {
    const nome = (m[2] ?? "").toLowerCase();
    const entrada = (m[3] ?? "").trim();
    if (nome && entrada) pedidos.push({ nome, entrada });
  }
  // No máximo 4 por rodada, para não gastar tempo nem chamadas em vão.
  return pedidos.slice(0, 4);
}

/** Tira as tags de ferramenta do texto que a pessoa vê. */
export function limparFerramentas(resposta: string) {
  return resposta
    .replace(PADRAO_FERRAMENTA, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const TIMEOUT = 15_000;

async function buscarNaWeb(consulta: string) {
  const url = new URL("https://api.duckduckgo.com/");
  url.searchParams.set("q", consulta);
  url.searchParams.set("format", "json");
  url.searchParams.set("no_html", "1");
  url.searchParams.set("skip_disambig", "1");
  const r = await fetch(url, {
    headers: { "User-Agent": "FabyClaud/1.0" },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!r.ok) return `busca falhou (${r.status})`;
  const data = (await r.json()) as Record<string, unknown>;
  const linhas: string[] = [];
  for (const campo of ["Answer", "AbstractText", "Definition"]) {
    const valor = data[campo];
    if (typeof valor === "string" && valor.trim()) linhas.push(valor.trim());
  }
  const relacionados = data["RelatedTopics"];
  if (Array.isArray(relacionados)) {
    for (const item of relacionados.slice(0, 5)) {
      const texto = (item as Record<string, unknown>)?.["Text"];
      if (typeof texto === "string" && texto.trim()) linhas.push(`- ${texto.trim()}`);
    }
  }
  if (linhas.length) return linhas.join("\n").slice(0, 2_500);
  // Sem resposta direta: cai para os resultados da busca em si.
  const lista = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(consulta)}`, {
    headers: { "User-Agent": "Mozilla/5.0 FabyClaud/1.0" },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!lista.ok) return "nenhum resultado objetivo encontrado";
  const html = await lista.text();
  const trechos = [...html.matchAll(/class="result__(?:a|snippet)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => somenteTexto(m[1] ?? ""))
    .filter((t) => t.length > 20)
    .slice(0, 6);
  return trechos.length
    ? trechos
        .map((t) => `- ${t}`)
        .join("\n")
        .slice(0, 2_500)
    : "nenhum resultado objetivo encontrado";
}

function somenteTexto(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function lerPagina(endereco: string) {
  const alvo = endereco.trim();
  if (!/^https?:\/\//i.test(alvo))
    return "endereço inválido: precisa começar com http:// ou https://";
  if (/localhost|127\.0\.0\.1|\b10\.|\b192\.168\./i.test(alvo)) {
    return "endereços locais não são acessíveis pelo servidor";
  }
  const r = await fetch(alvo, {
    headers: { "User-Agent": "FabyClaud/1.0" },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!r.ok) return `a página respondeu ${r.status}`;
  const corpo = await r.text();
  return somenteTexto(corpo).slice(0, 4_000) || "a página não trouxe texto legível";
}

async function lerDocumentacao(termo: string) {
  const url = new URL("https://developer.mozilla.org/api/v1/search");
  url.searchParams.set("q", termo.trim());
  url.searchParams.set("locale", "pt-BR");
  const r = await fetch(url, {
    headers: { "User-Agent": "FabyClaud/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!r.ok) return `documentação indisponível agora (${r.status})`;
  const data = (await r.json()) as {
    documents?: { title?: string; summary?: string; mdn_url?: string }[];
  };
  const docs = (data.documents ?? []).slice(0, 4);
  if (!docs.length) return "nada encontrado na documentação";
  return docs
    .map(
      (d) =>
        `- ${d.title ?? "sem título"}: ${(d.summary ?? "").slice(0, 400)}\n  https://developer.mozilla.org${d.mdn_url ?? ""}`,
    )
    .join("\n")
    .slice(0, 3_000);
}

async function consultarBanco(colecao: string, apiUrl: string) {
  const nome = colecao.trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,40}$/.test(nome))
    return "nome de coleção inválido (use letras minúsculas, números, - ou _)";
  const r = await fetch(`${apiUrl}/${nome}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const corpo = await r.text();
  if (!r.ok) return `o banco respondeu ${r.status}: ${corpo.slice(0, 300)}`;
  try {
    const lista = JSON.parse(corpo) as unknown[];
    const total = Array.isArray(lista) ? lista.length : 0;
    const amostra = Array.isArray(lista) ? lista.slice(0, 3) : lista;
    return `${total} registro(s) na coleção "${nome}". Amostra: ${JSON.stringify(amostra).slice(0, 1_500)}`;
  } catch {
    return corpo.slice(0, 800);
  }
}

function crc32(texto: string) {
  const bytes = new TextEncoder().encode(texto);
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

import { enriquecerPromptImagem } from "./builder.server";

function gerarImagem(descricao: string, contextoProjeto?: string) {
  const desc = descricao.trim();
  if (!desc) return "descreva a imagem em inglês para eu gerar";
  const promptEnriquecido = enriquecerPromptImagem(desc, contextoProjeto);
  const seed = crc32(promptEnriquecido) % 1_000_000;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptEnriquecido)}?width=1024&height=768&seed=${seed}&nologo=true`;
  return `imagem pronta, use exatamente este src no HTML: ${url}`;
}

/** Executa os pedidos e devolve um bloco de texto pronto para voltar à IA. */
export async function executarFerramentas(
  pedidos: PedidoFerramenta[],
  contexto: { apiUrl: string; contextoProjeto?: string },
) {
  const resultados = await Promise.all(
    pedidos.map(async ({ nome, entrada }) => {
      try {
        if (nome === "buscar_web") return await buscarNaWeb(entrada);
        if (nome === "ler_pagina") return await lerPagina(entrada);
        if (nome === "ler_doc" || nome === "documentacao") return await lerDocumentacao(entrada);
        if (nome === "consultar_banco") return await consultarBanco(entrada, contexto.apiUrl);
        if (nome === "gerar_imagem") return gerarImagem(entrada, contexto.contextoProjeto);
        return `ferramenta desconhecida: ${nome}`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return /timeout|aborted/i.test(msg)
          ? "a ferramenta demorou demais e foi cancelada"
          : `falhou: ${msg}`;
      }
    }),
  );
  return pedidos
    .map(
      (p, i) => `### ${p.nome} (${p.entrada.slice(0, 120)})\n${resultados[i] ?? "sem resultado"}`,
    )
    .join("\n\n");
}

/** Instrução que ensina a IA a usar as ferramentas. */
export const INSTRUCAO_FERRAMENTAS = [
  "FERRAMENTAS QUE VOCÊ PODE USAR SOZINHA (plugins gratuitos): quando faltar um dado real para responder bem, peça a ferramenta em vez de adivinhar. Escreva assim, uma por linha, e PARE a resposta ali (sem código, sem conclusão):",
  '<ferramenta nome="buscar_web">pergunta objetiva</ferramenta>',
  '<ferramenta nome="ler_pagina">https://endereco/da/pagina</ferramenta>',
  '<ferramenta nome="ler_doc">fetch API</ferramenta>',
  '<ferramenta nome="consultar_banco">usuarios</ferramenta>',
  '<ferramenta nome="gerar_imagem">detailed description in english, photographic</ferramenta>',
  "O sistema executa e te devolve o resultado na mesma conversa; então você responde de forma definitiva. Máximo 4 ferramentas por vez e no máximo duas rodadas. Nunca invente o resultado de uma ferramenta, nunca peça ferramenta quando já tem o dado, e nunca mostre essas tags como se fossem resposta para a pessoa.",
].join("\n");
