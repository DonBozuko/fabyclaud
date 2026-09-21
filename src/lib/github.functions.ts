import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { verificarPublicacaoEstatica } from "./faby/preview";
import {
  obterGithubContaArmazenada,
  salvarGithubContaArmazenada,
  apagarGithubContaArmazenada,
  salvarProjetoArmazenado,
  obterProjetoArmazenado,
  salvarMensagemArmazenada,
} from "./faby/storage.server";

function extrairUserIds(context: {
  userId: string;
  deviceId?: string | null;
  localUserId?: string | null;
  isAutenticadoSupabase?: boolean;
}): string[] {
  const id =
    context.userId && context.userId !== "00000000-0000-0000-0000-000000000001"
      ? context.userId
      : context.deviceId && context.deviceId !== "00000000-0000-0000-0000-000000000001"
        ? context.deviceId
        : context.localUserId && context.localUserId !== "00000000-0000-0000-0000-000000000001"
          ? context.localUserId
          : context.userId || "anon-user";
  return [id];
}

async function obterConta(context: any) {
  const uids = extrairUserIds(context);
  try {
    const { data, error } = await context.supabase
      .from("github_contas")
      .select("token, repo, branch, login")
      .maybeSingle();
    if (!error && data?.token) return data;
  } catch {
    // ignore
  }
  return obterGithubContaArmazenada(uids);
}

/** Situação da ligação com o GitHub (nunca devolve o token). */
export const statusGithub = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const conta = await obterConta(context);
    return {
      conectado: Boolean(conta?.token),
      login: conta?.login ?? "",
      repo: conta?.repo ?? "",
      branch: conta?.branch ?? "main",
    };
  });

export const salvarTokenGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { token: string }) =>
    z.object({ token: z.string().min(20).max(300) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { verificarToken } = await import("./faby/github.server");
    const tokenLimpo = data.token.trim();
    const check = await verificarToken(tokenLimpo);
    if (!check.ok) return { ok: false, msg: check.msg };

    salvarGithubContaArmazenada({
      user_id: context.userId,
      token: tokenLimpo,
      login: check.login,
      repo: "",
      branch: "main",
    });

    try {
      await context.supabase
        .from("github_contas")
        .upsert(
          { user_id: context.userId, token: tokenLimpo, login: check.login },
          { onConflict: "user_id" },
        );
    } catch {
      // fallback persistido no storage local
    }
    return { ok: true, login: check.login };
  });

export const desconectarGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    apagarGithubContaArmazenada(context.userId);
    try {
      await context.supabase.from("github_contas").delete().eq("user_id", context.userId);
    } catch {
      // ignore
    }
    return { ok: true };
  });

export const listarReposGithub = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const conta = await obterConta(context);
    if (!conta?.token)
      return { ok: false as const, msg: "Conecte sua conta do GitHub primeiro.", repos: [] };

    const { listarRepositorios } = await import("./faby/github.server");
    const r = await listarRepositorios(conta.token);
    if (!r.ok) return { ok: false as const, msg: r.msg, repos: [] };
    return { ok: true as const, msg: "", repos: r.repos };
  });

export const criarRepoGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { nome: string; privado: boolean }) =>
    z
      .object({
        nome: z
          .string()
          .min(1)
          .max(80)
          .regex(/^[A-Za-z0-9._-]+$/, "Use só letras, números, ponto, hífen ou sublinhado."),
        privado: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const conta = await obterConta(context);
    if (!conta?.token) return { ok: false, msg: "Conecte sua conta do GitHub primeiro." };

    const { criarRepositorio } = await import("./faby/github.server");
    const r = await criarRepositorio(conta.token, data.nome, data.privado);
    if (!r.ok) return { ok: false, msg: r.msg };

    salvarGithubContaArmazenada({
      ...conta,
      user_id: context.userId,
      token: conta.token,
      login: conta.login || "",
      repo: r.repo,
      branch: r.branch,
    });

    try {
      await context.supabase
        .from("github_contas")
        .update({ repo: r.repo, branch: r.branch })
        .eq("user_id", context.userId);
    } catch {
      // ignore
    }
    return { ok: true, repo: r.repo, url: r.url };
  });

export const definirRepoGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { repo: string; branch?: string }) =>
    z
      .object({ repo: z.string().min(3).max(140), branch: z.string().max(80).default("") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const conta = await obterConta(context);
    if (!conta?.token) return { ok: false, msg: "Conecte sua conta do GitHub primeiro." };

    const { branchPadrao } = await import("./faby/github.server");
    const branch = data.branch || (await branchPadrao(conta.token, data.repo)) || "main";

    salvarGithubContaArmazenada({
      ...conta,
      user_id: context.userId,
      token: conta.token,
      login: conta.login || "",
      repo: data.repo,
      branch,
    });

    try {
      await context.supabase
        .from("github_contas")
        .update({ repo: data.repo, branch })
        .eq("user_id", context.userId);
    } catch {
      // ignore
    }
    return { ok: true, repo: data.repo, branch };
  });

/** Commit + push de todos os arquivos do projeto. */
export const enviarProjetoGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projeto_id: string; mensagem?: string }) =>
    z
      .object({ projeto_id: z.string().uuid(), mensagem: z.string().max(200).default("") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const conta = await obterConta(context);
    let projeto: { nome?: string; arquivos?: Record<string, string> } | null = null;
    try {
      const { data: p } = await context.supabase
        .from("projetos")
        .select("nome, arquivos")
        .eq("id", data.projeto_id)
        .maybeSingle();
      if (p) projeto = p;
    } catch {
      // ignore
    }
    if (!projeto) {
      const localP = obterProjetoArmazenado(data.projeto_id);
      if (localP) projeto = localP;
    }

    if (!conta?.token) return { ok: false, msg: "Conecte sua conta do GitHub primeiro." };
    if (!conta.repo) return { ok: false, msg: "Escolha (ou crie) um repositório antes de enviar." };
    if (!projeto) return { ok: false, msg: "Projeto não encontrado." };

    const arquivos = { ...((projeto.arquivos as Record<string, string>) ?? {}) };
    if (!Object.keys(arquivos).length) {
      return { ok: false, msg: "Esse projeto ainda não tem arquivos." };
    }

    if (!arquivos["README.md"]) {
      arquivos["README.md"] =
        `# ${projeto.nome || "Projeto"}\n\n` +
        "Projeto criado com o FabyClaud.\n\n" +
        "## Como abrir\n\nAbra o `index.html` no navegador.\n\n" +
        "## Como publicar de graça\n\nAtive o GitHub Pages nas configurações do repositório " +
        "(branch principal, pasta raiz) — ou use o botão de publicar dentro do FabyClaud.\n";
    }

    const { enviarArquivos } = await import("./faby/github.server");
    const r = await enviarArquivos({
      token: conta.token,
      repo: conta.repo,
      branch: conta.branch || "main",
      mensagem:
        data.mensagem.trim() || `Atualização de ${projeto.nome || "Projeto"} pelo FabyClaud`,
      arquivos,
    });
    if (!r.ok) return { ok: false, msg: r.msg };
    return { ok: true, sha: r.sha, qtd: r.qtd, url: r.url, repo: conta.repo };
  });

/** Traz o código do repositório pro projeto (para corrigir por aqui e devolver). */
export const importarDoGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projeto_id?: string | null }) =>
    z.object({ projeto_id: z.string().uuid().nullish() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const conta = await obterConta(context);
    if (!conta?.token) return { ok: false, msg: "Conecte sua conta do GitHub primeiro." };
    if (!conta.repo) return { ok: false, msg: "Escolha um repositório primeiro." };

    const { baixarArquivos } = await import("./faby/github.server");
    const r = await baixarArquivos(conta.token, conta.repo, conta.branch || "main");
    if (!r.ok) return { ok: false, msg: r.msg };

    let projetoId = data.projeto_id ?? null;
    if (projetoId) {
      let atual: Record<string, string> = {};
      try {
        const { data: p } = await context.supabase
          .from("projetos")
          .select("arquivos")
          .eq("id", projetoId)
          .maybeSingle();
        if (p?.arquivos) atual = p.arquivos as Record<string, string>;
      } catch {
        // ignore
      }
      if (!Object.keys(atual).length) {
        const localP = obterProjetoArmazenado(projetoId);
        if (localP?.arquivos) atual = localP.arquivos;
      }

      const novosArquivos = { ...atual, ...r.arquivos };
      const localP = obterProjetoArmazenado(projetoId);
      if (localP) {
        salvarProjetoArmazenado({
          ...localP,
          arquivos: novosArquivos,
        });
      }

      try {
        if (Object.keys(atual).length) {
          await context.supabase.from("backups").insert({
            user_id: context.userId,
            projeto_id: projetoId,
            rotulo: "Antes de trazer do GitHub",
            arquivos: atual as unknown as never,
          });
        }
        await context.supabase
          .from("projetos")
          .update({ arquivos: novosArquivos as unknown as never })
          .eq("id", projetoId);
      } catch {
        // ignore
      }
    } else {
      const novoId = crypto.randomUUID();
      const nome = conta.repo.split("/")[1] ?? conta.repo;
      salvarProjetoArmazenado({
        id: novoId,
        user_id: context.userId,
        nome,
        modelo: "google",
        arquivos: r.arquivos as Record<string, string>,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      try {
        await context.supabase.from("projetos").insert({
          id: novoId,
          user_id: context.userId,
          nome,
          modelo: "google",
          arquivos: r.arquivos as unknown as never,
        });
      } catch {
        // ignore
      }
      projetoId = novoId;
    }

    return { ok: true, projeto_id: projetoId, qtd: Object.keys(r.arquivos).length };
  });

/** Clona qualquer repositório a partir do link — funciona sem token para repos públicos. */
export const clonarPorLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string }) =>
    z.object({ url: z.string().min(10).max(300) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { parseRepoUrl, clonarRepositorio } = await import("./faby/github.server");
    const repo = parseRepoUrl(data.url);
    if (!repo) {
      return { ok: false as const, msg: "Esse link não parece ser de um repositório do GitHub." };
    }

    const conta = await obterConta(context);
    const r = await clonarRepositorio(conta?.token ?? "", repo);
    if (!r.ok) return { ok: false as const, msg: r.msg };

    const nome = repo.split("/")[1] ?? repo;
    const projetoId = crypto.randomUUID();
    const novoProjeto = {
      id: projetoId,
      user_id: context.userId,
      nome,
      modelo: "google",
      arquivos: r.arquivos as Record<string, string>,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    salvarProjetoArmazenado(novoProjeto);

    try {
      await context.supabase.from("projetos").insert({
        id: projetoId,
        user_id: context.userId,
        nome,
        modelo: "google",
        arquivos: r.arquivos as unknown as never,
      });
    } catch {
      // ignore
    }

    const msgAssistente = {
      id: crypto.randomUUID(),
      projeto_id: projetoId,
      user_id: context.userId,
      role: "assistant" as const,
      conteudo:
        `Clonei o repositório **${repo}** (${Object.keys(r.arquivos).length} arquivos, branch ${r.branch}).\n\n` +
        "Os arquivos estão no Workspace. Peça qualquer alteração no chat — por exemplo: " +
        '"explique esse projeto", "crie uma interface web pra ele" ou "corrija o arquivo X".',
      modelo: "github",
      ok: true,
      anexos: [],
      created_at: new Date().toISOString(),
    };
    salvarMensagemArmazenada(msgAssistente);

    try {
      await context.supabase.from("mensagens").insert({
        id: msgAssistente.id,
        projeto_id: projetoId,
        user_id: context.userId,
        role: "assistant",
        conteudo: msgAssistente.conteudo,
        modelo: "github",
        ok: true,
      });
    } catch {
      // ignore
    }

    return {
      ok: true as const,
      projeto_id: projetoId,
      qtd: Object.keys(r.arquivos).length,
    };
  });

/** Cria um projeto novo a partir de arquivos lidos de um .zip no navegador. */
export const importarArquivosZip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { nome: string; arquivos: Record<string, string> }) =>
    z
      .object({
        nome: z.string().min(1).max(80),
        arquivos: z.record(z.string(), z.string().max(400_000)),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const nomes = Object.keys(data.arquivos);
    if (!nomes.length) return { ok: false as const, msg: "O zip não tinha arquivos de texto." };

    const projetoId = crypto.randomUUID();
    const novoProjeto = {
      id: projetoId,
      user_id: context.userId,
      nome: data.nome.slice(0, 80),
      modelo: "google",
      arquivos: data.arquivos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    salvarProjetoArmazenado(novoProjeto);

    try {
      await context.supabase.from("projetos").insert({
        id: projetoId,
        user_id: context.userId,
        nome: data.nome.slice(0, 80),
        modelo: "google",
        arquivos: data.arquivos as unknown as never,
      });
    } catch {
      // ignore
    }

    const msgAssistente = {
      id: crypto.randomUUID(),
      projeto_id: projetoId,
      user_id: context.userId,
      role: "assistant" as const,
      conteudo:
        `Importei **${nomes.length} arquivo(s)** do seu zip para o projeto.\n\n` +
        "Eles estão no Workspace. Isso confirma a importação, não a execução do sistema. Posso analisar os arquivos ou fazer uma alteração específica.",
      modelo: "zip",
      ok: true,
      anexos: [],
      created_at: new Date().toISOString(),
    };
    salvarMensagemArmazenada(msgAssistente);

    try {
      await context.supabase.from("mensagens").insert({
        id: msgAssistente.id,
        projeto_id: projetoId,
        user_id: context.userId,
        role: "assistant",
        conteudo: msgAssistente.conteudo,
        modelo: "zip",
        ok: true,
      });
    } catch {
      // ignore
    }

    return { ok: true as const, projeto_id: projetoId, qtd: nomes.length };
  });

export const commitsGithub = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const conta = await obterConta(context);
    if (!conta?.repo) return { ok: false as const, msg: "", commits: [] };

    const { listarCommits } = await import("./faby/github.server");
    const r = await listarCommits(conta.token, conta.repo, conta.branch || "main");
    if (!r.ok) return { ok: false as const, msg: r.msg, commits: [] };
    return { ok: true as const, msg: "", commits: r.commits };
  });

function apelidoRepo(nome: string) {
  const base = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "projeto"}-${Date.now().toString(36).slice(-4)}`;
}

/**
 * Publicar em 1 clique: cria o repositório se precisar, envia os arquivos
 * e liga o GitHub Pages — devolvendo o endereço do site pronto.
 */
export const publicarProjeto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projeto_id: string }) =>
    z.object({ projeto_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const conta = await obterConta(context);
    let projeto: { nome?: string; arquivos?: Record<string, string> } | null = null;
    try {
      const { data: p } = await context.supabase
        .from("projetos")
        .select("nome, arquivos")
        .eq("id", data.projeto_id)
        .maybeSingle();
      if (p) projeto = p;
    } catch {
      // ignore
    }
    if (!projeto) {
      const localP = obterProjetoArmazenado(data.projeto_id);
      if (localP) projeto = localP;
    }

    if (!conta?.token) {
      return {
        ok: false as const,
        precisaGithub: true,
        msg: "Pra ter um endereço de site, conecte sua conta do GitHub na aba GitHub (é grátis).",
      };
    }
    if (!projeto)
      return { ok: false as const, precisaGithub: false, msg: "Projeto não encontrado." };

    const arquivos = { ...((projeto.arquivos as Record<string, string>) ?? {}) };
    const publicavel = verificarPublicacaoEstatica(arquivos);
    if (!publicavel.ok) {
      return {
        ok: false as const,
        precisaGithub: false,
        msg: `Não publiquei porque o site ficaria quebrado: ${publicavel.motivo}`,
      };
    }

    const { criarRepositorio, enviarArquivos, ligarPages } = await import("./faby/github.server");

    let repo = conta.repo ?? "";
    let branch = conta.branch || "main";
    if (!repo) {
      const novo = await criarRepositorio(
        conta.token,
        apelidoRepo(projeto.nome || "projeto"),
        false,
      );
      if (!novo.ok) return { ok: false as const, precisaGithub: false, msg: novo.msg };
      repo = novo.repo;
      branch = novo.branch;
      salvarGithubContaArmazenada({
        ...conta,
        user_id: context.userId,
        token: conta.token,
        login: conta.login || "",
        repo,
        branch,
      });
      try {
        await context.supabase
          .from("github_contas")
          .update({ repo, branch })
          .eq("user_id", context.userId);
      } catch {
        // ignore
      }
    }

    if (!arquivos["README.md"]) {
      arquivos["README.md"] = `# ${projeto.nome || "Projeto"}\n\nProjeto criado com o FabyClaud.\n`;
    }
    // .nojekyll garante que o GitHub sirva os arquivos exatamente como estão.
    arquivos[".nojekyll"] = "";

    const envio = await enviarArquivos({
      token: conta.token,
      repo,
      branch,
      mensagem: `Publicação de ${projeto.nome || "Projeto"} pelo FabyClaud`,
      arquivos,
    });
    if (!envio.ok) return { ok: false as const, precisaGithub: false, msg: envio.msg };

    const pages = await ligarPages(conta.token, repo, branch);
    if (!pages.ok) return { ok: false as const, precisaGithub: false, msg: pages.msg };

    return { ok: true as const, precisaGithub: false, msg: "", url: pages.url, repo };
  });

/** Publica o projeto de graça no GitHub Pages. */
export const publicarPagesGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const conta = await obterConta(context);
    if (!conta?.repo) return { ok: false, msg: "Escolha um repositório primeiro." };

    const { ligarPages } = await import("./faby/github.server");
    const r = await ligarPages(conta.token, conta.repo, conta.branch || "main");
    if (!r.ok) return { ok: false, msg: r.msg };
    return { ok: true, url: r.url };
  });
