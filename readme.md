[size-image]: https://img.shields.io/github/size/henrygd/queue/index.js?style=flat
[license-image]: https://img.shields.io/github/license/henrygd/bigger-picture?style=flat&color=%2349ac0c
[license-url]: /LICENSE

# @henrygd/queue ![File Size][size-image] [![MIT license][license-image]][license-url]

Tiny async queue with concurrency control. Like `p-limit`, `promise-queue`, or `queue`, but a lot smaller.

## Installation

```bash
pnpm install @henrygd/queue
```

## Usage

Add promises to the queue with the `add` method. It returns a promise that resolves when the job is finished.

```ts
import { newQueue } from '@henrygd/queue'

// exmaple promise that waits for x milliseconds
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// create a queue with a maximum of 5 concurrent jobs
const queue = newQueue(5)

// add 25 promises to the queue and log when they finish
for (let i = 1; i <= 25; i++) {
	queue.add(() => wait(500)).then(() => console.log(i, 'done'))
}
```

The returned promise has the same type as the supplied promise, so use it as if you were using the supplied promise directly.

```ts
const queue = newQueue(2)

const sites = [
	'https://google.com',
	'https://github.com',
	'https://youtube.com',
	'https://twitter.com',
	'https://facebook.com',
	'https://reddit.com',
]

for (const site of sites) {
	queue.add(() => fetch(site)).then((res) => console.log(site, res.status))
}
```

<!--
## CDN usage -->
