import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import { fileURLToPath } from "node:url";

const REPO_DIST = "https://github.com/assembley-line/Better-ECHO360/raw/refs/heads/main/dist";

export default defineConfig(({ mode }) => {
    const experimental = mode === "experimental";
    const fileName = experimental ? "__EXPERIMENTAL.better-e360.user.js" : "better-e360.user.js";

    return {
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        define: {
            __EXPERIMENTAL__: JSON.stringify(experimental),
        },
        build: {
            emptyOutDir: !experimental,
        },
        plugins: [
            monkey({
                entry: "src/main.ts",
                userscript: {
                    name: experimental ? "Better ECHO360 (Experimental)" : "Better ECHO360",
                    description: "Enhances the ECHO360 experience with additional features.",
                    author: "CharlieR",
                    namespace: "http://tampermonkey.net/",
                    version: "1.0.1-beta",
                    match: ["*://echo360.net.au/*"],
                    "run-at": "document-start",
                    icon: "https://messenger-assets.qualified.com/uploads/7U9KEay8tEHtKtBg3eDboiKsuxNZ8Nez9e2jt/303ad5416775b60078af5eb38a6c20687c530d5f5e5a9ce7cb72df2d11cf86c5.png",
                    grant: ["GM_getValue", "GM_setValue", "unsafeWindow"],
                    downloadURL: `${REPO_DIST}/${fileName}`,
                    updateURL: `${REPO_DIST}/${fileName}`,
                },
                build: {
                    fileName,
                },
            }),
        ],
    };
});
