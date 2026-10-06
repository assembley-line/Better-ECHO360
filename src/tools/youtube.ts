export function youtubeId(input: string): string | null {
    let u: URL;
    try { u = new URL(input); } catch { return null; }

    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;

    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (u.pathname === "/watch") id = u.searchParams.get("v");
        else {
            const m = /^\/(embed|shorts|live)\/([^/?]+)/.exec(u.pathname);
            id = m ? m[2] : null;
        }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;   // real IDs are exactly 11 safe characters
}

export interface PhoneEmbedOptions {
    zoom?: number;          // >1 pushes the title strip and edges out of view
    sourceAspect?: number;  // shape of the original video (the laptop-style frame)
}

export function createEmbed(
    url: string,
    { zoom = 1, sourceAspect = 16 / 9 }: PhoneEmbedOptions = {},
): HTMLDivElement | null {
    const id = youtubeId(url);
    if (!id) return null;

    // Clipping window. container-type lets the iframe size itself from the window's height (cqh).
    const wrap = document.createElement("div");
    wrap.style.cssText =
        "position:relative;overflow:hidden;container-type:size;pointer-events:none;background:#000;";

    const frame = document.createElement("iframe");
    frame.src =
        `https://www.youtube-nocookie.com/embed/${id}` +
        `?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&fs=0&iv_load_policy=3&rel=0&playsinline=1`;
    frame.allow = "autoplay; encrypted-media";
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
    frame.style.cssText = `
        position:absolute; top:50%; left:50%; border:0;
        height:${zoom * 100}cqh;
        width:${zoom * 100 * sourceAspect}cqh;
        transform:translate(-50%,-50%);
    `;

    wrap.appendChild(frame);
    return wrap;
}
