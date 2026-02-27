// IFC exporter using web-ifc
// Note: Simplified implementation - web-ifc API is complex and requires detailed entity creation

import type { Bounds, GeometryObject, ProgressCallback } from '../types';
import * as m from '$lib/paraglide/messages';

/**
 * Export geometry objects and terrain to IFC format
 * Simplified version - generates a minimal valid IFC file structure with Metadata
 */
export async function exportToIFC(
	objects: GeometryObject[],
	elevationMatrix: number[][] | null,
	bounds: Bounds,
	onProgress?: ProgressCallback
): Promise<Uint8Array> {
	notify(onProgress, 0, m.progress_dxf_init());

	const buildings = objects.filter((obj) => obj.type === 'building' && obj.buildingMetadata);

	notify(onProgress, 20, 'Processing buildings...');

	// Header
	let ifc = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('swzpln_export.ifc','','','','','','');
FILE_SCHEMA(('IFC4'));
ENDSEC;

DATA;
#1=IFCPROJECT('Project',#2,'OpenCityPlans Export',$,$,$,$,$,$);
#2=IFCOWNERHISTORY($,$,$,$,$,$,$,$);
#3=IFCSITE('Site',#2,'Site',$,$,$,$,$,.ELEMENT.,$,$,$,$,$);
`;

	let entityId = 100;

	for (let i = 0; i < buildings.length; i++) {
		const b = buildings[i];
		if (!b.buildingMetadata) continue;

		const height = b.buildingMetadata.height || 10;
		const name = b.relationId ? `Building_Part_${b.relationId}_${i}` : `Building_${i}`;

		ifc += `#${entityId}=IFCBUILDING('${name}',#2,'${name}',$,$,$,$,$,.ELEMENT.,$,$,$);\n`;
		ifc += `/* Metadata: Height=${height}m, Shape=${b.buildingMetadata.shape || 'N/A'} */\n`;

		entityId++;

		if ((i + 1) % 50 === 0) {
			notify(onProgress, 20 + Math.round(((i + 1) / buildings.length) * 60), `Processing buildings: ${i + 1}/${buildings.length}`);
		}
	}

	ifc += 'ENDSEC;\nEND-ISO-10303-21;\n';

	notify(onProgress, 100, 'IFC export complete');
	const encoder = new TextEncoder();
	return encoder.encode(ifc);
}

function notify(cb: ProgressCallback | undefined, percent: number, message: string) {
	if (cb) cb({ step: 'export', percent, message });
}
