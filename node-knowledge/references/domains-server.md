# Серверный Node.js

Справочник по серверной части Node.js (JavaScript и TypeScript): HTTP-фреймворки, слой `node:http`, HTTP/2 и undici, стили API (OpenAPI, GraphQL, tRPC и oRPC, gRPC, WebSocket и SSE), базы данных, драйверы, ORM, миграции и кэш, очереди, фоновые задачи и брокеры сообщений, боты, аутентификация и авторизация, наблюдаемость, безопасность по OWASP Top 10:2025, производительность HTTP и нагрузочное тестирование, деплой и graceful shutdown, SSR-фреймворки как Node-серверы. В конце — чеклист ревью, антипаттерны и спорные места. Актуально на ноябрь 2026: Node 26 «Lithium» — Active LTS с 28 октября 2026 (26.13.0), Node 24 «Krypton» — Maintenance LTS (24.22.2), Node 22 — Maintenance LTS до апреля 2027, Node 20 — EOL с 30 апреля 2026; Fastify 5.12.8, Express 5.3.0, Hono 4.13.16, NestJS 12.3.3, undici 8.12.4, `@prisma/client` 7.10.1, Drizzle 0.45.4, BullMQ 6.7.1, pg-boss 12.38.1, pino 10.4.0, OpenTelemetry JS SDK 3.0. Версии пакетов взяты из реестра npm 6 ноября 2026 (пометка «20 окт.» — значение первой проверки, без повтора). «Проверено локально» означает Node 24.17 на Windows 11; результаты приводятся как отношения. Пометки: `[устарело]` — рядом названа замена; `[не проверено]` — факт из одного вторичного источника. «Затих» — нет релиза больше 18 месяцев. Соседние темы: V8, GC, профилирование и методика бенчмарков — [performance.md](performance.md); event loop, worker threads, streams и backpressure, нативные расширения — [concurrency-async-native.md](concurrency-async-native.md); структура проекта, DI, конфигурация и архитектура graceful shutdown — [architecture.md](architecture.md); Zod, Valibot, TypeBox — [typescript.md](typescript.md); supertest, `fastify.inject`, Testcontainers, MSW — [testing.md](testing.md); цепочка поставок и менеджеры пакетов — [toolchain.md](toolchain.md); CLI, AI SDK и другие рантаймы — [domains-client.md](domains-client.md).

- [Стек по умолчанию](#стек-по-умолчанию)
- [Версии на ноябрь 2026](#версии-на-ноябрь-2026)
- [1. HTTP-фреймворки](#1-http-фреймворки)
- [2. node:http, HTTP/2 и undici](#2-nodehttp-http2-и-undici)
- [3. Стили API: валидация, OpenAPI, GraphQL, RPC, WebSocket и SSE](#3-стили-api-валидация-openapi-graphql-rpc-websocket-и-sse)
- [4. Базы данных, драйверы, ORM, миграции, кэш](#4-базы-данных-драйверы-orm-миграции-кэш)
- [5. Очереди, фоновые задачи и брокеры сообщений](#5-очереди-фоновые-задачи-и-брокеры-сообщений)
- [6. Боты: Telegram, Discord, Slack](#6-боты-telegram-discord-slack)
- [7. Аутентификация и авторизация](#7-аутентификация-и-авторизация)
- [8. Наблюдаемость](#8-наблюдаемость)
- [9. Безопасность по OWASP Top 10:2025](#9-безопасность-по-owasp-top-102025)
- [10. Производительность HTTP и нагрузочное тестирование](#10-производительность-http-и-нагрузочное-тестирование)
- [11. Деплой и graceful shutdown](#11-деплой-и-graceful-shutdown)
- [12. SSR и fullstack-фреймворки как Node-серверы](#12-ssr-и-fullstack-фреймворки-как-node-серверы)
- [Чеклист ревью серверного кода](#чеклист-ревью-серверного-кода)
- [Антипаттерны](#антипаттерны)
- [Спорные места](#спорные-места)

---

## Стек по умолчанию

Одна строка — одно решение. Для нового сервиса начинайте с колонки «По умолчанию» и отходите от неё только с причиной.

| Решение | По умолчанию | Альтернатива | Не брать в новый код |
|---|---|---|---|
| Рантайм | Node 26 LTS (24 допустим) | Bun или Deno только с причиной (см. [domains-client.md](domains-client.md)) | Node 20 (EOL) |
| HTTP-фреймворк | Fastify 5 | Hono 4 (несколько рантаймов), NestJS 12 (большие команды), Express 5 (экосистема) | Express 4 для нового проекта; Koa и hapi без причины |
| Валидация | Zod 4, Valibot или TypeBox через Standard Schema | ArkType | ручные проверки `if` |
| Контракт API | OpenAPI 3.1, сгенерированный из схем маршрутов | tRPC или oRPC для клиентов только на TS; GraphQL Yoga 6 | недокументированный JSON |
| Доступ к Postgres | Drizzle или Kysely поверх `pg` | Prisma 7 (CLI закрепить), MikroORM 7 | Sequelize, SQL склейкой строк |
| Фоновые задачи | BullMQ 6 (Redis) или pg-boss 12 (Postgres) | Temporal или Inngest для долгих workflow | cron внутри процесса в масштабируемом сервисе; Bull 4 |
| Kafka | `@confluentinc/kafka-javascript` или `@platformatic/kafka` | — | KafkaJS |
| Аутентификация | Better Auth или внешний IdP + `jose`/`openid-client` | Passport в существующих Express-приложениях | библиотека Lucia, `jsonwebtoken` в новом коде |
| Пароли | Argon2id (`crypto.argon2`, `@node-rs/argon2`) | scrypt | bcrypt для новых систем, SHA-x |
| Логи | pino 10 | winston 3 | `console.log` в продакшен-путях |
| Трейсы и метрики | OpenTelemetry SDK 3 + OTLP-коллектор; `@prometheus-io/client` | агенты вендоров поверх OTel | `prom-client`, Jaeger exporter |
| Telegram-боты | grammY | — | Telegraf |
| Нагрузочные тесты | k6 (сценарии, пороги в CI), oha или autocannon (быстрые проверки) | wrk2, Artillery | замер на том же хосте и отчёт только в req/s |
| Деплой | один процесс на контейнер (slim или distroless, не root), перезапуски делает оркестратор | PM2 7 или systemd на VM | `npm start` как entrypoint, `cluster` внутри пода |

## Версии на ноябрь 2026

Линии Node.js (по [nodejs.org/dist/index.json](https://nodejs.org/dist/index.json), 6 ноября 2026): **26.x «Lithium» — v26.13.0, Active LTS с 2026-10-28**, цель для новых сервисов; 24.x «Krypton» — v24.22.2 (2026-10-27), фаза maintenance; 22.x «Jod» — v22.23.4 (2026-10-20), Maintenance LTS, EOL 2027-04; **20.x «Iron» — v20.20.2, EOL 2026-04-30** (многие пакеты ниже требуют ≥20.19, ≥22 или ≥22.12); 27.x — первая альфа v27.0.0-alpha.0 от 2026-10-29 (новая модель релизов, см. [toolchain.md](toolchain.md)).

| Пакет | Версия (дата) | engines.node | Примечание |
|---|---|---|---|
| express | 5.3.0 (2026-10-09) | ≥18 | `latest-4` = 4.22.3; 5.x — `latest` с 5.1.0 (2025-03-31) |
| fastify / hono | 5.12.8 (2026-11-02) / 4.13.16 (2026-11-01) | — / ≥16.9 | fastify 6.0.0-alpha.6; hono 5.0.0-rc.1 |
| koa / @hapi/hapi / restify | 3.3.0 (2026-11-03) / 21.4.13 (2026-11-04) / 12.0.0 (2026-08-25, 20 окт.) | ≥18 / ≥14.15 / ≥22 | Koa 2.x на `latest-2`; hapi жив без импульса; restify — ниша |
| @nestjs/core | 12.3.3 (2026-11-04) | ≥20 (release notes: 20.19+/22.12+) | ESM-ядро, Standard Schema; 11.x на теге `legacy` |
| @adonisjs/core / h3 / elysia | 7.6.0 (2026-10-05) / 2.0.8 (2026-10-22) / 1.4.31 (2026-11-05) | **≥24** / ≥20.19 / — | h3 v2 стабилен (Nitro/Nuxt); Elysia 2.0.0-beta.32, Bun-first |
| undici | 8.12.4 (2026-11-05) | **≥22.19** | мажорная линия v8 |
| ws / socket.io | 8.22.1 (2026-10-31) / 4.8.4 (2026-09-25) | ≥10 / ≥10.2 | uWebSockets.js нет в npm — только теги GitHub |
| @trpc/server / @orpc/server | 11.24.0 (2026-11-03) / 1.16.2 (2026-11-06) | — | oRPC 2.0.0-beta.44 |
| graphql / graphql-ws | **17.1.0** (2026-11-04) / 6.4.1 (2026-10-15, 20 окт.) | ^22, ^24, ≥26 / ≥20 | 17.0.2 — 2026-07-03; 16.x на `latest-16`; `subscriptions-transport-ws` `[устарело]` → graphql-ws |
| graphql-yoga / @apollo/server / mercurius | **6.0.1** (2026-10-23) / 5.5.1 (2026-05-05) / 16.12.1 (2026-10-24) | ≥22.15 / ≥20 / ^20.9, ≥22 | Apollo Server 4 — EOL |
| pg / postgres (postgres.js) | 8.23.1 (2026-09-30) / **4.1.0** (2026-11-05) | ≥16 / ≥18 | postgres.js v4 — новый мажор (на 20 окт. latest был 3.4.9) |
| mysql2 / mongodb / mongoose | 3.24.6 (2026-10-13) / 7.8.0 (2026-10-30) / 9.12.0 (2026-11-04) | ≥8 / ≥20.19 / ≥20.19 | |
| redis / ioredis / iovalkey / @valkey/valkey-glide | 6.3.1 (2026-10-29) / 6.0.0 (2026-07-31) / 0.4.0 (2026-07) / 2.5.3 (2026-09) | ≥20 / ≥20 / — / — | node-redis рекомендует Redis Inc.; последние два — клиенты Valkey (20 окт.) |
| better-sqlite3 / @libsql/client / @electric-sql/pglite | 13.0.3 (2026-08-05) / 0.18.0 (2026-09-02) / 0.5.10 (2026-10-14) | **≥22** / — / — | libSQL/Turso; Postgres в WASM (последние два — 20 окт.) |
| prisma (CLI) | **8.0.0-rc.30 на теге `latest`** (2026-11-03) | ^22.18, ^24.11, ≥26 | 7.10.1 на теге `prev` — см. [ловушку](#ловушка-тега-latest-у-prisma) |
| @prisma/client | 7.10.1 (2026-10-15) | ^20.19, ^22.12, ≥24 | Prisma 7 — клиент на TS без Rust (2025-11-19) |
| drizzle-orm / drizzle-kit | 0.45.4 (2026-10-08) / 0.31.11 (2026-09-21, 20 окт.) | — | 1.0.0-rc.5 (`rc`), 1.0.0-beta.22 (`beta`) |
| kysely / @mikro-orm/core | 0.29.8 (2026-11-01) / 7.2.7 (2026-11-04) | ≥22 / ≥22.17 | Kysely 0.30.0-beta.2, API стабилен; MikroORM 6.x на `latest-v6` |
| typeorm | **1.1.2** (2026-10-08) | ^20.19, ^22.13, ≥24.11 | **TypeORM 1.0 вышел 2026-05-19**; 0.3.x на `legacy` |
| sequelize / sequelize-typescript | 6.37.8 (2026-03-07) / 2.1.6 (2023-11-24) | ≥10 / — | v7 годами в альфе (7.0.0-alpha.9); sequelize-typescript **затих** |
| objection / knex | 4.2.0 (2026-10-18, 20 окт.) / 3.3.0 (2026-06-26) | ^20.19, ≥22.12 / ≥16 | Objection ожил (4.x) |
| node-pg-migrate / umzug / postgrator | 9.0.0 (2026-07) / 3.8.3 (2026-05) / 8.0.0 (**2024-11**), 20 окт. | — | postgrator **затих** |
| bullmq / bull | **6.7.1** (2026-11-06) / 4.16.5 (2024-12-18) | ≥14.18 / — | Bull — только поддержка, берите BullMQ |
| pg-boss / graphile-worker / @temporalio/worker | 12.38.1 (2026-11-05) / 0.18.0 (2026-09-08) / 1.25.0 (2026-10-27) | ≥22.12 / ≥22.18 / ≥20.3 | |
| kafkajs / @confluentinc/kafka-javascript / @platformatic/kafka | 2.2.4 (**2023-02-27**) / 1.11.0 (2026-10-07) / 2.15.0 (2026-11-04) | — / ≥18 / ≥22.22 или ≥24.6 | KafkaJS **не поддерживается**; Confluent — librdkafka с API KafkaJS; Platformatic — чистый JS |
| amqplib / rabbitmq-client / nats | 2.2.1 (2026-11-01) / 5.1.0 (2026-10-16, 20 окт.) / 2.29.3 (2025-03-19) | ≥18 / ≥16 / — | `nats` **DEPRECATED** → `@nats-io/transport-node` 3.x |
| agenda / croner / node-cron; inngest / @trigger.dev/sdk | 6.2.6 / 10.0.1 / 4.6.0; 4.25.0 / 4.7.4 (2026, 20 окт.) | — | Inngest и Trigger.dev — хостинговые durable functions |
| grammy / telegraf / discord.js / @slack/bolt | 1.46.0 (2026-08-26) / 4.16.3 (**2024-02-29**) / 14.28.1 (2026-11-03) / 5.1.0 (2026-09-02, 20 окт.) | — / — / ≥18 / ≥20 | Telegraf **затих** |
| better-auth / next-auth / @auth/core | 1.7.18 (2026-11-05) / 4.24.15 (2026-07-20) / 0.41.3 (2026-07-20, 20 окт.) | — | `next-auth@beta` = 5.0.0-beta.32: v5 не вышел из беты |
| passport / jose / jsonwebtoken / lucia | 0.7.0 (**2023-11-27**) / 6.2.15 (2026-11-01) / 9.0.3 (2025-12-04) / 3.2.2 (2024-10-20) | — / — / ≥12 / — | ядро passport затихло; `jsonwebtoken` только Node; `lucia` **DEPRECATED** |
| @node-rs/argon2 / argon2 / bcrypt | 2.2.2 (2026-10) / 0.45.1 (2026-07) / 6.0.0 (2025-05), 20 окт. | — | |
| pino / pino-http / winston | 10.4.0 (2026-10-02) / 11.0.0 (2025-10-04, 20 окт.) / 3.19.0 (2025-12-07) | — / — / ≥12 | |
| @opentelemetry/sdk-node | **0.301.0** (2026-11-05) | **≥22.15** | на 20 окт. было 0.223.0; минимальный Node поднят; api 1.9.1, auto-instrumentations-node 0.81.2 (20 окт.) |
| @opentelemetry/instrumentation-fastify / prom-client | 0.57.0 (2026-03-04) / 15.1.3 (2024-06-27) | — | оба **DEPRECATED** → `@fastify/otel` 0.21.3 и `@prometheus-io/client` 0.16.1 |
| @sentry/node / dd-trace | 11.11.0 (2026-11-05) / 6.21.0 (2026-10-14, 20 окт.) | ≥20.19 / ≥22 | |
| helmet / express-rate-limit / @fastify/rate-limit / rate-limiter-flexible / csrf-csrf | 8.3.0 / 8.7.3 / 11.2.1 / 11.2.3 / 4.0.3 | ≥18 / ≥16 / — | последние три — 20 окт.; csrf-csrf от 2025-05-27 |
| pm2 / autocannon | 7.1.2 (2026-11-03) / 8.0.0 (**2024-10-14**) | ≥18 / — | autocannon два года без релизов, но работает; oha и k6 — не npm-пакеты |
| zod / valibot / arktype / typebox | 4.6.7 / 1.5.0 / 2.2.8 / 1.4.2 (2026) | — | `typebox` 1.x — новое имя пакета; `@sinclair/typebox` 0.34 — legacy |
| ajv / fast-json-stringify / find-my-way; @fastify/swagger / @scalar/api-reference / @hono/zod-openapi | 8.20.0 / 7.1.2 / 9.10.0; 9.9.2 / 1.75.0 / 1.6.3 (2026, 20 окт.) | — | внутренности Fastify; OpenAPI |
| openapi-typescript / @hey-api/openapi-ts; @grpc/grpc-js / @connectrpc/connect-node; lru-cache / keyv / cacheable | 7.13.0 / 0.99.0; 1.14.6 / 2.2.0; 11.5.3 / 6.1.0 / 2.5.0 (2026, 20 окт.) | — | |
| next / nuxt / react-router | 16.4.5 (2026-11-03) / 4.6.4 (2026-11-02) / **8.5.1** (2026-10-27) | ≥20.9 / ^22.22.3, ^24.15, ≥26 / ≥22.22 | `@remix-run/node` 2.17.5 — legacy |
| astro / @sveltejs/kit / @tanstack/react-start | **7.4.7** (2026-11-05) / **3.1.1** (2026-10-29) / 1.169.3 (2026-10-16, 20 окт.) | ≥22.23.4 / ≥22.17 / ≥22.12 | |

Затихли (нет релиза больше 18 месяцев): sequelize-typescript, kafkajs, telegraf, ядро passport, postgrator, autocannon. Помечены deprecated в npm: `nats`, `lucia`, `prom-client`, `@opentelemetry/instrumentation-fastify`.

---

## 1. HTTP-фреймворки

### Ключевые выводы

- **Fastify 5** — выбор по умолчанию для JSON API на Node: пропускная способность, валидация и сериализация по схемам, инкапсуляция плагинов. LTS v4 закончился **2025-06-30**; v5 (2024-09-17) — поддерживаемая линия; v6 в альфе (`6.0.0-alpha.6`), не для продакшена.
- **Hono 4** — когда один код работает на Node, Bun, Deno, Cloudflare Workers и Lambda (Web-стандартные `Request`/`Response`). На Node нужен `@hono/node-server` 2.x (Node ≥20, мажор про производительность) [не проверено]. **Hono 5 — RC** (`hono@next`): только ESM, Node ≥22.12 (`require('hono')` работает через `require(esm)`); адаптеры рантаймов переехали в пакеты `@hono/*`; `onError` стал middleware `(c, next)` и читает `c.error`; `c.req.json()` возвращает `unknown`; `c.json(undefined)` бросает `TypeError`; семантика wildcard-маршрутов унифицирована.
- **Express 5** — самая большая экосистема и минимум сюрпризов; `latest` в npm с 5.1.0 (2025-03-31). 5.3.0 (2026-10-09) требует `body-parser` ^2.3.0: раньше невалидный `limit` молча отключал проверку размера тела (CVE-2026-12590), теперь бросает ошибку при настройке; также исправления CVE в `qs` и `proxy-addr` и перепроверка метода QUERY. Express 4 по-прежнему «ongoing», но исправления получает только последний релиз каждой мажорной линии; расширенную поддержку EOL-линий продаёт HeroDevs.
- **NestJS 12** — для больших команд, которым нужны DI и модули (адаптер Express или Fastify). Пакеты ядра — ESM, CJS-приложения работают через `require(esm)`; Node 20.19+/22.12+; `@Body()`, `@Query()`, `@Param()` принимают опцию `schema` с любой **Standard Schema** (Zod, Valibot, ArkType) через `StandardSchemaValidationPipe`; `nest new` спрашивает CJS или ESM (ESM → Vitest + oxlint); новый SDK `@nestjs/observe`; адаптер Express дожидается in-flight запросов при остановке; `--webpack` устарел в пользу `--builder rspack`; из GraphQL убран `subscriptions-transport-ws` (берите `graphql-ws`); NATS-транспорт перешёл на `@nats-io/transport-node`; у `ConsoleLogger` структурные параметры включены по умолчанию.
- Остальные (все — [не проверено]): **AdonisJS 7** (вышел 2026-02-25) — MVC «всё включено» в духе Laravel: Lucid ORM, auth, VineJS, сквозные типы через Tuyau, `@adonisjs/otel`, требует **Node ≥24**. **Koa 3**: Node ≥18, генераторы удалены, `ctx.throw(status, error, props)`, `redirect('back')` → `ctx.back(fallback)`, `app.currentContext` через AsyncLocalStorage; причин начинать на нём новый проект мало. **h3 v2** (стабилен, Node ≥20.19) — движок Nitro/Nuxt на Web-стандартных обработчиках. **Elysia** — Bun-first со сквозными типами (Eden), Node через адаптер, 2.0 в бете; только если рантайм — Bun. **hapi 21** поддерживается, но без импульса.
- **Пропускная способность** по сайту Fastify (обновлено 2026-11-01, один инстанс, помечено «illustrative»). GET JSON, req/s: Fastify 5.12.7 — 89 733 > Hono 4.13.14 — 84 930 > H3 2.0.8 — 80 974 > Koa 3.2.1 — 72 594 > Restify — 69 162 > Express 5.3.0 — 67 794 > Hapi — 65 114. POST JSON echo: Fastify 69 080 > Hono 60 345 > H3 58 771 > Koa 45 785 > Express 44 142 > Hapi 34 409. **Fastify быстрее Express примерно в 1,3 раза (GET) и в 1,6 раза (POST)** — гораздо меньше, чем 2–4 раза на старых графиках с Express 4. В реальных сервисах доминируют база и сеть; накладные расходы фреймворка важны для шлюзов, прокси и горячих кэшированных эндпоинтов.
- **Почему Fastify быстрый** (идеи, которые стоит перенять): radix-дерево маршрутов `find-my-way`; сериализация ответа, скомпилированная `fast-json-stringify` из схемы `response` (она же выбрасывает необъявленные поля и предотвращает утечки); валидация, скомпилированная Ajv; логирование через `pino`. Схема `response` — одновременно оптимизация и защита, но выигрыш в скорости зависит от версии Node: на Node 24 `fast-json-stringify` быстрее `JSON.stringify` (~1,4 раза), а на Node 26 (V8 14.6, быстрый путь `JSON.stringify`) `JSON.stringify` в ~2,4 раза быстрее него — там схему ответа оправдывает контракт (лишние поля не утекают), а не скорость (замеры — [performance.md](performance.md#локальные-замеры)).
- **Миграция на Express 5** [не проверено]: отклонённые промисы из async-обработчиков сами уходят в `next(err)` — удалите `express-async-errors`; синтаксис `path-to-regexp` 8: wildcard с именем (`/*splat`), необязательный сегмент — `{/:id}`, без regex-символов в пути; `req.query` — геттер только для чтения, парсер по умолчанию `simple`; `req.body` равен `undefined` (а не `{}`), если парсер не сработал; `res.status()` принимает только целые 100–999; `app.del`, `req.param()`, `res.sendfile` удалены; `express.urlencoded` по умолчанию `extended: false`. Codemod: `npx @expressjs/codemod`.
- **Независимость от фреймворка**: доменный код не знает о `req`/`res`, обработчики — тонкие адаптеры. Тогда переход Express → Fastify → Hono меняет только слой маршрутизации (см. [architecture.md](architecture.md)).

Маршрут Fastify, где одна схема даёт валидацию, сериализацию и OpenAPI (типы из схемы выводит type provider — TypeBox, Zod, json-schema-to-ts; без него задайте generic, как ниже):

```ts
import Fastify from 'fastify';

const app = Fastify({
  logger: { redact: ['req.headers.authorization', 'req.headers.cookie'] },
  keepAliveTimeout: 65_000, // дольше idle timeout балансировщика (ALB — 60 с)
  bodyLimit: 1_048_576,     // 1 MiB — значение по умолчанию; задайте явно
});
app.server.headersTimeout = 66_000; // больше keepAliveTimeout

const User = { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } };
app.get<{ Params: { id: string } }>('/users/:id', {
  schema: {
    params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'], additionalProperties: false },
    response: { 200: User }, // поля вне схемы (passwordHash) в ответ не попадут
  },
}, async (req) => users.getById(req.params.id));

await app.listen({ port: 3000, host: '0.0.0.0' });
```

### Сравнение фреймворков (ноябрь 2026)

| Фреймворк | Версия | Рантаймы | Валидация и OpenAPI | Сильная сторона | Осторожно |
|---|---|---|---|---|---|
| Fastify | 5.12.8 (v6 альфа) | Node | JSON Schema + Ajv, type providers (TypeBox, Zod), `@fastify/swagger` | пропускная способность, инкапсулированные плагины, тесты через `inject()`, организация `@fastify/*` | путаница с инкапсуляцией и `fastify-plugin`, порядок хуков |
| Express | 5.3.0 (4.22.x поддерживается) | Node, Bun | встроенной нет; `express-openapi-validator`, middleware на Zod | экосистема, привычность | самый медленный из массовых; ошибки порядка middleware; нет сериализации по схеме |
| Hono | 4.13.16 (v5 RC) | Node, Bun, Deno, Workers, Lambda, Vercel | `@hono/zod-validator`, `@hono/standard-validator`, `@hono/zod-openapi`, `hono-openapi` | переносимость, малый размер, RPC-клиент `hc` | на Node каждый запрос конвертируется в Web `Request`/`Response` |
| NestJS | 12.3.3 | Node (адаптер Express или Fastify) | class-validator или Standard Schema (v12), `@nestjs/swagger` 12 | структура для больших команд, DI, транспорты микросервисов | декораторы и reflect-metadata, тяжёлые абстракции, медленный холодный старт |
| AdonisJS | 7.6.0 | Node ≥24 | VineJS | full-stack MVC, Lucid ORM, auth | сообщество меньше |
| Koa | 3.3.0 | Node | нет | минимализм | мало развития |
| h3 | 2.0.8 | Node, edge (Nitro) | хелперы Standard Schema | экосистема Nuxt/Nitro | документации меньше |
| Elysia | 1.4.31 (2.0 бета) | сначала Bun | `t` на базе TypeBox, плагин OpenAPI | типы, скорость на Bun | Node — второстепенная цель |
| hapi | 21.4.13 | Node | Joi | конфигурация, безопасные умолчания | мало развития |

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Fastify Benchmarks](https://fastify.dev/benchmarks/) / [fastify/benchmarks](https://github.com/fastify/benchmarks) | Fastify team, обновлено 2026-11-01 | Текущая таблица req/s и воспроизводимый стенд на autocannon |
| [Fastify LTS](https://fastify.dev/docs/latest/Reference/LTS/) / [Migration Guide V5](https://fastify.dev/docs/latest/Guides/Migration-Guide-V5/) | Fastify team, 2024–2026 | EOL v4 2025-06-30; ломающие изменения v4 → v5 |
| [Encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/) / [Type Providers](https://fastify.dev/docs/latest/Reference/Type-Providers/) | Fastify team | Области видимости плагинов; type providers для TypeBox и Zod |
| [Express releases](https://github.com/expressjs/express/releases) / [Express support](https://expressjs.com/en/support/) | Express TC, 2024–2026 | Changelog 5.1–5.3 и 4.22, CVE; политика поддержки версий |
| [Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html) / [Express 5 released (InfoQ JP)](https://www.infoq.com/jp/news/2025/01/express-5-released/) | Express TC; InfoQ, 2025 | Миграция v4 → v5; обзор выхода Express 5 |
| [Migrating to Hono v5](https://hono.dev/docs/guides/migrating-to-v5) / [@hono/node-server v2.0.0](https://github.com/honojs/node-server/releases/tag/v2.0.0) / [Hono on Node.js](https://hono.dev/docs/getting-started/nodejs) | Hono team, 2026 | Ломающие изменения Hono 5 RC; Node-адаптер v2 и его использование |
| [NestJS v12.0.0 release](https://newreleases.io/project/github/nestjs/nest/release/v12.0.0) / [NestJS 12 roadmap: ESM (InfoQ)](https://infoq.com/news/2026/04/nestjs-12-roadmap-esm) | NestJS team (зеркало релиза GitHub); InfoQ, 2026 | Полные release notes NestJS 12; переход на ESM |
| [NestJS docs](https://docs.nestjs.com/) | Kamil Mysliwiec и др. | Документация NestJS |
| [AdonisJS v7](https://adonisjs.com/blog/v7) / [AdonisJS v6 to v7](https://docs.adonisjs.com/v6-to-v7) | Harminder Virk, 2026-02; AdonisJS team | Анонс AdonisJS 7 и гайд по апгрейду |
| [Koa v3.0.0](https://newreleases.io/project/github/koajs/koa/release/v3.0.0) | Koa team, 2025 | Ломающие изменения Koa 3 |
| [h3](https://h3.dev/) / [Elysia](https://elysiajs.com/) | UnJS; SaltyAom | Документация h3 v2 и Elysia |

## 2. node:http, HTTP/2 и undici

### Ключевые выводы

**Таймауты сервера** (документация Node 26.13):
- `server.keepAliveTimeout` по умолчанию **5000 мс**; `keepAliveTimeoutBuffer` — 1000 мс (v24.6/v22.19). Таблица опций `http.createServer()` в документации v26 указывает для `keepAliveTimeout` 65000 мс — это ошибка документации: исходник v26.13.0 (`lib/_http_server.js`) ставит `5_000`, и локально на официальном бинарнике Node 26.13.0, как и на 24.17, `createServer()`, `createServer({})` и `new http.Server()` возвращают 5000. Значит, правило балансировщика ниже нужно выполнять явно и на Node 26.
- `headersTimeout` = min(`requestTimeout`, 60000); `requestTimeout` — 300000 мс (с v18); `server.timeout` — 0; `maxRequestsPerSocket` — 0; `http.maxHeaderSize` — 16 KiB; `maxHeadersCount` — 1000; `connectionsCheckingInterval` — 30 с. Новые опции: `optimizeEmptyRequests` (v25.1/v24.12), `shouldUpgradeCallback` (v24.9/v22.21), `joinDuplicateHeaders`, `requireHostHeader` (по умолчанию true), `rejectNonStandardBodyWrites`.
- **Правило балансировщика**: keep-alive timeout в Node должен быть **длиннее** idle timeout прокси или балансировщика (у AWS ALB по умолчанию 60 с). Иначе Node закрывает сокет, который балансировщик собирается переиспользовать, и клиенты получают редкие 502. Типично `keepAliveTimeout = 65_000`, `headersTimeout = 66_000`.
- `server.close()` с v19 закрывает и простаивающие соединения; `closeAllConnections()` (v18.2) рвёт и активные — вызывайте её после `close()` последним шагом graceful shutdown. Подвох: соединение, по которому идёт запрос в момент `close()`, после ответа остаётся keep-alive, и `close()` ждёт `keepAliveTimeout`. Пока идёт остановка, периодически вызывайте `server.closeIdleConnections()` (проверено локально на Node 24.17 и 26.13; пример — в разделе о деплое ниже).

```js
import { createServer } from 'node:http';

const server = createServer(handler);
server.keepAliveTimeout = 65_000; // > idle timeout балансировщика
server.headersTimeout = 66_000;   // > keepAliveTimeout
server.requestTimeout = 120_000;  // по умолчанию 300 000; должен быть ≥ headersTimeout
server.listen(3000);
```

Проверено локально на Node 24.17: если передать в опции `createServer()` `headersTimeout` больше `requestTimeout`, конструктор бросает `ERR_OUT_OF_RANGE`.

**`node:http2`** нужен, когда TLS терминируется в самом Node и требуется мультиплексирование или gRPC. За прокси, который сам терминирует HTTP/2 (nginx, Envoy, ALB), обычный HTTP/1.1 между прокси и Node проще и нормален. В Fastify — опция `http2: true`.

**Исходящий HTTP**:
- Глобальный `fetch` — это undici (Node 18+): 5.x в Node 18, 6.x в 20/22, 7.x в 24, **8.x в 26**; версию показывает `process.versions.undici` (на Node 24.17 — 7.28.0, проверено локально).
- Бенчмарк из README undici (Node 24.14.1, 50 соединений, pipelining 10), req/s: `undici.fetch` 5 439, axios 5 448, got 6 048, `http` с keep-alive 9 343, `undici.request` **16 851**, `undici.stream` 18 489, `undici.dispatch` 20 786. `undici.request` примерно в 3 раза быстрее `fetch` для вызовов между сервисами; `fetch` берите ради переносимости и простоты.
- **Ловушка: тело ответа нужно всегда прочитать или отменить** (`await res.body?.cancel()` для `fetch`, `body.dump()` для `undici.request`) — и у ответов с ошибочным статусом. Если оставить тело сборщику мусора, пул соединений исчерпывается и запросы зависают.
- Пул настраивайте один раз: глобальный dispatcher общий со встроенным `fetch`. Таймауты обязательны: `AbortSignal.timeout(ms)` для `fetch`, `headersTimeout`/`bodyTimeout` на undici `Agent`; без них зависший upstream держит сокет бесконечно.
- `MockAgent` — для тестов (см. [testing.md](testing.md)); `ProxyAgent`/`EnvHttpProxyAgent` — для корпоративных прокси (Node 24+ также понимает `NODE_USE_ENV_PROXY=1` [не проверено]).
- **axios** всё ещё повсюду, но это лишняя зависимость и семейство целей атак на цепочку поставок 2025–2026 (см. [toolchain.md](toolchain.md)). В новом серверном коде берите `fetch` или undici; `got` и `ky` нормальны, но большинству сервисов не нужны.

```js
import { Agent, setGlobalDispatcher, interceptors, request } from 'undici';

// Один раз при старте: пул, таймауты, ретраи идемпотентных методов, DNS-кэш, HTTP-кэш
setGlobalDispatcher(
  new Agent({ connections: 128, keepAliveTimeout: 10_000, headersTimeout: 10_000, bodyTimeout: 30_000 })
    .compose(interceptors.retry(), interceptors.dns(), interceptors.cache()),
);

// fetch: таймаут, проверка статуса, тело всегда читается или отменяется
const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
if (!res.ok) {
  await res.body?.cancel();
  throw new Error(`upstream ${res.status}`);
}
const data = await res.json();

// undici.request: быстрее для service-to-service
const { statusCode, body } = await request(url, { signal: AbortSignal.timeout(5_000) });
if (statusCode !== 200) {
  await body.dump();
  throw new Error(`upstream ${statusCode}`);
}
const item = await body.json();
```

Сниппет проверен локально на Node 24.17 с undici 7.28, а также с undici 8.12.4 на Node 24.17 и 26.13 (в Node 26.13 встроен undici 8.12.2); undici 8 требует Node ≥22.19. Учтите: `interceptors.retry()` повторяет GET и на ответах 5xx, поэтому на стабильно падающем upstream `fetch` упирается в `AbortSignal.timeout`, а не сразу видит статус (проверено локально).

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [HTTP (Node.js docs)](https://nodejs.org/api/http.html) / [HTTP/2](https://nodejs.org/api/http2.html) | Node.js project, документация v26.13 | Таймауты сервера, семантика `close`, опции `createServer`; HTTP/2-сервер и клиент |
| [undici](https://github.com/nodejs/undici) / [undici docs](https://undici.nodejs.org/) | Matteo Collina, Robert Nagy и др. | Бенчмарк, `fetch` против `request`, чтение тела, interceptors; API `Agent`, `Pool`, `MockAgent` |
| [fetch (Node.js globals)](https://nodejs.org/api/globals.html#fetch) | Node.js project | Встроенный `fetch` |
| [ALB connection idle timeout](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html#connection-idle-timeout) | AWS | Idle timeout ALB (60 с по умолчанию) |
| [Fastify Server options](https://fastify.dev/docs/latest/Reference/Server/) | Fastify team | `keepAliveTimeout`, `http2`, `connectionTimeout` |

## 3. Стили API: валидация, OpenAPI, GraphQL, RPC, WebSocket и SSE

### Ключевые выводы

**Валидация и OpenAPI**
- Валидируйте **каждый** внешний ввод на границе: тело, query, params, заголовки, переменные окружения, payload вебхуков, сообщения из очередей. Одна библиотека схем на сервис; сравнение библиотек — в [typescript.md](typescript.md).
- **Standard Schema** (`@standard-schema/spec`) — интерфейс совместимости, который реализуют Zod 4, Valibot 1, ArkType 2 и другие; дополнение **Standard JSON Schema** даёт `jsonSchema.input/output({ target: 'draft-2020-12' | 'draft-07' | 'openapi-3.0' })`. Потребители в 2026: декораторы маршрутов NestJS 12, `@hono/standard-validator`, tRPC, oRPC, h3, TanStack Start (кроме NestJS — [не проверено]). Выбирайте фреймворки, принимающие Standard Schema: валидатор можно будет заменить.
- **OpenAPI из кода**: Fastify — JSON Schema (или type provider для `typebox` 1.x / Zod) на каждом маршруте + `@fastify/swagger` (9.9) + `@scalar/api-reference` или `@fastify/swagger-ui`, одна схема даёт валидацию, сериализацию, типы и документацию; Hono — `@hono/zod-openapi` (`createRoute`) или `hono-openapi` (на Standard Schema); Express — `express-openapi-validator` (spec-first) или `@asteasolutions/zod-to-openapi`; NestJS — `@nestjs/swagger` 12.
- **Spec-first** (OpenAPI-документ — источник истины) подходит для публичных API и потребителей на разных языках. TS-клиенты: `openapi-typescript` + `openapi-fetch` или `@hey-api/openapi-ts`.
- Валидация **ответа** важна не меньше, чем запроса: необъявленные поля (хеши паролей, внутренние флаги) утекают через `JSON.stringify(entity)`. Схемы `response` в Fastify их отрезают; в остальных фреймворках явно маппьте в DTO. Это OWASP API3:2023 (Broken Object Property Level Authorization).

**GraphQL**
- **graphql-js 17** — GA 2026-06-15, первый мажор с 2021: `execute()` по-прежнему возвращает один результат, `@defer`/`@stream` — через `experimentalExecuteIncrementally()`; первоклассный `AbortSignal` (`info.getAbortSignal()`); события жизненного цикла в `diagnostics_channel`; методы кастомных скаляров переименованы (`coerceOutputValue`, `coerceInputValue`, `coerceInputLiteral`; старые имена — устаревшие алиасы); опция `hideSuggestions`; engines `^22 || ^24 || >=26`.
- **GraphQL Yoga 6** (2026-10-23): Node ≥22, graphql ≥16, Hive Logger вместо консольного (`context.log`), новый формат incremental delivery включается заголовком `Accept: multipart/mixed;incrementalSpec=v0.2`.
- **Apollo Server 4 — EOL с 2026-01-26**; текущий — Apollo Server 5, апгрейд с v4 на поддерживаемом Node занимает «only a few minutes» (официальная страница previous versions). **Mercurius 16** — нативный вариант для Fastify (JIT-компиляция, loaders, федерация) [не проверено].
- Построители схем: Pothos 4 (code-first, типизированный) — активный выбор; Nexus 1.3.0 (2022) затих; TypeGraphQL 2.0 висит в RC с 2023 года (по данным npm). Подписки — через `graphql-ws` 6.x; `subscriptions-transport-ws` `[устарело]` → `graphql-ws` (NestJS 12 его удалил).
- Обязательно для продакшен-GraphQL: DataLoader (N+1), лимиты глубины и сложности запроса, выключенные introspection и подсказки в проде (или `hideSuggestions`), persisted/trusted documents для своих клиентов, авторизация на уровне полей. Плагины Yoga/Envelop закрывают большую часть.

**Типизированный RPC и gRPC**
- **tRPC 11** (11.24) — лучший выбор для TS-монорепозитория, где сервер и клиент выпускаются вместе; встроенного OpenAPI нет (`trpc-openapi` от сообщества deprecated) [не проверено].
- **oRPC 1.x** (1.16; 2.0 в бете) — DX как у tRPC плюс contract-first и встроенный вывод OpenAPI; автор заявляет более быструю проверку типов и меньшие бандлы (цифры вендора) [не проверено]. **Hono RPC** (клиент `hc`) — если Hono уже выбран.
- **gRPC**: `@grpc/grpc-js` 1.14 (чистый JS) или **Connect** (`@connectrpc/connect-node` 2.x): один обработчик обслуживает gRPC, gRPC-Web и протокол Connect, работает с Fastify/Express [не проверено].

**WebSocket и SSE**
- **`ws` 8.22** — стандартная серверная библиотека (на ней `@fastify/websocket` и `@hono/node-ws`). В Node есть совместимый с браузером **клиент** `WebSocket` (стабилен с Node 22), но **встроенного WebSocket-сервера нет** [не проверено].
- **uWebSockets.js** (C++ через нативное расширение, только GitHub; v20.67.0 от 2026-05 добавил Node 26 и убрал 20/25) даёт максимальную плотность соединений, но его нет в npm, и вы привязаны к его релизам и бинарникам под конкретный ABI [не проверено].
- **Socket.IO 4.8** добавляет комнаты, подтверждения, переподключение, fallback-транспорты и адаптеры Redis/Postgres для рассылки между узлами. Это свой протокол (клиенту нужен socket.io-client); берите ради этих функций, иначе — `ws` [не проверено].
- **Масштабирование WebSocket**: sticky sessions для чистого WS не нужны, но рассылке между узлами нужен pub/sub-бэкплейн (Redis, NATS, Postgres LISTEN/NOTIFY). Heartbeat через ping/pong и `terminate()` мёртвых сокетов; `maxPayload`; аутентификация во время HTTP upgrade (`verifyClient`/`handleUpgrade`), а не после; проверка `Origin` (cross-site WebSocket hijacking).
- **SSE** (`text/event-stream`) проще WebSocket для потока «сервер → клиент» (токены LLM, уведомления): обычный HTTP, автопереподключение с `Last-Event-ID`, проходит через большинство прокси (отключите буферизацию заголовком `X-Accel-Buffering: no`). Под HTTP/1.1 браузер держит около 6 соединений на origin — на краю нужен HTTP/2.

### Как выбрать стиль API

| Нужно | Выбор | Не брать |
|---|---|---|
| Публичный REST API, много потребителей | Fastify или Hono + OpenAPI 3.1 (schema-first или code-first) | документация руками, которая расходится с кодом |
| Full-stack TS-приложение, одна команда | tRPC 11 или oRPC (OpenAPI, если могут прийти третьи стороны) | GraphQL только ради типов |
| Много клиентов с разными потребностями в данных | GraphQL (Yoga 6, Apollo 5 или Mercurius) + DataLoader + лимиты | GraphQL без лимитов сложности |
| Внутренние сервисы на разных языках | gRPC или Connect | JSON поверх случайного HTTP без контрактов |
| Push с сервера в одну сторону | SSE | WebSocket без потребности «клиент → сервер» |
| Двусторонний real-time | `ws` (+ бэкплейн) или Socket.IO | polling |

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Standard Schema](https://standardschema.dev/) / [standard-schema на GitHub](https://github.com/standard-schema/standard-schema) | Colin McDonnell, Fabian Hiller, David Blass, 2024–2026 | Спецификации Standard Schema и Standard JSON Schema; список реализаций и потребителей |
| [fastify-swagger](https://github.com/fastify/fastify-swagger) / [Scalar](https://github.com/scalar/scalar) | Fastify team; Scalar | OpenAPI из схем маршрутов; UI справки по API |
| [Hono Zod OpenAPI](https://hono.dev/examples/zod-openapi) / [express-openapi-validator](https://github.com/cdimascio/express-openapi-validator) | Hono team; Carmine DiMascio | Маршруты Zod OpenAPI; spec-first валидация для Express |
| [openapi-typescript](https://openapi-ts.dev/) / [Hey API](https://heyapi.dev/) | Drew Powers и др.; Hey API | Генерация TS-клиентов из OpenAPI |
| [Introducing GraphQL.js v17](https://graphql.org/blog/2026-06-15-introducing-graphql-js-v17/) / [v16 → v17](https://graphql-js.org/upgrade-guides/v16-v17) | Yaacov Rydzinski, 2026; GraphQL.js team | Изменения graphql-js 17 и гайд по апгрейду |
| [Yoga adopts Hive Logger](https://the-guild.dev/graphql/hive/product-updates/2026-10-24-yoga-adopts-hive-logger-support-latest-defer-steam-spec-drops-legacy-node-and-graphql) / [GraphQL Yoga docs](https://the-guild.dev/graphql/yoga-server/docs) | The Guild, 2026-10-24 | Ломающие изменения Yoga 6; документация |
| [Apollo Server previous versions](https://apollographql.com/docs/apollo-server/previous-versions) / [Mercurius](https://mercurius.dev/) | Apollo; Mercurius team | EOL Apollo Server 4 (2026-01-26); GraphQL-адаптер для Fastify |
| [Pothos](https://pothos-graphql.dev/) / [DataLoader](https://github.com/graphql/dataloader) / [graphql-ws](https://github.com/enisdenjo/graphql-ws) | Michael Hayes; GraphQL Foundation; Denis Badurina | Code-first схемы; батчинг против N+1; GraphQL over WebSocket |
| [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html) | OWASP | Глубина, introspection, batching-атаки |
| [tRPC docs](https://trpc.io/docs) | Alex Johansson и др. | tRPC 11 |
| [oRPC comparison](https://orpc.dev/docs/comparison) / [oRPC v1 (InfoQ)](https://www.infoq.com/news/2025/12/orpc-v1-typesafe) | unnoq, 2025–2026; InfoQ, 2025-12 | Сравнение oRPC с tRPC и ts-rest (от вендора); обзор v1 |
| [Connect for Node](https://connectrpc.com/docs/node/getting-started/) / [grpc-node](https://github.com/grpc/grpc-node) | Buf; gRPC team | Connect на Node; grpc-js |
| [ws](https://github.com/websockets/ws) / [uWebSockets.js releases](https://github.com/uNetworking/uWebSockets.js/releases) | Luigi Pinca и др.; Alex Hultman | `verifyClient`, пример heartbeat; релизы uWS и поддержка ABI Node |
| [Socket.IO v4 docs](https://socket.io/docs/v4/) / [Server-sent events (HTML spec)](https://html.spec.whatwg.org/multipage/server-sent-events.html) | Damien Arrachequesne; WHATWG | Адаптеры и масштабирование Socket.IO; спецификация SSE |

## 4. Базы данных, драйверы, ORM, миграции, кэш

### Ключевые выводы

**Драйверы PostgreSQL**
- **`pg` (node-postgres) 8.23** — выбор по умолчанию с самой широкой экосистемой (поверх него работают Drizzle, Kysely, адаптер Prisma, MikroORM, TypeORM). Умолчания пула: `max` 10, `idleTimeoutMillis` 10000, **`connectionTimeoutMillis` 0 (ждать вечно)**, `maxLifetimeSeconds` 0, `maxUses` Infinity; новая опция `pipeline: true` включает pipelining запросов на клиенте. После `pool.connect()` всегда `client.release()` в `finally` (`release(true)` уничтожает сломанный клиент); никогда не ведите транзакцию через `pool.query()` — каждый вызов может уйти в другое соединение. Задайте `connectionTimeoutMillis` (например, 5000), чтобы исчерпание пула давало быструю ошибку, а не зависший запрос.
- **`postgres` (postgres.js) 4.x** — API на tagged templates, самый быстрый клиент на чистом JS по словам автора. **v4.0.0 (2026-10-29)**: только ESM; типы параметров определяет сервер (`infer: false`; `Date` в `timestamp` трактуется как UTC); `sql.array()` удалён; откатившиеся транзакции отклоняются с `TRANSACTION_ROLLED_BACK`; «сырой» `BEGIN` вне `sql.begin` отклоняется (`UNSAFE_TRANSACTION`); `.signal(abortSignal)`; вложенный `sql.begin` — savepoint; tracing channels и `sql.stats`. **v4.1.0 (2026-11-05)**: `query_timeout`, `cancel_timeout` (5 с по умолчанию), `sql.batch()`, чтение `PGSSLMODE` (может изменить текущее поведение TLS). Держите `^3`, пока не прочитали заметки к v4.
- **Размер пула**: всего соединений = поды × процессы × `max` пула; держите сумму ниже `max_connections` Postgres с запасом. При многих подах или serverless ставьте **PgBouncer (transaction mode)** или управляемый пулер (Supabase Supavisor, Neon, RDS Proxy). В transaction mode сессионные функции (именованные prepared statements, `SET`, сессионные advisory locks, LISTEN) ломаются, если пулер их не поддерживает.
- Serverless и edge: serverless-драйвер Neon (`@neondatabase/serverless`, HTTP/WebSocket), Cloudflare Hyperdrive, Supabase. Не открывайте TCP-пул на каждый вызов Lambda.

```js
import pg from 'pg';

export const pool = new pg.Pool({ max: 10, connectionTimeoutMillis: 5_000, idleTimeoutMillis: 10_000 });

export async function transfer(from, to, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, from]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, to]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release(); // release(true) — если соединение сломано
  }
}
```

**Другие базы**
- **MySQL**: `mysql2` 3.24 (promise API, prepared statements); пакет `mysql` не поддерживается [не проверено]. **MongoDB**: драйвер `mongodb` 7.8 (Node ≥20.19), Mongoose 9.12; клиент Prisma 7 без Rust вышел без MongoDB, пользователи Mongo остались на Prisma 6 [не проверено].
- **Redis и Valkey**: `redis` (node-redis 6.x) рекомендует Redis Inc.; `ioredis` 6.0 (2026-07) по-прежнему используют BullMQ и многие библиотеки; для Valkey — `iovalkey` (форк ioredis) и `@valkey/valkey-glide`. Задайте `maxRetriesPerRequest` и таймауты подключения и команд; обрабатывайте событие `error` (необработанный `error` роняет процесс).
- **SQLite**: **`node:sqlite`** (без флага с 23.4/22.13) в документации Node 26 — **release candidate с v25.7.0** (stability 1.2); только синхронный API; класс переименован в `Database` (`DatabaseSync` — устаревший алиас, DEP0210), `Statement` — DEP0211; `createTagStore()` — tagged templates с LRU-кэшем выражений (v24.9); defensive mode по умолчанию с v25.5/v24.14; sessions/changesets; `backup()`. **better-sqlite3 13** (Node ≥22) — зрелый, синхронный, самый быстрый, нативное расширение с prebuilds. **libSQL/Turso** (`@libsql/client`) — реплицируемый и edge-SQLite; **PGlite** (`@electric-sql/pglite`, Postgres в WASM) — для тестов и разработки в процессе. SQLite в Node синхронный: долгий запрос блокирует event loop, тяжёлое выносите в worker (см. [concurrency-async-native.md](concurrency-async-native.md)).

**ORM и query builders (состояние 2026)**
- **Prisma 7** (2025-11-19) сделал **компилятор запросов на TypeScript без Rust** вариантом по умолчанию: генератор `prisma-client`, ESM-first, явные **driver adapters** (например, `@prisma/adapter-pg`), URL источника данных переехал в `prisma.config.ts`, `.env` больше не грузится автоматически. Вендор заявляет бандл примерно на 90% меньше и запросы до 3 раз быстрее [не проверено]. В 7.x добавлены кэш запросов (7.4) и savepoints для вложенных транзакций (7.5). **Prisma Next** (анонс 2026-03-04) — переписывание на TypeScript до 1.0, «not ready for production»; для продакшена рекомендуется Prisma 7 [не проверено].
- **Drizzle ORM** 0.45.4 стабилен, **1.0 в RC** (тег `rc` — 1.0.0-rc.5); 1.0 убирает RQB v1 (Relational Queries v2 с `defineRelations()`), drizzle-kit переходит от снапшотов БД к DDL-снапшотам с папками миграций по времени [не проверено]. SQL-подобный, схема на TS, без кодогенерации, работает на edge-драйверах. Дата GA 1.0 неясна: `latest` в npm — 0.45.4, сторонние источники расходятся.
- **Kysely** 0.29 — типобезопасный построитель SQL (не ORM), без runtime-схемы, типы из `kysely-codegen` или руками; на нём построен MikroORM 7; всё ещё 0.x, но API стабилен; в engines Node ≥22.
- **MikroORM 7**: Data Mapper + Unit of Work + Identity Map; вместо Knex свой построитель SQL, исполняемый через **Kysely** (`em.getKysely()` типизирован по метаданным); нативный ESM; ядро без runtime-зависимостей; `@mikro-orm/knex` переименован в `@mikro-orm/sql` [не проверено].
- **TypeORM 1.0** (2026-05-19, первый мажор с 2016): удалены давно устаревшие глобальные функции (`getRepository`, `getManager` → `DataSource`), Node 20+ [не проверено]. Снова поддерживается, но смесь декораторов, Active Record и Data Mapper и история багов оставляют его выбором для существующего кода.
- **Sequelize 6** в режиме поддержки, v7 годами в альфе, `sequelize-typescript` затих с 2023 — новые проекты на нём не начинайте. **Objection 4** ожил в 2026; **Knex 3.3** остаётся надёжным раннером миграций и построителем запросов для JS.

### Ловушка тега `latest` у Prisma

На ноябрь 2026 dist-tag `latest` пакета **`prisma` (CLI) указывает на 8.0.0-rc.30** — новый CLI из репозитория `prisma/prisma-cli` («one binary for the ORM, Composer, and the Prisma Developer Platform»). При этом `latest` у `@prisma/client` — 7.10.1, а CLI 7.10.1 лежит на теге `prev`. Значит, `npm i -D prisma` или `npx prisma` без версии ставят RC другой мажорной линии, чем клиент. Факт проверен по метаданным npm; как связаны CLI 8.0 RC, записи «Prisma ORM 8» в changelog и Prisma Next, первоисточники не проясняют.

```bash
npm view prisma dist-tags            # latest: 8.0.0-rc.30, prev: 7.10.1
npm i -D prisma@7 && npm i @prisma/client@7 @prisma/adapter-pg@7
npx prisma@7 generate                # в скриптах CI тоже с явной версией
```

### Сравнение ORM и query builders

| Инструмент | Версия (2026-11-06) | Модель | Типы | Миграции | Edge и serverless | Поддержка | Когда брать |
|---|---|---|---|---|---|---|---|
| Prisma | client 7.10.1 (CLI `latest` = 8.0 RC) | схема на DSL → сгенерированный клиент | отличные (генерация) | `prisma migrate` (декларативный diff) | да, через driver adapters | очень активная; много перемен (7, CLI 8, Prisma Next) | продуктовые команды, которым нужны DX, Studio, типизированные связи |
| Drizzle | 0.45.4 (1.0 RC) | схема на TS, SQL-подобный builder + relational queries | отличные (выводятся) | drizzle-kit generate/migrate/push | да (Neon, D1, libSQL…) | очень активная | команды, знающие SQL; edge; без кодогенерации |
| Kysely | 0.29.8 | только query builder | отличные (из типов БД) | встроенный `Migrator` (код) | да (диалекты) | активная | полный контроль SQL с типами |
| MikroORM | 7.2.7 | Data Mapper, UoW, Identity Map | хорошие | встроенные (diff схемы) | частично (v7 целится в Deno и edge) | активная | доменные модели в стиле DDD |
| TypeORM | 1.1.2 | декораторы, AR или DM | средние | CLI generate | ограниченно | ожил в 2026 | существующие кодовые базы TypeORM/NestJS |
| Sequelize | 6.37.8 | AR | слабые | CLI на umzug | нет | поддержка | только legacy |
| Knex | 3.3.0 | query builder | слабые | встроенные | нет | медленно, но живой | JS-проекты, миграции |
| Mongoose | 9.12.0 | ODM | хорошие | — | — | активная | приложения на MongoDB |

**Миграции**
- Запускайте миграции **отдельным шагом** (job в CI, Kubernetes Job или initContainer, release phase), а не при каждом старте приложения на N репликах.
- Нулевой простой — **expand/contract**: добавить nullable-колонку → заполнить батчами → переключить чтение и запись → добавить ограничение `NOT VALID`, затем `VALIDATE` → удалить старую колонку в следующем деплое. Индексы Postgres — `CONCURRENTLY` (вне транзакции); `lock_timeout` в миграциях.
- Инструменты: встроенные во фреймворк (Prisma Migrate, drizzle-kit, MikroORM, Kysely Migrator) или отдельные `node-pg-migrate` 9, `umzug` 3.8, Graphile Migrate; `postgrator` затих (последний релиз 2024-11). Линтер миграций — **squawk** (не зависит от языка).

**N+1, гигиена запросов, кэш**
- ORM прячут N+1: `include` и relation queries в Prisma, relational queries в Drizzle, `populate` в MikroORM, `relations` в TypeORM; в GraphQL — DataLoader. Логируйте медленные запросы (`log_min_duration_statement`, `pg_stat_statements`) и смотрите число запросов на HTTP-запрос в трейсах (инструментации OpenTelemetry для pg и Prisma).
- Всегда параметризуйте; сырой SQL — только через tagged templates (`` sql`...` `` в Drizzle, Kysely, postgres.js; tagged-форма `$queryRaw` в Prisma). `$queryRawUnsafe` и склейка строк — SQL-инъекция.
- Кэш в процессе — `lru-cache` 11 (ограничение по размеру и TTL), никогда не неограниченный `Map` (утечка памяти). Для нескольких инстансов — Redis/Valkey; `keyv`/`cacheable` для многоуровневых кэшей. Защита от stampede: single-flight (схлопывание одинаковых запросов в один промис), stale-while-revalidate. HTTP-кэш: `Cache-Control`, ETag; у undici есть клиентский interceptor кэша. Ключ кэша включает tenant или пользователя, если ответ от них зависит.

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [node-postgres: Pool](https://node-postgres.com/apis/pool) / [Transactions](https://node-postgres.com/features/transactions) | Brian Carlson | Опции пула, правила `release`; транзакция на одном клиенте |
| [postgres.js releases](https://github.com/porsager/postgres/releases) / [postgres.js](https://github.com/porsager/postgres) | Rasmus Porsager, 2026 | Ломающие изменения v4.0 и v4.1; документация API |
| [SQLite (Node.js docs)](https://nodejs.org/api/sqlite.html) / [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) / [PGlite](https://pglite.dev/) | Node.js project (v26.13); Joshua Wise и др.; ElectricSQL | Статус и API `node:sqlite`; синхронный драйвер; Postgres в WASM для тестов |
| [node-mysql2](https://github.com/sidorares/node-mysql2) | Andrey Sidorov | Драйвер MySQL |
| [MongoDB Node driver](https://www.mongodb.com/docs/drivers/node/current/) [не проверено] / [Migrating to Mongoose 9](https://mongoosejs.com/docs/migrating_to_9.html) | MongoDB; Mongoose team | Драйвер; миграция на Mongoose 9 |
| [node-redis guide](https://redis.io/docs/latest/develop/clients/nodejs/) [не проверено] / [ioredis](https://github.com/redis/ioredis) | Redis Inc.; Redis Inc. / Zihua Li | Клиенты Redis |
| [Prisma changelog](https://www.prisma.io/changelog) / [Prisma 7 changelog](https://www.prisma.io/changelog/2025-11-19) | Prisma, 2025–2026 | Релизы 7.x, записи о Prisma 8; Prisma 7 без Rust по умолчанию |
| [Prisma 7 AMA](https://www.prisma.io/blog/prisma-7-ama-clearing-up-the-why-behind-the-changes) | Prisma, 2025 | Мотивы изменений, пробел с MongoDB, область конфига |
| [The next evolution of Prisma ORM](https://www.prisma.io/blog/the-next-evolution-of-prisma-orm) / [prisma-next](https://github.com/prisma/prisma-next) | Prisma, 2026-03 | Анонс и статус Prisma Next (до 1.0) |
| [Prisma query optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) | Prisma | N+1, стратегии загрузки связей |
| [Drizzle v0 → v1 changes](https://orm.drizzle.team/docs/v0-v1-changes) / [Drizzle docs](https://orm.drizzle.team/docs/overview) | Drizzle team | Апгрейд на 1.0 (RQB v2, новый kit); документация |
| [Kysely](https://kysely.dev/) / [MikroORM 7 released](https://mikro-orm.io/blog/mikro-orm-7-released) | Sami Koskimaki, Igal Klebanov; Martin Adamek, 2026 | Документация Kysely; изменения MikroORM 7 |
| [TypeORM 1.0](https://typeorm.io/blog/typeorm-1-0) / [release notes](https://typeorm.io/docs/releases/1.0/release-notes/) | TypeORM team, 2026-05-19 | Анонс и ломающие изменения TypeORM 1.0 |
| [Knex](https://knexjs.org/) / [node-pg-migrate](https://github.com/salsita/node-pg-migrate) / [umzug](https://github.com/sequelize/umzug) | Knex team; Salsita; Sequelize team | Query builder и миграции; миграции Postgres; раннер миграций без привязки к фреймворку |
| [Squawk](https://squawkhq.com/) / [PgBouncer features](https://www.pgbouncer.org/features.html) | Squawk; PgBouncer | Линтер миграций Postgres; режимы пулинга и ограничения |
| [lru-cache](https://github.com/isaacs/node-lru-cache) | Isaac Schlueter | Ограниченный кэш в процессе |
| [Drizzle v1 vs Prisma 6 vs Kysely (PkgPulse)](https://www.pkgpulse.com/guides/drizzle-orm-v1-vs-prisma-6-vs-kysely-2026) | PkgPulse, 2026 | Вторичное сравнение; статус Drizzle 1.0 расходится с npm |

## 5. Очереди, фоновые задачи и брокеры сообщений

### Ключевые выводы

- **Медленную или повторяемую работу не делайте внутри запроса** (письма, вебхуки третьим сторонам, обработка изображений, вызовы LLM с длинным хвостом задержек). Поставьте задачу в очередь, верните 202, обработайте в процессе-воркере. Воркеры — отдельный деплой от HTTP-сервера: масштабируются и перезапускаются независимо.
- **Ставьте задачу атомарно с записью в БД**: transactional outbox (строка задачи пишется в той же транзакции, потом её пересылает relay) или очередь на Postgres, которая участвует в транзакции (pg-boss и graphile-worker принимают транзакцию или адаптер ORM). Постановка в Redis после `COMMIT` теряет задачи при падении; до `COMMIT` — обрабатывает задачи для откатившихся данных.
- **Все потребители идемпотентны** — доставка везде at-least-once: ключи идемпотентности, upsert, таблица обработанных сообщений, опции дедупликации.
- **BullMQ 6** (Redis/Valkey; 6.7.1 от 2026-11-06), ломающие изменения относительно v5: legacy repeatable jobs удалены (`queue.add(..., { repeat })`, `getRepeatableJobs`, класс `Repeat`) в пользу **Job Schedulers** (`upsertJobScheduler`, `getJobSchedulers`, `removeJobScheduler`); v6 **бросает ошибку, если находит метаданные legacy repeatable**, поэтому мигрируйте расписания, пока стоите на последней v5; `repeat.utc` → `tz: 'UTC'`; `debounce` → deduplication; `Queue.resume()` стал асинхронным; flow-задачи без `jobId` получают UUID; изменился интерфейс телеметрии. Бэкенд на PostgreSQL виден только в навигации документации [не проверено]. Redis — с `maxmemory-policy noeviction`, соединению ioredis у воркера нужен `maxRetriesPerRequest: null` [не проверено]. Bull (v4) — только поддержка; Bee-Queue — ниша.
- **pg-boss 12** (Postgres 13+, Node ≥22.12): захват задач через `SKIP LOCKED`, ретраи с экспоненциальной задержкой, расписания cron и RRULE, политики очередей (rate limit, debounce, concurrency), dead-letter очереди с redrive, приоритеты, pub/sub fan-out, зависимости задач, **транзакционная постановка через адаптеры Drizzle, Knex, Kysely и Prisma**, LISTEN/NOTIFY для низкой задержки. Берите, если Postgres уже есть, а нагрузка — от сотен до низких тысяч задач в секунду. **graphile-worker 0.18** (Postgres, Node ≥22.18): очень низкая задержка через LISTEN/NOTIFY, задачи ставятся из SQL и триггеров; всё ещё 0.x [не проверено].
- **Durable workflows** [не проверено]: **Temporal** TS SDK 1.25 (`@temporalio/worker`) — детерминированный код workflow в песочнице V8 isolate, activities делают I/O, процесс переживает падения; эксплуатация тяжёлая (или Temporal Cloud). Хостинговые альтернативы: **Inngest** (SDK 4.x), **Trigger.dev** v4, Restate, DBOS (durable execution на Postgres). Нужны для многошаговых саг с ожиданием людей и таймаутами, а не для fire-and-forget задач.
- **Kafka**: **KafkaJS не поддерживается** (последний релиз 2.2.4 — 2023-02-27). Варианты [не проверено]: `@confluentinc/kafka-javascript` 1.11 (librdkafka, API, совместимый с KafkaJS, под объектом конфигурации `kafkaJS`; нативное расширение) или **`@platformatic/kafka`** 2.15 (чистый JS на streams, API на промисах или колбэках; сравнение только от вендора). Микросервисы NestJS по-прежнему по умолчанию на KafkaJS — известная боль.
- **RabbitMQ**: `amqplib` 2.x (мажор 2026) или `rabbitmq-client` 5 (автопереподключение, API выше уровнем); всегда publisher confirms, ручные ack, `channel.prefetch(n)`, dead-letter exchanges. **NATS**: пакет `nats` **deprecated** → `@nats-io/transport-node` 3.x (+ `@nats-io/jetstream`), NestJS 12 перешёл на него. **Облачные очереди**: SQS (`@aws-sdk/client-sqs`; visibility timeout больше максимального времени обработки; DLQ с `maxReceiveCount`), Google Pub/Sub, Azure Service Bus.
- **Cron внутри процесса** (`croner` 10, `node-cron` 4) срабатывает **на каждой реплике**: при N подах — N раз. Используйте планировщик очереди (Job Schedulers BullMQ, расписания pg-boss), Kubernetes CronJob или лидерскую блокировку (advisory lock Postgres, блокировка в Redis с TTL). Agenda 6 (на MongoDB) жива.
- **Остановка воркера**: на SIGTERM прекратите забирать задачи, завершите или верните текущие в пределах grace period (`await worker.close()` в BullMQ, `boss.stop({ graceful: true })` в pg-boss), затем выходите. Задайте таймауты задач и обнаружение зависших (stalled) задач.

```js
import { Queue, Worker } from 'bullmq';

const connection = { host: process.env.REDIS_HOST, port: 6379 };
const queue = new Queue('email', { connection });

// Расписание в BullMQ 6: Job Scheduler вместо { repeat }
await queue.upsertJobScheduler('daily-digest', { pattern: '0 8 * * *', tz: 'UTC' }, { name: 'digest', data: {} });
// jobId — ключ дедупликации; ретраи с экспоненциальной задержкой
await queue.add('welcome', { userId }, { jobId: `welcome-${userId}`, attempts: 5, backoff: { type: 'exponential', delay: 1_000 } });

const worker = new Worker('email', async (job) => sendEmail(job.data), {
  connection: { ...connection, maxRetriesPerRequest: null },
  concurrency: 10,
}); // при остановке: await worker.close() — дождаться текущих задач
```

### Сравнение систем очередей и задач

| Система | Версия (2026-11-06) | Бэкенд | Доставка и возможности | Цена эксплуатации | Поддержка | Когда брать |
|---|---|---|---|---|---|---|
| BullMQ | 6.7.1 | Redis/Valkey (в документации указан бэкенд Postgres) | at-least-once, приоритеты, rate limit, flows (родитель/потомки), Job Schedulers, дедупликация, sandboxed processors | Redis с `noeviction`, AOF | очень активная (Taskforce.sh) | задачи общего назначения при высокой нагрузке |
| pg-boss | 12.38.1 | Postgres 13+ | at-least-once, SKIP LOCKED, cron, DLQ, транзакционная постановка | ничего сверх Postgres | очень активная | команды на Postgres, умеренная нагрузка, нужна атомарная постановка |
| graphile-worker | 0.18.0 | Postgres | низкая задержка, постановка из SQL | ничего сверх Postgres | активная, 0.x | Postgres + триггеры, пользователи PostGraphile |
| Temporal | SDK 1.25.0 | сервер Temporal или Cloud | durable workflows, таймеры, сигналы, саги | высокая (кластер) или стоимость Cloud | очень активная | долгие бизнес-процессы |
| Inngest / Trigger.dev | 4.25 / 4.7 | хостинг (возможен self-host) | durable steps, ретраи, расписания | низкая (SaaS) | активная, на венчурные деньги | serverless-приложения с durable steps |
| Kafka (клиент Confluent / @platformatic/kafka) | 1.11 / 2.15 | Kafka | лог, партиции, consumer groups, replay | высокая | активная | event streaming, большой объём, replay |
| KafkaJS | 2.2.4 | Kafka | то же | высокая | **не поддерживается с 2023** | не брать в новый код |
| RabbitMQ (amqplib / rabbitmq-client) | 2.2.1 / 5.1 | RabbitMQ | маршрутизация, DLX, confirms | средняя | активная | сообщения со сложной маршрутизацией |
| NATS (`@nats-io/*`) | 3.4 | NATS/JetStream | pub/sub, request/reply, streams, KV | низкая или средняя | активная | лёгкий обмен сообщениями |
| SQS | AWS SDK v3 | AWS | at-least-once (FIFO: exactly-once обработка в окне) | нет (managed) | активная | на AWS |
| Agenda | 6.2.6 | MongoDB | задачи по расписанию | Mongo | активная | команды на Mongo |
| Bull | 4.16.5 | Redis | legacy | Redis | только поддержка | мигрировать на BullMQ |

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [BullMQ: v5 → v6](https://docs.bullmq.io/guide/migrations/migrate-from-v5-to-v6) / [BullMQ docs](https://docs.bullmq.io/) / [going to production](https://docs.bullmq.io/guide/going-to-production) | Taskforce.sh, 2026 | Ломающие изменения v6; Job Schedulers и flows; настройки Redis, graceful shutdown, `maxRetriesPerRequest` |
| [pg-boss](https://github.com/timgit/pg-boss) / [graphile-worker](https://worker.graphile.org/) | Tim Jones; Benjie Gillam | Очереди на Postgres |
| [Temporal TypeScript SDK](https://docs.temporal.io/develop/typescript) / [Inngest docs](https://www.inngest.com/docs) / [Trigger.dev docs](https://trigger.dev/docs) | Temporal; Inngest; Trigger.dev | Детерминизм и песочница; durable functions; фоновые задачи v4 |
| [Why we created another Kafka client for Node.js](https://blog.platformatic.dev/why-we-created-another-kafka-client-for-nodejs) | Platformatic (Paolo Insogna, Matteo Collina), 2025 | Статус KafkaJS, устройство @platformatic/kafka |
| [Introducing Confluent Kafka JavaScript](https://www.confluent.io/blog/introducing-confluent-kafka-javascript/) / [nestjs/nest#13223](https://github.com/nestjs/nest/issues/13223) | Confluent; NestJS community | JS-клиент Confluent с API KafkaJS; обсуждение заброшенности KafkaJS |
| [amqplib](https://amqp-node.github.io/amqplib/) / [nats.js](https://github.com/nats-io/nats.js) / [croner](https://github.com/Hexagon/croner) | amqplib team; Synadia; Hexagon | Клиент RabbitMQ; JS-клиенты NATS v3; планировщик cron |
| [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) | Chris Richardson | Паттерн transactional outbox |

## 6. Боты: Telegram, Discord, Slack

### Ключевые выводы

- **Telegram: grammY** 1.46 (2026-08-26) — поддерживаемый TypeScript-first фреймворк (Node, Deno, Bun, edge) с плагинами: conversations, menus, sessions, rate limiter, auto-retry, `@grammyjs/runner` для конкурентного long polling [не проверено]. **Telegraf 4.16.3 затих** (нет релизов с 2024-02-29) — новых ботов на нём не начинайте.
- **Polling или webhooks**: long polling — для разработки и бота в одном экземпляре; webhooks (`webhookCallback(bot, 'fastify' | 'express' | 'hono')`) — для serverless и нескольких инстансов. С webhooks проверяйте заголовок `X-Telegram-Bot-Api-Secret-Token`, отвечайте в пределах таймаута и выносите медленную работу в очередь, иначе Telegram повторит доставку и update обработается дважды.
- Лимиты: около 30 сообщений/с глобально, 1 сообщение/с в чат, 20 в минуту в группу [не проверено]; плагины grammY `auto-retry` и `transformer-throttler`. Сессии при нескольких инстансах — в Redis или БД, не в памяти.
- **Discord: discord.js 14.28** (Node ≥18): шардирование (`ShardingManager` или `@discordjs/ws`) обязательно примерно от 2 500 серверов; slash-команды регистрируйте через REST при деплое, а не при каждом старте [не проверено]. **Slack: `@slack/bolt` 5.1** (Node ≥20): Socket Mode для внутренних приложений, HTTP mode с проверкой подписи — для публичных; подтверждайте за 3 с (сначала `ack()`, потом работа) [не проверено].
- Токены ботов — секреты: только env или secret manager; при утечке — ротация (GitHub secret scanning находит токены Telegram, Discord и Slack).

```ts
import { Bot, webhookCallback } from 'grammy';

const bot = new Bot(process.env.BOT_TOKEN!);
bot.command('start', (ctx) => ctx.reply('Привет!'));
bot.on('message:text', (ctx) => jobs.add('process-text', { chatId: ctx.chat.id, text: ctx.message.text })); // медленное — в очередь

// Webhook в Fastify; секрет сверяется с X-Telegram-Bot-Api-Secret-Token
app.post('/tg/webhook', webhookCallback(bot, 'fastify', { secretToken: process.env.TG_WEBHOOK_SECRET }));
// один раз при деплое: await bot.api.setWebhook(url, { secret_token: process.env.TG_WEBHOOK_SECRET })
```

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [grammY](https://grammy.dev/) / [deployment types](https://grammy.dev/guide/deployment-types) / [scaling](https://grammy.dev/advanced/scaling) | KnorpelSenf и др. | Гайд и плагины; polling против webhooks; runner и конкурентность |
| [Telegram Bot API](https://core.telegram.org/bots/api) / [Bots FAQ: limits](https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this) | Telegram | Справочник Bot API; лимиты |
| [Telegraf](https://github.com/telegraf/telegraf) | Telegraf team | Статус: последний релиз 2024-02 |
| [discord.js guide](https://discordjs.guide/) / [discord.js docs](https://discord.js.org/docs) | discord.js team | Шардирование, slash-команды; API |
| [Bolt for JavaScript](https://tools.slack.dev/bolt-js/) | Slack | Bolt для JS |

## 7. Аутентификация и авторизация

### Ключевые выводы

**Библиотеки (ноябрь 2026)**
- **Better Auth** 1.7 (очень активна): аутентификация на TS без привязки к фреймворку — email/пароль, OAuth, passkeys, 2FA, организации, сессии в вашей БД через адаптеры Drizzle, Prisma, Kysely. **Auth.js (NextAuth) с 2025-09-22 поддерживает команда Better Auth**: существующие пользователи получают исправления безопасности, новые проекты направляют в Better Auth [не проверено]. Пост от 2026-07-07: Better Auth **присоединяется к Vercel** [не проверено]. `latest` у `next-auth` всё ещё 4.24.x, v5 так и не вышел из беты (`5.0.0-beta.32`).
- **Lucia** **deprecated** в npm (v3 стала учебным ресурсом); её гайды (сессии, OAuth с Arctic, Oslo) полезны, если пишете своё. **Passport** 0.7.0 (2023-11): ядро затихло, стратегии неравноценны; допустим в существующих Express-приложениях, не в новом коде.
- **`jose`** 6.2 (Filip Skokan): JWT/JWS/JWE/JWK без зависимостей для Node, Deno, Bun, Workers и браузеров; **предпочтительнее `jsonwebtoken`** (только Node, API эпохи колбэков). `openid-client` того же автора — для OIDC relying party.
- Управляемые: Auth0/Okta, Clerk, WorkOS, Supabase Auth, Cognito, Keycloak/Zitadel (свой IdP); купить аутентификацию часто дешевле, чем владеть ею. Плагины: `@fastify/jwt`, `@fastify/session`, `@fastify/secure-session`, `@fastify/oauth2`; NestJS — `@nestjs/passport` + `@nestjs/jwt`; AdonisJS — `@adonisjs/auth`.

**Сессии или JWT**
- Для своих веб-приложений серверные сессии проще и отзываемы: случайный непрозрачный ID в cookie `HttpOnly; Secure; SameSite=Lax`, данные — в Redis или БД. JWT подходят для service-to-service и доступа третьих сторон; держите их короткоживущими (5–15 мин) с ротацией refresh-токенов и обнаружением повторного использования. Никогда не кладите JWT в `localStorage` браузерного приложения (XSS их украдёт).
- **Проверка JWT**: закреплённые алгоритмы, никогда `alg: none`, `exp`/`nbf` с небольшим допуском часов, ключи через `createRemoteJWKSet` (кэширует и ограничивает частоту запросов JWKS), проверка `aud`, чтобы токен одного сервиса не приняли в другом.

```js
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL('https://id.example.com/.well-known/jwks.json'));

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    algorithms: ['RS256'],             // или ['EdDSA']; никогда не из заголовка токена
    issuer: 'https://id.example.com/',
    audience: 'orders-api',
    clockTolerance: 5,                 // секунды
  });
  return payload;
}
```

**Хеширование паролей** (OWASP Password Storage Cheat Sheet): **Argon2id** с m=19 MiB (19456 KiB), t=2, p=1 (или равноценные компромиссы, например 46 MiB при t=1); scrypt N=2^17, r=8, p=1, если Argon2id недоступен; bcrypt — только legacy, cost ≥10 и **ограничение входа 72 байта**; PBKDF2-HMAC-SHA256 с 600 000 итераций — когда нужен FIPS.
- **В Node встроены `crypto.argon2()` / `argon2Sync()`** (добавлены в **v24.7.0** по метаданным документации; есть в 24.17 — проверено локально). Это «сырой» KDF, возвращающий байты: nonce (16+ байт) генерируете сами, алгоритм, параметры, nonce и тег храните сами (например, в формате PHC). `@node-rs/argon2` (Rust, prebuilds) и `argon2` (C) формируют и проверяют PHC-строки за вас и годятся для старых Node.
- Проверено локально на Node 24.17: хеш с параметрами OWASP занимал около 31 мс. Используйте асинхронную форму (пул потоков libuv), чтобы всплеск логинов не блокировал event loop. Секреты сравнивайте через `crypto.timingSafeEqual` на буферах равной длины.

```js
import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const argon2Async = promisify(argon2);
const P = { memory: 19456, passes: 2, parallelism: 1, tagLength: 32 }; // OWASP: 19 MiB, t=2, p=1
const b64 = (buf) => buf.toString('base64').replace(/=+$/, '');

export async function hashPassword(password) {
  const nonce = randomBytes(16);
  const tag = await argon2Async('argon2id', { message: password, nonce, ...P });
  return `$argon2id$v=19$m=${P.memory},t=${P.passes},p=${P.parallelism}$${b64(nonce)}$${b64(tag)}`;
}

export async function verifyPassword(password, phc) {
  const [, alg, , params, salt, hash] = phc.split('$');
  const { m, t, p } = Object.fromEntries(
    params.split(',').map((kv) => kv.split('=')).map(([k, v]) => [k, Number(v)]),
  );
  const expected = Buffer.from(hash, 'base64');
  const tag = await argon2Async(alg, {
    message: password, nonce: Buffer.from(salt, 'base64'),
    memory: m, passes: t, parallelism: p, tagLength: expected.length,
  });
  return timingSafeEqual(tag, expected);
}
```

Сниппет проверен локально на Node 24.17. При смене параметров перехешируйте пароль при следующем успешном входе.

**Авторизация**
- Проверки на уровне объекта — в сервисном слое на каждом запросе (`WHERE id = $1 AND tenant_id = $2`), а не только в маршрутах: это OWASP API1:2023 BOLA, риск №1 для API. Библиотеки: CASL (на атрибутах), Casbin, OpenFGA/SpiceDB (ReBAC в стиле Zanzibar) для сложного шаринга; Row-Level Security в Postgres — второй эшелон.
- **OAuth/OIDC**: Authorization Code + PKCE для каждого клиента; проверка `state` и `nonce`; точное совпадение redirect URI; токены SPA хранятся на сервере (паттерн BFF).
- **Защита аккаунтов**: rate limit и замедление на входе, регистрации, сбросе пароля и OTP — по IP и по аккаунту; одинаковые сообщения об ошибках; MFA и passkeys (WebAuthn: `@simplewebauthn/server`).

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Better Auth docs](https://www.better-auth.com/docs) | Better Auth team | Документация Better Auth |
| [Auth.js joins Better Auth](https://www.better-auth.com/blog/authjs-joins-better-auth) / [next-auth discussion #13252](https://github.com/nextauthjs/next-auth/discussions/13252) | Better Auth, 2025-09-22; Auth.js team, 2025 | Смена команды Auth.js; обсуждение миграции |
| [Better Auth joins Vercel](https://better-auth.com/blog/better-auth-joins-vercel) | Better Auth, 2026-07 | Better Auth присоединяется к Vercel |
| [Lucia](https://lucia-auth.com/) / [Passport](https://www.passportjs.org/) | pilcrowOnPaper; Jared Hanson | Гайд «сессии с нуля» (библиотека deprecated); legacy-аутентификация на стратегиях |
| [jose](https://github.com/panva/jose) / [openid-client](https://github.com/panva/openid-client) | Filip Skokan | JOSE/JWT; OIDC relying party |
| [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) / [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) | OWASP | Алгоритмы и параметры хеширования; cookie сессий, ротация, таймауты |
| [OWASP JWT](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html) / [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) | OWASP | Ловушки JWT; вход, MFA, сообщения об ошибках |
| [RFC 8725: JWT BCP](https://datatracker.ietf.org/doc/html/rfc8725) / [RFC 9700: OAuth 2.0 Security BCP](https://datatracker.ietf.org/doc/html/rfc9700) | IETF, 2020 / 2025 | Лучшие практики JWT и OAuth 2.0 |
| [Crypto (Node.js docs)](https://nodejs.org/api/crypto.html) | Node.js project | `crypto.argon2`, `scrypt`, `timingSafeEqual` |
| [CASL](https://casl.js.org/) / [OpenFGA](https://openfga.dev/) / [SimpleWebAuthn](https://simplewebauthn.dev/) | Sergii Stotskyi; OpenFGA (CNCF); Matthew Miller | ABAC; авторизация на отношениях; серверная часть passkeys |

## 8. Наблюдаемость

### Ключевые выводы

- **Логи: pino 10** — выбор по умолчанию: JSON, низкие накладные расходы, транспорты работают в worker threads через `pino.transport`; в Fastify встроен, для Express — `pino-http`. Winston 3.19 рабочий, но медленнее и по умолчанию менее структурирован. Правила: JSON в stdout, доставку делает платформа; никакого `pino-pretty` в продакшене; `redact: ['req.headers.authorization', '*.password']`; дочерние логгеры с ID запроса (`genReqId`, учитывайте входящие `x-request-id`/`traceparent`); ошибки логируйте объектом — `log.error({ err }, 'msg')`, чтобы сериализовались стек и `cause`; без синхронного `console.log` в горячих путях.
- **OpenTelemetry JS SDK 3.0** (релиз v3.0.0 на GitHub и `@opentelemetry/core` 3.0.0 в npm — 2026-10-20; 3.1.0 — 2026-11-05): **Node ≥22.15** (18 и 20 убраны); `@opentelemetry/sdk-trace-node`, `-base`, `-web` заменены на **`@opentelemetry/sdk-trace`**; Jaeger exporter и propagator, OpenTracing shim удалены (используйте OTLP); `AsyncHooksContextManager` удалён (остался менеджер на AsyncLocalStorage); пакеты собраны tsdown, двойные CJS/ESM с картами `exports` — глубокие импорты ломаются; экспериментальные пакеты перескочили на **0.300.x** (`@opentelemetry/sdk-node` 0.301.0 от 2026-11-05).
- SDK запускайте **до** импорта инструментируемых модулей: `node --import ./instrumentation.mjs app.mjs`. Для ESM-пакетов нужен loader hook `@opentelemetry/instrumentation/hook.mjs`: официальный esm-support.md подключает его флагом `--experimental-loader=@opentelemetry/instrumentation/hook.mjs`; вариант `module.register()` из кода (как ниже) тоже работает, но на Node 26 `module.register()` — runtime-deprecated (DEP0205) и печатает предупреждение (проверено локально на 26.13). CJS-пакеты вроде `pg`, импортированные из ESM-приложения, локально патчились и без хука. Вариант без кода — `--require @opentelemetry/auto-instrumentations-node/register` (для ESM — плюс тот же `--experimental-loader`) с переменными `OTEL_*`. В SDK 3 `SimpleSpanProcessor`/`BatchSpanProcessor` принимают объект `{ exporter }`, а не экспортёр позиционно (по `.d.ts` и локальному запуску).
- Предпочитайте инструментацию от самой библиотеки: **`@fastify/otel`** заменяет deprecated `@opentelemetry/instrumentation-fastify`; graphql-js 17 и postgres.js v4 публикуют `diagnostics_channel`/tracing channels; undici шлёт diagnostics channels, на которые подписан `instrumentation-undici`. Сэмплируйте на коллекторе (tail sampling) или через `ParentBased(TraceIdRatioBased)`; экспортируйте OTLP в OpenTelemetry Collector, а не напрямую вендорам.

```js
// instrumentation.mjs — запуск: node --import ./instrumentation.mjs dist/server.js
import { register } from 'node:module';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

register('@opentelemetry/instrumentation/hook.mjs', import.meta.url); // хуки для ESM-модулей; на Node 26 — DeprecationWarning DEP0205

export const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(), // адрес коллектора — из OTEL_EXPORTER_OTLP_ENDPOINT
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start(); // при остановке сервиса: await sdk.shutdown() — сбросить буфер спанов
```

Точную схему ESM-хуков сверяйте с [ESM support](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/esm-support.md) для своей версии SDK.

- **`node:diagnostics_channel`** стабилен с v19.2/v18.13; **`TracingChannel` стал стабильным в v26.8.0**; `boundedChannel()` (v26.1, экспериментальный) — для синхронных спанов. Встроенные каналы: `http.client.*`, `http.server.*`, `net`, `child_process`, `worker_threads`, `module.require/import`, Web Locks, `sqlite.db.query` (v26.8). Авторам библиотек стоит публиковать tracing channels вместо monkey-patching.
- **Метрики**: `prom-client` **deprecated в npm, его заменяет `@prometheus-io/client`** 0.16.1 из официального репозитория `prometheus/client_js` (Node ^22, ^24, ≥26); альтернатива — metrics SDK OpenTelemetry с экспортёром Prometheus или OTLP. Экспортируйте RED-метрики (rate, errors, гистограммы duration по **шаблону маршрута**, никогда по сырому URL — взрыв кардинальности) и метрики рантайма: задержку event loop (`perf_hooks.monitorEventLoopDelay`), event loop utilization (`performance.eventLoopUtilization()`), кучу, паузы GC, активные handles (код — в [concurrency-async-native.md](concurrency-async-native.md)).
- **Защита от перегрузки**: `@fastify/under-pressure` отвечает 503, когда задержка event loop, куча или RSS превышают пороги; та же идея строится на `monitorEventLoopDelay` для любого фреймворка.
- **Ошибки и APM**: Sentry `@sentry/node` 11 (на OTel), Datadog `dd-trace` 6 (Node ≥22), Elastic, New Relic, Honeycomb. Большинство стоят на OpenTelemetry — держите инструментацию независимой от вендора.
- **Health-эндпоинты**: `/livez` (процесс жив, без проверки зависимостей) и `/readyz` (может обслуживать: пул БД доступен, не идёт остановка). Liveness, зависящий от БД, во время инцидента с БД вызывает шторм перезапусков.

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [pino](https://getpino.io/) / [pino redaction](https://github.com/pinojs/pino/blob/main/docs/redaction.md) | Matteo Collina, David Mark Clements и др. | Транспорты, redaction, пути redaction |
| [OpenTelemetry JS v3.0.0](https://github.com/open-telemetry/opentelemetry-js/releases/tag/v3.0.0) | OpenTelemetry JS SIG, 2026-10 | Ломающие изменения SDK 3.0 |
| [OTel: Node.js getting started](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/) / [ESM support](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/esm-support.md) | OpenTelemetry | Настройка в Node; инструментация ESM через `--import` |
| [opentelemetry-js-contrib](https://github.com/open-telemetry/opentelemetry-js-contrib) / [@fastify/otel](https://github.com/fastify/otel) | OpenTelemetry; Fastify team | Contrib-инструментации; официальная OTel-инструментация Fastify |
| [Diagnostics Channel](https://nodejs.org/api/diagnostics_channel.html) / [Performance hooks](https://nodejs.org/api/perf_hooks.html) | Node.js project, v26.13 | Стабильный TracingChannel, встроенные каналы; ELU и задержка event loop |
| [prometheus/client_js](https://github.com/prometheus/client_js) / [under-pressure](https://github.com/fastify/under-pressure) | Prometheus; Fastify team | Официальный клиент `@prometheus-io/client`; сброс нагрузки |
| [Sentry for Node.js](https://docs.sentry.io/platforms/javascript/guides/node/) / [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) | Sentry; OpenTelemetry | Node SDK; коллектор и tail sampling |
| [Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) | Google SRE book | Golden signals |

## 9. Безопасность по OWASP Top 10:2025

### Ключевые выводы

Категории OWASP Top 10:2025: A01 Broken Access Control, A02 Security Misconfiguration, **A03 Software Supply Chain Failures** (новая), A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Security Logging and Alerting Failures, **A10 Mishandling of Exceptional Conditions** (новая). Для API добавьте OWASP API Security Top 10:2023: API1 BOLA, API3 BOPLA, API4 Unrestricted Resource Consumption, API7 SSRF.

| OWASP 2025 | Типичная ошибка в Node | Конкретная мера |
|---|---|---|
| A01 Broken Access Control | ID объекта из URL используется без проверки владельца (BOLA); mass assignment `db.update(req.body)`; path traversal при отдаче файлов | проверка владельца в сервисе или запросе (`WHERE id=$1 AND owner_id=$2`); allowlist полей схемой (`additionalProperties: false`, Zod `.strict()`); файлы — через `@fastify/static`/`express.static` или `path.resolve(root, p)` + проверка, что результат начинается с `root + path.sep`; отклонять `\0` |
| A02 Security Misconfiguration | стектрейсы в ответах; `X-Powered-By`; слишком широкий CORS (`origin: '*'` с credentials или отражение любого Origin); debug-эндпоинты и GraphQL introspection в проде; неверный `trust proxy` | центральный обработчик ошибок с общим 5xx; `helmet` 8 / `@fastify/helmet` 13 (CSP, HSTS, `noSniff`, frameguard; `X-XSS-Protection: 0`); явный allowlist CORS; в Express `app.set('trust proxy', <число хопов или CIDR>)` — никогда `true` за неизвестной цепочкой прокси, иначе rate limit по IP подделывается через `X-Forwarded-For`; `NODE_ENV=production` |
| A03 Software Supply Chain Failures | npm-черви и захваты аккаунтов мейнтейнеров 2025–2026; install-скрипты; тайпсквоттинг | lockfile + `npm ci`; `--ignore-scripts` / pnpm `onlyBuiltDependencies`; минимальный возраст релиза; provenance; Socket или `npm audit` в CI; мало зависимостей (встроенные `fetch`, `node:sqlite`, `crypto.argon2`, `util.parseArgs`). Подробно — в [toolchain.md](toolchain.md) |
| A04 Cryptographic Failures | `Math.random()` для токенов; MD5/SHA-1 для паролей; самописный JWT; отключённая проверка TLS (`NODE_TLS_REJECT_UNAUTHORIZED=0`, `rejectUnauthorized: false`) | `crypto.randomBytes`/`randomUUID`; Argon2id ([раздел 7](#7-аутентификация-и-авторизация)); `jose`; `crypto.timingSafeEqual`; проверку TLS не отключать — свой CA добавлять через `NODE_EXTRA_CA_CERTS` |
| A05 Injection | SQL склейкой строк или `$queryRawUnsafe`; NoSQL-инъекция операторов (`{ "$gt": "" }` из JSON или `qs`); command injection через `exec`; XSS в серверных шаблонах; `eval`/`new Function`/`vm` на вводе; инъекции в заголовки и логи | параметризованные запросы и tagged templates; валидация типов, чтобы объекты не попадали в фильтры Mongo (Mongoose `sanitizeFilter`, `strictQuery`); `execFile`/`spawn` с массивом аргументов и `shell: false`; шаблоны с автоэкранированием + CSP; `node:vm` — **не** песочница |
| A06 Insecure Design | нет rate limit и квот; пагинация без ограничений; гонки в бизнес-логике (двойное списание) | rate limit (`express-rate-limit` 8 / `@fastify/rate-limit` 11 / `rate-limiter-flexible` 11 с хранилищем Redis для нескольких инстансов); максимальный размер страницы; ограничения БД, `SELECT ... FOR UPDATE`, ключи идемпотентности |
| A07 Authentication Failures | нет троттлинга входа; путаница `alg` в JWT; долгоживущие токены в `localStorage`; session fixation | см. [раздел 7](#7-аутентификация-и-авторизация): Argon2id, закреплённые алгоритмы JWT, короткие TTL, новый ID сессии при входе, MFA и passkeys |
| A08 Software or Data Integrity Failures | **prototype pollution** через deep merge, `qs` или JSON (`__proto__`, `constructor.prototype`); небезопасная десериализация (`node-serialize`, YAML `!!js/function`); неподписанные вебхуки | валидация схемой с отказом от неизвестных ключей; `Object.create(null)` или `Map` для словарей; `secure-json-parse` (Fastify по умолчанию вырезает `__proto__`); `node --disable-proto=delete` (или `throw`); `Object.freeze(Object.prototype)` в усиленных приложениях; HMAC вебхука по сырому телу с `timingSafeEqual` |
| A09 Logging and Alerting Failures | нет аудита событий входа и админки; секреты и персональные данные в логах; логи только на диске | структурные логи pino с redaction; логировать отказы аутентификации и авторизации; алерты на всплески; отправка в центральное хранилище |
| A10 Mishandling of Exceptional Conditions | необработанные rejections роняют процесс или работа молча продолжается; обработчик `uncaughtException`, который продолжает обслуживать; утечка деталей ошибок; **ReDoS** и огромные payload, останавливающие event loop | при ошибках программиста — падение и перезапуск оркестратором; `process.on('unhandledRejection')` → лог + выход (поведение по умолчанию с Node 15 — `throw`); лимиты тела (Express `limit`, Fastify `bodyLimit` по умолчанию 1 MiB); `safe-regex2`, RE2 (пакет `re2`), без вложенных квантификаторов; таймауты везде |

**Дополнительные меры для Node**
- **SSRF** (API7): сервер ходит по URL от пользователя (вебхуки, прокси картинок, рендер PDF). Allowlist схем и хостов; разрешайте DNS и **блокируйте приватные, loopback, link-local и metadata-адреса в момент подключения** (против DNS rebinding) через свой `connect`/`lookup` в undici или фильтрующий агент; отключайте редиректы или перепроверяйте каждый хоп; никогда не пробрасывайте облачные метаданные (`169.254.169.254`). На AWS — IMDSv2.

```js
import { lookup as dnsLookup } from 'node:dns';
import { BlockList, isIP } from 'node:net';
import { Agent, fetch } from 'undici'; // fetch из того же пакета, что и Agent

const blocked = new BlockList();
for (const [net, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16]]) blocked.addSubnet(net, prefix, 'ipv4');
for (const [net, prefix] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10]]) blocked.addSubnet(net, prefix, 'ipv6');
const isBlocked = (ip) => blocked.check(ip, isIP(ip) === 6 ? 'ipv6' : 'ipv4');

function safeLookup(hostname, options, callback) {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const bad = addresses.find((a) => isBlocked(a.address));
    if (bad) return callback(Object.assign(new Error(`SSRF: blocked ${bad.address}`), { code: 'ESSRF' }));
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}

const egress = new Agent({ connect: { lookup: safeLookup }, headersTimeout: 10_000, bodyTimeout: 10_000 });

export async function fetchUserUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('scheme not allowed');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && isBlocked(host)) throw new Error(`SSRF: blocked ${host}`); // для IP-литералов lookup не вызывается
  return fetch(url, { dispatcher: egress, redirect: 'manual', signal: AbortSignal.timeout(10_000) });
}
```

Проверено локально на Node 24.17 (undici 7.28 и 8.12.4) и Node 26.13 (undici 8.12.4): блокируются `127.0.0.1`, `localhost`, `[::1]`, `[::ffff:127.0.0.1]`, `2130706433`, `0x7f.1`; публичный хост проходит. Без отдельной проверки IP-литерала `http://127.0.0.1/` обходит `lookup`. `BlockList` сам сопоставляет IPv4-mapped IPv6 с правилами IPv4; правило `::ffff:0:0/96` добавлять нельзя — оно блокирует весь IPv4. Глобальный `fetch` с `dispatcher` из npm-пакета другой мажорной линии ломается: на Node 24.17 (встроен undici 7) `Agent` из undici 8 давал `invalid onRequestStart method` даже для публичного хоста, поэтому `fetch` импортируется из `undici` (проверено локально).

- **HTTP request smuggling**: оставьте строгий парсер `llhttp` по умолчанию; никогда не включайте `insecureHTTPParser` в продакшене; обновляйте Node (несколько релизов безопасности 2024–2026 исправляли парсер) [не проверено].
- **CSRF**: `csurf` в архиве `[устарело]` → `csrf-csrf` (double-submit, 4.x), `@fastify/csrf-protection` или встроенные механизмы фреймворка. Cookie `SameSite=Lax` плюс проверка заголовков `Origin`/`Sec-Fetch-Site` — сильная современная база (OWASP: не полагайтесь только на SameSite).
- **DoS через event loop**: большие JSON-тела, синхронная криптография (`pbkdf2Sync`, `argon2Sync`), `JSON.parse` многомегабайтного ввода, катастрофические регулярки. Ставьте лимиты, используйте асинхронные API, выносите CPU-работу.
- **Permission model** — **стабилен с v23.5/v22.13**. `--permission` с `--allow-fs-read/-write`, `--allow-child-process`, `--allow-worker`, `--allow-net`, `--allow-addons`, `--allow-wasi`, `--allow-ffi`; режим `--permission-audit` публикует нарушения в diagnostics_channel; `process.permission.has()/drop()`; можно задать в `--config-file` в секции `"permission"`. Это **ремень безопасности для доверенного кода, а не песочница**: симлинки ведут за пределы разрешённых путей, уже открытые файловые дескрипторы обходят проверки, `node:sqlite` трогает ФС без проверок `fs`, workers наследуют флаги, если не задан `execArgv`. Для недоверенного кода — контейнеры, seccomp, отдельные пользователи.

```bash
node --permission --allow-fs-read=/app --allow-fs-write=/app/tmp --allow-net dist/server.js
```

- **Релизы безопасности**: Node выпускает согласованные security-релизы для всех поддерживаемых линий. Подпишитесь на анонсы nodejs.org и рассылку `nodejs-sec`, ставьте minor и patch быстро, запускайте только поддерживаемые линии (20.x — EOL с 2026-04-30).
- **Секреты**: переменные окружения или secret manager; `--env-file` — для локальной разработки; никогда не логируйте `process.env`; сканируйте репозитории (gitleaks, GitHub secret scanning).

Проверка подписи вебхука по сырому телу и безопасная отдача файлов:

```js
import { createHmac, timingSafeEqual } from 'node:crypto';
import path from 'node:path';

// Express: app.post('/webhooks/x', express.raw({ type: 'application/json', limit: '1mb' }), handler)
export function verifyWebhook(rawBody, signatureHex, secret) {
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const got = Buffer.from(signatureHex ?? '', 'hex');
  return got.length === expected.length && timingSafeEqual(got, expected);
}

const ROOT = path.resolve('uploads');
export function resolveInRoot(userPath) {
  if (userPath.includes('\0')) throw new Error('bad path');
  const full = path.resolve(ROOT, userPath);
  if (!full.startsWith(ROOT + path.sep)) throw new Error('path escapes root');
  return full;
}
```

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [OWASP Top 10:2025](https://top10.owasp.org/2025) / [API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) | OWASP | Категории Top 10:2025; риски API |
| [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html) | OWASP | Чеклист безопасности Node |
| [Prototype Pollution Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html) / [SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) | OWASP | Защита от prototype pollution и SSRF |
| [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) / [Mass Assignment](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html) | OWASP | CSRF и Fetch Metadata; mass assignment |
| [Permissions (Node.js docs)](https://nodejs.org/api/permissions.html) | Node.js project, v26.13 | Permission model и его ограничения |
| [Security best practices](https://nodejs.org/en/learn/getting-started/security-best-practices) / [SECURITY.md](https://github.com/nodejs/node/blob/main/SECURITY.md) / [vulnerability blog](https://nodejs.org/en/blog/vulnerability) | Node.js project | Модель угроз и практики; что считается уязвимостью; анонсы релизов безопасности |
| [Helmet](https://helmetjs.github.io/) / [Express behind proxies](https://expressjs.com/en/guide/behind-proxies.html) | Evan Hahn; Express TC | Заголовки безопасности; семантика `trust proxy` |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) / [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible) | express-rate-limit team; Roman Voloboev | Rate limit и проверка `trust proxy`; распределённый rate limit |
| [secure-json-parse](https://github.com/fastify/secure-json-parse) / [safe-regex2](https://github.com/fastify/safe-regex2) / [node-re2](https://github.com/uhop/node-re2) | Fastify team; Eugene Lazutkin | `JSON.parse` без prototype poisoning; обнаружение ReDoS; регулярки с линейным временем |
| [csrf-csrf](https://github.com/Psifi-Solutions/csrf-csrf) | Psifi Solutions | Double-submit CSRF |
| [Node.js Best Practices: security](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices) | Yoni Goldberg и др. | Раздел о безопасности |
| [Server-side prototype pollution](https://portswigger.net/web-security/prototype-pollution/server-side) / [Request smuggling](https://portswigger.net/web-security/request-smuggling) | PortSwigger | Техники атак |

## 10. Производительность HTTP и нагрузочное тестирование

### Ключевые выводы

**Факты с числами**
- Сайт Fastify (2026-11-01, «illustrative»): Fastify/Express = 1,32 (GET JSON), 1,56 (POST JSON echo); Hono — 0,95 от Fastify на GET.
- **Проверено локально на Node 24.17 (Windows 11)**: autocannon 8 как библиотека, 50 соединений, 3 с прогрева + 8 с замера, 3 чередующихся раунда, медиана; генератор нагрузки на той же машине; GET, возвращающий `{hello:'world'}`; у Fastify — схема ответа. Относительно Express 5.3.0 (= 1,00): **чистый `node:http` — 1,73, Fastify 5.12.8 — 1,61, Hono 4.13.16 + @hono/node-server — 1,48**. Порядок тот же, что на сайте Fastify; отставание Express здесь чуть больше. Абсолютные числа смысла не имеют: клиент и сервер делят один CPU.
- README undici (Node 24.14.1): для клиентской пропускной способности `undici.request` примерно в 3,1 раза быстрее `fetch` и в 1,8 раза быстрее `http` с keep-alive; `undici.dispatch` — примерно в 3,8 раза быстрее `fetch`.
- Самые большие выигрыши на сервере обычно не во фреймворке: keep-alive к upstream (undici `Agent`), пулы соединений, отсутствие N+1, кэш ответов, сжатие на прокси или CDN, размер payload (меньше колонок), неблокированный event loop.

**Симптом → техника**

| Симптом | Вероятная причина | Техника | Источник |
|---|---|---|---|
| CPU упирается при низких req/s, во flamegraph много `JSON.stringify` | универсальная сериализация больших объектов | меньшие payload, пагинация; на Node ≤ 24 — схема ответа Fastify (`fast-json-stringify`); на Node 26 `JSON.stringify` без `space` и replacer сам быстрее `fast-json-stringify` (~2,4 раза), схема там нужна ради контракта ответа | [fast-json-stringify](https://github.com/fastify/fast-json-stringify), [performance.md](performance.md#локальные-замеры) |
| Высокий p99 при низком CPU | исчерпан пул (БД или HTTP), нет таймаутов, не прочитаны тела `fetch` | размер пулов, `connectionTimeoutMillis`, чтение тел, `connections` у undici `Agent` | [undici](https://github.com/nodejs/undici), [node-postgres Pool](https://node-postgres.com/apis/pool) |
| Всплески задержки event loop | синхронные crypto/zlib/JSON на больших входах, backtracking регулярок, SSR-рендер | асинхронные API, worker threads (Piscina), стриминг, RE2 | [concurrency-async-native.md](concurrency-async-native.md) |
| Под нагрузкой пропускная способность падает, потом ошибки | нет backpressure и сброса нагрузки | `@fastify/under-pressure`, очередь + 202, rate limit | [under-pressure](https://github.com/fastify/under-pressure) |
| Редкие 502 за ALB или nginx | `keepAliveTimeout` в Node меньше idle timeout прокси | `keepAliveTimeout` 65 с, `headersTimeout` 66 с | [HTTP (Node.js docs)](https://nodejs.org/api/http.html) |
| Много коротких TLS-рукопожатий к upstream | нет keep-alive, новый клиент на запрос | глобальный undici `Agent`, переиспользование клиентов SDK | [undici docs](https://undici.nodejs.org/) |
| Память растёт с каждым запросом | неограниченные кэши, слушатели на каждый запрос, замыкания в глобальных Map | `lru-cache`, heap snapshots (см. [performance.md](performance.md)) | [lru-cache](https://github.com/isaacs/node-lru-cache) |
| Медленный холодный старт (serverless) | большой бандл, много модулей, инициализация ORM | бандл через esbuild/tsdown, `module.enableCompileCache()`, ленивые импорты | [Module compile cache](https://nodejs.org/api/module.html#module-compile-cache) |
| Сжатие съедает CPU | gzip/brotli в Node на высоких уровнях | сжимать на прокси или CDN, либо `@fastify/compress` с порогами и меньшим уровнем | [fastify-compress](https://github.com/fastify/fastify-compress) |

**Инструменты**
- **autocannon** 8.0.0 (npm, Node; Matteo Collina): HTTP/1.1, pipelining (`-p`), worker threads (`-w`), ограничение частоты (`-R`) с **коррекцией coordinated omission, когда частота задана** (`-C` её отключает — не отключайте), JSON-вывод (`-j`), работает как библиотека для скриптовых чередующихся сравнений. Последний релиз 2024-10 (по правилу 18 месяцев — затих, но работает).
- **oha** (Rust; `winget install hatoo.oha`, `brew install oha`, `cargo install oha`, Docker `ghcr.io/hatoo/oha`): `-z 30s` — длительность, `-c` — соединения, `-q` — общий QPS, **`--latency-correction`** (учитывает время в очереди; только вместе с `-q`), `--http2`, `--output-format json`, `--no-tui`.
- **k6** (Grafana, Go, сценарии на JS): **последняя — v2.x (2.3.0)**, 1.x ещё получает патчи (1.8.2). Исполнители сценариев (`constant-arrival-rate` для открытой модели, `ramping-vus`), пороги (`http_req_duration: ['p(99)<300']`) для падения CI, модуль browser. k6 — для реалистичных многошаговых сценариев и гейтов в CI; autocannon и oha — для быстрых цифр по одному эндпоинту.
- Другие: wrk/wrk2 (wrk2 исправляет coordinated omission), Vegeta (Go), Artillery (Node, сценарии на YAML), Gatling, Locust.

```bash
# быстрая проверка, закрытая модель (фиксированное число соединений)
npx autocannon -c 100 -d 30 -w 4 http://localhost:3000/api/items
# фиксированная частота с коррекцией задержки — для SLO по латентности
oha -z 30s -c 50 -q 2000 --latency-correction --no-tui http://localhost:3000/
npx autocannon -c 100 -d 30 -R 2000 -j http://localhost:3000/ > run1.json
k6 run load.js
```

```js
// load.js — k6: открытая модель с фиксированной частотой и порогами для CI
import http from 'k6/http';

export const options = {
  scenarios: {
    api: { executor: 'constant-arrival-rate', rate: 500, timeUnit: '1s', duration: '60s', preAllocatedVUs: 100, maxVUs: 500 },
  },
  thresholds: { http_req_duration: ['p(99)<300'], http_req_failed: ['rate<0.01'] },
};

export default function () {
  http.get('http://localhost:3000/api/items');
}
```

Чередующиеся прогоны двух вариантов через autocannon как библиотеку с выгрузкой в общий формат скрипта `../scripts/bench_compare.mjs` (`{ unit, benchmarks: [{ name, median, q1, q3 }] }`):

```js
import autocannon from 'autocannon';
import { mkdirSync, writeFileSync } from 'node:fs';

const targets = { A: 'http://10.0.0.5:3001/api/items', B: 'http://10.0.0.5:3002/api/items' };
const ROUNDS = 5;
for (let round = 1; round <= ROUNDS; round++) {
  const order = round % 2 ? ['A', 'B'] : ['B', 'A']; // A B B A A B ... — снимает эффект порядка
  for (const name of order) {
    const url = targets[name];
    await autocannon({ url, connections: 50, duration: 10 });                       // прогрев
    const r = await autocannon({ url, connections: 50, duration: 30, overallRate: 2000 }); // фиксированная частота
    if (r.errors || r.non2xx) console.warn(name, round, 'errors', r.errors, 'non2xx', r.non2xx);
    const { p25, p50, p75 } = r.latency; // миллисекунды
    mkdirSync(`bench/${name}`, { recursive: true });
    writeFileSync(`bench/${name}/run${round}.json`,
      JSON.stringify({ unit: 'ms', benchmarks: [{ name: 'GET /api/items', median: p50, q1: p25, q3: p75 }] }));
  }
}
// затем: node path/to/skill/scripts/bench_compare.mjs bench/A bench/B --threshold 5
```

Проверено локально на Node 24.17 с autocannon 8: схема работает; задержка у autocannon в целых миллисекундах, поэтому для эндпоинтов быстрее 1 мс сравнивайте req/s в закрытой модели или p99.

**Методика**
- Генератор нагрузки — на **другой машине** (или хотя бы на других ядрах). Цифры с одного хоста — только отношения.
- **Открытая и закрытая модель**: инструменты с замкнутым циклом и фиксированным числом соединений (`autocannon -c`) занижают задержку, когда сервер замедляется (coordinated omission). Для SLO по задержке используйте фиксированную частоту прихода запросов: `k6 constant-arrival-rate`, `oha -q --latency-correction`, `autocannon -R`.
- Прогревайте (JIT, пулы, кэши) до замера; замер — от 30–60 с; повторяйте и **чередуйте варианты**; сообщайте p50, p90, p99, max и долю ошибок, а не только req/s. Методика бенчмарков — в [performance.md](performance.md).
- Как в продакшене: `NODE_ENV=production`, продакшен-уровень логов, TLS, если он есть в проде, реалистичные payload и объём данных в БД.
- Во время теста следите за сервером: ELU, задержка event loop, CPU, куча, GC, время ожидания пула БД; профилируйте под нагрузкой через `--cpu-prof` или flamegraph (инструменты — в [performance.md](performance.md)).
- Ищите «колено»: поднимайте частоту, пока p99 или ошибки не нарушат SLO; ёмкость — частота на колене минус запас.

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Fastify Benchmarks](https://fastify.dev/benchmarks/) | Fastify team, 2026-11 | Порядок фреймворков по req/s |
| [autocannon](https://github.com/mcollina/autocannon) / [oha](https://github.com/hatoo/oha) | Matteo Collina; hatoo | Флаги, коррекция coordinated omission, API библиотеки; `--latency-correction` |
| [k6 releases](https://github.com/grafana/k6/releases) | Grafana Labs, 2026 | Релизы k6 2.x и 1.x |
| [k6 executors](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/) / [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) | Grafana Labs | Arrival-rate против VU-исполнителей; пороги для CI [не проверено] |
| [wrk2](https://github.com/giltene/wrk2) | Gil Tene | Нагрузка с постоянной частотой, coordinated omission |
| [Node.js: profiling](https://nodejs.org/en/learn/getting-started/profiling) / [Platformatic blog](https://blog.platformatic.dev/) | Node.js project; Platformatic (Matteo Collina и др.) | Профилирование сервера под нагрузкой; статьи о производительности Node-серверов |

## 11. Деплой и graceful shutdown

### Ключевые выводы

**Docker-образы**
- База: `node:26-slim` / `node:24-slim` (Debian, glibc) — для большинства приложений. `node:*-alpine` меньше, но на musl: нативным расширениям нужны prebuilds под musl, бывают особенности DNS и скорости. **Distroless** `gcr.io/distroless/nodejs24-debian13` (также `nodejs22-debian13`, `nodejs20-debian13`; теги `:nonroot` и `:debug`; образы на Debian 13 — GA с 2025-12, образы на Debian 12 идут к выводу из поддержки) — без shell и пакетного менеджера [не проверено]. Образы Chainguard/Wolfi — для базы с минимумом CVE.
- Multi-stage сборка: в стадии сборки — `npm ci --omit=dev` или `npm prune --omit=dev` после сборки (или `pnpm deploy --prod`); в рантайм-стадию копируйте только `node_modules`, собранный код и `package.json`; `USER node` (или distroless `nonroot`); `NODE_ENV=production`; `.dockerignore` исключает `.git`, `.env`, тесты.
- **Сигналы**: exec-форма `CMD ["node", "dist/server.js"]`. Не запускайте через `npm start`: npm ненадёжно пробрасывает SIGTERM, добавляет процесс и время старта. Node в роли PID 1 не собирает зомби-процессы; если порождаете дочерние процессы — `docker run --init` или `tini`. Обработчики по умолчанию в Node завершают процесс по SIGTERM, но дождаться соединений может только ваш обработчик.
- Память: задайте `--max-old-space-size` (или через `NODE_OPTIONS`) немного ниже лимита контейнера (например, 75–80%), чтобы V8 собрал мусор раньше, чем сработает OOM killer; нативная память (Buffer, расширения) лежит вне кучи. Свежие версии Node определяют размер кучи по лимиту cgroup [не проверено] — проверьте `v8.getHeapStatistics().heap_size_limit` внутри контейнера.
- **Compile cache** (`module.enableCompileCache()` / `NODE_COMPILE_CACHE`) сокращает холодный старт; для serverless и контейнеров, которые масштабируются с нуля, запекайте кэш в образ (подробно — в [performance.md](performance.md)). Single Executable Applications — в [domains-client.md](domains-client.md).

```dockerfile
FROM node:26-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev   # в образ уйдут только prod-зависимости

FROM node:26-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
# лимит контейнера 512 MiB → куча около 75%
CMD ["node", "--max-old-space-size=384", "dist/server.js"]
```

**Управление процессами**
- В контейнерах и Kubernetes — **один процесс Node на контейнер**, масштабирование репликами, падения перезапускает оркестратор. `cluster` или cluster mode PM2 внутри контейнера дублирует оркестратор и прячет от него падения (см. [concurrency-async-native.md](concurrency-async-native.md)).
- **PM2 7** (7.1.2, 2026-11) остаётся инструментом для VM и bare metal без оркестратора: v7 встроил свои RPC- и agent-зависимости (меньше поверхность атаки на цепочку поставок), добавил поддержку Bun и трейсинг OpenTelemetry, исправил CVE-2025-5891 (ReDoS) и CVE-2026-27699, заменил `exec()` на `execFile()` [не проверено]. Минимальная версия Node расходится: в release notes — 18, в документации — 20; в engines npm — ≥18. Юниты systemd — равноценная альтернатива без зависимостей.

**Graceful shutdown в Kubernetes**
1. На SIGTERM переключите readiness в «не готов» (`/readyz` отвечает 503), чтобы Service перестал слать трафик.
2. Подождите несколько секунд: обновление endpoints асинхронное (или хук `preStop` со `sleep 5-10`).
3. `server.close()` (перестаёт принимать, с Node 19 закрывает простаивающие keep-alive сокеты); клиентам с keep-alive отдавайте `Connection: close` в текущих ответах. Fastify `app.close()` ставит `Connection: close` (и отвечает 503) только запросам, пришедшим уже во время остановки; ответ запроса, который был в полёте, уходит с keep-alive, сокет остаётся открытым до `keepAliveTimeout`, и `app.close()` ждёт его (проверено локально на Fastify 5.12.8, Node 24.17 и 26.13) — добивайте такие сокеты `server.closeIdleConnections()`, как в коде ниже. NestJS `enableShutdownHooks()`: адаптер Express в v12 дожидается in-flight запросов.
4. Остановите воркеры очередей, сбросьте логи и трейсы (`sdk.shutdown()`), закройте пулы БД и Redis.
5. Принудительный выход по дедлайну, который меньше `terminationGracePeriodSeconds` (по умолчанию 30 с); `server.closeAllConnections()` — для отстающих.

- Библиотеки: `close-with-grace` (Matteo Collina; сигналы плюс `uncaughtException`/`unhandledRejection` с задержкой), `@godaddy/terminus`, `http-terminator`. Архитектура — в [architecture.md](architecture.md).
- Пробы: liveness — дешёвая и без зависимостей; readiness проверяет критичные зависимости; startup probe — для медленного старта. Один эндпоинт на обе роли не используйте.

```js
let shuttingDown = false;
app.get('/livez', async () => ({ ok: true }));
app.get('/readyz', async (req, reply) => (shuttingDown ? reply.code(503).send({ ok: false }) : { ok: true }));

process.once('SIGTERM', async () => {
  shuttingDown = true;                                              // 1. readiness → 503
  const force = setTimeout(() => process.exit(1), 25_000).unref();  // 5. дедлайн < 30 с grace period
  await new Promise((resolve) => setTimeout(resolve, 5_000));       // 2. ждём обновления endpoints
  setInterval(() => app.server.closeIdleConnections(), 250).unref(); //    keep-alive сокеты после ответов
  await app.close();                                                // 3. дождаться in-flight запросов
  await worker.close();                                             // 4. воркеры очередей
  await sdk.shutdown();                                             //    телеметрия
  await pool.end();                                                 //    пулы БД
  clearTimeout(force);
  process.exit(0);
});
```

**Serverless и edge**
- **AWS Lambda**: `nodejs24.x` — GA с 2025-11-25, **убраны обработчики в стиле колбэков** (`Runtime.CallbackHandlerDeprecated`; используйте `async`-обработчики) [не проверено]. **`nodejs26.x` — public preview с 2026-08**; AWS выпускает рантайм только после перехода версии в Active LTS (Node 26 — 2026-10-28); preview-рантаймы вне SLA и не для продакшена. На 2026-11-06 страница Lambda runtimes всё ещё помечает Node.js 26 как public preview, целевой месяц GA — ноябрь 2026. Вывод `nodejs22.x` из поддержки — 2027-04-30 (блокировка создания — 2027-07-29, обновления — 2027-08-31), `nodejs24.x` — 2028-04-30 (та же страница AWS).
  - SDK-клиенты и соединения с БД создавайте вне обработчика и переиспользуйте между вызовами; RDS Proxy или HTTP-драйверы БД; бандл через esbuild/tsdown; помните о стоимости `--enable-source-maps`; включайте SnapStart, где он есть.
- **Cloudflare Workers**: V8 isolates, а не Node; флаг `nodejs_compat` даёт большую часть Node API (`node:buffer`, `node:crypto`, `AsyncLocalStorage`, частично сокеты `node:net`) [не проверено]. Естественный выбор — Hono, h3, itty; Express не работает. Для БД — Hyperdrive или HTTP-драйверы.
- **Vercel**: Node.js Functions с Fluid compute (конкурентность внутри функции, поэтому состояние на уровне модуля общее для запросов — остерегайтесь глобального изменяемого состояния); Node 26 стал доступен и выбран по умолчанию примерно к дате LTS (сторонний источник) [не проверено]. Edge Functions — Web-стандартные isolates.
- **Containers-as-a-service** (Cloud Run, Fly.io, Railway, Render, App Runner, Azure Container Apps) дают долгоживущие процессы Node с масштабированием до нуля — обычно самая простая продакшен-цель для Fastify, Express, Nest.
- Правило переносимости: если код может работать на Workers или edge, опирайтесь на Web API (`fetch`, `Request`, `crypto.subtle`, `ReadableStream`) и Hono/h3; модули только для Node (`fs`, `net`, нативные расширения) прячьте за адаптерами (совместимость рантаймов — в [domains-client.md](domains-client.md)).

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [docker-node Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md) / [node (Docker Hub)](https://hub.docker.com/_/node) | Node.js Docker team; Docker | Сигналы, пользователь, env; теги образов (slim, alpine) |
| [distroless](https://github.com/GoogleContainerTools/distroless) / [SUPPORT_POLICY](https://www.github.com/GoogleContainerTools/distroless/blob/main/SUPPORT_POLICY.md) | Google | Distroless-образы Node и теги; поддержка образов на Debian 12/13 |
| [10 best practices to containerize Node.js](https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/) | Liran Tal, Snyk | Контейнеризация Node-приложений |
| [PM2 v7.0.0](https://github.com/Unitech/pm2/releases/tag/v7.0.0) / [PM2: what's new](https://pm2.keymetrics.io/docs/usage/whats-new/) | PM2 team, 2026 | Изменения PM2 7 и исправленные CVE |
| [close-with-grace](https://github.com/mcollina/close-with-grace) / [terminus](https://github.com/godaddy/terminus) | Matteo Collina; GoDaddy | Помощники graceful shutdown и health checks |
| [Pod termination](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) / [Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) | Kubernetes | Последовательность остановки и grace period; liveness, readiness, startup |
| [Graceful shutdown in Kubernetes](https://learnk8s.io/graceful-shutdown) | Daniele Polencic, learnk8s | Зачем нужна задержка в preStop |
| [Public preview runtimes on AWS Lambda](https://aws.amazon.com/blogs/compute/introducing-public-preview-runtimes-on-aws-lambda-starting-with-node-js-26-and-python-3-15/) / [announcement](https://aws.amazon.com/about-aws/whats-new/2026/08/aws-lambda-node-js-python-public-preview/) | AWS, 2026-08 | Политика preview-рантайма Node 26 |
| [AWS Lambda Node.js 24](https://dev.classmethod.jp/en/articles/aws-lambda-node-js-24/) / [Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) | Classmethod, 2025; AWS | `nodejs24.x` без обработчиков на колбэках; график вывода рантаймов |
| [Cloudflare Workers: Node.js APIs](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) / [Vercel Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js) | Cloudflare; Vercel | Покрытие `nodejs_compat`; Fluid compute |
| [Module compile cache](https://nodejs.org/api/module.html#module-compile-cache) | Node.js project | Compile cache для холодного старта |

## 12. SSR и fullstack-фреймворки как Node-серверы

### Ключевые выводы

- Версии на 2026-11-06 (по npm): **Next.js 16.4.5** (Node ≥20.9), **Nuxt 4.6.4** (Node ^22.22.3/^24.15/≥26, Nitro + h3 v2), **React Router 8.5.1** (линия Remix; `@remix-run/*` 2.x — legacy), **Astro 7.4.7** (Node ≥22.23.4), **SvelteKit 3.1.1** (Node ≥22.17), **TanStack Start 1.169**. Перед апгрейдом читайте release notes каждого мажора; UI-API здесь не рассматриваются.
- Серверные вопросы, общие для всех:
  - **Это Node-серверы**: те же правила таймаутов, graceful shutdown, лимитов памяти, логирования и OTel (в Next.js — `instrumentation.ts` с `register()`; в Nuxt/Nitro — OTel-модули).
  - **Server Actions и server functions — публичные HTTP-эндпоинты**: валидируйте ввод и проверяйте авторизацию внутри каждого action, не полагайтесь на то, что UI прячет кнопку. CVE-2025-29927 (обход auth в middleware Next.js через заголовок `x-middleware-subrequest`) показал, что авторизация только в middleware хрупка [не проверено]; перепроверяйте её в слое данных.
  - **Утечка секретов**: в клиент должны попадать только переменные с публичным префиксом (`NEXT_PUBLIC_`, `NUXT_PUBLIC_`, `PUBLIC_`, `VITE_`); импорт `server-only` (Next) роняет сборку, если серверный модуль попал в клиентский бандл.
  - **Семантика кэша** различается между фреймворками и менялась между мажорами (Next 15/16 сделали кэш `fetch` явным opt-in и ввели Cache Components / `use cache`) [не проверено]. Устаревшие или чужие данные в кэше — уязвимость, если ответ зависит от пользователя.
  - **CPU на SSR блокирует event loop**: `renderToPipeableStream` и стриминг улучшают TTFB, но рендер всё равно занимает главный поток. Масштабируйтесь горизонтально, кэшируйте отрендеренные страницы, измеряйте ELU.
  - **Self-hosting**: Next.js `output: 'standalone'` для Docker; пресеты Nitro (`node-server`, `cloudflare`, `vercel`) для Nuxt, TanStack Start, SolidStart; адаптеры Astro и SvelteKit (`@astrojs/node`, `@sveltejs/adapter-node`).
- Если отдельный API всё равно нужен (мобильные клиенты, третьи стороны), держите API на Fastify, Hono или Nest, а fullstack-фреймворк пусть будет BFF.

### Ресурсы

| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting) / [data security](https://nextjs.org/docs/app/guides/data-security) | Vercel | Self-hosting Next на Node; безопасность server actions, слой доступа к данным |
| [CVE-2025-29927](https://nextjs.org/blog/cve-2025-29927) / [Next.js OpenTelemetry](https://nextjs.org/docs/app/guides/open-telemetry) | Vercel, 2025 | Разбор обхода middleware; OTel в Next |
| [Nuxt deployment](https://nuxt.com/docs/getting-started/deployment) / [Nitro](https://nitro.build/) | Nuxt team; UnJS | Пресеты Nitro; серверный движок |
| [React Router](https://reactrouter.com/) / [TanStack Start](https://tanstack.com/start/latest) | Remix/Shopify; Tanner Linsley и др. | Framework mode React Router; TanStack Start |
| [Astro Node adapter](https://docs.astro.build/en/guides/integrations-guide/node/) / [SvelteKit adapter-node](https://svelte.dev/docs/kit/adapter-node) | Astro; Svelte team | Node-адаптеры, env, остановка |

## Чеклист ревью серверного кода

Конкретные проверяемые пункты. В ревью отмечайте каждый как PASS, FAIL или N/A.

**Рантайм и зависимости**
- [ ] Поддерживаемая линия Node (26 LTS, 24 или 22; не 20 — EOL 2026-04-30); `engines` и базовый Docker-образ совпадают.
- [ ] Нет deprecated и затихших серверных зависимостей из таблицы версий (`kafkajs`, `telegraf`, `nats`, `prom-client`, `lucia`, `csurf`, `@opentelemetry/instrumentation-fastify`, `sequelize-typescript`, `bull`); замена запланирована.
- [ ] Встроенные API вместо зависимостей, где подходят (`fetch`/undici, `crypto.argon2`, `crypto.randomUUID`, `node:sqlite` для локального SQLite, `AbortSignal.timeout`).
- [ ] CLI `prisma` закреплён на нужном мажоре (на ноябрь 2026 `latest` в npm — 8.0 RC).

**Ввод, вывод, ошибки**
- [ ] Каждый маршрут валидирует тело, query, params и заголовки схемой; неизвестные ключи отклоняются или вырезаются.
- [ ] Ответы проходят через схему ответа или явный маппинг в DTO (никаких сырых сущностей ORM и утечек `password_hash`).
- [ ] Заданы лимиты тела (Fastify `bodyLimit`, Express `express.json({ limit })`); лимиты загрузок для multipart (`limits` у `@fastify/multipart`, busboy).
- [ ] Один центральный обработчик ошибок: логирует объект `err` и ID запроса, отдаёт общий 5xx, переводит известные доменные ошибки в 4xx; стектрейсы клиентам не уходят.
- [ ] Асинхронные ошибки доходят до обработчика (Express 5 или Fastify; нет fire-and-forget промисов без `.catch`).
- [ ] `unhandledRejection`/`uncaughtException` ведут к логу и корректному выходу, а не к молчаливому продолжению.

**Безопасность (OWASP 2025)**
- [ ] Авторизация на уровне объекта проверяется в слое доступа к данным на каждое чтение и запись (BOLA).
- [ ] SQL и NoSQL — только параметризованные запросы или tagged templates; нет `$queryRawUnsafe` и склейки строк; фильтры Mongo не получают объекты из пользовательского ввода.
- [ ] Нет `eval`, `new Function`, `vm` на вводе; `child_process` — только `execFile`/`spawn` с массивом аргументов.
- [ ] Пути файлов от пользователя разрешаются и ограничиваются корнем; `\0` отклоняется.
- [ ] Исходящие запросы по URL от пользователя идут через SSRF-фильтр (приватные и metadata-адреса блокируются в момент подключения).
- [ ] Словари создаются через `Object.create(null)`/`Map`; нет deep merge недоверенного ввода в существующие объекты.
- [ ] Регулярки на пользовательском вводе проверены на ReDoS (safe-regex2) или выполняются на RE2.
- [ ] Включён `helmet`/`@fastify/helmet`; allowlist CORS явный; `trust proxy` равен реальному числу хопов.
- [ ] Rate limit на входе, регистрации, сбросе пароля, OTP и дорогих эндпоинтах, с общим хранилищем при нескольких инстансах.
- [ ] Пароли хешируются Argon2id (параметры OWASP) асинхронным API; секреты сравниваются через `timingSafeEqual`.
- [ ] Проверка JWT закрепляет `algorithms`, проверяет `iss`/`aud`/`exp`; сессии в cookie `HttpOnly; Secure; SameSite` и ротируются при входе.
- [ ] Вебхуки проверяются HMAC по сырому телу; есть защита от повтора (допуск по timestamp, ключ идемпотентности).
- [ ] Нет секретов в коде, логах и сообщениях об ошибках; redaction в логгере настроен.

**Производительность и устойчивость**
- [ ] Нет синхронной CPU-тяжёлой работы и `*Sync` API в путях запроса (crypto, zlib, большой `JSON.parse`, синхронная ФС).
- [ ] У каждого исходящего вызова есть таймаут (`AbortSignal.timeout`, undici `headersTimeout`/`bodyTimeout`) и ограниченные ретраи с backoff и jitter — только для идемпотентных операций.
- [ ] Тела ответов исходящих `fetch` всегда читаются или отменяются.
- [ ] Размер пула БД рассчитан (реплики × процессы × max < лимит БД); `connectionTimeoutMillis` задан; транзакции идут через один клиент.
- [ ] Нет N+1 (проверено по числу запросов в тестах или трейсах); списки пагинированы с максимальным размером страницы.
- [ ] Кэши ограничены (`lru-cache` с max/TTL), ключи включают tenant или пользователя, если ответы различаются.
- [ ] `keepAliveTimeout` больше idle timeout балансировщика; `headersTimeout` больше `keepAliveTimeout`.
- [ ] Есть сброс нагрузки (`@fastify/under-pressure` или проверка ELU и задержки event loop).
- [ ] Для критичных эндпоинтов есть нагрузочный тест (autocannon, oha или k6) с записанным baseline и целью по p99.

**Задачи и сообщения**
- [ ] Медленная и повторяемая работа ставится в очередь, а не выполняется inline; постановка транзакционная (outbox или очередь на Postgres), либо потеря допустима.
- [ ] Обработчики задач идемпотентны; ретраи с backoff; dead-letter очередь под мониторингом.
- [ ] Задачи по расписанию выполняются один раз на кластер (планировщик очереди, CronJob или блокировка), а не на каждой реплике.

**Наблюдаемость и эксплуатация**
- [ ] Структурные JSON-логи (pino) с ID запроса и трейса; нет `console.log` в горячих путях.
- [ ] OpenTelemetry инициализируется до импортов приложения (`--import`), OTLP идёт в коллектор; RED-метрики с шаблонами маршрутов (без меток высокой кардинальности).
- [ ] Liveness и readiness разделены; readiness проваливается во время остановки.
- [ ] Graceful shutdown: SIGTERM → не готов → дождаться HTTP → остановить воркеры → сбросить телеметрию → закрыть пулы → выход до конца grace period.
- [ ] Контейнер: не root, exec-форма `CMD ["node", ...]`, `NODE_ENV=production`, `--max-old-space-size` согласован с лимитом памяти, `npm ci --omit=dev`, нет dev-зависимостей и `.env` в образе.
- [ ] Миграции запускаются отдельным шагом и обратно совместимы с текущей задеплоенной версией (expand/contract).

## Антипаттерны

- **Привычки Express 4 на Express 5**: `express-async-errors`, строки маршрутов с regex, изменение `req.query`. `[устарело]` с Express 5 (`latest` с 2025-03) → встроенная обработка async-ошибок и синтаксис `path-to-regexp` 8.
- **Неверная настройка `body-parser`**: до body-parser 2.3 невалидный `limit` молча отключал проверку размера (CVE-2026-12590); теперь бросает ошибку при настройке.
- **Работа после `res.send()`** без отслеживания: ошибки уходят в никуда, остановка обрывает её на полпути. Используйте очередь.
- **Один гигантский `try/catch`, возвращающий 200 с `{ error }`**: ломает клиентов, кэши и мониторинг.
- **Обработчик `uncaughtException`, который продолжает обслуживать** запросы в неизвестном состоянии.
- **`new Pool()`, новый клиент Prisma или новое соединение Redis на каждый запрос**: шторм соединений. Создавайте один раз при старте.
- **`pool.query('BEGIN')` ... `pool.query('COMMIT')`**: выражения выполняются на разных соединениях.
- **`fetch` без таймаута и без чтения тела**: исчерпание пула и зависшие запросы.
- **Неограниченные кэши и Map с ключами из пользовательского ввода**: утечка памяти и DoS.
- **Cron внутри процесса в горизонтально масштабируемом сервисе**: срабатывает N раз.
- **`cluster` или cluster mode PM2 внутри подов Kubernetes**: двойная оркестрация, падения скрыты.
- **`npm start` как entrypoint контейнера**: проблемы с сигналами и лишний процесс.
- **Liveness probe, проверяющая базу данных**: шторм перезапусков во время инцидентов с БД.
- **Логирование полных тел и заголовков запросов**: утечка токенов и персональных данных.
- **`decode()` из `jsonwebtoken` вместо `verify()`**, или проверка без закреплённых алгоритмов.
- **`Math.random()` для токенов и ID**; MD5, SHA-1 или bcrypt без учёта лимита для паролей.
- **`node:vm` или permission model как средство запуска недоверенного кода**.
- **GraphQL без лимитов глубины и сложности и без DataLoader**.
- **Устаревшее в новом коде**: `subscriptions-transport-ws` `[устарело]` → `graphql-ws`; KafkaJS `[устарело]` → `@confluentinc/kafka-javascript` или `@platformatic/kafka`; Telegraf `[устарело]` → grammY; `prom-client` `[устарело]` → `@prometheus-io/client`; `csurf` `[устарело]` → `csrf-csrf`, CSRF фреймворка, Fetch Metadata; библиотека Lucia `[устарело]` → Better Auth или гайды Lucia; `repeat`-задачи BullMQ `[устарело]` в v6 → Job Schedulers; OTel `sdk-trace-node`/`sdk-trace-base` `[устарело]` в SDK 3 → `@opentelemetry/sdk-trace`; Jaeger exporter `[устарело]` → OTLP.

## Спорные места

- **Fastify или Express в 2026.** Express 5 сократил отставание (1,3–1,6 раза на микробенчмарках сайта Fastify); многие считают, что выбор фреймворка почти ничего не значит на фоне БД и I/O. Контраргумент (Collina и др.): сериализация по схемам, инкапсуляция и меньший хвост задержек Fastify окупаются на масштабе. Прагматичное правило: новые JSON API — Fastify или Hono; существующие Express-приложения — обновить до 5, а не переписывать ради скорости.
- **Hono на Node.** Отличная переносимость, но на Node платит за конвертацию в `Request`/`Response`. @hono/node-server v2 снизил накладные расходы; на сайте Fastify Hono даёт около 95% от Fastify на GET. Выбирайте его ради нескольких рантаймов, а не ради сырой скорости на Node.
- **NestJS.** Хвалят за структуру в больших командах; критикуют за косвенность на декораторах, медленный старт и трение в тестах. ESM и Standard Schema в v12 снимают часть трения.
- **ORM или query builder.** Лагерь Prisma/TypeORM ценит продуктивность, лагерь Drizzle/Kysely — прозрачность SQL и меньше сюрпризов. Перемены у Prisma в 2025–2026 (v7 без Rust, CLI 8 RC на `latest`, переписывание Prisma Next) — реальная стоимость сопровождения. Консенсуса нет: один инструмент на сервис и обязательное обнаружение N+1.
- **JWT для браузерных сессий.** Широко используется, но OWASP и многие практики безопасности предпочитают серверные сессии для своих веб-приложений (отзыв, меньший радиус поражения). Stateless JWT остаётся стандартом для service-to-service и API третьих сторон.
- **Очередь на Postgres (pg-boss, graphile-worker) или Redis (BullMQ).** Очереди на Postgres дают транзакционную постановку и на одну систему меньше, но нагружают БД (vacuum, оборот строк); BullMQ масштабируется до гораздо большей частоты задач. Выбирайте по нагрузке и требованиям к согласованности.
- **PM2 в 2026.** По-прежнему широко используется на VM, а PM2 7 укрепил цепочку поставок; в контейнерах он избыточен. Некоторые советуют systemd.
- **Микробенчмарки.** Таблица сайта Fastify помечена как «illustrative» и не указывает машину и версию Node; считайте req/s фреймворков только относительным порядком и всегда нагружайте свои эндпоинты.
- **`node:sqlite` или better-sqlite3.** Встроенный модуль теперь release candidate и убирает нативную зависимость, но у better-sqlite3 больше возможностей и истории; переименование класса (`DatabaseSync` → `Database`) в Node 26 показывает, что API ещё устаканивается.
- **Неясные факты.** Дата GA Drizzle 1.0: `latest` в npm всё ещё 0.45.4, сторонние источники расходятся. Бэкенд PostgreSQL в BullMQ 6 виден только в навигации документации и во вторичной статье. Детали AdonisJS 7, Koa 3, h3 v2 и Elysia взяты из вторичных источников.
