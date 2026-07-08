const nodeFs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { cp } = require('../../../index.js')
const { createScaleFixture, removeFixture } = require('../../fixtures/fs-scale.ts')
const { measure, printComparison } = require('../_helpers/measure.ts')

const scales = process.env.RUSH_FS_EXTREME
  ? ['tiny', 'small', 'medium', 'large', 'extreme']
  : ['tiny', 'small', 'medium', 'large']

async function main(): Promise<void> {
  for (const scale of scales) {
    const fixture = await createScaleFixture('perf-cp', scale)
    const destRoot = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-perf-cp-'))
    try {
      const nodeDest = path.join(destRoot, 'node')
      const rushDest = path.join(destRoot, 'rush')
      const node = await measure('node cp recursive', () => nodeFs.cp(fixture.root, nodeDest, { recursive: true }))
      const rush = await measure('rush cp recursive', () =>
        cp(fixture.root, rushDest, { recursive: true, concurrency: 4 }),
      )
      printComparison('cp', scale, node, rush)
    } finally {
      await removeFixture(fixture.root)
      await removeFixture(destRoot)
    }
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
