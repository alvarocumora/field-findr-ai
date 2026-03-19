/**
 * DXF Exporter - Generates AutoCAD-compatible DXF files from GeoJSON-like polygon data.
 * Uses DXF format version AC1015 (AutoCAD 2000).
 */

export interface DxfLot {
  id: string;
  label: string;
  polygon: [number, number][]; // [x, y] in meters
  area: number;
}

export interface DxfExportOptions {
  projectName: string;
  scale: number; // e.g. 1000 for 1:1000
  lotColor: number; // AutoCAD color index (1=red, 2=yellow, 3=green, etc.)
  roadColor: number;
  labelColor: number;
}

const DEFAULT_OPTIONS: DxfExportOptions = {
  projectName: 'Loteo',
  scale: 1,
  lotColor: 3, // Green
  roadColor: 8, // Gray
  labelColor: 7, // White
};

function dxfHeader(): string {
  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
6
0
ENDSEC
`;
}

function dxfTables(): string {
  return `0
SECTION
2
TABLES
0
TABLE
2
LAYER
0
LAYER
2
LOTS
70
0
62
3
6
CONTINUOUS
0
LAYER
2
ROADS
70
0
62
8
6
CONTINUOUS
0
LAYER
2
LABELS
70
0
62
7
6
CONTINUOUS
0
LAYER
2
DIMENSIONS
70
0
62
1
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
`;
}

function dxfPolyline(points: [number, number][], layer: string, color: number, closed: boolean = true): string {
  let dxf = `0
LWPOLYLINE
8
${layer}
62
${color}
90
${points.length}
70
${closed ? 1 : 0}
`;
  for (const [x, y] of points) {
    dxf += `10
${x.toFixed(4)}
20
${y.toFixed(4)}
`;
  }
  return dxf;
}

function dxfText(text: string, x: number, y: number, height: number, layer: string, color: number): string {
  return `0
TEXT
8
${layer}
62
${color}
10
${x.toFixed(4)}
20
${y.toFixed(4)}
40
${height.toFixed(2)}
1
${text}
72
1
11
${x.toFixed(4)}
21
${y.toFixed(4)}
`;
}

/**
 * Generate a DXF string from lot polygons
 */
export function generateDxf(
  lots: DxfLot[],
  roads?: [number, number][][],
  options?: Partial<DxfExportOptions>
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let entities = `0
SECTION
2
ENTITIES
`;

  // Draw lots
  for (const lot of lots) {
    entities += dxfPolyline(lot.polygon, 'LOTS', opts.lotColor, true);

    // Label at centroid
    const cx = lot.polygon.reduce((s, p) => s + p[0], 0) / lot.polygon.length;
    const cy = lot.polygon.reduce((s, p) => s + p[1], 0) / lot.polygon.length;
    entities += dxfText(lot.label, cx, cy + 1, 1.5, 'LABELS', opts.labelColor);
    entities += dxfText(`${Math.round(lot.area)} m²`, cx, cy - 1, 1, 'LABELS', opts.labelColor);
  }

  // Draw roads
  if (roads) {
    for (const road of roads) {
      entities += dxfPolyline(road, 'ROADS', opts.roadColor, true);
    }
  }

  // Title block
  const allPoints = lots.flatMap(l => l.polygon);
  const maxY = Math.max(...allPoints.map(p => p[1]));
  const minX = Math.min(...allPoints.map(p => p[0]));
  entities += dxfText(`PROYECTO: ${opts.projectName}`, minX, maxY + 10, 2, 'LABELS', opts.labelColor);
  entities += dxfText(`ESCALA 1:${opts.scale}`, minX, maxY + 6, 1.5, 'LABELS', opts.labelColor);
  entities += dxfText(`TOTAL LOTES: ${lots.length}`, minX, maxY + 3, 1.2, 'LABELS', opts.labelColor);

  entities += `0
ENDSEC
`;

  return dxfHeader() + dxfTables() + entities + `0
EOF
`;
}

/**
 * Download DXF file
 */
export function downloadDxf(
  lots: DxfLot[],
  fileName: string,
  roads?: [number, number][][],
  options?: Partial<DxfExportOptions>
): void {
  const dxfContent = generateDxf(lots, roads, options);
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.dxf`;
  link.click();
  URL.revokeObjectURL(url);
}
