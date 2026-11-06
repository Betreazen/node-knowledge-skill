# Инструментарий Node.js: версии, пакетные менеджеры, TypeScript, линтеры, supply chain и CI

Справочник по всему, что окружает рантайм Node.js: линии релизов и новый годовой цикл, менеджеры версий, пакетные менеджеры, lockfile и workspaces, поля `package.json`, запуск и компиляция TypeScript (type stripping, tsx, tsc 6 против нативного TS 7, бандлеры для библиотек), линтеры и форматеры, git-хуки, обязательный гейт качества, supply chain (npm audit, политика install-скриптов, cooldown, provenance, trusted publishing, инциденты 2025–2026), обновление зависимостей, поиск неиспользуемого кода, CI, модель разрешений, `--env-file` и готовые шаблоны. Актуально на ноябрь 2026: Node 26 «Lithium» — Active LTS с 28 октября 2026 (26.13.0), Node 24 «Krypton» — Maintenance LTS (24.22.2), Node 22 — Maintenance LTS до 30 апреля 2027, Node 20 — EOL с 30 апреля 2026, первая Alpha Node 27 вышла 29 октября 2026. Ключевые версии на 6 ноября 2026: npm 12.2.2 (не входит ни в одну LTS; Node 26 несёт npm 11.20.0), pnpm 12.18.0, Yarn 4.18.1, Bun 1.4.4, TypeScript 7.0.2 (порт на Go, без JS API) и 6.0.3, typescript-eslint 8.72.1, ESLint 10.14.0, Biome 2.6.5, oxlint 1.91.0, Prettier 3.9.10, tsx 4.23.15, tsdown 0.23.7, knip 6.44.1. Пометка «проверено локально» значит, что команда выполнена на Node 24.17 (Windows 11, npm 11.13.0, Git Bash); npm 12.2.2 запускался через `npx`. Система типов TypeScript подробно — в [typescript.md](typescript.md), раннеры тестов — в [testing.md](testing.md), публикация библиотек и бандлеры — в [domains-client.md](domains-client.md), монорепозитории и границы модулей — в [architecture.md](architecture.md), Docker и деплой — в [domains-server.md](domains-server.md), порядок работы агента — в [pipeline.md](pipeline.md), профилирование и compile cache — в [performance.md](performance.md).

- [Версии на ноябрь 2026](#версии-на-ноябрь-2026)
- [Линии Node и годовой цикл релизов](#линии-node-и-годовой-цикл-релизов)
- [Менеджеры версий и Corepack](#менеджеры-версий-и-corepack)
- [Пакетные менеджеры, lockfile и workspaces](#пакетные-менеджеры-lockfile-и-workspaces)
- [Поля package.json](#поля-packagejson)
- [Запуск и компиляция TypeScript](#запуск-и-компиляция-typescript)
- [Линтинг и форматирование](#линтинг-и-форматирование)
- [Git-хуки](#git-хуки)
- [Обязательные проверки качества](#обязательные-проверки-качества)
- [Инциденты supply chain 2025-2026](#инциденты-supply-chain-2025-2026)
- [Защита supply chain: потребитель и издатель](#защита-supply-chain-потребитель-и-издатель)
- [Аудит и обновление зависимостей](#аудит-и-обновление-зависимостей)
- [Неиспользуемый код и гигиена зависимостей](#неиспользуемый-код-и-гигиена-зависимостей)
- [Флаги рантайма: env-файлы, модель разрешений, watch](#флаги-рантайма-env-файлы-модель-разрешений-watch)
- [CI на GitHub Actions](#ci-на-github-actions)
- [Шаблоны](#шаблоны)
- [Чеклист ревью инструментария](#чеклист-ревью-инструментария)
- [Антипаттерны](#антипаттерны)
- [Спорные места](#спорные-места)
- [Что не проверено](#что-не-проверено)

## Версии на ноябрь 2026

Версии пакетов — из `npm view` на 6 ноября 2026, данные о релизах Node — из `index.json` и `schedule.json`.

| Инструмент | Версия | Дата | Примечание |
|---|---|---|---|
| Node.js 26.x «Lithium» | **26.13.0** | 2026-10-28 | **Active LTS с 2026-10-28** (26.13.0 — первая сборка с меткой LTS). Maintenance с 2027-10-20, EOL 2029-04-30. Несёт npm 11.20.0 и V8 14.6 |
| Node.js 24.x «Krypton» | **24.22.2** | 2026-10-27 | **Maintenance LTS с 2026-10-20**, EOL 2028-04-30. 24.22.1 (2026-10-20) и 24.18.1 (2026-07-28) — security-релизы |
| Node.js 22.x «Jod» | **22.23.4** | 2026-10-20 (security) | Maintenance LTS, **EOL 2027-04-30**. Несёт npm 10.9.x |
| Node.js 20.x «Iron» | 20.20.2 | 2026-03-24 | **EOL 2026-04-30** |
| Node.js 25.x | 25.9.0 | 2026-03-31 | EOL 2026-06-01, последняя нечётная линия |
| Node.js 27.x | `v27.0.0-alpha.0.0.0` | 2026-10-29 | Первая **Alpha** по новой модели. 27.0.0 — 2027-04-22, LTS — 2027-10-20, EOL — 2030-04-30. Не для продакшена |
| npm | **12.2.2** | 2026-11-04 | 12.0.0 — 2026-07-08. **Не входит ни в одну Node, кроме Alpha 27** (там 12.1.0). Engines: `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` |
| pnpm | 12.18.0 | 2026-11-05 | 12.0.0 — 2026-08-26, 11.0.0 — 2026-04-28 |
| Yarn Berry (`@yarnpkg/cli-dist`) / Yarn classic (`yarn`) | 4.18.1 / 1.22.22 | 2026-09-24 / 2024-03-09 | Classic заморожен |
| Yarn 6 (Rust, «ZPM») | preview | 2026-01-28 | Стабильный релиз не подтверждён `[не проверено]` |
| Bun / Deno | 1.4.4 / 2.9.8 (GitHub; npm-пакет `deno` 2.9.6) | 2026-10-22 / 2026-10-21 | |
| corepack | 0.36.0 | 2026-08-28 | Всё ещё входит в Node 24 и 22; не распространяется с Node 25+ |
| TypeScript | **7.0.2** (`latest`) | 2026-07-08 | **Нативный компилятор на Go, без JS API.** 6.0.3 (2026-04-16) — последняя линия на JS; `@typescript/typescript6` 6.0.2 даёт `tsc6` и API 6.0. `next` — сборки 7.1, `beta` — 7.1.0-beta |
| typescript-eslint | 8.72.1 | 2026-10-26 | **peer `typescript >=4.8.4 <6.1.0`**: TS 7 не принимает (проверено локально, `ERESOLVE`) |
| ESLint / `@eslint/js` | 10.14.0 / 10.0.1 | 2026-10-30 / 2026-02-06 | ESLint 10.0.0 — 2026-02-06. Engines `^20.19.0 \|\| ^22.13.0 \|\| >=24` |
| Biome / oxlint / oxfmt / oxlint-tsgolint | 2.6.5 / 1.91.0 / 0.76.0 / 7.0.2006 | 2026-11-04 / 2026-11-03 / 2026-11-03 / 2026-11-05 | oxfmt до 1.0 (бета с 2026-02). Версия tsgolint кодирует версию TS (7.0.2 + патч) |
| Prettier / dprint | 3.9.10 / 0.64.0 | 2026-10-10 / 2026-10-18 | |
| tsx / ts-node | 4.23.15 / **10.9.2** | 2026-09-20 / **2023-12-08** | ts-node без релизов ~35 месяцев, заброшен |
| esbuild / @swc/core / rolldown | 0.28.2 / 1.16.18 / 1.2.14 | 2026-08-08 / 2026-10-11 / 2026-10-14 | rolldown 1.0.0 — 2026-05-07 |
| tsdown / tsup / unbuild | 0.23.7 / 9.0.0 / 3.6.1 | 2026-11-06 / 2026-10-14 / 2025-08-15 | README tsup: «not actively maintained anymore... use tsdown», хотя 9.0.0 вышел |
| Vitest / @vitest/coverage-v8 | 5.1.0 / 5.0.5 | 2026-11-02 / 2026-10-15 | 5.0.0 — 2026-09-03. Engines `^22.12.0 \|\| ^24 \|\| >=26`. Подробно — [testing.md](testing.md) |
| @types/node | 26.6.6 (есть линия `24.x`, например 24.19.2) | 2026-10-28 | Мажор совпадает с нижней границей рантайма |
| husky / lefthook / lint-staged / simple-git-hooks | **9.1.7 (2024-11-18)** / 2.2.2 / 17.6.0 / 2.14.0 | | husky без релизов ~23 месяца (застыл, но простой и рабочий) |
| knip / depcheck | 6.44.1 / **1.4.7 (2023-10-17)** | 2026-10-31 / — | depcheck заброшен |
| Renovate / npm-check-updates / taze | 44.221.4 / 23.1.1 / 21.3.0 | ноябрь / октябрь / сентябрь 2026 | |
| @changesets/cli | 3.0.3 | 2026-09-14 | 3.0.0 — 2026-08-11 |
| Socket CLI / sfw / Aikido safe-chain | 1.14.0 / 2.0.6 / 1.5.25 | 2026-11-05 / 2026-05 / 2026-10 | |
| Менеджеры версий | fnm 1.39.0 / nvm 0.41.0 / mise 2026.11.2 / n 11.0.0 / **Volta 2.0.2 (2024-12, не поддерживается)** | 2026 | |
| GitHub Actions | checkout v7.0.1, setup-node v7.1.0, upload-artifact v7.0.2, download-artifact v8.0.2, zizmor-action v0.8.1, dependency-review-action v5.0.0, pnpm/action-setup v6.1.1 | 2026 | SHA — в [шаблонах](#шаблоны) |
| lockfile-lint / @lavamoat/allow-scripts | 5.1.0 / 5.1.0 | 2026 | |
| audit-ci / better-npm-audit / madge | **7.1.0 (2024-07)** / **3.11.0 (2024-09)** / **8.0.0 (2024-08)** | | Все застыли (больше 18 месяцев без релиза) |
| dependency-cruiser / sherif / syncpack | 18.7.0 / 1.13.0 / 15.3.3 | 2026 | |
| @tsconfig/node24 / node22 / strictest | 24.0.5 / 22.0.6 / 2.0.8 | 2026-08 / 2026-08 / 2025-11 | |
| publint / @arethetypeswrong/cli | 0.3.25 / 0.18.5 | 2026 | |

## Линии Node и годовой цикл релизов

**Ключевые выводы**
- Статус на 6 ноября 2026:
  - **26.x Lithium — Active LTS** (с 26.13.0 от 2026-10-28; maintenance с 2027-10-20; EOL 2029-04-30).
  - **24.x Krypton — Maintenance LTS** (с 2026-10-20; EOL 2028-04-30).
  - **22.x Jod — Maintenance LTS**, EOL **2027-04-30**. Осталось меньше полугода, планируйте переход сейчас.
  - EOL: **20.x — 2026-04-30**, 18.x — 2025-04-30, 25.x — 2026-06-01.
  - **27.x — Alpha**: первая сборка `v27.0.0-alpha.0.0.0` от 2026-10-29, внутри npm 12.1.0. 27.0.0 запланирован на 2027-04-22.
- **Новый цикл релизов** («Evolving the Node.js Release Schedule», страница обновлена 2026-03-10; обсуждение — nodejs/Release#1113):
  - С 27.x — **один мажор в год**, и **каждый мажор становится LTS**. Деления на чётные и нечётные больше нет. Node 26 — последняя линия по старой модели, Node 25 — последняя нечётная «только Current».
  - Фазы: **Alpha** 6 месяцев (октябрь–март; semver-major изменения разрешены; сборки подписаны и протегированы, проходят CITGM; prerelease-теги вида `27.0.0-alpha.1`), **Current** 6 месяцев (апрель–октябрь), **LTS** 30 месяцев. От первого Current до EOL — 36 месяцев.
  - Мажоры выходят в апреле, номер совпадает с годом (27 в 2027, 28 в 2028). Перевод в LTS остаётся в октябре.
  - Совет из анонса: авторы библиотек должны **рано добавить Alpha в CI**. Для тех, кто ставит только LTS, почти ничего не меняется.
  - В `schedule.json` уже есть `v27: {alpha: 2026-10-28, start: 2027-04-22, lts: 2027-10-20, end: 2030-04-30}`. `CODENAMES.md` ещё называет Magnesium для «28.x 2027» (текст до изменения), поэтому кодовые имена для 27+ не устоялись.
  - Alpha-сборок нет в `/download/rc/` (индекс RC заканчивается на v26.4.0-rc.0), `/download/alpha/` 6 ноября 2026 отвечал 404. Alpha видна в основном `/dist/index.json`. Менеджеры версий, которые выбирают «latest» сортировкой этого индекса, могут взять Alpha `[не проверено]`. Закрепляйте явный мажор (`26`) или `lts/*`.
- **Какую версию целить (ноябрь 2026):**
  - Приложения и сервисы: **Node 26 LTS** для новых деплоев. 24 подходит до 2028-04 (только maintenance, без новых возможностей).
  - Библиотеки: `engines.node: ">=22.12"` (или `>=24`, если нужны новые API). 22.12 — версия, где `require(esm)` работает без флага; её же требуют ESLint 10 и Vitest 5. 20 убирайте сейчас (EOL), 22 — к 2027-04.
  - Матрица CI: 22, 24, 26, а для библиотек ещё 27 Alpha как неблокирующий job.
- **Патчи безопасности.** Security-релизы Node в 2026: 2026-07-28 (24.18.1, 22.23.2), 2026-10-20/21 (24.22.1, 22.23.4, 26.12.1), а также 22.23.0 (2026-06-17) и 24.17.0 (`"security": true`). Поле `security` в `index.json` говорит, исправляет ли патч уязвимость. Не застревайте на старом патче: например, 24.17.0 отстаёт на два security-релиза.
- **npm в каждой линии** (по `index.json`): 26.13.0 → npm 11.20.0; 24.22.x → 11.19.1; 22.23.x → 10.9.x. npm 12 есть только в Alpha 27. Значит, поведение npm 12 (блокировка install-скриптов) на любой LTS сегодня включается вручную: `npm i -g npm@12` или `npx npm@12`.
- **Полезные поля `index.json`:** `version`, `date`, `lts` (кодовое имя или `false`), `security`, `npm`, `v8`, `uv`, `openssl`, `modules` (ABI). Быстрый запрос — `curl -s https://nodejs.org/dist/index.json | node -e "..."` или `npx @pkgjs/nv ls lts` `[не проверено]`.

```bash
# 5 security-релизов с меткой LTS в порядке index.json (по убыванию версии, не по дате)
curl -s https://nodejs.org/dist/index.json | node -e "
const r = JSON.parse(require('fs').readFileSync(0, 'utf8'));
for (const v of r.filter(x => x.lts && x.security).slice(0, 5))
  console.log(v.version, v.date, v.lts, 'npm', v.npm);"
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js dist index.json](https://nodejs.org/dist/index.json) | Node.js Release WG, 2026 | Машиночитаемый список релизов с `lts`, `security`, версиями npm и V8 |
| [nodejs/Release](https://github.com/nodejs/Release) | Node.js Release WG, 2026 | Каноничная таблица графика, фазы, политика бэкпортов |
| [schedule.json](https://github.com/nodejs/Release/blob/main/schedule.json) | Node.js Release WG, 2026 | Точные даты, включая Alpha v27 |
| [CODENAMES.md](https://github.com/nodejs/Release/blob/main/CODENAMES.md) | Node.js Release WG | Кодовые имена LTS (Lithium = 26) |
| [Evolving the Node.js Release Schedule](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule) | Node.js Releasers, 2026 | Мажор раз в год, фазы Alpha/Current/LTS |
| [nodejs/Release#1113](https://github.com/nodejs/Release/issues/1113) | Node.js Release WG, 2025–2026 | Обсуждение смены графика |
| [Node.js release changes](https://www.infoq.com/news/2026/06/nodejs-release-changes) | InfoQ, 2026 | Вторичный пересказ изменения `[не проверено]` |
| [Node.js moving to one release a year](https://www.herodevs.com/blog-posts/node-js-moving-to-one-release-a-year) | HeroDevs, 2026 | Взгляд вендора на планирование EOL `[не проверено]` |
| [Previous releases](https://nodejs.org/en/about/previous-releases) | Node.js, 2026 | Таблица релизов и EOL для человека |
| [Security releases](https://nodejs.org/en/blog/vulnerability) | Node.js security team, 2026 | Анонсы security-релизов |
| [endoflife.date: Node.js](https://endoflife.date/nodejs) | endoflife.date | Таблица EOL с API |
| [CITGM](https://github.com/nodejs/citgm) | Node.js | «Canary in the Goldmine»: прогон экосистемы на новых сборках |

## Менеджеры версий и Corepack

**Ключевые выводы**
- **Один менеджер на команду и закоммиченный файл версии.** `.nvmrc` или `.node-version` (`26` или `lts/lithium`) читают fnm, n и `actions/setup-node` (`node-version-file`); nvm читает только `.nvmrc`; mise — только после `idiomatic_version_file_enable_tools = ["node"]` в настройках (по README nvm и документации mise). Дополнительно объявите `devEngines.runtime` в `package.json` ([поля package.json](#поля-packagejson)): npm его проверяет.
- **fnm** 1.39.0 (2026-03-06): Rust, кроссплатформенный, включая Windows; `fnm use --install-if-missing`, `--use-on-cd`. Быстрый и простой выбор по умолчанию для машин, где нужен только Node.
- **nvm** 0.41.0 (2026-11-04): POSIX shell, только macOS, Linux и WSL. Медленный старт shell, подгружайте лениво. `nvm-windows` — отдельный проект; GitHub API ответил «Moved Permanently» для `coreybutler/nvm-windows`, проверьте его новый адрес, прежде чем советовать.
- **mise** 2026.11.2 (2026-11-05): Rust, преемник asdf для многих языков (Node, Python, Bun, Deno, pnpm через `mise.toml`), плюс задачи и переменные окружения. README Volta рекомендует переходить на него. Хороший выбор для репозиториев на нескольких языках.
- **Volta не поддерживается.** README: «**Volta is unmaintained.** ... We recommend migrating to `mise`» (issue #2080). Последний релиз — v2.0.2 от 2024-12-05. `[устарело: → mise или fnm]`. Ключ `"volta": {"node": ...}` в `package.json` замените на `devEngines` и `.node-version`.
- **n** 11.0.0 (2026-10-18, tj/n): только Unix, ставит в `/usr/local`. Подходит для серверов и контейнеров.
- **Corepack** (шимы pnpm и Yarn по полю `packageManager`): Node TSC 2025-03-19 проголосовал **перестать распространять corepack начиная с Node 25** `[не проверено]`. Node 24 и 22 ещё несут его как экспериментальный. На Node 26 при необходимости — `npm i -g corepack` (0.36.0, 2026-08-28). Альтернативы: собственное управление версией в pnpm (поддержка `packageManager` и `devEngines.packageManager` в pnpm 11), «Yarn Switch» из Yarn 6 на Rust, mise.
- **В CI менеджер версий не нужен.** Используйте `actions/setup-node` с `node-version-file` или явной матрицей.
- Docker: официальные образы `node:26-*` (`-slim`, `-alpine`), закреплённые по digest, или distroless-образы Node. Подробности — в [domains-server.md](domains-server.md).

```bash
echo 26 > .node-version
fnm use --install-if-missing          # fnm
mise use node@26                      # mise, пишет mise.toml
node -p "process.versions.node"
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [fnm](https://github.com/Schniz/fnm) | G. Schnitzer, 2026 | Установка, настройка shell, `.node-version` |
| [nvm](https://github.com/nvm-sh/nvm) | nvm maintainers, 2026 | Использование, `.nvmrc`, ленивая загрузка |
| [mise](https://mise.jdx.dev/) | J. Dickey, 2026 | Инструменты, задачи, окружение |
| [mise: Node](https://mise.jdx.dev/lang/node.html) | J. Dickey, 2026 | Бэкенд Node в mise, поддержка `.nvmrc` |
| [Volta](https://github.com/volta-cli/volta) | Volta team, 2025 | Уведомление «Volta is unmaintained» `[устарело: → mise]` |
| [volta-cli/volta#2080](https://github.com/volta-cli/volta/issues/2080) | Volta team, 2025 | Причины и обсуждение миграции |
| [n](https://github.com/tj/n) | TJ Holowaychuk et al., 2026 | Менеджер версий `n` |
| [corepack](https://github.com/nodejs/corepack) | Node.js, 2026 | Corepack как отдельный пакет |
| [nodejs/TSC#1697](https://github.com/nodejs/TSC/pull/1697) | Node.js TSC, 2025 | Голосование: не распространять corepack с v25 `[не проверено]` |
| [Node.js TSC votes to stop distributing corepack](https://socket.dev/blog/node-js-tsc-votes-to-stop-distributing-corepack) | Socket, 2025 | Пересказ решения по corepack `[не проверено]` |
| [actions/setup-node](https://github.com/actions/setup-node) | GitHub, 2026 | `node-version-file`, правила автокэша npm (v7.1.0) |

## Пакетные менеджеры, lockfile и workspaces

**Ключевые выводы: npm**
- npm входит в Node: 11.x на всех LTS-линиях, 12.2.2 ставится отдельно. Lockfile — `package-lock.json`, `lockfileVersion: 3` (проверено локально). **npm 12 удалил `npm shrinkwrap`** и больше не читает `npm-shrinkwrap.json`: переименуйте его в `package-lock.json`.
- **npm 12 (2026-07-08): что меняется для инструментария** (по release notes; пункты 1–3, 5 и 8 проверены локально через `npx npm@12.2.2`):
  1. **Lifecycle-скрипты зависимостей заблокированы по умолчанию**: `preinstall`, `install`, `postinstall`, неявные сборки `node-gyp`, `prepare` у git-зависимостей. Разрешение даёт только поле `allowScripts` корневого проекта. Установка при этом завершается с кодом 0 и печатает `npm warn install-scripts 1 package had install scripts blocked because they are not covered by allowScripts: esbuild@0.28.2 (postinstall: node install.js)`.
  2. `npm install-scripts approve <pkg>` пишет запись **с закреплённой версией**, например `"allowScripts": {"esbuild@0.28.2": true}`. `deny` пишет запись только по имени со значением `false`, она всегда побеждает. Есть `ls` и `prune`. `--no-allow-scripts-pin` пишет записи только по имени. После одобрения `npm rebuild` запускает одобренные скрипты. Документация предупреждает, что команда «is unaware of workspaces».
  3. **`--strict-allow-scripts`** превращает непросмотренные скрипты в ошибку: `npm error code ESTRICTALLOWSCRIPTS`, код 1. Аварийный выход — `--dangerously-allow-all-scripts`. В CI используйте строгий режим.
  4. `allow-git` и `allow-remote` по умолчанию `none`: git-зависимости и зависимости по URL tarball отвергаются, пока не выставлено `all` или `root`.
  5. Неизвестные ключи `.npmrc` и неизвестные или сокращённые флаги CLI — ошибка (`EUNKNOWNCONFIG`, код 1 для `--foo-bar`). Устаревшие флаги в CI ломаются при обновлении.
  6. `npm view --json` всегда возвращает массив; `npm pkg get` больше не форсирует JSON; `npm adduser` и `npm star` удалены; `npm init` больше не ставит лицензию ISC по умолчанию.
  7. Engines: `^22.22.2 || ^24.15.0 || >=26.0.0`.
  8. esbuild работает и с заблокированным postinstall (`npx esbuild --version` → 0.28.2): его бинарник приходит из платформенного пакета в `optionalDependencies`. Пакеты, которые компилируют или скачивают что-то в `postinstall` (fallback-сборки sharp, аддоны на node-gyp, браузеры Playwright, движки Prisma), без одобрения работать не будут `[не проверено]`.
- **В npm 11.x уже есть cooldown:** `min-release-age=<дни>` и `before=<дата>`; npm 12 добавляет `min-release-age-exclude`. В npm 11 `allow-git` по умолчанию `all`. Проверено локально: `npm install --min-release-age=120 esbuild@^0.28 --dry-run` выбрал 0.28.1, потому что 0.28.2 было 90 дней.
- `install-strategy=linked` даёт изолированную раскладку в стиле pnpm. Документация советует её в разработке, чтобы ловить необъявленные зависимости.
- Workspaces: `"workspaces": ["packages/*"]`, `npm -w <name> run x`, `npm run test --workspaces --if-present`.

```bash
npx npm@12 install                          # блокирует скрипты зависимостей, печатает предупреждение
npx npm@12 install-scripts ls               # что заблокировано
npx npm@12 install-scripts approve esbuild  # пишет "allowScripts": {"esbuild@0.28.2": true}
npx npm@12 rebuild esbuild                  # запустить одобренный скрипт
npx npm@12 ci --strict-allow-scripts        # CI: непросмотренный скрипт = ESTRICTALLOWSCRIPTS, код 1
```

**Ключевые выводы: `npm ci` (проверено локально на npm 11.13)**
- Сначала удаляет `node_modules`.
- Падает с `EUSAGE`, если lockfile нет или диапазон из `package.json` не удовлетворяется lock (`Invalid: lock file's prettier@3.9.10 does not satisfy prettier@3.9.9`, `Missing: left-pad@1.3.0 from lock file`).
- **Ловит не любой дрейф.** Добавление `"ms": "2.1.3"` в `dependencies` прошло `npm ci` с кодом 0: `ms@2.1.3` уже был в lock как поднятая (hoisted) транзитивная зависимость, а корневая запись lock осталась устаревшей. Добавьте проверку свежести lock: `npm install --package-lock-only --ignore-scripts && git diff --exit-code package-lock.json`.
- В конце по умолчанию запускает `npm audit`, печатает уязвимости и **всё равно возвращает 0**. Передавайте `--no-audit --no-fund` ради скорости и запускайте аудит отдельным шагом.
- Не применяет `min-release-age` к уже закреплённым в lock версиям (подробно — в [обязательных проверках](#обязательные-проверки-качества)).

**Ключевые выводы: pnpm**
- Content-addressed store и строгий `node_modules` на симлинках; обычный выбор для монорепозиториев.
- **pnpm 11.0.0 (2026-04-28):** нужен Node 22+, сам pnpm — чистый ESM. **`minimumReleaseAge` по умолчанию 1440 минут (1 день).** `blockExoticSubdeps: true`, `strictDepBuilds: true`. Карта **`allowBuilds`** (`true` разрешает, `false` запрещает) заменяет `onlyBuiltDependencies`, `neverBuiltDependencies` и `ignoredBuiltDependencies`; неперечисленный пакет с install-скриптами вызывает ошибку. `.npmrc` читается только для auth и registry, всё остальное живёт в `pnpm-workspace.yaml`. Переменные `npm_config_*` игнорируются (используйте `pnpm_config_*`). Поле `pnpm` в `package.json` больше не читается. Индекс store на SQLite. Новое: `pnpm ci`, `pnpm sbom`, `pnpm audit --fix=update`, `auditConfig.ignoreGhsas` на основе GHSA.
- **pnpm 12.0.0 (2026-08-26):** неизвестные ключи `pnpm-workspace.yaml` дают предупреждение, а при подходящей закреплённой версии pnpm — ошибку `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS`. Ошибки `engineStrict` в транзитивных зависимостях стали фатальными. `--frozen-lockfile false` удалён (используйте `--no-frozen-lockfile`). Git-зависимости записываются как HTTPS. Отказывается работать под `sudo`. pnpm может ставить и запускать npm, Yarn и Bun как пакетный менеджер проекта. Release notes упоминают «Rust CLI», объём этого изменения неясен `[не проверено]`.
- CI: `pnpm install --frozen-lockfile` (поведение по умолчанию, когда задана переменная `CI`) или `pnpm ci`. Lockfile — `pnpm-lock.yaml`.

```yaml
# pnpm-workspace.yaml (pnpm 11+)
packages:
  - "packages/*"
minimumReleaseAge: 4320      # минуты, 3 дня; по умолчанию 1440
allowBuilds:
  esbuild: true
  core-js: false
```

Проверено локально на pnpm 11.28.11 и 12.18.0: оба ключа распознаны (неизвестный ключ pnpm 12 печатает в `WARN ... not recognized`), `minimumReleaseAge: 4320` для `npm@^12` выбрал 12.2.1 вместо вышедшего за 2 дня до этого 12.2.2, postinstall esbuild выполнился, core-js — нет; без записи `core-js` установка упала с `ERR_PNPM_IGNORED_BUILDS` и кодом 1.

**Ключевые выводы: Yarn, Bun, Deno**
- **Yarn Berry 4.18.1** (2026-09-24) — текущая версия. CI: `yarn install --immutable`.
- **Yarn 6** («ZPM», переписан на Rust) показан как preview 2026-01-28. Заявлено до 5× быстрее тёплые установки; поддержка Windows на момент preview была открыта; Yarn 5 задуман как промежуточный шаг на JS; «Yarn Switch» заменяет corepack; «Lazy Installs» заменяют Zero-Installs. Стабильный 6.0 на 6 ноября 2026 не подтверждён `[не проверено]`.
- **Yarn classic 1.22.22 (2024-03) заморожен** `[устарело: → npm, pnpm или Yarn 4]`.
- **Bun 1.4.4** как пакетный менеджер: быстрый `bun install`, текстовый lockfile `bun.lock`, lifecycle-скрипты зависимостей запускаются только для `trustedDependencies`, в CI — `bun install --frozen-lockfile`. Годится для скриптов и новых проектов; для продакшена на Node оставайтесь на npm или pnpm, если команда не переходит на Bun целиком `[не проверено]`.
- **Deno 2.9** умеет ставить зависимости из `package.json` (`deno install`) и запускать npm-пакеты. Как пакетный менеджер Node-проекта — ниша `[не проверено]`.

**Ключевые выводы: правила lockfile для всех менеджеров**
- Коммитьте ровно один lockfile. В CI ставьте командой с замороженным lock, никогда не `npm install`. Читайте диффы lockfile на ревью.
- `lockfile-lint` проверяет HTTPS и разрешённые хосты: `npx lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https` (команда из README) `[не проверено]`.
- Монорепозитории (подробно — в [architecture.md](architecture.md)): workspaces pnpm или npm плюс Turborepo 2.11.9 или Nx 23.3; `@changesets/cli` 3.0 для версий; `sherif` или `syncpack` для согласованных версий между пакетами.

| Менеджер | Lockfile | Установка в CI | Install-скрипты зависимостей |
|---|---|---|---|
| npm 11 | `package-lock.json` (v3) | `npm ci` | Запускаются; `ignore-scripts=true` выключает все |
| npm 12 | `package-lock.json` (v3) | `npm ci --strict-allow-scripts` | Заблокированы, кроме `allowScripts` |
| pnpm 11–12 | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` или `pnpm ci` | Ошибка для неперечисленных в `allowBuilds` |
| Yarn 4 | `yarn.lock` | `yarn install --immutable` | — |
| Bun 1.4 | `bun.lock` | `bun install --frozen-lockfile` | Только `trustedDependencies` |

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [npm v12.0.0 release](https://github.com/npm/cli/releases/tag/v12.0.0) | npm/GitHub, 2026 | Ломающие изменения npm 12 |
| [npm install-scripts](https://docs.npmjs.com/cli/v12/commands/npm-install-scripts) | npm/GitHub, 2026 | `allowScripts`: approve, deny, ls, prune |
| [npm config](https://docs.npmjs.com/cli/v12/using-npm/config) | npm/GitHub, 2026 | `min-release-age`, `allow-git`, `allow-remote`, `audit-level`, `install-strategy` |
| [package.json (npm v12)](https://docs.npmjs.com/cli/v12/configuring-npm/package-json) | npm/GitHub, 2026 | `devEngines`, `engines`, `exports`, `files`, `publishConfig` |
| [npm ci](https://docs.npmjs.com/cli/v12/commands/npm-ci) | npm/GitHub, 2026 | Семантика `npm ci` |
| [package-lock.json](https://docs.npmjs.com/cli/v12/configuring-npm/package-lock-json) | npm/GitHub, 2026 | Формат lockfile v3 |
| [npm workspaces](https://docs.npmjs.com/cli/v12/using-npm/workspaces) | npm/GitHub, 2026 | Workspaces в npm |
| [RIP npm postinstall scripts](https://semgrep.dev/blog/2026/rip-npm-postinstall-scripts-npm-v12-default-change) | Semgrep, 2026 | Почему блокировка install-скриптов важна и что она не ловит `[не проверено]` |
| [npm v12 lifecycle script limits](https://checkmarx.com/zero-post/npm-v12-lifecycle-script-limits-a-real-malicious-package-risk-reduction-or-just-moving-risk-around.md) | Checkmarx, 2026 | Критика: полезная нагрузка переезжает во время импорта `[не проверено]` |
| [npm 12 released](https://www.infoq.com/news/2026/08/npm-12-released/) | InfoQ, 2026 | Новостной пересказ npm 12 `[не проверено]` |
| [pnpm v11.0.0](https://github.com/pnpm/pnpm/releases/tag/v11.0.0) | pnpm team, 2026 | Безопасные умолчания pnpm 11, `allowBuilds` |
| [pnpm v12.0.0](https://github.com/pnpm/pnpm/releases/tag/v12.0.0) | pnpm team, 2026 | Изменения pnpm 12 |
| [pnpm settings](https://pnpm.io/settings) | pnpm team, 2026 | `minimumReleaseAge`, `allowBuilds`, `trustPolicy` |
| [pnpm: supply chain security](https://pnpm.io/supply-chain-security) | pnpm team, 2026 | Руководство pnpm по supply chain |
| [pnpm workspaces](https://pnpm.io/workspaces) | pnpm team, 2026 | Workspaces, протокол `workspace:`, catalogs |
| [Yarn 6 preview](https://v6.yarnpkg.com/blog/2026-01-28-yarn-6-preview) | Yarn team, 2026 | Preview Yarn 6 на Rust `[не проверено]` |
| [Yarn 6 concepts](https://v6.yarnpkg.com/concepts/yarn-6) | Yarn team, 2026 | Концепции Yarn 6, Yarn Switch `[не проверено]` |
| [Yarn](https://yarnpkg.com/) | Yarn team, 2026 | Документация Yarn 4 |
| [bun install](https://bun.com/docs/cli/install) | Oven, 2026 | `bun install`, `trustedDependencies`, `bun.lock` |
| [Deno: Node and npm compatibility](https://docs.deno.com/runtime/fundamentals/node/) | Deno, 2026 | Совместимость Deno 2 с Node и npm |
| [lockfile-lint](https://github.com/lirantal/lockfile-lint) | L. Tal, 2026 | Политика хостов и HTTPS для lockfile |

## Поля package.json

**Ключевые выводы**
- **`"type": "module"`** для всего нового кода. По нему Node решает, как читать `.js` (сам npm поле игнорирует). `.mjs`/`.cjs` (и `.mts`/`.cts`) переопределяют режим для файла. `require(esm)` работает без флагов с 22.12 / 20.19, поэтому ESM-only библиотеки приемлемы для потребителей на Node 22+ (подробно — в [idioms-patterns.md](idioms-patterns.md) и [domains-client.md](domains-client.md)).
- **`"exports"`** — публичная поверхность пакета. Что не перечислено, импортировать нельзя (`ERR_PACKAGE_PATH_NOT_EXPORTED`). Порядок условий: сначала `"types"`, затем `"import"`/`"require"` или `"node"`, последним `"default"`. Экспортируйте `"./package.json"`, если он нужен инструментам. Проверяйте `publint` и `@arethetypeswrong/cli` (`attw --pack`). Детали для библиотек — в [domains-client.md](domains-client.md).
- **`"imports"`** (subpath imports, ключи начинаются с `#`) — встроенная в Node замена алиасов `paths` из tsconfig. Type stripping не переписывает `paths`, поэтому `"imports": {"#app/*": "./src/*"}` — переносимый вариант; TypeScript понимает `#`-импорты при `nodenext`.
- **`"engines": {"node": ">=22.12"}`** носит рекомендательный характер. npm только предупреждает и только при установке пакета как зависимости (документация: «advisory only and will only produce warnings when your package is installed as a dependency»), если не задан `engine-strict=true`. pnpm 12 делает ошибки `engineStrict` в транзитивных зависимостях фатальными. Для своего репозитория используйте `devEngines`.
- **`"devEngines"`** (npm 10.9+/11): ключи `runtime`, `packageManager`, `os`, `cpu`, `libc`; каждый — `{name, version?, onFail?}`, где `onFail` — `error` (по умолчанию), `warn` или `ignore`. **npm проверяет его для корневого проекта при install и run.** Проверено локально на npm 11.13: `devEngines.runtime {name: "node", version: ">=26"}` заставил `npm install` и `npm run` завершиться с кодом 1 и `EBADDEVENGINES ... ">=26" does not match "v24.17.0"`; с `onFail: "warn"` установка прошла с кодом 0 и предупреждением. pnpm 11 читает `devEngines.packageManager`. `actions/setup-node` v7 включает кэш npm автоматически, если `devEngines.packageManager` или `packageManager` указывает npm.
- **`"packageManager": "pnpm@12.18.0+sha512..."`** — поле corepack. Его по-прежнему читают pnpm, Yarn и setup-node, но corepack больше не входит в Node 25+, поэтому для новых проектов предпочитайте `devEngines.packageManager`. Держать оба поля не вредно.
- **`"allowScripts"`** (npm 12) и **`allowBuilds`** (pnpm 11+, в `pnpm-workspace.yaml`) — списки разрешённых install-скриптов (см. [пакетные менеджеры](#пакетные-менеджеры-lockfile-и-workspaces) и [защиту supply chain](#защита-supply-chain-потребитель-и-издатель)).
- **`"scripts"`** запускайте через `node --run <name>` (Node 22+; без накладных расходов на старт npm, без хуков pre/post, задаёт `NODE_RUN_SCRIPT_NAME`; с 26.9.0 `node --run` без имени выводит список скриптов) или `npm run`. Держите скрипты кроссплатформенными: без `rm -rf`; цепочки через `&&` допустимы; логику выносите в `node -e` или маленькие `.ts`-скрипты.
- **`"files"`** (allow-list для публикации) лучше `.npmignore`. Проверка — `npm pack --dry-run`. **`"sideEffects": false`** — для tree-shaking в бандлерах. **`"publishConfig": {"access": "public", "provenance": true}`**.
- **`"private": true`** для приложений и корней монорепозиториев защищает от случайной публикации.
- Node также читает **`node.config.json`** (`--config-file`, stable с 26.12.0; раньше `--experimental-config-file`) с пространствами `nodeOptions`, `test`, `watch` и `permission` (в 26.x ещё `bench`, `nodeVersion` и массив `configs` для нескольких мажоров) и `$schema` вида `https://nodejs.org/dist/vX.Y.Z/docs/node-config-schema.json` (подставьте версию). Приоритет: CLI/`NODE_OPTIONS` > `NODE_OPTIONS` из dotenv > файл конфига. Пространство тест-раннера до 24.18.x и 25.0–25.3 называлось `testRunner`; с 24.19.0 / 25.4.0 — `test`, а `testRunner` даёт ошибку «the "testRunner" namespace has been removed» (проверено локально на 24.18.1, 24.19.0 и 26.13.0; подробно — в [testing.md](testing.md#6-nodetest-запуск-изоляция-шардирование-конфиг)).

Фрагмент для публикуемой библиотеки (поля из этого раздела; полный шаблон приложения — в [шаблонах](#шаблоны)):

```json
{
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./package.json": "./package.json"
  },
  "imports": { "#app/*": "./src/*" },
  "engines": { "node": ">=22.12" },
  "devEngines": {
    "runtime": { "name": "node", "version": ">=22.12", "onFail": "error" },
    "packageManager": { "name": "npm", "version": ">=11.5.1", "onFail": "warn" }
  },
  "files": ["dist"],
  "sideEffects": false,
  "publishConfig": { "access": "public", "provenance": true }
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js: Packages](https://nodejs.org/api/packages.html) | Node.js, 2026 | `type`, `exports`, `imports`, условия, двойные пакеты |
| [Node.js CLI](https://nodejs.org/api/cli.html) | Node.js, 2026 | `--run`, `--config-file`, `--env-file`, флаги разрешений |
| [package-metadata-interoperability-collab-space](https://github.com/openjs-foundation/package-metadata-interoperability-collab-space) | OpenJS, 2024–2025 | Откуда взялся `devEngines` |
| [publint](https://publint.dev/) | Bjorn Lu, 2026 | Проверка `package.json` и `exports` перед публикацией |
| [Are the types wrong?](https://arethetypeswrong.github.io/) | A. Branch, 2026 | Разрешение типов в каждом режиме модулей |
| [Move on to ESM-only](https://antfu.me/posts/move-on-to-esm-only) | A. Fu, 2025 | Аргументы за ESM-only пакеты после `require(esm)` |
| [require(esm) in Node.js](https://joyeecheung.github.io/blog/2024/03/18/require-esm-in-node-js/) | J. Cheung, 2024 | Как появился `require(esm)` |

## Запуск и компиляция TypeScript

**Ключевые выводы: встроенный type stripping**
- Появился в 22.6; **включён по умолчанию с 23.6 / 22.18**; без предупреждения с 24.3 / 22.18; **Stable с 25.2 / 24.12**. Выключается `--no-strip-types` (раньше `--no-experimental-strip-types`).
- **`--experimental-transform-types` удалён в v26.0.0.** Enum, namespace с runtime-кодом, parameter properties и алиасы `import x = require()` теперь требуют настоящего компилятора (tsx, tsc, swc) или переписывания. Проверено локально на 24.17: флаг ещё работал, но печатал `ExperimentalWarning: Transform Types`; обычный `enum` без флага падал с `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`.
- Ограничения: явные расширения в импортах (`./x.ts`); `import type` для импортов только типов (иначе ошибка в рантайме); нет `.tsx`; нет `paths` (используйте `#imports`); `.ts` внутри `node_modules` отвергается (публиковать сырой `.ts` нельзя); декораторы — ошибка парсинга; парсеру (Amaro, swc в wasm) нужен WebAssembly.
- Рекомендуемый tsconfig из документации Node: `"noEmit": true, "target": "esnext", "module": "nodenext", "rewriteRelativeImportExtensions": true, "erasableSyntaxOnly": true, "verbatimModuleSyntax": true` (плюс `allowImportingTsExtensions`, если не эмитите).
- `process.features.typescript` на 24.17 равен `"strip"`. `node --test` по умолчанию находит `**/*.test.ts` и запустил TS-тесты без флагов (проверено локально).

```ts
// enum не стирается: на Node 26 нужен компилятор. Замена, которая стирается:
export const Level = { Debug: 0, Info: 1, Error: 2 } as const;
export type Level = (typeof Level)[keyof typeof Level];

import type { Server } from "node:http";   // только тип: обязательно import type
import { start } from "./server.ts";        // явное расширение
```

**Ключевые выводы: когда всё ещё нужен раннер**
- **tsx 4.23.15** (на esbuild): enum, `paths`, `.tsx`, интероп CJS/ESM, `tsx watch`. Берите для скриптов с нестираемым синтаксисом или JSX.
- **ts-node 10.9.2** (2023-12; 11.0.0-beta.1 так и не вышел) `[устарело: → встроенный type stripping или tsx]`.
- **@swc-node/register** 1.12.1 и **@oxc-node/core** 1.0.1 — более быстрые register-хуки. `ts-blank-space` (Bloomberg) стирает типы пробелами, подход сравним с Amaro (1.3.0) внутри Node.

**Ключевые выводы: TypeScript 7.0 против 6.0**
- **TS 6.0 (2026-03-23)** — «the last release based on the current JavaScript codebase». Новые умолчания: `strict: true`, `module: esnext`, `target` — последний (`es2025`), **`types: []`** (добавьте `"types": ["node"]`, иначе глобальные типы Node пропадут), `rootDir` — каталог tsconfig, `noUncheckedSideEffectImports: true`. Устарели (заглушаются `"ignoreDeprecations": "6.0"`, удалены в 7.0): `target: es5`, `downlevelIteration`, `moduleResolution: node`/`node10`/`classic`, `baseUrl`, `alwaysStrict: false`, `outFile`, `module: amd/umd/system/none`, `esModuleInterop: false` (проверено локально на 6.0.3: для `outFile`, `classic`, `amd`, `umd`, `system` и `esModuleInterop: false` — TS5101/TS5107, с `ignoreDeprecations` — код 0). Import `assert {}` — ошибка TS2880 даже с `ignoreDeprecations` (используйте `with`).
- **TS 7.0 (2026-07-08)** — порт на Go, опубликован как обычный пакет `typescript` (бинарник `tsc` поверх платформенных пакетов `@typescript/typescript-<os>-<arch>`). Заявлено «typically 8x to 12x faster full builds». По умолчанию проверяет типы в 4 параллельных чекерах (`--checkers N`, `--builders N` для `--build`, `--singleThreaded`; оба флага помечены экспериментальными). Новый watch на watcher из Parcel, поддержка редакторов через LSP. **Удаляет всё, что устарело в 6.0**, и **«does not ship with an API»**. Новый, другой API ожидается в 7.1 (`typescript@beta` — 7.1.0-beta).
- **Следствие для инструментов:** всё, что импортирует `typescript` как библиотеку, на 7.0 ломается: type-aware правила typescript-eslint, ts-morph, `ts-jest`, TypeDoc, часть dts-плагинов бандлеров. **typescript-eslint 8.72.x объявляет peer `typescript >=4.8.4 <6.1.0`**: `npm i -D typescript@7.0.2 typescript-eslint@8.72.0` падает с `ERESOLVE` (проверено локально).
- **Рабочая схема с алиасами** (рекомендована командой TS, проверено локально): API 6.0 остаётся под именем `typescript` для инструментов, а 7.0 ставится под алиасом для проверки типов.

```bash
npm i -D "typescript@npm:@typescript/typescript6@6.0.2" "@typescript/native@npm:typescript@7.0.2"
npx tsc --version     # Version 7.0.2 (бинарник из алиаса)
npx tsc6 --version    # 6.0.3 (даёт @typescript/typescript6)
npx tsc --noEmit && npx tsc6 --noEmit   # оба кода 0
```

- Результат: `node_modules/.bin/tsc` — **TS 7.0.2**, `tsc6` — 6.0.3, typescript-eslint получает API 6.0. Оговорка: два бинарника `tsc` конкурируют за одну ссылку в `.bin`; в проверке победил 7.0.2, но на своей установке проверьте `npx tsc --version`.
- Не глушите `ERESOLVE` через `--legacy-peer-deps`: установка пройдёт, а type-aware правила сломаются в рантайме.
- Проще для приложений без type-aware линтинга: просто `typescript@7`. Для библиотек, которые эмитят `.d.ts` через плагины, и для шаблонов Vue, Svelte, Astro, MDX, Angular (по анонсу, в редакторах на TS 7 не поддерживаются) оставайтесь на 6.0 до 7.1.

**Ключевые выводы: эмит и бандлинг**
- **Приложения:** без сборки (запуск `.ts` через type stripping) или `tsc` (`rewriteRelativeImportExtensions` превращает `./x.ts` в `./x.js`).
- **Библиотеки:** **tsdown 0.23.7** (Rolldown 1.x + oxc, преемник tsup, `.d.ts` через `isolatedDeclarations` в oxc или через tsc) — выбор по умолчанию в 2026. По умолчанию пишет `.mjs`/`.d.mts` даже при `"type": "module"`; `fixedExtension: false` возвращает `.js`/`.d.ts` (проверено локально на 0.23.7) — сверьте с `exports`. **tsup 9.0.0 вышел 2026-10-14, но его README говорит «is not actively maintained anymore. Please consider using tsdown»** `[устарело: → tsdown]`. **unbuild 3.6.1 (2025-08)**: README сообщает, что unjs «experimenting with obuild» (0.4.45) как преемником.
- esbuild 0.28.2 и swc 1.16.18 остаются ядрами транспиляции; Rolldown 1.0.0 (2026-05-07) — бандлер внутри Vite и tsdown. Подробно — в [domains-client.md](domains-client.md).

| Задача | Инструмент |
|---|---|
| Запуск `.ts` со стираемым синтаксисом | `node file.ts` (Node 22.18+, stable 24.12+) |
| Enum, декораторы, JSX, `paths` | tsx 4.23 |
| Проверка типов | `tsc --noEmit` (TS 7) или `tsc6 --noEmit` |
| Сборка приложения | без сборки или `tsc` с `rewriteRelativeImportExtensions` |
| Сборка библиотеки | tsdown 0.23 |

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js: TypeScript](https://nodejs.org/api/typescript.html) | Node.js, 2026 | Статус type stripping, ограничения, рекомендуемый tsconfig |
| [Running TypeScript natively](https://nodejs.org/en/learn/typescript/run-natively) | Node.js, 2025–2026 | Learn-руководство по запуску TS в Node |
| [Amaro](https://github.com/nodejs/amaro) | Node.js (M. Ippolito), 2026 | Стриппер внутри Node |
| [Everything you need to know about Node.js type stripping](https://satanacchio.hashnode.dev/everything-you-need-to-know-about-nodejs-type-stripping) | M. Ippolito, 2024–2025 | Обоснование дизайна от автора функции `[не проверено]` |
| [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) | D. Rosenwasser, 2026 | Умолчания и устаревания TS 6.0 |
| [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/?p=5246) | D. Rosenwasser, 2026 | Нативный порт, отсутствие API, алиасы для совместимости |
| [A 10x faster TypeScript](https://devblogs.microsoft.com/typescript/typescript-native-port/) | A. Hejlsberg, 2025 | Первый анонс нативного порта |
| [typescript-go](https://github.com/microsoft/typescript-go) | Microsoft, 2026 | Репозиторий порта, issues, прогресс API |
| [TSConfig reference](https://www.typescriptlang.org/tsconfig/) | Microsoft, 2026 | Справочник tsconfig |
| [TypeScript 7.0 RC](https://visualstudiomagazine.com/articles/2026/06/22/typescript-7-0-rc-moves-microsofts-go-rewrite-into-the-mainline-compiler.aspx) | Visual Studio Magazine, 2026 | Обзор RC `[не проверено]` |
| [TypeScript 7 released](https://www.infoq.com/news/2026/08/typescript-7-released/) | InfoQ, 2026 | Обзор релиза `[не проверено]` |
| [tsx](https://tsx.is/) | H. Shin (privatenumber), 2026 | Документация раннера tsx |
| [ts-node](https://github.com/TypeStrong/ts-node) | TypeStrong, 2023 | Исторический раннер `[устарело: → tsx или встроенный type stripping]` |
| [ts-blank-space](https://github.com/bloomberg/ts-blank-space) | Bloomberg (A. Button), 2025 | Стирание типов пробелами |
| [tsdown](https://tsdown.dev/) | VoidZero / sxzz, 2026 | Бандлер библиотек на Rolldown |
| [Migrate from tsup](https://tsdown.dev/guide/migrate-from-tsup) | VoidZero, 2026 | Переход tsup → tsdown |
| [tsup](https://github.com/egoist/tsup) | EGOIST, 2026 | Уведомление «not actively maintained» `[устарело: → tsdown]` |
| [Rolldown](https://rolldown.rs/) | VoidZero, 2026 | Rolldown 1.x |
| [esbuild](https://esbuild.github.io/) | E. Wallace, 2026 | Документация esbuild |
| [swc](https://swc.rs/) | swc project, 2026 | Документация swc |
| [obuild](https://github.com/unjs/obuild) | unjs, 2026 | Эксперимент-преемник unbuild |

## Линтинг и форматирование

**Ключевые выводы: ESLint 10 и typescript-eslint**
- **ESLint 10 + typescript-eslint 8 остаются эталонным стеком** для type-aware правил и экосистемы плагинов.
- **ESLint 10.0.0 (2026-02-06):** **eslintrc удалён полностью** (`.eslintrc.*` и `.eslintignore` игнорируются) `[устарело: .eslintrc → flat config]`; Node `^20.19.0 || ^22.13.0 || >=24`; поиск конфига начинается с **каталога каждого проверяемого файла** (удобно для монорепозиториев); TypeScript-конфиги (`eslint.config.ts`) требуют `jiti >= 2.2` (peer dependency); `eslint:recommended` получил новые правила; JSX-идентификаторы считаются ссылками.
- Используйте `defineConfig()` и `globalIgnores()` из `eslint/config` (ESLint ≥9.22) и ключ `extends` внутри объектов конфига. Шаблон из раздела [Шаблоны](#шаблоны) прошёл чисто на ESLint 10.14.0 (проверено локально).
- **typescript-eslint:** `tseslint.configs.strictTypeChecked` + `stylisticTypeChecked`, `parserOptions.projectService: true` (без ручных глобов `project`), `tsconfigRootDir: import.meta.dirname`, `tseslint.configs.disableTypeChecked` для обычных JS-файлов. Самые ценные правила для Node: `no-floating-promises`, `no-misused-promises`, `await-thenable`, `switch-exhaustiveness-check`, `consistent-type-imports` (в паре с `verbatimModuleSyntax`), `only-throw-error`, `prefer-promise-reject-errors`.
- **Грабли (проверено локально):** `no-floating-promises` ругается на каждый верхнеуровневый `test(...)`/`describe(...)` из `node:test` (они возвращают промисы). Разрешите их явно, а не ставьте `void` перед каждым вызовом:

```js
"@typescript-eslint/no-floating-promises": ["error", {
  allowForKnownSafeCalls: [
    { from: "package", package: "node:test", name: ["test", "it", "describe", "suite"] },
  ],
}],
```

- Peer-диапазон `typescript <6.1.0`: как жить рядом с TS 7 — в [запуске TypeScript](#запуск-и-компиляция-typescript).
- **Шум аудита (проверено локально):** свежая установка `eslint@10.14.0 + typescript-eslint@8.72.1` даёт **10 moderate** advisories (ReDoS в minimatch 10.2.6, GHSA-g3hv-75wg-m249), а `npm audit fix --force` «чинит» это откатом на eslint 9.39.5. Поэтому гейт аудирует **только runtime-зависимости** ([аудит](#аудит-и-обновление-зависимостей)).
- Полезные плагины (все активны в 2026): `eslint-plugin-n` 18.5 (правила для Node; `n/no-unsupported-features/*` читают `engines`), `eslint-plugin-unicorn` 78, `eslint-plugin-import-x` 4.17, `@stylistic/eslint-plugin` 5.10 (правила форматирования, вынесенные из ядра), `eslint-plugin-perfectionist`, `@eslint/markdown`, `globals` 17. С Prettier сочетайте через `eslint-config-prettier` 10.1.8 (последний релиз 2025-07) или просто не включайте правила форматирования.
- Скорость: в ESLint есть многопоточный `--concurrency` с 9.34.0 (2025-08-22; в `--help` 9.33.0 флага нет, проверено локально); медленная часть — по-прежнему type-aware линтинг.

**Ключевые выводы: Oxlint, Biome и форматеры**
- **Oxlint 1.91** (Oxc, Rust): 1.0 вышел в 2025-06. **Type-aware линтинг стабилен с 2026-07-22** через `oxlint-tsgolint@7` (построен на компиляторе TS 7 на Go): **59 из 61 type-aware правила typescript-eslint**, в 12–18 раз быстрее typescript-eslint на репозиториях vscode, typescript, typeorm и vue (M4 Pro). Запуск — `oxlint --type-aware`; `--type-check` дополнительно выводит ошибки компилятора. Конфиг — `.oxlintrc.json` или `oxlint.config.ts` с `options.typeAware`. Связка с TS 7 означает, что код на возможностях, удалённых в 6.0/7.0, нужно сначала мигрировать. Частая схема: сначала oxlint ради скорости, затем ESLint (`eslint-plugin-oxlint` отключает пересекающиеся правила) для плагинов, которых у oxlint нет.
- **Biome 2.x (2.6.5)** — один бинарник на Rust для форматирования и линтинга (JS/TS/JSX/JSON/CSS/GraphQL/HTML; 2.6 добавляет Markdown, YAML, SCSS и JS-плагины как developer preview; GritQL-плагины с 2.0). Biome 2.0 (2025-06) добавил type-aware правила на собственном выводе типов без `tsc` (например, `noFloatingPromises`), покрытие ниже, чем у typescript-eslint `[не проверено]`. Локально — `biome check --write`, в CI — `biome ci`. Подходит командам, которым важнее отсутствие настройки и скорость, чем широта плагинов.
- **Форматеры:** **Prettier 3.9.10** — выбор по умолчанию (плагины, самая широкая поддержка редакторов). **oxfmt 0.76** (бета с 2026-02-24) проходит 100% JS/TS conformance-тестов Prettier, но по умолчанию `printWidth` 100 (ставьте 80, чтобы избежать массового диффа) и до 1.0 не поддерживает плагины Prettier `[не проверено]`. **Форматер Biome** совместим с Prettier примерно на 97% `[не проверено]`. **dprint 0.64** (Rust, плагины, wasm-плагины, включая TS-плагин в стиле Prettier).
- **Правила:** один форматер; `--check` в CI, `--write` в хуках. Линтер с `--max-warnings=0` в CI (предупреждения, которые никогда не роняют сборку, гниют). Форматирование не держите в линтере. Кэш — локально (`eslint --cache`); в CI — только если ключ кэша включает конфиг и lockfile.

| Инструмент | Сильная сторона | Ограничение |
|---|---|---|
| ESLint 10 + typescript-eslint 8 | Плагины, полный набор type-aware правил | Медленный type-aware режим; peer `typescript <6.1.0` |
| Oxlint 1.91 + tsgolint | 12–18× быстрее, 59/61 type-aware правил | Меньше плагинов; привязан к TS 7 |
| Biome 2.6 | Один бинарник: формат и линт | Свой вывод типов, покрытие ниже |
| Prettier 3.9 | Стандарт форматирования, плагины | Медленнее Rust-форматеров |
| oxfmt 0.76 | Скорость, совместим с Prettier на JS/TS | До 1.0, `printWidth` 100 по умолчанию |

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [ESLint v10.0.0 released](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/) | ESLint team, 2026 | Ломающие изменения ESLint 10 |
| [Configuration files](https://eslint.org/docs/latest/use/configure/configuration-files) | ESLint team, 2026 | Flat config, `defineConfig`, `extends`, `globalIgnores` |
| [Migrate to v10.x](https://eslint.org/docs/latest/use/migrate-to-10.0.0) | ESLint team, 2026 | Руководство по миграции на v10 |
| [Typed linting](https://typescript-eslint.io/getting-started/typed-linting) | typescript-eslint team, 2026 | `projectService`, типизированные конфиги |
| [no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/) | typescript-eslint team, 2026 | Опция `allowForKnownSafeCalls` |
| [Shared configs](https://typescript-eslint.io/users/configs) | typescript-eslint team, 2026 | Пресеты strict/stylistic(TypeChecked) |
| [eslint-plugin-n](https://github.com/eslint-community/eslint-plugin-n) | eslint-community, 2026 | Правила для Node |
| [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn) | S. Sorhus, 2026 | Правила современного JS |
| [eslint-plugin-import-x](https://github.com/un-ts/eslint-plugin-import-x) | un-ts, 2026 | Поддерживаемый форк eslint-plugin-import |
| [ESLint Stylistic](https://eslint.style/) | Stylistic team, 2026 | Правила форматирования, вынесенные из ядра |
| [Oxlint usage](https://oxc.rs/docs/guide/usage/linter.html) | Oxc team, 2026 | Использование Oxlint |
| [Type-aware linting stable](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable) | camc314, Oxc, 2026 | Стабильный type-aware oxlint, бенчмарки |
| [Oxlint: type-aware](https://oxc.rs/docs/guide/usage/linter/type-aware.md) | Oxc team, 2026 | Настройка tsgolint |
| [tsgolint](https://github.com/oxc-project/tsgolint) | Oxc team, 2026 | Type-aware движок на typescript-go |
| [tsgolint and oxlint](https://www.infoq.com/news/2026/09/tsgolint-oxlint-typescript) | InfoQ, 2026 | Вторичный обзор `[не проверено]` |
| [oxfmt beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta) | Oxc team, 2026 | Бета oxfmt, совместимость с Prettier |
| [Biome blog](https://biomejs.dev/blog/) | Biome team, 2026 | Релизы Biome 2.x, включая 2.6 |
| [Migrate from ESLint and Prettier](https://biomejs.dev/guides/migrate-eslint-prettier/) | Biome team, 2026 | Переход с ESLint и Prettier |
| [Prettier docs](https://prettier.io/docs/) | Prettier team, 2026 | Опции, ignore, запуск в CI |
| [Prettier rationale](https://prettier.io/docs/rationale) | Prettier team | Почему форматер навязывает стиль |
| [dprint](https://dprint.dev/) | D. Sherret, 2026 | Плагины dprint |
| [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) | Prettier team, 2025 | Отключение конфликтующих правил |

## Git-хуки

**Ключевые выводы**
- Хуки — удобство, **гейт — это CI**: хуки пропускаются через `--no-verify`. Pre-commit держите в пределах ~5 секунд: форматирование и линтинг только staged-файлов; проверку типов и тесты — в pre-push или CI.
- **lint-staged 17.6.0** (Node `>=22.22.1`) запускает команды на staged-файлах: `{"*.{ts,js}": ["eslint --fix --max-warnings=0", "prettier --write"], "*.{json,md,yml}": "prettier --write"}`.
- **husky 9.1.7** (последний релиз 2024-11-18; репозиторий получал push в 2026-03 и не архивирован): крошечный, `"prepare": "husky"`, файлы хуков в `.husky/`. По правилу 18 месяцев застыл, но функционально завершён. Под **npm 12 / pnpm 11** скрипт `prepare` *корневого* проекта по-прежнему выполняется (блокируются только скрипты зависимостей), поэтому установка husky работает.
- **lefthook 2.2.2** (бинарник на Go, параллельные задачи, `lefthook.yml`, шаблон `{staged_files}`, удобен для монорепозиториев, lint-staged не нужен). Его npm-пакет ставит хуки через postinstall, который **под npm 12 / pnpm 11 будет заблокирован** без одобрения, поэтому выполняйте `npx lefthook install` явно или разрешите скрипт `[не проверено]`.
- **simple-git-hooks 2.14.0**: без зависимостей, конфиг в `package.json`.
- **commitlint 21** и Conventional Commits нужны, только если релизы автоматизированы (changesets, semantic-release 25, release-please 17).

```json
{
  "scripts": { "prepare": "husky" },
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{json,md,yml}": "prettier --write"
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

Проверено локально (husky 9.1.7, lint-staged 17.6.0, npm 11.13): `npm run prepare` настроил `core.hooksPath`, коммит с `no-floating-promises` в staged-файле был отклонён (`husky - pre-commit script failed (code 1)`), а неотформатированный файл закоммичен уже после `prettier --write`.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [husky](https://typicode.github.io/husky/) | typicode, 2024–2026 | Настройка husky v9 |
| [lint-staged](https://github.com/lint-staged/lint-staged) | lint-staged team, 2026 | Конфиг и изменения v17 |
| [lefthook](https://lefthook.dev/) | Evil Martians, 2026 | Документация lefthook |
| [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) | toplenboren, 2026 | Минимальные хуки |
| [commitlint](https://commitlint.js.org/) | commitlint team, 2026 | Проверка сообщений коммитов |

## Обязательные проверки качества

Минимальный гейт для Node/TS-проекта на npm. Порядок — от дешёвых и детерминированных шагов к дорогим, чтобы падать быстро. Каждая команда проверена локально на Node 24.17 (Windows 11, npm 11.13.0) и на чистом коде завершилась с кодом 0. Как гейт встроен в цикл работы агента — в [pipeline.md](pipeline.md).

| # | Шаг | Команда | Падает, когда | Проверенные оговорки |
|---|---|---|---|---|
| 1 | Установка из lockfile | `npm ci` (в CI: `NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false`) | нет lockfile; диапазон из `package.json` не удовлетворён lock; несовпадение `devEngines` | удаляет `node_modules`; ловит **не любой** дрейф; **игнорирует `min-release-age`** для закреплённых версий; печатает результаты аудита, но возвращает 0 |
| 2 | Lockfile свежий | `npm install --package-lock-only --ignore-scripts && git diff --exit-code package-lock.json` | `package.json` правили без перегенерации lock | закрывает дыру `npm ci` с поднятой транзитивной зависимостью |
| 3 | Формат | `prettier --check .` (или `biome ci`, `oxfmt --check`) | есть неотформатированные файлы | добавьте `package-lock.json` в `.prettierignore` |
| 4 | Линтинг | `eslint --max-warnings=0 .` | ошибки или любое предупреждение | ~4,5 с на 2 файла с type-aware правилами (старт project service); настройте вызовы `node:test` для `no-floating-promises` |
| 5 | Типы | `tsc --noEmit` (TS 7 через алиас) или `tsc6 --noEmit` | ошибки типов | в TS 6/7 по умолчанию `types: []`: пропишите `"types": ["node"]` |
| 6 | Тесты и покрытие | `node --test --experimental-test-coverage --test-coverage-lines=80 --test-coverage-include=src/**` | упавший тест или покрытие ниже порога | `.ts`-тесты идут без флагов; флаги порогов — Stability 1; вариант с Vitest — в [testing.md](testing.md) |
| 7 | Аудит (блокирующий) | `npm audit --omit=dev --audit-level=high` | high/critical advisory в runtime-зависимостях | полный `npm audit` упал (код 1) на 10 moderate advisories только в dev-зависимостях eslint/typescript-eslint |
| 8 | Подписи | `npm audit signatures` | неверная подпись реестра или аттестация | код 0; выводит число аттестаций |
| 9 | Неиспользуемый код (опционально) | `knip` | неиспользуемые файлы, экспорты, зависимости | код 1 при находках |
| 10 | Пакет (библиотеки) | `npm pack --dry-run`, `publint`, `attw --pack` | неверные `files`, `exports`, типы | см. [domains-client.md](domains-client.md) |

```bash
npm ci --no-audit --no-fund
npm install --package-lock-only --ignore-scripts && git diff --exit-code package-lock.json
npx prettier --check .
npx eslint --max-warnings=0 .
npx tsc --noEmit
node --test --experimental-test-coverage --test-coverage-lines=80 --test-coverage-include=src/**
npm audit --omit=dev --audit-level=high
npm audit signatures
```

**Оговорки, проверенные локально**
- **`npm ci` проходит при дрейфе через поднятую транзитивную зависимость.** Новая прямая зависимость `"ms": "2.1.3"`, которой нет в корневой записи lock, но которая уже есть в lock как транзитивная, даёт код 0. Поэтому шаг 2 обязателен.
- Матрица `npm ci`: обычный прогон — 0; нет lockfile — 1 (`EUSAGE`); дрейф диапазона — 1; новая зависимость, которой нет в lock, — 1; новая зависимость, которая есть в lock как транзитивная, — **0**.
- **`npm ci` и cooldown.** При `min-release-age=30` `npm ci` поставил закреплённый в lock eslint 10.14.0, которому было 7 дней, с кодом 0. Cooldown управляет только разрешением версий (`npm install`), а не установкой из lock.
- **`npm install` и cooldown.** Точный пин новее окна не откатывается на старую версию, а падает: `npm install -D eslint@10.14.0` при окне 30 дней → `ETARGET`, код 1.
- **`npx` и cooldown.** `min-release-age` из проектного `.npmrc` действует и на `npx`: `npx -y npm@12.2.2` упал с `ETARGET ... with a date before 03.11.2026`, потому что 12.2.2 было 2 дня. Обход — `npx -y --min-release-age=0 npm@12.2.2 --version`.
- **Коды выхода `npm audit`** — в таблице раздела [Аудит и обновление зависимостей](#аудит-и-обновление-зависимостей). Кратко: без флагов любой advisory даёт 1; `--audit-level=high` и `--omit=dev` отсекают dev-шум; `--json` логику кода выхода не меняет; `npm ci` возвращает 0 даже при уязвимостях.
- **Флаги порогов покрытия** (`--test-coverage-lines|branches|functions`, `--test-coverage-include|exclude`) всё ещё **Stability 1 - Experimental**, хотя локально отработали: 100% строк, код 0.
- Линтер упал (код 1) на двух `no-floating-promises` для `test()` и прошёл после `allowForKnownSafeCalls`.

**Как запускать**
- Локально одной командой: `npm run check` = `format:check && lint && typecheck && test` (код 0 в трёх прогонах подряд).
- **С npm 12:** добавьте `--strict-allow-scripts` к `npm ci` (или `strict-allow-scripts=true` в `.npmrc`) и закоммитьте `allowScripts`.
- **Эквиваленты для pnpm:** `pnpm install --frozen-lockfile` (или `pnpm ci`), `pnpm exec prettier --check .`, `pnpm audit --prod --audit-level high`.

**Укрепление `.npmrc`, работающее на npm 11 и 12** (проверено локально):

```ini
engine-strict=true
save-exact=true
min-release-age=3
allow-git=none
fund=false
# npm 12 only (npm 11 warns: Unknown project config "strict-allow-scripts"; npm 12 makes unknown keys fatal, so do not add npm-12-only keys to repos used with npm 11 and vice versa)
# strict-allow-scripts=true
```

Смысл комментария в шаблоне: npm 11 на неизвестный ключ только предупреждает (код 0), а npm 12 считает неизвестные ключи ошибкой. Не кладите ключи только для npm 12 в репозиторий, с которым работают на npm 11, и наоборот.

## Инциденты supply chain 2025-2026

| Когда | Инцидент | Вектор | Урок |
|---|---|---|---|
| конец 2025-08 | **s1ngularity / Nx** | Скомпрометированная публикация Nx → вредонос, который через локальные AI CLI искал секреты; украдены токены GitHub и npm | По Wiz, червь Shai-Hulud — «directly downstream» этого инцидента `[не проверено]` |
| 2025-09-08 | **chalk, debug, ansi-styles и др.** | Фишинг мейнтейнера «qix» (украден 2FA), опубликованы версии с крипто-стилером | 2FA, устойчивая к фишингу; cooldown `[не проверено]` |
| 2025-09-15/16 | **Червь Shai-Hulud** | Полезная нагрузка при установке крадёт токены и переопубликует себя в другие пакеты жертвы; оценки от 180 до 500+ пакетов | Первый самораспространяющийся червь в npm (Wiz) `[не проверено]` |
| 2025-11 | **Shai-Hulud 2.0** | То же семейство, волна крупнее | `[не проверено]` |
| 2025-09 → 2025-12-09 | **Ответ npm/GitHub** | Новые гранулярные токены с правом записи по умолчанию живут 7 дней (2025-10-10); создание классических токенов отключено, токены записи ограничены 90 днями (2025-11-05); **классические токены отозваны 2025-12-09**; `npm login` выдаёт сессионные токены на 2 часа; управление токенами из CLI | Публикуйте через trusted publishing (OIDC), а не долгоживущими токенами |
| 2026-04 | Волны червей через украденные npm-токены и postinstall-хуки; пакеты SAP в npm (конец апреля) | install-скрипты | `[не проверено]` |
| **2026-05-11** | **TanStack**: 84 версии 42 пакетов `@tanstack/*` за 6 минут; распространение на 200+ пакетов npm и PyPI, включая Mistral AI и UiPath | Workflow на `pull_request_target` выполнил код из форка → **отравление кэша GitHub Actions** (release-workflow восстановил отравленный store pnpm) → вредонос **прочитал OIDC-токен из памяти раннера** и опубликовал пакеты напрямую. Полезная нагрузка — вредоносные `optionalDependencies`, указывающие на коммит в форке, чей **скрипт `prepare`** запускал обфусцированный файл на 2,3 МБ. «No npm tokens were stolen»: публикация прошла через привязку trusted publisher. Сторонний исследователь заметил атаку через ~26 минут после первой публикации | Trusted publishing ≠ доверенный код: любой код в job с `id-token: write` может публиковать. Проверьте `pull_request_target`, не делите кэши между workflow от форков и релизными, закрепляйте actions по SHA, следите за своими публикациями, рассмотрите staged publishing |
| 2026-06-01/03 | **Волна node-gyp / binding.gyp** (по Snyk, 57 пакетов, сотни версий) | Полезная нагрузка через `binding.gyp` (неявная сборка node-gyp = install-скрипт) | npm 12 блокирует и неявные сборки `node-gyp` `[не проверено]` |
| **2026-08-04** | **ChainDrop / keyv**: 400+ npm-пакетов разных издателей (Socket/SafeDep: 1 684 версии в 420 именах) | Украденные учётные данные мейнтейнеров → **хук `preinstall`** запускает `setup.mjs` → полезная нагрузка на Bun крадёт учётные данные npm, GitHub, облаков, K8s и Vault, в том числе из памяти раннеров GitHub Actions; переопубликует себя с повышенной патч-версией, умеет публиковать через OIDC в Actions (с валидным provenance); **закрепляется, коммитя `.claude/settings.json` и `.vscode/tasks.json` в репозитории** | Меры Microsoft: **обновиться на npm CLI v12 и включить `min-release-age`**, закрепить известные хорошие версии, очистить кэши npm/yarn (особенно общие кэши CI), сменить учётные данные с чистой машины, пересмотреть области токенов, одобрения workflow, защищённые окружения и provenance, пересобрать раннеры и базовые образы. Плюс: на ревью смотрите конфиги AI-агентов и редакторов в PR |

**Общие закономерности**
1. Полезная нагрузка срабатывает **при установке** (pre/post-install, `prepare` git-зависимостей, `binding.gyp`). Блокировка скриптов зависимостей убирает самый частый триггер, хотя критики замечают, что нагрузка может переехать во время импорта `[не проверено]`.
2. Вредоносные версии **живут минуты или часы**, поэтому **cooldown в несколько дней** отсекает большинство из них.
3. Атакующие публикуют **патч-версии**: диапазоны `^` вместе с `npm install` в CI их подхватывают, замороженный lockfile — нет.
4. **Цель — CI** (токены, OIDC, кэши), поэтому workflow с минимальными правами важны не меньше гигиены зависимостей.
5. **Provenance доказывает, где пакет собран, но не то, что сборка была безвредной.**

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [TanStack npm supply chain compromise postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem) | T. Linsley, 2026 | Первичный разбор: отравление кэша и кража OIDC-токена |
| [ChainDrop supply chain compromise](https://www.microsoft.com/en-us/security/blog/2026/08/04/chaindrop-supply-chain-compromise-anatomy-self-propagating-worm/) | Microsoft Threat Intelligence, 2026 | Анатомия ChainDrop и меры защиты |
| [npm worm compromises popular npm packages](https://securitylabs.datadoghq.com/articles/npm-worm-compromises-popular-npm-packages/) | Datadog Security Labs, 2026 | Анализ ChainDrop `[не проверено]` |
| [keyv and friends compromised](https://www.aikido.dev/blog/keyv-and-friends-compromised-in-npm-supply-chain-attack) | Aikido, 2026 | Список пакетов волны keyv `[не проверено]` |
| [keyv-linked npm worm](https://thehackernews.com/2026/08/keyv-linked-npm-worm-poisons-hundreds.html) | The Hacker News, 2026 | Закрепление через хуки Claude Code и VS Code `[не проверено]` |
| [CSA advisory AD-2026-009](https://www.csa.gov.sg/alerts-and-advisories/advisories/ad-2026-009/) | CSA Singapore, 2026 | Государственное предупреждение о волне keyv `[не проверено]` |
| [node-gyp supply chain compromise](https://snyk.io/blog/node-gyp-supply-chain-compromise-self-propagating-npm-worm-binding-gyp/) | Snyk, 2026 | Волна через binding.gyp `[не проверено]` |
| [TanStack npm supply chain worm](https://orca.security/resources/blog/tanstack-npm-supply-chain-worm/) | Orca Security, 2026 | Распространение червя TanStack на PyPI `[не проверено]` |
| [Self-propagating supply chain worm](https://thehackernews.com/2026/04/self-propagating-supply-chain-worm.html) | The Hacker News, 2026 | Волна червя в апреле 2026 `[не проверено]` |
| [Shai-Hulud npm supply chain attack](https://www.wiz.io/blog/shai-hulud-npm-supply-chain-attack) | Wiz Research, 2025 | Анализ Shai-Hulud, связь с s1ngularity `[не проверено]` |
| [Bugs in Shai-Hulud](https://www.aikido.dev/blog/bugs-in-shai-hulud-debugging-the-desert) | Aikido, 2025 | Устройство червя `[не проверено]` |
| [Strengthening npm security](https://github.blog/changelog/2025-09-29-strengthening-npm-security-important-changes-to-authentication-and-token-management/) | GitHub, 2025 | План ужесточения токенов npm `[не проверено]` |
| [Classic token creation disabled](https://github.blog/changelog/2025-11-05-npm-security-update-classic-token-creation-disabled-and-granular-token-changes/) | GitHub, 2025 | Отключение создания классических токенов `[не проверено]` |
| [Classic tokens revoked](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/) | GitHub, 2025 | Отзыв классических токенов, сессионная аутентификация `[не проверено]` |

## Защита supply chain: потребитель и издатель

**Ключевые выводы: потребитель (любой проект)**
1. **В CI только замороженные установки:** `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`; плюс проверка свежести lock из [обязательных проверок](#обязательные-проверки-качества).
2. **Блокируйте install-скрипты зависимостей.** npm 12 — по умолчанию, плюс `--strict-allow-scripts` в CI и просмотренный `allowScripts`. npm 11 — `ignore-scripts=true` в `.npmrc`, нужное запускайте явно (`npm rebuild <pkg>`); учтите, что `ignore-scripts` пропускает и ваши собственные `pre*/post*` скрипты. pnpm 11+ — `strictDepBuilds` + `allowBuilds` (по умолчанию). Bun — `trustedDependencies`. Для npm до 12 allow-list дают `@lavamoat/allow-scripts` (5.1.0) или `can-i-ignore-scripts` `[не проверено]`.
3. **Cooldown:** npm `min-release-age=3` (в днях, npm ≥11.x, проверено локально) в `.npmrc`; pnpm `minimumReleaseAge` (в pnpm 11 по умолчанию 1440 минут; поднимите, например, до 4320); Yarn 4 `npmMinimalAgeGate` `[не проверено]`; Renovate `minimumReleaseAge: "3 days"`; Dependabot `cooldown: {default-days: 3}` (только для обновлений версий; security-обновления его обходят, и это правильно).
4. **Запретите git- и URL-зависимости:** в npm 12 по умолчанию `allow-git=none`, `allow-remote=none`; в pnpm 11 `blockExoticSubdeps: true`. На npm 11 выставьте `allow-git=root` или `none`.
5. **Аудит:** `npm audit --omit=dev --audit-level=high` как блокирующий гейт, `npm audit signatures` для проверки подписей реестра и аттестаций provenance (проверено локально: «103 packages have verified registry signatures; 31 packages have verified attestations», код 0).
6. **Поведенческое сканирование** (ловит вредонос, у которого ещё нет CVE): Socket (`@socketsecurity/cli` 1.14, GitHub-приложение), Socket Firewall `sfw` 2.0.6 (обёртка над `npm install`), Aikido `safe-chain` 1.5.25, Snyk, `npq`. Для многоязычных репозиториев — OSV-Scanner. На PR — `actions/dependency-review-action` v5.0.0.
7. **Гигиена приватного реестра:** scoped-реестры в `.npmrc` (`@acme:registry=...`), никаких внутренних имён без scope (dependency confusion), `lockfile-lint --allowed-hosts`.
8. **Секреты на машинах разработчиков и в CI:** нигде нет долгоживущих npm-токенов с правом записи; для приватных установок — токен только на чтение; никогда не ставьте зависимости в job, где лежат учётные данные деплоя; после инцидента чистите кэши.
9. **Внимательно ревьюйте PR, которые трогают** скрипты в `package.json`, lockfile, `.github/workflows/*`, `.npmrc`, `.claude/`, `.vscode/tasks.json` (пути закрепления ChainDrop).

**Ключевые выводы: издатель (всё, что публикуется в npm)**
1. **Trusted publishing (OIDC):** npm CLI **≥ 11.5.1** и Node **≥ 22.14.0**; GitHub Actions (только GitHub-hosted раннеры), shared-раннеры GitLab.com, CircleCI cloud. Workflow нужен `permissions: id-token: write`. **Provenance создаётся автоматически** для публичных пакетов из публичных репозиториев на GitHub и GitLab (не на CircleCI и не для приватных репозиториев). `repository.url` в `package.json` должен совпадать точно. Управление dist-tag через OIDC требует CLI 11.21.0+ / 12.2.0+. До 10 trusted publishers на пакет. Новая конфигурация trusted publisher истекает, если не использована 2 дня.
2. После включения выставьте в настройках публикации пакета **«Require two-factor authentication and disallow tokens»**.
3. **Staged publishing** (`npm stage publish`: мейнтейнер одобряет версию с 2FA, прежде чем она станет публичной) отвечает на урок TanStack «у OIDC нет ревью каждой публикации». Описано в документации, в этой работе не запускалось.
4. Привяжите trusted publisher к GitHub **environment** с обязательными ревьюерами; `id-token: write` — только у job публикации; сборка — в отдельном job без этого права; в job публикации никогда не восстанавливайте кэши; никогда не используйте `pull_request_target` с checkout кода из PR.
5. Закрепите каждый action по SHA (`uses: actions/checkout@<40-символьный sha> # v7.0.1`), ставьте `persist-credentials: false`, проверяйте workflow через **zizmor** (`zizmorcore/zizmor-action` v0.8.1).
6. Мало мейнтейнеров с правом публикации, у всех — 2FA, устойчивая к фишингу (WebAuthn).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Trusted publishers](https://docs.npmjs.com/trusted-publishers) | npm/GitHub, 2026 | Требования OIDC trusted publishing, staged publishing |
| [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements) | npm/GitHub, 2026 | Детали provenance |
| [npm audit](https://docs.npmjs.com/cli/v12/commands/npm-audit) | npm/GitHub, 2026 | `npm audit`, `--audit-level`, `--omit`, `audit signatures`, коды выхода |
| [Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference) | GitHub, 2026 | `cooldown`, `groups` в Dependabot |
| [Renovate: minimumReleaseAge](https://docs.renovatebot.com/configuration-options/#minimumreleaseage) | Mend, 2026 | Cooldown в Renovate |
| [Renovate: security presets](https://docs.renovatebot.com/presets-security/) | Mend, 2026 | Пресеты безопасности |
| [Socket CLI](https://docs.socket.dev/docs/socket-cli) | Socket, 2026 | Socket CLI и `sfw` |
| [safe-chain](https://github.com/AikidoSec/safe-chain) | Aikido, 2026 | Обёртка, блокирующая вредонос при установке |
| [@lavamoat/allow-scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts) | LavaMoat (MetaMask), 2026 | Allow-list install-скриптов для npm до 12 |
| [OSV-Scanner](https://google.github.io/osv-scanner/) | Google, 2026 | Сканер уязвимостей для многих языков |
| [dependency-review-action](https://github.com/actions/dependency-review-action) | GitHub, 2026 | Блокировка уязвимых зависимостей в PR (v5.0.0) |
| [zizmor](https://docs.zizmor.sh/) | W. Woodruff, 2026 | Статический анализ GitHub Actions |
| [Preventing pwn requests](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/) | GitHub Security Lab, 2021 | Почему `pull_request_target` + checkout опасны |
| [Node.js best practices: security](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices) | Y. Goldberg et al., 2024–2026 | Список практик безопасности для Node |
| [NPM Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html) | OWASP, 2025 | Шпаргалка по безопасности npm |
| [npm-security-best-practices](https://github.com/lirantal/npm-security-best-practices) | L. Tal, 2025–2026 | Практичный чеклист безопасности npm |

## Аудит и обновление зависимостей

**Ключевые выводы**
- **Коды выхода `npm audit`** (проверено локально на npm 11.13; в проекте 10 moderate advisories, все в devDependencies):

| Команда | Код выхода |
|---|---|
| `npm audit` | 1 (любой advisory, порог по умолчанию — `low`) |
| `npm audit --audit-level=moderate` | 1 |
| `npm audit --audit-level=high` | 0 |
| `npm audit --audit-level=critical` | 0 |
| `npm audit --omit=dev` | 0 (advisories были только в dev) |
| `npm audit --json` | 1 (JSON не меняет логику кода выхода; `metadata.vulnerabilities` = `{"moderate":10,...}`) |
| `npm audit signatures` | 0 («103 packages have verified registry signatures», «31 packages have verified attestations») |
| `npm ci` (запускает аудит в конце) | 0 даже при уязвимостях |

- **Рекомендуемый блокирующий аудит:** `npm audit --omit=dev --audit-level=high`. Advisories в dev-инструментах (обычно ReDoS в glob-матчинге при линтинге) редко важны в рантайме, а их «исправление» часто означает ломающий откат (`npm audit fix --force` хотел eslint 9.39.5). Полный `npm audit` запускайте неблокирующим шагом для видимости. Никогда не запускайте `npm audit fix --force` в CI.
- У `npm audit` нет встроенного списка игнорирования. Варианты: `overrides` (npm) или `overrides` в `pnpm-workspace.yaml` (раньше `pnpm.overrides`) для принудительной исправленной транзитивной версии; pnpm `auditConfig.ignoreGhsas`; `audit-ci` (7.1.0, **2024-07, застыл**) или `better-npm-audit` (**2024-09, застыл**) для allow-list. Предпочитайте `overrides`, у каждого из которых записаны GHSA и дата удаления.

```json
{
  "overrides": {
    "minimatch": "<первая исправленная версия из GHSA>"
  }
}
```

JSON не допускает комментариев, поэтому GHSA и дату удаления override записывайте рядом: в описании PR, в `README` или в трекере.

- **Боты обновлений:**
  - **Renovate** (44.221, Mend, очень активен): группировка, `minimumReleaseAge`, `lockFileMaintenance`, `rangeStrategy: "pin"` для приложений, `postUpdateOptions`, поддержка catalogs в pnpm, Yarn и Bun. Начните с `config:recommended` + `:semanticCommits` + `security:minimumReleaseAgeNpm` (пресет есть в исходниках Renovate, `lib/config/presets/internal/security.preset.ts`: `minimumReleaseAge: "3 days"` для датасорса npm; аналоги — `security:minimumReleaseAgePypi`, `security:minimumReleaseAgeCrate`).
  - **Dependabot**: `package-ecosystem: "npm"` (покрывает и lockfile Yarn и pnpm), `groups`, `cooldown` (`default-days` по умолчанию 3, если блок задан; действует только на обновления версий). Проще и встроен в GitHub, группировка слабее. Шаблон — в [шаблонах](#шаблоны).
  - Интерактивно: `npx npm-check-updates -i` (23.1), `npx taze` (21.3), `npm outdated` (возвращает 1, если что-то устарело, проверено локально).
- **Версии:** приложения закрепляют точные версии (`save-exact=true`) или полагаются на lockfile и бота; библиотеки используют диапазоны `^` для зависимостей и время от времени тестируются на минимальных поддерживаемых версиях.

Стартовый `renovate.json` (проходит JSON-схему `renovate-schema.json`; пресет уже ставит 3 дня для npm, общий `minimumReleaseAge` распространяет окно на остальные датасорсы, например GitHub Actions):

```json
{
  "extends": ["config:recommended", ":semanticCommits", "security:minimumReleaseAgeNpm"],
  "minimumReleaseAge": "3 days",
  "lockFileMaintenance": { "enabled": true }
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [npm overrides](https://docs.npmjs.com/cli/v12/configuring-npm/package-json#overrides) | npm/GitHub, 2026 | `overrides` для исправления транзитивных зависимостей |
| [Renovate docs](https://docs.renovatebot.com/) | Mend, 2026 | Конфигурация Renovate |
| [Renovate: config presets](https://docs.renovatebot.com/presets-config/) | Mend, 2026 | `config:recommended` |
| [Dependabot](https://docs.github.com/en/code-security/dependabot) | GitHub, 2026 | Настройка Dependabot |
| [npm-check-updates](https://github.com/raineorshine/npm-check-updates) | R. Orshine, 2026 | Интерактивные обновления |
| [taze](https://github.com/antfu-collective/taze) | A. Fu, 2026 | Обновления с учётом монорепозитория |
| [audit-ci](https://github.com/IBM/audit-ci) | IBM, 2024 | Allow-list для аудита (застыл) |

## Неиспользуемый код и гигиена зависимостей

**Ключевые выводы**
- **knip 6.44** находит неиспользуемые файлы, экспорты, типы, dependencies, devDependencies и бинарники; знает плагины ESLint, Vitest, TS и других инструментов. Проверено локально: неиспользуемый `src/dead.ts` дал `Unused files (1) src/dead.ts` и код 1 без всякого конфига.
- **depcheck 1.4.7 (2023-10) заброшен** `[устарело: → knip]`. **ts-prune** архивирован и отсылает к knip `[не проверено]`.
- **madge 8.0.0 (2024-08) застыл** для поиска циклов `[устарело: → dependency-cruiser 18.7]` (циклы и правила слоёв, см. [architecture.md](architecture.md)). dependency-cruiser 18.7 не работает с одним `typescript@7`: проходит 0 модулей, печатает предупреждение `missing-typescript-transpiler` и завершается с кодом 0 (проверено локально). Нужен TS 6 рядом — тот же alias, что для typescript-eslint.
- **Раздутость и дубликаты:** `npm ls <pkg>` / `npm explain <pkg>`, `npm dedupe`, `npx node-modules-inspector` (antfu) `[не проверено]`, `pnpm why`. Сообщество e18e ведёт список более лёгких замен для частых зависимостей (`module-replacements`).

```bash
npx knip                      # код 1 при находках
npx knip --production         # только код, который попадает в продакшен
npm explain minimatch         # почему пакет в дереве
npm dedupe                    # схлопнуть дубликаты в дереве
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [knip](https://knip.dev/) | L. Kunst (webpro), 2026 | Неиспользуемые файлы, экспорты, зависимости (проверено локально) |
| [depcheck](https://github.com/depcheck/depcheck) | depcheck, 2023 | Исторический поиск неиспользуемых зависимостей `[устарело: → knip]` |
| [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) | S. Verweij, 2026 | Правила зависимостей и циклы |
| [e18e](https://e18e.dev/) | e18e community, 2026 | Производительность экосистемы, более лёгкие зависимости |
| [module-replacements](https://github.com/es-tooling/module-replacements) | es-tooling / e18e, 2026 | Лёгкие замены для частых зависимостей |

## Флаги рантайма: env-файлы, модель разрешений, watch

**Ключевые выводы: `--env-file`**
- **`--env-file=.env`** (с 20.6; **не экспериментальный с 24.10 / 22.21**) и **`--env-file-if-exists`** (с 22.9, стабилен в тех же релизах). Поддерживаются комментарии и многострочные значения в кавычках. Для кода — `process.loadEnvFile(path)` и `util.parseEnv(str)`.
- Проверено локально на 24.17: многострочное значение разобрано; `--env-file-if-exists=missing.env` вывел «missing.env not found. Continuing without it.» и продолжил; `--env-file=missing.env` вывел «not found» и скрипт не запустил.
- Ссылки `${VAR}` не раскрываются, и уже заданные переменные окружения по умолчанию не перезаписываются `[не проверено]`.
- `dotenv` оставляйте только для старых рантаймов. Переменные окружения проверяйте схемой при старте (см. [architecture.md](architecture.md)).

```bash
node --env-file-if-exists=.env --watch src/server.ts
```

```ts
import { parseEnv } from "node:util";
process.loadEnvFile(".env.test");                  // бросает, если файла нет
const extra = parseEnv("A=1\nB=\"multi\nline\"");   // { A: "1", B: "multi\nline" }
```

**Ключевые выводы: модель разрешений**
- `--permission` — **stable с 23.5 / 22.13** (раньше `--experimental-permission`). Запрещает файловую систему, дочерние процессы, worker, нативные аддоны и WASI, пока не выдано разрешение: `--allow-fs-read=<path>`, `--allow-fs-write=<path>`, `--allow-child-process`, `--allow-worker`, `--allow-addons`, `--allow-wasi`.
- **`--allow-net` появился в 25.0** (stability 1.1), поэтому на 24.x сеть **не** ограничивается. Проверено локально на 24.17: `fetch()` под `--permission` вернул 200; чтение файла без `--allow-fs-read` и `execSync` бросили `ERR_ACCESS_DENIED`.
- Проверка в рантайме: `process.permission.has('fs.write')`. Точка входа читается неявно с 24.2 / 22.17.
- Это ремень безопасности для **доверенного** кода (ограничить ущерб от скомпрометированной зависимости в рантайме, запускать скрипты с минимальными правами), а не песочница для недоверенного кода. Симлинки и уже открытые дескрипторы — задокументированные оговорки `[не проверено]`. Используйте в тестах и CI для CLI-инструментов; в продакшене — только после проверки совместимости.

```bash
node --permission --allow-fs-read=./data --allow-fs-write=./out scripts/convert.ts
node --permission -e "console.log(process.permission.has('fs.write'))"   # false
```

**Ключевые выводы: watch, config-файл, сертификаты**
- **`--watch` / `--watch-path`** (stable с 22.0 / 20.13; `--watch-path` только на macOS и Windows) заменяют nodemon в большинстве dev-циклов: `node --watch --env-file-if-exists=.env src/server.ts`. nodemon 3.1.14 по-прежнему поддерживается.
- **`--run`** и **`--config-file`** (`node.config.json`, stable с 26.12) — в [полях package.json](#поля-packagejson); флаги **`--test`** — в [testing.md](testing.md). Флаги порогов покрытия (`--test-coverage-lines|branches|functions`, `--test-coverage-include|exclude`) всё ещё **Stability 1 - Experimental**, хотя локально работают.
- **`--use-system-ca`** / `NODE_USE_SYSTEM_CA=1` (24.6 / 22.19) — для корпоративного перехвата TLS вместо `NODE_TLS_REJECT_UNAUTHORIZED=0`.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js: Permissions](https://nodejs.org/api/permissions.html) | Node.js, 2026 | Семантика модели разрешений и оговорки |
| [Node.js: Environment variables](https://nodejs.org/api/environment_variables.html) | Node.js, 2026 | Формат `.env`, `loadEnvFile`, `parseEnv` |
| [How to read environment variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs) | Node.js | Learn-руководство по переменным окружения |
| [Node.js permission model](https://blog.rafaelgss.dev/node-js-permission-model) | R. Gonzaga, 2023–2025 | Устройство модели разрешений от её автора; 6 ноября 2026 сайт отвечал 502 `[не проверено]` |

Флаги с историей версий — в [Node.js CLI](https://nodejs.org/api/cli.html) (ссылка в [полях package.json](#поля-packagejson)).

## CI на GitHub Actions

**Ключевые выводы**
- CI — единственный настоящий гейт. Шаги и их порядок — из [обязательных проверок](#обязательные-проверки-качества); готовые workflow — в [шаблонах](#шаблоны).
- Top-level `permissions: contents: read`, `persist-credentials: false` у checkout, все actions закреплены по SHA с комментарием версии, `concurrency` с `cancel-in-progress`.
- В CI не нужен менеджер версий: `actions/setup-node` v7 с `node-version-file: .node-version` для основных job и явная матрица для тестов.
- Матрица: 22, 24, 26 на Linux плюс 26 на Windows и macOS. 22 держите, пока поддерживаете его (до 2027-04-30); при `engines >=24.11` убирайте. Для библиотек — неблокирующий job на 27 Alpha (`continue-on-error: true`).
- setup-node v7 кэширует npm автоматически, только если `packageManager` или `devEngines.packageManager` называют npm. Явный `cache: npm` понятнее. В job аудита и в релизном пути кэш отключён намеренно (`package-manager-cache: false`), это урок TanStack.
- Job аудита ставит зависимости с `--ignore-scripts`: для аудита и проверки подписей скрипты не нужны.
- Для PR добавьте `zizmorcore/zizmor-action` и `actions/dependency-review-action`. Ограничение исходящего трафика раннеров даёт `step-security/harden-runner` (v2.22.3). pnpm в CI ставится через `pnpm/action-setup` (v6.1.1).
- Проверка workflow локально: `zizmor --offline .github/workflows/` и `check-jsonschema --builtin-schema vendor.github-workflows .github/workflows/*.yml`.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) | GitHub, 2026 | Закрепление, права, `pull_request_target` |
| [Building and testing Node.js](https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs) | GitHub, 2026 | Официальное руководство по CI для Node |
| [actions/checkout](https://github.com/actions/checkout) | GitHub, 2026 | v7.0.1 |
| [actions/upload-artifact](https://github.com/actions/upload-artifact) | GitHub, 2026 | v7.0.2 |
| [actions/download-artifact](https://github.com/actions/download-artifact) | GitHub, 2026 | v8.0.2 |
| [zizmor-action](https://github.com/zizmorcore/zizmor-action) | zizmor, 2026 | v0.8.1 |
| [harden-runner](https://github.com/step-security/harden-runner) | StepSecurity, 2026 | Контроль исходящего трафика раннеров (v2.22.3) |
| [pnpm/action-setup](https://github.com/pnpm/action-setup) | pnpm, 2026 | pnpm в CI (v6.1.1) |
| [check-jsonschema](https://github.com/python-jsonschema/check-jsonschema) | S. Rosen, 2026 | Проверка workflow по схеме (проверено локально) |

## Шаблоны

Все шаблоны использовались вместе в одном демо-проекте: `npm ci`, `npm run check` и `npm audit --omit=dev --audit-level=high` завершились с кодом 0. Workflow прошли `zizmor` 1.32.0 (`--offline`, без находок в профиле по умолчанию; в режиме auditor — только педантичные «help»-пункты) и `check-jsonschema --builtin-schema vendor.github-workflows`. **На GitHub они не запускались.** SHA actions взяты из GitHub API 6 ноября 2026; повторная проверка в тот же день: каждый SHA совпадает со своим тегом, это последние релизы, все использованные inputs (`persist-credentials`, `node-version-file`, `cache`, `package-manager-cache`, `registry-url`, `name`, `path`) есть в `action.yml` на этих SHA, а workflow проходят схему SchemaStore `github-workflow.json`.

### `package.json` (приложение или внутренний пакет; Node 24.11+/26, ESM, нативный TS)

```json
{
  "name": "demo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24.11" },
  "devEngines": {
    "runtime": { "name": "node", "version": ">=24.11", "onFail": "error" },
    "packageManager": { "name": "npm", "version": ">=11.5.1", "onFail": "warn" }
  },
  "imports": { "#src/*": "./src/*" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint --max-warnings=0 .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "node --test",
    "test:coverage": "node --test --experimental-test-coverage --test-coverage-lines=80 --test-coverage-include=src/**",
    "check": "npm run format:check && npm run lint && npm run typecheck && npm test"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@types/node": "24.19.2",
    "@typescript/native": "npm:typescript@7.0.2",
    "eslint": "10.14.0",
    "globals": "17.13.0",
    "prettier": "3.9.10",
    "typescript": "npm:@typescript/typescript6@6.0.2",
    "typescript-eslint": "8.72.1"
  }
}
```

- `typescript` указывает через алиас на пакет с API 6.0, чтобы работал typescript-eslint; `@typescript/native` даёт `tsc` из TS 7 (в проверке именно он занял `.bin/tsc`).
- Без type-aware линтинга используйте просто `"typescript": "7.0.2"`.
- `@types/node` совпадает с минимальным поддерживаемым рантаймом (здесь `24.x`; для проекта только на Node 26 — `26.x`).
- Запись `imports` демо-кодом не проверялась.

### `tsconfig.json` (без эмита; `.ts` запускается напрямую Node)

```json
{
  "compilerOptions": {
    "target": "es2024",
    "lib": ["es2024"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "types": ["node"],
    "rootDir": ".",
    "outDir": "dist",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "rewriteRelativeImportExtensions": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": true,
    "noEmit": true
  },
  "include": ["src", "test", "*.ts"]
}
```

- `es2024` безопасен для Node 22+ (на 24+ поднимайте до `es2025`, если нужны его библиотечные типы).
- Для сборки уберите `noEmit` и `allowImportingTsExtensions` в `tsconfig.build.json` и оставьте `rewriteRelativeImportExtensions`.
- Обоснование флагов глубже (`isolatedDeclarations`, компромиссы `exactOptionalPropertyTypes`) — в [typescript.md](typescript.md). Проверено на TS 7.0.2 и 6.0.3, оба кода 0.

### `eslint.config.js` (flat config ESLint 10, type-aware)

```js
// @ts-check
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["dist/", "coverage/"]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          allowForKnownSafeCalls: [
            { from: "package", package: "node:test", name: ["test", "it", "describe", "suite"] },
          ],
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
```

Правила для Node добавляет `eslint-plugin-n` (`n.configs["flat/recommended-module"]`); в проверенный прогон он не входил.

### `.npmrc` (npm 11 и 12)

```ini
engine-strict=true
save-exact=true
min-release-age=3
allow-git=none
fund=false
# npm 12 only (npm 11 warns: Unknown project config "strict-allow-scripts"; npm 12 makes unknown keys fatal, so do not add npm-12-only keys to repos used with npm 11 and vice versa)
# strict-allow-scripts=true
```

Оговорки по cooldown (`npx`, точные пины, `npm ci`) — в [обязательных проверках](#обязательные-проверки-качества).

### `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
env:
  FORCE_COLOR: "1"
  NPM_CONFIG_FUND: "false"
  NPM_CONFIG_AUDIT: "false"
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - name: Lockfile is up to date
        run: npm install --package-lock-only --ignore-scripts && git diff --exit-code package-lock.json
      - run: npm run format:check
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
  test:
    needs: check
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest]
        node: ["22", "24", "26"]
        include:
          - { os: windows-latest, node: "26" }
          - { os: macos-latest, node: "26" }
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version-file: .node-version
          package-manager-cache: false
      - run: npm ci --ignore-scripts
      - run: npm audit --omit=dev --audit-level=high
      - run: npm audit signatures
      - name: Full audit (informational)
        run: npm audit || true
```

- `.node-version` содержит `26`.
- Матрица оставляет 22, потому что он поддерживается до 2027-04-30; при `engines >=24.11`, как в шаблоне `package.json`, уберите `"22"`.
- Для библиотек добавьте неблокирующий job на 27 Alpha (`continue-on-error: true`).
- По желанию добавьте `zizmorcore/zizmor-action@45d7276c9ca790aabd705e31ca99c6185c3e76dd # v0.8.1` и `actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294 # v5.0.0` (на `pull_request`).

### `.github/workflows/publish.yml` (trusted publishing, сборка и публикация разделены)

```yaml
name: Publish
on:
  release:
    types: [published]
permissions: {}
jobs:
  build:
    name: Build package
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version-file: .node-version
          package-manager-cache: false
      - run: npm ci --ignore-scripts
      - run: npm run build --if-present
      - run: npm pack
      - uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: package
          path: "*.tgz"
  publish:
    name: Publish to npm
    needs: build
    runs-on: ubuntu-latest
    environment: npm            # add required reviewers; bind the npm trusted publisher to this environment
    permissions:
      id-token: write           # only this job can mint the OIDC token
    steps:
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: "26"    # bundles npm 11.20 (>= 11.5.1 needed for trusted publishing)
          registry-url: "https://registry.npmjs.org"
          package-manager-cache: false
      - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
        with:
          name: package
      - run: npm publish ./*.tgz --access public
```

- В релизном пути нет кэшей (урок TanStack); job публикации не делает checkout и не выполняет код проекта.
- С trusted publishing provenance для публичных репозиториев создаётся автоматически.
- Для пакетов с высокой ценностью рассмотрите `npm stage publish` с одобрением через 2FA вместо `npm publish`.

### `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    cooldown: { default-days: 3, semver-major-days: 7 }
    groups:
      dev-tooling:
        dependency-type: development
        update-types: [minor, patch]
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
    cooldown: { default-days: 3 }
```

Ключи взяты из справочника опций Dependabot; файл проходит схему SchemaStore `dependabot-2.0.json` (проверено локально через Ajv).

## Чеклист ревью инструментария

- [ ] Рантайм: нижняя граница `engines.node` — поддерживаемая линия (сегодня ≥22.12, после 2027-04-30 ≥24); `.node-version`/`.nvmrc` и `devEngines.runtime` согласованы; матрица CI покрывает нижнюю границу и Node 26.
- [ ] Ровно один lockfile, закоммичен, `lockfileVersion: 3` (npm); CI использует `npm ci`/`--frozen-lockfile`; есть проверка свежести lock.
- [ ] В CI нет `npm install` и `npx <без версии>`; инструменты приходят из devDependencies.
- [ ] Install-скрипты зависимостей заблокированы (npm 12 `allowScripts` + `--strict-allow-scripts`, pnpm `allowBuilds` или `ignore-scripts=true`); у каждой разрешённой записи есть причина.
- [ ] Cooldown настроен (`min-release-age`, `minimumReleaseAge`, cooldown бота); security-обновления проходят.
- [ ] `allow-git=none` (или pnpm `blockExoticSubdeps`); нет `git+`/tarball-зависимостей без ревью.
- [ ] Блокирующий аудит — `--omit=dev --audit-level=high`; `npm audit signatures` запускается; у `overrides` записаны GHSA и дата удаления.
- [ ] `"type": "module"`, у пакетов определён `exports`, вместо `paths` из tsconfig — `#imports`.
- [ ] tsconfig: `module`/`moduleResolution: nodenext`, `verbatimModuleSyntax`, `erasableSyntaxOnly` (если `.ts` запускается напрямую), `types: ["node"]`, нет `baseUrl`/`node10`/`es5`/`outFile` (удалены в TS 7).
- [ ] Стратегия версий TypeScript явная: TS 7 для `tsc`, API 6.0 для инструментов, которые импортируют `typescript` (peer typescript-eslint `<6.1.0`).
- [ ] ESLint на flat config (eslintrc удалён в v10); type-aware правила включены; `--max-warnings=0`; форматер отдельно и проверяется через `--check`.
- [ ] В цепочке нет заброшенных инструментов: ts-node, depcheck, tsup, Volta, Yarn classic, madge, audit-ci → замены в [таблице версий](#версии-на-ноябрь-2026) и [антипаттернах](#антипаттерны).
- [ ] Workflow: top-level `permissions: contents: read`; `persist-credentials: false`; actions закреплены по SHA; нет `pull_request_target`, который выполняет код PR; нет восстановления кэша в релизных job; zizmor чист.
- [ ] Публикация: trusted publishing, токены запрещены, `id-token: write` только у job публикации, environment с ревьюерами, provenance включён.
- [ ] Хуки — необязательное ускорение; CI повторяет каждую проверку.
- [ ] Патч Node включает последний security-релиз (записи `security: true` в `index.json`).
- [ ] PR, меняющие `.claude/`, `.vscode/tasks.json`, `.npmrc`, workflow или скрипты в `package.json`, получили отдельное внимание на ревью.

## Антипаттерны

- `npm install` в CI или Dockerfile: переписывает lock и подхватывает свежие, возможно вредоносные, патч-версии → `npm ci`.
- Закоммичены `package-lock.json` *и* `pnpm-lock.yaml`/`yarn.lock` → один пакетный менеджер, закреплённый через `devEngines.packageManager` или `packageManager`.
- `npm audit fix --force` в CI или по рефлексу: в проверке он применил мажорный откат → точечные `overrides`.
- Блокировать merge из-за moderate advisories только в dev-зависимостях → аудит runtime-зависимостей на уровне `high`.
- Лоадеры `ts-node` / `ts-node/esm` в 2026 `[устарело]` → встроенный type stripping или tsx.
- `--experimental-transform-types`, чтобы enum продолжали работать → флаг удалён в Node 26; переделайте enum в объекты `as const`.
- `paths` из tsconfig плюс хаки алиасов в рантайме (`module-alias`, `tsconfig-paths`) → `package.json#imports`.
- `.eslintrc.*` / `.eslintignore` `[устарело]` → flat config (ESLint 10 их игнорирует).
- Поставить `typescript@7` вместе с typescript-eslint и заглушить ERESOLVE через `--legacy-peer-deps` → type-aware правила сломаются в рантайме; используйте алиас на 6.0.
- Долгоживущие секреты `NPM_TOKEN` для публикации → trusted publishing (классические токены и так отозваны с 2025-12-09).
- Один workflow, который и выполняет код PR, и публикует, или делит кэши с релизными job → разделить, в релизном пути без кэшей.
- Плавающие теги actions (`@v7`, `@main`) → полный SHA и комментарий с версией.
- Хуки (husky) как единственный гейт → гейт — CI.
- Volta, Yarn classic, depcheck, tsup в новых проектах → mise/fnm, Yarn 4 или pnpm, knip, tsdown.
- Отключать проверку TLS (`NODE_TLS_REJECT_UNAUTHORIZED=0`) ради корпоративного прокси → `--use-system-ca`.
- Принимать в PR новые файлы `.claude/settings.json` или `.vscode/tasks.json` без чтения → так закреплялся ChainDrop.

## Спорные места

1. **Блокировка install-скриптов в npm 12.** Сторонники (Semgrep: «RIP post/preinstall scripts») говорят, что она убирает триггер, которым пользовались Shai-Hulud, ChainDrop и TanStack. Критики (Checkmarx) говорят, что полезная нагрузка переедет во время импорта или в `bin`-шимы, а усталость от одобрений приведёт к `approve --all` `[не проверено]`. Правы обе стороны: блокируйте скрипты **и** держите cooldown и поведенческое сканирование.
2. **Длина cooldown.** pnpm по умолчанию — 1 день, Dependabot — 3, Microsoft советует `min-release-age` без числа. Длинное окно задерживает исправления безопасности при прямой установке (боты освобождают security-обновления от cooldown). Обычный компромисс — 3–7 дней. `npm ci` окно игнорирует, поэтому оно управляет только разрешением версий (проверено локально).
3. **Trusted publishing против токенов после TanStack.** OIDC убирает долгоживущие токены, которые можно украсть, но не даёт ревью каждой публикации, а вредонос внутри job может сам получить токен. TanStack рассматривал возврат к короткоживущим токенам с ручным ревью; ответ npm — staged publishing с одобрением через 2FA. Рекомендация: OIDC + ревьюеры environment + staged publishing для пакетов с большим охватом.
4. **TS 7 сейчас или позже.** Ускорение `tsc` большое (заявлено 8–12×), но экосистема, которая импортирует `typescript` (typescript-eslint, ts-morph, TypeDoc, языковые инструменты фреймворков), ждёт API 7.1. Варианты: схема с алиасами (проверена), oxlint + tsgolint (на TS 7) вместо typescript-eslint или 6.0 до выхода 7.1.
5. **ESLint, Biome или Oxlint.** У ESLint плагины; Oxlint в 12–18 раз быстрее на type-aware правилах и покрывает 59 из 61 правила typescript-eslint; Biome — один бинарник для формата и линта со своим (более узким) выводом типов. Многие команды используют Oxlint + облегчённый ESLint. Консенсуса нет.
6. **Prettier против oxfmt и форматера Biome.** oxfmt проходит conformance-тесты Prettier для JS/TS, но он до 1.0 и по умолчанию форматирует иначе (`printWidth` 100) `[не проверено]`. Смена форматера даёт один большой дифф; смысл есть только ради скорости в больших репозиториях.
7. **Запускать `.ts` напрямую в продакшене?** Встроенный stripping стабилен (25.2 / 24.12) и убирает шаг сборки, но добавляет стоимость парсинга на старте и запрещает нестираемый синтаксис. Многие команды по-прежнему компилируют `tsc` для продакшен-образов, а stripping используют для скриптов, тестов и разработки. Если важен старт, измеряйте (см. [performance.md](performance.md), compile cache).
8. **Corepack после удаления.** Одни ставят `npm i -g corepack` ради закрепления через `packageManager`, другие переходят на `devEngines` + самоуправление pnpm или mise. Поле `packageManager` по-прежнему работает в pnpm, Yarn и setup-node.
9. **husky застыл.** Релизов нет ~23 месяца, но он крошечный и работает. lefthook активно развивается, но его npm-пакет полагается на postinstall, который npm 12 по умолчанию блокирует. Подходит любой; ни один не заменяет CI.

## Что не проверено

- Workflow не запускались на GitHub; trusted publishing и `npm stage publish` не выполнялись.
- Node 26 и Alpha 27 локально не ставились (исключение: на бинарнике 26.13.0 проверены только пространства `node.config.json`). Остальные утверждения о Node 26 (удалён `--experimental-transform-types`, появился `--allow-net`, stable `--config-file`, список скриптов в `node --run`) взяты из документации v26.13.0, а не из запусков.
- Не подтверждено, правильно ли менеджеры версий (fnm, nvm, mise, setup-node с `lts/*`) обрабатывают `v27.0.0-alpha.0.0.0` в `index.json`; сама странная строка версии опубликована именно так.
- Детали Bun, Deno и Yarn 4/6 как пакетных менеджеров взяты из фоновых знаний или вторичных источников; статус стабильного Yarn 6 неизвестен.
- Детали Biome 2.6 — из индекса блога и поисковой сводки, а не из самого поста.
- Инциденты 2025 года (s1ngularity, chalk/debug, Shai-Hulud 1 и 2) и волны апреля и июня 2026 известны из вторичных источников; число пакетов у разных вендоров различается.
- Локальные проверки шли на Node 24.17.0, который отстаёт на два security-релиза; для проверенных функций поведение должно совпадать, но перед опорой на него обновитесь.

Книги и курсы по экосистеме — в [books.md](books.md).
