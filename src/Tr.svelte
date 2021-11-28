<script>
	import Td from './Td.svelte'
	import { defaults, slugify } from './defaults.js'

	export let init
	export let dimensions
	export let debug
	export let callbacks
	export let features
	export let misc
	export let item
	export let type // ie. cell or thead
	export let rowIndex
	export let classes = {}

	export let indeterminate = false

	$:id = item[ init?.index ] || init?.data.indexOf(item)

	function setChecked( id, event ) {
		(callbacks?.checked || defaults.checked)( { id, event, checkable: features.checkable } )
		features.checkable[id] = event.target.checked
	}

	function onChecked( event ) {
		if ( type == 'key' ) {
			for (let i = 0; i < init.data.length; i++) {
				const id = init.data[i][init.index]
				setChecked( id, event )
			}
		} else {	
			setChecked( id, event )
		}

		
	}

	function getClasses( classes_ ) {
		let classStr = ''
		for (const [c, arr] of Object.entries(classes_)) {
			if ( (arr || []).indexOf( id ) != -1 && id != undefined ) {
				classStr += ' ' + c
			}
		}
		return classStr
	}


	const special = `
		cursor:pointer;
		position:absolute;
		top:0;
		left:0;
		width:100%;
		height:100%;
		display:flex;
		box-sizing: border-box;
		padding: ${(dimensions.padding || defaults.dimensions.padding)}px;
		align-items:center;`

	const _total = e => init.keys.length + ( features.checkable ? 1 : 0 ) + ( features.rearrangeable ? 1 : 0 )

	$: total = _total()
	$: offset = total - keys.length
	$: colspan = total

	let style = ''

	$: keys = init.keys || []

	$: checked = ( features?.checkable || {} )[ id ]

</script>


{#if misc.hidden[ id ] || !misc.inited }

	<tr bind:this={ misc.els.tr[ id ] }
		class:stt-hidden={ true }
		class={ 'stt-'+slugify(id) }
		data-key={ slugify(id) }
		{style}>
		<Td 
			{init} 
			{dimensions} 
			{debug} 
			{callbacks} 
			{features} 
			{misc} 
			{id} 
			{item} 
			{type} 
			{colspan}
			{rowIndex}
			cellIndex={ -1 }
			key={'stt-hidden-cell'}>
			<div style={`height: ${dimensions.row ? dimensions.row + 'px' : 'auto'}`} />
		</Td>
	</tr>

{:else}
	<tr bind:this={ misc.els.tr[ id ] }
		class={ 'stt-'+slugify(id) + getClasses( classes ) }
		class:stt-checked={checked }
		class:stt-rearrangeable={ features.rearrangeable }
		data-key={ slugify(id) }
		{style}>

		{#if features.checkable}
			<Td 
				{init} 
				{dimensions} 
				{debug} 
				{callbacks} 
				bind:features={features} 
				{misc} 
				{id} 
				{item} 
				{type} 
				cellIndex={ 0 }
				{rowIndex}
				key={'stt-checkable-cell'}>
				<label 
					class="checkbox stt-checkbox"
					style={special}>
					<input type="checkbox" 
						{indeterminate}
						bind:checked={ features.checkable[id] }
						on:change={ onChecked }  />
					<span />
				</label>
			</Td>
		{/if}

		{#if features.rearrangeable}
			<Td 
				{init} 
				{dimensions} 
				{debug} 
				{callbacks} 
				bind:features={features} 
				{misc} 
				{id} 
				{item} 
				{type}
				cellIndex={ offset - 1 }
				{rowIndex}
				key={'stt-rearrangeable-cell'}>
				{#if type != 'key'}
					<div style={special} bind:this={ misc.els.handles[ id ] }>|||</div>
				{/if}
			</Td>
		{/if}

		{#each keys as key, idx}
			<Td 
				{init} 
				{dimensions} 
				{debug} 
				{callbacks} 
				{features} 
				{misc} 
				{id} 
				{item} 
				{key} 
				{type} 
				{rowIndex}
				cellIndex={ offset + idx } />
		{/each}
	</tr>

{/if}
