import { RouterService } from "./services/router";
import { Artist } from "./services/artist";
import Hacker from "./services/hacker";
import { ZustandStore } from "./services/hacker";

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

    const artist = new Artist();
    artist.paint();

    const router = new RouterService();
    router.init();

//     const playerStore = Hacker.grab(ZustandStore.PlayerStore)
//     window.playerStore = playerStore;
//     const transcriptStore = Hacker.grab(ZustandStore.TranscriptStore)
//     window.transcriptStore = transcriptStore;
//
//     function betterCandidates() {
//         return window.__candidates.map(function (s: any, i: any) {
//             try {
//                 var state = s.getState();
//                 return { i: i, state: state };
//             } catch (e) {
//                 return {
//                     i: i,
//                     error:
//                         (e as { message: string }).message || "Unknown error",
//                 };
//             }
//         });
//     }
//
//     window.betterCandidates = betterCandidates;
})();

export {};
