import type {
  AlteracaoProjeto,
  CodeEdit,
  ModificacaoArquivo,
  PatchArquivo,
  PatchChunk,
} from "./types";

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
   * Aplica um patch cirúrgico (substituição de trecho de/para) em um arquivo de texto.
   * Suporta normalização de quebras de linha e tolerância a espaçamento.
   */
  public aplicarPatchEmTexto(
    conteudoOriginal: string,
    chunks: PatchChunk[],
  ): { conteudo: string; sucessos: number; falhas: number } {
    let resultado = conteudoOriginal;
    let sucessos = 0;
    let falhas = 0;

    for (const chunk of chunks) {
      const de = chunk.de;
      const para = chunk.para;

      if (!de.trim()) continue;

      // 1. Tentativa exata
      if (resultado.includes(de)) {
        resultado = resultado.replace(de, para);
        sucessos += 1;
        continue;
      }

      // 2. Normalização CRLF -> LF
      const deLF = de.replace(/\r\n/g, "\n");
      const resLF = resultado.replace(/\r\n/g, "\n");
      if (resLF.includes(deLF)) {
        resultado = resLF.replace(deLF, para.replace(/\r\n/g, "\n"));
        sucessos += 1;
        continue;
      }

      // 3. Normalização de espaçamento nas pontas das linhas
      const linhasDe = deLF.split("\n").map((l) => l.trimEnd()).join("\n");
      const linhasRes = resultado.split("\n").map((l) => l.trimEnd()).join("\n");
      if (linhasRes.includes(linhasDe)) {
        resultado = linhasRes.replace(linhasDe, para.replace(/\r\n/g, "\n"));
        sucessos += 1;
        continue;
      }

      // 4. Se não encontrou o bloco exato, busca por proximidade ou marca falha
      falhas += 1;
    }

    return { conteudo: resultado, sucessos, falhas };
  }

  /**
   * Aplica uma alteração completa no projeto (arquivos novos, patches cirúrgicos e remoções).
   */
  public aplicarAlteracaoProjeto(
    arquivosAtuais: Record<string, string>,
    alteracao: AlteracaoProjeto,
  ): {
    arquivos: Record<string, string>;
    modificados: string[];
    criados: string[];
    removidos: string[];
    patchesAplicados: number;
    patchesFalhados: number;
  } {
    const copia: Record<string, string> = { ...arquivosAtuais };
    const criados: string[] = [];
    const modificados: string[] = [];
    const removidos: string[] = [];
    let patchesAplicados = 0;
    let patchesFalhados = 0;

    // 1. Arquivos completos novos ou sobrescritos
    for (const [caminho, conteudo] of Object.entries(alteracao.arquivosNovosOuCompletos)) {
      if (copia[caminho] !== undefined) {
        if (!modificados.includes(caminho)) modificados.push(caminho);
      } else {
        if (!criados.includes(caminho)) criados.push(caminho);
      }
      copia[caminho] = conteudo;
    }

    // 2. Patches cirúrgicos em arquivos existentes
    for (const patch of alteracao.patches) {
      const conteudoExistente = copia[patch.caminho];
      if (conteudoExistente !== undefined) {
        const patchRes = this.aplicarPatchEmTexto(conteudoExistente, patch.chunks);
        copia[patch.caminho] = patchRes.conteudo;
        patchesAplicados += patchRes.sucessos;
        patchesFalhados += patchRes.falhas;
        if (!modificados.includes(patch.caminho)) modificados.push(patch.caminho);
      } else {
        // Se o arquivo não existia, junta os blocos 'para' como novo arquivo
        const conteudoNovo = patch.chunks.map((c) => c.para).join("\n");
        copia[patch.caminho] = conteudoNovo;
        if (!criados.includes(patch.caminho)) criados.push(patch.caminho);
      }
    }

    // 3. Arquivos removidos
    for (const caminho of alteracao.arquivosRemovidos) {
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
      patchesAplicados,
      patchesFalhados,
    };
  }

  /**
   * Sanitiza e normaliza o código (quebras de linha e espaçamento).
   */
  public sanitizarCodigo(codigo: string): string {
    return codigo.replace(/\r\n/g, "\n").trim();
  }
}

export default CodeModifier;
