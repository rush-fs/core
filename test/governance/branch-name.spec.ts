import test from 'ava'
import { execFileSync } from 'node:child_process'
import * as path from 'node:path'

const script = path.resolve('scripts/validate-branch-name.mjs')

function run(branch: string): void {
  execFileSync('node', [script], {
    env: { ...process.env, BRANCH_NAME: branch },
    stdio: 'pipe',
  })
}

test('branch validation accepts development branches', (t) => {
  t.notThrows(() => run('feat/node-fs-conformance'))
  t.notThrows(() => run('fix/glob-error-shape'))
  t.notThrows(() => run('perf/readdir-large-tree'))
})

test('branch validation accepts test branches derived from development branches', (t) => {
  t.notThrows(() => run('test-feat/node-fs-conformance'))
  t.notThrows(() => run('test-perf/readdir-large-tree'))
})

test('branch validation rejects malformed branches', (t) => {
  t.throws(() => run('feature/node-fs-conformance'))
  t.throws(() => run('feat/NodeFsConformance'))
  t.throws(() => run('test/feat-node-fs-conformance'))
})
