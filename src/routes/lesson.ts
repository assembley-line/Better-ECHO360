import { CaptionsService } from "@/services/captions";
import TimeMachineService from "@/services/timemachine";

export default function lesson() {
    window.addEventListener("load", function () {
        const timemachine = new TimeMachineService();
        const captionsService = new CaptionsService();
    });
}
