---
name: node-knowledge
description: Knowledge base and workflow for Node.js with JavaScript or TypeScript in any domain — web backends and APIs (Express, Fastify, Hono, NestJS), databases and ORMs (Prisma, Drizzle, Kysely), queues and bots, CLI tools, npm libraries, scripting, desktop (Electron), bundlers, scraping, AI/LLM and MCP apps, IoT, code that must also run on Bun, Deno or Cloudflare Workers. Use for any question about Node.js or server-side JS/TS code, even one that looks quick to answer from memory: writing or reviewing Node code; ESM vs CommonJS, require(esm), package.json exports; running TypeScript (type stripping, tsconfig, TypeScript 7); choosing packages or tooling (npm, pnpm, ESLint, oxlint, Biome, Prettier, node:test, Vitest, Jest, MSW); supply-chain security and npm audit; event loop blocking, promises, worker_threads, streams and backpressure, AsyncLocalStorage, native addons (Node-API, napi-rs, node:ffi, WebAssembly); slow code, memory leaks, GC, slow startup, low HTTP throughput; benchmarking (mitata, Vitest bench, hyperfine, autocannon) and profiling (--cpu-prof, flame graphs); project structure, monorepos, DI, graceful shutdown; Node and TypeScript books. Includes a curated library with links, a toolchain guide and a pipeline with benchmarks, review and measured optimization.
---

# Node.js: библиотека знаний и пайплайн

Скилл помогает писать, проверять и ускорять код на Node.js — на JavaScript и TypeScript, в любой предметной области. Внутри три вещи:

1. **Библиотека знаний.** Книги, статьи, доклады, документация, кодовые базы и паттерны по категориям. Каждый источник дан со ссылкой, автором, годом и пояснением, зачем его читать.
2. **Тулчейн.** Какие инструменты ставить, какие команды запускать и в каком порядке.
3. **Пайплайн.** Порядок работы: тесты до кода, проверки качества, бенчмарки, ревью, поиск решений в библиотеке и повторный замер.

Состояние знаний — ноябрь 2026: Node 26 (Active LTS с 28 октября 2026), Node 24 и 22 (Maintenance LTS), Node 20 снят с поддержки. С 27.x Node выпускает одну мажорную версию в год. TypeScript 7.0 (компилятор на Go, без JS API), npm 11 и 12, ESLint 10, Vitest 5.

## Куда смотреть

| Задача | Файл |
| --- | --- |
| Новая фича, рефакторинг или оптимизация: порядок работы | [references/pipeline.md](references/pipeline.md) |
| Версии Node и график релизов, менеджеры версий и пакетов, lock-файлы, workspaces, `package.json`, запуск TypeScript, ESLint/oxlint/Biome/Prettier, git-хуки, безопасность цепочки поставок, `npm audit`, CI, шаблоны конфигов | [references/toolchain.md](references/toolchain.md) |
| `node:test`, Vitest, Jest, моки и фейки, MSW, Testcontainers, property-based и мутационное тестирование, покрытие, E2E | [references/testing.md](references/testing.md) |
| Код медленный или ест память: техника по симптому, профилирование, бенчмарки, V8, GC, старт | [references/performance.md](references/performance.md) — начните с таблицы «Симптом → техника → источник» |
| Современный JavaScript и минимальная версия Node для каждой возможности, встроенные API вместо зависимостей, ESM и CommonJS, ошибки, логирование, async-паттерны, паттерны проектирования, чеклист ревью | [references/idioms-patterns.md](references/idioms-patterns.md) |
| TypeScript 6/7, `tsconfig` для сервиса и библиотеки, type stripping, паттерны типизации, валидация на границах (Zod, Valibot, ArkType, Standard Schema), публикация типов | [references/typescript.md](references/typescript.md) |
| Структура сервиса, библиотеки и монорепозитория, границы модулей, DI, конфигурация, outbox, graceful shutdown, эталонные кодовые базы | [references/architecture.md](references/architecture.md) |
| Event loop, блокировки, пул потоков libuv, worker_threads и пулы, child_process, cluster, streams и backpressure, AsyncLocalStorage, отмена, Node-API, napi-rs, `node:ffi`, WebAssembly | [references/concurrency-async-native.md](references/concurrency-async-native.md) |
| Серверные области: HTTP-фреймворки, undici, API (OpenAPI, GraphQL, RPC, WebSocket), базы данных и ORM, очереди, боты, аутентификация, наблюдаемость, безопасность по OWASP, нагрузочное тестирование, деплой | [references/domains-server.md](references/domains-server.md) |
| Клиентские и прочие области: CLI и TUI, публикация npm-библиотек, скрипты, Electron, бандлеры, скрапинг, AI/LLM и MCP, IoT, совместимость с Bun, Deno и edge-рантаймами | [references/domains-client.md](references/domains-client.md) |
| Что почитать, блоги, доклады, курсы, русскоязычные ресурсы, маршрут обучения по уровням | [references/books.md](references/books.md) |

Каждый справочник начинается с оглавления. Читайте только нужный раздел, а не файл целиком.

Скрипты:

- [scripts/bench_template.mjs](scripts/bench_template.mjs) — шаблон бенчмарка на mitata с явным прогревом JIT. Нужен на этапе 6 пайплайна.
- [scripts/bench_compare.mjs](scripts/bench_compare.mjs) — сравнение прогонов «до» и «после» (mitata, Vitest 5, hyperfine) с учётом шума между прогонами; возвращает код 1 при регрессии. Нужен на этапе 11.

## Как работать

**Для задачи больше одной функции** идите по [пайплайну](references/pipeline.md):

1. Опрос.
2. План и спецификация.
3. Подзадачи.
4. Тесты до кода.
5. Изоляция в worktree.
6. Бенчмарки.
7. Базовый замер и профиль.
8. Ревью.
9. Поиск решений в библиотеке.
10. Оптимизация.
11. Повторный замер.

Для мелкой правки хватает короткого режима из того же файла: тест, код, проверки, ревью.

**Перед тем как объявить работу готовой**, прогоните минимальные проверки и покажите их вывод:

```bash
npm ci
npm install --package-lock-only --ignore-scripts && git diff --exit-code package-lock.json
npx prettier --check .                     # или форматтер, принятый в проекте
npx eslint --max-warnings=0 .              # или oxlint
npx tsc --noEmit                           # если есть TypeScript или JSDoc-типы
node --test                                # или npx vitest run
npm audit --omit=dev --audit-level=high
```

Если проект на pnpm или Yarn, выполните те же шаги их командами. Для публикуемого пакета добавьте `npm pack --dry-run`, `publint` и `attw --pack`. Если инструмент не установлен, скажите об этом и предложите команду установки из [toolchain.md](references/toolchain.md), а не пропускайте шаг молча.

**При оптимизации:**

- Сначала замер, потом правка. Без базовой линии нельзя сказать, что код стал быстрее.
- Прогревайте JIT явно. V8 оптимизирует функцию после определённого числа вызовов, и без прогрева бенчмарк меряет медленный код, которого в продакшене нет. В локальном замере разница доходила до 16 раз.
- Снимайте 5 прогонов «до» и «после» в отдельных процессах, чередуя порядок (ABBA). Три прогона одного и того же кода уже давали ложное ускорение на 6,5%.
- Записывайте версию Node и V8: разные версии оптимизируют один и тот же код по-разному.
- Ищите технику по симптому в [performance.md](references/performance.md) и указывайте источник рядом с правкой.
- Принимайте правку, только если бенчмарк показал значимый выигрыш, а тесты остались зелёными.

**При ревью** используйте чеклисты:

- [idioms-patterns.md](references/idioms-patterns.md) — для любого кода;
- [typescript.md](references/typescript.md) — для типов и валидации данных на границах;
- [testing.md](references/testing.md) — для тестов;
- [concurrency-async-native.md](references/concurrency-async-native.md) — для асинхронного кода, worker'ов, потоков данных и нативных расширений;
- [domains-server.md](references/domains-server.md) — для серверного кода и безопасности;
- [architecture.md](references/architecture.md) — для структуры проекта и границ модулей.

## Правила использования библиотеки

- **Ссылайтесь на источник.** Рекомендуя паттерн или оптимизацию, давайте ссылку из справочника. Тогда пользователь может проверить совет, а решение не выглядит выдуманным.
- **Учитывайте пометки.** `[устарело]` значит, что у материала есть замена, и она указана рядом. `[не проверено]` значит, что утверждение взято из одного вторичного источника; его стоит перепроверить, прежде чем строить на нём решение.
- **Проверяйте версии.** Версии пакетов указаны на ноябрь 2026. В 2025–2026 годах вышло много мажорных версий с ломающими изменениями: TypeScript 7 без JS API, npm 12 с блокировкой install-скриптов, ESLint 10 без eslintrc, Vitest 5 с новым API бенчмарков, Express 5, Prisma 7, BullMQ 6, OpenTelemetry JS SDK 3. Многие пакеты стали ESM-only и требуют Node 22.12+. Перед важными решениями сверяйтесь с `npm view <пакет>`, документацией и changelog.
- **Учитывайте целевую версию Node.** Уточните `engines.node`, прежде чем советовать новые возможности: `using` и `RegExp.escape` есть с Node 24, Temporal и `node:ffi` — только с Node 26. Таблица «возможность → минимальная версия» — в [idioms-patterns.md](references/idioms-patterns.md).
- **Говорите о пробелах прямо.** Если в библиотеке нет ответа, так и скажите, а затем ищите в официальной документации. Не выдавайте догадку за материал библиотеки.
- **Следуйте соглашениям проекта.** Если в проекте уже приняты стиль, менеджер пакетов, фреймворк, библиотеки или архитектура, советы библиотеки применяются в их рамках, а не поверх.
