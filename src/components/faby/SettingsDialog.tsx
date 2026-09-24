import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Terminal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MODELS, PROVIDER_LABELS, PROVIDER_LINKS } from "@/lib/faby/config";
import {
  apagarChave,
  apagarProvedorCustom,
  criarProvedorCustom,
  listarChaves,
  listarProvedoresCustom,
  salvarChave,
  testarChave,
} from "@/lib/faby.functions";
import {
  apagarOmniRouteLocal,
  lerOmniRouteLocal,
  normalizarOmniRouteLocal,
  salvarOmniRouteLocal,
  testarOmniRouteLocal,
} from "@/lib/faby/omniroute-local";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const buscarChaves = useServerFn(listarChaves);
  const buscarCustom = useServerFn(listarProvedoresCustom);
  const salvar = useServerFn(salvarChave);
  const testar = useServerFn(testarChave);
  const remover = useServerFn(apagarChave);
  const criar = useServerFn(criarProvedorCustom);
  const removerCustom = useServerFn(apagarProvedorCustom);

  const chaves = useQuery({ queryKey: ["chaves"], queryFn: () => buscarChaves() });
  const custom = useQuery({ queryKey: ["provedores"], queryFn: () => buscarCustom() });

  const [provedor, setProvedor] = useState<string>("google");
  const [chave, setChave] = useState("");
  const [omniUrl, setOmniUrl] = useState("http://localhost:20128");
  const [omniPronta, setOmniPronta] = useState(false);
  const [testando, setTestando] = useState(false);

  const [novoNome, setNovoNome] = useState("");
  const [novaUrl, setNovaUrl] = useState("");
  const [novoModelo, setNovoModelo] = useState("");
  const [novoImagem, setNovoImagem] = useState(false);

  useEffect(() => {
    const local = lerOmniRouteLocal();
    if (!local) return;
    setOmniUrl(local.apiUrl);
    setOmniPronta(local.pronta);
  }, []);

  const salvarMut = useMutation({
    mutationFn: async () => {
      if (typeof window !== "undefined") {
        try {
          const salvas = JSON.parse(localStorage.getItem("faby_local_keys") || "{}");
          salvas[provedor] = { key: chave.trim(), api_url: provedor === "omniroute" ? omniUrl : "" };
          localStorage.setItem("faby_local_keys", JSON.stringify(salvas));
        } catch {
          // ignore
        }
      }
      if (provedor === "omniroute") {
        salvarOmniRouteLocal({
          apiUrl: normalizarOmniRouteLocal(omniUrl),
          apiKey: chave.trim(),
          pronta: false,
        });
        try {
          await remover({ data: { provider: "omniroute" } });
        } catch {
          // ignore
        }
        return {
          ok: true,
          msg: "Chave do OmniRoute salva somente neste navegador. Agora clique em Testar.",
        };
      }
      return salvar({
        data: { provider: provedor, key: chave, api_url: provedor === "omniroute" ? omniUrl : "" },
      });
    },
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg ?? "Não conseguimos salvar a chave agora.");
        return;
      }
      toast.success(r.msg);
      if (provedor === "omniroute") setOmniPronta(false);
      setChave("");
      void queryClient.invalidateQueries({ queryKey: ["chaves"] });
      void queryClient.invalidateQueries({ queryKey: ["capacidades"] });
    },
    onError: (erro) =>
      toast.error(erro instanceof Error ? erro.message : "Não conseguimos salvar a chave agora."),
  });

  const criarMut = useMutation({
    mutationFn: () =>
      criar({
        data: { nome: novoNome, url: novaUrl, modelo: novoModelo, suporta_imagem: novoImagem },
      }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.msg ?? "Não conseguimos cadastrar.");
        return;
      }
      toast.success("Provedor cadastrado. Agora salve a chave dele acima.");
      setNovoNome("");
      setNovaUrl("");
      setNovoModelo("");
      void queryClient.invalidateQueries({ queryKey: ["provedores"] });
    },
    onError: () => toast.error("Não conseguimos cadastrar agora."),
  });

  const listaProvedores = [
    ...Object.keys(MODELS).map((id) => ({ id, nome: PROVIDER_LABELS[id] ?? id })),
    ...(custom.data ?? []).map((p) => ({ id: p.slug, nome: `${p.nome} (seu)` })),
  ];

  function selecionarProvedor(id: string) {
    setProvedor(id);
    setChave("");
    const local = lerOmniRouteLocal();
    setOmniUrl(id === "omniroute" ? (local?.apiUrl ?? "http://localhost:20128") : "");
    setOmniPronta(id === "omniroute" && Boolean(local?.pronta));
  }

  async function testarAgora() {
    if (provedor === "omniroute") {
      const local = lerOmniRouteLocal();
      const chaveLocal = chave.trim() || local?.apiKey || "";
      if (!chaveLocal) {
        toast.error("Cole a chave criada no Gerenciador API do OmniRoute.");
        return;
      }
      setTestando(true);
      const r = await testarOmniRouteLocal(omniUrl, chaveLocal);
      setTestando(false);
      if (!r.ok) {
        salvarOmniRouteLocal({ apiUrl: r.apiUrl, apiKey: chaveLocal, pronta: false });
        setOmniPronta(false);
        toast.error(r.msg, { duration: 12000 });
        return;
      }
      salvarOmniRouteLocal({ apiUrl: r.apiUrl, apiKey: chaveLocal, pronta: true });
      setOmniUrl(r.apiUrl);
      setOmniPronta(true);
      setChave("");
      toast.success("OmniRoute local conectado e pronto para usar.");
      return;
    }
    const temSalva = (chaves.data ?? []).some((k: any) => k.provider === provedor);
    if (!chave.trim() && !temSalva) {
      toast.error("Cole a chave primeiro.");
      return;
    }
    setTestando(true);
    try {
      const r = await testar({
        data: {
          provider: provedor,
          key: chave.trim(),
          api_url: provedor === "omniroute" ? omniUrl.trim() : "",
        },
      });
      if (r.ok) toast.success(r.msg);
      else toast.error(r.msg);
      void queryClient.invalidateQueries({ queryKey: ["chaves"] });
      void queryClient.invalidateQueries({ queryKey: ["capacidades"] });
    } catch {
      toast.error("Não conseguimos testar agora. Tente de novo em alguns segundos.");
    } finally {
      setTestando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="panel-glass max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Configurações</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Suas chaves ficam guardadas na sua conta e nunca aparecem para outras pessoas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg border border-border p-2 transition hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>

        <section className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-primary">Chaves de IA</h3>

          <select
            value={provedor}
            onChange={(e) => selecionarProvedor(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm"
          >
            {listaProvedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          {provedor !== "omniroute" && PROVIDER_LINKS[provedor] ? (
            <p className="text-xs text-muted-foreground">
              Pegue sua chave grátis em{" "}
              <a
                href={PROVIDER_LINKS[provedor]}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {new URL(PROVIDER_LINKS[provedor]!).hostname}
              </a>
            </p>
          ) : null}

          {provedor === "omniroute" ? (
            <div className="space-y-3 rounded-lg border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                Sem baixar repositório: rode estes comandos no terminal
              </p>
              {["npm install -g omniroute", "omniroute"].map((comando) => (
                <div
                  key={comando}
                  className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2"
                >
                  <Terminal className="size-3.5 shrink-0 text-primary" />
                  <code className="min-w-0 flex-1 overflow-x-auto">{comando}</code>
                  <button
                    type="button"
                    title="Copiar comando"
                    aria-label={`Copiar ${comando}`}
                    onClick={async () => {
                      await navigator.clipboard.writeText(comando);
                      toast.success("Comando copiado.");
                    }}
                    className="rounded-md p-1 text-primary transition hover:bg-accent"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              ))}
              <p>
                O comando abre <code>http://localhost:20128/home</code>. Em “Provedores” conecte
                suas IAs, monte os combos e crie a chave em “Gerenciador API”. O FabyClaud usa a API
                local <code>/v1</code> e envia <code>auto/coding</code> para o OmniRoute escolher.
              </p>
              <a
                href="http://localhost:20128/home"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-primary underline"
              >
                Abrir painel local <ExternalLink className="size-3" />
              </a>
              <p>
                Use o endereço local abaixo neste computador. Não precisa baixar repositório nem
                criar túnel. HTTPS público é necessário apenas para usar a ponte em outro aparelho.
              </p>
              <p>
                Se o teste mostrar “navegador bloqueou”, abra “Compartilhamento” no OmniRoute e
                permita o endereço do FabyClaud. Isso libera somente a comunicação local.
              </p>
              <input
                type="url"
                value={omniUrl}
                onChange={(e) => setOmniUrl(e.target.value)}
                placeholder="http://localhost:20128"
                aria-label="Endereço da API do OmniRoute"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <p className={omniPronta ? "text-primary" : "text-muted-foreground"}>
                {omniPronta
                  ? "✓ Ponte local testada e pronta."
                  : "A ponte só entra no chat depois do teste real."}
              </p>
            </div>
          ) : null}

          <input
            type="password"
            value={chave}
            onChange={(e) => setChave(e.target.value)}
            placeholder="Cole a chave aqui"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => salvarMut.mutate()}
              disabled={salvarMut.isPending || !chave.trim()}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => void testarAgora()}
              disabled={testando}
              className="flex-1 rounded-lg border border-border bg-secondary py-2.5 text-sm transition hover:bg-accent disabled:opacity-50"
            >
              {testando ? "Testando..." : "Testar"}
            </button>
          </div>

          <ul className="space-y-1.5 pt-2">
            {omniPronta ? (
              <li className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2 text-xs">
                <span>
                  OmniRoute local — <span className="text-primary">✓ pronta neste navegador</span>
                </span>
                <button
                  type="button"
                  className="text-destructive"
                  onClick={() => {
                    apagarOmniRouteLocal();
                    setOmniPronta(false);
                  }}
                >
                  remover
                </button>
              </li>
            ) : null}
            {(chaves.data ?? [])
              .filter((k: any) => k.provider !== "omniroute")
              .map((k: any) => (
                <li
                  key={k.provider}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2 text-xs"
                >
                  <span>
                    {PROVIDER_LABELS[k.provider] ?? k.provider} —{" "}
                    <span className="text-muted-foreground">{k.mascara}</span>
                    {k.provider === "omniroute" && k.api_url ? (
                      <span className="ml-1 inline-flex items-center gap-1 text-primary">
                        <Check className="size-3" /> endereço configurado
                      </span>
                    ) : null}
                    <span
                      className={`ml-1 ${k.testada_ok ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {k.testada_ok ? "✓ pronta" : "• precisa testar"}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="text-destructive"
                    onClick={async () => {
                      await remover({ data: { provider: k.provider } });
                      void queryClient.invalidateQueries({ queryKey: ["chaves"] });
                    }}
                  >
                    remover
                  </button>
                </li>
              ))}
            {chaves.data && chaves.data.length === 0 ? (
              <li className="text-xs text-muted-foreground">Nenhuma chave salva ainda.</li>
            ) : null}
          </ul>

          <div className="rounded-xl border border-border bg-secondary/50 p-3">
            <p className="text-xs font-semibold">Pegar chaves grátis</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clique, crie a conta grátis, copie a chave e cole aqui em cima.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.keys(MODELS)
                .filter((id) => id !== "omniroute" && PROVIDER_LINKS[id])
                .map((id) => (
                  <a
                    key={id}
                    href={PROVIDER_LINKS[id]}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => selecionarProvedor(id)}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs transition hover:bg-accent"
                  >
                    {PROVIDER_LABELS[id] ?? id}
                    {(chaves.data ?? []).some((k: any) => k.provider === id) ? " ✓" : ""}
                  </a>
                ))}
            </div>
          </div>
        </section>

        <section className="mt-7 space-y-3 border-t border-border pt-5">
          <h3 className="text-sm font-semibold text-primary">Seu próprio provedor</h3>
          <p className="text-xs text-muted-foreground">
            Qualquer serviço compatível com o padrão da OpenAI. Ex: endereço
            https://api.exemplo.com/v1
          </p>
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome (ex: Meu Gateway)"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
          />
          <input
            value={novaUrl}
            onChange={(e) => setNovaUrl(e.target.value)}
            placeholder="https://api.exemplo.com/v1"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
          />
          <input
            value={novoModelo}
            onChange={(e) => setNovoModelo(e.target.value)}
            placeholder="Nome do modelo"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={novoImagem}
              onChange={(e) => setNovoImagem(e.target.checked)}
            />
            Esse modelo entende imagens
          </label>
          <button
            type="button"
            onClick={() => criarMut.mutate()}
            disabled={criarMut.isPending || !novoNome || !novaUrl || !novoModelo}
            className="w-full rounded-lg border border-border bg-secondary py-2.5 text-sm transition hover:bg-accent disabled:opacity-50"
          >
            Cadastrar provedor
          </button>

          <ul className="space-y-1.5">
            {(custom.data ?? []).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2 text-xs"
              >
                <span>
                  {p.nome} — <span className="text-muted-foreground">{p.modelo}</span>
                </span>
                <button
                  type="button"
                  className="text-destructive"
                  onClick={async () => {
                    await removerCustom({ data: { id: p.id } });
                    void queryClient.invalidateQueries({ queryKey: ["provedores"] });
                  }}
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
