import { argv } from 'bun'
import { heapStats } from 'bun:jsc'
import { newQueue } from './index.js'
import pLimit from 'p-limit'

const currentTest = argv[2]
if (!currentTest) {
	console.log('Usage: bun bench.ts <library>')
	process.exit(1)
}

const concurrency = 10
const loops = 1_000_000

const queue = newQueue(concurrency)
const limit = pLimit(concurrency)

const promiseFunction = () => Promise.resolve()
const runTimes = {} as Record<string, [number, number][]>

async function bench(name: string, runs: number, fn: () => any) {
	Bun.gc(true)
	const start = performance.now()
	const heapSize = await fn()
	// discard the first run result
	if (runs === 1) {
		return
	}
	if (!runTimes[name]) {
		runTimes[name] = []
	}
	runTimes[name].push([performance.now() - start, heapSize])
	// console.log(
	// 	name,
	// 	`Time: ${Math.trunc(performance.now() - start)}ms; heap: ${Math.trunc(heapSize / 1024 / 1024)} MB`
	// )
}

for (let i = 1; i <= 6; i++) {
	if (currentTest === 'p-limit') {
		await bench('p-limit', i, async () => {
			const jobs: Promise<void>[] = []
			for (let i = 0; i <= loops; i++) {
				jobs.push(limit(promiseFunction))
			}
			await Promise.all(jobs)
			return heapStats().heapSize
		})
	}
	if (currentTest === '@henrygd/queue') {
		await bench('@henrygd/queue', i, async () => {
			for (let i = 0; i <= loops; i++) {
				queue.add(promiseFunction)
			}
			await queue.done()
			return heapStats().heapSize
		})
	}
}

const averages = [] as {
	name: string
	time: string
	heap: string
}[]

for (const [name, data] of Object.entries(runTimes)) {
	const t = data.reduce((a, b) => a + b[0], 0) / data.length
	const heapSize = data.reduce((a, b) => a + b[1], 0) / data.length
	averages.push({
		name,
		time: Math.trunc(t) + 'ms',
		heap: `${(heapSize / 1024 / 1024).toFixed(2)}MB`,
	})
}

console.table(averages)
