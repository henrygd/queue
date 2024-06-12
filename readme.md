[size-image]: https://img.shields.io/github/size/henrygd/queue/index.js?style=flat
[license-image]: https://img.shields.io/github/license/henrygd/bigger-picture?style=flat&color=%2349ac0c
[license-url]: /LICENSE

# @henrygd/queue ![File Size][size-image] [![MIT license][license-image]][license-url]

Tiny async queue with concurrency control. Like `p-limit` but smaller, faster, and easier.

## Installation

```bash
pnpm install @henrygd/queue
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

## Benchmark

Average of five runs passing `Promise.resolve()` through the same queue one million times on a Ryzen 7 6800H laptop using Bun 1.1.12.

`p-limit` is used for comparison because it's the most popular comparable library, with 117 million weekly downloads (!) as of June 2024. I've used it before and it's great.

Also included is the minified bundle size (no gzip) for reference.

| Library        | Version | Time (ms) | Heap size (MB) | Bundle size (B) |
| -------------- | ------- | --------- | -------------- | --------------- |
| @henrygd/queue | 1.0.0   | 512       | 37.4           | 352             |
| p-limit        | 5.0.0   | 2,276     | 223.3          | 1,763           |

## Real world examples

[`henrygd/optimize`](https://github.com/henrygd/optimize) - Uses `@henrygd/queue` to parallelize image optimization jobs.

## License

[MIT license](/LICENSE)
