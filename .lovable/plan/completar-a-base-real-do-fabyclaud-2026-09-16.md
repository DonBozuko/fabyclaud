# Completar a base real do FabyClaud

## Objetivo

Transformar o fluxo atual — hoje baseado principalmente em uma resposta de IA, revisão e prévia estática — em um processo persistente, verificável e econômico, preservando o que já funciona.

## 1. Autenticação privada nos aplicativos criados

- Criar contas de usuário por aplicativo com email, senha e perfil completo: nome, foto, função e preferências.
- Guardar os perfis e vínculos por projeto no banco, com acesso privado por usuário e regras que impeçam leitura cruzada entre aplicativos.
- Separar coleções públicas das privadas; dados privados sempre terão proprietário autenticado.
- Disponibilizar ao código gerado um cliente simples para cadastro, entrada, saída, sessão, perfil e operações privadas.
- Atualizar as instruções da FabyClaud para gerar telas de autenticação reais quando o pedido exigir, em vez de bloquear ou simular login.

## 2. Orquestração forte e persistente

- Criar uma execução registrada para cada pedido de construção, com etapas e estados próprios: diagnóstico, plano, construção, revisão, teste, correção e entrega.
- Persistir resultado, erro, tentativa, modelo usado e arquivos produzidos em cada etapa para permitir retomada sem começar do zero.
- Separar os papéis de planejadora, construtora e revisora; cada papel receberá somente o contexto necessário.
- Impedir que texto declarando sucesso avance a execução: somente arquivos salvos e verificações concluídas mudam o estado para pronto.
- Aplicar limites de tentativas e reutilizar diagnósticos para reduzir consumo de tokens.

## 3. Execução isolada com limites honestos

- Manter HTML/CSS/JavaScript em iframe isolado, sem acesso ao editor.
- Acrescentar execução isolada gratuita e temporária para validar pequenos programas e testes compatíveis, com tempo, tamanho e saída limitados.
- Classificar separadamente: prévia web executada, teste isolado concluído e servidor completo executado.
- Não apresentar Flask, Node com servidor, banco local ou processos persistentes como executados: a hospedagem atual não fornece contêiner persistente. Esses projetos continuarão bloqueados até existir um serviço externo de sandbox compatível.

## 4. Interface e transparência

- Mostrar no projeto a linha de execução com etapa atual, tentativas, erros e o que foi realmente comprovado.
- Exibir capacidades reais: autenticação privada disponível, prévia web isolada, teste de código isolado e servidor persistente indisponível.
- Remover mensagens que ainda descrevem login privado como indisponível depois da implantação.

## 5. Validação

- Testar cadastro, entrada, sessão, perfil e isolamento de dados entre dois usuários de um aplicativo.
- Testar retomada de uma execução interrompida e bloqueio de falso sucesso.
- Testar HTML isolado, um programa curto executável e um projeto Flask/Node corretamente identificado como não executado.
- Rodar os testes existentes para garantir que prévia, importação, publicação e armazenamento público não regrediram.

## Limite que permanece

O FabyClaud ficará mais próximo do Antigravity na organização, continuidade, testes e autenticação. Executar um servidor Python/Node completo e persistente exige um serviço de contêiner externo; não será disfarçado por uma prévia estática nem prometido como pronto sem essa infraestrutura.
