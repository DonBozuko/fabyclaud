# Graph Report - Dev Buddy (2026-09-16)

## Corpus Check

- 128 files · ~68,480 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .toml 2, .lock 1)

## Summary

- 991 nodes · 1795 edges · 61 communities (52 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

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
- faby.functions.ts
- class-variance-authority
- pagination.tsx
- server.ts
- compilerOptions
- resizable.tsx
- client.ts
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
- client.server.ts
- omniroute-local.ts
- ferramentas.server.ts
- chart.tsx
- dados.$projeto.$colecao.ts
- drawer.tsx
- opencode.json
- breadcrumb.tsx
- app-private.$projeto.$colecao.ts
- Implementação
- execucao-isolada.ts
- cron-auth.ts
- types.ts
- Completar a base real do FabyClaud
- navigation-menu.tsx
- scripts
- eslint.config.js
- Recuperar o motor real do FabyClaud
- Corrigir chaves grátis e integrar o OmniRoute real
- Corrigir o OmniRoute local sem gastar chamadas em vão
- Impedir entregas falsas e botões sem ação
- Abrir projetos reais do computador
- Aproximar o FabyClaud do Antigravity sem perder a prévia
- Corrigir análise, memória e prévia de projetos importados
- graphify.js
- Welcome to your Lovable project
- avatar.tsx
- Routes
- AGENTS.md
- overrides
- @lovable.dev/vite-tanstack-config
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- roadmap.md

## God Nodes (most connected - your core abstractions)

1. `cn()` - 220 edges
2. `react` - 49 edges
3. `lucide-react` - 22 edges
4. `compilerOptions` - 22 edges
5. `FabyClaud()` - 18 edges
6. `montarPreviewHtml()` - 14 edges
7. `enviarMensagem` - 12 edges
8. `@tanstack/react-start` - 10 edges
9. `class-variance-authority` - 10 edges
10. `avaliarEntrega()` - 10 edges

## Surprising Connections (you probably didn't know these)

- `Verificação` --references--> `fetch()` [INFERRED]
  .lovable/plan/dar-ao-fabyclaud-um-cérebro-de-engenharia-de-produto-2026-09-16.md → src/server.ts
- `AccordionItem` --calls--> `cn()` [EXTRACTED]
  src/components/ui/accordion.tsx → src/lib/utils.ts
- `AccordionTrigger` --calls--> `cn()` [EXTRACTED]
  src/components/ui/accordion.tsx → src/lib/utils.ts
- `AccordionContent` --calls--> `cn()` [EXTRACTED]
  src/components/ui/accordion.tsx → src/lib/utils.ts
- `AlertDialogOverlay` --calls--> `cn()` [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts

## Import Cycles

- None detected.

## Communities (61 total, 9 thin omitted)

### Community 0 - "builder.server.ts"

Cohesion: 0.05
Nodes (56): ref_node_assert_strict, ref_node_test, AplicativoLocal, aplicativoLocalParaPedido(), auditarArquivos(), base(), classificarPedido(), coberturaRecriacao() (+48 more)

### Community 1 - "dependencies"

Cohesion: 0.04
Nodes (55): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @hookform/resolvers, input-otp (+47 more)

### Community 2 - "package.json"

Cohesion: 0.07
Nodes (28): name, private, sideEffects, type, clsx, date-fns, eslint, eslint-config-prettier (+20 more)

### Community 3 - "cn"

Cohesion: 0.08
Nodes (43): @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, @radix-ui/react-select, Card, CardContent, CardDescription, CardFooter, CardHeader (+35 more)

### Community 4 - "sidebar.tsx"

Cohesion: 0.05
Nodes (44): Input, Separator, src_components_ui_sheet_sheet, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader() (+36 more)

### Community 5 - "preview.ts"

Cohesion: 0.11
Nodes (27): jszip, abrirProjetoEmNovaAba(), baixarProjetoZip(), classificarPreview(), ehTemplateDeServidor(), escaparRegex(), EstadoPreview, injetarNoHead() (+19 more)

### Community 6 - "github.server.ts"

Cohesion: 0.09
Nodes (26): @tanstack/react-start, EXT_ZIP, GithubSecao(), Props, baixarArquivos(), deBase64(), enviarArquivos(), EXT_CLONAR (+18 more)

### Community 7 - "react"

Cohesion: 0.05
Nodes (33): input-otp, @radix-ui/react-accordion, @radix-ui/react-checkbox, @radix-ui/react-hover-card, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area (+25 more)

### Community 8 - "routeTree.gen.ts"

Cohesion: 0.09
Nodes (26): @tanstack/react-router, src_assets_hero_matrix_png_asset, getRouter(), estudar(), Route, AuthPage(), Route, Route (+18 more)

### Community 9 - "faby.functions.ts"

Cohesion: 0.09
Nodes (22): Backups(), Docs(), Props, TITULOS, anexoSchema, apagarAgente, apagarArquivo, apagarBackup (+14 more)

### Community 10 - "class-variance-authority"

Cohesion: 0.14
Nodes (15): class-variance-authority, @radix-ui/react-toggle, @radix-ui/react-toggle-group, Alert, AlertDescription, AlertTitle, alertVariants, Badge() (+7 more)

### Community 11 - "pagination.tsx"

Cohesion: 0.11
Nodes (22): @radix-ui/react-alert-dialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay (+14 more)

### Community 12 - "server.ts"

Cohesion: 0.10
Nodes (21): Dar ao FabyClaud um cérebro de engenharia de produto, Experiência esperada, Mudanças, Objetivo, Verificação, ref_tanstack_react_start_server_entry, attachSupabaseAuth, supabase (+13 more)

### Community 13 - "compilerOptions"

Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, jsx, lib, module, moduleResolution, noEmit (+15 more)

### Community 14 - "resizable.tsx"

Cohesion: 0.50
Nodes (3): react-resizable-panels, ResizableHandle(), ResizablePanelGroup()

### Community 15 - "client.ts"

Cohesion: 0.24
Nodes (10): @supabase/supabase-js, ref_tanstack_react_start_server, createSupabaseFetch(), isNewSupabaseApiKey(), requireSupabaseAuth, createSupabaseClient(), createSupabaseFetch(), isNewSupabaseApiKey() (+2 more)

### Community 16 - "providers.server.ts"

Cohesion: 0.19
Nodes (19): ehErroDeModelo(), chamarGoogle(), chamarOpenAICompat(), chamarProvedor(), chamarProvedorComModelo(), COMPAT, descobrirModelos(), ehFalhaDeModelo() (+11 more)

### Community 17 - "command.tsx"

Cohesion: 0.11
Nodes (17): cmdk, @radix-ui/react-dialog, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+9 more)

### Community 18 - "components.json"

Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 19 - "config.ts"

Cohesion: 0.12
Nodes (19): Agente, AGENTES_PRONTOS, Anexo, EXTENSOES_IMAGEM, EXTENSOES_TEXTO, LIMITE_CHARS_ARQUIVO, MEMORIA_SUGERIDA, Mensagem (+11 more)

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

Cohesion: 0.11
Nodes (21): lucide-react, sonner, @tanstack/react-query, PainelNome, PainelRecursos(), descreverAuditoria(), injetarAuditorDeCliques(), ResultadoAuditoria (+13 more)

### Community 24 - "escola.server.ts"

Cohesion: 0.16
Nodes (13): ProvedorCustom, Db, Estado, extrairRegras(), obterEstadoEscola(), promptEstudo(), registrarNotaEscola(), ResultadoCiclo (+5 more)

### Community 25 - "carousel.tsx"

Cohesion: 0.17
Nodes (14): embla-carousel-react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext (+6 more)

### Community 26 - "__root.tsx"

Cohesion: 0.18
Nodes (8): ref_styles_css_url, Toaster(), ToasterProps, LovableErrorOptions, LovableEvents, reportLovableError(), Window, ErrorComponent()

### Community 27 - "client.server.ts"

Cohesion: 0.24
Nodes (13): createSupabaseAdminClient(), createSupabaseFetch(), isNewSupabaseApiKey(), supabaseAdmin, clientePublico(), CORS, dentroDoLimite(), entradaSchema (+5 more)

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

Cohesion: 0.36
Nodes (10): achatar(), conectar(), CORS, erro(), excedeuLimite(), identificadorLimite(), json(), lerCorpo() (+2 more)

### Community 32 - "drawer.tsx"

Cohesion: 0.22
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

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

### Community 39 - "types.ts"

Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+1 more)

### Community 40 - "Completar a base real do FabyClaud"

Cohesion: 0.22
Nodes (8): 1. Autenticação privada nos aplicativos criados, 2. Orquestração forte e persistente, 3. Execução isolada com limites honestos, 4. Interface e transparência, 5. Validação, Completar a base real do FabyClaud, Limite que permanece, Objetivo

### Community 41 - "navigation-menu.tsx"

Cohesion: 0.25
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 42 - "scripts"

Cohesion: 0.25
Nodes (8): scripts, build, build:dev, dev, format, lint, preview, test

### Community 43 - "eslint.config.js"

Cohesion: 0.29
Nodes (6): @eslint/js, ref_eslint_plugin_prettier_recommended, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

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

### Community 53 - "avatar.tsx"

Cohesion: 0.40
Nodes (4): @radix-ui/react-avatar, Avatar, AvatarFallback, AvatarImage

## Knowledge Gaps

- **307 isolated node(s):** `$schema`, `plugin`, `repository`, `branch`, `description` (+302 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 394 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `cn`, `sidebar.tsx`, `github.server.ts`, `routeTree.gen.ts`, `faby.functions.ts`, `class-variance-authority`, `pagination.tsx`, `command.tsx`, `menubar.tsx`, `form.tsx`, `index.tsx`, `carousel.tsx`, `__root.tsx`, `chart.tsx`, `drawer.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx`, `avatar.tsx`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `drawer.tsx`, `breadcrumb.tsx`, `sidebar.tsx`, `react`, `navigation-menu.tsx`, `class-variance-authority`, `pagination.tsx`, `resizable.tsx`, `command.tsx`, `avatar.tsx`, `form.tsx`, `menubar.tsx`, `carousel.tsx`, `chart.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `repository` to the rest of the system?**
  _307 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `builder.server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05487269534679543 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
