import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { link, linkSync, statSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-link-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('link: promise creates hard link content like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const src = path.join(root, 'src.txt')
  const nodeDest = path.join(root, 'node-link.txt')
  const rushDest = path.join(root, 'rush-link.txt')
  await nodeFs.writeFile(src, 'hard link data')

  await nodeFs.link(src, nodeDest)
  await link(src, rushDest)

  t.is(await nodeFs.readFile(rushDest, 'utf8'), await nodeFs.readFile(nodeDest, 'utf8'))
})

test('link: sync creates hard link metadata like node:fs', async (t) => {
  const root = await withFixture(t)
  const src = path.join(root, 'src-sync.txt')
  const nodeDest = path.join(root, 'node-sync-link.txt')
  const rushDest = path.join(root, 'rush-sync-link.txt')
  await nodeFs.writeFile(src, 'sync hard link')

  nodeFsSync.linkSync(src, nodeDest)
  linkSync(src, rushDest)

  t.is(nodeFsSync.readFileSync(rushDest, 'utf8'), nodeFsSync.readFileSync(nodeDest, 'utf8'))
  if (process.platform !== 'win32') {
    t.is((statSync(rushDest) as any).ino, nodeFsSync.statSync(nodeDest).ino)
  }
})

test('link: missing source rejects or throws in both implementations', async (t) => {
  const root = await withFixture(t)
  const missing = path.join(root, 'missing.txt')
  const nodeDest = path.join(root, 'node-link.txt')
  const rushDest = path.join(root, 'rush-link.txt')

  const nodeResult = await capture(() => nodeFs.link(missing, nodeDest))
  const rushResult = await capture(() => link(missing, rushDest) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.linkSync(missing, nodeDest))
  t.throws(() => linkSync(missing, rushDest))
})

test('link: existing destination rejects or throws in both implementations', async (t) => {
  const root = await withFixture(t)
  const src = path.join(root, 'src.txt')
  const nodeDest = path.join(root, 'node-existing.txt')
  const rushDest = path.join(root, 'rush-existing.txt')
  await nodeFs.writeFile(src, 'source')
  await nodeFs.writeFile(nodeDest, 'existing')
  await nodeFs.writeFile(rushDest, 'existing')

  const nodeResult = await capture(() => nodeFs.link(src, nodeDest))
  const rushResult = await capture(() => link(src, rushDest) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.linkSync(src, nodeDest))
  t.throws(() => linkSync(src, rushDest))
})
