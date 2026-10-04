import rawStyles from "@/style.css?inline";

import { grabStore } from "./routes/lesson";
import { RouterService } from "./services/router";

declare global {
    interface Window {
        playerStore: any;
        transcriptStore: any;
        __cr: any;
        __candidates: any;
        setPlaybackSpeed: any;
        [key: string]: any; // catches any other webpackJsonp/webpackChunk* dynamic globals
    }
}

(function () {
    "use strict";

    function injectStyles(): void {
        const style = document.createElement("style");
        style.id = "be360-styles";
        style.textContent = rawStyles;
        document.head.appendChild(style);

        const PHOSPHOR_BASE = "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src";

        function injectStylesheet(href: string): HTMLLinkElement {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.type = "text/css";
          link.href = href;
            document.head.appendChild(link);
            console.log("Injected stylesheet for: ", href)
            return link;
        }

        injectStylesheet(`${PHOSPHOR_BASE}/regular/style.css`);
        injectStylesheet(`${PHOSPHOR_BASE}/fill/style.css`);
    }
    injectStyles();

    const router = new RouterService();
    router.init();

    function betterCandidates() {
        return window.__candidates.map(function (s: any, i: any) {
            try {
                var state = s.getState();
                return { i: i, state: state };
            } catch (e) {
                return {
                    i: i,
                    error:
                        (e as { message: string }).message || "Unknown error",
                };
            }
        });
    }

    window.grabStore = grabStore;
    window.betterCandidates = betterCandidates;
})();

export {};
