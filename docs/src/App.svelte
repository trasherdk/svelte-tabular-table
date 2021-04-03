<script>
	import { Table, slugify } from './../../src/index.js'
	import data from './data.js'

	const css = `
<style>
	html, body {
		padding: 0;
		font-family: sans-serif;
		line-height: 1.8em;
		font-size: 14px;
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
	for (let i = 0; i < 100; i++) many = many.concat( data )

	const tables = [

		{
			id: 'Basic',
			meta: `
				Basic configuration:
				<ul>
					<li><code>config.data</code> - an array of objects comprising the rows</li>
					<li><code>config.keys</code> - an array of keys to define columns </li>
					<li><code>config.index</code> - the key used for indexing each row *</li>
				</ul>
				* If no valid <code>config.index</code> is set, or if there are duplicate values inside data, the table will attempt to generate unique keys.

			`,
			config: {
				keys: ['name', 'balance', 'address', 'company'],
				index: '_id',
				data
			}
		},
		{
			id: 'Sortable',
			meta: `
				Sortable headers can be initialised by setting <code>features.sortable.key</code> to an initial value and <code>features.sortable.direction</code> to <code>"ascending"</code> or <code>"descending"</code>.

			`,
			config: {
				keys: ['name', 'balance', 'company', 'latitude', 'longitude', 'tags'],
				index: '_id',
				data
			},
			features: {
				sortable: {
					key: 'name'
				}
			}
		},
		{
			id: 'Checkable',
			meta: `
				Checkable rows are initialised by passing a blank <code>{}</code> object to <code>features.checkable</code>, which will be set via <code>config.index</code>.
			`,
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
			meta: `
				Rearrangeable rows are initialised by passing a callback function to <code>features.rearrangeable</code>, which will return the <em>from</em> and <em>to</em> indexes as an integer: <code>( from, to ) => ...</code> 
			`,
			config: {
				keys: ['name', 'balance', 'company'],
				index: '_id',
				data
			},
			features: {
				rearrangeable: (from, to) => alert(`from ${from} to ${to}`)
			},
			code: `
				config: {
					keys: ['name', 'balance', 'company'],
					index: '_id',
					data
				},
				features: {
					rearrangeable: (from, to) => alert(\`from \${from} to \${to}\`)
				}
			`
		},
		{
			id: 'Autohide',
			meta: 'Useful for large datasets or lists that render images and video.',
			config: {
				keys,
				index: '_id',
				data: many,
				nohead: true
			},
			dimensions: {
				row: 16
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
		},


	]

	const scroller = `
		width:100%;
		height:400px;
		overflow:auto;
		border: 1px solid lightgrey;`


	let autoEl, autoTop

	$: autohide = {
		container: autoEl,
		position: autoTop,
		buffer: 1
	}

</script>

<main style="max-width: 1200px;margin: 0 auto;">
	{@html css}
	<h1>Svelte Tabular Table</h1>
	<p>Fully-featured, lightweight table component for Svelte.</p>
	<div style="display:flex">
		<div style="flex-basis:0;flex-grow:1;margin-right:2em">
			<h2>Raw Boilerplate</h2>
			<p>All the hard stuff is done - <span>rearrangeable, checkable, orderable, and autohide</span> (for large datasets, images etc).</p>
		</div>
		<div style="flex-basis:0;flex-grow:1;margin-right:2em">
			<h2>No CSS, No Chuff</h2>
			<p>Core properties are inlined onto the table with no extra styling. Utility classes prepended with <code>stt</code>.</p>
			<!-- <code style="font-size:10px">{css}</code> -->
		</div>
		<div style="flex-basis:0;flex-grow:1;margin-right:2em">
			<h2>Sane Configuration</h2>
			<p>Based around 4 categories - config, dimensions, features, callbacks - keep it simple, stupid.</p>
		</div>
	</div>
	<h1>Examples</h1>
	{#each tables as table,idx}
		<p>
			<a href={'#stt-title-'+slugify(table.id)}>Example {idx + 1} - {table.id}</a>
		</p>
	{/each}
	{#each tables as table, idx}
		<h2 id={'stt-title-'+slugify(table.id)} >Example {idx + 1} - {table.id}</h2>
		<p>{@html table.meta || ''}</p>

		{#if table.id == 'Autohide'}
			<div 
				bind:this={ autoEl }
				on:scroll={ e => autoTop = e.target.scrollTop }
				style={scroller}>
				<p style="padding: 4em 1em;text-align: center;">Automatically calculates internal offset inside container (ie. this paragraph).</p>
				<Table { ...table } features={ { autohide } } />
			</div>
		{:else}
			<Table {...table} />
		{/if}
	{/each}
</main>
