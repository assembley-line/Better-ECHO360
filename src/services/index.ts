import { Reporter } from "@/logging/reporter";

export abstract class Service {
    protected readonly reporter: Reporter;

    protected constructor(name: string) {
        this.reporter = new Reporter(name);
    }
}
