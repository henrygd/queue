type Node<T> = {
	/** input promise wrapper */
	p: () => T
	res: (value: T) => void
	rej: (reason: any) => void
	/** next node pointer */
	next?: Node<T>
}

export let newQueue = (concurrency: number) => {
	let active = 0
	let head: Node<Promise<any>> | undefined
	let tail: Node<Promise<any>> | undefined

	let run = async () => {
		if (!head || active >= concurrency) {
			return
		}
		active++
		let curHead = head
		head = head?.next
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
