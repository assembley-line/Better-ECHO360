// ==UserScript==
// @name         Better ECHO360 (Experimental)
// @namespace    http://tampermonkey.net/
// @version      1.0.1-beta
// @author       CharlieR
// @description  Enhances the ECHO360 experience with additional features.
// @icon         https://messenger-assets.qualified.com/uploads/7U9KEay8tEHtKtBg3eDboiKsuxNZ8Nez9e2jt/303ad5416775b60078af5eb38a6c20687c530d5f5e5a9ce7cb72df2d11cf86c5.png
// @downloadURL  https://github.com/assembley-line/Better-ECHO360/raw/refs/heads/main/dist/__EXPERIMENTAL.better-e360.user.js
// @updateURL    https://github.com/assembley-line/Better-ECHO360/raw/refs/heads/main/dist/__EXPERIMENTAL.better-e360.user.js
// @match        *://echo360.net.au/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
	"use strict";
	var Reporter = class Reporter {
		static REPORT_ATTACHES = false;
		name;
		constructor(name) {
			this.name = name;
		}
		static prefix = "Better ECHO360";
		init() {
			if (Reporter.REPORT_ATTACHES) this.report("Reporter attached");
		}
		stamp(input) {
			return `[${Reporter.prefix}] [${this.name}] ${input}`;
		}
		tell(message) {
			console.info(this.stamp(message));
		}
		report(message) {
			console.log(this.stamp(message));
		}
		warn(message) {
			console.warn(this.stamp(message));
		}
		scream(message) {
			console.error(this.stamp(message));
		}
	};
	function enumName(enumObj, value) {
		return Object.keys(enumObj).find((k) => !/^\d+$/.test(k) && enumObj[k] === value);
	}
	var w = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
	var ZustandStore = function(ZustandStore) {
		ZustandStore["PlayerStore"] = "playbackRate";
		ZustandStore["TranscriptStore"] = "transcripts";
		return ZustandStore;
	}({});
	var HackerService = class HackerService {
		static stores = {};
		static _reporter = null;
		static get reporter() {
			if (!HackerService._reporter) {
				HackerService._reporter = new Reporter("Hacker");
				HackerService._reporter.init();
			}
			return HackerService._reporter;
		}
		constructor() {}
		static grab(store) {
			const cached = HackerService.stores[store];
			if (cached) return cached;
			const found = HackerService.findStore(store);
			if (found) HackerService.stores[store] = found;
			return found;
		}
		static findStore(store) {
			var prefix = `(${enumName(ZustandStore, store)}) `;
			HackerService.reporter.report(prefix + "Finding");
			var req = w.__cr;
			if (!req) {
				var chunkNames = [];
				Object.keys(w).forEach(function(k) {
					if (/^webpackJsonp/.test(k) || /^webpackChunk/.test(k)) chunkNames.push(k);
				});
				for (var n = 0; n < chunkNames.length; n++) {
					var arr = w[chunkNames[n]];
					if (!Array.isArray(arr)) continue;
					try {
						arr.push([
							[],
							{ __grabber__: function(module, exports, __webpack_require__) {
								w.__cr = __webpack_require__;
							} },
							[["__grabber__"]]
						]);
					} catch (e) {}
					if (w.__cr) {
						req = w.__cr;
						break;
					}
				}
			}
			if (!req) {
				this.reporter.warn("Could not capture webpack require — no webpackJsonp/webpackChunk array found");
				return null;
            }
			var cache = req.c;
			var candidates = [];
			for (var id in cache) {
				var exp;
				try {
					exp = cache[id] && cache[id].exports;
				} catch (e) {
					continue;
				}
				if (!exp) continue;
				var values;
				try {
					values = [exp, exp.default].concat(Object.values(exp));
				} catch (e) {
					continue;
				}
				for (var i = 0; i < values.length; i++) {
					var val = values[i];
					try {
						if (val && typeof val.getState === "function" || typeof val.setState === "function") candidates.push(val);
					} catch (e) {}
				}
			}
			this.reporter.report(prefix + "Found: " + candidates.length + " candidates");
			var match = candidates.find(function(s) {
				try {
					return store.valueOf() in s.getState();
				} catch (e) {
					return false;
				}
			});
			w.__candidates = candidates;
			if (!match) this.reporter.warn(prefix + "No matches found, look to window.__candidates for more");
			else this.reporter.report(prefix + "Found store");
			return match || null;
		}
	};
	var Service = class {
		reporter;
		constructor(name) {
			this.reporter = new Reporter(name);
			this.reporter.init();
		}
	};
	var HardService = class extends Service {};
	var SoftService = class extends Service {
		enabled;
		constructor(name) {
			super(name);
			this.enabled = true;
		}
		enable() {
			this.reporter.tell("Service has been enabled");
			this.enabled = true;
			this.onToggleService();
		}
		disable() {
			this.reporter.tell("Service has been disabled");
			this.enabled = false;
			this.onToggleService();
		}
		toggle() {
			if (this.enabled) this.disable();
			else this.enable();
		}
		onToggleService() {}
	};
	var StoreService = class extends SoftService {
		closed = false;
		dependencies;
		constructor(name, dependencies) {
			super(name);
			this.dependencies = dependencies;
			for (const dependency of dependencies) if (!HackerService.grab(dependency)) {
				this.reporter.warn("Failed to resolve all dependencies, closing service");
				this.close();
				return;
			}
		}
		close() {
			this.reporter.scream("Service has been closed");
			this.closed = true;
			this.onCloseService();
		}
		onCloseService() {}
	};
	function waitForElement(selector, timeoutMs = 1e4) {
		return new Promise((resolve) => {
			function start() {
				const existing = document.querySelector(selector);
				if (existing && existing instanceof HTMLElement) {
					resolve(existing);
					return;
				}
				let settled = false;
				const observer = new MutationObserver(() => {
					const el = document.querySelector(selector);
					if (el && !settled && el instanceof HTMLElement) {
						settled = true;
						observer.disconnect();
						clearTimeout(timeout);
						resolve(el);
					}
				});
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
				const timeout = setTimeout(() => {
					if (settled) return;
					settled = true;
					observer.disconnect();
					resolve(null);
				}, timeoutMs);
			}
			if (document.body) start();
			else document.addEventListener("DOMContentLoaded", start, { once: true });
		});
	}
	var Toolbar = class Toolbar extends HardService {
		static locating = null;
		constructor() {
			super("Toolbar");
			this.locate();
		}
		locate() {
			return Toolbar.locating ??= (async () => {
				const fullscreenButton = await waitForElement("#fullscreen-toggle-btn");
				if (!fullscreenButton) {
					this.reporter.warn("Could not find the fullscreen button to locate the toolbar.");
					return null;
				}
				const toolbar = fullscreenButton.parentElement;
				if (!toolbar) {
					this.reporter.warn("Could not find the toolbar element.");
					return null;
				}
				return toolbar;
			})();
		}
		getElement() {
			return this.locate();
		}
		async addIconButton(iconClasses, handler) {
			const toolbar = await this.getElement();
			if (!toolbar) return;
			const iconButton = document.createElement("button");
			const icon = document.createElement("i");
			icon.classList.add(...iconClasses);
			iconButton.appendChild(icon);
			iconButton.classList.add("icon-button-captions");
			if (handler) iconButton.addEventListener("click", handler);
			toolbar.prepend(iconButton);
			return iconButton;
		}
	};
	var CaptionsService = class CaptionsService extends StoreService {
		static wrapperId = "better-echo360-caption-wrapper";
		static boxId = "better-echo360-captions";
		currentCueEnd = -1;
		captionsBox = null;
		unsub = null;
		captionsIconButton = null;
		constructor() {
			super("Captions", [ZustandStore.PlayerStore, ZustandStore.TranscriptStore]);
			if (this.closed) return;
			this.init();
		}
		init() {
			this.cues = this.getAllCues();
			this.UI_AttachButtonToToolbar();
			this.attach();
		}
		onToggleService() {
			if (this.enabled) this.attach();
			else this.destroy();
		}
		onCloseService() {
			this.destroy();
			this.UI_RemoveButtonFromToolbar();
		}
		cues = null;
		fetchCount = 0;
		stopFetching = false;
		maxFetchAttempts = 20;
		getAllCues() {
			if (this.fetchCount > this.maxFetchAttempts) {
				this.reporter.warn("Max fetch attempts reached for cues, stopping further attempts.");
				this.close();
				return null;
			}
			this.fetchCount += 1;
			return HackerService.grab(ZustandStore.TranscriptStore).getState().transcripts || null;
		}
		getCueFromTimestamp(timestamp) {
			if (!this.cues) {
				if (this.stopFetching) return null;
				this.cues = this.getAllCues();
				if (!this.cues) return null;
			}
			const ms = timestamp * 1e3;
			for (var i = 0; i < this.cues.length; i++) {
				const cue = this.cues[i];
				if (ms >= cue.startMs && ms < cue.endMs) return {
					content: cue.content,
					end: Math.floor(cue.endMs / 1e3)
				};
			}
			return null;
		}
		attach() {
			this.reporter.tell("Attaching captions box");
			this.captionsBox = this.setupCaptionBox();
			this.unsub = HackerService.grab(ZustandStore.PlayerStore).subscribe((state) => {
				const timestamp = state.currentTime;
				if (timestamp < this.currentCueEnd) return;
				const cue = this.getCueFromTimestamp(timestamp);
				var content = "";
				if (cue) {
					content = cue.content;
					this.currentCueEnd = cue.end;
				} else {
					content = "";
					this.currentCueEnd = -1;
				}
				this.captionsBox.textContent = content;
			});
		}
		setupCaptionBox() {
			const wrapper = document.createElement("div");
			wrapper.id = CaptionsService.wrapperId;
			wrapper.style.cssText = [
				"position:fixed",
				"left:0",
				"right:0",
				"bottom:60px",
				"width:100%",
				"display:flex",
				"justify-content:center",
				"pointer-events:none",
				"z-index:2147483647"
			].join(";");
			const box = document.createElement("div");
			box.id = CaptionsService.boxId;
			box.style.cssText = [
				"max-width:80%",
				"background:rgba(0,0,0,0.75)",
				"color:#ffffff",
				"font:20px -apple-system,BlinkMacSystemFont,\"Segoe UI\",Helvetica,Arial,sans-serif",
				"padding:6px 14px",
				"border-radius:6px",
				"text-align:center",
				"white-space:pre-wrap"
			].join(";");
			box.textContent = "";
			wrapper.appendChild(box);
			const attach = () => {
				if (document.body) document.body.appendChild(wrapper);
				else document.addEventListener("DOMContentLoaded", attach, { once: true });
			};
			attach();
			return box;
		}
		async UI_AttachButtonToToolbar() {
			const button = await new Toolbar().addIconButton(["ph", "ph-closed-captioning"]);
			if (!button) return;
			button.toggleAttribute("data-enabled", this.enabled);
			button.addEventListener("click", () => {
				this.toggle();
				button.toggleAttribute("data-enabled", this.enabled);
			});
			this.captionsIconButton = button;
		}
		async UI_RemoveButtonFromToolbar() {
			if (this.captionsIconButton) {
				this.captionsIconButton.remove();
				this.captionsIconButton = null;
			}
		}
		destroy() {
			if (this.unsub) {
				this.unsub();
				this.unsub = null;
			}
			document.getElementById(CaptionsService.wrapperId)?.remove();
		}
	};
	function youtubeId(input) {
		let u;
		try {
			u = new URL(input);
		} catch {
			return null;
		}
		const host = u.hostname.replace(/^www\.|^m\./, "");
		let id = null;
		if (host === "youtu.be") id = u.pathname.slice(1);
		else if (host === "youtube.com" || host === "youtube-nocookie.com") {
			if (u.pathname === "/watch") id = u.searchParams.get("v");
			else {
				const m = /^\/(embed|shorts|live)\/([^/?]+)/.exec(u.pathname);
				id = m ? m[2] : null;
			}
		}
		return id && /^[\w-]{11}$/.test(id) ? id : null;
	}
	function createEmbed(url, { zoom = 1, sourceAspect = 16 / 9 } = {}) {
		const id = youtubeId(url);
		if (!id) return null;
		const wrap = document.createElement("div");
		wrap.style.cssText = "position:relative;overflow:hidden;container-type:size;pointer-events:none;background:#000;";
		const frame = document.createElement("iframe");
		frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&fs=0&iv_load_policy=3&rel=0&playsinline=1`;
		frame.allow = "autoplay; encrypted-media";
		frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
		frame.style.cssText = `
        position:absolute; top:50%; left:50%; border:0;
        height:${zoom * 100}cqh;
        width:${zoom * 100 * sourceAspect}cqh;
        transform:translate(-50%,-50%);
    `;
		wrap.appendChild(frame);
		return wrap;
	}
	var PhoneService = class PhoneService extends SoftService {
		static videoUrl = "https://www.youtube.com/watch?v=_bwtEtYQwgc";
		button = null;
		phoneEl = null;
		constructor() {
			super("Phone");
			this.disable();
			this.UI_attachButton();
		}
		onToggleService() {
			this.button?.toggleAttribute("data-enabled", this.enabled);
			if (this.enabled) this.UI_attachPhoneWindow();
			else this.UI_removePhoneWindow();
		}
		UI_attachPhoneWindow() {
			if (this.phoneEl) return;
			const el = createEmbed(PhoneService.videoUrl, { zoom: 1.05 });
			if (!el) return;
			Object.assign(el.style, {
				position: "fixed",
				bottom: "10px",
				right: "10px",
				width: "281px",
				height: "500px",
				zIndex: "10000",
				borderRadius: "8px",
				boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
			});
			this.phoneEl = el;
			document.body.appendChild(el);
		}
		UI_removePhoneWindow() {
			this.phoneEl?.remove();
			this.phoneEl = null;
		}
		async UI_attachButton() {
			const iconClass = "ph-device-mobile-speaker";
			const toolbar = new Toolbar();
			this.button = await toolbar.addIconButton(["ph", iconClass]) ?? null;
			if (!this.button) return;
			this.button.toggleAttribute("data-enabled", this.enabled);
			this.button.addEventListener("click", () => {
				this.toggle();
			});
		}
	};
	var TimeMachineService = class extends StoreService {
		constructor() {
			super("Time Machine", [ZustandStore.PlayerStore]);
			if (this.closed) return;
			this.setupShopInTheHeader();
		}
		displayBoxId = "better-echo360-box";
		paddingOffset = 4;
		setupShopInTheHeader() {
			const selections = document.getElementsByClassName("header");
			var box = document.createElement("div");
			box.id = this.displayBoxId;
			if (selections.length == 0) {
				console.error("No header found");
				box.style.cssText = [
					"position:fixed",
					"top:10px",
					"right:10px",
					"z-index:2147483647",
					"padding:0px"
				].join(";");
				const attach = () => {
					if (document.body) {
						document.body.appendChild(box);
						this.createSpeedSelector(box).onChange((item) => {
							this.setPlaybackSpeed(item.speed);
						});
					} else document.addEventListener("DOMContentLoaded", attach, { once: true });
				};
				attach();
			} else {
				const header = selections[0];
				const boxHeight = header.offsetHeight - 2 * this.paddingOffset;
				box.style.cssText = [
					"position:fixed",
					`top:${this.paddingOffset}px`,
					`right:${this.paddingOffset}px`,
					"z-index:2147483647",
					"padding:0px",
					`height:${boxHeight}px`
				].join(";");
				const attach = () => {
					if (document.body) {
						header.appendChild(box);
						this.createSpeedSelector(box).onChange((item) => {
							this.setPlaybackSpeed(item.speed);
						});
					} else document.addEventListener("DOMContentLoaded", attach, { once: true });
				};
				attach();
			}
		}
		createSpeedSelector(container) {
			if (!document.getElementById("seg-styles")) {
				var style = document.createElement("style");
				style.id = "seg-styles";
				style.textContent = `
      .seg-control{--seg-radius:5px;position:relative;display:flex;gap:2px;width:200px;height:100%;box-sizing:border-box;background:#ffffff;border-radius:var(--seg-radius);padding:3px;user-select:none;-webkit-user-select:none;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
      .seg-highlight{position:absolute;top:3px;left:3px;height:calc(100% - 6px);width:calc((100% - 6px) / 5);background:rgba(0,0,0,0.05);border-radius:var(--seg-radius);box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .28s cubic-bezier(.4,0,.2,1);z-index:1}
      .seg-item{position:relative;flex:1;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#8e8d89;z-index:2;transition:color .2s,font-weight .2s}
      .seg-item.active{color:#000000;font-weight:600}
    `;
				document.head.appendChild(style);
			}
			var speeds = [
				{
					speed: 1,
					label: "1x"
				},
				{
					speed: 1.5,
					label: "1.5x"
				},
				{
					speed: 2,
					label: "2x"
				},
				{
					speed: 2.5,
					label: "2.5x"
				},
				{
					speed: 3,
					label: "3x"
				}
			];
			var control = document.createElement("div");
			control.className = "seg-control";
			control.tabIndex = 0;
			control.innerHTML = "<div class=\"seg-highlight\"></div>" + speeds.map(function(s, i) {
				return "<div class=\"seg-item\" data-i=\"" + i + "\">" + s.label + "</div>";
			}).join("");
			container.appendChild(control);
			var highlight = control.querySelector(".seg-highlight");
			var items = control.querySelectorAll(".seg-item");
			var n = items.length;
			var index = 0;
			var dragging = false;
			var onChangeFn = null;
			function render() {
				highlight.style.transform = "translateX(" + index * 100 + "%)";
				items.forEach(function(el, i) {
					el.classList.toggle("active", i === index);
				});
			}
			function setIndex(i) {
				i = Math.max(0, Math.min(n - 1, i));
				if (i === index) return;
				index = i;
				render();
				if (onChangeFn) onChangeFn(speeds[index], index);
			}
			function indexFromX(clientX) {
				var rect = control.getBoundingClientRect();
				var pct = Math.max(0, Math.min(.999, (clientX - rect.left) / rect.width));
				return Math.floor(pct * n);
			}
			function down(e) {
				dragging = true;
				highlight.style.transition = "none";
				setIndex(indexFromX(e.touches ? e.touches[0].clientX : e.clientX));
				e.preventDefault();
			}
			function move(e) {
				if (!dragging) return;
				setIndex(indexFromX(e.touches ? e.touches[0].clientX : e.clientX));
			}
			function up() {
				if (!dragging) return;
				dragging = false;
				highlight.style.transition = "";
			}
			control.addEventListener("mousedown", down);
			control.addEventListener("touchstart", down, { passive: false });
			window.addEventListener("mousemove", move);
			window.addEventListener("touchmove", move, { passive: false });
			window.addEventListener("mouseup", up);
			window.addEventListener("touchend", up);
			control.addEventListener("keydown", function(e) {
				if (e.key === "ArrowRight") {
					setIndex(index + 1);
					e.preventDefault();
				}
				if (e.key === "ArrowLeft") {
					setIndex(index - 1);
					e.preventDefault();
				}
			});
			render();
			return {
				get: function() {
					return speeds[index];
				},
				set: function(i) {
					setIndex(i);
				},
				onChange: function(fn) {
					onChangeFn = fn;
				}
			};
		}
		setPlaybackSpeed(speed) {
			var targetSpeed = speed || 1;
			try {
				HackerService.grab(ZustandStore.PlayerStore).getState().onPlaybackRateChange(targetSpeed);
			} catch (e) {
				this.reporter.scream("Something went wrong on rate change");
				console.error(e);
			}
		}
	};
	function lesson() {
		window.addEventListener("load", function() {
			new TimeMachineService();
			new CaptionsService();
			new PhoneService();
		});
	}
	var DEFAULT_CONFIG = {
		lang: void 0,
		message: void 0,
		abortEarly: void 0,
		abortPipeEarly: void 0
	};
	function getGlobalConfig(config$1) {
		if (!config$1 && true) return DEFAULT_CONFIG;
		return {
			lang: config$1?.lang ?? void 0,
			message: config$1?.message,
			abortEarly: config$1?.abortEarly ?? void 0,
			abortPipeEarly: config$1?.abortPipeEarly ?? void 0
		};
	}
	function _stringify(input) {
		const type = typeof input;
		if (type === "string") return `"${input}"`;
		if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
		if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
		return type;
	}
	function _addIssue(context, label, dataset, config$1, other) {
		const input = other && "input" in other ? other.input : dataset.value;
		const expected = other?.expected ?? context.expects ?? null;
		const received = other?.received ?? _stringify(input);
		const issue = {
			kind: context.kind,
			type: context.type,
			input,
			expected,
			received,
			message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
			requirement: context.requirement,
			path: other?.path,
			issues: other?.issues,
			lang: config$1.lang,
			abortEarly: config$1.abortEarly,
			abortPipeEarly: config$1.abortPipeEarly
		};
		const isSchema = context.kind === "schema";
		const message$1 = other?.message ?? context.message ?? (context.reference, issue.lang, void 0) ?? (isSchema ? (issue.lang, void 0) : null) ?? config$1.message ?? (issue.lang, void 0);
		if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
		if (isSchema) dataset.typed = false;
		if (dataset.issues) dataset.issues.push(issue);
		else dataset.issues = [issue];
	}
	function _isSameValueZero(value1, value2) {
		return value1 === value2 || Number.isNaN(value1) && Number.isNaN(value2);
	}
	function _standardSchema(schema) {
		schema["~standard"] = {
			version: 1,
			vendor: "valibot",
			validate: (value$1) => schema["~run"]({ value: value$1 }, getGlobalConfig())
		};
		return schema;
	}
	function transform(operation) {
		return {
			kind: "transformation",
			type: "transform",
			reference: transform,
			async: false,
			operation,
			"~run"(dataset) {
				dataset.value = this.operation(dataset.value);
				return dataset;
			}
		};
	}
	function getFallback(schema, dataset, config$1) {
		return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
	}
	function getDefault(schema, dataset, config$1) {
		return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
	}
	function array(item, message$1) {
		return _standardSchema({
			kind: "schema",
			type: "array",
			reference: array,
			expects: "Array",
			async: false,
			item,
			message: message$1,
			"~run"(dataset, config$1) {
				const input = dataset.value;
				if (Array.isArray(input)) {
					dataset.typed = true;
					dataset.value = [];
					for (let key = 0; key < input.length; key++) {
						const value$1 = input[key];
						const itemDataset = this.item["~run"]({ value: value$1 }, config$1);
						if (itemDataset.issues) {
							const pathItem = {
								type: "array",
								origin: "value",
								input,
								key,
								value: value$1
							};
							for (const issue of itemDataset.issues) {
								if (issue.path) issue.path.unshift(pathItem);
								else issue.path = [pathItem];
								dataset.issues?.push(issue);
							}
							if (!dataset.issues) dataset.issues = itemDataset.issues;
							if (config$1.abortEarly) {
								dataset.typed = false;
								break;
							}
						}
						if (!itemDataset.typed) dataset.typed = false;
						dataset.value.push(itemDataset.value);
					}
				} else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		});
	}
	function literal(literal_, message$1) {
		return _standardSchema({
			kind: "schema",
			type: "literal",
			reference: literal,
			expects: _stringify(literal_),
			async: false,
			literal: literal_,
			message: message$1,
			"~run"(dataset, config$1) {
				if (_isSameValueZero(dataset.value, this.literal)) dataset.typed = true;
				else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		});
	}
	function object(entries$1, message$1) {
		return _standardSchema({
			kind: "schema",
			type: "object",
			reference: object,
			expects: "Object",
			async: false,
			entries: entries$1,
			message: message$1,
			"~run"(dataset, config$1) {
				const input = dataset.value;
				if (input && typeof input === "object") {
					dataset.typed = true;
					dataset.value = {};
					for (const key in this.entries) {
						const valueSchema = this.entries[key];
						if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
							const value$1 = key in input ? input[key] : getDefault(valueSchema);
							const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
							if (valueDataset.issues) {
								const pathItem = {
									type: "object",
									origin: "value",
									input,
									key,
									value: value$1
								};
								for (const issue of valueDataset.issues) {
									if (issue.path) issue.path.unshift(pathItem);
									else issue.path = [pathItem];
									dataset.issues?.push(issue);
								}
								if (!dataset.issues) dataset.issues = valueDataset.issues;
								if (config$1.abortEarly) {
									dataset.typed = false;
									break;
								}
							}
							if (!valueDataset.typed) dataset.typed = false;
							dataset.value[key] = valueDataset.value;
						} else if (valueSchema.fallback !== void 0) dataset.value[key] = getFallback(valueSchema);
						else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
							_addIssue(this, "key", dataset, config$1, {
								input: void 0,
								expected: `"${key}"`,
								path: [{
									type: "object",
									origin: "key",
									input,
									key,
									value: input[key]
								}]
							});
							if (config$1.abortEarly) break;
						}
					}
				} else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		});
	}
	function optional(wrapped, default_) {
		return _standardSchema({
			kind: "schema",
			type: "optional",
			reference: optional,
			expects: `(${wrapped.expects} | undefined)`,
			async: false,
			wrapped,
			default: default_,
			"~run"(dataset, config$1) {
				if (dataset.value === void 0) {
					if (this.default !== void 0) dataset.value = getDefault(this, dataset, config$1);
					if (dataset.value === void 0) {
						dataset.typed = true;
						return dataset;
					}
				}
				return this.wrapped["~run"](dataset, config$1);
			}
		});
	}
	function string(message$1) {
		return _standardSchema({
			kind: "schema",
			type: "string",
			reference: string,
			expects: "string",
			async: false,
			message: message$1,
			"~run"(dataset, config$1) {
				if (typeof dataset.value === "string") dataset.typed = true;
				else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		});
	}
	function pipe(...pipe$1) {
		return _standardSchema({
			...pipe$1[0],
			pipe: pipe$1,
			"~run"(dataset, config$1) {
				for (const item of pipe$1) if (item.kind !== "metadata") {
					if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
						dataset.typed = false;
						break;
					}
					if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);
				}
				return dataset;
			}
		});
	}
	function safeParse(schema, input, config$1) {
		const dataset = schema["~run"]({ value: input }, getGlobalConfig(config$1));
		return {
			typed: dataset.typed,
			success: !dataset.issues,
			output: dataset.value,
			issues: dataset.issues
		};
	}
	var SyllabusDateTimeSchema = pipe(string(), transform((input) => {
		const date = new Date(input);
		date.setSeconds(0, 0);
		return date;
	}));
	var SyllabusListSchema = array(pipe(object({
		type: literal("SyllabusLessonType"),
		lesson: object({
			captureStartedAt: optional(SyllabusDateTimeSchema),
			captureEndedAt: optional(SyllabusDateTimeSchema),
			startTimeUTC: SyllabusDateTimeSchema,
			endTimeUTC: SyllabusDateTimeSchema,
			lesson: object({ id: string() })
		})
	}), transform((input) => ({
		id: input.lesson.lesson.id,
		startDate: input.lesson.captureStartedAt ?? input.lesson.startTimeUTC,
		endDate: input.lesson.captureEndedAt ?? input.lesson.endTimeUTC
	}))));
	var SyllabusService = class extends HardService {
		courseId;
		items = [];
		constructor(courseId) {
			super("Syllabus");
			this.courseId = courseId;
		}
		async init() {
			try {
				const json = await (await fetch(`https://echo360.net.au/section/${this.courseId}/syllabus`, {
					credentials: "include",
					method: "GET",
					mode: "cors"
				})).json();
				if (!json.data) {
					this.reporter.warn("Syllabus response had no data field");
					return false;
				}
				const syllabusItems = safeParse(SyllabusListSchema, json.data);
				if (!syllabusItems.success) {
					this.reporter.warn("Failed to parse syllabus items, read below");
					console.log(syllabusItems.issues);
					return false;
				}
				this.reporter.tell("Successfully read and parsed the syllabus");
				this.items = syllabusItems.output;
				return true;
			} catch (e) {
				this.reporter.scream("Syllabus fetch threw an error: " + e);
				return false;
			}
		}
		isSameDay(a, b) {
			return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
		}
		findLessonsByDate(date) {
			return this.items.filter((item) => this.isSameDay(item.startDate, date));
		}
		getTodaysLessons() {
			const today = new Date();
			return this.findLessonsByDate(today);
		}
	};
	function LessonList(courseId) {
		const syllabus = new SyllabusService(courseId);
		syllabus.init().then((success) => {
			if (success) attachJumpButton();
		});
		function buildPlatform() {
			const platform = document.createElement("div");
			platform.classList.add("syllabus-options-box");
			return platform;
		}
		function buildButtonGroup() {
			const buttonGroup = document.createElement("div");
			buttonGroup.classList.add("syllabus-button-group");
			return buttonGroup;
		}
		function buildJumpButtonOnto(parent, handler) {
			const jumpButton = document.createElement("button");
			jumpButton.textContent = "Jump to today's lesson";
			jumpButton.classList.add("jump-button");
			jumpButton.addEventListener("click", handler);
			parent.appendChild(jumpButton);
		}
		function buildWatchButtonOnto(parent, handler) {
			const watchButton = document.createElement("button");
			watchButton.textContent = "Watch today's lesson";
			watchButton.classList.add("watch-button");
			watchButton.addEventListener("click", handler);
			parent.appendChild(watchButton);
		}
		function buildOptionsButtonOnto(parent, handler) {
			const optionsButton = document.createElement("button");
			optionsButton.classList.add("options-button");
			optionsButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.3175 7.14139L20.8239 6.28479C20.4506 5.63696 20.264 5.31305 19.9464 5.18388C19.6288 5.05472 19.2696 5.15664 18.5513 5.36048L17.3311 5.70418C16.8725 5.80994 16.3913 5.74994 15.9726 5.53479L15.6357 5.34042C15.2766 5.11043 15.0004 4.77133 14.8475 4.37274L14.5136 3.37536C14.294 2.71534 14.1842 2.38533 13.9228 2.19657C13.6615 2.00781 13.3143 2.00781 12.6199 2.00781H11.5051C10.8108 2.00781 10.4636 2.00781 10.2022 2.19657C9.94085 2.38533 9.83106 2.71534 9.61149 3.37536L9.27753 4.37274C9.12465 4.77133 8.84845 5.11043 8.48937 5.34042L8.15249 5.53479C7.73374 5.74994 7.25259 5.80994 6.79398 5.70418L5.57375 5.36048C4.85541 5.15664 4.49625 5.05472 4.17867 5.18388C3.86109 5.31305 3.67445 5.63696 3.30115 6.28479L2.80757 7.14139C2.45766 7.74864 2.2827 8.05227 2.31666 8.37549C2.35061 8.69871 2.58483 8.95918 3.05326 9.48012L4.0843 10.6328C4.3363 10.9518 4.51521 11.5078 4.51521 12.0077C4.51521 12.5078 4.33636 13.0636 4.08433 13.3827L3.05326 14.5354C2.58483 15.0564 2.35062 15.3168 2.31666 15.6401C2.2827 15.9633 2.45766 16.2669 2.80757 16.8741L3.30114 17.7307C3.67443 18.3785 3.86109 18.7025 4.17867 18.8316C4.49625 18.9608 4.85542 18.8589 5.57377 18.655L6.79394 18.3113C7.25263 18.2055 7.73387 18.2656 8.15267 18.4808L8.4895 18.6752C8.84851 18.9052 9.12464 19.2442 9.2775 19.6428L9.61149 20.6403C9.83106 21.3003 9.94085 21.6303 10.2022 21.8191C10.4636 22.0078 10.8108 22.0078 11.5051 22.0078H12.6199C13.3143 22.0078 13.6615 22.0078 13.9228 21.8191C14.1842 21.6303 14.294 21.3003 14.5136 20.6403L14.8476 19.6428C15.0004 19.2442 15.2765 18.9052 15.6356 18.6752L15.9724 18.4808C16.3912 18.2656 16.8724 18.2055 17.3311 18.3113L18.5513 18.655C19.2696 18.8589 19.6288 18.9608 19.9464 18.8316C20.264 18.7025 20.4506 18.3785 20.8239 17.7307L21.3175 16.8741C21.6674 16.2669 21.8423 15.9633 21.8084 15.6401C21.7744 15.3168 21.5402 15.0564 21.0718 14.5354L20.0407 13.3827C19.7887 13.0636 19.6098 12.5078 19.6098 12.0077C19.6098 11.5078 19.7888 10.9518 20.0407 10.6328L21.0718 9.48012C21.5402 8.95918 21.7744 8.69871 21.8084 8.37549C21.8423 8.05227 21.6674 7.74864 21.3175 7.14139Z" stroke-linecap="round"></path>
                <path d="M15.5195 12C15.5195 13.933 13.9525 15.5 12.0195 15.5C10.0865 15.5 8.51953 13.933 8.51953 12C8.51953 10.067 10.0865 8.5 12.0195 8.5C13.9525 8.5 15.5195 10.067 15.5195 12Z"></path>
            </svg>
            `;
			optionsButton.addEventListener("click", handler);
			parent.appendChild(optionsButton);
		}
		async function attachJumpButton() {
			const todays = syllabus.getTodaysLessons();
			if (todays.length == 0) {
				console.info("No lessons today");
				return;
			}
			const first = todays[0];
			const lessonElement = await waitForElement(`[data-test-lessonid="${first.id}"]`);
			if (!lessonElement) {
				console.error("Something went wrong, no element found for lesson ", first.id);
				return;
			}
			const platform = buildPlatform();
			const buttonGroup = buildButtonGroup();
			buildJumpButtonOnto(buttonGroup, () => {
				lessonElement.scrollIntoView({ behavior: "smooth" });
				const ring = createHighlightRing(lessonElement);
				setTimeout(() => {
					ring.remove();
				}, 1500);
			});
			buildWatchButtonOnto(buttonGroup, () => {
				window.location.assign(`https://echo360.net.au/lesson/${first.id}/classroom`);
			});
			buildOptionsButtonOnto(buttonGroup, () => {
				alert("havent built this yet");
			});
			platform.prepend(buttonGroup);
			document.body.appendChild(platform);
		}
		function createHighlightRing(target) {
			const ring = document.createElement("div");
			ring.className = "be360-highlight-ring";
			document.body.appendChild(ring);
			const ringPadding = 3;
			function position() {
				const rect = target.getBoundingClientRect();
				ring.style.top = `${rect.top - ringPadding}px`;
				ring.style.left = `${rect.left - ringPadding}px`;
				ring.style.width = `${rect.width + 6}px`;
				ring.style.height = `${rect.height + 6}px`;
			}
			position();
			window.addEventListener("scroll", position, true);
			window.addEventListener("resize", position);
			return ring;
		}
	}
	var RouterService = class RouterService extends HardService {
		static routes = [{
			name: "Lesson",
			matcher: (location) => {
				return { matches: location.pathname.includes("/lesson") };
			},
			handler: () => {
				lesson();
			}
		}, {
			name: "Lessons List",
			matcher: (location) => {
				const match = location.pathname.match("/section/(?<course_id>.+)/home");
				if (match && match.groups) {
					const courseId = match.groups["course_id"];
					if (courseId) return {
						matches: true,
						data: { courseId }
					};
				}
				return { matches: false };
			},
			handler: (data) => {
				LessonList(data.courseId);
			}
		}];
		constructor() {
			super("Router");
		}
		route() {
			var location = window.location;
			for (const route of RouterService.routes) {
				const result = route.matcher(location);
				if (result.matches) {
					this.reporter.tell(`Matched route for (${route.name})`);
					route.handler(result.data);
					return;
				}
			}
			this.reporter.warn(`No route matched for ${location.pathname}`);
		}
		init() {
			this.route();
		}
	};
	var style_default = ":root {\n    --primary-color: #d5006c;\n    --primary-color-darker:#b3005c;\n    --primary-color-faded: #ffcce6;\n}\n\n.be360-highlight-ring {\n    isolation: isolate;\n    position: fixed;\n    border: 7px solid var(--primary-color);\n    border-radius: 7px;\n    box-sizing: border-box;\n    pointer-events: none;\n    z-index: 2147483647;\n    opacity: 0; /* starts invisible, animation takes over from here */\n    animation: be360-ring-pulse 1.5s ease-in-out forwards;\n}\n\n@keyframes be360-ring-pulse {\n    0% {\n        opacity: 0;\n    }\n    15% {\n        opacity: 1;\n    }\n    85% {\n        opacity: 1;\n    }\n    100% {\n        opacity: 0;\n    }\n}\n\n.syllabus-options-box {\n    position: fixed;\n    display: flex;\n    flex-direction: column;\n    bottom: 0px;\n    right: 10px;\n    background-color: #f7f7f7;\n    border: 1px solid #eee1e3;\n    border-radius: 30px;\n    border-end-end-radius: 0px;\n    border-bottom-left-radius: 0px;\n    padding: 10px;\n    padding-bottom: 15px;\n    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);\n    z-index: 9999;\n\n    font-size: 14px;\n    color: lightslategray;\n\n    align-items: center;\n    gap: 10px;\n\n    animation: platform-pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;\n}\n\n@keyframes platform-pop-in {\n    0% {\n        transform: translateY(40px) scale(0.9);\n    }\n    100% {\n        transform: translateY(0) scale(1);\n    }\n}\n\n.syllabus-button-group {\n    display: flex;\n    flex-direction: row;\n    gap: 2px;\n    width: 440px;\n}\n\n.watch-button {\n    position: relative;\n    padding: 10px 0;\n    background-color: var(--primary-color);\n    color: #fff;\n    border: none;\n    flex: 1;\n    height: 40px;\n    border-radius: 20px;\n    border-top-left-radius: 5px;\n    border-bottom-left-radius: 5px;\n    cursor: pointer;\n    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n\n.jump-button {\n    position: relative;\n    padding: 10px 0;\n    flex: 1;\n    height: 40px;\n    background-color: var(--primary-color-faded);\n    color: var(--primary-color);\n    border: none;\n    border-radius: 20px;\n    border-top-right-radius: 5px;\n    border-bottom-right-radius: 5px;\n    cursor: pointer;\n    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);\n\n    font-weight: semibold;\n}\n\n.options-button {\n    position: relative;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    height: 40px;\n    aspect-ratio: 1;\n    border-radius: 20px;\n    background-color: gainsboro;\n    border: none;\n    margin-left: 6px;\n    transition: all 0.8s cubic-bezier(0.34, 1, 0.64, 1);\n}\n\n.jump-button:hover,\n.watch-button:hover {\n    flex: 1.25;\n}\n\n.options-button:hover {\n    rotate: 180deg;\n}\n\n.icon-button-captions {\n    height: 2rem;\n    aspect-ratio: 1;\n    background: transparent;\n    color: white;\n    border: none;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    padding: 4px;\n    font-size: 22px;\n    border-radius: 2px;\n    cursor: pointer;\n}\n\n.icon-button-captions:hover {\n    background: white;\n    color: black;\n}\n\n.icon-button-captions:active {\n    background: rgba(255, 255, 255, 0.5);\n    color: black;\n}\n\n.icon-button-captions:focus:not(:focus-visible) {\n  outline: none;\n}\n\n.icon-button-captions[data-enabled] {\n    background: var(--primary-color);\n    color: white;\n}\n\n.icon-button-captions[data-enabled]:hover {\n    background: var(--primary-color-darker);\n}\n";
	var ArtistService = class extends HardService {
		constructor() {
			super("Artist");
		}
		paint() {
			const style = document.createElement("style");
			style.id = "be360-styles";
			style.textContent = style_default;
			this.reporter.report("Injected the stylesheet from style.css");
			document.head.appendChild(style);
			const PHOSPHOR_BASE = "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src";
			const injectStylesheet = (href) => {
				const link = document.createElement("link");
				link.rel = "stylesheet";
				link.type = "text/css";
				link.href = href;
				document.head.appendChild(link);
				this.reporter.report(`Injected the stylesheet with the href: ${href}`);
				return link;
			};
			injectStylesheet(`${PHOSPHOR_BASE}/regular/style.css`);
			injectStylesheet(`${PHOSPHOR_BASE}/fill/style.css`);
		}
	};
	(function() {
		"use strict";
		new ArtistService().paint();
		new RouterService().init();
	})();
})();
