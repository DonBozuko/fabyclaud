<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Regras de Integridade do Motor Multi-IA e Continuidade de Projetos

1. **Proibição Absoluta de Troca de Projeto (Anti-Template Hijacking):**
   - Uma vez que um projeto possui arquivos, NENHUM comando subsequente pode substituir o projeto por templates locais estáticos (ex: transformar o projeto em calculadora, tarefas ou cronômetro).
   - Templates locais são restritos exclusivamente ao 1º turno de criação quando o projeto está 100% vazio e sem chaves configuradas.
   - Para projetos existentes com arquivos, qualquer modificação DEVE ser incremental e cirúrgica sobre os arquivos já presentes no Stateful VFS.

2. **Contrato de Entrega e Preservação de Identidade:**
   - O contrato de entrega da aplicação deve sempre manter o nome e identidade do projeto existente (extraído do título do HTML), nunca deduzir um novo produto a partir de palavras avulsas do comando.
   - Toda IA do time deve receber as instruções com status de evolução contínua, proibindo a reescrita destrutiva do zero.

3. **Sincronização da Equipe de IAs (Mecânicos Trabalhando em Conjunto):**
   - Múltiplas IAs operam como um time de mecânicos integrados: a IA que assume a rodada seguinte NUNCA pode recomeçar do zero ou desmanchar componentes, classes CSS e lógicas criadas pela IA anterior.
   - O histórico de chat multi-turn deve preservar as decisões arquiteturais e o sumário de arquivos, mantendo a integridade sintática e a continuidade entre turnos.

