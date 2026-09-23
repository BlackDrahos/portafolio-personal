import Lenis from 'lenis';
import works from './works.json';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// ============ Trabajos (works.json se genera desde el RSS de Behance) ============
const escapeHtml = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
document.getElementById('works-grid').innerHTML = works.map((w, i) => `
    <a class="work card spot reveal" href="${w.link}" target="_blank" rel="noopener" data-sp style="--col:${i % 3}">
        <div class="work-media">
            <img src="${w.cover}" srcset="${w.coverSmall} 404w, ${w.cover} 808w"
                 sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 400px"
                 alt="${escapeHtml(w.title)}" loading="lazy">
            <span class="work-go" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
        </div>
        <div class="work-info"><h3>${escapeHtml(w.title)}</h3><span>BEHANCE ↗</span></div>
    </a>`).join('');

// Casos destacados intercalados en la grilla: <article class="feature" data-after="6"> va después del 6.º trabajo.
// Usar múltiplos de 6 para que la fila anterior quede completa con 1, 2 o 3 columnas.
{
    const grid = document.getElementById('works-grid');
    // de atrás hacia adelante, así cada inserción no corre la posición de las siguientes
    [...document.querySelectorAll('.feature[data-after]')]
        .sort((a, b) => b.dataset.after - a.dataset.after)
        .forEach(f => grid.insertBefore(f, grid.children[Number(f.dataset.after)] || null));
}

// ============ Separar texto en palabras (títulos y párrafo "Sobre mí") ============
function splitWords(el, wrap) {
    let i = 0;
    const walk = node => {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) return walk(child);
            if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(part => {
                if (!part) return;
                if (/^\s+$/.test(part)) return frag.append(' ');
                frag.append(wrap(part, i++));
            });
            child.replaceWith(frag);
        });
    };
    walk(el);
    return i;
}
document.querySelectorAll('.split').forEach(el => splitWords(el, (word, i) => {
    const outer = document.createElement('span');
    outer.className = 'w';
    outer.innerHTML = `<span style="--i:${i}">${word}</span>`;
    return outer;
}));
document.querySelectorAll('.scrub-text').forEach(el => {
    const n = splitWords(el, (word, i) => {
        const s = document.createElement('span');
        s.className = 'sw-word';
        s.style.setProperty('--i', i);
        s.textContent = word;
        return s;
    });
    el.style.setProperty('--n', n);
});

// ============ Blob de luz azul + anillo de cursor ============
const blob = document.getElementById('blob');
const ring = document.querySelector('.cursor-ring');

window.addEventListener('pointermove', ({ clientX, clientY }) => {
    blob.animate(
        { left: `${clientX}px`, top: `${clientY}px` },
        { duration: 3000, fill: 'forwards' }
    );
    if (finePointer) {
        ring.classList.add('visible');
        ring.animate(
            { transform: `translate(${clientX}px, ${clientY}px)` },
            { duration: 350, fill: 'forwards', easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
    }
});
document.addEventListener('pointerleave', () => ring.classList.remove('visible'));

document.querySelectorAll('a, button, .card').forEach(el => {
    el.addEventListener('pointerenter', () => ring.classList.add('hover'));
    el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
});
document.querySelectorAll('.work, .browser').forEach(el => {
    el.addEventListener('pointerenter', () => { ring.dataset.label = 'Ver ↗'; ring.classList.add('label'); });
    el.addEventListener('pointerleave', () => ring.classList.remove('label'));
});

// ============ Spotlight en cards ============
document.querySelectorAll('.spot').forEach(card => {
    card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
});

// ============ Tilt 3D ============
function addTilt(el, max, target = el) {
    if (!finePointer || reduceMotion) return;
    el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        target.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`);
        target.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
        target.style.setProperty('--sx', `${x * 100}%`);
        target.style.setProperty('--sy', `${y * 100}%`);
        target.style.setProperty('--tx', x - 0.5);
        target.style.setProperty('--ty', y - 0.5);
    });
    el.addEventListener('pointerleave', () => {
        target.style.setProperty('--rx', '0deg');
        target.style.setProperty('--ry', '0deg');
        target.style.setProperty('--tx', 0);
        target.style.setProperty('--ty', 0);
    });
}
document.querySelectorAll('.tilt').forEach(el => addTilt(el, 10));
addTilt(document.getElementById('comp-card'), 8);

// ============ Botones magnéticos ============
if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('pointermove', e => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
        });
        btn.addEventListener('pointerleave', () => {
            btn.style.transform = '';
        });
    });
}

// ============ Composición del retrato (timeline arrastrable) ============
const comp = document.getElementById('comp');
const photo = document.getElementById('comp-photo');
const tracks = document.getElementById('tracks');
const firstLane = tracks.querySelector('.track-lane');
const keyframes = [...tracks.querySelectorAll('.kf')];
const tlTime = document.getElementById('tl-time');
const DURATION = 3.5; // segundos
let progress = 0;
let playing = false;
let dragging = false;
let lastNow;

// Si la foto no carga, usar un placeholder de silueta
const fallback = 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#0b1020"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="200" cy="190" r="80" fill="#60a5fa" opacity=".85"/><path d="M60 500c0-90 63-160 140-160s140 70 140 160z" fill="#60a5fa" opacity=".85"/></svg>`
);
photo.addEventListener('error', () => { photo.src = fallback; }, { once: true });

const clamp = v => Math.min(Math.max(v, 0), 1);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (p, a, b) => easeOut(clamp((p - a) / (b - a)));
const pad = n => String(n).padStart(2, '0');

function render(p) {
    progress = p;
    const s = comp.style;
    // Máscara: primero se abre una línea horizontal, después se expande vertical
    s.setProperty('--mh', seg(p, 0, 0.15));
    s.setProperty('--mv', seg(p, 0.1, 0.35));
    s.setProperty('--bgp', seg(p, 0.05, 0.4));
    // Retrato: barrido con borde suave, sube apenas y entra en foco
    s.setProperty('--rv', easeInOut(clamp((p - 0.15) / 0.3)));
    s.setProperty('--rise', seg(p, 0.15, 0.55));
    s.setProperty('--sc', 1.05 - 0.05 * seg(p, 0.15, 0.65));
    s.setProperty('--bl', 1 - seg(p, 0.18, 0.5));
    s.setProperty('--gs', easeInOut(clamp((p - 0.5) / 0.25)));
    s.setProperty('--lt', seg(p, 0.55, 0.72));
    s.setProperty('--lt2', seg(p, 0.62, 0.8));
    // Chips: entran uno tras otro (tuc, tuc, tuc) con un pequeño rebote, después de la foto
    [0.58, 0.68, 0.78].forEach((start, i) => s.setProperty(`--chip${i + 1}`, easeOutBack(clamp((p - start) / 0.12))));
    s.setProperty('--p', p);
    tracks.style.setProperty('--p', p);

    tlTime.textContent = `0:${pad(Math.floor(p * DURATION))}`;
    keyframes.forEach(kf => kf.classList.toggle('on', p >= Number(kf.style.getPropertyValue('--t')) - 0.001));
    comp.classList.toggle('done', p >= 1);
}

function setStatus() {
    comp.classList.toggle('playing', playing);
}

function loop(now) {
    if (!playing) return;
    const p = Math.min(progress + (now - lastNow) / 1000 / DURATION, 1);
    lastNow = now;
    render(p);
    if (p >= 1) { playing = false; setStatus(); return; }
    requestAnimationFrame(loop);
}

function play() {
    if (progress >= 1) progress = 0;
    playing = true;
    lastNow = performance.now();
    setStatus();
    requestAnimationFrame(loop);
}

function pause() {
    playing = false;
    render(progress);
    setStatus();
}

document.getElementById('tl-play').addEventListener('click', () => (playing ? pause() : play()));

// Scrub: arrastrar sobre la timeline mueve el cabezal
function scrub(e) {
    const r = firstLane.getBoundingClientRect();
    render(clamp((e.clientX - r.left) / r.width));
    setStatus();
}
tracks.addEventListener('pointerdown', e => {
    dragging = true;
    playing = false;
    comp.classList.add('touched');
    tracks.setPointerCapture(e.pointerId);
    scrub(e);
});
tracks.addEventListener('pointermove', e => { if (dragging) scrub(e); });
tracks.addEventListener('pointerup', () => { dragging = false; });
tracks.addEventListener('pointercancel', () => { dragging = false; });

// Las pistas de edición también se pueden arrastrar
const editTracks = document.getElementById('edit-tracks');
const editLane = editTracks.querySelector('.et-row');
const scrubEdit = e => {
    const r = editLane.getBoundingClientRect();
    render(clamp((e.clientX - r.left) / r.width));
    setStatus();
};
let draggingEdit = false;
editTracks.addEventListener('pointerdown', e => {
    draggingEdit = true;
    playing = false;
    comp.classList.add('touched');
    editTracks.setPointerCapture(e.pointerId);
    scrubEdit(e);
});
editTracks.addEventListener('pointermove', e => { if (draggingEdit) scrubEdit(e); });
editTracks.addEventListener('pointerup', () => { draggingEdit = false; });
editTracks.addEventListener('pointercancel', () => { draggingEdit = false; });

// Forma de onda de audio
document.getElementById('wave').innerHTML = Array.from({ length: 64 }, (_, i) =>
    `<i style="--h:${Math.round(20 + 75 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)))}%"></i>`
).join('');

// ============ Fondo líquido (WebGL): dos colores espesos mezclándose en bucle ============
const liquid = document.getElementById('liquid');
const gl = liquid.getContext('webgl', { antialias: false, premultipliedAlpha: false });
if (gl) {
    const vs = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;
    const fs = `
        precision mediump float;
        uniform vec2 r;
        uniform float t;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.45; }
            return v;
        }
        // Campo "líquido": ruido deformado sobre sí mismo (domain warping)
        float field(vec2 p) {
            float s = t * 0.09;
            vec2 q = vec2(fbm(p + vec2(0.0, s)), fbm(p + vec2(5.2, 1.3) - s));
            vec2 w = vec2(fbm(p + 2.0 * q + vec2(1.7, 9.2) + s * 1.3), fbm(p + 2.0 * q + vec2(8.3, 2.8) - s));
            return fbm(p + 2.2 * w);
        }
        void main() {
            vec2 uv = gl_FragCoord.xy / r;
            vec2 p = uv * vec2(r.x / r.y, 1.0) * 1.1;
            float f = field(p);
            // Relieve para que parezca espeso y brillante
            float e = 0.03;
            float fx = field(p + vec2(e, 0.0)) - f;
            float fy = field(p + vec2(0.0, e)) - f;
            vec3 n = normalize(vec3(-fx, -fy, e * 0.9));
            vec3 l = normalize(vec3(-0.4, 0.6, 0.7));
            float diff = clamp(dot(n, l), 0.0, 1.0);
            float spec = pow(clamp(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 18.0);

            vec3 deep = vec3(0.03, 0.16, 0.85);
            vec3 electric = vec3(0.0, 0.62, 1.0);
            float m = smoothstep(0.34, 0.5, f);
            vec3 col = mix(deep, electric, m);
            col *= 0.55 + 0.6 * diff;
            col += spec * 0.4;
            col = mix(col * 0.35, col, smoothstep(0.0, 0.7, uv.y + 0.25)); // más oscuro abajo
            gl_FragColor = vec4(col, 1.0);
        }`;
    const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'a');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const uR = gl.getUniformLocation(prog, 'r');
        const uT = gl.getUniformLocation(prog, 't');

        const size = () => {
            const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75; // resolución reducida: es un fondo difuso
            liquid.width = Math.round(liquid.clientWidth * scale);
            liquid.height = Math.round(liquid.clientHeight * scale);
            gl.viewport(0, 0, liquid.width, liquid.height);
            gl.uniform2f(uR, liquid.width, liquid.height);
        };
        size();
        window.addEventListener('resize', size);

        let visible = true;
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(liquid);
        const start = performance.now();
        const draw = now => {
            if (visible) {
                gl.uniform1f(uT, (now - start) / 1000);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }
            if (!reduceMotion) requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
    }
}


render(0);
setStatus();
let started = false;
const begin = () => !started && (started = true) && setTimeout(() => (reduceMotion ? (render(1), setStatus()) : play()), 400);
if (photo.complete) begin();
else {
    photo.addEventListener('load', begin, { once: true });
    photo.addEventListener('error', begin, { once: true });
}

// ============ Reveal al hacer scroll ============
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

function countUp(el) {
    const target = Number(el.dataset.count);
    const start = performance.now();
    const dur = 1400;
    const step = now => {
        const t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ============ Nav: ocultar al bajar, link activo, menú mobile ============
const nav = document.querySelector('.nav');
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('hidden', y > lastY && y > 200 && !navLinks.classList.contains('open'));
    lastY = y;
}, { passive: true });

const navLinks = document.getElementById('nav-links');
const toggle = document.getElementById('nav-toggle');
toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
}));

const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.querySelectorAll('a').forEach(a =>
            a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`)
        );
    });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section').forEach(s => sectionObserver.observe(s));

// ============ Movimiento ligado al scroll ============
// Cada [data-sp] recibe --sp: 0 cuando asoma por abajo, 1 cuando sale por arriba.
const root = document.documentElement;
const hero = document.getElementById('hero');
const spEls = [...document.querySelectorAll('[data-sp]')];
spEls.forEach(el => el.dataset.speed && el.style.setProperty('--speed', el.dataset.speed));

function updateScroll(vel = 0) {
    const vh = window.innerHeight;
    const rects = spEls.map(el => el.getBoundingClientRect()); // leer todo antes de escribir
    rects.forEach((r, i) => spEls[i].style.setProperty('--sp', clamp((vh - r.top) / (vh + r.height)).toFixed(4)));
    const y = window.scrollY;
    hero.style.setProperty('--hp', clamp(y / hero.offsetHeight).toFixed(4));
    root.style.setProperty('--page', clamp(y / (root.scrollHeight - vh)).toFixed(4));
    root.style.setProperty('--vel', Math.max(-25, Math.min(25, vel)).toFixed(2));
}

if (!reduceMotion) {
    // Scroll suave con inercia
    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -90 } });
    let moving = false;
    lenis.on('scroll', ({ velocity }) => { moving = true; updateScroll(velocity); });
    const raf = time => {
        lenis.raf(time);
        if (moving && !lenis.isScrolling) { moving = false; updateScroll(0); }
        requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
} else {
    window.addEventListener('scroll', () => updateScroll(0), { passive: true });
}
window.addEventListener('resize', () => updateScroll(0));
updateScroll(0);

// ============ Casos destacados: el dispositivo pasa de reposo (.scr-idle) a mensajes (.scr-msg) ============
const playVideo = v => v.play().catch(() => {});
document.querySelectorAll('.feature').forEach(feature => {
    const idleVideo = feature.querySelector('.scr-idle');
    const msgVideo = feature.querySelector('.scr-msg');
    const loopVideos = [...feature.querySelectorAll('.states video')];
    let started = false;

    idleVideo?.addEventListener('ended', () => {
        feature.classList.add('phase-2');
        msgVideo.currentTime = 0;
        playVideo(msgVideo);
    });

    // Arranca la primera vez que entra en pantalla; fuera de pantalla se pausa (ahorra batería en celulares)
    new IntersectionObserver(([entry]) => {
        const current = feature.classList.contains('phase-2') ? msgVideo : idleVideo;
        if (!entry.isIntersecting) {
            if (started) [current, ...loopVideos].forEach(v => v?.pause());
            return;
        }
        loopVideos.forEach(playVideo);
        if (started) { if (current) playVideo(current); return; }
        started = true;
        if (reduceMotion || !idleVideo) { feature.classList.add('phase-2'); if (msgVideo) playVideo(msgVideo); return; }
        idleVideo.playbackRate = 1.4;
        playVideo(idleVideo);
    }, { threshold: 0.25 }).observe(feature);
});

// ============ Parallax 3D e Interacción hover para Validador SUBE ============
{
    const stage = document.querySelector('#caso-validador .feature-stage');
    if (stage && !reduceMotion) {
        const device = stage.querySelector('.device');
        const glare = stage.querySelector('.screen-glare');

        stage.addEventListener('pointermove', (e) => {
            const rect = stage.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            if (device) {
                device.style.transform = `perspective(1000px) rotateY(${x * 14}deg) rotateX(${-y * 12}deg) translateY(-8px) scale(1.02)`;
            }
            if (glare) {
                glare.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
            }
        });

        stage.addEventListener('pointerleave', () => {
            if (device) device.style.transform = '';
            if (glare) glare.style.transform = '';
        });
    }
}

// ============ Caso packaging: el scroll recorre la secuencia del render ============
{
    const pk = document.getElementById('caso-packaging');
    const track = pk.querySelector('.pk-track');
    const canvas = pk.querySelector('.pk-canvas');
    const ctx = canvas.getContext('2d');
    const steps = [...pk.querySelectorAll('.pk-steps li')];
    // Vite incluye y versiona los cuadros al publicar
    const urls = Object.entries(import.meta.glob('./img/packaging/caja-*.webp', { eager: true, query: '?url', import: 'default' }))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, url]) => url);
    const frames = [];
    let loaded = false;
    let shown = -1;
    let current = 0;
    let active = false;

    const draw = i => {
        const img = frames[i];
        if (!img || !img.complete || i === shown) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        shown = i;
    };
    const load = () => {
        if (loaded) return;
        loaded = true;
        urls.forEach((url, i) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => { if (i === Math.round(current)) { shown = -1; draw(i); } };
            img.src = url;
            frames[i] = img;
        });
    };

    const tick = () => {
        const r = track.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - window.innerHeight));
        const target = p * (urls.length - 1);
        current += (target - current) * (reduceMotion ? 1 : 0.18); // suavizado
        if (Math.abs(target - current) < 0.01) current = target;
        draw(Math.round(current));
        pk.style.setProperty('--pk', p.toFixed(3));
        steps.forEach((li, i) => {
            const next = steps[i + 1];
            li.classList.toggle('is-active', p >= Number(li.dataset.from) && (!next || p < Number(next.dataset.from)));
        });
        pk.classList.toggle('done', p > 0.95);
        if (active) requestAnimationFrame(tick);
    };

    // Precarga al acercarse; anima solo mientras está en pantalla
    new IntersectionObserver(([e]) => { if (e.isIntersecting) load(); }, { rootMargin: '150% 0px' }).observe(pk);
    new IntersectionObserver(([e]) => {
        const was = active;
        active = e.isIntersecting;
        if (active && !was) requestAnimationFrame(tick);
    }).observe(track);
}

// ============ Caso manual: el scroll recorre la secuencia del render ============
{
    const mn = document.getElementById('caso-manual');
    const track = mn.querySelector('.pk-track');
    const canvas = mn.querySelector('.mn-canvas');
    const ctx = canvas.getContext('2d');
    const steps = [...mn.querySelectorAll('.pk-steps li')];
    const urls = Object.entries(import.meta.glob('./img/manual/manual-*.webp', { eager: true, query: '?url', import: 'default' }))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, url]) => url);
    const frames = [];
    let loaded = false;
    let shown = -1;
    let current = 0;
    let active = false;

    const draw = i => {
        const img = frames[i];
        if (!img || !img.complete || i === shown) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        shown = i;
    };
    const load = () => {
        if (loaded) return;
        loaded = true;
        urls.forEach((url, i) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => { if (i === Math.round(current)) { shown = -1; draw(i); } };
            img.src = url;
            frames[i] = img;
        });
    };

    const tick = () => {
        const r = track.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - window.innerHeight));
        const target = p * (urls.length - 1);
        current += (target - current) * (reduceMotion ? 1 : 0.18);
        if (Math.abs(target - current) < 0.01) current = target;
        draw(Math.round(current));
        mn.style.setProperty('--pk', p.toFixed(3));
        steps.forEach((li, i) => {
            const next = steps[i + 1];
            li.classList.toggle('is-active', p >= Number(li.dataset.from) && (!next || p < Number(next.dataset.from)));
        });
        mn.classList.toggle('done', p > 0.95);
        if (active) requestAnimationFrame(tick);
    };

    new IntersectionObserver(([e]) => { if (e.isIntersecting) load(); }, { rootMargin: '150% 0px' }).observe(mn);
    new IntersectionObserver(([e]) => {
        const was = active;
        active = e.isIntersecting;
        if (active && !was) requestAnimationFrame(tick);
    }).observe(track);
}

// ============ Efecto Máquina de Escribir (Hero Title: Matí Prestamo <-> Matí Presti) ============
function initTypewriterTitle() {
    const firstEl = document.getElementById('typewriter-first');
    const lastEl = document.getElementById('typewriter-last');
    const cursor = document.getElementById('title-cursor');
    if (!firstEl || !lastEl || !cursor) return;

    const firstName = "Matí";
    const surnames = ["Prestamo", "Presti"];
    let surnameIndex = 0;

    firstEl.after(cursor);
    firstEl.textContent = "";
    lastEl.textContent = "";
    cursor.classList.add('is-typing');

    let i = 0;

    function typeFirst() {
        if (i < firstName.length) {
            firstEl.textContent += firstName.charAt(i);
            i++;
            setTimeout(typeFirst, 100);
        } else {
            lastEl.after(cursor);
            setTimeout(typeSurname, 200);
        }
    }

    function typeSurname() {
        cursor.classList.add('is-typing');
        const targetText = surnames[surnameIndex];
        let currentText = lastEl.textContent;

        if (currentText.length < targetText.length) {
            lastEl.textContent = targetText.substring(0, currentText.length + 1);
            setTimeout(typeSurname, 90 + Math.random() * 30);
        } else {
            cursor.classList.remove('is-typing');
            setTimeout(eraseSurname, 2600);
        }
    }

    function eraseSurname() {
        cursor.classList.add('is-typing');
        let currentText = lastEl.textContent;

        if (currentText.length > 0) {
            lastEl.textContent = currentText.substring(0, currentText.length - 1);
            setTimeout(eraseSurname, 60);
        } else {
            surnameIndex = (surnameIndex + 1) % surnames.length;
            setTimeout(typeSurname, 200);
        }
    }

    setTimeout(typeFirst, 300);
}
initTypewriterTitle();

// ============ Rotación periódica de la card Figma <-> Adobe XD ============
{
    const flipCard = document.getElementById('sw-figma-xd');
    if (flipCard) {
        let flipped = false;
        setInterval(() => {
            flipped = !flipped;
            flipCard.classList.toggle('is-flipped', flipped);
        }, 3600);
        flipCard.addEventListener('click', () => {
            flipped = !flipped;
            flipCard.classList.toggle('is-flipped', flipped);
        });
    }
}

// ============ Despliegue discreto de Experiencia dentro de Educación ============
{
    const btnToggle = document.getElementById('btn-toggle-exp');
    const drawer = document.getElementById('exp-drawer');

    if (btnToggle && drawer) {
        btnToggle.addEventListener('click', () => {
            const isOpen = drawer.classList.toggle('is-open');
            btnToggle.classList.toggle('is-open', isOpen);
            btnToggle.setAttribute('aria-expanded', String(isOpen));
            drawer.setAttribute('aria-hidden', String(!isOpen));
        });
    }
}

// ============ Selector de tema (Claro / Oscuro) con persistencia ============
{
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    const savedTheme = localStorage.getItem('portfolio-theme') || 'light';
    htmlEl.setAttribute('data-theme', savedTheme);

    const updateTheme = theme => {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('portfolio-theme', theme);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.content = theme === 'light' ? '#f5f7fc' : '#05060a';
    };

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = htmlEl.getAttribute('data-theme') || 'light';
            const next = current === 'light' ? 'dark' : 'light';
            updateTheme(next);
        });
    }
}



