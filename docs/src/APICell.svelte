<script>

	export let id
	export let item
	export let key
	export let value
	export let rowIndex
	export let cellIndex
	export let type

	const classes = {
		monospace: ['Default', 'Example', 'Name'],
		lozenge: ['Types'],
		bold: ['Name']
	}

	function is( id ) {
		return classes[id].indexOf( key ) != -1
	}

	function split( value ) {
		if (key != 'Name') return value
		let bits = value.split('.')
		bits[bits.length-1] = `<span class="bold">${bits[bits.length-1]}</span>`
		return `<span class="">${bits.join('.')}</span>`
	}

	$: name = split( value )

</script>

<span
	class:lozenge={ is('lozenge') }
	class:monospace={ is('monospace') }
	class:fade={ value == 'null' }>
	{@html name }
</span>