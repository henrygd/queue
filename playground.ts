import { newQueue } from './index.ts'

// const queue = newQueue(5)

// const sites = [
// 	'https://google.com',
// 	'https://github.com',
// 	'https://youtube.com',
// 	'https://twitter.com',
// 	'https://facebook.com',
// 	'https://reddit.com',
// ]

// for (const site of sites) {
// 	queue.add(() => fetch(site)).then((res) => console.log(site, res.status))
// }

const queue = newQueue(5)

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

for (let i = 1; i <= 50; i++) {
	queue.add(() => wait(500)).then(() => console.log(i, 'done'))
}
