# Архитектура и структура проектов на Node.js

Как раскладывать, делить на модули и масштабировать код на Node.js (JavaScript и TypeScript): сервис, библиотеку, CLI, монорепозиторий. Внутри: структура по компонентам и слоям, гексагональная архитектура, модульный монолит, монорепозитории (npm, pnpm, Yarn и Bun workspaces, Turborepo, Nx, Lerna, Rush, moon, changesets), проверка границ модулей (dependency-cruiser, eslint-plugin-boundaries, Nx, `turbo boundaries`, Sheriff, `exports`), деревья каталогов для сервиса, библиотеки и монорепозитория, DI и composition root, конфигурация, архитектура ошибок, доменная модель, события, CQRS и outbox, graceful shutdown и health checks, кодовые базы для изучения. В конце: таблицы сравнения DI и инструментов монорепозитория, таблицы решений, антипаттерны, спорные места и чеклист ревью. Актуально на ноябрь 2026: Node 26 — Active LTS с 28 октября 2026 (26.13.0), Node 24 и Node 22 — Maintenance LTS, Node 20 — EOL; pnpm 12.18, npm 12.2, Turborepo 2.11, Nx 24, NestJS 12, InversifyJS 8, Awilix 13, changesets 3, TypeScript 7. Соседние темы: `package.json`, запуск TS и публикация — [toolchain.md](toolchain.md); тесты — [testing.md](testing.md); типизация и schema-валидаторы — [typescript.md](typescript.md); Fastify, Express, NestJS, базы и брокеры — [domains-server.md](domains-server.md); сборка библиотек и фронтенда — [domains-client.md](domains-client.md); worker threads и `AsyncLocalStorage` — [concurrency-async-native.md](concurrency-async-native.md). Главный практический вывод: npm workspace не является границей модулей. Границы держат `exports`, изоляция pnpm и проверки в CI.

- [Версии инструментов](#версии-инструментов)
- [Структура сервиса: компоненты, слои, гексагональная архитектура](#структура-сервиса-компоненты-слои-гексагональная-архитектура)
- [Монорепозитории и workspaces](#монорепозитории-и-workspaces)
- [Проверка границ модулей](#проверка-границ-модулей)
- [Деревья каталогов](#деревья-каталогов)
- [DI и composition root](#di-и-composition-root)
- [Конфигурация](#конфигурация)
- [Архитектура ошибок](#архитектура-ошибок)
- [Доменная модель, события, CQRS и outbox](#доменная-модель-события-cqrs-и-outbox)
- [Graceful shutdown и health checks](#graceful-shutdown-и-health-checks)
- [Монолит, модульный монолит, микросервисы](#монолит-модульный-монолит-микросервисы)
- [Кодовые базы для изучения](#кодовые-базы-для-изучения)
- [Таблицы сравнения и решений](#таблицы-сравнения-и-решений)
- [Антипаттерны](#антипаттерны)
- [Спорные места](#спорные-места)
- [Чеклист ревью архитектуры](#чеклист-ревью-архитектуры)

## Версии инструментов

### Ключевые выводы

- Версии взяты из реестра npm 6 ноября 2026. Дата — публикация тега `latest`, а не `time.modified` (у заброшенных пакетов вроде typedi `time.modified` бывает на годы позже реального релиза).
- «Затих» — нет релиза больше 18 месяцев. Такие пакеты не берите в новый код без причины.
- npm 12 требует Node `^22.22.2 || ^24.15.0 || >=26`. Подробности о линиях Node — в [toolchain.md](toolchain.md).
- Версии DI-контейнеров и инструментов монорепозитория — в таблицах A и B раздела [Таблицы сравнения и решений](#таблицы-сравнения-и-решений).

| Область | Пакет | Последняя версия (дата) | Примечание |
|---|---|---|---|
| Node | линии релизов | 26.13.0 «Lithium» (2026-10-28, LTS с октября 2026); 24.22.2 «Krypton» (2026-10-27); 22.23.4 «Jod» (2026-10-20); 25.9.0 (2026-03-31, нечётная, EOL); 27.0.0-alpha (2026-10-29) | Node 20 «Iron»: последний релиз 20.20.2 (2026-03-24), EOL |
| Менеджеры пакетов | pnpm / npm / Yarn / Bun | pnpm 12.18.0 (2026-11-05), npm 12.2.2 (2026-11-04), @yarnpkg/cli-dist 4.18.1 (2026-09-24), bun 1.4.4 (2026-10-22) | |
| Границы | dependency-cruiser | 18.7.2 (2026-11-02) | Node `^22 \|\| ^24 \|\| >=26` |
| Границы | eslint-plugin-boundaries | 7.4.2 (2026-11-05) | v7: одно правило `boundaries/dependencies` с policies |
| Границы | @softarc/sheriff-core, @softarc/eslint-plugin-sheriff | 0.20.0 (2026-09-29) | Всё ещё 0.x |
| Границы | madge | 8.0.0 (2024-08-05) | Затих. Циклы ищите правилом `no-circular` в dependency-cruiser |
| Границы | knip | 6.44.1 (2026-10-31) | Неиспользуемые файлы, экспорты, зависимости |
| Конфигурация | dotenv | 18.0.9 (2026-10-22) | В Node есть встроенный `--env-file` (стабилен с 24.10 / 22.21) |
| Конфигурация | envalid | 9.0.0 (2026-10-23) | Node >=22 |
| Конфигурация | env-schema 8.0.1, @fastify/env 7.0.1 (2026-10), convict 6.2.5 (2026-03), config 5.0.1 (2026-08), @t3-oss/env-core 0.13.11 (2026-03), @dotenvx/dotenvx 2.38.2 (2026-10) | | env-var 7.5.0 (2024-05-20) затих |
| Валидация | zod 4.6.7 (2026-10-12), typebox 1.4.4 (2026-11-04) | | `typebox` 1.x — новое имя пакета; `@sinclair/typebox` 0.34.x — старая линия |
| Shutdown | close-with-grace | 2.5.0 (2026-02-21) | Matteo Collina; сигналы и фатальные ошибки в одном обработчике |
| Shutdown | lightship | 9.1.0 (2026-10-23) | Node >=22.13 |
| Shutdown | @godaddy/terminus 4.12.1 (2023-06-23), http-terminator 3.2.0 (2022-03-10), stoppable 1.1.0 (2018) | | [устарело]: с Node 19 `server.close()` сам закрывает idle keep-alive соединения |
| Shutdown | @nestjs/terminus | 12.1.0 (2026-09-20) | Health indicators для Nest |
| Ошибки / FP | effect | 4.1.2 (2026-11-02) | 4.0 вышел 2026-09-30 с обещанием долгой поддержки; `@effect/platform-node` 4.1.2 |
| Ошибки / FP | neverthrow | 8.2.0 (2025-02-21) | Затих (~20 месяцев) |
| События | @nestjs/cqrs 12.1.2 (2026-10-27), @event-driven-io/emmett 0.42.4 (2026-08-12), pg-boss 12.38.1 (2026-11-05), bullmq 6.7.1 (2026-11-06) | | Emmett всё ещё 0.x |
| Сервер приложений | wattpm / @platformatic/runtime | 3.77.0 (2026-11-05) | Platformatic Watt, Node >=22.19 |
| Фреймворки | fastify 5.12.8 (2026-11-02), express 5.3.0 (2026-10-09), fastify-plugin 6.0.1, @fastify/autoload 6.5.1 | | См. [domains-server.md](domains-server.md) |
| TS | typescript | 7.0.2 (2026-07-08) | Нативный компилятор на Go теперь `typescript@7`; см. [typescript.md](typescript.md) |

## Структура сервиса: компоненты, слои, гексагональная архитектура

### Ключевые выводы

- **Сначала бизнес-компоненты, внутри — слои.** Node Best Practices 1.1/1.2 (Yoni Goldberg и соавторы, README обновлён до «2026 edition» в июле 2026): верхний уровень — `apps/` (бизнес-компоненты `orders`, `users`, `payments`, у каждого свой `package.json`) и `libraries/` (общий сквозной код: логгер, аутентификация). Внутри компонента: `entry-points` / `api` (контроллеры, консьюмеры сообщений), `domain` (логика), `data-access` (БД).
- Держите `req`/`res` вне домена. Тогда тот же код переиспользуют задачи по расписанию, очереди, CLI и тесты.
- Контрпример — верхнеуровневые `controllers/`, `services/`, `models/`. Такая раскладка прячет, что делает система, и размазывает каждую фичу по всему дереву.
- **Гексагональная архитектура (ports and adapters) в TS**: ядро объявляет порты как `interface` или типы функций; адаптеры лежат в `infrastructure/` и связываются в composition root.
- Самый полный TS-пример — Sairyss/domain-driven-hexagon (NestJS, Slonik): модули по доменным понятиям, папки use case (вертикальные срезы), слои domain / application (commands, queries, ports) / interface adapters (контроллеры, DTO) / infrastructure (репозитории, модели хранения). Его README сам предупреждает: полный стек «ill-suited to simple CRUD apps», большинству проектов нужна малая часть, не нужны value objects для каждого примитива и отдельные модели хранения в маленьких проектах.
- **Правило для Node**: по умолчанию 3 уровня (entry points → domain → data access). Явные порты добавляйте только там, где адаптер нужно заменить или подделать: платёжный шлюз, почта, часы, внешний API. Не ставьте интерфейс перед драйвером БД «на всякий случай».
- **Отделяйте сборку приложения от `listen()`.** Экспортируйте фабрику `buildApp(deps)` / `createServer(config)`, а запускайте её в тонком `main.ts`. `app.inject()` в Fastify и supertest работают с приложением без занятого порта. Эта же точка — composition root (раздел [DI и composition root](#di-и-composition-root)). [не проверено: старый пункт 1.2 Node Best Practices «separate Express app and server», теперь он влит в пункт о слоях]
- **Модуль в Fastify — encapsulated plugin.** Каждая фича регистрирует маршруты, декораторы и хуки в своём контексте плагина. `fastify-plugin` намеренно ломает инкапсуляцию для общей инфраструктуры (пул БД, аутентификация). `@fastify/autoload` грузит `plugins/` (общие, без инкапсуляции) и `routes/` (инкапсулированы по папкам) [не проверено; подробнее в [domains-server.md](domains-server.md)].
- **NestJS** навязывает модули (`@Module`), providers и контроллеры. По сути это фреймворк слоёного или модульного монолита с DI-контейнером. Node Best Practices 1.5 (новый пункт): Nest подходит большим командам с ООП-стилем, Fastify — небольшим сервисам, разбитым на компоненты.
- **Node Best Practices 1.6 (новый пункт)**: «Use TypeScript sparingly and thoughtfully». Типы — да, сложная типовая акробатика — только при реальной нужде.

```ts
// src/app.ts — сборка без listen(): тесты вызывают buildApp(fakes) и app.inject()
import Fastify from 'fastify';
import type { Container } from './composition-root.ts';
import { ordersRoutes } from './components/orders/entry-points/http/routes.ts';

export async function buildApp(container: Container) {
  const app = Fastify({ logger: true });
  await app.register(ordersRoutes, { placeOrder: container.placeOrder });
  app.addHook('onClose', async () => { await container.dispose(); });
  return app;
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) | Yoni Goldberg et al., 2026 edition | Раздел 1 (архитектура) и раздел 2 (ошибки) |
| [Structure your solution by components](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/projectstructre/breakintcomponents.md) | Yoni Goldberg | `apps/` + `libraries/`, дерево компонента, антипример |
| [practicajs/practica](https://github.com/practicajs/practica) | Yoni Goldberg et al. (сообщество) | Генератор монорепозитория сервиса по компонентам и трём уровням |
| [Sairyss/domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon) | Sairyss | Полный DDD + hexagonal + CQRS на TS/NestJS, с явными оговорками |
| [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/) | Alistair Cockburn, 2005 | Исходная статья о ports and adapters |
| [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) | Robert C. Martin, 2012 | Правило зависимостей |
| [elemikelo/typescript-ddd-hexagonal](https://github.com/elemikelo/typescript-ddd-hexagonal) | elemikelo | Bounded contexts × domain/application/infrastructure |
| [Sairyss/backend-best-practices](https://github.com/Sairyss/backend-best-practices) | Sairyss | Сопутствующий чеклист бэкенда |

## Монорепозитории и workspaces

### Ключевые выводы

- **Раскладка** (документация Turborepo, так же в практике Nx и pnpm): деплоящиеся приложения — в `apps/`, всё остальное (библиотеки, конфиги, инструменты) — в `packages/`. Каждый каталог с `package.json` — пакет. Давайте внутренним пакетам scope (`@acme/…`; Turborepo в примерах пишет `@repo/…`).
- Корневой `package.json` — `"private": true`, фиксирует менеджер пакетов (`packageManager` / `devEngines`) и содержит только devDependencies для оркестрации.
- **Антипаттерны из документации Turborepo**: вложенные пакеты (`apps/a` и `apps/a/b`) не поддерживаются; нельзя импортировать через `../` в чужой пакет — зависьте от него по имени; большинству workspace **не нужен** корневой `tsconfig.json`, каждый пакет наследует общий конфиг-пакет.
- Turborepo советует `exports` вместо barrel-файлов: «barrel files can hurt bundler performance». Пакет может экспортировать TS-исходники напрямую («Just-in-Time» internal packages) или собранный код.
- **pnpm workspaces**: файл `pnpm-workspace.yaml`; протокол `workspace:*|^|~` при `pnpm publish` заменяется на реальные диапазоны; `linkWorkspacePackages` по умолчанию `false` (связываются только `workspace:`-зависимости); один общий `pnpm-lock.yaml`.
- Изоляция pnpm строгая: «Packages still only see dependencies declared in their own `package.json`». Фантомных зависимостей нет. `disallowWorkspaceCycles` запрещает циклы. `injectWorkspacePackages` ставит жёстко связанные копии — нужно, когда потребитель должен видеть собранный код со своими peer-зависимостями.
- pnpm 12.7 сам создаёт `pnpm-workspace.yaml` из поля `workspaces`. **Catalogs** (протокол `catalog:`, с pnpm 9.5) держат диапазоны версий в одном месте — в `pnpm-workspace.yaml`.
- **npm workspaces поднимают всё в корневой `node_modules`.** Проверено локально на Node 24.17 (Windows 11): пакет `@acme/domain` *без* зависимостей успешно импортировал `@acme/adapters`. **Workspace npm (и Yarn с linker `node-modules`, и Bun) — не граница.** Необъявленные зависимости ловят изолированная раскладка pnpm или Yarn PnP; иначе добавьте dependency-cruiser, knip или `import-x/no-extraneous-dependencies` (раздел [Проверка границ модулей](#проверка-границ-модулей)).
- **`exports` — самый дешёвый способ инкапсуляции.** В той же проверке `import('@acme/adapters/src/internal.js')` упал с `ERR_PACKAGE_PATH_NOT_EXPORTED`: пакет объявлял только `"exports": { ".": "./src/index.js" }`. Объявляйте `exports` в каждом внутреннем пакете.
- **Task runners.** Turborepo (Rust): кеш, `--affected`, `turbo query` стабилен с 2.9, boundaries экспериментальны, 2.10 — graceful shutdown задач, 2.11 — Rust, Python, Go. Nx: граф проектов, генераторы, `@nx/enforce-module-boundaries`, Nx Cloud; в 23 появились sandboxing задач и «Nx Migrate 2.0» [не проверено], сейчас актуальна 24.
- Lerna 10 — тонкий слой версионирования и публикации поверх Nx, его поддерживает Nx. Rush (Microsoft, строгие политики, большие организации), moon (Rust, полиглот), lage (Microsoft), wireit (Google, кеш на уровне скриптов прямо в `package.json`) — поддерживаемые альтернативы.
- **Версии и публикация**: changesets 3.0 — ESM, Node `^22.11 || ^24 || >=26`, Yarn Classic не поддерживается, `changeset git-tag`, приватные пакеты по умолчанию не версионируются, повышение peer-зависимости теперь `patch`, а не `major`, опция `format` заменила `prettier` и поддерживает `oxfmt`, `dprint`, `deno`. Альтернативы: `lerna version/publish`, release-please, semantic-release. Версии выравнивайте syncpack или catalogs pnpm.
- Статья «Lerna has gone — which monorepo is right for a Node.js backend now?» (Goldberg и Solomon, 2022) сравнивает Turborepo, Nx, pnpm, Yarn/npm workspaces и Lerna для бэкенд-приложений и описывает инструменты монорепозитория как слои, начиная с обычных папок без инструментов [не проверено: прочитан только фрагмент]. Посылка «Lerna ушла» [устарело]: Lerna в 2022 перешла к Nrwl и в 2026 поддерживается (v10). Аргумент о слоях остаётся в силе.

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
catalog:
  zod: ^4.6.7
```

```json
{
  "name": "@acme/api",
  "private": true,
  "type": "module",
  "dependencies": {
    "@acme/orders-domain": "workspace:*",
    "zod": "catalog:"
  }
}
```

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

```bash
pnpm --filter @acme/api... build      # пакет и всё, от чего он зависит
pnpm turbo run test --affected        # только затронутые изменением пакеты
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Structuring a repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) | Vercel | apps/packages, `exports`, антипаттерны |
| [Turborepo blog](https://turborepo.dev/blog) | Vercel | Посты о релизах 2.4–2.11 |
| [Turborepo: boundaries](https://turborepo.dev/docs/reference/boundaries) | Vercel | `turbo boundaries` (экспериментально) |
| [pnpm: workspaces](https://pnpm.io/workspaces) | pnpm | Протокол `workspace:`, изоляция, injected-зависимости |
| [pnpm: catalogs](https://pnpm.io/catalogs) | pnpm | Константы версий `catalog:` [не проверено] |
| [Nx: enforce module boundaries](https://nx.dev/docs/features/enforce-module-boundaries) | Nrwl | Теги, `depConstraints`, правила для ESLint, oxlint и conformance |
| [Lerna](https://lerna.js.org/) | Nx | Lerna сегодня |
| [changesets CHANGELOG](https://raw.githubusercontent.com/changesets/changesets/main/packages/cli/CHANGELOG.md) | changesets | Ломающие изменения 3.0 |
| [Lerna has gone — which monorepo is right for a Node.js backend now?](https://medium.com/autodesk-tlv/lerna-has-gone-which-monorepo-is-right-for-a-node-js-backend-fc075cad51b0) | Yoni Goldberg, Michael Solomon, 2022 | Выбор монорепозитория для бэкенда [не проверено] |
| [npm: workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) | npm | npm workspaces [не проверено] |
| [Yarn: workspaces](https://yarnpkg.com/features/workspaces) | Yarn | Workspaces и constraints в Yarn Berry [не проверено] |
| [Rush](https://rushjs.io/) | Microsoft | Rush [не проверено] |
| [moon](https://moonrepo.dev/) | moonrepo | moon [не проверено] |
| [google/wireit](https://github.com/google/wireit) | Google | Кеш на уровне скриптов [не проверено] |

## Проверка границ модулей

### Ключевые выводы

- Node не мешает импортировать что угодно откуда угодно. Направление зависимостей держат только `exports` и проверки в CI. Правило без проверки со временем нарушают.
- **dependency-cruiser** (Sander Verweij) проверяет и рисует граф зависимостей JS/TS: ESM, CJS, AMD, файлы `.ts/.tsx/.vue/.svelte`. `npx depcruise --init` создаёт `.dependency-cruiser.js` со стартовыми правилами: циклы, сироты, зависимости, не объявленные в `package.json`, продакшен-код на devDependencies. Репортеры: `err`, `dot`, `html`, `mermaid`, `json`, `csv`. С v13 `--config` находится автоматически. Для `.ts` нужен `typescript` < 7 или swc (`parser: 'swc'`): dependency-cruiser 18.7 ещё не поддерживает TypeScript 7 и при одном `typescript@7` обходит 0 модулей, печатает предупреждение `missing-typescript-transpiler` и завершается с кодом 0 (проверено локально) — в CI такая проверка молча проходит.
- Проверено локально на Node 24.17 (Windows 11): правило `forbidden` `{from: {path: '^packages/domain'}, to: {path: '^packages/adapters'}}` нашло `packages/domain/src/index.js → packages/adapters/src/index.js`, процесс завершился с кодом 1. `depcruise-baseline` позволяет включить правила на старом коде и постепенно гасить известные нарушения.
- **Подвох цепочки поставок.** `npx depcruise`, запущенный до окончания локальной установки, скачал из реестра *другой* пакет с именем `depcruise` — заглушку против dependency confusion (проверено локально). В скриптах и CI запускайте локальные инструменты через `npx --no-install <bin>` или `npm exec --no`.
- **eslint-plugin-boundaries 7.x** (Javier Brea): файлы делятся на *elements* (`boundaries/elements`: `type` + `pattern`), *категории файлов* (`boundaries/files`, например тесты) и *происхождение модуля* (external, local, core). Одно правило `boundaries/dependencies` с `default: 'disallow'` и `policies` (`from` / `allow` / `disallow`) может ограничивать и внешние пакеты (например, `axios` — только в контроллерах). Документация — jsboundaries.dev, есть гайд миграции v6→v7. В отличие от CLI-инструментов, даёт подсветку в IDE.
- **Nx**: проектам ставят теги (`scope:orders`, `type:feature|data-access|util`), в `depConstraints` задают `onlyDependOnLibsWithTags`. Проект без тегов не может зависеть ни от чего, если не разрешён `*`. Правило — `@nx/enforce-module-boundaries` (ESLint) или плагин границ `@nx/oxlint` (экспериментальный). Правило conformance в Nx Enterprise `@nx/conformance/enforce-project-boundaries` работает по графу проектов для любого языка.
- **`turbo boundaries`** (экспериментально): находит импорты файлов за пределами пакета и импорты необъявленных пакетов. `tags` в `turbo.json` пакета плюс корневые `boundaries.tags` с `dependencies`/`dependents` и `allow`/`deny`; проверка транзитивная.
- **Sheriff** (Rainer Hahnekamp, softarc): модуль задаётся публичным API в `index.ts`, теги и `depRules` — в `sheriff.config.ts`, есть плагин ESLint и CLI для проверки, списка и экспорта графа. Зависимостей кроме TS нет. Всё ещё 0.20.
- **Дешёвые встроенные средства**: `exports` (жёсткая инкапсуляция во время выполнения, см. выше), `imports` пакета (`#internal/*`) для внутренних алиасов, ESLint `no-restricted-imports` / `import-x/no-restricted-paths`, project references в TypeScript (`composite`, `references`) — нельзя компилироваться против проекта, на который нет ссылки.
- **Гигиена зависимостей**: knip находит неиспользуемые файлы, экспорты, зависимости и неперечисленные зависимости во всех workspace — дополняет проверку границ. madge (циклы, графы) затих с августа 2024; циклы ловит `no-circular` в dependency-cruiser.

```js
// .dependency-cruiser.cjs — запуск: npx --no-install depcruise src
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment: 'domain не знает о транспорте и хранилище',
      from: { path: '^src/components/[^/]+/domain' },
      to: { path: ['/entry-points/', '/data-access/', '^node_modules/(fastify|express|pg)/'] },
    },
    {
      name: 'only-public-api-between-components',
      severity: 'error',
      from: { path: '^src/components/([^/]+)/' },
      to: { path: '^src/components/', pathNot: ['^src/components/$1/', '^src/components/[^/]+/index\\.ts$'] },
    },
  ],
  options: { doNotFollow: { path: 'node_modules' }, tsConfig: { fileName: 'tsconfig.json' } }, // без doNotFollow no-circular находит циклы внутри node_modules
};
```

```js
// eslint.config.js — быстрый запрет без плагинов
export default [
  {
    files: ['src/components/*/domain/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['fastify', 'express', 'pg', '**/entry-points/**', '**/data-access/**'],
                     message: 'domain не импортирует транспорт и хранилище' }],
      }],
    },
  },
];
```

```js
// eslint.config.mjs в Nx (flat config): правило границ по тегам scope × type
import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      '@nx/enforce-module-boundaries': ['error', {
        depConstraints: [
          { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },
          { sourceTag: 'scope:orders', onlyDependOnLibsWithTags: ['scope:orders', 'scope:shared'] },
        ],
      }],
    },
  },
];
```

```json
{
  "name": "@acme/orders-domain",
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "imports": { "#internal/*": { "types": "./dist/internal/*.d.ts", "default": "./dist/internal/*.js" } }
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [sverweij/dependency-cruiser](https://github.com/sverweij/dependency-cruiser) | Sander Verweij | Правила, репортеры, `--init` |
| [JS Boundaries](https://www.jsboundaries.dev/) | Javier Brea | Документация eslint-plugin-boundaries v7 |
| [javierbrea/eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) | Javier Brea | Пример `boundaries/dependencies` во flat config |
| [Nx: tag in multiple dimensions](https://nx.dev/docs/guides/enforce-module-boundaries/tag-multiple-dimensions) | Nrwl | Теги scope × type [не проверено] |
| [softarc-consulting/sheriff](https://github.com/softarc-consulting/sheriff) | Rainer Hahnekamp | Sheriff |
| [Sheriff: modularity in TypeScript applications](https://www.speakerdeck.com/rainerhahnekamp/sheriff-modularity-in-typescript-applications) | Rainer Hahnekamp, 2023 | Слайды доклада о Sheriff [не проверено] |
| [Node.js: subpath exports](https://nodejs.org/api/packages.html#subpath-exports) | Node.js | `exports` и `imports` [не проверено] |

## Деревья каталогов

### Ключевые выводы

- Деревья ниже — шаблоны, собранные из Node Best Practices 1.1–1.3, Practica, гайда Turborepo по структуре, Sairyss/domain-driven-hexagon и проверенного поведения `exports`. Это не цитаты.
- Дерево имеет смысл только вместе с правилами импорта под ним. Правила закрепляйте в CI (раздел [Проверка границ модулей](#проверка-границ-модулей)).

### Сервис: один деплой, компоненты, три уровня, TypeScript

```text
orders-service/
├─ package.json            # "type": "module", "engines", "imports": {"#*": "./src/*"}; приложению "exports" не нужен
├─ tsconfig.json           # module nodenext, verbatimModuleSyntax, erasableSyntaxOnly (см. typescript.md)
├─ .env.example            # только документированные ключи, без секретов; реальные значения даёт платформа
├─ src/
│  ├─ main.ts              # точка входа процесса: конфиг, сборка приложения, listen, установка shutdown
│  ├─ app.ts               # buildApp(deps): экземпляр Fastify/Express без listen() -> тесты через inject()
│  ├─ composition-root.ts  # createContainer(config): связывает пулы, репозитории, сервисы
│  ├─ config.ts            # один типизированный, проверенный, замороженный объект конфигурации
│  ├─ components/
│  │  ├─ orders/
│  │  │  ├─ entry-points/
│  │  │  │  ├─ http/routes.ts        # валидация схемы + вызов use case + маппинг ошибок
│  │  │  │  └─ messaging/consumer.ts # те же use case, но из очереди
│  │  │  ├─ domain/
│  │  │  │  ├─ order.ts              # типы, инварианты, чистые функции
│  │  │  │  ├─ place-order.ts        # use case: (deps) => async (cmd) => result
│  │  │  │  └─ errors.ts             # OrderNotFound, InsufficientStock (наследники AppError)
│  │  │  ├─ data-access/
│  │  │  │  ├─ order-repository.ts   # SQL/ORM живёт только здесь
│  │  │  │  └─ outbox.ts             # пишет события в той же транзакции
│  │  │  └─ index.ts                 # публичный API компонента (что могут импортировать другие)
│  │  └─ payments/ ...
│  └─ shared/              # сквозное и без фреймворка: логгер, базовая ошибка, часы, id
├─ test/                   # или *.test.ts рядом с кодом; компонентные тесты: app.inject() + реальная БД (testing.md)
├─ migrations/
├─ Dockerfile              # exec-форма CMD ["node","dist/main.js"], чтобы SIGTERM получил сам Node
└─ .dependency-cruiser.cjs # domain не импортирует entry-points и чужой data-access
```

Правила, без которых дерево ничего не значит:

- `domain/` ничего не импортирует из `entry-points/` и из HTTP-фреймворков.
- Компоненты общаются только через `components/<x>/index.ts`.
- `shared/` никогда не импортирует компонент.

### Библиотека: публикуемый npm-пакет

```text
my-lib/
├─ package.json     # "name", "version", "type": "module", "exports" (с "types"), "files": ["dist"],
│                   # "engines", "sideEffects": false; только ESM — нормально для Node >= 20.19 / 22.12 (require(esm))
├─ src/
│  ├─ index.ts      # курируемый публичный API: только явные именованные реэкспорты
│  ├─ client.ts     # публичный модуль
│  └─ internal/     # нет в "exports" -> у потребителя ERR_PACKAGE_PATH_NOT_EXPORTED
├─ test/
├─ tsdown.config.ts # или tsc -p; выпускает dist/*.js + *.d.ts (см. domains-client.md)
├─ .changeset/      # если релизы идут через changesets
└─ README.md, CHANGELOG.md, LICENSE
```

Правила для библиотеки:

- Зависимости принимайте параметрами: объект опций, внедрённый `fetch`, интерфейс логгера.
- Не требуйте DI-контейнер и не читайте `process.env` в глубине кода.
- Никаких побочных эффектов при импорте.
- Перед публикацией проверяйте `publint` и `@arethetypeswrong/cli` (версии — в [toolchain.md](toolchain.md)).

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "sideEffects": false
}
```

### Монорепозиторий: pnpm + Turborepo или Nx

```text
acme/
├─ package.json            # "private": true, "packageManager": "pnpm@12.x", scripts: turbo run build/test/lint
├─ pnpm-workspace.yaml     # packages: ["apps/*", "packages/*"]; catalog: { zod: ^4.6.7, ... }
├─ turbo.json              # tasks + boundaries.tags (или nx.json + теги проектов)
├─ apps/
│  ├─ api/                 # деплой: HTTP-сервис (внутри — дерево сервиса выше)
│  ├─ worker/              # деплой: консьюмеры очередей на тех же доменных пакетах
│  └─ web/                 # необязательный фронтенд
├─ packages/
│  ├─ orders-domain/       # @acme/orders-domain: "exports": {".": "./src/index.ts"} (JIT) или "./dist/index.js"
│  ├─ db/                  # @acme/db: пул, миграции, репозитории
│  ├─ tsconfig/            # @acme/tsconfig: общие базовые tsconfig
│  ├─ eslint-config/       # @acme/eslint-config
│  └─ logger/              # @acme/logger
├─ .changeset/             # только если часть пакетов публикуется
└─ .dependency-cruiser.cjs # или eslint-plugin-boundaries / теги Nx / turbo boundaries
```

Правила для монорепозитория:

- Каждый пакет объявляет `exports` и каждую зависимость, которую импортирует (`workspace:*`).
- Никаких импортов `../../packages/x/src`, никаких вложенных пакетов. Приложения не импортируют другие приложения.
- `packages/*-domain` не зависят от `db` и пакетов фреймворков (правило по тегам).
- Изоляция pnpm ловит необъявленные зависимости. Подъём зависимостей в npm, Yarn `node-modules` и Bun — нет (проверено локально).
- **JIT internal packages**, которые экспортируют `.ts`-исходники. Проверено локально на Node 24.17 (Windows 11): приложение в npm workspace импортировало `@acme/tslib` с `exports` на `./src/index.ts`, и всё работало под нативным type stripping — симлинк workspace разрешается в реальный путь вне `node_modules`. Тот же пакет падает с `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` под `--preserve-symlinks` или когда лежит в `node_modules` настоящей копией (опубликован, `injectWorkspacePackages`, копии из `pnpm deploy` в Docker). Вывод: JIT-пакеты годятся для разработки и для деплоя монорепозитория с симлинками; всё, что публикуется или копируется, должно поставлять собранный JS (см. [toolchain.md](toolchain.md)).

```jsonc
// packages/orders-domain/turbo.json: теги пакета (turbo boundaries, экспериментально)
{ "extends": ["//"], "tags": ["domain"] }

// корневой turbo.json: правило тегов (проверяется и для зависимостей зависимостей)
{
  "boundaries": {
    "tags": {
      "domain": { "dependencies": { "deny": ["db", "framework"] } }
    }
  }
}
```

## DI и composition root

### Ключевые выводы

- **По умолчанию в Node — ручной DI с composition root.** Модули экспортируют фабрики (`createOrderService({ repo, clock, logger })`) или классы с параметрами конструктора. Одна функция (`createContainer(config)` / `buildApp`) один раз создаёт пул, репозитории и сервисы и передаёт их маршрутам и консьюмерам. Тесты вызывают те же фабрики с фейками.
- Замыкания и ES-модули делают контейнер ненужным для большинства сервисов. Кеш модулей Node и так даёт синглтоны, но прямой импорт синглтона связывает модули и мешает подмене. Это главная причина передавать зависимости явно. Понятие composition root — у Mark Seemann [не проверено].
- **Нативный type stripping меняет расчёт.** Проверено локально на Node 24.17 (Windows 11): `.ts`-файл с декоратором падает с `SyntaxError: Invalid or unexpected token`; parameter property в конструкторе (`constructor(private readonly clock: Clock)`) тоже падает; обычная фабрика `({ clock }: Deps) => ...` работает.
- Поэтому контейнеры на декораторах (NestJS, InversifyJS, tsyringe) требуют шага компиляции (tsc, swc, esbuild), а для внедрения через параметры конструктора — legacy `experimentalDecorators` + `emitDecoratorMetadata`. У стандартных декораторов TC39 нет декораторов параметров и метаданных о типах параметров. DI на функциях или явных полях оставляет открытым путь `erasableSyntaxOnly` (см. [typescript.md](typescript.md)).
- **Awilix 13** (Jeff Hansen), без декораторов. `InjectionMode.PROXY` (по умолчанию: конструктор деструктурирует proxy-объект cradle, переживает минификацию) против `CLASSIC` (читает имена параметров, ломается при минификации).
- Время жизни в Awilix: `TRANSIENT` (по умолчанию), `SCOPED`, `SINGLETON`. `container.createScope()` — scope на запрос, данные запроса регистрируются в нём. Режим `strict` (с v10) бросает ошибку при утечке времени жизни (синглтон или scoped захватил transient-зависимость), запрещает регистрировать синглтоны в scope и разрешает синглтоны только из корневого контейнера. `container.dispose()` вызывает disposers (например, закрытие пула) для scoped и singleton.
- `loadModules` в Awilix ищет модули по glob (асинхронно с `esModules`; после бандлинга не работает). Типизированный cradle — через цепочку `.register()` и `InferCradleFromContainer`. Интеграции: `@fastify/awilix`, `awilix-express`.
- **DI в NestJS 12.** Providers по умолчанию синглтоны. `Scope.REQUEST` поднимается по цепочке внедрения (request-scoped сервис делает request-scoped и свой контроллер) и стоит латентности: по документации, в хорошо спроектированном приложении — не больше примерно 5%.
- Для значений на запрос (пользователь, тенант, локаль) документация Nest советует хранилище `AsyncLocalStorage`, чтобы providers оставались синглтонами. Durable providers (`ContextIdStrategy`, `durable: true`) переиспользуют поддеревья на тенанта, но подходят при небольшом числе тенантов.
- Nest 12.0 (27 августа 2026): пакеты в ESM (CJS-приложения продолжают работать через `require(esm)`), Node 20.19+/22.12+, валидация Standard Schema через опцию `schema` у `@Body()/@Query()/@Param()` + `StandardSchemaValidationPipe`, lifecycle hooks вызываются по уровням иерархии, новые проекты по умолчанию на Vitest + oxlint, Rspack для монорепозиториев, codemods в `nest upgrade`.
- **InversifyJS 8** (2026-03-16): только ESM (из CJS грузится на Node 20.19+/22+ через `require(esm)`). Методы без суффикса теперь синхронные, а `*Async` — асинхронные (`loadAsync`, `unbindAsync`; в v7 было наоборот). `Provider`/`ProviderBinding` удалены в пользу `Factory`. Идентификаторы-функции разрешены только для newable. По-прежнему на декораторах (`@injectable`, `@inject`); один зависимый пакет пишет, что нужны legacy-декораторы [не проверено].
- **tsyringe 4.10** (Microsoft): нужны `experimentalDecorators`, `emitDecoratorMetadata` и полифил Reflect (`reflect-metadata`). Последний релиз — 2025-04-16, 63 открытых issue. Затих: в новом коде не берите.
- **typed-inject 5** (Nico Jansen): DI с проверкой при компиляции и без декораторов. Классы объявляют `static inject = ['logger', 'repo'] as const`; цепочка `createInjector().provideValue().provideClass().provideFactory()` строит дочерние injectors. «If your project compiles, you know your dependencies are resolved at runtime». Асинхронный `dispose()` идёт от дочерних к родителю. Последний релиз — декабрь 2024 (молчит, но маленький и законченный).
- **Другие варианты без декораторов**: iti, brandi, @needle-di/core (декораторы необязательны) [не проверено: документация]. typedi (2021) и typescript-ioc (2020) [устарело]: замена — Awilix или ручной DI.
- **Fastify вместо контейнера**: декорируйте экземпляр инфраструктурой (`fastify.decorate('db', pool)`) в плагинах `fastify-plugin` и передавайте `fastify.db` в доменные фабрики при регистрации маршрутов. `FastifyInstance` в домен не пускайте [не проверено].
- **Контекст запроса без request-scoped DI**: `AsyncLocalStorage` для request id, тенанта, пользователя. См. [concurrency-async-native.md](concurrency-async-native.md).

```ts
// composition-root.ts — ручной DI, работает под нативным type stripping
import pg from 'pg';
import type { Config } from './config.ts';
import { createOrderRepository } from './components/orders/data-access/order-repository.ts';
import { createPlaceOrder } from './components/orders/domain/place-order.ts';

export function createContainer(config: Config, overrides: Partial<Deps> = {}) {
  const pool = overrides.pool ?? new pg.Pool({ connectionString: config.DATABASE_URL });
  const clock = overrides.clock ?? { now: () => new Date() };
  const orders = createOrderRepository({ pool });
  const placeOrder = createPlaceOrder({ orders, clock });
  return {
    placeOrder,
    async dispose() { await pool.end(); },   // вызывается из обработчика shutdown
  };
}
export type Container = ReturnType<typeof createContainer>;
type Deps = { pool: pg.Pool; clock: { now(): Date } };
```

```ts
// domain/place-order.ts — use case как фабрика: зависимости явные, без декораторов
import type { Clock, OrderRepository, PlaceOrderCommand } from './order.ts';
import { InsufficientStockError } from './errors.ts';

export function createPlaceOrder({ orders, clock }: { orders: OrderRepository; clock: Clock }) {
  return async function placeOrder(cmd: PlaceOrderCommand) {
    const stock = await orders.stockFor(cmd.sku);
    if (stock < cmd.quantity) throw new InsufficientStockError(cmd.sku);
    return orders.create({ ...cmd, placedAt: clock.now() });
  };
}

// тест: createPlaceOrder({ orders: fakeOrders, clock: { now: () => new Date('2026-01-01') } })
```

```ts
// Awilix: тот же граф через контейнер; strict ловит утечки времени жизни
import { createContainer, asFunction, asValue, InjectionMode } from 'awilix';

const container = createContainer({ injectionMode: InjectionMode.PROXY, strict: true }).register({
  config: asValue(config),
  clock: asValue({ now: () => new Date() }),     // без него resolve('placeOrder') падает: Could not resolve 'clock'
  pool: asFunction(({ config }) => new pg.Pool({ connectionString: config.DATABASE_URL }))
    .singleton()
    .disposer((pool) => pool.end()),
  orders: asFunction(createOrderRepository).singleton(),
  placeOrder: asFunction(createPlaceOrder).singleton(),
});

const scope = container.createScope();          // на запрос
scope.register({ requestId: asValue(req.id) });
// при shutdown: await container.dispose();
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [jeffijoe/awilix](https://github.com/jeffijoe/awilix) | Jeff Hansen | Режимы, время жизни, scopes, strict, disposal |
| [NestJS: injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes) | NestJS | Scopes, всплытие, совет про ALS, durable providers |
| [NestJS: providers](https://docs.nestjs.com/providers) | NestJS | Основы providers [не проверено] |
| [NestJS: custom providers](https://docs.nestjs.com/fundamentals/custom-providers) | NestJS | `useValue` / `useFactory` / `useClass` [не проверено] |
| [NestJS v12.0.0 release](https://github.com/nestjs/nest/releases/tag/v12.0.0) | Kamil Myśliwiec, 2026 | Release notes Nest 12 |
| [NestJS 12 roadmap: ESM](https://infoq.com/news/2026/04/nestjs-12-roadmap-esm) | InfoQ, 2026 | План перехода Nest 12 на ESM [не проверено] |
| [Announcing Inversify 8.0.0](https://inversify.io/blog/announcing-inversify-8-0-0/) | Roberto Pintos López, 2026 | Изменения в Inversify 8 |
| [Inversify: migrating from v7](https://inversify.io/docs/guides/migrating-from-v7/) | InversifyJS | Гайд миграции [не проверено] |
| [microsoft/tsyringe](https://github.com/microsoft/tsyringe) | Microsoft | Требования, статус |
| [nicojs/typed-inject](https://github.com/nicojs/typed-inject) | Nico Jansen | Типобезопасный DI без декораторов |
| [molszanski/iti](https://github.com/molszanski/iti) | Michal Olszanski | iti [не проверено] |
| [vovaspace/brandi](https://github.com/vovaspace/brandi) | vovaspace | brandi [не проверено] |
| [Composition Root](https://blog.ploeh.dk/2011/07/28/CompositionRoot/) | Mark Seemann, 2011 | Понятие composition root [не проверено] |
| [Inversion of Control Containers and the DI pattern](https://martinfowler.com/articles/injection.html) | Martin Fowler, 2004 | DI против service locator [не проверено] |
| [Node.js Design Patterns, fourth edition](https://loige.co/nodejs-design-patterns-fourth-edition/) | Luciano Mammino, 2025 | Анонс 4-го издания (Node 24; модульный дизайн и DI) [не проверено] |
| [Node.js Design Patterns (Packt)](https://www.packtpub.com/en-de/product/nodejs-design-patterns-fourth-edition-9781803238944) | Casciaro, Mammino, 2025-09-25 | Страница книги, 732 стр. [не проверено] |

## Конфигурация

### Ключевые выводы

- **12-factor**: всё, что меняется между деплоями (подключения к БД, учётные данные, хосты), живёт в переменных окружения. Тест: можно ли прямо сейчас открыть репозиторий, не раскрыв учётных данных? Именованные «окружения» (наборы dev/staging/prod) комбинаторно разрастаются — управляйте каждой переменной отдельно.
- **Встроенная загрузка `.env`**: `node --env-file=.env` (добавлен в 20.6; не экспериментальный с 24.10 / 22.21), `--env-file-if-exists` (22.9), `process.loadEnvFile(path)`, `util.parseEnv(str)`.
- Реальные переменные окружения **побеждают** файл. При нескольких `--env-file` поздние файлы перекрывают ранние. `NODE_OPTIONS` внутри файла учитывается. `dotenv` теперь нужен только для старого Node или дополнительных функций (dotenvx добавляет шифрование).
- **Проверить один раз при старте, упасть сразу, заморозить, внедрить.** Соберите один типизированный объект конфигурации в composition root. Не читайте `process.env.X` в глубоких модулях: это не тестируется, ошибки в именах не видны, связь скрыта.
- Node Best Practices 1.4 (обновлён): конфигурация, зависящая от окружения, безопасная, иерархическая, проверяемая при старте; называет convict, env-var и zod. Старая подробная страница ещё перечисляет rc, nconf, config, convict. В 2026 берите проверку схемой (сам env-var затих с мая 2024).
- **envalid 9**: `cleanEnv` с `str/num/bool/url/port/email/json/host`, `choices`, `devDefault`/`testDefault`, `requiredWhen`. Результат — неизменяемый Proxy, из-за чего ломается `structuredClone`. Свой `reporter`. v9 требует Node >= 22.
- **`@t3-oss/env-core`**: `createEnv` с любым валидатором Standard Schema, `runtimeEnvStrict`, рекомендуется `emptyStringAsUndefined: true`, разделение server/client по префиксу; только ESM.
- Другие варианты: обычный разбор `process.env` через Zod 4 / Valibot / TypeBox; `@fastify/env` / `env-schema` (JSON Schema через Ajv); `convict` для иерархической конфигурации из файлов и окружения; `config` (node-config) для файлов на окружение. `@nestjs/config` в Nest 12 проверяет через Standard Schema (Joi — с v18).
- **Секреты** приходят от платформы (Kubernetes Secrets, облачные менеджеры секретов, Docker secrets), а не из закоммиченного `.env`. `.env.example` документирует ключи. В лог пишите *имена* отсутствующих ключей, никогда не значения.
- **Приводите типы явно.** Значения окружения — всегда строки (`'0'` истинно). Пустую строку считайте отсутствием значения.

```ts
// config.ts — проверяется один раз, замораживается, передаётся в createContainer(config)
import { z } from 'zod';
const Schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url(),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});
export type Config = z.infer<typeof Schema>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Readonly<Config> {
  const r = Schema.safeParse(env);
  if (!r.success) {
    // только имена ключей; значения не печатать (могут быть секретами)
    throw new Error(`Invalid config: ${r.error.issues.map((i) => i.path.join('.')).join(', ')}`);
  }
  return Object.freeze(r.data);
}
```

```bash
node --env-file=.env --env-file-if-exists=.env.local dist/main.js   # поздний файл перекрывает ранний
PORT=8080 node --env-file=.env dist/main.js                          # реальная переменная побеждает файл
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [The Twelve-Factor App: Config](https://12factor.net/config) | Adam Wiggins, 2011 | Конфигурация в окружении |
| [Node.js: environment variables](https://nodejs.org/api/environment_variables.html) | Node.js | Поддержка `.env`, `loadEnvFile`, `parseEnv` |
| [Node.js CLI: --env-file](https://nodejs.org/api/cli.html#--env-filefile) | Node.js | Приоритеты `--env-file` и история |
| [Config guide](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/projectstructre/configguide.md) | Yoni Goldberg | Иерархическая конфигурация, fail fast |
| [af/envalid](https://github.com/af/envalid) | Aaron Franks | API envalid |
| [T3 Env: core](https://env.t3.gg/docs/core) | t3-oss | Проверка окружения через Standard Schema |
| [fastify/fastify-env](https://github.com/fastify/fastify-env) | Fastify | `@fastify/env` [не проверено] |
| [mozilla/node-convict](https://github.com/mozilla/node-convict) | Mozilla | convict [не проверено] |
| [node-config/node-config](https://github.com/node-config/node-config) | node-config | Файлы на окружение [не проверено] |
| [dotenvx](https://dotenvx.com/) | dotenvx | Зашифрованный `.env` [не проверено] |

## Архитектура ошибок

### Ключевые выводы

- **Два класса ошибок** (Node Best Practices 2.3, со ссылкой на классический гайд Joyent). *Операционные* — ожидаемые сбои с известной причиной: таймаут, 404 от зависимости, ошибка валидации, нарушение ограничения. Их логируют, переводят в ответ, иногда повторяют. *Ошибки программиста* — баги: undefined-свойство, нарушенный инвариант, утёкший пул. «The best way to recover from programmer errors is to crash immediately», а перезапуск — дело супервизора.
- Помечайте известные ошибки `isOperational = true` (или типизированной иерархией `AppError`). Всё без пометки считайте багом.
- **Один централизованный обработчик** (Node Best Practices 2.4): объект `handleError(err)` логирует, шлёт метрику и решает, падать или отвечать. HTTP-middleware, cron, консьюмеры очередей, `uncaughtException` и `unhandledRejection` передают ошибки ему. Логику внутри error-middleware Express не переиспользуют ни задачи, ни тесты.
- **Правила самого Node**: `'uncaughtException'` — «a crude mechanism … intended to be used only as a last resort»; «It is not safe to resume normal operation after `'uncaughtException'`». Используйте его для синхронной очистки, затем выходите и полагайтесь на внешний супервизор.
- Необработанные rejection по умолчанию поднимаются как uncaught exception (`--unhandled-rejections=throw`). Если вывод ещё может быть не сброшен, ставьте `process.exitCode = 1` вместо `process.exit()`.
- **Перевод ошибок по слоям.** Домен бросает доменные ошибки (`OrderNotFound`, `InsufficientStock`) со стабильным машинным кодом и контекстом, без HTTP-статуса. data-access оборачивает ошибки драйвера в доменные или инфраструктурные через `new XError('...', { cause: err })` (`Error.cause` из ES2022).
- Только точка входа переводит ошибку в транспорт. HTTP — RFC 9457 Problem Details (`application/problem+json` с `type`, `title`, `status`, `detail`, `instance` и расширениями; отменяет RFC 7807). CLI — коды выхода. Очереди — решение «повторить или в dead-letter».
- **Fastify**: `setErrorHandler` на каждый контекст инкапсуляции (каждый плагин фичи переводит свои ошибки); `createError(code, message, statusCode)` из `@fastify/error` — типизированные ошибки с кодами; ошибки валидации схемы приходят со свойством `validation` [не проверено; см. [domains-server.md](domains-server.md)].
- **Result-типы против исключений.** Effect 4.0 (2026-09-30, «dependency-free core and long-term support») и neverthrow (молчит с февраля 2025) выражают ожидаемые сбои в типах. Sairyss советует возвращать результат для ожидаемых ошибок и бросать исключение для невосстановимых. Это решение на всю команду: смешивать стили по модулям — худший вариант. Подробнее — в [typescript.md](typescript.md) и разделе [Спорные места](#спорные-места).
- **Внутри `try` пишите `return await`**, чтобы кадр остался в async stack trace (Node Best Practices 2.12). Подписывайтесь на `'error'` у каждого своего EventEmitter и потока (2.13).

```ts
// shared/errors.ts
export class AppError extends Error {
  readonly isOperational = true;
  readonly code: string;
  readonly httpStatus: number;
  // явные поля вместо parameter properties: те не работают под type stripping и erasableSyntaxOnly
  constructor(code: string, message: string, httpStatus = 500, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
export class NotFoundError extends AppError {
  constructor(what: string, id: string) { super('NOT_FOUND', `${what} ${id} not found`, 404); }
}
// точка входа: перевод в одном месте
export function toProblem(err: unknown) {
  if (err instanceof AppError) return { status: err.httpStatus, body: { type: `urn:problem:${err.code}`, title: err.code, status: err.httpStatus, detail: err.message } };
  return { status: 500, body: { type: 'about:blank', title: 'Internal Server Error', status: 500 } }; // лог + алерт; подумайте о падении
}
```

```ts
// data-access: обёртка ошибки драйвера с сохранением причины
try {
  return await pool.query(sql, params);   // return await — кадр останется в стеке
} catch (err) {
  throw new AppError('DB_UNAVAILABLE', 'orders query failed', 503, { cause: err });
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Distinguish operational vs programmer errors](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/operationalvsprogrammererror.md) | Yoni Goldberg | Операционные ошибки против ошибок программиста |
| [Handle errors centrally](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/centralizedhandling.md) | Yoni Goldberg | Централизованный обработчик |
| [Node.js: process](https://nodejs.org/api/process.html) | Node.js | Предупреждение о `uncaughtException`, `exitCode` |
| [Node.js: errors](https://nodejs.org/api/errors.html) | Node.js | Классы ошибок, `cause`, коды |
| [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457) | IETF, 2023 | Problem Details |
| [Fastify: errors](https://fastify.dev/docs/latest/Reference/Errors/) | Fastify | Обработка ошибок, коды |
| [fastify/fastify-error](https://github.com/fastify/fastify-error) | Fastify | `createError` |
| [Effect 4.0](https://effect.website/blog/releases/effect/40) | Effect team, 2026-09-30 | Релиз Effect 4.0 |
| [supermacro/neverthrow](https://github.com/supermacro/neverthrow) | Giorgio Delgado | Result-тип |

## Доменная модель, события, CQRS и outbox

### Ключевые выводы

- **Моделируйте типами и функциями, классы — потом.** Дешёвые идиоматичные средства TS: discriminated unions для состояний (`type Order = Draft | Placed | Shipped`), branded ID (`type OrderId = string & { __brand: 'OrderId' }`), `readonly`-данные и чистые функции `(state, command) => events | error`.
- «Parse, don't validate» (Alexis King): разберите недоверенный ввод один раз на границе в тип, который доказывает корректность, и передавайте внутрь уже его. Техники типизации — в [typescript.md](typescript.md); schema-валидаторы на границах (Zod 4, Valibot, TypeBox, Standard Schema) — в [typescript.md](typescript.md) и [domains-server.md](domains-server.md).
- **Паттерн Decider** (decide / evolve) — ядро event sourcing, удобное в TS. Его использует Emmett (Oskar Dudycz): `decide(command, state) → events`, `evolve(state, event) → state`. Emmett поддерживает хранилища событий на PostgreSQL, EventStoreDB, MongoDB и SQLite, паттерны Decider и Workflow, read models; всё ещё 0.42.
- В репозитории EventSourcing.NodeJS у Дудыча есть примеры и курс для самостоятельного прохождения (события, потоки, optimistic concurrency, проекции). Inline-проекции обновляют read model в транзакции добавления события, но замедляют запись.
- **События внутри процесса.** `EventEmitter` в Node синхронный, порядок слушателей — только порядок регистрации, при падении события теряются, повторов нет. Годится для развязки внутри процесса, но не для интеграции. Исключение из слушателя всплывает к вызвавшему `emit`; необработанное событие `'error'` роняет процесс [не проверено].
- **Transactional outbox** (microservices.io): изменение данных и исходящее сообщение пишутся в одной транзакции БД. Ретранслятор (polling publisher или чтение журнала транзакций / CDC, например Debezium) публикует позже. Следствия: нет 2PC; сообщение уходит тогда и только тогда, когда транзакция зафиксирована; при падении ретранслятора возможны дубли, поэтому **консьюмеры должны быть идемпотентными** (храните ID обработанных сообщений); порядок по агрегату нужно сохранять при нескольких экземплярах ретранслятора.
- Реализации в Node: своя таблица + поллер на `pg` с `FOR UPDATE SKIP LOCKED` (статья freeCodeCamp 2026 года разбирает Postgres + SQS).
- Очереди задач в Postgres убирают двойную запись. pg-boss 12 может «create jobs in an existing db transaction, including adapters for popular ORMs such as Drizzle, Knex, Kysely, Prisma», у него воркеры на SKIP LOCKED, повторы с backoff, dead-letter-очереди и cron. Таблица очереди сама становится outbox.
- Задачи BullMQ живут в Redis и не входят в транзакцию Postgres → риск двойной записи.
- **CQRS**: модель записи (команды проходят через домен) отделена от модели чтения (запросы прямо в SQL или представления). `@nestjs/cqrs` 12 даёт CommandBus/QueryBus/EventBus и саги (RxJS) внутри процесса. У Sairyss запросы обходят репозитории и домен. Fowler: CQRS добавляет рискованную сложность и подходит только некоторым bounded contexts.
- **Брокеры** (подробно в [domains-server.md](domains-server.md)): Kafka через `@confluentinc/kafka-javascript` (kafkajs 2.2.4 затих с февраля 2023), RabbitMQ — `amqplib`, NATS — пакет `nats` устарел в пользу `@nats-io/transport-node` (Nest 12 уже перешёл).

```ts
// domain/order.ts — состояния как union, решение и применение как чистые функции
import { AppError } from '../../../shared/errors.ts';

type OrderId = string & { readonly __brand: 'OrderId' };
type Line = { readonly sku: string; readonly qty: number };

export type Order =
  | { readonly status: 'draft'; readonly id: OrderId; readonly lines: readonly Line[] }
  | { readonly status: 'placed'; readonly id: OrderId; readonly lines: readonly Line[]; readonly placedAt: Date };

export type OrderEvent = { type: 'OrderPlaced'; id: OrderId; at: Date };
export type PlaceOrder = { type: 'PlaceOrder'; id: OrderId; now: Date };

export function decide(cmd: PlaceOrder, state: Order): OrderEvent[] {
  if (state.status !== 'draft') throw new AppError('ORDER_NOT_DRAFT', `order ${state.id} is ${state.status}`, 409);
  if (state.lines.length === 0) throw new AppError('ORDER_EMPTY', `order ${state.id} has no lines`, 422);
  return [{ type: 'OrderPlaced', id: cmd.id, at: cmd.now }];
}

export function evolve(state: Order, event: OrderEvent): Order {
  return event.type === 'OrderPlaced' ? { ...state, status: 'placed', placedAt: event.at } : state;
}
```

```ts
// data-access/outbox.ts — изменение и событие в одной транзакции
import { randomUUID } from 'node:crypto';

const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE orders SET status = $2 WHERE id = $1', [order.id, 'placed']);
  await client.query(
    'INSERT INTO outbox (id, aggregate_id, type, payload) VALUES ($1, $2, $3, $4)',
    [randomUUID(), order.id, 'OrderPlaced', JSON.stringify(event)],
  );
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}

// ретранслятор: несколько экземпляров не берут одни и те же строки
// SELECT id, type, payload FROM outbox WHERE published_at IS NULL
//   ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED;
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) | Alexis King, 2019 | Разбор на границе |
| [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) | Scott Wlaschin, 2018 | Моделирование домена типами (F#, напрямую ложится на unions в TS) |
| [Domain Driven Design (fsharpforfunandprofit)](https://fsharpforfunandprofit.com/ddd/) | Scott Wlaschin | Доклад и слайды |
| [Khalil Stemmler: DDD articles](https://khalilstemmler.com/articles/categories/domain-driven-design/) | Khalil Stemmler | Статьи о DDD на TypeScript |
| [stemmlerjs/white-label](https://github.com/stemmlerjs/white-label) | Khalil Stemmler | Пример приложения DDD/clean на TS |
| [CodelyTV/typescript-ddd-example](https://github.com/CodelyTV/typescript-ddd-example) | CodelyTV | Bounded contexts, hexagonal, CQRS на TS |
| [Emmett](https://event-driven-io.github.io/emmett/) | Oskar Dudycz | Документация Emmett |
| [Emmett: PostgreSQL event store](https://event-driven.io/en/emmett_postgresql_event_store/) | Oskar Dudycz, 2024 | Хранилище событий на Postgres, inline-проекции |
| [oskardudycz/EventSourcing.NodeJS](https://github.com/oskardudycz/EventSourcing.NodeJS) | Oskar Dudycz | Примеры и курс по event sourcing |
| [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) | Chris Richardson | Паттерн outbox |
| [How to fix the dual write problem in Node.js with the outbox pattern](https://www.freecodecamp.org/news/how-to-fix-the-dual-write-problem-in-node-js-with-the-outbox-pattern/) | freeCodeCamp | Outbox на Node пошагово |
| [timgit/pg-boss](https://github.com/timgit/pg-boss) | Tim Jones | Очередь задач на Postgres |
| [BullMQ](https://docs.bullmq.io/) | Taskforce.sh | Очереди на Redis |
| [NestJS: CQRS](https://docs.nestjs.com/recipes/cqrs) | NestJS | Модуль CQRS |
| [CQRS](https://martinfowler.com/bliki/CQRS.html) | Martin Fowler, 2011 | Оговорки к CQRS |
| [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) | Martin Fowler, 2005 | Event sourcing |
| [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html) | Martin Fowler, 2017 | Четыре значения «event-driven» |
| [Node.js: events](https://nodejs.org/api/events.html) | Node.js | Семантика EventEmitter |

## Graceful shutdown и health checks

### Ключевые выводы

- **Остановка pod в Kubernetes.** Отсчёт grace period начинается до `preStop`. `preStop` должен завершиться до отправки SIGTERM. Grace period (`terminationGracePeriodSeconds`, по умолчанию 30 с) покрывает и хук, и остановку, затем приходит SIGKILL. Обработчики хука: `exec`, `httpGet`, `sleep` (`tcpSocket` устарел).
- Удаление endpoint идёт параллельно с остановкой, поэтому короткий `preStop: sleep: {seconds: 5}` не даёт слать трафик в закрывающийся pod [не проверено: обоснование гонки].
- **HTTP-сервер Node.** С v19 `server.close()` перестаёт принимать соединения и **закрывает idle keep-alive соединения**, а активные запросы дорабатывают. `closeIdleConnections()` / `closeAllConnections()` (18.2+) нужны для старых линий и для принудительного закрытия (`closeAllConnections()` вызывайте *после* `close()`).
- Проверено локально на Node 24.17 (Windows 11): при одном idle keep-alive сокете (keepAliveTimeout 60 с) и одном запросе в полёте на 1,5 с от клиента без keep-alive `server.close()` дал запросу закончиться с 200, а callback сработал примерно через 1,4 с — idle-сокет не задержал остановку. **Но** если клиент запроса в полёте держит keep-alive (глобальный агент Node ≥ 19, `fetch`, балансировщики), ответ уходит с `Connection: keep-alive`, сокет становится idle уже *после* `close()` и сам не закрывается: callback ждёт `keepAliveTimeout` (проверено на Node 24.17 и 26.13; так же ведёт себя `app.close()` в Fastify 5.12). Поэтому на время остановки периодически вызывайте `server.closeIdleConnections()` или держите таймер `closeAllConnections()`. http-terminator, stoppable и @godaddy/terminus (2018–2023) решали зависание до v19 и [устарело] для Node ≥ 20: замена — встроенный `server.close()`, close-with-grace.
- **Последовательность `close()` в Fastify**: пометка «закрывается» (новые запросы получают `Connection: close` и `503`, пока `return503OnClosing: true` — это значение по умолчанию) → хуки `preClose` (здесь закрывайте WebSocket: upgraded-сокеты не отслеживаются) → слив соединений по `forceCloseConnections` (по умолчанию `'idle'`) → `server.close()` → хуки `onClose` (здесь закрывайте пулы БД).
- **close-with-grace** (Matteo Collina): один обработчик для SIGINT/SIGTERM/SIGHUP, `uncaughtException`, `unhandledRejection`. `delay` (по умолчанию 10 000 мс) принудительно завершает процесс; второй сигнал завершает сразу; есть `onSecondError`, `onTimeout`. Обработчик `({ signal, err, manual }) => Promise`; успех → код 0, ошибка → код 1. Держите `delay` меньше `terminationGracePeriodSeconds` минус sleep в preStop.
- **Порядок остановки**: перевести readiness в «не готов» (или положиться на 503 от Fastify) → перестать принимать → дослужить HTTP-запросы и остановить консьюмеры очередей (не брать новые, доделать текущие) → сбросить логи и телеметрию → закрыть пулы и клиенты → выйти. Если закрыть пул БД до слива, каждый запрос в полёте превратится в ошибку [не проверено: несколько вторичных гайдов].
- **PID 1 в контейнере.** Используйте exec-форму `CMD ["node", "server.js"]`: в shell-форме PID 1 — `/bin/sh`, и SIGTERM до Node не доходит. Node в роли PID 1 не собирает зомби и не получает обработчиков сигналов по умолчанию — ставьте свои обработчики или запускайте с `docker run --init` / tini [не проверено: детали]. Не запускайте через `npm start` в продакшен-контейнере: npm добавляет лишний процесс [не проверено].
- **Health endpoints.** *Liveness* проверяет только процесс (event loop отвечает), никогда не зависимости — иначе падение БД перезапустит все реплики разом. *Readiness* может проверять зависимости и выключается при остановке. *Startup*-проба защищает медленный старт [не проверено].
- `@fastify/under-pressure` возвращает 503 + `Retry-After`, когда превышены `maxEventLoopDelay`, `maxEventLoopUtilization`, `maxHeapUsedBytes` или `maxRssBytes`, и может отдавать маршрут статуса со своим `healthCheck`. В Nest — health indicators `@nestjs/terminus` 12. lightship 9 (Gajus Kuizinas) реализует состояния liveness/readiness/shutdown в стиле Kubernetes.

```ts
// main.ts — shutdown подключается один раз, на краю
import closeWithGrace from 'close-with-grace';
const config = loadConfig();
const container = createContainer(config);
const app = await buildApp(container);          // экземпляр Fastify; хук onClose вызывает container.dispose()
closeWithGrace({ delay: config.SHUTDOWN_TIMEOUT_MS }, async ({ signal, err }) => {
  if (err) app.log.error({ err }, 'fatal error, shutting down');
  else app.log.info({ signal }, 'shutting down');
  setInterval(() => app.server.closeIdleConnections(), 250).unref(); // keep-alive сокеты запросов в полёте
  await app.close();                            // 503 для новых запросов, слив, onClose -> пулы закрыты
});
await app.listen({ port: config.PORT, host: '0.0.0.0' });
```

```js
// Без библиотек: голый node:http (Node >= 19 закрывает idle keep-alive сам)
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;                          // readiness-маршрут начинает отвечать 503
  const force = setTimeout(() => server.closeAllConnections(), config.SHUTDOWN_TIMEOUT_MS);
  force.unref();
  server.close(async (err) => {
    clearTimeout(force);
    await container.dispose();                  // пулы закрываются после слива HTTP
    process.exitCode = err ? 1 : 0;             // не process.exit(): даём дописать логи
  });
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
```

```yaml
# Kubernetes: preStop sleep + запас grace period под delay в close-with-grace
spec:
  terminationGracePeriodSeconds: 30
  containers:
    - name: api
      lifecycle:
        preStop:
          sleep:
            seconds: 5
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Container lifecycle hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) | Kubernetes | Семантика preStop, обработчик sleep |
| [Configure liveness, readiness and startup probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) | Kubernetes | Пробы |
| [Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) | Kubernetes | Как завершается pod |
| [Node.js: http](https://nodejs.org/api/http.html) | Node.js | `server.close`, `closeIdleConnections`, `closeAllConnections` |
| [Fastify: server](https://fastify.dev/docs/latest/Reference/Server/) | Fastify | `return503OnClosing`, `forceCloseConnections`, порядок закрытия |
| [mcollina/close-with-grace](https://github.com/mcollina/close-with-grace) | Matteo Collina | Помощник для shutdown |
| [fastify/under-pressure](https://github.com/fastify/under-pressure) | Fastify | Сброс нагрузки и маршрут статуса |
| [NestJS: Terminus](https://docs.nestjs.com/recipes/terminus) | NestJS | Health checks в Nest |
| [NestJS: lifecycle events](https://docs.nestjs.com/fundamentals/lifecycle-events) | NestJS | `enableShutdownHooks`, порядок хуков |
| [gajus/lightship](https://github.com/gajus/lightship) | Gajus Kuizinas | Машина состояний health/shutdown для K8s |
| [godaddy/terminus](https://github.com/godaddy/terminus) | GoDaddy | [устарело]: последний релиз 2023-06; замена — `server.close()` в Node ≥ 19 и close-with-grace |
| [docker-node: Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md) | Node.js Docker team | PID 1, сигналы, `--init` |
| [krallin/tini](https://github.com/krallin/tini) | Thomas Orozco | Минимальный init |
| [Health Check Response Format for HTTP APIs](https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-06) | Irakli Nadareishvili | Формат ответа health check (истёкший draft) |
| [Kubernetes graceful shutdown: SIGTERM and pod termination](https://jorijn.com/en/knowledge-base/kubernetes/troubleshooting/kubernetes-graceful-shutdown-sigterm-pod-termination/) | Jorijn Schrijvershof | Гонка SIGTERM и удаления endpoint [не проверено] |

## Монолит, модульный монолит, микросервисы

### Ключевые выводы

- **По умолчанию — модульный монолит**: один деплой, компоненты с проверяемыми границами, одна БД с владением схемами или таблицами по компонентам, вызовы в процессе через публичные API компонентов, события через outbox, когда нужна асинхронность.
- Выносите компонент, только когда ему нужны независимое масштабирование, свой ритм деплоя, изоляция (безопасность, отказы, runtime) или владение другой командой — и только по границам, которые монолит уже доказал. Fowler: «MonolithFirst» и «microservice premium».
- **Особенность Node: один event loop на процесс.** Компонент, нагружающий CPU (обработка изображений, рендер PDF, большие преобразования JSON), ухудшает латентность всех остальных компонентов в том же процессе. Варианты до микросервисов: worker threads (Piscina), отдельный деплой воркера из того же монорепозитория (`apps/worker`), сервер приложений, который запускает компоненты в отдельных потоках. См. [concurrency-async-native.md](concurrency-async-native.md) и [performance.md](performance.md).
- **Platformatic Watt** (Matteo Collina, Luca Maraschi) запускает несколько Node-приложений (Fastify, Express, Next.js…) в одном процессе, каждое — в своих worker threads со своей кучей. Внутри — mesh в процессе (имена `*.plt.local`, round-robin по воркерам), наружу открыт один `entrypoint`, деплой одним блоком. Прямо позиционируется как runtime для «modular monolith». Collina обсуждал модульные монолиты в PodRocket (2023).
- **Свидетельства против ранних микросервисов.** Segment, «Goodbye Microservices» (2018): 140+ сервисов-направлений свернули обратно в один; статья теперь на twilio.com. Amazon Prime Video (Marcin Kolny, 2023-03-22): мониторинг аудио и видео подешевел по инфраструктуре больше чем на 90% после объединения конвейера на Lambda/Step Functions в один сервис; позже уточнили, что объединили *один* микросервис, а не отказались от микросервисов [не проверено: по вторичным источникам]. Модульный монолит Shopify (компонентное ядро на Rails, 2019).
- **Монорепозиторий ≠ микросервисы.** pnpm/Turborepo-монорепозиторий с `apps/api` + `apps/worker` на общих `packages/*-domain` — типичная для Node форма «два деплоя, одна кодовая база» без сетевых вызовов между доменными модулями.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) | Martin Fowler, 2015 | Сначала монолит |
| [MicroservicePremium](https://martinfowler.com/bliki/MicroservicePremium.html) | Martin Fowler, 2015 | Когда микросервисы окупаются |
| [StranglerFigApplication](https://martinfowler.com/bliki/StranglerFigApplication.html) | Martin Fowler | Постепенное выделение |
| [Microservice architecture pattern](https://microservices.io/patterns/microservices.html) | Chris Richardson | Язык паттернов микросервисной архитектуры |
| [Modular monolith primer](https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer) | Kamil Grzybek | Введение в модульный монолит |
| [kgrzybek/modular-monolith-with-ddd](https://github.com/kgrzybek/modular-monolith-with-ddd) | Kamil Grzybek | Эталонный модульный монолит (.NET; идеи переносятся) |
| [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/) | Jimmy Bogard, 2018 | Вертикальные срезы |
| [Platformatic: architecture overview](https://docs.platformatic.dev/docs/overview/architecture-overview) | Platformatic | Watt: потоки, mesh, entrypoint |
| [Modular monoliths with Platformatic and Pino](https://podrocket.logrocket.com/modular-monoliths-platformatic-pino) | PodRocket, 2023 | Collina о модульных монолитах |
| [platformatic/platformatic](https://github.com/platformatic/platformatic) | Platformatic | Исходники Watt |
| [Goodbye Microservices](https://segment.com/blog/goodbye-microservices/) | Alexandra Noonan (Segment), 2018 | Возврат к монолиту (перенаправляет на twilio.com) |
| [Return of the monolith: Amazon dumps microservices for video monitoring](https://thenewstack.io/return-of-the-monolith-amazon-dumps-microservices-for-video-monitoring/) | The New Stack, 2023 | Случай Prime Video |
| [Amazon Prime Video's microservices move doesn't lead to a monolith after all](https://thenewstack.io/amazon-prime-videos-microservices-move-doesnt-lead-to-a-monolith-after-all/) | The New Stack, 2023 | Уточнение |
| [Deconstructing the monolith](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) | Kirsten Westeinde (Shopify), 2019 | Обоснование модульного монолита |

## Кодовые базы для изучения

### Ключевые выводы

- **Инкапсуляция Fastify — встроенная система границ модулей.** Декораторы, хуки и плагины, зарегистрированные в контексте, видны только этому контексту и его потомкам; соседи друг друга не видят. `fastify-plugin` намеренно открывает декораторы плагина родителю — используйте его только для общей инфраструктуры. Каждый некорневой контекст — плагин, который должен сообщить о завершении (Promise или `done`). Приложение на Fastify из плагинов-фич *и есть* модульный монолит с проверяемой видимостью.
- **Dispatcher в undici — ports and adapters внутри библиотеки.** `request`/`stream`/`fetch` делегируют `options.dispatcher` (по умолчанию — глобальный dispatcher). `Agent`, `ProxyAgent`, `MockAgent`, `Pool`/`Client` взаимозаменяемы. `new Agent().compose(interceptors.cache(...))` добавляет middleware. `setGlobalDispatcher` меняет транспорт на весь процесс, общий со встроенным в Node undici. Применяйте ту же идею к своим исходящим адаптерам: внедряйте dispatcher или `fetch`, в тестах подменяйте `MockAgent`.
- **Ядро Node** отделяет публичные модули `lib/*.js` от реализации в `lib/internal/**`, недоступной из пользовательского кода. Ту же форму «публичный фасад + внутренняя папка» npm-пакету даёт `exports` [не проверено: соглашение].
- **Medusa v2**: каждый коммерческий домен — изолированный *модуль* (свои модели данных, класс сервиса на основе `MedusaService` со сгенерированным CRUD, свои миграции), регистрируется в `medusa-config` и достаётся из контейнера по имени; workflows оркестрируют работу нескольких модулей. Хороший пример модульного монолита на TS с DI через регистрацию.
- **Backend system в Backstage**: плагины (работают независимо, «as microservices»), модули, расширяющие плагины через extension points, общие core-сервисы (логирование, конфигурация, HTTP-роутер), внедряемые как зависимости, feature loaders. Бэкенд можно разрезать на несколько деплоев.
- Шаблоны и эталоны структуры (Node Best Practices, Practica, domain-driven-hexagon, backend-best-practices, CodelyTV, white-label, elemikelo) перечислены в разделах [Структура сервиса](#структура-сервиса-компоненты-слои-гексагональная-архитектура) и [Доменная модель](#доменная-модель-события-cqrs-и-outbox); Platformatic — в разделе [Монолит, модульный монолит, микросервисы](#монолит-модульный-монолит-микросервисы).
- Порядок чтения чужой кодовой базы: README и CONTRIBUTING, корневой `package.json` и workspace-файл, `exports` пакетов, затем composition root и способ регистрации плагинов.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [nodejs/node](https://github.com/nodejs/node) | Node.js | `lib/` против `lib/internal/`, primordials, коды ошибок |
| [fastify/fastify](https://github.com/fastify/fastify) | Fastify | Инкапсуляция плагинов (avvio), хуки, декораторы |
| [Fastify: encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/) | Fastify | Правила видимости контекстов |
| [nodejs/undici](https://github.com/nodejs/undici) | Node.js | Абстракция Dispatcher, interceptors, MockAgent |
| [pinojs/pino](https://github.com/pinojs/pino) | Pino | Маленькое ядро + транспорты в worker threads; библиотека не настраивает приложение-хост |
| [npm/cli](https://github.com/npm/cli) | npm | Монорепозиторий на npm workspaces из многих публикуемых пакетов |
| [nestjs/nest](https://github.com/nestjs/nest) | NestJS | DI-контейнер, модули, переход на ESM (v12) |
| [TryGhost/Ghost](https://github.com/TryGhost/Ghost) | Ghost Foundation | Большой долгоживущий продукт на Node, монорепозиторий пакетов `ghost/*` |
| [medusajs/medusa](https://github.com/medusajs/medusa) | Medusa | Архитектура модулей и workflows |
| [Medusa: modules](https://docs.medusajs.com/learn/fundamentals/modules) | Medusa | Как устроен модуль |
| [backstage/backstage](https://github.com/backstage/backstage) | Backstage | Система плагинов, модулей и сервисов на бэкенде |
| [Backstage: backend system](https://backstage.io/docs/backend-system/) | Backstage | Документация backend system |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | n8n | Монорепозиторий pnpm + Turborepo, плагины-узлы |
| [twentyhq/twenty](https://github.com/twentyhq/twenty) | Twenty | Монорепозиторий Nx, бэкенд на NestJS |
| [strapi/strapi](https://github.com/strapi/strapi) | Strapi | CMS-монорепозиторий на плагинах |
| [vercel/turborepo](https://github.com/vercel/turborepo), [nrwl/nx](https://github.com/nrwl/nx), [microsoft/rushstack](https://github.com/microsoft/rushstack) | Vercel, Nrwl, Microsoft | Инструменты монорепозитория, сами устроенные как монорепозитории |
| [changesets/changesets](https://github.com/changesets/changesets) | changesets | Инструмент версионирования и его дисциплина changelog |
| [goldbergyoni/nodejs-testing-best-practices](https://github.com/goldbergyoni/nodejs-testing-best-practices) | Yoni Goldberg | Компонентные тесты, которые формируют архитектуру (см. [testing.md](testing.md)) |
| [jbuget/nodejs-clean-architecture-app](https://github.com/jbuget/nodejs-clean-architecture-app) | jbuget | Маленькое JS-приложение на clean architecture |
| [talyssonoc/node-api-boilerplate](https://github.com/talyssonoc/node-api-boilerplate) | talyssonoc | Шаблон в духе DDD на Awilix |
| [santiq/bulletproof-nodejs](https://github.com/santiq/bulletproof-nodejs) | santiq | [устарело]: Node 14, typedi (заброшен), Mongoose; до сих пор часто цитируется. Замена — структура Practica и Node Best Practices |
| [metarhia/impress](https://github.com/metarhia/impress) | Timur Shemsedinov | Сервер приложений: изоляция приложений через контексты `vm`, без `require` в коде приложения (ориентир русскоязычного сообщества) |
| [HowProgrammingWorks/Dictionary](https://github.com/HowProgrammingWorks/Dictionary) | Timur Shemsedinov | Указатель примеров по архитектуре и паттернам |

## Таблицы сравнения и решений

### Ключевые выводы

- Начинайте с самого лёгкого варианта и переходите к следующему по сигналу: растёт доменная логика, число команд, число деплоев, нагрузка на CPU. Не заранее.
- Порядок проверок при ревью и в CI — в [pipeline.md](pipeline.md).

### A. Варианты DI для Node (версии на 2026-11-06)

| Вариант | Версия (дата) | Нужны декораторы / метаданные | Работает под type stripping в Node | Scopes | Асинхронная очистка | Примечания |
|---|---|---|---|---|---|---|
| Ручной DI (фабрики + composition root) | — | Нет | Да (проверено локально) | Какие напишете (объекты на запрос строятся в обработчике) | Свой `dispose()` | Рекомендация по умолчанию |
| Awilix | 13.0.5 (2026-06-15); Node >=20; `@fastify/awilix` 8.3.2, `awilix-express` 11.0.1 | Нет | Да (нет декораторов) [не проверено] | transient / scoped / singleton, `createScope()` | `dispose()` + disposers | strict ловит утечки времени жизни; интеграции с Fastify и Express |
| typed-inject | 5.0.0 (2024-12-13), молчит ~23 месяца | Нет (токены `static inject`) | Да [не проверено] | singleton / transient | асинхронный `dispose()` | Проверка при компиляции; молчит |
| iti / brandi / @needle-di/core | 0.8.0 (2025-10-08) / 5.1.0 (2026-01-15) / 1.2.1 (2026-09-04) | Нет (у needle — необязательно) | Да [не проверено] | разные | разные | Небольшие сообщества |
| NestJS DI | @nestjs/core 12.3.3 (2026-11-04) | Да (legacy-декораторы + `emitDecoratorMetadata`) | **Нет** (нужны tsc/swc; для декораторов проверено локально) | по умолчанию singleton / request / transient / durable | lifecycle hooks | Целый фреймворк, не только DI; ESM с 12 |
| InversifyJS | inversify 8.2.4 (2026-11-04), @inversifyjs/container 3.1.4 | Да | **Нет** | singleton / transient / request | unbind контейнера, deactivation hooks | Только ESM с 8 |
| tsyringe | 4.10.0 (2025-04-16), молчит ~19 месяцев | Да + `reflect-metadata` | **Нет** | singleton / container / resolution / transient | ограниченно | Затих; не брать в новый код |
| typedi / typescript-ioc | 0.10.0 (2021-01-15) / 3.2.2 (2020) | Да | Нет | — | — | [устарело]: заброшены, замена — Awilix или ручной DI |
| Декораторы Fastify | fastify 5.12.8 | Нет | Да | на контекст инкапсуляции | хуки `onClose` | «DI» для инфраструктуры средствами фреймворка |

### B. Инструменты монорепозитория (версии на 2026-11-06)

| Инструмент | Версия (дата) | Что это | Сильные стороны | Цена и оговорки |
|---|---|---|---|---|
| npm workspaces | npm 12.2.2 (2026-11-04) | Связывание пакетов менеджером | Ноль дополнительных инструментов | Подъём зависимостей прячет необъявленные (проверено локально); нет графа задач и кеша |
| pnpm workspaces | pnpm 12.18.0 (2026-11-05) | Связывание пакетов менеджером | Строгая изоляция, протокол `workspace:`, catalogs, `--filter`, скорость | Часть инструментов рассчитывает на подъём (лечится `publicHoistPattern` или `nodeLinker`) [не проверено] |
| Yarn Berry workspaces | 4.18.1 (2026-09-24) | Связывание пакетов менеджером | Строгость PnP, constraints | Трения совместимости с PnP [не проверено] |
| Bun workspaces | bun 1.4.4 (2026-10-22) | Связывание пакетов менеджером | Скорость | Подъём как в npm [не проверено] |
| Turborepo | turbo 2.11.10 (2026-10-20); 2.11 вышел 2026-09-18 | Task runner + кеш (Rust) | Простой `turbo.json`, удалённый кеш, `--affected`, `turbo query`, экспериментальные boundaries, теперь понимает Rust/Python/Go | Меньше генераторов и плагинов, чем в Nx; в 2.9 объявлены deprecations к 3.0 |
| Nx | nx, @nx/eslint-plugin 24.0.4 (2026-11-03); `@nx/oxlint` 24.0.4 | Система сборки + граф проектов + плагины | Теги и границы модулей, генераторы, affected, распределение в Nx Cloud, миграции | Больше поверхности и конфигурации; часть функций коммерческая (conformance) |
| Lerna | 10.1.1 (2026-10-12); Node `^22.22.2 \|\| ^24.15.0 \|\| ^26` | Версионирование и публикация поверх Nx | Привычные `lerna version/publish`, независимые или общие версии | Задачи под капотом выполняет Nx |
| changesets | @changesets/cli 3.0.3 (2026-09-14) | Версионирование + changelog | Файлы намерений в PR, GitHub Action | Не task runner; 3.0 требует Node 22.11+ |
| Rush | @microsoft/rush 5.182.1 (2026-10-30) | Менеджер монорепозитория (Microsoft) | Политики, фазовые сборки, большие организации | Тяжелее в настройке |
| moon | @moonrepo/cli 2.6.5 (2026-10-29) | Полиглотный task runner (Rust) | Управление тулчейном, много языков | Меньше сообщество в Node |
| lage / wireit | 2.17.0 (2026-08-18) / 0.15.0 (2026-10-24) | Лёгкие task runners | Минимум конфигурации (wireit живёт в `package.json`) | Меньше функций |
| syncpack / @manypkg/cli | 15.3.3 (2026-08-09) / 0.25.1 (2025-08-28) | Линтинг согласованности версий | Выравнивает диапазоны | Catalogs в pnpm закрывают большую часть задачи |

### C. Структура и стиль по виду проекта

| Ситуация | Рекомендуется | Избегать |
|---|---|---|
| Скрипт или маленький CLI | Один пакет, обычные функции, `parseArgs` из `node:util`; конфигурация из флагов и окружения в `main()` | Слоёв, DI-контейнеров |
| CRUD API, одна команда | Фабрика приложения Fastify/Express + компоненты с entry-points/domain/data-access; ручной DI | Полного стека DDD/hexagonal для CRUD (предупреждение самого Sairyss) |
| Домен с множеством правил, долгая жизнь | Hexagonal внутри компонента: порты для внешних систем, домен на чистом TS, use cases; границы проверяются в CI | Анемичных сервисов и сущностей ORM повсюду |
| Несколько команд, один продукт | Модульный монолит в pnpm-монорепозитории (`apps/api`, `apps/worker`, `packages/<domain>`), теги и границы в CI | Разделения на сетевые сервисы с самого начала |
| CPU-тяжёлые части в сервисе, чувствительном к латентности | Worker threads (Piscina) или отдельное приложение-воркер; Watt для нескольких приложений одним деплоем | CPU-работы на event loop запросов |
| Асинхронная интеграция между компонентами | Outbox + идемпотентные консьюмеры (pg-boss в транзакции или таблица + ретранслятор в Kafka/RabbitMQ) | Двойной записи (коммит в БД, потом публикация) |
| Публикуемая библиотека | Публичный API, ограниченный `exports`; без контейнера и `process.env`; внедряемый I/O | Открытых внутренностей, побочных эффектов при импорте |
| Большое корпоративное TS-приложение с командами в стиле Angular | Модули NestJS (шаг компиляции принять как данность) | Смешения DI Nest с самодельными синглтонами |

### D. Инструмент для проверки границ

| Потребность | Инструмент |
|---|---|
| Правила путей и слоёв, циклы, сироты, утечки devDependencies, графы; любой репозиторий | dependency-cruiser |
| Подсветка в IDE для правил по типам элементов, ограничения внешних пакетов | eslint-plugin-boundaries 7 |
| Теги проектов в workspace Nx | `@nx/enforce-module-boundaries` (ESLint) или `@nx/oxlint` (экспериментально) |
| Теги пакетов в workspace Turborepo | `turbo boundaries` (экспериментально) |
| Модули, заданные `index.ts`, с тегами внутри одного TS-проекта | Sheriff |
| Жёсткая инкапсуляция пакетов во время выполнения | `exports` (+ `imports` для внутренних алиасов) |
| Неиспользуемые экспорты, файлы, зависимости; неперечисленные зависимости | knip |
| Быстро запретить конкретные импорты | ESLint `no-restricted-imports` / `import-x/no-restricted-paths` |

## Антипаттерны

### Ключевые выводы

- Почти каждый антипаттерн здесь — либо лишняя архитектура для маленькой задачи, либо отсутствие проверяемых границ в большой. Особенность Node — ещё и общий event loop: тяжёлый компонент тормозит все остальные.

| Антипаттерн | Чем плох | Исправление |
|---|---|---|
| Технические папки верхнего уровня (`controllers/`, `services/`, `models/`) в растущем сервисе | Не видно, что делает система; фича размазана по дереву | Компоненты по бизнес-возможностям, слои внутри (Node Best Practices 1.1) |
| `req`/`res` или `FastifyInstance` в доменном коде | Домен нельзя вызвать из очереди, CLI, теста | Точка входа переводит запрос в обычную команду; домен получает данные и внедрённые порты |
| `process.env` повсюду, конфигурация читается при импорте | Не тестируется, опечатки не видны, скрытая связь | Одна проверенная замороженная конфигурация в composition root, внедряется |
| Побочные эффекты при импорте (подключение к БД, таймеры, глобальные обработчики) | Тесты и CLI не могут безопасно импортировать модуль | Явные `createContainer()` / `start()` |
| Синглтоны уровня модуля, импортируемые по всему приложению (`export const db = new Pool()`) | Нельзя подменить, нельзя аккуратно закрыть | Создавать в composition root, передавать вниз, закрывать при shutdown |
| Workspace без проверок | Подъём в npm/Bun позволяет импортировать необъявленных соседей (проверено локально); глубокие импорты в чужой `src/` | Изоляция pnpm или dependency-cruiser/knip; `exports` в каждом пакете; никаких `../` между пакетами |
| Barrel-файлы, реэкспортирующие всё, внутри приложений | Медленный старт и бандлинг, скрытые циклы | Один явный публичный `index.ts` на компонент, прямые импорты внутри компонента, subpath в `exports` для пакетов (документация Turborepo) |
| Свалка `utils/`, `common/`, `helpers/` | Узел зависимостей, который порождает циклы | Называть модули по понятиям; переносить хелпер к единственному пользователю; `shared/` не импортирует компоненты |
| Request-scoped DI для данных запроса (`Scope.REQUEST` в Nest каскадом по графу) | Латентность, весь граф пересоздаётся на запрос | Синглтоны + `AsyncLocalStorage` (документация Nest) |
| Проглатывание ошибок или продолжение работы после `uncaughtException` | Процесс в неизвестном состоянии | Центральный обработчик, падение на ошибках программиста, перезапуск супервизором (документация Node) |
| Shutdown через `process.exit()` в обработчике сигнала или shell-форма `CMD` | Обрыв запросов в полёте; SIGTERM не доходит до Node | `close-with-grace` / `app.close()`, exec-форма CMD, таймер принудительного выхода меньше grace period |
| Liveness-проба, проверяющая базу данных | Падение БД перезапускает все реплики разом | Liveness — только процесс; зависимости — в readiness |
| Двойная запись (коммит, потом публикация в брокер) | Рассинхронизация БД и брокера | Outbox или постановка задачи в той же транзакции (pg-boss) |
| Микросервис на каждую сущность, раннее разделение | Распределённая сложность без выгоды | Модульный монолит; выделять по доказанным границам (Fowler, Segment) |
| DI на декораторах в коде, который должен работать под нативным type stripping | Падает с `SyntaxError` (проверено локально) | DI на функциях или шаг компиляции |
| `npx <bin>` в скриптах для инструментов, которые должны быть локальными | Может скачать одноимённый пакет из реестра (наблюдалось с заглушкой `depcruise`) | `npx --no-install` / `npm exec --no` / скрипты пакета |

## Спорные места

### Ключевые выводы

- Большинство споров — компромисс между церемониями и защитой от будущих изменений. Решайте по размеру домена и сроку жизни системы, а паттерны вводите в ответ на измеренную боль.
- Не подтверждено по первоисточникам: поддерживает ли InversifyJS 8 стандартные декораторы TC39; подробности миграции eslint-plugin-boundaries v6→v7 (старые правила `element-types`, `entry-point`, `no-private`); новшества Nx 23 и release notes Nx 24; текущая активность Practica; в какой версии Kubernetes обработчик `sleep` в `preStop` стал GA.

| Вопрос | Позиция A | Позиция B | Рекомендация по умолчанию |
|---|---|---|---|
| DI-контейнер или ручной DI | NestJS/Inversify: автосвязывание и scopes ценят в больших командах | Node Best Practices, Practica, стиль Fastify: обычные фабрики и система модулей | Ручной DI. Type stripping и декораторы TC39 (нет декораторов параметров и метаданных) толкают новый код к DI без декораторов; Nest 12 по-прежнему на legacy-декораторах (в release notes изменений на этот счёт нет) |
| Глубина hexagonal/DDD | Сторонники DDD (Stemmler, CodelyTV): порты окупаются в долгоживущих доменах | README Sairyss предупреждает о шаблонном коде и цене; Node Best Practices — три простых уровня | Порты там, где внешнюю систему меняют или подделывают; для БД — не по умолчанию |
| Репозиторий поверх ORM | Репозиторий держит домен свободным от ORM, переиспользует запросы | Клиенты Prisma/Drizzle уже абстракция доступа к данным; обёртка каждого вызова добавляет код | Репозиторий — если домен должен быть без ORM или запросы переиспользуются; иначе модуль `data-access` зовёт ORM напрямую (см. [domains-server.md](domains-server.md)) |
| Result-типы или исключения | Effect 4 (LTS с 2026-09-30), neverthrow | Идиоматичный `throw` + иерархия доменных ошибок | Effect — выбор целого runtime и экосистемы, а не замена по месту; neverthrow молчит с февраля 2025. Один стиль на кодовую базу |
| Инструмент монорепозитория | Turborepo: минимум, кеш | Nx: граф, генераторы, границы, больше конфигурации | Для бэкенд-репозитория с несколькими пакетами часто хватает обычного `pnpm --filter` (подход «инструменты слоями» у Goldberg и Solomon, 2022 [не проверено]). «Смерть» Lerna (2022) [устарело]: её поддерживает Nx, в 2026 вышла v10 |
| JIT TS-пакеты или собранные | JIT проще и работает с type stripping через симлинки (проверено локально) | JIT ломается при копировании в `node_modules` (проверено локально) и привязывает потребителей к настройкам TS производителя | JIT — внутри монорепозитория с симлинками; всё публикуемое и копируемое — собранный JS |
| Barrel-файлы | Удобный публичный фасад | Цена старта и бандлинга, циклы | Консенсус 2025–2026: один курируемый вход на пакет или компонент, без вложенных barrel (документация Turborepo; шире — [не проверено]) |
| Файлы конфигурации или только окружение | 12-factor: только окружение | Старый гайд Node Best Practices: иерархические файлы + переопределение из окружения | Компромисс: значения по умолчанию в коде (в схеме), переопределения из окружения, секреты от платформы |

## Чеклист ревью архитектуры

### Ключевые выводы

- Пройдите пункты по порядку. Каждое «нет» — либо задача, либо осознанное решение, записанное в ADR или README.

**Структура**

1. Папки верхнего уровня названы по бизнес-компонентам, а не по техническим ролям. У каждого компонента есть entry-points / domain / data-access (или описанный аналог).
2. Доменный код не импортирует HTTP-фреймворк, клиент ORM и `process.env`. Это проверяет правило (dependency-cruiser / eslint-plugin-boundaries), а не договорённость.
3. Компоненты общаются только через публичный `index.ts` (или `exports` пакета). Глубоких импортов нет.
4. Нет циклов импорта (правило `no-circular` в CI).
5. Сборка приложения (`buildApp`) отделена от `listen()`. Тесты используют `inject()` / supertest без порта.

**Монорепозиторий**

6. Есть `apps/` и `packages/`; вложенных пакетов нет. У каждого пакета есть `exports`, и он объявляет каждую зависимость, которую импортирует.
7. Изоляция обеспечена: pnpm (или Yarn PnP) либо dependency-cruiser/knip ловят необъявленные зависимости.
8. Общие tsconfig и eslint приходят из конфиг-пакетов. Версии выровнены (catalogs pnpm или syncpack).
9. Task runner кеширует build/test/lint. CI запускает только затронутые проекты. Теги границ проверяются.
10. Публикуемые пакеты поставляют собранный JS + `.d.ts` и версионируются changesets (или аналогом).

**Сборка зависимостей и конфигурация**

11. Один composition root создаёт пулы, клиенты и сервисы. При импорте ничего не подключается.
12. Конфигурация разбирается и проверяется один раз при старте (схема, приведение типов, fail fast), замораживается и внедряется. Секретов нет в репозитории; `.env.example` документирует ключи.
13. Способ DI соответствует runtime: DI на декораторах — только с шагом компиляции. Данные запроса — через `AsyncLocalStorage`, а не через request-scoped граф.

**Ошибки**

14. Есть типизированная иерархия `AppError` со стабильными кодами. Обёртка ошибок использует `{ cause }`.
15. Один обработчик ошибок для HTTP, задач, консьюмеров и событий процесса. На HTTP-краю ошибки переводятся в RFC 9457.
16. Ошибки программиста роняют процесс (после записи в лог), супервизор его перезапускает.

**Жизненный цикл и эксплуатация**

17. SIGTERM/SIGINT обрабатываются в одном месте (close-with-grace или аналог). Shutdown сливает HTTP, останавливает консьюмеры, потом закрывает пулы. Таймаут принудительного выхода < `terminationGracePeriodSeconds` − preStop.
18. Контейнер запускает Node exec-формой CMD (или с `--init` / tini), а не через `npm start`.
19. Liveness проверяет только процесс. Readiness проверяет зависимости и падает во время остановки. Где важна латентность — сброс нагрузки (`under-pressure`).

**Интеграция**

20. Нет двойной записи: outbox или постановка задачи в той же транзакции. Консьюмеры идемпотентны. Порядок по агрегату продуман.
21. CPU-тяжёлая работа вынесена с event loop запросов (worker threads или отдельное приложение-воркер).
22. Сервисы выделяются только по границам, доказанным внутри монолита. У каждого выделенного сервиса есть владелец и свои данные.

**Библиотеки**

23. Публичный API — ровно то, что открывает `exports`. Внутренности недоступны.
24. Библиотека не навязывает потребителю DI-контейнер, глобальную конфигурацию или настройку логирования. I/O (fetch/dispatcher, логгер, часы) внедряется.
