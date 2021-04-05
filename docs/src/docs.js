


function add( Name, Types, Example, Description, Default ) {
	return { Name, Types, Example, Description, Default }
}

function generate( code, add ){
	let s = `<script>\n`
	if (add) s += `import Auto from './Auto.svelte'\n`
	s += `import { Table } from 'svelte-tabular-table'\n`
	s += 'const config = {\n' 
	s += code.substring(1).replaceAll('\t\t\t', '\t') 
	s += '\n}\n</script>\n'
	s += '<Table {...config} />'
	if (add) {
		s += '\n\n// --- Auto.svelte ---\n\n'
		s += `<script>\r\n\texport let id\r\n\texport let item\r\n\texport let key\r\n\texport let value\r\n\texport let index\r\n\texport let type\r\n<\/script>\r\n\r\n{#if type == \'key\'}\r\n\t<b style=\"letter-spacing: 0.2em\">{value}<\/b>\r\n{:else if (key == \'picture\')}\r\n\t<img src={ value } \/>\r\n{:else if (key == \'registered\')}\r\n\t<em>{ ( new Date( value ) ).toDateString() }<\/em>\r\n{:else if (key == \'about\')}\r\n\t<marquee>{value}<\/marquee>\r\n{:else if (key == \'name\')}\r\n\t<blink style=\"color:rgb(255,62,0)\">{value}<\/blink>\r\n{:else if (key == \'latitude\' || key ==\'longitude\' )}\r\n\t<code>{value}<\/code>\r\n{:else}\r\n\t{value}\r\n{\/if}`
	}
	return s
}

export default {


	'API': [
		add( 
			'init.data',
			['Array:Object'],
			`[ { color: 'blue', id: '001' }, {color: 'red', id: '002' } ]`,
			'list of rows',
			`null`
		),
		add( 
			'init.keys',
			['Array:String'],
			`[ 'color', 'id' ]`,
			'list of columns',
			`null`
		),
		add( 
			'init.index',
			['String'],
			`id`,
			'unique index',
			`null`
		),
		add( 
			'init.nohead',
			['Boolean'],
			`true`,
			'dont render thead',
			`false`
		),
		add( 
			'init.nodiv',
			['Boolean'],
			`true`,
			'dont render div',
			`false`
		),

		// ---------------------
		
		add( 
			'dimensions.row',
			['Integer', 'String'],
			`10, "2em"`,
			'height of each row',
			`null`
		),
		add( 
			'dimensions.padding',
			['Integer', 'String'],
			`10, "1em"`,
			'padding of each row',
			`10`
		),
		add( 
			'dimensions.widths',
			['Array:Integer', 'Array:String'],
			`[ 100, "20%", "40px", 10]`,
			'width of each column',
			`[]`
		),

		// ---------------------
		
		add( 
			'features.sortable.key',
			['String'],
			`"color"`,
			'initial sorting key (enables sortable)',
			`null`
		),
		add( 
			'features.sortable.direction',
			['Boolean'],
			`true`,
			'ascending or descending',
			`false`
		),

		// ---------------------
		
		add( 
			'features.checkable',
			['Object'],
			`{}`,
			'blank object (enables checkable)',
			`null`
		),

		// ---------------------
		
		add( 
			'features.rearrangeable',
			['Function'],
			`(a,b) => alert(\`from \${a} to \${b}\`)`,
			'callback (enables rearrangeable)',
			`null`
		),
		// ---------------------
		
		add( 
			'features.autohide.container',
			['Element'],
			`bind:this={domElement},window`,
			'DOM element (enables autohide)',
			`null`
		),
		add( 
			'features.autohide.position',
			['Integer'],
			`on:scroll=>{setPosition}`,
			'current scroll position (set externally)',
			`0`
		),
		add( 
			'features.autohide.buffer',
			['Float'],
			`2`,
			'extend area (multiple of container height)',
			`0`
		),

		// ---------------------
		
		add( 
			'callbacks.render.key|cell',
			['Function', 'SvelteComponent'],
			`o => 'hello world'`,
			'rendering callback or SvelteComponent',
			`o => o.value`
		),
		add( 
			'callbacks.click.key|cell',
			['Function'],
			`o => alert(\`\${o.id}\ clicked!\`)`,
			'cell or key click callback',
			`null`
		),

		// ---------------------
		
		add( 
			'id',
			['String'],
			`table-1`,
			'id attribute of table',
			`table`
		),
		add( 
			'class',
			['String'],
			`table`,
			'class attribute of table',
			``
		),
		add( 
			'id',
			['String'],
			`background:red`,
			'style attribute of table',
			``
		),
		add( 
			'debug',
			['Boolean'],
			`true`,
			'debugging console log',
			`false`
		)
	],

	'APIDocs': `
		<p>Properties are categorised:</p>
		<ul>
			<li><code>init</code> - for data and setup</li>
			<li><code>dimensions</code> - formatting sizes, widths, heights</li>
			<li><code>features</code> - sortable, checkable, rearrangeable, autohide</li>
			<li><code>callbacks</code> - cell rendering and events</li>
		</ul>
		<pre><code>import { Table } from 'svelte-tabular-table'\n&lt;Table {init} {dimensions} {features} {callbacks} {id} {class} {style} {debug} /&gt;</code></pre>
	`,

	'Intro': `
		<h1 class="bb">Svelte Tabular Table</h1>
		<p>Fully-featured, no-BS, lightweight table component for Svelte.</p>
		<pre style="display:inline-block"><code>pnpm i svelte-tabular-table</code></pre>`,
	'Advert': `
		<div class="row">
			<div class="col">
				<h2>Raw Starter</h2>
				<p>All the hard stuff is done - <span>rearrangeable, checkable, orderable, and autohide</span> (for large datasets, images etc).</p>
			</div>
			<div class="col">
				<h2>No CSS, No Chuff</h2>
				<p>Core properties are inlined onto the table with no extra styling. Table is labelled with classes beginning with <code>stt</code>.</p>
				<!-- <code style="font-size:10px">{css}</code> -->
			</div>
			<div class="col">
				<h2>Sane Configuration</h2>
				<p>No decisions made for you. Config based around 4 categories - init, dimensions, features, callbacks.</p>
			</div>
		</div>`,
	'Basic': {
		meta: `
			Basic configuration:
			<ul>
				<li><code>init.data</code> - an array of objects comprising the rows</li>
				<li><code>init.keys</code> - an array of keys to define columns </li>
				<li><code>init.index</code> - the key used for indexing each row *</li>
				<li><code>init.nohead</code> - a boolean to remove thead</li>
				<li><code>init.nodiv</code> - a boolean to render without div **</li>
			</ul>
			<p>* If no valid <code>init.index</code> is set, or if there are duplicate values inside data, the table will attempt to generate unique keys. <br />** Enabling this means <code>dimensions</code> and <code>features.autohide</code> will not work.</p>`,
		code: generate(`
			init: {
				keys: ['name', 'balance', 'address', 'company'],
				index: '_id',
				data
			}`)
	},
	'Dimensions': {
		meta: `
			Dimensions control the formatting of the table:
			<ul>
				<li><code>dimensions.row</code> - sets row height and cuts overflowing cells with an ellipsis (<code>...</code>)</li>
				<li><code>dimensions.padding</code> - sets cell padding</li>
				<li><code>dimensions.widths</code> - sets an array of widths for each column</li>
			</ul>
			When using <code>features.autohide</code> it is important to set dimensions, so that each row is a consistent height.`,
		code: generate(`
			init: {
				keys: ['age', 'latitude', 'longitude', 'name', 'about'],
				index: '_id',
				data
			},
			dimensions: {
				row: 14,
				padding: 0,
				widths: [50,100,100,150]
			}`)
	},
	'Sortable': {
		meta: `
			Sortable headers can be initialised by setting <code>features.sortable.key</code> to an initial value and <code>features.sortable.direction</code> to <code>true (ascending)</code> or <code>false (descending)</code>.`,
		code: generate(`
			init: {
				keys: ['name', 'balance', 'company', 'latitude', 'longitude', 'tags'],
				index: '_id',
				data
			},
			features: {
				sortable: {
					key: 'name'
				}
			}`)
	},
	'Checkable': {
		meta: `
			Checkable rows are initialised by passing a blank <code>{}</code> object to <code>features.checkable</code>, which will be set via <code>init.index</code>.`,
		code: generate(`
			init: {
				keys,
				index: '_id',
				data
			},
			dimensions: {
				widths: [ 100 ]
			},
			features: {
				checkable: {}
			}`)
	},
	'Rearrangeable': {
		meta: `
			Rearrangeable rows are initialised by passing a callback function to <code>features.rearrangeable</code>, which will return the <em>from</em> and <em>to</em> indexes as an integer: <code>( from, to ) => ...</code>`,
		code: generate(`
			init: {
				keys: ['name', 'balance', 'company'],
				index: '_id',
				data
			},
			features: {
				rearrangeable: (from, to) => alert(\`from \${from} to \${to}\`)
			}`)
	},
	'Autohide (1)': {
		meta: `
			Autohide will stop rows that are currently not in view from rendering - increasing performance on tables with large datasets or images and video. It can be used inside a container, or with the window element - and must be manually triggered via <code>features.autohide.position</code>:
			<ul>
				<li><code>features.autohide.container</code> - sets the scrolling parent element and enables autohide</li>
				<li><code>features.autohide.position</code> - is the current scrollTop / scrollY position, and must be manually updated from your own <code>on:scroll</code> event</li>
				<li><code>features.autohide.buffer</code> - sets extra space before rows are hidden as a multiple of <code>container.offsetHeight</code> (ie. 0.5 * 400 = 200px buffer)</li>
			</ul>
			Example using <em>window</em> as container, with <code>buffer</code> set to <code>-0.1</code> (to illustrate hidden rows):`,
		code: generate(`
			init: {
				keys,
				index: '_id',
				data: many,
				nohead: true
			},
			dimensions: {
				row: 16
			},
			features: {
				autohide: {
					container: window,
					position: scrollY, // <svelte:window on:scroll={ e => scrollY = window.scrollY } />
					buffer: -0.1
				}
			}`)
	},
	'Autohide (2)': {
		meta: `
			Example using a <em>container</em>, see <a href="#autohide-1">Autohide (1)</a>:`,
		code: generate(`
			init: {
				keys,
				index: '_id',
				data: many,
				nohead: true
			},
			dimensions: {
				row: 16
			},
			features: {
				autohide: {
					container: container, // bind:this={ container }
					position: scrollY, // on:scroll={ e => scrollY = window.scrollY }
					buffer: 2
				}
			}`)
	},
	'Callbacks': {
		meta: `
			Callbacks can be defined for:
			<ul>
				<li><code>callbacks.render.cell</code> or <code>callbacks.render.key</code> - returning with <code>{id, item, key, value, index}</code> argument *</li>
				<li><code>callbacks.click.cell</code> or <code>callbacks.click.key</code> - returning with <code>{id, item, key, value, index, <em>event</em>}</code> argument</li>
			</ul>
			* Render callback can also be a component reference (see <a href="#components">Example 9 - Components</a>):`,
		code: generate(`
			init: {
				keys: ['name', 'balance', 'company', 'latitude', 'longitude'],
				index: '_id',
				data
			},
			callbacks: {
				render: {
					cell: o => ['🌱','☘️','🥬','🌿','🥒'][o.index] ,
					key: o => ['🌴','🌲','🌳','🏔','🥦'][o.index],
				},
				click: {
					cell: o => alert( ['🌴','🌲','🌳','🏔','🥦'][o.index] ) ,
					key: o => alert( ['🌱','☘️','🥬','🌿','🥒'][o.index] ),
				}
			}`)
	},
	'Components': {
		meta: `
			In place of a callback render function, a <code>svelte:component</code> can be used with the properties <code>{id, item, key, value, index}</code>:`,
		code: generate(`
			init: {
				keys: ['picture', 'name', 'latitude', 'longitude', 'registered', 'about'],
				index: '_id',
				data
			},
			callbacks: {
				render: {
					cell: Auto,
					key: Auto,
				}
			},`, true)
	}


}
