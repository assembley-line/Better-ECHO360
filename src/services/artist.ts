import { HardService } from "@/services";
import rawStyles from "@/style.css?raw";

class ArtistService extends HardService {
    constructor() {
        super("Artist");
    }

    public paint(): void {
        const style = document.createElement("style");
        style.id = "be360-styles";
        style.textContent = rawStyles;
        this.reporter.report("Injected the stylesheet from style.css")
        document.head.appendChild(style);

        const PHOSPHOR_BASE = "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src";

        const injectStylesheet = (href: string) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = href;
            document.head.appendChild(link);
            this.reporter.report(`Injected the stylesheet with the href: ${href}`)
            return link;
        }

        injectStylesheet(`${PHOSPHOR_BASE}/regular/style.css`);
        injectStylesheet(`${PHOSPHOR_BASE}/fill/style.css`);
    }
}

export { ArtistService as Artist }
