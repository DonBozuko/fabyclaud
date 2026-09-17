export type ResultadoExecucaoIsolada = { ok: boolean; saida: string[]; erro?: string };

export function executarJavaScriptIsolado(
  codigo: string,
  limiteMs = 1500,
): Promise<ResultadoExecucaoIsolada> {
  return new Promise((resolve) => {
    const id = `faby-exec-${crypto.randomUUID()}`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.hidden = true;
    const limpar = () => {
      window.removeEventListener("message", ouvir);
      iframe.remove();
    };
    const timer = window.setTimeout(() => {
      limpar();
      resolve({ ok: false, saida: [], erro: "Tempo máximo de execução atingido." });
    }, limiteMs);
    function ouvir(evento: MessageEvent) {
      if (evento.data?.id !== id) return;
      window.clearTimeout(timer);
      limpar();
      resolve(evento.data.resultado as ResultadoExecucaoIsolada);
    }
    window.addEventListener("message", ouvir);
    const fechamento = "</" + "script>";
    iframe.srcdoc = `<script>const saida=[];console.log=(...a)=>saida.push(a.map(String).join(' '));try{new Function(${JSON.stringify(codigo)})();parent.postMessage({id:${JSON.stringify(id)},resultado:{ok:true,saida}},'*')}catch(e){parent.postMessage({id:${JSON.stringify(id)},resultado:{ok:false,saida,erro:String(e&&e.message||e)}},'*')}${fechamento}`;
    document.body.appendChild(iframe);
  });
}

export function arquivoJavaScriptExecutavel(arquivos: Record<string, string>) {
  const nomes = Object.keys(arquivos).filter(
    (nome) => /\.m?js$/i.test(nome) && !/(^|\/)(app|script|main)\.js$/i.test(nome),
  );
  return nomes.length === 1 ? (nomes[0] ?? null) : null;
}
