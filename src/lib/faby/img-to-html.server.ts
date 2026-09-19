/**
 * Regras do fluxo img-to-html incorporadas ao motor FabyClaud.
 *
 * O repositório de referência é uma skill, não uma biblioteca executável. Por isso
 * estas regras são aplicadas no prompt e na avaliação, sem trocar a stack do projeto.
 */

export function pedidoUsaReferenciaVisual(pedido: string, imagensEnviadas: string[] = []) {
  return (
    imagensEnviadas.length > 0 ||
    /(?:screenshot|captura|imagem|mockup|wireframe|refer[eê]ncia visual|igual ao|parecido com|recrie a tela|recriar a tela|layout da imagem)/i.test(
      pedido,
    )
  );
}

export function instrucoesImgToHtml(args: {
  pedido: string;
  imagensEnviadas?: string[];
  preservarLayout?: boolean;
}) {
  const imagens = args.imagensEnviadas ?? [];
  const preservarLayout = args.preservarLayout ?? true;
  return [
    "--- FLUXO IMG-TO-HTML (REFERÊNCIA VISUAL) ---",
    "A referência visual é um contrato de composição: preserve hierarquia, alinhamentos, espaçamentos, cores, tipografia, superfícies e responsividade antes de adicionar melhorias.",
    preservarLayout
      ? "O projeto já existe: não substitua a estrutura visual nem remova componentes funcionais. Faça alterações incrementais e mantenha classes, IDs e seletores usados pelos eventos existentes."
      : "O projeto pode receber uma estrutura visual nova, mas entregue uma tela completa e consistente.",
    "Decomponha a referência em regiões nomeadas antes de codar: chrome/navegação, fundo, conteúdo principal, cartões, mídia, formulários e estados interativos.",
    "Implemente nesta ordem: (1) fundo e superfícies completas, (2) estrutura e tipografia, (3) componentes e estados, (4) imagens/ícones, (5) revisão integrada. Não deixe um fundo essencial como placeholder.",
    "Mantenha textos e controles como HTML acessível. Use CSS para formas, cores, gradientes e espaçamento; use imagens somente quando agregarem conteúdo visual real.",
    "Todo botão precisa ter uma ação observável, todo link precisa de destino válido e todo formulário precisa de validação e feedback de sucesso/erro. Não use alertas ou placeholders como única implementação de uma função pedida.",
    "Ao editar um projeto existente, compare a entrega com o estado anterior: preserve comportamento, layout e conteúdo que não fazem parte do pedido. Não reescreva arquivos sem necessidade.",
    imagens.length
      ? `Imagens de referência disponíveis no VFS: ${imagens.join(", ")}. Use os caminhos exatamente quando a imagem for conteúdo do projeto; não diga que usou uma imagem sem referenciá-la no arquivo entregue.`
      : "Se não houver imagem anexada, use a descrição do pedido como referência e não invente que comparou com uma captura.",
    `Pedido visual recebido: ${args.pedido.slice(0, 1800)}`,
  ].join("\n");
}

export function problemasImgToHtml(
  arquivos: Record<string, string>,
  pedido: string,
  imagensEnviadas: string[] = [],
) {
  if (!pedidoUsaReferenciaVisual(pedido, imagensEnviadas)) return [];
  const nomes = Object.keys(arquivos).filter(
    (nome) => !nome.startsWith("originais/") && !nome.startsWith("enviados/"),
  );
  const codigo = nomes.map((nome) => arquivos[nome] ?? "").join("\n");
  const problemas: string[] = [];
  const html = nomes.find((nome) => /\.html?$/i.test(nome));
  const css = nomes.find((nome) => /\.css$/i.test(nome));
  const js = nomes.find((nome) => /\.(?:js|mjs|cjs)$/i.test(nome));
  if (!html) problemas.push("a referência visual não recebeu uma página HTML de entrada");
  if (!css && !/<style[\s>]/i.test(codigo))
    problemas.push("a referência visual não recebeu estilos CSS");
  if (!js && /<button\b|<form\b|onclick\s*=/i.test(codigo)) {
    problemas.push(
      "há controles na referência visual sem um arquivo JavaScript para comportamento",
    );
  }
  if (/<(?:button|a)\b[^>]*>\s*(?:bot[aã]o|clique|a[çc][ãa]o|link)\s*</i.test(codigo)) {
    problemas.push("há controles genéricos que parecem placeholders em vez de ações de produto");
  }
  if (imagensEnviadas.length && !imagensEnviadas.some((imagem) => codigo.includes(imagem))) {
    problemas.push("a imagem enviada não foi referenciada na entrega");
  }
  return problemas;
}

export function preservarLayoutImgToHtml(pedido: string) {
  return !/(?:refa[çc]a|reconstrua do zero|substitua todo|novo layout|mude completamente)/i.test(
    pedido,
  );
}
