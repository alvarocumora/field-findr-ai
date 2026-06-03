import { PARTIDAS } from '../src/pages/forestal/data/usoFondos';
import { writeFileSync } from 'fs';
writeFileSync('/tmp/uso_fondos.json', JSON.stringify(PARTIDAS, null, 2));
console.log('wrote', PARTIDAS.length, 'partidas,', PARTIDAS.reduce((s,p)=>s+p.items.length,0), 'items');
