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
  const problemas = auditarArquivos(arquivos);
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

  const falsas = graves.filter((p) =>
    /botão sem ação|link interno|não existe no javascript|não existe no html|não entregue/i.test(p),
  );
  metas.push({
    id: "acoes",
    titulo: "nenhum botão, link ou referência falsa",
    falha: falsas.length ? falsas.slice(0, 6).join("; ") : null,
  });

  const temEstilo = inicial ? /<link[^>]+\.css|<style[\s>]/i.test(arquivos[inicial] ?? "") : false;
  metas.push({
    id: "estilo",
    titulo: "a página carrega o próprio estilo",
    falha: !inicial || temEstilo ? null : "a página inicial não carrega nenhum CSS",
  });

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
  const cumpridas = metas.length - falhas.length;
  const nota = metas.length ? Math.round((cumpridas / metas.length) * 100) : 100;
  return { nota, metas, falhas, atingiuObjetivo: falhas.length === 0 };
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
