/**
 * Nuvem FabyClaud: banco de dados real, hospedado, para os projetos gerados.
 *
 * A IA escreve o endereço como o marcador %%FABY_API%% e, antes de salvar o
 * projeto, trocamos pelo endereço verdadeiro daquele projeto. Assim o mesmo
 * código funciona na prévia, no arquivo baixado e no site publicado.
 */

export const MARCADOR_API = "%%FABY_API%%";
export const MARCADOR_AUTH = "%%FABY_AUTH%%";
export const MARCADOR_PRIVADO = "%%FABY_PRIVADO%%";

/** Endereço real do banco daquele projeto. */
export function urlDadosProjeto(origem: string, projetoId: string) {
  const base = (origem ?? "").trim().replace(/\/+$/, "");
  // Se for localhost ou vazio, usa caminho relativo que funciona em qualquer host/porta/domínio
  if (!base || /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(base)) {
    return `/api/public/dados/${projetoId}`;
  }
  return `${base}/api/public/dados/${projetoId}`;
}

export function urlsPrivadasProjeto(origem: string, projetoId: string) {
  const base = (origem ?? "").trim().replace(/\/+$/, "");
  const prefixo =
    !base || /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(base) ? "" : base;
  return {
    auth: `${prefixo}/api/public/app-auth/${projetoId}`,
    dados: `${prefixo}/api/public/app-private/${projetoId}`,
  };
}

/** Detecta e colapsa segmentos duplicados de API para evitar loops de correção. */
export function normalizarUrlsApi(codigo: string): string {
  if (!codigo) return codigo;
  let res = codigo;

  // 1. Remove duplicação em interpolações e concatenações de ${API}
  res = res
    .replace(/\$\{API\}\/(?:api\/)?public\/dados(?:\/[0-9a-f-]{36})?\//gi, "${API}/")
    .replace(/\$\{API\}\/(?:api\/)?public\/dados(?:\/[0-9a-f-]{36})?/gi, "${API}")
    .replace(/API\s*\+\s*["']\/(?:api\/)?public\/dados(?:\/[0-9a-f-]{36})?\//gi, 'API + "/')
    .replace(/API\s*\+\s*["']\/(?:api\/)?public\/dados(?:\/[0-9a-f-]{36})?["']/gi, "API")
    .replace(
      /\bAPI\s*=\s*["']https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/api\/public\/dados\/([0-9a-f-]{36})["']/gi,
      'API = "/api/public/dados/$1"',
    );

  // 2. Colapsa segmentos duplicados de URL absoluta ou relativa
  // Ex: http://localhost:8080/api/public/dados/UUID/public/dados/UUID/recados -> /api/public/dados/UUID/recados
  // Ex: https://.../api/public/dados/UUID/api/public/dados/UUID/recados -> https://.../api/public/dados/UUID/recados
  res = res.replace(
    /(https?:\/\/[^"'\s`]+)?(?:\/api)?\/public\/dados\/([0-9a-f-]{36})(?:\/(?:api\/)?public\/dados(?:\/[0-9a-f-]{36})?)+/gi,
    (_todo, prefixo, id) => {
      const p = prefixo && !/localhost|127\.0\.0\.1/i.test(prefixo) ? prefixo : "";
      return `${p}/api/public/dados/${id}`;
    },
  );

  // 3. Colapsa repetições no meio de caminhos relativos
  res = res.replace(
    /(?:\/api)?\/public\/dados\/([0-9a-f-]{36})\/public\/dados\/\1/gi,
    "/api/public/dados/$1",
  );
  res = res.replace(/\/public\/dados\/([0-9a-f-]{36})\/public\/dados\//gi, "/public/dados/$1/");

  // 4. Substitui hostnames de localhost hardcoded por caminho relativo
  res = res.replace(
    /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/api\/public\/dados\/([0-9a-f-]{36})/gi,
    "/api/public/dados/$1",
  );

  // 5. Normaliza casos onde a IA concatenou /public/dados/:colecao em cima de /api/public/dados/:id
  res = res.replace(
    /\/api\/public\/dados\/([0-9a-f-]{36})\/public\/dados\/([a-zA-Z0-9_-]+)/gi,
    "/api/public/dados/$1/$2",
  );

  return res;
}

/** Troca o marcador (e endereços antigos de localhost) pelo endereço real. */
export function aplicarApiNoCodigo(
  codigo: string,
  apiUrl: string,
  authUrl?: string,
  privadoUrl?: string,
) {
  const limpaApiUrl = apiUrl.replace(/\/+$/, "");
  const limpaAuthUrl = authUrl?.replace(/\/+$/, "");
  const limpaPrivadoUrl = privadoUrl?.replace(/\/+$/, "");

  // 1. Normaliza código antes da substituição
  let res = normalizarUrlsApi(codigo);

  // 2. Substitui marcadores
  res = res
    .split(MARCADOR_API)
    .join(limpaApiUrl)
    .split(MARCADOR_AUTH)
    .join(limpaAuthUrl ?? MARCADOR_AUTH)
    .split(MARCADOR_PRIVADO)
    .join(limpaPrivadoUrl ?? MARCADOR_PRIVADO);

  // 3. Normaliza novamente após a substituição para garantir consistência perfeita
  res = normalizarUrlsApi(res);

  return res;
}

export function aplicarApiNosArquivos(
  arquivos: Record<string, string>,
  apiUrl: string,
  authUrl?: string,
  privadoUrl?: string,
) {
  const saida: Record<string, string> = {};
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    saida[nome] = nome.startsWith("enviados/")
      ? conteudo
      : aplicarApiNoCodigo(conteudo, apiUrl, authUrl, privadoUrl);
  }
  return saida;
}

/** O frontend usa o banco hospedado? (usado pela conferência automática) */
export function usaBancoHospedado(codigo: string) {
  return (
    codigo.includes(MARCADOR_API) ||
    /\/api\/public\/dados\//.test(codigo) ||
    /fabyDados|FabyDados/.test(codigo)
  );
}

export function usaAutenticacaoPrivada(codigo: string) {
  return (
    /%%FABY_AUTH%%|\/api\/public\/app-auth\//.test(codigo) &&
    /authorization[^\n]{0,100}bearer/i.test(codigo)
  );
}

/** Instrução entregue à IA descrevendo o banco real disponível. */
export function instrucaoNuvem(apiUrl: string, authUrl?: string, privadoUrl?: string) {
  return [
    "ARMAZENAMENTO PÚBLICO SIMPLES JÁ HOSPEDADO (use para listas e conteúdo sem dados privados):",
    `O projeto pode guardar dados públicos simples no endereço ${apiUrl}. Não existe nada para instalar e NÃO se cria pasta backend/ para isso.`,
    'No JavaScript do frontend, escreva exatamente: const API = "%%FABY_API%%";  (o sistema troca esse marcador pelo endereço real antes de salvar).',
    "ATENÇÃO CRÍTICA: %%FABY_API%% já contém o endereço base completo do banco. As coleções são acessadas diretamente na raiz de API: `${API}/recados`, `${API}/usuarios`, `${API}/comunidades`. NUNCA adicione '/api/public/dados' nem o ID do projeto após ${API}.",
    "Cada coleção é uma tabela. Contrato REST:",
    '- listar:  fetch(`${API}/recados`).then(r => r.json())  -> devolve um array de objetos, cada um com "id" e "criado_em".',
    '- criar:   fetch(`${API}/recados`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ autor, texto }) })  -> devolve o registro criado com id.',
    '- editar:  fetch(`${API}/recados?id=${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ autor, texto }) })',
    '- apagar:  fetch(`${API}/recados?id=${id}`, { method: "DELETE" })',
    "Nomes de coleção: letras minúsculas, números, - ou _ (ex: usuarios, recados, produtos, comunidades).",
    "Regras obrigatórias: toda tela que mostra lista carrega os dados desse banco no início (async/await com try/catch); todo formulário grava lá de verdade antes de aparecer na tela; editar e apagar chamam PUT e DELETE reais. Mostre uma mensagem curta de erro na tela quando a chamada falhar.",
    "É PROIBIDO guardar senha, token, chave, dado financeiro, dado pessoal privado ou sessão neste armazenamento. Ele é público por endereço e não oferece autenticação de usuários finais.",
    authUrl && privadoUrl ? "CONTAS E DADOS PRIVADOS DISPONÍVEIS:" : "",
    authUrl && privadoUrl
      ? `Use const AUTH = "${MARCADOR_AUTH}" e const PRIVADO = "${MARCADOR_PRIVADO}". O sistema troca os marcadores pelos endereços reais.`
      : "",
    authUrl && privadoUrl
      ? 'Cadastro: POST em AUTH com { acao:"cadastro", email, senha, perfil:{ nome, foto_url, cargo, preferencias } }. Se confirmar_email vier true, mostre “confirme seu email”.'
      : "",
    authUrl && privadoUrl
      ? 'Entrar: POST em AUTH com { acao:"entrar", email, senha }. Guarde somente a sessão retornada no navegador. Sessão/perfil: GET em AUTH com Authorization: Bearer TOKEN. Renovar: POST com { acao:"renovar", refresh_token }. Editar perfil: PUT em AUTH com o mesmo cabeçalho. Sair: DELETE em AUTH com o mesmo cabeçalho e apague a sessão local.'
      : "",
    authUrl && privadoUrl
      ? "Dados privados: GET/POST em `${PRIVADO}/colecao` e PUT/DELETE em `${PRIVADO}/colecao?id=UUID`, sempre com Authorization: Bearer TOKEN. Cada conta enxerga apenas os próprios registros."
      : "",
    authUrl && privadoUrl
      ? "Logout: apague a sessão local e volte à tela de entrada. Nunca guarde senha. ‘cargo’ é texto do perfil e nunca autorização administrativa."
      : "",
    "Na resposta do chat, diga que listas públicas ficam salvas entre navegadores. Nunca chame este armazenamento de login real, banco privado ou backend seguro.",
  ]
    .filter(Boolean)
    .join("\n");
}
