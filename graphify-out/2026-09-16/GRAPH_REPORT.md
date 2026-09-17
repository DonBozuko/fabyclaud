# Graph Report - dev-buddy (2026-09-16)

## Corpus Check

- cluster-only mode — file stats not available

## Summary

- 888 nodes · 1698 edges · 39 communities (37 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- builder.server.ts
- dependencies
- package.json
- cn
- sidebar.tsx
- index.tsx
- github.server.ts
- react
- routeTree.gen.ts
- PainelRecursos.tsx
- navigation-menu.tsx
- pagination.tsx
- server.ts
- compilerOptions
- lucide-react
- types.ts
- providers.server.ts
- command.tsx
- components.json
- config.ts
- devDependencies
- menubar.tsx
- form.tsx
- faby.functions.ts
- escola.server.ts
- carousel.tsx
- __root.tsx
- client.server.ts
- omniroute-local.ts
- ferramentas.server.ts
- chart.tsx
- dados.$projeto.$colecao.ts
- drawer.tsx
- sheet.tsx
- breadcrumb.tsx
- app-private.$projeto.$colecao.ts
- orquestracao.server.ts
- execucao-isolada.ts
- cron-auth.ts

## God Nodes (most connected - your core abstractions)

1. `cn()` - 220 edges
2. `react` - 49 edges
3. `compilerOptions` - 22 edges
4. `lucide-react` - 22 edges
5. `FabyClaud()` - 18 edges
6. `montarPreviewHtml()` - 11 edges
7. `enviarMensagem` - 11 edges
8. `avaliarEntrega()` - 10 edges
9. `class-variance-authority` - 10 edges
10. `@tanstack/react-start` - 10 edges

## Surprising Connections (you probably didn't know these)

- `AlertDialogFooter()` --calls--> `cn()` [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts
- `AlertDialogHeader()` --calls--> `cn()` [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts
- `Pagination()` --calls--> `cn()` [EXTRACTED]
  src/components/ui/pagination.tsx → src/lib/utils.ts
- `PaginationEllipsis()` --calls--> `cn()` [EXTRACTED]
  src/components/ui/pagination.tsx → src/lib/utils.ts
- `PaginationNext()` --calls--> `cn()` [EXTRACTED]
  src/components/ui/pagination.tsx → src/lib/utils.ts

## Import Cycles

- None detected.

## Communities (39 total, 2 thin omitted)

### Community 0 - "builder.server.ts"

Cohesion: 0.06
Nodes (48): ref_node_assert_strict, ref_node_test, AplicativoLocal, aplicativoLocalParaPedido(), auditarArquivos(), base(), classificarPedido(), coberturaRecriacao() (+40 more)

### Community 1 - "dependencies"

Cohesion: 0.04
Nodes (55): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @hookform/resolvers, input-otp (+47 more)

### Community 2 - "package.json"

Cohesion: 0.04
Nodes (44): name, overrides, rolldown, private, scripts, build, build:dev, dev (+36 more)

### Community 3 - "cn"

Cohesion: 0.08
Nodes (43): @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, @radix-ui/react-select, Card, CardContent, CardDescription, CardFooter, CardHeader (+35 more)

### Community 4 - "sidebar.tsx"

Cohesion: 0.06
Nodes (36): Input, Separator, src_components_ui_sheet_sheet, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter (+28 more)

### Community 5 - "index.tsx"

Cohesion: 0.11
Nodes (30): jszip, descreverAuditoria(), injetarAuditorDeCliques(), ResultadoAuditoria, enviarMensagem, abrirProjetoEmNovaAba(), baixarProjetoZip(), classificarPreview() (+22 more)

### Community 6 - "github.server.ts"

Cohesion: 0.08
Nodes (27): @tanstack/react-start, EXT_ZIP, GithubSecao(), Props, baixarArquivos(), deBase64(), enviarArquivos(), EXT_CLONAR (+19 more)

### Community 7 - "react"

Cohesion: 0.07
Nodes (25): clsx, @radix-ui/react-avatar, @radix-ui/react-hover-card, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-scroll-area, @radix-ui/react-slider, @radix-ui/react-switch (+17 more)

### Community 8 - "routeTree.gen.ts"

Cohesion: 0.09
Nodes (27): @tanstack/react-query, @tanstack/react-router, src_assets_hero_matrix_png_asset, getRouter(), estudar(), Route, AuthPage(), Route (+19 more)

### Community 9 - "PainelRecursos.tsx"

Cohesion: 0.07
Nodes (20): Backups(), Docs(), PainelNome, PainelRecursos(), Props, TITULOS, apagarAgente, apagarArquivo (+12 more)

### Community 10 - "navigation-menu.tsx"

Cohesion: 0.09
Nodes (23): class-variance-authority, @radix-ui/react-navigation-menu, @radix-ui/react-toggle, @radix-ui/react-toggle-group, Alert, AlertDescription, AlertTitle, alertVariants (+15 more)

### Community 11 - "pagination.tsx"

Cohesion: 0.10
Nodes (24): @radix-ui/react-alert-dialog, @radix-ui/react-slot, react-day-picker, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter() (+16 more)

### Community 12 - "server.ts"

Cohesion: 0.13
Nodes (16): ref_tanstack_react_start_server_entry, attachSupabaseAuth, supabase, consumeLastCapturedError(), describeError(), describeStatus(), originalConsoleError, safeStringify() (+8 more)

### Community 13 - "compilerOptions"

Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, jsx, lib, module, moduleResolution, noEmit (+15 more)

### Community 14 - "lucide-react"

Cohesion: 0.09
Nodes (18): input-otp, lucide-react, @radix-ui/react-accordion, @radix-ui/react-checkbox, @radix-ui/react-radio-group, react-resizable-panels, AccordionContent, AccordionItem (+10 more)

### Community 15 - "types.ts"

Cohesion: 0.12
Nodes (19): @supabase/supabase-js, ref_tanstack_react_start_server, createSupabaseFetch(), isNewSupabaseApiKey(), requireSupabaseAuth, createSupabaseClient(), createSupabaseFetch(), isNewSupabaseApiKey() (+11 more)

### Community 16 - "providers.server.ts"

Cohesion: 0.17
Nodes (21): ehErroDeModelo(), MODELOS_ALTERNATIVOS, gerarDocumentacao, chamarGoogle(), chamarOpenAICompat(), chamarProvedor(), chamarProvedorComModelo(), COMPAT (+13 more)

### Community 17 - "command.tsx"

Cohesion: 0.11
Nodes (17): cmdk, @radix-ui/react-dialog, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+9 more)

### Community 18 - "components.json"

Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 19 - "config.ts"

Cohesion: 0.13
Nodes (17): Agente, AGENTES_PRONTOS, Anexo, EXTENSOES_IMAGEM, EXTENSOES_TEXTO, LIMITE_CHARS_ARQUIVO, MEMORIA_SUGERIDA, Mensagem (+9 more)

### Community 20 - "devDependencies"

Cohesion: 0.11
Nodes (18): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+10 more)

### Community 21 - "menubar.tsx"

Cohesion: 0.11
Nodes (12): @radix-ui/react-menubar, Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator (+4 more)

### Community 22 - "form.tsx"

Cohesion: 0.17
Nodes (14): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+6 more)

### Community 23 - "faby.functions.ts"

Cohesion: 0.19
Nodes (15): MODELS, PROVIDER_LABELS, anexoSchema, apagarChave, apagarProjeto, apagarProvedorCustom, criarProvedorCustom, listarChaves (+7 more)

### Community 24 - "escola.server.ts"

Cohesion: 0.16
Nodes (13): ProvedorCustom, Db, Estado, extrairRegras(), obterEstadoEscola(), promptEstudo(), registrarNotaEscola(), ResultadoCiclo (+5 more)

### Community 25 - "carousel.tsx"

Cohesion: 0.17
Nodes (14): embla-carousel-react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext (+6 more)

### Community 26 - "__root.tsx"

Cohesion: 0.16
Nodes (9): sonner, ref_styles_css_url, Toaster(), ToasterProps, LovableErrorOptions, LovableEvents, reportLovableError(), Window (+1 more)

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

### Community 33 - "sheet.tsx"

Cohesion: 0.25
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 34 - "breadcrumb.tsx"

Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 35 - "app-private.$projeto.$colecao.ts"

Cohesion: 0.43
Nodes (6): zod, contexto(), corpoSchema, CORS, json(), Route

### Community 36 - "orquestracao.server.ts"

Cohesion: 0.47
Nodes (5): Db, EtapaConstrucao, finalizarExecucao(), iniciarExecucao(), registrarEtapa()

## Knowledge Gaps

- **246 isolated node(s):** `AplicativoLocal`, `IntencaoPedido`, `Inventario`, `ItemHistorico`, `Avaliacao` (+241 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 315 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `cn`, `sidebar.tsx`, `index.tsx`, `github.server.ts`, `routeTree.gen.ts`, `PainelRecursos.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `lucide-react`, `command.tsx`, `menubar.tsx`, `form.tsx`, `faby.functions.ts`, `carousel.tsx`, `__root.tsx`, `chart.tsx`, `drawer.tsx`, `sheet.tsx`, `breadcrumb.tsx`?**
  _High betweenness centrality (0.263) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `drawer.tsx`, `sheet.tsx`, `breadcrumb.tsx`, `sidebar.tsx`, `react`, `navigation-menu.tsx`, `pagination.tsx`, `lucide-react`, `command.tsx`, `menubar.tsx`, `form.tsx`, `carousel.tsx`, `chart.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `AplicativoLocal`, `IntencaoPedido`, `Inventario` to the rest of the system?**
  _246 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `builder.server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06370543541788427 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04421768707482993 - nodes in this community are weakly interconnected._
