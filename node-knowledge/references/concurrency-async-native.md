# Конкурентность, async, параллелизм и нативный код в Node.js

Справочник для выбора между async-кодом на главном потоке, пулом потоков libuv, `worker_threads`, дочерними процессами и нативным кодом, для поиска блокировок event loop и для безопасной работы с Node-API, napi-rs, WebAssembly и FFI. Внутри: фазы event loop и порядок очередей (включая разницу CJS и ESM), обнаружение блокировок, пул потоков libuv, worker threads и пулы (Piscina, Tinypool), передача против копирования, `SharedArrayBuffer` и `Atomics`, `child_process`, `cluster` и `reusePort`, streams и backpressure, `AsyncLocalStorage`, ограничение конкурентности и отмена, нативные расширения, FFI, Wasm. Актуально на ноябрь 2026: Node 26 — Active LTS с 28 октября 2026 (26.13.0), Node 24 — Maintenance LTS (24.22.2), Node 22 — maintenance (22.23.4), Node 20 — EOL; libuv 1.52.1, V8 14.6 в Node 26 и 13.6 в Node 24, Node-API 10. Соседние темы: внутренности V8, профилировщики и бенчмарки — [performance.md](performance.md); серверные фреймворки, PM2, базы и брокеры — [domains-server.md](domains-server.md); промис-комбинаторы, `events.on` и обработка ошибок — [idioms-patterns.md](idioms-patterns.md); graceful shutdown и очереди задач — [architecture.md](architecture.md); supply chain и `--ignore-scripts` — [toolchain.md](toolchain.md).

- [Версии и статус (ноябрь 2026)](#версии-и-статус-ноябрь-2026)
- [Выбор инструмента по нагрузке](#выбор-инструмента-по-нагрузке)
- [Event loop: фазы и порядок](#event-loop-фазы-и-порядок)
- [Блокировка event loop и её обнаружение](#блокировка-event-loop-и-её-обнаружение)
- [Пул потоков libuv](#пул-потоков-libuv)
- [worker_threads](#worker_threads)
- [Пулы воркеров: Piscina, Tinypool, workerpool, poolifier](#пулы-воркеров-piscina-tinypool-workerpool-poolifier)
- [Передача против копирования](#передача-против-копирования)
- [Общая память: SharedArrayBuffer и Atomics](#общая-память-sharedarraybuffer-и-atomics)
- [child_process](#child_process)
- [cluster, процесс на ядро и контейнеры](#cluster-процесс-на-ядро-и-контейнеры)
- [Streams и backpressure](#streams-и-backpressure)
- [AsyncLocalStorage и асинхронный контекст](#asynclocalstorage-и-асинхронный-контекст)
- [Ограничение конкурентности и отмена](#ограничение-конкурентности-и-отмена)
- [Нативные расширения и FFI](#нативные-расширения-и-ffi)
- [WebAssembly и WASI](#webassembly-и-wasi)
- [Когда уходить в натив](#когда-уходить-в-натив)
- [Статьи, доклады и справочники](#статьи-доклады-и-справочники)
- [Локальный замер](#локальный-замер)
- [Антипаттерны](#антипаттерны)
- [Чеклист ревью](#чеклист-ревью)
- [Спорные места](#спорные-места)

## Версии и статус (ноябрь 2026)

| Компонент | Что важно для конкурентности |
|---|---|
| Линии Node | 26 «Lithium» — LTS (26.0.0 вышел 2026-05-05, 26.13.0 от 2026-10-28 несёт кодовое имя LTS). 24 «Krypton» — 24.22.2 (2026-10-27). 22 «Jod» — maintenance, 22.23.4 (2026-10-20). 20 «Iron» — EOL, последний 20.20.2 (2026-03-24). 25 — последний 25.9.0 (2026-03-31), не поддерживается. 27.0.0-alpha.0 вышел 2026-10-29: первый релиз в новой фазе Alpha. Даты LTS — в [toolchain.md](toolchain.md) |
| Новый график релизов | С Node 27 — один мажор в год, каждый становится LTS: Alpha октябрь–март, Current апрель–октябрь, затем 30 месяцев LTS (всего 36). 27.0.0 выйдет в 2027 [не проверено] |
| libuv | 1.52.1 в Node 26.12.0 и 24.22.0 (и в 24.17.0); 1.51.0 в 22.23.x |
| V8 | 14.6 в Node 26 (Chromium 146; `Map.prototype.getOrInsert`, `Iterator.concat`), 13.6 в Node 24 |
| Node-API | `process.versions.napi` = 10 в 24.17.0 и 26.12.0. С версии 9 API не строго аддитивен: без явного `NAPI_VERSION` аддон получает семантику v8 |
| `NODE_MODULE_VERSION` | 147 в Node 26 (ABI для аддонов не на Node-API; 146 зарезервирован за Electron 42) |
| Порядок таймеров | С libuv 1.45 (Node 20) таймеры выполняются **после** фазы poll в каждой итерации (и один раз до старта цикла) |
| `AsyncLocalStorage` | С Node 24.0.0 по умолчанию работает на `AsyncContextFrame`; `--no-async-context-frame` возвращает старую реализацию на async_hooks. `bind()`/`snapshot()` стабильны с 23.11/22.15. `withScope()`/`RunScope` (для `using`) — экспериментально с 25.9.0 |
| `async_hooks` | `createHook`, `AsyncHook`, `executionAsyncResource`: Stability 1, «Please migrate away from this API». Кода DEP для `createHook` пока нет |
| `worker_threads` | `worker.getHeapStatistics()` 24.0; `worker[Symbol.asyncDispose]` 24.2; `worker_threads.locks` (Web Locks, экспериментально) 24.5; `threadName`/`worker.cpuUsage()` 24.6; `worker.startCpuProfile()` 24.8; `worker.startHeapProfile()` 24.9; `postMessageToThread` 22.5 (Stability 1.1); `markAsUncloneable` 22.10; `isInternalThread` 22.14. Колбэк-форма `worker.terminate()` — End-of-Life в 25.0 (DEP0132) |
| `perf_hooks` | Псевдоним `perf_hooks.eventLoopUtilization()` 24.12/25.2. `monitorEventLoopDelay({ samplePerIteration })` 26.5; опции `lowest`/`highest`/`figures` 26.11 |
| Streams | `highWaterMark` байтовых потоков по умолчанию 64 KiB (16 KiB на Windows) с 22.0; objectMode — 16. `Readable.fromWeb/toWeb` стабильны в 24.0/22.17; `toWeb({ type: 'bytes' })` 25.4/24.14. `stream.duplexPair()` 22.6. Node 26: модули `_stream_*` удалены (DEP0193), Readable читает по одному буферу, ALS на `finished` сохраняется только при необходимости |
| `child_process` | DEP0190 (массив аргументов + `shell: true` без экранирования): runtime-предупреждение с 24.0. DEP0196 (`shell: ''`): только в документации, 24.2/22.17 |
| Wasm | ESM-импорт `.wasm` без `--experimental-wasm-modules` с 24.5/22.19; `import source` (source phase imports) с 24.0. `node:wasi` — Stability 1 и прямо **не песочница** |
| `node:ffi` | Добавлен в 26.1.0 (2026-05) **за флагом `--experimental-ffi`**, Stability 1. Включён по умолчанию с **26.9.0** (2026-09-16, PR #65475 «ffi: enable module by default»); с тех пор есть отключающий `--no-experimental-ffi`, а `--allow-ffi` нужен под Permission Model. Проверено локально: в 26.12.0 и 26.13.0 `import('node:ffi')` работает без флага (с ExperimentalWarning). В Node 24 модуля нет |
| ESM-импорт аддонов | `--experimental-addon-modules` (импорт `.node`) добавлен в 23.6/22.20, включён по умолчанию в 26.5.0 |
| Permission Model | `--allow-worker`, `--allow-child-process` (20.0), `--allow-addons` (21.6/20.12), `--allow-wasi` (22.3/20.16), `--allow-ffi` (26.1) |

Версии пакетов на 6 ноября 2026: piscina 5.3.2, tinypool 2.2.0, workerpool 10.0.3, poolifier 6.1.0, p-limit 7.3.3, p-queue 10.0.0, p-map 7.1.1, async-sema 3.1.1, @fastify/under-pressure 9.2.1, undici 8.12.4, node-addon-api 8.9.2, @napi-rs/cli 3.10.12 (crate `napi` 3.16.1, `napi-derive` 3.7.0), node-gyp 13.1.0, cmake-js 8.0.0, @neon-rs/cli 0.2.6 (crate `neon` 1.1.2), koffi 3.3.7, @bytecodealliance/jco 1.41.0, zx 8.8.5. Версии Node, libuv и V8 по линиям — в [Node.js dist index](https://nodejs.org/dist/index.json).

Устаревшие и заброшенные пакеты: prebuildify 6.0.1 (2024, не обновляется больше 18 месяцев, но широко используется), node-gyp-build 4.8.4 (2024), comlink 4.4.2 (2024), bottleneck 2.19.5 (2023, заброшен), threads.js 1.7.0 (2022, заброшен), blocked-at 1.2.0 (2019) [устарело] — замена `monitorEventLoopDelay`, ffi-napi 4.0.3 (2022) [устарело] — замена koffi или `node:ffi`, `ffi`/`node-ffi` [устарело], npm-пакет `napi-rs` [устарело] — замена `@napi-rs/cli`, neon-cli 0.10.1 [устарело] — замена `@neon-rs/cli`.

## Выбор инструмента по нагрузке

| Нагрузка | Выбор по умолчанию (Node 24/26) | Альтернативы и замечания |
|---|---|---|
| I/O (HTTP-вызовы, запросы к БД, сокеты, много соединений) | Обычный async/await на главном потоке; fan-out ограничен p-limit/p-queue под размер пула соединений; `AbortSignal.timeout` на каждом вызове | Потоки не добавлять: I/O уже идёт конкурентно. Масштабировать процессами или репликами, когда ELU подходит к ~0,7–0,8 |
| Тяжёлые fs / DNS / zlib / crypto | Async-API (пул libuv) + `UV_THREADPOOL_SIZE` из окружения (например, 8–16) | Кэш DNS; streams вместо `readFile`; массовые crypto/zlib — в пул Piscina, чтобы не душить fs и dns |
| CPU-код на JS (парсинг, обработка изображений, шаблоны, хэширование на JS) | Piscina (или Tinypool) с `maxQueue` + 503, `AbortSignal` на задачу, `idleTimeout` | Нарезка с `scheduler.yield()`, если работа мелкая и редкая; готовый нативный или Wasm-пакет, если есть |
| Блокирующий нативный вызов (синхронная C-библиотека, старый синхронный SDK) | Вызывать в worker thread или дочернем процессе, чтобы цикл оставался свободным | Переписать на async work Node-API / napi-rs `AsyncTask` (пул libuv) или на свои потоки + thread-safe function |
| Нативный или JS-код, который может упасть или которому нельзя доверять | Дочерний процесс (`fork`/`spawn`) с таймаутами и перезапуском; флаги Permission Model | Контейнеры для настоящей изоляции; никогда не workers, `vm` или `node:wasi` как песочница |
| Много мелких CPU-задач (микросекунды каждая) | Собирать в пакеты (не меньше нескольких мс работы на задачу) и отправлять в пул | Выполнять на месте, если суммарно мало; кольцевой буфер на SAB + Atomics — только для очень горячих путей |
| Потоковые данные (файлы, тела HTTP, ETL) | `pipeline()` из `node:stream/promises` со стадиями на async-генераторах; уважать `highWaterMark` | `readable.map(fn, { concurrency })`; Web Streams конвертировать на границе через `Readable.fromWeb` |
| Большие данные, общие для потоков | Передавать `ArrayBuffer` (transferList / `Piscina.move`) | `SharedArrayBuffer` + Atomics или Web Locks для конкурентного доступа |
| Многоядерный HTTP-сервер | Один процесс на контейнер, масштабирование репликами; либо воркеры/процессы с `reusePort: true` под супервизором | `cluster` (round-robin через primary) — только если нельзя положиться на оркестратор; Platformatic Watt для нескольких сервисов в процессе |
| Передача контекста запроса | `AsyncLocalStorage.run()` (AsyncContextFrame) | `AsyncResource.bind`/`AsyncLocalStorage.snapshot()` в своих пулах; не `async_hooks` |
| Внешний API с лимитом запросов | p-queue с `intervalCap`/`interval` (один процесс) | Лимитер на Redis для нескольких инстансов |
| Горячее числовое ядро, нужна переносимость | Wasm (Rust/C через wasm-bindgen/Emscripten) | napi-rs с пакетом-фолбэком на Wasm |
| Горячее ядро, максимальная скорость, многопоточность | Rust через napi-rs (потоки rayon/tokio, TSFN для колбэков) | C++ через node-addon-api; Neon |
| Вызов существующей системной или вендорской `.so`/`.dll` | koffi (Node ≥ 16) или `node:ffi` (Node 26+, экспериментально) | Тонкая обёртка на napi-rs/node-addon-api, если это библиотека для других |

Сначала измерить, потом выбирать: ELU и задержка цикла — в разделе [Блокировка event loop и её обнаружение](#блокировка-event-loop-и-её-обнаружение), профилирование и бенчмарки — в [performance.md](performance.md), скрипт сравнения бенчмарков — `../scripts/bench_compare.mjs`.

## Event loop: фазы и порядок

**Ключевые выводы**
- Один JS-поток на изолят: главный поток или каждый Worker. Циклом управляет libuv. Фазы по порядку: **timers → pending callbacks → idle/prepare → poll → check (`setImmediate`) → close callbacks**. С libuv 1.45 (Node 20) таймеры выполняются после poll в каждой итерации и один раз до старта цикла. Старые схемы «timers первыми» неточны для связки `setImmediate`/таймеры.
- Между любыми двумя макрозадачами Node опустошает две очереди: сначала очередь `process.nextTick`, затем очередь микрозадач V8 (реакции промисов, `queueMicrotask`), и повторяет, пока обе не пусты. Обе могут задушить I/O: рекурсивный `nextTick` или бесконечная цепочка промисов не дают циклу дойти до poll.
- **ESM меняет порядок `nextTick` и промисов в коде верхнего уровня.** Тело ES-модуля само выполняется внутри микрозадачи (вычисление модуля идёт через промисы), поэтому микрозадачи с верхнего уровня выполняются раньше очереди `nextTick`. Проверено локально на Node 24.17 (Windows 11), один и тот же скрипт:
  - CJS: `sync > nextTick > promise > microtask > timeout > immediate`
  - ESM: `sync > promise > microtask > nextTick > timeout > immediate`
  - Внутри I/O-колбэка в обоих: `nextTick > promise > immediate > timeout`.

```js
// order.cjs и order.mjs — один и тот же код
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
queueMicrotask(() => console.log('microtask'));
console.log('sync');
// CJS: sync nextTick promise microtask, затем timeout/immediate
// ESM: sync promise microtask nextTick, затем timeout/immediate
```

- `setTimeout(fn, 0)` против `setImmediate(fn)` из главного модуля — **недетерминированно**: зависит от того, прошла ли 1 мс до первой проверки таймеров. Локально из 40 запусков 33 раза первым был `immediate`, 7 раз `timeout`. Внутри I/O-колбэка `setImmediate` всегда раньше:

```js
import { readFile } from 'node:fs';
readFile(import.meta.filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));   // всегда первым
});
```

- Официальный гайд советует `setImmediate()` вместо `process.nextTick()` «во всех случаях, потому что о нём проще рассуждать». `nextTick` оставить для одного случая: сделать API последовательно асинхронным (выдать ошибку после того, как вызывающий успел подписаться на события).
- `timers/promises`: `setTimeout`, `setImmediate`, `setInterval` как async-итератор, `scheduler.wait(ms)` и `scheduler.yield()` (черновик Scheduling APIs; `yield()` равен промису `setImmediate()`). Все принимают `{ signal }` для отмены. Для нарезки длинных циклов — `await scheduler.yield()` или `await setImmediate()`.
- `timeout.unref()` позволяет процессу завершиться при висящем таймере. `timeout.refresh()` перезапускает таймер без новой аллокации; это замена удалённым `timers.active()`/`_unrefActive()` (End-of-Life в Node 24, DEP0126/DEP0127).
- Необработанные отклонения промисов: с Node 15 по умолчанию `--unhandled-rejections=throw` (процесс падает). Оставить так в продакшене; `process.on('unhandledRejection')` — только для логирования и последующего выхода.
- Node 26 оптимизировал внутреннюю обработку `asyncHandledRejections` через `FixedQueue`; на код это не влияет.
- Код не должен зависеть ни от порядка `setTimeout(0)`/`setImmediate` в главном модуле, ни от порядка `nextTick`/промисов, который в CJS и ESM разный.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) | Node.js project (обновлено под libuv 1.45) | Канонические фазы, `setImmediate` против `setTimeout`, зачем `nextTick` |
| [Understanding process.nextTick()](https://nodejs.org/en/learn/asynchronous-work/understanding-processnexttick) | Node.js project | Семантика `nextTick` |
| [Understanding setImmediate()](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate) | Node.js project | `setImmediate` против `nextTick` и микрозадач |
| [Timers](https://nodejs.org/api/timers.html) | Node.js docs | `timers/promises`, `scheduler.yield`, `refresh`, `unref` |
| [process.nextTick()](https://nodejs.org/api/process.html#processnexttickcallback-args) | Node.js docs | Когда `nextTick`, а когда `queueMicrotask` |
| [libuv design overview](https://docs.libuv.org/en/v1.x/design.html) | libuv | Схема итерации цикла, пул потоков, handles и requests |
| [uv_loop_t](https://docs.libuv.org/en/v1.x/loop.html) | libuv | Режимы `uv_run`, устройство цикла |

## Блокировка event loop и её обнаружение

**Ключевые выводы**
- Node быстр, «когда работа, связанная с каждым клиентом в данный момент, мала». Каждый синхронный шаг блокирует всех остальных клиентов: код между двумя `await`, `JSON.parse` большого тела, катастрофический regex.
- Опасности из официального гайда: ReDoS (вложенные квантификаторы `(a+)*`, пересекающиеся альтернативы `(a|a)*`, обратные ссылки), JSON DoS (в их примере `JSON.stringify` 50 МБ — 0,7 с, `JSON.parse` — 1,3 с), синхронные API на сервере (`*Sync` в fs, crypto, zlib, child_process).
- Два способа исправить. **Нарезка** (partition): разбить работу и уступать цикл через `setImmediate`/`scheduler.yield()` — для простых задач. **Вынос** (offload): worker threads, дочерние процессы, нативный аддон на пуле libuv — для сложных. Цитата гайда: «If your server relies heavily on complex calculations, you should think about whether Node.js is really a good fit».
- Голод микрозадач — тонкая форма блокировки: цикл из `await`, которые разрешаются сразу, никогда не доходит до poll, и health check отваливается по таймауту. Gokhman (Snyk, 2019): уступка через `setImmediate` медленнее чистого async-цикла примерно на 34%, но сервер остаётся отзывчивым. Уступать по прошедшему времени (например, раз в 10 мс), чтобы срезать накладные. `setTimeout(0)` округляется до 1 мс, и цикл с ним ползёт.

```js
import { scheduler } from 'node:timers/promises';

// Нарезка по бюджету времени: уступаем цикл раз в ~10 мс, а не на каждой итерации
export async function processAll(items, handle, budgetMs = 10) {
  let start = performance.now();
  for (const item of items) {
    handle(item);
    if (performance.now() - start > budgetMs) {
      await scheduler.yield();          // эквивалент await setImmediate()
      start = performance.now();
    }
  }
}
```

- **Измерять, а не гадать**:
  - `perf_hooks.monitorEventLoopDelay({ resolution })` — гистограмма в наносекундах (`percentile(99)`, `max`). В Node 26.5 добавлен `samplePerIteration: true`: замер через хуки prepare/check, цикл не удерживается.
  - `performance.eventLoopUtilization()` (ELU) = active / (active + idle). Лучше CPU% для автоскейлинга и сброса нагрузки; есть для каждого воркера (`worker.performance.eventLoopUtilization()`, вызывается из родителя).
  - `--trace-sync-io` печатает стек для синхронного I/O после первого оборота цикла.
  - CPU-профиль (`--cpu-prof`, DevTools) показывает блокирующий кадр (подробно — в [performance.md](performance.md)).
  - Сброс нагрузки: `@fastify/under-pressure` 9.2.1 отвечает 503 при превышении `maxEventLoopDelay`, `maxEventLoopUtilization`, порогов кучи или RSS [не проверено].

```js
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

const delay = monitorEventLoopDelay({ resolution: 20 });
delay.enable();
let prev = performance.eventLoopUtilization();

setInterval(() => {
  const elu = performance.eventLoopUtilization(prev);   // разница с прошлым замером
  prev = performance.eventLoopUtilization();
  metrics.gauge('event_loop_delay_p99_ms', delay.percentile(99) / 1e6);
  metrics.gauge('event_loop_utilization', elu.utilization);
  delay.reset();
}, 10_000).unref();
```

```bash
node --trace-sync-io server.js          # стеки синхронного I/O
node --cpu-prof --cpu-prof-dir=prof app.js
```

- ELU лучше CPU% как сигнал масштабирования (Trevor Norris, NodeSource, 2020): сервер с worker threads доходил до ~250% CPU, а ELU главного потока оставался ниже 50%; автоскейлинг по CPU сработал бы примерно на трети реальной мощности. Синхронная запись на сетевой диск давала ELU сильно выше CPU. Следить за ELU каждого потока.
- Проверено локально на Node 24.17 (Windows 11): синтетическая занятость внутри интервала 100 мс, 2 с. Блок 0 мс → ELU 0,01, p99 задержки 23,7 мс; блок 20 мс → ELU 0,19, p99 38,3 мс; блок 80 мс → ELU 0,72, p99 96,9 мс. Пол p50 около 15,6 мс — это гранулярность таймера Windows, а не реальная задержка: на Windows сравнивать приращения, а не абсолютные значения.
- `blocked-at` (на async_hooks, 2019) [устарело] — замена: `monitorEventLoopDelay` плюс CPU-профиль или `--cpu-prof` на воспроизводящем примере.
- clinic.js (`clinic doctor`/`bubbleprof`) фактически не сопровождается; актуальные профилировщики — в [performance.md](performance.md).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop) | Node.js project | Нарезка против выноса, ReDoS, JSON DoS, размер пула, угол безопасности |
| [Performance measurement APIs](https://nodejs.org/api/perf_hooks.html) | Node.js docs | `monitorEventLoopDelay`, `eventLoopUtilization`, гистограммы |
| [--trace-sync-io](https://nodejs.org/api/cli.html#--trace-sync-io) | Node.js docs | Трассировка синхронного I/O |
| [How even quick async functions can block the event loop](https://snyk.io/blog/nodejs-how-even-quick-async-functions-can-block-the-event-loop-starve-io/) | Michael Gokhman (Snyk), 2019 | Голод микрозадач, уступка через `setImmediate`, цифры |
| [Event Loop Utilization with Node.js](https://nodesource.com/blog/event-loop-utilization-nodejs) | Trevor Norris (NodeSource), 2020 | Определение ELU, почему ELU лучше CPU для масштабирования |
| [under-pressure](https://github.com/fastify/under-pressure) | Fastify team | Сброс нагрузки по состоянию event loop |
| [blocked-at](https://www.npmjs.com/package/blocked-at) | Mariusz Nowak и др. | Захват стека блокирующих операций [устарело]: замена `monitorEventLoopDelay` [не проверено] |
| [clinic.js](https://clinicjs.org/) | NearForm | Doctor/Bubbleprof; не сопровождается, историческое |

## Пул потоков libuv

**Ключевые выводы**
- Пул потоков libuv — по умолчанию **4** потока, размер задаётся `UV_THREADPOOL_SIZE` до старта; libuv ограничивает его 1024 [не проверено]. Пул обслуживает все async-API без асинхронного аналога в ОС: **все API `fs`**, кроме watchers и `*Sync`; **async crypto** (`pbkdf2`, `scrypt`, `randomBytes`, `randomFill`, `generateKeyPair`); **`dns.lookup()`**, а значит и разрешение имён по умолчанию в `http.get`/`net.connect`; **весь async `zlib`**; любые аддоны с `napi_create_async_work`.
- Сетевые сокеты пул **не** используют (epoll/kqueue/IOCP). `dns.resolve*()` работает через c-ares на потоке цикла, не в пуле [не проверено].
- Пул общий, поэтому один медленный класс работы душит другой: медленное чтение с NFS или хэширование паролей через `scrypt` задерживают `dns.lookup`, и растёт задержка исходящих HTTP-запросов. Классический симптом: задержка исходящего HTTP растёт вместе с трафиком логинов.
- Присваивать `process.env.UV_THREADPOOL_SIZE` изнутри программы — «не гарантированно работает»: пул создаётся при инициализации рантайма. Задавать в окружении или в спецификации контейнера:

```bash
UV_THREADPOOL_SIZE=16 node server.js
# Dockerfile: ENV UV_THREADPOOL_SIZE=16
# systemd:    Environment=UV_THREADPOOL_SIZE=16
```

- Проверено локально на Node 24.17 (Windows 11): 8 параллельных `crypto.pbkdf2(…, 300000, 64, 'sha512')` и один `fs.readFile`. Последний хэш медленнее первого: пул 2 → 4,1x, 4 (по умолчанию) → 2,3x, 8 → 1,5x, 16 → 1,3x. `readFile` завершился: при 2 — только после всех хэшей (~1,07 с), при 4 — ~590 мс, при 8 — ~260 мс (всё ещё в очереди за первой волной), при 16 — ~26 мс (примерно в 20 раз раньше, чем с размером по умолчанию).

- Размер: начинать с числа одновременных блокирующих операций (fs + dns + crypto + zlib), ограничивая числом ядер для CPU-тяжёлых crypto/zlib. Слишком большой пул стоит памяти (стеки потоков) и переключений контекста; CPU-работу быстрее числа ядер он не сделает.
- Кроме изменения размера: кэшировать DNS (DNS-интерсептор undici, `cacheable-lookup`), использовать `dns.resolve` для горячих хостов, массовые crypto/zlib вынести в пул воркеров со своими потоками, большие файлы читать потоком, а не `readFile` (каждый `readFile` — несколько задач пула; гайд советует нарезать большие чтения).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [UV_THREADPOOL_SIZE](https://nodejs.org/api/cli.html#uv_threadpool_sizesize) | Node.js docs | Официальный список пользователей пула; оговорка про переменную окружения |
| [Thread pool work scheduling](https://docs.libuv.org/en/v1.x/threadpool.html) | libuv | Пределы размера пула, `uv_queue_work` |
| [DNS: implementation considerations](https://nodejs.org/api/dns.html#implementation-considerations) | Node.js docs | `lookup` (пул, getaddrinfo) против `resolve` (c-ares) |
| [cacheable-lookup](https://github.com/szmarczak/cacheable-lookup) | Szymon Marczak | Кэш DNS для `http.Agent` в обход пула |

## worker_threads

**Ключевые выводы**
- Каждый `Worker` — отдельный изолят V8 и свой цикл libuv в том же процессе: настоящий параллелизм для CPU-кода на JS. Старт не бесплатный. Проверено локально на Node 24.17 (Windows 11): от создания до первого сообщения ~28–30 мс (медиана 10 запусков) и ~10,7 MiB RSS на простаивающий воркер, ещё до загрузки модулей приложения (каждый воркер заново вычисляет свой граф модулей). **Всегда пул**, никогда не воркер на запрос.
- Связь: `postMessage` использует **structured clone**. Теряются прототипы, идентичность классов, приватные поля, функции и неперечисляемые свойства; `Buffer` приходит как `Uint8Array`; `URL` бросает `DataCloneError`. `markAsUncloneable(obj)` (22.10) заставляет случайную отправку падать сразу. Подробности — в разделе [Передача против копирования](#передача-против-копирования).
- `SharedArrayBuffer` разделяется (никогда не попадает в `transferList`); согласование — через `Atomics` (раздел [Общая память](#общая-память-sharedarraybuffer-и-atomics)).
- Каналы: `MessageChannel` (точка-точка; порт передаётся через `transferList`, чтобы соединить два воркера напрямую), `BroadcastChannel` (все потоки, стабилен с 18), `postMessageToThread(threadId, …)` (22.5, Stability 1.1), `receiveMessageOnPort` для синхронного опроса, `setEnvironmentData`/`getEnvironmentData` для read-only конфигурации.
- Жизненный цикл: `worker.terminate()` возвращает Promise (колбэк-форма — End-of-Life в 25, DEP0132); `await using w = new Worker(...)` освобождает воркер через `Symbol.asyncDispose` (24.2). `worker.unref()` позволяет процессу завершиться. Всегда слушать `'error'` и `'exit'`: ненулевой код выхода — это падение, воркер в пуле надо пересоздать (но `terminate()`, в том числе из `Symbol.asyncDispose`, тоже даёт код 1 — проверено локально).
- Лимиты: `resourceLimits: { maxOldGenerationSizeMb, maxYoungGenerationSizeMb, codeRangeSizeMb, stackSizeMb }`. Нехватка кучи убивает только воркер (`ERR_WORKER_OUT_OF_MEMORY` [не проверено]) — удобно для изоляции рискованного парсинга.
- Наблюдаемость на воркер (24.x): `worker.performance.eventLoopUtilization()`, `getHeapSnapshot()`, `getHeapStatistics()` (24.0), `cpuUsage()` (24.6), `startCpuProfile()` (24.8), `startHeapProfile()` (24.9); `threadName` (24.6) виден в диагностике.
- Явный `execArgv` заменяет унаследованные флаги, **включая разрешения Permission Model**. Под `--permission` создание воркеров требует `--allow-worker`.
- Web Locks: `import { locks } from 'node:worker_threads'` (24.5, экспериментально) с семантикой браузерного `LockManager`: `request(name, { mode: 'shared' | 'exclusive', ifAvailable, steal, signal }, cb)`. Межпоточный мьютекс без ручных Atomics.
- Воркер — не граница безопасности: воркеры делят процесс, файловые дескрипторы и разрешения. Для недоверенного кода — отдельные процессы или контейнеры.
- Доклад Matteo Collina «Node.js: More Threads Than You Think» (2025): Node многопоточен с 2018 года; Piscina для выноса CPU-работы; MessagePort/BroadcastChannel; сброс нагрузки по очереди задач ради хвостовой задержки; транспорты pino работают в воркере; серверы приложений запускают несколько сервисов как потоки одного процесса [не проверено].

```js
// main.mjs
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';

await using worker = new Worker(new URL('./worker.mjs', import.meta.url), {
  resourceLimits: { maxOldGenerationSizeMb: 256 },
});
worker.on('error', (err) => log.error({ err }, 'worker failed'));
worker.on('exit', (code) => { if (code !== 0) log.warn({ code }, 'worker exited'); });   // terminate() тоже даёт 1
worker.postMessage({ cmd: 'parse', path: './input.json' });
const [reply] = await once(worker, 'message');   // без ожидания конец области сразу завершит воркер

// worker.mjs
import { parentPort } from 'node:worker_threads';
parentPort.on('message', ({ cmd, path }) => {
  parentPort.postMessage({ ok: true, cmd, path });
});
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Worker threads](https://nodejs.org/api/worker_threads.html) | Node.js docs (v26) | Полный API, правила передачи, история версий, locks |
| [Safe passing of structured data](https://html.spec.whatwg.org/multipage/structured-data.html) | WHATWG | Алгоритм structured clone |
| [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) | MDN | Семантика Web Locks (Node реализует тот же API) |
| [Node.js: More Threads Than You Think](https://www.wearedevelopers.com/videos/1685-node-js-more-threads-than-you-think) | Matteo Collina, 2025 | Потоки в Node: Piscina, каналы, сброс нагрузки |
| [ERR_WORKER_OUT_OF_MEMORY](https://nodejs.org/api/errors.html#err_worker_out_of_memory) | Node.js docs | Ошибка нехватки памяти воркера |

## Пулы воркеров: Piscina, Tinypool, workerpool, poolifier

**Ключевые выводы**
- **Piscina 5.x** (5.3.2; изначально James Snell в NearForm, теперь организация piscinajs):
  - по умолчанию `maxThreads = availableParallelism() × 1,5`; `minThreads` в коде 5.3.2 — `floor(availableParallelism() / 2)` (README пишет `availableParallelism()`; локально на 32 логических ядрах: min 16, max 48);
  - `idleTimeout` (по умолчанию простаивающие воркеры гасятся сразу; ставить, например, 30 с, чтобы не пересоздавать их);
  - `maxQueue` (по умолчанию без предела; `'auto'` = maxThreads²) и `'drain'`/`needsDrain` для backpressure;
  - `concurrentTasksPerWorker` для async-задач, `resourceLimits`, `atomics: 'sync' | 'async' | 'disabled'`;
  - несколько именованных экспортов в одном файле воркера, выбор через `{ name }`;
  - отмена через `{ signal }` останавливает поток воркера, если задача уже выполняется;
  - `Piscina.move(buf)` передаёт возвращаемые значения вместо копирования;
  - гистограммы `runTime`, `waitTime` и `utilization`; `close()` (мягко) против `destroy()`.
  - У 5.3.2 README и `engines` — Node.js 20.x и выше; README ветки `current` (линия 6.0, пока rc) — 24.x и выше. `FixedQueue` до ~6 раз быстрее очереди на массиве при 100 тыс. задач в очереди (цифры из README).
- **Tinypool 2.x** (пул Vitest, форк Piscina, ~38 KB, без зависимостей, только ESM): берёт число **физических** ядер; `runtime: 'worker_threads' | 'child_process'`; `isolateWorkers` (свежий воркер на задачу); `maxMemoryLimitBeforeRecycle`; `cancelPendingTasks()` (не прерывает выполняющиеся задачи) и `recycleWorkers()`. Нет метрики загрузки и приоритетов потоков.
- **workerpool 10** (Jos de Jong): один API для воркеров Node, дочерних процессов и браузерных Web Workers; прокси; отмена и таймауты [не проверено].
- **poolifier 6.1** (2026-10-31): фиксированные и динамические пулы потоков и cluster, task functions, очереди с приоритетами, work stealing [не проверено].
- threads.js (1.7.0, 2022) заброшен; comlink (4.4.2, 2024) ориентирован на браузер.
- Проверено локально на Node 24.17 (Windows 11, 32 логических / 16 физических ядер): 32 CPU-задачи по ~420 мс, ускорение относительно последовательного выполнения — Piscina k=2 → 2,1x, k=4 → 3,4x, k=8 → 7,4x, k=16 → 13,7x, k=32 → 18,4x; Tinypool k=8 → 7,9x.
- SMT добавляет ~35% сверх числа физических ядер, а не 2x. Tinypool и Piscina на k=8 дают одно и то же.
- Мелкие задачи: 20 000 тривиальных `pool.run(i)` через Piscina на 8 потоков, поставленных разом, стоили ~117 мкс на задачу против наносекунд на месте (локальный замер). **Собирать мелкую работу в пакеты** хотя бы по несколько мс: иначе накладные (clone + очередь + пробуждение) доминируют.
- Размер пула: CPU-работа → `os.availableParallelism()`, минус один, если главный поток тоже обслуживает трафик; оставить запас для потоков libuv и GC. В контейнерах смотреть квоту CPU: CFS-квота и affinity — разные вещи [не проверено].
- Серверный шаблон: ограниченная очередь (`maxQueue`) и 503 при заполнении (сброс нагрузки), `AbortSignal` на каждый запрос, чтобы брошенные запросы не занимали воркеры.

```js
import { Piscina } from 'piscina';

const pool = new Piscina({
  filename: new URL('./worker.mjs', import.meta.url).href,
  maxQueue: 'auto',
  idleTimeout: 30_000,
});

app.post('/thumb', async (req, reply) => {
  if (pool.queueSize >= pool.options.maxQueue) return reply.code(503).send();
  return pool.run({ buf: req.body }, { name: 'thumbnail', signal: AbortSignal.timeout(5000) });
});
```

```js
// worker.mjs: именованные экспорты выбираются через { name }
import { Piscina } from 'piscina';
export function thumbnail({ buf }) {
  const out = makeThumbnail(buf);              // CPU-работа
  return Piscina.move(out);                    // передать, а не копировать (out — ArrayBuffer/typed array)
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [piscinajs/piscina](https://github.com/piscinajs/piscina) | Piscina team | Опции, отмена, `move()`, статистика, цифры FixedQueue |
| [piscinajs.dev](https://piscinajs.dev/) | Piscina team | Сайт документации, примеры |
| [Learning to swim with Piscina](https://www.nearform.com/blog/learning-to-swim-with-piscina-the-node-js-worker-pool/) | James Snell (NearForm), 2020 | Знакомство с Piscina и её дизайн |
| [tinylibs/tinypool](https://github.com/tinylibs/tinypool) | Tinylibs | Форк Piscina из Vitest; опции изоляции и пересоздания |
| [josdejong/workerpool](https://github.com/josdejong/workerpool) | Jos de Jong | Пулы для разных окружений, прокси |
| [poolifier/poolifier](https://github.com/poolifier/poolifier) | poolifier team | Пулы потоков и cluster, work stealing |
| [os.availableParallelism()](https://nodejs.org/api/os.html#osavailableparallelism) | Node.js docs | Правильный API для числа CPU (не `os.cpus().length`) |

## Передача против копирования

**Ключевые выводы**
- По умолчанию `postMessage` **копирует** данные алгоритмом structured clone. Цена растёт с размером и, сильнее всего, с числом объектов в графе.
- **Передача** (`transferList`) перемещает владение без копирования: `ArrayBuffer`, `MessagePort`, `FileHandle`, хэндлы `net.Socket`/`net.Server`. После передачи исходный `ArrayBuffer` отсоединён (`byteLength === 0`).
- Буферы из внутреннего пула (`Buffer.from`, `Buffer.allocUnsafe`) передать нельзя: в `transferList` их `ArrayBuffer` даёт `DataCloneError`, а при клонировании копируется вся плита пула (8 КиБ в 24.17, 64 КиБ в 26.13; проверено локально). Для данных, которые будут передаваться, — `Buffer.alloc`/`Buffer.allocUnsafeSlow`.
- Проверено локально на Node 24.17 (Windows 11): круговая отправка `ArrayBuffer` на 64 MiB — clone ~73 мс, transfer ~0,44 мс (примерно в 165 раз быстрее). Structured clone 200 тыс. мелких объектов — ~540 мс. Дорогой случай — графы объектов: отправлять typed arrays, плоские буферы или идентификаторы, а не деревья объектов.
- `SharedArrayBuffer` никогда не копируется и не передаётся — он разделяется.
- `WebAssembly.Module` клонируется: компилировать один раз и отправлять модуль воркерам.
- `markAsUncloneable(obj)` (22.10) — защита от случайной отправки тяжёлого или неклонируемого объекта. Срабатывает на обычных объектах (и когда они вложены в сообщение); на `Map` и массивах в 24.17 и 26.13 молча не действует (проверено локально) — помечать объект-обёртку.
- Экземпляры классов приходят как обычные объекты: отправлять данные и восстанавливать класс на стороне получателя.

```js
import { Worker, markAsUncloneable } from 'node:worker_threads';

const worker = new Worker(new URL('./worker.mjs', import.meta.url));

// Передача: без копирования, исходный буфер отсоединяется
const data = new Float64Array(8 * 1024 * 1024);
worker.postMessage({ data }, [data.buffer]);
console.log(data.byteLength);                 // 0

// Buffer для передачи — только не из пула
const raw = Buffer.allocUnsafeSlow(1 << 20);
worker.postMessage({ raw }, [raw.buffer]);

// Объект, который нельзя случайно отправить
const cache = { entries: new Map() };          // обычный объект: на самом Map пометка не действует
markAsUncloneable(cache);                      // postMessage(cache) бросит DataCloneError
```

Источники — документация Worker threads и алгоритм structured clone WHATWG из таблицы раздела [worker_threads](#worker_threads).

## Общая память: SharedArrayBuffer и Atomics

**Ключевые выводы**
- `SharedArrayBuffer` (SAB) и typed-array поверх него дают настоящую общую память между воркерами. Обычные чтения и записи гоняются. Проверено локально на Node 24.17 (Windows 11): 4 воркера × 1 млн `a[0]++` на общем `Int32Array` потеряли 67–73% инкрементов; `Atomics.add` дал точно 4 000 000 и был ~2,3 раза медленнее гоночного цикла. Любое общее «прочитать-изменить-записать» — только через `Atomics.*`.
- Примитивы: `Atomics.add/sub/and/or/xor/exchange/compareExchange/load/store`; `Atomics.wait` (блокирует поток; в браузере запрещён на главном потоке, в Node разрешён, но главный event loop им блокировать нельзя); `Atomics.notify`; `Atomics.waitAsync` (на промисах, безопасен на главном потоке); `Atomics.pause()` (подсказка для spin-wait, ES2026). Локально в 24.17 есть всё это и `grow()` у растущего SAB.
- Шаблоны: lock-free счётчики и флаги, кольцевой буфер записей фиксированного размера с индексами head/tail, мьютекс в стиле futex (`compareExchange` + `wait`/`notify`). Сначала смотреть высокоуровневые варианты: Web Locks (`worker_threads.locks`, 24.5), режим `atomics` в Piscina, обмен сообщениями. Самописный lock-free код — аналог `unsafe` в JS.
- SAB не хранит JS-объекты: сериализовать в байты (например, структуры фиксированной раскладки через `DataView`).
- Браузеры дают SAB только при cross-origin isolation (COOP/COEP); Node — без условий. Код, общий с браузером, должен учитывать это ограничение.
- Растущий SAB (`new SharedArrayBuffer(len, { maxByteLength })`, `grow()`) умеет только расти; представления на буферах с отслеживанием длины следуют за ним.

```js
// main.mjs
import { Worker } from 'node:worker_threads';
const sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
const counter = new Int32Array(sab);
for (let i = 0; i < 4; i++) new Worker(new URL('./inc.mjs', import.meta.url), { workerData: sab });
// после завершения воркеров: Atomics.load(counter, 0) === 4_000_000

// inc.mjs
import { workerData } from 'node:worker_threads';
const c = new Int32Array(workerData);
for (let i = 0; i < 1_000_000; i++) Atomics.add(c, 0, 1);   // не c[0]++
```

```js
// Межпоточная критическая секция без ручных Atomics (24.5+, экспериментально)
import { locks } from 'node:worker_threads';
await locks.request('cache-rebuild', async () => { await rebuildCache(); });
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics) | MDN | Все операции Atomics, семантика wait/notify |
| [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) | MDN | SAB, растущий SAB, требования безопасности |
| [Atomics.waitAsync()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync) | MDN | Неблокирующее ожидание для главного потока |
| [proposal-atomics-microwait](https://github.com/tc39/proposal-atomics-microwait) | TC39 (Shu-yu Guo) | Зачем `Atomics.pause` |
| [Atomics.wait, Atomics.notify, Atomics.waitAsync](https://v8.dev/features/atomics) | V8 team | `Atomics.wait`/`waitAsync` в V8 |

## child_process

**Ключевые выводы**
- `spawn` (streams, по умолчанию без shell), `execFile` (буферизует вывод, без shell), `exec` (буферизует вывод, **запускает shell**), `fork` (дочерний Node с IPC-каналом). Синхронные варианты блокируют цикл: только для CLI-скриптов.
- Инъекция в shell: «Never pass unsanitized user input» в `exec`/`execSync`. С `shell: true` аргументы не экранируются, а просто склеиваются пробелами, поэтому массив аргументов вместе с `shell` устарел (DEP0190, runtime с 24.0). Брать `execFile`/`spawn` с массивом аргументов и без shell.
- Windows: `.bat`/`.cmd` нельзя запустить через `execFile`; нужен `spawn('cmd.exe', ['/c', 'my.bat'])` или `exec`. Исправление «BatBadBut» 2024 года (CVE-2024-27980) заставило `spawn` файлов `.bat`/`.cmd` без `shell: true` бросать `EINVAL` [не проверено]. Ключи окружения на Windows регистронезависимы: `PATH` и `Path` в одном объекте env конфликтуют.
- `maxBuffer` по умолчанию 1 MiB для `exec`/`execFile`/`*Sync`; превышение убивает дочерний процесс. Для большого вывода — `spawn` и поток.
- **Дедлок на пайпе**: если дочерний процесс пишет больше ёмкости пайпа ОС, а `stdout`/`stderr` никто не читает, он блокируется навсегда. Всегда вычитывать или ставить `stdio: 'ignore'`/`'inherit'`.
- IPC: `serialization: 'advanced'` использует structured clone (Map, Set, BigInt, typed arrays) вместо JSON. IPC намного медленнее `postMessage` воркеров: для управляющих сообщений, не для объёмных данных.
- Отмена: `{ signal }` (AbortSignal) убивает дочерний процесс при abort; `timeout` + `killSignal`. **DEP0209 (только в документации, 26.8.2)**: использовать `AbortSignal` для освобождения долгоживущих ресурсов (`listen({ signal })` у сервера, `addAbortSignal` на streams, `spawn({ signal })` как очистка) — устаревший приём. Очистка — через `using`/`await using`, а `AbortSignal` — для отмены и таймаутов.
- Демоны: `detached: true` + `stdio: 'ignore'` + `subprocess.unref()`. `exitCode` равен `null`, если процесс убит сигналом; `'close'` срабатывает после закрытия stdio, `'exit'` может прийти раньше.
- Где нужны в 2026: запуск внешних инструментов (ffmpeg, git), изоляция нативного кода, который может упасть, или недоверенного кода (под Permission Model нужен `--allow-child-process`), сервер «процесс на ядро». Для CPU-работы на JS воркеры дешевле.
- Скриптовые помощники: `zx` 8.8.5 и `execa` (см. [domains-client.md](domains-client.md)).

```js
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
// Без shell, аргументы массивом, с дедлайном
const { stdout } = await run('git', ['log', '-1', '--format=%H'], {
  timeout: 10_000,
  signal: AbortSignal.timeout(15_000),
});

// Большой вывод — потоком; stderr обязательно вычитывать
const ff = spawn('ffmpeg', ['-i', input, '-f', 'mp3', 'pipe:1'], { stdio: ['ignore', 'pipe', 'pipe'] });
ff.stderr.resume();                             // иначе возможен дедлок на пайпе
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Child process](https://nodejs.org/api/child_process.html) | Node.js docs (v26) | Полный API, предупреждения про shell, stdio, заметки по Windows |
| [DEP0190](https://nodejs.org/api/deprecations.html#DEP0190) | Node.js docs | Аргументы + shell |
| [DEP0209](https://nodejs.org/api/deprecations.html#DEP0209) | Node.js docs | `AbortSignal` против `using` для очистки |
| [April 2024 security releases](https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2) | Node.js project, 2024 | CVE-2024-27980 (инъекция через `.bat`/`.cmd`) |
| [BatBadBut: You can't securely execute commands on Windows](https://flatt.tech/research/posts/batbadbut-you-cant-securely-execute-commands-on-windows/) | RyotaK (Flatt Security), 2024 | Предыстория BatBadBut |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | Sindre Sorhus | Более безопасная обёртка над child_process |

## cluster, процесс на ядро и контейнеры

**Ключевые выводы**
- `cluster` порождает N процессов Node с общим слушающим сокетом. Планирование по умолчанию везде, кроме Windows, — **round-robin** в primary (`SCHED_RR`): primary принимает соединения и передаёт хэндлы воркерам по IPC. `SCHED_NONE` даёт воркерам принимать соединения напрямую; документация говорит, что это часто сильно разбалансировано. Переключатель — `NODE_CLUSTER_SCHED_POLICY=rr|none`.
- `server.listen({ reusePort: true })` (23.1/22.12) использует `SO_REUSEPORT` (Linux/BSD): независимые процессы или потоки слушают один порт, балансирует ядро, primary на пути данных нет.
- Бенчмарк вендора Platformatic (React Router, k6 на 10 тыс. req/s, AWS EKS, всего 6 CPU): PM2 (на cluster) 4 154 req/s, шесть подов по 1 CPU 5 838 req/s, Watt (воркеры на SO_REUSEPORT, 3 пода × 2 воркера) 6 032 req/s. Около 30% накладных они приписывают маршрутизации через primary в cluster. Это данные вендора, одна нагрузка.
- В Kubernetes обычный совет 2026 года — **один процесс на контейнер, масштабирование репликами** (просто, перезапусками занимается оркестратор). Исключение: накладные памяти на под или медленное восстановление застрявшего event loop говорят в пользу нескольких воркеров в поде с супервизором, который перезапускает застрявший воркер. Число воркеров — по лимиту CPU; cluster внутри пода на 1 CPU только добавляет накладные.
- PM2 ещё используют на ВМ; его cluster mode наследует маршрутизацию через IPC. Статус и альтернативы — в [domains-server.md](domains-server.md).
- `cluster` не устарел, но устроен по-старому: нет общей памяти, IPC по умолчанию на JSON, sticky sessions требуют доработки (WebSockets и Socket.IO нужны sticky-маршрутизация или адаптер).

```js
import { createServer } from 'node:http';
// Каждый процесс (или поток) слушает тот же порт; балансирует ядро (Linux/BSD)
createServer(handler).listen({ port: 3000, reusePort: true });
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Cluster](https://nodejs.org/api/cluster.html) | Node.js docs | Как устроен, политика планирования |
| [server.listen(options)](https://nodejs.org/api/net.html#serverlistenoptions-callback) | Node.js docs | Опция `reusePort` |
| [10,000 requests, 2 approaches to multi-threading, 1 React Router](https://blog.platformatic.dev/10000-requests-2-approaches-to-multi-threading-1-react-router) | Platformatic, ~2026 | Воркеры на SO_REUSEPORT против PM2 и подов, цифры |
| [platformatic/next-bench](https://github.com/platformatic/next-bench) | Platformatic | Стенд бенчмарка и советы по числу воркеров |
| [PM2 cluster mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/) | Keymetrics | Cluster mode в PM2 |
| [platformatic/platformatic](https://github.com/platformatic/platformatic) | Platformatic (Collina и др.) | Watt: несколько сервисов как worker threads одного процесса |

## Streams и backpressure

**Ключевые выводы**
- Золотое правило — уважать backpressure. `writable.write()` возвращает `false` выше `highWaterMark`: остановиться и ждать `'drain'`. В `_read` остановиться, когда `push()` вернул `false`. «Never `.push()` if you are not asked». Никогда не писать `readable.on('data', d => writable.write(d))`.
- Официальный гайд намерил ~88 МБ пиковой виртуальной памяти при соблюдении backpressure против ~1,52 ГБ без него (примерно в 17 раз), с GC в случайные моменты; время выполнения почти не отличалось.
- Проверено локально на Node 24.17 (Windows 11): запись 250 MiB кусками по 64 KiB в медленный `Writable`. Игнорирование результата `write()` → пиковый RSS 308 MiB; `pipeline()` из генератора → 109 MiB (примерно в 2,8 раза меньше, и не растёт вместе с объёмом данных).
- `pipeline` из `node:stream/promises`: распространяет ошибки, уничтожает все потоки при сбое, принимает `{ signal }`. Голый `.pipe()` при ошибках ничего не чистит.
- Async-итерация: `for await (const chunk of readable)` уважает backpressure на стороне чтения. Генераторы и async-генераторы бывают стадиями `pipeline` (`async function* (source) { for await (const c of source) yield transform(c) }`). `stream.compose()` собирает переиспользуемые duplex. `Readable.from(iterable)` — для источников [не проверено].
- Значения по умолчанию: `highWaterMark` байтовых потоков 64 KiB (16 KiB на Windows) с Node 22; objectMode — 16. `stream.setDefaultHighWaterMark()` меняет его на весь процесс.
- Совместимость с Web Streams: `Readable.fromWeb`/`Readable.toWeb` (стабильны в 24/22.17; `toWeb({ type: 'bytes' })` 25.4/24.14), `Writable.fromWeb/toWeb`, `Duplex.fromWeb/toWeb` (вместо `type` — `readableType`, DEP0201). Тела `fetch()` — Web Streams; конвертировать один раз на границе.
- Node 26: устаревшие модули `_stream_*` удалены (DEP0193 End-of-Life), Readable читает по одному буферу за раз, `AsyncLocalStorage` на `finished` сохраняется только при необходимости.
- Очистка: `await using stream = fs.createReadStream(f)` (explicit resource management) — рекомендованный по DEP0209 способ освобождения.
- Object-mode потоки медленны на каждый элемент; для большого числа записей собирать их в массивы или работать с async-итераторами напрямую.
- Конкурентная обработка в потоке: `readable.map(fn, { concurrency })`, `forEach`, `filter` (экспериментальные операторы) [не проверено]; `hwp` (Matteo Collina) — параллельная обработка async-итераторов с учётом highWaterMark.

```js
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';

await pipeline(
  createReadStream('events.ndjson'),
  async function* (source) {
    for await (const chunk of source) yield transform(chunk);
  },
  createGzip(),
  createWriteStream('events.ndjson.gz'),
  { signal: AbortSignal.timeout(60_000) },
);
```

```js
import { once } from 'node:events';

// Ручная запись с backpressure, если pipeline не подходит
for (const chunk of produce()) {
  if (!out.write(chunk)) await once(out, 'drain');
}
out.end();
```

```js
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';

// Тело fetch() — Web Stream: конвертировать один раз на границе
const res = await fetch(url, { signal });
await pipeline(Readable.fromWeb(res.body), createWriteStream('download.bin'));
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Backpressuring in Streams](https://nodejs.org/en/learn/modules/backpressuring-in-streams) | Node.js project | Правила backpressure, цифры памяти, `pipeline` |
| [Stream](https://nodejs.org/api/stream.html) | Node.js docs (v26) | API, значения `highWaterMark`, совместимость с Web Streams |
| [Web Streams API](https://nodejs.org/api/webstreams.html) | Node.js docs | WHATWG streams в Node |
| [How to use streams](https://nodejs.org/en/learn/modules/how-to-use-streams) | Node.js project | Учебник по streams |
| [readable.map(fn, options)](https://nodejs.org/api/stream.html#readablemapfn-options) | Node.js docs | Операторы потоков с `concurrency` |
| [nodejs/node#60441](https://github.com/nodejs/node/pull/60441) | Robert Nagy (ronag), влит 2026-01-21 | Node 26: Readable читает по одному буферу |
| [Node.js 26.0.0](https://nodejs.org/en/blog/release/v26.0.0) | Node.js project, 2026-05-05 | Semver-major изменения streams |
| [mcollina/hwp](https://github.com/mcollina/hwp) | Matteo Collina | Параллельная обработка async-итераторов с учётом highWaterMark |

## AsyncLocalStorage и асинхронный контекст

**Ключевые выводы**
- `AsyncLocalStorage` (ALS) — поддерживаемый способ нести контекст запроса (request id, арендатор, span трассировки) через колбэки и промисы. `als.run(store, fn)`, `als.getStore()`. `run` предпочтительнее экспериментального `enterWith`, который протекает в последующий код того же тика.
- **Node 24+ строит ALS на `AsyncContextFrame`**: каждый `run()` создаёт фрейм, наследующий текущий; промисы несут его через continuation-preserved embedder data V8, без PromiseHooks. Происхождение: issue James Snell #46265 «AsyncLocalStorage without Async Hooks» (2023, по образцу Cloudflare workerd), реализация Stephen Belanger в PR #48528 «rewrite AsyncLocalStorage without async_hooks» (влит 2024-08-02, сначала за флагом, по умолчанию с 24.0). `--no-async-context-frame` возвращает старую реализацию (для Electron или отличий в потоке контекста).
- Проверено локально на Node 24.17 (Windows 11), микробенчмарк на промисах (5000 параллельных цепочек × 10 `await`): с AsyncContextFrame `als.run` + `getStore` в пределах шума от базовой линии (медианы 82–117 мс против 110–132 мс). С `--no-async-context-frame` **одно лишь создание экземпляра ALS и вызов `getStore()` замедлили всю нагрузку на промисах в ~2,5–3,5 раза** (84–117 мс → 268–319 мс). Старые цифры накладных ALS («30–50% медленнее») относятся к реализации до 24 [устарело для Node ≥ 24]: замена — AsyncContextFrame.
- Причины потери контекста: самописные thenable, callback-API с пулами колбэков (пулы соединений, очереди), слушатели `EventEmitter`, зарегистрированные в другом контексте. Исправления: `util.promisify`, `AsyncResource.bind(fn)` / `AsyncLocalStorage.bind(fn)`, `AsyncLocalStorage.snapshot()` (стабильны с 23.11/22.15).
- `als.withScope(store)` возвращает освобождаемый `RunScope` для `using` (25.9, экспериментально). Осторожно в async-функциях: часть до первого `await` выполняется в контексте вызывающего.
- Библиотеки со своими очередями и пулами должны наследовать `AsyncResource` и вызывать `runInAsyncScope`, чтобы контекст пользователя сохранялся (в документации есть пример пула воркеров на нём).
- `async_hooks.createHook`/`AsyncHook`/`executionAsyncResource`: Stability 1, «Please migrate away from this API». Для контекста — ALS, для учёта активных ресурсов — `process.getActiveResourcesInfo()`, для инструментирования APM — `diagnostics_channel` (`tracingChannel`). `domain` устарел (DEP0032).
- TC39 **AsyncContext** (`AsyncContext.Variable` ≈ ALS, `AsyncContext.Snapshot` ≈ `AsyncResource`/`snapshot()`) всё ещё на **Stage 2** (черновик спецификации от 2026-06-16); PR интеграции в WHATWG HTML открыты в 2026; открытые вопросы — слушатели событий, удержание памяти, `unhandledrejection`.

```js
import { AsyncLocalStorage, AsyncResource } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export const requestContext = new AsyncLocalStorage();

server.on('request', (req, res) => {
  requestContext.run({ requestId: req.headers['x-request-id'] ?? randomUUID() }, () => handle(req, res));
});

export function log(msg) {
  console.log(JSON.stringify({ requestId: requestContext.getStore()?.requestId, msg }));
}

// Колбэк, который вызовет чужой пул: привязать к текущему контексту
pool.query(sql, AsyncResource.bind((err, rows) => { log('query done'); }));

// Снимок контекста для отложенного запуска
const runInCaptured = AsyncLocalStorage.snapshot();
queue.push(() => runInCaptured(() => log('job ran')));
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Asynchronous context tracking](https://nodejs.org/api/async_context.html) | Node.js docs (v26) | ALS, AsyncResource, поиск потери контекста, история |
| [Async hooks](https://nodejs.org/api/async_hooks.html) | Node.js docs | Предупреждение о стабильности, рекомендованные замены |
| [--no-async-context-frame](https://nodejs.org/api/cli.html#--no-async-context-frame) | Node.js docs | Флаг отключения (24.0) |
| [nodejs/node#46265](https://github.com/nodejs/node/issues/46265) | James M Snell, 2023 | Обоснование AsyncContextFrame |
| [nodejs/node#48528](https://github.com/nodejs/node/pull/48528) | Stephen Belanger (Qard), влит 2024-08-02 | «lib: rewrite AsyncLocalStorage without async_hooks» (по умолчанию с 24.0) |
| [Async Context spec draft](https://tc39.es/proposal-async-context/) | TC39 (Justin Ridgewell, Chengzhong Wu и др.) | Черновик Stage 2 (2026-06-16) |
| [tc39/proposal-async-context](https://github.com/tc39/proposal-async-context) | TC39 | README предложения, сценарии |
| [2026 AsyncContext: where are we now?](https://github.com/Igalia/webengineshackfest/wiki/2026-AsyncContext:-where-are-we-now%3F) | Web Engines Hackfest, 2026 | Статус веб-интеграции, открытые вопросы |
| [The Road to Async Context](https://gitnation.com/contents/the-road-to-async-context) | GitNation | История от CLS до AsyncContext |
| [Diagnostics Channel](https://nodejs.org/api/diagnostics_channel.html) | Node.js docs | `tracingChannel` для инструментирования вместо async_hooks |
| [nodejs/diagnostics](https://github.com/nodejs/diagnostics) | Node.js Diagnostics WG | Работа над async context, трассировкой и диагностикой |

## Ограничение конкурентности и отмена

**Ключевые выводы**
- Неограниченный fan-out (`await Promise.all(items.map(fetchOne))` на 100 тыс. элементов) исчерпывает сокеты, дескрипторы, память и лимиты нижестоящих сервисов. Ограничивать:
  - **p-limit 7**: `pLimit(n)`, `limit.map(iterable, fn)`, `activeCount`, `pendingCount`, `clearQueue()` с `rejectOnClear`, `limitFunction(fn, { concurrency })`. Не вызывать тот же лимитер изнутри ограниченной задачи — дедлок.
  - **p-map 7**: map с `concurrency` и `stopOnError` [не проверено].
  - **p-queue 10**: когда нужны приоритеты, rate limit (`intervalCap`/`interval`), `timeout` на задачу, `signal`, `pause()` и `onSizeLessThan(n)` для backpressure производителя. Только ESM. При таймауте или abort задача продолжает работать, если сама не следит за сигналом.
  - Встроенная альтернатива для потоков: `readable.map(fn, { concurrency })` / `forEach` / `filter` (экспериментально) [не проверено].
  - Лимит согласовать с пулом соединений (`connections` в undici, размер пула БД).
- **Отмена** кооперативна: передавать `AbortSignal` через каждый слой (`fetch`, undici, `fs.readFile`, `timers/promises`, `events.once`, `child_process`, `stream.pipeline`, Piscina). `AbortSignal.timeout(ms)` — для дедлайнов, `AbortSignal.any([a, b])` — объединить abort запроса и таймаут. В длинных циклах — `signal.throwIfAborted()`. У ошибок отмены `name === 'AbortError'` (или `TimeoutError` для `AbortSignal.timeout`).
- По DEP0209 `AbortSignal` — для отмены; долгоживущие ресурсы освобождать через `using`/`await using`.
- Встроенной структурной конкурентности (TaskGroup) нет. Приближение: `AbortController` на область, его сигнал — детям, `abort()` в `finally`; `Promise.allSettled`, если частичный сбой допустим; никаких «выстрелил и забыл» без `.catch()` (необработанное отклонение по умолчанию роняет процесс).
- Семафоры для async-кода: `async-sema` (Vercel), p-limit или Web Locks (`navigator.locks` / `worker_threads.locks`) для именованных exclusive/shared секций. Мьютекс в однопоточном JS всё равно нужен: любой `await` между проверкой и действием — окно гонки (например, два запроса одновременно обновляют один токен).
- Rate limit между процессами требует общего хранилища (Redis); `bottleneck` (последний релиз 2023) заброшен.

```js
import pLimit from 'p-limit';

const limit = pLimit(16);                       // = размер пула соединений
const pages = await Promise.all(
  urls.map((url) => limit(() => fetch(url, { signal: AbortSignal.timeout(5000) }).then((r) => r.text()))),
);
```

```js
// «Область» отмены: всё, что запущено внутри, отменяется при выходе
export async function withScope(parentSignal, fn) {
  const ac = new AbortController();
  const signal = AbortSignal.any([ac.signal, parentSignal]);
  try {
    return await fn(signal);
  } finally {
    ac.abort();                                 // хвосты не переживают область
  }
}

await withScope(req.signal, async (signal) => {
  const [user, orders] = await Promise.all([
    getUser(id, { signal }),
    getOrders(id, { signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) }),
  ]);
  return render(user, orders);
});
```

```js
// Single-flight против гонки «проверить → await → действовать»
let refreshing = null;
export function getToken() {
  if (token && !isExpired(token)) return token;
  refreshing ??= refreshToken().finally(() => { refreshing = null; });
  return refreshing;
}
```

Промис-комбинаторы и `events.on` с сигналом — в [idioms-patterns.md](idioms-patterns.md); правило линтера `@typescript-eslint/no-floating-promises` — в [typescript.md](typescript.md).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [sindresorhus/p-limit](https://github.com/sindresorhus/p-limit) | Sindre Sorhus | API лимитера, предупреждение о дедлоке |
| [sindresorhus/p-queue](https://github.com/sindresorhus/p-queue) | Sindre Sorhus | Очередь с приоритетом, rate limit, таймаутом, сигналом |
| [sindresorhus/p-map](https://github.com/sindresorhus/p-map) | Sindre Sorhus | Map с ограничением конкурентности |
| [sindresorhus/promise-fun](https://github.com/sindresorhus/promise-fun) | Sindre Sorhus | Указатель промис-утилит |
| [vercel/async-sema](https://github.com/vercel/async-sema) | Vercel | Семафор для async-кода |
| [AbortSignal](https://nodejs.org/api/globals.html#class-abortsignal) | Node.js docs | `AbortSignal.timeout`, `any`, `throwIfAborted` |
| [Events](https://nodejs.org/api/events.html) | Node.js docs | `events.on`/`once` с AbortSignal, `captureRejections` |
| [proposal-explicit-resource-management](https://github.com/tc39/proposal-explicit-resource-management) | TC39 (Ron Buckton) | `using`/`await using` для воркеров, потоков, дочерних процессов |

## Нативные расширения и FFI

### Node-API и node-addon-api

**Ключевые выводы**
- **Node-API (N-API)** — C API со стабильным ABI: аддон, собранный под него, работает на следующих мажорах Node без пересборки. Заголовки C++ Node (`node.h`), libuv и V8 ABI-стабильными **не** являются: аддоны на них пересобираются под каждый `NODE_MODULE_VERSION` (147 в Node 26).
- Node-API версии 10 поддерживается в 22.14+, 23.6+ и всех последующих. Без `NAPI_VERSION` по умолчанию берётся 8. С версии 9 API не строго аддитивен: переход на более высокую версию может потребовать правок кода, а старые аддоны сохраняют семантику v8.
- **Правила потоков**:
  - `napi_env` принадлежит одному окружению (главный поток или Worker); не кэшировать его и не использовать из другого потока.
  - Execute-колбэк `napi_create_async_work` выполняется на **пуле потоков libuv** и не должен вызывать функции Node-API, трогающие JS; работу с JS делать в complete-колбэке.
  - Вызывать JS из своих нативных потоков — только через **thread-safe functions**: `napi_create_threadsafe_function`, `napi_call_threadsafe_function` с `napi_tsfn_blocking`/`nonblocking`, `napi_release_threadsafe_function` с `napi_tsfn_release`/`abort`. JS-колбэк может получить `env == NULL` при завершении и должен освободить свои данные.
- **Context awareness**: аддон может быть загружен в нескольких Workers одновременно. Состояние держать на окружение (`napi_set_instance_data`), регистрировать `napi_add_env_cleanup_hook` / async cleanup hooks. Изменяемое глобальное состояние модуля — гонка данных.
- Долгая нативная работа на пуле libuv конкурирует с fs/dns/crypto/zlib (раздел [Пул потоков libuv](#пул-потоков-libuv)). Для долгой или параллельной нативной работы — свои потоки (Rust rayon/tokio, потоки C++) и возврат результата через thread-safe function.
- **node-addon-api** 8.9.2 — официальная header-only обёртка C++ над Node-API; наследует стабильность ABI; engines `^18 || ^20 || >=21`.
- Нативный код — аналог `unsafe` в Node: ошибка роняет весь процесс (все запросы, все воркеры). Если падения нужно сдерживать, такой код запускать в дочернем процессе.
- `--experimental-addon-modules` позволяет ESM-`import` файла `.node` (23.6/22.20; по умолчанию с 26.5). Под Permission Model аддонам нужен `--allow-addons`.

### Rust: napi-rs и Neon

**Ключевые выводы**
- **napi-rs** (crate `napi` 3.16.1 / `napi-derive` 3.7.0, `@napi-rs/cli` 3.10.12). Версия 3 (анонс 2025-07-07):
  - тот же crate компилируется в **WebAssembly** (`wasm32-wasip1-threads`; `std::thread` и tokio работают в браузере) — для playground и как пакет-фолбэк для платформ без готовых бинарников;
  - **ThreadsafeFunction переписан** (на владении, вместе с командами Rolldown и Rspack), потому что API v2 «was not safe at all»;
  - кросс-компиляция без больших Docker-образов;
  - старые типы `JsObject`/`JsFunction` ушли за `compat-mode` и считаются unsafe; MSRV Rust 1.88; конфиг `napi.binaryName` + плоский `napi.targets`.
  - Используют Rolldown, Rspack, Oxc, SWC, JS API Biome, движки Prisma и другие [не проверено].
- **Neon** 1.1.2 (crate, 2026-10-02) — другой вариант для Rust; макрос `#[neon::export]`; `@neon-rs/cli` 0.2.6. Экосистема меньше, чем у napi-rs.

```rust
// src/lib.rs (napi-rs 3): крупные вызовы над целым буфером, а не поэлементно
use napi::bindgen_prelude::Buffer;
use napi_derive::napi;

#[napi]
pub fn checksum(data: Buffer) -> u32 {
    data.iter().fold(0u32, |acc, b| acc.wrapping_add(*b as u32))
}
```

```bash
npm i -D @napi-rs/cli
npx napi new           # шаблон проекта с CI-матрицей платформ
npx napi build --release --platform
```

### Сборка и распространение

**Ключевые выводы**
- Инструменты сборки: node-gyp 13.1.0 (нужен Python, на Windows — MSVC «Desktop development with C++», на macOS — Xcode CLT; Python 3.12+ требует node-gyp ≥ 10); cmake-js 8.0.0 для проектов на CMake; napi-rs и Neon собираются через cargo.
- Пользователи не должны компилировать при установке:
  - Современный шаблон (napi-rs, esbuild, SWC): отдельный npm-пакет на каждую платформу/архитектуру/libc в `optionalDependencies` с полями `os`/`cpu`/`libc` и JS-загрузчик, который делает `require` нужного; по желанию — пакет-фолбэк на Wasm. Install-скриптов нет, а это важно, потому что многие команды теперь запускают `npm ci --ignore-scripts` (см. [toolchain.md](toolchain.md) о supply chain).
  - prebuildify (6.0.1, 2024) + node-gyp-build (4.8.4, 2024): готовые бинарники внутри основного пакета, загрузка во время выполнения; всё ещё распространено, но релизы давние.
  - prebuild-install (7.1.3, 2026-02): скачивает бинарники в postinstall-скрипте (нужны install-скрипты; слабее при `--ignore-scripts`).

```json
{
  "name": "fast-hash",
  "main": "index.js",
  "optionalDependencies": {
    "fast-hash-linux-x64-gnu": "1.2.0",
    "fast-hash-linux-x64-musl": "1.2.0",
    "fast-hash-darwin-arm64": "1.2.0",
    "fast-hash-win32-x64-msvc": "1.2.0"
  }
}
```

```json
{
  "name": "fast-hash-linux-x64-musl",
  "os": ["linux"],
  "cpu": ["x64"],
  "libc": ["musl"],
  "main": "fast-hash.linux-x64-musl.node"
}
```

### FFI: node:ffi и koffi

**Ключевые выводы**
- **`node:ffi`** (добавлен в 26.1.0 через PR #62072, Stability 1, прямо назван «unsafe»):
  - `dlopen(path, { fn: { arguments: ['int32', 'int32'], return: 'int32' } })` возвращает `{ lib, functions }`; `DynamicLibrary` с `getFunction`, `getSymbol`, `registerCallback`; `using handle = dlopen(...)` закрывает библиотеку в конце области.
  - Типы (канонические имена из `ffi.types` в 26.13): `void`, `bool`, `char`, `int8…int64`, `uint8…uint64`, `float`/`double` (`float32`/`float64`), `pointer`, `string`, `buffer`, `arraybuffer`, `function`. Короткие псевдонимы `i8…u64`, `f32/f64`, `ptr` в 26.13 тоже принимаются, но с 26.8.0 предпочтительны канонические (PR #65417); `int`, `size_t` — `ERR_INVALID_ARG_VALUE`. 64-битные целые и указатели возвращаются как `bigint` (проверено локально).
  - Строки копируются во временный UTF-8 с завершающим NUL; typed arrays и буферы передаются заимствованным указателем (во время вызова их нельзя отсоединять или менять размер); `toBuffer(ptr, len, false)` даёт небезопасное представление без копирования (третий аргумент — boolean `copy`, по умолчанию копирует; объект `{ copy: false }` даёт `ERR_INVALID_ARG_TYPE` — проверено на 26.13).
  - Пути вызова: трамплин V8 **Fast API** (≤ 8 аргументов, x86-64/AArch64 и др.), путь libffi с общим буфером, общий путь; выбор автоматический. Проверено локально на Node 26.13 (Windows 11): `kernel32!GetCurrentProcessId` через `node:ffi` ≈ 13,5–16 нс на вызов — достаточно дёшево для мелких вызовов.
  - Флаг: в 26.1.0–26.8.x модуль был за `--experimental-ffi`; с **26.9.0** включён по умолчанию (PR #65475), остался отключающий `--no-experimental-ffi`. Проверено на официальной сборке 26.13 под Windows: работает без флага (печатает ExperimentalWarning), с `--no-experimental-ffi` — `ERR_UNKNOWN_BUILTIN_MODULE`. Под `--permission` без `--allow-ffi` — `ERR_ACCESS_DENIED`. В Node 24 — `ERR_UNKNOWN_BUILTIN_MODULE`.
  - Колбэки: выполняются на создавшем их потоке, не должны бросать исключения и возвращать промисы; после `unregisterCallback`/`close()` нативный код не должен их вызывать; если поток-владелец исчез (например, завершённый Worker), не-void результаты заполняются нулями.
- **koffi** 3.3.7 (Niels Martignène, MIT): зрелый FFI в userland для Node ≥ 16 с готовыми бинарниками для Windows, Linux (glibc, musl), macOS, BSD, Android на x64 и ARM64 (на Linux больше архитектур); синхронные и асинхронные вызовы, колбэки (cdecl/stdcall), структуры и массивы по значению и по указателю. Выбор, если нужны Node 22/24 или возможности, которых нет в `node:ffi`.
- `ffi-napi`/`ref-napi` (последний релиз 2022) [устарело] — замена koffi или `node:ffi`.
- FFI или аддон: FFI не требует компилятора и сборки под каждую платформу, но ни одна сигнатура не проверяется (неверные типы = порча памяти), а время жизни указателей — вручную. Для библиотеки, которую вы отдаёте другим, — napi-rs/Node-API; FFI — для вызова существующей системной или вендорской библиотеки из приложения.

```js
// node:ffi (Node 26+, экспериментально): вызов функции libc (на Windows — 'msvcrt.dll')
import { dlopen } from 'node:ffi';
{
  using handle = dlopen('libc.so.6', {
    abs: { arguments: ['int32'], return: 'int32' },
  });
  console.log(handle.functions.abs(-42));      // 42; библиотека закроется в конце блока
}
```

```js
// koffi (Node ≥ 16): прототип в синтаксисе C (на Windows — koffi.load('msvcrt.dll'))
import koffi from 'koffi';
const libc = koffi.load('libc.so.6');
const abs = libc.func('int abs(int x)');
console.log(abs(-42));
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node-API](https://nodejs.org/api/n-api.html) | Node.js docs (v26) | Справочник Node-API, матрица версий, async work, TSFN, жизненный цикл env |
| [C++ addons](https://nodejs.org/api/addons.html) | Node.js docs | Основы аддонов, context-aware аддоны, поддержка Workers |
| [nodejs/node-addon-api](https://github.com/nodejs/node-addon-api) | Node.js project | Обёртка C++, документация по классам |
| [nodejs/node-addon-examples](https://github.com/nodejs/node-addon-examples) | Node.js project | Рабочие примеры, включая async work и TSFN |
| [Node-API tutorial site](https://nodejs.github.io/node-addon-examples/) | Node.js project | Учебный сайт по Node-API |
| [nodejs/abi-stable-node](https://github.com/nodejs/abi-stable-node) | Node.js project | Рабочая группа Node-API |
| [napi.rs](https://napi.rs/) | napi-rs (LongYinan) | Привязки на Rust, CLI, кросс-компиляция |
| [Announcing NAPI-RS v3](https://napi.rs/blog/announce-v3) | napi-rs, 2025-07-07 | v3: цель Wasm, новый TSFN, кросс-компиляция |
| [v2 → v3 migration guide](https://napi.rs/docs/more/v2-v3-migration-guide) | napi-rs | Ломающие изменения, ключи конфига, MSRV 1.88 |
| [napi-rs/napi-rs](https://github.com/napi-rs/napi-rs) | napi-rs | Репозиторий, релизы |
| [neon-rs.dev](https://neon-rs.dev/) | Neon project | Альтернативные привязки на Rust |
| [neon на docs.rs](https://docs.rs/neon/latest/neon/) | Neon project | Справочник API |
| [nodejs/node-gyp](https://github.com/nodejs/node-gyp) | Node.js project | Требования к тулчейну по ОС |
| [cmake-js/cmake-js](https://github.com/cmake-js/cmake-js) | cmake-js | Сборка аддонов на CMake |
| [prebuild/prebuildify](https://github.com/prebuild/prebuildify) | prebuild org | Встроенные prebuilds (давние релизы, но распространено) |
| [prebuild/node-gyp-build](https://github.com/prebuild/node-gyp-build) | prebuild org | Загрузчик для prebuildify |
| [FFI](https://nodejs.org/api/ffi.html) | Node.js docs (v26) | Полный API, правила безопасности, пути вызова, платформы |
| [Node.js 26.1.0](https://nodejs.org/en/blog/release/v26.1.0) | Node.js project, 2026-05 | Появление `node:ffi` (за флагом), BoundedChannel в diagnostics_channel |
| [nodejs/node#62072](https://github.com/nodejs/node/pull/62072) | Colin Ihrig (cjihrig) по данным GitHub API, 2026 | PR «add node:ffi module»; в release notes автором указан Paolo Insogna |
| [koffi.dev](https://koffi.dev/) | Niels Martignène | Документация koffi, платформы, бенчмарки |
| [Koromix/koffi](https://github.com/Koromix/koffi) | Niels Martignène | Репозиторий |
| [ffi-napi](https://www.npmjs.com/package/ffi-napi) | node-ffi-napi | Старый FFI [устарело]: замена koffi или `node:ffi` [не проверено] |
| [Permissions](https://nodejs.org/api/permissions.html) | Node.js docs | Permission Model: `--allow-worker`, `--allow-child-process`, `--allow-addons`, `--allow-wasi`, `--allow-ffi` |
| [nodejs/node#64221](https://github.com/nodejs/node/pull/64221) | Node.js core | ESM-импорт аддонов по умолчанию (26.5) |

## WebAssembly и WASI

**Ключевые выводы**
- `WebAssembly` встроен. ESM-импорт `.wasm` (фаза instance, `import * as M from './lib.wasm'`) работает **без флага с 24.5/22.19**. `import source mod from './lib.wasm'` / `import.source()` (source phase imports, 24.0) даёт `WebAssembly.Module` для своей инстанциации. Зарезервированные пространства `wasm-js:`/`wasm:` бросают `LinkError`.
- Экземпляр Wasm однопоточен; параллелизм — несколько Workers, каждый со своим экземпляром, по желанию с общей `WebAssembly.Memory({ shared: true })` (на SAB) и Atomics. Компилировать один раз (`WebAssembly.compile`) и отправлять `Module` воркерам через `postMessage` (модули клонируются).
- Цена границы. Проверено локально (Windows 11): тривиальный экспорт `add(i32, i32)` стоит ~3,4 нс на вызов в 24.17 и ~7 нс в 26.13 против ~0,4 нс на итерацию полностью встроенной JS-функции. Для крупных вызовов это неважно; в «болтливых» API и интерфейсах со строками доминирует копирование строк и объектов через линейную память. Проектировать Wasm-API над целыми буферами.
- Когда Wasm лучше нативного аддона: переносимость (один артефакт для всех ОС/архитектур, браузера и Node), изолированная память (ошибки не портят кучу JS, но могут испортить память самого модуля), нет компиляции при установке. Когда натив лучше: SIMD и потоки сверх возможностей Wasm, системные API, доступ к буферам Node без копирования, пиковая скорость. napi-rs v3 выпускает оба варианта из одного crate.
- `node:wasi` — **Stability 1**, поддерживает только `version: 'preview1'` или `'unstable'`, а документация прямо говорит, что это **не песочница** («file system sandboxing can be escaped»). `finalizeBindings()` (24.4) помогает делить память между воркерами. Под `--permission` WASI нужен `--allow-wasi`.
- **Component Model / WASI 0.2–0.3** в ядре Node нет. Использовать Bytecode Alliance **jco** 1.41.0: `jco transpile` превращает компонент в ES-модули; `@bytecodealliance/preview2-shim` — WASI 0.2 в Node и браузерах, `preview3-shim` — 0.3; стартовые worlds по умолчанию на WASI 0.3; CI на Node 22/24/26. `componentize-js` собирает компоненты из JS. Для недоверенного Wasm с настоящей изоляцией и лимитами ресурсов — встроить рантайм вроде Wasmtime (crate 50.0.1) вне процесса [не проверено].
- Тулчейны: Rust `wasm-bindgen` 0.2.130 / wasm-pack (в первую очередь для браузера), Emscripten для C/C++, AssemblyScript для синтаксиса в духе TS [не проверено].

```js
// Node ≥ 24.5 / 22.19: импорт без флага
import * as math from './math.wasm';
console.log(math.add(2, 3));

// Source phase (24.0+): модуль без инстанциации — для своих imports или воркеров
import source mathModule from './math.wasm';
const instance = await WebAssembly.instantiate(mathModule, {});
worker.postMessage({ mod: mathModule });       // WebAssembly.Module клонируется
```

```bash
npx @bytecodealliance/jco transpile component.wasm -o dist/component
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [ESM: Wasm modules](https://nodejs.org/api/esm.html#wasm-modules) | Node.js docs | Интеграция Wasm в ESM, source phase imports |
| [WASI](https://nodejs.org/api/wasi.html) | Node.js docs (v26) | API WASI preview1, оговорка о безопасности |
| [Node.js with WebAssembly](https://nodejs.org/en/learn/getting-started/nodejs-with-webassembly) | Node.js project | Введение в Wasm в Node |
| [WebAssembly/esm-integration](https://github.com/WebAssembly/esm-integration) | WebAssembly CG | Предложение об интеграции с ESM |
| [proposal-source-phase-imports](https://github.com/tc39/proposal-source-phase-imports) | TC39 (Guy Bedford, Luca Casonato) | `import source` |
| [nodejs/node#57038](https://github.com/nodejs/node/pull/57038) | Node.js core | Снятие флага с ESM-импорта Wasm |
| [bytecodealliance/jco](https://github.com/bytecodealliance/jco) | Bytecode Alliance | Тулчейн Component Model для JS |
| [The WebAssembly Component Model](https://component-model.bytecodealliance.org/) | Bytecode Alliance | Книга о Component Model |
| [wasi.dev](https://wasi.dev/) | WASI subgroup | Статус WASI 0.2/0.3 |
| [Speculative optimizations for WebAssembly](https://v8.dev/blog/wasm-speculative-optimizations) | V8 team | Инлайнинг и спекулятивные оптимизации Wasm |
| [wasm-bindgen guide](https://rustwasm.github.io/docs/wasm-bindgen/) | Rust and WebAssembly WG | Руководство wasm-bindgen |
| [Wasmtime docs](https://docs.wasmtime.dev/) | Bytecode Alliance | Изолированный рантайм Wasm |

## Когда уходить в натив

**Ключевые выводы**
- Порядок действий для CPU-кода на JS (сначала измерить, см. [performance.md](performance.md)):
  1. Исправить алгоритм и аллокации в JS.
  2. Убрать работу с главного потока (Piscina): задержка восстановится, даже если пропускная способность нет.
  3. Взять готовый нативный или Wasm-пакет (sharp, @node-rs/argon2, lightningcss, esbuild/SWC/Oxc).
  4. Написать на Rust через napi-rs (с фолбэком на Wasm) или на C++ через node-addon-api.
  5. FFI к существующей разделяемой библиотеке.
- Цена границы JS ↔ натив: преобразование аргументов, перекодировка строк (UTF-16 ↔ UTF-8) и маршалинг объектов часто дороже самой работы. Собирать в пакеты: передавать `Buffer`/typed arrays и делать целую работу за вызов. Поэтому Rust-инструменты (Rolldown, Oxc) переносят в натив весь конвейер и выставляют крупные API.
- Натив не отменяет правил цикла и пула: синхронный нативный вызов всё так же блокирует event loop; нужны async work или свои потоки.
- Что взвесить: сборки под каждую платформу (darwin-arm64, linux-x64-gnu/musl, linux-arm64, win32-x64/arm64), матрица CI, поверхность supply chain у install-скриптов, отладка падений, ABI Electron. Если V8 уже оптимизирует горячий цикл, нативная переписка часто даёт меньше 2x; большие выигрыши дают SIMD, многопоточность или зрелые нативные библиотеки.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [lovell/sharp](https://github.com/lovell/sharp) | Lovell Fuller | Образцовое распространение нативного аддона (libvips, бинарники под каждую платформу) |
| [napi-rs/node-rs](https://github.com/napi-rs/node-rs) | napi-rs | Замены на Rust (argon2, bcrypt, jieba, xxhash) |
| [rolldown/rolldown](https://github.com/rolldown/rolldown) | Rolldown team | Большая кодовая база на napi-rs с плагинным API на TSFN |
| [oxc-project/oxc](https://github.com/oxc-project/oxc) | Oxc team | Привязки napi-rs, wasm-playground |

## Статьи, доклады и справочники

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Understanding the Node.js event loop](https://nodesource.com/blog/understanding-the-nodejs-event-loop) | NodeSource | Разбор event loop |
| [A visual guide to the Node.js event loop](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop) | Vishwas Gopinath (Builder.io) | Наглядный разбор очередей и приоритетов |
| [Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) | Jake Archibald, 2015 | Задачи и микрозадачи (браузер, но модель переносится) |
| [HTML: Web application APIs](https://html.spec.whatwg.org/multipage/webappapis.html) | WHATWG | Определения event loop и microtask checkpoint |
| [Faster async functions and promises](https://v8.dev/blog/fast-async) | Maya Armyanova, Benedikt Meurer (V8), 2018 | Как устроены await и промисы; почему меньше тиков |
| [I'm not feeling the async pressure](https://lucumr.pocoo.org/2020/1/1/async-pressure/) | Armin Ronacher, 2020 | Backpressure и ограничение приёма (вне зависимости от языка) |
| [Node.js Design Patterns](https://www.nodejsdesignpatterns.com/) | Mario Casciaro, Luciano Mammino | Книга: async-поток управления, streams, масштабирование |
| [goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices) | Yoni Goldberg и др. | Обработка ошибок и продакшен-практики, включая ловушки async |
| [JavaScript Asynchronous Programming and Callbacks](https://nodejs.org/en/learn/asynchronous-work/javascript-asynchronous-programming-and-callbacks) | Node.js project | Основы async |
| [The Node.js Event emitter](https://nodejs.org/en/learn/asynchronous-work/the-nodejs-event-emitter) | Node.js project | Основы EventEmitter |
| [libuv releases](https://github.com/libuv/libuv/releases) | libuv | Release notes libuv |
| [NodeConf EU](https://www.youtube.com/@NodeConfEU) | NodeConf EU | Доклады о потоках, streams, диагностике |

Книги по Node — в [books.md](books.md).

## Локальный замер

Windows 11, 32 логических / 16 физических ядер. Node 24.17.0 (libuv 1.52.1, V8 13.6, napi 10); Node 26.12.0 / 26.13.0 (libuv 1.52.1, V8 14.6, napi 10) — для проверок только под 26. Это микробенчмарки: переносить соотношения, а не абсолютные числа.

| Проверка | Результат |
|---|---|
| Порядок `nextTick` и промисов на верхнем уровне | CJS: `nextTick > promise > microtask`; ESM: `promise > microtask > nextTick`; затем `timeout > immediate` (главный модуль); внутри I/O-колбэка `nextTick > promise > immediate > timeout` |
| `setTimeout(0)` против `setImmediate` в главном модуле | 33 из 40 запусков первым `immediate`, 7 — `timeout`: недетерминированно |
| Задержка цикла и ELU (интервал 100 мс с блоком, 2 с) | блок 0 мс: ELU 0,01, p99 23,7 мс; 20 мс: ELU 0,19, p99 38,3 мс; 80 мс: ELU 0,72, p99 96,9 мс. Пол ~15,6 мс — гранулярность таймера Windows |
| Насыщение пула libuv, 8× pbkdf2 + 1 readFile | последний/первый хэш: пул 2 → 4,1x, 4 → 2,3x, 8 → 1,5x, 16 → 1,3x; `readFile` готов через ~1070 / 590 / 260 / 26 мс |
| Ускорение пула воркеров, 32 CPU-задачи по ~420 мс | Piscina k=2 2,1x, k=4 3,4x, k=8 7,4x, k=16 13,7x, k=32 18,4x; Tinypool k=8 7,9x |
| Старт воркера | до первого сообщения ~28–30 мс; ~10,7 MiB RSS на простаивающий воркер |
| Мелкие задачи через Piscina (8 потоков) | ~117 мкс на задачу при 20 000 тривиальных задач: собирать в пакеты |
| `postMessage` `ArrayBuffer` на 64 MiB | clone ~73 мс против transfer ~0,44 мс (~165x); 200 тыс. мелких объектов клонируются ~540 мс |
| Гонка на SAB, 4 воркера × 1 млн инкрементов | обычный `a[0]++` потерял 67–73%; `Atomics.add` точен, ~2,3x медленнее |
| Backpressure, 250 MiB в медленный Writable | игнорирование `write()` → пиковый RSS 308 MiB; `pipeline()` → 109 MiB |
| Цена ALS, 5000 цепочек × 10 `await` | AsyncContextFrame (по умолчанию в 24+): без измеримых накладных (шум ±30%). `--no-async-context-frame`: существующий экземпляр ALS замедлил всю нагрузку на промисах в ~2,5–3,5 раза |
| Цена вызова | тривиальный экспорт Wasm ~3,4 нс (24.17), ~7 нс (26.13); `node:ffi` `GetCurrentProcessId` ~13,5–16 нс (26.13); встроенный JS ~0,4 нс на итерацию |
| Доступность `node:ffi` | 24.17: `ERR_UNKNOWN_BUILTIN_MODULE`; 26.12/26.13: импортируется без флага (по умолчанию с 26.9.0), с ExperimentalWarning; `abs(-42)` из `msvcrt.dll` через `node:ffi` и koffi 3.3.7 = 42 |
| Есть в 24.17 | `Atomics.pause`, `Atomics.waitAsync`, `SharedArrayBuffer.prototype.grow`, `Promise.try`, `AbortSignal.any` |

Методика бенчмарков — в [performance.md](performance.md) и [pipeline.md](pipeline.md); сравнение двух прогонов — `node ../scripts/bench_compare.mjs`.

## Антипаттерны

| Антипаттерн | Чем вредит | Исправление |
|---|---|---|
| CPU-тяжёлая работа в обработчике запроса (большой `JSON.parse`, синхронный crypto, ресайз изображений на JS) | Блокирует всех клиентов; p99 взрывается | Пул Piscina, потоковый парсер или нативный пакет; ограничить размер входа |
| Вызовы `*Sync` из fs/crypto/zlib/child_process на сервере | Блокируют цикл | Async-варианты; найти через `--trace-sync-io` |
| Катастрофический regex на пользовательском вводе (`(a+)*`, `(.*a){x}`) | ReDoS: один запрос замораживает процесс | Линейные regex, лимиты длины, RE2 (пакет `re2`), `indexOf` |
| Рекурсивный `process.nextTick` / циклы из сразу разрешающихся `await` | I/O голодает (цикл не доходит до poll) | Уступать через `setImmediate`/`scheduler.yield()` по бюджету времени |
| Worker на каждый запрос | ~30 мс и ~11 MiB на создание (локально); число потоков не ограничено | Фиксированный пул (Piscina/Tinypool) с ограниченной очередью |
| Неограниченная очередь пула (`maxQueue` без предела) под перегрузкой | Задержка и память растут без предела | `maxQueue: 'auto'`, 503/Retry-After, AbortSignal для брошенных запросов |
| Отправка больших графов объектов в воркеры | Доминирует structured clone (~540 мс на 200 тыс. объектов локально) | Typed arrays + transfer, идентификаторы, общая память |
| Ожидание, что экземпляры классов переживут `postMessage` | Прототипы и методы теряются | Простые данные + восстановление; `markAsUncloneable` для ловли ошибок |
| Обычные чтения/записи `SharedArrayBuffer` из нескольких потоков | Потерянные обновления (67–73% локально) | `Atomics.*`, Web Locks |
| `Atomics.wait` на главном потоке | Замораживает event loop | `Atomics.waitAsync` или сообщения |
| Игнорирование результата `write()` / `on('data')` → `write` | Взрыв памяти (17x в официальном тесте, 2,8x локально) | `pipeline()`, `await once(w, 'drain')` |
| Цепочки `.pipe()` без обработки ошибок | Утечка дескрипторов, зависшие потоки при ошибке | `pipeline` из `stream/promises` |
| `exec(userInput)` или `spawn(cmd, args, { shell: true })` | Инъекция команд; DEP0190 | `execFile`/`spawn` с массивом аргументов, без shell |
| Невычитанные stdout/stderr дочернего процесса | Дочерний процесс блокируется на полном пайпе | Вычитывать или `stdio: 'ignore'`/`'inherit'` |
| `UV_THREADPOOL_SIZE` задаётся в коде после старта | Может не подействовать | Задавать в env / Dockerfile / systemd |
| `Promise.all` по неограниченному массиву сетевых вызовов | Исчерпание сокетов и дескрипторов, баны за rate limit | p-limit/p-map с лимитом под размер пула |
| Промисы «выстрелил и забыл» без `.catch` | Необработанное отклонение роняет процесс (по умолчанию `throw`) | `await` или `.catch` с логированием; учёт фоновых задач |
| `async_hooks.createHook` для контекста или APM | Экспериментально, медленно, небезопасно | `AsyncLocalStorage`, `diagnostics_channel` |
| `als.enterWith()` в обработчиках запросов | Контекст протекает в чужую работу | `als.run()` |
| Node < 24 или `--no-async-context-frame` при активном ALS | Код на промисах медленнее в 2,5x и более (локально) | Node 24+ с AsyncContextFrame по умолчанию |
| `cluster` внутри контейнера на 1 CPU | Лишний IPC-хоп и память без параллелизма | Один процесс на контейнер; реплики |
| Workers, `vm` или `node:wasi` как песочница | Общий процесс, изоляцию можно обойти | Отдельные процессы или контейнеры, Permission Model |
| Аддоны с изменяемым глобальным состоянием | Гонки и падения при загрузке в нескольких Workers | Данные на окружение, cleanup hooks |
| Долгие задачи `napi_create_async_work` | Душат fs/dns/crypto на общем пуле | Свои потоки + thread-safe function |
| `ffi-napi`/`ref-napi` в новом коде | Не сопровождаются с 2022 | koffi или `node:ffi` |
| `AbortSignal` для очистки долгоживущих серверов, потоков, дочерних процессов | Устаревший приём (DEP0209) | `using`/`await using`; сигналы — для отмены |

Общие идиомы и обработка ошибок — в [idioms-patterns.md](idioms-patterns.md).

## Чеклист ревью

Используется на этапе ревью в [pipeline.md](pipeline.md).

**Event loop**
1. На путях запросов нет синхронного I/O и вызовов `*Sync` (`--trace-sync-io` в тестах чистый).
2. У каждого CPU-тяжёлого шага ограничен размер входа, и он либо работает в пуле, либо уступает цикл по бюджету времени.
3. Пользовательские regex и regex на пользовательском вводе проверены на ReDoS (нет вложенных квантификаторов и обратных ссылок на неограниченном вводе).
4. `JSON.parse`/`stringify` тел запросов ограничены лимитом размера тела.
5. Нет рекурсивного `process.nextTick`; для нарезки — `setImmediate`/`scheduler.yield()`.
6. Задержка цикла (p99) и ELU экспортируются как метрики; есть алерты или сброс нагрузки (`@fastify/under-pressure` или аналог).
7. Код не опирается на порядок `setTimeout(0)`/`setImmediate` в главном модуле и на CJS-специфичный порядок `nextTick`/промисов.

**Пул потоков libuv**
8. `UV_THREADPOOL_SIZE` задан через окружение, если сервис активно работает с fs/dns/crypto/zlib; значение обосновано.
9. Хэширование паролей (scrypt/argon2/bcrypt) и сжатие не могут задушить `dns.lookup`/fs (отдельный пул или ограниченная конкурентность).
10. Исходящий HTTP к немногим хостам использует кэш DNS или keep-alive пулы.

**Воркеры и пулы**
11. Воркеры берутся из пула, созданного один раз при старте; нет `new Worker` на запрос.
12. Очередь пула ограничена; перегрузка отвечает 503/Retry-After; задачи получают `AbortSignal`.
13. Сообщения — плоские данные; большие буферы передаются (`transferList`/`Piscina.move`), а не копируются; в transfer list нет `Buffer` из пула.
14. Общая память — только через `Atomics` или Web Locks; нет `Atomics.wait` на главном потоке.
15. `'error'`/`'exit'` обработаны; упавшие воркеры заменяются; для рискованных задач заданы `resourceLimits`.
16. Размер пула — от `os.availableParallelism()` и лимита CPU контейнера, не от `os.cpus().length`; мелкие задачи собраны в пакеты.

**Процессы**
17. Вызовы `child_process` — `execFile`/`spawn` с массивом аргументов и без shell; нет пользовательского ввода в `exec`.
18. stdout/stderr дочернего процесса вычитываются или игнорируются; `maxBuffer` достаточен; таймауты заданы; коды выхода и сигналы обработаны.
19. Стратегия многоядерности явная (реплики, cluster или воркеры с `reusePort`) и согласована с лимитами CPU.

**Async-поток управления**
20. Fan-out ограничен (p-limit/p-map/p-queue), и лимит совпадает с размером нижестоящего пула.
21. У каждого внешнего вызова есть дедлайн (`AbortSignal.timeout`), и сигнал вызывающего передаётся дальше (`AbortSignal.any`).
22. Нет висящих промисов (линтер: `@typescript-eslint/no-floating-promises`); фоновые задачи учтены, их ошибки логируются.
23. «Проверить и сделать» через `await` над общим состоянием защищено (мьютекс/lock, single-flight или атомарная операция в БД).
24. Ресурсы освобождаются через `using`/`await using` или `try/finally`; `AbortSignal` не используется как механизм освобождения (DEP0209).

**Streams**
25. Все цепочки потоков — через `pipeline` (промис-версия) с обработкой ошибок; нет `.pipe()` без очистки и `on('data')` → `write`.
26. Свои потоки уважают результат `push()`/`write()` и вызывают колбэки ровно один раз.
27. Конвертация Web/Node streams — один раз на границе.

**Контекст**
28. Контекст запроса — через `AsyncLocalStorage.run()`; нет `async_hooks.createHook`; свои пулы и очереди привязывают колбэки (`AsyncResource.bind`/`AsyncLocalStorage.snapshot()`).
29. Рантайм — Node ≥ 24 (AsyncContextFrame), если ALS на горячих путях; `--no-async-context-frame` не задан без причины.

**Натив, Wasm, FFI**
30. Аддоны используют Node-API (стабильный ABI) с явным `NAPI_VERSION`; прямые заголовки V8/libuv — только с обоснованием.
31. `napi_env` не используется вне своего потока; JS-колбэки из нативных потоков идут через thread-safe functions; долгая работа не сидит на пуле libuv.
32. Состояние аддона хранится на окружение (работает при загрузке в нескольких Workers); cleanup hooks зарегистрированы.
33. Распространение — пакеты под каждую платформу (`optionalDependencies` с `os`/`cpu`/`libc`) или встроенные prebuilds; установка работает с `--ignore-scripts`.
34. Сигнатуры FFI сверены с заголовками; время жизни и владение указателями задокументированы; буферы не отсоединяются во время вызова; использование `node:ffi` проверяет версию Node.
35. Wasm-интерфейсы принимают целые буферы, а не поэлементные вызовы; модули компилируются один раз и раздаются воркерам.
36. Флаги Permission Model (`--allow-worker`, `--allow-child-process`, `--allow-addons`, `--allow-wasi`, `--allow-ffi`) выдаются минимально, если используется `--permission`.

## Спорные места

- **Воркеры или больше процессов и реплик.** Collina и Platformatic выступают за потоки внутри одного процесса (общая память, быстрый перезапуск застрявшего воркера, меньше памяти, чем у N процессов) и публикуют цифры, где воркеры на SO_REUSEPORT обходят cluster в PM2 и не уступают подам на 1 CPU. Платформенные команды часто предпочитают один процесс на контейнер ради простоты и изоляции на уровне оркестратора. В бенчмарке вендора разница с обычными подами всего 3%; явный проигравший — маршрутизация через primary в стиле cluster. Мерить на своей нагрузке.
- **`UV_THREADPOOL_SIZE` = 4 по умолчанию.** Давние жалобы: слишком мало для серверов с активной работой с fs и crypto. В libuv 1.52 / Node 26 значение не изменилось. Увеличение помогает при насыщении (локально `readFile` под нагрузкой хэширования в 20 раз быстрее при 16 потоках), но мощности CPU не добавляет.
- **`process.nextTick` или `queueMicrotask`.** Гайд Node советует `setImmediate` «во всех случаях»; ядро и многие библиотеки всё ещё используют `nextTick`, чтобы выдать ошибку после подписки вызывающего. В ESM порядок относительно промисов другой (локальная проверка), поэтому код, который на него опирается, хрупок.
- **Нарезка или вынос.** Официальный гайд считает нарезку нормальной для простых задач; на практике уступающие циклы добавляют сложность и всё равно тратят CPU главного потока. Большинство экспертов теперь сразу берут пул для всего, что дольше нескольких мс.
- **Накладные ALS.** Старые статьи называют от 8% (Node 14, Kuzzle) до «30–50%». Это была реализация на async_hooks; с AsyncContextFrame (Node 24+) локальный тест не показывает измеримой цены [устарело для Node ≥ 24].
- **`node:ffi`, koffi или аддоны.** `node:ffi` убирает зависимость и быстр (путь Fast API), но экспериментален, есть только в Node 26+, а состояние флага менялось между релизами 26.x (за флагом в 26.1–26.8, по умолчанию с 26.9.0). koffi зрелый и работает на старых Node. Для библиотек со сложным владением или потоками правильным выбором остаются аддоны.
- **AsyncContext в языке.** Stage 2 с 2023 года; вопросы веб-интеграции (слушатели событий, удержание памяти) не пускают его на Stage 3. ALS Node останется практическим API ещё годы; проектировать код так, чтобы переменную контекста потом можно было заменить на `AsyncContext.Variable`.
- **Будущее cluster.** Не устарел, но SO_REUSEPORT (`reusePort`, 23.1/22.12) и оркестраторы закрывают большинство его сценариев на Linux. На Windows балансировки в стиле SO_REUSEPORT нет, поэтому там cluster остаётся актуальным.
