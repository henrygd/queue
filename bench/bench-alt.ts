import { run, bench, baseline } from 'mitata'
import { newQueue } from '../index.ts'
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
const q = new Queue({ results: [], concurrency, autostart: true })
const aQueue = asyncQueue(async (task: () => Promise<any>) => await task(), concurrency)
const fqQueue = fastq.promise((task) => task(), concurrency)

function checkEqual(a: any, b: any) {
	if (a !== b) {
		throw new Error(`${a} !== ${b}`)
	}
}

baseline('@henrygd/queue', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		queue.add(async () => ++j === loops && resolve())
	}
	await promise
	checkEqual(j, loops)
})

bench('promise-queue', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		promiseQueue.add(async () => ++j === loops && resolve())
	}
	await promise
	checkEqual(j, loops)
})

bench('fastq', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		fqQueue.push(async () => ++j === loops && resolve())
	}
	await promise
	checkEqual(j, loops)
})

bench('async.queue', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		aQueue.push(async () => ++j === loops && resolve())
	}
	await promise
	checkEqual(j, loops)
})

bench('queue', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		q.push(async () => ++j === loops && resolve())
	}
	await promise
	checkEqual(j, loops)
})

bench('p-limit', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		limit(async () => ++j === loops && resolve())
	}
	await promise
	checkEqual(j, loops)
})

await run()
await run()
