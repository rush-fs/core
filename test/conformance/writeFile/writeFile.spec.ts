import test from 'ava'
import * as nodeFs from 'node:fs/promises'
import * as nodeFsSync from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { writeFile, writeFileSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-writeFile-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

test('writeFile: promise string side effects match node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node.txt')
  const rushFile = path.join(root, 'rush.txt')

  await nodeFs.writeFile(nodeFile, 'hello writeFile', { encoding: 'utf8' })
  await writeFile(rushFile, 'hello writeFile', { encoding: 'utf8' })

  t.is(await nodeFs.readFile(rushFile, 'utf8'), await nodeFs.readFile(nodeFile, 'utf8'))
})

test('writeFile: promise Buffer side effects match node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node.bin')
  const rushFile = path.join(root, 'rush.bin')
  const data = Buffer.from([0, 1, 2, 255])

  await nodeFs.writeFile(nodeFile, data)
  await writeFile(rushFile, data)

  t.deepEqual(await nodeFs.readFile(rushFile), await nodeFs.readFile(nodeFile))
})

test('writeFile: representative encodings match node:fs/promises', async (t) => {
  const root = await withFixture(t)

  for (const [encoding, value] of [
    ['hex', 'cafebabe'],
    ['base64', Buffer.from('hello').toString('base64')],
    ['latin1', 'abc'],
  ] as const) {
    const nodeFile = path.join(root, `node-${encoding}.bin`)
    const rushFile = path.join(root, `rush-${encoding}.bin`)
    await nodeFs.writeFile(nodeFile, value, { encoding })
    await writeFile(rushFile, value, { encoding })
    t.deepEqual(await nodeFs.readFile(rushFile), await nodeFs.readFile(nodeFile), encoding)
  }
})

test('writeFile: sync string and Buffer side effects match node:fs', async (t) => {
  const root = await withFixture(t)
  const nodeString = path.join(root, 'node-string.txt')
  const rushString = path.join(root, 'rush-string.txt')
  const nodeBuffer = path.join(root, 'node-buffer.bin')
  const rushBuffer = path.join(root, 'rush-buffer.bin')

  nodeFsSync.writeFileSync(nodeString, 'sync text')
  writeFileSync(rushString, 'sync text')
  nodeFsSync.writeFileSync(nodeBuffer, Buffer.from([1, 2, 3]))
  writeFileSync(rushBuffer, Buffer.from([1, 2, 3]))

  t.is(nodeFsSync.readFileSync(rushString, 'utf8'), nodeFsSync.readFileSync(nodeString, 'utf8'))
  t.deepEqual(nodeFsSync.readFileSync(rushBuffer), nodeFsSync.readFileSync(nodeBuffer))
})

test('writeFile: flag wx rejects existing files in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-exists.txt')
  const rushFile = path.join(root, 'rush-exists.txt')
  await nodeFs.writeFile(nodeFile, 'base')
  await nodeFs.writeFile(rushFile, 'base')

  const nodeResult = await capture(() => nodeFs.writeFile(nodeFile, 'next', { flag: 'wx' }))
  const rushResult = await capture(() => writeFile(rushFile, 'next', { flag: 'wx' }) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
})

test('writeFile: missing parent rejects in both implementations', async (t) => {
  const root = await withFixture(t)
  const nodeFile = path.join(root, 'node-missing', 'file.txt')
  const rushFile = path.join(root, 'rush-missing', 'file.txt')

  const nodeResult = await capture(() => nodeFs.writeFile(nodeFile, 'data'))
  const rushResult = await capture(() => writeFile(rushFile, 'data') as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
})

test('writeFile: mode is applied on unix platforms', async (t) => {
  if (process.platform === 'win32') {
    t.pass('mode semantics differ on Windows')
    return
  }

  const root = await withFixture(t)
  const file = path.join(root, 'mode.txt')
  await writeFile(file, 'mode', { mode: 0o600 })

  t.is(nodeFsSync.statSync(file).mode & 0o777, 0o600)
})
