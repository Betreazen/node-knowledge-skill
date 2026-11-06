# Тестирование на Node.js

Как тестировать JavaScript и TypeScript, которые работают на Node.js, в любой предметной области: встроенный раннер `node:test` подробно (возможности по версиям, моки функций, таймеров и модулей, снапшоты, покрытие и пороги, изоляция, шардирование, конфиг-файл), Vitest 5, Jest 30 и другие раннеры, стратегия моков и фейки, HTTP-моки (MSW, nock, undici `MockAgent`), тесты HTTP-серверов, базы данных и Testcontainers, property-based тесты (fast-check), мутационное тестирование (StrykerJS), инструменты покрытия, E2E (Playwright), асинхронный код, таймеры и потоки, нестабильные тесты, контрактные тесты, правила для ИИ-агента, который пишет тесты первым, рекомендуемая конфигурация и чеклист ревью. Актуально на ноябрь 2026: Node 26 — Active LTS с 28 октября 2026 (v26.13.0), Node 24 — Maintenance LTS, Node 20 — EOL (апрель 2026); Vitest 5.1.0 (2 ноября 2026), Jest 30.5.2, MSW 3.0.4, nock 15.0.6, undici 8.12.4, fast-check 4.10.2, StrykerJS 10.1.1, c8 12.0.0, Playwright 1.65.0, Testcontainers 12.2.1. Версии пакетов взяты из npm на 6 ноября 2026. Поведение, помеченное «проверено локально», проверено на Node 24.17 (Windows 11, npm 11.13.0), Vitest 5.0.5 и 5.1.0. Бенчмарки — в [performance.md](performance.md), тесты типов подробно — в [typescript.md](typescript.md), CI-шаблоны и настройка линтера — в [toolchain.md](toolchain.md), особенности серверных фреймворков — в [domains-server.md](domains-server.md), общий цикл разработки с ревью — в [pipeline.md](pipeline.md).

- [1. Версии на ноябрь 2026](#1-версии-на-ноябрь-2026)
- [2. node:test, ядро и возможности по версиям](#2-nodetest-ядро-и-возможности-по-версиям)
- [3. node:test, моки функций, таймеров и модулей](#3-nodetest-моки-функций-таймеров-и-модулей)
- [4. node:test, снапшоты](#4-nodetest-снапшоты)
- [5. node:test, покрытие и пороги](#5-nodetest-покрытие-и-пороги)
- [6. node:test, запуск, изоляция, шардирование, конфиг](#6-nodetest-запуск-изоляция-шардирование-конфиг)
- [7. Vitest 5](#7-vitest-5)
- [8. Jest 30](#8-jest-30)
- [9. Другие раннеры и выбор раннера](#9-другие-раннеры-и-выбор-раннера)
- [10. Стратегия моков, двойники и фейки](#10-стратегия-моков-двойники-и-фейки)
- [11. HTTP-моки, MSW, nock, MockAgent](#11-http-моки-msw-nock-mockagent)
- [12. Тесты HTTP-серверов](#12-тесты-http-серверов)
- [13. Базы данных и инфраструктура](#13-базы-данных-и-инфраструктура)
- [14. Property-based тесты, fast-check](#14-property-based-тесты-fast-check)
- [15. Мутационное тестирование, StrykerJS](#15-мутационное-тестирование-strykerjs)
- [16. Инструменты покрытия, V8 и Istanbul](#16-инструменты-покрытия-v8-и-istanbul)
- [17. E2E и браузер, Playwright](#17-e2e-и-браузер-playwright)
- [18. Асинхронный код, таймеры, события, потоки](#18-асинхронный-код-таймеры-события-потоки)
- [19. Нестабильные тесты](#19-нестабильные-тесты)
- [20. Структура, имена, данные](#20-структура-имена-данные)
- [21. Контрактные тесты и схемы API](#21-контрактные-тесты-и-схемы-api)
- [22. Тесты типов](#22-тесты-типов)
- [23. Правила для ИИ-агента, сначала тест](#23-правила-для-ии-агента-сначала-тест)
- [24. Рекомендуемая конфигурация](#24-рекомендуемая-конфигурация)
- [25. Спорные места](#25-спорные-места)
- [26. Антипаттерны](#26-антипаттерны)
- [27. Чеклист ревью тестов](#27-чеклист-ревью-тестов)

## 1. Версии на ноябрь 2026

**Ключевые выводы**
- Тестовые возможности Node зависят от линии. Перед советом проверьте `node --version` и `engines` в `package.json`.
- Node 20 в апреле 2026 ушёл в EOL; Vitest 5, MSW 3, StrykerJS 10 и Playwright 1.65 его больше не поддерживают. Ориентир для новых проектов — Node 24.12+ или 26.

| Линия Node | Последняя | Дата | Статус | Что важно для тестов |
|---|---|---|---|---|
| 27.x | v27.0.0-alpha | 2026-10-29 | alpha-сборки (изменилось расписание релизов, см. [toolchain.md](toolchain.md)) | — |
| 26.x «Lithium» | v26.13.0 | 2026-10-28 | Active LTS с 26.13.0 | 26.6.0 добавил `t.log()` и событие `test:log` [не проверено] |
| 24.x «Krypton» | v24.22.2 | 2026-10-27 | Maintenance LTS | `--test-global-setup` (24.0), JSON в `mock.module` (24.0), `--test-rerun-failures` (24.7), `expectFailure` (24.14), `--test-randomize` (24.16), теги `--experimental-test-tag-filter` (24.19) |
| 22.x «Jod» | v22.23.4 | 2026-10-20 | Maintenance LTS | снапшоты (22.3), `mock.module` (22.3), пороги покрытия (22.8) |
| 20.x «Iron» | v20.20.2 | 2026-03-24 | EOL (апрель 2026) | Vitest 5, MSW 3, Stryker 10 его не поддерживают |
| 18.x | v18.20.8 | 2025-03-27 | EOL | — |

| Пакет | Версия | Последний релиз | Мажоры | Заметки |
|---|---|---|---|---|
| vitest (+ `@vitest/coverage-v8`, `-istanbul`, `@vitest/browser`, `@vitest/ui`) | 5.1.0 | 2026-11-02 | 3.0 2025-01-16 · 4.0 2025-10-22 · 4.1 2026-03-12 · **5.0 2026-09-03** | engines `^22.12 \|\| ^24 \|\| >=26`, Vite ≥6.4 |
| jest / babel-jest / expect / @jest/globals | 30.5.2 | 2026-09-18 | 29.7 2023-09-12 · **30.0 2025-06-10** | Jest 31 не анонсирован |
| ts-jest | 29.4.15 | 2026-10-15 | | линия 29.x, поддерживает Jest 30 [не проверено] |
| @swc/jest | 0.2.39 | 2025-07-09 | | редкие релизы, но жив |
| mocha / chai | 12.0.3 / 6.3.0 | 2026-10-01 / 2026-09-30 | mocha 12.0 2026-08-31; chai 5.0 (только ESM) 2023-12, 6.0 2025-08-22 | |
| ava | 8.3.0 | 2026-10-31 | 7.0 2026-02-27 · 8.0 2026-04-27 | engines `^22.20 \|\| ^24.12 \|\| >=26` |
| tap (node-tap) | 21.8.0 | 2026-09-03 | 21.0 2024-07-08 | |
| uvu | 0.5.6 | 2022-07-03 | | [устарело] → `node:test` |
| borp | 1.0.0 | 2026-02-08 | | обёртка Matteo Collina над `node:test` (TS + c8 + параллельность) |
| sinon / @sinonjs/fake-timers | 22.1.0 / 15.4.0 | 2026-07-20 / 2026-05-05 | sinon 22.0 2026-05-05 | fake-timers — движок фейковых таймеров Jest и Vitest |
| testdouble | 4.0.0 | 2026-10-12 | | новый мажор после долгой паузы |
| jest-mock-extended / vitest-mock-extended | 4.0.2 / 5.1.1 | 2026-10 / 2026-08 | | типизированные глубокие моки |
| jest-when | 4.0.3 | 2026-04-26 | | в Vitest 5 есть встроенный `vi.when` |
| msw | 3.0.4 | 2026-11-06 | 2.0 2023-10-23 · **3.0 2026-09-28** | только ESM, Node 22/24/26, перехват на уровне сокетов |
| nock | 15.0.6 | 2026-11-05 | 14.0 2025-01-24 | `15.0.0` опубликован по ошибке; настоящая линия — 15.0.1+, engines `>=22.20` |
| undici | 8.12.4 | 2026-11-05 | 7.0 2024-11-27 · 8.0 2026-04-02 | Node 24.17 содержит встроенный undici 7.28.0 |
| supertest / light-my-request | 7.3.1 / 6.8.0 | 2026-10-02 / 2026-10-10 | supertest 7.0 2024-04-24 | light-my-request — движок `fastify.inject` |
| testcontainers / @testcontainers/postgresql | 12.2.1 | 2026-10-13 | 11.0 2025-05-27 · 12.0 2026-05-19 | |
| @electric-sql/pglite / pg-mem | 0.5.10 / 3.0.14 | 2026-10-14 / 2026-02-26 | | Postgres в процессе (WASM) / эмулятор с частичным SQL |
| mongodb-memory-server / ioredis-mock | 11.3.0 / 8.13.1 | 2026-10-20 / 2025-10-29 | mongodb-memory-server 11.0 2025-12-15 | ioredis-mock — около года без релиза |
| memfs / mock-fs | 4.80.0 / 5.5.0 | 2026-09 / 2025-02-06 | | лучше memfs или настоящий временный каталог |
| fast-check / @fast-check/vitest | 4.10.2 / 0.5.0 | 2026-09-19 / 2026-09-11 | fast-check 4.0 2025-03-10 | |
| @stryker-mutator/core (+ раннеры) | 10.1.1 | 2026-10-23 | 8.0 2023-11-30 · 9.0 2025-05-13 · **10.0 2026-08-14** | engines `>=22.0.0`; tap-runner работает с `node:test` |
| c8 / nyc | 12.0.0 / 18.0.0 | 2026-07-14 / 2026-02-22 | c8 11.0 2026-02-22, 12.0 2026-07-14; nyc 18.0 2026-02-22 | |
| monocart-coverage-reports | 3.0.0 | 2026-10-18 | | слияние V8 и Istanbul |
| v8-to-istanbul / istanbul-lib-coverage | 9.3.0 / 3.2.2 | 2024-06 / 2023-11 | | стабильные низкоуровневые библиотеки |
| @playwright/test | 1.65.0 | 2026-11-05 | 1.60 2026-05-11 · 1.64 2026-10-07 | |
| cypress | 16.2.1 | 2026-10-28 | | engines `^22 \|\| ^24 \|\| >=26` |
| @pact-foundation/pact | 17.1.4 | 2026-09-07 | 16.0 2025-10-07 · 17.0 2026-06-25 | |
| @faker-js/faker / fishery | 10.6.0 / 2.4.0 | 2026-09 / 2025-12 | | |
| jsdom / happy-dom | 31.0.0 / 21.0.4 | 2026-11-05 / 2026-10-20 | | jsdom 31 engines `^22.22.2 \|\| ^24.15 \|\| >=26` |
| esmock | 3.0.0 | 2026-10-26 | | мок ESM-импортов через loader |
| mockdate / timekeeper / proxyquire | 3.0.5 / 2.3.1 / 2.1.3 | 2022 / 2023 / 2023 | | [устарело] → фейковые таймеры раннера, DI, `mock.module` |
| eslint-plugin-jest / @vitest/eslint-plugin / eslint-plugin-playwright | 29.17.0 / 1.6.28 / 2.12.2 | 2026-10 / 2026-10 / 2026-11 | | правила для тестов |
| expect-type / tsd | 1.4.0 / 0.33.0 | 2026-06 / 2025-08 | | тесты типов, см. [typescript.md](typescript.md) |
| jest-extended | 7.0.0 | 2025-11-05 | | |
| typescript | 7.0.2 | 2026-07-08 | | TS 7 (порт на Go), см. [typescript.md](typescript.md) |

## 2. node:test, ядро и возможности по версиям

**Ключевые выводы**
- Раннер имеет статус Stability 2 (Stable) с v20.0.0; отдельные возможности несут свой статус (список ниже). На Node 24 и 26 это разумный выбор по умолчанию для библиотек, CLI и сервисов, которым не нужны бандлер, тесты с тяжёлым JSDOM и Jest-совместимый API. Зависимостей нет, синхронизировать с рантаймом нечего.
- Поиск файлов: `node --test` без путей берёт `**/*.test.{cjs,mjs,js}`, `**/*-test.*`, `**/*_test.*`, `**/test-*.*`, `**/test.*`, `**/test/**/*.{cjs,mjs,js}`. Без `--no-strip-types` те же шаблоны работают и для `{cts,mts,ts}`. Проверено локально на Node 24.17: `test/math.test.ts`, импортирующий `../src/math.ts`, запустился без флагов.
- Type stripping только стирает типы. Не работают `enum`, `namespace` со значениями, parameter properties и path aliases; включите `erasableSyntaxOnly` в tsconfig (см. [typescript.md](typescript.md)). Передавайте явные глобы в кавычках: `node --test "test/**/*.test.ts"`.
- API: `test()`/`it()`, `describe()`/`suite()`, хуки `before/after/beforeEach/afterEach` (на уровне модуля или `t.before`/`t.after`), `test.skip/todo/only`, опции `{ timeout, concurrency, skip, todo, only, plan, signal, expectFailure }`.
- `TestContext` даёт: `t.assert.*` (все методы `node:assert` плюс `snapshot` и `fileSnapshot`), `t.mock`, `t.plan(n, { wait })`, `t.waitFor(fn, { interval, timeout })`, `t.signal` (AbortSignal, срабатывает при таймауте и отмене — передавайте его в fetch и таймеры), `t.diagnostic()`, `t.name`/`t.fullName`/`t.filePath`, `t.skip()`/`t.todo()`, `t.runOnly()`. В 26.6 добавлены `t.log()` и событие `test:log` [не проверено].
- Берите `t.mock`, а не глобальный `mock`: моки `t.mock` откатываются сами в конце теста (проверено локально: `t.mock.method(Math, 'random', …)` в следующем тесте уже не действовал). `t.plan` считает только вызовы `t.assert.*` и подтесты.
- **Подвох: `t.assert` — это старый нестрогий `node:assert`.** Проверено локально: `t.assert.equal(1, '1')` и `t.assert.deepEqual({a:1}, {a:'1'})` проходят; падают только `t.assert.strictEqual`/`deepStrictEqual`. Либо пишите `t.assert.strict*`, либо `import assert from 'node:assert/strict'` (тогда `t.plan` эти вызовы не считает). На ревью отмечайте каждый `t.assert.equal(` и `t.assert.deepEqual(`.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';          // строгие equal/deepEqual
import { total } from '../src/cart.ts';

test('total sums line prices', (t) => {
  t.assert.strictEqual(total([{ price: 2 }, { price: 3 }]), 5);   // строгий метод на t.assert
  assert.deepEqual(total([]), 0);                                   // строгий из node:assert/strict
});
```

- Карта возможностей (в какой версии добавлено, статус):
  - `mock.timers` (MockTimers): добавлено в v20.4.0/v18.19.0, стабильно с v23.1.0. `apis` по умолчанию `['setInterval','setTimeout','setImmediate','Date']`, `now` задаёт эпоху.
  - Снапшоты: добавлены в v22.3.0, не экспериментальные с v23.4.0 (в ранних 22.x нужен `--experimental-test-snapshots`).
  - `mock.module()`: добавлено в v22.3.0/v20.18.0, Stability 1.0 (Early development), нужен `--experimental-test-module-mocks`. JSON-модули — с 24.0. `options.exports` заменяет устаревшие `defaultExport`/`namedExports`.
  - Покрытие `--experimental-test-coverage`: Stability 1 (Experimental); пороги `--test-coverage-lines/branches/functions` (добавлены в 22.8 [не проверено]); глобы include/exclude.
  - `--test-global-setup=<file>` (модуль экспортирует `globalSetup`/`globalTeardown`): v24.0.0, Stability 1.0. Если setup бросил исключение, тесты не запускаются и teardown не вызывается.
  - Опция `expectFailure`: v24.14.0. Тест проходит, только если бросил исключение. Принимает строку-причину, RegExp, класс, объект или `{ label, match }`. Проверено локально: вывод `✔ … # EXPECTED FAILURE`.
  - `--test-rerun-failures=<state.json>`: v24.7.0.
  - `--test-randomize` / `--test-random-seed=N`: v24.16.0, Stability 1.0. Печатает `Randomized test order seed: N`; несовместим с watch; последовательно ожидаемые подтесты сохраняют порядок объявления.
  - Теги `--experimental-test-tag-filter`: v24.19.0, Stability 1.0, без учёта регистра, фильтры объединяются через И. На 24.17 этого флага нет.
  - Свои ассерты `assert.register(name, fn)`: v23.7.0/v22.14.0. `t.waitFor`: v23.7.0/v22.14.0 [не проверено]. `t.plan`: v22.2.0/v20.15.0 [не проверено].
  - Репортёр по умолчанию — `spec`, с v23.0.0 и без TTY. Встроенные: `spec`, `tap`, `dot`, `junit`, `lcov`.
- Семантика падений (проверено локально). Тест с не-awaited `assert.rejects(...)` сам печатается как `✔`, но раннер замечает асинхронную активность после конца теста и **роняет файл** (код выхода 1). Читайте строку `ℹ Error: Test "…" generated asynchronous activity after the test ended`: в ней имя виновника. Отсутствующий файл снапшота — всегда падение, он не создаётся молча.
- Когда `node:test` не подходит: тяжёлые моки ESM-модулей (всё ещё Early development и флаг), компонентные тесты с браузером и DOM, большие наборы на Jest, нужен развитый watch-интерфейс и интеграция с IDE (у Vitest расширение лучше), код требует трансформации бандлером (JSX, path aliases, `.vue`).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Test runner (node:test)](https://nodejs.org/api/test.html) | Node.js project, 2026 | Каноничный справочник API, последняя линия |
| [Test runner, v24.x docs](https://nodejs.org/docs/latest-v24.x/api/test.html) | Node.js project, 2026 | Справочник LTS 24 с историей «Added in» по каждой возможности |
| [Command-line API, v24.x](https://nodejs.org/docs/latest-v24.x/api/cli.html) | Node.js project, 2026 | Флаги `--test*`, `--experimental-test-*`, конфиг-файл |
| [Test runner, v22.x docs](https://nodejs.org/docs/latest-v22.x/api/test.html) | Node.js project, 2026 | Что на LTS 22 ещё требует флагов |
| [Test runner: introduction](https://nodejs.org/en/learn/test-runner/introduction) | Node.js project | Официальный учебный трек: как устроить набор |
| [Using Node.js's test runner](https://nodejs.org/en/learn/test-runner/using-test-runner) | Node.js project | Setup/teardown, глобальные хуки, TS, репортёры |
| [Mocking in tests](https://nodejs.org/en/learn/test-runner/mocking) | Node.js project | Что и как мокать в `node:test` |
| [Collecting code coverage](https://nodejs.org/en/learn/test-runner/collecting-code-coverage) | Node.js project | Пошагово про покрытие |
| [Assert](https://nodejs.org/api/assert.html) | Node.js project | `assert/strict`, `deepStrictEqual`, `partialDeepStrictEqual` |
| [Modules: TypeScript](https://nodejs.org/api/typescript.html) | Node.js project | Правила type stripping: какой синтаксис падает |

## 3. node:test, моки функций, таймеров и модулей

**Ключевые выводы**
- `t.mock.fn(impl?)` — шпион: `fn.mock.calls[i].arguments/result/error/this`, `fn.mock.callCount()`, `fn.mock.mockImplementation()`, `mockImplementationOnce(impl, onCall)`, `resetCalls()`, `restore()`. Ещё есть `t.mock.method(obj, 'name', impl?, { getter, setter })`, `t.mock.getter/setter`, `t.mock.property(obj, 'key', value)`.
- Таймеры (проверено локально): `t.mock.timers.enable({ apis, now })`, затем `tick(ms)`, `runAll()`, `setTime(ms)`, `reset()`. Перечисляйте только нужные API: фейковый `setImmediate` может остановить библиотеки, которые используют его внутри (драйверы БД, потоки).

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('debounce fires once with the last argument', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fn = t.mock.fn();
  const d = debounce(fn, 100);
  d(1); d(2);
  t.mock.timers.tick(99);  assert.equal(fn.mock.callCount(), 0);
  t.mock.timers.tick(1);   assert.deepEqual(fn.mock.calls[0].arguments, [2]);
});

test('stamp uses the mocked Date', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-02T03:04:05Z') });
  assert.equal(stamp(), '2026-01-02T03:04:05.000Z');
});
```

- Модули (проверено локально): `t.mock.module('node:fs', { exports: { readFileSync: () => 'bob' } })`, затем **динамический** `await import('../src/greet.js')`. Статические импорты выполнились раньше, чем появился мок. Без `--experimental-test-module-mocks` будет `TypeError: t.mock.module is not a function`; с флагом печатается `ExperimentalWarning`. `cache: true` — последующие импорты переиспользуют мок; `restore()` вызывается на возвращённом контексте. Под permission model нужен `--allow-worker`.

```js
// node --test --experimental-test-module-mocks test/greet.test.js
test('greet reads the name from disk', async (t) => {
  t.mock.module('node:fs', { exports: { readFileSync: () => 'bob' } });
  const { greet } = await import('../src/greet.js');   // только динамический импорт
  assert.equal(greet(), 'hello, bob');
});
```

- Дизайн: внедрение зависимостей (передать `fetch`, часы, репозиторий в фабрику) лучше мока модуля. Оно работает в любом раннере, не требует флагов и не мешает параллельности. `mock.module` оставьте для сторонних модулей, которые нельзя внедрить: в ESM экспорты не перезаписать, объект пространства имён заморожен.
- Моки ESM в других инструментах: Vitest `vi.mock` (поднимается наверх трансформацией; в v5 бросает исключение, если вложен в блок), Jest `jest.unstable_mockModule` (нужен `--experimental-vm-modules`), `esmock`/`quibble` (через loader hooks) [не проверено для esmock/quibble].

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Test runner: Mocking](https://nodejs.org/api/test.html#mocking) | Node.js project | API `MockTracker`, `MockFunctionContext` |
| [Class: MockTimers](https://nodejs.org/api/test.html#class-mocktimers) | Node.js project | Семантика моков таймеров и `Date` |
| [mock.module(specifier, options)](https://nodejs.org/api/test.html#mockmodulespecifier-options) | Node.js project | Опции мока модулей, `cache`, `exports` |
| [esmock](https://github.com/iambumblehead/esmock) | iambumblehead | Мок ESM-импортов через loader в любом раннере |

## 4. node:test, снапшоты

**Ключевые выводы**
- `t.assert.snapshot(value, { serializers })` пишет записи ``exports[`<имя теста> <n>`] = `…`;`` в файл `<testfile>.snapshot` рядом с тестом (проверено локально). `t.assert.fileSnapshot(value, path)` — одно значение на файл (v23.7/22.14 [не проверено]). Создание и обновление: `node --test --test-update-snapshots`.
- Глобальная настройка из файла, подключённого через `--import`: `snapshot.setResolveSnapshotPath((testFile) => …)` (например, каталог `__snapshots__/`) и `snapshot.setDefaultSnapshotSerializers([...])`.
- Нет снапшота — падение (`ERR_INVALID_STATE … rerun with --test-update-snapshots`). Для CI это правильно. Jest локально дописывает недостающие снапшоты, если не передан `--ci` (проверено локально).
- Ключ — имя теста плюс счётчик, поэтому переименование теста оставляет снапшот-сироту. Встроенного отчёта об устаревших снапшотах нет (в Jest и Vitest есть).

```js
test('renders invoice summary', (t) => {
  t.assert.snapshot(renderSummary(fixtureInvoice()));   // первый раз: --test-update-snapshots
});
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Snapshot testing](https://nodejs.org/api/test.html#snapshot-testing) | Node.js project | API снапшотов, флаг обновления, сериализаторы |
| [Snapshot Testing](https://jestjs.io/docs/snapshot-testing) | Jest team | Практики снапшотов, не зависят от раннера |
| [Effective Snapshot Testing](https://kentcdodds.com/blog/effective-snapshot-testing) | Kent C. Dodds, 2017 | Когда снапшоты помогают, а когда штампуются |

## 5. node:test, покрытие и пороги

**Ключевые выводы**
- `node --test --experimental-test-coverage` использует точное покрытие V8, без инструментирования. Пороги: `--test-coverage-lines=90 --test-coverage-branches=80 --test-coverage-functions=80`. Если порог не достигнут, код выхода 1 и сообщение `ℹ Error: 50.00% function coverage does not meet threshold of 80%.` (проверено локально).
- Область: `--test-coverage-include='src/**'` / `--test-coverage-exclude='**/*.test.*'`. `node_modules` и модули ядра исключены по умолчанию.
- Вывод для CI: `--test-reporter=spec --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=lcov.info`. Репортёры и назначения сопоставляются по порядку. Проверено локально: в `lcov.info` есть записи `FN/FNDA/BRDA/DA`.
- Комментарии-исключения: `/* node:coverage disable */ … /* node:coverage enable */`, `/* node:coverage ignore next N */`.
- **Подвох: строковое покрытие V8 оптимистично.** Проверено локально: ни разу не вызванная однострочная функция `export function untested(a){ return a>0 ? a*2 : -a; }` дала **100 % строк**, но 50 % функций и 80 % ветвей. Порог ставьте на **ветви и функции**, а не только на строки.
- Возможность всё ещё Experimental. Для HTML-отчётов, слияния шардов и порогов по файлам оборачивайте в c8 (`c8 --check-coverage --branches 90 node --test`) или берите покрытие Vitest/Jest (раздел 16).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Collecting code coverage](https://nodejs.org/api/test.html#collecting-code-coverage) | Node.js project | Флаги, комментарии-исключения, ограничения |
| [c8](https://github.com/bcoe/c8) | Benjamin Coe | CLI покрытия V8, пороги, репортёры |
| [JavaScript code coverage](https://v8.dev/blog/javascript-code-coverage) | Jakob Gruber (V8), 2017 | Как устроено блочное и точное покрытие V8 |

## 6. node:test, запуск, изоляция, шардирование, конфиг

**Ключевые выводы**
- `--test-isolation=process|none` (раньше `--experimental-test-isolation`, добавлен в 22.8 [не проверено]; по умолчанию `process`): каждый тестовый файл в своём дочернем процессе или все файлы в процессе раннера. Проверено локально на 20 простых файлах: `none` примерно в **3,8 раза быстрее** по общему времени (296 мс против 1114 мс, среднее из трёх прогонов). Файл, записавший `globalThis.leak`, ронял тест в другом файле **только при `none`**. `none` — для быстрых unit-наборов без глобального состояния; `process` — для интеграционных тестов, моков модулей и всего, что трогает глобальные объекты и окружение.
- `--test-concurrency=N` ограничивает число параллельных дочерних процессов (по умолчанию `os.availableParallelism() - 1` [не проверено]). Внутри файла тесты идут последовательно, если у `describe`/`test` нет `{ concurrency: true|N }`.
- `--test-shard=1/3` делит файлы между заданиями CI (проверено локально: 8 из 22 тестов в шарде 1/3); несовместим с watch.
- `--test-name-pattern` / `--test-skip-pattern` — регулярные выражения, флаги можно повторять, допустимы литералы `/…/i`. `--test-only` учитывает `only` (нужен, когда изоляция `process`).
- `--test-timeout=ms` по умолчанию Infinity — **задавайте его**, например 10–30 с в CI. `--test-force-exit` нужен для библиотек, которые оставляют открытые handles; считайте это запахом и ищите handle через `why-is-node-running` или `--detect-async-leaks` в Vitest.
- `--test-rerun-failures=.rerun.json` (проверено локально): первый прогон сохраняет состояние каждого теста; при повторе прошедшие тесты отмечаются, но не выполняются. Подвох: при `--test-isolation=none` падение, зависящее от порядка, при повторе «прошло», потому что загрязняющий тест был пропущен. Состояние повтора может скрыть связанность тестов.
- Watch: `node --test --watch` (Stability 1, Experimental) перезапускает затронутые файлы; есть `--watch-path`, `--watch-preserve-output`.
- **Конфиг-файл** `node --experimental-config-file=node.config.json` (добавлен в 23.10 / 22.16; с 26.12.0 стабилен как `--config-file`, старое имя оставлено алиасом). **Имя пространства тест-раннера зависит от версии** (проверено локально на бинарниках 24.17.0, 24.18.1, 24.19.0 и 26.13.0 и по `node-config-schema.json` каждого релиза): до 24.18.x и в 25.0–25.3 — `testRunner`, а `{ "test": {...} }` **молча игнорируется**; с **24.19.0 / 25.4.0** и во всём 26.x — `test`, а `testRunner` роняет запуск: `the "testRunner" namespace has been removed. Use "test" instead.` … `node.config.json: invalid content` (код 9). В `nodeOptions` `test-isolation` принимается на всех этих версиях. На 26.13 пространство `test` ещё и само включает `--test` (`node --config-file=node.config.json` без `--test` запустил тесты; на 24.19 — нет); отключение — `"test": false` внутри пространства. Значения из файла не перекрывают CLI и `NODE_OPTIONS`. Закрепляйте мажор и патч Node, если опираетесь на конфиг-файл, и проверяйте, что настройка действительно применилась.

- Репортёры: свой репортёр — async generator или Transform-поток над событиями `test:pass`, `test:fail`, `test:diagnostic`, `test:coverage`. Программный запуск: `run({ files, isolation, concurrency, shard, coverage, lineCoverage, branchCoverage, functionCoverage })` из `node:test`.
- **borp** (Matteo Collina): тонкий CLI над `node:test` с компиляцией TS, покрытием c8, `--reporter`, таймаутом и `.borp.yaml`; используется в экосистеме Platformatic и Fastify [не проверено].

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Test runner execution model](https://nodejs.org/api/test.html#test-runner-execution-model) | Node.js project | Изоляция process и none, параллельность |
| [Test reporters](https://nodejs.org/api/test.html#test-reporters) | Node.js project | Встроенные и свои репортёры |
| [run([options])](https://nodejs.org/api/test.html#runoptions) | Node.js project | Опции программного запуска |
| [--experimental-config-file](https://nodejs.org/api/cli.html#--experimental-config-fileconfig) | Node.js project | Формат `node.config.json` |
| [borp](https://github.com/mcollina/borp) | Matteo Collina | Обёртка `node:test` + TS + покрытие |
| [node/test/parallel](https://github.com/nodejs/node/tree/main/test/parallel) | Node.js project | Тысячи реальных тестов ядра как образец стиля |

## 7. Vitest 5

**Ключевые выводы**
- Текущая линия — 5.x (5.0 — 3 сентября 2026, 5.1.0 — 2 ноября 2026). Engines `^22.12 || ^24 || >=26`, peer-зависимость Vite ≥6.4 (в Yarn добавьте `vite` явно). 4.x (22 октября 2025) — предыдущий мажор, 3.x отстаёт на два мажора.
- **Ломающие изменения Vitest 5, о которые спотыкаются** (проверено локально на 5.0.5, где отмечено):
  - `clearMocks: true` по умолчанию: история вызовов очищается перед каждым тестом. Проверено: `vi.fn()` уровня модуля, вызванный в первом тесте, во втором имел 0 вызовов.
  - **Не-awaited `expect(...).resolves/.rejects` и `toMatchFileSnapshot` теперь роняют тест** с сообщением «Promise returned by `expect(actual).rejects.toThrow(expected)` was not awaited» (проверено).
  - `expect.poll` отклоняется по таймауту, его колбэк получает `AbortSignal`; `toThrow('')` совпадает с любой ошибкой (пишите `/^$/`); `-t` сопоставляется с полным именем, соединённым через `' > '`.
  - `vi.mock`/`vi.hoisted` внутри функций и блоков теперь бросают исключение; моки классов сохраняют цепочку прототипов (`instanceof` работает).
  - `test.sequential`/`describe.sequential` удалены → `concurrent: false`; верхнеуровневый `bench` удалён → бенчмарки стали фикстурой контекста теста; удалены многие точки входа (`vitest/coverage`, `vitest/reporters`, `vitest/snapshot`, …).
  - Артефакты пишутся в `.vitest/`; репортёры `json`/`junit` по умолчанию пишут файлы; Vitest UI требует токен в URL; конфиг больше не ищется в родительских каталогах; фейковые таймеры по умолчанию подменяют `Temporal` (отключение — `toNotFake: ['Temporal']`).
- **Новое в Vitest 5**: `vi.when(fn).calledWith(1).thenReturn('one')` (+ `thenReturnOnce`, `times`, `toHaveBeenExhausted`; проверено локально, что `vi.when` есть); постоянный `fsModuleCache` (включён по умолчанию с 5.0.4); `sharedViteServer` для inline-проектов; `vitest doctor`; `--repeats` для охоты на нестабильные тесты; `--merge-reports`; V8-покрытие `coverage.autoAttachSubprocess` (дочерние процессы и workers); объект `coverage.thresholds.perFile`.
- **Vitest 5.1**: `--last-failed`, `--since-last-run`, интерактивный разбор упавших снапшотов, фейковые таймеры для `node:timers` и `node:timers/promises`, `vi.setSystemTime(Temporal.Instant|ZonedDateTime)`, `ignoreNode` для V8, опция `message` у `vi.waitFor`/`vi.waitUntil`.
- **Изменения Vitest 4, важные при переходе с 3**: Node ≥20; `coverage.all`/`coverage.extensions` удалены — **задавайте `coverage.include` явно**, иначе непротестированные файлы не видны; AST-aware ремаппинг V8 стал единственным режимом (точность близка к Istanbul); Tinypool и `poolOptions` удалены, `maxThreads/maxForks` → `maxWorkers`, `singleFork` → `maxWorkers: 1, isolate: false`; `workspace` → `projects` в `vitest.config.ts`; `vi.restoreAllMocks` восстанавливает только шпионов `vi.spyOn`; `deps.inline/external` → `server.deps.*`; репортёр `basic` удалён; Browser Mode стабилен, провайдеры — пакеты `@vitest/browser-playwright`/`-webdriverio`/`-preview`; визуальная регрессия `toMatchScreenshot`; `expect.schemaMatching` (Standard Schema: Zod, Valibot, ArkType); `expect.assert`.
- **Vitest 4.1**: **теги** тестов (конфиг `tags`, `--tags-filter`); `experimental.viteModuleRunner: false` выполняет файлы нативным `import` Node (без трансформаций Vite, без aliases, плагинов и istanbul) — ближе всего к семантике продакшена; билдер `test.extend` с выводом типов фикстур и `onCleanup`; хуки `aroundEach`/`aroundAll` (обернуть тест в транзакцию БД или контекст AsyncLocalStorage); `vi.defineHelper`; `mockThrow`/`mockThrowOnce`; `--detect-async-leaks` (поиск утечек на async_hooks); **репортёр `agent`** — печатает только падения, чтобы экономить токены, включается сам в распознанных окружениях ИИ-агентов или через `AI_AGENT`; `coverage.changed`; диапазоны `/* v8 ignore start */`.
- Пулы: `forks` (по умолчанию; child_process; безопаснее для нативных аддонов и `process.chdir`), `threads` (worker_threads; быстрее, но нет `process.chdir` и ломаются некоторые нативные модули), `vmThreads`/`vmForks` (самые быстрые, склонны к утечкам; в v5 поддерживают `require(esm)`). `isolate: false` сильно ускоряет ценой общего состояния модулей — тот же компромисс, что `node --test --test-isolation=none`.
- Переход с Jest: глобалов нет без `globals: true` (от них зависит авто-очистка testing-library); фабрика `vi.mock` должна вернуть все экспорты, включая `default`; `__mocks__` не применяются автоматически; `jest.requireActual` → `await vi.importActual`; нет legacy-таймеров; нет колбэков `done`; `JEST_WORKER_ID` → `VITEST_POOL_ID`.
- Проверенный конфиг — в [разделе 24](#24-рекомендуемая-конфигурация).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Vitest 5](https://vitest.dev/blog/vitest-5) | Vitest team, 2026-09-03 | Пост о релизе v5: новое и ломающее |
| [Migration guide](https://vitest.dev/guide/migration) | Vitest team, 2026 | Полный список v4 → v5 |
| [Migration guide v3 → v4](https://v4.vitest.dev/guide/migration.html) | Vitest team, 2025 | Покрытие, пулы, projects |
| [Vitest 4.0](https://vitest.dev/blog/vitest-4) | Vitest team, 2025-10-22 | Стабильный Browser Mode, визуальная регрессия |
| [Vitest 4.1](https://vitest.dev/blog/vitest-4-1) | Vitest team, 2026-03-12 | Теги, aroundEach, репортёр agent, нативный module runner |
| [Vitest releases](https://github.com/vitest-dev/vitest/releases) | Vitest team, 2026 | Заметки 5.1.0 и патчей 5.0.x |
| [Migrating from Jest](https://vitest.dev/guide/migration/jest) | Vitest team | Отличия Jest и Vitest |
| [Mocking](https://vitest.dev/guide/mocking) | Vitest team | `vi.mock`, `vi.spyOn`, моки модулей, таймеров и дат |
| [Improving Performance](https://vitest.dev/guide/improving-performance) | Vitest team | Пулы, изоляция, шардирование |
| [Coverage](https://vitest.dev/guide/coverage) | Vitest team | Провайдеры V8 и Istanbul, include, пороги, ignore-комментарии |
| [Test Context](https://vitest.dev/guide/test-context) | Vitest team | Фикстуры `test.extend` |
| [Browser Mode](https://vitest.dev/guide/browser/) | Vitest team | Тесты в настоящем браузере |
| [eslint-plugin-vitest](https://github.com/vitest-dev/eslint-plugin-vitest) | Vitest community | Правила линтера для тестов |

## 8. Jest 30

**Ключевые выводы**
- **Jest 30.0** вышел 10 июня 2025 (пост в блоге — 4 июня 2025), текущая — 30.5.2 (18 сентября 2026); Jest 31 на 6 ноября 2026 не анонсирован. Убраны Node 14/16/19/21; в `jest-environment-jsdom` jsdom 26; TS ≥5.4; удалены псевдонимы `expect` (`toBeCalled` → `toHaveBeenCalled` и др.; `eslint-plugin-jest` исправляет автоматически); `--testPathPattern` → `--testPathPatterns`; `toEqual` игнорирует неперечисляемые свойства; внутренности собраны в бандл (глубокие импорты ломаются).
- Новое: `unrs-resolver` (быстрее разрешение модулей, меньше памяти: в одном TS-приложении −37 % времени и −77 % памяти), `using spy = jest.spyOn(...)` с автооткатом, `expect.arrayOf`, плейсхолдер `%$` (индекс) в `test.each`, `jest.advanceTimersToNextFrame()`, `jest.retryTimes(n, { waitBeforeRetry, retryImmediately })`, `jest.onGenerateMock`, `testEnvironmentOptions.globalsCleanup` (`'soft'` по умолчанию, `'on'` — строго), конфиги на TS, асинхронный `setupFilesAfterEnv`.
- **ESM всё ещё experimental**: нужен `node --experimental-vm-modules node_modules/jest/bin/jest.js` (или `NODE_OPTIONS`), `transform: {}` или трансформер, выдающий ESM, `extensionsToTreatAsEsm` для `.ts`. Объект `jest` — через `import { jest } from '@jest/globals'` или `import.meta.jest`. Моки ESM — `jest.unstable_mockModule(path, factory)` + `await import()`; `jest.mock` на ESM не действует. На Node 24.9+ внутри Jest работает `require(esm)`, и automock/`__mocks__` применяются к синхронно вычислимым графам ESM.
- TS: `ts-jest` (проверяет типы, медленнее), `@swc/jest` или `babel-jest` (только снимают типы). Собственный реестр модулей Jest заново выполняет модули в каждом тестовом файле: синглтоны между файлами не общие (хорошая изоляция, медленнее старт).
- **Когда Jest ещё уместен**: большие существующие наборы, React Native (Jest там по умолчанию), Jest-специфичная экосистема (свои окружения, `jest-junit`). Для новых Node-проектов в 2026 практичные варианты — `node:test` (без трансформации) или Vitest (TS и ESM из коробки, Jest-совместимый API).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Jest 30: Faster, Leaner, Better](https://jestjs.io/blog/2025/06/04/jest-30) | Jest team (Christoph Nakazawa и др.), 2025 | Изменения Jest 30 и цифры |
| [Upgrading to Jest 30](https://jestjs.io/docs/upgrading-to-jest30) | Jest team, 2025 | Переход 29 → 30 |
| [ECMAScript Modules](https://jestjs.io/docs/ecmascript-modules) | Jest team, 2026 | Статус ESM, `unstable_mockModule`, расхождения |
| [Timer Mocks](https://jestjs.io/docs/timer-mocks) | Jest team | Фейковые таймеры (modern = @sinonjs/fake-timers) |
| [Configuring Jest](https://jestjs.io/docs/configuration) | Jest team | Справочник конфигурации |
| [eslint-plugin-jest](https://github.com/jest-community/eslint-plugin-jest) | jest-community | Правила линтера, автоисправление псевдонимов |

## 9. Другие раннеры и выбор раннера

**Ключевые выводы**
- **Mocha 12** (31 августа 2026; engines `^20.19 || >=22.12`) + **Chai 6** (только ESM с 5.0) + Sinon: всё ещё часто встречаются в старых бэкендах. Гибко, но ассерты, моки и покрытие собираете сами.
- **AVA 8.3** (engines `^22.20 || ^24.12 || >=26`): процессная изоляция, параллельность по умолчанию. В 8.0.1 добавлена поддержка Node 26 [не проверено].
- **node-tap 21**: нативный TAP, встроенное покрытие (c8) с порогом 100 % по умолчанию, система плагинов.
- **uvu 0.5.6** — последний релиз в 2022 [устарело] → `node:test` закрывает ту же нишу. **borp** — `node:test` + TS + покрытие в одном CLI.

| Ситуация | Выбор | Почему |
|---|---|---|
| Библиотека, CLI или сервис на JS или стираемом TS, мало моков модулей | `node:test` (+ c8 или встроенное покрытие) | Нет зависимостей, семантика рантайма, быстро с `--test-isolation=none` |
| TS/ESM-приложение с aliases, JSX, стеком Vite, частыми моками модулей, нужен удобный watch | Vitest 5 | Конвейер трансформаций, `vi.mock`, UI, Browser Mode, IDE |
| Существующий набор на Jest, React Native | Jest 30 | Цена миграции; экосистема RN |
| Браузерные и компонентные тесты | Vitest Browser Mode или Playwright CT | Настоящий браузер вместо jsdom |
| E2E | Playwright Test | См. [раздел 17](#17-e2e-и-браузер-playwright) |

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Mocha](https://mochajs.org/) | Mocha team | Документация Mocha |
| [AVA](https://github.com/avajs/ava) | AVA team | Документация, политика поддержки Node |
| [node-tap](https://node-tap.org/) | Isaac Z. Schlueter | Документация, настройки покрытия по умолчанию |
| [Chai](https://www.chaijs.com/) | Chai team | Библиотека ассертов |
| [uvu](https://github.com/lukeed/uvu) | Luke Edwards | [устарело] (без релизов с 2022) → `node:test` |

## 10. Стратегия моков, двойники и фейки

**Ключевые выводы**
- Словарь (Meszaros, Fowler): dummy, stub (готовые ответы), spy (записывает вызовы), mock (заранее заданные ожидания), **fake** (рабочая облегчённая реализация, например репозиторий в памяти). «Mock» в API Jest, Vitest и `node:test` означает spy плюс stub.
- **Мокайте свои границы** (порты и адаптеры): HTTP-клиенты, репозитории, часы, случайность, шину сообщений. Не мокайте то, чем не владеете (внутренности стороннего SDK): оберните его тонким адаптером и подменяйте адаптер, а сам адаптер покройте интеграционным тестом (реальный HTTP через MSW/nock, реальная БД в контейнере). Порты и адаптеры — в [architecture.md](architecture.md).
- **Для коллабораторов с состоянием фейк лучше проверки взаимодействий.** `InMemoryUserRepo` с тем же интерфейсом, что `PgUserRepo`, позволяет проверять итоговое состояние, переживает рефакторинг и прогоняется тем же **контрактным набором**, что и настоящая реализация (один общий `describe` для обеих).
- **Внедряйте время и случайность**: `createService({ now: () => Date.now(), random: Math.random, fetch })`. Фейковые таймеры (`mock.timers` в `node:test`, `vi.useFakeTimers`, `jest.useFakeTimers`, `@sinonjs/fake-timers`) нужны коду, который планирует работу; коду, который только читает время, проще внедрённые часы.
- **Шпионы**: сначала проверяйте результат, потом вызовы. Проверяя вызовы, проверяйте аргументы (`toHaveBeenCalledWith`, `fn.mock.calls[0].arguments`) и число вызовов, а не только «был вызван». Откатывайте всё: `t.mock` откатывается сам; в Vitest `restoreMocks: true`; в Jest 30 `using spy = jest.spyOn(...)` откатывается в конце блока.
- **Типизированные глубокие моки** `vitest-mock-extended`/`jest-mock-extended` (`mock<UserRepo>()`) удобны, но подталкивают мокать лишнее. Рукописный фейк обычно около 20 строк и понятнее.
- **Sinon 22 / testdouble 4** — для Mocha и `node:test`, если нужны богатые стабы (`sinon.stub().withArgs(1).resolves(x)`, `td.when(fn(1)).thenReturn(x)`). В Vitest 5 то же даёт встроенный `vi.when`.
- Устаревшие помощники: `proxyquire` (2023, только CJS), `mockdate` (2022), `timekeeper` (2023) [устарело] → DI, `mock.module`/`vi.mock`, фейковые таймеры раннера.

```ts
// Один контрактный набор для фейка и настоящего репозитория
export function userRepoContract(name: string, makeRepo: () => Promise<UserRepo>) {
  describe(`${name} satisfies UserRepo`, () => {
    test('findById returns a saved user', async () => {
      const repo = await makeRepo();
      await repo.save({ id: 'u1', email: 'a@example.com' });
      assert.deepStrictEqual(await repo.findById('u1'), { id: 'u1', email: 'a@example.com' });
    });
    test('findById returns null for an unknown id', async () => {
      assert.equal(await (await makeRepo()).findById('nope'), null);
    });
  });
}
userRepoContract('InMemoryUserRepo', async () => new InMemoryUserRepo());
// в интеграционном наборе: userRepoContract('PgUserRepo', () => makePgRepo(dbUrl));
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) | Martin Fowler, 2007 | Классическая и мокистская школы; словарь двойников |
| [TestDouble](https://martinfowler.com/bliki/TestDouble.html) | Martin Fowler, 2006 | Короткая таксономия двойников |
| [Test Double](http://xunitpatterns.com/Test%20Double.html) | Gerard Meszaros | Исходные паттерны тестовых двойников |
| [JavaScript & Node.js Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices) | Yoni Goldberg, обновлено в 2025 | 50+ правил: имена, AAA, двойники, данные, бэкенд |
| [The Merits of Mocking](https://kentcdodds.com/blog/the-merits-of-mocking) | Kent C. Dodds | Цена и польза моков |
| [Stop mocking fetch](https://kentcdodds.com/blog/stop-mocking-fetch) | Kent C. Dodds | Мокайте сеть (MSW), а не `fetch` |
| [Sinon.JS](https://sinonjs.org/) | Sinon team | Стабы, шпионы, фейковые таймеры для любого раннера |
| [@sinonjs/fake-timers](https://github.com/sinonjs/fake-timers) | Sinon team | Движок фейковых таймеров Jest и Vitest |
| [testdouble.js](https://github.com/testdouble/testdouble.js) | Test Double | Двойники с позицией (`td.when`) |
| [vitest-mock-extended](https://github.com/eratio08/vitest-mock-extended) | eratio08 | Типизированные глубокие моки для Vitest |

## 11. HTTP-моки, MSW, nock, MockAgent

**Ключевые выводы**
- **Все три перехватывают глобальный `fetch` на Node 24** (проверено локально): один файл `node:test` с `MockAgent` из `undici@8.12` + `setGlobalDispatcher`, `setupServer` из `msw@3` и `nock@15` прошёл. Node 24.17 содержит встроенный undici 7.28.0, но `MockAgent` из npm-пакета undici 8, установленный глобальным диспетчером, встроенный `fetch` учёл: глобальный диспетчер общий, через символ.
- **undici `MockAgent`** — самый низкий уровень, без лишних зависимостей, если undici уже используется. `.times(n)`, `.persist()`, `.delay(ms)`, `.replyWithError(err)`; в конце — `agent.assertNoPendingInterceptors()`; `new MockAgent({ enableCallHistory: true })` + `getCallHistory()` для проверки запросов; origin может быть строкой, RegExp или функцией. Восстанавливайте прежний диспетчер в `t.after` и делайте `await agent.close()`. На отдельно созданные `Pool`/`Client` не влияет — передайте такому коду мок-пул. Неперехваченный запрос при отключённой сети даёт `TypeError: fetch failed` (проверено локально).

```js
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher } from 'undici';

test('loads a user', async (t) => {
  const previous = getGlobalDispatcher();
  const agent = new MockAgent();
  agent.disableNetConnect();
  setGlobalDispatcher(agent);
  t.after(async () => { setGlobalDispatcher(previous); await agent.close(); });

  agent.get('https://api.example.com')
    .intercept({ path: '/users/1', method: 'GET' })
    .reply(200, { id: 1 });

  assert.deepEqual(await loadUser(1), { id: 1 });
  agent.assertNoPendingInterceptors();
});
```

- **MSW 3** (28 сентября 2026): **только ESM**, engines `>=22.12` (Node 18 и 20 объявлены устаревшими). Перехват на уровне **сокетов TCP/TLS** (pipe-and-parse через llhttp) вместо патча `http`/`ClientRequest`, поэтому одинаково работает для `http`, `https`, `fetch`, undici, axios, got. Раздельные точки входа `msw/http`, `msw/graphql`, `msw/sse`, `msw/ws`; подписки GraphQL; экспериментальный `defineNetwork` (будущая замена `setupServer`). Одни и те же обработчики работают в браузере (Service Worker), тестах Node и Storybook.

```js
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('https://api.example.com/users/:id',
    ({ params }) => HttpResponse.json({ id: Number(params.id) })),
);
before(() => server.listen({ onUnhandledRequest: 'error' }));   // немоканный запрос = ошибка
afterEach(() => server.resetHandlers());
after(() => server.close());

test('shows an error when the API is down', async () => {
  server.use(http.get('https://api.example.com/users/:id', () => HttpResponse.error()));
  await assert.rejects(loadUser(1), { name: 'UpstreamError' });
});
```

- **nock 15** (стабильная линия с октября 2026; engines `>=22.20`) тоже перешёл на `@mswjs/interceptors` с перехватом на уровне TCP/TLS. `nock.disableNetConnect()`, `scope.done()` проверяет, что все перехватчики использованы, `nock.cleanAll()` в teardown, запись фикстур — `nock.back`. npm `15.0.0` был ошибочной ранней публикацией (в заметках релиза — «released by accident»), берите ≥15.0.1.
- **Выбор**: MSW — для приложений, где моки общие для браузера и Node, и для реалистичного поведения сети; nock — для существующих наборов и стиля `scope.done()`; MockAgent — для библиотек на undici или когда не нужна лишняя зависимость. Всегда роняйте тест на необработанном запросе (`onUnhandledRequest: 'error'` / `disableNetConnect()`), чтобы забытый мок не ушёл в реальную сеть.
- `fetch-mock` 12.6 (последний релиз — октябрь 2025) мокает только `fetch`; лучше инструменты сетевого уровня.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Introducing MSW 3.0](https://mswjs.io/blog/introducing-msw-3.0) | Artem Zakharchenko, 2026-09-30 | MSW 3: только ESM, перехват сокетов, точки входа |
| [Migration 2.x → 3.x](https://mswjs.io/docs/migrations/2.x-to-3.x) | MSW team, 2026 | Переход 2 → 3 |
| [MSW: Node.js integration](https://mswjs.io/docs/integrations/node) | MSW team | `setupServer` в тестах Node |
| [Avoid request assertions](https://mswjs.io/docs/best-practices/avoid-request-assertions) | MSW team | Проверяйте результат, а не запросы |
| [@mswjs/interceptors](https://github.com/mswjs/interceptors) | MSW team | Низкоуровневая библиотека перехвата под MSW и nock |
| [nock](https://github.com/nock/nock) | nock maintainers | API, `disableNetConnect`, `scope.done` |
| [nock releases](https://github.com/nock/nock/releases) | nock maintainers, 2026 | Статус v15 (ошибочный 15.0.0) |
| [MockAgent](https://github.com/nodejs/undici/blob/main/docs/docs/api/MockAgent.md) | undici team, 2026 | Опции, история вызовов, запрет сети |
| [Mocking Request](https://github.com/nodejs/undici/blob/main/docs/docs/best-practices/mocking-request.md) | undici team | Рецепты моков |

## 12. Тесты HTTP-серверов

**Ключевые выводы**
- **Разделите сборку и запуск**: `buildApp(opts)` возвращает приложение без `listen()`, а `server.js` вызывает `listen()`. Тест создаёт свежий экземпляр на тест (или на файл) и закрывает его: `t.after(() => app.close())`.
- **Fastify**: `await app.inject({ method: 'GET', url: '/users/1', headers, payload })` работает через `light-my-request` — без сокета и порта, дожидается загрузки плагинов; самый быстрый и детерминированный способ. Руководство Fastify само использует `node:test` + `t.assert`. Для полной проверки стека — `await app.listen({ port: 0 })` и запросы через `fetch`/undici.
- **Express, Koa, чистый `http`**: `supertest(app)` (7.3, развивается) поднимает эфемерный порт на цепочку запросов: `await request(app).post('/users').send({...}).expect(201)`. Альтернатива: `app.listen(0)`, порт из `server.address().port`, `fetch`, закрытие в `after`.
- **Hono и обработчики на Web-стандартах**: `await app.request('/users/1')` или прямой вызов `app.fetch(new Request(...))` — сервер не нужен.
- Проверяйте **пять исходов** (Goldberg): ответ (статус, схема тела), новое состояние (строка в БД), исходящие вызовы (замоканный HTTP), сообщения (очередь), наблюдаемость (логи, метрики).
- Тело ответа сверяйте с той же схемой, которую публикует API (Zod, TypeBox, OpenAPI), а не огромным deep-equal: так ловится дрейф контракта. Особенности фреймворков — в [domains-server.md](domains-server.md).

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.ts';

test('POST /orders rejects an empty cart', async (t) => {
  const app = await buildApp({ logger: false });
  t.after(() => app.close());
  const res = await app.inject({ method: 'POST', url: '/orders', payload: { items: [] } });
  assert.equal(res.statusCode, 422);
  assert.equal(res.json().code, 'E_EMPTY_CART');
});
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Fastify: Testing](https://fastify.dev/docs/latest/Guides/Testing/) | Fastify team | `inject`, фабрика приложения, `node:test` |
| [light-my-request](https://github.com/fastify/light-my-request) | Fastify team | Движок инъекции HTTP без сокета |
| [supertest](https://github.com/forwardemail/supertest) | Forward Email (ladjs) | API supertest |
| [Hono: Testing](https://hono.dev/docs/guides/testing) | Hono team | Тесты через `app.request()` |
| [nodejs-integration-tests-best-practices](https://github.com/testjavascript/nodejs-integration-tests-best-practices) | Yoni Goldberg и др. | Эталонный репозиторий: компонентные тесты с реальной БД, MSW/nock, Docker |

## 13. Базы данных и инфраструктура

**Ключевые выводы**
- **Для тестов репозиториев и SQL берите настоящий движок.** Эмуляторы (`pg-mem`) расходятся в SQL-возможностях, блокировках, JSON-операторах и миграциях. Варианты по цене:
  1. **Testcontainers 12** (engines `>= 22.22`): `const pg = await new PostgreSqlContainer('postgres:17').start(); pg.getConnectionUri()`; `GenericContainer(...).withExposedPorts(6379).withWaitStrategy(Wait.forLogMessage(...))`, `getMappedPort()`/`getHost()`; `.withReuse()` (глобальный переключатель `TESTCONTAINERS_REUSE_ENABLE`); sidecar Ryuk удаляет контейнеры после прогона. Запускайте один раз на прогон в global setup: Vitest `globalSetup` + `project.provide('dbUrl', url)` / `inject('dbUrl')` или `node --test-global-setup`. Передаваемые значения должны сериализоваться.
  2. Сервис **docker compose** в CI, поднятый до тестов: дешевле всего в CI, локально менее герметично.
  3. **PGlite** 0.5 (Postgres, скомпилированный в WASM, внутри процесса): быстро, без Docker, подходит для почти-unit тестов репозитория; расширения ограничены [не проверено].
  4. **`mongodb-memory-server` 11** (скачивает настоящий `mongod`); SQLite через `node:sqlite` или better-sqlite3 `:memory:`, если в продакшене SQLite.
- **Изоляция тестов друг от друга**: (а) транзакция на тест с откатом — быстро, но ломается, если тестируемый код сам коммитит или берёт несколько соединений; (б) своя схема или БД на воркер (`VITEST_POOL_ID`, `process.env.NODE_TEST_CONTEXT` или имена по файлу) + truncate между файлами; (в) каждый тест создаёт свои данные с уникальными ключами и не зависит от чужих строк — рекомендация Goldberg: работает с параллельностью, чистка после прогона, а не после каждого теста.
- **Миграции**: прогоняйте настоящие миграции в global setup (ловит сломанные миграции); глобально сидируйте только справочные данные; данные теста — через фабрики (`@faker-js/faker` 10, `fishery`).
- Redis: настоящий Redis/Valkey в контейнере лучше `ioredis-mock` (последний релиз — октябрь 2025). Kafka и RabbitMQ — модули Testcontainers (`@testcontainers/kafka`, `@testcontainers/rabbitmq`).
- Разработка на Windows и macOS: Docker Desktop, Podman (задайте `DOCKER_HOST`) или Testcontainers Cloud; в CI на Linux-раннерах GitHub Docker есть.

```ts
// vitest.global-setup.ts — один контейнер на весь прогон
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

export default async function setup(project: TestProject) {
  const pg = await new PostgreSqlContainer('postgres:17').start();
  await runMigrations(pg.getConnectionUri());
  project.provide('dbUrl', pg.getConnectionUri());     // в тесте: inject('dbUrl')
  return async () => { await pg.stop(); };
}

declare module 'vitest' {
  export interface ProvidedContext { dbUrl: string }   // без этого provide('dbUrl') — ошибка TS2345
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Testcontainers for NodeJS](https://node.testcontainers.org/) | Testcontainers (Cristian Greco и др.) | Документация, список модулей |
| [Containers](https://node.testcontainers.org/features/containers/) | Testcontainers | `GenericContainer`, reuse, порты |
| [Global setup](https://node.testcontainers.org/quickstart/global-setup/) | Testcontainers | Один контейнер на прогон с Vitest `globalSetup` |
| [Wait strategies](https://node.testcontainers.org/features/wait-strategies/) | Testcontainers | Стратегии ожидания |
| [PostgreSQL module](https://node.testcontainers.org/modules/postgresql/) | Testcontainers | Модуль PostgreSQL |
| [PGlite](https://pglite.dev/) | ElectricSQL | Postgres в процессе (WASM) |
| [pg-mem](https://github.com/oguimbal/pg-mem) | Olivier Guimbal | Эмулятор — знайте его пределы |
| [mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server) | typegoose | Настоящий mongod на прогон |
| [Faker](https://fakerjs.dev/) | Faker team | Реалистичные данные, сиды (`faker.seed(n)`) |
| [fishery](https://github.com/thoughtbot/fishery) | thoughtbot | Типизированные фабрики тестовых данных |

## 14. Property-based тесты, fast-check

**Ключевые выводы**
- **fast-check 4** (4.0 — 10 марта 2025; последняя 4.10.2) — де-факто библиотека PBT для JS/TS. Ломающие изменения 4.0: по умолчанию генерируются невалидные `Date` (отключение — `fc.date({ noInvalidDate: true })`), ошибки по умолчанию несут `cause`, `fc.record`/`fc.object` по умолчанию включают объекты с null-прототипом; нужны TS ≥5.0 и ES2020 [не проверено].
- Работает в любом раннере: `fc.assert` бросает исключение с ужатым контрпримером и `seed`/`path` для воспроизведения (проверено локально: свойство над `toSorted` под `node:test`). Async — `fc.asyncProperty` + `await fc.assert(...)`. Для Vitest — `@fast-check/vitest` (`test.prop([fc.string()])('…', (s) => …)`), для Jest — `@fast-check/jest`.

```js
import fc from 'fast-check';

test('toSorted keeps length and orders elements', () => {
  fc.assert(fc.property(fc.array(fc.integer()), (xs) => {
    const s = xs.toSorted((a, b) => a - b);
    return s.length === xs.length && s.every((v, i) => i === 0 || s[i - 1] <= v);
  }), { numRuns: 200 });   // seed закрепляйте только для воспроизведения; в CI оставьте случайным и логируйте
});
```

- **Хорошие свойства**: round-trip (`parse(serialize(x)) ≡ x`), инварианты (отсортировано, длина сохранена, идемпотентность `f(f(x)) = f(x)`), оракул или дифференциальное сравнение (новая реализация против эталонной или медленной), метаморфные (масштаб входа масштабирует выход), «никогда не падает» для парсеров и валидаторов, model-based тесты (`fc.commands` + `fc.modelRun`) для API и структур данных с состоянием, а также **поиск гонок** через `fc.scheduler()` — он управляет порядком разрешения промисов (есть только в fast-check).
- Генераторы держите близко к предметной области (`fc.record({ email: fc.emailAddress(), age: fc.integer({ min: 0, max: 150 }) })`); избегайте фильтров `fc.pre`, отбрасывающих большую часть входов; `numRuns` подбирайте по стоимости теста; найденный контрпример превращайте в обычный пример (`examples: [[...]]`).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [fast-check](https://fast-check.dev/) | Nicolas Dubien | Документация: arbitraries, раннеры, model-based, scheduler |
| [What's new in fast-check 4.0.0](https://fast-check.dev/blog/2025/03/10/whats-new-in-fast-check-4-0-0/) | Nicolas Dubien, 2025 | Ломающие изменения 4.0 |
| [dubzzz/fast-check](https://github.com/dubzzz/fast-check) | Nicolas Dubien | Репозиторий, пакеты `@fast-check/vitest`, `/jest` |
| [Detect race conditions](https://fast-check.dev/docs/tutorials/detect-race-conditions/) | Nicolas Dubien | Поиск гонок через scheduler |
| [Choosing properties for property-based testing](https://fsharpforfunandprofit.com/posts/property-based-testing-2/) | Scott Wlaschin, 2014 | Классический каталог шаблонов свойств |
| [What is property-based testing?](https://hypothesis.works/articles/what-is-property-based-testing/) | David MacIver | Что такое PBT, независимо от языка |

## 15. Мутационное тестирование, StrykerJS

**Ключевые выводы**
- **StrykerJS 10** (10.0 — 14 августа 2026, 10.1.1 — 23 октября 2026; engines `>=22`) — единственный зрелый мутационный тестер для JS/TS. Раннеры: `@stryker-mutator/vitest-runner`, `jest-runner`, `mocha-runner`, `karma-runner`, **`tap-runner` (работает с `node:test`; с v9 в `nodeArgs` по умолчанию есть `--test-reporter=tap`)** и `command` (любой `npm test`, без оптимизации по тестам).
- Ограничения tap-runner: каждый тестовый файл считается одним тестом, покрытие по файлам (нет обнаружения статических мутантов), процесс на файл — медленно при многих файлах и JIT-транспиляторах. Vitest-раннер: только выполнение в стиле threads, без Browser Mode, покрытие Vitest на время мутаций отключено [не проверено].
- Главные настройки: `mutate` (по умолчанию `src/**`/`lib/**` без тестов; поддерживаются диапазоны строк `file.ts:10-40`), `coverageAnalysis: "perTest"` (по умолчанию; тесты должны быть независимы от порядка), `thresholds: { high: 80, low: 60, break: null }` — задайте `break`, чтобы ронять CI, `incremental: true` + `incrementalFile` (перетестировать только изменённый код), `ignoreStatic: true` (пропустить мутанты, выполняемые при загрузке модуля; сильно ускоряет), `checkers: ["typescript"]` (отбросить мутанты, не проходящие проверку типов), `concurrency`, `timeoutMS`/`timeoutFactor`.

```json
{
  "testRunner": "vitest",
  "plugins": ["@stryker-mutator/vitest-runner", "@stryker-mutator/typescript-checker"],
  "checkers": ["typescript"],
  "mutate": ["src/**/*.ts", "!src/**/*.d.ts"],
  "incremental": true,
  "ignoreStatic": true,
  "thresholds": { "high": 85, "low": 70, "break": 60 }
}
```

- Запускайте на критичных модулях (цены, авторизация, парсеры) или на диффе (`--mutate` по изменённым файлам, `incremental`), а не на всём монорепозитории на каждый коммит. Выживший мутант указывает на недостающий ассерт, а не на непокрытую строку. Это лучшее средство против тестов, которые лишь накручивают покрытие, в том числе написанных ИИ.
- Локально StrykerJS 10 не запускался; сводка изменений 9.4–10.0 взята из вторичного источника.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [StrykerJS: Introduction](https://stryker-mutator.io/docs/stryker-js/introduction/) | Stryker team | С чего начать |
| [StrykerJS: Configuration](https://stryker-mutator.io/docs/stryker-js/configuration/) | Stryker team, 2026 | Все опции и значения по умолчанию |
| [Tap Runner](https://stryker-mutator.io/docs/stryker-js/tap-runner/) | Stryker team | `node:test` через TAP |
| [Vitest Runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/) | Stryker team | Ограничения раннера Vitest |
| [Incremental](https://stryker-mutator.io/docs/stryker-js/incremental/) | Stryker team | Инкрементальный режим |
| [Supported mutators](https://stryker-mutator.io/docs/mutation-testing-elements/supported-mutators/) | Stryker team | Каталог мутаторов |
| [stryker-js releases](https://github.com/stryker-mutator/stryker-js/releases) | Stryker team, 2026 | Заметки релизов 10.x |
| [StrykerJS Mutation Testing 2026](https://nevercodealone.de/de/frontend-development/strykerjs-mutation-testing-javascript-typescript-2026) | Never Code Alone, 2026 | (на немецком) сводка изменений Stryker 9.4–10.0 [не проверено] |

## 16. Инструменты покрытия, V8 и Istanbul

**Ключевые выводы**
- **Покрытие V8** (`node --experimental-test-coverage`, c8 12, Vitest `provider: 'v8'`, Jest `coverageProvider: 'v8'`): без инструментирования, скорость почти нативная, для TS нужны source maps. Vitest ≥4 использует только **AST-aware ремаппинг**, который убрал большинство исторических расхождений V8 и Istanbul.
- **Istanbul** (nyc 18, Vitest `provider: 'istanbul'` → в v5 пакет `@vitest/istanbuljs`, в Jest по умолчанию `babel`): инструментирует код, поэтому медленнее, но точно считает операторы и ветви и работает в любом JS-движке.
- **Мерьте ветви, а не строки** (подвох из [раздела 5](#5-nodetest-покрытие-и-пороги)): то же проверено локально на Vitest 5.1.0 — файл с невызванной однострочной стрелочной функцией показал Lines 100 %, Functions 50 %, Branches 0 %. Пороги только повышайте («храповик»); в монорепозитории — пороги на пакет; Vitest `coverage.thresholds.perFile` и `autoUpdate` фиксируют текущие значения.
- **Всегда задавайте `coverage.include`**: в Vitest ≥4 `coverage.all` удалён, и непротестированные файлы иначе не видны. Исключайте сгенерированный код, а не трудный.
- Покрытие подпроцессов: c8 и `NODE_V8_COVERAGE=dir` собирают дочерние процессы сами; в Vitest 5 — `coverage.autoAttachSubprocess`. Слияние шардов: `c8 report`, `nyc merge`, Vitest `--merge-reports` или `monocart-coverage-reports` (сливает V8 и Istanbul, а также браузерное покрытие из Playwright).
- Покрытие диффа в PR (patch coverage в Codecov/Coveralls или `vitest --coverage.changed`) — сигнал для ревью полезнее глобального процента.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [nyc](https://github.com/istanbuljs/nyc) | istanbuljs | CLI Istanbul |
| [monocart-coverage-reports](https://github.com/cenfun/monocart-coverage-reports) | cenfun | Слияние V8/Istanbul, покрытие Playwright |
| [NODE_V8_COVERAGE=dir](https://nodejs.org/api/cli.html#node_v8_coveragedir) | Node.js project | Сырое покрытие V8 |
| [Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html) | Google Testing Blog, 2020 | Как пользоваться покрытием и не накручивать его |

c8 и руководство Vitest по покрытию — в таблицах разделов [5](#5-nodetest-покрытие-и-пороги) и [7](#7-vitest-5).

## 17. E2E и браузер, Playwright

**Ключевые выводы**
- **Playwright Test 1.65** (5 ноября 2026): **на Node 20 больше не тестируется — используйте 22/24/26**; может работать под Bun (`bunx --bun playwright test`, частично); репортёр `failures` и `onlyFailures` для HTML/JSON/JUnit; эксклюзивная блокировка теста. 1.64: `--shuffle`, `testProject.default`, `locator.within()`, `page.getByRef()`, API WebMCP. 1.63: опция теста `lock`, `locator.visible()`, `ariaSnapshotJSON()`. 1.62: `AbortSignal` в большинстве операций, `retryStrategy: 'isolated'`, встроенные **Playwright MCP** и `playwright-cli` (`npx playwright mcp`). 1.60: `test.abort()`, `toMatchAriaSnapshot()` на уровне страницы, HAR через tracing.
- Практики: локаторы по роли, метке и тексту (`getByRole('button', { name: 'Save' })`); web-first ассерты (`await expect(locator).toBeVisible()` повторяют проверку сами) — никогда `waitForTimeout`; свежий `BrowserContext` на тест; вход один раз через setup-проект со `storageState`; сторонняя сеть — через `page.route()` или HAR; трассы `trace: 'on-first-retry'`; шардирование в CI (`--shard=1/4`) со слиянием blob-отчётов; E2E — только для критических путей.
- Тесты API без браузера: фикстура `request` (`APIRequestContext`) — для black-box тестов развёрнутого Node-сервиса.
- Компонентные и UI-тесты: Vitest Browser Mode (провайдер Playwright) или Playwright CT; jsdom 31 / happy-dom 21 — для быстрых DOM-подобных unit-тестов (без реальной вёрстки).
- Cypress 16.2 остаётся альтернативой для фронтенд-команд; для Node-центричных репозиториев выбор по умолчанию — Playwright (несколько браузеров, параллельность, бесплатное шардирование).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Release notes](https://playwright.dev/docs/release-notes) | Microsoft, 2026 | Возможности 1.60–1.65, поддержка Node |
| [Best Practices](https://playwright.dev/docs/best-practices) | Microsoft | Локаторы, изоляция, web-first ассерты |
| [Sharding](https://playwright.dev/docs/test-sharding) | Microsoft | Шардирование и слияние отчётов |
| [Authentication](https://playwright.dev/docs/auth) | Microsoft | Setup-проект со `storageState` |
| [Mock APIs](https://playwright.dev/docs/mock) | Microsoft | `page.route`, моки через HAR |
| [API testing](https://playwright.dev/docs/api-testing) | Microsoft | Тесты API через `request` |
| [Trace viewer](https://playwright.dev/docs/trace-viewer) | Microsoft | Разбор падений по трассам |
| [Cypress docs](https://docs.cypress.io/) | Cypress.io | Альтернативный E2E-раннер |

## 18. Асинхронный код, таймеры, события, потоки

**Ключевые выводы**
- **Всегда `await` или `return` промис, который проверяете**: `assert.rejects`/`expect(...).rejects` сами асинхронны. Vitest 5 роняет не-awaited `resolves/rejects` (проверено локально); `node:test` роняет *файл* с «asynchronous activity after the test ended» (проверено локально); Jest может молча пройти. Добавьте правила `valid-expect` из `eslint-plugin-jest` или `@vitest/eslint-plugin` и `require-await`/`no-floating-promises` из typescript-eslint.
- **Ограничивайте каждое ожидание**: таймауты раннера (`--test-timeout`, `testTimeout`) и таймауты операций. События: `await once(ee, 'ready', { signal: AbortSignal.timeout(1000) })` даёт понятный `AbortError` вместо зависшего теста (проверено локально). Передавайте `t.signal` (`node:test`) в `fetch` и таймеры, чтобы тест, упавший по таймауту, отменял свою работу; тест с `{ timeout: 50 }` падает с `'test timed out after 50ms'` (проверено локально).
- **Ожидание итогового состояния**: `t.waitFor(() => assert.ok(cond), { interval, timeout })` (`node:test`), `vi.waitFor`/`expect.poll` (Vitest), `expect.poll` и web-first ассерты Playwright — никакого фиксированного `sleep`.
- **Фейковые таймеры и промисы.** После `tick()`/`advanceTimersByTime` колбэки промисов выполняются только когда опустеет очередь микрозадач. В Vitest и Jest есть асинхронные варианты (`vi.advanceTimersByTimeAsync`, `jest.advanceTimersByTimeAsync`). **В `node:test` на 24.17 `tickAsync` нет** (проверено локально), поэтому чередуйте `tick()` со сбросом очереди. Для кода `await sleep(10); n++; await sleep(10); n++` два подряд вызова `tick(10)` оставили `n === 0`, а после `await new Promise(r => setImmediate(r))` было только `n === 1`: второй таймер зарегистрировался уже после второго `tick`. Правильно: `tick → flush → tick → flush`.

```js
const flush = () => new Promise((r) => setImmediate(r));   // setImmediate не фейкаем

test('two sequential sleeps', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const done = worker();                      // await sleep(10); n++; await sleep(10); n++
  t.mock.timers.tick(10); await flush();      // n === 1
  t.mock.timers.tick(10); await flush();      // n === 2
  await done;
});
```

- **`node:timers/promises` под моками таймеров `node:test`** (проверено локально): `timersP.setTimeout(...)` через импорт по умолчанию или namespace подменился (разрешился за 1 мс), а деструктурированный `import { setTimeout } from 'node:timers/promises'` — **нет** (настоящее ожидание 311 мс). Vitest 5.1 подменяет `node:timers` и `node:timers/promises`. Не включайте фейковые таймеры в тестах с реальным I/O: драйверы БД опираются на настоящие таймеры.
- **Потоки**: собирайте через `await readable.toArray()` или `for await`; распространение ошибок проверяйте так: `await assert.rejects(pipeline(src, transform, sink), /boom/)` (проверено локально). **Границы чанков не сохраняются** в transform без object mode: `Readable.from(['a','b']).pipe(upper).toArray()` дал `['AB']`, а не `['A','B']` (проверено локально). Проверяйте склеенное содержимое (`Buffer.concat`) или используйте `objectMode`. Backpressure тестируйте медленным приёмником и `highWaterMark`: `write()` возвращает `false`, срабатывает `'drain'`.
- **Необработанные отклонения и утечки**: режим Node по умолчанию `--unhandled-rejections=throw` превращает потерянное отклонение в падение. Открытые handles ищите через Vitest `--detect-async-leaks` (4.1), Jest `--detectOpenHandles` или `why-is-node-running` 3.2. Для серверов и клиентов в тестах берите `using`/`await using` (`Symbol.asyncDispose`): очистка выполнится и при упавшем ассерте.
- Ошибки конкурентности: `fc.scheduler()` из fast-check перебирает порядки промисов ([раздел 14](#14-property-based-тесты-fast-check)); подозрительные тесты гоняйте с `--repeats`/`--test-randomize`. Модель event loop и async — в [concurrency-async-native.md](concurrency-async-native.md).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [events.once(emitter, name, options)](https://nodejs.org/api/events.html#eventsonceemitter-name-options) | Node.js project | `once` с `signal` |
| [readable.toArray()](https://nodejs.org/api/stream.html#readabletoarrayoptions) | Node.js project | Сбор потока в массив |
| [stream.pipeline()](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) | Node.js project | Семантика ошибок `pipeline` |
| [--unhandled-rejections=mode](https://nodejs.org/api/cli.html#--unhandled-rejectionsmode) | Node.js project | Режимы обработки отклонений |
| [vi.waitFor](https://vitest.dev/api/vi.html#vi-waitfor) | Vitest team | `vi.waitFor`, `vi.waitUntil` |
| [why-is-node-running](https://github.com/mafintosh/why-is-node-running) | Mathias Buus | Какие handles держат Node |

## 19. Нестабильные тесты

**Ключевые выводы**
- Частые причины в Node: общее изменяемое состояние между тестами и файлами (синглтоны модулей, `globalThis`, переменные окружения, `process.chdir`); зависимость от порядка (проявляется при `--test-isolation=none`, Vitest `isolate: false`, `sequence.shuffle`); настоящее время и часовые пояса (`TZ`, переход на летнее время, `Date.now()`); не-awaited промисы; фиксированные паузы; конфликты портов (всегда `listen(0)`); общие строки в БД; сетевые вызовы; случайные данные без залогированного сида; исчерпание ресурсов при параллельности (файловые дескрипторы, пул БД); различия путей и концов строк на Windows.
- **Обнаружение**: перемешивание (`node --test --test-randomize` печатает сид, воспроизведение — `--test-random-seed=N`, проверено локально; Vitest `sequence.shuffle`/`--sequence.seed`; Playwright `--shuffle` с 1.64), повторы (`vitest --repeats`, Playwright `--repeat-each`), прогон без изоляции, матрица ОС в CI; в Vitest 4.1 job summary репортёра `github-actions` перечисляет нестабильные тесты.
- **Повторы — диагностика, а не лечение**: `vitest --retry`, `jest.retryTimes(n, { waitBeforeRetry })`, Playwright `retries` + `retryStrategy: 'isolated'`, `node --test --test-rerun-failures`. Отмечайте статус «flaky», помещайте в карантин с владельцем и ссылкой на задачу, исправляйте или удаляйте к сроку. Не повышайте таймауты вслепую.
- Оговорка про `--test-rerun-failures`: он пропускает уже прошедшие тесты, и падение, зависящее от порядка, может исчезнуть (проверено локально).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Flaky Tests at Google and How We Mitigate Them](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html) | John Micco (Google), 2016 | Нестабильность в масштабе и что с ней делать |
| [Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html) | Martin Fowler, 2011 | Карантин, асинхронность, время |
| [Retries](https://playwright.dev/docs/test-retries) | Microsoft | Повторы, классификация flaky |
| [Vitest CLI](https://vitest.dev/guide/cli) | Vitest team | `--retry`, `--repeats`, `--sequence.shuffle` |

## 20. Структура, имена, данные

**Ключевые выводы**
- **Одно поведение на тест, AAA видно**, black-box через публичный API. Имя — *модуль / сценарий / ожидаемый результат* (Goldberg 1.1): `describe('createOrder') › it('rejects when the cart is empty')`. Вкладывайте `describe` по модулю, затем по сценарию; больше трёх уровней не нужно.
- **Расположение**: рядом с кодом (`src/foo.test.ts`, частый вариант в Vitest) или зеркальное дерево `test/` (частый вариант с `node:test`, не попадает в публикуемый пакет — настройте `files`/`.npmignore`). Медленные наборы отделяйте каталогом или именем (`*.int.test.ts`, `*.e2e.test.ts`) и запускайте отдельными npm-скриптами или проектами (Vitest `projects`, глобы `node:test`; теги в Vitest 4.1 и Node 24.19).
- **Тестовые данные**: фабрики с разумными значениями по умолчанию и переопределениями (`buildUser({ role: 'admin' })`, `fishery`), реалистичные значения (`@faker-js/faker` с `faker.seed(n)`, сид печатается при падении); каждый тест создаёт нужные ему данные; общие фикстуры тесты не меняют. Билдеры лучше огромных JSON-фикстур.
- **Ассерты** конкретные и полные: `deepStrictEqual` по нужному объекту, `assert.throws(fn, { name: 'ValidationError', message: /email/ })`, `toMatchObject` для частичного совпадения. Избегайте проверок только на истинность (`assert.ok(result)`) и проверок строк логов, если логирование не является поведением. Маленькие inline-снапшоты лучше больших файловых (Goldberg 1.8).
- **Хуки**: `beforeEach` — для свежего состояния; избегайте глубоких цепочек хуков, прячущих Arrange; лучше явно вызванные в тесте функции-помощники. Очистка — через `t.after` / `onTestFinished` / `using`.
- **Трофей против пирамиды**: для Node-сервисов основная ценность — в **компонентных и интеграционных тестах** (реальный HTTP-слой через `inject`, реальная БД в контейнере, сеть замокана на границе), плюс точечные unit-тесты чистой логики и несколько E2E-путей (Goldberg; трофей Kent C. Dodds).

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const buildCart = (over: Partial<Cart> = {}): Cart => ({ id: 'c1', items: [], currency: 'EUR', ...over });

describe('createOrder', () => {
  it('rejects when the cart is empty', async () => {
    await assert.rejects(createOrder(buildCart()), { code: 'E_EMPTY_CART' });   // Arrange + Act + Assert
  });
  it('totals line prices in cart currency', async () => {
    const order = await createOrder(buildCart({ items: [{ sku: 'a', price: 300, qty: 2 }] }));
    assert.deepEqual({ total: order.total, currency: order.currency }, { total: 600, currency: 'EUR' });
  });
});
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) | Kent C. Dodds, 2021 | Трофей и классификация тестов |
| [Avoid Nesting when you're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing) | Kent C. Dodds | Плоские тесты, меньше хуков |
| [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) | Ham Vocke (martinfowler.com), 2018 | Пирамида, контрактные тесты, слои |
| [UnitTest](https://martinfowler.com/bliki/UnitTest.html) | Martin Fowler, 2014 | Solitary и sociable unit-тесты |
| [SWE at Google, гл. 12: Unit Testing](https://abseil.io/resources/swe-book/html/ch12.html) | Google SWE book (Adam Bender), 2020 | Тестировать поведение, DAMP вместо DRY |
| [Testing on the Toilet: Writing Descriptive Test Names](https://testing.googleblog.com/2014/10/testing-on-toilet-writing-descriptive.html) | Google Testing Blog | Описательные имена тестов |

Свод правил Goldberg — в таблице [раздела 10](#10-стратегия-моков-двойники-и-фейки).

## 21. Контрактные тесты и схемы API

**Ключевые выводы**
- **Consumer-driven contracts с Pact JS 17** (25 июня 2026; engines `>=22`): тест потребителя идёт против мок-сервера Pact и записывает pact; поставщик проверяет его в своём CI (`Verifier` с обработчиками состояний); Pact Broker / PactFlow + `can-i-deploy` блокируют релиз. Pact JS работает на ядре на Rust (спецификация v4, плагины, message pacts для очередей) [не проверено].
- Облегчённые варианты: общий пакет схем (Zod, TypeBox, OpenAPI) — валидируйте запросы в тестах потребителя и ответы в тестах поставщика; генерируйте клиентов из OpenAPI; фаззите API по спецификации OpenAPI (CLI Schemathesis не зависит от языка). Контрактные тесты заменяют широкие E2E-окружения для совместимости сервисов, но не функциональные тесты.
- Контракты сообщений и событий: сериализаторы проверяйте свойствами round-trip ([раздел 14](#14-property-based-тесты-fast-check)) и версионированными схемами; держите фикстуру каждой опубликованной версии события и проверяйте, что текущий потребитель её разбирает.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Pact JS: Consumer tests](https://docs.pact.io/implementation_guides/javascript/docs/consumer) | Pact Foundation | Тесты потребителя на JS |
| [Pact JS: Provider verification](https://docs.pact.io/implementation_guides/javascript/docs/provider) | Pact Foundation | Проверка на стороне поставщика |
| [pact-js](https://github.com/pact-foundation/pact-js) | Pact Foundation | Репозиторий, заметки релиза v17 |
| [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html) | Ian Robinson (martinfowler.com), 2006 | Концепция consumer-driven contracts |
| [Schemathesis](https://schemathesis.readthedocs.io/) | Schemathesis | Фаззинг API по OpenAPI |

## 22. Тесты типов

**Ключевые выводы**
- Публичные типы библиотеки заслуживают тестов: `expect-type` (`expectTypeOf(fn).returns.toEqualTypeOf<User>()`), Vitest `vitest --typecheck` / файлы `*.test-d.ts`, `tsd` 0.33 (последний релиз — август 2025), строки `// @ts-expect-error`, которые компилирует `tsc --noEmit`.
- Прогоняйте `tsc --noEmit` (или `tsgo`) по тестовым файлам в CI: type stripping в `node --test` типы **не проверяет**. Подробно — в [typescript.md](typescript.md).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [expect-type](https://github.com/mmkal/expect-type) | Misha Kaletsky | Библиотека ассертов над типами |
| [Testing Types](https://vitest.dev/guide/testing-types) | Vitest team | Тесты типов в Vitest |

## 23. Правила для ИИ-агента, сначала тест

**Ключевые выводы**
1. **Определите раннер до того, как писать.** Прочитайте `scripts.test` и `devDependencies` в `package.json` (vitest, jest, mocha), конфиги (`vitest.config.*`, `jest.config.*`, `node.config.json`, `.mocharc*`, `.borp.yaml`) и один существующий тест. Скопируйте стиль импортов (`node:test` + `node:assert/strict` или импорты `vitest` против глобалов), расположение и имена файлов. Второй раннер не добавляйте.
2. **Red — и по правильной причине.** Напишите один падающий тест на одно поведение, запустите *только его* и убедитесь, что падает ожидаемый ассерт, а не `ERR_MODULE_NOT_FOUND`, синтаксическая ошибка, отсутствующий экспорт или ошибка type stripping. Быстрые команды для одного теста:

```bash
node --test --test-name-pattern="rejects empty cart" test/order.test.ts   # или test.only + --test-only; убрать only перед завершением
npx vitest run test/order.test.ts -t "rejects empty cart"                 # 5.1: --last-failed; репортёр agent печатает только падения
npx jest test/order.test.ts -t "rejects empty cart"
```

3. **Green минимальным изменением**, затем рефакторинг на зелёном; потом весь файл, потом весь набор. Не добивайтесь зелёного ослаблением ассерта, добавлением `skip`/`todo`/`expectFailure`/`.fails`, повышением таймаута или числа повторов, снижением порога покрытия, `--test-update-snapshots`/`-u` — если только задача не в этом. В таком случае скажите об этом явно.
4. **Проверяйте поведение на публичной границе**: возвращаемые значения, брошенные ошибки (`assert.rejects(p, { name, message: /…/ })`), сохранённое состояние, исходящий HTTP (MSW, nock или MockAgent, необработанный запрос = ошибка), испущенные события. Не проверяйте приватные вызовы и порядок вызовов, если это не контракт.
5. **Строгие ассерты**: `node:assert/strict` или `t.assert.strictEqual/deepStrictEqual` (обычные `t.assert.equal/deepEqual` нестрогие — проверено локально); в Vitest `toBe`/`toStrictEqual`; конкретная проверка ошибки, а не `assert.ok(err)`.
6. **Детерминизм по построению**: внедрённые часы, случайность и `fetch`; фейковые таймеры только там, где поведение — это планирование; `listen(0)`; данные теста с уникальными ключами; сид faker и fast-check залогирован; никакой реальной сети (`disableNetConnect()`/`onUnhandledRequest: 'error'`); никакой зависимости от порядка файлов (проверьте через `--test-randomize` / `sequence.shuffle`).
7. **Всё асинхронное awaited и ограничено**: `await` у каждого ассерта над промисом; таймаут на тест; `t.signal`/`AbortSignal.timeout()`; серверы, клиенты и контейнеры закрываются в `t.after`/`afterAll` или через `await using`.
8. **Список граничных случаев до кода**: пусто, `null`/`undefined`, границы (0, −1, максимум), unicode и эмодзи, большие входы, дубликаты ключей, конкурентные вызовы, пути ошибок (сбой сети, таймаут, 4xx/5xx, невалидный JSON), отмена. Для парсеров, сериализаторов и чистой логики добавьте одно свойство fast-check.
9. **Исправление бага = сначала регрессионный тест**, воспроизводящий отчёт (падает до исправления), с именем по поведению, а не по номеру задачи.
10. **Финиш**: весь набор зелёный; покрытие изменённого кода, включая ветви (`--experimental-test-coverage` / `vitest --coverage`); линтер (`no-floating-promises`, нет фокусных тестов); `tsc --noEmit` по тестам; для критичной логики по желанию Stryker на изменённых файлах (`npx stryker run --mutate src/pricing.ts`). В отчёте — точные команды и результаты; упомяните всё, что осталось `todo`. Общий цикл с ревью и замерами — в [pipeline.md](pipeline.md).
11. **Тесты читает человек**: одно поведение на тест, AAA, описательное имя (модуль / сценарий / ожидание), маленькие явные фикстуры вместо хитрых помощников, без циклов и условий в теле теста (используйте `test.each` или `for…of`, порождающий отдельные `test()` с разными именами).

```js
// Таблица случаев без цикла в теле: каждый случай — отдельный тест со своим именем
for (const [input, expected] of [['42', 42], [' 7 ', 7], ['0x10', 16]]) {
  test(`parseIntStrict(${JSON.stringify(input)}) returns ${expected}`, () => {
    assert.equal(parseIntStrict(input), expected);
  });
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Canon TDD](https://tidyfirst.substack.com/p/canon-tdd) | Kent Beck, 2023 | Каноничный цикл TDD: список тестов → один тест → пройти → рефакторинг |
| [Test-Driven Development: By Example](https://www.oreilly.com/library/view/test-driven-development/0321146530/) | Kent Beck, 2002 | Классическая книга по TDD [не проверено] |
| [Growing Object-Oriented Software, Guided by Tests](http://www.growing-object-oriented-software.com/) | Freeman & Pryce, 2009 | GOOS: outside-in TDD, моки как инструмент дизайна |
| [Unit Testing Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing) | Vladimir Khorikov, 2020 | Что мокать, устойчивость к рефакторингу |
| [Testing JavaScript Applications](https://www.manning.com/books/testing-javascript-applications) | Lucas da Costa, 2021 | Книга о тестах на JS (эпоха Jest, концепции актуальны) |
| [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices) | Anthropic, 2025 | Агентный цикл: написать тесты, убедиться, что падают, затем реализовать |
| [Testing JavaScript](https://testingjavascript.com/) | Kent C. Dodds | Курс: статический анализ → unit → интеграция → E2E |

Книги по тестированию в общем списке — в [books.md](books.md).

## 24. Рекомендуемая конфигурация

**Ключевые выводы**
- **Проект на `node:test` (Node ≥24.12, стираемый TS).** Скрипты ниже проверены локально на Node 24.17: brace-глобы работают (`test/**/*.test.{js,ts}` нашёл и JS, и TS), `--test-isolation=none` для unit-уровня, пороги покрытия роняют прогон, `--test-randomize` печатает сид, репортёр `junit` пишет XML.

```json
{
  "type": "module",
  "engines": { "node": ">=24.12" },
  "scripts": {
    "test": "node --test --test-timeout=20000 \"test/**/*.test.{js,ts}\"",
    "test:unit": "node --test --test-isolation=none --test-timeout=5000 \"test/unit/**/*.test.{js,ts}\"",
    "test:watch": "node --test --watch \"test/**/*.test.{js,ts}\"",
    "test:cov": "node --test --experimental-test-coverage --test-coverage-include=\"src/**\" --test-coverage-branches=80 --test-coverage-functions=80 --test-coverage-lines=90 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=lcov.info \"test/**/*.test.{js,ts}\"",
    "test:ci": "node --test --test-randomize --test-timeout=20000 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=junit.xml \"test/**/*.test.{js,ts}\""
  }
}
```

- `--experimental-test-module-mocks` добавляйте только в скрипты и файлы, которым нужен `mock.module`. В матрице CI — `--test-shard=${{ matrix.shard }}/N`. Типы тестов проверяйте отдельно (`tsc --noEmit`).
- Если хотите вынести настройки в `node.config.json` (`--experimental-config-file`, на 26.12+ `--config-file`): на Node ≤24.18 и 25.0–25.3 пространство называется `testRunner`, на 24.19+ / 25.4+ / 26.x — `test` (старое имя там даёт ошибку запуска, новое на старых версиях молча игнорируется; [раздел 6](#6-nodetest-запуск-изоляция-шардирование-конфиг)). Для проекта с `engines >=24.12` безопаснее держать `test-isolation` и подобные флаги в `nodeOptions`, которое понимают все эти версии. Проверьте, что настройка применилась.
- **Проект на Vitest 5.1** — проверено локально на 5.1.0: пороги роняют прогон с `ERROR: Coverage for functions (50%) does not meet global threshold (90%)` и кодом выхода 1. Тот же подвох V8, что в разделе 5: файл с невызванной однострочной стрелочной функцией показал **Lines 100 %**, но Functions 50 % и Branches 0 %.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: {
  include: ['test/**/*.test.ts'], environment: 'node',
  restoreMocks: true,            // clearMocks в v5 уже true по умолчанию
  testTimeout: 10_000, sequence: { shuffle: true },
  coverage: { provider: 'v8', include: ['src/**'], thresholds: { branches: 85, functions: 90, lines: 90 } },
}});
```

- **Линтер для тестов**: typescript-eslint `no-floating-promises`, `await-thenable`; `@vitest/eslint-plugin` или `eslint-plugin-jest` (`no-focused-tests`, `no-disabled-tests`, `valid-expect`, `expect-expect`, `no-conditional-expect`, `no-standalone-expect`); `eslint-plugin-playwright` для E2E. Настройка линтера — в [toolchain.md](toolchain.md).
- Воспроизвести порядок из CI: `node --test --test-random-seed=N "test/**/*.test.{js,ts}"` с сидом из строки `Randomized test order seed: N`.

## 25. Спорные места

**Ключевые выводы**
- Большинство споров — о том, что считать «unit», и чем платить за скорость. Современные источники по Node в целом сходятся на тестах поведения с фейками на границах процесса.

| Вопрос | Позиция A | Позиция B | Рекомендация по умолчанию |
|---|---|---|---|
| `node:test` или Vitest для нового бэкенда | `node:test`: ноль зависимостей, нативная семантика модулей (экосистема Fastify/Platformatic, контрибьюторы ядра Node) | Vitest: удобство, моки, UX покрытия | `node:test` для библиотек, CLI и сервисов на стираемом TS; Vitest, если проект уже на Vite или нужны частые моки модулей и Browser Mode. Jest для новых Node-проектов обычно больше не советуют (ESM всё ещё experimental) |
| Изоляция вкл. или выкл. (`--test-isolation=none`, Vitest `isolate: false`) | Около 4× быстрее на маленьких файлах (проверено локально) | Утечки глобального состояния | Unit-уровень без изоляции, интеграционные тесты изолированы |
| Мокист или классицист | GOOS / лондонская школа: моки ведут дизайн | Khorikov, «классический» лагерь Fowler, Goldberg, Kent C. Dodds: реальные коллабораторы и фейки, моки только на границах процесса | Для Node-сервисов в современных рекомендациях преобладает классический подход |
| Пирамида или трофей/соты | Много unit-тестов | В основном интеграция | Для Node API основной слой — компонентные тесты с реальным HTTP-стеком и реальной БД (Goldberg), E2E тонким слоем |
| Пороги покрытия | «Храповик» против регрессий | Закон Гудхарта | Покрытие ветвей и диффа плюс mutation score на критичном коде вместо глобального процента строк |
| Снапшоты | Быстро писать | Риск штамповать обновления | Маленькие и просмотренные; `node:test` отказывается создавать их сам (безопаснее), Jest локально пишет по умолчанию |
| MSW, nock или MockAgent | — | — | Все теперь перехватывают на уровне сети (MSW 3 и nock 15 — на сокетах TCP/TLS через `@mswjs/interceptors`); выбор — стиль API и общие ли обработчики с браузером |
| Повторы в CI | Прагматично против инфраструктурного шума E2E (повторы Playwright) | Нормализует нестабильность | Только с отчётом о flaky и владельцем |
| Testcontainers, docker compose или движок в процессе (PGlite) | Герметичность | Скорость / точность | PGlite новый (0.x) — хорош для быстрых тестов репозитория; держите уровень с контейнером для специфики движка |

## 26. Антипаттерны

**Ключевые выводы**
- Почти все антипаттерны ниже делают тест либо нестабильным, либо слепым: он проходит при сломанном коде.

| Антипаттерн | Чем плохо | Что делать |
|---|---|---|
| Нестрогие ассерты в `node:test`: `t.assert.equal`/`deepEqual` | `1 == '1'` проходит (проверено локально) | `node:assert/strict` или методы `strict*` |
| Не-awaited асинхронные ассерты (`expect(p).rejects.toThrow()` или `assert.rejects` без `await`) | Проходит или падает не там; Vitest 5 теперь роняет тест, Jest может пропустить | `await` у каждого, правило `no-floating-promises` |
| Ожидание через `setTimeout`/sleep | Медленно и нестабильно | Опрос с ограниченным таймаутом или события |
| Мок функций `fetch`/`axios` напрямую (`vi.spyOn(global, 'fetch')`) | Не проверяются заголовки, сериализация, ошибки | Мок на уровне сети: MSW, nock, MockAgent |
| Мок драйвера БД ради unit-теста SQL | Тест повторяет ваши ожидания о SQL | Тест против настоящего движка |
| Избыточные моки (каждый коллаборатор — глубокий мок, тест зеркалит реализацию) | Ломается при рефакторинге, не ловит баги | Классические тесты через публичный API с фейками на границах |
| Общие изменяемые фикстуры, связанность по порядку (`before` сидирует строки, которые меняют следующие тесты) | Падения зависят от порядка | Данные на тест |
| Гигантские снапшоты, обновляемые вслепую через `-u`/`--test-update-snapshots` | Регрессия становится эталоном | Маленькие точечные снапшоты или явные ассерты |
| Накрутка покрытия: тесты исполняют код без ассертов | Процент растёт, защиты нет | Мутационное тестирование, пороги по ветвям, ревью |
| Постоянные `--forceExit` / `--test-force-exit` / `--detectOpenHandles` | Утечка handle скрыта | Найти и закрыть утекающий handle |
| Тест приватных функций через `rewire` или экспорт «для тестов» | Тест привязан к реализации | Тестировать через публичное поведение или выделить модуль со своим публичным API |
| Один гигантский интеграционный тест на эндпоинт с 20 ассертами | Первое падение скрывает остальные | Несколько точечных тестов с общим билдером |
| Повторы и повышенные таймауты как «исправление» | Нестабильность становится нормой | Карантин с владельцем, исправление причины |
| Устаревшие инструменты [устарело]: `proxyquire`, `mockdate`, `timekeeper`, `uvu`, тестовые сетапы на `ts-node` (см. [toolchain.md](toolchain.md)), legacy-таймеры Jest, файл `workspace` и `coverage.all` в Vitest (удалены в v4) | Не поддерживаются или удалены | DI, `mock.module`/`vi.mock`, фейковые таймеры раннера, `node:test`, type stripping, Vitest `projects` и `coverage.include` |

## 27. Чеклист ревью тестов

1. **Раннер и соглашения**: используется раннер проекта и его стиль; нет нового фреймворка или библиотеки ассертов без причины.
2. **Имя и форма**: каждый тест проверяет одно поведение через публичный интерфейс; имя называет модуль, сценарий и ожидаемый результат; Arrange / Act / Assert видны; в теле нет `if`, циклов и `try/catch`, которые решают, что проверять (вместо них `test.each` или сгенерированные тесты).
3. **Строгие и конкретные ассерты**: `node:assert/strict` или `t.assert.strict*` (не нестрогие `t.assert.equal/deepEqual`); точные значения или проверка схемы, а не истинность; ошибки проверяются по типу и сообщению или коду (`assert.rejects(p, { code: 'E_EMPTY_CART' })`); `expect(x).toBeDefined()` не единственный ассерт.
4. **Тест на исправленный баг** сначала падал на старом коде, и падал на ассерте.
5. **Асинхронность**: каждый ассерт над промисом awaited (`await assert.rejects`, `await expect(...).rejects`); нет смеси `done` и промисов; нет фиксированных пауз — `t.waitFor`/`vi.waitFor`/`expect.poll`; таймаут на тест задан; `t.signal`/`AbortSignal.timeout` передан в долгие операции.
6. **Фейковые таймеры**: включены только нужные `apis` (без `setImmediate`, если его используют драйверы и потоки); в `node:test` после `tick()` есть сброс очереди микрозадач; код не делает деструктурированный импорт из `node:timers/promises` в расчёте на мок `node:test`.
7. **Изоляция**: нет зависимости от порядка; набор проходит с `--test-randomize`/`sequence.shuffle` и без изоляции там, где уровень так запускается; нет записей в `globalThis`, `process.env` (или они откатываются через `vi.stubEnv`/`t.after`), `process.chdir`, общих файлов вне `os.tmpdir()`/`fs.mkdtemp`.
8. **Двойники**: мокаются только свои границы (HTTP, часы, адаптеры репозиториев); для коллабораторов с состоянием — фейки; моки откатываются (`t.mock`, `restoreMocks`, `using`); `mock.module`/`vi.mock` обоснован (внедрить нельзя); тестируемый модуль не замокан; проверки вызовов смотрят на аргументы, а не только на «был вызван».
9. **Сеть**: нет реальных исходящих вызовов — MSW `onUnhandledRequest: 'error'`, `nock.disableNetConnect()` или `MockAgent.disableNetConnect()`; где важно, проверено, что перехватчики использованы (`scope.done()`, `assertNoPendingInterceptors()`).
10. **Время и случайность**: часы внедрены или подменены с явным `now`; код, зависящий от часового пояса, проверен с явным `TZ` или смещениями; случайные данные сидированы, сид выводится.
11. **Ресурсы освобождаются**: серверы на `listen(0)` и закрываются, соединения с БД и контейнеры закрываются в `after`/`afterAll`/`await using`; набор завершается без `--test-force-exit`/`--forceExit`.
12. **Граничные случаи и ошибки**: пусто, границы, невалидный вход, сбой каждой зависимости (таймаут, 5xx, невалидный JSON), отмена; свойство fast-check для парсеров, сериализаторов и чистой логики.
13. **Подходящий уровень**: HTTP-обработчики тестируются через `inject`/`supertest`/`app.request` с настоящей маршрутизацией и валидацией; SQL репозитория — против настоящего движка (контейнер или PGlite), а не мока драйвера.
14. **Снапшоты**: маленькие и просмотренные; обновлённые снапшоты в диффе намеренные; изменчивые данные (даты, id) не снимаются без сериализаторов или матчеров.
15. **Сигналы не заглушены**: нет новых `skip`/`todo`/`only`/`.fails`/`expectFailure` без причины и ссылки на задачу; не ослаблены пороги, не увеличены повторы или таймауты в роли «исправления»; нет `eslint-disable` в тестах без комментария.
16. **Покрытие и сила**: изменённые строки и **ветви** покрыты; порог стоит на ветвях и функциях, а не только на строках (строки V8 оптимистичны); для критичной логики по желанию Stryker, выжившие мутанты разобраны.
17. **Конфигурация**: таймаут раннера задан (`--test-timeout`, `testTimeout`); в Vitest задан `coverage.include`; при `node.config.json` пространство имён соответствует версии Node (`testRunner` до 24.18 / 25.3, `test` с 24.19 / 25.4 и в 26.x) или флаги вынесены в `nodeOptions`, и проверено, что настройка применилась.
18. **Скорость**: unit-тесты много быстрее 100 мс каждый; медленные тесты — в отдельном уровне или с тегом; нет запуска контейнера на каждый тест там, где хватает одного на прогон.
19. **Типы**: тесты проходят проверку типов (`tsc --noEmit`); нет `as any`, скрывающего несоответствие, которое на деле является багом.
20. **Отчёт**: в описании PR указаны точная команда прогона и её результат.
