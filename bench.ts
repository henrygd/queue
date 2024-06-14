import { run, bench, baseline } from 'mitata'

import { newQueue } from '.'
import pLimit from 'p-limit'
import pq from 'promise-queue'
import Queue from 'queue'
import { queue as asyncQueue } from 'async'

const concurrency = 5
// warm up - we set to 2,000 later
let loops = 200

const queue = newQueue(concurrency)
const limit = pLimit(concurrency)
const promiseQueue = new pq(concurrency)
const q = new Queue({ results: [], concurrency })
const aQueue = asyncQueue(async (task: () => Promise<any>) => await task(), concurrency)

function checkEqual(a: any, b: any) {
	if (a !== b) {
		throw new Error(`${a} !== ${b}`)
	}
}

baseline('@henrygd/queue', async () => {
	let i = 0
	let j = 0
	while (i < loops) {
		i++
		queue.add(async () => j++)
	}
	await queue.done()
	// make sure all promises resolved
	checkEqual(i, j)
})

bench('promise-queue', async () => {
	let i = 0
	let j = 0
	const jobs = [] as Promise<any>[]
	while (i < loops) {
		i++
		jobs.push(promiseQueue.add(async () => j++))
	}
	await Promise.all(jobs)
	// make sure all promises resolved
	checkEqual(i, j)
})

bench('async', async () => {
	let i = 0
	let j = 0
	while (i < loops) {
		i++
		aQueue.push(async () => j++)
	}
	await aQueue.drain()
	// make sure all promises resolved
	checkEqual(i, j)
})

bench('queue', async () => {
	let i = 0
	let j = 0
	while (i < loops) {
		i++
		q.push(async () => j++)
	}
	await q.start()
	// make sure all promises resolved
	checkEqual(i, j)
})

bench('p-limit', async () => {
	let i = 0
	let j = 0
	const jobs = [] as Promise<any>[]
	while (i < loops) {
		i++
		jobs.push(limit(async () => j++))
	}
	await Promise.all(jobs)
	// make sure all promises resolved
	checkEqual(i, j)
})

// warm up
await run({
	silent: true,
})

loops = 1_000

await run({
	silent: false, // enable/disable stdout output
	avg: true, // enable/disable avg column (default: true)
	json: false, // enable/disable json output (default: false)
	colors: true, // enable/disable colors (default: true)
	min_max: true, // enable/disable min/max column (default: true)
	percentiles: true, // enable/disable percentiles column (default: true)
})
