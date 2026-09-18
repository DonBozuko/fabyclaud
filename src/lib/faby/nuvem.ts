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
  const base = origem.replace(/\/+$/, "");
  return `${base}/api/public/dados/${projetoId}`;
}

export function urlsPrivadasProjeto(origem: string, projetoId: string) {
  const base = origem.replace(/\/+$/, "");
  return {
    auth: `${base}/api/public/app-auth/${projetoId}`,
    dados: `${base}/api/public/app-private/${projetoId}`,
  };
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

  // 1. Remove redundancy in JS template strings/concatenations before variable interpolation
  let res = codigo
    .replace(/\$\{API\}\/(?:api\/)?public\/dados\/[0-9a-f-]{36}\//gi, "${API}/")
    .replace(/\$\{API\}\/(?:api\/)?public\/dados\//gi, "${API}/")
    .replace(/API\s*\+\s*["']\/(?:api\/)?public\/dados\/[0-9a-f-]{36}\//gi, 'API + "/')
    .replace(/API\s*\+\s*["']\/(?:api\/)?public\/dados\//gi, 'API + "/');

  // 2. Replace markers
  res = res
    .split(MARCADOR_API)
    .join(limpaApiUrl)
    .split(MARCADOR_AUTH)
    .join(limpaAuthUrl ?? MARCADOR_AUTH)
    .split(MARCADOR_PRIVADO)
    .join(limpaPrivadoUrl ?? MARCADOR_PRIVADO);

  // 3. Clean up any compounded duplicated URL segments in direct strings
  res = res.replace(
    /https?:\/\/[^"'\s`]+\/api\/public\/dados\/[0-9a-f-]{36}(?:\/(?:api\/)?public\/dados(?:\/[0-9a-f-]{36})?)+/gi,
    limpaApiUrl,
  );
  // 4. Clean up any localhost base URLs
  res = res.replace(
    /https?:\/\/(?:localhost|127\.0\.0\.1):\d+\/api\/public\/dados\/[0-9a-f-]{36}(?:\/(?:api\/)?public\/dados(?:\/[0-9a-f-]{36})?)*/gi,
    limpaApiUrl,
  );
  res = res.replace(
    /https?:\/\/(?:localhost|127\.0\.0\.1):\d+(?:\/api\/public\/dados\/[0-9a-f-]{36})?/gi,
    limpaApiUrl,
  );

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
