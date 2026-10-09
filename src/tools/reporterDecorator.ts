export interface Reporter {
    report(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    yell(...args: unknown[]): void;
}

const prefix = "Better ECHO360";

export function reporter<T extends new (...args: any[]) => any>(target: T): T {
    target.prototype.report = function (...args: unknown[]) {
        console.log(`[${prefix} | ${this.constructor.name}]`, ...args);
    };

    target.prototype.warn = function (...args: unknown[]) {
        console.warn(`[${prefix} | ${this.constructor.name}]`, ...args);
    };

    target.prototype.yell = function (...args: unknown[]) {
        console.error(`[${prefix} | ${this.constructor.name}]`, ...args);
    };

    return target;
}
