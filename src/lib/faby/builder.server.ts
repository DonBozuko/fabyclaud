/**
 * Geração e edição de projetos com múltiplos arquivos.
 * A IA escreve cada arquivo 100% completo dentro de <arquivo nome="..."> ou <file path="...">,
 * mantendo o Stateful VFS (árvore e arquivos) perfeitamente sincronizado a cada iteração.
 */

import { instrucaoNuvem, usaAutenticacaoPrivada, usaBancoHospedado } from "./nuvem";
import { CodeModifier } from "@/agents/CodeModifier";
import { DirectoryReader } from "@/agents/DirectoryReader";
import type { ContratoEntrega } from "./config";
import {
  instrucoesImgToHtml,
  pedidoUsaReferenciaVisual,
  preservarLayoutImgToHtml,
} from "./img-to-html.server";

const directoryReader = new DirectoryReader();

export type TipoPedidoLovable =
  | "conversa"
  | "pesquisa"
  | "criacao"
  | "edicao"
  | "correcao"
  | "imagem"
  | "importacao"
  | "publicacao";

export function ehSaudacaoOuConversaCasual(pedido: string): boolean {
  const limpo = pedido.trim().toLowerCase();
  if (!limpo) return true;

  // Saudações puras ou compostas com pontuação e nomes amigáveis
  if (
    /^(?:oi|ol[aá]|bom\s+dia|boa\s+tarde|boa\s+noite|opa|e\s+a[ií]|hello|hi|hey|eai|fala|salve|ia[eí])(?:[\s,!?.-]+(?:tudo\s+bem|tudo\s+bom|como\s+vai|beleza|tranquilo|amigo|faby|fabyclaud|dev|buddy|parceiro|mestre))?[\s,!?.-]*$/i.test(
      limpo,
    )
  ) {
    return true;
  }

  // Perguntas sobre identidade ou capacidades do assistente
  if (
    /^(?:quem\s+[eé]\s+voc[eê]|o\s+que\s+voc[eê]\s+(?:faz|pode\s+fazer|[eé]|sabe\s+fazer)|qual\s+[eé]\s+o\s+seu\s+nome|qual\s+o\s+seu\s+prop[oó]sito|como\s+voc[eê]\s+funciona|apresente-se|se\s+apresente)[^?]*\??$/i.test(
      limpo,
    )
  ) {
    return true;
  }

  // Perguntas conceituais puras (sem pedir para programar/criar)
  if (
    /^(?:o\s+que\s+[eé]|qual\s+a\s+diferen[çc]a\s+entre|me\s+explique\s+(?:o\s+que\s+[eé]|como\s+funciona)|para\s+que\s+serve\s+o|como\s+funciona\s+o|o\s+que\s+significa)[^?]*\??$/i.test(
      limpo,
    )
  ) {
    return true;
  }

  // Confirmações curtas e agradecimentos / elogios puros
  if (
    /^(?:sim|s|yes|isso|exato|exatamente|pode\s+ser|ok|beleza|blz|valeu|obrigad[oa]|show|perfeito|muito\s+bom|gostei|adorei|entendi|compreendi|legal|top|[oó]timo|maravilha|obrigad[oa]\s+pela\s+ajuda|muito\s+obrigad[oa]|parab[eé]ns)[\s!.,?-]*(?:gostei\s+do\s+resultado|ficou\s+bom|ficou\s+[oó]timo|muito\s+bom|valeu|obrigad[oa]|demais)?[\s!.,?-]*$/i.test(
      limpo,
    ) ||
    /^(?:muito\s+)?(?:obrigad[oa]|valeu|show|perfeito|muito\s+bom|parab[eé]ns)[\s\S]{0,100}$/i.test(
      limpo,
    )
  ) {
    return true;
  }

  // Se é um comando barra (ex: /goal, /antigravity, /revisar), não é apenas saudação
  if (
    limpo.startsWith("/") ||
    /^(?:\/goal|\/antigravity|\/executar|\/planejar|\/debug)\b/i.test(limpo)
  ) {
    return false;
  }

  // Se tem verbos claros de criação/edição/código/engenharia, NÃO é apenas conversa
  const temVerboAcao =
    /\b(cri(?:ar|e|a|ou|e-me)|fa(?:zer|ça|z|ço|z-me)|mud(?:ar|e|a|ou)|alter(?:ar|e|a|ou)|adicion(?:ar|e|a|ou)|coloqu(?:e|ar|a)|coloc(?:ar|a)|bot(?:ar|e|a)|remov(?:er|a|e)|tir(?:ar|e|a)|corrij(?:a|ir)|correg(?:ir)|arrum(?:ar|e|a)|consert(?:ar|e|a)|troqu(?:e|ar)|troc(?:ar|a)|ger(?:ar|e|a)|estiliz(?:ar|e|a)|redesenh(?:ar|e|a)|ajust(?:ar|e|a)|constru(?:ir|a|i)|mont(?:ar|e|a)|implement(?:ar|e|a)|recri(?:ar|e|a)|clon(?:ar|e|a)|desenh(?:ar|e|a)|desenvolv(?:er|a|e)|ponha(?:-me)?|p[oõ]e|integre?|integrar|apliqu(?:e|ar)|atualiz(?:ar|e|a|ou)|refator(?:ar|e|a|ou)|resolv(?:er|a|i)|debug(?:ar|ue)?|execut(?:ar|e|a)|audit(?:ar|e|a)|test(?:ar|e|a)|otimiz(?:ar|e|a)|conect(?:ar|e|a)|codif(?:icar|ique))\b/i.test(
      limpo,
    );

  if (temVerboAcao) {
    return false;
  }

  return false;
}

export function classificarPedidoLovable(pedido: string): TipoPedidoLovable {
  const limpo = pedido.trim();

  if (
    /\b(gerar imagem|criar imagem|desenho|desenhe|foto de|ilustra[çc][ãa]o|wallpaper|avatar|imagem de|gerar:\s*)\b/i.test(
      limpo,
    )
  ) {
    return "imagem";
  }

  if (
    /\b(pesquis[ea]|busqu[ea]\s+na\s+web|procure\s+informa[çc][õo]es|not[íi]cias?|google|web search)\b/i.test(
      limpo,
    )
  ) {
    return "pesquisa";
  }

  if (
    /\b(publiqu[ea]|publicar|publica[çc][ãa]o|deploy|colocar no ar|subir site|gerar link publico)\b/i.test(
      limpo,
    )
  ) {
    return "publicacao";
  }

  if (
    /\b(abra|abrir|carregue|carregar|importe|importar)\b[\s\S]{0,40}\b(pasta|zip|projeto|arquivo|c[oó]digo)\b/i.test(
      limpo,
    )
  ) {
    return "importacao";
  }

  if (
    /\b(corrij[ea]|arrum[ea]|consert[ea]|resolv[ea]|bug|erro|falha|uncaught|typeerror|quebrou|n[aã]o est[aá] funcionando|parou de funcionar|debug)\b/i.test(
      limpo,
    )
  ) {
    return "correcao";
  }

  if (ehSaudacaoOuConversaCasual(limpo)) {
    return "conversa";
  }

  if (
    /\b(mud[ea]|alter[ea]|troqu[ea]|adicion[ea]|coloqu[ea]|bot[ea]|remov[ea]|tir[ea]|estiliz[ea]|redesenhe|ajust[ea])\b/i.test(
      limpo,
    )
  ) {
    return "edicao";
  }

  return "criacao";
}

export function gerarContratoEntrega(
  pedido: string,
  arquivosAtuais: Record<string, string> = {},
  tipo: TipoPedidoLovable = "criacao",
): ContratoEntrega {
  const limpo = pedido.trim();
  const nomesArquivos = Object.keys(arquivosAtuais).filter(
    (n) => !n.startsWith("enviados/") && !n.startsWith("originais/"),
  );
  const temArquivos = nomesArquivos.length > 0;

  let nomeProduto = "Aplicação Web Interativa";
  const matchNome = limpo.match(
    /(?:app|clone|jogo|site|sistema|painel|dashboard|calculadora|saas)\s+(?:d[eao]\s+)?([a-zA-Z0-9À-ÿ\s-]{3,30})/i,
  );
  if (matchNome?.[1]) {
    nomeProduto = matchNome[0].trim();
  } else if (limpo.length < 40) {
    nomeProduto = limpo;
  }

  const telas = ["Tela Principal (Visão Geral / Interface Interativa)"];
  if (/login|perfil|conta|auth/i.test(limpo)) telas.push("Tela de Autenticação / Perfil");
  if (/config|ajustes|configura/i.test(limpo)) telas.push("Painel de Configurações");
  if (/detalhes?|detalhe|item/i.test(limpo)) telas.push("Visão Detalhada / Modal");

  const entidades: string[] = [];
  if (/usuario|usuário|cliente|membro/i.test(limpo)) entidades.push("Usuário / Perfil");
  if (/produto|item|tarefa|todo|post|mensagem|registro/i.test(limpo))
    entidades.push("Registros / Itens Principais");
  if (/categoria|tag|grupo/i.test(limpo)) entidades.push("Categorias / Metadados");
  if (entidades.length === 0) entidades.push("Estado da Aplicação / Itens em Memória");

  const acoes = [
    "Renderizar interface rica e responsiva com micro-interações",
    "Manipulação completa de dados (criar, visualizar, editar ou filtrar)",
    "Feedback visual imediato para todas as ações do usuário",
  ];

  const criteriosAceite = [
    "Interface 100% funcional diretamente no navegador sem dependências quebradas",
    "Visual moderno, refinado, com tipografia Google Fonts, cores e animações",
    "Código modular e limpo dividido entre index.html, styles.css e app.js",
    "Preservação integral de funcionalidades e arquivos pré-existentes",
  ];

  const limitacoesAmbiente = [
    "Ambiente de execução estático/SPA no navegador (HTML5, CSS3, JavaScript ES6+)",
    "Não executar binários nativos no cliente sem WebAssembly",
  ];

  const recursosExternos: string[] = [];
  if (/banco|api|nuvem|supabase|sql/i.test(limpo)) {
    recursosExternos.push("API REST FabyCloud / %%FABY_API%% para persistência");
  }
  if (/imagem|foto|avatar/i.test(limpo)) {
    recursosExternos.push("Gerador de imagens embutido (gerar:prompt)");
  }

  return {
    nomeProduto,
    publico: "Usuários finais e desenvolvedores buscando experiência fluida estilo Lovable",
    objetivo: temArquivos
      ? `Evoluir o projeto existente atendendo a solicitação: "${limpo.slice(0, 150)}"`
      : `Construir uma solução completa do zero para: "${limpo.slice(0, 150)}"`,
    telas,
    entidades,
    acoes,
    integracoes: recursosExternos.length
      ? recursosExternos
      : ["Nenhuma integração externa obrigatória"],
    criteriosAceite,
    limitacoesAmbiente,
    recursosExternos,
  };
}

export function formatarContratoEntrega(contrato: ContratoEntrega): string {
  return [
    "--- CONTRATO DE ENTREGA DA APLICAÇÃO (ESPECIFICAÇÃO TÉCNICA) ---",
    `• Produto: ${contrato.nomeProduto}`,
    `• Público: ${contrato.publico}`,
    `• Objetivo: ${contrato.objetivo}`,
    `• Telas planejadas: ${contrato.telas.join(", ")}`,
    `• Entidades do sistema: ${contrato.entidades.join(", ")}`,
    `• Ações principais: ${contrato.acoes.join("; ")}`,
    `• Critérios de aceite: ${contrato.criteriosAceite.join("; ")}`,
    `• Limitações do ambiente: ${contrato.limitacoesAmbiente.join("; ")}`,
    `• Recursos externos / Chaves: ${contrato.recursosExternos.join(", ") || "Nenhum"}`,
  ].join("\n");
}

export function salvarBackupProjeto(arquivos: Record<string, string>): Record<string, string> {
  return { ...arquivos };
}

export function restaurarBackupProjeto(backup: Record<string, string>): Record<string, string> {
  return { ...backup };
}

export const INSTRUCAO_PROJETO = [
  "🧠 ANTIGRAVITY & DEV BUDDY — AUTONOMOUS SOFTWARE ENGINEERING AGENT (PADRÃO SÊNIOR / LOVABLE / CLAUDE CODE):",
  "Você é um agente autônomo sênior de engenharia de software fullstack, operando dentro de um projeto real com responsabilidade pelo sistema inteiro. Seu objetivo não é apenas gerar snippets, mas conduzir o ciclo completo de engenharia:",
  "FLUXO OBRIGATÓRIO EM TODA ITERAÇÃO:\n> ENTENDER → INVESTIGAR → PLANEJAR → IMPLEMENTAR → TESTAR → AUDITAR → CORRIGIR → VALIDAR",
  "PRINCÍPIO FUNDAMENTAL E REGRA ABSOLUTA DE PRESERVAÇÃO:\n1. NÃO reescreva partes funcionais do sistema sem necessidade.\n2. Se algo já funciona: PRESERVE integralmente.\n3. Se algo está quebrado: DESCUBRA A CAUSA RAIZ antes de aplicar qualquer workaround. Nunca faça try/catch vazio para mascarar erros.\n4. Se uma pequena alteração resolve: FAÇA A MENOR ALTERAÇÃO SEGURA POSSÍVEL.",
  "REGRA ROOT CAUSE FIRST & DEBUG PROFUNDO:\n- Nunca trate apenas o sintoma. Prioridade estrutural: CAUSA RAIZ ↓ DEPENDÊNCIAS ↓ CORREÇÃO ↓ TESTE ↓ VALIDAÇÃO.\n- Em diagnósticos e correções: localize arquivo, linha, fluxo de estado e dependência real.",
  "NÃO FABRIQUE FUNCIONALIDADE (PROIBIÇÃO ABSOLUTA DE PLACEHOLDERS E MOCKS FALSOS):\n- NUNCA faça botões decorativos com apenas `console.log()` ou `alert()` quando o usuário pediu uma funcionalidade real.\n- NUNCA crie APIs falsas, estados simulados de sucesso ou dados fake que escondem problemas reais.\n- Todo botão, formulário, link, modal e interação DEVE ter manipulação de estado real, interatividade reativa e feedback visual imediato.",
  'PROIBIÇÃO DE VERSÕES ESQUELÉTICAS OU "LITE" (ENTREGA COMPLETA PADRÃO LOVABLE):\n- NUNCA entregue páginas com apenas um título <h1> ou nomes simplificados como "Kwai-Lite", "Orkut-Lite" ou "App Demo".\n- Se o usuário pediu Kwai, TikTok, Orkut, E-commerce, Uber, Dashboard ou Rede Social, entregue a aplicação COMPLETA E RICA: cabeçalho, feed com múltiplos itens/cards, botões de ação reativos, navegação funcional e modais.',
  'ESTILO DE CONVERSA, COLABORAÇÃO E PLANO PÓS-CRIAÇÃO (PADRÃO LOVABLE):\n- Converse em português com entusiasmo, empatia, clareza e autoridade técnica sênior.\n- EXPLICAÇÃO DETALHADA: Descreva o que você construiu, as decisões visuais (cores, tipografia, espaçamento) e o comportamento interativo de cada componente.\n- PLANO DE PRÓXIMOS PASSOS OBRIGATÓRIO: Em TODA resposta de criação ou alteração, inclua no final a seção:\n### 💡 Próximos Passos & Sugestões de Evolução:\n1. [Opção 1 concreta de nova tela, aba ou componente]\n2. [Opção 2 de personalização visual ou funcionalidade interativa]\n3. [Opção 3 de integração de dados ou refinamento]\n- QUESTIONAMENTO ESTRATÉGICO: Finalize com uma pergunta aberta e colaborativa convidando o usuário a decidir o próximo passo (ex: "Qual dessas melhorias você prefere implementar agora, ou tem outro detalhe que queira ajustar?").',
  'DESIGN SYSTEM E PADRÃO VISUAL PREMIUM OBRIGATÓRIO (PADRÃO LOVABLE):\n- NUNCA crie páginas cruas, sem estilo, em preto e branco ou com aparência padrão de navegador. Todo projeto DEVE ser visualmente impressionante e encantar o usuário.\n- TIPOGRAFIA MODERNA: Carregue sempre fontes profissionais do Google Fonts (ex: Inter, Plus Jakarta Sans, Outfit ou Poppins) no <head> do index.html e defina font-family no body.\n- ÍCONES: Inclua a biblioteca Lucide Icons via CDN (<script src="https://unpkg.com/lucide@latest"></script>) e chame lucide.createIcons() no JS, ou use SVGs modernos e bem desenhados.\n- DESIGN SYSTEM COMPLETO NO styles.css: Declare variáveis CSS no :root (ex: --bg, --card, --primary, --text, --border, --accent), use layouts modernos com CSS Grid e Flexbox, bordas arredondadas (border-radius: 8px a 16px), sombras elegantes (box-shadow), cartões elevados, cabeçalho de destaque e espaçamentos harmônicos.\n- MICRO-INTERAÇÕES: Todos os botões, links, cards e inputs devem ter efeitos suaves de hover, active, focus e transições (transition: all 0.2s ease).',
  'ESTRUTURA MODULAR DE ARQUIVOS (ENTREGA 100% COMPLETA NO STATEFUL VFS):\nSempre entregue os arquivos completos dentro das tags:\n<arquivo nome="index.html">\n<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nome do App</title><link rel="stylesheet" href="styles.css"><link rel="preconnect" href="https://fonts.googleapis"><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"></head><body>...<script src="app.js"></script></body></html>\n</arquivo>\n<arquivo nome="styles.css">\n/* Design system completo com tokens, resets, cards, botões, cabeçalho, tipografia e layout responsivo */\n</arquivo>\n<arquivo nome="app.js">\n// Lógica interativa completa, estado reativo, ações para todos os botões e feedback visual\n</arquivo>',
  "PRESERVAÇÃO ESTRITA DO PROJETO EM EDIÇÕES:\n- Ao evoluir ou ajustar um projeto existente (ex: mudar cor, trocar texto ou adicionar uma funcionalidade), PRESERVE INTEGRALMENTE todo o design, estrutura e código já existentes nos outros arquivos. Altere apenas o necessário com máxima precisão.",
  'TROCA E GERAÇÃO DE IMAGENS:\nQuando o usuário pedir para gerar ou trocar imagens, use <img src="gerar:descrição detalhada em inglês" alt="..."> nos arquivos correspondentes.',
].join("\n\n");

/**
 * Projeto trazido de fora (importado): tem código de servidor ou build próprio.
 * Nesses casos o certo é editar os arquivos originais, não exigir o banco
 * hospedado do FabyClaud nem recriar tudo em index.html.
 */
export function projetoExterno(arquivos: Record<string, string>) {
  const nomes = Object.keys(arquivos).filter(
    (n) => !n.startsWith("enviados/") && !n.startsWith("originais/"),
  );
  if (!nomes.length) return false;
  const temIndexRaiz = nomes.includes("index.html");
  const temCodigoDeFora = nomes.some(
    (n) =>
      /\.(py|rb|php|go|java|cs|jsx|tsx|vue|toml)$/i.test(n) ||
      /(^|\/)(package\.json|requirements[^/]*\.txt|pyproject\.toml|dockerfile)$/i.test(n),
  );
  return temCodigoDeFora && !temIndexRaiz;
}

// Fechamento tolerante: aceita </arquivo>, variações erradas que a IA às vezes
// escreve (</arcs>, </file>), o início do próximo arquivo, ou o fim do texto.
const PADRAO_ARQUIVO =
  /<(?:arquivo\s+nome|file\s+path)=(["'])(.*?)\1\s*>\n?([\s\S]*?)(?:<\/\s*(?:arquivos?|arqs?|arcs?|files?)\s*>|(?=<(?:arquivo\s+nome|file\s+path)=)|$)/gi;
const PADRAO_CODIGO_ANTIGO = /```(?:html|HTML)?\s*\n([\s\S]*?)```/;
const PADRAO_IMG_GERAR = /src=(["'])\s*gerar:\s*(.*?)\1/gi;
const PADRAO_CONSULTA = /\{\{\s*consultar:\s*(.*?)\s*\}\}/gi;

// Blocos de patch parcial que o motor NÃO aceita mais: são apenas removidos do texto.
const PADRAO_PATCH_PARCIAL =
  /<modificar\s+arquivo=(["'])(.*?)\1\s*>([\s\S]*?)(?:<\/\s*modificar\s*>|(?=<modificar\s+arquivo=)|(?=<arquivo\s+nome=)|$)/gi;

// Raciocínio interno: nunca aparece pro usuário (aceita variações de fechamento).
const PADRAO_PENSANDO =
  /<\s*(?:pensando|think|thinking|raciocinio|racioc[íi]nio)\s*>[\s\S]*?(?:<\/\s*(?:pensando|think|thinking|raciocinio|racioc[íi]nio)\s*>|$)/gi;

/** Remove o bloco de raciocínio interno do texto mostrado no chat. */
export function limparPensamento(texto: string) {
  return texto
    .replace(PADRAO_PENSANDO, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function montarPromptConversa(
  pedido: string,
  extras?: {
    memoria?: string;
    agente?: string;
    notas?: string;
  },
): string {
  const partes = [
    "Você é a FabyClaud / Dev Buddy, uma assistente de IA amigável, inteligente e colaborativa para desenvolvedores e criadores de software no estilo Lovable / Claude Code.",
    "ESTILO DE RESPOSTA:\n- Responda em português com calor humano, clareza, empatia e objetividade.\n- Se o usuário estiver apenas saudando (oi, olá, bom dia, etc.) ou conversando casualmente, responda de forma natural, simpática e pergunte como pode ajudar no projeto ou desenvolvimento hoje.\n- Se o usuário fizer uma pergunta técnica, conceitual ou pedir uma sugestão, explique com didática e precisão técnica.\n- NÃO inclua tags <arquivo> e NÃO gere código de arquivos nesta resposta (isto é apenas uma conversa).\n- Mantenha a resposta acolhedora e direta.",
  ];

  if (extras?.memoria?.trim()) {
    partes.push(`--- Memória do usuário ---\n${extras.memoria.trim()}`);
  }
  if (extras?.agente?.trim()) {
    partes.push(`--- Modo de trabalho (agente escolhido) ---\n${extras.agente.trim()}`);
  }
  if (extras?.notas?.trim()) {
    partes.push(`--- Contexto recente do projeto ---\n${extras.notas.slice(-1500).trim()}`);
  }

  partes.push(`--- Mensagem do usuário ---\n${pedido}`);
  return partes.join("\n\n");
}

export function montarPrompt(
  pedido: string,
  arquivosAtuais: Record<string, string>,
  extras?: {
    memoria?: string;
    agente?: string;
    api?: string;
    auth?: string;
    privado?: string;
    notas?: string;
    licoes?: string;
    contrato?: ContratoEntrega;
    previewErros?: string[];
    testesAnteriores?: string;
  },
) {
  const partes = [INSTRUCAO_PROJETO];
  const intencao = classificarPedido(pedido);
  if (extras?.api?.trim()) {
    partes.push(instrucaoNuvem(extras.api.trim(), extras.auth?.trim(), extras.privado?.trim()));
  }
  if (extras?.agente?.trim()) {
    partes.push(`--- Modo de trabalho (agente escolhido) ---\n${extras.agente.trim()}`);
  }
  if (extras?.memoria?.trim()) {
    partes.push(
      `--- Memória do usuário (preferências permanentes, respeite sempre) ---\n${extras.memoria.trim()}`,
    );
  }
  if (extras?.licoes?.trim()) {
    partes.push(
      [
        "--- Aprendizado da escola (regras conquistadas nos estudos diários, obrigatórias) ---",
        extras.licoes.trim(),
        "Estas regras vieram de erros reais e de estudo próprio: aplique todas antes de entregar e nunca repita um defeito já listado aqui.",
      ].join("\n"),
    );
  }
  if (extras?.notas?.trim()) {
    partes.push(
      [
        "--- Memória deste projeto (o que já foi feito e decidido) ---",
        extras.notas.trim(),
        "Use isso como verdade sobre o histórico: não repita algo já entregue, não desfaça decisões e não volte a propor caminhos que já falharam aqui.",
      ].join("\n"),
    );
  }
  const todos = Object.keys(arquivosAtuais ?? {});
  // Imagens enviadas pelo usuário ficam guardadas como "enviados/...": o conteúdo é
  // gigante (imagem embutida), então mostramos só o caminho para a IA usar no src.
  const enviados = todos.filter((n) => n.startsWith("enviados/"));
  if (enviados.length) {
    partes.push(
      `--- Imagens que o usuário enviou (já estão no projeto) ---\n${enviados
        .map((n) => `- ${n}`)
        .join(
          "\n",
        )}\nPara usar uma delas, escreva exatamente src="CAMINHO" (ex: src="${enviados[0]}") no HTML/CSS/JS. Nunca diga que trocou uma imagem sem ter alterado o src no arquivo entregue.`,
    );
  }

  // Stateful VFS Snapshot completo: injeta a árvore e todos os arquivos do projeto no prompt
  if (intencao === "recriar" || pedidoUsaReferenciaVisual(pedido, enviados)) {
    partes.push(
      instrucoesImgToHtml({
        pedido,
        imagensEnviadas: enviados,
        preservarLayout: preservarLayoutImgToHtml(pedido),
      }),
    );
  }

  const nomesReais = todos.filter((n) => !n.startsWith("enviados/") && !n.startsWith("originais/"));
  if (nomesReais.length) {
    const vfsXml = directoryReader.gerarSnapshotXml(arquivosAtuais, {
      limiteBytesPorArquivo: intencao === "analisar" ? 30_000 : 25_000,
    });
    partes.push(
      [
        "--- STATEFUL VFS SNAPSHOT (ÁRVORE COMPLETA E ARQUIVOS ATUAIS DO PROJETO) ---",
        "Abaixo está o estado real e atual de todos os arquivos. Ao modificar qualquer arquivo, devolva-o 100% completo.",
        vfsXml,
      ].join("\n"),
    );
  }

  if (intencao === "analisar") {
    partes.push(
      [
        "--- MODO DE ANÁLISE, SOMENTE LEITURA ---",
        "Não crie, reescreva nem devolva tags <arquivo>. Não diga que atualizou ou abriu a prévia.",
        "Explique o que este projeto realmente faz, como as partes se ligam, o que está comprovado e o que não foi possível provar sem executar o servidor original.",
        "Toda conclusão importante deve citar pelo menos um caminho real mostrado no mapa ou nos arquivos selecionados.",
        "Na auditoria, separe: pontos fortes comprovados, problemas comprovados com caminho do arquivo, riscos que exigem execução e próximos consertos em ordem de impacto.",
        "Não trate um HTML administrativo isolado como se fosse a aplicação inteira e não invente tecnologia, versão, comando ou funcionalidade.",
      ].join("\n"),
    );
  } else if (intencao === "recriar") {
    const inventario = inventarioReferencia(arquivosAtuais);
    partes.push(
      [
        "--- MODO RECRIAR COMO APLICAÇÃO WEB ---",
        "Trabalhe de forma inteligente e estruturada: 1) identifique os recursos principais do projeto de referência, 2) planeje a interface e componentes, 3) entregue os arquivos completos para rodar direto no navegador.",
        "O projeto acima é a REFERÊNCIA. Entregue uma versão web moderna e funcional inspirada nele.",
        "Entregue os arquivos completos na raiz: index.html, styles.css e app.js (ou outros necessários).",
        "Preserve o visual e a navegação da referência, garantindo que botões, formulários e listas funcionem na prática.",
        inventario.texto,
        "Na resposta, explique de forma sucinta o que foi construído e dê sugestões do que pode ser personalizado a seguir.",
      ].join("\n"),
    );
  } else if (intencao === "abrir") {
    partes.push(
      "--- MODO ABRIR/TESTAR ---\nNão altere arquivos. Diga claramente se a interface é estática, parcial ou depende do servidor original. Nunca afirme que executou Python, Node, FastAPI, Flask, React ou Vite.",
    );
  } else if (intencao === "conversar") {
    partes.push(
      [
        "--- MODO CONSULTA (pergunta livre) ---",
        "Responda como um colega experiente responderia: direto, em primeira pessoa, sem cabeçalhos de relatório.",
        "Sirva para qualquer assunto: dúvida técnica, ideia de produto, comparação de ferramentas, próximo passo, opinião.",
        "Quando o assunto envolver o que este sistema pode fazer, diga com honestidade: o que dá para fazer aqui, o que não dá (e por quê), e qual caminho possível chega perto do objetivo.",
        "Nunca invente recurso, número, comando ou serviço. Se não souber, diga que não sabe e o que faria para descobrir.",
        "Se faltar um dado essencial, faça uma única pergunta curta no fim — não uma lista de perguntas.",
        "Não devolva tags <arquivo>, não altere nada e não diga que mexeu na prévia. Se a pessoa quiser que você construa, ofereça em uma frase e espere o 'pode fazer'.",
        "Termine com uma sugestão prática do que vale fazer em seguida.",
      ].join("\n"),
    );
  } else if (intencao === "alterar") {
    const tipoLovable = classificarPedidoLovable(pedido);
    const contrato = extras?.contrato ?? gerarContratoEntrega(pedido, arquivosAtuais, tipoLovable);
    partes.push(formatarContratoEntrega(contrato));

    const nomesExistentes = Object.keys(arquivosAtuais).filter(
      (n) => !n.startsWith("enviados/") && !n.startsWith("originais/"),
    );
    if (nomesExistentes.length > 0) {
      partes.push(
        [
          "--- TRAVA DE SEGURANÇA E DIRETRIZ CRÍTICA DE MODIFICAÇÃO INCREMENTAL E PRESERVAÇÃO VISUAL ---",
          "🔒 ESTE PROJETO JÁ ESTÁ FUNCIONANDO E COM DESIGN ESTABELECIDO.",
          "1. PRESERVAÇÃO ESTRITA DE DESIGN E LAYOUT: Preserve 100% da identidade visual, layout, classes CSS, IDs, componentes e funcionalidades existentes. NUNCA reescreva tudo do zero com um design simples ou cru.",
          "2. PROIBIÇÃO DE REGRESSÃO: NUNCA desfaça o visual construído, nunca apague seções existentes (sidebar de perfil, abas de recados/comunidades, cards ou botões) para tentar 'simplificar'.",
          "3. MODIFICAÇÃO CIRÚRGICA: Altere APENAS o que o usuário explicitamente pediu (por exemplo, se pediu para mudar a cor de um elemento ou trocar um texto, altere apenas a regra de cor no CSS ou o trecho específico no HTML/JS).",
          '4. ENTREGA COMPLETA DOS ARQUIVOS AFETADOS: Todo arquivo que você alterar deve ser entregue 100% completo e funcional dentro da tag <arquivo nome="caminho">...</arquivo>. Se a alteração for apenas no CSS (ex: troca de cor), entregue o <arquivo nome="styles.css"> completo com a cor atualizada sem desmanchar as outras regras de estilo.',
          '5. PROIBIDO RESPONDER APENAS COM TEXTO: NUNCA diga que fez a alteração sem entregar o arquivo modificado dentro da tag <arquivo nome="...">.',
        ].join("\n"),
      );
    }
  }
  partes.push(`--- Pedido do usuário ---\n${pedido}`);
  return partes.join("\n\n");
}

export type IntencaoPedido = "analisar" | "alterar" | "abrir" | "conversar" | "recriar";

export type ItemHistorico = { role: "user" | "assistant"; conteudo: string };

/** Recupera a ação combinada quando a pessoa responde apenas "sim", "pode", "crie", "não apareceu na prévia" etc. */
export function resolverPedidoContextual(
  pedido: string,
  historico: ItemHistorico[],
  arquivosAtuais: Record<string, string> = {},
): { pedidoEfetivo: string; intencao: IntencaoPedido; continuacao: boolean } {
  const limpo = pedido.trim();

  // Comandos de execução autônoma (/goal, /antigravity, /executar)
  const matchComandoExecucao = limpo.match(/^(?:\/goal|\/antigravity|\/executar)\s+([\s\S]+)$/i);
  if (matchComandoExecucao?.[1]) {
    const tarefa = matchComandoExecucao[1].trim();
    return {
      pedidoEfetivo: `🧠 MODO AUTÔNOMO DE ENGENHARIA DE SOFTWARE (ANTIGRAVITY SENIOR):\nExecutar com ciclo completo: ENTENDER → INVESTIGAR → PLANEJAR → IMPLEMENTAR → TESTAR → AUDITAR → CORRIGIR → VALIDAR.\n\nObjetivo: ${tarefa}`,
      intencao: "alterar" as IntencaoPedido,
      continuacao: false,
    };
  }

  let intencao: IntencaoPedido = classificarPedido(limpo);
  const ehNovoPedidoCriacao =
    /\b(?:cri(?:ar|e|a|e-me|a-me)|constru(?:ir|a|i)|desenvolv(?:er|a|e)|mont(?:ar|e|a)|fa(?:zer|ça|z)|ger(?:ar|e|a)|clon(?:ar|e|a)|recri(?:ar|e|a))\b[\s\S]{0,60}\b(?:vers[ãa]o|jogo|site|sistema|app|aplica[çc][ãa]o|calculadora|painel|dashboard|orkut|yorccut|clone|loja|saas|tela|p[aá]gina|todo|tarefas|chat|blog|portfolio|layout|design)\b/i.test(
      limpo,
    );

  const temInstrucaoSubstantiva =
    /\b(?:criar|construir|desenvolver|montar|fazer|gerar|clonar|recriar|mudar|trocar|adicionar|remover|ajustar|colocar|alterar|implementar|refazer)\b/i.test(
      limpo,
    ) && limpo.split(/\s+/).length > 2;

  const confirmacaoPura =
    !ehNovoPedidoCriacao &&
    !temInstrucaoSubstantiva &&
    /^(?:sim|s|yes|isso|exato|exatamente|pode|pode sim|pode ser|pode fazer|pode aplicar|fa[çc]a isso|fa[çc]a|manda|vamos|beleza|ok|claro|quero|bora|continue|continua|vai|execute|aplique)(?:[.,! ]|$)/i.test(
      limpo,
    );
  const queixaPrevia =
    /\b(n[aã]o\s+(?:apareceu|abriu|veio|tem|est[aá]|gerou|criou)|cad[eê]|onde\s+est[aá]|t[aá]\s+vazio|sem\s+nada|nada\s+na\s+tela|tela\s+preta|tela\s+branca|tela\s+vazia|mostra|funcione|arruma)\b/i.test(
      limpo,
    );

  const historicoInvertido = [...historico].reverse();
  const ultimaResposta =
    historicoInvertido.find((item) => item.role === "assistant")?.conteudo.trim() ?? "";

  const ofereceuAcao =
    /(?:quer que eu|posso|diga ["“']?.+?["”']? e eu|se quiser[^.]{0,80}(?:fa[çc]o|monto|crio|corrijo|construo)|pr[oó]ximo passo[^.]{0,80}(?:criar|corrigir|montar|implementar|construir)|o que pretendo alterar|arquivos afetados|pergunta crucial|confirma|podemos prosseguir|deseja que eu aplique|plano de altera[çc][ãa]o)/i.test(
      ultimaResposta,
    );

  const ultimoPedidoDoUsuario =
    historicoInvertido
      .find((item) => item.role === "user" && item.conteudo.trim() !== limpo)
      ?.conteudo.trim() ?? "";

  // Se o usuário está reclamando que a prévia está vazia:
  if (queixaPrevia && (ultimoPedidoDoUsuario || ultimaResposta)) {
    const alvo = ultimoPedidoDoUsuario || ultimaResposta;
    return {
      pedidoEfetivo: `O usuário relatou: "${limpo}".\nContexto do projeto solicitado: "${alvo.slice(0, 2000)}".\n\nATENÇÃO CRÍTICA OBRIGATÓRIA: A prévia do projeto ainda está vazia ou sem os arquivos executáveis. Você DEVE GERAR E ENTREGAR AGORA TODOS OS ARQUIVOS COMPLETOS dentro das tags <arquivo nome="index.html">...</arquivo>, <arquivo nome="styles.css">...</arquivo>, <arquivo nome="app.js">...</arquivo>. É terminantemente proibido responder apenas com texto explicativo ou promessas sem as tags <arquivo> completas!`,
      intencao: "alterar" as IntencaoPedido,
      continuacao: true,
    };
  }

  if (confirmacaoPura) {
    if (!ofereceuAcao) {
      return {
        pedidoEfetivo: limpo,
        intencao: intencao === "recriar" ? "recriar" : "conversar",
        continuacao: false,
      };
    }
    intencao = /vers[ãa]o web|recri(?:ar|o)|reconstruir|aplica[çc][ãa]o web/i.test(ultimaResposta)
      ? "recriar"
      : "alterar";
    return {
      pedidoEfetivo: `Execute agora a ação concreta que você ofereceu na resposta anterior. Não faça outra pergunta e não repita a oferta.\n\nResposta anterior:\n${ultimaResposta.slice(0, 3000)}`,
      intencao,
      continuacao: true,
    };
  }

  if (intencao !== "conversar") {
    return { pedidoEfetivo: limpo, intencao, continuacao: false };
  }

  if (!ultimaResposta || !ofereceuAcao) {
    return { pedidoEfetivo: limpo, intencao, continuacao: false };
  }

  intencao = /vers[ãa]o web|recri(?:ar|o)|reconstruir|aplica[çc][ãa]o web/i.test(ultimaResposta)
    ? "recriar"
    : "alterar";
  return {
    pedidoEfetivo: `Execute agora a ação concreta que você ofereceu na resposta anterior. Não faça outra pergunta e não repita a oferta.\n\nResposta anterior:\n${ultimaResposta.slice(0, 3000)}`,
    intencao,
    continuacao: true,
  };
}

/** Fatos objetivos entregues à IA antes dela decidir como mexer no projeto. */
export function diagnosticarProjeto(arquivos: Record<string, string>, pedido: string, notas = "") {
  const nomes = Object.keys(arquivos).filter(
    (nome) => !nome.startsWith("enviados/") && !nome.startsWith("originais/"),
  );
  const mapa = montarMapaProjeto(arquivos).split("Árvore completa de caminhos:")[0]?.trim();
  const problemas = auditarArquivos(arquivos);
  const errosInformados = [
    ...pedido.matchAll(/(?:uncaught|typeerror|referenceerror|failed to|erro)[^\n]*/gi),
  ]
    .map((item) => item[0].trim())
    .slice(0, 6);
  return [
    "--- DIAGNÓSTICO AUTOMÁTICO ANTES DE AGIR ---",
    mapa,
    `Estado atual: ${nomes.length ? "projeto existente; preserve o que funciona" : "projeto novo; defina uma primeira versão completa e testável"}.`,
    problemas.length
      ? `Problemas detectáveis nos arquivos: ${problemas.slice(0, 8).join(" | ")}`
      : "Problemas detectáveis nos arquivos: nenhum pela conferência estática; isso não prova serviços externos.",
    errosInformados.length
      ? `Erros reais informados: ${errosInformados.join(" | ")}`
      : "Erros reais informados: nenhum neste pedido.",
    notas.trim()
      ? "Há histórico do projeto abaixo; não reabra itens já concluídos sem prova nova."
      : "Ainda não há decisões anteriores registradas.",
    "Antes de responder, defina internamente: objetivo, concluído comprovado, pendências, riscos, segurança, arquivos afetados, ordem de execução e critérios de pronto.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Separa leitura, alteração e tentativa de abrir antes de chamar qualquer IA (Padrão Lovable). */
export function classificarPedido(pedido: string): IntencaoPedido {
  const limpo = pedido.trim();

  // Saudações e conversa casual rápida
  if (ehSaudacaoOuConversaCasual(limpo)) {
    return "conversar";
  }

  // Pedidos explícitos de análise / auditoria somente leitura -> analisar
  if (
    /\b(analise|analisar|audite|auditoria|descreva os arquivos|explique a arquitetura|revise o c[oó]digo|fa[çc]a uma auditoria)\b/i.test(
      limpo,
    )
  ) {
    return "analisar";
  }

  // Pedidos de importação / abertura de projeto existente -> abrir
  if (
    /\b(abra|abrir|carregue|carregar|importe|importar)\b[\s\S]{0,40}\b(pasta|zip|projeto|arquivo|c[oó]digo)\b/i.test(
      limpo,
    )
  ) {
    return "abrir";
  }

  // Recriação de projeto de referência / trazer do workspace para prévia -> recriar
  if (
    /\b(recri[ea]|recriar|reconstru[ai]|reproduz[ai]|clon(?:e|ar)|refa[çc]a\s+igual|traga\s+igual|deixa\s+igual|vers[ãa]o\s+web|em\s+vers[ãa]o\s+web|como\s+(?:app|aplica[çc][ãa]o)\s+web|traga\s+(?:do\s+workspace|para\s+a\s+pr[eé]via)|ponha\s+na\s+pr[eé]via|workspace)\b/i.test(
      limpo,
    )
  ) {
    return "recriar";
  }

  // Por padrão: Qualquer pedido de construção, tela, jogo, site, app, componente, ajuste, cor ou funcionalidade gera código!
  return "alterar";
}

/** Resumo determinístico para a IA enxergar a árvore inteira sem receber 200 arquivos às cegas. */
export function montarMapaProjeto(arquivos: Record<string, string>) {
  const nomes = Object.keys(arquivos)
    .filter((nome) => !nome.startsWith("enviados/") && !nome.startsWith("originais/"))
    .sort();
  const extensoes = new Map<string, number>();
  const pastas = new Map<string, number>();
  for (const nome of nomes) {
    const ext = nome.match(/(\.[a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "sem extensão";
    extensoes.set(ext, (extensoes.get(ext) ?? 0) + 1);
    const pasta = nome.includes("/") ? (nome.split("/")[0] ?? "raiz") : "raiz";
    pastas.set(pasta, (pastas.get(pasta) ?? 0) + 1);
  }
  const tecnologias: string[] = [];
  const tem = (padrao: RegExp) => nomes.some((nome) => padrao.test(nome));
  const conteudo = (nome: string) => arquivos[nome] ?? "";
  if (tem(/(^|\/)pyproject\.toml$|(^|\/)requirements[^/]*\.txt$/i)) tecnologias.push("Python");
  if (nomes.some((n) => /\.py$/i.test(n) && /\bFastAPI\s*\(/.test(conteudo(n))))
    tecnologias.push("FastAPI");
  if (nomes.some((n) => /\.py$/i.test(n) && /\bFlask\s*\(/.test(conteudo(n))))
    tecnologias.push("Flask");
  if (tem(/(^|\/)package\.json$/i)) tecnologias.push("Node/JavaScript");
  if (nomes.some((n) => /package\.json$/i.test(n) && /["']react["']/.test(conteudo(n))))
    tecnologias.push("React");
  if (tem(/(^|\/)vite\.config\./i)) tecnologias.push("Vite");
  if (tem(/\.html?$/i)) tecnologias.push("HTML");
  const entradas = nomes.filter((nome) =>
    /(^|\/)(index\.html?|main\.py|app\.py|server\.[cm]?[jt]s|package\.json|pyproject\.toml|requirements[^/]*\.txt|readme\.md)$/i.test(
      nome,
    ),
  );
  const formatoContagem = (mapa: Map<string, number>) =>
    [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([nome, qtd]) => `${nome}: ${qtd}`)
      .join(", ");
  return [
    `Total: ${nomes.length} arquivos.`,
    `Tecnologias detectadas por evidência: ${tecnologias.join(", ") || "não identificadas"}.`,
    `Tipos: ${formatoContagem(extensoes)}.`,
    `Pastas principais: ${formatoContagem(pastas)}.`,
    `Possíveis pontos de entrada/configuração:\n${
      entradas
        .slice(0, 30)
        .map((n) => `- ${n}`)
        .join("\n") || "- nenhum detectado"
    }`,
    `Árvore completa de caminhos:\n${nomes.map((n) => `- ${n}`).join("\n")}`,
  ].join("\n");
}

function selecionarArquivosParaPedido(
  pedido: string,
  arquivos: Record<string, string>,
  nomes: string[],
) {
  const termos = new Set(
    pedido
      .toLowerCase()
      .split(/[^a-z0-9_.\-/áàâãéêíóôõúç]+/i)
      .filter((termo) => termo.length >= 4),
  );
  const pontuar = (nome: string) => {
    const baixo = nome.toLowerCase();
    let pontos = 0;
    if (
      /(^|\/)(readme\.md|pyproject\.toml|requirements[^/]*\.txt|package\.json|main\.py|app\.py|index\.html?|vite\.config\.[^/]+)$/i.test(
        nome,
      )
    )
      pontos += 120;
    if (/(^|\/)(api|application|src|routes?|admin_static)\//i.test(nome)) pontos += 35;
    for (const termo of termos) if (baixo.includes(termo)) pontos += 50;
    const tamanho = (arquivos[nome] ?? "").length;
    if (tamanho > 0 && tamanho < 20_000) pontos += 5;
    return pontos;
  };
  return [...nomes].sort((a, b) => pontuar(b) - pontuar(a) || a.localeCompare(b)).slice(0, 45);
}

/**
 * Patches parciais (<modificar>/<substituir>) NÃO são mais aplicados.
 * Se a IA insistir nesse formato, o bloco é descartado do texto e nenhum
 * arquivo é alterado: o motor só aceita arquivo 100% reescrito.
 */
export function descartarPatchesParciais(resposta: string): {
  tinhaPatchParcial: boolean;
  textoLimpo: string;
} {
  PADRAO_PATCH_PARCIAL.lastIndex = 0;
  const tinhaPatchParcial = PADRAO_PATCH_PARCIAL.test(resposta);
  PADRAO_PATCH_PARCIAL.lastIndex = 0;
  return {
    tinhaPatchParcial,
    textoLimpo: resposta.replace(PADRAO_PATCH_PARCIAL, "").replace(/\n{3,}/g, "\n\n"),
  };
}

export function extrairArquivos(resposta: string): {
  arquivos: Record<string, string>;
  texto: string;
  patchParcialIgnorado?: boolean;
} {
  const modifier = new CodeModifier();
  const arquivosExtraidos = modifier.extrairArquivosCompletos(resposta);

  // Extrai tags <arquivo nome="..."> para limpar o texto de resposta
  const partes: string[] = [];
  let ultimoFim = 0;

  PADRAO_ARQUIVO.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PADRAO_ARQUIVO.exec(resposta)) !== null) {
    partes.push(resposta.slice(ultimoFim, m.index));
    const nome = (m[2] ?? "").trim();
    const conteudo = (m[3] ?? "").trim();
    if (nome && conteudo && !arquivosExtraidos[nome]) {
      arquivosExtraidos[nome] = conteudo;
    }
    ultimoFim = m.index + m[0].length;
  }
  partes.push(resposta.slice(ultimoFim));
  const textoSemArquivos = partes.join("");

  const { tinhaPatchParcial, textoLimpo } = descartarPatchesParciais(textoSemArquivos);
  const texto = limparPensamento(textoLimpo);

  if (Object.keys(arquivosExtraidos).length) {
    return {
      arquivos: arquivosExtraidos,
      texto: texto || "Projeto atualizado: arquivos reescritos por inteiro.",
      ...(tinhaPatchParcial ? { patchParcialIgnorado: true } : {}),
    };
  }

  // Fallback para blocos de código Markdown de múltiplas linguagens (HTML, CSS, JS, etc.)
  const blocosMarkdown = [...resposta.matchAll(/```([a-zA-Z0-9_\-./]*)\s*\n([\s\S]*?)```/g)];
  if (blocosMarkdown.length > 0) {
    const arquivosMd: Record<string, string> = {};
    for (const bloco of blocosMarkdown) {
      const header = (bloco[1] || "").toLowerCase().trim();
      const code = (bloco[2] || "").trim();
      if (!code) continue;

      if (header.includes("styles.css") || header.includes("style.css")) {
        arquivosMd["styles.css"] = code;
      } else if (header.includes("index.html") || header.includes("index.htm")) {
        arquivosMd["index.html"] = code;
      } else if (
        header.includes("app.js") ||
        header.includes("script.js") ||
        header.includes("main.js")
      ) {
        arquivosMd["app.js"] = code;
      } else if (header === "html" || /<!doctype html|<html/i.test(code)) {
        arquivosMd["index.html"] = code;
      } else if (header === "css" || /\{[\s\S]*?[a-z-]+\s*:\s*[^;]+;[\s\S]*?\}/i.test(code)) {
        arquivosMd["styles.css"] = code;
      } else if (
        header === "js" ||
        header === "javascript" ||
        /function|const|let|var|document\./i.test(code)
      ) {
        arquivosMd["app.js"] = code;
      }
    }
    if (Object.keys(arquivosMd).length > 0) {
      return {
        arquivos: arquivosMd,
        texto: texto || "Projeto atualizado! Veja a prévia ao lado.",
      };
    }
  }

  // Fallback se a resposta for HTML puro direto sem tags ou markdown
  if (/<!doctype html|<html[\s>]/i.test(resposta)) {
    const inicioHtml = resposta.search(/<!doctype html|<html[\s>]/i);
    const fimHtml = resposta.lastIndexOf("</html>");
    const code =
      fimHtml !== -1 ? resposta.slice(inicioHtml, fimHtml + 7) : resposta.slice(inicioHtml);
    return {
      arquivos: { "index.html": code.trim() },
      texto: texto || "Projeto atualizado com a nova versão!",
    };
  }

  return { arquivos: {}, texto: limparPensamento(resposta) || resposta.trim() };
}

function crc32(texto: string) {
  const bytes = new TextEncoder().encode(texto);
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Enriquece o prompt da imagem com detalhes de estilo, assunto e contexto para a IA de imagem produzir o resultado certo. */
export function enriquecerPromptImagem(descricao: string, contextoProjeto?: string): string {
  const d = descricao.trim();
  if (!d) return "modern clean user interface graphic design, high resolution";

  const dLower = d.toLowerCase();

  // Traduções e adaptações para termos específicos pedidos pelo usuário
  let basePrompt = d;
  if (/\ble[aã]o\b/i.test(dLower)) {
    basePrompt = basePrompt.replace(/\ble[aã]o\b/gi, "majestic lion");
  }
  if (/\bcadeira\b/i.test(dLower)) {
    basePrompt = basePrompt.replace(/\bcadeira\b/gi, "chair");
  }
  if (/\bsentad[oa]\b/i.test(dLower)) {
    basePrompt = basePrompt.replace(/\bsentad[oa]\b/gi, "sitting");
  }
  if (/\bpessoa\b/i.test(dLower)) {
    basePrompt = basePrompt.replace(/\bpessoa\b/gi, "friendly person");
  }

  // 1. Detecção de perfil / avatar
  if (
    /\b(perfil|avatar|foto de perfil|usuario|usuário|user|profile)\b/i.test(dLower) &&
    !/\b(cadeira|le[aã]o|carro|paisagem|mesa)\b/i.test(dLower)
  ) {
    const ehMulher = /\b(mulher|garota|menina|woman|girl|amiga|female)\b/i.test(dLower);
    const ehHomem = /\b(homem|garoto|menino|man|boy|amigo|male)\b/i.test(dLower);
    const sujeito = ehMulher
      ? "young brazilian woman"
      : ehHomem
        ? "young brazilian man"
        : "smiling person";
    return `portrait photo of a ${sujeito}, headshot profile picture, warm friendly smile, soft natural studio lighting, neutral aesthetic background, authentic sharp photography, 8k`;
  }

  // 2. Detecção de rede social / Orkut / comunidade / mensagens / WhatsApp
  if (
    /\b(orkut|comunidade|community|depoimento|scrapbook|social network|rede social)\b/i.test(
      dLower,
    ) &&
    !/\b(cadeira|le[aã]o|carro|mesa)\b/i.test(dLower)
  ) {
    return "early 2000s vintage social network community header banner, colorful retro aesthetic, clean digital illustration, high quality graphic design";
  }

  if (
    /\b(whatsapp|chat|mensagem|conversa|mensagens)\b/i.test(dLower) &&
    !/\b(cadeira|le[aã]o)\b/i.test(dLower)
  ) {
    return "modern messaging app interface background banner, clean aesthetic wallpaper, minimalist design";
  }

  // 3. Detecção de logo / ícone
  if (/\b(logo|icone|ícone|icon|symbol|brand)\b/i.test(dLower)) {
    const tema = contextoProjeto ? contextoProjeto.slice(0, 40) : "tech product";
    return `modern minimalist vector logo icon for ${d}, theme of ${tema}, sleek clean design on solid background, 4k`;
  }

  // 4. Detecção de banner / capa / hero / background
  if (/\b(banner|capa|hero|fundo|background|header)\b/i.test(dLower)) {
    const tema = contextoProjeto ? contextoProjeto.slice(0, 50) : "modern web app";
    return `sleek hero banner background for ${d} (${tema}), modern vibrant abstract aesthetic, high resolution web design`;
  }

  // 5. Pedidos específicos com objetos/cenas (ex: pessoa na cadeira, leão na cadeira)
  return `${basePrompt}, detailed photography, warm cinematic lighting, authentic realistic photo, 8k resolution, crisp focus`;
}

export type ResultadoComandoBarra = {
  executou: boolean;
  resposta: string;
  arquivos?: Record<string, string>;
};

/**
 * Processador de Slash Commands estilo Claude Code / Lovable:
 * /ajuda, /imagem, /arvore, /revisar, /banco, /limpar
 */
export function processarComandoBarra(
  mensagem: string,
  arquivos: Record<string, string>,
  opcoes?: { projetoId?: string; apiUrl?: string },
): ResultadoComandoBarra | null {
  const comando = mensagem.trim();
  if (!comando.startsWith("/")) return null;

  const partes = comando.slice(1).split(" ");
  const cmd = (partes[0] || "").toLowerCase();
  const args = partes.slice(1).join(" ").trim();

  if (cmd === "ajuda" || cmd === "help" || cmd === "comandos" || cmd === "plugins") {
    const resposta = [
      "⚡ **FabyCloud & Antigravity Plugins / Slash Commands (estilo Claude Code):**",
      "",
      "- `/goal <meta>` ou `/antigravity <meta>`: Executa o ciclo autônomo sênior de engenharia de software.",
      "- `/status` ou `/info`: Exibe o estado e métricas do sistema e Stateful VFS.",
      "- `/ajuda` ou `/help`: Exibe esta central de plugins e comandos.",
      "- `/imagem <descrição>`: Gera uma imagem de alta definição para o projeto.",
      "- `/arvore` ou `/graphify`: Mostra a árvore viva do VFS e tamanho dos arquivos.",
      "- `/revisar` ou `/auditar`: Executa a auditoria em tempo real de links, botões e integridade.",
      "- `/banco [coleção]`: Inspeciona os dados da coleção no banco hospedado.",
      "- `/limpar`: Instrução de limpeza de conversa mantendo os arquivos intactos.",
      "",
      "💡 *Dica: Você também pode digitar qualquer pedido livre de desenvolvimento full-stack.*",
    ].join("\n");
    return { executou: true, resposta };
  }

  if (cmd === "goal" || cmd === "antigravity") {
    if (!args) {
      const resposta = [
        "🧠 **Antigravity — Autonomous Software Engineering Agent**",
        "",
        "Modo de engenharia autônoma sênior ativado:",
        "`ENTENDER → INVESTIGAR → PLANEJAR → IMPLEMENTAR → TESTAR → AUDITAR → CORRIGIR → VALIDAR`",
        "",
        "**Princípios Fundamentais em Execução:**",
        "- 🔍 **Root Cause First:** Investigação profunda de causa raiz antes de qualquer alteração.",
        "- 🛡️ **Preservação:** Não reescreve partes funcionais; menor alteração segura possível.",
        "- ⚡ **Zero Placeholders:** Toda interação com lógica JavaScript real e reativa.",
        "- 📦 **Stateful VFS:** Integridade estrutural 100% garantida nos arquivos.",
        "",
        "💡 Para executar uma tarefa autônoma, use: `/goal <seu objetivo>` ou `/antigravity <sua meta>`",
      ].join("\n");
      return { executou: true, resposta };
    }
    // Com argumentos, retorna null para que a orquestração execute o objetivo com a IA
    return null;
  }

  if (cmd === "status" || cmd === "info") {
    const stats = directoryReader.obterEstatisticas(arquivos);
    const resposta = [
      "⚡ **Status do Sistema & Stateful VFS:**",
      `- Arquivos no projeto: ${stats.totalArquivos}`,
      `- Tamanho total: ${(stats.tamanhoTotal / 1024).toFixed(1)} KB`,
      `- Agente Ativo: Antigravity Autonomous Software Engineer`,
      `- Modo: Stateful VFS + Root Cause First`,
      `- Preview: SPA HTML5 / CSS3 / ES6+ reativo`,
    ].join("\n");
    return { executou: true, resposta };
  }

  if (cmd === "imagem" || cmd === "image" || cmd === "foto") {
    if (!args) {
      return {
        executou: true,
        resposta:
          "⚠️ Especifique o que deseja na imagem. Exemplo: `/imagem pessoa sorrindo estilo retro`",
      };
    }
    const promptEnriquecido = enriquecerPromptImagem(args);
    const seed = crc32(promptEnriquecido) % 1_000_000;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptEnriquecido)}?width=1024&height=768&seed=${seed}&nologo=true`;
    return {
      executou: true,
      resposta: `🖼️ **Imagem gerada com sucesso!**\n\n![${args}](${url})\n\nURL direta para uso no código:\n\`${url}\``,
    };
  }

  if (cmd === "arvore" || cmd === "tree" || cmd === "graphify" || cmd === "arquivos") {
    const arvore = directoryReader.gerarArvoreTexto(arquivos);
    const stats = directoryReader.obterEstatisticas(arquivos);
    const resposta = [
      "🌳 **Estrutura Viva do Projeto (Stateful VFS):**",
      `Total de arquivos: ${stats.totalArquivos} (${(stats.tamanhoTotal / 1024).toFixed(1)} KB)`,
      "```",
      arvore || "(projeto vazio)",
      "```",
    ].join("\n");
    return { executou: true, resposta };
  }

  if (cmd === "revisar" || cmd === "auditar" || cmd === "check") {
    const auditoria = auditarArquivos(arquivos);
    const resposta =
      auditoria.length === 0
        ? "✅ **Auditoria Concluída:** Nenhum problema detectado! Todos os arquivos, links e scripts estão íntegros."
        : `🔍 **Resultado da Auditoria (${auditoria.length} ponto(s) encontrado(s)):**\n${auditoria.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;
    return { executou: true, resposta };
  }

  if (cmd === "banco" || cmd === "db" || cmd === "dados") {
    const colecao = args || "itens";
    return {
      executou: true,
      resposta: `🗄️ **Banco de Dados Hospedado:**\nEndpoint: \`${opcoes?.apiUrl || "/api/public/dados"}/${colecao}\`\nOperações: GET (listar), POST (criar), PUT (editar), DELETE (apagar).\nPersistência automática no banco de dados e no preview.`,
    };
  }

  return null;
}

/** Troca <img src="gerar:descrição"> por uma imagem real da Pollinations.ai (grátis, sem chave). */
export function substituirGeradoresDeImagem(
  codigo: string,
  largura = 1024,
  altura = 768,
  contextoProjeto?: string,
) {
  return codigo.replace(PADRAO_IMG_GERAR, (todo, aspas: string, descricao: string) => {
    const desc = descricao.trim();
    if (!desc) return todo;
    const promptEnriquecido = enriquecerPromptImagem(desc, contextoProjeto);
    const seed = crc32(promptEnriquecido) % 1_000_000;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptEnriquecido)}?width=${largura}&height=${altura}&seed=${seed}&nologo=true`;
    return `src=${aspas}${url}${aspas}`;
  });
}

async function consultarDuckDuckGo(pergunta: string): Promise<string | null> {
  try {
    const url = new URL("https://api.duckduckgo.com/");
    url.searchParams.set("q", pergunta);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");
    url.searchParams.set("skip_disambig", "1");
    const r = await fetch(url, { headers: { "User-Agent": "FabyClaud/1.0" } });
    if (!r.ok) return null;
    const data = (await r.json()) as Record<string, unknown>;
    for (const campo of ["Answer", "AbstractText", "Definition"]) {
      const valor = data[campo];
      if (typeof valor === "string" && valor.trim()) return valor.trim();
    }
    const relacionados = data["RelatedTopics"];
    if (Array.isArray(relacionados)) {
      for (const item of relacionados) {
        const texto = (item as Record<string, unknown>)?.["Text"];
        if (typeof texto === "string" && texto.trim()) return texto.trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function resolverConsultas(codigo: string) {
  const perguntas = [...codigo.matchAll(PADRAO_CONSULTA)].map((m) => (m[1] ?? "").trim());
  if (!perguntas.length) return codigo;

  const unicas = [...new Set(perguntas)].slice(0, 6);
  const respostas = new Map<string, string>();
  await Promise.all(
    unicas.map(async (p) => {
      const r = await consultarDuckDuckGo(p);
      if (r) respostas.set(p, r);
    }),
  );

  return codigo.replace(PADRAO_CONSULTA, (_todo, pergunta: string) => {
    const chave = pergunta.trim();
    return respostas.get(chave) ?? "";
  });
}

/** Resolve marcadores de imagem e consulta em cada arquivo devolvido pela IA. */
export async function processarArquivos(
  arquivos: Record<string, string>,
  contextoProjeto?: string,
) {
  const saida: Record<string, string> = {};
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    saida[nome] = await resolverConsultas(
      substituirGeradoresDeImagem(conteudo, 1024, 768, contextoProjeto),
    );
  }
  return saida;
}

/**
 * Conferência automática (determinística, sem gastar IA): relê os arquivos
 * entregues procurando os erros clássicos que fazem um projeto "parecer pronto"
 * e não funcionar. Devolve a lista de problemas em português, pronta para ser
 * entregue à IA revisora.
 */
/** Só o nome do arquivo, sem pastas. */
function base(caminho: string) {
  return caminho.split("/").pop() ?? caminho;
}

/** Arquivos que rodam no servidor (não devem ser carregados por <script> no HTML). */
function ehArquivoDeServidor(caminho: string) {
  return (
    /^(backend|server|servidor|api|src\/server)\//i.test(caminho) ||
    /\.(sql|env|example)$/i.test(caminho) ||
    /(^|\/)(server|db|database|conexao|pool|routes?|controllers?|models?)\.(js|ts|mjs|cjs)$/i.test(
      caminho,
    ) ||
    /(^|\/)package(-lock)?\.json$/i.test(caminho)
  );
}

/** Distingue conversa de um pedido que obrigatoriamente precisa alterar arquivos (Padrão Lovable). */
export function pedidoExigeArquivos(pedido: string) {
  const intencao = classificarPedido(pedido);
  if (intencao === "recriar" || intencao === "alterar") return true;
  return false;
}

/** Pedidos assim não podem ser considerados completos sem servidor, conexão e SQL reais. */
export function pedidoExigeBackend(pedido: string) {
  const alvo =
    /\b(backend|servidor|banco de dados|sql|api|login|cadastro|cadastrar|conta|usu[aá]rios?|salvar|salve|salvo|guardar|persist\w*|coment[aá]rios?|recados?|postagens?|posts?|publica[çc][õo]es|produtos?|pedidos?|estoque|clientes?|crud)\b/i;
  const acao =
    /\b(cri[ea]|fa[çc]a|monte|construa|adicione|implemente|integre|conecte|corrija|altere|mude|mexer|transforme|desenvolva|gere|permita|deixe)\b/i;
  return alvo.test(pedido) && acao.test(pedido);
}

export function pedidoExigeAutenticacaoPrivada(pedido: string) {
  return /\b(login|cadastro|cadastrar|criar conta|senha|recuperar senha|[áa]rea privada|dados por usu[aá]rio|perfil privado|autentica[çc][ãa]o)\b/i.test(
    pedido,
  );
}

/**
 * Conferência do banco hospedado: o frontend precisa realmente falar com a API
 * da nuvem FabyClaud, e não fingir persistência no navegador.
 */
export function problemasDeBanco(arquivos: Record<string, string>): string[] {
  const problemas: string[] = [];
  const codigoFront = Object.entries(arquivos)
    .filter(
      ([nome]) =>
        !nome.startsWith("enviados/") &&
        !nome.startsWith("originais/") &&
        !ehArquivoDeServidor(nome),
    )
    .map(([, conteudo]) => conteudo)
    .join("\n");

  if (!codigoFront.trim()) return problemas;

  if (!usaBancoHospedado(codigoFront)) {
    problemas.push(
      'O projeto não chama a api do banco de dados hospedado (falta const API = "%%FABY_API%%" e as chamadas fetch de listar/criar/editar/apagar).',
    );
    return problemas;
  }

  const usaFetch = /fetch\s*\(/.test(codigoFront);
  if (!usaFetch) {
    problemas.push("O endereço do banco aparece no código, mas nenhuma chamada fetch foi escrita.");
  }
  if (usaFetch && !/method\s*:\s*(["'])POST\1/i.test(codigoFront) && /<form\b/i.test(codigoFront)) {
    problemas.push(
      "Há formulário no projeto, mas nada é gravado no banco de dados (falta a chamada POST).",
    );
  }
  // localStorage fingindo ser banco: guardar listas inteiras de registros.
  const salvaListaNoNavegador =
    /localStorage\.setItem\(\s*(["'`])(?!tema|theme|logado|usuario_logado|sessao|token)[^"'`]*\1\s*,\s*JSON\.stringify\(\s*(?!\{\s*id)/i.test(
      codigoFront,
    );
  if (salvaListaNoNavegador && !/catch|offline/i.test(codigoFront)) {
    problemas.push(
      "O projeto guarda a lista de registros no navegador (localStorage) em vez de gravar no banco de dados hospedado.",
    );
  }
  return problemas;
}

export function problemasDeAutenticacao(arquivos: Record<string, string>): string[] {
  const codigo = Object.entries(arquivos)
    .filter(
      ([nome]) =>
        !nome.startsWith("enviados/") &&
        !nome.startsWith("originais/") &&
        !ehArquivoDeServidor(nome),
    )
    .map(([, conteudo]) => conteudo)
    .join("\n");
  const problemas: string[] = [];
  if (!usaAutenticacaoPrivada(codigo))
    problemas.push("O app não chama a autenticação privada com sessão Bearer.");
  if (!/acao\s*:\s*["'`]cadastro/i.test(codigo) || !/acao\s*:\s*["'`]entrar/i.test(codigo))
    problemas.push("Faltam cadastro e entrada reais na autenticação do app.");
  if (
    /localStorage\.setItem\([^,]+,\s*(?:senha|password)|localStorage[^\n]{0,100}senha/i.test(codigo)
  )
    problemas.push("O app tenta guardar senha no navegador.");
  return problemas;
}

export function problemasCriticos(problemas: string[]) {
  return problemas.filter((problema) =>
    /falta o arquivo|aponta para|não foi entregue|não carrega|backend foi citado|falta o backend|falta o arquivo \.sql|falta o arquivo de conexão|não chama a api|nenhuma chamada fetch|nada é gravado no banco|em vez de gravar no banco|não existe no javascript|não existe no html|botão sem ação|arquivo vazio|arquivo .*incompleto|trecho omitido|falta o arquivo de estilo/i.test(
      problema,
    ),
  );
}
export function auditarArquivos(arquivos: Record<string, string>): string[] {
  const problemas: string[] = [];
  const nomes = Object.keys(arquivos);
  const index = arquivos["index.html"];

  if (!index) {
    if (nomes.length) problemas.push('Falta o arquivo "index.html" (é o que abre no navegador).');
    return problemas;
  }

  // Uma aplicação importada pode conter várias telas independentes. A auditoria
  // do index principal não pode misturar HTML/JS de painéis, exemplos ou docs.
  const pastaIndex = index ? "" : "";
  const htmls = nomes.filter((n) => /\.html?$/i.test(n) && pastaDoArquivo(n) === pastaIndex);
  const todoHtml = htmls.map((n) => arquivos[n] ?? "").join("\n");

  for (const nome of nomes) {
    if (!(arquivos[nome] ?? "").trim()) problemas.push(`O arquivo "${nome}" está vazio.`);
    if (/\[(?:conteúdo|restante) omitido por limite\]/i.test(arquivos[nome] ?? "")) {
      problemas.push(`O arquivo "${nome}" está incompleto porque contém um trecho omitido.`);
    }
  }

  // 1. Referências a arquivos que não existem + arquivos entregues sem serem usados.
  const referenciados = new Set<string>();
  for (const m of todoHtml.matchAll(/(?:href|src)=(["'])([^"']+)\1/gi)) {
    const alvo = (m[2] ?? "").trim();
    if (!alvo || /^(https?:|data:|blob:|mailto:|tel:|#|\/\/)/i.test(alvo)) continue;
    // Trechos dinâmicos (template do JS) não são arquivos.
    if (/[${}]|\{\{/.test(alvo)) continue;
    const limpo = alvo.replace(/^\.?\//, "").split(/[?#]/)[0] ?? "";
    referenciados.add(limpo);
    referenciados.add(base(limpo));
    if (limpo && !nomes.some((n) => n === limpo || base(n) === base(limpo))) {
      problemas.push(`O HTML aponta para "${limpo}", mas esse arquivo não foi entregue.`);
    }
  }
  for (const nome of nomes) {
    if (ehArquivoDeServidor(nome)) continue; // roda no servidor, não no navegador
    if (/\.(css|js)$/i.test(nome) && !referenciados.has(nome) && !referenciados.has(base(nome))) {
      problemas.push(
        `O arquivo "${nome}" foi entregue mas nenhum HTML o carrega (falta <link> ou <script>).`,
      );
    }
  }

  // 1a. Conferência de Estilos (Design System Obrigatório no Padrão Lovable)
  const temCssExterno = nomes.some(
    (n) => /\.(css)$/i.test(n) && (arquivos[n] ?? "").trim().length > 30,
  );
  const temCssInline = [...todoHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].some(
    (m) => (m[1] ?? "").trim().length > 30,
  );
  if (!temCssExterno && !temCssInline) {
    problemas.push(
      "Falta o arquivo de estilo 'styles.css' com o design visual completo e profissional da aplicação.",
    );
  }

  // 1b. Backend entregue pela metade.
  // Aplicações web criadas no FabyClaud têm index.html e comunicam com a nuvem hospedada (%%FABY_API%%).
  // Apenas projetos de servidor dedicados/importados sem index.html são auditados para exigir Node/SQL local.
  const temIndexPrincipal = nomes.some((n) => /^index\.html?$/i.test(n));
  const temBackend = !temIndexPrincipal && nomes.some((n) => ehArquivoDeServidor(n));
  if (temBackend) {
    const arquivoServidor = nomes.find(
      (n) => /(^|\/)(server|app|index)\.(js|ts|mjs|cjs)$/i.test(n) && ehArquivoDeServidor(n),
    );
    const codigoServidor = arquivoServidor ? (arquivos[arquivoServidor] ?? "") : "";
    const temServidor =
      Boolean(arquivoServidor) &&
      /\b(?:app|router)\s*\.\s*(?:get|post|put|patch|delete)\s*\(/i.test(codigoServidor);
    const temPacote = nomes.some((n) => /(^|\/)package\.json$/i.test(n));
    const temSql = nomes.some((n) => /\.sql$/i.test(n));
    const temConexao = nomes.some((n) => /(^|\/)(db|database|conexao|pool)\.(js|ts)$/i.test(n));
    if (!temServidor)
      problemas.push(
        "O backend foi citado, mas falta um arquivo de servidor com rotas REST reais (GET/POST/PUT/DELETE).",
      );
    if (!temPacote)
      problemas.push("Falta o backend/package.json com as dependências e o script start.");
    if (!temSql) problemas.push("Falta o arquivo .sql com os CREATE TABLE do banco de dados real.");
    if (!temConexao)
      problemas.push(
        "Falta o arquivo de conexão real com o banco (backend/db.js abrindo pg ou better-sqlite3).",
      );
    const jsFront = nomes
      .filter((n) => /\.js$/i.test(n) && !ehArquivoDeServidor(n))
      .map((n) => arquivos[n] ?? "")
      .concat(todoHtml)
      .join("\n");
    if (!/fetch\s*\(/.test(jsFront)) {
      problemas.push(
        "O frontend não chama a API do backend com fetch — o sistema ficou pela metade (backend entregue, tela ainda só no navegador).",
      );
    }
  }

  // 2. Funções chamadas em onclick/oninput que não existem no JS.
  const scriptsLigados = new Set<string>();
  for (const m of todoHtml.matchAll(/<script[^>]*\ssrc=(["'])([^"']+)\1[^>]*>/gi)) {
    const alvo = (m[2] ?? "").replace(/^\.?\//, "").split(/[?#]/)[0] ?? "";
    if (alvo) scriptsLigados.add(alvo);
  }
  const js = nomes
    .filter(
      (n) =>
        /\.js$/i.test(n) &&
        (pastaDoArquivo(n) === pastaIndex || scriptsLigados.has(n) || scriptsLigados.has(base(n))),
    )
    .map((n) => arquivos[n] ?? "")
    .concat(
      [...todoHtml.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
        (m) => m[1] ?? "",
      ),
    )
    .join("\n");

  const chamadasInline = new Set<string>();
  for (const m of todoHtml.matchAll(/\son[a-z]+=(["'])([^"']*)\1/gi)) {
    for (const c of (m[2] ?? "").matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) {
      const fn = c[1] ?? "";
      if (!["if", "for", "while", "return", "alert", "confirm", "prompt"].includes(fn)) {
        chamadasInline.add(fn);
      }
    }
  }
  for (const fn of chamadasInline) {
    const existe = new RegExp(
      `(function\\s+${fn}\\b|\\b(?:const|let|var)\\s+${fn}\\s*=|\\b${fn}\\s*:\\s*(?:function|\\()|window\\.${fn}\\s*=)`,
    ).test(js);
    if (!existe) {
      problemas.push(`O HTML chama a função "${fn}()", mas ela não existe no JavaScript.`);
    }
  }

  // 3. Ids usados no JS que não existem no HTML.
  const idsHtml = new Set(
    [...todoHtml.matchAll(/\sid=(["'])([^"']+)\1/gi)].map((m) => (m[2] ?? "").trim()),
  );
  const idsJs = new Set<string>();
  for (const m of js.matchAll(/getElementById\(\s*(["'`])([^"'`]+)\1\s*\)/g)) {
    idsJs.add(m[2] ?? "");
  }
  for (const m of js.matchAll(/querySelector(?:All)?\(\s*(["'`])#([\w-]+)\1\s*\)/g)) {
    idsJs.add(m[2] ?? "");
  }
  for (const id of idsJs) {
    if (/[${}]/.test(id)) continue; // id montado em tempo de execução
    if (id && !idsHtml.has(id)) {
      problemas.push(`O JavaScript procura o elemento de id "${id}", que não existe no HTML.`);
    }
  }

  // 4. Links e botões mortos / placeholders de "em breve".
  const mortos = [
    ...todoHtml.matchAll(/<a\b([^>]*)href=(["'])\s*(?:#|javascript:void\(0\))\s*\2([^>]*)>/gi),
  ].filter((m) => {
    const attrs = `${m[1] ?? ""} ${m[3] ?? ""}`;
    if (/\bonclick\s*=/i.test(attrs)) return false;
    if (/\bdata-(?:tab|action|view|target|toggle|modal)\b/i.test(attrs)) return false;
    if (/\b(?:id|class)\s*=\s*(["'])([^"']+)\1/i.test(attrs)) {
      const id = attrs.match(/\bid\s*=\s*(["'])([^"']+)\1/i)?.[2];
      const classes = (attrs.match(/\bclass\s*=\s*(["'])([^"']+)\1/i)?.[2] ?? "")
        .split(/\s+/)
        .filter(Boolean);
      if (
        id &&
        new RegExp(
          `(?:getElementById\\(\\s*["'\\x60]${escapeRegex(id)}["'\\x60]|querySelector(?:All)?\\(\\s*["'\\x60]#${escapeRegex(id)}["'\\x60])`,
        ).test(js)
      )
        return false;
      if (
        classes.some((c) =>
          new RegExp(`querySelector(?:All)?\\(\\s*["'\\x60][^"'\\x60]*\\.${escapeRegex(c)}`).test(
            js,
          ),
        )
      )
        return false;
    }
    return true;
  });
  if (mortos.length > 2) {
    problemas.push(`Existem ${mortos.length} links sem destino real (href="#").`);
  }
  if (/em breve|coming soon|lorem ipsum|TODO\b/i.test(todoHtml)) {
    problemas.push('O projeto tem texto de rascunho ("em breve", "lorem ipsum" ou "TODO").');
  }

  // 4b. Cada botão precisa estar ligado a formulário ou a uma ação no JavaScript.
  const todosBotoesLigados =
    /addEventListener\(\s*(["'`])click\1/i.test(js) ||
    /querySelector(?:All)?\(\s*(["'`])(?:button|\.[a-zA-Z0-9_-]+|\[data-)/i.test(js) ||
    /getElementsByTagName\(\s*(["'`])button\1\s*\)/i.test(js) ||
    /\.onclick\s*=/i.test(js);

  for (const m of todoHtml.matchAll(/<button\b([^>]*)>/gi)) {
    const attrs = m[1] ?? "";
    if (
      todosBotoesLigados ||
      /\btype\s*=\s*(["'])submit\1/i.test(attrs) ||
      /\bonclick\s*=/i.test(attrs) ||
      /\bdata-(?:tab|action|view|target|toggle|modal|id|status|user)\b/i.test(attrs) ||
      /\bclass\s*=\s*(["'])[^"']*\b(tab|nav|menu|item|chip|badge|btn|win-|close|minimize|maximize|avatar)[^"']*\1/i.test(
        attrs,
      )
    )
      continue;
    const id = attrs.match(/\bid\s*=\s*(["'])([^"']+)\1/i)?.[2];
    const classes = (attrs.match(/\bclass\s*=\s*(["'])([^"']+)\1/i)?.[2] ?? "")
      .split(/\s+/)
      .filter(Boolean);
    const ligadoPorId = id
      ? new RegExp(
          `(?:getElementById\\(\\s*["'\\x60]${escapeRegex(id)}["'\\x60]|querySelector(?:All)?\\(\\s*["'\\x60]#${escapeRegex(id)}["'\\x60])`,
        ).test(js)
      : false;
    const ligadoPorClasse = classes.some((classe) =>
      new RegExp(`querySelector(?:All)?\\(\\s*["'\\x60][^"'\\x60]*\\.${escapeRegex(classe)}`).test(
        js,
      ),
    );
    if (!ligadoPorId && !ligadoPorClasse && classes.length === 0 && !id) {
      const depois = todoHtml.slice(m.index + m[0].length);
      const rotulo = (depois.match(/^\s*(?:<[^>]+>\s*)*([^<]{1,50})/i)?.[1] ?? "").trim();
      if (rotulo && rotulo.length > 2) {
        problemas.push(`Há um botão sem ação verificável ("${rotulo}").`);
      }
    }
  }

  for (const m of todoHtml.matchAll(/<a\b([^>]*)href=(["'])#([^"']+)\2[^>]*>/gi)) {
    const alvo = m[3] ?? "";
    if (
      alvo &&
      !idsHtml.has(alvo) &&
      !new RegExp(`["'\\x60]#${escapeRegex(alvo)}["'\\x60]`).test(js)
    ) {
      problemas.push(
        `Há um link interno para "#${alvo}", mas esse destino não existe no HTML nem na navegação.`,
      );
    }
  }

  // 5. Estrutura básica do HTML.
  for (const nome of htmls) {
    const c = arquivos[nome] ?? "";
    for (const tag of ["html", "head", "body"]) {
      const abre = (c.match(new RegExp(`<${tag}\\b`, "gi")) ?? []).length;
      const fecha = (c.match(new RegExp(`</${tag}>`, "gi")) ?? []).length;
      if (abre && abre !== fecha) {
        problemas.push(`Em "${nome}" a tag <${tag}> não está fechada corretamente.`);
      }
    }
    for (const tag of ["div", "section", "main", "form", "ul", "table"]) {
      const abre = (c.match(new RegExp(`<${tag}\\b`, "gi")) ?? []).length;
      const fecha = (c.match(new RegExp(`</${tag}>`, "gi")) ?? []).length;
      if (abre > fecha) {
        problemas.push(
          `Em "${nome}" há ${abre - fecha} tag(s) <${tag}> abertas sem fechamento correspondente.`,
        );
      }
    }
  }

  // 6. Formulários sem validação nenhuma.
  for (const m of todoHtml.matchAll(/<form\b[\s\S]*?<\/form>/gi)) {
    const bloco = m[0] ?? "";
    if (/<input\b/i.test(bloco) && !/required|novalidate|addEventListener|onsubmit/i.test(bloco)) {
      problemas.push("Há um formulário com campos sem nenhuma validação (required ou no JS).");
      break;
    }
  }

  return [...new Set(problemas)].slice(0, 25);
}

function escapeRegex(valor: string) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pastaDoArquivo(nome: string) {
  return nome.includes("/") ? nome.slice(0, nome.lastIndexOf("/") + 1) : "";
}

/**
 * Inventário da referência: lista determinística do que o projeto original faz
 * (telas, navegação, seções, formulários, botões, rotas e dados). É o contrato
 * que a versão web precisa cobrir — sem isso a IA recria só um pedaço bonito.
 */
export type Inventario = { itens: string[]; texto: string };

export function inventarioReferencia(arquivos: Record<string, string>): Inventario {
  const nomes = Object.keys(arquivos).filter(
    (n) => !n.startsWith("enviados/") && !n.startsWith("originais/"),
  );
  const html = nomes.filter((n) => /\.html?$/i.test(n));
  const codigo = nomes.filter((n) => /\.(py|js|mjs|cjs|ts|tsx|rb|php|go)$/i.test(n));
  const limpar = (v: string) =>
    v
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const telas: string[] = [];
  const navegacao = new Set<string>();
  const secoes = new Set<string>();
  const botoes = new Set<string>();
  const campos = new Set<string>();
  const rotas = new Set<string>();
  const dados = new Set<string>();
  let formularios = 0;

  for (const nome of html) {
    const c = arquivos[nome] ?? "";
    const titulo = limpar(c.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    telas.push(`${nome}${titulo ? ` (título: ${titulo})` : ""}`);
    for (const m of c.matchAll(/<a\b[^>]*>([\s\S]{1,60}?)<\/a>/gi)) {
      const texto = limpar(m[1] ?? "");
      if (texto.length >= 3) navegacao.add(texto);
    }
    for (const m of c.matchAll(/<h([1-3])[^>]*>([\s\S]{1,80}?)<\/h\1>/gi)) {
      const texto = limpar(m[2] ?? "");
      if (texto.length >= 3) secoes.add(texto);
    }
    for (const m of c.matchAll(/<button\b[^>]*>([\s\S]{1,60}?)<\/button>/gi)) {
      const texto = limpar(m[1] ?? "");
      if (texto.length >= 2) botoes.add(texto);
    }
    for (const m of c.matchAll(/<input\b[^>]*\bname=(["'])([^"']+)\1/gi)) {
      campos.add(m[2] ?? "");
    }
    formularios += (c.match(/<form\b/gi) ?? []).length;
  }

  for (const nome of codigo) {
    const c = arquivos[nome] ?? "";
    for (const m of c.matchAll(
      /@[\w.]*(?:route|get|post|put|patch|delete)\(\s*(["'])([^"']+)\1|\b(?:app|router|api)\s*\.\s*(get|post|put|patch|delete)\s*\(\s*(["'])([^"']+)\4/gi,
    )) {
      const caminho = m[2] ?? m[5] ?? "";
      if (caminho) rotas.add(caminho);
    }
    for (const m of c.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([\w.]+)/gi)) {
      dados.add(m[1] ?? "");
    }
    for (const m of c.matchAll(/class\s+(\w+)\s*\([^)]*(?:Model|Base)[^)]*\)/g)) {
      dados.add(m[1] ?? "");
    }
  }

  const lista = (titulo: string, valores: string[], max = 14) =>
    valores.length ? `${titulo}: ${valores.slice(0, max).join(" | ")}` : "";

  const itens = [
    ...[...navegacao].slice(0, 14),
    ...[...secoes].slice(0, 14),
    ...[...botoes].slice(0, 14),
  ];

  const texto = [
    "--- INVENTÁRIO DA REFERÊNCIA (cobertura obrigatória) ---",
    lista("Telas/templates", telas, 20),
    lista("Navegação e links", [...navegacao]),
    lista("Seções e títulos", [...secoes]),
    lista("Botões e ações", [...botoes]),
    lista("Campos de formulário", [...campos], 20),
    formularios
      ? `Formulários na referência: ${formularios} (cada um precisa gravar de verdade)`
      : "",
    lista("Rotas do servidor original", [...rotas], 24),
    lista("Tabelas/modelos de dados", [...dados], 20),
    itens.length
      ? "Regra: cada item acima precisa existir e funcionar na versão web, ou ser declarado como pendência no fim da resposta."
      : "A referência não trouxe interface detectável: construa a tela principal completa a partir do código e das rotas.",
  ]
    .filter(Boolean)
    .join("\n");

  return { itens, texto };
}

/** Compara a entrega com o inventário e aponta o que ficou de fora. */
export function coberturaRecriacao(
  inventario: Inventario,
  entregues: Record<string, string>,
): string[] {
  if (!inventario.itens.length) return [];
  const frente = Object.entries(entregues)
    .filter(
      ([nome]) =>
        !nome.startsWith("enviados/") &&
        !nome.startsWith("originais/") &&
        !ehArquivoDeServidor(nome),
    )
    .map(([, c]) => c)
    .join("\n")
    .toLowerCase();
  if (!frente.trim()) return [];
  const faltando = inventario.itens.filter((item) => {
    const chave = item.toLowerCase().trim();
    if (chave.length < 3) return false;
    if (frente.includes(chave)) return false;
    // aceita quando as palavras principais aparecem, mesmo com texto reescrito
    const palavras = chave.split(/[^a-z0-9áàâãéêíóôõúç]+/i).filter((p) => p.length >= 4);
    if (!palavras.length) return false;
    return !palavras.every((p) => frente.includes(p));
  });
  return faltando
    .slice(0, 10)
    .map((item) => `Faltou reproduzir "${item}" que existe no projeto de referência.`);
}
