import { StoreService } from "@/services";
import Hacker, { ZustandStore } from "@/services/hacker";
import settings from "@/tools/settings";

class TimeMachineService extends StoreService {
    // This class controls and implements a custom speed control for the video player
    // it requires the PlayerStore to be patched into

    constructor() {
        super("Time Machine", [ZustandStore.PlayerStore]);

        if (this.closed) return;

        this.setupShopInTheHeader();
        this.setPlaybackSpeed(settings.timemachine.defaultSpeed);
    }

    // LEGACY CODE - To be rewritten
    private displayBoxId = "better-echo360-box";
    private paddingOffset = 4;

    private setupShopInTheHeader() {
        const selections = document.getElementsByClassName("header");
        var box = document.createElement("div");
        box.id = this.displayBoxId;

        if (selections.length == 0) {
            // Just place the box floating
            console.error("No header found");
            box.style.cssText = [
                "position:fixed",
                "top:10px",
                "right:10px",
                "z-index:2147483647",
                "padding:0px",
            ].join(";");

            const attach = () => {
                if (document.body) {
                    document.body.appendChild(box);
                    var selector = this.createSpeedSelector(box);
                    selector.onChange((item: any) => {
                        this.setPlaybackSpeed(item.speed);
                    });
                } else {
                    document.addEventListener("DOMContentLoaded", attach, {
                        once: true,
                    });
                }
            };

            attach();
        } else {
            // Use the first one
            const header = selections[0] as HTMLElement;
            const headerHeight = header.offsetHeight;

            const boxHeight = headerHeight - 2 * this.paddingOffset;

            box.style.cssText = [
                "position:fixed",
                `top:${this.paddingOffset}px`,
                `right:${this.paddingOffset}px`,
                "z-index:2147483647",
                "padding:0px",
                `height:${boxHeight}px`,
            ].join(";");

            const attach = () => {
                if (document.body) {
                    header.appendChild(box);
                    var selector = this.createSpeedSelector(box);
                    selector.onChange((item: any) => {
                        this.setPlaybackSpeed(item.speed);
                    });
                } else {
                    document.addEventListener("DOMContentLoaded", attach, {
                        once: true,
                    });
                }
            };

            attach();
        }
    }

    private createSpeedSelector(container: HTMLElement) {
        if (!document.getElementById("seg-styles")) {
            var style = document.createElement("style");
            style.id = "seg-styles";
            style.textContent = `
      .seg-control{--seg-radius:5px;position:relative;display:flex;gap:2px;width:200px;height:100%;box-sizing:border-box;background:#ffffff;border-radius:var(--seg-radius);padding:3px;user-select:none;-webkit-user-select:none;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
      .seg-highlight{position:absolute;top:3px;left:3px;height:calc(100% - 6px);width:calc((100% - 6px) / 5);background:rgba(0,0,0,0.05);border-radius:var(--seg-radius);box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .28s cubic-bezier(.4,0,.2,1);z-index:1}
      .seg-item{position:relative;flex:1;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#8e8d89;z-index:2;transition:color .2s,font-weight .2s}
      .seg-item.active{color:#000000;font-weight:600}
    `;
            document.head.appendChild(style);
        }

        var speeds = [
            { speed: 1, label: "1x" },
            { speed: 1.5, label: "1.5x" },
            { speed: 2, label: "2x" },
            { speed: 2.5, label: "2.5x" },
            { speed: 3, label: "3x" },
        ];
        var control = document.createElement("div");
        control.className = "seg-control";
        control.tabIndex = 0;
        control.innerHTML =
            '<div class="seg-highlight"></div>' +
            speeds
                .map(function (s, i) {
                    return (
                        '<div class="seg-item" data-i="' +
                        i +
                        '">' +
                        s.label +
                        "</div>"
                    );
                })
                .join("");
        container.appendChild(control);

        var highlight = control.querySelector(".seg-highlight") as HTMLElement;
        var items = control.querySelectorAll(".seg-item");
        var n = items.length;
        var index = 0;
        var dragging = false;
        var onChangeFn: any = null;

        function render() {
            highlight.style.transform = "translateX(" + index * 100 + "%)";
            items.forEach(function (el, i) {
                el.classList.toggle("active", i === index);
            });
        }
        function setIndex(i: number) {
            i = Math.max(0, Math.min(n - 1, i));
            if (i === index) return;
            index = i;
            render();
            if (onChangeFn) onChangeFn(speeds[index], index);
        }
        function indexFromX(clientX: number) {
            var rect = control.getBoundingClientRect();
            var pct = Math.max(
                0,
                Math.min(0.999, (clientX - rect.left) / rect.width),
            );
            return Math.floor(pct * n);
        }
        function down(e: any) {
            dragging = true;
            highlight.style.transition = "none";
            setIndex(indexFromX(e.touches ? e.touches[0].clientX : e.clientX));
            e.preventDefault();
        }
        function move(e: any) {
            if (!dragging) return;
            setIndex(indexFromX(e.touches ? e.touches[0].clientX : e.clientX));
        }
        function up() {
            if (!dragging) return;
            dragging = false;
            highlight.style.transition = "";
        }

        control.addEventListener("mousedown", down);
        control.addEventListener("touchstart", down, { passive: false });
        window.addEventListener("mousemove", move);
        window.addEventListener("touchmove", move, { passive: false });
        window.addEventListener("mouseup", up);
        window.addEventListener("touchend", up);
        control.addEventListener("keydown", function (e) {
            if (e.key === "ArrowRight") {
                setIndex(index + 1);
                e.preventDefault();
            }
            if (e.key === "ArrowLeft") {
                setIndex(index - 1);
                e.preventDefault();
            }
        });

        render();

        return {
            get: function () {
                return speeds[index];
            },
            set: function (i: number) {
                setIndex(i);
            },
            onChange: function (fn: any) {
                onChangeFn = fn;
            },
        };
    }

    private setPlaybackSpeed(speed: number) {
        var targetSpeed = speed || 1; // Default to 1x speed

        try {
            Hacker.grab(ZustandStore.PlayerStore)
                .getState()
                .onPlaybackRateChange(targetSpeed);
        } catch (e) {
            this.reporter.scream("Something went wrong on rate change");
            console.error(e);
        }
    }
}

export { TimeMachineService as TimeMachine };
