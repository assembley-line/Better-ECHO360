import { GM_getValue, GM_setValue } from "$";

const defaults = {
    better_echo360: {
        disabled: false,
    },

    timemachine: {
        hidden: false,
        defaultSpeed: 1,
    },

    syllabus: {
        hidden: false,
        enabled: true,
    },

    captions: {
        hidden: false,
        enabled: true,
    },
};

type SettingsShape = typeof defaults;
export { type SettingsShape }

function section<K extends keyof SettingsShape>(name: K): SettingsShape[K] {
    const read = (): SettingsShape[K] => ({
        ...defaults[name],
        ...GM_getValue<Partial<SettingsShape[K]>>(name, {}),
    });

    return new Proxy({} as SettingsShape[K], {
        get: (_, key) => (read() as any)[key],

        set: (_, key: string, value) => {
            GM_setValue(name, {
                ...GM_getValue<Partial<SettingsShape[K]>>(name, {}),
                [key]: value,
            });
            return true;
        },

        ownKeys: () => Reflect.ownKeys(read()),
        getOwnPropertyDescriptor: (_, key) => ({
            enumerable: true,
            configurable: true,
            value: (read() as any)[key],
        }),
    });
}

const settings = Object.fromEntries(
    (Object.keys(defaults) as (keyof SettingsShape)[]).map((k) => [
        k,
        section(k),
    ]),
) as SettingsShape;

window.settings = settings

export default settings;
