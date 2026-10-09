// ============================================================================
// Meer aus Küstenlinien (natural=coastline). Gleiche Datei wie im Shop
// (swzpln-shop src/lib/server/coastline.ts): Änderungen dort mitziehen.
//
// OSM hat keine Meeresflächen, nur Küstenlinien: Land liegt links, Wasser
// rechts der Laufrichtung. Hier werden die Linien (in Bildpixeln, y nach
// unten, Norden oben) am Bildrechteck abgeschnitten und das Wasser entlang
// des Bildrands zu Ringen geschlossen. Im Bild liegt das Wasser ebenfalls
// rechts, und wer den Rand im Uhrzeigersinn abläuft, hat das Bildinnere
// rechts: nach jedem Austritt geht es also im Uhrzeigersinn zum nächsten
// Eintritt. Inseln (geschlossene Linien ganz im Bild) werden als eigene
// Ringe angehängt; gezeichnet wird mit fill-rule evenodd, sie werden so zu
// Löchern.
//
// ponytail: ein Ausschnitt ganz ohne Küstenlinie gilt als Land (offenes
// Meer ohne Küste bleibt leer), und Linien, die mitten im Bild enden
// (kaputte Daten), werden verworfen. Für echte Abdeckung bräuchte es die
// vorberechneten Wasserflächen von osmdata.openstreetmap.de.
// ============================================================================

type Pt = [number, number];

const key = (p: number[]) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;

/** Küsten-Ways (gleiche Laufrichtung) über gemeinsame Endpunkte verketten. */
export function mergeCoastlines(ways: number[][][]): number[][][] {
	const byStart = new Map<string, number>();
	ways.forEach((w, i) => byStart.set(key(w[0]), i));
	const used = new Set<number>();
	const chains: number[][][] = [];
	for (let i = 0; i < ways.length; i++) {
		if (used.has(i)) continue;
		used.add(i);
		let chain = ways[i];
		// vorwärts verlängern
		for (;;) {
			const next = byStart.get(key(chain[chain.length - 1]));
			if (next === undefined || used.has(next)) break;
			used.add(next);
			chain = chain.concat(ways[next].slice(1));
		}
		chains.push(chain);
	}
	// rückwärts: eine Kette, deren Anfang das Ende einer anderen ist, anhängen
	let merged = true;
	while (merged) {
		merged = false;
		for (let a = 0; a < chains.length && !merged; a++) {
			for (let b = 0; b < chains.length; b++) {
				if (a === b) continue;
				const ca = chains[a];
				const cb = chains[b];
				if (key(ca[ca.length - 1]) === key(cb[0]) && key(ca[0]) !== key(ca[ca.length - 1])) {
					chains[a] = ca.concat(cb.slice(1));
					chains.splice(b, 1);
					merged = true;
					break;
				}
			}
		}
	}
	return chains;
}

/** Position auf dem Rand, im Uhrzeigersinn ab der linken oberen Ecke. */
function perimeterPos(p: Pt, w: number, h: number): number {
	const [x, y] = p;
	const d = [y, w - x, h - y, x]; // Abstand zu oben, rechts, unten, links
	const edge = d.indexOf(Math.min(...d));
	if (edge === 0) return x;
	if (edge === 1) return w + y;
	if (edge === 2) return w + h + (w - x);
	return 2 * w + h + (h - y);
}

const CORNERS = (w: number, h: number): [number, Pt][] => [
	[w, [w, 0]],
	[w + h, [w, h]],
	[2 * w + h, [0, h]],
	[2 * w + 2 * h, [0, 0]]
];

/** Strecke a→b am Rechteck abschneiden (Liang-Barsky), null = ganz draußen. */
function clipSegment(a: Pt, b: Pt, w: number, h: number): [number, number] | null {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	let t0 = 0;
	let t1 = 1;
	for (const [p, q] of [
		[-dx, a[0]],
		[dx, w - a[0]],
		[-dy, a[1]],
		[dy, h - a[1]]
	]) {
		if (p === 0) {
			if (q < 0) return null;
			continue;
		}
		const r = q / p;
		if (p < 0) {
			if (r > t1) return null;
			if (r > t0) t0 = r;
		} else {
			if (r < t0) return null;
			if (r < t1) t1 = r;
		}
	}
	return [t0, t1];
}

const inside = (p: Pt, w: number, h: number) => p[0] > 0 && p[0] < w && p[1] > 0 && p[1] < h;
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/**
 * Wasserringe im Bild (Pixel) aus verketteten Küstenlinien (Pixel).
 * Ergebnis für fill-rule evenodd.
 */
export function oceanRings(lines: Pt[][], w: number, h: number): Pt[][] {
	const pieces: Pt[][] = [];
	const islands: Pt[][] = [];

	for (let line of lines) {
		if (line.length < 2) continue;
		const closed = key(line[0]) === key(line[line.length - 1]);
		if (closed) {
			const out = line.findIndex((p) => !inside(p, w, h));
			if (out < 0) {
				islands.push(line);
				continue;
			}
			// Ring so drehen, dass er draußen beginnt: dann zerfällt er sauber in Stücke
			line = [...line.slice(out, -1), ...line.slice(0, out + 1)];
		}
		let cur: Pt[] | null = inside(line[0], w, h) ? [line[0]] : null;
		let brokenStart = cur !== null;
		for (let i = 0; i < line.length - 1; i++) {
			const a = line[i];
			const b = line[i + 1];
			const clip = clipSegment(a, b, w, h);
			if (!clip) continue;
			const [t0, t1] = clip;
			if (t0 > 0 || !cur) cur = [lerp(a, b, t0)];
			if (t1 < 1) {
				cur.push(lerp(a, b, t1));
				if (!brokenStart) pieces.push(cur);
				brokenStart = false;
				cur = null;
			} else {
				cur.push(b);
			}
		}
		// endet im Bild: kaputte Daten, verwerfen
	}

	const rings: Pt[][] = [];
	const L = 2 * (w + h);
	const startPos = pieces.map((p) => perimeterPos(p[0], w, h));
	const used = new Set<number>();
	for (let first = 0; first < pieces.length; first++) {
		if (used.has(first)) continue;
		const ring: Pt[] = [];
		let i = first;
		for (let guard = 0; guard <= pieces.length; guard++) {
			used.add(i);
			ring.push(...pieces[i]);
			const exit = perimeterPos(pieces[i][pieces[i].length - 1], w, h);
			// nächster Eintritt im Uhrzeigersinn
			let next = -1;
			let best = Infinity;
			startPos.forEach((s, j) => {
				const d = (s - exit + L) % L;
				if (d < best) [best, next] = [d, j];
			});
			// Ecken, die zwischen Austritt und nächstem Eintritt liegen, der Reihe nach
			CORNERS(w, h)
				.map(([pos, corner]) => [(pos - exit + L) % L, corner] as const)
				.filter(([d]) => d > 0 && d < best)
				.sort((a, b) => a[0] - b[0])
				.forEach(([, corner]) => ring.push(corner));
			if (next === first || used.has(next)) break;
			i = next;
		}
		if (ring.length >= 3) rings.push(ring);
	}

	if (islands.length > 0 && rings.length === 0) {
		rings.push([
			[0, 0],
			[w, 0],
			[w, h],
			[0, h]
		]);
	}
	return [...rings, ...islands];
}
