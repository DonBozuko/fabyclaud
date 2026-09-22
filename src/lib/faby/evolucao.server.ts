/**
 * Motor de auto-evolução: o sistema define metas objetivas para cada pedido,
 * confere os arquivos entregues contra essas metas, dá nota e, quando a nota
 * não chega no objetivo, devolve um "puxão de orelha" para outra IA gratuita
 * tentar de novo — sempre com a lista exata do que faltou.
 */
import {
  auditarArquivos,
  pedidoExigeAutenticacaoPrivada,
  problemasDeAutenticacao,
  problemasCriticos,
  problemasDeBanco,
} from "./builder.server";
import { usaBancoHospedado } from "./nuvem";
import { classificarPreview } from "./preview";
import { pedidoUsaReferenciaVisual, problemasImgToHtml } from "./img-to-html.server";

export type Meta = {
  id: string;
  titulo: string;
  falha: string | null;
};

export type Avaliacao = {
  nota: number;
  metas: Meta[];
  falhas: string[];
  atingiuObjetivo: boolean;
};

const TETO_TENTATIVAS = 3;
export const OBJETIVO_NOTA = 100;
export { TETO_TENTATIVAS };

function juntar(arquivos: Record<string, string>) {
  return Object.entries(arquivos)
    .filter(([nome]) => !nome.startsWith("enviados/") && !nome.startsWith("originais/"))
    .map(([, conteudo]) => conteudo)
    .join("\n");
}

function paginaInicial(arquivos: Record<string, string>) {
  return (
    Object.keys(arquivos).find((n) => /^index\.html?$/i.test(n)) ??
    Object.keys(arquivos).find((n) => /\.html?$/i.test(n) && !n.includes("/"))
  );
}

/** Metas verificáveis para este pedido — nada de nota subjetiva. */
export function avaliarEntrega(
  arquivos: Record<string, string>,
  opcoes: { exigeBackend: boolean; pedido: string; imagensEnviadas: string[] },
): Avaliacao {
  const codigo = juntar(arquivos);
  const problemas = [
    ...auditarArquivos(arquivos),
    ...problemasImgToHtml(arquivos, opcoes.pedido, opcoes.imagensEnviadas),
  ];
  const graves = problemasCriticos(problemas);
  const inicial = paginaInicial(arquivos);
  const metas: Meta[] = [];
  const preview = classificarPreview(arquivos);

  metas.push({
    id: "entrada",
    titulo: "tem uma página que abre sozinha no navegador",
    falha: inicial ? null : "nenhum arquivo .html na raiz para abrir a prévia",
  });

  metas.push({
    id: "execucao-preview",
    titulo: "a prévia executa a entrega sem depender de um servidor ausente",
    falha: preview.estado === "funcionando" ? null : preview.motivo,
  });

  if (/\bcalculadora\b/i.test(opcoes.pedido)) {
    const temNumeros = /data-value=["'][0-9]/i.test(codigo);
    const temOperacoes = ["+", "-", "*", "/"].every(
      (operador) =>
        codigo.includes(`data-value="${operador}"`) || codigo.includes(`data-value='${operador}'`),
    );
    const temCalculo = /function\s+(calculate|calcular)|const\s+(calculate|calcular)\s*=/i.test(
      codigo,
    );
    const temEventos = /addEventListener\s*\(/.test(codigo);
    metas.push({
      id: "calculadora-real",
      titulo: "a calculadora tem números, quatro operações e cálculo interativo",
      falha:
        temNumeros && temOperacoes && temCalculo && temEventos
          ? null
          : "faltam teclas numéricas, as quatro operações ou o JavaScript que calcula de verdade",
    });
  }

  const incompletos = Object.entries(arquivos)
    .filter(([, c]) => /\[(?:conte[úu]do|restante)[^\]]*omitid/i.test(c))
    .map(([n]) => n);
  metas.push({
    id: "completos",
    titulo: "todos os arquivos vieram completos",
    falha: incompletos.length ? `arquivos entregues pela metade: ${incompletos.join(", ")}` : null,
  });

  const falsas = problemas.filter((p) =>
    /botão sem ação|link interno|links sem destino|href=["']?#|não existe no javascript|não existe no html|não entregue|função.*não existe/i.test(
      p,
    ),
  );
  metas.push({
    id: "acoes",
    titulo: "nenhum botão, link ou referência falsa",
    falha: falsas.length ? falsas.slice(0, 6).join("; ") : null,
  });

  const inicialHtml = inicial ? (arquivos[inicial] ?? "") : "";
  const temLinkCss = /<link[^>]+(?:rel=["']stylesheet["']|href=["'][^"']+\.css["'])/i.test(
    inicialHtml,
  );
  const temTagStyle = /<style[\s>][\s\S]{80,}<\/style>/i.test(inicialHtml);
  const temArquivoCss = Object.keys(arquivos).some(
    (n) => n.endsWith(".css") && (arquivos[n] ?? "").trim().length > 80,
  );
  const temEstilo =
    temTagStyle ||
    (temLinkCss && temArquivoCss) ||
    (temArquivoCss && !inicialHtml.includes("<style>"));

  metas.push({
    id: "estilo",
    titulo: "a página carrega design e estilo CSS ricos",
    falha:
      !inicial || temEstilo
        ? null
        : "a página inicial está sem estilos CSS ou sem link para o arquivo .css",
  });

  const htmlTotal = Object.entries(arquivos)
    .filter(([n]) => /\.html?$/i.test(n))
    .map(([, c]) => c)
    .join("\n");
  const tamanhoHtml = htmlTotal.replace(/<!--[\s\S]*?-->/g, "").trim().length;
  const tagsEstruturais = (
    htmlTotal.match(
      /<(?:header|main|section|article|nav|aside|footer|form|div|ul|ol|table|video|audio|canvas)\b/gi,
    ) || []
  ).length;
  const temSubstancia = !inicial || (tamanhoHtml >= 250 && tagsEstruturais >= 2);

  metas.push({
    id: "substancia",
    titulo:
      "a interface tem estrutura rica e componentes reais (não é apenas um título ou esqueleto vazio)",
    falha: temSubstancia
      ? null
      : "a aplicação entregue é apenas um esqueleto vazio sem componentes, cards ou estrutura visual completa",
  });

  if (pedidoUsaReferenciaVisual(opcoes.pedido, opcoes.imagensEnviadas)) {
    const visual = problemasImgToHtml(arquivos, opcoes.pedido, opcoes.imagensEnviadas);
    metas.push({
      id: "img-to-html",
      titulo: "a referência visual foi preservada com estrutura e controles funcionais",
      falha: visual.length ? visual.slice(0, 4).join("; ") : null,
    });
  }

  if (opcoes.exigeBackend) {
    const faltasBanco = problemasDeBanco(arquivos);
    metas.push({
      id: "banco",
      titulo: "grava de verdade no banco hospedado",
      falha: faltasBanco.length ? faltasBanco.slice(0, 5).join("; ") : null,
    });
    const pediuEditar = /\b(editar|alterar|atualizar|apagar|excluir|remover|deletar)\b/i.test(
      opcoes.pedido,
    );
    if (pediuEditar) {
      const temEscritas =
        /method:\s*["'`]put/i.test(codigo) && /method:\s*["'`]delete/i.test(codigo);
      metas.push({
        id: "crud",
        titulo: "editar e apagar chegam ao banco",
        falha: temEscritas
          ? null
          : "faltam chamadas PUT (editar) e/ou DELETE (apagar) no JavaScript",
      });
    }
  }

  if (pedidoExigeAutenticacaoPrivada(opcoes.pedido)) {
    const falhasAuth = problemasDeAutenticacao(arquivos);
    metas.push({
      id: "auth-privada",
      titulo: "cadastro, login e sessão usam a autenticação privada real",
      falha: falhasAuth.length ? falhasAuth.join("; ") : null,
    });
  }

  if (opcoes.imagensEnviadas.length) {
    const usou = opcoes.imagensEnviadas.some((caminho) => codigo.includes(caminho));
    metas.push({
      id: "imagem",
      titulo: "a imagem enviada aparece de verdade no código",
      falha: usou ? null : `nenhum arquivo usa ${opcoes.imagensEnviadas.join(" ou ")}`,
    });
  }

  const falhas = metas.filter((m) => m.falha).map((m) => `${m.titulo}: ${m.falha}`);

  // Qualquer item detectado pela conferência automática DEVE reduzir a nota e impedir o "100/100"
  if (problemas.length > 0) {
    for (const p of problemas) {
      if (!falhas.some((f) => f.includes(p))) {
        falhas.push(`conferência de arquivos: ${p}`);
      }
    }
  }

  const cumpridas = metas.filter((m) => !m.falha).length;
  let nota = metas.length ? Math.round((cumpridas / metas.length) * 100) : 100;
  if (problemas.length > 0) {
    nota = Math.min(nota, Math.max(50, 100 - problemas.length * 10));
  }

  // Objetivo atingido se todas as metas principais foram cumpridas e não há problemas graves
  return {
    nota,
    metas,
    falhas,
    atingiuObjetivo: metas.every((m) => !m.falha) && graves.length === 0,
  };
}

/** Puxão de orelha: a IA recebe a nota, o que faltou e o que não pode repetir. */
export function promptPuxaoDeOrelha(args: {
  pedido: string;
  tentativa: number;
  avaliacao: Avaliacao;
  arquivos: Record<string, string>;
  exigeBackend: boolean;
  tentativasAnteriores: string[];
}) {
  const blocos = Object.entries(args.arquivos)
    .map(([n, c]) => `<arquivo nome="${n}">\n${c.slice(0, 18000)}\n</arquivo>`)
    .join("\n\n");
  return [
    `PUXÃO DE ORELHA — tentativa ${args.tentativa} de ${TETO_TENTATIVAS}.`,
    `Sua entrega anterior tirou nota ${args.avaliacao.nota} de 100 na conferência automática e por isso NÃO foi entregue ao usuário. Nota abaixo de ${OBJETIVO_NOTA} é reprovação.`,
    `Metas que você não cumpriu (corrija TODAS, uma por uma):\n${args.avaliacao.falhas
      .map((f, i) => `${i + 1}. ${f}`)
      .join("\n")}`,
    args.tentativasAnteriores.length
      ? `Abordagens que já falharam e não podem ser repetidas:\n${args.tentativasAnteriores
          .map((t) => `- ${t}`)
          .join("\n")}`
      : "",
    "REGRA CRÍTICA DE QUALIDADE E DESIGN:",
    "- PRESERVE TODO O DESIGN, CSS, CORES, LAYOUT E COMPONENTES VISUAIS DO PROJETO.",
    "- NUNCA devolva um HTML cru, sem estilos ou simplificado demais para tentar cumprir metas.",
    "- Devolva TODOS os arquivos completos (index.html, styles.css, app.js) com interface polida e funcional.",
    args.exigeBackend
      ? 'Dados salvos usam o banco real já hospedado: const API = "%%FABY_API%%" com fetch GET (listar), POST (criar), PUT ?id= (editar) e DELETE ?id= (apagar). Proibido localStorage como banco e proibido criar pasta backend/.'
      : "",
    "Não explique, não prometa, não peça contexto e não diga que já está pronto.",
    'Devolva os arquivos inteiros e funcionais no formato <arquivo nome="...">conteúdo completo</arquivo>.',
    `--- Pedido original ---\n${args.pedido.slice(0, 3000)}`,
    `--- Arquivos atuais ---\n${blocos}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Frases da IA que os arquivos não sustentam — para não deixar mentira passar. */
export function afirmacoesSemProva(
  texto: string,
  arquivos: Record<string, string>,
  avaliacao: Avaliacao,
) {
  const codigo = juntar(arquivos);
  const avisos: string[] = [];
  const diz = (re: RegExp) => re.test(texto);

  if (
    diz(
      /banco de dados (?:real|de verdade)|salv[oa]s? de verdade|persistid|conectad[oa] ao banco/i,
    ) &&
    !usaBancoHospedado(codigo)
  ) {
    avisos.push(
      "os arquivos não fazem nenhuma chamada ao banco hospedado, então nada é salvo de verdade",
    );
  }
  if (
    diz(/todos os bot[õo]es|nenhum bot[ãa]o (?:fake|falso)|tudo funcion/i) &&
    avaliacao.metas.some((m) => m.id === "acoes" && m.falha)
  ) {
    avisos.push("ainda existem botões ou links sem ação real no JavaScript");
  }
  if (
    diz(/troquei a imagem|imagem (?:foi )?atualizada|nova foto/i) &&
    avaliacao.metas.some((m) => m.id === "imagem" && m.falha)
  ) {
    avisos.push("a imagem enviada não foi usada em nenhum arquivo");
  }
  if (diz(/servidor (?:est[áa]|foi) rodando|npm run dev j[áa]|python .*rodando aqui/i)) {
    avisos.push("aqui não existe terminal: nenhum servidor Python ou Node está em execução");
  }
  return avisos;
}

/** Bloco final honesto: nota, metas cumpridas e o que ficou faltando. */
export function resumoEvolucao(avaliacao: Avaliacao, tentativas: number, autores: string[]) {
  const cumpridas = avaliacao.metas.filter((m) => !m.falha);
  const linhas = [
    ...cumpridas.map((m) => `- ok: ${m.titulo}`),
    ...avaliacao.metas.filter((m) => m.falha).map((m) => `- falta: ${m.titulo} (${m.falha})`),
  ].join("\n");
  const equipe = autores.filter(Boolean).length ? `\nRodadas: ${autores.join(" → ")}` : "";
  return `\n\n---\n**Conferência dos arquivos: ${avaliacao.nota}/100 em ${tentativas} tentativa(s)**\n${linhas}${equipe}\nEsta nota cobre arquivos e verificações automáticas; não substitui um teste humano completo de todos os fluxos.`;
}
