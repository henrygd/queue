import { test, expect } from 'bun:test'
import { newQueue } from './index.ts'
// import { newQueue as slimQueue } from './slim/index.slim.ts'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// type CreateQueue = typeof newQueue | typeof slimQueue
type CreateQueue = typeof newQueue

// describe('main', () => {
test('should process 2 promises concurrently', () => testConcurrency(newQueue))

test('should handle promise rejections correctly', () => testRejections(newQueue))

test('greater concurrency should be faster', async () => {
	const loops = 10
	const waitTime = 50
	const runTimes = [] as number[]

	for (let i = 3; i < 5; i++) {
		let queue = newQueue(i)
		let start = performance.now()
		for (let i = 0; i < loops; i++) {
			queue.add(() => wait(waitTime))
		}
		await queue.done()
		runTimes.push(performance.now() - start)
	}

	const [timeOne, timeTwo] = runTimes
	expect(timeTwo).toBeLessThan(timeOne)
})

test('size should return the number of promises in the queue', async () => {
	const queue = newQueue(2)
	expect(queue.size()).toBe(0)
	for (let i = 0; i < 10; i++) {
		queue.add(() => wait(10))
	}
	expect(queue.size()).toBe(10)
	await wait(15)
	expect(queue.size()).toBe(8)
	await wait(90)
	expect(queue.size()).toBe(0)
})

test('active should return the number of active jobs', async () => {
	const queue = newQueue(4)
	expect(queue.active()).toBe(0)
	for (let i = 0; i < 10; i++) {
		queue.add(() => wait(10))
	}
	expect(queue.active()).toBe(4)
	await wait(25)
	expect(queue.active()).toBe(2)
	await wait(10)
	expect(queue.active()).toBe(0)
})

test('done should work even if the queue is empty', async () => {
	const queue = newQueue(2)
	await queue.done()
})

test('clear should clear the queue', async () => {
	const queue = newQueue(2)
	const runTimes = [] as number[]

	for (let i = 0; i < 2; i++) {
		let start = performance.now()
		for (let i = 0; i < 10; i++) {
			queue.add(() => wait(50))
		}
		if (i === 1) {
			setTimeout(queue.clear, 110)
		}
		await queue.done()
		runTimes.push(performance.now() - start)
	}

	const [runOne, runTwo] = runTimes
	expect(runOne).toBeGreaterThan(240)
	expect(runTwo).toBeGreaterThan(140)
	expect(runTwo).toBeLessThan(160)
})
// })

// describe('slim', () => {
// 	test('should process 2 promises concurrently', () => testConcurrency(slimQueue))

// 	test('should handle promise rejections correctly', () => testRejections(slimQueue))

// 	test('greater concurrency should be faster', async () => {
// 		const loops = 10
// 		const waitTime = 50
// 		const runTimes = [] as number[]

// 		for (let i = 3; i < 5; i++) {
// 			let jobs = [] as Promise<unknown>[]
// 			let queue = slimQueue(i)
// 			let start = performance.now()
// 			for (let i = 0; i < loops; i++) {
// 				jobs.push(queue.add(() => wait(waitTime)))
// 			}
// 			await Promise.all(jobs)
// 			runTimes.push(performance.now() - start)
// 		}

// 		const [timeOne, timeTwo] = runTimes
// 		expect(timeTwo).toBeLessThan(timeOne)
// 	})
// })

async function testConcurrency(createQueue: CreateQueue) {
	const queue = createQueue(2)
	const running: number[] = []
	const results: number[] = []

	const createPromise = (value: number, delay: number) => () =>
		new Promise<number>((resolve) => {
			running.push(value)
			setTimeout(() => {
				resolve(value)
				running.splice(running.indexOf(value), 1)
			}, delay)
		})

	const p1 = queue.add(createPromise(1, 300))
	const p2 = queue.add(createPromise(2, 175))
	const p3 = queue.add(createPromise(3, 200))
	const p4 = queue.add(createPromise(4, 200))

	for (const promise of [p1, p2, p3, p4]) {
		promise.then((result) => results.push(result))
	}

	// Concurrent checks to ensure only 2 promises are running at the same time
	const checks = [
		new Promise<void>((resolve) =>
			setTimeout(() => {
				expect(running).toContain(1)
				expect(running).toContain(2)
				expect(running.length).toBe(2)
				resolve()
			}, 50)
		),

		new Promise<void>((resolve) =>
			setTimeout(() => {
				expect(running).toContain(1)
				expect(running).toContain(3)
				expect(running.length).toBe(2)
				resolve()
			}, 250)
		),

		new Promise<void>((resolve) =>
			setTimeout(() => {
				expect(running).toContain(3)
				expect(running).toContain(4)
				expect(running.length).toBe(2)
				resolve()
			}, 350)
		),
	]

	await Promise.all([p1, p2, p3, p4, ...checks])

	expect(results).toEqual([2, 1, 3, 4])
}

async function testRejections(createQueue: CreateQueue) {
	const queue = createQueue(2)

	const createPromise = (value: number, delay: number, shouldReject: boolean) => () =>
		new Promise<number>((resolve, reject) => {
			setTimeout(() => {
				if (shouldReject) {
					reject(new Error(`Promise ${value} failed`))
				} else {
					resolve(value)
				}
			}, delay)
		})

	const p1 = queue.add(createPromise(1, 100, false))
	const p2 = queue.add(createPromise(2, 200, true))
	const p3 = queue.add(createPromise(3, 300, false))
	const p4 = queue.add(createPromise(4, 50, true))

	const results: number[] = []
	const errors: string[] = []

	for (const promise of [p1, p2, p3, p4]) {
		promise.then((result) => results.push(result)).catch((error) => errors.push(error.message))
	}

	await Promise.allSettled([p1, p2, p3, p4])

	expect(results).toEqual([1, 3])
	expect(errors).toEqual(['Promise 2 failed', 'Promise 4 failed'])
}
