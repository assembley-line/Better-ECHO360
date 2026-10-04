export default function waitForElement(
    selector: string,
    timeoutMs = 10000,
): Promise<HTMLElement | null> {
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

            observer.observe(document.body!, {
                childList: true,
                subtree: true,
            });

            const timeout = setTimeout(() => {
                if (settled) return;
                settled = true;
                observer.disconnect();
                resolve(null);
            }, timeoutMs);
        }

        if (document.body) {
            start();
        } else {
            document.addEventListener("DOMContentLoaded", start, {
                once: true,
            });
        }
    });
}
