export function hidden(setting: boolean) {
    return <T extends new (...args: any[]) => any>(target: T): T => {
        if (!setting) return target;

        class Stub {}
        for (const key of Object.getOwnPropertyNames(target.prototype)) {
            if (key !== "constructor") (Stub.prototype as any)[key] = () => {};
        }
        return Stub as unknown as T;
    };
}
