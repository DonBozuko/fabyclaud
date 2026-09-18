import type { FileNode } from "./types";

export class DirectoryReader {
  /**
   * Lê uma lista de arquivos no formato plano { [path: string]: string }
   * e converte em uma árvore estruturada de nós (FileNode[]).
   */
  public parseFileTree(files: Record<string, string>): FileNode[] {
    const root: FileNode[] = [];

    for (const [filePath, content] of Object.entries(files)) {
      const parts = filePath.split("/").filter(Boolean);
      let currentLevel = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join("/");

        let existingNode = currentLevel.find((node) => node.name === part);

        if (!existingNode) {
          existingNode = {
            name: part,
            path: currentPath,
            type: isFile ? "file" : "directory",
            size: isFile ? content.length : undefined,
            children: isFile ? undefined : [],
          };
          currentLevel.push(existingNode);
        }

        if (!isFile && existingNode.children) {
          currentLevel = existingNode.children;
        }
      }
    }

    return root;
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
