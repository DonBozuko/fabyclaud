/**
 * Motor de Git do FabyClaud: conversa direto com a API do GitHub usando o token
 * pessoal do próprio usuário. Faz commit de verdade (blob -> tree -> commit ->
 * push no branch), lê o repositório de volta e lista o histórico.
 */

const API = "https://api.github.com";

type Resposta<T> = { ok: true; data: T } | { ok: false; msg: string; status: number };

async function chamar<T>(
  token: string,
  caminho: string,
  init: RequestInit = {},
): Promise<Resposta<T>> {
  const r = await fetch(`${API}${caminho}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      // Sem token também funciona para repositórios públicos (com limite menor).
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "FabyClaud",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers as Record<string, string>),
    },
  });

  const texto = await r.text();
  if (!r.ok) {
    let msg = texto.slice(0, 300);
    try {
      const j = JSON.parse(texto) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      /* mantém o texto cru */
    }
    if (r.status === 401) msg = "Token inválido ou expirado. Gere um novo no GitHub.";
    if (r.status === 403 && /rate limit/i.test(msg)) {
      msg = "O GitHub bloqueou por excesso de pedidos. Tente de novo em alguns minutos.";
    }
    if (r.status === 404) msg = `Não encontrado no GitHub (${caminho}). Confira o repositório.`;
    return { ok: false, msg, status: r.status };
  }
  return { ok: true, data: (texto ? JSON.parse(texto) : {}) as T };
}

const paraBase64 = (texto: string) => Buffer.from(texto, "utf8").toString("base64");
const deBase64 = (b64: string) => Buffer.from(b64.replace(/\n/g, ""), "base64").toString("utf8");

/** Quem é o dono do token (e se o token funciona). */
export async function verificarToken(token: string) {
  const r = await chamar<{ login: string; name: string | null }>(token, "/user");
  if (!r.ok) return { ok: false as const, msg: r.msg };
  return { ok: true as const, login: r.data.login, nome: r.data.name ?? r.data.login };
}

export async function listarRepositorios(token: string) {
  const r = await chamar<
    { full_name: string; private: boolean; default_branch: string; html_url: string }[]
  >(token, "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator");
  if (!r.ok) return { ok: false as const, msg: r.msg };
  return {
    ok: true as const,
    repos: r.data.map((x) => ({
      full_name: x.full_name,
      privado: x.private,
      branch: x.default_branch,
      url: x.html_url,
    })),
  };
}

export async function criarRepositorio(token: string, nome: string, privado: boolean) {
  const r = await chamar<{ full_name: string; default_branch: string; html_url: string }>(
    token,
    "/user/repos",
    {
      method: "POST",
      body: JSON.stringify({
        name: nome,
        private: privado,
        auto_init: true,
        description: "Criado pelo FabyClaud",
      }),
    },
  );
  if (!r.ok) return { ok: false as const, msg: r.msg };
  return {
    ok: true as const,
    repo: r.data.full_name,
    branch: r.data.default_branch || "main",
    url: r.data.html_url,
  };
}

/** Descobre o branch padrão do repositório. */
export async function branchPadrao(token: string, repo: string) {
  const r = await chamar<{ default_branch: string }>(token, `/repos/${repo}`);
  return r.ok ? r.data.default_branch || "main" : null;
}

/**
 * Commit + push de todos os arquivos de uma vez, do jeito que um programador
 * faria: cria os blobs, monta a árvore, faz o commit e move o branch.
 */
export async function enviarArquivos(opcoes: {
  token: string;
  repo: string;
  branch: string;
  mensagem: string;
  arquivos: Record<string, string>;
}) {
  const { token, repo, branch, mensagem, arquivos } = opcoes;
  const nomes = Object.keys(arquivos);
  if (!nomes.length) return { ok: false as const, msg: "Não há arquivos para enviar." };

  // 1. onde o branch está hoje (se o repositório estiver vazio, cria o começo)
  let refSha: string | null = null;
  const ref = await chamar<{ object: { sha: string } }>(
    token,
    `/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  if (ref.ok) {
    refSha = ref.data.object.sha;
  } else if (ref.status === 404 || ref.status === 409) {
    const inicio = await chamar<{ commit: { sha: string } }>(
      token,
      `/repos/${repo}/contents/README.md`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: "Primeiro commit pelo FabyClaud",
          content: paraBase64(`# ${repo.split("/")[1] ?? "Projeto"}\n\nCriado pelo FabyClaud.\n`),
          branch,
        }),
      },
    );
    if (!inicio.ok) return { ok: false as const, msg: inicio.msg };
    refSha = inicio.data.commit.sha;
  } else {
    return { ok: false as const, msg: ref.msg };
  }

  // 2. árvore atual (pra preservar arquivos que não estamos mexendo)
  const commitAtual = await chamar<{ tree: { sha: string } }>(
    token,
    `/repos/${repo}/git/commits/${refSha}`,
  );
  if (!commitAtual.ok) return { ok: false as const, msg: commitAtual.msg };

  // 3. blobs
  const blobs: { path: string; sha: string }[] = [];
  for (const nome of nomes) {
    const blob = await chamar<{ sha: string }>(token, `/repos/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: paraBase64(arquivos[nome] ?? ""), encoding: "base64" }),
    });
    if (!blob.ok) return { ok: false as const, msg: blob.msg };
    blobs.push({ path: nome, sha: blob.data.sha });
  }

  // 4. árvore nova
  const arvore = await chamar<{ sha: string }>(token, `/repos/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: commitAtual.data.tree.sha,
      tree: blobs.map((b) => ({ path: b.path, mode: "100644", type: "blob", sha: b.sha })),
    }),
  });
  if (!arvore.ok) return { ok: false as const, msg: arvore.msg };

  // 5. commit
  const commit = await chamar<{ sha: string; html_url: string }>(
    token,
    `/repos/${repo}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({ message: mensagem, tree: arvore.data.sha, parents: [refSha] }),
    },
  );
  if (!commit.ok) return { ok: false as const, msg: commit.msg };

  // 6. push (move o branch pro commit novo)
  const push = await chamar<unknown>(
    token,
    `/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    { method: "PATCH", body: JSON.stringify({ sha: commit.data.sha, force: false }) },
  );
  if (!push.ok) return { ok: false as const, msg: push.msg };

  return {
    ok: true as const,
    sha: commit.data.sha.slice(0, 7),
    qtd: nomes.length,
    url: `https://github.com/${repo}/commit/${commit.data.sha}`,
  };
}

const EXT_TEXTO = [
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".txt",
  ".svg",
  ".ts",
  ".jsx",
  ".tsx",
  ".yml",
  ".yaml",
  ".csv",
];

/** Extensões aceitas ao clonar um repositório qualquer (código de várias linguagens). */
const EXT_CLONAR = [
  ...EXT_TEXTO,
  ".rb",
  ".py",
  ".php",
  ".java",
  ".go",
  ".rs",
  ".c",
  ".h",
  ".cpp",
  ".vue",
  ".toml",
  ".ini",
  ".xml",
  ".sh",
  ".sql",
  ".prisma",
  ".erb",
  ".gemspec",
  ".rake",
];

const PASTAS_IGNORAR = ["node_modules/", "vendor/", ".git/", "dist/", "build/", "tmp/"];

/** Extrai "dono/repo" de um link do GitHub (com ou sem .git, barra final etc.). */
export function parseRepoUrl(url: string): string | null {
  const m = url.trim().match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/i);
  return m ? `${m[1]}/${m[2]}` : null;
}

/**
 * Clona um repositório público a partir do link, sem precisar de token.
 * Se houver token salvo, usa pra ter limite maior e alcançar repositórios privados.
 */
export async function clonarRepositorio(token: string, repo: string) {
  const info = await chamar<{ default_branch: string }>(token, `/repos/${repo}`);
  if (!info.ok) return { ok: false as const, msg: info.msg };
  const branch = info.data.default_branch || "main";

  const arvore = await chamar<{
    tree: { path: string; type: string; size?: number }[];
    truncated?: boolean;
  }>(token, `/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  if (!arvore.ok) return { ok: false as const, msg: arvore.msg };

  const alvos = arvore.data.tree
    .filter(
      (t) =>
        t.type === "blob" &&
        EXT_CLONAR.some((e) => t.path.toLowerCase().endsWith(e)) &&
        (t.size ?? 0) < 300_000 &&
        !PASTAS_IGNORAR.some((p) => t.path.startsWith(p)),
    )
    // Prioriza o que importa: README, arquivos da raiz e código principal,
    // deixando configs de pastas escondidas por último.
    .sort((a, b) => {
      const pontos = (p: string) => {
        let s = 0;
        if (/^readme/i.test(p))
          s -= 100; // só o README da raiz ganha destaque
        else if (/readme/i.test(p)) s += 20; // READMEs de subpastas ficam pra depois
        if (!p.includes("/")) s -= 50;
        if (/^(lib|src|app|core|packages)\//i.test(p)) s -= 40;
        if (p.startsWith(".") || p.includes("/.")) s += 30;
        if (/^(spec|test|docs|examples?|kitchen-tests)\//i.test(p)) s += 25;
        s += p.split("/").length * 5;
        return s;
      };
      return pontos(a.path) - pontos(b.path);
    })
    .slice(0, 60);

  if (!alvos.length) {
    return { ok: false as const, msg: "Esse repositório não tem arquivos de texto pra trazer." };
  }

  const arquivos: Record<string, string> = {};
  for (const alvo of alvos) {
    const cru = await fetch(
      `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/${alvo.path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      {
        headers: {
          "User-Agent": "FabyClaud",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    if (!cru.ok) continue;
    const texto = await cru.text();
    if (texto.length < 400_000) arquivos[alvo.path] = texto;
  }

  if (!Object.keys(arquivos).length) {
    return { ok: false as const, msg: "Não consegui baixar os arquivos desse repositório." };
  }
  return { ok: true as const, arquivos, branch };
}

/** Traz os arquivos do repositório de volta pro projeto (para corrigir por aqui). */
export async function baixarArquivos(token: string, repo: string, branch: string) {
  const arvore = await chamar<{
    tree: { path: string; type: string; size?: number; sha: string }[];
  }>(token, `/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  if (!arvore.ok) return { ok: false as const, msg: arvore.msg };

  const alvos = arvore.data.tree
    .filter(
      (t) =>
        t.type === "blob" &&
        EXT_TEXTO.some((e) => t.path.toLowerCase().endsWith(e)) &&
        (t.size ?? 0) < 300_000 &&
        !t.path.startsWith(".github/"),
    )
    .slice(0, 40);

  if (!alvos.length) {
    return { ok: false as const, msg: "Esse repositório não tem arquivos de site pra trazer." };
  }

  const arquivos: Record<string, string> = {};
  for (const alvo of alvos) {
    const blob = await chamar<{ content: string; encoding: string }>(
      token,
      `/repos/${repo}/git/blobs/${alvo.sha}`,
    );
    if (!blob.ok) return { ok: false as const, msg: blob.msg };
    arquivos[alvo.path] =
      blob.data.encoding === "base64" ? deBase64(blob.data.content) : blob.data.content;
  }
  return { ok: true as const, arquivos };
}

export async function listarCommits(token: string, repo: string, branch: string) {
  const r = await chamar<
    {
      sha: string;
      html_url: string;
      commit: { message: string; author: { name: string; date: string } };
    }[]
  >(token, `/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=15`);
  if (!r.ok) return { ok: false as const, msg: r.msg };
  return {
    ok: true as const,
    commits: r.data.map((c) => ({
      sha: c.sha.slice(0, 7),
      mensagem: c.commit.message.split("\n")[0] ?? "",
      autor: c.commit.author?.name ?? "",
      data: c.commit.author?.date ?? "",
      url: c.html_url,
    })),
  };
}

/** Liga o GitHub Pages: o site fica online de graça no endereço do GitHub. */
export async function ligarPages(token: string, repo: string, branch: string) {
  const r = await chamar<{ html_url: string }>(token, `/repos/${repo}/pages`, {
    method: "POST",
    body: JSON.stringify({ source: { branch, path: "/" } }),
  });
  if (r.ok) return { ok: true as const, url: r.data.html_url };
  if (r.status === 409) {
    const atual = await chamar<{ html_url: string }>(token, `/repos/${repo}/pages`);
    if (atual.ok) return { ok: true as const, url: atual.data.html_url };
  }
  return { ok: false as const, msg: r.msg };
}
