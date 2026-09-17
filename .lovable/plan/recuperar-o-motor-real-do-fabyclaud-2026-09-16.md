# Recuperar o motor real do FabyClaud

## Objetivo

Parar a regressão atual: preservar o ZIP original, impedir afirmações falsas, fazer as chaves salvas entrarem nas chamadas reais e produzir uma versão web testável sem fingir que o Flask está rodando.

## Correções imediatas

- Separar no projeto os **arquivos originais importados** e os **arquivos da versão web**, sem sobrescrever nem misturar os dois.
- Tratar “recrie igual”, “traga do Workspace”, “corrija” e confirmações como pedidos de alteração obrigatória; resposta sem arquivos será rejeitada e não aparecerá como entrega.
- Remover a regra que exige a API de dados do FabyClaud ao corrigir um projeto externo quando o pedido não exige banco novo.
- Na prévia parcial de Flask, neutralizar chamadas relativas como `/api/projetos` e `/api/keys`, exibindo que dependem do servidor original; elas não poderão gerar erro enganoso nem ser chamadas de funcionais.
- Ao pedir uma versão web, criar arquivos web separados e conferir a cobertura contra telas, campos, botões e rotas encontradas no ZIP.

## Chaves de IA

- Manter as cinco ou mais chaves visíveis separadamente, com estado individual: salva, testando, pronta ou falhou com motivo.
- Salvar e testar numa única ação quando a pessoa colar uma chave; uma chave salva continua disponível mesmo antes do teste manual.
- Usar primeiro o provedor escolhido e depois as demais chaves salvas, sem descartar uma chave apenas porque uma tentativa ou modelo falhou.
- Diferenciar falha de chave, limite, modelo e conexão; só invalidar a chave quando a autenticação for realmente recusada.

## Memória e orquestração

- Criar contexto persistente estruturado por projeto: identidade do produto, arquivos originais, versão web, decisões, falhas observadas, tentativas e última versão válida.
- Retomar uma execução interrompida na etapa pendente, em vez de recomeçar e gastar chamadas.
- Usar etapas com bloqueios reais: diagnóstico, plano, alteração mínima, revisão, teste e entrega; nenhuma etapa poderá declarar sucesso sem evidência salva.
- Isso aproxima o comportamento de uma memória em grafo como Graphiti, mas sem prometer o plugin do Claude: será uma memória própria, baseada no banco já existente e nas relações entre decisões, arquivos e erros.

## Verificação

- Importar um ZIP Flask com `templates/index.html` e confirmar que os sete arquivos originais permanecem intactos.
- Pedir “recrie igual” e confirmar que só a versão web separada entra na prévia.
- Confirmar que nenhum `fetch('/api/...')` do Flask gera `Failed to parse URL` dentro da prévia.
- Alternar entre todas as chaves, salvar, testar e enviar um pedido; conferir qual provedor respondeu e o motivo de cada troca.
- Simular resposta sem arquivos, erro de sintaxe e interrupção; confirmar bloqueio, preservação da versão anterior e retomada sem reiniciar tudo.
- Conferir no computador e no celular.
