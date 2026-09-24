import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GithubSecao } from "@/components/faby/GithubSecao";
import { AGENTES_PRONTOS, MEMORIA_SUGERIDA, PROMPTS_PRO } from "@/lib/faby/config";
import {
  apagarAgente,
  apagarArquivo,
  apagarBackup,
  apagarLicao,
  apagarPrompt,
  criarAgente,
  criarBackup,
  criarPrompt,
  estadoEscola,
  estudarAgora,
  gerarDocumentacao,
  listarAgentes,
  listarBackups,
  listarPrompts,
  obterMemoria,
  restaurarBackup,
  salvarArquivo,
  salvarMemoria,
} from "@/lib/faby.functions";

export type PainelNome =
  "memoria" | "escola" | "agentes" | "prompts" | "docs" | "backups" | "workspace" | "github";

const TITULOS: Record<PainelNome, { titulo: string; sub: string }> = {
  memoria: {
    titulo: "Memória",
    sub: "Preferências que a IA respeita em todas as conversas.",
  },
  escola: {
    titulo: "Escola das IAs",
    sub: "Estudo todo dia com suas chaves: cada ciclo vale um ano de amadurecimento.",
  },
  agentes: { titulo: "Agentes", sub: "Especialistas que mudam o jeito da IA trabalhar." },
  prompts: { titulo: "Prompts", sub: "Pedidos prontos e testados para começar rápido." },
  docs: { titulo: "Docs", sub: "Documentação do projeto atual, escrita pela IA." },
  backups: { titulo: "Backups", sub: "Cópias do projeto para voltar atrás quando quiser." },
  workspace: { titulo: "Workspace", sub: "Todos os arquivos do projeto, para ver e editar." },
  github: { titulo: "GitHub", sub: "Envie, traga de volta e publique seu código." },
};

type Props = {
  painel: PainelNome;
  onClose: () => void;
  projetoId: string | null;
  arquivos: Record<string, string>;
  agente: string | null;
  onAgente: (id: string | null) => void;
  onUsarPrompt: (texto: string) => void;
  onAtualizarProjeto: () => void;
  onProjeto: (id: string) => void;
};

export function PainelRecursos(props: Props) {
  const { painel, onClose } = props;
  const info = TITULOS[painel] ?? TITULOS.workspace;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="panel-glass max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl border border-border bg-card">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{info.titulo}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{info.sub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg border border-border p-2 transition hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5">
          {painel === "memoria" ? <Memoria /> : null}
          {painel === "escola" ? <Escola /> : null}
          {painel === "agentes" ? (
            <Agentes agente={props.agente} onAgente={props.onAgente} />
          ) : null}
          {painel === "prompts" ? (
            <Prompts
              onUsar={(t) => {
                props.onUsarPrompt(t);
                onClose();
              }}
            />
          ) : null}
          {painel === "docs" ? (
            <Docs
              projetoId={props.projetoId}
              arquivos={props.arquivos}
              onAtualizar={props.onAtualizarProjeto}
            />
          ) : null}
          {painel === "backups" ? (
            <Backups projetoId={props.projetoId} onAtualizar={props.onAtualizarProjeto} />
          ) : null}
          {painel === "workspace" ? (
            <Workspace
              projetoId={props.projetoId}
              arquivos={props.arquivos}
              onAtualizar={props.onAtualizarProjeto}
            />
          ) : null}
          {painel === "github" ? (
            <GithubSecao
              projetoId={props.projetoId}
              onAtualizar={props.onAtualizarProjeto}
              onProjeto={props.onProjeto}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

const campo =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition";
const botao =
  "rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50";
const botaoLeve =
  "rounded-lg border border-border bg-secondary px-3 py-2 text-xs transition hover:bg-accent disabled:opacity-50";

function SemProjeto() {
  return (
    <p className="text-sm text-muted-foreground">
      Abra ou crie uma conversa com projeto primeiro — é de lá que vêm os arquivos.
    </p>
  );
}

/* ---------------- Memória ---------------- */
function Memoria() {
  const buscar = useServerFn(obterMemoria);
  const salvar = useServerFn(salvarMemoria);
  const memoria = useQuery({ queryKey: ["memoria"], queryFn: () => buscar() });
  const [texto, setTexto] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (memoria.data) setTexto(memoria.data.conteudo);
  }, [memoria.data]);

  const mut = useMutation({
    mutationFn: () => salvar({ data: { conteudo: texto } }),
    onSuccess: () => {
      toast.success("Memória salva. A IA vai seguir isso em todas as conversas.");
      void queryClient.invalidateQueries({ queryKey: ["memoria"] });
    },
    onError: () => toast.error("Não conseguimos salvar agora."),
  });

  return (
    <div className="space-y-3">
      <textarea
        rows={9}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={
          "Ex: meu público é dentista; sempre em português do Brasil; visual escuro com verde;\nsempre entregar responsivo e com dados salvos no navegador; nunca usar emoji."
        }
        className={`${campo} resize-none`}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className={botao}
        >
          Salvar memória
        </button>
        <button type="button" className={botaoLeve} onClick={() => setTexto(MEMORIA_SUGERIDA)}>
          Usar memória recomendada
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        A memória recomendada já exige plano antes do código, projeto completo, backend com banco de
        dados real e nada de &quot;em breve&quot;. Depois de colar, clique em Salvar memória.
      </p>
    </div>
  );
}

/* ---------------- Escola das IAs ---------------- */
function Escola() {
  const queryClient = useQueryClient();
  const buscar = useServerFn(estadoEscola);
  const estudar = useServerFn(estudarAgora);
  const remover = useServerFn(apagarLicao);
  const escola = useQuery({ queryKey: ["escola"], queryFn: () => buscar() });

  const estudoMut = useMutation({
    mutationFn: () => estudar(),
    onSuccess: (r: any) => {
      if (r.ok) toast.success(r.mensagem);
      else toast.error(r.mensagem);
      void queryClient.invalidateQueries({ queryKey: ["escola"] });
    },
    onError: () => toast.error("Não consegui estudar agora."),
  });

  const dados = escola.data as any;
  const licoes: any[] = dados?.licoes ?? [];
  const idade = dados?.dia ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { rotulo: "Dias de estudo", valor: String(idade) },
          { rotulo: "Lições", valor: String(licoes.length) },
          { rotulo: "Média das entregas", valor: dados?.media ? `${dados.media}/100` : "—" },
        ].map((c) => (
          <div key={c.rotulo} className="rounded-xl border border-border bg-secondary p-3">
            <p className="text-lg font-bold text-primary">{c.valor}</p>
            <p className="text-[11px] text-muted-foreground">{c.rotulo}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Cada ciclo de estudo equivale a um ano de amadurecimento: as IAs estudam um tema com suas
        chaves, transformam o que aprenderam em regras curtas e passam a seguir essas
        regras em todas as respostas. Cada defeito real que a conferência pega também entra aqui,
        para não se repetir.
      </p>

      {dados?.pausado ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          Estudos pausados: {dados.motivo ?? "uma chave recusou o pedido"}. Clique em Estudar agora
          para tentar de novo.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => estudoMut.mutate()}
          disabled={estudoMut.isPending}
          className={botao}
        >
          {estudoMut.isPending ? "Estudando..." : "Estudar agora"}
        </button>
        {dados?.ultimo_resumo ? (
          <span className="text-[11px] text-muted-foreground">{dados.ultimo_resumo}</span>
        ) : null}
      </div>

      <div className="space-y-1.5">
        {licoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma lição ainda. O primeiro estudo acontece automaticamente, ou clique em Estudar
            agora.
          </p>
        ) : null}
        {licoes.map((l: any) => (
          <div
            key={l.id}
            className="flex items-start gap-2 rounded-lg border border-border bg-secondary px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs">{l.regra}</p>
              <p className="mt-0.5 text-[10px