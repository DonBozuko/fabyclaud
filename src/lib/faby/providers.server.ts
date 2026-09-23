import { MODELOS_ALTERNATIVOS, MODELS, ehErroDeModelo } from "./config";
import type { Anexo, ProvedorCustom } from "./config";

type HistoricoItem = { role: "user" | "assistant"; conteudo: string };
type Imagem = { mime: string; data: string };

export type ResultadoIA = { ok: boolean; texto: string; status?: number; bruto?: string };

const TIMEOUT_MS = 120_000;

/**
 * Teto de tempo total (em ms) para toda a cadeia de tentativas de um mesmo pedido,
 * somando o modelo principal + todos os alternativos. Sem isso, se o provedor
 * estiver degradado, o sistema tentava cada um dos ~6 modelos alternativos com até
 * 120s de timeout cada — no pior caso, minutos de espera silenciosa no navegador,
 * que parece travado porque o cliente não tem timeout próprio.
 */
const ORCAMENTO_TOTAL_MS = 120_000;

/** Bloqueia endpoints que poderiam apontar o servidor para a rede interna. */
export function ehUrlPublicaSegura(valor: string) {
  try {
    const url = new URL(valor);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "local" ||
      host.endsWith(".local") ||
      host === "metadata.google.internal" ||
      host === "host.docker.internal"
    ) {
      return false;
    }
    const octetos = host.split(".");
    if (
      octetos.length === 4 &&
      octetos.every((parte) => /^\d+$/.test(parte) && Number(parte) <= 255)
    ) {
      const [a = 0, b = 0] = octetos.map(Number);
      if (
        a === 10 ||
        a === 127 ||
        a === 0 ||
        (a === 169 && b === 254) ||
        (a === 192 && b === 168)
      ) {
        return false;
      }
      if (a === 172 && b >= 16 && b <= 31) return false;
    }
    if (
      host === "::1" ||
      host === "0:0:0:0:0:0:0:1" ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("fe80:")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function prepararHistorico(historico: HistoricoItem[]) {
  return historico
    .filter((item) => typeof item?.conteudo === "string" && item.conteudo.trim().length > 0)
    .map((item) => ({
      ...item,
      conteudo: resumirTexto(item.conteudo.trim(), 4_000),
    }));
}

export function compactarMensagemParaHistorico(conteudo: string, limite: number): string {
  const limpo = conteudo.trim();
  if (/<(?:arquivo\s+nome|file\s+path)=/i.test(limpo)) {
    const nomes = Array.from(
      limpo.matchAll(/<(?:arquivo\s+nome|file\s+path)=["']([^"']+)["']/gi),
    ).map((m) => m[1]);
    const textoSemArquivos = limpo
      .replace(/<(?:arquivo\s+nome|file\s+path)=["'][^"']+["']>[\s\S]*?<\/(?:arquivo|file)>/gi, "")
      .trim();
    const sumario = nomes.length
      ? `[Arquivos gerados/atualizados nesta rodada: ${nomes.join(", ")} — Código preservado integralmente no Stateful VFS]`
      : "";
    const sintetizado = [sumario, textoSemArquivos].filter(Boolean).join("\n\n");
    return resumirTexto(sintetizado, limite);
  }
  return resumirTexto(limpo, limite);
}

export function sanitizarHistoricoParaGoogle(
  historico: HistoricoItem[],
  promptAtual: string,
  imagens: Imagem[] = [],
  limiteCharsPorItem = 4_000,
): { role: "user" | "model"; parts: unknown[] }[] {
  // 1. Filtra itens com conteúdo não-vazio
  const filtrados: { role: "user" | "model"; texto: string }[] = [];
  for (const item of historico) {
    const limpo = (item.conteudo ?? "").trim();
    if (!limpo) continue;
    const role: "user" | "model" = item.role === "assistant" ? "model" : "user";
    filtrados.push({ role, texto: compactarMensagemParaHistorico(limpo, limiteCharsPorItem) });
  }

  // 2. Mescla mensagens consecutivas com o mesmo role para garantir estrita alternância
  const alternados: { role: "user" | "model"; texto: string }[] = [];
  for (const item of filtrados) {
    if (alternados.length > 0 && alternados[alternados.length - 1]!.role === item.role) {
      alternados[alternados.length - 1]!.texto += `\n\n${item.texto}`;
    } else {
      alternados.push({ ...item });
    }
  }

  // 3. Garante que o primeiro item é 'user'
  while (alternados.length > 0 && alternados[0]!.role !== "user") {
    alternados.shift();
  }

  // 4. Garante que o último item antes do prompt atual é 'model'
  // (pois o prompt atual que será adicionado ao final é 'user')
  while (alternados.length > 0 && alternados[alternados.length - 1]!.role !== "model") {
    alternados.pop();
  }

  // 5. Constrói a lista final de contents
  const contents: { role: "user" | "model"; parts: unknown[] }[] = [];
  for (const item of alternados) {
    contents.push({
      role: item.role,
      parts: [{ text: item.texto }],
    });
  }

  // 6. Adiciona o prompt atual do usuário
  const partesAtuais: unknown[] = [{ text: promptAtual }];
  for (const img of imagens) {
    partesAtuais.push({ inlineData: { mimeType: img.mime, data: img.data } });
  }
  contents.push({ role: "user", parts: partesAtuais });

  return contents;
}

export function sanitizarHistoricoParaOpenAI(
  historico: HistoricoItem[],
  promptAtual: string,
  imagens: Imagem[] = [],
  suportaImagem = false,
  limiteTurnos = 6,
): { role: string; content: unknown }[] {
  const filtrados = historico
    .filter((h) => typeof h?.conteudo === "string" && h.conteudo.trim().length > 0)
    .slice(-limiteTurnos)
    .map((h) => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: compactarMensagemParaHistorico(h.conteudo.trim(), 2_500),
    }));

  const messages: { role: string; content: unknown }[] = [];
  for (const item of filtrados) {
    if (messages.length > 0 && messages[messages.length - 1]!.role === item.role) {
      messages[messages.length - 1]!.content =
        `${String(messages[messages.length - 1]!.content)}\n\n${String(item.content)}`;
    } else {
      messages.push({ ...item });
    }
  }

  if (imagens.length && suportaImagem) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: promptAtual },
        ...imagens.map((img) => ({
          type: "image_url",
          image_url: { url: `data:${img.mime};base64,${img.data}` },
        })),
      ],
    });
  } else {
    messages.push({ role: "user", content: promptAtual });
  }

  return messages;
}

function resumirTexto(texto: string, limite: number) {
  if (texto.length <= limite) return texto;
  const inicio = Math.floor(limite * 0.58);
  const fim = limite - inicio;
  return `${texto.slice(0, inicio)}\n\n[trecho anterior reduzido para caber no limite gratuito]\n\n${texto.slice(-fim)}`;
}

function limiteEntrada(url: string) {
  if (/api\.groq\.com/i.test(url)) return 18_000;
  if (/api\.z\.ai/i.test(url)) return 32_000;
  if (/router\.huggingface\.co/i.test(url)) return 40_000;
  return 52_000;
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number = TIMEOUT_MS,
) {
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const texto = await resposta.text();
    let json: unknown = null;
    try {
      json = JSON.parse(texto);
    } catch {
      /* resposta não-JSON */
    }
    return { ok: resposta.ok, status: resposta.status, json, texto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, json: null, texto: msg };
  }
}

function erroLegivel(status: number, json: unknown, texto: string) {
  const msg =
    (json as { error?: { message?: string } | string })?.error &&
    typeof (json as { error: { message?: string } }).error === "object"
      ? (json as { error: { message?: string } }).error.message
      : typeof (json as { error?: string })?.error === "string"
        ? (json as { error: string }).error
        : null;
  const mensagemDireta = (json as { message?: unknown })?.message;
  const respostaHtml = /<!doctype html|<html[\s>]/i.test(texto);
  const base =
    msg ||
    (typeof mensagemDireta === "string" ? mensagemDireta : null) ||
    (respostaHtml
      ? "o endereço respondeu com uma página web, não com a API de IA"
      : texto.slice(0, 300)) ||
    "sem detalhes";
  if (respostaHtml) {
    return status === 422
      ? "o endereço configurado não é a API do OmniRoute ou o túnel expirou; abra o OmniRoute pelo terminal e copie o HTTPS atual mostrado em Túneis"
      : `o endereço respondeu com uma página web em vez da API (${status})`;
  }
  if (status === 401) return `chave inválida (${base})`;
  if (status === 402) return `esse serviço exige saldo ou créditos (${base})`;
  if (status === 403) return `chave sem permissão para esse modelo (${base})`;
  if (status === 404 || status === 410) return `modelo indisponível ou aposentado (${base})`;
  if (status === 429) return `limite gratuito atingido agora; tente novamente mais tarde (${base})`;
  return `erro ${status}: ${base}`;
}

function ehFalhaDeModelo(status: number, texto: string) {
  // A troca automática só é segura quando o provedor deixou claro que o
  // modelo não existe ou não pode ser usado. Erros de chave, payload e limite
  // não devem disparar várias chamadas gratuitas em sequência.
  if (status === 404 || status === 410) return true;
  return ehErroDeModelo(status, texto);
}

function endpointModelos(chatUrl: string) {
  const marcador = "/chat/completions";
  const indice = chatUrl.indexOf(marcador);
  return indice >= 0 ? `${chatUrl.slice(0, indice)}/models` : null;
}

async function descobrirModelos(url: string, key: string) {
  const alvo = endpointModelos(url);
  if (!alvo) return [];
  try {
    const resposta = await fetch(alvo, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!resposta.ok) return [];
    const json = (await resposta.json()) as { data?: { id?: string }[] };
    const ids = (json.data ?? [])
      .map((m) => m.id?.trim())
      .filter((id): id is string => Boolean(id));
    const pontos = (id: string) => {
      const nome = id.toLowerCase();
      let total = 0;
      if (/coder|coding|code|devstral|gpt-oss/.test(nome)) total -= 50;
      if (/free|flash|small|mini/.test(nome)) total -= 20;
      if (/instruct|chat/.test(nome)) total -= 10;
      if (/vision|embed|audio|image|rerank|moderation/.test(nome)) total += 80;
      return total;
    };
    return ids.sort((a, b) => pontos(a) - pontos(b)).slice(0, 8);
  } catch {
    return [];
  }
}

async function descobrirModelosGoogle(key: string): Promise<string[]> {
  try {
    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      {
        headers: { "x-goog-api-key": key, Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!resposta.ok) return [];
    const json = (await resposta.json()) as {
      models?: { name?: string; supportedGenerationMethods?: string[] }[];
    };
    const validos = (json.models ?? [])
      .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, "").trim())
      .filter((id) => {
        const n = id.toLowerCase();
        // Descarta modelos sem cota gratuita de texto ou que são de imagem/áudio/embedding
        if (
          n.includes("image") ||
          n.includes("imagen") ||
          n.includes("embedding") ||
          n.includes("aqa") ||
          n.includes("tts") ||
          n.includes("audio") ||
          n.includes("realtime")
        ) {
          return false;
        }
        return Boolean(id);
      });

    const pontuacao = (id: string) => {
      const nome = id.toLowerCase();
      let total = 0;
      if (nome === "gemini-flash-lite-latest" || nome === "gemini-flash-latest") total -= 60;
      if (nome.includes("flash-lite")) total -= 50;
      if (nome.includes("flash")) total -= 40;
      if (nome.includes("2.5") || nome.includes("3.")) total -= 30;
      if (nome.includes("pro")) total -= 10;
      return total;
    };
    return validos.sort((a, b) => pontuacao(a) - pontuacao(b)).slice(0, 10);
  } catch {
    return [];
  }
}

/** Google Gemini (API gratuita do AI Studio com retry automático para 503). */
async function chamarGoogle(
  prompt: string,
  historico: HistoricoItem[],
  key: string,
  imagens: Imagem[],
  timeoutMs: number,
  modelo: string = MODELS.google,
): Promise<ResultadoIA> {
  const modeloLimpo = modelo.replace(/^models\//, "").trim();
  const contents = sanitizarHistoricoParaGoogle(historico, prompt, imagens);

  // Retry rápido com espera curta em caso de 503
  let tentativas = 0;
  const maxTentativas = 2;
  while (tentativas < maxTentativas) {
    tentativas++;
    const { ok, status, json, texto } = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${modeloLimpo}:generateContent`,
      { "x-goog-api-key": key },
      { contents, generationConfig: { temperature: 0.2, maxOutputTokens: 8192 } },
      Math.min(timeoutMs, 85_000),
    );

    if (status === 503 && tentativas < maxTentativas) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      continue;
    }

    if (!ok) {
      let msg = erroLegivel(status, json, texto);
      if ((status === 400 || status === 401) && !key.startsWith("AIzaSy")) {
        msg = `${msg} (a chave do Google AI Studio deve começar com 'AIzaSy'. Chaves iniciando com 'AQ.' são tokens internos/OAuth e não funcionam aqui. Pegue a chave de API em aistudio.google.com/apikey)`;
      }
      return { ok: false, texto: msg, status, bruto: texto };
    }

    const partes = (json as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
      ?.candidates?.[0]?.content?.parts;
    const saida = (partes ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!saida) return { ok: false, texto: "a IA devolveu uma resposta vazia" };
    return { ok: true, texto: saida };
  }

  return { ok: false, status: 503, texto: "Google Gemini sobrecarregado (503) após tentativas" };
}

/** Tenta a lista ordenada de modelos do Google sem nunca hardcodar um único modelo. */
async function chamarGoogleComFallback(
  prompt: string,
  historico: HistoricoItem[],
  key: string,
  imagens: Imagem[] = [],
  timeoutMs: number = TIMEOUT_MS,
  modeloPreferido?: string,
): Promise<ResultadoIA> {
  const principal = modeloPreferido || MODELS.google;
  const lista = MODELOS_ALTERNATIVOS["google"] ?? [];
  let modelosGoogle = [...new Set([principal, ...lista].filter(Boolean))];

  let ultimo: ResultadoIA = { ok: false, texto: "provedor Google indisponível" };
  const inicio = Date.now();
  for (let i = 0; i < modelosGoogle.length; i++) {
    if (Date.now() - inicio > ORCAMENTO_TOTAL_MS) {
      return {
        ...ultimo,
        texto: `${ultimo.texto} (parei de tentar outros modelos após ${Math.round((Date.now() - inicio) / 1000)}s para não deixar a pessoa esperando; tente novamente ou troque de modelo)`,
      };
    }
    const modelo = modelosGoogle[i];
    if (!modelo) continue;
    const r = await chamarGoogle(prompt, historico, key, imagens, timeoutMs, modelo);
    if (r.ok) return r;
    ultimo = r;
    if (!ehErroDeModelo(r.status ?? 0, r.bruto ?? r.texto)) return r;
    if (i === modelosGoogle.length - 1 && Date.now() - inicio <= ORCAMENTO_TOTAL_MS) {
      const descobertos = await descobrirModelosGoogle(key);
      const novos = descobertos.filter((m) => !modelosGoogle.includes(m));
      if (novos.length) {
        modelosGoogle = [...modelosGoogle, ...novos];
      }
    }
  }
  return ultimo;
}

/** Qualquer provedor compatível com a API da OpenAI (Groq, OpenRouter, Mistral, customizados). */
async function chamarOpenAICompat(
  url: string,
  modelo: string,
  prompt: string,
  historico: HistoricoItem[],
  key: string,
  imagens: Imagem[],
  suportaImagem: boolean,
  timeoutMs: number,
): Promise<ResultadoIA> {
  const messages = sanitizarHistoricoParaOpenAI(historico, prompt, imagens, suportaImagem);

  const { ok, status, json, texto } = await postJson(
    url,
    { Authorization: `Bearer ${key}` },
    { model: modelo, messages, temperature: 0.2, max_tokens: 8192 },
    timeoutMs,
  );
  if (!ok) return { ok: false, texto: erroLegivel(status, json, texto), status, bruto: texto };

  const saida = (
    json as { choices?: { message?: { content?: string } }[] }
  )?.choices?.[0]?.message?.content?.trim();
  if (!saida) return { ok: false, texto: "a IA devolveu uma resposta vazia" };
  return { ok: true, texto: saida };
}

/** Google Antigravity Agent: executa com os modelos mais rápidos e recentes do Google Gemini. */
async function chamarAntigravity(
  prompt: string,
  historico: HistoricoItem[],
  key: string,
  imagens: Imagem[] = [],
  timeoutMs: number = TIMEOUT_MS,
): Promise<ResultadoIA> {
  return chamarGoogleComFallback(prompt, historico, key, imagens, timeoutMs, "gemini-2.5-flash");
}

export const PROVEDORES_FIXOS = [
  "antigravity",
  "google",
  "groq",
  "openrouter",
  "huggingface",
  "deepseek",
  "zai",
  "omniroute",
] as const;

/** Provedores fixos que falam o padrão da OpenAI: endereço + entende imagem. */
const COMPAT: Record<string, { url: string; imagem: boolean }> = {
  groq: { url: "https://api.groq.com/openai/v1/chat/completions", imagem: false },
  openrouter: { url: "https://openrouter.ai/api/v1/chat/completions", imagem: true },
  huggingface: { url: "https://router.huggingface.co/v1/chat/completions", imagem: false },
  deepseek: { url: "https://api.deepseek.com/v1/chat/completions", imagem: false },
  zai: { url: "https://api.z.ai/api/paas/v4/chat/completions", imagem: false },
};

function endpointOmniRoute(apiUrl?: string) {
  let base = apiUrl?.trim().replace(/\/+$/, "");
  if (!base) return null;
  base = base.replace(/\/(?:home|dashboard(?:\/.*)?)$/i, "");
  if (!/\/v1$/i.test(base) && !base.endsWith("/chat/completions")) base = `${base}/v1`;
  return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
}

/** Permite pedir um modelo específico (usado nos combos da OmniRoute). */
export async function chamarProvedorComModelo(
  providerId: string,
  modelo: string,
  prompt: string,
  historico: HistoricoItem[],
  key: string,
  imagens: Imagem[] = [],
  timeoutMs: number = TIMEOUT_MS,
  apiUrl?: string,
): Promise<ResultadoIA> {
  try {
    if (providerId === "antigravity") {
      const tentativa = await chamarAntigravity(prompt, historico, key, imagens, timeoutMs);
      if (tentativa.ok) return tentativa;
      return await chamarGoogleComFallback(prompt, historico, key, imagens, timeoutMs, modelo);
    }
    if (providerId === "google")
      return await chamarGoogleComFallback(prompt, historico, key, imagens, timeoutMs, modelo);
    const omniUrl = providerId === "omniroute" ? endpointOmniRoute(apiUrl) : null;
    if (providerId === "omniroute" && !omniUrl) {
      return {
        ok: false,
        texto: "informe o endereço HTTPS público do seu OmniRoute nas configurações",
      };
    }
    const fixo = omniUrl ? { url: omniUrl, imagem: true } : COMPAT[providerId];
    if (!fixo) return { ok: false, texto: "provedor desconhecido" };
    return await chamarOpenAICompat(
      fixo.url,
      modelo,
      prompt,
      historico,
      key,
      imagens,
      fixo.imagem,
      timeoutMs,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, texto: `falha de conexão: ${msg}` };
  }
}

export async function chamarProvedor(
  providerId: string,
  prompt: string,
  historico: HistoricoItem[],
  key: string,
  imagens: Imagem[] = [],
  provedoresCustom: ProvedorCustom[] = [],
  timeoutMs: number = TIMEOUT_MS,
  apiUrl?: string,
  modeloDesejado?: string,
): Promise<ResultadoIA> {
  try {
    const principal = modeloDesejado || MODELS[providerId as keyof typeof MODELS];
    const lista = MODELOS_ALTERNATIVOS[providerId] ?? (principal ? [principal] : []);
    const modelos = [...new Set([principal, ...lista].filter(Boolean))] as string[];

    if (providerId === "antigravity") {
      const tentativa = await chamarAntigravity(prompt, historico, key, imagens, timeoutMs);
      if (tentativa.ok) return tentativa;
      // Se não tiver preview ativo ou houver erro, fallback resiliente para lista de modelos Google
      return await chamarGoogleComFallback(
        prompt,
        historico,
        key,
        imagens,
        timeoutMs,
        modeloDesejado,
      );
    }

    if (providerId === "google") {
      return await chamarGoogleComFallback(prompt, historico, key, imagens, timeoutMs, principal);
    }

    const omniUrl = providerId === "omniroute" ? endpointOmniRoute(apiUrl) : null;
    if (providerId === "omniroute" && !omniUrl) {
      return {
        ok: false,
        texto: "informe o endereço HTTPS público do seu OmniRoute nas configurações",
      };
    }
    const fixo = omniUrl ? { url: omniUrl, imagem: true } : COMPAT[providerId];
    if (fixo) {
      let ultimo: ResultadoIA = { ok: false, texto: "provedor desconhecido" };
      let modelosParaTentar = modelos;
      const inicio = Date.now();
      for (let indice = 0; indice < modelosParaTentar.length; indice += 1) {
        if (Date.now() - inicio > ORCAMENTO_TOTAL_MS) {
          return {
            ...ultimo,
            texto: `${ultimo.texto} (parei de tentar outros modelos após ${Math.round((Date.now() - inicio) / 1000)}s para não deixar a pessoa esperando; tente novamente ou troque de modelo)`,
          };
        }
        const modelo = modelosParaTentar[indice];
        if (!modelo) continue;
        const r = await chamarOpenAICompat(
          fixo.url,
          modelo,
          prompt,
          historico,
          key,
          imagens,
          fixo.imagem,
          timeoutMs,
        );
        if (r.ok) return r;
        ultimo = r;
        if (!ehFalhaDeModelo(r.status ?? 0, r.bruto ?? r.texto)) return r;
        if (indice === modelos.length - 1 && Date.now() - inicio <= ORCAMENTO_TOTAL_MS) {
          const descobertos = await descobrirModelos(fixo.url, key);
          modelosParaTentar = [...new Set([...modelosParaTentar, ...descobertos])];
        }
      }
      return ultimo;
    }

    const custom = provedoresCustom.find((p) => p.slug === providerId);
    if (custom) {
      const url = custom.url.replace(/\/+$/, "");
      const alvo = url.endsWith("/chat/completions") ? url : `${url}/chat/completions`;
      return await chamarOpenAICompat(
        alvo,
        custom.modelo,
        prompt,
        historico,
        key,
        imagens,
        custom.suporta_imagem,
        timeoutMs,
      );
    }

    return { ok: false, texto: "provedor desconhecido" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/timeout|aborted/i.test(msg)) {
      return { ok: false, texto: "a IA demorou além do limite nesta tentativa" };
    }
    if (providerId === "omniroute") {
      return {
        ok: false,
        texto: `não foi possível alcançar o OmniRoute. Confirme que ele está rodando e que o endereço HTTPS público está ativo (${msg})`,
      };
    }
    return { ok: false, texto: `falha de conexão: ${msg}` };
  }
}

export function textoDeAnexos(anexos: Anexo[]) {
  const textos = anexos.filter((a) => a.tipo === "texto");
  if (!textos.length) return "";
  return textos
    .map((a) => `--- Conteúdo de ${a.nome} ---\n${(a as { texto: string }).texto}`)
    .join("\n\n");
}
