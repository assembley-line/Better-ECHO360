import settings from "@/tools/settings";

type Settings = typeof settings;

// Union of all dotted paths that lead to a boolean: "phone.hidden" | "captions" | ...
type BooleanPath<T = Settings, P extends string = ""> = {
    [K in keyof T & string]: T[K] extends boolean
        ? `${P}${K}`
        : T[K] extends object
            ? BooleanPath<T[K], `${P}${K}.`>
            : never
}[keyof T & string];

function resolve(path: string): [Record<string, any>, string] {
    const parts = path.split(".");
    const last = parts.pop()!;
    const parent = parts.reduce((obj: any, k) => obj[k], settings);
    return [parent, last];
}

export function bindCheckbox(
    root: ParentNode,
    selector: string,
    path: BooleanPath,
    onChange?: (value: boolean) => void,
): HTMLInputElement | null {
    const input = root.querySelector<HTMLInputElement>(selector);
    if (!input) { return null; }

    const [parent, key] = resolve(path);
    input.checked = Boolean(parent[key]);

    input.addEventListener("change", () => {
        parent[key] = input.checked;
        onChange?.(input.checked);
    });

    return input;
}
