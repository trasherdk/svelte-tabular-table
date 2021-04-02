<script>


	import Tr from './Tr.svelte'
	import { onMount, onDestroy } from 'svelte'
	import queryString from 'query-string'
	import dragdrop from 'svelte-native-drag-drop'
	import { fade } from 'svelte/transition'
	import Tbody from './Tbody.svelte'
	import { defaults, slugify } from './defaults.js'

	onMount( async () => {
	})

	function warn( msg ) {
		console.warn( `[svelte-tabular-table] ${msg}`)
	}
	function log( msg ) {
		console.log( `[svelte-tabular-table] ${msg}`)
	}
	function error( msg ) {
		console.error( `[svelte-tabular-table] ${msg}`)
	}

	function review( config, dimensions, callbacks, features, misc ) {
		if ( features.autohide && dimensions.row ) warn( 'features.autohide is set, but no height is set for dimensions.row (defaulting to 1em)')
	}

	$: rev = review( config, dimensions, callbacks, features, misc )


	export let config = {
		keys: [], // array of text or array of objects
		data: [],
		index: null
	}

	export let dimensions = {
		columns: [],
		row: null,
		padding: 10,
		widths: []
	}

	export let debug = true

	export let id = ''
	export let meta = ''


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
		}, // <- set the currently sorted thead name with structure { sort: thead name, dir: descend||ascend }
		rearrangeable: null, // <- callback event for rearranging with integer index (from, to) as arguments
		selectable: null,
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
				log( `sorting with "${o.key}" ${ d ? 'ascending' : 'descending'}`)
			}
		}
	}

	// export let cards = false // <- show a card for any property named "viz"
	// export let sortable = null // <- set the currently sorted thead name with structure { sort: thead name, dir: descend||ascend }
	// export let filled = [] // <- array of booleans for which rows are "filled"
	// export let rearrangeable = null // <- callback event for rearranging with integer index (from, to) as arguments
	// export let checkable // <- object of ids holding booleans

	// $: outputUrl = location.hash.split('?')[0] + '?' + queryString.stringify( sortable )

	// let lastLength = 0


	// function onColRowsChanged( columns, rows ) {
	// 	if (!rows) return
	// 	if (rows.length != lastLength) {
	// 		lastLength = rows.length
	// 		hiddenRows = Array( rows.length ).fill( 10 )
	// 	}
	// 	refresh = true
	// 	setTimeout( e => {
	// 		refresh = false
	// 		triggerScrollEvent()
	// 	}, 1)
	// }

	// $: onColRowsChanged( columns, rows )

	// function onSortClick( key ) {
	// 	refresh = true
	// 	if (!sortable) return
	// 	if ( sortable?.sort == key ) sortable.dir = isDescend ? 'ascend' : 'descend'
	// 	sortable.sort = key
	// 	setTimeout( e => {
	// 		window.location = outputUrl
	// 		refresh = false
	// 	}, 1)
	// }


	// function syncColumns( c ) {
	// 	if (!c) c = []
	// 	if ( checkable ) c = [ CHECK ].concat( c )
	// 	if ( rearrangeable ) c = [ REARRANGE ].concat( c )

	// 	return c
	// }
	// $: columnsList = syncColumns( columns )
	// $: rowsCount = ( typeof( rows ) == 'object' ? rows.length : rows ) || 0


	// let isDragging = false


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
							if ( typeof(rearrangeable) == 'function' ) {
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

	$: bindDragDrop( config.data )


	// export function triggerScrollEvent( container ) {
	// 	const scroll = container?.scrollTop || 0
	// 	const outside = container?.offsetHeight || window.innerHeight

	// 	const extra = window.innerHeight * 2

	// 	let tally = 0

	// 	for (const [idx, tr] of Object.entries(rowEls)) {
	// 		hiddenRows[idx] = false
	// 		if (tr) {
	// 			const offset = tr.offsetTop
	// 			const height = tr.offsetHeight
	// 			if ( scroll > offset + height + extra ) hiddenRows[idx] = height
	// 			if ( offset > scroll + outside + extra ) hiddenRows[idx] = height

	// 			if (hiddenRows[idx]) tally += 1
	// 		}
	// 	}

	// }

	// $: bindDragDrop( rowsCount )
	// $: isDragging = $dragdrop['table']?.dragging
	// $: isDescend = ( sortable?.dir || '' ).indexOf('desc') != -1
	// $: noWrap = key => ( key == CHECK || key == REARRANGE || key == 'id' ? 'whitespace-nowrap nowrap w1pc cmr0 cptb1 cplr2' : `cptb1 cplr2 ` )

	// let hiddenRows = {}



	// let rowEls = []
	// let handles = []
	// let dropEls = []
	// let theadEl, tableEl


	// let els = { table: null, thead: null, tr: {}, td: {} }

	// const REARRANGE  = 'internal_table_rearrange'
	// const CHECK = 'internal_table_select'

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

	<thead>

		<Tr {config} {dimensions} {debug} {callbacks} bind:features={features} {misc} item={thead} type={'key'} {indeterminate} />
	</thead>

	<tbody>

		{#each data as item, idx }
			<Tr {config} {dimensions} {debug} {callbacks} bind:features={features} {misc} {item} type={'cell'} />

		{/each}
	</tbody>
</table>
