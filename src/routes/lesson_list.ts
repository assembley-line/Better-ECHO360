import { SyllabusService } from "@/services/syllabus";

function waitForElement(
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

export default function LessonList(courseId: string) {
    const syllabus = new SyllabusService(courseId);

    syllabus.init().then((success) => {
        if (success) {
            attachJumpButton();
        }
    });

    function buildPlatform(): HTMLElement {
        const platform = document.createElement("div");
        platform.classList.add("syllabus-options-box");

        return platform;
    }

    function buildButtonGroup(): HTMLElement {
        const buttonGroup = document.createElement("div");
        buttonGroup.classList.add("syllabus-button-group");
        return buttonGroup;
    }

    function buildJumpButtonOnto(
        parent: HTMLElement,
        handler: () => void,
    ): void {
        const jumpButton = document.createElement("button");
        jumpButton.textContent = "Jump to today's lesson";
        jumpButton.classList.add("jump-button");

        jumpButton.addEventListener("click", handler);

        parent.appendChild(jumpButton);
    }

    function buildWatchButtonOnto(
        parent: HTMLElement,
        handler: () => void,
    ): void {
        const watchButton = document.createElement("button");
        watchButton.textContent = "Watch today's lesson";
        watchButton.classList.add("watch-button");

        watchButton.addEventListener("click", handler);

        parent.appendChild(watchButton);
    }

    async function attachJumpButton() {
        // Attach the jump handler and check for todays lessons
        const todays = syllabus.getTodaysLessons();
        if (todays.length == 0) {
            console.info("No lessons today");
            return; // No lessons today, do nothing
        }
        const first = todays[0];
        // Check if the page contains that id box
        const lessonElement = await waitForElement(
            `[data-test-lessonid="${first.id}"]`,
        );
        if (!lessonElement) {
            console.error(
                "Something went wrong, no element found for lesson ",
                first.id,
            );
            return;
        }

        const platform = buildPlatform();
        const buttonGroup = buildButtonGroup();

        buildJumpButtonOnto(buttonGroup, () => {
            lessonElement.scrollIntoView({ behavior: "smooth" });
            const ring = createHighlightRing(lessonElement);
            setTimeout(() => {
                ring.remove();
            }, 1500); // If you change this timeout value ensure you change the animation keyframes
        });
        buildWatchButtonOnto(buttonGroup, () => {
            window.location.assign(
                `https://echo360.net.au/lesson/${first.id}/classroom`,
            );
        });

        platform.prepend(buttonGroup);
        document.body.appendChild(platform);
    }

    function createHighlightRing(target: Element): HTMLElement {
        const ring = document.createElement("div");
        ring.className = "be360-highlight-ring";
        document.body.appendChild(ring);
        const ringPadding = 3;

        function position() {
            const rect = target.getBoundingClientRect();
            ring.style.top = `${rect.top - ringPadding}px`;
            ring.style.left = `${rect.left - ringPadding}px`;
            ring.style.width = `${rect.width + 2 * ringPadding}px`;
            ring.style.height = `${rect.height + 2 * ringPadding}px`;
        }

        position();
        window.addEventListener("scroll", position, true); // capture phase catches scroll on any ancestor
        window.addEventListener("resize", position);

        return ring;
    }
}
