export class Reporter {
    private static readonly REPORT_ATTACHES: boolean = false;

    public readonly name: string;
    constructor(name: string) {
        this.name = name;
    }

    private static prefix = "Better ECHO360";

    init(): void {
        if (Reporter.REPORT_ATTACHES) {
            this.report("Reporter attached");
        }
    }

    private stamp(input: string): string {
        return `[${Reporter.prefix}] [${this.name}] ${input}`;
    }

    public tell(message: string): void {
        console.info(this.stamp(message));
    }

    public report(message: string): void {
        console.log(this.stamp(message));
    }

    public warn(message: string): void {
        console.warn(this.stamp(message));
    }

    public scream(message: string): void {
        console.error(this.stamp(message));
    }
}
