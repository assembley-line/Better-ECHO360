import { CaptionsService } from "@/services/captions";

export function grabStore(selector: string): any {
    // --- Step 1: capture webpack's require function ---
    var req = window.__cr;
    if (!req) {
        var chunkNames: string[] = [];
        Object.keys(window).forEach(function (k) {
            if (/^webpackJsonp/.test(k) || /^webpackChunk/.test(k))
                chunkNames.push(k);
        });

        for (var n = 0; n < chunkNames.length; n++) {
            var arr = window[chunkNames[n]];
            if (!Array.isArray(arr)) continue;
            try {
                arr.push([
                    [],
                    {
                        __grabber__: function (
                            //@ts-ignore
                            module: any,
                            //@ts-ignore
                            exports: any,
                            __webpack_require__: any,
                        ) {
                            window.__cr = __webpack_require__;
                        },
                    },
                    [["__grabber__"]],
                ]);
            } catch (e) {}
            if (window.__cr) {
                req = window.__cr;
                break;
            }
        }
    }

    if (!req) {
        console.log(
            "[grabStore] could not capture webpack require — no webpackJsonp/webpackChunk array found",
        );
        return null;
    }

    // --- Step 2: scan the module cache for Zustand-shaped stores ---
    var cache = req.c;
    var candidates: any[] = [];

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
                if (
                    (val && typeof val.getState === "function") ||
                    typeof val.setState === "function"
                ) {
                    candidates.push(val);
                }
            } catch (e) {}
        }
    }

    console.log("[grabStore] candidates found:", candidates.length);

    // --- Step 3: narrow to the one matching your target key ---
    var match = candidates.find(function (s) {
        try {
            return selector in s.getState();
        } catch (e) {
            return false;
        }
    });

    if (!match) {
        console.log(
            '[grabStore] no store found containing key "' +
                selector +
                '". Inspect window.__candidates for all',
            candidates.length,
            "matches.",
        );
        window.__candidates = candidates;
    }

    return match || null;
}

export default function lesson() {
    const displayBoxId = "better-echo360-box";
    const selectorKey = "playbackRate";
    const transcriptSelectorKey = "transcripts";
    const paddingOffset = 4;

    function setupShopInTheHeader() {
        const selections = document.getElementsByClassName("header");
        var box = document.createElement("div");
        box.id = displayBoxId;

        if (selections.length == 0) {
            // Just place the box floating
            console.error("No header found");
            box.style.cssText = [
                "position:fixed",
                "top:10px",
                "right:10px",
                "z-index:2147483647",
                "padding:0px",
            ].join(";");

            function attach() {
                if (document.body) {
                    document.body.appendChild(box);
                    var selector = createSpeedSelector(box);
                    selector.onChange(function (item: any) {
                        window.setPlaybackSpeed(item.speed);
                    });
                } else {
                    document.addEventListener("DOMContentLoaded", attach, {
                        once: true,
                    });
                }
            }

            attach();
        } else {
            // Use the first one
            const header = selections[0] as HTMLElement;
            const headerHeight = header.offsetHeight;

            const boxHeight = headerHeight - 2 * paddingOffset;

            box.style.cssText = [
                "position:fixed",
                `top:${paddingOffset}px`,
                `right:${paddingOffset}px`,
                "z-index:2147483647",
                "padding:0px",
                `height:${boxHeight}px`,
            ].join(";");

            function attach() {
                if (document.body) {
                    header.appendChild(box);
                    var selector = createSpeedSelector(box);
                    selector.onChange(function (item: any) {
                        window.setPlaybackSpeed(item.speed);
                    });
                } else {
                    document.addEventListener("DOMContentLoaded", attach, {
                        once: true,
                    });
                }
            }

            attach();
        }
    }

    function createSpeedSelector(container: HTMLElement) {
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
            { speed: 1, label: "1x" },
            { speed: 1.5, label: "1.5x" },
            { speed: 2, label: "2x" },
            { speed: 2.5, label: "2.5x" },
            { speed: 3, label: "3x" },
        ];
        var control = document.createElement("div");
        control.className = "seg-control";
        control.tabIndex = 0;
        control.innerHTML =
            '<div class="seg-highlight"></div>' +
            speeds
                .map(function (s, i) {
                    return (
                        '<div class="seg-item" data-i="' +
                        i +
                        '">' +
                        s.label +
                        "</div>"
                    );
                })
                .join("");
        container.appendChild(control);

        var highlight = control.querySelector(".seg-highlight") as HTMLElement;
        var items = control.querySelectorAll(".seg-item");
        var n = items.length;
        var index = 0;
        var dragging = false;
        var onChangeFn: any = null;

        function render() {
            highlight.style.transform = "translateX(" + index * 100 + "%)";
            items.forEach(function (el, i) {
                el.classList.toggle("active", i === index);
            });
        }
        function setIndex(i: number) {
            i = Math.max(0, Math.min(n - 1, i));
            if (i === index) return;
            index = i;
            render();
            if (onChangeFn) onChangeFn(speeds[index], index);
        }
        function indexFromX(clientX: number) {
            var rect = control.getBoundingClientRect();
            var pct = Math.max(
                0,
                Math.min(0.999, (clientX - rect.left) / rect.width),
            );
            return Math.floor(pct * n);
        }
        function down(e: any) {
            dragging = true;
            highlight.style.transition = "none";
            setIndex(indexFromX(e.touches ? e.touches[0].clientX : e.clientX));
            e.preventDefault();
        }
        function move(e: any) {
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
        control.addEventListener("keydown", function (e) {
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
            get: function () {
                return speeds[index];
            },
            set: function (i: number) {
                setIndex(i);
            },
            onChange: function (fn: any) {
                onChangeFn = fn;
            },
        };
    }

    function patchIntoPlayerStore(): boolean {
        var match = grabStore(selectorKey);

        if (match) {
            window.playerStore = match;
            console.log(
                "[grabStore] playerStore set on window. Try: playerStore.getState()",
            );
            return true;
        }

        return false;
    }

    function patchIntoTranscriptStore(): boolean {
        var match = grabStore(transcriptSelectorKey);

        if (match) {
            window.transcriptStore = match;
            console.log(
                "[grabStore] transcriptStore set on window. Try: transcriptStore.getState()",
            );
            return true;
        }

        return false;
    }

    function setPlaybackSpeed(speed: number) {
        var targetSpeed = speed || 1; // Default to 1x speed

        if (!window.playerStore) {
            console.error("Issue grabbing playerStore!");
            return;
        }

        try {
            window.playerStore.getState().onPlaybackRateChange(targetSpeed);
        } catch (e) {
            console.error(
                "Better ECHO360 - Something went wrong on rate change",
            );
            console.error(e);
        }
    }

    window.addEventListener("load", function () {
        var patchResult = patchIntoPlayerStore();
        patchIntoTranscriptStore();
        if (patchResult) {
            setupShopInTheHeader();
        }
        const captionsService = new CaptionsService();
        captionsService.init();
    });

    window.setPlaybackSpeed = setPlaybackSpeed;
}
