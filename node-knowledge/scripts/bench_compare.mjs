#!/usr/bin/env node
// Сравнивает прогоны бенчмарков «до» и «после» по их JSON-файлам. Без зависимостей, Node 18+.
//
// Запуск: node bench_compare.mjs <base> <diff> [--threshold 5]
// <base> и <diff> — JSON-файл одного прогона или папка с JSON нескольких прогонов.
//
// Понимает форматы (определяются по содержимому файла):
// - mitata:    await run({ format: 'json' })           → node bench.mjs > bench/before/run1.json
// - Vitest 5:  vitest bench --run --reporter=json --outputFile.json=bench/before/run1.json
// - hyperfine: hyperfine --export-json run1.json '<команда>'
// - общий:     { "unit": "ns" | "us" | "ms" | "s", "benchmarks": [{ "name", "median", "q1", "q3", "mean"? }] }
//              в него выгружают tinybench и любой другой инструмент, см. references/pipeline.md
//
// Шум между прогонами одного и того же кода на обычной машине доходит до 5-10%,
// и статистика одного прогона его не видит. Поэтому снимайте по 5 прогонов на сторону,
// чередуя «до» и «после» и меняя порядок (A B B A A B B A A B): прогон сразу после другого
// варианта бывает систематически быстрее или медленнее. Вердикт ставится так:
// - несколько прогонов на сторону: «faster»/«slower», только если медиана медиан сдвинулась
//   больше порога и медианы всех прогонов одной стороны лежат строго по одну сторону от другой;
// - по одному прогону: то же по порогу и непересечению межквартильных интервалов,
//   с предупреждением, что такому вердикту доверять нельзя.
// Иначе «same» (в пределах шума). Бенчмарк только с одной стороны — «only-base»/«only-diff»,
// упавший хотя бы в одном прогоне — «failed».
// Если среднее больше медианы в 1,25 раза, скрипт предупреждает: возможен недогрев JIT, GC или деоптимизации.
// Код выхода: 0 — регрессий нет; 1 — есть «slower», «failed» или «only-base» (бенчмарк пропал из diff);
// 2 — ошибка ввода: нет файлов, неизвестный формат, одно имя дважды в файле, нечисловые значения, нет общих бенчмарков.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const UNIT_NS = { ns: 1, us: 1e3, ms: 1e6, s: 1e9 }
// Среднее заметно выше медианы: в выборке тяжёлый хвост или две моды (вызовы до оптимизации JIT, GC, деоптимизации).
const SKEW_LIMIT = 1.25

/** Квантиль отсортированного массива с линейной интерполяцией. */
function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function median(values) {
  return quantile([...values].sort((a, b) => a - b), 0.5)
}

/** mitata: benchmarks[].runs[].stats.{p25,p50,p75} в наносекундах. */
function fromMitata(data) {
  const out = []
  for (const bench of data.benchmarks) {
    const group = data.layout?.[bench.group]?.name
    for (const run of bench.runs) {
      const name = group ? `${group} > ${run.name}` : run.name
      if (!run.stats) {
        // бенчмарк упал, у прогона есть только error
        out.push({ name, error: String(run.error?.message ?? run.error ?? 'no stats') })
        continue
      }
      out.push({ name, median: run.stats.p50, q1: run.stats.p25, q3: run.stats.p75, mean: run.stats.avg })
    }
  }
  return out
}

/**
 * Vitest 5, JSON-репортёр: testResults[].assertionResults[].benchmarks[].tasks[], статистика tinybench в мс.
 * У tinybench нет p25, поэтому q1 оценивается симметрично: p50 - (p75 - p50).
 * Строки из bench.from() (fromStore) — сохранённые данные, а не замер этого прогона; они пропускаются.
 */
function fromVitest(data) {
  const out = []
  for (const file of data.testResults) {
    for (const test of file.assertionResults ?? []) {
      for (const group of test.benchmarks ?? []) {
        for (const task of group.tasks) {
          if (task.fromStore || !task.latency) continue
          const { p50, p75, mean } = task.latency
          out.push({ name: `${group.name} > ${task.name}`, median: p50 * 1e6, q1: (2 * p50 - p75) * 1e6, q3: p75 * 1e6, mean: mean * 1e6 })
        }
      }
    }
  }
  return out
}

/** hyperfine --export-json: results[].times в секундах. */
function fromHyperfine(data) {
  return data.results.map((r) => {
    const times = [...r.times].sort((a, b) => a - b)
    return {
      name: r.command,
      median: quantile(times, 0.5) * 1e9,
      q1: quantile(times, 0.25) * 1e9,
      q3: quantile(times, 0.75) * 1e9,
    }
  })
}

/** Общий формат: { unit, benchmarks: [{ name, median, q1, q3 }] }. */
function fromGeneric(data) {
  const unit = data.unit ?? 'ns'
  if (!Object.hasOwn(UNIT_NS, unit)) throw new TypeError(`unknown unit "${unit}"`)
  const scale = UNIT_NS[unit]
  return data.benchmarks.map((b) => {
    for (const key of ['median', 'q1', 'q3']) {
      if (typeof b[key] !== 'number') throw new TypeError(`benchmark "${b.name}" has no numeric ${key}`)
    }
    const mean = typeof b.mean === 'number' ? b.mean * scale : undefined
    return { name: b.name, median: b.median * scale, q1: b.q1 * scale, q3: b.q3 * scale, mean }
  })
}

function parseFile(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'))
  if (Array.isArray(data.results) && data.results[0]?.times) return fromHyperfine(data)
  if (Array.isArray(data.testResults)) return fromVitest(data)
  if (Array.isArray(data.benchmarks) && data.benchmarks[0]?.runs) return fromMitata(data)
  if (Array.isArray(data.benchmarks)) return fromGeneric(data)
  throw new TypeError(`${file}: unknown format (expected mitata, Vitest 5 JSON reporter, hyperfine or generic JSON)`)
}

/**
 * Читает один JSON или все *.json из папки.
 * Возвращает runs (имя бенчмарка → прогоны) и failed (имена бенчмарков, упавших хотя бы в одном прогоне).
 * Одно имя дважды в одном файле, нечисловые значения и медиана <= 0 — ошибка ввода.
 */
function loadRuns(path) {
  const files = statSync(path).isDirectory()
    ? readdirSync(path).filter((f) => f.endsWith('.json')).sort().map((f) => join(path, f))
    : [path]
  if (files.length === 0) throw new Error(`no *.json in ${path}`)
  const runs = new Map()
  const failed = new Set()
  for (const file of files) {
    const seen = new Set()
    for (const run of parseFile(file)) {
      if (seen.has(run.name)) throw new Error(`${file}: benchmark "${run.name}" appears twice; give benchmarks unique names`)
      seen.add(run.name)
      if (run.error !== undefined) {
        failed.add(run.name)
        continue
      }
      if (![run.median, run.q1, run.q3].every(Number.isFinite) || run.median <= 0) {
        throw new Error(`${file}: benchmark "${run.name}" has non-finite or non-positive statistics`)
      }
      if (!runs.has(run.name)) runs.set(run.name, [])
      runs.get(run.name).push(run)
    }
  }
  return { runs, failed }
}

const center = (runs) => median(runs.map((r) => r.median))

/** Вероятность, что n и m прогонов одного и того же кода случайно разделятся полностью: 2 / C(n+m, n). */
function chanceSeparation(n, m) {
  let binom = 1
  for (let i = 1; i <= n; i++) binom = (binom * (m + i)) / i
  return 2 / binom
}

function verdict(base, diff, threshold) {
  const change = center(diff) / center(base) - 1
  let separatedDown
  let separatedUp
  if (base.length > 1 && diff.length > 1) {
    separatedDown = Math.max(...diff.map((r) => r.median)) < Math.min(...base.map((r) => r.median))
    separatedUp = Math.min(...diff.map((r) => r.median)) > Math.max(...base.map((r) => r.median))
  } else {
    // Хотя бы с одной стороны один прогон: сравниваются межквартильные интервалы (медианы квартилей по прогонам).
    const q = (runs, key) => median(runs.map((r) => r[key]))
    separatedDown = q(diff, 'q3') < q(base, 'q1')
    separatedUp = q(diff, 'q1') > q(base, 'q3')
  }
  if (change < -threshold && separatedDown) return 'faster'
  if (change > threshold && separatedUp) return 'slower'
  return 'same'
}

function fmtTime(ns) {
  for (const [unit, scale] of [['s', 1e9], ['ms', 1e6], ['us', 1e3]]) {
    if (ns >= scale) return `${(ns / scale).toFixed(3)} ${unit}`
  }
  return `${ns.toFixed(1)} ns`
}

function main(argv) {
  let args
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: { threshold: { type: 'string', default: '5' }, help: { type: 'boolean', short: 'h' } },
    })
  } catch (err) {
    console.error(err.message)
    return 2
  }
  const [basePath, diffPath] = args.positionals
  const thresholdOk = /^\d+(\.\d+)?$/.test(args.values.threshold)
  const threshold = Number(args.values.threshold) / 100
  if (args.values.help || !basePath || !diffPath || !thresholdOk) {
    console.error('usage: node bench_compare.mjs <base> <diff> [--threshold 5]')
    return args.values.help ? 0 : 2
  }

  let base
  let diff
  let failed
  try {
    const b = loadRuns(basePath)
    const d = loadRuns(diffPath)
    base = b.runs
    diff = d.runs
    failed = new Set([...b.failed, ...d.failed])
  } catch (err) {
    console.error(`cannot read input: ${err.message}`)
    return 2
  }
  if (![...base.keys()].some((name) => diff.has(name))) {
    console.error('no benchmark is present on both sides: nothing to compare (renamed benchmarks or wrong folders?)')
    return 2
  }

  const names = [...new Set([...base.keys(), ...diff.keys(), ...failed])].sort()
  let missing = 0
  const width = Math.max(9, ...names.map((n) => n.length))
  let regressions = 0
  let singleRun = false
  let worstChance = 0
  const skewed = new Set()
  for (const runs of [...base.values(), ...diff.values()]) {
    for (const r of runs) if (r.mean / r.median > SKEW_LIMIT) skewed.add(r.name)
  }
  console.log(
    `${'Benchmark'.padEnd(width)}  ${'Runs'.padStart(5)}  ${'Base median'.padStart(12)}  ${'Diff median'.padStart(12)}  ${'Change'.padStart(8)}  Verdict`,
  )
  for (const name of names) {
    const b = base.get(name)
    const d = diff.get(name)
    if (failed.has(name) || !b || !d) {
      // Упавший бенчмарк или бенчмарк, пропавший из diff, мог скрыть регрессию.
      const label = failed.has(name) ? 'failed' : b ? 'only-base' : 'only-diff'
      if (label !== 'only-diff') missing++
      console.log(`${name.padEnd(width)}  ${''.padStart(5)}  ${''.padStart(12)}  ${''.padStart(12)}  ${''.padStart(8)}  ${label}`)
      continue
    }
    singleRun ||= b.length === 1 || d.length === 1
    if (b.length > 1 && d.length > 1) worstChance = Math.max(worstChance, chanceSeparation(b.length, d.length))
    const v = verdict(b, d, threshold)
    if (v === 'slower') regressions++
    const change = (center(d) / center(b) - 1) * 100
    const sign = change >= 0 ? '+' : ''
    console.log(
      `${name.padEnd(width)}  ${`${b.length}/${d.length}`.padStart(5)}  ${fmtTime(center(b)).padStart(12)}  ${fmtTime(center(d)).padStart(12)}  ${`${sign}${change.toFixed(1)}%`.padStart(8)}  ${v}`,
    )
  }

  console.log(`\nthreshold ${args.values.threshold}%; regressions: ${regressions}; failed or missing in diff: ${missing}`)
  if (singleRun) {
    console.error(
      'warning: one run per side cannot separate a change from run-to-run noise; repeat 5 interleaved runs per side',
    )
  }
  if (skewed.size > 0) {
    console.error(
      `warning: mean/median > ${SKEW_LIMIT} in ${[...skewed].join(', ')}: heavy tail or bimodal samples ` +
        '(unfinished JIT warm-up, GC, deopts, or intermittent slow calls that warm-up does not remove). ' +
        'Verdicts use medians; check the warm-up and run with --trace-opt --trace-deopt. ' +
        'If the tail is real, compare p99 too when latency matters (see references/performance.md)',
    )
  }
  if (worstChance > 0.05) {
    console.error(
      `warning: identical code separates fully by chance with p=${(worstChance * 100).toFixed(1)}% at this run count; ` +
        'use 5 runs per side (p=0.8%) and alternate the order (A B B A ...)',
    )
  }
  return regressions || missing ? 1 : 0
}

process.exitCode = main(process.argv.slice(2))
