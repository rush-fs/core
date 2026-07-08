#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import { createRequire } from 'node:module'

const performanceRoot = path.resolve('test/performance')
const filter = process.argv[2]?.toLowerCase()
const require = createRequire(import.meta.url)

async function run() {
  const apiDirs = fs
    .readdirSync(performanceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .filter((name) => !filter || name.includes(filter))

  if (apiDirs.length === 0) {
    console.log(`No performance tests found${filter ? ` for "${filter}"` : ''}.`)
    return
  }

  for (const api of apiDirs) {
    const benchFile = path.join(performanceRoot, api, `${api}.bench.ts`)
    if (fs.existsSync(benchFile)) {
      require(benchFile)
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
