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

    function buildOptionsButtonOnto(
        parent: HTMLElement,
        handler: () => void,
    ): void {
        const optionsButton = document.createElement("button");
        optionsButton.classList.add("options-button");
        optionsButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.3175 7.14139L20.8239 6.28479C20.4506 5.63696 20.264 5.31305 19.9464 5.18388C19.6288 5.05472 19.2696 5.15664 18.5513 5.36048L17.3311 5.70418C16.8725 5.80994 16.3913 5.74994 15.9726 5.53479L15.6357 5.34042C15.2766 5.11043 15.0004 4.77133 14.8475 4.37274L14.5136 3.37536C14.294 2.71534 14.1842 2.38533 13.9228 2.19657C13.6615 2.00781 13.3143 2.00781 12.6199 2.00781H11.5051C10.8108 2.00781 10.4636 2.00781 10.2022 2.19657C9.94085 2.38533 9.83106 2.71534 9.61149 3.37536L9.27753 4.37274C9.12465 4.77133 8.84845 5.11043 8.48937 5.34042L8.15249 5.53479C7.73374 5.74994 7.25259 5.80994 6.79398 5.70418L5.57375 5.36048C4.85541 5.15664 4.49625 5.05472 4.17867 5.18388C3.86109 5.31305 3.67445 5.63696 3.30115 6.28479L2.80757 7.14139C2.45766 7.74864 2.2827 8.05227 2.31666 8.37549C2.35061 8.69871 2.58483 8.95918 3.05326 9.48012L4.0843 10.6328C4.3363 10.9518 4.51521 11.5078 4.51521 12.0077C4.51521 12.5078 4.33636 13.0636 4.08433 13.3827L3.05326 14.5354C2.58483 15.0564 2.35062 15.3168 2.31666 15.6401C2.2827 15.9633 2.45766 16.2669 2.80757 16.8741L3.30114 17.7307C3.67443 18.3785 3.86109 18.7025 4.17867 18.8316C4.49625 18.9608 4.85542 18.8589 5.57377 18.655L6.79394 18.3113C7.25263 18.2055 7.73387 18.2656 8.15267 18.4808L8.4895 18.6752C8.84851 18.9052 9.12464 19.2442 9.2775 19.6428L9.61149 20.6403C9.83106 21.3003 9.94085 21.6303 10.2022 21.8191C10.4636 22.0078 10.8108 22.0078 11.5051 22.0078H12.6199C13.3143 22.0078 13.6615 22.0078 13.9228 21.8191C14.1842 21.6303 14.294 21.3003 14.5136 20.6403L14.8476 19.6428C15.0004 19.2442 15.2765 18.9052 15.6356 18.6752L15.9724 18.4808C16.3912 18.2656 16.8724 18.2055 17.3311 18.3113L18.5513 18.655C19.2696 18.8589 19.6288 18.9608 19.9464 18.8316C20.264 18.7025 20.4506 18.3785 20.8239 17.7307L21.3175 16.8741C21.6674 16.2669 21.8423 15.9633 21.8084 15.6401C21.7744 15.3168 21.5402 15.0564 21.0718 14.5354L20.0407 13.3827C19.7887 13.0636 19.6098 12.5078 19.6098 12.0077C19.6098 11.5078 19.7888 10.9518 20.0407 10.6328L21.0718 9.48012C21.5402 8.95918 21.7744 8.69871 21.8084 8.37549C21.8423 8.05227 21.6674 7.74864 21.3175 7.14139Z" stroke-linecap="round"></path>
                <path d="M15.5195 12C15.5195 13.933 13.9525 15.5 12.0195 15.5C10.0865 15.5 8.51953 13.933 8.51953 12C8.51953 10.067 10.0865 8.5 12.0195 8.5C13.9525 8.5 15.5195 10.067 15.5195 12Z"></path>
            </svg>
            `;

        optionsButton.addEventListener("click", handler);

        parent.appendChild(optionsButton);
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
        buildOptionsButtonOnto(buttonGroup, () => {
            alert("havent built this yet");
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
