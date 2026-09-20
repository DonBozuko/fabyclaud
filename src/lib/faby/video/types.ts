export type VideoAspectRatio = "16:9" | "9:16" | "1:1";

export type VideoStatus =
  | "draft"
  | "planning"
  | "assets"
  | "audio"
  | "rendering"
  | "validating"
  | "completed"
  | "failed"
  | "cancelled";

export type VideoStep =
  | "nao_configurado"
  | "pronto"
  | "planejando"
  | "gerando_roteiro"
  | "preparando_cenas"
  | "baixando_imagens"
  | "gerando_imagens"
  | "preparando_audio"
  | "renderizando"
  | "validando"
  | "concluido"
  | "falhou"
  | "cancelado";

export type VideoSceneTransition = "cut" | "fade" | "zoom" | "slide";

export interface VideoScene {
  id: string;
  index: number;
  durationSeconds: number;
  narration: string;
  visualPrompt: string;
  imageUrl: string | null;
  audioUrl: string | null;
  caption: string | null;
  transition: VideoSceneTransition;
  status: "pending" | "ready" | "failed";
}

export interface VideoScript {
  title: string;
  overview: string;
  targetAudience: string;
  tone: string;
  scenes: {
    index: number;
    durationSeconds: number;
    narration: string;
    visualPrompt: string;
    caption: string;
    transition: VideoSceneTransition;
  }[];
}

export interface VideoProject {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  language: string;
  aspectRatio: VideoAspectRatio;
  durationSeconds: number;
  status: VideoStatus;
  progress: number;
  currentStep: VideoStep;
  script: VideoScript | null;
  scenes: VideoScene[];
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  errorMessage: string | null;
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoRenderOptions {
  width: number;
  height: number;
  fps: number;
  includeAudio?: boolean;
}
