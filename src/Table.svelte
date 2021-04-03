<script>


	import Tr from './Tr.svelte'
	import { onMount, onDestroy } from 'svelte'
	import queryString from 'query-string'
	import dragdrop from 'svelte-native-drag-drop'
	import { fade } from 'svelte/transition'
	import { defaults, slugify } from './defaults.js'


	function warn( msg ) {
		console.warn( `[svelte-tabular-table] ${msg}`)
	}
	function log( msg ) {
		if (debug) console.log( `[svelte-tabular-table] ${msg} ${ id ? '("' + id + '")' : ''}`)
	}
	function error( msg ) {
		console.error( `[svelte-tabular-table] ${msg}`)
	}

	function review( config_, dimensions, callbacks, features, misc ) {
		if ( features.autohide && !dimensions.row ) warn( 'features.autohide is set, but no height is set for dimensions.row (defaulting to 1em)')

		let ids = []

		let tally = { added: 0, duped: 0 }
		const len = config.data.length
		for (let i = 0; i < len; i++ ) {
			if (!config.data[i][config.index]) {
				const id = 'id' + i
				warn(`no property "${config.index}" in data item ${i}, defaulting to "${id}"`)
				config.data[i][config.index] = id
				tally.added += 1
			}
			if ( ids.indexOf( config.data[i][config.index] ) != -1 ) {
				config.data[i] = {...config.data[i]}
				while ( ids.indexOf( config.data[i][config.index] ) != -1 ) config.data[i][config.index] += '_dup'
				tally.duped += 1
			}
			ids.push( config.data[i][config.index] )
		}
		const activ = tally.duped > 0 || tally.added > 0
		if (activ ) warn( `${tally.duped}/${len} duplicate keys amended, ${tally.added}/${len} keys added`)
	}

	$: rev = review( config, dimensions, callbacks, features, misc )


	export let config = {
		keys: [], // array of text or array of objects
		data: [],
		index: null,
		nohead: true
	}

	export let dimensions = {...defaults.dimensions}

	export let debug = true

	export let id = ''
	export let meta = ''

	onMount( async () => {
	})

	export let callbacks = {

		hover: {
			key: e => e,
			row: e => e,
			cell: e => e
		},
		click: {
			key: defaults.click,
			row: defaults.click,
			cell: defaults.click
		},
		render: {
			key: defaults.render,
			cell: defaults.render
		},
		checked: defaults.checked
	}

	export let features = {
		sortable: { 
			key: null, 
			direction: false, 
			sort: defaults.sort
		}, 
		rearrangeable: null, // <- callback event for rearranging with integer index (from, to) as arguments
		checkable: null,
		autohide: null
	}

	let misc = {
		hidden: {},
		els: { table: null, thead: null, tr: {}, td: {}, handles: {}, drops: {} },
		refresh: true,
		reorder: o => {
			const key = features?.sortable?.key
			features.sortable.direction = !features.sortable.direction
			if (o.key) {
				const d = features.sortable.direction
				features.sortable.key = o.key
				log( `sorting with "${o.key}" -> ${ d ? 'ascending' : 'descending'}`)
			}
		}
	}



	let hasDragDrop = false

	onDestroy( async () => { 
		if ( hasDragDrop ) dragdrop.clear('table')
	})


	function bindDragDrop( data ) {

		if (!features.rearrangeable) return

		setTimeout( () => {

			if ( hasDragDrop ) dragdrop.clear('table')
			for (const [key, tr] of Object.entries( misc.els.tr )) {

				const handle = misc.els.handles[key]

				const callbacks = {
					drop: e => {
						try {
							const f = e.source.getAttribute('data-key')
							const t = e.destination.getAttribute('data-key')
							const ff = config.data.find( d => d[config.index] == f )
							const tt = config.data.find( d => d[config.index] == t )
							const fff = config.data.indexOf(ff)
							const ttt = config.data.indexOf(tt)
							log(`dragged from ${fff} to ${ttt}`)
							if ( typeof(features.rearrangeable) == 'function' ) {
								features.rearrangeable( fff, ttt )
							} else {
								warn(`there is no callback for features.rearrangeable (nothing will happen)`)
							}
						} catch( err ) {
							error(`could not drag and drop: ${err.message}`)
						}
					},
					enable: e => isDragging = true,
					disable: e => isDragging = false
				}
				if (handle && tr) {
					dragdrop.addDragArea( 'table', handle, tr )
					dragdrop.addDropArea( 'table', tr, callbacks )
					hasDragDrop = true
				}
			}
		}, 1)
	}


	let aboveY, belowY, bottomY



	function onScroll( conf, autohide, dims ) {

		if (!autohide) return

		if (autohide && !dimensions?.row) dimensions.row = defaults.dimensions.row
		if (autohide && !dimensions?.padding) dimensions.padding = defaults.dimensions.padding


		const el = autohide?.container
		const exists = el != undefined
		const scroll = autohide?.position || 0
		const height = dims.row + (dims.padding * 2)
		const outside = ( el?.offsetHeight || window.innerHeight ) + height
		const extra = outside * ( autohide?.buffer || 0 )


		let tally = { above: 0, below: 0, first: null, last: null }
		const len = (data || []).length

		const to = misc?.els?.table?.offsetTop || 0
		const eo = el?.offsetTop || 0
		const off = to - eo

		for (let i = 0; i < len; i++ ) {

			const item = data[i]
			const id = item[ conf.index ]

			misc.hidden[ id ] = false

			const thead = conf.nohead ? 0 : height
			const piece = (height * i) + height + thead

			const above = scroll > piece + off + extra
			const below = piece + off > scroll + outside + extra

			if ( ( above || below  ) && exists ) misc.hidden[id] = true

			if ( above ) {
				tally.above += 1
				tally.first = i
			}
			if ( below ) {
				tally.below += 1
				if (!tally.last) tally.last = i
			}

		}

		const activ = tally.above > 0 || tally.below > 0

		const indicators = false

		if (debug && activ && indicators) {
			if (!aboveY) {
				aboveY = document.createElement('div')
				document.body.appendChild( aboveY ) 
				belowY = document.createElement('div')
				document.body.appendChild( belowY ) 
				bottomY = document.createElement('div')
				document.body.appendChild( bottomY ) 
			}
			const all = `
				position: absolute;
				width: 100vw;
				height: 1px;
				background: red;
				display: block;
				left: 0px;`
			aboveY.style = `
				${all}
				top: ${ eo - scroll }px;`
			belowY.style = `
				${all}
				top: ${ to - scroll }px;`
			bottomY.style = `
				${all}
				top: ${ to - scroll + (misc?.els?.table?.offsetHeight || 0) }px;`
		}

		if (activ) log(`${outside}px container: ${tally.above}/${len} above, ${tally.below}/${len} below, from ${tally.first} to ${tally.last}, ${len - (tally.above+tally.below)}/${len} visible`)
	}

	$: onScroll( config, features?.autohide, dimensions )
	$: bindDragDrop( config.data )

	function _thead() {
	
		return config.keys.reduce(function(result, item, index) {
				result[item] = item
				return result
		}, { [ config.index ]: 'svelte-tabular-table-thead' })
	}

	$: thead = _thead()

	let indeterminate = false

	function isIndeterminate( checkable ) {
		let yes = false
		let no = false
		for (let i = 0; i < config.data.length; i++) {
			const id = config.data[i][config.index]
			if ( (features.checkable || [])[id] ) yes = true
			if ( !(features.checkable || [])[id] ) no = true
		}
		if ( !yes && no ) return indeterminate = false
		if ( yes && !no ) return indeterminate = false
		return indeterminate = true

	}

	$: isIndeterminate( features.checkable )

	$: sort = features?.sortable?.sort || defaults.sort
	$: data = (features?.sortable?.key) ? sort( features.sortable, [...config.data], id ) : config.data

</script>

<table 
	bind:this={ misc.els.table } 
	id={ 'stt-'+slugify(id) }
	class={ 'stt-'+slugify(id) }
	data-id={ slugify(id) }
	style="width:100%;table-layout:fixed;border-spacing:0;">

	{#if !config.nohead}
		<thead>

			<Tr {config} {dimensions} {debug} {callbacks} bind:features={features} {misc} item={thead} type={'key'} {indeterminate} />
		</thead>

	{/if}

	<tbody>

		{#each data as item, idx }
			<Tr {config} {dimensions} {debug} {callbacks} bind:features={features} {misc} {item} type={'cell'} />

		{/each}
	</tbody>
</table>
