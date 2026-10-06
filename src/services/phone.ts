import { SoftService } from "@/services";
import Toolbar from "@/services/toolbar";
import { createEmbed } from "@/tools/youtube";

class PhoneService extends SoftService {
    private static videoUrl = "https://www.youtube.com/watch?v=_bwtEtYQwgc";
        private button: HTMLElement | null = null;
        private phoneEl: HTMLElement | null = null;     // renamed from `window` to avoid confusion with the global

        constructor() {
            super("Phone");
            this.disable();
            this.UI_attachButton();
        }

        protected onToggleService(): void {
            this.button?.toggleAttribute("data-enabled", this.enabled);

            if (this.enabled) this.UI_attachPhoneWindow();
            else this.UI_removePhoneWindow();
        }

        private UI_attachPhoneWindow(): void {
            if (this.phoneEl) return;                    // already showing, so a double toggle can't add two

            const el = createEmbed(PhoneService.videoUrl, { zoom: 1.05 });
            if (!el) return;

            Object.assign(el.style, {
                position: "fixed",
                bottom: "10px",
                right: "10px",
                width: "281px",                          // 9:16 of the height
                height: "500px",
                zIndex: "10000",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            });

            this.phoneEl = el;
            document.body.appendChild(el);
        }

        private UI_removePhoneWindow(): void {
            this.phoneEl?.remove();
            this.phoneEl = null;
        }

    private async UI_attachButton(): Promise<void> {
        const iconClass: string = "ph-device-mobile-speaker"

        const toolbar = new Toolbar();
        this.button = await toolbar.addIconButton(["ph", iconClass]) ?? null;
        if (!this.button) { return }

        this.button.toggleAttribute('data-enabled', this.enabled)
        this.button.addEventListener("click", () => {
            this.toggle()
        })
    }
}

export { PhoneService as Phone }
