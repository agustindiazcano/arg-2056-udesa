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
