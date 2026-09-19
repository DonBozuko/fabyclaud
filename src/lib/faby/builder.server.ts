/**
 * Geração e edição de projetos com múltiplos arquivos.
 * A IA escreve cada arquivo 100% completo dentro de <arquivo nome="..."> ou <file path="...">,
 * mantendo o Stateful VFS (árvore e arquivos) perfeitamente sincronizado a cada iteração.
 */

import { instrucaoNuvem, usaAutenticacaoPrivada, usaBancoHospedado } from "./nuvem";
import { CodeModifier } from "@/agents/CodeModifier";
import { DirectoryReader } from "@/agents/DirectoryReader";

const directoryReader = new DirectoryReader();

export const INSTRUCAO_PROJETO = [
  'Você é a FabyClaud / Dev Buddy, uma IA especialista em Engenharia de Software Fullstack e Desenvolvimento Autônomo. Você constrói e evolui sistemas reais e completos: tanto o frontend (HTML/CSS/JS, React, UI moderna) quanto o backend (APIs REST, endpoints de servidor, regras de negócio, manipulação de dados, banco de dados e autenticação).',
  'FORMAS DE ENTREGAR OU MODIFICAR CÓDIGO (PADRÃO LOVABLE - ARQUIVOS 100% COMPLETOS):\n1) ARQUIVO COMPLETO OU NOVO (OBRIGATÓRIO):\nSempre entregue o arquivo integralmente reescrito dentro da tag:\n<arquivo nome="caminho/do/arquivo.ext">\nconteúdo 100% completo e reescrito\n</arquivo>\n\n2) PROIBIÇÃO DE PATCHES OU TRECHOS PARCIAIS:\nNUNCA use buscas parciais, substituições parciais por regex, nem resuma o código com "// ...restante do código". Isso quebra a compilação e a formatação. Se for alterar 1 linha ou 100 linhas em um arquivo existente, SEMPRE devolva o arquivo INTEIRO.',
  'DESENVOLVIMENTO FULLSTACK REAL E INTEGRADO:\n- Se o usuário pedir alteração de dados, persistência, mock ou nova funcionalidade, altere NO MESMO CICLO DE RESPOSTA tanto os arquivos de mock/dados/banco (ex: src/data/mockData.ts, schemas, endpoints) quanto a interface visual no frontend (.tsx, .jsx, .html).\n- Mantenha todos os contratos de dados, imports e referências de imagens (ex: assets ou URLs enviadas) 100% consistentes entre frontend e backend.\n- Nunca entregue botões "fake", mocks estáticos não funcionais ou interfaces que apenas fingem que salvam dados.',
  'EDIÇÃO CONTÍNUA E ITERAÇÃO (STATEFUL VFS):\n- Você receberá o estado real e atual de todos os arquivos do projeto no snapshot XML do VFS.\n- Preserve integralmente todas as funcionalidades e arquivos existentes que não precisam de alteração.\n- Responda com clareza explicando: 1) O que foi alterado/adicionado; 2) Quais arquivos foram tocados; 3) Como testar a nova funcionalidade.',
  'PADRÃO DE DESIGN E QUALIDADE:\n- Tipografia moderna (Google Fonts), hierarquia visual rica, cores harmônicas e micro-interações.\n- Formulários com validações claras, tratamento de erros e feedbacks visuais imediatos.\n- Ícones SVG inline limpos, layout responsivo (mobile-first) e código limpo e modular.',
  'TROCA E GERAÇÃO DE IMAGENS:\nQuando o usuário pedir para gerar ou trocar imagens, use <img src="gerar:descrição detalhada em inglês" alt="..."> nos arquivos correspondentes.',
  'AUTONOMIA DE ENGENHARIA SÊNIOR:\nVocê atua com autonomia e rigor técnico. Se o usuário pedir para consertar, adicionar recurso ou refatorar frontend ou backend, aplique as modificações necessárias sem hesitação, entregando sempre código funcional de verdade.',
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
        "Trabalhe como um time inteiro numa única resposta, nesta ordem: 1) planejadora (lista o que a referência faz), 2) arquiteta (decide telas, dados e rotas), 3) designer (define layout, tipografia, cores e estados), 4) construtora (escreve os arquivos completos), 5) engenheira sênior revisora (relê procurando botão sem ação, id inexistente, lista que não carrega, formulário que não grava).",
        "O projeto acima é a REFERÊNCIA (especificação viva). Ele depende de um ambiente que não roda aqui, então sua tarefa é entregar uma versão web equivalente que abre direto no navegador.",
        "PROIBIDO perguntar qual tela, qual app ou pedir mais contexto: escolha a tela principal pelo mapa e pelos arquivos de interface e construa agora.",
        "PROIBIDO devolver os arquivos originais do projeto importado. Eles ficam intactos no Workspace.",
        "PROIBIDO entregar uma parte e chamar de pronto. Cobertura mínima: TODOS os itens do inventário abaixo precisam existir e funcionar na versão web. Se algum item ficar de fora, ele tem que aparecer no fim da resposta como pendência explícita — nunca em silêncio.",
        "Entregue poucos arquivos completos na raiz: index.html, styles.css e app.js (adicione outra página só se for essencial).",
        "Reproduza fielmente o que existir na referência: nome, navegação, seções, listas, formulários, textos e disposição visual. Se houver HTML/CSS de interface na referência, siga o visual dele.",
        "Toda ação visível precisa funcionar de verdade: navegação entre seções, formulários que gravam, listas que carregam do banco hospedado, editar e apagar reais. Nada de botão decorativo.",
        "Cada rota da referência que salvava ou lia dados vira uma chamada real ao banco hospedado (listar, criar, editar, apagar). Rota da referência sem equivalente na versão web = entrega incompleta.",
        "Antes de fechar, percorra o inventário item por item e confirme onde cada um está no código que você acabou de escrever.",
        inventario.texto,
        "Na resposta, em poucas linhas: diga que é uma versão web equivalente (não o projeto original executando), o que já funciona e o que ficou fora.",
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
) {
  const limpo = pedido.trim();
  let intencao = classificarPedido(limpo);
  const confirmacao =
    /^(?:sim|isso|pode|pode sim|pode fazer|fa[çc]a|manda|vamos|beleza|ok|claro|quero|bora|continue|continua|crie|vai|criar|execute)[.!\s]*$/i.test(
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
      pedidoEfetivo: `O usuário relatou: "${limpo}".\nContexto do projeto solicitado: "${alvo.slice(0, 2000)}".\n\nATENÇÃO CRÍTICA OBRIGATÓRIA: A prévia do projeto ainda está vazia ou sem os arquivos executáveis. Você DEVE GERAR E ENTREGAR AGORA TODOS OS ARQUIVOS COMPLETOS dentro das tags <arquivo nome="index.html">...</arquivo>, <arquivo nome="style.css">...</arquivo>, <arquivo nome="app.js">...</arquivo>. É terminantemente proibido responder apenas com texto explicativo ou promessas sem as tags <arquivo> completas!`,
      intencao: "alterar" as IntencaoPedido,
      continuacao: true,
    };
  }

  if (confirmacao && intencao === "conversar") {
    if (!ofereceuAcao && !queixaPrevia) {
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

/** Separa leitura, alteração e tentativa de abrir antes de chamar qualquer IA. */
export function classificarPedido(pedido: string): IntencaoPedido {
  // Pergunta aberta ("dá pra fazer X?", "o que você sugere?") é consulta, não ordem de mudar código.
  const pergunta = /\?\s*$/.test(pedido.trim());
  const consulta =
    /\b(d[aá] pra|d[aá] para|é poss[íi]vel|posso|consigo|vale a pena|o que (?:voc[êe] )?(?:sugere|acha|recomenda)|qual (?:a )?melhor|por que|deveria|faz sentido|como fa[çc]o|serve pra)\b/i;
  if (pergunta && consulta.test(pedido)) return "conversar";
  // "recrie", "traga igual", "faça a versão web": construir equivalente web da referência.
  const recriar =
    /\b(recri[ea]|recriar|reconstru[ai]|reproduz[ai]|clon(?:e|ar)|refa[çc]a\s+igual|traga\s+igual|deixa\s+igual|igual\s+ao\s+(?:original|projeto)|vers[ãa]o\s+web|em\s+vers[ãa]o\s+web|como\s+(?:app|aplica[çc][ãa]o)\s+web)\b/i;
  if (recriar.test(pedido)) return "recriar";
  // "ponha na prévia", "traga do workspace": também é construir a versão web.
  const trazerParaPrevia =
    /\b(traga|trazer|traz|puxe|puxa|p[oõ]e|ponha|coloca|coloque|joga|jogue|bota|monte)\b[^.!?]{0,40}\b(pr[eé]via|previa|workspace|tela|navegador|no\s+ar)\b/i;
  if (trazerParaPrevia.test(pedido)) return "recriar";
  const alteracao =
    /\b(cri[ea]|criar|fa[çc]a|fazer|monte|construa|adicione|implemente|integre|conecte|corrija|conserte|arrume|altere|mude|troque|remova|exclua|atualize|refa[çc]a|melhore|transforme|desenvolva|gere)\b/i;
  if (alteracao.test(pedido)) return "alterar";
  if (
    /\b(analise|analisar|audite|auditoria|descreva|explique|entenda|estude|revise|para que serve|como funciona|estrutura)\b/i.test(
      pedido,
    )
  ) {
    return "analisar";
  }
  if (
    /\b(abra|abrir|rode|rodar|execute|executar|teste|testar|pr[eé]via|visualize)\b/i.test(pedido)
  ) {
    return "abrir";
  }
  return "conversar";
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

export function extrairArquivos(
  resposta: string,
): {
  arquivos: Record<string, string>;
  texto: string;
  patchParcialIgnorado?: boolean;
} {
  const modifier = new CodeModifier();
  const arquivosExtraidos = modifier.extrairArquivosCompletos(resposta);

  // Extrai tags para limpar o texto de resposta
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

  const m2 = PADRAO_CODIGO_ANTIGO.exec(resposta);
  if (m2) {
    const texto2 = limparPensamento(
      resposta.slice(0, m2.index) + resposta.slice(m2.index + m2[0].length),
    );
    return {
      arquivos: { "index.html": (m2[1] ?? "").trim() },
      texto: texto2 || "Projeto atualizado! Veja a prévia ao lado.",
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

  // 1. Detecção de perfil / avatar / pessoa / amigo / usuário
  if (
    /\b(perfil|avatar|foto de perfil|usuario|usuário|user|profile|person|pessoa|amigo|amiga|friend|membro|member|author|autor|avatar de|foto de|homem|mulher|garoto|garota)\b/i.test(
      dLower,
    )
  ) {
    const ehMulher = /\b(mulher|garota|menina|woman|girl|amiga|female)\b/i.test(dLower);
    const ehHomem = /\b(homem|garoto|menino|man|boy|amigo|male)\b/i.test(dLower);
    const sujeito = ehMulher
      ? "young brazilian woman"
      : ehHomem
        ? "young brazilian man"
        : "smiling brazilian person";
    return `portrait photo of a ${sujeito}, headshot profile picture, warm friendly smile, soft natural studio lighting, neutral aesthetic background, authentic sharp photography, 8k`;
  }

  // 2. Detecção de rede social / Orkut / comunidade / mensagens / WhatsApp
  if (
    /\b(orkut|comunidade|community|depoimento|scrapbook|social network|rede social)\b/i.test(dLower)
  ) {
    return "early 2000s vintage social network community header banner, colorful retro aesthetic, clean digital illustration, high quality graphic design";
  }

  if (/\b(whatsapp|chat|mensagem|conversa|mensagens)\b/i.test(dLower)) {
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

  // 5. Se o prompt for curto (< 4 palavras) ou em português, enriquece com o contexto
  const palavras = d.split(/\s+/).filter(Boolean);
  if (palavras.length < 4 || /[áàâãéêíóôõúç]/i.test(d)) {
    const ctx = contextoProjeto ? `, contextual for ${contextoProjeto.slice(0, 60)}` : "";
    return `high quality detailed photography of ${d}${ctx}, professional studio lighting, realistic, 8k resolution, crisp clean focus`;
  }

  return d;
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
      "⚡ **FabyCloud Plugins & Slash Commands (estilo Claude Code):**",
      "",
      "- `/ajuda` ou `/help`: Exibe esta central de plugins e comandos.",
      "- `/imagem <descrição>`: Gera uma imagem de alta definição para o projeto.",
      "- `/arvore` ou `/graphify`: Mostra a árvore viva do VFS e tamanho dos arquivos.",
      "- `/revisar`: Executa a auditoria em tempo real de links, botões e integridade.",
      "- `/banco [coleção]`: Inspeciona os dados da coleção no banco hospedado.",
      "- `/limpar`: Instrução de limpeza de conversa mantendo os arquivos intactos.",
      "",
      "💡 *Dica: Você também pode digitar qualquer pedido livre de desenvolvimento full-stack.*",
    ].join("\n");
    return { executou: true, resposta };
  }

  if (cmd === "imagem" || cmd === "image" || cmd === "foto") {
    if (!args) {
      return {
        executou: true,
        resposta: "⚠️ Especifique o que deseja na imagem. Exemplo: `/imagem pessoa sorrindo estilo retro`",
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

/** Distingue conversa de um pedido que obrigatoriamente precisa alterar arquivos. */
export function pedidoExigeArquivos(pedido: string) {
  const intencao = classificarPedido(pedido);
  // Recriar sempre precisa terminar em arquivos: é o pedido de "traga igual, quero ver funcionando".
  if (intencao === "recriar") return true;
  if (intencao !== "alterar") return false;
  const acao =
    /\b(cri[ea]|criar|fa[çc]a|fazer|monte|construa|adicione|implemente|integre|conecte|corrija|conserte|arrume|altere|mude|troque|remova|exclua|atualize|refa[çc]a|melhore|transforme|desenvolva|gere)\b/i;
  const alvo =
    /\b(site|sistema|app|aplicativo|projeto|c[oó]digo|arquivo|html|css|javascript|script|bot[aã]o|link|menu|navega[çc][aã]o|frontend|backend|servidor|api|banco|sql|login|cadastro|tela|p[aá]gina|modal|formul[aá]rio)\b/i;
  const exigencia =
    /\b(nenhum|nada)\b.{0,35}\b(fake|falso|quebrado|parado)|\b(precisa|tem que|deve)\b.{0,50}\b(funcionar|abrir|salvar|navegar|conectar)/i;
  // Ordem curta e direta ("corrija", "melhore", "arrume isso") não cita alvo, mas
  // é ordem de mexer no projeto: aceitar só texto aqui era o falso sucesso clássico.
  const curto = pedido.trim().split(/\s+/).length <= 6;
  if (curto && acao.test(pedido)) return true;
  return alvo.test(pedido) && (acao.test(pedido) || exigencia.test(pedido));
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
    /falta o arquivo|aponta para|não foi entregue|não carrega|backend foi citado|falta o backend|falta o arquivo \.sql|falta o arquivo de conexão|não chama a api|nenhuma chamada fetch|nada é gravado no banco|em vez de gravar no banco|não existe no javascript|não existe no html|botão sem ação|arquivo vazio|arquivo .*incompleto|trecho omitido/i.test(
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
  const mortos = [...todoHtml.matchAll(/<a\b[^>]*href=(["'])\s*(?:#|javascript:void\(0\))\s*\1/gi)];
  if (mortos.length > 2) {
    problemas.push(`Existem ${mortos.length} links sem destino real (href="#").`);
  }
  if (/em breve|coming soon|lorem ipsum|TODO\b/i.test(todoHtml)) {
    problemas.push('O projeto tem texto de rascunho ("em breve", "lorem ipsum" ou "TODO").');
  }

  // 4b. Cada botão precisa estar ligado a formulário ou a uma ação no JavaScript.
  const todosBotoesLigados =
    /querySelector(?:All)?\(\s*(["'`])button(?:\[[^"'`]+\])?\1\s*\)[\s\S]{0,180}addEventListener/i.test(
      js,
    ) ||
    // Delegação de eventos: um listener no documento/body cuidando de todos os cliques.
    /(?:document|document\.body|window)\.addEventListener\(\s*(["'`])click\1[\s\S]{0,400}closest\(/i.test(
      js,
    ) ||
    /getElementsByTagName\(\s*(["'`])button\1\s*\)[\s\S]{0,180}addEventListener/i.test(js);
  for (const m of todoHtml.matchAll(/<button\b([^>]*)>/gi)) {
    const attrs = m[1] ?? "";
    if (
      todosBotoesLigados ||
      /\btype\s*=\s*(["'])submit\1/i.test(attrs) ||
      /\bonclick\s*=/i.test(attrs)
    )
      continue;
    const id = attrs.match(/\bid\s*=\s*(["'])([^"']+)\1/i)?.[2];
    const classes = (attrs.match(/\bclass\s*=\s*(["'])([^"']+)\1/i)?.[2] ?? "")
      .split(/\s+/)
      .filter(Boolean);
    const dados = [...attrs.matchAll(/\bdata-([\w-]+)(?:\s*=\s*(["'])([^"']*)\2)?/gi)];
    const ligadoPorId = id
      ? new RegExp(
          `(?:getElementById\\(\\s*["'\\x60]${escapeRegex(id)}["'\\x60]|querySelector(?:All)?\\(\\s*["'\\x60]#${escapeRegex(id)}["'\\x60])`,
        ).test(js)
      : false;
    const ligadoPorClasse = classes.some((classe) =>
      new RegExp(
        `querySelector(?:All)?\\(\\s*["'\\x60][^"'\\x60]*\\.${escapeRegex(classe)}(?:[.#:[\\s>]|["'\\x60])`,
      ).test(js),
    );
    const ligadoPorDado = dados.some((dado) => {
      const chave = dado[1] ?? "";
      const propriedade = chave.replace(/-([a-z])/g, (_todo, letra: string) => letra.toUpperCase());
      return new RegExp(
        `(?:dataset\\.${escapeRegex(propriedade)}|data-${escapeRegex(chave)})`,
      ).test(js);
    });
    if (!ligadoPorId && !ligadoPorClasse && !ligadoPorDado) {
      const depois = todoHtml.slice(m.index + m[0].length);
      const rotulo = (depois.match(/^\s*(?:<[^>]+>\s*)*([^<]{1,50})/i)?.[1] ?? "").trim();
      problemas.push(`Há um botão sem ação verificável${rotulo ? ` ("${rotulo}")` : ""}.`);
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
