import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { mkdtemp, mkdtempSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-mkdtemp-root-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('mkdtemp: promise creates directory with prefix like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodePrefix = path.join(root, 'node-')
  const rushPrefix = path.join(root, 'rush-')

  const nodeDir = await nodeFs.mkdtemp(nodePrefix)
  const rushDir = (await mkdtemp(rushPrefix)) as string

  t.true(nodeDir.startsWith(nodePrefix))
  t.true(rushDir.startsWith(rushPrefix))
  t.true(nodeFsSync.statSync(rushDir).isDirectory())
})

test('mkdtemp: promise creates unique directories across repeated calls', async (t) => {
  const root = await withFixture(t)
  const prefix = path.join(root, 'rush-unique-')

  const first = (await mkdtemp(prefix)) as string
  const second = (await mkdtemp(prefix)) as string

  t.not(first, second)
  t.true(nodeFsSync.statSync(first).isDirectory())
  t.true(nodeFsSync.statSync(second).isDirectory())
})

test('mkdtemp: sync creates directory with prefix like node:fs', async (t) => {
  const root = await withFixture(t)
  const nodePrefix = path.join(root, 'node-sync-')
  const rushPrefix = path.join(root, 'rush-sync-')

  const nodeDir = nodeFsSync.mkdtempSync(nodePrefix)
  const rushDir = mkdtempSync(rushPrefix)

  t.true(nodeDir.startsWith(nodePrefix))
  t.true(rushDir.startsWith(rushPrefix))
  t.true(nodeFsSync.statSync(rushDir).isDirectory())
})

test('mkdtemp: missing parent rejects or throws in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodePrefix = path.join(root, 'missing-node', 'node-')
  const rushPrefix = path.join(root, 'missing-rush', 'rush-')

  const nodeResult = await capture(() => nodeFs.mkdtemp(nodePrefix))
  const rushResult = await capture(() => mkdtemp(rushPrefix) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.mkdtempSync(nodePrefix))
  t.throws(() => mkdtempSync(rushPrefix))
})

test('mkdtemp: prefix is literal unless caller includes a trailing separator', async (t) => {
  const root = await withFixture(t)
  const prefix = path.join(root, 'literal-prefix')

  const dir = (await mkdtemp(prefix)) as string

  t.true(path.dirname(dir) === root)
  t.true(path.basename(dir).startsWith('literal-prefix'))
})
