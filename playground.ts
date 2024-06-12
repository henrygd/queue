import { newQueue } from './index.ts'

const queue = newQueue(2)

const pokemon = ['ditto', 'hitmonlee', 'pidgeot', 'poliwhirl', 'golem', 'charizard']

for (const name of pokemon) {
	queue.add(async () => {
		const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
		const json = await res.json()
		console.log(`${json.name}: ${json.height * 10}cm | ${json.weight / 10}kg`)
	})
}

console.log('running')
await queue.done()
console.log('done')

// const queue = newQueue(5)

// const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// for (let i = 1; i <= 50; i++) {
// 	queue.add(() => wait(500)).then(() => console.log(i, 'done'))
// }
