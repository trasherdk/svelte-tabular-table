<script>
	import TurndownService from 'turndown'
	import { tables } from 'turndown-plugin-gfm'

	import { Table, slugify } from './../../src/index.js'
	import Auto from './Auto.svelte'
	import data from './data.js'
	import docs from './docs.js'

	let turndown = new TurndownService( { preformattedCode: true } )
	turndown.use(tables)


	const keys = ['name', 'company', 'about' ]

	let many = []
	for (let i = 0; i < 100; i++) many = many.concat( data )

	const all = [

		{
			id: 'Basic',
			init: {
				keys: ['name', 'balance', 'address', 'company'],
				index: '_id',
				data
			}
		}, 
		{
			id: 'Dimensions',
			init: {
				keys: ['age', 'latitude', 'longitude', 'name', 'about'],
				index: '_id',
				data
			},
			dimensions: {
				row: 14,
				padding: 0,
				widths: [50,100,100,150]
			}
		},
		{
			id: 'Sortable',
			init: {
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
			init: {
				keys: ['name', 'balance', 'company', 'email', 'tags'],
				index: '_id',
				data
			},
			dimensions: {
				widths: [ 100, 200, 100, 200 ]
			},
			features: {
				checkable: {}
			}
		},
		{
			id: 'Rearrangeable',
			init: {
				keys: ['name', 'balance', 'company'],
				index: '_id',
				data
			},
			features: {
				rearrangeable: (from, to) => alert(`from ${from} to ${to}`)
			}
		},
		{
			id: 'Autohide (1)',
			init: {
				keys: ['name', 'balance', 'company', 'latitude', 'longitude', 'tags'],
				index: '_id',
				data: many,
				nohead: true
			},
			dimensions: {
				row: 16
			}
		},
		{
			id: 'Autohide (2)',
			init: {
				keys: ['name', 'balance', 'company', 'latitude', 'longitude', 'tags'],
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
			init: {
				keys: ['name', 'balance', 'company', 'latitude', 'longitude'],
				index: '_id',
				data
			},
			callbacks: {
				render: {
					cell: o => ['🌱','☘️','🥬','🌿','🥒'][o.index] ,
					key: o => ['🌴','🌲','🌳','🏔','🥦'][o.index],
				},
				click: {
					cell: o => alert( ['🌴','🌲','🌳','🏔','🥦'][o.index] ) ,
					key: o => alert( ['🌱','☘️','🥬','🌿','🥒'][o.index] ),
				}
			}
		},
		{
			id: 'Components',
			init: {
				keys: ['picture', 'name', 'latitude', 'longitude', 'registered', 'about'],
				index: '_id',
				data
			},
			callbacks: {
				render: {
					cell: Auto,
					key: Auto,
				}
			}
		},


	]


	const scroller = `
		width:100%;
		height:400px;
		overflow:auto;
		border: 1px solid black;`



	let autohide = {
		'Autohide (1)' : {
			container: window,
			position: 0,
			buffer: -0.1
		},
		'Autohide (2)' : {
			container: null,
			position: 0,
			buffer: 2
		}
	}

	let code = false
	let nav = window.location.hash.substring(1)
	if (nav == '') nav = 'basic'
	window.addEventListener( 'hashchange', e => nav = window.location.hash.substring(1) )
	let markdown = false
	let mdEl, apiEl
	if (nav == 'markdown') markdown = true


	async function grab() {
		let str = turndown.turndown( mdEl.outerHTML )
		if (!navigator.clipboard) return
		await navigator.clipboard.writeText( str )
		alert('markdown copied')
	}

	function getID( table, idx, no ) {
		let s = `Example ${idx + 1} - ${table.id}`
		if (no) return s
		return slugify( s )
	}

</script>

<svelte:window on:scroll={ e => autohide[ 'Autohide (1)' ].position = window.scrollY } />
<main style="max-width: 1200px;margin: 0 auto;padding-bottom: 2em;">


	{#if markdown}
		<div bind:this={mdEl}>
			{@html docs['Intro']}
			<ul>
				<li><a target="_blank" href="https://autr.github.io/svelte-tabular-table">Live Examples ↪</a></li>
				{#each all as table, idx}
					<li><a href={'#'+getID( table, idx )}>{getID( table, idx, true )}</a></li>
				{/each}
				<li><a href="#api-documentation">API Documentation</a></li>
			</ul>
			{#each all as table, idx}

				<h3 id={getID( table, idx )}>
					<a target="_blank" href={`https://autr.github.io/svelte-tabular-table#${slugify(table.id)}`}>{getID( table, idx, true )}</a>
				</h3>
				<p>{@html docs[ table.id ]?.meta || ''}</p>
				<pre>
					<code>
						{ docs[table.id]?.code }
					</code>
				</pre>
			{/each}

			<h1 id="api">
				API Documentation
			</h1>
			<Table init={{
				data: docs['API'],
				keys: ['name', 'types', 'example', 'description'],
				index: 'name',
				nodiv: true
			}} callbacks={{
				render: {
					cell: o => o.value
				}
			}} />
		</div>

	{:else}
		{@html docs['Intro']}
		{@html docs['Advert']}
		<div class="row" style="margin: 1em 0em">
			{#each all as table,idx}
				<a class="opt" class:fill={ nav == slugify(table.id)} href={'#'+slugify(table.id)}>Example {idx + 1} - {table.id}</a>
			{/each}
			<a class="opt" class:fill={ nav == 'api'} href={'#api'}>API Documentation</a>

		</div>

		{#each all as table, idx}
			<div class:hidden={ nav != slugify(table.id) } style="margin: 3em 0em">
				<h1>
					Example {idx + 1} - {table.id}
					<code 
						class:filled={code}
						on:click={e => code = !code }
						class="cc">{'</>'}</code>
				</h1>
				<p>{@html docs[ table.id ]?.meta || ''}</p>

				{#if code && docs[table.id] }

					<pre>
						<code>
							{ docs[table.id]?.code }
						</code>
					</pre>
				{/if}

				<div class:hidden={code}>
					{#if table.id.indexOf('Autohide (1)') != -1}
						<Table { ...table } features={ { autohide: autohide[ table.id ] } } />
					{:else if table.id.indexOf('Autohide (2)') != -1}
						<div 
							bind:this={ autohide[ table.id ].container }
							on:scroll={ e => autohide[ table.id ].position = e.target.scrollTop }
							style={scroller}>
							<p style="padding: 4em 1em;text-align: center;">Autohide automatically calculates internal offset inside container (ie. this paragraph).</p>
							<Table { ...table } features={ { autohide: autohide[ table.id ] } } />
						</div>
					{:else}
						<Table {...table} />
					{/if}
				</div>


			</div>
		{/each}


		<div class:hidden={ nav != 'api' }>
			<h1>
				API Documentation
			</h1>
			<Table init={{
				data: docs['API'],
				keys: ['name', 'types', 'example', 'description'],
				index: 'name'
			}} dimensions={{
				widths: [ 250, 220 ]
			}} callbacks={{
				render: {
					cell: o => {
						if (o.key == 'types' || o.key == 'description') return `
							<span>${o.value}</span>
						`
						return `<span style="font-family:monospace;">${o.value}</span>`
					}
				}
			}} />
		</div>
	{/if}
	<div style="display:flex;justify-content: space-between;">
		<p>Created by <a target="_blank" href="https://autr.tv">G.Sinnott</a> { (new Date()).getFullYear()} MIT</p>
		<p>
			<a style="cursor:pointer" on:click={e => markdown = !markdown}>MD</a> |
			<a style="cursor:pointer" on:click={grab}>GB</a>
		</p>
	</div>
</main>
