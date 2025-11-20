import { env } from 'bun'
import { test, expect, describe } from 'bun:test'
import { newQueue as devRlQueue } from '../index.rl.ts'
import { newQueue as distRlQueue } from '../dist/index.rl.js'

let newQueue: typeof devRlQueue

if (env.DIST) {
   console.log('using dist files for RL tests')
   newQueue = distRlQueue
} else {
   console.log('using dev files for RL tests')
   newQueue = devRlQueue
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('basic queue functionality', () => {
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
         promise
            .then((result) => results.push(result))
            .catch((error) => errors.push(error.message))
      }

      await Promise.allSettled([p1, p2, p3, p4])

      expect(results).toEqual([1, 3])
      expect(errors).toEqual(['Promise 2 failed', 'Promise 4 failed'])
      expect(queue.size()).toBe(0)
   })

   test('greater concurrency should be faster', async () => {
      const loops = 10
      const waitTime = 50
      const runTimes = [] as number[]

      for (let i = 3; i < 5; i++) {
         const queue = newQueue(i)
         const start = performance.now()
         for (let i = 0; i < loops; i++) {
            queue.add(() => wait(waitTime))
         }
         await queue.done()
         runTimes.push(performance.now() - start)
      }

      const [timeOne, timeTwo] = runTimes
      expect(timeTwo).toBeLessThan(timeOne)
   })

   test('add method should return a promise', () => {
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
         const promises = []
         for (let i = 0; i < jobs; i++) {
            // Catch rejections from cleared tasks to avoid unhandled rejections
            promises.push(queue.add(() => wait(jobTime)).catch(() => { }))
         }
         setTimeout(() => {
            expect(queue.size()).toBeGreaterThanOrEqual(
               jobs - 1 - Math.trunc((clearTime / jobTime) * 2),
            )
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
            // Catch rejections from cleared tasks
            queue.add(() => wait(50)).catch(() => { })
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

   test('all should resolve results in input order while respecting concurrency', async () => {
      const queue = newQueue(2)
      let running = 0
      let maxRunning = 0
      const tasks = Array.from(
         { length: 6 },
         (_, i) => () =>
            new Promise<number>((resolve) => {
               running++
               if (running > maxRunning) maxRunning = running
               setTimeout(() => {
                  running--
                  resolve(i)
               }, 20 - i)
            }),
      )
      const results = await queue.all(tasks)
      expect(results).toEqual([0, 1, 2, 3, 4, 5])
      expect(maxRunning).toBeLessThanOrEqual(2)
      await queue.done()
      expect(queue.size()).toBe(0)
   })

   test('all should accept existing promises and wrappers', async () => {
      const queue = newQueue(3)
      const existing = wait(5).then(() => 'a')
      const results = await queue.all([existing, () => wait(1).then(() => 'b')])
      expect(results).toEqual(['a', 'b'])
      await queue.done()
      expect(queue.size()).toBe(0)
   })
})


describe('rate limiting', () => {
   test('should respect rate limits with basic usage', async () => {
      const queue = newQueue(10, 3, 100) // max 3 tasks per 100ms
      const startTimes: number[] = []

      // Queue 9 tasks (should take at least 200ms for 3 windows)
      for (let i = 0; i < 9; i++) {
         queue.add(async () => {
            startTimes.push(Date.now())
            await wait(5)
         })
      }

      await queue.done()

      // Verify rate limiting is working by checking total time
      // 9 tasks / 3 per window = 3 windows = 200ms minimum
      const totalTime = startTimes[startTimes.length - 1] - startTimes[0]
      expect(totalTime).toBeGreaterThanOrEqual(200)
   })

   test('should work with both concurrency and rate limits', async () => {
      const queue = newQueue(2, 4, 100) // max 2 concurrent, max 4 per 100ms
      const running: number[] = []
      const startTimes: number[] = []

      for (let i = 0; i < 8; i++) {
         queue.add(async () => {
            startTimes.push(Date.now())
            running.push(i)
            await wait(30)
            running.splice(running.indexOf(i), 1)
         })
      }

      // Check concurrency constraint
      setTimeout(() => {
         expect(running.length).toBeLessThanOrEqual(2)
      }, 40)

      await queue.done()

      // Verify rate limiting affected execution time
      // 8 tasks limited to 4/100ms = 2 windows = ~100ms
      const totalTime = startTimes[startTimes.length - 1] - startTimes[0]
      expect(totalTime).toBeGreaterThanOrEqual(100)
   })

   test('should work without rate limit (backward compatibility)', async () => {
      const queue = newQueue(2) // no rate limit
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

      for (const promise of [p1, p2, p3]) {
         promise.then((result) => results.push(result))
      }

      // Check concurrency
      setTimeout(() => {
         expect(running.length).toBe(2)
      }, 50)

      await queue.done()
      expect(results).toEqual([2, 1, 3])
   })

   test('should handle strict rate limits', async () => {
      const queue = newQueue(5, 2, 100) // only 2 tasks per 100ms
      const startTimes: number[] = []

      for (let i = 0; i < 6; i++) {
         queue.add(async () => {
            startTimes.push(Date.now())
            await wait(5) // small delay to ensure tasks don't complete instantly
         })
      }

      await queue.done()

      // Total time should be at least 200ms (6 tasks / 2 per 100ms = 3 windows)
      const totalTime = startTimes[startTimes.length - 1] - startTimes[0]
      expect(totalTime).toBeGreaterThanOrEqual(200)
   })
   test('clear should work with rate limiting', async () => {
      const queue = newQueue(2, 3, 100)
      const results: number[] = []

      for (let i = 0; i < 10; i++) {
         queue.add(() => wait(50).then(() => results.push(i))).catch(() => { })
      }

      setTimeout(() => queue.clear(), 120)
      await queue.done()

      // Only some tasks should complete before clear
      expect(results.length).toBeLessThan(10)
      expect(queue.size()).toBe(0)
   })

   test('done() should resolve after clear() when queue is paused by rate limiter', async () => {
      const queue = newQueue(5, 2, 100) // only 2 tasks per 100ms

      // Add tasks - first 2 will execute immediately
      for (let i = 0; i < 10; i++) {
         queue.add(() => wait(5)).catch(() => { })
      }

      // Wait for first 2 tasks to complete
      // Queue should now be paused by rate limiter with active=0
      await wait(50)

      expect(queue.active()).toBe(0)
      expect(queue.size()).toBeGreaterThan(0)

      // Call done() while queue is paused
      const donePromise = queue.done()

      // Then clear the queue
      await wait(10)
      queue.clear()

      // done() should resolve even though it was called before clear()
      await donePromise
      expect(queue.size()).toBe(0)
   })

   test('active and size should work with rate limiting', async () => {
      const queue = newQueue(2, 3, 100)
      expect(queue.active()).toBe(0)
      expect(queue.size()).toBe(0)

      for (let i = 0; i < 8; i++) {
         queue.add(() => wait(30))
      }

      expect(queue.size()).toBe(8)
      expect(queue.active()).toBeLessThanOrEqual(2)

      await queue.done()
      expect(queue.size()).toBe(0)
      expect(queue.active()).toBe(0)
   })

   test('all should work with rate limiting', async () => {
      const queue = newQueue(3, 4, 100)
      const tasks = Array.from({ length: 6 }, (_, i) => () =>
         wait(10).then(() => i),
      )

      const results = await queue.all(tasks)
      expect(results).toEqual([0, 1, 2, 3, 4, 5])
      await queue.done()
      expect(queue.size()).toBe(0)
   })

   test('done should resolve immediately on empty queue', async () => {
      const queue = newQueue(2, 3, 100)
      await queue.done()
      expect(queue.size()).toBe(0)
   })

   test('should handle promise rejections with rate limiting', async () => {
      const queue = newQueue(2, 3, 100)
      const results: number[] = []
      const errors: string[] = []

      const createPromise = (value: number, shouldReject: boolean) => () =>
         new Promise<number>((resolve, reject) => {
            setTimeout(() => {
               if (shouldReject) {
                  reject(new Error(`Task ${value} failed`))
               } else {
                  resolve(value)
               }
            }, 20)
         })

      const p1 = queue.add(createPromise(1, false))
      const p2 = queue.add(createPromise(2, true))
      const p3 = queue.add(createPromise(3, false))
      const p4 = queue.add(createPromise(4, true))

      for (const promise of [p1, p2, p3, p4]) {
         promise
            .then((result) => results.push(result))
            .catch((error) => errors.push(error.message))
      }

      await Promise.allSettled([p1, p2, p3, p4])

      expect(results).toEqual([1, 3])
      expect(errors).toEqual(['Task 2 failed', 'Task 4 failed'])
   })
})
