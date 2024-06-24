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

Each operation tests how quickly the queue can resolve 1,000 (browser) or 5,000 (all others) async functions. The function just increments a counter.[^benchmark]

All libraries run the exact same test, so `p-limit` and `promise-queue`, which lack a promise that resolves when the queue is empty, are not penalized by having to use `Promise.all`.

## Browser benchmark

This test was run in Chromium. Chrome and Edge are the same. Firefox and Safari are slower and closer, with `@henrygd/queue` edging out `promise-queue`, then a small gap to `fastq`.

You can run or tweak for yourself here: https://jsbm.dev/8FxNa8pSMHCX2

![@henrygd/queue - 10,608 Ops/s. fastq - 6,286 Ops/s. promise-queue - 5,670 Ops/s. async.queue - 3,960 Ops/s. p-limit - 1,070 Ops/s. queue - 726 Ops/s](https://henrygd-assets.b-cdn.net/queue/bench-browser.png?a)

## Node.js benchmarks

`p-limit` is very slow because it uses `AsyncResource.bind` on every run, which is much faster in Bun than in Node or Deno.

**Ryzen 7 6800H | 32GB RAM | Node.js 22.3.0 | x64 Linux**

| Library        | Speed  | Average | Fastest | Slowest |
| :------------- | :----- | :------ | :------ | ------- |
| @henrygd/queue | 1.00x  | 0.6292  | 0.4143  | 1.3691  |
| fastq          | 1.40x  | 0.8790  | 0.6847  | 2.0978  |
| promise-queue  | 1.53x  | 0.9610  | 0.7953  | 2.4936  |
| async.queue    | 3.18x  | 2.0002  | 1.3959  | 3.4056  |
| queue          | 4.75x  | 2.9906  | 2.2713  | 24.8368 |
| p-limit        | 58.31x | 36.6929 | 32.6756 | 55.5272 |

**Ryzen 5 4500U | 8GB RAM | Node.js 22.3.0 | x64 Linux**

| Library        | Speed  | Average | Fastest | Slowest  |
| :------------- | :----- | :------ | :------ | -------- |
| @henrygd/queue | 1.00x  | 1.4464  | 0.8649  | 4.0576   |
| promise-queue  | 1.51x  | 2.1867  | 1.8211  | 6.4455   |
| fastq          | 1.55x  | 2.2421  | 1.7523  | 5.9954   |
| async.queue    | 3.14x  | 4.5409  | 3.2586  | 7.721    |
| queue          | 13.92x | 20.133  | 18.6923 | 51.2517  |
| p-limit        | 58.93x | 85.229  | 73.2169 | 208.5444 |

## Deno benchmarks

**Ryzen 7 6800H | 32GB RAM | Deno 1.44.4 | x64 Linux**

| Library        | Speed  | Average | Fastest | Slowest |
| :------------- | :----- | :------ | :------ | ------- |
| @henrygd/queue | 1.00x  | 0.4995  | 0.3335  | 1.1774  |
| fastq          | 1.42x  | 0.7116  | 0.5688  | 1.3907  |
| promise-queue  | 1.50x  | 0.7476  | 0.6369  | 1.6997  |
| async.queue    | 3.21x  | 1.6022  | 1.1333  | 2.8973  |
| queue          | 5.18x  | 2.5867  | 1.9987  | 16.0821 |
| p-limit        | 21.80x | 10.8889 | 9.9022  | 22.9115 |

**Ryzen 5 4500U | 8GB RAM | Deno 1.44.4 | x64 Linux**

| Library        | Speed  | Average | Fastest | Slowest |
| :------------- | :----- | :------ | :------ | ------- |
| @henrygd/queue | 1.00x  | 1.1727  | 0.7361  | 2.4714  |
| fastq          | 1.45x  | 1.6971  | 1.2685  | 4.2022  |
| promise-queue  | 1.49x  | 1.7477  | 1.4786  | 3.1661  |
| async.queue    | 3.23x  | 3.7844  | 2.6141  | 5.8011  |
| queue          | 5.21x  | 6.1074  | 4.6434  | 64.4937 |
| p-limit        | 23.12x | 27.1159 | 25.0289 | 49.0373 |

## Bun benchmarks

**Ryzen 7 6800H | 32GB RAM | Bun 1.1.16 | x64 Linux**

| Library        | Speed | Average | Fastest | Slowest |
| :------------- | :---- | :------ | :------ | ------- |
| @henrygd/queue | 1.00x | 0.8561  | 0.6226  | 2.7538  |
| promise-queue  | 1.11x | 0.9471  | 0.7473  | 2.2621  |
| fastq          | 1.37x | 1.1739  | 0.9771  | 2.6227  |
| async.queue    | 2.78x | 2.3767  | 1.9849  | 4.4396  |
| queue          | 4.45x | 3.8085  | 2.706   | 9.9144  |
| p-limit        | 4.87x | 4.1657  | 3.6071  | 16.5183 |

**Ryzen 5 4500U | 8GB RAM | Bun 1.1.16 | x64 Linux**

| Library        | Speed  | Average | Fastest | Slowest |
| :------------- | :----- | :------ | :------ | ------- |
| @henrygd/queue | 1.00x  | 1.8486  | 1.4478  | 5.438   |
| promise-queue  | 1.18x  | 2.1856  | 1.8773  | 5.3354  |
| fastq          | 1.51x  | 2.7949  | 2.4237  | 5.6265  |
| async.queue    | 2.63x  | 4.8638  | 4.0598  | 14.2662 |
| p-limit        | 4.99x  | 9.2239  | 8.2851  | 19.6944 |
| queue          | 11.88x | 21.953  | 18.9503 | 43.5050 |

## Cloudflare Workers benchmark

Uses [oha](https://github.com/hatoo/oha) to make 1,000 requests to each worker. Measures creation time in addition to throughput, as a new queue is made for each request.

This was run locally using [Wrangler](https://developers.cloudflare.com/workers/get-started/guide/) on a Ryzen 7 6800H laptop. Wrangler uses the same [workerd](https://github.com/cloudflare/workerd) runtime as workers deployed to Cloudflare, so the relative difference should be accurate. Here's the [repository for this benchmark](https://github.com/henrygd/async-queue-wrangler-benchmark).

| Library        | Requests/sec | Total (sec) | Average | Slowest |
| :------------- | :----------- | :---------- | :------ | :------ |
| @henrygd/queue | 790.4110     | 1.2652      | 0.0622  | 0.0941  |
| promise-queue  | 647.2809     | 1.5449      | 0.0759  | 0.1149  |
| fastq          | 336.7031     | 3.0877      | 0.1459  | 0.2080  |
| async.queue    | 198.9986     | 5.0252      | 0.2468  | 0.3544  |
| queue          | 85.6483      | 11.6757     | 0.5732  | 0.7629  |
| p-limit        | 77.7434      | 12.8628     | 0.6316  | 0.9585  |

Worth noting that `promise-queue` shot up by nearly 300 req/s after I made the tests uniform and removed its use of `Promise.all` to wait for the queue to be done. I ended up adding a check in every function, which is a bit convoluted but works. Much easier when you have the option to use a promise like `queue.done()`.

## Real world examples

[`henrygd/optimize`](https://github.com/henrygd/optimize) - Uses `@henrygd/queue` to parallelize image optimization jobs.

## License

[MIT license](/LICENSE)

[^benchmark]: In reality, you may not be running so many jobs at once, and your jobs will take much longer to resolve. So performance will depend more on the jobs themselves.
