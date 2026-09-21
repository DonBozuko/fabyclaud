// Verificação honesta das configurações de backend no navegador.
// Os clientes gerados usam valores de reserva ("placeholder") quando as
// configurações faltam; aqui isso é detectado e explicado ao usuário em vez
// de falhar silenciosamente.

const RESERVA_URL = "https://placeholder-project.supabase.co";
const RESERVA_CHAVE = "placeholder-anon-key";

export interface EstadoAmbiente {
  ok: boolean;
  /** Mensagem clara em português quando algo está faltando. */
  mensagem: string | null;
  faltando: string[];
}

export function verificarAmbienteCliente(): EstadoAmbiente {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const chave = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

  const faltando: string[] = [];
  if (!url || url === RESERVA_URL) faltando.push("VITE_SUPABASE_URL");
  if (!chave || chave === RESERVA_CHAVE) faltando.push("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (faltando.length === 0) {
    return { ok: true, mensagem: null, faltando };
  }

  return {
    ok: false,
    faltando,
    mensagem:
      "As configurações da nuvem não chegaram nesta versão do site, então login e banco de dados " +
      "não vão funcionar aqui. Publique o projeto novamente para gerar uma versão com as " +
      "configurações corretas. O modo local continua disponível para editar e visualizar projetos.",
  };
}
