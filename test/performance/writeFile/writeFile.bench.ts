const nodeFs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { writeFile } = require('../../../index.js')
const { removeFixture } = require('../../fixtures/fs-scale.ts')
const { measure, printComparison } = require('../_helpers/measure.ts')

const scenarios = [
  { name: 'small-string', size: 128, data: () => 'x'.repeat(128) },
  { name: 'medium-string', size: 64 * 1024, data: () => 'x'.repeat(64 * 1024) },
  { name: 'large-string', size: 4 * 1024 * 1024, data: () => 'x'.repeat(4 * 1024 * 1024) },
  { name: 'medium-buffer', size: 64 * 1024, data: () => Buffer.alloc(64 * 1024, 'x') },
]

async function main(): Promise<void> {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-perf-writeFile-'))
  try {
    for (const scenario of scenarios) {
      let nodeFile = ''
      let rushFile = ''
      const node = await measure(`node writeFile ${scenario.name}`, () => nodeFs.writeFile(nodeFile, scenario.data()), {
        beforeEach: ({ index, warmup }) => {
          nodeFile = path.join(root, `node-${scenario.name}-${warmup ? 'warmup' : 'sample'}-${index}`)
        },
        afterEach: () => removeFixture(nodeFile),
      })
      const rush = await measure(`rush writeFile ${scenario.name}`, () => writeFile(rushFile, scenario.data()), {
        beforeEach: ({ index, warmup }) => {
          rushFile = path.join(root, `rush-${scenario.name}-${warmup ? 'warmup' : 'sample'}-${index}`)
        },
        afterEach: () => removeFixture(rushFile),
      })
      printComparison('writeFile', scenario.name, node, rush)
    }
  } finally {
    await removeFixture(root)
  }
}

module.exports = { main }
