import { run, bench, baseline } from 'mitata'
import { availableParallelism } from 'os'
import { newQueue } from '../dist/index.js'
import pLimit from 'p-limit'
import pq from 'promise-queue'
import Queue from 'queue'
import { queue as asyncQueue } from 'async'
import fastq from 'fastq'

const concurrency = 5
let loops = 5_000

const queue = newQueue(concurrency)
const limit = pLimit(concurrency)
const promiseQueue = new pq(concurrency)
const q = new Queue({ results: [], concurrency })
const aQueue = asyncQueue(async (task) => await task(), concurrency)
const fqQueue = fastq.promise((task) => task(), concurrency)

function checkEqual(a, b) {
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
	checkEqual(i, j)
})

bench('promise-queue', async () => {
	let i = 0
	let j = 0
	const jobs = []
	while (i < loops) {
		i++
		jobs.push(promiseQueue.add(async () => j++))
	}
	await Promise.all(jobs)
	checkEqual(i, j)
})

bench('fastq', async () => {
	let i = 0
	let j = 0
	while (i < loops) {
		i++
		fqQueue.push(async () => j++)
	}
	await fqQueue.drained()
	checkEqual(i, j)
})

bench('async.queue', async () => {
	let i = 0
	let j = 0
	while (i < loops) {
		i++
		aQueue.push(async () => j++)
	}
	await aQueue.drain()
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
	checkEqual(i, j)
})
bench('p-limit', async () => {
	let i = 0
	let j = 0
	const jobs = []
	while (i < loops) {
		i++
		jobs.push(limit(async () => j++))
	}
	await Promise.all(jobs)
	checkEqual(i, j)
})

// warm up
// async function warmUp() {
// 	const cpuCount = availableParallelism()
// 	const start = performance.now()
// 	const warmQueue = newQueue(cpuCount)
// 	for (let i = 0; i < cpuCount; i++) {
// 		warmQueue.add(async () => {
// 			let j = 0
// 			while (performance.now() - start < 1000) {
// 				j = Math.cbrt(Math.random() * 500)
// 			}
// 			return j
// 		})
// 	}
// 	await warmQueue.done()
// }

// await warmUp()
await run()
