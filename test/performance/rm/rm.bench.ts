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
    let nodeRoot = ''
    let rushRoot = ''
    try {
      const node = await measure('node rm recursive', () => nodeFs.rm(nodeRoot, { recursive: true }), {
        beforeEach: ({ index, warmup }) =>
          copyFixture(fixture.root, `perf-node-rm-${warmup ? 'warmup' : 'sample'}-${index}`).then((root) => {
            nodeRoot = root
          }),
        afterEach: () => removeFixture(nodeRoot),
      })
      const rush = await measure('rush rm recursive', () => rm(rushRoot, { recursive: true, concurrency: 4 }), {
        beforeEach: ({ index, warmup }) =>
          copyFixture(fixture.root, `perf-rush-rm-${warmup ? 'warmup' : 'sample'}-${index}`).then((root) => {
            rushRoot = root
          }),
        afterEach: () => removeFixture(rushRoot),
      })
      printComparison('rm', scale, node, rush, fixture)
    } finally {
      await removeFixture(fixture.root)
      await removeFixture(nodeRoot)
      await removeFixture(rushRoot)
    }
  }
}

module.exports = { main }
