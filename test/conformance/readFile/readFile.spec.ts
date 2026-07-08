import test from 'ava'
import * as nodeFs from 'node:fs/promises'
import * as nodeFsSync from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { readFile, readFileSync, writeFileSync } from '../../../index.js'
import { capture } from '../_helpers/normalize.ts'

async function withFixture(t: { teardown(fn: () => void | Promise<void>): void }) {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-conformance-readFile-'))
  t.teardown(() => nodeFs.rm(root, { recursive: true, force: true }))
  return root
}

function asBuffer(value: unknown): Buffer {
  if (!Buffer.isBuffer(value)) {
    throw new TypeError('Expected Buffer result')
  }
  return value
}

test('readFile: promise Buffer output matches node:fs/promises byte-for-byte', async (t) => {
  const root = await withFixture(t)
  const file = path.join(root, 'data.bin')
  const content = Buffer.from([0, 1, 2, 3, 255])
  await nodeFs.writeFile(file, content)

  const nodeResult = await nodeFs.readFile(file)
  const rushResult = await readFile(file)

  t.deepEqual(asBuffer(rushResult), nodeResult)
})

test('readFile: promise text encodings match node:fs/promises', async (t) => {
  const root = await withFixture(t)
  const file = path.join(root, 'text.txt')
  await nodeFs.writeFile(file, 'hello rush-fs\nline 2\n', 'utf8')

  for (const encoding of ['utf8', 'utf-8', 'ascii', 'latin1', 'base64', 'base64url', 'hex']) {
    const nodeResult = await nodeFs.readFile(file, { encoding: encoding as BufferEncoding })
    const rushResult = await readFile(file, { encoding })
    t.is(rushResult, nodeResult, encoding)
  }
})

test('readFile: sync Buffer and utf8 output match node:fs', async (t) => {
  const root = await withFixture(t)
  const file = path.join(root, 'sync.txt')
  await nodeFs.writeFile(file, 'sync text', 'utf8')

  t.deepEqual(asBuffer(readFileSync(file)), nodeFsSync.readFileSync(file))
  t.is(readFileSync(file, { encoding: 'utf8' }), nodeFsSync.readFileSync(file, 'utf8'))
})

test('readFile: Rush-FS lines extension reads a documented text range', async (t) => {
  const root = await withFixture(t)
  const file = path.join(root, 'lines.txt')
  const text = ['line 1', 'line 2', 'line 3', 'line 4'].join('\n')
  writeFileSync(file, text)

  t.is(await readFile(file, { encoding: 'utf8', lines: { from: 2, to: 3 } }), ['line 2', 'line 3'].join('\n'))
})

test('readFile: missing file rejects in both implementations', async (t) => {
  const root = await withFixture(t)
  const missing = path.join(root, 'missing.txt')

  const nodeResult = await capture(() => nodeFs.readFile(missing))
  const rushResult = await capture(() => readFile(missing) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
})

test('readFile: directory input rejects in both implementations', async (t) => {
  const root = await withFixture(t)

  const nodeResult = await capture(() => nodeFs.readFile(root))
  const rushResult = await capture(() => readFile(root) as Promise<unknown>)

  t.false(nodeResult.ok)
  t.false(rushResult.ok)
})
