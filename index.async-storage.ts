/**
 * This version of `@henrygd/queue` supports AsyncLocalStorage / AsyncResource.
 *
 * It should not be used in a web browser.
 *
 * @module
 */
import { AsyncResource } from 'async_hooks'

/** List node */
type Node<T> = {
	/** input promise wrapper */
	p: () => T
	/** resolve returned promise */
	res: (value: T) => void
	/** reject returned promise */
	rej: (reason: any) => void
	/** next node pointer */
	next?: Node<T>
}

/** Queue interface */
interface Queue {
	/** Add an async function / promise wrapper to the queue */
	add<T>(promiseFunction: () => Promise<T>): Promise<T>
	/** Returns a promise that resolves when the queue is empty */
	done(): Promise<void>
	/** Empties the queue (active promises are not cancelled) */
	clear(): void
	/** Returns the number of promises currently running */
	active(): number
	/** Returns the total number of promises in the queue */
	size(): number
}

/**
 * Creates a new queue with the specified concurrency level.
 *
 * @param {number} concurrency - The maximum number of concurrent operations.
 * @return {Queue} - The newly created queue.
 */
export let newQueue = (concurrency: number): Queue => {
	let active = 0
	let size = 0
	let head: Node<Promise<any>> | undefined | null
	let tail: Node<Promise<any>> | undefined | null
	let resolveDonePromise: (value: void | PromiseLike<void>) => void
	let donePromise: Promise<void> | void
	let Promize = Promise

	let afterRun = () => {
		active--
		if (--size) {
			run()
		} else {
			donePromise = resolveDonePromise?.()
		}
	}

	let run = () => {
		if (!head || active >= concurrency) {
			return
		}
		active++
		let curHead = head
		head = head.next
		curHead.p().then(curHead.res, curHead.rej).then(afterRun)
	}

	return {
		add: <T>(p: () => Promise<T>) =>
			new Promize((res, rej) => {
				let node = { p: AsyncResource.bind(p), res, rej }
				if (head) {
					tail = tail!.next = node
				} else {
					tail = head = node
				}
				size++
				run()
			}),
		done: () => {
			if (!size) {
				return Promize.resolve()
			}
			if (donePromise) {
				return donePromise
			}
			return (donePromise = new Promize((resolve) => (resolveDonePromise = resolve)))
		},
		clear() {
			head = tail = null
			size = active
		},
		active: () => active,
		size: () => size,
	}
}
