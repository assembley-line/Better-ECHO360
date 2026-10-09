export default function fromTemplate<T extends HTMLElement = HTMLElement>(html: string): T {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild as T;
}
