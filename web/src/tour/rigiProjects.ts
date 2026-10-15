/**
 * The mining, oil, gas and LNG projects approved (or asked for) under the RIGI (Régimen de Incentivo para Grandes Inversiones), as the press reported them
 * between February and October 2026. NOT verified against the Boletín Oficial or the Ministry of Economy: the sources disagree on amounts and counts
 * (see `docs/data-requests.md`, D23). The amounts are the announced investments in millions of USD.
 */
export interface RigiProject {
  name: string;
  company: string;
  province: string;
  /** "Minería" or "Petróleo y gas" */
  sector: 'Minería' | 'Petróleo y gas';
  /** the mineral, or the kind of works */
  kind: string;
  investment: number | null;
  status: 'aprobado' | 'en evaluación';
  /** ids of `REFERENCES` */
  refs: string[];
  note: string;
}

export const RIGI_MINING: readonly RigiProject[] = [
  { name: 'Vicuña', company: 'BHP y Lundin Mining', province: 'San Juan', sector: 'Minería', kind: 'Cobre, oro y plata', investment: 9737, status: 'aprobado', refs: ['R1', 'R3'], note: 'La Nación: 9.700; Shale24 lo da como pendiente (nota anterior)' },
  { name: 'Alumbrera-Agua Rica (MARA)', company: 'Glencore', province: 'Catamarca', sector: 'Minería', kind: 'Cobre, oro, plata y molibdeno', investment: 4000, status: 'aprobado', refs: ['R1'], note: '200.000 t de cobre por año; aprobado el 2026-10-02 según iProfesional; Shale24 da 3.806' },
  { name: 'Rincón', company: 'Rio Tinto', province: 'Salta', sector: 'Minería', kind: 'Litio', investment: 2744, status: 'aprobado', refs: ['R1', 'R2', 'R3'], note: '60.000 t de carbonato de litio por año (La Nación); otras notas dan 2.700 y 2.724' },
  { name: 'Los Azules', company: 'McEwen Copper', province: 'San Juan', sector: 'Minería', kind: 'Cobre', investment: 2672, status: 'aprobado', refs: ['R1', 'R2'], note: '' },
  { name: 'Cauchari-Olaroz (ampliación)', company: 'Exar (Ganfeng)', province: 'Jujuy', sector: 'Minería', kind: 'Litio', investment: 1241, status: 'aprobado', refs: ['R1', 'R4'], note: 'Aprobado en mayo de 2026 (Infobae)' },
  { name: 'PSJ Cobre Mendocino', company: 'Minera San Jorge', province: 'Mendoza', sector: 'Minería', kind: 'Cobre (oro como subproducto)', investment: 891, status: 'aprobado', refs: ['R1', 'R3', 'R4'], note: 'Aprobado en mayo de 2026 (Infobae)' },
  { name: 'Diablillos', company: 'AbraSilver', province: 'Salta y Catamarca', sector: 'Minería', kind: 'Oro y plata', investment: 764, status: 'aprobado', refs: ['R1', 'R5'], note: 'Infobae: 760; Shale24 lo da como pendiente con 500' },
  { name: 'Tres Quebradas (3Q)', company: 'Vinculada a Zijin Mining', province: 'Catamarca', sector: 'Minería', kind: 'Litio', investment: 710, status: 'aprobado', refs: ['R1'], note: '' },
  { name: 'Gualcamayo (carbonatos profundos)', company: 'Minas Argentinas', province: 'San Juan', sector: 'Minería', kind: 'Oro y plata', investment: 665, status: 'aprobado', refs: ['R1', 'R2'], note: 'Otras notas dan 655' },
  { name: 'Sal de Oro II', company: 'Posco Argentina', province: 'Salta y Catamarca', sector: 'Minería', kind: 'Litio', investment: 547, status: 'aprobado', refs: ['R1'], note: 'Shale24 da 633 (en evaluación)' },
  { name: 'Fénix (ampliación fase 1B)', company: 'Sin nombrar en la fuente', province: 'Catamarca', sector: 'Minería', kind: 'Potasio y litio', investment: 531, status: 'aprobado', refs: ['R1'], note: '' },
  { name: 'Veladero (fases 8 y 9)', company: 'Barrick y Shandong Gold', province: 'San Juan', sector: 'Minería', kind: 'Oro', investment: 436, status: 'aprobado', refs: ['R1', 'R5'], note: 'Infobae de febrero de 2026: 380' },
  { name: 'Hombre Muerto Oeste (HMW)', company: 'Galán Lithium', province: 'Catamarca', sector: 'Minería', kind: 'Litio', investment: 292, status: 'aprobado', refs: ['R1', 'R2'], note: 'Otras notas dan 217 (cloruro de litio de alta pureza)' },
  { name: 'Pachón', company: 'Glencore', province: 'San Juan', sector: 'Minería', kind: 'Cobre', investment: 9533, status: 'en evaluación', refs: ['R2'], note: 'Shale24' },
  { name: 'Sal de Vida', company: 'Rio Tinto', province: 'Catamarca', sector: 'Minería', kind: 'Litio', investment: 818, status: 'en evaluación', refs: ['R2'], note: 'Shale24' },
  { name: 'Taca Taca', company: 'First Quantum', province: 'Salta', sector: 'Minería', kind: 'Cobre', investment: 4232, status: 'en evaluación', refs: ['R9'], note: 'Capex inicial del informe NI 43-101 de enero de 2026 (First Quantum, 2026-02-19): 4.232; con la ampliación a 60 Mtpa, 5.250. Antes figuraba 3.583 (LM Neuquén, desactualizado). Sin pedido de RIGI en lo leído' },
  { name: 'Arenas de Cercanías', company: 'Minera del Mojotoro y Minera Orosmayo', province: 'Río Negro', sector: 'Minería', kind: 'Arena para fractura (frac sand)', investment: 232, status: 'en evaluación', refs: ['R2'], note: 'Shale24' }
];

export const RIGI_OIL_GAS: readonly RigiProject[] = [
  { name: 'Argentina LNG (licuefacción en el golfo San Matías)', company: 'Southern Energy (PAE y Golar)', province: 'Río Negro', sector: 'Petróleo y gas', kind: 'GNL, exportación', investment: 6878, status: 'aprobado', refs: ['R2', 'R3'], note: 'La Nación da 15.156 (dos unidades flotantes)' },
  { name: 'Oleoducto Vaca Muerta Sur (VMOS)', company: 'YPF, PAE, Vista, Pampa, Pluspetrol, Chevron y Shell', province: 'Neuquén y Río Negro', sector: 'Petróleo y gas', kind: 'Oleoducto de 437 km (Allen a Punta Colorada)', investment: 2900, status: 'aprobado', refs: ['R2', 'R3', 'R6'], note: 'Otras notas dan 2.486, 2.500 y 2.720; con 51 % de avance de obra' },
  { name: 'Gasoducto dedicado a San Matías', company: 'Southern Energy', province: 'Río Negro', sector: 'Petróleo y gas', kind: 'Gasoducto de 27 millones de m³ por día', investment: 1300, status: 'aprobado', refs: ['R3', 'R7'], note: '' },
  { name: 'Los Toldos II Este', company: 'Tecpetrol', province: 'Neuquén', sector: 'Petróleo y gas', kind: 'Producción no convencional (Vaca Muerta)', investment: 6432, status: 'aprobado', refs: ['R8'], note: 'Resolución 1771/2026, publicada el 2026-10-09' },
  { name: 'Bajo del Choique-La Invernada', company: 'Pluspetrol y GyP', province: 'Neuquén', sector: 'Petróleo y gas', kind: 'Producción no convencional (Vaca Muerta)', investment: 12400, status: 'aprobado', refs: ['R12'], note: 'Anunciado en París (Chequeado, 2026-10-02): 12.240 en el resumen y 12.400 en el texto, no cuadra; falta la resolución' },
  { name: 'Rincón de Aranda', company: 'Pampa Energía', province: 'Neuquén', sector: 'Petróleo y gas', kind: 'Vaca Muerta: ductos y plantas de tratamiento', investment: 4521, status: 'aprobado', refs: ['R3'], note: 'La Nación: 4.521; Shale24: 295 (otra etapa)' },
  { name: 'Los Toldos (primera etapa)', company: 'Tecpetrol', province: 'Neuquén', sector: 'Petróleo y gas', kind: 'Infraestructura de hidrocarburos', investment: 1006, status: 'en evaluación', refs: ['R2'], note: 'Shale24; probablemente absorbida por Los Toldos II Este' },
  { name: 'LNG del Plata', company: 'Camuzzi', province: 'Buenos Aires', sector: 'Petróleo y gas', kind: 'GNL', investment: null, status: 'en evaluación', refs: ['R2'], note: 'Pedido de estabilidad fiscal a presentar' },
  { name: 'LLL Oil', company: 'YPF', province: 'Neuquén', sector: 'Petróleo y gas', kind: 'Exportación de crudo: 1.152 pozos, 240.000 barriles por día desde 2032, en los bloques de La Angostura', investment: 25000, status: 'en evaluación', refs: ['R10'], note: 'YPF pidió adherir al RIGI en mayo de 2026; decisión final de inversión en la segunda mitad de 2026; sale por el VMOS' },
  { name: 'La Angostura Sur I (inversión de 2026)', company: 'YPF', province: 'Neuquén', sector: 'Petróleo y gas', kind: 'Desarrollo de Vaca Muerta', investment: 1117, status: 'en evaluación', refs: ['R11'], note: 'No es un proyecto RIGI: es el mayor compromiso de inversión de 2026 en Vaca Muerta' },
  { name: 'GNL integrado de YPF, ENI y XRG', company: 'YPF, ENI y XRG', province: 'Río Negro', sector: 'Petróleo y gas', kind: 'GNL', investment: null, status: 'en evaluación', refs: ['R3'], note: 'Mencionado por La Nación; sin monto en lo leído' }
];
