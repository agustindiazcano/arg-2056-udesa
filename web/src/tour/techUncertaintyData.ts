/**
 * @file techUncertaintyData.ts
 * Audited empirical datasets for technology diffusion lags, AI inference costs,
 * training compute scaling, and macroeconomic forecast revisions (Slide 8).
 *
 * Sources:
 * - Comin & Hobijn (CHAT dataset / NBER) & Our World in Data (Technology Adoption)
 * - Stanford HAI (AI Index Report 2024 / 2025) & Artificial Analysis
 * - Epoch AI (Compute Trends Across Three Eras of Machine Learning)
 * - IMF World Economic Outlook (WEO) historical database & BCRA REM
 */

export interface DiffusionLag {
  technology: string;
  category: 'Física / Red' | 'Digital / Software' | 'Inteligencia Artificial';
  inventionYear: number;
  yearsToMassAdoption: number; // Years to achieve widespread penetration (>50% households or 50M users)
  description: string;
  source: string;
}

export interface InferenceCostPoint {
  period: string;
  year: number;
  model: string;
  costPerMillionTokensUsd: number; // USD per 1M tokens (standardized or MMLU-equivalent)
  benchmark: string;
  source: string;
}

export interface TrainingComputePoint {
  model: string;
  year: number;
  flopScientific: string;
  flopExponent: number; // log10(FLOPs)
  era: 'Pre-Deep Learning' | 'Deep Learning' | 'Large-Scale';
  hardware: string;
  source: string;
}

export interface ForecastRevisionPoint {
  targetYear: number;
  imfWEOForecastGrowth: number; // 1-year ahead projection (%)
  actualObservedGrowth: number; // INDEC actual real GDP growth (%)
  absoluteError: number; // |forecast - actual| in percentage points
}

export interface AdverseChannelDetail {
  title: string;
  empiricalMechanism: string;
  historicalPrecedent: string;
  mitigationFactor: string;
}

/** Historical Technology Diffusion Lags (CHAT dataset, Comin & Hobijn / Our World in Data) */
export const HISTORICAL_DIFFUSION_LAGS: readonly DiffusionLag[] = [
  {
    technology: 'Electricidad residencial',
    category: 'Física / Red',
    inventionYear: 1879,
    yearsToMassAdoption: 46,
    description: 'Requirió tendido masivo de redes de alta tensión, centrales y adaptación fabril/doméstica.',
    source: 'Comin & Hobijn (CHAT / NBER) · Our World in Data'
  },
  {
    technology: 'Telefonía fija',
    category: 'Física / Red',
    inventionYear: 1876,
    yearsToMassAdoption: 50,
    description: 'Despliegue de cableado transcontinental e interconexiones físicas entre centrales locales.',
    source: 'Comin & Hobijn (CHAT / NBER) · Our World in Data'
  },
  {
    technology: 'Automóvil',
    category: 'Física / Red',
    inventionYear: 1886,
    yearsToMassAdoption: 40,
    description: 'Llegó a la escala tras la línea de montaje de Ford (1908) y pavimentación de rutas.',
    source: 'Comin & Hobijn (CHAT / NBER)'
  },
  {
    technology: 'Computadora personal',
    category: 'Digital / Software',
    inventionYear: 1975,
    yearsToMassAdoption: 18,
    description: 'Adopción acelerada por la estandarización de IBM PC y sistemas operativos gráficos.',
    source: 'Our World in Data · World Bank'
  },
  {
    technology: 'Internet / World Wide Web',
    category: 'Digital / Software',
    inventionYear: 1991,
    yearsToMassAdoption: 7,
    description: 'Efectos de red exponenciales sobre infraestructura de telecomunicaciones preexistente.',
    source: 'Our World in Data · ITU'
  },
  {
    technology: 'Teléfonos inteligentes',
    category: 'Digital / Software',
    inventionYear: 2007,
    yearsToMassAdoption: 10,
    description: 'Distribución global sobre redes móviles 3G/4G y tiendas de aplicaciones abiertas.',
    source: 'Pew Research · Our World in Data'
  },
  {
    technology: 'IA Generativa (adopción usuarios)',
    category: 'Inteligencia Artificial',
    inventionYear: 2022,
    yearsToMassAdoption: 1,
    description: 'ChatGPT alcanzó 100M de usuarios activos en 2 meses; difusión de consumo inmediata.',
    source: 'Stanford HAI (AI Index 2024)'
  },
  {
    technology: 'IA en procesos productivos core',
    category: 'Inteligencia Artificial',
    inventionYear: 2023,
    yearsToMassAdoption: 8,
    description: 'Rezago por rediseño de procesos, integración ERP, seguridad jurídica y reentrenamiento laboral.',
    source: 'Brynjolfsson & Hitt (Productivity J-Curve) · Acemoglu (2024)'
  }
];

/** Deflation in Inference Costs for Frontier & Standardized Models (Stanford HAI AI Index 2024/2025) */
export const INFERENCE_COST_SERIES: readonly InferenceCostPoint[] = [
  {
    period: 'Nov 2022',
    year: 2022.9,
    model: 'text-davinci-003',
    costPerMillionTokensUsd: 20.0,
    benchmark: 'GPT-3.5 equivalent benchmark (MMLU ~65%)',
    source: 'Stanford HAI AI Index 2025'
  },
  {
    period: 'Mar 2023',
    year: 2023.2,
    model: 'gpt-3.5-turbo (v1)',
    costPerMillionTokensUsd: 2.0,
    benchmark: 'GPT-3.5 equivalent benchmark',
    source: 'Stanford HAI AI Index 2025'
  },
  {
    period: 'Nov 2023',
    year: 2023.9,
    model: 'gpt-3.5-turbo (v2)',
    costPerMillionTokensUsd: 1.0,
    benchmark: 'GPT-3.5 equivalent benchmark',
    source: 'Stanford HAI AI Index 2025'
  },
  {
    period: 'Jun 2024',
    year: 2024.5,
    model: 'gpt-4o-mini',
    costPerMillionTokensUsd: 0.15,
    benchmark: 'Supera GPT-3.5 en MMLU (82.0%)',
    source: 'Artificial Analysis / Stanford HAI'
  },
  {
    period: 'Oct 2024',
    year: 2024.8,
    model: 'Gemini 1.5 Flash-8B',
    costPerMillionTokensUsd: 0.07,
    benchmark: 'GPT-3.5 equivalent benchmark (~280x reducción desde 2022)',
    source: 'Stanford HAI AI Index 2025'
  },
  {
    period: '2025 (Ref)',
    year: 2025.2,
    model: 'Modelos destilados frontera',
    costPerMillionTokensUsd: 0.04,
    benchmark: 'Inferencia optimizada en hardware especializado',
    source: 'Stanford HAI / Artificial Analysis'
  }
];

/** Exponential Growth in Training Compute (FLOPs) - Epoch AI Database */
export const TRAINING_COMPUTE_SERIES: readonly TrainingComputePoint[] = [
  {
    model: 'Perceptron Mark I',
    year: 1958,
    flopScientific: '7.0e8',
    flopExponent: 8.8,
    era: 'Pre-Deep Learning',
    hardware: 'Custom Analog / IBM 704',
    source: 'Epoch AI'
  },
  {
    model: 'Deep Blue',
    year: 1997,
    flopScientific: '2.0e13',
    flopExponent: 13.3,
    era: 'Pre-Deep Learning',
    hardware: 'RS/6000 SP + ASICs',
    source: 'Epoch AI'
  },
  {
    model: 'AlexNet',
    year: 2012,
    flopScientific: '1.4e17',
    flopExponent: 17.1,
    era: 'Deep Learning',
    hardware: '2x NVIDIA GeForce GTX 580',
    source: 'Epoch AI'
  },
  {
    model: 'Transformer original',
    year: 2017,
    flopScientific: '2.3e19',
    flopExponent: 19.4,
    era: 'Large-Scale',
    hardware: '8x NVIDIA P100 GPUs',
    source: 'Epoch AI'
  },
  {
    model: 'GPT-3 (175B)',
    year: 2020,
    flopScientific: '3.1e23',
    flopExponent: 23.5,
    era: 'Large-Scale',
    hardware: '10.000x NVIDIA V100 GPUs',
    source: 'Epoch AI'
  },
  {
    model: 'GPT-4 (Frontier)',
    year: 2023,
    flopScientific: '2.1e25',
    flopExponent: 25.3,
    era: 'Large-Scale',
    hardware: '~25.000x NVIDIA A100 GPUs',
    source: 'Epoch AI'
  },
  {
    model: 'Gemini 1.0 Ultra',
    year: 2023,
    flopScientific: '5.0e25',
    flopExponent: 25.7,
    era: 'Large-Scale',
    hardware: 'Google TPU v4 & v5e Pods',
    source: 'Epoch AI / Google DeepMind'
  }
];

/** Historical Macroeconomic Forecast Error: IMF WEO 1-year ahead vs Actual GDP in Argentina */
export const MACRO_FORECAST_REVISION_DATA: readonly ForecastRevisionPoint[] = [
  { targetYear: 2018, imfWEOForecastGrowth: 2.5, actualObservedGrowth: -2.6, absoluteError: 5.1 },
  { targetYear: 2019, imfWEOForecastGrowth: 1.6, actualObservedGrowth: -2.0, absoluteError: 3.6 },
  { targetYear: 2020, imfWEOForecastGrowth: -1.3, actualObservedGrowth: -9.9, absoluteError: 8.6 },
  { targetYear: 2021, imfWEOForecastGrowth: 4.9, actualObservedGrowth: 10.7, absoluteError: 5.8 },
  { targetYear: 2022, imfWEOForecastGrowth: 2.5, actualObservedGrowth: 5.0, absoluteError: 2.5 },
  { targetYear: 2023, imfWEOForecastGrowth: 2.0, actualObservedGrowth: -1.6, absoluteError: 3.6 },
  { targetYear: 2024, imfWEOForecastGrowth: -2.8, actualObservedGrowth: -3.5, absoluteError: 0.7 }
];

/** Empirical Channels of the Adverse Scenario (Acemoglu 2024 / Brynjolfsson) */
export const ADVERSE_CHANNELS: Record<string, AdverseChannelDetail> = {
  Productividad: {
    title: 'Productividad agregada vs. Curva J de adopción',
    empiricalMechanism: 'El gasto masivo en software e infraestructura no genera mejoras inmediatas de PBT mientras las empresas reconfiguran modelos de negocio.',
    historicalPrecedent: 'Paradoja de Solow (1987): "Vemos computadoras en todos lados menos en las estadísticas de productividad".',
    mitigationFactor: 'Desarrollo de capacidades organizacionales y simplificación regulatoria.'
  },
  Empleo: {
    title: 'Automatización sesgada y sustitución de tareas',
    empiricalMechanism: 'Sustitución de empleo administrativo y operativo calificado sin creación sincrónica de nuevos sectores de absorción laboral.',
    historicalPrecedent: 'Revolución industrial temprana: mecanización textil y desplazamiento de hiladores antes de la expansión de servicios.',
    mitigationFactor: 'Políticas de reconversión activa y formación técnica continua.'
  },
  'Salarios reales': {
    title: 'Apropiación de rentas tecnológicas y participación laboral',
    empiricalMechanism: 'Si las ganancias de productividad son absorbidas mayormente por el capital tecnológico concentrado, la participación del salario en el PBI disminuye.',
    historicalPrecedent: 'Evolución salarial en EE.UU. 1980-2015: desacoplamiento entre productividad por hora y salario mediano.',
    mitigationFactor: 'Competencia en mercados digitales y descentralización del acceso a cómputo.'
  },
  'PBI por habitante': {
    title: 'Brecha distributiva y divergencia regional',
    empiricalMechanism: 'Beneficios concentrados en centros urbanos altamente conectados y sectores intensivos en capital, ensanchando la asimetría provincial.',
    historicalPrecedent: 'Divergencia centro-periferia en la adopción temprana de la electrificación rural e industrial.',
    mitigationFactor: 'Inversión en conectividad física, fibra óptica y energía en el interior.'
  }
};
