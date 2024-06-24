// import { newQueue } from '../index.ts'
import { newQueue } from '../dist/index.js'
import pLimit from 'p-limit'
import pq from 'promise-queue'
import Queue from 'queue'
import { queue as asyncQueue } from 'async'
import fastq from 'fastq'

const concurrency = 5
let promises = 1_000
let runs = 1_000
let warmupRuns = 500

const limit = pLimit(concurrency)
const promiseQueue = new pq(concurrency)
const queue = newQueue(concurrency)
const fqQueue = fastq.promise((task) => task(), concurrency)
const aQueue = asyncQueue(async (task) => await task(), concurrency)
const q = new Queue({ results: [], concurrency, autostart: true })

let start = 0
const times = {}

function checkEqual(a, b) {
	if (a !== b) {
		throw new Error(`${a} !== ${b}`)
	}
}

async function bench(name, queue, addMethod, isWarmup) {
	start = performance.now()
	// benchmark test
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < promises; i++) {
		// need call for promise-queue and queue to work
		addMethod.call(queue, async () => ++j === promises && resolve())
	}
	await promise
	checkEqual(j, promises)
	// collect times
	if (!isWarmup) {
		const time = performance.now() - start
		times[name].Average += time
		times[name].Fastest = Math.min(times[name].Fastest, time)
		times[name].Slowest = Math.max(times[name].Slowest, time)
	}
}

const libs = [
	['fastq', fqQueue, fqQueue.push],
	['promise-queue', promiseQueue, promiseQueue.add],
	['@henrygd/queue', queue, queue.add],
	['async.queue', aQueue, aQueue.push],
	['queue', q, q.push],
	['p-limit', limit, limit],
]

// warmup runs
for (let i = 0; i < warmupRuns; i++) {
	logStatus(`Warming up (${i}/${warmupRuns})`)
	for (const lib of libs) {
		if (lib[0] === 'p-limit') {
			// p-limit warming messes up deno results
			continue
		}
		await bench(lib[0], lib[1], lib[2], true)
	}
}

for (const lib of libs) {
	logStatus(`Benching ${lib[0]}`)
	for (let j = 0; j <= runs; j++) {
		if (j === 0) {
			times[lib[0]] = {
				Average: 0,
				Fastest: Infinity,
				Slowest: 0,
			}
		}
		await bench(lib[0], lib[1], lib[2], false)
	}
}

logTable(times)

function logTable(obj, keyColumnName = 'Name') {
	try {
		process.stdout.clearLine(0)
		process.stdout.cursorTo(0)
		process.stdout.write('')
	} catch {
		Deno.stdout.writeSync(new TextEncoder().encode(`\r`))
	}

	console.log(`Benchmark results (${getRuntime()})`)

	// Convert object to array of objects
	let arr = Object.entries(obj).map(([key, data]) => ({
		[keyColumnName]: key,
		...data,
	}))

	// Sort the array based on the Average property
	arr.sort((a, b) => a.Average - b.Average)

	// Calculate the fastest (lowest) average
	const fastestAverage = arr[0].Average

	// add speed + format data
	arr = arr.map((item) => ({
		Name: item.Name,
		Speed:
			item.Average === fastestAverage ? '1.00x' : (item.Average / fastestAverage).toFixed(2) + 'x',
		Average: parseFloat((item.Average / runs).toFixed(4)),
		Fastest: parseFloat(item.Fastest.toFixed(4)),
		Slowest: parseFloat(item.Slowest.toFixed(4)),
	}))

	// Determine column order
	const columns = [keyColumnName, 'Speed', 'Average', 'Fastest', 'Slowest']

	// Display the sorted array as a table with specified column order
	console.table(arr, columns)
}

function getRuntime() {
	if (typeof Bun !== 'undefined') {
		return `Bun ${Bun.version}`
	}
	if (typeof process !== 'undefined' && process.versions && process.versions.node) {
		return `Node ${process.version}`
	}
	if (typeof Deno !== 'undefined') {
		return `Deno ${Deno.version.deno}`
	}
	return 'Unknown'
}

function logStatus(msg) {
	try {
		process.stdout.clearLine(0)
		process.stdout.cursorTo(0)
		process.stdout.write(msg)
	} catch {
		Deno.stdout.writeSync(new TextEncoder().encode(msg + '\r'))
	}
}
