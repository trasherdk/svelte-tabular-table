
function log( msg ) {
	console.log( `[svelte-tabular-table] ${msg}`)
}

export const defaults = {
	click: o => log(`${o.id} "${o.key}" -> clicked`),
	render: o => o.value,
	checked: o => log(`${o.id} -> ${o.event.target.checked ? 'checked' : 'unchecked'}`),
	sort: (conf, data, meta) => {
		data.sort( (a,b) => {
			const aa = a[conf.key].toLowerCase() || ''
			const bb = b[conf.key].toLowerCase() || ''
			return +(aa > bb) || +(aa === bb) - 1
		})
		if ( conf.direction ) data = data.reverse()
		return data
	}
}
export const slugify = text => text.toString().toLowerCase()
	.replaceAll(' ', '-')           // Replace spaces with -
	.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
	.replace(/\-\-+/g, '-')         // Replace multiple - with single -
