# Graph Report - Dev Buddy  (2026-09-22)

## Corpus Check
- 151 files · ~88,277 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .toml 2, .lock 1)

## Summary
- 1208 nodes · 2380 edges · 67 communities (54 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6bbff468`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- builder.server.ts
- dependencies
- package.json
- cn
- sidebar.tsx
- index.tsx
- github.functions.ts
- react
- routeTree.gen.ts
- app-auth.$projeto.ts
- class-variance-authority
- pagination.tsx
- server.ts
- compilerOptions
- agents/types.ts
- navigation-menu.tsx
- providers.server.ts
- command.tsx
- components.json
- config.ts
- devDependencies
- menubar.tsx
- form.tsx
- builder.server.test.ts
- evolucao.server.ts
- carousel.tsx
- drawer.tsx
- nuvem.ts
- SettingsDialog.tsx
- CodeModifier
- chart.tsx
- breadcrumb.tsx
- ferramentas.server.ts
- opencode.json
- escola.server.ts
- Implementação
- execucao-isolada.ts
- cron-auth.ts
- scripts
- Completar a base real do FabyClaud
- eslint.config.js
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
- overrides
- @lovable.dev/vite-tanstack-config
- lucide-react
- roadmap.md
- clsx.d.ts
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- faby.functions.ts
- Recuperar e provar o funcionamento do FabyClaud
- ambiente.server.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 220 edges
2. `react` - 49 edges
3. `FabyClaud()` - 25 edges
4. `enviarMensagem` - 23 edges
5. `carregarDoDisco()` - 23 edges
6. `lucide-react` - 22 edges
7. `compilerOptions` - 22 edges
8. `CodeModifier` - 20 edges
9. `DirectoryReader` - 19 edges
10. `extrairUserIds()` - 17 edges

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

## Communities (67 total, 13 thin omitted)

### Community 0 - "builder.server.ts"
Cohesion: 0.12
Nodes (21): auditarArquivos(), base(), consultarDuckDuckGo(), crc32(), diagnosticarProjeto(), directoryReader, enriquecerPromptImagem(), escapeRegex() (+13 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (55): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @hookform/resolvers, input-otp (+47 more)

### Community 2 - "package.json"
Cohesion: 0.06
Nodes (34): name, private, sideEffects, type, clsx, date-fns, eslint, eslint-config-prettier (+26 more)

### Community 3 - "cn"
Cohesion: 0.08
Nodes (43): @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, @radix-ui/react-select, Card, CardContent, CardDescription, CardFooter, CardHeader (+35 more)

### Community 4 - "sidebar.tsx"
Cohesion: 0.05
Nodes (44): Input, Separator, src_components_ui_sheet_sheet, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader() (+36 more)

### Community 5 - "index.tsx"
Cohesion: 0.06
Nodes (52): jszip, src_assets_hero_matrix_png_asset, EstadoAmbiente, verificarAmbienteCliente(), descreverAuditoria(), injetarAuditorDeCliques(), ResultadoAuditoria, normalizarUrlsApi() (+44 more)

### Community 6 - "github.functions.ts"
Cohesion: 0.10
Nodes (29): @tanstack/react-start, EXT_ZIP, Props, baixarArquivos(), deBase64(), enviarArquivos(), EXT_CLONAR, EXT_TEXTO (+21 more)

### Community 7 - "react"
Cohesion: 0.08
Nodes (21): @radix-ui/react-avatar, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-tabs, react, Avatar, AvatarFallback, AvatarImage (+13 more)

### Community 8 - "routeTree.gen.ts"
Cohesion: 0.05
Nodes (51): sonner, ref_styles_css_url, @tanstack/react-query, @tanstack/react-router, zod, Toaster(), ToasterProps, LovableErrorOptions (+43 more)

### Community 9 - "app-auth.$projeto.ts"
Cohesion: 0.08
Nodes (30): @supabase/supabase-js, ref_tanstack_react_start_server, attachSupabaseAuth, createSupabaseFetch(), isNewSupabaseApiKey(), requireSupabaseAuth, createSupabaseClient(), createSupabaseFetch() (+22 more)

### Community 10 - "class-variance-authority"
Cohesion: 0.13
Nodes (16): class-variance-authority, @radix-ui/react-toggle-group, Alert, AlertDescription, AlertTitle, alertVariants, Badge(), BadgeProps (+8 more)

### Community 11 - "pagination.tsx"
Cohesion: 0.11
Nodes (23): @radix-ui/react-alert-dialog, @radix-ui/react-slot, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader() (+15 more)

### Community 12 - "server.ts"
Cohesion: 0.11
Nodes (19): Dar ao FabyClaud um cérebro de engenharia de produto, Experiência esperada, Mudanças, Objetivo, Verificação, ref_tanstack_react_start_server_entry, consumeLastCapturedError(), describeError() (+11 more)

### Community 13 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, jsx, lib, module, moduleResolution, noEmit (+15 more)

### Community 14 - "agents/types.ts"
Cohesion: 0.06
Nodes (32): ref_bun_test, AgentManager, DirectoryReader, OpenManusReActAgent, OpenManusToolRegistry, AgentConfig, AgentResult, AgentRole (+24 more)

### Community 15 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 16 - "providers.server.ts"
Cohesion: 0.16
Nodes (23): ehErroDeModelo(), chamarAntigravity(), chamarGoogle(), chamarGoogleComFallback(), chamarOpenAICompat(), chamarProvedor(), chamarProvedorComModelo(), COMPAT (+15 more)

### Community 17 - "command.tsx"
Cohesion: 0.11
Nodes (17): cmdk, @radix-ui/react-dialog, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+9 more)

### Community 18 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 19 - "config.ts"
Cohesion: 0.13
Nodes (17): Anexo, ContratoEntrega, EtapaOrquestracao, EXTENSOES_IMAGEM, EXTENSOES_TEXTO, LIMITE_CHARS_ARQUIVO, MEMORIA_SUGERIDA, MODELO_PADRAO (+9 more)

### Community 20 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+10 more)

### Community 21 - "menubar.tsx"
Cohesion: 0.11
Nodes (12): @radix-ui/react-menubar, Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator (+4 more)

### Community 22 - "form.tsx"
Cohesion: 0.19
Nodes (12): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+4 more)

### Community 23 - "builder.server.test.ts"
Cohesion: 0.16
Nodes (19): ref_node_assert_strict, ref_node_test, AplicativoLocal, aplicativoLocalParaPedido(), classificarPedido(), classificarPedidoLovable(), ehSaudacaoOuConversaCasual(), formatarContratoEntrega() (+11 more)

### Community 24 - "evolucao.server.ts"
Cohesion: 0.18
Nodes (15): coberturaRecriacao(), ehArquivoDeServidor(), pedidoExigeAutenticacaoPrivada(), problemasCriticos(), problemasDeAutenticacao(), problemasDeBanco(), afirmacoesSemProva(), Avaliacao (+7 more)

### Community 25 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): embla-carousel-react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext (+6 more)

### Community 26 - "drawer.tsx"
Cohesion: 0.22
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 27 - "nuvem.ts"
Cohesion: 0.25
Nodes (6): aplicarApiNoCodigo(), aplicarApiNosArquivos(), instrucaoNuvem(), MARCADOR_API, MARCADOR_AUTH, MARCADOR_PRIVADO

### Community 28 - "SettingsDialog.tsx"
Cohesion: 0.27
Nodes (15): SettingsDialog(), selecionarProvedor(), testarAgora(), MODELS, PROVIDER_LABELS, PROVIDER_LINKS, apagarOmniRouteLocal(), chamarOmniRouteLocal() (+7 more)

### Community 29 - "CodeModifier"
Cohesion: 0.13
Nodes (8): ref_node_fs_promises, CodeModifier, AlteracaoProjeto, CodeEdit, ModificacaoArquivo, descartarPatchesParciais(), extrairArquivos(), limparPensamento()

### Community 30 - "chart.tsx"
Cohesion: 0.23
Nodes (10): recharts, ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload() (+2 more)

### Community 31 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 32 - "ferramentas.server.ts"
Cohesion: 0.26
Nodes (10): buscarNaWeb(), consultarBanco(), crc32(), executarFerramentas(), gerarImagem(), INSTRUCAO_FERRAMENTAS, lerDocumentacao(), lerPagina() (+2 more)

### Community 33 - "opencode.json"
Cohesion: 0.14
Nodes (13): branch, description, repository, branch, description, repository, plugin, references (+5 more)

### Community 34 - "escola.server.ts"
Cohesion: 0.17
Nodes (12): Db, Estado, extrairRegras(), obterEstadoEscola(), promptEstudo(), registrarNotaEscola(), ResultadoCiclo, rodarCicloEscola() (+4 more)

### Community 36 - "Implementação"
Cohesion: 0.15
Nodes (12): 1. Verdade operacional antes de qualquer pedido, 2. Planejador determinístico antes da IA, 3. Orquestração forte, 4. Banco e autenticação dos apps gerados, 5. Imagem, vídeo e pesquisa, 6. Qualidade que mede o pedido, não só o HTML, Critério final, Implementação (+4 more)

### Community 39 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, dev, format, lint, preview, test

### Community 40 - "Completar a base real do FabyClaud"
Cohesion: 0.22
Nodes (8): 1. Autenticação privada nos aplicativos criados, 2. Orquestração forte e persistente, 3. Execução isolada com limites honestos, 4. Interface e transparência, 5. Validação, Completar a base real do FabyClaud, Limite que permanece, Objetivo

### Community 42 - "eslint.config.js"
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

### Community 53 - "JSZip"
Cohesion: 0.14
Nodes (4): JSZip, JSZipFileOptions, JSZipGeneratorOptions, JSZipObject

### Community 59 - "lucide-react"
Cohesion: 0.11
Nodes (15): input-otp, lucide-react, @radix-ui/react-accordion, @radix-ui/react-checkbox, react-resizable-panels, AccordionContent, AccordionItem, AccordionTrigger (+7 more)

### Community 61 - "clsx.d.ts"
Cohesion: 0.40
Nodes (4): ClassArray, ClassDictionary, ClassValue, clsx

### Community 67 - "faby.functions.ts"
Cohesion: 0.06
Nodes (83): ref_node_fs, ref_node_path, GithubSecao(), Backups(), Docs(), PainelNome, PainelRecursos(), Props (+75 more)

### Community 68 - "Recuperar e provar o funcionamento do FabyClaud"
Cohesion: 0.33
Nodes (5): Diagnóstico já confirmado, Implementação, Objetivo, Provas finais, Recuperar e provar o funcionamento do FabyClaud

### Community 71 - "ambiente.server.ts"
Cohesion: 0.47
Nodes (5): definida(), EstadoBackend, estadoBackendServidor(), exigirAdministracaoNuvem(), RESERVAS

## Knowledge Gaps
- **343 isolated node(s):** `$schema`, `plugin`, `repository`, `branch`, `description` (+338 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 468 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `cn`, `sidebar.tsx`, `index.tsx`, `github.functions.ts`, `routeTree.gen.ts`, `class-variance-authority`, `pagination.tsx`, `navigation-menu.tsx`, `command.tsx`, `menubar.tsx`, `form.tsx`, `carousel.tsx`, `drawer.tsx`, `SettingsDialog.tsx`, `chart.tsx`, `breadcrumb.tsx`, `lucide-react`, `faby.functions.ts`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `@tanstack/react-start` connect `github.functions.ts` to `package.json`, `faby.functions.ts`, `index.tsx`, `app-auth.$projeto.ts`, `server.ts`, `SettingsDialog.tsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `FabyClaud()` (e.g. with `index.tsx` and `aoFicarOffline()`) actually correct?**
  _`FabyClaud()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugin`, `repository` to the rest of the system?**
  _343 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `builder.server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._