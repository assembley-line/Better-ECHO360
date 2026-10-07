import { HardService } from "@/services";
import template from "@/templates/switchboard.html?raw";
import { bindCheckbox } from "@/tools/bindCheckbox";

class SwitchboardService extends HardService {
    // This class allows for the user to toggle defined settings, and attaches a settings dialog

    private dialog: HTMLDialogElement | null = null;

    constructor() {
        super("Switchboard")

        this.UI_attachSettingsDialog()
        window.switchboard = () => { this.show() }
        this.reporter.report("Use switchboard() to open")
    }

    public show(): void {
        if (!this.dialog) { return }
        this.dialog.showModal()
    }

    private UI_attachSettingsDialog(): void {
        this.dialog = document.createElement("dialog");
        this.dialog.id = "switchboard";
        this.dialog.classList.add("switchboard")

        this.dialog.innerHTML = template;

        bindCheckbox(this.dialog, "#phone-enabled", "phone.hidden")
        bindCheckbox(this.dialog, "#timemachine-enabled", "timemachine.hidden")
        bindCheckbox(this.dialog, "#captions-enabled", "captions.hidden")
        bindCheckbox(this.dialog, "#syllabus-enabled", "syllabus.hidden")

        document.body.appendChild(this.dialog);
    }
}

export { SwitchboardService as Switchboard }
