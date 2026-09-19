import type {
  AlteracaoProjeto,
  CodeEdit,
  ModificacaoArquivo,
  PatchChunk,
} from "./types";

export class CodeModifier {
  /**
   * Extrai arquivos completos da resposta da IA.
   * Suporta:
   * 1. Tags XML: <arquivo nome="...">...</arquivo> e <file path="...">...</file>
   * 2. JSON estruturado: { "files": [{ "path": "...", "content": "..." }] } ou [{ "caminho": "...", "conteudo": "..." }]
   * 3. Blocos de código markdown com indicação de caminho.
   */
  public extrairArquivosCompletos(resposta: string): Record<string, string> {
    const arquivos: Record<string, string> = {};

    if (!resposta || !resposta.trim()) return arquivos;

    // 1. Extração via tags XML <arquivo nome="..."> ou <file path="...">
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

    // 2. Extração via JSON estruturado
    const padraoJson = /```(?:json)?\s*\n([\s\S]*?)\n```/gi;
    let mJson: RegExpExecArray | null;
    while ((mJson = padraoJson.exec(resposta)) !== null) {
      try {
        const parsed = JSON.parse(mJson[1] ?? "");
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              const caminho = item.path || item.caminho || item.filePath || item.file;
              const conteudo = item.content || item.conteudo || item.code;
              if (caminho && typeof conteudo === "string") {
                arquivos[caminho] = conteudo;
              }
            }
          } else if (Array.isArray((parsed as any).files)) {
            for (const item of (parsed as any).files) {
              const caminho = item.path || item.caminho || item.filePath || item.file;
              const conteudo = item.content || item.conteudo || item.code;
              if (caminho && typeof conteudo === "string") {
                arquivos[caminho] = conteudo;
              }
            }
          } else {
            // Objeto do tipo { "src/App.tsx": "código..." }
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

    // 3. Extração via blocos markdown com anotação de arquivo
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
   * Substitui inteiramente os arquivos antigos pelos novos (100% reescritos, sem regex/patches parciais).
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
   * Escreve fisicamente os arquivos em disco usando Bun.write (ou node:fs/promises em fallback),
   * garantindo a criação de subpastas e a substituição integral do arquivo.
   */
  public async gravarEmDisco(
    diretorioRaiz: string,
    arquivos: Record<string, string>,
  ): Promise<{ sucesso: boolean; gravados: string[]; erros: string[] }> {
    const gravados: string[] = [];
    const erros: string[] = [];

    const isBun = typeof (globalThis as any).Bun !== "undefined" && typeof (globalThis as any).Bun.write === "function";

    for (const [caminhoRelativo, conteudo] of Object.entries(arquivos)) {
      try {
        const pathNormalizado = caminhoRelativo.replace(/\\/g, "/");
        const caminhoCompleto = `${diretorioRaiz.replace(/[\\/]$/, "")}/${pathNormalizado}`;

        // Assegura criação do diretório pai
        const partes = caminhoCompleto.split("/");
        partes.pop();
        const pastaPai = partes.join("/");

        if (pastaPai) {
          const fs = await import("node:fs/promises");
          await fs.mkdir(pastaPai, { recursive: true }).catch(() => {});
        }

        if (isBun) {
          await (globalThis as any).Bun.write(caminhoCompleto, conteudo);
        } else {
          const fs = await import("node:fs/promises");
          await fs.writeFile(caminhoCompleto, conteudo, "utf8");
        }

        gravados.push(caminhoRelativo);
      } catch (err: any) {
        erros.push(`Falha ao gravar ${caminhoRelativo}: ${err?.message || String(err)}`);
      }
    }

    return {
      sucesso: erros.length === 0,
      gravados,
      erros,
    };
  }

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
   * Mantido para compatibilidade retroativa.
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

      falhas += 1;
    }

    return { conteudo: resultado, sucessos, falhas };
  }

  /**
   * Aplica uma alteração completa no projeto (arquivos novos e sobrescrições completas).
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
    for (const [caminho, conteudo] of Object.entries(alteracao.arquivosNovosOuCompletos || {})) {
      if (copia[caminho] !== undefined) {
        if (!modificados.includes(caminho)) modificados.push(caminho);
      } else {
        if (!criados.includes(caminho)) criados.push(caminho);
      }
      copia[caminho] = conteudo;
    }

    // 2. Patches em arquivos existentes (se fornecidos)
    for (const patch of alteracao.patches || []) {
      const conteudoExistente = copia[patch.caminho];
      if (conteudoExistente !== undefined) {
        const patchRes = this.aplicarPatchEmTexto(conteudoExistente, patch.chunks);
        copia[patch.caminho] = patchRes.conteudo;
        patchesAplicados += patchRes.sucessos;
        patchesFalhados += patchRes.falhas;
        if (!modificados.includes(patch.caminho)) modificados.push(patch.caminho);
      } else {
        const conteudoNovo = patch.chunks.map((c) => c.para).join("\n");
        copia[patch.caminho] = conteudoNovo;
        if (!criados.includes(patch.caminho)) criados.push(patch.caminho);
      }
    }

    // 3. Arquivos removidos
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
