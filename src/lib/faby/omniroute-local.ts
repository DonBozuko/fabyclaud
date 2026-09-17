const STORAGE_KEY = "fabyclaud_omniroute_local";

export type OmniRouteLocalConfig = { apiUrl: string; apiKey: string; pronta: boolean };

export function normalizarOmniRouteLocal(valor: string) {
  let base = valor.trim().replace(/\/+$/, "");
  if (!base) base = "http://localhost:20128";
  base = base.replace(/\/(?:home|dashboard(?:\/.*)?)$/i, "");
  if (!/\/v1$/i.test(base)) base = `${base}/v1`;
  return base;
}

export function lerOmniRouteLocal(): OmniRouteLocalConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const valor = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as OmniRouteLocalConfig | null;
    return valor?.apiKey ? valor : null;
  } catch {
    return null;
  }
}

export function salvarOmniRouteLocal(config: OmniRouteLocalConfig) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function apagarOmniRouteLocal() {
  window.localStorage.removeItem(STORAGE_KEY);
}

function mensagemFalha(error: unknown) {
  const detalhe = error instanceof Error ? error.message : String(error);
  if (/failed to fetch|networkerror|load failed/i.test(detalhe)) {
    return "O navegador não alcançou o OmniRoute. Confirme que o comando omniroute está aberto e permita a origem do FabyClaud nas configurações de CORS do OmniRoute.";
  }
  return `Falha ao acessar o OmniRoute local: ${detalhe}`;
}

async function lerResposta(response: Response) {
  const texto = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(texto);
  } catch {
    if (/<!doctype html|<html[\s>]/i.test(texto)) {
      throw new Error(
        "O endereço abriu o painel visual, não a API. Use http://localhost:20128 ou /v1.",
      );
    }
  }
  if (!response.ok) {
    const obj = json as { error?: { message?: string } | string; message?: string } | null;
    const erro = typeof obj?.error === "string" ? obj.error : (obj?.error?.message ?? obj?.message);
    throw new Error(erro || `OmniRoute respondeu com erro ${response.status}.`);
  }
  return json;
}

export async function testarOmniRouteLocal(apiUrl: string, apiKey: string) {
  const base = normalizarOmniRouteLocal(apiUrl);
  try {
    const modelos = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    await lerResposta(modelos);
    const resposta = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "auto/coding",
        messages: [{ role: "user", content: "Responda somente: OK" }],
      }),
    });
    const json = (await lerResposta(resposta)) as {
      choices?: { message?: { content?: string } }[];
    };
    if (!json?.choices?.[0]?.message?.content?.trim())
      throw new Error("A rota respondeu sem texto.");
    return { ok: true as const, apiUrl: base };
  } catch (error) {
    return { ok: false as const, msg: mensagemFalha(error), apiUrl: base };
  }
}

export async function chamarOmniRouteLocal(
  prompt: string,
  imagens: { mime: string; data: string }[] = [],
) {
  const config = lerOmniRouteLocal();
  if (!config?.pronta)
    return { ok: false as const, msg: "Teste o OmniRoute local nas Configurações antes de usar." };
  const conteudoUsuario = imagens.length
    ? [
        { type: "text", text: prompt },
        ...imagens.map((img) => ({
          type: "image_url",
          image_url: { url: `data:${img.mime};base64,${img.data}` },
        })),
      ]
    : prompt;
  try {
    const response = await fetch(`${normalizarOmniRouteLocal(config.apiUrl)}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "auto/coding",
        messages: [
          {
            role: "system",
            content:
              'Você é o motor de programação do FabyClaud. Entregue solução completa e profissional, incluindo frontend, backend e banco real quando pedidos. Para criar ou alterar arquivos, use blocos <arquivo nome="caminho">conteúdo completo</arquivo>. Nunca simule backend ou banco com localStorage.',
          },
          { role: "user", content: conteudoUsuario },
        ],
      }),
    });
    const json = (await lerResposta(response)) as {
      choices?: { message?: { content?: string } }[];
    };
    const texto = json?.choices?.[0]?.message?.content?.trim();
    if (!texto) throw new Error("A IA escolhida pelo OmniRoute não devolveu texto.");
    return { ok: true as const, texto };
  } catch (error) {
    return { ok: false as const, msg: mensagemFalha(error) };
  }
}
