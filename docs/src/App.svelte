<script>
	import { Table, slugify } from './../../src/index.js'
	import data from './data.js'

	const css = `
<style>
	html, body {
		padding: 0;
		font-family: sans-serif;
		line-height: 1.8em;
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

	let many = []
	for (let i = 0; i < 2; i++) many = many.concat( data )

	const tables = [

		{
			id: 'Autohide',
			meta: 'Useful for big lists',
			config: {
				keys,
				index: '_id',
				data: many
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
				rearrangeable: (from, to) => alert(`from ${from} to ${to}`)
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

	const scroller = `width:100%;height:400px;overflow:auto;border: 1px solid lightgrey;`


	let autoEl, autoTop

	$: autohide = {
		container: autoEl,
		position: autoTop
	}
</script>

<main>
	{@html css}
	<h1>Svelte Tabular Table</h1>
	<p>Lightweight boilerplate table component for Svelte. All the hard stuff is done for you - rearrangeable, checkable, orderable, and autohide (for large datasets).</p>
	<h2>No CSS No Chuff</h2>
	<p>Just the raw essentials. Total <em>aesthetic</em> CSS on this docs page:</p>
	<code>{css}</code>
	<h2>Examples</h2>
	{#each tables as table,idx}
		<p>
			<a href={'#stt-title-'+slugify(table.id)}>Example {idx + 1} - {table.id}</a>
		</p>
	{/each}
	{#each tables as table, idx}
		<h2 id={'stt-title-'+slugify(table.id)} >Example {idx + 1} - {table.id}</h2>
		<p>{table.meta || ''}</p>

		{#if table.id == 'Autohide'}
			<div 
				bind:this={ autoEl }
				on:scroll={ e => autoTop = e.target.scrollTop }
				style={scroller}>
				<Table { ...table } features={ { autohide } } />
			</div>
		{:else}
			<Table {...table} />
		{/if}
	{/each}
</main>
