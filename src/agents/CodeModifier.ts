import type { CodeEdit, ModificacaoArquivo } from "./types";

export class CodeModifier {
  /**
   * Aplica uma alteração de código ou cria um novo arquivo dentro do mapa de arquivos do projeto.
   */
  public applyEdit(currentFiles: Record<string, string>, edit: CodeEdit): Record<string, string> {
    return {
      ...currentFiles,
      [edit.filePath]: edit.content,
    };
  }

  /**
   * Aplica múltiplas alterações de código em lote.
   */
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

  /**
   * Remove um arquivo do mapa de arquivos do projeto.
   */
  public deleteFile(
    currentFiles: Record<string, string>,
    filePath: string,
  ): Record<string, string> {
    const updated = { ...currentFiles };
    delete updated[filePath];
    return updated;
  }

  /**
   * Aplica uma lista de modificações de arquivo estruturadas.
   */
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
   * Sanitiza e normaliza o código (quebras de linha e espaçamento).
   */
  public sanitizarCodigo(codigo: string): string {
    return codigo.replace(/\r\n/g, "\n").trim();
  }
}

export default CodeModifier;
