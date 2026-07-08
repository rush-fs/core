import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { readlinkSync, symlink, symlinkSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-symlink-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

function skipIfWindows(t: { pass(message?: string): void }): boolean {
  if (process.platform === 'win32') {
    t.pass('symlink privileges vary on Windows')
    return true
  }
  return false
}

test('symlink: promise creates file symlinks like node:fs/promises', async (t) => {
  if (skipIfWindows(t)) return

  const root = await withFixture(t)
  const target = path.join(root, 'target.txt')
  const nodeLink = path.join(root, 'node-link.txt')
  const rushLink = path.join(root, 'rush-link.txt')
  await nodeFs.writeFile(target, 'target')

  await nodeFs.symlink(target, nodeLink)
  await symlink(target, rushLink)

  t.is(readlinkSync(rushLink), nodeFsSync.readlinkSync(nodeLink, 'utf8'))
  t.true(nodeFsSync.lstatSync(rushLink).isSymbolicLink())
})

test('symlink: promise stores relative targets like node:fs/promises', async (t) => {
  if (skipIfWindows(t)) return

  const root = await withFixture(t)
  const targetName = 'target.txt'
  const target = path.join(root, targetName)
  const nodeLink = path.join(root, 'node-relative.txt')
  const rushLink = path.join(root, 'rush-relative.txt')
  await nodeFs.writeFile(target, 'target')

  await nodeFs.symlink(targetName, nodeLink)
  await symlink(targetName, rushLink)

  t.is(readlinkSync(rushLink), nodeFsSync.readlinkSync(nodeLink, 'utf8'))
  t.is(readlinkSync(rushLink), targetName)
})

test('symlink: sync creates directory symlinks like node:fs', async (t) => {
  if (skipIfWindows(t)) return

  const root = await withFixture(t)
  const target = path.join(root, 'target-dir')
  const nodeLink = path.join(root, 'node-dir-link')
  const rushLink = path.join(root, 'rush-dir-link')
  await nodeFs.mkdir(target)

  nodeFsSync.symlinkSync(target, nodeLink, 'dir')
  symlinkSync(target, rushLink, 'dir')

  t.is(readlinkSync(rushLink), nodeFsSync.readlinkSync(nodeLink, 'utf8'))
  t.true(nodeFsSync.lstatSync(rushLink).isSymbolicLink())
})

test('symlink: existing link paths reject or throw in both implementations', async (t) => {
  if (skipIfWindows(t)) return

  const root = await withFixture(t)
  const target = path.join(root, 'target.txt')
  const nodeLink = path.join(root, 'node-existing.txt')
  const rushLink = path.join(root, 'rush-existing.txt')
  await nodeFs.writeFile(target, 'target')
  await nodeFs.writeFile(nodeLink, 'existing')
  await nodeFs.writeFile(rushLink, 'existing')

  const nodeResult = await capture(() => nodeFs.symlink(target, nodeLink))
  const rushResult = await capture(() => symlink(target, rushLink) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.symlinkSync(target, nodeLink))
  t.throws(() => symlinkSync(target, rushLink))
})

test('symlink: missing parent paths reject or throw in both implementations', async (t) => {
  if (skipIfWindows(t)) return

  const root = await withFixture(t)
  const target = path.join(root, 'target.txt')
  const nodeLink = path.join(root, 'missing-node', 'link.txt')
  const rushLink = path.join(root, 'missing-rush', 'link.txt')
  await nodeFs.writeFile(target, 'target')

  const nodeResult = await capture(() => nodeFs.symlink(target, nodeLink))
  const rushResult = await capture(() => symlink(target, rushLink) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.symlinkSync(target, nodeLink))
  t.throws(() => symlinkSync(target, rushLink))
})
