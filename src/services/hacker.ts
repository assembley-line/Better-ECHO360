import { Reporter } from "@/logging/reporter";
import enumName from "@/tools/enumName";

export enum ZustandStore {
    PlayerStore = "playbackRate",
    TranscriptStore = "transcripts",
}

export default class HackerService {
    // This class assists other classes with patching into the Zustand store or
    // intercepting network requests. It is a utility class that provides methods for these tasks.
    // It is a custom service as it is used within the service sub-classes and will cause circular import issues
    // so no extensions are used and the reporter is lazy loaded and manually implemented

    private static stores: Partial<Record<ZustandStore, any>> = {};
    private static _reporter: Reporter | null = null; // Lazy load reporter

    private static get reporter(): Reporter {
        if (!HackerService._reporter) {
            HackerService._reporter = new Reporter("Hacker");
            HackerService._reporter.init();
        }
        return HackerService._reporter;
    }

    private constructor() {}

    public static grab(store: ZustandStore): any | null {
        const cached = HackerService.stores[store];
        if (cached) return cached;

        const found = HackerService.findStore(store);
        if (found) HackerService.stores[store] = found;
        return found;
    }

    private static findStore(store: ZustandStore): any | null {
        // --- Step 1: capture webpack's require function ---
        var storeName = enumName(ZustandStore, store);
        var prefix = `(${storeName}) `
        HackerService.reporter.report(prefix + "Finding");
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
            this.reporter.warn(
                "Could not capture webpack require — no webpackJsonp/webpackChunk array found",
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

        this.reporter.report(prefix + "Found: " + candidates.length + " candidates");

        // --- Step 3: narrow to the one matching your target key ---
        var match = candidates.find(function (s) {
            try {
                return store.valueOf() in s.getState();
            } catch (e) {
                return false;
            }
        });

        window.__candidates = candidates;
        if (!match) {
            this.reporter.warn(prefix + "No matches found, look to window.__candidates for more")
        } else {
            this.reporter.report(prefix + "Found store")
        }

        return match || null;
    }
}
