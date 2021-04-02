<script>
	import Tr from './Tr.svelte'

	export let config
	export let dimensions
	export let debug
	export let callbacks
	export let features

	export let misc


</script>


<tbody>

	<!-- rows... -->

	{#each config.data as item, idx }

		<Tr {config} {dimensions} {debug} {callbacks} {features} {misc} {item} />

	{/each}
</tbody>