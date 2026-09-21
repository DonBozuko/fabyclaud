// Verificação honesta das configurações de backend no servidor.
// Os clientes gerados caem em valores de reserva ("placeholder") quando as
// variáveis faltam. Aqui isso é detectado e relatado com clareza, em vez de
// produzir erros confusos de banco de dados mais adiante.

const RESERVAS = new Set([
  "https://placeholder-project.supabase.co",
  "placeholder-anon-key",
  "placeholder-service-role-key",
]);

function definida(nome: string): boolean {
  const valor = process.env[nome];
  return Boolean(valor && valor.trim() && !RESERVAS.has(valor.trim()));
}

export interface EstadoBackend {
  /** Banco de dados e login na nuvem disponíveis. */
  nuvemPronta: boolean;
  /** Operações administrativas (ex.: contas privadas dos apps) disponíveis. */
  administracaoPronta: boolean;
  faltando: string[];
  mensagem: string | null;
}

export function estadoBackendServidor(): EstadoBackend {
  const faltando: string[] = [];
  if (!definida("SUPABASE_URL")) faltando.push("SUPABASE_URL");
  if (!definida("SUPABASE_PUBLISHABLE_KEY")) faltando.push("SUPABASE_PUBLISHABLE_KEY");
  const administracaoPronta = definida("SUPABASE_SERVICE_ROLE_KEY");
  if (!administracaoPronta) faltando.push("SUPABASE_SERVICE_ROLE_KEY");

  const nuvemPronta =
    !faltando.includes("SUPABASE_URL") && !faltando.includes("SUPABASE_PUBLISHABLE_KEY");

  let mensagem: string | null = null;
  if (!nuvemPronta) {
    mensagem =
      "A nuvem do FabyClaud não está configurada nesta versão do site, então login e banco de " +
      "dados ficam indisponíveis. Seus projetos continuam sendo salvos no armazenamento local do " +
      "servidor. Publique o projeto novamente para religar a nuvem.";
  } else if (!administracaoPronta) {
    mensagem =
      "Funções administrativas da nuvem estão indisponíveis nesta versão (contas privadas dentro " +
      "dos apps). O restante do sistema funciona normalmente.";
  }

  return { nuvemPronta, administracaoPronta, faltando, mensagem };
}

/** Usar antes de operações que exigem administração real; erro claro em vez de falha silenciosa. */
export function exigirAdministracaoNuvem(): void {
  const estado = estadoBackendServidor();
  if (!estado.administracaoPronta) {
    throw new Error(
      "Esta ação precisa das credenciais administrativas da nuvem, que não estão disponíveis " +
        "nesta versão do site. Publique o projeto novamente para religar a nuvem.",
    );
  }
}
