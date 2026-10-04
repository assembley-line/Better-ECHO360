import { SoftService } from "@/services";
import Toolbar from "./toolbar";

interface Cue {
    startMs: number;
    endMs: number;
    content: string;
    speaker?: string;
    confidence?: any;
    notes?: any[];
}

interface RetrievedCue {
    content: string;
    end: number;
}

export class CaptionsService extends SoftService {
    private static readonly wrapperId = "better-echo360-caption-wrapper";
    private static readonly boxId = "better-echo360-captions";

    private transcriptAvailable = false;

    private currentCueEnd = -1;
    private captionsBox: HTMLElement | null = null;
    private unsub: (() => void) | null = null;

    private transcriptStore: any;
    private playerStore: any;

    constructor() {
        super("Captions");
    }

    // Check if the captions service can function, if not, report unavailable
    public init(): void {
        this.transcriptStore = window.transcriptStore;
        this.playerStore = window.playerStore;
        if (!this.transcriptStore || !this.playerStore) {
            this.reporter.scream(
                "Couldn't access the player or transcript store, check window.player/transcriptStore for more. Aborting",
            );
            return;
        }

        this.transcriptAvailable = true;
        this.cues = this.getAllCues();
        this.UI_AttachButtonToToolbar();

        this.attach();
    }

    protected onToggleService(): void {
        if (this.enabled) {
            this.attach();
        } else {
            this.destroy();
        }
    }

    // Fetching cues logic
    private cues: Cue[] | null = null;
    private fetchCount: number = 0;
    private stopFetching: boolean = false;
    private readonly maxFetchAttempts: number = 20;
    // ---
    private getAllCues(): Cue[] | null {
        if (this.fetchCount > this.maxFetchAttempts) {
            this.reporter.warn(
                "Max fetch attempts reached for cues, stopping further attempts.",
            );
            this.stopFetching = true;
            return null;
        }

        this.fetchCount += 1;
        return (this.transcriptStore.getState().transcripts as Cue[]) || null;
    }

    private getCueFromTimestamp(timestamp: number): RetrievedCue | null {
        if (!this.transcriptAvailable) {
            this.reporter.tell(
                "Tried to call getCueFromTimestamp without transcript available, returning null.",
            );
            return null;
        }

        // If the transcript has been patched but cues are still null, try to grab them
        // again as the API may take some more time
        if (!this.cues) {
            if (this.stopFetching) {
                return null;
            }
            this.cues = this.getAllCues();
            if (!this.cues) {
                return null;
            }
        }

        // Get the timestamp in ms
        const ms = timestamp * 1000;
        // Loop over every queue and match the inbetween
        for (var i = 0; i < this.cues!.length; i++) {
            const cue = this.cues![i];
            if (ms >= cue.startMs && ms < cue.endMs) {
                return {
                    content: cue.content,
                    end: Math.floor(cue.endMs / 1000), // Integer divide it to the lowest second
                };
            }
        }
        return null;
    }

    private attach(): void {
        if (!this.transcriptAvailable) {
            return;
        }
        this.reporter.tell("Attaching captions box");
        this.captionsBox = this.setupCaptionBox();

        this.unsub = this.playerStore.subscribe((state: any) => {
            const timestamp = state.currentTime;

            if (timestamp < this.currentCueEnd) {
                return;
            }

            const cue = this.getCueFromTimestamp(timestamp);
            var content = "";

            if (cue) {
                content = cue.content;
                this.currentCueEnd = cue.end;
            } else {
                content = "";
                this.currentCueEnd = -1;
            }

            this.captionsBox!.textContent = content;
        });
    }

    private setupCaptionBox(): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.id = CaptionsService.wrapperId;
        wrapper.style.cssText = [
            "position:fixed",
            "left:0",
            "right:0",
            "bottom:60px",
            "width:100%",
            "display:flex",
            "justify-content:center",
            "pointer-events:none",
            "z-index:2147483647",
        ].join(";");

        const box = document.createElement("div");
        box.id = CaptionsService.boxId;
        box.style.cssText = [
            "max-width:80%",
            "background:rgba(0,0,0,0.75)",
            "color:#ffffff",
            'font:20px -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif',
            "padding:6px 14px",
            "border-radius:6px",
            "text-align:center",
            "white-space:pre-wrap",
        ].join(";");
        box.textContent = "";

        wrapper.appendChild(box);

        const attach = () => {
            if (document.body) document.body.appendChild(wrapper);
            else
                document.addEventListener("DOMContentLoaded", attach, {
                    once: true,
                });
        };
        attach();

        return box;
    }

    private async UI_AttachButtonToToolbar(): Promise<void> {
        const toolbar = new Toolbar();
        const button = await toolbar.addIconButton(["ph", "ph-closed-captioning"]);
        if (!button) { return }

        button.toggleAttribute('data-enabled', this.enabled)
        button.addEventListener("click", () => {
            this.toggle()
            button.toggleAttribute("data-enabled", this.enabled)
        })
    }

    public destroy(): void {
        if (this.unsub) {
            this.unsub();
            this.unsub = null;
        }
        document.getElementById(CaptionsService.wrapperId)?.remove();
    }
}
