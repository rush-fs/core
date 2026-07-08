import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { unlink, unlinkSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-unlink-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('unlink: promise removes files like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node.txt')
  const rushFile = path.join(root, 'rush.txt')
  await nodeFs.writeFile(nodeFile, 'node')
  await nodeFs.writeFile(rushFile, 'rush')

  await nodeFs.unlink(nodeFile)
  await unlink(rushFile)

  t.is(nodeFsSync.existsSync(rushFile), nodeFsSync.existsSync(nodeFile))
})

test('unlink: promise removes symlink entries without deleting targets like node:fs/promises', async (t) => {
  if (process.platform === 'win32') {
    t.pass('symlink privileges vary on Windows')
    return
  }

  const root = await withFixture(t)
  const target = path.join(root, 'target.txt')
  const nodeLink = path.join(root, 'node-link.txt')
  const rushLink = path.join(root, 'rush-link.txt')
  await nodeFs.writeFile(target, 'target')
  await nodeFs.symlink(target, nodeLink)
  await nodeFs.symlink(target, rushLink)

  await nodeFs.unlink(nodeLink)
  await unlink(rushLink)

  t.false(nodeFsSync.existsSync(rushLink))
  t.true(nodeFsSync.existsSync(target))
})

test('unlink: sync removes files like node:fs', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-sync.txt')
  const rushFile = path.join(root, 'rush-sync.txt')
  await nodeFs.writeFile(nodeFile, 'node')
  await nodeFs.writeFile(rushFile, 'rush')

  nodeFsSync.unlinkSync(nodeFile)
  unlinkSync(rushFile)

  t.is(nodeFsSync.existsSync(rushFile), nodeFsSync.existsSync(nodeFile))
})

test('unlink: directory paths reject or throw in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeDir = path.join(root, 'node-dir')
  const rushDir = path.join(root, 'rush-dir')
  await nodeFs.mkdir(nodeDir)
  await nodeFs.mkdir(rushDir)

  const nodeResult = await capture(() => nodeFs.unlink(nodeDir))
  const rushResult = await capture(() => unlink(rushDir) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.unlinkSync(nodeDir))
  t.throws(() => unlinkSync(rushDir))
})

test('unlink: missing paths reject or throw in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeMissing = path.join(root, 'node-missing.txt')
  const rushMissing = path.join(root, 'rush-missing.txt')

  const nodeResult = await capture(() => nodeFs.unlink(nodeMissing))
  const rushResult = await capture(() => unlink(rushMissing) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.unlinkSync(nodeMissing))
  t.throws(() => unlinkSync(rushMissing))
})
