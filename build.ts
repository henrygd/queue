import { build } from 'esbuild'

await build({
	entryPoints: ['index.ts'],
	mangleProps: /^res$|^rej$|^next$/,
	format: 'esm',
	outfile: './dist/index.js',
})

await build({
	entryPoints: ['index.ts'],
	minify: true,
	mangleProps: /^res$|^rej$|^next$/,
	format: 'esm',
	outfile: './dist/index.min.js',
})

await build({
	entryPoints: ['index.ts'],
	mangleProps: /^res$|^rej$|^next$/,
	format: 'cjs',
	outfile: './dist/index.cjs',
})

await build({
	entryPoints: ['index.async-storage.ts'],
	format: 'esm',
	outfile: './dist/index.async-storage.js',
	banner: {
		js: `/**
 * This version of \`@henrygd/queue\` supports AsyncLocalStorage / AsyncResource.
 *
 * It should not be used in a web browser.
 * @module
 */`,
	},
})

await build({
	entryPoints: ['index.async-storage.ts'],
	format: 'cjs',
	outfile: './dist/index.async-storage.cjs',
	banner: {
		js: `/**
 * This version of \`@henrygd/queue\` supports AsyncLocalStorage / AsyncResource.
 *
 * It should not be used in a web browser.
 * @module
 */`,
	},
})

await build({
	entryPoints: ['index.rl.ts'],
	mangleProps: /^res$|^rej$|^next$/,
	format: 'esm',
	outfile: './dist/index.rl.js',
	banner: {
		js: `/**
 * This version of \`@henrygd/queue\` supports rate limiting.
 * @module
 */`,
	},
})

await build({
	entryPoints: ['index.rl.ts'],
	mangleProps: /^res$|^rej$|^next$/,
	format: 'cjs',
	outfile: './dist/index.rl.cjs',
	banner: {
		js: `/**
 * This version of \`@henrygd/queue\` supports rate limiting.
 * @module
 */`,
	},
})

await build({
	entryPoints: ['index.rl.ts'],
	minify: true,
	mangleProps: /^res$|^rej$|^next$/,
	format: 'esm',
	outfile: './dist/index.rl.min.js',
})
