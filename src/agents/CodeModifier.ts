export interface ModificacaoArquivo {
  caminho: string;
  novoConteudo: string;
  acao: 'criar' | 'atualizar' | 'remover';
}

export class CodeModifier {
  public aplicarModificacoes(
    arquivosAtuais: Record<string, string>,
    modificacoes: ModificacaoArquivo[]
  ): Record<string, string> {
    const copia = { ...arquivosAtuais };

    for (const mod of modificacoes) {
      if (mod.acao === 'remover') {
        delete copia[mod.caminho];
      } else {
        copia[mod.caminho] = mod.novoConteudo;
      }
    }

    return copia;
  }

  public sanitizarCodigo(codigo: string): string {
    return codigo.replace(/\r\n/g, '\n').trim();
  }
}

export default CodeModifier;
