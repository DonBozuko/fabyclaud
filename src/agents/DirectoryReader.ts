import type { ArquivoItem, FileNode, VFSSnapshot } from "./types";

export class DirectoryReader {
  /**
   * Converte um registro de arquivos plano em uma lista tipada de ArquivoItem.
   */
  public lerArquivosDoObjeto(arquivos: Record<string, string>): ArquivoItem[] {
    return Object.entries(arquivos).map(([caminho, conteudo]) => ({
      caminho,
      conteudo,
      tamanho: typeof Blob !== "undefined" ? new Blob([conteudo]).size : conteudo.length,
    }));
  }

  /**
   * Retorna os caminhos dos arquivos ordenados.
   */
  public listarCaminhos(arquivos: Record<string, string>): string[] {
    return Object.keys(arquivos).sort();
  }

  /**
   * Obtém métricas e estatísticas dos arquivos do projeto.
   */
  public obterEstatisticas(arquivos: Record<string, string>) {
    const caminhos = Object.keys(arquivos);
    const totalArquivos = caminhos.length;
    let tamanhoTotal = 0;

    for (const caminho of caminhos) {
      const conteudo = arquivos[caminho];
      if (conteudo) {
        tamanhoTotal += conteudo.length;
      }
    }

    return {
      totalArquivos,
      tamanhoTotal,
      extensoes: Array.from(new Set(caminhos.map((c) => c.split(".").pop() || ""))),
    };
  }

  /**
   * Lê uma lista de arquivos no formato plano { [path: string]: string }
   * e converte em uma árvore estruturada de nós (FileNode[]).
   */
  public parseFileTree(files: Record<string, string>): FileNode[] {
    const root: FileNode[] = [];

    const sortedPaths = Object.keys(files).sort();

    for (const filePath of sortedPaths) {
      const content = files[filePath] ?? "";
      const parts = filePath.split("/").filter(Boolean);
      let currentLevel = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        const isFile = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join("/");

        let existingNode = currentLevel.find((node) => node.name === part);

        if (!existingNode) {
          const novoNodo: FileNode = {
            name: part,
            path: currentPath,
            type: isFile ? "file" : "directory",
            ...(isFile ? { size: content.length } : { children: [] }),
          };
          currentLevel.push(novoNodo);
          existingNode = novoNodo;
        }

        if (!isFile && existingNode && existingNode.children) {
          currentLevel = existingNode.children;
        }
      }
    }

    return root;
  }

  /**
   * Gera uma representação em texto indentado da árvore de arquivos.
   */
  public gerarArvoreTexto(files: Record<string, string>): string {
    const tree = this.parseFileTree(files);

    const renderNode = (nodes: FileNode[], indent = 0): string[] => {
      const lines: string[] = [];
      const prefix = "  ".repeat(indent);

      for (const node of nodes) {
        if (node.type === "directory") {
          lines.push(`${prefix}${node.name}/`);
          if (node.children && node.children.length > 0) {
            lines.push(...renderNode(node.children, indent + 1));
          }
        } else {
          lines.push(`${prefix}${node.name}`);
        }
      }

      return lines;
    };

    return renderNode(tree).join("\n");
  }

  /**
   * Gera o Snapshot XML completo e estruturado do Stateful VFS.
   * Contém a árvore de diretórios e o código 100% real de cada arquivo.
   */
  public gerarSnapshotXml(
    files: Record<string, string>,
    options?: {
      limiteBytesPorArquivo?: number;
      ignorarCaminhos?: string[];
    },
  ): string {
    const caminhos = Object.keys(files)
      .filter((c) => {
        if (options?.ignorarCaminhos?.some((p) => c.startsWith(p))) return false;
        // Evita binários pesados de imagens inline na árvore de código
        if (c.startsWith("enviados/") || c.startsWith("originais/")) return false;
        return true;
      })
      .sort();

    const arvore = this.gerarArvoreTexto(
      Object.fromEntries(caminhos.map((c) => [c, files[c] ?? ""])),
    );

    const limiteArquivo = options?.limiteBytesPorArquivo ?? 50_000;

    const blocosArquivos = caminhos.map((caminho) => {
      const conteudoOriginal = files[caminho] ?? "";
      let conteudo = conteudoOriginal;
      let avisoTruncamento = "";

      if (conteudo.length > limiteArquivo) {
        conteudo = conteudo.slice(0, limiteArquivo);
        avisoTruncamento = `\n<!-- [Aviso: Arquivo grande truncado nos primeiros ${limiteArquivo} caracteres] -->`;
      }

      return `  <file path="${caminho}">\n${conteudo}${avisoTruncamento}\n  </file>`;
    });

    const imagensEnviadas = Object.keys(files).filter((c) => c.startsWith("enviados/"));
    const blocoImagens = imagensEnviadas.length
      ? `  <available_assets>\n${imagensEnviadas.map((img) => `    <asset path="${img}" />`).join("\n")}\n  </available_assets>\n`
      : "";

    return [
      `<project_vfs>`,
      `  <file_tree>`,
      arvore
        .split("\n")
        .map((l) => `    ${l}`)
        .join("\n"),
      `  </file_tree>`,
      blocoImagens ? blocoImagens.trimEnd() : null,
      `  <files>`,
      blocosArquivos.join("\n"),
      `  </files>`,
      `</project_vfs>`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /**
   * Constrói o objeto completo de Snapshot VFS.
   */
  public gerarSnapshotCompleto(files: Record<string, string>): VFSSnapshot {
    const stats = this.obterEstatisticas(files);
    const arvoreNodos = this.parseFileTree(files);
    const arvoreTexto = this.gerarArvoreTexto(files);
    const snapshotXml = this.gerarSnapshotXml(files);

    return {
      totalArquivos: stats.totalArquivos,
      tamanhoTotal: stats.tamanhoTotal,
      arvoreTexto,
      arvoreNodos,
      arquivos: files,
      snapshotXml,
    };
  }

  /**
   * Filtra arquivos com base em extensões ou padrões permitidos.
   */
  public filterFiles(
    files: Record<string, string>,
    allowedExtensions: string[] = [".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css", ".md"],
  ): Record<string, string> {
    const filtered: Record<string, string> = {};
    for (const [path, content] of Object.entries(files)) {
      if (allowedExtensions.some((ext) => path.endsWith(ext))) {
        filtered[path] = content;
      }
    }
    return filtered;
  }
}

export default DirectoryReader;
