import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { rmdir, rmdirSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-rmdir-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('rmdir: promise removes empty directories like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeDir = path.join(root, 'node-empty')
  const rushDir = path.join(root, 'rush-empty')
  await nodeFs.mkdir(nodeDir)
  await nodeFs.mkdir(rushDir)

  await nodeFs.rmdir(nodeDir)
  await rmdir(rushDir)

  t.is(nodeFsSync.existsSync(rushDir), nodeFsSync.existsSync(nodeDir))
})

test('rmdir: sync removes empty directories like node:fs', async (t) => {
  const root = await withFixture(t)
  const nodeDir = path.join(root, 'node-sync-empty')
  const rushDir = path.join(root, 'rush-sync-empty')
  await nodeFs.mkdir(nodeDir)
  await nodeFs.mkdir(rushDir)

  nodeFsSync.rmdirSync(nodeDir)
  rmdirSync(rushDir)

  t.is(nodeFsSync.existsSync(rushDir), nodeFsSync.existsSync(nodeDir))
})

test('rmdir: non-empty directories reject or throw in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeDir = path.join(root, 'node-full')
  const rushDir = path.join(root, 'rush-full')
  await nodeFs.mkdir(nodeDir)
  await nodeFs.mkdir(rushDir)
  await nodeFs.writeFile(path.join(nodeDir, 'file.txt'), 'node')
  await nodeFs.writeFile(path.join(rushDir, 'file.txt'), 'rush')

  const nodeResult = await capture(() => nodeFs.rmdir(nodeDir))
  const rushResult = await capture(() => rmdir(rushDir) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.rmdirSync(nodeDir))
  t.throws(() => rmdirSync(rushDir))
})

test('rmdir: file paths reject or throw in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-file.txt')
  const rushFile = path.join(root, 'rush-file.txt')
  await nodeFs.writeFile(nodeFile, 'node')
  await nodeFs.writeFile(rushFile, 'rush')

  const nodeResult = await capture(() => nodeFs.rmdir(nodeFile))
  const rushResult = await capture(() => rmdir(rushFile) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.rmdirSync(nodeFile))
  t.throws(() => rmdirSync(rushFile))
})

test('rmdir: missing paths reject or throw in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeMissing = path.join(root, 'node-missing')
  const rushMissing = path.join(root, 'rush-missing')

  const nodeResult = await capture(() => nodeFs.rmdir(nodeMissing))
  const rushResult = await capture(() => rmdir(rushMissing) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.rmdirSync(nodeMissing))
  t.throws(() => rmdirSync(rushMissing))
})
