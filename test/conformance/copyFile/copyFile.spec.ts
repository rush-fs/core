import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { copyFile, copyFileSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-copyfile-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('copyFile: promise copies bytes like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const src = path.join(root, 'src.txt')
  const nodeDest = path.join(root, 'node.txt')
  const rushDest = path.join(root, 'rush.txt')
  await nodeFs.writeFile(src, 'copy file\nhello')

  await nodeFs.copyFile(src, nodeDest)
  await copyFile(src, rushDest)

  t.deepEqual(await nodeFs.readFile(rushDest), await nodeFs.readFile(nodeDest))
})

test('copyFile: promise overwrites existing destination like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const src = path.join(root, 'src.txt')
  const nodeDest = path.join(root, 'node.txt')
  const rushDest = path.join(root, 'rush.txt')
  await nodeFs.writeFile(src, 'replacement')
  await nodeFs.writeFile(nodeDest, 'old')
  await nodeFs.writeFile(rushDest, 'old')

  await nodeFs.copyFile(src, nodeDest)
  await copyFile(src, rushDest)

  t.is(await nodeFs.readFile(rushDest, 'utf8'), await nodeFs.readFile(nodeDest, 'utf8'))
})

test('copyFile: COPYFILE_EXCL rejects when destination exists like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const src = path.join(root, 'src.txt')
  const nodeDest = path.join(root, 'node.txt')
  const rushDest = path.join(root, 'rush.txt')
  await nodeFs.writeFile(src, 'data')
  await nodeFs.writeFile(nodeDest, 'existing')
  await nodeFs.writeFile(rushDest, 'existing')

  const nodeResult = await capture(() => nodeFs.copyFile(src, nodeDest, nodeFsSync.constants.COPYFILE_EXCL))
  const rushResult = await capture(
    () => copyFile(src, rushDest, nodeFsSync.constants.COPYFILE_EXCL) as Promise<unknown>,
  )

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.is(await nodeFs.readFile(rushDest, 'utf8'), 'existing')
})

test('copyFile: sync copies bytes like node:fs', async (t) => {
  const root = await withFixture(t)
  const src = path.join(root, 'src.bin')
  const nodeDest = path.join(root, 'node.bin')
  const rushDest = path.join(root, 'rush.bin')
  const data = Buffer.from([0, 1, 2, 3, 255])
  await nodeFs.writeFile(src, data)

  nodeFsSync.copyFileSync(src, nodeDest)
  copyFileSync(src, rushDest)

  t.deepEqual(nodeFsSync.readFileSync(rushDest), nodeFsSync.readFileSync(nodeDest))
})

test('copyFile: missing source rejects or throws in both implementations', async (t) => {
  const root = await withFixture(t)
  const missing = path.join(root, 'missing.txt')
  const nodeDest = path.join(root, 'node.txt')
  const rushDest = path.join(root, 'rush.txt')

  const nodeResult = await capture(() => nodeFs.copyFile(missing, nodeDest))
  const rushResult = await capture(() => copyFile(missing, rushDest) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.copyFileSync(missing, nodeDest))
  t.throws(() => copyFileSync(missing, rushDest))
})
