# truncate SDD

## Scope

- Primary oracle: `node:fs/promises.truncate`.
- Secondary oracle: `node:fs.truncateSync` for the already exported sync API.
- Callback-style `node:fs.truncate` and file-descriptor `ftruncate` are out of scope for the initial production target.

## Node Oracle and Supported Surface

- Supported Rush-FS path input today: `string`.
- Supported length input today: optional number; omitted length means `0`.
- Supported behavior: truncate files shorter, extend files to the requested length, and reject missing paths.
- Unsupported Node surface for this SDD: `Buffer` paths, `URL` paths, callback API shape, file descriptor APIs, exact invalid-length validation, and exact Node error object metadata.

## Functional Matrix

- Promise `truncate` defaults to length `0` like Node.
- Promise `truncate` truncates files to a shorter byte length like Node.
- Promise `truncate` extends files to a longer byte length like Node.
- Sync `truncateSync` matches Node for supported lengths.
- Missing paths reject or throw in both implementations.

## Known Gaps

| Behavior                  | Node oracle                                                     | Current Rush-FS behavior                                                                                                  | Reason                                                                                    | Follow-up                   |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------- |
| Error object fields       | Rejects or throws with Node-style `code`, `syscall`, and `path` | Message contains Node-like text for missing paths, but N-API exposes `code: "GenericFailure"` and omits structured fields | Runtime error construction does not yet map filesystem metadata into Node-style JS errors | Runtime error compatibility |
| Path-like inputs          | Node accepts strings, Buffers, and file URLs                    | Type surface currently accepts string paths only                                                                          | Path input expansion is deferred globally                                                 | API surface expansion       |
| Invalid length validation | Node rejects negative or out-of-range lengths                   | Rush-FS currently clamps negative lengths to `0`                                                                          | Runtime length validation is simplified                                                   | Runtime compatibility       |
| File descriptor APIs      | Node exposes `ftruncate` variants                               | Rush-FS exports path-based `truncate` only                                                                                | File descriptor APIs are outside the current promise-first surface                        | API surface expansion       |

## Performance Metrics

- No dedicated local performance report in this rollout.
- `truncate` is a single file mutation syscall; behavior and error parity are higher-value than report-only microbenchmarks here.

## Docs Alignment

- Docs must state default length `0` and extension behavior.
- Docs must document unsupported path inputs and invalid-length validation gap.
- Docs must keep the error object known gap visible until fixed.
