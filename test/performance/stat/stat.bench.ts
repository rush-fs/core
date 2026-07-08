const nodeFs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { stat } = require('../../../index.js')
const { removeFixture } = require('../../fixtures/fs-scale.ts')
const { measure, printComparison } = require('../_helpers/measure.ts')

async function main(): Promise<void> {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-perf-stat-'))
  try {
    const file = path.join(root, 'file.txt')
    const dir = path.join(root, 'dir')
    await nodeFs.writeFile(file, 'hello stat')
    await nodeFs.mkdir(dir)

    const batchFiles = []
    for (let i = 0; i < 128; i++) {
      const batchFile = path.join(root, `batch-${i}.txt`)
      await nodeFs.writeFile(batchFile, 'x')
      batchFiles.push(batchFile)
    }

    const fileNode = await measure('node stat file', () => nodeFs.stat(file))
    const fileRush = await measure('rush stat file', () => stat(file))
    printComparison('stat', 'single-file', fileNode, fileRush)

    const dirNode = await measure('node stat directory', () => nodeFs.stat(dir))
    const dirRush = await measure('rush stat directory', () => stat(dir))
    printComparison('stat', 'directory', dirNode, dirRush)

    const batchNode = await measure('node stat batch', async () => {
      for (const batchFile of batchFiles) await nodeFs.stat(batchFile)
    })
    const batchRush = await measure('rush stat batch', async () => {
      for (const batchFile of batchFiles) await stat(batchFile)
    })
    printComparison('stat', 'batch-128-files', batchNode, batchRush)
  } finally {
    await removeFixture(root)
  }
}

module.exports = { main }
