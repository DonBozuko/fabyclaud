import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import heroAsset from "@/assets/hero-matrix.png.asset.json";
import { CHAVE_SESSAO_LOCAL, garantirSessaoLocal, limparSessaoLocal } from "@/lib/faby/sessao-local";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar na FabyClaud — sua IA para criar sites" },
      {
        name: "description",
        content:
          "Crie sua conta grátis na FabyClaud e gere sites completos conversando com IA, usando suas próprias chaves de API gratuitas.",
      },
      { property: "og:title", content: "Entrar na FabyClaud" },
      {
        property: "og:description",
        content: "Conta grátis para criar sites com conexões de IA controladas por você.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  function autenticarLocalmente(emailInformado: string) {
    if (typeof window === "undefined") return;
    // Usa a mesma sessão local que o servidor lê nas chamadas protegidas.
    const sessao = garantirSessaoLocal();
    if (emailInformado && emailInformado !== sessao.email) {
      localStorage.setItem(
        CHAVE_SESSAO_LOCAL,
        JSON.stringify({ ...sessao, email: emailInformado }),
      );
    }
    toast.success("Acesso liberado (modo local / chaves próprias)!");
    void navigate({ to: "/" });
  }

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      if (data?.session) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("faby_user_session");
        }
        void navigate({ to: "/" });
      } else if (typeof window !== "undefined" && localStorage.getItem("faby_user_session")) {
        void navigate({ to: "/" });
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_evento: any, sessao: any) => {
      if (sessao) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("faby_user_session");
        }
        void navigate({ to: "/" });
      }
    });

    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          // Se for erro de rede / placeholder, oferece fallback local
          if (
            error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("placeholder")
          ) {
            autenticarLocalmente(email);
            return;
          }
          toast.error(error.message);
          return;
        }
        if (!data?.session) {
          setConfirmar(true);
          return;
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("faby_user_session");
        }
        toast.success("Conta criada com sucesso!");
        void navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) {
          if (
            error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("placeholder")
          ) {
            autenticarLocalmente(email);
            return;
          }
          toast.error(error.message);
          return;
        }
        if (data?.session) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("faby_user_session");
          }
          toast.success("Login realizado com sucesso!");
          void navigate({ to: "/" });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-[center_15%] bg-no-repeat"
        style={{ backgroundImage: `url(${heroAsset.url})` }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 bg-background/75" aria-hidden />

      <main className="panel-glass w-full max-w-sm rounded-2xl p-7 shadow-2xl border border-border bg-card/90 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-foreground">
          Faby<span className="text-primary">Claud</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie com conexões gratuitas que você controla.
        </p>

        {confirmar ? (
          <div className="mt-6 space-y-3 text-sm">
            <p className="font-medium text-primary">Confira seu email</p>
            <p className="text-muted-foreground">
              Mandamos um link de confirmação para <strong>{email}</strong>. Clique nele para ativar
              a conta e depois volte aqui para entrar.
            </p>
            <button
              type="button"
              onClick={() => {
                setConfirmar(false);
                setModo("entrar");
              }}
              className="text-primary underline"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={enviar} className="mt-6 space-y-3">
              <label className="block text-xs text-muted-foreground font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="voce@email.com"
              />
              <label className="block text-xs text-muted-foreground font-medium" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="mínimo 6 caracteres"
              />
              <button
                type="submit"
                disabled={carregando}
                className="mt-2 w-full rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60"
              >
                {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta grátis"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => autenticarLocalmente(email || "usuario@fabyclaud.local")}
              className="mt-3 w-full rounded-lg border border-border bg-secondary py-2.5 text-xs font-semibold text-foreground transition hover:bg-accent"
            >
              ⚡ Entrar sem senha (Modo Livre / BYOK)
            </button>

            <button
              type="button"
              onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
              className="mt-4 w-full text-xs text-muted-foreground transition hover:text-primary"
            >
              {modo === "entrar"
                ? "Não tem conta? Criar uma grátis"
                : "Já tenho conta — quero entrar"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
