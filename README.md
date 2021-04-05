Svelte Tabular Table
====================

Fully-featured, no-BS, lightweight table component for Svelte.

    pnpm i svelte-tabular-table

*   [Live Examples](https://autr.github.io/svelte-tabular-table)
*   [Example 1 - Basic](#example-1---basic)
*   [Example 2 - Dimensions](#example-2---dimensions)
*   [Example 3 - Sortable](#example-3---sortable)
*   [Example 4 - Checkable](#example-4---checkable)
*   [Example 5 - Rearrangeable](#example-5---rearrangeable)
*   [Example 6 - Autohide (1)](#example-6---autohide-1)
*   [Example 7 - Autohide (2)](#example-7---autohide-2)
*   [Example 8 - Callbacks](#example-8---callbacks)
*   [Example 9 - Components](#example-9---components)
*   [API Documentation](#api-documentation)

### [Example 1 - Basic](https://autr.github.io/svelte-tabular-table#basic)

Basic configuration:

*   `init.data` - an array of objects comprising the rows
*   `init.keys` - an array of keys to define columns
*   `init.index` - the key used for indexing each row \*
*   `init.nohead` - a boolean to remove thead
*   `init.nodiv` - a boolean to render without div \*\*

\* If no valid `init.index` is set, or if there are duplicate values inside data, the table will attempt to generate unique keys.  
\*\* Enabling this means `dimensions` and `features.autohide` will not work.

    <script>
    import { Table } from 'svelte-tabular-table'
    const config = {
        init: {
            keys: ['name', 'balance', 'address', 'company'],
            index: '_id',
            data
        }
    }
    </script>
    <Table {...config} />

### [Example 2 - Dimensions](https://autr.github.io/svelte-tabular-table#dimensions)

Dimensions control the formatting of the table:

*   `dimensions.row` - sets row height and cuts overflowing cells with an ellipsis (`...`)
*   `dimensions.padding` - sets cell padding
*   `dimensions.widths` - sets an array of widths for each column

When using `features.autohide` it is important to set dimensions, so that each row is a consistent height.

    <script>
    import { Table } from 'svelte-tabular-table'
    const config = {
        init: {
            keys: ['age', 'latitude', 'longitude', 'name', 'about'],
            index: '_id',
            data
        },
        dimensions: {
            row: 14,
            padding: 0,
            widths: [50,100,100,150]
        }
    }
    </script>
    <Table {...config} />

### [Example 3 - Sortable](https://autr.github.io/svelte-tabular-table#sortable)

Sortable headers can be initialised by setting `features.sortable.key` to an initial value and `features.sortable.direction` to `true (ascending)` or `false (descending)`.

    <script>
    import { Table } from 'svelte-tabular-table'
    const config = {
        init: {
            keys: ['name', 'balance', 'company', 'latitude', 'longitude', 'tags'],
            index: '_id',
            data
        },
        features: {
            sortable: {
                key: 'name'
            }
        }
    }
    </script>
    <Table {...config} />

### [Example 4 - Checkable](https://autr.github.io/svelte-tabular-table#checkable)

Checkable rows are initialised by passing a blank `{}` object to `features.checkable`, which will be set via `init.index`.

    <script>
    import { Table } from 'svelte-tabular-table'
    const config = {
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
        }
    }
    </script>
    <Table {...config} />

### [Example 5 - Rearrangeable](https://autr.github.io/svelte-tabular-table#rearrangeable)

Rearrangeable rows are initialised by passing a callback function to `features.rearrangeable`, which will return the _from_ and _to_ indexes as an integer: `( from, to ) => ...`

    <script>
    import { Table } from 'svelte-tabular-table'
    const config = {
        init: {
            keys: ['name', 'balance', 'company'],
            index: '_id',
            data
        },
        features: {
            rearrangeable: (from, to) => alert(`from ${from} to ${to}`)
        }
    }
    </script>
    <Table {...config} />

### [Example 6 - Autohide (1)](https://autr.github.io/svelte-tabular-table#autohide-1)

Autohide will stop rows that are currently not in view from rendering - increasing performance on tables with large datasets or images and video. It can be used inside a container, or with the window element - and must be manually triggered via `features.autohide.position`:

*   `features.autohide.container` - sets the scrolling parent element and enables autohide
*   `features.autohide.position` - is the current scrollTop / scrollY position, and must be manually updated from your own `on:scroll` event
*   `features.autohide.buffer` - sets extra space before rows are hidden as a multiple of `container.offsetHeight` (ie. 0.5 \* 400 = 200px buffer)

Example using _window_ as container, with `buffer` set to `-0.1` (to illustrate hidden rows):

    <script>
    import { Table } from 'svelte-tabular-table'
    const config = {
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
        }
    }
    </script>
    <Table {...config} />

### [Example 7 - Autohide (2)](https://autr.github.io/svelte-tabular-table#autohide-2)

Example using a _container_, see [Autohide (1)](#autohide-1):

    <script>
    import { Table } from 'svelte-tabular-table'
    const config = {
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
        }
    }
    </script>
    <Table {...config} />

### [Example 8 - Callbacks](https://autr.github.io/svelte-tabular-table#callbacks)

Callbacks can be defined for:

*   `callbacks.render.cell` or `callbacks.render.key` - returning with `{id, item, key, value, index}` argument \*
*   `callbacks.click.cell` or `callbacks.click.key` - returning with `{id, item, key, value, index, _event_}` argument

\* Render callback can also be a component reference (see [Example 9 - Components](#components)):

    <script>
    import { Table } from 'svelte-tabular-table'
    const config = {
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
        }
    }
    </script>
    <Table {...config} />

### [Example 9 - Components](https://autr.github.io/svelte-tabular-table#components)

In place of a callback render function, a `svelte:component` can be used with the properties `{id, item, key, value, index}`:

    <script>
    import Auto from './Auto.svelte'
    import { Table } from 'svelte-tabular-table'
    const config = {
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
        },
    }
    </script>
    <Table {...config} />
    
    // --- Auto.svelte ---
    
    <script>
        export let id
        export let item
        export let key
        export let value
        export let index
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

API Documentation
=================

Properties are categorised:

*   `init` - for data and setup
*   `dimensions` - formatting sizes, widths, heights
*   `features` - sortable, checkable, rearrangeable, autohide
*   `callbacks` - cell rendering and events

    import { Table } from 'svelte-tabular-table'
    <Table {init} {dimensions} {features} {callbacks} {id} {class} {style} {debug} />

| Name | Description | Types | Default | Example |
| --- | --- | --- | --- | --- |
| init.data | list of rows | Array:Object | null | \[ { color: 'blue', id: '001' }, {color: 'red', id: '002' } \] |
| init.keys | list of columns | Array:String | null | \[ 'color', 'id' \] |
| init.index | unique index | String | null | id |
| init.nohide | dont render thead | Boolean | false | true |
| init.nodiv | dont render div | Boolean | false | true |
| dimensions.row | height of each row | Integer,String | null | 10, "2em" |
| dimensions.padding | padding of each row | Integer,String | 10 | 10, "1em" |
| dimensions.widths | width of each column | Array:Integer,Array:String | \[\] | \[ 100, "20%", "40px", 10\] |
| features.sortable.key | initial sorting key (enables sortable) | String | null | "color" |
| features.sortable.direction | ascending or descending | Boolean | false | true |
| features.checkable | blank object (enables checkable) | Object | null | {} |
| features.rearrangeable | callback (enables rearrangeable) | Function | null | (a,b) => alert(\`from ${a} to ${b}\`) |
| features.autohide.container | DOM element (enables autohide) | Element | null | bind:this={domElement},window |
| features.autohide.position | current scroll position (set externally) | Integer | 0 | on:scroll=>{setPosition} |
| features.autohide.buffer | extend area (multiple of container height) | Float | 0 | 2 |
| callbacks.render.key|cell | rendering callback or SvelteComponent | Function,SvelteComponent | o => o.value | o => 'hello world' |
| callbacks.click.key|cell | cell or key click callback | Function | null | o => alert(\`${o.id} clicked!\`) |
| id | id attribute of table | String |  | table-1 |
| class | class attribute of table | String |  | table |
| id | style attribute of table | String |  | background:red |
| debug | debugging console log | Boolean | false | true |