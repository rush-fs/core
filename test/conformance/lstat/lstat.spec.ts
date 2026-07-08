import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { lstat, lstatSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-lstat-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

function assertStatsMatch(
  t: { is(actual: unknown, expected: unknown, message?: string): void; true(value: boolean, message?: string): void },
  rushStats: any,
  nodeStats: nodeFsSync.Stats,
) {
  t.is(rushStats.size, nodeStats.size)
  t.is(rushStats.mode, nodeStats.mode)
  t.is(rushStats.uid, nodeStats.uid)
  t.is(rushStats.gid, nodeStats.gid)
  t.is(rushStats.nlink, nodeStats.nlink)
  t.is(rushStats.isFile(), nodeStats.isFile())
  t.is(rushStats.isDirectory(), nodeStats.isDirectory())
  t.is(rushStats.isSymbolicLink(), nodeStats.isSymbolicLink())
  t.true(rushStats.mtime instanceof Date)
  t.true(Math.abs(rushStats.mtime.getTime() - nodeStats.mtime.getTime()) < 2)
}

test('lstat: promise file stats match node:fs/promises stable fields', async (t) => {
  const root = await withFixture(t)
  const file = path.join(root, 'file.txt')
  await nodeFs.writeFile(file, 'hello lstat')

  assertStatsMatch(t, await lstat(file), await nodeFs.lstat(file))
})

test('lstat: promise directory predicates match node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const child = path.join(root, 'dir')
  await nodeFs.mkdir(child)

  const nodeStats = await nodeFs.lstat(child)
  const rushStats: any = await lstat(child)

  t.is(rushStats.isDirectory(), nodeStats.isDirectory())
  t.is(rushStats.isFile(), nodeStats.isFile())
  t.is(rushStats.isSymbolicLink(), nodeStats.isSymbolicLink())
})

test('lstat: sync file stats match node:fs stable fields', async (t) => {
  const root = await withFixture(t)
  const file = path.join(root, 'sync.txt')
  await nodeFs.writeFile(file, 'sync lstat')

  assertStatsMatch(t, lstatSync(file), nodeFsSync.lstatSync(file))
})

test('lstat: reports symlinks like node:fs', async (t) => {
  if (process.platform === 'win32') {
    t.pass('symlink privileges vary on Windows')
    return
  }

  const root = await withFixture(t)
  const target = path.join(root, 'target.txt')
  const link = path.join(root, 'link.txt')
  await nodeFs.writeFile(target, 'target')
  await nodeFs.symlink(target, link)

  const nodeStats = await nodeFs.lstat(link)
  const rushStats: any = await lstat(link)

  t.true(rushStats.isSymbolicLink())
  t.is(rushStats.isFile(), nodeStats.isFile())
  t.is(rushStats.isSymbolicLink(), nodeStats.isSymbolicLink())
})

test('lstat: date getters align with node:fs at millisecond precision', async (t) => {
  const root = await withFixture(t)
  const file = path.join(root, 'time.txt')
  await nodeFs.writeFile(file, 'time')
  const time = new Date('2024-01-02T03:04:05.678Z')
  nodeFsSync.utimesSync(file, time, time)

  const nodeStats = nodeFsSync.lstatSync(file)
  const rushStats: any = lstatSync(file)

  t.true(rushStats.atime instanceof Date)
  t.true(rushStats.mtime instanceof Date)
  t.true(Math.abs(rushStats.atime.getTime() - nodeStats.atime.getTime()) < 2)
  t.true(Math.abs(rushStats.mtime.getTime() - nodeStats.mtime.getTime()) < 2)
})

test('lstat: missing path rejects in both implementations', async (t) => {
  const root = await withFixture(t)
  const missing = path.join(root, 'missing.txt')

  const nodeResult = await capture(() => nodeFs.lstat(missing))
  const rushResult = await capture(() => lstat(missing) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
})
