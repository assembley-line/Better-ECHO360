import { CaptionsService } from "@/services/captions";
import TimeMachineService from "@/services/timemachine";

export default function lesson() {
    window.addEventListener("load", function () {
        // @ts-ignore
        const timemachine = new TimeMachineService();
        // @ts-ignore
        const captionsService = new CaptionsService();
    });
}
