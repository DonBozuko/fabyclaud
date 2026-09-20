import type { AlteracaoProjeto, CodeEdit, ModificacaoArquivo } from "./types";

/**
 * Escritor de arquivos do FabyClaud.
 *
 * REGRA ÚNICA: escrita física destrutiva e completa.
 * Não existe substituição parcial de texto, patch de diff, nem heurística de
 * busca/troca por Regex dentro do conteúdo dos arquivos. Todo arquivo entregue
 * pela IA sobrescreve o antigo de ponta a ponta.
 */
export class CodeModifier {
  /**
   * Extrai arquivos 100% completos da resposta da IA.
   * Formatos aceitos:
   * 1. <arquivo nome="..."> ... </arquivo> e <file path="..."> ... </file>
   * 2. JSON estruturado { "files": [{ "path": ..., "content": ... }] }
   * 3. Bloco markdown com anotação de caminho
   */
  public extrairArquivosCompletos(resposta: string): Record<string, string> {
    const arquivos: Record<string, string> = {};

    if (!resposta || !resposta.trim()) return arquivos;

    const padraoArquivoXml =
      /<(?:arquivo\s+nome|file\s+path)=(["'])(.*?)\1\s*>\n?([\s\S]*?)(?:<\/\s*(?:arquivo|file|arquivos|files)\s*>|(?=<(?:arquivo\s+nome|file\s+path)=)|$)/gi;

    let mXml: RegExpExecArray | null;
    while ((mXml = padraoArquivoXml.exec(resposta)) !== null) {
      const nome = (mXml[2] ?? "").trim();
      const conteudo = (mXml[3] ?? "").trim();
      if (nome && conteudo) {
        arquivos[nome] = conteudo;
      }
    }

    if (Object.keys(arquivos).length > 0) {
      return arquivos;
    }

    const padraoJson = /```(?:json)?\s*\n([\s\S]*?)\n```/gi;
    let mJson: RegExpExecArray | null;
    while ((mJson = padraoJson.exec(resposta)) !== null) {
      try {
        const parsed = JSON.parse(mJson[1] ?? "");
        if (parsed && typeof parsed === "object") {
          const lista = Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as { files?: unknown[] }).files)
              ? ((parsed as { files: unknown[] }).files as unknown[])
              : null;

          if (lista) {
            for (const bruto of lista) {
              const item = bruto as Record<string, unknown>;
              const caminho = (item["path"] ||
                item["caminho"] ||
                item["filePath"] ||
                item["file"]) as string | undefined;
              const conteudo = (item["content"] || item["conteudo"] || item["code"]) as
                string | undefined;
              if (caminho && typeof conteudo === "string") {
                arquivos[caminho] = conteudo;
              }
            }
          } else {
            for (const [caminho, conteudo] of Object.entries(parsed)) {
              if (
                typeof conteudo === "string" &&
                (caminho.includes("/") || caminho.includes("."))
              ) {
                arquivos[caminho] = conteudo;
              }
            }
          }
        }
      } catch {
        // Ignora blocos json que não sejam de arquivos
      }
    }

    if (Object.keys(arquivos).length > 0) {
      return arquivos;
    }

    const padraoMarkdownBloco =
      /```(?:[a-zA-Z0-9_-]+)?\s*(?:file=["']?([^\s\n"']+)["']?|\/\/\s*(?:file|path|filepath):\s*([^\s\n]+))\n([\s\S]*?)```/gi;

    let mMd: RegExpExecArray | null;
    while ((mMd = padraoMarkdownBloco.exec(resposta)) !== null) {
      const caminho = (mMd[1] || mMd[2] || "").trim();
      const conteudo = (mMd[3] ?? "").trim();
      if (caminho && conteudo) {
        arquivos[caminho] = conteudo;
      }
    }

    return arquivos;
  }

  /**
   * Substitui inteiramente os arquivos antigos pelos novos (escrita destrutiva).
   */
  public aplicarArquivosCompletos(
    arquivosAtuais: Record<string, string>,
    novosArquivos: Record<string, string>,
  ): Record<string, string> {
    return {
      ...arquivosAtuais,
      ...novosArquivos,
    };
  }

  /**
   * Escreve fisicamente os arquivos em disco com Bun.write (fallback node:fs),
   * criando subpastas e sobrescrevendo o arquivo antigo de ponta a ponta.
   */
  public async gravarEmDisco(
    diretorioRaiz: string,
    arquivos: Record<string, string>,
  ): Promise<{ sucesso: boolean; gravados: string[]; erros: string[] }> {
    const gravados: string[] = [];
    const erros: string[] = [];

    const bun = (globalThis as { Bun?: { write?: (p: string, c: string) => Promise<number> } }).Bun;
    const usarBun = typeof bun?.write === "function";

    for (const [caminhoRelativo, conteudo] of Object.entries(arquivos)) {
      try {
        const pathNormalizado = caminhoRelativo.replace(/\\/g, "/");
        const caminhoCompleto = `${diretorioRaiz.replace(/[\\/]$/, "")}/${pathNormalizado}`;

        const partes = caminhoCompleto.split("/");
        partes.pop();
        const pastaPai = partes.join("/");

        const fs = await import("node:fs/promises");
        if (pastaPai) {
          await fs.mkdir(pastaPai, { recursive: true }).catch(() => {});
        }

        if (usarBun && bun?.write) {
          await bun.write(caminhoCompleto, conteudo);
        } else {
          await fs.writeFile(caminhoCompleto, conteudo, "utf8");
        }

        gravados.push(caminhoRelativo);
      } catch (err) {
        erros.push(
          `Falha ao gravar ${caminhoRelativo}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return {
      sucesso: erros.length === 0,
      gravados,
      erros,
    };
  }

  /** Grava (sobrescreve) um arquivo no mapa do projeto. */
  public applyEdit(currentFiles: Record<string, string>, edit: CodeEdit): Record<string, string> {
    return {
      ...currentFiles,
      [edit.filePath]: edit.content,
    };
  }

  /** Grava (sobrescreve) vários arquivos no mapa do projeto. */
  public applyEdits(
    currentFiles: Record<string, string>,
    edits: CodeEdit[],
  ): Record<string, string> {
    const updated = { ...currentFiles };
    for (const edit of edits) {
      updated[edit.filePath] = edit.content;
    }
    return updated;
  }

  /** Remove um arquivo do mapa do projeto. */
  public deleteFile(
    currentFiles: Record<string, string>,
    filePath: string,
  ): Record<string, string> {
    const updated = { ...currentFiles };
    delete updated[filePath];
    return updated;
  }

  /** Aplica modificações estruturadas (criar/atualizar/remover), sempre integrais. */
  public aplicarModificacoes(
    arquivosAtuais: Record<string, string>,
    modificacoes: ModificacaoArquivo[],
  ): Record<string, string> {
    const copia = { ...arquivosAtuais };

    for (const mod of modificacoes) {
      if (mod.acao === "remover") {
        delete copia[mod.caminho];
      } else {
        copia[mod.caminho] = mod.novoConteudo;
      }
    }

    return copia;
  }

  /**
   * Aplica uma alteração completa no projeto: apenas arquivos integrais e remoções.
   */
  public aplicarAlteracaoProjeto(
    arquivosAtuais: Record<string, string>,
    alteracao: AlteracaoProjeto,
  ): {
    arquivos: Record<string, string>;
    modificados: string[];
    criados: string[];
    removidos: string[];
  } {
    const copia: Record<string, string> = { ...arquivosAtuais };
    const criados: string[] = [];
    const modificados: string[] = [];
    const removidos: string[] = [];

    for (const [caminho, conteudo] of Object.entries(alteracao.arquivosNovosOuCompletos || {})) {
      if (copia[caminho] !== undefined) {
        if (!modificados.includes(caminho)) modificados.push(caminho);
      } else if (!criados.includes(caminho)) {
        criados.push(caminho);
      }
      copia[caminho] = conteudo;
    }

    for (const caminho of alteracao.arquivosRemovidos || []) {
      if (copia[caminho] !== undefined) {
        delete copia[caminho];
        if (!removidos.includes(caminho)) removidos.push(caminho);
      }
    }

    return {
      arquivos: copia,
      modificados,
      criados,
      removidos,
    };
  }

  /** Normaliza quebras de linha e espaçamento do código recebido. */
  public sanitizarCodigo(codigo: string): string {
    return codigo.replace(/\r\n/g, "\n").trim();
  }
}

export default CodeModifier;
