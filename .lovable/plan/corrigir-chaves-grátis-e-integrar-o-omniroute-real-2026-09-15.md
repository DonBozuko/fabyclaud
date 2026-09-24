# Corrigir chaves e integrar o OmniRoute real

## Objetivo

Fazer o FabyClaud usar somente as opções corretas, sem confundir o OmniRoute local com serviços pagos.

## Mudanças

- Trocar a integração falsa/paga do OmniRoute pelo OmniRoute oficial mostrado na imagem.
- Mostrar nas configurações o comando obrigatório do terminal:
  - `npm install -g omniroute`
  - `omniroute`
- Explicar no próprio sistema que o painel abre em `localhost:20128`, onde o usuário conecta provedores e cria sua chave.
- Usar o roteamento `auto/coding`, para o OmniRoute escolher a melhor IA disponível para programação.
- Permitir cadastrar o endereço público seguro do OmniRoute quando o FabyClaud estiver aberto na internet; avisar claramente que `localhost` sozinho só funciona no computador e não pode ser acessado pelo servidor online.
- Remover o link e o endereço do serviço pago que foram associados incorretamente ao nome OmniRoute.
- Melhorar as mensagens de teste para distinguir: chave inválida, modelo indisponível, limite gratuito atingido e OmniRoute local inacessível.
- Preservar integralmente a tela principal e o funcionamento atual das outras IAs.

## Validação

- Conferir tipos e carregamento do sistema.
- Testar as configurações e as mensagens de erro sem expor nenhuma chave.
- Confirmar que o duelo só inclui uma IA quando o teste real dela responder.

## Observação técnica

Um site publicado não consegue alcançar diretamente o `localhost:20128` do usuário. Para uso online, o OmniRoute precisa fornecer um endereço HTTPS público/túnel, que será informado nas configurações junto da chave. Isso mantém o motor local e gratuito, sem redirecionar para um serviço pago.