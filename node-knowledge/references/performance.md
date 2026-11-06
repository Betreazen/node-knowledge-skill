# Производительность Node.js

Справочник для ускорения кода на Node.js (JavaScript и TypeScript) и снижения его памяти в любой области: библиотеки, веб-сервисы, CLI, обработка данных, боты, игры, скрипты. Здесь есть порядок работы, правила честного бенчмаркинга (включая ловушку tier-up в JIT), таблица «симптом → техника → источник» для быстрого поиска, профилирование, бенчмарк-инструменты с точными форматами JSON для скриптового сравнения, внутренности V8, старт программы, техники на чистом JavaScript, память и GC, буферы, строки и JSON, потоки, HTTP, выход за пределы JS, таблица локальных замеров, разборы реальных случаев, чеклист ревью, антипаттерны и спорные места. Актуально на ноябрь 2026: Node 26 «Lithium» — Active LTS с 28 октября 2026 (26.13.0, V8 14.6), Node 24 «Krypton» — Maintenance LTS (24.22.2, V8 13.6), Node 22 «Jod» — Maintenance LTS (22.23.4, V8 12.4), Node 20 — EOL с апреля 2026; tinybench 6.2.3, mitata 1.0.34, Vitest 5.1.0 (API бенчмарков переписан в 5.0), bench-node 0.15.0, hyperfine 1.20.0. Локальные замеры сделаны на Node 24.17 (V8 13.6) под Windows 11 без тюнинга системы; читайте их как отношения, а не как абсолютные числа. Event loop, пул потоков libuv, воркеры и нативные расширения подробно разобраны в [concurrency-async-native.md](concurrency-async-native.md), HTTP-фреймворки — в [domains-server.md](domains-server.md), тестовые раннеры — в [testing.md](testing.md), валидаторы схем — в [typescript.md](typescript.md), упаковка CLI и SEA — в [domains-client.md](domains-client.md). Как этот файл используется в цикле оптимизации, описано в [pipeline.md](pipeline.md).

- [Метод: устранить работу → измерить → тюнить](#метод-устранить-работу--измерить--тюнить)
- [Симптом → техника → источник](#симптом--техника--источник)
- [Версии инструментов (ноябрь 2026)](#версии-инструментов-ноябрь-2026)
- [Профилирование](#профилирование)
- [Бенчмарки: mitata, tinybench, Vitest bench, bench-node, hyperfine](#бенчмарки-mitata-tinybench-vitest-bench-bench-node-hyperfine)
- [Внутренности V8, влияющие на скорость](#внутренности-v8-влияющие-на-скорость)
- [Старт программы](#старт-программы)
- [Техники на чистом JavaScript](#техники-на-чистом-javascript)
- [Память и GC](#память-и-gc)
- [Буферы, строки и JSON](#буферы-строки-и-json)
- [Потоки (streams)](#потоки-streams)
- [HTTP-сервер и клиент](#http-сервер-и-клиент)
- [Выход за пределы JS](#выход-за-пределы-js)
- [Локальные замеры](#локальные-замеры)
- [Разборы реальных случаев](#разборы-реальных-случаев)
- [Чеклист ревью производительности](#чеклист-ревью-производительности)
- [Антипаттерны](#антипаттерны)
- [Спорные места](#спорные-места)

---

## Метод: устранить работу → измерить → тюнить

Сначала профиль на реалистичных входах, потом правки. Порядок по убыванию отдачи:

1. убрать работу: другой алгоритм, кэш, батчинг, меньше I/O, меньше аллокаций;
2. измерить: профайлер на реалистичных данных, а не на игрушечном примере;
3. настроить горячую точку: формы объектов, структуры данных, отсутствие лишних копий;
4. только потом выносить её из JS: worker threads для параллельной CPU-работы, WebAssembly, N-API-аддон.

Бесплатный шаг доступен всегда: свежая LTS. Обновление 22 → 24 → 26 часто даёт больше, чем микротюнинг (Turboshaft, быстрый `JSON.stringify`, mutable heap numbers). После каждого обновления мажорной версии бенчмарки перезапускают: победители микробенчмарков меняются.

### Ключевые выводы

- Не оптимизируйте без профиля. Горячая точка почти всегда не там, где кажется.
- Микробенчмарк отвечает на вопрос «какое написание быстрее на этой версии движка». Будет ли польза, показывает только замер целиком: hyperfine для CLI, autocannon, oha или k6 для HTTP, телеметрия продакшена. Ускорение в 3 раза на участке, который занимает 2% профиля, даёт 1,3% общего выигрыша.
- Ловушки JIT, которые надо держать в голове при любом замере:
  - **Прогрев и tier-up.** Функция исполняется сначала в Ignition (интерпретатор), потом в Sparkplug, Maglev и Turbofan. Ранние сэмплы — из медленных уровней. Все инструменты прогревают, но с разным бюджетом.
  - **Удаление мёртвого кода (DCE).** Если результат не используется, Turbofan может выбросить работу. Потребляйте результат: `do_not_optimize(x)` в mitata, возврат значения в bench-node, запись в переменную модуля (sink) в tinybench и Vitest.
  - **Свёртка констант и вынос инвариантов из цикла.** Константные входы оптимизатор вычисляет заранее. Меняйте входы или читайте их из массива на уровне модуля.
  - **Переспециализация.** Микробенчмарк, который кормит функцию одной формой объекта, мономорфен; продакшен-код может быть полиморфным или мегаморфным. Подавайте реалистичную смесь форм.
  - **Шум GC.** Бенчмарки с массой аллокаций ловят scavenge и иногда major GC. Сравнивайте p50 и p99, а не только среднее. mitata умеет вызывать `gc()` между сэмплами (`.gc('inner')`, нужен `--expose-gc`).
  - **Разрешение таймера на Windows.** `process.hrtime.bigint()` и `performance.now()` тикают с шагом 100 нс (проверено локально на Node 24.17, Windows 11). У tinybench p50 функции примерно на 0,7 мкс вышел ровно 0,0007 мс, p75 — тоже 0,0007. Для работы короче микросекунды кладите внутренний цикл в задачу; mitata батчит сама.
- В отчёте указывайте: версию Node и V8 (`process.version`, `process.versions.v8`), ОС и CPU, флаги, версию инструмента, p50 и p99 (или p75), rme или доверительный интервал, число сэмплов. Не сравнивайте разные мажорные версии Node, не сказав об этом: V8 в 22 (12.4), 24 (13.6) и 26 (14.6) сдвигает микробенчмарки.
- Если разница меньше шума между прогонами, это не улучшение.

### Как бенчмаркать честно

**Tier-up зависит от числа вызовов, а не от времени.** Случай, воспроизведённый локально на Node 24.17 (Windows 11): `data.reduce((a, c) => a + c, 0)` по массиву из 10 000 целых.

| Способ замера | Результат |
|---|---|
| tinybench 6.2.2, `new Bench({ time: 300 })` | p50 **70,7 мкс** (так же с `hrtimeNow`, `runSync()`, `retainSamples`) |
| mitata 1.0.34 с `do_not_optimize` | p50 4,5 мкс, avg 6,27 мкс, max 191 мкс |
| Ручной цикл на `process.hrtime.bigint()` | около 72 мкс на вызов первые ~11 000 вызовов, потом **4,2–4,3 мкс** |
| tinybench с `time: 1000` (по умолчанию) | p50 4,30 мкс, но mean 10,09 мкс: 8% сэмплов из медленной фазы, распределение бимодальное |
| tinybench с `warmupIterations: 20_000` или `warmupTime: 2000` | p50 4,30 мкс, mean 4,48–4,55 мкс, 100% сэмплов в быстрой фазе |

Причина (найдена через `node --trace-opt`) — не накладные расходы таймера, не async-обёртка и не Windows. Внешняя функция `f` (`sink = data.reduce(cb, 0)`) компилируется Maglev только примерно после **11 000 вызовов**: строка «completed compiling … JSFunction f … (target MAGLEV)» появляется между 11 000-м и 12 000-м вызовом. До этого `Array.prototype.reduce` работает как builtin, который вызывает JS-колбэк 10 000 раз через обобщённый путь builtin→JS (около 7 нс на элемент). Когда `f` оптимизирована, оптимизатор инлайнит `reduce` и стрелочный колбэк в тесный цикл (около 0,43 нс на элемент) — скачок в 16–17 раз. Tier-up в V8 управляется бюджетами прерываний на функцию (числом исполненных байткодов этой функции), а не временем. Функции, у которой один вызов долгий, а собственный байткод короткий, нужно много вызовов, даже если колбэк внутри уже горячий. Порог «~11 000 вызовов» относится к этой функции на V8 13.6; публичной стабильной документации порогов нет.

Как с этим взаимодействуют инструменты:

- **tinybench ограничен временем**: прогрев `warmupTime: 250` мс / `warmupIterations: 16`, затем `time` (по умолчанию 1000 мс) / `iterations: 64`. При 72 мкс на вызов 250 мс прогрева и 300 мс замера — всего около 7600 вызовов, и все сэмплы приходятся на период до tier-up.
- **mitata почти не прогревает**: 2 вызова, и только чтобы решить, включать ли батчинг. Первый вызов занял 70 мкс, больше `batch_threshold` (65 536 нс), поэтому батчинга не было и каждый вызов стал сэмплом. За `min_cpu_time` 642 мс mitata собрала около 104 000 сэмплов, около 10% из них — медленная фаза. **p50 выживает** (4,5 мкс), **avg загрязнён** (6,27 мкс): mitata отбрасывает только 2 минимальных и 2 максимальных сэмпла.
- **Vitest 5** использует встроенный tinybench с теми же прогревами по умолчанию, ловушка та же.

Правила для каждого A/B-сравнения:

1. **Явный прогрев до замера**, независимо от инструмента: не меньше 20 000 вызовов, затем вызывать пачками, пока две соседние пачки по ≥ 1000 вызовов (или ≥ 100 мс) не совпадут в пределах ~2%; потолок — 50 000 вызовов или 5 с. Одной стабильности мало: медленная фаза до tier-up тоже стабильна, поэтому нижняя граница по числу вызовов обязательна. Для tinybench вместо этого ставьте `warmupIterations` ≥ 20 000 или `warmupTime` ≥ 2000 мс.
2. **Свежий процесс на каждый прогон**, порядок ABBA (A B B A A B B A A B), **5 прогонов на сторону**. Наблюдался порядковый эффект: в mitata прогон сразу после более медленного варианта был систематически примерно на 6% быстрее в 3 чередующихся прогонах. Вместе со 100-наносекундным шагом таймера на Windows это и есть причина для ABBA и ≥ 5 прогонов.
3. **Сравнивайте p50** каждого прогона. p50 устойчив к медленному префиксу и всплескам GC; mean и `hz` — нет.
4. **Автоматически помечайте загрязнённые прогоны**: `mean / p50 > 1,25`, или бимодальность (p75 и p25 отличаются больше чем в 3 раза). У tinybench нет `p25` — считайте его по сохранённым сэмплам (`retainSamples: true`).
5. **Разницу меньше ~5% на Windows считайте шумом**, если t-тест Уэлча по p50 отдельных процессов не показывает значимости.
6. **Потребляйте результат** (`do_not_optimize`, sink) и меняйте входы, иначе меряете пустую функцию.
7. При сомнении подтвердите уровень компиляции: `node --trace-opt` (ищите `completed compiling … <fn> (target MAGLEV|TURBOFAN)`) или `%GetOptimizationStatus(fn)` с `--allow-natives-syntax` (в bench-node это плагин `V8GetOptimizationStatus`). Natives syntax — только для диагностики.

Шаблон, на котором построен этот дизайн, — `benchmark/compare.js` из Node core: каждый вариант много раз запускается в свежем процессе, A и B чередуются, от процесса берётся одно итоговое число, распределения сравниваются t-тестом Уэлча, относительное изменение выводится вместе со значимостью (подробно — [в разделе про бенчмарки](#node-core-benchmarkcomparejs)).

```js
// bench.mjs — один прогон одной стороны: node --expose-gc bench.mjs A > bench/A/run1.json
import { bench, run, do_not_optimize } from 'mitata';
import { performance } from 'node:perf_hooks';
import { sumReduce, sumLoop } from './impl.mjs';

// Явный прогрев: минимум minCalls вызовов, затем до совпадения двух пачек в пределах tolerance.
function prewarm(fn, { minCalls = 20_000, batch = 1_000, tolerance = 0.02, maxCalls = 50_000, maxMs = 5_000 } = {}) {
  const start = performance.now();
  let calls = 0;
  let prev = Infinity;
  while (calls < maxCalls && performance.now() - start < maxMs) {
    const t0 = performance.now();
    for (let i = 0; i < batch; i++) fn();
    const perCall = (performance.now() - t0) / batch;
    calls += batch;
    if (calls >= minCalls && Math.abs(perCall - prev) / prev <= tolerance) break;
    prev = perCall;
  }
}

const data = Array.from({ length: 10_000 }, (_, i) => (i * 7) % 101);   // не константа
const impl = process.argv[2] === 'B' ? sumLoop : sumReduce;
const task = () => do_not_optimize(impl(data));

prewarm(task);
bench('sum 10k', task);              // одно и то же имя с обеих сторон — так скрипт сопоставит их
await run({ format: 'json' });       // JSON в stdout, наносекунды на итерацию
```

```bash
# 5 прогонов на сторону, порядок ABBA, каждый — в свежем процессе
mkdir -p bench/A bench/B; i=0
for side in A B B A A B B A A B; do
  i=$((i+1)); node --expose-gc bench.mjs "$side" > "bench/$side/run$i.json"
done
node path/to/skill/scripts/bench_compare.mjs bench/A bench/B --threshold 5
```

Скрипт [bench_compare.mjs](../scripts/bench_compare.mjs) читает JSON mitata, hyperfine или общий формат `{ unit, benchmarks: [{ name, median, q1, q3 }] }` (в него выгружают tinybench и прочие инструменты). Вердикт `faster`/`slower` ставится, только если медиана медиан сдвинулась больше порога и медианы всех прогонов одной стороны лежат строго по одну сторону от другой; иначе `same`. Код выхода 1 — есть регрессия.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js benchmark README](https://github.com/nodejs/node/blob/main/benchmark/README.md) | Node.js core | Как устроены бенчмарки ядра |
| [Writing and running benchmarks](https://github.com/nodejs/node/blob/main/doc/contributing/writing-and-running-benchmarks.md) | Node.js core | `compare.js`, прогоны в отдельных процессах, `--runs`, t-тест, R-скрипт |
| [Microbenchmarks fairy tale](https://mrale.ph/blog/2012/12/15/microbenchmarks-fairy-tale.html) | Vyacheslav Egorov, 2012 | Классика о том, почему микробенчмарки JS врут (DCE, LICM, OSR) |
| [Maglev](https://v8.dev/blog/maglev) | V8 team, 2023 | Четыре уровня компиляции, от которых зависит прогрев |

---

## Симптом → техника → источник

Основная таблица для поиска. Начинайте с симптома, который показал профайлер, бенчмарк или ревью. «Локально» — проверено на Node 24.17 под Windows 11, подробности в [локальных замерах](#локальные-замеры).

| Симптом | Техника | Источник |
|---|---|---|
| Непонятно, куда уходит CPU | `node --cpu-prof --cpu-prof-dir=prof app.js`, открыть в DevTools или speedscope; или `flame run app.js` из `@platformatic/flame` и прочитать `.md`-отчёт о горячих точках | [CLI: --cpu-prof](https://nodejs.org/api/cli.html#--cpu-prof), [@platformatic/flame](https://github.com/platformatic/flame) |
| В профиле в основном C++, GC или shared libraries, JS выглядит маленьким | `node --prof` + `node --prof-process` (раздел `[Summary]`); на Linux — `perf` с `--perf-basic-prof-only-functions --interpreted-frames-native-stack` | [Profiling Node.js](https://nodejs.org/en/learn/getting-started/profiling), [Flame graphs](https://nodejs.org/en/learn/diagnostics/flame-graphs) |
| Результаты микробенчмарка расходятся в 10 раз и больше между инструментами или прогонами | Проверить tier-up: прогрев ≥ 20 000 вызовов, `--trace-opt`, сравнить `mean/p50`; в tinybench — `warmupIterations: 20_000` | [Как бенчмаркать честно](#как-бенчмаркать-честно) (локально), [Maglev](https://v8.dev/blog/maglev) |
| Разница A/B в 2–6% меняет знак между прогонами | Свежий процесс на прогон, ABBA, ≥ 5 прогонов на сторону, t-тест Уэлча по p50 прогонов; < 5% на Windows — шум | [Writing and running benchmarks](https://github.com/nodejs/node/blob/main/doc/contributing/writing-and-running-benchmarks.md) |
| Нужно ловить регрессии в CI на шумных раннерах | CodSpeed simulation (`@codspeed/vitest-plugin` + `CodSpeedHQ/action@v5`) или сравнение в стиле Node core с `--max-regression` | [CodSpeed: Vitest](https://codspeed.io/docs/benchmarks/nodejs/vitest) |
| Бенчмарк подозрительно быстрый, почти как пустая функция | DCE: потреблять результат (`do_not_optimize`, sink), менять входы; в bench-node — `detectDeadCodeElimination: true` | [bench-node](https://github.com/RafaelGSS/bench-node) |
| Старые бенчмарки Vitest падают («bench is not a function») или `--outputJson` не распознаётся | Перейти на fixture-API Vitest 5; `writeResult` + `bench.from` + JSON-репортер | [Vitest: Benchmarking](https://vitest.dev/guide/benchmarking) |
| Горячая функция медленная, `--trace-deopt` показывает повторные деоптимизации | Стабилизировать типы аргументов и формы объектов в указанном месте; не менять представление полей | [React cliff](https://v8.dev/blog/react-cliff), [Shapes and ICs](https://mathiasbynens.be/notes/shapes-ics) |
| Горячий доступ к свойствам у разнородных объектов | Выровнять формы (те же поля, тот же порядок), разделить обобщённый код; мегаморфный доступ локально в 4,1 раза медленнее | [What's up with monomorphism?](https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html), локально |
| Объекты замедлились после удаления свойств | `= undefined` или `Map` вместо `delete` (локально в 8,8 раза) | [Fast properties](https://v8.dev/blog/fast-properties), локально |
| Числовые массивы медленные или занимают много памяти | Typed arrays; без дыр и смешанных видов элементов | [Elements kinds](https://v8.dev/blog/elements-kinds) |
| Повторные проверки членства в цикле | `Set`/`Map` (локально в 230 раз быстрее `includes` на 1000 элементах) | [Локальные замеры](#локальные-замеры) |
| Построение больших массивов медленное | Предвыделить (`new Array(n)` + запись по индексу) или `push`; не `Array.from({ length })` (локально в 50 раз медленнее) | [Локальные замеры](#локальные-замеры) |
| Горячий словарь с динамическими ключами | `Map` вместо объекта (локально в 1,47 раза) | [Локальные замеры](#локальные-замеры) |
| Сериализация JSON занимает основное время ответа | На Node 26 (V8 14.6) — сам `JSON.stringify` без `space` и replacer на простых данных (fast path V8; локально в ~2,4 раза быстрее `fast-json-stringify`); на Node ≤ 24 — `fast-json-stringify` или response-схемы Fastify | [JSON.stringify 2x](https://v8.dev/blog/json-stringify), [fast-json-stringify](https://github.com/fastify/fast-json-stringify) |
| Большой `JSON.parse` блокирует event loop | Потоковый разбор, меньший payload или разбор в пуле воркеров | [concurrency-async-native.md](concurrency-async-native.md#пулы-воркеров-piscina-tinypool-workerpool-poolifier), [Piscina](https://github.com/piscinajs/piscina) |
| Клонирование видно в профиле | Убрать клон (неизменяемость по соглашению), поверхностный spread или точечная копия; `structuredClone` — только ради корректности | [Локальные замеры](#локальные-замеры) |
| Разбор на регулярках медленный | Компилировать один раз (в 3,5 раза против `new RegExp` на вызов), `includes`/`startsWith` для литералов, якоря; проверить ReDoS | Локально; [Non-backtracking RegExp](https://v8.dev/blog/non-backtracking-regexp) |
| Память растёт при постоянной нагрузке | 3 heap snapshot + сравнение в DevTools или memlab; проверить кэши, слушатели, таймеры, хранилища ALS, непотреблённые тела ответов | [Using heap snapshot](https://nodejs.org/en/learn/diagnostics/memory/using-heap-snapshot), [memlab](https://github.com/facebook/memlab) |
| Процесс падает по OOM в контейнере | `--max-old-space-size-percentage=75` (или явные МиБ), `--heapsnapshot-near-heap-limit=2` для сбора улик | [CLI options](https://nodejs.org/api/cli.html) |
| Много scavenge, GC > 5% профиля у сервиса с массой аллокаций | Сократить аллокации; попробовать `--max-semi-space-size=32/64/128` и замерить req/s и RSS | [--max-semi-space-size](https://nodejs.org/api/cli.html#--max-semi-space-sizesize-in-mib), [NearForm: semi-space](https://nearform.com/digital-community/optimising-node-js-applications-the-impact-of-max-semi-space-size-on-garbage-collection-efficiency) |
| Память кучи доминирует в счёте (много маленьких подов) | Node со сжатием указателей (`platformatic/node-caged`), если каждый isolate укладывается в 4 ГБ | [We cut Node.js memory in half](https://blog.platformatic.dev/we-cut-nodejs-memory-in-half) |
| CLI долго стартует | `hyperfine -N`, `--cpu-prof` на старте, ленивые импорты, `module.enableCompileCache()` (локально в 2 раза для модуля на 9 МБ), бандл | [Module compile cache](https://nodejs.org/api/module.html#module-compile-cache), локально |
| Дорогая инициализация на каждом старте (таблицы, конфиг) | Startup snapshot (`--build-snapshot`) или SEA с `useSnapshot`/`useCodeCache` | [Single executable applications](https://nodejs.org/api/single-executable-applications.html) |
| Всплески p99, CPU не загружен | Гистограмма задержки event loop + ELU; найти синхронную работу через `--cpu-prof`; CPU-работу — в воркеры | [perf_hooks](https://nodejs.org/api/perf_hooks.html), [concurrency-async-native.md](concurrency-async-native.md#блокировка-event-loop-и-её-обнаружение) |
| Низкая пропускная способность, ELU около 1 | Профилировать горячие обработчики; снизить накладные расходы фреймворка (Fastify, схемы) и логирования (pino); масштабировать по ядрам | [Fastify benchmarks](https://fastify.dev/benchmarks/), [pino benchmarks](https://github.com/pinojs/pino/blob/main/docs/benchmarks.md) |
| Исходящие HTTP-запросы медленные или кончаются сокеты | Один undici `Pool`/`Agent` на апстрим; `undici.request` (локально в ~1,7 раза быстрее `fetch`); всегда потреблять тела | [undici](https://github.com/nodejs/undici), локально |
| Периодические 502 от балансировщика под нагрузкой | `server.keepAliveTimeout` больше idle-таймаута балансировщика; `headersTimeout` больше `keepAliveTimeout` | [server.keepAliveTimeout](https://nodejs.org/api/http.html#serverkeepalivetimeout) |
| Вызовы fs, crypto, zlib, dns выстраиваются в очередь | Пул потоков libuv перегружен: поднять `UV_THREADPOOL_SIZE` (переменная окружения, до старта), сократить число параллельных вызовов на пуле | [UV_THREADPOOL_SIZE](https://nodejs.org/api/cli.html#uv_threadpool_sizesize) |
| Потоковый конвейер медленный | `Transform` из `node:stream` (web streams локально в ~25 раз, стадии на async-генераторах в ~3,8 раза медленнее), крупнее чанки и `highWaterMark`, `cork`/`writev` | [Stream](https://nodejs.org/api/stream.html), локально |
| Потоковый конвейер раздувает память | Соблюдать backpressure, использовать `pipeline` | [Backpressuring in streams](https://nodejs.org/en/learn/modules/backpressuring-in-streams) |
| Сжатие — горячая точка | Ниже качество Brotli для динамики, gzip или zstd, предсжатая статика, вынос в пул потоков или воркер | [zlib](https://nodejs.org/api/zlib.html) |
| Логирование видно в профиле | pino с асинхронным destination или transport, уровень выше, без pretty print и сериализации больших объектов | [pino](https://github.com/pinojs/pino) |
| Числовое ядро медленное и после правок JS | WASM или аддон на napi-rs, вызываемый пакетами | [napi-rs](https://napi.rs/), [Maybe you don't need Rust](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html) |
| Хочется «бесплатной» скорости | Перейти на текущую LTS (26 «Lithium», V8 14.6) и перезапустить бенчмарки | [Node.js dist index](https://nodejs.org/dist/index.json), [V8 blog](https://v8.dev/blog) |
| Преобразования base64 и UTF-8 в профиле | Встроенные API (`Buffer`, `TextDecoder`, `Uint8Array.fromBase64` — есть в Node 26.13, нет в 24.17) с SIMD; без ручных циклов | [simdutf](https://github.com/simdutf/simdutf) |
| `Buffer` неожиданно удерживает память | Представления (`subarray`) и срезы пула держат родителя: долгоживущие маленькие буферы копировать | [Buffer](https://nodejs.org/api/buffer.html) |
| Нужно узнать уровень оптимизации функции | `--allow-natives-syntax` + `%GetOptimizationStatus`, плагин bench-node `V8GetOptimizationStatus`, `--trace-opt`/`--trace-deopt` | Локально; [bench-node](https://github.com/RafaelGSS/bench-node) |

---

## Версии инструментов (ноябрь 2026)

Версии проверены 6 ноября 2026 года по npm и `nodejs.org/dist/index.json`.

| Компонент | Версия, дата | Что важно |
|---|---|---|
| Node.js 26 «Lithium» | 26.13.0 (2026-10-28), V8 14.6.202.34 | Active LTS; 26.12.0 (2026-10-14) ещё была Current |
| Node.js 24 «Krypton» | 24.22.2 (2026-10-27), V8 13.6.233.17 | Maintenance LTS; локальные замеры — на 24.17.0 |
| Node.js 22 «Jod» | 22.23.4 (2026-10-20), V8 12.4.254.21 | Maintenance LTS; первая линия с Maglev по умолчанию (V8 12.x) [не проверено] |
| Node.js 25 | 25.9.0 (2026-03-31), V8 14.1 | EOL (нечётная линия) |
| Node.js 20 «Iron» | 20.20.2 (2026-03-24) | EOL с апреля 2026 |
| Node.js 27 | 27.0.0-alpha.0 (2026-10-29), V8 15.6 | Не релиз; новый график выпусков — в [toolchain.md](toolchain.md) |
| tinybench | 6.2.3 (2026-11-01) | Только ESM, `engines.node >= 20`; Vitest 5 зависит от `tinybench ^6.2.2` |
| mitata | 1.0.34 (2025-02-04) | Релизов нет около 21 месяца, API 1.0 стабилен, пакет не deprecated; перепроверяйте свежесть (порог — 18 месяцев) |
| Vitest | 5.1.0 (2026-11-02); 5.0.0 — 2026-09-03 | API бенчмарков переписан в 5.0; `--outputJson`/`--compare` удалены; нужен Node ≥ 22.12 |
| bench-node | 0.15.0 (2026-05-08) | Rafael Gonzaga (Node TSC); нужен `--allow-natives-syntax`; зависит от piscina 4 |
| benchmark (benchmark.js) | 2.1.4 (2017-03-28) | [устарело]: не поддерживается → tinybench, mitata, bench-node |
| CodSpeed | `@codspeed/vitest-plugin`, `@codspeed/tinybench-plugin`, `@codspeed/benchmark.js-plugin` 6.1.0 (2026-10-16) | Поддерживают Node 22/24/26 |
| hyperfine | 1.20.0 (Rust-бинарник) | npm-пакет `hyperfine` — посторонняя заглушка 2021 года |
| autocannon | 8.0.0 (2024-10-14) | Два года без релиза, но работает |
| 0x | 6.0.0 (2025-07-07) | Flamegraph на основе `--prof` |
| Clinic.js (`clinic`) | 13.0.0 (2023-06-28); `@clinic/doctor` 11.0.0, `@clinic/flame` 13.0.0 | [устарело]: README — «not being actively maintained» → `--cpu-prof`, `@platformatic/flame`, 0x |
| @platformatic/flame | 1.7.0 (2026-07-09) | Поддерживаемый flamegraph-CLI от Platformatic |
| @datadog/pprof | 5.20.0 (2026-10-07) | CPU- и heap-профили в формате pprof |
| memlab | 2.0.6 (2026-10-29) | Поиск утечек по heap snapshot (Meta) |
| speedscope / flamebearer | 1.25.0 (2025-12-03) / 2.2.0 (2026-10-15) | Просмотрщики профилей |
| undici | 8.12.4 (2026-11-05) | На нём построен встроенный `fetch` |
| fastify / express / hono | 5.12.8 (2026-11-02) / 5.3.0 (2026-10-09) / 4.13.16 (2026-11-01) | — |
| fast-json-stringify | 7.3.1 (2026-11-05) | Сериализатор по схеме, используется Fastify |
| msgpackr / cbor-x / protobufjs / avsc | 2.1.4 / 1.6.9 (2026-11-02) / 8.8.1 / 5.7.9 (2025-07) | Бинарные сериализаторы |
| piscina / tinypool | 5.3.2 (2026-08-28) / 2.2.0 (2026-09-13) | Пулы воркеров |
| pino | 10.4.0 (2026-10-02) | Логгер с низкими накладными расходами |
| node-gyp / @napi-rs/cli / koffi | 13.1.0 / 3.10.12 (2026-11-03) / 3.3.7 | Нативный код и FFI |
| Кэш компиляции модулей | `module.enableCompileCache()` с 22.8.0 (`NODE_COMPILE_CACHE` с 22.1.0); стабилен с **25.4.0**; `portable` — 24.12/25.0; `readOnly` — **26.8.0** | [node:module](https://nodejs.org/api/module.html); см. [старт программы](#старт-программы) |

---

## Профилирование

### Ключевые выводы

- **Встроенный CPU-профайлер V8 — первый выбор.** `node --cpu-prof [--cpu-prof-dir=dir] [--cpu-prof-interval=мкс] [--cpu-prof-name=…] app.js` при выходе пишет `CPU.${yyyymmdd}.${hhmmss}.${pid}.${tid}.${seq}.cpuprofile` (стабилен с v22.4.0 / v20.16.0). Интервал по умолчанию — 1000 мкс; для коротких прогонов ставьте `--cpu-prof-interval=100`. Работает на Windows без прав администратора. Каждый worker thread пишет свой файл (поле `tid`).
  - Файл — JSON `{ nodes, startTime, endTime, samples, timeDeltas }` (проверено локально), его легко обработать скриптом: собственное время функции `callFrame.functionName` — сумма `timeDeltas` по сэмплам, у которых этот узел — лист.
  - Открывается в Chrome DevTools (Performance → загрузить профиль), VS Code и speedscope.
- **Сэмплирующий heap-профайлер**: `--heap-prof [--heap-prof-dir] [--heap-prof-interval=байты]` (по умолчанию 512 КиБ) пишет `Heap.*.heapprofile` — какие стеки вызовов аллоцируют. Достаточно дёшев для нагрузочных тестов на стенде.
- `--diagnostic-dir=dir` задаёт каталог по умолчанию для `--cpu-prof`, `--heap-prof`, `--redirect-warnings`, heap snapshot и диагностических отчётов.
- **Интерактивно**: `node --inspect app.js` (или `--inspect-brk`, `--inspect-wait`), затем `chrome://inspect` → «Open dedicated DevTools for Node» → панели Performance и Memory. Программно: `Session` из `node:inspector/promises` → `Profiler.enable`, `Profiler.start`, `Profiler.stop` возвращает тот же JSON `.cpuprofile`. Удобно, чтобы снять профиль одного запроса или одной фазы.
- **`node --prof` + `node --prof-process isolate-0x…-v8.log`** (тиковый профайлер V8): текстовый отчёт с `[Summary]` (JavaScript / C++ / GC / shared libraries) и `[Bottom up (heavy) profile]`. Лучший быстрый способ увидеть долю C++ и GC. Пример из руководства Node: синхронный `crypto.pbkdf2Sync` блокировал event loop; переход на асинхронный `pbkdf2` поднял пропускную способность с 5,33 до 19,46 req/s.
- **Flamegraph**:
  - **`@platformatic/flame`** 1.7.0 (Node ≥ 22.6): `flame run server.js` снимает CPU- **и** heap-профиль одновременно через `@datadog/pprof` и пишет `.pb` (pprof), интерактивный WebGL-flamegraph в `.html` и **отчёт о горячих точках в `.md`, удобный для LLM** (`--md-format summary|detailed|adaptive`). `flame generate file.pb` строит отчёт из готового профиля; `--manual` + `SIGUSR2` или `flame toggle` профилирует окно времени; есть поддержка sourcemap. Заявленные накладные расходы — около 2,7% (Express) и 4,1% (Fastify). Хороший выбор по умолчанию для цикла агента: markdown читается напрямую.
  - **0x** 6.0.0: `npx 0x app.js` → HTML-flamegraph; `--collect-only` / `--visualize-only` для съёма в продакшене.
  - **Linux perf**: `perf record -e cycles:u -g -- node --perf-basic-prof --interpreted-frames-native-stack app.js`, затем `perf script > perfs.out` и FlameGraph Брендана Грегга (`stackcollapse-perf.pl | flamegraph.pl --colors=js`). Подключиться к работающему процессу: `perf record -F99 -p $(pgrep -n node) -g -- sleep 3`. Меньше всего накладных расходов у `--perf-basic-prof-only-functions`. `--perf-prof` пишет jitdump для `perf inject --jit`.
  - Просмотрщики: Chrome DevTools, speedscope 1.25.0, flamebearer 2.2.0, Firefox Profiler.
- **Clinic.js [устарело]**: `clinic doctor|flame|bubbleprof|heapprofiler` был классическим набором NearForm, но README теперь говорит: «Clinic.js is not being actively maintained… it may not work or the results you get may not be accurate». Последний релиз — 13.0.0 (июнь 2023). Замена: `--cpu-prof` + DevTools или speedscope, `@platformatic/flame`, 0x, а в роли «doctor» — `monitorEventLoopDelay` + ELU.
- **Продакшен**: `@datadog/pprof` 5.20.0 снимает pprof-профили CPU (wall) и кучи внутри процесса; на нём построено большинство непрерывных профайлеров APM-вендоров. `--heapsnapshot-signal=SIGUSR2` и `--cpu-prof` можно держать доступными, но не включёнными по умолчанию.
- **Трассировка оптимизаций и деоптимизаций**: `--trace-opt`, `--trace-deopt` (`--trace-deopt-verbose`), `--trace-opt-status`, `--trace-ic` (пишет в лог V8, смотреть в V8 system analyzer / Indicium). С `--allow-natives-syntax`: `%GetOptimizationStatus(fn)`, `%OptimizeFunctionOnNextCall(fn)`, `%PrepareFunctionForOptimization(fn)`, `%NeverOptimizeFunction(fn)`, `%DebugPrint(obj)` (показывает map и вид элементов). `--trace-opt` печатает строки вида `[completed compiling … <JSFunction f …> (target MAGLEV) - took …]` — так и была найдена ловушка tier-up (проверено локально). Natives syntax — только для диагностики, никогда не в продакшен.
- **GC**: `--trace-gc` (строка на сборку: scavenge или mark-compact, куча до и после в МБ, пауза в мс), `--trace-gc-nvp` — подробнее; `PerformanceObserver` с `entryTypes: ['gc']` даёт записи о GC внутри процесса.
- **Диагностический отчёт**: `process.report.writeReport()`, `--report-on-signal`, `--report-uncaught-exception` — JSON со статистикой кучи, хэндлами libuv и нативным стеком; полезен при зависаниях и нативных падениях.

```bash
node --cpu-prof --cpu-prof-dir=prof --cpu-prof-interval=100 app.js   # затем prof/*.cpuprofile в DevTools/speedscope
node --heap-prof --heap-prof-dir=prof app.js                         # кто аллоцирует
npx @platformatic/flame run server.js                                # pprof + HTML + markdown-отчёт
node --prof app.js && node --prof-process isolate-*.log > ticks.txt  # доля JS / C++ / GC
node --trace-opt --trace-deopt bench.mjs | grep -E "completed compiling|deoptimiz"
```

```js
// Профиль одной фазы программы, без флагов запуска
import { Session } from 'node:inspector/promises';
import { writeFile } from 'node:fs/promises';

const session = new Session();
session.connect();
await session.post('Profiler.enable');
await session.post('Profiler.start');
await runPhase();                                         // профилируемый участок
const { profile } = await session.post('Profiler.stop');
await writeFile('phase.cpuprofile', JSON.stringify(profile));
session.disconnect();
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [CLI: --cpu-prof](https://nodejs.org/api/cli.html#--cpu-prof) | Node.js docs | `--cpu-prof*`, `--heap-prof*`, `--diagnostic-dir`, схема имён, история стабильности |
| [Profiling Node.js applications](https://nodejs.org/en/learn/getting-started/profiling) | Node.js learn | `--prof` / `--prof-process` на примере pbkdf2 |
| [Flame graphs](https://nodejs.org/en/learn/diagnostics/flame-graphs) | Node.js learn | perf + FlameGraph, `--perf-basic-prof`, `--interpreted-frames-native-stack` |
| [inspector](https://nodejs.org/api/inspector.html) | Node.js docs | Программное профилирование через `inspector/promises` |
| [Diagnostic report](https://nodejs.org/api/report.html) | Node.js docs | Диагностический отчёт |
| [0x](https://github.com/davidmarkclements/0x) | David Mark Clements | Flamegraph одной командой |
| [@platformatic/flame](https://github.com/platformatic/flame) | Platformatic, 2025–2026 | CPU + heap в pprof, HTML-flamegraph, markdown-отчёт для LLM |
| [pprof-nodejs](https://github.com/DataDog/pprof-nodejs) | Datadog | pprof-профили (wall, heap) из Node |
| [node-clinic](https://github.com/clinicjs/node-clinic) | NearForm | [устарело]: не поддерживается → `--cpu-prof`, `@platformatic/flame`, 0x |
| [speedscope](https://www.speedscope.app/) | Jamie Wong | Просмотр `.cpuprofile` |
| [FlameGraph](https://github.com/brendangregg/FlameGraph) / [Flame graphs](https://www.brendangregg.com/flamegraphs.html) | Brendan Gregg | Скрипты для perf; как читать flamegraph |
| [DevTools: Performance](https://developer.chrome.com/docs/devtools/performance) | Chrome DevTools | Панель Performance (открывает и профили Node) |
| [V8: profile](https://v8.dev/docs/profile) | V8 | Внутренности тикового профайлера, `--prof` |
| [node-example-flamegraph](https://github.com/naugtur/node-example-flamegraph) | Zbyszek Tenerowicz | Учебный репозиторий для perf-flamegraph |

---

## Бенчмарки: mitata, tinybench, Vitest bench, bench-node, hyperfine

### Ключевые выводы

- **По умолчанию в пайплайне — mitata + явный прогрев**, сравнение `stats.p50`. Причины: p50 устойчив к медленной фазе до tier-up и к всплескам GC; `do_not_optimize` встроен; батчинг для функций короче микросекунды; JSON в наносекундах; `run()` возвращает объекты, текст разбирать не нужно. Прогоны сравнивает [bench_compare.mjs](../scripts/bench_compare.mjs): 5 прогонов на сторону в свежих процессах, порядок ABBA ([как бенчмаркать честно](#как-бенчмаркать-честно)).
- **tinybench** — когда нужны встроенные `rme`/`moe` или режимы конкурентности для async-кода. Обязательно `warmupIterations` ≥ 20 000 или `warmupTime` ≥ 2000.
- **Vitest 5** — когда бенчмарки должны жить рядом с тестами или запускаться под CodSpeed. API в 5.0 переписан полностью; задавайте прогрев в опциях.
- **bench-node** — когда нужен встроенный t-тест Уэлча. Только с `plugins: []` (или `detectDeadCodeElimination: true`): по умолчанию он намеренно меряет неоптимизированный код.
- **hyperfine** — целые команды и время старта; **autocannon**, oha, wrk2, k6 — HTTP-нагрузка.
- **benchmark.js** [устарело]: последний релиз 2.1.4 в 2017 году → tinybench (похожий API) или mitata.

### Форматы вывода для скриптового сравнения

Проверено локально, кроме отмеченного.

| Инструмент (версия) | Как получить JSON | Единицы | Положение | Разброс и ошибка | Сэмплы | Встроенная значимость A/B |
|---|---|---|---|---|---|---|
| tinybench 6.2.x | встроенного нет; сериализовать `bench.tasks[i].result` самому | **мс** (latency), ops/s (throughput) | `latency.{mean,p50,p75,p99,p995,p999,min,max}`, **нет p25** | `sd, variance, sem, moe, rme (%), mad, aad, df, critical` | `samplesCount`; сырые `samples` только с `retainSamples: true` | нет |
| mitata 1.0.34 | `run({ format: 'json' })` или `{ format: { json: { samples: true, debug: false } } }`, вывод через `print`; `run()` возвращает те же данные объектами | **нс на итерацию** | `stats.{avg,p25,p50,p75,p99,p999,min,max}` | нет (считать по `samples`) | `samples` (отсортированы; в батч-режиме — средние батчей), `ticks` — всего итераций | нет (текстовый `summary()` пишет «Nx faster» без теста) |
| Vitest 5.x | JSON-репортер (`--reporter=json --outputFile.json=…`) → `testResults[].assertionResults[].benchmarks[]`; файл на бенчмарк через `writeResult` | **мс** (latency), ops/s | статистика tinybench 6 + `rank` | как у tinybench | `samplesCount`; сырые только с `benchmark.retainSamples: true` | относительные проверки `toBeFasterThan(x, { delta })`, без p-value |
| bench-node 0.15.0 | `reporter: jsonReport` (stdout) или `reporter: false` и возвращаемый массив | **нс** (`minNS`, `maxNS`, гистограмма) и ops/s | JSON: `opsSec, minNS, maxNS, runsSampled`; объекты: `opsSec, opsSecPerRun[], histogram.{samples,min,max,sampleData[]}` | `ttest: true` → t-тест Уэлча против baseline, звёздочки | `histogram.sampleData` (нс на операцию, отсортированы) | **да** (`ttest: true`, 30 повторов) |
| hyperfine 1.20.0 | `--export-json f.json` (ещё `--export-csv`, `--export-markdown`) | **секунды** | `results[].{mean,median,min,max,user,system}` | `stddev` | `times[]` (каждый запуск), `exit_codes[]`, `memory_usage_byte[]` | нет |
| autocannon 8.0.0 | `--json` (stdout) | латентность **мс**, req/s, bytes/s | `latency.{mean,p50,p75,p90,p97_5,p99,p99_9,…}`, `requests.{average,p50,…}`, `throughput.*` | `stddev` | сырых сэмплов нет | нет |
| Node core `benchmark/compare.js` | CSV в stdout | ops/s | частоты по прогонам | `--analyze` → t-тест Уэлча, звёздочки; `--max-regression N` | по умолчанию 30 прогонов | **да** |

`bench_compare.mjs` напрямую читает JSON mitata, JSON-репортер Vitest 5 и `--export-json` hyperfine; tinybench и остальные инструменты выгружают в общий формат `{ "unit": "ns"|"us"|"ms"|"s", "benchmarks": [{ "name", "median", "q1", "q3", "mean"? }] }`. Строки Vitest с `fromStore: true` скрипт пропускает, при `mean/median > 1,25` предупреждает о возможном недогреве JIT, GC или деоптимизациях.

### mitata 1.0

- **API**: `import { bench, run, do_not_optimize, summary, group, barplot, boxplot, lineplot, compact } from 'mitata'`. `bench(name, fn)` возвращает builder: `.baseline(true)`, `.gc('inner' | 'once' | boolean)`, `.args(name, values)`, `.range(name, start, end, mult)`, `.dense_range(...)`, `.highlight(color)`, `.compact()`. Низкоуровневый `measure(fn, opts)` сразу возвращает объект `stats`.
- **Генераторная форма** даёт подготовку на бенчмарк: `bench('x', function* (state) { const data = make(); yield () => work(data); })`. Если отдать `{ [0]() { return fresh(); }, bench(input) { … } }`, mitata подаёт свежий аргумент на каждую итерацию и не включает его создание в замер.
- `do_not_optimize(value)` защищает от DCE. mitata меряет и пустую функцию (`context.noop.fn`, `.iter`), чтобы показать пол — локально около 0,1 нс.
- **Алгоритм** (по исходнику `src/lib.mjs`): один замеренный вызов, затем до `warmup_samples` (2) вызовов, если первый занял ≤ `warmup_threshold` (500 000 нс). Если один из них занял ≤ `batch_threshold` (65 536 нс), включается **батч-режим**: сэмпл — это `batch_samples` (4096) итераций, развёрнутых `batch_unroll` (4) раза, и сохраняется среднее на итерацию. Сэмплирование идёт, пока не набраны и `min_samples` (12), и `min_cpu_time` (642 мс; ×1,1 с отслеживанием кучи, ×2 с inner GC). Сэмплы сортируются; если их больше 12, отбрасываются 2 минимальных и 2 максимальных. Все умолчания `k_*` переопределяются в вызове `measure()`.
- **Следствия**: в батч-режиме p99 — это p99 средних по 4096 вызовам, хвост отдельных вызовов он прячет (для сравнения пропускной способности это нормально). Без батч-режима (вызовы дольше 65 мкс) каждый вызов — сэмпл, включая вызовы до tier-up.
- С `--expose-gc` `.gc('inner')` собирает мусор перед каждым сэмплом. Байты кучи на итерацию (`heap.{avg,min,max,total}`) выводятся, если доступно чтение кучи.
- **`run(opts)`**: `format: 'mitata' | 'json' | 'markdown' | 'quiet' | { json: { debug, samples } } | { mitata: { name } }`, `print: (s) => …`, `filter: RegExp`, `colors`, `throw`, `observe(trial)`. Возвращает `{ context, benchmarks }`.
- **Структура JSON**: верхний уровень `{ layout, benchmarks, context }`. `context = { now, arch, version, runtime, cpu: { name, freq }, noop: { fn, iter } }`. `benchmarks[i] = { kind: 'static' | 'args' | 'multi-args', alias, group, baseline, args, style, runs: [{ name, args, stats, error }] }`. `stats = { kind: 'fn' | 'iter' | 'yield', min, max, avg, p25, p50, p75, p99, p999, ticks, samples?, heap?, gc?, debug }`, всё в **нс на итерацию**; `ticks` — всего итераций (= сэмплы × 4096 в батч-режиме). `samples` отсортированы по возрастанию и есть только с `{ json: { samples: true } }`. stddev и rme нет — считайте по сэмплам.
- **Текстовый вывод**: `avg (min … max)`, `p75 / p99`, гистограмма `(min … top 1%)`, строка байтов при отслеживании кучи. `summary(() => { … })` печатает «Nx faster/slower than» относительно самого быстрого или `.baseline(true)`.
- **Свежесть**: последний релиз 1.0.34 — 4 февраля 2025 года (около 21 месяца назад). Пакет стабилен и широко используется (Bun, Deno и многие библиотеки), но перед опорой на новые возможности рантайма перепроверяйте.

```js
import { bench, run, do_not_optimize } from 'mitata';

bench('A', () => do_not_optimize(a(input)));
bench('B', () => do_not_optimize(b(input)));

const res = await run({ format: 'quiet' });               // объекты, ничего не печатается
const pick = ({ p25, p50, p75, p99, avg, min, max, ticks }) => ({ p25, p50, p75, p99, avg, min, max, ticks });
const rows = res.benchmarks.flatMap((b) => b.runs.filter((r) => r.stats).map((r) => ({ name: r.name, ...pick(r.stats) })));
console.log(JSON.stringify({ node: process.version, v8: process.versions.v8, unit: 'ns', rows }));
```

### tinybench 6

- **API**: `new Bench({ name, time, iterations, warmup, warmupTime, warmupIterations, timestampProvider, retainSamples, throws, signal, concurrency, threshold, setup, teardown, subtractTimerOverhead })`; `bench.add(name, fn, { beforeAll, beforeEach, afterEach, afterAll, retainSamples })`; `await bench.run()` или `bench.runSync()`; `console.table(bench.table())`. Только ESM, `engines.node >= 20`.
- **Умолчания** (по `dist/index.js` 6.2.2): `time: 1000` мс и `iterations: 64` — в последовательном режиме оба минимальны, прогон идёт, пока не выполнены оба; `warmup: true`, `warmupTime: 250` мс, `warmupIterations: 16`. Таймер — `performance.now()`, если не передать `timestampProvider: 'hrtimeNow'` (BigInt `process.hrtime`, разность берётся до конвертации) или `'auto'` (hrtime в Node, `Bun.nanoseconds` в Bun).
- **Один сэмпл = один вызов `fn` между двумя чтениями часов**, поэтому каждый сэмпл включает накладные расходы таймера и квантуется по его разрешению. `subtractTimerOverhead: true` вычитает откалиброванную цену чтения часов (несовместимо с `concurrency: 'task'`). При насыщении таймера срабатывает событие `'warning'` (`'zero-dominated' | 'low-distinct' | 'zero-mad'`). Для кода короче микросекунды кладите цикл внутрь `fn` и делите, или возвращайте из `fn` `{ overriddenDuration }`.
- **Результат** (`task.result`, состояние `'completed'`): `{ state, runtime: 'node', runtimeVersion, timestampProviderName, latency: Statistics, throughput: Statistics, period, totalTime }`. `Statistics = { mean, min, max, p50, p75, p99, p995, p999, sd, variance, sem, moe, rme, mad, aad, df, critical, samplesCount, samples? }`. `rme` — проценты: `100 * moe / mean`, `moe = critical * sem` (двусторонний 95% t Стьюдента). `mad` не масштабирован на 1,4826. Latency — в **мс**, throughput — в ops/s, `period = totalTime / runs`.
- **Ошибки**: задача, которая бросает, заканчивается с `state: 'errored'` и `error`; с `throws: true` отклоняется `run()`. Скрипт сравнения обязан проверять `state === 'completed'`.
- `concurrency: 'task'` запускает итерации одной задачи конкурентно (ограничение — `threshold`), `'bench'` — задачи конкурентно. Только для async I/O, никогда для CPU-микробенчмарков.
- Локально на сумме 1000 элементов (`time: 500`, `hrtimeNow`): `latency.p50 = 0.0007`, `p75 = 0.0007`, `p99 = 0.0008` мс, `rme ≈ 1,6%`, `samplesCount ≈ 686 тыс.`; квантование по 0,0001 мс (тик 100 нс на Windows) видно невооружённым глазом.

```js
// tinybench → общий формат bench_compare.mjs (p25 считается по сохранённым сэмплам)
import { Bench } from 'tinybench';

let sink;
const bench = new Bench({ time: 1000, warmupIterations: 20_000, timestampProvider: 'hrtimeNow', retainSamples: true });
bench.add('parse', () => { sink = parse(input); });
await bench.run();

const at = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
const benchmarks = bench.tasks.map((t) => {
  if (t.result.state !== 'completed') throw new Error(`${t.name}: ${t.result.state}`);
  const { p50, p75, mean, samples } = t.result.latency;
  const sorted = [...samples].sort((x, y) => x - y);
  return { name: t.name, median: p50, q1: at(sorted, 0.25), q3: p75, mean };
});
process.stdout.write(JSON.stringify({ unit: 'ms', node: process.version, v8: process.versions.v8, benchmarks }));
```

### Vitest 5: бенчмарки как фикстура

- **Ломающее изменение в 5.0 (3 сентября 2026)**: `bench` больше не экспортируется из `'vitest'` (старый код падает с «bench is not a function»); наборы `describe` + `bench` убраны; флаги Vitest 1–4 `vitest bench --outputJson <file>` / `--compare <file>` и опции `benchmark.outputJson` / `benchmark.compare` / `benchmark.reporters` удалены (локально `vitest bench --help` в 5.0.5 и 5.1.0 показывает только общие флаги тестов). [устарело]: любые руководства с `import { bench, describe } from 'vitest'` или `--outputJson` → API ниже.
- **Новая модель**: `bench` — фикстура тестового контекста, доступная только в файлах из `benchmark.include` (по умолчанию `**/*.{bench,benchmark}.?(c|m)[jt]s?(x)`; в других файлах вызов бросает исключение).
- **API** (по типам 5.0.5, проверено локально):
  - `bench(name, fn)` / `bench(name, options, fn)` регистрирует бенчмарк; `.run(opts?)` запускает один и возвращает `BenchResult` (`TaskResultCompleted` + данные рантайма + `name`).
  - `bench.compare(...registrations, opts?)` запускает их с **чередованием итераций** («to reduce environmental bias») и возвращает `BenchStorage` с `.get(name)`.
  - Опции — `FnOptions` tinybench (`beforeAll`, `beforeEach`, `afterEach`, `afterAll`, `retainSamples`) плюс `writeResult` и `perProject`. `writeResult` — путь относительно корня проекта с подстановкой `${projectName}`; файл перезаписывается при каждом успешном прогоне, при исключении в `fn` не пишется; CLI-флага нет. `perProject` собирает результаты всех проектов в одну таблицу в конце.
  - `bench.from(name, pathOrFn)` подставляет сохранённые `BaselineData` (функция может вернуть Promise) без запуска; в JSON-отчёте у такой строки `fromStore: true`.
  - `benchmark.enabled: true` запускает бенчмарки после обычных тестов в отдельном изолированном проекте; `vitest bench` запускает только бенчмарки (`-t` фильтрует по имени). Файлы бенчмарков идут по одному, тесты внутри файла — последовательно.
  - `benchmark.provider` (экспериментально): модуль, чей default export реализует `BenchmarkProvider { run(group: { test, config, registrations, options }) => Promise<BenchResult[]> }`. Так результаты может давать другой движок (mitata, CodSpeed).
  - Ключи конфига: `benchmark.{enabled, include, exclude, includeSource, retainSamples, provider, suppressExportGetterWarnings}`.
- **Форматы вывода** (проверено на 5.0.5 и 5.1.0):
  - Таблица в консоли: `name hz min max mean p75 p99 p995 p999 rme samples` плюс метки `fastest`/`slowest`; время в мс. Колонки медианы нет, хотя `p50` в данных есть.
  - Файл `writeResult` — это `BaselineData`: `{ latency: Statistics, throughput: Statistics, period, totalTime }` (статистика tinybench без `samples`).
  - JSON-репортер (`--reporter=default --reporter=json --outputFile.json=out/vitest.json`; по умолчанию Vitest 5 пишет файлы репортеров в `.vitest/`): у каждого теста в `testResults[].assertionResults[]` есть `benchmarks: [{ name: <имя теста>, tasks: [{ name, latency, throughput, period, totalTime, rank, perProject?, fromStore? }] }]`.
  - **Ловушка `rank`**: `rank` и метка `fastest` следуют за **средней латентностью**, а колонка `hz` — это **среднее пропускных способностей по сэмплам** (≈ среднее 1/latency). На шумных сэмплах короче микросекунды они расходятся: локально `reduce` получил `fastest` при hz 1 497 651, а `for-loop` показал hz 1 509 651. Сравнивайте `latency.p50` между повторными прогонами, а не `hz` и не `rank`.
  - Встроенный провайдер наследует прогрев tinybench по умолчанию (250 мс / 16 итераций), поэтому ловушка tier-up действует и здесь. Передавайте `warmupIterations`/`warmupTime` последним аргументом `bench.compare`.
- **CodSpeed**: `@codspeed/vitest-plugin` ≥ 6.0.0 поддерживает синтаксис фикстур Vitest 5: `plugins: [codspeedPlugin()]` в `vitest.config.mts`, затем `npm exec vitest bench` под `CodSpeedHQ/action@v5` с `mode: simulation` и `permissions: id-token: write` (OIDC).
- Раннер Vitest в целом — [testing.md](testing.md).

```js
// parse.bench.ts — запуск: vitest bench --run --reporter=json --outputFile.json=bench/A/run1.json
import { test, expect } from 'vitest';
import { parse } from '../src/parse';

const text = JSON.stringify({ items: Array.from({ length: 200 }, (_, i) => ({ id: i, tag: `t${i % 7}` })) });
let sink;

test('parse', async ({ bench }) => {
  const r = await bench.compare(
    bench('JSON.parse', () => { sink = JSON.parse(text); }),
    bench('custom', { writeResult: 'bench-results/custom-${projectName}.json' }, () => { sink = parse(text); }),
    { time: 1000, warmupIterations: 20_000 },              // BenchOptions tinybench
  );
  expect(r.get('JSON.parse')).toBeFasterThan(r.get('custom'), { delta: 0.05 });
  expect(r.get('custom').latency.p99).toBeLessThan(0.05);  // мс
});

test('vs stored baseline', async ({ bench }) => {
  await bench.compare(
    bench.from('custom@main', 'bench-results/custom-main.json'),
    bench('custom', () => { sink = parse(text); }),
  );
});
```

### bench-node

- **`node --allow-natives-syntax bench.js` обязателен**: без флага `suite.run()` бросает «bench-node module must be run with --allow-natives-syntax argument» (проверено локально).
- **Плагин по умолчанию — `V8NeverOptimizePlugin`**. README: «By default, it tells V8 to never optimize the benchmark function with `%NeverOptimizeFunction(bench.fn)` and consumes the returned value with a non-optimized `DoNotOptimize` helper». Значит, он отвечает на вопрос «какой код дешевле без оптимизации», **а не** «какой быстрее в продакшене». Локально на сумме 1000 элементов с умолчаниями `for-loop` дал 32 тыс. ops/s против 90 тыс. у `reduce` («reduce 2.80x faster»); с `plugins: []` оба выдали около 1,1–1,3 млн ops/s, в пределах ~10% друг от друга — как tinybench и mitata. Используйте `plugins: []` или `detectDeadCodeElimination: true`: эта опция отключает плагин по умолчанию и предупреждает, если бенчмарк быстрее пустой функции больше чем в `dceThreshold` (10) раз.
- **Опции набора**: `reporter` (`textReport` по умолчанию, `chartReport`, `prettyReport`, `htmlReport`, `jsonReport`, `csvReport`, свой или `false`), `benchmarkMode: 'ops' | 'time'`, `useWorkers` (каждый бенчмарк в worker thread), `plugins`, `minSamples` (10), `repeatSuite` (1), `ttest` (ставит `repeatSuite = 30` и сравнивает с baseline t-тестом Уэлча), `reporterOptions.{printHeader, labelWidth, alpha}`. На бенчмарк: `{ minTime: 0.05 с, maxTime: 0.5 с, repeatSuite, minSamples, baseline }`. Функция может принять `timer` для управляемого замера (`timer.start(); …; timer.end(n)`).
- **Вывод `jsonReport`**: массив `{ name, runsSampled, min, minNS, max, maxNS, plugins: [], opsSec }` (плюс `totalTime`, `totalTimeFormatted` в режиме `'time'`). **Перцентилей нет.** `suite.run()` возвращает более полные объекты: `{ name, iterations, opsSec, opsSecPerRun[], histogram: { samples, min, max, sampleData[] }, plugins, baseline }`; `sampleData` — отсортированные нс на операцию по сэмплам, из них считают p50 и p99.
- **`ttest: true`** (локально): 30 повторов, около 31 с на два маленьких бенчмарка; вывод «reduce (2.55x faster) ***» с легендой `* p<0.05, ** p<0.01, *** p<0.001`. Экспортируются `welchTTest(a, b)`, `compareBenchmarks(a, b, alpha)`, `getSignificanceStars(p)` — пригодятся в собственном скрипте сравнения.
- Число сэмплов по умолчанию мало (10–12 «runs sampled»), поэтому разброс одного прогона широкий.

```js
// bench.cjs — node --allow-natives-syntax bench.cjs
const { Suite } = require('bench-node');

const data = Array.from({ length: 1000 }, (_, i) => i);
const suite = new Suite({ plugins: [], reporter: false });   // без V8NeverOptimizePlugin, без текстового отчёта

suite.add('reduce', () => data.reduce((a, c) => a + c, 0));  // возврат значения защищает от DCE
suite.add('for-loop', () => { let s = 0; for (let i = 0; i < data.length; i++) s += data[i]; return s; });

suite.run().then((results) => {
  const rows = results.map(({ name, opsSec, histogram: { sampleData } }) => ({
    name, opsSec, p50ns: sampleData[Math.floor(sampleData.length / 2)],
  }));
  console.log(JSON.stringify(rows));
});
```

### Node core: benchmark/compare.js

- `node benchmark/compare.js --old ./node-main --new ./node-pr --runs 30 --filter <script> <module> > compare.csv`. `--analyze` использует `welchTest()` из histogram API — тот же t-тест Уэлча, что `benchmark/compare.R`; `--csv -`; `--max-regression N` завершает с кодом 1, если значимая регрессия больше N%. По умолчанию `--runs` — 30.
- Одна звёздочка — p < 0,05, две — около 1% риска, три — около 0,1%. Цитаты: «when considering 20 benchmarks it's normal that one of them will show significance, when it shouldn't»; «if there are no stars, then don't make any conclusions based on the improvement».
- Губернатор CPU — `performance` (`benchmark/cpu.sh fast`); привязка к ядрам — `--set CPUSET=…` (нужен `taskset`).
- Документация не говорит, чередуются ли прогоны. Дизайн, который стоит копировать: каждый вариант — много раз в свежем процессе, A и B вперемешку, одно итоговое число на процесс, t-тест Уэлча по распределениям процессов, относительное изменение вместе со значимостью.

### Таймеры и node:perf_hooks

- `process.hrtime.bigint()` — монотонные наносекунды в BigInt; вычитайте BigInt до конвертации. `performance.now()` — монотонные миллисекунды (double) от `performance.timeOrigin`. На Windows оба тикают с шагом 100 нс (проверено локально).
- `performance.mark()` / `measure()` + `PerformanceObserver` — для отрезков; `performance.timerify(fn)` порождает записи `'function'`; `perf_hooks.createHistogram()` (RecordableHistogram: `record`, `recordDelta`, `percentile(p)`, `mean`, `stddev`, `min`, `max`, `count`) — дешёвая гистограмма задержек внутри процесса.
- `perf_hooks.monitorEventLoopDelay({ resolution })` и `performance.eventLoopUtilization()` (ELU, от 0 до 1) — первые числа, которые смотрят на медленном сервере; подробно — [concurrency-async-native.md](concurrency-async-native.md#блокировка-event-loop-и-её-обнаружение).

```js
import { createHistogram, performance } from 'node:perf_hooks';

const h = createHistogram();
for (const job of jobs) {
  const t0 = process.hrtime.bigint();
  handle(job);
  h.record(process.hrtime.bigint() - t0);             // наносекунды
}
console.log({ p50: h.percentile(50), p99: h.percentile(99), elu: performance.eventLoopUtilization().utilization });
```

### Целые программы и HTTP-нагрузка

- **hyperfine** для CLI и старта: `hyperfine -N --warmup 3 --runs 30 --export-json out.json 'node a.js' 'node b.js'`. `-N` запускает без оболочки — это нужно при замере старта. hyperfine прогоняет сначала все запуски первой команды, потом второй, без чередования; для сравнений, чувствительных к дрейфу, вызывайте его несколько раз в порядке ABBA. JSON: `results[].{command, mean, stddev, median, user, system, min, max, times[], exit_codes[], memory_usage_byte[]}`, в секундах. Локально `node -e 0` = 59 мс ± 7 мс.
- **autocannon** (Matteo Collina): `autocannon -c 100 -d 30 [-p 10] --json URL`. Ключи JSON: `latency.{average, mean, stddev, min, max, p0_001 … p50, p75, p90, p97_5, p99, p99_9, p99_99, p99_999, totalCount}`, `requests.{average, mean, stddev, min, max, total, p50 …, sent}`, `throughput.*`, `errors, timeouts, non2xx, 1xx…5xx`. Латентность — в целых мс. Локально голый JSON-сервер на `node:http` дал около 15,4 тыс. req/s при p50 2 мс / p99 8 мс на `-c 50` — генератор нагрузки и сервер делили один CPU; используйте разные машины или закреплённые ядра.
- **oha** (Rust, TUI, вывод в JSON) и **wrk/wrk2** (C, скрипты на Lua; wrk2 держит постоянную частоту запросов и избегает coordinated omission) — для нагрузки, которую autocannon не создаст. **k6** (Grafana, движок на Go, скрипты на JS) — сценарии, пороги и гейты в CI (`--summary-export`, `handleSummary()`).
- **CodSpeed** — сервис бенчмарков в CI. Инструмент «simulation» считает инструкции на симуляторе CPU, поэтому результаты стабильны на общих раннерах; «walltime» — для кода с I/O на выделенных раннерах. Интеграции для Node: `@codspeed/vitest-plugin` (рекомендован), `@codspeed/tinybench-plugin`, `@codspeed/benchmark.js-plugin`, Playwright; `@codspeed/*` ≥ 6.0.0 поддерживают Node 22/24/26.

```bash
hyperfine -N --warmup 3 --runs 30 --export-json bench/A/run1.json 'node dist/cli.js --version'
autocannon -c 100 -d 30 --json http://127.0.0.1:3000/items > load.json
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [tinybench](https://github.com/tinylibs/tinybench) / [npm](https://www.npmjs.com/package/tinybench) | tinylibs | Исходники и README; версия 6.2.3 |
| [mitata](https://github.com/evanwashere/mitata) | evanwashere | README: генераторы, args, gc, JSON |
| [Vitest: Benchmarking](https://vitest.dev/guide/benchmarking) | Vitest team, 2026 | Бенчмарки-фикстуры Vitest 5, `bench.compare`, `writeResult`, `bench.from` |
| [Vitest: benchmark config](https://vitest.dev/config/benchmark) | Vitest team, 2026 | Опции `benchmark.*` |
| [Vitest 5](https://v5.cn.vitest.dev/blog/vitest-5) | Vitest team, 2026 | Пост о релизе: переписанные бенчмарки, пути репортеров в `.vitest/`, Node ≥ 22.12 |
| [bench-node](https://github.com/RafaelGSS/bench-node) | Rafael Gonzaga, 2024–2026 | NeverOptimize по умолчанию, обнаружение DCE, репортеры, t-тест |
| [Writing and running benchmarks](https://github.com/nodejs/node/blob/main/doc/contributing/writing-and-running-benchmarks.md) | Node.js core | `compare.js`, `--analyze`, `--max-regression`, t-тест Уэлча, звёздочки |
| [nodejs/node: benchmark](https://github.com/nodejs/node/tree/main/benchmark) | Node.js core | Исходники бенчмарков ядра как шаблоны |
| [perf_hooks](https://nodejs.org/api/perf_hooks.html) | Node.js docs | `performance`, `timerify`, `createHistogram`, `monitorEventLoopDelay`, ELU |
| [process.hrtime.bigint()](https://nodejs.org/api/process.html#processhrtimebigint) | Node.js docs | Монотонные наносекунды |
| [hyperfine](https://github.com/sharkdp/hyperfine) | David Peter | Время целой команды, `--export-json`, `-N` |
| [autocannon](https://github.com/mcollina/autocannon) | Matteo Collina | HTTP-нагрузка из Node, `--json` |
| [oha](https://github.com/hatoo/oha) | hatoo | Генератор HTTP-нагрузки на Rust |
| [wrk2](https://github.com/giltene/wrk2) | Gil Tene | Нагрузка с постоянной частотой, coordinated omission |
| [k6](https://grafana.com/docs/k6/latest/) | Grafana Labs | Скрипты, пороги, экспорт итогов |
| [CodSpeed: Node.js](https://codspeed.io/docs/benchmarks/nodejs) / [Vitest](https://codspeed.io/docs/benchmarks/nodejs/vitest) | CodSpeed | Интеграции и матрица версий; плагин для Vitest 5 и GitHub Action |
| [benchmark.js](https://github.com/bestiejs/benchmark.js) | Mathias Bynens, John-David Dalton | [устарело]: не поддерживается с 2017 → tinybench, mitata, bench-node |
| [bench_compare.mjs](../scripts/bench_compare.mjs) | скилл | Сравнение 5 чередующихся прогонов на сторону; вердикт `faster`/`slower`/`same` |

---

## Внутренности V8, влияющие на скорость

### Ключевые выводы

- **Уровни компиляции**: Ignition (интерпретатор) → Sparkplug (базовый JIT) → Maglev (оптимизатор среднего уровня) → Turbofan (верхний уровень). Maglev компилирует «roughly 10x slower than Sparkplug, and 10x faster than TurboFan»; Turbofan проходит JetStream в 4,35 раза быстрее, чем один Ignition; один Sparkplug даёт +45% на JetStream относительно Ignition. Maglev включён в Chrome M117 и в Node ≥ 22 (V8 12.4) [не проверено: соответствие версий Node]. Переход между уровнями управляется бюджетами обратной связи и прерываний на функцию (числом исполненных байткодов), а не временем — измеренное следствие в [разделе о честных бенчмарках](#как-бенчмаркать-честно).
- **Turboshaft**: с 2025 года весь JavaScript-бэкенд Turbofan и весь Wasm работают на Turboshaft — IR на основе CFG вместо Sea of Nodes; время компиляции «divided by 2». Для пользователя Node это более быстрая компиляция верхнего уровня, в коде менять ничего не нужно.
- **Скрытые классы (maps, shapes) и inline caches.** Объекты с теми же именами свойств в том же порядке делят один map. Место доступа к свойству кэширует увиденные maps: мономорфное (1) → полиморфное (2–4) → мегаморфное (> 4, глобальный stub cache, намного медленнее). Локально сумма `o.x` по 1000 объектам: 1 форма — 1,02 мкс, 8 форм — 4,20 мкс (**в 4,1 раза**). Правила: инициализируйте все поля в конструкторе или литерале в фиксированном порядке; не добавляйте свойства позже и в разном порядке; кормите горячие функции одной или немногими формами; для горячих записей берите классы или фабричные функции.
- **`delete` и словарный режим.** Удаление свойства (кроме последнего добавленного) обычно переводит объект в словарный режим (хеш-таблица). Локально чтение двух полей из 1000 объектов после `delete o.b` — 11,4 мкс против 1,29 мкс при `o.b = undefined` (**в 8,8 раза**). Используйте `undefined`/`null`, деструктуризацию с rest или `Map` для по-настоящему динамических ключей.
- **Представление полей.** V8 отслеживает представления полей (Smi, Double, HeapObject, Tagged). Смена поля со Smi на double или на объект обобщает map и может деоптимизировать зависимый код; пост «React cliff» (2019) показывает обрыв в 100 раз и больше из-за смены представления у замороженных объектов. С 2025 года «mutable heap numbers» позволяют обновлять double в слотах `let` контекста скрипта на месте (async-fs примерно в 2,5 раза, JetStream2 +1,6%); работает это только при стабильном типе переменной.
- **Виды элементов (elements kinds).** Массивы движутся в одну сторону: `PACKED_SMI → PACKED_DOUBLE → PACKED_ELEMENTS` и из `PACKED_*` в `HOLEY_*`, никогда обратно. `new Array(n)` создаёт дырявый массив; `-0`, `NaN`, `Infinity` превращают Smi-массив в double; чтение за `length` или из дыр заставляет проверять цепочку прототипов. Локально сумма по дырявому массиву из 10 тыс. элементов в коде Turbofan медленнее упакованного только в 1,16 раза, а заполнение `new Array(n)` по индексу **в 2,9 раза быстрее** `push` (нет роста). Не зацикливайтесь: избегайте дыр в часто читаемых массивах и смешения типов элементов.
- **Деоптимизации.** Оптимизированный код откатывается в интерпретатор, когда не сбывается предположение: новый map, выход за границы, смена типа, неправильное использование `arguments`. Циклы деопт/реопт видны как шум в `--trace-deopt` и как тяжёлые `(program)` / `(garbage collector)` в профиле. Лечится стабилизацией типов и форм в месте, которое называет деопт.
- **Строки.** В V8 есть последовательные строки, cons-строки (ropes, создаются `+`), sliced-строки (подстроки, разделяющие родителя; могут удерживать огромного родителя в памяти), thin и external. `+=` в цикле дёшев, потому что строит rope; «сплющивание» происходит при первом доступе по индексу или при передаче во многие builtins. Локально сборка строки из 10 тыс. кусков через `+=` **в 3,1 раза быстрее** `parts.join('')` (46 мкс против 143 мкс) и в 1,9 раза быстрее даже с учётом сплющивающего `charCodeAt`. Совет «используй join» для V8 [устарело] → `+=` или шаблонные строки. Удержание родителя sliced-строкой: `big.slice(0, 10)` может держать `big` живым; принудительно копируйте (`Buffer.from(s).toString()`, `s.split('').join('')` или `structuredClone`), только если heap snapshot это показал.
- **Замыкания и контексты.** Замыкание, захватывающее изменяемую переменную, выделяет объект контекста; захваченные переменные в горячих циклах (`forEach((v) => { s += v })`) медленнее локальной переменной в `for`. Локально сумма 10 тыс. целых: `for` по индексу 5,07 мкс, `reduce` 4,36 мкс, `for…of` 6,95 мкс, `forEach` 9,54 мкс.
- **try/catch** больше не мешает оптимизации (с Turbofan, 2017): локально одинаковый цикл внутри `try` — 5,28 мкс, без него — 5,56 мкс (шум). Совет «держать try/catch вне горячих функций» [устарело] → try/catch можно использовать свободно.
- **Явные подсказки компиляции**: `//# allFunctionsCalledOnLoad` в начале файла заставляет V8 жадно компилировать все его функции в фоновом потоке (Chrome 136; улучшение на 17 из 20 сайтов, в среднем −630 мс парсинга и компиляции в основном потоке). Это функция загрузки в браузере; в Node вместо неё используйте кэш компиляции ([старт программы](#старт-программы)) [не проверено: применимость к Node].
- **Быстрый путь `JSON.stringify`**: V8 13.8 сделал `JSON.stringify` «more than twice as fast» для простых данных без replacer, `space`, `toJSON` и целочисленных ключей. Node 24 поставляется с V8 13.6, поэтому быстрый путь приходит с Node 25/26 (V8 14.x). Проверено локально на Node 26.13 (V8 14.6) против 24.17, объект на 7 полей с вложенным объектом и массивом: `JSON.stringify` ~970 → ~250 нс (в ~3,9 раза быстрее), `fast-json-stringify` ~680 → ~610 нс. На Node 24 сериализатор по схеме выигрывал (1,4–1,75 раза), на Node 26 **`JSON.stringify` в ~2,4 раза быстрее него** — сериализатор по схеме ради одной скорости на Node 26 не нужен.
- **Сжатие указателей.** Официальные сборки Node не включают сжатие указателей V8. С IsolateGroups (Igalia, при поддержке Cloudflare) каждый isolate получает свою клетку (cage) на 4 ГБ; интеграция в Node (PR #60254) влита в октябре 2025, но всё ещё требует флага сборки `--experimental-enable-pointer-compression`. Platformatic публикует сборки Node 25 как образ `platformatic/node-caged` (`FROM platformatic/node-caged:25-slim`) и сообщает о сокращении кучи примерно на 50% ценой роста средней латентности на 2–4% (2,5% ≈ 1 мс при медиане 40 мс для чистого Node; p99 на 7% ниже) под k6 на 400 req/s. Не подходит, если одному isolate нужно больше 4 ГБ JS-кучи; backing store у ArrayBuffer и память аддонов лежат вне клетки. Проверка: `process.config.variables.v8_enable_pointer_compression`.

```js
// Формы объектов: один map на все записи горячего пути
class Point {
  constructor(x, y) { this.x = x; this.y = y; this.label = null; }   // все поля сразу, порядок фиксирован
}
const p = new Point(1, 2);
p.label = 'a';            // не меняет форму: поле уже есть
p.label = undefined;      // вместо delete p.label — объект остаётся быстрым
// node --allow-natives-syntax -e "const o={a:1};delete o.a;%DebugPrint(o)"  — увидеть dictionary map
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Maglev](https://v8.dev/blog/maglev) | V8 team, 2023 | Четыре уровня, соотношения скорости компиляции |
| [Sparkplug](https://v8.dev/blog/sparkplug) | Leszek Swirski, 2021 | Устройство базового компилятора |
| [Leaving the Sea of Nodes](https://v8.dev/blog/leaving-the-sea-of-nodes) | Darius Mercadier, 2025 | Turboshaft вместо Sea of Nodes; компиляция вдвое быстрее |
| [Mutable heap numbers](https://v8.dev/blog/mutable-heap-number) | V8 team, 2025 | Обновление double на месте, стабильность типов |
| [JSON.stringify](https://v8.dev/blog/json-stringify) | Patrick Thier, 2025 | Ускорение вдвое, условия быстрого пути |
| [Explicit compile hints](https://v8.dev/blog/explicit-compile-hints) | Marja Hölttä, 2025 | `//# allFunctionsCalledOnLoad` |
| [Fast properties](https://v8.dev/blog/fast-properties) | Camillo Bruni, 2017 | Встроенные, быстрые и словарные свойства |
| [Elements kinds](https://v8.dev/blog/elements-kinds) | Mathias Bynens, 2017 | Решётка видов элементов, holey и packed |
| [Shapes and Inline Caches](https://mathiasbynens.be/notes/shapes-ics) | Bynens & Meurer, 2018 | Формы и inline caches |
| [Prototypes](https://mathiasbynens.be/notes/prototypes) | Bynens & Meurer, 2018 | Оптимизация доступа к свойствам прототипа |
| [What's up with monomorphism?](https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html) | Vyacheslav Egorov, 2015 | Моно-, поли- и мегаморфизм подробно |
| [React cliff](https://v8.dev/blog/react-cliff) | Bynens & Meurer, 2019 | Обрыв производительности из-за представления полей |
| [Slack tracking](https://v8.dev/blog/slack-tracking) | Michael Stanton, 2020 | Как V8 выбирает размер объектов |
| [Pointer compression](https://v8.dev/blog/pointer-compression) | Igor Sheludko, Santiago Aboy Solanes, 2020 | Компромиссы сжатия указателей |
| [TurboFan](https://v8.dev/docs/turbofan) | V8 | Оглавление документации Turbofan |
| [We cut Node.js memory in half](https://blog.platformatic.dev/we-cut-nodejs-memory-in-half) | Platformatic, 2025 | Node со сжатием указателей (node-caged): память и латентность |
| [nodejs/build#4352](https://github.com/nodejs/build/issues/4352) | Node.js build WG | Запрос на официальную сборку со сжатием указателей |
| [Faster async functions and promises](https://v8.dev/blog/fast-async) | Maya Armyanova, Benedikt Meurer, 2018 | Цена `await` и как её снизили |

---

## Старт программы

### Ключевые выводы

- **Базовая линия**: `node -e 0` — 50–59 мс на локальной машине с Windows (hyperfine `-N`). Всё сверх этого — загрузка и компиляция модулей и работа верхнего уровня. Меряйте `hyperfine -N --warmup 3 'node cli.js --version'`; тяжёлые импорты ищите через `--cpu-prof` (кадры `compileFunction`, `(program)` и загрузчика модулей) или `NODE_DEBUG=module`.
- **Кэш компиляции модулей** (`module.enableCompileCache()` в начале входного файла или `NODE_COMPILE_CACHE=dir`) кэширует код V8 для модулей CJS, ESM и TypeScript на диске. Документация: «This may slow down the first load of a module graph, but subsequent loads of the same module graph may get a significant speedup».
  - Стабилен с v25.4.0. Опции: `directory`, `portable` (24.12/25.0), `readOnly` (26.8.0, для кэша, сгенерированного при сборке и поставляемого вместе с программой). Есть `module.flushCompileCache()` и `NODE_DISABLE_COMPILE_CACHE=1`.
  - Кэш привязан к версии Node и пишется при выходе; он может снизить точность V8-покрытия — в прогонах с coverage отключайте.
  - Локально `require()` бандла `typescript@6` на 9 МБ: 231,5 мс ± 6,4 → **115,6 мс ± 6,3 с кэшем (в 2 раза)**; размер кэша — 2,5 МБ.
  - Библиотеки и CLI могут вызывать `module.enableCompileCache?.()` сами; так делают npm, Yarn и CLI вокруг TypeScript [не проверено].
- **Ленивая загрузка**: редко нужные тяжёлые импорты переносите в путь кода, который их использует (`await import('x')` или `require` внутри функции). Сочетается с кэшем компиляции.
- **Бандл** CLI в один файл (esbuild, Rolldown, tsdown) снижает цену разрешения модулей по файловой системе, особенно на Windows, и делает кэш компиляции эффективнее.
- **Startup snapshot**: `node --snapshot-blob snap.blob --build-snapshot entry.js`, затем `node --snapshot-blob snap.blob main.js`; API `v8.startupSnapshot` (`addSerializeCallback`, `addDeserializeCallback`, `setDeserializeMainFunction`). «No longer experimental» с v25.4.0 / v24.13.1. Окупается, только когда инициализация (построение больших таблиц, разбор конфига) доминирует; не каждый модуль и нативный аддон безопасен для снапшота.
- **Single executable applications (SEA)**: с v25.5.0 `node --build-sea sea-config.json` собирает исполняемый файл напрямую (старый путь — `--experimental-sea-config` + `postject`). Поля конфига для старта: `useCodeCache: true` (компилирует главный скрипт в кэш кода V8 при сборке; исполнение не пропускается) и `useSnapshot: true` (запускает main при сборке; main обязан вызвать `v8.startupSnapshot.setDeserializeMainFunction()`; не работает с `mainFormat: "module"`). Для кроссплатформенной сборки оба должны быть `false`, и ни одно не сочетается с `useVfs`. Стабильность 1.1. Упаковка — в [domains-client.md](domains-client.md).
- **TypeScript во время выполнения**: снятие типов (`node file.ts`, включено по умолчанию с 23.6/22.18 [не проверено]) добавляет немного времени разбора на загрузку; кэш компиляции покрывает и TS-модули. Для горячих CLI поставляйте скомпилированный JS. Настройка — в [typescript.md](typescript.md).
- **Холодный старт serverless**: меньше бандл, ленивые импорты, кэш компиляции в образе развёртывания (режим `readOnly` в 26.8+), keep-alive-соединения, созданные на уровне модуля и переиспользуемые между вызовами.

```js
// cli.mjs — первая строка входного файла
import module from 'node:module';
module.enableCompileCache?.();                 // нет в старых Node — тихо пропускаем

const [cmd] = process.argv.slice(2);
if (cmd === 'report') {
  const { buildReport } = await import('./report.mjs');   // тяжёлая зависимость грузится только здесь
  await buildReport();
}
```

```bash
hyperfine -N --warmup 3 'node cli.mjs --version'
NODE_COMPILE_CACHE=.cache/node node cli.mjs --version     # кэш без правки кода
node --cpu-prof --cpu-prof-interval=100 cli.mjs --version # что грузится на старте
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Module compile cache](https://nodejs.org/api/module.html#module-compile-cache) | Node.js docs | API кэша, `portable`/`readOnly`, оговорки |
| [--build-snapshot](https://nodejs.org/api/cli.html#--build-snapshot) | Node.js docs | `--build-snapshot`, `--snapshot-blob` |
| [Startup snapshot API](https://nodejs.org/api/v8.html#startup-snapshot-api) | Node.js docs | `v8.startupSnapshot` |
| [Single executable applications](https://nodejs.org/api/single-executable-applications.html) | Node.js docs | `--build-sea`, `useCodeCache`, `useSnapshot` |
| [Joyee Cheung's blog](https://joyeecheung.github.io/blog/) | Joyee Cheung | Блог автора снапшотов и кэша компиляции в Node (require(esm), старт) |
| [Code caching for JavaScript developers](https://v8.dev/blog/code-caching-for-devs) | Leszek Swirski, 2019 | Как работает кэш кода V8 и что его инвалидирует |

---

## Техники на чистом JavaScript

### Ключевые выводы

Замеры — локальные: Node 24.17 / V8 13.6, mitata `p50` после явного прогрева (300 мс / 20 000 вызовов на бенчмарк), один процесс, `--expose-gc`. Отношения ориентировочные (±5–10% от прогона к прогону на Windows). Полная таблица — в [локальных замерах](#локальные-замеры).

- **Сначала алгоритмы и структуры данных.** Типичные ловушки: O(n²) из `includes`/`find` в цикле; повторный `sort`; `Array.shift()` как очередь (O(n) на сдвиг — берите индекс или кольцевой буфер); `JSON.parse(JSON.stringify())` для клонирования; `reduce` со spread-аккумулятором (`(acc, x) => ({ ...acc, [x.k]: x })` — это O(n²)).
- **Поиск**: `Set.has` — 3,3 нс против 765 нс у `Array.includes` на 1000 целых (**в 230 раз**). Для повторных проверок членства — `Set`/`Map`.
- **Динамические ключи**: `Map` в 1,47 раза быстрее объекта на 1000 вставок и поисков строковых ключей.
- **Массивы**: `new Array(n)` + запись по индексу — 10,1 мкс, `push` — 29,0 мкс, `Array.from({ length: n }, fn)` — **507,7 мкс** (в 50 раз медленнее). Предвыделяйте, когда размер известен.
- **Клонирование**: spread для поверхностной копии 4 полей — 15,8 нс, `Object.assign` — 22,3 нс. Глубокая копия маленького объекта: JSON-цикл — 0,96 мкс, `structuredClone` — 1,99 мкс. `structuredClone` нужен ради корректности (Date, Map, циклы), а не скорости; лучше вообще не клонировать в горячем пути (`structuredClone` в 126 раз дороже spread).
- **Регулярки**: `String.includes` — 2,82 мкс, вынесенный литерал регулярки — 3,66 мкс, `new RegExp()` на каждый вызов — 12,92 мкс (в 3,5 раза). Компилируйте один раз; для литералов — `includes`/`startsWith`.
- **Избегайте мегаморфных горячих путей.** Функции, принимающие «любой объект» (обобщённые сериализаторы, ORM, логгеры), становятся мегаморфными; специализируйте их генерацией кода (`fast-json-stringify`, `ajv.compile`) или отдельными функциями на форму.
- Предпочитайте `class` или фабричные функции со всеми полями сразу; не добавляйте поля условно после создания.
- **Числа**: typed arrays (`Float64Array`, `Int32Array`) хранят элементы без упаковки и упакованы по построению.
- В горячем коде избегайте `arguments`, `with`, `eval` и смены прототипа живых объектов (`Object.setPrototypeOf`).
- **Цена промисов**: каждый `await` стоит минимум одной микрозадачи; `async`-функция, которая ничего не ждёт, всё равно выделяет промис. В тесных циклах над данными в памяти оставайтесь синхронными; асинхронную работу батчите (`Promise.all` по чанкам), а не ждите поэлементно.
- **Кэширование**: мемоизируйте чистые дорогие вызовы ограниченным LRU (`lru-cache`); кэшируйте скомпилированные регулярки, экземпляры `Intl.*Format` (их создание дорого), валидаторы схем (`ajv.compile` один раз), подготовленные SQL-запросы.
- **Ошибки**: создание `Error` захватывает стек (`Error.stackTraceLimit`, по умолчанию 10); не используйте исключения для управления потоком в горячем пути. Сам `try` без броска бесплатен.
- Мелочи вроде `for` против `reduce` против `for…of` дают до 2,2 раза и важны только в доказанно горячих циклах. Идиомы — в [idioms-patterns.md](idioms-patterns.md).

```js
const WORD = /\b\w+\b/g;                                   // одна регулярка на модуль
const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });   // форматтер — один раз
const known = new Set(knownIds);                           // O(1) вместо Array.includes

export function summarize(lines) {
  const counts = new Map();                                // динамические ключи — Map
  for (const line of lines) {
    for (const [w] of line.matchAll(WORD)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const out = new Array(counts.size);                      // размер известен — предвыделяем
  let i = 0;
  for (const [w, n] of counts) out[i++] = { w, n, known: known.has(w), label: fmt.format(n) };
  return out;
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [nodejs-bench-operations](https://github.com/RafaelGSS/nodejs-bench-operations) | Rafael Gonzaga | Множество операций Node, измеренных по версиям |
| [Maybe you don't need Rust and WASM to speed up your JS](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html) | Vyacheslav Egorov, 2018 | Оптимизация на чистом JS обгоняет переписывание на WASM |
| [Optimizing JavaScript](https://romgrk.com/posts/optimizing-javascript) | Rom Grk, 2024 | Широкое современное руководство с объяснениями V8 |
| [v8-perf](https://github.com/davidmarkclements/v8-perf) | David Mark Clements | Заметки о характеристиках производительности V8 |
| [lru-cache](https://github.com/isaacs/node-lru-cache) | Isaac Z. Schlueter | Ограниченный LRU-кэш |

---

## Память и GC

### Ключевые выводы

- **Поколенческая куча (Orinoco).** Молодое поколение собирает параллельный Scavenger (копирование между полупространствами); старое — Mark-Compact с конкурентной маркировкой, параллельным уплотнением и конкурентной или ленивой очисткой. Короткоживущие объекты дёшевы; объекты, пережившие два scavenge, переносятся в старое поколение и стоят дороже позже. `--minor-ms` (mark-sweep для молодого поколения) есть, но экспериментален.
- **Пределы кучи**: `node -e "console.log(v8.getHeapStatistics().heap_size_limit/2**20)"` → 4288 МиБ на локальной машине с 64 ГБ. Задавайте `--max-old-space-size=МиБ` или (новее) `--max-old-space-size-percentage=N` — процент доступной системной памяти, имеет приоритет над `--max-old-space-size`. В контейнерах ставьте явно около 75% лимита памяти, чтобы V8 собирал мусор активнее до прихода OOM killer.
- **Размер молодого поколения**: `--max-semi-space-size=МиБ`. Документация: «may improve throughput … at the cost of more memory»; молодое поколение = 3 × semi-space, то есть +1 МиБ semi-space = +3 МиБ кучи; значение по умолчанию зависит от лимита памяти и меньше 16 МиБ при лимите ≤ 2 ГиБ; документация советует пробовать 16/32/64/128. NearForm намерил 14,5 → 17,4 req/s (+20%) при 128 МиБ и 18,5 (+27%) при 256 МиБ на приложении с массой аллокаций [не проверено]. Пробуйте, когда `--trace-gc` показывает частые scavenge, а `(garbage collector)` в профиле больше ~5%.
- **Измерение памяти**: `process.memoryUsage()` → `{ rss, heapTotal, heapUsed, external, arrayBuffers }` (Buffer живут в `external`/`arrayBuffers`, вне JS-кучи); `process.memoryUsage.rss()` дешевле; `v8.getHeapStatistics()`, `v8.getHeapSpaceStatistics()`; `--trace-gc`; записи `gc` в `PerformanceObserver`.
- **Heap snapshot**: `v8.writeHeapSnapshot([file])` (синхронный, блокирует event loop, требует ещё примерно размер кучи в памяти), `--heapsnapshot-signal=SIGUSR2`, `--heapsnapshot-near-heap-limit=N` (стабилен с v25.4.0 / v24.13.1 / v22.22.1). Сравнивайте снимки в DevTools (вид Comparison, «Objects allocated between snapshots», retainers). В 2023 году V8 сильно ускорил создание снимков.
- **Порядок поиска утечки**:
  1. подтвердить рост при постоянной нагрузке (`heapUsed` после принудительного GC с `--expose-gc` на стенде);
  2. снять 3 снимка с интервалом;
  3. найти объекты, растущие монотонно, и их цепочки удержания;
  4. **memlab** (Meta, 2.0.6) автоматизирует поиск утёкших объектов между снимками, есть CLI `memlab analyze`;
  5. сэмплирование `--heap-prof` показывает, *откуда* идут аллокации.
- **Типичные утечки в Node**: неограниченные кэши на `Map` (берите LRU с максимумом, например `lru-cache`); слушатели, добавляемые на каждый запрос (`MaxListenersExceededWarning`); замыкания, удерживаемые таймерами и интервалами; хранилища `AsyncLocalStorage` с большими объектами; глобальные массивы запросов; sliced-строки и представления `Buffer.slice`/`subarray`, держащие большого родителя; непотреблённые тела HTTP-ответов (undici: всегда потребляйте или вызывайте `body.dump()`/отмену).
- **Давление аллокаций** видно как множество scavenge. Снижайте его: переиспользуйте объекты в горячих циклах, избегайте замыканий на каждый вызов и spread/rest в горячих путях, берите typed arrays для числовых данных, стримьте вместо буферизации целых payload.
- `WeakRef`/`FinalizationRegistry` — не механизм вытеснения из кэша с предсказуемым временем (недетерминированы). `WeakMap` правилен для «метаданных, привязанных к чужому объекту».

```bash
node --max-old-space-size-percentage=75 --heapsnapshot-near-heap-limit=2 --diagnostic-dir=/tmp/diag server.js
node --trace-gc app.js 2>&1 | grep -c Scavenge             # сколько scavenge за прогон
node --max-semi-space-size=64 server.js                    # только с замером req/s и RSS до и после
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Trash talk](https://v8.dev/blog/trash-talk) | Peter Marshall, 2019 | Обзор Orinoco: scavenger, mark-compact, конкурентность |
| [Parallel scavenger](https://v8.dev/blog/orinoco-parallel-scavenger) | Lippautz et al., 2017 | Параллельный scavenger |
| [Concurrent marking](https://v8.dev/blog/concurrent-marking) | Ulan Degenbaev et al., 2018 | Конкурентная маркировка |
| [Speeding up V8 heap snapshots](https://v8.dev/blog/speeding-up-v8-heap-snapshots) | V8 team, 2023 | Почему снимки были медленными и что исправили |
| [--max-semi-space-size](https://nodejs.org/api/cli.html#--max-semi-space-sizesize-in-mib) | Node.js docs | Размер semi-space и порядок подбора |
| [NearForm: max-semi-space-size](https://nearform.com/digital-community/optimising-node-js-applications-the-impact-of-max-semi-space-size-on-garbage-collection-efficiency) | NearForm | Цифры подбора semi-space |
| [nodejs/node#42511](https://github.com/nodejs/node/issues/42511) | Node.js core | Обсуждение размера semi-space |
| [Memory diagnostics](https://nodejs.org/en/learn/diagnostics/memory) | Node.js learn | Оглавление диагностики памяти |
| [Using heap snapshot](https://nodejs.org/en/learn/diagnostics/memory/using-heap-snapshot) | Node.js learn | Порядок работы с heap snapshot |
| [Using GC traces](https://nodejs.org/en/learn/diagnostics/memory/using-gc-traces) | Node.js learn | Как читать `--trace-gc` |
| [v8 module](https://nodejs.org/api/v8.html) | Node.js docs | `writeHeapSnapshot`, статистика кучи, `setHeapSnapshotNearHeapLimit` |
| [memlab](https://github.com/facebook/memlab) | Meta | Поиск утечек |
| [DevTools: memory problems](https://developer.chrome.com/docs/devtools/memory-problems) | Chrome DevTools | Heap snapshot, retainers, allocation timeline |

---

## Буферы, строки и JSON

### Ключевые выводы

- **Пул буферов**: `Buffer.allocUnsafe(n)` (и `Buffer.from` для маленьких входов) берут память из заранее выделенного пула (`Buffer.poolSize` = 8192 в Node 24.17; **65 536 в Node 26.13** — поднят до 64 КиБ в 26.3.0, PR #63597; проверено локально); `Buffer.alloc(n)` заполняет нулями; `allocUnsafeSlow` обходит пул. Срез пула держит живым весь слэб пула: маленькие буферы, которые хранятся долго, копируйте (`Buffer.from(buf)`).
- **Представления, а не копии**: `buf.subarray()` (и `buf.slice()`, помеченный в документации как устаревший) дёшевы, но удерживают родителя. `Buffer.slice()` стал примерно на 90% быстрее в v22.9 по данным State of Node.js Performance 2024 [не проверено].
- **SIMD**: Node использует simdutf (Lemire и др.) для проверки и перекодирования UTF-8 и для base64; `buf.toString('base64')`, `Buffer.from(str, 'base64')`, `TextDecoder` и `buffer.isUtf8()` ускорены SIMD [не проверено]. `Uint8Array.prototype.toBase64()` / `Uint8Array.fromBase64()` (ES2026) есть в Node 26.13 (V8 14.6) и отсутствуют в 24.17 (проверено локально). Локально декодирование 64 КиБ ASCII: `toString('latin1')` 7,30 мкс ≈ `toString('utf8')` 7,33 мкс, `TextDecoder.decode` 7,99 мкс — берите тот API, что удобен.
- `Buffer.concat` с известным `totalLength` локально в 1,12 раза быстрее (1000 × 64 Б: 47,8 против 53,8 мкс).
- **Строки**: избегайте повторных цепочек `str.split()`/`substring` на очень больших входах; обрабатывайте Buffer инкрементально (потоковые парсеры). Помните об удержании родителя sliced-строками ([внутренности V8](#внутренности-v8-влияющие-на-скорость)).
- **JSON**:
  - `JSON.parse` обычно быстрее любого парсера на JS; на больших payload разбор блокирует event loop (порядок — мегабайты за миллисекунды). Выносите в воркер, разбирайте потоково или не материализуйте целиком.
  - Быстрый путь `JSON.stringify` (V8 ≥ 13.8): без replacer, без `space`, без `toJSON`, без целочисленных ключей.
  - Сериализаторы по схеме: `fast-json-stringify` 7.3.1 (на нём response-схемы Fastify) — локально в 1,75 раза быстрее на Node 24, но на Node 26.13 в ~2,4 раза **медленнее** `JSON.stringify` (fast path V8 14.6); `space=2` выключает быстрый путь (на Node 26 ~1000 против ~250 нс, на Node 24 604 → 787 нс).
  - Часто дороже всего валидация: компилируйте схемы `ajv` один раз. Сравнение TypeBox, Zod 4 и Valibot — в [typescript.md](typescript.md).
- **Бинарные форматы**: `msgpackr` 2.1.4 и `cbor-x` 1.6.9 — самые быстрые кодеки MessagePack и CBOR на JS, с расширениями records/structures, которые не повторяют ключи; `protobufjs` 8.8.1 для protobuf; `avsc` для Avro (последний релиз — июль 2025). Выбирайте прежде всего по совместимости, бенчмаркайте на своих данных.
- `structuredClone` и `v8.serialize`/`deserialize` используют алгоритм structured clone из HTML: корректны, но не быстры.

```js
import Fastify from 'fastify';

const app = Fastify({ logger: true });
app.get('/items/:id', {
  schema: {                                    // ответ сериализуется fast-json-stringify, а не JSON.stringify
    response: { 200: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } },
  },
}, async (req) => ({ id: Number(req.params.id), name: 'item' }));
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Buffer](https://nodejs.org/api/buffer.html) | Node.js docs | Пул, `allocUnsafe`, `subarray`, `isUtf8` |
| [simdutf](https://github.com/simdutf/simdutf) | Daniel Lemire et al. | SIMD-библиотека UTF-8 и base64, встроенная в Node |
| [Daniel Lemire's blog](https://lemire.me/blog/) | Daniel Lemire | Посты о simdutf и base64 в Node и Bun [не проверено: сайт отдаёт 403 скриптам] |
| [State of Node.js Performance 2024](https://nodesource.com/blog/State-of-Nodejs-Performance-2024) | Rafael Gonzaga / NodeSource, 2024 | Изменения Node 20 → 22 на уровне операций (Buffer, fetch, streams) |
| [fast-json-stringify](https://github.com/fastify/fast-json-stringify) | Fastify team | Сериализация по схеме |
| [msgpackr](https://github.com/kriszyp/msgpackr) / [cbor-x](https://github.com/kriszyp/cbor-x) | Kris Zyp | Быстрые MessagePack с records и CBOR |
| [Ajv](https://ajv.js.org/) | Ajv team | Компилируемая валидация JSON Schema |

---

## Потоки (streams)

### Ключевые выводы

- **`highWaterMark` по умолчанию зависит от платформы с v22.0.0.** Документация: «For byte streams, it defaults to `65536` (64 KiB) on non-Windows platforms and `16384` (16 KiB) on Windows»; в object mode — 16. Локально `stream.getDefaultHighWaterMark(false)` = 16384 на Windows, а `fs.createReadStream` использует 65 536. Настраивайте `highWaterMark` на потоке или через `stream.setDefaultHighWaterMark()`.
- **Цена чанка доминирует на маленьких чанках**: агрегируйте мелкие записи (`writable.cork()` / `uncork()`, реализация `writev`), для массовой передачи берите чанки крупнее.
- **Локально, 128 МиБ чанками по 16 КиБ, второй прогрев**: классический `Transform` — около 28 800 МиБ/с (сквозная передача, источник в памяти); стадия на async-генераторе в `pipeline` — около 7600 МиБ/с (**в 3,8 раза медленнее**); WHATWG `TransformStream` через `Readable.toWeb` — около 1160 МиБ/с (**примерно в 25 раз медленнее**). Web streams — для совместимости (тела `fetch`, Web API): конвертируйте на границах, внутренние конвейеры держите на `node:stream`.
- `for await (const chunk of readable)` удобен и достаточно быстр для большинства потребителей (локально около 22 100 МиБ/с на источнике в памяти).
- **Всегда `stream.pipeline`** или `pipeline` из `stream/promises` (распространение ошибок и очистка) и соблюдайте backpressure: `write()` вернул `false` → ждать `'drain'` (`once(stream, 'drain')`). Игнорирование backpressure даёт не скорость, а неограниченный рост памяти.
- Потоки `zlib` и `crypto` работают на пуле потоков libuv (по умолчанию 4 потока, `UV_THREADPOOL_SIZE`); много параллельных сжатий стоят в очереди друг за другом. Brotli с качеством по умолчанию 11 очень медленный для динамических ответов: берите качество 4–5 или gzip/zstd (`zlib.createZstdCompress`, Node 23.8+/22.15+) [не проверено].
- Семантика backpressure и взаимодействие с web streams — [concurrency-async-native.md](concurrency-async-native.md#streams-и-backpressure).

```js
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip, constants } from 'node:zlib';

await pipeline(
  createReadStream('events.ndjson', { highWaterMark: 256 * 1024 }),   // крупнее чанки для массовой передачи
  createGzip({ level: constants.Z_BEST_SPEED }),
  createWriteStream('events.ndjson.gz'),
);
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Stream](https://nodejs.org/api/stream.html) | Node.js docs | `pipeline`, `highWaterMark`, `getDefaultHighWaterMark` |
| [nodejs/node#52037](https://github.com/nodejs/node/pull/52037) | Node.js core, 2024 | Повышение `highWaterMark` (64 КиБ, 16 КиБ на Windows) |
| [Backpressuring in streams](https://nodejs.org/en/learn/modules/backpressuring-in-streams) | Node.js learn | Backpressure |
| [Web Streams API](https://nodejs.org/api/webstreams.html) | Node.js docs | Web streams и взаимодействие с `node:stream` |
| [zlib](https://nodejs.org/api/zlib.html) | Node.js docs | Сжатие, пул потоков, параметры Brotli, zstd |

---

## HTTP-сервер и клиент

Только то, что влияет на скорость. Фреймворки, базы и развёртывание — в [domains-server.md](domains-server.md).

### Ключевые выводы

- **Как мерить сервер**: autocannon, oha или wrk2 с другой машины (или с закреплёнными ядрами), при фиксированной конкурентности; докладывать p50/p99 латентности и req/s; сравнивать при равной доле ошибок (`non2xx`, `errors`, `timeouts` — все нули).
- **Накладные расходы фреймворка**: опубликованный бенчмарк Fastify (hello-world JSON, autocannon `-c 100 -d 40 -p 10`) ставит Fastify рядом с голым `node:http` и в несколько раз выше Express [не проверено: цифры на fastify.dev/benchmarks и в репозитории `fastify/benchmarks` зависят от прогона и железа]. Express 5 быстрее 4, но медленнее Fastify на путях, где много маршрутизации и сериализации. В реальных сервисах обычно доминируют база, валидация и сериализация JSON и логирование; выбор фреймворка важен при «множестве мелких запросов».
- **Приёмы Fastify**: response-схемы (`fast-json-stringify`), валидация JSON Schema, скомпилированная Ajv, без лишних `async`-хуков, логгер pino с асинхронным destination. `fastify.inject()` — бенчмарк обработчиков внутри процесса без сети.
- **Логирование**: pino 10.4.0 пишет JSON с минимальными накладными расходами; используйте `pino.destination({ sync: false })` или transports в worker threads; без pretty print в продакшене; никогда не логируйте тела запросов целиком в горячих путях; проверяйте уровень до построения дорогого сообщения.
- **Исходящий HTTP (undici)**. Локально на Node 24 (клиент и сервер в одном процессе, 50 конкурентных, 20 тыс. запросов, 2 раунда): глобальный `fetch` — около 5,2–5,4 тыс. req/s; `undici.request` — около 8,8–9,5 тыс. (**примерно в 1,7 раза**); `undici` `Pool.request` с 50 соединениями — около 10,5 тыс. (**примерно в 2 раза**); `http.get` — около 6,4–6,7 тыс. (глобальный агент с Node 19 имеет `keepAlive: true` по умолчанию; локально `http.globalAgent.options.keepAlive === true`). Для массовых вызовов между сервисами — `undici.request`/`Pool`/`Agent`; `fetch` — ради удобства и переносимости. Всегда потребляйте или отменяйте тела ответов, иначе соединения не переиспользуются.
- **Keep-alive и таймауты**: `server.keepAliveTimeout` больше idle-таймаута балансировщика, `headersTimeout` больше `keepAliveTimeout` — иначе 502 под нагрузкой. Клиенты и агенты создавайте один раз на уровне модуля.
- **Здоровье event loop**: следите за ELU и p99 задержки event loop; CPU-тяжёлую работу (KDF, обработка изображений, большой JSON) — в пул воркеров (Piscina). `@fastify/under-pressure` сбрасывает нагрузку, когда event loop насыщен. Подробно — [concurrency-async-native.md](concurrency-async-native.md#блокировка-event-loop-и-её-обнаружение).
- **Масштабирование**: процесс на ядро (cluster, PM2 или лучше несколько контейнеров/реплик за балансировщиком). Platformatic Watt запускает несколько Node-приложений как worker threads в одном процессе [не проверено].

```js
import { Pool } from 'undici';

const api = new Pool('http://inventory.internal:8080', { connections: 50 });   // один пул на апстрим

export async function getStock(id) {
  const { statusCode, body } = await api.request({ path: `/stock/${id}`, method: 'GET' });
  if (statusCode !== 200) { await body.dump(); throw new Error(`inventory ${statusCode}`); }   // тело освобождаем всегда
  return body.json();
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Fastify benchmarks](https://fastify.dev/benchmarks/) / [fastify/benchmarks](https://github.com/fastify/benchmarks) | Fastify team | Сравнение накладных расходов фреймворков; стенд и результаты |
| [undici](https://github.com/nodejs/undici) / [docs](https://undici.nodejs.org/) | Node.js / undici team | Бенчмарки `request` против `fetch` и `http` в README, правила потребления тел; API Pool, Agent, dispatchers |
| [pino benchmarks](https://github.com/pinojs/pino/blob/main/docs/benchmarks.md) / [pino](https://github.com/pinojs/pino) | pino team | Накладные расходы логгеров; асинхронные destination и transports |
| [under-pressure](https://github.com/fastify/under-pressure) | Fastify team | Сброс нагрузки по задержке event loop и куче |
| [server.keepAliveTimeout](https://nodejs.org/api/http.html#serverkeepalivetimeout) | Node.js docs | keepAliveTimeout / headersTimeout |
| [Platformatic blog](https://blog.platformatic.dev/) | Platformatic (Collina et al.) | Посты о производительности Node, Watt, сжатии указателей, flame |

---

## Выход за пределы JS

Обзор; подробно — [concurrency-async-native.md](concurrency-async-native.md#когда-уходить-в-натив).

### Ключевые выводы

- **Порядок эскалации**: лучший алгоритм → меньше аллокаций и код, дружественный к inline caches → worker threads для параллельной CPU-работы (Piscina 5.3.2, tinypool 2.2.0) → WebAssembly (переносимо, без матрицы сборок; хорошо для кодеков, хеширования, парсинга; граница JS↔WASM и копии памяти стоят денег) → N-API-аддон (Rust через napi-rs `@napi-rs/cli` 3.10, C/C++ через node-addon-api + node-gyp 13 / prebuildify) → FFI (`koffi` 3.3.7), чтобы вызвать готовую динамическую библиотеку без написания аддона.
- **Пакетируйте вызовы через границу**: вызов нативного кода на каждый элемент часто проигрывает чистому JS из-за конвертаций и цены вызова. Передавайте целый `Buffer`/`TypedArray` и возвращайте один результат.
- **Сначала проверьте встроенное**: многие пакеты «натив ради скорости» стали не нужны — встроенный `fetch`, `crypto.hash()` для однократного хеширования (21.7+/20.12+ [не проверено]), `node:sqlite`, `util.parseArgs`.
- Где нативный путь окупился в экосистеме: ada (парсер URL на C++, в ядре Node с v18.17/20), simdutf, llhttp; инструменты на Rust (Oxc, Rolldown, Biome, Lightning CSS через napi-rs).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [napi-rs](https://napi.rs/) | napi-rs team | Аддоны на Rust, предсобранные бинарники |
| [Node-API](https://nodejs.org/api/n-api.html) / [node-addon-api](https://github.com/nodejs/node-addon-api) | Node.js | ABI-стабильный Node-API; обёртка на C++ |
| [koffi](https://koffi.dev/) | Niels Martignène | FFI для Node |
| [Piscina](https://github.com/piscinajs/piscina) | Piscina team (Collina, Snell…) | Пул воркеров |
| [WASI](https://nodejs.org/api/wasi.html) | Node.js docs | WASI в Node |
| [ada](https://github.com/ada-url/ada) | Yagiz Nizipli, Daniel Lemire | Быстрый парсер URL в ядре Node |

---

## Локальные замеры

Windows 11 (AMD Ryzen 9 5950X, без тюнинга), Node 24.17.0 (V8 13.6), один процесс на набор микробенчмарков, шаг таймера 100 нс. Микробенчмарки — mitata `p50` после явного прогрева 300 мс / 20 000 вызовов. Читать как отношения; всё, что меньше ~1,2 раза, — ориентир, а не вывод.

| Что меряли | Результат | Отношение | Вывод |
|---|---|---|---|
| Чтение 2 полей из 1000 объектов: `= undefined` / после `delete` | 1,29 / 11,43 мкс | **8,8x** | Никогда `delete` на горячих объектах |
| `o.x` по 1000 объектам: 1 форма / 8 форм | 1,02 / 4,20 мкс | **4,1x** | Горячие места — мономорфные |
| Строка из 10 тыс. кусков: `+=` / `join('')` | 46,2 (77,1 со сплющиванием) / 143,2 мкс | **3,1x** (1,9x) | `+=` строит ropes |
| Маленький объект: `fast-json-stringify` / `JSON.stringify` / с `space=2` | 346 / 604 / 787 нс | 1,75x | На Node 26 перевернулось — следующая строка |
| Объект на 7 полей (вложенный объект, массив), 10 свежих процессов на версию: `fast-json-stringify` / `JSON.stringify` / с `space=2`, **Node 24.17 → 26.13** | 24.17: ~680 / ~970 / ~1290 нс; 26.13: ~610 / ~250 / ~1000 нс | 24: 1,4x за fjs; 26: **2,4x за `JSON.stringify`** | На Node 26 сериализатор по схеме ради скорости не нужен |
| 1000 динамических ключей: `Map` / объект | 31,6 / 46,5 мкс | 1,47x | `Map` для динамических ключей |
| Поверхностная копия 4 полей: spread / `Object.assign` | 15,8 / 22,3 нс | 1,4x | Spread годится |
| Глубокая копия: JSON-цикл / `structuredClone` | 0,96 / 1,99 мкс | 2,1x | `structuredClone` — ради корректности; в 126 раз дороже spread |
| Массив 10 тыс.: индекс / `push` / `Array.from({ length }, fn)` | 10,1 / 29,0 / 507,7 мкс | 2,9x; **50x** | Предвыделять |
| Сумма 10 тыс.: packed / holey | 5,07 / 5,86 мкс | 1,16x | Дыры почти бесплатны после оптимизации |
| Сумма 10 тыс.: `reduce` / `for` / `for…of` / `forEach` с захватом | 4,36 / 5,07 / 6,95 / 9,54 мкс | до 2,2x | Не менять захваченные переменные в горячих колбэках |
| Цикл внутри `try` без броска / без `try` | 5,28 / 5,56 мкс | 1,0x | try/catch бесплатен |
| `Buffer.concat` 1000 × 64 Б: с `totalLength` / без | 47,8 / 53,8 мкс | 1,12x | Передавать `totalLength` |
| 64 КиБ ASCII: `latin1` / `utf8` / `TextDecoder` | 7,30 / 7,33 / 7,99 мкс | 1,1x | Все на SIMD |
| Подстрока в 100 строках: `includes` / литерал регулярки / `new RegExp` на вызов | 2,82 / 3,66 / 12,92 мкс | 1,3x; **3,5x** | Компилировать регулярки один раз |
| Членство в 1000 целых: `Set.has` / `Array.includes` | 3,3 / 765 нс | **230x** | `Set`/`Map` |
| `reduce` по 10 тыс.: tinybench `time: 300` / mitata / после tier-up | 70,7 / 4,5 / 4,2–4,3 мкс | **16–17x** | Tier-up после ~11 000 вызовов; прогрев ≥ 20 000 |
| tinybench `time: 1000` без прогрева / `warmupIterations: 20_000` | mean 10,09 / 4,48–4,55 мкс при p50 4,30 | mean/p50 2,3 → 1,04–1,06 | Флаг `mean/p50 > 1,25` ловит загрязнение |
| bench-node на сумме 1000: умолчания / `plugins: []` | 32 тыс. против 90 тыс. ops/s («reduce 2.80x») / 1,1–1,3 млн ops/s, разница ~10% | ранжирование меняется | Умолчание меряет неоптимизированный код |
| Vitest 5: `rank` / `hz` на sub-µs | `reduce` — `fastest` при hz 1 497 651; `for-loop` — hz 1 509 651 | — | Сравнивать `latency.p50` |
| Порядок прогонов в mitata | прогон после медленного варианта быстрее на ~6% | 1,06x | ABBA, ≥ 5 прогонов на сторону |
| `reduce` со стрелочным колбэком после 30 000 вызовов прогрева, 100 000 замеров по одному вызову | ~3% вызовов по ~70 мкс при p50 4,3 мкс, разбросаны по всему прогону; ни одной деоптимизации в `--trace-deopt`, функция скомпилирована Maglev; у цикла `for` хвоста нет | mean/p50 1,3–1,4 | Хвост бывает настоящим и прогревом не лечится: медиана честная, но для задержки смотрите p99 |
| `require()` бандла `typescript@6` (9 МБ): без кэша / с кэшем компиляции | 231,5 ± 6,4 / 115,6 ± 6,3 мс | **2,0x** | `module.enableCompileCache()` |
| `node -e 0` (hyperfine `-N`) | 50–59 мс | — | Базовая линия старта |
| Конвейер 128 МиБ по 16 КиБ: `Transform` / async-генератор / `TransformStream` | ~28 800 / ~7600 / ~1160 МиБ/с | 3,8x; **~25x** | Web streams — только на границах |
| `for await` по источнику в памяти | ~22 100 МиБ/с | — | Достаточно быстро |
| Исходящий HTTP: `fetch` / `http.get` / `undici.request` / `Pool` | ~5,2–5,4 / 6,4–6,7 / 8,8–9,5 / ~10,5 тыс. req/s | ~1,7x; ~2x | undici для массовых вызовов |
| Голый `node:http` JSON-сервер, autocannon `-c 50` | ~15,4 тыс. req/s, p50 2 мс / p99 8 мс | — | Генератор и сервер на одном CPU |
| Значения по умолчанию | `heap_size_limit` 4288 МиБ (64 ГБ RAM); `getDefaultHighWaterMark(false)` 16384; `Buffer.poolSize` 8192 (65 536 в 26.13); `http.globalAgent.options.keepAlive` true | — | Проверяйте, а не предполагайте |

---

## Разборы реальных случаев

### Ключевые выводы

- **Marvin Hagemeister, «Speeding up the JavaScript ecosystem» (2023–2025)**: исправления в популярных инструментах по flamegraph — разрешение модулей, ESLint, накладные расходы npm scripts (~400 мс → ~22 мс), разбор semver (~10 раз), barrel-файлы. Закономерность: большинство выигрышей — устранение лишней работы, конвертаций и аллокаций, а не хитрые микротрюки. Серия вдохновила инициативу e18e [не проверено].
- **Vyacheslav Egorov, «Maybe you don't need Rust and WASM to speed up your JS» (2018)**: библиотеку source map, переписанную на Rust/WASM, догнали и обогнали точечными правками JS (мономорфизация, меньше аллокаций, typed arrays, лучшая сортировка). Канонический пример «профилируйте JS, прежде чем идти в натив».
- **Обновления движка — бесплатная скорость**: `JSON.stringify` вдвое (V8, 2025), mutable heap numbers (2025, async-fs в 2,5 раза), Turboshaft (компиляция вдвое быстрее). Переход между LTS (22 → 24 → 26) часто выгоднее микротюнинга; после каждого перехода бенчмарки перемеряют, потому что победители меняются (строка JSON в [локальных замерах](#локальные-замеры)).
- **State of Node.js Performance 2024** (Rafael Gonzaga, NodeSource): сравнение Node 20 → 22 по операциям на выделенном железе AWS, 30 прогонов и t-тест Стьюдента на бенчмарк; например, `Buffer.slice` примерно на 90% быстрее в 22.9, вырос throughput `fetch` [не проверено]. Серию продолжает доклад Gonzaga «Node.js Performance in 2026 – Where We Are and What's Next» [не проверено].
- **Сжатие указателей у Platformatic (2025)**: около 50% экономии кучи ценой 2–4% средней латентности на сборке Node 25 со сжатием указателей.
- **Ядро Node: ada и simdutf** (Yagiz Nizipli, Daniel Lemire): замена реализаций на JS/C++ на C++ с активным SIMD сделала `new URL()`, кодирование текста и base64 в несколько раз быстрее во всей экосистеме [не проверено].
- **Расхождение инструментов в 16 раз** (локальный разбор): «регрессия» между двумя бенчмарк-инструментами целиком объяснялась моментом tier-up. Урок: прежде чем верить микробенчмарку, проверьте состояние оптимизации ([как бенчмаркать честно](#как-бенчмаркать-честно)).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Speeding up the JavaScript ecosystem](https://marvinh.dev/blog/speeding-up-javascript-ecosystem/) / [marvinh.dev](https://marvinh.dev/) | Marvin Hagemeister, 2023 | Часть 1 серии; оглавление следующих частей (ESLint, npm scripts, barrel files, oxlint) |
| [e18e](https://e18e.dev/) | e18e community | Инициатива за более лёгкие и быстрые зависимости |
| [Maybe you don't need Rust and WASM](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html) | Vyacheslav Egorov, 2018 | Оптимизация JS против переписывания на WASM |
| [State of Node.js Performance 2024](https://nodesource.com/blog/State-of-Nodejs-Performance-2024) / [raw results](https://github.com/RafaelGSS/state-of-nodejs-performance-2024) | Rafael Gonzaga, 2024 | Сравнение версий по операциям; сырые данные и стенд |
| [We cut Node.js memory in half](https://blog.platformatic.dev/we-cut-nodejs-memory-in-half) | Platformatic, 2025 | Разбор сжатия указателей |
| [yagiz.co](https://www.yagiz.co/) | Yagiz Nizipli | Посты об ada и производительности ядра Node |

---

## Чеклист ревью производительности

Замер

1. Есть профиль (`--cpu-prof`, flame) или бенчмарк, показывающий, что код горячий? Нет профиля — нет микрооптимизаций.
2. Микробенчмарк: свежий процесс на прогон, ABBA, ≥ 5 прогонов на сторону, явный прогрев (или tinybench `warmupIterations` ≥ 20 000), результат потребляется (`do_not_optimize`/sink), входы реалистичные и разные, сравнивается p50, `mean/p50` проверен на бимодальность, версии Node и V8 записаны.
3. bench-node — с `plugins: []`, если вопрос не про неоптимизированный код; бенчмарки Vitest 5 — на fixture-API и с опциями прогрева.
4. Цифры HTTP получены отдельным генератором нагрузки, при фиксированной конкурентности, без ошибок, с p50 и p99.

Код

5. Горячие объекты: поля инициализированы в конструкторе или литерале в фиксированном порядке; нет `delete`; нет условных поздних свойств; горячие места видят ≤ 4 форм.
6. Поиск: `Set`/`Map` вместо `Array.includes`/`find` в циклах; нет O(n²) `reduce` со spread-аккумулятором; нет очередей на `Array.shift()` по большим массивам.
7. Нет создания дорогих объектов на каждый вызов: регулярок, форматтеров `Intl`, валидаторов Ajv, HTTP-клиентов и агентов, пулов БД, подготовленных запросов.
8. Нет клонирования через `structuredClone` или JSON-цикл в горячих путях; нет `JSON.stringify(x, null, 2)` в продакшен-ответах и логах.
9. Большой JSON, KDF (`pbkdf2Sync`, `scryptSync`), синхронный fs, сжатие и обработка изображений не стоят на пути запроса в event loop (асинхронные API или пул воркеров).
10. Потоки: `pipeline`, backpressure соблюдается, внутренние конвейеры на `node:stream` (web streams — только на границах), разумный `highWaterMark` (помните про 16 КиБ на Windows).
11. Исходящий HTTP: один клиент или агент на апстрим, тела всегда потребляются или отменяются, `undici.request`/`Pool` для массовых вызовов.
12. Кэши ограничены (LRU с максимумом размера или TTL); слушатели и таймеры снимаются; данные запроса не складываются в коллекции уровня модуля.
13. Логирование: pino или аналогичный асинхронный логгер, без pretty print и логирования тел в горячих путях, уровень проверяется до построения дорогого сообщения.
14. Код, чувствительный к старту (CLI, serverless): тяжёлые импорты ленивые, кэш компиляции включён, бандл рассмотрен.
15. Память: в контейнере задан `--max-old-space-size(-percentage)`; semi-space настроен только по замерам; исправления утечек подкреплены heap snapshot.
16. Нативный код и WASM оправданы профилем и вызываются пакетами.

---

## Антипаттерны

| Антипаттерн | Почему плохо | Замена |
|---|---|---|
| Оптимизация без профиля; бенчмарк на игрушечных входах | Ускоряется не то место | `--cpu-prof` или flame на реалистичных данных |
| Доверие одному прогону микробенчмарка; сравнение инструментов, версий или машин без оговорок | Шум и разница окружений выдаются за эффект правки | ABBA, ≥ 5 прогонов на сторону, версии в отчёте |
| Короткие бенчмарки с бюджетом по времени для функций с долгим одиночным вызовом | Функция не успевает пройти tier-up, меряется интерпретатор | Прогрев ≥ 20 000 вызовов, `--trace-opt` |
| bench-node с плагинами по умолчанию как основание для продакшен-решения | Меряет неоптимизированный код, ранжирование может перевернуться | `plugins: []` или `detectDeadCodeElimination: true` |
| Синтаксис Vitest 4 (`import { bench } from 'vitest'`, `--outputJson`) в Vitest 5 | «bench is not a function», флаг не существует | Фикстура `bench`, `writeResult`, `bench.from`, JSON-репортер |
| `hz` из таблицы Vitest или `mean` бимодальной выборки как метрика решения | Ранжирование расходится с медианой | `latency.p50` по прогонам |
| `delete obj.prop` на горячих объектах; свойства в разном порядке; мегаморфные обобщённые хелперы в горячих циклах | Словарный режим (8,8x), мегаморфные IC (4,1x) | `= undefined`, `Map`, стабильные формы, специализация |
| `Array.from({ length: n }, fn)` для больших массивов в горячем коде | Локально в 50 раз медленнее предвыделения | `new Array(n)` + цикл |
| `Array.includes`/`indexOf` в циклах по большим коллекциям | O(n) на проверку (230x на 1000 элементах) | `Set`/`Map` |
| `RegExp`, `Intl.*Format`, валидаторы Ajv, агенты undici/http или клиенты БД на каждый запрос | Повторная компиляция и инициализация, нет пула соединений | Один экземпляр на модуль или приложение |
| Глубокое клонирование (`structuredClone`, JSON-цикл, lodash `cloneDeep`) «для безопасности» в горячих путях | Дорого (126x к spread), лишние аллокации | Неизменяемость по соглашению, поверхностный spread |
| Непотреблённые тела ответов fetch/undici | Утечка соединений, зависший пул | `body.dump()`, `body.json()`, отмена |
| Синхронные crypto/fs/zlib или огромный `JSON.parse` на пути запроса; CPU-работа без пула воркеров | Блокирует event loop, растёт p99 | Асинхронные API, Piscina |
| Web streams для внутренних конвейеров Node; стадии на async-генераторах в конвейерах, критичных по пропускной способности | ~25x и ~3,8x накладных расходов на чанк | `node:stream` `Transform` |
| Игнорирование backpressure (возвращаемого значения `write()`) | Взрыв памяти | `pipeline`, `once(stream, 'drain')` |
| Неограниченные кэши на `Map`; утечки слушателей и таймеров; `setInterval` без `clearInterval`/`unref` | Память растёт под постоянной нагрузкой | `lru-cache` с `max`, снятие слушателей, `unref` |
| Clinic.js или benchmark.js в новой работе без перекрёстной проверки | Не поддерживаются, результаты могут быть неточны | `--cpu-prof`, `@platformatic/flame`, 0x; tinybench, mitata, bench-node |
| `UV_THREADPOOL_SIZE` или `--max-semi-space-size` вслепую, без замера | Лишняя память и потоки без выигрыша | Поднимать только по профилю и с замером |
| Нативные аддоны до исправления аллокаций и форм; вызов натива на каждый элемент | Цена границы съедает выигрыш | Сначала JS, потом пакетные вызовы |
| Pretty print или синхронное логирование в горячих путях продакшена | Логирование появляется в профиле | pino с асинхронным destination или transport |

---

## Спорные места

1. **Сборка строк: `+=` против `Array.join`.** Старые советы (и советы для других языков) — `join`. В V8 `+=` строит ropes и локально был в 3,1 раза быстрее, с учётом сплющивания — в 1,9 раза. «Всегда join» [устарело] → `+=` или шаблонные строки, пока профиль не скажет иное.
2. **try/catch деоптимизирует.** Было верно для Crankshaft (до 2017 года). [устарело] → try/catch можно использовать свободно; локально разницы нет.
3. **`forEach` и `for…of` медленные.** В основном [устарело]: оптимизированные `for…of` и `reduce` близки к `for`; `forEach` с захваченным изменяемым аккумулятором локально был примерно в 1,9 раза медленнее. Важно только в доказанно горячих циклах.
4. **Среднее, медиана или минимум.** tinybench и Vitest выносят в заголовок среднее (а Vitest по нему ранжирует); mitata показывает avg с p75/p99; `compare.js` Node core проверяет средние частот по прогонам; советы в духе pyperf — смотреть на распределение. С tier-up и GC среднее по вызовам часто бимодально. Здесь рекомендуется p50 на процесс + t-тест Уэлча между процессами; минимум — только для проверки «как быстро может быть в идеале».
5. **Что должен мерить микробенчмарк: оптимизированный или неоптимизированный код?** Умолчание bench-node (`%NeverOptimizeFunction`) даёт стабильные сравнения, не зависящие от JIT; mitata и tinybench меряют оптимизированное установившееся состояние. Ранжирование может расходиться в 3 раза. Для продакшен-решений меряйте установившееся состояние и подтверждайте макробенчмарком.
6. **`fast-json-stringify` против `JSON.stringify`.** Локально в 1,75 раза на Node 24 (V8 13.6), но V8 13.8+ ускорил `JSON.stringify` для простых данных больше чем вдвое, и на Node 26.13 (V8 14.6) разрыв перевернулся: `JSON.stringify` в ~2,4 раза быстрее (локальный замер). Сериализатор по схеме на Node 26 оправдан контрактом ответа (лишние поля не утекают), а не скоростью; на своих данных перемерьте.
7. **`fetch` против `undici.request`.** README undici показывает большие разрывы; локально около 1,7 раза (клиент и сервер в одном процессе). `fetch` улучшается от релиза к релизу; `request`/`Pool` берите только для массовых внутренних вызовов.
8. **Настройка `--max-semi-space-size`.** NearForm показывает +20–27% req/s на приложении с массой аллокаций; документация Node говорит, что выигрыш зависит от нагрузки и стоит тройного прироста памяти. По умолчанию не ставить.
9. **Clinic.js** всё ещё советуют старые статьи и книги, но он не поддерживается с 2023 года. [устарело] → инструменты из раздела [Профилирование](#профилирование).
10. **benchmark.js.** [устарело] (2017) → tinybench, mitata, bench-node.
11. **`--outputJson`/`--compare` в Vitest bench.** [устарело] с Vitest 5.0 (сентябрь 2026) → `writeResult` + `bench.from()` + JSON-репортер.
12. **`highWaterMark` по умолчанию: «16 КиБ» или «64 КиБ».** В сети встречаются оба. С v22.0.0 — 64 КиБ не на Windows и 16 КиБ на Windows.
13. **Сжатие указателей.** Platformatic сообщает о ~50% экономии памяти за 2–4% латентности; в официальных сборках его нет, и каждый isolate ограничен 4 ГБ. Это осознанный выбор при развёртывании, а не умолчание.
14. **Порядковый эффект в чередующихся прогонах.** С mitata прогон после более медленного варианта был примерно на 6% быстрее (3 чередующихся прогона, Windows, таймер 100 нс). Схема ABAB может давать смещение; ABBA с ≥ 5 прогонами на сторону гасит дрейф первого порядка.
