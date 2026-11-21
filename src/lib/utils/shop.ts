// ============================================================================
// Links von swzpln.de in den Shop: immer mit dem Kartenausschnitt (ort), damit
// Besucher ihren eigenen Ort gleich auf Produkten sehen statt auf der
// Shop-Startseite zu landen, und mit utm_medium je Stelle (Rybbit).
// ============================================================================
import { env } from '$env/dynamic/public';

export const SHOP_URL = env.PUBLIC_SHOP_URL || 'https://shop.swzpln.de';

/** ?ort=lat,lng,zoom aus dem Kartenzustand (center = [lng, lat]). */
export function ortParam(location: { center: [number, number]; zoom: number }): string {
	const [lng, lat] = location.center;
	return `${lat.toFixed(5)},${lng.toFixed(5)},${location.zoom.toFixed(2)}`;
}

/**
 * Mit Produkt: Produktseite /p/<produkt> (Karte, Preis, Warenkorb), wie die
 * Pinterest-Links. Ohne Produkt: Übersicht aller Produkte mit diesem Ort.
 */
export function shopHref(
	ort: string,
	medium: string,
	opts: { edition?: string; product?: string } = {}
): string {
	const edition = opts.edition ?? 'klassik';
	const q = new URLSearchParams({ ort, utm_source: 'swzpln', utm_medium: medium });
	if (opts.product) {
		q.set('edition', edition);
		return `${SHOP_URL}/p/${encodeURIComponent(opts.product)}?${q}`;
	}
	return `${SHOP_URL}/design/${encodeURIComponent(edition)}/produkt?${q}`;
}
