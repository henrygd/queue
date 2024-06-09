import { test, expect } from 'bun:test'
import { newQueue } from '.'

test('should process 2 promises concurrently', async () => {
	const queue = newQueue(2)
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
})

test('should handle promise rejections correctly', async () => {
	const queue = newQueue(2)

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
})
