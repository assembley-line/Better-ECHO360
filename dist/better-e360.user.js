// ==UserScript==
// @name         Better ECHO360
// @namespace    http://tampermonkey.net/
// @version      1.0.0-alpha
// @author       CharlieR
// @description  Enhances the ECHO360 experience with additional features.
// @icon         https://messenger-assets.qualified.com/uploads/7U9KEay8tEHtKtBg3eDboiKsuxNZ8Nez9e2jt/303ad5416775b60078af5eb38a6c20687c530d5f5e5a9ce7cb72df2d11cf86c5.png
// @downloadURL  https://github.com/assembley-line/Better-ECHO360/raw/refs/heads/main/dist/better-e360.user.js
// @updateURL    https://github.com/assembley-line/Better-ECHO360/raw/refs/heads/main/dist/better-e360.user.js
// @match        *://echo360.net.au/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
	"use strict";
	var style_default = ":root{--primary-color:#d5006c;--primary-color-faded:#ffcce6}.be360-highlight-ring{isolation:isolate;border:7px solid var(--primary-color);box-sizing:border-box;pointer-events:none;z-index:2147483647;opacity:0;border-radius:7px;animation:1.5s ease-in-out forwards be360-ring-pulse;position:fixed}@keyframes be360-ring-pulse{0%{opacity:0}15%{opacity:1}85%{opacity:1}to{opacity:0}}.syllabus-options-box{border-radius:30px;border-end-end-radius:0;z-index:9999;color:#789;background-color:#f7f7f7;border:1px solid #eee1e3;border-bottom-left-radius:0;flex-direction:column;align-items:center;gap:10px;padding:10px 10px 15px;font-size:14px;animation:.35s cubic-bezier(.34,1.56,.64,1) forwards platform-pop-in;display:flex;position:fixed;bottom:0;right:10px;box-shadow:0 5px 15px #0000004d}@keyframes platform-pop-in{0%{transform:translateY(40px)scale(.9)}to{transform:translateY(0)scale(1)}}.syllabus-button-group{flex-direction:row;gap:2px;width:440px;display:flex}.watch-button{background-color:var(--primary-color);color:#fff;cursor:pointer;border:none;border-radius:5px 20px 20px 5px;flex:1;height:40px;padding:10px 0;transition:all .2s cubic-bezier(.34,1.56,.64,1);position:relative}.jump-button{background-color:var(--primary-color-faded);height:40px;color:var(--primary-color);cursor:pointer;font-weight:semibold;border:none;border-radius:20px 5px 5px 20px;flex:1;padding:10px 0;transition:all .2s cubic-bezier(.34,1.56,.64,1);position:relative}.options-button{aspect-ratio:1;background-color:#dcdcdc;border:none;border-radius:20px;justify-content:center;align-items:center;height:40px;margin-left:6px;transition:all .8s cubic-bezier(.34,1,.64,1);display:flex;position:relative}.jump-button:hover,.watch-button:hover{flex:1.25}.options-button:hover{rotate:180deg}";
	var Reporter = class Reporter {
		name;
		constructor(name) {
			this.name = name;
		}
		static prefix = "Better ECHO360";
		init() {
			this.tell("Reporter attached");
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
	var Service = class {
		reporter;
		constructor(name) {
			this.reporter = new Reporter(name);
		}
	};
	var CaptionsService = class CaptionsService extends Service {
		static wrapperId = "better-echo360-caption-wrapper";
		static boxId = "better-echo360-captions";
		transcriptAvailable = false;
		currentCueEnd = -1;
		captionsBox = null;
		unsub = null;
		transcriptStore;
		playerStore;
		constructor() {
			super("Captions");
		}
		init() {
			this.transcriptStore = window.transcriptStore;
			this.playerStore = window.playerStore;
			if (!this.transcriptStore || !this.playerStore) {
				this.reporter.scream("Couldn't access the player or transcript store, check window.player/transcriptStore for more. Aborting");
				return;
			}
			this.transcriptAvailable = true;
			this.cues = this.getAllCues();
			this.attach();
		}
		cues = null;
		fetchCount = 0;
		stopFetching = false;
		maxFetchAttempts = 20;
		getAllCues() {
			if (this.fetchCount > this.maxFetchAttempts) {
				this.reporter.warn("Max fetch attempts reached for cues, stopping further attempts.");
				this.stopFetching = true;
				return null;
			}
			this.fetchCount += 1;
			return this.transcriptStore.getState().transcripts || null;
		}
		getCueFromTimestamp(timestamp) {
			if (!this.transcriptAvailable) {
				this.reporter.tell("Tried to call getCueFromTimestamp without transcript available, returning null.");
				return null;
			}
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
			if (!this.transcriptAvailable) return;
			this.reporter.tell("Attaching captions box");
			this.captionsBox = this.setupCaptionBox();
			this.unsub = this.playerStore.subscribe((state) => {
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
		destroy() {
			if (this.unsub) {
				this.unsub();
				this.unsub = null;
			}
			document.getElementById(CaptionsService.wrapperId)?.remove();
		}
	};
	function grabStore(selector) {
		var req = window.__cr;
		if (!req) {
			var chunkNames = [];
			Object.keys(window).forEach(function(k) {
				if (/^webpackJsonp/.test(k) || /^webpackChunk/.test(k)) chunkNames.push(k);
			});
			for (var n = 0; n < chunkNames.length; n++) {
				var arr = window[chunkNames[n]];
				if (!Array.isArray(arr)) continue;
				try {
					arr.push([
						[],
						{ __grabber__: function(module, exports, __webpack_require__) {
							window.__cr = __webpack_require__;
						} },
						[["__grabber__"]]
					]);
				} catch (e) {}
				if (window.__cr) {
					req = window.__cr;
					break;
				}
			}
		}
		if (!req) {
			console.log("[grabStore] could not capture webpack require — no webpackJsonp/webpackChunk array found");
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
		console.log("[grabStore] candidates found:", candidates.length);
		var match = candidates.find(function(s) {
			try {
				return selector in s.getState();
			} catch (e) {
				return false;
			}
		});
		if (!match) {
			console.log("[grabStore] no store found containing key \"" + selector + "\". Inspect window.__candidates for all", candidates.length, "matches.");
			window.__candidates = candidates;
		}
		return match || null;
	}
	function lesson() {
		const displayBoxId = "better-echo360-box";
		const selectorKey = "playbackRate";
		const transcriptSelectorKey = "transcripts";
		const paddingOffset = 4;
		function setupShopInTheHeader() {
			const selections = document.getElementsByClassName("header");
			var box = document.createElement("div");
			box.id = displayBoxId;
			if (selections.length == 0) {
				console.error("No header found");
				box.style.cssText = [
					"position:fixed",
					"top:10px",
					"right:10px",
					"z-index:2147483647",
					"padding:0px"
				].join(";");
				function attach() {
					if (document.body) {
						document.body.appendChild(box);
						createSpeedSelector(box).onChange(function(item) {
							window.setPlaybackSpeed(item.speed);
						});
					} else document.addEventListener("DOMContentLoaded", attach, { once: true });
				}
				attach();
			} else {
				const header = selections[0];
				const boxHeight = header.offsetHeight - 8;
				box.style.cssText = [
					"position:fixed",
					`top:${paddingOffset}px`,
					`right:${paddingOffset}px`,
					"z-index:2147483647",
					"padding:0px",
					`height:${boxHeight}px`
				].join(";");
				function attach() {
					if (document.body) {
						header.appendChild(box);
						createSpeedSelector(box).onChange(function(item) {
							window.setPlaybackSpeed(item.speed);
						});
					} else document.addEventListener("DOMContentLoaded", attach, { once: true });
				}
				attach();
			}
		}
		function createSpeedSelector(container) {
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
		function patchIntoPlayerStore() {
			var match = grabStore(selectorKey);
			if (match) {
				window.playerStore = match;
				console.log("[grabStore] playerStore set on window. Try: playerStore.getState()");
				return true;
			}
			return false;
		}
		function patchIntoTranscriptStore() {
			var match = grabStore(transcriptSelectorKey);
			if (match) {
				window.transcriptStore = match;
				console.log("[grabStore] transcriptStore set on window. Try: transcriptStore.getState()");
				return true;
			}
			return false;
		}
		function setPlaybackSpeed(speed) {
			var targetSpeed = speed || 1;
			if (!window.playerStore) {
				console.error("Issue grabbing playerStore!");
				return;
			}
			try {
				window.playerStore.getState().onPlaybackRateChange(targetSpeed);
			} catch (e) {
				console.error("Better ECHO360 - Something went wrong on rate change");
				console.error(e);
			}
		}
		window.addEventListener("load", function() {
			var patchResult = patchIntoPlayerStore();
			patchIntoTranscriptStore();
			if (patchResult) setupShopInTheHeader();
			new CaptionsService().init();
		});
		window.setPlaybackSpeed = setPlaybackSpeed;
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
	var SyllabusService = class extends Service {
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
	var RouterService = class RouterService extends Service {
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
	(function() {
		"use strict";
		function injectStyles() {
			const style = document.createElement("style");
			style.id = "be360-styles";
			style.textContent = style_default;
			document.head.appendChild(style);
		}
		injectStyles();
		new RouterService().init();
		function betterCandidates() {
			return window.__candidates.map(function(s, i) {
				try {
					return {
						i,
						state: s.getState()
					};
				} catch (e) {
					return {
						i,
						error: e.message || "Unknown error"
					};
				}
			});
		}
		window.grabStore = grabStore;
		window.betterCandidates = betterCandidates;
	})();
})();
