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
    sub: "Estudo todo dia com suas chaves gratuitas: cada ciclo vale um ano de amadurecimento.",
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
        chaves gratuitas, transformam o que aprenderam em regras curtas e passam a seguir essas
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
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {l.origem === "falha" ? "aprendido com erro real" : l.tema}
              </p>
            </div>
            <button
              type="button"
              aria-label="Apagar lição"
              onClick={async () => {
                await remover({ data: { id: l.id } });
                void queryClient.invalidateQueries({ queryKey: ["escola"] });
              }}
              className="rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground transition hover:text-destructive"
            >
              Apagar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Agentes ---------------- */
function Agentes({
  agente,
  onAgente,
}: {
  agente: string | null;
  onAgente: (i: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const buscar = useServerFn(listarAgentes);
  const criar = useServerFn(criarAgente);
  const remover = useServerFn(apagarAgente);
  const meus = useQuery({ queryKey: ["agentes"], queryFn: () => buscar() });

  const [nome, setNome] = useState("");
  const [instrucoes, setInstrucoes] = useState("");

  const criarMut = useMutation({
    mutationFn: () => criar({ data: { nome, instrucoes } }),
    onSuccess: () => {
      toast.success("Agente criado.");
      setNome("");
      setInstrucoes("");
      void queryClient.invalidateQueries({ queryKey: ["agentes"] });
    },
    onError: () => toast.error("Confira o nome e as instruções (mínimo 10 letras)."),
  });

  const lista = [
    ...AGENTES_PRONTOS,
    ...((meus.data ?? []) as any[]).map((a) => ({ ...a, pronto: false as const })),
  ];

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => onAgente(null)}
        className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
          agente
            ? "border-border bg-secondary hover:bg-accent"
            : "border-border bg-accent text-primary"
        }`}
      >
        FabyClaud padrão {agente ? "" : "• ativo"}
      </button>

      {lista.map((a: any) => (
        <div key={a.id} className="rounded-xl border border-border bg-secondary/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {a.nome} {agente === a.id ? <span className="text-primary">• ativo</span> : null}
            </p>
            <div className="flex gap-1.5">
              <button type="button" className={botaoLeve} onClick={() => onAgente(a.id)}>
                {agente === a.id ? "Usando" : "Usar"}
              </button>
              {!a.pronto ? (
                <button
                  type="button"
                  className="text-xs text-destructive"
                  onClick={async () => {
                    await remover({ data: { id: a.id } });
                    if (agente === a.id) onAgente(null);
                    void queryClient.invalidateQueries({ queryKey: ["agentes"] });
                  }}
                >
                  apagar
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.instrucoes}</p>
        </div>
      ))}

      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-primary">Criar seu agente</h3>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome (ex: Especialista em e-commerce)"
          className={campo}
        />
        <textarea
          rows={4}
          value={instrucoes}
          onChange={(e) => setInstrucoes(e.target.value)}
          placeholder="Como ele deve trabalhar, o que sempre fazer e o que nunca fazer."
          className={`${campo} resize-none`}
        />
        <button
          type="button"
          className={botao}
          disabled={criarMut.isPending || !nome || instrucoes.length < 10}
          onClick={() => criarMut.mutate()}
        >
          Criar agente
        </button>
      </div>
    </div>
  );
}

/* ---------------- Prompts ---------------- */
function Prompts({ onUsar }: { onUsar: (texto: string) => void }) {
  const queryClient = useQueryClient();
  const buscar = useServerFn(listarPrompts);
  const criar = useServerFn(criarPrompt);
  const remover = useServerFn(apagarPrompt);
  const meus = useQuery({ queryKey: ["prompts"], queryFn: () => buscar() });

  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");

  const criarMut = useMutation({
    mutationFn: () => criar({ data: { titulo, texto } }),
    onSuccess: () => {
      toast.success("Prompt salvo.");
      setTitulo("");
      setTexto("");
      void queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
    onError: () => toast.error("Confira o título e o texto do prompt."),
  });

  const lista = [
    ...PROMPTS_PRO,
    ...((meus.data ?? []) as any[]).map((p) => ({ ...p, pronto: false as const })),
  ];

  return (
    <div className="space-y-3">
      {lista.map((p: any) => (
        <div key={p.id} className="rounded-xl border border-border bg-secondary/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{p.titulo}</p>
            <div className="flex gap-1.5">
              <button type="button" className={botaoLeve} onClick={() => onUsar(p.texto)}>
                Usar
              </button>
              {!p.pronto ? (
                <button
                  type="button"
                  className="text-xs text-destructive"
                  onClick={async () => {
                    await remover({ data: { id: p.id } });
                    void queryClient.invalidateQueries({ queryKey: ["prompts"] });
                  }}
                >
                  apagar
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {p.texto}
          </p>
        </div>
      ))}

      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-primary">Salvar um prompt seu</h3>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título"
          className={campo}
        />
        <textarea
          rows={4}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Texto do pedido"
          className={`${campo} resize-none`}
        />
        <button
          type="button"
          className={botao}
          disabled={criarMut.isPending || !titulo || texto.length < 5}
          onClick={() => criarMut.mutate()}
        >
          Salvar prompt
        </button>
      </div>
    </div>
  );
}

/* ---------------- Docs ---------------- */
function Docs({
  projetoId,
  arquivos,
  onAtualizar,
}: {
  projetoId: string | null;
  arquivos: Record<string, string>;
  onAtualizar: () => void;
}) {
  const gerar = useServerFn(gerarDocumentacao);
  const doc = arquivos["DOCUMENTACAO.md"] ?? "";

  const mut = useMutation({
    mutationFn: () => gerar({ data: { projeto_id: projetoId! } }),
    onSuccess: (r: any) => {
      if (!r.ok) {
        toast.error(r.msg ?? "Não conseguimos gerar agora.");
        return;
      }
      toast.success("Documentação criada e salva no projeto.");
      onAtualizar();
    },
    onError: () => toast.error("Não conseguimos gerar agora."),
  });

  if (!projetoId) return <SemProjeto />;

  function baixar() {
    const url = URL.createObjectURL(new Blob([doc], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "DOCUMENTACAO.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          className={botao}
          disabled={mut.isPending}
          onClick={() => mut.mutate()}
        >
          {mut.isPending ? "Escrevendo..." : doc ? "Gerar de novo" : "Gerar documentação"}
        </button>
        {doc ? (
          <button type="button" className={botaoLeve} onClick={baixar}>
            Baixar .md
          </button>
        ) : null}
      </div>
      {doc ? (
        <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-secondary/50 p-3 text-xs leading-relaxed">
          {doc}
        </pre>
      ) : (
        <p className="text-xs text-muted-foreground">
          A IA lê o código do projeto e escreve o manual: telas, arquivos, como publicar e como
          personalizar.
        </p>
      )}
    </div>
  );
}

/* ---------------- Backups ---------------- */
function Backups({
  projetoId,
  onAtualizar,
}: {
  projetoId: string | null;
  onAtualizar: () => void;
}) {
  const queryClient = useQueryClient();
  const buscar = useServerFn(listarBackups);
  const criar = useServerFn(criarBackup);
  const restaurar = useServerFn(restaurarBackup);
  const remover = useServerFn(apagarBackup);

  const lista = useQuery({
    queryKey: ["backups", projetoId],
    queryFn: () => buscar({ data: { projeto_id: projetoId! } }),
    enabled: Boolean(projetoId),
  });

  if (!projetoId) return <SemProjeto />;

  async function recarregar() {
    await queryClient.invalidateQueries({ queryKey: ["backups", projetoId] });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={botao}
        onClick={async () => {
          const r = (await criar({
            data: { projeto_id: projetoId!, rotulo: "Cópia manual" },
          })) as any;
          if (!r.ok) toast.error(r.msg ?? "Não deu.");
          else toast.success("Cópia guardada.");
          await recarregar();
        }}
      >
        Guardar cópia agora
      </button>
      <p className="text-xs text-muted-foreground">
        O sistema também guarda uma cópia automática antes de cada alteração feita pela IA.
      </p>

      <ul className="space-y-1.5">
        {(lista.data ?? []).map((b: any) => (
          <li
            key={b.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs"
          >
            <span className="min-w-0 flex-1 truncate">
              {b.rotulo || "Cópia"}{" "}
              <span className="text-muted-foreground">
                — {new Date(b.created_at).toLocaleString("pt-BR")} • {b.qtd} arquivo(s)
              </span>
            </span>
            <button
              type="button"
              className={botaoLeve}
              onClick={async () => {
                const r = (await restaurar({ data: { id: b.id } })) as any;
                if (!r.ok) toast.error(r.msg ?? "Não deu.");
                else toast.success("Projeto restaurado.");
                onAtualizar();
                await recarregar();
              }}
            >
              restaurar
            </button>
            <button
              type="button"
              className="text-destructive"
              onClick={async () => {
                await remover({ data: { id: b.id } });
                await recarregar();
              }}
            >
              apagar
            </button>
          </li>
        ))}
        {lista.data && lista.data.length === 0 ? (
          <li className="text-xs text-muted-foreground">Nenhuma cópia ainda.</li>
        ) : null}
      </ul>
    </div>
  );
}

/* ---------------- Workspace ---------------- */
function Workspace({
  projetoId,
  arquivos,
  onAtualizar,
}: {
  projetoId: string | null;
  arquivos: Record<string, string>;
  onAtualizar: () => void;
}) {
  const salvar = useServerFn(salvarArquivo);
  const remover = useServerFn(apagarArquivo);
  const nomes = Object.keys(arquivos);
  const [ativo, setAtivo] = useState(nomes[0] ?? "");
  const [conteudo, setConteudo] = useState(arquivos[nomes[0] ?? ""] ?? "");

  useEffect(() => {
    const nome = nomes.includes(ativo) ? ativo : (nomes[0] ?? "");
    setAtivo(nome);
    setConteudo(arquivos[nome] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projetoId, nomes.join("|")]);

  if (!projetoId) return <SemProjeto />;
  if (!nomes.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Esse projeto ainda não tem arquivos. Peça um site no chat e eles aparecem aqui.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {nomes.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setAtivo(n);
              setConteudo(arquivos[n] ?? "");
            }}
            className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
              ativo === n ? "border-border bg-accent text-primary" : "border-border bg-secondary"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <textarea
        rows={14}
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        spellCheck={false}
        className={`${campo} resize-none font-mono text-[11px] leading-relaxed`}
      />

      <div className="flex gap-2">
        <button
          type="button"
          className={botao}
          onClick={async () => {
            const r = (await salvar({
              data: { projeto_id: projetoId, nome: ativo, conteudo },
            })) as any;
            if (!r.ok) toast.error(r.msg ?? "Não deu.");
            else toast.success("Arquivo salvo.");
            onAtualizar();
          }}
        >
          Salvar arquivo
        </button>
        <button
          type="button"
          className={botaoLeve}
          onClick={async () => {
            await remover({ data: { projeto_id: projetoId, nome: ativo } });
            toast.success("Arquivo apagado.");
            onAtualizar();
          }}
        >
          Apagar arquivo
        </button>
      </div>
    </div>
  );
}

export default PainelRecursos;