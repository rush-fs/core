import test from 'ava'
import * as nodeFsSync from 'node:fs'
import * as nodeFs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { appendFile, appendFileSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-appendfile-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('appendFile: promise appends string data like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node.txt')
  const rushFile = path.join(root, 'rush.txt')
  await nodeFs.writeFile(nodeFile, 'hello')
  await nodeFs.writeFile(rushFile, 'hello')

  await nodeFs.appendFile(nodeFile, ' world')
  await appendFile(rushFile, ' world')

  t.is(await nodeFs.readFile(rushFile, 'utf8'), await nodeFs.readFile(nodeFile, 'utf8'))
})

test('appendFile: promise creates missing files like node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-created.txt')
  const rushFile = path.join(root, 'rush-created.txt')

  await nodeFs.appendFile(nodeFile, 'created')
  await appendFile(rushFile, 'created')

  t.is(await nodeFs.readFile(rushFile, 'utf8'), await nodeFs.readFile(nodeFile, 'utf8'))
})

test('appendFile: promise representative encoding matches node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-hex.bin')
  const rushFile = path.join(root, 'rush-hex.bin')

  await nodeFs.appendFile(nodeFile, '6869', { encoding: 'hex' })
  await appendFile(rushFile, '6869', { encoding: 'hex' })

  t.deepEqual(await nodeFs.readFile(rushFile), await nodeFs.readFile(nodeFile))
})

test('appendFile: sync appends Buffer data like node:fs', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-sync.bin')
  const rushFile = path.join(root, 'rush-sync.bin')
  nodeFsSync.writeFileSync(nodeFile, Buffer.from([1, 2]))
  nodeFsSync.writeFileSync(rushFile, Buffer.from([1, 2]))

  nodeFsSync.appendFileSync(nodeFile, Buffer.from([3, 4]))
  appendFileSync(rushFile, Buffer.from([3, 4]))

  t.deepEqual(nodeFsSync.readFileSync(rushFile), nodeFsSync.readFileSync(nodeFile))
})

test('appendFile: exclusive append flag rejects existing files in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-existing.txt')
  const rushFile = path.join(root, 'rush-existing.txt')
  await nodeFs.writeFile(nodeFile, 'existing')
  await nodeFs.writeFile(rushFile, 'existing')

  const nodeResult = await capture(() => nodeFs.appendFile(nodeFile, 'x', { flag: 'ax' }))
  const rushResult = await capture(() => appendFile(rushFile, 'x', { flag: 'ax' }) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
})

test('appendFile: missing parent rejects or throws in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'missing-node', 'file.txt')
  const rushFile = path.join(root, 'missing-rush', 'file.txt')

  const nodeResult = await capture(() => nodeFs.appendFile(nodeFile, 'data'))
  const rushResult = await capture(() => appendFile(rushFile, 'data') as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
  t.throws(() => nodeFsSync.appendFileSync(nodeFile, 'data'))
  t.throws(() => appendFileSync(rushFile, 'data'))
})
