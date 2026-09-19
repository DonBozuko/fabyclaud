import { MODELOS_ALTERNATIVOS, MODELS, ehErroDeModelo } from "./config";
import type { Anexo, ProvedorCustom } from "./config";

type HistoricoItem = { role: "user" | "assistant"; conteudo: string };
type Imagem = { mime: string; data: string };

export type ResultadoIA = { ok: boolean; texto: string; status?: number; bruto?: string };

const TIMEOUT_MS = 120_000;

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

function prepararHistorico(historico: HistoricoItem[]) {
  // O provedor não guarda conversa. Reenviar todo o histórico evita que uma
  // confirmação curta ("sim", "pode fazer") perca a tarefa combinada antes.
  return historico.map((item) => ({ ...item, conteudo: resumirTexto(item.conteudo, 8_000) }));
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
  const contents = prepararHistorico(historico).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.conteudo }],
  }));

  const partesAtuais: unknown[] = [{ text: prompt }];
  for (const img of imagens) {
    partesAtuais.push({ inline_data: { mime_type: img.mime, data: img.data } });
  }
  contents.push({ role: "user", parts: partesAtuais as { text: string }[] });

  // Retry com espera em caso de 503 (alta demanda / sobrecarga temporária)
  let tentativas = 0;
  const maxTentativas = 3;
  while (tentativas < maxTentativas) {
    tentativas++;
    const { ok, status, json, texto } = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${modeloLimpo}:generateContent`,
      { "x-goog-api-key": key },
      { contents },
      timeoutMs,
    );

    if (status === 503 && tentativas < maxTentativas) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * tentativas));
      continue;
    }

    if (!ok) return { ok: false, texto: erroLegivel(status, json, texto), status, bruto: texto };

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
  const lista = MODELOS_ALTERNATIVOS['google'] ?? [];
  let modelosGoogle = [...new Set([principal, ...lista].filter(Boolean))];

  let ultimo: ResultadoIA = { ok: false, texto: "provedor Google indisponível" };
  for (let i = 0; i < modelosGoogle.length; i++) {
    const modelo = modelosGoogle[i];
    if (!modelo) continue;
    const r = await chamarGoogle(prompt, historico, key, imagens, timeoutMs, modelo);
    if (r.ok) return r;
    ultimo = r;
    if (!ehErroDeModelo(r.status ?? 0, r.bruto ?? r.texto)) return r;
    if (i === modelosGoogle.length - 1) {
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
  type Msg = { role: string; content: unknown };
  const teto = limiteEntrada(url);
  const historicoCurto = prepararHistorico(historico).map((m) => ({
    role: m.role,
    content: resumirTexto(m.conteudo, 2_500),
  }));
  const usadoNoHistorico = historicoCurto.reduce(
    (total, item) => total + (typeof item.content === "string" ? item.content.length : 0),
    0,
  );
  const promptAjustado = resumirTexto(prompt, Math.max(8_000, teto - usadoNoHistorico));
  const messages: Msg[] = historicoCurto;

  if (imagens.length && suportaImagem) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: promptAjustado },
        ...imagens.map((img) => ({
          type: "image_url",
          image_url: { url: `data:${img.mime};base64,${img.data}` },
        })),
      ],
    });
  } else {
    messages.push({ role: "user", content: promptAjustado });
  }

  const { ok, status, json, texto } = await postJson(
    url,
    { Authorization: `Bearer ${key}` },
    { model: modelo, messages, temperature: 0.7 },
    timeoutMs,
  );
  if (!ok) return { ok: false, texto: erroLegivel(status, json, texto), status, bruto: texto };

  const saida = (
    json as { choices?: { message?: { content?: string } }[] }
  )?.choices?.[0]?.message?.content?.trim();
  if (!saida) return { ok: false, texto: "a IA devolveu uma resposta vazia" };
  return { ok: true, texto: saida };
}

/** Google Antigravity Agent API (Loop agêntico com sandbox Linux, execução, testes e entrega). */
async function chamarAntigravity(
  prompt: string,
  historico: HistoricoItem[],
  key: string,
  imagens: Imagem[] = [],
  timeoutMs: number = TIMEOUT_MS,
): Promise<ResultadoIA> {
  try {
    const inputCompleto = historico.length
      ? `${historico.map((h) => `${h.role === "assistant" ? "Assistente" : "Usuário"}: ${h.conteudo}`).join("\n\n")}\n\nUsuário: ${prompt}`
      : prompt;

    const urlCriar = "https://generativelanguage.googleapis.com/v1beta/interactions";
    const headers: Record<string, string> = {
      "x-goog-api-key": key,
      "Content-Type": "application/json",
    };

    const corpo = {
      agent: "antigravity-preview-05-2026",
      input: inputCompleto,
      environment: "remote",
      background: true,
    };

    let tentativasCriacao = 0;
    let ok = false;
    let status = 0;
    let json: unknown = null;
    let texto = "";

    while (tentativasCriacao < 3) {
      tentativasCriacao++;
      const resCriar = await postJson(
        urlCriar,
        headers,
        corpo,
        Math.min(timeoutMs, 25_000),
      );
      ok = resCriar.ok;
      status = resCriar.status;
      json = resCriar.json;
      texto = resCriar.texto;

      if (status === 503 && tentativasCriacao < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * tentativasCriacao));
        continue;
      }
      break;
    }

    if (!ok) {
      // Se a chave não tiver acesso ao preview ou o endpoint não estiver disponível, repassa erro com status
      return { ok: false, status, texto: erroLegivel(status, json, texto), bruto: texto };
    }

    const respostaObj = json as Record<string, unknown> | null;
    const saidaSincrona =
      (respostaObj?.['output'] as { text?: string } | undefined)?.text ??
      (respostaObj?.['result'] as { text?: string } | undefined)?.text ??
      (respostaObj?.['response'] as { text?: string } | undefined)?.text ??
      (typeof respostaObj?.['output'] === "string" ? (respostaObj['output'] as string) : null);

    if (saidaSincrona && typeof saidaSincrona === "string" && saidaSincrona.trim()) {
      return { ok: true, texto: saidaSincrona.trim() };
    }

    const interactionId = (respostaObj?.['id'] ?? respostaObj?.['name']) as string | undefined;
    if (!interactionId) {
      if (texto && texto.length > 50) {
        return { ok: true, texto };
      }
      return {
        ok: false,
        status,
        texto: "Antigravity não retornou ID de interação para acompanhamento",
      };
    }

    // Polling em background com intervalo seguro
    const inicio = Date.now();
    const tempoMaximo = Math.max(30_000, timeoutMs);
    const urlStatus = interactionId.startsWith("http")
      ? interactionId
      : `https://generativelanguage.googleapis.com/v1beta/interactions/${encodeURIComponent(interactionId)}`;

    while (Date.now() - inicio < tempoMaximo) {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      try {
        const res = await fetch(urlStatus, {
          method: "GET",
          headers: { "x-goog-api-key": key },
          signal: AbortSignal.timeout(15_000),
        });

        const textoStatus = await res.text();
        let jsonStatus: any = null;
        try {
          jsonStatus = JSON.parse(textoStatus);
        } catch {}

        if (res.status === 503) {
          // Temporariamente ocupado, aguarda próximo ciclo de polling
          continue;
        }

        if (!res.ok) {
          return {
            ok: false,
            status: res.status,
            texto: erroLegivel(res.status, jsonStatus, textoStatus),
            bruto: textoStatus,
          };
        }

        const estado = String(jsonStatus?.status ?? jsonStatus?.state ?? "").toUpperCase();

        if (
          estado === "COMPLETED" ||
          estado === "SUCCEEDED" ||
          estado === "SUCCESS" ||
          estado === "DONE"
        ) {
          const saida =
            jsonStatus?.output?.text ??
            jsonStatus?.result?.text ??
            jsonStatus?.response?.text ??
            jsonStatus?.output?.artifacts?.[0]?.content ??
            (typeof jsonStatus?.output === "string" ? jsonStatus.output : "") ??
            (typeof jsonStatus?.result === "string" ? jsonStatus.result : "");

          if (saida && typeof saida === "string" && saida.trim()) {
            return { ok: true, texto: saida.trim() };
          }

          if (jsonStatus?.artifacts && Array.isArray(jsonStatus.artifacts)) {
            const concatenado = jsonStatus.artifacts
              .map((art: any) => art.content ?? art.text ?? "")
              .join("\n\n");
            if (concatenado.trim()) {
              return { ok: true, texto: concatenado.trim() };
            }
          }

          return { ok: true, texto: textoStatus };
        }

        if (estado === "FAILED" || estado === "ERROR" || estado === "CANCELLED") {
          const motivo =
            jsonStatus?.error?.message ?? jsonStatus?.error ?? "execução falhou no sandbox";
          return { ok: false, status: 500, texto: `Antigravity: ${motivo}`, bruto: textoStatus };
        }
      } catch {
        // Ignora erro transitório de rede durante polling
      }
    }

    return { ok: false, status: 408, texto: "tempo limite de execução do Antigravity atingido" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, texto: `Antigravity indisponível: ${msg}` };
  }
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
      return await chamarGoogleComFallback(
        prompt,
        historico,
        key,
        imagens,
        timeoutMs,
        modelo,
      );
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
      return await chamarGoogleComFallback(
        prompt,
        historico,
        key,
        imagens,
        timeoutMs,
        principal,
      );
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
      for (let indice = 0; indice < modelosParaTentar.length; indice += 1) {
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
        if (indice === modelos.length - 1) {
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
