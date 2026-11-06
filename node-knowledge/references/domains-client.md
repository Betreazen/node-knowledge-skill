# Клиентские и прочие области Node.js

Справочник по областям применения Node.js за пределами HTTP-сервера: CLI и TUI (с локально измеренной стоимостью старта), публикация npm-библиотек, скрипты и автоматизация, десктоп (Electron, Tauri и альтернативы), сборщики как Node-приложения, скрапинг и автоматизация браузера, ИИ- и LLM-приложения, IoT и embedded, совместимость между рантаймами (Node, Bun, Deno, Cloudflare Workers). Актуально на ноябрь 2026: Node 26 — Active LTS с 28 октября 2026 (26.13.0), Node 24 — Maintenance LTS с 20 октября 2026 (24.22.2), Node 22 — Maintenance LTS до 30 апреля 2027, Node 20 — EOL с 30 апреля 2026. Ключевые версии темы: commander 15.0.0, tsdown 0.23.7, Vite 8.3.6 (Rolldown), Electron 45.2.3, Playwright 1.65.0, AI SDK 7 (`ai` 7.0.163), MCP TypeScript SDK v2, Bun 1.4.4, Deno 2.9. Версии пакетов взяты из npm на 6 ноября 2026. «Проверено локально» означает Node 24.17 и Deno 2.8.3 на Windows 11; приводятся отношения, абсолютные миллисекунды зависят от машины. Пометки: `[устарело]` — рядом названа замена; `[не проверено]` — факт из одного вторичного источника. Серверные фреймворки, базы данных и деплой — в [domains-server.md](domains-server.md); менеджеры пакетов, запуск TypeScript и цепочка поставок — в [toolchain.md](toolchain.md); tsconfig и декларации типов — в [typescript.md](typescript.md); профилирование старта и V8 — в [performance.md](performance.md); тесты CLI и E2E — в [testing.md](testing.md); монорепозитории — в [architecture.md](architecture.md).

- [Как выбрать](#как-выбрать)
- [Версии на ноябрь 2026](#версии-на-ноябрь-2026)
- [1. CLI и TUI](#1-cli-и-tui)
- [2. Публикация npm-библиотек](#2-публикация-npm-библиотек)
- [3. Скрипты и автоматизация](#3-скрипты-и-автоматизация)
- [4. Десктоп: Electron, Tauri и альтернативы](#4-десктоп-electron-tauri-и-альтернативы)
- [5. Сборщики и инструменты сборки](#5-сборщики-и-инструменты-сборки)
- [6. Скрапинг и автоматизация браузера](#6-скрапинг-и-автоматизация-браузера)
- [7. ИИ и LLM-приложения](#7-ии-и-llm-приложения)
- [8. IoT, железо и embedded](#8-iot-железо-и-embedded)
- [9. Кросс-рантайм: Bun, Deno, Cloudflare Workers](#9-кросс-рантайм-bun-deno-cloudflare-workers)
- [10. Симптомы и техники](#10-симптомы-и-техники)
- [11. Чеклисты ревью](#11-чеклисты-ревью)
- [12. Антипаттерны](#12-антипаттерны)
- [13. Спорные места](#13-спорные-места)

---

## Как выбрать

| Задача | Рекомендуемый стек | Оговорка |
|---|---|---|
| Маленькая утилита без зависимостей | `util.parseArgs` + `util.styleText` + `node:readline/promises` | Нет генерации справки и подкоманд |
| CLI с подкомандами | commander 15 (+ `@commander-js/extra-typings`) | ESM-only, нужен Node >=22.12.0 |
| Очень большой CLI с плагинами | oclif 5 | Stricli — типизированная альтернатива |
| Скаффолдер `create-*` | @clack/prompts 1.x + giget | Проверяйте `isCancel()` на каждом ответе |
| Интерактивный TUI | Ink 8 (React в терминале) | Node 22+, React 19.3+ |
| Распространение CLI | npm `bin` + один бандл | `node --build-sea` только с Node 25.5 |
| Библиотека на npm | ESM-only, tsdown, publint + attw, trusted publishing | Dual — только для CJS-потребителей TypeScript на `node16`/`node10` |
| Скрипт вместо shell | встроенные `node:` API + tinyexec или execa 10 | zx без релизов с 2025-10 |
| Десктоп | Electron 45 + Electron Forge 8 | Tauri 2 + Node sidecar, когда важны размер и память |
| Фронтенд-сборка | Vite 8 (Rolldown) | Для миграции с webpack — Rspack 2 |
| Бандл CLI или скрипта | esbuild, Rolldown или tsdown с `platform: 'node'` | esbuild всё ещё 0.x |
| Скрапинг | `fetch` + cheerio; браузер — Playwright 1.65 или Crawlee | HTTP без браузера в 10–100 раз дешевле `[не проверено]` |
| LLM-приложение | AI SDK 7 или SDK вендора; MCP — `@modelcontextprotocol/server` v2 | AI SDK 7 — ESM-only, Node >=22 |
| IoT | serialport 13, mqtt 5, Node-RED 5 на одноплатнике | Микроконтроллеры — Moddable/XS, Espruino, Kaluma |
| Библиотека для всех рантаймов | API из WinterTC, conditional exports, CI на каждой цели | Deno — только исправления до ~2027-10 |

## Версии на ноябрь 2026

Линии Node (контекст для `engines`):

| Линия | Последняя | Дата | Статус |
|---|---|---|---|
| 27 | 27.0.0-alpha.0 | 2026-10-29 | Первый релиз в alpha-канале; стабильная — 2027-04-22 по schedule.json |
| 26 «Lithium» | 26.13.0 | 2026-10-28 | Active LTS с 2026-10-28, EOL 2029-04-30 |
| 24 «Krypton» | 24.22.2 | 2026-10-27 | Maintenance LTS с 2026-10-20, EOL 2028-04-30 |
| 22 «Jod» | 22.23.4 | 2026-10-20 | Maintenance LTS, EOL 2027-04-30 |
| 25 | 25.9.0 | 2026-03-31 | EOL 2026-06-01 |
| 20 «Iron» | 20.20.2 | 2026-03-24 | EOL 2026-04-30 |

Следствие: во всех поддерживаемых линиях (22.12+, 24, 26) `require(esm)` работает без флага. Каденс релизов Node — в [toolchain.md](toolchain.md). Свежие данные: линии Node — [dist/index.json](https://nodejs.org/dist/index.json) и [schedule.json](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json); пакет — `https://registry.npmjs.org/<pkg>` (`dist-tags.latest`, `time[<version>]`, `type`, `engines`, `exports`) или `npm view <pkg> version engines type`.

| Область | Пакеты, последняя версия (дата) | Примечание |
|---|---|---|
| Парсеры аргументов | commander 15.0.0 (2026-05-29), yargs 18.2.0 (2026-09-20), citty 0.2.2 (2026-04-01), cac 7.1.0 (2026-10-11), @oclif/core 5.1.11 (2026-11-01) | Все ESM-only, кроме oclif; commander 15 требует node >=22.12.0, 14.x поддерживается до 2027-05; yargs — `^20.19 \|\| ^22.12 \|\| >=23`; oclif — node >=22 |
| Промпты и TUI | @clack/prompts 1.8.1 (2026-09-13), @inquirer/prompts 8.7.5 (2026-10-27), ink 8.0.0 (2026-10-03) | Clack вышел из alpha в 2026, node >=20.12; Ink — node >=22 |
| Цвета | chalk 6.0.1 (2026-09-27), picocolors 1.1.1 (2024-10-16), ansis 4.5.0 (2026-11-01) | chalk ESM-only, node >=22; picocolors стабилен и не меняется |
| Сборка библиотек | tsdown 0.23.7 (2026-11-06), tsup 9.0.0 (2026-10-14), unbuild 3.6.1 (2025-08-15) | tsdown на Rolldown, ещё 0.x, node `^22.18 \|\| ^24.11 \|\| >=26`; README tsup: «не поддерживается активно, используйте tsdown»; unbuild молчит 14 месяцев |
| Проверка пакета | publint 0.3.25 (2026-10-01), @arethetypeswrong/cli 0.18.5 (2026-07-09) | |
| Версии и релизы | @changesets/cli 3.0.3 (2026-09-14) | Мажор v3 в 2026; node `^22.11 \|\| ^24 \|\| >=26` |
| TypeScript | typescript 7.0.2 (2026-07-08) | TS 7 — `latest`, `next` = 7.1.0-dev; см. [typescript.md](typescript.md) |
| Подпроцессы | execa 10.2.1 (2026-10-23), tinyexec 1.3.1 (2026-09-03), nano-spawn 2.1.0 (2026-04-01), zx 8.8.5 (2025-10-19) | Первые три — ESM-only; zx — dual, без релизов больше 12 месяцев |
| Один исполняемый файл | Node SEA (`--build-sea` с 25.5), @yao-pkg/pkg 6.25.0 (2026-11-02) | pkg 5.8.1 (2023-03-08) `[устарело]` → SEA или @yao-pkg/pkg; postject 1.0.0-alpha.6 (2023-05-19) `[устарело]` → `node --build-sea`; caxa 3.0.1 (2022-10) объявлен deprecated в npm |
| Десктоп | electron 45.2.3 (2026-11-04), @electron-forge/cli 8.0.1 (2026-09-29), electron-builder 26.18.0 (2026-10-20), @tauri-apps/cli 2.12.4 (2026-10-21) | electron требует node >=22.12 для установки; electron-builder 27 и Tauri 3.0 — в alpha |
| Сборщики | vite 8.3.6 (2026-11-05), rolldown 1.3.0 (2026-11-05), esbuild 0.28.2 (2026-08-08), @rspack/core и @rsbuild/core 2.3.1 (2026-11-03), webpack 5.112.2 (2026-10-23) | Vite — node `^20.19 \|\| >=22.12`, Rolldown по умолчанию с 8.0 (2026-03-12); webpack развивается медленно |
| Браузер и скрапинг | playwright 1.65.0 (2026-11-05), puppeteer 25.16.0 (2026-10-22), crawlee 3.18.2 (2026-09-29) | Crawlee 4 — в RC |
| ИИ и LLM | ai 7.0.163 (2026-11-05), @anthropic-ai/sdk 1.6.0 (2026-11-05), openai 7.53.0 (2026-11-06), @modelcontextprotocol/sdk 1.32.2 (2026-10-23), @mastra/core 1.82.0 (2026-11-04), langchain 1.6.2 (2026-11-05) | `ai` — ESM-only, node >=22; SDK Anthropic и OpenAI — dual; Anthropic SDK вышел из 0.x после 0.135.0 (2026-10-15) |
| IoT | serialport 13.0.0 (2024-12), mqtt 5.16.1 (2026-10), node-red 5.0.9 (2026-10); johnny-five 2.1.0 (2021-07), onoff 6.0.3 (2021-04), firmata 2.3.0 (2020-11) | Последние три заброшены |
| Рантаймы | bun 1.4.4 (2026-10-22), deno 2.9.6 (2026-08-27), wrangler 4.158.0 (2026-11-05) | npm-обёртки; локальная проверка — Deno 2.8.3 |

---

## 1. CLI и TUI

### Ключевые выводы
- **Базовый набор без зависимостей теперь реален.** `util.parseArgs` (добавлен в v18.3, стабилен с v20.0; `allowNegative` для `--no-*` с v22.4/v20.16; `tokens: true` для своей обработки; `strict` по умолчанию `true`) и `util.styleText` (стабилен с v23.5/v22.13; учитывает TTY, `NO_COLOR`, `NODE_DISABLE_COLORS`, `FORCE_COLOR` с v22.8/v20.18; формат `'none'` с v24.2; hex-цвета с v26.1; для stderr передавайте `{ stream: process.stderr }`) закрывают маленькие утилиты без commander и chalk. Добавьте `node:readline/promises` для простых вопросов и `process.loadEnvFile()` / `--env-file` для конфигурации. У `parseArgs` нет генерации справки и подкоманд: когда они нужны, берите фреймворк.
- **Фреймворки CLI стали ESM-only в 2025–2026.** commander 15 (2026-05-29) — ESM-only, требует Node >=22.12.0 ради `require(esm)`, убрал `commander/esm.mjs` и поменял умолчание для одиночной опции `--no-*`; commander 14 получает исправления безопасности до 2027-05. yargs 18, chalk 6, ora 10, boxen 9, conf 16, ink 8, execa 10 тоже ESM-only, в основном с `engines.node >=22`. CJS-утилита на Node 22.12+ всё ещё может их `require()`, но ESM default export приходит как `.default`: `require('chalk').default` — функция, а `require('commander').Command` работает напрямую (проверено локально на Node 24.17).
- **Выбор парсера в 2026:**
  - commander 15 — выбор по умолчанию: самая большая аудитория, группы в справке через `.helpGroup()` с v14, цветная справка с v13, `@commander-js/extra-typings` выводит типы опций.
  - yargs 18 тяжёлый (импорт около 160 мс, см. замеры ниже), зато богатая валидация и middleware.
  - citty (UnJS) и cac 7 — крошечные и быстро грузятся, популярны в экосистеме Vite.
  - oclif (`@oclif/core` 5) — плагины, генераторы и ленивая загрузка команд по манифесту для очень больших CLI (Salesforce, Heroku).
  - Stricli (Bloomberg) — сначала типы, ленивая загрузка команд. gunshi — декларативный, с i18n, но ещё 0.x.
  - clipanion стоит на `4.0.0-rc.4` с 2024-09 (его использует Yarn): для нового кода не берите.
- **Промпты и TUI.** `@clack/prompts` 1.x (`intro`/`outro`/`spinner`/`group`, проверяйте `isCancel()` на каждом ответе) — обычный выбор для скаффолдеров `create-*`. `@inquirer/prompts` 8 (переписанный Inquirer, пакет на каждый тип вопроса, поддержка `AbortSignal`) — для более богатых вопросов. `prompts` (последний релиз 2021) и `enquirer` (2023) заброшены. **Ink 8** (2026-10-03) рендерит компоненты React 19.3+ в терминале; уже Ink 7 требовал Node 22. На Ink построены большие агентные CLI (Claude Code, Gemini CLI) `[не проверено]`. Спиннеры: ora 10 (тяжёлый импорт) или yocto-spinner/nanospinner (крошечные). Списки задач — listr2 11.
- **Цвета.** В приложениях — `util.styleText`. В библиотеках — picocolors (1.1.1, не менялся с 2024-10, крошечный, CJS) или ansis 4 (dual). chalk 6 — ESM-only и требует Node 22. Всегда учитывайте `NO_COLOR`, `FORCE_COLOR`, `--no-color` и вывод не в TTY.
- **Конфигурация, пути, секреты.** `env-paths` 4 и `conf` 16 дают каталоги конфигурации и кеша по ОС; никогда не пишите рядом со скриптом или в `node_modules`. Секреты — в связку ключей ОС через `@napi-rs/keyring`; keytar (последний релиз 2022-02) `[устарело]` → `@napi-rs/keyring`. `update-notifier` 7.3.1 (2024-09) почти не развивается; если используете — проверяйте не чаще раза в день и никогда не блокируйте старт.

### Стоимость старта и как её снизить
Время старта — первое впечатление от CLI: clig.dev советует напечатать что-то примерно за 100 мс.

Стоимость импорта библиотек: проверено локально на Node 24.17 (Windows 11), медиана 21 свежего процесса, запуски чередовались, `performance.now()` вокруг `await import()`. Сравнивайте отношения: абсолютные числа зависят от машины.

| Модуль | Импорт, мс | Относительно `node:util` |
|---|---|---|
| `node:util` | 8 | 1× |
| cac | 11 | 1,4× |
| picocolors | 12 | 1,5× |
| citty | 17 | 2,1× |
| tinyexec | 24 | 3× |
| chalk | 26 | 3,3× |
| commander | 32 | 4× |
| @clack/prompts | 48 | 6× |
| @inquirer/prompts | 131 | 16× |
| ora | 134 | 17× |
| zx | 160 | 20× |
| yargs | 163 | 20× |
| execa | 229 | ≈28× |

Приёмы по убыванию отдачи:
1. **Соберите CLI в один файл** (esbuild, Rolldown или tsdown с `platform: 'node'`). Бандл сократил время импорта до 0,25× (execa), 0,39× (@inquirer/prompts), 0,56× (yargs) и 0,67× (ora) от импорта из `node_modules` (проверено локально на Node 24.17 (Windows 11), esbuild `--bundle --platform=node --format=esm`, 15 запусков). Много мелких файлов стоят дороже парсинга: накладные расходы ФС и антивируса на каждый файл.
2. **Лениво грузите тяжёлый код подкоманд** через `await import()` внутри обработчика. `--help` и `--version` не должны тянуть тяжёлые модули.
3. **Включите compile cache** в точке входа: `module.enableCompileCache?.()` (v22.8+, стабилен с v25.4; переменная `NODE_COMPILE_CACHE=dir`; `portable: true` с v24.12/v25.0; `readOnly` с v26.8). Локальный замер: кеш вдвое ускоряет импорт одного большого файла (9 МБ `typescript.js` из typescript@5: 0,50×), но **не помогает или вредит на множестве мелких небандленных ESM-файлов** (0,84×–1,93× на Windows) и даёт 0,7–1,2× (на уровне шума) на уже собранных файлах 100–800 КБ. Сначала бандл, потом кеш.
4. **Startup snapshots и code cache в SEA** — для крайних случаев (`--build-snapshot`; `useSnapshot` в SEA работает только с CJS). Подробнее — [performance.md](performance.md).
5. Никаких блокирующих сетевых запросов при старте (проверка обновлений); не импортируйте SDK целиком; используйте встроенный `fetch`.
6. `import defer * as ns from './heavy.js'` (TC39 stage 3) откладывает вычисление модуля до первого обращения к свойству. В Deno 2.8.3 работает, в Node 24.17 — `SyntaxError`, флага V8 тоже нет (проверено локально). Интеграция в Node — открытый PR nodejs/node#63712 `[не проверено]`; TypeScript 5.9 парсит синтаксис, но не понижает его `[не проверено]`. Пока Node не поддерживает `import defer`, используйте `await import()` в обработчиках.

Каркас быстрого CLI. Точка входа крошечная: статические `import` вычисляются раньше тела модуля, поэтому кеш включается до динамического импорта основного кода.

```js
#!/usr/bin/env node
// bin/cli.js — точка входа, указана в "bin"
import module from 'node:module'
module.enableCompileCache?.()
await import('../dist/main.js')   // один бандл
```

```js
// src/main.js
import { parseArgs, styleText } from 'node:util'

function usage() {
  return 'usage: tool [--out <file>] [--no-color] <build|check>'
}

async function main(argv) {
  let parsed
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      allowNegative: true,                      // --no-color (v22.4+)
      options: {
        help:    { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
        color:   { type: 'boolean', default: true },
        out:     { type: 'string',  short: 'o' },
      },
    })
  } catch (err) {                               // strict: неизвестная опция
    process.stderr.write(`${err.message}\n${usage()}\n`)
    return 2                                    // ошибка использования
  }
  const { values, positionals } = parsed
  if (values.help) { process.stdout.write(usage() + '\n'); return 0 }
  if (values.version) { process.stdout.write('1.0.0\n'); return 0 }

  const [cmd] = positionals
  if (cmd === 'build') {
    const { build } = await import('./commands/build.js')   // тяжёлый код — лениво
    return build(values)
  }
  const msg = `unknown command: ${cmd ?? '(none)'}`
  process.stderr.write(styleText('red', msg, { stream: process.stderr }) + '\n')
  return 2
}

process.exitCode = await main(process.argv.slice(2))
```

```bash
# один ESM-файл для Node; если CJS-зависимости зовут require(), добавьте баннер с createRequire
npx esbuild src/main.js --bundle --platform=node --format=esm --outfile=dist/main.js
```

### Распространение
- npm-пакет с полем `"bin"` и файлом с `#!/usr/bin/env node` (на Windows npm создаёт обёртки `.cmd`/`.ps1`); пользователи запускают через `npx`, `pnpm dlx` или `bunx`.
- **Node SEA:** `node --build-sea sea-config.json` с **v25.5.0**. На 24.x и раньше — `--experimental-sea-config` плюс `postject`; на Node 24.17 `--build-sea` — «bad option» (проверено локально). Поддерживается `mainFormat: "module"` (ESM-точка входа); `useVfs` даёт виртуальную ФС только для чтения под ассеты с v26.9 (стабильность 1.0); `useSnapshot` — только CJS; кросс-сборка требует отключить code cache и snapshot; сама возможность — стабильность 1.1 «Active development».
- `bun build --compile --target=bun-linux-x64 …` кросс-компилирует под все основные цели; `--bytecode` ускоряет старт (по документации `tsc` стартует примерно в 2 раза быстрее); есть `--windows-icon`; бинарники большие.
- `bun compile` (= `bun build --compile --aot`) — **экспериментальный**: встраивает машинный код вместо JS под JIT, проверяет типы и использует их для оптимизации, быстрее старт и меньше памяти, собирает только под текущую платформу.
- `deno compile --target …` вшивает разрешения, кросс-компилирует с любой машины; `--bundle` (экспериментальный) уменьшает npm-нагрузку.
- `@yao-pkg/pkg` 6.25 — поддерживаемый форк Vercel `pkg` (архивирован 2024-01-13, последний релиз 5.8.1). `nexe` застрял на 5.0.0-beta.4 (2025-03); `caxa` объявлен deprecated в npm.

```json
{ "main": "dist/main.js", "mainFormat": "module", "output": "dist/tool" }
```
Это минимальный `sea-config.json` для `node --build-sea` (Node 25.5+). Проверено локально на Node 26.13.0 (Windows 11): `--build-sea` собирает бинарник, ESM-точка входа работает, без поля `output` сборка падает («"output" field … is not a non-empty string»), бинарник при запуске печатает `ExperimentalWarning`. На Windows задайте `output` с расширением `.exe`. Сверьте остальные поля со страницей Single executable applications для вашей версии: возможность ещё в активной разработке.

### Сигналы, выход, тесты
- Ставьте `process.exitCode = n` и дайте циклу событий завершиться, а не вызывайте `process.exit()` при незаписанном выводе: stdout в pipe на POSIX асинхронный, вывод обрежется.
- `SIGINT` обрабатывайте один раз (очистка с таймаутом), на втором — жёсткий выход. По соглашению код 2 — ошибка использования, 1 — ошибка выполнения.

```js
let stopping = false
process.on('SIGINT', () => {
  if (stopping) process.exit(130)                 // второй Ctrl-C
  stopping = true
  setTimeout(() => process.exit(130), 5_000).unref()
  cleanup().finally(() => { process.exitCode = 130 })
})
```

- Тесты CLI: запускайте настоящий бинарник через execa, tinyexec или `node:child_process`, проверяйте stdout, stderr и код выхода, ставьте `NO_COLOR=1`; для Ink — `ink-testing-library`. Подробнее — [testing.md](testing.md).

### Рекомендуемый стек
| Задача | Выбор | Альтернативы |
|---|---|---|
| Маленькая утилита или скрипт без зависимостей | `util.parseArgs` + `util.styleText` + `readline/promises` | mri, arg (заброшены, но стабильны) |
| Типичный CLI с подкомандами | commander 15 (+ extra-typings) | cac 7, citty |
| Очень большой или расширяемый CLI | oclif 5 | Stricli |
| Скаффолдер (`create-x`) | @clack/prompts 1.x + giget | @inquirer/prompts 8 |
| Богатый интерактивный TUI | Ink 8 (React) | — |
| Цвета | `util.styleText` (приложения), picocolors/ansis (библиотеки) | chalk 6 (ESM-only, Node 22+) |
| Распространение | npm `bin` + один бандл | Node SEA (25.5+), `bun build --compile`, `deno compile` |

**Ловушки**
- Всё импортируется в начале `cli.js`, и `--version` идёт 300 мс. Меряйте `performance.now()` вокруг импортов или `node --cpu-prof`.
- Прогресс и логи в stdout ломают pipe и `--json`. Вопрос пользователю при `!process.stdin.isTTY` вешает CI: падайте с сообщением, какой флаг передать.
- `process.exit()` сразу после записи в pipe — обрезанный вывод.
- `"engines": {"node": ">=18"}` при зависимости от commander 15, chalk 6 или execa 10 (всем нужен Node 22).
- `#!/usr/bin/env node --flag` непереносим (Linux передаёт один аргумент). Пишите `#!/usr/bin/env -S node --flag` или задавайте поведение в коде (`module.enableCompileCache()`).
- Нативные аддоны (`.node`) в SEA или pkg без плана извлечения. Для SEA: запишите аддон во временный файл, затем `process.dlopen()`.

### Ресурсы
| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [util.parseArgs](https://nodejs.org/api/util.html#utilparseargsconfig) | Node.js, 2026 | Опции `parseArgs` и история изменений |
| [util.styleText](https://nodejs.org/api/util.html#utilstyletextformat-text-options) | Node.js, 2026 | `styleText`, `NO_COLOR`/`FORCE_COLOR`, hex |
| [readline Promises API](https://nodejs.org/api/readline.html#promises-api) | Node.js | Вопросы пользователю без зависимостей |
| [Module compile cache](https://nodejs.org/api/module.html#module-compile-cache) | Node.js, 2026 | `enableCompileCache`, `portable`, `readOnly` |
| [Single executable applications](https://nodejs.org/api/single-executable-applications.html) | Node.js, 2026 | SEA, `--build-sea`, VFS, ESM-точка входа |
| [--snapshot-blob](https://nodejs.org/api/cli.html#--snapshot-blob-path) | Node.js | Startup snapshots |
| [Command Line Interface Guidelines](https://clig.dev/) | Prasad, Firshman, Tashian, Parish, 2020– | Канон UX для CLI |
| [NO_COLOR](https://no-color.org/) | Joe Wass | Соглашение об отключении цвета |
| [commander.js](https://github.com/tj/commander.js) | TJ Holowaychuk, John Gee | commander |
| [commander CHANGELOG](https://github.com/tj/commander.js/blob/master/CHANGELOG.md) | John Gee, 2026 | Ломающие изменения v13–v15 |
| [extra-typings](https://github.com/commander-js/extra-typings) | commander-js | Выведенные типы опций |
| [yargs](https://yargs.js.org/) | yargs | Документация yargs |
| [citty](https://github.com/unjs/citty) | UnJS | citty |
| [cac](https://github.com/cacjs/cac) | EGOIST | cac |
| [oclif](https://oclif.io/) | Salesforce | Фреймворк oclif |
| [Stricli](https://bloomberg.github.io/stricli/) | Bloomberg | Stricli |
| [gunshi](https://github.com/kazupon/gunshi) | kazupon | gunshi |
| [clack](https://github.com/bombshell-dev/clack) | bombshell-dev | @clack/prompts |
| [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) | Simon Boudrias | @inquirer/prompts |
| [Ink](https://github.com/vadimdemedes/ink) | Vadim Demedes, Sindre Sorhus | Ink |
| [Ink releases](https://github.com/vadimdemedes/ink/releases) | Ink, 2026 | Ломающие изменения v7/v8 |
| [ink-testing-library](https://github.com/vadimdemedes/ink-testing-library) | Vadim Demedes | Тесты Ink |
| [listr2](https://github.com/listr2/listr2) | Cenk Kılıç | Списки задач |
| [picocolors](https://github.com/alexeyraspopov/picocolors) | Alexey Raspopov | Крошечные цвета |
| [ansis](https://github.com/webdiscus/ansis) | webdiscus | Цвета, dual CJS/ESM |
| [env-paths](https://github.com/sindresorhus/env-paths) | Sindre Sorhus | Каталоги по ОС |
| [conf](https://github.com/sindresorhus/conf) | Sindre Sorhus | Хранение конфигурации |
| [keyring-node](https://github.com/Brooooooklyn/keyring-node) | LongYinan | Связка ключей ОС (napi-rs) |
| [Bun: Single-file executables](https://bun.com/docs/compiler/executables) | Oven, 2026 | `bun build --compile` (страница переехала с /docs/bundler/executables) |
| [Bun: Compiler](https://bun.com/docs/compiler) | Oven, 2026 | `--compile` против экспериментального `bun compile --aot` |
| [deno compile](https://docs.deno.com/runtime/reference/cli/compile/) | Deno, 2026 | `deno compile` |
| [yao-pkg/pkg](https://github.com/yao-pkg/pkg) | yao-pkg | Поддерживаемый форк pkg |
| [vercel/pkg](https://github.com/vercel/pkg) | Vercel | `[устарело]`: архивирован 2024-01-13 → Node SEA или @yao-pkg/pkg |
| [postject](https://github.com/nodejs/postject) | Node.js | `[устарело]`: инжектор блоба для SEA до 25.5 → `node --build-sea` |
| [import defer](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/import/defer) | MDN | Семантика `import defer` `[не проверено]` |
| [nodejs/node#63712](https://github.com/nodejs/node/pull/63712) | Node.js, 2026 | Отложенные импорты в Node (открытый PR) `[не проверено]` |

---

## 2. Публикация npm-библиотек

### Ключевые выводы
- **`require(esm)` убрал главную причину для dual-сборок.** Он включён без флага в v23 и v22.12.0, бэкпортирован в v20.19.0 и объявлен стабильным в конце 2025 года (Joyee Cheung). Node 20 ушёл в EOL 2026-04-30, поэтому **любая поддерживаемая линия Node может `require()` ESM-only пакет**, если в его графе модулей нет top-level `await` (иначе `ERR_REQUIRE_ASYNC_MODULE`, проверено локально на Node 24.17). Поддержку показывает `process.features.require_module === true`. Joyee советует `package.json` с `"type": "module"`, одной записью `exports` и `"engines": {"node": "^20.19.0 || >=22.12.0"}`.
- **Default export и CJS.** CJS-потребитель, который делает `require()` ESM-модуля, получает объект пространства имён (`{ __esModule: true, default: fn }`), а не default export. Добавьте `export { fn as "module.exports" }`, и `require('pkg')` вернёт саму `fn` (проверено локально на Node 24.17: со строковым именем экспорта — функция, без него — объект). Тот же приём описывает Anthony Fu. Ещё лучше — не делать default export в библиотеках: это заодно убирает предупреждение publint `CJS_WITH_ESMODULE_DEFAULT_EXPORT`.
- **Экосистема уже переехала.** commander 15, chalk 6, execa 10, yargs 18, Vite/Vitest, ink и большинство пакетов Sindre Sorhus, UnJS и экосистемы Vite — ESM-only. Доля ESM среди npm-пакетов выросла с 7,8% (2021) до 25,8% (конец 2024) по данным wooorm npm-esm-vs-cjs, которые цитирует Anthony Fu.
- **Потребители на TypeScript.** TS 5.8 (2025-02) разрешает `require()` ESM при `--module nodenext` (не при `node16`) и добавил стабильный `--module node18` `[не проверено]`. CJS-проект на TypeScript с `module: node16` или `moduleResolution: node10` получает ошибки на ESM-only пакетах — это главный оставшийся аргумент за dual. Подробнее — [typescript.md](typescript.md).
- **Правило выбора в 2026:**
  - **ESM-only — по умолчанию** для новых пакетов, CLI, библиотек под браузер и сборщики, плагинов к ESM-first инструментам (Vite, ESLint 9+ flat config, Vitest) и всего с `engines.node` `>=22.12` (или `^20.19.0 || >=22.12.0`).
  - **Dual (ESM + CJS)** — только если нужно обслужить CJS-пользователей TypeScript на `node16`/`node10`, инструменты со своим CJS-загрузчиком (старые конфигурации Jest, часть пайплайнов Electron, React Native и устаревших сборщиков) `[не проверено]` или большую CJS-аудиторию, для которой ломающий мажор пока неприемлем. Собирайте оба формата из одного исходника через tsdown (`format: ['esm', 'cjs']`), выпускайте `.d.ts` и `.d.cts` и учитывайте **dual-package hazard**: два экземпляра модуля, поэтому никаких синглтонов на уровне модуля, никаких `instanceof` через границу, бренды через `Symbol.for`.
  - **CJS-only** для нового кода — нет.
- **Правила `exports`** (документация Node и publint):
  - `exports` закрывает все неперечисленные подпути (`ERR_PACKAGE_PATH_NOT_EXPORTED`); цели начинаются с `./`.
  - Порядок условий важен: `types` **первым**, `default` **последним**; `import` и `require` взаимоисключающие.
  - `module-sync` — ESM-точка, которую могут загрузить и `import`, и `require` (без TLA). `node-addons` и `node` — условия ядра; `browser`, `development`, `production`, `types` — условия сообщества; ключи других рантаймов берутся из списка runtime keys WinterCG/WinterTC.
  - Экспортируйте `./package.json`, если он нужен инструментам. `null` скрывает подпуть. Всегда задавайте `"type"` (publint `USE_TYPE`: иначе Node тратит время на определение синтаксиса).
  - `imports` (`#internal/*`) отображает приватные пути; ключи `#/` — с v25.4/v24.14. С v26.4 есть экспериментальный `--experimental-package-map`.
- **Сборщики библиотек в 2026.** **tsdown** 0.23 (Rolldown + Oxc, официальный проект Rolldown): ESM по умолчанию, чистит `outDir`, сам выпускает `.d.ts`, если в `package.json` есть `types`, берёт `target` из `engines.node`, `unbundle: true` даёт вывод файл-в-файл, `exports: true` сам пишет поле `exports`, `publint: true` и `attw: { profile: 'esm-only', level: 'error' }` (оба умеют `'ci-only'`) проверяют пакет прямо в сборке. **README tsup теперь говорит: «This project is not actively maintained anymore. Please consider using tsdown instead»** (при этом 9.0.0 вышел 2026-10-14). Другие варианты: unbuild 3.6 (молчит с 2025-08), pkgroll 2.29 (берёт точки входа из `exports`), bunchee 7, tshy 4 (Isaac Schlueter; чистый `tsc`, dual через гибридный вывод), zshy 0.8 (Colin McDonnell; на `tsc`, сделан для Zod) или **просто `tsc`** для небандленной ESM-only библиотеки (проще всего; с `isolatedDeclarations` декларации быстро выпускают Oxc и tsdown).
- **Проверки перед каждой публикацией** (держите в CI):
  - `npx publint --strict` сверяет `package.json` и `exports` с реальными файлами (`--level suggestion|warning|error`, `--pack auto|npm|pnpm|yarn|bun|false`). Ошибки: `EXPORTS_TYPES_SHOULD_BE_FIRST`, `EXPORTS_DEFAULT_SHOULD_BE_LAST`, `FILE_DOES_NOT_EXIST`, `FILE_NOT_PUBLISHED`, `BIN_FILE_NOT_EXECUTABLE`, `LOCAL_DEPENDENCY`. Предупреждения: `TYPES_NOT_EXPORTED`, `CJS_WITH_ESMODULE_DEFAULT_EXPORT`, `EXPORTS_FALLBACK_ARRAY_USE`. Советы: `USE_ENGINES_NODE`, `USE_FILES`, `USE_SIDE_EFFECTS`, `USE_TYPE`.
  - `npx @arethetypeswrong/cli --pack . --profile esm-only` (ESM-only) или `--profile node16` (dual без node10) проверяет, как TypeScript разрешает ваши типы в каждом режиме: `FalseCJS`, `FalseESM`, `CJSResolvesToESM`, `NoResolution`, `UntypedResolution`, `FallbackCondition`, `FalseExportDefault`, `MissingExportEquals`, `NamedExports`; конфигурация — в `.attw.json`. `--pack` использует npm; с pnpm или yarn сначала упакуйте пакет и передайте tarball.
  - `npm pack --dry-run` (что уходит в пакет), `size-limit` 14 (бюджет размера), `knip` (неиспользуемые экспорты и зависимости — [toolchain.md](toolchain.md)).
- **Что писать в `package.json`:** `name`, `version`, `type`, `exports`, `files` (белый список `dist`), `engines.node`, `sideEffects: false`, если это правда, `license` (SPDX), `repository` (для provenance должен точно совпадать с репозиторием публикации), `bin` с файлом с shebang, `publishConfig.access: "public"` для scoped-пакетов. Уберите `typesVersions` (обход для TS до 4.7, `[устарело]` → `exports.types`), `module`/`jsnext:main` (устаревшие поля сборщиков → `exports`) и корневой `types` при наличии `exports` (он игнорируется, publint `TYPES_NOT_EXPORTED`), кроме случая dual-пакета с пользователями `node10`.
- **Безопасная публикация в 2026.** **Trusted publishing (OIDC)** из GitHub Actions (только GitHub-hosted runners), GitLab.com или CircleCI cloud: npm CLI >=11.5.1, Node >=22.14.0, `permissions: id-token: write`. **Provenance создаётся автоматически** для публичных пакетов из публичных репозиториев (кроме CircleCI и приватных репозиториев). Затем переключите пакет в режим «Require two-factor authentication and disallow tokens». **Staged publishing** (npm CLI >=11.15.0): CI делает `npm stage publish`, мейнтейнер подтверждает с 2FA через `npm stage approve <id>` или на npmjs.com; стейджинг совершенно нового пакета публикует видимую заглушку `0.0.0-stage`. Ручной provenance: `npm publish --provenance` (CLI >=9.5) при точном совпадении `repository`; пользователи проверяют `npm audit signatures`. Инциденты с npm-червями 2025 года и политика токенов — в [toolchain.md](toolchain.md).
- **Версии и релизы.** SemVer; повышение `engines.node`, переход на ESM-only и изменение `exports` (удалённый подпуть) — **ломающие** изменения. Changesets 3.x (`@changesets/cli` 3.0.3, Node `^22.11 || ^24 || >=26`; 3.0.3 починил публикацию с pnpm 10 и npm 12) — для монорепозиториев; release-it 21, semantic-release 25 (по сообщениям коммитов), np 12 (интерактивно, один пакет), bumpp 12 (Anthony Fu). `pkg-pr-new` публикует превью-сборки для каждого PR, не засоряя npm.
- **JSR** (jsr.io, TypeScript-first реестр от команды Deno): публикуйте исходники TypeScript через `npx jsr publish` или `deno publish` (`jsr.json` или `deno.json` с `name`, `version`, `exports`). «Slow types» (экспорты без явных типов) по умолчанию отклоняются (`--allow-slow-types` — обход). Публикация без токенов через OIDC из GitHub Actions создаёт provenance. Пользователи npm ставят пакет через слой совместимости `@jsr/` (`npx jsr add`); `--dry-run` проверяет публикацию. Подходит для библиотек под Deno, Bun, Node и браузеры; если пользователи Deno важны, публикуйте и в npm, и в JSR. После перехода команды Deno в Cloudflare JSR продолжает работать (раздел [9](#9-кросс-рантайм-bun-deno-cloudflare-workers)).

### Шаблон: ESM-only библиотека (выбор по умолчанию)
```json
{
  "name": "@scope/my-lib",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./utils": { "types": "./dist/utils.d.ts", "default": "./dist/utils.js" },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "sideEffects": false,
  "engines": { "node": ">=22.12.0" },
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/scope/my-lib.git" },
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "tsdown",
    "check:pkg": "publint --strict && attw --pack . --profile esm-only",
    "prepublishOnly": "npm run build && npm run check:pkg"
  }
}
```
```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'
export default defineConfig({
  entry: ['src/index.ts', 'src/utils.ts'],
  // format по умолчанию 'esm'; target берётся из engines.node
  fixedExtension: false,         // .js/.d.ts, как в package.json выше (умолчание для platform 'node' — .mjs/.d.mts)
  dts: true,
  exports: true,                 // держит "exports" в package.json в синхроне (смотрите diff)
  publint: 'ci-only',            // нужны devDependencies publint и @arethetypeswrong/core
  attw: { enabled: 'ci-only', profile: 'esm-only', level: 'error' },
})
```
Проверено локально (tsdown 0.23.7, TypeScript 7.0.2, `CI=true`): сборка проходит, publint и attw без замечаний. Без `fixedExtension: false` tsdown выпускает `.mjs`/`.d.mts`, и `exports: true` переписывает пути в `package.json`. С TypeScript 7 генерации деклараций нужен `tsconfig.json` в проекте.

### Шаблон: dual ESM + CJS (только когда нужно)
```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.cts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./package.json": "./package.json"
  },
  "engines": { "node": ">=20.19.0" }
}
```
Проверка — `attw --pack . --profile node16` (или `strict`, если обещаете и `node10`). Каждому формату нужен свой файл деклараций (`.d.ts` для ESM, `.d.cts` для CJS): общий `.d.ts` даёт `FalseCJS`/`FalseESM`. Промежуточный вариант: поставьте первым условие `"module-sync": "./dist/index.js"`, тогда Node 22.12+ использует ESM-сборку и для `import`, и для `require` (один экземпляр, без hazard), а старые рантаймы откатятся на CJS. Семантика условия описана в документации Node; сам паттерн `[не проверено]`.

### Публикация из GitHub Actions (trusted publishing)
```yaml
name: release
on: { push: { tags: ['v*'] } }
permissions: { contents: read, id-token: write }   # id-token обязателен для OIDC
jobs:
  publish:
    runs-on: ubuntu-latest                          # нужен GitHub-hosted runner
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7                 # Node 24 несёт npm 11.19 (нужен >=11.5.1)
        with: { node-version: 24, registry-url: 'https://registry.npmjs.org', package-manager-cache: false }
      - run: npm ci
      - run: npm run build && npm run check:pkg
      - run: npm publish            # или: npm stage publish (подтверждение позже с 2FA)
```
`package-manager-cache: false` советует README setup-node для публикующих workflow (отравленный кеш может раскрыть OIDC-токен). Сначала настройте trusted publisher на npmjs.com (репозиторий, имя файла workflow, опционально environment). Первая публикация должна пройти в течение 2 дней после создания настройки; на пакет — до 10 trusted publishers.

**Ловушки**
- `"types"` после `"import"`/`"default"` в объекте условий (TypeScript останавливается на первом совпадении) → publint `EXPORTS_TYPES_SHOULD_BE_FIRST`.
- Один `index.d.ts` на ESM и CJS → attw «Masquerading as ESM/CJS».
- Добавление `exports` в существующий пакет — ломающее изменение (глубокие импорты перестают работать): перечислите старые пути явно или поднимите мажор.
- Top-level `await` во входной точке библиотеки — CJS-потребители больше не могут её `require()`.
- Default export у CJS-потребителя превращается в `require('pkg').default`: используйте именованные экспорты или строковый экспорт `"module.exports"`.
- В пакет попали `src/`, тесты, фикстуры, `.env`: задайте `files` и смотрите `npm pack --dry-run`.
- `"engines": {"node": ">=18"}` при коде с `require(esm)`, потоковым `fetch`, `styleText` или `import.meta.dirname` (20.11+).
- Долгоживущие automation-токены npm в секретах CI → trusted publishing и 2FA с запретом токенов.
- Устаревшие поля сборщиков (`module`, строковый `browser`) вместо условий `exports`.

### Ресурсы
| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Node.js: Packages](https://nodejs.org/api/packages.html) | Node.js, 2026 | `exports`/`imports`, условия, `module-sync`, `type` |
| [Loading ECMAScript modules using require()](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require) | Node.js | Правила `require(esm)`, имя экспорта `module.exports` |
| [require(esm) in Node.js: from experiment to stability](https://joyeecheung.github.io/blog/2025/12/30/require-esm-in-node-js-from-experiment-to-stability/) | Joyee Cheung, 2025 | История `require(esm)` и советы автора |
| [Move on to ESM-only](https://antfu.me/posts/move-on-to-esm-only) | Anthony Fu, 2025 | Аргументы за ESM-only и когда dual ещё нужен |
| [nodejs/package-examples](https://github.com/nodejs/package-examples) | Node.js | Паттерны публикации, глава о dual-пакетах |
| [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) | Sindre Sorhus, 2021– | FAQ по ESM-only пакетам (контекст до `require(esm)`) |
| [publint docs](https://publint.dev/docs/) / [CLI](https://publint.dev/docs/cli) / [Rules](https://publint.dev/rules) | Bjorn Lu | Обзор; `--level`, `--pack`, `--strict`; все правила |
| [Are the types wrong?](https://arethetypeswrong.github.io/) | Andrew Branch | Веб-проверка разрешения типов |
| [attw CLI README](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/packages/cli/README.md) / [Problems](https://github.com/arethetypeswrong/arethetypeswrong.github.io/tree/main/docs/problems) | Andrew Branch | Профили и виды проблем; объяснение каждой |
| [Choosing compiler options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html) | Andrew Branch, команда TS | Настройки `module` для библиотек |
| [TypeScript 5.8 release notes](https://typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html) | Microsoft, 2025 | `require(esm)` под `nodenext`, `--module node18` `[не проверено]` |
| [tsdown guide](https://tsdown.dev/guide/) | Rolldown team (Kevin Deng и др.) | Обзор tsdown |
| [tsdown: Package exports](https://tsdown.dev/options/package-exports) / [Lint](https://tsdown.dev/options/lint) | Rolldown team | `exports: true`, devExports; publint и attw в сборке |
| [Migrate from tsup](https://tsdown.dev/guide/migrate-from-tsup) | Rolldown team | Умолчания и опции при переходе с tsup |
| [tsup](https://github.com/egoist/tsup) | EGOIST | Пометка «not actively maintained» |
| [unbuild](https://github.com/unjs/unbuild) | UnJS | unbuild |
| [pkgroll](https://github.com/privatenumber/pkgroll) | Hiroki Osame | pkgroll |
| [tshy](https://github.com/isaacs/tshy) | Isaac Z. Schlueter | tshy |
| [zshy](https://github.com/colinhacks/zshy) | Colin McDonnell | zshy |
| [bunchee](https://github.com/huozhi/bunchee) | Jiachi Liu | bunchee |
| [Trusted publishing](https://docs.npmjs.com/trusted-publishers) | npm, 2026 | OIDC-публикация, требования |
| [Staged publishing](https://docs.npmjs.com/staged-publishing) | npm, 2026 | `npm stage publish/approve` |
| [Staged publishing and new install-time controls for npm](https://github.blog/changelog/2026-05-22-staged-publishing-and-new-install-time-controls-for-npm) | GitHub, 2026 | Анонс staged publishing `[не проверено]` |
| [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements) | npm | `--provenance`, проверка |
| [package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json) | npm | Справочник по полям |
| [Semantic Versioning](https://semver.org/) | Tom Preston-Werner | SemVer |
| [Changesets](https://github.com/changesets/changesets) / [Releases](https://github.com/changesets/changesets/releases) | Changesets, 2026 | Версии в монорепозитории; изменения 3.0.x |
| [release-it](https://github.com/release-it/release-it) | Lars Kappert | release-it |
| [semantic-release](https://github.com/semantic-release/semantic-release) | semantic-release | Релизы по коммитам |
| [np](https://github.com/sindresorhus/np) | Sindre Sorhus | Интерактивная публикация |
| [pkg.pr.new](https://github.com/stackblitz-labs/pkg.pr.new) | StackBlitz | Превью-пакеты для PR |
| [size-limit](https://github.com/ai/size-limit) | Andrey Sitnik | Бюджет размера |
| [JSR: Publishing packages](https://jsr.io/docs/publishing-packages) | Deno Land | Публикация, slow types, OIDC |
| [JSR: About slow types](https://jsr.io/docs/about-slow-types) / [npm compatibility](https://jsr.io/docs/npm-compatibility) | Deno Land | Что такое slow types; слой `@jsr/` для npm |
| [e18e](https://e18e.dev/) | e18e community | Производительность экосистемы, чистка зависимостей |
| [module-replacements](https://github.com/es-tooling/module-replacements) | es-tooling / e18e | Лёгкие замены популярных зависимостей |

---

## 3. Скрипты и автоматизация

### Ключевые выводы
- **Сначала встроенное.** Node закрывает большинство задач shell-скрипта без зависимостей: `fs.promises.cp(src, dst, { recursive: true })`, `fs.promises.rm(p, { recursive: true, force: true })` (вместо rimraf), `fs.promises.glob` / `fs.globSync` (вместо glob/fast-glob в простых случаях; стабилен в текущих линиях `[не проверено]`), `import.meta.dirname`/`filename` (v20.11+), `process.loadEnvFile()` и `--env-file`, `util.parseArgs`, `util.styleText`, `fetch`, `AbortSignal.timeout(ms)`, `stream/promises.pipeline`, `node --run <script>` (запускает скрипты `package.json` без накладных расходов npm), `node --watch`. TypeScript-скрипты запускаются напрямую через type stripping (`node script.ts`, без флага с v23.6/v22.18; только стираемый синтаксис) — см. [toolchain.md](toolchain.md) и [typescript.md](typescript.md).
- **Правила `node:child_process`:**
  - `execFile`/`spawn` с массивом аргументов (без shell); никогда не подставляйте пользовательский ввод в строки `exec()` или `shell: true`.
  - Передавайте `signal` (AbortController) и/или `timeout`; проверяйте `exitCode` и `signal`; для сквозного вывода — `stdio: 'inherit'`.
  - `exec` буферизует вывод с `maxBuffer` по умолчанию 1 МиБ, больший вывод даёт ошибку и убивает процесс `[не проверено]`.
  - **Windows:** после security-релиза апреля 2024 (CVE-2024-27980, «BatBadBut») запуск `.bat`/`.cmd` без `shell: true` бросает `EINVAL`. Поэтому `spawn('npm', ...)` требует `shell: true` или разрешения `npm.cmd`, и поэтому существуют кроссплатформенные обёртки (execa, tinyexec, cross-spawn) `[не проверено]`.
- **execa 10** (2025-07; 10.2.1 — 2026-10-23) требует Node 22. Подпроцесс теперь обычный promise (API `ChildProcess` переехали в `subprocess.nodeChildProcess`); `execaCommand()` удалён → шаблонные строки (`` await execa`git log -1 ${ref}` `` экранирует каждую подстановку) или `parseCommandString()`; `ipc: true` вместо `'ipc'` в stdio; новые `killDescendants`, преобразования в web streams (`readableStream()`), типизированные transforms. 10.1 изменил экранирование аргументов `.cmd`/`.bat` и семантику `extendEnv: false`; 10.2 убивает подпроцесс при превышении `maxBuffer`. Импорт тяжёлый: около 229 мс без бандла, 0,25× в бандле (проверено локально на Node 24.17 (Windows 11)).
- **tinyexec** 1.3 (используется в экосистеме Vite/Vitest) и **nano-spawn** 2.1 (Sindre Sorhus, крошечная альтернатива execa) — лёгкие варианты для «запустить команду и получить вывод».
- **zx 8** (Google): шаблон `$` с автоэкранированием, `cd`, `within`, `nothrow`, `quiet`, `retry`, `spinner`, `glob`, `fs`, `argv`, YAML, markdown-скрипты, сборка `zx@lite`. Последний релиз 8.8.5 (2025-10-19); 8.8.x — в основном исправления для Windows и безопасности (инъекция команд через `kill()` на Windows в 8.7.1–8.8.1, исправлена в 8.8.2; инъекция через Proxy/`toString()` исправлена в 8.8.3). За 12 месяцев до 2026-11 релизов не было: **молчит, но пригоден**; закрепите исправленную версию (>=8.8.3). На Windows zx нужен bash (Git Bash/WSL) или явный `usePowerShell()`/`usePwsh()` `[не проверено]`.
- **Shell других рантаймов.** Bun Shell (`import { $ } from 'bun'`) — кроссплатформенный bash-подобный shell внутри Bun, bash на Windows не нужен `[не проверено]`. В Deno используют `dax` (`jsr:@david/dax`; npm-зеркало `dax-sh` объявлено deprecated) `[не проверено]`. Для переносимости между рантаймами пишите скрипты на `node:` API + tinyexec или execa.
- **Слежение за файлами:** `fs.watch` (рекурсивный на Linux с v20) или chokidar 6 (6.0.0 — 2026-10-19, ESM, Node >=22.22) для надёжной кроссплатформенной слежки; `node --watch-path`.
- **Запуск задач:** npm scripts + `node --run`; `npm-run-all2` для параллели; монорепозитории (Turborepo, Nx) — в [architecture.md](architecture.md). Makefile и just по-прежнему годятся для многоязычных репозиториев.
- **Автоматизация Windows:** задачи ОС делайте в PowerShell и вызывайте из Node через `execFile('pwsh', ['-NoProfile', '-Command', ...])`; `node-pty` 1.1 (2025-12) — псевдотерминалы (нативный аддон, используется в VS Code).

```js
// scripts/release-notes.mjs — без зависимостей, Node 22+
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { rm, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const run = promisify(execFile)
const outDir = join(import.meta.dirname, '..', 'out')

async function main() {
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })
  const ref = process.argv[2] ?? 'HEAD'
  // массив аргументов: ref не попадает в shell
  const { stdout } = await run('git', ['log', '-20', '--format=%h %s', ref], {
    timeout: 10_000,
  })
  await writeFile(join(outDir, 'notes.txt'), stdout)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
```

**Ловушки**
- `` exec(`git commit -m "${msg}"`) `` — инъекция команд; используйте `execFile('git', ['commit', '-m', msg])` или шаблоны execa/zx.
- `spawn('npm', ['ci'])` падает на Windows (`ENOENT`/`EINVAL`): `shell: true` с фиксированными аргументами или execa/cross-spawn.
- Подпроцесс без таймаута и отмены вешает CI: всегда передавайте `timeout` или `signal`.
- `__dirname` в ESM-скрипте не определён → `import.meta.dirname`.
- rimraf, mkdirp, fs-extra для того, что `fs/promises` делает сам (`rm`, `mkdir({recursive})`, `cp`).
- Необработанный rejection в скрипте завершает процесс с кодом 1, но может потерять контекст: оборачивайте `main()` и ставьте `process.exitCode`.

### Ресурсы
| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [child_process](https://nodejs.org/api/child_process.html) | Node.js | `spawn`/`execFile`, shell, signal, maxBuffer |
| [April 2024 security releases](https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2) | Node.js, 2024 | CVE-2024-27980: запуск `.bat`/`.cmd` `[не проверено]` |
| [fsPromises.glob](https://nodejs.org/api/fs.html#fspromisesglobpattern-options) / [fsPromises.cp](https://nodejs.org/api/fs.html#fspromisescpsrc-dest-options) | Node.js | `fs.glob`; рекурсивное копирование |
| [node --run](https://nodejs.org/api/cli.html#--run) | Node.js | Запуск скриптов `package.json` |
| [process.loadEnvFile](https://nodejs.org/api/process.html#processloadenvfilepath) | Node.js | Загрузка `.env` |
| [execa](https://github.com/sindresorhus/execa) / [Releases](https://github.com/sindresorhus/execa/releases) | Sindre Sorhus, ehmicky, 2025–2026 | Документация; ломающие изменения v10 |
| [tinyexec](https://github.com/tinylibs/tinyexec) | tinylibs (James Garbutt и др.) | Минимальный exec |
| [nano-spawn](https://github.com/sindresorhus/nano-spawn) | Sindre Sorhus | Крошечная обёртка над spawn |
| [zx](https://google.github.io/zx/) / [Releases](https://github.com/google/zx/releases) | Google (Anton Medvedev, Anton Golub), 2025 | Документация; исправления безопасности 8.8.x |
| [Bun Shell](https://bun.com/docs/runtime/shell) | Oven | Shell в Bun |
| [dax](https://jsr.io/@david/dax) | David Sherret | dax для Deno |
| [chokidar](https://github.com/paulmillr/chokidar) | Paul Miller | Слежение за файлами |
| [node-pty](https://github.com/microsoft/node-pty) | Microsoft | Псевдотерминалы |
| [cross-spawn](https://github.com/moxystudio/node-cross-spawn) | André Cruz | Безопасный для Windows spawn (7.0.6, 2024-11) |
| [npm-run-all2](https://github.com/bcomnes/npm-run-all2) | Bret Comnes | Параллельные npm-скрипты |

---

## 4. Десктоп: Electron, Tauri и альтернативы

### Ключевые выводы
- **Ритм Electron:** мажор каждые 8 недель; поддерживаются **три** последних стабильных мажора, обновления получает только последний минор каждого. Расписание:

| Electron | Стабильный | Chromium | Node | EOL |
|---|---|---|---|---|
| 43 | 2026-06-29 | M150 | 24.17.0 | 2027-01-05 |
| 44 | 2026-08-24 | M152 | 24.18.1 | — |
| **45** | **2026-10-20** | M156 | 24.22.0 | 2027-04-27 |
| 46 | 2027-01-05 (alpha с 2026-10-23) | M160 | **26.13.0** | — |
| 47 | 2027-03-02 (предварительно) | — | — | — |

  Последний `electron` в npm — 45.2.3 (2026-11-04). Electron переходит на новый мажор Node, когда тот становится Active LTS.
- **Официальный чеклист безопасности Electron** (20 пунктов): грузите только HTTPS; никакого `nodeIntegration` для удалённого контента; `contextIsolation` и `sandbox` во всех рендерерах; обрабатывайте `session.setPermissionRequestHandler`; не отключайте `webSecurity`; строгий CSP; никаких `allowRunningInsecureContent`, экспериментальных возможностей и `enableBlinkFeatures`; ограничьте навигацию и `window.open`; никогда не вызывайте `shell.openExternal` с недоверенными URL; оставайтесь на поддерживаемом Electron; **проверяйте отправителя каждого IPC-сообщения**; предпочитайте свои протоколы вместо `file://`; проверьте **fuses** (`@electron/fuses`: выключить `RunAsNode` и `EnableNodeCliInspectArguments`, включить проверку целостности ASAR); выставляйте минимальный API через `contextBridge`.
- **Структура Electron-приложения:** main-процесс (Node) + preload (мост через `contextBridge.exposeInMainWorld`) + renderer (веб-код, собирается Vite). Используйте `ipcMain.handle`/`ipcRenderer.invoke` (на promise), а не `sendSync`. ESM в main-процессе поддерживается с Electron 28 `[не проверено]`. Инструменты: **Electron Forge 8** (официальный; плагин Vite, makers, publishers; `@electron-forge/cli` 8.0.1, Node >=22.13) или **electron-builder 26** (популярный, автообновление через `electron-updater`; 27 — в alpha). Подпись: нотаризация macOS (`@electron/notarize`), на Windows — Azure Trusted Signing или EV-сертификаты.
- **Производительность Electron:** main-процесс лёгкий (без синхронных ФС и IPC; CPU-работа — в `utilityProcess` или workers), ленивая загрузка модулей, V8 snapshots и бандл для старта, замеры через `--cpu-prof` и трассировку Chrome. Эти пункты перечисляет официальный гайд «Performance» `[не проверено]`.

```js
// main.js — окно и проверенный IPC
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'

function isTrustedSender(event) {                // свой протокол app:// вместо file://
  const url = URL.parse(event.senderFrame?.url ?? '')
  return url?.protocol === 'app:' && url.host === 'bundle'
}

ipcMain.handle('note:read', (event, id) => {
  if (!isTrustedSender(event)) throw new Error('untrusted IPC sender')
  if (typeof id !== 'string' || id.length > 64) throw new Error('bad id')
  return readNote(id)
})

app.whenReady().then(() => {
  new BrowserWindow({
    webPreferences: {
      preload: join(import.meta.dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })
})
```
```js
// preload.cjs — только конкретные функции, не весь ipcRenderer
const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  readNote: (id) => ipcRenderer.invoke('note:read', String(id)),
})
```

- **Tauri 2** (`@tauri-apps/cli` 2.12.4; 3.0 — в alpha) использует webview ОС и ядро на Rust: намного меньше бинарники и память, но webview различаются по платформам (WebKitGTK на Linux, WKWebView на macOS, WebView2 на Windows). Node-код работает как **sidecar**: соберите Node-приложение в бинарник (гайд Tauri использует `@yao-pkg/pkg`; так же работают Node SEA, `bun build --compile` и `deno compile`), назовите его `binaries/<name>-<target-triple>` (`rustc --print host-tuple`), объявите в `bundle.externalBin` и выдайте `shell:allow-execute` с `"sidecar": true` в capabilities; вызывайте `Command.sidecar(...)` из `@tauri-apps/plugin-shell`.
- **Альтернативы:** NW.js 0.118 (жив, Chromium и Node в одном контексте); Neutralinojs 11.8 (крошечный, без Node, расширения через WebSocket); **Electrobun** 2.0.x — десктоп-фреймворк на Bun и webview, в 2.0 Bun стал необязательным, а ядро переехало на Zig (по анонсу автора); проект молодой, перед продакшеном проверьте `[не проверено]`; Wails (Go) и Tauri (Rust), если бэкенд не обязан быть на JS.
- **Как выбрать.** Electron — когда нужны одинаковый Chromium везде, Node API в процессе, зрелое автообновление и самая большая экосистема (приложения класса VS Code, Slack, Discord). Tauri — когда важны размер бинарника и память, а бэкенд может быть на Rust или в sidecar. Обычное веб-приложение или PWA — когда интеграция с ОС не нужна.

**Ловушки**
- `nodeIntegration: true` + `contextIsolation: false` (старые туториалы) превращают XSS в RCE. `[устарело]` → `contextIsolation`, `sandbox`, `contextBridge`.
- `ipcRenderer` целиком через `contextBridge` вместо конкретных проверенных функций.
- Нативные модули не пересобраны под ABI Electron (`@electron/rebuild`; Forge делает это сам).
- Неподдерживаемый Electron (окно поддержки — около 6 месяцев на мажор).
- Sidecar Tauri без суффикса target triple — сборка падает; без разрешения в capabilities — отказ во время выполнения.

### Ресурсы
| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Electron docs](https://www.electronjs.org/docs/latest/) | OpenJS / Electron | Документация |
| [Security](https://www.electronjs.org/docs/latest/tutorial/security) | Electron | Чеклист безопасности из 20 пунктов |
| [Electron timelines](https://www.electronjs.org/docs/latest/tutorial/electron-timelines) / [Schedule](https://releases.electronjs.org/schedule) | Electron, 2026 | Ритм и политика поддержки; даты, Chromium и Node по мажорам |
| [Performance](https://www.electronjs.org/docs/latest/tutorial/performance) | Electron | Чеклист производительности |
| [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) / [Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses) / [ESM](https://www.electronjs.org/docs/latest/tutorial/esm) | Electron | `contextBridge`; fuses; ESM в Electron |
| [Electron Forge](https://www.electronforge.io/) | Electron | Forge |
| [electron-builder](https://www.electron.build/) | electron-builder | Упаковка и автообновление |
| [@electron/rebuild](https://github.com/electron/rebuild) | Electron | Пересборка нативных модулей |
| [Tauri 2](https://v2.tauri.app/) | Tauri | Документация Tauri 2 |
| [Node.js as a sidecar](https://v2.tauri.app/learn/sidecar-nodejs/) / [Sidecar](https://v2.tauri.app/develop/sidecar/) | Tauri | Гайд по Node sidecar; справочник |
| [NW.js](https://nwjs.io/) | NW.js | NW.js |
| [Neutralinojs](https://neutralino.js.org/) | Neutralinojs | Neutralino |
| [Electrobun 2.0](https://blackboard.sh/blog/electrobun-2-0/) | Yoav Givati, 2026 | Анонс Electrobun 2.0 `[не проверено]` |
| [Wails](https://wails.io/) | Lea Anthony | Альтернатива на Go (сайт отвечает 403 скриптам) `[не проверено]` |

---

## 5. Сборщики и инструменты сборки

### Ключевые выводы
- **Vite 8** (2026-03-12) использует **Rolldown как единственный сборщик** и в dev, и в prod вместо пары esbuild (dev) + Rollup (prod). Компилятор — Oxc (`@vitejs/plugin-react` v6 делает React Refresh через Oxc, без Babel). Node **20.19+ или 22.12+** (как у Vite 7). Слой совместимости сам переводит конфигурацию `esbuild`/`rollupOptions`; большие проекты мигрируют сначала через пакет `rolldown-vite` на Vite 7 (сейчас он объявлен deprecated в пользу Vite 8). Заявленный выигрыш production-сборки: Linear 46 с → 6 с, Ramp −57%, Beehiiv −64%; экспериментальный Full Bundle Mode — в 3 раза быстрее старт dev и в 10 раз меньше запросов. Vite 8.1 вышел 2026-06-23, последний — 8.3.6 (2026-11-05).
- **Rolldown** (1.x, последний 1.3.0 от 2026-11-05): Rust, API плагинов совместим с Rollup, transforms/define/inject/minify на уровне esbuild. Бенчмарк проекта (19k модулей, минификация + source maps): Rolldown 1,61 с, esbuild 1,70 с, Rspack 4,07 с, Rollup + esbuild 40,1 с. Сборка библиотек поверх него — tsdown ([раздел 2](#2-публикация-npm-библиотек)).
- **Владение и управление.** VoidZero (Vite, Vitest, Rolldown, Oxc, Vite+) **вошла в Cloudflare 2026-06-04**. Пост Vite обещает лицензию MIT, нейтральность к вендорам и управление командой Vite, плюс фонд экосистемы на $1M. **Vite+** (единый тулчейн: dev, build, test, lint, format) стал открытым (MIT) и вышел в alpha в марте 2026 `[не проверено]`.
- **Rspack 2.0** (2026-04-22; 2.3 — 2026-10-29): совместимый с webpack сборщик на Rust от ByteDance. `@rspack/core`, `cli`, `dev-server` теперь **чистый ESM** (CJS-сборки убраны, опираются на `require(esm)`); ESM-вывод включается явно (`output.module`); примерно на 10% быстрее 1.7 (prod-сборка без кеша 3,1 с против 3,6 с; с кешем 1,4 с против 2,2 с). Вместе с ним вышел Rsbuild 2. Лучшая цель миграции для больших webpack-приложений.
- **esbuild** 0.28.2 (2026-08): всё ещё 0.x и всё ещё самый быстрый простой сборщик и транспайлер для Node-скриптов и CLI (`--bundle --platform=node --format=esm`); им собирали CLI в замерах [раздела 1](#1-cli-и-tui). **webpack** 5.112 продолжает выходить, но новые проекты выбирают Vite или Rspack `[не проверено]`. **Parcel** 2.16.4 (2026-02) развивается медленно. **Turbopack** — только для Next.js ([domains-server.md](domains-server.md)).
- **Oxc** (oxc-transform 0.155, oxlint, oxfmt) и **SWC** (`@swc/core` 1.16) — транспайлеры на Rust под капотом. Babel в основном нужен только для своих плагинов (React Compiler и т. п.) `[не проверено]`.
- **Свои плагины и инструменты на Node:** пишите в ESM; используйте интерфейс плагинов Rollup/Rolldown (работает в Vite, Rolldown, tsdown) или `unplugin` для кросс-сборщиковых плагинов. Фильтры хуков (`filter: { id: /\.ts$/ }`) позволяют Rolldown проверить условие на стороне Rust и не вызывать JS для неподходящих модулей — это заметно ускоряет Rust-сборщики (документация Rolldown «Hook filters»; Vite поддерживает форму с 6.3, Rollup — с 4.38).
- **Производительность сборки:** меряйте `--profile`, `vite --debug` и `node --cpu-prof`. Узкое место Rust-сборщиков обычно в JS-плагинах (вызовы через границу языков). Кешируйте агрессивно (persistent cache в Rspack), держите Babel вне горячего пути.

```js
// плагин с фильтром хука: Rolldown не зовёт JS для остальных файлов
export function stripDebug() {
  return {
    name: 'strip-debug',
    transform: {
      filter: { id: /\.[cm]?[jt]s$/ },
      handler(code) {
        return code.replaceAll('debugger;', '')
      },
    },
  }
}
```
Объектная форма хука с `filter` и `handler` — часть API плагинов Rolldown и Vite 8; сверьте поля с [Plugin API](https://vite.dev/guide/api-plugin) вашей версии. Проверено локально на rolldown 1.3.0: плагин проходит проверку типов `Plugin` из rolldown и vite 8.3, `handler` вызывается только для подходящих по `id` модулей.

### Ресурсы
| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Announcing Vite 8](https://vite.dev/blog/announcing-vite8) | Vite team, 2026 | Rolldown по умолчанию, цифры, миграция |
| [Announcing Vite 8.1](https://vite.dev/blog/announcing-vite8-1) | Vite team, 2026 | 8.1 |
| [Cloudflare supports Vite](https://vite.dev/blog/cloudflare-supports-vite) | Vite team, 2026 | VoidZero в Cloudflare, обязательства |
| [Migration](https://vite.dev/guide/migration) / [Plugin API](https://vite.dev/guide/api-plugin) | Vite team | Гайд по миграции; API плагинов |
| [Rolldown](https://rolldown.rs/) / [benchmarks](https://github.com/rolldown/benchmarks) | Rolldown team | Обзор и бенчмарк; репозиторий бенчмарков |
| [Oxc](https://oxc.rs/) | Boshen и др. | Тулчейн Oxc |
| [VoidZero blog](https://voidzero.dev/blog) | VoidZero | Vite+ и анонсы тулчейна `[не проверено]` |
| [VoidZero joins Cloudflare](https://blog.cloudflare.com/voidzero-joins-cloudflare/) | Cloudflare, 2026 | Анонс сделки `[не проверено]` |
| [Announcing Rspack 2.0](https://rspack.rs/blog/announcing-2-0) / [Rspack blog](https://rspack.rs/blog/) | Rspack team, 2026 | Rspack 2.0; хронология 1.x → 2.3 |
| [Rsbuild](https://rsbuild.rs/) | Rspack team | Rsbuild |
| [esbuild](https://esbuild.github.io/) / [platform](https://esbuild.github.io/api/#platform) | Evan Wallace | Документация; семантика `--platform=node` |
| [webpack](https://webpack.js.org/) | webpack | webpack 5 |
| [SWC](https://swc.rs/) | Donny (kdy1) | SWC |
| [unplugin](https://unplugin.unjs.io/) | UnJS | Плагины для нескольких сборщиков |

---

## 6. Скрапинг и автоматизация браузера

### Ключевые выводы
- **Playwright** (1.65.0, 2026-11-05) — выбор по умолчанию для автоматизации браузера и E2E ([testing.md](testing.md)). Последние изменения: **1.65 убрал Node 20 (используйте 22/24/26)**, Docker-образы идут с Node 26, раннер тестов работает под Bun (`bunx --bun playwright test`, без watch), репортер `failures`; 1.64 добавил `page.webmcp` (вызов инструментов, которые страница регистрирует через экспериментальный WebMCP API) и `locator.within()`; 1.63 добавил `locator.visible()` и именованные блокировки тестов и перестал обновлять экспериментальные пакеты компонентных тестов React/Vue; 1.62 включил Playwright MCP-сервер и `playwright-cli` (`npx playwright mcp`) и принимает `AbortSignal` во многих операциях. Браузеры в 1.65: Chromium 158, Firefox 159, WebKit 27.2.
- **Puppeteer** 25.16 (2026-10-22, ESM, Node >=22.12) управляет Chrome и Firefox через CDP или WebDriver BiDi, headless по умолчанию. Менеджеры пакетов, которые блокируют install-скрипты (политики npm, pnpm, Yarn, Bun, Deno), пропускают скачивание Chrome → выполните `npx puppeteer browsers install`. Есть экспериментальная поддержка WebMCP; `chrome-devtools-mcp` от Google построен на Puppeteer.
- **Crawlee** 3.18 (Apify) оборачивает HTTP-краулинг (Cheerio/JSDOM) и браузерный (Playwright/Puppeteer): очереди, повторы, автомасштабирование, ротация сессий и прокси, fingerprinting. **Crawlee 4 — в RC** (dist-tag `rc`, 4.0.0-rc.1). Пост Crawlee от 2026-09 сравнивает stealth-патчи драйвера и подмену fingerprint.
- **Скрапинг по HTTP без браузера в 10–100 раз дешевле**, если страница рендерится на сервере: `fetch`/undici + **cheerio** 1.2 (ESM+CJS, Node >=20.18) для разбора; **linkedom** — быстрый DOM; jsdom 31, когда нужен более полный DOM (медленный); `@mozilla/readability` 0.6 (2025-03) — извлечение статьи. Прежде чем рендерить страницу, поищите JSON API или `__NEXT_DATA__` `[не проверено]`.
- **Конкурентность и вежливость.** Ограничивайте параллелизм на хост (p-limit/p-queue или автомасштабируемый пул Crawlee), соблюдайте `robots.txt` и лимиты, ставьте понятный User-Agent, кешируйте ответы, отступайте с jitter на 429/503. В браузере: один браузер и отдельный context на задачу (дёшево), а не браузер на страницу; картинки и шрифты блокируйте через `page.route`.
- **Право и этика.** Сбор персональных данных подпадает под GDPR/CCPA; нарушение ToS и обход контроля доступа несут юридический риск. Предпочитайте официальные API, храните только нужное.
- **Браузер для ИИ-агентов:** Playwright MCP и `chrome-devtools-mcp` дают LLM-агентам браузер через MCP ([раздел 7](#7-ии-и-llm-приложения)); Stagehand и библиотеки в духе browser-use добавляют действия под управлением LLM `[не проверено]`.

```js
// HTTP без браузера, если страница серверная
import * as cheerio from 'cheerio'
const res = await fetch(url, {
  headers: { 'user-agent': 'my-crawler/1.0 (+https://example.org/bot)' },
  signal: AbortSignal.timeout(15_000),
})
const $ = cheerio.load(await res.text())
const titles = $('h2 a').map((_, el) => $(el).text().trim()).get()
```
```js
// Браузер: один процесс, context на задачу, тяжёлые ресурсы отсечены
import { chromium } from 'playwright'
const BLOCK = new Set(['image', 'font', 'media'])
const browser = await chromium.launch()
try {
  for (const url of urls) {
    const context = await browser.newContext()
    await context.route('**/*', (route) =>
      BLOCK.has(route.request().resourceType()) ? route.abort() : route.continue())
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    console.log(await page.locator('h1').first().textContent())
    await context.close()
  }
} finally {
  await browser.close()
}
```

**Ловушки**
- Новый браузер на каждый URL (секунды на запуск, рост памяти) → один браузер, много contexts.
- `page.waitForTimeout(5000)` → ждите локаторы и сетевые состояния (`expect(locator).toBeVisible()`, `waitForResponse`).
- Установка браузеров во время работы в serverless или контейнере без системных зависимостей → официальный Docker-образ Playwright или `npx playwright install --with-deps` на этапе сборки.
- Разбор HTML регулярками; игнорирование кодировки (`charset` в `content-type`) на сайтах не в UTF-8.
- Видимый браузер с недоверенным контентом без песочницы: `--no-sandbox` только внутри изолированного контейнера.

### Ресурсы
| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Playwright docs](https://playwright.dev/docs/intro) / [Release notes](https://playwright.dev/docs/release-notes) | Microsoft, 2026 | Документация; изменения 1.62–1.65 |
| [Library](https://playwright.dev/docs/library) / [Browser contexts](https://playwright.dev/docs/browser-contexts) / [Network](https://playwright.dev/docs/network) / [Docker](https://playwright.dev/docs/docker) | Microsoft | Использование без тестов; изоляция; `page.route`; официальные образы |
| [playwright-mcp](https://github.com/microsoft/playwright-mcp) | Microsoft | Playwright MCP-сервер |
| [Puppeteer](https://pptr.dev/) / [WebDriver BiDi](https://pptr.dev/webdriver-bidi) | Google Chrome team, 2026 | Документация; BiDi в Puppeteer |
| [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Google | DevTools MCP |
| [Crawlee quick start](https://crawlee.dev/js/docs/quick-start) / [Crawlee blog](https://crawlee.dev/blog) | Apify, 2026 | Старт; пост о stealth и fingerprinting |
| [cheerio](https://cheerio.js.org/) | cheerio | Разбор HTML |
| [linkedom](https://github.com/WebReflection/linkedom) | Andrea Giammarchi | Быстрый DOM |
| [jsdom](https://github.com/jsdom/jsdom) | jsdom | Полный DOM |
| [readability](https://github.com/mozilla/readability) | Mozilla | Извлечение статьи |
| [p-queue](https://github.com/sindresorhus/p-queue) | Sindre Sorhus | Очереди с ограничением скорости |
| [RFC 9309: Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html) | IETF, 2022 | Стандарт `robots.txt` |

---

## 7. ИИ и LLM-приложения

### Ключевые выводы
- **Ландшафт (npm, 2026-11-06).** Vercel **AI SDK 7** (`ai` 7.0.0 — 2026-06-25, сейчас 7.0.163; ESM-only, Node >=22); пакеты провайдеров `@ai-sdk/anthropic`, `@ai-sdk/openai` и др.; `@ai-sdk/otel` 1.0 и `@ai-sdk/mcp` 2.0. SDK вендоров: `@anthropic-ai/sdk` **1.0.0 — 2026-10-21** (1.6.0 — 2026-11-05; в 1.5 добавлены классы ошибок по HTTP-статусу и коду ошибки API с `apiMessage`/`errorCode`/`details`), `openai` 7.53 (Node >=22), `@google/genai` **3.0.0 вышел 2026-11-06**. Агентные фреймворки: `@anthropic-ai/claude-agent-sdk` 0.3.x, `@openai/agents` 0.21, LangChain.js (`@langchain/core` 1.0 — 2025-10-17, сейчас 1.3.5; LangGraph.js 1.7), Mastra (`@mastra/core` 1.0 — 2026-01-20, сейчас 1.82). LlamaIndex.TS (`llamaindex` 0.12.1, 2025-12; `@llamaindex/core` объявлен deprecated) затих.
- **AI SDK 7** `[не проверено]` (по вторичному обзору анонса): ESM-only (CommonJS `require()` не поддерживается); слой «harness» (`HarnessAgent`) оборачивает готовых кодинг-агентов (Claude Code, Codex, Pi) в интерфейс агента SDK (это подтверждает вводная страница документации); телеметрия переделана на tracing channel Node плюс `@ai-sdk/otel`. Основа API: `generateText`/`streamText` с инструментами, структурированный вывод по схеме, агенты с циклом вызова инструментов, UI-хуки для React/Vue/Svelte. Берите AI SDK ради кода, не привязанного к провайдеру; SDK вендора — когда все его возможности нужны в день выхода (управление prompt caching, batch API, файлы, beta-заголовки).
- **MCP TypeScript SDK v2** (`@modelcontextprotocol/server` и `@modelcontextprotocol/client` 2.0.0 — 2026-07-27, сейчас 2.4.0; плюс `@modelcontextprotocol/node`) реализует **спецификацию MCP 2026-07-28**, даёт серверные транспорты stdio и Streamable HTTP с middleware для Node HTTP, Express, Fastify и Hono, использует **Standard Schema** (Zod 4, Valibot, ArkType…), работает на Node, Bun и Deno. Пакет v1 `@modelcontextprotocol/sdk` (1.32.2) получает исправления ошибок и безопасности не меньше шести месяцев после v2. Новые серверы начинайте на v2.
- **Инженерные правила для вызовов LLM в Node:**
  - Длинные генерации стримьте пользователю (`for await` по стриму SDK) и передавайте `AbortSignal` от запроса или CLI, чтобы отменённые запросы перестали тарифицироваться.
  - Явные таймауты и ограниченные повторы с backoff на 429/5xx. SDK вендоров повторяют сами — знайте умолчания (например, 2 повтора) и не наслаивайте свой цикл повторов сверху.
  - Структурированный вывод проверяйте схемой (Zod 4/Valibot) на границе; вывод модели — недоверенный ввод (никакого `eval`, подстановки в shell, санитизируйте HTML).
  - Инструменты: идемпотентные и с узкими правами; подтверждение человеком для разрушительных; логируйте входы и выходы инструментов для аудита.
  - Prompt injection: контент, который приносят инструменты (страницы, файлы, письма), может содержать инструкции — не давайте ему власти над инструментами с побочными эффектами.
  - Секреты: ключи API только на сервере (никогда в браузерном бандле или рендерере Electron); лимиты и учёт стоимости по арендаторам (usage токенов в ответах).
  - Наблюдаемость: семантические соглашения OpenTelemetry GenAI; интеграция AI SDK через tracing channel; пишите модель, токены, задержку, попадания в кеш.
  - Оценка: фиксированные наборы данных в CI (эталонные ответы или осторожно LLM-судья); закрепляйте версии моделей.
- **MCP-серверы на stdio:** stdout — канал протокола, **любой `console.log` портит поток**; логируйте в stderr. Собирайте сервер в один файл, чтобы `npx` стартовал быстро ([раздел 1](#1-cli-и-tui)).
- **Локальный инференс:** `node-llama-cpp` 3.22 (биндинги llama.cpp с готовыми бинарниками, GPU, грамматика по JSON-схеме), `@huggingface/transformers` 4.3 (Transformers.js на ONNX Runtime, в Node и браузере), `onnxruntime-node` 1.31, клиент `ollama` 0.6.4 для локального сервера Ollama. Тяжёлый инференс выносите в worker thread или отдельный процесс, чтобы не блокировать event loop ([concurrency-async-native.md](concurrency-async-native.md)).
- **Векторы и RAG:** pgvector через `pg`/Drizzle, SQLite с `sqlite-vec` или хостинговая векторная БД — серверная часть в [domains-server.md](domains-server.md).

```ts
// Стрим с отменой и лимитом времени (AI SDK 7; `abortSignal` и `textStream` сверены с типами `ai` 7.0.163)
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

const ac = new AbortController()
process.once('SIGINT', () => ac.abort())
const signal = AbortSignal.any([ac.signal, AbortSignal.timeout(120_000)])

const result = streamText({ model: openai('<model-id>'), prompt, abortSignal: signal })
for await (const chunk of result.textStream) process.stdout.write(chunk)
```
```ts
// stdio MCP-сервер: stdout занят протоколом
const log = (...args: unknown[]) => console.error('[mcp]', ...args)   // только stderr
```

**Ловушки**
- Ждать полный ответ перед отправкой пользователю (плохая задержка) → стримьте.
- Неограниченные циклы агента → ограничьте шаги (в AI SDK 7 — `stopWhen: stepCountIs(n)`; опции `maxSteps` в типах `ai` 7 нет) и общий объём токенов на запрос.
- Разбор JSON из свободного текста регулярками → структурированный вывод и проверка схемой.
- Ключ API в клиентском бандле Vite или Next (префиксы `VITE_`/`NEXT_PUBLIC_` раскрывают его).
- Отладка через `console.log` внутри stdio MCP-сервера.
- CJS-проект с ESM-only AI SDK 7: на Node 22.12+ `require('ai')` работает только без top-level await в графе; лучше перевести приложение на ESM.

### Ресурсы
| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [AI SDK: Introduction](https://ai-sdk.dev/docs/introduction) | Vercel, 2026 | Обзор AI SDK, включая harnesses |
| [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core/overview) / [Providers and models](https://ai-sdk.dev/docs/foundations/providers-and-models) | Vercel | Основные API; провайдеры |
| [Vercel weekly 2026-06-29](https://community.vercel.com/t/vercel-weekly-2026-06-29/44602) | Vercel community, 2026 | Дайджест релиза AI SDK 7 `[не проверено]` |
| [anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript) / [Releases](https://github.com/anthropics/anthropic-sdk-typescript/releases) | Anthropic, 2026 | TS SDK Anthropic; заметки 1.x |
| [Client SDKs](https://docs.claude.com/en/api/client-sdks) | Anthropic | Документация клиентских SDK |
| [openai-node](https://github.com/openai/openai-node) | OpenAI | Node SDK OpenAI |
| [js-genai](https://github.com/googleapis/js-genai) | Google | Google GenAI SDK |
| [MCP typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | MCP / Anthropic, 2026 | Статус SDK v2, транспорты |
| [MCP Specification](https://modelcontextprotocol.io/specification) | MCP | Спецификация протокола |
| [claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) | Anthropic | Claude Agent SDK |
| [OpenAI Agents SDK (JS)](https://openai.github.io/openai-agents-js/) | OpenAI | Agents SDK |
| [LangChain.js](https://js.langchain.com/) / [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) | LangChain | LangChain.js; LangGraph.js |
| [Mastra docs](https://mastra.ai/docs) | Mastra | Фреймворк Mastra |
| [node-llama-cpp](https://node-llama-cpp.withcat.ai/) | Gilad S. | Локальный llama.cpp в Node |
| [Transformers.js](https://huggingface.co/docs/transformers.js) | Hugging Face | Transformers.js |
| [ONNX Runtime for Node.js](https://onnxruntime.ai/docs/get-started/with-javascript/node.html) | Microsoft | ONNX Runtime в Node |
| [ollama-js](https://github.com/ollama/ollama-js) | Ollama | Клиент Ollama |
| [GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | OpenTelemetry | Атрибуты трассировки LLM-вызовов |
| [OWASP Top 10 for LLM](https://genai.owasp.org/llm-top-10/) | OWASP | Риски LLM-приложений |
| [Standard Schema](https://standardschema.dev/) | Colin McDonnell, Fabian Hiller, David Blass | Общий интерфейс библиотек схем |

---

## 8. IoT, железо и embedded

### Ключевые выводы
- **Node на одноплатнике (Raspberry Pi и т. п.) — нормально; Node на микроконтроллере — нет.** Для микроконтроллеров есть отдельные JS-движки: **Moddable SDK / XS** (реализует ECMA-419), **Espruino** (свой интерпретатор; npm CLI `espruino` 0.1.67, 2026-01), **Kaluma** (RP2040) `[не проверено]`. **ECMA-419** («ECMAScript embedded systems API», TC53) — **4-е издание (июнь 2026)**; рекомендует хосты с Hardened JavaScript.
- **Johnny-Five** (2.1.0, **2021-07**), **firmata.js** (2.3.0, 2020-11), **onoff** (6.0.3, 2021-04), **i2c-bus** (5.2.3, 2023-08) заброшены: могут ещё работать, но ждите проблем со сборкой нативных модулей на новых Node. Для GPIO на современной Raspberry Pi OS используйте интерфейс символьного устройства libgpiod (`node-libgpiod`) или вызывайте `gpioset`/`gpioget`/Python-помощники; sysfs GPIO, на котором стоит onoff, в Linux объявлен устаревшим `[не проверено]`.
- **serialport** 13.0.0 (2024-12-24, Node >=20) — по-прежнему стандарт для последовательного порта; в браузере его аналог — Web Serial.
- **Node-RED 5.0** (2026-06-09; сейчас 5.0.9) требует **Node >=22.9**, рекомендует Node 24 и убирает старые 32-битные ARM-платформы без современных сборок Node; линия 4.1 остаётся для окружений с Node 18–20 `[не проверено]` (даты и `engines` сверены по npm).
- **MQTT:** `mqtt` (MQTT.js) 5.16 (2026-10), поддержка MQTT 5, работает в Node и браузере (через WebSocket). QoS 1 + идемпотентные обработчики; задайте `clientId` и `clean: false` для постоянной сессии; переподключение с backoff встроено.
- **Ограничения:** на маленьких платах подберите `--max-old-space-size` под устройство; избегайте нативных аддонов, которые компилируются на устройстве (кросс-компиляция или готовые бинарники); запускайте как сервис `systemd` с политикой перезапуска.

```js
import { connect } from 'mqtt'
const client = connect('mqtts://broker.example.org', { clientId: 'sensor-42', clean: false })
client.on('connect', () => client.subscribe('cmd/sensor-42', { qos: 1 }))
client.on('message', (topic, payload) => handleOnce(topic, payload))   // идемпотентно
client.on('error', (err) => console.error('mqtt', err.message))
```
```ini
# /etc/systemd/system/sensor.service
[Service]
ExecStart=/usr/bin/node --max-old-space-size=128 /opt/sensor/main.js
Restart=on-failure
RestartSec=5
```

### Ресурсы
| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [ECMA-419](https://ecma-international.org/publications-and-standards/standards/ecma-419/) | Ecma TC53, 2026 | Стандарт API для встраиваемого JS |
| [Moddable](https://www.moddable.com/) | Moddable Tech | Движок XS, Moddable SDK |
| [Espruino](https://www.espruino.com/) | Gordon Williams | Espruino |
| [Kaluma](https://kalumajs.org/) | Kaluma | JS для RP2040 `[не проверено]` |
| [Johnny-Five](https://johnny-five.io/) | Rick Waldron и др. | `[устарело]`: без релизов с 2021 → serialport + библиотеки устройств, на MCU — Moddable |
| [serialport](https://serialport.io/) | serialport | Последовательный порт |
| [Node-RED](https://nodered.org/) | OpenJS | Node-RED |
| [Upgrade to NR 5.0: requirements not enforced](https://discourse.nodered.org/t/upgrade-to-nr-5-0-requirements-not-enforced-by-installation-script/101330) | Форум Node-RED, 2026 | Требование к Node в NR 5.0 `[не проверено]` |
| [MQTT.js](https://github.com/mqttjs/MQTT.js) | mqttjs | MQTT-клиент |
| [node-libgpiod](https://github.com/sombriks/node-libgpiod) | sombriks | Биндинги libgpiod `[не проверено]` |
| [GPIO sysfs interface](https://www.kernel.org/doc/html/latest/userspace-api/gpio/sysfs.html) | Linux kernel | Устаревший интерфейс sysfs GPIO |

---

## 9. Кросс-рантайм: Bun, Deno, Cloudflare Workers

### Ключевые выводы
- **Общая база — WinterTC.** Ecma **TC55 (WinterTC)**, преемник W3C-группы WinterCG, публикует **Minimum Common Web API**; первое издание (снимок 2025 года) принято Генеральной ассамблеей Ecma в **декабре 2025**, издания планируются ежегодно (редактор James M. Snell). Обязательные глобальные API: `fetch`/`Request`/`Response`/`Headers`, `URL`/`URLSearchParams`/**`URLPattern`**, `AbortController`/`AbortSignal`, `EventTarget`/`Event`, `Blob`/`File`/`FormData`, Web Streams + `TextEncoder`/`TextDecoder` (и потоковые варианты), `CompressionStream`, Web Crypto (`crypto.subtle`), `structuredClone`, `queueMicrotask`, семейство `setTimeout`, `atob`/`btoa`, `performance`, `navigator.userAgent`, `MessageChannel`, `WebAssembly.*`. Не входят: WebSocket, Web Storage, IndexedDB, workers, DOM. **Код только на этом списке работает в Node, Deno, Bun, Cloudflare Workers, edge Vercel/Netlify и браузерах.**
- **Runtime keys** (отчёт WinterTC, 23 ключа): `node`, `deno`, `bun`, `workerd`, `edge-light`, `netlify`, `fastly`, `react-native`, `react-server`, `electron`, `moddable`, `wasmer`, `quickjs` и др.; `browser` в список намеренно не входит; порядок отчёт не предписывает. Документация Node: предпочитайте `"node"` + `"default"` вместо `"node"` + `"browser"`, чтобы неизвестные рантаймы получили универсальную сборку.
- **Bun 1.4** (2026-08-20; сейчас 1.4.4): **рантайм переписан с Zig на Rust**; +1517 тестов из набора Node (вендорен набор Node v26.3.0); `node:http`, `fs`, `cluster`, `timers`, `zlib`, `vm`, `stream` проходят ~97% собственных тестов Node, `events`/`sqlite`/`trace_events` — 100%. Цифры вендора по старту: 5,1 мс Linux / 15,5 мс Windows против 27,2 / 40,1 мс у Node 26. Оставшиеся пробелы по странице совместимости Bun: нет `node:sea` (используйте `bun build --compile`); `node:inspector` частично (нет HeapProfiler); `node:test` частично (нет снапшотов, `mock.module` и покрытия — используйте `bun:test`); `module.register` ничего не делает (используйте `Bun.plugin`); `async_hooks.createHook` — заглушка (AsyncLocalStorage работает); в BoringSSL нет части кривых (secp256k1) и шифров. Смена ABI нативных аддонов в 1.4 требует пересборки `[не проверено]`. Частый паттерн: Bun как быстрый менеджер пакетов, раннер тестов и скриптов, а деплой на Node; поведение в продакшене проверяйте на целевом рантайме.
- **Deno 2.x:** спецификаторы `npm:` и `node:`, поддержка `package.json` и `node_modules` (`nodeModulesDir: none|auto|manual`, по умолчанию изолированная раскладка в стиле pnpm), CommonJS в `.cjs` или при `"type": "commonjs"`, Node-API аддоны с локальным `node_modules` и `--allow-ffi`, lifecycle-скрипты заблокированы без одобрения (`--allow-scripts`/`deno approve-scripts`), npm `min-release-age` по умолчанию 24 ч с 2.9, в 2.8 проходит >75% набора тестов Node. Deno 2.7 (2026-02-25) стабилизировал Temporal; 2.8 (2026-05-22) добавил `import defer`; 2.9 (2026-06-25) добавил `deno desktop`, миграцию с npm/pnpm/yarn и совместимость с Node 26. Проверено локально: ESM-скрипт на `node:util` (`parseArgs`/`styleText`), `fs/promises`, commander и picocolors из `node_modules` и `import.meta.dirname` работает **без изменений** в Node 24.17 и Deno 2.8.3 (Deno сообщает `process.version` v24.15.0). Старт hello-world на той же Windows-машине: Deno ≈3,2× медленнее Node (медианы 21 чередующегося запуска, Defender включён; цифры вендоров другие).
- **Будущее Deno изменилось 2026-10-09: команда Deno переходит в Cloudflare.** По анонсу: Cloudflare поддерживает рантайм Deno **ещё один год с ежемесячными релизами исправлений и безопасности, после чего разработка прекращается** (код остаётся открытым, другие могут продолжить); **Deno Deploy закрывается через шесть месяцев** (помощь с миграцией на Workers); **JSR продолжает работать** на инфраструктуре Cloudflare; rusty_v8 развивается дальше. Последствия:
  - не берите Deno основным продакшен-рантаймом и Deno Deploy хостингом без плана выхода;
  - проекты на Deno Deploy планируйте переносить в течение полугода (Workers, Node-хостинг);
  - библиотекам держите совместимость с Deno дешёвой (API WinterTC, публикация в JSR), но не зависьте от Deno-only API (`Deno.*`);
  - вместе с VoidZero (Vite, Vitest, Rolldown, Oxc, июнь 2026, [раздел 5](#5-сборщики-и-инструменты-сборки)) Cloudflare теперь финансирует большую часть JS-тулчейна и рантаймов — учитывайте это как риск концентрации.
- **Cloudflare Workers (workerd):** для compatibility date **>= 2026-08-04 `nodejs_compat` включён по умолчанию**. Полностью поддерживаются `fs`, `net`, `http`/`https`, `crypto`, `buffer`, `stream`, `zlib`, `diagnostics_channel` и др.; частично — `dns`, `tls`, `os`, `module`, `perf_hooks`; `child_process`, `worker_threads`, `vm`, `http2`, `cluster`, `sqlite` импортируются как **заглушки**, методы которых не работают. Wrangler подставляет полифиллы unenv, которые бросают `[unenv] … is not implemented yet!`.
- **Edge-функции Vercel/Netlify** — изоляты V8 с Web API (ключи `edge-light`, `netlify`); когда нужны полные `node:` API, берите их Node-рантаймы `[не проверено]`. Serverless-деплой — в [domains-server.md](domains-server.md).
- **unenv** (UnJS): последняя стабильная в npm — 1.10.0 (2024-07), а 2.0 остаётся в RC (`2.0.0-rc.24`), и именно её используют Wrangler и Nitro.

### Правила для библиотеки, которая работает везде
1. Сначала глобальные API WinterTC: `fetch`, `URL`, `crypto.subtle`/`crypto.randomUUID()`, `TextEncoder`, Web Streams, `AbortSignal.timeout`, `structuredClone`; в публичном API — `Uint8Array`, а не `Buffer`.
2. Никаких побочных эффектов на верхнем уровне: ни чтения ФС, ни env, ни сети при импорте (edge-рантаймы запрещают I/O вне обработчиков; это ещё и бьёт по холодному старту).
3. Конфигурация — из аргументов, а не из `process.env` (Workers передают `env` в обработчик, Deno требует разрешений).
4. Рантайм-специфичный код — за **conditional exports**; `types` первым, `default` последним, `default` = универсальная сборка только на Web API:
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "workerd": "./dist/workerd.js",
      "deno": "./dist/deno.js",
      "bun": "./dist/bun.js",
      "node": "./dist/node.js",
      "default": "./dist/web.js"
    }
  }
}
```
5. В ESM нет `__dirname` и `require`: используйте `import.meta.url`/`import.meta.dirname` (Node 20.11+, Deno, Bun) с запасным вариантом; не используйте `import.meta.resolve` в бандлах для SEA (там не поддерживается).
6. Определяйте рантайм только там, где без этого нельзя: `navigator.userAgent` (обязателен по WinterTC; например `Node.js/26`, `Deno/2.9`, `Bun/1.4`, `Cloudflare-Workers` `[не проверено]` для точных строк) или `std-env` (`runtime`, `isBun`, `isDeno`, `isWorkerd`, определение провайдера).
7. Публикуйте ESM-only ([раздел 2](#2-публикация-npm-библиотек)) в npm, а если пользователи Deno важны — и в JSR.
8. **Тестируйте на каждой цели в CI:** матрица `actions/setup-node` (22/24/26), `oven-sh/setup-bun`, `denoland/setup-deno`, а Workers — через `@cloudflare/vitest-pool-workers` или `wrangler dev`. «Работает на Node» — не доказательство для Workers: заглушки импортируются и падают при вызове.

### Матрица совместимости (ноябрь 2026)
| Вопрос | Node 24/26 | Bun 1.4 | Deno 2.9 | Cloudflare Workers |
|---|---|---|---|---|
| ESM / CJS | оба; `require(esm)` | оба | ESM; CJS через `.cjs`/`type` | ESM (бандлит Wrangler) |
| Встроенные `node:` | эталон | ~97% тестов основных модулей | большинство; >75% набора Node (2.8) | многие нативно, часть — заглушки |
| npm-пакеты | нативно | нативно (`bun install`) | `npm:` / `package.json` | в бандле; нативные аддоны ✗ |
| Нативные аддоны (N-API) | ✓ | ✓ (пересборка под ABI 1.4) `[не проверено]` | ✓ с локальным `node_modules` + `--allow-ffi` | ✗ |
| `node:test` | ✓ | частично (используйте `bun:test`) | ✓ (есть и `deno test`) | частично |
| Один исполняемый файл | SEA (`--build-sea` с 25.5) | `bun build --compile` | `deno compile` | — |
| TypeScript без сборки | type stripping (только стираемый синтаксис) | ✓ | ✓ (типы проверяет `deno check`) | через бандл Wrangler |
| Долгосрочный статус | OpenJS, расписание LTS | Oven (независимая) | только поддержка до ~2027-10, потом сообщество | платформа Cloudflare |

**Ловушки**
- Ожидать, что `process.env` есть при загрузке модуля в Workers или что записи в `fs` сохраняются (в Workers `fs` виртуальная, на запрос) `[не проверено]`.
- `Buffer` в публичном API — ломается в браузере и на edge; используйте `Uint8Array`.
- Условия `"browser"`/`"node"` без `"default"` — неизвестные рантаймы не разрешат импорт.
- Считать заглушки рабочими (`child_process` в Workers импортируется, потом бросает).
- Bun- или Deno-only API (`Bun.file`, `Deno.readFile`) в библиотеке для npm.
- Сравнивать рантаймы по старту hello-world и обобщать на реальные приложения (цифры старта Bun тоже из hello-world) `[не проверено]`.

### Ресурсы
| Ресурс | Автор, год | Зачем читать |
|---|---|---|
| [Minimum Common Web API](https://min-common-api.proposal.wintertc.org/) | Ecma TC55 (ред. James M. Snell), 2026 | Общий набор Web API |
| [WinterTC](https://wintertc.org/) / [Runtime keys](https://runtime-keys.proposal.wintertc.org/) | Ecma TC55 | Домашняя страница; ключи рантаймов |
| [Bun v1.4](https://bun.com/blog/bun-v1.4) | Oven, 2026 | Переписывание на Rust, совместимость, старт |
| [Bun: Node.js compatibility](https://bun.com/docs/runtime/nodejs-compat) | Oven, 2026 | Совместимость по модулям |
| [Bun 1.4 (gihyo.jp)](https://gihyo.jp/article/2026/08/bun-1.4) | gihyo.jp, 2026 | Ломающие изменения Bun 1.4 (на японском) `[не проверено]` |
| [Deno: Node and npm compatibility](https://docs.deno.com/runtime/fundamentals/node/) | Deno, 2026 | Совместимость с Node и npm |
| [Deno blog](https://deno.com/blog) / [Deno 2.9](https://deno.com/blog/v2.9) / [Deno 2.8](https://deno.com/blog/v2.8) | Deno, 2026 | Посты о релизах 2.7–2.9; `import defer` в 2.8 |
| [Deno joins Cloudflare](https://deno.com/blog/cloudflare) | Ryan Dahl, 2026 | Команда Deno в Cloudflare; планы по рантайму, Deploy, JSR |
| [Workers: Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) | Cloudflare, 2026 | Node API в Workers |
| [Compatibility dates](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) / [Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/) | Cloudflare | Даты и флаги совместимости; тесты Workers в Vitest |
| [unenv](https://github.com/unjs/unenv) / [std-env](https://github.com/unjs/std-env) | UnJS | Полифиллы Node для других рантаймов; определение рантайма |
| [Conditional exports](https://nodejs.org/api/packages.html#conditional-exports) | Node.js | Условия и их порядок |
| [Hono: Basic](https://hono.dev/docs/getting-started/basic) | Yusuke Wada | Пример фреймворка под много рантаймов |
| [setup-bun](https://github.com/oven-sh/setup-bun) / [setup-deno](https://github.com/denoland/setup-deno) | Oven / Deno | Настройка CI |
| [Vercel Edge runtime](https://vercel.com/docs/functions/runtimes/edge) | Vercel | Ограничения edge-рантайма |

---

## 10. Симптомы и техники

| Симптом или замечание ревью | Техника | Источник |
|---|---|---|
| `--help` у CLI идёт 200–500 мс | Бандл в один файл; ленивый `import()` на подкоманду; затем `module.enableCompileCache()` | [раздел 1](#стоимость-старта-и-как-её-снизить); [Module compile cache](https://nodejs.org/api/module.html#module-compile-cache) |
| Compile cache «не помогает» | Ожидаемо на множестве мелких файлов; сначала бандл (0,5× было только на большом едином файле) | [раздел 1](#стоимость-старта-и-как-её-снизить) |
| `ERR_REQUIRE_ESM` у CJS-потребителя | В Node >=22.12/20.19 есть `require(esm)`: поднимите Node у потребителя или выпускайте dual | [Joyee Cheung](https://joyeecheung.github.io/blog/2025/12/30/require-esm-in-node-js-from-experiment-to-stability/) |
| `ERR_REQUIRE_ASYNC_MODULE` | Уберите top-level `await` из графа входной точки библиотеки | [Packages](https://nodejs.org/api/packages.html) |
| Нужен `require('pkg').default` | Именованные экспорты или `export { x as "module.exports" }` | [раздел 2](#2-публикация-npm-библиотек); [Anthony Fu](https://antfu.me/posts/move-on-to-esm-only) |
| `ERR_PACKAGE_PATH_NOT_EXPORTED` | Добавьте подпуть в `exports` (или импортируйте публичную точку) | [Packages](https://nodejs.org/api/packages.html) |
| У TS-потребителей `any` или не те типы | `types` первым в каждом условии; отдельные `.d.ts`/`.d.cts`; запустите attw | [arethetypeswrong](https://github.com/arethetypeswrong/arethetypeswrong.github.io) |
| publint `FILE_NOT_PUBLISHED` | Поправьте белый список `files` / соберите перед публикацией | [publint rules](https://publint.dev/rules) |
| Долгоживущий npm-токен в CI | Trusted publishing (OIDC) + «disallow tokens»; по желанию staged publishing | [Trusted publishing](https://docs.npmjs.com/trusted-publishers) |
| `spawn npm ENOENT/EINVAL` на Windows | `shell: true` с фиксированными аргументами или execa/tinyexec/cross-spawn | [раздел 3](#3-скрипты-и-автоматизация); CVE-2024-27980 |
| Инъекция команд через шаблон в `exec` | `execFile` с массивом аргументов; экранирование шаблонов execa/zx | [child_process](https://nodejs.org/api/child_process.html) |
| Рендерер Electron достаёт до Node | `contextIsolation`, `sandbox`, минимальный `contextBridge`, проверка отправителя IPC | [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security) |
| Медленная production-сборка на webpack | Миграция на Rspack 2 (совместим с webpack) или Vite 8 | [Rspack 2.0](https://rspack.rs/blog/announcing-2-0); [Vite 8](https://vite.dev/blog/announcing-vite8) |
| Медленная сборка на Vite 7 | Vite 8 (Rolldown); проверьте JS-плагины (фильтры хуков) | [Vite 8](https://vite.dev/blog/announcing-vite8) |
| Скрапер съедает память | Один браузер, много contexts; блокировка тяжёлых ресурсов; HTTP без браузера, где можно | [Browser contexts](https://playwright.dev/docs/browser-contexts) |
| stdio MCP-сервер: «invalid JSON» | Логи только в stderr, никогда в stdout | [MCP Specification](https://modelcontextprotocol.io/specification) |
| Библиотека ломается на Workers/edge | API WinterTC, никакого I/O при импорте, условие `default`, CI на workerd | [Minimum Common Web API](https://min-common-api.proposal.wintertc.org/); [Workers Node.js](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) |
| У Puppeteer нет Chrome после установки | Install-скрипты заблокированы → `npx puppeteer browsers install` | [Puppeteer](https://pptr.dev/) |
| Проект на Deno Deploy или Deno как основной рантайм | План миграции: Deploy закрывается через полгода после 2026-10-09, рантайм — год исправлений | [Deno joins Cloudflare](https://deno.com/blog/cloudflare) |

---

## 11. Чеклисты ревью

### Чеклист: CLI
- [ ] `--help` и `--version` не грузят тяжёлых модулей; старт измерен (цель — меньше ~100 мс до первого вывода на ноутбуке разработчика).
- [ ] Распространяется одним бандлом (или SEA/скомпилированным бинарником); compile cache включён в точке входа.
- [ ] Данные — в stdout, диагностика — в stderr; `--json` для машин; без цветов и спиннеров вне TTY; `NO_COLOR`/`FORCE_COLOR` учитываются.
- [ ] Никаких вопросов, если stdin не TTY; есть `--yes`/`--no-input`; разрушительные действия требуют подтверждения или `--force`.
- [ ] Коды выхода: 0 — успех, 1 — сбой, 2 — ошибка использования; `process.exitCode` вместо `process.exit()` посреди записи.
- [ ] Ctrl-C обработан: очистка с таймаутом, второй Ctrl-C завершает сразу.
- [ ] Секреты не принимаются флагами; приоритет конфигурации: флаги > env > проект > пользователь > система.
- [ ] `engines.node` соответствует требованиям зависимостей (commander 15/chalk 6/execa 10 → Node 22).
- [ ] Подпроцессы — с массивом аргументов, таймаутом или `AbortSignal`, работают на Windows.

### Чеклист: библиотека
- [ ] ESM-only, если документированный потребитель не требует CJS; `"type"` задан; `engines.node` объявлен.
- [ ] `exports` покрывает все публичные точки; `types` первым, `default` последним; `./package.json` экспортирован, если нужен инструментам.
- [ ] При dual — отдельные декларации на формат (`.d.ts` + `.d.cts`).
- [ ] Нет top-level `await` в графе входной точки; нет default export (или есть строковый экспорт `"module.exports"`).
- [ ] Белый список `files`; `npm pack --dry-run` просмотрен; `sideEffects` задан верно.
- [ ] `publint --strict` и `attw --pack` (нужный профиль) проходят в CI.
- [ ] Публикация через trusted publishing с provenance; публикация токенами запрещена; по желанию staged publishing.
- [ ] Changelog/changesets; ломающие изменения = мажор (переход на ESM, повышение `engines`, удалённый подпуть).
- [ ] Работает на заявленных рантаймах (матрица CI: Node 22/24/26, Bun, Deno, workerd, если заявлены).

### Чеклист: десктоп (Electron)
- [ ] Поддерживаемый мажор Electron (три последних); `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- [ ] Preload выставляет конкретные функции; IPC-обработчики проверяют `event.senderFrame` и аргументы.
- [ ] CSP задан; навигация и `window.open` ограничены; `shell.openExternal` — только для URL из белого списка.
- [ ] Fuses настроены (`RunAsNode` выключен, проверка целостности ASAR включена); приложение подписано и нотаризовано.

### Чеклист: скрипты и автоматизация
- [ ] Встроенные API там, где они есть (`fs.cp`, `fs.rm`, `fs.glob`, `parseArgs`, `fetch`).
- [ ] Никакой подстановки переменных в строки shell; таймауты на каждый подпроцесс и сетевой вызов.
- [ ] Работает на Windows (пути через `node:path`, нет bash-only синтаксиса, обёртки `.cmd` учтены).

### Чеклист: ИИ и LLM
- [ ] Стриминг и проброс `AbortSignal`; таймауты и ограниченные повторы (без двойных циклов повторов).
- [ ] Структурированный вывод проверяется схемой; вывод модели считается недоверенным.
- [ ] Права инструментов сужены; разрушительные инструменты требуют подтверждения; лимиты шагов агента и токенов.
- [ ] Ключи только на сервере; usage и стоимость логируются; версии моделей закреплены; набор для оценки в CI.

---

## 12. Антипаттерны
- `[устарело]` Dual CJS/ESM по умолчанию для новых библиотек «на всякий случай» → ESM-only: `require(esm)` есть во всех поддерживаемых линиях Node.
- `[устарело]` `typesVersions` для типов подпутей → `exports` с условием `types`.
- `[устарело]` Поля `"module"`, `"jsnext:main"`, строковый `"browser"` как основной механизм точек входа → условия `exports`.
- `[устарело]` Vercel `pkg`, `nexe`, `caxa` для одного бинарника → Node SEA (`--build-sea`), `@yao-pkg/pkg`, `bun build --compile`, `deno compile`.
- `[устарело]` tsup для новых библиотек → tsdown (так советует README tsup).
- `[устарело]` `postject` + `--experimental-sea-config` на Node 25.5+ → `node --build-sea`.
- `[устарело]` rimraf, mkdirp, fs-extra для базовых операций → `rm`/`mkdir({recursive})`/`cp` из `fs/promises`.
- `[устарело]` keytar → `@napi-rs/keyring`; prompts/enquirer → @clack/prompts или @inquirer/prompts; Johnny-Five/onoff для новых проектов с железом → serialport + libgpiod, на MCU — Moddable.
- `[устарело]` Рендереры Electron с `nodeIntegration: true` и модуль `remote` → `contextIsolation` + `contextBridge` + IPC.
- `[устарело]` Пакет `rolldown-vite` → Vite 8.
- Source maps и тесты в npm-tarball «потому что они лежали в dist».
- `postinstall`-скрипты, которые скачивают бинарники (по умолчанию заблокированы в pnpm 10+, Bun, Deno; не любимы из-за цепочки поставок) → опциональные платформенные зависимости (паттерн esbuild/Rolldown).
- Жёстко прописанные `/`-пути и bash в npm scripts → кроссплатформенные Node-скрипты.
- Рантайм-специфичный API в библиотеке (`Bun.*`, `Deno.*`), когда есть Web- или `node:` API.

---

## 13. Спорные места
1. **ESM-only или dual (2026).** Joyee Cheung и Anthony Fu считают, что `require(esm)` делает ESM-only правильным умолчанием, а dual-сборки — лишним риском. Возражение: CJS-потребители TypeScript на `module: node16`/`node10`, старые конфигурации Jest и часть пайплайнов сборщиков всё ещё ломаются, поэтому широко используемые пакеты с наследием (SDK вендоров вроде `openai`, `@anthropic-ai/sdk`, Zod, `@modelcontextprotocol/sdk` v1) по-прежнему выходят dual. Рекомендация: ESM-only для нового кода; dual — только для большой существующей CJS-аудитории и с attw в CI.
2. **Условие `module-sync`.** Позволяет одной ESM-сборке обслуживать `require` на Node 22.12+ с откатом на CJS в других местах. Часть инструментов (TypeScript, сборщики) понимает его неодинаково `[не проверено]`, поэтому большинство авторов его не используют.
3. **commander, yargs, citty/cac или `util.parseArgs`.** commander — безопасное умолчание; yargs тяжёл на старте; крошечные парсеры выигрывают в скаффолдерах; `parseArgs` хватает для утилиты с одной командой. Измеренная стоимость импорта различается в 20 раз (8 мс против 163 мс; проверено локально на Node 24.17 (Windows 11)).
4. **Бандлить CLI или поставлять `node_modules`.** Бандл ускоряет старт в 1,5–4 раза (по замерам) и убирает риск разрешения зависимостей при установке, но прячет зависимости от `npm audit` и SBOM и усложняет соблюдение лицензий (аргумент об аудите — `[не проверено]`); генерируйте файл лицензий сторонних пакетов.
5. **Electron или Tauri.** Electron: одинаковый Chromium, Node в процессе, зрелое автообновление; тяжёлый. Tauri: маленький и быстрый, но различия webview и бэкенд на Rust или в sidecar. Команды, знающие только JS, обычно выбирают Electron.
6. **Bun и Deno в продакшене.** Прирост совместимости в Bun 1.4 большой, но всё ещё меньше 100%; рантайм Deno после перехода в Cloudflare на год переходит в режим только исправлений. Многие команды используют Bun для инструментов (установка, тесты), а Node — в продакшене.
7. **SDK вендора или AI SDK.** Провайдер-нейтральный AI SDK облегчает смену моделей; SDK вендоров первыми получают новые возможности. Смешанное использование обычно: AI SDK для UI и стриминга, SDK вендора для batch и кеширования.
8. **zx в 2026.** Удобен и популярен, но без релизов с 2025-10 и с зависимостью от bash на Windows; альтернативы — execa 10 + обычный Node или Bun Shell.
9. **Что осталось непроверенным.** Не прочитаны полностью: список ломающих изменений в гайде миграции Vite 8, гайд миграции Rspack 2, официальный анонс AI SDK 7 (только вторичный обзор), заметки к релизу `@anthropic-ai/sdk` 1.0.0 (видны только 1.4–1.6), текст поста Deno 2.9, статус Electrobun 2.0 (вторичные источники расходятся). Стабильность `fs.glob` по линиям, `maxBuffer` у `exec` и поведение CVE-2024-27980 не перепроверялись. Есть ли `import defer` в Node 26 — не проверено на бинарнике Node 26. Утверждения о Bun взяты у вендора: локально Bun не устанавливался.
