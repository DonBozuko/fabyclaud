# Graph Report - Dev Buddy  (2026-09-20)

## Corpus Check
- 144 files · ~80,764 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .toml 2, .lock 1)

## Summary
- 1136 nodes · 2095 edges · 61 communities (52 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67548cee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- builder.server.ts
- dependencies
- package.json
- cn
- sidebar.tsx
- preview.ts
- github.server.ts
- react
- routeTree.gen.ts
- client.server.ts
- navigation-menu.tsx
- pagination.tsx
- supabase/types.ts
- compilerOptions
- lucide-react
- auth.tsx
- providers.server.ts
- command.tsx
- components.json
- config.ts
- devDependencies
- menubar.tsx
- form.tsx
- index.tsx
- escola.server.ts
- carousel.tsx
- __root.tsx
- app-auth.$projeto.ts
- omniroute-local.ts
- ferramentas.server.ts
- chart.tsx
- dados.$projeto.$colecao.ts
- agents/types.ts
- opencode.json
- breadcrumb.tsx
- app-private.$projeto.$colecao.ts
- Implementação
- execucao-isolada.ts
- cron-auth.ts
- Completar a base real do FabyClaud
- faby.functions.ts
- bun-test.d.ts
- Recuperar o motor real do FabyClaud
- Corrigir chaves grátis e integrar o OmniRoute real
- Corrigir o OmniRoute local sem gastar chamadas em vão
- Impedir entregas falsas e botões sem ação
- Abrir projetos reais do computador
- Aproximar o FabyClaud do Antigravity sem perder a prévia
- Corrigir análise, memória e prévia de projetos importados
- graphify.js
- Welcome to your Lovable project
- JSZip
- Routes
- AGENTS.md
- @tanstack/react-router
- alert.tsx
- roadmap.md
- clsx.d.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 220 edges
2. `react` - 49 edges
3. `lucide-react` - 22 edges
4. `compilerOptions` - 22 edges
5. `FabyClaud()` - 21 edges
6. `CodeModifier` - 19 edges
7. `DirectoryReader` - 18 edges
8. `AgentManager` - 16 edges
9. `montarPreviewHtml()` - 15 edges
10. `enviarMensagem` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Verificação` --references--> `fetch()`  [INFERRED]
  .lovable/plan/dar-ao-fabyclaud-um-cérebro-de-engenharia-de-produto-2026-09-16.md → src/server.ts
- `AccordionItem` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/accordion.tsx → src/lib/utils.ts
- `AccordionTrigger` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/accordion.tsx → src/lib/utils.ts
- `AccordionContent` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/accordion.tsx → src/lib/utils.ts
- `AlertDialogOverlay` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (61 total, 9 thin omitted)

### Community 0 - "builder.server.ts"
Cohesion: 0.06
Nodes (58): ref_node_assert_strict, ref_node_test, AplicativoLocal, aplicativoLocalParaPedido(), auditarArquivos(), base(), classificarPedido(), coberturaRecriacao() (+50 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (55): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @hookform/resolvers, input-otp (+47 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (44): name, overrides, rolldown, private, scripts, build, build:dev, dev (+36 more)

### Community 3 - "cn"
Cohesion: 0.06
Nodes (50): @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, @radix-ui/react-select, vaul, Card, CardContent, CardDescription, CardFooter (+42 more)

### Community 4 - "sidebar.tsx"
Cohesion: 0.05
Nodes (44): Input, Separator, src_components_ui_sheet_sheet, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader() (+36 more)

### Community 5 - "preview.ts"
Cohesion: 0.09
Nodes (28): jszip, abrirProjetoEmNovaAba(), baixarProjetoZip(), classificarPreview(), ehTemplateDeServidor(), escaparRegex(), EstadoPreview, injetarNoHead() (+20 more)

### Community 6 - "github.server.ts"
Cohesion: 0.08
Nodes (31): @supabase/supabase-js, @tanstack/react-start, ref_tanstack_react_start_server, EXT_ZIP, Props, createSupabaseFetch(), isNewSupabaseApiKey(), requireSupabaseAuth (+23 more)

### Community 7 - "react"
Cohesion: 0.07
Nodes (25): clsx, @radix-ui/react-avatar, @radix-ui/react-hover-card, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-scroll-area, @radix-ui/react-slider, @radix-ui/react-switch (+17 more)

### Community 8 - "routeTree.gen.ts"
Cohesion: 0.13
Nodes (19): getRouter(), Route, Route, ApiPublicAppAuthProjetoRoute, ApiPublicAppPrivateProjetoColecaoRoute, ApiPublicDadosProjetoColecaoRoute, ApiPublicEstudarRoute, AuthRoute (+11 more)

### Community 9 - "client.server.ts"
Cohesion: 0.09
Nodes (22): GithubSecao(), Backups(), Docs(), Props, TITULOS, createSupabaseAdminClient(), createSupabaseFetch(), isNewSupabaseApiKey() (+14 more)

### Community 10 - "navigation-menu.tsx"
Cohesion: 0.11
Nodes (19): class-variance-authority, @radix-ui/react-navigation-menu, @radix-ui/react-toggle, @radix-ui/react-toggle-group, Badge(), BadgeProps, badgeVariants, NavigationMenu (+11 more)

### Community 11 - "pagination.tsx"
Cohesion: 0.11
Nodes (23): @radix-ui/react-alert-dialog, react-day-picker, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader() (+15 more)

### Community 12 - "supabase/types.ts"
Cohesion: 0.06
Nodes (35): Dar ao FabyClaud um cérebro de engenharia de produto, Experiência esperada, Mudanças, Objetivo, Verificação, ref_tanstack_react_start_server_entry, attachSupabaseAuth, createSupabaseClient() (+27 more)

### Community 13 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, jsx, lib, module, moduleResolution, noEmit (+15 more)

### Community 14 - "lucide-react"
Cohesion: 0.09
Nodes (18): input-otp, lucide-react, @radix-ui/react-accordion, @radix-ui/react-checkbox, @radix-ui/react-radio-group, react-resizable-panels, AccordionContent, AccordionItem (+10 more)

### Community 15 - "auth.tsx"
Cohesion: 0.38
Nodes (6): src_assets_hero_matrix_png_asset, AuthPage(), autenticarLocalmente(), enviar(), obterOuCriarIdLocal(), Route

### Community 16 - "providers.server.ts"
Cohesion: 0.18
Nodes (22): ehErroDeModelo(), chamarAntigravity(), chamarGoogle(), chamarGoogleComFallback(), chamarOpenAICompat(), chamarProvedor(), chamarProvedorComModelo(), COMPAT (+14 more)

### Community 17 - "command.tsx"
Cohesion: 0.11
Nodes (17): cmdk, @radix-ui/react-dialog, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+9 more)

### Community 18 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 19 - "config.ts"
Cohesion: 0.13
Nodes (17): AGENTES_PRONTOS, Anexo, EtapaOrquestracao, EXTENSOES_IMAGEM, EXTENSOES_TEXTO, LIMITE_CHARS_ARQUIVO, MEMORIA_SUGERIDA, MODELO_PADRAO (+9 more)

### Community 20 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+10 more)

### Community 21 - "menubar.tsx"
Cohesion: 0.11
Nodes (12): @radix-ui/react-menubar, Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator (+4 more)

### Community 22 - "form.tsx"
Cohesion: 0.17
Nodes (14): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+6 more)

### Community 23 - "index.tsx"
Cohesion: 0.16
Nodes (12): PainelNome, PainelRecursos(), descreverAuditoria(), injetarAuditorDeCliques(), ResultadoAuditoria, apagarArquivo, apagarProjeto, listarProjetos (+4 more)

### Community 24 - "escola.server.ts"
Cohesion: 0.16
Nodes (13): ProvedorCustom, Db, Estado, extrairRegras(), obterEstadoEscola(), promptEstudo(), registrarNotaEscola(), ResultadoCiclo (+5 more)

### Community 25 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): embla-carousel-react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext (+6 more)

### Community 26 - "__root.tsx"
Cohesion: 0.16
Nodes (9): sonner, ref_styles_css_url, Toaster(), ToasterProps, LovableErrorOptions, LovableEvents, reportLovableError(), Window (+1 more)

### Community 27 - "app-auth.$projeto.ts"
Cohesion: 0.31
Nodes (9): clientePublico(), CORS, dentroDoLimite(), entradaSchema, json(), perfilDoApp(), perfilSchema, Route (+1 more)

### Community 28 - "omniroute-local.ts"
Cohesion: 0.35
Nodes (12): SettingsDialog(), selecionarProvedor(), testarAgora(), apagarOmniRouteLocal(), chamarOmniRouteLocal(), lerOmniRouteLocal(), lerResposta(), mensagemFalha() (+4 more)

### Community 29 - "ferramentas.server.ts"
Cohesion: 0.26
Nodes (10): buscarNaWeb(), consultarBanco(), crc32(), executarFerramentas(), gerarImagem(), INSTRUCAO_FERRAMENTAS, lerDocumentacao(), lerPagina() (+2 more)

### Community 30 - "chart.tsx"
Cohesion: 0.23
Nodes (10): recharts, ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload() (+2 more)

### Community 31 - "dados.$projeto.$colecao.ts"
Cohesion: 0.32
Nodes (11): achatar(), cacheMemoriaDados, conectar(), CORS, erro(), excedeuLimite(), identificadorLimite(), json() (+3 more)

### Community 32 - "agents/types.ts"
Cohesion: 0.05
Nodes (37): ref_bun_test, ref_node_fs_promises, AgentManager, CodeModifier, DirectoryReader, OpenManusReActAgent, OpenManusToolRegistry, AgentConfig (+29 more)

### Community 33 - "opencode.json"
Cohesion: 0.14
Nodes (13): branch, description, repository, branch, description, repository, plugin, references (+5 more)

### Community 34 - "breadcrumb.tsx"
Cohesion: 0.22
Nodes (8): @radix-ui/react-slot, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 35 - "app-private.$projeto.$colecao.ts"
Cohesion: 0.43
Nodes (6): zod, contexto(), corpoSchema, CORS, json(), Route

### Community 36 - "Implementação"
Cohesion: 0.15
Nodes (12): 1. Verdade operacional antes de qualquer pedido, 2. Planejador determinístico antes da IA, 3. Orquestração forte, 4. Banco e autenticação dos apps gerados, 5. Imagem, vídeo e pesquisa, 6. Qualidade que mede o pedido, não só o HTML, Critério final, Implementação (+4 more)

### Community 40 - "Completar a base real do FabyClaud"
Cohesion: 0.22
Nodes (8): 1. Autenticação privada nos aplicativos criados, 2. Orquestração forte e persistente, 3. Execução isolada com limites honestos, 4. Interface e transparência, 5. Validação, Completar a base real do FabyClaud, Limite que permanece, Objetivo

### Community 41 - "faby.functions.ts"
Cohesion: 0.11
Nodes (25): MODELS, PROVIDER_LABELS, PROVIDER_LINKS, selecionarMelhorModeloEtapa(), anexoSchema, apagarChave, apagarProvedorCustom, cacheAgentes (+17 more)

### Community 44 - "Recuperar o motor real do FabyClaud"
Cohesion: 0.29
Nodes (6): Chaves de IA, Correções imediatas, Memória e orquestração, Objetivo, Recuperar o motor real do FabyClaud, Verificação

### Community 45 - "Corrigir chaves grátis e integrar o OmniRoute real"
Cohesion: 0.33
Nodes (5): Corrigir chaves grátis e integrar o OmniRoute real, Mudanças, Objetivo, Observação técnica, Validação

### Community 46 - "Corrigir o OmniRoute local sem gastar chamadas em vão"
Cohesion: 0.33
Nodes (5): Corrigir o OmniRoute local sem gastar chamadas em vão, Mudanças, Objetivo, Observação técnica, Validação

### Community 47 - "Impedir entregas falsas e botões sem ação"
Cohesion: 0.33
Nodes (5): Impedir entregas falsas e botões sem ação, Mudanças, Objetivo, Regra de honestidade, Validação

### Community 48 - "Abrir projetos reais do computador"
Cohesion: 0.40
Nodes (4): Abrir projetos reais do computador, Mudanças, Objetivo, Verificação

### Community 49 - "Aproximar o FabyClaud do Antigravity sem perder a prévia"
Cohesion: 0.40
Nodes (4): Aproximar o FabyClaud do Antigravity sem perder a prévia, Entrega desta etapa, Limites honestos, Objetivo

### Community 50 - "Corrigir análise, memória e prévia de projetos importados"
Cohesion: 0.40
Nodes (4): Corrigir análise, memória e prévia de projetos importados, Mudanças, Objetivo, Verificação

### Community 51 - "graphify.js"
Cohesion: 0.40
Nodes (3): IMPORTANT: keep the reminder string free of backticks and $(...) constructs., ref_fs, ref_path

### Community 52 - "Welcome to your Lovable project"
Cohesion: 0.40
Nodes (4): Build with Lovable, Built with, Development, Welcome to your Lovable project

### Community 53 - "JSZip"
Cohesion: 0.14
Nodes (4): JSZip, JSZipFileOptions, JSZipGeneratorOptions, JSZipObject

### Community 56 - "@tanstack/react-router"
Cohesion: 0.33
Nodes (5): @tanstack/react-query, @tanstack/react-router, estudar(), Route, routeTree

### Community 59 - "alert.tsx"
Cohesion: 0.50
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 61 - "clsx.d.ts"
Cohesion: 0.40
Nodes (4): ClassArray, ClassDictionary, ClassValue, clsx

## Knowledge Gaps
- **333 isolated node(s):** `$schema`, `plugin`, `repository`, `branch`, `description` (+328 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 457 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `cn`, `sidebar.tsx`, `github.server.ts`, `client.server.ts`, `navigation-menu.tsx`, `pagination.tsx`, `lucide-react`, `auth.tsx`, `command.tsx`, `menubar.tsx`, `form.tsx`, `index.tsx`, `carousel.tsx`, `__root.tsx`, `chart.tsx`, `breadcrumb.tsx`, `faby.functions.ts`, `alert.tsx`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `breadcrumb.tsx`, `sidebar.tsx`, `react`, `navigation-menu.tsx`, `pagination.tsx`, `lucide-react`, `command.tsx`, `menubar.tsx`, `form.tsx`, `carousel.tsx`, `alert.tsx`, `chart.tsx`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `repository` to the rest of the system?**
  _333 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `builder.server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057511737089201875 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04421768707482993 - nodes in this community are weakly interconnected._