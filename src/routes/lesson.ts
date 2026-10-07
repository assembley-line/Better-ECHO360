import { CaptionsService } from "@/services/captions";
import { Phone } from "@/services/phone";
import { TimeMachine } from "@/services/timemachine";
import settings from "@/tools/settings";

export default function lesson() {
    if (!settings.timemachine.hidden) new TimeMachine();
    if (!settings.captions.hidden) new CaptionsService();
    if (!settings.phone.hidden) new Phone();
}
