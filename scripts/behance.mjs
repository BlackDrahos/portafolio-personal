// Descarga los proyectos publicados en Behance (vía RSS) y los guarda en works.json.
// Corre solo antes de `npm run dev` y `npm run build`. Si falla, se conserva el works.json anterior.
import { writeFileSync } from 'node:fs';

const USER = 'matiasprestamo';
const FEED = `https://www.behance.net/feeds/user?username=${USER}`;

try {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    const cdata = (block, tag) => block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))?.[1]?.trim() ?? '';
    const works = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
        const cover = cdata(item, 'description').match(/img src='([^']+)'/)?.[1] ?? '';
        return {
            title: cdata(item, 'title'),
            link: cdata(item, 'link'),
            cover: cover.replace('/projects/404/', '/projects/808/'),
            coverSmall: cover,
        };
    }).filter(w => w.title && w.link && w.cover);

    if (!works.length) throw new Error('el feed no trajo proyectos');
    writeFileSync(new URL('../works.json', import.meta.url), JSON.stringify(works, null, 2));
    console.log(`Behance: ${works.length} proyectos guardados en works.json`);
} catch (err) {
    console.warn(`Behance: no se pudo actualizar (${err.message}). Se usa el works.json existente.`);
}
