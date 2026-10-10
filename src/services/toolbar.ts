import { HardService } from "@/services";
import { reporter, type Reporter } from "@/tools/reporterDecorator";
import waitForElement from "@/tools/waitForElement";

interface Toolbar extends Reporter {}

@reporter
class Toolbar extends HardService {
    private static locating: Promise<HTMLElement | null> | null = null;

    constructor() {
        super("Toolbar");
        this.locate();
    }

    private locate(): Promise<HTMLElement | null> {
        return (Toolbar.locating ??= (async () => {
            const fullscreenButton = await waitForElement(
                "#fullscreen-toggle-btn",
            );
            if (!fullscreenButton) {
                this.reporter.warn(
                    "Could not find the fullscreen button to locate the toolbar.",
                );
                return null;
            }

            const toolbar = fullscreenButton.parentElement;
            if (!toolbar) {
                this.reporter.warn("Could not find the toolbar element.");
                return null;
            }

            return toolbar;
        })());
    }

    private getElement(): Promise<HTMLElement | null> {
        return this.locate();
    }

    async addIconButton(
        iconClasses: string[],
        handler?: () => void,
    ): Promise<HTMLElement | void> {
        const toolbar = await this.getElement();
        if (!toolbar) return;

        const iconButton = document.createElement("button");
        const icon = document.createElement("i");
        icon.classList.add(...iconClasses);
        iconButton.appendChild(icon);
        iconButton.classList.add("icon-button-captions");

        if (handler) {
            iconButton.addEventListener("click", handler);
        }

        toolbar.prepend(iconButton);

        return iconButton;
    }
}

export { Toolbar };
