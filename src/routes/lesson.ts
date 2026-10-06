import { CaptionsService } from "@/services/captions";
import { TimeMachine } from "@/services/timemachine";

export default function lesson() {
    window.addEventListener("load", function () {
        // @ts-ignore
        const timemachine = new TimeMachine();
        // @ts-ignore
        const captionsService = new CaptionsService();
    });
}
