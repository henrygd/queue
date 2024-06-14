[size-image]: https://img.shields.io/github/size/henrygd/queue/index.js?style=flat
[license-image]: https://img.shields.io/github/license/henrygd/bigger-picture?style=flat&color=%2349ac0c
[license-url]: /LICENSE

# @henrygd/queue ![File Size][size-image] [![MIT license][license-image]][license-url]

Tiny async queue with concurrency control. Like `p-limit` but smaller, faster, and easier.

## Installation

```bash
npm install @henrygd/queue
```

## Usage

Create a queue with the `newQueue` function, then add promises / async functions to the queue with the `add` method.

You can use `queue.done()` to wait for the queue to be empty.

<!-- prettier-ignore -->
```ts
import { newQueue } from '@henrygd/queue'

// create a new queue with a concurrency of 2
const queue = newQueue(2)

const pokemon = ['ditto', 'hitmonlee', 'pidgeot', 'poliwhirl', 'golem', 'charizard']

for (const name of pokemon) {
    queue.add(async () => {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
        const json = await res.json()
        console.log(`${json.name}: ${json.height * 10}cm | ${json.weight / 10}kg`)
    })
}

console.log('running')
await queue.done()
console.log('done')
```

The return type is the same as the supplied promise, so you can use it as if you were using the supplied promise directly.

```ts
const res = await queue.add(() => fetch('https://pokeapi.co/api/v2/pokemon'))
console.log(res.ok, res.status, res.headers)
```

> [!TIP]
> If you need support for Node's [AsyncLocalStorage](https://nodejs.org/api/async_context.html#introduction), import `@henrygd/queue/async-storage` instead.

## Interface

```ts
// add adds a promise / async function to the queue
queue.add(() => Promise<T>): Promise<T>
// size returns the total number of promises in the queue
queue.size(): number
// active returns the number of promises currently running
queue.active(): number
// clear empties the queue (active promises are not cancelled)
queue.clear(): void
// done returns a promise that resolves when the queue is empty
queue.done(): Promise<void>
```

## Similar libraries and benchmarks

| Library        | Version | Weekly downloads | Bundle size (bytes) |
| -------------- | ------- | ---------------- | ------------------- |
| @henrygd/queue | 1.0.1   | only me :)       | 342                 |
| p-limit        | 5.0.0   | 118,953,973      | 1,763               |
| queue          | 7.0.0   | 4,259,101        | 2,840               |
| promise-queue  | 2.2.5   | 1,092,431        | 2,200               |

### Browser benchmark

Each operation adds 1,000 async functions to the queue and waits for them to resolve. The function just increments a counter.

In reality, you may not be running so many jobs at once, and your jobs will take much longer to resolve. So performance will depend more on the jobs themselves.

This test was run on Chromium. Chrome / Edge / Opera are the same. Firefox is slower but differences are fairly similar. On Safari you need to uncheck "Run tests in parallel" to get accurate results, and `queue` is a lot faster somehow.

You can run or tweak for yourself here: https://jsbm.dev/cnBxC9EQrjHhX

[![@henrygd/queue - 8,632 Ops/s. promise-queue - 4,669 Ops/s. p-limit - 843 Ops/s. queue - 561 Ops/s](https://henrygd-assets.b-cdn.net/queue/benchmark.png)](https://jsbm.dev/cnBxC9EQrjHhX)

### Bun benchmark

Same test as the browser benchmark, but uses 2,000 promises instead of 1,000.

![@henrygd/queue - 440 µs/iter. promise-queue - 515 µs/iter. p-limit - 1,716 µs/iter. queue - 1,437 µs/iter.](https://henrygd-assets.b-cdn.net/queue/benchmark-bun.png)

## Real world examples

[`henrygd/optimize`](https://github.com/henrygd/optimize) - Uses `@henrygd/queue` to parallelize image optimization jobs.

## License

[MIT license](/LICENSE)
