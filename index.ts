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
	/** Add a promise / async function to the queue */
	add<T>(p: () => Promise<T>): Promise<T>
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
	let donePromise: Promise<void> | void
	let resolveDonePromise: (value: void | PromiseLike<void>) => void

	let run = async () => {
		if (!head || active >= concurrency) {
			return
		}
		active++
		let curHead = head
		head = head.next
		try {
			curHead.res(await curHead.p())
		} catch (e) {
			curHead.rej(e)
		}
		active--
		if (--size) {
			run()
		} else {
			donePromise = resolveDonePromise?.()
		}
	}

	return {
		add<T>(p: () => Promise<T>): Promise<T> {
			let node = { p } as Node<Promise<T>>
			let promise = new Promise((res, rej) => {
				node.res = res
				node.rej = rej
			})
			if (head) {
				tail!.next = node
				tail = node
			} else {
				head = tail = node
			}
			size++
			run()
			return promise as Promise<T>
		},
		done: () => {
			if (donePromise) {
				return donePromise
			}
			donePromise = new Promise((res) => (resolveDonePromise = res))
			if (!size) {
				resolveDonePromise()
			}
			return donePromise
		},
		clear() {
			head = tail = null
			size = active
		},
		active: () => active,
		size: () => size,
	}
}
