import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { chown, chownSync, statSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-chown-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('chown: promise current owner matches node:fs/promises on unix', async (t) => {
  if (process.platform === 'win32') {
    t.pass('Windows chown parity is documented as a current gap')
    return
  }

  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node.txt')
  const rushFile = path.join(root, 'rush.txt')
  await nodeFs.writeFile(nodeFile, 'node')
  await nodeFs.writeFile(rushFile, 'rush')
  const nodeBefore = nodeFsSync.statSync(nodeFile)
  const rushBefore = nodeFsSync.statSync(rushFile)

  await nodeFs.chown(nodeFile, nodeBefore.uid, nodeBefore.gid)
  await chown(rushFile, rushBefore.uid, rushBefore.gid)

  const nodeAfter = nodeFsSync.statSync(nodeFile)
  const rushAfter = statSync(rushFile) as any
  t.is(rushAfter.uid, nodeAfter.uid)
  t.is(rushAfter.gid, nodeAfter.gid)
})

test('chown: sync current owner matches node:fs on unix', async (t) => {
  if (process.platform === 'win32') {
    t.pass('Windows chown parity is documented as a current gap')
    return
  }

  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-sync.txt')
  const rushFile = path.join(root, 'rush-sync.txt')
  await nodeFs.writeFile(nodeFile, 'node')
  await nodeFs.writeFile(rushFile, 'rush')
  const nodeBefore = nodeFsSync.statSync(nodeFile)
  const rushBefore = nodeFsSync.statSync(rushFile)

  nodeFsSync.chownSync(nodeFile, nodeBefore.uid, nodeBefore.gid)
  chownSync(rushFile, rushBefore.uid, rushBefore.gid)

  const nodeAfter = nodeFsSync.statSync(nodeFile)
  const rushAfter = statSync(rushFile) as any
  t.is(rushAfter.uid, nodeAfter.uid)
  t.is(rushAfter.gid, nodeAfter.gid)
})

test('chown: missing paths reject or throw in both implementations', async (t) => {
  const root = await withFixture(t)
  const missing = path.join(root, 'missing.txt')

  const nodeResult = await capture(() => nodeFs.chown(missing, 0, 0))
  const rushResult = await capture(() => chown(missing, 0, 0) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.chownSync(missing, 0, 0))
  t.throws(() => chownSync(missing, 0, 0))
})

test('chown: permission-denied behavior matches node:fs for privileged owner changes', async (t) => {
  if (process.platform === 'win32' || (typeof process.getuid === 'function' && process.getuid() === 0)) {
    t.pass('privileged owner changes are platform or root dependent')
    return
  }

  const root = await withFixture(t)
  const file = path.join(root, 'owned.txt')
  await nodeFs.writeFile(file, 'owned')

  const nodeResult = await capture(() => nodeFs.chown(file, 0, 0))
  const rushResult = await capture(() => chown(file, 0, 0) as Promise<unknown>)

  t.is(rushResult.ok, nodeResult.ok)
})
