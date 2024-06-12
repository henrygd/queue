import { build } from 'esbuild'

await build({
	entryPoints: ['index.ts'],
	bundle: true,
	minify: true,
	mangleProps: /^res$|^rej$|^next$/,
	format: 'esm',
	outfile: 'index.js',
})
