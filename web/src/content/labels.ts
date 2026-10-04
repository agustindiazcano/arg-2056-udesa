const RESOURCE_LABEL: Record<string, string> = {
  lithium: 'Litio',
  copper: 'Cobre',
  gold: 'Oro',
  silver: 'Plata',
  oil: 'Petróleo',
  gas: 'Gas',
  soy: 'Soja',
  wheat: 'Trigo',
  corn: 'Maíz',
  other: 'Otros'
};

const PROJECT_STATUS_LABEL: Record<string, string> = {
  operating: 'En operación',
  ramp_up: 'En puesta en marcha',
  construction: 'En construcción',
  approved: 'Aprobado',
  feasibility: 'En factibilidad',
  prefeasibility: 'En prefactibilidad',
  exploration: 'En exploración',
  announced: 'Anunciado'
};

/** The Spanish name of a resource id; an id with no name comes back unchanged. */
export function resourceLabel(id: string): string {
  return RESOURCE_LABEL[id] ?? id;
}

/** The Spanish name of a project status; a status with no name comes back unchanged. */
export function projectStatusLabel(status: string): string {
  return PROJECT_STATUS_LABEL[status] ?? status;
}

const SCENARIO_LABEL: Record<string, string> = {
  pessimistic: 'Pesimista',
  expected: 'Esperado',
  optimistic: 'Optimista'
};

const INDICATOR_LABEL: Record<string, string> = {
  gdp_constant_usd: 'PIB',
  gdp_per_capita_usd: 'PIB per cápita',
  population: 'Población',
  hdi: 'IDH',
  exports_usd: 'Exportaciones',
  imports_usd: 'Importaciones',
  resource_production: 'Producción de recursos'
};

/** The name of a scenario, as the control bar spells it. */
export function scenarioLabel(id: string): string {
  return SCENARIO_LABEL[id] ?? id;
}

/** The Spanish name of an indicator; an id with no name comes back unchanged. */
export function indicatorLabel(id: string): string {
  return INDICATOR_LABEL[id] ?? id;
}

/** A label in the middle of a sentence: "Población" -> "población", but an acronym ("PIB") stays as it is. */
function inSentence(label: string): string {
  const second = label.charAt(1);
  return second !== '' && second === second.toUpperCase() && second !== second.toLowerCase()
    ? label
    : label.charAt(0).toLowerCase() + label.slice(1);
}

/** An indicator (and its resource) for the middle of a sentence: "producción de recursos (oro)". */
export function indicatorSentence(id: string, resource?: string): string {
  const base = inSentence(indicatorLabel(id));
  return resource ? `${base} (${inSentence(resourceLabel(resource))})` : base;
}
