Svelte Tabular Table
====================

Fully-featured, no-BS, lightweight table component for Svelte.

    pnpm i svelte-tabular-table

*   [Live Examples 🔗](https://autr.github.io/svelte-tabular-table)
*   [Example 1 - Basic](#example-1---basic-)
*   [Example 2 - Dimensions](#example-2---dimensions-)
*   [Example 3 - Sortable](#example-3---sortable-)
*   [Example 4 - Checkable](#example-4---checkable-)
*   [Example 5 - Rearrangeable](#example-5---rearrangeable-)
*   [Example 6 - Autohide (1)](#example-6---autohide-1-)
*   [Example 7 - Autohide (2)](#example-7---autohide-2-)
*   [Example 8 - Callbacks](#example-8---callbacks-)
*   [Example 9 - Components](#example-9---components-)
*   [API Documentation](#api-documentation)

[Example 1 - Basic 🔗](https://autr.github.io/svelte-tabular-table#basic)
=========================================================================

Basic configuration:

*   `init.data` - an array of objects comprising the rows
*   `init.keys` - an array of keys to define columns
*   `init.index` - the key used for indexing each row \*
*   `init.nohead` - a boolean to remove thead
*   `init.nodiv` - a boolean to render without div \*\*

\* If no valid `init.index` is set, or if there are duplicate values inside data, the table will attempt to generate unique keys.  
\*\* Enabling this means `dimensions` and `features.autohide` will not work.

    const config = {
                init: {
        keys: ['name', 'balance', 'address', 'company'],
        index: '_id',
        data
                }
    }
    
    // ---
    
    <Table {...config} />

[Example 2 - Dimensions 🔗](https://autr.github.io/svelte-tabular-table#dimensions)
===================================================================================

Dimensions control the formatting of the table:

*   `dimensions.row` - sets row height and cuts overflowing cells with an ellipsis (`...`)
*   `dimensions.padding` - sets cell padding
*   `dimensions.widths` - sets an array of widths for each column

When using `features.autohide` it is important to set dimensions, so that each row is a consistent height.

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
    
    // ---
    
    <Table {...config} />

[Example 3 - Sortable 🔗](https://autr.github.io/svelte-tabular-table#sortable)
===============================================================================

Sortable headers can be initialised by setting `features.sortable.key` to an initial value and `features.sortable.direction` to `true (ascending)` or `false (descending)`.

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
    
    // ---
    
    <Table {...config} />

[Example 4 - Checkable 🔗](https://autr.github.io/svelte-tabular-table#checkable)
=================================================================================

Checkable rows are initialised by passing a blank `{}` object to `features.checkable`, which will be set via `init.index`.

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
    
    // ---
    
    <Table {...config} />

[Example 5 - Rearrangeable 🔗](https://autr.github.io/svelte-tabular-table#rearrangeable)
=========================================================================================

Rearrangeable rows are initialised by passing a callback function to `features.rearrangeable`, which will return the _from_ and _to_ indexes as an integer: `( from, to ) => ...`

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
    
    // ---
    
    <Table {...config} />

[Example 6 - Autohide (1) 🔗](https://autr.github.io/svelte-tabular-table#autohide-1)
=====================================================================================

Autohide will stop rows that are currently not in view from rendering - increasing performance on tables with large datasets or images and video. It can be used inside a container, or with the window element - and must be manually triggered via `features.autohide.position`:

*   `features.autohide.container` - sets the scrolling parent element and enables autohide
*   `features.autohide.position` - is the current scrollTop / scrollY position, and must be manually updated from your own `on:scroll` event
*   `features.autohide.buffer` - sets extra space before rows are hidden as a multiple of `container.offsetHeight` (ie. 0.5 \* 400 = 200px buffer)

Example using _window_ as container, with `buffer` set to `-0.1` (to illustrate hidden rows):

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
    
    // ---
    
    <Table {...config} />

[Example 7 - Autohide (2) 🔗](https://autr.github.io/svelte-tabular-table#autohide-2)
=====================================================================================

Example using a _container_, see [Autohide (1)](#autohide-1):

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
    
    // ---
    
    <Table {...config} />

[Example 8 - Callbacks 🔗](https://autr.github.io/svelte-tabular-table#callbacks)
=================================================================================

Callbacks can be defined for:

*   `callbacks.render.cell` or `callbacks.render.key` - returning with `{id, item, key, value, index}` argument \*
*   `callbacks.click.cell` or `callbacks.click.key` - returning with `{id, item, key, value, index, _event_}` argument

\* Render callback can also be a component reference (see [Example 9 - Components](#components)):

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
    
    // ---
    
    <Table {...config} />

[Example 9 - Components 🔗](https://autr.github.io/svelte-tabular-table#components)
===================================================================================

In place of a function, a `svelte:component` can be used with `callbacks.render`:

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
    
    // ---
    
    <Table {...config} />
    
    // ---
    
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

API Documentation
=================

| name | types | example | description |
| --- | --- | --- | --- |
| init.data | Array:Object | \[ { color: 'blue', id: '001' }, {color: 'red', id: '002' } \] | list of rows |
| init.keys | Array:String | \[ 'color', 'id' \] | list of columns |
| init.index | String | id | unique index |
| init.nohide | Boolean | true | dont render thead |
| dimensions.row | Integer,String | 10, "2em" | height of each row |
| dimensions.padding | Integer,String | 10, "1em" | padding of each row |
| dimensions.widths | Array:Integer,Array:String | \[ 100, "20%", "40px", 10\] | width of each column |
| features.sortable.key | String | "color" | initial sorting key (enables sortable) |
| features.sortable.direction | Boolean | true | ascending or descending |
| features.checkable | Object | {} | blank object (enables checkable) |
| features.rearrangeable | Function | (a,b) => alert(\`from ${a} to ${b}\`) | callback (enables rearrangeable) |
| features.autohide.container | Element | bind:this={domElement},window | DOM element (enables autohide) |
| features.autohide.position | Integer | on:scroll=>{setPosition} | current scroll position (set externally) |
| features.autohide.buffer | Float | 2 | extend area (multiple of container height) |
| callbacks.render.key|cell | Function,SvelteComponent | o => o.value + '!' | rendering callback or SvelteComponent |
| callbacks.click.key|cell | Function | o => alert(\`${o.id} clicked!\`) | cell or key click callback |
| id | String | my-table | #id property for Table |
| debug | Boolean | true | debugging console log |