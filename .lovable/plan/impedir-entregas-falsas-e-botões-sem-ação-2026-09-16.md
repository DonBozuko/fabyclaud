# Impedir entregas falsas e botões sem ação

## Objetivo

Fazer o FabyClaud distinguir conversa de alteração real: uma resposta só poderá dizer que mudou o projeto quando arquivos válidos tiverem sido gerados, auditados e salvos.

## Mudanças

- Corrigir as instruções conflitantes que ainda mandam alguns agentes e prompts criarem apenas frontend ou tratarem `localStorage` como banco.
- Detectar pedidos de criação/correção e rejeitar respostas sem arquivos, arquivos vazios ou respostas que apenas prometem backend.
- Fazer uma tentativa automática de reparo quando a IA responder sem código, pedindo somente os arquivos completos necessários.
- Fortalecer a auditoria de navegação e ações para sinalizar botões e links sem ligação verificável no JavaScript.
- Não aplicar alterações que aumentem problemas críticos; manter os arquivos anteriores e informar claramente que nada foi alterado.
- Mostrar na conversa e em aviso visual se a prévia foi realmente atualizada ou se a IA apenas respondeu em texto.

## Regra de honestidade

O backend gerado será descrito como “arquivos preparados”, não “backend funcionando”, até existir uma API acessível e verificável. A prévia estática não será apresentada como prova de banco real.

## Validação

- Conferir os tipos do projeto.
- Abrir a aplicação e confirmar que carrega.
- Testar os cenários: resposta sem arquivos, correção com arquivos e projeto com botão sem ação.
