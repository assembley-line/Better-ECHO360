import { RouterService } from "@/services/router";
import { Artist } from "@/services/artist";
import settings from "@/tools/settings";
import { Switchboard } from "./services/switchboard";

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

(async function () {
    "use strict";
    if (settings.better_echo360.disabled) { return }
    new Switchboard();

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
