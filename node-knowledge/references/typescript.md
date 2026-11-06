# TypeScript для Node.js

Справочник по TypeScript в Node-проектах любого типа: сервисы, CLI, боты, обработка данных, игровые серверы, библиотеки. Внутри: статус компилятора (6.0 — последний релиз на JavaScript, 7.0 — порт на Go без программного API) и как держать обе версии рядом; новые умолчания 6.0 и опции, удалённые в 7.0; флаги tsconfig, которые важны для Node, и два готовых tsconfig (сервис и библиотека); встроенный type stripping в Node и матрица того, что он запускает и на чём падает; паттерны типизации; валидация в рантайме на границах (Zod 4, Valibot, ArkType, TypeBox, Standard Schema) с локальным замером; тесты типов; JSDoc в JS-проектах; версия `@types/node`; публикация типов (publint, attw, `rewriteRelativeImportExtensions`, `isolatedDeclarations`); линтинг с типами; Result-типы и Effect; таблица «симптом → приём», антипаттерны, спорные места и чеклист ревью. Общая идея: tsc только проверяет, Node стирает типы и запускает код, а недоверенные данные один раз разбираются схемой на границе. Актуально на ноябрь 2026: Node 26 — Active LTS «Lithium» (26.13.0 от 2026-10-28), Node 24 — Maintenance LTS «Krypton» (24.22.2), Node 22 — Maintenance LTS «Jod» (22.23.4), Node 20 — EOL. TypeScript: `latest` на npm — 7.0.2 (2026-07-08, компилятор на Go), последний релиз 6.x — 6.0.3 (2026-04-16), 7.1.0-beta — 2026-10-20. Также: `@types/node` 26.6.6, typescript-eslint 8.72.1, Zod 4.6.7. Локальные проверки выполнены на Node 24.17 (Windows 11) с TS 7.0.2 и 6.0.3, установленными рядом. Смежные темы: tsx, бандлеры, ESLint/oxlint и график релизов Node — [toolchain.md](toolchain.md); упаковка библиотек (`exports`, dual-сборки, JSR) — [domains-client.md](domains-client.md); ESM/CJS, `require(esm)`, ошибки и `using` — [idioms-patterns.md](idioms-patterns.md); type providers и OpenAPI в HTTP-фреймворках — [domains-server.md](domains-server.md); монорепозитории и project references — [architecture.md](architecture.md); Vitest и `node --test` — [testing.md](testing.md); холодный старт и compile cache — [performance.md](performance.md).

- [Версии на ноябрь 2026](#версии-на-ноябрь-2026)
- [Статус компилятора](#статус-компилятора)
- [Новые умолчания 6.0 и удалённые опции 7.0](#новые-умолчания-60-и-удалённые-опции-70)
- [Флаги tsconfig для Node](#флаги-tsconfig-для-node)
- [Рекомендуемые tsconfig](#рекомендуемые-tsconfig)
- [Type stripping в Node](#type-stripping-в-node)
- [Паттерны типизации](#паттерны-типизации)
- [Валидация в рантайме](#валидация-в-рантайме)
- [Тесты типов](#тесты-типов)
- [JSDoc в JS-проектах](#jsdoc-в-js-проектах)
- [Версия @types/node и глобальные типы](#версия-typesnode-и-глобальные-типы)
- [Публикация типов](#публикация-типов)
- [Линтинг с типами при переходе на TS 7](#линтинг-с-типами-при-переходе-на-ts-7)
- [Result, neverthrow и Effect](#result-neverthrow-и-effect)
- [Симптомы и приёмы](#симптомы-и-приёмы)
- [Книги и дальнейшее чтение](#книги-и-дальнейшее-чтение)
- [Антипаттерны](#антипаттерны)
- [Спорные места](#спорные-места)
- [Чеклист ревью типизации](#чеклист-ревью-типизации)

## Версии на ноябрь 2026

**Ключевые выводы**
- `npm install -D typescript` ставит 7.0.2 — компилятор на Go. Программного API в нём нет. Всё, что делает `import ts from "typescript"`, требует 6.0 рядом (см. [Статус компилятора](#статус-компилятора)).
- Type stripping в Node стабилен с 25.2.0 / 24.12.0. `--experimental-transform-types` удалён в 26.0.0: встроенный режим теперь только strip-only.
- `@types/node` выбирайте по минимальной поддерживаемой версии Node, а не `latest` (см. [Версия @types/node](#версия-typesnode-и-глобальные-типы)).
- Устаревшее: `@typescript/native-preview` (`tsgo`) `[устарело]` → `typescript@7`; ts-node `[устарело]` → type stripping в Node или tsx; fp-ts/io-ts `[устарело]` → `effect`; `@effect/schema` `[устарело]` → `effect/Schema`.

| Пакет / компонент | Версия (дата) | Заметки |
|---|---|---|
| Node.js | 26.13.0 LTS (2026-10-28); 24.22.2 LTS (2026-10-27); 22.23.4 LTS (2026-10-20); 25.x закончилась (последняя 25.9.0, 2026-03-31); 27.0.0-alpha с 2026-10-29 | Подробно в [toolchain.md](toolchain.md) |
| Type stripping в Node | Включён по умолчанию с 23.6.0 / 22.18.0; без предупреждения с 24.3.0 / 22.18.0; **Stable с 25.2.0 / 24.12.0**; `--experimental-transform-types` **удалён в 26.0.0** | Отключение: `--no-strip-types` |
| amaro (стриппер Node: SWC в Wasm) | 1.3.0 (2026-10-27) | Встроен в Node. Можно подключить отдельно как loader, чтобы получить более новый стриппер |
| **typescript** (`latest`) | **7.0.2 (2026-07-08)**; 7.0.1-rc — 2026-06-18; 7.0 beta — 2026-04-21 | `exports["."]` — только `lib/version.cjs`: **JS API компилятора нет** |
| typescript `beta` / `next` | **7.1.0-beta (2026-10-20)**; `next` = 7.1.0-dev.20261106.1 | Новый API (`typescript/sync`, `typescript/async`, `typescript/ast`…), content mappers, target `es2026`. RC ожидается «примерно через месяц» после беты |
| TypeScript 6.0 | 6.0.2 (2026-03-23), **6.0.3 (2026-04-16)** — последний | «Последний релиз на кодовой базе JavaScript». Мост: объявляет устаревшим то, что удалено в 7.0 |
| `@typescript/typescript6` | 6.0.2 (2026-07-06) | Бинарник `tsc6` и реэкспорт API 6.0 (зависит от `@typescript/old` = `npm:typescript@^6`) |
| `@typescript/native-preview` (`tsgo`) | последняя 7.0.0-dev.20260707.2 | `[устарело]` → `typescript@7` / `typescript@next` |
| TypeScript 5.9 | 5.9.3 (2025-09-30) | Новый `tsc --init`, `--module node20`, `import defer` |
| `@types/node` | `latest` 26.6.6 (2026-10-28); последняя 24.x — 24.19.2, последняя 22.x — 22.20.5 | major.minor следует за Node, patch — собственный счётчик пакета. Теги `ts5.6`…`ts7.1` указывают на 26.6.6 |
| typescript-eslint | 8.72.1 (2026-10-26) | Поддерживаемый TS: **`>=4.8.4 <6.1.0`**. TS 7 для линтинга с типами не поддерживается — нужен алиас `typescript6` |
| ESLint | 10.14.0 (2026-10-30); 10.0.0 — 2026-02-06 | См. [toolchain.md](toolchain.md) |
| tsx | 4.23.15 (2026-09-20) | Запускалка на esbuild. Умеет enum, `paths`, декораторы |
| ts-node | 10.9.2 (2023-12-08) | Без релизов ~35 месяцев. `[устарело]` → type stripping / tsx |
| zod | **4.6.7 (2026-10-12)**; 4.0.0 — 2025-07-09 | `zod/mini`, `z.toJSONSchema()`, Standard Schema |
| valibot | 1.5.0 (2026-09-09); 1.0.0 — 2025-03-19 | Модульный, самые маленькие бандлы |
| arktype | 2.2.9 (2026-10-20); 2.0.0 — 2025-01-17 | Определения строками в синтаксисе TS. Самый быстрый в собственных бенчмарках |
| typebox (новое имя пакета) | 1.4.4 (2026-11-04); 1.0.0 — 2025-09-09 | TypeBox 1.x переехал из `@sinclair/typebox` (0.34.52, 2026-07-11, ветка сопровождения) в `typebox` |
| @standard-schema/spec | 1.1.0 (2025-12-15) | `StandardSchemaV1`, `StandardTypedV1`, `StandardJSONSchemaV1` |
| ajv | 8.20.0 (2026-04-24) | Валидатор JSON Schema, его использует Fastify |
| typia | 15.2.2 (2026-10-30) | AOT-валидаторы из TS-типов. Это трансформер компилятора, зависит от JS API TS; совместимость с 7.x `[не проверено]` |
| effect | **4.1.2 (2026-11-02)**; 4.0.0 — 2026-10-01 | `@effect/schema` помечен deprecated («merged into the main effect package») |
| neverthrow | 8.2.0 (2025-02-21) | ~20 месяцев без релиза, на грани заброшенности |
| better-result / ts-results-es / true-myth | 3.0.1 (2026-08-11) / 7.1.0 (2026-07-01) / 9.4.0 (2026-05-25) | Альтернативные Result-библиотеки |
| fp-ts / io-ts | 2.16.11 (2025-08) / 2.2.22 (2024-12) | Автор перешёл в Effect. `[устарело]` → `effect` |
| ts-pattern / type-fest / @total-typescript/ts-reset | 5.9.2 (2026-10-14) / 5.10.0 (2026-09-17) / 0.6.1 (2024-09-02) | Исчерпывающий pattern matching / утилитарные типы / безопасные встроенные типы (ts-reset без релизов больше 24 месяцев, но работает) |
| expect-type / tsd / tstyche / @ark/attest | 1.4.0 (2026-06-25) / 0.33.0 (2025-08-05) / 7.2.5 (2026-09-10) / 0.58.0 (2026-10-22) | Тесты типов: основа `expectTypeOf` в Vitest / свой форк TS, медленно догоняет новые версии / несколько версий TS / бенчмарки инстанцирования типов |
| vitest | 5.1.0 (2026-11-02); 5.0.0 — 2026-09-03 | `expectTypeOf`, `vitest --typecheck` |
| @arethetypeswrong/cli / publint | 0.18.5 (2026-07-09) / 0.3.25 (2026-10-01) | Проверка опубликованных типов под резолюциями node10/node16/bundler / линтер `package.json` и `exports` |
| @microsoft/api-extractor / tsdown | 7.60.1 (2026-10-30) / 0.23.7 (2026-11-06) | Сборка `.d.ts` в один файл и отчёт об API / сборщик библиотек на Rolldown, быстрый `.d.ts` через isolated declarations. tsdown 0.23.7 по умолчанию пишет `.mjs`/`.d.mts` (проверено локально; `fixedExtension: false` возвращает `.js`) |
| rollup-plugin-dts / dts-bundle-generator | 6.5.1 (2026-08-04) / 9.5.1 (2024-04-21) | dts-bundle-generator: нет релизов больше 18 месяцев |
| @tsconfig/node24 / node22 / strictest / node-ts | 24.0.5 / 22.0.6 (2026-08-15) / 2.0.8 (2025-11-13) / 23.6.4 (2026-02-14) | Базовые конфиги для `extends` |
| ts-morph | 28.0.0 (2026-04-12) | Обёртка над JS API 6.x; с 7.0 не работает `[не проверено]` |
| knip | 6.44.1 (2026-10-31) | Неиспользуемые экспорты, типы и зависимости |
| @effect/schema | 0.75.5 (2024-10-16) | Deprecated в npm. `[устарело]` → `effect/Schema` |
| superstruct / yup / runtypes | 2.0.2 (2024-07) / 1.7.1 (2025-09) / 7.0.5 (2026-08) | superstruct: нет релизов больше 18 месяцев |

## Статус компилятора

**Ключевые выводы**
- **TypeScript 7.0 — порт на Go, и это `latest` в npm.** Бинарник `tsc` опирается на нативный пакет под платформу (`@typescript/typescript-win32-x64` и т. п.; 20 платформ как optional dependencies). По данным Microsoft, полная сборка по умолчанию быстрее в 8–12 раз (vscode 125,7 с → 10,6 с, sentry 139,8 с → 15,7 с, playwright 12,8 с → 1,47 с), с `--checkers 8` — в 10,6–16,7 раза. Пиковая память ниже на 6–26 %. Время до первой ошибки в редакторе на репозитории VS Code упало с ~17,5 с до менее 1,3 с.
- **В 7.0 нет программного API.** В `package.json` у `exports["."]` указан только `./lib/version.cjs`; кроме него есть лишь точки входа `./unstable/*`. Всё, что делает `import ts from "typescript"` и вызывает API компилятора, должно оставаться на 6.0. Это линтинг с типами в typescript-eslint, ts-morph, трансформеры typia/ts-patch, языковые инструменты Vue/Svelte/Astro/MDX/Angular, ts-loader.
- **Рекомендованная установка двух версий рядом** (из анонса 7.0). Пакеты переименовываются алиасами: инструменты с peer-зависимостью на `typescript` получают API 6.0, а `tsc` — это 7.0. `@typescript/typescript6` даёт бинарник `tsc6` и реэкспортирует API 6.0:

```json
{ "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2" } }
```

- **Ловушка обратной установки** (проверено локально на Node 24.17, Windows 11). Установка «наоборот» — `typescript@7` плюс `tsc6@npm:@typescript/typescript6` — привела к тому, что `npx tsc` печатал **6.0.3**. Причина: `@typescript/typescript6` зависит от `@typescript/old` (= `npm:typescript@^6`), и бинарник `tsc` этого пакета занял ссылку `node_modules/.bin/tsc`. После установки двух версий всегда проверяйте `npx tsc -v` или вызывайте бинарник 7.0 явно.

```bash
npm i -D "@typescript/native@npm:typescript@^7.0.2" "typescript@npm:@typescript/typescript6@^6.0.2"
npx tsc -v      # должна быть 7.0.x; если 6.x — смотрите, куда ведёт node_modules/.bin/tsc
npx tsc6 -v     # 6.0.x: API для typescript-eslint, ts-morph и т. п.
```

- **Контракт совместимости.** Код, который чисто компилируется на 6.0 с включённым `stableTypeOrdering` и без `ignoreDeprecations`, должен так же компилироваться на 7.0. Одно намеренное отличие: вывод template-literal типов не разрывает кодовые точки Unicode. `--checkers N` (по умолчанию 4, экспериментальный) в редких случаях даёт результаты, зависящие от порядка. `--builders N` распараллеливает `--build`, `--singleThreaded` отключает параллелизм. `--watch` переписан на Go-порт watcher-а из Parcel.
- **7.1 (бета 2026-10-20) возвращает API:** новый API в `typescript/sync`, `typescript/async`, `typescript/fs` и `typescript/ast` (объекты `Disposable`, используйте `using`); content mappers (`"contentMappers"` в tsconfig, нужен `tsc --runExternalCode`) для Vue, Svelte, Astro, MDX и CSS-модулей; атрибуты импорта в ambient-модулях (`declare module "*" with { type: "css" }`); source-phase импорты (`import source x from "./m.wasm"`); стабильный target `es2026` и более строгие дистрибутивные условные типы. Целевой ритм релизов — раз в 3–4 месяца.
- Финальная дата 7.1 неизвестна: на 2026-11-06 RC не вышел. Поддержку нового API 7.1 в typescript-eslint, typia и ts-morph никто не объявлял. План сопровождения 6.x после 6.0.3 не опубликован; будут ли исправления в 6.0 — неясно.
- **Локальный замер** (Node 24.17, Windows 11, шумная машина; трактуйте как отношения с широкой погрешностью). Синтетический проект из 600 файлов (схемы Zod, mapped- и рекурсивные типы; 788 файлов вместе с lib), `noEmit`. Время проверки по `--extendedDiagnostics`: 0,47 с (7.0.2) против 2,37 с (6.0.3), **~5× быстрее**; общее время 0,95 с против 5,5 с. Медиана wall-clock через Node-обёртку: ~1,7 с против ~4,9 с, **~3× быстрее**; прямой вызов нативного `tsc.exe` — ~0,84 с. На маленьких проектах выигрыш меньше: доминируют запуск процесса и загрузка lib. Цифры 8–12× от вендора относятся к большим репозиториям. Бывает и обратное: один файл с глубоким рекурсивным типом TS 7.0.2 проверял ~1,0 с против ~0,6 с у 6.0.3 (проверено локально). Перед переходом замерьте свой проект, а горячие типы ищите через `--generateTrace`.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) | TypeScript team, 2026-07-08 | Установка, ускорение, удалённые опции, алиас `typescript6`, `--checkers`/`--builders`, редакторы |
| [Announcing TypeScript 7.0 RC](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-rc/) | TypeScript team, 2026-06-18 | Заметки RC |
| [Announcing TypeScript 7.0 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/) | TypeScript team, 2026-04-21 | Заметки беты |
| [Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/) | TypeScript team, 2026-10-20 | Новый API, content mappers, `es2026` |
| [Progress on TypeScript 7 — December 2025](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/) | TypeScript team, 2025-12-02 | Ход портирования и паритет с 6.x |
| [TypeScript dev blog](https://devblogs.microsoft.com/typescript/) | TypeScript team | Список релизов |
| [@typescript/typescript6](https://www.npmjs.com/package/@typescript/typescript6) | Microsoft | Пакет-прослойка с API 6.0 |
| [typescript-go CHANGES.md](https://github.com/microsoft/typescript-go/blob/main/CHANGES.md) | TypeScript team | Отличия 7 от 6: JSDoc, expando, CommonJS, checker |
| [TypeScript 7 released](https://www.infoq.com/news/2026/08/typescript-7-released/) | InfoQ, 2026-08 | Вторичный обзор 7.0 |
| [TypeScript 7.0 RC moves Microsoft's Go rewrite into the mainline compiler](https://visualstudiomagazine.com/articles/2026/06/22/typescript-7-0-rc-moves-microsofts-go-rewrite-into-the-mainline-compiler.aspx) | Visual Studio Magazine, 2026-06-22 | Обзор RC `[не проверено]` |
| [Microsoft bets TypeScript future on a native compiler](https://adtmag.com/articles/2026/07/10/microsoft-bets-typescript-future-on-a-native-compiler.aspx) | ADTmag, 2026-07-10 | Обзор 7.0 `[не проверено]` |
| [TypeScript 7.0 rewrites the compiler in Go](https://linuxiac.com/typescript-7-0-rewrites-the-compiler-in-go-for-up-to-12x-faster-builds/) | Linuxiac, 2026-07 | Обзор 7.0 |
| [A 10x faster TypeScript](https://www.youtube.com/watch?v=pNlq-EVld70) | Microsoft Developer (Anders Hejlsberg), 2025 | Видео с анонсом порта на Go |

## Новые умолчания 6.0 и удалённые опции 7.0

**Ключевые выводы**
- **6.0 (2026-03-23) — релиз-мост.** Он поменял умолчания под 7.0 и объявил устаревшим всё, что 7.0 удаляет. `"ignoreDeprecations": "6.0"` глушит предупреждения только в 6.0; в 7.0 это жёсткие ошибки. Используйте его лишь как временную меру на время миграции.
- **Старые tsconfig, которые полагались на умолчания, теперь значат другое:**

| Опция | Новое умолчание | Последствие для Node-проекта |
|---|---|---|
| `strict` | `true` | Старые нестрогие проекты внезапно получают ошибки. `"strict": false` явно — только как шаг миграции |
| `module` | `esnext` | **Неверно для Node.** Всегда задавайте `module: "nodenext"` (или `node20`) явно |
| `target` | последний стабильный ES (es2025 в 6.0) | Подходит для Node 24+. В библиотеках фиксируйте явно |
| `types` | `[]` | **`process`, `Buffer` и глобалы Node перестают находиться.** Добавьте `"types": ["node"]` (или `["*"]` для старого поведения) |
| `rootDir` | каталог, где лежит tsconfig.json | При `outDir` и исходниках в `src/` задайте `"rootDir": "src"`, иначе TS5011 или раскладка `dist/src/...` (TS5011 воспроизведён локально на TS 7.0.2) |
| `noUncheckedSideEffectImports` | `true` | `import "./setup"` на несуществующий файл теперь ошибка |
| `libReplacement` | `false` | Пакеты `@typescript/lib-*` игнорируются, пока опция не включена |
| `stableTypeOrdering` | `true` (в 7.0 отключить нельзя) | — |

- **Удалено в 7.0 (устарело в 6.0):** `target: es5` и `downlevelIteration`; `moduleResolution: node`/`node10` и `classic`; `module: amd|umd|system|none`; `baseUrl` (переписывайте `paths` относительно проекта); `esModuleInterop: false` и `allowSyntheticDefaultImports: false`; `alwaysStrict: false`; `outFile`; ключевое слово `module Foo {}` для пространств имён; import assertions `assert {}` (используйте `with {}`; в 6.0.3 под `nodenext` это уже ошибка TS2880, которую `ignoreDeprecations` не глушит — проверено локально); `/// <reference no-default-lib>`; передача имён файлов в `tsc`, когда есть tsconfig.json (TS5112; используйте `--ignoreConfig`).
- **Коды ошибок** (проверено локально): для `baseUrl`, `moduleResolution: node` и `target: es5` TS 6.0.3 выдаёт TS5101/TS5107 («deprecated and will stop functioning in TypeScript 7.0» и ссылку https://aka.ms/ts6), а TS 7.0.2 — TS5102/TS5108 («has been removed»). Сообщение про `baseUrl` предлагает `"paths": {"*": ["./*"]}`.
- **Новое в 6.0:** target/lib `es2025` (`RegExp.escape`; `Promise.try`, iterator helpers и методы Set переехали из `esnext`); типы Temporal через `lib: ["esnext"]` или `"esnext.temporal"`; `Map.getOrInsert` / `getOrInsertComputed`; subpath-импорты с префиксом `#/` под `nodenext`/`bundler`; `--moduleResolution bundler` вместе с `--module commonjs`; `--stableTypeOrdering` (до 25 % медленнее, только как помощь при миграции на 7.0); лучший вывод для callback-методов без `this`.
- **Возможности 5.x, которые по-прежнему важны.** 5.0: `allowImportingTsExtensions` (с `noEmit`/`emitDeclarationOnly`) и `verbatimModuleSyntax`. 5.5: `isolatedDeclarations` и выводимые type predicates. 5.7: `rewriteRelativeImportExtensions`. 5.8: `erasableSyntaxOnly`, `--module node18`, `require(esm)` под `nodenext`, проверка return по веткам. 5.9: `--module node20` (стабильный, подразумевает `target es2023`) и `import defer` (только с `module preserve`/`esnext`); компактный `tsc --init` (nodenext, strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`, `skipLibCheck`, `types: []`); `ArrayBuffer` больше не супертип typed arrays и `Buffer` — обновите `@types/node` вместе с TS.

- **Порядок миграции на 7.0** (следует из контракта совместимости): обновиться до 6.0.3, убрать `ignoreDeprecations` и исправить все TS5101/TS5107 → явно задать `module`, `types`, `rootDir`, `target` → включить `stableTypeOrdering` в 6.0 и добиться чистой проверки → поставить 7.0 по схеме алиасов, проверить `npx tsc -v` и сравнить вывод `tsc --noEmit` на 6 и 7.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) | TypeScript team, 2026-03-23 | Умолчания и deprecations, es2025, Temporal, `#/`-импорты |
| [Announcing TypeScript 6.0 RC](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-rc/) | TypeScript team, 2026-03-06 | Заметки RC |
| [Announcing TypeScript 6.0 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/) | TypeScript team, 2026-02-11 | Обоснование каждого deprecation |
| [6.0 Deprecation List (#54500)](https://github.com/microsoft/TypeScript/issues/54500) | TypeScript team | Обсуждение, из которого выросли удаления 6.0/7.0 |
| [Announcing TypeScript 5.9](https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/) | TypeScript team, 2025-08-01 | Умолчания `tsc --init`, `node20`, `import defer` |
| [Announcing TypeScript 5.8](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/) | TypeScript team, 2025-02 | `erasableSyntaxOnly`, `node18`, `require(esm)` |
| [Breaking Changes](https://github.com/microsoft/TypeScript/wiki/Breaking-Changes) | TypeScript team | Ломающие изменения по версиям |

## Флаги tsconfig для Node

**Ключевые выводы**
- **`module` определяет и резолюцию, и вывод. Для Node — `nodenext` или зафиксированный `node20`.**
  - `nodenext` подразумевает `moduleResolution nodenext` и плавающий `target esnext`. ESM или CJS выбирается для каждого файла по полю `"type"` ближайшего `package.json` и по расширению (`.mts`/`.cts`). Моделирует `require(esm)` (разрешён с 5.8) и атрибуты импорта.
  - `node20` (5.9+) — стабильный снимок, который «is unlikely to have new behaviors in the future»; подразумевает `target es2023`. `node18` (5.8) запрещает `require(esm)`. `node16` — устаревший снимок.
  - **Никогда не используйте `moduleResolution node`/`node10` для кода под Node**: опция удалена в 7.0 и игнорирует `exports`. `bundler`/`preserve` — для кода, который потребляет бандлер, а не для кода, который Node запускает напрямую.
- **`verbatimModuleSyntax: true`** — импорты и экспорты выводятся ровно как написаны. Импорт только типа обязан быть `import type` или `{ type X }`, иначе TS1484. В ESM-файле запрещает `require`; в CJS-выводе запрещает ESM-синтаксис, кроме `import x = require()`, который сам не стираем. Обязателен для type stripping: без `type` получается рантайм-ошибка `SyntaxError: ... does not provide an export named 'Shape'` (проверено локально на Node 24.17). Заменяет старые `importsNotUsedAsValues`/`preserveValueImports`.
- **`erasableSyntaxOnly: true` (5.8+)** даёт ошибку TS1294 на `enum` (включая `const enum`), runtime-`namespace`, parameter properties в конструкторе, `import x = require()`, `export =` и угловые утверждения `<T>x`. Локально TS 7.0.2 и 6.0.3 поймали все шесть конструкций, на которых падает Node 24. **Декораторы флаг не ловит**: TS принял `@d m() {}` (exit 0), а Node 24 бросил `SyntaxError: Invalid or unexpected token`. Для декораторов нужно отдельное правило: запрет линтером или отказ от прямого запуска исходников.
- **`rewriteRelativeImportExtensions: true` (5.7+)** позволяет писать в исходниках `import "./x.ts"` (это нужно Node при прямом запуске `.ts`) и переписывает его в `./x.js` в выходном JS. Переписываются только *относительные* спецификаторы; флаг подразумевает `allowImportingTsExtensions`. Локально: в выходном `.js` было `./result.js`, а выходной `.d.ts` **сохранил `./result.ts`** (одинаково в TS 6.0.3 и 7.0.2). attw всё равно показал корректную резолюцию (🟢 node16-ESM и bundler).
- **`allowImportingTsExtensions`** — для проектов с `noEmit` / `emitDeclarationOnly`, то есть для кода, который запускает только Node или бандлер. Без него `import "./x.ts"` — ошибка TS5097.
- **`isolatedDeclarations: true` (5.5+)** требует, чтобы тип каждого экспортируемого символа можно было записать из его собственного файла, без вывода через другие файлы. Локально: `export function sum(a, b) { return a + b }` без аннотаций дал TS9013; `export const X = Object.freeze({...})` и `as const satisfies …` — TS9010. Простые объектные литералы из литералов прошли. Выигрыш: tsdown/oxc/swc генерируют `.d.ts` по файлу без запуска тайпчекера — быстрые сборки библиотек и параллельные сборки монорепозиториев. Для библиотек — включать; для приложений — по желанию (шумно).
- **Строгость сверх `strict`** (что добавляют `@tsconfig/strictest` и `tsc --init` 5.9). `noUncheckedIndexedAccess`: `arr[i]` и `record[k]` имеют тип `T | undefined` — самый полезный дополнительный флаг по числу пойманных багов. `exactOptionalPropertyTypes`: `{ x?: string }` больше не принимает `x: undefined`; важно для PATCH/update DTO и для `.optional()` в Zod. `noImplicitOverride` (требует `override`), `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature` (для индексных сигнатур требует `obj["k"]`). `useUnknownInCatchVariables` уже входит в `strict`. `noUnusedLocals`/`noUnusedParameters` лучше отдать линтеру.
- **`types: ["node"]` теперь обязателен**, потому что в 6.0+ `types` по умолчанию `[]`. Версию `@types/node` берите по **минимальной поддерживаемой мажорной версии Node** (`"@types/node": "^24"` при `engines >=24`), а не `latest`. Подробнее — [Версия @types/node](#версия-typesnode-и-глобальные-типы).
- **`lib`/`target` для Node.** Node 24 и 26 выполняют ES2024+ нативно. Ставьте `target: "es2024"` (или `es2025` на TS 6+) и `lib` без `"dom"`. С `dom` типы `fetch`, `Response` и `setTimeout` берутся из DOM и конфликтуют с `@types/node` `[не проверено]`. `@types/node` уже объявляет глобальное семейство `fetch`.
- **Алиасы путей.** Node не применяет `paths` в рантайме: type stripping падает на неразрешённых голых алиасах, а tsc их никогда не переписывает. Используйте **`imports` в package.json** (`"#app/*": "./src/*"`) — их понимают и Node, и TS (`nodenext`, `bundler`). TS 6.0 добавил шаблоны с префиксом `#/`. Локально `import { loadEnv } from "#app/config.ts"` прошёл проверку TS 7.0.2/6.0.3 и запустился под type stripping в Node 24. `baseUrl` в 7.0 удалён.
- **`skipLibCheck: true`** — прагматичное умолчание: не проверяет `.d.ts` в `node_modules` (быстрее, нет конфликтов разных `@types`). Библиотеки всё равно проверяют свой выход через attw/publint ([Публикация типов](#публикация-типов)). `isolatedModules: true` на практике следует из `verbatimModuleSyntax` и нужен любому пофайловому транспайлеру (esbuild, swc, стриппер Node).
- **Project references** (`composite: true`, `tsc -b`) — для монорепозиториев. TS 7 добавил `--builders N` для параллельной сборки ссылок. Сочетайте с `isolatedDeclarations`, чтобы генерация деклараций не выстраивала граф в очередь. Раскладка монорепозитория — в [architecture.md](architecture.md).
- **Базовые конфиги:** расширяйте `@tsconfig/node24` (или `node22`/`node26`) и `@tsconfig/strictest`; `extends` принимает массив (5.0+): `"extends": ["@tsconfig/node24/tsconfig.json", "@tsconfig/strictest/tsconfig.json"]`. Проверяйте, что задаёт база: старые базы могут ставить `moduleResolution: node16` — это работает, но это не `nodenext` `[не проверено]`.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [TSConfig Reference](https://www.typescriptlang.org/tsconfig/) | TypeScript team, живой | Справочник по всем опциям. Список `module` включает `node16`, `node18`, `node20`, `nodenext`, `preserve` |
| [tsconfig: module](https://www.typescriptlang.org/tsconfig/#module) | TypeScript team | Семантика `module` |
| [tsconfig: rewriteRelativeImportExtensions](https://www.typescriptlang.org/tsconfig/#rewriteRelativeImportExtensions) | TypeScript team | Правила переписывания (только относительные) |
| [tsconfig: allowImportingTsExtensions](https://www.typescriptlang.org/tsconfig/#allowImportingTsExtensions) | TypeScript team | Требует noEmit/emitDeclarationOnly |
| [tsconfig: erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly) | TypeScript team | Страница опции |
| [tsconfig: verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax) | TypeScript team | Страница опции |
| [tsconfig: isolatedDeclarations](https://www.typescriptlang.org/tsconfig/#isolatedDeclarations) | TypeScript team | Страница опции |
| [tsconfig: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess) | TypeScript team | Страница опции |
| [tsconfig: exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes) | TypeScript team | Страница опции |
| [Modules — Theory](https://www.typescriptlang.org/docs/handbook/modules/theory.html) | Andrew Branch, TypeScript team | Почему module/moduleResolution должны моделировать хост |
| [Modules — Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html) | Andrew Branch | Точная семантика node16/nodenext/bundler, `exports`, `imports` |
| [Choosing Compiler Options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html) | Andrew Branch | Выбор опций: приложение или библиотека, с бандлером или без |
| [ESM/CJS Interoperability](https://www.typescriptlang.org/docs/handbook/modules/appendices/esm-cjs-interop.html) | Andrew Branch | Детали взаимодействия ESM/CJS за `esModuleInterop` |
| [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) | TypeScript team | `composite`, `tsc -b` |
| [Node.js: subpath imports](https://nodejs.org/api/packages.html#subpath-imports) | Node.js docs | `#`-импорты — правильная для рантайма замена `paths` |

## Рекомендуемые tsconfig

**Ключевые выводы**
- Два конфига ниже приведены дословно. Оба проверены локально (TS 7.0.2 и 6.0.3, Node 24.17, Windows 11).
- **Сервис или приложение:** Node запускает `.ts` напрямую через type stripping, tsc только проверяет типы. Проходит проверку TS 7.0.2 и 6.0.3 (exit 0) и запускается под type stripping Node 24.17, включая subpath-импорт `#app/*`.
- **Публикуемая библиотека:** только ESM, сборка tsc или tsdown. TS 7.0.2 собирает её, publint сообщает «All good!», attw `--pack --profile esm-only` даёт 🟢 для node16-from-ESM и bundler. Без профиля attw помечает «ESM (dynamic import only)» для CJS-потребителей. На Node ≥ 22.12 CJS-потребители могут загрузить такой пакет через `require(esm)` (см. [idioms-patterns.md](idioms-patterns.md)).
- Готовые базы для `extends`: `@tsconfig/node24`, `@tsconfig/strictest`, `@tsconfig/node-ts` (для прямого запуска `.ts` в Node). Популярная шпаргалка Total TypeScript написана до умолчаний TS 6 (`types`, `rootDir`), поэтому берите её только как отправную точку.

### Сервис или приложение (запуск через type stripping, проверка через tsc)

```jsonc
// package.json: { "type": "module", "imports": { "#app/*": "./src/*" }, "engines": { "node": ">=24" } }
{
  "compilerOptions": {
    "target": "es2024",
    "lib": ["es2024"],                // no "dom" in server code
    "module": "nodenext",              // or "node20" for a frozen snapshot
    "types": ["node"],                 // required on TS 6/7 (default is [])
    "rootDir": "src",
    "noEmit": true,                    // Node runs .ts directly; tsc only type-checks
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,        // no enum/namespace/param-props/import=/<T>x
    "verbatimModuleSyntax": true,      // `import type` required → strip-safe
    "isolatedModules": true,
    "resolveJsonModule": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "skipLibCheck": true
  },
  "include": ["src", "test"]
}
```

Скрипты: `"start": "node src/main.ts"`, `"dev": "node --watch src/main.ts"`, `"typecheck": "tsc -p ."`. Если в контейнер уходит скомпилированный JS, уберите `noEmit`/`allowImportingTsExtensions` и добавьте `"outDir": "dist"`, `"rewriteRelativeImportExtensions": true`, `"sourceMap": true`.

### Публикуемая библиотека (только ESM, tsc или tsdown)

```jsonc
// package.json: "type": "module",
//   "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }, "./package.json": "./package.json" },
//   "files": ["dist", "src"], "engines": { "node": ">=22.12" }, "sideEffects": false
{
  "compilerOptions": {
    "target": "es2023",                // what your oldest supported Node runs; don't over-target
    "lib": ["es2023"],
    "module": "node20",                // stable semantics for consumers on Node 20+/22+
    "types": [],                       // add "node" only if the library uses Node APIs
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,            // "go to definition" lands in src/ (ship src/)
    "sourceMap": true,
    "isolatedDeclarations": true,      // enables fast per-file .d.ts (tsdown/oxc)
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "stripInternal": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Заметки к библиотечному конфигу:
- **Не включайте `exactOptionalPropertyTypes` в библиотеке, не проверив потребителей, у которых он выключен** (и наоборот). Флаг меняет то, как читаются необязательные свойства в ваших публичных типах.
- Публикуйте с provenance или через trusted publishing (см. [toolchain.md](toolchain.md)).
- Dual-упаковка ESM+CJS — в [domains-client.md](domains-client.md).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [TSConfig Cheat Sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet) | Matt Pocock, обновлено 2024-04-23 | Популярный базовый конфиг. Написан до умолчаний TS 6 (`types`, `rootDir`) — только как отправная точка |
| [tsconfig/bases](https://github.com/tsconfig/bases) | tsconfig org | Исходники `@tsconfig/node24`, `@tsconfig/strictest`, `@tsconfig/node-ts` |
| [@tsconfig/node-ts](https://www.npmjs.com/package/@tsconfig/node-ts) | tsconfig org | База для прямого запуска `.ts` в Node (type stripping) |

## Type stripping в Node

**Ключевые выводы**
- **Статус.** Type stripping **стабилен (stability 2) с Node 25.2.0 / 24.12.0**. Включён по умолчанию с 23.6.0 / 22.18.0, без предупреждения — с 24.3.0 / 22.18.0. `--experimental-transform-types` (умел enum, namespace и parameter properties) **удалён в 26.0.0** — дальше встроенный режим только strip-only (взято из документации v26.12.0; на Node 26 локально не проверялось).
- Node заменяет типы пробелами: номера строк и столбцов сохраняются, source maps не нужны. **Проверки типов нет, tsconfig.json игнорируется.** Парсер — amaro (SWC, скомпилированный в Wasm); без WebAssembly Node бросает `ERR_WEBASSEMBLY_NOT_SUPPORTED`. `process.features.typescript` на 24.17 равен `"strip"`.

```bash
node src/main.ts                     # запуск без сборки
node --watch src/main.ts             # dev-режим
node --test                          # шаблон по умолчанию подхватывает *.test.ts
node -p process.features.typescript  # "strip"
npx tsc --noEmit                     # типы проверяет только tsc (или oxlint --type-check на TS 7)
```

**Матрица поведения** (проверено локально на Node 24.17, Windows 11, стриппинг по умолчанию):

| Конструкция | Результат |
|---|---|
| Аннотации, `interface`, `type`, generics, `as`, `satisfies`, `!`, `as const`, `abstract`, `declare`-поля, `override`, поля `private readonly`, `implements`, сигнатуры перегрузок, параметр `this:`, `asserts x is T` | ✅ работает |
| Generic-стрелка `<T,>(x: T) => x` | ✅ работает |
| `declare enum`, `declare namespace`, namespace только с типами `namespace T { export type A = … }` | ✅ работает (полностью стираемо) |
| `enum` / `const enum` | ❌ `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`: «TypeScript enum is not supported in strip-only mode» |
| `namespace A { export let x = 1 }` | ❌ `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| Parameter properties `constructor(private x: number)` | ❌ «TypeScript parameter property is not supported in strip-only mode» |
| `import fs = require("node:fs")` | ❌ «import equals declaration is not supported» |
| `export = z` (в `.cts`) | ❌ «export assignment is not supported» |
| Угловое утверждение `<number>x` | ❌ «use the 'as' syntax» |
| Декораторы `@d m() {}` | ❌ `SyntaxError: Invalid or unexpected token`. Не работает даже с `--experimental-transform-types`: в V8 декораторов пока нет |
| Поля класса `accessor` | ❌ `SyntaxError` (синтаксис из предложения о декораторах, в V8 его пока нет) |
| `import { Shape, v } from "./lib.ts"`, где `Shape` — интерфейс | ❌ рантайм `SyntaxError: ... does not provide an export named 'Shape'`. Пишите `import { type Shape, v }` |
| `import "./lib.ts"` | ✅ |
| `import "./lib.js"` (есть только `lib.ts`) | ❌ `ERR_MODULE_NOT_FOUND`. Node не сопоставляет `.js` → `.ts` |
| `import "./lib"` (без расширения) | ❌ `ERR_MODULE_NOT_FOUND` |
| `.cts`: `require("./lib.cts")` | ✅. `require("./lib")` ❌ |
| `require()` ESM-файла `.ts` из `.cts` | ✅ (`require(esm)`) |
| `.ts` без поля `"type"`, но с ESM-синтаксисом | ✅ (определение синтаксиса модуля) |
| `.tsx` | ❌ `ERR_UNKNOWN_FILE_EXTENSION` |
| `.ts` внутри `node_modules` | ❌ `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` (намеренно: не публикуйте сырой TS) |
| `node --test` с `*.test.ts` | ✅ шаблон тестов по умолчанию находит `.ts` |
| `node --input-type=module-typescript -e '…'`, `node - < file.ts` | ✅ |
| `node --check file.ts` | ❌ без поддержки TS (разбирается как JS). REPL и `inspect` тоже не поддерживаются |
| `--no-strip-types` (или старый `--no-experimental-strip-types`) | Стриппинг выключен → `ERR_UNKNOWN_FILE_EXTENSION` |
| `--experimental-transform-types` (24.x) | Enum, namespace и parameter properties работают с ExperimentalWarning; декораторы всё равно падают. **Удалён в 26** |

- **Заставьте tsc требовать то, что Node умеет запускать:** `erasableSyntaxOnly` + `verbatimModuleSyntax` + `allowImportingTsExtensions` (или `rewriteRelativeImportExtensions`, если есть emit) + `module nodenext`. Локально эта связка поймала все падающие строки матрицы, **кроме декораторов и `accessor`**. Для них добавьте правило линтера или держите код с декораторами (NestJS, TypeORM, legacy-декораторы MikroORM) на настоящем транспайлере: tsx, swc или emit через tsc.
- **Замена enum** — объект `as const` и выведенный union (или просто union строковых литералов):

```ts
export const Color = { Red: "red", Green: "green" } as const;
export type Color = (typeof Color)[keyof typeof Color];
```

- **Замена parameter properties** — явные поля или `#private`-поля (приватность в рантайме вместо `private`). **Замена runtime-namespace** — ES-модули (`import * as ns`).

```ts
// Было: constructor(private readonly db: Db) {}
export class UserRepo {
  readonly #db: Db;
  constructor(db: Db) { this.#db = db; }
}
```

- **Когда транспайлер всё ещё нужен** (декораторы, `paths`, JSX, `.ts` в опубликованных зависимостях, Node < 22.18): **tsx** (esbuild, `node --import tsx`), swc (`@swc-node/register`) или шаг сборки (tsc / tsdown / esbuild). ts-node не сопровождается с 2023-12 `[устарело]` → type stripping / tsx. Bun и Deno запускают TS нативно, включая enum; Deno также проверяет типы через `deno check`. Подробно — [toolchain.md](toolchain.md).
- **Не публикуйте `.ts` для Node-потребителей.** Node отказывается стирать типы внутри `node_modules`. Публикуйте JS + `.d.ts` ([Публикация типов](#публикация-типов)). Исключение — JSR: он принимает исходники на TS и генерирует `.d.ts`/JS для npm-потребителей (см. [domains-client.md](domains-client.md)).
- **Производительность.** Стриппинг — один проход Wasm на файл при загрузке. Холодный старт больших приложений меряйте через `--cpu-prof`. Compile cache Node (`module.enableCompileCache()` / `NODE_COMPILE_CACHE`) кэширует и результат стриппинга `[не проверено]`. См. [performance.md](performance.md). Продакшен-образы обычно всё ещё везут собранный JS: нет стоимости стриппинга при каждом старте, а ошибки типов падают на сборке. Это вопрос выбора — см. [Спорные места](#спорные-места).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js: Modules — TypeScript](https://nodejs.org/api/typescript.html) | Node.js docs (страница v26.12.0) | Официальный статус, таблица истории, неподдерживаемое, рекомендуемый tsconfig, `#`-импорты вместо `paths` |
| [Running TypeScript Natively](https://nodejs.org/en/learn/typescript/run-natively) | Node.js Learn | Руководство по прямому запуску `.ts` |
| [Introduction to TypeScript](https://nodejs.org/en/learn/typescript/introduction) | Node.js Learn | Обзор TS в Node |
| [Running TypeScript code using transpilation](https://nodejs.org/en/learn/typescript/transpile) | Node.js Learn | Когда нужна транспиляция |
| [Running TypeScript with a runner](https://nodejs.org/en/learn/typescript/run) | Node.js Learn | Варианты tsx / ts-node |
| [nodejs/amaro](https://github.com/nodejs/amaro) | Node.js | Библиотека стриппинга (SWC → Wasm), можно подключить как loader |
| [ts-blank-space](https://github.com/bloomberg/ts-blank-space) | Bloomberg (Ashley Claymore) | Эталонный «стиратель» типов в пробелы; объясняет идею «erasable» |
| [ts-blank-space playground](https://bloomberg.github.io/ts-blank-space/) | Bloomberg | Песочница и заметки о дизайне |
| [proposal-type-annotations](https://github.com/tc39/proposal-type-annotations) | TC39 (Rosenwasser, Claymore et al.) | Предложение «types as comments» (Stage 1) — долгосрочная мотивация |
| [Everything you need to know about Node.js type stripping](https://satanacchio.hashnode.dev/everything-you-need-to-know-about-nodejs-type-stripping) | Marco Ippolito, 2025 | Автор type stripping в Node объясняет дизайн |
| [module: unflag --experimental-strip-types (#56350)](https://github.com/nodejs/node/pull/56350) | Node.js (Marco Ippolito), слит 2024-12-26 | PR, который включил стриппинг по умолчанию |
| [nodejs/typescript](https://github.com/nodejs/typescript) | Node.js | Репозиторий команды «TypeScript support in Node.js core» |
| [tsx](https://tsx.is/) | Hiroki Osame | Документация tsx (watch, loaders, `paths` из tsconfig) |
| [privatenumber/tsx](https://github.com/privatenumber/tsx) | Hiroki Osame | Исходники |
| [TypeStrong/ts-node](https://github.com/TypeStrong/ts-node) | TypeStrong | Последний релиз 10.9.2 (2023-12). `[устарело]` → type stripping / tsx |
| [Deno: TypeScript](https://docs.deno.com/runtime/fundamentals/typescript/) | Deno | Нативный TS с проверкой типов (`deno check`) |
| [Bun: TypeScript](https://bun.sh/docs/runtime/typescript) | Bun | Нативная транспиляция TS |
| [Running TypeScript in Node.js: tsx vs ts-node vs native](https://blog.logrocket.com/running-typescript-node-js-tsx-vs-ts-node-vs-native) | LogRocket | Сравнение tsx, ts-node и встроенного стриппинга |
| [TIL: Node.js type stripping](https://limulus.net/tils/nodejs/type-stripping/) | limulus.net | Короткая заметка о стриппинге по умолчанию |

## Паттерны типизации

Все фрагменты ниже проходят проверку TS 7.0.2 и 6.0.3 с конфигом сервиса из [Рекомендуемых tsconfig](#рекомендуемые-tsconfig) (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). Каждая строка с `@ts-expect-error` действительно даёт ошибку (проверено локально).

**Ключевые выводы**
- **Discriminated unions + исчерпывающий `switch`.** Описывайте состояния как `{ kind: "a"; ... } | { kind: "b"; ... }` и завершайте `switch` веткой `default` с присваиванием в `never`. Новый вариант тогда даёт ошибку компиляции в каждом `switch`. В линтере добавьте `@typescript-eslint/switch-exhaustiveness-check`, для вложенного сопоставления — `.exhaustive()` из ts-pattern. Это TS-форма принципа «make illegal states unrepresentable».

```ts
type Job =
  | { kind: "email"; to: string }
  | { kind: "resize"; width: number; height: number };

function describe(job: Job): string {
  switch (job.kind) {
    case "email": return `mail to ${job.to}`;
    case "resize": return `resize ${job.width}x${job.height}`;
    default: {
      const unreachable: never = job; // новый kind → ошибка компиляции здесь
      throw new Error(`unknown job: ${JSON.stringify(unreachable)}`);
    }
  }
}
```

- **Branded (номинальные) типы для ID, единиц и проверенных строк.** Значения создаются только в парсере (`parseUserId(raw): Result<UserId, …>`) или схеме (`z.string().brand<"UserId">()`, `v.brand()` в Valibot, `.brand()` в ArkType). Brand стираем и ничего не стоит в рантайме. Передача обычного `string` туда, где ждут `UserId`, отклоняется (проверено локально). Brand лучше `enum`, который под стриппингом не запускается.

```ts
declare const UserIdBrand: unique symbol;
type UserId = string & { readonly [UserIdBrand]: true };

function parseUserId(raw: string): UserId {
  if (!/^u_[a-z0-9]{12}$/.test(raw)) throw new Error("bad user id");
  return raw as UserId;               // единственное место с `as`
}
declare function loadUser(id: UserId): Promise<void>;
// @ts-expect-error: голая строка не UserId
loadUser("u_123");
```

- **`satisfies` (4.9)** проверяет значение по типу, сохраняя литеральные типы. `{ home: "/" } satisfies Record<string, `/${string}`>` оставляет `routes.home: "/"` (проверено локально). Используйте для конфигов, таблиц маршрутов и карт обработчиков вместо аннотации `: Type`, которая расширяет тип. Сочетайте с `as const` для readonly-литералов.

```ts
const routes = { home: "/", user: "/users/:id" } as const satisfies Record<string, `/${string}`>;
type RouteName = keyof typeof routes; // "home" | "user"
```

- **Объекты `as const` вместо enum** (см. [Type stripping в Node](#type-stripping-в-node)): `const Level = {...} as const; type Level = (typeof Level)[keyof typeof Level]`. Стираемы, хорошо tree-shake-ятся, дружат с JSON.
- **Гигиена generics.** Доверяйте выводу, ограничивайте через `extends`, не вводите параметр типа, который встречается один раз («golden rule of generics» Вандеркама). `const`-параметры типа (5.0) выводят литеральные кортежи. `NoInfer<T>` (5.4) не даёт параметру влиять на вывод: `pick(["a","b"], "z")` — ошибка. Выводимые type predicates (5.5): `arr.filter(x => x !== undefined)` возвращает `number[]`, касты после `.filter(Boolean)` не нужны (оба поведения проверены локально).

```ts
function pick<const K extends string>(keys: readonly K[], fallback: NoInfer<K>): K {
  return keys.includes(fallback) ? fallback : keys[0]!;
}
pick(["a", "b"], "a");
// @ts-expect-error: "z" не входит в "a" | "b"
pick(["a", "b"], "z");

const nums = [1, undefined, 3].filter((x) => x !== undefined); // number[]
```

- **`unknown` на границах, никогда `any`.** `JSON.parse`, `req.body`, `res.json()`, payload сообщений, `catch (e)` (с `useUnknownInCatchVariables`) и переменные окружения — `unknown`, пока не разобраны ([Валидация в рантайме](#валидация-в-рантайме)). `any` отключает проверку транзитивно. Утечки ловят правила typescript-eslint `no-unsafe-*` и `no-explicit-any`. `ts-reset` (не обновлялся с 2024-09) делает `JSON.parse` и `fetch().json()` возвращающими `unknown`.
- **Утилитарные типы, которые надо знать:** `Partial`, `Required`, `Readonly`, `Pick`, `Omit` (не дистрибутивен по union — при нужде пишите `DistributiveOmit`), `Record`; `Exclude`, `Extract`, `NonNullable`; `ReturnType`, `Parameters`, `Awaited`, `InstanceType`, `ConstructorParameters`; template literal types для строковых протоколов (`` `user:${string}` ``). Остальное — из `type-fest` (5.10, сопровождается), а не самописное.
- **Входы — readonly по умолчанию:** принимайте `readonly T[]` / `ReadonlyArray<T>`, `Readonly<Config>`, `ReadonlyMap`; возвращайте конкретные типы. `readonly` в TS работает только при компиляции; если важна неизменяемость в рантайме — `Object.freeze` `[не проверено]`.
- **Типизированные ошибки без исключений как управляющего потока.** Для *ожидаемых* отказов в доменном коде — маленький union `Result<T, E>` (`{ ok: true, value } | { ok: false, error }`); `throw` — для ошибок программиста и действительно исключительных ситуаций; причина ошибки — `new Error(msg, { cause })`, где `cause: unknown`. Библиотеки вроде neverthrow и Effect — спорная тема ([Result, neverthrow и Effect](#result-neverthrow-и-effect)). Самописная версия стираема, без зависимостей и занимает ~5 строк (проверено локально):

```ts
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T,>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E,>(error: E): Result<never, E> => ({ ok: false, error });
```

- **`using` / `await using` (TS 5.2, рантайм Node 24)** — детерминированная очистка ресурсов. `class Conn implements AsyncDisposable { async [Symbol.asyncDispose]() {} }` прошёл проверку с `lib: ["es2024","esnext.disposable"]` (проверено локально). Node 24 поддерживает синтаксис нативно. Рантайм-детали — в [idioms-patterns.md](idioms-patterns.md).
- **Типизация API Node.** Импорты `node:` типизированы через `@types/node`. Generic-события `EventEmitter<{ data: [Buffer]; end: [] }>` (`@types/node` ≥ 20.x) `[не проверено]`. `AbortSignal` — в каждом асинхронном API. `NodeJS.ProcessEnv` для окружения разбирайте, не доверяйте индексу `string | undefined`. Типизированный `AsyncLocalStorage<Store>`. `util.parseArgs` выводит типы опций из `const`-конфига.
- **Declaration merging и module augmentation** (`declare module "fastify" { interface FastifyRequest { user: User } }` или блок `declare global` в `.d.ts`) — так фреймворки типизируют добавленные к запросу поля. Держите все augmentations в одном файле `types/*.d.ts`, включённом в tsconfig.
- **Производительность на уровне типов.** Глубокие условные или рекурсивные типы и огромные union замедляют `tsc` и редактор. Диагностика: `tsc --extendedDiagnostics` (смотрите Instantiations и Check time) и `tsc --generateTrace dir` + `@typescript/analyze-trace`. Проверено локально: TS 7.0.2 поддерживает `--generateTrace` (пишет `trace.json`, `legend.json` и `types_N.json` по одному на чекер), `@typescript/analyze-trace` 0.11.1 разбирает эту трассу и показывает горячие точки так же, как для 6.0.3. Для расширения объектов предпочитайте interface пересечениям. Аннотируйте типы возврата экспортируемых функций — это помогает и `isolatedDeclarations`. Пример: Zod 4 сократил число инстанцирований типов в простом файле с >25 000 до ~175 по сравнению с Zod 3.

```bash
npx tsc --noEmit --extendedDiagnostics          # Instantiations, Check time
npx tsc --noEmit --generateTrace trace-out      # затем анализ трассы
npx @typescript/analyze-trace trace-out
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) | TypeScript team | Сужение, discriminated unions, исчерпываемость через `never` |
| [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) | TypeScript team | Основы generics |
| [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) | TypeScript team | Встроенные утилитарные типы |
| [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) | TypeScript team | Условные и дистрибутивные типы |
| [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) | TypeScript team | Mapped types, переназначение ключей |
| [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) | TypeScript team | Template literal types |
| [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) | TypeScript team | Readonly, индексные сигнатуры, пересечения против interface |
| [TypeScript 4.9 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html) | TypeScript team | `satisfies` |
| [TypeScript 5.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html) | TypeScript team | `const`-параметры типа, `verbatimModuleSyntax`, массив в `extends` |
| [TypeScript 5.2 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html) | TypeScript team | Объявления `using` |
| [TypeScript 5.4 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html) | TypeScript team | `NoInfer`, сужение в замыканиях |
| [TypeScript 5.5 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html) | TypeScript team | Выводимые type predicates, `isolatedDeclarations`, JSDoc-тег `@import` |
| [Total TypeScript](https://www.totaltypescript.com/) | Matt Pocock | Статьи и советы: generics, `satisfies`, branded types |
| [Learning TypeScript: articles](https://www.learningtypescript.com/articles/) | Josh Goldberg | Статьи мейнтейнера typescript-eslint |
| [type-challenges](https://github.com/type-challenges/type-challenges) | сообщество | Упражнения на уровне типов |
| [ts-pattern](https://github.com/gvergnaud/ts-pattern) | Gabriel Vergnaud | Исчерпывающий pattern matching (`.exhaustive()`) |
| [type-fest](https://github.com/sindresorhus/type-fest) | Sindre Sorhus | Утилитарные типы |
| [ts-reset](https://github.com/total-typescript/ts-reset) | Matt Pocock | Безопасные встроенные типы (`JSON.parse` → unknown). Последний релиз 2024-09 |
| [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) | Alexis King, 2019 | Основание для brand-типов и разбора на границе |
| [Support some non-structural (nominal) type matching (#202)](https://github.com/microsoft/TypeScript/issues/202) | сообщество, 2014– | Почему brand-типы вообще нужны |
| [TypeScript Wiki: Performance](https://github.com/microsoft/TypeScript/wiki/Performance) | TypeScript team | Как писать код, который быстро проверяется; `--extendedDiagnostics` |
| [TypeScript Wiki: Performance Tracing](https://github.com/microsoft/TypeScript/wiki/Performance-Tracing) | TypeScript team | Работа с `--generateTrace` |
| [typescript-analyze-trace](https://github.com/microsoft/typescript-analyze-trace) | Microsoft | Поиск горячих точек в трассе |
| [TypeScript Playground](https://www.typescriptlang.org/play) | TypeScript team | Песочница с переключением версий TS |
| [TypeScript function syntaxes](https://kentcdodds.com/blog/typescript-function-syntaxes) | Kent C. Dodds | Шпаргалка по синтаксису типизации функций |

## Валидация в рантайме

**Ключевые выводы**
- **Правило: типы стираются, поэтому каждому недоверенному входу нужен рантайм-парсер, который выдаёт статический тип** (`z.infer`, `v.InferOutput`, `typeof T.infer`, `Static<typeof T>`). Границы: тело, query и заголовки HTTP, переменные окружения, файлы, сообщения очередей, ответы сторонних API, строки БД из нетипизированных драйверов. Разбирайте один раз на краю, внутрь передавайте типизированные (лучше — branded) значения.
- **Zod 4 (4.0.0 от 2025-07-09; текущая 4.6.7) — выбор по умолчанию.** Цифры вендора против Zod 3: разбор строк быстрее в 14,7 раза, массивов — в 7,4, объектов — в 6,5; инстанцирования типов в простом файле >25 000 → ~175; ядро 5,36 kB gz (Zod Mini — 1,88 kB). Новое в 4: `zod/mini` (функциональный API, хорошо tree-shake-ится); собственный `z.toJSONSchema()` (`zod-to-json-schema` больше не нужен); реестры метаданных (`.meta()`, `z.globalRegistry`); единый параметр `error` вместо `message`/`errorMap`; форматы верхнего уровня (`z.email()`, `z.uuid()`), `z.string().email()` устарел; subpath-ы `zod/v3` и `zod/v4` для миграции.
- **Valibot 1.x** (1.0 от 2025-03-19) — модульный (`v.pipe(v.string(), v.email())`), самые маленькие бандлы; лучший выбор, когда важен размер (edge и общий с браузером код).
- **ArkType 2.x** (2.0 от 2025-01-17) — строковый синтаксис в духе TS (`type({ id: "string.uuid", "age?": "number.integer" })`), оптимизирован под скорость валидации.
- **TypeBox 1.x** (теперь пакет `typebox`; 1.0 от 2025-09-09) строит JSON Schema напрямую. Естественный выбор для Fastify и OpenAPI (`@fastify/type-provider-typebox` 6.3.0); `Compile()` даёт JIT-валидаторы.
- **Ajv** 8.20 (JSON Schema, используется Fastify) — точка отсчёта.
- **typia** генерирует валидаторы из обычных TS-типов при компиляции. Нужен трансформер TS (ts-patch), а это привязка к JS API 6.x; совместимость с 7.x `[не проверено]`.
- **Standard Schema** (`@standard-schema/spec` 1.1.0) — общий интерфейс: `schema["~standard"] = { version: 1, vendor, validate(input) → { value } | { issues }, types? }`. Его реализуют Zod, Valibot и ArkType. Локально одна generic-функция `validate<S extends StandardSchemaV1>(s, input): Promise<StandardSchemaV1.InferOutput<S>>` приняла все три и вывела `id: string` для каждой. В семейство спецификаций входят также `StandardTypedV1` и `StandardJSONSchemaV1` (конвертер `jsonSchema.input/output({ target })`; рекомендуемые target — `draft-2020-12` и `draft-07`). **Код фреймворков и библиотек пишите против Standard Schema, а не конкретного валидатора.** tRPC, Hono, TanStack и другие его принимают `[не проверено]` (список потребителей).

```ts
import type { StandardSchemaV1 } from "@standard-schema/spec";

export async function validate<S extends StandardSchemaV1>(
  schema: S,
  input: unknown,
): Promise<StandardSchemaV1.InferOutput<S>> {
  const result = await schema["~standard"].validate(input);
  if (result.issues) {
    throw new Error(result.issues.map((i) => i.message).join("; "));
  }
  return result.value;
}
// validate(zodSchema, body), validate(valibotSchema, body), validate(arktypeType, body) — одна функция
```

- **Локальная пропускная способность** (проверено локально на Node 24.17, Windows 11): валидация 20 000 корректных объектов из 6 полей, медиана 5 чередующихся раундов после 2 прогревов, нормировано на скомпилированный Ajv (меньше — быстрее; два прогона):

| Валидатор | Время относительно Ajv |
|---|---|
| TypeBox 1.4 `Compile(T).Check` | 0,6–0,7× |
| ArkType 2.2 | 0,7–1,2× |
| Ajv 8.20 compiled | 1,0× |
| Zod 4.6 `safeParse` | 3,9–4,7× |
| Zod 4.6 `parse` | 5,3–6,0× |
| Valibot 1.5 `parse` | 16–17× |

  Оговорки: Check-валидаторы (TypeBox, Ajv) возвращают только boolean, а Zod и Valibot строят новый объект (отбрасывая неизвестные ключи). В абсолютных числах все укладываются в микросекунды на объект, так что валидация редко бывает узким местом HTTP-обработчика. Выбирайте по экосистеме и удобству, пока профайлер не скажет иное. Сравнить на своих данных — `../scripts/bench_compare.mjs`; шире по библиотекам — бенчмарк moltar.
- **Env и конфиг:** разберите `process.env` один раз при старте схемой (Zod/Valibot/ArkType или `@t3-oss/env-core` 0.13, `envalid` 9.0, `znv` 1.0) и экспортируйте замороженный типизированный объект. Падайте сразу с понятным сообщением. `--env-file` в Node только загружает переменные, но не проверяет их.

```ts
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}
export const env = Object.freeze(parsed.data);
```

- **OpenAPI и type providers.** В Fastify используйте type provider (`@fastify/type-provider-typebox`, `fastify-type-provider-zod` 7.0): схема маршрута одновременно валидирует и задаёт типы обработчика. Для contract-first генерируйте типы из OpenAPI (openapi-typescript), а не пишите их руками. См. [domains-server.md](domains-server.md).
- **Приведение против строгости.** Query и env — строки. Приводите явно (`z.coerce.number()`, `v.pipe(v.string(), v.toNumber())`). Не принимайте молча лишние ключи в чувствительных к безопасности payload-ах: `z.strictObject` / `v.strictObject` или `"+": "reject"` в ArkType `[не проверено]`.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Zod](https://zod.dev/) | Colin McDonnell | Документация Zod |
| [Zod 4](https://zod.dev/v4) | Colin McDonnell, 2025 | Заметки о релизе 4 и цифры |
| [Zod 4 changelog](https://zod.dev/v4/changelog) | Colin McDonnell | Миграция 3 → 4 |
| [Zod Mini](https://zod.dev/packages/mini) | Colin McDonnell | Zod Mini |
| [Zod: JSON Schema](https://zod.dev/json-schema) | Colin McDonnell | `z.toJSONSchema()` |
| [colinhacks/zod](https://github.com/colinhacks/zod) | Colin McDonnell | Исходники Zod |
| [Valibot](https://valibot.dev/) | Fabian Hiller | Документация Valibot |
| [Valibot: comparison](https://valibot.dev/guides/comparison/) | Fabian Hiller | Сравнение дизайна Valibot и Zod |
| [fabian-hiller/valibot](https://github.com/fabian-hiller/valibot) | Fabian Hiller | Исходники Valibot |
| [ArkType](https://arktype.io/) | David Blass | Документация ArkType |
| [ArkType: your first type](https://arktype.io/docs/intro/your-first-type) | David Blass | Введение в синтаксис |
| [arktypeio/arktype](https://github.com/arktypeio/arktype) | David Blass | Исходники ArkType |
| [sinclairzx81/typebox](https://github.com/sinclairzx81/typebox) | Haydn Paterson | Исходники и README TypeBox 1.x |
| [TypeBox docs](https://sinclairzx81.github.io/typebox/) | Haydn Paterson | Документация TypeBox |
| [Standard Schema](https://standardschema.dev/) | Colin McDonnell, Fabian Hiller, David Blass, 2024– | Спецификация: `StandardSchemaV1`, `StandardJSONSchemaV1` |
| [standard-schema/standard-schema](https://github.com/standard-schema/standard-schema) | Standard Schema | Репозиторий спецификации, список реализаций |
| [Ajv](https://ajv.js.org/) | Evgeny Poberezkin et al. | Валидатор JSON Schema |
| [typia](https://typia.io/) | Jeongho Nam | AOT-валидаторы из TS-типов (трансформер) |
| [TypeScript runtime type benchmarks](https://moltar.github.io/typescript-runtime-type-benchmarks/) | Roman Filippov (moltar) | Сравнение библиотек валидации |
| [moltar/typescript-runtime-type-benchmarks](https://github.com/moltar/typescript-runtime-type-benchmarks) | moltar | Исходники бенчмарка |
| [Fastify: Type Providers](https://fastify.dev/docs/latest/Reference/Type-Providers/) | Fastify | Type providers |
| [fastify-type-provider-zod](https://github.com/fastify/fastify-type-provider-zod) | Fastify community | Provider для Zod |
| [openapi-typescript](https://openapi-ts.dev/) | openapi-ts (Drew Powers et al.) | Генерация TS-типов из OpenAPI |
| [tRPC: validators](https://trpc.io/docs/server/validators) | tRPC | Валидаторы, включая Standard Schema |
| [T3 Env](https://env.t3.gg/docs/introduction) | T3 OSS | Типизированная проверка env |
| [Effect Schema](https://effect.website/docs/schema/introduction/) | Effect team | Effect Schema (внутри `effect` с 3.10; `@effect/schema` deprecated) |

## Тесты типов

**Ключевые выводы**
- **Тестируйте типы публичных API**: вывод generics, перегрузки, типы из схем, brand-типы. Для библиотек обязательно, для ключевых доменных типов приложения полезно.
- **Инструменты.** **Vitest** `expectTypeOf`/`assertType` в файлах `*.test-d.ts`, запуск `vitest --typecheck` (запускает `tsc --noEmit` и сообщает также об ошибках в исходниках). **expect-type** отдельно (1.4.0, его использует Vitest) — обычные `.ts`-утверждения, которые проверяет ваш `tsc`; локально работает под TS 7. **tstyche** 7.2 — свой раннер, проверяет против нескольких установленных версий TS, что важно в переходе 6 → 7. **tsd** 0.33 — несёт форк TS, отстаёт от новых версий, работает с `.d.ts`. **@ark/attest** 0.58 — утверждения плюс *бенчмарки* инстанцирования типов, ловят регрессии производительности типов.
- **`// @ts-expect-error` — простейший негативный тест**: падает, если строка *не* даёт ошибку. Используйте его вместо `@ts-ignore`, который прячет всё. Vitest предупреждает: опечатка в строке с `@ts-expect-error` может пройти молча, поэтому файл стоит ещё и выполнить, чтобы поймать `ReferenceError`. Правило typescript-eslint `ban-ts-comment` может требовать описание.
- **Тестируйте на тех версиях TS, что у пользователей.** Библиотека указывает минимальную версию TS (через `typesVersions` или просто в документации) и гоняет CI на ней и на последней (в 2026 — 6.0 и 7.0). DefinitelyTyped поддерживает версии TS моложе 2 лет.

```ts
// src/parse.test-d.ts — запуск: npx vitest --typecheck
import { expectTypeOf, test } from "vitest";
import { ok, type Result } from "./result.ts";

test("ok() infers value type", () => {
  expectTypeOf(ok(42)).toEqualTypeOf<Result<number, never>>();
  // @ts-expect-error: строка не число
  expectTypeOf(ok("x")).toEqualTypeOf<Result<number, never>>();
});
```

Запуск тестов и Vitest в целом — [testing.md](testing.md).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Vitest: Testing Types](https://vitest.dev/guide/testing-types) | Vitest team | `expectTypeOf`, `*.test-d.ts`, `--typecheck`, оговорки |
| [mmkal/expect-type](https://github.com/mmkal/expect-type) | Misha Kaletsky | Библиотека и документация матчеров |
| [TSTyche](https://tstyche.org/) | Tom Mrazauskas | Раннер тестов типов, несколько версий TS |
| [tsdjs/tsd](https://github.com/tsdjs/tsd) | Sam Verschueren et al. | tsd |
| [@ark/attest](https://github.com/arktypeio/arktype/tree/main/ark/attest) | David Blass | Утверждения о типах и бенчмарки инстанцирования |
| [typescript-eslint: ban-ts-comment](https://typescript-eslint.io/rules/ban-ts-comment/) | typescript-eslint | Правила для `@ts-expect-error` |

## JSDoc в JS-проектах

**Ключевые выводы**
- **`allowJs` + `checkJs` + `strict`** дают почти полную проверку `.js`-файлов с JSDoc-аннотациями. С `declaration` + `emitDeclarationOnly` tsc пишет `.d.ts` для JS-библиотеки. Локально TS 7.0.2 проверил JS-файл и сгенерировал корректные декларации для `/** @import { User } from "./types.ts" */` (тег `@import` из TS 5.5, без рантайм-импорта), `@param`/`@returns`, `@template {readonly unknown[]} T`, `@satisfies`, `@type {Record<string, number>}` и `// @ts-expect-error`.

```js
// @ts-check
/** @import { User } from "./types.ts" */

/**
 * @param {User} user
 * @param {number} [limit]
 * @returns {string[]}
 */
export function tagsOf(user, limit = 10) {
  return user.tags.slice(0, limit);
}

/** @satisfies {Record<string, number>} */
export const LIMITS = { free: 10, pro: 100 };
```

Для `.d.ts` JS-библиотеки к конфигу сервиса добавьте `"allowJs": true, "checkJs": true, "declaration": true, "emitDeclarationOnly": true, "outDir": "dist"` и уберите `noEmit`.

- **TS 7 (Go) убрал устаревшие возможности JSDoc/Closure:** функциональные типы Closure `function(string): void`, тип `?` и namepath-ы `Module:file~id`; `@typedef` и `@enum`, названные идентификатором; конструкторы-функции через `@class`/`@constructor` (используйте `class`); значения в роли типов (используйте `typeof`); expando-паттерн `f.x = f.x || init`; смешение `module.exports =` и `module.exports.x =`; rest-параметры, выводимые из `arguments`. Генерация `.d.ts` из JS переписана; побайтовое совпадение с 6.0 не цель. JS-кодовые базы на JSDoc эпохи Closure должны мигрировать до перехода на 7.0 или оставаться на `tsc6`.
- **Когда JSDoc, а когда `.ts`.** Node запускает стираемый `.ts` напрямую, поэтому исходный довод JSDoc «без шага сборки» в 2026 году сильно ослаб. JSDoc остаётся разумным для существующих JS-кодовых баз (постепенно: `// @ts-check` пофайлово), для конфигов (`/** @type {import('eslint').Linter.Config[]} */`) и для проектов, мейнтейнеры которых его предпочитают (известные примеры — Svelte, webpack). Новый Node-код: пишите `.ts` со стираемым синтаксисом.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) | TypeScript team | Поддерживаемые JSDoc-теги |
| [Type Checking JavaScript Files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html) | TypeScript team | Семантика `checkJs` |
| [Creating .d.ts Files from .js files](https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html) | TypeScript team | Генерация `.d.ts` из JS |

Отличия TS 7 для JSDoc и CommonJS подробно — в [typescript-go CHANGES.md](https://github.com/microsoft/typescript-go/blob/main/CHANGES.md); тег `@import` — в release notes 5.5 (ссылки в разделах выше).

## Версия @types/node и глобальные типы

**Ключевые выводы**
- **Мажорная версия `@types/node` = *минимальная* поддерживаемая версия Node** (`engines.node`). Пример: `"engines": { "node": ">=24" }` → `"@types/node": "^24"`. `latest` (26.x) типизирует API, которых в вашем рантайме может не быть. Patch — собственный счётчик пакета и с patch-версией Node не совпадает. Ветки по мажорам поддерживаются: существуют 22.20.x, 24.19.x и 26.6.x. Минорные версии `@types/node` отстают от Node: 24.19 против Node 24.22.
- DefinitelyTyped версионирует пакеты как `major.minor` библиотеки плюс свой patch и тестирует только на версиях TS моложе 2 лет.
- **С TS 6.0 `types` по умолчанию `[]`.** Без `"types": ["node"]` на `process`, `Buffer`, `__dirname` и `NodeJS.*` выдаётся «Cannot find name». `import ... from "node:fs"` при этом резолвится: импорт модуля не ambient.
- **Изменение `ArrayBuffer` в 5.9.** `ArrayBuffer` больше не супертип typed arrays и `Buffer`, поэтому старые `@types/node` неверно типизируют `Buffer` (`Buffer<ArrayBufferLike>`). Обновляйте `@types/node` вместе с TS; `buf.buffer` передавайте только там, где действительно нужен `ArrayBuffer`.
- **Не смешивайте `lib: ["dom"]` и `@types/node` в серверном коде**: получите дублирующиеся или конфликтующие `fetch`, `Request`, `setTimeout` (number против `Timeout`) и `URL` `[не проверено]`. Для изоморфных пакетов держите два tsconfig или типизируйте против общего подмножества WinterTC.
- **Типизация `process.env`.** Augmentation `NodeJS.ProcessEnv` (`declare global { namespace NodeJS { interface ProcessEnv { PORT?: string } } }`) только документирует имена, но ничего не проверяет. Предпочитайте разобранный объект `env` ([Валидация в рантайме](#валидация-в-рантайме)) `[не проверено]`.
- **`@types/*` для других пакетов:** большинство современных пакетов поставляют свои типы. Удаляйте устаревший `@types/x`, если `x` уже несёт типы: дублирующиеся декларации могут конфликтовать. knip находит неиспользуемые `@types`.

```bash
npm i -D @types/node@^24          # = нижняя граница engines.node
npm view @types/node dist-tags    # теги ts5.6 … ts7.1
npx knip                           # неиспользуемые зависимости, @types и экспорты
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [@types/node](https://www.npmjs.com/package/@types/node) | DefinitelyTyped | Версии, dist-теги `tsX.Y`, ветки по мажорам |
| [DefinitelyTyped: types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node) | DefinitelyTyped | Исходники типов Node |
| [DefinitelyTyped README](https://github.com/DefinitelyTyped/DefinitelyTyped#readme) | DefinitelyTyped | Правила версионирования, окно поддержки TS в 2 года |
| [tsconfig: types](https://www.typescriptlang.org/tsconfig/#types) | TypeScript team | Опция `types` |
| [knip](https://knip.dev/) | Lars Kappert | Неиспользуемые зависимости, `@types`, экспорты |

## Публикация типов

**Ключевые выводы**
- **Публикуйте JS + `.d.ts` (+ `.d.ts.map` + `src/` для go-to-definition).** Условие `"types"` ставьте **первым** в каждой записи `exports`. В dual-пакетах каждому формату нужен свой файл деклараций (`.d.mts`/`.d.cts` или каталоги по форматам). Один `.d.ts` на ESM и CJS — классический баг «Masquerading as ESM/CJS». Для новых библиотек под Node ≥ 22.12 разумно по умолчанию публиковать только ESM: CJS-потребители могут сделать `require(esm)`. Детали — [domains-client.md](domains-client.md).
- **Перед публикацией запускайте в CI `publint` и `attw --pack`.** Локально на ESM-only пакете publint 0.3.25 сообщил «All good!». attw 0.18.5 без профиля пометил `node10: Resolution failed` и `node16 (from CJS): ESM (dynamic import only)`; с `--profile esm-only` эти пункты игнорируются, показаны 🟢 для node16-from-ESM и bundler.
- Виды проблем attw: Resolution failed, No types, Masquerading as CJS/ESM, ESM (dynamic import only), Used fallback condition, CJS default export, Incorrect default export, Missing `export =`, Unexpected module syntax, Internal resolution error, Named exports.

```bash
npx tsc -p tsconfig.json                                   # или tsdown
npx publint
npx @arethetypeswrong/cli --pack . --profile esm-only      # для dual-пакета — без профиля
```

- **Способы генерации деклараций.** `tsc` (`declaration`, `declarationMap`, `stripInternal` + `/** @internal */`). **tsdown** (Rolldown, 0.23.7) / **tsup** (esbuild) собирают JS и умеют собирать `.d.ts`; с `isolatedDeclarations` декларации генерируются через oxc без полной проверки типов — быстро и параллельно. **@microsoft/api-extractor** 7.60 — сборка `.d.ts` в один файл плюс отчёт `api.md`, в котором изменения публичного API видны в диффе PR. **rollup-plugin-dts** 6.5. dts-bundle-generator не обновлялся с 2024-04. С TS 7.0 плагины бандлеров для `.d.ts`, которые вызывают API TS, требуют алиас `typescript6`, пока не появится API 7.1 `[не проверено]`.
- **`rewriteRelativeImportExtensions` и спецификаторы в `.d.ts`.** С этим флагом выходные `.d.ts` сохраняют спецификаторы `"./result.ts"` (и в TS 6.0.3, и в 7.0.2), а attw резолвит их нормально (проверено локально). Если у потребителей старый TS (< 5.0) — проверьте; иначе это безвредно.
- **`isolatedDeclarations`** в библиотеке — условие быстрой генерации `.d.ts` в tsdown/oxc и параллельной сборки монорепозитория (см. [Флаги tsconfig для Node](#флаги-tsconfig-для-node)). Требует явных типов возврата у экспортов.
- **Semver на уровне типов.** Сужение типа параметра, расширение типа возврата, новое обязательное свойство во входном интерфейсе или изменение вывода — **ломающие изменения** для потребителей. Сделать их видимыми на ревью помогают отчёты api-extractor или тесты типов ([Тесты типов](#тесты-типов)). Документируйте минимальную версию TS и тестируйте на ней (DefinitelyTyped поддерживает 2 года) `[не проверено]`.
- **JSR** принимает исходники на TS и генерирует документацию и `.d.ts`. Требует явных типов возврата у экспортов (правило «slow types» ≈ `isolatedDeclarations`). Полезен для пакетов, общих с Deno.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Are the types wrong?](https://arethetypeswrong.github.io/) | Andrew Branch | Веб-интерфейс attw |
| [arethetypeswrong repo](https://github.com/arethetypeswrong/arethetypeswrong.github.io) | Andrew Branch | CLI, виды проблем, docs/problems/*.md |
| [CJSResolvesToESM](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/CJSResolvesToESM.md) | Andrew Branch | Разбор проблемы «ESM (dynamic import only)» |
| [publint](https://publint.dev/) | Bjorn Lu | publint |
| [publint rules](https://publint.dev/rules) | Bjorn Lu | Список правил |
| [Declaration Files: Introduction](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html) | TypeScript team | Как писать `.d.ts` |
| [Declaration Files: Publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html) | TypeScript team | Публикация типов |
| [API Extractor](https://api-extractor.com/) | Microsoft (Rushstack) | Отчёт об API и сборка `.d.ts` |
| [tsdown](https://tsdown.dev/) | VoidZero / Kevin Deng | Сборщик библиотек |
| [tsdown: dts](https://tsdown.dev/options/dts) | tsdown | Генерация `.d.ts`, быстрый путь через isolatedDeclarations |
| [rollup-plugin-dts](https://github.com/Swatinem/rollup-plugin-dts) | Arpad Borsos | Сборка `.d.ts` |
| [JSR: publishing packages](https://jsr.io/docs/publishing-packages) | Deno / JSR | Публикация исходников TS, правило slow types |

## Линтинг с типами при переходе на TS 7

**Ключевые выводы**
- **typescript-eslint 8.72 поддерживает TS `>=4.8.4 <6.1.0`.** Ему нужен JS API 6.x, поэтому под TS 7 ставьте схему алиасов из [Статуса компилятора](#статус-компилятора) (`typescript` → `@typescript/typescript6`). Flat config с `parserOptions.projectService: true` и `tseslint.configs.strictTypeChecked` + `stylisticTypeChecked`. Проект настоятельно рекомендует линтинг с типами; его цена — полная сборка программы перед линтингом.

```js
// eslint.config.js
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
);
```

Проверено локально (ESLint 10.14.0, typescript-eslint 8.72.1, TS 7.0.2 + алиас `typescript6`): конфиг ловит `no-floating-promises` в `.ts`. Это минимум: `.js`-файлы вне tsconfig (включая сам `eslint.config.js`) дают «was not found by the project service», а `test()` из `node:test` — `no-floating-promises`. Полный вариант с `disableTypeChecked` для JS и `allowForKnownSafeCalls` — в шаблоне [toolchain.md](toolchain.md#eslintconfigjs-flat-config-eslint-10-type-aware).

- **Правила с типами, которые ловят реальные баги Node:** `no-floating-promises` и `no-misused-promises` (промисы без `await` дают unhandled rejection и обработчики, которые не завершаются); `await-thenable`, `require-await`, `return-await` (в try/catch); `switch-exhaustiveness-check`; `no-unsafe-assignment/-member-access/-call/-return/-argument` (утечки `any`); `no-unnecessary-condition`, `restrict-template-expressions`, `only-throw-error`, `prefer-promise-reject-errors`; `consistent-type-imports` (в паре с `verbatimModuleSyntax`); `no-explicit-any`, `ban-ts-comment`.
- **Type-aware режим oxlint** (`oxlint --type-aware` с `oxlint-tsgolint` 7.0.x) выполняет правила с типами на **typescript-go**. Покрывает 59 из 61 type-aware правила typescript-eslint и **требует TS 7.0+**; `baseUrl` и другие удалённые в 7.0 опции нужно сначала мигрировать. `--type-check` дополнительно выводит ошибки TS и может заменить `tsc --noEmit` в CI. Документация отмечает неполное покрытие и большой расход памяти на очень больших репозиториях. Это путь на нативной скорости для проектов на 7.0.
- `eslint-plugin-erasable-syntax-only` (0.7.2) линтит те же конструкции, что `erasableSyntaxOnly`; полезен для смешанных JS + TS репозиториев и старого TS `[не проверено]`. Ни он, ни флаг не ловят декораторы ([Type stripping в Node](#type-stripping-в-node)).
- Настройка ESLint, oxlint и Biome в целом — [toolchain.md](toolchain.md).

```bash
npx oxlint --type-aware               # правила с типами на typescript-go (нужен TS 7)
npx oxlint --type-aware --type-check  # плюс ошибки TS вместо tsc --noEmit
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Linting with Type Information](https://typescript-eslint.io/getting-started/typed-linting/) | typescript-eslint | `projectService`, конфиги с типами, замечание о производительности |
| [Dependency Versions](https://typescript-eslint.io/users/dependency-versions/) | typescript-eslint | Поддерживаемые версии TS/Node/ESLint |
| [Shared Configs](https://typescript-eslint.io/users/configs/) | typescript-eslint | `strictTypeChecked`, `stylisticTypeChecked` |
| [no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/) | typescript-eslint | Самое ценное правило для Node |
| [switch-exhaustiveness-check](https://typescript-eslint.io/rules/switch-exhaustiveness-check/) | typescript-eslint | Исчерпывающие union |
| [consistent-type-imports](https://typescript-eslint.io/rules/consistent-type-imports/) | typescript-eslint | Стиль `import type` |
| [no-unsafe-assignment](https://typescript-eslint.io/rules/no-unsafe-assignment/) | typescript-eslint | Семейство правил против утечек `any` |
| [no-explicit-any](https://typescript-eslint.io/rules/no-explicit-any/) | typescript-eslint | Запрет `any` |
| [Oxlint: type-aware linting](https://oxc.rs/docs/guide/usage/linter/type-aware.html) | Oxc team | Type-aware oxlint на typescript-go |
| [oxc-project/tsgolint](https://github.com/oxc-project/tsgolint) | Oxc team | Исходники tsgolint |
| [eslint-plugin-erasable-syntax-only](https://github.com/JoshuaKGoldberg/eslint-plugin-erasable-syntax-only) | Josh Goldberg | Правила линтера для нестираемого синтаксиса |
| [--erasableSyntaxOnly (#61011)](https://github.com/microsoft/TypeScript/pull/61011) | TypeScript team, слит 2025-01-23 | PR с флагом `--erasableSyntaxOnly` |

## Result, neverthrow и Effect

**Ключевые выводы**
- **Проблема:** в TS нет checked exceptions — `throws` не видно в сигнатурах, а `catch (e)` имеет тип `unknown`. Варианты от наименее к наиболее инвазивному:
  1. исключения плюс документированные классы ошибок с `cause`;
  2. самописный discriminated union `Result<T, E>` (5 строк, стираемый, без зависимостей) для *ожидаемых* доменных отказов;
  3. Result-библиотека: neverthrow 8.2 (`ok/err`, `ResultAsync`, `.andThen`), true-myth 9.4, typescript-result 3.5, better-result 3.0, ts-results-es 7.1, byethrow 0.13;
  4. **Effect** 4.x: полноценная система эффектов с типизированными ошибками и зависимостями в `Effect<A, E, R>`, структурированная конкурентность, Schema, ретраи и расписания, DI-слои, наблюдаемость.
- **Сигналы сопровождения.** Последний релиз neverthrow в npm — 2025-02-21 (последний push в репозиторий — 2026-02-14, 7,7k звёзд). Он не архивирован, но релизы редкие. fp-ts/io-ts фактически вытеснены Effect (их автор присоединился к Effect) `[устарело]` → `effect`.
- **Effect 4.0** (2026-09-30/10-01) переписан с нуля: ядро без зависимостей, пакеты слиты в `effect`. Цифры вендора против 3.x: бандл 35,6 → 7,1 kB, конкурентная пропускная способность 0,71M → 4,57M задач/с, куча на 50k fibers 157,5 → 21,8 MB. LTS-политика для 4.x: исправления багов минимум до 2029-09. Часть модулей пока помечена `@stability experimental`.
- **Практическая рекомендация** `[не проверено]`. Вариант 2 — для большинства сервисов. Вариант 3 — когда команде нужны комбинаторы в асинхронных конвейерах; учтите, что Result «вирусный»: каждый вызывающий обязан его обработать. Вариант 4 — только если его принимает вся команда: Effect заменяет большие куски привычного Node-стиля (DI, конкурентность, обработку ошибок, конфиг), повышает стоимость онбординга, а стек-трейсы и взаимодействие с promise-библиотеками становятся вопросом дизайна. Не смешивайте варианты 3 и 4 в одной кодовой базе. При любом выборе ошибки программиста (баги, нарушенные инварианты) бросайте и падайте — см. операционные ошибки против ошибок программиста в [idioms-patterns.md](idioms-patterns.md).

```ts
// Вариант 2: ожидаемые отказы — значения, баги — исключения
type ParseError = { code: "empty" | "too_long"; input: string };

function parseTitle(raw: string): Result<string, ParseError> {
  const t = raw.trim();
  if (t.length === 0) return err({ code: "empty", input: raw });
  if (t.length > 200) return err({ code: "too_long", input: raw });
  return ok(t);
}

function handle(input: string): Response {
  const r = parseTitle(input);
  if (!r.ok) return Response.json({ error: r.error.code }, { status: 400 }); // r.error: ParseError
  return Response.json({ title: r.value });                                  // r.value: string
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [neverthrow](https://github.com/supermacro/neverthrow) | Giorgio Delgado | Библиотека Result/ResultAsync |
| [true-myth](https://github.com/true-myth/true-myth) | Chris Krycho | Result/Maybe |
| [typescript-result](https://github.com/everweij/typescript-result) | Erik Verweij | Result с асинхронными цепочками |
| [better-result](https://github.com/dmmulroy/better-result) | Dillon Mulroy | Более новая Result-библиотека (2026) |
| [Effect](https://effect.website/) | Effect team (Michael Arnaldi et al.) | Документация Effect |
| [Effect 4.0 release](https://effect.website/blog/releases/effect/40) | Effect team, 2026-09-30 | Релиз 4.0: переписывание, цифры, LTS |
| [Effect-TS/effect](https://github.com/Effect-TS/effect) | Effect team | Исходники, MIGRATION.md |

## Симптомы и приёмы

| Симптом или замечание ревью | Приём | Где подробнее |
|---|---|---|
| `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` при `node app.ts` | `erasableSyntaxOnly`; enum → объект `as const`, parameter properties → поля, namespace → модуль | [Type stripping в Node](#type-stripping-в-node) |
| `does not provide an export named 'X'` под стриппингом | `verbatimModuleSyntax` + `import type` / `{ type X }` | [Флаги tsconfig для Node](#флаги-tsconfig-для-node) |
| `ERR_MODULE_NOT_FOUND` на `./x.js` при запуске `.ts` | Импортировать `./x.ts`; при emit — `rewriteRelativeImportExtensions` | [Флаги tsconfig для Node](#флаги-tsconfig-для-node) |
| «Cannot find name 'process'» после перехода на TS 6/7 | `"types": ["node"]` (умолчание теперь `[]`) | [Новые умолчания](#новые-умолчания-60-и-удалённые-опции-70) |
| Раскладка `dist/src/...` или TS5011 после обновления | `"rootDir": "src"` | [Новые умолчания](#новые-умолчания-60-и-удалённые-опции-70) |
| TS5101/TS5107 (6.0) или TS5102/TS5108 (7.0) для `baseUrl`, `moduleResolution node10`, `target ES5` | Мигрировать опцию: `paths` относительно проекта, `module nodenext`, target ES2015+. `ignoreDeprecations: "6.0"` лишь даёт время на 6.0 | [Новые умолчания](#новые-умолчания-60-и-удалённые-опции-70) |
| typescript-eslint или ts-morph падают после `npm i typescript` (7.0) | Алиас `typescript` → `@typescript/typescript6`; TS 7 — как `@typescript/native` | [Статус компилятора](#статус-компилятора) |
| `npx tsc -v` печатает 6.x, хотя стоит 7 | Проверить ссылку `.bin/tsc`; ставить по схеме алиасов из анонса | [Статус компилятора](#статус-компилятора) |
| Медленный `tsc` или редактор | TS 7 (`--checkers`), `--extendedDiagnostics`, `--generateTrace`, упростить рекурсивные типы, аннотировать типы возврата экспортов | [Паттерны типизации](#паттерны-типизации) |
| Медленная генерация `.d.ts` в монорепозитории | `isolatedDeclarations` + tsdown/oxc, project references + `--builders` | [Публикация типов](#публикация-типов) |
| `arr[i].x` падает в рантайме | `noUncheckedIndexedAccess` | [Флаги tsconfig для Node](#флаги-tsconfig-для-node) |
| В необязательные поля пишется `undefined`, PATCH затирает данные | `exactOptionalPropertyTypes` | [Флаги tsconfig для Node](#флаги-tsconfig-для-node) |
| `any` из `JSON.parse` / `res.json()` расползается по коду | Разбор Zod/Valibot/ArkType; линт `no-unsafe-*`; ts-reset | [Валидация в рантайме](#валидация-в-рантайме) |
| Перепутанные ID (`userId` передан как `orderId`) | Brand-типы | [Паттерны типизации](#паттерны-типизации) |
| Новый вариант «enum» молча не обработан | Discriminated union + `never` в `default` / `switch-exhaustiveness-check` | [Паттерны типизации](#паттерны-типизации) |
| Unhandled promise rejection в обработчике | `no-floating-promises`, `no-misused-promises` | [Линтинг с типами](#линтинг-с-типами-при-переходе-на-ts-7) |
| Потребители жалуются «types not found» или на неверные типы CJS/ESM | `attw --pack`, publint, условие `types` первым, свой `.d.ts` на каждый формат | [Публикация типов](#публикация-типов) |
| Изменение типов библиотеки незаметно сломало пользователей | Тесты типов (expect-type/tstyche), отчёт api-extractor | [Тесты типов](#тесты-типов) |
| Валидация горячая в профиле | TypeBox `Compile` / Ajv / ArkType (локально в ≈5–25 раз быстрее `parse` в Zod/Valibot) | [Валидация в рантайме](#валидация-в-рантайме) |

## Книги и дальнейшее чтение

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Effective TypeScript](https://effectivetypescript.com/) | Dan Vanderkam, 2-е изд., O'Reilly 2024 (83 пункта) | Лучшая книга о том, как думать на TS: unknown, brand-типы, generics, код на уровне типов. В блоге — обзор года «A Small Year for tsc, a Giant Year for TypeScript» (2025-12-19) о порте на Go и стриппинге в Node |
| [Programming TypeScript](https://www.oreilly.com/library/view/programming-typescript/9781492037644/) | Boris Cherny, O'Reilly 2019 | Добротный обзор языка; синтаксис и флаги до 5.x `[не проверено]` |
| [Learning TypeScript](https://www.oreilly.com/library/view/learning-typescript/9781098110321/) | Josh Goldberg, O'Reilly 2022 | От начального до среднего уровня, автор — мейнтейнер typescript-eslint `[не проверено]` |
| [learningtypescript.com](https://www.learningtypescript.com/) | Josh Goldberg | Сайт-компаньон и упражнения |
| [Total TypeScript Essentials](https://www.totaltypescript.com/books/total-typescript-essentials) | Matt Pocock, 2024 | Бесплатная онлайн-книга, практический TS |
| [TypeScript Quickly](https://www.manning.com/books/typescript-quickly) | Yakov Fain, Anton Moiseev, Manning | Практическое введение (старое) |
| [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) | Basarat Ali Syed | Бесплатно; старое, но полезно по основам |
| [The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) | TypeScript team | Официальное руководство |
| [TypeScript FAQ](https://github.com/microsoft/TypeScript/wiki/FAQ) | TypeScript team | Почему всё устроено так: структурная типизация, `this` и др. |
| [TypeScript Roadmap](https://github.com/microsoft/TypeScript/wiki/Roadmap) | TypeScript team | Дорожная карта |
| [TypeScript Community](https://www.typescriptlang.org/community) | TypeScript team | Discord, митапы |
| [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) | Yoni Goldberg et al. | Практики Node, включая раздел о TS |
| [2ality](https://2ality.com/) | Axel Rauschmayer | Глубокие разборы JS/TS. По данным [idioms-patterns.md](idioms-patterns.md#версии-node-и-источники-данных), в 2026 году сайт временно снят с публикации |
| [Exploring JS](https://exploringjs.com/) | Axel Rauschmayer | Бесплатные книги по JS/TS; та же оговорка о доступности |

## Антипаттерны

- **`module` не задан на TS 6/7.** Умолчание `esnext` неверно моделирует Node: нет семантики CJS/ESM по файлам, нет условий `exports` для `require`. То же для `moduleResolution: node`/`node10` (удалён в 7.0) и `bundler` для кода, который Node запускает напрямую.
- **Новые `enum`, runtime-`namespace`, parameter properties, `import x = require()`, утверждения `<T>x`** в коде под type stripping. Замены: объекты `as const`, модули, явные поля, `import`, `as`.
- **Импорт типа как значения** (`import { User }`, где `User` — интерфейс) без `verbatimModuleSyntax`. Под стриппингом это падение в рантайме.
- **Алиасы `paths` для рантайм-импортов.** tsc их не переписывает, Node игнорирует. Используйте `package.json#imports`.
- **`any` как выход из положения**, двойные касты `as unknown as T`, non-null `!` на данных из I/O, `@ts-ignore` вместо `@ts-expect-error`.
- **Доверие типам `JSON.parse`, `req.body`, `res.json()` или `process.env`** без разбора. Рукописные `interface` для внешних payload-ов, которые никто не проверяет.
- **Повторная валидация одних и тех же данных в каждом слое** или протаскивание сырых объектов схем через домен. Разберите один раз, дальше передавайте типизированные или branded значения.
- **`@types/node@latest` при более старом рантайме**; `lib: ["dom"]` в серверном tsconfig.
- **Два источника истины**: interface *и* схема для одной формы. Выводите одно из другого: `z.infer`, `Static<typeof T>` или генерация типов из OpenAPI.
- **Излишне хитрый код на уровне типов** (глубокие рекурсивные условные типы, гигантские template-literal union) в прикладном коде. Медленно проверяется, трудно читается, непонятные сообщения об ошибках. Держите такое во внутренностях хорошо протестированных библиотек.
- **Generics, параметр типа которых встречается один раз**, или «generics по типу возврата» `<T>(x: any) => T` — это замаскированные касты.
- **Публикация сырого `.ts`** в npm для Node-потребителей (Node не стирает типы в `node_modules`). Один `.d.ts` на ESM и CJS. Публикация без attw/publint.
- **Уверенность, что тесты проверяют типы.** Vitest, Jest (с swc/esbuild), tsx и стриппинг в Node стирают типы без проверки. CI обязан запускать `tsc --noEmit` (или `vitest --typecheck` / `oxlint --type-check`).
- **Переход на TS 7 с typescript-eslint, ts-morph или typia под тем же именем пакета `typescript`.** Им нужен API 6.x — используйте алиас.
- **ts-node в новых проектах** (не сопровождается с 2023-12). `[устарело]` → type stripping в Node / tsx.
- **`@effect/schema`, `io-ts`, `fp-ts` в новом коде.** `[устарело]` → `effect` 4.x (Schema внутри `effect`) или Zod/Valibot/ArkType.
- **`zod-to-json-schema` с Zod 4** `[устарело]` → `z.toJSONSchema()`. Стиль **`z.string().email()`** устарел в Zod 4 — используйте `z.email()`.
- **`@typescript/native-preview` / `tsgo` в package.json** после июля 2026. `[устарело]` → `typescript@7`.

```ts
// Плохо: enum, parameter property, импорт типа как значения, доверие JSON
import { User } from "./types.ts";
enum Role { Admin, User }
class Svc { constructor(private db: Db) {} }
const user = JSON.parse(body) as User;

// Лучше
import type { User } from "./types.ts";
const Role = { Admin: "admin", User: "user" } as const;
class Svc { readonly #db: Db; constructor(db: Db) { this.#db = db; } }
const user = UserSchema.parse(JSON.parse(body)); // тип выводится из схемы
```

## Спорные места

1. **Запускать `.ts` напрямую в продакшене или поставлять скомпилированный JS.** За прямой запуск: один артефакт, нет шага сборки, точные номера строк без source maps, поддержка Node и стабильность с 24.12. За компиляцию: нет стоимости Wasm-стриппинга на каждом старте, доступны декораторы и прочий нестираемый синтаксис, ошибки типов валят сборку, а не деплой, можно бандлить и минифицировать. Типичный компромисс 2026 года: `.ts` напрямую в dev, тестах и скриптах (`node --watch`, `node --test`), JS — для сервисов с жёстким бюджетом холодного старта и для фреймворков на декораторах.
2. **Переходить на TS 7.0 сейчас или ждать 7.1.** 7.0 вышел (GA) и намного быстрее, но без API: линтинг с типами, инструменты Vue/Svelte/Astro и трансформеры требуют 6.0 рядом. Обычные Node-бэкенды с ESLint могут проверять типы `tsc` 7 и держать `typescript6` для линтера. Type-aware режим oxlint уже работает на typescript-go. Команды с языковыми инструментами фреймворков часто ждут 7.1 (бета 2026-10-20) и его content mappers.
3. **`exactOptionalPropertyTypes`.** Ловит реальные баги (семантика PATCH), но шумит с библиотеками, типы которых под него не писались, и создаёт трения между библиотеками и приложениями. `tsc --init` (5.9+) включает его, но многие команды оставляют выключенным.
4. **`noUncheckedIndexedAccess`.** Широко рекомендуется (Total TypeScript, `tsc --init` 5.9, @tsconfig/strictest), но в плотных числовых циклах вынуждает писать `!` или проверки. Большинство считает, что он того стоит.
5. **`isolatedDeclarations` в приложениях.** Необходим для быстрых `.d.ts` библиотек и монорепозиториев. В приложениях в основном добавляет шум аннотаций, хотя явные типы возврата у экспортов — самостоятельная рекомендация (Вандеркам; правило typescript-eslint `explicit-module-boundary-types`).
6. **Enum.** Консенсус 2026 года для Node — «не использовать» (нестираемы, ловушки `const enum` между файлами, обратные отображения у числовых enum). Меньшинство держит строковые enum в кодовых базах на Nest/Angular, которые всё равно компилируются.
7. **Какой валидатор.** У Zod самая большая экосистема и хороший DX. У Valibot самые маленькие бандлы. ArkType и TypeBox/Ajv быстрее всех по пропускной способности (локально в 5–25 раз быстрее `parse` у Zod/Valibot). TypeBox нативен для JSON Schema — Fastify и OpenAPI. Standard Schema делает выбор менее липким для библиотек.
8. **Result-типы против исключений; Effect.** См. [Result, neverthrow и Effect](#result-neverthrow-и-effect). Сильные мнения с обеих сторон. Нейтральная рекомендация: локальный union `Result` для ожидаемых доменных отказов, исключения для багов, Effect — только как решение всей команды `[не проверено]`.
9. **JSDoc или `.ts`.** Раз стираемый `.ts` запускается нативно, довод «без сборки» в пользу JSDoc ослаб. Часть мейнтейнеров всё равно предпочитает JSDoc за инструменты без настройки и читаемые опубликованные исходники. TS 7 убрал поддержку JSDoc в стиле Closure, что дороже обходится старым JS-кодовым базам.
10. **Interface или type alias.** Interface даёт лучшие сообщения об ошибках и более быструю проверку при расширении объектов (страница Performance в вики TS), а также declaration merging. Type alias нужен для union и mapped types. Большинство руководств: «interface для расширяемых форм объектов, type в остальных случаях». Это вопрос стиля, не повод для спора на ревью.

## Чеклист ревью типизации

1. **Компилятор и конфиг.** Версия TS зафиксирована. На 7.0 есть алиас `typescript6`, если используются линтинг с типами или другие инструменты на API, а `npx tsc -v` печатает ожидаемую версию. `module` — `nodenext`/`node20` (не `node10`/`bundler` для кода, который запускает Node). `types: ["node"]` и `rootDir` заданы явно. Нет опций, устаревших в 6.0, и нет `ignoreDeprecations`.
2. **Строгость.** Включены `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (в приложениях; в библиотеках — осознанно), `noImplicitOverride` и `noImplicitReturns`. Нет островков `strict: false` без тикета.
3. **Стираемый код**, если Node запускает `.ts` напрямую: включены `erasableSyntaxOnly` + `verbatimModuleSyntax`, нет декораторов и `accessor`, относительные импорты с расширением `.ts`. `paths` заменён на `package.json#imports`.
4. **Мажор `@types/node` = минимальный поддерживаемый мажор Node.** В серверном коде нет lib `dom`, нет устаревших `@types/x` для пакетов со своими типами.
5. **Нет утечек `any`** в экспортируемых сигнатурах. На границах — `unknown`. Generics ограничены, каждый параметр типа используется минимум дважды. Нет `Function` / `object` / `{}` в роли типов.
6. **Разбор на границах.** Каждый внешний вход (HTTP, env, файлы, очереди, сторонние API, строки БД) проходит через схему ровно один раз. Доменный код получает типизированные, лучше branded, значения. Для чувствительных payload-ов — strict-объекты. Общий код ориентирован на Standard Schema, а не на один валидатор.
7. **Утверждения обоснованы.** У каждого `as`, `!`, `@ts-expect-error` (никогда `@ts-ignore`) и `// eslint-disable` есть комментарий с причиной. Для литералов `satisfies` лучше `as`; type guards / функции `asserts` лучше кастов.
8. **Закрытые множества** описаны union-ами или объектами `as const` с исчерпывающей обработкой (`never` / `switch-exhaustiveness-check` / `.exhaustive()` в ts-pattern). Нет состояния строками. Нет новых `enum`.
9. **Асинхронные типы.** Нет «плавающих» промисов. У экспортируемых async-функций явный тип возврата `Promise<T>`. Долгие операции принимают `AbortSignal`. `catch (e)` трактуется как `unknown` и сужается.
10. **Экспортируемый API.** У экспортируемых функций и констант явные типы возврата и объявленные типы (для библиотек — чисто под `isolatedDeclarations`). Входы `readonly`. Ошибки типизированы через `Result` или документированные классы ошибок — единообразно, один стиль на кодовую базу.
11. **Публикация библиотеки.** publint и `attw --pack` (с нужным профилем) проходят в CI. Условие `types` идёт первым. Поставляются `declarationMap` + `src`. Тесты типов покрывают публичные generics и перегрузки. Минимальная версия TS задокументирована и протестирована.
12. **Производительность типов.** Нет взрывов инстанцирования: Instantiations в `tsc --extendedDiagnostics` не растут от PR. У рекурсивных типов есть ограничение глубины. Большие union обоснованы.
13. **Augmentations** (`declare module`, `declare global`) собраны в одном типизированном файле, включённом в tsconfig, а не разбросаны.
14. **CI запускает `tsc --noEmit`** (или `oxlint --type-check` на TS 7) отдельно от тестов: стриппинг в Node и Vitest/esbuild типы не проверяют.
