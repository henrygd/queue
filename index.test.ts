import { test, expect, describe } from 'bun:test'
import { newQueue } from './index.ts'
// import { newQueue } from './dist/index.js'
import { newQueue as newContextQueue } from './index.async-storage.ts'
import { AsyncLocalStorage } from 'async_hooks'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// type CreateQueue = typeof newQueue | typeof slimQueue
type CreateQueue = typeof newQueue

describe('main', () => {
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

	test('add method should return a promise', async () => {
		const queue = newQueue(2)
		const promise = queue.add(() => new Promise((resolve) => resolve(1)))
		expect(promise).toBeInstanceOf(Promise)
		expect(promise).resolves.toBe(1)

		const promiseErr = queue.add(() => new Promise((_, reject) => reject(new Error())))
		expect(promiseErr).toBeInstanceOf(Promise)
		expect(promiseErr).rejects.toThrow()

		const asyncFn = queue.add(async () => {
			return 'hello'
		})
		expect(asyncFn).toBeInstanceOf(Promise)
		expect(asyncFn).resolves.toBe('hello')

		const asyncFnErr = queue.add(async () => {
			throw new Error('hullo')
		})
		expect(asyncFnErr).toBeInstanceOf(Promise)
		expect(asyncFnErr).rejects.toThrow('hullo')
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

	test('jobs should not repeat', async () => {
		const queue = newQueue(2)
		const results = [] as number[]
		for (let i = 0; i < 10; i++) {
			queue.add(async () => {
				await wait(i)
				results.push(i)
			})
		}
		await queue.done()
		expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
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

	test('queue.done() should work properly and be reusable', async () => {
		const queue = newQueue(2)
		// works on empty queue
		await queue.done()
		expect(queue.size()).toBe(0)
		// works with simple operation
		queue.add(() => wait(10))
		expect(queue.size()).toBe(1)
		await queue.done()
		expect(queue.size()).toBe(0)
		// works repeatedly with clear on a bunch of random timings
		for (let i = 0; i < 10; i++) {
			const jobs = 50
			const jobTime = Math.ceil(Math.random() * 5 + 1)
			const clearTime = Math.ceil(Math.random() * 25 + 5)
			for (let i = 0; i < jobs; i++) {
				queue.add(() => wait(jobTime))
			}
			setTimeout(() => {
				expect(queue.size()).toBeGreaterThanOrEqual(jobs - Math.trunc((clearTime / jobTime) * 2))
				queue.clear()
				expect(queue.size()).toBe(2)
			}, clearTime)
			await queue.done()
			expect(queue.size()).toBe(0)
		}

		// works with multiple awaits at same time
		async function waitDone() {
			queue.add(() => wait(10))
			await queue.done()
		}
		const jobs = [] as Promise<any>[]
		for (let i = 0; i < 2; i++) {
			jobs.push(waitDone())
		}
		await Promise.all(jobs)
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
})

describe('async-storage', () => {
	test('should propagate async execution context properly', async () => {
		const queue = newContextQueue(2)
		const store = new AsyncLocalStorage()

		const checkId = async (id: number) => {
			await Promise.resolve()
			const storeValue = store.getStore() as { id: number }
			expect(id).toBe(storeValue.id)
		}
		const startContext = async (id: number) => store.run({ id }, () => queue.add(() => checkId(id)))
		await Promise.all(Array.from({ length: 50 }, (_, id) => startContext(id)))
	})
})

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
	setTimeout(() => {
		expect(running).toContain(1)
		expect(running).toContain(2)
		expect(running.length).toBe(2)
	}, 50)
	setTimeout(() => {
		expect(running).toContain(1)
		expect(running).toContain(3)
		expect(running.length).toBe(2)
	}, 250)
	setTimeout(() => {
		expect(running).toContain(3)
		expect(running).toContain(4)
		expect(running.length).toBe(2)
	}, 350)

	await queue.done()

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
