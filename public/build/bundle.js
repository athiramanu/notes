
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
    'use strict';

    function noop() { }
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
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

    let dark = localStorage.getItem("darkTheme") == "true" ? true : false;

    const darkTheme = writable(dark);

    function convert (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    function Navaid(base, on404) {
    	var rgx, curr, routes=[], $={};

    	var fmt = $.format = function (uri) {
    		if (!uri) return uri;
    		uri = '/' + uri.replace(/^\/|\/$/g, '');
    		return rgx.test(uri) && uri.replace(rgx, '/');
    	};

    	base = '/' + (base || '').replace(/^\/|\/$/g, '');
    	rgx = base == '/' ? /^\/+/ : new RegExp('^\\' + base + '(?=\\/|$)\\/?', 'i');

    	$.route = function (uri, replace) {
    		if (uri[0] == '/' && !rgx.test(uri)) uri = base + uri;
    		history[(uri === curr || replace ? 'replace' : 'push') + 'State'](uri, null, uri);
    	};

    	$.on = function (pat, fn) {
    		(pat = convert(pat)).fn = fn;
    		routes.push(pat);
    		return $;
    	};

    	$.run = function (uri) {
    		var i=0, params={}, arr, obj;
    		if (uri = fmt(uri || location.pathname)) {
    			uri = uri.match(/[^\?#]*/)[0];
    			for (curr = uri; i < routes.length; i++) {
    				if (arr = (obj=routes[i]).pattern.exec(uri)) {
    					for (i=0; i < obj.keys.length;) {
    						params[obj.keys[i]] = arr[++i] || null;
    					}
    					obj.fn(params); // todo loop?
    					return $;
    				}
    			}
    			if (on404) on404(uri);
    		}
    		return $;
    	};

    	$.listen = function (u) {
    		wrap('push');
    		wrap('replace');

    		function run(e) {
    			$.run();
    		}

    		function click(e) {
    			var x = e.target.closest('a'), y = x && x.getAttribute('href');
    			if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented) return;
    			if (!y || x.target || x.host !== location.host || y[0] == '#') return;
    			if (y[0] != '/' || rgx.test(y)) {
    				e.preventDefault();
    				$.route(y);
    			}
    		}

    		addEventListener('popstate', run);
    		addEventListener('replacestate', run);
    		addEventListener('pushstate', run);
    		addEventListener('click', click);

    		$.unlisten = function () {
    			removeEventListener('popstate', run);
    			removeEventListener('replacestate', run);
    			removeEventListener('pushstate', run);
    			removeEventListener('click', click);
    		};

    		return $.run(u);
    	};

    	return $;
    }

    function wrap(type, fn) {
    	if (history[type]) return;
    	history[type] = type;
    	fn = history[type += 'State'];
    	history[type] = function (uri) {
    		var ev = new Event(type.toLowerCase());
    		ev.uri = uri;
    		fn.apply(this, arguments);
    		return dispatchEvent(ev);
    	};
    }

    /* src/components/Navbar.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/components/Navbar.svelte";

    // (5:8) {:else}
    function create_else_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Scribble It");
    			attr_dev(img, "class", "svelte-3xoge9");
    			add_location(img, file$3, 5, 8, 135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(5:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (3:8) {#if dark}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/logoDark.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Scribble It");
    			attr_dev(img, "class", "svelte-3xoge9");
    			add_location(img, file$3, 3, 8, 67);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(3:8) {#if dark}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let nav;
    	let a;
    	let t0;
    	let label;
    	let input;
    	let t1;
    	let span;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*dark*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			a = element("a");
    			if_block.c();
    			t0 = space();
    			label = element("label");
    			input = element("input");
    			t1 = space();
    			span = element("span");
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "homepage svelte-3xoge9");
    			add_location(a, file$3, 1, 4, 10);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-3xoge9");
    			add_location(input, file$3, 9, 8, 253);
    			attr_dev(span, "class", "slider round svelte-3xoge9");
    			add_location(span, file$3, 10, 8, 305);
    			attr_dev(label, "class", "switch svelte-3xoge9");
    			add_location(label, file$3, 8, 4, 202);
    			attr_dev(nav, "class", "svelte-3xoge9");
    			add_location(nav, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a);
    			if_block.m(a, null);
    			append_dev(nav, t0);
    			append_dev(nav, label);
    			append_dev(label, input);
    			input.checked = /*dark*/ ctx[0];
    			append_dev(label, t1);
    			append_dev(label, span);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[2]),
    					listen_dev(label, "click", /*toggle*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(a, null);
    				}
    			}

    			if (dirty & /*dark*/ 1) {
    				input.checked = /*dark*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	let dark;

    	const unsubscribe = darkTheme.subscribe(value => {
    		$$invalidate(0, dark = value);
    	});

    	function toggle(event) {
    		if (event.target.classList.contains("slider")) {
    			darkTheme.update(value => !value);
    			localStorage.setItem("darkTheme", dark);
    			$$invalidate(0, dark = !dark);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		dark = this.checked;
    		$$invalidate(0, dark);
    	}

    	$$self.$capture_state = () => ({ darkTheme, dark, unsubscribe, toggle });

    	$$self.$inject_state = $$props => {
    		if ("dark" in $$props) $$invalidate(0, dark = $$props.dark);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [dark, toggle, input_change_handler];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/App.svelte generated by Svelte v3.37.0 */
    const file$2 = "src/components/App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let navbar;
    	let t;
    	let switch_instance;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	var switch_value = /*Route*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*params*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(main, "class", "svelte-1xf7gps");
    			toggle_class(main, "dark", /*dark*/ ctx[2]);
    			add_location(main, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*Route*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}

    			if (dirty & /*dark*/ 4) {
    				toggle_class(main, "dark", /*dark*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			if (switch_instance) destroy_component(switch_instance);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let Route, params = {}, active;
    	let uri = location.pathname;
    	let dark;

    	const unsubscribe = darkTheme.subscribe(value => {
    		$$invalidate(2, dark = value);
    	});

    	function run(thunk, obj) {
    		const target = uri;

    		thunk.then(m => {
    			if (target !== uri) return;
    			$$invalidate(1, params = obj || {});

    			if (m.preload) {
    				m.preload({ params }).then(() => {
    					if (target !== uri) return;
    					$$invalidate(0, Route = m.default);
    					window.scrollTo(0, 0);
    				});
    			} else {
    				$$invalidate(0, Route = m.default);
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	function track(obj) {
    		$$invalidate(3, uri = obj.state || obj.uri || location.pathname);
    		if (window.ga) ga.send("pageview", { dp: uri });
    	}

    	addEventListener("replacestate", track);
    	addEventListener("pushstate", track);
    	addEventListener("popstate", track);
    	const router = Navaid("/").on("/", () => run(Promise.resolve().then(function () { return Home$1; }))).on("/:postid", obj => run(Promise.resolve().then(function () { return Note$1; }), obj)).listen();
    	onDestroy(router.unlisten);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		darkTheme,
    		onDestroy,
    		Navaid,
    		Navbar,
    		Route,
    		params,
    		active,
    		uri,
    		dark,
    		unsubscribe,
    		run,
    		track,
    		router
    	});

    	$$self.$inject_state = $$props => {
    		if ("Route" in $$props) $$invalidate(0, Route = $$props.Route);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("active" in $$props) active = $$props.active;
    		if ("uri" in $$props) $$invalidate(3, uri = $$props.uri);
    		if ("dark" in $$props) $$invalidate(2, dark = $$props.dark);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*uri*/ 8) {
    			active = uri.split("/")[1] || "home";
    		}
    	};

    	return [Route, params, dark, uri];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    new App({
    	target: document.body
    });

    /* src/components/Home.svelte generated by Svelte v3.37.0 */

    const file$1 = "src/components/Home.svelte";

    function create_fragment$1(ctx) {
    	let t0;
    	let h1;
    	let t2;
    	let section;
    	let div0;
    	let span0;
    	let t4;
    	let div1;
    	let span1;
    	let t5;
    	let strong0;
    	let t7;
    	let div2;
    	let span2;
    	let t9;
    	let div3;
    	let span3;
    	let t10;
    	let strong1;
    	let t12;
    	let div4;
    	let span4;
    	let t14;
    	let div5;
    	let strong2;
    	let t16;
    	let strong3;

    	const block = {
    		c: function create() {
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Instructions";
    			t2 = space();
    			section = element("section");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Choose a name for yor NotePad (max: 32 characters)";
    			t4 = space();
    			div1 = element("div");
    			span1 = element("span");
    			t5 = text("Append the name to the end of the url. eg: ");
    			strong0 = element("strong");
    			strong0.textContent = "/myNote";
    			t7 = space();
    			div2 = element("div");
    			span2 = element("span");
    			span2.textContent = "Type your note in the text area (max: 10000 characters)";
    			t9 = space();
    			div3 = element("div");
    			span3 = element("span");
    			t10 = text("Click on ");
    			strong1 = element("strong");
    			strong1.textContent = "Save";
    			t12 = space();
    			div4 = element("div");
    			span4 = element("span");
    			span4.textContent = "Use the new url to access the note from anywhere you want";
    			t14 = space();
    			div5 = element("div");
    			strong2 = element("strong");
    			strong2.textContent = "<<";
    			t16 = text(" Only 1000 notes are saved at a time. Old notes can get deleted ");
    			strong3 = element("strong");
    			strong3.textContent = ">>";
    			document.title = "ScribbleIt";
    			attr_dev(h1, "class", "svelte-3zhbts");
    			add_location(h1, file$1, 4, 0, 57);
    			attr_dev(span0, "class", "svelte-3zhbts");
    			add_location(span0, file$1, 7, 22, 126);
    			attr_dev(div0, "class", "item");
    			add_location(div0, file$1, 7, 4, 108);
    			attr_dev(strong0, "class", "svelte-3zhbts");
    			add_location(strong0, file$1, 8, 71, 267);
    			attr_dev(span1, "class", "svelte-3zhbts");
    			add_location(span1, file$1, 8, 22, 218);
    			attr_dev(div1, "class", "item");
    			add_location(div1, file$1, 8, 4, 200);
    			attr_dev(span2, "class", "svelte-3zhbts");
    			add_location(span2, file$1, 9, 22, 327);
    			attr_dev(div2, "class", "item");
    			add_location(div2, file$1, 9, 4, 309);
    			attr_dev(strong1, "class", "svelte-3zhbts");
    			add_location(strong1, file$1, 10, 37, 439);
    			attr_dev(span3, "class", "svelte-3zhbts");
    			add_location(span3, file$1, 10, 22, 424);
    			attr_dev(div3, "class", "item");
    			add_location(div3, file$1, 10, 4, 406);
    			attr_dev(span4, "class", "svelte-3zhbts");
    			add_location(span4, file$1, 11, 22, 496);
    			attr_dev(div4, "class", "item");
    			add_location(div4, file$1, 11, 4, 478);
    			attr_dev(strong2, "class", "svelte-3zhbts");
    			add_location(strong2, file$1, 12, 33, 606);
    			attr_dev(strong3, "class", "svelte-3zhbts");
    			add_location(strong3, file$1, 12, 122, 695);
    			attr_dev(div5, "class", "item disclaimer svelte-3zhbts");
    			add_location(div5, file$1, 12, 4, 577);
    			attr_dev(section, "class", "steps svelte-3zhbts");
    			add_location(section, file$1, 6, 0, 80);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, span0);
    			append_dev(section, t4);
    			append_dev(section, div1);
    			append_dev(div1, span1);
    			append_dev(span1, t5);
    			append_dev(span1, strong0);
    			append_dev(section, t7);
    			append_dev(section, div2);
    			append_dev(div2, span2);
    			append_dev(section, t9);
    			append_dev(section, div3);
    			append_dev(div3, span3);
    			append_dev(span3, t10);
    			append_dev(span3, strong1);
    			append_dev(section, t12);
    			append_dev(section, div4);
    			append_dev(div4, span4);
    			append_dev(section, t14);
    			append_dev(section, div5);
    			append_dev(div5, strong2);
    			append_dev(div5, t16);
    			append_dev(div5, strong3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(section);
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

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var Home$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Home
    });

    /* src/components/Note.svelte generated by Svelte v3.37.0 */

    const { console: console_1 } = globals;
    const file = "src/components/Note.svelte";

    function create_fragment(ctx) {
    	let t0;
    	let textarea;
    	let t1;
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = space();
    			textarea = element("textarea");
    			t1 = space();
    			div = element("div");
    			button = element("button");
    			button.textContent = "Save";
    			document.title = "NotePad";
    			attr_dev(textarea, "type", "text");
    			attr_dev(textarea, "class", "svelte-5a0vx4");
    			add_location(textarea, file, 4, 0, 54);
    			attr_dev(button, "class", "svelte-5a0vx4");
    			add_location(button, file, 6, 1, 126);
    			attr_dev(div, "class", "save svelte-5a0vx4");
    			add_location(div, file, 5, 0, 106);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*text*/ ctx[0]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[4]),
    					listen_dev(button, "click", /*save*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) {
    				set_input_value(textarea, /*text*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Note", slots, []);
    	let item = {};
    	let text = "";
    	let name = "";

    	function save() {
    		fetch(`${process.env.BACKEND_API}${name}`, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ text })
    		}).then(response => {
    			console.log("Updated");
    		}).catch(err => {
    			console.log(err);
    		});
    	}

    	function load(postid) {
    		const curr = item.id;
    		const isCurrent = curr && curr == postid;
    		if (!postid || isCurrent) return Promise.resolve(item);
    		name = postid;

    		return fetch(`${process.env.BACKEND_API}${name}`).then(r => r.json()).then(data => {
    			$$invalidate(0, text = data.text);
    		});
    	}

    	function preload(req) {
    		return load(req.params.postid);
    	}

    	let { params = {} } = $$props;

    	// Initial value (preload)
    	let post = item;

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Note> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		text = this.value;
    		$$invalidate(0, text);
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		item,
    		text,
    		name,
    		save,
    		load,
    		preload,
    		params,
    		post
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) item = $$props.item;
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("name" in $$props) name = $$props.name;
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    		if ("post" in $$props) post = $$props.post;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params*/ 8) {
    			// Reactively update `post` value
    			load(params.postid).then(obj => post = obj);
    		}
    	};

    	return [text, save, preload, params, textarea_input_handler];
    }

    class Note extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { preload: 2, params: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Note",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get preload() {
    		return this.$$.ctx[2];
    	}

    	set preload(value) {
    		throw new Error("<Note>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Note>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Note>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Note$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Note
    });

}());
//# sourceMappingURL=bundle.js.map
