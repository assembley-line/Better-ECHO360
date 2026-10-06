import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
    plugins: [
        monkey({
            entry: "src/main.ts",
            userscript: {
                name: "Better ECHO360",
                description:
                    "Enhances the ECHO360 experience with additional features.",
                author: "CharlieR",
                match: ["*://echo360.net.au/*"],
                namespace: "http://tampermonkey.net/",
                version: "1.0.1-beta",
                "run-at": "document-start",
                icon: "https://messenger-assets.qualified.com/uploads/7U9KEay8tEHtKtBg3eDboiKsuxNZ8Nez9e2jt/303ad5416775b60078af5eb38a6c20687c530d5f5e5a9ce7cb72df2d11cf86c5.png",
                grant: ["GM_getValue", "GM_setValue", "unsafeWindow"],
                downloadURL: "https://github.com/assembley-line/Better-ECHO360/raw/refs/heads/main/dist/better-e360.user.js",
                updateURL: "https://github.com/assembley-line/Better-ECHO360/raw/refs/heads/main/dist/better-e360.user.js",
            },
        }),
    ],
});
