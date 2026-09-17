# Corrigir análise, memória e prévia de projetos importados

## Objetivo

Fazer o FabyClaud entender projetos grandes antes de responder, separar análise de alteração e nunca afirmar que uma aplicação foi aberta sem uma prévia realmente executável.

## Mudanças

- Criar três intenções explícitas para cada mensagem: **analisar**, **alterar** ou **abrir/testar**.
- Em pedidos de análise, não gerar arquivos nem acionar o bloqueio de entrega; produzir uma auditoria baseada nos arquivos reais, citando caminhos e evidências.
- Montar um mapa do projeto importado por estrutura, tecnologias, pontos de entrada, dependências e arquivos principais, em vez de enviar apenas os primeiros arquivos até o limite.
- Selecionar automaticamente os arquivos relevantes para cada pergunta e manter o contexto do projeto nas respostas seguintes.
- Restringir a auditoria de HTML/JavaScript à mesma aplicação/pasta, evitando comparar a página administrativa com scripts de outras telas.
- Classificar a prévia como: **funcionando no navegador**, **parcial**, ou **precisa do servidor original**; só usar “aberto” quando o conteúdo realmente puder ser renderizado.
- Para projetos Python/FastAPI/React/Vite importados, mostrar a interface estática disponível sem fingir que o servidor está rodando; oferecer criação de uma versão web compatível apenas quando a pessoa pedir alteração.
- Remover respostas genéricas e exigir que descrições e auditorias tragam provas concretas dos arquivos lidos.

## Verificação

- Importar um projeto grande com 200 arquivos e pedir “descreva e faça uma auditoria”: nenhuma prévia ou arquivo deve ser alterado.
- Confirmar que a resposta identifica a tecnologia, os pontos de entrada e cita arquivos reais.
- Confirmar que scripts de uma tela não são auditados contra o HTML de outra tela.
- Testar projetos HTML simples, React/Vite e Python/FastAPI e conferir que o estado da prévia é verdadeiro em cada caso.
- Testar um pedido posterior de alteração e confirmar que somente os arquivos relacionados mudam.
