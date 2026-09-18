import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bot,
  Cloud,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  Hand,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Settings,
  GraduationCap,
  Sparkle,
  Swords,
  Trash2,
  Wrench,
  Zap,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import heroAsset from "@/assets/hero-matrix.png.asset.json";
import { PainelRecursos, type PainelNome } from "@/components/faby/PainelRecursos";
import { SettingsDialog } from "@/components/faby/SettingsDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  apagarProjeto,
  enviarMensagem,
  obterCapacidades,
  listarProjetos,
  listarProvedoresCustom,
  obterProjeto,
} from "@/lib/faby.functions";
import { MODELS, PROVIDER_LABELS, type Anexo } from "@/lib/faby/config";
import {
  abrirProjetoEmNovaAba,
  baixarProjetoZip,
  classificarPreview,
  injetarSondaDeErros,
  montarPreviewHtml,
} from "@/lib/faby/preview";
import {
  descreverAuditoria,
  injetarAuditorDeCliques,
  type ResultadoAuditoria,
} from "@/lib/faby/auditoria";
import { lerAnexo } from "@/lib/faby/upload";
import { lerPastaDoNavegador, lerZipDoNavegador, type ResultadoImportacao } from "@/lib/faby/zip";
import { importarArquivosZip, publicarProjeto } from "@/lib/github.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FabyClaud — crie sites conversando com IA" },
      {
        name: "description",
        content:
          "FabyClaud é o estúdio para desenvolvedores: converse com IAs gratuitas, gere sites completos com prévia ao vivo e baixe o código em um clique.",
      },
      { property: "og:title", content: "FabyClaud — crie sites conversando com IA" },
      {
        property: "og:description",
        content: "Converse com IAs gratuitas, gere sites com prévia ao vivo e baixe o código.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FabyClaud,
});

const ITENS_MENU: { nome: string; Icone: typeof Bot; painel: PainelNome }[] = [
  { nome: "Memória", Icone: Sparkle, painel: "memoria" },
  { nome: "Escola das IAs", Icone: GraduationCap, painel: "escola" },
  { nome: "Agentes", Icone: Bot, painel: "agentes" },
  { nome: "Prompts", Icone: Zap, painel: "prompts" },
  { nome: "Docs", Icone: FileText, painel: "docs" },
  { nome: "Backups", Icone: Cloud, painel: "backups" },
  { nome: "Workspace", Icone: LayoutGrid, painel: "workspace" },
  { nome: "GitHub", Icone: GitBranch, painel: "github" },
];

function IndicadorPensando() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="thinking-status mr-auto flex max-w-[85%] items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3"
    >
      <span className="thinking-people" aria-hidden="true">
        <span className="thinking-orbit" />
        <span className="thinking-person thinking-person-green">
          <span className="thinking-head" />
          <span className="thinking-body" />
        </span>
        <span className="thinking-person thinking-person-cyan">
          <span className="thinking-head" />
          <span className="thinking-body" />
        </span>
      </span>
      <span className="thinking-label text-lg font-bold text-foreground">Pensando</span>
      <span className="thinking-dots flex gap-1" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

function FabyClaud() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pronto, setPronto] = useState(false);
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("faby_user_session")) {
      setLogado(true);
      setPronto(true);
      return;
    }

    const { data } = supabase.auth.onAuthStateChange((_e: any, sessao: any) => {
      if (sessao) {
        setLogado(true);
      } else if (typeof window !== "undefined" && !localStorage.getItem("faby_user_session")) {
        setLogado(false);
        void navigate({ to: "/auth" });
      }
    });

    void supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      if (data?.session) {
        setLogado(true);
      } else if (typeof window !== "undefined" && !localStorage.getItem("faby_user_session")) {
        setLogado(false);
        void navigate({ to: "/auth" });
      }
      setPronto(true);
    });

    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const buscarProjetos = useServerFn(listarProjetos);
  const buscarProjeto = useServerFn(obterProjeto);
  const buscarCustom = useServerFn(listarProvedoresCustom);
  const buscarCapacidades = useServerFn(obterCapacidades);
  const removerProjeto = useServerFn(apagarProjeto);
  const enviar = useServerFn(enviarMensagem);
  const importarZip = useServerFn(importarArquivosZip);
  const publicar = useServerFn(publicarProjeto);

  const [projetoId, setProjetoId] = useState<string | null>(null);
  const [modelo, setModelo] = useState("google");
  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [duelo, setDuelo] = useState(false);
  const [conversasAbertas, setConversasAbertas] = useState(true);
  const [configAberta, setConfigAberta] = useState(false);
  const [painel, setPainel] = useState<PainelNome | null>(null);
  const [agente, setAgente] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const inputPasta = useRef<HTMLInputElement>(null);
  const inputZip = useRef<HTMLInputElement>(null);
  const areaChat = useRef<HTMLDivElement>(null);
  const campoTexto = useRef<HTMLTextAreaElement>(null);

  const projetos = useQuery({
    queryKey: ["projetos"],
    queryFn: () => buscarProjetos(),
    enabled: logado,
  });

  const projeto = useQuery({
    queryKey: ["projeto", projetoId],
    queryFn: () => buscarProjeto({ data: { id: projetoId! } }),
    enabled: Boolean(projetoId) && logado,
  });

  const custom = useQuery({
    queryKey: ["provedores"],
    queryFn: () => buscarCustom(),
    enabled: logado,
  });

  const capacidades = useQuery({
    queryKey: ["capacidades"],
    queryFn: () => buscarCapacidades(),
    enabled: logado,
  });

  const [pendente, setPendente] = useState<string | null>(null);
  const [pendenteAnexos, setPendenteAnexos] = useState<Anexo[]>([]);

  const mandar = useMutation({
    mutationFn: async (vars: { prompt: string; anexos: Anexo[] }) => {
      return enviar({
        data: {
          prompt: vars.prompt,
          model: modelo,
          projeto_id: projetoId,
          anexos: vars.anexos,
          duelo,
          agente,
          origem: typeof window !== "undefined" ? window.location.origin : "",
        },
      });
    },
    onSettled: () => {
      setPendente(null);
      setPendenteAnexos([]);
    },
    onSuccess: (r) => {
      setProjetoId(r.projeto_id);
      void queryClient.invalidateQueries({ queryKey: ["projetos"] });
      void queryClient.invalidateQueries({ queryKey: ["projeto", r.projeto_id] });
      // A resposta já aparece dentro do chat; nada de aviso flutuante por cima do sistema.
      campoTexto.current?.focus();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não conseguimos enviar agora."),
  });

  function enviarAgora() {
    const prompt = texto.trim();
    if ((!prompt && !anexos.length) || mandar.isPending) return;
    if (
      !anexos.length &&
      /\b(abra|abrir|carregue|carregar|importe|importar)\b[\s\S]{0,50}\b(projeto|pasta|c[oó]digo|arquivos?)\b/i.test(
        prompt,
      )
    ) {
      setTexto("");
      inputPasta.current?.click();
      return;
    }
    const enviados = anexos;
    setPendente(prompt || "(arquivo enviado)");
    setPendenteAnexos(enviados);
    setTexto("");
    setAnexos([]);
    mandar.mutate({ prompt, anexos: enviados });
  }

  const mensagens = projeto.data?.mensagens ?? [];
  const arquivos = (projeto.data?.arquivos ?? {}) as Record<string, string>;
  const previewHtml = useMemo(() => montarPreviewHtml(arquivos), [arquivos]);
  const previewComSonda = useMemo(
    () => (previewHtml ? injetarSondaDeErros(previewHtml) : null),
    [previewHtml],
  );
  // Cópia invisível da entrega, usada só para o controle de qualidade automático.
  const previewParaAuditoria = useMemo(
    () => (previewHtml ? injetarAuditorDeCliques(injetarSondaDeErros(previewHtml)) : null),
    [previewHtml],
  );
  const estadoPreview = useMemo(() => classificarPreview(arquivos), [arquivos]);

  // Erros reais que a prévia relatou (script quebrado, arquivo faltando, fetch falhado).
  const [errosPreview, setErrosPreview] = useState<string[]>([]);
  // Resultado da auditoria de cliques (botão decorativo, imagem quebrada, form sem validação).
  const [auditoria, setAuditoria] = useState<ResultadoAuditoria | null>(null);
  const consertosFeitos = useRef<Set<string>>(new Set());
  const projetoIdRef = useRef(projetoId);
  projetoIdRef.current = projetoId;

  useEffect(() => {
    setErrosPreview([]);
    setAuditoria(null);
  }, [previewHtml, projetoId]);

  useEffect(() => {
    function ouvir(ev: MessageEvent) {
      if (!projetoIdRef.current) return;
      const dados = ev.data as {
        fonte?: string;
        tipo?: string;
        mensagem?: string;
        onde?: string;
      } & Partial<ResultadoAuditoria>;
      if (!dados) return;
      if (dados.fonte === "faby-auditoria") {
        setAuditoria({
          total: dados.total ?? 0,
          testados: dados.testados ?? 0,
          telasDescobertas: dados.telasDescobertas ?? 0,
          semAcao: dados.semAcao ?? [],
          imagensQuebradas: dados.imagensQuebradas ?? [],
          avisos: dados.avisos ?? [],
        });
        return;
      }
      if (dados.fonte !== "faby-previa" || !dados.mensagem) return;
      const linha = `${dados.tipo}: ${dados.mensagem}${dados.onde ? ` (${dados.onde})` : ""}`;
      setErrosPreview((antes) => (antes.includes(linha) ? antes : [...antes, linha].slice(-6)));
    }
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, []);

  const problemasQualidade = useMemo(
    () => (auditoria ? descreverAuditoria(auditoria) : []),
    [auditoria],
  );
  const problemasPrevia = useMemo(
    () => [...errosPreview, ...problemasQualidade].slice(0, 10),
    [errosPreview, problemasQualidade],
  );

  function consertarErrosDaPrevia(automatico = false) {
    if (!problemasPrevia.length || mandar.isPending || !projetoIdRef.current) return;
    const currentProj = projetoIdRef.current;
    const assinatura = `${currentProj}::${problemasPrevia.join("|")}`;
    if (automatico && consertosFeitos.current.has(assinatura)) return;
    consertosFeitos.current.add(assinatura);
    const prompt = [
      "O controle de qualidade abriu o projeto no navegador, clicou em cada botão e encontrou estes problemas reais:",
      ...problemasPrevia.map((e) => `- ${e}`),
      "",
      "Corrija a causa de cada item nos arquivos do projeto, mantendo toda a lógica e o visual que já funcionavam.",
      "Botão sem ação precisa ganhar comportamento de verdade (abrir tela, salvar, filtrar, validar), não um alerta vazio.",
      "Entregue os arquivos completos alterados. Não invente correção sem olhar o item citado.",
      automatico ? "(conserto disparado automaticamente pelo controle de qualidade)" : "",
    ]
      .filter(Boolean)
      .join("\n");
    setPendente("Consertando o que o controle de qualidade encontrou");
    setPendenteAnexos([]);
    setErrosPreview([]);
    setAuditoria(null);
    mandar.mutate({ prompt, anexos: [] });
  }

  // Auto-correção inteligente (Self-Healing): dispara automaticamente quando o controle de qualidade acha falhas reais
  useEffect(() => {
    if (problemasPrevia.length > 0 && !mandar.isPending) {
      const timer = setTimeout(() => {
        consertarErrosDaPrevia(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [problemasPrevia]);

  useEffect(() => {
    areaChat.current?.scrollTo({ top: areaChat.current.scrollHeight, behavior: "smooth" });
  }, [mensagens.length, mandar.isPending, pendente]);

  useEffect(() => {
    campoTexto.current?.focus();
  }, [projetoId]);

  const opcoesModelo = [
    ...Object.keys(MODELS)
      .filter((id) => id !== "omniroute")
      .map((id) => ({ id, nome: PROVIDER_LABELS[id] ?? id })),
    ...(custom.data ?? []).map((p) => ({ id: p.slug, nome: p.nome })),
  ];

  async function publicarSite() {
    if (!projetoId) return;
    setPublicando(true);
    const aviso = toast.loading("Colocando seu site no ar...");
    try {
      const r = await publicar({ data: { projeto_id: projetoId } });
      if (!r.ok) {
        toast.error(r.msg, { id: aviso });
        if (r.precisaGithub) setPainel("github");
        return;
      }
      toast.success("Site no ar! Abrindo o endereço em outra aba.", {
        id: aviso,
        description: r.url,
        duration: 12000,
      });
      window.open(r.url, "_blank", "noopener");
    } catch {
      toast.error("Não conseguimos publicar agora. Tente de novo.", { id: aviso });
    } finally {
      setPublicando(false);
    }
  }

  async function anexarArquivo(file: File) {
    // .zip vira um projeto novo (código pronto pra IA mexer), não um anexo de chat.
    if (file.name.toLowerCase().endsWith(".zip")) {
      const aviso = toast.loading("Lendo o zip...");
      try {
        const resultado = await lerZipDoNavegador(file);
        if (!Object.keys(resultado.arquivos).length) {
          toast.error("O zip não tinha arquivos de texto ou código.", { id: aviso });
          return;
        }
        await importarProjetoLido(resultado, aviso);
      } catch {
        toast.error("Não conseguimos ler esse zip.", { id: aviso });
      }
      return;
    }

    const { anexo, erro } = await lerAnexo(file);
    if (erro || !anexo) {
      toast.error(erro ?? "Não conseguimos ler esse arquivo.");
      return;
    }
    setAnexos((atual) => [...atual, anexo]);
  }

  async function importarProjetoLido(resultado: ResultadoImportacao, aviso: string | number) {
    try {
      const r = await importarZip({ data: { nome: resultado.nome, arquivos: resultado.arquivos } });
      if (!r.ok) {
        toast.error(r.msg, { id: aviso });
        return;
      }
      setProjetoId(r.projeto_id);
      void queryClient.invalidateQueries({ queryKey: ["projetos"] });
      const detalhes = resultado.ignorados
        ? ` ${resultado.ignorados} item(ns) pesado(s), gerado(s) ou não textual(is) foram ignorados.`
        : "";
      const estado = classificarPreview(resultado.arquivos);
      const situacao =
        estado.estado === "funcionando"
          ? " A prévia está disponível."
          : estado.estado === "parcial"
            ? " Há apenas uma prévia parcial; o servidor original não foi executado."
            : " Os arquivos foram guardados, mas a aplicação não foi executada.";
      toast.success(`${r.qtd} arquivo(s) importado(s).${situacao}${detalhes}`, {
        id: aviso,
        duration: 9000,
      });
    } catch {
      toast.error("Não conseguimos importar esse projeto.", { id: aviso });
    }
  }

  async function abrirPasta(files: File[]) {
    if (!files.length) return;
    const aviso = toast.loading("Lendo a pasta do projeto...");
    const resultado = await lerPastaDoNavegador(files);
    if (!Object.keys(resultado.arquivos).length) {
      toast.error("A pasta não tinha arquivos de código compatíveis.", { id: aviso });
      return;
    }
    await importarProjetoLido(resultado, aviso);
  }

  if (!pronto || !logado) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="relative h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-[center_15%] bg-no-repeat"
        style={{ backgroundImage: `url(${heroAsset.url})` }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 bg-background/75 backdrop-blur-[2px]" aria-hidden />

      <div className="flex h-screen gap-4 p-4">
        {/* ===== barra lateral ===== */}
        <aside className="panel-glass flex w-[230px] shrink-0 flex-col gap-3.5 rounded-2xl p-4">
          <button
            type="button"
            onClick={() => {
              setProjetoId(null);
              setTexto("");
              setAnexos([]);
              campoTexto.current?.focus();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:brightness-110"
          >
            <Plus className="size-4" /> Nova conversa
          </button>

          <button
            type="button"
            onClick={() => setConversasAbertas((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground"
          >
            <MessageSquare className="size-4" /> Conversas
          </button>

          {conversasAbertas ? (
            <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pl-2">
              {(projetos.data ?? []).map((p: any) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setProjetoId(p.id)}
                    title={p.nome}
                    className={`flex-1 truncate rounded-md border px-2.5 py-1.5 text-left text-xs transition ${
                      projetoId === p.id
                        ? "border-border text-primary"
                        : "border-transparent bg-secondary text-foreground hover:border-border"
                    }`}
                  >
                    <Globe className="mr-1 inline size-3" />
                    {p.nome}
                  </button>
                  <button
                    type="button"
                    aria-label={`Apagar ${p.nome}`}
                    onClick={async () => {
                      await removerProjeto({ data: { id: p.id } });
                      if (projetoId === p.id) setProjetoId(null);
                      void queryClient.invalidateQueries({ queryKey: ["projetos"] });
                    }}
                    className="rounded-full bg-destructive/25 p-1 text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              {projetos.data?.length === 0 ? (
                <p className="py-1 text-xs text-muted-foreground">Nenhuma conversa ainda.</p>
              ) : null}
            </div>
          ) : null}

          <nav className="flex flex-col gap-0.5">
            {ITENS_MENU.map(({ nome, Icone, painel }) => (
              <button
                key={nome}
                type="button"
                onClick={() => setPainel(painel)}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-accent hover:text-primary"
              >
                <span className="flex items-center gap-2.5">
                  <Icone className="size-4" /> {nome}
                </span>
                {painel === "agentes" && agente ? (
                  <span className="rounded-md bg-accent px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary">
                    Ativo
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-2">
            <button
              type="button"
              onClick={async () => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("faby_user_session");
                }
                try {
                  await supabase.auth.signOut();
                } catch {
                  // ignore
                }
                void navigate({ to: "/auth" });
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:text-primary"
            >
              <LogOut className="size-3.5" /> Sair da conta
            </button>
          </div>
        </aside>

        {/* ===== área principal ===== */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="panel-glass flex items-center justify-between rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex size-[42px] items-center justify-center rounded-xl border border-border bg-accent">
                <Bot className="size-5 text-primary" />
              </span>
              <div>
                <h1 className="flex items-center gap-2 text-lg font-semibold">
                  FabyClaud
                  <span className="rounded-xl bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    GRÁTIS
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Criação com capacidades verificadas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                ref={(elemento) => {
                  inputPasta.current = elemento;
                  elemento?.setAttribute("webkitdirectory", "");
                  elemento?.setAttribute("directory", "");
                }}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  void abrirPasta(files);
                }}
              />
              <input
                ref={inputZip}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void anexarArquivo(file);
                }}
              />
              <button
                type="button"
                onClick={() => inputPasta.current?.click()}
                title="Escolher uma pasta completa do computador"
                className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-[13px] transition hover:bg-accent"
              >
                <FolderOpen className="size-4" /> Abrir projeto
              </button>
              <button
                type="button"
                onClick={() => inputZip.current?.click()}
                aria-label="Abrir projeto em ZIP"
                title="Abrir projeto por arquivo ZIP"
                className="flex size-[38px] items-center justify-center rounded-xl border border-border bg-secondary transition hover:bg-accent"
              >
                <FileArchive className="size-4" />
              </button>
              {Object.keys(arquivos).length ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!abrirProjetoEmNovaAba(arquivos))
                        toast.error("Esse projeto ainda não tem index.html.");
                    }}
                    title="Abre a prévia do projeto numa aba nova"
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-[13px] transition hover:bg-accent"
                  >
                    <ExternalLink className="size-4" /> Abrir prévia
                  </button>
                  <button
                    type="button"
                    onClick={() => void baixarProjetoZip(projeto.data?.nome ?? "projeto", arquivos)}
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-[13px] transition hover:bg-accent"
                  >
                    <Download className="size-4" /> Baixar
                  </button>
                  <button
                    type="button"
                    disabled={publicando}
                    onClick={() => void publicarSite()}
                    title="Coloca o projeto no ar e te dá o endereço do site"
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-[13px] transition hover:bg-accent disabled:opacity-60"
                  >
                    <Globe className="size-4" /> {publicando ? "Publicando..." : "Publicar"}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setDuelo((v) => !v)}
                aria-pressed={duelo}
                title="Várias IAs respondem ao mesmo tempo e a melhor resposta vence"
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] transition ${
                  duelo
                    ? "border-border bg-primary text-primary-foreground shadow-glow"
                    : "border-border bg-secondary hover:bg-accent"
                }`}
              >
                <Swords className="size-4" /> Duelo de IAs
              </button>
              <select
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                aria-label="Escolher a IA"
                className="rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-[13px]"
              >
                {opcoesModelo.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Configurações"
                onClick={() => setConfigAberta(true)}
                className="flex size-[38px] items-center justify-center rounded-xl border border-border bg-secondary transition hover:bg-accent"
              >
                <Settings className="size-4" />
              </button>
            </div>
          </header>

          <section
            className="panel-glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-2 text-[11px]"
            aria-label="Capacidades disponíveis"
          >
            <span className="font-semibold text-foreground">Agora:</span>
            {[
              {
                nome: "IA",
                pronta: capacidades.data?.ia.pronta ?? false,
                detalhe: capacidades.data?.ia.pronta
                  ? `${capacidades.data.ia.provedores.length} conexão(ões) testada(s)`
                  : "precisa conectar e testar",
              },
              {
                nome: "Busca",
                pronta: capacidades.data?.busca.pronta ?? false,
                detalhe: "pública e limitada",
              },
              {
                nome: "Imagem",
                pronta: capacidades.data?.imagem.pronta ?? false,
                detalhe: "qualidade variável",
              },
              { nome: "Vídeo", pronta: false, detalhe: "indisponível" },
              {
                nome: "Dados",
                pronta: capacidades.data?.dados.pronta ?? false,
                detalhe: "públicos e privados com login",
              },
            ].map((item) => (
              <span
                key={item.nome}
                className="flex items-center gap-1 text-muted-foreground"
                title={item.detalhe}
              >
                {item.pronta ? (
                  <CheckCircle2 className="size-3.5 text-primary" />
                ) : (
                  <CircleAlert className="size-3.5 text-destructive" />
                )}
                <strong className="text-foreground">{item.nome}</strong> {item.detalhe}
              </span>
            ))}
            {!capacidades.data?.ia.pronta ? (
              <button
                type="button"
                onClick={() => setConfigAberta(true)}
                className="ml-auto text-primary underline"
              >
                Conectar IA
              </button>
            ) : null}
          </section>

          <div className="flex min-h-0 flex-1 gap-4">
            {/* prévia */}
            <section className="panel-glass relative flex min-w-[260px] flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-dashed">
              {previewComSonda ? (
                <>
                  {problemasPrevia.length ? (
                    <div className="w-full border-b border-border bg-destructive/15 px-3 py-2 text-left">
                      <p className="text-[12px] font-semibold text-foreground">
                        O controle de qualidade encontrou {problemasPrevia.length} problema(s) reais
                      </p>
                      <ul className="mt-1 max-h-16 overflow-y-auto text-[11px] leading-snug text-muted-foreground">
                        {problemasPrevia.map((e) => (
                          <li key={e}>• {e}</li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => consertarErrosDaPrevia(false)}
                        disabled={mandar.isPending}
                        className="mt-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1 text-[11px] transition hover:bg-accent disabled:opacity-50"
                      >
                        Consertar agora
                      </button>
                    </div>
                  ) : auditoria ? (
                    <div className="w-full border-b border-border bg-primary/10 px-3 py-1.5 text-left text-[11px] text-muted-foreground">
                      Testei {auditoria.total} botão(ões)/link(s) desta tela clicando um por um:
                      todos responderam.
                    </div>
                  ) : null}
                  <iframe
                    title="Prévia do projeto"
                    srcDoc={previewComSonda}
                    sandbox="allow-scripts allow-forms allow-popups"
                    className="size-full rounded-2xl bg-white"
                  />
                  {previewParaAuditoria && !auditoria ? (
                    <iframe
                      title="Controle de qualidade (invisível)"
                      srcDoc={previewParaAuditoria}
                      sandbox="allow-scripts allow-forms"
                      aria-hidden="true"
                      tabIndex={-1}
                      className="pointer-events-none absolute size-px opacity-0"
                    />
                  ) : null}
                </>
              ) : (
                <div className="max-w-[280px] p-8 text-center text-muted-foreground">
                  <Wrench className="mx-auto mb-3 size-8" />
                  <h2 className="mb-2 text-base text-foreground">
                    {Object.keys(arquivos).length ? "Arquivos importados" : "Prévia do projeto"}
                  </h2>
                  {Object.keys(arquivos).length ? (
                    <p className="text-[13px] leading-relaxed">
                      {Object.keys(arquivos).length} arquivo(s) foram importados.{" "}
                      {estadoPreview.motivo}
                    </p>
                  ) : (
                    <p className="text-[13px] leading-relaxed">
                      Abra uma pasta, envie um ZIP ou peça um site para começar.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* chat */}
            <section className="flex min-w-[300px] flex-[1.3] flex-col overflow-hidden rounded-2xl border border-border bg-background/35">
              <div ref={areaChat} className="flex-1 space-y-3 overflow-y-auto p-5">
                {mensagens.length === 0 ? (
                  <div className="panel-glass rounded-2xl p-5 text-center">
                    <p className="flex items-center justify-center gap-2 font-semibold text-primary">
                      <Hand className="size-4" /> Olá! Sou a FabyClaud
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Peça uma calculadora sem chave, ou conecte uma IA testada para projetos
                      personalizados.
                    </p>
                  </div>
                ) : null}

                {mensagens.map((m: any) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : m.ok
                          ? "mr-auto border border-border bg-secondary text-foreground"
                          : "mr-auto border border-destructive/40 bg-destructive/15 text-foreground"
                    }`}
                  >
                    {m.conteudo}
                    {(m.anexos as Anexo[] | null)?.length ? (
                      <span className="mt-2 flex flex-wrap gap-2">
                        {((m.anexos ?? []) as Anexo[]).map((a, i) =>
                          a.tipo === "imagem" ? (
                            <img
                              key={`${a.nome}-${i}`}
                              src={`data:${a.mime};base64,${a.data}`}
                              alt={a.nome}
                              className="max-h-32 rounded-lg border border-border/50"
                            />
                          ) : (
                            <span
                              key={`${a.nome}-${i}`}
                              className="rounded-lg bg-background/30 px-2 py-1 text-[11px]"
                            >
                              {a.nome}
                            </span>
                          ),
                        )}
                      </span>
                    ) : null}
                    {m.role === "assistant" && m.modelo ? (
                      <span className="mt-1.5 block text-[10px] text-muted-foreground">
                        {PROVIDER_LABELS[m.modelo] ?? m.modelo}
                      </span>
                    ) : null}
                  </div>
                ))}

                {pendente ? (
                  <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground opacity-80">
                    {pendente}
                    {pendenteAnexos.length ? (
                      <span className="mt-2 flex flex-wrap gap-2">
                        {pendenteAnexos.map((a, i) =>
                          a.tipo === "imagem" ? (
                            <img
                              key={`${a.nome}-${i}`}
                              src={a.preview}
                              alt={a.nome}
                              className="max-h-32 rounded-lg border border-border/50"
                            />
                          ) : (
                            <span
                              key={`${a.nome}-${i}`}
                              className="rounded-lg bg-background/30 px-2 py-1 text-[11px]"
                            >
                              {a.nome}
                            </span>
                          ),
                        )}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {mandar.isPending ? <IndicadorPensando /> : null}
              </div>

              {anexos.length ? (
                <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
                  {anexos.map((a, i) => (
                    <span
                      key={`${a.nome}-${i}`}
                      className="flex items-center gap-1.5 rounded-lg bg-secondary px-2 py-1 text-[11px]"
                    >
                      {a.tipo === "imagem" ? (
                        <img src={a.preview} alt={a.nome} className="size-8 rounded object-cover" />
                      ) : null}
                      {a.nome}
                      <button
                        type="button"
                        aria-label={`Remover ${a.nome}`}
                        onClick={() => setAnexos((atual) => atual.filter((_, j) => j !== i))}
                        className="text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  enviarAgora();
                }}
                className="flex items-end gap-2.5 border-t border-border p-4"
              >
                <input
                  ref={inputArquivo}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    void (async () => {
                      for (const file of files) await anexarArquivo(file);
                    })();
                  }}
                />
                <button
                  type="button"
                  aria-label="Anexar arquivo"
                  title="Anexar imagem, arquivo de código ou um .zip do projeto"
                  onClick={() => inputArquivo.current?.click()}
                  className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-border bg-secondary transition hover:bg-accent"
                >
                  <Paperclip className="size-4" />
                </button>
                <textarea
                  ref={campoTexto}
                  rows={1}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviarAgora();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-border bg-secondary px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={mandar.isPending}
                  className="flex h-[42px] shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60"
                >
                  <Send className="size-4" /> Enviar
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>

      {configAberta ? <SettingsDialog onClose={() => setConfigAberta(false)} /> : null}

      {painel ? (
        <PainelRecursos
          painel={painel}
          onClose={() => setPainel(null)}
          projetoId={projetoId}
          arquivos={arquivos}
          agente={agente}
          onAgente={(id: string | null) => {
            setAgente(id);
            toast.success(id ? "Agente ativado para as próximas mensagens." : "Voltou ao padrão.");
          }}
          onUsarPrompt={(t: string) => {
            setTexto(t);
            campoTexto.current?.focus();
          }}
          onAtualizarProjeto={() => {
            void queryClient.invalidateQueries({ queryKey: ["projeto", projetoId] });
            void queryClient.invalidateQueries({ queryKey: ["projetos"] });
          }}
          onProjeto={(id: string) => setProjetoId(id)}
        />
      ) : null}
    </div>
  );
}
