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
		if (debug) console.log( `[svelte-tabular-table] ${msg}`)
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










	function onScroll( conf, autohide, dims ) {

		const el = autohide?.container
		const _ = {
			scroll: el?.scrollTop || 0,
			outside: el?.offsetHeight || window.innerHeight,
			height: dims.row + (dims.padding * 2)
		}

		let tally = 0
		const len = (data || []).length

		// console.log( _, '......' )

		for (let i = 0; i < len; i++ ) {

			const item = data[i]
			const id = item[ conf.index ]

			const offset = _.height * i

			misc.hidden[ id ] = false
			const extra = _.outside * 0

			console.log(_.scroll, offset, _.height)

			const past = _.scroll > offset + _.height + extra
			const behind = offset > _.scroll + _.outside + extra

			if ( past ) misc.hidden[id] = _.height
			if ( behind ) misc.hidden[id] = _.height

			if (misc.hidden[id]) tally += 1
		}

		log(`${tally}/${len} hidden`)
	}

	$: onScroll( config, features?.autohide, dimensions )

	$: bindDragDrop( config.data )



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
