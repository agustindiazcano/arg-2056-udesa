import { AI_PYRAMID_TITLE, ENCLAVE_TITLE, FORECAST_LIMITS_TITLE, PEERS_TITLE, SHOCKS_TITLE } from './slideTitles.js';

export interface DraftTopic {
  heading: string;
  text: string;
}

export interface DraftSlideDef {
  id: number;
  title: string;
  lead: string;
  topics: readonly DraftTopic[];
}

/** The slides after the 9th: the themes the team listed in `PENDING.md`, as outlines; the team decides the content of each one. */
export const DRAFT_SLIDES: readonly DraftSlideDef[] = [
  {
    id: 22,
    title: SHOCKS_TITLE,
    lead: 'Qué pasó en otros lugares cuando la tecnología y el comercio cambiaron las reglas',
    topics: [
      { heading: 'General Electric y la doctrina Welch', text: 'Desarme de conglomerados industriales, financierización y traslado de la producción a Asia para bajar costos.' },
      { heading: 'La caída de la URSS', text: 'La incorporación de economías antes cerradas al mercado global amplió la oferta de trabajo barato y cambió los salarios en el mundo.' },
      { heading: 'China en la OMC (2001)', text: 'El «shock chino»: desplazamiento de empleo manufacturero y estancamiento salarial local (Autor, Dorn y Hanson, AER 2013).' },
      { heading: 'Desindustrialización persistente', text: 'Regiones que nunca recuperaron el empleo industrial bien pago (el cinturón de óxido).' },
      { heading: 'Del trabajo industrial a los servicios', text: 'Los trabajadores desplazados no pasan fácil ni rápido a servicios de alta productividad: un anticipo de lo que podría pasar con la IA.' },
      { heading: 'Argentina y el Mercosur', text: 'Apertura regional y desplazamiento de escala industrial hacia Brasil.' }
    ]
  },
  {
    id: 23,
    title: ENCLAVE_TITLE,
    lead: 'La extracción de recursos usa mucho capital y poco trabajo',
    topics: [
      { heading: 'Economía de enclave', text: 'Si las empresas no reinvierten ni gastan los dividendos en el país, el efecto multiplicador local es bajo.' },
      { heading: 'Enfermedad holandesa', text: 'Divisas abundantes por exportar recursos encarecen la moneda y complican a los demás sectores.' },
      { heading: 'Qué mirar en Argentina', text: 'Litio, cobre, petróleo y gas del RIGI: cuánto del valor queda en el país y cuánto trabajo generan.' }
    ]
  },
  {
    id: 24,
    title: PEERS_TITLE,
    lead: 'Cuatro economías que combinan recursos con educación e instituciones',
    topics: [
      { heading: 'Noruega', text: 'Petróleo y gas con un fondo soberano de referencia mundial, alta educación y baja desigualdad.' },
      { heading: 'Australia', text: 'Potencia minera y energética (hierro, carbón, litio, GNL) con alta educación terciaria y exportación de servicios.' },
      { heading: 'Canadá', text: 'Energía, minerales críticos y agroforestal con educación de primer nivel y polos tecnológicos.' },
      { heading: 'Chile', text: 'Referente regional en cobre y litio, con regla fiscal y fondos de estabilización.' },
      { heading: 'Qué comparar', text: 'Reservas sobre producción y exportaciones, complejidad exportadora, valor agregado por habitante y cómo se captura y reinvierte la renta.' }
    ]
  },
  {
    id: 25,
    title: FORECAST_LIMITS_TITLE,
    lead: 'Los datos del pasado no alcanzan para anticipar las olas tecnológicas y políticas',
    topics: [
      { heading: 'Pronósticos que fallaron', text: 'Analistas e instituciones descartaron cripto, Tesla o SpaceX en sus primeros años; las consultoras políticas fallaron con los outsiders.' },
      { heading: 'La IA generativa en 2021 y hoy', text: 'Casi sin atención en la política y las empresas en 2021, y foco universal hoy.' },
      { heading: 'Ambigüedad y emoción', text: 'Medirlas hace falta pero no alcanza: las narrativas rotan más rápido que los datos.' }
    ]
  },
  {
    id: 26,
    title: AI_PYRAMID_TITLE,
    lead: 'De la consulta gratuita al agente que trabaja solo',
    topics: [
      { heading: 'Base: chats gratuitos', text: 'Enorme cantidad de consultas, poco cómputo por consulta.' },
      { heading: 'Medio: APIs y asistentes de código', text: 'Integración de desarrolladores, editores y modelos ajustados a un dominio.' },
      { heading: 'Cima: razonamiento y agentes', text: 'Razonamiento extendido, bucles de agentes e investigación profunda: pocas consultas, el mayor gasto de tokens.' },
      { heading: 'Consumo global de tokens', text: 'Volumen por proveedor y peso de la programación frente al texto general.' }
    ]
  }
];
