import type { CodeEdit } from "./types";

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
}

export default CodeModifier;
