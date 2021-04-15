
function log( msg ) {
	console.log( `[svelte-tabular-table] ${msg}`)
}

export const defaults = {
	hover: o => log(`${o.id} "${o.key}" -> hovered`),
	click: o => log(`${o.id} "${o.key}" -> clicked`),
	dblclick: o => log(`${o.id} "${o.key}" -> double clicked`),
	render: o => o.value,
	checked: o => log(`${o.id} -> ${o.event.target.checked ? 'checked' : 'unchecked'}`),
	sort: (conf, data, meta) => {
		let copy = data
		data = null
		copy.sort( (a,b) => {
			let aa = a[conf.key] || ''
			let bb = b[conf.key] || ''
			if ( typeof(aa) == 'string' ) aa = aa.toLowerCase()
			if ( typeof(bb) == 'string' ) bb = bb.toLowerCase()
			return +(aa > bb) || +(aa === bb) - 1
		})
		if ( conf.direction ) copy = copy.reverse()
		return copy
	},
	dimensions: {
		row: null,
		padding: 10,
		widths: []
	}
}
export const slugify = text => text.toString().toLowerCase()
	.replaceAll(' ', '-')           // Replace spaces with -
	.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
