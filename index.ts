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
}

/**
 * Creates a new queue with the specified concurrency level.
 *
 * @param {number} concurrency - The maximum number of concurrent operations.
 * @return {Queue} - The newly created queue.
 */
export let newQueue = (concurrency: number): Queue => {
	let active = 0
	let head: Node<Promise<any>> | undefined
	let tail: Node<Promise<any>> | undefined

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
		run()
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
			run()
			return promise as Promise<T>
		},
		// clear() {
		// 	head = tail = undefined
		// },
	}
}
