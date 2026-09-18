export const MODELS = {
  google: "gemini-2.0-flash",
  groq: "openai/gpt-oss-120b",
  openrouter: "deepseek/deepseek-chat-v3.1:free",
  huggingface: "deepseek-ai/DeepSeek-V3.1",
  deepseek: "deepseek-chat",
  zai: "glm-4.5-flash",
  omniroute: "auto/coding",
} satisfies Record<string, string>;

/**
 * Modelos alternativos por provedor. Se o principal sair do ar (modelo aposentado,
 * indisponível, sem permissão pra chave), o sistema tenta o próximo automaticamente
 * sem perder qualidade — todos são modelos fortes pra programar.
 */
export const MODELOS_ALTERNATIVOS: Record<string, string[]> = {
  google: [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite",
  ],
  groq: ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "qwen/qwen3-32b"],
  openrouter: [
    "deepseek/deepseek-chat-v3.1:free",
    "qwen/qwen3-coder:free",
    "z-ai/glm-4.5-air:free",
    "meta-llama/llama-3.3-70b-instruct:free",
  ],
  huggingface: [
    "deepseek-ai/DeepSeek-V3.1",
    "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "meta-llama/Llama-3.3-70B-Instruct",
  ],
  /** API oficial da DeepSeek: deepseek-chat = V3.1 direto; deepseek-reasoner = modo pensante. */
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  zai: ["glm-4.5-flash", "glm-4.6", "glm-4.5-air"],
  /** O OmniRoute oficial escolhe somente entre os provedores conectados pelo usuário. */
  omniroute: ["auto/coding", "auto/smart", "auto/fast"],
};

/** Erros que significam "esse modelo não serve" (dá pra tentar outro modelo). */
export function ehErroDeModelo(status: number, texto: string) {
  const t = (texto || "").toLowerCase();
  if (status === 410 || status === 404) return true;
  if (status === 400 || status === 403 || status === 422) {
    return (
      t.includes("model") &&
      (t.includes("not found") ||
        t.includes("does not exist") ||
        t.includes("no longer") ||
        t.includes("end of life") ||
        t.includes("decommission") ||
        t.includes("unsupported") ||
        t.includes("invalid") ||
        t.includes("not available") ||
        t.includes("access"))
    );
  }
  return false;
}

export const PROVIDER_LABELS: Record<string, string> = {
  google: "Gemini Flash-Lite",
  groq: "Groq (GPT-OSS 120B)",
  openrouter: "OpenRouter (grátis)",
  huggingface: "Hugging Face (DeepSeek V3.1 grátis)",
  deepseek: "DeepSeek oficial (V3.1 — exige saldo)",
  zai: "Z.AI (GLM-4.5 Flash)",
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
  "omniroute",
  "groq",
  "deepseek",
  "zai",
  "huggingface",
  "google",
  "openrouter",
] as const;

export const LIMITE_CHARS_ARQUIVO = 20000;
export const TAMANHO_MAX_MB = 8;

export const EXTENSOES_IMAGEM = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
export const EXTENSOES_TEXTO = [
  ".txt",
  ".md",
  ".csv",
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".rb",
  ".php",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".cs",
  ".c",
  ".h",
  ".cpp",
  ".swift",
  ".yml",
  ".yaml",
  ".toml",
  ".ini",
  ".cfg",
  ".env",
  ".xml",
  ".sh",
  ".sql",
  ".vue",
  ".svelte",
  ".log",
];

export type Anexo =
  | { tipo: "imagem"; nome: string; mime: string; data: string; preview: string }
  | { tipo: "texto"; nome: string; texto: string; cortado: boolean };

export type Mensagem = {
  id: string;
  role: "user" | "assistant";
  conteudo: string;
  modelo: string | null;
  ok: boolean;
  anexos: Anexo[];
  created_at: string;
};

export type Projeto = {
  id: string;
  nome: string;
  modelo: string;
  arquivos: Record<string, string>;
  updated_at: string;
};

export type ProvedorCustom = {
  id: string;
  slug: string;
  nome: string;
  url: string;
  modelo: string;
  suporta_imagem: boolean;
};

export type Agente = { id: string; nome: string; instrucoes: string; pronto?: boolean };
export type PromptSalvo = { id: string; titulo: string; texto: string; pronto?: boolean };

/** Especialistas prontos: mudam o jeito da IA trabalhar, sem o usuário escrever nada. */
export const AGENTES_PRONTOS: Agente[] = [
  {
    id: "pronto:produto",
    nome: "Arquiteto de SaaS",
    pronto: true,
    instrucoes:
      "Atue como arquiteto de produto sênior. Presuma que a pessoa não programa: entenda público, problema, telas, dados, segurança e fluxo, escolha uma primeira versão coerente e execute sem interrogatório. Use o banco hospedado disponível quando houver dados reais; não crie servidor separado que a prévia não possa executar. Diga claramente o que foi comprovado, o que ficou pendente e o que está bloqueado.",
  },
  {
    id: "pronto:design",
    nome: "Designer de interface",
    pronto: true,
    instrucoes:
      "Atue como designer de produto sênior. Priorize hierarquia tipográfica, espaçamento consistente (escala de 4px), paleta com no máximo 3 cores + neutros, cantos e sombras coerentes, estados de hover/foco/erro, e responsividade real (mobile primeiro). Nada de aparência genérica de template.",
  },
  {
    id: "pronto:revisor",
    nome: "Revisor de código",
    pronto: true,
    instrucoes:
      "Atue como revisor técnico exigente. Antes de entregar, verifique: todo botão faz algo, nenhum link quebrado, formulários com validação e mensagem de erro, nenhuma função chamada que não existe e acessibilidade. Nunca apenas afirme que corrigiu: devolva o conteúdo inteiro de cada arquivo realmente alterado dentro de tags <arquivo>. Se não conseguir entregar os arquivos, diga claramente que não alterou o projeto.",
  },
  {
    id: "pronto:landing",
    nome: "Copy de vendas",
    pronto: true,
    instrucoes:
      "Atue como copywriter de conversão. Escreva títulos claros com benefício, subtítulo de apoio, prova social, seção de preços com 3 planos, perguntas frequentes e chamada para ação repetida. Texto direto, em português do Brasil, sem clichês de marketing.",
  },
  {
    id: "pronto:backend",
    nome: "Engenheiro de backend",
    pronto: true,
    instrucoes:
      "Atue como engenheiro de dados sênior. Use o banco real já hospedado e conecte a interface com fetch para listar, criar, editar e apagar. Valide entradas, trate erros e nunca use localStorage como banco. Só gere arquivos de servidor próprio quando a pessoa pedir explicitamente um pacote para executar fora do FabyClaud; nesse caso, deixe claro que esses arquivos estão preparados, não executados na prévia.",
  },
  {
    id: "pronto:seguranca",
    nome: "Segurança e autenticação",
    pronto: true,
    instrucoes:
      "Atue como especialista em segurança de aplicações. Login real com senha usando hash (bcrypt), sessão por token JWT com expiração, middleware protegendo as rotas privadas, dono do dado verificado no servidor, nada de senha em texto puro nem segredo dentro do frontend. Escape toda saída em HTML para evitar XSS, use consultas parametrizadas contra injeção de SQL, limite tentativas de login e explique no final quais riscos foram tratados.",
  },
  {
    id: "pronto:qa",
    nome: "Testes e qualidade",
    pronto: true,
    instrucoes:
      "Atue como engenheiro de qualidade. Entregue, junto do sistema, um roteiro de teste manual numerado com resultado esperado de cada passo e um arquivo de testes automatizados simples (node --test ou script de verificação) cobrindo as regras principais. Aponte os casos de borda: lista vazia, campo inválido, texto muito longo, duplicidade, sem internet e recarregar a página no meio do fluxo.",
  },
  {
    id: "pronto:seo",
    nome: "SEO e performance",
    pronto: true,
    instrucoes:
      "Atue como especialista em SEO técnico e performance. Cada página com title único abaixo de 60 caracteres, meta description abaixo de 160, um único H1, HTML semântico, alt em todas as imagens, Open Graph e Twitter card, JSON-LD quando fizer sentido, canonical, viewport responsivo, imagens com loading lazy, CSS enxuto e nenhum script bloqueando a renderização. Gere também robots.txt e sitemap.xml.",
  },
  {
    id: "pronto:monetizar",
    nome: "Monetização e planos",
    pronto: true,
    instrucoes:
      "Atue como especialista em produto pago. Modele planos (grátis, pro, time) com limites aplicados no código, tela de upgrade, controle de uso por usuário, período de teste e bloqueio educado quando o limite estourar. Deixe o ponto de integração de pagamento isolado num módulo, com comentário claro de onde entra a chave do provedor, sem inventar credenciais.",
  },
  {
    id: "pronto:refatorar",
    nome: "Refatorador de legado",
    pronto: true,
    instrucoes:
      "Atue como engenheiro de manutenção. Antes de mexer, liste os arquivos e o que cada um faz. Depois refatore em passos pequenos, preservando todo o comportamento existente: separe responsabilidades, remova código morto e duplicado, dê nomes claros, extraia constantes e centralize acesso a dados. Nunca mude visual nem regra de negócio sem pedido explícito e diga exatamente o que mudou em cada arquivo.",
  },
];

/**
 * Memória recomendada: o texto que a pessoa cola na aba Memória para o sistema
 * entregar no padrão profissional em toda conversa, sem repetir instrução.
 */
export const MEMORIA_SUGERIDA = `Contexto: posso não saber programar. Fale sempre em português do Brasil, usando o nome das telas, botões e resultados que eu consigo testar.

Padrão de entrega em toda resposta de código:
- Plano curto em bullets antes do código.
- Projeto completo e navegável, nunca exemplo pela metade: várias telas, busca, filtro, criar/editar/apagar, detalhe, configurações e estado vazio bem escrito.
- Arquivos separados e ligados de verdade (index.html carregando o CSS e o JS entregues).
- Visual profissional: modo escuro, tipografia moderna, escala de espaçamento consistente, até 3 cores + neutros, ícones SVG em linha, nunca emoji na interface.
- Responsivo de celular primeiro, foco visível, label em todo campo, alt em toda imagem.
- Todo botão funciona, formulário valida e mostra erro e sucesso, nada de "em breve" nem link morto.

Quando o pedido envolver backend, banco de dados, API, login real ou usuários:
- Usar o banco hospedado disponível e ligar o frontend a ele na mesma resposta.
- Validar entrada, proteger dados por usuário e mostrar erros de forma clara.
- localStorage só como cópia offline, e nunca chamado de banco de dados.

Nunca fazer:
- Perguntar se deve atualizar o frontend depois: já entregar.
- Inventar dados reais (preço, telefone, horário) sem avisar que é exemplo.
- Colocar chave de API dentro do frontend.
- Deixar credencial, segredo ou nome de outra plataforma no código entregue.

Sempre terminar com: o que está funcionando e testável, o que ainda falta e o próximo passo prioritário.`;

/** O prompt mestre: é o que eu pediria se eu fosse o usuário da versão grátis. */
export const PROMPT_MESTRE_SAAS = `Crie um SaaS completo e profissional chamado [NOME], para [PÚBLICO], que resolve [PROBLEMA].

Entregue como sistema de verdade, não como página de exemplo:
1. Telas: login/cadastro, painel com indicadores, lista de registros com busca e filtro, formulário de criar/editar, tela de detalhe e página de configurações.
2. Navegação real entre as telas (uma única página com troca de views, sem recarregar).
3. Para protótipo local, dados salvos no navegador com aviso claro. Se eu pedir backend, banco, API, usuários ou login real, entregue também backend completo com SQL e conecte o frontend por fetch na mesma resposta.
4. Visual profissional: modo escuro, tipografia moderna, espaçamento consistente, ícones SVG em linha (nunca emoji), responsivo no celular.
5. Qualidade: todo botão funciona, formulários validam, mensagens de erro e sucesso visíveis, nada quebrado no console.

Antes do código, mostre um plano curto. Depois entregue os arquivos completos em tags <arquivo> (index.html, style.css, app.js e o que mais precisar). Nunca diga que algo foi alterado sem entregar o arquivo correspondente.`;

/** O prompt mais forte do sistema: SaaS full-stack com banco de dados real. */
export const PROMPT_MESTRE_FULLSTACK = `Crie o SaaS [NOME] para [PÚBLICO], que resolve [PROBLEMA], completo de ponta a ponta e pronto pra eu rodar e vender. Entregue tudo nesta mesma resposta, sem parcelar e sem pedir permissão.

1. Plano em bullets: público, entidades de dados, telas e fluxo principal.
2. Banco de dados real em backend/database.sql: CREATE TABLE de cada entidade, chave primária, chave estrangeira, índices e a tabela de usuários.
3. backend/db.js: conexão real (pg quando DATABASE_URL existir, senão better-sqlite3 gravando database.sqlite no disco do servidor).
4. backend/server.js: Express com CORS, rotas REST completas (listar com busca/filtro/paginação, ver, criar, editar, apagar) por entidade, SQL parametrizado, validação de entrada, status HTTP correto e mensagens de erro em JSON.
5. Autenticação real: cadastro e login com senha em hash (bcrypt), token JWT com expiração, middleware protegendo as rotas privadas e cada usuário vendo somente os dados dele.
6. backend/package.json (express, cors, better-sqlite3, pg, bcryptjs, jsonwebtoken, script start) e backend/.env.example (PORT, DATABASE_URL, JWT_SECRET).
7. Frontend numa única página com troca de views: login/cadastro, painel com indicadores, lista com busca e filtro, formulário de criar/editar, detalhe, configurações e estado vazio bem escrito. Chama a API com fetch (const API = localStorage.getItem('api_url') || 'http://localhost:3000') enviando o token no header, com localStorage apenas como cópia offline.
8. Visual profissional: modo escuro, tipografia moderna, escala de espaçamento consistente, até 3 cores + neutros, ícones SVG em linha, responsivo de celular primeiro, foco visível, label em todo campo.
9. README.md com: como rodar o backend (cd backend && npm install && npm start), como configurar o .env, como publicar e roteiro de teste numerado com resultado esperado.

No final: liste o que você conferiu, o que testar agora e os 2 próximos passos.`;

/** Prompts prontos para começar rápido. */
export const PROMPTS_PRO: PromptSalvo[] = [
  {
    id: "pronto:fullstack",
    titulo: "SaaS full-stack com banco real (o mais forte)",
    texto: PROMPT_MESTRE_FULLSTACK,
    pronto: true,
  },
  {
    id: "pronto:mestre",
    titulo: "SaaS completo (prompt mestre)",
    texto: PROMPT_MESTRE_SAAS,
    pronto: true,
  },
  {
    id: "pronto:api",
    titulo: "API REST documentada",
    pronto: true,
    texto:
      "Crie uma API REST em Node.js + Express para [DOMÍNIO]: backend/server.js com rotas de listar (busca, filtro, paginação), ver, criar, editar e apagar; backend/db.js com conexão real; backend/database.sql com tabelas, chaves e índices; validação de entrada, SQL parametrizado, status HTTP correto e erros em JSON. Inclua autenticação por token JWT, limite de requisições, um arquivo openapi.yaml documentando cada rota e um index.html simples que consome a API pra eu testar tudo no navegador.",
  },
  {
    id: "pronto:auth",
    titulo: "Login real com usuários",
    pronto: true,
    texto:
      "Adicione autenticação real ao projeto atual: tabela de usuários no SQL, cadastro e login com senha em hash bcrypt, token JWT com expiração e renovação, middleware protegendo as rotas privadas, cada usuário vendo apenas os próprios dados, telas de entrar, criar conta, recuperar senha e sair, e o frontend guardando o token e tratando expiração. Preserve tudo que já funciona e diga no final o que mudou em cada arquivo.",
  },
  {
    id: "pronto:admin",
    titulo: "Painel administrativo",
    pronto: true,
    texto:
      "Crie um painel administrativo para o sistema atual: login de administrador separado, indicadores do negócio (total de usuários, registros criados por dia, ativos na semana), tabela de usuários com busca, filtro e ordenação, ações de bloquear/liberar e mudar papel, auditoria das ações num log gravado no banco, e exportar CSV. Papel do usuário verificado no servidor, nunca no navegador.",
  },
  {
    id: "pronto:publicar",
    titulo: "Preparar para publicar e vender",
    pronto: true,
    texto:
      "Prepare o projeto atual para publicação profissional: title e meta description em cada página, Open Graph e Twitter card, um único H1, HTML semântico, alt em todas as imagens, JSON-LD, canonical, robots.txt, sitemap.xml, favicon SVG, manifest e service worker para funcionar offline (PWA), imagens com loading lazy e README.md explicando como rodar, configurar e publicar. Nada de texto de rascunho.",
  },
  {
    id: "pronto:crm",
    titulo: "CRM de clientes",
    pronto: true,
    texto:
      "Crie um CRM profissional full-stack: painel com total de clientes, negócios em aberto e receita prevista; lista com busca, filtro e ordenação; cadastro validado; detalhe com histórico; backend real, SQL, rotas REST e frontend integrado por fetch. Entregue todos os arquivos completos nesta resposta, com visual escuro, responsivo e ícones SVG.",
  },
  {
    id: "pronto:agenda",
    titulo: "Sistema de agendamentos",
    pronto: true,
    texto:
      "Crie um sistema de agendamentos full-stack: calendário, horários disponíveis, formulário validado, lista do dia, cancelar/reagendar e resumo semanal. Entregue backend real, SQL, rotas REST e frontend integrado por fetch, com todos os arquivos completos nesta resposta. Visual moderno, responsivo e ícones SVG.",
  },
  {
    id: "pronto:financeiro",
    titulo: "Controle financeiro",
    pronto: true,
    texto:
      "Crie um controle financeiro full-stack: entradas e saídas por categoria, saldo mensal, gráfico em SVG, filtros, meta e exportação CSV. Entregue backend real, SQL, rotas REST e frontend integrado por fetch, com todos os arquivos completos nesta resposta. Visual profissional e responsivo.",
  },
  {
    id: "pronto:landing",
    titulo: "Landing page que converte",
    pronto: true,
    texto:
      "Crie uma landing page de alta conversão para [PRODUTO]: topo com título de benefício e chamada para ação, seção de problema/solução, 3 blocos de benefícios com ícones SVG, depoimentos, tabela de 3 planos, perguntas frequentes em accordion e rodapé. Imagens realistas, tipografia moderna, responsivo, animações suaves ao rolar.",
  },
  {
    id: "pronto:auditoria",
    titulo: "Revisar e melhorar o projeto atual",
    pronto: true,
    texto:
      "Revise o projeto atual como um revisor técnico exigente: liste o que está quebrado ou inacabado, depois corrija tudo mantendo o que já funciona. Verifique botões sem ação, formulários sem validação, responsividade no celular, acessibilidade e persistência dos dados. No final, diga o que mudou.",
  },
];
