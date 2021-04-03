<script>

	import { defaults, slugify } from './defaults.js'

	export let config
	export let dimensions
	export let debug
	export let callbacks
	export let features

	export let misc

	export let id
	export let item
	export let key

	export let type

	export let width

	export let colspan = 1

	$: _refresh = misc.refresh ?  ' ' : ''

	$: _style = e => {
		let s = 'overflow-wrap:break-word;'
		const whitespace = 'white-space: nowrap;overflow:hidden;text-overflow: ellipsis;'
		const em = (dimensions.row || defaults.dimensions.row) + 'px;'
		s += 'padding:' + (dimensions.padding || defaults.dimensions.padding) + 'px;'
		s += features.autohide || dimensions.row ? whitespace + 'height:' + em  + 'line-height:' + em : '' 
		return s
	}
	$: style = _style()

	$: tdStyle = `
		vertical-align:middle;
		margin:0;
		padding:0;
		position:relative;
		${ sorting && type =='key' ? 'cursor:pointer' : ''}
		${width?`width:${width};`:''}`

	$: hasSlot = $$props.$$slots

	$: obj = { id, item, key, value: item[key] }
	$: cbs = callbacks || {}
	$: renderFunc = (cbs.render || {})[type] || defaults.render
	$: clickFunc = (cbs.click || {})[type] || defaults.click

	function onClick(obj, e) {
		clickFunc( obj, e )
		const exists = config.keys.indexOf( key ) != -1
		if ( type == 'key' && exists && sorting) {
			misc.reorder( { id, item, key, e} )
		}
	}
	$: sorting = features?.sortable?.key
	$: direction = features?.sortable?.direction
	$: same = sorting == key
</script>



<td style={tdStyle}
	{colspan}
	class={ 'stt-'+slugify( key ) }
	class:stt-sorted={ same }
	class:stt-ascending={ same && direction }
	class:stt-descending={ same && !direction }
	data-key={ key }
	on:click={ e => onClick(obj, e) }>
	<div 
		{style}>
		<!-- use svelte:component -->
		{@html (renderFunc( obj ) || '') + _refresh }
		<slot />
	</div>
</td>