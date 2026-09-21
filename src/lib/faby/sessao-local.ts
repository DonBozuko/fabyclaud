// Fonte única da sessão local do FabyClaud (modo local explícito).
// As mesmas chaves são lidas pelo middleware de autenticação do servidor,
// por isso toda a interface deve usar estas funções — nunca criar sessão à mão.

export const CHAVE_SESSAO_LOCAL = "faby_user_session";
export const CHAVE_DISPOSITIVO_LOCAL = "faby_stable_device_id";
export const EMAIL_LOCAL = "usuario@fabyclaud.local";

export interface SessaoLocal {
  id: string;
  email: string;
  created_at: string;
  modo: "local";
}

function novoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "local_" + Math.random().toString(36).slice(2);
}

/** Identificador estável do dispositivo; cria e grava se ainda não existir. */
export function idDispositivoLocal(): string {
  if (typeof window === "undefined") return "local-user";
  let id = window.localStorage.getItem(CHAVE_DISPOSITIVO_LOCAL);
  if (!id) {
    id = novoId();
    window.localStorage.setItem(CHAVE_DISPOSITIVO_LOCAL, id);
  }
  return id;
}

/** Garante que exista uma sessão local válida e devolve ela. */
export function garantirSessaoLocal(): SessaoLocal {
  const id = idDispositivoLocal();
  if (typeof window === "undefined") {
    return { id, email: EMAIL_LOCAL, created_at: new Date().toISOString(), modo: "local" };
  }

  const bruto = window.localStorage.getItem(CHAVE_SESSAO_LOCAL);
  if (bruto) {
    try {
      const salva = JSON.parse(bruto) as Partial<SessaoLocal>;
      if (salva && typeof salva.id === "string" && salva.id) {
        const sessao: SessaoLocal = {
          id: salva.id,
          email: salva.email || EMAIL_LOCAL,
          created_at: salva.created_at || new Date().toISOString(),
          modo: "local",
        };
        // Mantém o identificador do dispositivo alinhado com a sessão em uso,
        // para o servidor e a interface nunca divergirem de usuário.
        if (window.localStorage.getItem(CHAVE_DISPOSITIVO_LOCAL) !== sessao.id) {
          window.localStorage.setItem(CHAVE_DISPOSITIVO_LOCAL, sessao.id);
        }
        return sessao;
      }
    } catch (erro) {
      console.warn("[FabyClaud] Sessão local estava corrompida e foi recriada.", erro);
    }
  }

  const nova: SessaoLocal = {
    id,
    email: EMAIL_LOCAL,
    created_at: new Date().toISOString(),
    modo: "local",
  };
  window.localStorage.setItem(CHAVE_SESSAO_LOCAL, JSON.stringify(nova));
  return nova;
}

/** Identificador do usuário em uso: conta real quando existir, senão a sessão local. */
export function idUsuarioAtual(idContaReal?: string | null): string {
  if (idContaReal) return idContaReal;
  if (typeof window === "undefined") return "local-user";
  return garantirSessaoLocal().id;
}

/** Remove a sessão local mantendo o identificador do dispositivo (evita perder dados). */
export function limparSessaoLocal(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAVE_SESSAO_LOCAL);
}
