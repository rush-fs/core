import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { truncate, truncateSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-truncate-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('truncate: promise defaults to length 0 like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-default.txt')
  const rushFile = path.join(root, 'rush-default.txt')
  await nodeFs.writeFile(nodeFile, 'node default')
  await nodeFs.writeFile(rushFile, 'rush default')

  await nodeFs.truncate(nodeFile)
  await truncate(rushFile)

  t.is(nodeFsSync.statSync(rushFile).size, nodeFsSync.statSync(nodeFile).size)
})

test('truncate: promise truncates files shorter like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-short.txt')
  const rushFile = path.join(root, 'rush-short.txt')
  await nodeFs.writeFile(nodeFile, 'hello world')
  await nodeFs.writeFile(rushFile, 'hello world')

  await nodeFs.truncate(nodeFile, 5)
  await truncate(rushFile, 5)

  t.is(await nodeFs.readFile(rushFile, 'utf8'), await nodeFs.readFile(nodeFile, 'utf8'))
})

test('truncate: promise extends files like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-long.bin')
  const rushFile = path.join(root, 'rush-long.bin')
  await nodeFs.writeFile(nodeFile, Buffer.from('abc'))
  await nodeFs.writeFile(rushFile, Buffer.from('abc'))

  await nodeFs.truncate(nodeFile, 8)
  await truncate(rushFile, 8)

  t.deepEqual(await nodeFs.readFile(rushFile), await nodeFs.readFile(nodeFile))
})

test('truncate: sync truncates files like node:fs', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-sync.txt')
  const rushFile = path.join(root, 'rush-sync.txt')
  await nodeFs.writeFile(nodeFile, 'sync truncate')
  await nodeFs.writeFile(rushFile, 'sync truncate')

  nodeFsSync.truncateSync(nodeFile, 4)
  truncateSync(rushFile, 4)

  t.is(nodeFsSync.readFileSync(rushFile, 'utf8'), nodeFsSync.readFileSync(nodeFile, 'utf8'))
})

test('truncate: missing paths reject or throw in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeMissing = path.join(root, 'node-missing.txt')
  const rushMissing = path.join(root, 'rush-missing.txt')

  const nodeResult = await capture(() => nodeFs.truncate(nodeMissing, 1))
  const rushResult = await capture(() => truncate(rushMissing, 1) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.truncateSync(nodeMissing, 1))
  t.throws(() => truncateSync(rushMissing, 1))
})
