# Идиомы, паттерны и антипаттерны Node.js

Справочник по идиоматичному Node.js (JavaScript и TypeScript) для любых проектов: библиотеки, CLI, веб-бэкенды, боты, обработка данных, игровые серверы, скрипты. Внутри: таблица «возможность языка → минимальная версия Node», встроенные API вместо npm-зависимостей, ESM и CJS, `require(esm)`, запуск TypeScript без сборки, обработка ошибок и политика падения процесса, основы логирования, асинхронные паттерны (комбинаторы промисов, async-итераторы, отмена через `AbortSignal`, explicit resource management), паттерны проектирования в форме Node, мини-каталог «задача → решение», антипаттерны, спорные места и чеклист ревью. Общая идея: встроенные API и протоколы языка вместо самописных утилит и микрозависимостей, функции и модули вместо лишних классов, I/O на краях. Актуально на ноябрь 2026: Node 26 — Active LTS «Lithium» (с 26.13.0 от 2026-10-28, V8 14.6, EOL 2029-04-30); Node 24 — Maintenance LTS «Krypton» (24.22.2, V8 13.6, EOL 2028-04-30); Node 22 — Maintenance LTS «Jod» (V8 12.4, EOL 2027-04-30); Node 20 — EOL с 2026-04-30; Node 25 — EOL с 2026-06-01; ECMAScript 2026 (ECMA-262, 17-е издание) утверждён 2026-06-30; Node 27.0.0-alpha.0 (V8 15.6) — только альфа-канал. Смежные темы: V8, GC и бенчмарки — [performance.md](performance.md); event loop, worker threads, backpressure потоков — [concurrency-async-native.md](concurrency-async-native.md); tsconfig и типизация — [typescript.md](typescript.md); пакетные менеджеры, линтеры, график релизов — [toolchain.md](toolchain.md); структура проекта и DI-контейнеры — [architecture.md](architecture.md); HTTP-фреймворки, pino и OpenTelemetry подробно — [domains-server.md](domains-server.md); CLI и публикация пакетов — [domains-client.md](domains-client.md).

- [Версии Node и источники данных](#версии-node-и-источники-данных)
- [Возможности языка по версиям Node](#возможности-языка-по-версиям-node)
- [Современный JavaScript в Node](#современный-javascript-в-node)
- [Встроенные API вместо зависимостей](#встроенные-api-вместо-зависимостей)
- [ESM, CJS, require(esm) и TypeScript](#esm-cjs-requireesm-и-typescript)
- [Обработка ошибок](#обработка-ошибок)
- [Логирование](#логирование)
- [Асинхронные паттерны](#асинхронные-паттерны)
- [Паттерны проектирования в Node](#паттерны-проектирования-в-node)
- [Мини-каталог паттернов](#мини-каталог-паттернов)
- [Антипаттерны](#антипаттерны)
- [Устаревшие и удалённые API](#устаревшие-и-удалённые-api)
- [Спорные места](#спорные-места)
- [Чеклист code review: идиоматичный Node](#чеклист-code-review-идиоматичный-node)
- [Симптомы и приёмы](#симптомы-и-приёмы)

## Версии Node и источники данных

**Ключевые выводы**
- Реалистичный минимум для нового кода в ноябре 2026: **Node 22** для библиотек, **Node 24 или 26** для приложений. Всё из колонки «24» в таблице ниже безопасно на любом поддерживаемом LTS, кроме 22. Возможности из колонки «26» требуют `"engines": { "node": ">=26" }`.
- Версии V8 по мажорам Node: 18 = 10.2, 20 = 11.3, 21 = 11.8, **22 = 12.4**, 23 = 12.9, **24 = 13.6**, 25 = 14.1, **26 = 14.6**, 27-alpha = 15.6. Chrome N поставляется с V8 (N/10).(N%10): Chrome 136 = V8 13.6. По этому соответствию можно оценить, когда фича из Chrome попадёт в Node.
- **node.green устарел**: последнее автообновление 2025-11-13, самая новая проверенная версия — Node 25.2.0, данных по Node 26/27 нет. Для фич 2026 года смотреть MDN browser-compat-data (поле `nodejs.version_added`, пакет `@mdn/browser-compat-data` 8.1.6 от 2026-10-15) или проверять на нужной версии.
- V8 прекратил публиковать посты о релизах (`v8.dev/blog/discontinuing-release-posts`). Новое в V8 искать в release notes Chrome и на chromestatus.
- Блог 2ality и книги exploringjs.com (Axel Rauschmayer) в 2026 году сняты с публикации (уведомление «temporarily offline», на 2026-11-06 оба сайта показывают только его, старые адреса статей отдают 404; причины — доход от книг упал до нуля, а трафик почти целиком от AI-краулеров). Книги по-прежнему продаются на Payhip. Вместо них — MDN, страницы фич V8 и README предложений TC39.
- Начиная с Node 27 каждый мажор становится LTS, один мажор в год (подробнее в [toolchain.md](toolchain.md)). Node 27.0.0-alpha.0 опубликован 2026-10-29; Current 27.0.0 ожидается 2027-04-22. Альфа-канал допускает semver-major изменения до апреля 2027 — фичи 27-alpha не документировать как стабильные.
- Линтить использование фич против `engines.node`: правила `eslint-plugin-n` `n/no-unsupported-features/es-builtins`, `n/no-unsupported-features/es-syntax`, `n/no-unsupported-features/node-builtins` читают `engines` из `package.json`. Данные плагина о новых встроенных объектах ES отстают: в локальной проверке eslint-plugin-n 18.5 поймал `util.styleText`, `Object.groupBy`, `toSorted` и `Promise.withResolvers`, но пропустил `Promise.try`, `RegExp.escape` и `Array.fromAsync`. Фичи ES2025+ проверяйте по таблице ниже.

| Что | Версия / дата | Статус |
|---|---|---|
| Node 26 | 26.13.0, LTS «Lithium» с 2026-10-28 | Active LTS, EOL 2029-04-30 |
| Node 24 | 24.22.2 (2026-10-27) | Maintenance LTS, EOL 2028-04-30 |
| Node 22 | 22.23.x | Maintenance LTS, EOL 2027-04-30 |
| Node 20 / Node 25 | 20.20.2 / 25.9.0 | EOL 2026-04-30 / 2026-06-01 |
| Node 27 | 27.0.0-alpha.0 (2026-10-29), V8 15.6 | Альфа-канал; Current 2027-04-22 |
| ECMAScript 2026 (ECMA-262, 17-е изд.) | Утверждён 2026-06-30 | Финальный |
| `@mdn/browser-compat-data` | 8.1.6 (2026-10-15) | Активен |
| node.green / `compat-table/node-compat-table` | Последнее обновление 2025-11-13 | Устарел, нет Node 26 |
| `module-replacements` (e18e) | 3.4.0 (2026-09-20) | Активен |
| *Node.js Design Patterns*, 4-е изд. | Сентябрь 2025 | Актуальна |
| V8 release blog posts | — | Прекращены |
| 2ality.com / exploringjs.com | — | Офлайн в 2026 |

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js releases index (JSON)](https://nodejs.org/dist/index.json) | Node.js | Машиночитаемый список релизов: версия, дата, V8, статус LTS |
| [ECMA-262, 17th edition (ES2026)](https://262.ecma-international.org/17.0/index.html) | Ecma TC39, 2026 | Нормативный текст ES2026: `Error.isError`, `Math.sumPrecise`, base64, upsert, `Iterator.concat`, `Array.fromAsync`, JSON source text |
| [ECMA-262, 16th edition (ES2025)](https://262.ecma-international.org/16.0/index.html) | Ecma TC39, 2025 | ES2025: iterator helpers, методы Set, JSON modules, `RegExp.escape`, `Promise.try`, Float16 |
| [Finished proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md) | TC39 | Список Stage 4 с ожидаемым годом (ERM, Temporal, `Atomics.pause` → 2027) |
| [ECMAScript 2026 specification approved](https://www.infoworld.com/article/4193461/ecmascript-2026-specification-approved.html) | Paul Krill, 2026 | Новость об утверждении ES2026 |
| [browser-compat-data](https://github.com/mdn/browser-compat-data) | MDN | Машиночитаемые `version_added` для Node по каждой фиче |
| [node.green](https://node.green/) | William Kapke и др. | Соответствие ES по версиям Node; устарел с ноября 2025 |
| [node-compat-table](https://github.com/williamkapke/node-compat-table) | William Kapke | Сырые результаты JSON (редирект в организацию compat-table) |
| [Node Target Mapping](https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping) | TypeScript team | `target`/`lib` в tsconfig по версиям Node |
| [n/no-unsupported-features/es-builtins](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/es-builtins.md) | eslint-community | Проверка встроенных объектов ES против `engines` |
| [n/no-unsupported-features/node-builtins](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/node-builtins.md) | eslint-community | Проверка API Node против `engines` |

## Возможности языка по версиям Node

Источники таблицы: MDN BCD 8.1.6, сырые данные node.green (до Node 25), текст ECMA-262 16-го и 17-го изданий, метаданные документации Node 26.12.0 и локальные проверки на Node 24.17, 26.12 и 27.0.0-alpha.0 (Windows 11).

| Возможность | Издание ES | С какой версии Node (V8) | Примечания |
|---|---|---|---|
| Top-level `await` (только ESM) | ES2022 | 14.8 (8.4) | В CJS нет. Модуль с TLA нельзя загрузить через `require()` (`ERR_REQUIRE_ASYNC_MODULE`) |
| `Array/String/TypedArray.prototype.at()` | ES2022 | 16.6 (9.2) | Отрицательный индекс |
| `Object.hasOwn` | ES2022 | 16.9 (9.3) | Вместо `Object.prototype.hasOwnProperty.call` |
| Опция `{ cause }` у `Error` | ES2022 | 16.9 (9.3) | `util.inspect` печатает цепочку `[cause]` |
| Поля классов, `#private`, static-блоки, `#x in obj` | ES2022 | 16.x | Brand check вместо `instanceof` для своих классов |
| Флаг RegExp `d` (индексы совпадений) | ES2022 | 16 | |
| `findLast` / `findLastIndex` | ES2023 | 18.0 (10.2) | |
| Change-array-by-copy: `toSorted`, `toReversed`, `toSpliced`, `with` | ES2023 | 20.0 (11.0+) | Не мутируют. Компаратор по умолчанию — строковый |
| Symbols как ключи WeakMap, hashbang-грамматика | ES2023 | 20 | |
| `Object.groupBy` / `Map.groupBy` | ES2024 | 21.0 (11.7) | Результат `Object.groupBy` — объект **с null-прототипом** |
| `Promise.withResolvers` | ES2024 | 22.0 (12.2) | Вместо `p-defer` и ручного «deferred» |
| Флаг RegExp `v` (операции над множествами, string properties) | ES2024 | 20.0 (11.2) | Таблицы Unicode 16 с Node 24; Unicode 17 пока нет |
| Resizable `ArrayBuffer`, `.transfer()` | ES2024 | 20.0 / 21.0 | `transfer` — с 21 |
| `String.prototype.isWellFormed/toWellFormed` | ES2024 | 20.0 | Одиночные суррогаты перед `encodeURIComponent` |
| `Atomics.waitAsync` | ES2024 | 16+ | См. [concurrency-async-native.md](concurrency-async-native.md) |
| Iterator helpers (`Iterator.from`, `.map/.filter/.take/.drop/.flatMap/.reduce/.toArray/.some/.every/.find`) | ES2025 | **22.0 (12.2)** | Ленивые: вычисляются только запрошенные элементы |
| Методы Set (`union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf` и др.) | ES2025 | **22.0 (12.2)** | |
| Import attributes `with { type: 'json' }`, JSON modules | ES2025 | 18.20 / 20.10 (синтаксис); JSON modules стабильны с 22.12 / 23.1 | Старый синтаксис `assert { }` удалён в Node 22 |
| `Promise.try` | ES2025 | **23.0 / 24.0** (12.8) | **В Node 22 нет** |
| Модификаторы RegExp `(?i:...)` | ES2025 | 23.0 / 24.0 (12.5) | В Node 22 нет |
| Повторяющиеся именованные группы захвата | ES2025 | 23.0 / 24.0 (12.5) | В Node 22 нет |
| `RegExp.escape` | ES2025 | **24.0 (13.6)** | |
| `Float16Array`, `Math.f16round`, f16 в `DataView` | ES2025 | **24.0 (13.5)** | |
| `Error.isError` | ES2026 | **24.3** полностью (24.0 частично) (13.4) | `true` для ошибок из другого realm (контекст `vm`), где `instanceof Error` даёт `false`. В чём состоит частичная поддержка 24.0, не проверялось |
| `Array.fromAsync` | ES2026 | **22.0 (12.1)** | |
| Доступ к исходному тексту в `JSON.parse` (`context.source` в reviver), `JSON.rawJSON`, `JSON.isRawJSON` | ES2026 | **21.0 (11.4)** | Большие целые без потерь: `BigInt(ctx.source)` |
| `Uint8Array.fromBase64/fromHex`, `.toBase64()/.toHex()`, `setFromBase64/Hex` | ES2026 | **25.0 (14.0)**, то есть **26 LTS** | В Node 24 только с флагом `--js-base-64` |
| `Iterator.concat` | ES2026 | **26.0 (14.6)** | |
| `Map/WeakMap.prototype.getOrInsert`, `getOrInsertComputed` (upsert) | ES2026 | **26.0 (14.5)** | Есть в тексте ES2026; таблица TC39 finished proposals тоже относит upsert к 2026 (Stage 4 в январе 2026) |
| `Math.sumPrecise` | ES2026 | **Нет в Node 26**; есть в 27.0.0-alpha.0 (V8 15.6) | `Math.sumPrecise([1e20, 0.1, -1e20])` = 0.1, наивный `reduce` = 0 (проверено локально на 27-alpha) |
| Explicit resource management: `using`, `await using`, `DisposableStack`, `AsyncDisposableStack`, `SuppressedError`, `Symbol.dispose/asyncDispose` | ES2027 (Stage 4; в тексте ES2026 нет) | **24.0 (13.4)** | API Node реализуют `Symbol.asyncDispose` (FileHandle, `mkdtempDisposable`, sqlite). Синтаксис — с TS 5.2 |
| `Atomics.pause` | ES2027 | 24.0 (13.3) | Подсказка для spin-wait |
| `Temporal` | ES2027 (Stage 4, 2026) | **26.0 (14.4)**, включён по умолчанию | В Node 24 только `--harmony-temporal` (экспериментально). Полифилы: `temporal-polyfill`, `@js-temporal/polyfill` |
| `Intl.DurationFormat` | ECMA-402 | 23.0 (12.9) | |
| `Iterator.zip`, chunking/join/includes для итераторов | ES2027 | Нет в Node 26; `Iterator.zip` есть в 27.0.0-alpha.0 | BCD отстаёт от альфы |
| Декораторы (TC39 Stage 3) | — | **Не поставляются** (в V8 `--js-decorators` в работе) | Type stripping в Node отвергает TS-декораторы |
| `ShadowRealm`, async iterator helpers, Signals, AsyncContext, pipeline-оператор | — | Не поставляются | Аналог AsyncContext сегодня — `AsyncLocalStorage` |

**Практические следствия**
- **Библиотека с `engines.node >= 22`**: можно iterator helpers, методы Set, `Promise.withResolvers`, `Object.groupBy`, `Array.fromAsync`, `toSorted`. **Нельзя**: `Promise.try`, `RegExp.escape`, `using`, `Float16Array`, `Error.isError`, base64 у `Uint8Array`, `Temporal`, upsert, `Iterator.concat`.
- **Приложение на Node 24**: добавляются `using`/`await using`, `RegExp.escape`, `Promise.try`, `Error.isError` (24.3+).
- **Приложение на Node 26**: добавляются `Temporal`, base64/hex у `Uint8Array`, `Map#getOrInsert*`, `Iterator.concat`.

```json
{
  "engines": { "node": ">=22.12" }
}
```

```js
// eslint.config.js — линтер ругается на фичи новее engines.node
import n from 'eslint-plugin-n';
export default [
  n.configs['flat/recommended-module'],
  { rules: {
      'n/no-unsupported-features/es-builtins': 'error',
      'n/no-unsupported-features/es-syntax': 'error',
      'n/no-unsupported-features/node-builtins': 'error',
  } },
];
```

## Современный JavaScript в Node

**Ключевые выводы**
- **Неизменяющие операции над массивами — идиома по умолчанию**: `arr.toSorted(cmp)`, `toReversed()`, `toSpliced()`, `with(i, v)` вместо `[...arr].sort()` и `slice().reverse()`. Компаратор по умолчанию у них тоже **строковый**: `[10, 9, 1].toSorted()` → `1,10,9` (проверено локально на Node 24.17). Для чисел всегда передавать `(a, b) => a - b`.
- **Группировка**: `Object.groupBy(items, fn)` возвращает объект **с null-прототипом**. Он безопасен для произвольных ключей вроде `"__proto__"`, но метода `obj.hasOwnProperty` у него нет — использовать `Object.hasOwn`. `Map.groupBy` — когда ключи не строки. Заменяет `lodash.groupby` и ручные `reduce`-аккумуляторы.
- **Deferred-промис**: `const { promise, resolve, reject } = Promise.withResolvers()` (Node 22+) вместо `let resolve; new Promise(r => resolve = r)` и `p-defer`.
- **`Promise.try(fn, ...args)`** (Node 23/24+) превращает синхронный или асинхронный callback в промис, а **синхронный throw — в rejection**. Заменяет `p-try` и `new Promise(r => r(fn()))`.
- **Iterator helpers** (Node 22+): `iter.map().filter().take(n).toArray()` ленивые. В локальной проверке из бесконечного генератора было вытянуто только 7 элементов, чтобы получить 3 результата. Применять к `Map#entries()`, `Set#values()`, генераторам — чтобы не создавать промежуточные массивы. `Iterator.from(obj)` оборачивает любой iterable или iterator. Async iterator helpers **не** поставляются (Stage 2).
- **Алгебра множеств** (Node 22+): `a.union(b)`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, `isDisjointFrom`. Аргумент — любой «set-like» объект (есть `size`, `has`, `keys`), например `Map`.
- **`Array.fromAsync(asyncIterable)`** (Node 22+) собирает async-итератор: результат `fs.promises.glob`, ограниченный через `take` поток `events.on`, генератор страниц API. Ждёт элементы **последовательно** — это не инструмент конкурентности.
- **`RegExp.escape(str)`** (Node 24+) вместо `escape-string-regexp` и `lodash.escaperegexp`. Ведущий алфавитно-цифровой символ экранируется как `\x61`, поэтому результат безопасен и после `\0`/`\c`.
- **Explicit resource management** (Node 24+): `using x = getDisposable()` / `await using`. Освобождение идёт в порядке LIFO. Если бросили и тело, и disposer, получается `SuppressedError { error: <ошибка dispose>, suppressed: <ошибка тела> }`. `DisposableStack` (`use`, `adopt(value, onDispose)`, `defer(fn)`, `move()`) собирает несколько ресурсов в конструкторах и фабриках. Встроенные объекты Node уже это поддерживают: `FileHandle`, `Dir`, `fs.promises.mkdtempDisposable`, `DatabaseSync` и statements из `node:sqlite`, возвращаемое значение `events.addAbortListener`, таймеры. `await using` разрешён на верхнем уровне ESM-модуля (проверено: disposer в `.mjs` отработал), но не в глобальной области скриптов.
- **`Error.isError(v)`** (Node 24.3+) — надёжная проверка через realm-границы: ошибка из контекста `vm` даёт `instanceof Error === false`, но `Error.isError === true` (проверено локально). Простые объекты, похожие на ошибку, дают `false`.
- **Причина ошибки**: `new Error('msg', { cause })`. `util.inspect` и `console` печатают цепочку `[cause]`.
- **Исходный текст в JSON** (Node 21+): reviver получает `context.source`, отсюда `BigInt(ctx.source)` без потери точности. `JSON.rawJSON('12345678901234567890')` сериализует большое число без кавычек.
- **Только в Node 26**: `Temporal` (в новом коде вместо `moment` и большей части `date-fns`/`dayjs`/`luxon`); `Uint8Array` `toBase64()/fromBase64()/toHex()/fromHex()` (работает и в браузерах; `Buffer.from(x, 'base64')` остаётся нормальным для кода только под Node); `map.getOrInsertComputed(key, () => [])` вместо танца `if (!m.has(k)) m.set(k, [])`; `Iterator.concat(a, b)`.
- **Нет ни в одном LTS**: декораторы (legacy-декораторам TS нужен транспайлер, type stripping их отвергает), `Math.sumPrecise` и `Iterator.zip` (только 27-alpha), ShadowRealm, AsyncContext, pipeline-оператор, Signals. Records/Tuples отозваны `[не проверено]`.

**Ресурсы с автоматической очисткой (Node 24+).** Источники: [explicit resource management](https://v8.dev/features/explicit-resource-management), [fs](https://nodejs.org/api/fs.html).
```js
import { open, mkdtempDisposable } from 'node:fs/promises';

await using tmp = await mkdtempDisposable('job-');        // каталог удаляется при выходе из области
await using fh = await open(`${tmp.path}/out.txt`, 'w');    // файл закрывается даже при throw
await fh.writeFile('hello');
```

**Коллекции без мутаций и промежуточных массивов.** Источники: [toSorted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted), [Object.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy), [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator).
```js
const byScore = players.toSorted((a, b) => b.score - a.score);   // исходный массив не меняется
const byTeam = Object.groupBy(players, p => p.team);              // null-прототип
if (Object.hasOwn(byTeam, 'red')) { /* ... */ }

const firstIdle = users.values().filter(u => u.idle).take(3).toArray();   // Node 22+, лениво
const shared = new Set(a).intersection(new Set(b));                        // Node 22+

// Node 26: счётчики и списки по ключу
const counts = new Map();
for (const w of words) counts.set(w, counts.getOrInsert(w, 0) + 1);
const index = new Map();
for (const e of events) index.getOrInsertComputed(e.userId, () => []).push(e);
```

**Большие целые в JSON без потерь (Node 21+).** Источник: [JSON.rawJSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/rawJSON).
```js
const data = JSON.parse(text, (key, value, { source }) =>
  key === 'id' ? BigInt(source) : value);
JSON.stringify({ id: JSON.rawJSON(String(data.id)) });   // число без кавычек и без округления
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Explicit resource management](https://v8.dev/features/explicit-resource-management) | Rezvan Mahdavi Hezaveh, 2025 | `using`, API `DisposableStack`, `SuppressedError`. Таблица поддержки там пишет «Node: no» — устарела |
| [Iterator helpers](https://v8.dev/features/iterator-helpers) | V8 team | Семантика ленивых helpers |
| [Import attributes](https://v8.dev/features/import-attributes) | V8 team | `with { type: 'json' }`, почему убрали `assert` |
| [Array.prototype.toSorted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted) | MDN | Change-array-by-copy |
| [Object.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy) | MDN | Результат с null-прототипом |
| [Promise.withResolvers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers) | MDN | Deferred-паттерн |
| [Promise.try](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/try) | MDN | Callback, синхронный или асинхронный |
| [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) | MDN | Список helpers |
| [Set.prototype.union](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/union) | MDN | Протокол set-like |
| [Array.fromAsync](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fromAsync) | MDN | Последовательный сбор async-итератора |
| [RegExp.escape](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape) | MDN | Правила экранирования |
| [using](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using) | MDN | Где разрешён `using` |
| [DisposableStack](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DisposableStack) | MDN | `use`/`adopt`/`defer`/`move` |
| [Error.isError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/isError) | MDN | Проверка через realm-границы |
| [Error: cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause) | MDN | Опция `cause` |
| [Math.sumPrecise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sumPrecise) | MDN | Точное суммирование float |
| [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) | MDN | Справочник API Temporal |
| [Uint8Array.fromBase64](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64) | MDN | Опции `alphabet`, `lastChunkHandling` |
| [Map.prototype.getOrInsertComputed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/getOrInsertComputed) | MDN | Ленивый upsert |
| [JSON.rawJSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/rawJSON) | MDN | Числа без потери точности |
| [proposal-temporal](https://github.com/tc39/proposal-temporal) | TC39 | Спецификация и статус Temporal |
| [Temporal documentation](https://tc39.es/proposal-temporal/docs/) | TC39 | Cookbook Temporal — лучшая практическая документация |
| [temporal-polyfill](https://github.com/js-temporal/temporal-polyfill) | js-temporal | Эталонный полифил для Node 22/24 |
| [proposal-explicit-resource-management](https://github.com/tc39/proposal-explicit-resource-management) | Ron Buckton | Спецификация ERM, примеры |
| [proposal-iterator-helpers](https://github.com/tc39/proposal-iterator-helpers) | TC39 | Спецификация iterator helpers |
| [proposal-async-iterator-helpers](https://github.com/tc39/proposal-async-iterator-helpers) | TC39 | Не поставляется (Stage 2) |
| [proposal-arraybuffer-base64](https://github.com/tc39/proposal-arraybuffer-base64) | Kevin Gibbons | base64/hex |
| [proposal-decorators](https://github.com/tc39/proposal-decorators) | TC39 | Декораторы (Stage 3, в V8 нет) |
| [proposal-async-context](https://github.com/tc39/proposal-async-context) | TC39 | AsyncContext — будущая замена `AsyncLocalStorage` |

## Встроенные API вместо зависимостей

**Ключевые выводы**
- **Правило 2026 года**: прежде чем добавлять зависимость, проверить манифесты e18e `module-replacements`. `native.json` сопоставляет 321 пакет со встроенными API, `preferred.json` — 479 пакетов со встроенными API или более лёгкими библиотеками. ESLint-плагин `eslint-plugin-depend` ловит заменимые зависимости автоматически.
- **Всегда префикс `node:`** для встроенных модулей (`import { readFile } from 'node:fs/promises'`). Он однозначен, его не перекроет npm-пакет с тем же именем, а для новых модулей (`node:test`, `node:sqlite`, `node:sea`) он обязателен. Правило линтера — `unicorn/prefer-node-protocol`.
- **Promise-версии API**: `node:fs/promises`, `node:timers/promises` (`setTimeout(ms, value, { signal })`, `setInterval` как async-итератор), `node:stream/promises` (`pipeline`, `finished`), `node:readline/promises`, `node:dns/promises`. `util.promisify` — только для сторонних callback-API.
- `--watch` (стабилен с 22.0) заменяет `nodemon` для простых dev-циклов. `node --run <script>` быстрее `npm run` (подробнее в [toolchain.md](toolchain.md)).

**Встроенный API → версии → что заменяет.** Данные из метаданных документации Node 26.12.0 (`meta.added`, `meta.changes`).

| API | Добавлен | Стабилен / важные изменения | Заменяет | Примечания |
|---|---|---|---|---|
| `fetch`, `Request`, `Response`, `Headers`, `FormData` (undici) | 17.5 / 16.15 | Без флага с 18.0, стабилен **21.0** | `node-fetch`, `axios`, `request`, `cross-fetch` | Node 26 содержит undici 8.0.2 |
| Глобальный клиент `WebSocket` | 21.0 / 20.10 | Без флага 22.0, стабилен **22.4** | `ws` (только клиент) | Серверу по-прежнему нужен `ws` |
| `structuredClone` | 17.0 | Стабилен | `lodash.clonedeep`, `clone-deep` | Теряет прототипы классов, бросает на функциях |
| `AbortController`, `AbortSignal.timeout` | 15 / 17.3 | Стабильны | `abort-controller`, `p-timeout` | Причина таймаута — DOMException `TimeoutError` |
| `AbortSignal.any` | 20.3 / 18.17 | Стабилен | Ручное слияние сигналов | |
| `util.parseArgs` | 18.3 / 16.17 | Стабилен **20.0**; отрицательные опции 22.4 | `minimist`, `arg`, `yargs-parser` | |
| `util.styleText` | 21.7 / 20.12 | Стабилен **23.5 / 22.13**; учитывает `NO_COLOR`/`FORCE_COLOR`/TTY с 22.8; hex-цвета 26.1 | `chalk`, `kleur`, `colors` | |
| `util.stripVTControlCharacters` | 16.11 | Стабилен | `strip-ansi` | |
| `util.parseEnv`, `process.loadEnvFile`, `--env-file`, `--env-file-if-exists` | 20.6 / 21.7 / 22.9 | Стабильны **24.10 / 22.21** | `dotenv` | Без подстановки переменных; см. [toolchain.md](toolchain.md) |
| `util.aborted(signal, resource)` | 19.7 / 18.16 | Стабилен 24.0 / 22.16 | | |
| `util.isDeepStrictEqual` | 9 | Стабилен | `deep-equal`, `fast-deep-equal` | |
| `util.getCallSites` | 22.9 | 1.1 Active development | `callsites` | |
| `util.diff` | 23.11 / 22.15 | Экспериментальный | | |
| `fs.glob`, `fs.globSync`, `fsPromises.glob` | 22.0 | Стабильны **24.0 / 22.17**; `followSymlinks` 26.1, `maxDepth` 26.9 | `glob`, `fast-glob`, `globby` | Если возможностей мало — e18e советует `tinyglobby` |
| `fsPromises.rm({ recursive, force })` | 14.14 | Стабилен | `rimraf`, `del` | |
| `fsPromises.mkdir({ recursive })` | 10.12 | Стабилен | `mkdirp`, `make-dir` | |
| `fsPromises.mkdtempDisposable` / `fs.mkdtempDisposableSync` | **24.4** | Стабильны | `tmp`, `temp`, `quick-temp` | `await using tmp = await mkdtempDisposable(prefix)` удаляет каталог |
| `fsPromises.cp` | 16.7 | Стабилен с 22.3 `[не проверено]` | `fs-extra.copy`, `cpy` | |
| `node:sqlite` (`DatabaseSync`) | 22.5 (флаг) | Без флага 23.4 / 22.13; **Release candidate (1.2) с 25.7** | `sqlite3`, часто `better-sqlite3` | SQLite 3.53.0 в 24.17, 3.54.0 в 26.12; на 24.17 без экспериментального предупреждения |
| `crypto.randomUUID` | 15.6 / 14.17 | Стабилен | `uuid`, `uuidv4`, `node-uuid` | UUID v4 |
| `crypto.randomUUIDv7` | **26.1.0 / 24.16.0** | Стабилен | `uuid` v7 | Бэкпорт в 24.16.0 (changelog v24, SEMVER-MINOR; документация v24 пишет `added: v24.16.0`, документация v26 — только 26.1.0). Проверено локально на 24.17.0 и 26.13.0. В Node 22 нет |
| `FileHandle[Symbol.asyncDispose]`, `Dir[Symbol.asyncDispose]` | 20.4 / 24.1 | Стабильны **24.2** | Ручной `try/finally close()` | `await using fh = await open(p)` |
| Глобальный `URLPattern` | **24.0** | Experimental (1) | `path-to-regexp` для простого сопоставления | |
| Глобальный `navigator` (`hardwareConcurrency`, `language`, `platform`, `userAgent`) | 21.0 | 1.1 | | Есть и `os.availableParallelism()` |
| `localStorage` / `sessionStorage` | 22.4 (флаг) | Без флага 25.0; **RC**; в 26.0 обращение к `localStorage` без `--localstorage-file` бросает или возвращает `undefined` | | Не полагаться на него на серверах |
| `EventSource` | 22.3 / 20.18 | Experimental, нужен `--experimental-eventsource` | `eventsource` | |
| `CompressionStream` / `DecompressionStream` | 18.0 | Стабильны **23.11 / 22.15**; `brotli` 24.7 | `pako` в простых случаях | |
| `events.on(emitter, name, { signal })` | 13.6 / 12.16 | Стабилен; опции `close`, `highWaterMark` 20/22 | `p-event` (режим итератора) | |
| `events.once` (отклоняется на `'error'`) | 11.13 | Стабилен; `signal` 15.0 | `p-event` | |
| `events.addAbortListener` | 20.5 / 18.18 | Стабилен 24.0 / 22.16 | Ручной `addEventListener('abort', fn, { once: true })` | Возвращает Disposable |
| `timers/promises` (`setTimeout`, `setInterval` как async-итератор, `scheduler.wait`) | 15.0 | Стабилен | `delay`, `sleep`, `p-wait-for` | |
| `stream/promises`: `pipeline`, `finished` | 15.0 | Стабилен | `pump`, `mississippi`, `end-of-stream` | |
| `stream.compose` | 16.9 | **Стабилен 26.2** | | |
| `Readable.prototype.map/filter/toArray/...` | 17.4 | В документации 26 всё ещё **Experimental** | | Лучше async-генераторы в `pipeline` |
| `import.meta.dirname`, `import.meta.filename` | 21.2 / 20.11 | Стабильны **24.0 / 22.16** | Шаблон `fileURLToPath(new URL('.', import.meta.url))` | |
| `import.meta.main` | **24.2 / 22.18** | 1.0 Early development | `require.main === module` в CJS | На 24.17 возвращает `true` для точки входа |
| `import.meta.resolve` | 13.9 | Синхронный с 20.0; 1.2 RC | `require.resolve` из ESM | |
| `process.getBuiltinModule(id)` | 22.3 / 20.16 | Стабилен | Условный `require('node:...')` в ESM и изоморфном коде | |
| `module.registerHooks` (синхронные хуки в том же потоке) | 23.5 / 22.15 | **RC с 25.4 / 24.13.1** | `module.register()` (асинхронный, в отдельном потоке) — **runtime-deprecated в 26.0 (DEP0205)** | |
| `module.enableCompileCache` | 22.8 | Стабилен **25.4** | `v8-compile-cache` | Подробнее в [performance.md](performance.md) |
| `module.findPackageJSON` | 23.2 / 22.14 | 1.1 | `pkg-up`, `read-pkg-up` | |
| `--watch`, `--watch-path` | 18.11 / 16.19 | Стабильны **22.0 / 20.13** | `nodemon` для простых перезапусков | |
| Type stripping (`node file.ts`) | 22.6 (флаг) | По умолчанию 23.6 / 22.18; **стабилен 25.2 / 24.12**; `--experimental-transform-types` удалён в 26.0 | `ts-node`, часто `tsx` | Только стираемый синтаксис, см. [раздел про ESM и TS](#esm-cjs-requireesm-и-typescript) |
| `require(esm)` | 22.0 / 20.17 (флаг) | Без флага 23.0 / 22.12 / 20.19; без предупреждения 23.5 / 22.13; **стабилен 25.4** | Двойная сборка ESM+CJS у многих библиотек | См. [раздел про ESM и TS](#esm-cjs-requireesm-и-typescript) |
| `node:test` + `--test` | 18.0 | Стабилен 20.0 | `mocha`/`jest` для простых наборов | См. [testing.md](testing.md) |
| `process.addUncaughtExceptionCaptureCallback` | 25.9 | Experimental | `setUncaughtExceptionCaptureCallback` (один слот) | |

**Пакет → замена по манифесту e18e** (выборка проверенных сопоставлений).

| Пакет | Замена |
|---|---|
| `node-fetch`, `axios`, `cross-fetch`, `request`, `isomorphic-fetch` | `fetch` (или `ofetch`, `ky`, если нужен сахар) |
| `chalk`, `colors`, `cli-color` | `util.styleText` (или `picocolors`, `ansis`) |
| `strip-ansi` | `util.stripVTControlCharacters` |
| `dotenv` | `process.loadEnvFile`, `--env-file` |
| `glob`, `fast-glob`, `globby` | `fs.promises.glob` или `tinyglobby` / `fdir` |
| `rimraf` | `fs.promises.rm` |
| `mkdirp`, `make-dir` | `fs.promises.mkdir({ recursive: true })` |
| `fs-extra` | `fs` |
| `tmp`, `temp`, `mktemp`, `quick-temp` | `fs.promises.mkdtempDisposable` / `mkdtemp` |
| `minimist`, `arg` | `util.parseArgs` (или `mri`) |
| `uuid`, `uuidv4`, `node-uuid` | `crypto.randomUUID` |
| `deep-equal` | `util.isDeepStrictEqual` (или `dequal`) |
| `clone-deep`, `lodash.clone` | `structuredClone` |
| `escape-string-regexp`, `lodash.escaperegexp` | `RegExp.escape` |
| `p-defer` / `p-try` | `Promise.withResolvers` / `Promise.try` |
| `lodash.groupby`, `object.groupby` | `Object.groupBy` |
| `is-error`, `lodash.iserror` | `Error.isError` |
| `abort-controller`, `event-target-shim` | `AbortController`, `EventTarget` |
| `sqlite3` | `node:sqlite` (или `better-sqlite3`, `@libsql/client`) |
| `qs`, `querystring` | `URLSearchParams` (или `fast-querystring`, `picoquery`) |
| `readable-stream`, `event-stream`, `mississippi`, `through` | `node:stream` |
| `bluebird`, `q` | Нативный `Promise` |
| `moment` | `day.js`, `date-fns`, `luxon`, `Date`, `Temporal` |
| `pako` | `node:zlib`, `CompressionStream`, `fflate` |
| `jsonwebtoken` | `jose` |
| `lodash` целиком | `es-toolkit` (или нативные методы) |
| `debug` | `obug` (или `util.debuglog`) |
| `execa`, `cross-spawn` | `tinyexec` |

**Оговорки при замене**
- `fetch` не имеет таймаута по умолчанию и не отклоняется на HTTP 4xx/5xx. Всегда передавать `signal: AbortSignal.timeout(ms)`, проверять `res.ok` и читать или отменять тело (`await res.text()` / `res.body?.cancel()`), чтобы сокет вернулся в пул. Подробнее про undici — в [domains-server.md](domains-server.md).
- `structuredClone` не заменяет копирование экземпляров классов: прототип становится `Object.prototype`, функции дают `DataCloneError`, геттеры не копируются. Сохраняет `Date`, `Map`, `Set`, `RegExp`, typed arrays, `Error` (вместе с `cause`) и циклические ссылки.
- `util.parseArgs` по умолчанию строгий: неизвестная опция бросает `TypeError: Unknown option '--nope'`. Для CLI это хорошо, но генерации help и подкоманд нет — для этого `commander`, `citty`, `cleye` (см. [domains-client.md](domains-client.md)).
- `--env-file` не подставляет `${VAR}` и не перезаписывает переменные, уже заданные в окружении. Валидацию (Zod, Valibot, `env-schema`) при старте оставить (см. [architecture.md](architecture.md)).
- `fs.glob` возвращает async-итератор: `await Array.fromAsync(glob('**/*.ts', { exclude: ['**/node_modules/**'] }))`. Шаблон `'node_modules/**'` исключает только корневой `node_modules`, вложенные (`pkg/node_modules/...`) остаются в выдаче (проверено локально на 24.17 и 26.13).
- `node:sqlite` синхронный (как `better-sqlite3`) и блокирует event loop. Подходит для CLI, тестов, локальных кэшей и небольших сервисов. Тяжёлые запросы — в worker.
- `util.styleText` учитывает `NO_COLOR` / `FORCE_COLOR` / не-TTY с 22.8 / 20.18. Чтобы проверить конкретный поток, передать `{ stream }`.

**Типичный CLI-скрипт без зависимостей (Node 24+).** Источники: [util](https://nodejs.org/api/util.html), [fs](https://nodejs.org/api/fs.html), [process](https://nodejs.org/api/process.html).
```js
#!/usr/bin/env node
import { parseArgs, styleText } from 'node:util';
import { glob, rm } from 'node:fs/promises';

const { values, positionals } = parseArgs({
  options: { dry: { type: 'boolean', short: 'n' }, env: { type: 'string' } },
  allowPositionals: true,            // strict: true по умолчанию — неизвестные опции бросают
});
if (values.env) process.loadEnvFile(values.env);

const files = await Array.fromAsync(glob(positionals[0] ?? '**/*.tmp', { exclude: ['**/node_modules/**'] }));
for (const f of files) {
  if (!values.dry) await rm(f, { force: true });
  console.log(styleText(values.dry ? 'yellow' : 'green', f));
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [e18e: replacements](https://e18e.dev/docs/replacements/) | e18e community | Руководство по заменам в читаемом виде |
| [module-replacements](https://github.com/es-tooling/module-replacements) | e18e (переехал в e18e/module-replacements) | Машиночитаемые манифесты: `native.json`, `preferred.json`, `micro-utilities.json` |
| [eslint-plugin-depend](https://github.com/es-tooling/eslint-plugin-depend) | e18e | Правило ESLint для заменимых зависимостей |
| [Speeding up the JavaScript ecosystem](https://marvinh.dev/blog/speeding-up-javascript-ecosystem/) | Marvin Hagemeister, 2023 | Чем вредит раздувание зависимостей (цепочки полифилов) |
| [util](https://nodejs.org/api/util.html) | Node.js | `parseArgs`, `styleText`, `parseEnv`, `aborted`, `isDeepStrictEqual`, `stripVTControlCharacters`, `debuglog` |
| [fs](https://nodejs.org/api/fs.html) | Node.js | `glob`, `rm`, `mkdir`, `cp`, `mkdtempDisposable`, dispose у FileHandle |
| [sqlite](https://nodejs.org/api/sqlite.html) | Node.js | `node:sqlite` (Release candidate с 25.7) |
| [Globals](https://nodejs.org/api/globals.html) | Node.js | `fetch`, `WebSocket`, `structuredClone`, `navigator`, `URLPattern`, `localStorage`, `EventSource` |
| [crypto](https://nodejs.org/api/crypto.html) | Node.js | `randomUUID`, `randomUUIDv7` |
| [events](https://nodejs.org/api/events.html) | Node.js | `on`, `once`, `addAbortListener`, `captureRejections` |
| [CLI](https://nodejs.org/api/cli.html) | Node.js | `--env-file`, `--watch`, `--unhandled-rejections` |
| [process](https://nodejs.org/api/process.html) | Node.js | `loadEnvFile`, `getBuiltinModule`, `exitCode`, обработчики ошибок процесса |
| [Web Streams API](https://nodejs.org/api/webstreams.html) | Node.js | WHATWG-потоки в Node |
| [url](https://nodejs.org/api/url.html) | Node.js | WHATWG `URL`, `URL.parse`, `URL.canParse`; устаревший `url.parse` |
| [Fetch](https://nodejs.org/learn/getting-started/fetch) | Node.js | `fetch` на undici, стриминг |
| [How to read environment variables](https://nodejs.org/learn/command-line/how-to-read-environment-variables-from-nodejs) | Node.js | Использование `--env-file` |
| [undici](https://github.com/nodejs/undici) | Node.js | Реализация `fetch`, Agent/Pool, MockAgent; [документация](https://undici.nodejs.org/) |
| [prefer-node-protocol](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-node-protocol.md) | Sindre Sorhus | Правило о префиксе `node:` |
| [node-glob](https://github.com/isaacs/node-glob) | Isaac Z. Schlueter | Самый полный glob — когда `fs.glob` не хватает |
| [dotenv](https://github.com/motdotla/dotenv) | motdotla | Всё ещё нужен для подстановки и нескольких env-файлов |
| [picocolors](https://github.com/alexeyraspopov/picocolors) | Alexey Raspopov | Крошечная библиотека цветов |
| [uuid](https://github.com/uuidjs/uuid) | uuidjs | v1/v6/v7, когда `randomUUIDv7` нет |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | WiseLibs | Зрелый синхронный SQLite, возможностей больше, чем у `node:sqlite` |
| [moment](https://github.com/moment/moment) | Moment team | В режиме поддержки; замена — Temporal, date-fns, luxon |

## ESM, CJS, require(esm) и TypeScript

**Ключевые выводы**
- **По умолчанию для нового кода в 2026 году — ESM**: `"type": "module"`, файлы `.js`, `import`, встроенные модули с префиксом `node:`, явные расширения в относительных импортах. Поле `"type"` задавать явно: для неоднозначных `.js` Node включает определение синтаксиса (по умолчанию с 22.7 / 20.19), а это лишняя работа при загрузке.
- **`require(esm)` стабилен с 25.4** и работает без флага на всех поддерживаемых линиях (22.12+, 24, 26). Правила:
  - только полностью синхронные графы модулей; любой top-level `await` даёт `ERR_REQUIRE_ASYNC_MODULE`;
  - возвращается namespace модуля: default-экспорт лежит в `.default`, при наличии default добавляется `__esModule: true`;
  - ES-модуль может сам выбрать, что получат CJS-потребители: `export { x as 'module.exports' }`. Именованные экспорты тогда для CJS теряются, если не прикреплены к `x`;
  - проверка поддержки — `process.features.require_module` (на 24.17 — `true`), отключение — `--no-require-module`, трассировка — `--trace-require-module`;
  - условие экспорта `"module-sync"` отдаёт ESM и для `import`, и для `require`.
- Следствие для **библиотек**: ESM-only пакеты теперь подключаются из CJS на всех поддерживаемых линиях Node. Поэтому ESM-only — рекомендация по умолчанию для новых библиотек с `engines.node >= 20.19 || >= 22.12` (Anthony Fu, «Move on to ESM-only», февраль 2025). Двойная публикация остаётся переходным инструментом. У dual-пакетов есть **dual package hazard**: две копии синглтона или класса в процессе, отсюда ложные `instanceof`. Детали публикации — в [domains-client.md](domains-client.md).
- **Не использовать TLA в точках входа библиотек** — пакет перестаёт загружаться через `require`. В точках входа приложений и в скриптах TLA нормален.
- Замены CJS-глобалов в ESM: `import.meta.dirname` / `import.meta.filename` (стабильны 24.0 / 22.16); `import.meta.main` (24.2 / 22.18, early development) вместо `require.main === module`; `import.meta.resolve`; `module.createRequire(import.meta.url)` для JSON и нативных аддонов; `process.getBuiltinModule('node:fs')` — условный доступ к встроенным модулям в изоморфном коде без статического `import`.
- JSON: `import data from './data.json' with { type: 'json' }` (стабильно с 22.12 / 23.1). Старый синтаксис `assert { type: 'json' }` из Node 22 удалён. JSON по пути, известному только в рантайме: `JSON.parse(await readFile(p, 'utf8'))`.
- **Subpath imports** (`"imports": { "#db": "./src/db/index.ts" }`) вместо `paths` из TS. Работают в Node, в type stripping и в TS с `nodenext`. Префикс `#/` разрешён с 25.4 / 24.14.
- Хуки загрузчика: `module.registerHooks()` (синхронные, в том же потоке, RC с 25.4 / 24.13.1). `module.register()` **runtime-deprecated в 26** (DEP0205).
- **TypeScript напрямую**: type stripping **стабилен с 25.2 / 24.12** и включён по умолчанию с 23.6 / 22.18. Поддерживается только стираемый синтаксис:
  - нет `enum`, runtime-`namespace`, parameter properties, алиасов `import x = require()`, декораторов, `.tsx`;
  - tsconfig игнорируется (значит, `paths` не работают);
  - в импортах обязательны расширения `.ts`; для импортов только типов — `import type`;
  - файлы внутри `node_modules` не обрабатываются.
  `--experimental-transform-types` **удалён в 26.0**. Рекомендуемый tsconfig: `module: nodenext`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `rewriteRelativeImportExtensions`, `noEmit` (подробнее в [typescript.md](typescript.md)). Локальная проверка: `node e.ts` с `enum E {}` на 24.17 падает с синтаксической ошибкой.
- Как это меняет идиомы TS: `as const`-объекты и union-типы вместо `enum`; явное присваивание полей вместо parameter properties; функции и композиция вместо фреймворков на декораторах (или оставить шаг сборки для кода в стиле NestJS).

**`package.json` приложения или библиотеки на ESM.** Источник: [Packages](https://nodejs.org/api/packages.html).
```json
{
  "type": "module",
  "engines": { "node": ">=22.12" },
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "imports": { "#lib/*": "./src/lib/*" }
}
```

**Стираемый TS вместо `enum` и parameter properties.** Источник: [Modules: TypeScript](https://nodejs.org/api/typescript.html).
```ts
// node src/main.ts — без сборки
import type { User } from './types.ts';            // type-only импорт обязателен
import { db } from '#lib/db.ts';

export const Role = { Admin: 'admin', Guest: 'guest' } as const;   // вместо enum
export type Role = (typeof Role)[keyof typeof Role];

export class UserService {
  readonly #db: typeof db;
  constructor(database: typeof db) { this.#db = database; }        // вместо parameter properties
}

if (import.meta.main) await main();                                // вместо require.main === module
```

**ESM-библиотека, которую удобно загружать из CJS.** Источник: [Modules: CommonJS — Loading ECMAScript modules using require()](https://nodejs.org/api/modules.html).
```js
// index.js (ESM, без top-level await)
export function parse(s) { /* ... */ }
export function format(v) { /* ... */ }
const api = { parse, format };
export { api as 'module.exports' };     // require('lib') вернёт { parse, format }

// consumer.cjs
const { parse } = require('lib');        // работает на 22.12+, 24, 26
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Modules: CommonJS](https://nodejs.org/api/modules.html) | Node.js | Раздел «Loading ECMAScript modules using require()»: правила, экспорт `'module.exports'` |
| [Modules: ECMAScript modules](https://nodejs.org/api/esm.html) | Node.js | `import.meta.*`, import attributes, JSON modules, отличия от CJS |
| [Packages](https://nodejs.org/api/packages.html) | Node.js | Определение типа модуля, syntax detection, conditional exports (включая `module-sync`), `#`-импорты |
| [Modules: node:module API](https://nodejs.org/api/module.html) | Node.js | `registerHooks`, `enableCompileCache`, `findPackageJSON`, `createRequire` |
| [Modules: TypeScript](https://nodejs.org/api/typescript.html) | Node.js | Правила type stripping, рекомендуемый tsconfig |
| [Running TypeScript natively](https://nodejs.org/learn/typescript/run-natively) | Node.js | Туториал по `node file.ts` |
| [Publishing a package](https://nodejs.org/learn/modules/publishing-a-package) | Node.js | Публикация ESM/CJS |
| [require(esm) in Node.js](https://joyeecheung.github.io/blog/2024/03/18/require-esm-in-node-js/) | Joyee Cheung, 2024 (обновлено 2025-12-25) | Дизайн `require(esm)`; в её тесте на 30 ESM-only пакетах `require` примерно в 1.22 раза быстрее `import` |
| [Блог Joyee Cheung](https://joyeecheung.github.io/blog/) | Joyee Cheung | Продолжения про загрузку модулей и compile cache |
| [Node Weekly #608](https://nodeweekly.com/issues/608) | Node Weekly, 2026-01-22 | 25.4.0: `require(esm)` и compile cache стабильны |
| [Move on to ESM-only](https://antfu.me/posts/move-on-to-esm-only) | Anthony Fu, 2025 | Аргументы за ESM-only пакеты |
| [TypeScript 5.8 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html) | Microsoft, 2025 | `erasableSyntaxOnly`, поддержка `require(esm)` в `--module node18/nodenext` |
| [TSConfig Reference](https://www.typescriptlang.org/tsconfig/) | Microsoft | Справочник tsconfig |
| [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) `[устарело]` частично | Sindre Sorhus, 2021 | Исторический FAQ; история с CJS-потребителями изменилась после `require(esm)` — актуальная замена: раздел про `require(esm)` в документации Modules |

## Обработка ошибок

**Ключевые выводы**
- **Два вида ошибок** (Dave Pacheco, Joyent, 2014 — до сих пор каноническая рамка; nodebestpractices 2.3 «Distinguish catastrophic errors from operational errors»):
  - *операционные* — ожидаемые условия рантайма в корректном коде: ECONNRESET, таймаут, 404 от upstream, неверный ввод пользователя, нет места на диске. Их обрабатывают: повтор, перевод в доменную ошибку, ответ клиенту;
  - *ошибки программиста* — баги: TypeError на `undefined`, неверные типы аргументов, нарушенный инвариант. Их не «восстанавливают»: процесс падает и перезапускается.
  Оригинал статьи доступен только через архив; формулировки сверены по вторичным источникам `[не проверено]`.
- **Политика падения** (документация Node): `'uncaughtException'` — «a crude mechanism ... intended to be used only as a last resort»; «It is not safe to resume normal operation after 'uncaughtException'». Использовать его только для синхронной очистки и логирования; перезапуск — дело внешнего супервизора (systemd, Kubernetes, restart policy контейнера, PM2).
- **Необработанные rejections роняют процесс по умолчанию с Node 15** (`--unhandled-rejections=throw`): rejection поднимается как uncaught exception с `origin === 'unhandledRejection'`. Пакет `make-promises-safe` поэтому `[устарело]` — замена встроена в Node.
- Обработчики уровня процесса — в одном месте, обычно в `main`: залогировать настоящим логгером (для фатальных — с синхронным сбросом), выставить `process.exitCode = 1`, начать graceful shutdown с жёстким таймаутом, выйти. Не вызывать `process.exit()`, пока не дописан stdout: выставить `process.exitCode` и дать циклу событий опустеть. По документации, выбросить неперехваченную ошибку «безопаснее, чем вызвать `process.exit()`». Пакет `close-with-grace` (Matteo Collina) оформляет этот шаблон. Health checks и Kubernetes — в [architecture.md](architecture.md).
- **Бросать только экземпляры `Error`** (не строки и не простые объекты): стек захватывает только `Error`. Линтер: `@typescript-eslint/only-throw-error`, `prefer-promise-reject-errors`.
- **Оборачивать, а не подменять**: `throw new DbError('load user failed', { cause: err })`. ESLint **9.35** добавил правило `preserve-caught-error` (входит в recommended `@eslint/js`): требует `cause` при повторном броске внутри `catch`. `util.inspect` печатает всю цепочку `[cause]`. Сериализатор `err` в pino 10 вкладывает цепочку `cause` в `message` («boom: root») и `stack` («caused by: …»), отдельного поля `cause` нет (проверено локально).
- **Свои ошибки**: подкласс `Error`, задать `name`, стабильный машиночитаемый `code` (стиль ядра Node: `err.code === 'ENOENT'`, `'ERR_INVALID_ARG_TYPE'`), сообщение — для человека. Проверять по `code`, по `instanceof` (в одном realm) или через `Error.isError` (в любом realm). Ядро Node использует `code` именно затем, чтобы менять тексты сообщений без semver-major. Библиотеки: `@fastify/error` (`createError(code, message, statusCode)`), `http-errors` для HTTP-статусов.
- **`AggregateError`** приходит из `Promise.any`, когда все промисы отклонены (массив `errors`). Использовать его и самому, когда нужно сообщить о нескольких независимых сбоях (валидация многих полей, результаты `Promise.allSettled`).
- **Асинхронные стеки**: «zero-cost async stack traces» в V8 идут только по цепочкам `await`. `return await` внутри async-функции сохраняет кадр вызывающего, а возврат голого промиса его теряет. Локальная проверка: `at async outer` есть при `await inner()` и отсутствует при `return inner()`. nodebestpractices 2.12: «Always await promises before returning to avoid a partial stacktrace». Правило typescript-eslint `return-await` (по умолчанию `in-try-catch`; строгие конфиги — `error-handling-correctness-only`). Без `await` конструкция `try { return x } catch` вообще не поймает rejection.
- **EventEmitter и потоки**: `emit('error')` без слушателя бросает исключение (проверено локально) и роняет процесс, если это произошло асинхронно. Всегда вешать слушатель `'error'` или использовать `pipeline()` / `events.once()` — они отклоняются на `'error'` (nodebestpractices 2.13). `new EventEmitter({ captureRejections: true })` направляет rejections из async-слушателей в `'error'`.
- **Не смешивать callbacks и throw** в одном API; не вызывать callback дважды; не резолвить промис и одновременно бросать. Старые callback-API — один раз через `util.promisify` на границе.
- **Валидация**: падать сразу на границе со схемой (Zod 4, Valibot, TypeBox — см. [typescript.md](typescript.md)). Внутренние функции доверяют своим типам и проверяют инварианты через `node:assert` (это ошибки программиста). В Node `assert` не вырезается (в отличие от Python с `-O`).
- `Error.captureStackTrace(obj, fn)` скрывает внутренние кадры вспомогательных конструкторов. `Error.stackTraceLimit` (по умолчанию 10) можно поднять в разработке (`--stack-trace-limit=50`) — это стоит CPU на каждом `new Error`.
- Библиотеки Result-типов (`neverthrow`, Effect) — спорная альтернатива, см. [Спорные места](#спорные-места).

**Граница: операционная ошибка переведена и обёрнута, ошибки программиста летят дальше.** Источники: [Errors](https://nodejs.org/api/errors.html), [preserve-caught-error](https://eslint.org/docs/latest/rules/preserve-caught-error).
```js
export class UpstreamError extends Error {
  name = 'UpstreamError';
  constructor(message, { cause, code = 'E_UPSTREAM', status } = {}) {
    super(message, { cause });
    this.code = code;
    this.status = status;
  }
}

export async function getUser(id, { signal } = {}) {
  const signals = [AbortSignal.timeout(5_000)];
  if (signal) signals.push(signal);
  let res;
  try {
    res = await fetch(`${BASE}/users/${encodeURIComponent(id)}`, { signal: AbortSignal.any(signals) });
  } catch (err) {
    throw new UpstreamError('user service unreachable', { cause: err });
  }
  if (res.status === 404) { await res.body?.cancel(); return null; }   // ожидаемый случай, не ошибка
  if (!res.ok) {
    await res.body?.cancel();
    throw new UpstreamError(`user service ${res.status}`, { status: res.status });
  }
  return res.json();
}
```

**Обработчик уровня процесса: залогировать, остановиться, выйти.** Источники: [process](https://nodejs.org/api/process.html), [close-with-grace](https://github.com/mcollina/close-with-grace).
```js
// main.js — единственное место для обработчиков процесса
const SHUTDOWN_TIMEOUT_MS = 10_000;

function crash(err, origin) {                 // origin: 'uncaughtException' | 'unhandledRejection'
  fatalLog.fatal({ err, origin }, 'process crashed');   // логгер с синхронным сбросом
  process.exitCode = 1;
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();   // жёсткий предел
  shutdown();
}
function shutdown() {
  server.close();                             // перестать принимать трафик, дать запросам завершиться
  // клиенты с keep-alive держат соединение после ответа, и close() ждёт keepAliveTimeout
  setInterval(() => server.closeIdleConnections(), 500).unref();
}
process.on('uncaughtException', crash);       // rejections в режиме throw приходят сюда же
for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, shutdown);
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Error Handling in Node.js (архив)](https://web.archive.org/web/20220126222902/https://www.joyent.com/node-js/production/design/errors) | Dave Pacheco (Joyent), 2014 | Операционные ошибки против ошибок программиста — классика; оригинальный URL отдаёт 404 |
| [Перевод на Хабре](https://habr.com/en/articles/222761) | Habr, 2014 | Русский перевод статьи Joyent |
| [Errors](https://nodejs.org/api/errors.html) | Node.js | Классы ошибок, `error.code`, системные ошибки, `captureStackTrace`, `cause` |
| [process](https://nodejs.org/api/process.html) | Node.js | Предупреждение об `uncaughtException`, `unhandledRejection`, `exitCode` против `exit()`, `addUncaughtExceptionCaptureCallback` (25.9, experimental) |
| [CLI](https://nodejs.org/api/cli.html) | Node.js | Режимы `--unhandled-rejections`, `throw` по умолчанию с 15 |
| [Node.js v15.0.0](https://nodejs.org/en/blog/release/v15.0.0) | Node.js, 2020 | Необработанные rejections стали фатальными |
| [events](https://nodejs.org/api/events.html) | Node.js | Событие `'error'`, `captureRejections` |
| [nodebestpractices](https://github.com/goldbergyoni/nodebestpractices) | Yoni Goldberg и др., издание 2026 | Раздел 2 про ошибки (2.1–2.13). README пишет «2026 edition», бейдж — «Last update Jan 3 2024»: ориентироваться на теги `#new/#updated` у пунктов |
| [Unhandled rejections](https://jakearchibald.com/2023/unhandled-rejections/) | Jake Archibald, 2023 | Параллельные промисы + `for await` → ложные unhandled rejections, исправления |
| [preserve-caught-error](https://eslint.org/docs/latest/rules/preserve-caught-error) | ESLint, 2025 | Требует `cause` при повторном броске (9.35, recommended) |
| [prefer-promise-reject-errors](https://eslint.org/docs/latest/rules/prefer-promise-reject-errors) | ESLint | Reject только с `Error` |
| [no-async-promise-executor](https://eslint.org/docs/latest/rules/no-async-promise-executor) | ESLint | `new Promise(async ...)` глотает исключения |
| [only-throw-error](https://typescript-eslint.io/rules/only-throw-error/) | typescript-eslint | Бросать только `Error` |
| [return-await](https://typescript-eslint.io/rules/return-await/) | typescript-eslint | `return await` ради стека и `try/catch` |
| [Fastify: Errors](https://github.com/fastify/fastify/blob/main/docs/Reference/Errors.md) | Fastify | Каталог кодов ошибок, устройство error handler |
| [fastify-error](https://github.com/fastify/fastify-error) | Fastify | `createError(code, msg, status)` |
| [http-errors](https://github.com/jshttp/http-errors) | jshttp | HTTP-ошибки для приложений в стиле Express |
| [serialize-error](https://github.com/sindresorhus/serialize-error) | Sindre Sorhus | Сериализация ошибок (с `cause`) в JSON |
| [pino-std-serializers](https://github.com/pinojs/pino-std-serializers) | pino | Сериализатор `err` |
| [close-with-grace](https://github.com/mcollina/close-with-grace) | Matteo Collina | Graceful shutdown по сигналам и фатальным ошибкам |
| [make-promises-safe](https://github.com/mcollina/make-promises-safe) `[устарело]` | Matteo Collina | История: падение на unhandled rejection; встроено в Node с 15 |
| [HowProgrammingWorks/Errors](https://github.com/HowProgrammingWorks/Errors) | Timur Shemsedinov | Примеры обработки ошибок (русскоязычное сообщество) |

## Логирование

**Ключевые выводы**
- **Структурный логгер**, пишущий JSON-строки в stdout (12-factor: «logs are event streams»); доставку логов берёт на себя платформа. В Node по умолчанию это **pino**: быстрый, транспорты асинхронны и работают в worker threads, есть `redact` и child-логгеры (nodebestpractices 2.7 «Use a mature logger»). `console.log` годится для CLI и скриптов, но не для сервисов: нет уровней, нет структуры, на некоторых приёмниках вывод синхронный.
- Передавать объект ошибки, а не её сообщение: `log.error({ err }, 'payment failed')` — сериализатор сохранит `stack`, `code` и цепочку `cause` (внутри `message` и `stack`). Не логировать и не перебрасывать на каждом слое: логировать один раз, на границе, которая ошибку обрабатывает.
- **Контекст**: `const log = baseLog.child({ reqId })`. Неявная передача контекста — через `AsyncLocalStorage` (см. [concurrency-async-native.md](concurrency-async-native.md)). Fastify даёт готовый `request.log`.
- **Секреты вырезать в логгере** (`redact: ['req.headers.authorization', '*.password']`), а не надеяться на аккуратность в местах вызова.
- **Не форматировать на горячем пути**: `log.debug({ obj }, 'msg')` в pino дёшев при выключенном уровне, а `log.debug(JSON.stringify(big))` строит строку в любом случае.
- Библиотеки по умолчанию не логируют: генерируют события, принимают внедрённый логгер (интерфейс, совместимый с pino) или используют `util.debuglog('mylib')` (включается через `NODE_DEBUG=mylib`) — канал отладки без зависимостей. Для событий, которые снимают APM, правильный путь — `diagnostics_channel`.
- **Фатальный путь**: при падении логировать синхронно (`pino.destination({ sync: true })` для фатального обработчика или `logger.flush()`), иначе последняя строка может потеряться.
- Pretty print (`pino-pretty`) — только в разработке (опция `transport` или pipe), никогда в продакшен-контейнерах.
- Корреляция логов с OpenTelemetry, pino против winston — в [domains-server.md](domains-server.md).

**Приложение, библиотека, фатальный путь.** Источники: [pino](https://getpino.io/), [diagnostics_channel](https://nodejs.org/api/diagnostics_channel.html).
```js
// приложение
import pino from 'pino';
export const log = pino({ redact: ['req.headers.authorization', '*.password'] });
export const fatalLog = pino(pino.destination({ sync: true }));   // для обработчика падения

const reqLog = log.child({ reqId });
reqLog.error({ err }, 'payment failed');                           // объект ошибки, не err.message

// библиотека: без зависимостей и без вывода по умолчанию
import { debuglog } from 'node:util';
import diagnostics_channel from 'node:diagnostics_channel';
const debug = debuglog('mylib');                                   // NODE_DEBUG=mylib
const queryChannel = diagnostics_channel.channel('mylib:query');
export function query(sql) {
  debug('query %s', sql);
  if (queryChannel.hasSubscribers) queryChannel.publish({ sql });
  /* ... */
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [pino](https://getpino.io/) | pino team (Matteo Collina и др.) | Документация |
| [Child loggers](https://github.com/pinojs/pino/blob/main/docs/child-loggers.md) | pino | Child-логгеры |
| [Redaction](https://github.com/pinojs/pino/blob/main/docs/redaction.md) | pino | Пути для вырезания секретов |
| [Logs](https://12factor.net/logs) | Adam Wiggins, 2011 | Логи как поток событий |
| [util](https://nodejs.org/api/util.html) | Node.js | `util.debuglog` |
| [Diagnostics Channel](https://nodejs.org/api/diagnostics_channel.html) | Node.js | Канал инструментирования для библиотек |
| [Asynchronous context tracking](https://nodejs.org/api/async_context.html) | Node.js | `AsyncLocalStorage` для контекста запроса |
| [opentelemetry-js](https://github.com/open-telemetry/opentelemetry-js) | OpenTelemetry | Трассировка и корреляция логов |

## Асинхронные паттерны

**Ключевые выводы**
- **Комбинатор выбирать по семантике отказа**:
  - `Promise.all` — нужны все результаты, падение на первом rejection. Остальные операции продолжают выполняться (неявной отмены нет). Если работа дорогая — общий `AbortSignal` и `abort()` в `catch`;
  - `Promise.allSettled` — нужен каждый исход (пакетные задачи, fan-out с отчётом). Затем `results.filter(r => r.status === 'rejected')` и, возможно, `new AggregateError(...)`;
  - `Promise.any` — побеждает первый успех (зеркала, hedged requests); если все отклонены — `AggregateError`;
  - `Promise.race` — побеждает первое завершение. Для таймаутов почти вытеснен `AbortSignal.timeout`: в гонке проигравший продолжает работать, а его поздний rejection может оказаться необработанным.
- **Последовательный `await` в цикле — запах, только если элементы независимы** (`no-await-in-loop`). Когда важны порядок или темп — это правильно. Для независимой работы с ограничением — `p-limit` / `p-map({ concurrency })` или небольшой цикл-пул воркеров. Неограниченный `Promise.all(items.map(fetch))` на 10 тысяч элементов исчерпывает сокеты и память. Подробнее и про `p-queue` — в [concurrency-async-native.md](concurrency-async-native.md).
- **Запускать промисы рано и ждать поздно можно, но обработчик нужен сразу**: если создать промисы, а ждать их потом в цикле `for await`, ранний rejection станет unhandled (Jake Archibald). Исправление: `Promise.all` / `allSettled` или пометочный `.catch(() => {})` с комментарием.
- **Отмена — это `AbortSignal` везде**: каждый свой async-API принимает `{ signal }` и передаёт его дальше — в `fetch`, `timers/promises`, `events.on/once`, `stream.pipeline`, `fs.readFile`, `child_process`. Сигнал вызывающего объединять с таймаутом: `AbortSignal.any([callerSignal, AbortSignal.timeout(ms)])` (причина отмены передаётся, проверено локально). Между тяжёлыми CPU-шагами — `signal.throwIfAborted()`.
- Ошибки отмены: abort даёт `AbortError` (`code: 'ABORT_ERR'`); таймаут через `timers/promises` даёт `AbortError` с `cause.name === 'TimeoutError'`; `fetch` с отменённым сигналом отклоняется с `AbortError`. Отмену пользователем от таймаута отличать по `signal.reason`.
- `events.addAbortListener(signal, fn)` (возвращает Disposable; стабилен 24.0 / 22.16) вместо `signal.addEventListener('abort', fn)`: не течёт и корректно работает при `stopImmediatePropagation`.
- **Async-итерация — идиома потоковой обработки**:
  - async-генераторы для пагинации (`async function* pages() { ... }`);
  - `for await (const chunk of readable)`;
  - `events.on(emitter, 'data', { signal })` превращает события в async-итератор; abort завершает его с `AbortError` после выдачи уже буферизованных событий;
  - `timers/promises.setInterval` для периодических задач;
  - `readline.createInterface({ input })` для построчного чтения файлов.
  Выход из `for await` через `break` вызывает `return()` и уничтожает поток — утечек нет.
- **Потоки**: собирать через `await pipeline(src, async function* (source) { for await (const c of source) yield f(c) }, dest)`. Никогда `.pipe()` без обработки ошибок. Backpressure подробно — в [concurrency-async-native.md](concurrency-async-native.md).
- **Ожидание одного события**: `await once(emitter, 'ready', { signal })` — отклоняется на `'error'`.
- **Внешнее разрешение промиса**: `Promise.withResolvers()` (Node 22+).
- **Асинхронная инициализация**: не делать async-работу в конструкторе. Статическая async-фабрика (`static async create()`) или рецепт «async init с очередью» (*Node.js Design Patterns*, гл. 11).
- **Склейка одинаковых запросов в полёте**: хранить *промис* в `Map` по ключу и удалять при завершении. С Node 26: `map.getOrInsertComputed(key, () => load(key).finally(() => map.delete(key)))`. *Node.js Design Patterns*, гл. 11 «batching, caching».
- **Не смешивать модели**:
  - никогда `new Promise(async (resolve) => ...)` (`no-async-promise-executor`);
  - никогда не передавать async-функцию туда, где ждут синхронный callback: `Array#forEach(async ...)`, слушатели EventEmitter без `captureRejections`, `setTimeout(async ...)` (typescript-eslint `no-misused-promises`);
  - не оставлять промисы «висящими» (`no-floating-promises`; в Biome — `noFloatingPromises`).
- `process.nextTick`, `queueMicrotask`, `setImmediate`: `queueMicrotask` — «после текущей синхронной работы», `setImmediate` — уступить I/O. Рекурсивный `nextTick` морит I/O голодом. Подробнее — в [concurrency-async-native.md](concurrency-async-native.md).

**Ограниченный fan-out, повторы с отменяемым backoff, сводная ошибка.** Источники: [p-limit](https://github.com/sindresorhus/p-limit), [timers](https://nodejs.org/api/timers.html).
```js
import { setTimeout as sleep } from 'node:timers/promises';
import pLimit from 'p-limit';

// AbortSignal.any([]) — сигнал, который никогда не сработает: код ниже не проверяет undefined
export async function syncAll(ids, { signal = AbortSignal.any([]), concurrency = 8 } = {}) {
  const limit = pLimit(concurrency);
  const results = await Promise.allSettled(ids.map(id => limit(() => syncOne(id, { signal }))));
  const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);
  if (failed.length) throw new AggregateError(failed, `${failed.length}/${ids.length} syncs failed`);
}

async function syncOne(id, { signal }) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await pushRecord(id, { signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) });
    } catch (err) {
      if (signal.aborted || attempt === 3 || !isRetryable(err)) throw err;
      await sleep(2 ** attempt * 100, undefined, { signal });     // backoff, который можно отменить
    }
  }
}
```

**События и страницы как async-итераторы.** Источники: [events](https://nodejs.org/api/events.html), [for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of).
```js
import { on, once } from 'node:events';

async function* fetchPages(url, { signal }) {         // пагинация как генератор
  for (let next = url; next; ) {
    const res = await fetch(next, { signal });
    if (!res.ok) { await res.body?.cancel(); throw new Error(`HTTP ${res.status}`); }
    const page = await res.json();
    yield* page.items;
    next = page.next;
  }
}

await once(server, 'listening', { signal });          // отклонится на 'error'
for await (const [msg] of on(socket, 'message', { signal })) {
  if (msg.type === 'bye') break;                      // break снимает слушатель
  handle(msg);
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) | MDN | Обзор комбинаторов |
| [for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) | MDN | Async-итерация, ранний выход вызывает `return()` |
| [AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) | MDN | Семантика `TimeoutError` |
| [AbortSignal.any()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static) | MDN | Объединение сигналов |
| [events](https://nodejs.org/api/events.html) | Node.js | `events.on`, `once`, `addAbortListener`, `captureRejections` |
| [Timers](https://nodejs.org/api/timers.html) | Node.js | `timers/promises`, `scheduler.wait` |
| [Stream](https://nodejs.org/api/stream.html) | Node.js | `pipeline` с async-генераторами, `compose` |
| [The Node.js Event Loop, Timers, and process.nextTick()](https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick) | Node.js | Таймеры против `nextTick` и `setImmediate` |
| [Don't Block the Event Loop](https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop) | Node.js | Разбиение работы и вынос в воркеры |
| [Unhandled rejections](https://jakearchibald.com/2023/unhandled-rejections/) | Jake Archibald, 2023 | Параллельные промисы и необработанные rejections |
| [Async iterators and generators](https://jakearchibald.com/2017/async-iterators-and-generators/) | Jake Archibald, 2017 | Введение в async-итераторы и генераторы |
| [promise-fun](https://github.com/sindresorhus/promise-fun) | Sindre Sorhus | Каталог утилит `p-*` и когда хватает нативного |
| [p-limit](https://github.com/sindresorhus/p-limit) | Sindre Sorhus | Ограничение конкурентности |
| [p-map](https://github.com/sindresorhus/p-map) | Sindre Sorhus | Конкурентный map с `signal` |
| [p-queue](https://github.com/sindresorhus/p-queue) | Sindre Sorhus | Очередь с приоритетами и rate limit |
| [p-retry](https://github.com/sindresorhus/p-retry) | Sindre Sorhus | Повторы с `AbortSignal` |
| [no-await-in-loop](https://eslint.org/docs/latest/rules/no-await-in-loop) | ESLint | Когда последовательный `await` — запах |
| [no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/) | typescript-eslint | Поиск необработанных промисов |
| [no-misused-promises](https://typescript-eslint.io/rules/no-misused-promises/) | typescript-eslint | Async-callbacks в синхронных слотах |
| [noFloatingPromises](https://biomejs.dev/linter/rules/no-floating-promises/) | Biome | Аналог в Biome |

## Паттерны проектирования в Node

**Ключевые выводы**
- **Каноническая книга — *Node.js Design Patterns*, 4-е изд.** (Luciano Mammino, Mario Casciaro, Packt, сентябрь 2025, «fully updated for Node.js 24»). 13 глав: платформа и reactor; модульная система (ESM, interop, TS); callbacks и события (Observer/EventEmitter); асинхронный control flow на callbacks; промисы и async/await; потоки; порождающие паттерны (Factory, Builder, Revealing Constructor, Singleton, DI); структурные (Proxy, Decorator, Adapter); поведенческие (Strategy, State, Command, генераторы и async-итераторы, Middleware); тестирование (новая глава: встроенный test runner и Playwright); продвинутые рецепты (async init, batching, кэширование, отмена, CPU-bound задачи); масштабирование (cluster, балансировка, Docker, Kubernetes, микросервисы); обмен сообщениями (ZeroMQ, RabbitMQ, Redis Streams). Подробнее о книгах — в [books.md](books.md).
- **GoF в форме Node**: паттерны сворачиваются в функции и модули.
  - *Singleton* = кэш экземпляров ES-модулей: один экземпляр на разрешённый путь — **а не** на пакет, если пакет продублирован в `node_modules` или есть dual package hazard. Лучше экспортировать фабрику и создавать экземпляр в composition root: синглтоны на уровне модуля делят состояние между тестами.
  - *Factory* = обычная функция, возвращающая объект или замыкание. Скрывает `new`, даёт инкапсуляцию через замыкания и `#private`.
  - *Revealing constructor* = `new Promise((resolve, reject) => ...)`, `new ReadableStream({ start, pull })`: возможности открыты только на время конструирования (Mammino/Casciaro, гл. 7).
  - *Builder* = объект опций с умолчаниями и валидацией. Fluent-builder — только для действительно сложного построения (построители запросов вроде Kysely).
  - *Dependency injection* = зависимости передаются параметрами или аргументами конструктора и связываются в одном composition root (`main.js`). Контейнеры (awilix, tsyringe, NestJS) — решение уровня [architecture.md](architecture.md).
  - *Proxy* = объект-обёртка, делегирование через объектный литерал или ES `Proxy`. ES `Proxy` дорог на горячих путях и ломает brand check для `#private`. Применения: ленивая инициализация, валидация, логирование, контроль доступа.
  - *Decorator* = функция высшего порядка `withRetry(fn)` или объект-обёртка. TC39-декораторов в Node нет (см. [Современный JavaScript в Node](#современный-javascript-в-node)).
  - *Adapter* = тонкий модуль, который приводит сторонний API к вашему порту (например, интерфейс хранилища поверх S3 или fs). Основа гексагональной архитектуры.
  - *Strategy / State* = объект функций или `Map` «ключ → обработчик» вместо цепочек `switch`. *Command* = сериализуемые объекты `{ type, payload }` (очереди, undo, event sourcing).
  - *Observer* = `EventEmitter` / `EventTarget`. Для доменных событий между модулями — явный pub/sub; для инструментирования — `diagnostics_channel`. Слушатели снимать (опция `{ signal }` у `addEventListener`, `events.on(..., { signal })`), иначе утечки и `MaxListenersExceededWarning`.
  - *Middleware / Chain of responsibility* = хуки Express/Koa/Fastify, конвейер async-функций.
  - *Iterator* = генераторы и async-генераторы (пагинация, ленивые конвейеры) плюс iterator helpers.
  - *Disposable resource* (новое): `Symbol.dispose` / `Symbol.asyncDispose` на своих классах ресурсов (пулы БД, блокировки, временные каталоги), чтобы вызывающий мог написать `await using`. `DisposableStack` внутри фабрик откатывает частично построенный объект.
- **Functional core, imperative shell**: чистые функции над простыми данными в ядре, I/O на краях. Такой код тестируется через `node:test` без моков (см. [testing.md](testing.md), [architecture.md](architecture.md)).
- **Композиция вместо наследования классов**: избегать глубоких цепочек `extends`, mixins — экономно.
- **Неизменяемость**: `const`, spread и `structuredClone`, `toSorted`/`with`, `Object.freeze` для констант конфигурации (заморозка поверхностная), readonly-типы в TS. Не замораживать объекты горячего пути «ради производительности» — сначала измерить ([performance.md](performance.md)).

**Фабрика с откатом частичного построения (Node 24+).** Источники: [DisposableStack](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DisposableStack), [fs](https://nodejs.org/api/fs.html). Проверено локально на Node 24.17: при ошибке до `move()` каталог удаляется, после выхода из блока `await using` — тоже.
```js
import { open, mkdtempDisposable } from 'node:fs/promises';

export async function createWorkspace(prefix) {
  await using stack = new AsyncDisposableStack();
  const tmp = stack.use(await mkdtempDisposable(prefix));
  const log = stack.use(await open(`${tmp.path}/log.txt`, 'w'));
  // если строка выше бросит, stack при выходе закроет файл и удалит каталог
  const owned = stack.move();                      // успех: ответственность переходит вызывающему
  return { tmp, log, async [Symbol.asyncDispose]() { await owned.disposeAsync(); } };
}

{
  await using ws = await createWorkspace('job-');
  await ws.log.writeFile('started');
}                                                  // файл закрыт, каталог удалён
```

**Strategy через объект функций, склейка запросов в полёте, async-фабрика.** Источник: *Node.js Design Patterns*, гл. 9 и 11 ([код книги](https://github.com/PacktPublishing/Node.js-Design-Patterns-Fourth-Edition)).
```js
const exporters = {                                // Strategy: вместо switch
  csv: rows => rows.map(r => r.join(',')).join('\n'),
  json: rows => JSON.stringify(rows),
};
export const exportRows = (format, rows) => {
  const fn = exporters[format];
  if (!fn) throw new TypeError(`unknown format: ${format}`);
  return fn(rows);
};

const inflight = new Map();                        // один запрос на ключ, сколько бы ни ждали
export function loadUser(id) {
  let p = inflight.get(id);                        // на Node 26: inflight.getOrInsertComputed(...)
  if (!p) {
    p = fetchUser(id).finally(() => inflight.delete(id));
    inflight.set(id, p);
  }
  return p;
}

export class Repo {                                // async-инициализация без async-конструктора
  #pool;
  constructor(pool) { this.#pool = pool; }         // конструктор только присваивает
  static async create({ connect }) {
    const pool = await connect();
    return new Repo(pool);
  }
}
const repo = await Repo.create({ connect: () => createPool(config) });   // в composition root
```

**Свой ресурс с `Symbol.dispose` и Observer без утечек.** Источники: [using](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using), [events](https://nodejs.org/api/events.html).
```js
export class Lease {
  #release;
  constructor(release) { this.#release = release; }
  [Symbol.dispose]() { this.#release(); }           // using lease = lock.acquire()
}

const ac = new AbortController();
target.addEventListener('tick', onTick, { signal: ac.signal });
emitter.on('error', onError);                       // у EventEmitter всегда есть путь для 'error'
// ...
ac.abort();                                         // снимает все слушатели, привязанные к сигналу
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js Design Patterns](https://nodejsdesignpatterns.com/) | Luciano Mammino, Mario Casciaro, 2025 | Сайт 4-го издания, список глав |
| [Node.js Design Patterns, 4th ed. (Packt)](https://www.packtpub.com/en-cl/product/nodejs-design-patterns-fourth-edition-9781803238944) | Packt, 2025 | Страница издателя (ISBN 9781803238944); блокирует автоматические клиенты (403) |
| [Код книги](https://github.com/PacktPublishing/Node.js-Design-Patterns-Fourth-Edition) | Packt | Примеры 4-го издания |
| [nodebestpractices](https://github.com/goldbergyoni/nodebestpractices) | Yoni Goldberg и др. | Раздел 3 о стиле кода (3.1–3.13), «Avoid effects outside of functions» |
| [practica](https://github.com/practicajs/practica) | Yoni Goldberg и др. | Эталонное Node-приложение, применяющее эти практики |
| [patterns.dev](https://www.patterns.dev/) | Lydia Hallie, Addy Osmani | Объяснения JS-паттернов |
| [Singleton Pattern](https://www.patterns.dev/vanilla/singleton-pattern) | patterns.dev | Почему синглтоны в JS-модулях — антипаттерн |
| [Refactoring.Guru: Design Patterns](https://refactoring.guru/design-patterns) | Alexander Shvets | Каталог GoF с диаграммами; читать критически, в Node паттерны проще |
| [HowProgrammingWorks/Index](https://github.com/HowProgrammingWorks/Index) | Timur Shemsedinov | Индекс примеров паттернов и асинхронности (русскоязычное сообщество, Metarhia) |
| [Fastify](https://github.com/fastify/fastify) | Fastify | Инкапсуляция плагинов, хуки, `app.decorate` — образец дизайна для Node |
| [avvio](https://github.com/mcollina/avvio) | Matteo Collina (сейчас fastify/avvio) | Асинхронная загрузка плагинов и паттерн boot |
| [Primordials](https://github.com/nodejs/node/blob/main/doc/contributing/primordials.md) | Node.js core | Зачем ядро использует primordials (устойчивость к prototype pollution) — в приложения не копировать |
| [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS) | Kyle Simpson | Семантика языка под паттернами: области видимости, замыкания, объекты |

## Мини-каталог паттернов

Задача → идиоматичное решение в Node → минимальная версия Node → источник.

| # | Задача | Идиоматичное решение | Мин. Node | Источник |
|---|---|---|---|---|
| 1 | Освободить файлы, временные каталоги, соединения с БД на всех путях | `await using fh = await open(p)`; свои классы реализуют `[Symbol.asyncDispose]` | 24 | [V8: ERM](https://v8.dev/features/explicit-resource-management); [fs](https://nodejs.org/api/fs.html) |
| 2 | Откатить частично построенный объект | `using stack = new DisposableStack(); stack.use(a); stack.defer(...); return stack.move()` | 24 | [DisposableStack](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DisposableStack) |
| 3 | Таймаут для любой async-операции | `{ signal: AbortSignal.timeout(ms) }`, с сигналом вызывающего — через `AbortSignal.any` | 20.3 | [AbortSignal.any()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static); [Globals](https://nodejs.org/api/globals.html) |
| 4 | Отменяемая пауза / backoff | `await setTimeout(ms, undefined, { signal })` из `node:timers/promises` | 16 | [Timers](https://nodejs.org/api/timers.html) |
| 5 | Превратить события в поток | `for await (const [x] of on(emitter, 'evt', { signal }))` | 13.6 | [events](https://nodejs.org/api/events.html) |
| 6 | Дождаться одного события | `await once(emitter, 'ready', { signal })` (отклоняется на `'error'`) | 15 | [events](https://nodejs.org/api/events.html) |
| 7 | Deferred-промис | `Promise.withResolvers()` | 22 | [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers) |
| 8 | Безопасно вызвать пользовательский callback, который может быть async | `Promise.try(cb, ...args)` | 24 (23) | [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/try) |
| 9 | Ограниченный параллелизм | `p-limit` / `p-map({ concurrency, signal })` + `Promise.allSettled` | любая | [promise-fun](https://github.com/sindresorhus/promise-fun) |
| 10 | Пагинация | `async function*`, отдающий элементы; потребитель — `for await` или `Array.fromAsync` после `take` | 22 | Mammino/Casciaro, гл. 9 |
| 11 | Преобразование потока | `await pipeline(src, async function* (s) { ... }, dest)` | 15 | [Stream](https://nodejs.org/api/stream.html) |
| 12 | Группировка и индексация данных | `Object.groupBy`, `Map.groupBy`; счётчики через `map.getOrInsert(k, 0)` | 21 / 26 | [Object.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy); [getOrInsertComputed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/getOrInsertComputed) |
| 13 | Операции над множествами | `a.union(b)`, `a.difference(b)` | 22 | [Set.prototype.union](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/union) |
| 14 | Ленивый конвейер над коллекцией | iterator helpers `.values().filter().map().take()` | 22 | [V8: iterator helpers](https://v8.dev/features/iterator-helpers) |
| 15 | Сортировка и обновление без мутации | `toSorted(cmp)`, `with(i, v)` | 20 | [toSorted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted) |
| 16 | Глубокая копия простых данных | `structuredClone(obj)` (не для экземпляров классов) | 17 | [Globals](https://nodejs.org/api/globals.html) |
| 17 | Ошибка с контекстом | `throw new XError(msg, { cause: err })`, стабильное свойство `code` | 16.9 | [Error: cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause); [preserve-caught-error](https://eslint.org/docs/latest/rules/preserve-caught-error) |
| 18 | Несколько отказов сразу | `new AggregateError(errors, msg)` | 15 | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) |
| 19 | Надёжно проверить «это ошибка?» | `Error.isError(x)` | 24.3 | [Error.isError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/isError) |
| 20 | Экранировать текст пользователя в регулярном выражении | `new RegExp(RegExp.escape(s))` | 24 | [RegExp.escape](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape) |
| 21 | Аргументы CLI | `util.parseArgs({ options, allowPositionals, strict: true })` | 18.3 (стабилен 20) | [util](https://nodejs.org/api/util.html) |
| 22 | Цветной вывод в терминал | `util.styleText(['bold', 'red'], s)` | 22.13 (стабилен) | [util](https://nodejs.org/api/util.html) |
| 23 | Конфигурация из `.env` | `node --env-file=.env` / `process.loadEnvFile()` + валидация схемой | 20.6 (стабильно 24.10) | [CLI](https://nodejs.org/api/cli.html) |
| 24 | Поиск файлов по маске | `await Array.fromAsync(glob(pattern, { exclude }))` из `node:fs/promises` | 22 (стабилен 24) | [fs](https://nodejs.org/api/fs.html) |
| 25 | `__dirname` в ESM | `import.meta.dirname` | 20.11 | [ESM](https://nodejs.org/api/esm.html) |
| 26 | «Запускать, только если это главный модуль» | `if (import.meta.main) main()` | 24.2 / 22.18 | [ESM](https://nodejs.org/api/esm.html) |
| 27 | CJS-потребитель вашей ESM-библиотеки | ESM-only + `engines >= 20.19 / 22.12`; при желании `export { x as 'module.exports' }` | 22.12 | [Modules: CommonJS](https://nodejs.org/api/modules.html) |
| 28 | Алиасы путей | `"imports": { "#db": "./src/db.js" }` в `package.json` | 14.6 | [Packages](https://nodejs.org/api/packages.html) |
| 29 | Встроенная БД / БД для тестов | `new DatabaseSync(':memory:')` из `node:sqlite` | 22.13 | [sqlite](https://nodejs.org/api/sqlite.html) |
| 30 | Склеить одинаковые одновременные запросы | Кэшировать промис в `Map`, удалять при завершении | любая | Mammino/Casciaro, гл. 11 |
| 31 | Асинхронная инициализация | Статическая async-фабрика `await Service.create(deps)` | любая | Mammino/Casciaro, гл. 11 |
| 32 | Подменяемый алгоритм | Объект или `Map` функций (Strategy) | любая | Mammino/Casciaro, гл. 9 |
| 33 | Арифметика дат и часовые пояса | `Temporal.ZonedDateTime`, `Temporal.Instant`, `Temporal.Duration` (на 22/24 — полифил) | 26 | [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) |
| 34 | Байты ↔ base64/hex одинаково во всех рантаймах | `bytes.toBase64()`, `Uint8Array.fromHex(s)` | 26 (25) | [Uint8Array.fromBase64](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64) |
| 35 | Большие целые в JSON без потерь | reviver `(k, v, { source }) => BigInt(source)`; на выходе `JSON.rawJSON` | 21 | [JSON.rawJSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/rawJSON) |
| 36 | Диагностика библиотеки без зависимостей для логирования | `util.debuglog('name')`, `diagnostics_channel.channel('lib:query')` | любая | [util](https://nodejs.org/api/util.html); [Diagnostics Channel](https://nodejs.org/api/diagnostics_channel.html) |

## Антипаттерны

**Ключевые выводы**
- Большую часть ловят линтеры: typescript-eslint (`no-floating-promises`, `no-misused-promises`, `return-await`, `only-throw-error`), ESLint core (`preserve-caught-error`, `no-async-promise-executor`, `prefer-promise-reject-errors`, `no-await-in-loop`), `eslint-plugin-n` (`no-unsupported-features/*`, `no-sync`), `eslint-plugin-unicorn` (`prefer-node-protocol`), `eslint-plugin-depend`. В Biome — `noFloatingPromises`. Настройка — в [toolchain.md](toolchain.md).
- Ревью остаётся для структурных проблем: побочные эффекты при импорте, синглтоны на уровне модуля, неограниченный fan-out, обработчик `uncaughtException`, который «продолжает работу».

| Антипаттерн | Чем вредит | Исправление | Как ловить |
|---|---|---|---|
| Висящий промис (`doThing();` без `await`/`catch`) | Unhandled rejection роняет процесс (Node 15+) или работа тихо теряется | `await`, вернуть промис или `void` с явным `.catch` | `@typescript-eslint/no-floating-promises`, Biome `noFloatingPromises` |
| `async`-callback в `forEach` / `setTimeout` / синхронном слушателе EventEmitter | Rejections никто не наблюдает, порядок теряется | `for...of` + `await`, `Promise.all(map)`, `captureRejections` | `no-misused-promises` |
| `new Promise(async (res, rej) => ...)` | Исключения внутри теряются | Обычная async-функция | `no-async-promise-executor` |
| Promise-конструктор вокруг промиса («deferred anti-pattern») | Глотает rejections, многословно | Вернуть промис / `Promise.try` | Ревью; `promise/no-nesting` |
| `return promise` внутри `try` | `catch` никогда не сработает; кадр стека потерян | `return await promise` | `@typescript-eslint/return-await` (проверено локально) |
| Неограниченный `Promise.all(hugeArray.map(io))` | Исчерпание сокетов и файловых дескрипторов, пики памяти, троттлинг upstream | `p-limit` / `p-map` с `concurrency` | Ревью, нагрузочные тесты |
| `Promise.race([op, sleep(ms)])` как таймаут | Проигравший продолжает работать, таймеры текут, возможен unhandled rejection | `AbortSignal.timeout`, переданный в операцию | Ревью |
| `fetch` без таймаута / без проверки `res.ok` / с непрочитанным телом | Вечное зависание; 500 считается успехом; сокет не переиспользуется | `signal: AbortSignal.timeout`, `if (!res.ok)`, прочитать или отменить тело | Ревью |
| Бросать строки или простые объекты | Нет стека, `instanceof` не работает | `throw new Error(...)` и подклассы | `only-throw-error` |
| Повторный бросок без `cause` | Теряется первопричина | `new Error(msg, { cause: err })` | ESLint `preserve-caught-error` (9.35+) |
| `catch (e) {}` / «залогировать и продолжить» в обработчике `uncaughtException` | Работа в неопределённом состоянии, порча данных | Упасть и перезапуститься; операционные ошибки обрабатывать на месте | [process](https://nodejs.org/api/process.html) |
| `process.exit()` сразу после логирования | Обрезанные логи и stdout | `process.exitCode = 1`, дать циклу опустеть; сбросить логгер | [process](https://nodejs.org/api/process.html) |
| Нет слушателя `'error'` у emitter или потока | `emit('error')` бросает → падение (проверено локально) | `pipeline()`, `once()`, явный слушатель | Ревью; nodebestpractices 2.13 |
| Цепочки `.pipe()` | Ошибки не распространяются, нет очистки | `stream/promises.pipeline` | Ревью |
| Синхронные fs/crypto/zlib (`readFileSync`, `pbkdf2Sync`) в обработчиках запросов | Блокирует event loop для всех клиентов | Async-версии или worker threads; при старте и в CLI sync допустим | Правило `n/no-sync`, профилирование |
| Рекурсивный `process.nextTick` | Морит I/O голодом | `setImmediate` | Ревью |
| Мутация общих массивов через `sort()` / `reverse()` | Скрытые побочные эффекты на данных вызывающего | `toSorted` / `toReversed` | Правила в стиле `unicorn/no-array-sort` `[не проверено]` |
| `JSON.parse(JSON.stringify(x))` как глубокая копия | Теряет `Date`, `Map`, `undefined`; бросает на BigInt и циклах | `structuredClone` | Ревью |
| Ручной `__dirname` через `fileURLToPath` в каждом файле | Шум | `import.meta.dirname` | Ревью |
| Полифилы и микроутилиты для встроенного (`left-pad`, `object.assign`, `array.prototype.*`, `is-error`) | Размер установки, поверхность supply-chain атак | Нативный API по манифесту e18e | `eslint-plugin-depend` |
| `request`, `node-fetch` v2, `moment` в новом коде | Не поддерживаются / режим поддержки | `fetch`/undici; Temporal, date-fns или luxon | `eslint-plugin-depend` |
| Встроенные модули без префикса (`'fs'`) | Может быть перекрыт пакетом, неоднозначно | `'node:fs'` | `unicorn/prefer-node-protocol` |
| TLA в точке входа библиотеки | Ломает `require(esm)` (`ERR_REQUIRE_ASYNC_MODULE`) | Функция ленивой инициализации | [Modules: CommonJS](https://nodejs.org/api/modules.html) |
| `enum`, parameter properties, декораторы в коде для `node file.ts` | Падает под type stripping | `as const`-объекты, явные поля | `erasableSyntaxOnly` |
| Побочные эффекты на уровне модуля (подключение к БД при импорте) | Медленный старт, нетестируемо, ошибки порядка | Явный `init()` или фабрика в composition root | nodebestpractices 3.13 «Avoid effects outside of functions» |
| Изменяемые синглтоны на уровне модуля | Общее состояние между тестами, баги двух экземпляров | Внедрять экземпляры | Ревью |
| `url.parse()` | Runtime-deprecated в 24; ошибки разбора | `new URL()` / `URL.parse()` / `URL.canParse()` | Предупреждение о deprecation |
| `instanceof Error` через границы realm или пакетов | Ложные отрицания (`vm`, продублированные пакеты) | `Error.isError` (24.3+) / проверка `code` | Ревью |
| `new Buffer(...)`, `SlowBuffer` | Deprecated / небезопасно | `Buffer.from` / `Buffer.alloc` | DEP0005; runtime deprecation `SlowBuffer` в Node 24 |

## Устаревшие и удалённые API

Изменения из release notes Node 22, 24 и 26, которые ломают привычные идиомы. Устаревшие источники (блоги V8 о релизах, 2ality, node.green) — в [Версии Node и источники данных](#версии-node-и-источники-данных).

| API / ресурс | Статус | Замена |
|---|---|---|
| `url.parse()` | Runtime-deprecated в 24 | `new URL()`, `URL.parse()`, `URL.canParse()` |
| `new Buffer()` | Deprecated (DEP0005) | `Buffer.from`, `Buffer.alloc` |
| `SlowBuffer` | Runtime-deprecated в 24 | `Buffer.allocUnsafeSlow` |
| `spawn/execFile` с `args` + `shell: true` | Deprecated в 24 | argv без shell |
| `http.Server.prototype.writeHeader()` | Удалён в 26 | `writeHead` |
| `_stream_*` | Удалены в 26 | `node:stream` |
| `module.register()` | Runtime-deprecated в 26 (DEP0205) | `module.registerHooks()` |
| `--experimental-transform-types` | Удалён в 26 | Только стираемый TS или шаг сборки |
| `assert { type: 'json' }` | Удалён в 22 | `with { type: 'json' }` |
| `make-promises-safe` | `[устарело]` | Поведение по умолчанию с Node 15 |
| ESLint `no-return-await` | Deprecated `[не проверено]`; совет «`return await` избыточен» `[устарело]` | typescript-eslint `return-await` |
| `moment` | Режим поддержки | Temporal (26+), date-fns, luxon |

## Спорные места

- **ESM-only или dual-пакеты.** Anthony Fu (2025) и стабилизация `require(esm)` — аргументы за ESM-only для новых библиотек. Dual-публикация всё ещё нужна потребителям на Node < 20.19 / 22.12, конфигурациям Jest с CJS и части бандлеров. Решать по аудитории; никогда не выпускать dual случайно (hazard).
- **`return await`.** Старый совет «`return await` избыточен» (правило ESLint `no-return-await`, ныне deprecated `[не проверено]`) `[устарело]`. Текущий консенсус (typescript-eslint, nodebestpractices 2.12) — ждать внутри `try` и ради стека. Разногласия остались только о стиле вне `try`.
- **Result-типы (`neverthrow`, Effect) или исключения.** За: типизированная исчерпывающая обработка ошибок. Против: борьба с платформой (бросает каждый API Node и npm), шум обёрток, два канала ошибок. Прагматичная середина: исключения с `cause` и `code`; Result — только внутри доменного ядра, если команда согласна (см. [typescript.md](typescript.md)).
- **Классы или фабрики и замыкания.** Ядро Node и Fastify активно используют классы; Mammino/Casciaro показывают оба подхода. Классы дают `#private`, brand checks и лучшие формы объектов в V8; замыкания — более простой DI и отсутствие багов с привязкой `this`. Оба идиоматичны; главное — единообразие в кодовой базе.
- **`util.parseArgs` или commander/citty.** Встроенного хватает для небольших инструментов; для подкоманд и текста help библиотека по-прежнему лучше.
- **`node:sqlite` или `better-sqlite3`.** `node:sqlite` — release candidate с 25.7 и без зависимостей; `better-sqlite3` полнее и проверен временем. Встроенный — для тестов, CLI и новых небольших приложений.
- **`--env-file` или dotenv.** Встроенный стабилен (24.10 / 22.21), но без подстановки переменных и правил приоритета нескольких файлов, как у `dotenv`/`dotenvx`. Многие команды вообще оставляют загрузку env оркестратору.
- **Temporal сейчас или позже.** Нативно — только с Node 26; на 22/24 нужен полифил (десятки КБ). Серверам на Node 26+ — использовать напрямую; библиотекам с поддержкой Node 22 — принимать `Date | Temporal.Instant` или ISO-строки.
- **Обработчик `uncaughtException`, который продолжает работу** (некоторые фреймворки и настройки PM2). Документация Node называет это небезопасным. Единственный защитимый вариант — «залогировать, перестать принимать трафик, дождаться завершения с таймаутом, выйти».
- **`Promise.all` или `allSettled` по умолчанию.** Fail-fast верен, когда нужны все результаты, но оставляет соседей работать. Некоторые команды стандартизируют `allSettled` + `AggregateError`. Выбор документировать в месте вызова.
- **Iterator helpers или массивы.** Helpers избегают промежуточных массивов и позволяют ранний выход; на малых массивах методы массивов проще и на практике не медленнее `[не проверено]`. Перед переделкой горячих циклов — измерить ([performance.md](performance.md), скрипт `../scripts/bench_compare.mjs`).
- **2ality и Exploring JS** (Axel Rauschmayer) были основными объяснениями фич ES; в 2026 году офлайн. Вместо них — MDN, страницы фич V8 и README предложений TC39.

## Чеклист code review: идиоматичный Node

Используется на шаге ревью в [pipeline.md](pipeline.md).

**Язык и рантайм**
1. `engines.node` задан и соответствует используемым фичам ([таблица версий](#возможности-языка-по-версиям-node)); включены правила `eslint-plugin-n` `no-unsupported-features/*`.
2. ESM (`"type": "module"`), префикс `node:` у встроенных модулей, явные расширения в относительных импортах, нет TLA в точках входа библиотек.
3. Нет полифилов и микрозависимостей для того, что дают Node и ES (сверено с e18e `module-replacements`); без причины не добавлены `request`, `node-fetch`, `moment`, `rimraf`, `mkdirp`, `uuid` (v4), `chalk`, `dotenv`, `glob`.
4. Для общих входных данных — неизменяющие методы массивов; у числовой сортировки есть компаратор.
5. `structuredClone` — только для простых данных; нет клонирования через `JSON.parse(JSON.stringify())`.
6. TS, который запускает сам Node: `erasableSyntaxOnly`, `verbatimModuleSyntax`, нет `enum`, parameter properties и декораторов.

**Ошибки**
7. Бросаются и отклоняются только экземпляры `Error`; свои ошибки задают `name` и стабильный `code`.
8. Повторные броски несут `{ cause }` (ESLint `preserve-caught-error`).
9. Операционные ошибки обработаны там, где это возможно (повтор, перевод, 404 → `null`); ошибки программиста не ловятся и не «обрабатываются».
10. Один обработчик уровня процесса для `uncaughtException`/`unhandledRejection`: логирует, выставляет код выхода, делает graceful shutdown с таймаутом — и никогда не продолжает работу.
11. Нет `process.exit()` при недописанном выводе; используется `process.exitCode`.
12. У каждого EventEmitter и потока есть путь для `'error'` (слушатель, `pipeline`, `once`).
13. Внутри `try` — `return await`; нет `return promise`, который должен ловиться локально.

**Асинхронность**
14. Нет висящих промисов и async-callbacks в синхронных слотах (включены `no-floating-promises`, `no-misused-promises`).
15. Каждая публичная async-функция принимает `{ signal }` и передаёт его дальше; у каждого сетевого и IPC-вызова есть таймаут (`AbortSignal.timeout` / `any`).
16. Fan-out ограничен (p-limit, p-map, очередь); комбинатор выбран по семантике отказа (`all` / `allSettled` / `any`).
17. Нет промисов, созданных рано и ожидаемых поздно без обработчика.
18. `fetch` проверяет `res.ok` и читает или отменяет тело.
19. На путях запросов нет синхронного I/O и тяжёлой CPU-работы (или она вынесена в workers).
20. Ресурсы освобождаются на всех путях: `using` / `await using` (Node 24+) или `try/finally`; слушатели снимаются через `signal`.

**Дизайн**
21. Нет побочных эффектов при импорте; связывание — в composition root; зависимости внедряются, а не импортируются синглтонами, когда их нужно подменять в тестах.
22. Паттерны в лёгкой форме Node (функция, замыкание, объект функций), если класс не даёт явной пользы.
23. Для больших или неограниченных данных — потоки и async-генераторы, а не буферизация всего в память.
24. Логирование структурное (pino), ошибки логируются один раз как `{ err }`, секреты вырезаются; библиотеки по умолчанию не логируют.
25. Нет устаревших API: `url.parse`, `new Buffer`, `SlowBuffer`, `module.register()` (26), `writeHeader` (26), `_stream_*`.

## Симптомы и приёмы

| Замечание ревью / симптом | Приём | Источник |
|---|---|---|
| «Процесс упал с unhandled rejection» | Найти висящий промис; `no-floating-promises`; `await` или `allSettled` | [process](https://nodejs.org/api/process.html); [Jake Archibald, 2023](https://jakearchibald.com/2023/unhandled-rejections/) |
| «Стек обрывается на `processTicksAndRejections`, вызывающего не видно» | `return await` в async-функциях | [return-await](https://typescript-eslint.io/rules/return-await/); проверено локально |
| «Запрос висит вечно, когда upstream лежит» | `AbortSignal.timeout` + `AbortSignal.any` на каждом вызове | [AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static); [Globals](https://nodejs.org/api/globals.html) |
| «Временные файлы и дескрипторы текут на путях ошибок» | `await using` + `mkdtempDisposable` / dispose у FileHandle | [fs](https://nodejs.org/api/fs.html); [V8: ERM](https://v8.dev/features/explicit-resource-management) |
| «В логах потерялась первопричина» | `{ cause }` + сериализатор `err` в pino | [Error: cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause); [preserve-caught-error](https://eslint.org/docs/latest/rules/preserve-caught-error) |
| «`instanceof MyError` в тестах даёт `false`» | Дубликат пакета или другой realm → проверять `code` или `Error.isError` | [Error.isError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/isError); [Packages](https://nodejs.org/api/packages.html) (dual hazard) |
| «CJS-приложение не может загрузить нашу ESM-библиотеку» | Убрать TLA; `engines >= 22.12`; экспорт `'module.exports'` | [Modules: CommonJS](https://nodejs.org/api/modules.html) |
| «`node app.ts` падает с `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`» | Заменить `enum` и parameter properties; `erasableSyntaxOnly` | [Modules: TypeScript](https://nodejs.org/api/typescript.html) |
| «Слишком много зависимостей ради тривиального» | Замены e18e, `eslint-plugin-depend` | [module-replacements](https://github.com/es-tooling/module-replacements) |
| «Исчерпание сокетов / EMFILE под нагрузкой» | Ограничить конкурентность (p-limit), читать тела ответов `fetch` | [p-limit](https://github.com/sindresorhus/p-limit); [undici](https://undici.nodejs.org/) |
| «Ошибки в арифметике дат около DST и часовых поясов» | Temporal (26+) или полифил | [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) |
| «Большие ID испорчены после `JSON.parse`» | Reviver с `context.source` → `BigInt` | [JSON.rawJSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/rawJSON); проверено локально |
