<script>
	export let id
	export let item
	export let key
	export let value
	export let index
	export let event
	export let type
</script>

{#if type == 'key'}
	<b style="letter-spacing: 0.2em">{value}</b>
{:else if (key == 'picture')}
	<img src={ value } />
{:else if (key == 'registered')}
	<em>{ ( new Date( value ) ).toDateString() }</em>
{:else if (key == 'about')}
	<marquee>{value}</marquee>
{:else if (key == 'name')}
	<blink style="color:rgb(255,62,0)">{value}</blink>
{:else if (key == 'latitude' || key =='longitude' )}
	<code>{value}</code>
{:else}
	{value}
{/if}