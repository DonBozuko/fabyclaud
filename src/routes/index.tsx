import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bot,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  Cloud,
  Code2,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileArchive,
  FileCode,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  GraduationCap,
  Hand,
  LayoutGrid,
  Loader2,
  LogOut,
  MessageSquare,
  Paperclip,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkle,
  Sparkles,
  Swords,
  Trash2,
  Wifi,
  WifiOff,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import heroAsset from "@/assets/hero-matrix.png.asset.json";
import { PainelRecursos, type PainelNome } from "@/components/faby/PainelRecursos";
import { SettingsDialog } from "@/components/faby/SettingsDialog";
import { supabase } from "@/integrations/supabase/client";
import { garantirSessaoLocal, idUsuarioAtual, limparSessaoLocal } from "@/lib/faby/sessao-local";
import {
  apagarProjeto,
  apagarArquivo,
  enviarMensagem,
  obterCapacidades,
  listarProjetos,
  listarProvedoresCustom,
  obterProjeto,
  obterProgressoExecucao,
  salvarArquivo,
  listarChaves,
  salvarChave,
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

interface IndicadorProgressoConstrucaoProps {
  projetoId: string | null;
  modelo: string;
}

const ETAPAS_PROGRESSO: {
  id: string;
  rotulo: string;
  subtitulo: string;
  icone: typeof Bot;
  duracaoEstimadaSegundos: number;
}[] = [
  {
    id: "diagnostico",
    rotulo: "Diagnóstico",
    subtitulo: "Analisando pedido e contexto do VFS",
    icone: Search,
    duracaoEstimadaSegundos: 6,
  },
  {
    id: "planejamento",
    rotulo: "Planejamento",
    subtitulo: "Desenhando estrutura de arquivos e lógica",
    icone: Compass,
    duracaoEstimadaSegundos: 14,
  },
  {
    id: "construcao",
    rotulo: "Construção",
    subtitulo: "Escrevendo HTML, CSS e JavaScript",
    icone: Code2,
    duracaoEstimadaSegundos: 45,
  },
  {
    id: "revisao",
    rotulo: "Revisão",
    subtitulo: "Verificando integridade e sintaxe",
    icone: ShieldCheck,
    duracaoEstimadaSegundos: 20,
  },
  {
    id: "teste",
    rotulo: "Testes",
    subtitulo: "Validando componentes e preview",
    icone: Wrench,
    duracaoEstimadaSegundos: 15,
  },
  {
    id: "entrega",
    rotulo: "Entrega",
    subtitulo: "Sincronizando no VFS e preparando preview",
    icone: Sparkles,
    duracaoEstimadaSegundos: 10,
  },
];

function IndicadorProgressoConstrucao({ projetoId, modelo }: IndicadorProgressoConstrucaoProps) {
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);
  const buscarProgresso = useServerFn(obterProgressoExecucao);

  const { data: progresso } = useQuery({
    queryKey: ["progresso_execucao", projetoId],
    queryFn: () =>
      projetoId ? buscarProgresso({ data: { projeto_id: projetoId } }) : Promise.resolve(null),
    enabled: !!projetoId,
    refetchInterval: 1500,
  });

  useEffect(() => {
    const t0 = Date.now();
    const interval = setInterval(() => {
      setSegundosDecorridos(Math.floor((Date.now() - t0) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const etapasComStatus = useMemo(() => {
    const etapasDb = progresso?.etapas ?? [];
    const etapaAtualDb = progresso?.execucao?.etapa_atual;

    let idxEstimado = 0;
    if (segundosDecorridos < 5) idxEstimado = 0;
    else if (segundosDecorridos < 15) idxEstimado = 1;
    else if (segundosDecorridos < 65) idxEstimado = 2;
    else if (segundosDecorridos < 90) idxEstimado = 3;
    else if (segundosDecorridos < 110) idxEstimado = 4;
    else idxEstimado = 5;

    return ETAPAS_PROGRESSO.map((item, index) => {
      const encontradaDb = etapasDb.find((e: any) => e.etapa === item.id);
      let estado: "concluida" | "em_andamento" | "pendente" = "pendente";
      let resumo = item.subtitulo;

      if (encontradaDb) {
        if (encontradaDb.estado === "concluida") estado = "concluida";
        else if (encontradaDb.estado === "em_andamento") estado = "em_andamento";
        if (encontradaDb.resultado_resumo) {
          resumo = encontradaDb.resultado_resumo.slice(0, 100);
        }
      } else if (etapaAtualDb) {
        const idxAtualDb = ETAPAS_PROGRESSO.findIndex((e) => e.id === etapaAtualDb);
        if (idxAtualDb > index) estado = "concluida";
        else if (idxAtualDb === index) estado = "em_andamento";
        else estado = "pendente";
      } else {
        if (index < idxEstimado) estado = "concluida";
        else if (index === idxEstimado) estado = "em_andamento";
        else estado = "pendente";
      }

      return {
        ...item,
        estado,
        resumo,
      };
    });
  }, [progresso, segundosDecorridos]);

  const etapaAtiva =
    etapasComStatus.find((e) => e.estado === "em_andamento") ||
    etapasComStatus[etapasComStatus.length - 1];
  const concluidasCount = etapasComStatus.filter((e) => e.estado === "concluida").length;
  const porcentagemGeral = Math.min(
    95,
    Math.round(((concluidasCount + 0.5) / ETAPAS_PROGRESSO.length) * 100),
  );

  const modeloLabel = modelo && PROVIDER_LABELS[modelo] ? PROVIDER_LABELS[modelo] : modelo || "IA";

  function formatarTempo(s: number) {
    if (s < 60) return `${s}s`;
    const min = Math.floor(s / 60);
    const resto = s % 60;
    return `${min}m ${resto}s`;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mr-auto w-full max-w-xl rounded-2xl border border-border/80 bg-secondary/80 p-4 shadow-glow backdrop-blur-md transition-all duration-300"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-3">
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
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Orquestrando Criação</span>
              <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                {modeloLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {etapaAtiva?.rotulo}:{" "}
              <span className="text-foreground/90 font-medium">{etapaAtiva?.resumo}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="flex items-center gap-1 font-mono text-xs font-semibold text-primary">
            <Clock className="size-3.5 animate-pulse" />
            {formatarTempo(segundosDecorridos)}
          </span>
          <span className="text-[10px] text-muted-foreground">{porcentagemGeral}% concluído</span>
        </div>
      </div>

      <div className="my-3 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_12px_rgba(57,255,156,0.8)]"
          style={{ width: `${porcentagemGeral}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {etapasComStatus.map((etapa) => {
          const Icone = etapa.icone;
          const isConcluida = etapa.estado === "concluida";
          const isAtiva = etapa.estado === "em_andamento";

          return (
            <div
              key={etapa.id}
              className={`flex items-center gap-2 rounded-xl border p-2 transition-all duration-300 ${
                isAtiva
                  ? "border-primary bg-primary/10 shadow-[0_0_8px_rgba(57,255,156,0.25)]"
                  : isConcluida
                    ? "border-border/60 bg-background/40 opacity-90"
                    : "border-border/30 bg-background/20 opacity-40"
              }`}
            >
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${
                  isConcluida
                    ? "bg-primary text-primary-foreground font-bold"
                    : isAtiva
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isConcluida ? (
                  <Check className="size-3.5 stroke-[3]" />
                ) : isAtiva ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                ) : (
                  <Icone className="size-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-xs font-semibold ${isAtiva ? "text-primary" : "text-foreground"}`}
                >
                  {etapa.rotulo}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {isConcluida ? "Concluído" : isAtiva ? "Executando..." : "Aguardando"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function extrairSugestoesAcao(conteudo: string): string[] {
  if (!conteudo) return [];
  const sugestoes: string[] = [];
  const linhas = conteudo.split("\n");
  let naSecaoPassos = false;

  for (const linha of linhas) {
    const limpo = linha.trim();
    if (
      /pr[oó]ximos?\s+passos?|sugest[õo]es|op[çc][õo]es|o\s+que\s+deseja|personaliza[çc]|posso\s+fazer/i.test(
        limpo,
      )
    ) {
      naSecaoPassos = true;
      continue;
    }
    if (naSecaoPassos) {
      if (!limpo) continue;
      if (/^#{1,4}\s+|^-{3,}/.test(limpo)) {
        naSecaoPassos = false;
        continue;
      }
      const match = limpo.match(/^(?:(?:\d+\.|[-*•]|💡|🚀)\s*)(.+)$/);
      if (match && match[1]) {
        const textoSugestao = match[1].replace(/\*\*/g, "").replace(/["']/g, "").trim();
        if (textoSugestao.length >= 6 && textoSugestao.length <= 110) {
          sugestoes.push(textoSugestao);
        }
      }
    }
  }

  if (sugestoes.length === 0) {
    for (const linha of linhas) {
      const limpo = linha.trim();
      const match = limpo.match(
        /^(?:(?:\d+\.|[-*•])\s*)(?:\*\*)?(?:Adicionar|Criar|Integrar|Personalizar|Modificar|Implementar|Mudar|Conectar|Trocar)\b(.+)$/i,
      );
      if (match) {
        const textoSugestao = limpo
          .replace(/^(?:\d+\.|[-*•])\s*/, "")
          .replace(/\*\*/g, "")
          .replace(/["']/g, "")
          .trim();
        if (textoSugestao.length >= 6 && textoSugestao.length <= 110) {
          sugestoes.push(textoSugestao);
        }
      }
    }
  }

  return sugestoes.slice(0, 4);
}

function FabyClaud() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pronto, setPronto] = useState(false);
  const [logado, setLogado] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    function aoFicarOnline() {
      setIsOnline(true);
      toast.success("Conexão com a internet restabelecida.");
    }
    function aoFicarOffline() {
      setIsOnline(false);
      toast.warning("Você está sem conexão com a internet. O modo offline está ativo.");
    }
    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);
    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Modo local explícito: a mesma sessão que o servidor lê nas chamadas protegidas.
      garantirSessaoLocal();
      setLogado(true);
      setPronto(true);
    }

    const { data } = supabase.auth.onAuthStateChange((_e: any, sessao: any) => {
      if (sessao) {
        setLogado(true);
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data }: { data: { session: any } }) => {
        if (data?.session) {
          setLogado(true);
        }
        setPronto(true);
      })
      .catch(() => {
        setLogado(true);
        setPronto(true);
      });

    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const buscarProjetos = useServerFn(listarProjetos);
  const buscarProjeto = useServerFn(obterProjeto);
  const buscarCustom = useServerFn(listarProvedoresCustom);
  const buscarCapacidades = useServerFn(obterCapacidades);
  const buscarChavesFn = useServerFn(listarChaves);
  const salvarChaveFn = useServerFn(salvarChave);
  const removerProjeto = useServerFn(apagarProjeto);
  const enviar = useServerFn(enviarMensagem);
  const importarZip = useServerFn(importarArquivosZip);
  const publicar = useServerFn(publicarProjeto);
  const guardarArquivoFn = useServerFn(salvarArquivo);
  const apagarArquivoFn = useServerFn(apagarArquivo);

  const [projetoId, setProjetoId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("faby_active_project_id");
    }
    return null;
  });
  const [modelo, setModelo] = useState("google");
  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [duelo, setDuelo] = useState(false);
  const [conversasAbertas, setConversasAbertas] = useState(true);
  const [configAberta, setConfigAberta] = useState(false);
  const [painel, setPainel] = useState<PainelNome | null>(null);
  const [agente, setAgente] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  // Controle de abas da tela principal: Prévia ou Código/Editor
  const [abaPrincipal, setAbaPrincipal] = useState<"previa" | "codigo">("previa");
  const [arquivoAtivo, setArquivoAtivo] = useState<string>("");
  const [codigoEditando, setCodigoEditando] = useState<string>("");
  const [salvandoArquivo, setSalvandoArquivo] = useState(false);

  const [idContaReal, setIdContaReal] = useState<string | null>(null);
  const isFirstProjectLoad = useRef(true);

  useEffect(() => {
    let ativo = true;
    void supabase.auth
      .getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) => {
        if (ativo) setIdContaReal(data?.user?.id ?? null);
      })
      .catch((erro: unknown) => {
        // Sem conta na nuvem o app segue em modo local; registra para diagnóstico.
        console.warn("[FabyClaud] Não foi possível confirmar a conta na nuvem.", erro);
      });
    return () => {
      ativo = false;
    };
  }, []);

  // O mesmo identificador que o servidor usa nas chamadas protegidas:
  // conta real quando existir, senão a sessão local.
  const usuarioId = useMemo(() => idUsuarioAtual(idContaReal), [idContaReal]);

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

  const chaves = useQuery({
    queryKey: ["chaves"],
    queryFn: () => buscarChavesFn(),
    enabled: logado,
  });

  // Auto-sincronização de chaves locais do navegador com o backend logo no início
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const salvas = JSON.parse(localStorage.getItem("faby_local_keys") || "{}");
        const entries = Object.entries(salvas);
        if (entries.length > 0 && chaves.data) {
          for (const [prov, info] of entries) {
            const dados = info as { key?: string; api_url?: string };
            if (dados?.key && !chaves.data.some((k: any) => k.provider === prov)) {
              salvarChaveFn({
                data: {
                  provider: prov,
                  key: dados.key,
                  api_url: prov === "omniroute" ? dados.api_url || "" : "",
                },
              })
                .then(() => {
                  void queryClient.invalidateQueries({ queryKey: ["chaves"] });
                  void queryClient.invalidateQueries({ queryKey: ["capacidades"] });
                })
                .catch((erro: unknown) => {
                  console.warn("[FabyClaud] Não foi possível reaproveitar a chave salva.", erro);
                });
            }
          }
        }
      } catch (erro) {
        console.warn("[FabyClaud] Chaves salvas no navegador estavam ilegíveis.", erro);
      }
    }
  }, [chaves.data, queryClient, salvarChaveFn]);

  useEffect(() => {
    if (!projetos.data || projetos.data.length === 0) return;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("faby_projects_backup", JSON.stringify(projetos.data));
      } catch (erro) {
        console.warn("[FabyClaud] Não foi possível guardar a cópia local dos projetos.", erro);
      }
    }
    if (isFirstProjectLoad.current) {
      isFirstProjectLoad.current = false;
      const salvo =
        typeof window !== "undefined" ? localStorage.getItem("faby_active_project_id") : null;
      if (salvo && projetos.data.some((p: any) => p.id === salvo)) {
        setProjetoId(salvo);
      } else if (!projetoId && projetos.data.length > 0) {
        setProjetoId(projetos.data[0]?.id || null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projetos.data]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (projetoId) {
        localStorage.setItem("faby_active_project_id", projetoId);
      } else {
        localStorage.removeItem("faby_active_project_id");
      }
    }
  }, [projetoId]);

  const [pendente, setPendente] = useState<string | null>(null);
  const [pendenteAnexos, setPendenteAnexos] = useState<Anexo[]>([]);

  const mandar = useMutation({
    mutationFn: async (vars: { prompt: string; anexos: Anexo[] }) => {
      // Timeout no cliente: o servidor já limita cada tentativa de modelo, mas o modo
      // Duelo pode encadear várias rodadas de correção. Sem um limite aqui, uma falha
      // de rede ou uma resposta que nunca chega deixa o botão "Enviar" girando pra
      // sempre, sem nenhum erro visível para a pessoa tentar de novo.
      const TEMPO_LIMITE_CLIENTE_MS = 4 * 60_000;
      const pedido = enviar({
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
      const limite = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "A geração demorou demais e foi cancelada por aqui. Ela pode ainda terminar em segundo plano — dê um tempo e clique em Nova conversa ou tente de novo com outro modelo.",
            ),
          );
        }, TEMPO_LIMITE_CLIENTE_MS);
      });
      return Promise.race([pedido, limite]);
    },
    onSettled: () => {
      setPendente(null);
      setPendenteAnexos([]);
    },
    onSuccess: async (r) => {
      setProjetoId(r.projeto_id);
      if (typeof window !== "undefined") {
        localStorage.setItem("faby_active_project_id", r.projeto_id);
      }
      await queryClient.invalidateQueries({ queryKey: ["projetos"] });
      await queryClient.refetchQueries({ queryKey: ["projetos"] });
      await queryClient.invalidateQueries({ queryKey: ["projeto", r.projeto_id] });
      await queryClient.refetchQueries({ queryKey: ["projeto", r.projeto_id] });
      campoTexto.current?.focus();
    },
    onError: (e) => {
      if (typeof window !== "undefined" && !navigator.onLine) {
        toast.error("Sem conexão com a internet. Verifique sua rede e tente novamente.");
      } else {
        toast.error(e instanceof Error ? e.message : "Não conseguimos enviar agora.");
      }
    },
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
  const arquivos = useMemo(
    () => (projeto.data?.arquivos ?? {}) as Record<string, string>,
    [projeto.data?.arquivos],
  );
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

  const nomesArquivos = useMemo(() => Object.keys(arquivos), [arquivos]);

  useEffect(() => {
    if (nomesArquivos.length > 0) {
      if (!arquivoAtivo || !nomesArquivos.includes(arquivoAtivo)) {
        const principal = nomesArquivos.includes("index.html") ? "index.html" : nomesArquivos[0]!;
        setArquivoAtivo(principal);
        setCodigoEditando(arquivos[principal] ?? "");
      } else {
        setCodigoEditando(arquivos[arquivoAtivo] ?? "");
      }
    } else {
      setArquivoAtivo("");
      setCodigoEditando("");
    }
  }, [nomesArquivos, arquivos, arquivoAtivo]);

  async function salvarCodigoManual() {
    if (!projetoId || !arquivoAtivo) return;
    setSalvandoArquivo(true);
    const aviso = toast.loading(`Salvando ${arquivoAtivo}...`);
    try {
      const res = (await guardarArquivoFn({
        data: { projeto_id: projetoId, nome: arquivoAtivo, conteudo: codigoEditando },
      })) as any;
      if (!res?.ok) {
        toast.error(res?.msg ?? "Erro ao salvar arquivo.", { id: aviso });
      } else {
        toast.success(`${arquivoAtivo} salvo com sucesso!`, { id: aviso });
        void queryClient.invalidateQueries({ queryKey: ["projeto", projetoId] });
      }
    } catch (erro) {
      console.error("[FabyClaud] Falha ao salvar arquivo:", erro);
      const detalhe = erro instanceof Error ? erro.message : String(erro);
      toast.error(`Não foi possível salvar o arquivo. Motivo: ${detalhe}`, { id: aviso });
    } finally {
      setSalvandoArquivo(false);
    }
  }

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
    if (!problemasPrevia.length || mandar.isPending) return;
    const currentProj = projetoId ?? "novo";
    const assinatura = `${currentProj}::${problemasPrevia.join("|")}`;
    if (automatico && consertosFeitos.current.has(assinatura)) return;
    consertosFeitos.current.add(assinatura);
    const prompt = [
      "O controle de qualidade abriu o projeto no navegador, clicou em cada botão e encontrou estes problemas reais:",
      ...problemasPrevia.map((e) => `- ${e}`),
      "",
      "Corrija a causa de cada item nos arquivos do projeto, mantendo toda a lógica e o visual que já funcionavam.",
      "Botão sem ação precisa ganhar comportamento de verdade (abrir tela, salvar, filtrar, validar), não um alerta vazio.",
      'Entregue os arquivos completos alterados com as tags <arquivo nome="...">.',
      automatico ? "(conserto disparado automaticamente pelo controle de qualidade)" : "",
    ]
      .filter(Boolean)
      .join("\n");
    setPendente("Consertando o que o controle de qualidade encontrou...");
    setPendenteAnexos([]);
    setErrosPreview([]);
    setAuditoria(null);
    mandar.mutate({ prompt, anexos: [] });
  }

  // Rolagem automática do chat
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
    <div className="relative h-screen overflow-hidden text-foreground">
      {/* Imagem de Fundo (Homem de Capuz / Matrix) com Overlay de Profundidade */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-[center_20%] bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: `url(${heroAsset.url})` }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 bg-black/65 backdrop-blur-[4px]" aria-hidden />

      <div className="flex h-screen gap-3.5 p-3.5">
        {/* ===== BARRA LATERAL MODERNA ===== */}
        <aside className="panel-glass flex w-[240px] shrink-0 flex-col gap-3 rounded-2xl p-3.5 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setProjetoId(null);
              if (typeof window !== "undefined") {
                localStorage.removeItem("faby_active_project_id");
              }
              setTexto("");
              setAnexos([]);
              setErrosPreview([]);
              setAuditoria(null);
              setAbaPrincipal("previa");
              campoTexto.current?.focus();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4" /> Novo Projeto
          </button>

          <button
            type="button"
            onClick={() => setConversasAbertas((v) => !v)}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs font-semibold text-foreground/90 transition hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="size-3.5 text-primary" /> Meus Projetos
            </span>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
              {projetos.data?.length ?? 0}
            </span>
          </button>

          {conversasAbertas ? (
            <div className="flex max-h-52 flex-col gap-1 overflow-y-auto pr-1">
              {(projetos.data ?? []).map((p: any) => {
                const estaAtivo = projetoId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`group flex items-center justify-between rounded-xl border px-2 py-1.5 transition-all ${
                      estaAtivo
                        ? "border-primary/50 bg-primary/15 text-primary shadow-sm"
                        : "border-transparent bg-white/[0.03] text-muted-foreground hover:border-white/10 hover:bg-white/[0.08] hover:text-foreground"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setProjetoId(p.id);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("faby_active_project_id", p.id);
                        }
                        setAbaPrincipal("previa");
                      }}
                      title={p.nome}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <Globe
                        className={`size-3.5 shrink-0 ${
                          estaAtivo ? "text-primary animate-pulse" : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`truncate text-xs ${
                          estaAtivo ? "font-bold text-primary" : "font-medium"
                        }`}
                      >
                        {p.nome}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Apagar ${p.nome}`}
                      title={`Excluir ${p.nome}`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const idParaApagar = p.id;
                        queryClient.setQueryData(["projetos"], (old: any) =>
                          Array.isArray(old)
                            ? old.filter((item: any) => item.id !== idParaApagar)
                            : [],
                        );
                        if (typeof window !== "undefined") {
                          try {
                            const salvos = JSON.parse(
                              localStorage.getItem("faby_projects_backup") || "[]",
                            );
                            if (Array.isArray(salvos)) {
                              localStorage.setItem(
                                "faby_projects_backup",
                                JSON.stringify(
                                  salvos.filter((item: any) => item.id !== idParaApagar),
                                ),
                              );
                            }
                          } catch {}
                        }
                        if (projetoId === idParaApagar) {
                          setProjetoId(null);
                          if (typeof window !== "undefined") {
                            localStorage.removeItem("faby_active_project_id");
                          }
                        }
                        queryClient.removeQueries({ queryKey: ["projeto", idParaApagar] });

                        try {
                          await removerProjeto({ data: { id: idParaApagar } });
                          await queryClient.invalidateQueries({ queryKey: ["projetos"] });
                          toast.success("Projeto excluído com sucesso.");
                        } catch {
                          await queryClient.invalidateQueries({ queryKey: ["projetos"] });
                          toast.error("Não foi possível excluir o projeto.");
                        }
                      }}
                      className="rounded-lg p-1 text-muted-foreground opacity-40 transition hover:bg-destructive/20 hover:text-destructive hover:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
              {projetos.data?.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Nenhum projeto ainda.
                </p>
              ) : null}
            </div>
          ) : null}

          <nav className="flex flex-col gap-0.5 pt-1">
            {ITENS_MENU.map(({ nome, Icone, painel }) => (
              <button
                key={nome}
                type="button"
                onClick={() => setPainel(painel)}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground/80 transition hover:bg-white/[0.08] hover:text-primary"
              >
                <span className="flex items-center gap-2.5">
                  <Icone className="size-4 text-primary/80" /> {nome}
                </span>
                {painel === "agentes" && agente ? (
                  <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                    Ativo
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-2 border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={async () => {
                limparSessaoLocal();
                try {
                  await supabase.auth.signOut();
                } catch (erro) {
                  console.warn("[FabyClaud] Saída da conta na nuvem falhou:", erro);
                }
                void navigate({ to: "/auth" });
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-white/5 hover:text-primary"
            >
              <LogOut className="size-3.5" /> Sair da conta
            </button>
          </div>
        </aside>

        {/* ===== ÁREA PRINCIPAL ===== */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <header className="panel-glass flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="flex size-[38px] items-center justify-center rounded-xl border border-primary/30 bg-primary/10 shadow-inner">
                <Bot className="size-5 text-primary" />
              </span>
              <div>
                <h1 className="flex items-center gap-2 text-base font-bold text-foreground">
                  FabyClaud
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                    GRÁTIS
                  </span>
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Engenharia Autônoma de Software com Provas Reais
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-white/10"
              >
                <FolderOpen className="size-3.5 text-primary" /> Abrir projeto
              </button>
              <button
                type="button"
                onClick={() => inputZip.current?.click()}
                aria-label="Abrir projeto em ZIP"
                title="Abrir projeto por arquivo ZIP"
                className="flex size-[34px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-foreground transition hover:border-primary/40 hover:bg-white/10"
              >
                <FileArchive className="size-3.5 text-primary" />
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
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-white/10"
                  >
                    <ExternalLink className="size-3.5 text-primary" /> Prévia
                  </button>
                  <button
                    type="button"
                    onClick={() => void baixarProjetoZip(projeto.data?.nome ?? "projeto", arquivos)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-white/10"
                  >
                    <Download className="size-3.5 text-primary" /> Baixar
                  </button>
                  <button
                    type="button"
                    disabled={publicando}
                    onClick={() => void publicarSite()}
                    title="Coloca o projeto no ar e te dá o endereço do site"
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-white/10 disabled:opacity-60"
                  >
                    <Globe className="size-3.5 text-primary" /> {publicando ? "Publicando..." : "Publicar"}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setDuelo((v) => !v)}
                aria-pressed={duelo}
                title="Várias IAs respondem ao mesmo tempo e a melhor resposta vence"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  duelo
                    ? "border-primary bg-primary text-primary-foreground shadow-glow"
                    : "border-white/10 bg-white/5 text-foreground hover:border-primary/40 hover:bg-white/10"
                }`}
              >
                <Swords className="size-3.5" /> Duelo
              </button>
              <select
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                aria-label="Escolher a IA"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary"
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
                className="flex size-[34px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-foreground transition hover:border-primary/40 hover:bg-white/10"
              >
                <Settings className="size-4" />
              </button>
            </div>
          </header>

          {!isOnline ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-medium text-amber-200 backdrop-blur-md">
              <WifiOff className="size-4 shrink-0 text-amber-400 animate-pulse" />
              <span>
                <strong>Modo Offline Ativo:</strong> Você está sem conexão com a internet. Seus
                projetos locais estão preservados e prontos para edição.
              </span>
            </div>
          ) : null}

          <section
            className="panel-glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-1.5 text-[11px]"
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
                className="ml-auto font-medium text-primary underline hover:brightness-110"
              >
                Conectar IA
              </button>
            ) : null}
          </section>

          <div className="flex min-h-0 flex-1 gap-3.5">
            {/* ÁREA DE PRÉVIA OU CÓDIGO */}
            <section className="panel-glass relative flex min-w-[300px] flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              {/* Barra de controle de abas */}
              <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setAbaPrincipal("previa")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      abaPrincipal === "previa"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="size-3.5" /> Prévia
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaPrincipal("codigo")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      abaPrincipal === "codigo"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Code2 className="size-3.5" /> Código ({nomesArquivos.length})
                  </button>
                </div>

                {abaPrincipal === "codigo" && nomesArquivos.length > 0 ? (
                  <button
                    type="button"
                    disabled={salvandoArquivo || !arquivoAtivo}
                    onClick={() => void salvarCodigoManual()}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50"
                  >
                    <Save className="size-3.5" />{" "}
                    {salvandoArquivo ? "Salvando..." : "Salvar alterações"}
                  </button>
                ) : null}
              </div>

              {/* Conteúdo da Aba */}
              {abaPrincipal === "previa" ? (
                <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                  {previewComSonda ? (
                    <>
                      <iframe
                        title="Prévia do projeto"
                        srcDoc={previewComSonda}
                        sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
                        className="size-full bg-white"
                      />
                    </>
                  ) : (
                    <div className="max-w-[280px] p-8 text-center text-muted-foreground">
                      <Wrench className="mx-auto mb-3 size-8 text-primary/70" />
                      <h2 className="mb-2 text-base font-semibold text-foreground">
                        {Object.keys(arquivos).length ? "Arquivos importados" : "Prévia do projeto"}
                      </h2>
                      {Object.keys(arquivos).length ? (
                        <p className="text-xs leading-relaxed">
                          {Object.keys(arquivos).length} arquivo(s) disponíveis. Clique na aba{" "}
                          <strong className="text-primary">Código</strong> para inspecionar e editar.
                        </p>
                      ) : (
                        <p className="text-xs leading-relaxed">
                          Abra uma pasta, envie um ZIP ou peça um site no chat para começar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Aba de Código / Editor integrado */
                <div className="flex flex-1 flex-col overflow-hidden bg-black/30">
                  {nomesArquivos.length > 0 ? (
                    <>
                      {/* Abas dos Arquivos */}
                      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-black/40 px-3 py-2 scrollbar-none">
                        {nomesArquivos.map((nome) => (
                          <button
                            key={nome}
                            type="button"
                            onClick={() => {
                              setArquivoAtivo(nome);
                              setCodigoEditando(arquivos[nome] ?? "");
                            }}
                            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-mono transition ${
                              arquivoAtivo === nome
                                ? "bg-primary/20 font-bold text-primary border border-primary/40"
                                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                            }`}
                          >
                            <FileCode className="size-3.5" />
                            {nome}
                          </button>
                        ))}
                      </div>

                      {/* Editor Monospace */}
                      <div className="relative flex flex-1 flex-col p-3 overflow-hidden">
                        <textarea
                          value={codigoEditando}
                          onChange={(e) => setCodigoEditando(e.target.value)}
                          spellCheck={false}
                          className="size-full resize-none rounded-xl border border-white/10 bg-black/70 p-4 font-mono text-xs leading-relaxed text-emerald-300 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary shadow-inner"
                          placeholder="Selecione um arquivo para editar seu código..."
                        />
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground px-1">
                          <span>
                            Arquivo ativo: <strong className="text-primary">{arquivoAtivo}</strong> (
                            {(codigoEditando || "").length} caracteres)
                          </span>
                          <span>
                            Clique em <strong>Salvar alterações</strong> para atualizar a prévia.
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
                      <div>
                        <FileCode className="mx-auto mb-3 size-8 text-muted-foreground/60" />
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                          Nenhum arquivo ainda
                        </h2>
                        <p className="text-xs max-w-xs">
                          Peça para a IA criar o projeto ou envie seus arquivos pelo chat para
                          começar a editar o código.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* CHAT MODERNO */}
            <section className="panel-glass flex min-w-[320px] flex-[1.25] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <div ref={areaChat} className="flex-1 space-y-3 overflow-y-auto p-4">
                {mensagens.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-center shadow-lg">
                    <p className="flex items-center justify-center gap-2 font-bold text-primary">
                      <Hand className="size-4" /> Olá! Sou a FabyClaud
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Peça uma calculadora sem chave, ou conecte uma IA testada para projetos
                      personalizados.
                    </p>
                  </div>
                ) : null}

                {mensagens.map((m: any) => {
                  const sugestoes =
                    m.role === "assistant" && m.ok ? extrairSugestoesAcao(m.conteudo) : [];
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                        m.role === "user"
                          ? "ml-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-emerald-500/10"
                          : m.ok
                            ? "mr-auto border border-white/10 bg-black/60 text-foreground"
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
                      {sugestoes.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-2.5">
                          {sugestoes.map((sugestao, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => {
                                setTexto(sugestao);
                                campoTexto.current?.focus();
                              }}
                              className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                            >
                              <Sparkles className="size-3 shrink-0" />
                              <span>{sugestao}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {m.role === "assistant" && m.modelo ? (
                        <span className="mt-1.5 block text-[10px] text-muted-foreground/80">
                          {PROVIDER_LABELS[m.modelo] ?? m.modelo}
                        </span>
                      ) : null}
                    </div>
                  );
                })}

                {pendente ? (
                  <div className="ml-auto max-w-[88%] whitespace-pre-wrap rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-xs leading-relaxed text-white opacity-85 shadow-md">
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

                {mandar.isPending ? (
                  <IndicadorProgressoConstrucao projetoId={projetoId} modelo={modelo} />
                ) : null}
              </div>

              {anexos.length ? (
                <div className="flex flex-wrap gap-2 border-t border-white/10 bg-black/40 px-4 py-2">
                  {anexos.map((a, i) => (
                    <span
                      key={`${a.nome}-${i}`}
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-[11px]"
                    >
                      {a.tipo === "imagem" ? (
                        <img src={a.preview} alt={a.nome} className="size-8 rounded object-cover" />
                      ) : null}
                      {a.nome}
                      <button
                        type="button"
                        aria-label={`Remover ${a.nome}`}
                        onClick={() => setAnexos((atual) => atual.filter((_, j) => j !== i))}
                        className="text-destructive font-bold hover:scale-110"
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
                className="flex items-end gap-2 border-t border-white/10 bg-black/40 p-3"
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
                  className="flex size-[40px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-foreground transition hover:border-primary/40 hover:bg-white/10"
                >
                  <Paperclip className="size-4 text-primary" />
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
                  className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary shadow-inner placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  disabled={mandar.isPending}
                  className="flex h-[40px] shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  <Send className="size-3.5" /> Enviar
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
