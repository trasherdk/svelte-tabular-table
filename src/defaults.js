import { sort } from 'fast-sort'

function log( msg ) {
	console.log( `[svelte-tabular-table] ${msg}`)
}

let SORT_TIMESTAMP

window.addEventListener( 'mousedown', e => {
	// const CP = SORT_TIMESTAMP
	// SORT_TIMESTAMP = -999
	// setTimeout( e => {
	// 	console.log(SORT_TIMESTAMP, '???')
	// 	if (SORT_TIMESTAMP != -999) {
	// 		SORT_TIMESTAMP = CP
	// 	}
	// }, 200)
})

export const defaults = {
	hover: o => log(`${o.id} "${o.key}" -> hovered`),
	click: o => log(`${o.id} "${o.key}" -> clicked`),
	dblclick: o => log(`${o.id} "${o.key}" -> double clicked`),
	render: o => o.value,
	checked: o => log(`${o.id} -> ${o.event.target.checked ? 'checked' : 'unchecked'}`),
	sort: (key, direction, source, callback) => {
		let timestamp = (new Date() * 1)
		SORT_TIMESTAMP = timestamp
		let copy = [...source]
		const END = ts => {
			if (ts != SORT_TIMESTAMP) {
				console.log(`[svelte-tabular-table] end sort loop: ${SORT_TIMESTAMP}`)
				return true	
			}
			return false
		}
		window.requestAnimationFrame( e => {

			if ( END(timestamp) ) return

			let idx = 0
			copy = sort( copy )[ direction ? 'asc' : 'desc' ]( [
				u => u[key],
				u => u.updated
			])

			return callback( copy )
			
			const min = 20
			let increase = 1

			function sendCallback() {
				if ( END(timestamp) ) return
				let neu = []
				for (let i = 0; i < increase; i++ ) {
					if (copy[idx]) neu.push( copy[idx] )
					idx += 1
				}
				if ( idx > min ) increase += 2
				callback( neu )
				if (idx < copy.length) {
					console.log('req')
					window.requestAnimationFrame( sendCallback )
				} else {
					console.log(`[svelte-tabular-table] finished sending sorted: ${copy.length}`)

				}
			}

			if ( END(timestamp) ) return
			sendCallback()
		})
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
