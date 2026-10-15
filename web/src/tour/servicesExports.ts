/**
 * Argentine services exports of 2025, million USD, from "Análisis del comercio de servicios de la Argentina 2026" (CEI, Cancillería,
 * June 2026), which is based on the INDEC balance of payments. Read from the PDF on 2026-10-15. The press often mixes two things:
 * all services (18,039) and the knowledge-based services (SBC, narrow definition: 9,563, 53.0 % of the services).
 */
export const SERVICES_EXPORTS_2025 = {
  total: 18039,
  categories: [
    { name: 'Otros servicios empresariales', value: 6450 },
    { name: 'Viajes', value: 4852 },
    { name: 'Telecomunicaciones, informática e información', value: 2825 },
    { name: 'Transporte', value: 2447 }
  ]
} as const;

export const SBC_EXPORTS_2025 = {
  total: 9563,
  rows: [
    { name: 'Servicios informáticos', value: 2651 },
    { name: 'Servicios jurídicos, contables, consultoría de gerencia, gerenciales y de relaciones públicas', value: 2581 },
    { name: 'Otros servicios empresariales', value: 1916 },
    { name: 'Servicios de investigación y desarrollo', value: 838 },
    { name: 'Servicios personales, culturales y recreativos', value: 475 },
    { name: 'Servicios de publicidad, investigación de mercado y encuestas de opinión pública', value: 453 },
    { name: 'Cargos por el uso de la propiedad intelectual n.i.o.p.', value: 340 },
    { name: 'Servicios arquitectónicos, de ingeniería y otros servicios técnicos', value: 301 },
    { name: 'Servicios de tratamiento de residuos y descontaminación, agrícolas y mineros', value: 8 }
  ]
} as const;
