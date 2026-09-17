# Tornar o FabyClaud um construtor real e honesto

## Objetivo

Transformar o núcleo atual em um agente que só promete capacidades comprovadas, planeja antes de construir, usa as ferramentas certas sozinho e bloqueia entregas incompletas.

## O que a auditoria já comprovou

- O frontend principal, contas, projetos, mensagens, memória, agentes, prompts, backups e arquivos usam banco real.
- A criação por IA é BYOK: sem uma chave válida não existe modelo de texto/código disponível hoje.
- Chaves salvas, mas nunca testadas, ainda podem entrar no fluxo normal; isso causa comportamento inconsistente.
- A busca web existe, porém é limitada e depende de a própria IA pedir a ferramenta corretamente.
- Imagem usa um único serviço público gratuito, sem controle de qualidade ou alternativa.
- Vídeo não existe no produto atual.
- O “banco dos apps gerados” é um depósito público por endereço do projeto, sem usuários próprios nem isolamento por pessoa. Portanto não pode ser chamado de login real ou backend seguro.
- A auditoria atual verifica estrutura e alguns cliques, mas não prova regras do produto, segurança, persistência entre sessões ou fluxos completos.

## Implementação

### 1. Verdade operacional antes de qualquer pedido

- Criar um painel compacto de capacidades mostrando: IA conectada e testada, busca disponível, imagem disponível, vídeo indisponível e tipo de banco disponível.
- Só permitir que uma chave com teste bem-sucedido seja usada para gerar, revisar, estudar ou disputar duelo.
- Quando não houver IA pronta, não criar projeto nem prévia genérica. Mostrar a ação exata para conectar e testar uma chave.
- Remover textos absolutos como “sem limites” e qualquer promessa de recurso que dependa de chave, crédito ou serviço externo.

### 2. Planejador determinístico antes da IA

- Classificar o pedido por produto: conversa, pesquisa atual, criação de app, edição, correção, imagem, vídeo, importação ou publicação.
- Montar um contrato de entrega antes da geração: telas, ações, dados, integrações, critérios de pronto e recursos realmente disponíveis.
- Para pedidos simples conhecidos, como calculadora, usar um modelo funcional local e auditado quando não houver chave; nunca um cartão genérico.
- Para pedidos complexos sem IA pronta, explicar o bloqueio sem fabricar arquivos.

### 3. Orquestração forte

- Separar papéis reais: planejador cria critérios, construtor implementa, revisor confere contra os critérios e corretor só recebe falhas comprovadas.
- Exigir chave testada para cada participante e mostrar quem realmente executou cada etapa.
- Tornar busca web determinística quando o pedido exigir informação atual, em vez de esperar o modelo decidir pedir a ferramenta.
- Preservar tentativas, falhas e critérios no histórico do projeto para evitar repetir a mesma abordagem.

### 4. Banco e autenticação dos apps gerados

- Parar de chamar o armazenamento genérico atual de “login real”.
- Identificar cada app publicado com um acesso próprio e impedir leitura/escrita apenas por conhecer o endereço do projeto.
- Oferecer dois níveis honestos: dados públicos simples e app com conta/privacidade; pedidos de login privado só serão concluídos quando o segundo nível estiver realmente disponível.
- Atualizar os prompts e validadores para rejeitar senha em texto puro, comparação de senha no navegador e falsa sessão em `localStorage`.

### 5. Imagem, vídeo e pesquisa

- Imagem: baixar e guardar o arquivo gerado no projeto, validar se abriu e tentar uma alternativa quando a primeira geração falhar.
- Pesquisa: registrar fontes e data, distinguir busca atual de conhecimento geral e avisar quando não houver resultado confiável.
- Vídeo: mostrar “indisponível” até existir integração real. Depois adicionar como trabalho assíncrono, com progresso, falha e arquivo final; nunca simular vídeo com imagem ou botão falso.

### 6. Qualidade que mede o pedido, não só o HTML

- Para cada entrega, gerar testes baseados no pedido. Exemplo de calculadora: teclas numéricas, operações, decimal, limpar, divisão por zero e resultado correto.
- Testar prévia em navegador, rede, recarregamento e persistência; não aceitar apenas “clicou e mudou alguma coisa”.
- Bloquear gravação/publicação quando os critérios essenciais falharem e manter a última versão boa.
- Mostrar um relatório curto: funcionando e testado, limitado, bloqueado e próximo passo.

## Ordem de entrega

1. Bloqueio de chave não testada, painel de capacidades e remoção das promessas falsas.
2. Fluxo funcional sem chave para calculadora e outros utilitários locais seguros.
3. Planejador + critérios de pronto + testes específicos do pedido.
4. Segurança do banco dos apps gerados e separação clara entre dados públicos e privados.
5. Busca com fontes e imagem persistida com validação/fallback.
6. Vídeo real somente após confirmar um provedor sustentável; até lá permanece explicitamente indisponível.
7. Teste completo autenticado, incluindo “crie uma calculadora” sem chave e com chave testada.

## Critério final

O FabyClaud só dirá “pronto” quando o resultado existir, estiver salvo e passar nos testes do pedido. Qualquer capacidade ausente aparecerá como indisponível, nunca como uma tela de faz de conta.
