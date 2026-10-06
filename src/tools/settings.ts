import { GM_getValue, GM_setValue } from "$";

const defaults = {
    skipIntro: true,
    speed: 1,
    open_CaptionsService: true,
};

type SettingsShape = typeof defaults;

const settings = new Proxy({} as SettingsShape, {
    get: (_, key: string) => GM_getValue(key, (defaults as any)[key]),
    set: (_, key: string, value) => {
        GM_setValue(key, value);
        return true;
    },
});

export default settings;
