export interface ArquivoItem {
  caminho: string;
  conteudo: string;
  tamanho: number;
}

export class DirectoryReader {
  public lerArquivosDoObjeto(arquivos: Record<string, string>): ArquivoItem[] {
    return Object.entries(arquivos).map(([caminho, conteudo]) => ({
      caminho,
      conteudo,
      tamanho: new Blob([conteudo]).size,
    }));
  }

  public listarCaminhos(arquivos: Record<string, string>): string[] {
    return Object.keys(arquivos);
  }

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
      extensoes: Array.from(new Set(caminhos.map((c) => c.split('.').pop() || ''))),
    };
  }
}

export default DirectoryReader;
