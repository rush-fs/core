import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { mkdir, mkdirSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-mkdir-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

function modeOf(file: string): number {
  return nodeFsSync.statSync(file).mode & 0o777
}

test('mkdir: promise creates a single directory like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeDir = path.join(root, 'node')
  const rushDir = path.join(root, 'rush')

  const nodeResult = await nodeFs.mkdir(nodeDir)
  const rushResult = await mkdir(rushDir)

  t.is(Boolean(rushResult), Boolean(nodeResult))
  t.true(nodeFsSync.statSync(rushDir).isDirectory())
})

test('mkdir: promise recursive creates nested directories and returns first created path', async (t) => {
  const root = await withFixture(t)
  const nodeTarget = path.join(root, 'node', 'a', 'b')
  const rushTarget = path.join(root, 'rush', 'a', 'b')

  const nodeResult = await nodeFs.mkdir(nodeTarget, { recursive: true })
  const rushResult = await mkdir(rushTarget, { recursive: true })

  t.is(typeof rushResult, typeof nodeResult)
  t.true(String(rushResult).endsWith('rush'))
  t.true(nodeFsSync.statSync(rushTarget).isDirectory())
})

test('mkdir: promise recursive returns no created path when target exists like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeTarget = path.join(root, 'node')
  const rushTarget = path.join(root, 'rush')
  await nodeFs.mkdir(nodeTarget)
  await nodeFs.mkdir(rushTarget)

  const nodeResult = await nodeFs.mkdir(nodeTarget, { recursive: true })
  const rushResult = await mkdir(rushTarget, { recursive: true })

  t.is(Boolean(rushResult), Boolean(nodeResult))
})

test('mkdir: sync recursive behavior matches node:fs', async (t) => {
  const root = await withFixture(t)
  const nodeTarget = path.join(root, 'node-sync', 'a', 'b')
  const rushTarget = path.join(root, 'rush-sync', 'a', 'b')

  const nodeResult = nodeFsSync.mkdirSync(nodeTarget, { recursive: true })
  const rushResult = mkdirSync(rushTarget, { recursive: true })

  t.is(typeof rushResult, typeof nodeResult)
  t.true(String(rushResult).endsWith('rush-sync'))
  t.true(nodeFsSync.statSync(rushTarget).isDirectory())
})

test('mkdir: non-recursive errors match node:fs existence behavior', async (t) => {
  const root = await withFixture(t)
  const existing = path.join(root, 'existing')
  const missingParent = path.join(root, 'missing', 'child')
  await nodeFs.mkdir(existing)

  const nodeExisting = await capture(() => nodeFs.mkdir(existing))
  const rushExisting = await capture(() => mkdir(existing) as Promise<unknown>)
  const nodeMissingParent = await capture(() => nodeFs.mkdir(missingParent))
  const rushMissingParent = await capture(() => mkdir(missingParent) as Promise<unknown>)

  t.false(nodeExisting.ok)
  t.false(rushExisting.ok)
  t.false(nodeMissingParent.ok)
  t.false(rushMissingParent.ok)
  t.throws(() => nodeFsSync.mkdirSync(existing))
  t.throws(() => mkdirSync(existing))
  t.throws(() => nodeFsSync.mkdirSync(missingParent))
  t.throws(() => mkdirSync(missingParent))
})

test('mkdir: recursive file target and file ancestor errors match node:fs', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-file')
  const rushFile = path.join(root, 'rush-file')
  await nodeFs.writeFile(nodeFile, 'node')
  await nodeFs.writeFile(rushFile, 'rush')

  const nodeTargetFile = await capture(() => nodeFs.mkdir(nodeFile, { recursive: true }))
  const rushTargetFile = await capture(() => mkdir(rushFile, { recursive: true }) as Promise<unknown>)
  const nodeAncestorFile = await capture(() => nodeFs.mkdir(path.join(nodeFile, 'child'), { recursive: true }))
  const rushAncestorFile = await capture(
    () => mkdir(path.join(rushFile, 'child'), { recursive: true }) as Promise<unknown>,
  )

  t.false(nodeTargetFile.ok)
  t.false(rushTargetFile.ok)
  t.false(nodeAncestorFile.ok)
  t.false(rushAncestorFile.ok)
})

test('mkdir: mode applies to created directories on unix like node:fs', async (t) => {
  if (process.platform === 'win32') {
    t.pass('Windows mode bits are platform dependent')
    return
  }

  const root = await withFixture(t)
  const nodeDir = path.join(root, 'node-mode')
  const rushDir = path.join(root, 'rush-mode')

  await nodeFs.mkdir(nodeDir, { mode: 0o700 })
  await mkdir(rushDir, { mode: 0o700 })

  t.is(modeOf(rushDir), modeOf(nodeDir))
})
