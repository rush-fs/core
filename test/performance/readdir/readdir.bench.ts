const nodeFs = require('node:fs/promises')
const { readdir } = require('../../../index.js')
const { createScaleFixture, removeFixture } = require('../../fixtures/fs-scale.ts')
const { measure, printComparison } = require('../_helpers/measure.ts')

const scales = process.env.RUSH_FS_EXTREME
  ? ['tiny', 'small', 'medium', 'large', 'extreme']
  : ['tiny', 'small', 'medium', 'large']

async function main(): Promise<void> {
  for (const scale of scales) {
    const fixture = await createScaleFixture('perf-readdir', scale)
    try {
      const node = await measure('node readdir recursive', () => nodeFs.readdir(fixture.root, { recursive: true }))
      const rush = await measure('rush readdir recursive', () => readdir(fixture.root, { recursive: true }))
      printComparison('readdir', scale, node, rush, fixture)
    } finally {
      await removeFixture(fixture.root)
    }
  }
}

module.exports = { main }
