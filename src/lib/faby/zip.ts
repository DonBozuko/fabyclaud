import JSZip from "jszip";

/** Extensões de texto/código que valem a pena trazer de um .zip. */
export const EXT_ZIP = [
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".md",
  ".txt",
  ".py",
  ".rb",
  ".php",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".cs",
  ".c",
  ".h",
  ".cpp",
  ".swift",
  ".yml",
  ".yaml",
  ".toml",
  ".ini",
  ".cfg",
  ".env",
  ".xml",
  ".sh",
  ".sql",
  ".vue",
  ".svelte",
  ".erb",
  ".ejs",
  ".hbs",
];

const PASTAS_IGNORADAS = [
  "node_modules",
  "vendor",
  ".git",
  "dist",
  "build",
  ".next",
  "__pycache__",
  ".venv",
  "venv",
  "env",
  "coverage",
  ".cache",
  ".idea",
  ".vscode",
  ".pytest_cache",
];

export type ResultadoImportacao = {
  nome: string;
  arquivos: Record<string, string>;
  ignorados: number;
  limitados: boolean;
};

function caminhoAceito(nome: string) {
  return (
    EXT_ZIP.some((ext) => nome.toLowerCase().endsWith(ext)) &&
    !nome.split("/").some((parte) => PASTAS_IGNORADAS.includes(parte))
  );
}

/** Lê um .zip no próprio navegador e devolve os arquivos de texto num objeto. */
export async function lerZipDoNavegador(
  arquivo: File,
  maxArquivos = 1000,
): Promise<ResultadoImportacao> {
  const zip = await JSZip.loadAsync(arquivo);
  const arquivos: Record<string, string> = {};
  const entradas = Object.values(zip.files).filter((e) => !e.dir);
  let ignorados = 0;
  let limitados = false;
  let totalBytes = 0;

  // Remove a pasta-raiz única (ex.: "chef-main/...") pra encurtar os caminhos.
  const primeiro = entradas[0]?.name ?? "";
  const raiz = primeiro.includes("/") ? primeiro.split("/")[0] + "/" : "";
  const tudoDentroDaRaiz = raiz !== "" && entradas.every((e) => e.name.startsWith(raiz));

  const ordenadas = [...entradas].sort((a, b) => prioridade(a.name) - prioridade(b.name));

  for (const entrada of ordenadas) {
    const nome = tudoDentroDaRaiz ? entrada.name.slice(raiz.length) : entrada.name;
    if (!nome) continue;
    if (!caminhoAceito(nome)) {
      ignorados += 1;
      continue;
    }
    if (Object.keys(arquivos).length >= maxArquivos) {
      limitados = true;
      ignorados += 1;
      continue;
    }
    const texto = await entrada.async("string");
    if (texto.length >= 400_000 || totalBytes + texto.length > 15_000_000) {
      ignorados += 1;
      limitados = true;
      continue;
    }
    arquivos[nome] = texto;
    totalBytes += texto.length;
  }

  const nome = arquivo.name.replace(/\.zip$/i, "").slice(0, 80) || "Projeto importado";
  return { nome, arquivos, ignorados, limitados };
}

/** Lê uma pasta escolhida no navegador, preservando subpastas e sem executar o código. */
export async function lerPastaDoNavegador(
  selecionados: File[],
  maxArquivos = 1000,
): Promise<ResultadoImportacao> {
  const arquivos: Record<string, string> = {};
  let ignorados = 0;
  let limitados = false;
  let totalBytes = 0;
  const primeiroCaminho = selecionados[0]?.webkitRelativePath || selecionados[0]?.name || "";
  const raiz = primeiroCaminho.includes("/")
    ? (primeiroCaminho.split("/")[0] ?? "Projeto importado")
    : "Projeto importado";

  const ordenados = [...selecionados].sort(
    (a, b) =>
      prioridade(a.webkitRelativePath || a.name) - prioridade(b.webkitRelativePath || b.name),
  );

  for (const arquivo of ordenados) {
    const relativo = arquivo.webkitRelativePath || arquivo.name;
    const partes = relativo.split("/");
    const nome = partes.length > 1 ? partes.slice(1).join("/") : relativo;
    if (!nome || !caminhoAceito(nome) || arquivo.size >= 400_000) {
      ignorados += 1;
      continue;
    }
    if (totalBytes + arquivo.size > 15_000_000) {
      ignorados += 1;
      limitados = true;
      continue;
    }
    if (Object.keys(arquivos).length >= maxArquivos) {
      limitados = true;
      ignorados += 1;
      continue;
    }
    arquivos[nome] = await arquivo.text();
    totalBytes += arquivo.size;
  }

  return {
    nome: raiz.slice(0, 80) || "Projeto importado",
    arquivos,
    ignorados,
    limitados,
  };
}

function prioridade(nome: string) {
  const caminho = nome.toLowerCase();
  if (/(^|\/)index\.html?$/.test(caminho)) return 0;
  if (/(^|\/)(package\.json|vite\.config\.[^/]+|app\.py|readme\.md)$/.test(caminho)) return 1;
  if (/\.(css|js|jsx|ts|tsx)$/.test(caminho)) return 2;
  return 3;
}
