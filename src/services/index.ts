import { Reporter } from "@/logging/reporter";
import Hacker, { ZustandStore } from "@/services/hacker";

export abstract class Service {
    protected readonly reporter: Reporter;

    protected constructor(name: string) {
        this.reporter = new Reporter(name);
        this.reporter.init()
    }
}

export abstract class HardService extends Service { }
export abstract class SoftService extends Service {
    protected enabled: boolean;

    protected constructor(name: string) {
        super(name);
        this.enabled = true
    }

    protected enable(): void {
        this.reporter.tell("Service has been enabled")
        this.enabled = true;
        this.onToggleService()
    }

    protected disable(): void {
        this.reporter.tell("Service has been disabled")
        this.enabled = false;
        this.onToggleService()
    }

    protected toggle(): void {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    protected onToggleService(): void { }
}

export abstract class StoreService extends SoftService {
    protected closed: boolean = false;
    protected readonly dependencies: ZustandStore[];

    protected constructor(name: string, dependencies: ZustandStore[]) {
        super(name);
        this.dependencies = dependencies;

        for (const dependency of dependencies) {
            if (!Hacker.grab(dependency)) {
                this.reporter.warn("Failed to resolve all dependencies, closing service")
                this.close()
                return
            }
        }
    }

    protected close(): void {
        this.reporter.scream("Service has been closed")
        this.closed = true;
        this.onCloseService()
    }

    protected onCloseService(): void { }
}
