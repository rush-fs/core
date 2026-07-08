import test from 'ava'
import * as nodeFs from 'node:fs/promises'
import { glob } from '../../../index.js'
import { createScaleFixture, removeFixture } from '../../fixtures/fs-scale.ts'
import { normalizeDirents, normalizePaths } from '../_helpers/normalize.ts'

async function collectNodeGlob(pattern: string, options: Record<string, unknown>): Promise<unknown[]> {
  const results: unknown[] = []
  for await (const entry of nodeFs.glob(pattern, options)) {
    results.push(entry)
  }
  return results
}

test('glob: promise recursive pattern matches node:fs/promises', async (t) => {
  const fixture = await createScaleFixture('glob', 'small')
  try {
    const nodeResult = (await collectNodeGlob('**/*.txt', { cwd: fixture.root })) as string[]
    const rushResult = (await glob('**/*.txt', { cwd: fixture.root })) as string[]
    t.deepEqual(normalizePaths(rushResult), normalizePaths(nodeResult))
  } finally {
    await removeFixture(fixture.root)
  }
})

test('glob: promise withFileTypes matches Node dirent predicates', async (t) => {
  const fixture = await createScaleFixture('glob', 'tiny')
  try {
    const nodeResult = await collectNodeGlob('**/*.txt', { cwd: fixture.root, withFileTypes: true })
    const rushResult = (await glob('**/*.txt', { cwd: fixture.root, withFileTypes: true })) as unknown[]
    t.deepEqual(normalizeDirents(rushResult), normalizeDirents(nodeResult))
  } finally {
    await removeFixture(fixture.root)
  }
})

test('glob: no-match pattern returns an empty array', async (t) => {
  const fixture = await createScaleFixture('glob', 'tiny')
  try {
    const rushResult = (await glob('**/*.missing', { cwd: fixture.root })) as string[]
    t.deepEqual(rushResult, [])
  } finally {
    await removeFixture(fixture.root)
  }
})
