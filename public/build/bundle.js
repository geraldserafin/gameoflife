
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
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
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
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
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.4' }, detail), true));
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

    class Cell$1 {
      constructor(x, y, state, neighbors) {
        this.x = x;
        this.y = y;
        this.state = state;
        this.neighbours = neighbors;
      }
    }

    class Rectangle {
      constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
      }

      contains(point) {
        return (
          point.x > this.x - this.w &&
          point.x < this.x + this.w &&
          point.y > this.y - this.h &&
          point.y < this.y + this.h
        );
      }

      // intersects(range) {
      //   return (
      //     range.x - range.w > this.x + this.w ||
      //     range.x + range.w < this.x - this.w ||
      //     range.y - range.h > this.y + this.h ||
      //     range.y + range.h < this.y - this.h
      //   );
      // }
    }

    class QuadTree {
      constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;

        this.points = [];
        this.divided = false;
      }

      subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w / 2;
        let h = this.boundary.h / 2;

        let nwBoundary = new Rectangle(x - w, y - h, w, h);
        this.nw = new QuadTree(nwBoundary, this.capacity);

        let neBoundary = new Rectangle(x + w, y - h, w, h);
        this.ne = new QuadTree(neBoundary, this.capacity);

        let swBoundary = new Rectangle(x - w, y + h, w, h);
        this.sw = new QuadTree(swBoundary, this.capacity);

        let seBoundary = new Rectangle(x + w, y + h, w, h);
        this.se = new QuadTree(seBoundary, this.capacity);

        this.divided = true;
      }

      insert(point) {
        if (!this.boundary.contains(point)) return;
        if (this.alreadyContains(point)) return;

        if (this.points.length < this.capacity) {
          this.points.push(point);
        } else {
          if (!this.divided) this.subdivide();

          this.nw.insert(point);
          this.ne.insert(point);
          this.sw.insert(point);
          this.se.insert(point);
        }
      }

      query(range, points) {
        this.points.forEach((point) => {
          points.push(point);
        });

        if (this.divided) {
          this.ne.query(range, points);
          this.nw.query(range, points);
          this.se.query(range, points);
          this.sw.query(range, points);
        }
      }

      // Game of life specific Functions
      alreadyContains(point) {
        this.points.forEach((p) => {
          if (p.x == point.x && p.y == point.y) {
            p.neighbours += 1;
            return true;
          }
        });
        return false;
      }
    }

    function setCell(x, y, tree) {
      tree.insert(new Cell$1(x, y, 1, 0));

      for (let i = x - 1; i < x + 2; i++) {
        for (let j = y - 1; j < y + 2; j++) {
          if (i != x || j != y) {
            tree.insert(new Cell$1(i, j, 0, 1));
          }
        }
      }
    }

    function initializeRandomBoard(x) {
      let boundary = new Rectangle(x / 2, x / 2, x, x);
      let board = new QuadTree(boundary, 1);

      for (let i = 0; i < (x * x) / 2; i++) {
        let a = Math.round(Math.random() * x);
        let b = Math.round(Math.random() * x);
        setCell(a, b, board);
      }

      return board;
    }

    function nextGeneration(board) {
      let newBoard = new QuadTree(board.boundary, board.capacity);
      let points = [];

      // query all points on the board
      // modifies points array
      board.query(board.boundary, points, false);
      console.log(points);

      points.forEach((point) => {
        if (point.state == 1) {
          if (point.neighbours >= 2 && point.neighbours <= 3) {
            newBoard.insert(new Cell$1(point.x, point.y, 1, 0));
          }
        } else {
          if (point.neighbours == 3) {
            newBoard.insert(new Cell$1(point.x, point.y, 1, 0));
          }
        }
      });

      return newBoard;
    }

    /* src/components/BoardPlayground.svelte generated by Svelte v3.42.4 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/components/BoardPlayground.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let canvas_1;
    	let t0;
    	let div0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let button2;
    	let t5_value = (/*isRunning*/ ctx[0] ? "stop" : "start") + "";
    	let t5;
    	let t6;
    	let span;
    	let t7;
    	let button3;
    	let t9;
    	let button4;
    	let t11;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			canvas_1 = element("canvas");
    			t0 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "random";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "clear";
    			t4 = space();
    			button2 = element("button");
    			t5 = text(t5_value);
    			t6 = space();
    			span = element("span");
    			t7 = text("speed\n      ");
    			button3 = element("button");
    			button3.textContent = "-";
    			t9 = space();
    			button4 = element("button");
    			button4.textContent = "+";
    			t11 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(canvas_1, "class", "canvas svelte-1a4fo14");
    			attr_dev(canvas_1, "width", screenSize);
    			attr_dev(canvas_1, "height", screenSize);
    			add_location(canvas_1, file$4, 152, 2, 3488);
    			add_location(button0, file$4, 154, 4, 3602);
    			add_location(button1, file$4, 155, 4, 3648);
    			add_location(button2, file$4, 156, 4, 3692);
    			add_location(button3, file$4, 159, 6, 3791);
    			add_location(button4, file$4, 160, 6, 3837);
    			add_location(span, file$4, 157, 4, 3766);
    			attr_dev(div0, "class", "ui svelte-1a4fo14");
    			add_location(div0, file$4, 153, 2, 3581);
    			add_location(div1, file$4, 151, 0, 3480);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, canvas_1);
    			/*canvas_1_binding*/ ctx[11](canvas_1);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(div0, t4);
    			append_dev(div0, button2);
    			append_dev(button2, t5);
    			append_dev(div0, t6);
    			append_dev(div0, span);
    			append_dev(span, t7);
    			append_dev(span, button3);
    			append_dev(span, t9);
    			append_dev(span, button4);
    			append_dev(div0, t11);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*random*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*clear*/ ctx[3], false, false, false),
    					listen_dev(button2, "click", /*startStop*/ ctx[4], false, false, false),
    					listen_dev(button3, "click", /*speedDown*/ ctx[6], false, false, false),
    					listen_dev(button4, "click", /*speedUp*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*isRunning*/ 1) && t5_value !== (t5_value = (/*isRunning*/ ctx[0] ? "stop" : "start") + "")) set_data_dev(t5, t5_value);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*canvas_1_binding*/ ctx[11](null);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
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

    const screenSize = 1000;

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BoardPlayground', slots, ['default']);
    	let { resolution } = $$props;
    	let { currentBrush } = $$props;

    	// states
    	let boundary = new Rectangle(resolution / 2, resolution / 2, resolution, resolution);

    	let board = new QuadTree(boundary, 1);
    	let isRunning = true;
    	let speed = 32;
    	let canvas;
    	let ctx;
    	let interval;

    	// camera
    	let cameraWidth = 30;

    	let scale = 1;
    	let currentOffset = 0;
    	const cellSize = screenSize / resolution;

    	const makeInterval = () => {
    		if (interval) clearInterval(interval);

    		interval = setInterval(
    			() => {
    				board = nextGeneration(board);
    				drawFrame();
    			},
    			speed
    		);
    	};

    	// Drawing
    	const drawGrid = () => {
    		let space = 1;

    		if (resolution >= 40) {
    			space = Math.round(resolution / 33);
    		}

    		for (let i = 1; i < resolution + 1; i += space) {
    			ctx.strokeStyle = "white";
    			ctx.lineWidth = 0.08;
    			ctx.beginPath();
    			ctx.moveTo(i * cellSize * scale, 0);
    			ctx.lineTo(i * cellSize * scale, screenSize);
    			ctx.stroke();
    			ctx.beginPath();
    			ctx.moveTo(0, i * cellSize * scale);
    			ctx.lineTo(screenSize, i * cellSize * scale);
    			ctx.stroke();
    		}
    	};

    	const drawFrame = () => {
    		ctx.clearRect(0, 0, screenSize, screenSize);
    		let cells = [];
    		board.query(board.boundary, cells);

    		// console.log(cells);
    		cells.forEach(cell => {
    			if (cell.state == 1) {
    				ctx.fillStyle = `rgba(255, 255, 255, ${Math.pow(1.0 / cell.state, 1.2)})`;
    				ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    			}
    		});

    		drawGrid();
    	};

    	const drawByHand = evt => {
    		var rect = canvas.getBoundingClientRect();
    		let x = Math.floor((evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height / (cellSize * scale)) + 1;
    		let y = Math.floor((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width / (cellSize * scale)) + 1;

    		for (let i = 0; i < currentBrush.length; i++) {
    			for (let j = 0; j < currentBrush[i].length; j++) {
    				if (currentBrush[i][j] > 0) {
    					board.insert(new Cell(x + i - Math.floor(currentBrush.length / 2), y + j - Math.floor(currentBrush[i].length / 2), 1, 0));
    				}
    			}
    		}

    		drawFrame();
    	};

    	// UI
    	const random = () => {
    		board = initializeRandomBoard(resolution);
    		drawFrame();
    	};

    	const clear = () => {
    		board = new QuadTree(boundary, 1);
    		drawFrame();
    	};

    	const startStop = () => {
    		$$invalidate(0, isRunning = !isRunning);
    		if (!isRunning) clearInterval(interval); else makeInterval();
    	};

    	const speedUp = () => {
    		speed -= speed / 2;
    		if (isRunning) makeInterval();
    	};

    	const speedDown = () => {
    		if (speed > 0) {
    			speed += speed * 2;
    			if (isRunning) makeInterval();
    		}
    	};

    	// on mount
    	onMount(() => {
    		ctx = canvas.getContext('2d');

    		canvas.addEventListener("click", evt => {
    			drawByHand(evt);
    		});

    		$$invalidate(
    			1,
    			canvas.onmousewheel = event => {
    				event.preventDefault();
    				const wheel = event.wheelDelta / 120;

    				if (wheel < 0) {
    					if (scale > 1) {
    						scale /= 2;
    					}
    				} else {
    					scale *= 2;
    				}

    				console.log(scale);
    				drawFrame();
    			},
    			canvas
    		);

    		drawFrame();

    		if (isRunning) {
    			startStop();
    		}
    	});

    	// clear interval on destory
    	onDestroy(() => {
    		clearInterval(interval);
    	});

    	const writable_props = ['resolution', 'currentBrush'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<BoardPlayground> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('resolution' in $$props) $$invalidate(7, resolution = $$props.resolution);
    		if ('currentBrush' in $$props) $$invalidate(8, currentBrush = $$props.currentBrush);
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		onMount,
    		QuadTree,
    		Rectangle,
    		nextGeneration,
    		initializeRandomBoard,
    		resolution,
    		currentBrush,
    		boundary,
    		board,
    		isRunning,
    		speed,
    		canvas,
    		ctx,
    		interval,
    		cameraWidth,
    		scale,
    		currentOffset,
    		screenSize,
    		cellSize,
    		makeInterval,
    		drawGrid,
    		drawFrame,
    		drawByHand,
    		random,
    		clear,
    		startStop,
    		speedUp,
    		speedDown
    	});

    	$$self.$inject_state = $$props => {
    		if ('resolution' in $$props) $$invalidate(7, resolution = $$props.resolution);
    		if ('currentBrush' in $$props) $$invalidate(8, currentBrush = $$props.currentBrush);
    		if ('boundary' in $$props) boundary = $$props.boundary;
    		if ('board' in $$props) board = $$props.board;
    		if ('isRunning' in $$props) $$invalidate(0, isRunning = $$props.isRunning);
    		if ('speed' in $$props) speed = $$props.speed;
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('interval' in $$props) interval = $$props.interval;
    		if ('cameraWidth' in $$props) cameraWidth = $$props.cameraWidth;
    		if ('scale' in $$props) scale = $$props.scale;
    		if ('currentOffset' in $$props) currentOffset = $$props.currentOffset;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isRunning,
    		canvas,
    		random,
    		clear,
    		startStop,
    		speedUp,
    		speedDown,
    		resolution,
    		currentBrush,
    		$$scope,
    		slots,
    		canvas_1_binding
    	];
    }

    class BoardPlayground extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { resolution: 7, currentBrush: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BoardPlayground",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*resolution*/ ctx[7] === undefined && !('resolution' in props)) {
    			console_1$1.warn("<BoardPlayground> was created without expected prop 'resolution'");
    		}

    		if (/*currentBrush*/ ctx[8] === undefined && !('currentBrush' in props)) {
    			console_1$1.warn("<BoardPlayground> was created without expected prop 'currentBrush'");
    		}
    	}

    	get resolution() {
    		throw new Error("<BoardPlayground>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set resolution(value) {
    		throw new Error("<BoardPlayground>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentBrush() {
    		throw new Error("<BoardPlayground>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentBrush(value) {
    		throw new Error("<BoardPlayground>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Board.svelte generated by Svelte v3.42.4 */

    const { console: console_1 } = globals;
    const file$3 = "src/components/Board.svelte";

    // (19:4) <BoardPlayground {resolution} {currentBrush}>
    function create_default_slot(ctx) {
    	let span;
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("resolution\n        ");
    			button0 = element("button");
    			button0.textContent = "-";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			add_location(button0, file$3, 21, 8, 419);
    			add_location(button1, file$3, 22, 8, 472);
    			add_location(span, file$3, 19, 6, 385);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, button0);
    			append_dev(span, t2);
    			append_dev(span, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*resolutionDown*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*resolutionUp*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(19:4) <BoardPlayground {resolution} {currentBrush}>",
    		ctx
    	});

    	return block;
    }

    // (18:2) {#key resolution}
    function create_key_block(ctx) {
    	let boardplayground;
    	let current;

    	boardplayground = new BoardPlayground({
    			props: {
    				resolution: /*resolution*/ ctx[1],
    				currentBrush: /*currentBrush*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(boardplayground.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(boardplayground, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const boardplayground_changes = {};
    			if (dirty & /*resolution*/ 2) boardplayground_changes.resolution = /*resolution*/ ctx[1];
    			if (dirty & /*currentBrush*/ 1) boardplayground_changes.currentBrush = /*currentBrush*/ ctx[0];

    			if (dirty & /*$$scope*/ 16) {
    				boardplayground_changes.$$scope = { dirty, ctx };
    			}

    			boardplayground.$set(boardplayground_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(boardplayground.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(boardplayground.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(boardplayground, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(18:2) {#key resolution}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let previous_key = /*resolution*/ ctx[1];
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			key_block.c();
    			add_location(div, file$3, 16, 0, 303);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			key_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*resolution*/ 2 && safe_not_equal(previous_key, previous_key = /*resolution*/ ctx[1])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(div, null);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			key_block.d(detaching);
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
    	validate_slots('Board', slots, []);
    	let { currentBrush } = $$props;
    	let resolution = 30;

    	const resolutionUp = () => {
    		$$invalidate(1, resolution += 50);
    		console.log(resolution);
    	};

    	const resolutionDown = () => {
    		$$invalidate(1, resolution -= resolution >= 100 ? 50 : 10);
    	};

    	const writable_props = ['currentBrush'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Board> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('currentBrush' in $$props) $$invalidate(0, currentBrush = $$props.currentBrush);
    	};

    	$$self.$capture_state = () => ({
    		BoardPlayground,
    		currentBrush,
    		resolution,
    		resolutionUp,
    		resolutionDown
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentBrush' in $$props) $$invalidate(0, currentBrush = $$props.currentBrush);
    		if ('resolution' in $$props) $$invalidate(1, resolution = $$props.resolution);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentBrush, resolution, resolutionUp, resolutionDown];
    }

    class Board extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { currentBrush: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentBrush*/ ctx[0] === undefined && !('currentBrush' in props)) {
    			console_1.warn("<Board> was created without expected prop 'currentBrush'");
    		}
    	}

    	get currentBrush() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentBrush(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const brushes = [
      {
        name: "blocks",
        brushes: [
          {
            name: "point",
            shape: [[1]],
          },
        ],
      },
      {
        name: "space ships",
        brushes: [
          {
            name: "glider",
            shape: [
              [0, 0, 1],
              [1, 0, 1],
              [0, 1, 1],
            ],
          },
          {
            name: "LWSS",
            shape: [
              [1, 0, 0, 1, 0],
              [0, 0, 0, 0, 1],
              [1, 0, 0, 0, 1],
              [0, 1, 1, 1, 1],
            ],
          },
          {
            name: "LWSS",
            shape: [
              [
                0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                1, 1, 1, 0, 0, 0, 0, 0,
              ],
              [
                0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                0, 0, 0, 1, 0, 0, 0, 0,
              ],
              [
                0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
                0, 0, 0, 1, 1, 0, 0, 0,
              ],
              [
                0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0,
                1, 1, 0, 1, 0, 1, 0, 0,
              ],
              [
                0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0,
                0, 0, 0, 1, 0, 1, 1, 0,
              ],
              [
                1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0,
                0, 0, 1, 0, 0, 0, 0, 1,
              ],
              [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0,
              ],
              [
                1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0,
                0, 0, 0, 0, 0, 0, 1, 1,
              ],
            ],
          },
        ],
      },
      {
        name: "grow",
        brushes: [
          {
            name: "Paul Callhan's 5x5",
            shape: [
              [1, 1, 1, 0, 1],
              [1, 0, 0, 0, 0],
              [0, 0, 0, 1, 1],
              [0, 1, 1, 0, 1],
              [1, 0, 1, 0, 1],
            ],
          },
          {
            name: "g1",
            shape: [
              [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
              [1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
              [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
            ],
          },
        ],
      },
      {
        name: "rubber",
        brushes: [
          {
            name: "rubber",
            shape: [[0]],
          },
        ],
      },
    ];

    /* src/components/BrushPreview.svelte generated by Svelte v3.42.4 */
    const file$2 = "src/components/BrushPreview.svelte";

    function create_fragment$2(ctx) {
    	let canvas_1;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "height", height);
    			attr_dev(canvas_1, "width", width);
    			add_location(canvas_1, file$2, 36, 0, 686);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[2](canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[2](null);
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

    const height = 24, width = 24;

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BrushPreview', slots, []);
    	let { shape } = $$props;
    	let canvas;
    	let ctx;

    	const draw = shape => {
    		ctx.fillStyle = `white`;
    		let cellWidth = width / shape.length;
    		let cellHeigth = height / shape[0].length;

    		if (cellHeigth < cellWidth) {
    			cellWidth = cellHeigth;
    		} else {
    			cellHeigth = cellWidth;
    		}

    		for (let i = 0; i < shape.length; i++) {
    			for (let j = 0; j < shape[i].length; j++) {
    				if (shape[i][j] >= 1) {
    					ctx.fillRect(j * cellHeigth, i * cellWidth, cellWidth, cellHeigth);
    				}
    			}
    		}
    	};

    	onMount(() => {
    		ctx = canvas.getContext("2d");
    		draw(shape);
    	});

    	const writable_props = ['shape'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BrushPreview> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shape' in $$props) $$invalidate(1, shape = $$props.shape);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		shape,
    		canvas,
    		ctx,
    		height,
    		width,
    		draw
    	});

    	$$self.$inject_state = $$props => {
    		if ('shape' in $$props) $$invalidate(1, shape = $$props.shape);
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvas, shape, canvas_1_binding];
    }

    class BrushPreview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { shape: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BrushPreview",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*shape*/ ctx[1] === undefined && !('shape' in props)) {
    			console.warn("<BrushPreview> was created without expected prop 'shape'");
    		}
    	}

    	get shape() {
    		throw new Error("<BrushPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shape(value) {
    		throw new Error("<BrushPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Toolbox.svelte generated by Svelte v3.42.4 */
    const file$1 = "src/components/Toolbox.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (13:8) {#each brush.brushes as bru}
    function create_each_block_1(ctx) {
    	let button;
    	let brushpreview;
    	let t;
    	let current;
    	let mounted;
    	let dispose;

    	brushpreview = new BrushPreview({
    			props: { shape: /*bru*/ ctx[5].shape },
    			$$inline: true
    		});

    	function click_handler() {
    		return /*click_handler*/ ctx[1](/*bru*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			create_component(brushpreview.$$.fragment);
    			t = space();
    			attr_dev(button, "class", "svelte-jw02l2");
    			add_location(button, file$1, 13, 10, 323);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			mount_component(brushpreview, button, null);
    			append_dev(button, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(brushpreview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(brushpreview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			destroy_component(brushpreview);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(13:8) {#each brush.brushes as bru}",
    		ctx
    	});

    	return block;
    }

    // (10:2) {#each brushes as brush}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let current;
    	let each_value_1 = /*brush*/ ctx[2].brushes;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$1, 11, 6, 258);
    			attr_dev(div1, "class", "toolbox-section");
    			add_location(div1, file$1, 10, 2, 222);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentBrush, brushes*/ 1) {
    				each_value_1 = /*brush*/ ctx[2].brushes;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(10:2) {#each brushes as brush}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let span;
    	let t1;
    	let current;
    	let each_value = brushes;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "patterns";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "svelte-jw02l2");
    			add_location(span, file$1, 8, 2, 171);
    			attr_dev(div, "class", "col toolbox svelte-jw02l2");
    			add_location(div, file$1, 7, 0, 143);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*brushes, currentBrush*/ 1) {
    				each_value = brushes;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots('Toolbox', slots, []);
    	let { currentBrush } = $$props;
    	const writable_props = ['currentBrush'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Toolbox> was created with unknown prop '${key}'`);
    	});

    	const click_handler = bru => $$invalidate(0, currentBrush = bru.shape);

    	$$self.$$set = $$props => {
    		if ('currentBrush' in $$props) $$invalidate(0, currentBrush = $$props.currentBrush);
    	};

    	$$self.$capture_state = () => ({ brushes, BrushPreview, currentBrush });

    	$$self.$inject_state = $$props => {
    		if ('currentBrush' in $$props) $$invalidate(0, currentBrush = $$props.currentBrush);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentBrush, click_handler];
    }

    class Toolbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { currentBrush: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toolbox",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentBrush*/ ctx[0] === undefined && !('currentBrush' in props)) {
    			console.warn("<Toolbox> was created without expected prop 'currentBrush'");
    		}
    	}

    	get currentBrush() {
    		throw new Error("<Toolbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentBrush(value) {
    		throw new Error("<Toolbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.42.4 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let div;
    	let toolbox;
    	let updating_currentBrush;
    	let t2;
    	let board;
    	let current;

    	function toolbox_currentBrush_binding(value) {
    		/*toolbox_currentBrush_binding*/ ctx[1](value);
    	}

    	let toolbox_props = {};

    	if (/*currentBrush*/ ctx[0] !== void 0) {
    		toolbox_props.currentBrush = /*currentBrush*/ ctx[0];
    	}

    	toolbox = new Toolbox({ props: toolbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(toolbox, 'currentBrush', toolbox_currentBrush_binding));

    	board = new Board({
    			props: { currentBrush: /*currentBrush*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Conway's Game Of Life";
    			t1 = space();
    			div = element("div");
    			create_component(toolbox.$$.fragment);
    			t2 = space();
    			create_component(board.$$.fragment);
    			add_location(h2, file, 8, 1, 156);
    			attr_dev(div, "class", "row svelte-1ubvjxu");
    			add_location(div, file, 9, 1, 188);
    			attr_dev(main, "class", "svelte-1ubvjxu");
    			add_location(main, file, 7, 0, 148);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);
    			append_dev(main, div);
    			mount_component(toolbox, div, null);
    			append_dev(div, t2);
    			mount_component(board, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const toolbox_changes = {};

    			if (!updating_currentBrush && dirty & /*currentBrush*/ 1) {
    				updating_currentBrush = true;
    				toolbox_changes.currentBrush = /*currentBrush*/ ctx[0];
    				add_flush_callback(() => updating_currentBrush = false);
    			}

    			toolbox.$set(toolbox_changes);
    			const board_changes = {};
    			if (dirty & /*currentBrush*/ 1) board_changes.currentBrush = /*currentBrush*/ ctx[0];
    			board.$set(board_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toolbox.$$.fragment, local);
    			transition_in(board.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toolbox.$$.fragment, local);
    			transition_out(board.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(toolbox);
    			destroy_component(board);
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
    	validate_slots('App', slots, []);
    	let currentBrush = [[1]];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function toolbox_currentBrush_binding(value) {
    		currentBrush = value;
    		$$invalidate(0, currentBrush);
    	}

    	$$self.$capture_state = () => ({ Board, Toolbox, currentBrush });

    	$$self.$inject_state = $$props => {
    		if ('currentBrush' in $$props) $$invalidate(0, currentBrush = $$props.currentBrush);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentBrush, toolbox_currentBrush_binding];
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
      target: document.body,
      props: {},
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
