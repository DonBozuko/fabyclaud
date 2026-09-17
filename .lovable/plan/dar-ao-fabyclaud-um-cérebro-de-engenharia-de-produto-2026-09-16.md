# Dar ao FabyClaud um cérebro de engenharia de produto

## Objetivo

Fazer a IA assumir o projeto como um todo: entender a intenção mesmo em respostas curtas, analisar antes de agir, organizar o trabalho, executar o máximo possível e explicar em linguagem simples o que funciona, o que falta e o que está bloqueado.

## Mudanças

- Substituir a classificação isolada de cada frase por uma intenção contextual, usando o pedido atual, as últimas mensagens, o estado dos arquivos e a última ação oferecida pela IA.
- Tratar confirmações como “sim”, “pode”, “faça” e “manda” como continuação da proposta anterior, não como conversa nova.
- Adicionar um diagnóstico determinístico antes da chamada à IA: tecnologia, estado da prévia, erros capturados, arquivos relevantes, persistência, ações quebradas e limitações de execução.
- Incluir em toda tarefa de criação/correção um plano interno de engenharia: objetivo, trabalho já comprovado, pendências, riscos, segurança, arquivos afetados, ordem de execução e critérios de pronto.
- Fazer a IA agir por padrão quando houver informação suficiente; permitir no máximo uma pergunta curta somente quando uma decisão impossível de inferir impedir o trabalho.
- Manter uma lista viva de pendências por projeto na memória, separando concluído, em andamento, bloqueado e próximo passo. Uma entrega só fecha itens comprovados pelos arquivos e verificações.
- Corrigir a comunicação para pessoas não técnicas: falar do que aparece na tela e do que pode ser testado, sem mandar abrir terminal, editar arquivo ou investigar console quando o próprio sistema puder diagnosticar.
- Remover contradições que ainda mandam gerar servidor separado enquanto o produto exige funcionamento direto na prévia e banco hospedado.
- Quando uma entrega falhar, continuar automaticamente com outra abordagem dentro do limite disponível; ao parar, informar a causa real e o caminho restante, sem pedir que a pessoa “envie novamente”.
- Ampliar a validação para comparar pedido, plano e resultado: arquivos realmente alterados, prévia disponível, botões/rotas ligados, dados persistidos e nenhuma afirmação sem prova.

## Experiência esperada

Para “crie um SaaS como Lovable, grátis como Antigravity”, a IA deve:

1. Definir sozinha uma primeira versão coerente e segura.
2. Mostrar um resumo curto do plano e começar a construir sem interrogatório.
3. Preservar o que já funciona e organizar as pendências restantes.
4. Entregar uma parte utilizável e testável, sem chamar protótipo de sistema completo.
5. Continuar do ponto certo quando a pessoa responder apenas “sim”.

## Verificação

- Reproduzir a sequência “faça a versão web” → “sim” e confirmar que arquivos são gerados, sem resposta genérica.
- Testar pedido amplo de SaaS e confirmar que a IA escolhe uma primeira versão, executa e registra pendências sem perguntas desnecessárias.
- Testar erro real de `fetch` em projeto importado e confirmar correção no arquivo original ou conversão web explícita, nunca falsa execução do servidor.
- Confirmar que uma falha preserva a versão anterior, tenta outra abordagem e não manda o usuário repetir o pedido.
- Confirmar que o resumo final distingue: funcionando e testado, preparado mas não executável aqui, bloqueado e próximo passo.
