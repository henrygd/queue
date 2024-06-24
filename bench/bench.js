import { run, bench, baseline } from 'mitata'
import { newQueue } from '../dist/index.js'
import pLimit from 'p-limit'
import pq from 'promise-queue'
import Queue from 'queue'
import { queue as asyncQueue } from 'async'
import fastq from 'fastq'

const concurrency = 5
let promises = 1_000

const queue = newQueue(concurrency)
const limit = pLimit(concurrency)
const promiseQueue = new pq(concurrency)
const q = new Queue({ results: [], concurrency, autostart: true })
const aQueue = asyncQueue(async (task) => await task(), concurrency)
const fqQueue = fastq.promise((task) => task(), concurrency)

function checkEqual(a, b) {
	if (a !== b) {
		throw new Error(`${a} !== ${b}`)
	}
}

function addBench(name, queue, addMethod, fn) {
	fn(name, async () => {
		let j = 0
		const { promise, resolve } = Promise.withResolvers()
		for (let i = 0; i < promises; i++) {
			// need to set this for promise-queue and queue to work
			addMethod.call(queue, async () => ++j === promises && resolve())
		}
		await promise
		checkEqual(j, promises)
	})
}

const libs = [
	['@henrygd/queue', queue, queue.add],
	['promise-queue', promiseQueue, promiseQueue.add],
	['fastq', fqQueue, fqQueue.push],
	['async.queue', aQueue, aQueue.push],
	['queue', q, q.push],
]

for (const [name, queue, addMethod] of libs) {
	const benchFn = name === '@henrygd/queue' ? baseline : bench
	addBench(name, queue, addMethod, benchFn)
}

await run()
// add p-limit after the warm up test bc it's slow and
// fudges the results in deno
addBench('p-limit', limit, limit, bench)
console.log('')
await run()
