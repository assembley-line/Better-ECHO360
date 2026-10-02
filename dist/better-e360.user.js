// ==UserScript==
// @name         Better ECHO360
// @namespace    http://tampermonkey.net/
// @version      1.0.0-alpha
// @author       CharlieR
// @description  Enhances the ECHO360 experience with additional features.
// @icon         https://messenger-assets.qualified.com/uploads/7U9KEay8tEHtKtBg3eDboiKsuxNZ8Nez9e2jt/303ad5416775b60078af5eb38a6c20687c530d5f5e5a9ce7cb72df2d11cf86c5.png
// @match        *://echo360.net.au/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
	"use strict";
	var style_default = ":root{--primary-color:#d5006c;--primary-color-faded:#ffcce6}.be360-highlight-ring{isolation:isolate;border:7px solid var(--primary-color);box-sizing:border-box;pointer-events:none;z-index:2147483647;opacity:0;border-radius:7px;animation:1.5s ease-in-out forwards be360-ring-pulse;position:fixed}@keyframes be360-ring-pulse{0%{opacity:0}15%{opacity:1}85%{opacity:1}to{opacity:0}}.syllabus-options-box{border-radius:30px;border-end-end-radius:0;z-index:9999;color:#789;background-color:#f7f7f7;border:1px solid #ccc;border-bottom-left-radius:0;flex-direction:column;align-items:center;gap:10px;padding:10px 10px 15px;font-size:14px;animation:.35s cubic-bezier(.34,1.56,.64,1) forwards platform-pop-in;display:flex;position:fixed;bottom:0;right:10px;box-shadow:0 2px 10px #0000001a}@keyframes platform-pop-in{0%{transform:translateY(40px)scale(.9)}to{transform:translateY(0)scale(1)}}.syllabus-button-group{flex-direction:row;gap:2px;display:flex}.watch-button{background-color:var(--primary-color);color:#fff;cursor:pointer;border:none;border-radius:5px 20px 20px 5px;width:200px;height:40px;padding:10px 20px;transition:all .2s ease-in-out;position:relative}.jump-button{background-color:var(--primary-color-faded);width:200px;height:40px;color:var(--primary-color);cursor:pointer;border:none;border-radius:20px 5px 5px 20px;padding:10px 20px;transition:all .2s ease-in-out;position:relative}.jump-button:hover,.watch-button:hover{font-weight:semibold}";
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
