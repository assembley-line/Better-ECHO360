import { RouterService } from "./services/router";
import { Artist } from "./services/artist";
import { type SettingsShape } from "./tools/settings";

declare global {
    interface Window {
        playerStore: any;
        transcriptStore: any;
        settings: SettingsShape;
        __cr: any;
        __candidates: any;
        setPlaybackSpeed: any;
        [key: string]: any; // catches any other webpackJsonp/webpackChunk* dynamic globals
    }
}

(async function () {
    "use strict";

    const artist = new Artist();
    artist.paint();

    const router = new RouterService();
    router.route();

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
