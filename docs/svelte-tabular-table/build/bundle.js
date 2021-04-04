
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function extend (destination) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (source.hasOwnProperty(key)) destination[key] = source[key];
        }
      }
      return destination
    }

    function repeat (character, count) {
      return Array(count + 1).join(character)
    }

    var blockElements = [
      'ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS',
      'CENTER', 'DD', 'DIR', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE',
      'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
      'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES',
      'NOSCRIPT', 'OL', 'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD',
      'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
    ];

    function isBlock (node) {
      return is(node, blockElements)
    }

    var voidElements = [
      'AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT',
      'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
    ];

    function isVoid (node) {
      return is(node, voidElements)
    }

    function hasVoid (node) {
      return has(node, voidElements)
    }

    var meaningfulWhenBlankElements = [
      'A', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD', 'IFRAME', 'SCRIPT',
      'AUDIO', 'VIDEO'
    ];

    function isMeaningfulWhenBlank (node) {
      return is(node, meaningfulWhenBlankElements)
    }

    function hasMeaningfulWhenBlank (node) {
      return has(node, meaningfulWhenBlankElements)
    }

    function is (node, tagNames) {
      return tagNames.indexOf(node.nodeName) >= 0
    }

    function has (node, tagNames) {
      return (
        node.getElementsByTagName &&
        tagNames.some(function (tagName) {
          return node.getElementsByTagName(tagName).length
        })
      )
    }

    var rules$1 = {};

    rules$1.paragraph = {
      filter: 'p',

      replacement: function (content) {
        return '\n\n' + content + '\n\n'
      }
    };

    rules$1.lineBreak = {
      filter: 'br',

      replacement: function (content, node, options) {
        return options.br + '\n'
      }
    };

    rules$1.heading = {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

      replacement: function (content, node, options) {
        var hLevel = Number(node.nodeName.charAt(1));

        if (options.headingStyle === 'setext' && hLevel < 3) {
          var underline = repeat((hLevel === 1 ? '=' : '-'), content.length);
          return (
            '\n\n' + content + '\n' + underline + '\n\n'
          )
        } else {
          return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n'
        }
      }
    };

    rules$1.blockquote = {
      filter: 'blockquote',

      replacement: function (content) {
        content = content.replace(/^\n+|\n+$/g, '');
        content = content.replace(/^/gm, '> ');
        return '\n\n' + content + '\n\n'
      }
    };

    rules$1.list = {
      filter: ['ul', 'ol'],

      replacement: function (content, node) {
        var parent = node.parentNode;
        if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
          return '\n' + content
        } else {
          return '\n\n' + content + '\n\n'
        }
      }
    };

    rules$1.listItem = {
      filter: 'li',

      replacement: function (content, node, options) {
        content = content
          .replace(/^\n+/, '') // remove leading newlines
          .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
          .replace(/\n/gm, '\n    '); // indent
        var prefix = options.bulletListMarker + '   ';
        var parent = node.parentNode;
        if (parent.nodeName === 'OL') {
          var start = parent.getAttribute('start');
          var index = Array.prototype.indexOf.call(parent.children, node);
          prefix = (start ? Number(start) + index : index + 1) + '.  ';
        }
        return (
          prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
        )
      }
    };

    rules$1.indentedCodeBlock = {
      filter: function (node, options) {
        return (
          options.codeBlockStyle === 'indented' &&
          node.nodeName === 'PRE' &&
          node.firstChild &&
          node.firstChild.nodeName === 'CODE'
        )
      },

      replacement: function (content, node, options) {
        return (
          '\n\n    ' +
          node.firstChild.textContent.replace(/\n/g, '\n    ') +
          '\n\n'
        )
      }
    };

    rules$1.fencedCodeBlock = {
      filter: function (node, options) {
        return (
          options.codeBlockStyle === 'fenced' &&
          node.nodeName === 'PRE' &&
          node.firstChild &&
          node.firstChild.nodeName === 'CODE'
        )
      },

      replacement: function (content, node, options) {
        var className = node.firstChild.getAttribute('class') || '';
        var language = (className.match(/language-(\S+)/) || [null, ''])[1];
        var code = node.firstChild.textContent;

        var fenceChar = options.fence.charAt(0);
        var fenceSize = 3;
        var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');

        var match;
        while ((match = fenceInCodeRegex.exec(code))) {
          if (match[0].length >= fenceSize) {
            fenceSize = match[0].length + 1;
          }
        }

        var fence = repeat(fenceChar, fenceSize);

        return (
          '\n\n' + fence + language + '\n' +
          code.replace(/\n$/, '') +
          '\n' + fence + '\n\n'
        )
      }
    };

    rules$1.horizontalRule = {
      filter: 'hr',

      replacement: function (content, node, options) {
        return '\n\n' + options.hr + '\n\n'
      }
    };

    rules$1.inlineLink = {
      filter: function (node, options) {
        return (
          options.linkStyle === 'inlined' &&
          node.nodeName === 'A' &&
          node.getAttribute('href')
        )
      },

      replacement: function (content, node) {
        var href = node.getAttribute('href');
        var title = cleanAttribute(node.getAttribute('title'));
        if (title) title = ' "' + title + '"';
        return '[' + content + '](' + href + title + ')'
      }
    };

    rules$1.referenceLink = {
      filter: function (node, options) {
        return (
          options.linkStyle === 'referenced' &&
          node.nodeName === 'A' &&
          node.getAttribute('href')
        )
      },

      replacement: function (content, node, options) {
        var href = node.getAttribute('href');
        var title = cleanAttribute(node.getAttribute('title'));
        if (title) title = ' "' + title + '"';
        var replacement;
        var reference;

        switch (options.linkReferenceStyle) {
          case 'collapsed':
            replacement = '[' + content + '][]';
            reference = '[' + content + ']: ' + href + title;
            break
          case 'shortcut':
            replacement = '[' + content + ']';
            reference = '[' + content + ']: ' + href + title;
            break
          default:
            var id = this.references.length + 1;
            replacement = '[' + content + '][' + id + ']';
            reference = '[' + id + ']: ' + href + title;
        }

        this.references.push(reference);
        return replacement
      },

      references: [],

      append: function (options) {
        var references = '';
        if (this.references.length) {
          references = '\n\n' + this.references.join('\n') + '\n\n';
          this.references = []; // Reset references
        }
        return references
      }
    };

    rules$1.emphasis = {
      filter: ['em', 'i'],

      replacement: function (content, node, options) {
        if (!content.trim()) return ''
        return options.emDelimiter + content + options.emDelimiter
      }
    };

    rules$1.strong = {
      filter: ['strong', 'b'],

      replacement: function (content, node, options) {
        if (!content.trim()) return ''
        return options.strongDelimiter + content + options.strongDelimiter
      }
    };

    rules$1.code = {
      filter: function (node) {
        var hasSiblings = node.previousSibling || node.nextSibling;
        var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;

        return node.nodeName === 'CODE' && !isCodeBlock
      },

      replacement: function (content) {
        if (!content.trim()) return ''

        var delimiter = '`';
        var leadingSpace = '';
        var trailingSpace = '';
        var matches = content.match(/`+/gm);
        if (matches) {
          if (/^`/.test(content)) leadingSpace = ' ';
          if (/`$/.test(content)) trailingSpace = ' ';
          while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`';
        }

        return delimiter + leadingSpace + content + trailingSpace + delimiter
      }
    };

    rules$1.image = {
      filter: 'img',

      replacement: function (content, node) {
        var alt = cleanAttribute(node.getAttribute('alt'));
        var src = node.getAttribute('src') || '';
        var title = cleanAttribute(node.getAttribute('title'));
        var titlePart = title ? ' "' + title + '"' : '';
        return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
      }
    };

    function cleanAttribute (attribute) {
      return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : ''
    }

    /**
     * Manages a collection of rules used to convert HTML to Markdown
     */

    function Rules (options) {
      this.options = options;
      this._keep = [];
      this._remove = [];

      this.blankRule = {
        replacement: options.blankReplacement
      };

      this.keepReplacement = options.keepReplacement;

      this.defaultRule = {
        replacement: options.defaultReplacement
      };

      this.array = [];
      for (var key in options.rules) this.array.push(options.rules[key]);
    }

    Rules.prototype = {
      add: function (key, rule) {
        this.array.unshift(rule);
      },

      keep: function (filter) {
        this._keep.unshift({
          filter: filter,
          replacement: this.keepReplacement
        });
      },

      remove: function (filter) {
        this._remove.unshift({
          filter: filter,
          replacement: function () {
            return ''
          }
        });
      },

      forNode: function (node) {
        if (node.isBlank) return this.blankRule
        var rule;

        if ((rule = findRule(this.array, node, this.options))) return rule
        if ((rule = findRule(this._keep, node, this.options))) return rule
        if ((rule = findRule(this._remove, node, this.options))) return rule

        return this.defaultRule
      },

      forEach: function (fn) {
        for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
      }
    };

    function findRule (rules, node, options) {
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (filterValue(rule, node, options)) return rule
      }
      return void 0
    }

    function filterValue (rule, node, options) {
      var filter = rule.filter;
      if (typeof filter === 'string') {
        if (filter === node.nodeName.toLowerCase()) return true
      } else if (Array.isArray(filter)) {
        if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true
      } else if (typeof filter === 'function') {
        if (filter.call(rule, node, options)) return true
      } else {
        throw new TypeError('`filter` needs to be a string, array, or function')
      }
    }

    /**
     * The collapseWhitespace function is adapted from collapse-whitespace
     * by Luc Thevenard.
     *
     * The MIT License (MIT)
     *
     * Copyright (c) 2014 Luc Thevenard <lucthevenard@gmail.com>
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */

    /**
     * collapseWhitespace(options) removes extraneous whitespace from an the given element.
     *
     * @param {Object} options
     */
    function collapseWhitespace (options) {
      var element = options.element;
      var isBlock = options.isBlock;
      var isVoid = options.isVoid;
      var isPre = options.isPre || function (node) {
        return node.nodeName === 'PRE'
      };

      if (!element.firstChild || isPre(element)) return

      var prevText = null;
      var prevVoid = false;

      var prev = null;
      var node = next(prev, element, isPre);

      while (node !== element) {
        if (node.nodeType === 3 || node.nodeType === 4) { // Node.TEXT_NODE or Node.CDATA_SECTION_NODE
          var text = node.data.replace(/[ \r\n\t]+/g, ' ');

          if ((!prevText || / $/.test(prevText.data)) &&
              !prevVoid && text[0] === ' ') {
            text = text.substr(1);
          }

          // `text` might be empty at this point.
          if (!text) {
            node = remove(node);
            continue
          }

          node.data = text;

          prevText = node;
        } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
          if (isBlock(node) || node.nodeName === 'BR') {
            if (prevText) {
              prevText.data = prevText.data.replace(/ $/, '');
            }

            prevText = null;
            prevVoid = false;
          } else if (isVoid(node)) {
            // Avoid trimming space around non-block, non-BR void elements.
            prevText = null;
            prevVoid = true;
          }
        } else {
          node = remove(node);
          continue
        }

        var nextNode = next(prev, node, isPre);
        prev = node;
        node = nextNode;
      }

      if (prevText) {
        prevText.data = prevText.data.replace(/ $/, '');
        if (!prevText.data) {
          remove(prevText);
        }
      }
    }

    /**
     * remove(node) removes the given node from the DOM and returns the
     * next node in the sequence.
     *
     * @param {Node} node
     * @return {Node} node
     */
    function remove (node) {
      var next = node.nextSibling || node.parentNode;

      node.parentNode.removeChild(node);

      return next
    }

    /**
     * next(prev, current, isPre) returns the next node in the sequence, given the
     * current and previous nodes.
     *
     * @param {Node} prev
     * @param {Node} current
     * @param {Function} isPre
     * @return {Node}
     */
    function next (prev, current, isPre) {
      if ((prev && prev.parentNode === current) || isPre(current)) {
        return current.nextSibling || current.parentNode
      }

      return current.firstChild || current.nextSibling || current.parentNode
    }

    /*
     * Set up window for Node.js
     */

    var root = (typeof window !== 'undefined' ? window : {});

    /*
     * Parsing HTML strings
     */

    function canParseHTMLNatively () {
      var Parser = root.DOMParser;
      var canParse = false;

      // Adapted from https://gist.github.com/1129031
      // Firefox/Opera/IE throw errors on unsupported types
      try {
        // WebKit returns null on unsupported types
        if (new Parser().parseFromString('', 'text/html')) {
          canParse = true;
        }
      } catch (e) {}

      return canParse
    }

    function createHTMLParser () {
      var Parser = function () {};

      {
        var domino = require('domino');
        Parser.prototype.parseFromString = function (string) {
          return domino.createDocument(string)
        };
      }
      return Parser
    }

    var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();

    function RootNode (input) {
      var root;
      if (typeof input === 'string') {
        var doc = htmlParser().parseFromString(
          // DOM parsers arrange elements in the <head> and <body>.
          // Wrapping in a custom element ensures elements are reliably arranged in
          // a single element.
          '<x-turndown id="turndown-root">' + input + '</x-turndown>',
          'text/html'
        );
        root = doc.getElementById('turndown-root');
      } else {
        root = input.cloneNode(true);
      }
      collapseWhitespace({
        element: root,
        isBlock: isBlock,
        isVoid: isVoid
      });

      return root
    }

    var _htmlParser;
    function htmlParser () {
      _htmlParser = _htmlParser || new HTMLParser();
      return _htmlParser
    }

    function Node (node) {
      node.isBlock = isBlock(node);
      node.isCode = node.nodeName.toLowerCase() === 'code' || node.parentNode.isCode;
      node.isBlank = isBlank(node);
      node.flankingWhitespace = flankingWhitespace(node);
      return node
    }

    function isBlank (node) {
      return (
        !isVoid(node) &&
        !isMeaningfulWhenBlank(node) &&
        /^\s*$/i.test(node.textContent) &&
        !hasVoid(node) &&
        !hasMeaningfulWhenBlank(node)
      )
    }

    function flankingWhitespace (node) {
      var leading = '';
      var trailing = '';

      if (!node.isBlock) {
        var hasLeading = /^\s/.test(node.textContent);
        var hasTrailing = /\s$/.test(node.textContent);
        var blankWithSpaces = node.isBlank && hasLeading && hasTrailing;

        if (hasLeading && !isFlankedByWhitespace('left', node)) {
          leading = ' ';
        }

        if (!blankWithSpaces && hasTrailing && !isFlankedByWhitespace('right', node)) {
          trailing = ' ';
        }
      }

      return { leading: leading, trailing: trailing }
    }

    function isFlankedByWhitespace (side, node) {
      var sibling;
      var regExp;
      var isFlanked;

      if (side === 'left') {
        sibling = node.previousSibling;
        regExp = / $/;
      } else {
        sibling = node.nextSibling;
        regExp = /^ /;
      }

      if (sibling) {
        if (sibling.nodeType === 3) {
          isFlanked = regExp.test(sibling.nodeValue);
        } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
          isFlanked = regExp.test(sibling.textContent);
        }
      }
      return isFlanked
    }

    var reduce = Array.prototype.reduce;
    var leadingNewLinesRegExp = /^\n*/;
    var trailingNewLinesRegExp = /\n*$/;
    var escapes = [
      [/\\/g, '\\\\'],
      [/\*/g, '\\*'],
      [/^-/g, '\\-'],
      [/^\+ /g, '\\+ '],
      [/^(=+)/g, '\\$1'],
      [/^(#{1,6}) /g, '\\$1 '],
      [/`/g, '\\`'],
      [/^~~~/g, '\\~~~'],
      [/\[/g, '\\['],
      [/\]/g, '\\]'],
      [/^>/g, '\\>'],
      [/_/g, '\\_'],
      [/^(\d+)\. /g, '$1\\. ']
    ];

    function TurndownService (options) {
      if (!(this instanceof TurndownService)) return new TurndownService(options)

      var defaults = {
        rules: rules$1,
        headingStyle: 'setext',
        hr: '* * *',
        bulletListMarker: '*',
        codeBlockStyle: 'indented',
        fence: '```',
        emDelimiter: '_',
        strongDelimiter: '**',
        linkStyle: 'inlined',
        linkReferenceStyle: 'full',
        br: '  ',
        blankReplacement: function (content, node) {
          return node.isBlock ? '\n\n' : ''
        },
        keepReplacement: function (content, node) {
          return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML
        },
        defaultReplacement: function (content, node) {
          return node.isBlock ? '\n\n' + content + '\n\n' : content
        }
      };
      this.options = extend({}, defaults, options);
      this.rules = new Rules(this.options);
    }

    TurndownService.prototype = {
      /**
       * The entry point for converting a string or DOM node to Markdown
       * @public
       * @param {String|HTMLElement} input The string or DOM node to convert
       * @returns A Markdown representation of the input
       * @type String
       */

      turndown: function (input) {
        if (!canConvert(input)) {
          throw new TypeError(
            input + ' is not a string, or an element/document/fragment node.'
          )
        }

        if (input === '') return ''

        var output = process.call(this, new RootNode(input));
        return postProcess.call(this, output)
      },

      /**
       * Add one or more plugins
       * @public
       * @param {Function|Array} plugin The plugin or array of plugins to add
       * @returns The Turndown instance for chaining
       * @type Object
       */

      use: function (plugin) {
        if (Array.isArray(plugin)) {
          for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
        } else if (typeof plugin === 'function') {
          plugin(this);
        } else {
          throw new TypeError('plugin must be a Function or an Array of Functions')
        }
        return this
      },

      /**
       * Adds a rule
       * @public
       * @param {String} key The unique key of the rule
       * @param {Object} rule The rule
       * @returns The Turndown instance for chaining
       * @type Object
       */

      addRule: function (key, rule) {
        this.rules.add(key, rule);
        return this
      },

      /**
       * Keep a node (as HTML) that matches the filter
       * @public
       * @param {String|Array|Function} filter The unique key of the rule
       * @returns The Turndown instance for chaining
       * @type Object
       */

      keep: function (filter) {
        this.rules.keep(filter);
        return this
      },

      /**
       * Remove a node that matches the filter
       * @public
       * @param {String|Array|Function} filter The unique key of the rule
       * @returns The Turndown instance for chaining
       * @type Object
       */

      remove: function (filter) {
        this.rules.remove(filter);
        return this
      },

      /**
       * Escapes Markdown syntax
       * @public
       * @param {String} string The string to escape
       * @returns A string with Markdown syntax escaped
       * @type String
       */

      escape: function (string) {
        return escapes.reduce(function (accumulator, escape) {
          return accumulator.replace(escape[0], escape[1])
        }, string)
      }
    };

    /**
     * Reduces a DOM node down to its Markdown string equivalent
     * @private
     * @param {HTMLElement} parentNode The node to convert
     * @returns A Markdown representation of the node
     * @type String
     */

    function process (parentNode) {
      var self = this;
      return reduce.call(parentNode.childNodes, function (output, node) {
        node = new Node(node);

        var replacement = '';
        if (node.nodeType === 3) {
          replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
        } else if (node.nodeType === 1) {
          replacement = replacementForNode.call(self, node);
        }

        return join(output, replacement)
      }, '')
    }

    /**
     * Appends strings as each rule requires and trims the output
     * @private
     * @param {String} output The conversion output
     * @returns A trimmed version of the ouput
     * @type String
     */

    function postProcess (output) {
      var self = this;
      this.rules.forEach(function (rule) {
        if (typeof rule.append === 'function') {
          output = join(output, rule.append(self.options));
        }
      });

      return output.replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '')
    }

    /**
     * Converts an element node to its Markdown equivalent
     * @private
     * @param {HTMLElement} node The node to convert
     * @returns A Markdown representation of the node
     * @type String
     */

    function replacementForNode (node) {
      var rule = this.rules.forNode(node);
      var content = process.call(this, node);
      var whitespace = node.flankingWhitespace;
      if (whitespace.leading || whitespace.trailing) content = content.trim();
      return (
        whitespace.leading +
        rule.replacement(content, node, this.options) +
        whitespace.trailing
      )
    }

    /**
     * Determines the new lines between the current output and the replacement
     * @private
     * @param {String} output The current conversion output
     * @param {String} replacement The string to append to the output
     * @returns The whitespace to separate the current output and the replacement
     * @type String
     */

    function separatingNewlines (output, replacement) {
      var newlines = [
        output.match(trailingNewLinesRegExp)[0],
        replacement.match(leadingNewLinesRegExp)[0]
      ].sort();
      var maxNewlines = newlines[newlines.length - 1];
      return maxNewlines.length < 2 ? maxNewlines : '\n\n'
    }

    function join (string1, string2) {
      var separator = separatingNewlines(string1, string2);

      // Remove trailing/leading newlines and replace with separator
      string1 = string1.replace(trailingNewLinesRegExp, '');
      string2 = string2.replace(leadingNewLinesRegExp, '');

      return string1 + separator + string2
    }

    /**
     * Determines whether an input can be converted
     * @private
     * @param {String|HTMLElement} input Describe this parameter
     * @returns Describe what it returns
     * @type String|Object|Array|Boolean|Number
     */

    function canConvert (input) {
      return (
        input != null && (
          typeof input === 'string' ||
          (input.nodeType && (
            input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11
          ))
        )
      )
    }

    var indexOf = Array.prototype.indexOf;
    var every = Array.prototype.every;
    var rules = {};

    rules.tableCell = {
      filter: ['th', 'td'],
      replacement: function (content, node) {
        return cell(content, node)
      }
    };

    rules.tableRow = {
      filter: 'tr',
      replacement: function (content, node) {
        var borderCells = '';
        var alignMap = { left: ':--', right: '--:', center: ':-:' };

        if (isHeadingRow(node)) {
          for (var i = 0; i < node.childNodes.length; i++) {
            var border = '---';
            var align = (
              node.childNodes[i].getAttribute('align') || ''
            ).toLowerCase();

            if (align) border = alignMap[align] || border;

            borderCells += cell(border, node.childNodes[i]);
          }
        }
        return '\n' + content + (borderCells ? '\n' + borderCells : '')
      }
    };

    rules.table = {
      // Only convert tables with a heading row.
      // Tables with no heading row are kept using `keep` (see below).
      filter: function (node) {
        return node.nodeName === 'TABLE' && isHeadingRow(node.rows[0])
      },

      replacement: function (content) {
        // Ensure there are no blank lines
        content = content.replace('\n\n', '\n');
        return '\n\n' + content + '\n\n'
      }
    };

    rules.tableSection = {
      filter: ['thead', 'tbody', 'tfoot'],
      replacement: function (content) {
        return content
      }
    };

    // A tr is a heading row if:
    // - the parent is a THEAD
    // - or if its the first child of the TABLE or the first TBODY (possibly
    //   following a blank THEAD)
    // - and every cell is a TH
    function isHeadingRow (tr) {
      var parentNode = tr.parentNode;
      return (
        parentNode.nodeName === 'THEAD' ||
        (
          parentNode.firstChild === tr &&
          (parentNode.nodeName === 'TABLE' || isFirstTbody(parentNode)) &&
          every.call(tr.childNodes, function (n) { return n.nodeName === 'TH' })
        )
      )
    }

    function isFirstTbody (element) {
      var previousSibling = element.previousSibling;
      return (
        element.nodeName === 'TBODY' && (
          !previousSibling ||
          (
            previousSibling.nodeName === 'THEAD' &&
            /^\s*$/i.test(previousSibling.textContent)
          )
        )
      )
    }

    function cell (content, node) {
      var index = indexOf.call(node.parentNode.childNodes, node);
      var prefix = ' ';
      if (index === 0) prefix = '| ';
      return prefix + content + ' |'
    }

    function tables (turndownService) {
      turndownService.keep(function (node) {
        return node.nodeName === 'TABLE' && !isHeadingRow(node.rows[0])
      });
      for (var key in rules) turndownService.addRule(key, rules[key]);
    }

    function log( msg ) {
    	console.log( `[svelte-tabular-table] ${msg}`);
    }

    const defaults = {
    	hover: o => log(`${o.id} "${o.key}" -> hovered`),
    	click: o => log(`${o.id} "${o.key}" -> clicked`),
    	render: o => o.value,
    	checked: o => log(`${o.id} -> ${o.event.target.checked ? 'checked' : 'unchecked'}`),
    	sort: (conf, data, meta) => {
    		data.sort( (a,b) => {
    			let aa = a[conf.key] || '';
    			let bb = b[conf.key] || '';
    			if ( typeof(aa) == 'string' ) aa = aa.toLowerCase();
    			if ( typeof(bb) == 'string' ) bb = bb.toLowerCase();
    			return +(aa > bb) || +(aa === bb) - 1
    		});
    		if ( conf.direction ) data = data.reverse();
    		return data
    	},
    	dimensions: {
    		row: null,
    		padding: 10,
    		widths: [],
    		columns: [],
    		sticky: false
    	}
    };
    const slugify = text => text.toString().toLowerCase()
    	.replaceAll(' ', '-')           // Replace spaces with -
    	.replace(/[^\w\-]+/g, '');       // Remove all non-word chars

    /* ../src/Td.svelte generated by Svelte v3.37.0 */
    const file$4 = "../src/Td.svelte";

    // (79:1) {:else}
    function create_else_block_1$1(ctx) {
    	let div;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block_2$3, create_else_block_2$1];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (dirty & /*renderFunc*/ 128) show_if = !!(Object.getOwnPropertyNames(/*renderFunc*/ ctx[7]).indexOf("prototype") != -1);
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const default_slot_template = /*#slots*/ ctx[25].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[24], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div, "style", /*style*/ ctx[4]);
    			add_location(div, file$4, 79, 2, 2053);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, t);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16777216) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[24], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 16) {
    				attr_dev(div, "style", /*style*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(79:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (73:1) {#if init.nodiv}
    function create_if_block$4(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$3, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (dirty & /*renderFunc*/ 128) show_if = !!(Object.getOwnPropertyNames(/*renderFunc*/ ctx[7]).indexOf("prototype") != -1);
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(73:1) {#if init.nodiv}",
    		ctx
    	});

    	return block;
    }

    // (84:3) {:else}
    function create_else_block_2$1(ctx) {
    	let html_tag;
    	let raw_value = (/*renderFunc*/ ctx[7](/*obj*/ ctx[6]) || "") + /*_refresh*/ ctx[3] + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*renderFunc, obj, _refresh*/ 200 && raw_value !== (raw_value = (/*renderFunc*/ ctx[7](/*obj*/ ctx[6]) || "") + /*_refresh*/ ctx[3] + "")) html_tag.p(raw_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2$1.name,
    		type: "else",
    		source: "(84:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:3) {#if Object.getOwnPropertyNames(renderFunc).indexOf('prototype') != -1}
    function create_if_block_2$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*obj*/ ctx[6]];
    	var switch_value = /*renderFunc*/ ctx[7];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*obj*/ 64)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*obj*/ ctx[6])])
    			: {};

    			if (switch_value !== (switch_value = /*renderFunc*/ ctx[7])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(82:3) {#if Object.getOwnPropertyNames(renderFunc).indexOf('prototype') != -1}",
    		ctx
    	});

    	return block;
    }

    // (76:2) {:else}
    function create_else_block$3(ctx) {
    	let html_tag;
    	let raw_value = (/*renderFunc*/ ctx[7](/*obj*/ ctx[6]) || "") + /*_refresh*/ ctx[3] + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*renderFunc, obj, _refresh*/ 200 && raw_value !== (raw_value = (/*renderFunc*/ ctx[7](/*obj*/ ctx[6]) || "") + /*_refresh*/ ctx[3] + "")) html_tag.p(raw_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(76:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:2) {#if Object.getOwnPropertyNames(renderFunc).indexOf('prototype') != -1}
    function create_if_block_1$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*obj*/ ctx[6]];
    	var switch_value = /*renderFunc*/ ctx[7];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*obj*/ 64)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*obj*/ ctx[6])])
    			: {};

    			if (switch_value !== (switch_value = /*renderFunc*/ ctx[7])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(74:2) {#if Object.getOwnPropertyNames(renderFunc).indexOf('prototype') != -1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let td;
    	let current_block_type_index;
    	let if_block;
    	let td_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$4, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*init*/ ctx[0].nodiv) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			td = element("td");
    			if_block.c();
    			attr_dev(td, "style", /*tdStyle*/ ctx[5]);
    			attr_dev(td, "colspan", /*colspan*/ ctx[2]);
    			attr_dev(td, "class", td_class_value = "stt-" + slugify(/*key*/ ctx[1]));
    			attr_dev(td, "data-key", /*key*/ ctx[1]);
    			toggle_class(td, "stt-sorted", /*same*/ ctx[9]);
    			toggle_class(td, "stt-ascending", /*same*/ ctx[9] && /*direction*/ ctx[8]);
    			toggle_class(td, "stt-descending", /*same*/ ctx[9] && !/*direction*/ ctx[8]);
    			add_location(td, file$4, 64, 0, 1599);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			if_blocks[current_block_type_index].m(td, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(td, "click", /*click_handler*/ ctx[26], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(td, null);
    			}

    			if (!current || dirty & /*tdStyle*/ 32) {
    				attr_dev(td, "style", /*tdStyle*/ ctx[5]);
    			}

    			if (!current || dirty & /*colspan*/ 4) {
    				attr_dev(td, "colspan", /*colspan*/ ctx[2]);
    			}

    			if (!current || dirty & /*key*/ 2 && td_class_value !== (td_class_value = "stt-" + slugify(/*key*/ ctx[1]))) {
    				attr_dev(td, "class", td_class_value);
    			}

    			if (!current || dirty & /*key*/ 2) {
    				attr_dev(td, "data-key", /*key*/ ctx[1]);
    			}

    			if (dirty & /*key, same*/ 514) {
    				toggle_class(td, "stt-sorted", /*same*/ ctx[9]);
    			}

    			if (dirty & /*key, same, direction*/ 770) {
    				toggle_class(td, "stt-ascending", /*same*/ ctx[9] && /*direction*/ ctx[8]);
    			}

    			if (dirty & /*key, same, direction*/ 770) {
    				toggle_class(td, "stt-descending", /*same*/ ctx[9] && !/*direction*/ ctx[8]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let width;
    	let _refresh;
    	let _style;
    	let style;
    	let tdStyle;
    	let hasSlot;
    	let obj;
    	let cbs;
    	let renderFunc;
    	let clickFunc;
    	let sorting;
    	let direction;
    	let same;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Td", slots, ['default']);
    	let { init } = $$props;
    	let { dimensions } = $$props;
    	let { debug } = $$props;
    	let { callbacks } = $$props;
    	let { features } = $$props;
    	let { misc } = $$props;
    	let { id } = $$props;
    	let { item } = $$props;
    	let { key } = $$props;
    	let { index } = $$props;
    	let { type } = $$props;
    	let { colspan = 1 } = $$props;

    	function onClick(obj, e) {
    		clickFunc({ ...obj, event: e });
    		const exists = init.keys.indexOf(key) != -1;

    		if (type == "key" && exists && sorting) {
    			misc.reorder({ id, item, key, e });
    		}
    	}

    	const click_handler = e => onClick(obj, e);

    	$$self.$$set = $$new_props => {
    		$$invalidate(29, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("init" in $$new_props) $$invalidate(0, init = $$new_props.init);
    		if ("dimensions" in $$new_props) $$invalidate(11, dimensions = $$new_props.dimensions);
    		if ("debug" in $$new_props) $$invalidate(12, debug = $$new_props.debug);
    		if ("callbacks" in $$new_props) $$invalidate(13, callbacks = $$new_props.callbacks);
    		if ("features" in $$new_props) $$invalidate(14, features = $$new_props.features);
    		if ("misc" in $$new_props) $$invalidate(15, misc = $$new_props.misc);
    		if ("id" in $$new_props) $$invalidate(16, id = $$new_props.id);
    		if ("item" in $$new_props) $$invalidate(17, item = $$new_props.item);
    		if ("key" in $$new_props) $$invalidate(1, key = $$new_props.key);
    		if ("index" in $$new_props) $$invalidate(18, index = $$new_props.index);
    		if ("type" in $$new_props) $$invalidate(19, type = $$new_props.type);
    		if ("colspan" in $$new_props) $$invalidate(2, colspan = $$new_props.colspan);
    		if ("$$scope" in $$new_props) $$invalidate(24, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		defaults,
    		slugify,
    		init,
    		dimensions,
    		debug,
    		callbacks,
    		features,
    		misc,
    		id,
    		item,
    		key,
    		index,
    		type,
    		colspan,
    		onClick,
    		width,
    		_refresh,
    		_style,
    		style,
    		tdStyle,
    		sorting,
    		hasSlot,
    		obj,
    		cbs,
    		renderFunc,
    		clickFunc,
    		direction,
    		same
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(29, $$props = assign(assign({}, $$props), $$new_props));
    		if ("init" in $$props) $$invalidate(0, init = $$new_props.init);
    		if ("dimensions" in $$props) $$invalidate(11, dimensions = $$new_props.dimensions);
    		if ("debug" in $$props) $$invalidate(12, debug = $$new_props.debug);
    		if ("callbacks" in $$props) $$invalidate(13, callbacks = $$new_props.callbacks);
    		if ("features" in $$props) $$invalidate(14, features = $$new_props.features);
    		if ("misc" in $$props) $$invalidate(15, misc = $$new_props.misc);
    		if ("id" in $$props) $$invalidate(16, id = $$new_props.id);
    		if ("item" in $$props) $$invalidate(17, item = $$new_props.item);
    		if ("key" in $$props) $$invalidate(1, key = $$new_props.key);
    		if ("index" in $$props) $$invalidate(18, index = $$new_props.index);
    		if ("type" in $$props) $$invalidate(19, type = $$new_props.type);
    		if ("colspan" in $$props) $$invalidate(2, colspan = $$new_props.colspan);
    		if ("width" in $$props) $$invalidate(20, width = $$new_props.width);
    		if ("_refresh" in $$props) $$invalidate(3, _refresh = $$new_props._refresh);
    		if ("_style" in $$props) $$invalidate(21, _style = $$new_props._style);
    		if ("style" in $$props) $$invalidate(4, style = $$new_props.style);
    		if ("tdStyle" in $$props) $$invalidate(5, tdStyle = $$new_props.tdStyle);
    		if ("sorting" in $$props) $$invalidate(22, sorting = $$new_props.sorting);
    		if ("hasSlot" in $$props) hasSlot = $$new_props.hasSlot;
    		if ("obj" in $$props) $$invalidate(6, obj = $$new_props.obj);
    		if ("cbs" in $$props) $$invalidate(23, cbs = $$new_props.cbs);
    		if ("renderFunc" in $$props) $$invalidate(7, renderFunc = $$new_props.renderFunc);
    		if ("clickFunc" in $$props) clickFunc = $$new_props.clickFunc;
    		if ("direction" in $$props) $$invalidate(8, direction = $$new_props.direction);
    		if ("same" in $$props) $$invalidate(9, same = $$new_props.same);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*index, dimensions*/ 264192) {
    			$$invalidate(20, width = index == -1 ? "100%" : (dimensions.widths || [])[index]);
    		}

    		if ($$self.$$.dirty & /*misc*/ 32768) {
    			$$invalidate(3, _refresh = misc.refresh ? " " : "");
    		}

    		if ($$self.$$.dirty & /*dimensions, features*/ 18432) {
    			$$invalidate(21, _style = e => {
    				let s = "overflow-wrap:break-word;";
    				const whitespace = "white-space: nowrap;overflow:hidden;text-overflow: ellipsis;";
    				const em = (dimensions.row || defaults.dimensions.row) + "px;";
    				s += "padding:" + (dimensions.padding || defaults.dimensions.padding) + "px;";

    				s += features.autohide || dimensions.row
    				? whitespace + "height:" + em + "line-height:" + em
    				: "";

    				return s;
    			});
    		}

    		if ($$self.$$.dirty & /*_style*/ 2097152) {
    			$$invalidate(4, style = _style());
    		}

    		if ($$self.$$.dirty & /*features*/ 16384) {
    			$$invalidate(22, sorting = features?.sortable?.key);
    		}

    		if ($$self.$$.dirty & /*sorting, type, width*/ 5767168) {
    			$$invalidate(5, tdStyle = `
		vertical-align:middle;
		margin:0;
		padding:0;
		position:relative;
		${sorting && type == "key" ? "cursor:pointer" : ""}
		${width
			? `width:${isNaN(width) ? width : width + "px"};`
			: ""}`);
    		}

    		hasSlot = $$props.$$slots;

    		if ($$self.$$.dirty & /*id, item, key, index, type*/ 983042) {
    			$$invalidate(6, obj = {
    				id,
    				item,
    				key,
    				value: item[key],
    				index,
    				type
    			});
    		}

    		if ($$self.$$.dirty & /*callbacks*/ 8192) {
    			$$invalidate(23, cbs = callbacks || {});
    		}

    		if ($$self.$$.dirty & /*cbs, type*/ 8912896) {
    			$$invalidate(7, renderFunc = (cbs.render || {})[type] || defaults.render);
    		}

    		if ($$self.$$.dirty & /*cbs, type*/ 8912896) {
    			clickFunc = (cbs.click || {})[type] || defaults.click;
    		}

    		if ($$self.$$.dirty & /*features*/ 16384) {
    			$$invalidate(8, direction = features?.sortable?.direction);
    		}

    		if ($$self.$$.dirty & /*sorting, key*/ 4194306) {
    			$$invalidate(9, same = sorting == key);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		init,
    		key,
    		colspan,
    		_refresh,
    		style,
    		tdStyle,
    		obj,
    		renderFunc,
    		direction,
    		same,
    		onClick,
    		dimensions,
    		debug,
    		callbacks,
    		features,
    		misc,
    		id,
    		item,
    		index,
    		type,
    		width,
    		_style,
    		sorting,
    		cbs,
    		$$scope,
    		slots,
    		click_handler
    	];
    }

    class Td extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			init: 0,
    			dimensions: 11,
    			debug: 12,
    			callbacks: 13,
    			features: 14,
    			misc: 15,
    			id: 16,
    			item: 17,
    			key: 1,
    			index: 18,
    			type: 19,
    			colspan: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Td",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*init*/ ctx[0] === undefined && !("init" in props)) {
    			console.warn("<Td> was created without expected prop 'init'");
    		}

    		if (/*dimensions*/ ctx[11] === undefined && !("dimensions" in props)) {
    			console.warn("<Td> was created without expected prop 'dimensions'");
    		}

    		if (/*debug*/ ctx[12] === undefined && !("debug" in props)) {
    			console.warn("<Td> was created without expected prop 'debug'");
    		}

    		if (/*callbacks*/ ctx[13] === undefined && !("callbacks" in props)) {
    			console.warn("<Td> was created without expected prop 'callbacks'");
    		}

    		if (/*features*/ ctx[14] === undefined && !("features" in props)) {
    			console.warn("<Td> was created without expected prop 'features'");
    		}

    		if (/*misc*/ ctx[15] === undefined && !("misc" in props)) {
    			console.warn("<Td> was created without expected prop 'misc'");
    		}

    		if (/*id*/ ctx[16] === undefined && !("id" in props)) {
    			console.warn("<Td> was created without expected prop 'id'");
    		}

    		if (/*item*/ ctx[17] === undefined && !("item" in props)) {
    			console.warn("<Td> was created without expected prop 'item'");
    		}

    		if (/*key*/ ctx[1] === undefined && !("key" in props)) {
    			console.warn("<Td> was created without expected prop 'key'");
    		}

    		if (/*index*/ ctx[18] === undefined && !("index" in props)) {
    			console.warn("<Td> was created without expected prop 'index'");
    		}

    		if (/*type*/ ctx[19] === undefined && !("type" in props)) {
    			console.warn("<Td> was created without expected prop 'type'");
    		}
    	}

    	get init() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set init(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dimensions() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dimensions(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get debug() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set debug(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callbacks() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callbacks(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get features() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set features(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get misc() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set misc(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colspan() {
    		throw new Error("<Td>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colspan(value) {
    		throw new Error("<Td>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../src/Tr.svelte generated by Svelte v3.37.0 */
    const file$3 = "../src/Tr.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    // (70:0) {:else}
    function create_else_block$2(ctx) {
    	let tr;
    	let t0;
    	let t1;
    	let tr_class_value;
    	let tr_data_key_value;
    	let current;
    	let if_block0 = /*features*/ ctx[0].checkable && create_if_block_3$2(ctx);
    	let if_block1 = /*features*/ ctx[0].rearrangeable && create_if_block_1$2(ctx);
    	let each_value = /*keys*/ ctx[9];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(tr, "class", tr_class_value = "stt-" + slugify(/*id*/ ctx[10]));
    			attr_dev(tr, "data-key", tr_data_key_value = slugify(/*id*/ ctx[10]));
    			attr_dev(tr, "style", /*style*/ ctx[15]);
    			add_location(tr, file$3, 70, 1, 1545);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			if (if_block0) if_block0.m(tr, null);
    			append_dev(tr, t0);
    			if (if_block1) if_block1.m(tr, null);
    			append_dev(tr, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			/*tr_binding_1*/ ctx[20](tr);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*features*/ ctx[0].checkable) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*features*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(tr, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*features*/ ctx[0].rearrangeable) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*features*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(tr, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*init, dimensions, debug, callbacks, features, misc, id, item, keys, type, offset*/ 3839) {
    				each_value = /*keys*/ ctx[9];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tr, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*id*/ 1024 && tr_class_value !== (tr_class_value = "stt-" + slugify(/*id*/ ctx[10]))) {
    				attr_dev(tr, "class", tr_class_value);
    			}

    			if (!current || dirty & /*id*/ 1024 && tr_data_key_value !== (tr_data_key_value = slugify(/*id*/ ctx[10]))) {
    				attr_dev(tr, "data-key", tr_data_key_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
    			/*tr_binding_1*/ ctx[20](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(70:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (56:0) {#if misc.hidden[ id ]}
    function create_if_block$3(ctx) {
    	let tr;
    	let td;
    	let tr_class_value;
    	let tr_data_key_value;
    	let current;

    	td = new Td({
    			props: {
    				init: /*init*/ ctx[2],
    				dimensions: /*dimensions*/ ctx[3],
    				debug: /*debug*/ ctx[4],
    				callbacks: /*callbacks*/ ctx[5],
    				features: /*features*/ ctx[0],
    				misc: /*misc*/ ctx[1],
    				id: /*id*/ ctx[10],
    				item: /*item*/ ctx[6],
    				type: /*type*/ ctx[7],
    				colspan: /*colspan*/ ctx[12],
    				index: -1,
    				key: "stt-hidden-cell",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			create_component(td.$$.fragment);
    			attr_dev(tr, "class", tr_class_value = "stt-" + slugify(/*id*/ ctx[10]));
    			attr_dev(tr, "data-key", tr_data_key_value = slugify(/*id*/ ctx[10]));
    			attr_dev(tr, "style", /*style*/ ctx[15]);
    			toggle_class(tr, "stt-hidden", true);
    			add_location(tr, file$3, 57, 1, 1201);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			mount_component(td, tr, null);
    			/*tr_binding*/ ctx[17](tr);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const td_changes = {};
    			if (dirty & /*init*/ 4) td_changes.init = /*init*/ ctx[2];
    			if (dirty & /*dimensions*/ 8) td_changes.dimensions = /*dimensions*/ ctx[3];
    			if (dirty & /*debug*/ 16) td_changes.debug = /*debug*/ ctx[4];
    			if (dirty & /*callbacks*/ 32) td_changes.callbacks = /*callbacks*/ ctx[5];
    			if (dirty & /*features*/ 1) td_changes.features = /*features*/ ctx[0];
    			if (dirty & /*misc*/ 2) td_changes.misc = /*misc*/ ctx[1];
    			if (dirty & /*id*/ 1024) td_changes.id = /*id*/ ctx[10];
    			if (dirty & /*item*/ 64) td_changes.item = /*item*/ ctx[6];
    			if (dirty & /*type*/ 128) td_changes.type = /*type*/ ctx[7];
    			if (dirty & /*colspan*/ 4096) td_changes.colspan = /*colspan*/ ctx[12];

    			if (dirty & /*$$scope, dimensions*/ 33554440) {
    				td_changes.$$scope = { dirty, ctx };
    			}

    			td.$set(td_changes);

    			if (!current || dirty & /*id*/ 1024 && tr_class_value !== (tr_class_value = "stt-" + slugify(/*id*/ ctx[10]))) {
    				attr_dev(tr, "class", tr_class_value);
    			}

    			if (!current || dirty & /*id*/ 1024 && tr_data_key_value !== (tr_data_key_value = slugify(/*id*/ ctx[10]))) {
    				attr_dev(tr, "data-key", tr_data_key_value);
    			}

    			if (dirty & /*id*/ 1024) {
    				toggle_class(tr, "stt-hidden", true);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(td.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(td.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(td);
    			/*tr_binding*/ ctx[17](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(56:0) {#if misc.hidden[ id ]}",
    		ctx
    	});

    	return block;
    }

    // (76:2) {#if features.checkable}
    function create_if_block_3$2(ctx) {
    	let td;
    	let current;

    	td = new Td({
    			props: {
    				init: /*init*/ ctx[2],
    				dimensions: /*dimensions*/ ctx[3],
    				debug: /*debug*/ ctx[4],
    				callbacks: /*callbacks*/ ctx[5],
    				features: /*features*/ ctx[0],
    				misc: /*misc*/ ctx[1],
    				id: /*id*/ ctx[10],
    				item: /*item*/ ctx[6],
    				type: /*type*/ ctx[7],
    				index: 0,
    				key: "stt-checkable-cell",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(td.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(td, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const td_changes = {};
    			if (dirty & /*init*/ 4) td_changes.init = /*init*/ ctx[2];
    			if (dirty & /*dimensions*/ 8) td_changes.dimensions = /*dimensions*/ ctx[3];
    			if (dirty & /*debug*/ 16) td_changes.debug = /*debug*/ ctx[4];
    			if (dirty & /*callbacks*/ 32) td_changes.callbacks = /*callbacks*/ ctx[5];
    			if (dirty & /*features*/ 1) td_changes.features = /*features*/ ctx[0];
    			if (dirty & /*misc*/ 2) td_changes.misc = /*misc*/ ctx[1];
    			if (dirty & /*id*/ 1024) td_changes.id = /*id*/ ctx[10];
    			if (dirty & /*item*/ 64) td_changes.item = /*item*/ ctx[6];
    			if (dirty & /*type*/ 128) td_changes.type = /*type*/ ctx[7];

    			if (dirty & /*$$scope, indeterminate, features, id*/ 33555713) {
    				td_changes.$$scope = { dirty, ctx };
    			}

    			td.$set(td_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(td.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(td.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(td, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(76:2) {#if features.checkable}",
    		ctx
    	});

    	return block;
    }

    // (77:3) <Td {init} {dimensions} {debug} {callbacks} {features} {misc} {id} {item} {type}      index={ 0 }     key={'stt-checkable-cell'}>
    function create_default_slot_2(ctx) {
    	let label;
    	let input;
    	let t;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = space();
    			span = element("span");
    			attr_dev(input, "type", "checkbox");
    			input.indeterminate = /*indeterminate*/ ctx[8];
    			add_location(input, file$3, 81, 5, 1850);
    			add_location(span, file$3, 85, 5, 1983);
    			attr_dev(label, "style", /*special*/ ctx[14]);
    			add_location(label, file$3, 79, 4, 1815);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*features*/ ctx[0].checkable[/*id*/ ctx[10]];
    			append_dev(label, t);
    			append_dev(label, span);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[18]),
    					listen_dev(input, "change", /*onChecked*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*indeterminate*/ 256) {
    				prop_dev(input, "indeterminate", /*indeterminate*/ ctx[8]);
    			}

    			if (dirty & /*features, id*/ 1025) {
    				input.checked = /*features*/ ctx[0].checkable[/*id*/ ctx[10]];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(77:3) <Td {init} {dimensions} {debug} {callbacks} {features} {misc} {id} {item} {type}      index={ 0 }     key={'stt-checkable-cell'}>",
    		ctx
    	});

    	return block;
    }

    // (91:2) {#if features.rearrangeable}
    function create_if_block_1$2(ctx) {
    	let td;
    	let current;

    	td = new Td({
    			props: {
    				init: /*init*/ ctx[2],
    				dimensions: /*dimensions*/ ctx[3],
    				debug: /*debug*/ ctx[4],
    				callbacks: /*callbacks*/ ctx[5],
    				features: /*features*/ ctx[0],
    				misc: /*misc*/ ctx[1],
    				id: /*id*/ ctx[10],
    				item: /*item*/ ctx[6],
    				type: /*type*/ ctx[7],
    				index: /*offset*/ ctx[11] - 1,
    				key: "stt-rearrangeable-cell",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(td.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(td, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const td_changes = {};
    			if (dirty & /*init*/ 4) td_changes.init = /*init*/ ctx[2];
    			if (dirty & /*dimensions*/ 8) td_changes.dimensions = /*dimensions*/ ctx[3];
    			if (dirty & /*debug*/ 16) td_changes.debug = /*debug*/ ctx[4];
    			if (dirty & /*callbacks*/ 32) td_changes.callbacks = /*callbacks*/ ctx[5];
    			if (dirty & /*features*/ 1) td_changes.features = /*features*/ ctx[0];
    			if (dirty & /*misc*/ 2) td_changes.misc = /*misc*/ ctx[1];
    			if (dirty & /*id*/ 1024) td_changes.id = /*id*/ ctx[10];
    			if (dirty & /*item*/ 64) td_changes.item = /*item*/ ctx[6];
    			if (dirty & /*type*/ 128) td_changes.type = /*type*/ ctx[7];
    			if (dirty & /*offset*/ 2048) td_changes.index = /*offset*/ ctx[11] - 1;

    			if (dirty & /*$$scope, misc, id, type*/ 33555586) {
    				td_changes.$$scope = { dirty, ctx };
    			}

    			td.$set(td_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(td.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(td.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(td, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(91:2) {#if features.rearrangeable}",
    		ctx
    	});

    	return block;
    }

    // (95:4) {#if type != 'key'}
    function create_if_block_2$2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("|||");
    			attr_dev(div, "style", /*special*/ ctx[14]);
    			add_location(div, file$3, 95, 5, 2228);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			/*div_binding*/ ctx[19](div);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[19](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(95:4) {#if type != 'key'}",
    		ctx
    	});

    	return block;
    }

    // (92:3) <Td {init} {dimensions} {debug} {callbacks} {features} {misc} {id} {item} {type}     index={ offset - 1 }     key={'stt-rearrangeable-cell'}>
    function create_default_slot_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*type*/ ctx[7] != "key" && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*type*/ ctx[7] != "key") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(92:3) <Td {init} {dimensions} {debug} {callbacks} {features} {misc} {id} {item} {type}     index={ offset - 1 }     key={'stt-rearrangeable-cell'}>",
    		ctx
    	});

    	return block;
    }

    // (101:2) {#each keys as key, idx}
    function create_each_block$2(ctx) {
    	let td;
    	let current;

    	td = new Td({
    			props: {
    				init: /*init*/ ctx[2],
    				dimensions: /*dimensions*/ ctx[3],
    				debug: /*debug*/ ctx[4],
    				callbacks: /*callbacks*/ ctx[5],
    				features: /*features*/ ctx[0],
    				misc: /*misc*/ ctx[1],
    				id: /*id*/ ctx[10],
    				item: /*item*/ ctx[6],
    				key: /*key*/ ctx[22],
    				type: /*type*/ ctx[7],
    				index: /*offset*/ ctx[11] + /*idx*/ ctx[24]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(td.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(td, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const td_changes = {};
    			if (dirty & /*init*/ 4) td_changes.init = /*init*/ ctx[2];
    			if (dirty & /*dimensions*/ 8) td_changes.dimensions = /*dimensions*/ ctx[3];
    			if (dirty & /*debug*/ 16) td_changes.debug = /*debug*/ ctx[4];
    			if (dirty & /*callbacks*/ 32) td_changes.callbacks = /*callbacks*/ ctx[5];
    			if (dirty & /*features*/ 1) td_changes.features = /*features*/ ctx[0];
    			if (dirty & /*misc*/ 2) td_changes.misc = /*misc*/ ctx[1];
    			if (dirty & /*id*/ 1024) td_changes.id = /*id*/ ctx[10];
    			if (dirty & /*item*/ 64) td_changes.item = /*item*/ ctx[6];
    			if (dirty & /*keys*/ 512) td_changes.key = /*key*/ ctx[22];
    			if (dirty & /*type*/ 128) td_changes.type = /*type*/ ctx[7];
    			if (dirty & /*offset*/ 2048) td_changes.index = /*offset*/ ctx[11] + /*idx*/ ctx[24];
    			td.$set(td_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(td.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(td.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(td, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(101:2) {#each keys as key, idx}",
    		ctx
    	});

    	return block;
    }

    // (63:2) <Td {init} {dimensions} {debug} {callbacks} {features} {misc} {id} {item} {type} {colspan}    index={ -1 }    key={'stt-hidden-cell'}>
    function create_default_slot(ctx) {
    	let div;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "style", div_style_value = `height: ${/*dimensions*/ ctx[3].row}px`);
    			add_location(div, file$3, 65, 3, 1474);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dimensions*/ 8 && div_style_value !== (div_style_value = `height: ${/*dimensions*/ ctx[3].row}px`)) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(63:2) <Td {init} {dimensions} {debug} {callbacks} {features} {misc} {id} {item} {type} {colspan}    index={ -1 }    key={'stt-hidden-cell'}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*misc*/ ctx[1].hidden[/*id*/ ctx[10]]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let id;
    	let total;
    	let offset;
    	let colspan;
    	let keys;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tr", slots, []);
    	let { init } = $$props;
    	let { dimensions } = $$props;
    	let { debug } = $$props;
    	let { callbacks } = $$props;
    	let { features } = $$props;
    	let { misc } = $$props;
    	let { item } = $$props;
    	let { type } = $$props; // ie. cell or thead
    	let { indeterminate = false } = $$props;

    	function onChecked(event) {
    		if (type == "key") {
    			for (let i = 0; i < init.data.length; i++) {
    				const id = init.data[i][init.index];
    				$$invalidate(0, features.checkable[id] = event.target.checked, features);
    			}
    		} else {
    			(callbacks?.checked || defaults.checked)({ item, id, event });
    			$$invalidate(0, features.checkable[id] = event.target.checked, features);
    		}
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
		padding: ${dimensions.padding || defaults.dimensions.padding}px;
		align-items:center;`;

    	const _total = e => init.keys.length + (features.checkable ? 1 : 0) + (features.rearrangeable ? 1 : 0);
    	let style = "";

    	const writable_props = [
    		"init",
    		"dimensions",
    		"debug",
    		"callbacks",
    		"features",
    		"misc",
    		"item",
    		"type",
    		"indeterminate"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tr> was created with unknown prop '${key}'`);
    	});

    	function tr_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			misc.els.tr[id] = $$value;
    			$$invalidate(1, misc);
    			(($$invalidate(10, id), $$invalidate(6, item)), $$invalidate(2, init));
    		});
    	}

    	function input_change_handler() {
    		features.checkable[id] = this.checked;
    		$$invalidate(0, features);
    		(($$invalidate(10, id), $$invalidate(6, item)), $$invalidate(2, init));
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			misc.els.handles[id] = $$value;
    			$$invalidate(1, misc);
    			(($$invalidate(10, id), $$invalidate(6, item)), $$invalidate(2, init));
    		});
    	}

    	function tr_binding_1($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			misc.els.tr[id] = $$value;
    			$$invalidate(1, misc);
    			(($$invalidate(10, id), $$invalidate(6, item)), $$invalidate(2, init));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("init" in $$props) $$invalidate(2, init = $$props.init);
    		if ("dimensions" in $$props) $$invalidate(3, dimensions = $$props.dimensions);
    		if ("debug" in $$props) $$invalidate(4, debug = $$props.debug);
    		if ("callbacks" in $$props) $$invalidate(5, callbacks = $$props.callbacks);
    		if ("features" in $$props) $$invalidate(0, features = $$props.features);
    		if ("misc" in $$props) $$invalidate(1, misc = $$props.misc);
    		if ("item" in $$props) $$invalidate(6, item = $$props.item);
    		if ("type" in $$props) $$invalidate(7, type = $$props.type);
    		if ("indeterminate" in $$props) $$invalidate(8, indeterminate = $$props.indeterminate);
    	};

    	$$self.$capture_state = () => ({
    		Td,
    		defaults,
    		slugify,
    		init,
    		dimensions,
    		debug,
    		callbacks,
    		features,
    		misc,
    		item,
    		type,
    		indeterminate,
    		onChecked,
    		special,
    		_total,
    		style,
    		id,
    		total,
    		offset,
    		keys,
    		colspan
    	});

    	$$self.$inject_state = $$props => {
    		if ("init" in $$props) $$invalidate(2, init = $$props.init);
    		if ("dimensions" in $$props) $$invalidate(3, dimensions = $$props.dimensions);
    		if ("debug" in $$props) $$invalidate(4, debug = $$props.debug);
    		if ("callbacks" in $$props) $$invalidate(5, callbacks = $$props.callbacks);
    		if ("features" in $$props) $$invalidate(0, features = $$props.features);
    		if ("misc" in $$props) $$invalidate(1, misc = $$props.misc);
    		if ("item" in $$props) $$invalidate(6, item = $$props.item);
    		if ("type" in $$props) $$invalidate(7, type = $$props.type);
    		if ("indeterminate" in $$props) $$invalidate(8, indeterminate = $$props.indeterminate);
    		if ("style" in $$props) $$invalidate(15, style = $$props.style);
    		if ("id" in $$props) $$invalidate(10, id = $$props.id);
    		if ("total" in $$props) $$invalidate(16, total = $$props.total);
    		if ("offset" in $$props) $$invalidate(11, offset = $$props.offset);
    		if ("keys" in $$props) $$invalidate(9, keys = $$props.keys);
    		if ("colspan" in $$props) $$invalidate(12, colspan = $$props.colspan);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*item, init*/ 68) {
    			$$invalidate(10, id = item[init?.index] || init.data.indexOf(item));
    		}

    		if ($$self.$$.dirty & /*init*/ 4) {
    			$$invalidate(9, keys = init.keys || []);
    		}

    		if ($$self.$$.dirty & /*total, keys*/ 66048) {
    			$$invalidate(11, offset = total - keys.length);
    		}

    		if ($$self.$$.dirty & /*total*/ 65536) {
    			$$invalidate(12, colspan = total);
    		}
    	};

    	$$invalidate(16, total = _total());

    	return [
    		features,
    		misc,
    		init,
    		dimensions,
    		debug,
    		callbacks,
    		item,
    		type,
    		indeterminate,
    		keys,
    		id,
    		offset,
    		colspan,
    		onChecked,
    		special,
    		style,
    		total,
    		tr_binding,
    		input_change_handler,
    		div_binding,
    		tr_binding_1
    	];
    }

    class Tr extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			init: 2,
    			dimensions: 3,
    			debug: 4,
    			callbacks: 5,
    			features: 0,
    			misc: 1,
    			item: 6,
    			type: 7,
    			indeterminate: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tr",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*init*/ ctx[2] === undefined && !("init" in props)) {
    			console.warn("<Tr> was created without expected prop 'init'");
    		}

    		if (/*dimensions*/ ctx[3] === undefined && !("dimensions" in props)) {
    			console.warn("<Tr> was created without expected prop 'dimensions'");
    		}

    		if (/*debug*/ ctx[4] === undefined && !("debug" in props)) {
    			console.warn("<Tr> was created without expected prop 'debug'");
    		}

    		if (/*callbacks*/ ctx[5] === undefined && !("callbacks" in props)) {
    			console.warn("<Tr> was created without expected prop 'callbacks'");
    		}

    		if (/*features*/ ctx[0] === undefined && !("features" in props)) {
    			console.warn("<Tr> was created without expected prop 'features'");
    		}

    		if (/*misc*/ ctx[1] === undefined && !("misc" in props)) {
    			console.warn("<Tr> was created without expected prop 'misc'");
    		}

    		if (/*item*/ ctx[6] === undefined && !("item" in props)) {
    			console.warn("<Tr> was created without expected prop 'item'");
    		}

    		if (/*type*/ ctx[7] === undefined && !("type" in props)) {
    			console.warn("<Tr> was created without expected prop 'type'");
    		}
    	}

    	get init() {
    		throw new Error("<Tr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set init(value) {
    		throw new Error("<Tr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dimensions() {
    		throw new Error("<Tr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dimensions(value) {
    		throw new Error("<Tr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get debug() {
    		throw new Error("<Tr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set debug(value) {
    		throw new Error("<Tr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callbacks() {
    		throw new Error("<Tr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callbacks(value) {
    		throw new Error("<Tr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get features() {
    		throw new Error("<Tr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set features(value) {
    		throw new Error("<Tr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get misc() {
    		throw new Error("<Tr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set misc(value) {
    		throw new Error("<Tr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		throw new Error("<Tr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Tr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Tr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Tr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indeterminate() {
    		throw new Error("<Tr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indeterminate(value) {
    		throw new Error("<Tr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var strictUriEncode = str => encodeURIComponent(str).replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

    var token = '%[a-f0-9]{2}';
    var singleMatcher = new RegExp(token, 'gi');
    var multiMatcher = new RegExp('(' + token + ')+', 'gi');

    function decodeComponents(components, split) {
    	try {
    		// Try to decode the entire string first
    		return decodeURIComponent(components.join(''));
    	} catch (err) {
    		// Do nothing
    	}

    	if (components.length === 1) {
    		return components;
    	}

    	split = split || 1;

    	// Split the array in 2 parts
    	var left = components.slice(0, split);
    	var right = components.slice(split);

    	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
    }

    function decode(input) {
    	try {
    		return decodeURIComponent(input);
    	} catch (err) {
    		var tokens = input.match(singleMatcher);

    		for (var i = 1; i < tokens.length; i++) {
    			input = decodeComponents(tokens, i).join('');

    			tokens = input.match(singleMatcher);
    		}

    		return input;
    	}
    }

    function customDecodeURIComponent(input) {
    	// Keep track of all the replacements and prefill the map with the `BOM`
    	var replaceMap = {
    		'%FE%FF': '\uFFFD\uFFFD',
    		'%FF%FE': '\uFFFD\uFFFD'
    	};

    	var match = multiMatcher.exec(input);
    	while (match) {
    		try {
    			// Decode as big chunks as possible
    			replaceMap[match[0]] = decodeURIComponent(match[0]);
    		} catch (err) {
    			var result = decode(match[0]);

    			if (result !== match[0]) {
    				replaceMap[match[0]] = result;
    			}
    		}

    		match = multiMatcher.exec(input);
    	}

    	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
    	replaceMap['%C2'] = '\uFFFD';

    	var entries = Object.keys(replaceMap);

    	for (var i = 0; i < entries.length; i++) {
    		// Replace all decoded components
    		var key = entries[i];
    		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
    	}

    	return input;
    }

    var decodeUriComponent = function (encodedURI) {
    	if (typeof encodedURI !== 'string') {
    		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
    	}

    	try {
    		encodedURI = encodedURI.replace(/\+/g, ' ');

    		// Try the built in decoder first
    		return decodeURIComponent(encodedURI);
    	} catch (err) {
    		// Fallback to a more advanced decoder
    		return customDecodeURIComponent(encodedURI);
    	}
    };

    var splitOnFirst = (string, separator) => {
    	if (!(typeof string === 'string' && typeof separator === 'string')) {
    		throw new TypeError('Expected the arguments to be of type `string`');
    	}

    	if (separator === '') {
    		return [string];
    	}

    	const separatorIndex = string.indexOf(separator);

    	if (separatorIndex === -1) {
    		return [string];
    	}

    	return [
    		string.slice(0, separatorIndex),
    		string.slice(separatorIndex + separator.length)
    	];
    };

    var filterObj = function (obj, predicate) {
    	var ret = {};
    	var keys = Object.keys(obj);
    	var isArr = Array.isArray(predicate);

    	for (var i = 0; i < keys.length; i++) {
    		var key = keys[i];
    		var val = obj[key];

    		if (isArr ? predicate.indexOf(key) !== -1 : predicate(key, val, obj)) {
    			ret[key] = val;
    		}
    	}

    	return ret;
    };

    var queryString = createCommonjsModule(function (module, exports) {





    const isNullOrUndefined = value => value === null || value === undefined;

    function encoderForArrayFormat(options) {
    	switch (options.arrayFormat) {
    		case 'index':
    			return key => (result, value) => {
    				const index = result.length;

    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				if (value === null) {
    					return [...result, [encode(key, options), '[', index, ']'].join('')];
    				}

    				return [
    					...result,
    					[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')
    				];
    			};

    		case 'bracket':
    			return key => (result, value) => {
    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				if (value === null) {
    					return [...result, [encode(key, options), '[]'].join('')];
    				}

    				return [...result, [encode(key, options), '[]=', encode(value, options)].join('')];
    			};

    		case 'comma':
    		case 'separator':
    		case 'bracket-separator': {
    			const keyValueSep = options.arrayFormat === 'bracket-separator' ?
    				'[]=' :
    				'=';

    			return key => (result, value) => {
    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				// Translate null to an empty string so that it doesn't serialize as 'null'
    				value = value === null ? '' : value;

    				if (result.length === 0) {
    					return [[encode(key, options), keyValueSep, encode(value, options)].join('')];
    				}

    				return [[result, encode(value, options)].join(options.arrayFormatSeparator)];
    			};
    		}

    		default:
    			return key => (result, value) => {
    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				if (value === null) {
    					return [...result, encode(key, options)];
    				}

    				return [...result, [encode(key, options), '=', encode(value, options)].join('')];
    			};
    	}
    }

    function parserForArrayFormat(options) {
    	let result;

    	switch (options.arrayFormat) {
    		case 'index':
    			return (key, value, accumulator) => {
    				result = /\[(\d*)\]$/.exec(key);

    				key = key.replace(/\[\d*\]$/, '');

    				if (!result) {
    					accumulator[key] = value;
    					return;
    				}

    				if (accumulator[key] === undefined) {
    					accumulator[key] = {};
    				}

    				accumulator[key][result[1]] = value;
    			};

    		case 'bracket':
    			return (key, value, accumulator) => {
    				result = /(\[\])$/.exec(key);
    				key = key.replace(/\[\]$/, '');

    				if (!result) {
    					accumulator[key] = value;
    					return;
    				}

    				if (accumulator[key] === undefined) {
    					accumulator[key] = [value];
    					return;
    				}

    				accumulator[key] = [].concat(accumulator[key], value);
    			};

    		case 'comma':
    		case 'separator':
    			return (key, value, accumulator) => {
    				const isArray = typeof value === 'string' && value.includes(options.arrayFormatSeparator);
    				const isEncodedArray = (typeof value === 'string' && !isArray && decode(value, options).includes(options.arrayFormatSeparator));
    				value = isEncodedArray ? decode(value, options) : value;
    				const newValue = isArray || isEncodedArray ? value.split(options.arrayFormatSeparator).map(item => decode(item, options)) : value === null ? value : decode(value, options);
    				accumulator[key] = newValue;
    			};

    		case 'bracket-separator':
    			return (key, value, accumulator) => {
    				const isArray = /(\[\])$/.test(key);
    				key = key.replace(/\[\]$/, '');

    				if (!isArray) {
    					accumulator[key] = value ? decode(value, options) : value;
    					return;
    				}

    				const arrayValue = value === null ?
    					[] :
    					value.split(options.arrayFormatSeparator).map(item => decode(item, options));

    				if (accumulator[key] === undefined) {
    					accumulator[key] = arrayValue;
    					return;
    				}

    				accumulator[key] = [].concat(accumulator[key], arrayValue);
    			};

    		default:
    			return (key, value, accumulator) => {
    				if (accumulator[key] === undefined) {
    					accumulator[key] = value;
    					return;
    				}

    				accumulator[key] = [].concat(accumulator[key], value);
    			};
    	}
    }

    function validateArrayFormatSeparator(value) {
    	if (typeof value !== 'string' || value.length !== 1) {
    		throw new TypeError('arrayFormatSeparator must be single character string');
    	}
    }

    function encode(value, options) {
    	if (options.encode) {
    		return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
    	}

    	return value;
    }

    function decode(value, options) {
    	if (options.decode) {
    		return decodeUriComponent(value);
    	}

    	return value;
    }

    function keysSorter(input) {
    	if (Array.isArray(input)) {
    		return input.sort();
    	}

    	if (typeof input === 'object') {
    		return keysSorter(Object.keys(input))
    			.sort((a, b) => Number(a) - Number(b))
    			.map(key => input[key]);
    	}

    	return input;
    }

    function removeHash(input) {
    	const hashStart = input.indexOf('#');
    	if (hashStart !== -1) {
    		input = input.slice(0, hashStart);
    	}

    	return input;
    }

    function getHash(url) {
    	let hash = '';
    	const hashStart = url.indexOf('#');
    	if (hashStart !== -1) {
    		hash = url.slice(hashStart);
    	}

    	return hash;
    }

    function extract(input) {
    	input = removeHash(input);
    	const queryStart = input.indexOf('?');
    	if (queryStart === -1) {
    		return '';
    	}

    	return input.slice(queryStart + 1);
    }

    function parseValue(value, options) {
    	if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
    		value = Number(value);
    	} else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
    		value = value.toLowerCase() === 'true';
    	}

    	return value;
    }

    function parse(query, options) {
    	options = Object.assign({
    		decode: true,
    		sort: true,
    		arrayFormat: 'none',
    		arrayFormatSeparator: ',',
    		parseNumbers: false,
    		parseBooleans: false
    	}, options);

    	validateArrayFormatSeparator(options.arrayFormatSeparator);

    	const formatter = parserForArrayFormat(options);

    	// Create an object with no prototype
    	const ret = Object.create(null);

    	if (typeof query !== 'string') {
    		return ret;
    	}

    	query = query.trim().replace(/^[?#&]/, '');

    	if (!query) {
    		return ret;
    	}

    	for (const param of query.split('&')) {
    		if (param === '') {
    			continue;
    		}

    		let [key, value] = splitOnFirst(options.decode ? param.replace(/\+/g, ' ') : param, '=');

    		// Missing `=` should be `null`:
    		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    		value = value === undefined ? null : ['comma', 'separator', 'bracket-separator'].includes(options.arrayFormat) ? value : decode(value, options);
    		formatter(decode(key, options), value, ret);
    	}

    	for (const key of Object.keys(ret)) {
    		const value = ret[key];
    		if (typeof value === 'object' && value !== null) {
    			for (const k of Object.keys(value)) {
    				value[k] = parseValue(value[k], options);
    			}
    		} else {
    			ret[key] = parseValue(value, options);
    		}
    	}

    	if (options.sort === false) {
    		return ret;
    	}

    	return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce((result, key) => {
    		const value = ret[key];
    		if (Boolean(value) && typeof value === 'object' && !Array.isArray(value)) {
    			// Sort object keys, not values
    			result[key] = keysSorter(value);
    		} else {
    			result[key] = value;
    		}

    		return result;
    	}, Object.create(null));
    }

    exports.extract = extract;
    exports.parse = parse;

    exports.stringify = (object, options) => {
    	if (!object) {
    		return '';
    	}

    	options = Object.assign({
    		encode: true,
    		strict: true,
    		arrayFormat: 'none',
    		arrayFormatSeparator: ','
    	}, options);

    	validateArrayFormatSeparator(options.arrayFormatSeparator);

    	const shouldFilter = key => (
    		(options.skipNull && isNullOrUndefined(object[key])) ||
    		(options.skipEmptyString && object[key] === '')
    	);

    	const formatter = encoderForArrayFormat(options);

    	const objectCopy = {};

    	for (const key of Object.keys(object)) {
    		if (!shouldFilter(key)) {
    			objectCopy[key] = object[key];
    		}
    	}

    	const keys = Object.keys(objectCopy);

    	if (options.sort !== false) {
    		keys.sort(options.sort);
    	}

    	return keys.map(key => {
    		const value = object[key];

    		if (value === undefined) {
    			return '';
    		}

    		if (value === null) {
    			return encode(key, options);
    		}

    		if (Array.isArray(value)) {
    			if (value.length === 0 && options.arrayFormat === 'bracket-separator') {
    				return encode(key, options) + '[]';
    			}

    			return value
    				.reduce(formatter(key), [])
    				.join('&');
    		}

    		return encode(key, options) + '=' + encode(value, options);
    	}).filter(x => x.length > 0).join('&');
    };

    exports.parseUrl = (url, options) => {
    	options = Object.assign({
    		decode: true
    	}, options);

    	const [url_, hash] = splitOnFirst(url, '#');

    	return Object.assign(
    		{
    			url: url_.split('?')[0] || '',
    			query: parse(extract(url), options)
    		},
    		options && options.parseFragmentIdentifier && hash ? {fragmentIdentifier: decode(hash, options)} : {}
    	);
    };

    exports.stringifyUrl = (object, options) => {
    	options = Object.assign({
    		encode: true,
    		strict: true
    	}, options);

    	const url = removeHash(object.url).split('?')[0] || '';
    	const queryFromUrl = exports.extract(object.url);
    	const parsedQueryFromUrl = exports.parse(queryFromUrl, {sort: false});

    	const query = Object.assign(parsedQueryFromUrl, object.query);
    	let queryString = exports.stringify(query, options);
    	if (queryString) {
    		queryString = `?${queryString}`;
    	}

    	let hash = getHash(object.url);
    	if (object.fragmentIdentifier) {
    		hash = `#${encode(object.fragmentIdentifier, options)}`;
    	}

    	return `${url}${queryString}${hash}`;
    };

    exports.pick = (input, filter, options) => {
    	options = Object.assign({
    		parseFragmentIdentifier: true
    	}, options);

    	const {url, query, fragmentIdentifier} = exports.parseUrl(input, options);
    	return exports.stringifyUrl({
    		url,
    		query: filterObj(query, filter),
    		fragmentIdentifier
    	}, options);
    };

    exports.exclude = (input, filter, options) => {
    	const exclusionFilter = Array.isArray(filter) ? key => !filter.includes(key) : (key, value) => !filter(key, value);

    	return exports.pick(input, exclusionFilter, options);
    };
    });

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function dragdrop() {

    	const { subscribe, set, update } = writable({});

    	function findAncestor (el, attr) {
    	    while ((el = el.parentElement) && !el.getAttribute( attr ));
    	    return el;
    	}
    	function check( group ) {
    		update( d => {
    			if (!d[group]) d[group] = { handles: new Map(), drops: [], source: null, destination: null, callbacks: new Map(), dragging: false };
    			return d
    		});
    	}
    	const reject = e => {
    		// console.warn('[draggable] no group id provided')
    	};

    	const dropHandlers = {
    		dragover: (e) => {
    			const el = findAncestor(e.target, 'data-group');
    			const group = el.getAttribute('data-group');
    			if (!group) return reject()
    			e.preventDefault();
    			let cb;
    			update( d => {
    				cb = d[group].callbacks.get( el );
    				d[group].destination = el; 
    				return d 
    			});
    			if (cb?.dragover) cb.dragover(e);
    		},
    		dragleave: (e) => {
    			const el = findAncestor(e.target, 'data-group');
    			const group = el.getAttribute('data-group');
    			if (!group) return reject()
    			e.preventDefault();
    			let cb;
    			update( d => { 
    				cb = d[group].callbacks.get( el );
    				d[group].destination = null; 
    				return d 
    			});
    			if (cb?.dragleave) cb.dragleave(e);
    		},
    		drop: (e, t) => {
    			const el = findAncestor(e.target, 'data-group');
    			const group = el.getAttribute('data-group');
    			if (!group) return reject()
    			e.preventDefault();
    			let cb;
    			update( d => { 
    				cb = d[group].callbacks.get( el );
    				if (cb?.drop) cb.drop( { 
    					...e, 
    					source: d[group].source, 
    					destination: d[group].destination 
    				});
    				d[group].destination = null; 
    				return d;
    			});
    		}
    	};
    	
    	function addDropArea( group, drop, callbacks ) {
    		if (!group) return reject()
    		check( group );
    		drop.setAttribute('data-group', group);
    		update( d => {
    			d[group].callbacks.set( drop, callbacks );
    			d[group].drops.push( drop );
    			return d 
    		});
    		for (const [type, method] of Object.entries(dropHandlers)) drop.addEventListener( type, method );
    	}
    	
    	const disable = (e) => {
    		const group = e.target.getAttribute('data-group');
    		if (!group) return reject()
    		update( d => {
    			d[group].dragging = false;
    			d[group].source = e.target;
    			return d 
    		});
    		e.target.setAttribute('draggable', false);
    	};

    	const enable = (e) => {
    		const group = e.target.getAttribute('data-group');
    		if (!group) return reject()
    		let element;
    		update( d => { 
    			d[group].dragging = true;
    			element = d[group].handles.get( e.target );
    			d[group].source = element;
    			return d
    		});
    		element.setAttribute('draggable', true);
    	};
    	
    	function addDragArea( group, handle, element ) {
    		
    		if (!group) return reject()
    		check(group);
    		element.addEventListener('dragend', disable);
    		element.addEventListener('mouseup', disable);
    		element.setAttribute('data-group', group);
    		handle.setAttribute( 'data-group', group);
    		handle.setAttribute( 'data-element', element);
    		handle.addEventListener('mousedown', enable);
    		
    		update( d => { d[group].handles.set( handle, element ); return d });
    	}

    	function isDragging( group ) {
    		if (!group) return reject()
    		check(group);
    		let b;
    		update( d => { 
    			b = d[group].dragging;
    			return d
    		});
    		return b
    	}
    	
    	function clear( group ) {

    		if (!group) return reject()

    		try {
    			update( d => { 

    				if (!d[group]) return d

    				for (const [handle, element] of Object.entries( d[group].handles)) {
    					handle.removeEventListener( 'mousedown', enable );
    					element.removeEventListener( 'dragend', disable );
    					element.removeEventListener( 'mouseup', disable );
    				}
    				for (let i = 0; i < d[group].drops.length; i++) {
    					const drop = d[group].drops[i];
    					for (const [type, method] of Object.entries(dropHandlers)) {
    						drop.removeEventListener( type, method );
    					}
    				}
    				
    				delete d[group];
    				return d 
    			});
    		} catch(err) {
    			console.error(`[dragdrop] could not clear "${group}":`, err.message);
    		}
    	}
    	
    	return {
    		subscribe,
    		set,
    		update,
    		addDragArea,
    		addDropArea,
    		isDragging,
    		clear
    	}
    }

    var dragdrop$1 = dragdrop();

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* ../src/Table.svelte generated by Svelte v3.37.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$2 = "../src/Table.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (287:1) {#if !init.nohead}
    function create_if_block$2(ctx) {
    	let thead_1;
    	let tr;
    	let updating_features;
    	let current;

    	function tr_features_binding(value) {
    		/*tr_features_binding*/ ctx[11](value);
    	}

    	let tr_props = {
    		init: /*init*/ ctx[0],
    		dimensions: /*dimensions*/ ctx[1],
    		debug: /*debug*/ ctx[3],
    		callbacks: /*callbacks*/ ctx[5],
    		misc: /*misc*/ ctx[6],
    		item: /*thead*/ ctx[9],
    		type: "key",
    		indeterminate: /*indeterminate*/ ctx[7]
    	};

    	if (/*features*/ ctx[2] !== void 0) {
    		tr_props.features = /*features*/ ctx[2];
    	}

    	tr = new Tr({ props: tr_props, $$inline: true });
    	binding_callbacks.push(() => bind(tr, "features", tr_features_binding));

    	const block = {
    		c: function create() {
    			thead_1 = element("thead");
    			create_component(tr.$$.fragment);
    			add_location(thead_1, file$2, 287, 2, 7371);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, thead_1, anchor);
    			mount_component(tr, thead_1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tr_changes = {};
    			if (dirty & /*init*/ 1) tr_changes.init = /*init*/ ctx[0];
    			if (dirty & /*dimensions*/ 2) tr_changes.dimensions = /*dimensions*/ ctx[1];
    			if (dirty & /*debug*/ 8) tr_changes.debug = /*debug*/ ctx[3];
    			if (dirty & /*callbacks*/ 32) tr_changes.callbacks = /*callbacks*/ ctx[5];
    			if (dirty & /*misc*/ 64) tr_changes.misc = /*misc*/ ctx[6];
    			if (dirty & /*thead*/ 512) tr_changes.item = /*thead*/ ctx[9];
    			if (dirty & /*indeterminate*/ 128) tr_changes.indeterminate = /*indeterminate*/ ctx[7];

    			if (!updating_features && dirty & /*features*/ 4) {
    				updating_features = true;
    				tr_changes.features = /*features*/ ctx[2];
    				add_flush_callback(() => updating_features = false);
    			}

    			tr.$set(tr_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tr.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tr.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead_1);
    			destroy_component(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(287:1) {#if !init.nohead}",
    		ctx
    	});

    	return block;
    }

    // (297:2) {#each data as item, idx }
    function create_each_block$1(ctx) {
    	let tr;
    	let updating_features;
    	let current;

    	function tr_features_binding_1(value) {
    		/*tr_features_binding_1*/ ctx[12](value);
    	}

    	let tr_props = {
    		init: /*init*/ ctx[0],
    		dimensions: /*dimensions*/ ctx[1],
    		debug: /*debug*/ ctx[3],
    		callbacks: /*callbacks*/ ctx[5],
    		misc: /*misc*/ ctx[6],
    		item: /*item*/ ctx[25],
    		type: "cell"
    	};

    	if (/*features*/ ctx[2] !== void 0) {
    		tr_props.features = /*features*/ ctx[2];
    	}

    	tr = new Tr({ props: tr_props, $$inline: true });
    	binding_callbacks.push(() => bind(tr, "features", tr_features_binding_1));

    	const block = {
    		c: function create() {
    			create_component(tr.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tr, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tr_changes = {};
    			if (dirty & /*init*/ 1) tr_changes.init = /*init*/ ctx[0];
    			if (dirty & /*dimensions*/ 2) tr_changes.dimensions = /*dimensions*/ ctx[1];
    			if (dirty & /*debug*/ 8) tr_changes.debug = /*debug*/ ctx[3];
    			if (dirty & /*callbacks*/ 32) tr_changes.callbacks = /*callbacks*/ ctx[5];
    			if (dirty & /*misc*/ 64) tr_changes.misc = /*misc*/ ctx[6];
    			if (dirty & /*data*/ 256) tr_changes.item = /*item*/ ctx[25];

    			if (!updating_features && dirty & /*features*/ 4) {
    				updating_features = true;
    				tr_changes.features = /*features*/ ctx[2];
    				add_flush_callback(() => updating_features = false);
    			}

    			tr.$set(tr_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tr.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tr.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tr, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(297:2) {#each data as item, idx }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let table;
    	let t;
    	let tbody;
    	let table_id_value;
    	let table_class_value;
    	let table_data_id_value;
    	let current;
    	let if_block = !/*init*/ ctx[0].nohead && create_if_block$2(ctx);
    	let each_value = /*data*/ ctx[8];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			table = element("table");
    			if (if_block) if_block.c();
    			t = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(tbody, file$2, 294, 1, 7525);
    			attr_dev(table, "id", table_id_value = "stt-" + slugify(/*id*/ ctx[4]));
    			attr_dev(table, "class", table_class_value = "stt-" + slugify(/*id*/ ctx[4]));
    			attr_dev(table, "data-id", table_data_id_value = slugify(/*id*/ ctx[4]));
    			set_style(table, "width", "100%");
    			set_style(table, "table-layout", "fixed");
    			set_style(table, "border-spacing", "0");
    			add_location(table, file$2, 279, 0, 7169);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			if (if_block) if_block.m(table, null);
    			append_dev(table, t);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			/*table_binding*/ ctx[13](table);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*init*/ ctx[0].nohead) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*init*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(table, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*init, dimensions, debug, callbacks, misc, data, features*/ 367) {
    				each_value = /*data*/ ctx[8];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*id*/ 16 && table_id_value !== (table_id_value = "stt-" + slugify(/*id*/ ctx[4]))) {
    				attr_dev(table, "id", table_id_value);
    			}

    			if (!current || dirty & /*id*/ 16 && table_class_value !== (table_class_value = "stt-" + slugify(/*id*/ ctx[4]))) {
    				attr_dev(table, "class", table_class_value);
    			}

    			if (!current || dirty & /*id*/ 16 && table_data_id_value !== (table_data_id_value = slugify(/*id*/ ctx[4]))) {
    				attr_dev(table, "data-id", table_data_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			/*table_binding*/ ctx[13](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function warn(msg) {
    	console.warn(`[svelte-tabular-table] ${msg}`);
    }

    function error(msg) {
    	console.error(`[svelte-tabular-table] ${msg}`);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let rev;
    	let thead;
    	let sort;
    	let data;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Table", slots, []);

    	function log(msg) {
    		if (debug) console.log(`[svelte-tabular-table] ${msg} ${id ? "(\"" + id + "\")" : ""}`);
    	}

    	function review(init_, dimensions, callbacks, features, misc) {
    		if (features.autohide && !dimensions.row) warn("features.autohide is set, but no height is set for dimensions.row (defaulting to 1em)");
    		let ids = [];
    		let tally = { added: 0, duped: 0 };
    		const len = init.data.length;

    		for (let i = 0; i < len; i++) {
    			if (!init.data[i][init.index]) {
    				const id = "id" + i;
    				warn(`no property "${init.index}" in data item ${i}, defaulting to "${id}"`);
    				$$invalidate(0, init.data[i][init.index] = id, init);
    				tally.added += 1;
    			}

    			if (ids.indexOf(init.data[i][init.index]) != -1) {
    				$$invalidate(0, init.data[i] = { ...init.data[i] }, init);
    				while (ids.indexOf(init.data[i][init.index]) != -1) $$invalidate(0, init.data[i][init.index] += "_dup", init);
    				tally.duped += 1;
    			}

    			ids.push(init.data[i][init.index]);
    		}

    		const activ = tally.duped > 0 || tally.added > 0;
    		if (activ) warn(`${tally.duped}/${len} duplicate keys amended, ${tally.added}/${len} keys added`);
    	}

    	let { init = {
    		keys: [], // array of text or array of objects
    		data: [],
    		index: null,
    		nohead: false,
    		nodiv: false
    	} } = $$props;

    	let { dimensions = { ...defaults.dimensions } } = $$props;
    	let { debug = true } = $$props;
    	let { id = "" } = $$props;

    	onMount(async () => {
    		
    	});

    	let { callbacks = {
    		click: {
    			key: defaults.click,
    			row: defaults.click,
    			cell: defaults.click
    		},
    		render: {
    			key: defaults.render,
    			cell: defaults.render
    		},
    		checked: defaults.checked
    	} } = $$props;

    	let { features = {
    		sortable: {
    			key: null,
    			direction: false,
    			sort: defaults.sort
    		},
    		rearrangeable: null, // <- callback event for rearranging with integer index (from, to) as arguments
    		checkable: null,
    		autohide: null
    	} } = $$props;

    	let misc = {
    		hidden: {},
    		els: {
    			table: null,
    			thead: null,
    			tr: {},
    			td: {},
    			handles: {},
    			drops: {}
    		},
    		refresh: true,
    		reorder: o => {
    			features?.sortable?.key;
    			$$invalidate(2, features.sortable.direction = !features.sortable.direction, features);

    			if (o.key) {
    				const d = features.sortable.direction;
    				$$invalidate(2, features.sortable.key = o.key, features);
    				log(`sorting with "${o.key}" -> ${d ? "ascending" : "descending"}`);
    			}
    		}
    	};

    	let hasDragDrop = false;

    	onDestroy(async () => {
    		if (hasDragDrop) dragdrop$1.clear("table");
    	});

    	function bindDragDrop(data) {
    		if (!features.rearrangeable) return;

    		setTimeout(
    			() => {
    				if (hasDragDrop) dragdrop$1.clear("table");

    				for (const [key, tr] of Object.entries(misc.els.tr)) {
    					const handle = misc.els.handles[key];

    					const callbacks = {
    						drop: e => {
    							try {
    								const f = e.source.getAttribute("data-key");
    								const t = e.destination.getAttribute("data-key");
    								const ff = init.data.find(d => d[init.index] == f);
    								const tt = init.data.find(d => d[init.index] == t);
    								const fff = init.data.indexOf(ff);
    								const ttt = init.data.indexOf(tt);
    								log(`dragged from ${fff} to ${ttt}`);

    								if (typeof features.rearrangeable == "function") {
    									features.rearrangeable(fff, ttt);
    								} else {
    									warn(`there is no callback for features.rearrangeable (nothing will happen)`);
    								}
    							} catch(err) {
    								error(`could not drag and drop: ${err.message}`);
    							}
    						},
    						enable: e => isDragging = true,
    						disable: e => isDragging = false
    					};

    					if (handle && tr) {
    						dragdrop$1.addDragArea("table", handle, tr);
    						dragdrop$1.addDropArea("table", tr, callbacks);
    						hasDragDrop = true;
    					}
    				}
    			},
    			1
    		);
    	}

    	let aboveY, belowY, bottomY;

    	function onScroll(init_, autohide, dims) {
    		if (!autohide) return;
    		if (autohide && !dimensions?.row) $$invalidate(1, dimensions.row = defaults.dimensions.row, dimensions);
    		if (autohide && !dimensions?.padding) $$invalidate(1, dimensions.padding = defaults.dimensions.padding, dimensions);
    		const el = autohide?.container;
    		const exists = el != undefined;
    		const scroll = autohide?.position || 0;
    		const height = dims.row + dims.padding * 2;
    		const outside = (el?.offsetHeight || window.innerHeight) + height;
    		const extra = outside * (autohide?.buffer || 0);

    		let tally = {
    			above: 0,
    			below: 0,
    			first: null,
    			last: null
    		};

    		const len = (data || []).length;
    		const to = misc?.els?.table?.offsetTop || 0;
    		const eo = el?.offsetTop || 0;
    		const off = to - eo;

    		for (let i = 0; i < len; i++) {
    			const item = data[i];
    			const id = item[init.index];
    			$$invalidate(6, misc.hidden[id] = false, misc);
    			const thead = init.nohead ? 0 : height;
    			const piece = height * i + height + thead;
    			const above = scroll > piece + off + extra;
    			const below = piece + off > scroll + outside + extra;
    			if ((above || below) && exists) $$invalidate(6, misc.hidden[id] = true, misc);

    			if (above) {
    				tally.above += 1;
    				tally.first = i;
    			}

    			if (below) {
    				tally.below += 1;
    				if (!tally.last) tally.last = i;
    			}
    		}

    		const activ = tally.above > 0 || tally.below > 0;
    		const indicators = false;

    		if (debug && activ && indicators) {
    			if (!aboveY) {
    				aboveY = document.createElement("div");
    				document.body.appendChild(aboveY);
    				belowY = document.createElement("div");
    				document.body.appendChild(belowY);
    				bottomY = document.createElement("div");
    				document.body.appendChild(bottomY);
    			}

    			const all = `
				position: absolute;
				width: 100vw;
				height: 1px;
				background: red;
				display: block;
				left: 0px;`;

    			aboveY.style = `
				${all}
				top: ${eo - scroll}px;`;

    			belowY.style = `
				${all}
				top: ${to - scroll}px;`;

    			bottomY.style = `
				${all}
				top: ${to - scroll + (misc?.els?.table?.offsetHeight || 0)}px;`;
    		}

    		if (activ) log(`${outside}px container: ${tally.above}/${len} above, ${tally.below}/${len} below, from ${tally.first} to ${tally.last}, ${len - (tally.above + tally.below)}/${len} visible`);
    	}

    	function _thead() {
    		return init.keys.reduce(
    			function (result, item, index) {
    				result[item] = item;
    				return result;
    			},
    			{
    				[init.index]: "svelte-tabular-table-thead"
    			}
    		);
    	}

    	let indeterminate = false;

    	function isIndeterminate(checkable) {
    		let yes = false;
    		let no = false;

    		for (let i = 0; i < init.data.length; i++) {
    			const id = init.data[i][init.index];
    			if ((features.checkable || [])[id]) yes = true;
    			if (!(features.checkable || [])[id]) no = true;
    		}

    		if (!yes && no) return $$invalidate(7, indeterminate = false);
    		if (yes && !no) return $$invalidate(7, indeterminate = false);
    		return $$invalidate(7, indeterminate = true);
    	}

    	const writable_props = ["init", "dimensions", "debug", "id", "callbacks", "features"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	function tr_features_binding(value) {
    		features = value;
    		$$invalidate(2, features);
    	}

    	function tr_features_binding_1(value) {
    		features = value;
    		$$invalidate(2, features);
    	}

    	function table_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			misc.els.table = $$value;
    			$$invalidate(6, misc);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("init" in $$props) $$invalidate(0, init = $$props.init);
    		if ("dimensions" in $$props) $$invalidate(1, dimensions = $$props.dimensions);
    		if ("debug" in $$props) $$invalidate(3, debug = $$props.debug);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("callbacks" in $$props) $$invalidate(5, callbacks = $$props.callbacks);
    		if ("features" in $$props) $$invalidate(2, features = $$props.features);
    	};

    	$$self.$capture_state = () => ({
    		Tr,
    		onMount,
    		onDestroy,
    		queryString,
    		dragdrop: dragdrop$1,
    		fade,
    		defaults,
    		slugify,
    		warn,
    		log,
    		error,
    		review,
    		init,
    		dimensions,
    		debug,
    		id,
    		callbacks,
    		features,
    		misc,
    		hasDragDrop,
    		bindDragDrop,
    		aboveY,
    		belowY,
    		bottomY,
    		onScroll,
    		_thead,
    		indeterminate,
    		isIndeterminate,
    		rev,
    		data,
    		thead,
    		sort
    	});

    	$$self.$inject_state = $$props => {
    		if ("init" in $$props) $$invalidate(0, init = $$props.init);
    		if ("dimensions" in $$props) $$invalidate(1, dimensions = $$props.dimensions);
    		if ("debug" in $$props) $$invalidate(3, debug = $$props.debug);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("callbacks" in $$props) $$invalidate(5, callbacks = $$props.callbacks);
    		if ("features" in $$props) $$invalidate(2, features = $$props.features);
    		if ("misc" in $$props) $$invalidate(6, misc = $$props.misc);
    		if ("hasDragDrop" in $$props) hasDragDrop = $$props.hasDragDrop;
    		if ("aboveY" in $$props) aboveY = $$props.aboveY;
    		if ("belowY" in $$props) belowY = $$props.belowY;
    		if ("bottomY" in $$props) bottomY = $$props.bottomY;
    		if ("indeterminate" in $$props) $$invalidate(7, indeterminate = $$props.indeterminate);
    		if ("rev" in $$props) rev = $$props.rev;
    		if ("data" in $$props) $$invalidate(8, data = $$props.data);
    		if ("thead" in $$props) $$invalidate(9, thead = $$props.thead);
    		if ("sort" in $$props) $$invalidate(10, sort = $$props.sort);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*init, dimensions, callbacks, features, misc*/ 103) {
    			rev = review(init, dimensions, callbacks, features);
    		}

    		if ($$self.$$.dirty & /*init, features, dimensions*/ 7) {
    			onScroll(init, features?.autohide, dimensions);
    		}

    		if ($$self.$$.dirty & /*init*/ 1) {
    			bindDragDrop(init.data);
    		}

    		if ($$self.$$.dirty & /*features*/ 4) {
    			isIndeterminate(features.checkable);
    		}

    		if ($$self.$$.dirty & /*features*/ 4) {
    			$$invalidate(10, sort = features?.sortable?.sort || defaults.sort);
    		}

    		if ($$self.$$.dirty & /*features, sort, init, id*/ 1045) {
    			$$invalidate(8, data = (features?.sortable?.key)
    			? sort(features.sortable, [...init.data], id)
    			: init.data);
    		}
    	};

    	$$invalidate(9, thead = _thead());

    	return [
    		init,
    		dimensions,
    		features,
    		debug,
    		id,
    		callbacks,
    		misc,
    		indeterminate,
    		data,
    		thead,
    		sort,
    		tr_features_binding,
    		tr_features_binding_1,
    		table_binding
    	];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			init: 0,
    			dimensions: 1,
    			debug: 3,
    			id: 4,
    			callbacks: 5,
    			features: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get init() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set init(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dimensions() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dimensions(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get debug() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set debug(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callbacks() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callbacks(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get features() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set features(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Auto.svelte generated by Svelte v3.37.0 */

    const file$1 = "src/Auto.svelte";

    // (23:0) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*value*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2) set_data_dev(t, /*value*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(23:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:52) 
    function create_if_block_5(ctx) {
    	let code;
    	let t;

    	const block = {
    		c: function create() {
    			code = element("code");
    			t = text(/*value*/ ctx[1]);
    			add_location(code, file$1, 21, 1, 531);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, code, anchor);
    			append_dev(code, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2) set_data_dev(t, /*value*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(code);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(21:52) ",
    		ctx
    	});

    	return block;
    }

    // (19:26) 
    function create_if_block_4(ctx) {
    	let blink;
    	let t;

    	const block = {
    		c: function create() {
    			blink = element("blink");
    			t = text(/*value*/ ctx[1]);
    			set_style(blink, "color", "rgb(255,62,0)");
    			add_location(blink, file$1, 19, 1, 426);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, blink, anchor);
    			append_dev(blink, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2) set_data_dev(t, /*value*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(blink);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(19:26) ",
    		ctx
    	});

    	return block;
    }

    // (17:27) 
    function create_if_block_3$1(ctx) {
    	let marquee;
    	let t;

    	const block = {
    		c: function create() {
    			marquee = element("marquee");
    			t = text(/*value*/ ctx[1]);
    			add_location(marquee, file$1, 17, 1, 371);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, marquee, anchor);
    			append_dev(marquee, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2) set_data_dev(t, /*value*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(marquee);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(17:27) ",
    		ctx
    	});

    	return block;
    }

    // (15:32) 
    function create_if_block_2$1(ctx) {
    	let em;
    	let t_value = new Date(/*value*/ ctx[1]).toDateString() + "";
    	let t;

    	const block = {
    		c: function create() {
    			em = element("em");
    			t = text(t_value);
    			add_location(em, file$1, 15, 1, 292);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, em, anchor);
    			append_dev(em, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2 && t_value !== (t_value = new Date(/*value*/ ctx[1]).toDateString() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(em);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(15:32) ",
    		ctx
    	});

    	return block;
    }

    // (13:29) 
    function create_if_block_1$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*value*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			add_location(img, file$1, 13, 1, 236);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2 && img.src !== (img_src_value = /*value*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(13:29) ",
    		ctx
    	});

    	return block;
    }

    // (11:0) {#if type == 'key'}
    function create_if_block$1(ctx) {
    	let b;
    	let t;

    	const block = {
    		c: function create() {
    			b = element("b");
    			t = text(/*value*/ ctx[1]);
    			set_style(b, "letter-spacing", "0.2em");
    			add_location(b, file$1, 11, 1, 160);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    			append_dev(b, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2) set_data_dev(t, /*value*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(11:0) {#if type == 'key'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[2] == "key") return create_if_block$1;
    		if (/*key*/ ctx[0] == "picture") return create_if_block_1$1;
    		if (/*key*/ ctx[0] == "registered") return create_if_block_2$1;
    		if (/*key*/ ctx[0] == "about") return create_if_block_3$1;
    		if (/*key*/ ctx[0] == "name") return create_if_block_4;
    		if (/*key*/ ctx[0] == "latitude" || /*key*/ ctx[0] == "longitude") return create_if_block_5;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Auto", slots, []);
    	let { id } = $$props;
    	let { item } = $$props;
    	let { key } = $$props;
    	let { value } = $$props;
    	let { index } = $$props;
    	let { event } = $$props;
    	let { type } = $$props;
    	const writable_props = ["id", "item", "key", "value", "index", "event", "type"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Auto> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    		if ("item" in $$props) $$invalidate(4, item = $$props.item);
    		if ("key" in $$props) $$invalidate(0, key = $$props.key);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("index" in $$props) $$invalidate(5, index = $$props.index);
    		if ("event" in $$props) $$invalidate(6, event = $$props.event);
    		if ("type" in $$props) $$invalidate(2, type = $$props.type);
    	};

    	$$self.$capture_state = () => ({ id, item, key, value, index, event, type });

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    		if ("item" in $$props) $$invalidate(4, item = $$props.item);
    		if ("key" in $$props) $$invalidate(0, key = $$props.key);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("index" in $$props) $$invalidate(5, index = $$props.index);
    		if ("event" in $$props) $$invalidate(6, event = $$props.event);
    		if ("type" in $$props) $$invalidate(2, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [key, value, type, id, item, index, event];
    }

    class Auto extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			id: 3,
    			item: 4,
    			key: 0,
    			value: 1,
    			index: 5,
    			event: 6,
    			type: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Auto",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[3] === undefined && !("id" in props)) {
    			console.warn("<Auto> was created without expected prop 'id'");
    		}

    		if (/*item*/ ctx[4] === undefined && !("item" in props)) {
    			console.warn("<Auto> was created without expected prop 'item'");
    		}

    		if (/*key*/ ctx[0] === undefined && !("key" in props)) {
    			console.warn("<Auto> was created without expected prop 'key'");
    		}

    		if (/*value*/ ctx[1] === undefined && !("value" in props)) {
    			console.warn("<Auto> was created without expected prop 'value'");
    		}

    		if (/*index*/ ctx[5] === undefined && !("index" in props)) {
    			console.warn("<Auto> was created without expected prop 'index'");
    		}

    		if (/*event*/ ctx[6] === undefined && !("event" in props)) {
    			console.warn("<Auto> was created without expected prop 'event'");
    		}

    		if (/*type*/ ctx[2] === undefined && !("type" in props)) {
    			console.warn("<Auto> was created without expected prop 'type'");
    		}
    	}

    	get id() {
    		throw new Error("<Auto>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Auto>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		throw new Error("<Auto>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Auto>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Auto>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Auto>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Auto>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Auto>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Auto>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Auto>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get event() {
    		throw new Error("<Auto>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set event(value) {
    		throw new Error("<Auto>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Auto>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Auto>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var data = [
      {
        "_id": "60662fbbc9f0ed9829d217f5",
        "index": 0,
        "guid": "c205f95f-28e4-4c86-a52e-8a73ba1b4da7",
        "isActive": false,
        "balance": "3,628.55",
        "picture": "http://placehold.it/32x32",
        "age": 21,
        "eyeColor": "green",
        "name": "John Jefferson",
        "gender": "female",
        "company": "OMNICORP",
        "email": "johnjefferson@pearlesex.com",
        "phone": "+1 (806) 592-3968",
        "address": "468 Boardwalk , Neibert, Hawaii, 8315",
        "about": "Consequat adipisicing in aute id quis in. \r\n",
        "registered": "2017-10-26T06:21:03-02:00",
        "latitude": -21.940819,
        "longitude": 30.201564,
        "tags": [
          "ex",
          "ad",
          "ad",
          "sit",
          "occaecat",
          "et",
          "dolor"
        ],
        "friends": [
          {
            "id": 0,
            "name": "Nona Craft"
          },
          {
            "id": 1,
            "name": "Linda Franco"
          },
          {
            "id": 2,
            "name": "Paul Washington"
          }
        ],
        "greeting": "Hello, John Jefferson! You have 1 unread messages.",
        "favoriteFruit": "strawberry"
      },
      {
        "_id": "60662fbb4ac4c20b93c10ecf",
        "index": 1,
        "guid": "fe758a42-c2c5-4f98-ad48-5fe9cb7bec9a",
        "isActive": true,
        "balance": "2,268.74",
        "picture": "http://placehold.it/32x32",
        "age": 27,
        "eyeColor": "brown",
        "name": "Cox Sanchez",
        "gender": "male",
        "company": "ARCTIQ",
        "email": "coxsanchez@arctiq.com",
        "phone": "+1 (886) 468-3027",
        "address": "438 Abbey Court, Joppa, Illinois, 6251",
        "about": "Sit tempor irure ipsum officia aliquip officia. \r\n",
        "registered": "2018-12-01T06:53:16-01:00",
        "latitude": 42.076816,
        "longitude": 86.747389,
        "tags": [
          "irure",
          "aute",
          "laboris",
          "dolor",
          "deserunt",
          "eu",
          "id"
        ],
        "friends": [
          {
            "id": 0,
            "name": "Mann Perkins"
          },
          {
            "id": 1,
            "name": "Hodge Nunez"
          },
          {
            "id": 2,
            "name": "Caitlin Olson"
          }
        ],
        "greeting": "Hello, Cox Sanchez! You have 6 unread messages.",
        "favoriteFruit": "banana"
      },
      {
        "_id": "60662fbb04c662f7e3d97aeb",
        "index": 2,
        "guid": "b0ec4731-aec6-4f2d-a69b-3bd91431eb6b",
        "isActive": true,
        "balance": "1,489.71",
        "picture": "http://placehold.it/32x32",
        "age": 31,
        "eyeColor": "green",
        "name": "Humphrey Eaton",
        "gender": "male",
        "company": "INQUALA",
        "email": "humphreyeaton@inquala.com",
        "phone": "+1 (854) 547-3734",
        "address": "743 Grace Court, Bentley, New Mexico, 2413",
        "about": "Ut cillum ex reprehenderit dolore. Deserunt deserunt voluptate velit magna aliqua. \r\n",
        "registered": "2021-02-11T08:10:59-01:00",
        "latitude": -10.372481,
        "longitude": -179.369724,
        "tags": [
          "mollit",
          "Lorem",
          "ipsum",
          "quis",
          "tempor",
          "veniam",
          "aute"
        ],
        "friends": [
          {
            "id": 0,
            "name": "Elba Mccormick"
          },
          {
            "id": 1,
            "name": "Mayo Marks"
          },
          {
            "id": 2,
            "name": "Jordan Lang"
          }
        ],
        "greeting": "Hello, Humphrey Eaton! You have 8 unread messages.",
        "favoriteFruit": "strawberry"
      },
      {
        "_id": "60662fbb52c8026168c7549b",
        "index": 3,
        "guid": "36906725-b4a1-4e84-a529-8aeffdbf974e",
        "isActive": false,
        "balance": "2,758.92",
        "picture": "http://placehold.it/32x32",
        "age": 36,
        "eyeColor": "brown",
        "name": "Meagan Jones",
        "gender": "female",
        "company": "NURALI",
        "email": "meaganjones@nurali.com",
        "phone": "+1 (887) 598-2324",
        "address": "435 Love Lane, Sattley, Federated States Of Micronesia, 3721",
        "about": "Dolore laboris nulla ullamco adipisicing. Est fugiat minim sunt et incididunt. ",
        "registered": "2015-03-05T07:22:25-01:00",
        "latitude": -42.652911,
        "longitude": 170.969049,
        "tags": [
          "laboris",
          "aute",
          "duis",
          "aliquip",
          "in",
          "do",
          "nostrud"
        ],
        "friends": [
          {
            "id": 0,
            "name": "Dudley Taylor"
          },
          {
            "id": 1,
            "name": "Lola Oconnor"
          },
          {
            "id": 2,
            "name": "Josefina Chavez"
          }
        ],
        "greeting": "Hello, Meagan Jones! You have 4 unread messages.",
        "favoriteFruit": "strawberry"
      },
      {
        "_id": "60662fbbeaf043f4a61f9c7f",
        "index": 4,
        "guid": "2ca7be70-0c09-473d-9d50-0221cad09320",
        "isActive": false,
        "balance": "3,106.10",
        "picture": "http://placehold.it/32x32",
        "age": 32,
        "eyeColor": "green",
        "name": "Barber Spears",
        "gender": "male",
        "company": "NETPLODE",
        "email": "barberspears@netplode.com",
        "phone": "+1 (831) 471-2578",
        "address": "999 Thatford Avenue, Dowling, Wyoming, 4147",
        "about": "Do proident fugiat ullamco nulla ut mollit mollit aute. Fugiat ea ad ex commodo Lorem eiusmod labore ea Lorem eu excepteur. ",
        "registered": "2016-07-22T10:15:05-02:00",
        "latitude": 54.305557,
        "longitude": 156.332766,
        "tags": [
          "nostrud",
          "deserunt",
          "proident",
          "duis",
          "quis",
          "pariatur",
          "ullamco"
        ],
        "friends": [
          {
            "id": 0,
            "name": "Rosie Bolton"
          },
          {
            "id": 1,
            "name": "Sloan Harrison"
          },
          {
            "id": 2,
            "name": "Britney Lewis"
          }
        ],
        "greeting": "Hello, Barber Spears! You have 10 unread messages.",
        "favoriteFruit": "strawberry"
      },
      {
        "_id": "60662fbb51df134ca6a2da1f",
        "index": 5,
        "guid": "9dfa8d19-b0fe-4217-9c13-328aa8901381",
        "isActive": true,
        "balance": "1,381.52",
        "picture": "http://placehold.it/32x32",
        "age": 30,
        "eyeColor": "green",
        "name": "Gabriela Brewer",
        "gender": "female",
        "company": "VISALIA",
        "email": "gabrielabrewer@visalia.com",
        "phone": "+1 (856) 464-3756",
        "address": "778 Kane Street, Harrodsburg, Missouri, 8650",
        "about": "Proident aliqua ex est velit culpa officia quis amet id in Lorem. Duis ea excepteur esse laboris duis aute tempor. ",
        "registered": "2015-03-21T10:36:32-01:00",
        "latitude": 20.947055,
        "longitude": 73.043118,
        "tags": [
          "voluptate",
          "ut",
          "dolor",
          "do",
          "mollit",
          "ad",
          "laborum"
        ],
        "friends": [
          {
            "id": 0,
            "name": "Soto Larsen"
          },
          {
            "id": 1,
            "name": "Blair Fields"
          },
          {
            "id": 2,
            "name": "Spears Todd"
          }
        ],
        "greeting": "Hello, Gabriela Brewer! You have 2 unread messages.",
        "favoriteFruit": "strawberry"
      },
      {
        "_id": "60662fbbae36ee590819b4e0",
        "index": 6,
        "guid": "232c5bfd-952c-4c53-97e3-cadf17997f04",
        "isActive": true,
        "balance": "2,925.50",
        "picture": "http://placehold.it/32x32",
        "age": 28,
        "eyeColor": "green",
        "name": "Hendricks Chase",
        "gender": "male",
        "company": "MAGNINA",
        "email": "hendrickschase@magnina.com",
        "phone": "+1 (837) 557-2562",
        "address": "941 Brighton Avenue, Choctaw, Palau, 1978",
        "about": "Commodo elit duis cupidatat ad sit cupidatat ex dolor. Ex ut in culpa duis sit proident eiusmod.",
        "registered": "2020-04-17T02:16:58-02:00",
        "latitude": -23.040839,
        "longitude": -84.524142,
        "tags": [
          "labore",
          "amet",
          "est",
          "cillum",
          "ipsum",
          "ea",
          "velit"
        ],
        "friends": [
          {
            "id": 0,
            "name": "Shepherd Charles"
          },
          {
            "id": 1,
            "name": "Nichole Pitts"
          },
          {
            "id": 2,
            "name": "Adams Cummings"
          }
        ],
        "greeting": "Hello, Hendricks Chase! You have 10 unread messages.",
        "favoriteFruit": "apple"
      },
      {
        "_id": "60662fbb38674ef2f1d42e10",
        "index": 7,
        "guid": "0fd8aaf1-9be5-4995-a40c-6001d82f632a",
        "isActive": false,
        "balance": "3,514.60",
        "picture": "http://placehold.it/32x32",
        "age": 26,
        "eyeColor": "green",
        "name": "Schwartz Gonzales",
        "gender": "male",
        "company": "TERRAGEN",
        "email": "schwartzgonzales@terragen.com",
        "phone": "+1 (964) 418-3744",
        "address": "436 Conover Street, Robinette, Connecticut, 1742",
        "about": "Fugiat tempor occaecat occaecat sint veniam irure sunt quis enim. Exercitation laboris occaecat adipisicing id officia sint commodo velit fugiat. ",
        "registered": "2018-10-25T09:36:27-02:00",
        "latitude": -60.842289,
        "longitude": 35.306672,
        "tags": [
          "proident",
          "exercitation",
          "cupidatat",
          "pariatur",
          "mollit",
          "sit",
          "velit"
        ],
        "friends": [
          {
            "id": 0,
            "name": "Ayers Martinez"
          },
          {
            "id": 1,
            "name": "Santos Salazar"
          },
          {
            "id": 2,
            "name": "Vonda Woodard"
          }
        ],
        "greeting": "Hello, Schwartz Gonzales! You have 4 unread messages.",
        "favoriteFruit": "banana"
      },
      {
        "_id": "60662fbb73f3257053055c99",
        "index": 8,
        "guid": "b7ddf82b-ec28-4721-a605-82654c4f1ef2",
        "isActive": false,
        "balance": "3,817.79",
        "picture": "http://placehold.it/32x32",
        "age": 39,
        "eyeColor": "green",
        "name": "Benita Sharp",
        "gender": "female",
        "company": "GEEKY",
        "email": "benitasharp@geeky.com",
        "phone": "+1 (869) 458-2419",
        "address": "583 Chauncey Street, Siglerville, Utah, 7059",
        "about": "Consectetur excepteur eu ex amet nisi non aute nostrud magna irure non ad. Consequat veniam consequat Lorem consectetur do est consectetur est pariatur eu elit ad. ",
        "registered": "2019-09-03T01:49:05-02:00",
        "latitude": 82.846036,
        "longitude": 154.454805,
        "tags": [
          "consequat",
          "ad",
          "culpa",
          "ex",
          "occaecat",
          "cillum",
          "mollit"
        ],
        "friends": [
          {
            "id": 0,
            "name": "Marjorie Merrill"
          },
          {
            "id": 1,
            "name": "Lang Malone"
          },
          {
            "id": 2,
            "name": "Greene Gould"
          }
        ],
        "greeting": "Hello, Benita Sharp! You have 2 unread messages.",
        "favoriteFruit": "banana"
      }
    ];

    function add( name, types, example, description ) {
    	return { name, types, example, description }
    }

    function generate( code, add ){
    	let s = '';
    	s += 'const config = {\n'; 
    	s += code.substring(1).replaceAll('\t\t\t\t', '\t'); 
    	s += '\n}\n\n// ---\n\n';
    	s += '<Table {...config} />';
    	if (add) {
    		s += '\n\n// ---\n\n';
    		s += `<script>\r\n\texport let id\r\n\texport let item\r\n\texport let key\r\n\texport let value\r\n\texport let index\r\n\texport let event\r\n\texport let type\r\n<\/script>\r\n\r\n{#if type == \'key\'}\r\n\t<b style=\"letter-spacing: 0.2em\">{value}<\/b>\r\n{:else if (key == \'picture\')}\r\n\t<img src={ value } \/>\r\n{:else if (key == \'registered\')}\r\n\t<em>{ ( new Date( value ) ).toDateString() }<\/em>\r\n{:else if (key == \'about\')}\r\n\t<marquee>{value}<\/marquee>\r\n{:else if (key == \'name\')}\r\n\t<blink style=\"color:rgb(255,62,0)\">{value}<\/blink>\r\n{:else if (key == \'latitude\' || key ==\'longitude\' )}\r\n\t<code>{value}<\/code>\r\n{:else}\r\n\t{value}\r\n{\/if}`;
    	}
    	return s
    }

    var docs = {


    	'API': [
    		add( 
    			'init.data',
    			['Array:Object'],
    			`[ { color: 'blue', id: '001' }, {color: 'red', id: '002' } ]`,
    			'list of rows'
    		),
    		add( 
    			'init.keys',
    			['Array:String'],
    			`[ 'color', 'id' ]`,
    			'list of columns'
    		),
    		add( 
    			'init.index',
    			['String'],
    			`id`,
    			'unique index'
    		),
    		add( 
    			'init.nohide',
    			['Boolean'],
    			`true`,
    			'dont render thead'
    		),

    		// ---------------------
    		
    		add( 
    			'dimensions.row',
    			['Integer', 'String'],
    			`10, "2em"`,
    			'height of each row'
    		),
    		add( 
    			'dimensions.padding',
    			['Integer', 'String'],
    			`10, "1em"`,
    			'padding of each row'
    		),
    		add( 
    			'dimensions.widths',
    			['Array:Integer', 'Array:String'],
    			`[ 100, "20%", "40px", 10]`,
    			'width of each column'
    		),

    		// ---------------------
    		
    		add( 
    			'features.sortable.key',
    			['String'],
    			`"color"`,
    			'initial sorting key (enables sortable)'
    		),
    		add( 
    			'features.sortable.direction',
    			['Boolean'],
    			`true`,
    			'ascending or descending'
    		),

    		// ---------------------
    		
    		add( 
    			'features.checkable',
    			['Object'],
    			`{}`,
    			'blank object (enables checkable)'
    		),

    		// ---------------------
    		
    		add( 
    			'features.rearrangeable',
    			['Function'],
    			`(a,b) => alert(\`from \${a} to \${b}\`)`,
    			'callback (enables rearrangeable)'
    		),
    		// ---------------------
    		
    		add( 
    			'features.autohide.container',
    			['Element'],
    			`bind:this={domElement},window`,
    			'DOM element (enables autohide)'
    		),
    		add( 
    			'features.autohide.position',
    			['Integer'],
    			`on:scroll=>{setPosition}`,
    			'current scroll position (set externally)'
    		),
    		add( 
    			'features.autohide.buffer',
    			['Float'],
    			`2`,
    			'extend area (multiple of container height)'
    		),

    		// ---------------------
    		
    		add( 
    			'callbacks.render.key|cell',
    			['Function', 'SvelteComponent'],
    			`o => o.value + '!'`,
    			'rendering callback or SvelteComponent'
    		),
    		add( 
    			'callbacks.click.key|cell',
    			['Function'],
    			`o => alert(\`\${o.id}\ clicked!\`)`,
    			'cell or key click callback'
    		),

    		// ---------------------
    		
    		add( 
    			'id',
    			['String'],
    			`my-table`,
    			'#id property for Table'
    		),
    		add( 
    			'debug',
    			['Boolean'],
    			`true`,
    			'debugging console log'
    		)
    	],

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
			In place of a function, a <code>svelte:component</code> can be used with <code>callbacks.render</code>:`,
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


    };

    /* src/App.svelte generated by Svelte v3.37.0 */

    const { window: window_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[23] = list;
    	child_ctx[21] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[21] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[21] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (228:1) {:else}
    function create_else_block(ctx) {
    	let html_tag;
    	let raw0_value = docs["Intro"] + "";
    	let t0;
    	let html_tag_1;
    	let raw1_value = docs["Advert"] + "";
    	let t1;
    	let div0;
    	let t2;
    	let a;
    	let t4;
    	let t5;
    	let div1;
    	let h1;
    	let t7;
    	let table;
    	let current;
    	let each_value_3 = /*all*/ ctx[5];
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*all*/ ctx[5];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	table = new Table({
    			props: {
    				init: {
    					data: docs["API"],
    					keys: ["name", "types", "example", "description"],
    					index: "name"
    				},
    				dimensions: { widths: [250, 220] },
    				callbacks: { render: { cell: func_1 } }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			a = element("a");
    			a.textContent = "API Documentation";
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "API Documentation";
    			t7 = space();
    			create_component(table.$$.fragment);
    			html_tag = new HtmlTag(t0);
    			html_tag_1 = new HtmlTag(t1);
    			attr_dev(a, "class", "opt");
    			attr_dev(a, "href", "#api");
    			toggle_class(a, "fill", /*nav*/ ctx[2] == "api");
    			add_location(a, file, 234, 3, 4807);
    			attr_dev(div0, "class", "row");
    			set_style(div0, "margin", "1em 0em");
    			add_location(div0, file, 230, 2, 4601);
    			add_location(h1, file, 283, 3, 6125);
    			toggle_class(div1, "hidden", /*nav*/ ctx[2] != "api");
    			add_location(div1, file, 282, 2, 6086);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw0_value, target, anchor);
    			insert_dev(target, t0, anchor);
    			html_tag_1.m(raw1_value, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div0, t2);
    			append_dev(div0, a);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t5, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t7);
    			mount_component(table, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*slugify, all, nav*/ 36) {
    				each_value_3 = /*all*/ ctx[5];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, t2);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty & /*nav*/ 4) {
    				toggle_class(a, "fill", /*nav*/ ctx[2] == "api");
    			}

    			if (dirty & /*nav, slugify, all, code, autohide, scroller, docs*/ 103) {
    				each_value_2 = /*all*/ ctx[5];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t5.parentNode, t5);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*nav*/ 4) {
    				toggle_class(div1, "hidden", /*nav*/ ctx[2] != "api");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) html_tag.d();
    			if (detaching) detach_dev(t0);
    			if (detaching) html_tag_1.d();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div1);
    			destroy_component(table);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(228:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (190:1) {#if markdown}
    function create_if_block(ctx) {
    	let div;
    	let html_tag;
    	let raw_value = docs["Intro"] + "";
    	let t0;
    	let ul;
    	let li0;
    	let a0;
    	let t2;
    	let t3;
    	let li1;
    	let a1;
    	let t5;
    	let t6;
    	let h1;
    	let t8;
    	let table;
    	let current;
    	let each_value_1 = /*all*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*all*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	table = new Table({
    			props: {
    				init: {
    					data: docs["API"],
    					keys: ["name", "types", "example", "description"],
    					index: "name",
    					nodiv: true
    				},
    				callbacks: { render: { cell: func } }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Live Examples 🔗";
    			t2 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "API Documentation";
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			h1 = element("h1");
    			h1.textContent = "API Documentation";
    			t8 = space();
    			create_component(table.$$.fragment);
    			html_tag = new HtmlTag(t0);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://autr.github.io/svelte-tabular-table");
    			add_location(a0, file, 193, 8, 3645);
    			add_location(li0, file, 193, 4, 3641);
    			attr_dev(a1, "href", "#api-documentation");
    			add_location(a1, file, 197, 8, 3871);
    			add_location(li1, file, 197, 4, 3867);
    			add_location(ul, file, 192, 3, 3632);
    			attr_dev(h1, "id", "api");
    			add_location(h1, file, 212, 3, 4283);
    			add_location(div, file, 190, 2, 3581);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			html_tag.m(raw_value, div);
    			append_dev(div, t0);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul, null);
    			}

    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(div, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t6);
    			append_dev(div, h1);
    			append_dev(div, t8);
    			mount_component(table, div, null);
    			/*div_binding*/ ctx[10](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*getID, all*/ 288) {
    				each_value_1 = /*all*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul, t3);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*docs, all, getID, slugify*/ 288) {
    				each_value = /*all*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t6);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			destroy_component(table);
    			/*div_binding*/ ctx[10](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(190:1) {#if markdown}",
    		ctx
    	});

    	return block;
    }

    // (232:3) {#each all as table,idx}
    function create_each_block_3(ctx) {
    	let a;
    	let t0;
    	let t1_value = /*idx*/ ctx[21] + 1 + "";
    	let t1;
    	let t2;
    	let t3_value = /*table*/ ctx[19].id + "";
    	let t3;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text("Example ");
    			t1 = text(t1_value);
    			t2 = text(" - ");
    			t3 = text(t3_value);
    			attr_dev(a, "class", "opt");
    			attr_dev(a, "href", "#" + slugify(/*table*/ ctx[19].id));
    			toggle_class(a, "fill", /*nav*/ ctx[2] == slugify(/*table*/ ctx[19].id));
    			add_location(a, file, 232, 4, 4675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*nav, slugify, all*/ 36) {
    				toggle_class(a, "fill", /*nav*/ ctx[2] == slugify(/*table*/ ctx[19].id));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(232:3) {#each all as table,idx}",
    		ctx
    	});

    	return block;
    }

    // (258:4) {:else}
    function create_else_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No config to view.";
    			add_location(p, file, 258, 5, 5344);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(258:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (250:4) {#if code && docs[table.id] }
    function create_if_block_3(ctx) {
    	let pre;
    	let code_1;
    	let t_value = docs[/*table*/ ctx[19].id]?.code + "";
    	let t;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			code_1 = element("code");
    			t = text(t_value);
    			add_location(code_1, file, 252, 6, 5261);
    			add_location(pre, file, 251, 5, 5249);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    			append_dev(pre, code_1);
    			append_dev(code_1, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(250:4) {#if code && docs[table.id] }",
    		ctx
    	});

    	return block;
    }

    // (273:5) {:else}
    function create_else_block_1(ctx) {
    	let table;
    	let current;
    	const table_spread_levels = [/*table*/ ctx[19]];
    	let table_props = {};

    	for (let i = 0; i < table_spread_levels.length; i += 1) {
    		table_props = assign(table_props, table_spread_levels[i]);
    	}

    	table = new Table({ props: table_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = (dirty & /*all*/ 32)
    			? get_spread_update(table_spread_levels, [get_spread_object(/*table*/ ctx[19])])
    			: {};

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(273:5) {:else}",
    		ctx
    	});

    	return block;
    }

    // (265:54) 
    function create_if_block_2(ctx) {
    	let div;
    	let p;
    	let t1;
    	let table;
    	let table_1 = /*table*/ ctx[19];
    	let current;
    	let mounted;
    	let dispose;

    	const table_spread_levels = [
    		/*table*/ ctx[19],
    		{
    			features: {
    				autohide: /*autohide*/ ctx[0][/*table*/ ctx[19].id]
    			}
    		}
    	];

    	let table_props = {};

    	for (let i = 0; i < table_spread_levels.length; i += 1) {
    		table_props = assign(table_props, table_spread_levels[i]);
    	}

    	table = new Table({ props: table_props, $$inline: true });
    	const assign_div = () => /*div_binding_1*/ ctx[12](div, table_1);
    	const unassign_div = () => /*div_binding_1*/ ctx[12](null, table_1);

    	function scroll_handler_1(...args) {
    		return /*scroll_handler_1*/ ctx[13](/*table*/ ctx[19], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Autohide automatically calculates internal offset inside container (ie. this paragraph).";
    			t1 = space();
    			create_component(table.$$.fragment);
    			set_style(p, "padding", "4em 1em");
    			set_style(p, "text-align", "center");
    			add_location(p, file, 269, 7, 5766);
    			attr_dev(div, "style", /*scroller*/ ctx[6]);
    			add_location(div, file, 265, 6, 5599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t1);
    			mount_component(table, div, null);
    			assign_div();
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "scroll", scroll_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const table_changes = (dirty & /*all, autohide*/ 33)
    			? get_spread_update(table_spread_levels, [
    					dirty & /*all*/ 32 && get_spread_object(/*table*/ ctx[19]),
    					{
    						features: {
    							autohide: /*autohide*/ ctx[0][/*table*/ ctx[19].id]
    						}
    					}
    				])
    			: {};

    			table.$set(table_changes);

    			if (table_1 !== /*table*/ ctx[19]) {
    				unassign_div();
    				table_1 = /*table*/ ctx[19];
    				assign_div();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(table);
    			unassign_div();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(265:54) ",
    		ctx
    	});

    	return block;
    }

    // (263:5) {#if table.id.indexOf('Autohide (1)') != -1}
    function create_if_block_1(ctx) {
    	let table;
    	let current;

    	const table_spread_levels = [
    		/*table*/ ctx[19],
    		{
    			features: {
    				autohide: /*autohide*/ ctx[0][/*table*/ ctx[19].id]
    			}
    		}
    	];

    	let table_props = {};

    	for (let i = 0; i < table_spread_levels.length; i += 1) {
    		table_props = assign(table_props, table_spread_levels[i]);
    	}

    	table = new Table({ props: table_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = (dirty & /*all, autohide*/ 33)
    			? get_spread_update(table_spread_levels, [
    					dirty & /*all*/ 32 && get_spread_object(/*table*/ ctx[19]),
    					{
    						features: {
    							autohide: /*autohide*/ ctx[0][/*table*/ ctx[19].id]
    						}
    					}
    				])
    			: {};

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(263:5) {#if table.id.indexOf('Autohide (1)') != -1}",
    		ctx
    	});

    	return block;
    }

    // (239:2) {#each all as table, idx}
    function create_each_block_2(ctx) {
    	let div1;
    	let h1;
    	let t0;
    	let t1_value = /*idx*/ ctx[21] + 1 + "";
    	let t1;
    	let t2;
    	let t3_value = /*table*/ ctx[19].id + "";
    	let t3;
    	let t4;
    	let code_1;
    	let t6;
    	let p;
    	let raw_value = (docs[/*table*/ ctx[19].id]?.meta || "") + "";
    	let t7;
    	let t8;
    	let div0;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*code*/ ctx[1] && docs[/*table*/ ctx[19].id]) return create_if_block_3;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*table*/ ctx[19].id.indexOf("Autohide (1)") != -1) return 0;
    		if (/*table*/ ctx[19].id.indexOf("Autohide (2)") != -1) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			t0 = text("Example ");
    			t1 = text(t1_value);
    			t2 = text(" - ");
    			t3 = text(t3_value);
    			t4 = space();
    			code_1 = element("code");
    			code_1.textContent = `${"</>"}`;
    			t6 = space();
    			p = element("p");
    			t7 = space();
    			if_block0.c();
    			t8 = space();
    			div0 = element("div");
    			if_block1.c();
    			attr_dev(code_1, "class", "cc");
    			toggle_class(code_1, "filled", /*code*/ ctx[1]);
    			add_location(code_1, file, 242, 5, 5049);
    			add_location(h1, file, 240, 4, 5003);
    			add_location(p, file, 247, 4, 5164);
    			toggle_class(div0, "hidden", /*code*/ ctx[1]);
    			add_location(div0, file, 261, 4, 5385);
    			set_style(div1, "margin", "3em 0em");
    			toggle_class(div1, "hidden", /*nav*/ ctx[2] != slugify(/*table*/ ctx[19].id));
    			add_location(div1, file, 239, 3, 4927);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(h1, t4);
    			append_dev(h1, code_1);
    			append_dev(div1, t6);
    			append_dev(div1, p);
    			p.innerHTML = raw_value;
    			append_dev(div1, t7);
    			if_block0.m(div1, null);
    			append_dev(div1, t8);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(code_1, "click", /*click_handler*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*code*/ 2) {
    				toggle_class(code_1, "filled", /*code*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div1, t8);
    				}
    			}

    			if_block1.p(ctx, dirty);

    			if (dirty & /*code*/ 2) {
    				toggle_class(div0, "hidden", /*code*/ ctx[1]);
    			}

    			if (dirty & /*nav, slugify, all*/ 36) {
    				toggle_class(div1, "hidden", /*nav*/ ctx[2] != slugify(/*table*/ ctx[19].id));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block0.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(239:2) {#each all as table, idx}",
    		ctx
    	});

    	return block;
    }

    // (195:4) {#each all as table, idx}
    function create_each_block_1(ctx) {
    	let li;
    	let a;
    	let t_value = /*getID*/ ctx[8](/*table*/ ctx[19], /*idx*/ ctx[21], true) + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", "#" + /*getID*/ ctx[8](/*table*/ ctx[19], /*idx*/ ctx[21]));
    			add_location(a, file, 195, 9, 3780);
    			add_location(li, file, 195, 5, 3776);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(195:4) {#each all as table, idx}",
    		ctx
    	});

    	return block;
    }

    // (200:3) {#each all as table, idx}
    function create_each_block(ctx) {
    	let h1;
    	let a;
    	let t0_value = /*getID*/ ctx[8](/*table*/ ctx[19], /*idx*/ ctx[21], true) + "";
    	let t0;
    	let t1;
    	let t2;
    	let p;
    	let raw_value = (docs[/*table*/ ctx[19].id]?.meta || "") + "";
    	let t3;
    	let pre;
    	let code_1;
    	let t4_value = docs[/*table*/ ctx[19].id]?.code + "";
    	let t4;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = text(" 🔗");
    			t2 = space();
    			p = element("p");
    			t3 = space();
    			pre = element("pre");
    			code_1 = element("code");
    			t4 = text(t4_value);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", `https://autr.github.io/svelte-tabular-table#${slugify(/*table*/ ctx[19].id)}`);
    			add_location(a, file, 202, 5, 4005);
    			attr_dev(h1, "id", /*getID*/ ctx[8](/*table*/ ctx[19], /*idx*/ ctx[21]));
    			add_location(h1, file, 201, 4, 3970);
    			add_location(p, file, 204, 4, 4147);
    			add_location(code_1, file, 206, 5, 4206);
    			add_location(pre, file, 205, 4, 4195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, a);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p, anchor);
    			p.innerHTML = raw_value;
    			insert_dev(target, t3, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, code_1);
    			append_dev(code_1, t4);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(200:3) {#each all as table, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let div;
    	let p0;
    	let t1;
    	let a0;
    	let t3;
    	let t4_value = new Date().getFullYear() + "";
    	let t4;
    	let t5;
    	let t6;
    	let p1;
    	let a1;
    	let t8;
    	let a2;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*markdown*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			t0 = space();
    			div = element("div");
    			p0 = element("p");
    			t1 = text("Created by ");
    			a0 = element("a");
    			a0.textContent = "G.Sinnott";
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = text(" MIT");
    			t6 = space();
    			p1 = element("p");
    			a1 = element("a");
    			a1.textContent = "MD";
    			t8 = text(" |\n\t\t\t");
    			a2 = element("a");
    			a2.textContent = "GB";
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://autr.tv");
    			add_location(a0, file, 305, 16, 6657);
    			add_location(p0, file, 305, 2, 6643);
    			set_style(a1, "cursor", "pointer");
    			add_location(a1, file, 307, 3, 6760);
    			set_style(a2, "cursor", "pointer");
    			add_location(a2, file, 308, 3, 6835);
    			add_location(p1, file, 306, 2, 6753);
    			set_style(div, "display", "flex");
    			set_style(div, "justify-content", "space-between");
    			add_location(div, file, 304, 1, 6582);
    			set_style(main, "max-width", "1200px");
    			set_style(main, "margin", "0 auto");
    			set_style(main, "padding-bottom", "2em");
    			add_location(main, file, 186, 0, 3492);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			append_dev(main, t0);
    			append_dev(main, div);
    			append_dev(div, p0);
    			append_dev(p0, t1);
    			append_dev(p0, a0);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(div, t6);
    			append_dev(div, p1);
    			append_dev(p1, a1);
    			append_dev(p1, t8);
    			append_dev(p1, a2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "scroll", /*scroll_handler*/ ctx[9], false, false, false),
    					listen_dev(a1, "click", /*click_handler_1*/ ctx[14], false, false, false),
    					listen_dev(a2, "click", /*grab*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, t0);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = o => o.value;

    const func_1 = o => {
    	if (o.key == "types" || o.key == "description") return `
							<span>${o.value}</span>
						`;

    	return `<span style="font-family:monospace;">${o.value}</span>`;
    };

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let turndown = new TurndownService({ preformattedCode: true });
    	turndown.use(tables);
    	const keys = ["name", "company", "about"];
    	let many = [];
    	for (let i = 0; i < 100; i++) many = many.concat(data);

    	const all = [
    		{
    			id: "Basic",
    			init: {
    				keys: ["name", "balance", "address", "company"],
    				index: "_id",
    				data
    			}
    		},
    		{
    			id: "Dimensions",
    			init: {
    				keys: ["age", "latitude", "longitude", "name", "about"],
    				index: "_id",
    				data
    			},
    			dimensions: {
    				row: 14,
    				padding: 0,
    				widths: [50, 100, 100, 150]
    			}
    		},
    		{
    			id: "Sortable",
    			init: {
    				keys: ["name", "balance", "company", "latitude", "longitude", "tags"],
    				index: "_id",
    				data
    			},
    			features: { sortable: { key: "name" } }
    		},
    		{
    			id: "Checkable",
    			init: {
    				keys: ["name", "balance", "company", "email", "tags"],
    				index: "_id",
    				data
    			},
    			dimensions: { widths: [100, 200, 100, 200] },
    			features: { checkable: {} }
    		},
    		{
    			id: "Rearrangeable",
    			init: {
    				keys: ["name", "balance", "company"],
    				index: "_id",
    				data
    			},
    			features: {
    				rearrangeable: (from, to) => alert(`from ${from} to ${to}`)
    			}
    		},
    		{
    			id: "Autohide (1)",
    			init: {
    				keys: ["name", "balance", "company", "latitude", "longitude", "tags"],
    				index: "_id",
    				data: many,
    				nohead: true
    			},
    			dimensions: { row: 16 }
    		},
    		{
    			id: "Autohide (2)",
    			init: {
    				keys: ["name", "balance", "company", "latitude", "longitude", "tags"],
    				index: "_id",
    				data: many,
    				nohead: true
    			},
    			dimensions: { row: 16 }
    		},
    		{
    			id: "Callbacks",
    			init: {
    				keys: ["name", "balance", "company", "latitude", "longitude"],
    				index: "_id",
    				data
    			},
    			callbacks: {
    				render: {
    					cell: o => ["🌱", "☘️", "🥬", "🌿", "🥒"][o.index],
    					key: o => ["🌴", "🌲", "🌳", "🏔", "🥦"][o.index]
    				},
    				click: {
    					cell: o => alert(["🌴", "🌲", "🌳", "🏔", "🥦"][o.index]),
    					key: o => alert(["🌱", "☘️", "🥬", "🌿", "🥒"][o.index])
    				}
    			}
    		},
    		{
    			id: "Components",
    			init: {
    				keys: ["picture", "name", "latitude", "longitude", "registered", "about"],
    				index: "_id",
    				data
    			},
    			callbacks: { render: { cell: Auto, key: Auto } }
    		}
    	];

    	const scroller = `
		width:100%;
		height:400px;
		overflow:auto;
		border: 1px solid black;`;

    	let autohide = {
    		"Autohide (1)": {
    			container: window,
    			position: 0,
    			buffer: -0.1
    		},
    		"Autohide (2)": { container: null, position: 0, buffer: 2 }
    	};

    	let code = false;
    	let nav = window.location.hash.substring(1);
    	if (nav == "") nav = "basic";
    	window.addEventListener("hashchange", e => $$invalidate(2, nav = window.location.hash.substring(1)));
    	let markdown = false;
    	let mdEl, apiEl;
    	if (nav == "markdown") markdown = true;

    	async function grab() {
    		let str = turndown.turndown(mdEl.outerHTML);
    		if (!navigator.clipboard) return;
    		await navigator.clipboard.writeText(str);
    		alert("markdown copied");
    	}

    	function getID(table, idx, no) {
    		let s = `Example ${idx + 1} - ${table.id}${no ? "" : " 🔗"}`;
    		if (no) return s;
    		return slugify(s);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const scroll_handler = e => $$invalidate(0, autohide["Autohide (1)"].position = window.scrollY, autohide);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			mdEl = $$value;
    			$$invalidate(4, mdEl);
    		});
    	}

    	const click_handler = e => $$invalidate(1, code = !code);

    	function div_binding_1($$value, table) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			autohide[table.id].container = $$value;
    			$$invalidate(0, autohide);
    			$$invalidate(5, all);
    		});
    	}

    	const scroll_handler_1 = (table, e) => $$invalidate(0, autohide[table.id].position = e.target.scrollTop, autohide);
    	const click_handler_1 = e => $$invalidate(3, markdown = !markdown);

    	$$self.$capture_state = () => ({
    		TurndownService,
    		tables,
    		Table,
    		slugify,
    		Auto,
    		data,
    		docs,
    		turndown,
    		keys,
    		many,
    		all,
    		scroller,
    		autohide,
    		code,
    		nav,
    		markdown,
    		mdEl,
    		apiEl,
    		grab,
    		getID
    	});

    	$$self.$inject_state = $$props => {
    		if ("turndown" in $$props) turndown = $$props.turndown;
    		if ("many" in $$props) many = $$props.many;
    		if ("autohide" in $$props) $$invalidate(0, autohide = $$props.autohide);
    		if ("code" in $$props) $$invalidate(1, code = $$props.code);
    		if ("nav" in $$props) $$invalidate(2, nav = $$props.nav);
    		if ("markdown" in $$props) $$invalidate(3, markdown = $$props.markdown);
    		if ("mdEl" in $$props) $$invalidate(4, mdEl = $$props.mdEl);
    		if ("apiEl" in $$props) apiEl = $$props.apiEl;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		autohide,
    		code,
    		nav,
    		markdown,
    		mdEl,
    		all,
    		scroller,
    		grab,
    		getID,
    		scroll_handler,
    		div_binding,
    		click_handler,
    		div_binding_1,
    		scroll_handler_1,
    		click_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
