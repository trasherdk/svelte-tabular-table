<script>
	import { Table } from './../../src/index.js'
	import data from './data.js'

	const css = `
<style>
	html, body {
		padding: 0;
		font-family: sans-serif;
	}
	body {
		padding: 2em 6em;
	}
	tr td {
		box-shadow: 0px 1px lightgrey;
	}
	thead td.stt-ascending div:after {
		content: '(asc)';
	}

	thead td.stt-descending div:after {
		content: '(desc)';
	} 
</style>
	`

	const keys = ['name', 'company', 'about' ]

	function onRearrange( from, to ) {
		console.log(`from ${from} to ${to}`)
	}

	const tables = [

		{
			id: 'Sortable',
			config: {
				keys,
				index: '_id',
				data
			},
			dimensions: {
				row: 10,
			},
			features: {
				sortable: {
					key: 'name'
				}
			}
		},
		{
			id: 'Rearrangeable',
			config: {
				keys,
				index: '_id',
				data
			},
			dimensions: {
				row: 10,
			},
			features: {
				rearrangeable: onRearrange
			}
		},
		{
			id: 'Checkable',
			config: {
				keys,
				index: '_id',
				data
			},
			features: {
				checkable: {}
			}
		},
		{
			id: 'Basic',
			config: {
				keys,
				index: '_id',
				data
			}
		},


		{
			id: 'Autohide',
			config: {
				keys,
				index: '_id',
				data
			},
			features: {
				autohide: true
			}
		},

		{
			id: 'Callbacks',
			config: {
				keys,
				index: '_id',
				data
			},
			callbacks: {
				render: {
					cell: o => '🌱  <small>This is an HTML String:</small> ' + o.value + '  🌱',
					key: o => '🌲  <small>key</small> ' + o.value + '  🌲',
				}
			}
		}


	]
</script>

<main>
	{@html css}
	<h1>Svelte Tabular Table</h1>
	<p>Lightweight boilerplate table component for Svelte. All the hard stuff is done for you - rearrangeable, checkable, orderable, and autohide (for large datasets).</p>
	<h3>No CSS No Chuff</h3>
	<p>Just the raw essentials. Total <em>aesthetic</em> CSS on this docs page:</p>
	<code>{css}</code>
	{#each tables as table, idx}
		<h2>Example {idx + 1} - {table.id}</h2>
		<Table {...table} />
	{/each}
</main>
