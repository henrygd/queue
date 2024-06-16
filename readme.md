[size-image]: https://img.shields.io/github/size/henrygd/queue/dist/index.min.js?style=flat
[license-image]: https://img.shields.io/github/license/henrygd/bigger-picture?style=flat&color=%2349ac0c
[license-url]: /LICENSE

# @henrygd/queue

[![File Size][size-image]](https://github.com/henrygd/queue/blob/main/dist/index.min.js) [![MIT license][license-image]][license-url] [![JSR Score 100%](https://jsr.io/badges/@henrygd/queue/score)](https://jsr.io/@henrygd/queue)

Tiny async queue with concurrency control. Like `p-limit` or `fastq`, but smaller and faster. See [comparisons and benchmarks](#comparisons-and-benchmarks) below.

Works with: <img alt="browsers" title="This package works with browsers." height="16px" src="https://jsr.io/logos/browsers.svg" /> <img alt="Deno" title="This package works with Deno." height="16px" src="https://jsr.io/logos/deno.svg" /> <img alt="Node.js" title="This package works with Node.js" height="16px" src="https://jsr.io/logos/node.svg" /> <img alt="Cloudflare Workers" title="This package works with Cloudflare Workers." height="16px" src="https://jsr.io/logos/cloudflare-workers.svg" /> <img alt="Bun" title="This package works with Bun." height="16px" src="https://jsr.io/logos/bun.svg" />

<!--
## Installation

```bash
npm install @henrygd/queue
``` -->

## Usage

Create a queue with the `newQueue` function. Then add async functions - or promise returning functions - to your queue with the `add` method.

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

The return value of `queue.add` is the same as the return value of the supplied function.

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

## Comparisons and benchmarks

| Library                                                         | Version | Bundle size (B) | Weekly downloads    |
| :-------------------------------------------------------------- | :------ | :-------------- | :------------------ |
| @henrygd/queue                                                  | 1.0.3   | 330             | probably only me :) |
| [p-limit](https://github.com/sindresorhus/p-limit)              | 5.0.0   | 1,763           | 118,953,973         |
| [async.queue](https://github.com/caolan/async)                  | 3.2.5   | 6,873           | 53,645,627          |
| [fastq](https://github.com/mcollina/fastq)                      | 1.17.1  | 3,050           | 39,257,355          |
| [queue](https://github.com/jessetane/queue)                     | 7.0.0   | 2,840           | 4,259,101           |
| [promise-queue](https://github.com/promise-queue/promise-queue) | 2.2.5   | 2,200           | 1,092,431           |

### Browser benchmark

Each operation adds 1,000 async functions to the queue and waits for them to resolve. The function just increments a counter.[^benchmark]

This test was run in Chromium. Chrome and Edge are the same. Firefox and Safari are slower and closer, with `@henrygd/queue` edging out `promise-queue`, then a small gap to `fastq`.

You can run or tweak for yourself here: https://jsbm.dev/8FxNa8pSMHCX2

![@henrygd/queue - 10,608 Ops/s. fastq - 6,286 Ops/s. promise-queue - 5,670 Ops/s. async.queue - 3,960 Ops/s. p-limit - 1,070 Ops/s. queue - 726 Ops/s](https://henrygd-assets.b-cdn.net/queue/bench-browser.png?a)

### Node.js benchmarks

Same tests as the browser benchmark, but uses 5,000 async functions instead of 1,000.

`p-limit` is very slow in Node because it uses `AsyncResource.bind` on every run, which seems to be a lot slower in Node than in Bun.

**Ryzen 7 6800H | 32GB RAM**

![@henrygd/queue - 1.61x faster than promise-queue. 1.83x than fastq. 3.52x than async.queue. 4.67x than queue. 68x than p-limit.](https://henrygd-assets.b-cdn.net/queue/bench-node-6800.png)

**Ryzen 5 4500U | 8GB RAM**

![@henrygd/queue - 1.67x faster than promise-queue. 1.84 than fastq. 3.36x than async.queue. 13.22x than queue. 61x than p-limit.](https://henrygd-assets.b-cdn.net/queue/bench-node-4500.png)

### Bun benchmark

Same tests as Node.

**Ryzen 7 6800H | 32GB RAM**

![@henrygd/queue -  1.24x than fastq. 1.32x faster than promise-queue. 2.36x than async.queue. 3.96x than queue. 4.55x than p-limit.](https://henrygd-assets.b-cdn.net/queue/bench-bun-6800.png)

**Ryzen 5 4500U | 8GB RAM**

![@henrygd/queue - 1.33x than fastq. 1.35x faster than promise-queue. 2.17x than async.queue. 10.14x than queue. 4.61x than p-limit.](https://henrygd-assets.b-cdn.net/queue/bench-bun-4500.png)

### Cloudflare Workers benchmark

Same test as above, with 5,000 functions, and uses [oha](https://github.com/hatoo/oha) to make 1,000 requests to each worker.

This was run using [Wrangler](https://developers.cloudflare.com/workers/get-started/guide/) on a Ryzen 7 6800H laptop. Wrangler uses the same [workerd](https://github.com/cloudflare/workerd) runtime as workers deployed to Cloudflare, so the relative difference should be accurate. Here's the [repository for this benchmark](https://github.com/henrygd/async-queue-wrangler-benchmark).

| Library        | Requests/sec | Total (sec) | Average | Slowest |
| :------------- | :----------- | :---------- | :------ | :------ |
| @henrygd/queue | 660.3245     | 1.5144      | 0.0744  | 0.1097  |
| promise-queue  | 349.1807     | 2.8638      | 0.1408  | 0.1947  |
| fastq          | 323.8708     | 3.0877      | 0.1514  | 0.2053  |
| async.queue    | 199.7961     | 5.0051      | 0.2458  | 0.3492  |
| queue          | 84.9245      | 11.7752     | 0.5784  | 0.8502  |
| p-limit        | 67.6111      | 14.7905     | 0.7260  | 0.9606  |

## Real world examples

[`henrygd/optimize`](https://github.com/henrygd/optimize) - Uses `@henrygd/queue` to parallelize image optimization jobs.

## License

[MIT license](/LICENSE)

[^benchmark]: In reality, you may not be running so many jobs at once, and your jobs will take much longer to resolve. So performance will depend more on the jobs themselves.
