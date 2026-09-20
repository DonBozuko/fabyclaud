import React, { useState, useRef } from "react";
import {
  Video,
  Play,
  Download,
  RotateCcw,
  XCircle,
  Film,
  Sparkles,
  Layers,
  Clock,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Tv,
  Smartphone,
  Square,
  Terminal,
} from "lucide-react";
import type { VideoAspectRatio, VideoProject, VideoStep } from "@/lib/faby/video/types";
import { VideoPipelineOrchestrator } from "@/lib/faby/video/VideoPipeline";
import { toast } from "sonner";

interface PainelVideoProps {
  userId: string;
}

const ETAPAS_LABELS: Record<VideoStep, string> = {
  nao_configurado: "Não Configurado",
  pronto: "Pronto para Iniciar",
  planejando: "Planejando Estrutura",
  gerando_roteiro: "Gerando Roteiro & Narrativa",
  preparando_cenas: "Montando Storyboard",
  baixando_imagens: "Baixando Ativos",
  gerando_imagens: "Gerando Imagens HD por Cena",
  preparando_audio: "Sintetizando Áudio & Legendas",
  renderizando: "Renderizando Frames de Vídeo",
  validando: "Validando Arquivo e Mídia",
  concluido: "Vídeo Renderizado com Sucesso!",
  falhou: "Falha na Produção",
  cancelado: "Produção Cancelada",
};

export function PainelVideo({ userId }: PainelVideoProps) {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [durationSeconds, setDurationSeconds] = useState<number>(15);
  const [language, setLanguage] = useState("pt-BR");
  const [visualStyle, setVisualStyle] = useState("Cinematográfico Moderno");
  const [voice, setVoice] = useState("Voz Neural Português (Brasil)");
  const [audioTrack, setAudioTrack] = useState("Trilha Sonora Inspiradora");

  const [project, setProject] = useState<VideoProject | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const isCancelledRef = useRef(false);

  const handleStartGeneration = async () => {
    if (!prompt.trim()) {
      toast.error("Digite o tema ou descrição do vídeo.");
      return;
    }

    isCancelledRef.current = false;
    setIsRunning(true);

    try {
      const result = await VideoPipelineOrchestrator.executeFullPipeline({
        userId: userId || "anon",
        prompt: prompt.trim(),
        title: title.trim() || undefined,
        aspectRatio,
        durationSeconds,
        language,
        onProgress: (progress, step, log) => {
          if (isCancelledRef.current) {
            throw new Error("Geração cancelada pelo usuário.");
          }
          setProject((prev) => {
            const currentLogs = prev
              ? [...prev.logs, `[${new Date().toLocaleTimeString()}] ${log}`]
              : [`[${new Date().toLocaleTimeString()}] ${log}`];
            return {
              ...(prev || {
                id: "tmp",
                userId,
                title: title.trim() || prompt.slice(0, 30),
                prompt,
                language,
                aspectRatio,
                durationSeconds,
                status: "planning",
                script: null,
                scenes: [],
                audioUrl: null,
                videoUrl: null,
                thumbnailUrl: null,
                errorMessage: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }),
              progress,
              currentStep: step,
              logs: currentLogs.slice(-25),
            };
          });
        },
      });

      setProject(result);
      if (result.status === "completed") {
        toast.success("Vídeo renderizado e pronto para download!");
      } else if (result.status === "failed") {
        toast.error(`Erro: ${result.errorMessage}`);
      }
    } catch (err: any) {
      if (isCancelledRef.current) {
        setProject((prev) =>
          prev
            ? {
                ...prev,
                status: "cancelled",
                currentStep: "cancelado",
                logs: [...prev.logs, "Produção cancelada pelo usuário."],
              }
            : null,
        );
        toast.info("Geração cancelada.");
      } else {
        toast.error(`Erro: ${err?.message || "Falha na geração"}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setIsRunning(false);
  };

  const handleDownload = () => {
    if (!project?.videoUrl) return;
    const a = document.createElement("a");
    a.href = project.videoUrl;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "video"}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download iniciado!");
  };

  const currentStep = project?.currentStep ?? "pronto";
  const progress = project?.progress ?? 0;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-6 space-y-6 text-foreground">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Film className="size-6 text-primary animate-pulse" />
            Motor Real de Vídeo (VideoMaker 9 Agentes)
          </h2>
          <p className="text-xs text-muted-foreground">
            Pipeline autônomo completo: roteiro, storyboard, síntese visual HD, narração, transições
            Ken Burns e renderização real em vídeo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all"
            >
              <XCircle className="size-4" /> Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartGeneration}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              <Sparkles className="size-4" />{" "}
              {project?.status === "completed" ? "Gerar Novo Vídeo" : "Produzir Vídeo Real"}
            </button>
          )}
        </div>
      </div>

      {/* Grid Principal: Configuração & Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Configurações (4 Colunas) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold border-b border-border/40 pb-2">
              <Settings2 className="size-4 text-primary" /> Parâmetros do Vídeo
            </h3>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Tema ou Roteiro do Vídeo:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isRunning}
                placeholder="Ex: Explique como a inteligência artificial está transformando a criação de software no estilo Lovable..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background p-2.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Título do Projeto (opcional):
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isRunning}
                placeholder="Ex: O Futuro do Desenvolvimento com IA"
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Formato / Aspect Ratio */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Formato / Proporção:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "16:9", label: "Horizontal (16:9)", icon: Tv },
                  { key: "9:16", label: "Vertical / Reels (9:16)", icon: Smartphone },
                  { key: "1:1", label: "Quadrado / Feed (1:1)", icon: Square },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = aspectRatio === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={isRunning}
                      onClick={() => setAspectRatio(item.key as VideoAspectRatio)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[11px] font-medium transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                          : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4 mb-1" />
                      {item.key}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duração & Cenas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Duração Estimada:
                </label>
                <select
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full rounded-lg border border-border bg-background p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value={10}>10 segundos (2 cenas)</option>
                  <option value={15}>15 segundos (3 cenas)</option>
                  <option value={20}>20 segundos (4 cenas)</option>
                  <option value={30}>30 segundos (6 cenas)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Idioma:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isRunning}
                  className="w-full rounded-lg border border-border bg-background p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
            </div>

            {/* Estilo & Voz */}
            <div className="grid grid-cols-1 gap-2 text-xs border-t border-border/40 pt-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Estilo Visual:</span>
                <span className="font-semibold text-foreground">{visualStyle}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Narração:</span>
                <span className="font-semibold text-foreground">{voice}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Trilha de Fundo:</span>
                <span className="font-semibold text-foreground">{audioTrack}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Painel do Player & Progresso (8 Colunas) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card do Player / Pré-visualização */}
          <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-primary" />
                <span className="text-sm font-semibold">
                  {project?.title || "Pré-visualização do Vídeo"}
                </span>
              </div>

              {project?.status === "completed" && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="size-3.5" /> 100% Validado
                </span>
              )}
            </div>

            {/* Viewport do Vídeo */}
            <div
              className={`relative mx-auto flex items-center justify-center rounded-lg border border-border bg-black overflow-hidden shadow-inner ${
                aspectRatio === "9:16"
                  ? "aspect-[9/16] max-h-[460px]"
                  : aspectRatio === "1:1"
                    ? "aspect-square max-h-[460px]"
                    : "aspect-video max-h-[460px]"
              } w-full`}
            >
              {project?.videoUrl ? (
                <video
                  src={project.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="size-full object-contain"
                />
              ) : project?.scenes && project.scenes.length > 0 ? (
                <div className="relative size-full flex flex-col items-center justify-center">
                  <img
                    src={project.scenes[0].imageUrl || ""}
                    alt="Cena 1"
                    className="size-full object-contain opacity-75"
                  />
                  {isRunning && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center space-y-3">
                      <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-bold text-white">
                        {ETAPAS_LABELS[currentStep] || "Processando..."}
                      </p>
                      <p className="text-xs text-zinc-300">
                        Renderizando frames e sincronizando elementos visuais...
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-muted-foreground">
                  <Film className="size-12 opacity-30 stroke-1" />
                  <p className="text-xs font-medium">Nenhum vídeo renderizado ainda.</p>
                  <p className="text-[11px] opacity-70">
                    Defina o tema e clique em "Produzir Vídeo Real" para iniciar os 9 agentes.
                  </p>
                </div>
              )}
            </div>

            {/* Barra de Progresso e Etapa */}
            {isRunning || project ? (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5 text-primary">
                    {currentStep === "concluido" ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : currentStep === "falhou" ? (
                      <AlertCircle className="size-4 text-destructive" />
                    ) : (
                      <Clock className="size-4 animate-spin text-primary" />
                    )}
                    {ETAPAS_LABELS[currentStep] || currentStep}
                  </span>
                  <span className="font-bold text-muted-foreground">{progress}%</span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep === "falhou"
                        ? "bg-destructive"
                        : currentStep === "concluido"
                          ? "bg-emerald-500"
                          : "bg-primary"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {/* Ações de Download / Retry */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              {project?.status === "failed" && (
                <button
                  type="button"
                  onClick={handleStartGeneration}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-all"
                >
                  <RotateCcw className="size-3.5" /> Tentar Novamente
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={!project?.videoUrl || project.status !== "completed"}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="size-4" /> Baixar Vídeo (.webm)
              </button>
            </div>
          </div>

          {/* Cenas do Storyboard (Miniaturas) */}
          {project?.scenes && project.scenes.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Layers className="size-3.5 text-primary" /> Cenas do Storyboard (
                {project.scenes.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {project.scenes.map((scene) => (
                  <div
                    key={scene.id || scene.index}
                    className="rounded-lg border border-border bg-background/80 p-2.5 space-y-2 text-xs"
                  >
                    <div className="relative aspect-video rounded overflow-hidden bg-black/40 border border-border/40">
                      {scene.imageUrl ? (
                        <img
                          src={scene.imageUrl}
                          alt={`Cena ${scene.index}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-[10px] text-muted-foreground">
                          Gerando...
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                        {scene.durationSeconds}s
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-foreground">Cena {scene.index}: </span>
                      <span className="text-muted-foreground line-clamp-2">{scene.narration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console de Logs de Execução */}
          {project?.logs && project.logs.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-black/80 p-3 shadow-inner space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-muted-foreground border-b border-zinc-800 pb-1.5">
                <Terminal className="size-3.5 text-primary" /> Logs de Execução dos Agentes
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-zinc-300">
                {project.logs.map((log, i) => (
                  <div key={i} className="leading-tight">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
