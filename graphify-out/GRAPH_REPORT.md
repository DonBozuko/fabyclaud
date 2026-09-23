# Graph Report - Dev Buddy  (2026-09-23)

## Corpus Check
- 151 files · ~117,315 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .toml 2, .lock 1)

## Summary
- 1215 nodes · 2416 edges · 76 communities (63 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30803a0f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- builder.server.ts
- dependencies
- package.json
- cn
- sidebar.tsx
- FabyClaud
- github.functions.ts
- react
- routeTree.gen.ts
- orquestracao.server.ts
- class-variance-authority
- pagination.tsx
- server.ts
- compilerOptions
- evolucao.server.ts
- navigation-menu.tsx
- providers.server.ts
- command.tsx
- components.json
- config.ts
- devDependencies
- menubar.tsx
- form.tsx
- enviarMensagem
- nuvem.ts
- carousel.tsx
- index.tsx
- provas-reais.test.ts
- omniroute-local.ts
- dados.$projeto.$colecao.ts
- chart.tsx
- AgentManager
- ferramentas.server.ts
- opencode.json
- client.server.ts
- agents/types.ts
- Implementação
- execucao-isolada.ts
- cron-auth.ts
- scripts
- Completar a base real do FabyClaud
- app-auth.$projeto.ts
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
- auth.tsx
- overrides
- @lovable.dev/vite-tanstack-config
- lucide-react
- roadmap.md
- clsx.d.ts
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- storage.server.ts
- Recuperar e provar o funcionamento do FabyClaud
- __root.tsx
- app-private.$projeto.$colecao.ts
- ambiente.server.ts
- @tanstack/react-router
- avatar.tsx
- faby.functions.ts
- CodeModifier

## God Nodes (most connected - your core abstractions)
1. `cn()` - 220 edges
2. `react` - 49 edges
3. `enviarMensagem` - 26 edges
4. `FabyClaud()` - 25 edges
5. `carregarDoDisco()` - 24 edges
6. `lucide-react` - 22 edges
7. `compilerOptions` - 22 edges
8. `CodeModifier` - 20 edges
9. `DirectoryReader` - 19 edges
10. `AgentManager` - 17 edges

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

## Communities (76 total, 13 thin omitted)

### Community 0 - "builder.server.ts"
Cohesion: 0.12
Nodes (23): auditarArquivos(), base(), coberturaRecriacao(), consultarDuckDuckGo(), crc32(), diagnosticarProjeto(), directoryReader, ehArquivoDeServidor() (+15 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (55): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @hookform/resolvers, input-otp (+47 more)

### Community 2 - "package.json"
Cohesion: 0.06
Nodes (35): name, private, sideEffects, type, clsx, date-fns, eslint, eslint-config-prettier (+27 more)

### Community 3 - "cn"
Cohesion: 0.06
Nodes (49): @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, vaul, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList (+41 more)

### Community 4 - "sidebar.tsx"
Cohesion: 0.05
Nodes (44): Input, Separator, src_components_ui_sheet_sheet, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader() (+36 more)

### Community 5 - "FabyClaud"
Cohesion: 0.09
Nodes (30): jszip, normalizarUrlsApi(), abrirProjetoEmNovaAba(), baixarProjetoZip(), classificarPreview(), ehTemplateDeServidor(), escaparRegex(), EstadoPreview (+22 more)

### Community 6 - "github.functions.ts"
Cohesion: 0.09
Nodes (30): EXT_ZIP, GithubSecao(), Props, baixarArquivos(), deBase64(), enviarArquivos(), EXT_CLONAR, EXT_TEXTO (+22 more)

### Community 7 - "react"
Cohesion: 0.08
Nodes (21): @radix-ui/react-accordion, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-tabs, react, AccordionContent, AccordionItem, AccordionTrigger (+13 more)

### Community 8 - "routeTree.gen.ts"
Cohesion: 0.13
Nodes (19): estudar(), Route, Route, Route, Route, ApiPublicAppAuthProjetoRoute, ApiPublicAppPrivateProjetoColecaoRoute, ApiPublicDadosProjetoColecaoRoute (+11 more)

### Community 9 - "orquestracao.server.ts"
Cohesion: 0.12
Nodes (14): DirectoryReader, ArquivoItem, FileNode, VFSSnapshot, Db, directoryReader, EtapaConstrucao, finalizarExecucao() (+6 more)

### Community 10 - "class-variance-authority"
Cohesion: 0.14
Nodes (15): class-variance-authority, Alert, AlertDescription, AlertTitle, alertVariants, Badge(), BadgeProps, badgeVariants (+7 more)

### Community 11 - "pagination.tsx"
Cohesion: 0.11
Nodes (23): @radix-ui/react-alert-dialog, @radix-ui/react-slot, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader() (+15 more)

### Community 12 - "server.ts"
Cohesion: 0.11
Nodes (19): Dar ao FabyClaud um cérebro de engenharia de produto, Experiência esperada, Mudanças, Objetivo, Verificação, ref_tanstack_react_start_server_entry, consumeLastCapturedError(), describeError() (+11 more)

### Community 13 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, jsx, lib, module, moduleResolution, noEmit (+15 more)

### Community 14 - "evolucao.server.ts"
Cohesion: 0.23
Nodes (11): pedidoExigeAutenticacaoPrivada(), problemasCriticos(), problemasDeBanco(), afirmacoesSemProva(), Avaliacao, avaliarEntrega(), juntar(), Meta (+3 more)

### Community 15 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 16 - "providers.server.ts"
Cohesion: 0.09
Nodes (34): ehErroDeModelo(), MODELOS_ALTERNATIVOS, Db, Estado, extrairRegras(), obterEstadoEscola(), promptEstudo(), registrarNotaEscola() (+26 more)

### Community 17 - "command.tsx"
Cohesion: 0.11
Nodes (17): cmdk, @radix-ui/react-dialog, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+9 more)

### Community 18 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 19 - "config.ts"
Cohesion: 0.13
Nodes (17): AGENTES_PRONTOS, Anexo, ContratoEntrega, EtapaOrquestracao, EXTENSOES_IMAGEM, EXTENSOES_TEXTO, LIMITE_CHARS_ARQUIVO, MODELO_PADRAO (+9 more)

### Community 20 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+10 more)

### Community 21 - "menubar.tsx"
Cohesion: 0.11
Nodes (12): @radix-ui/react-menubar, Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator (+4 more)

### Community 22 - "form.tsx"
Cohesion: 0.19
Nodes (12): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+4 more)

### Community 23 - "enviarMensagem"
Cohesion: 0.38
Nodes (10): enviarMensagem, listarChaves, obterCapacidades, parseDuelChoice(), respostaComprovaCapacidade(), sincronizarChavesLocais(), testarChave, isChaveDeTeste() (+2 more)

### Community 24 - "nuvem.ts"
Cohesion: 0.25
Nodes (6): aplicarApiNoCodigo(), aplicarApiNosArquivos(), instrucaoNuvem(), MARCADOR_API, MARCADOR_AUTH, MARCADOR_PRIVADO

### Community 25 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): embla-carousel-react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext (+6 more)

### Community 26 - "index.tsx"
Cohesion: 0.11
Nodes (21): sonner, @tanstack/react-query, @tanstack/react-start, PainelNome, PainelRecursos(), descreverAuditoria(), injetarAuditorDeCliques(), ResultadoAuditoria (+13 more)

### Community 27 - "provas-reais.test.ts"
Cohesion: 0.16
Nodes (21): ref_node_assert_strict, ref_node_test, AplicativoLocal, aplicativoLocalParaPedido(), classificarPedido(), classificarPedidoLovable(), ehSaudacaoOuConversaCasual(), formatarContratoEntrega() (+13 more)

### Community 28 - "omniroute-local.ts"
Cohesion: 0.35
Nodes (12): SettingsDialog(), selecionarProvedor(), testarAgora(), apagarOmniRouteLocal(), chamarOmniRouteLocal(), lerOmniRouteLocal(), lerResposta(), mensagemFalha() (+4 more)

### Community 29 - "dados.$projeto.$colecao.ts"
Cohesion: 0.32
Nodes (11): achatar(), cacheMemoriaDados, conectar(), CORS, erro(), excedeuLimite(), identificadorLimite(), json() (+3 more)

### Community 30 - "chart.tsx"
Cohesion: 0.23
Nodes (10): recharts, ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload() (+2 more)

### Community 31 - "AgentManager"
Cohesion: 0.23
Nodes (4): AgentManager, AgentConfig, AgentResult, AgentTask

### Community 32 - "ferramentas.server.ts"
Cohesion: 0.24
Nodes (11): enriquecerPromptImagem(), buscarNaWeb(), consultarBanco(), crc32(), executarFerramentas(), gerarImagem(), INSTRUCAO_FERRAMENTAS, lerDocumentacao() (+3 more)

### Community 33 - "opencode.json"
Cohesion: 0.14
Nodes (13): branch, description, repository, branch, description, repository, plugin, references (+5 more)

### Community 34 - "client.server.ts"
Cohesion: 0.08
Nodes (23): Backups(), Docs(), Props, TITULOS, createSupabaseAdminClient(), createSupabaseFetch(), isNewSupabaseApiKey(), supabaseAdmin (+15 more)

### Community 35 - "agents/types.ts"
Cohesion: 0.13
Nodes (16): ref_bun_test, OpenManusReActAgent, OpenManusToolRegistry, AgentRole, AgentStatus, AlteracaoProjeto, ArquivoCompleto, ManusExecutionState (+8 more)

### Community 36 - "Implementação"
Cohesion: 0.15
Nodes (12): 1. Verdade operacional antes de qualquer pedido, 2. Planejador determinístico antes da IA, 3. Orquestração forte, 4. Banco e autenticação dos apps gerados, 5. Imagem, vídeo e pesquisa, 6. Qualidade que mede o pedido, não só o HTML, Critério final, Implementação (+4 more)

### Community 39 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, dev, format, lint, preview, test

### Community 40 - "Completar a base real do FabyClaud"
Cohesion: 0.22
Nodes (8): 1. Autenticação privada nos aplicativos criados, 2. Orquestração forte e persistente, 3. Execução isolada com limites honestos, 4. Interface e transparência, 5. Validação, Completar a base real do FabyClaud, Limite que permanece, Objetivo

### Community 41 - "app-auth.$projeto.ts"
Cohesion: 0.31
Nodes (9): clientePublico(), CORS, dentroDoLimite(), entradaSchema, json(), perfilDoApp(), perfilSchema, Route (+1 more)

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

### Community 56 - "auth.tsx"
Cohesion: 0.07
Nodes (36): @supabase/supabase-js, ref_tanstack_react_start_server, src_assets_hero_matrix_png_asset, attachSupabaseAuth, createSupabaseFetch(), isNewSupabaseApiKey(), requireSupabaseAuth, createSupabaseClient() (+28 more)

### Community 59 - "lucide-react"
Cohesion: 0.09
Nodes (19): input-otp, lucide-react, @radix-ui/react-checkbox, @radix-ui/react-select, react-resizable-panels, Checkbox, InputOTP, InputOTPGroup (+11 more)

### Community 61 - "clsx.d.ts"
Cohesion: 0.40
Nodes (4): ClassArray, ClassDictionary, ClassValue, clsx

### Community 67 - "storage.server.ts"
Cohesion: 0.16
Nodes (26): ref_node_fs, ref_node_path, ProvedorCustom, apagarChaveArmazenada(), apagarGithubContaArmazenada(), apagarProjetoArmazenado(), apagarProvedorCustomArmazenado(), carregarDoDisco() (+18 more)

### Community 68 - "Recuperar e provar o funcionamento do FabyClaud"
Cohesion: 0.33
Nodes (5): Diagnóstico já confirmado, Implementação, Objetivo, Provas finais, Recuperar e provar o funcionamento do FabyClaud

### Community 69 - "__root.tsx"
Cohesion: 0.18
Nodes (8): ref_styles_css_url, Toaster(), ToasterProps, LovableErrorOptions, LovableEvents, reportLovableError(), Window, ErrorComponent()

### Community 70 - "app-private.$projeto.$colecao.ts"
Cohesion: 0.43
Nodes (6): zod, contexto(), corpoSchema, CORS, json(), Route

### Community 71 - "ambiente.server.ts"
Cohesion: 0.47
Nodes (5): definida(), EstadoBackend, estadoBackendServidor(), exigirAdministracaoNuvem(), RESERVAS

### Community 72 - "@tanstack/react-router"
Cohesion: 0.33
Nodes (5): @tanstack/react-router, getRouter(), Register, routeTree, startInstance

### Community 73 - "avatar.tsx"
Cohesion: 0.40
Nodes (4): @radix-ui/react-avatar, Avatar, AvatarFallback, AvatarImage

### Community 74 - "faby.functions.ts"
Cohesion: 0.20
Nodes (19): anexoSchema, apagarArquivo, cacheAgentes, cachePrompts, carregarProjetoCompleto(), criarBackup, extrairUserIds(), listarProjetos (+11 more)

### Community 75 - "CodeModifier"
Cohesion: 0.16
Nodes (6): ref_node_fs_promises, CodeModifier, CodeEdit, descartarPatchesParciais(), extrairArquivos(), limparPensamento()

## Knowledge Gaps
- **343 isolated node(s):** `$schema`, `plugin`, `repository`, `branch`, `description` (+338 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 468 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `client.server.ts`, `cn`, `sidebar.tsx`, `github.functions.ts`, `__root.tsx`, `avatar.tsx`, `class-variance-authority`, `pagination.tsx`, `navigation-menu.tsx`, `command.tsx`, `menubar.tsx`, `form.tsx`, `auth.tsx`, `carousel.tsx`, `index.tsx`, `lucide-react`, `chart.tsx`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Why does `@tanstack/react-start` connect `index.tsx` to `package.json`, `client.server.ts`, `github.functions.ts`, `faby.functions.ts`, `server.ts`, `auth.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `FabyClaud()` (e.g. with `index.tsx` and `aoFicarOffline()`) actually correct?**
  _`FabyClaud()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugin`, `repository` to the rest of the system?**
  _343 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `builder.server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1168091168091168 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._