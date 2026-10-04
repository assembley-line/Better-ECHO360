export default function enumName<E extends Record<string, string | number>>(
    enumObj: E,
    value: E[keyof E],
): keyof E | undefined {
    return (Object.keys(enumObj) as (keyof E & string)[]).find(
        (k) => !/^\d+$/.test(k) && enumObj[k] === value,
    );
}
