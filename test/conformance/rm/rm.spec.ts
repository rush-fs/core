import test from 'ava'
import * as nodeFs from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'
import { rm } from '../../../index.js'
import { copyFixture, createScaleFixture, removeFixture } from '../../fixtures/fs-scale.ts'

test('rm: promise recursive removal matches node:fs/promises side effects', async (t) => {
  const fixture = await createScaleFixture('rm', 'tiny')
  const nodeRoot = await copyFixture(fixture.root, 'node-rm')
  const rushRoot = await copyFixture(fixture.root, 'rush-rm')

  try {
    await nodeFs.rm(nodeRoot, { recursive: true })
    await rm(rushRoot, { recursive: true })
    await t.throwsAsync(() => nodeFs.stat(nodeRoot), { code: 'ENOENT' })
    await t.throwsAsync(() => nodeFs.stat(rushRoot), { code: 'ENOENT' })
  } finally {
    await removeFixture(fixture.root)
    await removeFixture(nodeRoot)
    await removeFixture(rushRoot)
  }
})

test('rm: force missing path resolves in both implementations', async (t) => {
  const missing = path.join(os.tmpdir(), `rush-fs-rm-missing-${Date.now()}`)
  await t.notThrowsAsync(() => nodeFs.rm(missing, { force: true }))
  await t.notThrowsAsync(() => rm(missing, { force: true }) as Promise<unknown>)
})
