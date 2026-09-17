# Corrigir o OmniRoute local sem gastar chamadas em vão

## Objetivo

Fazer o FabyClaud usar o OmniRoute exatamente como ele funciona no computador do usuário: o comando `omniroute` abre o painel local e a API fica em `http://localhost:20128/v1`.

## Mudanças

- Criar um modo **OmniRoute neste computador** que faz a conexão pelo próprio navegador, porque o servidor online não consegue acessar o `localhost` do usuário.
- Aceitar e normalizar `http://localhost:20128`, `/home` ou `/v1`, sempre usando a API correta `/v1/chat/completions`.
- Testar primeiro `/v1/models` e uma resposta curta; só marcar a conexão como pronta quando ambos responderem.
- Guardar a chave local do OmniRoute somente neste navegador para permitir as chamadas locais; continuar guardando as demais chaves na conta.
- No chat, quando OmniRoute estiver selecionado, enviar o pedido pelo navegador ao OmniRoute local e só então entregar o resultado ao motor do FabyClaud.
- No Duelo, incluir o OmniRoute somente após o teste local real; se estiver desligado, ignorá-lo antes de gastar chamadas das outras IAs.
- Trocar as instruções por um fluxo fiel ao painel mostrado: executar `omniroute`, abrir `localhost:20128/home`, conectar provedores/combos, criar a chave em Gerenciador API e usar a base `/v1`.
- Remover referências a repositório e não exigir túnel no modo local. Manter uma opção separada de HTTPS público apenas para quem quiser usar em outro dispositivo.
- Exibir o erro exato de conexão/CORS/modelo sem tratar página HTML como resposta de IA.

## Validação

- Testar salvar e validar `http://localhost:20128` no navegador.
- Confirmar que o endpoint final é `/v1/chat/completions`, nunca `/home`.
- Confirmar que uma falha local não entra no Duelo nem dispara novas tentativas pagas.
- Conferir o chat normal, o Duelo e as outras chaves sem alterar o layout principal.

## Observação técnica

O painel em `/home` é a interface de configuração. A API usada pelo FabyClaud é `/v1`. Para o modo local funcionar, o OmniRoute precisa permitir a origem do FabyClaud nas configurações de CORS; a tela mostrará essa orientação somente se o navegador bloquear a chamada.
