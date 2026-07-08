import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { rename, renameSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-rename-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('rename: promise moves files like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeSrc = path.join(root, 'node-src.txt')
  const nodeDest = path.join(root, 'node-dest.txt')
  const rushSrc = path.join(root, 'rush-src.txt')
  const rushDest = path.join(root, 'rush-dest.txt')
  await nodeFs.writeFile(nodeSrc, 'rename data')
  await nodeFs.writeFile(rushSrc, 'rename data')

  await nodeFs.rename(nodeSrc, nodeDest)
  await rename(rushSrc, rushDest)

  t.false(nodeFsSync.existsSync(rushSrc))
  t.is(nodeFsSync.readFileSync(rushDest, 'utf8'), nodeFsSync.readFileSync(nodeDest, 'utf8'))
})

test('rename: promise overwrites existing file destination like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeSrc = path.join(root, 'node-src.txt')
  const nodeDest = path.join(root, 'node-dest.txt')
  const rushSrc = path.join(root, 'rush-src.txt')
  const rushDest = path.join(root, 'rush-dest.txt')
  await nodeFs.writeFile(nodeSrc, 'new')
  await nodeFs.writeFile(nodeDest, 'old')
  await nodeFs.writeFile(rushSrc, 'new')
  await nodeFs.writeFile(rushDest, 'old')

  await nodeFs.rename(nodeSrc, nodeDest)
  await rename(rushSrc, rushDest)

  t.is(nodeFsSync.readFileSync(rushDest, 'utf8'), nodeFsSync.readFileSync(nodeDest, 'utf8'))
})

test('rename: sync moves directories like node:fs', async (t) => {
  const root = await withFixture(t)
  const nodeSrc = path.join(root, 'node-dir')
  const nodeDest = path.join(root, 'node-dir-renamed')
  const rushSrc = path.join(root, 'rush-dir')
  const rushDest = path.join(root, 'rush-dir-renamed')
  await nodeFs.mkdir(nodeSrc)
  await nodeFs.mkdir(rushSrc)
  await nodeFs.writeFile(path.join(nodeSrc, 'file.txt'), 'dir')
  await nodeFs.writeFile(path.join(rushSrc, 'file.txt'), 'dir')

  nodeFsSync.renameSync(nodeSrc, nodeDest)
  renameSync(rushSrc, rushDest)

  t.false(nodeFsSync.existsSync(rushSrc))
  t.true(nodeFsSync.statSync(rushDest).isDirectory())
  t.is(nodeFsSync.readFileSync(path.join(rushDest, 'file.txt'), 'utf8'), 'dir')
  t.is(nodeFsSync.existsSync(rushDest), nodeFsSync.existsSync(nodeDest))
})

test('rename: missing source rejects or throws in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeSrc = path.join(root, 'node-missing.txt')
  const nodeDest = path.join(root, 'node-dest.txt')
  const rushSrc = path.join(root, 'rush-missing.txt')
  const rushDest = path.join(root, 'rush-dest.txt')

  const nodeResult = await capture(() => nodeFs.rename(nodeSrc, nodeDest))
  const rushResult = await capture(() => rename(rushSrc, rushDest) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.renameSync(nodeSrc, nodeDest))
  t.throws(() => renameSync(rushSrc, rushDest))
})
