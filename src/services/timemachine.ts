import { StoreService } from "@/services";
import Hacker, { ZustandStore } from "@/services/hacker";
import settings from "@/tools/settings";
import Toolbar from "@/services/toolbar";
import fromTemplate from "@/tools/fromTemplate";
import template from "@/templates/timemachine.html?raw";
import waitForElement from "@/tools/waitForElement";
import { hidden } from "@/tools/hiddenDecorator";

@hidden(settings.timemachine.hidden)
class TimeMachineService extends StoreService {
    // This class controls and implements a custom speed control for the video player
    // it requires the PlayerStore to be patched into

    private popover: HTMLDialogElement | null = null;
    private button: HTMLButtonElement | null = null;

    // Delay before closing the quick action popover after a speed change
    // for better user experience, to allow the user to verify the input
    private readonly quickActionCloseDelay = 150; // 0.15s
    private quickActionCloseTimeout: number | undefined = undefined;

    constructor() {
        super("Time Machine", [ZustandStore.PlayerStore]);

        if (this.closed) return;

        this.UI.init();
        if (settings.timemachine.hideNativeSpeedSelector) {
            waitForElement("#playback-speed-menu-menu-toggle-btn").then(
                (element) => {
                    if (element) {
                        element.style.display = "none";
                    }
                },
            );
        }
    }

    private getPlaybackSpeed(): number {
        try {
            return Hacker.grab(ZustandStore.PlayerStore).getState()
                .playbackRate;
        } catch (e) {
            this.reporter.scream("Something went wrong on rate get");
            console.error(e);
            return 1;
        }
    }

    private setPlaybackSpeed(speed: number): void {
        try {
            Hacker.grab(ZustandStore.PlayerStore)
                .getState()
                .onPlaybackRateChange(speed);
        } catch (e) {
            this.reporter.scream("Something went wrong on rate change");
            console.error(e);
        }
    }

    private UI = {
        init: async () => {
            await this.UI.attachButtonToToolbar();
            this.UI.attachPopover();
            this.UI.updatePopover();
        },

        attachButtonToToolbar: async () => {
            const toolbar = new Toolbar();
            const button = (await toolbar.addIconButton([
                "ph",
                "ph-speedometer",
            ])) as HTMLButtonElement;
            if (!button) return;
            button.id = "timemachine-button";

            this.button = button;
        },

        attachPopover: () => {
            const popover = fromTemplate<HTMLDialogElement>(template);
            this.popover = popover;

            if (!this.button || !this.popover) return;

            this.button.setAttribute("popovertarget", popover.id);

            this.popover
                .querySelectorAll<HTMLButtonElement>("button[data-speed]")
                .forEach((button) => {
                    button.addEventListener("click", () => {
                        const speed = parseFloat(
                            button.getAttribute("data-speed") || "1",
                        );
                        this.setPlaybackSpeed(speed);
                        this.UI.updatePopover();

                        // Close the dialog when a quick action is selected
                        clearTimeout(this.quickActionCloseTimeout);
                        this.quickActionCloseTimeout = window.setTimeout(() => {
                            this.popover?.hidePopover();
                        }, this.quickActionCloseDelay);
                    });
                });
            this.popover
                .querySelectorAll<HTMLButtonElement>("button[data-delta]")
                .forEach((button) => {
                    button.addEventListener("click", () => {
                        const delta = parseFloat(
                            button.getAttribute("data-delta") || "0",
                        );
                        const currentSpeed = this.getPlaybackSpeed();
                        const newSpeed =
                            Math.round((currentSpeed + delta) * 10) / 10;
                        this.setPlaybackSpeed(newSpeed);
                        this.UI.updatePopover();
                    });
                });

            this.button.appendChild(popover);
        },

        updatePopover: () => {
            if (!this.popover) return;

            const playbackSpeed = Hacker.grab(
                ZustandStore.PlayerStore,
            ).getState().playbackRate;
            const lectureDuration = Hacker.grab(
                ZustandStore.PlayerStore,
            ).getState().duration;

            const adjustedDuration = lectureDuration / playbackSpeed;
            const adjustedDurationMins = Math.ceil(adjustedDuration / 60);

            const currentSpeedLabel =
                this.popover.querySelector("#current-speed");
            if (currentSpeedLabel) {
                currentSpeedLabel.textContent = `${playbackSpeed}x`;
            }

            const adjustedDurationLabel =
                this.popover.querySelector("#sum-lecture-time");
            if (adjustedDurationLabel) {
                adjustedDurationLabel.textContent = `Total lecture time is ${adjustedDurationMins} mins`;
            }
        },
    };
}

export { TimeMachineService as TimeMachine };
