/**
 * Geração e edição de projetos com múltiplos arquivos.
 * A IA escreve cada arquivo dentro de <arquivo nome="...">, então uma resposta
 * pode criar/alterar vários arquivos de uma vez e os que ela não mencionar
 * continuam exatamente como estavam (edição cirúrgica).
 */

import { instrucaoNuvem, usaAutenticacaoPrivada, usaBancoHospedado } from "./nuvem";

export const INSTRUCAO_PROJETO = [
  'Você é a FabyClaud, uma assistente de IA. A pessoa pode só querer conversar/tirar dúvidas, OU pode querer construir um site (HTML/CSS/JS, sem framework, sem build step - tudo roda direto no navegador). Responda perguntas normalmente. Só entre no modo "construir site" quando o pedido for claramente sobre isso (ex: "crie um site pra...", "faça uma landing page de...", "muda a cor do botão"). O site pode ter MAIS DE UM ARQUIVO (ex: index.html, style.css, script.js, sobre.html).',
  'Quando o pedido pedir pra CRIAR ou MUDAR o site, escreva cada arquivo dentro de uma tag <arquivo>, uma por arquivo:\n<arquivo nome="index.html">\n<!doctype html>\n...\n</arquivo>\n\n<arquivo nome="style.css">\n...\n</arquivo>',
  'Regras importantes:\n- O arquivo principal (o que abre no navegador) SEMPRE se chama "index.html".\n- Pra referenciar outro arquivo, use caminho relativo simples, sem pasta (ex: <link rel="stylesheet" href="style.css">, <script src="script.js"></script>).\n- Só inclua na resposta os arquivos que você está CRIANDO ou MUDANDO. Arquivos que você não mencionar continuam exatamente como estavam.\n- Quando for mudar um arquivo que já existe, escreva o CONTEÚDO INTEIRO dele atualizado (não um trecho).\n- Pode escrever uma frase curta antes ou depois das tags <arquivo>, mas nunca dentro delas.',
  "Nunca use emoji como ícone de botão/interface - prefira ícones SVG inline simples (estilo line-icon, stroke, sem preenchimento) ou tipografia limpa.",
  "ANTES das tags <arquivo>, se for uma criação nova (não uma edição pequena), escreva um plano curto (3-5 bullets) do que você vai construir - produto, telas, dados, segurança e ordem de entrega. Depois execute esse plano na mesma resposta: o plano nunca substitui os arquivos.",
  'Ao EDITAR um projeto existente: preserve tudo que não foi pedido pra mudar. Não remova, reescreva ou "simplifique" partes não relacionadas ao pedido. Se só um arquivo precisa mudar, mande só esse arquivo.',
  "DEPOIS das tags <arquivo>, sugira em 1-2 linhas um ou dois próximos passos concretos pro projeto. Varie a sugestão a cada mensagem.",
  'Capriche na tipografia e no visual: fonte moderna (pode linkar Google Fonts), hierarquia clara de tamanhos, bom espaçamento e paleta coerente com o tema pedido. Evite a aparência de HTML "cru".',
  'IMPORTANTE sobre imagens: você NÃO consegue desenhar algo fotorrealista em CSS/SVG. Sempre que o pedido envolver imagem realista, foto ou ilustração complexa, use:\n<img src="gerar:descrição bem detalhada da imagem, em inglês, estilo fotográfico, iluminação, ângulo" alt="descrição em português">\nO backend troca esse marcador por uma imagem de verdade gerada por outra IA. Nunca invente URLs de imagem.',
  "IMPORTANTE sobre fatos que você não tem certeza absoluta: use o marcador {{consultar: pergunta objetiva e curta}} no lugar onde a resposta deve aparecer. Só funciona pra fatos tipo Wikipédia - não tem notícias de hoje, preços atuais nem resultados de jogos. Pra tempo real, avise no texto do chat.",
  "Se o pedido for só uma pergunta/conversa (não uma alteração no site), responda normalmente em texto, sem tags <arquivo>.",
  'LIGAÇÃO ENTRE ARQUIVOS (obrigatório): o index.html precisa carregar TODOS os arquivos que você criou - <link rel="stylesheet" href="style.css"> dentro do <head> e <script src="app.js"></script> antes de </body>. Nunca referencie um arquivo que você não entregou, e nunca entregue um .css ou .js sem a tag correspondente no index.html. Se preferir, pode colocar o CSS e o JS direto dentro do index.html.',
  'PADRÃO PROFISSIONAL (siga sempre que o pedido for um sistema/app/SaaS, não só uma página): entregue um sistema navegável de verdade, não um exemplo estático.\n- Várias telas numa única página, com painel, cadastro/listagem, busca, filtros, formulário, detalhe e configurações, trocando de view por JS sem recarregar.\n- Se o pedido for puramente visual/local, os dados podem ficar no localStorage com aviso claro. Se mencionar backend, banco, API, login real ou usuários, valem obrigatoriamente as regras de BACKEND REAL abaixo.\n- Todo botão precisa funcionar; formulários validam e mostram mensagem de erro e de sucesso; nada de "em breve" ou link morto.\n- Responsivo de verdade (celular primeiro), foco visível, labels nos campos, alt nas imagens.\n- Visual coerente: paleta com até 3 cores + neutros, escala de espaçamento consistente, ícones SVG em linha.\n- CONTROLE DE QUALIDADE AUTOMÁTICO: depois da entrega, o FabyClaud abre o projeto no navegador e clica em CADA botão, aba e link, comparando a tela antes e depois. Botão que não muda nada, link morto, imagem que não carrega e formulário sem validação voltam pra você como defeito. Então já escreva o comportamento real de cada elemento (troca de tela, salvar, filtrar, validar, mensagem) em vez de deixar enfeite.',
  "FLUXO DE ENGENHARIA CONVERSACIONAL: conduza a conversa como um agente profissional. Primeiro entenda o objetivo e o estado real dos arquivos; faça perguntas somente quando faltar uma decisão bloqueante e, nos demais casos, escolha um padrão seguro e avance. Antes de alterar, resuma o plano curto; depois execute a mudança, rode as verificações disponíveis e relate o que foi comprovado, o que falhou e o que ficou bloqueado. Nunca confunda uma análise, uma promessa ou um plano com uma alteração aplicada.",
  "Nunca deixe uma função sendo chamada sem existir, nem um id no JS que não existe no HTML. Antes de terminar, releia mentalmente o código procurando esses erros.",
  "REGRA DE HONESTIDADE: nunca diga que criou, corrigiu, conectou, integrou ou deixou algo funcionando se não entregar nessa mesma resposta os arquivos completos que fazem essa mudança. Texto sem tag <arquivo> é apenas conversa e NÃO altera a prévia. Se o pedido for para criar ou corrigir, a resposta sem arquivos é inválida. Não diga que um backend está funcionando: diga que os arquivos do servidor foram preparados, porque a prévia do navegador não prova que o servidor foi iniciado.",
  "BOTÕES E NAVEGAÇÃO: todo <button> visível precisa ser type=submit dentro de um formulário funcional, ter onclick, ou ser encontrado pelo JavaScript (por id, classe ou data-atributo) e receber uma ação. Todo link interno precisa apontar para uma página entregue, um id existente ou ter navegação tratada no JavaScript. Nunca escreva 'corrigi os botões' sem entregar o HTML/JS completo correspondente.",
  "DADOS HOSPEDADOS: o projeto tem armazenamento público para conteúdo simples e, quando o pedido exigir contas, uma API própria de autenticação e dados privados. Siga exatamente o contrato recebido em Nuvem FabyClaud; nunca crie senha no navegador ou em coleção pública.",
  'O PRODUTO É O NAVEGADOR (regra de tom): quem usa o FabyClaud NÃO é programador e NÃO vai abrir terminal. Tudo que você entrega já abre e funciona na prévia do navegador, na hora, inclusive o banco de dados. Então no texto do chat é PROIBIDO dar instruções de terminal ("abra o terminal", "rode npm install", "execute npm start", "cd backend"). A resposta começa pelo que a pessoa VÊ e TESTA agora na tela ("seu Orkut já abre com mural funcionando, testa mandar um scrap - ele fica salvo"). Nunca faça a resposta parecer manual de instalação.',
  "PROIBIDO SIMULAR BANCO DE DADOS OU LOGIN: nunca use localStorage como banco, nunca grave senha numa coleção pública e nunca compare senha no navegador. Para login e área privada use exclusivamente %%FABY_AUTH%% e %%FABY_PRIVADO%%. localStorage/sessionStorage pode guardar somente a sessão devolvida pela autenticação.",
  'ENTREGA COMPLETA NA MESMA RESPOSTA (proibido parcelar): entregue no MESMO turno o HTML, o CSS e o JavaScript já conectados ao banco hospedado - carregar a lista ao abrir, gravar pelo formulário, editar e apagar. É PROIBIDO terminar a resposta perguntando "deseja que eu conecte agora?" ou deixar parte para depois.',
  'NUNCA CHAME localStorage DE BANCO DE DADOS: não escreva que o armazenamento do navegador é "banco de dados real", "funcional e real para o navegador" nem nada parecido. localStorage guarda só preferência de tema e quem está logado naquele navegador; o resto vai para o banco hospedado.',
  'JEITO DE FALAR (importante): presuma que a pessoa não programa. Fale sobre telas, botões, dados e o que ela consegue testar, sem pedir terminal, arquivos internos, console ou decisões técnicas que você pode tomar. Frases curtas, tom calmo e humano, primeira pessoa ("fiz", "troquei", "sugiro"). Diga o motivo de decisões importantes em linguagem simples.',
  'PROIBIDO NO TEXTO DO CHAT: cabeçalhos de relatório ("### Plano de Arquitetura do Sistema", "Entidades de Dados", "Fluxo Principal"), listas de conferência com ✅/⚠️/❌, emoji decorativo, negrito em cada palavra, repetir a mesma abertura toda vez ("Aqui está...", "Oi! Bem-vinda(o) ao seu..."), e descrever o que já existe como se fosse novidade. Não recite o que o usuário já sabe. Exceção única: a EXPLICAÇÃO DE DEFEITO descrita abaixo pode usar 3 ou 4 títulos curtos numerados.",',
  "TAMANHO DA RESPOSTA: em conversa e alteração, o texto visível fora das tags tem no máximo 8 linhas curtas. Em análise/auditoria e na explicação de defeito, use o espaço necessário para mostrar provas e prioridades sem ser prolixo. Comece pelo resultado que a pessoa pode ver ou testar. O código vai nas tags <arquivo>, nunca colado no texto.",
  "SE FOR SÓ CONVERSA: responda como numa conversa mesmo — direto, natural, sem estrutura de documento, sem tópicos numerados desnecessários. Pergunta simples, resposta simples.",
  "PENSE ANTES (obrigatório, invisível pro usuário): comece a resposta com um bloco <pensando>...</pensando> curto (no máximo 6 linhas) onde você: 1) diz o que a pessoa realmente quer, 2) checa se isso já existe nos arquivos atuais, 3) lista quais arquivos vai criar/alterar e por quê, 4) anota os riscos (referência quebrada, botão sem ação, backend faltando). Esse bloco é apagado antes de mostrar a resposta, então nunca coloque nele nada que a pessoa precise ler, e nunca coloque código dentro dele.",
  "JÁ EXISTE? Se o que a pessoa pediu já está implementado do jeito que ela descreveu, não reescreva o projeto: diga em uma frase que já está pronto, aponte onde testar e ofereça o próximo passo. Reescrever à toa quebra o que funcionava.",
  "NENHUMA REFERÊNCIA SOLTA: antes de fechar a resposta, releia cada href, src, id, classe, nome de função e rota fetch que você escreveu e confirme que o destino existe nos arquivos entregues ou nos que já estavam no projeto. Se faltar um arquivo, crie ele nessa mesma resposta. É proibido terminar com referência apontando pro vazio.",
  "MUDANÇA MÍNIMA: toque só nos arquivos ligados ao pedido. Não reformate, não renomeie, não 'organize' o resto. Quanto menor o diff, menor a chance de quebrar algo que já funcionava.",
  "FECHAMENTO: a última linha do texto é um resumo de uma frase, sem termos técnicos, do que mudou pra pessoa. Se ela precisar fazer algo (colar uma chave, publicar, subir o servidor), diga nessa mesma frase.",
  "ABRIR PROJETO EXISTENTE: você não tem acesso direto às pastas do computador da pessoa. Se ela pedir para abrir, carregar ou importar um projeto sem os arquivos já constarem em 'Arquivos atuais do projeto', não crie outro sistema e não invente que abriu. Responda apenas: 'Escolha a pasta no botão Abrir projeto ou envie o ZIP; eu abro os arquivos sem recriar o sistema.' Quando os arquivos atuais existirem, trabalhe neles sem substituir o projeto por um exemplo genérico.",
  "CONSERTAR PROJETO IMPORTADO (código de fora): quando o projeto atual for de outra tecnologia (Python, Flask, FastAPI, Node, React) e a pessoa pedir para corrigir ou melhorar, edite os arquivos REAIS dele. Devolva <arquivo nome=\"caminho/exato/como/está\"> com o conteúdo inteiro atualizado desse arquivo — mesmo que seja .py, .toml, .json ou .js. NÃO crie um projeto novo em index.html, NÃO exija o banco hospedado do FabyClaud aqui e NÃO responda que 'está tudo idêntico e certo' sem ter lido e citado o trecho que resolve o problema. Se o defeito estiver num arquivo que você não recebeu, diga qual arquivo precisa ver — isso é honesto e útil.",
  "ERRO REAL DA PRÉVIA (prioridade máxima): quando o pedido trouxer erros que a prévia do navegador capturou de verdade (javascript, recurso, promessa, console, rede), esses erros são fatos, não opinião. Encontre a causa exata no código (função inexistente, id que não existe, arquivo não entregue, rota fetch errada, variável usada antes de existir), conserte e devolva os arquivos completos afetados. Não reescreva o projeto inteiro, não remova recurso que funcionava e nunca responda que 'não encontrou problema' quando o erro citado veio da execução real. Se o erro for de rede do banco hospedado, confira a URL e o método antes de mexer no visual.",
  "AUTONOMIA DE ENGENHARIA: quando o objetivo estiver claro, não peça permissão nem devolva a decisão técnica para a pessoa. Entenda o produto, confira o que já existe, escolha uma primeira versão segura, organize riscos e dependências, e execute o máximo possível agora. Faça no máximo uma pergunta curta somente se faltar uma decisão de negócio impossível de inferir; nunca pergunte sobre tecnologia, arquivos ou implementação.",
  "DEFINIÇÃO DE PRONTO: só marque como concluído o que estiver sustentado pelos arquivos entregues e pela conferência disponível. Separe mentalmente em concluído, pendente e bloqueado. Uma tela bonita sem ações ou dados reais é parcial, não um SaaS completo.",
  "EXPLICAÇÃO DE DEFEITO (use sempre que a pessoa relatar algo que falhou, sumiu, travou, voltou a acontecer, ou perguntar por que aconteceu): responda nesta ordem, em linguagem de dono do negócio, sem jargão:\n1) O que fazer agora — a ação exata, com o nome do botão e da tela, e o que acontece ao clicar.\n2) Por que aconteceu — a causa raiz de verdade, contada como história curta (o que mudou, qual etapa não avisou a outra, qual janela de tempo ficou aberta). Nunca invente causa: se não tiver certeza, diga o que você verificou e o que ainda não deu para verificar.\n3) Como fica blindado agora — o que passa a acontecer sozinho, sem ação dela, e o que continua dependendo de alguém.\n4) Como conferir — onde olhar para ter certeza (aba, campo de busca, status, número de identificação) e o que deve aparecer lá.\nFeche com uma frase de tranquilidade honesta. Se o assunto tiver dinheiro ou cliente esperando, a ação do item 1 vem antes de qualquer explicação.",
  "NUNCA DEIXE A PESSOA ÀS CEGAS: sempre que algo mudar de estado (pedido aprovado, item entregue, projeto publicado, dado salvo), diga onde esse item foi parar e como encontrá-lo depois. Se ele saiu de uma lista, explique para qual lista ou status ele foi. É proibido responder 'já está resolvido' sem dizer onde conferir.",
  "MUDANÇA SÓ VALE PUBLICADA: quando a alteração afetar um site que já está no ar, avise na mesma resposta, em uma frase, que a pessoa precisa publicar/atualizar para os visitantes receberem a nova versão — e diga que a prévia já mostra o resultado antes disso. Não deixe ela descobrir sozinha que o site público continuou igual.",
  "TOM NA HORA DA FALHA: comece reconhecendo o impacto em uma frase (cliente esperando, venda parada, tempo perdido), sem drama e sem se justificar longamente. Depois vá para a ação. Nunca culpe a pessoa, nunca diga 'tente novamente' como solução e nunca mande ela investigar por conta própria o que você pode verificar.",
].join("\n\n");

/**
 * Projeto trazido de fora (importado): tem código de servidor ou build próprio.
 * Nesses casos o certo é editar os arquivos originais, não exigir o banco
 * hospedado do FabyClaud nem recriar tudo em index.html.
 */
export function projetoExterno(arquivos: Record<string, string>) {
  const nomes = Object.keys(arquivos).filter(
    (n) => !n.startsWith("enviados/") && !n.startsWith("originais/"),
  );
  if (!nomes.length) return false;
  const temIndexRaiz = nomes.includes("index.html");
  const temCodigoDeFora = nomes.some(
    (n) =>
      /\.(py|rb|php|go|java|cs|jsx|tsx|vue|toml)$/i.test(n) ||
      /(^|\/)(package\.json|requirements[^/]*\.txt|pyproject\.toml|dockerfile)$/i.test(n),
  );
  return temCodigoDeFora && !temIndexRaiz;
}

// Fechamento tolerante: aceita </arquivo>, variações erradas que a IA às vezes
// escreve (</arcs>, </file>), o início do próximo arquivo, ou o fim do texto.
const PADRAO_ARQUIVO =
  /<arquivo\s+nome=(["'])(.*?)\1\s*>\n?([\s\S]*?)(?:<\/\s*(?:arquivos?|arqs?|arcs?|files?)\s*>|(?=<arquivo\s+nome=)|$)/gi;
const PADRAO_CODIGO_ANTIGO = /```(?:html|HTML)?\s*\n([\s\S]*?)```/;
const PADRAO_IMG_GERAR = /src=(["'])\s*gerar:\s*(.*?)\1/gi;
const PADRAO_CONSULTA = /\{\{\s*consultar:\s*(.*?)\s*\}\}/gi;
// Raciocínio interno: nunca aparece pro usuário (aceita variações de fechamento).
const PADRAO_PENSANDO =
  /<\s*(?:pensando|think|thinking|raciocinio|racioc[íi]nio)\s*>[\s\S]*?(?:<\/\s*(?:pensando|think|thinking|raciocinio|racioc[íi]nio)\s*>|$)/gi;

/** Remove o bloco de raciocínio interno do texto mostrado no chat. */
export function limparPensamento(texto: string) {
  return texto
    .replace(PADRAO_PENSANDO, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function montarPrompt(
  pedido: string,
  arquivosAtuais: Record<string, string>,
  extras?: {
    memoria?: string;
    agente?: string;
    api?: string;
    auth?: string;
    privado?: string;
    notas?: string;
    licoes?: string;
  },
) {
  const partes = [INSTRUCAO_PROJETO];
  const intencao = classificarPedido(pedido);
  if (extras?.api?.trim()) {
    partes.push(instrucaoNuvem(extras.api.trim(), extras.auth?.trim(), extras.privado?.trim()));
  }
  if (extras?.agente?.trim()) {
    partes.push(`--- Modo de trabalho (agente escolhido) ---\n${extras.agente.trim()}`);
  }
  if (extras?.memoria?.trim()) {
    partes.push(
      `--- Memória do usuário (preferências permanentes, respeite sempre) ---\n${extras.memoria.trim()}`,
    );
  }
  if (extras?.licoes?.trim()) {
    partes.push(
      [
        "--- Aprendizado da escola (regras conquistadas nos estudos diários, obrigatórias) ---",
        extras.licoes.trim(),
        "Estas regras vieram de erros reais e de estudo próprio: aplique todas antes de entregar e nunca repita um defeito já listado aqui.",
      ].join("\n"),
    );
  }
  if (extras?.notas?.trim()) {
    partes.push(
      [
        "--- Memória deste projeto (o que já foi feito e decidido) ---",
        extras.notas.trim(),
        "Use isso como verdade sobre o histórico: não repita algo já entregue, não desfaça decisões e não volte a propor caminhos que já falharam aqui.",
      ].join("\n"),
    );
  }
  const todos = Object.keys(arquivosAtuais ?? {});
  // Imagens enviadas pelo usuário ficam guardadas como "enviados/...": o conteúdo é
  // gigante (imagem embutida), então mostramos só o caminho para a IA usar no src.
  const enviados = todos.filter((n) => n.startsWith("enviados/"));
  if (enviados.length) {
    partes.push(
      `--- Imagens que o usuário enviou (já estão no projeto) ---\n${enviados
        .map((n) => `- ${n}`)
        .join(
          "\n",
        )}\nPara usar uma delas, escreva exatamente src="CAMINHO" (ex: src="${enviados[0]}") no HTML/CSS/JS. Nunca diga que trocou uma imagem sem ter alterado o src no arquivo entregue.`,
    );
  }
  const nomes = selecionarArquivosParaPedido(
    pedido,
    arquivosAtuais,
    todos.filter((n) => !n.startsWith("enviados/") && !n.startsWith("originais/")),
  );
  if (nomes.length) {
    partes.push(
      `--- Mapa completo do projeto (todos os arquivos foram considerados) ---\n${montarMapaProjeto(arquivosAtuais)}`,
    );
    const LIMITE_PROJETO = intencao === "analisar" ? 52_000 : 40_000;
    let restante = LIMITE_PROJETO;
    const blocos = nomes
      .map((nome) => {
        if (restante <= 0) return `<arquivo nome="${nome}">[conteúdo omitido por limite]</arquivo>`;
        const conteudo = arquivosAtuais[nome] ?? "";
        const trecho = conteudo.slice(0, Math.min(12_000, restante));
        restante -= trecho.length;
        return `<arquivo nome="${nome}">\n${trecho}${trecho.length < conteudo.length ? "\n[restante omitido por limite]" : ""}\n</arquivo>`;
      })
      .join("\n\n");
    partes.push(`--- Arquivos atuais do projeto ---\n${blocos}`);
  }
  if (intencao === "analisar") {
    partes.push(
      [
        "--- MODO DE ANÁLISE, SOMENTE LEITURA ---",
        "Não crie, reescreva nem devolva tags <arquivo>. Não diga que atualizou ou abriu a prévia.",
        "Explique o que este projeto realmente faz, como as partes se ligam, o que está comprovado e o que não foi possível provar sem executar o servidor original.",
        "Toda conclusão importante deve citar pelo menos um caminho real mostrado no mapa ou nos arquivos selecionados.",
        "Na auditoria, separe: pontos fortes comprovados, problemas comprovados com caminho do arquivo, riscos que exigem execução e próximos consertos em ordem de impacto.",
        "Não trate um HTML administrativo isolado como se fosse a aplicação inteira e não invente tecnologia, versão, comando ou funcionalidade.",
      ].join("\n"),
    );
  } else if (intencao === "recriar") {
    const inventario = inventarioReferencia(arquivosAtuais);
    partes.push(
      [
        "--- MODO RECRIAR COMO APLICAÇÃO WEB ---",
        "Trabalhe como um time inteiro numa única resposta, nesta ordem: 1) planejadora (lista o que a referência faz), 2) arquiteta (decide telas, dados e rotas), 3) designer (define layout, tipografia, cores e estados), 4) construtora (escreve os arquivos completos), 5) engenheira sênior revisora (relê procurando botão sem ação, id inexistente, lista que não carrega, formulário que não grava).",
        "O projeto acima é a REFERÊNCIA (especificação viva). Ele depende de um ambiente que não roda aqui, então sua tarefa é entregar uma versão web equivalente que abre direto no navegador.",
        "PROIBIDO perguntar qual tela, qual app ou pedir mais contexto: escolha a tela principal pelo mapa e pelos arquivos de interface e construa agora.",
        "PROIBIDO devolver os arquivos originais do projeto importado. Eles ficam intactos no Workspace.",
        "PROIBIDO entregar uma parte e chamar de pronto. Cobertura mínima: TODOS os itens do inventário abaixo precisam existir e funcionar na versão web. Se algum item ficar de fora, ele tem que aparecer no fim da resposta como pendência explícita — nunca em silêncio.",
        "Entregue poucos arquivos completos na raiz: index.html, styles.css e app.js (adicione outra página só se for essencial).",
        "Reproduza fielmente o que existir na referência: nome, navegação, seções, listas, formulários, textos e disposição visual. Se houver HTML/CSS de interface na referência, siga o visual dele.",
        "Toda ação visível precisa funcionar de verdade: navegação entre seções, formulários que gravam, listas que carregam do banco hospedado, editar e apagar reais. Nada de botão decorativo.",
        "Cada rota da referência que salvava ou lia dados vira uma chamada real ao banco hospedado (listar, criar, editar, apagar). Rota da referência sem equivalente na versão web = entrega incompleta.",
        "Antes de fechar, percorra o inventário item por item e confirme onde cada um está no código que você acabou de escrever.",
        inventario.texto,
        "Na resposta, em poucas linhas: diga que é uma versão web equivalente (não o projeto original executando), o que já funciona e o que ficou fora.",
      ].join("\n"),
    );
  } else if (intencao === "abrir") {
    partes.push(
      "--- MODO ABRIR/TESTAR ---\nNão altere arquivos. Diga claramente se a interface é estática, parcial ou depende do servidor original. Nunca afirme que executou Python, Node, FastAPI, Flask, React ou Vite.",
    );
  } else if (intencao === "conversar") {
    partes.push(
      [
        "--- MODO CONSULTA (pergunta livre) ---",
        "Responda como um colega experiente responderia: direto, em primeira pessoa, sem cabeçalhos de relatório.",
        "Sirva para qualquer assunto: dúvida técnica, ideia de produto, comparação de ferramentas, próximo passo, opinião.",
        "Quando o assunto envolver o que este sistema pode fazer, diga com honestidade: o que dá para fazer aqui, o que não dá (e por quê), e qual caminho possível chega perto do objetivo.",
        "Nunca invente recurso, número, comando ou serviço. Se não souber, diga que não sabe e o que faria para descobrir.",
        "Se faltar um dado essencial, faça uma única pergunta curta no fim — não uma lista de perguntas.",
        "Não devolva tags <arquivo>, não altere nada e não diga que mexeu na prévia. Se a pessoa quiser que você construa, ofereça em uma frase e espere o 'pode fazer'.",
        "Termine com uma sugestão prática do que vale fazer em seguida.",
      ].join("\n"),
    );
  }
  partes.push(`--- Pedido do usuário ---\n${pedido}`);
  return partes.join("\n\n");
}

export type IntencaoPedido = "analisar" | "alterar" | "abrir" | "conversar" | "recriar";

export type ItemHistorico = { role: "user" | "assistant"; conteudo: string };

/** Recupera a ação combinada quando a pessoa responde apenas "sim", "pode" etc. */
export function resolverPedidoContextual(pedido: string, historico: ItemHistorico[]) {
  const limpo = pedido.trim();
  let intencao = classificarPedido(limpo);
  const confirmacao =
    /^(?:sim|isso|pode|pode sim|pode fazer|fa[çc]a|manda|vamos|beleza|ok|claro|quero|bora|continue|continua)[.!\s]*$/i.test(
      limpo,
    );
  if (!confirmacao || intencao !== "conversar") {
    return { pedidoEfetivo: limpo, intencao, continuacao: false };
  }

  const ultimaResposta =
    [...historico]
      .reverse()
      .find((item) => item.role === "assistant")
      ?.conteudo.trim() ?? "";
  if (!ultimaResposta) return { pedidoEfetivo: limpo, intencao, continuacao: false };
  const ofereceuAcao =
    /(?:quer que eu|posso|diga ["“']?.+?["”']? e eu|se quiser[^.]{0,80}(?:fa[çc]o|monto|crio|corrijo|construo)|pr[oó]ximo passo[^.]{0,80}(?:criar|corrigir|montar|implementar|construir))/i.test(
      ultimaResposta,
    );
  if (!ofereceuAcao) return { pedidoEfetivo: limpo, intencao, continuacao: false };

  intencao = /vers[ãa]o web|recri(?:ar|o)|reconstruir|aplica[çc][ãa]o web/i.test(ultimaResposta)
    ? "recriar"
    : "alterar";
  return {
    pedidoEfetivo: `Execute agora a ação concreta que você ofereceu na resposta anterior. Não faça outra pergunta e não repita a oferta.\n\nResposta anterior:\n${ultimaResposta.slice(0, 3000)}`,
    intencao,
    continuacao: true,
  };
}

/** Fatos objetivos entregues à IA antes dela decidir como mexer no projeto. */
export function diagnosticarProjeto(arquivos: Record<string, string>, pedido: string, notas = "") {
  const nomes = Object.keys(arquivos).filter(
    (nome) => !nome.startsWith("enviados/") && !nome.startsWith("originais/"),
  );
  const mapa = montarMapaProjeto(arquivos).split("Árvore completa de caminhos:")[0]?.trim();
  const problemas = auditarArquivos(arquivos);
  const errosInformados = [
    ...pedido.matchAll(/(?:uncaught|typeerror|referenceerror|failed to|erro)[^\n]*/gi),
  ]
    .map((item) => item[0].trim())
    .slice(0, 6);
  return [
    "--- DIAGNÓSTICO AUTOMÁTICO ANTES DE AGIR ---",
    mapa,
    `Estado atual: ${nomes.length ? "projeto existente; preserve o que funciona" : "projeto novo; defina uma primeira versão completa e testável"}.`,
    problemas.length
      ? `Problemas detectáveis nos arquivos: ${problemas.slice(0, 8).join(" | ")}`
      : "Problemas detectáveis nos arquivos: nenhum pela conferência estática; isso não prova serviços externos.",
    errosInformados.length
      ? `Erros reais informados: ${errosInformados.join(" | ")}`
      : "Erros reais informados: nenhum neste pedido.",
    notas.trim()
      ? "Há histórico do projeto abaixo; não reabra itens já concluídos sem prova nova."
      : "Ainda não há decisões anteriores registradas.",
    "Antes de responder, defina internamente: objetivo, concluído comprovado, pendências, riscos, segurança, arquivos afetados, ordem de execução e critérios de pronto.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Separa leitura, alteração e tentativa de abrir antes de chamar qualquer IA. */
export function classificarPedido(pedido: string): IntencaoPedido {
  // Pergunta aberta ("dá pra fazer X?", "o que você sugere?") é consulta, não ordem de mudar código.
  const pergunta = /\?\s*$/.test(pedido.trim());
  const consulta =
    /\b(d[aá] pra|d[aá] para|é poss[íi]vel|posso|consigo|vale a pena|o que (?:voc[êe] )?(?:sugere|acha|recomenda)|qual (?:a )?melhor|por que|deveria|faz sentido|como fa[çc]o|serve pra)\b/i;
  if (pergunta && consulta.test(pedido)) return "conversar";
  // "recrie", "traga igual", "faça a versão web": construir equivalente web da referência.
  const recriar =
    /\b(recri[ea]|recriar|reconstru[ai]|reproduz[ai]|clon(?:e|ar)|refa[çc]a\s+igual|traga\s+igual|deixa\s+igual|igual\s+ao\s+(?:original|projeto)|vers[ãa]o\s+web|em\s+vers[ãa]o\s+web|como\s+(?:app|aplica[çc][ãa]o)\s+web)\b/i;
  if (recriar.test(pedido)) return "recriar";
  // "ponha na prévia", "traga do workspace": também é construir a versão web.
  const trazerParaPrevia =
    /\b(traga|trazer|traz|puxe|puxa|p[oõ]e|ponha|coloca|coloque|joga|jogue|bota|monte)\b[^.!?]{0,40}\b(pr[eé]via|previa|workspace|tela|navegador|no\s+ar)\b/i;
  if (trazerParaPrevia.test(pedido)) return "recriar";
  const alteracao =
    /\b(cri[ea]|criar|fa[çc]a|fazer|monte|construa|adicione|implemente|integre|conecte|corrija|conserte|arrume|altere|mude|troque|remova|exclua|atualize|refa[çc]a|melhore|transforme|desenvolva|gere)\b/i;
  if (alteracao.test(pedido)) return "alterar";
  if (
    /\b(analise|analisar|audite|auditoria|descreva|explique|entenda|estude|revise|para que serve|como funciona|estrutura)\b/i.test(
      pedido,
    )
  ) {
    return "analisar";
  }
  if (
    /\b(abra|abrir|rode|rodar|execute|executar|teste|testar|pr[eé]via|visualize)\b/i.test(pedido)
  ) {
    return "abrir";
  }
  return "conversar";
}

/** Resumo determinístico para a IA enxergar a árvore inteira sem receber 200 arquivos às cegas. */
export function montarMapaProjeto(arquivos: Record<string, string>) {
  const nomes = Object.keys(arquivos)
    .filter((nome) => !nome.startsWith("enviados/") && !nome.startsWith("originais/"))
    .sort();
  const extensoes = new Map<string, number>();
  const pastas = new Map<string, number>();
  for (const nome of nomes) {
    const ext = nome.match(/(\.[a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "sem extensão";
    extensoes.set(ext, (extensoes.get(ext) ?? 0) + 1);
    const pasta = nome.includes("/") ? (nome.split("/")[0] ?? "raiz") : "raiz";
    pastas.set(pasta, (pastas.get(pasta) ?? 0) + 1);
  }
  const tecnologias: string[] = [];
  const tem = (padrao: RegExp) => nomes.some((nome) => padrao.test(nome));
  const conteudo = (nome: string) => arquivos[nome] ?? "";
  if (tem(/(^|\/)pyproject\.toml$|(^|\/)requirements[^/]*\.txt$/i)) tecnologias.push("Python");
  if (nomes.some((n) => /\.py$/i.test(n) && /\bFastAPI\s*\(/.test(conteudo(n))))
    tecnologias.push("FastAPI");
  if (nomes.some((n) => /\.py$/i.test(n) && /\bFlask\s*\(/.test(conteudo(n))))
    tecnologias.push("Flask");
  if (tem(/(^|\/)package\.json$/i)) tecnologias.push("Node/JavaScript");
  if (nomes.some((n) => /package\.json$/i.test(n) && /["']react["']/.test(conteudo(n))))
    tecnologias.push("React");
  if (tem(/(^|\/)vite\.config\./i)) tecnologias.push("Vite");
  if (tem(/\.html?$/i)) tecnologias.push("HTML");
  const entradas = nomes.filter((nome) =>
    /(^|\/)(index\.html?|main\.py|app\.py|server\.[cm]?[jt]s|package\.json|pyproject\.toml|requirements[^/]*\.txt|readme\.md)$/i.test(
      nome,
    ),
  );
  const formatoContagem = (mapa: Map<string, number>) =>
    [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([nome, qtd]) => `${nome}: ${qtd}`)
      .join(", ");
  return [
    `Total: ${nomes.length} arquivos.`,
    `Tecnologias detectadas por evidência: ${tecnologias.join(", ") || "não identificadas"}.`,
    `Tipos: ${formatoContagem(extensoes)}.`,
    `Pastas principais: ${formatoContagem(pastas)}.`,
    `Possíveis pontos de entrada/configuração:\n${
      entradas
        .slice(0, 30)
        .map((n) => `- ${n}`)
        .join("\n") || "- nenhum detectado"
    }`,
    `Árvore completa de caminhos:\n${nomes.map((n) => `- ${n}`).join("\n")}`,
  ].join("\n");
}

function selecionarArquivosParaPedido(
  pedido: string,
  arquivos: Record<string, string>,
  nomes: string[],
) {
  const termos = new Set(
    pedido
      .toLowerCase()
      .split(/[^a-z0-9_.\-/áàâãéêíóôõúç]+/i)
      .filter((termo) => termo.length >= 4),
  );
  const pontuar = (nome: string) => {
    const baixo = nome.toLowerCase();
    let pontos = 0;
    if (
      /(^|\/)(readme\.md|pyproject\.toml|requirements[^/]*\.txt|package\.json|main\.py|app\.py|index\.html?|vite\.config\.[^/]+)$/i.test(
        nome,
      )
    )
      pontos += 120;
    if (/(^|\/)(api|application|src|routes?|admin_static)\//i.test(nome)) pontos += 35;
    for (const termo of termos) if (baixo.includes(termo)) pontos += 50;
    const tamanho = (arquivos[nome] ?? "").length;
    if (tamanho > 0 && tamanho < 20_000) pontos += 5;
    return pontos;
  };
  return [...nomes].sort((a, b) => pontuar(b) - pontuar(a) || a.localeCompare(b)).slice(0, 45);
}

export function extrairArquivos(resposta: string): {
  arquivos: Record<string, string>;
  texto: string;
} {
  const arquivos: Record<string, string> = {};
  const partes: string[] = [];
  let ultimoFim = 0;

  PADRAO_ARQUIVO.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PADRAO_ARQUIVO.exec(resposta)) !== null) {
    partes.push(resposta.slice(ultimoFim, m.index));
    const nome = (m[2] ?? "").trim();
    const conteudo = (m[3] ?? "").trim();
    if (nome && conteudo) arquivos[nome] = conteudo;
    ultimoFim = m.index + m[0].length;
  }
  partes.push(resposta.slice(ultimoFim));
  const texto = limparPensamento(partes.join(""));

  if (Object.keys(arquivos).length) {
    return { arquivos, texto: texto || "Projeto atualizado! Veja a prévia ao lado." };
  }

  const m2 = PADRAO_CODIGO_ANTIGO.exec(resposta);
  if (m2) {
    const texto2 = limparPensamento(
      resposta.slice(0, m2.index) + resposta.slice(m2.index + m2[0].length),
    );
    return {
      arquivos: { "index.html": (m2[1] ?? "").trim() },
      texto: texto2 || "Projeto atualizado! Veja a prévia ao lado.",
    };
  }

  return { arquivos: {}, texto: limparPensamento(resposta) || resposta.trim() };
}

function crc32(texto: string) {
  const bytes = new TextEncoder().encode(texto);
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Troca <img src="gerar:descrição"> por uma imagem real da Pollinations.ai (grátis, sem chave). */
export function substituirGeradoresDeImagem(codigo: string, largura = 1024, altura = 768) {
  return codigo.replace(PADRAO_IMG_GERAR, (todo, aspas: string, descricao: string) => {
    const desc = descricao.trim();
    if (!desc) return todo;
    const seed = crc32(desc) % 1_000_000;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(desc)}?width=${largura}&height=${altura}&seed=${seed}&nologo=true`;
    return `src=${aspas}${url}${aspas}`;
  });
}

async function consultarDuckDuckGo(pergunta: string): Promise<string | null> {
  try {
    const url = new URL("https://api.duckduckgo.com/");
    url.searchParams.set("q", pergunta);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");
    url.searchParams.set("skip_disambig", "1");
    const r = await fetch(url, { headers: { "User-Agent": "FabyClaud/1.0" } });
    if (!r.ok) return null;
    const data = (await r.json()) as Record<string, unknown>;
    for (const campo of ["Answer", "AbstractText", "Definition"]) {
      const valor = data[campo];
      if (typeof valor === "string" && valor.trim()) return valor.trim();
    }
    const relacionados = data["RelatedTopics"];
    if (Array.isArray(relacionados)) {
      for (const item of relacionados) {
        const texto = (item as Record<string, unknown>)?.["Text"];
        if (typeof texto === "string" && texto.trim()) return texto.trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function resolverConsultas(codigo: string) {
  const perguntas = [...codigo.matchAll(PADRAO_CONSULTA)].map((m) => (m[1] ?? "").trim());
  if (!perguntas.length) return codigo;

  const unicas = [...new Set(perguntas)].slice(0, 6);
  const respostas = new Map<string, string>();
  await Promise.all(
    unicas.map(async (p) => {
      const r = await consultarDuckDuckGo(p);
      if (r) respostas.set(p, r);
    }),
  );

  return codigo.replace(PADRAO_CONSULTA, (_todo, pergunta: string) => {
    const chave = pergunta.trim();
    return respostas.get(chave) ?? "";
  });
}

/** Resolve marcadores de imagem e consulta em cada arquivo devolvido pela IA. */
export async function processarArquivos(arquivos: Record<string, string>) {
  const saida: Record<string, string> = {};
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    saida[nome] = await resolverConsultas(substituirGeradoresDeImagem(conteudo));
  }
  return saida;
}

/**
 * Conferência automática (determinística, sem gastar IA): relê os arquivos
 * entregues procurando os erros clássicos que fazem um projeto "parecer pronto"
 * e não funcionar. Devolve a lista de problemas em português, pronta para ser
 * entregue à IA revisora.
 */
/** Só o nome do arquivo, sem pastas. */
function base(caminho: string) {
  return caminho.split("/").pop() ?? caminho;
}

/** Arquivos que rodam no servidor (não devem ser carregados por <script> no HTML). */
function ehArquivoDeServidor(caminho: string) {
  return (
    /^(backend|server|servidor|api|src\/server)\//i.test(caminho) ||
    /\.(sql|env|example)$/i.test(caminho) ||
    /(^|\/)(server|db|database|conexao|pool|routes?|controllers?|models?)\.(js|ts|mjs|cjs)$/i.test(
      caminho,
    ) ||
    /(^|\/)package(-lock)?\.json$/i.test(caminho)
  );
}

/** Distingue conversa de um pedido que obrigatoriamente precisa alterar arquivos. */
export function pedidoExigeArquivos(pedido: string) {
  const intencao = classificarPedido(pedido);
  // Recriar sempre precisa terminar em arquivos: é o pedido de "traga igual, quero ver funcionando".
  if (intencao === "recriar") return true;
  if (intencao !== "alterar") return false;
  const acao =
    /\b(cri[ea]|criar|fa[çc]a|fazer|monte|construa|adicione|implemente|integre|conecte|corrija|conserte|arrume|altere|mude|troque|remova|exclua|atualize|refa[çc]a|melhore|transforme|desenvolva|gere)\b/i;
  const alvo =
    /\b(site|sistema|app|aplicativo|projeto|c[oó]digo|arquivo|html|css|javascript|script|bot[aã]o|link|menu|navega[çc][aã]o|frontend|backend|servidor|api|banco|sql|login|cadastro|tela|p[aá]gina|modal|formul[aá]rio)\b/i;
  const exigencia =
    /\b(nenhum|nada)\b.{0,35}\b(fake|falso|quebrado|parado)|\b(precisa|tem que|deve)\b.{0,50}\b(funcionar|abrir|salvar|navegar|conectar)/i;
  // Ordem curta e direta ("corrija", "melhore", "arrume isso") não cita alvo, mas
  // é ordem de mexer no projeto: aceitar só texto aqui era o falso sucesso clássico.
  const curto = pedido.trim().split(/\s+/).length <= 6;
  if (curto && acao.test(pedido)) return true;
  return alvo.test(pedido) && (acao.test(pedido) || exigencia.test(pedido));
}

/** Pedidos assim não podem ser considerados completos sem servidor, conexão e SQL reais. */
export function pedidoExigeBackend(pedido: string) {
  const alvo =
    /\b(backend|servidor|banco de dados|sql|api|login|cadastro|cadastrar|conta|usu[aá]rios?|salvar|salve|salvo|guardar|persist\w*|coment[aá]rios?|recados?|postagens?|posts?|publica[çc][õo]es|produtos?|pedidos?|estoque|clientes?|crud)\b/i;
  const acao =
    /\b(cri[ea]|fa[çc]a|monte|construa|adicione|implemente|integre|conecte|corrija|altere|mude|mexer|transforme|desenvolva|gere|permita|deixe)\b/i;
  return alvo.test(pedido) && acao.test(pedido);
}

export function pedidoExigeAutenticacaoPrivada(pedido: string) {
  return /\b(login|cadastro|cadastrar|criar conta|senha|recuperar senha|[áa]rea privada|dados por usu[aá]rio|perfil privado|autentica[çc][ãa]o)\b/i.test(
    pedido,
  );
}

/**
 * Conferência do banco hospedado: o frontend precisa realmente falar com a API
 * da nuvem FabyClaud, e não fingir persistência no navegador.
 */
export function problemasDeBanco(arquivos: Record<string, string>): string[] {
  const problemas: string[] = [];
  const codigoFront = Object.entries(arquivos)
    .filter(
      ([nome]) =>
        !nome.startsWith("enviados/") &&
        !nome.startsWith("originais/") &&
        !ehArquivoDeServidor(nome),
    )
    .map(([, conteudo]) => conteudo)
    .join("\n");

  if (!codigoFront.trim()) return problemas;

  if (!usaBancoHospedado(codigoFront)) {
    problemas.push(
      'O projeto não chama a api do banco de dados hospedado (falta const API = "%%FABY_API%%" e as chamadas fetch de listar/criar/editar/apagar).',
    );
    return problemas;
  }

  const usaFetch = /fetch\s*\(/.test(codigoFront);
  if (!usaFetch) {
    problemas.push("O endereço do banco aparece no código, mas nenhuma chamada fetch foi escrita.");
  }
  if (usaFetch && !/method\s*:\s*(["'])POST\1/i.test(codigoFront) && /<form\b/i.test(codigoFront)) {
    problemas.push(
      "Há formulário no projeto, mas nada é gravado no banco de dados (falta a chamada POST).",
    );
  }
  // localStorage fingindo ser banco: guardar listas inteiras de registros.
  const salvaListaNoNavegador =
    /localStorage\.setItem\(\s*(["'`])(?!tema|theme|logado|usuario_logado|sessao|token)[^"'`]*\1\s*,\s*JSON\.stringify\(\s*(?!\{\s*id)/i.test(
      codigoFront,
    );
  if (salvaListaNoNavegador && !/catch|offline/i.test(codigoFront)) {
    problemas.push(
      "O projeto guarda a lista de registros no navegador (localStorage) em vez de gravar no banco de dados hospedado.",
    );
  }
  return problemas;
}

export function problemasDeAutenticacao(arquivos: Record<string, string>): string[] {
  const codigo = Object.entries(arquivos)
    .filter(
      ([nome]) =>
        !nome.startsWith("enviados/") &&
        !nome.startsWith("originais/") &&
        !ehArquivoDeServidor(nome),
    )
    .map(([, conteudo]) => conteudo)
    .join("\n");
  const problemas: string[] = [];
  if (!usaAutenticacaoPrivada(codigo))
    problemas.push("O app não chama a autenticação privada com sessão Bearer.");
  if (!/acao\s*:\s*["'`]cadastro/i.test(codigo) || !/acao\s*:\s*["'`]entrar/i.test(codigo))
    problemas.push("Faltam cadastro e entrada reais na autenticação do app.");
  if (
    /localStorage\.setItem\([^,]+,\s*(?:senha|password)|localStorage[^\n]{0,100}senha/i.test(codigo)
  )
    problemas.push("O app tenta guardar senha no navegador.");
  return problemas;
}

export function problemasCriticos(problemas: string[]) {
  return problemas.filter((problema) =>
    /falta o arquivo|aponta para|não foi entregue|não carrega|backend foi citado|falta o backend|falta o arquivo \.sql|falta o arquivo de conexão|não chama a api|nenhuma chamada fetch|nada é gravado no banco|em vez de gravar no banco|não existe no javascript|não existe no html|botão sem ação|arquivo vazio|arquivo .*incompleto|trecho omitido/i.test(
      problema,
    ),
  );
}

export function auditarArquivos(arquivos: Record<string, string>): string[] {
  const problemas: string[] = [];
  const nomes = Object.keys(arquivos);
  const index = arquivos["index.html"];

  if (!index) {
    if (nomes.length) problemas.push('Falta o arquivo "index.html" (é o que abre no navegador).');
    return problemas;
  }

  // Uma aplicação importada pode conter várias telas independentes. A auditoria
  // do index principal não pode misturar HTML/JS de painéis, exemplos ou docs.
  const pastaIndex = index ? "" : "";
  const htmls = nomes.filter((n) => /\.html?$/i.test(n) && pastaDoArquivo(n) === pastaIndex);
  const todoHtml = htmls.map((n) => arquivos[n] ?? "").join("\n");

  for (const nome of nomes) {
    if (!(arquivos[nome] ?? "").trim()) problemas.push(`O arquivo "${nome}" está vazio.`);
    if (/\[(?:conteúdo|restante) omitido por limite\]/i.test(arquivos[nome] ?? "")) {
      problemas.push(`O arquivo "${nome}" está incompleto porque contém um trecho omitido.`);
    }
  }

  // 1. Referências a arquivos que não existem + arquivos entregues sem serem usados.
  const referenciados = new Set<string>();
  for (const m of todoHtml.matchAll(/(?:href|src)=(["'])([^"']+)\1/gi)) {
    const alvo = (m[2] ?? "").trim();
    if (!alvo || /^(https?:|data:|blob:|mailto:|tel:|#|\/\/)/i.test(alvo)) continue;
    // Trechos dinâmicos (template do JS) não são arquivos.
    if (/[${}]|\{\{/.test(alvo)) continue;
    const limpo = alvo.replace(/^\.?\//, "").split(/[?#]/)[0] ?? "";
    referenciados.add(limpo);
    referenciados.add(base(limpo));
    if (limpo && !nomes.some((n) => n === limpo || base(n) === base(limpo))) {
      problemas.push(`O HTML aponta para "${limpo}", mas esse arquivo não foi entregue.`);
    }
  }
  for (const nome of nomes) {
    if (ehArquivoDeServidor(nome)) continue; // roda no servidor, não no navegador
    if (/\.(css|js)$/i.test(nome) && !referenciados.has(nome) && !referenciados.has(base(nome))) {
      problemas.push(
        `O arquivo "${nome}" foi entregue mas nenhum HTML o carrega (falta <link> ou <script>).`,
      );
    }
  }

  // 1b. Backend entregue pela metade.
  const temBackend = nomes.some((n) => ehArquivoDeServidor(n));
  if (temBackend) {
    const arquivoServidor = nomes.find(
      (n) => /(^|\/)(server|app|index)\.(js|ts|mjs|cjs)$/i.test(n) && ehArquivoDeServidor(n),
    );
    const codigoServidor = arquivoServidor ? (arquivos[arquivoServidor] ?? "") : "";
    const temServidor =
      Boolean(arquivoServidor) &&
      /\b(?:app|router)\s*\.\s*(?:get|post|put|patch|delete)\s*\(/i.test(codigoServidor);
    const temPacote = nomes.some((n) => /(^|\/)package\.json$/i.test(n));
    const temSql = nomes.some((n) => /\.sql$/i.test(n));
    const temConexao = nomes.some((n) => /(^|\/)(db|database|conexao|pool)\.(js|ts)$/i.test(n));
    if (!temServidor)
      problemas.push(
        "O backend foi citado, mas falta um arquivo de servidor com rotas REST reais (GET/POST/PUT/DELETE).",
      );
    if (!temPacote)
      problemas.push("Falta o backend/package.json com as dependências e o script start.");
    if (!temSql) problemas.push("Falta o arquivo .sql com os CREATE TABLE do banco de dados real.");
    if (!temConexao)
      problemas.push(
        "Falta o arquivo de conexão real com o banco (backend/db.js abrindo pg ou better-sqlite3).",
      );
    const jsFront = nomes
      .filter((n) => /\.js$/i.test(n) && !ehArquivoDeServidor(n))
      .map((n) => arquivos[n] ?? "")
      .concat(todoHtml)
      .join("\n");
    if (!/fetch\s*\(/.test(jsFront)) {
      problemas.push(
        "O frontend não chama a API do backend com fetch — o sistema ficou pela metade (backend entregue, tela ainda só no navegador).",
      );
    }
  }

  // 2. Funções chamadas em onclick/oninput que não existem no JS.
  const scriptsLigados = new Set<string>();
  for (const m of todoHtml.matchAll(/<script[^>]*\ssrc=(["'])([^"']+)\1[^>]*>/gi)) {
    const alvo = (m[2] ?? "").replace(/^\.?\//, "").split(/[?#]/)[0] ?? "";
    if (alvo) scriptsLigados.add(alvo);
  }
  const js = nomes
    .filter(
      (n) =>
        /\.js$/i.test(n) &&
        (pastaDoArquivo(n) === pastaIndex || scriptsLigados.has(n) || scriptsLigados.has(base(n))),
    )
    .map((n) => arquivos[n] ?? "")
    .concat(
      [...todoHtml.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
        (m) => m[1] ?? "",
      ),
    )
    .join("\n");

  const chamadasInline = new Set<string>();
  for (const m of todoHtml.matchAll(/\son[a-z]+=(["'])([^"']*)\1/gi)) {
    for (const c of (m[2] ?? "").matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) {
      const fn = c[1] ?? "";
      if (!["if", "for", "while", "return", "alert", "confirm", "prompt"].includes(fn)) {
        chamadasInline.add(fn);
      }
    }
  }
  for (const fn of chamadasInline) {
    const existe = new RegExp(
      `(function\\s+${fn}\\b|\\b(?:const|let|var)\\s+${fn}\\s*=|\\b${fn}\\s*:\\s*(?:function|\\()|window\\.${fn}\\s*=)`,
    ).test(js);
    if (!existe) {
      problemas.push(`O HTML chama a função "${fn}()", mas ela não existe no JavaScript.`);
    }
  }

  // 3. Ids usados no JS que não existem no HTML.
  const idsHtml = new Set(
    [...todoHtml.matchAll(/\sid=(["'])([^"']+)\1/gi)].map((m) => (m[2] ?? "").trim()),
  );
  const idsJs = new Set<string>();
  for (const m of js.matchAll(/getElementById\(\s*(["'`])([^"'`]+)\1\s*\)/g)) {
    idsJs.add(m[2] ?? "");
  }
  for (const m of js.matchAll(/querySelector(?:All)?\(\s*(["'`])#([\w-]+)\1\s*\)/g)) {
    idsJs.add(m[2] ?? "");
  }
  for (const id of idsJs) {
    if (/[${}]/.test(id)) continue; // id montado em tempo de execução
    if (id && !idsHtml.has(id)) {
      problemas.push(`O JavaScript procura o elemento de id "${id}", que não existe no HTML.`);
    }
  }

  // 4. Links e botões mortos / placeholders de "em breve".
  const mortos = [...todoHtml.matchAll(/<a\b[^>]*href=(["'])\s*(?:#|javascript:void\(0\))\s*\1/gi)];
  if (mortos.length > 2) {
    problemas.push(`Existem ${mortos.length} links sem destino real (href="#").`);
  }
  if (/em breve|coming soon|lorem ipsum|TODO\b/i.test(todoHtml)) {
    problemas.push('O projeto tem texto de rascunho ("em breve", "lorem ipsum" ou "TODO").');
  }

  // 4b. Cada botão precisa estar ligado a formulário ou a uma ação no JavaScript.
  const todosBotoesLigados =
    /querySelector(?:All)?\(\s*(["'`])button(?:\[[^"'`]+\])?\1\s*\)[\s\S]{0,180}addEventListener/i.test(
      js,
    ) ||
    // Delegação de eventos: um listener no documento/body cuidando de todos os cliques.
    /(?:document|document\.body|window)\.addEventListener\(\s*(["'`])click\1[\s\S]{0,400}closest\(/i.test(
      js,
    ) ||
    /getElementsByTagName\(\s*(["'`])button\1\s*\)[\s\S]{0,180}addEventListener/i.test(js);
  for (const m of todoHtml.matchAll(/<button\b([^>]*)>/gi)) {
    const attrs = m[1] ?? "";
    if (
      todosBotoesLigados ||
      /\btype\s*=\s*(["'])submit\1/i.test(attrs) ||
      /\bonclick\s*=/i.test(attrs)
    )
      continue;
    const id = attrs.match(/\bid\s*=\s*(["'])([^"']+)\1/i)?.[2];
    const classes = (attrs.match(/\bclass\s*=\s*(["'])([^"']+)\1/i)?.[2] ?? "")
      .split(/\s+/)
      .filter(Boolean);
    const dados = [...attrs.matchAll(/\bdata-([\w-]+)(?:\s*=\s*(["'])([^"']*)\2)?/gi)];
    const ligadoPorId = id
      ? new RegExp(
          `(?:getElementById\\(\\s*["'\\x60]${escapeRegex(id)}["'\\x60]|querySelector(?:All)?\\(\\s*["'\\x60]#${escapeRegex(id)}["'\\x60])`,
        ).test(js)
      : false;
    const ligadoPorClasse = classes.some((classe) =>
      new RegExp(
        `querySelector(?:All)?\\(\\s*["'\\x60][^"'\\x60]*\\.${escapeRegex(classe)}(?:[.#:[\\s>]|["'\\x60])`,
      ).test(js),
    );
    const ligadoPorDado = dados.some((dado) => {
      const chave = dado[1] ?? "";
      const propriedade = chave.replace(/-([a-z])/g, (_todo, letra: string) => letra.toUpperCase());
      return new RegExp(
        `(?:dataset\\.${escapeRegex(propriedade)}|data-${escapeRegex(chave)})`,
      ).test(js);
    });
    if (!ligadoPorId && !ligadoPorClasse && !ligadoPorDado) {
      const depois = todoHtml.slice(m.index + m[0].length);
      const rotulo = (depois.match(/^\s*(?:<[^>]+>\s*)*([^<]{1,50})/i)?.[1] ?? "").trim();
      problemas.push(`Há um botão sem ação verificável${rotulo ? ` ("${rotulo}")` : ""}.`);
    }
  }

  for (const m of todoHtml.matchAll(/<a\b([^>]*)href=(["'])#([^"']+)\2[^>]*>/gi)) {
    const alvo = m[3] ?? "";
    if (
      alvo &&
      !idsHtml.has(alvo) &&
      !new RegExp(`["'\\x60]#${escapeRegex(alvo)}["'\\x60]`).test(js)
    ) {
      problemas.push(
        `Há um link interno para "#${alvo}", mas esse destino não existe no HTML nem na navegação.`,
      );
    }
  }

  // 5. Estrutura básica do HTML.
  for (const nome of htmls) {
    const c = arquivos[nome] ?? "";
    for (const tag of ["html", "head", "body"]) {
      const abre = (c.match(new RegExp(`<${tag}\\b`, "gi")) ?? []).length;
      const fecha = (c.match(new RegExp(`</${tag}>`, "gi")) ?? []).length;
      if (abre && abre !== fecha) {
        problemas.push(`Em "${nome}" a tag <${tag}> não está fechada corretamente.`);
      }
    }
    for (const tag of ["div", "section", "main", "form", "ul", "table"]) {
      const abre = (c.match(new RegExp(`<${tag}\\b`, "gi")) ?? []).length;
      const fecha = (c.match(new RegExp(`</${tag}>`, "gi")) ?? []).length;
      if (abre > fecha) {
        problemas.push(
          `Em "${nome}" há ${abre - fecha} tag(s) <${tag}> abertas sem fechamento correspondente.`,
        );
      }
    }
  }

  // 6. Formulários sem validação nenhuma.
  for (const m of todoHtml.matchAll(/<form\b[\s\S]*?<\/form>/gi)) {
    const bloco = m[0] ?? "";
    if (/<input\b/i.test(bloco) && !/required|novalidate|addEventListener|onsubmit/i.test(bloco)) {
      problemas.push("Há um formulário com campos sem nenhuma validação (required ou no JS).");
      break;
    }
  }

  return [...new Set(problemas)].slice(0, 25);
}

function escapeRegex(valor: string) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pastaDoArquivo(nome: string) {
  return nome.includes("/") ? nome.slice(0, nome.lastIndexOf("/") + 1) : "";
}

/**
 * Inventário da referência: lista determinística do que o projeto original faz
 * (telas, navegação, seções, formulários, botões, rotas e dados). É o contrato
 * que a versão web precisa cobrir — sem isso a IA recria só um pedaço bonito.
 */
export type Inventario = { itens: string[]; texto: string };

export function inventarioReferencia(arquivos: Record<string, string>): Inventario {
  const nomes = Object.keys(arquivos).filter(
    (n) => !n.startsWith("enviados/") && !n.startsWith("originais/"),
  );
  const html = nomes.filter((n) => /\.html?$/i.test(n));
  const codigo = nomes.filter((n) => /\.(py|js|mjs|cjs|ts|tsx|rb|php|go)$/i.test(n));
  const limpar = (v: string) =>
    v
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const telas: string[] = [];
  const navegacao = new Set<string>();
  const secoes = new Set<string>();
  const botoes = new Set<string>();
  const campos = new Set<string>();
  const rotas = new Set<string>();
  const dados = new Set<string>();
  let formularios = 0;

  for (const nome of html) {
    const c = arquivos[nome] ?? "";
    const titulo = limpar(c.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    telas.push(`${nome}${titulo ? ` (título: ${titulo})` : ""}`);
    for (const m of c.matchAll(/<a\b[^>]*>([\s\S]{1,60}?)<\/a>/gi)) {
      const texto = limpar(m[1] ?? "");
      if (texto.length >= 3) navegacao.add(texto);
    }
    for (const m of c.matchAll(/<h([1-3])[^>]*>([\s\S]{1,80}?)<\/h\1>/gi)) {
      const texto = limpar(m[2] ?? "");
      if (texto.length >= 3) secoes.add(texto);
    }
    for (const m of c.matchAll(/<button\b[^>]*>([\s\S]{1,60}?)<\/button>/gi)) {
      const texto = limpar(m[1] ?? "");
      if (texto.length >= 2) botoes.add(texto);
    }
    for (const m of c.matchAll(/<input\b[^>]*\bname=(["'])([^"']+)\1/gi)) {
      campos.add(m[2] ?? "");
    }
    formularios += (c.match(/<form\b/gi) ?? []).length;
  }

  for (const nome of codigo) {
    const c = arquivos[nome] ?? "";
    for (const m of c.matchAll(
      /@[\w.]*(?:route|get|post|put|patch|delete)\(\s*(["'])([^"']+)\1|\b(?:app|router|api)\s*\.\s*(get|post|put|patch|delete)\s*\(\s*(["'])([^"']+)\4/gi,
    )) {
      const caminho = m[2] ?? m[5] ?? "";
      if (caminho) rotas.add(caminho);
    }
    for (const m of c.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([\w.]+)/gi)) {
      dados.add(m[1] ?? "");
    }
    for (const m of c.matchAll(/class\s+(\w+)\s*\([^)]*(?:Model|Base)[^)]*\)/g)) {
      dados.add(m[1] ?? "");
    }
  }

  const lista = (titulo: string, valores: string[], max = 14) =>
    valores.length ? `${titulo}: ${valores.slice(0, max).join(" | ")}` : "";

  const itens = [
    ...[...navegacao].slice(0, 14),
    ...[...secoes].slice(0, 14),
    ...[...botoes].slice(0, 14),
  ];

  const texto = [
    "--- INVENTÁRIO DA REFERÊNCIA (cobertura obrigatória) ---",
    lista("Telas/templates", telas, 20),
    lista("Navegação e links", [...navegacao]),
    lista("Seções e títulos", [...secoes]),
    lista("Botões e ações", [...botoes]),
    lista("Campos de formulário", [...campos], 20),
    formularios
      ? `Formulários na referência: ${formularios} (cada um precisa gravar de verdade)`
      : "",
    lista("Rotas do servidor original", [...rotas], 24),
    lista("Tabelas/modelos de dados", [...dados], 20),
    itens.length
      ? "Regra: cada item acima precisa existir e funcionar na versão web, ou ser declarado como pendência no fim da resposta."
      : "A referência não trouxe interface detectável: construa a tela principal completa a partir do código e das rotas.",
  ]
    .filter(Boolean)
    .join("\n");

  return { itens, texto };
}

/** Compara a entrega com o inventário e aponta o que ficou de fora. */
export function coberturaRecriacao(
  inventario: Inventario,
  entregues: Record<string, string>,
): string[] {
  if (!inventario.itens.length) return [];
  const frente = Object.entries(entregues)
    .filter(
      ([nome]) =>
        !nome.startsWith("enviados/") &&
        !nome.startsWith("originais/") &&
        !ehArquivoDeServidor(nome),
    )
    .map(([, c]) => c)
    .join("\n")
    .toLowerCase();
  if (!frente.trim()) return [];
  const faltando = inventario.itens.filter((item) => {
    const chave = item.toLowerCase().trim();
    if (chave.length < 3) return false;
    if (frente.includes(chave)) return false;
    // aceita quando as palavras principais aparecem, mesmo com texto reescrito
    const palavras = chave.split(/[^a-z0-9áàâãéêíóôõúç]+/i).filter((p) => p.length >= 4);
    if (!palavras.length) return false;
    return !palavras.every((p) => frente.includes(p));
  });
  return faltando
    .slice(0, 10)
    .map((item) => `Faltou reproduzir "${item}" que existe no projeto de referência.`);
}
