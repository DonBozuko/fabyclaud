import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import heroAsset from "@/assets/hero-matrix.png.asset.json";

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

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (sessao) void navigate({ to: "/" });
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void navigate({ to: "/" });
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
        if (error) throw error;
        if (!data.session) {
          setConfirmar(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : "Não conseguimos concluir agora";
      toast.error(
        msg.includes("Invalid login")
          ? "Email ou senha incorretos."
          : msg.includes("already registered")
            ? "Esse email já tem conta. Tente entrar."
            : msg,
      );
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

      <main className="panel-glass w-full max-w-sm rounded-2xl p-7">
        <h1 className="text-2xl font-bold">
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
              <label className="block text-xs text-muted-foreground" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="voce@email.com"
              />
              <label className="block text-xs text-muted-foreground" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
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
