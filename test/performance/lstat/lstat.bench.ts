const nodeFs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { lstat } = require('../../../index.js')
const { removeFixture } = require('../../fixtures/fs-scale.ts')
const { measure, printComparison } = require('../_helpers/measure.ts')

async function main(): Promise<void> {
  const root = await nodeFs.mkdtemp(path.join(os.tmpdir(), 'rush-fs-perf-lstat-'))
  try {
    const file = path.join(root, 'file.txt')
    const dir = path.join(root, 'dir')
    const link = path.join(root, 'link.txt')
    await nodeFs.writeFile(file, 'hello lstat')
    await nodeFs.mkdir(dir)

    const batchFiles = []
    for (let i = 0; i < 128; i++) {
      const batchFile = path.join(root, `batch-${i}.txt`)
      await nodeFs.writeFile(batchFile, 'x')
      batchFiles.push(batchFile)
    }

    const fileNode = await measure('node lstat file', () => nodeFs.lstat(file))
    const fileRush = await measure('rush lstat file', () => lstat(file))
    printComparison('lstat', 'single-file', fileNode, fileRush)

    const dirNode = await measure('node lstat directory', () => nodeFs.lstat(dir))
    const dirRush = await measure('rush lstat directory', () => lstat(dir))
    printComparison('lstat', 'directory', dirNode, dirRush)

    if (process.platform !== 'win32') {
      await nodeFs.symlink(file, link)
      const linkNode = await measure('node lstat symlink', () => nodeFs.lstat(link))
      const linkRush = await measure('rush lstat symlink', () => lstat(link))
      printComparison('lstat', 'symlink', linkNode, linkRush)
    }

    const batchNode = await measure('node lstat batch', async () => {
      for (const batchFile of batchFiles) await nodeFs.lstat(batchFile)
    })
    const batchRush = await measure('rush lstat batch', async () => {
      for (const batchFile of batchFiles) await lstat(batchFile)
    })
    printComparison('lstat', 'batch-128-files', batchNode, batchRush)
  } finally {
    await removeFixture(root)
  }
}

module.exports = { main }
