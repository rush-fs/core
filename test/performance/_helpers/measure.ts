import { performance } from 'node:perf_hooks'

export interface MemorySnapshot {
  rss: number
  heapUsed: number
  external: number
}

export interface Measurement {
  name: string
  durationMs: number
  before: MemorySnapshot
  after: MemorySnapshot
  delta: MemorySnapshot
}

export function snapshotMemory(): MemorySnapshot {
  const usage = process.memoryUsage()
  return {
    rss: usage.rss,
    heapUsed: usage.heapUsed,
    external: usage.external,
  }
}

export async function measure(name: string, fn: () => unknown | Promise<unknown>): Promise<Measurement> {
  if (global.gc) global.gc()
  const before = snapshotMemory()
  const start = performance.now()
  await fn()
  const durationMs = performance.now() - start
  if (global.gc) global.gc()
  const after = snapshotMemory()

  return {
    name,
    durationMs,
    before,
    after,
    delta: {
      rss: after.rss - before.rss,
      heapUsed: after.heapUsed - before.heapUsed,
      external: after.external - before.external,
    },
  }
}

export function formatBytes(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs < 1024) return `${value} B`
  if (abs < 1024 * 1024) return `${sign}${(abs / 1024).toFixed(1)} KB`
  return `${sign}${(abs / 1024 / 1024).toFixed(1)} MB`
}

export function printComparison(api: string, scale: string, node: Measurement, rush: Measurement): void {
  const ratio = rush.durationMs / node.durationMs
  const ratioLabel = ratio > 1 ? `${ratio.toFixed(2)}x slower` : `${(1 / ratio).toFixed(2)}x faster`
  console.log(`\n${api} / ${scale}`)
  console.log(
    `  Node.js  ${node.durationMs.toFixed(2)} ms  rss ${formatBytes(node.delta.rss)}  heap ${formatBytes(node.delta.heapUsed)}  external ${formatBytes(node.delta.external)}`,
  )
  console.log(
    `  Rush-FS  ${rush.durationMs.toFixed(2)} ms  rss ${formatBytes(rush.delta.rss)}  heap ${formatBytes(rush.delta.heapUsed)}  external ${formatBytes(rush.delta.external)}`,
  )
  console.log(`  Ratio    ${ratioLabel}`)
}
