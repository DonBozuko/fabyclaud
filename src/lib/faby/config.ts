export const MODELS = {
  google: "gemini-2.0-flash",
  groq: "qwen/qwen-2.5-coder-32b",
  openrouter: "qwen/qwen-2.5-coder-32b-instruct:free",
  huggingface: "Qwen/Qwen2.5-Coder-32B-Instruct",
  deepseek: "deepseek-chat",
  zai: "glm-4-flash",
  omniroute: "auto/coding",
  antigravity: "gemini-2.0-flash",
} satisfies Record<string, string>;

/**
 * Modelos alternativos por provedor. Se o principal sair do ar (modelo aposentado,
 * indisponível, sem permissão pra chave), o sistema tenta o próximo automaticamente
 * sem perder qualidade — todos são modelos fortes pra programar.
 */
export const MODELOS_ALTERNATIVOS: Record<string, string[]> = {
  antigravity: [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
  ],
  google: [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gemini-flash-latest",
  ],
  groq: [
    "qwen/qwen-2.5-coder-32b",
    "llama-3.3-70b-versatile",
    "deepseek-r1-distill-llama-70b",
    "openai/gpt-oss-120b",
    "llama-3.1-8b-instant",
  ],
  openrouter: [
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "deepseek/deepseek-r1:free",
    "deepseek/deepseek-chat:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-24b-instruct-2501:free",
  ],
  huggingface: [
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "deepseek-ai/DeepSeek-V3",
    "deepseek-ai/DeepSeek-R1",
    "meta-llama/Llama-3.3-70B-Instruct",
  ],
  /** API oficial da DeepSeek: deepseek-chat = V3.1 direto; deepseek-reasoner = modo pensante. */
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  zai: ["glm-4-flash", "glm-4.5-flash", "glm-4-plus", "glm-4-air"],
  /** O OmniRoute oficial escolhe somente entre os provedores conectados pelo usuário. */
  omniroute: ["auto/coding", "auto/smart", "auto/fast"],
};

export type EtapaOrquestracao =
  | "diagnostico"
  | "planejamento"
  | "arquitetura"
  | "construcao"
  | "revisao"
  | "teste"
  | "correcao"
  | "entrega"
  | "conversa";

export interface PreferenciaModeloEtapa {
  provedor: string;
  modelo: string;
  nomeLegivel: string;
}

export interface ContratoEntrega {
  nomeProduto: string;
  publico: string;
  objetivo: string;
  telas: string[];
  entidades: string[];
  acoes: string[];
  integracoes: string[];
  criteriosAceite: string[];
  limitacoesAmbiente: string[];
  recursosExternos: string[];
}

/**
 * Especialização de modelos por etapa (o batalhão de IAs trabalhando nas suas forças):
 * - Diagnóstico / Planejamento / Arquitetura: modelos de raciocínio profundo.
 * - Construção / Correção: modelos especializados em geração de código.
 * - Revisão / Teste / Entrega: modelos críticos e minuciosos.
 * - Conversa: modelos rápidos e leves.
 */
export const MODELOS_POR_ETAPA: Record<EtapaOrquestracao, PreferenciaModeloEtapa[]> = {
  diagnostico: [
    { provedor: "google", modelo: "gemini-2.5-flash", nomeLegivel: "Gemini 2.5 Flash" },
    { provedor: "groq", modelo: "llama-3.3-70b-versatile", nomeLegivel: "Llama 3.3 70B (Groq)" },
    {
      provedor: "openrouter",
      modelo: "deepseek/deepseek-chat:free",
      nomeLegivel: "DeepSeek V3 (OpenRouter)",
    },
  ],
  planejamento: [
    { provedor: "google", modelo: "gemini-2.5-flash", nomeLegivel: "Gemini 2.5 Flash" },
    {
      provedor: "openrouter",
      modelo: "deepseek/deepseek-r1:free",
      nomeLegivel: "DeepSeek R1 (OpenRouter)",
    },
    { provedor: "deepseek", modelo: "deepseek-reasoner", nomeLegivel: "DeepSeek Reasoner" },
    { provedor: "google", modelo: "gemini-2.5-pro", nomeLegivel: "Gemini 2.5 Pro" },
    {
      provedor: "groq",
      modelo: "deepseek-r1-distill-llama-70b",
      nomeLegivel: "DeepSeek R1 70B (Groq)",
    },
    { provedor: "groq", modelo: "llama-3.3-70b-versatile", nomeLegivel: "Llama 3.3 70B (Groq)" },
    { provedor: "huggingface", modelo: "deepseek-ai/DeepSeek-R1", nomeLegivel: "DeepSeek R1 (HF)" },
  ],
  arquitetura: [
    { provedor: "google", modelo: "gemini-2.5-flash", nomeLegivel: "Gemini 2.5 Flash" },
    {
      provedor: "openrouter",
      modelo: "deepseek/deepseek-r1:free",
      nomeLegivel: "DeepSeek R1 (OpenRouter)",
    },
    {
      provedor: "groq",
      modelo: "deepseek-r1-distill-llama-70b",
      nomeLegivel: "DeepSeek R1 70B (Groq)",
    },
    { provedor: "google", modelo: "gemini-2.5-pro", nomeLegivel: "Gemini 2.5 Pro" },
  ],
  construcao: [
    { provedor: "google", modelo: "gemini-2.5-flash", nomeLegivel: "Gemini 2.5 Flash" },
    {
      provedor: "groq",
      modelo: "qwen/qwen-2.5-coder-32b",
      nomeLegivel: "Qwen 2.5 Coder 32B (Groq)",
    },
    {
      provedor: "openrouter",
      modelo: "qwen/qwen-2.5-coder-32b-instruct:free",
      nomeLegivel: "Qwen 2.5 Coder 32B (OpenRouter)",
    },
    {
      provedor: "openrouter",
      modelo: "deepseek/deepseek-chat:free",
      nomeLegivel: "DeepSeek V3 (OpenRouter)",
    },
    {
      provedor: "huggingface",
      modelo: "Qwen/Qwen2.5-Coder-32B-Instruct",
      nomeLegivel: "Qwen 2.5 Coder (HF)",
    },
    { provedor: "google", modelo: "gemini-2.0-flash", nomeLegivel: "Gemini 2.0 Flash" },
    { provedor: "google", modelo: "gemini-2.5-pro", nomeLegivel: "Gemini 2.5 Pro" },
    { provedor: "deepseek", modelo: "deepseek-chat", nomeLegivel: "DeepSeek V3" },
    { provedor: "groq", modelo: "llama-3.3-70b-versatile", nomeLegivel: "Llama 3.3 70B (Groq)" },
  ],
  revisao: [
    { provedor: "google", modelo: "gemini-2.5-flash", nomeLegivel: "Gemini 2.5 Flash" },
    {
      provedor: "openrouter",
      modelo: "deepseek/deepseek-r1:free",
      nomeLegivel: "DeepSeek R1 (OpenRouter)",
    },
    { provedor: "groq", modelo: "openai/gpt-oss-120b", nomeLegivel: "GPT-OSS 120B (Groq)" },
    { provedor: "groq", modelo: "llama-3.3-70b-versatile", nomeLegivel: "Llama 3.3 70B (Groq)" },
    { provedor: "google", modelo: "gemini-2.5-pro", nomeLegivel: "Gemini 2.5 Pro" },
    { provedor: "deepseek", modelo: "deepseek-reasoner", nomeLegivel: "DeepSeek Reasoner" },
    { provedor: "huggingface", modelo: "deepseek-ai/DeepSeek-V3", nomeLegivel: "DeepSeek V3 (HF)" },
  ],
  teste: [
    { provedor: "google", modelo: "gemini-2.5-flash", nomeLegivel: "Gemini 2.5 Flash" },
    {
      provedor: "groq",
      modelo: "qwen/qwen-2.5-coder-32b",
      nomeLegivel: "Qwen 2.5 Coder 32B (Groq)",
    },
  ],
  correcao: [
    { provedor: "google", modelo: "gemini-2.5-flash", nomeLegivel: "Gemini 2.5 Flash" },
    {
      provedor: "groq",
      modelo: "qwen/qwen-2.5-coder-32b",
      nomeLegivel: "Qwen 2.5 Coder 32B (Groq)",
    },
  ],
  entrega: [{ provedor: "google", modelo: "gemini-2.5-flash", nomeLegivel: "Gemini 2.5 Flash" }],
  conversa: [
    { provedor: "google", modelo: "gemini-2.5-flash", nomeLegivel: "Gemini 2.5 Flash" },
    { provedor: "groq", modelo: "llama-3.1-8b-instant", nomeLegivel: "Llama 3.1 8B Instant" },
    { provedor: "zai", modelo: "glm-4-flash", nomeLegivel: "GLM-4 Flash" },
    { provedor: "google", modelo: "gemini-2.0-flash", nomeLegivel: "Gemini 2.0 Flash" },
    {
      provedor: "openrouter",
      modelo: "meta-llama/llama-3.3-70b-instruct:free",
      nomeLegivel: "Llama 3.3 (OpenRouter)",
    },
  ],
};

/** Seleciona a melhor IA configurada para uma etapa específica de engenharia. */
export function selecionarMelhorModeloEtapa(
  etapa: EtapaOrquestracao,
  candidatos: {
    pid: string;
    key: string;
    apiUrl?: string | undefined;
    testada?: boolean | undefined;
  }[],
  excluirProvedor?: string,
): {
  pid: string;
  key: string;
  apiUrl?: string | undefined;
  modeloDesejado?: string | undefined;
  rotuloLegivel: string;
  ehFallbackFraco: boolean;
} | null {
  if (!candidatos.length) return null;
  const preferencias = MODELOS_POR_ETAPA[etapa] ?? [];

  // 1. Tenta a lista de modelos preferidos para esta etapa
  for (const pref of preferencias) {
    if (excluirProvedor && pref.provedor === excluirProvedor) continue;
    const c = candidatos.find((cand) => cand.pid === pref.provedor);
    if (c && c.key) {
      return {
        pid: c.pid,
        key: c.key,
        apiUrl: c.apiUrl,
        modeloDesejado: pref.modelo,
        rotuloLegivel: pref.nomeLegivel,
        ehFallbackFraco: false,
      };
    }
  }

  // 2. Fallback resiliente: pega o melhor candidato disponível (diferente do excluído se possível)
  const disponiveis = candidatos.filter((c) => !excluirProvedor || c.pid !== excluirProvedor);
  const escolhido = disponiveis[0] ?? candidatos[0];
  if (!escolhido) return null;

  const ehFraco =
    escolhido.pid === "zai" ||
    (escolhido.pid === "google" &&
      etapa === "construcao" &&
      !candidatos.some((c) => c.pid === "groq" || c.pid === "openrouter"));

  return {
    pid: escolhido.pid,
    key: escolhido.key,
    apiUrl: escolhido.apiUrl,
    rotuloLegivel: PROVIDER_LABELS[escolhido.pid] ?? escolhido.pid,
    ehFallbackFraco: ehFraco,
  };
}

/** Erros que significam "esse modelo não serve" (dá pra tentar outro modelo). */
export function ehErroDeModelo(status: number, texto: string) {
  const t = (texto || "").toLowerCase();
  // Erros de autenticação/chave NÃO devem tentar outros modelos
  if (
    t.includes("api key not valid") ||
    t.includes("api_key_invalid") ||
    t.includes("invalid api key") ||
    t.includes("invalid_api_key") ||
    t.includes("key not found") ||
    t.includes("unauthenticated") ||
    t.includes("chave inválida") ||
    t.includes("permission_denied")
  ) {
    return false;
  }
  if (status === 410 || status === 404) return true;
  if (
    status === 429 &&
    (t.includes("limit: 0") || t.includes("limit:0") || t.includes("quota exceeded for metric"))
  ) {
    return true;
  }
  if (status === 400 || status === 403 || status === 422 || status === 429) {
    return (
      t.includes("model") ||
      t.includes("not found") ||
      t.includes("does not exist") ||
      t.includes("no longer") ||
      t.includes("end of life") ||
      t.includes("decommission") ||
      t.includes("unsupported") ||
      t.includes("not available") ||
      t.includes("deprecated") ||
      t.includes("retired") ||
      t.includes("update your code") ||
      t.includes("limit: 0")
    );
  }
  return false;
}

export const PROVIDER_LABELS: Record<string, string> = {
  antigravity: "Google Antigravity Agent (Sandbox + Loop Autônomo)",
  groq: "Groq (Qwen 2.5 Coder 32B / Llama 70B)",
  openrouter: "OpenRouter (Qwen Coder / DeepSeek R1 grátis)",
  google: "Gemini 2.5 Flash / Pro",
  deepseek: "DeepSeek oficial (V3 / R1 — exige saldo)",
  huggingface: "Hugging Face (Qwen Coder / DeepSeek V3)",
  zai: "Z.AI (GLM-4 Flash)",
  omniroute: "OmniRoute local (IAs grátis)",
};

export const PROVIDER_LINKS: Record<string, string> = {
  antigravity: "https://aistudio.google.com/apikey",
  groq: "https://console.groq.com/keys",
  openrouter: "https://openrouter.ai/keys",
  google: "https://aistudio.google.com/apikey",
  huggingface: "https://huggingface.co/settings/tokens",
  deepseek: "https://platform.deepseek.com/api_keys",
  zai: "https://z.ai/manage-apikey/apikey-list",
};

/** Ordem de preferência para programar (a primeira com chave vira juíza do duelo). */
export const ORDEM_QUALIDADE = [
  "antigravity",
  "groq",
  "openrouter",
  "google",
  "deepseek",
  "huggingface",
  "zai",
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

export const MODELO_PADRAO = "groq";

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
