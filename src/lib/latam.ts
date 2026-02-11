// LATAM Multi-Country Configuration

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currencies: { code: string; label: string; symbol: string }[];
  defaultCurrency: string;
  regions: string[];
  taxIdLabel: string; // ROL, CUIT, RUC, NIT, RFC
  taxIdPlaceholder: string;
}

export const LATAM_COUNTRIES: CountryConfig[] = [
  {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    currencies: [
      { code: 'CLP', label: 'Peso Chileno', symbol: '$' },
      { code: 'UF', label: 'UF', symbol: 'UF' },
      { code: 'USD', label: 'Dólar', symbol: 'US$' },
    ],
    defaultCurrency: 'CLP',
    taxIdLabel: 'ROL SII',
    taxIdPlaceholder: 'Ej: 1234-5678',
    regions: [
      'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
      'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
      'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
    ],
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    currencies: [
      { code: 'ARS', label: 'Peso Argentino', symbol: '$' },
      { code: 'USD', label: 'Dólar', symbol: 'US$' },
    ],
    defaultCurrency: 'USD',
    taxIdLabel: 'CUIT',
    taxIdPlaceholder: 'Ej: 20-12345678-9',
    regions: [
      'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
      'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
      'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
      'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
      'Tierra del Fuego', 'Tucumán',
    ],
  },
  {
    code: 'PE',
    name: 'Perú',
    flag: '🇵🇪',
    currencies: [
      { code: 'PEN', label: 'Sol Peruano', symbol: 'S/' },
      { code: 'USD', label: 'Dólar', symbol: 'US$' },
    ],
    defaultCurrency: 'PEN',
    taxIdLabel: 'Partida Registral',
    taxIdPlaceholder: 'Ej: 12345678',
    regions: [
      'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca',
      'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín',
      'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios',
      'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna',
      'Tumbes', 'Ucayali',
    ],
  },
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    currencies: [
      { code: 'COP', label: 'Peso Colombiano', symbol: '$' },
      { code: 'USD', label: 'Dólar', symbol: 'US$' },
    ],
    defaultCurrency: 'COP',
    taxIdLabel: 'Matrícula Inmobiliaria',
    taxIdPlaceholder: 'Ej: 050-123456',
    regions: [
      'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.',
      'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca',
      'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare',
      'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
      'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
      'San Andrés', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
      'Vaupés', 'Vichada',
    ],
  },
  {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    currencies: [
      { code: 'MXN', label: 'Peso Mexicano', symbol: '$' },
      { code: 'USD', label: 'Dólar', symbol: 'US$' },
    ],
    defaultCurrency: 'MXN',
    taxIdLabel: 'Folio Real',
    taxIdPlaceholder: 'Ej: 12345',
    regions: [
      'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
      'Chiapas', 'Chihuahua', 'CDMX', 'Coahuila', 'Colima', 'Durango',
      'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Estado de México',
      'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
      'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
      'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
    ],
  },
];

export const getCountryConfig = (countryCode: string): CountryConfig => {
  return LATAM_COUNTRIES.find(c => c.code === countryCode) || LATAM_COUNTRIES[0];
};

export const getCountryByName = (name: string): CountryConfig => {
  return LATAM_COUNTRIES.find(c => c.name === name) || LATAM_COUNTRIES[0];
};

export const getAllCurrencies = () => {
  const seen = new Set<string>();
  const currencies: { code: string; label: string; symbol: string }[] = [];
  LATAM_COUNTRIES.forEach(c => {
    c.currencies.forEach(cur => {
      if (!seen.has(cur.code)) {
        seen.add(cur.code);
        currencies.push(cur);
      }
    });
  });
  return currencies;
};

export const formatPriceLatam = (price: number, currency: string): string => {
  const formats: Record<string, { locale: string; maximumFractionDigits: number }> = {
    CLP: { locale: 'es-CL', maximumFractionDigits: 0 },
    UF: { locale: 'es-CL', maximumFractionDigits: 2 },
    USD: { locale: 'en-US', maximumFractionDigits: 0 },
    ARS: { locale: 'es-AR', maximumFractionDigits: 0 },
    PEN: { locale: 'es-PE', maximumFractionDigits: 0 },
    COP: { locale: 'es-CO', maximumFractionDigits: 0 },
    MXN: { locale: 'es-MX', maximumFractionDigits: 0 },
  };

  const fmt = formats[currency] || formats.USD;
  const allCurrencies = getAllCurrencies();
  const currencyInfo = allCurrencies.find(c => c.code === currency);
  const symbol = currencyInfo?.symbol || '$';

  if (currency === 'UF') {
    return `UF ${price.toLocaleString(fmt.locale, { maximumFractionDigits: fmt.maximumFractionDigits })}`;
  }

  return `${symbol}${price.toLocaleString(fmt.locale, { maximumFractionDigits: fmt.maximumFractionDigits })} ${currency}`;
};

// Get all regions across all countries (for global search)
export const getAllRegions = (): { region: string; country: string; flag: string }[] => {
  return LATAM_COUNTRIES.flatMap(c =>
    c.regions.map(r => ({ region: r, country: c.name, flag: c.flag }))
  );
};
