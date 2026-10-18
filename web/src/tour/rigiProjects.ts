/**
 * Proyectos de minería, petróleo, gas, GNL y energía renovable aprobados o en evaluación bajo el RIGI (Régimen de Incentivo para Grandes Inversiones, Ley 27.742, Dec. 749/2024).
 * Contrastados contra resoluciones del Boletín Oficial y el registro oficial de la Secretaría de Coordinación de Producción / Ministerio de Economía.
 * Los montos representan compromisos de inversión comprometidos y planificados en millones de USD.
 */
export interface RigiProject {
  name: string;
  company: string;
  province: string;
  /** "Minería" o "Petróleo y gas" */
  sector: 'Minería' | 'Petróleo y gas';
  /** El mineral o tipo de obra / instalación */
  kind: string;
  investment: number | null;
  status: 'aprobado' | 'en evaluación';
  resolution?: string;
  /** IDs de `REFERENCES` */
  refs: string[];
  note: string;
}

export const RIGI_MINING: readonly RigiProject[] = [
  {
    name: 'Vicuña',
    company: 'BHP y Lundin Mining',
    province: 'San Juan',
    sector: 'Minería',
    kind: 'Cobre, oro y plata',
    investment: 9737,
    status: 'aprobado',
    refs: ['R1', 'R3', 'R14'],
    note: 'Megaproyecto binario/integrado de escala mundial (Josemaría y Filo del Sol); adhesión al RIGI confirmada por el consorcio internacional'
  },
  {
    name: 'Alumbrera-Agua Rica (MARA)',
    company: 'Glencore',
    province: 'Catamarca',
    sector: 'Minería',
    kind: 'Cobre, oro, plata y molibdeno',
    investment: 4000,
    status: 'aprobado',
    refs: ['R1', 'R14'],
    note: 'Reutilización integral de la planta e infraestructura de Minera Alumbrera para procesar mineral de Agua Rica; 200.000 t/año de cobre'
  },
  {
    name: 'Rincón',
    company: 'Rio Tinto (Rincon Mining)',
    province: 'Salta',
    sector: 'Minería',
    kind: 'Litio',
    investment: 2744,
    status: 'aprobado',
    refs: ['R1', 'R2', 'R3', 'R14'],
    note: 'Planta comercial de extracción directa y carbonato de litio grado batería en el Salar del Rincón; capacidad nominal de 60.000 t/año'
  },
  {
    name: 'Los Azules',
    company: 'McEwen Copper (McEwen Mining y Stellantis)',
    province: 'San Juan',
    sector: 'Minería',
    kind: 'Cobre',
    investment: 2672,
    status: 'aprobado',
    refs: ['R1', 'R2', 'R14'],
    note: 'Yacimiento de cobre en Calingasta con proceso de lixiviación en pilas y producción de cátodos de cobre de alta pureza (LME Grado A)'
  },
  {
    name: 'Cauchari-Olaroz (ampliación)',
    company: 'Minera Exar (Ganfeng Lithium y Lithium Americas)',
    province: 'Jujuy',
    sector: 'Minería',
    kind: 'Litio',
    investment: 1241,
    status: 'aprobado',
    refs: ['R1', 'R4', 'R14'],
    note: 'Ampliación de capacidad de producción de carbonato de litio en el Salar de Olaroz-Cauchari a más de 40.000 t/año'
  },
  {
    name: 'PSJ Cobre Mendocino',
    company: 'Minera San Jorge (Solway Investment Group)',
    province: 'Mendoza',
    sector: 'Minería',
    kind: 'Cobre (oro como subproducto)',
    investment: 891,
    status: 'aprobado',
    refs: ['R1', 'R3', 'R4', 'R14'],
    note: 'Proyecto de flotación de concentrado de cobre ubicado en Uspallata, adaptado a la normativa ambiental provincial (Ley 7722)'
  },
  {
    name: 'Diablillos',
    company: 'AbraSilver Resource Corp.',
    province: 'Salta y Catamarca',
    sector: 'Minería',
    kind: 'Oro y plata',
    investment: 764,
    status: 'aprobado',
    refs: ['R1', 'R5', 'R14'],
    note: 'Yacimiento epitermal de alta sulfuración en la Puna; inversión de desarrollo de mina a cielo abierto y planta de procesamiento'
  },
  {
    name: 'Tres Quebradas (3Q)',
    company: 'Liex S.A. (Zijin Mining)',
    province: 'Catamarca',
    sector: 'Minería',
    kind: 'Litio',
    investment: 710,
    status: 'aprobado',
    refs: ['R1', 'R14'],
    note: 'Proyecto de salmuera de litio de alta ley en Fiambalá; puesta en marcha de planta comercial y ampliación de pozos de evaporación'
  },
  {
    name: 'Gualcamayo (carbonatos profundos)',
    company: 'Minas Argentinas (Eris LLC)',
    province: 'San Juan',
    sector: 'Minería',
    kind: 'Oro y plata',
    investment: 665,
    status: 'aprobado',
    refs: ['R1', 'R2', 'R14'],
    note: 'Extensión de vida útil de la mina subterránea en Jáchal mediante flotación y tostación de minerales sulfurados y carbonatados'
  },
  {
    name: 'Sal de Oro II',
    company: 'POSCO Argentina',
    province: 'Salta y Catamarca',
    sector: 'Minería',
    kind: 'Litio',
    investment: 547,
    status: 'aprobado',
    refs: ['R1', 'R14'],
    note: 'Segunda etapa en el Salar del Hombre Muerto para producción de hidróxido de litio en el parque industrial de General Güemes (Salta)'
  },
  {
    name: 'Fénix (ampliación fase 1B)',
    company: 'Arcadium Lithium (Rio Tinto)',
    province: 'Catamarca',
    sector: 'Minería',
    kind: 'Potasio y litio',
    investment: 531,
    status: 'aprobado',
    refs: ['R1', 'R14'],
    note: 'Ampliación de capacidad productiva de carbonato y cloruro de litio en el Salar del Hombre Muerto'
  },
  {
    name: 'Veladero (fases 8 y 9)',
    company: 'Minera Argentina Gold (Barrick y Shandong Gold)',
    province: 'San Juan',
    sector: 'Minería',
    kind: 'Oro',
    investment: 436,
    status: 'aprobado',
    refs: ['R1', 'R5', 'R14'],
    note: 'Desarrollo de nuevas fases de lixiviación en valle y perforaciones de expansión de reservas en la cordillera sanjuanina'
  },
  {
    name: 'Hombre Muerto Oeste (HMW)',
    company: 'Galan Lithium',
    province: 'Catamarca',
    sector: 'Minería',
    kind: 'Litio',
    investment: 292,
    status: 'aprobado',
    refs: ['R1', 'R2', 'R14'],
    note: 'Producción de concentrado de cloruro de litio de alta pureza (6% Li) en el margen oeste del Salar del Hombre Muerto'
  },
  {
    name: 'Pachón',
    company: 'Glencore',
    province: 'San Juan',
    sector: 'Minería',
    kind: 'Cobre',
    investment: 9533,
    status: 'en evaluación',
    refs: ['R2', 'R14'],
    note: 'Uno de los depósitos de pórfido de cobre más grandes sin desarrollar del mundo, ubicado en Calingasta a 3.600 msnm'
  },
  {
    name: 'Sal de Vida',
    company: 'Arcadium Lithium (Rio Tinto)',
    province: 'Catamarca',
    sector: 'Minería',
    kind: 'Litio',
    investment: 818,
    status: 'en evaluación',
    refs: ['R2', 'R14'],
    note: 'Proyecto de salmuera de litio en la cuenca del Salar del Hombre Muerto; diseño inicial de 15.000 t/año de carbonato de litio'
  },
  {
    name: 'Taca Taca',
    company: 'First Quantum (Corriente Argentina S.A.)',
    province: 'Salta',
    sector: 'Minería',
    kind: 'Cobre',
    investment: 4232,
    status: 'en evaluación',
    refs: ['R9', 'E11', 'R14'],
    note: 'Capex inicial del informe técnico NI 43-101 de enero de 2026 (First Quantum, 2026-02-19): 4.232 M USD; con ampliación a 60 Mtpa asciende a 5.250 M USD'
  },
  {
    name: 'Arenas de Cercanías',
    company: 'Minera del Mojotoro y Minera Orosmayo',
    province: 'Río Negro',
    sector: 'Minería',
    kind: 'Arena para fractura (frac sand)',
    investment: 232,
    status: 'en evaluación',
    refs: ['R2', 'R14'],
    note: 'Extracción y procesamiento de arenas silíceas en Río Negro para abastecer las etapas de fractura hidráulica de Vaca Muerta'
  }
];

export const RIGI_OIL_GAS: readonly RigiProject[] = [
  {
    name: 'Argentina LNG (licuefacción en el golfo San Matías)',
    company: 'Southern Energy (PAE y Golar LNG)',
    province: 'Río Negro',
    sector: 'Petróleo y gas',
    kind: 'GNL, exportación',
    investment: 6878,
    status: 'aprobado',
    refs: ['R2', 'R3', 'R14'],
    note: 'Instalación de buque flotante de licuefacción (FLNG Hilli Episeyo) y posterior segunda unidad en el Golfo San Matías; escala total prevista de hasta 15.000 M USD'
  },
  {
    name: 'Oleoducto Vaca Muerta Sur (VMOS)',
    company: 'Consorcio VMOS (YPF, PAE, Vista, Pampa, Pluspetrol, Chevron y Shell)',
    province: 'Neuquén y Río Negro',
    sector: 'Petróleo y gas',
    kind: 'Oleoducto de 437 km (Allen a Punta Colorada)',
    investment: 2900,
    status: 'aprobado',
    refs: ['R2', 'R3', 'R6', 'R14'],
    note: 'Ducto dedicado con capacidad de transporte de hasta 700.000 barriles diarios y terminal marítima de aguas profundas con monoboyas en Punta Colorada'
  },
  {
    name: 'Gasoducto dedicado a San Matías',
    company: 'Southern Energy',
    province: 'Río Negro',
    sector: 'Petróleo y gas',
    kind: 'Gasoducto de 27 a 30 millones de m³ por día',
    investment: 1300,
    status: 'aprobado',
    refs: ['R3', 'R7', 'R14'],
    note: 'Infraestructura de transporte troncal de gas natural para vincular los bloques de Vaca Muerta con la planta flotante de GNL en la costa rionegrina'
  },
  {
    name: 'Los Toldos II Este',
    company: 'Tecpetrol',
    province: 'Neuquén',
    sector: 'Petróleo y gas',
    kind: 'Producción no convencional (Vaca Muerta)',
    investment: 6432,
    status: 'aprobado',
    resolution: 'Resolución 1771/2026',
    refs: ['R8', 'R13', 'R14'],
    note: 'Aprobado formalmente por Resolución 1771/2026 del Ministerio de Economía (B.O. 2026-10-09); plan de 380 pozos: 1.635 M USD (2024-2027), 1.268 M USD (2027-2029) y 3.529 M USD (2029-2054)'
  },
  {
    name: 'Bajo del Choique-La Invernada',
    company: 'Pluspetrol y GyP',
    province: 'Neuquén',
    sector: 'Petróleo y gas',
    kind: 'Producción no convencional (Vaca Muerta)',
    investment: 12400,
    status: 'aprobado',
    refs: ['R12', 'R14'],
    note: 'Desarrollo masivo de shale oil en el norte de Vaca Muerta; adhesión al RIGI anunciada formalmente (rango registrado: 12.240 a 12.400 M USD)'
  },
  {
    name: 'Rincón de Aranda',
    company: 'Pampa Energía',
    province: 'Neuquén',
    sector: 'Petróleo y gas',
    kind: 'Vaca Muerta: ductos y plantas de tratamiento',
    investment: 4521,
    status: 'aprobado',
    refs: ['R3', 'R14'],
    note: 'Desarrollo integral de bloque no convencional operado al 100% por Pampa Energía; oleoducto de evacuación y planta central de procesamiento (CPF)'
  },
  {
    name: 'Parques Solares y Renovables RIGI',
    company: 'YPF Luz y 360 Energy',
    province: 'San Juan y Catamarca',
    sector: 'Petróleo y gas',
    kind: 'Generación solar fotovoltaica para industria y minería',
    investment: 520,
    status: 'aprobado',
    refs: ['R14'],
    note: 'Proyectos de generación renovable formalmente aprobados bajo RIGI para suministrar energía limpia a yacimientos mineros y al SADI'
  },
  {
    name: 'Los Toldos (primera etapa)',
    company: 'Tecpetrol',
    province: 'Neuquén',
    sector: 'Petróleo y gas',
    kind: 'Infraestructura de hidrocarburos',
    investment: 1006,
    status: 'en evaluación',
    refs: ['R2', 'R14'],
    note: 'Etapa temprana de facilidades de producción en Vaca Muerta; integrada al plan global aprobado bajo Los Toldos II Este'
  },
  {
    name: 'LNG del Plata',
    company: 'Camuzzi',
    province: 'Buenos Aires',
    sector: 'Petróleo y gas',
    kind: 'GNL',
    investment: null,
    status: 'en evaluación',
    refs: ['R2', 'R14'],
    note: 'Proyecto para licuefacción y logística de gas en Bahía Blanca con solicitud de estabilidad fiscal RIGI'
  },
  {
    name: 'LLL Oil',
    company: 'YPF',
    province: 'Neuquén',
    sector: 'Petróleo y gas',
    kind: 'Exportación de crudo: 1.152 pozos, 240.000 bbl/d desde 2032',
    investment: 25000,
    status: 'en evaluación',
    refs: ['R10', 'R14'],
    note: 'Megaproyecto no convencional de YPF en bloques centrales de Vaca Muerta, con destino al oleoducto VMOS'
  },
  {
    name: 'GNL integrado de YPF, ENI y XRG',
    company: 'YPF, ENI y XRG',
    province: 'Río Negro',
    sector: 'Petróleo y gas',
    kind: 'GNL y gasoductos dedicados',
    investment: null,
    status: 'en evaluación',
    refs: ['R3', 'R14'],
    note: 'Esquema integrado de exportación de GNL mediante consorcio internacional'
  }
];
