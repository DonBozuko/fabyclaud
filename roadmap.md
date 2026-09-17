# Roadmap

- [x] Auditar a cadeia completa de geração e eliminar respostas simuladas
- [x] Validar chaves e capacidades antes de aceitar cada pedido
- [x] Garantir geração real de apps simples, começando por calculadora
- [x] Separar claramente backend real, prévia estática e recursos indisponíveis
- [x] Auditar busca web, geração de imagem e geração de vídeo
- [x] Verificar persistência, memória, agentes, prompts, docs, backups e workspace
- [x] Testar o acesso autenticado do editor e as barreiras públicas/privadas no navegador
- [ ] Persistir a orquestração por etapas com retomada e economia de tokens (etapas já são registradas; retomada ainda falta)
- [x] Bloquear publicação estática de projetos que dependem de servidor
- [ ] Validar código compatível em execução isolada temporária (motor de JavaScript criado; falta ligar à interface)
- [ ] Integrar contêiner externo para servidores Python/Node persistentes (bloqueado: serviço externo)
- [ ] Disponibilizar autenticação privada e perfil completo dentro dos apps gerados (API e geração ligadas; falta testar cadastro confirmado ponta a ponta)
- [ ] Impedir respostas textuais de alegarem alterações sem arquivos realmente salvos
- [ ] Preservar projetos importados e separar referência original da versão web equivalente
- [ ] Adaptar rotas relativas de projetos Flask na prévia sem fingir que o servidor está executando
- [ ] Corrigir o ciclo salvar, testar, selecionar e reutilizar todas as chaves cadastradas
- [ ] Persistir contexto estruturado do projeto para reduzir repetição e perda de decisões
