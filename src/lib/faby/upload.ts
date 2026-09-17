import {
  EXTENSOES_IMAGEM,
  EXTENSOES_TEXTO,
  LIMITE_CHARS_ARQUIVO,
  TAMANHO_MAX_MB,
  type Anexo,
} from "./config";

function extensao(nome: string) {
  const i = nome.lastIndexOf(".");
  return i === -1 ? "" : nome.slice(i).toLowerCase();
}

/** Lê o arquivo no próprio navegador e devolve um anexo pronto pra mensagem. */
export async function lerAnexo(file: File): Promise<{ anexo?: Anexo; erro?: string }> {
  if (file.size / (1024 * 1024) > TAMANHO_MAX_MB) {
    return { erro: `Arquivo muito grande (máx ${TAMANHO_MAX_MB}MB)` };
  }

  const ext = extensao(file.name);

  if (EXTENSOES_IMAGEM.includes(ext)) {
    const buffer = await file.arrayBuffer();
    let binario = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 8192) {
      binario += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    const b64 = btoa(binario);
    const mime = file.type || "image/png";
    return {
      anexo: {
        tipo: "imagem",
        nome: file.name,
        mime,
        data: b64,
        preview: `data:${mime};base64,${b64}`,
      },
    };
  }

  if (EXTENSOES_TEXTO.includes(ext)) {
    const bruto = await file.text();
    return {
      anexo: {
        tipo: "texto",
        nome: file.name,
        texto: bruto.slice(0, LIMITE_CHARS_ARQUIVO),
        cortado: bruto.length > LIMITE_CHARS_ARQUIVO,
      },
    };
  }

  return {
    erro: `Tipo não suportado (${ext || "sem extensão"}). Aceito: ${[...EXTENSOES_IMAGEM, ...EXTENSOES_TEXTO].join(", ")}`,
  };
}
