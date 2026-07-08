const nodeFs = require('node:fs/promises')
const { rm } = require('../../../index.js')
const { copyFixture, createScaleFixture, removeFixture } = require('../../fixtures/fs-scale.ts')
const { measure, printComparison } = require('../_helpers/measure.ts')

const scales = process.env.RUSH_FS_EXTREME
  ? ['tiny', 'small', 'medium', 'large', 'extreme']
  : ['tiny', 'small', 'medium', 'large']

async function main(): Promise<void> {
  for (const scale of scales) {
    const fixture = await createScaleFixture('perf-rm', scale)
    const nodeRoot = await copyFixture(fixture.root, 'perf-node-rm')
    const rushRoot = await copyFixture(fixture.root, 'perf-rush-rm')
    try {
      const node = await measure('node rm recursive', () => nodeFs.rm(nodeRoot, { recursive: true }))
      const rush = await measure('rush rm recursive', () => rm(rushRoot, { recursive: true, concurrency: 4 }))
      printComparison('rm', scale, node, rush)
    } finally {
      await removeFixture(fixture.root)
      await removeFixture(nodeRoot)
      await removeFixture(rushRoot)
    }
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
