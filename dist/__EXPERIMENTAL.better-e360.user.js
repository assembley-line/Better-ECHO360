// ==UserScript==
// @name         Better ECHO360 (Experimental)
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @author       CharlieR
// @description  Enhances the ECHO360 experience with additional features.
// @icon         https://messenger-assets.qualified.com/uploads/7U9KEay8tEHtKtBg3eDboiKsuxNZ8Nez9e2jt/303ad5416775b60078af5eb38a6c20687c530d5f5e5a9ce7cb72df2d11cf86c5.png
// @downloadURL  https://github.com/assembley-line/Better-ECHO360/raw/refs/heads/main/dist/__EXPERIMENTAL.better-e360.user.js
// @updateURL    https://github.com/assembley-line/Better-ECHO360/raw/refs/heads/main/dist/__EXPERIMENTAL.better-e360.user.js
// @match        *://echo360.net.au/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-end
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
	var _GM_getValue = (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
	var _GM_setValue = (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
	var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
	var w = _unsafeWindow;
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
	var prefix = "Better ECHO360";
	function reporter(target) {
		target.prototype.report = function(...args) {
			console.log(`[${prefix} | ${this.constructor.name}]`, ...args);
		};
		target.prototype.warn = function(...args) {
			console.warn(`[${prefix} | ${this.constructor.name}]`, ...args);
		};
		target.prototype.yell = function(...args) {
			console.error(`[${prefix} | ${this.constructor.name}]`, ...args);
		};
		return target;
	}
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
	function __decorate(decorators, target, key, desc) {
		var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
		else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return c > 3 && r && Object.defineProperty(target, key, r), r;
	}
	var _Toolbar;
	var Toolbar = class Toolbar extends HardService {
		static {
			_Toolbar = this;
		}
		static locating = null;
		constructor() {
			super("Toolbar");
			this.locate();
		}
		locate() {
			return _Toolbar.locating ??= (async () => {
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
	Toolbar = _Toolbar = __decorate([reporter], Toolbar);
	function hidden(setting) {
		return (target) => {
			if (!setting) return target;
			class Stub {}
			for (const key of Object.getOwnPropertyNames(target.prototype)) if (key !== "constructor") Stub.prototype[key] = () => {};
			return Stub;
		};
	}
	var defaults = {
		better_echo360: { disabled: false },
		phone: { hidden: false },
		timemachine: {
			hidden: false,
			defaultSpeed: 1,
			betterTimemachine: false,
			hideNativeSpeedSelector: false
		},
		syllabus: { hidden: false },
		captions: {
			hidden: false,
			enabled: true
		},
		reporter: { verbosity: 1 }
	};
	function section(name) {
		const read = () => ({
			...defaults[name],
			..._GM_getValue(name, {})
		});
		return new Proxy({}, {
			get: (_, key) => read()[key],
			set: (_, key, value) => {
				_GM_setValue(name, {
					..._GM_getValue(name, {}),
					[key]: value
				});
				return true;
			},
			ownKeys: () => Reflect.ownKeys(read()),
			getOwnPropertyDescriptor: (_, key) => ({
				enumerable: true,
				configurable: true,
				value: read()[key]
			})
		});
	}
	var settings = Object.fromEntries(Object.keys(defaults).map((k) => [k, section(k)]));
	window.settings = settings;
	var _CaptionsService;
	var CaptionsService = class CaptionsService extends StoreService {
		static {
			_CaptionsService = this;
		}
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
			wrapper.id = _CaptionsService.wrapperId;
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
			box.id = _CaptionsService.boxId;
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
			document.getElementById(_CaptionsService.wrapperId)?.remove();
		}
	};
	CaptionsService = _CaptionsService = __decorate([hidden(settings.captions.hidden)], CaptionsService);
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
	var _PhoneService;
	var PhoneService = class PhoneService extends SoftService {
		static {
			_PhoneService = this;
		}
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
		async UI_attachPhoneWindow() {
			if (this.phoneEl) return;
			const el = createEmbed(_PhoneService.videoUrl, { zoom: 1.05 });
			if (!el) return;
			const player = await waitForElement("[data-test-id=\"layout-display-container\"]");
			if (!player) return;
			player.style.position = "relative";
			Object.assign(el.style, {
				position: "absolute",
				bottom: `10px`,
				right: "10px",
				width: "281px",
				height: "500px",
				zIndex: "10000",
				borderRadius: "8px",
				boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
			});
			this.phoneEl = el;
			player.appendChild(el);
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
	PhoneService = _PhoneService = __decorate([hidden(settings.phone.hidden)], PhoneService);
	function fromTemplate(html) {
		const tpl = document.createElement("template");
		tpl.innerHTML = html.trim();
		return tpl.content.firstElementChild;
	}
	var timemachine_default = "<dialog class=\"speed-popover\" id=\"be360-speed-popover\" popover>\n    <div class=\"button-row\">\n        <button\n            type=\"button\"\n            class=\"plus\"\n            id=\"decrease-speed\"\n            data-delta=\"-0.1\"\n        >\n            <i class=\"ph-bold ph-minus\"></i>\n        </button>\n        <p id=\"current-speed\">{}x</p>\n        <button type=\"button\" class=\"plus\" id=\"increase-speed\" data-delta=\"0.1\">\n            <i class=\"ph-bold ph-plus\"></i>\n        </button>\n    </div>\n    <div class=\"button-row\">\n        <button type=\"button\" data-speed=\"1\">1×</button>\n        <button type=\"button\" data-speed=\"1.5\">1.5×</button>\n        <button type=\"button\" data-speed=\"2\">2×</button>\n        <button type=\"button\" data-speed=\"2.5\">2.5×</button>\n        <button type=\"button\" data-speed=\"3\">3×</button>\n        <button type=\"button\" data-speed=\"3.5\">3.5×</button>\n    </div>\n    <p class=\"total-time-p\" id=\"sum-lecture-time\">\n        Total lecture time is {} mins\n    </p>\n</dialog>\n";
	var TimeMachineService = class TimeMachineService extends StoreService {
		popover = null;
		button = null;
		quickActionCloseDelay = 150;
		quickActionCloseTimeout = void 0;
		constructor() {
			super("Time Machine", [ZustandStore.PlayerStore]);
			if (this.closed) return;
			this.UI.init();
			if (settings.timemachine.hideNativeSpeedSelector) waitForElement("#playback-speed-menu-menu-toggle-btn").then((element) => {
				if (element) element.style.display = "none";
			});
		}
		getPlaybackSpeed() {
			try {
				return HackerService.grab(ZustandStore.PlayerStore).getState().playbackRate;
			} catch (e) {
				this.reporter.scream("Something went wrong on rate get");
				console.error(e);
				return 1;
			}
		}
		setPlaybackSpeed(speed) {
			try {
				HackerService.grab(ZustandStore.PlayerStore).getState().onPlaybackRateChange(speed);
			} catch (e) {
				this.reporter.scream("Something went wrong on rate change");
				console.error(e);
			}
		}
		UI = {
			init: async () => {
				await this.UI.attachButtonToToolbar();
				this.UI.attachPopover();
				this.UI.updatePopover();
			},
			attachButtonToToolbar: async () => {
				const button = await new Toolbar().addIconButton(["ph", "ph-speedometer"]);
				if (!button) return;
				button.id = "timemachine-button";
				this.button = button;
			},
			attachPopover: () => {
				const popover = fromTemplate(timemachine_default);
				this.popover = popover;
				if (!this.button || !this.popover) return;
				this.button.setAttribute("popovertarget", popover.id);
				this.popover.querySelectorAll("button[data-speed]").forEach((button) => {
					button.addEventListener("click", () => {
						const speed = parseFloat(button.getAttribute("data-speed") || "1");
						this.setPlaybackSpeed(speed);
						this.UI.updatePopover();
						clearTimeout(this.quickActionCloseTimeout);
						this.quickActionCloseTimeout = window.setTimeout(() => {
							this.popover?.hidePopover();
						}, this.quickActionCloseDelay);
					});
				});
				this.popover.querySelectorAll("button[data-delta]").forEach((button) => {
					button.addEventListener("click", () => {
						const delta = parseFloat(button.getAttribute("data-delta") || "0");
						const currentSpeed = this.getPlaybackSpeed();
						const newSpeed = Math.round((currentSpeed + delta) * 10) / 10;
						this.setPlaybackSpeed(newSpeed);
						this.UI.updatePopover();
					});
				});
				this.button.appendChild(popover);
			},
			updatePopover: () => {
				if (!this.popover) return;
				const playbackSpeed = HackerService.grab(ZustandStore.PlayerStore).getState().playbackRate;
				const adjustedDuration = HackerService.grab(ZustandStore.PlayerStore).getState().duration / playbackSpeed;
				const adjustedDurationMins = Math.ceil(adjustedDuration / 60);
				const currentSpeedLabel = this.popover.querySelector("#current-speed");
				if (currentSpeedLabel) currentSpeedLabel.textContent = `${playbackSpeed}x`;
				const adjustedDurationLabel = this.popover.querySelector("#sum-lecture-time");
				if (adjustedDurationLabel) adjustedDurationLabel.textContent = `Total lecture time is ${adjustedDurationMins} mins`;
			}
		};
	};
	TimeMachineService = __decorate([hidden(settings.timemachine.hidden), reporter], TimeMachineService);
	function lesson() {
		new TimeMachineService();
		new CaptionsService();
		new PhoneService();
	}
	var syllabusPlatform_default = "<div class=\"syllabus-options-box\">\n    <div class=\"syllabus-button-group\">\n        <button class=\"jump-button\">Jump to today's lesson</button>\n        <button class=\"watch-button\">Watch today's lesson</button>\n    </div>\n</div>\n";
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
	var SyllabusItemSchema = pipe(object({
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
	})));
	var SyllabusService = class SyllabusService extends HardService {
		courseId;
		items = [];
		constructor(courseId) {
			super("Syllabus");
			this.courseId = courseId;
			this.init();
		}
		async init() {
			try {
				this.reporter.report("Fetching the syllabus");
				const json = await (await fetch(`https://echo360.net.au/section/${this.courseId}/syllabus`, {
					credentials: "include",
					method: "GET",
					mode: "cors"
				})).json();
				if (!json.data) {
					this.reporter.warn("Syllabus response had no data field");
					return false;
				}
				const parsed = [];
				let skipped = 0;
				for (const raw of json.data) {
					const result = safeParse(SyllabusItemSchema, raw);
					if (result.success) parsed.push(result.output);
					else skipped++;
				}
				this.reporter.tell("Successfully read and parsed the syllabus, skipped " + skipped + " items");
				this.items = parsed;
				this.UI.attachOptionsPlatform();
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
		async getTodaysLessonElement() {
			const todays = this.getTodaysLessons();
			if (todays.length == 0) {
				console.info("No lessons today");
				return null;
			}
			const first = todays[0];
			const lessonElement = await waitForElement(`[data-test-lessonid="${first.id}"]`);
			if (!lessonElement) {
				console.error("Something went wrong, no element found for lesson ", first.id);
				return null;
			}
			return lessonElement;
		}
		getTodaysLessons() {
			const today = new Date();
			return this.findLessonsByDate(today);
		}
		UI = { attachOptionsPlatform: async () => {
			const platform = fromTemplate(syllabusPlatform_default);
			const first = this.getTodaysLessons()[0];
			const lessonElement = await this.getTodaysLessonElement();
			if (!lessonElement) {
				console.error("No lesson element found for today's lesson");
				return;
			}
			platform.querySelector(".jump-button")?.addEventListener("click", () => {
				lessonElement.scrollIntoView({ behavior: "smooth" });
				const ring = this.createHighlightRing(lessonElement);
				setTimeout(() => {
					ring.remove();
				}, 1500);
			});
			platform.querySelector(".watch-button")?.addEventListener("click", () => {
				window.location.assign(`https://echo360.net.au/lesson/${first.id}/classroom`);
			});
			document.body.append(platform);
		} };
		createHighlightRing(target) {
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
	};
	SyllabusService = __decorate([hidden(settings.syllabus.hidden)], SyllabusService);
	function LessonList(courseId) {
		new SyllabusService(courseId);
	}
	var style_default = "#switchboard input{background-color:red}#switchboard .top-bar{flex-direction:row;justify-content:space-between;align-items:center;margin-bottom:10px;display:flex}#switchboard .close-button{color:#000;background-color:#0000000d;border:none;border-radius:20px;outline:none;width:35px;height:35px}#switchboard .top-bar h1{margin:0;font-size:24px;font-weight:600}#switchboard input[type=checkbox]{appearance:none;cursor:pointer;background-color:var(--primary-color-faded);background-image:radial-gradient(circle at 14px 14px,#fff 0 10.5px,#0000 11px);background-position:0 0;background-repeat:no-repeat;border:none;border-radius:999px;flex:none;width:52px;height:28px;margin:0;transition:background-color .25s cubic-bezier(.34,1.2,.64,1),background-position .25s cubic-bezier(.34,1.2,.64,1)}#switchboard input[type=checkbox]:checked{background-color:var(--primary-color);background-position:24px 0}#switchboard input[type=checkbox]:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}#switchboard .setting-row{cursor:pointer;-webkit-user-select:none;user-select:none;justify-content:space-between;align-items:center;gap:16px;padding:10px 0;display:flex}#switchboard .setting-row+.setting-row{border-top:1px solid #00000014}#switchboard{box-sizing:border-box;-webkit-font-smoothing:antialiased;opacity:0;width:500px;transition:opacity .2s ease-out, scale .2s ease-out, overlay .2s allow-discrete, display .2s allow-discrete;border:none;border-radius:37.5px;outline:none;margin:auto;padding:20px;scale:.97;box-shadow:0 2px 4px #0003,0 8px 24px #0000004d,0 24px 80px #00000073}#switchboard[open]{opacity:1;scale:1}@starting-style{#switchboard[open]{opacity:0;scale:.97}}#switchboard p{margin:0;font-size:14px;font-weight:500}#switchboard::backdrop{-webkit-backdrop-filter:blur(1px)saturate(70%);opacity:0;transition:opacity .2s ease-out, overlay .2s allow-discrete, display .2s allow-discrete;background:#0003}#switchboard[open]::backdrop{opacity:1}@starting-style{#switchboard[open]::backdrop{opacity:0}}.be360-highlight-ring{isolation:isolate;border:7px solid var(--primary-color);box-sizing:border-box;pointer-events:none;z-index:2147483647;opacity:0;border-radius:7px;animation:1.5s ease-in-out forwards be360-ring-pulse;position:fixed}@keyframes be360-ring-pulse{0%{opacity:0}15%{opacity:1}85%{opacity:1}to{opacity:0}}.syllabus-options-box{border-radius:30px;border-end-end-radius:0;z-index:9999;color:#789;background-color:#f7f7f7;border:1px solid #eee1e3;border-bottom-left-radius:0;flex-direction:column;align-items:center;gap:10px;padding:10px 10px 15px;font-size:14px;animation:.35s cubic-bezier(.34,1.56,.64,1) forwards platform-pop-in;display:flex;position:fixed;bottom:0;right:10px;box-shadow:0 5px 15px #0000004d}@keyframes platform-pop-in{0%{transform:translateY(40px)scale(.9)}to{transform:translateY(0)scale(1)}}.syllabus-button-group{flex-direction:row;gap:2px;width:440px;display:flex}.watch-button{background-color:var(--primary-color);color:#fff;cursor:pointer;border:none;border-radius:5px 20px 20px 5px;flex:1;height:40px;padding:10px 0;transition:all .2s cubic-bezier(.34,1.56,.64,1);position:relative}.jump-button{background-color:var(--primary-color-faded);height:40px;color:var(--primary-color);cursor:pointer;font-weight:semibold;border:none;border-radius:20px 5px 5px 20px;flex:1;padding:10px 0;transition:all .2s cubic-bezier(.34,1.56,.64,1);position:relative}.options-button{aspect-ratio:1;background-color:#dcdcdc;border:none;border-radius:20px;justify-content:center;align-items:center;height:40px;margin-left:6px;transition:all .8s cubic-bezier(.34,1,.64,1);display:flex;position:relative}.jump-button:hover,.watch-button:hover{flex:1.25}.options-button:hover{rotate:180deg}.speed-popover{--ease:cubic-bezier(.34, 1.05, .64, 1);--open-duration:.15s;--open-fade-duration:.2s;--close-duration:.15s;--close-fade-duration:.2s;--closed-scale:.9;--closed-offset:12px;-webkit-backdrop-filter:blur(200px)saturate(40%);backdrop-filter:blur(200px)saturate(40%);color:#fff;width:350px;inset:unset;position-anchor:--anchor;justify-self:anchor-center;bottom:calc(anchor(top) + 20px);opacity:0;scale:var(--closed-scale);translate:0 var(--closed-offset);transform-origin:bottom;transition:opacity var(--close-fade-duration) var(--ease), scale var(--close-duration) var(--ease), translate var(--close-duration) var(--ease), overlay var(--close-duration) allow-discrete, display var(--close-duration) allow-discrete;background:#ffffff0d;border:1px solid #ffffff0d;border-radius:28px;outline:0;margin:0;padding:15px 10px 10px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;position:fixed}.speed-popover:popover-open{opacity:1;transition:opacity var(--open-fade-duration) var(--ease), scale var(--open-duration) var(--ease), translate var(--open-duration) var(--ease), overlay var(--open-duration) allow-discrete, display var(--open-duration) allow-discrete;translate:0;scale:1}@starting-style{.speed-popover:popover-open{opacity:0;scale:var(--closed-scale);translate:0 var(--closed-offset)}}.speed-popover .button-row{flex-direction:row;justify-content:center;align-items:center;gap:3px;width:100%;display:flex}.speed-popover .button-row+.button-row{margin-top:10px}#timemachine-button{anchor-name:--anchor}.speed-popover button[data-speed]{color:#fff;background-color:#ffffff1a;border:none;border-radius:18px;outline:none;flex:1;height:36px;font-size:14px;font-weight:500}.speed-popover .plus{aspect-ratio:1;color:#fff;background-color:#ffffff1a;border:none;border-radius:18px;outline:none;justify-content:center;align-items:center;height:36px;font-size:18px;display:flex}.speed-popover p{text-align:center;flex:1;margin:0;padding:0;font-size:24px;font-weight:600}.speed-popover .total-time-p{text-transform:capitalise;color:#fff6;margin-top:10px;font-size:12px;font-style:italic;font-weight:400}.icon-button-captions{aspect-ratio:1;color:#fff;cursor:pointer;background:0 0;border:none;border-radius:2px;justify-content:center;align-items:center;height:2rem;padding:4px;font-size:22px;display:flex}.icon-button-captions:hover{color:#000;background:#fff}.icon-button-captions:active{color:#000;background:#ffffff80}.icon-button-captions:focus:not(:focus-visible){outline:none}.icon-button-captions[data-enabled]{background:var(--primary-color);color:#fff}.icon-button-captions[data-enabled]:hover{background:var(--primary-color-darker)}:root{--primary-color:#d5006c;--primary-color-darker:#b3005c;--primary-color-faded:#ffcce6}";
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
			injectStylesheet(`${PHOSPHOR_BASE}/bold/style.css`);
		}
	};
	var _RouterService;
	var RouterService = class RouterService extends HardService {
		static {
			_RouterService = this;
		}
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
			for (const route of _RouterService.routes) {
				const result = route.matcher(location);
				if (result.matches) {
					this.report(`Matched route for (${route.name})`);
					new ArtistService().paint();
					route.handler(result.data);
					return;
				}
			}
			this.reporter.report(`No route matched for ${location.pathname}`);
		}
	};
	RouterService = _RouterService = __decorate([reporter], RouterService);
	var switchboard_default = "<div class=\"top-bar\">\n    <h1>Switchboard</h1>\n    <button commandfor=\"switchboard\" command=\"close\" class=\"close-button\">\n        <i class=\"ph-bold ph-x\"></i>\n    </button>\n</div>\n\n<label class=\"setting-row\">\n    <span>Disable distractor phone?</span>\n    <input type=\"checkbox\" id=\"phone-enabled\" name=\"phone-enabled\" />\n</label>\n\n<label class=\"setting-row\">\n    <span>Disable timemachine?</span>\n    <input\n        type=\"checkbox\"\n        id=\"timemachine-enabled\"\n        name=\"timemachine-enabled\"\n    />\n</label>\n<label class=\"setting-row\">\n    <span>Better timemachine?</span>\n    <input\n        type=\"checkbox\"\n        id=\"timemachine-more-speed\"\n        name=\"timemachine-more-speed\"\n    />\n</label>\n<label class=\"setting-row\">\n    <span>Hide native speed selector?</span>\n    <input\n        type=\"checkbox\"\n        id=\"timemachine-hide-native\"\n        name=\"timemachine-hide-native\"\n    />\n</label>\n\n<label class=\"setting-row\">\n    <span>Disable captions?</span>\n    <input type=\"checkbox\" id=\"captions-enabled\" name=\"captions-enabled\" />\n</label>\n\n<label class=\"setting-row\">\n    <span>Disable syllabus?</span>\n    <input type=\"checkbox\" id=\"syllabus-enabled\" name=\"syllabus-enabled\" />\n</label>\n";
	function resolve(path) {
		const parts = path.split(".");
		const last = parts.pop();
		return [parts.reduce((obj, k) => obj[k], settings), last];
	}
	function bindCheckbox(root, selector, path, onChange) {
		const input = root.querySelector(selector);
		if (!input) return null;
		const [parent, key] = resolve(path);
		input.checked = Boolean(parent[key]);
		input.addEventListener("change", () => {
			parent[key] = input.checked;
			onChange?.(input.checked);
		});
		return input;
	}
	var SwitchboardService = class extends HardService {
		dialog = null;
		constructor() {
			super("Switchboard");
			this.UI_attachSettingsDialog();
			_unsafeWindow.switchboard = () => {
				this.show();
			};
			this.reporter.report("Use switchboard() to open");
		}
		show() {
			if (!this.dialog) return;
			this.dialog.showModal();
		}
		UI_attachSettingsDialog() {
			this.dialog = document.createElement("dialog");
			this.dialog.id = "switchboard";
			this.dialog.classList.add("switchboard");
			this.dialog.innerHTML = switchboard_default;
			bindCheckbox(this.dialog, "#phone-enabled", "phone.hidden");
			bindCheckbox(this.dialog, "#timemachine-enabled", "timemachine.hidden");
			bindCheckbox(this.dialog, "#captions-enabled", "captions.hidden");
			bindCheckbox(this.dialog, "#syllabus-enabled", "syllabus.hidden");
			bindCheckbox(this.dialog, "#timemachine-more-speed", "timemachine.betterTimemachine");
			bindCheckbox(this.dialog, "#timemachine-hide-native", "timemachine.hideNativeSpeedSelector");
			document.body.appendChild(this.dialog);
		}
	};
	(async function() {
		"use strict";
		new SwitchboardService();
		if (settings.better_echo360.disabled) return;
		new RouterService().route();
	})();
})();
