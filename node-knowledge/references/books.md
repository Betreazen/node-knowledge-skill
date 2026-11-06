# Книги, курсы, доклады и маршрут обучения Node.js

Аннотированный каталог источников по Node.js для тех, кто пишет, ревьюит и оптимизирует код на JavaScript и TypeScript в любой области. Внутри книги по областям (Node, язык, TypeScript, тесты, архитектура, безопасность) с изданиями и датами, официальная документация и раздел Learn, бесплатные и платные курсы, блоги, рассылки, подкасты, классические и свежие доклады (включая NodeConf EU 2026), YouTube-каналы, код для чтения и ресурсы на русском. В конце даны обязательный минимум, маршрут обучения по уровням, чеклист, антипаттерны и спорные места. Актуально на ноябрь 2026 года: Node 26 «Lithium» — Active LTS с 2026-10-28 (v26.13.0, документация API по умолчанию открывается на этой версии), Node 24 «Krypton» — LTS (v24.22.2, 2026-10-27), Node 22 «Jod» — Maintenance LTS (v22.23.4, 2026-10-20), Node 20 — EOL (последняя v20.20.2, 2026-03-24), нечётная ветка 25 закончилась на v25.9.0 (2026-03-31). 2026-10-29 вышла `v27.0.0-alpha` — первая ветка новой модели релизов: один мажорный релиз в год, и каждый становится LTS. TypeScript: `latest` — 7.0.2 (2026-07-08, компилятор на Go), последняя 6.x — 6.0.3, последняя 5.x — 5.9.3. Черновик спецификации — ECMAScript 2027. **Ни одна книга не описывает Node 26.** Самые свежие книги о Node: Node.js Design Patterns 4e (сентябрь 2025, «fully updated as of Node.js 24»), Node.js Cookbook 5e (ноябрь 2024, Node 22) и Node.js Projects (август 2025). Всё, что появилось после середины 2025 года (стабильный type stripping с v24.12.0/v25.2.0, `require(esm)` без флага во всех поддерживаемых ветках, `node:sqlite`, permission model, новый график релизов), изучайте по официальной документации, блогу Node.js и докладам 2025–2026 годов из раздела [Свежие доклады](#свежие-доклады). Техническая глубина — в соседних файлах: [performance.md](performance.md) (V8, GC, профилирование, бенчмарки), [toolchain.md](toolchain.md) (ветки релизов, менеджеры пакетов, линтеры, цепочка поставок), [testing.md](testing.md), [idioms-patterns.md](idioms-patterns.md), [typescript.md](typescript.md), [architecture.md](architecture.md), [concurrency-async-native.md](concurrency-async-native.md), [domains-server.md](domains-server.md), [domains-client.md](domains-client.md).

Метки: `[устарело]` — издание или содержание устарело, рядом названа замена; `[не проверено]` — факт взят из одного вторичного источника (листинг продавца, поисковая выдача) или не перепроверялся.

- [Как выбирать источник](#как-выбирать-источник)
- [Обязательный минимум](#обязательный-минимум)
- [Книги о Node.js](#книги-о-nodejs)
- [Книги о языке JavaScript](#книги-о-языке-javascript)
- [Книги о TypeScript](#книги-о-typescript)
- [Тестирование, архитектура и безопасность](#тестирование-архитектура-и-безопасность)
- [Официальная документация и Learn](#официальная-документация-и-learn)
- [Бесплатные онлайн-книги, курсы и практика](#бесплатные-онлайн-книги-курсы-и-практика)
- [Платные курсы и сертификаты](#платные-курсы-и-сертификаты)
- [Блоги и авторы](#блоги-и-авторы)
- [Рассылки, подкасты, конференции и опросы](#рассылки-подкасты-конференции-и-опросы)
- [Канон докладов](#канон-докладов)
- [Свежие доклады](#свежие-доклады)
- [YouTube-каналы](#youtube-каналы)
- [Код для чтения](#код-для-чтения)
- [Ресурсы на русском](#ресурсы-на-русском)
- [Маршрут обучения по уровням](#маршрут-обучения-по-уровням)
- [Чеклист: источник как обоснование изменения](#чеклист-источник-как-обоснование-изменения)
- [Антипаттерны](#антипаттерны)
- [Спорные места](#спорные-места)
- [Расхождения в датах и непроверенные факты](#расхождения-в-датах-и-непроверенные-факты)

## Как выбирать источник

### Ключевые выводы

- Книги отстают от Node на 1–2 мажорные версии. Для API и флагов первоисточник — [документация API](https://nodejs.org/api/) (история «Added in / Changed in» и индекс стабильности у каждого API), [Node.js Learn](https://nodejs.org/en/learn) и посты релизов в [блоге Node.js](https://nodejs.org/en/blog).
- Книги берите ради моделей и паттернов: асинхронный поток управления, streams, масштабирование, обмен сообщениями. Их стареют медленно. Быстрее всего стареют главы об инструментах (`ts-node`, `nodemon`, `dotenv`, Mocha по умолчанию, `request`).
- Лучшие книги о Node написаны людьми из ядра и экосистемы: Mammino и Casciaro (Design Patterns), Griggs и Spigolon (Cookbook), Spigolon, Sinik и Collina (Fastify), Hunter и English (Multithreaded JS), Gascón (Beginners), Snell (JavaScript in Depth).
- Русские переводы отстают на одно-два издания. Если английский оригинал свежее или бесплатен онлайн, читайте оригинал.
- Два главных справочных сайта по ECMAScript — exploringjs.com и 2ality.com Акселя Раушмайера — с 2026 года «temporarily offline» (проверено 2026-11-06: оба сайта показывают только это уведомление). Старые ссылки на них в книгах и статьях сейчас не работают (отдают 404). Те же факты ищите на MDN, javascript.info и в TC39.
- Сертификация JSNAD снята 2025-09-30, курс LFW211 неактивен. Не рекомендуйте их как действующие.

Перед тем как поверить совету из книги, сверьте версию:

```bash
node --version                      # целевая ветка проекта; сравните с engines.node в package.json
npm view typescript dist-tags       # на 2026-11-06: latest 7.0.2, beta 7.1.0-beta
node -p "process.release.lts"       # имя LTS-ветки ('Lithium' для 26, 'Krypton' для 24) или undefined
```

| Задача | Первый источник | Второй источник |
|---|---|---|
| Выучить JavaScript с нуля | [javascript.info](https://javascript.info/) / [learn.javascript.ru](https://learn.javascript.ru/) | [Eloquent JavaScript 4e](https://eloquentjavascript.net/) (бесплатно) |
| Начать Node | [Node.js Learn](https://nodejs.org/en/learn), разделы Getting Started и Asynchronous Work | Node.js for Beginners (2024), [Full Stack Open, часть 3](https://fullstackopen.com/en/part3) |
| Писать идиоматичный Node | [Node.js Design Patterns 4e](https://www.nodejsdesignpatterns.com/) | [nodebestpractices](https://github.com/goldbergyoni/nodebestpractices), [idioms-patterns.md](idioms-patterns.md) |
| Понять event loop | [The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick), [Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop) | доклады Belder и Archibald; [concurrency-async-native.md](concurrency-async-native.md) |
| Типизировать код | [Total TypeScript Essentials](https://www.totaltypescript.com/books/total-typescript-essentials) (бесплатно) | Effective TypeScript 2e, раздел [Modules](https://www.typescriptlang.org/docs/handbook/modules/introduction.html) в Handbook; [typescript.md](typescript.md) |
| Писать тесты | [Test runner guides](https://nodejs.org/en/learn/test-runner/introduction), [javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices) | The Art of Unit Testing 3e; [testing.md](testing.md) |
| Спроектировать сервис | Distributed Systems with Node.js | DDIA 2e, Release It! 2e; [architecture.md](architecture.md) |
| Ускорить код | [Diagnostics guides](https://nodejs.org/en/learn/diagnostics/memory) и доклады Egorov о бенчмарках (сначала измерить) | доклады Collina, Snell, Nagy; [performance.md](performance.md) |
| Опубликовать библиотеку | [Publishing a package](https://nodejs.org/en/learn/modules/publishing-a-package), доклады Joyee Cheung | Anthony Fu «Move on to ESM-only»; [domains-client.md](domains-client.md) |
| Обезопасить сервис | [Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices), [OWASP Node.js Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html) | доклад Tenerowicz о цепочке поставок 2026; [toolchain.md](toolchain.md) |

## Обязательный минимум

### Ключевые выводы

- Десять пунктов покрывают рантайм, язык, типы, тесты, производительность и продакшен. Пять из них бесплатны целиком.
- Node.js Learn стоит первым: он свежее любой книги.
- Русскоязычным читателям Design Patterns лучше читать на английском: перевод отстаёт на два издания.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| 1. [Node.js Learn](https://nodejs.org/en/learn): особенно [The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick), [Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop), Backpressuring in Streams, Diagnostics, TypeScript, Test Runner, [Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices) | Node.js project, живой; бесплатно | Официальная учебная программа, свежее всех книг |
| 2. [Node.js Design Patterns, 4th ed.](https://www.nodejsdesignpatterns.com/) | Mammino и Casciaro, Packt, сентябрь 2025 | Главная книга о Node: эпоха Node 24, новая глава о тестировании |
| 3. [javascript.info](https://javascript.info/) / [learn.javascript.ru](https://learn.javascript.ru/) и [Eloquent JavaScript 4e](https://eloquentjavascript.net/) | Илья Кантор; Marijn Haverbeke, 2024; бесплатно | Язык — правильно и современно |
| 4. [Effective TypeScript, 2nd ed.](https://effectivetypescript.com/), [Total TypeScript Essentials](https://www.totaltypescript.com/books/total-typescript-essentials) и раздел [Modules](https://www.typescriptlang.org/docs/handbook/modules/introduction.html) в TS Handbook | Vanderkam, 2024; Pocock (онлайн бесплатно, печать No Starch — апрель 2026); Microsoft | Дизайн типов, современный TS, модель ESM/CJS в TypeScript |
| 5. Доклады о модели рантайма: [Philip Roberts](https://www.youtube.com/watch?v=8aGhZQkoFbQ) и [Jake Archibald](https://www.youtube.com/watch?v=cCOL7MC4Pl0) (event loop и microtasks), [Bert Belder](https://www.youtube.com/watch?v=PNa9OMajw9w) (libuv), [JavaScript Engines: The Good Parts](https://www.youtube.com/watch?v=5nmpokoRaZI), [Benchmarking JavaScript](https://www.youtube.com/watch?v=g0ek4vV7nEA) | 2014–2018 | Модель за несколько часов: очереди, фазы libuv, shapes и inline caches, почему микробенчмарки лгут |
| 6. Доклады Joyee Cheung: [require(esm) in Node.js core](https://www.youtube.com/watch?v=l2gi6Rdxr0E), [Shipping Node.js packages in 2025](https://www.youtube.com/watch?v=I0jvOJW7NaI) | Joyee Cheung, 2024–2025 | Текущий ответ на вопрос ESM против CJS от автора `require(esm)` |
| 7. [nodebestpractices](https://github.com/goldbergyoni/nodebestpractices) и [javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices) | Yoni Goldberg; бесплатно | Чеклисты. Отдельные пункты сверяйте с текущей документацией |
| 8. [The Art of Unit Testing, 3rd ed.](https://www.manning.com/books/the-art-of-unit-testing-third-edition) | Osherove и Khorikov, Manning, февраль 2024 | Дизайн тестов на примерах JavaScript |
| 9. Доклады Matteo Collina ([The State of Node.js 2025](https://www.youtube.com/watch?v=IgSwJaheiGk), [Do not thrash the Node.js Event Loop](https://www.youtube.com/watch?v=81AqwvXqgG0), [Node.js will use all the memory available](https://www.youtube.com/watch?v=_OnTUIYxGRs), [Next-Gen Flame Graphs](https://www.youtube.com/watch?v=bn78fDj2tWc)) и плейлист [NodeConf EU 2026](https://www.nodeconf.eu/) | Collina, 2022–2026; NodeConf EU 2026 | Здоровье event loop, память, профилирование; модель релизов, куча V8, цепочка поставок, observability |
| 10. [Distributed Systems with Node.js](https://www.oreilly.com/library/view/distributed-systems-with/9781492077282/) и [Designing Data-Intensive Applications, 2nd ed.](https://martin.kleppmann.com/2026/03/24/designing-data-intensive-applications-2e.html) | Hunter, 2020; Kleppmann и Riccomini, 2026 | Продакшен-бэкенд: observability, протоколы, отказоустойчивость, данные |

## Книги о Node.js

### Ключевые выводы

- Достаточно свежих книг о Node всего несколько (2024–2025): Node.js Design Patterns 4e (сентябрь 2025, Node 24), Node.js Cookbook 5e (ноябрь 2024, Node 22), Efficient Node.js (январь 2025), Node.js Projects (август 2025) и Node.js for Beginners (май 2024). Ни одна не описывает Node 26, стабильный type stripping, стабильную permission model и смену модели релизов 2026 года.
- У Manning нет актуальной книги именно о Node: в категории Node только книги 2013–2017 годов (Node.js in Action 2e — 2017) и готовящаяся JavaScript in Depth Снелла (MEAP). Книги Pragmatic о Node — 2016–2017 годов. У No Starch книги о Node нет, но её книги о JS и TS (Eloquent JavaScript 4e, Total TypeScript) свежие.
- Самая новая книга о Node на русском — «Эффективный Node.js» (Питер, 2026), перевод Efficient Node.js. Перевод Design Patterns отстаёт на два издания.
- Самая ожидаемая книга — JavaScript in Depth Джеймса Снелла (Manning MEAP, 11 из 13 глав, финал ожидается весной 2027).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js Design Patterns, 4th ed.](https://www.packtpub.com/en-us/product/nodejs-design-patterns-9781803238944) ([сайт книги](https://www.nodejsdesignpatterns.com/), [ссылки и код](https://nodejsdp.link/)) | Luciano Mammino и Mario Casciaro, Packt, сентябрь 2025 (листинг: 25 сентября 2025), 732 стр.; платно | **Главная книга о Node.** Сайт: «fully updated as of Node.js 24». 13 глав: платформа, система модулей (сначала ESM), callbacks и events, асинхронный поток на callbacks и на promises/async-await, streams, порождающие, структурные и поведенческие паттерны, **новая глава 10 «Testing: Patterns and Best Practices»**, продвинутые рецепты, паттерны масштабирования, паттерны обмена сообщениями и интеграции. Добавлены TypeScript, безопасность и продакшен. Бесплатна только глава 6 «Coding with Streams». В блоге книги есть свежие посты: «What's new in Node.js 26», «Node.js is changing its release schedule and version numbers». RU: перевод только 1-го/2-го издания `[устарело]`, см. [Ресурсы на русском](#ресурсы-на-русском) |
| [Node.js Design Patterns, 3rd ed.](https://www.packtpub.com/en-gb/product/nodejs-design-patterns-third-edition-9781839214110) | Casciaro и Mammino, Packt, 2020 | `[устарело]`: эпоха Node 14, нет главы о тестах. Замена: 4-е издание |
| [Node.js Cookbook, 5th ed.](https://packtpub.com/en-ca/product/nodejs-cookbook-9781804614105) | Bethany Griggs и Manuel Spigolon, Packt, ноябрь 2024, 456 стр.; платно | Рецепты для Node 22: streams, Fastify, хранение данных, тесты, безопасность, worker threads, микросервисы в контейнерах, отладка. Griggs была членом Node TSC и Release WG, Spigolon — мейнтейнер ядра Fastify. Хорошая вторая книга после Design Patterns |
| [Distributed Systems with Node.js](https://www.oreilly.com/library/view/distributed-systems-with/9781492077282/) | Thomas Hunter II, O'Reilly, ноябрь 2020, ~380 стр.; платно | Продакшен-бэкенд на Node: observability (логи, метрики, трассировка), протоколы (HTTP, gRPC, GraphQL), контейнеры и Kubernetes, отказоустойчивость, идемпотентность, health checks, service discovery. Второго издания нет. Версии инструментов устарели, идеи — нет |
| [Multithreaded JavaScript: Concurrency Beyond the Event Loop](https://www.oreilly.com/library/view/multithreaded-javascript/9781098104429/) | Thomas Hunter II и Bryan English, O'Reilly, сентябрь 2021, ~210 стр.; платно | Единственная книга о `worker_threads`, web workers, `SharedArrayBuffer`/`Atomics`, пулах потоков и о том, когда потоки *не* окупаются. Читайте вместе с [concurrency-async-native.md](concurrency-async-native.md). RU: «Многопоточный JavaScript» — издатель и год не найдены `[не проверено]` |
| [Node.js Projects](https://www.oreilly.com/library/view/node-js-projects/9781098173135/) | Jonathan Wexler, O'Reilly, август 2025, 372 стр.; платно | Проектная книга среднего уровня; самая новая англоязычная книга о Node от крупного издателя. Японский перевод (O'Reilly Japan) — июль 2026 |
| [Efficient Node.js: A Beyond-the-Basics Guide](https://www.oreilly.com/library/view/efficient-nodejs/9781098145187/) | Samer Buna, O'Reilly, январь 2025 (у продавцов — февраль 2025), ~240 стр.; платно | Проектная книга среднего уровня: модули и пакеты, событийная архитектура, streams, дочерние процессы, ошибки и отладка, управление пакетами, тесты, масштабирование и деплой. RU: [«Эффективный Node.js»](https://www.piter.com/product/effektivnyy-nodejs) (Питер, 2026, 224 стр., ISBN 978-601-12-5945-3) — **самая новая книга о Node на русском**, отставание перевода около года |
| [Node.js: The Comprehensive Guide](https://www.packtpub.com/en-us/product/node-dot-js-9781806108428) | Sebastian Springer, Rheinwerk (продаётся через Packt и O'Reilly); печать 2022 (ISBN 978-1-4932-2292-6), листинг e-book — 19 июня 2025, ~837 стр.; платно | Широкий справочник немецкой школы: ядро, Express и Nest, GraphQL, WebSockets, TypeScript, RxJS, микросервисы, Deno. Ширина важнее глубины. Новое ли это издание или переиздание 2022 года — неясно `[не проверено]` |
| [Node.js for Beginners](https://www.oreilly.com/library/view/nodejs-for-beginners/9781803245171/) | Ulises Gascón, Packt, май 2024, 382 стр.; платно | Книга для начинающих от коллаборатора и релиз-менеджера Node (и члена Express TC): повторение JS, асинхронность, npm, Express и MongoDB, REST, JWT, Docker, PM2 |
| [Accelerating Server-Side Development with Fastify](https://www.packtpub.com/en-us/product/accelerating-server-side-development-with-fastify-9781800568747) | Manuel Spigolon, Maksim Sinik, Matteo Collina, Packt, июнь 2023, 406 стр.; платно | Книга о Fastify от его core-команды: инкапсуляция и плагины, hooks, валидация и сериализация, тесты через `inject`, деплой, мониторинг, разделение на микросервисы. Написана под Fastify v4 (Node 18+). Изменения в Fastify 5 небольшие, но сверяйтесь с migration guide |
| [JavaScript in Depth](https://www.manning.com/books/javascript-in-depth) (MEAP) | James M. Snell, Manning; MEAP с ноября 2025, 11 из 13 глав (сентябрь 2026), финал ожидается весной 2027 (`releaseDate` 2027-02-15), ~520 стр.; платно | **Самая перспективная готовящаяся книга.** Snell — член Node TSC, делегат TC39 и principal engineer Cloudflare Workers. Книга «как это устроено»: асинхронные задачи, память, чем отличаются рантаймы (Node, Deno, Bun), streams, API fs и crypto, ловушки производительности |
| [Node.js in Action, 2nd ed.](https://www.manning.com/books/node-js-in-action-second-edition) | Alex Young, Bradley Meck, Mike Cantelon и др., Manning, август 2017 | `[устарело]`: сначала callbacks, эпоха Node 8, нет ESM. Замена: Node.js Design Patterns 4e. RU: «Node.js в действии. 2-е издание» (Питер) |
| [Node.js in Practice](https://www.manning.com/books/node-js-in-practice) | Alex Young и Marc Harter, Manning, декабрь 2014 | `[устарело]`, историческая. 115 техник «проблема — решение»; главы о streams и events всё ещё учат модели |
| [Get Programming with Node.js](https://www.manning.com/books/get-programming-with-node-js) | Jonathan Wexler, Manning, февраль 2019 | `[устарело]`: учебник для начинающих на Express и MongoDB. Замена: Node.js for Beginners (2024) или Node.js Projects того же автора (2025) |
| [Node.js 8 the Right Way](https://pragprog.com/titles/jwnode2/node-js-8-the-right-way/) | Jim R. Wilson, Pragmatic Bookshelf, декабрь 2017, 334 стр. | `[устарело]` (Node 8). Хороший короткий тур по fs, сети, ZeroMQ, Elasticsearch и Express, но новичкам не нужен. Замена: Node.js for Beginners, Node.js Learn |
| Web Development with Node and Express, 2nd ed. | Ethan Brown, O'Reilly, 2019 `[не проверено]` | `[устарело]` относительно Express 5 (2024) и современного Node. Замена: документация Express 5 или Fastify. RU: [«Веб-разработка с применением Node и Express. 2-е издание»](https://www.piter.com/product/veb-razrabotka-s-primeneniem-node-i-express-polnotsennoe-ispolzovanie-steka-javascript-2-e-izdanie) (Питер) |
| [Secure Your Node.js Web Application](https://pragprog.com/titles/kdnodesec/secure-your-node-js-web-application/) | Karl Düüna, Pragmatic, январь 2016, 230 стр. | `[устарело]`. Замена: официальная страница Security Best Practices, OWASP Cheat Sheet и [domains-server.md](domains-server.md) |

## Книги о языке JavaScript

### Ключевые выводы

- Актуальные книги о языке — Eloquent JavaScript 4e (2024, бесплатно онлайн) и Exploring JavaScript Раушмайера (издание ES2025, теперь только платно, сайт автора офлайн).
- JavaScript: The Definitive Guide 7e (2020) остановилась на ES2020. Это по-прежнему лучший единый справочник, но в нём нет ES2021+ (`Object.groupBy`, iterator helpers, методы `Set`, explicit resource management). Пробелы закрывайте по MDN и [idioms-patterns.md](idioms-patterns.md).
- Ни одна массовая книга не описывает ES2025/ES2026 в применении к Node 24/26. javascript.info и MDN свежее любой печати.
- В MEAP у Manning готовятся два заметных обновления 2027 года: Secrets of the JavaScript Ninja 3e и JavaScript in Depth Снелла.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Eloquent JavaScript, 4th ed.](https://nostarch.com/eloquent-javascript-4th-edition) ([бесплатно онлайн](https://eloquentjavascript.net/)) | Marijn Haverbeke, No Starch, сентябрь 2024, 456 стр.; онлайн бесплатно (CC) | Описывает «версию JavaScript 2024 года»: optional chaining, `??`, поля и приватные поля классов, новые методы. Вторая половина — браузер и **Node.js**. Лучшая первая книга для программистов. RU: только 3-е изд. «Выразительный JavaScript» (Питер, 2021) `[не проверено]`; перевода 4-го издания нет — отставание на одно издание |
| JavaScript: The Definitive Guide, 7th ed. | David Flanagan, O'Reilly, 2020 `[не проверено]`; платно | Полный справочник (ES2020) с главами о Node, итераторах и генераторах, асинхронности, модулях. 8-е издание на ноябрь 2026 не анонсировано. RU: «JavaScript. Полное руководство», 7-е изд. (Диалектика, 2021) `[не проверено]` |
| [You Don't Know JS Yet, 2nd ed.](https://github.com/getify/You-Dont-Know-JS) | Kyle Simpson, самиздат, с 2020; бесплатно на GitHub (ветка по умолчанию `2nd-ed`) | Готовы *Get Started* и *Scope & Closures*; *Objects & Classes* и *Types & Grammar* — черновики `[не проверено]`. Глубокая модель области видимости, замыканий, `this`, приведения типов. RU: 1-е изд. «Вы не знаете JS» (Питер) |
| [Exploring JavaScript](https://exploringjs.com/) (издание ES2025, бывшая *JavaScript for impatient programmers*) | Axel Rauschmayer, самиздат, 2025; платно (продаётся через Payhip) | Точный и свежий охват всех возможностей до ES2025 (переписаны главы об асинхронности, есть `cause` у ошибок). **На ноябрь 2026 exploringjs.com показывает «temporarily offline»**: автор пишет, что бесплатные онлайн-версии снимаются, потому что доход от книг упал «from being enough to live off (2024) to zero (2026)», а трафик к бесплатным версиям почти целиком идёт от AI-краулеров и стал ему не по карману. Книги по-прежнему продаются на Payhip. Другие его книги: *Deep JavaScript*, *Shell scripting with Node.js* |
| [Learning JavaScript Design Patterns, 2nd ed.](https://www.oreilly.com/library/view/learning-javascript-design/9781098139865/) ([бесплатно: patterns.dev](https://www.patterns.dev/)) | Addy Osmani, O'Reilly, апрель 2023, ~298 стр. | Паттерны GoF на современном JS (модули, миксины, observer, mediator) и паттерны React и рендеринга. Читателям о Node нужны главы о module, observer и mediator |
| [JavaScript Crash Course](https://nostarch.com/javascript-crash-course) | Nick Morgan, No Starch, январь 2024, 376 стр.; платно | Быстрое проектное введение для абсолютных новичков (с уклоном в браузер) |
| [Secrets of the JavaScript Ninja, 3rd ed.](https://www.manning.com/books/secrets-of-the-javascript-ninja-third-edition) (MEAP) | Burnham, Bibeault, Maras, Resig, Manning, ожидается в 2027 (`releaseDate` 2027-04-15) | Обновление классики 2016 года: функции, замыкания, прототипы, генераторы, асинхронность. 2-е изд. (2016) `[устарело]`, замена — это 3-е |
| [The Joy of JavaScript](https://www.manning.com/books/the-joy-of-javascript) | Luis Atencio, Manning, февраль 2021; платно | Композиция, функциональные приёмы, модули, async и streams, метапрограммирование (Proxy/Reflect) |
| [Grokking Functional Programming](https://www.manning.com/books/grokking-functional-programming) | Michał Płachta, Manning, сентябрь 2022; платно | ФП без привязки к языку (примеры на Scala) — фон для дизайна «неизменяемое чистое ядро» в JS |
| [Async JavaScript](https://pragprog.com/titles/tbajs/async-javascript/) | Trevor Burnham, Pragmatic, ноябрь 2012 | `[устарело]`: до стандартных promises. Замена: главы 4–5 Node.js Design Patterns 4e |

## Книги о TypeScript

### Ключевые выводы

- **Все книги ниже написаны до TypeScript 7** (7.0.2 — `latest` с 2026-07-08, компилятор на Go; 6.0.3 от 2026-04-16 — последний релиз на JS), и большинство — до `erasableSyntaxOnly` из TS 5.8 и до type stripping в Node.
- Главы о системе типов не стареют. Главы об опциях компилятора и инструментах (`moduleResolution`, `ts-node`, сборки на `tsc`) сверяйте с [typescript.md](typescript.md) и [TSConfig reference](https://www.typescriptlang.org/tsconfig/).
- Лучшая современная книга для JS-разработчика — Total TypeScript Essentials (бесплатно онлайн, печать No Starch — апрель 2026, самая новая книга о TS от крупного издателя). Лучшая книга среднего и продвинутого уровня — Effective TypeScript 2e.
- TypeScript на русском представлен хорошо: «Эффективный TypeScript» 2-е изд., «Рецепты TypeScript», «Изучаем TypeScript».

Минимальная конфигурация под нативный запуск TS в Node (подробности — в [typescript.md](typescript.md)):

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Effective TypeScript, 2nd ed.](https://effectivetypescript.com/) ([O'Reilly](https://www.oreilly.com/library/view/effective-typescript-2nd/9781098155056/)) | Dan Vanderkam, O'Reilly, 2024 (листинги: апрель–июнь 2024), 83 пункта; платно | Лучшая книга о TS среднего и продвинутого уровня: дизайн типов («make invalid states unrepresentable»), дисциплина `any`/`unknown`, вывод типов, программирование на уровне типов (новая глава), рецепты (новая глава), миграция. На сайте — errata и блог. RU: [«Эффективный TypeScript: 83 способа улучшить код. 2-е изд.»](https://www.piter.com/product/effektivnyy-typescript-83-sposoba-uluchshit-kod-2-e-izd) (Питер) — отставание около года |
| [Total TypeScript: The Essentials](https://www.totaltypescript.com/books/total-typescript-essentials) ([печать No Starch](https://nostarch.com/total-typescript), [анонс](https://www.totaltypescript.com/announcing-a-free-book-a-course-a-huge-price-cut)) | Matt Pocock и Taylor Bell, No Starch, апрель 2026, 432 стр.; онлайн бесплатно навсегда | 16 глав: от настройки до выведения типов, type predicates и assertion functions, конфигурации компилятора в реальном проекте. Лучшая современная книга о TS для JS-разработчиков |
| [Learning TypeScript](https://www.learningtypescript.com/) (упражнения) | Josh Goldberg, O'Reilly, июнь 2022, 320 стр.; платно | Основы от мейнтейнера typescript-eslint; на сайте проекты и упражнения к каждой главе. RU: «Изучаем TypeScript» (по листингу маркетплейса — 2025) `[не проверено]` |
| [TypeScript Cookbook](https://www.oreilly.com/library/view/typescript-cookbook/9781098136642/) ([страница автора](https://oida.dev/books/)) | Stefan Baumgartner, O'Reilly, август 2023, 419 стр.; платно | Рецепты: настройка проекта (включая ESM/CJS в Node), generics, условные типы, template literal types, вариативные кортежи, вспомогательные типы. RU: [«Рецепты TypeScript»](https://www.piter.com/product/retsepty-typescript) (Питер) |
| [Programming TypeScript](https://www.oreilly.com/library/view/programming-typescript/9781492037644/) | Boris Cherny, O'Reilly, май 2019, 322 стр.; платно | Ясное объяснение устройства системы типов (вариантность, совместимость, полнота). Второго издания нет. **Частично `[устарело]`**: главы о сборке и конфигурации написаны до TS 4–7, замена — TSConfig reference. RU: «Профессиональный TypeScript» (Питер, 2020 `[не проверено]`) |
| [Essential TypeScript 5, 3rd ed.](https://www.manning.com/books/essential-typescript-5-third-edition) | Adam Freeman, Manning, август 2023, 568 стр.; платно | Длинный тур на примерах, включая Node, Express, React, Angular. RU: [«Основы TypeScript»](https://www.piter.com/product/osnovy-typescript) (Питер; какое издание переведено — не подтверждено `[не проверено]`) |
| [TypeScript Quickly](https://www.manning.com/books/typescript-quickly) | Yakov Fain и Anton Moiseev, Manning, февраль 2020 | `[устарело]` (TS 3.x). Замена: Total TypeScript Essentials. RU: «TypeScript быстро» (Питер) |
| [Debugging TypeScript Applications](https://pragprog.com/titles/aodjs/debugging-typescript-applications/) | Andrey Ozornin, Pragmatic, май 2026, 180 стр.; платно | Новая короткая книга: вывод и чтение ошибок, настройка отладки, веб-приложения, которые не ломаются |
| [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html), раздел [Modules](https://www.typescriptlang.org/docs/handbook/modules/introduction.html), [TSConfig reference](https://www.typescriptlang.org/tsconfig/) | Microsoft, живые; бесплатно | Первоисточник. Раздел **Modules** — лучшее объяснение того, как TS моделирует разрешение ESM/CJS в Node. Обязательно прочитать до выбора `module: nodenext` |
| [TypeScript Deep Dive](https://basarat.gitbook.io/typescript) | Basarat Ali Syed; бесплатно | Частично `[устарело]` (эпоха TS 3–4). Годится для основ; замена — Handbook и Total TypeScript Essentials |
| [Type-Level TypeScript](https://type-level-typescript.com/) | Gabriel Vergnaud `[не проверено]` (вводные главы бесплатно, курс платный) | Лучший структурированный материал об условных, mapped и рекурсивных типах. В прикладном коде применяйте сдержанно |
| [typescript-go](https://github.com/microsoft/typescript-go) и [блог TypeScript](https://devblogs.microsoft.com/typescript/) | Microsoft, 2025–2026 | Не книга, а первоисточник об изменениях TS 7 (скорость, удалённые опции), которых пока нет ни в одной книге |

## Тестирование, архитектура и безопасность

### Ключевые выводы

- Ни одна книга не описывает глубоко `node:test` или Vitest 3/4. Лучшая книга о дизайне тестов — The Art of Unit Testing 3e (2024, на Jest). Текущие инструменты — в разделе Test Runner на Node Learn, в репозитории Goldberg и в [testing.md](testing.md).
- Книги о безопасности Node старые (2016–2017) или узкие (Liran Tal, только инъекции). Их заменяют официальная страница Security Best Practices, OWASP и разборы атак на цепочку поставок 2025–2026 годов.
- Архитектурные знания для Node дают книги без привязки к языку (DDIA 2e 2026, Fundamentals of Software Architecture 2e 2025, Release It! 2e, Building Microservices 2e), главы 12–13 Node.js Design Patterns 4e и Distributed Systems with Node.js. Подробнее — [architecture.md](architecture.md).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [The Art of Unit Testing, 3rd ed.](https://www.manning.com/books/the-art-of-unit-testing-third-edition) (примеры на JavaScript) | Roy Osherove и Vladimir Khorikov, Manning, февраль 2024; платно | Классика о дизайне unit-тестов, переписанная на JavaScript, TypeScript и Node (Jest): именование, изоляция, fakes против mocks, сопровождаемость, стратегия, legacy-код. RU: [«Искусство юнит-тестирования с примерами на JavaScript. 3-е межд. изд.»](https://www.piter.com/product/iskusstvo-yunit-testirovaniya-s-primerami-na-javascript-3-e-mezhd-izd) (Питер) |
| [Testing JavaScript Applications](https://www.manning.com/books/testing-javascript-applications) | Lucas da Costa, Manning, март 2021; платно | Практическая пирамида тестов для JS: Jest, бэкенды на Node, UI, E2E, TDD, CI. Версии инструментов устарели (нет Vitest и `node:test`), принципы — нет |
| [JavaScript & Node.js Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices) | Yoni Goldberg; бесплатно, обновляется | 50+ практик: AAA, black-box, компонентные тесты вместо unit, тестовые данные, CI. Самый цитируемый бесплатный гайд по тестам в мире Node. См. [testing.md](testing.md) |
| [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) | Yoni Goldberg и др.; бесплатно; заголовок репозитория — «(July 2026)» | 100+ практик: структура, ошибки, стиль, тесты, продакшен, безопасность, производительность, Docker. Лучший материал в форме чеклиста; часть пунктов отстаёт от текущего Node — сверяйте с документацией. Есть переводы, в том числе на русский |
| [Practica.js](https://github.com/practicajs/practica) | Yoni Goldberg, Michael Salomon и др. | Эталонный стартер, реализующий nodebestpractices: компонентная структура, тесты, обработка ошибок. Читайте код, а не генерируйте проект вслепую |
| [Node.js Secure Coding](https://leanpub.com/nodejs-secure-coding) | Liran Tal, самиздат (Leanpub; бумажная версия Lulu — май 2024 `[не проверено]`); платно | Инъекции команд и кода в Node на реальных CVE из npm и защитные паттерны. Узко, но глубоко |
| [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices) и [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html) | Node.js Security WG; OWASP; бесплатно | Официальный список от модели угроз: HTTP DoS, DNS rebinding, prototype pollution, цепочка поставок, `--permission`. Бесплатно и актуально; заменяет старые книги о безопасности Node. Детали — в [domains-server.md](domains-server.md) и [toolchain.md](toolchain.md) |
| [Designing Data-Intensive Applications, 2nd ed.](https://www.oreilly.com/library/view/designing-data-intensive/9781098119058/) ([анонс автора](https://martin.kleppmann.com/2026/03/24/designing-data-intensive-applications-2e.html)) | Martin Kleppmann и Chris Riccomini, O'Reilly, февраль–март 2026; платно | Без привязки к языку, но обязательно для бэкендеров на Node: хранение, репликация, партиционирование, транзакции, потоковая обработка, облачные системы данных. 1-е изд. (2017) `[устарело]`, замена — это 2-е |
| [Refactoring, 2nd ed.](https://martinfowler.com/books/refactoring.html) | Martin Fowler, Addison-Wesley, конец 2018; платно | Каталог рефакторингов. Примеры 2-го издания написаны на JavaScript `[не проверено]`, поэтому названия приёмов («Extract Function», «Replace Conditional with Polymorphism», «Split Phase») прямо годятся как словарь для ревью Node-кода |
| [Release It!, 2nd ed.](https://pragprog.com/titles/mnee2/release-it-second-edition/) | Michael Nygard, Pragmatic, январь 2018; платно | Паттерны стабильности: таймауты, circuit breakers, bulkheads, steady state. Нужны каждому сервису на Node |
| [Fundamentals of Software Architecture, 2nd ed.](https://www.oreilly.com/library/view/fundamentals-of-software/9781098175504/) | Mark Richards и Neal Ford, O'Reilly, март 2025, ~546 стр.; платно | Архитектурные стили и анализ компромиссов (модульный монолит против микросервисов, событийная архитектура). Фон для [architecture.md](architecture.md) |
| [Building Microservices, 2nd ed.](https://samnewman.io/books/building_microservices_2nd_edition/) | Sam Newman, O'Reilly, 2021 `[не проверено]`; платно | Когда (не) делить на сервисы. Дополняет Distributed Systems with Node.js |
| [solidbook.io](https://solidbook.io/) и [khalilstemmler.com](https://khalilstemmler.com/) | Khalil Stemmler | DDD, чистая архитектура и тесты на TypeScript/Node. Статьи бесплатны, книга давно в работе `[не проверено]` |
| [patterns.dev](https://www.patterns.dev/) | Lydia Hallie и Addy Osmani; бесплатно | Бесплатный спутник книги Osmani: module, observer, mediator, proxy, критика singleton |

## Официальная документация и Learn

### Ключевые выводы

- Раздел [Node.js Learn](https://nodejs.org/en/learn) перестроен в 2024–2025 годах и стал полноценной программой. Группы на 2026-11-06: Getting Started (в том числе «Node.js, the difference between development and production», Profiling, WebAssembly, **Security Best Practices**, Userland Migrations), Command Line, HTTP («Anatomy of an HTTP Transaction», «Enterprise Network Configuration»), Manipulating Files, Asynchronous Work (event loop, `nextTick`, `setImmediate`, **Don't Block the Event Loop**), Concurrency («Comparing Node.js concurrency models»), **TypeScript** (нативный запуск, транспиляция, runner, публикация TS-пакета), Modules (streams, **Backpressuring in Streams**, публикация пакета, Node-API пакет, стабильность ABI), **Diagnostics** (память: tuning, heap profiler, heap snapshot, трассировка GC; live debugging; poor performance с Linux perf; flame graphs), **Test Runner** (введение, использование, mocking, coverage), Node-API (getting started, build tools, AsyncWorker, thread-safe functions), **Userland Migrations**.
- [Документация API](https://nodejs.org/api/) по умолчанию показывает **v26.13.0**. На странице каждого модуля есть **Stability index** (0 Deprecated … 3 Legacy). Проверяйте его, прежде чем рекомендовать API из книги.
- Страницы **Userland Migrations** и проект `@nodejs/codemod` — официальный список «замените зависимость встроенным API»: chalk/kleur/ansi-colors → `util.styleText`, axios → `fetch`, Mocha → `node:test`, правильные спецификаторы TS. Это готовые пункты чеклиста ревью (см. [idioms-patterns.md](idioms-patterns.md)).
- Черновик спецификации уже называется «ECMAScript® 2027». В [tc39/proposals](https://github.com/tc39/proposals) проверяйте, на какой стадии на самом деле фича из блог-поста.

```js
// Пример миграции из Userland Migrations: chalk → встроенный util.styleText
import { styleText } from 'node:util';
console.log(styleText(['bold', 'red'], 'Ошибка сборки'));
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js Learn](https://nodejs.org/en/learn) | Node.js project, живой; бесплатно | Официальная программа (состав — в ключевых выводах). Начинайте с неё до любой книги: она свежее всех |
| [Node.js API docs](https://nodejs.org/api/) | Node.js project | Справочник по каждому встроенному модулю с индексом стабильности и историей «Added in / Changed in» у каждого API |
| [The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) и [Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop) | Node.js project | Два канонических официальных объяснения: фазы, `nextTick` против `setImmediate`, ReDoS и JSON DoS, разбиение работы против выноса, размер threadpool. Глубже — [concurrency-async-native.md](concurrency-async-native.md) |
| Diagnostics: [Memory](https://nodejs.org/en/learn/diagnostics/memory), [Profiling](https://nodejs.org/en/learn/getting-started/profiling), [Flame Graphs](https://nodejs.org/en/learn/diagnostics/flame-graphs), [Diagnostics WG](https://github.com/nodejs/diagnostics) | Node.js Diagnostics WG | Официальные «user journeys» для утечек, медленной работы и падений. Вместе с [performance.md](performance.md) |
| [Running TypeScript Natively](https://nodejs.org/en/learn/typescript/run-natively) | Node.js project | Официальное руководство по type stripping: ограничения (только erasable syntax, нет `paths` из tsconfig) и когда нужен runner или транспилятор |
| [Test runner guides](https://nodejs.org/en/learn/test-runner/introduction) | Node.js project | Официальное введение в `node:test`, mocking и coverage |
| [Publishing a package](https://nodejs.org/en/learn/modules/publishing-a-package) и [Userland Migrations](https://nodejs.org/en/learn/getting-started/userland-migrations) | Node.js project | Публикация с `exports`, ESM и CJS; официальные миграции с зависимостей на встроенные API |
| [Node.js release schedule](https://nodejs.org/en/about/previous-releases) и [Node.js blog](https://nodejs.org/en/blog) | Node.js Release WG | Даты LTS и EOL, анонсы релизов. Каждый пост релиза перечисляет заметные изменения — самый быстрый способ узнать, что нового |
| [Node.js core contributing docs](https://github.com/nodejs/node/tree/main/doc/contributing) | Node.js project | Как ядро собирают, тестируют и бенчмаркают (руководство по `benchmark/`). Прочитайте до чтения `lib/` |
| [libuv design overview](https://docs.libuv.org/en/v1.x/design.html) | libuv project | Короткое авторитетное описание event loop и threadpool под Node |
| [V8 blog](https://v8.dev/blog) и [V8 docs](https://v8.dev/docs) | команда V8 | Возможности движка, уровни JIT, GC, посты «fast X». Первоисточник большинства советов о производительности JS (см. [performance.md](performance.md)) |
| [MDN JavaScript Guide и Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) | Mozilla и сообщество | Справочник по языку и встроенным объектам; таблицы совместимости включают Node и Deno |
| [ECMAScript spec](https://tc39.es/ecma262/) и [TC39 proposals](https://github.com/tc39/proposals) | TC39 | Истина о семантике языка и стадиях предложений |
| TypeScript Handbook и TSConfig reference | Microsoft | См. [Книги о TypeScript](#книги-о-typescript) |

## Бесплатные онлайн-книги, курсы и практика

### Ключевые выводы

- Лучший бесплатный JS-учебник — javascript.info. Он вырос из русского learn.javascript.ru, поэтому это первая рекомендация и для русскоязычных читателей.
- Лучший бесплатный структурированный курс по бэкенду на JS — Full Stack Open Хельсинкского университета (Node и Express, тесты, TypeScript, CI/CD).
- NodeSchool `[устарело]`: воркшопы почти не поддерживаются и написаны в эпоху callbacks. Замена — Node Learn и Full Stack Open.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [The Modern JavaScript Tutorial](https://javascript.info/) ([русский оригинал](https://learn.javascript.ru/)) | Илья Кантор и соавторы, живой | Лучший бесплатный учебник JS: замыкания, прототипы, promises, асинхронная итерация, генераторы, модули. Части 2–3 местами про браузер |
| [Eloquent JavaScript 4e онлайн](https://eloquentjavascript.net/) | Marijn Haverbeke, 2024 | Полный текст бесплатно, включая главу о Node.js |
| [You Don't Know JS Yet](https://github.com/getify/You-Dont-Know-JS) | Kyle Simpson | Бесплатно на GitHub; см. [Книги о языке JavaScript](#книги-о-языке-javascript) |
| [Total TypeScript Essentials](https://www.totaltypescript.com/books/total-typescript-essentials) | Matt Pocock, 2024–2026 | Бесплатно онлайн; см. [Книги о TypeScript](#книги-о-typescript) |
| [Full Stack Open](https://fullstackopen.com/en/) ([часть 3: Node.js и Express](https://fullstackopen.com/en/part3)) | University of Helsinki; бесплатно, обновляется ежегодно | Строгий курс с университетскими кредитами: Node и Express, MongoDB, тесты (часть 4), TypeScript (часть 9), CI/CD, GraphQL, контейнеры |
| [The Odin Project: Full Stack JavaScript → NodeJS](https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs) | The Odin Project; бесплатно | Проектный путь: Express, PostgreSQL, аутентификация, API, тесты |
| [freeCodeCamp: Back End Development and APIs](https://www.freecodecamp.org/learn/back-end-development-and-apis/) | freeCodeCamp; бесплатно | Сертификация для начинающих (npm, Express, MongoDB). Неглубоко, зато бесплатно |
| Exercism: треки [JavaScript](https://exercism.org/tracks/javascript) и [TypeScript](https://exercism.org/tracks/typescript) | Exercism; бесплатно | Упражнения с **ревью ментора** по идиоматичности кода |
| [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS) и [Mostly Adequate Guide to FP](https://mostly-adequate.gitbook.io/mostly-adequate-guide) | Kyle Simpson; Brian Lonsdorf | Прагматичное ФП в JS (композиция, неизменяемость, point-free). Бесплатные тексты за дизайном «чистое ядро, императивная оболочка» |
| [Understanding ECMAScript 6](https://leanpub.com/understandinges6/read) | Nicholas C. Zakas, 2016 | `[устарело]` как список возможностей (до ES2016). Объяснения классов, модулей, promises и proxies всё ещё ясные. Замена: javascript.info |
| [roadmap.sh: Node.js](https://roadmap.sh/nodejs) | сообщество roadmap.sh | Карта тем для самообучения. Используйте как чеклист, не как содержание |
| [awesome-nodejs](https://github.com/sindresorhus/awesome-nodejs) | Sindre Sorhus и др. | Каталог пакетов. Многие записи устарели; проверяйте поддержку перед выбором (см. [toolchain.md](toolchain.md)) |
| [NodeSchool](https://nodeschool.io/) | сообщество | `[устарело]`: learnyounode, stream-adventure и другие воркшопы почти не поддерживаются. Замена: Node Learn и Full Stack Open |
| [RafaelGSS/nodejs-bench-operations](https://github.com/RafaelGSS/nodejs-bench-operations) | Rafael Gonzaga | «Быстрее ли X, чем Y, в Node vX.Z?» — результаты микробенчмарков по версиям Node. Данные, а не учебник; см. [performance.md](performance.md) |

## Платные курсы и сертификаты

### Ключевые выводы

- **JSNAD снята.** Страница Linux Foundation: «The OpenJS Node.js Application Developer (JSNAD) Exam was retired as of September 30, 2025». Курс LFW211 помечен «Course Inactive». Страница LFW212 отдаёт 404; снята ли вместе с ней сертификация JSNSD, не подтверждено `[не проверено]`. Не рекомендуйте их как действующие.
- Платные видеокурсы полезны для структуры, но API в них стареют так же, как в книгах.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Frontend Masters: Introduction to Node.js v3](https://frontendmasters.com/courses/node-js-v3/) и [путь Node.js](https://frontendmasters.com/learn/node-js/) | Scott Moss и др. (там же курсы Kyle Simpson по JS); платно | Хорошо сделанные видеокурсы; путь связывает Node, дизайн API, TypeScript и тесты |
| [Total TypeScript](https://www.totaltypescript.com/) (курсы) | Matt Pocock; платно | Воркшопы по TS: трансформации типов, generics, продвинутые паттерны. Книга Essentials бесплатна |
| [JSNAD](https://training.linuxfoundation.org/certification/jsnad/) и курс [LFW211](https://training.linuxfoundation.org/training/nodejs-application-development-lfw211/) | OpenJS / Linux Foundation | `[устарело]`: сертификация снята 2025-09-30, курс неактивен. Замены как сертификата нет; для обучения — Node Learn и Full Stack Open |
| [Udemy: Learn and Understand NodeJS](https://www.udemy.com/course/understand-nodejs/) | Anthony Alicea; платно | Популярный курс о внутренностях V8 и libuv на уровне концепций. Записан в эпоху Node 4–6: `[устарело]` в деталях API `[не проверено]` |

## Блоги и авторы

### Ключевые выводы

- **Два самых цитируемых справочных сайта по JS в 2026 году ушли офлайн**: exploringjs.com и 2ality.com Акселя Раушмайера показывают «temporarily offline» (автор объясняет это обвалом дохода от книг к 2026 году и трафиком AI-краулеров, который ему не по карману). Старые ссылки на них в книгах и статьях пока мертвы. Те же факты ищите на MDN, javascript.info и в TC39, книги автора покупайте на Payhip.
- Лучшее соотношение сигнала к шуму о внутренностях Node — у блогов людей из ядра (Collina, Cheung, Nizipli, Gonzaga, Snell, Henningsen) и у компаний Platformatic, NearForm и Igalia.
- Цифры из блогов Bun, Deno и вендоров фреймворков читайте критически: требуйте методику (см. [чеклист](#чеклист-источник-как-обоснование-изменения)).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js blog](https://nodejs.org/en/blog) | Node.js project | Релизы, security-релизы, разборы уязвимостей, анонсы модели релизов |
| [nodeland.dev](https://nodeland.dev/) ([список докладов](https://nodeland.dev/talks.html)), [блог Platformatic](https://blog.platformatic.dev/) | Matteo Collina (Node TSC, Fastify, Pino, Undici; CTO Platformatic) | Производительность, HTTP-клиенты, здоровье event loop, потоки, память, серверы приложений. Страница докладов ссылается на каждую запись — лучший указатель докладов о Node 2022–2025 |
| [joyeecheung.github.io/blog](https://joyeecheung.github.io/blog/) | Joyee Cheung (Igalia, Node TSC, контрибьютор V8) | Первоисточник о `require(esm)`, startup snapshots, compile cache, внутренностях загрузчика модулей |
| [yagiz.co](https://www.yagiz.co/) | Yagiz Nizipli (Node TSC; парсер URL Ada) | Работа над производительностью ядра (разбор URL, `fs`, встроенный `.env`) |
| [rafaelgss.dev](https://rafaelgss.dev/) ([блог](https://blog.rafaelgss.dev/): посты State of Node.js Performance 2023/2024) | Rafael Gonzaga (Node TSC, безопасность и производительность) | Замеры производительности Node от версии к версии, методика бенчмарков, процесс security-релизов. **blog.rafaelgss.dev 2026-11-06 отвечал 502** `[не проверено]`; основной сайт работает |
| [jasnell.me](https://jasnell.me/) | James Snell (Node TSC, Cloudflare Workers, TC39) | Web-platform API в Node, производительность streams, совместимость рантаймов (WinterTC). Его MEAP — в [Книгах о Node.js](#книги-о-nodejs) |
| [addaleax.net](https://addaleax.net/) | Anna Henningsen (бывший член Node TSC; MongoDB) | Workers, встраивание, нативные аддоны, внутренности ядра; недавние работы над mongosh |
| [Speeding up the JavaScript ecosystem](https://marvinh.dev/blog/speeding-up-javascript-ecosystem/) | Marvin Hagemeister (Preact, Deno), с 2022 | Лучшая серия разборов реальной производительности JS-инструментов: разрешение модулей, полифилы, линтинг, barrel files, npm scripts. Главный урок — методика |
| [benediktmeurer.de](https://benediktmeurer.de/), [mrale.ph](https://mrale.ph/), [mathiasbynens.be/notes](https://mathiasbynens.be/notes) | Benedikt Meurer, Vyacheslav Egorov, Mathias Bynens (нынешние и бывшие инженеры V8) | Классические глубокие посты об оптимизации V8, inline caches, shapes, elements kinds. Посты mrale.ph о ловушках микробенчмарков — по-прежнему эталон |
| [jakearchibald.com](https://jakearchibald.com/) | Jake Archibald | Event loop, tasks против microtasks, streams, «await vs return» — точная семантика, общая с Node |
| [loige.co](https://loige.co/) ([примеры streams](https://github.com/lmammino/streams-examples)) | Luciano Mammino (соавтор Design Patterns, AWS Hero) | Streams в Node, serverless и Lambda на Node, Rust вместе с Node |
| [2ality.com](https://2ality.com/) | Axel Rauschmayer | Десятилетие точных объяснений возможностей ECMAScript. **На ноябрь 2026 — «temporarily offline»**. Замена на время простоя: MDN, javascript.info, TC39 |
| [NearForm](https://nearform.com/digital-community/), [Igalia](https://blogs.igalia.com/) | NearForm (откуда вышли Fastify, Pino, Undici); Igalia (контрибьюторы V8 и Node) | Инженерные посты компаний, где работают люди из ядра |
| [Socket.dev blog](https://socket.dev/blog), [Snyk blog](https://snyk.io/blog/), [lirantal.com](https://www.lirantal.com/blog) | Socket; Snyk; Liran Tal | Инциденты цепочки поставок npm (черви и взломанные мейнтейнеры 2025–2026), разборы вредоносных пакетов, безопасность Node. См. [toolchain.md](toolchain.md) |
| [Shai-Hulud Strikes Again (v2)](https://socket.dev/blog/shai-hulud-strikes-again-v2) | исследователи Socket, 2025 | Показательный разбор самораспространяющегося червя npm 2025 года. Обязательный контекст для любого списка о цепочке поставок |
| [HTTP Toolkit blog](https://httptoolkit.com/blog/) | Tim Perry | Глубокие, хорошо проверенные посты о внутренностях HTTP и TLS в Node, прокси и отладке |
| [Total TypeScript articles](https://www.totaltypescript.com/articles) | Matt Pocock | Короткие практичные статьи о TS: шпаргалка по tsconfig, `satisfies`, настройки модулей |
| [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) ([блог автора](https://sindresorhus.com/blog)), [Move on to ESM-only](https://antfu.me/posts/move-on-to-esm-only) | Sindre Sorhus, 2021; Anthony Fu, 2025 | Два знаковых текста за ESM-only: gist Sindre 2021 года (болезненно до `require(esm)`) и пост Fu 2025 года (практично теперь, когда `require(esm)` работает во всех поддерживаемых ветках). Контекст для [Спорных мест](#спорные-места) и [domains-client.md](domains-client.md) |
| [Deno blog](https://deno.com/blog), [Bun blog](https://bun.com/blog) ([Bun is joining Anthropic](https://bun.com/blog/bun-joins-anthropic)) | Deno Land; Bun (теперь часть Anthropic) | Релизы конкурирующих рантаймов; полезны для кросс-рантайм-совместимости и как источник бенчмарк-заявлений (читать критически) |

## Рассылки, подкасты, конференции и опросы

### Ключевые выводы

- Чтобы быть в курсе, хватит Node Weekly и JavaScript Weekly.
- **JS Party закончился**: на странице Changelog — «This podcast is not currently in production», последний выпуск #350 «One last party» вышел 2025-02-13. Архив полезен, но как текущий подкаст его не рекомендуйте.
- **NodeConf EU вернулась в 2026 году** (Болонья, Hotel Savoia Regency). Сайт пишет, что все 24 доклада 2026 года собраны в одном плейлисте YouTube. NodeConf EU 2027 анонсирована на 14–15 сентября 2027 года там же. Доклады 2026 года (загружены в конце октября 2026) — самый свежий экспертный материал о Node (см. [Свежие доклады](#свежие-доклады)).
- GitNation проводит **Node Congress** (2026: 26–27 марта) и **JSNation** (Амстердам в июне и JSNation US в ноябре). Страницы докладов с транскриптами на gitnation.com помогают найти записи.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node Weekly](https://nodeweekly.com/), [JavaScript Weekly](https://javascriptweekly.com/) | Cooperpress (Peter Cooper), еженедельно | Две стандартные рассылки: релизы Node, заметные статьи, пакеты. Максимум сигнала на минуту чтения |
| [Bytes](https://bytes.dev/) | ui.dev, еженедельно | Новости JS-экосистемы с юмором (больше о фронтенде) |
| [Syntax](https://syntax.fm/) (например, [ep. 716 «JS Perf Wins & New Node.js Features with Yagiz Nizipli»](https://syntax.fm/show/716/js-perf-wins-and-new-node-js-features-with-yagiz-nizipli/transcript), январь 2024 `[не проверено]`) | Wes Bos и Scott Tolinski | Самый популярный подкаст о веб-разработке; регулярные выпуски о Node и рантаймах с людьми из ядра |
| [PodRocket](https://podrocket.logrocket.com/) (например, [«What's New In Node 24» с Rafael Gonzaga](https://www.youtube.com/watch?v=EsmDfD-Pte0)) | LogRocket | Интервью с мейнтейнерами, обзоры релизов Node |
| [devtools.fm](https://devtools.fm/) | Andrew Lisowski и Justin Bennett | Интервью с мейнтейнерами инструментов (Yagiz Nizipli о производительности Node, декабрь 2023) |
| [Node.js in 2026 with Rafael Gonzaga](https://softwareengineeringdaily.com/2025/12/23/node-js-in-2026-with-rafael-gonzaga/) | Software Engineering Daily, декабрь 2025 | Состояние производительности Node, как на самом деле устроены бенчмарки, процесс релизов. Аудиоспутник [performance.md](performance.md) |
| [JS Party](https://changelog.com/jsparty) | Changelog Media | `[устарело]`: **закрыт**, последний выпуск #350 — 2025-02-13. Архив полезен. Замена: Syntax, PodRocket |
| [JavaScript Jabber](https://javascriptjabber.com/) | Top End Devs | Давний подкаст с интервью; качество неровное |
| [NodeConf EU](https://www.nodeconf.eu/) | Nearform и сообщество | Главная конференция о Node; доклады 2026 года опубликованы |
| [Node Congress 2026](https://gitnation.com/events/node-congress-2026), [JSNation](https://jsnation.com/) | GitNation | Страницы докладов с транскриптами, например [The State of Node.js 2025](https://gitnation.com/contents/the-state-of-nodejs-2025) (Collina, JSNation 2025) и [Run TypeScript Natively in Node.js](https://gitnation.com/contents/run-typescript-natively-in-nodejs) (Ippolito) `[не проверено]` |
| [HolyJS](https://holyjs.ru/) | JUG Ru Group | Главная русскоязычная конференция по JS (HolyJS 2026 Autumn); см. [Ресурсы на русском](#ресурсы-на-русском) |
| [State of JS 2025](https://2025.stateofjs.com/en-US), [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/) | Devographics; Stack Overflow | Данные о распространённости и удовлетворённости рантаймами, тест-раннерами, сборщиками. Отвечают на вопрос «что мейнстрим», но не «что лучше» |
| [OpenJS Foundation](https://openjsf.org/) | OpenJS | Дом Node.js, Express и соседних проектов, инициативы по безопасности |

## Канон докладов

### Ключевые выводы

- Канон о event loop (Philip Roberts 2014, Belder 2016, Sam Roberts 2016, Archibald 2018) по-прежнему верен: фазы libuv и порядок microtasks не менялись. С тех пор добавились `queueMicrotask`, `AbortSignal`, `events.on`, workers — они в свежих докладах и в [concurrency-async-native.md](concurrency-async-native.md).
- Канон о V8 (Bynens и Meurer 2018, Hinkelmann 2017, Meurer 2017) написан до уровней **Sparkplug** (2021) и **Maglev** (2023). Модель shapes и inline caches та же, названия уровней — нет. Доклады Egorov о бенчмарках (2013–2016) не стареют.
- Лучший указатель записанных докладов о Node 2022–2025 с прямыми ссылками — [страница докладов Collina](https://nodeland.dev/talks.html).

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ) | Philip Roberts, JSConf EU 2014 | Каноническое визуальное объяснение стека вызовов, очереди задач и цикла. С уклоном в браузер — смотрите вместе с докладами о Node ниже |
| [In The Loop](https://www.youtube.com/watch?v=cCOL7MC4Pl0) | Jake Archibald, JSConf.Asia 2018 | Tasks, microtasks и рендеринг, точный порядок. Семантика microtasks в Node та же |
| [Everything You Need to Know About Node.js Event Loop](https://www.youtube.com/watch?v=PNa9OMajw9w) | Bert Belder (соавтор libuv), Node Summit 2016 | Исправляет популярные (неверные) схемы event loop; как libuv на самом деле опрашивает |
| [Node's Event Loop From the Inside Out](https://www.youtube.com/watch?v=P9csgxBgaZ8) | Sam Roberts, 2016 | Что выполняется в threadpool, а что через epoll/kqueue/IOCP; `UV_THREADPOOL_SIZE` |
| [JavaScript Engines: The Good Parts™](https://www.youtube.com/watch?v=5nmpokoRaZI) | Mathias Bynens и Benedikt Meurer, JSConf EU 2018 | Shapes, inline caches, elements kinds — модель V8 за большинством советов о производительности |
| [JavaScript engines — how do they even?](https://www.youtube.com/watch?v=p-iiEDtpy6I) | Franziska Hinkelmann, JSConf EU 2017 | Парсер → Ignition → TurboFan, деоптимизации, примеры для Node. Названия уровней — до Sparkplug и Maglev |
| [A Tale of TurboFan: Four years that changed V8 forever](https://www.youtube.com/watch?v=cvybnv79Sek) | Benedikt Meurer, JS Kongress 2017 | Почему списки «optimization killers» эпохи Crankshaft `[устарело]`; замена — измерение |
| [Benchmarking JavaScript](https://www.youtube.com/watch?v=g0ek4vV7nEA), [JavaScript Performance Through the Spyglass](https://www.youtube.com/watch?v=r76ZjdzFExg) ([русская версия на HolyJS](https://www.youtube.com/watch?v=HPFARivHJRY)) | Vyacheslav Egorov, GOTO 2015/2016 | Главные доклады о том, почему микробенчмарки лгут (DCE, constant folding, OSR), и как читать движок. Обязательно до написания бенчмарка (см. [performance.md](performance.md)) |
| [10 Things I Regret About Node.js](https://www.youtube.com/watch?v=M3BM9TB-8yA), [первая презентация Node.js (2009)](https://www.youtube.com/watch?v=ztspvPYybIY) | Ryan Dahl, JSConf EU 2018 / JSConf 2009 | История и компромиссы дизайна (promises, безопасность, `node_modules`, GYP), объясняющие нынешние permission model, ESM и Deno |
| [Broken Promises](https://www.youtube.com/watch?v=XV-u_Ow47s0) | James Snell, ~2019 | Типичные ошибки с promises в Node: необработанные rejections, смешение с callbacks, синхронная работа в async-функциях |
| [Jumping into the deep end with Piscina](https://www.youtube.com/watch?v=yKilZFRx2_c) | James Snell, NodeConf Remote 2020 | Дизайн пула workers для CPU-задач |
| [Node.js: The Road to Workers](https://www.youtube.com/watch?v=-ssCzHoUI7M) | Anna Henningsen, 2018 | Почему `worker_threads` устроены именно так: isolates, передача сообщений, transfer |
| [Node.js startup performance](https://www.youtube.com/watch?v=G36lrPrF09c), [JavaScript and C++ in Node.js core: how do they talk to each other?](https://www.youtube.com/watch?v=GrgMT5zMgF4) | Joyee Cheung, NodeConf Remote 2020 / ~2024 | Дизайн startup snapshot; как JS из `lib/` вызывает C++-привязки из `src/` — карта для чтения ядра |
| [AsyncLocalStorage: usage and best practices](https://www.youtube.com/watch?v=c7ic3TtBtb0), [Node.js observability with diagnostics_channel and AsyncLocalStorage](https://www.youtube.com/watch?v=wqGlbxIHAwI) | Vladimir De Turckheim, 2020; Stephen Belanger, ~2024 | Передача контекста и инструментирование без накладных расходов от авторов этих API |
| [The Journey of the Node.js Permission Model](https://www.youtube.com/watch?v=TKXIV61tYMs) | Rafael Gonzaga, OpenSSF, ~2023 | Дизайн и границы `--permission` |
| [Recreating Node.js from Scratch](https://www.youtube.com/watch?v=ynNDmp7hBdo) | Erick Wendel, ~2022 | Игрушечный рантайм на V8 и libuv; отлично объясняет, что такое Node |
| [Advanced Node.js testing: beyond unit & integration tests](https://www.youtube.com/watch?v=-2zP494wdUY) | Yoni Goldberg, 2019 | Контрактные, мутационные, property-based и компонентные тесты |
| [Do not thrash the Node.js Event Loop](https://www.youtube.com/watch?v=81AqwvXqgG0), [NODE_ENV=production is a lie](https://www.youtube.com/watch?v=irRsEfCTTtg), [A Fastify Tale of Shapes](https://www.youtube.com/watch?v=g-6Ig8k6Nzc), [Everybody is Responsible for Performance](https://www.youtube.com/watch?v=A99zkgoFd18), [I would never use an ORM](https://www.youtube.com/watch?v=atABji4xqiI) | Matteo Collina, 2022–2023 | Здоровье event loop под нагрузкой, ловушки конфигурации окружения, hidden classes в реальном фреймворке, культура производительности, дизайн доступа к данным |

## Свежие доклады

### Ключевые выводы

- **NodeConf EU 2026** (Болонья, 24 доклада, загружены на канал `nodeconfeu` в конце октября 2026) — лучшая подборка актуальной экспертизы по Node: модель релизов (Node 27), куча V8, профилирование, observability (diagnostics_channel и tracing), цепочка поставок, FFI, HTTP, кросс-рантайм-совместимость, тестирование типов.
- **Формат модулей**: доклады Joyee Cheung 2024–2025 годов — авторитетное объяснение `require(esm)` и публикации пакетов. Они заменяют доклады и посты 2019–2023 годов в духе «ESM — это больно».
- **TypeScript**: доклады Ippolito объясняют type stripping (дизайн, `erasableSyntaxOnly`, отсутствие проверки типов), доклад Hejlsberg «A 10x Faster TypeScript» — TS 7. Вместе они задают рабочий процесс TS-на-Node 2026 года ([typescript.md](typescript.md)).
- **Производительность**: доклады Collina, Snell, Nagy и Gonzaga дают цифры по streams, HTTP-клиентам, памяти и потокам — используйте их как источники для [performance.md](performance.md).
- Год события у докладов с пометкой «NodeConf EU, вероятно 2024» выведен из возраста загрузки (~год до октября 2026) и порядка в плейлисте `[не проверено]`. Принадлежность докладов к 2026 году подтверждена сайтом NodeConf EU («All 24 talks from 2026»).

Новая модель релизов меняет планирование обновлений. Проверить, какие ветки сейчас поддерживаются:

```bash
# Список релизов с пометкой LTS; первые строки — самые новые
curl -s https://nodejs.org/dist/index.json | node -e "
  const r = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
  for (const v of r.slice(0, 8)) console.log(v.version, v.date, v.lts || '-');
"
```

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [The New Node.js Release Model: Why Node 27 Changes Everything](https://www.youtube.com/watch?v=TY0K0qGRSA0) | Rafael Gonzaga и Antoine du Hamel, NodeConf EU 2026 | Смена графика релизов: один мажорный релиз в год начиная с Node 27, первая `v27.0.0-alpha` — 2026-10-29. Обязательно для планирования LTS; см. [toolchain.md](toolchain.md) |
| [Next-Gen Flame Graphs: Making Node.js Performance Profiling Actually Work](https://www.youtube.com/watch?v=bn78fDj2tWc) ([версия JSConf 2025](https://www.youtube.com/watch?v=2VkUF8jzouQ)) | Matteo Collina, NodeConf EU 2026 / JSConf 2025 | Текущее состояние инструментов профилирования (преемники 0x и clinic) |
| [NodeJS Performance Tips & Tricks](https://www.youtube.com/watch?v=O4x3JkC9Id0) | Robert Nagy (Node TSC, undici и streams), NodeConf EU 2026 | Практические приёмы производительности от мейнтейнера streams и HTTP в ядре |
| [Overview of V8 heap management](https://www.youtube.com/watch?v=dYvGvWPcEYk) | Caio Lima (Igalia), NodeConf EU 2026 | Внутренности GC и кучи: важно для `--max-old-space-size` и поиска утечек |
| [A Leak in the Shell — How Refactoring Autocomplete Broke Us and How We Fixed It](https://www.youtube.com/watch?v=OUjc89q849Q) | Anna Henningsen, NodeConf EU 2026 | Реальное расследование утечки памяти (mongosh) |
| [Getting ahead of supply-chain attacks in 2026](https://www.youtube.com/watch?v=U_xno0wOmgI) | Zbyszek Tenerowicz (LavaMoat, MetaMask), NodeConf EU 2026 | Защита после Shai-Hulud: lockdown, allow-scripts, изоляция по политикам |
| [The Past, Present, and Future of Node.js Observability](https://www.youtube.com/watch?v=TmWpLL7xUfE), [diagnostics_channel Deserves Better](https://www.youtube.com/watch?v=EH7X5jb91z8), [Tracing Without the Tax](https://www.youtube.com/watch?v=XaXJjQVlCWU) | Bryan English; Lois Zhao; Abdelrahman Awad — NodeConf EU 2026 | Современное инструментирование: diagnostics_channel, tracing channels, OpenTelemetry без monkey-patching |
| [FFI: Crossing the Native Boundary in Node.js](https://www.youtube.com/watch?v=rxUVWkBjXGI) | Paolo Insogna, NodeConf EU 2026 | Статус FFI в ядре против N-API и koffi (см. [concurrency-async-native.md](concurrency-async-native.md)) |
| [Rethinking HTTP in Node.js](https://www.youtube.com/watch?v=VHEe8eY70sI) | Marco Ippolito, NodeConf EU 2026 | Куда движется HTTP-стек Node |
| [A common minimum Node.js subset for all runtimes](https://www.youtube.com/watch?v=cKjSAh7wuyw), [What does Node.js compatibility really mean](https://www.youtube.com/watch?v=1PugYtVN9M8) | James M. Snell, NodeConf EU 2026 / ~2024 | Совместимость Node, Deno, Bun и Workers — ключ к коду, который должен работать везде ([domains-client.md](domains-client.md)) |
| [Your Node.js Streams Are 100× Slower Than They Should Be](https://www.youtube.com/watch?v=ROu7teARQDk) | James Snell, GitNation (вероятно, Node Congress 2026 `[не проверено]`) | Измеренная цена Node streams и web streams и как её избежать |
| [Don't Trust Your Types: Type Testing with TSTyche](https://www.youtube.com/watch?v=-7_DhDxqKog), [doc-kit and the Next 10 Years of Node.js Documentation](https://www.youtube.com/watch?v=GJbhYjjoujU), [What if everything was JavaScript?](https://www.youtube.com/watch?v=3A279_J5ZzQ) | Luca Del Puppo; Brian Muenzenmeyer и Claudio Wunder; Stephen Belanger — NodeConf EU 2026 | Тестирование типов; инструменты документации; эксперимент с рантаймом |
| [require(esm) in Node.js core](https://www.youtube.com/watch?v=l2gi6Rdxr0E), [Shipping Node.js packages in 2025](https://www.youtube.com/watch?v=I0jvOJW7NaI), [New & Upcoming Features in the Node.js Module Loader](https://www.youtube.com/watch?v=9lj8OXzfvRM), [Bridging CommonJS and ESM in Node.js](https://www.youtube.com/watch?v=YRueCer2kig) | Joyee Cheung — NodeConf EU (вероятно 2024 `[не проверено]`); Nordic.js 2025; ViteConf 2024; Web Engines Hackfest | От автора `require(esm)`: как сейчас работает взаимодействие ESM и CJS и как публиковать пакеты в 2025+. Лучший источник 2025 года по формату модулей |
| [Life of an ESM in Node.js – and How It's Changing for the Better](https://www.youtube.com/watch?v=74jHQoC9GR4) | Igalia, ~сентябрь 2026 | Обновление о внутренностях загрузчика |
| [The path to native TypeScript](https://www.youtube.com/watch?v=4V9qwS--Ksg), [Running TypeScript Natively in Node](https://www.youtube.com/watch?v=ctiqG3luOtk) | Marco Ippolito, NodeConf EU (вероятно 2024 `[не проверено]`) / JSConf JP 2025 | Дизайн type stripping, `erasableSyntaxOnly`, почему нет проверки типов |
| [A 10x Faster TypeScript](https://www.youtube.com/watch?v=UJfF3-13aFo) | Anders Hejlsberg, Microsoft Build 2025 | Мотивы и цифры порта на Go (TS 7) |
| [Optimizing life and Node.js](https://www.youtube.com/watch?v=bKYG5oxIpC8), [Leveling up JavaScript](https://www.youtube.com/watch?v=f7OupG7NnGo) | Yagiz Nizipli; Ryan Dahl — NodeConf EU (вероятно 2024 `[не проверено]`) | Работа над производительностью ядра изнутри; Dahl о направлении экосистемы (JSR, Deno) |
| [The State of Node.js 2025](https://www.youtube.com/watch?v=IgSwJaheiGk) (JSNation 2025; [версия jsday 2025](https://www.youtube.com/watch?v=h3qKJabs7d4)) | Matteo Collina, 2025 | Годовой обзор изменений в Node: релизы, возможности, здоровье экосистемы |
| [Node.js: More Threads Than You Think](https://www.youtube.com/watch?v=r5PIqYyRiAg), [Node.js will use all the memory available, and that's OK!](https://www.youtube.com/watch?v=_OnTUIYxGRs) | Matteo Collina, Code Europe 2025; dotJS 2025 | Потоки внутри Node (пул libuv, вспомогательные потоки V8, workers); как ведут себя размер кучи и GC V8 в контейнерах |
| [Which Node.js HTTP client in 2024?](https://www.youtube.com/watch?v=fePTmnQHQZ4), [Deep Dive into Undici](https://www.youtube.com/watch?v=cIyiDDts0lo), [The Alleged 'End' of Node.js is Much Ado About Nothing](https://www.youtube.com/watch?v=-1sMOIgcIo0) | Matteo Collina, 2024 | `fetch` против undici против axios/got с цифрами; внутренности undici; позиция Node против Bun и Deno |
| [Benchmarking Node.js: What Works, What Doesn't](https://www.youtube.com/watch?v=gisfCFu0Z6Y) | канал howdylatam, ~2026; докладчик — вероятно Rafael Gonzaga `[не проверено]` | Методика бенчмарков для Node |
| [REST sends data across the network. What if it could send callable objects instead?](https://www.youtube.com/watch?v=6ExqctHGuVw) | Kenton Varda (Cloudflare), GitNation 2026 | Дизайн RPC Cap'n Web — полезный взгляд на API между JS-сервисами |

## YouTube-каналы

### Ключевые выводы

- Для глубины — каналы конференций и людей из ядра (NodeConf EU, GitNation, Platformatic). Fireship — только для ориентации.
- Код из коротких видео проверяйте по документации перед использованием.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [nodeconfeu](https://www.youtube.com/@nodeconfeu) | NodeConf EU | Все доклады NodeConf EU; подборка 2026 года — лучший актуальный материал |
| [JavaScript Conferences by GitNation](https://www.youtube.com/@GitNationOrg) | GitNation | Записи Node Congress и JSNation. Заголовок страницы канала сейчас показывает другой бренд GitNation — ищите по названию доклада |
| [Platformatic](https://www.youtube.com/@platformatic) | Matteo Collina и команда | Стримы о внутренностях Node, streams и производительности, например мастер-класс [A Deep Dive into Node.js Streams](https://www.youtube.com/watch?v=edB964-YYpE) |
| [Erick Wendel](https://www.youtube.com/@ErickWendelAcademy) | Erick Wendel (контрибьютор Node) | Глубокие туториалы по Node (EN/PT): streams, воссоздание рантаймов, новые возможности |
| [Timur Shemsedinov](https://www.youtube.com/@TimurShemsedinov) | Тимур Шемсединов | Лекции на русском о Node, асинхронных паттернах, GoF/SOLID/GRASP в JS (см. [Ресурсы на русском](#ресурсы-на-русском)) |
| [HolyJS](https://www.youtube.com/@HolyJS) | JUG Ru Group | Русскоязычные доклады и еженедельный стрим новостей «Тяжелое утро с HolyJS» |
| [Fireship](https://www.youtube.com/@Fireship) | Jeff Delaney | Обзоры за 100 секунд: ориентация развлекательного уровня, не глубина |

## Код для чтения

### Ключевые выводы

- `lib/` ядра Node читайте ради семантики API и защитного стиля (primordials, `validateX`, коды ошибок), но **не** как образец стиля прикладного кода: primordials защищают ядро от подмены прототипов и вредят читаемости в обычном коде.
- Fastify, undici, Pino и Piscina — лучшие примеры «быстро и корректно»: их постоянно бенчмаркают, и пишут их люди из ядра.
- Для стиля публикации библиотек (ESM, `exports`, типы, тесты) читайте маленькие сфокусированные пакеты (ky, execa), а не большие фреймворки.

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| Ядро Node.js: [`lib/`](https://github.com/nodejs/node/tree/main/lib), [внутренности streams](https://github.com/nodejs/node/tree/main/lib/internal/streams), [бенчмарки](https://github.com/nodejs/node/tree/main/benchmark) и [руководство по ним](https://github.com/nodejs/node/blob/main/doc/contributing/writing-and-running-benchmarks.md) | Node.js project | Эталон идиоматичного JS, защищённого primordials; коды ошибок, проверки входа `validateX`, семантика streams и статистически корректный харнесс бенчмарков (`compare.js` + t-test на R). Сначала посмотрите доклад Joyee Cheung о связи JS и C++ |
| [Fastify](https://github.com/fastify/fastify) ([Plugins Guide](https://github.com/fastify/fastify/blob/main/docs/Guides/Plugins-Guide.md)) | команда Fastify | Инкапсулированная архитектура плагинов, сериализация по скомпилированным схемам, жизненный цикл hooks, дисциплина hidden classes («A Fastify Tale of Shapes») |
| [undici](https://github.com/nodejs/undici) | Node.js project (Collina, Nagy и др.) | HTTP-клиент за глобальным `fetch`: пул соединений, pipelining, `MockAgent`, interceptors |
| [Pino](https://github.com/pinojs/pino) | Collina и др. | Дизайн логирования с низкими накладными расходами: транспорты в worker threads, `sonic-boom`, никакой синхронной работы на горячем пути |
| [Piscina](https://github.com/piscinajs/piscina) | James Snell, Matteo Collina и др. | Продакшен-пул worker threads: очередь задач, transfer lists, `AbortSignal`, лимиты ресурсов |
| [Express 5](https://github.com/expressjs/express) и [Hono](https://github.com/honojs/hono) | Express TC; Yusuke Wada | Контраст: минимальная цепочка middleware старой школы против роутера на Web-стандартах (Request/Response), работающего на любом рантайме |
| [ws](https://github.com/websockets/ws) | Luigi Pinca и др. | Тщательно протестированная реализация протокола; работа с буферами и backpressure |
| Пакеты Sindre Sorhus: [ky](https://github.com/sindresorhus/ky), [execa](https://github.com/sindresorhus/execa) | Sindre Sorhus | Маленькие ESM-only библиотеки с хорошими типами и документацией; образцы `exports`, типов и тестов |
| [Vitest](https://github.com/vitest-dev/vitest), [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint), [npm CLI](https://github.com/npm/cli) | команды Vitest и typescript-eslint; GitHub/npm | Большие TS-монорепозитории: структура workspaces, project references, автоматизация релизов, обширные тесты |
| [Deno std](https://github.com/denoland/std) | команда Deno | Чистый утилитарный код на Web-стандартах (streams, кодирование, тесты); эталонные реализации, доступные из Node через JSR |
| [autocannon](https://github.com/mcollina/autocannon) | Matteo Collina | HTTP-генератор нагрузки на Node: как мерить так, чтобы инструмент не стал узким местом |
| [Platformatic](https://github.com/platformatic/platformatic) | Platformatic | Дизайн сервера приложений Watt: несколько Node-сервисов в одном процессе на worker threads |
| [Metarhia Impress](https://github.com/metarhia/impress) | Тимур Шемсединов и Metarhia | Сервер приложений из русскоязычного сообщества: изолированные контексты `vm`, горячая перезагрузка, слои в духе DDD, философия без зависимостей. Позиция авторская — читайте критически |
| [Practica.js](https://github.com/practicajs/practica) | Yoni Goldberg и др. | Эталонное приложение по best practices (см. [Тестирование, архитектура и безопасность](#тестирование-архитектура-и-безопасность)) |
| Код книг: [Node.js Design Patterns 4e](https://github.com/PacktPublishing/Node.js-Design-Patterns-Fourth-Edition), [streams-examples](https://github.com/lmammino/streams-examples) | Mammino и Casciaro | Запускаемые примеры к каждому паттерну книги |

## Ресурсы на русском

### Ключевые выводы

- Русский рынок отстаёт от английского на одно издание и больше. **Актуальные книги о Node на русском**: «Эффективный Node.js» (Буна, Питер, 2026; оригинал — январь 2025) и устаревшая «Node.js в действии», 2-е изд. (оригинал 2017) `[устарело]`. Перевод Node.js Design Patterns («Node.js. Паттерны проектирования и разработки», анонс Питера на Хабре 2016 года) — эпохи 1-го/2-го издания `[устарело]`: читайте английское 4-е издание (2025).
- **TypeScript на русском представлен хорошо**: «Эффективный TypeScript» 2-е изд. (83 способа), «Рецепты TypeScript», «Изучаем TypeScript», а также «Искусство юнит-тестирования» 3-е изд. с примерами на JS.
- Лучшие бесплатные ресурсы на русском — **learn.javascript.ru** (оригинал javascript.info), **Дока** (doka.guide), репозитории и лекции **HowProgrammingWorks** Шемсединова и доклады **HolyJS**.

Отставание переводов:

| Оригинал | Последнее издание (EN) | Русский перевод | Отставание |
|---|---|---|---|
| Efficient Node.js | январь 2025 | «Эффективный Node.js», Питер, 2026 | ~1 год, издание то же |
| Node.js Design Patterns | 4-е, сентябрь 2025 | 1-е/2-е изд., Питер, 2016 (по другим данным, ДМК, 2017 `[не проверено]`) | два издания |
| Effective TypeScript | 2-е, 2024 | 2-е изд., Питер (пост на Хабре — январь 2025) | ~1 год |
| Eloquent JavaScript | 4-е, сентябрь 2024 | 3-е изд., Питер, 2021 `[не проверено]` | одно издание (4-е бесплатно онлайн) |
| JavaScript: The Definitive Guide | 7-е, 2020 | 7-е изд., Диалектика, 2021 `[не проверено]` | ~1 год |
| The Art of Unit Testing | 3-е, февраль 2024 | 3-е межд. изд., Питер | издание то же |
| Node.js in Action | 2-е, 2017 | 2-е изд., Питер | издание то же, но сама книга `[устарело]` |

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Современный учебник JavaScript](https://learn.javascript.ru/) | Илья Кантор и сообщество; бесплатно | Лучший бесплатный учебник JS на русском: язык, асинхронность, модули |
| [Дока — JavaScript](https://doka.guide/js/) | проект сообщества (по фоновым данным, с участием Яндекс Практикума `[не проверено]`); бесплатно | Короткие современные справочные статьи о возможностях JS с примерами |
| [HowProgrammingWorks](https://github.com/HowProgrammingWorks) ([указатель](https://github.com/HowProgrammingWorks/Index)), книга [«Metaprogramming. Multi-paradigm approach in the Software Engineering»](https://github.com/HowProgrammingWorks/Book) (PDF на EN/RU/UA/DE/CZ, MIT) | Тимур Шемсединов (Metarhia), обновляется | Сотни маленьких репозиториев с кодом к лекциям: асинхронные паттерны (callbacks → promises → async/await → акторы), event loop, GoF и GRASP в JS, внутренности Node, песочницы. Сильно в основах. Мнения (например, против фреймворков, в части докладов — против TS) высказаны жёстко: подавайте их как одну из школ |
| [Метархия](https://github.com/metarhia) ([сайт](https://metarhia.com/)) | сообщество Metarhia | Стек приложений на Node (Impress, metaschema, metacom); см. [Код для чтения](#код-для-чтения) |
| Лекции Шемсединова на YouTube: [«Паттерн Reactor: как устроен Event Loop в Node.js»](https://www.youtube.com/watch?v=h0QUJkharTQ), [«Асинхронное программирование и оптимизация для V8»](https://www.youtube.com/watch?v=5mXWs-xmaQ4), [«Утечки памяти в Node.js и JavaScript, сборка мусора и профилирование»](https://www.youtube.com/watch?v=0oZa64SB2wM), [«Axios и Fetch API в современном Node.js…»](https://www.youtube.com/watch?v=5cDkv-lgxuY), [«Что такое паттерны GoF, SOLID, GRASP и зачем они в JavaScript?»](https://www.youtube.com/watch?v=lwL4GMBgSwM) (с Ильёй Климовым) | Тимур Шемсединов, 2018–2025 | Лекции по темам [concurrency-async-native.md](concurrency-async-native.md), [performance.md](performance.md) и [idioms-patterns.md](idioms-patterns.md) |
| Доклады HolyJS: Игорь Антонов [«State of Node.js 2025. Пока ты писал фронтенд…»](https://www.youtube.com/watch?v=_gYsiy5pdZI) и [«Чистый Node.js: разработка бэкенда без фреймворков»](https://www.youtube.com/watch?v=QsOF9gJJXqo); Глеб Решетнев [«Degradation вместо downtime: Node.js под пиковыми нагрузками и DDoS»](https://www.youtube.com/watch?v=mDEIyJSJfxo); Александр Зайцев [«Партнерство с Garbage Collector. Память в V8 и работа с утечками»](https://www.youtube.com/watch?v=-BFRb_AzWHc); Андрей Мелихов [«V8 под капотом»](https://www.youtube.com/watch?v=SNs61SwZbTI); Вячеслав Егоров [«Производительность JavaScript через подзорную трубу»](https://www.youtube.com/watch?v=HPFARivHJRY); Коржиков и Киселев [«Создание RAG-системы на Node.js»](https://www.youtube.com/watch?v=ThAECtY6Kz8) | HolyJS (JUG Ru), 2016–2026 | Лучший русскоязычный конференционный материал: обзор Node 2025, бэкенд без фреймворков, деградация под перегрузкой и DDoS (октябрь 2026), память V8, внутренности движка |
| [«Тяжелое утро с ПК HolyJS #82: Интероп 2025, что не так с NPM, можно ли писать ESM-only»](https://www.youtube.com/watch?v=QKi0bKdNZRM) | программный комитет HolyJS, 2025 | Обсуждение ESM-only и проблем npm на русском |
| [ШРИ 2025: «Node.js для фронтендеров: расширяем горизонты веб-разработки»](https://www.youtube.com/watch?v=lBiQuUN0JzM) | Яндекс (Young&&Yandex), 2025 | Лекция Школы разработки интерфейсов: Node для фронтендеров |
| [«Эффективный Node.js»](https://www.piter.com/product/effektivnyy-nodejs) | Самер Буна, Питер, 2026 | Перевод Efficient Node.js; см. [Книги о Node.js](#книги-о-nodejs) |
| [«Эффективный TypeScript: 83 способа улучшить код. 2-е изд.»](https://www.piter.com/product/effektivnyy-typescript-83-sposoba-uluchshit-kod-2-e-izd) ([пост о книге на Хабре](https://habr.com/ru/articles/873634/)) | Дэн Вандеркам, Питер (пост — январь 2025) | Перевод Effective TypeScript 2e. 1-е русское изд. («62 способа», 2020–2021) `[устарело]`, замена — это 2-е |
| [«Рецепты TypeScript»](https://www.piter.com/product/retsepty-typescript), [«Профессиональный TypeScript»](https://www.piter.com/product/professionalnyy-typescript-razrabotka-masshtabiruemyh-javascript-prilozheniy-2), «Изучаем TypeScript» | Баумгартнер; Черни; Голдберг — Питер | Переводы TypeScript Cookbook, Programming TypeScript и Learning TypeScript. Год и издатель «Изучаем TypeScript» `[не проверено]` |
| [«Искусство юнит-тестирования с примерами на JavaScript. 3-е межд. изд.»](https://www.piter.com/product/iskusstvo-yunit-testirovaniya-s-primerami-na-javascript-3-e-mezhd-izd) | Ошеров, Хориков, Питер | Перевод The Art of Unit Testing 3e |
| «JavaScript. Полное руководство», 7-е изд. | Дэвид Флэнаган, Диалектика, 2021 `[не проверено]` | Перевод JS: The Definitive Guide 7e |
| «Выразительный JavaScript. Современное веб-программирование», 3-е изд. | Марейн Хавербеке, Питер, 2021 `[не проверено]` | Перевод 3-го издания. Английское 4-е бесплатно онлайн — лучше читать его |
| [«Node.js в действии. 2-е издание»](https://www.piter.com/product/nodejs-v-deystvii-2-e-izdanie), [«Веб-разработка с применением Node и Express. 2-е издание»](https://www.piter.com/product/veb-razrabotka-s-primeneniem-node-i-express-polnotsennoe-ispolzovanie-steka-javascript-2-e-izdanie) | Кантелон и др.; Итан Браун — Питер | `[устарело]` (оригиналы 2017 и 2019 годов). Замена: «Эффективный Node.js» или английское Design Patterns 4e |
| [«Node.js. Паттерны проектирования и разработки»](https://habr.com/ru/companies/piter/articles/278017/) (анонс Питера) | Каскиаро и Маммино, Питер, 2016 | `[устарело]`: перевод 1-го/2-го издания. Замена: английское 4-е издание |
| [Node.js Best Practices на русском](https://github.com/goldbergyoni/nodebestpractices/blob/master/README.russian.md) | перевод сообщества | Русская версия чеклиста; может отставать от английского README |
| Хабр: хабы [Node.JS](https://habr.com/ru/hubs/nodejs/) и [JavaScript](https://habr.com/ru/hubs/javascript/) | сообщество | Качество разное; ключевые статьи — в следующей строке |
| Статьи Хабра: [«Как работает Node.js»](https://habr.com/ru/articles/910514/), [«Многопоточность на Node.js. Event Loop»](https://habr.com/en/articles/479062/), [«Знай свой инструмент: Event Loop в libuv»](https://habr.com/ru/articles/336498/), [«Квест на Node.js — борьба с утечкой памяти»](https://habr.com/ru/companies/simbirsoft/articles/823884/) (SimbirSoft, 2024), [«Как находить и устранять утечки памяти…»](https://habr.com/ru/companies/yandex/articles/195198/) (Яндекс) | разные авторы | Фазы event loop по исходникам libuv; поиск утечек сравнением heap snapshots. Статья Яндекса старая (2013), но метод трёх снимков работает |
| Хекслет: [«Асинхронное программирование в JavaScript»](https://ru.hexlet.io/courses/js-asynchronous-programming), [профессия Frontend](https://ru.hexlet.io/programs/frontend) | Hexlet; частично бесплатно | Структурированные курсы на русском с автопроверкой. Отдельная программа по бэкенду на Node 2026-11-06 отдавала 404 `[не проверено]` |
| [Podlodka](https://podlodka.io/), [подкаст «Веб-стандарты»](https://web-standards.ru/podcast/) | команда Podlodka; Веб-стандарты | Подкасты на русском: у Podlodka выпуски об архитектуре и бэкенде, «Веб-стандарты» еженедельно разбирают новости JS и Node |
| [HolyJS](https://holyjs.ru/) | JUG Ru Group | HolyJS 2026 Autumn; канал — в [YouTube-каналах](#youtube-каналы) |

## Маршрут обучения по уровням

### Ключевые выводы

- Не перепрыгивайте ступени: Design Patterns без уверенной асинхронности и тестов читается тяжело.
- На каждой ступени сочетайте чтение с практикой, которая проверяет код: Exercism, Full Stack Open, свой проект с тестами на `node:test` или Vitest.
- Производительностью занимайтесь, когда код идиоматичен и покрыт тестами. Первый шаг — измерение, а не сборник советов. Порядок работы — в [pipeline.md](pipeline.md), сравнение двух вариантов — `../scripts/bench_compare.mjs`.
- Чего избегать на любой ступени: NodeSchool, Node.js in Action 2e, любых туториалов Express до 2020 года (callbacks, отдельный `body-parser`, нет `async`).

| Ступень | Что читать | Зачем |
|---|---|---|
| 1. Начинающий: пишет небольшие программы на Node | Язык: [javascript.info](https://javascript.info/) (RU: [learn.javascript.ru](https://learn.javascript.ru/)) **или** [Eloquent JavaScript 4e](https://eloquentjavascript.net/) (бесплатно); абсолютным новичкам — [JavaScript Crash Course](https://nostarch.com/javascript-crash-course). Node: [Node.js Learn](https://nodejs.org/en/learn) — разделы Getting Started, Command Line, Manipulating Files, Asynchronous Work; если нужна книга — [Node.js for Beginners](https://www.oreilly.com/library/view/nodejs-for-beginners/9781803245171/) (Gascón, 2024). Модель event loop: доклады [Philip Roberts](https://www.youtube.com/watch?v=8aGhZQkoFbQ) → [Jake Archibald](https://www.youtube.com/watch?v=cCOL7MC4Pl0). Практика: [Full Stack Open](https://fullstackopen.com/en/), части 0–4 (Node, Express, тесты), [Exercism JS](https://exercism.org/tracks/javascript), [The Odin Project NodeJS](https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs) | Синтаксис, асинхронность, модули, первые CLI-утилиты и HTTP-сервисы |
| 2. Средний: от работающего кода к идиоматичному, протестированному и типизированному | [Node.js Design Patterns 4e](https://www.nodejsdesignpatterns.com/) целиком: асинхронный поток, streams, паттерны, тесты. TypeScript: [Total TypeScript Essentials](https://www.totaltypescript.com/books/total-typescript-essentials) → [Effective TypeScript 2e](https://effectivetypescript.com/); раздел [Modules](https://www.typescriptlang.org/docs/handbook/modules/introduction.html) в Handbook; [Running TypeScript Natively](https://nodejs.org/en/learn/typescript/run-natively). Тесты: [Test runner guides](https://nodejs.org/en/learn/test-runner/introduction), [javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices), [The Art of Unit Testing 3e](https://www.manning.com/books/the-art-of-unit-testing-third-edition). Чеклисты: [nodebestpractices](https://github.com/goldbergyoni/nodebestpractices) (критически), [Userland Migrations](https://nodejs.org/en/learn/getting-started/userland-migrations). Доклады: Snell [Broken Promises](https://www.youtube.com/watch?v=XV-u_Ow47s0), Collina [Do not thrash the Node.js Event Loop](https://www.youtube.com/watch?v=81AqwvXqgG0), Cheung [require(esm) in Node.js core](https://www.youtube.com/watch?v=l2gi6Rdxr0E). Рассылки: [Node Weekly](https://nodeweekly.com/) и [JavaScript Weekly](https://javascriptweekly.com/) | Идиомы, streams, типы, тесты, современный проект без лишних зависимостей |
| 3. Senior: проектирует сервисы и библиотеки, отвечает за продакшен | Архитектура: [Distributed Systems with Node.js](https://www.oreilly.com/library/view/distributed-systems-with/9781492077282/), [Release It! 2e](https://pragprog.com/titles/mnee2/release-it-second-edition/), [DDIA 2e](https://www.oreilly.com/library/view/designing-data-intensive/9781098119058/), [Fundamentals of Software Architecture 2e](https://www.oreilly.com/library/view/fundamentals-of-software/9781098175504/), книга о Fastify и [Plugins Guide](https://github.com/fastify/fastify/blob/main/docs/Guides/Plugins-Guide.md). Конкурентность: [Multithreaded JavaScript](https://www.oreilly.com/library/view/multithreaded-javascript/9781098104429/), Henningsen [Road to Workers](https://www.youtube.com/watch?v=-ssCzHoUI7M), Snell [Piscina](https://www.youtube.com/watch?v=yKilZFRx2_c), Collina [More Threads Than You Think](https://www.youtube.com/watch?v=r5PIqYyRiAg), Node Learn «Comparing Node.js concurrency models». Observability: Belanger [diagnostics_channel и AsyncLocalStorage](https://www.youtube.com/watch?v=wqGlbxIHAwI), доклады NodeConf EU 2026 об observability, исходники Pino и undici. Авторам библиотек: Cheung [Shipping Node.js packages in 2025](https://www.youtube.com/watch?v=I0jvOJW7NaI), Fu [Move on to ESM-only](https://antfu.me/posts/move-on-to-esm-only), [Publishing a package](https://nodejs.org/en/learn/modules/publishing-a-package) и «Publishing a TypeScript package», исходники ky и execa. Безопасность: [Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html), [Node.js Secure Coding](https://leanpub.com/nodejs-secure-coding), Tenerowicz [Getting ahead of supply-chain attacks in 2026](https://www.youtube.com/watch?v=U_xno0wOmgI), разборы Shai-Hulud от Socket. Планирование релизов: Gonzaga и du Hamel [The New Node.js Release Model](https://www.youtube.com/watch?v=TY0K0qGRSA0) | Надёжность, потоки, наблюдаемость, публичный API, цепочка поставок, планирование LTS |
| 4. Специалист по производительности | Модель движка: Bynens и Meurer [The Good Parts](https://www.youtube.com/watch?v=5nmpokoRaZI); Hinkelmann; Meurer [A Tale of TurboFan](https://www.youtube.com/watch?v=cvybnv79Sek); [V8 blog](https://v8.dev/blog); Caio Lima [Overview of V8 heap management](https://www.youtube.com/watch?v=dYvGvWPcEYk). Дисциплина измерения: Egorov [Benchmarking JavaScript](https://www.youtube.com/watch?v=g0ek4vV7nEA) и [Performance Through the Spyglass](https://www.youtube.com/watch?v=r76ZjdzFExg); [руководство по бенчмаркам ядра](https://github.com/nodejs/node/blob/main/doc/contributing/writing-and-running-benchmarks.md); [nodejs-bench-operations](https://github.com/RafaelGSS/nodejs-bench-operations); [Benchmarking Node.js: What Works, What Doesn't](https://www.youtube.com/watch?v=gisfCFu0Z6Y). Профилирование и память: [Diagnostics](https://nodejs.org/en/learn/diagnostics/memory) на Node Learn (память, perf, flame graphs); Collina [Next-Gen Flame Graphs](https://www.youtube.com/watch?v=bn78fDj2tWc) и [Node.js will use all the memory available](https://www.youtube.com/watch?v=_OnTUIYxGRs); Henningsen [A Leak in the Shell](https://www.youtube.com/watch?v=OUjc89q849Q); на русском — Зайцев [о GC и утечках](https://www.youtube.com/watch?v=-BFRb_AzWHc). Разборы: Hagemeister [Speeding up the JavaScript ecosystem](https://marvinh.dev/blog/speeding-up-javascript-ecosystem/); Snell [Streams 100× Slower](https://www.youtube.com/watch?v=ROu7teARQDk); Nagy [Performance Tips & Tricks](https://www.youtube.com/watch?v=O4x3JkC9Id0); Cheung [Node.js startup performance](https://www.youtube.com/watch?v=G36lrPrF09c). Ожидается: Snell [JavaScript in Depth](https://www.manning.com/books/javascript-in-depth) (финал весной 2027). Дальше — таблица «симптом → техника» в [performance.md](performance.md) | Измерение, модель V8 и GC, профилирование, память, streams и HTTP под нагрузкой |

## Чеклист: источник как обоснование изменения

Когда агент или ревьюер ссылается на книгу, статью или доклад как на причину изменения, проверьте:

- [ ] **Дата против ветки Node.** Написан ли источник для ветки, на которую нацелен проект (`engines.node`)? Всё до Node 18, скорее всего, не знает о глобальном `fetch`, `node:test`, `AbortSignal.timeout`, `structuredClone`; до Node 22.12/20.19 — о `require(esm)` без флага (без флага с v23.0.0, v22.12.0, v20.19.0 — таблица истории в [Modules](https://nodejs.org/api/modules.html)); до Node 23.6/22.18 — о type stripping по умолчанию (стабилен с v24.12.0/v25.2.0 — история в [TypeScript](https://nodejs.org/api/typescript.html)). Перепроверьте историю «Added in / Changed in» и индекс стабильности API на https://nodejs.org/api/.
- [ ] **Издание.** Текущее ли издание (Design Patterns 4e, Effective TypeScript 2e, Art of Unit Testing 3e, DDIA 2e)? Русские переводы часто отстают на одно-два издания.
- [ ] **Словарь уровней V8.** Советы с упоминанием «Crankshaft», «optimization killers», деоптимизации из-за `try/catch`, утечки `arguments` или «никогда не используйте `delete`» без цифр написаны до 2017 года. Проверьте бенчмарком (см. [performance.md](performance.md)).
- [ ] **Утверждения об инструментах.** Упоминания `ts-node`, `tslint`, `request`, `node-fetch` (для Node ≥ 18), `body-parser` как отдельной установки, `nodemon` (вместо `--watch`), `dotenv` (вместо `--env-file` и `process.loadEnvFile`), монорепозиториев только на Lerna, Mocha/Chai по умолчанию — замены 2026 года в [toolchain.md](toolchain.md).
- [ ] **Бенчмарк-заявления** из блогов Bun, Deno и вендоров фреймворков: требуйте методику (прогрев, одно железо, чередование прогонов, одинаковая нагрузка), прежде чем считать их доказательством.
- [ ] **Живость ссылок.** exploringjs.com и 2ality.com офлайн (2026); blog.rafaelgss.dev отдавал 502. Предпочитайте MDN, javascript.info, документацию Node или ссылку на Wayback Machine.
- [ ] **Сертификаты.** JSNAD (снята 2025-09-30) и LFW211 (неактивен) не являются действующими.
- [ ] **Мнение против консенсуса.** Жёсткие авторские позиции (Node без фреймворков, «TypeScript — зло», ESM-only везде, доступ к данным без ORM) — законные школы. Подавайте их как школы, а не как стандарт.

```bash
# Быстрая проверка заявления «это API появилось в Node X»:
node -p "typeof require('node:util').styleText"      # 'function' — API есть в текущей версии
node -p "process.features.typescript"                # 'strip' или 'transform' — нативный TS доступен
```

## Антипаттерны

- Рекомендовать учащемуся в 2026 году Node.js in Action 2e, Get Programming with Node.js, Node.js 8 the Right Way, Web Development with Node and Express 2e или NodeSchool. `[устарело]` → Node.js Design Patterns 4e, Efficient Node.js, Node.js for Beginners, Node Learn.
- Учить Node по туториалам Express 4 с middleware на callbacks и `var`. → Документация Express 5 или Fastify; async/await везде.
- Считать актуальными списки «optimization killers» (вики Bluebird Петьки Антонова, 2014–2016). `[устарело]` с приходом TurboFan и Ignition (2017); замена — измерение.
- Ставить ссылки на exploringjs.com или 2ality.com в новых документах: в 2026 году они офлайн. → MDN, javascript.info, TC39.
- Читать русские переводы Node.js Design Patterns 1-го/2-го издания или 1-е русское издание Effective TypeScript («62 способа»), когда есть новые. → Английское Design Patterns 4e, «Эффективный TypeScript» 2-е изд.
- Указывать JSNAD или LFW211 как действующую сертификацию. → Сертификация снята; для обучения — Node Learn и Full Stack Open.
- Рекомендовать JS Party как текущий подкаст. → Закрыт в феврале 2025; Syntax, PodRocket, SE Daily.
- Доверять главам об инструментах в книгах о TypeScript (`ts-node`, сборка через `tsc` для запуска) без сверки с TS 7 и нативным type stripping. → [typescript.md](typescript.md).

## Спорные места

- **ESM-only против двойных пакетов.** Sindre (2021) и Anthony Fu (2025) выступают за ESM-only. Поскольку `require(esm)` есть во всех поддерживаемых ветках (20.19+/22.12+/24/26), ESM-only библиотеки в большинстве случаев больше не ломают CJS-потребителей. Но модули с top-level `await` по-прежнему нельзя загрузить через `require`. Самую точную картину дают доклады Joyee Cheung. Подробности — в [domains-client.md](domains-client.md).
- **TypeScript-first против JS + JSDoc против «TS — зло».** Мейнстрим (Pocock, Vanderkam, собственный type stripping Node) — TS-first с erasable syntax. Часть авторов библиотек предпочитает JS с типами в JSDoc (без шага сборки) `[не проверено]`. Школа Шемсединова в некоторых докладах выступает против TS. → [typescript.md](typescript.md).
- **Фреймворки против кода без фреймворков.** Доклад HolyJS «Чистый Node.js» и Metarhia — за минимум зависимостей. Collina, Fastify и Nest — за фреймворки с сильными соглашениями. Обе стороны согласны: меньше зависимостей и больше встроенных API (Node Learn «Userland Migrations»).
- **ORM.** Доклад Collina «I would never use an ORM» против массового использования Prisma и Drizzle. → [domains-server.md](domains-server.md).
- **Микросервисы против модульного монолита.** Доклад Collina «Building a modular monolith with Fastify» и Platformatic Watt против подхода по умолчанию в Distributed Systems with Node.js. → [architecture.md](architecture.md).
- **«Node заканчивается»?** Доклад Collina «The Alleged 'End' of Node.js…» и тезисы в духе «Node выиграл войну JavaScript» против маркетинга Bun и Deno. Нейтральный источник — данные State of JS 2025.
- **Качество Packt.** Книги Packt неровные. Книги о Node в этом списке написаны людьми из ядра (Mammino/Casciaro, Griggs/Spigolon, Spigolon/Sinik/Collina, Gascón) — это исключение, а не правило.
- **Книги против документации.** Для API и флагов документация и посты релизов надёжнее любой книги; для моделей (event loop, streams, паттерны) книги и канонические доклады надёжнее разрозненных статей.

## Расхождения в датах и непроверенные факты

- Packt и O'Reilly не отдают страницы роботам, поэтому их даты взяты из поисковых листингов собственных страниц издателей. Листинги расходятся на месяц: Effective TypeScript 2e — апрель или июнь 2024; Efficient Node.js — январь или февраль 2025; DDIA 2e — февраль или март 2026.
- Node.js: The Comprehensive Guide: связь печатного издания Rheinwerk 2022 года и e-book 2025 года (ISBN 9781806108428) неясна — новое издание или переиздание `[не проверено]`.
- Русские издания: точные годы «Изучаем TypeScript» (2025 по маркетплейсу), какое издание Freeman переведено в «Основах TypeScript», издатель и год «Многопоточного JavaScript», а также кто выпустил перевод Design Patterns (Питер 2016 или ДМК 2017) по страницам издателей не подтверждены `[не проверено]`.
- Год NodeConf EU для докладов, загруженных около 2025 года (Cheung о `require(esm)`, Ippolito «The path to native TypeScript», Nizipli, Dahl, Snell о совместимости), выведен из возраста загрузки `[не проверено]`. Подборка 2026 года подтверждена сайтом конференции.
- Снята ли сертификация JSNSD вместе с JSNAD, не подтверждено (страница LFW212 отдаёт 404) `[не проверено]`.
- Статус незаконченных книг You Don't Know JS Yet (*Objects & Classes*, *Types & Grammar*) взят со вторичной страницы `[не проверено]`.
- Докладчик «Benchmarking Node.js: What Works, What Doesn't» (канал howdylatam) не подтверждён `[не проверено]`.
- То, что примеры Refactoring 2e написаны на JavaScript, — фоновое знание, не перепроверенное `[не проверено]`.
- Web Development with Node and Express 2e (2019), JavaScript: The Definitive Guide 7e (2020), Building Microservices 2e (2021) — даты из вторичных источников `[не проверено]`.

