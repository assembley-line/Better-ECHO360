export class Reporter {
  public readonly name: string;
  constructor(name: string) {
    this.name = name;
  }

  private static prefix = "Better ECHO360";

  init(): void {
    this.tell("Reporter attached");
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
