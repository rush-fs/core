import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { utimes, utimesSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-utimes-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

function assertTimeClose(
  t: { true(value: boolean, message?: string): void },
  actualMs: number,
  expectedMs: number,
): void {
  t.true(Math.abs(actualMs - expectedMs) < 10, `${actualMs} should be close to ${expectedMs}`)
}

test('utimes: promise updates file timestamps like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-file.txt')
  const rushFile = path.join(root, 'rush-file.txt')
  await nodeFs.writeFile(nodeFile, 'node')
  await nodeFs.writeFile(rushFile, 'rush')
  const atime = 1_700_000_000.123
  const mtime = 1_700_000_001.456

  await nodeFs.utimes(nodeFile, atime, mtime)
  await utimes(rushFile, atime, mtime)

  const nodeStats = nodeFsSync.statSync(nodeFile)
  const rushStats = nodeFsSync.statSync(rushFile)
  assertTimeClose(t, rushStats.atimeMs, nodeStats.atimeMs)
  assertTimeClose(t, rushStats.mtimeMs, nodeStats.mtimeMs)
})

test('utimes: promise updates directory timestamps like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeDir = path.join(root, 'node-dir')
  const rushDir = path.join(root, 'rush-dir')
  await nodeFs.mkdir(nodeDir)
  await nodeFs.mkdir(rushDir)
  const atime = 1_600_000_000
  const mtime = 1_600_000_001

  await nodeFs.utimes(nodeDir, atime, mtime)
  await utimes(rushDir, atime, mtime)

  const nodeStats = nodeFsSync.statSync(nodeDir)
  const rushStats = nodeFsSync.statSync(rushDir)
  assertTimeClose(t, rushStats.atimeMs, nodeStats.atimeMs)
  assertTimeClose(t, rushStats.mtimeMs, nodeStats.mtimeMs)
})

test('utimes: sync updates file timestamps like node:fs', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-sync.txt')
  const rushFile = path.join(root, 'rush-sync.txt')
  await nodeFs.writeFile(nodeFile, 'node')
  await nodeFs.writeFile(rushFile, 'rush')
  const atime = 1_500_000_000
  const mtime = 1_500_000_001

  nodeFsSync.utimesSync(nodeFile, atime, mtime)
  utimesSync(rushFile, atime, mtime)

  const nodeStats = nodeFsSync.statSync(nodeFile)
  const rushStats = nodeFsSync.statSync(rushFile)
  assertTimeClose(t, rushStats.atimeMs, nodeStats.atimeMs)
  assertTimeClose(t, rushStats.mtimeMs, nodeStats.mtimeMs)
})

test('utimes: missing paths reject or throw in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeMissing = path.join(root, 'node-missing.txt')
  const rushMissing = path.join(root, 'rush-missing.txt')

  const nodeResult = await capture(() => nodeFs.utimes(nodeMissing, 1, 2))
  const rushResult = await capture(() => utimes(rushMissing, 1, 2) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.utimesSync(nodeMissing, 1, 2))
  t.throws(() => utimesSync(rushMissing, 1, 2))
})
