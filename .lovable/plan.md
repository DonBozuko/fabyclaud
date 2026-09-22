# Recuperar e provar o funcionamento do FabyClaud

## Objetivo
Corrigir a interrupção sem remover recursos, preservar projetos e chaves existentes e comprovar os fluxos principais na aplicação real.

## Diagnóstico já confirmado
- A construção completa e os testes de motor passam; a falha não é uma quebra geral de compilação.
- A revisão automática falha, principalmente por formatação, e ainda aponta dependências instáveis na tela principal.
- As chamadas atuais chegam ao servidor, porém retornam projetos e chaves vazios para a identidade local atual.
- Sessão local, identidade do dispositivo e conta real ainda são criadas/lidas em caminhos diferentes.
- Vários erros de leitura e gravação são descartados, produzindo listas vazias em vez de explicar a falha.

## Implementação
1. Unificar a identidade usada pela tela e pelas chamadas do servidor, sem apagar o identificador estável nem separar o usuário de seus dados existentes.
2. Tornar o modo local explícito e impedir que uma falha de nuvem pareça ausência real de projetos ou chaves.
3. Corrigir os fluxos principais de listar/abrir projeto, salvar arquivo, backup e configurações para preservarem dados e exibirem erros úteis.
4. Corrigir a estabilidade dos estados da tela principal sem alterar o visual.
5. Adicionar testes de regressão para identidade local, recuperação dos dados e falhas de persistência.

## Provas finais
- Executar verificação de tipos, revisão automática, todos os testes e construção completa.
- No navegador: abrir a aplicação, confirmar identidade, listar/abrir projeto, editar e salvar arquivo, validar prévia e backup, e conferir as configurações de IA.
- Enviar uma mensagem real somente se houver uma chave disponível e pronta, registrando o provedor e os arquivos gravados; caso contrário, comprovar o bloqueio claro sem fingir resposta.
