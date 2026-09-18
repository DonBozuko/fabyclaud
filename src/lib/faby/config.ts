export const MODELS = {
  google: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
  openrouter: "deepseek/deepseek-chat:free",
  huggingface: "deepseek-ai/DeepSeek-V3",
  deepseek: "deepseek-chat",
  zai: "glm-4-flash",
  omniroute: "auto/coding",
} satisfies Record<string, string>;

/**
 * Modelos alternativos por provedor. Se o principal sair do ar (modelo aposentado,
 * indisponível, sem permissão pra chave), o sistema tenta o próximo automaticamente
 * sem perder qualidade — todos são modelos fortes pra programar.
 */
export const MODELOS_ALTERNATIVOS: Record<string, string[]> = {
  google: [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "deepseek-r1-distill-llama-70b",
    "qwen/qwen-2.5-coder-32b",
    "openai/gpt-oss-120b",
  ],
  openrouter: [
    "deepseek/deepseek-chat:free",
    "deepseek/deepseek-r1:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "mistralai/mistral-small-24b-instruct-2501:free",
    "deepseek/deepseek-chat-v3.1:free",
  ],
  huggingface: [
    "deepseek-ai/DeepSeek-V3",
    "deepseek-ai/DeepSeek-R1",
    "deepseek-ai/DeepSeek-V3.1",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "meta-llama/Llama-3.3-70B-Instruct",
  ],
  /** API oficial da DeepSeek: deepseek-chat = V3.1 direto; deepseek-reasoner = modo pensante. */
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  zai: ["glm-4-flash", "glm-4.5-flash", "glm-4-plus", "glm-4-air"],
  /** O OmniRoute oficial escolhe somente entre os provedores conectados pelo usuário. */
  omniroute: ["auto/coding", "auto/smart", "auto/fast"],
};

/** Erros que significam "esse modelo não serve" (dá pra tentar outro modelo). */
export function ehErroDeModelo(status: number, texto: string) {
  const t = (texto || "").toLowerCase();
  if (status === 410 || status === 404) return true;
  if (status === 400 || status === 403 || status === 422 || status === 401) {
    return (
      t.includes("model") ||
      t.includes("not found") ||
      t.includes("does not exist") ||
      t.includes("no longer") ||
      t.includes("end of life") ||
      t.includes("decommission") ||
      t.includes("unsupported") ||
      t.includes("invalid") ||
      t.includes("not available") ||
      t.includes("access") ||
      t.includes("deprecated") ||
      t.includes("retired") ||
      t.includes("update your code")
    );
  }
  return false;
}

export const PROVIDER_LABELS: Record<string, string> = {
  google: "Gemini 2.5 Flash / Flash-Lite",
  groq: "Groq (Llama 3.3 70B)",
  openrouter: "OpenRouter (grátis)",
  huggingface: "Hugging Face (DeepSeek V3 grátis)",
  deepseek: "DeepSeek oficial (V3 — exige saldo)",
  zai: "Z.AI (GLM-4 Flash)",
  omniroute: "OmniRoute local (IAs grátis)",
};

export const PROVIDER_LINKS: Record<string, string> = {
  google: "https://aistudio.google.com/apikey",
  groq: "https://console.groq.com/keys",
  openrouter: "https://openrouter.ai/keys",
  huggingface: "https://huggingface.co/settings/tokens",
  deepseek: "https://platform.deepseek.com/api_keys",
  zai: "https://z.ai/manage-apikey/apikey-list",
};

/** Ordem de preferência para programar (a primeira com chave vira juíza do duelo). */
export const ORDEM_QUALIDADE = [
  "google",
  "groq",
  "openrouter",
  "deepseek",
  "zai",
  "huggingface",
  "omniroute",
] as const;

export const LIMITE_CHARS_ARQUIVO = 20000;
export const TAMANHO_MAX_MB = 8;

export const EXTENSOES_IMAGEM = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
export const EXTENSOES_TEXTO = [
  ".txt",
  ".md",
  ".json",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".html",
  ".css",
  ".py",
  ".sql",
  ".yaml",
  ".yml",
  ".toml",
  ".sh",
  ".env",
  ".svg",
  ".csv",
  ".xml",
];

export const MODELO_PADRAO = "google";

export interface Anexo {
  nome: string;
  tamanho?: number;
  tipo: "texto" | "imagem" | "binario";
  texto?: string;
  data?: string;
  mime?: string;
  preview?: string;
  cortado?: boolean;
}

export interface ProvedorCustom {
  id: string;
  slug: string;
  nome: string;
  url: string;
  modelo: string;
  suporta_imagem: boolean;
}

export interface PromptSalvo {
  id: string;
  titulo: string;
  texto: string;
  pronto?: boolean;
}

export const MEMORIA_SUGERIDA = `# Memória de Engenharia
- Entregar código modular e limpo em HTML, CSS e JavaScript moderno.
- Foco em design de alta qualidade, responsivo e com validações completas.
- Sempre manter a integridade dos arquivos e funcionalidade em tempo real na prévia.`;

export const PROMPT_MESTRE_SAAS = `Crie um SaaS completo e profissional chamado [NOME], para [PÚBLICO], que resolve [PROBLEMA].
1. Telas: login/cadastro, painel com indicadores, lista de registros com busca e filtro, formulário de criar/editar, tela de detalhe e configurações.
2. Navegação real entre as telas numa única página (SPA).
3. Visual profissional: tema escuro, tipografia moderna, ícones SVG e layout responsivo.
4. Todo botão precisa funcionar de verdade com validações completas.`;

export const PROMPT_MESTRE_FULLSTACK = `Crie o SaaS [NOME] para [PÚBLICO], que resolve [PROBLEMA], completo de ponta a ponta e pronto pra rodar.
1. Plano em bullets com entidades e fluxo principal.
2. Frontend completo com HTML, CSS e JavaScript integrado.
3. Design responsivo, moderno e totalmente funcional.`;

export const PROMPTS_PRO: PromptSalvo[] = [
  {
    id: "pronto:fullstack",
    titulo: "SaaS full-stack completo",
    texto: PROMPT_MESTRE_FULLSTACK,
    pronto: true,
  },
  {
    id: "pronto:mestre",
    titulo: "SaaS profissional (prompt mestre)",
    texto: PROMPT_MESTRE_SAAS,
    pronto: true,
  },
  {
    id: "pronto:landing",
    titulo: "Landing page de alta conversão",
    texto:
      "Crie uma landing page de alta conversão para [PRODUTO]: topo com chamada para ação, benefícios com ícones SVG, tabela de planos, depoimentos e formulário funcional.",
    pronto: true,
  },
  {
    id: "pronto:crm",
    titulo: "CRM e Gestão de Clientes",
    texto:
      "Crie um sistema CRM completo: painel de controle, gestão de clientes, funil de vendas, busca e filtros em tempo real.",
    pronto: true,
  },
  {
    id: "pronto:financeiro",
    titulo: "Controle Financeiro",
    texto:
      "Crie um painel financeiro completo com receitas, despesas, saldo, gráficos em SVG e filtros por período.",
    pronto: true,
  },
];

export const AGENTES_PRONTOS = [
  {
    id: "pronto:programador",
    nome: "Programador Full-Stack",
    instrucoes:
      "Você é um engenheiro de software sênior focado em construir aplicações web modernas, funcionais e completas.",
  },
  {
    id: "pronto:designer",
    nome: "UI/UX Designer",
    instrucoes:
      "Você é um designer de interfaces de elite focado em estética premium, micro-interações, tipografia moderna e responsividade impecável.",
  },
  {
    id: "pronto:arquiteto",
    nome: "Arquiteto de Soluções",
    instrucoes:
      "Você projeta sistemas resilientes, com separação clara de responsabilidades, APIs limpas e fluxos de dados seguros.",
  },
];
