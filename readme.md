[size-image]: https://img.shields.io/github/size/henrygd/queue/dist/index.min.js?style=flat
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

## Queue interface

```ts
/** Add an async function / promise wrapper to the queue */
queue.add<T>(promiseFunction: () => Promise<T>): Promise<T>
/** Returns a promise that resolves when the queue is empty */
queue.done(): Promise<void>
/** Empties the queue (active promises are not cancelled) */
queue.clear(): void
/** Returns the number of promises currently running */
queue.active(): number
/** Returns the total number of promises in the queue */
queue.size(): number
```

## Similar libraries and benchmarks

| Library        | Version | Bundle size | Weekly downloads |
| :------------- | :------ | :---------- | :--------------- |
| @henrygd/queue | 1.0.2   | 332 B       | only me :)       |
| p-limit        | 5.0.0   | 1,763 B     | 118,953,973      |
| async          | 3.2.5   | 21,992 B    | 53,645,627       |
| fastq          | 3.2.5   | 3,050 B     | 39,257,355       |
| queue          | 7.0.0   | 2,840 B     | 4,259,101        |
| promise-queue  | 2.2.5   | 2,200 B     | 1,092,431        |

### Browser benchmark

Each operation adds 1,000 async functions to the queue and waits for them to resolve. The function just increments a counter.

In reality, you may not be running so many jobs at once, and your jobs will take much longer to resolve. So performance will depend more on the jobs themselves.

This test was run on Chromium. Chrome / Edge / Opera are the same. Firefox is slower but differences are fairly similar. On Safari you need to uncheck "Run tests in parallel" to get accurate results, and `queue` is almost as fast as the top two somehow.

You can run or tweak for yourself here: https://jsbm.dev/cnBxC9EQrjHhX

[![@henrygd/queue - 8,632 Ops/s. promise-queue - 4,669 Ops/s. p-limit - 843 Ops/s. queue - 561 Ops/s](https://henrygd-assets.b-cdn.net/queue/benchmark.png)](https://jsbm.dev/cnBxC9EQrjHhX)

### Node benchmark

Same test as the browser benchmark, but uses 5,000 async functions instead of 1,000.

I have no idea what's going on with `p-limit` in node. Running the same test with Bun puts it just behind `queue`.

![@henrygd/queue - 1.61x faster than promise-queue. 2.34x than fastq. 3.49x than async.queue. 4.46x than queue. 72.39x than p-limit.](https://henrygd-assets.b-cdn.net/queue/benchmark-node.png)

## Real world examples

[`henrygd/optimize`](https://github.com/henrygd/optimize) - Uses `@henrygd/queue` to parallelize image optimization jobs.

## License

[MIT license](/LICENSE)
