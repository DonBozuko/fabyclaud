import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import JSZip from "jszip";

import {
  clonarPorLink,
  commitsGithub,
  criarRepoGithub,
  definirRepoGithub,
  desconectarGithub,
  enviarProjetoGithub,
  importarArquivosZip,
  importarDoGithub,
  listarReposGithub,
  publicarPagesGithub,
  salvarTokenGithub,
  statusGithub,
} from "@/lib/github.functions";

const campo =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const botao =
  "rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50";
const botaoLeve =
  "rounded-lg border border-border bg-secondary px-3 py-2 text-xs transition hover:bg-accent disabled:opacity-50";

type Props = {
  projetoId: string | null;
  onAtualizar: () => void;
  onProjeto: (id: string) => void;
};

const EXT_ZIP = [
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
];

/** Clonar por link ou importar .zip — funciona mesmo sem conta conectada. */
function ClonarSecao({ onProjeto, onAtualizar }: Omit<Props, "projetoId">) {
  const clonar = useServerFn(clonarPorLink);
  const importarZip = useServerFn(importarArquivosZip);
  const [link, setLink] = useState("");

  const mClonar = useMutation({
    mutationFn: (url: string) => clonar({ data: { url } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg);
        return;
      }
      setLink("");
      toast.success(`Repositório clonado: ${r.qtd} arquivo(s).`);
      onProjeto(r.projeto_id);
      onAtualizar();
    },
    onError: () => toast.error("Não conseguimos clonar agora. Tente de novo."),
  });

  const mZip = useMutation({
    mutationFn: async (arquivo: File) => {
      const zip = await JSZip.loadAsync(arquivo);
      const arquivos: Record<string, string> = {};
      const entradas = Object.values(zip.files).filter((e) => !e.dir);

      // Remove a pasta-raiz única (ex.: "chef-main/...") pra encurtar os caminhos.
      const primeiro = entradas[0]?.name ?? "";
      const raiz = primeiro.includes("/") ? primeiro.split("/")[0] + "/" : "";
      const tudoDentroDaRaiz = raiz !== "" && entradas.every((e) => e.name.startsWith(raiz));

      for (const entrada of entradas) {
        const nome = tudoDentroDaRaiz ? entrada.name.slice(raiz.length) : entrada.name;
        if (!nome) continue;
        if (!EXT_ZIP.some((e) => nome.toLowerCase().endsWith(e))) continue;
        if (nome.split("/").some((p) => ["node_modules", "vendor", ".git", "dist"].includes(p)))
          continue;
        if (Object.keys(arquivos).length >= 60) break;
        const texto = await entrada.async("string");
        if (texto.length < 400_000) arquivos[nome] = texto;
      }

      const nomeProjeto = arquivo.name.replace(/\.zip$/i, "").slice(0, 80) || "Projeto importado";
      return importarZip({ data: { nome: nomeProjeto, arquivos } });
    },
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg);
        return;
      }
      toast.success(`Zip importado: ${r.qtd} arquivo(s).`);
      onProjeto(r.projeto_id);
      onAtualizar();
    },
    onError: () => toast.error("Não conseguimos ler esse zip."),
  });

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Clonar um repositório
      </p>
      <p className="text-xs text-muted-foreground">
        Cole o link de qualquer repositório do GitHub (público não precisa de conta) ou suba um
        arquivo .zip. Os arquivos viram um projeto aqui pra você mexer pelo chat.
      </p>
      <div className="flex gap-2">
        <input
          className={`${campo} flex-1`}
          placeholder="https://github.com/dono/repositorio"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <button
          type="button"
          className={botao}
          disabled={!link.includes("github.com") || mClonar.isPending}
          onClick={() => mClonar.mutate(link.trim())}
        >
          {mClonar.isPending ? "Clonando..." : "Clonar"}
        </button>
      </div>
      <label className={`${botaoLeve} inline-block cursor-pointer`}>
        {mZip.isPending ? "Lendo o zip..." : "Importar arquivo .zip"}
        <input
          type="file"
          accept=".zip"
          className="hidden"
          disabled={mZip.isPending}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) mZip.mutate(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

export function GithubSecao({ projetoId, onAtualizar, onProjeto }: Props) {
  const qc = useQueryClient();
  const status = useServerFn(statusGithub);
  const salvarToken = useServerFn(salvarTokenGithub);
  const desconectar = useServerFn(desconectarGithub);
  const repos = useServerFn(listarReposGithub);
  const criarRepo = useServerFn(criarRepoGithub);
  const definirRepo = useServerFn(definirRepoGithub);
  const enviar = useServerFn(enviarProjetoGithub);
  const importar = useServerFn(importarDoGithub);
  const commits = useServerFn(commitsGithub);
  const publicar = useServerFn(publicarPagesGithub);

  const [token, setToken] = useState("");
  const [novoRepo, setNovoRepo] = useState("");
  const [privado, setPrivado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const qStatus = useQuery({ queryKey: ["github"], queryFn: () => status() });
  const conectado = qStatus.data?.conectado ?? false;
  const repoAtual = qStatus.data?.repo ?? "";

  const qRepos = useQuery({
    queryKey: ["github-repos"],
    queryFn: () => repos(),
    enabled: conectado,
  });
  const qCommits = useQuery({
    queryKey: ["github-commits", repoAtual],
    queryFn: () => commits(),
    enabled: conectado && Boolean(repoAtual),
  });

  const recarregar = () => {
    void qc.invalidateQueries({ queryKey: ["github"] });
    void qc.invalidateQueries({ queryKey: ["github-repos"] });
    void qc.invalidateQueries({ queryKey: ["github-commits"] });
  };

  const mConectar = useMutation({
    mutationFn: (t: string) => salvarToken({ data: { token: t } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg);
        return;
      }
      setToken("");
      toast.success(`Conectado como ${r.login}.`);
      recarregar();
    },
    onError: () => toast.error("Não conseguimos conectar agora. Tente de novo."),
  });

  const mCriar = useMutation({
    mutationFn: () => criarRepo({ data: { nome: novoRepo.trim(), privado } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg);
        return;
      }
      setNovoRepo("");
      toast.success(`Repositório ${r.repo} criado e escolhido.`);
      recarregar();
    },
    onError: () => toast.error("Não conseguimos criar o repositório."),
  });

  const mDefinir = useMutation({
    mutationFn: (repo: string) => definirRepo({ data: { repo } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg);
        return;
      }
      toast.success(`Enviando para ${r.repo} (${r.branch}).`);
      recarregar();
    },
  });

  const mEnviar = useMutation({
    mutationFn: () => enviar({ data: { projeto_id: projetoId ?? "", mensagem: mensagem.trim() } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg);
        return;
      }
      setMensagem("");
      toast.success(`Enviado: ${r.qtd} arquivo(s), commit ${r.sha}.`);
      recarregar();
    },
    onError: () => toast.error("O envio falhou. Confira o repositório e tente de novo."),
  });

  const mImportar = useMutation({
    mutationFn: () => importar({ data: { projeto_id: projetoId } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg);
        return;
      }
      toast.success(`${r.qtd} arquivo(s) trazidos do GitHub.`);
      if (r.projeto_id && r.projeto_id !== projetoId) onProjeto(r.projeto_id);
      onAtualizar();
      recarregar();
    },
    onError: () => toast.error("Não conseguimos trazer os arquivos."),
  });

  const mPublicar = useMutation({
    mutationFn: () => publicar({ data: undefined }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg);
        return;
      }
      toast.success("Site publicado. Pode levar 1 minuto pra ficar no ar.");
      window.open(r.url, "_blank", "noopener");
    },
    onError: () => toast.error("Não conseguimos publicar agora."),
  });

  if (!conectado) {
    return (
      <div className="space-y-4">
        <ClonarSecao onProjeto={onProjeto} onAtualizar={onAtualizar} />
        <div className="rounded-xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Como ligar sua conta</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Abra o GitHub e crie um token clássico com permissão de repositório.</li>
            <li>Copie o token e cole aqui embaixo.</li>
            <li>Pronto: você já pode enviar, trazer e publicar seus projetos.</li>
          </ol>
          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=FabyClaud"
            target="_blank"
            rel="noreferrer"
            className={`${botaoLeve} mt-3 inline-block`}
          >
            Criar meu token no GitHub
          </a>
        </div>
        <input
          className={campo}
          type="password"
          placeholder="Cole seu token do GitHub"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button
          type="button"
          className={botao}
          disabled={token.trim().length < 20 || mConectar.isPending}
          onClick={() => mConectar.mutate(token.trim())}
        >
          {mConectar.isPending ? "Conectando..." : "Conectar GitHub"}
        </button>
      </div>
    );
  }

  const lista = qRepos.data?.repos ?? [];

  return (
    <div className="space-y-5">
      <ClonarSecao onProjeto={onProjeto} onAtualizar={onAtualizar} />
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-xs">
        <span>
          Conectado como <strong className="text-primary">{qStatus.data?.login}</strong>
          {repoAtual ? (
            <>
              {" · "}
              {repoAtual} ({qStatus.data?.branch})
            </>
          ) : null}
        </span>
        <button
          type="button"
          className={botaoLeve}
          onClick={() => {
            void desconectar({ data: undefined }).then(() => {
              toast.success("Conta desligada.");
              recarregar();
            });
          }}
        >
          Desligar
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Repositório
        </p>
        <select
          className={campo}
          value={repoAtual}
          onChange={(e) => mDefinir.mutate(e.target.value)}
        >
          <option value="">{qRepos.isLoading ? "Carregando..." : "Escolha um repositório"}</option>
          {lista.map((r) => (
            <option key={r.full_name} value={r.full_name}>
              {r.full_name}
              {r.privado ? " (privado)" : ""}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={`${campo} flex-1`}
            placeholder="ou crie um novo: meu-projeto"
            value={novoRepo}
            onChange={(e) => setNovoRepo(e.target.value)}
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={privado}
              onChange={(e) => setPrivado(e.target.checked)}
            />
            privado
          </label>
          <button
            type="button"
            className={botaoLeve}
            disabled={!novoRepo.trim() || mCriar.isPending}
            onClick={() => mCriar.mutate()}
          >
            {mCriar.isPending ? "Criando..." : "Criar"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Enviar o projeto
        </p>
        <input
          className={campo}
          placeholder="Descreva a mudança (opcional)"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={botao}
            disabled={!projetoId || !repoAtual || mEnviar.isPending}
            onClick={() => mEnviar.mutate()}
          >
            {mEnviar.isPending ? "Enviando..." : "Enviar para o GitHub"}
          </button>
          <button
            type="button"
            className={botaoLeve}
            disabled={!repoAtual || mImportar.isPending}
            onClick={() => mImportar.mutate()}
          >
            {mImportar.isPending ? "Trazendo..." : "Trazer do GitHub"}
          </button>
          <button
            type="button"
            className={botaoLeve}
            disabled={!repoAtual || mPublicar.isPending}
            onClick={() => mPublicar.mutate()}
          >
            {mPublicar.isPending ? "Publicando..." : "Publicar site grátis"}
          </button>
        </div>
        {!projetoId ? (
          <p className="text-xs text-muted-foreground">
            Abra ou crie uma conversa com arquivos para enviar.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico
        </p>
        {qCommits.data?.msg ? (
          <p className="text-xs text-destructive">{qCommits.data.msg}</p>
        ) : null}
        {(qCommits.data?.commits ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum envio ainda.</p>
        ) : (
          <ul className="space-y-1.5">
            {(qCommits.data?.commits ?? []).map((c) => (
              <li
                key={c.sha}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs"
              >
                <span className="truncate">{c.mensagem}</span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-primary hover:underline"
                >
                  {c.sha}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
