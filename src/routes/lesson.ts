import { CaptionsService } from "@/services/captions";
import { Phone } from "@/services/phone";
import { TimeMachine } from "@/services/timemachine";

export default function lesson() {
    new TimeMachine();
    new CaptionsService();
    new Phone();
}
