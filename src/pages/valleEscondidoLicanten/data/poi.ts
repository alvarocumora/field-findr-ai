// Puntos de interés del entorno de Valle Escondido Licantén.
// Distancias y tiempos son aproximados por camino, en base a las rutas
// públicas (Ruta J-60 / J-80). Sirven de referencia comercial.

export interface VelPoi {
  key: string;
  name: string;
  kind: 'pueblo' | 'lago' | 'playa' | 'ciudad' | 'servicio';
  lng: number;
  lat: number;
  distanceKm: number;
  driveMin: number;
  note: string;
}

export const VEL_POIS: VelPoi[] = [
  {
    key: 'licanten',
    name: 'Licantén (centro)',
    kind: 'pueblo',
    lng: -72.0064,
    lat: -34.9805,
    distanceKm: 5,
    driveMin: 8,
    note: 'Supermercado, bancos, colegios, consultorio y Municipalidad.',
  },
  {
    key: 'vichuquen',
    name: 'Lago Vichuquén',
    kind: 'lago',
    lng: -72.07,
    lat: -34.833,
    distanceKm: 28,
    driveMin: 30,
    note: 'Deportes náuticos, clubes y bosque de pinos.',
  },
  {
    key: 'iloca',
    name: 'Iloca · playa',
    kind: 'playa',
    lng: -72.1833,
    lat: -34.9333,
    distanceKm: 26,
    driveMin: 30,
    note: 'Balneario costero con caleta y restaurantes.',
  },
  {
    key: 'duao',
    name: 'Duao · caleta',
    kind: 'playa',
    lng: -72.1833,
    lat: -34.9,
    distanceKm: 29,
    driveMin: 33,
    note: 'Caleta de pescadores y productos del mar.',
  },
  {
    key: 'hualane',
    name: 'Hualañé',
    kind: 'pueblo',
    lng: -71.8,
    lat: -34.975,
    distanceKm: 18,
    driveMin: 20,
    note: 'Comercio, ferretería, combustible y servicios.',
  },
  {
    key: 'curico',
    name: 'Curicó',
    kind: 'ciudad',
    lng: -71.2394,
    lat: -34.9828,
    distanceKm: 78,
    driveMin: 70,
    note: 'Hospital, universidades, mall y acceso a Ruta 5.',
  },
  {
    key: 'santiago',
    name: 'Santiago',
    kind: 'ciudad',
    lng: -70.6483,
    lat: -33.4489,
    distanceKm: 265,
    driveMin: 200,
    note: 'Por Ruta 5 Sur y Ruta J-60.',
  },
];
