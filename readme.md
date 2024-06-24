[size-image]: https://img.shields.io/github/size/henrygd/queue/dist/index.min.js?style=flat
[license-image]: https://img.shields.io/github/license/henrygd/bigger-picture?style=flat&color=%2349ac0c
[license-url]: /LICENSE

# @henrygd/queue

[![File Size][size-image]](https://github.com/henrygd/queue/blob/main/dist/index.min.js) [![MIT license][license-image]][license-url] [![JSR Score 100%](https://jsr.io/badges/@henrygd/queue/score)](https://jsr.io/@henrygd/queue)

Tiny async queue with concurrency control. Like `p-limit` or `fastq`, but smaller and faster. See [comparisons and benchmarks](#comparisons-and-benchmarks) below.

Works with: <img alt="browsers" title="This package works with browsers." height="16px" src="https://jsr.io/logos/browsers.svg" /> <img alt="Deno" title="This package works with Deno." height="16px" src="https://jsr.io/logos/deno.svg" /> <img alt="Node.js" title="This package works with Node.js" height="16px" src="https://jsr.io/logos/node.svg" /> <img alt="Cloudflare Workers" title="This package works with Cloudflare Workers." height="16px" src="https://jsr.io/logos/cloudflare-workers.svg" /> <img alt="Bun" title="This package works with Bun." height="16px" src="https://jsr.io/logos/bun.svg" />

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
queue.add<T>(promiseFunction: () => PromiseLike<T>): Promise<T>
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

| Library                                                         | Version | Bundle size (B) | Weekly downloads |
| :-------------------------------------------------------------- | :------ | :-------------- | :--------------- |
| @henrygd/queue                                                  | 1.0.5   | 339             | dozens :)        |
| [p-limit](https://github.com/sindresorhus/p-limit)              | 5.0.0   | 1,763           | 118,953,973      |
| [async.queue](https://github.com/caolan/async)                  | 3.2.5   | 6,873           | 53,645,627       |
| [fastq](https://github.com/mcollina/fastq)                      | 1.17.1  | 3,050           | 39,257,355       |
| [queue](https://github.com/jessetane/queue)                     | 7.0.0   | 2,840           | 4,259,101        |
| [promise-queue](https://github.com/promise-queue/promise-queue) | 2.2.5   | 2,200           | 1,092,431        |

### Note on benchmarks

All libraries run the exact same test. Each operation measures how quickly the queue can resolve 1,000 async functions. The function just increments a counter and checks if it has reached 1,000.[^benchmark]

We check for completion inside the function so that `promise-queue` and `p-limit` are not penalized by having to use `Promise.all` (they don't provide a promise that resolves when the queue is empty).

## Browser benchmark

This test was run in Chromium. Chrome and Edge are the same. Firefox and Safari are slower and closer, with `promise-queue` in second and `fastq` in third.

You can run or tweak for yourself here: https://jsbm.dev/c5W1T8CzAw232

![@henrygd/queue - 13,665 Ops/s. fastq - 7,661 Ops/s. promise-queue - 7,650 Ops/s. async.queue - 4,060 Ops/s. p-limit - 1,067 Ops/s. queue - 721 Ops/s](https://henrygd-assets.b-cdn.net/queue/browser-bench.png)

## Node.js benchmarks

`p-limit` is very slow because it uses `AsyncResource.bind` on every run, which is much faster in Bun than in Node or Deno.

Ryzen 5 4500U | 8GB RAM | Node 22.3.0

![@henrygd/queue - 1.7x faster than fastq. 1.82x promise-queue. 3.45x async.queue. 18.55x queue. 73x p-limit.](https://henrygd-assets.b-cdn.net/queue/node-4500u.png)

Ryzen 7 6800H | 32GB RAM | Node 22.3.0

![@henrygd/queue - 1.56x faster than fastq. 1.73x promise-queue. 3.31x async.queue. 5.68x queue. 77x p-limit.](https://henrygd-assets.b-cdn.net/queue/node-6800h.png)

## Deno benchmarks

Ryzen 5 4500U | 8GB RAM | Deno 1.44.4

![@henrygd/queue - 1.66x faster than fastq. 1.79x promise-queue. 3.3x async.queue. 6x queue. 24x p-limit.](https://henrygd-assets.b-cdn.net/queue/deno-4500u.png)

Ryzen 7 6800H | 32GB RAM | Deno 1.44.4

![@henrygd/queue - 1.6x faster than fastq. 1.71x promise-queue. 3.2x async.queue. 6.24x queue. 23x p-limit.](https://henrygd-assets.b-cdn.net/queue/deno-6800h.png)

## Bun benchmarks

Ryzen 5 4500U | 8GB RAM | Bun 1.1.16

![@henrygd/queue - 1.32x faster than promise-queue. 1.58x fastq. 2.62x async.queue. 5.36x p-limit. 12.65x queue.](https://henrygd-assets.b-cdn.net/queue/bun-4500u.png)

Ryzen 7 6800H | 32GB RAM | Bun 1.1.16

![@henrygd/queue - 1.2x faster than promise-queue. 1.54x fastq. 2.76x async.queue. 5.45x p-limit. 5.83x queue.](https://henrygd-assets.b-cdn.net/queue/bun-6800h.png)

## Cloudflare Workers benchmark

Uses [oha](https://github.com/hatoo/oha) to make 1,000 requests to each worker. Each request creates a queue and resolves 5,000 functions.

This was run locally using [Wrangler](https://developers.cloudflare.com/workers/get-started/guide/) on a Ryzen 7 6800H laptop. Wrangler uses the same [workerd](https://github.com/cloudflare/workerd) runtime as workers deployed to Cloudflare, so the relative difference should be accurate. Here's the [repository for this benchmark](https://github.com/henrygd/async-queue-wrangler-benchmark).

| Library        | Requests/sec | Total (sec) | Average | Slowest |
| :------------- | :----------- | :---------- | :------ | :------ |
| @henrygd/queue | 816.1074     | 1.2253      | 0.0602  | 0.0864  |
| promise-queue  | 647.2809     | 1.5449      | 0.0759  | 0.1149  |
| fastq          | 336.7031     | 3.0877      | 0.1459  | 0.2080  |
| async.queue    | 198.9986     | 5.0252      | 0.2468  | 0.3544  |
| queue          | 85.6483      | 11.6757     | 0.5732  | 0.7629  |
| p-limit        | 77.7434      | 12.8628     | 0.6316  | 0.9585  |

## Real world examples

[`henrygd/optimize`](https://github.com/henrygd/optimize) - Uses `@henrygd/queue` to parallelize image optimization jobs.

## License

[MIT license](/LICENSE)

[^benchmark]: In reality, you may not be running so many jobs at once, and your jobs will take much longer to resolve. So performance will depend more on the jobs themselves.
