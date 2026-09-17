# Abrir projetos reais do computador

## Objetivo

Fazer o FabyClaud abrir um projeto existente do PC de forma explícita e segura, sem gerar outro projeto no lugar e sem afirmar que abriu algo que não foi importado.

## Mudanças

- Adicionar **Abrir projeto** na área principal, aceitando uma pasta completa ou arquivo `.zip`.
- Ler os arquivos de código no navegador, ignorando pastas pesadas como `node_modules`, `.git`, ambientes Python e builds.
- Importar os arquivos preservando nomes e subpastas, selecionar imediatamente o projeto importado e mostrar a quantidade real de arquivos.
- Renomear o botão atual para **Abrir prévia**, eliminando a ambiguidade.
- Quando a pessoa escrever “abra este projeto” sem selecionar arquivos, responder honestamente pedindo a pasta ou ZIP, sem criar um painel genérico.
- Reconhecer projetos Python/Flask: importar e editar todos os arquivos, mas não fingir que o navegador executou `app.py`; a prévia só abre quando houver uma página web compatível.
- Aumentar com cuidado o limite de arquivos importados e mostrar quais arquivos foram ignorados.

## Verificação

- Importar uma pasta com subpastas e um ZIP.
- Confirmar que nenhum projeto genérico é criado.
- Confirmar que os arquivos aparecem no Workspace e o projeto selecionado é o importado.
- Confirmar que **Abrir prévia** continua funcionando para projetos com `index.html`.
- Conferir a tela em computador e celular.
